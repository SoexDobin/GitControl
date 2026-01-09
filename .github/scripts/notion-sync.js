const { Client } = require("@notionhq/client");

const token = process.env.NOTION_TOKEN;
const eventName = process.env.GH_EVENT_NAME;
const eventData = JSON.parse(process.env.GH_EVENT_DATA);

const notion = new Client({ auth: token });

const USER_MAP = {
  "a9018": "6e041390-607a-4290-82f7-9cc0a1c45461" 
};

async function findPage(dbId, num) {
  const response = await notion.databases.query({
    database_id: dbId,
    filter: { 
      property: "번호",
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

  // 1. 이슈가 닫혔을 때 (closed) 노션 페이지 삭제(아카이브) 처리
  if (issue.state === "closed") {
    if (page) {
      await notion.pages.update({
        page_id: page.id,
        archived: true // 아카이브 처리하면 노션 보기에서 사라집니다.
      });
      console.log(`이슈 #${issue.number}가 닫혀 노션 페이지를 아카이브했습니다.`);
    }
    return;
  }

  // 2. 라벨 매핑: enhancement -> Feature 변환
  const mappedLabels = issue.labels.map(l => ({
    name: l.name === "enhancement" ? "Feature" : l.name
  }));

  const props = {
    "제목": { title: [{ text: { content: issue.title } }] },
    "번호": { number: issue.number },
    "라벨": { multi_select: mappedLabels },
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

  // PR도 닫혔을 때 삭제하고 싶다면 동일하게 처리 가능합니다.
  if (pr.state === "closed") {
    if (page) {
      await notion.pages.update({ page_id: page.id, archived: true });
      console.log(`PR #${pr.number}가 닫혀 노션 페이지를 아카이브했습니다.`);
    }
    return;
  }

  const props = {
    "이름": { title: [{ text: { content: pr.title } }] },
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
    // 이전 답변에서 확인한 대로, SDK 버전을 2.2.15로 고정했다면 이 체크 로직은 정상 작동합니다.
    if (!notion || !notion.databases || typeof notion.databases.query !== 'function') {
      throw new Error("노션 SDK 로드 실패: databases.query 함수를 찾을 수 없습니다. SDK 버전을 확인하세요.");
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
