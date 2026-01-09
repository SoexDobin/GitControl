const { Client } = require("@notionhq/client");

if (!process.env.NOTION_TOKEN) {
  console.error("에러: NOTION_TOKEN(NOTION_API_KEY)이 설정되지 않았습니다.");
  process.exit(1);
}

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const eventName = process.env.GH_EVENT_NAME;
const eventData = JSON.parse(process.env.GH_EVENT_DATA);

// 사용자 매핑 테이블
const USER_MAP = {
  "a9018": "6e041390-607a-4290-82f7-9cc0a1c45461" 
};

async function run() {
  try {
    if (eventName === "issues") await syncIssue();
    else if (eventName === "pull_request") await syncPR();
  } catch (error) {
    // 인증 실패 등 상세 에러 메시지 출력
    console.error("노션 API 에러 상세:", error.body || error.message);
    process.exit(1);
  }
}

function getPersonProperty(githubUser) {
  if (!githubUser || !USER_MAP[githubUser.login]) return [];
  return [{ id: USER_MAP[githubUser.login] }];
}

async function findPage(dbId, num) {
  const res = await notion.databases.query({
    database_id: dbId,
    filter: { property: "번호", number: { equals: num } }
  });
  return res.results[0];
}

async function syncIssue() {
  const issue = eventData.issue;
  const dbId = process.env.NOTION_ISSUE_DB_ID;
  const page = await findPage(dbId, issue.number);

  const props = {
    "제목": { title: [{ text: { content: issue.title } }] },
    "번호": { number: issue.number }, // 검색을 위해 필수 저장
    "라벨": { multi_select: issue.labels.map(l => ({ name: l.name })) },
    "상태": { select: { name: issue.state === "open" ? "진행 중" : "완료" } },
    "담당자": { people: getPersonProperty(issue.assignee) },
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
    "제목": { title: [{ text: { content: pr.title } }] },
    "번호": { number: pr.number }, // 검색을 위해 필수 저장
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

run();
