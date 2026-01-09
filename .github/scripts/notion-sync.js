const { Client } = require("@notionhq/client");

// 환경 변수 로드
const token = process.env.NOTION_TOKEN;
const eventName = process.env.GH_EVENT_NAME;
const eventData = JSON.parse(process.env.GH_EVENT_DATA);

// 노션 클라이언트 초기화
const notion = new Client({ auth: token });

// 사용자 매핑 (GitHub ID : Notion ID)
const USER_MAP = {
  "a9018": "6e041390-607a-4290-82f7-9cc0a1c45461" 
};

async function findPage(dbId, num) {
  // 사진 속 '# 번호' 속성 이름과 정확히 일치해야 함
  const res = await notion.databases.query({
    database_id: dbId,
    filter: { property: "번호", number: { equals: num } }
  });
  return res.results[0];
}

function getPersonProperty(githubUser) {
  if (!githubUser || !USER_MAP[githubUser.login]) return [];
  return [{ id: USER_MAP[githubUser.login] }];
}

async function syncIssue() {
  const issue = eventData.issue;
  const dbId = process.env.NOTION_ISSUE_DB_ID;
  const page = await findPage(dbId, issue.number);

  const props = {
    "제목": { title: [{ text: { content: issue.title } }] },
    "번호": { number: issue.number },
    "라벨": { multi_select: issue.labels.map(l => ({ name: l.name })) },
    "담당자": { people: getPersonProperty(issue.assignee || issue.user) },
    "URL": { url: issue.html_url }
  };

  if (page) {
    await notion.pages.update({ page_id: page.id, properties: props });
    console.log(`이슈 #${issue.number} 업데이트 성공`);
  } else {
    await notion.pages.create({ parent: { database_id: dbId }, properties: props });
    console.log(`이슈 #${issue.number} 생성 성공`);
  }
}

async function syncPR() {
  const pr = eventData.pull_request;
  const dbId = process.env.NOTION_PR_DB_ID;
  const page = await findPage(dbId, pr.number);

  const props = {
    "이름": { title: [{ text: { content: pr.title } }] },
    "번호": { number: pr.number },
    "담당자": { people: getPersonProperty(pr.user) },
    "URL": { url: pr.html_url },
    "날짜": { date: { start: pr.created_at } }
  };

  if (page) {
    await notion.pages.update({ page_id: page.id, properties: props });
    console.log(`PR #${pr.number} 업데이트 성공`);
  } else {
    await notion.pages.create({ parent: { database_id: dbId }, properties: props });
    console.log(`PR #${pr.number} 생성 성공`);
  }
}

async function run() {
  try {
    if (eventName === "issues") await syncIssue();
    else if (eventName === "pull_request") await syncPR();
  } catch (error) {
    // 여기서 출력되는 에러 메시지가 가장 중요합니다.
    console.error("동기화 에러 발생 상세 내역:");
    console.error(error.body || error);
    process.exit(1);
  }
}

run();
