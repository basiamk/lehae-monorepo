import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axiosInstance from '../utils/axios';
import { useAuth } from '../contexts/AuthContext';
import { X, Send, Check, AlertCircle, ChevronDown, FileText } from 'lucide-react';

const EMPLOYMENT_OPTIONS = [
  { value:'employed',      label:'Employed' },
  { value:'self_employed', label:'Self-employed' },
  { value:'student',       label:'Student' },
  { value:'unemployed',    label:'Unemployed' },
  { value:'retired',       label:'Retired' },
];

const RentalApplicationModal = ({ property, onClose }) => {
  const { user } = useAuth();
  const [step, setStep]       = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError]     = useState('');
  const [form, setForm] = useState({
    full_name:         user?.name || '',
    email:             user?.email || '',
    phone:             '',
    employment_status: 'employed',
    employer_name:     '',
    monthly_income:    '',
    num_occupants:     1,
    has_pets:          false,
    move_in_date:      '',
    references:        '',
    additional_notes:  '',
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    setError('');
  };

  const validateStep = () => {
    if (step === 1) {
      if (!form.full_name || !form.email || !form.phone) {
        setError('Please fill in your name, email and phone number.');
        return false;
      }
    }
    if (step === 2) {
      if (!form.employment_status || !form.move_in_date) {
        setError('Please fill in employment status and preferred move-in date.');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep()) { setError(''); setStep(s => s + 1); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await axiosInstance.post('/api/applications/', {
        ...form,
        property:       property.id,
        monthly_income: form.monthly_income || null,
      });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  const STEPS = ['Personal Info', 'Employment', 'Details'];

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
        style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.55)',zIndex:100,display:'flex',alignItems:'center',justifyContent:'center',padding:16,overflowY:'auto' }}
        onClick={onClose}>
        <motion.div initial={{ opacity:0,scale:0.95,y:16 }} animate={{ opacity:1,scale:1,y:0 }} exit={{ opacity:0,scale:0.95 }}
          transition={{ duration:0.2 }}
          style={{ background:'#fff',borderRadius:20,width:'100%',maxWidth:480,position:'relative',maxHeight:'90vh',overflowY:'auto' }}
          onClick={e => e.stopPropagation()}>
          <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@400;500&display=swap');
            .ra-input { width:100%; padding:11px 14px; border:1px solid #ede8e0; border-radius:11px; font-size:14px; font-family:'DM Sans',sans-serif; color:#1c1a17; background:#fff; outline:none; transition:border-color 0.18s; appearance:none; }
            .ra-input:focus { border-color:#c4a882; box-shadow:0 0 0 3px rgba(196,168,130,0.12); }
            .ra-input::placeholder { color:#c4bdb4; }
            .ra-label { font-size:11px; font-weight:500; letter-spacing:0.06em; text-transform:uppercase; color:#9c9080; margin-bottom:6px; display:block; }
            .ra-sel-wrap { position:relative; }
            .ra-sel-wrap svg { position:absolute; right:11px; top:50%; transform:translateY(-50%); pointer-events:none; color:#c4bdb4; }
          `}</style>

          {/* Header */}
          <div style={{ padding:'24px 24px 0', borderBottom:'1px solid #f3ede6', paddingBottom:18 }}>
            <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:4 }}>
              <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                <FileText size={18} style={{ color:'#d4a96a' }}/>
                <h3 style={{ fontFamily:"'Playfair Display',serif",fontSize:17,fontWeight:700,color:'#1c1a17' }}>Rental Application</h3>
              </div>
              <button onClick={onClose} style={{ background:'none',border:'none',cursor:'pointer',color:'#9c9080',padding:2 }}><X size={18}/></button>
            </div>
            <p style={{ fontSize:12,color:'#9c9080',fontFamily:"'DM Sans',sans-serif" }}>{property.area}, {property.district} · M {Number(property.rental_amount).toLocaleString()}/mo</p>

            {/* Step indicator */}
            {!success && (
              <div style={{ display:'flex',gap:6,marginTop:16 }}>
                {STEPS.map((label, i) => (
                  <div key={label} style={{ flex:1,display:'flex',flexDirection:'column',gap:4 }}>
                    <div style={{ height:3,borderRadius:2,background:i+1<=step?'#1c1a17':'#ede8e0',transition:'background 0.2s' }}/>
                    <span style={{ fontSize:10,color:i+1<=step?'#1c1a17':'#c4bdb4',fontFamily:"'DM Sans',sans-serif",fontWeight:i+1===step?600:400 }}>{label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ padding:24 }}>
            {success ? (
              <div style={{ textAlign:'center',padding:'20px 0' }}>
                <div style={{ width:52,height:52,borderRadius:'50%',background:'rgba(34,197,94,0.1)',border:'1px solid #86efac',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px' }}>
                  <Check size={22} style={{ color:'#22c55e' }}/>
                </div>
                <h3 style={{ fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:700,color:'#1c1a17',marginBottom:8 }}>Application Submitted!</h3>
                <p style={{ fontSize:13,color:'#9c9080',lineHeight:1.7,marginBottom:20 }}>
                  Your application has been sent to {property.landlord_username}. You'll receive an email when they respond.
                </p>
                <button onClick={onClose}
                  style={{ padding:'10px 24px',borderRadius:11,background:'#1c1a17',color:'#fff',border:'none',fontSize:13,fontWeight:500,cursor:'pointer',fontFamily:"'DM Sans',sans-serif" }}>
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                {error && (
                  <div style={{ marginBottom:14,padding:'10px 14px',borderRadius:10,background:'#fef2f2',border:'1px solid #fecaca',color:'#dc2626',fontSize:12,display:'flex',alignItems:'center',gap:7 }}>
                    <AlertCircle size={14}/>{error}
                  </div>
                )}

                {/* Step 1 — Personal info */}
                {step === 1 && (
                  <div style={{ display:'flex',flexDirection:'column',gap:14 }}>
                    <div><label className="ra-label">Full Name *</label><input name="full_name" value={form.full_name} onChange={handleChange} className="ra-input" placeholder="Your full legal name" required /></div>
                    <div><label className="ra-label">Email *</label><input type="email" name="email" value={form.email} onChange={handleChange} className="ra-input" placeholder="your@email.com" required /></div>
                    <div><label className="ra-label">Phone Number *</label><input type="tel" name="phone" value={form.phone} onChange={handleChange} className="ra-input" placeholder="+266 5800 1234" required /></div>
                    <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
                      <div>
                        <label className="ra-label">Occupants</label>
                        <input type="number" name="num_occupants" value={form.num_occupants} onChange={handleChange} className="ra-input" min="1" max="20" />
                      </div>
                      <div style={{ display:'flex',flexDirection:'column',justifyContent:'flex-end' }}>
                        <label style={{ display:'flex',alignItems:'center',gap:8,cursor:'pointer',paddingBottom:11 }}>
                          <input type="checkbox" name="has_pets" checked={form.has_pets} onChange={handleChange} style={{ width:16,height:16 }}/>
                          <span style={{ fontSize:13,color:'#5a5248',fontFamily:"'DM Sans',sans-serif",fontWeight:500 }}>Has pets</span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2 — Employment */}
                {step === 2 && (
                  <div style={{ display:'flex',flexDirection:'column',gap:14 }}>
                    <div>
                      <label className="ra-label">Employment Status *</label>
                      <div className="ra-sel-wrap">
                        <select name="employment_status" value={form.employment_status} onChange={handleChange} className="ra-input" style={{ cursor:'pointer' }}>
                          {EMPLOYMENT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                        <ChevronDown size={14}/>
                      </div>
                    </div>
                    {['employed','self_employed'].includes(form.employment_status) && (
                      <div><label className="ra-label">Employer / Business Name</label><input name="employer_name" value={form.employer_name} onChange={handleChange} className="ra-input" placeholder="Where do you work?" /></div>
                    )}
                    <div><label className="ra-label">Monthly Income (M)</label><input type="number" name="monthly_income" value={form.monthly_income} onChange={handleChange} className="ra-input" placeholder="Approximate monthly income" min="0" /></div>
                    <div><label className="ra-label">Preferred Move-in Date *</label><input type="date" name="move_in_date" value={form.move_in_date} onChange={handleChange} className="ra-input" min={today} required /></div>
                  </div>
                )}

                {/* Step 3 — References & notes */}
                {step === 3 && (
                  <div style={{ display:'flex',flexDirection:'column',gap:14 }}>
                    <div>
                      <label className="ra-label">References</label>
                      <textarea name="references" value={form.references} onChange={handleChange} className="ra-input"
                        style={{ minHeight:90,resize:'vertical',lineHeight:1.6 }}
                        placeholder="Previous landlord name & contact, or character reference..." />
                    </div>
                    <div>
                      <label className="ra-label">Additional Notes</label>
                      <textarea name="additional_notes" value={form.additional_notes} onChange={handleChange} className="ra-input"
                        style={{ minHeight:80,resize:'vertical',lineHeight:1.6 }}
                        placeholder="Anything else the landlord should know..." />
                    </div>
                    <div style={{ padding:'12px 16px',background:'#faf7f3',borderRadius:10,border:'1px solid #ede8e0' }}>
                      <p style={{ fontSize:12,color:'#7a7060',lineHeight:1.6,fontFamily:"'DM Sans',sans-serif" }}>
                        By submitting this application you confirm all information is accurate. The landlord will review and respond by email.
                      </p>
                    </div>
                  </div>
                )}

                {/* Navigation */}
                <div style={{ display:'flex',gap:10,marginTop:22 }}>
                  {step > 1 && (
                    <button type="button" onClick={() => setStep(s => s-1)}
                      style={{ flex:1,padding:'11px',borderRadius:11,background:'transparent',color:'#7a7060',border:'1px solid #ede8e0',fontSize:13,fontWeight:500,cursor:'pointer',fontFamily:"'DM Sans',sans-serif" }}>
                      Back
                    </button>
                  )}
                  {step < 3 ? (
                    <button type="button" onClick={handleNext}
                      style={{ flex:2,padding:'11px',borderRadius:11,background:'#1c1a17',color:'#fff',border:'none',fontSize:13,fontWeight:500,cursor:'pointer',fontFamily:"'DM Sans',sans-serif" }}>
                      Continue
                    </button>
                  ) : (
                    <button type="submit" disabled={loading}
                      style={{ flex:2,padding:'11px',borderRadius:11,background:loading?'#7a7060':'#1c1a17',color:'#fff',border:'none',fontSize:13,fontWeight:500,cursor:loading?'not-allowed':'pointer',fontFamily:"'DM Sans',sans-serif",display:'flex',alignItems:'center',justifyContent:'center',gap:7 }}>
                      <Send size={14}/>{loading ? 'Submitting…' : 'Submit Application'}
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default RentalApplicationModal;