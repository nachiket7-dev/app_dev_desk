import React, { useRef, useEffect } from 'react';
import { SendIcon, StopIcon, BoltIcon } from './Icons';

export const ChatInput = ({
  input,
  setInput,
  onSendMessage,
  onStopStreaming,
  isStreaming,
  activeModel,
  onOpenModelSelector
}) => {
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [input]);

  useEffect(() => {
    if (!isStreaming && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isStreaming]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isStreaming) {
        onSendMessage();
      }
    }
  };

  const charCount = input.length;
  const estimatedTokens = Math.ceil(charCount / 4);

  return (
    <div className="input-dock-container">
      <div className="input-box-wrapper">
        <div className="input-box">
          <textarea
            ref={textareaRef}
            className="chat-textarea"
            placeholder={`Message ${activeModel?.name || 'assistant'}...`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
          />

          <div className="input-footer">
            <button
              type="button"
              className="input-model-chip"
              onClick={onOpenModelSelector}
              title="Click to switch model (⌘M)"
            >
              <BoltIcon size={13} color="#f97316" />
              <span className="chip-name">{activeModel?.name}</span>
              <span className="chip-sep">·</span>
              <span className="chip-speed">{activeModel?.speed}</span>
            </button>

            <div className="input-actions-group">
              {charCount > 0 && (
                <div className="input-stats-pill">
                  <span>{charCount} chars</span>
                  <span className="stat-sep">·</span>
                  <span>~{estimatedTokens} tok</span>
                </div>
              )}

              <div className="input-shortcuts-hints">
                <span className="shortcut-item">
                  <kbd>↵</kbd> Send
                </span>
                <span className="shortcut-item">
                  <kbd>⇧↵</kbd> Line
                </span>
              </div>

              {isStreaming ? (
                <button
                  type="button"
                  className="input-stop-btn"
                  onClick={onStopStreaming}
                  title="Stop generation (Esc)"
                >
                  <StopIcon size={12} />
                  <span>Stop</span>
                </button>
              ) : (
                <button
                  type="button"
                  className={`input-send-btn ${input.trim() ? 'ready' : ''}`}
                  onClick={() => onSendMessage()}
                  disabled={!input.trim()}
                  title="Send message (Enter)"
                >
                  <SendIcon size={14} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
