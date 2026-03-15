import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Button from '../components/common/Button.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useLanguage } from '../contexts/LanguageContext';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';

const Login = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ usernameOrEmail: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!formData.usernameOrEmail || !formData.password) {
      setError(t('please_provide_both_username_email_and_password'));
      return;
    }
    setLoading(true);
    try {
      await login(formData.usernameOrEmail, formData.password);
      navigate('/dashboard');
    } catch (err) {
      const errorMsg = err.error || err.detail || err.non_field_errors?.[0] || t('invalid_username_or_password');
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
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
        .auth-link { color: #c4a882; text-decoration: none; font-weight: 500; transition: color 0.15s; }
        .auth-link:hover { color: #a8895f; }
      `}</style>

      {/* Left panel — brand */}
      <div className="hidden lg:flex lg:w-5/12 relative overflow-hidden flex-col justify-between p-12"
        style={{ background: '#1c1a17' }}>
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, #d4a96a 0%, transparent 50%)' }} />
        <div className="relative z-10">
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700, color: '#fff' }}>Lehae</span>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#d4a96a' }} />
          </a>
        </div>
        <div className="relative z-10">
          <p style={{ fontFamily: "'Playfair Display',serif", fontSize: 'clamp(1.8rem,3vw,2.6rem)', fontWeight: 700, color: '#fff', lineHeight: 1.2, marginBottom: 20 }}>
            Find your home<br /><em style={{ fontStyle: 'italic', color: '#d4a96a' }}>in Lesotho.</em>
          </p>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', lineHeight: 1.8 }}>
            Verified listings, direct landlord connections, no middlemen.
          </p>
        </div>
        <div className="relative z-10 flex gap-6">
          {[['200+','Properties'],['10','Districts'],['500+','Members']].map(([n,l])=>(
            <div key={l}>
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:700, color:'#d4a96a' }}>{n}</div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'0.08em' }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <motion.div
        className="flex-1 flex items-center justify-center p-6 lg:p-16"
        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}
      >
        <div className="w-full max-w-sm">
          <div className="mb-10">
            <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: '#d4a96a' }}>Welcome back</p>
            <h2 className="font-heading font-bold text-secondary" style={{ fontSize: '2rem' }}>
              {t('login_to_lehae')}
            </h2>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 rounded-xl text-sm"
              style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' }}
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="auth-label">{t('username_or_email')}</label>
              <input
                type="text" name="usernameOrEmail"
                value={formData.usernameOrEmail} onChange={handleChange}
                required autoComplete="username"
                className="auth-input"
              />
            </div>
            <div>
              <label className="auth-label">{t('password')}</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'} name="password"
                  value={formData.password} onChange={handleChange}
                  required autoComplete="current-password"
                  className="auth-input" style={{ paddingRight: 44 }}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  style={{ position:'absolute', right:13, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#c4bdb4', padding:0 }}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3.5 rounded-xl font-medium text-white text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              style={{ background: '#1c1a17', marginTop: 8 }}
              onMouseEnter={e => !loading && (e.currentTarget.style.background='#3a3430')}
              onMouseLeave={e => e.currentTarget.style.background='#1c1a17'}
            >
              {loading ? t('logging_in') : <>{t('login')} <ArrowRight size={15} /></>}
            </button>
          </form>

          <p className="mt-8 text-center text-sm" style={{ color: '#9c9080' }}>
            {t('not_a_member')}{' '}
            <a href="/register" className="auth-link">{t('register_now')}</a>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;