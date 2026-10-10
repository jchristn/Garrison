namespace Garrison.Server.Routes
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Services;
    using WatsonWebserver.Core;

    /// <summary>
    /// Helpers shared by the configuration route registrars. Thread-safe.
    /// </summary>
    public static class ConfigurationSupport
    {
        /// <summary>
        /// Write a configuration audit record for the current request.
        /// </summary>
        /// <param name="server">Server context.</param>
        /// <param name="http">HTTP context.</param>
        /// <param name="eventType">Event type.</param>
        /// <param name="resourceType">Resource type name.</param>
        /// <param name="resourceId">Resource identifier.</param>
        /// <param name="description">Description.</param>
        /// <returns>Task.</returns>
        public static Task AuditAsync(ServerContext server, HttpContextBase http, AuditEventTypeEnum eventType, string resourceType, string? resourceId, string description)
        {
            return server.Audit.WriteAsync(RouteHelpers.Context(http), eventType, resourceType, resourceId, description, RouteHelpers.Param(http, "tenantId"), http.Token);
        }

        /// <summary>
        /// Throw when a record cannot be modified through tenant APIs.
        /// </summary>
        /// <param name="recordTenantId">Record tenant identifier (null for built-ins).</param>
        /// <param name="isBuiltIn">Whether the record is built in.</param>
        /// <param name="isProtected">Whether the record is protected.</param>
        /// <param name="routeTenantId">Tenant in the route.</param>
        /// <param name="what">Record description for messages.</param>
        /// <exception cref="ConflictException">Thrown for built-in or protected records.</exception>
        /// <exception cref="NotFoundException">Thrown when the record belongs to another tenant.</exception>
        public static void EnsureEditable(string? recordTenantId, bool isBuiltIn, bool isProtected, string routeTenantId, string what)
        {
            if (isBuiltIn || recordTenantId == null) throw new ConflictException("BuiltInImmutable", what + " is built in and cannot be modified. Clone it to customize.");
            if (recordTenantId != routeTenantId) throw new NotFoundException(what + " not found.");
            if (isProtected) throw new ConflictException("Protected", what + " is protected.");
        }

        /// <summary>
        /// Deployments in a tenant matching a predicate.
        /// </summary>
        /// <param name="server">Server context.</param>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="predicate">Predicate.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Matching deployments.</returns>
        public static async Task<List<Deployment>> DeploymentsAsync(ServerContext server, string tenantId, Func<Deployment, bool> predicate, CancellationToken token)
        {
            List<Deployment> deployments = await server.Database.Deployments.ListByTenantAsync(tenantId, token).ConfigureAwait(false);
            return deployments.Where(predicate).ToList();
        }

        /// <summary>
        /// Throw when deployments still reference a record.
        /// </summary>
        /// <param name="server">Server context.</param>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="predicate">Reference predicate.</param>
        /// <param name="what">Record description.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        /// <exception cref="ConflictException">Thrown when referenced.</exception>
        public static async Task EnsureUnreferencedAsync(ServerContext server, string tenantId, Func<Deployment, bool> predicate, string what, CancellationToken token)
        {
            List<Deployment> users = await DeploymentsAsync(server, tenantId, predicate, token).ConfigureAwait(false);
            if (users.Count > 0) throw new ConflictException("InUse", what + " is used by deployment(s) " + String.Join(", ", users.Select(d => d.Name)) + ".");
        }

        /// <summary>
        /// Throw when a tenant already has a record with the name.
        /// </summary>
        /// <param name="exists">Existing record with the same name in the tenant, or null.</param>
        /// <param name="existingId">Identifier of the existing record, or null.</param>
        /// <param name="currentId">Identifier of the record being saved, or null on create.</param>
        /// <param name="name">Name.</param>
        /// <exception cref="ConflictException">Thrown when the name is taken.</exception>
        public static void EnsureNameAvailable(object? exists, string? existingId, string? currentId, string name)
        {
            if (exists != null && existingId != currentId) throw new ConflictException("NameConflict", "The name '" + name + "' is already used in this tenant.");
        }
    }
}
