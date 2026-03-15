import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useLanguage } from '../contexts/LanguageContext';
import { Eye, EyeOff, ArrowRight, Building2, User } from 'lucide-react';

const Register = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({ username: '', email: '', password: '', confirmPassword: '', isLandlord: false });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (formData.password !== formData.confirmPassword) { setError(t('passwords_do_not_match')); return; }
    if (!/\S+@\S+\.\S+/.test(formData.email)) { setError(t('invalid_email_format')); return; }
    setLoading(true);
    try {
      await register(formData.username, formData.email, formData.password, formData.isLandlord);
      navigate('/dashboard');
    } catch (err) {
      const errorMsg = err.username?.[0] || err.email?.[0] || err.password?.[0] || err.non_field_errors?.[0] || err.error || t('registration_failed');
      setError(errorMsg);
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400&family=DM+Sans:wght@300;400;500&display=swap');
        .auth-input {
          width: 100%; padding: 13px 16px;
          border: 1px solid #ede8e0; border-radius: 12px;
          font-size: 14px; font-family: 'DM Sans', sans-serif;
          color: #1c1a17; background: #fff; outline: none;
          transition: border-color 0.18s, box-shadow 0.18s;
        }
        .auth-input:focus { border-color: #c4a882; box-shadow: 0 0 0 3px rgba(196,168,130,0.15); }
        .auth-input::placeholder { color: #c4bdb4; }
        .auth-label { display: block; font-size: 12px; font-weight: 500; letter-spacing: 0.04em; text-transform: uppercase; color: #9c9080; margin-bottom: 8px; }
        .role-card {
          flex: 1; padding: 14px; border-radius: 12px; border: 1.5px solid #ede8e0;
          cursor: pointer; transition: all 0.15s; display: flex; flex-direction: column; align-items: center; gap: 6px; text-align: center;
          background: #fff;
        }
        .role-card.selected { border-color: #1c1a17; background: #faf7f3; }
        .role-card:hover { border-color: #c4bdb4; }
      `}</style>

      {/* Left brand panel */}
      <div className="hidden lg:flex lg:w-5/12 relative overflow-hidden flex-col justify-between p-12"
        style={{ background: '#1c1a17' }}>
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, #d4a96a 0%, transparent 50%)' }} />
        <div className="relative z-10">
          <a href="/" style={{ display:'flex',alignItems:'center',gap:10,textDecoration:'none' }}>
            <span style={{ fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:700,color:'#fff' }}>Lehae</span>
            <span style={{ width:7,height:7,borderRadius:'50%',background:'#d4a96a' }} />
          </a>
        </div>
        <div className="relative z-10">
          <p style={{ fontFamily:"'Playfair Display',serif",fontSize:'clamp(1.8rem,3vw,2.6rem)',fontWeight:700,color:'#fff',lineHeight:1.2,marginBottom:20 }}>
            Join thousands<br /><em style={{ fontStyle:'italic',color:'#d4a96a' }}>finding home.</em>
          </p>
          <p style={{ fontSize:14,color:'rgba(255,255,255,0.45)',lineHeight:1.8 }}>
            Register as a tenant to find your next home, or as a landlord to list your properties.
          </p>
        </div>
        <div className="relative z-10">
          <p style={{ fontSize:12,color:'rgba(255,255,255,0.25)' }}>Secure · Verified · No middlemen</p>
        </div>
      </div>

      {/* Right form */}
      <motion.div
        className="flex-1 flex items-center justify-center p-6 lg:p-16 overflow-y-auto"
        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}
      >
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: '#d4a96a' }}>Create account</p>
            <h2 className="font-heading font-bold text-secondary" style={{ fontSize: '2rem' }}>{t('join_lehae')}</h2>
          </div>

          {error && (
            <motion.div initial={{ opacity:0,y:-8 }} animate={{ opacity:1,y:0 }}
              className="mb-5 p-4 rounded-xl text-sm"
              style={{ background:'#fef2f2',border:'1px solid #fecaca',color:'#dc2626' }}>
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role picker */}
            <div>
              <label className="auth-label">I am a</label>
              <div style={{ display:'flex',gap:10 }}>
                <button type="button" className={`role-card ${!formData.isLandlord ? 'selected' : ''}`}
                  onClick={() => setFormData(f=>({...f,isLandlord:false}))}>
                  <User size={18} style={{ color: !formData.isLandlord ? '#1c1a17' : '#c4bdb4' }} />
                  <span style={{ fontSize:13,fontWeight:500,color: !formData.isLandlord ? '#1c1a17' : '#9c9080' }}>Tenant</span>
                </button>
                <button type="button" className={`role-card ${formData.isLandlord ? 'selected' : ''}`}
                  onClick={() => setFormData(f=>({...f,isLandlord:true}))}>
                  <Building2 size={18} style={{ color: formData.isLandlord ? '#1c1a17' : '#c4bdb4' }} />
                  <span style={{ fontSize:13,fontWeight:500,color: formData.isLandlord ? '#1c1a17' : '#9c9080' }}>Landlord</span>
                </button>
              </div>
            </div>

            <div>
              <label className="auth-label">{t('username')}</label>
              <input type="text" name="username" value={formData.username} onChange={handleChange} required className="auth-input" />
            </div>
            <div>
              <label className="auth-label">{t('email')}</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} required className="auth-input" />
            </div>
            <div>
              <label className="auth-label">{t('password')}</label>
              <div style={{ position:'relative' }}>
                <input type={showPassword?'text':'password'} name="password" value={formData.password}
                  onChange={handleChange} required className="auth-input" style={{ paddingRight:44 }} />
                <button type="button" onClick={()=>setShowPassword(!showPassword)}
                  style={{ position:'absolute',right:13,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'#c4bdb4',padding:0 }}>
                  {showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
            </div>
            <div>
              <label className="auth-label">{t('confirm_password')}</label>
              <div style={{ position:'relative' }}>
                <input type={showConfirm?'text':'password'} name="confirmPassword" value={formData.confirmPassword}
                  onChange={handleChange} required className="auth-input" style={{ paddingRight:44 }} />
                <button type="button" onClick={()=>setShowConfirm(!showConfirm)}
                  style={{ position:'absolute',right:13,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'#c4bdb4',padding:0 }}>
                  {showConfirm ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3.5 rounded-xl font-medium text-white text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              style={{ background:'#1c1a17',marginTop:8 }}
              onMouseEnter={e=>!loading&&(e.currentTarget.style.background='#3a3430')}
              onMouseLeave={e=>e.currentTarget.style.background='#1c1a17'}
            >
              {loading ? t('registering') : <>{t('register')} <ArrowRight size={15}/></>}
            </button>
          </form>

          <p className="mt-6 text-center text-sm" style={{ color:'#9c9080' }}>
            {t('already_a_member')}{' '}
            <a href="/login" style={{ color:'#c4a882',textDecoration:'none',fontWeight:500 }}>{t('login_now')}</a>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;