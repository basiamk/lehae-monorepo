import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axiosInstance from '../utils/axios.js';
import { Bell, Trash2, Search, ArrowRight, Plus, CheckCircle2 } from 'lucide-react';

const STORAGE_KEY = 'lehae_saved_searches';

function loadSaved() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
  catch { return []; }
}
function saveSaved(searches) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(searches));
}

// Called from PropertyFilter/PropertyList — saves the current filter as a search
export function saveSearch(filters, label) {
  const existing = loadSaved();
  const id = Date.now().toString();
  const entry = { id, label: label || buildLabel(filters), filters, savedAt: new Date().toISOString(), newCount: 0 };
  const updated = [entry, ...existing.slice(0, 9)]; // max 10
  saveSaved(updated);
  return updated;
}

export function buildLabel(filters) {
  const parts = [];
  if (filters.district)      parts.push(filters.district);
  if (filters.area)          parts.push(filters.area);
  if (filters.property_type) parts.push(filters.property_type);
  if (filters.bedrooms)      parts.push(`${filters.bedrooms} bed`);
  if (filters.minPrice || filters.maxPrice) {
    if (filters.minPrice && filters.maxPrice) parts.push(`M${filters.minPrice}–M${filters.maxPrice}`);
    else if (filters.minPrice) parts.push(`M${filters.minPrice}+`);
    else parts.push(`up to M${filters.maxPrice}`);
  }
  if (filters.status && filters.status !== 'all') parts.push(filters.status);
  return parts.length > 0 ? parts.join(' · ') : 'All Properties';
}

// Check saved searches against live properties and update new counts
async function checkForNewMatches(searches) {
  const updated = [...searches];
  for (let i = 0; i < updated.length; i++) {
    try {
      const res  = await axiosInstance.get('/api/properties/', { params: updated[i].filters });
      const data = Array.isArray(res.data) ? res.data : res.data.results || [];
      // Count properties newer than when the search was saved
      const savedTime = new Date(updated[i].savedAt).getTime();
      const newOnes   = data.filter(p => new Date(p.created_at).getTime() > savedTime);
      updated[i] = { ...updated[i], newCount: newOnes.length };
    } catch { /* ignore — don't break on API error */ }
  }
  saveSaved(updated);
  return updated;
}

