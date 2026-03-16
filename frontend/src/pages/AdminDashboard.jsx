import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { propertyAPI, favoritesAPI } from '../lib/api.js';
import { motion } from 'framer-motion';
import { Users, Home, ShieldCheck, Trash2, Check, X, Clock, AlertCircle, Eye, Send } from 'lucide-react';
import axiosInstance from '../utils/axios.js';
import { useNavigate } from 'react-router-dom';

const TabBtn = ({ active, onClick, children }) => (
  <button onClick={onClick}
    style={{ padding:'9px 18px', borderRadius:10, border:'none', cursor:'pointer',
      fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:500, transition:'all 0.15s',
      background: active ? '#1c1a17' : 'transparent',
      color:      active ? '#fff'    : '#9c9080',
    }}>
    {children}
  </button>
);

const Badge = ({ count, color = '#f59e0b' }) => count > 0 ? (
  <span style={{ marginLeft:6, background:color, color:'#fff', borderRadius:100, fontSize:10, padding:'1px 6px' }}>
    {count}
  </span>
) : null;

const AdminDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate   = useNavigate();
  const isAdmin    = user?.is_staff === true;

  const [tab, setTab]                       = useState('properties');
  const [users, setUsers]                   = useState([]);
  const [properties, setProperties]         = useState([]);
  const [reports, setReports]               = useState({});
  const [verifications, setVerifications]   = useState([]);
  const [supportThreads, setSupportThreads] = useState([]);
  const [contactInbox, setContactInbox]     = useState([]);
  const [activeThread, setActiveThread]     = useState(null);
  const [selectedUser, setSelectedUser]     = useState(null);
  const [threadMessages, setThreadMessages] = useState([]);
  const [supportReply, setSupportReply]     = useState('');
  const [sendingReply, setSendingReply]     = useState(false);
  const [error, setError]                   = useState('');
  const [success, setSuccess]               = useState('');
  const [dataLoaded, setDataLoaded]         = useState(false);

  useEffect(() => {
    // Wait for auth to finish loading before checking isAdmin
    if (authLoading) return;
    if (!isAdmin) return;
    if (dataLoaded) return; // don't refetch if already loaded

    const fetchData = async () => {
      try {
        const [ud, pd, rd] = await Promise.all([
          favoritesAPI.getUsers(),
          propertyAPI.getProperties(),
          favoritesAPI.getReports(),
        ]);
        setUsers(ud);
        setProperties(pd);
        setReports(rd);
        try { const vr = await axiosInstance.get('/api/verification/admin/');   setVerifications(vr.data || []); } catch {}
        try { const sr = await axiosInstance.get('/api/support/');              setSupportThreads(Array.isArray(sr.data) ? sr.data : []); } catch {}
        try { const ci = await axiosInstance.get('/api/contact-inbox/');        setContactInbox(Array.isArray(ci.data) ? ci.data : []); } catch {}
        setDataLoaded(true);
      } catch (err) {
        setError('Failed to load dashboard data: ' + err.message);
      }
    };
    fetchData();
  }, [user, authLoading, isAdmin]);

  const notify = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3000); };

  const handleApproveProperty = async (id) => {
    try {
      await propertyAPI.updateProperty(id, { is_approved: true });
      setProperties(prev => prev.map(p => p.id === id ? { ...p, is_approved: true } : p));
      notify('Property approved.');
    } catch { setError('Failed to approve property.'); }
  };

  const handleHideProperty = async (id) => {
    try {
      await propertyAPI.updateProperty(id, { is_approved: false });
      setProperties(prev => prev.map(p => p.id === id ? { ...p, is_approved: false } : p));
      notify('Property hidden from tenants.');
    } catch { setError('Failed to hide property.'); }
  };

  const handleDeleteProperty = async (id, area) => {
    if (!window.confirm(`Permanently delete "${area}"? This cannot be undone.`)) return;
    try {
      await axiosInstance.delete(`/api/properties/${id}/`);
      setProperties(prev => prev.filter(p => p.id !== id));
      notify('Property deleted.');
    } catch { setError('Failed to delete property.'); }
  };

  const handleVerifyUser = async (id) => {
    try {
      await favoritesAPI.verifyUser(id);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, profile: { ...u.profile, is_verified: true } } : u));
      notify('User verified.');
    } catch { setError('Failed to verify user.'); }
  };

  const handleBanUser = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await favoritesAPI.banUser(id);
      setUsers(prev => prev.filter(u => u.id !== id));
      notify('User removed.');
    } catch { setError('Failed to remove user.'); }
  };

  const handleVerification = async (id, newStatus) => {
    try {
      await axiosInstance.patch(`/api/verification/admin/${id}/`, { status: newStatus });
      setVerifications(prev => prev.map(v => v.id === id ? { ...v, status: newStatus } : v));
      notify(`Verification ${newStatus}.`);
    } catch { setError('Failed to update verification.'); }
  };

  const fetchUserProfile = async (userId) => {
    try {
      const res = await axiosInstance.get(`/api/users/${userId}/profile/`);
      setSelectedUser(res.data);
    } catch { setError('Failed to load user profile.'); }
  };

  const openThread = async (landlordId) => {
    setActiveThread(landlordId);
    try {
      const res = await axiosInstance.get(`/api/support/${landlordId}/`);
      setThreadMessages(Array.isArray(res.data) ? res.data : []);
      const sr = await axiosInstance.get('/api/support/');
      setSupportThreads(Array.isArray(sr.data) ? sr.data : []);
    } catch {}
  };

  const sendReply = async () => {
    if (!supportReply.trim() || sendingReply || !activeThread) return;
    setSendingReply(true);
    try {
      const res = await axiosInstance.post(`/api/support/${activeThread}/`, { content: supportReply.trim() });
      setThreadMessages(prev => [...prev, res.data]);
      setSupportReply('');
    } catch { setError('Failed to send reply.'); }
    finally { setSendingReply(false); }
  };

  // Show loading spinner while auth is resolving
  if (authLoading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <p style={{ color:'#9c9080', fontFamily:"'DM Sans',sans-serif" }}>Loading…</p>
    </div>
  );

  if (!isAdmin) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:48, marginBottom:16 }}>🔒</div>
        <p style={{ fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:700, color:'#1c1a17' }}>Access Denied</p>
        <p style={{ fontSize:14, color:'#9c9080', marginTop:8 }}>Admin accounts only.</p>
      </div>
    </div>
  );

  const pendingProperties    = properties.filter(p => !p.is_approved);
  const pendingVerifications = verifications.filter(v => v.status === 'pending');
  const unreadSupport        = supportThreads.reduce((s, t) => s + (t.unread_count || 0), 0);

  return (
    <div className="page-enter min-h-screen bg-neutral-50">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@400;500&display=swap');
        .ad-action { display:inline-flex; align-items:center; gap:5px; padding:5px 12px; border-radius:8px; border:none; cursor:pointer; font-size:12px; font-weight:500; font-family:'DM Sans',sans-serif; transition:all 0.15s; }
      `}</style>

      <div style={{ background:'#1c1a17', paddingTop:48, paddingBottom:48 }}>
        <div className="max-w-6xl mx-auto px-6">
          <p style={{ fontSize:11,fontWeight:600,letterSpacing:'0.1em',textTransform:'uppercase',color:'#d4a96a',marginBottom:8 }}>Admin</p>
          <h1 style={{ fontFamily:"'Playfair Display',serif",fontSize:'clamp(1.6rem,3vw,2.2rem)',fontWeight:700,color:'#fff' }}>Dashboard</h1>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">

        {success && <div style={{ marginBottom:14,padding:'12px 16px',borderRadius:11,background:'#f0fdf4',border:'1px solid #86efac',color:'#16a34a',fontSize:13,fontFamily:"'DM Sans',sans-serif",display:'flex',alignItems:'center',gap:7 }}><Check size={14}/>{success}</div>}
        {error   && <div style={{ marginBottom:14,padding:'12px 16px',borderRadius:11,background:'#fef2f2',border:'1px solid #fecaca',color:'#dc2626',fontSize:13,fontFamily:"'DM Sans',sans-serif",display:'flex',alignItems:'center',gap:7 }}><AlertCircle size={14}/>{error}<button onClick={()=>setError('')} style={{marginLeft:'auto',background:'none',border:'none',cursor:'pointer',color:'#dc2626'}}><X size={13}/></button></div>}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon:Home,        label:'Total Properties',  value:properties.length,           color:'#d4a96a' },
            { icon:Users,       label:'Total Users',        value:users.length,                color:'#c4a882' },
            { icon:Clock,       label:'Pending Approvals',  value:pendingProperties.length,    color:'#f59e0b' },
            { icon:ShieldCheck, label:'Pending Verifs',     value:pendingVerifications.length, color:'#22c55e' },
          ].map(({ icon:Icon, label, value, color }) => (
            <motion.div key={label} style={{ background:'#fff',border:'1px solid #ede8e0',borderRadius:16,padding:20 }}
              initial={{ opacity:0,y:12 }} animate={{ opacity:1,y:0 }}>
              <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:10 }}>
                <div style={{ width:34,height:34,borderRadius:9,background:`${color}18`,display:'flex',alignItems:'center',justifyContent:'center' }}>
                  <Icon size={15} style={{ color }}/>
                </div>
                <span style={{ fontSize:10.5,fontWeight:600,letterSpacing:'0.07em',textTransform:'uppercase',color:'#9c9080',fontFamily:"'DM Sans',sans-serif" }}>{label}</span>
              </div>
              <div style={{ fontFamily:"'Playfair Display',serif",fontSize:30,fontWeight:700,color:'#1c1a17',lineHeight:1 }}>{value}</div>
            </motion.div>
          ))}
        </div>

        <div style={{ display:'flex',flexWrap:'wrap',gap:4,background:'#faf7f3',borderRadius:12,padding:4,marginBottom:20,width:'fit-content',border:'1px solid #ede8e0' }}>
          <TabBtn active={tab==='properties'}    onClick={()=>setTab('properties')}>Properties <Badge count={pendingProperties.length}/></TabBtn>
          <TabBtn active={tab==='users'}         onClick={()=>setTab('users')}>Users</TabBtn>
          <TabBtn active={tab==='verifications'} onClick={()=>setTab('verifications')}><Badge count={pendingVerifications.length} color="#22c55e"/>Verifications</TabBtn>
          <TabBtn active={tab==='reports'}       onClick={()=>setTab('reports')}>Reports</TabBtn>
          <TabBtn active={tab==='support'}       onClick={()=>setTab('support')}>Support <Badge count={unreadSupport} color="#ef4444"/></TabBtn>
          <TabBtn active={tab==='contact-inbox'} onClick={()=>setTab('contact-inbox')}>Contact <Badge count={contactInbox.length} color="#9c9080"/></TabBtn>
        </div>

        <div style={{ background:'#fff',border:'1px solid #ede8e0',borderRadius:20,padding:28 }}>

          {tab === 'properties' && (
            <>
              <p style={{ fontFamily:"'Playfair Display',serif",fontSize:17,fontWeight:700,color:'#1c1a17',marginBottom:12 }}>All Properties</p>
              <div style={{ background:'rgba(212,169,106,0.08)',border:'1px solid rgba(212,169,106,0.2)',borderRadius:10,padding:'10px 14px',marginBottom:20,fontSize:12,color:'#7a7060',fontFamily:"'DM Sans',sans-serif",lineHeight:1.6 }}>
                <strong style={{color:'#a8895f'}}>What you're approving:</strong> That this listing is genuine — real photos, plausible price, legitimate description. No ownership documents required from landlords.
              </div>
              {properties.length === 0 ? <p style={{ color:'#9c9080',fontSize:13 }}>No properties yet.</p> : (
                <table style={{ width:"100%", borderCollapse:"collapse", fontFamily:"'DM Sans',sans-serif", fontSize:13.5 }}>
                  <thead><tr>{["Property","Landlord","Status","Approved","Actions"].map(h=><th key={h} style={{textAlign:"left",fontSize:10.5,fontWeight:600,letterSpacing:"0.07em",textTransform:"uppercase",color:"#9c9080",padding:"0 0 12px",borderBottom:"1px solid #f3ede6"}}>{h}</th>)}</tr></thead>
                  <tbody>
                    {properties.map((p,i) => (
                      <tr key={p.id} style={{borderBottom: i < properties.length-1 ? "1px solid #f5f0e8" : "none"}}>
                        <td><div style={{ fontWeight:500 }}>{p.area}</div><div style={{ fontSize:11,color:'#9c9080' }}>{p.district}</div></td>
                        <td style={{padding:"12px 8px 12px 0",color:"#7a7060",verticalAlign:"middle",fontSize:13}}>{p.landlord_username}</td>
                        <td><span style={{ padding:"3px 10px",borderRadius:100,fontSize:11,fontWeight:500, background:p.status==='vacant'?'rgba(34,197,94,0.1)':'rgba(239,68,68,0.1)', color:p.status==='vacant'?'#22c55e':'#ef4444' }}>{p.status}</span></td>
                        <td><span style={{ padding:"3px 10px",borderRadius:100,fontSize:11,fontWeight:500, background:p.is_approved?'rgba(34,197,94,0.1)':'rgba(245,158,11,0.1)', color:p.is_approved?'#22c55e':'#f59e0b' }}>{p.is_approved ? 'Approved' : 'Pending'}</span></td>
                        <td>
                          <div style={{ display:'flex',gap:6,paddingTop:4 }}>
                            <button className="ad-action" style={{ background:'#faf7f3',color:'#5a5248',border:'1px solid #ede8e0' }} onClick={()=>navigate(`/properties/${p.id}`)}><Eye size={12}/>View</button>
                            {!p.is_approved
                              ? <button className="ad-action" style={{ background:'rgba(34,197,94,0.1)',color:'#22c55e',border:'1px solid rgba(34,197,94,0.2)' }} onClick={()=>handleApproveProperty(p.id)}><Check size={12}/>Approve</button>
                              : <button className="ad-action" style={{ background:'rgba(245,158,11,0.08)',color:'#f59e0b',border:'1px solid rgba(245,158,11,0.25)' }} onClick={()=>handleHideProperty(p.id)}><X size={12}/>Hide</button>
                            }
                            <button className="ad-action" style={{ background:'#fef2f2',color:'#dc2626',border:'1px solid #fecaca' }} onClick={()=>handleDeleteProperty(p.id, p.area)}><Trash2 size={12}/>Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}

          {tab === 'users' && (
            <>
              <p style={{ fontFamily:"'Playfair Display',serif",fontSize:17,fontWeight:700,color:'#1c1a17',marginBottom:20 }}>All Users</p>
              {users.length === 0 ? <p style={{ color:'#9c9080',fontSize:13 }}>No users yet.</p> : (
                <table style={{ width:"100%", borderCollapse:"collapse", fontFamily:"'DM Sans',sans-serif", fontSize:13.5 }}>
                  <thead><tr>{["User","Role","Verified","Actions"].map(h=><th key={h} style={{textAlign:"left",fontSize:10.5,fontWeight:600,letterSpacing:"0.07em",textTransform:"uppercase",color:"#9c9080",padding:"0 0 12px",borderBottom:"1px solid #f3ede6"}}>{h}</th>)}</tr></thead>
                  <tbody>
                    {users.map((u,i) => (
                      <tr key={u.id} style={{borderBottom: i < users.length-1 ? "1px solid #f5f0e8" : "none"}}>
                        <td>
                          <div style={{ display:'flex',alignItems:'center',gap:10 }}>
                            <div style={{ width:30,height:30,borderRadius:'50%',background:'linear-gradient(135deg,#d4a96a,#c4a882)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,color:'#fff',flexShrink:0 }}>
                              {u.username[0].toUpperCase()}
                            </div>
                            <div><div style={{ fontWeight:500 }}>{u.username}</div><div style={{ fontSize:11,color:'#9c9080' }}>{u.email}</div></div>
                          </div>
                        </td>
                        <td><span style={{ padding:"3px 10px",borderRadius:100,fontSize:11,fontWeight:500, background:u.profile?.is_landlord?'rgba(196,168,130,0.15)':'rgba(148,163,184,0.15)', color:u.profile?.is_landlord?'#a8895f':'#64748b' }}>{u.profile?.is_landlord ? 'Landlord' : 'Tenant'}</span></td>
                        <td><span style={{ padding:"3px 10px",borderRadius:100,fontSize:11,fontWeight:500, background:u.profile?.is_verified?'rgba(34,197,94,0.1)':'rgba(239,68,68,0.1)', color:u.profile?.is_verified?'#22c55e':'#ef4444' }}>{u.profile?.is_verified ? 'Verified' : 'Unverified'}</span></td>
                        <td>
                          <div style={{ display:'flex',gap:6,paddingTop:4 }}>
                            <button className="ad-action" style={{ background:'#faf7f3',color:'#5a5248',border:'1px solid #ede8e0' }} onClick={()=>fetchUserProfile(u.id)}><Eye size={12}/>View</button>
                            {!u.profile?.is_verified && <button className="ad-action" style={{ background:'rgba(34,197,94,0.1)',color:'#22c55e',border:'1px solid rgba(34,197,94,0.2)' }} onClick={()=>handleVerifyUser(u.id)}><Check size={12}/>Verify</button>}
                            <button className="ad-action" style={{ background:'#fef2f2',color:'#dc2626',border:'1px solid #fecaca' }} onClick={()=>handleBanUser(u.id)}><Trash2 size={12}/>Remove</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}

          {tab === 'verifications' && (
            <>
              <p style={{ fontFamily:"'Playfair Display',serif",fontSize:17,fontWeight:700,color:'#1c1a17',marginBottom:12 }}>Landlord Identity Verifications</p>
              <div style={{ background:'rgba(212,169,106,0.08)',border:'1px solid rgba(212,169,106,0.2)',borderRadius:10,padding:'10px 14px',marginBottom:20,fontSize:12,color:'#7a7060',fontFamily:"'DM Sans',sans-serif",lineHeight:1.6 }}>
                <strong style={{color:'#a8895f'}}>What you're approving:</strong> That this is a real person with a valid ID — not that they own specific properties. Once approved, their verified badge applies to all their listings permanently.
              </div>
              {verifications.length === 0 ? <p style={{ color:'#9c9080',fontSize:13 }}>No verification requests yet.</p> : (
                <table style={{ width:"100%", borderCollapse:"collapse", fontFamily:"'DM Sans',sans-serif", fontSize:13.5 }}>
                  <thead><tr>{["Landlord","ID Number","Phone","ID Document","Status","Actions"].map(h=><th key={h} style={{textAlign:"left",fontSize:10.5,fontWeight:600,letterSpacing:"0.07em",textTransform:"uppercase",color:"#9c9080",padding:"0 0 12px",borderBottom:"1px solid #f3ede6"}}>{h}</th>)}</tr></thead>
                  <tbody>
                    {verifications.map((v,i) => (
                      <tr key={v.id} style={{borderBottom: i < verifications.length-1 ? "1px solid #f5f0e8" : "none"}}>
                        <td style={{ fontWeight:500 }}>{v.landlord_username}</td>
                        <td style={{ color:'#7a7060' }}>{v.national_id_number || '—'}</td>
                        <td style={{ color:'#7a7060' }}>{v.phone_number || '—'}</td>
                        <td>
                          {v.id_document_url
                            ? <a href={v.id_document_url} target="_blank" rel="noopener noreferrer" style={{ fontSize:12,color:'#3b82f6',textDecoration:'underline' }}>📄 View ID doc</a>
                            : <span style={{ fontSize:12,color:'#c4bdb4' }}>No document uploaded</span>}
                        </td>
                        <td><span style={{ padding:"3px 10px",borderRadius:100,fontSize:11,fontWeight:500, background:v.status==='approved'?'rgba(34,197,94,0.1)':v.status==='rejected'?'rgba(239,68,68,0.1)':'rgba(245,158,11,0.1)', color:v.status==='approved'?'#22c55e':v.status==='rejected'?'#ef4444':'#f59e0b' }}>{v.status}</span></td>
                        <td>
                          <div style={{ display:'flex',gap:6,paddingTop:4 }}>
                          {v.status === 'pending' && <>
                            <button className="ad-action" style={{ background:'rgba(34,197,94,0.1)',color:'#22c55e',border:'1px solid rgba(34,197,94,0.2)' }} onClick={()=>handleVerification(v.id,'approved')}><Check size={12}/>Approve</button>
                            <button className="ad-action" style={{ background:'#fef2f2',color:'#dc2626',border:'1px solid #fecaca' }} onClick={()=>handleVerification(v.id,'rejected')}><X size={12}/>Reject</button>
                          </>}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}

          {tab === 'reports' && (
            <>
              <p style={{ fontFamily:"'Playfair Display',serif",fontSize:17,fontWeight:700,color:'#1c1a17',marginBottom:20 }}>Platform Overview</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                {[
                  { label:'Total Properties', value:reports.total_properties || 0 },
                  { label:'Total Users',       value:reports.total_users       || 0 },
                  { label:'Vacant Now',        value:properties.filter(p=>p.status==='vacant').length },
                ].map(({ label, value }) => (
                  <div key={label} style={{ background:'#faf7f3',borderRadius:12,padding:18,border:'1px solid #ede8e0' }}>
                    <div style={{ fontSize:10.5,fontWeight:600,letterSpacing:'0.07em',textTransform:'uppercase',color:'#9c9080',marginBottom:8,fontFamily:"'DM Sans',sans-serif" }}>{label}</div>
                    <div style={{ fontFamily:"'Playfair Display',serif",fontSize:28,fontWeight:700,color:'#1c1a17' }}>{value}</div>
                  </div>
                ))}
              </div>
              {reports.most_viewed?.length > 0 && (
                <div>
                  <p style={{ fontFamily:"'Playfair Display',serif",fontSize:15,fontWeight:700,color:'#1c1a17',marginBottom:14 }}>Recently Updated Listings</p>
                  <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
                    {reports.most_viewed.map(p => (
                      <div key={p.id} style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 14px',borderRadius:10,background:'#faf7f3',border:'1px solid #ede8e0',cursor:'pointer',fontFamily:"'DM Sans',sans-serif" }} onClick={()=>navigate(`/properties/${p.id}`)}>
                        <span style={{ fontSize:13,fontWeight:500,color:'#1c1a17' }}>{p.area}, {p.district}</span>
                        <span style={{ fontSize:11,color:'#9c9080' }}>{new Date(p.updated_at).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {tab === 'support' && (
            <>
              <p style={{ fontFamily:"'Playfair Display',serif",fontSize:17,fontWeight:700,color:'#1c1a17',marginBottom:20 }}>Landlord Support Messages</p>
              <div style={{ display:'grid', gridTemplateColumns: activeThread ? '260px 1fr' : '1fr', gap:16, minHeight:320 }}>
                <div style={{ borderRight: activeThread ? '1px solid #f3ede6' : 'none', paddingRight: activeThread ? 16 : 0 }}>
                  {supportThreads.length === 0 ? (
                    <p style={{ fontSize:13,color:'#9c9080' }}>No support messages yet.</p>
                  ) : supportThreads.map(thread => (
                    <div key={thread.landlord_id} onClick={() => openThread(thread.landlord_id)}
                      style={{ padding:'12px 14px', borderRadius:10, cursor:'pointer', marginBottom:6,
                        background: activeThread === thread.landlord_id ? '#faf7f3' : 'transparent',
                        border:     activeThread === thread.landlord_id ? '1px solid #ede8e0' : '1px solid transparent',
                        transition: 'all 0.15s' }}>
                      <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:3 }}>
                        <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                          <div style={{ width:28,height:28,borderRadius:'50%',background:'linear-gradient(135deg,#d4a96a,#c4a882)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,color:'#fff',fontFamily:"'DM Sans',sans-serif",flexShrink:0 }}>
                            {(thread.landlord_username || '?')[0].toUpperCase()}
                          </div>
                          <span style={{ fontSize:13,fontWeight:500,color:'#1c1a17',fontFamily:"'DM Sans',sans-serif" }}>{thread.landlord_username}</span>
                        </div>
                        {thread.unread_count > 0 && (
                          <span style={{ minWidth:18,height:18,borderRadius:100,background:'#ef4444',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700,color:'#fff',fontFamily:"'DM Sans',sans-serif",padding:'0 5px' }}>
                            {thread.unread_count}
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize:11,color:'#9c9080',fontFamily:"'DM Sans',sans-serif",overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',margin:0 }}>
                        {thread.last_message}
                      </p>
                    </div>
                  ))}
                </div>
                {activeThread && (
                  <div style={{ display:'flex',flexDirection:'column',gap:0 }}>
                    <div style={{ maxHeight:340,overflowY:'auto',display:'flex',flexDirection:'column',gap:8,paddingBottom:12 }}>
                      {threadMessages.length === 0 && <p style={{ fontSize:13,color:'#9c9080',fontFamily:"'DM Sans',sans-serif",padding:'20px 0',textAlign:'center' }}>No messages in this thread yet.</p>}
                      {threadMessages.map(msg => {
                        const fromAdmin = msg.sender_username === user?.username;
                        return (
                          <div key={msg.id} style={{ display:'flex',justifyContent: fromAdmin ? 'flex-end' : 'flex-start' }}>
                            <div style={{
                              maxWidth:'78%', padding:'9px 13px',
                              borderRadius: fromAdmin ? '14px 4px 14px 14px' : '4px 14px 14px 14px',
                              background:   fromAdmin ? '#1c1a17' : '#faf7f3',
                              color:        fromAdmin ? '#fff' : '#1c1a17',
                              fontSize:13, lineHeight:1.6,
                              fontFamily:"'DM Sans',sans-serif",
                              border: fromAdmin ? 'none' : '1px solid #ede8e0',
                            }}>
                              {!fromAdmin && <p style={{ fontSize:10,fontWeight:600,color:'#d4a96a',marginBottom:3,textTransform:'uppercase',letterSpacing:'0.06em' }}>{msg.sender_username}</p>}
                              <p style={{ margin:0 }}>{msg.content}</p>
                              <p style={{ margin:'3px 0 0',fontSize:10,opacity:0.5 }}>
                                {new Date(msg.created_at).toLocaleString([],{ month:'short',day:'numeric',hour:'2-digit',minute:'2-digit' })}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div style={{ display:'flex',gap:8,borderTop:'1px solid #f3ede6',paddingTop:12 }}>
                      <input
                        value={supportReply}
                        onChange={e => setSupportReply(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply(); }}}
                        placeholder="Reply to landlord…"
                        style={{ flex:1,padding:'9px 13px',border:'1px solid #ede8e0',borderRadius:10,fontSize:13,fontFamily:"'DM Sans',sans-serif",color:'#1c1a17',outline:'none' }}
                      />
                      <button onClick={sendReply} disabled={sendingReply || !supportReply.trim()}
                        style={{ padding:'9px 16px',borderRadius:10,background:sendingReply||!supportReply.trim()?'#c4bdb4':'#1c1a17',color:'#fff',border:'none',fontSize:13,fontWeight:500,cursor:sendingReply||!supportReply.trim()?'not-allowed':'pointer',fontFamily:"'DM Sans',sans-serif",display:'flex',alignItems:'center',gap:6 }}>
                        <Send size={13}/>{sendingReply ? '…' : 'Send'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {tab === 'contact-inbox' && (
            <>
              <p style={{ fontFamily:"'Playfair Display',serif",fontSize:17,fontWeight:700,color:'#1c1a17',marginBottom:20 }}>Contact Form Inbox</p>
              {contactInbox.length === 0 ? (
                <p style={{ color:'#9c9080',fontSize:13 }}>No contact form messages yet.</p>
              ) : (
                <div style={{ display:'flex',flexDirection:'column',gap:12 }}>
                  {contactInbox.map(msg => (
                    <div key={msg.id} style={{ background:'#faf7f3',border:'1px solid #ede8e0',borderRadius:14,padding:'16px 20px' }}>
                      <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:10,flexWrap:'wrap',gap:8 }}>
                        <div>
                          <p style={{ fontSize:13,fontWeight:500,color:'#1c1a17',fontFamily:"'DM Sans',sans-serif",margin:0 }}>{msg.tenant_name}</p>
                          <a href={`mailto:${msg.tenant_email}`} style={{ fontSize:11,color:'#3b82f6',fontFamily:"'DM Sans',sans-serif",textDecoration:'none' }}>{msg.tenant_email}</a>
                        </div>
                        <div style={{ textAlign:'right' }}>
                          <p style={{ fontSize:11,color:'#9c9080',fontFamily:"'DM Sans',sans-serif",margin:0 }}>{new Date(msg.created_at).toLocaleDateString()}</p>
                          {msg.property && <p style={{ fontSize:11,color:'#d4a96a',fontFamily:"'DM Sans',sans-serif",margin:'2px 0 0' }}>Re: {msg.property.area}, {msg.property.district}</p>}
                        </div>
                      </div>
                      <p style={{ fontSize:13,color:'#5a5248',lineHeight:1.7,fontFamily:"'DM Sans',sans-serif",margin:0,whiteSpace:'pre-wrap' }}>{msg.message}</p>
                      <a href={`mailto:${msg.tenant_email}?subject=Re: Your Lehae enquiry`}
                        style={{ display:'inline-flex',alignItems:'center',gap:5,marginTop:10,padding:'6px 14px',borderRadius:9,background:'#1c1a17',color:'#fff',fontSize:12,fontWeight:500,textDecoration:'none',fontFamily:"'DM Sans',sans-serif" }}>
                        Reply via email →
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

        </div>
      </div>
      {selectedUser && <UserProfilePanel user={selectedUser} onClose={() => setSelectedUser(null)} />}
    </div>
  );
};

const UserProfilePanel = ({ user: u, onClose }) => {
  if (!u) return null;
  const sc = { approved:'#22c55e', pending:'#f59e0b', rejected:'#ef4444' };
  return (
    <div style={{ position:'fixed',inset:0,zIndex:200,display:'flex',alignItems:'flex-start',justifyContent:'flex-end' }} onClick={onClose}>
      <div style={{ width:'100%',maxWidth:420,height:'100vh',background:'#fff',borderLeft:'1px solid #ede8e0',overflowY:'auto',padding:28,fontFamily:"'DM Sans',sans-serif" }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:24 }}>
          <h2 style={{ fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:700,color:'#1c1a17' }}>User Profile</h2>
          <button onClick={onClose} style={{ background:'none',border:'none',cursor:'pointer',color:'#9c9080' }}><X size={18}/></button>
        </div>
        <div style={{ display:'flex',alignItems:'center',gap:14,marginBottom:24,paddingBottom:24,borderBottom:'1px solid #f3ede6' }}>
          <div style={{ width:52,height:52,borderRadius:'50%',background:'linear-gradient(135deg,#d4a96a,#c4a882)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,fontWeight:700,color:'#fff',flexShrink:0 }}>
            {(u.username||'?')[0].toUpperCase()}
          </div>
          <div>
            <p style={{ fontSize:16,fontWeight:600,color:'#1c1a17',margin:0 }}>{u.full_name || u.username}</p>
            <p style={{ fontSize:12,color:'#9c9080',margin:'2px 0 0' }}>@{u.username} · joined {new Date(u.date_joined).toLocaleDateString()}</p>
            <div style={{ display:'flex',gap:6,marginTop:6,flexWrap:'wrap' }}>
              <span style={{ padding:'2px 9px',borderRadius:100,fontSize:11,fontWeight:500,background:u.is_landlord?'rgba(196,168,130,0.15)':'rgba(148,163,184,0.15)',color:u.is_landlord?'#a8895f':'#64748b' }}>
                {u.is_landlord ? 'Landlord' : 'Tenant'}
              </span>
              {u.is_verified && <span style={{ padding:'2px 9px',borderRadius:100,fontSize:11,fontWeight:500,background:'rgba(34,197,94,0.1)',color:'#22c55e' }}>✓ Verified</span>}
              {u.is_staff && <span style={{ padding:'2px 9px',borderRadius:100,fontSize:11,fontWeight:500,background:'rgba(107,99,246,0.1)',color:'#6b63f6' }}>Admin</span>}
            </div>
          </div>
        </div>
        <div style={{ marginBottom:20 }}>
          <p style={{ fontSize:11,fontWeight:600,letterSpacing:'0.07em',textTransform:'uppercase',color:'#9c9080',marginBottom:10 }}>Contact</p>
          {[
            { label:'Email',  value: u.email    || '—' },
            { label:'Phone',  value: u.phone    || '—' },
            { label:'Name',   value: u.full_name || '—' },
          ].map(({ label, value }) => (
            <div key={label} style={{ display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid #f5f0e8',fontSize:13 }}>
              <span style={{ color:'#9c9080' }}>{label}</span>
              <span style={{ color:'#1c1a17',fontWeight:500,textAlign:'right',maxWidth:'60%',wordBreak:'break-word' }}>{value}</span>
            </div>
          ))}
          {u.bio && <p style={{ fontSize:13,color:'#7a7060',lineHeight:1.7,marginTop:12,padding:'10px 14px',background:'#faf7f3',borderRadius:10 }}>{u.bio}</p>}
        </div>
        {u.is_landlord && (
          <div style={{ marginBottom:20 }}>
            <p style={{ fontSize:11,fontWeight:600,letterSpacing:'0.07em',textTransform:'uppercase',color:'#9c9080',marginBottom:10 }}>Identity Verification</p>
            {!u.verification ? (
              <p style={{ fontSize:13,color:'#c4bdb4' }}>No verification submitted.</p>
            ) : (
              <div style={{ background:'#faf7f3',borderRadius:12,padding:'14px 16px',border:'1px solid #ede8e0' }}>
                <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10 }}>
                  <span style={{ fontSize:13,fontWeight:600,color:sc[u.verification.status]||'#9c9080' }}>
                    {u.verification.status.charAt(0).toUpperCase() + u.verification.status.slice(1)}
                  </span>
                  {u.verification.submitted_at && (
                    <span style={{ fontSize:11,color:'#9c9080' }}>{new Date(u.verification.submitted_at).toLocaleDateString()}</span>
                  )}
                </div>
                {[
                  { label:'ID Number',   value: u.verification.national_id_number || '—' },
                  { label:'Phone on ID', value: u.verification.phone_number || '—' },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display:'flex',justifyContent:'space-between',fontSize:12,padding:'5px 0',borderBottom:'1px solid #ede8e0' }}>
                    <span style={{ color:'#9c9080' }}>{label}</span>
                    <span style={{ color:'#1c1a17',fontWeight:500 }}>{value}</span>
                  </div>
                ))}
                {u.verification.id_document_url && (
                  <a href={u.verification.id_document_url} target="_blank" rel="noopener noreferrer"
                    style={{ display:'inline-flex',alignItems:'center',gap:5,marginTop:10,padding:'6px 12px',borderRadius:8,background:'#1c1a17',color:'#fff',fontSize:12,textDecoration:'none',fontWeight:500 }}>
                    📄 View ID Document
                  </a>
                )}
                {u.verification.admin_note && (
                  <p style={{ fontSize:12,color:'#7a7060',marginTop:8,fontStyle:'italic' }}>Note: {u.verification.admin_note}</p>
                )}
              </div>
            )}
          </div>
        )}
        {u.is_landlord && u.properties?.length > 0 && (
          <div style={{ marginBottom:20 }}>
            <p style={{ fontSize:11,fontWeight:600,letterSpacing:'0.07em',textTransform:'uppercase',color:'#9c9080',marginBottom:10 }}>Properties ({u.properties.length})</p>
            {u.properties.map(p => (
              <div key={p.id} style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'9px 0',borderBottom:'1px solid #f5f0e8',fontSize:13 }}>
                <div>
                  <span style={{ fontWeight:500,color:'#1c1a17' }}>{p.area}, {p.district}</span>
                  <span style={{ color:'#9c9080',fontSize:11,marginLeft:6 }}>M {Number(p.rental_amount).toLocaleString()}/mo</span>
                </div>
                <span style={{ padding:'2px 8px',borderRadius:100,fontSize:10,fontWeight:500,background:p.is_approved?'rgba(34,197,94,0.1)':'rgba(245,158,11,0.1)',color:p.is_approved?'#22c55e':'#f59e0b' }}>
                  {p.is_approved ? 'Live' : 'Pending'}
                </span>
              </div>
            ))}
          </div>
        )}
        {!u.is_landlord && (
          <div style={{ padding:'12px 16px',background:'#faf7f3',borderRadius:12,border:'1px solid #ede8e0',fontSize:13 }}>
            <span style={{ color:'#9c9080' }}>Rental applications submitted: </span>
            <span style={{ fontWeight:600,color:'#1c1a17' }}>{u.applications_count || 0}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;