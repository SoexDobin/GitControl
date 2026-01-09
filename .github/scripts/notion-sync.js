const { Client } = require("@notionhq/client");
const notion = new Client({ auth: process.env.NOTION_TOKEN });
const eventName = process.env.GH_EVENT_NAME;
const eventData = JSON.parse(process.env.GH_EVENT_DATA);

// ─── 사용자 ID 매핑 (여기를 수정하세요) ───
const USER_MAP = {
  "GitHub_ID_1": "6e041390-607a-4290-82f7-9cc0a1c45461",
};

async function run() {
  try {
    if (eventName === "issues") await syncIssue();
    else if (eventName === "pull_request") await syncPR();
  } catch (error) {
    console.error("동기화 에러:", error);
    process.exit(1);
  }
}

// 담당자 정보를 노션 Person 형식으로 변환하는 함수
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
    "라벨": { multi_select: issue.labels.map(l => ({ name: l.name })) },
    "상태": { select: { name: issue.state === "open" ? "진행 중" : "완료" } },
    "담당자": { people: getPersonProperty(issue.assignee) }, // Person 속성 적용
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
    "담당자": { people: getPersonProperty(pr.user) }, // Person 속성 적용
    "URL": { url: pr.html_url },
    "날짜": { date: { start: pr.created_at } }
  };

  page ? await notion.pages.update({ page_id: page.id, properties: props })
       : await notion.pages.create({ parent: { database_id: dbId }, properties: props });
}

async function findPage(dbId, num) {
  const res = await notion.databases.query({
    database_id: dbId,
    filter: { property: "번호", number: { equals: num } }
  });
  return res.results[0];
}

run();
