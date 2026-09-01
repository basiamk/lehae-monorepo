import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { MapPin, X } from 'lucide-react';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Same district centres PropertyMap.jsx uses, kept in sync manually since
// both are small standalone files — if Lesotho districts ever change this
// needs updating in both places.
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

const pinIcon = L.divIcon({
  className: '',
  html: `<div style="
    width:30px;height:30px;border-radius:50% 50% 50% 0;
    background:#d4a96a; border:3px solid #fff;
    transform:rotate(-45deg);
    box-shadow:0 3px 10px rgba(0,0,0,0.35);
  "></div>`,
  iconSize:   [30, 30],
  iconAnchor: [15, 30],
});

/**
 * LocationPicker — interactive map for landlords to pin their exact
 * property location. Optional: if the landlord never interacts with it,
 * latitude/longitude stay null and the property falls back to showing
 * its district's centre on the map, exactly as it does today.
 *
 * Props:
 *   district     — current district string, used to centre the map
 *                   before a pin is placed
 *   latitude, longitude — controlled value (numbers or empty string)
 *   onChange({ latitude, longitude }) — called on pin placement/drag
 */
const LocationPicker = ({ district, latitude, longitude, onChange }) => {
  const containerRef = useRef(null);
  const mapRef        = useRef(null);
  const markerRef      = useRef(null);
  const [hasPin, setHasPin] = useState(!!(latitude && longitude));

  useEffect(() => {
    const el = containerRef.current;
    if (!el || mapRef.current) return; // init once

    const startCoords = (latitude && longitude)
      ? [parseFloat(latitude), parseFloat(longitude)]
      : (DISTRICT_COORDS[district] || DISTRICT_COORDS['Maseru']);

    const map = L.map(el, {
      zoomControl: true,
      scrollWheelZoom: false, // avoid hijacking page scroll while filling a form
    }).setView(startCoords, latitude && longitude ? 15 : 11);
    mapRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 19,
    }).addTo(map);

    if (latitude && longitude) {
      const marker = L.marker(startCoords, { icon: pinIcon, draggable: true }).addTo(map);
      marker.on('dragend', () => {
        const { lat, lng } = marker.getLatLng();
        onChange({ latitude: lat.toFixed(6), longitude: lng.toFixed(6) });
      });
      markerRef.current = marker;
    }

    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        const marker = L.marker([lat, lng], { icon: pinIcon, draggable: true }).addTo(map);
        marker.on('dragend', () => {
          const { lat: dLat, lng: dLng } = marker.getLatLng();
          onChange({ latitude: dLat.toFixed(6), longitude: dLng.toFixed(6) });
        });
        markerRef.current = marker;
      }
      setHasPin(true);
      onChange({ latitude: lat.toFixed(6), longitude: lng.toFixed(6) });
    });

    requestAnimationFrame(() => setTimeout(() => map.invalidateSize(), 100));

    return () => {
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; markerRef.current = null; }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // init once — re-centring on district change handled separately below

  // If the district changes AFTER the map is already open and no pin has
  // been placed yet, re-centre the view so it stays relevant.
  useEffect(() => {
    if (!mapRef.current || hasPin) return;
    const coords = DISTRICT_COORDS[district];
    if (coords) mapRef.current.setView(coords, 11);
  }, [district, hasPin]);

  const clearPin = () => {
    if (markerRef.current && mapRef.current) {
      mapRef.current.removeLayer(markerRef.current);
      markerRef.current = null;
    }
    setHasPin(false);
    onChange({ latitude: '', longitude: '' });
  };

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <MapPin size={13} style={{ color:'#d4a96a' }}/>
          <span style={{ fontSize:12.5, color: hasPin ? '#22c55e' : '#9c9080', fontFamily:"'DM Sans',sans-serif" }}>
            {hasPin ? 'Pin placed — drag to adjust' : 'Click the map to drop a pin'}
          </span>
        </div>
        {hasPin && (
          <button type="button" onClick={clearPin}
            style={{ display:'flex', alignItems:'center', gap:4, fontSize:11.5, color:'#9c9080', background:'none', border:'none', cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
            <X size={11}/> Clear pin
          </button>
        )}
      </div>
      <div style={{
        width: '100%', height: 220, borderRadius: 14, overflow: 'hidden',
        border: '1px solid #ede8e0', position: 'relative',
      }}>
        <div ref={containerRef} style={{ position:'absolute', inset:0 }} />
      </div>
    </div>
  );
};

export default LocationPicker;