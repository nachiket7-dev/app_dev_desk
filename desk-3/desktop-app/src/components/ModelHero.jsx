import React from 'react';
import { BoltIcon } from './Icons';

const SUGGESTED_PROMPTS = [
  {
    title: 'Explain Architecture',
    prompt: 'How does Groq LPU achieve deterministic execution and bypass traditional GPU memory bottlenecks?'
  },
  {
    title: 'Code Optimization',
    prompt: 'Write a high-performance LRU cache implementation in TypeScript with O(1) get and put operations.'
  },
  {
    title: 'System Design',
    prompt: 'Design an event-driven architecture for real-time collaborative document editing with conflict resolution.'
  },
  {
    title: 'Algorithmic Reasoning',
    prompt: 'Compare the memory footprint and cache locality of columnar vs row-oriented storage engines.'
  }
];

export const ModelHero = ({ activeModel, onSelectPrompt }) => {
  return (
    <div className="hero-section">
      <div className="hero-intro">
        <div className="hero-icon-container">
          <BoltIcon size={24} color="#f97316" />
        </div>
        <h1 className="hero-title">How can I help you today?</h1>
        <p className="hero-subtitle">
          Inference running on <strong>{activeModel?.name}</strong> at <strong>{activeModel?.speed}</strong>.
          Switch models anytime from the header dropdown.
        </p>
      </div>

      <div className="hero-cards-grid">
        {SUGGESTED_PROMPTS.map((item, idx) => (
          <button
            key={idx}
            type="button"
            className="suggestion-card"
            onClick={() => onSelectPrompt(item.prompt)}
          >
            <span className="suggestion-title">{item.title}</span>
            <p className="suggestion-prompt">{item.prompt}</p>
          </button>
        ))}
      </div>
    </div>
  );
};
