import React, { useState, useEffect, useRef, useCallback } from 'react';
import chatService from '../../services/chat.service.js';
import Loading from '../../components/common/Loading.jsx';
import ErrorMessage from '../../components/common/ErrorMessage.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import AppLayout from '../../layouts/AppLayout.jsx';

/* ─────────────────────────────────────────────────────────────────
   ARCHITECTURE NOTE
   The frontend does NOT orchestrate the AI pipeline.
   Sending a message calls POST /chat/:id/send — the backend handles:
     1. Save user message
     2. Detect emotion (Module 3)
     3. Retrieve context (Module 4)
     4. Generate AI response (Module 5)
     5. Save AI message
     6. Return { userMessage, aiMessage, emotion }
   The frontend just displays the result.
───────────────────────────────────────────────────────────────── */

const EMOTION_COLORS = {
  happy: '#22c55e', sad: '#60a5fa', angry: '#ef4444',
  fear: '#a855f7', anxiety: '#f59e0b', neutral: '#94a3b8', surprise: '#ec4899',
};
const EMOTION_EMOJI = {
  happy: '😊', sad: '😢', angry: '😠', fear: '😨', anxiety: '😰', neutral: '😐', surprise: '😲',
};

function EmotionBadge({ emotion }) {
  // emotion is a string label from backend e.g. "anxiety"
  if (!emotion) return null;
  const color = EMOTION_COLORS[emotion] || '#94a3b8';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
      fontSize: '0.7rem', padding: '0.15rem 0.5rem',
      borderRadius: 'var(--radius-full)',
      background: color + '22', color, border: `1px solid ${color}44`,
      marginTop: '0.25rem',
    }}>
      {EMOTION_EMOJI[emotion] || ''} {emotion}
    </span>
  );
}

function MessageBubble({ msg }) {
  const isUser = msg.sender === 'user';
  // metadata.emotion is an object { emotion, confidence, ... } from backend
  const emotionLabel = msg.metadata?.emotion?.emotion || null;

  return (
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: '1rem', animation: 'fadeIn 0.2s ease' }}>
      <div style={{ maxWidth: '72%' }}>
        {!isUser && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.3rem', paddingLeft: '0.25rem' }}>
            <span style={{ fontSize: '1.1rem' }}>🧠</span>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>MindCare AI</span>
          </div>
        )}
        <div style={{
          padding: '0.75rem 1rem',
          borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
          background: isUser ? 'var(--color-primary)' : 'var(--color-surface)',
          color: isUser ? '#fff' : 'var(--color-text)',
          boxShadow: 'var(--shadow-sm)',
          border: isUser ? 'none' : '1px solid var(--color-border)',
          fontSize: '0.9rem', lineHeight: 1.6, whiteSpace: 'pre-wrap',
        }}>
          {msg.content}
        </div>
        {!isUser && emotionLabel && (
          <div style={{ paddingLeft: '0.25rem' }}>
            <EmotionBadge emotion={emotionLabel} />
          </div>
        )}
        <div style={{
          fontSize: '0.7rem', color: 'var(--color-text-light)', marginTop: '0.25rem',
          textAlign: isUser ? 'right' : 'left',
          paddingLeft: isUser ? 0 : '0.25rem', paddingRight: isUser ? '0.25rem' : 0
        }}>
          {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
        </div>
      </div>
    </div>
  );
}

