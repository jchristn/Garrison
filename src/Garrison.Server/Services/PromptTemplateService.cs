namespace Garrison.Server.Services
{
    using System;
    using System.Collections.Generic;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Requests;
    using Garrison.Core.Responses;
    using Garrison.Core.Security;
    using Garrison.Core.Services;
    using Garrison.Core.Templates;
    using Garrison.Server.Routes;

    /// <summary>
    /// Prompt template changes shared by the REST routes and the MCP prompt template tools (AD7.14): update, clone, reset,
    /// and render preview. Callers authorize first. Thread-safe.
    /// </summary>
    public class PromptTemplateService
    {
        #region Private-Members

        private readonly ServerContext _Server;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="server">Server context.</param>
        /// <exception cref="ArgumentNullException">Thrown when server is null.</exception>
        public PromptTemplateService(ServerContext server)
        {
            _Server = server ?? throw new ArgumentNullException(nameof(server));
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Update a tenant template. A content change adds a version.
        /// </summary>
        /// <param name="ctx">Caller.</param>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="existing">Template.</param>
        /// <param name="request">New fields.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The updated template.</returns>
        /// <exception cref="ConflictException">Thrown with BuiltInImmutable, Protected, or NameConflict.</exception>
        /// <exception cref="ValidationException">Thrown when the name or content is invalid.</exception>
        public async Task<PromptTemplate> UpdateAsync(RequestContext ctx, string tenantId, PromptTemplate existing, PromptTemplateRequest request, CancellationToken token)
        {
            if (existing == null) throw new ArgumentNullException(nameof(existing));
            if (request == null) throw new ArgumentNullException(nameof(request));
            ConfigurationSupport.EnsureEditable(existing.TenantId, existing.IsBuiltIn, existing.IsProtected, tenantId, "Prompt template " + existing.Name);
            ConfigurationValidator.PromptTemplate(request.Name, request.Content);
            await EnsureNameAsync(tenantId, request.Name, existing.Id, token).ConfigureAwait(false);
            bool contentChanged = existing.Content != request.Content;
            Apply(existing, request);
            if (contentChanged) existing.CurrentVersion = existing.CurrentVersion + 1;
            PromptTemplate updated = await _Server.Database.PromptTemplates.UpdateAsync(existing, token).ConfigureAwait(false);
            if (contentChanged) await AddVersionAsync(ctx, updated, request.ChangeNote ?? "Updated.", token).ConfigureAwait(false);
            await _Server.Audit.WriteAsync(ctx, AuditEventTypeEnum.ConfigurationChanged, "PromptTemplate", updated.Id, "Updated prompt template " + updated.Name + (contentChanged ? " to version " + updated.CurrentVersion : String.Empty) + ".", tenantId, token).ConfigureAwait(false);
            return updated;
        }

        /// <summary>
        /// Clone a built-in or tenant template into a tenant template at version 1, keeping its built-in key.
        /// </summary>
        /// <param name="ctx">Caller.</param>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="source">Template to copy.</param>
        /// <param name="name">New name.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The clone.</returns>
        /// <exception cref="ConflictException">Thrown with NameConflict.</exception>
        public async Task<PromptTemplate> CloneAsync(RequestContext ctx, string tenantId, PromptTemplate source, string name, CancellationToken token)
        {
            if (source == null) throw new ArgumentNullException(nameof(source));
            ConfigurationValidator.PromptTemplate(name, source.Content);
            await EnsureNameAsync(tenantId, name, null, token).ConfigureAwait(false);
            PromptTemplate copy = new PromptTemplate();
            copy.TenantId = tenantId;
            copy.Name = name;
            copy.Description = source.Description;
            copy.Kind = source.Kind;
            copy.Content = source.Content;
            copy.BuiltInKey = source.BuiltInKey;
            copy.CurrentVersion = 1;
            foreach (PromptTemplateVariable variable in source.Variables)
            {
                PromptTemplateVariable v = new PromptTemplateVariable();
                v.Name = variable.Name;
                v.Description = variable.Description;
                v.Required = variable.Required;
                v.DefaultValue = variable.DefaultValue;
                copy.Variables.Add(v);
            }
            PromptTemplate created = await _Server.Database.PromptTemplates.CreateAsync(copy, token).ConfigureAwait(false);
            await AddVersionAsync(ctx, created, "Cloned from " + source.Name + " version " + source.CurrentVersion + ".", token).ConfigureAwait(false);
            await _Server.Audit.WriteAsync(ctx, AuditEventTypeEnum.ConfigurationChanged, "PromptTemplate", created.Id, "Cloned prompt template " + source.Name + " to " + created.Name + ".", tenantId, token).ConfigureAwait(false);
            return created;
        }

        /// <summary>
        /// Reset a template to the shipped content of its built-in (AD7.13): a built-in itself, or a clone of one. A new version
        /// is added only when the content differs.
        /// </summary>
        /// <param name="ctx">Caller.</param>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="template">Template.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The template after the reset.</returns>
        /// <exception cref="ConflictException">Thrown with NoBuiltInDefault for a template not cloned from a built-in, or Protected.</exception>
        public async Task<PromptTemplate> ResetAsync(RequestContext ctx, string tenantId, PromptTemplate template, CancellationToken token)
        {
            if (template == null) throw new ArgumentNullException(nameof(template));
            if (!template.IsBuiltIn) ConfigurationSupport.EnsureEditable(template.TenantId, template.IsBuiltIn, template.IsProtected, tenantId, "Prompt template " + template.Name);
            string? content = BuiltInSeeder.PromptDefault(template.BuiltInKey);
            if (content == null) throw new ConflictException("NoBuiltInDefault", "Prompt template " + template.Name + " was not cloned from a built-in, so there is no default to reset to.");
            if (template.Content == content) return template;
            template.Content = content;
            template.CurrentVersion = template.CurrentVersion + 1;
            template = await _Server.Database.PromptTemplates.UpdateAsync(template, token).ConfigureAwait(false);
            await AddVersionAsync(ctx, template, "Reset to the built-in default.", token).ConfigureAwait(false);
            await _Server.Audit.WriteAsync(ctx, AuditEventTypeEnum.ConfigurationChanged, "PromptTemplate", template.Id, "Reset prompt template " + template.Name + " to the built-in default.", tenantId, token).ConfigureAwait(false);
            return template;
        }

        /// <summary>
        /// Render template content with sample data, resolving includes in the tenant.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="name">Template name, for messages.</param>
        /// <param name="content">Template content.</param>
        /// <param name="request">Sample context.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Rendered text, variables, includes, and errors.</returns>
        public async Task<PromptRenderResponse> RenderAsync(string tenantId, string name, string content, PromptRenderRequest request, CancellationToken token)
        {
            if (request == null) throw new ArgumentNullException(nameof(request));
            PromptRenderResponse response = new PromptRenderResponse();
            TemplateAnalysis analysis = TemplateAnalyzer.Analyze(content, name, false);
            response.Variables = analysis.Variables;
            response.Includes = analysis.Includes;
            response.Errors.AddRange(analysis.Errors);
            if (!analysis.Valid)
            {
                response.Success = false;
                return response;
            }

            Dictionary<string, string> includes = new Dictionary<string, string>(StringComparer.Ordinal);
            Queue<string> pending = new Queue<string>(analysis.Includes);
            while (pending.Count > 0)
            {
                string include = pending.Dequeue();
                if (includes.ContainsKey(include)) continue;
                PromptTemplate? found = await _Server.Database.PromptTemplates.ReadByNameAsync(tenantId, include, token).ConfigureAwait(false);
                if (found == null) continue;
                includes[include] = found.Content;
                foreach (string nested in TemplateAnalyzer.Analyze(found.Content, include, false).Includes) pending.Enqueue(nested);
            }

            TemplateRenderOptions options = new TemplateRenderOptions();
            options.TemplateName = name;
            options.IncludeResolver = n => includes.TryGetValue(n, out string? c) ? c : null;
            try
            {
                response.Rendered = TemplateRenderer.Render(content, TemplateSampleContext.Build(request.Context), options);
            }
            catch (TemplateException e)
            {
                response.Success = false;
                response.Errors.Add(e.Message);
            }
            return response;
        }

        /// <summary>
        /// Record a template's current content as a version.
        /// </summary>
        /// <param name="ctx">Caller.</param>
        /// <param name="template">Template.</param>
        /// <param name="note">Change note.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        public async Task AddVersionAsync(RequestContext ctx, PromptTemplate template, string note, CancellationToken token)
        {
            if (template == null) throw new ArgumentNullException(nameof(template));
            PromptTemplateVersion version = new PromptTemplateVersion();
            version.TenantId = template.TenantId;
            version.TemplateId = template.Id;
            version.Version = template.CurrentVersion;
            version.Content = template.Content;
            version.ChangeNote = note;
            version.CreatedBy = ctx?.PrincipalName;
            await _Server.Database.PromptTemplateVersions.CreateAsync(version, token).ConfigureAwait(false);
        }

        /// <summary>
        /// Throw NameConflict when the tenant already has another template with the name.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="name">Name.</param>
        /// <param name="currentId">Template being saved, or null on create.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        public async Task EnsureNameAsync(string tenantId, string name, string? currentId, CancellationToken token)
        {
            PromptTemplate? existing = await _Server.Database.PromptTemplates.ReadByNameAsync(tenantId, name, token).ConfigureAwait(false);
            ConfigurationSupport.EnsureNameAvailable(existing?.TenantId == tenantId ? existing : null, existing?.Id, currentId, name);
        }

        /// <summary>
        /// Copy request fields onto a template, deriving variables from the content when none are given.
        /// </summary>
        /// <param name="template">Template.</param>
        /// <param name="request">Request.</param>
        public static void Apply(PromptTemplate template, PromptTemplateRequest request)
        {
            if (template == null) throw new ArgumentNullException(nameof(template));
            if (request == null) throw new ArgumentNullException(nameof(request));
            template.Name = request.Name;
            template.Description = request.Description;
            template.Kind = request.Kind;
            template.Content = request.Content;
            template.IsBuiltIn = false;
            List<PromptTemplateVariable> variables = new List<PromptTemplateVariable>();
            foreach (PromptTemplateVariable variable in request.Variables)
            {
                PromptTemplateVariable v = new PromptTemplateVariable();
                v.Name = variable.Name;
                v.Description = variable.Description;
                v.Required = variable.Required;
                v.DefaultValue = variable.DefaultValue;
                variables.Add(v);
            }
            if (variables.Count == 0)
            {
                foreach (string path in TemplateAnalyzer.Analyze(request.Content, request.Name, false).Variables)
                {
                    PromptTemplateVariable v = new PromptTemplateVariable();
                    v.Name = path;
                    variables.Add(v);
                }
            }
            template.Variables = variables;
        }

        #endregion
    }
}
