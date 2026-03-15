import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../utils/axios.js';
import { KeyRound, Check, AlertCircle, Eye, EyeOff } from 'lucide-react';

const ResetPassword = () => {
  const { uid, token } = useParams();
  const navigate        = useNavigate();
  const [password, setPassword]   = useState('');
  const [confirm, setConfirm]     = useState('');
  const [showPw, setShowPw]       = useState(false);
  const [loading, setLoading]     = useState(false);
  const [success, setSuccess]     = useState(false);
  const [error, setError]         = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setLoading(true); setError('');
    try {
      await axiosInstance.post('/api/password-reset/confirm/', { uid, token, password });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      setError(err.response?.data?.error || 'Reset link is invalid or has expired.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@400;500&display=swap');
        .rp-input { width:100%; padding:12px 44px 12px 14px; border:1px solid #ede8e0; border-radius:12px; font-size:14px; font-family:'DM Sans',sans-serif; color:#1c1a17; outline:none; transition:border-color 0.18s; }
        .rp-input:focus { border-color:#c4a882; box-shadow:0 0 0 3px rgba(196,168,130,0.12); }
      `}</style>

      <div style={{ width:'100%', maxWidth:400 }}>
        <div style={{ background:'#fff',border:'1px solid #ede8e0',borderRadius:20,padding:32 }}>
          <div style={{ width:48,height:48,borderRadius:14,background:'#faf7f3',border:'1px solid #ede8e0',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:20 }}>
            <KeyRound size={22} style={{ color:'#d4a96a' }}/>
          </div>

          {success ? (
            <div style={{ textAlign:'center',padding:'8px 0' }}>
              <div style={{ width:52,height:52,borderRadius:'50%',background:'rgba(34,197,94,0.1)',border:'1px solid #86efac',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px' }}>
                <Check size={24} style={{ color:'#22c55e' }}/>
              </div>
              <h2 style={{ fontFamily:"'Playfair Display',serif",fontSize:20,fontWeight:700,color:'#1c1a17',marginBottom:8 }}>Password reset!</h2>
              <p style={{ fontSize:14,color:'#7a7060',fontFamily:"'DM Sans',sans-serif" }}>Redirecting you to login…</p>
            </div>
          ) : (
            <>
              <h2 style={{ fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:700,color:'#1c1a17',marginBottom:8 }}>Set new password</h2>
              <p style={{ fontSize:13,color:'#9c9080',lineHeight:1.6,fontFamily:"'DM Sans',sans-serif",marginBottom:24 }}>
                Choose a strong password for your Lehae account.
              </p>

              {error && (
                <div style={{ marginBottom:16,padding:'10px 14px',borderRadius:10,background:'#fef2f2',border:'1px solid #fecaca',color:'#dc2626',fontSize:13,display:'flex',alignItems:'center',gap:7,fontFamily:"'DM Sans',sans-serif" }}>
                  <AlertCircle size={14}/>{error}
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display:'flex',flexDirection:'column',gap:14 }}>
                {[
                  { label:'New Password', value:password, set:setPassword },
                  { label:'Confirm Password', value:confirm, set:setConfirm },
                ].map(({ label, value, set }) => (
                  <div key={label}>
                    <label style={{ display:'block',fontSize:11,fontWeight:500,letterSpacing:'0.06em',textTransform:'uppercase',color:'#9c9080',marginBottom:6,fontFamily:"'DM Sans',sans-serif" }}>{label}</label>
                    <div style={{ position:'relative' }}>
                      <input type={showPw?'text':'password'} className="rp-input" value={value} onChange={e=>set(e.target.value)} placeholder="Min. 8 characters" required minLength={8}/>
                      <button type="button" onClick={()=>setShowPw(p=>!p)}
                        style={{ position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'#9c9080',padding:0 }}>
                        {showPw ? <EyeOff size={15}/> : <Eye size={15}/>}
                      </button>
                    </div>
                  </div>
                ))}

                {/* Strength hint */}
                {password.length > 0 && (
                  <div style={{ display:'flex',gap:4 }}>
                    {[password.length>=8, /[A-Z]/.test(password), /\d/.test(password)].map((ok,i) => (
                      <div key={i} style={{ flex:1,height:3,borderRadius:2,background:ok?'#22c55e':'#ede8e0',transition:'background 0.2s' }}/>
                    ))}
                    <span style={{ fontSize:11,color:'#9c9080',fontFamily:"'DM Sans',sans-serif",marginLeft:6,whiteSpace:'nowrap' }}>
                      {password.length<8?'Too short':/[A-Z]/.test(password)&&/\d/.test(password)?'Strong':'Could be stronger'}
                    </span>
                  </div>
                )}

                <button type="submit" disabled={loading}
                  style={{ padding:'13px',borderRadius:12,background:loading?'#7a7060':'#1c1a17',color:'#fff',border:'none',fontSize:14,fontWeight:500,cursor:loading?'not-allowed':'pointer',fontFamily:"'DM Sans',sans-serif",transition:'background 0.15s',marginTop:4 }}>
                  {loading ? 'Resetting…' : 'Reset password'}
                </button>
              </form>

              <p style={{ textAlign:'center',fontSize:13,color:'#9c9080',marginTop:20,fontFamily:"'DM Sans',sans-serif" }}>
                <Link to="/login" style={{ color:'#d4a96a',textDecoration:'none' }}>Back to login</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;