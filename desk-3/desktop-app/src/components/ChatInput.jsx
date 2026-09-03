import React, { useRef, useEffect } from 'react';
import { SendIcon, StopIcon, BoltIcon } from './Icons';

export const ChatInput = ({
  input,
  setInput,
  onSendMessage,
  onStopStreaming,
  isStreaming,
  activeModel
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

  return (
    <div className="input-dock-container">
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
          <div className="input-model-indicator">
            <BoltIcon size={13} color="#f97316" />
            <span className="indicator-name">{activeModel?.name}</span>
            <span className="indicator-sep">·</span>
            <span className="indicator-speed">{activeModel?.speed}</span>
          </div>

          <div className="input-actions">
            <span className="input-shortcut">
              <strong>Enter</strong> to send
            </span>

            {isStreaming ? (
              <button
                type="button"
                className="input-stop-btn"
                onClick={onStopStreaming}
                title="Stop generation"
              >
                <StopIcon size={12} />
                <span>Stop</span>
              </button>
            ) : (
              <button
                type="button"
                className="input-send-btn"
                onClick={onSendMessage}
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
  );
};
