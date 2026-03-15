import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axiosInstance from '../utils/axios';
import { X, Calendar, Clock, Send, Check, AlertCircle } from 'lucide-react';

const ViewingRequestModal = ({ property, onClose }) => {
  const [formData, setFormData] = useState({
    proposed_date: '',
    proposed_time: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError]     = useState('');

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.proposed_date || !formData.proposed_time) {
      setError('Please select a date and time.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await axiosInstance.post('/api/viewings/', {
        property:      property.id,
        proposed_date: formData.proposed_date,
        proposed_time: formData.proposed_time,
        message:       formData.message,
      });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // min date = today
  const today = new Date().toISOString().split('T')[0];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:100,display:'flex',alignItems:'center',justifyContent:'center',padding:16 }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity:0, scale:0.95, y:16 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.95 }}
          transition={{ duration: 0.2 }}
          style={{ background:'#fff',borderRadius:20,padding:28,width:'100%',maxWidth:440,position:'relative' }}
          onClick={e => e.stopPropagation()}
        >
          <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@400;500&display=swap');
            .vr-input { width:100%; padding:11px 14px; border:1px solid #ede8e0; border-radius:11px; font-size:14px; font-family:'DM Sans',sans-serif; color:#1c1a17; background:#fff; outline:none; transition:border-color 0.18s; }
            .vr-input:focus { border-color:#c4a882; box-shadow:0 0 0 3px rgba(196,168,130,0.12); }
            .vr-label { font-size:11px; font-weight:500; letter-spacing:0.06em; text-transform:uppercase; color:#9c9080; margin-bottom:6px; display:flex; align-items:center; gap:5px; }
          `}</style>

          {/* Close */}
          <button onClick={onClose}
            style={{ position:'absolute',top:16,right:16,background:'none',border:'none',cursor:'pointer',color:'#9c9080',padding:4 }}>
            <X size={18}/>
          </button>

          {success ? (
            <div style={{ textAlign:'center', padding:'20px 0' }}>
              <div style={{ width:52,height:52,borderRadius:'50%',background:'rgba(34,197,94,0.1)',border:'1px solid #86efac',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px' }}>
                <Check size={22} style={{ color:'#22c55e' }}/>
              </div>
              <h3 style={{ fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:700,color:'#1c1a17',marginBottom:8 }}>Request Sent!</h3>
              <p style={{ fontSize:13,color:'#9c9080',lineHeight:1.7,marginBottom:20 }}>
                Your viewing request has been sent to {property.landlord_username}. You'll receive an email when they respond.
              </p>
              <button onClick={onClose}
                style={{ padding:'10px 24px',borderRadius:11,background:'#1c1a17',color:'#fff',border:'none',fontSize:13,fontWeight:500,cursor:'pointer',fontFamily:"'DM Sans',sans-serif" }}>
                Close
              </button>
            </div>
          ) : (
            <>
              <div style={{ marginBottom:22 }}>
                <p style={{ fontSize:11,fontWeight:600,letterSpacing:'0.08em',textTransform:'uppercase',color:'#d4a96a',marginBottom:6 }}>Request Viewing</p>
                <h3 style={{ fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:700,color:'#1c1a17' }}>
                  {property.area}, {property.district}
                </h3>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-xl text-sm flex items-center gap-2"
                  style={{ background:'#fef2f2',border:'1px solid #fecaca',color:'#dc2626',fontSize:13 }}>
                  <AlertCircle size={14}/> {error}
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display:'flex',flexDirection:'column',gap:16 }}>
                <div>
                  <label className="vr-label"><Calendar size={11}/>Preferred Date</label>
                  <input type="date" name="proposed_date" value={formData.proposed_date}
                    onChange={handleChange} className="vr-input" min={today} required />
                </div>
                <div>
                  <label className="vr-label"><Clock size={11}/>Preferred Time</label>
                  <input type="time" name="proposed_time" value={formData.proposed_time}
                    onChange={handleChange} className="vr-input" required />
                </div>
                <div>
                  <label className="vr-label">Note (optional)</label>
                  <textarea name="message" value={formData.message} onChange={handleChange}
                    className="vr-input" style={{ minHeight:80,resize:'vertical',lineHeight:1.6 }}
                    placeholder="e.g. I'll be coming with my spouse. Best time is morning." />
                </div>
                <button type="submit" disabled={loading}
                  style={{ display:'flex',alignItems:'center',justifyContent:'center',gap:7,padding:'12px',borderRadius:11,background:loading?'#7a7060':'#1c1a17',color:'#fff',border:'none',fontSize:14,fontWeight:500,cursor:loading?'not-allowed':'pointer',fontFamily:"'DM Sans',sans-serif" }}
                  onMouseEnter={e=>!loading&&(e.currentTarget.style.background='#3a3430')}
                  onMouseLeave={e=>e.currentTarget.style.background=loading?'#7a7060':'#1c1a17'}>
                  <Send size={14}/>{loading ? 'Sending…' : 'Send Viewing Request'}
                </button>
              </form>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ViewingRequestModal;