import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../utils/axios.js';
import { Mail, ArrowLeft, Check, AlertCircle } from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail]     = useState('');
  const [sent, setSent]       = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) { setError('Please enter your email address.'); return; }
    setLoading(true); setError('');
    try {
      await axiosInstance.post('/api/password-reset/', { email: email.trim() });
      setSent(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@400;500&display=swap');
        .fp-input { width:100%; padding:12px 14px; border:1px solid #ede8e0; border-radius:12px; font-size:14px; font-family:'DM Sans',sans-serif; color:#1c1a17; outline:none; transition:border-color 0.18s; }
        .fp-input:focus { border-color:#c4a882; box-shadow:0 0 0 3px rgba(196,168,130,0.12); }
      `}</style>

      <div style={{ width:'100%', maxWidth:400 }}>
        <Link to="/login" style={{ display:'inline-flex',alignItems:'center',gap:6,fontSize:13,color:'#9c9080',textDecoration:'none',marginBottom:24 }}>
          <ArrowLeft size={14}/> Back to login
        </Link>

        <div style={{ background:'#fff',border:'1px solid #ede8e0',borderRadius:20,padding:32 }}>
          <div style={{ width:48,height:48,borderRadius:14,background:'#faf7f3',border:'1px solid #ede8e0',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:20 }}>
            <Mail size={22} style={{ color:'#d4a96a' }}/>
          </div>

          {sent ? (
            <div style={{ textAlign:'center',padding:'8px 0' }}>
              <div style={{ width:52,height:52,borderRadius:'50%',background:'rgba(34,197,94,0.1)',border:'1px solid #86efac',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px' }}>
                <Check size={24} style={{ color:'#22c55e' }}/>
              </div>
              <h2 style={{ fontFamily:"'Playfair Display',serif",fontSize:20,fontWeight:700,color:'#1c1a17',marginBottom:8 }}>Check your inbox</h2>
              <p style={{ fontSize:14,color:'#7a7060',lineHeight:1.7,fontFamily:"'DM Sans',sans-serif" }}>
                If <strong>{email}</strong> is registered, we've sent a password reset link. Check your spam folder if you don't see it within a few minutes.
              </p>
              <Link to="/login" style={{ display:'inline-block',marginTop:20,padding:'10px 24px',borderRadius:12,background:'#1c1a17',color:'#fff',fontSize:14,fontWeight:500,textDecoration:'none',fontFamily:"'DM Sans',sans-serif" }}>
                Back to login
              </Link>
            </div>
          ) : (
            <>
              <h2 style={{ fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:700,color:'#1c1a17',marginBottom:8 }}>Forgot password?</h2>
              <p style={{ fontSize:13,color:'#9c9080',lineHeight:1.6,fontFamily:"'DM Sans',sans-serif",marginBottom:24 }}>
                Enter the email address on your account and we'll send you a reset link.
              </p>

              {error && (
                <div style={{ marginBottom:16,padding:'10px 14px',borderRadius:10,background:'#fef2f2',border:'1px solid #fecaca',color:'#dc2626',fontSize:13,display:'flex',alignItems:'center',gap:7,fontFamily:"'DM Sans',sans-serif" }}>
                  <AlertCircle size={14}/>{error}
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display:'flex',flexDirection:'column',gap:14 }}>
                <div>
                  <label style={{ display:'block',fontSize:11,fontWeight:500,letterSpacing:'0.06em',textTransform:'uppercase',color:'#9c9080',marginBottom:6,fontFamily:"'DM Sans',sans-serif" }}>Email Address</label>
                  <input type="email" className="fp-input" value={email} onChange={e=>setEmail(e.target.value)} placeholder="your@email.com" required autoFocus/>
                </div>
                <button type="submit" disabled={loading}
                  style={{ padding:'13px',borderRadius:12,background:loading?'#7a7060':'#1c1a17',color:'#fff',border:'none',fontSize:14,fontWeight:500,cursor:loading?'not-allowed':'pointer',fontFamily:"'DM Sans',sans-serif",transition:'background 0.15s' }}>
                  {loading ? 'Sending…' : 'Send reset link'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;