const SavedSearches = () => {
  const navigate  = useNavigate();
  const [searches, setSearches]   = useState(loadSaved);
  const [checking, setChecking]   = useState(false);
  const [lastChecked, setLastChecked] = useState(null);

  const runCheck = useCallback(async () => {
    if (searches.length === 0) return;
    setChecking(true);
    const updated = await checkForNewMatches(searches);
    setSearches(updated);
    setLastChecked(new Date());
    setChecking(false);
  }, [searches]);

  // Check on mount + every 5 minutes
  useEffect(() => {
    runCheck();
    const interval = setInterval(runCheck, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleDelete = (id) => {
    const updated = searches.filter(s => s.id !== id);
    setSearches(updated);
    saveSaved(updated);
  };

  const handleRun = (search) => {
    // Clear new count when user runs the search
    const updated = searches.map(s => s.id === search.id ? { ...s, newCount: 0 } : s);
    setSearches(updated);
    saveSaved(updated);
    navigate(`/properties?${new URLSearchParams(search.filters).toString()}`);
  };

  const totalNew = searches.reduce((s, x) => s + (x.newCount || 0), 0);

  return (
    <div className="page-enter min-h-screen bg-neutral-50">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@400;500&display=swap');
        .ss-card { background:#fff; border:1px solid #ede8e0; border-radius:16px; padding:20px 22px; display:flex; align-items:center; gap:14px; cursor:pointer; transition:all 0.18s; }
        .ss-card:hover { border-color:#c4a882; box-shadow:0 4px 20px rgba(0,0,0,0.07); transform:translateY(-2px); }
        .ss-badge { background:#1c1a17; color:#fff; border-radius:100px; font-size:10px; font-weight:700; padding:2px 8px; min-width:22px; text-align:center; }
        .ss-new-badge { background:rgba(212,169,106,0.15); color:#d4a96a; border:1px solid rgba(212,169,106,0.3); border-radius:100px; font-size:11px; font-weight:600; padding:3px 10px; }
      `}</style>

      {/* Header */}
      <div style={{ background:'#1c1a17', paddingTop:48, paddingBottom:48 }}>
        <div className="max-w-3xl mx-auto px-6 flex items-center justify-between">
          <div>
            <p style={{ fontSize:11,fontWeight:600,letterSpacing:'0.1em',textTransform:'uppercase',color:'#d4a96a',marginBottom:8 }}>Alerts</p>
            <h1 style={{ fontFamily:"'Playfair Display',serif",fontSize:'clamp(1.6rem,3vw,2.2rem)',fontWeight:700,color:'#fff' }}>Saved Searches</h1>
          </div>
          {totalNew > 0 && (
            <div style={{ display:'flex',alignItems:'center',gap:7,padding:'8px 16px',borderRadius:12,background:'rgba(212,169,106,0.15)',border:'1px solid rgba(212,169,106,0.3)',color:'#d4a96a',fontSize:13,fontWeight:600,fontFamily:"'DM Sans',sans-serif" }}>
              <Bell size={14}/> {totalNew} new match{totalNew>1?'es':''}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">

        {/* Last checked */}
        {lastChecked && (
          <p style={{ fontSize:11,color:'#b5a898',marginBottom:16,fontFamily:"'DM Sans',sans-serif",display:'flex',alignItems:'center',gap:5 }}>
            <CheckCircle2 size={11} style={{ color:'#22c55e' }}/>
            Last checked: {lastChecked.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}
            {checking && ' · Checking now…'}
          </p>
        )}

        {searches.length === 0 ? (
          /* Empty state */
          <div style={{ textAlign:'center',padding:'60px 20px',background:'#fff',borderRadius:20,border:'1px solid #ede8e0' }}>
            <div style={{ width:64,height:64,borderRadius:18,background:'#faf7f3',border:'1px solid #ede8e0',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 18px' }}>
              <Bell size={26} style={{ color:'#c4bdb4' }}/>
            </div>
            <h3 style={{ fontFamily:"'Playfair Display',serif",fontSize:20,fontWeight:700,color:'#1c1a17',marginBottom:8 }}>No saved searches yet</h3>
            <p style={{ fontSize:14,color:'#9c9080',marginBottom:24,maxWidth:300,margin:'0 auto 24px',lineHeight:1.7 }}>
              Save a search from the Properties page and we'll alert you when new matching listings appear.
            </p>
            <button onClick={() => navigate('/properties')}
              style={{ display:'inline-flex',alignItems:'center',gap:8,padding:'12px 24px',borderRadius:12,background:'#1c1a17',color:'#fff',border:'none',fontSize:14,fontWeight:500,cursor:'pointer',fontFamily:"'DM Sans',sans-serif" }}>
              Browse Properties <ArrowRight size={14}/>
            </button>
          </div>
        ) : (
          <AnimatePresence>
            <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
              {searches.map((search, i) => (
                <motion.div key={search.id}
                  initial={{ opacity:0,y:12 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0,x:-20 }}
                  transition={{ delay:i*0.05 }}>
                  <div className="ss-card" onClick={() => handleRun(search)}>
                    <div style={{ width:38,height:38,borderRadius:10,background:'#faf7f3',border:'1px solid #ede8e0',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                      <Search size={16} style={{ color:'#c4a882' }}/>
                    </div>
                    <div style={{ flex:1,minWidth:0 }}>
                      <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:3,flexWrap:'wrap' }}>
                        <span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:14,fontWeight:500,color:'#1c1a17' }}>{search.label}</span>
                        {search.newCount > 0 && (
                          <span className="ss-new-badge">+{search.newCount} new</span>
                        )}
                      </div>
                      <p style={{ fontSize:11,color:'#b5a898',fontFamily:"'DM Sans',sans-serif" }}>
                        Saved {new Date(search.savedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                      <ArrowRight size={15} style={{ color:'#c4bdb4' }}/>
                      <button onClick={e=>{e.stopPropagation();handleDelete(search.id);}}
                        style={{ width:30,height:30,borderRadius:8,background:'#fef2f2',border:'1px solid #fecaca',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',flexShrink:0 }}>
                        <Trash2 size={13} style={{ color:'#dc2626' }}/>
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}

        {searches.length > 0 && (
          <div style={{ marginTop:20,display:'flex',justifyContent:'center' }}>
            <button onClick={() => navigate('/properties')}
              style={{ display:'inline-flex',alignItems:'center',gap:7,padding:'10px 20px',borderRadius:12,background:'transparent',color:'#9c9080',border:'1px solid #ede8e0',fontSize:13,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",transition:'all 0.15s' }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor='#c4a882';e.currentTarget.style.color='#1c1a17';}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor='#ede8e0';e.currentTarget.style.color='#9c9080';}}>
              <Plus size={13}/> Add new search
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedSearches;