// End-to-end harness for the Garrison JavaScript/TypeScript SDK.
// Usage: node test-harness.mjs [baseUrl] [accessKey] [secretKey]   (run "npm run build" first)
import { EFFECT_POLICIES, GarrisonClient, GarrisonError, TRUST_LEVELS } from "./dist/esm/index.js";

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
await check("model price CRUD", async () => {
  const price = await client.modelPrices.create({ name: `sdk-js-price-${suffix}`, model: `fixture-js-${suffix}`, harnessType: "Generic", inputUsdPerMillion: 0.5, outputUsdPerMillion: 2, cachedInputUsdPerMillion: null, reasoningUsdPerMillion: 0, inputIncludesCachedTokens: false, outputIncludesReasoningTokens: true });
  try {
    const saved = await client.modelPrices.get(price.id);
    require(saved.inputUsdPerMillion === 0.5 && saved.reasoningUsdPerMillion === 0 && !saved.inputIncludesCachedTokens, "price fields");
    require((await client.modelPrices.list({ search: price.name })).objects.some((p) => p.id === price.id), "price list");
    const updated = await client.modelPrices.update(price.id, { ...saved, outputUsdPerMillion: 3 });
    require(updated.outputUsdPerMillion === 3, "price update");
  } finally { await client.modelPrices.delete(price.id); }
});
await check("builtin harness profiles", async () => {
  const profiles = await client.harnessProfiles.builtin();
  require(profiles.some((p) => p.name === "builtin/provider-api" && p.harnessType === "ProviderApi" && p.outputParser === "ProviderApiJsonl"), "optional provider profile");
  const fake = profiles.find((p) => p.name === "builtin/fake");
  require(fake, "builtin/fake not found");
  state.fake = fake.id;
});
await check("create agent and deployment", async () => {
  const agent = await client.agents.create({ name: `sdk-js-${suffix}`, description: "JavaScript SDK harness scratch agent." });
  state.agent = agent.id;
  const deployment = await client.deployments.create({ name: `sdk-js-${suffix}-fake`, agentId: agent.id, harnessProfileId: state.fake });
  state.deployment = deployment.id;
});
await check("usage quota CRUD and meters", async () => {
  const quota = await client.usageQuotas.create({ name: `sdk-js-quota-${suffix}`, scope: "Agent", resourceId: state.agent, dailyRunLimit: 100, dailyCostUsdLimit: 0.125 });
  try {
    require(quota.enforcementEnabled === false && (await client.usageQuotas.get(quota.id)).dailyRunLimit === 100, "quota fields and default monitoring");
    const usage = await client.usageQuotas.usage(quota.id);
    require(usage.runsUsed === 0 && usage.costAccountingComplete && usage.windowEndUtc, "quota usage");
    const updated = await client.usageQuotas.update(quota.id, { ...quota, dailyRunLimit: null, enforcementEnabled: true });
    require(updated.dailyRunLimit == null && updated.enforcementEnabled, "explicit enforcement opt-in");
  } finally { await client.usageQuotas.delete(quota.id); }
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
await check("untrusted deployment queues without isolation", async () => {
  require(TRUST_LEVELS.join(",") === "Trusted,Untrusted", "trust constants");
  const trusted = await client.deployments.get(state.deployment);
  require(trusted.trustLevel === "Trusted", `default trustLevel ${trusted.trustLevel}`);
  const deployment = await client.deployments.create({ name: `sdk-js-${suffix}-untrusted`, agentId: state.agent, harnessProfileId: state.fake, trustLevel: "Untrusted", weight: 0 });
  try {
    require(deployment.trustLevel === "Untrusted", `trustLevel ${deployment.trustLevel}`);
    const run = await client.runs.create({ input: "Untrusted input", agentId: state.agent, deploymentId: deployment.id });
    const read = await client.runs.get(run.id);
    require(read.trustLevel === "Untrusted" && read.executor === "KubernetesJob", `run ${read.trustLevel} ${read.executor}`);
    require(read.status === "Queued" && read.blockedReason === "NoIsolatingWorker", `run ${read.status} ${read.blockedReason}`);
    await client.runs.cancel(run.id);
  } finally {
    await client.deployments.delete(deployment.id);
  }
});
await check("effect policy default, update, and conflict", async () => {
  require(EFFECT_POLICIES.join(",") === "AtMostOnce,AtLeastOnce,Journaled", "effect policy constants");
  const deployment = await client.deployments.create({ name: `sdk-js-${suffix}-effect`, agentId: state.agent, harnessProfileId: state.fake, weight: 0 });
  try {
    require(deployment.effectPolicy === "AtMostOnce" && deployment.retryOnNodeLoss === false, `default effectPolicy ${deployment.effectPolicy}`);
    const { retryOnNodeLoss, ...body } = deployment;
    require(retryOnNodeLoss === false, "derived retryOnNodeLoss");
    const updated = await client.deployments.update(deployment.id, { ...body, effectPolicy: "AtLeastOnce" });
    require(updated.effectPolicy === "AtLeastOnce" && updated.retryOnNodeLoss === true, `updated effectPolicy ${updated.effectPolicy}`);
    let status = 0;
    try {
      await client.deployments.update(deployment.id, { ...body, effectPolicy: "AtMostOnce", retryOnNodeLoss: true });
    } catch (e) {
      require(e instanceof GarrisonError, `unexpected error ${e}`);
      status = e.statusCode;
      require(String(e.body).includes("EffectPolicyConflict"), `conflict body ${e.body}`);
    }
    require(status === 400, `conflict status ${status}`);
    const run = await client.runs.create({ input: "Effect policy", agentId: state.agent, deploymentId: deployment.id });
    require(run.effectPolicy === "AtLeastOnce", `run effectPolicy ${run.effectPolicy}`);
    await client.runs.cancel(run.id);
  } finally {
    await client.deployments.delete(deployment.id);
  }
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
await check("conversation start", async () => {
  const deployment = await client.deployments.create({
    name: `sdk-js-${suffix}-turns`, agentId: state.agent, harnessProfileId: state.fake,
    parameters: [{ name: "reportTurns", value: "true" }],
  });
  state.conversationDeployment = deployment.id;
  const run = await client.agents.invoke(state.agent, "First turn from the JavaScript SDK", { waitSeconds: 90, deploymentId: deployment.id, startConversation: true });
  require(run.status === "Succeeded", `status ${run.status} ${run.errorMessage ?? ""}`);
  require((run.conversationId ?? "").startsWith("cnv_"), `conversationId ${run.conversationId}`);
  require(run.conversationTurn === 1, `conversationTurn ${run.conversationTurn}`);
  require((run.resultText ?? "").startsWith("[turn 1] "), `result ${run.resultText}`);
  state.conversation = run.conversationId;
});
await check("conversation continue", async () => {
  const run = await client.agents.invoke(state.agent, "Second turn from the JavaScript SDK", { waitSeconds: 90, conversationId: state.conversation });
  require(run.status === "Succeeded", `status ${run.status} ${run.errorMessage ?? ""}`);
  require(run.conversationId === state.conversation, `conversationId ${run.conversationId}`);
  require(run.conversationTurn === 2, `conversationTurn ${run.conversationTurn}`);
  require((run.resultText ?? "").startsWith("[turn 2] "), `result ${run.resultText}`);
});
await check("conversation read and list", async () => {
  const conversation = await client.conversations.get(state.conversation);
  require(conversation.turnCount === 2, `turnCount ${conversation.turnCount}`);
  require(conversation.sessionId, "sessionId empty");
  require(conversation.deploymentId === state.conversationDeployment, `deploymentId ${conversation.deploymentId}`);
  require(conversation.busy === false, "busy");
  const page = await client.conversations.list({ agentId: state.agent });
  require(page.objects.some((c) => c.id === state.conversation), "conversation missing from list");
  const turns = (await client.conversations.listRuns(state.conversation)).objects;
  require(turns.length === 2, `turns ${turns.length}`);
  require(turns[0].conversationTurn === 1 && turns[1].conversationTurn === 2, `turn order ${turns.map((r) => r.conversationTurn).join(",")}`);
  const runs = await client.runs.list({ conversationId: state.conversation });
  require(runs.totalRecords === 2, `runs by conversationId ${runs.totalRecords}`);
});
await check("conversation delete", async () => {
  await client.conversations.delete(state.conversation);
  let status = 0;
  try { await client.conversations.get(state.conversation); } catch (e) { if (!(e instanceof GarrisonError)) throw e; status = e.statusCode; }
  require(status === 404, `expected 404 after delete, got ${status}`);
  status = 0;
  try { await client.agents.invoke(state.agent, "Turn for a deleted conversation", { conversationId: state.conversation }); } catch (e) { if (!(e instanceof GarrisonError)) throw e; status = e.statusCode; }
  require(status === 404, `expected 404 continuing a deleted conversation, got ${status}`);
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

await check("artifact collection and binary download", async () => {
  const store = await client.artifactStores.create({ name: `sdk-js-artifacts-${suffix}`, kind: "Filesystem", pathPrefix: `sdk-js-${suffix}` });
  const deployment = await client.deployments.get(state.deployment);
  try {
    await client.deployments.update(deployment.id, { ...deployment, artifactStoreId: store.id, artifactGlobs: ["reports/**/*.txt"], argumentOverrides: [{ position: 0, template: "--output-last-message" }, { position: 1, template: "{{run.workspaceDir}}/reports/answer.txt" }] });
    const run = await client.agents.invoke(state.agent, "artifact SDK payload", { wait: true, waitSeconds: 30, deploymentId: deployment.id });
    require(run.status === "Succeeded", "artifact run failed");
    const rows = (await client.artifacts.list({ runId: run.id, storeId: store.id })).objects;
    require(rows.length === 1, "one collected artifact");
    const artifact = await client.artifacts.get(rows[0].id);
    require(artifact.name === "reports/answer.txt", "artifact name");
    require(new TextDecoder().decode(await client.artifacts.download(artifact.id)).includes("artifact SDK payload"), "raw bytes");
    require((await client.artifacts.downloadUrl(artifact.id)).expiresUtc, "download expiry");
    await expectStatus(409, () => client.artifacts.upload(run.id, store.id, artifact.name, new TextEncoder().encode("late upload"), run.leaseEpoch, run.repairAttempts ?? 0));
    await client.artifacts.delete(artifact.id);
    require((await client.artifacts.list({ runId: run.id })).objects.length === 0, "deleted artifact");
  } finally { await client.deployments.update(deployment.id, deployment); await client.artifactStores.delete(store.id); }
});
await check("pipeline definitions, runs, and reviews", async () => {
  const writer = await client.agents.create({ name: `sdk-js-pipe-writer-${suffix}`, description: "JavaScript SDK pipeline stage 1." });
  const editor = await client.agents.create({ name: `sdk-js-pipe-editor-${suffix}`, description: "JavaScript SDK pipeline stage 2." });
  const deployments = [];
  let pipeline;
  try {
    deployments.push(await client.deployments.create({ name: `sdk-js-pipe-writer-${suffix}`, agentId: writer.id, harnessProfileId: state.fake }));
    deployments.push(await client.deployments.create({ name: `sdk-js-pipe-editor-${suffix}`, agentId: editor.id, harnessProfileId: state.fake }));
    pipeline = await client.pipelines.create({
      name: `sdk-js-pipe-${suffix}`, description: "JavaScript SDK harness pipeline.",
      stages: [
        { name: "write", agentId: writer.id, requiresReview: true, maxRevisions: 1 },
        { name: "edit", agentId: editor.id, parameters: [] },
      ],
    });
    require(pipeline.id.startsWith("ppl_") && pipeline.version === 1 && pipeline.stages.length === 2, "pipeline created with stages");
    const byName = await client.pipelines.get(pipeline.name);
    require(byName.id === pipeline.id && byName.stages[0].requiresReview === true, "pipeline read by name");
    const updated = await client.pipelines.update(pipeline.id, { ...byName, description: "Updated by the JavaScript SDK." });
    require(updated.version === 2 && updated.description === "Updated by the JavaScript SDK.", "pipeline update advances version");
    require((await client.pipelines.list({ search: pipeline.name })).objects.some((p) => p.id === pipeline.id), "pipeline list");
    const preview = await client.pipelines.preview(pipeline.id, { input: "Preview input", sampleOutputs: ["Sample stage one output"] });
    require(preview.stages.length === 2 && preview.stages.every((s) => s.success && s.prompt), "pipeline preview renders every stage");

    const key = `sdk-js-pipe-key-${suffix}`;
    const started = await client.pipelines.start(pipeline.id, { input: "Write a haiku", wait: true, waitSeconds: 30 }, { idempotencyKey: key });
    require(started.id.startsWith("plr_") && started.status === "AwaitingReview", `start waits for the review gate (${started.status})`);
    const repeated = await client.pipelines.start(pipeline.id, { input: "Write a haiku" }, { idempotencyKey: key });
    require(repeated.id === started.id, "same idempotency key returns the same pipeline run");
    await expectStatus(409, () => client.pipelines.start(pipeline.id, { input: "Different input" }, { idempotencyKey: key }));

    const pending = await client.pipelineReviews.list({ status: "Pending", pipelineRunId: started.id });
    require(pending.objects.length === 1 && pending.objects[0].position === 1, "one pending review");
    const review = await client.pipelineReviews.get(pending.objects[0].id);
    require(review.id.startsWith("prv_") && review.pipelineRunId === started.id, "review read");
    await expectStatus(400, () => client.pipelineReviews.decide(review.id, { decision: "RequestChanges" }));
    const approved = await client.pipelineReviews.decide(review.id, { decision: "Approve", comment: "Looks good from the JavaScript SDK." });
    require(approved.status === "Approved" && approved.decisionSource === "User", "review approved");
    await expectStatus(409, () => client.pipelineReviews.decide(review.id, { decision: "Reject" }));

    let finished = await client.pipelineRuns.get(started.id, 30);
    if (finished.status !== "Succeeded") finished = await client.pipelineRuns.waitFor(started.id, 60000);
    require(finished.status === "Succeeded" && finished.outcome === "Succeeded", `pipeline run succeeded (${finished.status})`);
    require(finished.stages.every((s) => s.status === "Succeeded") && finished.runs.length === 2 && finished.reviews.length === 1, "detail carries stages, runs, and reviews");
    require((await client.pipelineRuns.list({ pipelineId: pipeline.id })).objects.some((r) => r.id === started.id), "pipeline runs listed by pipeline");
    require((await client.pipelineReviews.list({ pipelineId: pipeline.id })).objects.some((r) => r.id === review.id), "reviews listed by pipeline");

    const second = await client.pipelines.start(pipeline.id, { input: "Write another" });
    await expectStatus(409, () => client.pipelines.delete(pipeline.id));
    const cancelling = await client.pipelineRuns.cancel(second.id);
    require(["Cancelling", "Cancelled"].includes(cancelling.status), `cancel accepted (${cancelling.status})`);
    let cancelled = await client.pipelineRuns.waitFor(second.id, 60000);
    require(cancelled.status === "Cancelled" && cancelled.outcome === "Cancelled", `pipeline run cancelled (${cancelled.status})`);
    const resumed = await client.pipelineRuns.retry(second.id);
    require(["Running", "AwaitingReview", "Succeeded"].includes(resumed.status), `retry resumes the pipeline run (${resumed.status})`);
    if (!["Succeeded", "Failed", "Cancelled", "TimedOut"].includes(resumed.status)) await client.pipelineRuns.cancel(second.id);
    cancelled = await client.pipelineRuns.waitFor(second.id, 60000);
    require(["Cancelled", "Succeeded"].includes(cancelled.status), `resumed pipeline run ended (${cancelled.status})`);
    await client.pipelineRuns.delete(second.id);
    await expectStatus(404, () => client.pipelineRuns.get(second.id));
  } finally {
    if (pipeline) {
      for (const run of (await client.pipelineRuns.list({ pipelineId: pipeline.id, maxResults: 100 })).objects) {
        if (!["Succeeded", "Failed", "Cancelled", "TimedOut"].includes(run.status)) {
          await client.pipelineRuns.cancel(run.id).catch(() => undefined);
          await client.pipelineRuns.waitFor(run.id, 30000);
        }
      }
      await client.pipelines.delete(pipeline.id);
    }
    for (const deployment of deployments) await client.deployments.delete(deployment.id);
    await client.agents.delete(writer.id);
    await client.agents.delete(editor.id);
  }
});
await check("stdio MCP worker diagnostic", async () => {
  const node = (await client.nodes.list()).objects.find((n) => n.supportsMcpTests && n.status === "Ready");
  require(node, "compatible worker");
  const server = await client.mcpServers.create({ name: `sdk-js-stdio-${suffix}`, transport: "Stdio", command: "garrison-fake-harness", arguments: ["--mcp-stdio"], requiredTools: ["fixture_status"] });
  try {
    const result = await client.mcpServers.test(server.id, node.id);
    require(result.success && result.nodeId === node.id && result.tools.includes("fixture_status"), "worker stdio diagnostic");
  } finally { await client.mcpServers.delete(server.id); }
});
await check("cleanup", async () => {
  if (state.conversationDeployment) await client.deployments.delete(state.conversationDeployment);
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
