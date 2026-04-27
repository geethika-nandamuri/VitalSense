import React, { useState, useRef, useEffect } from 'react';
import api from '../utils/api';

/* ── tiny keyframe injected once ── */
const STYLE_ID = 'chatwidget-keyframes';
if (!document.getElementById(STYLE_ID)) {
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = `
    @keyframes cw-pop-in {
      from { opacity: 0; transform: scale(0.85) translateY(16px); }
      to   { opacity: 1; transform: scale(1)   translateY(0);     }
    }
    @keyframes cw-msg-in {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0);   }
    }
    @keyframes cw-dot {
      0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
      40%           { transform: scale(1);   opacity: 1;   }
    }
    @keyframes cw-pulse-ring {
      0%   { transform: scale(1);    opacity: 0.6; }
      100% { transform: scale(1.55); opacity: 0;   }
    }
  `;
  document.head.appendChild(s);
}

/* ── constants ── */
const GRADIENT = 'linear-gradient(135deg, #0ea5e9 0%, #14b8a6 100%)';
const WELCOME   = 'Hi! I\'m your VitalSense AI assistant 👋\nAsk me anything about your health data, biomarkers, or type "appointment" to book one.';

/* ── sub-components ── */
const TypingIndicator = () => (
  <div style={{ display: 'flex', gap: 4, padding: '10px 14px', alignItems: 'center' }}>
    {[0, 1, 2].map(i => (
      <span key={i} style={{
        width: 7, height: 7, borderRadius: '50%',
        background: '#94a3b8',
        display: 'inline-block',
        animation: `cw-dot 1.2s ease-in-out ${i * 0.2}s infinite`,
      }} />
    ))}
  </div>
);

const Message = ({ msg }) => {
  const isUser = msg.role === 'user';
  return (
    <div style={{
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      marginBottom: 10,
      animation: 'cw-msg-in 0.25s ease-out',
    }}>
      {/* bot avatar */}
      {!isUser && (
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          background: GRADIENT,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, color: '#fff', flexShrink: 0,
          marginRight: 8, marginTop: 2,
        }}>V</div>
      )}

      <div style={{
        maxWidth: '75%',
        padding: '10px 14px',
        borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
        background: isUser ? GRADIENT : '#f1f5f9',
        color: isUser ? '#fff' : '#1e293b',
        fontSize: 13.5,
        lineHeight: 1.55,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        boxShadow: isUser
          ? '0 2px 8px rgba(14,165,233,0.25)'
          : '0 1px 4px rgba(0,0,0,0.07)',
      }}>
        {msg.text}
        <div style={{
          fontSize: 10, marginTop: 4, opacity: 0.65,
          textAlign: isUser ? 'right' : 'left',
        }}>
          {msg.time}
        </div>
      </div>
    </div>
  );
};

