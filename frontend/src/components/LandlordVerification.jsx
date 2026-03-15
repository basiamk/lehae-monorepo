import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axiosInstance from '../utils/axios';
import { useAuth } from '../contexts/AuthContext';
import { Shield, Upload, Check, Clock, X, AlertCircle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const LandlordVerification = () => {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const [status, setStatus]     = useState(null);
  const [profileComplete, setProfileComplete] = useState(null); // null = loading
  const [loading, setLoading]   = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError]     = useState('');
  const [form, setForm] = useState({
    national_id_number: '',
    phone_number:       '',
    id_document: null,
  });

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [verRes, profRes] = await Promise.all([
          axiosInstance.get('/api/verification/'),
          axiosInstance.get('/api/profile/'),
        ]);
        setStatus(verRes.data.status || 'not_submitted');
        const p = profRes.data;
        setProfileComplete(!!(p.full_name && p.full_name.trim() && p.phone && p.phone.trim()));
      } catch {
        setStatus('not_submitted');
        setProfileComplete(false);
      }
      finally { setLoading(false); }
    };
    fetchAll();
  }, []);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setForm(prev => ({ ...prev, [name]: files ? files[0] : value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.national_id_number || !form.phone_number) {
      setError('ID number and phone number are required.'); return;
    }
    setSubmitting(true); setError('');
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k,v]) => { if (v) fd.append(k, v); });
      await axiosInstance.post('/api/verification/', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setStatus('pending');
      setSuccess('Verification request submitted! We\'ll review within 1-2 business days.');
    } catch (err) {
      setError(err.response?.data?.detail || 'Submission failed. Please try again.');
    } finally { setSubmitting(false); }
  };

  if (loading) return null;

  // Gate: landlord must have full_name and phone before submitting verification
  const profileIncomplete = profileComplete === false;

  const statusConfig = {
    approved: { icon: Check,  color:'#22c55e', bg:'rgba(34,197,94,0.1)',  border:'#86efac',  label:'Verified',       desc:'Your identity is confirmed. A verified badge appears on all your listings — no further submission needed.' },
    pending:  { icon: Clock,  color:'#f59e0b', bg:'rgba(245,158,11,0.1)', border:'#fde68a',  label:'Under Review',   desc:'Your ID is being reviewed. This usually takes 1-2 business days.' },
    rejected: { icon: X,      color:'#ef4444', bg:'rgba(239,68,68,0.1)',  border:'#fecaca',  label:'Not Approved',   desc:'Your verification was not approved. Please check your ID details and resubmit.' },
  };

  const cfg = statusConfig[status];

  return (
    <div style={{ background:'#fff', border:'1px solid #ede8e0', borderRadius:20, padding:28 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@400;500&display=swap');
        .lv-input { width:100%; padding:11px 14px; border:1px solid #ede8e0; border-radius:11px; font-size:14px; font-family:'DM Sans',sans-serif; color:#1c1a17; background:#fff; outline:none; transition:border-color 0.18s; }
        .lv-input:focus { border-color:#c4a882; box-shadow:0 0 0 3px rgba(196,168,130,0.12); }
        .lv-label { font-size:11px; font-weight:500; letter-spacing:0.06em; text-transform:uppercase; color:#9c9080; margin-bottom:6px; display:block; }
      `}</style>

      <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:20 }}>
        <Shield size={20} style={{ color:'#d4a96a' }}/>
        <h3 style={{ fontFamily:"'Playfair Display',serif",fontSize:17,fontWeight:700,color:'#1c1a17' }}>
          Landlord Verification
        </h3>
      </div>

      {/* Status banner */}
      {cfg && (
        <div style={{ display:'flex',alignItems:'flex-start',gap:12,padding:'14px 16px',borderRadius:12,background:cfg.bg,border:`1px solid ${cfg.border}`,marginBottom:20 }}>
          <cfg.icon size={18} style={{ color:cfg.color,flexShrink:0,marginTop:1 }}/>
          <div>
            <p style={{ fontSize:13,fontWeight:600,color:cfg.color,marginBottom:3,fontFamily:"'DM Sans',sans-serif" }}>{cfg.label}</p>
            <p style={{ fontSize:12,color:'#7a7060',lineHeight:1.6,fontFamily:"'DM Sans',sans-serif" }}>{cfg.desc}</p>
          </div>
        </div>
      )}

      {success && (
        <div style={{ padding:'12px 16px',borderRadius:10,background:'#f0fdf4',border:'1px solid #86efac',color:'#16a34a',fontSize:13,marginBottom:16,fontFamily:"'DM Sans',sans-serif" }}>
          {success}
        </div>
      )}

      {/* Profile incomplete gate */}
      {profileIncomplete && (status === 'not_submitted' || status === 'rejected') && (
        <div style={{ padding:'16px',background:'rgba(245,158,11,0.08)',border:'1px solid rgba(245,158,11,0.3)',borderRadius:12,marginBottom:16 }}>
          <p style={{ fontSize:13,fontWeight:600,color:'#f59e0b',marginBottom:4,fontFamily:"'DM Sans',sans-serif" }}>
            Complete your profile first
          </p>
          <p style={{ fontSize:12,color:'#7a7060',lineHeight:1.6,fontFamily:"'DM Sans',sans-serif",marginBottom:12 }}>
            Your full name and phone number are required before submitting for verification — the Lehae team uses these to cross-reference your ID.
          </p>
          <button onClick={() => navigate('/profile')}
            style={{ display:'inline-flex',alignItems:'center',gap:6,padding:'8px 16px',borderRadius:10,background:'#1c1a17',color:'#fff',border:'none',fontSize:12,fontWeight:500,cursor:'pointer',fontFamily:"'DM Sans',sans-serif" }}>
            Go to Profile <ArrowRight size={12}/>
          </button>
        </div>
      )}

      {/* Show form only if not yet approved or pending AND profile is complete */}
      {!profileIncomplete && (status === 'not_submitted' || status === 'rejected') && (
        <form onSubmit={handleSubmit} style={{ display:'flex',flexDirection:'column',gap:14 }}>
          {error && (
            <div style={{ padding:'10px 14px',borderRadius:10,background:'#fef2f2',border:'1px solid #fecaca',color:'#dc2626',fontSize:12,display:'flex',alignItems:'center',gap:7,fontFamily:"'DM Sans',sans-serif" }}>
              <AlertCircle size={13}/>{error}
            </div>
          )}

          <div>
            <label className="lv-label">National ID Number *</label>
            <input name="national_id_number" value={form.national_id_number} onChange={handleChange}
              className="lv-input" placeholder="e.g. 12345678901" required />
          </div>
          <div>
            <label className="lv-label">Phone Number *</label>
            <input type="tel" name="phone_number" value={form.phone_number} onChange={handleChange}
              className="lv-input" placeholder="+266 5800 1234" required />
          </div>
          <div>
            <label className="lv-label">National ID Document</label>
            <label style={{ display:'flex',alignItems:'center',gap:8,padding:'10px 14px',border:'1px dashed #ede8e0',borderRadius:11,cursor:'pointer',fontSize:13,color:'#9c9080',fontFamily:"'DM Sans',sans-serif",transition:'border-color 0.15s' }}
              onMouseEnter={e=>e.currentTarget.style.borderColor='#c4a882'}
              onMouseLeave={e=>e.currentTarget.style.borderColor='#ede8e0'}>
              <Upload size={14} style={{ color:'#c4a882' }}/>
              {form.id_document ? form.id_document.name : 'Upload ID document (PDF, JPG, PNG)'}
              <input type="file" name="id_document" onChange={handleChange} accept=".pdf,.jpg,.jpeg,.png" style={{ display:'none' }}/>
            </label>
          </div>


          <div style={{ padding:'12px 14px',background:'#faf7f3',borderRadius:10,border:'1px solid #ede8e0' }}>
            <p style={{ fontSize:11.5,color:'#7a7060',lineHeight:1.7,fontFamily:"'DM Sans',sans-serif" }}>
              Your ID is reviewed within 1-2 business days to confirm you are a real person. Once approved, a verified badge will appear on all your listings permanently — no re-submission needed for future properties.
            </p>
          </div>

          <button type="submit" disabled={submitting}
            style={{ padding:'12px',borderRadius:11,background:submitting?'#7a7060':'#1c1a17',color:'#fff',border:'none',fontSize:13,fontWeight:500,cursor:submitting?'not-allowed':'pointer',fontFamily:"'DM Sans',sans-serif",display:'flex',alignItems:'center',justifyContent:'center',gap:7,transition:'background 0.15s' }}
            onMouseEnter={e=>!submitting&&(e.currentTarget.style.background='#3a3430')}
            onMouseLeave={e=>e.currentTarget.style.background=submitting?'#7a7060':'#1c1a17'}>
            <Shield size={14}/>{submitting ? 'Submitting…' : 'Submit for Verification'}
          </button>
        </form>
      )}
    </div>
  );
};

export default LandlordVerification;