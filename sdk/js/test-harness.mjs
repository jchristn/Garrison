// End-to-end harness for the Garrison JavaScript/TypeScript SDK.
// Usage: node test-harness.mjs [baseUrl] [accessKey] [secretKey]   (run "npm run build" first)
import { createHash } from "node:crypto";
import { EFFECT_POLICIES, EGRESS_PROTOCOLS, GarrisonClient, GarrisonError, TRUST_LEVELS, signWebhook, verifyWebhook } from "./dist/esm/index.js";

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
await check("run transcript (Markdown and JSON)", async () => {
  require(state.run, "no finished run");
  const markdown = await client.runs.transcriptMarkdown(state.run.id);
  require(markdown.includes(`sdk-js-${suffix}`), "markdown lacks the agent name");
  require(markdown.includes("Hello from the JavaScript SDK"), "markdown lacks the input");
  const transcript = await client.runs.transcript(state.run.id);
  require(transcript.schema === "garrison.transcript/v1" && transcript.kind === "Run", `schema ${transcript.schema} kind ${transcript.kind}`);
  require(transcript.runId === state.run.id && transcript.agentName === `sdk-js-${suffix}`, `run ${transcript.runId} agent ${transcript.agentName}`);
  require(transcript.turnCount === 1 && transcript.turns.length === 1, `turns ${transcript.turnCount}`);
  require(transcript.turns[0].input === "Hello from the JavaScript SDK", `turn input ${transcript.turns[0].input}`);
  require(transcript.includesThinking === false, "thinking included by default");
});
await check("input schema enforcement", async () => {
  const schema = { type: "object", properties: { topic: { type: "string" }, count: { type: "integer" } }, required: ["topic"] };
  const agent = await client.agents.create({ name: `sdk-js-${suffix}-schema`, inputMode: "Structured", inputSchemaJson: JSON.stringify(schema) });
  const deployment = await client.deployments.create({ name: `sdk-js-${suffix}-schema-fake`, agentId: agent.id, harnessProfileId: state.fake });
  try {
    require((agent.inputSchemaJson ?? "").includes("topic"), "inputSchemaJson not stored");
    const run = await client.agents.invoke(agent.id, JSON.stringify({ topic: "sdk", count: 2 }), { waitSeconds: 90, inputContentType: "application/json" });
    require(run.status === "Succeeded", `valid input status ${run.status} ${run.errorMessage ?? ""}`);
    let codes;
    try { await client.agents.invoke(agent.id, JSON.stringify({ count: "x" }), { inputContentType: "application/json" }); } catch (e) { if (!(e instanceof GarrisonError) || e.statusCode !== 400) throw e; codes = e.fieldCodes ?? {}; }
    require(codes && codes["input.topic"] === "InputSchemaViolation", `fieldCodes ${JSON.stringify(codes)}`);
    let notJson;
    try { await client.agents.invoke(agent.id, "plain words"); } catch (e) { if (!(e instanceof GarrisonError) || e.statusCode !== 400) throw e; notJson = e.fieldCodes ?? {}; }
    require(notJson && notJson.input === "InputNotJson", `fieldCodes ${JSON.stringify(notJson)}`);
  } finally {
    await client.deployments.delete(deployment.id);
    await client.agents.delete(agent.id);
  }
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
await check("egress allowlist round trip, validation, and queueing", async () => {
  require(EGRESS_PROTOCOLS.join(",") === "TCP,UDP", "egress protocol constants");
  const deployment = await client.deployments.create({ name: `sdk-js-${suffix}-egress`, agentId: state.agent, harnessProfileId: state.fake, weight: 0,
    egressRules: [{ cidr: "203.0.113.0/24", port: 443, protocol: "TCP" }] });
  try {
    const read = await client.deployments.get(deployment.id);
    const rules = read.egressRules ?? [];
    require(rules.length === 1 && rules[0].cidr === "203.0.113.0/24" && rules[0].port === 443 && rules[0].protocol === "TCP", `egressRules ${JSON.stringify(rules)}`);
    let status = 0;
    try {
      await client.deployments.update(deployment.id, { ...read, egressRules: [{ cidr: "203.0.113.7/24", port: 443, protocol: "TCP" }] });
    } catch (e) {
      require(e instanceof GarrisonError, `unexpected error ${e}`);
      status = e.statusCode;
      require(String(e.body).includes("InvalidCidr"), `bad cidr body ${e.body}`);
    }
    require(status === 400, `bad cidr status ${status}`);
    const run = await client.runs.create({ input: "Egress allowlist", agentId: state.agent, deploymentId: deployment.id });
    const queued = await client.runs.get(run.id);
    require(queued.executor === "KubernetesJob", `run executor ${queued.executor}`);
    require(queued.status === "Queued" && queued.blockedReason === "NoIsolatingWorker", `run ${queued.status} ${queued.blockedReason}`);
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
  require(Array.isArray(result.items[0].warnings) && result.items[0].warnings.length === 0, `unexpected warnings ${JSON.stringify(result.items[0].warnings)}`);
  const clamped = await client.manifests.apply(yaml.replace("description: Dry run only.", "description: Dry run only.\n  delegationMaxDepth: 99"), { dryRun: true });
  const warning = (clamped.items[0].warnings ?? []).find((w) => w.field === "delegationMaxDepth");
  require(warning && warning.code === "ValueClamped" && warning.given === "99" && warning.stored === "10", `manifest warnings ${JSON.stringify(clamped.items[0].warnings)}`);
});
await check("manifest bundle export", async () => {
  const bundle = await client.manifests.export({ resources: [`Agent/sdk-js-${suffix}`], followReferences: true });
  require(bundle.includes("kind: Bundle"), "no Bundle document");
  require(bundle.includes("kind: Agent") && bundle.includes(`name: sdk-js-${suffix}`), "agent missing from bundle");
  require(bundle.includes(`sdk-js-${suffix}-fake`), "followReferences did not bring the deployment");
  require(bundle.includes("builtin/fake"), "built-in requirement missing");
  const dry = await client.manifests.apply(bundle, { dryRun: true });
  require(dry.failedCount === 0, `bundle dry run failed ${dry.failedCount}`);
  let code;
  try { await client.manifests.export({ kinds: ["NoSuchKind"] }); } catch (e) { if (!(e instanceof GarrisonError) || e.statusCode !== 400) throw e; code = e.fieldCodes?.kinds; }
  require(code === "UnknownKind", `expected 400 UnknownKind, got ${code}`);
});
await check("clamped values return ValueClamped warnings", async () => {
  const deployment = await client.deployments.create({ name: `sdk-js-${suffix}-clamp`, agentId: state.agent, harnessProfileId: state.fake, weight: 0, maxAttempts: 99 });
  try {
    require(deployment.maxAttempts === 10, `stored maxAttempts ${deployment.maxAttempts}`);
    const warning = (deployment.warnings ?? []).find((w) => w.field === "maxAttempts");
    require(warning && warning.code === "ValueClamped" && warning.given === "99" && warning.stored === "10" && warning.message, `create warnings ${JSON.stringify(deployment.warnings)}`);
    const { warnings, ...body } = deployment;
    const updated = await client.deployments.update(deployment.id, { ...body, maxAttempts: 3 });
    require(updated.maxAttempts === 3 && updated.warnings === undefined, `update warnings ${JSON.stringify(updated.warnings)}`);
    const read = await client.deployments.get(deployment.id);
    require(read.warnings === undefined, "reads carry no warnings");
  } finally {
    await client.deployments.delete(deployment.id);
  }
});
await check("nodes report containerized", async () => {
  const nodes = (await client.nodes.list()).objects;
  require(nodes.length > 0, "no nodes");
  require(nodes.every((n) => typeof n.containerized === "boolean"), "containerized missing");
  const worker = nodes.find((n) => n.name === "sdk-harness-worker");
  require(!worker || worker.containerized === false, `harness worker containerized ${worker && worker.containerized}`);
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
await check("conversation transcript", async () => {
  const transcript = await client.conversations.transcript(state.conversation);
  require(transcript.kind === "Conversation" && transcript.conversationId === state.conversation, `kind ${transcript.kind}`);
  require(transcript.turnCount === 2 && transcript.turns.length === 2, `turns ${transcript.turnCount}`);
  require(transcript.turns[0].turn === 1 && transcript.turns[1].turn === 2, "turn order");
  const markdown = await client.conversations.transcriptMarkdown(state.conversation);
  require(markdown.includes("First turn from the JavaScript SDK") && markdown.includes("Second turn from the JavaScript SDK"), "markdown lacks a turn");
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
await check("webhook signature helper", async () => {
  const body = '{"a":1}';
  const now = Math.floor(Date.now() / 1000);
  const header = await signWebhook("whsec_test_secret_value", now, body);
  require(header.startsWith(`t=${now},v1=`) && header.length === `t=${now},v1=`.length + 64, `header shape ${header}`);
  require(await verifyWebhook(header, "whsec_test_secret_value", body), "verify own signature");
  require(await verifyWebhook(`t=${now},v1=${"0".repeat(64)},v1=${header.split(",v1=")[1]}`, "whsec_test_secret_value", body), "verify second v1");
  require(!(await verifyWebhook(header, "whsec_other_secret_value", body)), "wrong secret");
  require(!(await verifyWebhook(await signWebhook("whsec_test_secret_value", now - 3600, body), "whsec_test_secret_value", body)), "stale");
});

await check("webhook and cron triggers", async () => {
  let webhook;
  let cron;
  try {
    webhook = await client.triggers.create({ name: `sdk-js-hook-${suffix}`, type: "Webhook", agentId: state.agent });
    const secret = webhook.signingSecret;
    require(webhook.id.startsWith("trg_") && secret?.startsWith("whsec_") && webhook.signingSecretLast4 === secret.slice(-4), "webhook create");
    const read = await client.triggers.get(webhook.name);
    require(read.id === webhook.id && read.signingSecret === undefined && read.runAsType === "Credential", "get hides the secret");
    const deliveryId = `sdk-js-delivery-${suffix}`;
    const fire = await client.triggers.deliverWebhook(webhook.id, secret, '{"event":"push"}', { deliveryId });
    require(fire.outcome === "Started" && fire.runId && !fire.duplicate && fire.deliveryId === deliveryId, `signed delivery: ${JSON.stringify(fire)}`);
    const repeat = await client.triggers.deliverWebhook(webhook.id, secret, '{"event":"push"}', { deliveryId });
    require(repeat.duplicate && repeat.id === fire.id, "repeated delivery returns the same fire");
    const run = await client.runs.get(fire.runId);
    require(run.triggerId === webhook.id && run.kind === "Trigger", "run carries the trigger");
    require((await client.runs.list({ triggerId: webhook.id })).objects.some((r) => r.id === fire.runId), "runs by trigger");
    let status = 0;
    let code;
    try { await client.triggers.deliverWebhook(webhook.id, "whsec_wrong_secret_for_this_trigger", "{}"); } catch (e) { status = e.statusCode; code = e.code; }
    require(status === 401 && code === "InvalidSignature", `bad signature: ${status} ${code}`);
    const fires = await client.triggers.listFires(webhook.id, { outcome: "Started" });
    require(fires.objects.length === 1 && fires.objects[0].id === fire.id, "fire history");
    const rotated = await client.triggers.rotateSecret(webhook.id);
    require(rotated.signingSecret && rotated.signingSecret !== secret, "rotate secret");
    cron = await client.triggers.create({ name: `sdk-js-cron-${suffix}`, type: "Cron", agentId: state.agent, cronExpression: "0 9 * * 1-5", timeZone: "America/New_York" });
    require(cron.nextFireUtc && cron.signingSecret === undefined, "cron next fire");
    require((await client.triggers.list({ type: "Cron" })).objects.some((t) => t.id === cron.id), "list by type");
  } finally {
    if (webhook) await client.triggers.delete(webhook.id);
    if (cron) await client.triggers.delete(cron.id);
  }
});

await check("notification endpoints", async () => {
  let status = 0;
  let codes;
  try { await client.notificationEndpoints.create({ name: `sdk-js-local-${suffix}`, url: "http://127.0.0.1:9/x", events: ["RunFailed"] }); } catch (e) { status = e.statusCode; codes = e.fieldCodes; }
  require(status === 400 && codes?.url === "DestinationBlocked", `loopback refused: ${status} ${JSON.stringify(codes)}`);
  const endpoint = await client.notificationEndpoints.create({ name: `sdk-js-notify-${suffix}`, url: "https://example.invalid/hook", events: ["RunSucceeded", "RunFailed"] });
  try {
    require(endpoint.id.startsWith("nep_") && endpoint.signingSecret && endpoint.events.length === 2, "endpoint create");
    const read = await client.notificationEndpoints.get(endpoint.name);
    require(read.signingSecret === undefined && read.signingSecretLast4, "get hides the secret");
    const test = await client.notificationEndpoints.test(endpoint.id);
    require(test.event === "Test" && test.attempts === 1 && (test.status === "Pending" || test.status === "Failed"), `test delivery ${JSON.stringify(test)}`);
    require((await client.notificationEndpoints.listDeliveries(endpoint.id)).objects.some((d) => d.id === test.id), "delivery log");
    const one = await client.notificationEndpoints.getDelivery(endpoint.id, test.id);
    require(one.payload.includes('"event":"Test"'), "delivery payload");
    read.active = false;
    require(!(await client.notificationEndpoints.update(endpoint.id, read)).active, "endpoint update");
  } finally {
    await client.notificationEndpoints.delete(endpoint.id);
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
await check("effect operation metadata", async () => {
  const databaseUsage = await client.runs.databaseUsage(state.run.id);
  require(databaseUsage.some(row => row.statements > 0) && databaseUsage.every(row => row.runId === state.run.id && row.tenantId === state.tenant), "per-run database attribution");
  const placement = await client.runs.placement(state.run.id);
  require(placement.runId === state.run.id && placement.reasons.includes("RunNotQueued") && !placement.eligible, "terminal placement diagnostic");
  const operations = await client.runs.operations(state.run.id);
  require(Array.isArray(operations) && operations.every((op) => op.tenantId === state.tenant), "journal metadata");
  let missing = false;
  try { await client.runs.operations("run_missing_sdk"); } catch (error) { missing = error.statusCode === 404; }
  require(missing, "unknown journal must be 404");
});
await check("scheduling, pinned sessions, remote admission, and key rotation", async () => {
  const administrator = new GarrisonClient(baseUrl);
  administrator.useAdminApiKey(process.env.GARRISON_SDK_ADMIN_API_KEY ?? "garrisonadmin", state.tenant);
  const scratch = await administrator.tenants.create({ name: `sdk-js-weight-${suffix}`, schedulingWeight: 7 });
  try {
    require(scratch.schedulingWeight === 7, "tenant weight create");
    require((await administrator.tenants.update(scratch.id, { schedulingWeight: 3 })).schedulingWeight === 3, "tenant weight update");
  } finally { await administrator.tenants.delete(scratch.id); }
  const rotated = await administrator.settings.rotateMasterKey();
  require(rotated.keyVersion >= 1 && rotated.failed === 0 && rotated.conflicts === 0, "rotation pass");
  const repeated = await administrator.settings.rotateMasterKey();
  require(repeated.rotated === 0 && repeated.failed === 0, "rotation idempotence");
  const brokerMetadata = await client.secrets.create({ name: `sdk-js-broker-${suffix}`, kind: "LeaseBroker", brokerResource: "tenant-scoped-fixture", brokerAudience: "fixture" });
  try {
    const read = await client.secrets.get(brokerMetadata.id);
    require(read.brokerResource === "tenant-scoped-fixture" && read.brokerAudience === "fixture" && read.valueEncrypted === undefined, "provider metadata round trip");
    let refused = false;
    try { await client.secrets.setValue(read.id, "forbidden-static-value"); } catch (error) { refused = error.statusCode === 400; }
    require(refused, "broker metadata rejects reusable static values");
  } finally { await client.secrets.delete(brokerMetadata.id); }
  const pinned = await client.harnessProfiles.create({ name: `sdk-js-session-${suffix}`, harnessType: "Generic", executable: "garrison-fake-harness", sessionFormat: "sdk-fixture-v1" });
  try { require((await client.harnessProfiles.get(pinned.id)).sessionFormat === "sdk-fixture-v1", "session format round trip"); }
  finally { await client.harnessProfiles.delete(pinned.id); }
  const remote = await client.agents.create({ name: `sdk-js-remote-${suffix}`, kind: "Remote", remoteProtocol: "A2A", remoteEndpointUrl: "http://127.0.0.1:9/a2a" });
  try {
    let denied = false;
    try { await client.agents.invoke(remote.id, "fixture", { deploymentId: state.deployment }); }
    catch (error) { denied = error.statusCode === 409 && error.error?.code === "RemoteDeploymentUnsupported"; }
    require(denied, "remote deployment override must be rejected before network I/O");
  } finally { await client.agents.delete(remote.id); }
  require((await client.deployments.get(state.deployment)).suspensionEnabled === false, "suspension defaults to opt out");
});
await check("agent revisions and promotion", async () => {
  const agent = await client.agents.create({ name: `sdk-js-rev-${suffix}`, description: "original" });
  const dev = await client.deployments.create({ name: `sdk-js-rev-${suffix}-dev`, agentId: agent.id, harnessProfileId: state.fake, weight: 0 });
  const staging = await client.deployments.create({ name: `sdk-js-rev-${suffix}-staging`, agentId: agent.id, harnessProfileId: state.fake, weight: 0, environment: "staging" });
  try {
    require((dev.environment ?? "dev") === "dev" && dev.agentRevisionId == null, "dev deployment defaults");
    require(staging.environment === "staging", "staging environment round trip");
    const draft = await client.agents.saveDraft(agent.id, { description: "revised" });
    require(draft.state === "Draft" && draft.description === "revised", "draft saved");
    require((await client.agents.get(agent.id)).draftRevisionId === draft.id, "agent draftRevisionId");
    const published = await client.agents.publishRevision(agent.id, draft.id, { changeNote: "sdk harness" });
    require(published.state === "Published" && published.id === draft.id, "revision published");
    require((await client.agents.get(agent.id)).latestPublishedRevisionId === published.id, "agent latestPublishedRevisionId");
    require((await client.agents.getRevision(agent.id, published.number)).id === published.id, "revision by number");
    require((await client.agents.listRevisions(agent.id)).objects.some((r) => r.id === published.id), "revision listed");
    const promotion = await client.promotions.promote({ agentId: agent.id, sourceEnvironment: "dev", note: "sdk harness" });
    require(promotion.kind === "Promote" && promotion.targetEnvironment === "staging", "promotion target defaults to staging");
    require((await client.deployments.get(staging.id)).agentRevisionId === published.id, "staging pinned to published revision");
    require((await client.promotions.get(promotion.id)).id === promotion.id, "promotion read");
    require((await client.promotions.list({ agentId: agent.id })).objects.some((p) => p.id === promotion.id), "promotion listed");
    const rollback = await client.promotions.rollback(promotion.id, { note: "undo" });
    require(rollback.kind === "Rollback", "rollback record");
    require((await client.deployments.get(staging.id)).agentRevisionId == null, "staging pin restored to null");
    const environments = await client.environments.get();
    require(environments.isDefault === true, "default environment list");
    require(environments.environments.map((e) => e.name).join(",") === "dev,staging,prod", "dev, staging, prod order");
  } finally {
    await client.deployments.delete(staging.id);
    await client.deployments.delete(dev.id);
    await client.agents.delete(agent.id);
  }
});
await check("agent assets", async () => {
  const asset = await client.agentAssets.create({ name: `sdk-js-asset-${suffix}`, kind: "Skill", description: "JS SDK harness asset." });
  let agent;
  try {
    require(asset.kind === "Skill" && (asset.currentVersion ?? 0) === 0, "asset created with no version");
    const content = new TextEncoder().encode("# SDK skill\n\nCreated by the JS SDK harness.\n");
    const expected = createHash("sha256").update(content).digest("hex");
    const files = [{ path: "SKILL.md", content, mediaType: "text/markdown" }];
    const first = await client.agentAssets.uploadVersion(asset.id, files, "sdk harness");
    require(first.number === 1, `first version ${first.number}`);
    const skill = first.files.find((f) => f.path === "SKILL.md");
    require(skill && skill.sha256.toLowerCase() === expected, `sha256 ${skill?.sha256}`);
    const again = await client.agentAssets.uploadVersion(asset.id, files, "sdk harness");
    require(again.number === 1, `identical upload returned version ${again.number}`);
    const downloaded = await client.agentAssets.downloadFile(asset.id, 1, "SKILL.md");
    require(Buffer.from(downloaded).equals(Buffer.from(content)), "downloaded bytes match");
    require((await client.agentAssets.listVersions(asset.id)).some((v) => v.number === 1), "version listed");
    require((await client.agentAssets.getVersion(asset.id, 1)).number === 1, "get version");
    require((await client.agentAssets.get(asset.id)).currentVersion === 1, "current version");
    require((await client.agentAssets.list({ kind: "Skill", search: asset.name })).objects.some((a) => a.id === asset.id), "asset listed");
    agent = await client.agents.create({ name: `sdk-js-asset-agent-${suffix}`, description: "asset pin" });
    const draft = await client.agents.saveDraft(agent.id, { description: "pins an asset", assetPins: [{ assetId: asset.id }] });
    const published = await client.agents.publishRevision(agent.id, draft.id, { changeNote: "sdk harness" });
    require((published.assetPins ?? []).some((p) => p.assetId === asset.id), `assetPins ${JSON.stringify(published.assetPins)}`);
    let inUse = false;
    try { await client.agentAssets.delete(asset.id); } catch (e) { inUse = e instanceof GarrisonError && e.statusCode === 409 && e.code === "AssetInUse"; }
    require(inUse, "deleting a pinned asset returns 409 AssetInUse");
  } finally {
    if (agent) await client.agents.delete(agent.id);
    await client.agentAssets.delete(asset.id);
  }
});
await check("conversation file spaces", async () => {
  // The conversation cases delete their conversation, so this case starts its own.
  const started = await client.agents.invoke(state.agent, "File space turn from the JavaScript SDK", { waitSeconds: 90, deploymentId: state.conversationDeployment, startConversation: true });
  const cid = started.conversationId;
  require(cid, "no conversation");
  const text = "# Notes\n\nWritten by the JavaScript SDK harness.\n";
  const first = await client.fileSpaces.write("conversations", cid, "notes/a.md", text, { baseVersion: 0, mediaType: "text/markdown" });
  require(first.version === 1 && !first.conflict && first.path === "notes/a.md", `first write ${JSON.stringify(first)}`);
  const second = await client.fileSpaces.write("conversations", cid, "notes/a.md", "conflicting edit\n", { baseVersion: 0 });
  require(second.conflict && second.path !== "notes/a.md", `stale write ${JSON.stringify(second)}`);
  const listing = await client.fileSpaces.list("conversations", cid);
  const paths = (listing.files ?? []).map((f) => f.path);
  require(paths.includes("notes/a.md") && paths.includes(second.path), `listing ${paths}`);
  require(listing.fileSpaceId, "listing fileSpaceId");
  require((await client.fileSpaces.versions("conversations", cid, "notes/a.md")).some((v) => v.number === 1), "version 1 not listed");
  const content = await client.fileSpaces.read("conversations", cid, "notes/a.md");
  require(new TextDecoder().decode(content) === text, "content differs");
  const link = await client.fileSpaces.downloadUrl("conversations", cid, "notes/a.md", 1);
  const fetched = await fetch(link.url);
  require(fetched.status === 200 && (await fetched.text()) === text, `download url status ${fetched.status}`);
  await client.fileSpaces.delete("conversations", cid, second.path);
  const after = ((await client.fileSpaces.list("conversations", cid)).files ?? []).map((f) => f.path);
  require(!after.includes(second.path), "conflict file not deleted");
  const turns = (await client.conversations.listRuns(cid)).objects;
  require(turns.length > 0, "no conversation turns");
  const run = await client.runs.get(turns[0].id);
  require(run.fileSpaceId, `run fileSpaceId ${run.fileSpaceId}`);
  const byRun = ((await client.fileSpaces.list("runs", run.id)).files ?? []).map((f) => f.path);
  require(byRun.includes("notes/a.md"), `run listing ${byRun}`);
});

await check("capability catalog", async () => {
  const catalog = await client.capabilities.list();
  require(catalog.totalRecords === catalog.objects.length, `totalRecords ${catalog.totalRecords} objects ${catalog.objects.length}`);
  const mine = catalog.objects.find((d) => d.kind === "Agent" && d.sourceAgentId === state.agent);
  require(mine, "test agent has no Agent descriptor");
  require(mine.origin === "Derived" && mine.sourceRevisionId && mine.id.startsWith("cap_"), `agent descriptor ${JSON.stringify(mine)}`);
  require((await client.capabilities.list({ kind: "Agent" })).objects.every((d) => d.kind === "Agent"), "kind filter");
  const name = `sdk-js-cap-${suffix}`;
  const tag = `sdk-js-tag-${suffix}`;
  const schema = JSON.stringify({ type: "object", properties: { text: { type: "string" } }, required: ["text"] });
  const created = await client.capabilities.create({
    name, kind: "McpTool", summary: "Manual descriptor from the JavaScript SDK harness.", inputSchemaJson: schema,
    tags: [tag], requirements: [{ key: "garrison.io/sdk-fixture", value: "true" }],
  });
  try {
    require(created.origin === "Manual" && created.sourceKey === `manual:${created.id}`, `manual descriptor ${JSON.stringify(created)}`);
    require(created.tags.includes(tag) && created.requirements.some((r) => r.key === "garrison.io/sdk-fixture"), "tags and requirements");
    require((await client.capabilities.get(created.id)).name === name, "read by id");
    require((await client.capabilities.get(name)).id === created.id, "read by name");
    const tagged = (await client.capabilities.list({ tag })).objects;
    require(tagged.length === 1 && tagged[0].id === created.id, `tag filter returned ${tagged.length}`);
    let badCode = null;
    try { await client.capabilities.create({ name: `${name}-bad`, kind: "McpTool", inputSchemaJson: "[1,2]" }); }
    catch (e) { badCode = e instanceof GarrisonError && e.statusCode === 400 ? e.code : String(e); }
    require(badCode === "InvalidJsonSchema", `invalid schema code ${badCode}`);
    let duplicateCode = null;
    try { await client.capabilities.create({ name, kind: "McpTool" }); }
    catch (e) { duplicateCode = e instanceof GarrisonError && e.statusCode === 409 ? e.code : String(e); }
    require(duplicateCode === "NameConflict", `duplicate name code ${duplicateCode}`);
    const updated = await client.capabilities.update(created.id, { ...created, summary: "Updated by the JavaScript SDK harness." });
    require(updated.summary === "Updated by the JavaScript SDK harness." && updated.tags.includes(tag), "update");
    const refreshed = await client.capabilities.refresh();
    require(["agents", "harnessBuiltIns", "hints"].every((k) => Number.isInteger(refreshed[k])), `refresh ${JSON.stringify(refreshed)}`);
    require(Array.isArray(refreshed.mcpServers) && refreshed.mcpServers.every((m) => m.mcpServerId), "refresh servers");
  } finally {
    await client.capabilities.delete(created.id);
  }
  let missing = 0;
  try { await client.capabilities.get(created.id); } catch (e) { missing = e instanceof GarrisonError ? e.statusCode : 0; }
  require(missing === 404, `deleted descriptor read returned ${missing}`);
});
await check("fan-out groups", async () => {
  require(state.run, "no finished run");
  const groups = await client.fanOutGroups.listByRun(state.run.id);
  require(Array.isArray(groups) && groups.length === 0, `expected no fan-out groups, got ${JSON.stringify(groups)}`);
  await expectStatus(404, () => client.fanOutGroups.get("fog_missing"));
  await expectStatus(404, () => client.fanOutGroups.cancel("fog_missing"));
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
