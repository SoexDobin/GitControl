const { Client } = require("@notionhq/client");

const token = process.env.NOTION_TOKEN;
const eventName = process.env.GH_EVENT_NAME;
const eventData = JSON.parse(process.env.GH_EVENT_DATA);

// 노션 클라이언트 인스턴스 생성
const notion = new Client({ auth: token });

// 사용자 ID 매핑 (GitHub ID : Notion User ID)
const USER_MAP = {
  "a9018": "6e041390-607a-4290-82f7-9cc0a1c45461" 
};

/**
 * 기존 페이지 찾기 함수
 */
async function findPage(dbId, num) {
  const response = await notion.databases.query({
    database_id: dbId,
    filter: { 
      property: "번호", // # 없이 '번호'만 사용
      number: { equals: num } 
    }
  });
  return response.results[0];
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
  } else {
    await notion.pages.create({ parent: { database_id: dbId }, properties: props });
  }
}

async function syncPR() {
  const pr = eventData.pull_request;
  const dbId = process.env.NOTION_PR_DB_ID;
  const page = await findPage(dbId, pr.number);

  const props = {
    "이름": { title: [{ text: { content: pr.title } }] }, // PR 시트 제목 필드는 '이름'
    "번호": { number: pr.number },
    "담당자": { people: getPersonProperty(pr.user) },
    "URL": { url: pr.html_url },
    "날짜": { date: { start: pr.created_at } }
  };

  if (page) {
    await notion.pages.update({ page_id: page.id, properties: props });
  } else {
    await notion.pages.create({ parent: { database_id: dbId }, properties: props });
  }
}

async function run() {
  try {
    // notion.databases 객체 존재 여부 확인 (TypeError 방지)
    if (!notion || !notion.databases || typeof notion.databases.query !== 'function') {
      throw new Error("노션 SDK 로드 실패: databases.query 함수를 찾을 수 없습니다.");
    }
    
    if (eventName === "issues") await syncIssue();
    else if (eventName === "pull_request") await syncPR();
    console.log("동기화 작업이 완료되었습니다.");
  } catch (error) {
    console.error("동기화 에러 상세 사유:");
    console.error(error.body || error.message || error);
    process.exit(1);
  }
}

run();
