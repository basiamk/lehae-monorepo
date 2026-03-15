import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axiosInstance from '../utils/axios.js';
import { FileText, ArrowRight, X, Check, Clock, AlertCircle } from 'lucide-react';

const STATUS_CONFIG = {
  pending:   { color:'#f59e0b', bg:'rgba(245,158,11,0.1)',  label:'Pending',   icon:Clock },
  reviewing: { color:'#3b82f6', bg:'rgba(59,130,246,0.1)',  label:'Reviewing', icon:Clock },
  approved:  { color:'#22c55e', bg:'rgba(34,197,94,0.1)',   label:'Approved',  icon:Check },
  declined:  { color:'#ef4444', bg:'rgba(239,68,68,0.1)',   label:'Declined',  icon:X },
  cancelled: { color:'#9c9080', bg:'rgba(156,144,128,0.1)', label:'Withdrawn', icon:X },
};

const TenantApplications = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [withdrawing, setWithdrawing]   = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res  = await axiosInstance.get('/api/applications/');
        const data = Array.isArray(res.data) ? res.data : [];
        setApplications(data);
      } catch { setError('Failed to load your applications.'); }
      finally   { setLoading(false); }
    };
    fetch();
  }, []);

  const handleWithdraw = async (id) => {
    if (!window.confirm('Withdraw this application?')) return;
    setWithdrawing(id);
    try {
      await axiosInstance.patch(`/api/applications/${id}/`, { status: 'cancelled' });
      setApplications(prev => prev.map(a => a.id === id ? { ...a, status: 'cancelled' } : a));
    } catch { setError('Failed to withdraw application.'); }
    finally   { setWithdrawing(null); }
  };

  return (
    <div className="page-enter min-h-screen bg-neutral-50">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@400;500&display=swap');`}</style>

      {/* Header */}
      <div style={{ background:'#1c1a17', paddingTop:48, paddingBottom:48 }}>
        <div className="max-w-3xl mx-auto px-6">
          <p style={{ fontSize:11,fontWeight:600,letterSpacing:'0.1em',textTransform:'uppercase',color:'#d4a96a',marginBottom:8 }}>Tenant</p>
          <h1 style={{ fontFamily:"'Playfair Display',serif",fontSize:'clamp(1.6rem,3vw,2.2rem)',fontWeight:700,color:'#fff' }}>My Applications</h1>
          <p style={{ fontSize:14,color:'rgba(255,255,255,0.45)',marginTop:6 }}>Track rental applications you've submitted</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        {error && (
          <div style={{ marginBottom:16,padding:'12px 16px',borderRadius:11,background:'#fef2f2',border:'1px solid #fecaca',color:'#dc2626',fontSize:13,display:'flex',alignItems:'center',gap:7,fontFamily:"'DM Sans',sans-serif" }}>
            <AlertCircle size={14}/>{error}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign:'center',padding:'60px 0',color:'#9c9080',fontFamily:"'DM Sans',sans-serif" }}>Loading…</div>
        ) : applications.length === 0 ? (
          <div style={{ textAlign:'center',padding:'60px 20px',background:'#fff',borderRadius:20,border:'1px solid #ede8e0' }}>
            <div style={{ width:64,height:64,borderRadius:18,background:'#faf7f3',border:'1px solid #ede8e0',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 18px' }}>
              <FileText size={26} style={{ color:'#c4bdb4' }}/>
            </div>
            <h3 style={{ fontFamily:"'Playfair Display',serif",fontSize:20,fontWeight:700,color:'#1c1a17',marginBottom:8 }}>No applications yet</h3>
            <p style={{ fontSize:14,color:'#9c9080',marginBottom:24,fontFamily:"'DM Sans',sans-serif" }}>
              Browse properties and apply for ones you like.
            </p>
            <button onClick={() => navigate('/properties')}
              style={{ display:'inline-flex',alignItems:'center',gap:8,padding:'12px 24px',borderRadius:12,background:'#1c1a17',color:'#fff',border:'none',fontSize:14,fontWeight:500,cursor:'pointer',fontFamily:"'DM Sans',sans-serif" }}>
              Browse Properties <ArrowRight size={14}/>
            </button>
          </div>
        ) : (
          <AnimatePresence>
            <div style={{ display:'flex',flexDirection:'column',gap:12 }}>
              {applications.map((app, i) => {
                const sc = STATUS_CONFIG[app.status] || STATUS_CONFIG.pending;
                const Icon = sc.icon;
                return (
                  <motion.div key={app.id} initial={{ opacity:0,y:12 }} animate={{ opacity:1,y:0 }} transition={{ delay:i*0.05 }}
                    style={{ background:'#fff',border:'1px solid #ede8e0',borderRadius:18,padding:24 }}>

                    {/* Header row */}
                    <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:12,marginBottom:16,flexWrap:'wrap' }}>
                      <div>
                        <h3 style={{ fontFamily:"'Playfair Display',serif",fontSize:17,fontWeight:700,color:'#1c1a17',marginBottom:3 }}>
                          {app.property_title}
                        </h3>
                        <p style={{ fontSize:12,color:'#9c9080',fontFamily:"'DM Sans',sans-serif" }}>
                          Applied {new Date(app.created_at).toLocaleDateString([], { day:'numeric',month:'short',year:'numeric' })}
                        </p>
                      </div>
                      <div style={{ display:'flex',alignItems:'center',gap:6,padding:'5px 12px',borderRadius:100,background:sc.bg,flexShrink:0 }}>
                        <Icon size={12} style={{ color:sc.color }}/>
                        <span style={{ fontSize:12,fontWeight:600,color:sc.color,fontFamily:"'DM Sans',sans-serif" }}>{sc.label}</span>
                      </div>
                    </div>

                    {/* Details grid */}
                    <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:10,marginBottom:16 }}>
                      {[
                        { label:'Employment',    value:app.employment_status?.replace('_',' ') },
                        { label:'Move-in date',  value:app.move_in_date },
                        { label:'Occupants',     value:app.num_occupants },
                        { label:'Has pets',      value:app.has_pets ? 'Yes' : 'No' },
                      ].map(({ label, value }) => (
                        <div key={label} style={{ background:'#faf7f3',borderRadius:10,padding:'10px 12px',border:'1px solid #ede8e0' }}>
                          <p style={{ fontSize:10,fontWeight:600,letterSpacing:'0.06em',textTransform:'uppercase',color:'#9c9080',marginBottom:3,fontFamily:"'DM Sans',sans-serif" }}>{label}</p>
                          <p style={{ fontSize:13,fontWeight:500,color:'#1c1a17',fontFamily:"'DM Sans',sans-serif',textTransform:'capitalize" }}>{value || '—'}</p>
                        </div>
                      ))}
                    </div>

                    {/* Landlord note */}
                    {app.landlord_note && (
                      <div style={{ padding:'12px 14px',background: app.status==='approved'?'rgba(34,197,94,0.06)':app.status==='declined'?'rgba(239,68,68,0.06)':'rgba(59,130,246,0.06)', border:`1px solid ${app.status==='approved'?'rgba(34,197,94,0.2)':app.status==='declined'?'rgba(239,68,68,0.2)':'rgba(59,130,246,0.2)'}`,borderRadius:10,marginBottom:14 }}>
                        <p style={{ fontSize:11,fontWeight:600,color:sc.color,marginBottom:3,fontFamily:"'DM Sans',sans-serif",textTransform:'uppercase',letterSpacing:'0.06em' }}>Landlord's note</p>
                        <p style={{ fontSize:13,color:'#5a5248',lineHeight:1.6,fontFamily:"'DM Sans',sans-serif",margin:0 }}>{app.landlord_note}</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div style={{ display:'flex',gap:8 }}>
                      <button onClick={() => navigate(`/properties/${app.property}`)}
                        style={{ display:'flex',alignItems:'center',gap:5,padding:'8px 14px',borderRadius:10,background:'#faf7f3',border:'1px solid #ede8e0',color:'#5a5248',fontSize:12,fontWeight:500,cursor:'pointer',fontFamily:"'DM Sans',sans-serif" }}>
                        <ArrowRight size={12}/> View property
                      </button>
                      {app.status === 'pending' && (
                        <button onClick={() => handleWithdraw(app.id)} disabled={withdrawing === app.id}
                          style={{ display:'flex',alignItems:'center',gap:5,padding:'8px 14px',borderRadius:10,background:'#fef2f2',border:'1px solid #fecaca',color:'#dc2626',fontSize:12,fontWeight:500,cursor:withdrawing===app.id?'not-allowed':'pointer',fontFamily:"'DM Sans',sans-serif" }}>
                          <X size={12}/>{withdrawing===app.id ? 'Withdrawing…' : 'Withdraw'}
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default TenantApplications;