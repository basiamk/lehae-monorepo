import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext.jsx';
import { propertyAPI } from '../lib/api.js';
import Button from '../components/common/Button.jsx';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import { Edit2, Trash2, X, Check, Plus, AlertCircle, ChevronDown, Home, ArrowRight, FileText, ChevronUp } from 'lucide-react';
import axiosInstance from '../utils/axios.js';
import { useNavigate } from 'react-router-dom';

const DISTRICTS = ['Maseru','Leribe','Berea','Mafeteng',"Mohale's Hoek",'Quthing',"Qacha's Nek",'Mokhotlong','Thaba-Tseka','Butha-Buthe'];
const PROPERTY_TYPES = [{value:'house',label:'House'},{value:'apartment',label:'Apartment'},{value:'room',label:'Room'},{value:'cottage',label:'Cottage'},{value:'studio',label:'Studio'},{value:'townhouse',label:'Townhouse'}];
const WATER_OPTIONS  = [{value:'constant',label:'Constant supply'},{value:'intermittent',label:'Intermittent'},{value:'borehole',label:'Borehole'},{value:'none',label:'No water'}];
const ELEC_OPTIONS   = [{value:'prepaid',label:'Prepaid meter'},{value:'municipal',label:'Municipal billing'},{value:'none',label:'No electricity'}];

const emptyForm = {
  area:'', district:'', rental_amount:'', deposit:'', viewing_fee:'',
  status:'vacant', description:'',
  property_type:'house', bedrooms:'', bathrooms:'',
  furnished:false, parking:false, pet_friendly:false, security:false,
  water_supply:'constant', electricity:'prepaid',
  available_from:'', whatsapp_number:'',
};

