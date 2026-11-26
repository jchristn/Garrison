namespace Garrison.Server.Routes
{
    using System;
    using System.Collections.Generic;
    using System.Threading.Tasks;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Requests;
    using Garrison.Core.Services;
    using Garrison.Server.Runtime;
    using WatsonWebserver.Core;

    /// <summary>
    /// Board routes (AA10, plan section 7.4): the aggregate board of an organization, the board's direction to its top
    /// agent, and conversations with the top agent. Every route filters by the request's tenant; another tenant's
    /// organization answers 404. Run tokens never hold Organization permissions.
    /// </summary>
    public class BoardRoutes
    {
        #region Private-Members

        private readonly OrganizationService _Organizations;
        private readonly BoardService _Board;
        private static readonly string _Base = "/v1.0/api/tenants/{tenantId}/organizations/{id}";

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="organizations">Organization service.</param>
        /// <param name="board">Board service.</param>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null.</exception>
        public BoardRoutes(OrganizationService organizations, BoardService board)
        {
            _Organizations = organizations ?? throw new ArgumentNullException(nameof(organizations));
            _Board = board ?? throw new ArgumentNullException(nameof(board));
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Register routes.
        /// </summary>
        /// <param name="routes">Route registrar.</param>
        /// <exception cref="ArgumentNullException">Thrown when routes is null.</exception>
        public void Register(RouteRegistrar routes)
        {
            if (routes == null) throw new ArgumentNullException(nameof(routes));
            const string tag = "Board";
            routes.Scoped(HttpMethod.GET, _Base + "/board", ResourceTypeEnum.Organization, OperationTypeEnum.Read, GetAsync, "The board of an organization in one call: chart with unit health, the CEO, open escalations, pending proposals with evidence, spend, the latest brief, recent unhealthy reports, active freezes, and the kill switch (query: limit, 1 to 100, default 20)", tag, null, typeof(Board));
            routes.Scoped(HttpMethod.POST, _Base + "/direction", ResourceTypeEnum.Organization, OperationTypeEnum.Update, DirectAsync, "Give the board's direction to the organization's top agent: publishes a copy of its mandate's current revision with this direction, source Board, and the caller as author", tag, typeof(BoardDirectionRequest), typeof(MandateRevision));
            routes.Scoped(HttpMethod.POST, _Base + "/board/messages", ResourceTypeEnum.Organization, OperationTypeEnum.Update, SendMessageAsync, "Talk to the organization's top agent: starts a run on its mandate's deployment as the caller, in a new board conversation or the one named; follow the run and continue with its conversationId", tag, typeof(BoardMessageRequest), typeof(Run));
            routes.Scoped(HttpMethod.GET, _Base + "/board/conversations", ResourceTypeEnum.Organization, OperationTypeEnum.Read, ListConversationsAsync, "Conversations the board started with the organization's top agent, newest first (query: maxResults, skip)", tag, null, typeof(EnumerationResult<Conversation>));
        }

        #endregion

        #region Private-Methods

        private async Task GetAsync(HttpContextBase http)
        {
            Organization organization = await LoadAsync(http).ConfigureAwait(false);
            string? raw = RouteHelpers.Query(http, "limit");
            int? limit = RouteHelpers.QueryInt(http, "limit");
            if (!String.IsNullOrEmpty(raw) && !limit.HasValue)
            {
                throw new ValidationException("The board request is invalid.", new Dictionary<string, string> { ["limit"] = "limit is an integer from 1 to " + BoardService.MaxLimit + "." }, new Dictionary<string, string> { ["limit"] = "InvalidValue" });
            }
            Board board = await _Board.GetAsync(organization, limit, http.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, board).ConfigureAwait(false);
        }

        private async Task DirectAsync(HttpContextBase http)
        {
            Organization organization = await LoadAsync(http).ConfigureAwait(false);
            BoardDirectionRequest body = RouteHelpers.RequiredBody<BoardDirectionRequest>(http);
            MandateRevision revision = await _Board.DirectAsync(RouteHelpers.Context(http), organization, body, http.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 201, revision).ConfigureAwait(false);
        }

        private async Task SendMessageAsync(HttpContextBase http)
        {
            Organization organization = await LoadAsync(http).ConfigureAwait(false);
            BoardMessageRequest body = RouteHelpers.RequiredBody<BoardMessageRequest>(http);
            Run run = await _Board.SendMessageAsync(RouteHelpers.Context(http), organization, body, http.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 202, run).ConfigureAwait(false);
        }

        private async Task ListConversationsAsync(HttpContextBase http)
        {
            Organization organization = await LoadAsync(http).ConfigureAwait(false);
            EnumerationResult<Conversation> page = await _Board.ListConversationsAsync(organization, RouteHelpers.Enumeration(http), http.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, page).ConfigureAwait(false);
        }

        private async Task<Organization> LoadAsync(HttpContextBase http)
        {
            string id = RouteHelpers.Param(http, "id") ?? String.Empty;
            Organization? organization = await _Organizations.FindAsync(RouteHelpers.Tenant(http), id, http.Token).ConfigureAwait(false);
            if (organization == null) throw new NotFoundException("Organization " + id + " not found.");
            return organization;
        }

        #endregion
    }
}
