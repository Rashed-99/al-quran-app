import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Send, Sparkles, BookHeart, Target, AlertCircle, RefreshCw } from 'lucide-react';
import * as companionApi from '@/api/companion';
import MessageBubble from '@/components/companion/MessageBubble';

const SUGGESTIONS = [
  { icon: BookHeart, label: 'How am I doing?', text: "How am I doing with my reading progress?" },
  { icon: Target, label: 'Suggest a daily goal', text: "Can you suggest a realistic daily recitation goal for me?" },
  { icon: Sparkles, label: 'Explain a verse', text: "Please explain Surah 2, verse 255 (Ayat al-Kursi) using tafsir." },
];

// NOTE ON ARCHITECTURE: the old Base44 "quran_companion" agent did
// everything (encouragement, tafsir-via-web-search, chat) through one
// live LLM call per message. The new backend splits this per the agreed
// cost-conscious design:
//   - progress encouragement is templated, not an LLM call at all
//   - tafsir explanations reuse the precomputed tafsir table
//   - only open-ended chat below hits a live, rate-limited LLM
// The system prompt on the backend is given the user's real progress
// numbers as context on every turn, so "How am I doing?" still gets an
// accurate, grounded answer even though it's routed through chat here.
export default function Companion() {
  const navigate = useNavigate();
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    initConversation();
  }, []);

  const initConversation = async () => {
    setLoading(true);
    setError(null);
    try {
      const conversations = await companionApi.listConversations();
      if (conversations.length > 0) {
        const conv = conversations[0];
        setConversationId(conv.id);
        const msgs = await companionApi.getMessages(conv.id);
        setMessages(msgs);
      } else {
        // No conversation yet - one is created automatically on first
        // sendMessage call, so there's nothing more to do here.
        setConversationId(null);
        setMessages([]);
      }
    } catch (err) {
      console.error('Error initializing conversation:', err);
      setError(err?.message || 'Could not load the conversation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (textToSend) => {
    const content = (textToSend ?? input).trim();
    if (!content || sending) return;
    setInput('');
    setSending(true);
    setError(null);

    // Optimistically show the user's message immediately.
    setMessages(prev => [...prev, { role: 'user', content }]);

    try {
      const result = await companionApi.sendMessage({ conversationId, content });
      setConversationId(result.conversationId);
      setMessages(prev => [...prev, result.message]);
    } catch (err) {
      console.error('Error sending message:', err);
      const isRateLimited = err?.status === 429;
      setError(
        isRateLimited
          ? (err?.data?.error || "You've reached today's Companion message limit. Please try again tomorrow.")
          : (err?.data?.error || 'Failed to send message.')
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--app-bg-gradient)', paddingTop: 'env(safe-area-inset-top)' }}>
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md border-b border-[var(--app-divider)]" style={{ background: 'var(--app-bar-bg)' }}>
        <div className="flex items-center gap-3 px-4 py-3 max-w-lg mx-auto w-full">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center touch-manipulation"
          >
            <ChevronLeft className="w-6 h-6 dark:text-white" />
          </button>
          <div className="w-10 h-10 rounded-2xl bg-[image:var(--app-accent-gradient)] flex items-center justify-center shadow-md">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-base font-bold text-[var(--app-text-primary)]">Quran Companion</h1>
            <p className="text-xs text-[var(--app-text-secondary)]">
              {sending ? 'Thinking…' : 'Encouragement & Tafsir'}
            </p>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 max-w-lg mx-auto w-full space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <div className="w-8 h-8 border-4 border-[var(--app-accent-soft)] border-t-[var(--app-accent)] rounded-full animate-spin" />
            <p className="text-sm text-[var(--app-text-secondary)]">Loading your companion…</p>
          </div>
        ) : error && messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4 px-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center">
              <AlertCircle className="w-7 h-7 text-rose-500" />
            </div>
            <p className="text-sm text-[var(--app-text-secondary)]">{error}</p>
            <button
              onClick={initConversation}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--app-accent)] text-white text-sm font-medium touch-manipulation active:scale-95 transition-transform"
            >
              <RefreshCw className="w-4 h-4" /> Retry
            </button>
          </div>
        ) : (
          <>
            {/* Welcome message if empty */}
            {messages.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[var(--app-card-bg)] rounded-2xl p-5 border border-[var(--app-card-border)] shadow-sm"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-5 h-5 text-[var(--app-accent)]" />
                  <h2 className="font-semibold text-[var(--app-text-primary)]">Assalamu Alaikum! 👋</h2>
                </div>
                <p className="text-sm text-[var(--app-text-secondary)] mb-4">
                  I'm your Quran Companion. I can track your reading progress and encourage you, suggest realistic daily goals, and point you to tafsir for any verse. How can I help you today?
                </p>
                <div className="space-y-2">
                  {SUGGESTIONS.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(s.text)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl bg-[var(--app-card-bg-alt)] hover:bg-[var(--app-accent-soft)] border border-[var(--app-card-border)] transition-colors text-left touch-manipulation"
                    >
                      <div className="w-8 h-8 rounded-lg bg-[var(--app-accent-soft)] flex items-center justify-center shrink-0">
                        <s.icon className="w-4 h-4 text-[var(--app-accent)]" />
                      </div>
                      <span className="text-sm font-medium text-[var(--app-text-primary)]">{s.label}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Inline error toast */}
            {error && messages.length > 0 && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="flex-1">{error}</span>
                <button onClick={() => setError(null)} className="text-rose-400">✕</button>
              </div>
            )}

            {/* Message list */}
            <AnimatePresence initial={false}>
              {messages.map((msg, idx) => (
                <motion.div
                  key={msg.id || idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <MessageBubble message={msg} />
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Sending indicator */}
            {sending && (
              <div className="flex justify-start">
                <div className="bg-[var(--app-card-bg)] rounded-2xl rounded-tl-md px-4 py-3 shadow-sm border border-[var(--app-card-border)]">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-[var(--app-accent)] animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-[var(--app-accent)] animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-[var(--app-accent)] animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input bar */}
      <div className="sticky bottom-0 backdrop-blur-md border-t border-[var(--app-divider)]" style={{ background: 'var(--app-bar-bg)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Ask about your progress or a verse…"
            disabled={sending}
            className="flex-1 h-11 rounded-full bg-[var(--app-card-bg-alt)] border border-[var(--app-card-border)] px-4 text-sm text-[var(--app-text-primary)] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--app-accent)] disabled:opacity-50"
          />
          <button
            onClick={() => handleSend()}
            disabled={sending || !input.trim()}
            className="w-11 h-11 rounded-full bg-[image:var(--app-accent-gradient)] text-white flex items-center justify-center shadow-md disabled:opacity-40 touch-manipulation shrink-0"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}