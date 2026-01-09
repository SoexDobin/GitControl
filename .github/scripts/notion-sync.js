// 1. 라이브러리 로드 방식을 더 안전하게 변경
const { Client } = require("@notionhq/client");

// 2. 환경 변수 체크
if (!process.env.NOTION_TOKEN) {
  console.error("에러: NOTION_TOKEN이 설정되지 않았습니다.");
  process.exit(1);
}

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const eventName = process.env.GH_EVENT_NAME;
const eventData = JSON.parse(process.env.GH_EVENT_DATA);

// 유저 매핑 테이블 (본인의 ID로 수정하세요)
const USER_MAP = {
  "a9018": "6e041390-607a-4290-82f7-9cc0a1c45461" 
};

async function run() {
  try {
    // notion 객체가 정상인지 확인하는 디버깅 코드
    if (!notion.databases || typeof notion.databases.query !== 'function') {
      throw new Error("노션 클라이언트 초기화 실패: databases.query 함수를 찾을 수 없습니다.");
    }

    if (eventName === "issues") await syncIssue();
    else if (eventName === "pull_request") await syncPR();
  } catch (error) {
    console.error("동기화 에러 발생:", error.message);
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

// ... 나머지 syncIssue, syncPR 함수는 이전과 동일하게 유지 ...
// (단, findPage 함수 호출 시 에러가 나지 않도록 위로 올렸습니다.)

async function syncIssue() {
  const issue = eventData.issue;
  const dbId = process.env.NOTION_ISSUE_DB_ID;
  const page = await findPage(dbId, issue.number);
  const props = {
    "제목": { title: [{ text: { content: issue.title } }] },
    "번호": { number: issue.number },
    "라벨": { multi_select: issue.labels.map(l => ({ name: l.name })) },
    "상태": { select: { name: issue.state === "open" ? "진행 중" : "완료" } },
    "담당자": { people: getPersonProperty(issue.assignee) },
    "URL": { url: issue.html_url }
  };
  page ? await notion.pages.update({ page_id: page.id, properties: props })
       : await notion.pages.create({ parent: { database_id: dbId }, properties: props });
}

async function syncPR() {
  const pr = eventData.pull_request;
  const dbId = process.env.NOTION_PR_DB_ID;
  const page = await findPage(dbId, pr.number);
  const props = {
    "제목": { title: [{ text: { content: pr.title } }] },
    "번호": { number: pr.number },
    "담당자": { people: getPersonProperty(pr.user) },
    "URL": { url: pr.html_url },
    "날짜": { date: { start: pr.created_at } }
  };
  page ? await notion.pages.update({ page_id: page.id, properties: props })
       : await notion.pages.create({ parent: { database_id: dbId }, properties: props });
}

run();
