namespace Garrison.Sdk.Responses
{
    using System;
    using System.Collections.Generic;
    using Garrison.Sdk.Enums;

    /// <summary>
    /// Result of one hasPermission evaluation at tenant level.
    /// </summary>
    public class PermissionCheck
    {
        /// <summary>
        /// Resource type.
        /// </summary>
        public ResourceTypeEnum ResourceType { get; set; } = ResourceTypeEnum.All;

        /// <summary>
        /// Operation.
        /// </summary>
        public OperationTypeEnum Operation { get; set; } = OperationTypeEnum.Read;

        /// <summary>
        /// Whether the principal may perform the operation.
        /// </summary>
        public bool Permitted { get; set; } = false;
    }
}