const ManageListings = () => {
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [properties, setProperties]   = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [success, setSuccess]         = useState('');
  const [editProperty, setEditProperty] = useState(null);
  const [formData, setFormData]       = useState(emptyForm);
  const [newImageFiles, setNewImageFiles] = useState([]);
  const [imageError, setImageError]   = useState('');
  const [saving, setSaving]           = useState(false);
  const [applications, setApplications] = useState({});   // keyed by property.id
  const [appLoading, setAppLoading]     = useState({});
  const [expandedApps, setExpandedApps] = useState({});   // which properties show apps

  useEffect(() => {
    if (!isAuthenticated || !user?.is_landlord) {
      setLoading(false);
      setError(t('Only landlords can manage listings'));
      return;
    }
    fetchProperties();
  }, [isAuthenticated, user, t]);

  const fetchApplications = async (propertyId) => {
    setAppLoading(prev => ({ ...prev, [propertyId]: true }));
    try {
      const res = await axiosInstance.get('/api/applications/');
      const all = Array.isArray(res.data) ? res.data : [];
      // Group by property id
      const grouped = {};
      all.forEach(app => {
        const pid = app.property;
        if (!grouped[pid]) grouped[pid] = [];
        grouped[pid].push(app);
      });
      setApplications(grouped);
    } catch { /* silent */ }
    finally { setAppLoading(prev => ({ ...prev, [propertyId]: false })); }
  };

  const handleUpdateApplication = async (appId, newStatus) => {
    try {
      await axiosInstance.patch(`/api/applications/${appId}/`, { status: newStatus });
      // Refresh applications
      const res = await axiosInstance.get('/api/applications/');
      const all = Array.isArray(res.data) ? res.data : [];
      const grouped = {};
      all.forEach(app => {
        const pid = app.property;
        if (!grouped[pid]) grouped[pid] = [];
        grouped[pid].push(app);
      });
      setApplications(grouped);
      setSuccess(`Application ${newStatus}.`);
      setTimeout(() => setSuccess(''), 3000);
    } catch { setError('Failed to update application.'); }
  };

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const data = await propertyAPI.getProperties({ landlord: 'self' });
      setProperties(data);
      setError('');
      // Also load applications
      fetchApplications();
    } catch {
      setError(t('Failed to load listings'));
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (property) => {
    setEditProperty(property.id);
    setFormData({
      area:             property.area          || '',
      district:         property.district      || '',
      rental_amount:    property.rental_amount || '',
      deposit:          property.deposit       || '',
      viewing_fee:      property.viewing_fee   || '',
      status:           property.status        || 'vacant',
      description:      property.description   || '',
      property_type:    property.property_type || 'house',
      bedrooms:         property.bedrooms      || '',
      bathrooms:        property.bathrooms     || '',
      furnished:        !!property.furnished,
      parking:          !!property.parking,
      pet_friendly:     !!property.pet_friendly,
      security:         !!property.security,
      water_supply:     property.water_supply  || 'constant',
      electricity:      property.electricity   || 'prepaid',
      available_from:   property.available_from || '',
      whatsapp_number:  property.whatsapp_number || '',
    });
    setNewImageFiles([]);
    setImageError('');
    setSuccess('');
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files).filter(
      f => ['image/jpeg','image/png'].includes(f.type) && f.size <= 5*1024*1024
    );
    const current = properties.find(p => p.id === editProperty)?.images?.length || 0;
    if (files.length + current > 10) { setImageError(t('Maximum 10 images allowed')); return; }
    setNewImageFiles(files);
    setImageError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true); setError(''); setImageError(''); setSuccess('');
    try {
      const updatedData = {
        area:           formData.area.trim(),
        district:       formData.district.trim(),
        rental_amount:  parseFloat(formData.rental_amount) || 0,
        deposit:        formData.deposit       ? parseFloat(formData.deposit)      : null,
        viewing_fee:    formData.viewing_fee   ? parseFloat(formData.viewing_fee)  : null,
        status:         formData.status,
        description:    formData.description.trim(),
        property_type:  formData.property_type,
        bedrooms:       formData.bedrooms      ? parseInt(formData.bedrooms)       : null,
        bathrooms:      formData.bathrooms     ? parseInt(formData.bathrooms)      : null,
        furnished:      formData.furnished,
        parking:        formData.parking,
        pet_friendly:   formData.pet_friendly,
        security:       formData.security,
        water_supply:   formData.water_supply,
        electricity:    formData.electricity,
        available_from: formData.available_from || null,
        whatsapp_number:formData.whatsapp_number.trim(),
      };
      await propertyAPI.updateProperty(editProperty, updatedData);
      for (const file of newImageFiles) {
        const fd = new FormData();
        fd.append('image', file);
        fd.append('property_id', editProperty);
        await propertyAPI.uploadPropertyImage(fd);
      }
      await fetchProperties();
      setEditProperty(null);
      setNewImageFiles([]);
      setSuccess(t('Property updated successfully!'));
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.detail || t('Failed to update property'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (propertyId) => {
    if (!window.confirm(t('Are you sure you want to delete this property?'))) return;
    try {
      await propertyAPI.deleteProperty(propertyId);
      setProperties(properties.filter(p => p.id !== propertyId));
      setSuccess(t('Property deleted successfully'));
      setTimeout(() => setSuccess(''), 3000);
    } catch { setError(t('Failed to delete property')); }
  };

  const handleDeleteImage = async (imageId) => {
    if (!window.confirm(t('Delete this image permanently?'))) return;
    try {
      await propertyAPI.deletePropertyImage(imageId);
      await fetchProperties();
      setSuccess(t('Image deleted'));
      setTimeout(() => setSuccess(''), 3000);
    } catch { setImageError(t('Failed to delete image')); }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="page-enter min-h-screen bg-neutral-50">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@400;500&display=swap');
        .ml-input { width:100%; padding:10px 14px; border:1px solid #ede8e0; border-radius:11px; font-size:13.5px; font-family:'DM Sans',sans-serif; color:#1c1a17; background:#fff; outline:none; appearance:none; transition:border-color 0.18s; }
        .ml-input:focus { border-color:#c4a882; box-shadow:0 0 0 3px rgba(196,168,130,0.12); }
        .ml-label { font-size:11px; font-weight:500; letter-spacing:0.06em; text-transform:uppercase; color:#9c9080; margin-bottom:6px; display:block; }
        .ml-card { background:#fff; border:1px solid #ede8e0; border-radius:18px; padding:24px; }
        .ml-sel-wrap { position:relative; }
        .ml-sel-wrap svg { position:absolute; right:11px; top:50%; transform:translateY(-50%); pointer-events:none; color:#c4bdb4; }
        .ml-toggle-row { display:flex; align-items:center; justify-content:space-between; padding:9px 0; border-bottom:1px solid #f5f0e8; }
        .ml-toggle-row:last-child { border-bottom:none; }
        .ml-switch { position:relative; width:40px; height:22px; }
        .ml-switch input { opacity:0; width:0; height:0; }
        .ml-slider { position:absolute; inset:0; border-radius:11px; cursor:pointer; background:#ede8e0; transition:0.2s; }
        .ml-slider::before { content:''; position:absolute; width:16px; height:16px; left:3px; bottom:3px; border-radius:50%; background:#fff; transition:0.2s; box-shadow:0 1px 2px rgba(0,0,0,0.2); }
        input:checked + .ml-slider { background:#1c1a17; }
        input:checked + .ml-slider::before { transform:translateX(18px); }
        .ml-completeness { height:5px; background:#f5f0e8; border-radius:3px; overflow:hidden; margin-top:6px; }
        .ml-completeness-bar { height:100%; border-radius:3px; transition:width 0.4s ease; }
      `}</style>

      {/* Header */}
      <div style={{ background:'#1c1a17', paddingTop:48, paddingBottom:48 }}>
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between flex-wrap gap-4">
          <div>
            <p style={{ fontSize:11,fontWeight:600,letterSpacing:'0.1em',textTransform:'uppercase',color:'#d4a96a',marginBottom:8 }}>Landlord</p>
            <h1 style={{ fontFamily:"'Playfair Display',serif",fontSize:'clamp(1.6rem,3vw,2.2rem)',fontWeight:700,color:'#fff' }}>Manage Listings</h1>
          </div>
          <button onClick={() => navigate('/add-property')}
            style={{ display:'flex',alignItems:'center',gap:7,padding:'10px 20px',borderRadius:12,background:'#d4a96a',color:'#1c1a17',border:'none',fontSize:14,fontWeight:600,cursor:'pointer',fontFamily:"'DM Sans',sans-serif" }}>
            <Plus size={15}/> Add New Property
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">

        {success && <div className="mb-5 p-4 rounded-xl text-sm flex items-center gap-3" style={{background:'#f0fdf4',border:'1px solid #86efac',color:'#16a34a'}}><Check size={15}/>{success}</div>}
        {error   && <div className="mb-5 p-4 rounded-xl text-sm flex items-center gap-3" style={{background:'#fef2f2',border:'1px solid #fecaca',color:'#dc2626'}}><AlertCircle size={15}/>{error}</div>}

        {properties.length === 0 ? (
          /* ── Empty state ── */
          <div style={{ textAlign:'center',padding:'60px 20px',background:'#fff',borderRadius:20,border:'1px solid #ede8e0' }}>
            <div style={{ width:64,height:64,borderRadius:18,background:'#faf7f3',border:'1px solid #ede8e0',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 18px' }}>
              <Home size={26} style={{ color:'#c4bdb4' }}/>
            </div>
            <h3 style={{ fontFamily:"'Playfair Display',serif",fontSize:20,fontWeight:700,color:'#1c1a17',marginBottom:8 }}>No listings yet</h3>
            <p style={{ fontSize:14,color:'#9c9080',marginBottom:24,maxWidth:300,margin:'0 auto 24px' }}>
              You haven't listed any properties. Add your first one — it only takes a few minutes.
            </p>
            <button onClick={() => navigate('/add-property')}
              style={{ display:'inline-flex',alignItems:'center',gap:8,padding:'12px 24px',borderRadius:12,background:'#1c1a17',color:'#fff',border:'none',fontSize:14,fontWeight:500,cursor:'pointer',fontFamily:"'DM Sans',sans-serif" }}>
              Add your first property <ArrowRight size={14}/>
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            {properties.map((property) => (
              <div key={property.id} className="ml-card">

                {editProperty === property.id ? (
                  /* ── Edit form ── */
                  <form onSubmit={handleSubmit}>
                    <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20 }}>
                      <h3 style={{ fontFamily:"'Playfair Display',serif",fontSize:17,fontWeight:700,color:'#1c1a17' }}>Editing: {property.area}</h3>
                      <button type="button" onClick={() => setEditProperty(null)}
                        style={{ background:'none',border:'none',cursor:'pointer',color:'#9c9080' }}><X size={18}/></button>
                    </div>

                    {imageError && <div className="mb-4 p-3 rounded-xl text-sm" style={{background:'#fef2f2',border:'1px solid #fecaca',color:'#dc2626'}}>{imageError}</div>}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div><label className="ml-label">Area *</label><input name="area" value={formData.area} onChange={handleChange} className="ml-input" required /></div>
                      <div>
                        <label className="ml-label">District</label>
                        <div className="ml-sel-wrap">
                          <select name="district" value={formData.district} onChange={handleChange} className="ml-input" style={{cursor:'pointer'}}>
                            <option value="">Select district</option>
                            {DISTRICTS.map(d=><option key={d} value={d}>{d}</option>)}
                          </select>
                          <ChevronDown size={13}/>
                        </div>
                      </div>
                      <div>
                        <label className="ml-label">Property Type</label>
                        <div className="ml-sel-wrap">
                          <select name="property_type" value={formData.property_type} onChange={handleChange} className="ml-input" style={{cursor:'pointer'}}>
                            {PROPERTY_TYPES.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
                          </select>
                          <ChevronDown size={13}/>
                        </div>
                      </div>
                      <div>
                        <label className="ml-label">Status</label>
                        <div className="ml-sel-wrap">
                          <select name="status" value={formData.status} onChange={handleChange} className="ml-input" style={{cursor:'pointer'}}>
                            <option value="vacant">Vacant</option>
                            <option value="occupied">Occupied</option>
                            <option value="inactive">Inactive</option>
                          </select>
                          <ChevronDown size={13}/>
                        </div>
                      </div>
                      <div><label className="ml-label">Bedrooms</label><input type="number" name="bedrooms" value={formData.bedrooms} onChange={handleChange} className="ml-input" min="0"/></div>
                      <div><label className="ml-label">Bathrooms</label><input type="number" name="bathrooms" value={formData.bathrooms} onChange={handleChange} className="ml-input" min="0"/></div>
                      <div><label className="ml-label">Rent (M) *</label><input type="number" name="rental_amount" value={formData.rental_amount} onChange={handleChange} className="ml-input" required min="0"/></div>
                      <div><label className="ml-label">Deposit (M)</label><input type="number" name="deposit" value={formData.deposit} onChange={handleChange} className="ml-input" min="0"/></div>
                      <div><label className="ml-label">Viewing Fee (M)</label><input type="number" name="viewing_fee" value={formData.viewing_fee} onChange={handleChange} className="ml-input" min="0"/></div>
                      <div><label className="ml-label">Available From</label><input type="date" name="available_from" value={formData.available_from} onChange={handleChange} className="ml-input"/></div>
                      <div>
                        <label className="ml-label">Water Supply</label>
                        <div className="ml-sel-wrap"><select name="water_supply" value={formData.water_supply} onChange={handleChange} className="ml-input" style={{cursor:'pointer'}}>{WATER_OPTIONS.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select><ChevronDown size={13}/></div>
                      </div>
                      <div>
                        <label className="ml-label">Electricity</label>
                        <div className="ml-sel-wrap"><select name="electricity" value={formData.electricity} onChange={handleChange} className="ml-input" style={{cursor:'pointer'}}>{ELEC_OPTIONS.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select><ChevronDown size={13}/></div>
                      </div>
                      <div className="md:col-span-2"><label className="ml-label">WhatsApp Number</label><input type="tel" name="whatsapp_number" value={formData.whatsapp_number} onChange={handleChange} className="ml-input" placeholder="+266 5800 1234"/></div>
                    </div>

                    <div className="mb-4">
                      <label className="ml-label">Description</label>
                      <textarea name="description" value={formData.description} onChange={handleChange} className="ml-input" style={{minHeight:100,resize:'vertical'}}/>
                    </div>

                    {/* Feature toggles */}
                    <div className="mb-4" style={{background:'#faf7f3',borderRadius:12,padding:'12px 16px'}}>
                      <label className="ml-label" style={{marginBottom:8}}>Features</label>
                      {[{n:'furnished',l:'Furnished'},{n:'parking',l:'Parking'},{n:'pet_friendly',l:'Pet friendly'},{n:'security',l:'Security'}].map(({n,l})=>(
                        <div key={n} className="ml-toggle-row">
                          <span style={{fontSize:13,color:'#5a5248',fontWeight:500}}>{l}</span>
                          <label className="ml-switch">
                            <input type="checkbox" name={n} checked={formData[n]} onChange={handleChange}/>
                            <span className="ml-slider"/>
                          </label>
                        </div>
                      ))}
                    </div>

                    {/* Current images */}
                    {property.images?.length > 0 && (
                      <div className="mb-4">
                        <label className="ml-label">Current Images ({property.images.length})</label>
                        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(90px,1fr))',gap:8}}>
                          {property.images.map(img=>(
                            <div key={img.id} style={{position:'relative',borderRadius:8,overflow:'hidden',aspectRatio:'4/3'}}>
                              <img src={img.image_url} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                              <button type="button" onClick={()=>handleDeleteImage(img.id)}
                                style={{position:'absolute',top:4,right:4,width:20,height:20,borderRadius:'50%',background:'rgba(0,0,0,0.6)',border:'none',cursor:'pointer',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center'}}>
                                <X size={10}/>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Add more images */}
                    <div className="mb-5">
                      <label className="ml-label">Add More Images</label>
                      <input type="file" accept="image/jpeg,image/png" multiple onChange={handleImageChange}
                        style={{width:'100%',padding:'10px',border:'1px dashed #ede8e0',borderRadius:11,fontSize:13,color:'#9c9080',cursor:'pointer'}}/>
                    </div>

                    <div style={{display:'flex',gap:10}}>
                      <button type="submit" disabled={saving}
                        style={{display:'flex',alignItems:'center',gap:6,padding:'10px 22px',borderRadius:11,background:saving?'#7a7060':'#1c1a17',color:'#fff',border:'none',fontSize:13,fontWeight:500,cursor:saving?'not-allowed':'pointer',fontFamily:"'DM Sans',sans-serif"}}>
                        <Check size={14}/>{saving ? 'Saving…' : 'Save Changes'}
                      </button>
                      <button type="button" onClick={()=>{setEditProperty(null);setNewImageFiles([]);setImageError('');}}
                        style={{display:'flex',alignItems:'center',gap:6,padding:'10px 18px',borderRadius:11,background:'transparent',color:'#7a7060',border:'1px solid #ede8e0',fontSize:13,fontWeight:500,cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>
                        <X size={14}/>Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  /* ── Property card view ── */
                  <div>
                    <div style={{display:'flex',gap:14,alignItems:'flex-start'}}>
                      {/* Thumbnail */}
                      <div style={{width:72,height:60,borderRadius:10,overflow:'hidden',background:'#f5f0e8',flexShrink:0}}>
                        {property.images?.[0] ? (
                          <img src={property.images[0].image_url} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                        ) : (
                          <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center'}}>
                            <Home size={20} style={{color:'#c4bdb4'}}/>
                          </div>
                        )}
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:8,flexWrap:'wrap'}}>
                          <div>
                            <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:16,fontWeight:700,color:'#1c1a17',marginBottom:2}}>{property.area}, {property.district}</h3>
                            <p style={{fontSize:13,color:'#9c9080'}}>
                              M {Number(property.rental_amount).toLocaleString()} / mo
                              {property.bedrooms ? ` · ${property.bedrooms} bed` : ''}
                              {property.property_type ? ` · ${property.property_type}` : ''}
                            </p>
                          </div>
                          <div style={{display:'flex',alignItems:'center',gap:6,flexShrink:0,flexWrap:'wrap'}}>
                            <span style={{
                              padding:'3px 10px',borderRadius:100,fontSize:11,fontWeight:500,
                              background:property.status==='vacant'?'rgba(34,197,94,0.12)':property.status==='occupied'?'rgba(239,68,68,0.12)':'rgba(148,163,184,0.12)',
                              color:property.status==='vacant'?'#22c55e':property.status==='occupied'?'#ef4444':'#94a3b8',
                            }}>{property.status}</span>
                            {!property.is_approved && (
                              <span style={{ padding:'3px 10px',borderRadius:100,fontSize:11,fontWeight:500,background:'rgba(245,158,11,0.1)',color:'#f59e0b' }}>
                                ⏳ Pending review
                              </span>
                            )}
                            {property.is_approved && (
                              <span style={{ padding:'3px 10px',borderRadius:100,fontSize:11,fontWeight:500,background:'rgba(34,197,94,0.08)',color:'#22c55e' }}>
                                ✓ Live
                              </span>
                            )}
                          </div>
                        </div>
                        {/* Completeness */}
                        <div style={{marginTop:10}}>
                          <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:'#b5a898',marginBottom:4}}>
                            <span>Listing completeness</span>
                            <span style={{color:property.completeness_score>=80?'#22c55e':property.completeness_score>=50?'#f59e0b':'#ef4444',fontWeight:600}}>{property.completeness_score}%</span>
                          </div>
                          <div className="ml-completeness">
                            <div className="ml-completeness-bar" style={{width:`${property.completeness_score}%`,background:property.completeness_score>=80?'#22c55e':property.completeness_score>=50?'#f59e0b':'#ef4444'}}/>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Applications for this listing */}
                    <div style={{marginTop:14}}>
                      <button
                        onClick={() => setExpandedApps(prev => ({ ...prev, [property.id]: !prev[property.id] }))}
                        style={{display:'flex',alignItems:'center',gap:6,padding:'6px 12px',borderRadius:9,background:'rgba(212,169,106,0.1)',border:'1px solid rgba(212,169,106,0.25)',color:'#a8895f',fontSize:12,fontWeight:500,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",marginBottom:expandedApps[property.id]?8:0}}>
                        <FileText size={12}/>
                        {(applications[property.id]||[]).length} Application{(applications[property.id]||[]).length !== 1 ? 's' : ''}
                        {expandedApps[property.id] ? <ChevronUp size={11}/> : <ChevronDown size={11}/>}
                      </button>

                      {expandedApps[property.id] && (
                        <div style={{background:'#faf7f3',borderRadius:12,border:'1px solid #ede8e0',overflow:'hidden',marginBottom:12}}>
                          {(applications[property.id]||[]).length === 0 ? (
                            <p style={{fontSize:12,color:'#b5a898',padding:'12px 16px',fontFamily:"'DM Sans',sans-serif"}}>No applications yet for this property.</p>
                          ) : (
                            (applications[property.id]||[]).map(app => {
                              const sc = {pending:'#f59e0b',reviewing:'#3b82f6',approved:'#22c55e',declined:'#ef4444',cancelled:'#9c9080'}[app.status] || '#9c9080';
                              return (
                                <div key={app.id} style={{padding:'12px 16px',borderBottom:'1px solid #ede8e0',display:'flex',alignItems:'center',justifyContent:'space-between',gap:10,flexWrap:'wrap'}}>
                                  <div style={{minWidth:0}}>
                                    <p style={{fontSize:13,fontWeight:500,color:'#1c1a17',fontFamily:"'DM Sans',sans-serif"}}>{app.full_name}</p>
                                    <p style={{fontSize:11,color:'#9c9080',fontFamily:"'DM Sans',sans-serif"}}>
                                      {app.employment_status} · Move-in {app.move_in_date} · {app.num_occupants} occupant{app.num_occupants>1?'s':''}
                                    </p>
                                    {app.phone && <p style={{fontSize:11,color:'#c4a882',fontFamily:"'DM Sans',sans-serif"}}>📞 {app.phone}</p>}
                                  </div>
                                  <div style={{display:'flex',alignItems:'center',gap:6,flexShrink:0,flexWrap:'wrap'}}>
                                    <span style={{padding:'2px 9px',borderRadius:100,fontSize:10,fontWeight:600,background:`${sc}18`,color:sc,fontFamily:"'DM Sans',sans-serif"}}>
                                      {app.status}
                                    </span>
                                    {app.status === 'pending' && (
                                      <>
                                        <button onClick={() => handleUpdateApplication(app.id, 'reviewing')}
                                          style={{padding:'4px 10px',borderRadius:8,background:'rgba(59,130,246,0.1)',color:'#3b82f6',border:'1px solid rgba(59,130,246,0.25)',fontSize:11,fontWeight:500,cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>
                                          Review
                                        </button>
                                        <button onClick={() => handleUpdateApplication(app.id, 'approved')}
                                          style={{padding:'4px 10px',borderRadius:8,background:'rgba(34,197,94,0.1)',color:'#22c55e',border:'1px solid rgba(34,197,94,0.25)',fontSize:11,fontWeight:500,cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>
                                          Approve
                                        </button>
                                        <button onClick={() => handleUpdateApplication(app.id, 'declined')}
                                          style={{padding:'4px 10px',borderRadius:8,background:'#fef2f2',color:'#ef4444',border:'1px solid #fecaca',fontSize:11,fontWeight:500,cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>
                                          Decline
                                        </button>
                                      </>
                                    )}
                                    {app.status === 'reviewing' && (
                                      <>
                                        <button onClick={() => handleUpdateApplication(app.id, 'approved')}
                                          style={{padding:'4px 10px',borderRadius:8,background:'rgba(34,197,94,0.1)',color:'#22c55e',border:'1px solid rgba(34,197,94,0.25)',fontSize:11,fontWeight:500,cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>
                                          Approve
                                        </button>
                                        <button onClick={() => handleUpdateApplication(app.id, 'declined')}
                                          style={{padding:'4px 10px',borderRadius:8,background:'#fef2f2',color:'#ef4444',border:'1px solid #fecaca',fontSize:11,fontWeight:500,cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>
                                          Decline
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>

                    <div style={{display:'flex',gap:8,marginTop:4}}>
                      <button onClick={()=>handleEditClick(property)}
                        style={{display:'flex',alignItems:'center',gap:5,padding:'8px 16px',borderRadius:10,background:'#faf7f3',border:'1px solid #ede8e0',color:'#5a5248',fontSize:12,fontWeight:500,cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>
                        <Edit2 size={12}/>Edit
                      </button>
                      <button onClick={()=>handleDelete(property.id)}
                        style={{display:'flex',alignItems:'center',gap:5,padding:'8px 16px',borderRadius:10,background:'#fef2f2',border:'1px solid #fecaca',color:'#dc2626',fontSize:12,fontWeight:500,cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>
                        <Trash2 size={12}/>Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageListings;