import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axiosInstance from '../utils/axios.js';
import PropertyCard from '../components/property/PropertyCard.jsx';
import SkeletonGrid from '../components/common/SkeletonCard.jsx';
import { Search, ChevronDown, ChevronLeft, ChevronRight, ArrowRight, Shield, Zap, Users, Star, CheckCircle2, TrendingUp } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const TESTIMONIALS = [
  { name: 'Mpho Letsie',    role: 'Tenant, Maseru',       text: 'Found my apartment in 2 days. The WhatsApp button made it so easy to contact the landlord directly.', rating: 5 },
  { name: 'Thabo Mokoena',  role: 'Landlord, Leribe',     text: 'I listed my property and had 3 enquiries within a week. Much better than putting up signs outside.', rating: 5 },
  { name: 'Lineo Ramathe',  role: 'Tenant, Berea',        text: 'Lehae showed me exactly what I needed — bedrooms, water supply, everything. No surprises when I arrived.', rating: 5 },
];

const TRUST_STATS = [
  { num: '200+', label: 'Properties Listed' },
  { num: '10',   label: 'Districts Covered' },
  { num: '500+', label: 'Happy Tenants' },
  { num: '98%',  label: 'Response Rate' },
];

const Home = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [featuredProperties, setFeaturedProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchFilters, setSearchFilters] = useState({ area: '', district: '', status: '' });
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const fetchFeatured = async () => {
      try {
        setLoading(true); setError('');
        const response = await axiosInstance.get('/api/properties/', { params: { limit: 9, ordering: '-created_at' } });
        if (cancelled) return;
        const data = Array.isArray(response.data) ? response.data : response.data.results || [];
        setFeaturedProperties(data);
      } catch { if (!cancelled) setError(t('Failed to load featured properties')); }
      finally   { if (!cancelled) setLoading(false); }
    };
    fetchFeatured();
    return () => { cancelled = true; };
  }, [t]);

  const handleSearchChange = (e) => setSearchFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const handleSearch = () => navigate(`/properties?${new URLSearchParams(searchFilters).toString()}`);
  const carouselPages = Math.ceil(featuredProperties.length / 3);
  const handlePrev = () => setCurrentIndex(prev => (prev === 0 ? carouselPages - 1 : prev - 1));
  const handleNext = () => setCurrentIndex(prev => (prev >= carouselPages - 1 ? 0 : prev + 1));

  const features = [
    { icon: Shield, title: 'Verified Listings',   desc: 'Every property is reviewed and approved before going live.' },
    { icon: Zap,    title: 'Direct Connect',       desc: 'Message landlords directly — no agents, no middlemen.' },
    { icon: Users,  title: 'Trusted Community',   desc: 'A growing network of landlords and tenants across Lesotho.' },
  ];

  return (
    <div className="page-enter bg-neutral-50 min-h-screen">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400&family=DM+Sans:wght@300;400;500&display=swap');
        .hero-input { width:100%; padding:14px 48px 14px 18px; border:1px solid #ede8e0; border-radius:14px; font-size:15px; font-family:'DM Sans',sans-serif; color:#1c1a17; background:#fff; outline:none; transition:border-color 0.18s,box-shadow 0.18s; appearance:none; -webkit-appearance:none; }
        .hero-input:focus { border-color:#c4a882; box-shadow:0 0 0 3px rgba(196,168,130,0.15); }
        .hero-input::placeholder { color:#c4bdb4; }
        .hero-select { cursor:pointer; padding-right:44px !important; }
        .hero-icon { position:absolute; right:14px; top:50%; transform:translateY(-50%); color:#c4bdb4; pointer-events:none; }
        .step-num { font-family:'Playfair Display',serif; font-size:48px; font-weight:700; color:rgba(196,168,130,0.2); line-height:1; margin-bottom:8px; }
        .star { color:#d4a96a; font-size:14px; }
        .testimonial-card { background:#fff; border:1px solid #ede8e0; border-radius:20px; padding:28px; }
        .trust-badge { display:flex; align-items:center; gap:8px; padding:10px 18px; background:#faf7f3; border:1px solid #ede8e0; border-radius:12px; font-size:13px; color:#5a5248; font-weight:500; }
      `}</style>

      {/* ── Hero ── */}
      <motion.section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden"
        initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ duration:1 }}>
        <div className="absolute inset-0 bg-[url('/hero-bg.jpg')] bg-cover bg-center" />
        <div className="absolute inset-0" style={{ background:'linear-gradient(135deg,rgba(28,26,23,0.82) 0%,rgba(28,26,23,0.55) 100%)' }} />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage:'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'1\'/%3E%3C/svg%3E")', backgroundRepeat:'repeat' }} />

        <div className="relative z-10 w-full max-w-5xl mx-auto px-6 text-center">
          <motion.p className="text-sm font-medium tracking-widest uppercase mb-6" style={{ color:'#d4a96a', letterSpacing:'0.15em' }}
            initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}>
            Lesotho's Rental Platform
          </motion.p>
          <motion.h1 className="font-heading font-bold text-white mb-6"
            style={{ fontSize:'clamp(2.8rem,7vw,5.5rem)', lineHeight:1.1, letterSpacing:'-0.02em' }}
            initial={{ opacity:0, y:30 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.35 }}>
            {t('find_your_perfect_home_in_lesotho')}
          </motion.h1>
          <motion.p className="text-lg md:text-xl mb-12 max-w-2xl mx-auto"
            style={{ color:'rgba(255,255,255,0.65)', lineHeight:1.7 }}
            initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.5 }}>
            {t('verified_rentals_connect_directly_with_landlords_no_middlemen')}
          </motion.p>

          {/* Search bar */}
          <motion.div className="bg-white rounded-2xl p-3 shadow-soft max-w-3xl mx-auto" style={{ border:'1px solid #ede8e0' }}
            initial={{ opacity:0, y:30 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.65 }}>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
              <div className="relative md:col-span-1">
                <input type="text" name="area" placeholder={t('area_e_g_ha_tsolo')} value={searchFilters.area} onChange={handleSearchChange} className="hero-input" />
                <span className="hero-icon"><Search size={15}/></span>
              </div>
              <div className="relative md:col-span-1">
                <input type="text" name="district" placeholder={t('district_e_g_maseru')} value={searchFilters.district} onChange={handleSearchChange} className="hero-input" />
                <span className="hero-icon"><Search size={15}/></span>
              </div>
              <div className="relative md:col-span-1">
                <select name="status" value={searchFilters.status} onChange={handleSearchChange} className="hero-input hero-select">
                  <option value="">{t('all_statuses')}</option>
                  <option value="vacant">{t('vacant')}</option>
                  <option value="occupied">{t('occupied')}</option>
                </select>
                <span className="hero-icon"><ChevronDown size={15}/></span>
              </div>
              <button onClick={handleSearch}
                className="w-full py-3 px-6 rounded-xl font-medium text-white text-sm flex items-center justify-center gap-2 transition-all duration-200"
                style={{ background:'#1c1a17' }}
                onMouseEnter={e=>e.currentTarget.style.background='#3a3430'}
                onMouseLeave={e=>e.currentTarget.style.background='#1c1a17'}>
                {t('search_now')} <ArrowRight size={15}/>
              </button>
            </div>
          </motion.div>

          {/* Live stats */}
          <motion.div className="flex flex-wrap justify-center gap-10 mt-14"
            initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.9 }}>
            {TRUST_STATS.map(({ num, label }) => (
              <div key={label} className="text-center">
                <div style={{ fontFamily:"'Playfair Display',serif", fontSize:26, fontWeight:700, color:'#d4a96a' }}>{num}</div>
                <div style={{ fontSize:12, color:'rgba(255,255,255,0.5)', letterSpacing:'0.06em', textTransform:'uppercase', marginTop:4 }}>{label}</div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Scroll cue */}
        <motion.div className="absolute bottom-10 left-1/2 -translate-x-1/2"
          animate={{ y:[0,8,0] }} transition={{ repeat:Infinity, duration:2.5 }}>
          <div style={{ width:1, height:40, background:'linear-gradient(to bottom,transparent,rgba(212,169,106,0.6))' }} />
        </motion.div>
      </motion.section>

      {/* ── Social proof bar ── */}
      <section style={{ background:'#1c1a17', padding:'18px 0' }}>
        <div className="max-w-6xl mx-auto px-6">
          <div style={{ display:'flex', flexWrap:'wrap', alignItems:'center', justifyContent:'center', gap:16 }}>
            {[
              { icon: CheckCircle2, text:'Verified landlords only' },
              { icon: Shield,       text:'No scam listings policy' },
              { icon: Zap,          text:'Direct WhatsApp contact' },
              { icon: TrendingUp,   text:'New listings every week' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} style={{ display:'flex', alignItems:'center', gap:7, fontSize:13, color:'rgba(255,255,255,0.6)', fontFamily:"'DM Sans',sans-serif" }}>
                <Icon size={14} style={{ color:'#d4a96a', flexShrink:0 }}/> {text}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Properties ── */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-end justify-between mb-14">
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color:'#d4a96a' }}>Hand-picked</p>
              <h2 className="font-heading font-bold text-secondary" style={{ fontSize:'clamp(1.8rem,4vw,2.8rem)' }}>
                {t('featured_homes')}
              </h2>
            </div>
            <button onClick={() => navigate('/properties')}
              className="hidden md:flex items-center gap-2 text-sm font-medium transition-colors"
              style={{ color:'#9c9080' }}
              onMouseEnter={e=>e.currentTarget.style.color='#1c1a17'}
              onMouseLeave={e=>e.currentTarget.style.color='#9c9080'}>
              {t('view_all')} <ArrowRight size={15}/>
            </button>
          </div>

          {loading ? (
            <SkeletonGrid count={3} />
          ) : error ? (
            <div className="text-center py-16 text-red-600 bg-red-50 rounded-2xl">{error}</div>
          ) : featuredProperties.length === 0 ? (
            <div style={{ textAlign:'center', padding:'60px 20px' }}>
              <p style={{ fontSize:15, color:'#9c9080' }}>No featured properties yet — check back soon.</p>
              <button onClick={() => navigate('/properties')}
                style={{ marginTop:16, padding:'10px 24px', borderRadius:12, background:'#1c1a17', color:'#fff', border:'none', fontSize:13, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
                Browse All Properties
              </button>
            </div>
          ) : (
            <div className="relative">
              <div className="overflow-hidden">
                <motion.div className="flex"
                  animate={{ x:`-${currentIndex * (100/3)}%` }}
                  transition={{ duration:0.55, ease:'easeOut' }}
                  style={{ width:`${(featuredProperties.length/3)*100}%` }}>
                  {featuredProperties.map((property) => (
                    <div key={property.id} className="flex-none px-3" style={{ width:`${100/featuredProperties.length}%` }}>
                      <PropertyCard property={property} onFavoriteToggle={() => {}} />
                    </div>
                  ))}
                </motion.div>
              </div>
              {[
                { dir:'prev', icon:ChevronLeft,  pos:'left-0',  fn:handlePrev, disabled:currentIndex===0 },
                { dir:'next', icon:ChevronRight, pos:'right-0', fn:handleNext, disabled:currentIndex>=carouselPages-1 },
              ].map(({ dir, icon:Icon, pos, fn, disabled }) => (
                <button key={dir} onClick={fn} disabled={disabled}
                  className={`absolute ${pos} top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white border border-neutral-200 flex items-center justify-center shadow-soft transition-all disabled:opacity-30 z-10`}
                  style={{ margin:dir==='prev'?'0 0 0 -20px':'0 -20px 0 0' }}>
                  <Icon size={18} className="text-secondary"/>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="py-24 bg-neutral-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color:'#d4a96a' }}>Simple process</p>
            <h2 className="font-heading font-bold text-secondary" style={{ fontSize:'clamp(1.8rem,4vw,2.8rem)' }}>
              {t('how_lehae_works')}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step:'01', title:t('search'),   desc:t('browse_verified_listings_with_photos_details') },
              { step:'02', title:t('connect'),  desc:t('message_landlords_directly_no_agents') },
              { step:'03', title:t('move_in'),  desc:t('secure_your_home_with_transparent_terms') },
            ].map((item, i) => (
              <motion.div key={item.step} className="bg-white rounded-2xl p-8 border border-neutral-200"
                initial={{ opacity:0, y:30 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ duration:0.6, delay:i*0.15 }}>
                <div className="step-num">{item.step}</div>
                <h3 className="font-heading font-bold text-secondary text-xl mb-3">{item.title}</h3>
                <p className="text-neutral-500 text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color:'#d4a96a' }}>Real people, real stories</p>
            <h2 className="font-heading font-bold text-secondary" style={{ fontSize:'clamp(1.8rem,4vw,2.8rem)' }}>
              What our users say
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <motion.div key={t.name} className="testimonial-card"
                initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ delay:i*0.12 }}>
                {/* Stars */}
                <div style={{ display:'flex', gap:3, marginBottom:16 }}>
                  {Array.from({ length: t.rating }).map((_, s) => (
                    <Star key={s} size={14} style={{ fill:'#d4a96a', color:'#d4a96a' }}/>
                  ))}
                </div>
                <p style={{ fontSize:14, color:'#5a5248', lineHeight:1.8, marginBottom:20, fontStyle:'italic' }}>
                  "{t.text}"
                </p>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ width:36, height:36, borderRadius:'50%', background:'linear-gradient(135deg,#d4a96a,#c4a882)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:700, color:'#fff', fontFamily:"'Playfair Display',serif", flexShrink:0 }}>
                    {t.name[0]}
                  </div>
                  <div>
                    <p style={{ fontSize:13, fontWeight:600, color:'#1c1a17' }}>{t.name}</p>
                    <p style={{ fontSize:11, color:'#9c9080' }}>{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why Lehae ── */}
      <section className="py-24 bg-neutral-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color:'#d4a96a' }}>Why choose us</p>
            <h2 className="font-heading font-bold text-secondary" style={{ fontSize:'clamp(1.8rem,4vw,2.8rem)' }}>
              Built for Lesotho
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map(({ icon:Icon, title, desc }, i) => (
              <motion.div key={title} className="flex flex-col items-start p-8 rounded-2xl border border-neutral-200 bg-white"
                initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ delay:i*0.1 }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                  style={{ background:'#faf7f3', border:'1px solid #ede8e0' }}>
                  <Icon size={20} style={{ color:'#d4a96a' }}/>
                </div>
                <h3 className="font-heading font-bold text-secondary text-lg mb-2">{title}</h3>
                <p className="text-neutral-500 text-sm leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trust badges ── */}
      <section style={{ background:'#faf7f3', borderTop:'1px solid #ede8e0', borderBottom:'1px solid #ede8e0', padding:'32px 0' }}>
        <div className="max-w-5xl mx-auto px-6">
          <p style={{ textAlign:'center', fontSize:11, fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', color:'#b5a898', marginBottom:20, fontFamily:"'DM Sans',sans-serif" }}>
            You're in safe hands
          </p>
          <div style={{ display:'flex', flexWrap:'wrap', justifyContent:'center', gap:12 }}>
            {[
              '✓ Free to browse',
              '✓ No hidden fees',
              '✓ Verified landlords',
              '✓ Direct contact',
              '✓ Lesotho-focused',
              '✓ Mobile friendly',
            ].map(badge => (
              <div key={badge} className="trust-badge" style={{ fontFamily:"'DM Sans',sans-serif" }}>
                {badge}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <motion.section className="py-24 relative overflow-hidden" style={{ background:'#1c1a17' }}
        initial={{ opacity:0 }} whileInView={{ opacity:1 }} viewport={{ once:true }}>
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage:'radial-gradient(circle at 30% 50%,#d4a96a 0%,transparent 60%),radial-gradient(circle at 70% 50%,#c4a882 0%,transparent 60%)' }}/>
        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
          <p className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color:'#d4a96a' }}>Get started today</p>
          <h2 className="font-heading font-bold text-white mb-6" style={{ fontSize:'clamp(2rem,5vw,3.5rem)' }}>
            {t('ready_to_find_your_home')}
          </h2>
          <p className="text-base mb-12" style={{ color:'rgba(255,255,255,0.55)', lineHeight:1.8 }}>
            {t('join_landlords_and_tenants_in_lesotho_today')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={() => navigate('/register')}
              className="px-10 py-4 rounded-xl font-medium text-secondary text-base transition-all"
              style={{ background:'#d4a96a' }}
              onMouseEnter={e=>e.currentTarget.style.background='#c4a882'}
              onMouseLeave={e=>e.currentTarget.style.background='#d4a96a'}>
              {t('get_started')}
            </button>
            <button onClick={() => navigate('/properties')}
              className="px-10 py-4 rounded-xl font-medium text-white text-base transition-all"
              style={{ border:'1px solid rgba(255,255,255,0.2)' }}
              onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.06)'}
              onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
              {t('browse_properties')}
            </button>
          </div>
        </div>
      </motion.section>
    </div>
  );
};

export default Home;