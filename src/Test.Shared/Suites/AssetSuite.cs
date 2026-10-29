namespace Test.Shared.Suites
{
    using System;
    using System.Collections.Generic;
    using System.IO;
    using System.Linq;
    using System.Net.Http;
    using System.Net.Http.Headers;
    using System.Security.Cryptography;
    using System.Text;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Compilation;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Manifests;
    using Garrison.Core.Models;
    using Garrison.Core.Requests;
    using Garrison.Core.Serialization;
    using Garrison.Server.Runtime;
    using Test.Shared.Infrastructure;
    using Touchstone.Core;

    /// <summary>
    /// Agent assets (AD2): validation, storage in the database and filesystem stores with SHA-256 and limits, exclusion
    /// from artifacts and retention, built-in harness placements, placement in a real run with integrity checking,
    /// manifests, and the MCP tools.
    /// </summary>
    public static class AssetSuite
    {
        #region Public-Methods

        /// <summary>
        /// Build the suites.
        /// </summary>
        /// <returns>Suites.</returns>
        public static List<TestSuiteDescriptor> Build()
        {
            List<TestSuiteDescriptor> suites = new List<TestSuiteDescriptor>();
            foreach (DatabaseTypeEnum provider in TestEnvironment.Providers())
            {
                string id = "assets-" + provider.ToString().ToLowerInvariant();
                List<TestCaseDescriptor> cases = new List<TestCaseDescriptor>();
                cases.Add(new TestCaseDescriptor(id, "crud-validation", "Create, read by name, update, AssetTemplateRequired, kind and store immutability, AssetInUse, 403, and 404 across tenants (" + provider + ")", ct => CrudAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "storage-database", "Database store: versions with SHA-256, idempotent re-upload, octet-stream upload, limits answer 413 naming the setting, macro formats refused, absent from artifacts, kept after retention (" + provider + ")", ct => StorageDatabaseAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "storage-filesystem", "Filesystem store: content under .garrison-assets/, readable and verified, absent from artifacts (" + provider + ")", ct => StorageFilesystemAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "placements", "Every built-in harness profile places skills, reference files, and document templates at its documented path, and listed assets appear in the system prompt through the protected fragment (" + provider + ")", ct => PlacementsAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "run-integrity", "A fake-harness run reads a placed asset file; tampered content fails the next run before launch with AssetIntegrityFailed (" + provider + ")", ct => RunIntegrityAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "manifests", "AgentAsset documents with inline text apply, export, and re-apply unchanged; agent assets pins; binary content exports as a reference with a note and AssetContentMissing in another tenant (" + provider + ")", ct => ManifestsAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "mcp", "MCP asset tools for users; run tokens see and call none of the write tools (" + provider + ")", ct => McpAsync(provider, ct)));
                suites.Add(new TestSuiteDescriptor(id, "Agent assets (" + provider + ")", cases));
            }
            return suites;
        }

        /// <summary>
        /// Asset storage in a real S3-compatible store (AD2.2), run by scripts/check-artifact-s3.sh against a temporary
        /// Less3: an asset version is written under .garrison-assets/, read back verified, kept out of artifacts, and
        /// deleted with the asset.
        /// </summary>
        /// <param name="endpoint">S3 endpoint.</param>
        /// <param name="accessKey">Access key.</param>
        /// <param name="secretKey">Secret key.</param>
        /// <param name="bucket">Bucket.</param>
        /// <param name="region">Region.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        public static async Task S3ConformanceAsync(string endpoint, string accessKey, string secretKey, string bucket, string region, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(DatabaseTypeEnum.Sqlite, null, token).ConfigureAwait(false))
            {
                Secret credential = await HttpTestHelpers.SendAsync<Secret>(host.AdminClient, HttpMethod.Post, T(host) + "/secrets", new SecretRequest
                {
                    Name = "asset-s3-credential", Value = Serializer.Serialize(new Garrison.Server.Storage.ArtifactS3Credentials { AccessKey = accessKey, SecretKey = secretKey })
                }, 201, token).ConfigureAwait(false);
                ArtifactStore store = await HttpTestHelpers.SendAsync<ArtifactStore>(host.AdminClient, HttpMethod.Post, T(host) + "/artifact-stores", new ArtifactStore { Name = "asset-s3", Kind = ArtifactStoreKindEnum.S3, SecretId = credential.Id, Endpoint = endpoint, Bucket = bucket, Region = region }, 201, token).ConfigureAwait(false);
                string assets = T(host) + "/agent-assets";
                AgentAsset skill = await HttpTestHelpers.SendAsync<AgentAsset>(host.AdminClient, HttpMethod.Post, assets, new AgentAsset { Name = "s3-skill", Kind = AgentAssetKindEnum.Skill, ArtifactStoreId = store.Id }, 201, token).ConfigureAwait(false);
                AgentAssetVersion version = await HttpTestHelpers.SendAsync<AgentAssetVersion>(host.AdminClient, HttpMethod.Post, assets + "/" + skill.Id + "/versions", Upload("SKILL.md", "# S3 skill"), 201, token).ConfigureAwait(false);
                Assert.True(version.Files[0].StorageKey.StartsWith(".garrison-assets/", StringComparison.Ordinal), "Stored under the reserved prefix");
                byte[] read = await ReadFileAsync(host.AdminClient, assets + "/" + skill.Id + "/versions/1/files?path=SKILL.md", token).ConfigureAwait(false);
                Assert.Equal("# S3 skill", Encoding.UTF8.GetString(read), "S3 content reads back verified");
                EnumerationResult<Artifact> artifacts = await HttpTestHelpers.SendAsync<EnumerationResult<Artifact>>(host.AdminClient, HttpMethod.Get, T(host) + "/artifacts", null, 200, token).ConfigureAwait(false);
                Assert.Equal(0, artifacts.Objects.Count, "Assets never appear as artifacts");
                Assert.Equal(204, (await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Delete, assets + "/" + skill.Id, null, token).ConfigureAwait(false)).StatusCode, "Deleted with its S3 content");
            }
        }

        #endregion

        #region Private-Methods

        private static string T(TestServerHost host)
        {
            return "/v1.0/api/tenants/" + host.TenantId;
        }

        private static void Code(TestResponse response, int status, string code, string what)
        {
            Assert.Equal(status, response.StatusCode, what + " status (" + response.Body + ")");
            Assert.True(response.Body.Contains(code, StringComparison.Ordinal), what + " answers " + code + ": " + response.Body);
        }

        private static string Sha(byte[] content)
        {
            return Convert.ToHexString(SHA256.HashData(content)).ToLowerInvariant();
        }

        private static AgentAssetVersionUpload Upload(params string[] pathsAndTexts)
        {
            AgentAssetVersionUpload upload = new AgentAssetVersionUpload();
            for (int i = 0; i + 1 < pathsAndTexts.Length; i += 2)
            {
                upload.Files.Add(new AgentAssetFile { Path = pathsAndTexts[i], ContentBase64 = Convert.ToBase64String(Encoding.UTF8.GetBytes(pathsAndTexts[i + 1])) });
            }
            return upload;
        }

        private static async Task<byte[]> ReadFileAsync(HttpClient client, string url, CancellationToken token)
        {
            using (HttpResponseMessage response = await client.GetAsync(url, token).ConfigureAwait(false))
            {
                Assert.Equal(200, (int)response.StatusCode, "Read " + url + ": " + await response.Content.ReadAsStringAsync(token).ConfigureAwait(false));
                return await response.Content.ReadAsByteArrayAsync(token).ConfigureAwait(false);
            }
        }

        private static async Task CrudAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                string assets = T(host) + "/agent-assets";
                AgentAsset style = await HttpTestHelpers.SendAsync<AgentAsset>(host.AdminClient, HttpMethod.Post, assets, new AgentAsset { Name = "style-guide", Kind = AgentAssetKindEnum.ReferenceFile, Description = "House style", Tags = new List<string> { "docs" } }, 201, token).ConfigureAwait(false);
                Assert.Equal(0, style.CurrentVersion, "No version yet");
                AgentAsset byName = await HttpTestHelpers.SendAsync<AgentAsset>(host.AdminClient, HttpMethod.Get, assets + "/style-guide", null, 200, token).ConfigureAwait(false);
                Assert.Equal(style.Id, byName.Id, "Read by name");
                Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, assets, new AgentAsset { Name = "style-guide", Kind = AgentAssetKindEnum.ReferenceFile }, token).ConfigureAwait(false), 409, "NameConflict", "Duplicate name");
                Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, assets, new AgentAsset { Name = "system-one", Kind = AgentAssetKindEnum.SystemPrompt }, token).ConfigureAwait(false), 400, "AssetTemplateRequired", "SystemPrompt without a template");
                Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, assets, new AgentAsset { Name = "Bad Name", Kind = AgentAssetKindEnum.Skill }, token).ConfigureAwait(false), 400, "name", "Invalid name");
                PromptTemplate system = await HttpTestHelpers.SendAsync<PromptTemplate>(host.AdminClient, HttpMethod.Post, T(host) + "/prompt-templates", new PromptTemplateRequest { Name = "asset-system", Kind = PromptTemplateKindEnum.System, Content = "You write in the house style." }, 201, token).ConfigureAwait(false);
                AgentAsset prompt = await HttpTestHelpers.SendAsync<AgentAsset>(host.AdminClient, HttpMethod.Post, assets, new AgentAsset { Name = "system-one", Kind = AgentAssetKindEnum.SystemPrompt, PromptTemplateId = system.Id }, 201, token).ConfigureAwait(false);
                Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, assets + "/" + prompt.Id + "/versions", Upload("a.md", "x"), token).ConfigureAwait(false), 400, "AssetHasNoFiles", "SystemPrompt assets have no files");

                style.Kind = AgentAssetKindEnum.Skill;
                Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Put, assets + "/" + style.Id, style, token).ConfigureAwait(false), 409, "AssetKindImmutable", "Kind change");
                style.Kind = AgentAssetKindEnum.ReferenceFile;
                style.Description = "House style, second edition";
                AgentAsset updated = await HttpTestHelpers.SendAsync<AgentAsset>(host.AdminClient, HttpMethod.Put, assets + "/" + style.Id, style, 200, token).ConfigureAwait(false);
                Assert.Equal("House style, second edition", updated.Description, "Description updated");
                await HttpTestHelpers.SendAsync<AgentAssetVersion>(host.AdminClient, HttpMethod.Post, assets + "/" + style.Id + "/versions", Upload("guide.md", "Write plainly."), 201, token).ConfigureAwait(false);
                ArtifactStore store = await HttpTestHelpers.SendAsync<ArtifactStore>(host.AdminClient, HttpMethod.Post, T(host) + "/artifact-stores", new ArtifactStore { Name = "asset-db", Kind = ArtifactStoreKindEnum.Database }, 201, token).ConfigureAwait(false);
                updated.ArtifactStoreId = store.Id;
                Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Put, assets + "/" + style.Id, updated, token).ConfigureAwait(false), 409, "AssetStoreImmutable", "Store change after versions");

                // A revision that pins the asset keeps it from being deleted.
                Agent agent = await HttpTestHelpers.SendAsync<Agent>(host.AdminClient, HttpMethod.Post, T(host) + "/agents", new Agent { Name = "asset-user" }, 201, token).ConfigureAwait(false);
                AgentRevision draft = await HttpTestHelpers.SendAsync<AgentRevision>(host.AdminClient, HttpMethod.Post, T(host) + "/agents/" + agent.Id + "/revisions", new AgentRevision { AssetPins = new List<AgentRevisionAssetPin> { new AgentRevisionAssetPin { AssetId = "style-guide" } } }, 201, token).ConfigureAwait(false);
                Assert.Equal(style.Id, draft.AssetPins[0].AssetId, "Pin by name resolves to the identifier");
                Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, T(host) + "/agents/" + agent.Id + "/revisions", new AgentRevision { AssetPins = new List<AgentRevisionAssetPin> { new AgentRevisionAssetPin { AssetId = "style-guide", Version = 9 } } }, token).ConfigureAwait(false), 400, "assetPins[0].version", "Missing pinned version");
                Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Delete, assets + "/" + style.Id, null, token).ConfigureAwait(false), 409, "AssetInUse", "Delete while pinned");
                await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Delete, T(host) + "/agents/" + agent.Id + "/revisions/" + draft.Id, null, token).ConfigureAwait(false);
                Assert.Equal(204, (await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Delete, assets + "/" + style.Id, null, token).ConfigureAwait(false)).StatusCode, "Delete once unpinned");
                Assert.Equal(404, (await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Get, assets + "/" + style.Id, null, token).ConfigureAwait(false)).StatusCode, "Gone");

                // RBAC and isolation.
                User viewer = await HttpTestHelpers.SendAsync<User>(host.AdminClient, HttpMethod.Post, T(host) + "/users", new UserRequest { Email = "asset-viewer@example.com", Password = "password123" }, 201, token).ConfigureAwait(false);
                await HttpTestHelpers.SendAsync<UserRoleAssignment>(host.AdminClient, HttpMethod.Post, T(host) + "/user-role-assignments", new AssignmentRequest { UserId = viewer.Id, RoleName = "Viewer" }, 201, token).ConfigureAwait(false);
                using (HttpClient client = await host.UserClientAsync("asset-viewer@example.com", "password123", host.TenantId, token).ConfigureAwait(false))
                {
                    await HttpTestHelpers.SendAsync<EnumerationResult<AgentAsset>>(client, HttpMethod.Get, assets, null, 200, token).ConfigureAwait(false);
                    Assert.Equal(403, (await HttpTestHelpers.SendAsync(client, HttpMethod.Post, assets, new AgentAsset { Name = "viewer-made", Kind = AgentAssetKindEnum.Skill }, token).ConfigureAwait(false)).StatusCode, "Viewers cannot create");
                    Assert.Equal(403, (await HttpTestHelpers.SendAsync(client, HttpMethod.Post, assets + "/" + prompt.Id + "/versions", Upload("a.md", "x"), token).ConfigureAwait(false)).StatusCode, "Viewers cannot upload");
                }
                Tenant other = await HttpTestHelpers.SendAsync<Tenant>(host.AdminClient, HttpMethod.Post, "/v1.0/api/tenants", new TenantRequest { Name = "Assets Other" }, 201, token).ConfigureAwait(false);
                await HttpTestHelpers.SendAsync<User>(host.AdminClient, HttpMethod.Post, "/v1.0/api/tenants/" + other.Id + "/users", new UserRequest { Email = "asset-outsider@example.com", Password = "password123", IsTenantAdmin = true }, 201, token).ConfigureAwait(false);
                using (HttpClient outsider = await host.UserClientAsync("asset-outsider@example.com", "password123", other.Id, token).ConfigureAwait(false))
                {
                    Assert.Equal(404, (await HttpTestHelpers.SendAsync(outsider, HttpMethod.Get, assets + "/" + prompt.Id, null, token).ConfigureAwait(false)).StatusCode, "Another tenant's asset by path");
                    Assert.Equal(404, (await HttpTestHelpers.SendAsync(outsider, HttpMethod.Get, "/v1.0/api/tenants/" + other.Id + "/agent-assets/" + prompt.Id, null, token).ConfigureAwait(false)).StatusCode, "Another tenant's asset through their tenant");
                    EnumerationResult<AgentAsset> theirs = await HttpTestHelpers.SendAsync<EnumerationResult<AgentAsset>>(outsider, HttpMethod.Get, "/v1.0/api/tenants/" + other.Id + "/agent-assets", null, 200, token).ConfigureAwait(false);
                    Assert.Equal(0, theirs.Objects.Count(a => a.Name != "agent-architect-skills"), "Other tenants list none of ours (only their own seeded architect skill)");
                }
            }
        }

        private static async Task StorageDatabaseAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                string assets = T(host) + "/agent-assets";
                AgentAsset skill = await HttpTestHelpers.SendAsync<AgentAsset>(host.AdminClient, HttpMethod.Post, assets, new AgentAsset { Name = "citation-style", Kind = AgentAssetKindEnum.Skill }, 201, token).ConfigureAwait(false);
                AgentAssetVersion one = await HttpTestHelpers.SendAsync<AgentAssetVersion>(host.AdminClient, HttpMethod.Post, assets + "/" + skill.Id + "/versions", Upload("SKILL.md", "# Citations\nUse author-date.", "examples/sample.md", "Smith (2020)"), 201, token).ConfigureAwait(false);
                Assert.Equal(1, one.Number, "Version 1");
                Assert.Equal(2, one.Files.Count, "Two files");
                AgentAssetFile skillFile = one.Files.First(f => f.Path == "SKILL.md");
                Assert.Equal(Sha(Encoding.UTF8.GetBytes("# Citations\nUse author-date.")), skillFile.Sha256, "SHA-256 recorded");
                Assert.Equal("text/markdown", skillFile.MediaType, "Media type guessed");
                Assert.True(skillFile.StorageKey.StartsWith(".garrison-assets/", StringComparison.Ordinal), "Stored under the reserved prefix");
                byte[] read = await ReadFileAsync(host.AdminClient, assets + "/" + skill.Id + "/versions/1/files?path=SKILL.md", token).ConfigureAwait(false);
                Assert.Equal("# Citations\nUse author-date.", Encoding.UTF8.GetString(read), "Content reads back");

                // The same files again return version 1; different content makes version 2.
                AgentAssetVersion again = await HttpTestHelpers.SendAsync<AgentAssetVersion>(host.AdminClient, HttpMethod.Post, assets + "/" + skill.Id + "/versions", Upload("SKILL.md", "# Citations\nUse author-date.", "examples/sample.md", "Smith (2020)"), 200, token).ConfigureAwait(false);
                Assert.Equal(1, again.Number, "Idempotent re-upload");
                using (ByteArrayContent raw = new ByteArrayContent(Encoding.UTF8.GetBytes("# Citations\nUse numbered notes.")))
                {
                    raw.Headers.ContentType = new MediaTypeHeaderValue("application/octet-stream");
                    using (HttpResponseMessage response = await host.AdminClient.PostAsync(assets + "/" + skill.Id + "/versions?path=SKILL.md&changeNote=Numbered", raw, token).ConfigureAwait(false))
                    {
                        string body = await response.Content.ReadAsStringAsync(token).ConfigureAwait(false);
                        Assert.Equal(201, (int)response.StatusCode, "Octet-stream upload: " + body);
                        AgentAssetVersion two = Assert.NotNull(Serializer.Deserialize<AgentAssetVersion>(body), "Version 2");
                        Assert.Equal(2, two.Number, "Version 2");
                        Assert.Equal("Numbered", two.ChangeNote, "Change note");
                    }
                }
                List<AgentAssetVersion> versions = await HttpTestHelpers.SendAsync<List<AgentAssetVersion>>(host.AdminClient, HttpMethod.Get, assets + "/" + skill.Id + "/versions", null, 200, token).ConfigureAwait(false);
                Assert.Equal("2,1", String.Join(",", versions.Select(v => v.Number)), "Newest first");

                // Limits and refused formats.
                host.Server.Context.Settings.Assets.MaxFileBytes = 1024;
                Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, assets + "/" + skill.Id + "/versions", Upload("big.txt", new string('x', 2048)), token).ConfigureAwait(false), 413, "Assets.MaxFileBytes", "File over the limit");
                host.Server.Context.Settings.Assets.MaxFileBytes = 16777216;
                host.Server.Context.Settings.Assets.MaxFilesPerVersion = 1;
                Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, assets + "/" + skill.Id + "/versions", Upload("a.md", "a", "b.md", "b"), token).ConfigureAwait(false), 413, "Assets.MaxFilesPerVersion", "Too many files");
                host.Server.Context.Settings.Assets.MaxFilesPerVersion = 200;
                host.Server.Context.Settings.Assets.MaxVersionBytes = 1024;
                Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, assets + "/" + skill.Id + "/versions", Upload("a.md", new string('a', 800), "b.md", new string('b', 800)), token).ConfigureAwait(false), 413, "Assets.MaxVersionBytes", "Version over the limit");
                host.Server.Context.Settings.Assets.MaxVersionBytes = 67108864;
                Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, assets + "/" + skill.Id + "/versions", Upload("template.dotm", "macro"), token).ConfigureAwait(false), 400, "MacroFormatRefused", "Macro-enabled template");
                Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, assets + "/" + skill.Id + "/versions", Upload("../escape.md", "x"), token).ConfigureAwait(false), 400, "InvalidAssetPath", "Path traversal");

                // Not artifacts, and untouched by retention.
                EnumerationResult<Artifact> artifacts = await HttpTestHelpers.SendAsync<EnumerationResult<Artifact>>(host.AdminClient, HttpMethod.Get, T(host) + "/artifacts", null, 200, token).ConfigureAwait(false);
                Assert.Equal(0, artifacts.Objects.Count, "Assets never appear as artifacts");
                MaintenanceService maintenance = host.Server.Context.Get<MaintenanceService>();
                maintenance.RunRetentionDays = () => 1;
                await maintenance.ApplyRetentionAsync(token).ConfigureAwait(false);
                byte[] kept = await ReadFileAsync(host.AdminClient, assets + "/" + skill.Id + "/versions/1/files?path=examples/sample.md", token).ConfigureAwait(false);
                Assert.Equal("Smith (2020)", Encoding.UTF8.GetString(kept), "Content kept after retention");
            }
        }

        private static async Task StorageFilesystemAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            string root = Path.Combine(Path.GetTempPath(), "garrison-asset-store-" + Guid.NewGuid().ToString("N"));
            try
            {
                await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
                {
                    host.Settings.Artifacts.RootDirectory = root;
                    ArtifactStore store = await HttpTestHelpers.SendAsync<ArtifactStore>(host.AdminClient, HttpMethod.Post, T(host) + "/artifact-stores", new ArtifactStore { Name = "asset-files", Kind = ArtifactStoreKindEnum.Filesystem }, 201, token).ConfigureAwait(false);
                    string assets = T(host) + "/agent-assets";
                    AgentAsset template = await HttpTestHelpers.SendAsync<AgentAsset>(host.AdminClient, HttpMethod.Post, assets, new AgentAsset { Name = "report-template", Kind = AgentAssetKindEnum.DocumentTemplate, ArtifactStoreId = store.Id }, 201, token).ConfigureAwait(false);
                    byte[] docx = new byte[] { 0x50, 0x4b, 0x03, 0x04, 1, 2, 3, 4, 5 };
                    AgentAssetVersionUpload upload = new AgentAssetVersionUpload();
                    upload.Files.Add(new AgentAssetFile { Path = "report.dotx", ContentBase64 = Convert.ToBase64String(docx) });
                    AgentAssetVersion version = await HttpTestHelpers.SendAsync<AgentAssetVersion>(host.AdminClient, HttpMethod.Post, assets + "/" + template.Id + "/versions", upload, 201, token).ConfigureAwait(false);
                    AgentAssetFile file = version.Files[0];
                    string onDisk = Path.Combine(root, (store.Id + "/" + file.StorageKey).Replace('/', Path.DirectorySeparatorChar));
                    Assert.True(File.Exists(onDisk), "Content stored on disk under .garrison-assets/: " + onDisk);
                    Assert.True(onDisk.Contains(".garrison-assets", StringComparison.Ordinal), "Reserved prefix on disk");
                    byte[] read = await ReadFileAsync(host.AdminClient, assets + "/" + template.Id + "/versions/1/files?path=report.dotx", token).ConfigureAwait(false);
                    Assert.Equal(Sha(docx), Sha(read), "Binary reads back intact");
                    EnumerationResult<Artifact> artifacts = await HttpTestHelpers.SendAsync<EnumerationResult<Artifact>>(host.AdminClient, HttpMethod.Get, T(host) + "/artifacts", null, 200, token).ConfigureAwait(false);
                    Assert.Equal(0, artifacts.Objects.Count, "Assets never appear as artifacts");

                    // Tampering is caught when the content is read.
                    await File.WriteAllBytesAsync(onDisk, new byte[] { 9, 9, 9 }, token).ConfigureAwait(false);
                    using (HttpResponseMessage response = await host.AdminClient.GetAsync(assets + "/" + template.Id + "/versions/1/files?path=report.dotx", token).ConfigureAwait(false))
                    {
                        Assert.True((int)response.StatusCode >= 400, "Tampered content is not served");
                    }
                }
            }
            finally
            {
                try
                {
                    if (Directory.Exists(root)) Directory.Delete(root, true);
                }
                catch (IOException)
                {
                }
            }
        }

        private static async Task PlacementsAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                string assets = T(host) + "/agent-assets";
                List<string> ids = new List<string>();
                foreach (KeyValuePair<string, AgentAssetKindEnum> pair in new Dictionary<string, AgentAssetKindEnum> { ["cite-skill"] = AgentAssetKindEnum.Skill, ["glossary"] = AgentAssetKindEnum.ReferenceFile, ["letterhead"] = AgentAssetKindEnum.DocumentTemplate })
                {
                    AgentAsset asset = await HttpTestHelpers.SendAsync<AgentAsset>(host.AdminClient, HttpMethod.Post, assets, new AgentAsset { Name = pair.Key, Kind = pair.Value, Description = "Placement test " + pair.Key }, 201, token).ConfigureAwait(false);
                    await HttpTestHelpers.SendAsync<AgentAssetVersion>(host.AdminClient, HttpMethod.Post, assets + "/" + asset.Id + "/versions", Upload(pair.Value == AgentAssetKindEnum.Skill ? "SKILL.md" : "file.md", "content of " + pair.Key), 201, token).ConfigureAwait(false);
                    ids.Add(asset.Id);
                }
                Agent agent = await HttpTestHelpers.SendAsync<Agent>(host.AdminClient, HttpMethod.Post, T(host) + "/agents", new Agent { Name = "placed" }, 201, token).ConfigureAwait(false);
                AgentRevision draft = await HttpTestHelpers.SendAsync<AgentRevision>(host.AdminClient, HttpMethod.Post, T(host) + "/agents/" + agent.Id + "/revisions", new AgentRevision { AssetPins = ids.Select(i => new AgentRevisionAssetPin { AssetId = i }).ToList() }, 201, token).ConfigureAwait(false);
                await HttpTestHelpers.SendAsync<AgentRevision>(host.AdminClient, HttpMethod.Post, T(host) + "/agents/" + agent.Id + "/revisions/" + draft.Id + "/publish", null, 200, token).ConfigureAwait(false);

                PromptTemplate fragment = Assert.NotNull(await host.Server.Context.Database.PromptTemplates.ReadByNameAsync(host.TenantId, "builtin/agent-assets-instructions", token).ConfigureAwait(false), "Fragment seeded");
                Assert.True(fragment.IsBuiltIn && fragment.IsProtected, "Fragment is a protected built-in");

                InvocationCompiler compiler = host.Server.Context.Get<InvocationCompiler>();
                Dictionary<string, string> skillPaths = new Dictionary<string, string>
                {
                    ["builtin/claude-code"] = ".claude/skills/cite-skill/SKILL.md",
                    ["builtin/codex"] = "assets/cite-skill/SKILL.md",
                    ["builtin/codex-app-server"] = "assets/cite-skill/SKILL.md",
                    ["builtin/gemini-cli"] = "assets/cite-skill/SKILL.md",
                    ["builtin/mux"] = "assets/cite-skill/SKILL.md",
                    ["builtin/fake"] = "assets/cite-skill/SKILL.md",
                    ["builtin/generic-jsonl"] = "assets/cite-skill/SKILL.md",
                    ["builtin/provider-api"] = "assets/cite-skill/SKILL.md"
                };
                int compiled = 0;
                foreach (KeyValuePair<string, string> expected in skillPaths)
                {
                    HarnessProfile? profile = await host.Server.Context.Database.HarnessProfiles.ReadByNameAsync(host.TenantId, expected.Key, token).ConfigureAwait(false);
                    Assert.NotNull(profile, "Profile " + expected.Key);
                    Assert.Equal(3, profile!.AssetPlacements.Count, expected.Key + " seeds a placement per file kind");
                    HarnessAssetPlacement skillPlacement = profile.AssetPlacements.First(p => p.Kind == AgentAssetKindEnum.Skill);
                    Assert.Equal(expected.Value, skillPlacement.PathTemplate.Replace("{{asset.name}}", "cite-skill", StringComparison.Ordinal) + "/SKILL.md", expected.Key + " skill placement");
                    Deployment candidate = new Deployment { TenantId = host.TenantId, Name = "placed-" + profile.Name.Replace("builtin/", String.Empty, StringComparison.Ordinal), AgentId = agent.Id, HarnessProfileId = profile.Id };
                    Garrison.Core.Services.DefaultPromptBindings.Apply(candidate);
                    Deployment deployment = await host.Server.Context.Database.Deployments.CreateAsync(candidate, token).ConfigureAwait(false);
                    CompilationResult result;
                    try
                    {
                        result = await compiler.PreviewAsync(host.TenantId, deployment.Id, "hello", null, token).ConfigureAwait(false);
                    }
                    catch (CompilationException e) when (e.Code != "InvalidAssetPlacement")
                    {
                        // A profile that needs credentials or parameters this test does not give still has its placement
                        // checked above.
                        continue;
                    }
                    compiled++;
                    List<string> paths = result.Spec.AssetFiles.Select(f => f.Path).OrderBy(p => p, StringComparer.Ordinal).ToList();
                    Assert.True(paths.Contains(expected.Value), expected.Key + " places the skill at " + expected.Value + ": " + String.Join(", ", paths));
                    Assert.True(paths.Contains("assets/glossary/file.md"), expected.Key + " places the reference file");
                    Assert.True(paths.Contains("assets/letterhead/file.md"), expected.Key + " places the document template");
                    string system = String.Join("\n", result.Spec.Files.Select(f => f.Content)) + "\n" + (result.Spec.Stdin ?? String.Empty) + "\n" + String.Join("\n", result.Spec.Arguments);
                    Assert.True(system.Contains("assets/glossary", StringComparison.Ordinal) && system.Contains("reference file", StringComparison.Ordinal), expected.Key + " lists the reference file in the system prompt: " + system.Substring(0, Math.Min(600, system.Length)));
                    Assert.True(system.Contains(expected.Value.Substring(0, expected.Value.LastIndexOf('/')), StringComparison.Ordinal), expected.Key + " lists the skill directory");
                }
                Assert.True(compiled >= 1, "At least the fake profile compiles");
            }
        }

        private static async Task RunIntegrityAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestCluster cluster = await TestCluster.StartAsync(provider, 1, token).ConfigureAwait(false))
            {
                TestServerHost host = cluster.Server;
                string assets = T(host) + "/agent-assets";
                AgentAsset notes = await HttpTestHelpers.SendAsync<AgentAsset>(host.AdminClient, HttpMethod.Post, assets, new AgentAsset { Name = "run-notes", Kind = AgentAssetKindEnum.ReferenceFile }, 201, token).ConfigureAwait(false);
                AgentAssetVersion version = await HttpTestHelpers.SendAsync<AgentAssetVersion>(host.AdminClient, HttpMethod.Post, assets + "/" + notes.Id + "/versions", Upload("notes.md", "ASSET-PLACED-OK"), 201, token).ConfigureAwait(false);
                Agent agent = await cluster.CreateAgentAsync("asset-runner", "builtin/fake", null, token, d => d.Parameters.Add(new DeploymentParameter { Name = "scenario", Value = "assets/run-notes/notes.md" })).ConfigureAwait(false);
                AgentRevision draft = await HttpTestHelpers.SendAsync<AgentRevision>(host.AdminClient, HttpMethod.Post, T(host) + "/agents/" + agent.Id + "/revisions", new AgentRevision { AssetPins = new List<AgentRevisionAssetPin> { new AgentRevisionAssetPin { AssetId = notes.Id } } }, 201, token).ConfigureAwait(false);
                await HttpTestHelpers.SendAsync<AgentRevision>(host.AdminClient, HttpMethod.Post, T(host) + "/agents/" + agent.Id + "/revisions/" + draft.Id + "/publish", null, 200, token).ConfigureAwait(false);

                InvokeRequest invoke = new InvokeRequest { Input = "read the notes", Wait = true, WaitSeconds = 60 };
                Run run = await HttpTestHelpers.SendAsync<Run>(host.AdminClient, HttpMethod.Post, T(host) + "/agents/" + agent.Id + "/invoke", invoke, 200, token).ConfigureAwait(false);
                Assert.Equal(RunStatusEnum.Succeeded, run.Status, "Run succeeded (" + run.Outcome + ": " + run.ErrorMessage + ")");
                Assert.True((run.ResultText ?? String.Empty).Contains("ASSET-PLACED-OK", StringComparison.Ordinal), "The harness read the placed file: " + run.ResultText);

                // Tamper with the stored content: the next run fails before launch.
                Garrison.Core.Database.Ado.AdoDatabaseDriver driver = (Garrison.Core.Database.Ado.AdoDatabaseDriver)host.Server.Context.Database;
                await driver.NonQueryAsync("UPDATE " + driver.Table("agent_asset_blobs") + " SET content = @content WHERE storagekey = @key;", c =>
                {
                    Garrison.Core.Database.Ado.AdoDatabaseDriver.Add(c, "content", Encoding.UTF8.GetBytes("TAMPERED"));
                    Garrison.Core.Database.Ado.AdoDatabaseDriver.Add(c, "key", version.Files[0].StorageKey);
                }, token).ConfigureAwait(false);
                Run tampered = await HttpTestHelpers.SendAsync<Run>(host.AdminClient, HttpMethod.Post, T(host) + "/agents/" + agent.Id + "/invoke", invoke, 200, token).ConfigureAwait(false);
                Assert.Equal(RunStatusEnum.Failed, tampered.Status, "Tampered run failed");
                Assert.Equal(RunOutcomeEnum.AssetIntegrityFailed, tampered.Outcome, "Outcome AssetIntegrityFailed (" + tampered.ErrorMessage + ")");
                Assert.True(!(tampered.ResultText ?? String.Empty).Contains("TAMPERED", StringComparison.Ordinal), "The harness never saw tampered content");
            }
        }

        private static async Task ManifestsAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                string bundle = String.Join("\n", new[]
                {
                    "apiVersion: garrison/v1",
                    "kind: AgentAsset",
                    "metadata: { name: tone-skill }",
                    "spec:",
                    "  kind: Skill",
                    "  description: Keep a calm tone",
                    "  files:",
                    "    - path: SKILL.md",
                    "      content: |",
                    "        # Tone",
                    "        Write calmly.",
                    "---",
                    "apiVersion: garrison/v1",
                    "kind: Agent",
                    "metadata: { name: calm-writer }",
                    "spec:",
                    "  description: Writes calmly",
                    "  assets: [ { asset: tone-skill } ]",
                    ""
                });
                ManifestApply dry = await ApplyAsync(host.AdminClient, host.TenantId, bundle, "?dryRun=true", 200, token).ConfigureAwait(false);
                Assert.Equal(0, dry.FailedCount, "Dry run passes: " + Serializer.Serialize(dry));
                ManifestApply applied = await ApplyAsync(host.AdminClient, host.TenantId, bundle, String.Empty, 200, token).ConfigureAwait(false);
                Assert.Equal(2, applied.CreatedCount, "Asset and agent created: " + Serializer.Serialize(applied));
                AgentAsset asset = Assert.NotNull(await host.Server.Context.Database.AgentAssets.ReadByNameAsync(host.TenantId, "tone-skill", token).ConfigureAwait(false), "Asset");
                Assert.Equal(1, asset.CurrentVersion, "Version 1 from the document");
                Agent agent = Assert.NotNull(await host.Server.Context.Database.Agents.ReadByNameAsync(host.TenantId, "calm-writer", token).ConfigureAwait(false), "Agent");
                AgentRevision latest = Assert.NotNull(await host.Server.Context.Database.AgentRevisions.ReadAsync(host.TenantId, agent.LatestPublishedRevisionId ?? "none", token).ConfigureAwait(false), "Latest revision");
                Assert.Equal(asset.Id, latest.AssetPins.Single().AssetId, "Latest revision pins the asset");
                ManifestApply again = await ApplyAsync(host.AdminClient, host.TenantId, bundle, String.Empty, 200, token).ConfigureAwait(false);
                Assert.Equal(2, again.UnchangedCount, "Re-apply unchanged: " + Serializer.Serialize(again));

                // A direct edit keeps the pins.
                agent.Description = "Writes very calmly";
                await HttpTestHelpers.SendAsync<Agent>(host.AdminClient, HttpMethod.Put, T(host) + "/agents/" + agent.Id, agent, 200, token).ConfigureAwait(false);
                Agent edited = Assert.NotNull(await host.Server.Context.Database.Agents.ReadAsync(host.TenantId, agent.Id, token).ConfigureAwait(false), "Agent");
                AgentRevision afterEdit = Assert.NotNull(await host.Server.Context.Database.AgentRevisions.ReadAsync(host.TenantId, edited.LatestPublishedRevisionId ?? "none", token).ConfigureAwait(false), "Revision after edit");
                Assert.Equal(1, afterEdit.AssetPins.Count, "A direct edit carries the asset pins over");

                // A binary file exports by reference with a note.
                AgentAsset template = await HttpTestHelpers.SendAsync<AgentAsset>(host.AdminClient, HttpMethod.Post, T(host) + "/agent-assets", new AgentAsset { Name = "doc-template", Kind = AgentAssetKindEnum.DocumentTemplate }, 201, token).ConfigureAwait(false);
                AgentAssetVersionUpload binary = new AgentAssetVersionUpload();
                binary.Files.Add(new AgentAssetFile { Path = "report.docx", ContentBase64 = Convert.ToBase64String(new byte[] { 0x50, 0x4b, 3, 4, 0, 1 }) });
                await HttpTestHelpers.SendAsync<AgentAssetVersion>(host.AdminClient, HttpMethod.Post, T(host) + "/agent-assets/" + template.Id + "/versions", binary, 201, token).ConfigureAwait(false);
                string exported = await ExportAsync(host.AdminClient, host.TenantId, "?kinds=AgentAsset", token).ConfigureAwait(false);
                List<ManifestDocument> documents = ManifestParser.Parse(exported);
                ManifestDocument skillDoc = documents.First(d => d.Kind == "AgentAsset" && d.Metadata.Name == "tone-skill");
                Assert.True(Serializer.Serialize(skillDoc.Spec).Contains("Write calmly.", StringComparison.Ordinal), "Text content exported inline");
                ManifestDocument binaryDoc = documents.First(d => d.Kind == "AgentAsset" && d.Metadata.Name == "doc-template");
                string binaryJson = Serializer.Serialize(binaryDoc.Spec);
                Assert.True(binaryJson.Contains("sha256", StringComparison.Ordinal) && binaryJson.Contains("Binary content is not exported", StringComparison.Ordinal), "Binary exported by reference with a note: " + binaryJson);

                // Text-only bundles move to another tenant; a binary reference there is AssetContentMissing.
                Tenant other = await HttpTestHelpers.SendAsync<Tenant>(host.AdminClient, HttpMethod.Post, "/v1.0/api/tenants", new TenantRequest { Name = "Assets Import" }, 201, token).ConfigureAwait(false);
                string agentBundle = await ExportAsync(host.AdminClient, host.TenantId, "?resources=Agent/calm-writer&followReferences=true", token).ConfigureAwait(false);
                ManifestApply imported = await ApplyAsync(host.AdminClient, other.Id, agentBundle, String.Empty, 200, token).ConfigureAwait(false);
                Assert.Equal(0, imported.FailedCount, "Text asset bundle applies to another tenant: " + Serializer.Serialize(imported));
                Assert.NotNull(await host.Server.Context.Database.AgentAssets.ReadByNameAsync(other.Id, "tone-skill", token).ConfigureAwait(false), "Asset imported");
                ManifestApply missing = await ApplyAsync(host.AdminClient, other.Id, exported, "?dryRun=true", 400, token).ConfigureAwait(false);
                Assert.True(missing.Items.Any(i => i.ErrorCode == "AssetContentMissing"), "Binary reference refused: " + Serializer.Serialize(missing));
            }
        }

        private static async Task McpAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                string[] writes = { "garrison_create_agent_asset", "garrison_update_agent_asset", "garrison_upload_agent_asset_version", "garrison_delete_agent_asset" };
                using (TestMcpClient client = new TestMcpClient())
                {
                    await client.ConnectAsync(host, null, token).ConfigureAwait(false);
                    List<string> listed = (await client.ToolsAsync(token).ConfigureAwait(false)).Tools.Select(t => t.Name).ToList();
                    foreach (string name in writes.Concat(new[] { "garrison_list_agent_assets", "garrison_get_agent_asset" })) Assert.True(listed.Contains(name), "User sees " + name);
                    AgentAsset created = await client.CallAsync<AgentAsset>("garrison_create_agent_asset", new { configuration = new AgentAsset { Name = "mcp-skill", Kind = AgentAssetKindEnum.Skill } }, token).ConfigureAwait(false);
                    AgentAssetVersion version = await client.CallAsync<AgentAssetVersion>("garrison_upload_agent_asset_version", new { asset = "mcp-skill", files = new[] { new { path = "SKILL.md", content = "# MCP skill" } } }, token).ConfigureAwait(false);
                    Assert.Equal(1, version.Number, "Uploaded through MCP");
                    EnumerationResult<AgentAsset> page = await client.CallAsync<EnumerationResult<AgentAsset>>("garrison_list_agent_assets", new { kind = "Skill" }, token).ConfigureAwait(false);
                    Assert.True(page.Objects.Any(a => a.Id == created.Id), "Listed by kind");
                    string detail = await client.CallAsync("garrison_get_agent_asset", new { asset = created.Id }, token).ConfigureAwait(false);
                    Assert.True(detail.Contains("SKILL.md", StringComparison.Ordinal), "Detail lists the file");
                    await client.ExpectErrorAsync("garrison_create_agent_asset", new { configuration = new AgentAsset { Name = "mcp-prompt", Kind = AgentAssetKindEnum.SystemPrompt } }, "ValidationFailed", token).ConfigureAwait(false);
                    await client.CallAsync("garrison_delete_agent_asset", new { asset = "mcp-skill" }, token).ConfigureAwait(false);
                    await client.ExpectErrorAsync("garrison_get_agent_asset", new { asset = "mcp-skill" }, "NotFound", token).ConfigureAwait(false);
                }

                Agent agent = await HttpTestHelpers.SendAsync<Agent>(host.AdminClient, HttpMethod.Post, T(host) + "/agents", new Agent { Name = "asset-mcp-run" }, 201, token).ConfigureAwait(false);
                Deployment deployment = await host.Server.Context.Database.Deployments.CreateAsync(new Deployment { TenantId = host.TenantId, Name = "asset-mcp-run", AgentId = agent.Id, HarnessProfileId = "hrn_builtin_fake" }, token).ConfigureAwait(false);
                Run run = await host.Server.Context.Database.Runs.CreateAsync(new Run { TenantId = host.TenantId, AgentId = agent.Id, DeploymentId = deployment.Id, Status = RunStatusEnum.Running, CallerType = PrincipalTypeEnum.Administrator, LeaseEpoch = 1, LeaseExpiresUtc = DateTime.UtcNow.AddMinutes(5) }, token).ConfigureAwait(false);
                string bearer = await host.Server.Context.Authentication.IssueForRunAsync(run, 1, DateTime.UtcNow.AddMinutes(5), token).ConfigureAwait(false);
                using (TestMcpClient client = new TestMcpClient())
                {
                    await client.ConnectAsync(host, bearer, token).ConfigureAwait(false);
                    List<string> listed = (await client.ToolsAsync(token).ConfigureAwait(false)).Tools.Select(t => t.Name).ToList();
                    foreach (string name in writes) Assert.True(!listed.Contains(name), "Run token does not see " + name);
                    await client.ExpectErrorAsync("garrison_create_agent_asset", new { configuration = new AgentAsset { Name = "run-made", Kind = AgentAssetKindEnum.Skill } }, "Forbidden", token).ConfigureAwait(false);
                }
            }
        }

        private static async Task<ManifestApply> ApplyAsync(HttpClient client, string tenantId, string yaml, string query, int expectedStatus, CancellationToken token)
        {
            using (StringContent content = new StringContent(yaml, Encoding.UTF8, "application/yaml"))
            using (HttpResponseMessage response = await client.PostAsync("/v1.0/api/tenants/" + tenantId + "/manifests/apply" + query, content, token).ConfigureAwait(false))
            {
                string body = await response.Content.ReadAsStringAsync(token).ConfigureAwait(false);
                Assert.Equal(expectedStatus, (int)response.StatusCode, "Apply status: " + body);
                return Assert.NotNull(Serializer.Deserialize<ManifestApply>(body), "Apply result");
            }
        }

        private static async Task<string> ExportAsync(HttpClient client, string tenantId, string query, CancellationToken token)
        {
            TestResponse response = await HttpTestHelpers.SendAsync(client, HttpMethod.Get, "/v1.0/api/tenants/" + tenantId + "/manifests/export" + query, null, token).ConfigureAwait(false);
            Assert.Equal(200, response.StatusCode, "Export " + query + ": " + response.Body);
            return response.Body;
        }

        #endregion
    }
}
