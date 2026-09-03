import React, { useState } from 'react';
import { CopyIcon, CheckIcon, BoltIcon, ChevronDownIcon } from './Icons';

/**
 * Lightweight syntax and markdown renderer
 */
const renderMarkdown = (content) => {
  if (!content) return null;

  // Extract reasoning / think tags
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

  // Split content by code blocks: ```lang\ncode\n```
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
      {reasoning && <ReasoningBlock reasoning={reasoning} />}
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

const ReasoningBlock = ({ reasoning }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="reasoning-accordion">
      <button
        type="button"
        className="reasoning-trigger"
        onClick={() => setOpen(!open)}
      >
        <span className="reasoning-label">Thought Process</span>
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

const CodeBlock = ({ code, language }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="code-container">
      <div className="code-top-bar">
        <span className="code-lang-label">{language || 'code'}</span>
        <button
          type="button"
          className="code-copy-action"
          onClick={handleCopy}
          title="Copy code"
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
      </div>
      <pre className="code-content">
        <code>{code}</code>
      </pre>
    </div>
  );
};

const FormattedText = ({ text }) => {
  const lines = text.split('\n');

  return (
    <>
      {lines.map((line, idx) => {
        const trimmed = line.trim();

        if (trimmed === '---' || trimmed === '***') {
          return <hr key={idx} className="text-divider" />;
        }

        if (trimmed.startsWith('### ')) {
          return <h3 key={idx} className="text-h3">{renderInline(trimmed.slice(4))}</h3>;
        }
        if (trimmed.startsWith('## ')) {
          return <h2 key={idx} className="text-h2">{renderInline(trimmed.slice(3))}</h2>;
        }
        if (trimmed.startsWith('# ')) {
          return <h1 key={idx} className="text-h1">{renderInline(trimmed.slice(2))}</h1>;
        }

        if (trimmed.startsWith('> ')) {
          return (
            <blockquote key={idx} className="text-blockquote">
              {renderInline(trimmed.slice(2))}
            </blockquote>
          );
        }

        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return (
            <li key={idx} className="text-list-item">
              {renderInline(trimmed.slice(2))}
            </li>
          );
        }

        const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
        if (numMatch) {
          return (
            <div key={idx} className="text-numbered-row">
              <span className="text-numbered-index">{numMatch[1]}.</span>
              <span>{renderInline(numMatch[2])}</span>
            </div>
          );
        }

        if (!trimmed) {
          return <div key={idx} className="text-empty-line" />;
        }

        return <p key={idx} className="text-paragraph">{renderInline(line)}</p>;
      })}
    </>
  );
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

export const ChatMessage = ({ message, activeModel, isStreaming }) => {
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
      <div className="chat-message-wrapper">
        <div className="message-meta-line">
          {isUser ? (
            <span className="user-sender-label">You</span>
          ) : (
            <div className="assistant-sender-label">
              <BoltIcon size={13} color="#f97316" />
              <span className="assistant-model-title">
                {message.modelName || activeModel?.name || 'Groq'}
              </span>
            </div>
          )}
          {formattedTime && <span className="message-timestamp">{formattedTime}</span>}
        </div>

        <div className={`message-bubble ${isUser ? 'user-bubble' : 'assistant-bubble'}`}>
          {renderMarkdown(message.content)}
          {isStreaming && <span className="streaming-cursor" />}
        </div>

        {!isStreaming && message.content && (
          <div className="message-action-toolbar">
            <button
              type="button"
              className="copy-message-btn"
              onClick={handleCopyMessage}
              title="Copy message"
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
          </div>
        )}
      </div>
    </div>
  );
};
