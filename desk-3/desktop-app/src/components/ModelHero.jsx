import React from 'react';
import { BoltIcon, ArrowRightIcon, CpuIcon, LayersIcon } from './Icons';

const SUGGESTED_PROMPTS = [
  {
    category: 'Architecture',
    title: 'LPU Hardware Internals',
    prompt: 'How does Groq LPU achieve deterministic execution and bypass traditional GPU memory bandwidth bottlenecks?'
  },
  {
    category: 'Algorithms',
    title: 'High-Speed LRU Cache',
    prompt: 'Write a high-performance LRU cache implementation in TypeScript with O(1) get and put operations and clean types.'
  },
  {
    category: 'System Design',
    title: 'Collaborative Real-Time Sync',
    prompt: 'Design an event-driven architecture for real-time collaborative document editing with conflict resolution (OT/CRDT).'
  },
  {
    category: 'Performance',
    title: 'Memory Footprint Analysis',
    prompt: 'Compare the memory layout, cache locality, and SIMD vectorization potential of columnar vs row-oriented storage engines.'
  }
];

export const ModelHero = ({ activeModel, onSelectPrompt }) => {
  const handleCardMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
    e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
  };

  return (
    <div className="hero-section">
      <div className="hero-intro">
        {/* Animated Concentric Hardware Emblem */}
        <div className="hero-emblem-wrapper">
          <div className="hero-emblem-ring ring-3" />
          <div className="hero-emblem-ring ring-2" />
          <div className="hero-emblem-outer">
            <div className="hero-emblem-inner">
              <BoltIcon size={26} color="#f97316" />
            </div>
          </div>
        </div>

        <div className="hero-hardware-pill">
          <span className="pulse-dot" />
          <span>Groq LPU Acceleration Active</span>
          <span className="pill-sep">·</span>
          <span className="pill-speed">{activeModel?.speed || '1,000 T/s'}</span>
        </div>

        <h1 className="hero-title">What would you like to build?</h1>
        <p className="hero-subtitle">
          Supercharged with <strong>{activeModel?.name}</strong> by {activeModel?.provider}.
          Instant tokens, deep analytical thinking, and zero wait time.
        </p>

        {/* Model Spec Bar */}
        <div className="hero-spec-bar">
          <div className="spec-item">
            <CpuIcon size={13} color="var(--text-muted)" />
            <span>Model: <strong>{activeModel?.name}</strong></span>
          </div>
          <div className="spec-sep" />
          <div className="spec-item">
            <LayersIcon size={13} color="var(--text-muted)" />
            <span>Context: <strong>{activeModel?.contextWindow || '131k tokens'}</strong></span>
          </div>
          <div className="spec-sep" />
          <div className="spec-item">
            <BoltIcon size={13} color="#10b981" />
            <span>Throughput: <strong>{activeModel?.speed}</strong></span>
          </div>
        </div>
      </div>

      {/* Suggested Prompt Cards with Spotlight tracking */}
      <div className="hero-cards-grid">
        {SUGGESTED_PROMPTS.map((item, idx) => (
          <button
            key={idx}
            type="button"
            className="suggestion-card spotlight-card"
            onClick={() => onSelectPrompt(item.prompt)}
            onMouseMove={handleCardMouseMove}
          >
            <div className="suggestion-card-top">
              <span className="suggestion-category-tag">{item.category}</span>
              <span className="suggestion-arrow">
                <ArrowRightIcon size={13} />
              </span>
            </div>
            <h3 className="suggestion-title">{item.title}</h3>
            <p className="suggestion-prompt">{item.prompt}</p>
          </button>
        ))}
      </div>
    </div>
  );
};
