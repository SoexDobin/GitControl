const { Client } = require("@notionhq/client");

// 1. 토큰 및 환경 변수 확인
const notionToken = process.env.NOTION_TOKEN;
if (!notionToken) {
  console.error("에러: NOTION_TOKEN(NOTION_API_KEY)이 설정되지 않았습니다.");
  process.exit(1);
}

// 2. 클라이언트 인스턴스 생성 (객체 구조 명시적 확인)
const notion = new Client({ auth: notionToken });

const eventName = process.env.GH_EVENT_NAME;
const eventData = JSON.parse(process.env.GH_EVENT_DATA);

// 사용자 ID 매핑 (GitHub ID : Notion User ID)
const USER_MAP = {
  "a9018": "6e041390-607a-4290-82f7-9cc0a1c45461" 
};

async function run() {
  try {
    // API 메서드 존재 여부 확인 (TypeError 방지용 디버깅)
    if (!notion.databases || typeof notion.databases.query !== 'function') {
      throw new Error("노션 SDK가 정상적으로 로드되지 않았습니다.");
    }

    if (eventName === "issues") await syncIssue();
    else if (eventName === "pull_request") await syncPR();
  } catch (error) {
    console.error("동기화 중 오류 발생:", error.body || error.message);
    process.exit(1);
  }
}

function getPersonProperty(githubUser) {
  if (!githubUser || !USER_MAP[githubUser.login]) return [];
  return [{ id: USER_MAP[githubUser.login] }];
}

async function findPage(dbId, num) {
  const response = await notion.databases.query({
    database_id: dbId,
    filter: { property: "번호", number: { equals: num } }
  });
  return response.results[0];
}

async function syncIssue() {
  const issue = eventData.issue;
  const dbId = process.env.NOTION_ISSUE_DB_ID;
  const page = await findPage(dbId, issue.number);
  
  // 담당자: 지정된 사람이 없으면 발신자로 대체
  const assignee = issue.assignee || issue.user;

  const props = {
    "제목": { title: [{ text: { content: issue.title } }] },
    "번호": { number: issue.number },
    "라벨": { multi_select: issue.labels.map(l => ({ name: l.name })) },
    "담당자": { people: getPersonProperty(assignee) },
    "URL": { url: issue.html_url }
  };

  if (page) {
    await notion.pages.update({ page_id: page.id, properties: props });
    console.log(`이슈 #${issue.number} 업데이트 완료`);
  } else {
    await notion.pages.create({ parent: { database_id: dbId }, properties: props });
    console.log(`이슈 #${issue.number} 생성 완료`);
  }
}

async function syncPR() {
  const pr = eventData.pull_request;
  const dbId = process.env.NOTION_PR_DB_ID;
  const page = await findPage(dbId, pr.number);

  const props = {
    "이름": { title: [{ text: { content: pr.title } }] }, // PR은 '이름' 컬럼 사용
    "번호": { number: pr.number },
    "담당자": { people: getPersonProperty(pr.user) },
    "URL": { url: pr.html_url },
    "날짜": { date: { start: pr.created_at } }
  };

  if (page) {
    await notion.pages.update({ page_id: page.id, properties: props });
    console.log(`PR #${pr.number} 업데이트 완료`);
  } else {
    await notion.pages.create({ parent: { database_id: dbId }, properties: props });
    console.log(`PR #${pr.number} 생성 완료`);
  }
}

run();
