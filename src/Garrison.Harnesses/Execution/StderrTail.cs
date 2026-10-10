namespace Garrison.Harnesses.Execution
{
    using System;
    using System.Text;

    /// <summary>
    /// Keeps the last N characters of stderr. Thread-safe.
    /// </summary>
    public class StderrTail
    {
        #region Private-Members

        private readonly StringBuilder _Buffer = new StringBuilder();
        private readonly int _Max;
        private readonly object _Lock = new object();

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="max">Maximum retained characters. Minimum 0.</param>
        public StderrTail(int max)
        {
            _Max = Math.Max(0, max);
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Append a line.
        /// </summary>
        /// <param name="line">Line.</param>
        public void Append(string? line)
        {
            if (line == null || _Max == 0) return;
            lock (_Lock)
            {
                _Buffer.Append(line).Append('\n');
                if (_Buffer.Length > _Max) _Buffer.Remove(0, _Buffer.Length - _Max);
            }
        }

        /// <summary>
        /// Current tail.
        /// </summary>
        /// <returns>Text.</returns>
        public override string ToString()
        {
            lock (_Lock)
            {
                return _Buffer.ToString();
            }
        }

        #endregion
    }
}
