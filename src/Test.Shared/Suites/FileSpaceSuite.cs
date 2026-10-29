namespace Test.Shared.Suites
{
    using System;
    using System.Collections.Generic;
    using System.IO;
    using System.IO.Compression;
    using System.Linq;
    using System.Net.Http;
    using System.Net.Http.Headers;
    using System.Net.WebSockets;
    using System.Security.Cryptography;
    using System.Text;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Compilation;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Protocol;
    using Garrison.Core.Requests;
    using Garrison.Core.Responses;
    using Garrison.Core.Serialization;
    using Garrison.Core.Services;
    using Garrison.Server.Services;
    using Garrison.Worker.Execution;
    using Test.Shared.Infrastructure;
    using Touchstone.Core;

    /// <summary>
    /// Conversation file spaces (AD3): resolution across delegation trees, turns, and pipeline stages; optimistic writes
    /// with conflict files; limits; worker sync in and out with lease fencing; the MCP file tools scoped to a run's tree;
    /// the REST routes and the conversation-files channel; and continuation archives that leave the mount path out.
    /// </summary>
    public static class FileSpaceSuite
    {
        #region Public-Methods

        /// <summary>
        /// Build the suites.
        /// </summary>
        /// <returns>Suites.</returns>
        public static List<TestSuiteDescriptor> Build()
        {
            List<TestSuiteDescriptor> suites = new List<TestSuiteDescriptor>();
            List<TestCaseDescriptor> unit = new List<TestCaseDescriptor>();
            unit.Add(new TestCaseDescriptor("filespaces-unit", "conflict-names", "Conflict names put the writer before the extension; worker change detection skips unchanged files and links", UnitAsync));
            unit.Add(new TestCaseDescriptor("filespaces-unit", "snapshot-excludes-mount", "Continuation archives leave the file space mount path out (AD3.7)", SnapshotAsync));
            suites.Add(new TestSuiteDescriptor("filespaces-unit", "Conversation file spaces (unit)", unit));
            foreach (DatabaseTypeEnum provider in TestEnvironment.Providers())
            {
                string id = "filespaces-" + provider.ToString().ToLowerInvariant();
                List<TestCaseDescriptor> cases = new List<TestCaseDescriptor>();
                cases.Add(new TestCaseDescriptor(id, "resolution", "A three-level delegation tree and every conversation turn resolve to one file space (" + provider + ")", ct => ResolutionAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "writes-conflicts-limits", "Writes with the same base give one winner and one conflict file; versions, soft delete, and limits answer 413 naming the setting (" + provider + ")", ct => WritesAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "sync-pipeline", "A stage run writes files/handoff.txt and the next stage, in a fresh workspace, reads it; a stale-epoch upload is refused (" + provider + ")", ct => SyncPipelineAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "conversation-turns", "A conversation turn's file is in the next turn's workspace and in the conversation's file list (" + provider + ")", ct => ConversationTurnsAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "mcp-tools", "garrison_files_* for a run token reach its own tree's space only; users name a conversation or run (" + provider + ")", ct => McpAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "routes-channel", "REST upload, list, content, versions, delete, download URL, 404 across tenants, and conversation-files channel delivery (" + provider + ")", ct => RoutesAsync(provider, ct)));
                suites.Add(new TestSuiteDescriptor(id, "Conversation file spaces (" + provider + ")", cases));
            }
            return suites;
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

        private static async Task UnitAsync(CancellationToken token)
        {
            Assert.Equal("notes/a.run_x.md", FileSpaceService.ConflictPath("notes/a.md", "run_x"), "Tag before the extension");
            Assert.Equal("README.run_x", FileSpaceService.ConflictPath("README", "run_x"), "No extension");
            Assert.Equal(".env.run_x", FileSpaceService.ConflictPath(".env", "run_x"), "Dot file keeps its name");

            string workspace = Path.Combine(Path.GetTempPath(), "garrison-fs-unit-" + Guid.NewGuid().ToString("N"));
            try
            {
                Directory.CreateDirectory(Path.Combine(workspace, "files", "sub"));
                await File.WriteAllTextAsync(Path.Combine(workspace, "files", "same.txt"), "same", token).ConfigureAwait(false);
                await File.WriteAllTextAsync(Path.Combine(workspace, "files", "sub", "new.txt"), "new", token).ConfigureAwait(false);
                await File.WriteAllTextAsync(Path.Combine(workspace, "files", "changed.txt"), "after", token).ConfigureAwait(false);
                await File.WriteAllTextAsync(Path.Combine(workspace, "outside.txt"), "outside", token).ConfigureAwait(false);
                if (!OperatingSystem.IsWindows()) File.CreateSymbolicLink(Path.Combine(workspace, "files", "link.txt"), Path.Combine(workspace, "outside.txt"));
                ExecutionFileSpace space = new ExecutionFileSpace { FileSpaceId = "cfs_test", MountPath = "files" };
                space.Files.Add(new ExecutionFileSpaceFile { Path = "same.txt", Version = 3, Sha256 = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes("same"))).ToLowerInvariant() });
                space.Files.Add(new ExecutionFileSpaceFile { Path = "changed.txt", Version = 2, Sha256 = "0000" });
                List<string> warnings = new List<string>();
                List<FileSpaceChange> changes = await FileSpaceSync.ChangesAsync(workspace, space, warnings.Add, token).ConfigureAwait(false);
                Assert.Equal("changed.txt=2,sub/new.txt=0", String.Join(",", changes.Select(c => c.Path + "=" + c.BaseVersion)), "Changed and new files with their base versions; unchanged files, links, and files outside the mount path are skipped");
            }
            finally
            {
                if (Directory.Exists(workspace)) Directory.Delete(workspace, true);
            }
        }

        private static async Task SnapshotAsync(CancellationToken token)
        {
            string root = Path.Combine(Path.GetTempPath(), "garrison-fs-snap-" + Guid.NewGuid().ToString("N"));
            try
            {
                RunDirectories directories = RunDirectories.For(root, "run_snapshot", new ExecutionSpec());
                directories.Create();
                Directory.CreateDirectory(Path.Combine(directories.Workspace, "files"));
                await File.WriteAllTextAsync(Path.Combine(directories.Workspace, "files", "shared.txt"), "shared", token).ConfigureAwait(false);
                await File.WriteAllTextAsync(Path.Combine(directories.Workspace, "kept.txt"), "kept", token).ConfigureAwait(false);
                using (MemoryStream archive = new MemoryStream())
                {
                    await new WorkspaceSnapshot { ExcludedWorkspaceDirectory = "files" }.CaptureAsync(directories, archive, token).ConfigureAwait(false);
                    archive.Position = 0;
                    using (ZipArchive zip = new ZipArchive(archive, ZipArchiveMode.Read))
                    {
                        List<string> names = zip.Entries.Select(e => e.FullName).ToList();
                        Assert.True(names.Contains("work/kept.txt"), "Other workspace files are archived: " + String.Join(", ", names));
                        Assert.True(!names.Any(n => n.StartsWith("work/files", StringComparison.Ordinal)), "The mount path is left out: " + String.Join(", ", names));
                    }
                }
            }
            finally
            {
                if (Directory.Exists(root)) Directory.Delete(root, true);
            }
        }

        private static async Task ResolutionAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                Agent agent = await HttpTestHelpers.SendAsync<Agent>(host.AdminClient, HttpMethod.Post, T(host) + "/agents", new Agent { Name = "fs-tree" }, 201, token).ConfigureAwait(false);
                Deployment deployment = await host.Server.Context.Database.Deployments.CreateAsync(new Deployment { TenantId = host.TenantId, Name = "fs-tree", AgentId = agent.Id, HarnessProfileId = "hrn_builtin_fake" }, token).ConfigureAwait(false);
                Run root = await host.Server.Context.Database.Runs.CreateAsync(new Run { TenantId = host.TenantId, AgentId = agent.Id, DeploymentId = deployment.Id, Status = RunStatusEnum.Running }, token).ConfigureAwait(false);
                Run child = await host.Server.Context.Database.Runs.CreateAsync(new Run { TenantId = host.TenantId, AgentId = agent.Id, DeploymentId = deployment.Id, ParentRunId = root.Id, RootRunId = root.Id, Depth = 1, Status = RunStatusEnum.Running }, token).ConfigureAwait(false);
                Run grandchild = await host.Server.Context.Database.Runs.CreateAsync(new Run { TenantId = host.TenantId, AgentId = agent.Id, DeploymentId = deployment.Id, ParentRunId = child.Id, RootRunId = root.Id, Depth = 2, Status = RunStatusEnum.Running }, token).ConfigureAwait(false);
                ConversationFileSpace a = await FileSpaceResolver.ResolveAsync(host.Server.Context.Database, root, null, token).ConfigureAwait(false);
                ConversationFileSpace b = await FileSpaceResolver.ResolveAsync(host.Server.Context.Database, child, null, token).ConfigureAwait(false);
                ConversationFileSpace c = await FileSpaceResolver.ResolveAsync(host.Server.Context.Database, grandchild, null, token).ConfigureAwait(false);
                Assert.Equal(a.Id, b.Id, "Child shares the root's space");
                Assert.Equal(a.Id, c.Id, "Grandchild shares the root's space");
                Assert.Equal("run:" + root.Id, a.OwnerKey, "Owned by the root run");

                Run turnOne = new Run { TenantId = host.TenantId, AgentId = agent.Id, ConversationId = "cnv_shared" };
                Run turnTwo = new Run { TenantId = host.TenantId, AgentId = agent.Id, ConversationId = "cnv_shared" };
                ConversationFileSpace first = await FileSpaceResolver.ResolveAsync(host.Server.Context.Database, turnOne, null, token).ConfigureAwait(false);
                ConversationFileSpace second = await FileSpaceResolver.ResolveAsync(host.Server.Context.Database, turnTwo, null, token).ConfigureAwait(false);
                Assert.Equal(first.Id, second.Id, "Turns of a conversation share one space");
                Assert.Equal("cnv:cnv_shared", first.OwnerKey, "Owned by the conversation");
                Assert.True(await host.Server.Context.Database.FileSpaces.ReadAsync("ten_other", first.Id, token).ConfigureAwait(false) == null, "Data layer filters by tenant");
            }
        }

        private static async Task WritesAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                FileSpaceService files = host.Server.Context.Get<FileSpaceService>();
                ConversationFileSpace space = await host.Server.Context.Database.FileSpaces.GetOrCreateAsync(new ConversationFileSpace { TenantId = host.TenantId, OwnerKey = "run:run_writes", RootRunId = "run_writes" }, token).ConfigureAwait(false);
                FileSpaceUploadResult one = await files.WriteAsync(space, "notes/a.md", Encoding.UTF8.GetBytes("first"), null, 0, "run_one", 1, "one", token).ConfigureAwait(false);
                Assert.Equal(1, one.Version, "Version 1");
                Assert.True(!one.Conflict, "No conflict on a new file");

                // Two writers both read version 1.
                FileSpaceUploadResult winner = await files.WriteAsync(space, "notes/a.md", Encoding.UTF8.GetBytes("winner"), null, 1, "run_two", 1, "two", token).ConfigureAwait(false);
                FileSpaceUploadResult loser = await files.WriteAsync(space, "notes/a.md", Encoding.UTF8.GetBytes("loser"), null, 1, "run_three", 1, "three", token).ConfigureAwait(false);
                Assert.True(!winner.Conflict && winner.Version == 2, "First writer wins version 2");
                Assert.True(loser.Conflict, "Second writer conflicts");
                Assert.Equal("notes/a.run_three.md", loser.Path, "Conflict name");
                List<ConversationFile> listed = await host.Server.Context.Database.FileSpaces.ListFilesAsync(host.TenantId, space.Id, false, token).ConfigureAwait(false);
                Assert.Equal("notes/a.md,notes/a.run_three.md", String.Join(",", listed.Select(f => f.Path)), "Both files kept, nothing overwritten");
                ConversationFile main = listed.First(f => f.Path == "notes/a.md");
                Assert.Equal("winner", Encoding.UTF8.GetString((await files.ReadAsync(space, main, null, token).ConfigureAwait(false)).Content), "Winner is current");
                Assert.Equal("first", Encoding.UTF8.GetString((await files.ReadAsync(space, main, 1, token).ConfigureAwait(false)).Content), "Version 1 kept");
                Assert.Equal(2, (await host.Server.Context.Database.FileSpaces.ListVersionsAsync(host.TenantId, main.Id, token).ConfigureAwait(false)).Count, "Two versions");

                Assert.True(await files.DeleteAsync(space, "notes/a.run_three.md", token).ConfigureAwait(false), "Soft delete");
                ConversationFileSpace counted = Assert.NotNull(await host.Server.Context.Database.FileSpaces.ReadAsync(host.TenantId, space.Id, token).ConfigureAwait(false), "Space");
                Assert.Equal(1, counted.FileCount, "Deleted files do not count");
                Assert.Equal(1, (await host.Server.Context.Database.FileSpaces.ListFilesAsync(host.TenantId, space.Id, true, token).ConfigureAwait(false)).Count(f => f.Deleted), "Deleted file still listed when asked");

                host.Server.Context.Settings.FileSpaces.MaxFileBytes = 1024;
                await ExpectTooLargeAsync(() => files.WriteAsync(space, "big.bin", new byte[2048], null, null, null, null, "test", token), "FileSpaces.MaxFileBytes").ConfigureAwait(false);
                host.Server.Context.Settings.FileSpaces.MaxFileBytes = 33554432;
                host.Server.Context.Settings.FileSpaces.MaxFiles = 1;
                await ExpectTooLargeAsync(() => files.WriteAsync(space, "second.txt", new byte[10], null, null, null, null, "test", token), "FileSpaces.MaxFiles").ConfigureAwait(false);
                host.Server.Context.Settings.FileSpaces.MaxFiles = 1000;
                host.Server.Context.Settings.FileSpaces.MaxTotalBytes = 1048576;
                await ExpectTooLargeAsync(() => files.WriteAsync(space, "huge.bin", new byte[1048576], null, null, null, null, "test", token), "FileSpaces.MaxTotalBytes").ConfigureAwait(false);
                try
                {
                    await files.WriteAsync(space, "../escape.txt", new byte[1], null, null, null, null, "test", token).ConfigureAwait(false);
                    throw new TestAssertionException("Traversal was accepted");
                }
                catch (ValidationException e)
                {
                    Assert.Equal("InvalidFilePath", e.Code, "Traversal refused");
                }
            }
        }

        private static async Task ExpectTooLargeAsync(Func<Task> write, string setting)
        {
            try
            {
                await write().ConfigureAwait(false);
            }
            catch (PayloadTooLargeException e)
            {
                Assert.Equal(setting, e.Setting, "Limit names " + setting);
                return;
            }
            throw new TestAssertionException("No 413 for " + setting);
        }

        private static async Task SyncPipelineAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestCluster cluster = await TestCluster.StartAsync(provider, 1, token).ConfigureAwait(false))
            {
                TestServerHost host = cluster.Server;
                Agent writer = await cluster.CreateAgentAsync("fs-writer", "builtin/fake", null, token, d =>
                {
                    d.ArgumentOverrides.Add(new DeploymentArgumentOverride { Position = 0, Template = "--output-last-message" });
                    d.ArgumentOverrides.Add(new DeploymentArgumentOverride { Position = 1, Template = "{{run.workspaceDir}}/files/handoff.txt" });
                }).ConfigureAwait(false);
                Agent reader = await cluster.CreateAgentAsync("fs-reader", "builtin/fake", null, token, d => d.Parameters.Add(new DeploymentParameter { Name = "scenario", Value = "files/handoff.txt" })).ConfigureAwait(false);
                Pipeline pipeline = new Pipeline { Name = "fs-handoff" };
                pipeline.Stages.Add(new PipelineStage { Name = "write", AgentId = writer.Id });
                pipeline.Stages.Add(new PipelineStage { Name = "read", AgentId = reader.Id });
                Pipeline created = await HttpTestHelpers.SendAsync<Pipeline>(host.AdminClient, HttpMethod.Post, T(host) + "/pipelines", pipeline, 201, token).ConfigureAwait(false);
                PipelineRun started = await HttpTestHelpers.SendAsync<PipelineRun>(host.AdminClient, HttpMethod.Post, T(host) + "/pipelines/" + created.Id + "/start", new PipelineStartRequest { Input = "HANDOFF-PAYLOAD" }, 201, token).ConfigureAwait(false);
                PipelineRun done = await WaitPipelineAsync(host, started.Id, token).ConfigureAwait(false);
                Assert.Equal(PipelineRunStatusEnum.Succeeded, done.Status, "Pipeline succeeded (" + done.ErrorMessage + ")");
                Run first = Assert.NotNull(await host.Server.Context.Database.Runs.ReadAsync(host.TenantId, done.Runs.First(r => r.Position == 1).RunId, token).ConfigureAwait(false), "Stage 1 run");
                Run second = Assert.NotNull(await host.Server.Context.Database.Runs.ReadAsync(host.TenantId, done.Runs.First(r => r.Position == 2).RunId, token).ConfigureAwait(false), "Stage 2 run");
                Assert.Equal(first.FileSpaceId, second.FileSpaceId, "Stages of one pipeline run share one space");
                Assert.True((second.ResultText ?? String.Empty).Contains("HANDOFF-PAYLOAD", StringComparison.Ordinal), "Stage 2 read the file stage 1 wrote: " + second.ResultText);
                ConversationFile handoff = Assert.NotNull(await host.Server.Context.Database.FileSpaces.ReadFileAsync(host.TenantId, first.FileSpaceId!, "handoff.txt", token).ConfigureAwait(false), "File in the space");
                List<ConversationFileVersion> versions = await host.Server.Context.Database.FileSpaces.ListVersionsAsync(host.TenantId, handoff.Id, token).ConfigureAwait(false);
                Assert.Equal(first.Id, versions.Last().RunId, "Version 1 written by the stage 1 run");

                // A node that does not hold the lease cannot write.
                try
                {
                    await host.Server.Context.Get<FileSpaceService>().WriteFromNodeAsync(host.TenantId, first.Id, first.LeaseNodeId ?? "node_x", first.LeaseEpoch, first.RepairAttempts, "late.txt", 0, new byte[] { 1 }, token).ConfigureAwait(false);
                    throw new TestAssertionException("A finished run's upload was accepted");
                }
                catch (ConflictException e)
                {
                    Assert.Equal("StaleFileUpload", e.Code, "Stale upload refused");
                }
            }
        }

        private static async Task<PipelineRun> WaitPipelineAsync(TestServerHost host, string id, CancellationToken token)
        {
            DateTime deadline = DateTime.UtcNow.AddSeconds(120);
            while (true)
            {
                PipelineRun run = await HttpTestHelpers.SendAsync<PipelineRun>(host.AdminClient, HttpMethod.Get, T(host) + "/pipeline-runs/" + id, null, 200, token).ConfigureAwait(false);
                if (run.Status != PipelineRunStatusEnum.Running && run.Status != PipelineRunStatusEnum.AwaitingReview) return run;
                if (DateTime.UtcNow > deadline) throw new TestAssertionException("Pipeline run " + id + " did not finish (" + run.Status + ").");
                await Task.Delay(200, token).ConfigureAwait(false);
            }
        }

        private static async Task ConversationTurnsAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestCluster cluster = await TestCluster.StartAsync(provider, 1, token).ConfigureAwait(false))
            {
                TestServerHost host = cluster.Server;
                Agent agent = await cluster.CreateAgentAsync("fs-chat", "builtin/fake", null, token, d =>
                {
                    d.ArgumentOverrides.Add(new DeploymentArgumentOverride { Position = 0, Template = "--output-last-message" });
                    d.ArgumentOverrides.Add(new DeploymentArgumentOverride { Position = 1, Template = "{{run.workspaceDir}}/files/turn.txt" });
                }).ConfigureAwait(false);
                Run first = await HttpTestHelpers.SendAsync<Run>(host.AdminClient, HttpMethod.Post, T(host) + "/agents/" + agent.Id + "/invoke", new InvokeRequest { Input = "first turn", Wait = true, WaitSeconds = 60, StartConversation = true }, 200, token).ConfigureAwait(false);
                Assert.Equal(RunStatusEnum.Succeeded, first.Status, "Turn 1 (" + first.ErrorMessage + ")");
                Assert.True(!String.IsNullOrEmpty(first.ConversationId), "Conversation started");
                FileSpaceListing listing = await HttpTestHelpers.SendAsync<FileSpaceListing>(host.AdminClient, HttpMethod.Get, T(host) + "/conversations/" + first.ConversationId + "/files", null, 200, token).ConfigureAwait(false);
                Assert.True(listing.Files.Any(f => f.Path == "turn.txt" && f.CurrentVersion == 1), "Turn 1's file is in the conversation's space");
                Run second = await HttpTestHelpers.SendAsync<Run>(host.AdminClient, HttpMethod.Post, T(host) + "/agents/" + agent.Id + "/invoke", new InvokeRequest { Input = "second turn", Wait = true, WaitSeconds = 60, ConversationId = first.ConversationId }, 200, token).ConfigureAwait(false);
                Assert.Equal(RunStatusEnum.Succeeded, second.Status, "Turn 2 (" + second.ErrorMessage + ")");
                Assert.Equal(first.FileSpaceId, second.FileSpaceId, "Same space for both turns");
                FileSpaceListing after = await HttpTestHelpers.SendAsync<FileSpaceListing>(host.AdminClient, HttpMethod.Get, T(host) + "/conversations/" + first.ConversationId + "/files", null, 200, token).ConfigureAwait(false);
                Assert.Equal(2, after.Files.Single(f => f.Path == "turn.txt").CurrentVersion, "Turn 2 started from turn 1's version and wrote version 2 without a conflict");
            }
        }

        private static async Task McpAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                Agent agent = await HttpTestHelpers.SendAsync<Agent>(host.AdminClient, HttpMethod.Post, T(host) + "/agents", new Agent { Name = "fs-mcp" }, 201, token).ConfigureAwait(false);
                Deployment deployment = await host.Server.Context.Database.Deployments.CreateAsync(new Deployment { TenantId = host.TenantId, Name = "fs-mcp", AgentId = agent.Id, HarnessProfileId = "hrn_builtin_fake" }, token).ConfigureAwait(false);
                Run parent = await host.Server.Context.Database.Runs.CreateAsync(new Run { TenantId = host.TenantId, AgentId = agent.Id, AgentName = agent.Name, DeploymentId = deployment.Id, Status = RunStatusEnum.Running, CallerType = PrincipalTypeEnum.Administrator, LeaseEpoch = 1, LeaseExpiresUtc = DateTime.UtcNow.AddMinutes(5) }, token).ConfigureAwait(false);
                Run child = await host.Server.Context.Database.Runs.CreateAsync(new Run { TenantId = host.TenantId, AgentId = agent.Id, AgentName = agent.Name, DeploymentId = deployment.Id, ParentRunId = parent.Id, RootRunId = parent.Id, Depth = 1, Status = RunStatusEnum.Running, CallerType = PrincipalTypeEnum.Administrator, LeaseEpoch = 1, LeaseExpiresUtc = DateTime.UtcNow.AddMinutes(5) }, token).ConfigureAwait(false);
                Run stranger = await host.Server.Context.Database.Runs.CreateAsync(new Run { TenantId = host.TenantId, AgentId = agent.Id, AgentName = agent.Name, DeploymentId = deployment.Id, Status = RunStatusEnum.Running, CallerType = PrincipalTypeEnum.Administrator, LeaseEpoch = 1, LeaseExpiresUtc = DateTime.UtcNow.AddMinutes(5) }, token).ConfigureAwait(false);

                using (TestMcpClient childClient = new TestMcpClient())
                using (TestMcpClient parentClient = new TestMcpClient())
                using (TestMcpClient strangerClient = new TestMcpClient())
                {
                    await childClient.ConnectAsync(host, await host.Server.Context.Authentication.IssueForRunAsync(child, 1, DateTime.UtcNow.AddMinutes(5), token).ConfigureAwait(false), token).ConfigureAwait(false);
                    await parentClient.ConnectAsync(host, await host.Server.Context.Authentication.IssueForRunAsync(parent, 1, DateTime.UtcNow.AddMinutes(5), token).ConfigureAwait(false), token).ConfigureAwait(false);
                    await strangerClient.ConnectAsync(host, await host.Server.Context.Authentication.IssueForRunAsync(stranger, 1, DateTime.UtcNow.AddMinutes(5), token).ConfigureAwait(false), token).ConfigureAwait(false);
                    FileSpaceUploadResult written = await childClient.CallAsync<FileSpaceUploadResult>("garrison_files_write", new { path = "notes/child.md", content = "from the child", baseVersion = 0 }, token).ConfigureAwait(false);
                    Assert.Equal(1, written.Version, "Child wrote version 1");
                    string read = await parentClient.CallAsync("garrison_files_read", new { path = "notes/child.md" }, token).ConfigureAwait(false);
                    Assert.True(read.Contains("from the child", StringComparison.Ordinal), "Parent reads the child's file while the child still runs: " + read);
                    FileSpaceUploadResult stale = await parentClient.CallAsync<FileSpaceUploadResult>("garrison_files_write", new { path = "notes/child.md", content = "stale", baseVersion = 0 }, token).ConfigureAwait(false);
                    Assert.True(stale.Conflict, "A stale MCP write is a conflict file");
                    await strangerClient.ExpectErrorAsync("garrison_files_read", new { path = "notes/child.md" }, "NotFound", token).ConfigureAwait(false);
                    string strangerList = await strangerClient.CallAsync("garrison_files_list", new { }, token).ConfigureAwait(false);
                    Assert.True(!strangerList.Contains("child.md", StringComparison.Ordinal), "Another tree sees none of these files");
                    await strangerClient.CallAsync("garrison_files_list", new { runId = parent.Id }, token).ConfigureAwait(false);
                    string ownList = await strangerClient.CallAsync("garrison_files_list", new { runId = parent.Id }, token).ConfigureAwait(false);
                    Assert.True(!ownList.Contains("child.md", StringComparison.Ordinal), "A run token cannot point the tools at another tree");
                }
                using (TestMcpClient user = new TestMcpClient())
                {
                    await user.ConnectAsync(host, null, token).ConfigureAwait(false);
                    string listed = await user.CallAsync("garrison_files_list", new { runId = child.Id }, token).ConfigureAwait(false);
                    Assert.True(listed.Contains("notes/child.md", StringComparison.Ordinal), "A user names the run: " + listed);
                    await user.ExpectErrorAsync("garrison_files_list", new { }, "ValidationFailed", token).ConfigureAwait(false);
                }
            }
        }

        private static async Task RoutesAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestCluster cluster = await TestCluster.StartAsync(provider, 1, token).ConfigureAwait(false))
            {
                TestServerHost host = cluster.Server;
                Agent agent = await cluster.CreateAgentAsync("fs-routes", "builtin/fake", null, token).ConfigureAwait(false);
                Run turn = await HttpTestHelpers.SendAsync<Run>(host.AdminClient, HttpMethod.Post, T(host) + "/agents/" + agent.Id + "/invoke", new InvokeRequest { Input = "hello", Wait = true, WaitSeconds = 60, StartConversation = true }, 200, token).ConfigureAwait(false);
                string files = T(host) + "/conversations/" + turn.ConversationId + "/files";

                using (ClientWebSocket socket = new ClientWebSocket())
                {
                    string ws = host.BaseUrl.Replace("http://", "ws://", StringComparison.Ordinal) + "/v1.0/ws?token=" + Uri.EscapeDataString(await AdminBearerAsync(host, token).ConfigureAwait(false));
                    await socket.ConnectAsync(new Uri(ws), token).ConfigureAwait(false);
                    await SendAsync(socket, "{\"type\":\"subscribe\",\"channel\":\"conversation-files:" + turn.ConversationId + "\"}", token).ConfigureAwait(false);

                    FileSpaceUploadResult uploaded = await HttpTestHelpers.SendAsync<FileSpaceUploadResult>(host.AdminClient, HttpMethod.Post, files, new FileSpaceWriteRequest { Path = "sources.md", Content = "- https://example.com", BaseVersion = 0 }, 201, token).ConfigureAwait(false);
                    Assert.Equal(1, uploaded.Version, "Uploaded version 1");
                    string message = await ReceiveUntilAsync(socket, "files.changed", "sources.md", token).ConfigureAwait(false);
                    Assert.True(message.Contains("\"version\":1", StringComparison.Ordinal), "Channel names the path and version: " + message);
                }

                using (ByteArrayContent raw = new ByteArrayContent(new byte[] { 1, 2, 3 }))
                {
                    raw.Headers.ContentType = new MediaTypeHeaderValue("application/octet-stream");
                    using (HttpResponseMessage response = await host.AdminClient.PostAsync(files + "?path=data/blob.bin", raw, token).ConfigureAwait(false))
                    {
                        Assert.Equal(201, (int)response.StatusCode, "Raw upload: " + await response.Content.ReadAsStringAsync(token).ConfigureAwait(false));
                    }
                }
                await HttpTestHelpers.SendAsync<FileSpaceUploadResult>(host.AdminClient, HttpMethod.Post, files, new FileSpaceWriteRequest { Path = "sources.md", Content = "- https://example.org" }, 201, token).ConfigureAwait(false);
                FileSpaceListing listing = await HttpTestHelpers.SendAsync<FileSpaceListing>(host.AdminClient, HttpMethod.Get, files, null, 200, token).ConfigureAwait(false);
                Assert.Equal("data/blob.bin,sources.md", String.Join(",", listing.Files.Select(f => f.Path)), "Listed by path");
                List<ConversationFileVersion> versions = await HttpTestHelpers.SendAsync<List<ConversationFileVersion>>(host.AdminClient, HttpMethod.Get, files + "/versions?path=sources.md", null, 200, token).ConfigureAwait(false);
                Assert.Equal("2,1", String.Join(",", versions.Select(v => v.Number)), "Versions newest first");
                using (HttpResponseMessage response = await host.AdminClient.GetAsync(files + "/content?path=sources.md&version=1", token).ConfigureAwait(false))
                {
                    Assert.Equal("- https://example.com", await response.Content.ReadAsStringAsync(token).ConfigureAwait(false), "Version 1 content");
                }
                FileDownloadUrl link = await HttpTestHelpers.SendAsync<FileDownloadUrl>(host.AdminClient, HttpMethod.Post, files + "/download-url?path=sources.md", null, 200, token).ConfigureAwait(false);
                using (HttpClient anonymous = new HttpClient())
                using (HttpResponseMessage response = await anonymous.GetAsync(link.Url, token).ConfigureAwait(false))
                {
                    Assert.Equal("- https://example.org", await response.Content.ReadAsStringAsync(token).ConfigureAwait(false), "Download URL works without credentials");
                }
                Assert.Equal(204, (await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Delete, files + "?path=data/blob.bin", null, token).ConfigureAwait(false)).StatusCode, "Delete");
                Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, files, new FileSpaceWriteRequest { Path = "/etc/passwd", Content = "x" }, token).ConfigureAwait(false), 400, "InvalidFilePath", "Absolute path");

                Tenant other = await HttpTestHelpers.SendAsync<Tenant>(host.AdminClient, HttpMethod.Post, "/v1.0/api/tenants", new TenantRequest { Name = "Files Other" }, 201, token).ConfigureAwait(false);
                await HttpTestHelpers.SendAsync<User>(host.AdminClient, HttpMethod.Post, "/v1.0/api/tenants/" + other.Id + "/users", new UserRequest { Email = "fs-outsider@example.com", Password = "password123", IsTenantAdmin = true }, 201, token).ConfigureAwait(false);
                using (HttpClient outsider = await host.UserClientAsync("fs-outsider@example.com", "password123", other.Id, token).ConfigureAwait(false))
                {
                    Assert.Equal(404, (await HttpTestHelpers.SendAsync(outsider, HttpMethod.Get, files, null, token).ConfigureAwait(false)).StatusCode, "Another tenant's files by path");
                    Assert.Equal(404, (await HttpTestHelpers.SendAsync(outsider, HttpMethod.Get, "/v1.0/api/tenants/" + other.Id + "/conversations/" + turn.ConversationId + "/files", null, token).ConfigureAwait(false)).StatusCode, "Another tenant's conversation through their tenant");
                    Assert.Equal(404, (await HttpTestHelpers.SendAsync(outsider, HttpMethod.Get, "/v1.0/api/tenants/" + other.Id + "/runs/" + turn.Id + "/files", null, token).ConfigureAwait(false)).StatusCode, "Another tenant's run files");
                }
            }
        }

        private static async Task<string> AdminBearerAsync(TestServerHost host, CancellationToken token)
        {
            using (HttpClient login = await host.UserClientAsync("admin@garrison", "password", host.TenantId, token).ConfigureAwait(false))
            {
                return login.DefaultRequestHeaders.Authorization!.Parameter!;
            }
        }

        private static async Task SendAsync(ClientWebSocket socket, string text, CancellationToken token)
        {
            await socket.SendAsync(Encoding.UTF8.GetBytes(text), WebSocketMessageType.Text, true, token).ConfigureAwait(false);
        }

        private static async Task<string> ReceiveUntilAsync(ClientWebSocket socket, string type, string contains, CancellationToken token)
        {
            DateTime deadline = DateTime.UtcNow.AddSeconds(15);
            byte[] buffer = new byte[65536];
            while (DateTime.UtcNow < deadline)
            {
                using (CancellationTokenSource timeout = CancellationTokenSource.CreateLinkedTokenSource(token))
                {
                    timeout.CancelAfter(TimeSpan.FromSeconds(5));
                    using (MemoryStream message = new MemoryStream())
                    {
                        WebSocketReceiveResult result;
                        do
                        {
                            result = await socket.ReceiveAsync(buffer, timeout.Token).ConfigureAwait(false);
                            message.Write(buffer, 0, result.Count);
                        }
                        while (!result.EndOfMessage);
                        string text = Encoding.UTF8.GetString(message.ToArray());
                        if (text.Contains(type, StringComparison.Ordinal) && text.Contains(contains, StringComparison.Ordinal)) return text;
                    }
                }
            }
            throw new TestAssertionException("No " + type + " message containing " + contains + " arrived.");
        }

        #endregion
    }
}
