const { Client } = require("@notionhq/client");

const token = process.env.NOTION_TOKEN;
const eventName = process.env.GH_EVENT_NAME;
const eventData = JSON.parse(process.env.GH_EVENT_DATA);
const USER_MAP = JSON.parse(process.env.USER_MAP || "{}");

const notion = new Client({ auth: token });
const dbId = process.env.NOTION_ISSUE_DB_ID;

async function findPage(num) {
  const response = await notion.databases.query({
    database_id: dbId,
    filter: { property: "번호", number: { equals: num } }
  });
  return response.results[0];
}

function getPersonProperty(githubUser) {
  if (!githubUser || !USER_MAP[githubUser.login]) return [];
  return [{ id: USER_MAP[githubUser.login] }];
}

async function syncIssue() {
  const issue = eventData.issue;
  const page = await findPage(issue.number);

  // 이슈 종료 시 아카이브
  if (issue.state === "closed") {
    if (page) await notion.pages.update({ page_id: page.id, archived: true });
    return;
  }

  const labels = issue.labels.map(l => l.name.toLowerCase());
  
  // 1. '구분' 결정 로직 (Feature, Bug, ETC 로만 분류)
  let category = "ETC"; // 기본값
  if (labels.includes("enhancement")) {
    category = "Feature";
  } else if (labels.includes("bug")) {
    category = "Bug";
  } else if (labels.includes("fix") || labels.includes("chore")) {
    category = "ETC";
  }

  // 2. 라벨 이름 매핑 (노션 Multi-select에 표시될 이름들)
  const mappedLabels = issue.labels.map(l => {
    const name = l.name.toLowerCase();
    if (name === "enhancement") return { name: "Feature" };
    if (name === "bug") return { name: "Bug" };
    if (name === "fix") return { name: "Fix" };
    if (name === "chore") return { name: "Chore" };
    return { name: l.name };
  });

  const props = {
    "제목": { title: [{ text: { content: issue.title } }] },
    "번호": { number: issue.number },
    "라벨": { multi_select: mappedLabels },
    "담당자": { people: getPersonProperty(issue.assignee || issue.user) },
    "URL": { url: issue.html_url },
    "구분": { select: { name: category } }
  };

  if (page) {
    await notion.pages.update({ page_id: page.id, properties: props });
  } else {
    await notion.pages.create({ parent: { database_id: dbId }, properties: props });
  }
}

// PR 동기화 (기본 유지)
async function syncPR() {
  const pr = eventData.pull_request;
  const prDbId = process.env.NOTION_PR_DB_ID;
  const response = await notion.databases.query({
    database_id: prDbId,
    filter: { property: "번호", number: { equals: pr.number } }
  });
  const page = response.results[0];

  if (pr.state === "closed") {
    if (page) await notion.pages.update({ page_id: page.id, archived: true });
    return;
  }

  const props = {
    "이름": { title: [{ text: { content: pr.title } }] },
    "번호": { number: pr.number },
    "담당자": { people: getPersonProperty(pr.user) },
    "URL": { url: pr.html_url },
    "날짜": { date: { start: pr.created_at } }
  };

  if (page) await notion.pages.update({ page_id: page.id, properties: props });
  else await notion.pages.create({ parent: { database_id: prDbId }, properties: props });
}

async function run() {
  try {
    if (eventName === "issues") await syncIssue();
    else if (eventName === "pull_request") await syncPR();
    console.log("동기화가 성공적으로 완료되었습니다.");
  } catch (error) {
    console.error("동기화 중 에러 발생:", error.message);
    process.exit(1);
  }
}

run();
