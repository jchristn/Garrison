namespace Garrison.Core.Database.Ado
{
    using System;
    using System.Data.Common;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;

    /// <summary>Typed column mapping for executor capabilities and requirements.</summary>
    public static class ExecutorCapabilitySql
    {
        /// <summary>Read a capability requirement record.</summary>
        /// <param name="reader">Current row.</param>
        /// <returns>Requirements.</returns>
        public static ExecutorRequirements Read(DbDataReader reader)
        {
            return new ExecutorRequirements
            {
                Isolation = (ExecutorIsolationEnum)AdoConverters.Int(reader, "capisolation"),
                EgressControl = AdoConverters.Bool(reader, "capegresscontrol"),
                FilesystemSnapshot = AdoConverters.Bool(reader, "capfilesystemsnapshot"),
                SessionContinuation = AdoConverters.Bool(reader, "capsessioncontinuation"),
                CrossNodeRestore = AdoConverters.Bool(reader, "capcrossnoderestore"),
                ColdStartClass = AdoConverters.NullableEnum<ExecutorColdStartEnum>(reader, "capcoldstartclass")
            };
        }

        /// <summary>Bind requirements to fixed column parameters.</summary>
        /// <param name="command">Command.</param>
        /// <param name="value">Requirements.</param>
        public static void Bind(DbCommand command, ExecutorRequirements value)
        {
            AdoDatabaseDriver.Add(command, "capisolation", (int)value.Isolation);
            AdoDatabaseDriver.Add(command, "capegresscontrol", value.EgressControl);
            AdoDatabaseDriver.Add(command, "capfilesystemsnapshot", value.FilesystemSnapshot);
            AdoDatabaseDriver.Add(command, "capsessioncontinuation", value.SessionContinuation);
            AdoDatabaseDriver.Add(command, "capcrossnoderestore", value.CrossNodeRestore);
            AdoDatabaseDriver.Add(command, "capcoldstartclass", value.ColdStartClass?.ToString());
        }
    }
}
