import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axiosInstance from '../utils/axios.js';
import { Lock, Eye, EyeOff, Check, X, ChevronDown, ChevronUp } from 'lucide-react';

const PASSWORD_RULES = [
  { key: 'length', label: 'At least 7 characters', test: (p) => p.length >= 7 },
  { key: 'upper',  label: 'One uppercase letter',   test: (p) => /[A-Z]/.test(p) },
  { key: 'lower',  label: 'One lowercase letter',   test: (p) => /[a-z]/.test(p) },
  { key: 'digit',  label: 'One number',             test: (p) => /\d/.test(p) },
];

/**
 * ChangePasswordForm — a collapsible section for the Profile page.
 * Self-contained: manages its own open/closed state, form state, and
 * submits directly to /api/change-password/.
 */
const ChangePasswordForm = () => {
  const [open, setOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew]         = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const passwordChecks = PASSWORD_RULES.map(rule => ({ ...rule, passed: rule.test(newPassword) }));
  const passwordValid  = passwordChecks.every(c => c.passed);

  const reset = () => {
    setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    setError(''); setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');

    if (newPassword !== confirmPassword) { setError("New passwords don't match."); return; }
    if (!passwordValid) { setError('Please meet all password requirements.'); return; }

    setLoading(true);
    try {
      await axiosInstance.post('/api/change-password/', {
        current_password: currentPassword,
        new_password: newPassword,
      });
      setSuccess('Password changed successfully.');
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      const msg = err.response?.data?.error;
      setError(Array.isArray(msg) ? msg.join(' ') : (msg || 'Failed to change password.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background:'#fff', border:'1px solid #ede8e0', borderRadius:20, overflow:'hidden' }}>
      <style>{`
        .cp-input {
          width:100%; padding:11px 40px 11px 14px; border:1px solid #ede8e0; border-radius:11px;
          font-size:13.5px; font-family:'DM Sans',sans-serif; color:#1c1a17; background:#fff;
          outline:none; transition:border-color 0.18s;
        }
        .cp-input:focus { border-color:#c4a882; box-shadow:0 0 0 3px rgba(196,168,130,0.12); }
        .cp-eye { position:absolute; right:12px; top:50%; transform:translateY(-50%); background:none; border:none; cursor:pointer; color:#c4bdb4; padding:0; }
        .cp-rule { display:flex; align-items:center; gap:6px; font-size:11.5px; transition:color 0.15s; }
        .cp-rule.passed { color:#22c55e; }
        .cp-rule.pending { color:#b5a898; }
      `}</style>

      <button
        onClick={() => { setOpen(o => !o); if (open) reset(); }}
        style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 24px', background:'none', border:'none', cursor:'pointer', textAlign:'left' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:'#faf7f3', border:'1px solid #ede8e0', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Lock size={15} style={{ color:'#d4a96a' }}/>
          </div>
          <p style={{ fontFamily:"'Playfair Display',serif", fontSize:16, fontWeight:700, color:'#1c1a17', margin:0 }}>Change Password</p>
        </div>
        {open ? <ChevronUp size={16} style={{ color:'#9c9080' }}/> : <ChevronDown size={16} style={{ color:'#9c9080' }}/>}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} exit={{ opacity:0, height:0 }} transition={{ duration:0.2 }}>
            <div style={{ borderTop:'1px solid #f3ede6', padding:'20px 24px 24px' }}>
              <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:14 }}>

                <div>
                  <label style={{ display:'block', fontSize:11, fontWeight:500, letterSpacing:'0.05em', textTransform:'uppercase', color:'#9c9080', marginBottom:6, fontFamily:"'DM Sans',sans-serif" }}>
                    Current Password
                  </label>
                  <div style={{ position:'relative' }}>
                    <input type={showCurrent ? 'text' : 'password'} value={currentPassword}
                      onChange={e => setCurrentPassword(e.target.value)} required className="cp-input" autoComplete="current-password" />
                    <button type="button" className="cp-eye" onClick={() => setShowCurrent(s => !s)}>
                      {showCurrent ? <EyeOff size={15}/> : <Eye size={15}/>}
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ display:'block', fontSize:11, fontWeight:500, letterSpacing:'0.05em', textTransform:'uppercase', color:'#9c9080', marginBottom:6, fontFamily:"'DM Sans',sans-serif" }}>
                    New Password
                  </label>
                  <div style={{ position:'relative' }}>
                    <input type={showNew ? 'text' : 'password'} value={newPassword}
                      onChange={e => setNewPassword(e.target.value)} required className="cp-input" autoComplete="new-password" />
                    <button type="button" className="cp-eye" onClick={() => setShowNew(s => !s)}>
                      {showNew ? <EyeOff size={15}/> : <Eye size={15}/>}
                    </button>
                  </div>
                  {newPassword && (
                    <div style={{ marginTop:8, padding:'9px 11px', background:'#faf7f3', borderRadius:9, border:'1px solid #ede8e0', display:'flex', flexDirection:'column', gap:4 }}>
                      {passwordChecks.map(({ key, label, passed }) => (
                        <div key={key} className={`cp-rule ${passed ? 'passed' : 'pending'}`}>
                          {passed ? <Check size={11}/> : <X size={11} style={{ opacity:0.4 }}/>}
                          {label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ display:'block', fontSize:11, fontWeight:500, letterSpacing:'0.05em', textTransform:'uppercase', color:'#9c9080', marginBottom:6, fontFamily:"'DM Sans',sans-serif" }}>
                    Confirm New Password
                  </label>
                  <input type={showNew ? 'text' : 'password'} value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)} required className="cp-input" style={{ paddingRight:14 }} autoComplete="new-password" />
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p style={{ fontSize:11, color:'#dc2626', marginTop:5, fontFamily:"'DM Sans',sans-serif" }}>Passwords don't match</p>
                  )}
                </div>

                {error && (
                  <div style={{ padding:'10px 14px', borderRadius:10, background:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626', fontSize:12.5, fontFamily:"'DM Sans',sans-serif" }}>
                    {error}
                  </div>
                )}
                {success && (
                  <div style={{ padding:'10px 14px', borderRadius:10, background:'#f0fdf4', border:'1px solid #86efac', color:'#16a34a', fontSize:12.5, fontFamily:"'DM Sans',sans-serif" }}>
                    {success}
                  </div>
                )}

                <button type="submit" disabled={loading}
                  style={{ padding:'11px', borderRadius:11, background: loading ? '#c4bdb4' : '#1c1a17', color:'#fff', border:'none', fontSize:13, fontWeight:500, cursor: loading ? 'not-allowed' : 'pointer', fontFamily:"'DM Sans',sans-serif" }}>
                  {loading ? 'Updating…' : 'Update Password'}
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChangePasswordForm;