import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import axiosInstance from '../utils/axios.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { Send, MessageSquare, Shield, ChevronDown, ChevronUp } from 'lucide-react';

/**
 * SupportChat — shown on landlord Profile page.
 * Allows landlord to message Lehae admin and see replies.
 * Collapses to a button when no messages.
 */
const SupportChat = () => {
  const { user }        = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(true);
  const [sending, setSending]   = useState(false);
  const [error, setError]       = useState('');
  const [open, setOpen]         = useState(false);
  const [unread, setUnread]     = useState(0);
  const bottomRef               = useRef(null);

  const fetchMessages = async () => {
    try {
      const res = await axiosInstance.get('/api/support/');
      const msgs = Array.isArray(res.data) ? res.data : [];
      setMessages(msgs);
      const unreadCount = msgs.filter(m => !m.is_read && m.sender !== user?.id).length;
      setUnread(unreadCount);
      if (msgs.length > 0) setOpen(true);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 30_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || sending) return;
    setSending(true); setError('');
    try {
      const res = await axiosInstance.post('/api/support/', { content: input.trim() });
      setMessages(prev => [...prev, res.data]);
      setInput('');
    } catch {
      setError('Failed to send. Please try again.');
    } finally { setSending(false); }
  };

  const isAdmin = (senderId) => {
    // A message is from admin if the sender is NOT the current user
    return senderId !== user?.id;
  };

  return (
    <div style={{ background:'#fff', border:'1px solid #ede8e0', borderRadius:20, overflow:'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@400;500&display=swap');
        .sc-input { width:100%; padding:10px 14px; border:1px solid #ede8e0; border-radius:11px; font-size:13.5px; font-family:'DM Sans',sans-serif; color:#1c1a17; background:#fff; outline:none; transition:border-color 0.18s; resize:none; }
        .sc-input:focus { border-color:#c4a882; box-shadow:0 0 0 3px rgba(196,168,130,0.12); }
      `}</style>

      {/* Header — always visible */}
      <button
        onClick={() => { setOpen(o => !o); if (!open) fetchMessages(); }}
        style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 24px', background:'none', border:'none', cursor:'pointer', textAlign:'left' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:'#faf7f3', border:'1px solid #ede8e0', display:'flex', alignItems:'center', justifyContent:'center', position:'relative' }}>
            <Shield size={16} style={{ color:'#d4a96a' }}/>
            {unread > 0 && (
              <div style={{ position:'absolute', top:-4, right:-4, width:16, height:16, borderRadius:'50%', background:'#ef4444', display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:700, color:'#fff', fontFamily:"'DM Sans',sans-serif" }}>
                {unread}
              </div>
            )}
          </div>
          <div>
            <p style={{ fontFamily:"'Playfair Display',serif", fontSize:16, fontWeight:700, color:'#1c1a17', margin:0 }}>Lehae Support</p>
            <p style={{ fontSize:11, color:'#9c9080', margin:0, fontFamily:"'DM Sans',sans-serif" }}>
              {loading ? 'Loading…' : messages.length === 0 ? 'Ask us anything about your account or listings' : `${messages.length} message${messages.length !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>
        {open ? <ChevronUp size={16} style={{ color:'#9c9080' }}/> : <ChevronDown size={16} style={{ color:'#9c9080' }}/>}
      </button>

      {/* Chat panel */}
      {open && (
        <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} transition={{ duration:0.2 }}>
          <div style={{ borderTop:'1px solid #f3ede6', padding:'0 24px 24px' }}>

            {/* Messages */}
            <div style={{ maxHeight:320, overflowY:'auto', padding:'16px 0', display:'flex', flexDirection:'column', gap:10 }}>
              {messages.length === 0 && !loading && (
                <div style={{ textAlign:'center', padding:'24px 0' }}>
                  <MessageSquare size={28} style={{ color:'#c4bdb4', display:'block', margin:'0 auto 10px' }}/>
                  <p style={{ fontSize:13, color:'#9c9080', fontFamily:"'DM Sans',sans-serif" }}>
                    No messages yet. Send us a message below — we typically respond within 24 hours.
                  </p>
                </div>
              )}

              {messages.map(msg => {
                const fromAdmin = isAdmin(msg.sender);
                return (
                  <div key={msg.id} style={{ display:'flex', justifyContent: fromAdmin ? 'flex-start' : 'flex-end' }}>
                    <div style={{
                      maxWidth:'80%',
                      padding:'10px 14px',
                      borderRadius: fromAdmin ? '4px 16px 16px 16px' : '16px 4px 16px 16px',
                      background:   fromAdmin ? '#faf7f3' : '#1c1a17',
                      color:        fromAdmin ? '#1c1a17' : '#fff',
                      fontSize:     13,
                      lineHeight:   1.6,
                      fontFamily:   "'DM Sans',sans-serif",
                      border:       fromAdmin ? '1px solid #ede8e0' : 'none',
                    }}>
                      {fromAdmin && (
                        <p style={{ fontSize:10, fontWeight:600, color:'#d4a96a', marginBottom:4, textTransform:'uppercase', letterSpacing:'0.06em' }}>
                          Lehae Support
                        </p>
                      )}
                      <p style={{ margin:0 }}>{msg.content}</p>
                      <p style={{ margin:'4px 0 0', fontSize:10, opacity:0.5 }}>
                        {new Date(msg.created_at).toLocaleString([], { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef}/>
            </div>

            {/* Error */}
            {error && (
              <p style={{ fontSize:12, color:'#dc2626', marginBottom:8, fontFamily:"'DM Sans',sans-serif" }}>{error}</p>
            )}

            {/* Input */}
            <form onSubmit={handleSend} style={{ display:'flex', gap:8, alignItems:'flex-end' }}>
              <textarea
                className="sc-input"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e); } }}
                placeholder="Ask about your listing, verification, or anything else…"
                rows={2}
                style={{ flex:1 }}
              />
              <button type="submit" disabled={sending || !input.trim()}
                style={{ width:40, height:40, borderRadius:11, background: sending || !input.trim() ? '#c4bdb4' : '#1c1a17', border:'none', cursor: sending || !input.trim() ? 'not-allowed' : 'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'background 0.15s' }}>
                <Send size={15} style={{ color:'#fff' }}/>
              </button>
            </form>
            <p style={{ fontSize:10.5, color:'#c4bdb4', marginTop:6, fontFamily:"'DM Sans',sans-serif" }}>
              Press Enter to send · Shift+Enter for new line
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default SupportChat;