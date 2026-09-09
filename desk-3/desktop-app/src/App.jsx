import React, { useState, useEffect, useRef } from 'react';
import { GROQ_MODELS, DEFAULT_MODEL_ID } from './data/models';
import {
  getStoredSessions,
  setStoredSessions,
  getStoredActiveSessionId,
  setStoredActiveSessionId,
  getStoredActiveModelId,
  setStoredActiveModelId,
  streamChatCompletion
} from './services/groq';
import { Sidebar } from './components/Sidebar';
import { ChatHeader } from './components/ChatHeader';
import { ChatMessage } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';
import { ModelHero } from './components/ModelHero';
import { ShortcutsModal } from './components/ShortcutsModal';
import './App.css';

export default function App() {
  // Chat History & Sessions
  const [sessions, setSessions] = useState(getStoredSessions());
  const [activeSessionId, setActiveSessionId] = useState(getStoredActiveSessionId());

  // Sidebar Collapse State
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('groq_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('groq_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  // Modals & Popovers
  const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  // Models State (Strictly Curated 5 Models)
  const [models] = useState(GROQ_MODELS);
  const [activeModelId, setActiveModelId] = useState(() => {
    const saved = getStoredActiveModelId(DEFAULT_MODEL_ID);
    return GROQ_MODELS.some((m) => m.id === saved) ? saved : DEFAULT_MODEL_ID;
  });

  // Active Chat State
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);

  // Refs
  const abortControllerRef = useRef(null);
  const chatViewportRef = useRef(null);
  const rafIdRef = useRef(null);
  const targetContentRef = useRef('');
  const renderedContentRef = useRef('');
  const streamDoneRef = useRef(false);

  const activeModel = models.find((m) => m.id === activeModelId) || models[0];
  const activeSession = sessions.find((s) => s.id === activeSessionId);

  // Load session messages on session change
  useEffect(() => {
    if (activeSessionId) {
      const sess = sessions.find((s) => s.id === activeSessionId);
      if (sess) {
        setMessages(sess.messages || []);
        if (sess.modelId && GROQ_MODELS.some((m) => m.id === sess.modelId)) {
          setActiveModelId(sess.modelId);
          setStoredActiveModelId(sess.modelId);
        } else {
          setActiveModelId(DEFAULT_MODEL_ID);
          setStoredActiveModelId(DEFAULT_MODEL_ID);
        }
        return;
      }
    }
    setMessages([]);
  }, [activeSessionId]);

  // Clean up RAF on unmount
  useEffect(() => {
    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, []);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isInputFocused = ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName);

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleSidebar();
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        handleNewChat();
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        setIsModelSelectorOpen((prev) => !prev);
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const textarea = document.querySelector('.chat-textarea');
        if (textarea) textarea.focus();
      } else if (e.key === '?' && !isInputFocused) {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        if (isStreaming) handleStopStreaming();
        setIsModelSelectorOpen(false);
        setIsShortcutsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isStreaming]);

  // Save session helper
  const updateCurrentSession = (updatedMessages, modelId = activeModelId) => {
    let currentId = activeSessionId;
    let newSessions = [...sessions];
    const currentModel = models.find((m) => m.id === modelId) || activeModel;

    if (!currentId) {
      currentId = `session-${Date.now()}`;
      setActiveSessionId(currentId);
      setStoredActiveSessionId(currentId);

      const firstUserMsg = updatedMessages.find((m) => m.role === 'user');
      const title = firstUserMsg
        ? firstUserMsg.content.slice(0, 40) + (firstUserMsg.content.length > 40 ? '...' : '')
        : 'New conversation';

      const newSession = {
        id: currentId,
        title,
        modelId,
        modelName: currentModel.name,
        messages: updatedMessages,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      newSessions = [newSession, ...newSessions];
    } else {
      newSessions = newSessions.map((s) => {
        if (s.id === currentId) {
          return {
            ...s,
            modelId,
            modelName: currentModel.name,
            messages: updatedMessages,
            updatedAt: new Date().toISOString()
          };
        }
        return s;
      });
    }

    setSessions(newSessions);
    setStoredSessions(newSessions);
  };

  // Switch Model
  const handleSelectModel = (modelId) => {
    setActiveModelId(modelId);
    setStoredActiveModelId(modelId);
    if (activeSessionId) {
      updateCurrentSession(messages, modelId);
    }
  };

  // Start New Chat
  const handleNewChat = () => {
    if (isStreaming) handleStopStreaming();
    setActiveSessionId(null);
    setStoredActiveSessionId(null);
    setMessages([]);
    setInput('');
  };

  // Select Session
  const handleSelectSession = (sessionId) => {
    if (isStreaming) handleStopStreaming();
    setActiveSessionId(sessionId);
    setStoredActiveSessionId(sessionId);
  };

  // Delete Session
  const handleDeleteSession = (sessionId) => {
    const updated = sessions.filter((s) => s.id !== sessionId);
    setSessions(updated);
    setStoredSessions(updated);
    if (activeSessionId === sessionId) {
      handleNewChat();
    }
  };

  // Rename Session
  const handleRenameSession = (sessionId, newTitle) => {
    const updated = sessions.map((s) =>
      s.id === sessionId ? { ...s, title: newTitle, updatedAt: new Date().toISOString() } : s
    );
    setSessions(updated);
    setStoredSessions(updated);
  };

  // Clear All Sessions
  const handleClearAllSessions = () => {
    if (isStreaming) handleStopStreaming();
    setSessions([]);
    setStoredSessions([]);
    setActiveSessionId(null);
    setStoredActiveSessionId(null);
    setMessages([]);
  };

  // Clear Current Chat
  const handleClearChat = () => {
    if (isStreaming) handleStopStreaming();
    setMessages([]);
    if (activeSessionId) {
      updateCurrentSession([]);
    }
  };

  // Smooth Typewriter Animation Loop
  const startSmoothStreaming = (assistantMsgId) => {
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
    }

    const smoothStep = () => {
      const target = targetContentRef.current;
      const current = renderedContentRef.current;

      if (current.length < target.length) {
        const diff = target.length - current.length;

        // Adaptive smoothing: type naturally at reading speed, accelerate gracefully when buffer builds
        let step = 1;
        if (diff > 250) step = Math.ceil(diff / 3);
        else if (diff > 90) step = Math.ceil(diff / 5);
        else if (diff > 25) step = Math.ceil(diff / 7);
        else step = Math.min(diff, Math.max(1, Math.ceil(diff / 3)));

        const nextLen = Math.min(target.length, current.length + step);
        const nextText = target.slice(0, nextLen);
        renderedContentRef.current = nextText;

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId ? { ...msg, content: nextText } : msg
          )
        );

        if (chatViewportRef.current) {
          chatViewportRef.current.scrollTop = chatViewportRef.current.scrollHeight;
        }

        rafIdRef.current = requestAnimationFrame(smoothStep);
      } else if (streamDoneRef.current) {
        // Buffer is fully drained and network transmission completed
        setIsStreaming(false);
        abortControllerRef.current = null;
        rafIdRef.current = null;

        setMessages((prevFinal) => {
          updateCurrentSession(prevFinal);
          return prevFinal;
        });
      } else {
        // Waiting for more SSE tokens to arrive
        rafIdRef.current = requestAnimationFrame(smoothStep);
      }
    };

    rafIdRef.current = requestAnimationFrame(smoothStep);
  };

  // Send Message
  const handleSendMessage = (overrideText, customBaseMessages) => {
    const text = (overrideText || input).trim();
    if (!text || isStreaming) return;

    const baseMessages = customBaseMessages || messages;

    const userMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString()
    };

    const newMessages = [...baseMessages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsStreaming(true);

    const assistantMessageId = `msg-${Date.now() + 1}`;
    const initialAssistantMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      modelName: activeModel.name,
      timestamp: new Date().toISOString()
    };

    const withAssistant = [...newMessages, initialAssistantMessage];
    setMessages(withAssistant);

    // Reset smooth stream buffers
    targetContentRef.current = '';
    renderedContentRef.current = '';
    streamDoneRef.current = false;

    // Start 60fps smooth typewriter ticker
    startSmoothStreaming(assistantMessageId);

    // Sanitize conversation history for API:
    // 1. Strip <think>...</think> from previous assistant messages so models don't rehash thoughts
    // 2. Filter out error messages and blank messages
    // 3. Keep the most recent 10 messages (5 turns) to prevent context dilution and repetition loops
    const cleanedHistory = newMessages
      .filter((m) => m && m.content && !m.content.startsWith('⚠️'))
      .map((m) => {
        let cleanContent = m.content;
        if (m.role === 'assistant') {
          cleanContent = cleanContent.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
        }
        return {
          role: m.role,
          content: cleanContent
        };
      })
      .filter((m) => m.content.length > 0)
      .slice(-10);

    const apiMessages = [
      {
        role: 'system',
        content:
          'You are an intelligent, articulate AI assistant powered by Groq high-speed LPU inference.\n\n' +
          'CRITICAL CONVERSATIONAL RULES:\n' +
          '1. Always respond directly, specifically, and immediately to the user\'s latest prompt.\n' +
          '2. NEVER recap, summarize, repeat, or list previous queries or answers from earlier in this conversation unless the user explicitly asks for a summary or recap.\n' +
          '3. Do NOT begin responses with conversational preambles like "In our previous turn", "Earlier you asked", "To recap our discussion", or "As discussed".\n' +
          '4. Treat prior conversation history strictly as passive background context for understanding pronouns and context—never restate previous turns.\n' +
          '5. Provide direct, clean markdown formatting without unnecessary filler.'
      },
      ...cleanedHistory
    ];

    abortControllerRef.current = new AbortController();

    streamChatCompletion({
      model: activeModel.id,
      messages: apiMessages,
      signal: abortControllerRef.current.signal,
      onToken: (accumulated) => {
        targetContentRef.current = accumulated;
      },
      onDone: (finalText) => {
        targetContentRef.current = finalText || targetContentRef.current;
        streamDoneRef.current = true;
      },
      onError: (err) => {
        if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
        setIsStreaming(false);
        abortControllerRef.current = null;
        const errorMsg = {
          id: assistantMessageId,
          role: 'assistant',
          content: `⚠️ **Groq Error**: ${err.message || 'Connection failed.'}`,
          modelName: activeModel.name,
          timestamp: new Date().toISOString()
        };
        const withError = withAssistant.map((msg) =>
          msg.id === assistantMessageId ? errorMsg : msg
        );
        setMessages(withError);
        updateCurrentSession(withError);
      }
    });
  };

  // Retry / Regenerate last response
  const handleRetryPrompt = (assistantMsg) => {
    if (isStreaming) return;
    const assistantIdx = messages.findIndex((m) => m.id === assistantMsg.id);
    if (assistantIdx <= 0) return;

    const userMsg = messages[assistantIdx - 1];
    if (!userMsg || userMsg.role !== 'user') return;

    const truncated = messages.slice(0, assistantIdx - 1);
    setMessages(truncated);
    handleSendMessage(userMsg.content, truncated);
  };

  // Stop Streaming
  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    if (targetContentRef.current) {
      renderedContentRef.current = targetContentRef.current;
    }
    setIsStreaming(false);
  };

  return (
    <div className="app-layout">
      {/* Ambient Atmospheric Nebula — 4 Drifting Orbs */}
      <div className="ambient-glow-mesh" aria-hidden="true">
        <div className="ambient-glow-top" />
        <div className="ambient-glow-bottom" />
        <div className="ambient-glow-left" />
        <div className="ambient-glow-accent" />
      </div>

      {/* Sidebar */}
      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
        onRenameSession={handleRenameSession}
        onClearAllSessions={handleClearAllSessions}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={toggleSidebar}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
      />

      {/* Main Workspace */}
      <main className="main-content">
        <ChatHeader
          activeModel={activeModel}
          models={models}
          onSelectModel={handleSelectModel}
          onClearChat={handleClearChat}
          messageCount={messages.length}
          sessionTitle={activeSession?.title}
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebar={toggleSidebar}
          isModelSelectorOpen={isModelSelectorOpen}
          onToggleModelSelector={setIsModelSelectorOpen}
        />

        {/* Scrollable Chat Area */}
        <div className="chat-viewport" ref={chatViewportRef}>
          {messages.length === 0 ? (
            <ModelHero
              activeModel={activeModel}
              onSelectPrompt={(promptText) => handleSendMessage(promptText)}
            />
          ) : (
            <div className="chat-messages-container">
              {messages.map((msg, idx) => (
                <ChatMessage
                  key={msg.id || idx}
                  message={msg}
                  activeModel={activeModel}
                  isStreaming={
                    isStreaming && idx === messages.length - 1 && msg.role === 'assistant'
                  }
                  onRetryPrompt={handleRetryPrompt}
                />
              ))}
            </div>
          )}
        </div>

        {/* Bottom Floating Glass Input */}
        <ChatInput
          input={input}
          setInput={setInput}
          onSendMessage={() => handleSendMessage()}
          onStopStreaming={handleStopStreaming}
          isStreaming={isStreaming}
          activeModel={activeModel}
          onOpenModelSelector={() => setIsModelSelectorOpen(true)}
        />
      </main>

      {/* Global Keyboard Shortcuts Modal */}
      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
    </div>
  );
}
