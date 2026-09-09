import React, { useState } from 'react';
import {
  CopyIcon,
  CheckIcon,
  BoltIcon,
  ChevronDownIcon,
  RotateCcwIcon,
  BrainIcon
} from './Icons';

/**
 * High-performance regex syntax highlighter for code snippets
 */
const renderHighlightedLine = (line) => {
  if (!line) return ' ';

  const tokens = [];
  const tokenRegex = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/|#[^\n]*)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)|(\b\d+(?:\.\d+)?\b)|(\b(?:const|let|var|function|return|if|else|for|while|class|import|export|from|default|async|await|new|try|catch|throw|switch|case|break|continue|typeof|interface|type|def|self|lambda|elif|with|as|pass|None|True|False|nil|SELECT|FROM|WHERE|INSERT|UPDATE|DELETE)\b)|(\b[a-zA-Z_]\w*(?=\s*\()|\b(?:console|document|window|Math|JSON|Promise|Array|Object|String|Number)\b)/g;

  let lastIndex = 0;
  let match;

  while ((match = tokenRegex.exec(line)) !== null) {
    if (match.index > lastIndex) {
      tokens.push(line.substring(lastIndex, match.index));
    }

    if (match[1]) {
      // Comment
      tokens.push(
        <span key={match.index} className="tok-comment">
          {match[1]}
        </span>
      );
    } else if (match[2]) {
      // String
      tokens.push(
        <span key={match.index} className="tok-string">
          {match[2]}
        </span>
      );
    } else if (match[3]) {
      // Number
      tokens.push(
        <span key={match.index} className="tok-number">
          {match[3]}
        </span>
      );
    } else if (match[4]) {
      // Keyword
      tokens.push(
        <span key={match.index} className="tok-keyword">
          {match[4]}
        </span>
      );
    } else if (match[5]) {
      // Function / Builtin
      tokens.push(
        <span key={match.index} className="tok-function">
          {match[5]}
        </span>
      );
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < line.length) {
    tokens.push(line.substring(lastIndex));
  }

  return tokens.length > 0 ? tokens : line;
};

/**
 * CodeBlock with syntax highlighting, line numbers toggle, and 1-click copy
 */
const CodeBlock = ({ code, language }) => {
  const [copied, setCopied] = useState(false);
  const [showLineNumbers, setShowLineNumbers] = useState(true);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = code ? code.replace(/\n$/, '').split('\n') : [];
  const displayLang = (language || 'code').toUpperCase();

  return (
    <div className="code-card">
      <div className="code-card-header">
        <div className="code-card-header-left">
          <div className="mac-window-dots" aria-hidden="true">
            <span className="mac-dot red" />
            <span className="mac-dot yellow" />
            <span className="mac-dot green" />
          </div>
          <div className="code-card-lang-chip">
            <span className="code-lang-dot" />
            <span className="code-lang-text">{displayLang}</span>
          </div>
        </div>

        <div className="code-card-actions">
          <button
            type="button"
            className={`code-toggle-lines-btn ${showLineNumbers ? 'active' : ''}`}
            onClick={() => setShowLineNumbers(!showLineNumbers)}
            title="Toggle line numbers"
          >
            #
          </button>

          <button
            type="button"
            className="code-copy-btn"
            onClick={handleCopy}
            title="Copy snippet"
          >
            {copied ? (
              <>
                <CheckIcon size={12} color="#10b981" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <CopyIcon size={12} />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="code-content-wrapper">
        <pre className="code-pre">
          <code>
            {lines.map((line, idx) => (
              <div key={idx} className="code-line-row">
                {showLineNumbers && (
                  <span className="code-gutter-num">{idx + 1}</span>
                )}
                <span className="code-line-text">
                  {renderHighlightedLine(line)}
                </span>
              </div>
            ))}
          </code>
        </pre>
      </div>
    </div>
  );
};

/**
 * Reasoning Accordion with brain icon and smooth folding
 */
const ReasoningBlock = ({ reasoning, isStreaming }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="reasoning-accordion">
      <button
        type="button"
        className="reasoning-trigger"
        onClick={() => setOpen(!open)}
      >
        <div className="reasoning-trigger-left">
          <BrainIcon size={13} color="#a855f7" />
          <span className="reasoning-label">Thought Process</span>
          {isStreaming && <span className="reasoning-pulsing-badge">Thinking...</span>}
        </div>
        <ChevronDownIcon
          size={13}
          className={`reasoning-chevron ${open ? 'expanded' : ''}`}
        />
      </button>
      {open && (
        <div className="reasoning-panel">
          <pre>{reasoning}</pre>
        </div>
      )}
    </div>
  );
};

const splitTableRow = (rowStr) => {
  const cells = [];
  let current = '';
  let insideBacktick = false;

  for (let idx = 0; idx < rowStr.length; idx++) {
    const ch = rowStr[idx];
    if (ch === '`') {
      insideBacktick = !insideBacktick;
      current += ch;
    } else if (ch === '|' && !insideBacktick) {
      cells.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  cells.push(current.trim());

  if (cells.length > 0 && cells[0] === '') cells.shift();
  if (cells.length > 0 && cells[cells.length - 1] === '') cells.pop();

  return cells;
};

/**
 * Formatted Markdown Text Parser
 */
const FormattedText = ({ text }) => {
  const lines = text.split('\n');
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Check if beginning of markdown table: | header | header | followed by |---|---|
    if (
      trimmed.startsWith('|') &&
      trimmed.endsWith('|') &&
      i + 1 < lines.length &&
      lines[i + 1].trim().startsWith('|') &&
      lines[i + 1].includes('-')
    ) {
      const tableLines = [];
      while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
        tableLines.push(lines[i].trim());
        i++;
      }

      if (tableLines.length >= 2) {
        const headerCells = splitTableRow(tableLines[0]);
        const bodyRows = tableLines.slice(2).map((r) => splitTableRow(r));

        elements.push(
          <div key={`table-${i}`} className="table-responsive-wrapper">
            <table className="markdown-table">
              <thead>
                <tr>
                  {headerCells.map((c, cIdx) => (
                    <th key={cIdx}>{renderInline(c)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bodyRows.map((r, rIdx) => (
                  <tr key={rIdx}>
                    {r.map((c, cIdx) => (
                      <td key={cIdx}>{renderInline(c)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        continue;
      }
    }

    if (trimmed === '---' || trimmed === '***') {
      elements.push(<hr key={i} className="text-divider" />);
      i++;
      continue;
    }

    if (trimmed.startsWith('### ')) {
      elements.push(<h3 key={i} className="text-h3">{renderInline(trimmed.slice(4))}</h3>);
      i++;
      continue;
    }
    if (trimmed.startsWith('## ')) {
      elements.push(<h2 key={i} className="text-h2">{renderInline(trimmed.slice(3))}</h2>);
      i++;
      continue;
    }
    if (trimmed.startsWith('# ')) {
      elements.push(<h1 key={i} className="text-h1">{renderInline(trimmed.slice(2))}</h1>);
      i++;
      continue;
    }

    if (trimmed.startsWith('> ')) {
      elements.push(
        <blockquote key={i} className="text-blockquote">
          {renderInline(trimmed.slice(2))}
        </blockquote>
      );
      i++;
      continue;
    }

    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      elements.push(
        <li key={i} className="text-list-item">
          {renderInline(trimmed.slice(2))}
        </li>
      );
      i++;
      continue;
    }

    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
    if (numMatch) {
      elements.push(
        <div key={i} className="text-numbered-row">
          <span className="text-numbered-index">{numMatch[1]}.</span>
          <span>{renderInline(numMatch[2])}</span>
        </div>
      );
      i++;
      continue;
    }

    if (!trimmed) {
      elements.push(<div key={i} className="text-empty-line" />);
      i++;
      continue;
    }

    elements.push(<p key={i} className="text-paragraph">{renderInline(line)}</p>);
    i++;
  }

  return <>{elements}</>;
};

const renderInline = (str) => {
  if (!str) return '';

  const segments = [];
  const inlineRegex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let lastIdx = 0;
  let match;

  while ((match = inlineRegex.exec(str)) !== null) {
    if (match.index > lastIdx) {
      segments.push(str.substring(lastIdx, match.index));
    }

    const token = match[0];
    if (token.startsWith('`') && token.endsWith('`')) {
      segments.push(
        <code key={match.index} className="inline-code-pill">
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith('**') && token.endsWith('**')) {
      segments.push(
        <strong key={match.index} className="inline-bold">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('*') && token.endsWith('*')) {
      segments.push(
        <em key={match.index} className="inline-italic">
          {token.slice(1, -1)}
        </em>
      );
    }
    lastIdx = match.index + match[0].length;
  }

  if (lastIdx < str.length) {
    segments.push(str.substring(lastIdx));
  }

  return segments;
};

/**
 * Main Markdown content parser
 */
const renderMarkdown = (content, isStreaming) => {
  if (!content) return null;

  let reasoning = null;
  let mainContent = content;

  const thinkMatch = content.match(/<think>([\s\S]*?)<\/think>/i);
  if (thinkMatch) {
    reasoning = thinkMatch[1].trim();
    mainContent = content.replace(/<think>[\s\S]*?<\/think>/i, '').trim();
  } else if (content.startsWith('<think>')) {
    reasoning = content.slice(7).trim();
    mainContent = '';
  }

  const parts = [];
  const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(mainContent)) !== null) {
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: mainContent.substring(lastIndex, match.index)
      });
    }
    parts.push({
      type: 'code',
      language: match[1] || 'plaintext',
      code: match[2]
    });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < mainContent.length) {
    parts.push({
      type: 'text',
      content: mainContent.substring(lastIndex)
    });
  }

  return (
    <div className="message-markdown">
      {reasoning && <ReasoningBlock reasoning={reasoning} isStreaming={isStreaming} />}
      {parts.map((part, index) => {
        if (part.type === 'code') {
          return (
            <CodeBlock key={index} code={part.code} language={part.language} />
          );
        }
        return <FormattedText key={index} text={part.content} />;
      })}
    </div>
  );
};

export const ChatMessage = ({ message, activeModel, isStreaming, onRetryPrompt }) => {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formattedTime = message.timestamp
    ? new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <div className={`chat-message-row ${isUser ? 'user-row' : 'assistant-row'}`}>
      {isUser ? (
        <div className="chat-user-wrapper">
          <div className="user-bubble">
            {renderMarkdown(message.content, false)}
          </div>
          <div className="user-meta-line">
            <span className="user-name-tag">You</span>
            {formattedTime && <span className="message-timestamp">{formattedTime}</span>}
            <button
              type="button"
              className="user-copy-btn"
              onClick={handleCopyMessage}
              title="Copy message"
            >
              {copied ? <CheckIcon size={11} color="#10b981" /> : <CopyIcon size={11} />}
            </button>
          </div>
        </div>
      ) : (
        <div className="chat-assistant-wrapper">
          <div className="assistant-header-bar">
            <div className="assistant-avatar-badge">
              <BoltIcon size={13} color="#f97316" />
            </div>
            <span className="assistant-model-title">
              {message.modelName || activeModel?.name || 'Groq LPU'}
            </span>
            {activeModel?.speed && (
              <span className="assistant-speed-badge">
                <span className="pulse-dot" />
                {activeModel.speed}
              </span>
            )}
            {formattedTime && <span className="assistant-timestamp">{formattedTime}</span>}

            {!isStreaming && message.content && (
              <div className="assistant-actions-toolbar">
                <button
                  type="button"
                  className="assistant-action-btn"
                  onClick={handleCopyMessage}
                  title="Copy full response"
                >
                  {copied ? (
                    <>
                      <CheckIcon size={12} color="#10b981" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <CopyIcon size={12} />
                      <span>Copy</span>
                    </>
                  )}
                </button>

                {onRetryPrompt && (
                  <button
                    type="button"
                    className="assistant-action-btn"
                    onClick={() => onRetryPrompt(message)}
                    title="Regenerate response"
                  >
                    <RotateCcwIcon size={12} />
                    <span>Retry</span>
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="assistant-body-unboxed">
            {renderMarkdown(message.content, isStreaming)}
            {isStreaming && <span className="streaming-cursor" />}
          </div>
        </div>
      )}
    </div>
  );
};
