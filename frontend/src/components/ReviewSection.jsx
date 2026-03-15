import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axiosInstance from '../utils/axios';
import { useAuth } from '../contexts/AuthContext';
import { Star, Send, MessageSquare } from 'lucide-react';

const StarPicker = ({ value, onChange, disabled }) => (
  <div style={{ display:'flex', gap:4 }}>
    {[1,2,3,4,5].map(n => (
      <button key={n} type="button" onClick={() => !disabled && onChange(n)}
        style={{ background:'none', border:'none', cursor:disabled?'default':'pointer', padding:2, transition:'transform 0.1s' }}
        onMouseEnter={e => !disabled && (e.currentTarget.style.transform='scale(1.2)')}
        onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}>
        <Star size={22} style={{ fill: n<=value ? '#d4a96a' : 'none', color: n<=value ? '#d4a96a' : '#ede8e0', transition:'all 0.15s' }}/>
      </button>
    ))}
  </div>
);

const ReviewSection = ({ propertyId }) => {
  const { isAuthenticated, user } = useAuth();
  const [reviews, setReviews]     = useState([]);
  const [average, setAverage]     = useState(null);
  const [count, setCount]         = useState(0);
  const [loading, setLoading]     = useState(true);
  const [rating, setRating]       = useState(0);
  const [comment, setComment]     = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState('');
  const [showForm, setShowForm]   = useState(false);

  const alreadyReviewed = reviews.some(r => r.reviewer_username === user?.username);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axiosInstance.get(`/api/properties/${propertyId}/reviews/`);
        setReviews(res.data.reviews || []);
        setAverage(res.data.average);
        setCount(res.data.count);
      } catch { /* silent */ }
      finally { setLoading(false); }
    };
    fetch();
  }, [propertyId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) { setError('Please select a star rating.'); return; }
    setSubmitting(true); setError('');
    try {
      const res = await axiosInstance.post(`/api/properties/${propertyId}/reviews/`, { rating, comment });
      setReviews(prev => [res.data, ...prev]);
      setAverage(prev => prev ? +((prev * count + rating) / (count + 1)).toFixed(1) : rating);
      setCount(prev => prev + 1);
      setRating(0); setComment(''); setShowForm(false);
      setSuccess('Review submitted. Thank you!');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit review.');
    } finally { setSubmitting(false); }
  };

  return (
    <div style={{ background:'#fff', border:'1px solid #ede8e0', borderRadius:20, padding:28, marginTop:20 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@400;500&display=swap');
        .rv-input { width:100%; padding:11px 14px; border:1px solid #ede8e0; border-radius:11px; font-size:13.5px; font-family:'DM Sans',sans-serif; color:#1c1a17; background:#fff; outline:none; resize:vertical; transition:border-color 0.18s; }
        .rv-input:focus { border-color:#c4a882; }
      `}</style>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:10 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <MessageSquare size={18} style={{ color:'#d4a96a' }}/>
          <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:17, fontWeight:700, color:'#1c1a17' }}>
            Reviews {count > 0 && <span style={{ fontSize:14, fontWeight:400, color:'#9c9080' }}>({count})</span>}
          </h3>
        </div>
        {average && (
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <Star size={16} style={{ fill:'#d4a96a', color:'#d4a96a' }}/>
            <span style={{ fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:700, color:'#1c1a17' }}>{average}</span>
            <span style={{ fontSize:12, color:'#9c9080' }}>/ 5</span>
          </div>
        )}
      </div>

      {success && <div style={{ marginBottom:14,padding:'10px 14px',borderRadius:10,background:'#f0fdf4',border:'1px solid #86efac',color:'#16a34a',fontSize:13 }}>{success}</div>}

      {/* Write review button */}
      {isAuthenticated && !alreadyReviewed && !showForm && (
        <button onClick={() => setShowForm(true)}
          style={{ marginBottom:20,padding:'9px 18px',borderRadius:11,background:'#faf7f3',border:'1px solid #ede8e0',color:'#5a5248',fontSize:13,fontWeight:500,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",display:'flex',alignItems:'center',gap:6 }}>
          <Star size={13} style={{ color:'#d4a96a' }}/> Write a review
        </button>
      )}

      {/* Review form */}
      <AnimatePresence>
        {showForm && (
          <motion.form initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} exit={{ opacity:0, height:0 }}
            onSubmit={handleSubmit} style={{ marginBottom:20, overflow:'hidden' }}>
            <div style={{ paddingTop:4 }}>
              {error && <div style={{ marginBottom:10,padding:'8px 12px',borderRadius:9,background:'#fef2f2',border:'1px solid #fecaca',color:'#dc2626',fontSize:12 }}>{error}</div>}
              <div style={{ marginBottom:12 }}>
                <p style={{ fontSize:11,fontWeight:600,letterSpacing:'0.06em',textTransform:'uppercase',color:'#9c9080',marginBottom:8,fontFamily:"'DM Sans',sans-serif" }}>Your rating</p>
                <StarPicker value={rating} onChange={setRating} disabled={submitting}/>
              </div>
              <div style={{ marginBottom:12 }}>
                <p style={{ fontSize:11,fontWeight:600,letterSpacing:'0.06em',textTransform:'uppercase',color:'#9c9080',marginBottom:8,fontFamily:"'DM Sans',sans-serif" }}>Comment (optional)</p>
                <textarea value={comment} onChange={e=>setComment(e.target.value)} className="rv-input"
                  placeholder="Share your experience with this property or landlord…" rows={3}/>
              </div>
              <div style={{ display:'flex',gap:8 }}>
                <button type="submit" disabled={submitting||rating===0}
                  style={{ display:'flex',alignItems:'center',gap:6,padding:'9px 18px',borderRadius:11,background:submitting||rating===0?'#9c9080':'#1c1a17',color:'#fff',border:'none',fontSize:13,fontWeight:500,cursor:submitting||rating===0?'not-allowed':'pointer',fontFamily:"'DM Sans',sans-serif" }}>
                  <Send size={13}/>{submitting ? 'Submitting…' : 'Submit'}
                </button>
                <button type="button" onClick={() => { setShowForm(false); setError(''); setRating(0); setComment(''); }}
                  style={{ padding:'9px 16px',borderRadius:11,background:'transparent',color:'#9c9080',border:'1px solid #ede8e0',fontSize:13,cursor:'pointer',fontFamily:"'DM Sans',sans-serif" }}>
                  Cancel
                </button>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Reviews list */}
      {loading ? (
        <p style={{ fontSize:13,color:'#b5a898',textAlign:'center',padding:'16px 0' }}>Loading reviews…</p>
      ) : reviews.length === 0 ? (
        <p style={{ fontSize:13,color:'#b5a898',textAlign:'center',padding:'16px 0' }}>
          No reviews yet. {isAuthenticated ? 'Be the first!' : 'Log in to leave a review.'}
        </p>
      ) : (
        <div style={{ display:'flex',flexDirection:'column',gap:14 }}>
          {reviews.map(r => (
            <div key={r.id} style={{ paddingBottom:14,borderBottom:'1px solid #f5f0e8' }}>
              <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:6,flexWrap:'wrap',gap:6 }}>
                <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                  <div style={{ width:30,height:30,borderRadius:'50%',background:'linear-gradient(135deg,#d4a96a,#c4a882)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,color:'#fff',fontFamily:"'Playfair Display',serif",flexShrink:0 }}>
                    {r.reviewer_username[0].toUpperCase()}
                  </div>
                  <span style={{ fontSize:13,fontWeight:500,color:'#1c1a17',fontFamily:"'DM Sans',sans-serif" }}>{r.reviewer_username}</span>
                </div>
                <div style={{ display:'flex',gap:2 }}>
                  {[1,2,3,4,5].map(n => <Star key={n} size={12} style={{ fill:n<=r.rating?'#d4a96a':'none',color:n<=r.rating?'#d4a96a':'#ede8e0' }}/>)}
                </div>
              </div>
              {r.comment && <p style={{ fontSize:13,color:'#5a5248',lineHeight:1.7,fontFamily:"'DM Sans',sans-serif",fontStyle:'italic' }}>"{r.comment}"</p>}
              <p style={{ fontSize:10,color:'#c4bdb4',marginTop:5,fontFamily:"'DM Sans',sans-serif" }}>{new Date(r.created_at).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReviewSection;