import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useLanguage } from '../contexts/LanguageContext';
import axiosInstance from '../utils/axios.js';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import { BarChart2, Home, Eye, MessageCircle, TrendingUp, Star, AlertCircle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const StatCard = ({ icon: Icon, label, value, sub, color = '#d4a96a' }) => (
  <div style={{ background:'#fff', border:'1px solid #ede8e0', borderRadius:16, padding:24 }}>
    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
      <div style={{ width:38, height:38, borderRadius:10, background:`${color}18`, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <Icon size={17} style={{ color }}/>
      </div>
      <span style={{ fontSize:11, fontWeight:600, letterSpacing:'0.07em', textTransform:'uppercase', color:'#9c9080', fontFamily:"'DM Sans',sans-serif" }}>{label}</span>
    </div>
    <div style={{ fontFamily:"'Playfair Display',serif", fontSize:32, fontWeight:700, color:'#1c1a17', lineHeight:1 }}>{value}</div>
    {sub && <p style={{ fontSize:12, color:'#b5a898', marginTop:6, fontFamily:"'DM Sans',sans-serif" }}>{sub}</p>}
  </div>
);

const CompletenessBar = ({ score }) => {
  const color = score >= 80 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444';
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
      <div style={{ flex:1, height:6, background:'#f5f0e8', borderRadius:3, overflow:'hidden' }}>
        <div style={{ height:'100%', width:`${score}%`, background:color, borderRadius:3, transition:'width 0.4s' }}/>
      </div>
      <span style={{ fontSize:12, fontWeight:600, color, minWidth:32, fontFamily:"'DM Sans',sans-serif" }}>{score}%</span>
    </div>
  );
};

const Reports = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');

  useEffect(() => {
    if (!user?.is_landlord) { setLoading(false); return; }
    const fetch = async () => {
      try {
        setLoading(true);
        const res  = await axiosInstance.get('/api/properties/', { params: { landlord: 'self' } });
        const data = Array.isArray(res.data) ? res.data : res.data.results || [];
        setProperties(data);
      } catch { setError('Failed to load analytics.'); }
      finally { setLoading(false); }
    };
    fetch();
  }, [user]);

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><LoadingSpinner size="lg"/></div>;

  /* ── Derived stats ── */
  const totalListings   = properties.length;
  const vacantCount     = properties.filter(p => p.status === 'vacant').length;
  const occupiedCount   = properties.filter(p => p.status === 'occupied').length;
  const avgCompleteness = totalListings
    ? Math.round(properties.reduce((s, p) => s + (p.completeness_score || 0), 0) / totalListings)
    : 0;
  const lowCompleteness = properties.filter(p => (p.completeness_score || 0) < 60);
  const noWhatsApp      = properties.filter(p => !p.whatsapp_number);
  const fewImages       = properties.filter(p => (p.images?.length || 0) < 3);

  const typeBreakdown = properties.reduce((acc, p) => {
    const k = p.property_type || 'unspecified';
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="page-enter min-h-screen bg-neutral-50">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@400;500&display=swap');
        .rp-table { width:100%; border-collapse:collapse; font-family:'DM Sans',sans-serif; font-size:13.5px; }
        .rp-table th { text-align:left; font-size:10.5px; font-weight:600; letter-spacing:0.07em; text-transform:uppercase; color:#9c9080; padding:0 0 12px; border-bottom:1px solid #f3ede6; }
        .rp-table td { padding:14px 0; border-bottom:1px solid #f5f0e8; color:#1c1a17; vertical-align:middle; }
        .rp-table tr:last-child td { border-bottom:none; }
        .tip-card { background:#fff8ed; border:1px solid #fde68a; border-radius:14px; padding:16px 20px; display:flex; gap:12px; align-items:flex-start; }
      `}</style>

      {/* Header */}
      <div style={{ background:'#1c1a17', paddingTop:48, paddingBottom:48 }}>
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between flex-wrap gap-4">
          <div>
            <p style={{ fontSize:11,fontWeight:600,letterSpacing:'0.1em',textTransform:'uppercase',color:'#d4a96a',marginBottom:8 }}>Landlord</p>
            <h1 style={{ fontFamily:"'Playfair Display',serif",fontSize:'clamp(1.6rem,3vw,2.2rem)',fontWeight:700,color:'#fff' }}>Analytics & Reports</h1>
          </div>
          <button onClick={() => navigate('/manage-listings')}
            style={{ display:'flex',alignItems:'center',gap:7,padding:'10px 20px',borderRadius:12,background:'rgba(255,255,255,0.1)',color:'#fff',border:'1px solid rgba(255,255,255,0.15)',fontSize:13,fontWeight:500,cursor:'pointer',fontFamily:"'DM Sans',sans-serif" }}>
            Manage Listings <ArrowRight size={13}/>
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10">

        {!user?.is_landlord ? (
          <div style={{ textAlign:'center', padding:'60px 20px', background:'#fff', borderRadius:20, border:'1px solid #ede8e0' }}>
            <BarChart2 size={36} style={{ color:'#c4bdb4', margin:'0 auto 16px' }}/>
            <h3 style={{ fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:700,color:'#1c1a17',marginBottom:8 }}>Analytics for landlords</h3>
            <p style={{ fontSize:14, color:'#9c9080' }}>Switch to a landlord account to see your listing analytics.</p>
          </div>
        ) : error ? (
          <div style={{ padding:16, borderRadius:12, background:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626', fontSize:14 }}>{error}</div>
        ) : (
          <>
            {/* ── Overview stats ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <StatCard icon={Home}        label="Total Listings"      value={totalListings}  sub="all time"                    color="#d4a96a"/>
              <StatCard icon={TrendingUp}  label="Vacant"              value={vacantCount}    sub="available now"               color="#22c55e"/>
              <StatCard icon={Eye}         label="Occupied"            value={occupiedCount}  sub="currently rented"            color="#9c9080"/>
              <StatCard icon={Star}        label="Avg Completeness"    value={`${avgCompleteness}%`} sub="across all listings"  color={avgCompleteness>=80?'#22c55e':avgCompleteness>=50?'#f59e0b':'#ef4444'}/>
            </div>

            {/* ── Improvement tips ── */}
            {(lowCompleteness.length > 0 || noWhatsApp.length > 0 || fewImages.length > 0) && (
              <div className="mb-8">
                <p style={{ fontFamily:"'Playfair Display',serif",fontSize:17,fontWeight:700,color:'#1c1a17',marginBottom:14 }}>
                  💡 Ways to get more enquiries
                </p>
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {fewImages.length > 0 && (
                    <div className="tip-card">
                      <AlertCircle size={16} style={{ color:'#f59e0b', flexShrink:0, marginTop:1 }}/>
                      <div>
                        <p style={{ fontSize:13,fontWeight:600,color:'#1c1a17',marginBottom:2 }}>{fewImages.length} listing{fewImages.length>1?'s':''} have fewer than 3 photos</p>
                        <p style={{ fontSize:12,color:'#9c9080' }}>Listings with 3+ photos get significantly more enquiries. Add more photos in Manage Listings.</p>
                      </div>
                    </div>
                  )}
                  {noWhatsApp.length > 0 && (
                    <div className="tip-card">
                      <AlertCircle size={16} style={{ color:'#f59e0b', flexShrink:0, marginTop:1 }}/>
                      <div>
                        <p style={{ fontSize:13,fontWeight:600,color:'#1c1a17',marginBottom:2 }}>{noWhatsApp.length} listing{noWhatsApp.length>1?'s':''} missing a WhatsApp number</p>
                        <p style={{ fontSize:12,color:'#9c9080' }}>Tenants prefer to contact landlords on WhatsApp. Add your number to get more direct enquiries.</p>
                      </div>
                    </div>
                  )}
                  {lowCompleteness.length > 0 && (
                    <div className="tip-card">
                      <AlertCircle size={16} style={{ color:'#f59e0b', flexShrink:0, marginTop:1 }}/>
                      <div>
                        <p style={{ fontSize:13,fontWeight:600,color:'#1c1a17',marginBottom:2 }}>{lowCompleteness.length} listing{lowCompleteness.length>1?'s':''} below 60% completeness</p>
                        <p style={{ fontSize:12,color:'#9c9080' }}>Incomplete listings appear lower in search results. Add bedrooms, bathrooms and a full description.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Per-listing breakdown ── */}
            <div style={{ background:'#fff', border:'1px solid #ede8e0', borderRadius:20, padding:28, marginBottom:20 }}>
              <p style={{ fontFamily:"'Playfair Display',serif",fontSize:17,fontWeight:700,color:'#1c1a17',marginBottom:20 }}>
                Listing Performance
              </p>
              {properties.length === 0 ? (
                <p style={{ fontSize:13,color:'#9c9080',textAlign:'center',padding:'20px 0' }}>No listings yet.</p>
              ) : (
                <table className="rp-table">
                  <thead>
                    <tr>
                      <th style={{ width:'35%' }}>Property</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Photos</th>
                      <th style={{ width:'28%' }}>Completeness</th>
                    </tr>
                  </thead>
                  <tbody>
                    {properties.map(p => (
                      <tr key={p.id} style={{ cursor:'pointer' }} onClick={() => navigate(`/properties/${p.id}`)}>
                        <td>
                          <div style={{ fontWeight:500 }}>{p.area}</div>
                          <div style={{ fontSize:11,color:'#9c9080' }}>{p.district}</div>
                        </td>
                        <td style={{ color:'#7a7060', textTransform:'capitalize' }}>{p.property_type || '—'}</td>
                        <td>
                          <span style={{
                            padding:'3px 10px', borderRadius:100, fontSize:11, fontWeight:500,
                            background: p.status==='vacant'?'rgba(34,197,94,0.12)':p.status==='occupied'?'rgba(239,68,68,0.12)':'rgba(148,163,184,0.12)',
                            color:      p.status==='vacant'?'#22c55e':p.status==='occupied'?'#ef4444':'#94a3b8',
                          }}>{p.status}</span>
                        </td>
                        <td>
                          <span style={{ color:(p.images?.length||0)<3?'#f59e0b':'#22c55e', fontWeight:500 }}>
                            {p.images?.length||0} / 10
                          </span>
                        </td>
                        <td><CompletenessBar score={p.completeness_score || 0}/></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* ── Property type breakdown ── */}
            {Object.keys(typeBreakdown).length > 0 && (
              <div style={{ background:'#fff', border:'1px solid #ede8e0', borderRadius:20, padding:28 }}>
                <p style={{ fontFamily:"'Playfair Display',serif",fontSize:17,fontWeight:700,color:'#1c1a17',marginBottom:20 }}>
                  Portfolio by Type
                </p>
                <div style={{ display:'flex', flexWrap:'wrap', gap:10 }}>
                  {Object.entries(typeBreakdown).map(([type, count]) => (
                    <div key={type} style={{ padding:'8px 18px', borderRadius:100, background:'#faf7f3', border:'1px solid #ede8e0', fontSize:13, color:'#5a5248', fontWeight:500, fontFamily:"'DM Sans',sans-serif", textTransform:'capitalize' }}>
                      {type} <span style={{ color:'#d4a96a', fontWeight:700 }}>({count})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Reports;