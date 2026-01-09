const { Client } = require("@notionhq/client");

const token = process.env.NOTION_TOKEN;
const eventName = process.env.GH_EVENT_NAME;
const eventData = JSON.parse(process.env.GH_EVENT_DATA);

const notion = new Client({ auth: token });

const USER_MAP = {
  "SoexDobin": "6e041390-607a-4290-82f7-9cc0a1c45461" 
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

  // 1. 이슈 종료 시 아카이브 처리
  if (issue.state === "closed") {
    if (page) {
      await notion.pages.update({ page_id: page.id, archived: true });
      console.log(`이슈 #${issue.number} 아카이브 완료.`);
    }
    return;
  }

  // 2. 라벨 매핑 로직 수정
  // Set을 사용하여 "ETC"가 여러 개 생기는 것을 방지합니다.
  const labelNames = issue.labels.map(l => {
    if (l.name === "enhancement") return "Feature";
    if (l.name === "bug") return "Bug";
    if (l.name === "chore") return "Fix";
    if (l.name === "fix") return "Chore";
    return "ETC";
  });
  
  const mappedLabels = [...new Set(labelNames)].map(name => ({ name }));

  const props = {
    "제목": { title: [{ text: { content: issue.title } }] },
    "번호": { number: issue.number },
    "라벨": { multi_select: mappedLabels }, // 수정된 매핑 적용
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

  if (pr.state === "closed") {
    if (page) {
      await notion.pages.update({ page_id: page.id, archived: true });
      console.log(`PR #${pr.number} 아카이브 완료.`);
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
    if (!notion || !notion.databases || typeof notion.databases.query !== 'function') {
      throw new Error("노션 SDK 로드 실패: SDK 버전을 확인하세요.");
    }
    
    if (eventName === "issues") await syncIssue();
    else if (eventName === "pull_request") await syncPR();
    console.log("동기화 작업이 완료되었습니다.");
  } catch (error) {
    console.error("에러 발생:", error.message || error);
    process.exit(1);
  }
}

run();
