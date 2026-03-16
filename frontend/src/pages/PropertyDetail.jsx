import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axiosInstance from '../utils/axios.js';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext.jsx';
import ViewingRequestModal from '../components/ViewingRequestModal.jsx';
import ReviewSection from '../components/ReviewSection.jsx';
import PropertyMap from '../components/PropertyMap.jsx';
import RentalApplicationModal from '../components/RentalApplicationModal.jsx';
import { Heart, Share2, MapPin, DollarSign, ShieldCheck, X, ChevronLeft, ChevronRight, ArrowLeft, MessageCircle, Banknote, Eye, BedDouble, Bath, Zap, Droplets, Car, PawPrint, Shield, Sofa } from 'lucide-react';

const WHATSAPP_GREEN = '#25D366';
const typeLabel = { house:'House', apartment:'Apartment', room:'Room', cottage:'Cottage', studio:'Studio', townhouse:'Townhouse' };
const waterLabel = { constant:'Constant supply', intermittent:'Intermittent', borehole:'Borehole', none:'No water' };
const elecLabel  = { prepaid:'Prepaid meter', municipal:'Municipal billing', none:'No electricity' };

const PropertyDetail = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentImage, setCurrentImage] = useState(0);
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const [showViewingModal, setShowViewingModal]       = useState(false);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [shareCopied, setShareCopied]                   = useState(false);

  // Inject OG meta tags when property loads
  useEffect(() => {
    if (!property) return;
    const setMeta = (name, content, prop=false) => {
      const sel = prop ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let el = document.querySelector(sel);
      if (!el) { el = document.createElement('meta'); if(prop) el.setAttribute('property',name); else el.setAttribute('name',name); document.head.appendChild(el); }
      el.setAttribute('content', content);
    };
    const title = `${property.area}, ${property.district} — M${Number(property.rental_amount).toLocaleString()}/mo | Lehae`;
    const desc  = property.description ? property.description.slice(0,160) : `${property.bedrooms||''}${property.bedrooms?' bed ':''} ${property.property_type||'property'} in ${property.area}, ${property.district}. M${Number(property.rental_amount).toLocaleString()}/mo.`;
    const img   = property.images?.[0]?.image_url || '';
    document.title = title;
    setMeta('description', desc);
    setMeta('og:title',       title,  true);
    setMeta('og:description', desc,   true);
    setMeta('og:image',       img,    true);
    setMeta('og:url',         window.location.href, true);
    setMeta('og:type',        'website', true);
    return () => { document.title = 'Lehae — Lesotho Rental Platform'; };
  }, [property]);

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get(`/api/properties/${id}/`);
        setProperty(response.data); setError('');
      } catch { setError(t('failed_to_load_property_details')); }
      finally { setLoading(false); }
    };
    fetchProperty();
  }, [id, t]);

  const handleContactLandlord = () => {
    if (!property?.landlord) { alert(t('cannot_contact_landlord_no_info')); return; }
    navigate('/messages', {
      state: {
        receiverId: property.landlord,
        propertyId: id,
        prefilledMessage: t('hi_im_interested_in_your_property_in', { area: property.area, district: property.district }),
        propertyTitle: `${property.area}, ${property.district}`,
      },
    });
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><LoadingSpinner size="lg" /></div>;
  if (error || !property) return (
    <div className="flex items-center justify-center min-h-screen bg-neutral-50">
      <div className="text-center p-10 bg-white rounded-2xl border border-neutral-200 max-w-sm mx-4">
        <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:20,fontWeight:700,color:'#dc2626',marginBottom:12}}>
          {error || t('property_not_found')}
        </h2>
        <Link to="/properties">
          <button style={{padding:'10px 24px',borderRadius:12,background:'#1c1a17',color:'#fff',border:'none',fontSize:14,cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>
            {t('browse_properties')}
          </button>
        </Link>
      </div>
    </div>
  );

  const images = property.images?.length > 0 ? property.images : [{ image_url: property.image_url || '/placeholder-property.jpg' }];
  const mainImage = images[currentImage]?.image_url;

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{duration:0.5}}
      className="min-h-screen bg-neutral-50 pb-20">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@300;400;500&display=swap');
        .detail-stat { background:#faf7f3; border:1px solid #ede8e0; border-radius:14px; padding:20px; text-align:center; }
        .detail-stat-icon { width:40px; height:40px; border-radius:10px; background:#fff; border:1px solid #ede8e0; display:flex; align-items:center; justify-content:center; margin:0 auto 10px; }
        .detail-stat-label { font-size:11px; font-weight:500; text-transform:uppercase; letter-spacing:0.06em; color:#9c9080; margin-bottom:5px; }
        .detail-stat-value { font-family:'Playfair Display',serif; font-size:16px; font-weight:700; color:#1c1a17; }
        .thumb-btn { flex-shrink:0; width:80px; height:64px; border-radius:10px; overflow:hidden; border:2px solid transparent; transition:all 0.18s; cursor:pointer; }
        .thumb-btn.active { border-color:#d4a96a; }
        .thumb-btn:hover { border-color:#c4a882; }
      `}</style>

      {/* Fullscreen modal */}
      <AnimatePresence>
        {fullscreenImage !== null && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{background:'rgba(0,0,0,0.93)'}}
            onClick={() => setFullscreenImage(null)}>
            <button onClick={()=>setFullscreenImage(null)}
              style={{position:'absolute',top:20,right:20,background:'rgba(255,255,255,0.1)',border:'none',borderRadius:'50%',width:42,height:42,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'#fff'}}>
              <X size={18}/>
            </button>
            <img src={images[fullscreenImage].image_url} alt=""
              style={{maxWidth:'90%',maxHeight:'90vh',objectFit:'contain',borderRadius:8}}
              onClick={e=>e.stopPropagation()} />
            {images.length > 1 && (
              <>
                {[{dir:'prev',icon:ChevronLeft,fn:()=>setFullscreenImage(p=>p>0?p-1:images.length-1),style:{left:20}},
                  {dir:'next',icon:ChevronRight,fn:()=>setFullscreenImage(p=>p<images.length-1?p+1:0),style:{right:20}}
                ].map(({dir,icon:Icon,fn,style})=>(
                  <button key={dir} onClick={e=>{e.stopPropagation();fn();}}
                    style={{position:'absolute',top:'50%',transform:'translateY(-50%)',...style,background:'rgba(255,255,255,0.1)',border:'none',borderRadius:'50%',width:44,height:44,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'#fff'}}>
                    <Icon size={20}/>
                  </button>
                ))}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pending approval notice */}
      {!property.is_approved && (user?.is_staff || user?.username === property.landlord_username) && (
        <div style={{margin:'0 0 12px',padding:'12px 24px',background:'rgba(245,158,11,0.1)',border:'1px solid rgba(245,158,11,0.3)',borderRadius:12,display:'flex',alignItems:'center',gap:10}}>
          <span style={{fontSize:13,color:'#f59e0b',fontWeight:500,fontFamily:"'DM Sans',sans-serif"}}>
            ⏳ This listing is pending admin approval and is not yet visible to tenants.
          </span>
        </div>
      )}

      {/* Back button */}
      <div className="max-w-6xl mx-auto px-6 pt-6 mb-4">
        <button onClick={()=>navigate(-1)}
          style={{display:'flex',alignItems:'center',gap:6,fontSize:13,color:'#9c9080',background:'none',border:'none',cursor:'pointer',fontFamily:"'DM Sans',sans-serif",padding:0}}>
          <ArrowLeft size={15}/> Back
        </button>
      </div>

      {/* Main image */}
      <div className="max-w-6xl mx-auto px-6 mb-6">
        <div style={{borderRadius:20,overflow:'hidden',height:'min(60vh,520px)',background:'#1c1a17',position:'relative',cursor:'pointer'}}
          onClick={()=>setFullscreenImage(currentImage)}>
          <AnimatePresence mode="wait">
            <motion.img key={currentImage} src={mainImage} alt={`${property.area}`}
              className="w-full h-full object-cover"
              initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:0.3}} />
          </AnimatePresence>
          <div style={{position:'absolute',inset:0,background:'linear-gradient(to top,rgba(0,0,0,0.4) 0%,transparent 40%)',pointerEvents:'none'}} />

          {/* Status badge */}
          <div style={{position:'absolute',top:16,left:16,padding:'6px 14px',borderRadius:100,fontSize:11,fontWeight:600,letterSpacing:'0.04em',backdropFilter:'blur(8px)',border:'1px solid rgba(255,255,255,0.2)',background:property.status==='vacant'?'rgba(34,197,94,0.15)':'rgba(239,68,68,0.15)',color:property.status==='vacant'?'#22c55e':'#ef4444',display:'flex',alignItems:'center',gap:5}}>
            <span style={{width:5,height:5,borderRadius:'50%',background:property.status==='vacant'?'#22c55e':'#ef4444'}}/>
            {property.status === 'vacant' ? 'Available' : 'Occupied'}
          </div>

          {/* Image counter */}
          {images.length > 1 && (
            <div style={{position:'absolute',bottom:16,right:16,background:'rgba(0,0,0,0.5)',color:'#fff',fontSize:12,fontWeight:500,padding:'4px 12px',borderRadius:100,backdropFilter:'blur(4px)'}}>
              {currentImage+1} / {images.length}
            </div>
          )}
        </div>

        {/* Thumbnails */}
        {images.length > 1 && (
          <div style={{display:'flex',gap:8,marginTop:10,overflowX:'auto',paddingBottom:4}} className="scrollbar-hide">
            {images.map((img,idx)=>(
              <button key={idx} className={`thumb-btn ${idx===currentImage?'active':''}`} onClick={()=>setCurrentImage(idx)}>
                <img src={img.image_url} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Detail card */}
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" style={{alignItems:"start"}}>

          {/* Left — main info */}
          <div className="lg:col-span-2" style={{order:2}}>
            <div style={{background:'#fff',border:'1px solid #ede8e0',borderRadius:20,padding:32,marginBottom:20}}>
              <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:16,marginBottom:24}}>
                <div>
                  <p style={{fontSize:11,fontWeight:600,letterSpacing:'0.08em',textTransform:'uppercase',color:'#d4a96a',marginBottom:8}}>
                    {property.district}
                  </p>
                  <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:'clamp(1.6rem,3vw,2.2rem)',fontWeight:700,color:'#1c1a17',lineHeight:1.2}}>
                    {property.area}, {property.district}
                  </h1>
                  <p style={{display:'flex',alignItems:'center',gap:5,fontSize:13,color:'#9c9080',marginTop:8}}>
                    <MapPin size={13} style={{color:'#d4a96a'}}/> {property.district}, Lesotho
                  </p>
                </div>
                <div style={{display:'flex',gap:8,flexShrink:0}}>
                  {[Heart].map((Icon,i)=>(
                    <button key={i} style={{width:38,height:38,borderRadius:10,background:'#faf7f3',border:'1px solid #ede8e0',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',transition:'all 0.15s'}}
                      onMouseEnter={e=>e.currentTarget.style.borderColor='#c4a882'}
                      onMouseLeave={e=>e.currentTarget.style.borderColor='#ede8e0'}>
                      <Icon size={16} style={{color:'#7a7060'}}/>
                    </button>
                  ))}
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      setShareCopied(true);
                      setTimeout(() => setShareCopied(false), 2000);
                    }}
                    style={{width:38,height:38,borderRadius:10,background:shareCopied?'rgba(34,197,94,0.1)':'#faf7f3',border:`1px solid ${shareCopied?'rgba(34,197,94,0.3)':'#ede8e0'}`,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',transition:'all 0.15s',position:'relative'}}
                    title="Copy link">
                    <Share2 size={16} style={{color:shareCopied?'#22c55e':'#7a7060'}}/>
                    {shareCopied && <span style={{position:'absolute',top:-28,left:'50%',transform:'translateX(-50%)',background:'#1c1a17',color:'#fff',fontSize:10,fontWeight:500,padding:'3px 8px',borderRadius:6,whiteSpace:'nowrap',fontFamily:"'DM Sans',sans-serif"}}>Copied!</span>}
                  </button>
                </div>
              </div>

              {/* Stats grid */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:12,marginBottom:32}}>
                <div className="detail-stat">
                  <div className="detail-stat-icon"><DollarSign size={16} style={{color:'#d4a96a'}}/></div>
                  <div className="detail-stat-label">{t('rental')}</div>
                  <div className="detail-stat-value">M {Number(property.rental_amount).toLocaleString()}</div>
                </div>
                {property.deposit && (
                  <div className="detail-stat">
                    <div className="detail-stat-icon"><Banknote size={16} style={{color:'#c4a882'}}/></div>
                    <div className="detail-stat-label">Deposit</div>
                    <div className="detail-stat-value">M {Number(property.deposit).toLocaleString()}</div>
                  </div>
                )}
                {property.viewing_fee && (
                  <div className="detail-stat">
                    <div className="detail-stat-icon"><Eye size={16} style={{color:'#a8895f'}}/></div>
                    <div className="detail-stat-label">Viewing</div>
                    <div className="detail-stat-value">M {Number(property.viewing_fee).toLocaleString()}</div>
                  </div>
                )}
                {property.is_approved && (
                  <div className="detail-stat">
                    <div className="detail-stat-icon"><ShieldCheck size={16} style={{color:'#22c55e'}}/></div>
                    <div className="detail-stat-label">{t('verified')}</div>
                    <div className="detail-stat-value" style={{color:'#22c55e'}}>{t('yes')}</div>
                  </div>
                )}
              </div>

              {/* Amenity badges */}
              {(property.bedrooms || property.bathrooms || property.property_type || property.furnished || property.parking || property.pet_friendly || property.security) && (
                <div style={{marginBottom:24}}>
                  <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:700,color:'#1c1a17',marginBottom:12}}>Features</h2>
                  <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
                    {property.property_type && <span style={{display:'inline-flex',alignItems:'center',gap:5,padding:'6px 12px',borderRadius:10,background:'#faf7f3',border:'1px solid #ede8e0',fontSize:13,color:'#5a5248',fontWeight:500}}>{typeLabel[property.property_type]||property.property_type}</span>}
                    {property.bedrooms > 0 && <span style={{display:'inline-flex',alignItems:'center',gap:5,padding:'6px 12px',borderRadius:10,background:'#faf7f3',border:'1px solid #ede8e0',fontSize:13,color:'#5a5248',fontWeight:500}}><BedDouble size={13} style={{color:'#c4a882'}}/>{property.bedrooms} Bedrooms</span>}
                    {property.bathrooms > 0 && <span style={{display:'inline-flex',alignItems:'center',gap:5,padding:'6px 12px',borderRadius:10,background:'#faf7f3',border:'1px solid #ede8e0',fontSize:13,color:'#5a5248',fontWeight:500}}><Bath size={13} style={{color:'#c4a882'}}/>{property.bathrooms} Bathrooms</span>}
                    {property.furnished && <span style={{display:'inline-flex',alignItems:'center',gap:5,padding:'6px 12px',borderRadius:10,background:'#faf7f3',border:'1px solid #ede8e0',fontSize:13,color:'#5a5248',fontWeight:500}}><Sofa size={13} style={{color:'#c4a882'}}/>Furnished</span>}
                    {property.parking && <span style={{display:'inline-flex',alignItems:'center',gap:5,padding:'6px 12px',borderRadius:10,background:'#faf7f3',border:'1px solid #ede8e0',fontSize:13,color:'#5a5248',fontWeight:500}}><Car size={13} style={{color:'#c4a882'}}/>Parking</span>}
                    {property.pet_friendly && <span style={{display:'inline-flex',alignItems:'center',gap:5,padding:'6px 12px',borderRadius:10,background:'#faf7f3',border:'1px solid #ede8e0',fontSize:13,color:'#5a5248',fontWeight:500}}><PawPrint size={13} style={{color:'#c4a882'}}/>Pet friendly</span>}
                    {property.security && <span style={{display:'inline-flex',alignItems:'center',gap:5,padding:'6px 12px',borderRadius:10,background:'#faf7f3',border:'1px solid #ede8e0',fontSize:13,color:'#5a5248',fontWeight:500}}><Shield size={13} style={{color:'#c4a882'}}/>Security</span>}
                    {property.water_supply && <span style={{display:'inline-flex',alignItems:'center',gap:5,padding:'6px 12px',borderRadius:10,background:'#faf7f3',border:'1px solid #ede8e0',fontSize:13,color:'#5a5248',fontWeight:500}}><Droplets size={13} style={{color:'#c4a882'}}/>{waterLabel[property.water_supply]||property.water_supply}</span>}
                    {property.electricity && <span style={{display:'inline-flex',alignItems:'center',gap:5,padding:'6px 12px',borderRadius:10,background:'#faf7f3',border:'1px solid #ede8e0',fontSize:13,color:'#5a5248',fontWeight:500}}><Zap size={13} style={{color:'#c4a882'}}/>{elecLabel[property.electricity]||property.electricity}</span>}
                  </div>
                </div>
              )}

              {/* Description */}
              <div>
                <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:700,color:'#1c1a17',marginBottom:12}}>
                  {t('about_this_property')}
                </h2>
                <p style={{fontSize:14,color:'#7a7060',lineHeight:1.9,whiteSpace:'pre-line'}}>
                  {property.description || t('a_beautiful_property_in_a_prime_location_perfect_for_comfortable_living_contact_the_landlord_for_more_details')}
                </p>
              </div>
            </div>
          </div>

          {/* Right — contact card */}
          <div className="lg:col-span-1" style={{order:1}}>
            <div style={{background:'#fff',border:'1px solid #ede8e0',borderRadius:20,padding:24,position:'sticky',top:90}}>
              {/* Price */}
              <div style={{borderBottom:'1px solid #f3ede6',paddingBottom:20,marginBottom:20}}>
                <p style={{fontSize:11,fontWeight:600,letterSpacing:'0.06em',textTransform:'uppercase',color:'#9c9080',marginBottom:6}}>Monthly rent</p>
                <p style={{fontFamily:"'Playfair Display',serif",fontSize:32,fontWeight:700,color:'#1c1a17',lineHeight:1}}>
                  M {Number(property.rental_amount).toLocaleString()}
                  <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:400,color:'#9c9080'}}> / mo</span>
                </p>
              </div>

              {/* Landlord */}
              <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:20}}>
                <div style={{position:'relative'}}>
                  <div style={{width:42,height:42,borderRadius:'50%',background:'linear-gradient(135deg,#d4a96a,#c4a882)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,fontWeight:700,color:'#fff',fontFamily:"'Playfair Display',serif"}}>
                    {(property.landlord_username||'P')[0].toUpperCase()}
                  </div>
                  {property.landlord_is_verified && (
                    <div style={{position:'absolute',bottom:-3,right:-3,width:18,height:18,borderRadius:'50%',background:'#22c55e',border:'2px solid #fff',display:'flex',alignItems:'center',justifyContent:'center'}}>
                      <ShieldCheck size={10} style={{color:'#fff'}}/>
                    </div>
                  )}
                </div>
                <div>
                  <div style={{display:'flex',alignItems:'center',gap:6}}>
                    <p style={{fontSize:13,fontWeight:500,color:'#1c1a17'}}>{property.landlord_username || t('private')}</p>
                    {property.landlord_is_verified && (
                      <span style={{fontSize:10,fontWeight:600,color:'#22c55e',background:'rgba(34,197,94,0.1)',border:'1px solid rgba(34,197,94,0.25)',borderRadius:100,padding:'1px 7px'}}>Verified</span>
                    )}
                  </div>
                  <p style={{fontSize:11,color:'#9c9080'}}>Property owner{property.landlord_response_rate != null ? ` · ${property.landlord_response_rate}% response rate` : ''}</p>
                </div>
              </div>

              {/* Hide contact/apply/viewing for the landlord viewing their own listing */}
              {user?.username !== property.landlord_username && <button onClick={handleContactLandlord}
                style={{width:'100%',padding:'13px',borderRadius:12,background:'#1c1a17',color:'#fff',border:'none',fontSize:14,fontWeight:500,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",display:'flex',alignItems:'center',justifyContent:'center',gap:8,marginBottom:10,transition:'background 0.18s'}}
                onMouseEnter={e=>e.currentTarget.style.background='#3a3430'}
                onMouseLeave={e=>e.currentTarget.style.background='#1c1a17'}>
                <MessageCircle size={16}/> {t('contact_landlord')}
              </button>}

              {user?.username !== property.landlord_username && property.whatsapp_number && (
                <button
                  onClick={() => {
                    const num = property.whatsapp_number.replace(/\D/g,'');
                    const text = encodeURIComponent(`Hi, I'm interested in your property in ${property.area}, ${property.district}. Listed on Lehae.`);
                    window.open(`https://wa.me/${num}?text=${text}`, '_blank');
                  }}
                  style={{width:'100%',padding:'12px',borderRadius:12,background:'rgba(37,211,102,0.08)',color:'#25D366',border:'1px solid rgba(37,211,102,0.3)',fontSize:14,fontWeight:500,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",display:'flex',alignItems:'center',justifyContent:'center',gap:8,marginBottom:10,transition:'all 0.15s'}}
                  onMouseEnter={e=>e.currentTarget.style.background='rgba(37,211,102,0.15)'}
                  onMouseLeave={e=>e.currentTarget.style.background='rgba(37,211,102,0.08)'}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  WhatsApp
                </button>
              )}
              {user?.username !== property.landlord_username && (
              <button
                style={{width:'100%',padding:'12px',borderRadius:12,background:'transparent',color:'#7a7060',border:'1px solid #ede8e0',fontSize:14,fontWeight:500,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",transition:'all 0.15s',marginBottom:10}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor='#c4a882';e.currentTarget.style.color='#1c1a17';}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor='#ede8e0';e.currentTarget.style.color='#7a7060';}}
                onClick={() => setShowViewingModal(true)}>
                📅 Request a Viewing
              </button>)}

              {/* Landlord sees edit shortcut instead */}
              {user?.username === property.landlord_username && (
                <button onClick={() => navigate('/manage-listings')}
                  style={{width:'100%',padding:'12px',borderRadius:12,background:'#faf7f3',color:'#5a5248',border:'1px solid #ede8e0',fontSize:14,fontWeight:500,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",marginBottom:10}}>
                  ✏️ Edit this Listing
                </button>
              )}

              {showViewingModal && (
                <ViewingRequestModal property={property} onClose={() => setShowViewingModal(false)} />
              )}

              {user?.username !== property.landlord_username && (
              <button
                style={{width:'100%',padding:'12px',borderRadius:12,background:'transparent',color:'#7a7060',border:'1px solid #ede8e0',fontSize:14,fontWeight:500,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",transition:'all 0.15s',marginBottom:10}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor='#c4a882';e.currentTarget.style.color='#1c1a17';}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor='#ede8e0';e.currentTarget.style.color='#7a7060';}}
                onClick={() => setShowApplicationModal(true)}>
                📋 Apply for this Property
              </button>)}

              {showApplicationModal && (
                <RentalApplicationModal property={property} onClose={() => setShowApplicationModal(false)} />
              )}
            </div>
          </div>

          {/* Map */}
          <div className="lg:col-span-2" style={{ marginTop:8, order:3 }}>
            <h2 style={{ fontFamily:"'Playfair Display',serif",fontSize:17,fontWeight:700,color:'#1c1a17',marginBottom:12 }}>Location</h2>
            <PropertyMap property={property} height="260px" />
            <p style={{ fontSize:11,color:'#b5a898',marginTop:6,fontFamily:"'DM Sans',sans-serif" }}>
              📍 Approximate location in {property.district}
            </p>
          </div>

          {/* Reviews */}
          <div className="lg:col-span-2" style={{order:2}}>
            <ReviewSection propertyId={id} />
          </div>

        </div>
      </div>
    </motion.div>
  );
};

export default PropertyDetail;