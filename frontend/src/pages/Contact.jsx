import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import axiosInstance from '../utils/axios.js';
import { motion } from 'framer-motion';
import { Send, Check, AlertCircle, Mail, Phone, MapPin } from 'lucide-react';

const Contact = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({ tenant_name:'', tenant_email:'', message:'', property_id:'' });
  const [error, setError]   = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');
    try {
      await axiosInstance.post('/api/contact/', {
        tenant_name:  formData.tenant_name,
        tenant_email: formData.tenant_email,
        message:      formData.message,
        // Only send property if a valid ID was entered, otherwise null
        property: formData.property_id && formData.property_id.trim() !== ''
          ? formData.property_id.trim()
          : null,
      });
      setSuccess(t('Message sent successfully!'));
      setFormData({ tenant_name:'', tenant_email:'', message:'', property_id:'' });
    } catch {
      setError(t('Failed to send message. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-enter min-h-screen bg-neutral-50">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@400;500&display=swap');
        .ct-input { width:100%; padding:12px 14px; border:1px solid #ede8e0; border-radius:12px; font-size:14px; font-family:'DM Sans',sans-serif; color:#1c1a17; background:#fff; outline:none; transition:border-color 0.18s,box-shadow 0.18s; }
        .ct-input:focus { border-color:#c4a882; box-shadow:0 0 0 3px rgba(196,168,130,0.12); }
        .ct-input::placeholder { color:#c4bdb4; }
        .ct-label { font-size:11px; font-weight:500; letter-spacing:0.06em; text-transform:uppercase; color:#9c9080; margin-bottom:7px; display:block; }
        .ct-info-row { display:flex; align-items:flex-start; gap:12px; padding:16px 0; border-bottom:1px solid #f3ede6; }
        .ct-info-row:last-child { border-bottom:none; }
      `}</style>

      {/* Header */}
      <div style={{ background:'#1c1a17', paddingTop:48, paddingBottom:48 }}>
        <div className="max-w-5xl mx-auto px-6">
          <p style={{ fontSize:11,fontWeight:600,letterSpacing:'0.1em',textTransform:'uppercase',color:'#d4a96a',marginBottom:8 }}>Get in touch</p>
          <h1 style={{ fontFamily:"'Playfair Display',serif",fontSize:'clamp(1.8rem,4vw,2.8rem)',fontWeight:700,color:'#fff' }}>Contact Us</h1>
          <p style={{ fontSize:14,color:'rgba(255,255,255,0.45)',marginTop:8,maxWidth:440,lineHeight:1.7 }}>
            Have a question about a listing, need help with your account, or want to report an issue? We're here to help.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

          {/* Contact info */}
          <div className="lg:col-span-2">
            <div style={{ background:'#fff',border:'1px solid #ede8e0',borderRadius:20,padding:28,marginBottom:16 }}>
              <p style={{ fontFamily:"'Playfair Display',serif",fontSize:17,fontWeight:700,color:'#1c1a17',marginBottom:20 }}>
                Contact Details
              </p>
              {[
                { icon:Mail,    label:'Email',    value:'trusthutsolutions@gmail.com', href:'mailto:trusthutsolutions@gmail.com' },
                { icon:Phone,   label:'Phone',    value:'+266 6309 1719',              href:'tel:+26663091719' },
                { icon:MapPin,  label:'Location', value:'Maseru, Lesotho',             href:null },
              ].map(({ icon:Icon, label, value, href }) => (
                <div key={label} className="ct-info-row">
                  <div style={{ width:36,height:36,borderRadius:10,background:'#faf7f3',border:'1px solid #ede8e0',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                    <Icon size={15} style={{ color:'#d4a96a' }}/>
                  </div>
                  <div>
                    <p style={{ fontSize:11,fontWeight:600,letterSpacing:'0.05em',textTransform:'uppercase',color:'#9c9080',marginBottom:3,fontFamily:"'DM Sans',sans-serif" }}>{label}</p>
                    {href ? (
                      <a href={href} style={{ fontSize:13,color:'#1c1a17',textDecoration:'none',fontFamily:"'DM Sans',sans-serif",fontWeight:500 }}>{value}</a>
                    ) : (
                      <p style={{ fontSize:13,color:'#1c1a17',fontFamily:"'DM Sans',sans-serif",fontWeight:500 }}>{value}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ background:'#1c1a17',borderRadius:20,padding:24 }}>
              <p style={{ fontFamily:"'Playfair Display',serif",fontSize:15,fontWeight:700,color:'#fff',marginBottom:8 }}>Response time</p>
              <p style={{ fontSize:13,color:'rgba(255,255,255,0.5)',lineHeight:1.7,fontFamily:"'DM Sans',sans-serif" }}>
                We typically respond within 24 hours on business days.
              </p>
            </div>
          </div>

          {/* Form */}
          <motion.div className="lg:col-span-3" initial={{ opacity:0,x:16 }} animate={{ opacity:1,x:0 }} transition={{ delay:0.1 }}>
            <div style={{ background:'#fff',border:'1px solid #ede8e0',borderRadius:20,padding:28 }}>
              <p style={{ fontFamily:"'Playfair Display',serif",fontSize:17,fontWeight:700,color:'#1c1a17',marginBottom:20 }}>
                Send a Message
              </p>

              {success && (
                <div style={{ marginBottom:16,padding:'12px 16px',borderRadius:11,background:'#f0fdf4',border:'1px solid #86efac',color:'#16a34a',fontSize:13,display:'flex',alignItems:'center',gap:8,fontFamily:"'DM Sans',sans-serif" }}>
                  <Check size={15}/>{success}
                </div>
              )}
              {error && (
                <div style={{ marginBottom:16,padding:'12px 16px',borderRadius:11,background:'#fef2f2',border:'1px solid #fecaca',color:'#dc2626',fontSize:13,display:'flex',alignItems:'center',gap:8,fontFamily:"'DM Sans',sans-serif" }}>
                  <AlertCircle size={15}/>{error}
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display:'flex',flexDirection:'column',gap:16 }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="ct-label">{t('Name')} *</label>
                    <input type="text" name="tenant_name" value={formData.tenant_name} onChange={handleChange} className="ct-input" placeholder="Your full name" required />
                  </div>
                  <div>
                    <label className="ct-label">{t('Email')} *</label>
                    <input type="email" name="tenant_email" value={formData.tenant_email} onChange={handleChange} className="ct-input" placeholder="your@email.com" required />
                  </div>
                </div>
                <div>
                  <label className="ct-label">Property ID (optional)</label>
                  <input type="text" name="property_id" value={formData.property_id} onChange={handleChange} className="ct-input" placeholder="If enquiring about a specific listing" />
                </div>
                <div>
                  <label className="ct-label">{t('Message')} *</label>
                  <textarea name="message" value={formData.message} onChange={handleChange} className="ct-input"
                    style={{ minHeight:130,resize:'vertical',lineHeight:1.7 }}
                    placeholder="Tell us what you need help with…" required />
                </div>
                <button type="submit" disabled={loading}
                  style={{ padding:'13px',borderRadius:12,background:loading?'#7a7060':'#1c1a17',color:'#fff',border:'none',fontSize:14,fontWeight:500,cursor:loading?'not-allowed':'pointer',fontFamily:"'DM Sans',sans-serif",display:'flex',alignItems:'center',justifyContent:'center',gap:8,transition:'background 0.18s' }}
                  onMouseEnter={e=>!loading&&(e.currentTarget.style.background='#3a3430')}
                  onMouseLeave={e=>e.currentTarget.style.background=loading?'#7a7060':'#1c1a17'}>
                  <Send size={15}/>{loading ? 'Sending…' : t('Send')}
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Contact;