namespace Test.Shared.Suites
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Net.Http;
    using System.Text;
    using System.Text.Json;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Requests;
    using Garrison.Core.Responses;
    using Garrison.Core.Serialization;
    using Garrison.Core.Services;
    using Test.Shared.Infrastructure;
    using Touchstone.Core;

    /// <summary>
    /// Agent input schemas (plan P12.22, D-054): schemas must be usable JSON Schema documents when an agent is saved
    /// (REST, MCP, manifests), and an agent with an input schema only runs JSON input that matches it, with field-coded
    /// errors keyed by the input path, over REST (invoke, run create, deployment test, conversation turns), MCP, and A2A.
    /// </summary>
    public static class InputSchemaSuite
    {
        #region Private-Members

        private static readonly string _Schema = "{\"type\":\"object\",\"properties\":{\"topic\":{\"type\":\"string\",\"description\":\"What to write about\"},\"tone\":{\"type\":\"string\",\"enum\":[\"formal\",\"casual\"],\"default\":\"formal\"},\"words\":{\"type\":\"integer\",\"minimum\":10},\"tags\":{\"type\":\"array\",\"items\":{\"type\":\"string\"}},\"options\":{\"type\":\"object\",\"properties\":{\"draft\":{\"type\":\"boolean\"}},\"required\":[\"draft\"]}},\"required\":[\"topic\"]}";

        #endregion

        #region Public-Methods

        /// <summary>
        /// Build the suites.
        /// </summary>
        /// <returns>Suites.</returns>
        public static List<TestSuiteDescriptor> Build()
        {
            List<TestSuiteDescriptor> suites = new List<TestSuiteDescriptor>();
            List<TestCaseDescriptor> unit = new List<TestCaseDescriptor>();
            unit.Add(new TestCaseDescriptor("input-schema-unit", "validator", "Input validation maps failures to input field keys (root, property, nested property, array item, missing required) with InputNotJson and InputSchemaViolation codes, and schema checks reject unusable schemas", ValidatorAsync));
            suites.Add(new TestSuiteDescriptor("input-schema-unit", "Input schemas (unit)", unit));

            foreach (DatabaseTypeEnum provider in TestEnvironment.Providers())
            {
                string id = "input-schema-" + provider.ToString().ToLowerInvariant();
                List<TestCaseDescriptor> cases = new List<TestCaseDescriptor>();
                cases.Add(new TestCaseDescriptor(id, "save", "Unusable input and output schemas are refused with InvalidJsonSchema over REST create and update, MCP, and manifests; usable ones are kept (" + provider + ")", ct => SaveAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "invoke", "An agent with an input schema runs matching JSON and refuses other input with field-coded 400s over REST invoke, run create, deployment test, and conversation turns, and with ValidationFailed over MCP and A2A, creating no run; the card advertises JSON input (" + provider + ")", ct => InvokeAsync(provider, ct)));
                suites.Add(new TestSuiteDescriptor(id, "Input schemas (" + provider + ")", cases));
            }
            return suites;
        }

        #endregion

        #region Private-Methods

        private static Task ValidatorAsync(CancellationToken token)
        {
            InputSchemaValidator validator = new InputSchemaValidator();
            Assert.Equal(0, validator.Validate(_Schema, "{\"topic\":\"x\",\"tags\":[\"a\"],\"options\":{\"draft\":true}}").Count, "Valid input");
            List<InputSchemaViolation> missing = validator.Validate(_Schema, "{\"words\":3}");
            Assert.True(missing.Any(v => v.Field == "input.topic" && v.Code == "InputSchemaViolation" && v.Keyword == "required"), "Missing required on its own key: " + Describe(missing));
            Assert.True(missing.Any(v => v.Field == "input.words"), "Minimum on the property: " + Describe(missing));
            List<InputSchemaViolation> nested = validator.Validate(_Schema, "{\"topic\":\"x\",\"tags\":[\"a\",5],\"options\":{}}");
            Assert.True(nested.Any(v => v.Field == "input.tags[1]"), "Array item key: " + Describe(nested));
            Assert.True(nested.Any(v => v.Field == "input.options.draft"), "Nested required key: " + Describe(nested));
            List<InputSchemaViolation> root = validator.Validate(_Schema, "[1,2]");
            Assert.True(root.Any(v => v.Field == "input"), "Root type failure on input: " + Describe(root));
            List<InputSchemaViolation> text = validator.Validate(_Schema, "write about cats");
            Assert.True(text.Count == 1 && text[0].Field == "input" && text[0].Code == "InputNotJson", "Not JSON: " + Describe(text));

            try
            {
                validator.Require(_Schema, "{}");
                throw new TestAssertionException("Require must throw for invalid input.");
            }
            catch (ValidationException e)
            {
                Assert.True(e.Fields.ContainsKey("input.topic") && e.CodeFor("input.topic") == "InputSchemaViolation", "Require throws field codes");
            }
            validator.Require(null, "anything");

            Assert.Equal("input.a.b[2].c", InputSchemaValidator.FieldFor("/a/b/2/c"), "Pointer to field");
            Assert.Equal("input.x/y", InputSchemaValidator.FieldFor("/x~1y"), "Escaped pointer");
            Assert.True(InputSchemaValidator.CheckSchema(_Schema) == null && InputSchemaValidator.CheckSchema(null) == null && InputSchemaValidator.CheckSchema("true") == null, "Usable schemas");
            Assert.True(InputSchemaValidator.CheckSchema("{\"type\":\"objekt\"}") != null, "Unknown type refused");
            Assert.True(InputSchemaValidator.CheckSchema("{\"minimum\":\"ten\"}") != null, "Bad keyword value refused");
            Assert.True(InputSchemaValidator.CheckSchema("[1]") != null && InputSchemaValidator.CheckSchema("{not json") != null, "Non-schema JSON and non-JSON refused");
            return Task.CompletedTask;
        }

        private static string Describe(List<InputSchemaViolation> violations)
        {
            return String.Join("; ", violations.Select(v => v.Field + " " + v.Code + " " + v.Keyword + " " + v.Message));
        }

        private static async Task SaveAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                string t = "/v1.0/api/tenants/" + host.TenantId;
                HttpClient admin = host.AdminClient;
                await ExpectInvalidSchemaAsync(admin, HttpMethod.Post, t + "/agents", new Agent { Name = "bad-input", InputSchemaJson = "{\"type\":\"objekt\"}" }, "inputSchema", token).ConfigureAwait(false);
                await ExpectInvalidSchemaAsync(admin, HttpMethod.Post, t + "/agents", new { name = "bad-input-json", inputSchema = "{not json" }, "inputSchema", token).ConfigureAwait(false);
                await ExpectInvalidSchemaAsync(admin, HttpMethod.Post, t + "/agents", new Agent { Name = "bad-output", OutputSchemaJson = "{\"required\":\"answer\"}" }, "outputSchema", token).ConfigureAwait(false);

                Agent good = await HttpTestHelpers.SendAsync<Agent>(admin, HttpMethod.Post, t + "/agents", new Agent { Name = "good-input", InputMode = AgentInputModeEnum.Structured, InputSchemaJson = _Schema }, 201, token).ConfigureAwait(false);
                Assert.Equal(_Schema, good.InputSchemaJson, "Usable schema kept");
                good.InputSchemaJson = "{\"properties\":{\"a\":{\"type\":7}}}";
                await ExpectInvalidSchemaAsync(admin, HttpMethod.Put, t + "/agents/" + good.Id, good, "inputSchema", token).ConfigureAwait(false);

                using (TestMcpClient client = new TestMcpClient())
                {
                    await client.ConnectAsync(host, null, token).ConfigureAwait(false);
                    await client.ExpectErrorAsync("garrison_create_agent", new { configuration = new Agent { Name = "mcp-bad-schema", InputSchemaJson = "{\"type\":\"objekt\"}" } }, "inputSchema", token).ConfigureAwait(false);
                }

                string manifest = "apiVersion: garrison/v1\nkind: Agent\nmetadata:\n  name: manifest-bad-schema\nspec:\n  inputSchema:\n    type: objekt\n";
                using (StringContent content = new StringContent(manifest, Encoding.UTF8, "application/yaml"))
                using (HttpResponseMessage response = await admin.PostAsync(t + "/manifests/apply", content, token).ConfigureAwait(false))
                {
                    ManifestApply apply = Assert.NotNull(Serializer.Deserialize<ManifestApply>(await response.Content.ReadAsStringAsync(token).ConfigureAwait(false)), "Apply result");
                    ManifestApplyItem item = apply.Items.Single();
                    Assert.True(item.Result == ManifestApplyResultEnum.Failed && item.ErrorCode == "InvalidJsonSchema" && item.ErrorField == "inputSchema", "Manifest refuses the schema: " + item.ErrorCode + " " + item.ErrorField + " " + item.Message);
                }
            }
        }

        private static async Task ExpectInvalidSchemaAsync(HttpClient client, HttpMethod method, string path, object body, string field, CancellationToken token)
        {
            TestResponse response = await HttpTestHelpers.SendAsync(client, method, path, body, token).ConfigureAwait(false);
            Assert.Equal(400, response.StatusCode, method + " " + path + " with an unusable " + field + ": " + response.Body);
            ErrorResponse error = Assert.NotNull(Serializer.Deserialize<ErrorResponse>(response.Body), "Error body");
            Assert.True(error.FieldCodes != null && error.FieldCodes.TryGetValue(field, out string? code) && code == "InvalidJsonSchema", "InvalidJsonSchema on " + field + ": " + response.Body);
        }

        private static async Task InvokeAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestCluster cluster = await TestCluster.StartAsync(provider, 1, token).ConfigureAwait(false))
            {
                string tenant = cluster.Server.TenantId;
                string t = "/v1.0/api/tenants/" + tenant;
                HttpClient admin = cluster.Server.AdminClient;
                Agent agent = await cluster.CreateAgentAsync("schema-writer", "builtin/fake", a => { a.InputMode = AgentInputModeEnum.Structured; a.InputSchemaJson = _Schema; a.ExposeMcpTool = true; }, token).ConfigureAwait(false);
                EnumerationResult<Run> before = await HttpTestHelpers.SendAsync<EnumerationResult<Run>>(admin, HttpMethod.Get, t + "/runs?agentId=" + agent.Id, null, 200, token).ConfigureAwait(false);

                // REST invoke: matching JSON runs.
                string valid = "{\"topic\":\"tides\",\"tone\":\"casual\",\"words\":50,\"tags\":[\"sea\"],\"options\":{\"draft\":false}}";
                Run run = await HttpTestHelpers.SendAsync<Run>(admin, HttpMethod.Post, t + "/agents/" + agent.Name + "/invoke", new InvokeRequest { Input = valid, InputContentType = "application/json", WaitSeconds = 60 }, 200, token).ConfigureAwait(false);
                Assert.Equal(RunStatusEnum.Succeeded, run.Status, "Matching input runs");

                // REST refusals, keyed by input path.
                ErrorResponse missing = await ExpectFieldsAsync(admin, t + "/agents/" + agent.Name + "/invoke", new InvokeRequest { Input = "{\"words\":3}" }, token).ConfigureAwait(false);
                Assert.True(Code(missing, "input.topic") == "InputSchemaViolation" && Code(missing, "input.words") == "InputSchemaViolation", "Missing required and minimum: " + Serializer.Serialize(missing));
                ErrorResponse nested = await ExpectFieldsAsync(admin, t + "/agents/" + agent.Name + "/invoke", new InvokeRequest { Input = "{\"topic\":\"x\",\"tone\":\"angry\",\"tags\":[\"a\",2],\"options\":{}}" }, token).ConfigureAwait(false);
                Assert.True(Code(nested, "input.tone") == "InputSchemaViolation" && Code(nested, "input.tags[1]") == "InputSchemaViolation" && Code(nested, "input.options.draft") == "InputSchemaViolation", "Enum, array item, and nested required: " + Serializer.Serialize(nested));
                ErrorResponse text = await ExpectFieldsAsync(admin, t + "/agents/" + agent.Name + "/invoke", new InvokeRequest { Input = "write about tides" }, token).ConfigureAwait(false);
                Assert.True(Code(text, "input") == "InputNotJson", "Plain text refused: " + Serializer.Serialize(text));
                ErrorResponse created = await ExpectFieldsAsync(admin, t + "/runs", new RunCreateRequest { AgentName = agent.Name, Input = "{}" }, token).ConfigureAwait(false);
                Assert.True(Code(created, "input.topic") == "InputSchemaViolation", "Run create");
                EnumerationResult<Deployment> deployments = await HttpTestHelpers.SendAsync<EnumerationResult<Deployment>>(admin, HttpMethod.Get, t + "/deployments", null, 200, token).ConfigureAwait(false);
                Deployment deployment = deployments.Objects.First(d => d.AgentId == agent.Id);
                ErrorResponse tested = await ExpectFieldsAsync(admin, t + "/deployments/" + deployment.Id + "/test", new InvokeRequest { Input = "[]" }, token).ConfigureAwait(false);
                Assert.True(Code(tested, "input") == "InputSchemaViolation", "Deployment test: " + Serializer.Serialize(tested));

                // Conversation turns are checked too.
                Run first = await HttpTestHelpers.SendAsync<Run>(admin, HttpMethod.Post, t + "/agents/" + agent.Name + "/invoke", new InvokeRequest { Input = "{\"topic\":\"one\"}", StartConversation = true, WaitSeconds = 60 }, 200, token).ConfigureAwait(false);
                ErrorResponse turn = await ExpectFieldsAsync(admin, t + "/agents/" + agent.Name + "/invoke", new InvokeRequest { Input = "and another thing", ConversationId = first.ConversationId }, token).ConfigureAwait(false);
                Assert.True(Code(turn, "input") == "InputNotJson", "Conversation turn");

                // MCP: the generic invoke tool and the agent's own tool.
                using (TestMcpClient client = new TestMcpClient())
                {
                    await client.ConnectAsync(cluster.Server, null, token).ConfigureAwait(false);
                    await client.ExpectErrorAsync("garrison_invoke_agent", new { agent = agent.Name, input = "{\"words\":3}" }, "ValidationFailed", token).ConfigureAwait(false);
                    await client.ExpectErrorAsync("garrison_start_run", new { agent = agent.Name, input = "not json" }, "input", token).ConfigureAwait(false);
                    string tool = agent.McpToolName ?? agent.Name;
                    await client.ExpectErrorAsync(tool, new { input = "{\"tone\":\"formal\"}" }, "input.topic", token).ConfigureAwait(false);
                    string ok = await client.CallAsync("garrison_invoke_agent", new { agent = agent.Name, input = "{\"topic\":\"mcp\"}", waitSeconds = 60 }, token).ConfigureAwait(false);
                    Assert.True(ok.Contains("Succeeded", StringComparison.Ordinal), "MCP matching input runs: " + ok);
                }

                // A2A: a text part must hold matching JSON.
                string url = cluster.Server.BaseUrl + "/v1.0/a2a/" + tenant + "/" + agent.Name;
                string bad = A2AMessage("{\"tone\":\"formal\"}");
                using (HttpClient http = new HttpClient())
                {
                    http.DefaultRequestHeaders.Add("x-api-key", cluster.Server.Settings.Auth.AdminApiKey);
                    http.Timeout = TimeSpan.FromSeconds(120);
                    using (HttpResponseMessage response = await http.PostAsync(url, new StringContent(bad, Encoding.UTF8, "application/json"), token).ConfigureAwait(false))
                    {
                        string body = await response.Content.ReadAsStringAsync(token).ConfigureAwait(false);
                        Assert.True(body.Contains("\"error\"", StringComparison.Ordinal) && body.Contains("input.topic", StringComparison.Ordinal) && body.Contains("ValidationFailed", StringComparison.Ordinal), "A2A refuses: " + body);
                    }
                    using (HttpResponseMessage response = await http.PostAsync(url, new StringContent(A2AMessage("{\"topic\":\"a2a\"}"), Encoding.UTF8, "application/json"), token).ConfigureAwait(false))
                    {
                        string body = await response.Content.ReadAsStringAsync(token).ConfigureAwait(false);
                        Assert.True(!body.Contains("\"error\"", StringComparison.Ordinal) && body.Contains("\"result\"", StringComparison.Ordinal), "A2A matching input: " + body);
                    }
                }

                TestResponse card = await HttpTestHelpers.SendAsync(admin, HttpMethod.Get, t + "/agents/" + agent.Id + "/card", null, token).ConfigureAwait(false);
                Assert.True(card.Body.Contains("application/json", StringComparison.Ordinal), "Card advertises JSON input");

                // Refused inputs created no runs: one REST run, the conversation's first turn, one MCP run, one A2A run.
                EnumerationResult<Run> after = await HttpTestHelpers.SendAsync<EnumerationResult<Run>>(admin, HttpMethod.Get, t + "/runs?agentId=" + agent.Id, null, 200, token).ConfigureAwait(false);
                Assert.Equal(before.TotalRecords + 4, after.TotalRecords, "Only accepted inputs created runs");
            }
        }

        private static string A2AMessage(string text)
        {
            Dictionary<string, object?> part = new Dictionary<string, object?> { ["text"] = text };
            Dictionary<string, object?> message = new Dictionary<string, object?> { ["role"] = "ROLE_USER", ["messageId"] = Guid.NewGuid().ToString("N"), ["parts"] = new List<object?> { part } };
            Dictionary<string, object?> parameters = new Dictionary<string, object?> { ["message"] = message };
            Dictionary<string, object?> request = new Dictionary<string, object?> { ["jsonrpc"] = "2.0", ["id"] = 1, ["method"] = "SendMessage", ["params"] = parameters };
            return JsonSerializer.Serialize(request);
        }

        private static async Task<ErrorResponse> ExpectFieldsAsync(HttpClient client, string path, object body, CancellationToken token)
        {
            TestResponse response = await HttpTestHelpers.SendAsync(client, HttpMethod.Post, path, body, token).ConfigureAwait(false);
            Assert.Equal(400, response.StatusCode, "POST " + path + " refuses the input: " + response.Body);
            ErrorResponse error = Assert.NotNull(Serializer.Deserialize<ErrorResponse>(response.Body), "Error body");
            Assert.True(error.Code == "ValidationFailed" && error.Fields != null && error.FieldCodes != null, "Field-coded ValidationFailed: " + response.Body);
            return error;
        }

        private static string? Code(ErrorResponse error, string field)
        {
            if (error.FieldCodes == null || !error.FieldCodes.TryGetValue(field, out string? code)) return null;
            return code;
        }

        #endregion
    }
}