function ConversationItem({ conv, active, onClick }) {
  return (
    <button
      onClick={() => onClick(conv._id)}
      style={{
        width: '100%', textAlign: 'left', padding: '0.65rem 0.75rem',
        borderRadius: 'var(--radius-md)', border: 'none',
        background: active ? 'var(--color-primary-light)' : 'transparent',
        color: active ? 'var(--color-primary)' : 'var(--color-text)',
        cursor: 'pointer', fontSize: '0.875rem',
        fontWeight: active ? 600 : 400,
        display: 'flex', alignItems: 'center', gap: '0.5rem',
        overflow: 'hidden', transition: 'background 0.15s',
      }}
    >
      <span style={{ opacity: 0.6, flexShrink: 0 }}>💬</span>
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {conv.title || 'New conversation'}
      </span>
    </button>
  );
}

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
  // Backend: GET /chat → paginated() → { data: [], pagination: {} }
  const loadConversations = useCallback(async () => {
    setConvLoading(true);
    setConvError('');
    try {
      const { data } = await chatService.listConversations({ limit: 50, sort: 'newest' });
      // paginated() helper returns: { success, message, data: [...], pagination: {...} }
      setConversations(Array.isArray(data.data) ? data.data : []);
    } catch {
      setConvError('Could not load conversations.');
    } finally {
      setConvLoading(false);
    }
  }, []);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  // ── Load messages ───────────────────────────────────────────────
  // Backend: GET /chat/:id/messages → paginated() → { data: [], pagination: {} }
  const loadMessages = useCallback(async (convId) => {
    setMsgLoading(true);
    setMsgError('');
    try {
      const { data } = await chatService.getMessages(convId, { limit: 100, sort: 'oldest' });
      // paginated() → data.data is the array directly
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
  // Backend: POST /chat → created() → { data: { conversation } }
  const createConversation = async (titleHint = '') => {
    try {
      const { data } = await chatService.createConversation(titleHint || 'New chat');
      const newConv = data.data.conversation;
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
  // Backend: POST /chat/:id/send → { data: { userMessage, aiMessage, emotion } }
  // The backend handles: emotion detection, context retrieval, response generation
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
      // Backend returns: { data: { userMessage, aiMessage, emotion } }
      const { userMessage, aiMessage } = data.data;

      setMessages((prev) => [
        ...prev.filter((m) => m._id !== tempId),
        userMessage,
        aiMessage,
      ]);

      // Refresh sidebar
      loadConversations();
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m._id !== tempId));
      const status = err.response?.status;
      if (status === 503) {
        setMsgError('⚠️ If you\'re in crisis, please reach out to a trusted person or helpline. Your wellbeing matters.');
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

  return (
    <AppLayout>
      <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>

        {/* ── Conversation sidebar ── */}
        <div
          className={`chat-sidebar ${sidebarOpen ? 'chat-sidebar-open' : ''}`}
          style={{
            width: 260, borderRight: '1px solid var(--color-border)',
            background: 'var(--color-surface)',
            display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'hidden',
          }}
        >
          <div style={{ padding: '1rem', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Conversations</span>
            <button
              onClick={() => createConversation()}
              title="New chat"
              style={{ background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', padding: '0.3rem 0.65rem', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600 }}
            >+ New</button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
            {convLoading && <Loading size={20} />}
            {convError && <p style={{ color: 'var(--color-error)', fontSize: '0.8rem', padding: '0.5rem' }}>{convError}</p>}
            {!convLoading && conversations.length === 0 && (
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', padding: '1rem 0.5rem' }}>No conversations yet.</p>
            )}
            {conversations.map((conv) => (
              <ConversationItem key={conv._id} conv={conv} active={conv._id === activeId} onClick={selectConversation} />
            ))}
          </div>
        </div>

        {/* ── Chat area ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--color-bg)' }}>
          {/* Topbar */}
          <div style={{ padding: '0.75rem 1.25rem', background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              className="chat-sidebar-toggle"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{ display: 'none', background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: 'var(--color-text-muted)' }}
              aria-label="Toggle conversation list"
            >☰</button>
            <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>
              {activeId ? (conversations.find((c) => c._id === activeId)?.title || 'Chat') : 'MindCare Chat'}
            </span>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem' }}>
            {!activeId && (
              <EmptyState
                icon="💬" title="Start a conversation"
                description="Create a new chat or select one from the sidebar."
                action={
                  <button onClick={() => createConversation()} style={{ background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', padding: '0.65rem 1.25rem', fontWeight: 600, cursor: 'pointer' }}>
                    New conversation
                  </button>
                }
              />
            )}
            {activeId && msgLoading && <Loading text="Loading messages…" />}
            {activeId && !msgLoading && messages.length === 0 && (
              <EmptyState icon="🌱" title="Say hello" description="Send your first message to start the conversation." />
            )}
            {messages.map((msg, i) => <MessageBubble key={msg._id || i} msg={msg} />)}

            {sending && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', paddingLeft: '0.5rem' }}>
                <div style={{ display: 'flex', gap: 4 }}>
                  {[0,1,2].map((i) => (
                    <div key={i} style={{ width: 6, height: 6, background: 'var(--color-primary)', borderRadius: '50%', animation: `bounce 0.9s ${i*0.2}s ease-in-out infinite` }} />
                  ))}
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>MindCare is thinking…</span>
              </div>
            )}

            {msgError && <div style={{ marginTop: '0.5rem' }}><ErrorMessage message={msgError} /></div>}
            <div ref={bottomRef} />
          </div>

          {/* Input area */}
          <div style={{ padding: '1rem', background: 'var(--color-surface)', borderTop: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Share what's on your mind… (Enter to send, Shift+Enter for new line)"
                rows={1}
                disabled={sending}
                aria-label="Message input"
                style={{
                  flex: 1, resize: 'none', padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--color-border)',
                  fontSize: '0.9rem', lineHeight: 1.5,
                  background: 'var(--color-bg)',
                  maxHeight: 120, outline: 'none',
                  transition: 'border-color 0.15s',
                  overflowY: 'auto', fontFamily: 'inherit',
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                onBlur={(e)  => e.target.style.borderColor = 'var(--color-border)'}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || sending}
                aria-label="Send message"
                style={{
                  background: input.trim() && !sending ? 'var(--color-primary)' : 'var(--color-border)',
                  color: input.trim() && !sending ? '#fff' : 'var(--color-text-muted)',
                  border: 'none', borderRadius: 'var(--radius-lg)',
                  padding: '0.75rem 1.25rem', fontWeight: 600,
                  fontSize: '0.9rem', cursor: input.trim() && !sending ? 'pointer' : 'not-allowed',
                  transition: 'all 0.15s', whiteSpace: 'nowrap',
                }}
              >
                {sending ? '…' : 'Send ↑'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        @media (max-width: 768px) {
          .chat-sidebar {
            position: fixed; top: 0; left: 0; bottom: 0; width: 260px;
            transform: translateX(-100%);
            transition: transform 0.25s ease; z-index: 60;
          }
          .chat-sidebar-open { transform: translateX(0); }
          .chat-sidebar-toggle { display: block !important; }
        }
      `}</style>
    </AppLayout>
  );
}
