import React, { useState, useEffect, useRef, useCallback } from 'react';
import chatService from '../../services/chat.service.js';
import Loading from '../../components/common/Loading.jsx';
import ErrorMessage from '../../components/common/ErrorMessage.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import AppLayout from '../../layouts/AppLayout.jsx';
import './Chat.css';

/* ─────────────────────────────────────────────────────────────────
   ARCHITECTURE NOTE
   The frontend does NOT orchestrate the AI pipeline.
   Sending a message calls POST /chat/:id/send — the backend handles:
     1. Safety check (Module 8) — FIRST gate
        → HIGH RISK: returns crisis response + resources (skips AI)
        → SAFE: continues
     2. Detect emotion (Module 3)
     3. Retrieve context (Module 4)
     4. Generate AI response (Module 5)
     5. Save messages
     6. Return { userMessage, aiMessage, emotion, isCrisis, resources }
   The frontend detects isCrisis and renders a dedicated safety UI.
───────────────────────────────────────────────────────────────── */

// Runtime data — color values keyed by emotion label, cannot be static CSS
const EMOTION_COLORS = {
  happy: '#22c55e', sad: '#60a5fa', angry: '#ef4444',
  fear: '#a855f7', anxiety: '#f59e0b', neutral: '#94a3b8', surprise: '#ec4899',
};
const EMOTION_EMOJI = {
  happy: '😊', sad: '😢', angry: '😠', fear: '😨', anxiety: '😰', neutral: '😐', surprise: '😲',
};

// ── Emotion badge ──────────────────────────────────────────────────
function EmotionBadge({ emotion }) {
  if (!emotion) return null;
  const color = EMOTION_COLORS[emotion] || '#94a3b8';
  // background, color, border depend on runtime emotion — kept inline
  return (
    <span
      className="emotion-badge"
      style={{
        background: color + '22',
        color,
        border: `1px solid ${color}44`,
      }}
    >
      {EMOTION_EMOJI[emotion] || ''} {emotion}
    </span>
  );
}

// ── Crisis resources card ──────────────────────────────────────────
// Calm, supportive layout. No alarming animations or red flashing.
function CrisisResources({ resources }) {
  if (!resources) return null;

  return (
    <div className="crisis-resources">
      <p className="crisis-resources-heading">📋 Support Resources</p>

      {resources.immediate?.length > 0 && (
        <div className="crisis-resources-section">
          <p className="crisis-resources-section-title">Immediate support</p>
          {resources.immediate.map((item, i) => (
            <div key={i} className="crisis-resource-item">
              <strong>{item.name}</strong>
              {item.number      && <span className="crisis-resource-number"> — {item.number}</span>}
              {item.description && <span className="crisis-resource-desc"> · {item.description}</span>}
            </div>
          ))}
        </div>
      )}

      {resources.professional?.length > 0 && (
        <div className="crisis-resources-section">
          <p className="crisis-resources-section-title">Professional support</p>
          {resources.professional.map((item, i) => (
            <div key={i} className="crisis-resource-item">
              <strong>{item.name}</strong>
              {item.number      && <span className="crisis-resource-number"> — {item.number}</span>}
              {item.description && <span className="crisis-resource-desc"> · {item.description}</span>}
            </div>
          ))}
        </div>
      )}

      {resources.international?.length > 0 && (
        <div className="crisis-resources-section">
          {resources.international.map((item, i) => (
            <div key={i} className="crisis-resource-item">
              {item.url
                ? <>
                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="crisis-resource-link">{item.name}</a>
                    <span className="crisis-resource-desc"> — {item.description}</span>
                  </>
                : <>
                    <strong>{item.name}</strong>
                    <span className="crisis-resource-desc"> — {item.description}</span>
                  </>
              }
            </div>
          ))}
        </div>
      )}

      {resources.trusted_person && (
        <p className="crisis-resources-trusted">💙 {resources.trusted_person}</p>
      )}
    </div>
  );
}

// ── Crisis message bubble ──────────────────────────────────────────
function CrisisMessageBubble({ msg }) {
  const resources = msg.metadata?.resources || null;

  return (
    <div className="msg-row msg-row--crisis">
      <div className="msg-content msg-content--crisis">
        <div className="msg-sender-label">
          <span className="msg-sender-icon">💙</span>
          <span className="msg-sender-name msg-sender-name--crisis">MindCare — Safety Notice</span>
        </div>
        <div className="msg-bubble msg-bubble--crisis">
          {msg.content}
        </div>
        <CrisisResources resources={resources} />
        <div className="msg-time msg-time--ai">
          {msg.createdAt
            ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : ''}
        </div>
      </div>
    </div>
  );
}

