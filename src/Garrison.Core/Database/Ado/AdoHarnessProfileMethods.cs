namespace Garrison.Core.Database.Ado
{
    using System;
    using System.Collections.Generic;
    using System.Data.Common;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Database.Interfaces;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Helpers;
    using Garrison.Core.Models;

    /// <summary>
    /// Provider-neutral HarnessProfile data access. Thread-safe.
    /// </summary>
    public class AdoHarnessProfileMethods : IHarnessProfileMethods
    {
        #region Private-Members

        private readonly AdoDatabaseDriver _Driver;
        private readonly string _Table;
        private readonly string _ArgumentsTable;
        private readonly string _EnvironmentTable;
        private readonly string _FilesTable;
        private readonly string _SuccessExitCodesTable;
        private readonly string _ProbeArgumentsTable;
        private readonly string _CredentialEnvironmentAllowlistTable;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="driver">Owning driver.</param>
        /// <exception cref="ArgumentNullException">Thrown when driver is null.</exception>
        public AdoHarnessProfileMethods(AdoDatabaseDriver driver)
        {
            _Driver = driver ?? throw new ArgumentNullException(nameof(driver));
            _Table = driver.Table("harness_profiles");
            _ArgumentsTable = driver.Table("harness_profile_args");
            _EnvironmentTable = driver.Table("harness_profile_env");
            _FilesTable = driver.Table("harness_profile_files");
            _SuccessExitCodesTable = driver.Table("harness_profile_exit_codes");
            _ProbeArgumentsTable = driver.Table("harness_profile_probe_args");
            _CredentialEnvironmentAllowlistTable = driver.Table("harness_profile_cred_env");
        }

        #endregion

        #region Public-Methods

        /// <inheritdoc />
        public async Task<HarnessProfile> CreateAsync(HarnessProfile obj, CancellationToken token = default)
        {
            if (obj == null) throw new ArgumentNullException(nameof(obj));
            obj.CreatedUtc = DateTime.UtcNow;
            obj.LastUpdateUtc = obj.CreatedUtc;

            await _Driver.ExecuteInTransactionAsync(async (connection, transaction, ct) =>
            {
                await InsertRowAsync(connection, transaction, obj, ct).ConfigureAwait(false);
                await InsertChildrenAsync(connection, transaction, obj, ct).ConfigureAwait(false);
            }, token).ConfigureAwait(false);

            return obj;
        }

        /// <inheritdoc />
        public async Task<HarnessProfile?> ReadAsync(string id, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));

            HarnessProfile? obj = await _Driver.QuerySingleAsync(
                "SELECT * FROM " + _Table + " WHERE id = @id;",
                command => AdoDatabaseDriver.Add(command, "id", id),
                Map,
                token).ConfigureAwait(false);
            if (obj != null) await LoadChildrenAsync(obj, token).ConfigureAwait(false);
            return obj;
        }

        /// <inheritdoc />
        public async Task<HarnessProfile?> ReadAsync(string tenantId, string id, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));

            HarnessProfile? obj = await _Driver.QuerySingleAsync(
                "SELECT * FROM " + _Table + " WHERE id = @id AND (tenantid = @tenantid OR tenantid IS NULL);",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "id", id);
                    AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                },
                Map,
                token).ConfigureAwait(false);
            if (obj != null) await LoadChildrenAsync(obj, token).ConfigureAwait(false);
            return obj;
        }

        /// <inheritdoc />
        public async Task<HarnessProfile?> ReadByNameAsync(string? tenantId, string name, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(name)) throw new ArgumentNullException(nameof(name));

            string sql = String.IsNullOrEmpty(tenantId)
                ? "SELECT * FROM " + _Table + " WHERE name = @name AND tenantid IS NULL;"
                : "SELECT * FROM " + _Table + " WHERE name = @name AND (tenantid = @tenantid OR tenantid IS NULL) ORDER BY CASE WHEN tenantid IS NULL THEN 1 ELSE 0 END;";
            HarnessProfile? obj = await _Driver.QuerySingleAsync(
                sql,
                command =>
                {
                    AdoDatabaseDriver.Add(command, "name", name);
                    if (!String.IsNullOrEmpty(tenantId)) AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                },
                Map,
                token).ConfigureAwait(false);
            if (obj != null) await LoadChildrenAsync(obj, token).ConfigureAwait(false);
            return obj;
        }

        /// <inheritdoc />
        public async Task<HarnessProfile> UpdateAsync(HarnessProfile obj, CancellationToken token = default)
        {
            if (obj == null) throw new ArgumentNullException(nameof(obj));
            obj.LastUpdateUtc = DateTime.UtcNow;

            string sql = "UPDATE " + _Table + " SET tenantid = @tenantid, name = @name, description = @description, harnesstype = @harnesstype, executable = @executable, promptdelivery = @promptdelivery, promptargumenttemplate = @promptargumenttemplate, systempromptdelivery = @systempromptdelivery, systemprompttarget = @systemprompttarget, mcpconfigformat = @mcpconfigformat, mcpconfigfilename = @mcpconfigfilename, outputparser = @outputparser, resultsource = @resultsource, resultfilename = @resultfilename, successpolicy = @successpolicy, generictextfield = @generictextfield, genericfinalfield = @genericfinalfield, genericsuccessfield = @genericsuccessfield, genericsuccessvalue = @genericsuccessvalue, defaulttimeoutseconds = @defaulttimeoutseconds, killgraceseconds = @killgraceseconds, maxoutputbytes = @maxoutputbytes, stderrtailbytes = @stderrtailbytes, isolatehome = @isolatehome, supportsresume = @supportsresume, isbuiltin = @isbuiltin, builtinkey = @builtinkey, active = @active, isprotected = @isprotected, lastupdateutc = @lastupdateutc WHERE id = @id;";

            await _Driver.ExecuteInTransactionAsync(async (connection, transaction, ct) =>
            {
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction, sql, command =>
                {
                    AdoDatabaseDriver.Add(command, "id", obj.Id);
                    AdoDatabaseDriver.Add(command, "tenantid", obj.TenantId);
                    AdoDatabaseDriver.Add(command, "name", obj.Name);
                    AdoDatabaseDriver.Add(command, "description", obj.Description);
                    AdoDatabaseDriver.Add(command, "harnesstype", obj.HarnessType.ToString());
                    AdoDatabaseDriver.Add(command, "executable", obj.Executable);
                    AdoDatabaseDriver.Add(command, "promptdelivery", obj.PromptDelivery.ToString());
                    AdoDatabaseDriver.Add(command, "promptargumenttemplate", obj.PromptArgumentTemplate);
                    AdoDatabaseDriver.Add(command, "systempromptdelivery", obj.SystemPromptDelivery.ToString());
                    AdoDatabaseDriver.Add(command, "systemprompttarget", obj.SystemPromptTarget);
                    AdoDatabaseDriver.Add(command, "mcpconfigformat", obj.McpConfigFormat.ToString());
                    AdoDatabaseDriver.Add(command, "mcpconfigfilename", obj.McpConfigFileName);
                    AdoDatabaseDriver.Add(command, "outputparser", obj.OutputParser.ToString());
                    AdoDatabaseDriver.Add(command, "resultsource", obj.ResultSource.ToString());
                    AdoDatabaseDriver.Add(command, "resultfilename", obj.ResultFileName);
                    AdoDatabaseDriver.Add(command, "successpolicy", obj.SuccessPolicy.ToString());
                    AdoDatabaseDriver.Add(command, "generictextfield", obj.GenericTextField);
                    AdoDatabaseDriver.Add(command, "genericfinalfield", obj.GenericFinalField);
                    AdoDatabaseDriver.Add(command, "genericsuccessfield", obj.GenericSuccessField);
                    AdoDatabaseDriver.Add(command, "genericsuccessvalue", obj.GenericSuccessValue);
                    AdoDatabaseDriver.Add(command, "defaulttimeoutseconds", obj.DefaultTimeoutSeconds);
                    AdoDatabaseDriver.Add(command, "killgraceseconds", obj.KillGraceSeconds);
                    AdoDatabaseDriver.Add(command, "maxoutputbytes", obj.MaxOutputBytes);
                    AdoDatabaseDriver.Add(command, "stderrtailbytes", obj.StderrTailBytes);
                    AdoDatabaseDriver.Add(command, "isolatehome", obj.IsolateHome);
                    AdoDatabaseDriver.Add(command, "supportsresume", obj.SupportsResume);
                    AdoDatabaseDriver.Add(command, "isbuiltin", obj.IsBuiltIn);
                    AdoDatabaseDriver.Add(command, "builtinkey", obj.BuiltInKey);
                    AdoDatabaseDriver.Add(command, "active", obj.Active);
                    AdoDatabaseDriver.Add(command, "isprotected", obj.IsProtected);
                    AdoDatabaseDriver.Add(command, "lastupdateutc", obj.LastUpdateUtc);
                }, ct).ConfigureAwait(false);

                await DeleteChildrenAsync(connection, transaction, obj.Id, ct).ConfigureAwait(false);
                await InsertChildrenAsync(connection, transaction, obj, ct).ConfigureAwait(false);
            }, token).ConfigureAwait(false);

            return obj;
        }

        /// <inheritdoc />
        public async Task<bool> DeleteAsync(string id, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));

            int affected = 0;
            await _Driver.ExecuteInTransactionAsync(async (connection, transaction, ct) =>
            {
                await DeleteChildrenAsync(connection, transaction, id, ct).ConfigureAwait(false);
                affected = await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _Table + " WHERE id = @id;", command => AdoDatabaseDriver.Add(command, "id", id), ct).ConfigureAwait(false);
            }, token).ConfigureAwait(false);

            return affected > 0;
        }

        /// <inheritdoc />
        public async Task<bool> ExistsAsync(string id, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));

            object? result = await _Driver.ScalarAsync("SELECT 1 FROM " + _Table + " WHERE id = @id;", command => AdoDatabaseDriver.Add(command, "id", id), token).ConfigureAwait(false);
            return result != null;
        }

        /// <inheritdoc />
        public async Task<EnumerationResult<HarnessProfile>> EnumerateAsync(string? tenantId, EnumerationQuery query, CancellationToken token = default)
        {
            if (query == null) throw new ArgumentNullException(nameof(query));

            List<string> clauses = new List<string>();
            if (!String.IsNullOrEmpty(tenantId))
            {
                clauses.Add(query.IncludeBuiltIn ? "(tenantid = @tenantid OR tenantid IS NULL)" : "tenantid = @tenantid");
            }
            if (!String.IsNullOrEmpty(query.Search)) clauses.Add(_Driver.Dialect.CaseInsensitiveLike("name", "search"));
            if (query.ActiveOnly) clauses.Add("active = " + _Driver.Dialect.BooleanLiteral(true));
            string where = clauses.Count > 0 ? " WHERE " + String.Join(" AND ", clauses) : String.Empty;

            Action<DbCommand> bind = command =>
            {
                if (!String.IsNullOrEmpty(tenantId)) AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                if (!String.IsNullOrEmpty(query.Search)) AdoDatabaseDriver.Add(command, "search", "%" + query.Search + "%");
            };

            object? countValue = await _Driver.ScalarAsync("SELECT COUNT(*) FROM " + _Table + where + ";", bind, token).ConfigureAwait(false);
            long total = countValue == null ? 0 : Convert.ToInt64(countValue);

            string sql = "SELECT * FROM " + _Table + where + AdoEnumerationSql.OrderBy(query.Ordering, true) + _Driver.Dialect.LimitOffsetClause() + ";";
            List<HarnessProfile> objects = await _Driver.QueryAsync(sql, command =>
            {
                bind(command);
                AdoDatabaseDriver.Add(command, "max", query.MaxResults);
                AdoDatabaseDriver.Add(command, "skip", query.Skip);
            }, Map, token).ConfigureAwait(false);

            foreach (HarnessProfile obj in objects) await LoadChildrenAsync(obj, token).ConfigureAwait(false);

            return EnumerationResult<HarnessProfile>.Build(query, total, objects);
        }

        /// <summary>
        /// Map a row to a HarnessProfile (child rows not loaded).
        /// </summary>
        /// <param name="reader">Reader positioned on a row.</param>
        /// <returns>The record.</returns>
        public static HarnessProfile Map(DbDataReader reader)
        {
            HarnessProfile obj = new HarnessProfile();
            obj.Id = AdoConverters.Str(reader, "id");
            obj.TenantId = AdoConverters.NullableStr(reader, "tenantid");
            obj.Name = AdoConverters.Str(reader, "name");
            obj.Description = AdoConverters.NullableStr(reader, "description");
            obj.HarnessType = AdoConverters.Enum<HarnessTypeEnum>(reader, "harnesstype", HarnessTypeEnum.Generic);
            obj.Executable = AdoConverters.Str(reader, "executable");
            obj.PromptDelivery = AdoConverters.Enum<PromptDeliveryEnum>(reader, "promptdelivery", PromptDeliveryEnum.Stdin);
            obj.PromptArgumentTemplate = AdoConverters.NullableStr(reader, "promptargumenttemplate");
            obj.SystemPromptDelivery = AdoConverters.Enum<SystemPromptDeliveryEnum>(reader, "systempromptdelivery", SystemPromptDeliveryEnum.File);
            obj.SystemPromptTarget = AdoConverters.NullableStr(reader, "systemprompttarget");
            obj.McpConfigFormat = AdoConverters.Enum<McpConfigFormatEnum>(reader, "mcpconfigformat", McpConfigFormatEnum.None);
            obj.McpConfigFileName = AdoConverters.NullableStr(reader, "mcpconfigfilename");
            obj.OutputParser = AdoConverters.Enum<OutputParserEnum>(reader, "outputparser", OutputParserEnum.PlainText);
            obj.ResultSource = AdoConverters.Enum<ResultSourceEnum>(reader, "resultsource", ResultSourceEnum.ParserFinalEvent);
            obj.ResultFileName = AdoConverters.NullableStr(reader, "resultfilename");
            obj.SuccessPolicy = AdoConverters.Enum<SuccessPolicyEnum>(reader, "successpolicy", SuccessPolicyEnum.FinalEvent);
            obj.GenericTextField = AdoConverters.NullableStr(reader, "generictextfield");
            obj.GenericFinalField = AdoConverters.NullableStr(reader, "genericfinalfield");
            obj.GenericSuccessField = AdoConverters.NullableStr(reader, "genericsuccessfield");
            obj.GenericSuccessValue = AdoConverters.NullableStr(reader, "genericsuccessvalue");
            obj.DefaultTimeoutSeconds = AdoConverters.Int(reader, "defaulttimeoutseconds");
            obj.KillGraceSeconds = AdoConverters.Int(reader, "killgraceseconds");
            obj.MaxOutputBytes = AdoConverters.Long(reader, "maxoutputbytes");
            obj.StderrTailBytes = AdoConverters.Int(reader, "stderrtailbytes");
            obj.IsolateHome = AdoConverters.Bool(reader, "isolatehome");
            obj.SupportsResume = AdoConverters.Bool(reader, "supportsresume");
            obj.IsBuiltIn = AdoConverters.Bool(reader, "isbuiltin");
            obj.BuiltInKey = AdoConverters.NullableStr(reader, "builtinkey");
            obj.Active = AdoConverters.Bool(reader, "active");
            obj.IsProtected = AdoConverters.Bool(reader, "isprotected");
            obj.CreatedUtc = AdoConverters.Date(reader, "createdutc");
            obj.LastUpdateUtc = AdoConverters.Date(reader, "lastupdateutc");
            return obj;
        }

        /// <summary>
        /// Load child rows into a HarnessProfile.
        /// </summary>
        /// <param name="obj">Record.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        public async Task LoadChildrenAsync(HarnessProfile obj, CancellationToken token = default)
        {
            if (obj == null) throw new ArgumentNullException(nameof(obj));

            obj.Arguments = await _Driver.QueryAsync(
                "SELECT * FROM " + _ArgumentsTable + " WHERE harnessprofileid = @parentid ORDER BY position ASC;",
                command => AdoDatabaseDriver.Add(command, "parentid", obj.Id),
                MapArguments,
                token).ConfigureAwait(false);

            obj.Environment = await _Driver.QueryAsync(
                "SELECT * FROM " + _EnvironmentTable + " WHERE harnessprofileid = @parentid ORDER BY id ASC;",
                command => AdoDatabaseDriver.Add(command, "parentid", obj.Id),
                MapEnvironment,
                token).ConfigureAwait(false);

            obj.Files = await _Driver.QueryAsync(
                "SELECT * FROM " + _FilesTable + " WHERE harnessprofileid = @parentid ORDER BY id ASC;",
                command => AdoDatabaseDriver.Add(command, "parentid", obj.Id),
                MapFiles,
                token).ConfigureAwait(false);

            obj.SuccessExitCodes = await _Driver.QueryAsync(
                "SELECT * FROM " + _SuccessExitCodesTable + " WHERE harnessprofileid = @parentid ORDER BY id ASC;",
                command => AdoDatabaseDriver.Add(command, "parentid", obj.Id),
                reader => AdoConverters.Int(reader, "exitcode"),
                token).ConfigureAwait(false);

            obj.ProbeArguments = await _Driver.QueryAsync(
                "SELECT * FROM " + _ProbeArgumentsTable + " WHERE harnessprofileid = @parentid ORDER BY position ASC;",
                command => AdoDatabaseDriver.Add(command, "parentid", obj.Id),
                reader => AdoConverters.Str(reader, "argument"),
                token).ConfigureAwait(false);

            obj.CredentialEnvironmentAllowlist = await _Driver.QueryAsync(
                "SELECT * FROM " + _CredentialEnvironmentAllowlistTable + " WHERE harnessprofileid = @parentid ORDER BY id ASC;",
                command => AdoDatabaseDriver.Add(command, "parentid", obj.Id),
                reader => AdoConverters.Str(reader, "name"),
                token).ConfigureAwait(false);
        }

        #endregion

        #region Private-Methods

        private async Task InsertRowAsync(DbConnection connection, DbTransaction transaction, HarnessProfile obj, CancellationToken token)
        {
            string sql = "INSERT INTO " + _Table + " (id, tenantid, name, description, harnesstype, executable, promptdelivery, promptargumenttemplate, systempromptdelivery, systemprompttarget, mcpconfigformat, mcpconfigfilename, outputparser, resultsource, resultfilename, successpolicy, generictextfield, genericfinalfield, genericsuccessfield, genericsuccessvalue, defaulttimeoutseconds, killgraceseconds, maxoutputbytes, stderrtailbytes, isolatehome, supportsresume, isbuiltin, builtinkey, active, isprotected, createdutc, lastupdateutc) VALUES (@id, @tenantid, @name, @description, @harnesstype, @executable, @promptdelivery, @promptargumenttemplate, @systempromptdelivery, @systemprompttarget, @mcpconfigformat, @mcpconfigfilename, @outputparser, @resultsource, @resultfilename, @successpolicy, @generictextfield, @genericfinalfield, @genericsuccessfield, @genericsuccessvalue, @defaulttimeoutseconds, @killgraceseconds, @maxoutputbytes, @stderrtailbytes, @isolatehome, @supportsresume, @isbuiltin, @builtinkey, @active, @isprotected, @createdutc, @lastupdateutc);";
            await AdoDatabaseDriver.ExecuteAsync(connection, transaction, sql, command =>
            {
                AdoDatabaseDriver.Add(command, "id", obj.Id);
                AdoDatabaseDriver.Add(command, "tenantid", obj.TenantId);
                AdoDatabaseDriver.Add(command, "name", obj.Name);
                AdoDatabaseDriver.Add(command, "description", obj.Description);
                AdoDatabaseDriver.Add(command, "harnesstype", obj.HarnessType.ToString());
                AdoDatabaseDriver.Add(command, "executable", obj.Executable);
                AdoDatabaseDriver.Add(command, "promptdelivery", obj.PromptDelivery.ToString());
                AdoDatabaseDriver.Add(command, "promptargumenttemplate", obj.PromptArgumentTemplate);
                AdoDatabaseDriver.Add(command, "systempromptdelivery", obj.SystemPromptDelivery.ToString());
                AdoDatabaseDriver.Add(command, "systemprompttarget", obj.SystemPromptTarget);
                AdoDatabaseDriver.Add(command, "mcpconfigformat", obj.McpConfigFormat.ToString());
                AdoDatabaseDriver.Add(command, "mcpconfigfilename", obj.McpConfigFileName);
                AdoDatabaseDriver.Add(command, "outputparser", obj.OutputParser.ToString());
                AdoDatabaseDriver.Add(command, "resultsource", obj.ResultSource.ToString());
                AdoDatabaseDriver.Add(command, "resultfilename", obj.ResultFileName);
                AdoDatabaseDriver.Add(command, "successpolicy", obj.SuccessPolicy.ToString());
                AdoDatabaseDriver.Add(command, "generictextfield", obj.GenericTextField);
                AdoDatabaseDriver.Add(command, "genericfinalfield", obj.GenericFinalField);
                AdoDatabaseDriver.Add(command, "genericsuccessfield", obj.GenericSuccessField);
                AdoDatabaseDriver.Add(command, "genericsuccessvalue", obj.GenericSuccessValue);
                AdoDatabaseDriver.Add(command, "defaulttimeoutseconds", obj.DefaultTimeoutSeconds);
                AdoDatabaseDriver.Add(command, "killgraceseconds", obj.KillGraceSeconds);
                AdoDatabaseDriver.Add(command, "maxoutputbytes", obj.MaxOutputBytes);
                AdoDatabaseDriver.Add(command, "stderrtailbytes", obj.StderrTailBytes);
                AdoDatabaseDriver.Add(command, "isolatehome", obj.IsolateHome);
                AdoDatabaseDriver.Add(command, "supportsresume", obj.SupportsResume);
                AdoDatabaseDriver.Add(command, "isbuiltin", obj.IsBuiltIn);
                AdoDatabaseDriver.Add(command, "builtinkey", obj.BuiltInKey);
                AdoDatabaseDriver.Add(command, "active", obj.Active);
                AdoDatabaseDriver.Add(command, "isprotected", obj.IsProtected);
                AdoDatabaseDriver.Add(command, "createdutc", obj.CreatedUtc);
                AdoDatabaseDriver.Add(command, "lastupdateutc", obj.LastUpdateUtc);
            }, token).ConfigureAwait(false);
        }

        private async Task InsertChildrenAsync(DbConnection connection, DbTransaction transaction, HarnessProfile obj, CancellationToken token)
        {
            string batch = IdGenerator.NewChildRowId() + "_";
            for (int i = 0; i < obj.Arguments.Count; i++)
            {
                HarnessArgument child = obj.Arguments[i];
                child.Id = batch + i.ToString("D4", System.Globalization.CultureInfo.InvariantCulture) + "arg";
                child.HarnessProfileId = obj.Id;
                child.Position = i;
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction,
                    "INSERT INTO " + _ArgumentsTable + " (id, harnessprofileid, tenantid, position, template, condition, repeatover) VALUES (@id, @harnessprofileid, @tenantid, @position, @template, @condition, @repeatover);",
                    command =>
                    {
                        AdoDatabaseDriver.Add(command, "id", child.Id);
                        AdoDatabaseDriver.Add(command, "harnessprofileid", obj.Id);
                        AdoDatabaseDriver.Add(command, "tenantid", obj.TenantId);
                        AdoDatabaseDriver.Add(command, "position", child.Position);
                        AdoDatabaseDriver.Add(command, "template", child.Template);
                        AdoDatabaseDriver.Add(command, "condition", child.Condition);
                        AdoDatabaseDriver.Add(command, "repeatover", child.RepeatOver);
                    }, token).ConfigureAwait(false);
            }

            for (int i = 0; i < obj.Environment.Count; i++)
            {
                HarnessEnvironmentVariable child = obj.Environment[i];
                child.Id = batch + i.ToString("D4", System.Globalization.CultureInfo.InvariantCulture) + "env";
                child.HarnessProfileId = obj.Id;
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction,
                    "INSERT INTO " + _EnvironmentTable + " (id, harnessprofileid, tenantid, name, valuetemplate, condition, issecret) VALUES (@id, @harnessprofileid, @tenantid, @name, @valuetemplate, @condition, @issecret);",
                    command =>
                    {
                        AdoDatabaseDriver.Add(command, "id", child.Id);
                        AdoDatabaseDriver.Add(command, "harnessprofileid", obj.Id);
                        AdoDatabaseDriver.Add(command, "tenantid", obj.TenantId);
                        AdoDatabaseDriver.Add(command, "name", child.Name);
                        AdoDatabaseDriver.Add(command, "valuetemplate", child.ValueTemplate);
                        AdoDatabaseDriver.Add(command, "condition", child.Condition);
                        AdoDatabaseDriver.Add(command, "issecret", child.IsSecret);
                    }, token).ConfigureAwait(false);
            }

            for (int i = 0; i < obj.Files.Count; i++)
            {
                HarnessFile child = obj.Files[i];
                child.Id = batch + i.ToString("D4", System.Globalization.CultureInfo.InvariantCulture) + "fil";
                child.HarnessProfileId = obj.Id;
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction,
                    "INSERT INTO " + _FilesTable + " (id, harnessprofileid, tenantid, basedirectory, pathtemplate, contenttemplate, condition, mode, issecret) VALUES (@id, @harnessprofileid, @tenantid, @basedirectory, @pathtemplate, @contenttemplate, @condition, @mode, @issecret);",
                    command =>
                    {
                        AdoDatabaseDriver.Add(command, "id", child.Id);
                        AdoDatabaseDriver.Add(command, "harnessprofileid", obj.Id);
                        AdoDatabaseDriver.Add(command, "tenantid", obj.TenantId);
                        AdoDatabaseDriver.Add(command, "basedirectory", child.BaseDirectory.ToString());
                        AdoDatabaseDriver.Add(command, "pathtemplate", child.PathTemplate);
                        AdoDatabaseDriver.Add(command, "contenttemplate", child.ContentTemplate);
                        AdoDatabaseDriver.Add(command, "condition", child.Condition);
                        AdoDatabaseDriver.Add(command, "mode", child.Mode);
                        AdoDatabaseDriver.Add(command, "issecret", child.IsSecret);
                    }, token).ConfigureAwait(false);
            }

            for (int i = 0; i < obj.SuccessExitCodes.Count; i++)
            {
                int position = i;
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction,
                    "INSERT INTO " + _SuccessExitCodesTable + " (id, harnessprofileid, tenantid, exitcode) VALUES (@id, @harnessprofileid, @tenantid, @exitcode);",
                    command =>
                    {
                        AdoDatabaseDriver.Add(command, "id", batch + position.ToString("D4", System.Globalization.CultureInfo.InvariantCulture) + "s");
                        AdoDatabaseDriver.Add(command, "harnessprofileid", obj.Id);
                        AdoDatabaseDriver.Add(command, "tenantid", obj.TenantId);
                        AdoDatabaseDriver.Add(command, "exitcode", obj.SuccessExitCodes[position]);
                    }, token).ConfigureAwait(false);
            }

            for (int i = 0; i < obj.ProbeArguments.Count; i++)
            {
                int position = i;
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction,
                    "INSERT INTO " + _ProbeArgumentsTable + " (id, harnessprofileid, tenantid, position, argument) VALUES (@id, @harnessprofileid, @tenantid, @position, @argument);",
                    command =>
                    {
                        AdoDatabaseDriver.Add(command, "id", batch + position.ToString("D4", System.Globalization.CultureInfo.InvariantCulture) + "s");
                        AdoDatabaseDriver.Add(command, "harnessprofileid", obj.Id);
                        AdoDatabaseDriver.Add(command, "tenantid", obj.TenantId);
                        AdoDatabaseDriver.Add(command, "position", position);
                        AdoDatabaseDriver.Add(command, "argument", obj.ProbeArguments[position]);
                    }, token).ConfigureAwait(false);
            }

            for (int i = 0; i < obj.CredentialEnvironmentAllowlist.Count; i++)
            {
                int position = i;
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction,
                    "INSERT INTO " + _CredentialEnvironmentAllowlistTable + " (id, harnessprofileid, tenantid, name) VALUES (@id, @harnessprofileid, @tenantid, @name);",
                    command =>
                    {
                        AdoDatabaseDriver.Add(command, "id", batch + position.ToString("D4", System.Globalization.CultureInfo.InvariantCulture) + "s");
                        AdoDatabaseDriver.Add(command, "harnessprofileid", obj.Id);
                        AdoDatabaseDriver.Add(command, "tenantid", obj.TenantId);
                        AdoDatabaseDriver.Add(command, "name", obj.CredentialEnvironmentAllowlist[position]);
                    }, token).ConfigureAwait(false);
            }
        }

        private async Task DeleteChildrenAsync(DbConnection connection, DbTransaction transaction, string parentId, CancellationToken token)
        {
            await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _ArgumentsTable + " WHERE harnessprofileid = @parentid;", command => AdoDatabaseDriver.Add(command, "parentid", parentId), token).ConfigureAwait(false);
            await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _EnvironmentTable + " WHERE harnessprofileid = @parentid;", command => AdoDatabaseDriver.Add(command, "parentid", parentId), token).ConfigureAwait(false);
            await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _FilesTable + " WHERE harnessprofileid = @parentid;", command => AdoDatabaseDriver.Add(command, "parentid", parentId), token).ConfigureAwait(false);
            await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _SuccessExitCodesTable + " WHERE harnessprofileid = @parentid;", command => AdoDatabaseDriver.Add(command, "parentid", parentId), token).ConfigureAwait(false);
            await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _ProbeArgumentsTable + " WHERE harnessprofileid = @parentid;", command => AdoDatabaseDriver.Add(command, "parentid", parentId), token).ConfigureAwait(false);
            await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _CredentialEnvironmentAllowlistTable + " WHERE harnessprofileid = @parentid;", command => AdoDatabaseDriver.Add(command, "parentid", parentId), token).ConfigureAwait(false);
        }

        private static HarnessArgument MapArguments(DbDataReader reader)
        {
            HarnessArgument child = new HarnessArgument();
            child.Id = AdoConverters.Str(reader, "id");
            child.HarnessProfileId = AdoConverters.Str(reader, "harnessprofileid");
            child.Position = AdoConverters.Int(reader, "position");
            child.Template = AdoConverters.Str(reader, "template");
            child.Condition = AdoConverters.NullableStr(reader, "condition");
            child.RepeatOver = AdoConverters.NullableStr(reader, "repeatover");
            return child;
        }

        private static HarnessEnvironmentVariable MapEnvironment(DbDataReader reader)
        {
            HarnessEnvironmentVariable child = new HarnessEnvironmentVariable();
            child.Id = AdoConverters.Str(reader, "id");
            child.HarnessProfileId = AdoConverters.Str(reader, "harnessprofileid");
            child.Name = AdoConverters.Str(reader, "name");
            child.ValueTemplate = AdoConverters.Str(reader, "valuetemplate");
            child.Condition = AdoConverters.NullableStr(reader, "condition");
            child.IsSecret = AdoConverters.Bool(reader, "issecret");
            return child;
        }

        private static HarnessFile MapFiles(DbDataReader reader)
        {
            HarnessFile child = new HarnessFile();
            child.Id = AdoConverters.Str(reader, "id");
            child.HarnessProfileId = AdoConverters.Str(reader, "harnessprofileid");
            child.BaseDirectory = AdoConverters.Enum<FileBaseDirectoryEnum>(reader, "basedirectory", FileBaseDirectoryEnum.Config);
            child.PathTemplate = AdoConverters.Str(reader, "pathtemplate");
            child.ContentTemplate = AdoConverters.Str(reader, "contenttemplate");
            child.Condition = AdoConverters.NullableStr(reader, "condition");
            child.Mode = AdoConverters.NullableStr(reader, "mode");
            child.IsSecret = AdoConverters.Bool(reader, "issecret");
            return child;
        }

        #endregion
    }
}
