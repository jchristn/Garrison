namespace Garrison.Sdk.Clients
{
    using System;
    using System.Collections.Generic;
    using System.Net.Http;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Sdk.Enumeration;
    using Garrison.Sdk.Http;
    using Garrison.Sdk.Models;
    using Garrison.Sdk.Requests;
    using Garrison.Sdk.Responses;

    /// <summary>
    /// Operator-configured model prices.
    /// </summary>
    public class ModelPricesClient : ResourceClient<ModelPrice, ModelPrice>
    {
        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="transport">Transport.</param>
        public ModelPricesClient(GarrisonTransport transport) : base(transport, "model-prices")
        {
        }

    }
}
