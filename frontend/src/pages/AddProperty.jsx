import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axios.js';
import { Upload, X, Check, AlertCircle, ChevronDown, ArrowRight, ArrowLeft, MapPin, Home, Banknote, Zap, Camera, Phone } from 'lucide-react';

const DISTRICTS = ['Maseru','Leribe','Berea','Mafeteng',"Mohale's Hoek",'Quthing',"Qacha's Nek",'Mokhotlong','Thaba-Tseka','Butha-Buthe'];
const PROPERTY_TYPES = [{value:'house',label:'House'},{value:'apartment',label:'Apartment'},{value:'room',label:'Room'},{value:'cottage',label:'Cottage'},{value:'studio',label:'Studio'},{value:'townhouse',label:'Townhouse'}];
const WATER_OPTIONS  = [{value:'constant',label:'Constant supply'},{value:'intermittent',label:'Intermittent'},{value:'borehole',label:'Borehole'},{value:'none',label:'No water'}];
const ELEC_OPTIONS   = [{value:'prepaid',label:'Prepaid meter'},{value:'municipal',label:'Municipal billing'},{value:'none',label:'No electricity'}];

const STEPS = [
  { id:1, label:'Location',   icon:MapPin   },
  { id:2, label:'Property',   icon:Home     },
  { id:3, label:'Pricing',    icon:Banknote },
  { id:4, label:'Amenities',  icon:Zap      },
  { id:5, label:'Photos',     icon:Camera   },
  { id:6, label:'Contact',    icon:Phone    },
];

const TIPS = {
  1: { title:"Location matters most", body:"Tenants search by area and district first. Use the neighbourhood name they'd recognise — e.g. 'Ha Tsolo' not just 'Maseru'." },
  2: { title:"Be specific", body:"Listings with bedrooms, bathrooms and property type filled in get 2× more enquiries than those without." },
  3: { title:"Price it right", body:"Check similar listings in your area. A fair price listed quickly beats a high price sitting for months." },
  4: { title:"Amenities seal the deal", body:"Water supply and electricity type are the top two things tenants ask about. Fill them in to avoid repeated questions." },
  5: { title:"Photos = enquiries", body:"Listings with 5+ clear photos get 3× more views. Include: main entrance, living room, bedroom, kitchen, bathroom and yard if any." },
  6: { title:"WhatsApp gets responses", body:"Most tenants will message you on WhatsApp rather than the in-app messenger. Adding your number means faster conversations." },
};

function calcCompleteness(f, imageCount) {
  let s = 0;
  if (f.area)                        s += 10;
  if (f.district)                    s += 10;
  if (f.description?.length > 50)    s += 15;
  if (imageCount >= 3)               s += 20;
  if (f.bedrooms)                    s += 10;
  if (f.bathrooms)                   s += 5;
  if (f.property_type)               s += 5;
  if (f.water_supply)                s += 5;
  if (f.electricity)                 s += 5;
  if (f.whatsapp_number?.length > 7) s += 10;
  if (f.available_from)              s += 5;
  return Math.min(s, 100);
}

