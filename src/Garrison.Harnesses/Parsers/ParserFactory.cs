namespace Garrison.Harnesses.Parsers
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Compilation;
    using Garrison.Core.Enums;

    /// <summary>
    /// Creates parser instances. Thread-safe.
    /// </summary>
    public static class ParserFactory
    {
        /// <summary>
        /// Create a parser.
        /// </summary>
        /// <param name="parser">Parser kind.</param>
        /// <param name="options">Generic parser options.</param>
        /// <param name="requiredMcpServers">MCP servers that must connect (used by parsers that can observe MCP status).</param>
        /// <returns>Parser.</returns>
        /// <exception cref="ArgumentException">Thrown for an unknown parser kind.</exception>
        public static IHarnessOutputParser Create(OutputParserEnum parser, ExecutionParserOptions? options = null, IEnumerable<string>? requiredMcpServers = null)
        {
            switch (parser)
            {
                case OutputParserEnum.ClaudeStreamJson: return new ClaudeStreamJsonParser(requiredMcpServers);
                case OutputParserEnum.CodexJsonl: return new CodexJsonlParser();
                case OutputParserEnum.CodexAppServer:
                    CodexAppServerParser appServer = new CodexAppServerParser(requiredMcpServers);
                    appServer.ApprovalsRelayed = options?.ApprovalsRelayed ?? false;
                    return appServer;
                case OutputParserEnum.MuxJsonl: return new MuxJsonlParser(requiredMcpServers);
                case OutputParserEnum.GeminiStreamJson: return new GeminiStreamJsonParser();
                case OutputParserEnum.GenericJsonl: return new GenericJsonlParser(options ?? new ExecutionParserOptions());
                case OutputParserEnum.PlainText: return new PlainTextParser();
                default: throw new ArgumentException("Unknown output parser " + parser + ".", nameof(parser));
            }
        }
    }
}
