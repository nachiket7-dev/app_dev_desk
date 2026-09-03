import React, { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon, CheckIcon, BoltIcon } from './Icons';

export const ModelSelector = ({ activeModel, models, onSelectModel }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  return (
    <div className="model-dropdown-container" ref={dropdownRef}>
      <button
        type="button"
        className={`model-trigger-button ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="model-trigger-left">
          <BoltIcon size={14} color="#f97316" />
          <span className="model-trigger-name">{activeModel?.name}</span>
          <span className="model-trigger-speed">{activeModel?.speed}</span>
        </div>
        <ChevronDownIcon
          size={14}
          className={`dropdown-chevron ${isOpen ? 'rotate' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="model-menu-popover" role="listbox">
          <div className="model-menu-header">
            <span>Select LLM</span>
            <span className="model-menu-count">{models.length} models</span>
          </div>

          <div className="model-menu-items">
            {models.map((m) => {
              const isSelected = m.id === activeModel?.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  className={`model-menu-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => {
                    onSelectModel(m.id);
                    setIsOpen(false);
                  }}
                  role="option"
                  aria-selected={isSelected}
                >
                  <div className="item-main-row">
                    <div className="item-title-group">
                      <span className="item-title">{m.name}</span>
                      <span className="item-provider-tag">{m.provider}</span>
                    </div>
                    <div className="item-badge-group">
                      <span className="item-speed-tag">{m.speed}</span>
                      {isSelected && <CheckIcon size={14} color="#10b981" />}
                    </div>
                  </div>
                  <p className="item-description">{m.description}</p>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
