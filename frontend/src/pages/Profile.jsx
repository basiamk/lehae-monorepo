import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axiosInstance from '../utils/axios.js';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Button from '../components/common/Button';
import { useLanguage } from '../contexts/LanguageContext';
import { Edit2, Check, X, Shield, KeyRound, Trash2 } from 'lucide-react';
import LandlordVerification from '../components/LandlordVerification.jsx';
import SupportChat from '../components/SupportChat.jsx';

const Profile = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', bio: '' });
  const [errors, setErrors] = useState({});
  const [updateSuccess, setUpdateSuccess] = useState(false);

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/api/profile/');
      setProfile(response.data);
      setFormData({ name: response.data.full_name || '', email: response.data.email || '', phone: response.data.phone || '', bio: response.data.bio || '' });
      setError(null);
    } catch (err) {
      setError(t('failed_to_fetch_profile_please_try_again_later'));
    } finally { setLoading(false); }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name) newErrors.name = t('name_is_required');
    if (!formData.email) newErrors.email = t('email_is_required');
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = t('email_is_invalid');
    if (formData.phone && !/^\+?[\d\s-]{10,}$/.test(formData.phone)) newErrors.phone = t('phone_number_is_invalid');
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUpdateSuccess(false);
    if (!validateForm()) return;
    try {
      await axiosInstance.put('/api/profile/', { full_name: formData.name, email: formData.email, phone: formData.phone, bio: formData.bio });
      setProfile(prev => ({ ...prev, ...formData }));
      setIsEditing(false);
      setUpdateSuccess(true);
      setTimeout(() => setUpdateSuccess(false), 3000);
    } catch (err) {
      setError(t('failed_to_update_profile_please_try_again_later'));
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><LoadingSpinner size="lg" /></div>;
  if (error && !profile) return (
    <div className="text-center py-16">
      <p className="text-red-600 mb-4">{error}</p>
      <Button onClick={fetchProfile}>{t('try_again')}</Button>
    </div>
  );

  const initials = (profile?.name || user?.username || 'U').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();

  return (
    <div className="min-h-screen bg-neutral-50">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@400;500&display=swap');
        .prof-input {
          width:100%; padding:11px 14px; border:1px solid #ede8e0; border-radius:12px;
          font-size:14px; font-family:'DM Sans',sans-serif; color:#1c1a17; background:#fff;
          outline:none; transition:border-color 0.18s, box-shadow 0.18s;
        }
        .prof-input:focus { border-color:#c4a882; box-shadow:0 0 0 3px rgba(196,168,130,0.15); }
        .prof-input:disabled { background:#faf7f3; color:#9c9080; cursor:not-allowed; }
        .prof-input.error { border-color:#fca5a5; }
        .prof-label { display:block; font-size:11px; font-weight:500; letter-spacing:0.06em; text-transform:uppercase; color:#9c9080; margin-bottom:7px; }
        .prof-card { background:#fff; border:1px solid #ede8e0; border-radius:20px; }
        .settings-row { display:flex; align-items:center; justify-content:space-between; padding:16px 0; border-bottom:1px solid #f3ede6; }
        .settings-row:last-child { border-bottom:none; }
      `}</style>

      {/* Header */}
      <div style={{ background:'#1c1a17', paddingTop:48, paddingBottom:64 }}>
        <div className="max-w-4xl mx-auto px-6 flex items-center gap-6">
          <div style={{ width:72,height:72,borderRadius:'50%',background:'linear-gradient(135deg,#d4a96a,#c4a882)',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Playfair Display',serif",fontSize:26,fontWeight:700,color:'#fff',flexShrink:0 }}>
            {initials}
          </div>
          <div>
            <p style={{ fontSize:11,fontWeight:600,letterSpacing:'0.1em',textTransform:'uppercase',color:'#d4a96a',marginBottom:6 }}>Your profile</p>
            <h1 style={{ fontFamily:"'Playfair Display',serif",fontSize:'clamp(1.6rem,3vw,2.2rem)',fontWeight:700,color:'#fff' }}>
              {profile?.name || user?.username}
            </h1>
            <p style={{ fontSize:13,color:'rgba(255,255,255,0.4)',marginTop:4 }}>{profile?.email}</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 -mt-8 pb-16">

        {updateSuccess && (
          <motion.div initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}}
            className="mb-5 p-4 rounded-xl text-sm flex items-center gap-3"
            style={{background:'#f0fdf4',border:'1px solid #86efac',color:'#16a34a'}}>
            <Check size={16}/> {t('profile_updated_successfully')}
          </motion.div>
        )}
        {error && profile && (
          <div className="mb-5 p-4 rounded-xl text-sm" style={{background:'#fef2f2',border:'1px solid #fecaca',color:'#dc2626'}}>{error}</div>
        )}

        {/* Profile form */}
        <motion.div className="prof-card p-8 mb-6" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:28}}>
            <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:700,color:'#1c1a17'}}>{t('profile_settings')}</h2>
            {!isEditing && (
              <button onClick={()=>setIsEditing(true)}
                style={{display:'flex',alignItems:'center',gap:6,fontSize:13,fontWeight:500,color:'#c4a882',background:'none',border:'1px solid #ede8e0',borderRadius:10,padding:'7px 14px',cursor:'pointer',fontFamily:"'DM Sans',sans-serif",transition:'all 0.15s'}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor='#c4a882';e.currentTarget.style.background='#faf7f3';}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor='#ede8e0';e.currentTarget.style.background='none';}}>
                <Edit2 size={13}/> {t('edit_profile')}
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
              {[
                {id:'name', label:t('full_name'), type:'text'},
                {id:'email',label:t('email_address'),type:'email'},
                {id:'phone',label:t('phone_number'),type:'tel'},
              ].map(({id,label,type})=>(
                <div key={id}>
                  <label className="prof-label">{label}</label>
                  <input type={type} name={id} id={id} value={formData[id]} onChange={handleChange}
                    disabled={!isEditing} className={`prof-input ${errors[id]?'error':''}`} />
                  {errors[id] && <p style={{fontSize:11,color:'#dc2626',marginTop:4}}>{errors[id]}</p>}
                </div>
              ))}
            </div>
            <div className="mb-6">
              <label className="prof-label">{t('bio')}</label>
              <textarea name="bio" id="bio" rows={4} value={formData.bio} onChange={handleChange}
                disabled={!isEditing}
                className="prof-input" style={{resize:'vertical',lineHeight:1.6}} />
            </div>
            {isEditing && (
              <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
                <button type="button"
                  onClick={()=>{setIsEditing(false);setFormData({name:profile.full_name||'',email:profile.email||'',phone:profile.phone||'',bio:profile.bio||''});setErrors({});}}
                  style={{display:'flex',alignItems:'center',gap:6,padding:'9px 18px',borderRadius:10,border:'1px solid #ede8e0',background:'#fff',color:'#7a7060',fontSize:13,fontWeight:500,cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>
                  <X size={13}/> {t('cancel')}
                </button>
                <button type="submit"
                  style={{display:'flex',alignItems:'center',gap:6,padding:'9px 18px',borderRadius:10,background:'#1c1a17',color:'#fff',border:'none',fontSize:13,fontWeight:500,cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>
                  <Check size={13}/> {t('save_changes')}
                </button>
              </div>
            )}
          </form>
        </motion.div>

        {/* Profile completeness banner for landlords */}
        {user?.is_landlord && (() => {
          const missing = [];
          if (!formData.name)  missing.push('full name');
          if (!formData.phone) missing.push('phone number');
          return missing.length > 0 ? (
            <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}}
              style={{ background:'rgba(245,158,11,0.08)',border:'1px solid rgba(245,158,11,0.3)',borderRadius:16,padding:'16px 20px',display:'flex',alignItems:'flex-start',gap:12 }}>
              <div style={{ fontSize:20,flexShrink:0 }}>⚠️</div>
              <div>
                <p style={{ fontFamily:"'Playfair Display',serif",fontSize:15,fontWeight:700,color:'#1c1a17',marginBottom:4 }}>
                  Complete your profile before submitting for verification
                </p>
                <p style={{ fontSize:13,color:'#7a7060',lineHeight:1.6,fontFamily:"'DM Sans',sans-serif",margin:0 }}>
                  Your {missing.join(' and ')} {missing.length > 1 ? 'are' : 'is'} missing. The Lehae team needs these to cross-reference your ID document when reviewing your verification request.
                </p>
              </div>
            </motion.div>
          ) : null;
        })()}

        {/* Account settings */}
        <motion.div className="prof-card p-8" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:0.1}}>
          <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:700,color:'#1c1a17',marginBottom:24}}>{t('account_settings')}</h2>
          {[
            {icon:KeyRound, title:t('change_password'), desc:t('update_your_password_regularly_to_keep_your_account_secure'), label:t('change'), color:'#7a7060'},
            {icon:Shield,   title:t('two_factor_authentication'), desc:t('add_an_extra_layer_of_security_to_your_account'), label:t('enable'), color:'#7a7060'},
            {icon:Trash2,   title:t('delete_account'), desc:t('permanently_delete_your_account_and_all_associated_data'), label:t('delete'), color:'#dc2626', danger:true},
          ].map(({icon:Icon,title,desc,label,color,danger})=>(
            <div key={title} className="settings-row">
              <div style={{display:'flex',alignItems:'flex-start',gap:12}}>
                <div style={{width:36,height:36,borderRadius:10,background:danger?'#fef2f2':'#faf7f3',border:`1px solid ${danger?'#fecaca':'#ede8e0'}`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                  <Icon size={15} style={{color}} />
                </div>
                <div>
                  <p style={{fontSize:14,fontWeight:500,color:danger?'#dc2626':'#1c1a17'}}>{title}</p>
                  <p style={{fontSize:12,color:'#9c9080',marginTop:2}}>{desc}</p>
                </div>
              </div>
              <button style={{padding:'7px 14px',borderRadius:10,border:`1px solid ${danger?'#fecaca':'#ede8e0'}`,background:danger?'#fef2f2':'#fff',color:danger?'#dc2626':'#7a7060',fontSize:12,fontWeight:500,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",flexShrink:0,marginLeft:16}}>
                {label}
              </button>
            </div>
          ))}
        </motion.div>

        {/* Landlord verification */}
        {user?.is_landlord && (
          <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:0.2}}>
            <LandlordVerification />
          </motion.div>
        )}

        {/* Support chat — visible to landlords */}
        {user?.is_landlord && (
          <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:0.25}}>
            <SupportChat />
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Profile;