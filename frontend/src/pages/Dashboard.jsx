import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useLanguage } from '../contexts/LanguageContext';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import axiosInstance from '../utils/axios.js';
import { Plus, List, BarChart2, Mail, MessageCircle, ArrowRight, Home, Clock, FileText, ShieldCheck, LifeBuoy } from 'lucide-react';
import { motion } from 'framer-motion';

const STATUS_COLORS = {
  pending:   { bg:'rgba(245,158,11,0.1)',  color:'#f59e0b'  },
  reviewing: { bg:'rgba(59,130,246,0.1)',  color:'#3b82f6'  },
  approved:  { bg:'rgba(34,197,94,0.1)',   color:'#22c55e'  },
  declined:  { bg:'rgba(239,68,68,0.1)',   color:'#ef4444'  },
  cancelled: { bg:'rgba(156,144,128,0.1)', color:'#9c9080'  },
};

const Dashboard = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate  = useNavigate();
  const [stats, setStats]                       = useState([]);
  const [recentActivity, setRecentActivity]     = useState([]);
  const [recentMessages, setRecentMessages]     = useState([]);
  const [recentApplications, setRecentApplications] = useState([]);
  const [tenantViewings, setTenantViewings]           = useState([]);
  const [loading, setLoading]                   = useState(true);
  const [error, setError]                       = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true); setError('');
        const [dashRes, msgRes] = await Promise.all([
          axiosInstance.get('/api/dashboard/'),
          axiosInstance.get('/api/messages/'),
        ]);
        setStats(dashRes.data.stats || []);
        setRecentActivity(dashRes.data.recentActivity || []);
        setRecentApplications(dashRes.data.recentApplications || []);
        // Fetch tenant viewings
        if (!user?.is_landlord && !user?.is_staff) {
          try {
            const vr = await axiosInstance.get('/api/viewings/');
            setTenantViewings(Array.isArray(vr.data) ? vr.data : []);
          } catch { /* silent */ }
        }
        const unread = (msgRes.data || [])
          .filter(msg => !msg.is_read && msg.receiver_username === user?.username)
          .slice(0, 5);
        setRecentMessages(unread);
      } catch {
        setError(t('failed_to_load_dashboard'));
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [t, user]);

  const handleCancelViewing = async (viewingId) => {
    try {
      await axiosInstance.patch(`/api/viewings/${viewingId}/`, { status: 'cancelled' });
      setTenantViewings(prev => prev.map(v => v.id === viewingId ? { ...v, status: 'cancelled' } : v));
    } catch { /* silent */ }
  };

  const handleWithdrawApplication = async (appId) => {
    try {
      await axiosInstance.patch(`/api/applications/${appId}/`, { status: 'cancelled' });
      setRecentApplications(prev => prev.map(a => a.id === appId ? { ...a, status: 'cancelled' } : a));
    } catch { /* silent */ }
  };

  const handleAppAction = async (appId, newStatus) => {
    try {
      await axiosInstance.patch(`/api/applications/${appId}/`, { status: newStatus });
      // Refresh dashboard data
      const dashRes = await axiosInstance.get('/api/dashboard/');
      setRecentApplications(dashRes.data.recentApplications || []);
      setStats(dashRes.data.stats || []);
    } catch { /* silent — error handled by UI */ }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><LoadingSpinner size="lg" /></div>;
  if (error)   return <div className="text-center py-16 text-red-600">{error}</div>;

  const landlordActions = [
    { label: t('add_property'),    icon: Plus,      color: '#d4a96a', fn: () => navigate('/add-property') },
    { label: t('manage_listings'), icon: List,      color: '#c4a882', fn: () => navigate('/manage-listings') },
    { label: t('view_reports'),    icon: BarChart2, color: '#a8895f', fn: () => navigate('/reports') },
    { label: t('contact'),         icon: Mail,      color: '#9c9080', fn: () => navigate('/contact') },
    { label: 'Lehae Support',      icon: LifeBuoy,  color: '#3b82f6', fn: () => navigate('/profile') },
  ];

  const pendingApps = recentApplications.filter(a => a.status === 'pending');

  return (
    <div className="min-h-screen bg-neutral-50">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@400;500&display=swap');
        .dash-section-title { font-family:'Playfair Display',serif; font-size:18px; font-weight:700; color:#1c1a17; }
        .dash-card { background:#fff; border:1px solid #ede8e0; border-radius:16px; }
        .dash-stat-value { font-family:'Playfair Display',serif; font-size:32px; font-weight:700; color:#1c1a17; line-height:1; }
        .dash-stat-label { font-size:12px; font-weight:500; color:#9c9080; text-transform:uppercase; letter-spacing:0.06em; margin-top:6px; }
        .dash-action-btn { display:flex; flex-direction:column; align-items:flex-start; gap:10px; padding:20px; background:#fff; border:1px solid #ede8e0; border-radius:16px; cursor:pointer; transition:all 0.18s; text-align:left; width:100%; }
        .dash-action-btn:hover { border-color:#c4a882; box-shadow:0 4px 20px rgba(0,0,0,0.07); transform:translateY(-2px); }
        .dash-msg-row { padding:14px 0; border-bottom:1px solid #f3ede6; display:flex; gap:14px; align-items:flex-start; }
        .dash-msg-row:last-child { border-bottom:none; }
        .dash-app-row { padding:12px 0; border-bottom:1px solid #f3ede6; display:flex; gap:12px; align-items:center; cursor:pointer; }
        .dash-stat-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:16px; margin-bottom:40px; }
        .dash-action-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:16px; }
        @media (min-width: 768px) {
          .dash-stat-grid { grid-template-columns:repeat(3,1fr); }
          .dash-action-grid { grid-template-columns:repeat(4,1fr); }
        }
        @media (min-width: 1024px) {
          .dash-stat-grid { grid-template-columns:repeat(4,1fr); }
        }
        .dash-app-row:last-child { border-bottom:none; }
        .dash-app-row:hover { background:rgba(250,247,243,0.6); border-radius:8px; }
      `}</style>

      {/* Header */}
      <div style={{ background:'#1c1a17', paddingTop:48, paddingBottom:48 }}>
        <div className="max-w-6xl mx-auto px-6">
          <p style={{ fontSize:12,fontWeight:600,letterSpacing:'0.1em',textTransform:'uppercase',color:'#d4a96a',marginBottom:8 }}>
            Welcome back
          </p>
          <h1 style={{ fontFamily:"'Playfair Display',serif",fontSize:'clamp(1.8rem,4vw,2.6rem)',fontWeight:700,color:'#fff' }}>
            {user?.name || user?.username || 'Dashboard'}
          </h1>
          <p style={{ fontSize:14,color:'rgba(255,255,255,0.45)',marginTop:6 }}>
            {user?.is_staff ? 'Admin account' : user?.is_landlord ? 'Landlord account' : 'Tenant account'}
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10">

        {/* Admin shortcut */}
        {user?.is_staff && (
          <motion.div initial={{ opacity:0,y:12 }} animate={{ opacity:1,y:0 }}
            style={{ background:'#1c1a17',borderRadius:16,padding:'20px 24px',marginBottom:24,display:'flex',alignItems:'center',justifyContent:'space-between',cursor:'pointer' }}
            onClick={() => navigate('/admin')}>
            <div>
              <p style={{ fontSize:11,fontWeight:600,letterSpacing:'0.08em',textTransform:'uppercase',color:'#d4a96a',marginBottom:4,fontFamily:"'DM Sans',sans-serif" }}>Admin access</p>
              <p style={{ fontSize:15,fontWeight:500,color:'#fff',fontFamily:"'DM Sans',sans-serif" }}>Open Admin Dashboard</p>
              <p style={{ fontSize:12,color:'rgba(255,255,255,0.4)',marginTop:2,fontFamily:"'DM Sans',sans-serif" }}>Manage users, approve listings, review verifications</p>
            </div>
            <ArrowRight size={20} style={{ color:'#d4a96a',flexShrink:0 }}/>
          </motion.div>
        )}

        {/* New applications banner for landlords */}
        {user?.is_landlord && pendingApps.length > 0 && (
          <motion.div initial={{ opacity:0,y:12 }} animate={{ opacity:1,y:0 }}
            style={{ background:'rgba(212,169,106,0.1)',border:'1px solid rgba(212,169,106,0.3)',borderRadius:14,padding:'14px 20px',marginBottom:20,display:'flex',alignItems:'center',justifyContent:'space-between',gap:12 }}>
            <div style={{ display:'flex',alignItems:'center',gap:10 }}>
              <FileText size={18} style={{ color:'#d4a96a',flexShrink:0 }}/>
              <div>
                <p style={{ fontSize:13,fontWeight:600,color:'#1c1a17',fontFamily:"'DM Sans',sans-serif" }}>
                  {pendingApps.length} new rental application{pendingApps.length > 1 ? 's' : ''} waiting for review
                </p>
                <p style={{ fontSize:11,color:'#9c9080',fontFamily:"'DM Sans',sans-serif" }}>
                  Review applications below — accept, decline or mark as reviewing
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Stat cards */}
        {stats.length > 0 && (
          <div className="dash-stat-grid">
            {stats.map((stat, i) => (
              <motion.div key={stat.id} className="dash-card p-6"
                initial={{ opacity:0,y:16 }} animate={{ opacity:1,y:0 }} transition={{ delay:i*0.08 }}>
                <div className="dash-stat-value">{stat.value}</div>
                <div className="dash-stat-label">{t(stat.label.toLowerCase())}</div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Tenant quick actions */}
        {!user?.is_landlord && !user?.is_staff && (
          <div className="mb-10">
            <p className="dash-section-title mb-5">Quick Actions</p>
            <div className="dash-action-grid">
              {[
                { label:'Browse Properties', icon:Home,     color:'#d4a96a', fn:()=>navigate('/properties') },
                { label:'My Applications',   icon:FileText, color:'#c4a882', fn:()=>navigate('/my-applications') },
                { label:'Saved Searches',    icon:ShieldCheck,color:'#a8895f',fn:()=>navigate('/saved-searches') },
                { label:'Favourites',        icon:MessageCircle,color:'#9c9080',fn:()=>navigate('/favorites') },
              ].map(({ label, icon: Icon, color, fn }, i) => (
                <motion.button key={label} className="dash-action-btn" onClick={fn}
                  initial={{ opacity:0,y:12 }} animate={{ opacity:1,y:0 }} transition={{ delay:i*0.07 }}>
                  <div style={{ width:38,height:38,borderRadius:10,background:`${color}18`,display:'flex',alignItems:'center',justifyContent:'center' }}>
                    <Icon size={17} style={{ color }}/>
                  </div>
                  <span style={{ fontSize:13,fontWeight:500,color:'#1c1a17' }}>{label}</span>
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* Landlord quick actions */}
        {user?.is_landlord && (
          <div className="mb-10">
            <p className="dash-section-title mb-5">Quick Actions</p>
            <div className="dash-action-grid">
              {landlordActions.map(({ label, icon: Icon, color, fn }, i) => (
                <motion.button key={label} className="dash-action-btn" onClick={fn}
                  initial={{ opacity:0,y:12 }} animate={{ opacity:1,y:0 }} transition={{ delay:i*0.07 }}>
                  <div style={{ width:38,height:38,borderRadius:10,background:`${color}18`,display:'flex',alignItems:'center',justifyContent:'center' }}>
                    <Icon size={17} style={{ color }}/>
                  </div>
                  <span style={{ fontSize:13,fontWeight:500,color:'#1c1a17' }}>{label}</span>
                </motion.button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Rental applications — landlords and tenants */}
          {recentApplications.length > 0 && (
            <div className="dash-card p-6">
              <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20 }}>
                <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                  <FileText size={18} style={{ color:'#d4a96a' }}/>
                  <span className="dash-section-title">
                    {user?.is_landlord ? 'Rental Applications' : 'My Applications'}
                  </span>
                </div>
                {user?.is_landlord && (
                  <button onClick={() => navigate('/manage-listings')}
                    style={{ display:'flex',alignItems:'center',gap:4,fontSize:12,color:'#c4a882',background:'none',border:'none',cursor:'pointer',fontFamily:"'DM Sans',sans-serif" }}>
                    Manage <ArrowRight size={13}/>
                  </button>
                )}
              </div>
              {recentApplications.slice(0, 5).map(app => {
                const sc = STATUS_COLORS[app.status] || STATUS_COLORS.pending;
                return (
                  <div key={app.id} style={{ padding:'12px 0',borderBottom:'1px solid #f3ede6' }}>
                    <div style={{ display:'flex',alignItems:'flex-start',gap:10,flexWrap:'wrap' }}>
                      <div style={{ width:34,height:34,borderRadius:10,background:'#faf7f3',border:'1px solid #ede8e0',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                        <FileText size={14} style={{ color:'#c4a882' }}/>
                      </div>
                      <div style={{ flex:1,minWidth:0 }}>
                        <div style={{ display:'flex',alignItems:'center',gap:8,flexWrap:'wrap',marginBottom:2 }}>
                          <p style={{ fontSize:13,fontWeight:500,color:'#1c1a17',fontFamily:"'DM Sans',sans-serif" }}>{app.title}</p>
                          <span style={{ padding:'2px 9px',borderRadius:100,fontSize:10,fontWeight:600,background:sc.bg,color:sc.color,flexShrink:0,fontFamily:"'DM Sans',sans-serif" }}>
                            {app.status}
                          </span>
                        </div>
                        <p style={{ fontSize:11,color:'#9c9080',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontFamily:"'DM Sans',sans-serif" }}>{app.description}</p>
                        {/* Withdraw button for tenants */}
                        {!user?.is_landlord && app.status === 'pending' && (
                          <div style={{ display:'flex',gap:6,marginTop:8 }}>
                            <button onClick={() => handleWithdrawApplication(app.id)}
                              style={{ padding:'4px 10px',borderRadius:8,background:'#fef2f2',color:'#ef4444',border:'1px solid #fecaca',fontSize:11,fontWeight:500,cursor:'pointer',fontFamily:"'DM Sans',sans-serif" }}>
                              Withdraw
                            </button>
                          </div>
                        )}
                        {/* Action buttons for landlords on pending/reviewing apps */}
                        {user?.is_landlord && (app.status === 'pending' || app.status === 'reviewing') && (
                          <div style={{ display:'flex',gap:6,marginTop:8 }}>
                            {app.status === 'pending' && (
                              <button onClick={() => handleAppAction(app.id, 'reviewing')}
                                style={{ padding:'4px 10px',borderRadius:8,background:'rgba(59,130,246,0.1)',color:'#3b82f6',border:'1px solid rgba(59,130,246,0.2)',fontSize:11,fontWeight:500,cursor:'pointer',fontFamily:"'DM Sans',sans-serif" }}>
                                Mark Reviewing
                              </button>
                            )}
                            <button onClick={() => handleAppAction(app.id, 'approved')}
                              style={{ padding:'4px 10px',borderRadius:8,background:'rgba(34,197,94,0.1)',color:'#22c55e',border:'1px solid rgba(34,197,94,0.2)',fontSize:11,fontWeight:500,cursor:'pointer',fontFamily:"'DM Sans',sans-serif" }}>
                              Approve
                            </button>
                            <button onClick={() => handleAppAction(app.id, 'declined')}
                              style={{ padding:'4px 10px',borderRadius:8,background:'#fef2f2',color:'#ef4444',border:'1px solid #fecaca',fontSize:11,fontWeight:500,cursor:'pointer',fontFamily:"'DM Sans',sans-serif" }}>
                              Decline
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Tenant viewing requests */}
          {!user?.is_landlord && !user?.is_staff && tenantViewings.length > 0 && (
            <div className="dash-card p-6">
              <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20 }}>
                <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                  <Clock size={18} style={{ color:'#d4a96a' }}/>
                  <span className="dash-section-title">My Viewings</span>
                </div>
              </div>
              {tenantViewings.slice(0, 5).map(v => {
                const sc = { pending:'#f59e0b', accepted:'#22c55e', declined:'#ef4444', cancelled:'#9c9080' };
                return (
                  <div key={v.id} style={{ padding:'12px 0',borderBottom:'1px solid #f3ede6' }}>
                    <div style={{ display:'flex',alignItems:'flex-start',gap:10,flexWrap:'wrap' }}>
                      <div style={{ flex:1,minWidth:0 }}>
                        <div style={{ display:'flex',alignItems:'center',gap:8,flexWrap:'wrap',marginBottom:2 }}>
                          <p style={{ fontSize:13,fontWeight:500,color:'#1c1a17',fontFamily:"'DM Sans',sans-serif" }}>{v.property_title}</p>
                          <span style={{ padding:'2px 9px',borderRadius:100,fontSize:10,fontWeight:600,background:`${sc[v.status]||'#9c9080'}18`,color:sc[v.status]||'#9c9080',fontFamily:"'DM Sans',sans-serif" }}>
                            {v.status}
                          </span>
                        </div>
                        <p style={{ fontSize:11,color:'#9c9080',fontFamily:"'DM Sans',sans-serif" }}>
                          {v.proposed_date} at {v.proposed_time}
                          {v.landlord_note && ` · "${v.landlord_note}"`}
                        </p>
                        {v.status === 'pending' && (
                          <button onClick={() => handleCancelViewing(v.id)}
                            style={{ marginTop:6,padding:'3px 10px',borderRadius:8,background:'#fef2f2',color:'#ef4444',border:'1px solid #fecaca',fontSize:11,fontWeight:500,cursor:'pointer',fontFamily:"'DM Sans',sans-serif" }}>
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Unread messages */}
          <div className="dash-card p-6">
            <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20 }}>
              <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                <MessageCircle size={18} style={{ color:'#d4a96a' }}/>
                <span className="dash-section-title">{t('unread_messages')}</span>
              </div>
              <button onClick={() => navigate('/messages')}
                style={{ display:'flex',alignItems:'center',gap:4,fontSize:12,color:'#c4a882',background:'none',border:'none',cursor:'pointer',fontFamily:"'DM Sans',sans-serif" }}>
                {t('view_all')} <ArrowRight size={13}/>
              </button>
            </div>
            {recentMessages.length === 0 ? (
              <p style={{ fontSize:13,color:'#b5a898',textAlign:'center',padding:'20px 0' }}>{t('no_unread_messages')}</p>
            ) : (
              recentMessages.map(msg => (
                <div key={msg.id} className="dash-msg-row">
                  <div style={{ width:34,height:34,borderRadius:'50%',background:'#faf7f3',border:'1px solid #ede8e0',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontWeight:600,fontSize:13,color:'#7a7060',fontFamily:"'DM Sans',sans-serif" }}>
                    {(msg.sender_username||'?')[0].toUpperCase()}
                  </div>
                  <div style={{ flex:1,minWidth:0 }}>
                    <p style={{ fontSize:13,fontWeight:500,color:'#1c1a17',marginBottom:2 }}>{msg.sender_username}</p>
                    <p style={{ fontSize:12,color:'#9c9080',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{msg.content}</p>
                    {msg.property_title && <p style={{ fontSize:11,color:'#c4bdb4',marginTop:2 }}>Re: {msg.property_title}</p>}
                  </div>
                  <p style={{ fontSize:11,color:'#c4bdb4',flexShrink:0 }}>{new Date(msg.created_at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</p>
                </div>
              ))
            )}
          </div>

          {/* Recent activity */}
          {recentActivity.length > 0 && (
            <div className="dash-card p-6">
              <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:20 }}>
                <Clock size={18} style={{ color:'#d4a96a' }}/>
                <span className="dash-section-title">{t('recent_activity')}</span>
              </div>
              {recentActivity.map(activity => (
                <div key={activity.id} style={{ padding:'12px 0',borderBottom:'1px solid #f3ede6',display:'flex',gap:12,alignItems:'center' }}>
                  <div style={{ width:34,height:34,borderRadius:10,background:'#faf7f3',border:'1px solid #ede8e0',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                    <Home size={15} style={{ color:'#c4a882' }}/>
                  </div>
                  <div style={{ flex:1,minWidth:0 }}>
                    <p style={{ fontSize:13,fontWeight:500,color:'#1c1a17' }}>{activity.title}</p>
                    <p style={{ fontSize:12,color:'#9c9080' }}>{activity.description}</p>
                  </div>
                  <p style={{ fontSize:11,color:'#c4bdb4',flexShrink:0 }}>{activity.time}</p>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Dashboard;