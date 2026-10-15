namespace Garrison.FakeHarness
{
    using System;
    using System.Text;

    /// <summary>
    /// Result of one isolation probe. <see cref="ToLine"/> renders it as one line,
    /// <c>PROBE|kind|target|OUTCOME|detail</c>, so a script can assert on run output with a plain field split. The
    /// detail never contains file contents, environment values, or tokens; only sizes, names, and errors.
    /// </summary>
    public class FakeProbeResult
    {
        #region Public-Members

        /// <summary>
        /// Prefix of every result line.
        /// </summary>
        public static readonly string LinePrefix = "PROBE|";

        /// <summary>
        /// Probe kind, for example read or connect.
        /// </summary>
        public string Kind
        {
            get
            {
                return _Kind;
            }
            set
            {
                _Kind = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Probe target as given, for example a path or host:port.
        /// </summary>
        public string Target
        {
            get
            {
                return _Target;
            }
            set
            {
                _Target = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Outcome. Default <see cref="FakeProbeOutcomeEnum.Error"/>.
        /// </summary>
        public FakeProbeOutcomeEnum Outcome { get; set; } = FakeProbeOutcomeEnum.Error;

        /// <summary>
        /// What happened, for people: a size, the names found, or the error. Never null.
        /// </summary>
        public string Detail
        {
            get
            {
                return _Detail;
            }
            set
            {
                _Detail = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Maximum characters of the detail written by <see cref="ToLine"/>. Minimum 16, maximum 4096, default 300.
        /// </summary>
        public int MaxDetailChars
        {
            get
            {
                return _MaxDetailChars;
            }
            set
            {
                _MaxDetailChars = Math.Clamp(value, 16, 4096);
            }
        }

        #endregion

        #region Private-Members

        private string _Kind = String.Empty;
        private string _Target = String.Empty;
        private string _Detail = String.Empty;
        private int _MaxDetailChars = 300;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        public FakeProbeResult()
        {
        }

        /// <summary>
        /// Instantiate with values.
        /// </summary>
        /// <param name="kind">Probe kind.</param>
        /// <param name="target">Probe target.</param>
        /// <param name="outcome">Outcome.</param>
        /// <param name="detail">Detail.</param>
        public FakeProbeResult(string kind, string target, FakeProbeOutcomeEnum outcome, string detail)
        {
            Kind = kind;
            Target = target;
            Outcome = outcome;
            Detail = detail;
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// The result as one line: <c>PROBE|kind|target|OUTCOME|detail</c>, with the outcome upper case (ALLOWED,
        /// BLOCKED, DONE, ERROR). A '|' or line break inside a field becomes '/' or a space, and the detail is cut to
        /// <see cref="MaxDetailChars"/>.
        /// </summary>
        /// <returns>Line without a line terminator.</returns>
        public string ToLine()
        {
            string detail = Clean(_Detail);
            if (detail.Length > _MaxDetailChars) detail = detail.Substring(0, _MaxDetailChars);
            StringBuilder line = new StringBuilder();
            line.Append(LinePrefix);
            line.Append(Clean(_Kind)).Append('|');
            line.Append(Clean(_Target)).Append('|');
            line.Append(Outcome.ToString().ToUpperInvariant()).Append('|');
            line.Append(detail);
            return line.ToString();
        }

        /// <inheritdoc />
        public override string ToString()
        {
            return ToLine();
        }

        #endregion

        #region Private-Methods

        private static string Clean(string value)
        {
            return value.Replace('|', '/').Replace('\r', ' ').Replace('\n', ' ').Replace('\t', ' ');
        }

        #endregion
    }
}
