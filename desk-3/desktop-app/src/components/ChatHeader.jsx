import React from 'react';
import { ModelSelector } from './ModelSelector';
import { TrashIcon, SidebarToggleIcon, BoltIcon } from './Icons';

export const ChatHeader = ({
  activeModel,
  models,
  onSelectModel,
  onClearChat,
  messageCount,
  sessionTitle,
  isSidebarCollapsed,
  onToggleSidebar,
  isModelSelectorOpen,
  onToggleModelSelector
}) => {
  return (
    <header className="top-header">
      <div className="header-left">
        {isSidebarCollapsed && (
          <button
            type="button"
            className="header-sidebar-toggle"
            onClick={onToggleSidebar}
            title="Expand Sidebar (⌘B)"
          >
            <SidebarToggleIcon size={16} />
          </button>
        )}

        <div className="header-breadcrumb">
          <span className="header-crumb-brand">
            <BoltIcon size={13} color="#f97316" />
            <span>Groq Studio</span>
          </span>
          <span className="header-crumb-sep">/</span>
          <span className="header-session-name" title={sessionTitle || 'New conversation'}>
            {sessionTitle || 'New conversation'}
          </span>
        </div>
      </div>

      <div className="header-controls">
        {messageCount > 0 && (
          <span className="header-message-badge">
            {messageCount} {messageCount === 1 ? 'msg' : 'msgs'}
          </span>
        )}

        <ModelSelector
          activeModel={activeModel}
          models={models}
          onSelectModel={onSelectModel}
          isOpenExternal={isModelSelectorOpen}
          onToggleExternal={onToggleModelSelector}
        />

        {messageCount > 0 && (
          <button
            type="button"
            className="clear-chat-btn"
            onClick={() => {
              if (window.confirm('Clear messages in this conversation?')) {
                onClearChat();
              }
            }}
            title="Clear conversation"
          >
            <TrashIcon size={13} />
            <span>Clear</span>
          </button>
        )}
      </div>
    </header>
  );
};
