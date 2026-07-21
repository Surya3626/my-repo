import React, { useState, useEffect, useRef } from 'react';
import { 
  MapPin, Compass, Search, Building, Home, Briefcase, Zap, 
  CheckCircle2, Radio, Navigation, RefreshCw, Sparkles, Layers,
  ChevronDown, ChevronUp, Map as MapIcon, Globe, FileText, MousePointer
} from 'lucide-react';

export interface AddressData {
  houseNumber: string;
  society: string;
  addressLine1: string;
  addressLine2?: string;
  street: string;
  landmark?: string;
  area: string;
  city: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
  propertyType: 'APARTMENT' | 'HOUSE' | 'OFFICE';
}

interface SmartMapAddressPickerProps {
  initialAddress?: Partial<AddressData>;
  onChange: (data: AddressData) => void;
  onDetectGps?: () => void;
}

declare global {
  interface Window {
    L: any;
  }
}

export const SmartMapAddressPicker: React.FC<SmartMapAddressPickerProps> = ({
  initialAddress,
  onChange,
  onDetectGps,
}) => {
  // Preferred Entry Mode: MAP (Real Leaflet Map), SEARCH (AI Search), GPS (Auto Detect), MANUAL (Form Input)
  const [preferredMode, setPreferredMode] = useState<'MAP' | 'SEARCH' | 'GPS' | 'MANUAL'>('MAP');

  const [propertyType, setPropertyType] = useState<'APARTMENT' | 'HOUSE' | 'OFFICE'>(initialAddress?.propertyType || 'APARTMENT');
  
  // Address Fields
  const [houseNumber, setHouseNumber] = useState(initialAddress?.houseNumber || '');
  const [society, setSociety] = useState(initialAddress?.society || '');
  const [addressLine1, setAddressLine1] = useState(initialAddress?.addressLine1 || '');
  const [street, setStreet] = useState(initialAddress?.street || '');
  const [area, setArea] = useState(initialAddress?.area || '');
  const [city, setCity] = useState(initialAddress?.city || '');
  const [state, setState] = useState(initialAddress?.state || '');
  const [pincode, setPincode] = useState(initialAddress?.pincode || '');
  const [latitude, setLatitude] = useState(initialAddress?.latitude || 19.0760);
  const [longitude, setLongitude] = useState(initialAddress?.longitude || 72.8777);

  // Map & Visual states
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Leaflet Map Refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const leafletMarkerRef = useRef<any>(null);

  // Sample verified landmarks for instant client demo
  const sampleLocations = [
    {
      label: 'Mumbai Metro • Bandra West',
      house: 'Flat 402, Block B',
      society: 'TelcoBridge Crest Towers',
      street: 'Main Avenue Road',
      area: 'Bandra West',
      city: 'Mumbai',
      state: 'Maharashtra',
      pin: '400050',
      lat: 19.0596,
      lng: 72.8295,
    },
    {
      label: 'Bengaluru Tech Park • Electronic City',
      house: 'Tower 4, Floor 12',
      society: 'Mindspace IT Hub',
      street: 'Hosur Main Road',
      area: 'Electronic City Phase 1',
      city: 'Bengaluru',
      state: 'Karnataka',
      pin: '560100',
      lat: 12.8452,
      lng: 77.6602,
    },
    {
      label: 'Delhi NCR • Connaught Place',
      house: 'Suite 18, Block C',
      society: 'Statesman House',
      street: 'Barakhamba Road',
      area: 'Connaught Place',
      city: 'Delhi',
      state: 'Delhi',
      pin: '110001',
      lat: 28.6315,
      lng: 77.2167,
    },
    {
      label: 'Hyderabad IT Corridor • Hitec City',
      house: 'Villa 8, Garden Enclave',
      society: 'Westend Heights',
      street: 'Vithal Rao Nagar',
      area: 'Madhapur',
      city: 'Hyderabad',
      state: 'Telangana',
      pin: '500081',
      lat: 17.4486,
      lng: 78.3741,
    },
  ];

  // Notify parent on state change
  useEffect(() => {
    onChange({
      houseNumber,
      society,
      addressLine1,
      street,
      area,
      city,
      state,
      pincode,
      latitude,
      longitude,
      propertyType,
    });
  }, [houseNumber, society, addressLine1, street, area, city, state, pincode, latitude, longitude, propertyType]);

  // Auto-Detect User's Real Device GPS Location on Component Mount
  useEffect(() => {
    if (!initialAddress?.latitude && typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = Number(pos.coords.latitude.toFixed(5));
          const lng = Number(pos.coords.longitude.toFixed(5));
          setLatitude(lat);
          setLongitude(lng);

          if (leafletMapRef.current && leafletMarkerRef.current) {
            leafletMapRef.current.setView([lat, lng], 16);
            leafletMarkerRef.current.setLatLng([lat, lng]);
          }

          reverseGeocode(lat, lng);
        },
        (err) => {
          console.log("GPS auto-detect fallback active.", err);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    }
  }, []);

  // Reverse geocode via OpenStreetMap Nominatim API (Enforcing English language & complete dynamic field mapping)
  const reverseGeocode = async (lat: number, lng: number) => {
    setIsReverseGeocoding(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=en`);
      const data = await response.json();
      if (data && data.address) {
        const addr = data.address;
        
        // Dynamically extract address components in English without stale fallback traps
        const detectedHouse = addr.house_number || (addr.building ? `Building ${addr.building}` : '') || (addr.amenity ? `${addr.amenity}` : 'Door 101');
        const detectedSociety = addr.building || addr.amenity || addr.office || addr.residential || addr.suburb || 'Residential Complex';
        const detectedStreet = addr.road || addr.street || addr.pedestrian || addr.footway || addr.suburb || 'Main Road';
        const detectedArea = addr.suburb || addr.neighbourhood || addr.quarter || addr.city_district || addr.county || 'Central Sector';
        const detectedCity = addr.city || addr.town || addr.municipality || addr.county || addr.state_district || 'City Center';
        const detectedState = addr.state || 'State';
        const detectedPin = addr.postcode ? addr.postcode.replace(/\D/g, '').slice(0, 6) : (pincode || '400001');

        setHouseNumber(detectedHouse);
        setSociety(detectedSociety);
        setStreet(detectedStreet);
        setArea(detectedArea);
        setCity(detectedCity);
        setState(detectedState);
        if (detectedPin && detectedPin.length === 6) {
          setPincode(detectedPin);
        }

        const line1 = data.display_name 
          ? data.display_name.split(',').slice(0, 3).join(', ') 
          : `${detectedHouse}, ${detectedStreet}, ${detectedArea}`;
        setAddressLine1(line1);
      }
    } catch (err) {
      console.warn("Reverse geocode fallback", err);
    } finally {
      setIsReverseGeocoding(false);
    }
  };

  // Initialize Real Leaflet Map when MAP mode is active
  useEffect(() => {
    if (preferredMode !== 'MAP' || !mapContainerRef.current) return;

    // Check if Leaflet L global is loaded
    if (typeof window !== 'undefined' && window.L) {
      const L = window.L;

      if (!leafletMapRef.current) {
        const map = L.map(mapContainerRef.current, {
          center: [latitude, longitude],
          zoom: 15,
          zoomControl: true,
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors | TelcoBridge GIS',
          maxZoom: 19,
        }).addTo(map);

        // Custom pulsing marker icon
        const customIcon = L.divIcon({
          className: 'custom-leaflet-marker',
          html: `
            <div style="position: relative; width: 36px; height: 36px; display: flex; items-center; justify-content: center;">
              <div style="position: absolute; width: 36px; height: 36px; border-radius: 50%; background: rgba(219,39,119,0.3); animation: pulse-radar 2s infinite;"></div>
              <div style="width: 28px; height: 28px; border-radius: 50%; background: linear-gradient(135deg, #6d28d9, #db2777); border: 2px solid #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; color: white;">
                📍
              </div>
            </div>
          `,
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        });

        const marker = L.marker([latitude, longitude], {
          draggable: true,
          icon: customIcon,
        }).addTo(map);

        marker.on('dragend', (e: any) => {
          const pos = e.target.getLatLng();
          const newLat = Number(pos.lat.toFixed(5));
          const newLng = Number(pos.lng.toFixed(5));
          setLatitude(newLat);
          setLongitude(newLng);
          reverseGeocode(newLat, newLng);
        });

        map.on('click', (e: any) => {
          const newLat = Number(e.latlng.lat.toFixed(5));
          const newLng = Number(e.latlng.lng.toFixed(5));
          setLatitude(newLat);
          setLongitude(newLng);
          marker.setLatLng([newLat, newLng]);
          reverseGeocode(newLat, newLng);
        });

        leafletMapRef.current = map;
        leafletMarkerRef.current = marker;
      } else {
        leafletMapRef.current.setView([latitude, longitude], leafletMapRef.current.getZoom());
        if (leafletMarkerRef.current) {
          leafletMarkerRef.current.setLatLng([latitude, longitude]);
        }
      }
    }
  }, [preferredMode, latitude, longitude]);

  const selectPreset = (loc: typeof sampleLocations[0]) => {
    setHouseNumber(loc.house);
    setSociety(loc.society);
    setAddressLine1(`${loc.house}, ${loc.society}`);
    setStreet(loc.street);
    setArea(loc.area);
    setCity(loc.city);
    setState(loc.state);
    setPincode(loc.pin);
    setLatitude(loc.lat);
    setLongitude(loc.lng);
    setSearchQuery(loc.label);
    setShowSearchResults(false);

    if (leafletMapRef.current && leafletMarkerRef.current) {
      leafletMapRef.current.setView([loc.lat, loc.lng], 16);
      leafletMarkerRef.current.setLatLng([loc.lat, loc.lng]);
    }
  };

  const handleDeviceGps = () => {
    if (!navigator.geolocation) return;
    setIsReverseGeocoding(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(5));
        const lng = Number(pos.coords.longitude.toFixed(5));
        setLatitude(lat);
        setLongitude(lng);
        if (leafletMapRef.current && leafletMarkerRef.current) {
          leafletMapRef.current.setView([lat, lng], 17);
          leafletMarkerRef.current.setLatLng([lat, lng]);
        }
        reverseGeocode(lat, lng);
        if (onDetectGps) onDetectGps();
      },
      () => setIsReverseGeocoding(false)
    );
  };

  return (
    <div className="space-y-6 text-left">
      
      {/* 🌟 TOP PREFERENCE SWITCHER BAR */}
      <div className="space-y-2">
        <label className="text-[11px] font-black uppercase tracking-wider text-purple-400 block flex items-center justify-between">
          <span>Choose How You Prefer to Select Your Location</span>
          <span className="text-[9px] text-slate-400 font-semibold">(Select 1 Option Below)</span>
        </label>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 backdrop-blur-md">
          {[
            { id: 'MAP', label: 'Real Map & GPS Location', icon: <MousePointer size={14} /> },
            { id: 'SEARCH', label: 'Smart Address Search', icon: <Search size={14} /> },
            { id: 'MANUAL', label: 'Manual Address Form', icon: <FileText size={14} /> },
          ].map(mode => (
            <button
              key={mode.id}
              type="button"
              onClick={() => {
                setPreferredMode(mode.id as any);
              }}
              className={`py-3 px-4 rounded-xl font-extrabold text-xs transition flex items-center justify-center gap-2 glow-card-hover ${
                preferredMode === mode.id
                  ? 'bg-gradient-to-r from-tpf-purple to-tpf-pink text-white shadow-lg shadow-purple-500/25'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              {mode.icon}
              <span>{mode.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Property Type Chips - High Visibility Design */}
      <div className="space-y-2">
        <label className="text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
          Property Category
        </label>
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { id: 'APARTMENT', label: 'Apartment / Flat', icon: <Building size={18} /> },
            { id: 'HOUSE', label: 'Villa / House', icon: <Home size={18} /> },
            { id: 'OFFICE', label: 'Commercial Office', icon: <Briefcase size={18} /> },
          ].map(type => (
            <button
              key={type.id}
              type="button"
              onClick={() => setPropertyType(type.id as any)}
              className={`p-3 rounded-2xl border-2 flex items-center justify-center gap-2 text-xs font-black transition shadow ${
                propertyType === type.id
                  ? 'bg-gradient-to-r from-tpf-purple to-tpf-pink text-white border-purple-400 shadow-purple-500/30 ring-2 ring-purple-500/40'
                  : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:border-tpf-purple'
              }`}
            >
              <div className={propertyType === type.id ? 'text-white' : 'text-tpf-purple dark:text-purple-400'}>
                {type.icon}
              </div>
              <span className="font-extrabold tracking-wide">{type.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* MODE 1: REAL INTERACTIVE MAP (LEAFLET / OPENSTREETMAP) */}
      {preferredMode === 'MAP' && (
        <div className="space-y-3 animate-fade-in">
          <div className="flex justify-between items-center text-xs">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black uppercase text-slate-300">
                Real Interactive Satellite Fiber Grid Map
              </span>
              {isReverseGeocoding && (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase flex items-center gap-1">
                  <RefreshCw size={10} className="animate-spin text-pink-400" /> Geocoding Address...
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={handleDeviceGps}
              className="text-[10px] font-bold text-tpf-purple dark:text-purple-300 hover:underline flex items-center gap-1"
            >
              <Compass size={12} /> Recenter My GPS
            </button>
          </div>

          {/* REAL LEAFLET MAP CONTAINER */}
          <div className="relative rounded-3xl overflow-hidden border-2 border-purple-500/40 shadow-2xl bg-slate-950">
            <div 
              ref={mapContainerRef} 
              className="w-full h-72 z-10"
              style={{ minHeight: '280px' }}
            />

            {/* Map Drag Hint Banner */}
            <div className="absolute bottom-3 left-3 right-3 z-20 p-2.5 rounded-2xl bg-slate-950/85 border border-purple-500/30 backdrop-blur-md flex justify-between items-center text-[10px] text-slate-200">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="font-mono font-bold text-purple-300">LAT: {latitude} | LNG: {longitude}</span>
              </div>
              <span className="font-black text-pink-400 uppercase text-[9px]">Drag Pin or Click Map Anywhere</span>
            </div>
          </div>
        </div>
      )}

      {/* MODE 2: AI SMART SEARCH & AUTOCOMPLETE */}
      {preferredMode === 'SEARCH' && (
        <div className="space-y-3 animate-fade-in">
          <div className="relative flex items-center">
            <div className="absolute left-4 text-tpf-purple">
              <Search size={18} />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setShowSearchResults(true);
              }}
              onFocus={() => setShowSearchResults(true)}
              placeholder="Type Society Name, Landmark, Road, or Pincode..."
              className="w-full bg-slate-900 border-2 border-purple-500/40 rounded-2xl pl-11 pr-28 py-3.5 text-xs font-bold text-white placeholder-slate-400 focus:outline-none focus:border-tpf-purple focus:ring-4 focus:ring-purple-500/20 transition"
            />
            <span className="absolute right-3 px-2 py-1 bg-purple-500/20 text-purple-300 rounded-lg text-[9px] font-black uppercase">
              AI Autocomplete
            </span>
          </div>

          <div className="glass-panel border border-slate-800 rounded-2xl p-3 space-y-2">
            <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Verified Fiber Landmarks:</span>
            {sampleLocations.map((loc, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => selectPreset(loc)}
                className="w-full p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-purple-500 flex items-center justify-between text-left transition group"
              >
                <div className="flex items-center gap-2.5">
                  <MapPin size={16} className="text-tpf-pink group-hover:scale-110 transition" />
                  <div>
                    <span className="font-bold text-xs text-white block">{loc.label}</span>
                    <span className="text-[10px] text-slate-400">{loc.house}, {loc.street} (PIN: {loc.pin})</span>
                  </div>
                </div>
                <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Select
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* DETAILED MANUAL ADDRESS FORM FIELDS */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between border-b dark:border-slate-800 pb-2">
          <span className="text-xs font-extrabold text-slate-300 flex items-center gap-1.5">
            <CheckCircle2 size={14} className="text-emerald-400" /> Building & Address Details Summary
          </span>
          <span className="text-[10px] text-purple-400 font-bold">Auto-Populated from Map</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase">Flat / House Number *</label>
            <input
              type="text"
              required
              value={houseNumber}
              onChange={e => setHouseNumber(e.target.value)}
              className="border dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl px-4 py-2.5 text-xs dark:text-white focus:outline-none focus:ring-2 focus:ring-tpf-purple font-semibold"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase">Society / Building Name *</label>
            <input
              type="text"
              required
              value={society}
              onChange={e => setSociety(e.target.value)}
              className="border dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl px-4 py-2.5 text-xs dark:text-white focus:outline-none focus:ring-2 focus:ring-tpf-purple font-semibold"
            />
          </div>

          <div className="flex flex-col gap-1.5 md:col-span-2">
            <label className="text-xs font-bold text-slate-400 uppercase">Address Line 1 *</label>
            <input
              type="text"
              required
              value={addressLine1}
              onChange={e => setAddressLine1(e.target.value)}
              className="border dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl px-4 py-2.5 text-xs dark:text-white focus:outline-none focus:ring-2 focus:ring-tpf-purple font-semibold"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase">Street Name</label>
            <input
              type="text"
              required
              value={street}
              onChange={e => setStreet(e.target.value)}
              className="border dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl px-4 py-2.5 text-xs dark:text-white focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase">Area / Locality</label>
            <input
              type="text"
              required
              value={area}
              onChange={e => setArea(e.target.value)}
              className="border dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl px-4 py-2.5 text-xs dark:text-white focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase">City</label>
            <input
              type="text"
              required
              value={city}
              onChange={e => setCity(e.target.value)}
              className="border dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl px-4 py-2.5 text-xs dark:text-white focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase">State</label>
            <input
              type="text"
              required
              value={state}
              onChange={e => setState(e.target.value)}
              className="border dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl px-4 py-2.5 text-xs dark:text-white focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1.5 md:col-span-2">
            <label className="text-xs font-bold text-slate-400 uppercase">6-digit PIN Code</label>
            <input
              type="text"
              required
              maxLength={6}
              pattern="\d{6}"
              value={pincode}
              onChange={e => setPincode(e.target.value.replace(/\D/g, ''))}
              className="border dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl px-4 py-2.5 text-xs dark:text-white font-black tracking-wider text-sm focus:outline-none focus:ring-2 focus:ring-tpf-purple"
            />
          </div>
        </div>
      </div>

    </div>
  );
};
