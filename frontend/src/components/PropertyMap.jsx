import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const DISTRICT_COORDS = {
  'Maseru':        [-29.3167, 27.4833],
  'Leribe':        [-28.8833, 28.0500],
  'Berea':         [-29.1000, 27.7500],
  'Mafeteng':      [-29.8167, 27.2333],
  "Mohale's Hoek": [-30.1500, 27.4667],
  'Quthing':       [-30.4000, 27.7000],
  "Qacha's Nek":   [-30.1167, 28.6833],
  'Mokhotlong':    [-29.2833, 29.0667],
  'Thaba-Tseka':   [-29.5167, 28.6000],
  'Butha-Buthe':   [-28.7667, 28.2500],
};

function getCoords(p) {
  if (p?.latitude && p?.longitude) return [parseFloat(p.latitude), parseFloat(p.longitude)];
  return DISTRICT_COORDS[p?.district] || [-29.3167, 27.4833];
}

const makeIcon = (highlighted = false) => L.divIcon({
  className: '',
  html: `<div style="
    width:28px;height:28px;border-radius:50% 50% 50% 0;
    background:${highlighted ? '#d4a96a' : '#1c1a17'};
    border:3px solid ${highlighted ? '#fff' : '#d4a96a'};
    transform:rotate(-45deg);
    box-shadow:0 3px 10px rgba(0,0,0,0.35);
  "></div>`,
  iconSize:    [28, 28],
  iconAnchor:  [14, 28],
  popupAnchor: [0, -30],
});

/**
 * PropertyMap — accepts EITHER:
 *   single property:   <PropertyMap property={p} />
 *   multiple:          <PropertyMap properties={[...]} />
 *
 * Also accepts legacy props from PropertyDetail:
 *   <PropertyMap single singleProperty={p} />  ← treated same as property={p}
 */
const PropertyMap = ({
  property        = null,   // single property object
  singleProperty  = null,   // legacy alias — same as property
  properties      = [],     // array of properties
  single          = false,  // ignored — kept for backwards compat
  onPropertyClick = null,
  height          = '380px',
  zoom            = 14,
}) => {
  const containerRef = useRef(null);
  const mapRef       = useRef(null);

  // Normalise — support both prop names
  const resolvedSingle = property || singleProperty;
  const items = properties.length > 0 ? properties : (resolvedSingle ? [resolvedSingle] : []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || items.length === 0) return;

    // Tear down previous instance
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const map = L.map(el, {
      zoomControl:     true,
      scrollWheelZoom: true,
      dragging:        true,
      touchZoom:       true,
    });
    mapRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    const coords = [];
    items.forEach(p => {
      const latlng = getCoords(p);
      coords.push(latlng);

      const marker = L.marker(latlng, { icon: makeIcon() }).addTo(map);
      marker.on('mouseover', () => marker.setIcon(makeIcon(true)));
      marker.on('mouseout',  () => marker.setIcon(makeIcon(false)));

      const hasImg = p.images?.[0]?.image_url;
      marker.bindPopup(
        L.popup({ maxWidth: 220, className: 'lehae-popup' }).setContent(`
          <div style="font-family:'DM Sans',sans-serif;">
            ${hasImg ? `<img src="${hasImg}" style="width:100%;height:110px;object-fit:cover;border-radius:8px;margin-bottom:10px;display:block;"/>` : ''}
            <p style="font-weight:600;font-size:14px;color:#1c1a17;margin:0 0 4px;">${p.area}, ${p.district}</p>
            <p style="font-size:13px;color:#d4a96a;font-weight:700;margin:0 0 8px;">M ${Number(p.rental_amount).toLocaleString()} / mo</p>
            ${p.bedrooms ? `<p style="font-size:11px;color:#7a7060;margin:0 0 8px;">${p.bedrooms} bed · ${p.property_type || ''}</p>` : ''}
            <a href="/properties/${p.id}"
              style="display:inline-block;padding:6px 14px;background:#1c1a17;color:#fff;border-radius:8px;font-size:12px;font-weight:500;text-decoration:none;">
              View listing →
            </a>
          </div>`)
      );

      if (onPropertyClick) marker.on('click', () => onPropertyClick(p.id));
    });

    if (coords.length === 1) {
      map.setView(coords[0], zoom);
    } else {
      map.fitBounds(L.latLngBounds(coords), { padding: [40, 40], maxZoom: 14 });
    }

    // invalidateSize AFTER paint — fixes blank/grey tile bug
    requestAnimationFrame(() => setTimeout(() => map.invalidateSize(), 150));

    return () => {
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    };
  }, [resolvedSingle?.id, properties.length, zoom]);

  return (
    <>
      <style>{`
        .lehae-popup .leaflet-popup-content-wrapper {
          border-radius: 14px !important;
          box-shadow: 0 8px 32px rgba(0,0,0,0.15) !important;
          border: 1px solid #ede8e0 !important;
          overflow: hidden;
          padding: 0 !important;
        }
        .lehae-popup .leaflet-popup-content { margin: 14px !important; }
        .lehae-popup .leaflet-popup-tip-container { display: none !important; }
        .leaflet-control-attribution { font-size: 10px !important; }
      `}</style>

      {/*
        NO overflow:hidden on this wrapper — that breaks Leaflet's tile grid.
        Border-radius is applied via clip-path instead so it doesn't affect tile loading.
      */}
      <div style={{
        width:     '100%',
        height:    height,
        border:    '1px solid #ede8e0',
        borderRadius: 16,
        clipPath:  'inset(0 round 16px)',  // rounds corners WITHOUT overflow:hidden
        position:  'relative',
      }}>
        <div
          ref={containerRef}
          style={{ position: 'absolute', inset: 0, zIndex: 0 }}
        />
      </div>
    </>
  );
};

export default PropertyMap;