import React, { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon, CheckIcon, BoltIcon, SearchIcon } from './Icons';

const getSpeedPercent = (speedStr) => {
  if (!speedStr) return 50;
  const num = parseInt(speedStr.replace(/[^0-9]/g, ''), 10);
  if (isNaN(num)) return 50;
  return Math.min(100, Math.max(10, Math.round((num / 1000) * 100)));
};

export const ModelSelector = ({ activeModel, models, onSelectModel, isOpenExternal, onToggleExternal }) => {
  const [isOpenInternal, setIsOpenInternal] = useState(false);
  const isControlled = typeof isOpenExternal === 'boolean';
  const isOpen = isControlled ? isOpenExternal : isOpenInternal;
  const setIsOpen = (val) => {
    if (isControlled && onToggleExternal) {
      onToggleExternal(val);
    } else {
      setIsOpenInternal(val);
    }
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Filter models based on search query
  const filteredModels = models.filter((m) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      m.name.toLowerCase().includes(q) ||
      m.provider.toLowerCase().includes(q) ||
      (m.description && m.description.toLowerCase().includes(q))
    );
  });

  // Group models by provider
  const providers = Array.from(new Set(filteredModels.map((m) => m.provider)));

  // Outside click listener
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  // Focus search input on open
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setHighlightedIndex(0);
      setTimeout(() => {
        if (searchInputRef.current) searchInputRef.current.focus();
      }, 50);
    }
  }, [isOpen]);

  // Handle keyboard navigation inside the popover
  const handleKeyDown = (e) => {
    if (!isOpen) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % Math.max(1, filteredModels.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev - 1 + filteredModels.length) % Math.max(1, filteredModels.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredModels[highlightedIndex]) {
        onSelectModel(filteredModels[highlightedIndex].id);
        setIsOpen(false);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  return (
    <div className="model-dropdown-container" ref={dropdownRef} onKeyDown={handleKeyDown}>
      <button
        type="button"
        className={`model-trigger-button ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        title="Select Model (⌘M)"
      >
        <div className="model-trigger-left">
          <span className="model-trigger-icon-wrap">
            <BoltIcon size={13} color="#f97316" />
          </span>
          <span className="model-trigger-name">{activeModel?.name}</span>
          <span className="model-trigger-speed">
            <span className="pulse-dot" />
            {activeModel?.speed}
          </span>
        </div>
        <div className="model-trigger-right">
          <kbd className="model-hotkey-badge">⌘M</kbd>
          <ChevronDownIcon
            size={13}
            className={`dropdown-chevron ${isOpen ? 'rotate' : ''}`}
          />
        </div>
      </button>

      {isOpen && (
        <div className="model-menu-popover" role="listbox">
          {/* Header with Search */}
          <div className="model-search-row">
            <SearchIcon size={14} color="var(--text-muted)" />
            <input
              ref={searchInputRef}
              type="text"
              className="model-search-input"
              placeholder="Search model or provider..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setHighlightedIndex(0);
              }}
            />
            {searchQuery && (
              <button
                type="button"
                className="model-search-clear"
                onClick={() => setSearchQuery('')}
              >
                ✕
              </button>
            )}
          </div>

          <div className="model-menu-items-scroll">
            {filteredModels.length === 0 ? (
              <div className="model-empty-state">No models matching &ldquo;{searchQuery}&rdquo;</div>
            ) : (
              providers.map((provider) => {
                const providerModels = filteredModels.filter((m) => m.provider === provider);
                return (
                  <div key={provider} className="model-provider-group">
                    <div className="model-provider-label">{provider}</div>
                    {providerModels.map((m) => {
                      const overallIndex = filteredModels.findIndex((item) => item.id === m.id);
                      const isSelected = m.id === activeModel?.id;
                      const isHighlighted = overallIndex === highlightedIndex;

                      return (
                        <button
                          key={m.id}
                          type="button"
                          className={`model-menu-item ${isSelected ? 'selected' : ''} ${isHighlighted ? 'highlighted' : ''}`}
                          onClick={() => {
                            onSelectModel(m.id);
                            setIsOpen(false);
                          }}
                          onMouseEnter={() => setHighlightedIndex(overallIndex)}
                          role="option"
                          aria-selected={isSelected}
                        >
                          <div className="item-main-row">
                            <div className="item-title-group">
                              <span className="item-title">{m.name}</span>
                              <span className="item-tag-id">{m.id.split('/')[1] || m.id}</span>
                            </div>
                            <div className="item-badge-group">
                              <div className="item-speed-cluster">
                                <div
                                  className="speed-gauge-track"
                                  title={`${m.speed} throughput`}
                                >
                                  <div
                                    className="speed-gauge-fill"
                                    style={{ width: `${getSpeedPercent(m.speed)}%` }}
                                  />
                                </div>
                                <span className="item-speed-tag">{m.speed}</span>
                              </div>
                              {isSelected && <CheckIcon size={14} color="#10b981" />}
                            </div>
                          </div>
                          <p className="item-description">{m.description}</p>
                        </button>
                      );
                    })}
                  </div>
                );
              })
            )}
          </div>

          <div className="model-menu-footer">
            <span><kbd>↑</kbd><kbd>↓</kbd> Navigate</span>
            <span><kbd>↵</kbd> Select</span>
            <span><kbd>esc</kbd> Dismiss</span>
          </div>
        </div>
      )}
    </div>
  );
};