const AddProperty = () => {
  const { t }  = useTranslation();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    area:'', district:'', rental_amount:'', deposit:'', viewing_fee:'',
    status:'vacant', description:'', property_type:'house',
    bedrooms:'', bathrooms:'', furnished:false, parking:false,
    pet_friendly:false, security:false, water_supply:'constant',
    electricity:'prepaid', available_from:'', whatsapp_number:'',
  });
  const [images, setImages]               = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [error, setError]                 = useState('');
  const [success, setSuccess]             = useState('');
  const [loading, setLoading]             = useState(false);

  const completeness = calcCompleteness(formData, images.length);
  const completenessColor = completeness < 50 ? '#ef4444' : completeness < 80 ? '#f59e0b' : '#22c55e';

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    setError('');
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + images.length > 10) { setError('Max 10 images.'); return; }
    const newImages = [...images, ...files];
    setImages(newImages);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreviews(prev => [...prev, reader.result]);
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setImages(images.filter((_,i)=>i!==index));
    setImagePreviews(imagePreviews.filter((_,i)=>i!==index));
  };

  const validateStep = () => {
    if (step === 1 && (!formData.area || !formData.district)) { setError('Area and district are required.'); return false; }
    if (step === 2 && !formData.property_type) { setError('Please select a property type.'); return false; }
    if (step === 3 && !formData.rental_amount) { setError('Monthly rent is required.'); return false; }
    if (step === 5 && images.length < 3) { setError('Please upload at least 3 photos.'); return false; }
    return true;
  };

  const handleNext = () => { if (validateStep()) { setError(''); setStep(s => s + 1); } };
  const handleBack = () => { setError(''); setStep(s => s - 1); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep()) return;
    setLoading(true); setError(''); setSuccess('');
    try {
      const data = new FormData();
      Object.entries(formData).forEach(([k,v]) => { if (v !== '' && v !== null && v !== undefined) data.append(k, v); });
      images.forEach(file => data.append('images', file));
      await axiosInstance.post('/api/properties/', data, {
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}`, 'Content-Type': 'multipart/form-data' },
      });
      setSuccess('Property listed successfully!');
      setTimeout(() => navigate('/manage-listings'), 1500);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to add property. Please check all fields.');
    } finally { setLoading(false); }
  };

  const tip = TIPS[step];

  return (
    <div className="page-enter min-h-screen bg-neutral-50">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@300;400;500&display=swap');
        .ap-input { width:100%; padding:11px 14px; border:1px solid #ede8e0; border-radius:12px; font-size:14px; font-family:'DM Sans',sans-serif; color:#1c1a17; background:#fff; outline:none; transition:border-color 0.18s,box-shadow 0.18s; appearance:none; -webkit-appearance:none; }
        .ap-input:focus { border-color:#c4a882; box-shadow:0 0 0 3px rgba(196,168,130,0.15); }
        .ap-input::placeholder { color:#c4bdb4; }
        .ap-label { display:block; font-size:11px; font-weight:500; letter-spacing:0.06em; text-transform:uppercase; color:#9c9080; margin-bottom:7px; }
        .ap-sel-wrap { position:relative; }
        .ap-sel-wrap svg { position:absolute; right:12px; top:50%; transform:translateY(-50%); pointer-events:none; color:#c4bdb4; }
        .toggle-row { display:flex; align-items:center; justify-content:space-between; padding:10px 0; border-bottom:1px solid #f3ede6; }
        .toggle-row:last-child { border-bottom:none; }
        .toggle-switch { position:relative; width:42px; height:24px; flex-shrink:0; }
        .toggle-switch input { opacity:0; width:0; height:0; }
        .toggle-slider { position:absolute; inset:0; border-radius:12px; cursor:pointer; background:#ede8e0; transition:0.2s; }
        .toggle-slider::before { content:''; position:absolute; width:18px; height:18px; left:3px; bottom:3px; border-radius:50%; background:#fff; transition:0.2s; box-shadow:0 1px 3px rgba(0,0,0,0.2); }
        input:checked + .toggle-slider { background:#1c1a17; }
        input:checked + .toggle-slider::before { transform:translateX(18px); }
        .img-drop { border:2px dashed #ede8e0; border-radius:16px; padding:28px; text-align:center; cursor:pointer; transition:border-color 0.18s; }
        .img-drop:hover { border-color:#c4a882; }
        .step-dot { width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:600; transition:all 0.2s; cursor:pointer; font-family:'DM Sans',sans-serif; flex-shrink:0; }
      `}</style>

      {/* Header */}
      <div style={{ background:'#1c1a17', paddingTop:40, paddingBottom:32 }}>
        <div className="max-w-3xl mx-auto px-6">
          <p style={{ fontSize:11,fontWeight:600,letterSpacing:'0.1em',textTransform:'uppercase',color:'#d4a96a',marginBottom:6 }}>Landlord</p>
          <h1 style={{ fontFamily:"'Playfair Display',serif",fontSize:'clamp(1.4rem,3vw,2rem)',fontWeight:700,color:'#fff',marginBottom:20 }}>
            List a Property
          </h1>

          {/* Step dots */}
          <div style={{ display:'flex',alignItems:'center',gap:0 }}>
            {STEPS.map((s, i) => {
              const done    = step > s.id;
              const current = step === s.id;
              const Icon    = s.icon;
              return (
                <React.Fragment key={s.id}>
                  <div style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:5 }}>
                    <div className="step-dot"
                      style={{ background:done?'#d4a96a':current?'#fff':'rgba(255,255,255,0.12)', color:done?'#fff':current?'#1c1a17':'rgba(255,255,255,0.4)', border:current?'none':'none' }}
                      onClick={() => done && setStep(s.id)}>
                      {done ? <Check size={13}/> : <Icon size={13}/>}
                    </div>
                    <span style={{ fontSize:9,fontWeight:500,letterSpacing:'0.05em',textTransform:'uppercase',color:current?'#d4a96a':done?'rgba(255,255,255,0.6)':'rgba(255,255,255,0.25)',fontFamily:"'DM Sans',sans-serif" }}>
                      {s.label}
                    </span>
                  </div>
                  {i < STEPS.length-1 && (
                    <div style={{ flex:1,height:2,background:done?'#d4a96a':'rgba(255,255,255,0.12)',margin:'0 4px',marginBottom:18,transition:'background 0.3s' }}/>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">

        {/* Completeness bar */}
        <div style={{ background:'#fff',border:'1px solid #ede8e0',borderRadius:16,padding:18,marginBottom:20 }}>
          <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8 }}>
            <span style={{ fontSize:12,fontWeight:500,color:'#7a7060',fontFamily:"'DM Sans',sans-serif" }}>Listing completeness</span>
            <span style={{ fontSize:12,fontWeight:700,color:completenessColor,fontFamily:"'DM Sans',sans-serif" }}>{completeness}%</span>
          </div>
          <div style={{ height:5,background:'#f5f0e8',borderRadius:3,overflow:'hidden' }}>
            <div style={{ height:'100%',width:`${completeness}%`,background:completenessColor,borderRadius:3,transition:'width 0.4s' }}/>
          </div>
          {images.length < 3 && (
            <p style={{ fontSize:11,color:'#f59e0b',marginTop:6,fontFamily:"'DM Sans',sans-serif" }}>
              📷 {images.length}/3 photos added — at least 3 required to publish
            </p>
          )}
        </div>

        {/* Tip card */}
        <div style={{ background:'rgba(212,169,106,0.08)',border:'1px solid rgba(212,169,106,0.25)',borderRadius:14,padding:'14px 18px',marginBottom:20,display:'flex',gap:10 }}>
          <span style={{ fontSize:18,flexShrink:0 }}>💡</span>
          <div>
            <p style={{ fontSize:12,fontWeight:600,color:'#a8895f',fontFamily:"'DM Sans',sans-serif",marginBottom:3 }}>{tip.title}</p>
            <p style={{ fontSize:12,color:'#7a7060',lineHeight:1.6,fontFamily:"'DM Sans',sans-serif" }}>{tip.body}</p>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div style={{ marginBottom:16,padding:'12px 16px',borderRadius:11,background:'#fef2f2',border:'1px solid #fecaca',color:'#dc2626',fontSize:13,display:'flex',alignItems:'center',gap:8,fontFamily:"'DM Sans',sans-serif" }}>
            <AlertCircle size={14}/>{error}
          </div>
        )}
        {success && (
          <div style={{ marginBottom:16,padding:'12px 16px',borderRadius:11,background:'#f0fdf4',border:'1px solid #86efac',color:'#16a34a',fontSize:13,display:'flex',alignItems:'center',gap:8,fontFamily:"'DM Sans',sans-serif" }}>
            <Check size={14}/>{success}
          </div>
        )}

        {/* Step content */}
        <div style={{ background:'#fff',border:'1px solid #ede8e0',borderRadius:20,padding:28,marginBottom:16 }}>

          {/* Step 1 — Location */}
          {step === 1 && (
            <div style={{ display:'flex',flexDirection:'column',gap:16 }}>
              <h2 style={{ fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:700,color:'#1c1a17',marginBottom:4 }}>Where is the property?</h2>
              <div>
                <label className="ap-label">Area / Neighbourhood *</label>
                <input name="area" value={formData.area} onChange={handleChange} className="ap-input" placeholder="e.g. Ha Tsolo, Lithoteng, Masowe" />
              </div>
              <div>
                <label className="ap-label">District *</label>
                <div className="ap-sel-wrap">
                  <select name="district" value={formData.district} onChange={handleChange} className="ap-input" style={{cursor:'pointer',paddingRight:36}} required>
                    <option value="">Select district</option>
                    {DISTRICTS.map(d=><option key={d} value={d}>{d}</option>)}
                  </select>
                  <ChevronDown size={14}/>
                </div>
              </div>
            </div>
          )}

          {/* Step 2 — Property details */}
          {step === 2 && (
            <div style={{ display:'flex',flexDirection:'column',gap:16 }}>
              <h2 style={{ fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:700,color:'#1c1a17',marginBottom:4 }}>Tell us about the property</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="ap-label">Property Type</label>
                  <div className="ap-sel-wrap">
                    <select name="property_type" value={formData.property_type} onChange={handleChange} className="ap-input" style={{cursor:'pointer',paddingRight:36}}>
                      {PROPERTY_TYPES.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <ChevronDown size={14}/>
                  </div>
                </div>
                <div>
                  <label className="ap-label">Status</label>
                  <div className="ap-sel-wrap">
                    <select name="status" value={formData.status} onChange={handleChange} className="ap-input" style={{cursor:'pointer',paddingRight:36}}>
                      <option value="vacant">Vacant (available now)</option>
                      <option value="occupied">Occupied</option>
                    </select>
                    <ChevronDown size={14}/>
                  </div>
                </div>
                <div>
                  <label className="ap-label">Bedrooms</label>
                  <input type="number" name="bedrooms" value={formData.bedrooms} onChange={handleChange} className="ap-input" placeholder="e.g. 2" min="0" max="20"/>
                </div>
                <div>
                  <label className="ap-label">Bathrooms</label>
                  <input type="number" name="bathrooms" value={formData.bathrooms} onChange={handleChange} className="ap-input" placeholder="e.g. 1" min="0" max="10"/>
                </div>
                <div>
                  <label className="ap-label">Available From</label>
                  <input type="date" name="available_from" value={formData.available_from} onChange={handleChange} className="ap-input"/>
                </div>
              </div>
              <div>
                <label className="ap-label">Description</label>
                <textarea name="description" value={formData.description} onChange={handleChange} className="ap-input"
                  style={{minHeight:110,resize:'vertical',lineHeight:1.6}}
                  placeholder="Describe the property — size, condition, nearby transport, schools, shops…"/>
                <p style={{fontSize:11,color:formData.description.length>50?'#22c55e':'#c4bdb4',marginTop:4,fontFamily:"'DM Sans',sans-serif"}}>
                  {formData.description.length} chars {formData.description.length<50?`(add ${50-formData.description.length} more for +15% completeness)`:'✓'}
                </p>
              </div>
            </div>
          )}

          {/* Step 3 — Pricing */}
          {step === 3 && (
            <div style={{ display:'flex',flexDirection:'column',gap:16 }}>
              <h2 style={{ fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:700,color:'#1c1a17',marginBottom:4 }}>Set the pricing</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="ap-label">Monthly Rent (M) *</label>
                  <input type="number" name="rental_amount" value={formData.rental_amount} onChange={handleChange} className="ap-input" placeholder="e.g. 3500" min="0" required/>
                </div>
                <div>
                  <label className="ap-label">Deposit (M)</label>
                  <input type="number" name="deposit" value={formData.deposit} onChange={handleChange} className="ap-input" placeholder="e.g. 7000" min="0"/>
                </div>
                <div>
                  <label className="ap-label">Viewing Fee (M)</label>
                  <input type="number" name="viewing_fee" value={formData.viewing_fee} onChange={handleChange} className="ap-input" placeholder="e.g. 50" min="0"/>
                </div>
              </div>
              <div style={{padding:'14px 16px',background:'#faf7f3',borderRadius:12,border:'1px solid #ede8e0'}}>
                <p style={{fontSize:12,color:'#7a7060',lineHeight:1.7,fontFamily:"'DM Sans',sans-serif"}}>
                  💡 <strong>Tip:</strong> A deposit of 1–2 months rent is standard in Lesotho. Viewing fees are optional but cover your time for no-show viewings.
                </p>
              </div>
            </div>
          )}

          {/* Step 4 — Amenities */}
          {step === 4 && (
            <div style={{ display:'flex',flexDirection:'column',gap:16 }}>
              <h2 style={{ fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:700,color:'#1c1a17',marginBottom:4 }}>Utilities & features</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="ap-label">Water Supply</label>
                  <div className="ap-sel-wrap">
                    <select name="water_supply" value={formData.water_supply} onChange={handleChange} className="ap-input" style={{cursor:'pointer',paddingRight:36}}>
                      {WATER_OPTIONS.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <ChevronDown size={14}/>
                  </div>
                </div>
                <div>
                  <label className="ap-label">Electricity</label>
                  <div className="ap-sel-wrap">
                    <select name="electricity" value={formData.electricity} onChange={handleChange} className="ap-input" style={{cursor:'pointer',paddingRight:36}}>
                      {ELEC_OPTIONS.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <ChevronDown size={14}/>
                  </div>
                </div>
              </div>
              <div style={{background:'#faf7f3',borderRadius:14,padding:'4px 16px'}}>
                {[{name:'furnished',label:'Furnished',desc:'Property comes with furniture'},{name:'parking',label:'Parking',desc:'Dedicated parking space'},{name:'pet_friendly',label:'Pet friendly',desc:'Pets are allowed'},{name:'security',label:'Security',desc:'Security gate or guard present'}].map(({name,label,desc})=>(
                  <div key={name} className="toggle-row">
                    <div>
                      <p style={{fontSize:13,color:'#1c1a17',fontWeight:500,fontFamily:"'DM Sans',sans-serif"}}>{label}</p>
                      <p style={{fontSize:11,color:'#9c9080',fontFamily:"'DM Sans',sans-serif"}}>{desc}</p>
                    </div>
                    <label className="toggle-switch">
                      <input type="checkbox" name={name} checked={formData[name]} onChange={handleChange}/>
                      <span className="toggle-slider"/>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 5 — Photos */}
          {step === 5 && (
            <div style={{ display:'flex',flexDirection:'column',gap:16 }}>
              <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:8 }}>
                <h2 style={{ fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:700,color:'#1c1a17' }}>Upload photos</h2>
                <span style={{ fontSize:12,color:images.length>=3?'#22c55e':'#f59e0b',fontWeight:600,fontFamily:"'DM Sans',sans-serif" }}>
                  {images.length}/10 {images.length>=3?'✓ minimum met':`(need ${3-images.length} more)`}
                </span>
              </div>
              <label className="img-drop" htmlFor="img-upload">
                <Upload size={26} style={{color:'#c4bdb4',margin:'0 auto 10px',display:'block'}}/>
                <p style={{fontSize:14,fontWeight:500,color:'#7a7060',fontFamily:"'DM Sans',sans-serif"}}>Click to add photos</p>
                <p style={{fontSize:12,color:'#b5a898',marginTop:4,fontFamily:"'DM Sans',sans-serif"}}>JPEG or PNG · max 5MB each · at least 3 required</p>
                <input id="img-upload" type="file" accept="image/*" multiple onChange={handleImageChange} style={{display:'none'}}/>
              </label>
              {imagePreviews.length > 0 && (
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(110px,1fr))',gap:10}}>
                  {imagePreviews.map((src,i)=>(
                    <div key={i} style={{position:'relative',borderRadius:10,overflow:'hidden',aspectRatio:'4/3'}}>
                      <img src={src} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                      <button type="button" onClick={()=>removeImage(i)}
                        style={{position:'absolute',top:5,right:5,width:22,height:22,borderRadius:'50%',background:'rgba(0,0,0,0.6)',border:'none',cursor:'pointer',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center'}}>
                        <X size={11}/>
                      </button>
                      {i===0&&<span style={{position:'absolute',bottom:5,left:5,background:'rgba(0,0,0,0.6)',color:'#fff',fontSize:9,fontWeight:600,padding:'2px 6px',borderRadius:100}}>COVER</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 6 — Contact */}
          {step === 6 && (
            <div style={{ display:'flex',flexDirection:'column',gap:16 }}>
              <h2 style={{ fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:700,color:'#1c1a17',marginBottom:4 }}>How should tenants contact you?</h2>
              <div>
                <label className="ap-label">WhatsApp Number</label>
                <input type="tel" name="whatsapp_number" value={formData.whatsapp_number} onChange={handleChange} className="ap-input" placeholder="+266 5800 1234"/>
                <p style={{fontSize:11.5,color:'#9c9080',marginTop:5,fontFamily:"'DM Sans',sans-serif"}}>
                  Tenants can message you directly on WhatsApp. This is the #1 way enquiries happen in Lesotho.
                </p>
              </div>
              <div style={{padding:'16px',background:'#faf7f3',borderRadius:14,border:'1px solid #ede8e0'}}>
                <p style={{fontSize:12,fontWeight:600,color:'#5a5248',marginBottom:8,fontFamily:"'DM Sans',sans-serif"}}>Ready to publish?</p>
                <p style={{fontSize:12,color:'#7a7060',lineHeight:1.7,fontFamily:"'DM Sans',sans-serif"}}>
                  We'll review your listing to check the photos look genuine and the price is reasonable. Usually approved within 24 hours. No ownership documents needed.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div style={{ display:'flex',gap:12 }}>
          {step > 1 && (
            <button type="button" onClick={handleBack}
              style={{ display:'flex',alignItems:'center',gap:7,padding:'12px 20px',borderRadius:12,background:'#fff',color:'#5a5248',border:'1px solid #ede8e0',fontSize:14,fontWeight:500,cursor:'pointer',fontFamily:"'DM Sans',sans-serif" }}>
              <ArrowLeft size={14}/> Back
            </button>
          )}
          {step < 6 ? (
            <button type="button" onClick={handleNext}
              style={{ flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:8,padding:'13px',borderRadius:12,background:'#1c1a17',color:'#fff',border:'none',fontSize:14,fontWeight:500,cursor:'pointer',fontFamily:"'DM Sans',sans-serif" }}
              onMouseEnter={e=>e.currentTarget.style.background='#3a3430'}
              onMouseLeave={e=>e.currentTarget.style.background='#1c1a17'}>
              Continue <ArrowRight size={14}/>
            </button>
          ) : (
            <button type="button" onClick={handleSubmit} disabled={loading}
              style={{ flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:8,padding:'13px',borderRadius:12,background:loading?'#7a7060':'#1c1a17',color:'#fff',border:'none',fontSize:14,fontWeight:500,cursor:loading?'not-allowed':'pointer',fontFamily:"'DM Sans',sans-serif" }}
              onMouseEnter={e=>!loading&&(e.currentTarget.style.background='#3a3430')}
              onMouseLeave={e=>e.currentTarget.style.background=loading?'#7a7060':'#1c1a17'}>
              {loading ? 'Publishing…' : <><Check size={14}/> Publish Listing</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddProperty;