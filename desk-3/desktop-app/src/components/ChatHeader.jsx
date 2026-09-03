import React from 'react';
import { ModelSelector } from './ModelSelector';
import { TrashIcon } from './Icons';

export const ChatHeader = ({
  activeModel,
  models,
  onSelectModel,
  onClearChat,
  messageCount,
  sessionTitle
}) => {
  return (
    <header className="top-header">
      <div className="header-title-container">
        <span className="header-session-name">
          {sessionTitle || 'New conversation'}
        </span>
      </div>

      <div className="header-controls">
        <ModelSelector
          activeModel={activeModel}
          models={models}
          onSelectModel={onSelectModel}
        />

        {messageCount > 0 && (
          <button
            type="button"
            className="clear-chat-btn"
            onClick={onClearChat}
            title="Clear conversation"
          >
            <TrashIcon size={14} />
            <span>Clear</span>
          </button>
        )}
      </div>
    </header>
  );
};
