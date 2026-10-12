// End-to-end harness for the Garrison JavaScript/TypeScript SDK.
// Usage: node test-harness.mjs [baseUrl] [accessKey] [secretKey]   (run "npm run build" first)
import { GarrisonClient, GarrisonError } from "./dist/esm/index.js";

const [baseUrl = "http://127.0.0.1:8700", accessKey = "access_garrison_default", secretKey = "secret_garrison_default_change_me"] = process.argv.slice(2);
const suffix = Math.random().toString(16).slice(2, 10);
const client = new GarrisonClient(baseUrl);
const state = {};
let passed = 0;
const failures = [];

function require(condition, message) { if (!condition) throw new Error(message); }

async function check(name, fn) {
  const started = Date.now();
  try {
    await fn();
    passed++;
    console.log(`PASS  ${name} (${Date.now() - started}ms)`);
  } catch (e) {
    failures.push(`${name}: ${e.message}`);
    console.log(`FAIL  ${name}: ${e.message}`);
  }
}

console.log(`Garrison JavaScript SDK harness against ${baseUrl}`);

await check("health", async () => require((await client.health()).status === "healthy", "not healthy"));
await check("token auth", async () => {
  let issued;
  try {
    issued = await client.loginWithKeys(accessKey, secretKey);
  } catch (e) {
    if (e instanceof GarrisonError && (e.statusCode === 401 || e.statusCode === 403)) state.authFailed = e.statusCode;
    throw e;
  }
  require(issued.token, "no token");
  state.tenant = issued.tenantId;
  require((await client.tokenDetails()).principalType === "Credential", "unexpected principal");
});
if (state.authFailed) {
  console.log(`\nAuthentication failed (HTTP ${state.authFailed}): the server rejected access key ${accessKey}. ` +
    "The remaining checks need a signed-in client, so the harness stops here. Pass this server's keys as arguments: " +
    "node test-harness.mjs <baseUrl> <accessKey> <secretKey>. Docker Compose and source builds default to " +
    "access_garrison_default and secret_garrison_default_change_me; on Kubernetes read default-access-key and " +
    "default-secret-key from Secret garrison-secrets (see README, \"Where the credentials come from\").");
  process.exit(1);
}
await check("signed request auth", async () => {
  const signed = new GarrisonClient(baseUrl);
  signed.useSignedRequests(accessKey, secretKey, state.tenant ?? "default");
  require((await signed.agents.list({ maxResults: 5 })).success, "list failed");
});
await check("builtin harness profiles", async () => {
  const fake = (await client.harnessProfiles.builtin()).find((p) => p.name === "builtin/fake");
  require(fake, "builtin/fake not found");
  state.fake = fake.id;
});
await check("create agent and deployment", async () => {
  const agent = await client.agents.create({ name: `sdk-js-${suffix}`, description: "JavaScript SDK harness scratch agent." });
  state.agent = agent.id;
  const deployment = await client.deployments.create({ name: `sdk-js-${suffix}-fake`, agentId: agent.id, harnessProfileId: state.fake });
  state.deployment = deployment.id;
});
await check("invoke with wait", async () => {
  const run = await client.agents.invoke(state.agent, "Hello from the JavaScript SDK", { wait: true, waitSeconds: 90 });
  require(run.status === "Succeeded", `status ${run.status} ${run.errorMessage ?? ""}`);
  require((run.resultText ?? "").startsWith("Echo:"), `result ${run.resultText}`);
  state.run = run;
});
await check("run timing fields", async () => {
  const run = state.run;
  require(run, "no finished run");
  require(typeof run.timeToFirstTokenMs === "number" && run.timeToFirstTokenMs >= 0, `timeToFirstTokenMs ${run.timeToFirstTokenMs}`);
  require(typeof run.executionMs === "number" && run.executionMs >= 0, `executionMs ${run.executionMs}`);
  require((run.toolCallCount ?? 0) >= 0, `toolCallCount ${run.toolCallCount}`);
});
await check("run trace id", async () => {
  const run = state.run;
  require(run, "no finished run");
  require(typeof run.traceId === "string" && /^[0-9a-f]{32}$/.test(run.traceId), `traceId ${run.traceId}`);
});
await check("stream events", async () => {
  const run = await client.runs.create({ input: "Stream this please", agentId: state.agent });
  let events = 0;
  let final;
  for await (const item of client.runs.stream(run.id)) {
    if (item.event) events++;
    if (item.run) final = item.run;
  }
  require(final, "no run.completed");
  require(final.status === "Succeeded", `status ${final.status}`);
  require(events > 0, "no events");
});
await check("cancel run", async () => {
  const run = await client.runs.create({ input: "Cancel me", agentId: state.agent });
  try { await client.runs.cancel(run.id); } catch (e) { if (!(e instanceof GarrisonError) || e.statusCode !== 409) throw e; }
  const final = await client.runs.waitForCompletion(run.id, 60000);
  require(["Cancelled", "Succeeded"].includes(final.status), `status ${final.status}`);
});
await check("manifest dry run", async () => {
  const yaml = `apiVersion: garrison/v1\nkind: Agent\nmetadata:\n  name: sdk-js-manifest-${suffix}\nspec:\n  description: Dry run only.\n`;
  const result = await client.manifests.apply(yaml, { dryRun: true });
  require(result.dryRun, "not a dry run");
  require(result.failedCount === 0, `failed ${result.failedCount}`);
});
await check("list runs by agent", async () => {
  const page = await client.runs.list({ agentId: state.agent });
  require(page.totalRecords >= 3, `total ${page.totalRecords}`);
  require(page.objects.every((r) => r.agentId === state.agent), "foreign runs");
});
await check("run analytics", async () => {
  const now = Date.now();
  const result = await client.analytics.runs({ from: new Date(now - 3600000), to: new Date(now + 60000), interval: "minute" });
  require(result.totals.runs >= 1, `totals.runs ${result.totals.runs}`);
  require(result.series.length >= 1, "no series");
  for (const series of result.series) {
    require(series.buckets.length > 0, `series ${series.key} has no buckets`);
    require(series.buckets.every((b) => b.startUtc), `series ${series.key} bucket without startUtc`);
  }
});
await check("run analytics by harness", async () => {
  const now = Date.now();
  const result = await client.analytics.runs({ from: new Date(now - 3600000), to: new Date(now + 60000), interval: "auto", groupBy: "harness" });
  require(result.series.length >= 1, "no series");
});
await check("run analytics by harness and model", async () => {
  const now = Date.now();
  const result = await client.analytics.runs({ from: new Date(now - 3600000), to: new Date(now + 60000), groupBy: "harnessModel" });
  require(result.series.length >= 1, "no series");
  for (const series of result.series) {
    require(series.key.includes("|"), `series key ${series.key}`);
    require(series.label.includes(" / "), `series label ${series.label}`);
  }
});
await check("run analytics dimensions", async () => {
  const now = Date.now();
  const dims = await client.analytics.dimensions({ from: new Date(now - 3600000), to: new Date(now + 60000) });
  const model = state.run?.servedModel || "unknown";
  require(dims.agents.some((a) => a.id === state.agent), "scratch agent missing from dimensions");
  require(dims.deployments.some((d) => d.id === state.deployment && d.agentId === state.agent), "scratch deployment missing from dimensions");
  require(dims.harnesses.length >= 1, "no harnesses");
  require(dims.models.includes(model), `model ${model} missing from ${dims.models.join(",")}`);
  require(typeof dims.truncated === "boolean", "truncated is not a boolean");
});
await check("run analytics filtered by model", async () => {
  const now = Date.now();
  const model = state.run?.servedModel || "unknown";
  const range = { from: new Date(now - 3600000), to: new Date(now + 60000), agentId: state.agent };
  const matched = await client.analytics.runs({ ...range, model });
  require(matched.totals.runs >= 1, `model ${model} matched ${matched.totals.runs} runs`);
  const none = await client.analytics.runs({ ...range, model: "garrison-sdk-no-such-model" });
  require(none.totals.runs === 0, `unknown model matched ${none.totals.runs} runs`);
});
await check("run analytics rejects from >= to", async () => {
  const now = new Date();
  try {
    await client.analytics.runs({ from: now, to: now });
  } catch (e) {
    require(e instanceof GarrisonError && e.statusCode === 400, `unexpected error ${e.message}`);
    return;
  }
  throw new Error("expected 400");
});
await check("control nodes", async () => {
  const page = await client.controlNodes.list();
  require(page.respondingNodeId, "respondingNodeId empty");
  require(page.objects.some((n) => n.status === "Ready"), `no Ready control node among ${page.objects.length}`);
  const leaders = page.objects.filter((n) => n.isLeader).length;
  require(leaders === 1, `leaders ${leaders}`);
  const read = await client.controlNodes.get(page.objects[0].id);
  require(read.id === page.objects[0].id, `read id ${read.id}`);
  require(read.respondingNodeId === page.respondingNodeId, `read respondingNodeId ${read.respondingNodeId}`);
  const overview = await client.overview();
  require((overview.controlNodesByStatus || []).some((c) => c.status === "Ready" && c.count >= 1), "overview controlNodesByStatus");
  require(overview.leaderNodeId, "overview leaderNodeId empty");
});
async function expectStatus(status, fn) {
  try {
    await fn();
  } catch (e) {
    require(e instanceof GarrisonError && e.statusCode === status, `unexpected error ${e.message}, expected ${status}`);
    return;
  }
  throw new Error(`expected ${status}`);
}
await check("approvals list and read", async () => {
  const pending = await client.approvals.list({ status: "Pending", maxResults: 1 });
  require(pending.objects.every((a) => a.status === "Pending"), "non-pending approval in Pending list");
  require(pending.totalRecords >= pending.objects.length, `totalRecords ${pending.totalRecords}`);
  const scoped = await client.approvals.list({ deploymentId: state.deployment });
  require(scoped.objects.length === 0, `scratch deployment has ${scoped.objects.length} approvals`);
  await expectStatus(404, () => client.approvals.get(`apr_missing${suffix}`));
  await expectStatus(404, () => client.approvals.decide(`apr_missing${suffix}`, { decision: "Allow" }));
});
await check("approval rules and approval check", async () => {
  let deployment = await client.deployments.get(state.deployment);
  require(deployment.approvalsEnabled === false, `approvalsEnabled ${deployment.approvalsEnabled}`);
  require(deployment.approvalDefaultAction === "Ask", `approvalDefaultAction ${deployment.approvalDefaultAction}`);
  require(deployment.approvalTimeoutSeconds === 300, `approvalTimeoutSeconds ${deployment.approvalTimeoutSeconds}`);
  require(deployment.approvalTimeoutDecision === "Deny", `approvalTimeoutDecision ${deployment.approvalTimeoutDecision}`);
  deployment.approvalRules = [
    { action: "Allow", pattern: "Bash(git status:*)" },
    { action: "Deny", pattern: "Bash(rm:*)", description: "JavaScript SDK harness rule." },
  ];
  deployment.approvalDefaultAction = "Deny";
  deployment = await client.deployments.update(state.deployment, deployment);
  require(deployment.approvalRules.length === 2 && deployment.approvalRules.every((r) => r.id.startsWith("dar_")), `rules ${JSON.stringify(deployment.approvalRules)}`);
  const allowed = await client.approvals.check(state.deployment, { toolName: "Bash", input: { command: "git status --short" } });
  require(allowed.action === "Allow" && allowed.source === "Rule", `git status ${JSON.stringify(allowed)}`);
  require(allowed.rulePattern === "Bash(git status:*)", `rulePattern ${allowed.rulePattern}`);
  require(allowed.approvalsEnabled === false, "approvalsEnabled true on a fake deployment");
  const denied = await client.approvals.check(state.deployment, { toolName: "Bash", input: { command: "rm -rf build" } });
  require(denied.action === "Deny" && denied.source === "Rule", `rm ${JSON.stringify(denied)}`);
  const fallback = await client.approvals.check(state.deployment, { toolName: "Edit", input: { file_path: "src/app.ts" } });
  require(fallback.action === "Deny" && fallback.source === "Default", `edit ${JSON.stringify(fallback)}`);
  require(fallback.suggestedRule, "suggestedRule empty");
  deployment.approvalsEnabled = true;
  await expectStatus(400, () => client.deployments.update(state.deployment, deployment));
  const run = await client.runs.get(state.run.id);
  require(run.pendingApprovals === 0 && run.awaitingApproval === false, `run pendingApprovals ${run.pendingApprovals} awaitingApproval ${run.awaitingApproval}`);
});

await check("cleanup", async () => {
  if (state.deployment) await client.deployments.delete(state.deployment);
  if (state.agent) {
    // Single-resource deletes answer 204 No Content (G-7), which the SDK returns as undefined.
    const deleted = await client.agents.delete(state.agent);
    require(deleted === undefined, `agent delete returned a body: ${JSON.stringify(deleted)}`);
  }
});

console.log(`\nPassed: ${passed}  Failed: ${failures.length}`);
for (const f of failures) console.log(`  FAIL ${f}`);
process.exit(failures.length === 0 ? 0 : 1);
