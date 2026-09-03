import React from 'react';
import { BoltIcon, PlusIcon, TrashIcon, MessageSquareIcon } from './Icons';

export const Sidebar = ({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onClearAllSessions
}) => {
  return (
    <aside className="app-sidebar">
      {/* Brand Header */}
      <div className="sidebar-brand-row">
        <div className="brand-logo-group">
          <div className="brand-bolt-container">
            <BoltIcon size={16} color="#f97316" />
          </div>
          <span className="brand-title">Groq Studio</span>
          <span className="brand-version-tag">LPU</span>
        </div>

        <button
          type="button"
          className="sidebar-new-btn"
          onClick={onNewChat}
          title="Start new conversation"
        >
          <PlusIcon size={15} />
          <span>New Chat</span>
        </button>
      </div>

      {/* Conversations List */}
      <div className="sidebar-conversations-section">
        <div className="conversations-header">
          <MessageSquareIcon size={12} color="var(--text-muted)" />
          <span>Recent Conversations</span>
        </div>

        {sessions.length === 0 ? (
          <div className="conversations-empty">
            <p>No chat history</p>
            <span>Start a conversation to see it here</span>
          </div>
        ) : (
          <div className="conversations-list">
            {sessions.map((session) => {
              const isActive = session.id === activeSessionId;
              return (
                <div
                  key={session.id}
                  className={`conversation-item ${isActive ? 'active' : ''}`}
                  onClick={() => onSelectSession(session.id)}
                >
                  <div className="conversation-info">
                    <span className="conversation-title">
                      {session.title || 'New conversation'}
                    </span>
                    <div className="conversation-meta">
                      {session.modelName && (
                        <span className="conversation-model-tag">
                          {session.modelName}
                        </span>
                      )}
                      <span className="conversation-date">
                        {new Date(session.updatedAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="conversation-delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSession(session.id);
                    }}
                    title="Delete conversation"
                  >
                    <TrashIcon size={13} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      {sessions.length > 0 && (
        <div className="sidebar-footer-row">
          <button
            type="button"
            className="clear-all-chats-btn"
            onClick={() => {
              if (window.confirm('Delete all saved conversations?')) {
                onClearAllSessions();
              }
            }}
          >
            Clear chat history
          </button>
        </div>
      )}
    </aside>
  );
};