// ── Standard message bubble ────────────────────────────────────────
function MessageBubble({ msg }) {
  const isUser   = msg.sender === 'user';
  const isCrisis = !isUser && !!msg.metadata?.isCrisis;

  if (isCrisis) return <CrisisMessageBubble msg={msg} />;

  const emotionLabel = msg.metadata?.emotion?.emotion || null;

  return (
    <div className={`msg-row ${isUser ? 'msg-row--user' : 'msg-row--ai'}`}>
      <div className="msg-content">
        {!isUser && (
          <div className="msg-sender-label">
            <span className="msg-sender-icon">🧠</span>
            <span className="msg-sender-name">MindCare AI</span>
          </div>
        )}
        <div className={`msg-bubble ${isUser ? 'msg-bubble--user' : 'msg-bubble--ai'}`}>
          {msg.content}
        </div>
        {!isUser && emotionLabel && (
          <div className="msg-emotion">
            <EmotionBadge emotion={emotionLabel} />
          </div>
        )}
        <div className={`msg-time ${isUser ? 'msg-time--user' : 'msg-time--ai'}`}>
          {msg.createdAt
            ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : ''}
        </div>
      </div>
    </div>
  );
}

// ── Conversation sidebar item ──────────────────────────────────────
function ConversationItem({ conv, active, onClick }) {
  return (
    <button
      onClick={() => onClick(conv._id)}
      className={`conv-item${active ? ' conv-item--active' : ''}`}
    >
      <span className="conv-item-icon">💬</span>
      <span className="conv-item-label">{conv.title || 'New conversation'}</span>
    </button>
  );
}

