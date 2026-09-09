import React, { useState, useRef, useEffect } from 'react';
import {
  BoltIcon,
  PlusIcon,
  TrashIcon,
  MessageSquareIcon,
  SearchIcon,
  EditIcon,
  SidebarToggleIcon,
  KeyboardIcon
} from './Icons';

export const Sidebar = ({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onRenameSession,
  onClearAllSessions,
  isCollapsed,
  onToggleCollapse,
  onOpenShortcuts
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const editInputRef = useRef(null);

  // Focus rename input when editing starts
  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

  const handleStartRename = (session, e) => {
    e.stopPropagation();
    setEditingId(session.id);
    setEditTitle(session.title || '');
  };

  const handleSaveRename = (sessionId) => {
    if (editTitle.trim() && onRenameSession) {
      onRenameSession(sessionId, editTitle.trim());
    }
    setEditingId(null);
  };

  const handleKeyDownRename = (e, sessionId) => {
    if (e.key === 'Enter') {
      handleSaveRename(sessionId);
    } else if (e.key === 'Escape') {
      setEditingId(null);
    }
  };

  // Filter sessions
  const filteredSessions = sessions.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (s.title && s.title.toLowerCase().includes(q)) ||
      (s.modelName && s.modelName.toLowerCase().includes(q))
    );
  });

  // Chronological Grouping
  const groupSessionsByDate = (list) => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const groups = {
      Today: [],
      Yesterday: [],
      'Previous 7 Days': [],
      Older: []
    };

    list.forEach((session) => {
      const d = new Date(session.updatedAt || session.createdAt || Date.now());
      if (d.toDateString() === today.toDateString()) {
        groups.Today.push(session);
      } else if (d.toDateString() === yesterday.toDateString()) {
        groups.Yesterday.push(session);
      } else if (d > oneWeekAgo) {
        groups['Previous 7 Days'].push(session);
      } else {
        groups.Older.push(session);
      }
    });

    return Object.entries(groups).filter(([_, items]) => items.length > 0);
  };

  const groupedSessions = groupSessionsByDate(filteredSessions);

  if (isCollapsed) {
    return (
      <aside className="app-sidebar collapsed">
        <div className="sidebar-collapsed-actions">
          <button
            type="button"
            className="sidebar-collapsed-btn"
            onClick={onToggleCollapse}
            title="Expand Sidebar (⌘B)"
          >
            <SidebarToggleIcon size={16} />
          </button>

          <button
            type="button"
            className="sidebar-collapsed-btn brand-accent"
            onClick={onNewChat}
            title="New Chat (⌘N)"
          >
            <PlusIcon size={16} />
          </button>
        </div>

        <div className="sidebar-collapsed-footer">
          <button
            type="button"
            className="sidebar-collapsed-btn"
            onClick={onOpenShortcuts}
            title="Keyboard Shortcuts (?)"
          >
            <KeyboardIcon size={15} />
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside className="app-sidebar">
      {/* Brand Header */}
      <div className="sidebar-brand-row">
        <div className="brand-header-top">
          <div className="brand-logo-group">
            <div className="brand-bolt-container">
              <BoltIcon size={15} color="#f97316" />
            </div>
            <div className="brand-text-stack">
              <span className="brand-title">Groq Studio</span>
              <span className="brand-subtext">LPU Acceleration</span>
            </div>
          </div>

          <button
            type="button"
            className="sidebar-toggle-btn"
            onClick={onToggleCollapse}
            title="Collapse Sidebar (⌘B)"
          >
            <SidebarToggleIcon size={15} />
          </button>
        </div>

        <button
          type="button"
          className="sidebar-new-btn"
          onClick={onNewChat}
          title="Start new conversation (⌘N)"
        >
          <div className="sidebar-new-btn-left">
            <PlusIcon size={14} />
            <span>New Chat</span>
          </div>
          <kbd className="sidebar-shortcut-badge">⌘N</kbd>
        </button>
      </div>

      {/* Search Input */}
      {sessions.length > 3 && (
        <div className="sidebar-search-box">
          <SearchIcon size={13} color="var(--text-muted)" />
          <input
            type="text"
            className="sidebar-search-input"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="sidebar-search-clear"
              onClick={() => setSearchQuery('')}
            >
              ✕
            </button>
          )}
        </div>
      )}

      {/* Conversations List */}
      <div className="sidebar-conversations-section">
        {filteredSessions.length === 0 ? (
          <div className="conversations-empty">
            <div className="conversations-empty-icon">
              <MessageSquareIcon size={18} color="var(--text-dim)" />
            </div>
            <p>{searchQuery ? 'No matching chats' : 'No chat history'}</p>
            <span>{searchQuery ? 'Try another keyword' : 'Start a new conversation to see it here'}</span>
          </div>
        ) : (
          groupedSessions.map(([groupLabel, items]) => (
            <div key={groupLabel} className="conversation-date-group">
              <div className="conversation-group-header">
                <span>{groupLabel}</span>
                <span className="conversation-group-count">{items.length}</span>
              </div>

              <div className="conversations-list">
                {items.map((session) => {
                  const isActive = session.id === activeSessionId;
                  const isEditing = editingId === session.id;

                  return (
                    <div
                      key={session.id}
                      className={`conversation-item ${isActive ? 'active' : ''}`}
                      onClick={() => onSelectSession(session.id)}
                    >
                      {isActive && <span className="conversation-active-indicator" />}

                      <div className="conversation-info">
                        {isEditing ? (
                          <input
                            ref={editInputRef}
                            type="text"
                            className="conversation-rename-input"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onBlur={() => handleSaveRename(session.id)}
                            onKeyDown={(e) => handleKeyDownRename(e, session.id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <span
                            className="conversation-title"
                            onDoubleClick={(e) => handleStartRename(session, e)}
                            title={session.title}
                          >
                            {session.title || 'New conversation'}
                          </span>
                        )}

                        <div className="conversation-meta">
                          {session.modelName && (
                            <span className="conversation-model-tag">
                              {session.modelName.split(' ')[0] || session.modelName}
                            </span>
                          )}
                          <span className="conversation-date">
                            {new Date(session.updatedAt || session.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Item Actions */}
                      <div className="conversation-actions">
                        <button
                          type="button"
                          className="conversation-action-btn"
                          onClick={(e) => handleStartRename(session, e)}
                          title="Rename title"
                        >
                          <EditIcon size={12} />
                        </button>
                        <button
                          type="button"
                          className="conversation-action-btn delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteSession(session.id);
                          }}
                          title="Delete conversation"
                        >
                          <TrashIcon size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Sidebar Footer */}
      <div className="sidebar-footer-row">
        <button
          type="button"
          className="sidebar-footer-btn"
          onClick={onOpenShortcuts}
          title="Keyboard shortcuts"
        >
          <KeyboardIcon size={13} />
          <span>Shortcuts</span>
          <kbd className="sidebar-kbd-pill">?</kbd>
        </button>

        {sessions.length > 0 && (
          <button
            type="button"
            className="sidebar-clear-all-btn"
            onClick={() => {
              if (window.confirm('Delete all conversation history? This cannot be undone.')) {
                onClearAllSessions();
              }
            }}
            title="Clear all saved history"
          >
            Clear all
          </button>
        )}
      </div>
    </aside>
  );
};
