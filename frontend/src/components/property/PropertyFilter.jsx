import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, SlidersHorizontal, ChevronDown, MapPin, Tag, Banknote, BedDouble, Home, Bookmark, BookmarkCheck } from 'lucide-react';
import { saveSearch, buildLabel } from '../../pages/SavedSearches.jsx';

const DISTRICTS = [
  'Maseru','Leribe','Berea','Mafeteng',
  "Mohale's Hoek",'Quthing',"Qacha's Nek",
  'Mokhotlong','Thaba-Tseka','Butha-Buthe',
];

const PROPERTY_TYPES = [
  { value:'', label:'Any type' },
  { value:'house',     label:'House' },
  { value:'apartment', label:'Apartment' },
  { value:'room',      label:'Room' },
  { value:'cottage',   label:'Cottage' },
  { value:'studio',    label:'Studio' },
  { value:'townhouse', label:'Townhouse' },
];

const defaultFilters = {
  area:'', district:'', status:'all',
  minPrice:'', maxPrice:'',
  property_type:'', bedrooms:'',
  furnished:'', parking:'', pet_friendly:'',
};

const PropertyFilter = ({ onFilter, initialFilters = {} }) => {
  const { t } = useLanguage();
  const [filters, setFilters]   = useState({ ...defaultFilters, ...initialFilters });
  const [isOpen, setIsOpen]     = useState(false);
  const [activeCount, setActiveCount] = useState(0);
  const [justSaved, setJustSaved] = useState(false);

  const handleSaveSearch = () => {
    saveSearch(filters, buildLabel(filters));
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2500);
  };

  useEffect(() => {
    setFilters(f => ({ ...f, ...initialFilters }));
  }, [initialFilters]);

  useEffect(() => {
    const count = [
      filters.area,
      filters.district,
      filters.status !== 'all' ? filters.status : '',
      filters.minPrice,
      filters.maxPrice,
      filters.property_type,
      filters.bedrooms,
      filters.furnished,
      filters.parking,
      filters.pet_friendly,
    ].filter(Boolean).length;
    setActiveCount(count);
  }, [filters]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleToggle = (name) => {
    setFilters(prev => ({
      ...prev,
      [name]: prev[name] === 'true' ? '' : 'true',
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onFilter(filters);
    setIsOpen(false);
  };

  const handleClear = () => {
    setFilters(defaultFilters);
    onFilter(defaultFilters);
  };

  const removeFilter = (key) => {
    const updated = { ...filters, [key]: key === 'status' ? 'all' : '' };
    setFilters(updated);
    onFilter(updated);
  };

  const activeChips = [
    filters.area         && { key:'area',          label: filters.area },
    filters.district     && { key:'district',       label: filters.district },
    filters.status !== 'all' && filters.status && { key:'status', label: filters.status },
    filters.minPrice     && { key:'minPrice',       label:`M${filters.minPrice}+` },
    filters.maxPrice     && { key:'maxPrice',       label:`up to M${filters.maxPrice}` },
    filters.property_type && { key:'property_type', label: filters.property_type },
    filters.bedrooms     && { key:'bedrooms',       label:`${filters.bedrooms} bed` },
    filters.furnished === 'true'    && { key:'furnished',    label:'Furnished' },
    filters.parking === 'true'      && { key:'parking',      label:'Parking' },
    filters.pet_friendly === 'true' && { key:'pet_friendly', label:'Pet friendly' },
  ].filter(Boolean);

  const Panel = (
    <div style={{ fontFamily:"'DM Sans',sans-serif", background:'var(--color-background-primary,#fff)', border:'1px solid #ede8e0', borderRadius:20, overflow:'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@400;500&display=swap');
        .pf-label { font-size:10.5px; font-weight:500; letter-spacing:0.07em; text-transform:uppercase; color:#b5a898; margin-bottom:7px; display:flex; align-items:center; gap:5px; }
        .pf-input { width:100%; padding:10px 36px 10px 13px; border:1px solid #ede8e0; border-radius:11px; font-size:13.5px; font-family:'DM Sans',sans-serif; color:#1c1a17; background:#fff; outline:none; appearance:none; transition:border-color 0.18s; }
        .pf-input:focus { border-color:#c4a882; }
        .pf-input::placeholder { color:#c4bdb4; }
        .pf-icon { position:absolute; right:11px; top:50%; transform:translateY(-50%); color:#c4bdb4; pointer-events:none; }
        .pf-wrap { position:relative; }
        .pf-section { padding:0 20px 14px; }
        .pf-divider { height:1px; background:#f3ede6; margin:4px 20px 14px; }
        .pf-status-btn { flex:1; padding:8px 4px; border-radius:10px; font-size:12px; font-weight:500; font-family:'DM Sans',sans-serif; cursor:pointer; transition:all 0.15s; text-align:center; }
        .pf-status-btn.off { border:1px solid #ede8e0; background:transparent; color:#9c9080; }
        .pf-status-btn.on  { border:1.5px solid #1c1a17; background:#1c1a17; color:#fff; }
        .pf-toggle-row { display:flex; align-items:center; justify-content:space-between; padding:8px 0; }
        .pf-toggle-label { font-size:13px; color:#5a5248; font-weight:500; }
        .pf-check { width:20px; height:20px; border-radius:6px; border:1.5px solid; cursor:pointer; display:flex; align-items:center; justify-content:center; flex-shrink:0; transition:all 0.15s; }
        .pf-check.on  { background:#1c1a17; border-color:#1c1a17; }
        .pf-check.off { background:#fff; border-color:#ede8e0; }
        .pf-btn-apply { width:100%; padding:12px; background:#1c1a17; color:#fff; border:none; border-radius:12px; font-size:14px; font-weight:500; font-family:'DM Sans',sans-serif; cursor:pointer; transition:background 0.18s; }
        .pf-btn-apply:hover { background:#3a3020; }
        .pf-btn-clear { width:100%; padding:10px; background:transparent; color:#b5a898; border:1px solid #ede8e0; border-radius:12px; font-size:13px; font-family:'DM Sans',sans-serif; cursor:pointer; transition:all 0.15s; }
        .pf-btn-clear:hover { background:#faf7f3; }
        .pf-header { padding:18px 20px 14px; display:flex; align-items:center; justify-content:space-between; }
        .pf-heading { font-family:'Playfair Display',serif; font-size:17px; font-weight:700; color:#1c1a17; }
        .pf-badge { background:#1c1a17; color:#fff; border-radius:100px; font-size:10px; font-weight:600; padding:2px 8px; margin-left:6px; }
        .pf-price-row { display:grid; grid-template-columns:1fr 1fr; gap:9px; }
      `}</style>

      {/* Header */}
      <div className="pf-header">
        <div style={{ display:'flex',alignItems:'center' }}>
          <span className="pf-heading">Filters</span>
          {activeCount > 0 && <span className="pf-badge">{activeCount}</span>}
        </div>
        <button onClick={() => setIsOpen(false)} style={{ background:'none',border:'none',cursor:'pointer',color:'#b5a898',padding:2 }}>
          <X size={18} />
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="pf-divider" style={{ margin:'0 20px 14px' }} />

        {/* Area */}
        <div className="pf-section">
          <div className="pf-label"><MapPin size={11}/>Area</div>
          <div className="pf-wrap">
            <input name="area" type="text" placeholder="e.g. Ha Tsolo…" value={filters.area} onChange={handleChange} className="pf-input" />
            <span className="pf-icon"><Search size={13}/></span>
          </div>
        </div>

        {/* District */}
        <div className="pf-section" style={{ paddingTop:0 }}>
          <div className="pf-label"><MapPin size={11}/>District</div>
          <div className="pf-wrap">
            <select name="district" value={filters.district} onChange={handleChange} className="pf-input" style={{ cursor:'pointer' }}>
              <option value="">All Districts</option>
              {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <span className="pf-icon"><ChevronDown size={13}/></span>
          </div>
        </div>

        {/* Property type */}
        <div className="pf-section" style={{ paddingTop:0 }}>
          <div className="pf-label"><Home size={11}/>Property Type</div>
          <div className="pf-wrap">
            <select name="property_type" value={filters.property_type} onChange={handleChange} className="pf-input" style={{ cursor:'pointer' }}>
              {PROPERTY_TYPES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <span className="pf-icon"><ChevronDown size={13}/></span>
          </div>
        </div>

        {/* Bedrooms */}
        <div className="pf-section" style={{ paddingTop:0 }}>
          <div className="pf-label"><BedDouble size={11}/>Bedrooms</div>
          <div style={{ display:'flex', gap:6 }}>
            {['','1','2','3','4+'].map(val => (
              <button key={val} type="button"
                className={`pf-status-btn ${filters.bedrooms === val ? 'on' : 'off'}`}
                onClick={() => setFilters(f => ({ ...f, bedrooms: val }))}>
                {val === '' ? 'Any' : val}
              </button>
            ))}
          </div>
        </div>

        {/* Availability */}
        <div className="pf-section" style={{ paddingTop:0 }}>
          <div className="pf-label"><Tag size={11}/>Availability</div>
          <div style={{ display:'flex',gap:7 }}>
            {['all','vacant','occupied'].map(s => (
              <button key={s} type="button"
                className={`pf-status-btn ${filters.status === s ? 'on' : 'off'}`}
                onClick={() => setFilters(f => ({ ...f, status: s }))}>
                {s === 'all' ? 'All' : s === 'vacant' ? 'Available' : 'Occupied'}
              </button>
            ))}
          </div>
        </div>

        {/* Price */}
        <div className="pf-section" style={{ paddingTop:0 }}>
          <div className="pf-label"><Banknote size={11}/>Monthly Rent (M)</div>
          <div className="pf-price-row">
            <div className="pf-wrap">
              <input type="number" name="minPrice" placeholder="Min" value={filters.minPrice} onChange={handleChange} className="pf-input" style={{ paddingRight:13 }} />
            </div>
            <div className="pf-wrap">
              <input type="number" name="maxPrice" placeholder="Max" value={filters.maxPrice} onChange={handleChange} className="pf-input" style={{ paddingRight:13 }} />
            </div>
          </div>
        </div>

        {/* Feature toggles */}
        <div className="pf-section" style={{ paddingTop:0 }}>
          <div className="pf-label">Features</div>
          {[
            { key:'furnished',    label:'Furnished' },
            { key:'parking',      label:'Parking' },
            { key:'pet_friendly', label:'Pet friendly' },
          ].map(({ key, label }) => (
            <div key={key} className="pf-toggle-row">
              <span className="pf-toggle-label">{label}</span>
              <div className={`pf-check ${filters[key]==='true'?'on':'off'}`} onClick={() => handleToggle(key)}>
                {filters[key]==='true' && <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><polyline points="2,6 5,9 10,3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              </div>
            </div>
          ))}
        </div>

        <div style={{ height:1,background:'#f3ede6',margin:'4px 20px 14px' }} />
        <div style={{ padding:'0 20px 20px', display:'flex', flexDirection:'column', gap:8 }}>
          <button type="submit" className="pf-btn-apply">Apply Filters</button>
          {activeCount > 0 && (
            <button type="button" className="pf-btn-clear" onClick={handleClear}>
              Clear all filters
            </button>
          )}
          {activeCount > 0 && (
            <button type="button" onClick={handleSaveSearch}
              style={{ width:'100%', padding:'10px', background:justSaved?'rgba(34,197,94,0.08)':'transparent', color:justSaved?'#22c55e':'#9c9080', border:`1px solid ${justSaved?'#86efac':'#ede8e0'}`, borderRadius:12, fontSize:13, fontFamily:"'DM Sans',sans-serif", cursor:'pointer', transition:'all 0.2s', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
              {justSaved ? <BookmarkCheck size={13}/> : <Bookmark size={13}/>}
              {justSaved ? 'Search saved!' : 'Save this search'}
            </button>
          )}
        </div>
      </form>
    </div>
  );

  return (
    <>
      {/* Desktop: always visible */}
      <div className="hidden md:block">{Panel}</div>

      {/* Mobile FAB */}
      <button
        className="md:hidden"
        onClick={() => setIsOpen(!isOpen)}
        style={{ position:'fixed',bottom:24,right:24,zIndex:50,display:'flex',alignItems:'center',gap:8,padding:'10px 18px',borderRadius:100,background:'#1c1a17',color:'#fff',border:'none',cursor:'pointer',fontFamily:"'DM Sans',sans-serif",fontSize:14,fontWeight:500,boxShadow:'0 4px 16px rgba(0,0,0,0.18)' }}>
        <SlidersHorizontal size={16}/>
        Filters
        {activeCount > 0 && (
          <span style={{ background:'#d4a96a',borderRadius:'100px',fontSize:10,fontWeight:700,padding:'1px 6px',color:'#fff' }}>
            {activeCount}
          </span>
        )}
      </button>

      {/* Mobile drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.4)',zIndex:40 }}
              onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ y:'100%' }} animate={{ y:0 }} exit={{ y:'100%' }}
              transition={{ type:'spring',damping:28,stiffness:280 }}
              style={{ position:'fixed',bottom:0,left:0,right:0,zIndex:50,maxHeight:'90vh',overflowY:'auto',borderRadius:'20px 20px 0 0' }}
              className="md:hidden">
              {Panel}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Active chips */}
      {activeChips.length > 0 && (
        <div style={{ display:'flex',flexWrap:'wrap',gap:8,marginTop:12,fontFamily:"'DM Sans',sans-serif" }}>
          {activeChips.map(f => (
            <div key={f.key} style={{ display:'inline-flex',alignItems:'center',gap:5,padding:'5px 11px',borderRadius:100,background:'#faf7f3',border:'1px solid #ede8e0',fontSize:12,color:'#7a7060',fontWeight:500 }}>
              {f.label}
              <button onClick={() => removeFilter(f.key)}
                style={{ background:'none',border:'none',cursor:'pointer',color:'#b5a898',display:'flex',padding:0 }}>
                <X size={11}/>
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default PropertyFilter;