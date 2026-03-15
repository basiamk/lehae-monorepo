import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../utils/axios';
import { useLanguage } from '../contexts/LanguageContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { Send, ChevronDown, ChevronUp, MessageCircle, Home, Plus, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const Messages = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const incoming = location.state || {};
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [expandedThread, setExpandedThread] = useState(null);
  const [threadMessages, setThreadMessages] = useState({});
  const [replyTexts, setReplyTexts] = useState({});
  const [newMessage, setNewMessage] = useState(incoming.prefilledMessage || '');
  const [receiverId, setReceiverId] = useState(incoming.receiverId || '');
  const [propertyId, setPropertyId] = useState(incoming.propertyId || '');
  const [propertyTitle, setPropertyTitle] = useState(incoming.propertyTitle || '');
  const [showNewForm, setShowNewForm] = useState(!!(incoming.receiverId));

  const fetchThreads = async () => {
    try {
      const response = await axiosInstance.get('/api/conversations/');
      setThreads(response.data || []);
    } catch { setError(t('failed_to_load_messages')); }
    finally { setLoading(false); }
  };

  const fetchThreadMessages = async (threadIndex, otherId, propId) => {
    try {
      const response = await axiosInstance.get(`/api/conversations/${otherId}/${propId || 'none'}/messages/`);
      setThreadMessages(prev => ({ ...prev, [threadIndex]: response.data }));
    } catch (err) { console.error('Fetch thread messages error:', err); }
  };

  useEffect(() => {
    if (propertyId && threads.length > 0) {
      const matchingIndex = threads.findIndex(th =>
        th.property?.id === parseInt(propertyId) && th.other.id === parseInt(receiverId)
      );
      if (matchingIndex !== -1) {
        setExpandedThread(matchingIndex);
        fetchThreadMessages(matchingIndex, receiverId, propertyId);
        if (threads[matchingIndex]?.unread_count > 0) markThreadAsRead(matchingIndex);
      }
    }
  }, [threads, propertyId, receiverId]);

  useEffect(() => {
    fetchThreads();
    const interval = setInterval(fetchThreads, 60000);
    return () => clearInterval(interval);
  }, [t]);

  const markThreadAsRead = async (threadIndex) => {
    const thread = threads[threadIndex];
    if (!thread || thread.unread_count <= 0) return;
    setThreads(prev => prev.map((th, idx) => idx === threadIndex ? { ...th, unread_count: 0 } : th));
    try {
      await axiosInstance.post('/api/conversations/mark-read/', { other_id: thread.other.id, property_id: thread.property?.id || null });
      await fetchThreads();
      window.dispatchEvent(new CustomEvent('messages-updated'));
    } catch { await fetchThreads(); }
  };

  const toggleThread = (index) => {
    const newExpanded = expandedThread === index ? null : index;
    setExpandedThread(newExpanded);
    if (newExpanded !== null) {
      const thread = threads[index];
      fetchThreadMessages(newExpanded, thread.other.id, thread.property?.id);
      if (thread.unread_count > 0) markThreadAsRead(newExpanded);
    }
  };

  const handleSendReply = async (index) => {
    const thread = threads[index];
    const text = replyTexts[index]?.trim();
    if (!text || !thread.other?.id) { setError(t('receiver_and_message_required')); return; }
    try {
      setError('');
      await axiosInstance.post('/api/messages/', { receiver: thread.other.id, property: thread.property?.id || null, content: text });
      setReplyTexts(prev => { const n = { ...prev }; delete n[index]; return n; });
      setSuccess(t('message_sent_successfully'));
      setTimeout(() => setSuccess(''), 3000);
      await fetchThreads();
      await fetchThreadMessages(index, thread.other.id, thread.property?.id);
    } catch { setError(t('failed_to_send_message')); }
  };

  const handleSendNewMessage = async () => {
    if (!newMessage.trim() || !receiverId) { setError(t('receiver_and_message_required')); return; }
    try {
      setError('');
      await axiosInstance.post('/api/messages/', { receiver: receiverId, property: propertyId || null, content: newMessage });
      setNewMessage(''); setReceiverId(''); setPropertyId(''); setPropertyTitle('');
      setShowNewForm(false);
      setSuccess(t('message_sent_successfully'));
      setTimeout(() => setSuccess(''), 3000);
      await fetchThreads();
    } catch { setError(t('failed_to_send_message')); }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="min-h-screen bg-neutral-50">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@400;500&display=swap');
        .msg-thread { background:#fff; border:1px solid #ede8e0; border-radius:16px; overflow:hidden; transition:all 0.18s; }
        .msg-thread:hover { border-color:#c4bdb4; }
        .msg-thread.expanded { border-color:#c4a882; }
        .msg-bubble-me { background:#1c1a17; color:#fff; border-radius:16px 16px 4px 16px; }
        .msg-bubble-other { background:#faf7f3; color:#1c1a17; border:1px solid #ede8e0; border-radius:16px 16px 16px 4px; }
        .msg-reply-input {
          width:100%; padding:12px 16px; border:1px solid #ede8e0; border-radius:12px;
          font-size:14px; font-family:'DM Sans',sans-serif; color:#1c1a17; background:#faf7f3;
          outline:none; resize:none; min-height:90px; transition:border-color 0.18s;
        }
        .msg-reply-input:focus { border-color:#c4a882; background:#fff; }
        .msg-new-input { width:100%; padding:12px 16px; border:1px solid #ede8e0; border-radius:12px; font-size:14px; font-family:'DM Sans',sans-serif; color:#1c1a17; background:#fff; outline:none; resize:none; min-height:120px; transition:border-color 0.18s; }
        .msg-new-input:focus { border-color:#c4a882; }
      `}</style>

      {/* Header */}
      <div style={{ background:'#1c1a17', paddingTop:48, paddingBottom:48 }}>
        <div className="max-w-4xl mx-auto px-6 flex items-center justify-between">
          <div style={{display:'flex',alignItems:'center',gap:14}}>
            <div style={{width:44,height:44,borderRadius:12,background:'rgba(212,169,106,0.15)',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <MessageCircle size={20} style={{color:'#d4a96a'}}/>
            </div>
            <div>
              <p style={{fontSize:11,fontWeight:600,letterSpacing:'0.1em',textTransform:'uppercase',color:'#d4a96a',marginBottom:4}}>Inbox</p>
              <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:'clamp(1.6rem,3vw,2.2rem)',fontWeight:700,color:'#fff'}}>{t('messages')}</h1>
            </div>
          </div>
          <button onClick={()=>setShowNewForm(!showNewForm)}
            style={{display:'flex',alignItems:'center',gap:6,padding:'9px 16px',borderRadius:12,background:'rgba(255,255,255,0.1)',color:'#fff',border:'1px solid rgba(255,255,255,0.15)',fontSize:13,fontWeight:500,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",transition:'background 0.15s'}}
            onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.18)'}
            onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,0.1)'}>
            {showNewForm ? <X size={14}/> : <Plus size={14}/>} {t('start_new_conversation')}
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">

        {/* Alerts */}
        {success && (
          <div className="mb-5 p-4 rounded-xl text-sm" style={{background:'#f0fdf4',border:'1px solid #86efac',color:'#16a34a'}}>{success}</div>
        )}
        {error && (
          <div className="mb-5 p-4 rounded-xl text-sm" style={{background:'#fef2f2',border:'1px solid #fecaca',color:'#dc2626'}}>{error}</div>
        )}

        {/* New conversation form */}
        <AnimatePresence>
          {showNewForm && (
            <motion.div initial={{opacity:0,y:-12}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}}
              className="mb-6 bg-white rounded-2xl border border-neutral-200 p-6">
              <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:17,fontWeight:700,color:'#1c1a17',marginBottom:16}}>{t('start_new_conversation')}</h2>
              {propertyTitle && (
                <div style={{display:'flex',alignItems:'center',gap:7,fontSize:12,color:'#9c9080',marginBottom:14,padding:'8px 12px',background:'#faf7f3',borderRadius:8,border:'1px solid #ede8e0'}}>
                  <Home size={13} style={{color:'#d4a96a',flexShrink:0}}/> {t('regarding')}: {propertyTitle}
                </div>
              )}
              <textarea placeholder={t('type_your_message_here')} value={newMessage}
                onChange={e=>setNewMessage(e.target.value)} className="msg-new-input" style={{marginBottom:12}} />
              <div style={{display:'flex',justifyContent:'flex-end'}}>
                <button onClick={handleSendNewMessage} disabled={!newMessage.trim()||!receiverId}
                  style={{display:'flex',alignItems:'center',gap:7,padding:'10px 20px',borderRadius:12,background:'#1c1a17',color:'#fff',border:'none',fontSize:13,fontWeight:500,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",opacity:(!newMessage.trim()||!receiverId)?0.4:1,transition:'background 0.15s'}}
                  onMouseEnter={e=>e.currentTarget.style.background='#3a3430'}
                  onMouseLeave={e=>e.currentTarget.style.background='#1c1a17'}>
                  <Send size={14}/> {t('send')}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Thread list */}
        <div className="space-y-3">
          {threads.length === 0 ? (
            <div style={{textAlign:'center',padding:'60px 20px',background:'#fff',borderRadius:20,border:'1px solid #ede8e0'}}>
              <div style={{width:56,height:56,borderRadius:16,background:'#faf7f3',border:'1px solid #ede8e0',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px'}}>
                <MessageCircle size={22} style={{color:'#c4bdb4'}}/>
              </div>
              <p style={{fontFamily:"'Playfair Display',serif",fontSize:17,fontWeight:700,color:'#1c1a17',marginBottom:6}}>No messages yet</p>
              <p style={{fontSize:13,color:'#9c9080'}}>{t('no_messages_yet')}</p>
            </div>
          ) : threads.map((thread, index) => (
            <div key={index} className={`msg-thread ${expandedThread===index?'expanded':''}`}>
              {/* Thread header */}
              <div style={{padding:'16px 20px',display:'flex',alignItems:'center',justifyContent:'space-between',cursor:'pointer'}}
                onClick={()=>toggleThread(index)}>
                <div style={{display:'flex',alignItems:'center',gap:14,flex:1,minWidth:0}}>
                  <div style={{width:42,height:42,borderRadius:'50%',background:'linear-gradient(135deg,#f5f0e8,#ede8e0)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,fontWeight:700,color:'#7a7060',fontFamily:"'Playfair Display',serif",flexShrink:0}}>
                    {thread.other.username[0].toUpperCase()}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:3}}>
                      <p style={{fontSize:14,fontWeight:600,color:'#1c1a17',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
                        {thread.other.username}
                      </p>
                      {thread.property && (
                        <span style={{fontSize:11,color:'#9c9080',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
                          · {thread.property.area}, {thread.property.district}
                        </span>
                      )}
                    </div>
                    <p style={{fontSize:12,color:'#9c9080',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
                      {thread.last_message_preview || t('No messages yet')}
                    </p>
                  </div>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:10,marginLeft:16,flexShrink:0}}>
                  {thread.unread_count > 0 && (
                    <span style={{background:'#1c1a17',color:'#fff',fontSize:10,fontWeight:700,borderRadius:100,padding:'2px 8px',minWidth:20,textAlign:'center'}}>
                      {thread.unread_count}
                    </span>
                  )}
                  <span style={{color:'#c4bdb4'}}>
                    {expandedThread===index ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                  </span>
                </div>
              </div>

              {/* Thread messages */}
              <AnimatePresence>
                {expandedThread===index && (
                  <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}}
                    transition={{duration:0.2}} style={{borderTop:'1px solid #f3ede6',overflow:'hidden'}}>
                    <div style={{padding:'16px 20px'}}>
                      {thread.property && (
                        <div style={{marginBottom:12}}>
                          <Link to={`/properties/${thread.property.id}`}
                            style={{display:'inline-flex',alignItems:'center',gap:6,padding:'6px 12px',background:'#faf7f3',border:'1px solid #ede8e0',borderRadius:8,color:'#7a7060',textDecoration:'none',fontSize:12,fontWeight:500,transition:'all 0.15s'}}>
                            <Home size={12}/> {t('view_property_info')}
                          </Link>
                        </div>
                      )}

                      {threadMessages[index] ? (
                        <div style={{maxHeight:320,overflowY:'auto',display:'flex',flexDirection:'column',gap:12,marginBottom:16,paddingRight:4}} className="scrollbar-thin">
                          {threadMessages[index].map(msg => (
                            <div key={msg.id} style={{display:'flex',flexDirection:'column',maxWidth:'78%',alignSelf:msg.sender_username===user?.username?'flex-end':'flex-start',alignItems:msg.sender_username===user?.username?'flex-end':'flex-start'}}>
                              <div className={msg.sender_username===user?.username?'msg-bubble-me':'msg-bubble-other'}
                                style={{padding:'10px 14px'}}>
                                <p style={{fontSize:13,lineHeight:1.6,whiteSpace:'pre-line'}}>{msg.content}</p>
                              </div>
                              <span style={{fontSize:10,color:'#c4bdb4',marginTop:4}}>
                                {new Date(msg.created_at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{textAlign:'center',padding:'20px 0',color:'#c4bdb4',fontSize:13}}>Loading messages…</div>
                      )}

                      {/* Reply box */}
                      <div style={{display:'flex',gap:10,alignItems:'flex-end'}}>
                        <textarea
                          placeholder={t('reply_here')}
                          value={replyTexts[index]||''}
                          onChange={e=>setReplyTexts(prev=>({...prev,[index]:e.target.value}))}
                          onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();handleSendReply(index);}}}
                          className="msg-reply-input" style={{flex:1,minHeight:56,maxHeight:120}}
                        />
                        <button onClick={()=>handleSendReply(index)} disabled={!replyTexts[index]?.trim()}
                          style={{width:42,height:42,borderRadius:12,background:'#1c1a17',color:'#fff',border:'none',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',flexShrink:0,opacity:!replyTexts[index]?.trim()?0.4:1,transition:'background 0.15s'}}
                          onMouseEnter={e=>e.currentTarget.style.background='#3a3430'}
                          onMouseLeave={e=>e.currentTarget.style.background='#1c1a17'}>
                          <Send size={15}/>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Messages;