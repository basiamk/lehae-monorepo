import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Heart, MapPin, ArrowUpRight, BedDouble, Bath, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const WHATSAPP_GREEN = '#25D366';

const statusConfig = {
  vacant:   { label: 'Available', color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
  occupied: { label: 'Occupied',  color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
  inactive: { label: 'Inactive',  color: '#94a3b8', bg: 'rgba(148,163,184,0.12)' },
};

const typeLabel = {
  house: 'House', apartment: 'Apt', room: 'Room',
  cottage: 'Cottage', studio: 'Studio', townhouse: 'Townhouse',
};

const PropertyCard = ({ property, onFavoriteToggle }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [imgIndex, setImgIndex]         = useState(0);
  const [favoriteAnim, setFavoriteAnim] = useState(false);

  const {
    id, area, district, rental_amount, is_favorited,
    images, landlord_username, landlord_is_verified, landlord_response_rate,
    status, description, deposit,
    bedrooms, bathrooms, property_type, whatsapp_number,
    is_approved,
  } = property;

  const allImages    = images?.length > 0
    ? images.map(i => i.image_url)
    : ['https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&q=80'];
  const currentImage = allImages[imgIndex];
  const statusInfo   = statusConfig[status] || statusConfig.vacant;

  const handleClick         = () => id && navigate(`/properties/${id}`);
  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    setFavoriteAnim(true);
    setTimeout(() => setFavoriteAnim(false), 600);
    if (id) onFavoriteToggle(id, is_favorited);
  };
  const handleWhatsApp = (e) => {
    e.stopPropagation();
    const num  = whatsapp_number.replace(/\D/g, '');
    const text = encodeURIComponent(`Hi, I'm interested in your property in ${area}, ${district}. Listed on Lehae.`);
    window.open(`https://wa.me/${num}?text=${text}`, '_blank');
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;700&family=DM+Sans:wght@300;400;500&display=swap');
        .lehae-card { font-family:'DM Sans',sans-serif; background:#fff; border-radius:20px; overflow:hidden; cursor:pointer; position:relative; box-shadow:0 2px 12px rgba(0,0,0,0.07); transition:box-shadow 0.35s ease,transform 0.35s ease; border:1px solid #f0ede8; max-width:400px; width:100%; }
        .lehae-card:hover { box-shadow:0 16px 48px rgba(0,0,0,0.14); transform:translateY(-6px); }
        .lehae-card:hover .lehae-img { transform:scale(1.06); }
        .lehae-card.unapproved { opacity:0.7; }
        .lehae-img-wrap { position:relative; height:210px; overflow:hidden; background:#e8e4df; }
        .lehae-img { width:100%; height:100%; object-fit:cover; transition:transform 0.7s cubic-bezier(0.25,0.46,0.45,0.94); display:block; }
        .lehae-img-overlay { position:absolute; inset:0; background:linear-gradient(to bottom,rgba(0,0,0,0) 40%,rgba(10,8,5,0.55) 100%); pointer-events:none; }
        .lehae-status { position:absolute; top:14px; left:14px; display:flex; align-items:center; gap:5px; padding:5px 11px; border-radius:100px; font-size:11px; font-weight:500; letter-spacing:0.04em; backdrop-filter:blur(8px); border:1px solid rgba(255,255,255,0.18); }
        .lehae-status-dot { width:5px; height:5px; border-radius:50%; }
        .lehae-fav-btn { position:absolute; top:12px; right:12px; width:36px; height:36px; border-radius:50%; background:rgba(255,255,255,0.92); backdrop-filter:blur(8px); border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:background 0.2s,transform 0.2s; }
        .lehae-fav-btn:hover { background:#fff; transform:scale(1.1); }
        .lehae-fav-btn.pop { animation:favPop 0.5s cubic-bezier(0.34,1.56,0.64,1); }
        @keyframes favPop { 0%{transform:scale(1)} 40%{transform:scale(1.35)} 100%{transform:scale(1)} }
        .lehae-dots { position:absolute; bottom:12px; left:50%; transform:translateX(-50%); display:flex; gap:5px; }
        .lehae-dot { width:5px; height:5px; border-radius:50%; background:rgba(255,255,255,0.45); border:none; cursor:pointer; padding:0; transition:background 0.2s,transform 0.2s; }
        .lehae-dot.active { background:#fff; transform:scale(1.4); }
        .lehae-img-bottom { position:absolute; bottom:0; left:0; right:0; padding:12px 16px; }
        .lehae-price { font-family:'Playfair Display',serif; font-size:21px; font-weight:700; color:#fff; line-height:1; text-shadow:0 1px 4px rgba(0,0,0,0.3); }
        .lehae-price span { font-family:'DM Sans',sans-serif; font-size:12.5px; font-weight:400; color:rgba(255,255,255,0.72); }
        .lehae-body { padding:18px 18px 16px; }
        .lehae-location { display:flex; align-items:center; gap:4px; color:#b5a898; font-size:11px; font-weight:500; letter-spacing:0.06em; text-transform:uppercase; margin-bottom:6px; }
        .lehae-title { font-family:'Playfair Display',serif; font-size:17px; font-weight:700; color:#1c1a17; margin:0 0 8px; line-height:1.25; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .lehae-badges { display:flex; flex-wrap:wrap; gap:6px; margin-bottom:10px; }
        .lehae-badge { display:inline-flex; align-items:center; gap:4px; font-size:11px; color:#7a7060; background:#faf7f3; border:1px solid #ede8e0; border-radius:8px; padding:3px 9px; font-weight:500; }
        .lehae-verified-badge { display:inline-flex; align-items:center; gap:4px; font-size:11px; color:#22c55e; background:rgba(34,197,94,0.08); border:1px solid rgba(34,197,94,0.25); border-radius:8px; padding:3px 9px; font-weight:500; }
        .lehae-pending-badge { display:inline-flex; align-items:center; gap:4px; font-size:11px; color:#f59e0b; background:rgba(245,158,11,0.08); border:1px solid rgba(245,158,11,0.25); border-radius:8px; padding:3px 9px; font-weight:500; }
        .lehae-desc { font-size:13px; color:#7a7060; line-height:1.6; margin:0 0 14px; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
        .lehae-footer { display:flex; align-items:center; justify-content:space-between; border-top:1px solid #f3ede6; padding-top:13px; gap:8px; }
        .lehae-landlord { display:flex; align-items:center; gap:7px; font-size:12px; color:#9c9080; min-width:0; }
        .lehae-avatar { width:26px; height:26px; border-radius:50%; background:linear-gradient(135deg,#d4a96a,#e8c98a); display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:600; color:#fff; flex-shrink:0; }
        .lehae-cta { display:flex; align-items:center; gap:5px; background:#1c1a17; color:#fff; border:none; border-radius:100px; padding:7px 13px; font-size:12px; font-weight:500; font-family:'DM Sans',sans-serif; cursor:pointer; transition:background 0.2s,transform 0.15s; flex-shrink:0; }
        .lehae-cta:hover { background:#3a3020; transform:scale(1.03); }
        .lehae-wa { display:flex; align-items:center; gap:4px; border:none; border-radius:100px; padding:7px 11px; font-size:12px; font-weight:500; font-family:'DM Sans',sans-serif; cursor:pointer; transition:all 0.15s; flex-shrink:0; }
      `}</style>

      <motion.div className={`lehae-card${!is_approved ? ' unapproved' : ''}`} onClick={handleClick} layout>
        {/* Image */}
        <div className="lehae-img-wrap">
          <AnimatePresence mode="wait">
            <motion.img key={imgIndex} src={currentImage} alt={`${area}, ${district}`}
              className="lehae-img" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} transition={{ duration:0.3 }} />
          </AnimatePresence>
          <div className="lehae-img-overlay" />

          {/* Status */}
          <div className="lehae-status" style={{ background:statusInfo.bg, color:statusInfo.color }}>
            <div className="lehae-status-dot" style={{ background:statusInfo.color }} />
            {statusInfo.label}
          </div>

          {/* Pending approval ribbon */}
          {!is_approved && (
            <div style={{ position:'absolute', top:14, right:12, background:'rgba(245,158,11,0.9)', color:'#fff', fontSize:10, fontWeight:600, padding:'3px 9px', borderRadius:100, letterSpacing:'0.04em', backdropFilter:'blur(4px)' }}>
              Pending Review
            </div>
          )}

          {/* Favorite */}
          <button className={`lehae-fav-btn ${favoriteAnim?'pop':''}`} onClick={handleFavoriteClick}>
            <Heart size={15} style={{ fill:is_favorited?'#ef4444':'none', color:is_favorited?'#ef4444':'#6b6560', transition:'all 0.2s' }} />
          </button>

          {/* Image dots */}
          {allImages.length > 1 && (
            <div className="lehae-dots">
              {allImages.map((_, i) => (
                <button key={i} className={`lehae-dot ${i===imgIndex?'active':''}`}
                  onClick={e => { e.stopPropagation(); setImgIndex(i); }} />
              ))}
            </div>
          )}

          {/* Price */}
          <div className="lehae-img-bottom">
            <div className="lehae-price">M {Number(rental_amount).toLocaleString()} <span>/ mo</span></div>
          </div>
        </div>

        {/* Body */}
        <div className="lehae-body">
          <div className="lehae-location">
            <MapPin size={10} /> {district}
          </div>
          <h3 className="lehae-title">{area}, {district}</h3>

          {/* Amenity + verified badges */}
          <div className="lehae-badges">
            {property_type && (
              <span className="lehae-badge">{typeLabel[property_type] || property_type}</span>
            )}
            {bedrooms > 0 && (
              <span className="lehae-badge"><BedDouble size={10} /> {bedrooms} bed</span>
            )}
            {bathrooms > 0 && (
              <span className="lehae-badge"><Bath size={10} /> {bathrooms} bath</span>
            )}
            {deposit && (
              <span className="lehae-badge">Dep: M {Number(deposit).toLocaleString()}</span>
            )}
            {landlord_is_verified && (
              <span className="lehae-verified-badge"><ShieldCheck size={10} /> Verified landlord</span>
            )}
          </div>

          <p className="lehae-desc">
            {description || 'A well-situated rental property in a convenient location.'}
          </p>

          <div className="lehae-footer">
            <div className="lehae-landlord">
              <div className="lehae-avatar">{(landlord_username||'P')[0].toUpperCase()}</div>
              <span style={{ overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>
                {landlord_username || 'Private'}
              </span>
              {landlord_is_verified && (
                <ShieldCheck size={12} style={{ color:'#22c55e', flexShrink:0 }} />
              )}
              {landlord_response_rate !== null && landlord_response_rate !== undefined && (
                <span style={{ fontSize:10,color:'#9c9080',fontFamily:"'DM Sans',sans-serif",flexShrink:0 }}>
                  {landlord_response_rate}% response
                </span>
              )}
            </div>
            <div style={{ display:'flex',gap:6 }}>
              {whatsapp_number && (
                <button className="lehae-wa" onClick={handleWhatsApp}
                  style={{ background:'rgba(37,211,102,0.1)', color:WHATSAPP_GREEN, border:`1px solid rgba(37,211,102,0.25)` }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill={WHATSAPP_GREEN}>
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Chat
                </button>
              )}
              <button className="lehae-cta" onClick={handleClick}>
                View <ArrowUpRight size={12} />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default PropertyCard;