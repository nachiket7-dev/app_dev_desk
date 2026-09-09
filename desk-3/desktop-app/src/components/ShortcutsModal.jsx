import React, { useEffect } from 'react';
import { XIcon, KeyboardIcon } from './Icons';

export const ShortcutsModal = ({ isOpen, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const modKey = isMac ? '⌘' : 'Ctrl';

  const SHORTCUTS = [
    { keys: [`${modKey}`, 'N'], description: 'Start a new conversation' },
    { keys: [`${modKey}`, 'B'], description: 'Toggle conversation sidebar' },
    { keys: [`${modKey}`, 'M'], description: 'Open model picker' },
    { keys: [`${modKey}`, 'K'], description: 'Focus chat input' },
    { keys: ['Enter'], description: 'Send message' },
    { keys: ['Shift', 'Enter'], description: 'Insert new line' },
    { keys: ['Esc'], description: 'Dismiss modal / Stop streaming' },
    { keys: ['?'], description: 'Open this shortcuts cheatsheet' }
  ];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="shortcuts-modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="shortcuts-modal-header">
          <div className="shortcuts-header-title">
            <KeyboardIcon size={16} color="#f97316" />
            <span>Keyboard Shortcuts</span>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            title="Close (Esc)"
          >
            <XIcon size={16} />
          </button>
        </div>

        <div className="shortcuts-list">
          {SHORTCUTS.map((item, idx) => (
            <div key={idx} className="shortcut-row">
              <span className="shortcut-desc">{item.description}</span>
              <div className="shortcut-keys-combo">
                {item.keys.map((k, kIdx) => (
                  <kbd key={kIdx} className="shortcut-key-pill">
                    {k}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="shortcuts-modal-footer">
          <span>Press <kbd>Esc</kbd> anytime to dismiss</span>
        </div>
      </div>
    </div>
  );
};
