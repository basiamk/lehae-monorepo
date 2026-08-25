import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useLanguage } from '../contexts/LanguageContext';
import { motion } from 'framer-motion';
import axiosInstance from '../utils/axios.js';
import {
  Home, MessageSquare, Heart, FileText,
  Plus, AlertCircle, ChevronRight, Clock
} from 'lucide-react';

// Helper: handles both paginated {results:[]} and plain array
const extractList = (data) =>
  Array.isArray(data) ? data :
  (data && Array.isArray(data.results)) ? data.results : [];

const Dashboard = () => {
  const { t }    = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats,          setStats]          = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [recentMessages, setRecentMessages] = useState([]);
  const [recentApps,     setRecentApps]     = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState('');

  useEffect(() => {
    if (!user) return;
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError('');

        // FIX: use axiosInstance — not raw axios with hardcoded localhost:8000
        const dashboardRes = await axiosInstance.get('/api/dashboard/');
        setStats(dashboardRes.data.stats || []);
        setRecentActivity(dashboardRes.data.recentActivity || []);
        setRecentApps(dashboardRes.data.recentApplications || []);

        // FIX: messages now paginated — extract results array
        const messagesRes = await axiosInstance.get('/api/messages/');
        const messagesList = extractList(messagesRes.data);
        const unread = messagesList
          .filter(msg => !msg.is_read && msg.receiver_username === user?.username)
          .slice(0, 5);
        setRecentMessages(unread);

      } catch (err) {
        console.error('Dashboard Error:', err);
        setError(t('failed_to_load_dashboard') || 'Failed to load dashboard.');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [user]);

  const isLandlord = user?.is_landlord || user?.is_staff;

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', flexDirection:'column', gap:16 }}>
      <div style={{ width:40, height:40, border:'3px solid #ede8e0', borderTopColor:'#d4a96a', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
      <p style={{ color:'#9c9080', fontFamily:"'DM Sans',sans-serif", fontSize:14 }}>Loading your dashboard…</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (error) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', flexDirection:'column', gap:12, padding:'0 24px' }}>
      <AlertCircle size={40} style={{ color:'#dc2626' }}/>
      <p style={{ color:'#dc2626', fontFamily:"'DM Sans',sans-serif", fontSize:15, fontWeight:500, textAlign:'center' }}>{error}</p>
      <button onClick={() => window.location.reload()}
        style={{ padding:'10px 20px', borderRadius:10, background:'#1c1a17', color:'#fff', border:'none', cursor:'pointer', fontFamily:"'DM Sans',sans-serif", fontSize:13 }}>
        Try again
      </button>
    </div>
  );

  const statusColor = (s) => ({
    pending:   { bg:'rgba(245,158,11,0.1)',  color:'#d97706' },
    reviewing: { bg:'rgba(59,130,246,0.1)',  color:'#2563eb' },
    approved:  { bg:'rgba(34,197,94,0.1)',   color:'#16a34a' },
    declined:  { bg:'rgba(239,68,68,0.1)',   color:'#dc2626' },
    cancelled: { bg:'rgba(148,163,184,0.1)', color:'#64748b' },
  }[s] || { bg:'#f3f4f6', color:'#6b7280' });

  const landlordActions = [
    { label:'Add Property',    icon:Plus,         path:'/add-property',    color:'#d4a96a' },
    { label:'Manage Listings', icon:Home,         path:'/manage-listings', color:'#c4a882' },
    { label:'Applications',    icon:FileText,     path:'/applications',    color:'#f59e0b' },
    { label:'Messages',        icon:MessageSquare,path:'/messages',        color:'#8b5cf6' },
  ];
  const tenantActions = [
    { label:'Browse Properties', icon:Home,         path:'/properties',      color:'#d4a96a' },
    { label:'My Favourites',     icon:Heart,        path:'/favorites',       color:'#ef4444' },
    { label:'My Applications',   icon:FileText,     path:'/my-applications', color:'#f59e0b' },
    { label:'Messages',          icon:MessageSquare,path:'/messages',        color:'#8b5cf6' },
  ];

  return (
    <div style={{ minHeight:'100vh', background:'#faf7f3', fontFamily:"'DM Sans',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@400;500&display=swap');
        .dash-stat-grid   { display:grid; grid-template-columns:repeat(2,1fr); gap:16px; margin-bottom:32px; }
        .dash-action-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:12px; margin-bottom:32px; }
        @media(min-width:640px)  { .dash-action-grid { grid-template-columns:repeat(3,1fr); } }
        @media(min-width:768px)  { .dash-stat-grid { grid-template-columns:repeat(4,1fr); } .dash-action-grid { grid-template-columns:repeat(4,1fr); } }
        .dash-action-btn { display:flex; align-items:center; gap:10px; padding:14px 16px; background:#fff; border:1px solid #ede8e0; border-radius:14px; cursor:pointer; text-align:left; transition:border-color 0.15s; width:100%; }
        .dash-action-btn:hover { border-color:#d4a96a; }
      `}</style>

      {/* Header */}
      <div style={{ background:'#1c1a17', padding:'48px 0' }}>
        <div className="max-w-6xl mx-auto px-6">
          <p style={{ fontSize:11, fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', color:'#d4a96a', marginBottom:6 }}>
            {isLandlord ? 'Landlord' : 'Tenant'} Dashboard
          </p>
          <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:'clamp(1.6rem,3vw,2.2rem)', fontWeight:700, color:'#fff' }}>
            Welcome back{user?.username ? `, ${user.username}` : ''}
          </h1>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* Stat cards */}
        <div className="dash-stat-grid">
          {stats.map((stat, i) => (
            <motion.div key={stat.id || i}
              style={{ background:'#fff', border:'1px solid #ede8e0', borderRadius:16, padding:'20px 18px' }}
              initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay: i * 0.05 }}>
              <p style={{ fontSize:10.5, fontWeight:600, letterSpacing:'0.07em', textTransform:'uppercase', color:'#9c9080', marginBottom:10 }}>
                {stat.label}
              </p>
              <p style={{ fontFamily:"'Playfair Display',serif", fontSize:32, fontWeight:700, color:'#1c1a17', lineHeight:1 }}>
                {stat.value}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Quick actions */}
        <p style={{ fontSize:11, fontWeight:600, letterSpacing:'0.07em', textTransform:'uppercase', color:'#9c9080', marginBottom:12 }}>Quick actions</p>
        <div className="dash-action-grid">
          {(isLandlord ? landlordActions : tenantActions).map(({ label, icon:Icon, path, color }) => (
            <button key={label} className="dash-action-btn" onClick={() => navigate(path)}>
              <div style={{ width:36, height:36, borderRadius:10, background:`${color}18`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <Icon size={16} style={{ color }}/>
              </div>
              <span style={{ fontSize:13, fontWeight:500, color:'#1c1a17' }}>{label}</span>
            </button>
          ))}
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr', gap:20 }}>

          {/* Recent applications — landlords only */}
          {isLandlord && recentApps.length > 0 && (
            <div style={{ background:'#fff', border:'1px solid #ede8e0', borderRadius:20, padding:24 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
                <p style={{ fontFamily:"'Playfair Display',serif", fontSize:17, fontWeight:700, color:'#1c1a17', margin:0 }}>Recent Applications</p>
                <button onClick={() => navigate('/applications')}
                  style={{ display:'flex', alignItems:'center', gap:4, fontSize:12, color:'#d4a96a', background:'none', border:'none', cursor:'pointer', fontWeight:500 }}>
                  View all <ChevronRight size={13}/>
                </button>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {recentApps.map(app => {
                  const sc = statusColor(app.status);
                  return (
                    <div key={app.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 14px', background:'#faf7f3', borderRadius:12, border:'1px solid #ede8e0' }}>
                      <div style={{ minWidth:0 }}>
                        <p style={{ fontSize:13, fontWeight:500, color:'#1c1a17', margin:0 }}>{app.title}</p>
                        <p style={{ fontSize:11, color:'#9c9080', margin:'2px 0 0', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{app.description}</p>
                      </div>
                      <span style={{ padding:'3px 10px', borderRadius:100, fontSize:11, fontWeight:500, background:sc.bg, color:sc.color, flexShrink:0, marginLeft:10 }}>
                        {app.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Unread messages */}
          <div style={{ background:'#fff', border:'1px solid #ede8e0', borderRadius:20, padding:24 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
              <p style={{ fontFamily:"'Playfair Display',serif", fontSize:17, fontWeight:700, color:'#1c1a17', margin:0 }}>Unread Messages</p>
              <button onClick={() => navigate('/messages')}
                style={{ display:'flex', alignItems:'center', gap:4, fontSize:12, color:'#d4a96a', background:'none', border:'none', cursor:'pointer', fontWeight:500 }}>
                View all <ChevronRight size={13}/>
              </button>
            </div>
            {recentMessages.length === 0 ? (
              <p style={{ fontSize:13, color:'#9c9080' }}>No unread messages.</p>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {recentMessages.map(msg => (
                  <div key={msg.id} onClick={() => navigate('/messages')}
                    style={{ padding:'12px 14px', background:'#faf7f3', borderRadius:12, border:'1px solid #ede8e0', cursor:'pointer' }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
                      <p style={{ fontSize:13, fontWeight:500, color:'#1c1a17', margin:0 }}>{msg.sender_username}</p>
                      <p style={{ fontSize:11, color:'#9c9080', margin:0 }}>{new Date(msg.created_at).toLocaleDateString()}</p>
                    </div>
                    <p style={{ fontSize:12, color:'#7a7060', margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{msg.content}</p>
                    {msg.property_title && <p style={{ fontSize:11, color:'#d4a96a', margin:'4px 0 0' }}>Re: {msg.property_title}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent activity */}
          {recentActivity.length > 0 && (
            <div style={{ background:'#fff', border:'1px solid #ede8e0', borderRadius:20, padding:24 }}>
              <p style={{ fontFamily:"'Playfair Display',serif", fontSize:17, fontWeight:700, color:'#1c1a17', marginBottom:16 }}>Recent Activity</p>
              <div style={{ display:'flex', flexDirection:'column' }}>
                {recentActivity.map((activity, i) => (
                  <div key={activity.id} style={{ display:'flex', alignItems:'flex-start', gap:12, padding:'10px 0', borderBottom: i < recentActivity.length-1 ? '1px solid #f5f0e8' : 'none' }}>
                    <div style={{ width:32, height:32, borderRadius:'50%', background:'#faf7f3', border:'1px solid #ede8e0', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <Clock size={13} style={{ color:'#9c9080' }}/>
                    </div>
                    <div>
                      <p style={{ fontSize:13, fontWeight:500, color:'#1c1a17', margin:0 }}>{activity.title}</p>
                      <p style={{ fontSize:12, color:'#9c9080', margin:'2px 0 0' }}>{activity.description}</p>
                      <p style={{ fontSize:11, color:'#c4bdb4', margin:'3px 0 0' }}>{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Dashboard;