// ── Main Chat component ────────────────────────────────────────────
export default function Chat() {
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId]           = useState(null);
  const [messages, setMessages]           = useState([]);
  const [input, setInput]                 = useState('');
  const [sending, setSending]             = useState(false);
  const [convLoading, setConvLoading]     = useState(true);
  const [msgLoading, setMsgLoading]       = useState(false);
  const [convError, setConvError]         = useState('');
  const [msgError, setMsgError]           = useState('');
  const [sidebarOpen, setSidebarOpen]     = useState(false);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  // ── Load conversation list ──────────────────────────────────────
  const loadConversations = useCallback(async () => {
    setConvLoading(true);
    setConvError('');
    try {
      const { data } = await chatService.listConversations({ limit: 50, sort: 'newest' });
      setConversations(Array.isArray(data.data) ? data.data : []);
    } catch {
      setConvError('Could not load conversations.');
    } finally {
      setConvLoading(false);
    }
  }, []);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  // ── Load messages ───────────────────────────────────────────────
  const loadMessages = useCallback(async (convId) => {
    setMsgLoading(true);
    setMsgError('');
    try {
      const { data } = await chatService.getMessages(convId, { limit: 100, sort: 'oldest' });
      setMessages(Array.isArray(data.data) ? data.data : []);
    } catch {
      setMsgError('Could not load messages.');
    } finally {
      setMsgLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeId) loadMessages(activeId);
    else setMessages([]);
  }, [activeId, loadMessages]);

  // ── Auto scroll ─────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Create conversation ─────────────────────────────────────────
  const createConversation = async (titleHint = '') => {
    try {
      const { data } = await chatService.createConversation(titleHint || 'New chat');
      const newConv  = data.data.conversation;
      setConversations((prev) => [newConv, ...prev]);
      setActiveId(newConv._id);
      setSidebarOpen(false);
      setTimeout(() => inputRef.current?.focus(), 100);
      return newConv._id;
    } catch {
      setConvError('Could not create conversation.');
      return null;
    }
  };

  // ── Send message via unified backend pipeline ───────────────────
  // Backend: POST /chat/:id/send → { data: { userMessage, aiMessage, emotion, isCrisis, resources } }
  // Safety runs FIRST on the backend; if isCrisis is true, aiMessage.metadata.isCrisis is set
  // and the CrisisMessageBubble component renders the dedicated safety UI.
  const sendMessage = async () => {
    const text = input.trim();
    if (!text || sending) return;

    let convId = activeId;
    if (!convId) {
      convId = await createConversation(text.slice(0, 60));
      if (!convId) return;
    }

    setSending(true);
    setMsgError('');
    setInput('');

    // Optimistic user message display
    const tempId = 'temp-' + Date.now();
    const optimisticMsg = {
      _id: tempId, sender: 'user', content: text,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      const { data } = await chatService.sendAndProcess(convId, text);
      const { userMessage, aiMessage, isCrisis, resources } = data.data;

      // If this was a crisis response, attach resources to aiMessage.metadata
      // so CrisisMessageBubble can render them without a separate API call.
      const enrichedAiMessage = isCrisis
        ? { ...aiMessage, metadata: { ...aiMessage.metadata, isCrisis: true, resources } }
        : aiMessage;

      setMessages((prev) => [
        ...prev.filter((m) => m._id !== tempId),
        userMessage,
        enrichedAiMessage,
      ]);

      loadConversations();
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m._id !== tempId));
      const status = err.response?.status;
      if (status === 503) {
        setMsgError("⚠️ If you're in crisis, please reach out to a trusted person or helpline. Your wellbeing matters.");
      } else {
        setMsgError('Something went wrong sending your message. Please try again.');
      }
    } finally {
      setSending(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const selectConversation = (id) => {
    setActiveId(id);
    setSidebarOpen(false);
  };

  // canSend drives the CSS modifier class — no inline style needed
  const canSend = !!input.trim() && !sending;

  return (
    <AppLayout>
      <div className="chat-root">

        {/* ── Conversation sidebar ── */}
        <div className={`chat-sidebar${sidebarOpen ? ' chat-sidebar-open' : ''}`}>
          <div className="chat-sidebar-header">
            <span className="chat-sidebar-title">Conversations</span>
            <button
              onClick={() => createConversation()}
              title="New chat"
              className="chat-sidebar-new-btn"
            >
              + New
            </button>
          </div>

          <div className="chat-sidebar-list">
            {convLoading && <Loading size={20} />}
            {convError   && <p className="chat-sidebar-error">{convError}</p>}
            {!convLoading && conversations.length === 0 && (
              <p className="chat-sidebar-empty">No conversations yet.</p>
            )}
            {conversations.map((conv) => (
              <ConversationItem
                key={conv._id}
                conv={conv}
                active={conv._id === activeId}
                onClick={selectConversation}
              />
            ))}
          </div>
        </div>

        {/* ── Chat area ── */}
        <div className="chat-area">
          {/* Topbar */}
          <div className="chat-topbar">
            <button
              className="chat-sidebar-toggle"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle conversation list"
            >
              ☰
            </button>
            <span className="chat-topbar-title">
              {activeId
                ? (conversations.find((c) => c._id === activeId)?.title || 'Chat')
                : 'MindCare Chat'}
            </span>
          </div>

          {/* Messages */}
          <div className="chat-messages">
            {!activeId && (
              <EmptyState
                icon="💬"
                title="Start a conversation"
                description="Create a new chat or select one from the sidebar."
                action={
                  <button onClick={() => createConversation()} className="chat-empty-btn">
                    New conversation
                  </button>
                }
              />
            )}
            {activeId && msgLoading  && <Loading text="Loading messages…" />}
            {activeId && !msgLoading && messages.length === 0 && (
              <EmptyState icon="🌱" title="Say hello" description="Send your first message to start the conversation." />
            )}

            {messages.map((msg, i) => <MessageBubble key={msg._id || i} msg={msg} />)}

            {sending && (
              <div className="chat-typing">
                <div className="chat-typing-dots">
                  <div className="chat-typing-dot" />
                  <div className="chat-typing-dot" />
                  <div className="chat-typing-dot" />
                </div>
                <span className="chat-typing-label">MindCare is here for you…</span>
              </div>
            )}

            {msgError && <div className="chat-msg-error"><ErrorMessage message={msgError} /></div>}
            <div ref={bottomRef} />
          </div>

          {/* Input area */}
          <div className="chat-input-area">
            <div className="chat-input-row">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Share what's on your mind… (Enter to send, Shift+Enter for new line)"
                rows={1}
                disabled={sending}
                aria-label="Message input"
                className="chat-textarea"
              />
              {/* CSS class controls active/disabled appearance — no inline style needed */}
              <button
                onClick={sendMessage}
                disabled={!canSend}
                aria-label="Send message"
                className={`chat-send-btn${canSend ? ' chat-send-btn--active' : ' chat-send-btn--disabled'}`}
              >
                {sending ? '…' : 'Send ↑'}
              </button>
            </div>
          </div>
        </div>

      </div>
    </AppLayout>
  );
}
