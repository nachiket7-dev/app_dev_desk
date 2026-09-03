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
import './App.css';

export default function App() {
  // Chat History & Sessions
  const [sessions, setSessions] = useState(getStoredSessions());
  const [activeSessionId, setActiveSessionId] = useState(getStoredActiveSessionId());

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
  const handleSendMessage = (overrideText) => {
    const text = (overrideText || input).trim();
    if (!text || isStreaming) return;

    const userMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString()
    };

    const newMessages = [...messages, userMessage];
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

    const apiMessages = [
      {
        role: 'system',
        content:
          'You are an intelligent, articulate AI assistant powered by Groq high-speed LPU inference. Provide direct, helpful, and concise answers using clean markdown formatting.'
      },
      ...newMessages.map((m) => ({
        role: m.role,
        content: m.content
      }))
    ];

    abortControllerRef.current = new AbortController();

    streamChatCompletion({
      model: activeModel.id,
      messages: apiMessages,
      signal: abortControllerRef.current.signal,
      onToken: (accumulated) => {
        // Update target buffer without triggering synchronous state churn
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
    // Flush current buffer immediately
    if (targetContentRef.current) {
      renderedContentRef.current = targetContentRef.current;
    }
    setIsStreaming(false);
  };

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
        onClearAllSessions={handleClearAllSessions}
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
                />
              ))}
            </div>
          )}
        </div>

        {/* Bottom Input */}
        <ChatInput
          input={input}
          setInput={setInput}
          onSendMessage={() => handleSendMessage()}
          onStopStreaming={handleStopStreaming}
          isStreaming={isStreaming}
          activeModel={activeModel}
        />
      </main>
    </div>
  );
}