/* ── main widget ── */
export default function ChatWidget() {
  const [open, setOpen]       = useState(false);
  const [messages, setMessages] = useState([
    { id: 0, role: 'bot', text: WELCOME, time: now() },
  ]);
  const [input, setInput]     = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef             = useRef(null);
  const inputRef              = useRef(null);

  /* auto-scroll on new message */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  /* focus input when window opens */
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 120);
  }, [open]);

  /* close on Escape */
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = { id: Date.now(), role: 'user', text, time: now() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    // send only the last 10 messages as history (excluding the welcome message)
    const history = updatedMessages.slice(1, -1).slice(-10);

    try {
      const { data } = await api.post('/api/chat', { message: text, history });
      const replyText = data.reply || 'Sorry, I could not understand that.';
      const isBooked = !!data.appointmentId;
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'bot',
        text: isBooked
          ? replyText
          : replyText,
        time: now(),
        ...(isBooked && { appointmentId: data.appointmentId }),
      }]);
    } catch {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'bot',
        text: 'Something went wrong. Please try again.',
        time: now(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const onKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <>
      {/* ── chat window ── */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 88, right: 24, zIndex: 9999,
          width: 360, maxWidth: 'calc(100vw - 48px)',
          height: 520, maxHeight: 'calc(100vh - 120px)',
          borderRadius: 20,
          background: '#fff',
          boxShadow: '0 24px 64px rgba(0,0,0,0.18), 0 4px 16px rgba(14,165,233,0.12)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          animation: 'cw-pop-in 0.28s cubic-bezier(0.34,1.56,0.64,1)',
        }}>

          {/* header */}
          <div style={{
            background: GRADIENT,
            padding: '14px 18px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'rgba(255,255,255,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18,
              }}>🩺</div>
              <div>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: 15, lineHeight: 1.2 }}>
                  VitalSense Assistant
                </div>
                <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11.5 }}>
                  <span style={{
                    display: 'inline-block', width: 7, height: 7,
                    borderRadius: '50%', background: '#4ade80',
                    marginRight: 5, verticalAlign: 'middle',
                  }} />
                  Online
                </div>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              style={{
                background: 'rgba(255,255,255,0.2)', border: 'none',
                borderRadius: '50%', width: 30, height: 30,
                cursor: 'pointer', color: '#fff', fontSize: 16,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.35)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
            >✕</button>
          </div>

          {/* messages */}
          <div style={{
            flex: 1, overflowY: 'auto', padding: '16px 14px 8px',
            display: 'flex', flexDirection: 'column',
          }}>
            {messages.map(msg => <Message key={msg.id} msg={msg} />)}
            {loading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 10 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: GRADIENT,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, color: '#fff', flexShrink: 0,
                  marginRight: 8, marginTop: 2,
                }}>V</div>
                <div style={{
                  background: '#f1f5f9', borderRadius: '18px 18px 18px 4px',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
                }}>
                  <TypingIndicator />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* quick suggestions */}
          <div style={{
            padding: '6px 14px 0',
            display: 'flex', gap: 6, flexWrap: 'wrap', flexShrink: 0,
          }}>
            {['What is HbA1c?', 'Book appointment', 'Explain my results'].map(s => (
              <button key={s} onClick={() => { setInput(s); inputRef.current?.focus(); }}
                style={{
                  background: '#f0fdfa', border: '1px solid #99f6e4',
                  borderRadius: 20, padding: '4px 10px',
                  fontSize: 11.5, color: '#0f766e', cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#ccfbf1'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#f0fdfa'; }}
              >{s}</button>
            ))}
          </div>

          {/* input row */}
          <div style={{
            padding: '10px 14px 14px',
            display: 'flex', gap: 8, alignItems: 'flex-end', flexShrink: 0,
            borderTop: '1px solid #f1f5f9', marginTop: 6,
          }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={onKey}
              placeholder="Type a message…"
              rows={1}
              style={{
                flex: 1, resize: 'none', border: '1.5px solid #e2e8f0',
                borderRadius: 14, padding: '9px 13px',
                fontSize: 13.5, fontFamily: 'inherit',
                outline: 'none', lineHeight: 1.5,
                maxHeight: 96, overflowY: 'auto',
                transition: 'border-color 0.2s',
                background: '#f8fafc',
              }}
              onFocus={e  => e.target.style.borderColor = '#0ea5e9'}
              onBlur={e   => e.target.style.borderColor = '#e2e8f0'}
            />
            <button
              onClick={send}
              disabled={!input.trim() || loading}
              aria-label="Send message"
              style={{
                width: 40, height: 40, borderRadius: '50%', border: 'none',
                background: (!input.trim() || loading) ? '#e2e8f0' : GRADIENT,
                color: '#fff', cursor: (!input.trim() || loading) ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, fontSize: 17,
                transition: 'all 0.2s',
                boxShadow: (!input.trim() || loading) ? 'none' : '0 4px 12px rgba(14,165,233,0.35)',
              }}
            >➤</button>
          </div>
        </div>
      )}

      {/* ── floating toggle button ── */}
      <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999 }}>
        {/* pulse ring — only when closed */}
        {!open && (
          <span style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            background: GRADIENT, opacity: 0.5,
            animation: 'cw-pulse-ring 2s ease-out infinite',
            pointerEvents: 'none',
          }} />
        )}
        <button
          onClick={() => setOpen(o => !o)}
          aria-label={open ? 'Close chat' : 'Open chat'}
          style={{
            width: 56, height: 56, borderRadius: '50%', border: 'none',
            background: GRADIENT,
            color: '#fff', cursor: 'pointer', fontSize: 24,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(14,165,233,0.4)',
            transition: 'transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.2s',
            position: 'relative',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
        >
          <span style={{
            display: 'inline-block',
            transition: 'transform 0.3s, opacity 0.2s',
            transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
          }}>
            {open ? '✕' : '💬'}
          </span>
        </button>
      </div>
    </>
  );
}

function now() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
