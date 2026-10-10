namespace Garrison.Core.Database.Postgresql.Queries
{
    using System;
    using Garrison.Core.Database.Sql;
    using Garrison.Core.Enums;
    using Npgsql;

    /// <summary>
    /// PostgreSQL dialect.
    /// </summary>
    public class PostgresqlDialect : SqlDialect
    {
        #region Public-Members

        /// <inheritdoc />
        public override DatabaseTypeEnum DatabaseType
        {
            get
            {
                return DatabaseTypeEnum.Postgresql;
            }
        }

        /// <inheritdoc />
        public override bool SupportsReturning
        {
            get
            {
                return true;
            }
        }

        /// <inheritdoc />
        public override string TypeText
        {
            get
            {
                return "TEXT";
            }
        }

        /// <inheritdoc />
        public override string TypeBool
        {
            get
            {
                return "BOOLEAN";
            }
        }

        /// <inheritdoc />
        public override string TypeDouble
        {
            get
            {
                return "DOUBLE PRECISION";
            }
        }

        /// <inheritdoc />
        public override string TypeTimestamp
        {
            get
            {
                return "TIMESTAMPTZ";
            }
        }

        #endregion

        #region Public-Methods

        /// <inheritdoc />
        public override string Quote(string identifier)
        {
            if (String.IsNullOrEmpty(identifier)) throw new ArgumentNullException(nameof(identifier));
            return "\"" + identifier.Replace("\"", "\"\"") + "\"";
        }

        /// <inheritdoc />
        public override string BooleanLiteral(bool value)
        {
            return value ? "TRUE" : "FALSE";
        }

        /// <inheritdoc />
        public override string CaseInsensitiveLike(string columnReference, string parameterName)
        {
            return columnReference + " ILIKE @" + parameterName;
        }

        /// <inheritdoc />
        public override string TableExistsProbe(string? schema)
        {
            if (String.IsNullOrEmpty(schema)) return "SELECT 1 FROM information_schema.tables WHERE table_name = @name LIMIT 1;";
            return "SELECT 1 FROM information_schema.tables WHERE table_name = @name AND table_schema = @schema LIMIT 1;";
        }

        /// <inheritdoc />
        public override string ColumnExistsProbe(string? schema)
        {
            if (String.IsNullOrEmpty(schema)) return "SELECT 1 FROM information_schema.columns WHERE table_name = @table AND column_name = @column AND table_schema = current_schema() LIMIT 1;";
            return "SELECT 1 FROM information_schema.columns WHERE table_name = @table AND column_name = @column AND table_schema = @schema LIMIT 1;";
        }

        /// <inheritdoc />
        public override string AddColumn(string? schema, string rawTableName, string column, string definition)
        {
            return "ALTER TABLE " + QualifiedReference(schema, rawTableName) + " ADD COLUMN IF NOT EXISTS " + column + " " + definition + ";";
        }

        /// <inheritdoc />
        public override string? CreateSchemaStatement(string schema)
        {
            if (String.IsNullOrEmpty(schema)) return null;
            return "CREATE SCHEMA IF NOT EXISTS " + Quote(schema) + ";";
        }

        /// <inheritdoc />
        public override bool IsTransientConflict(Exception exception)
        {
            if (exception is PostgresException pg) return pg.SqlState == "40001" || pg.SqlState == "40P01";
            return false;
        }

        #endregion
    }
}
