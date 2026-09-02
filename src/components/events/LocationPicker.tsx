import React, { useEffect, useRef, useState } from 'react';
import '@/lib/leafletIcons';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import { Input } from '@/components/ui/Input';
import { autocompletePlaces, reverseGeocode, type GeocodeResult } from '@/lib/geocode';
import type { EventLocation } from '@/lib/firebase';

interface LocationPickerProps {
  value: EventLocation | null;
  onChange: (loc: EventLocation) => void;
}

const DEFAULT_CENTER: [number, number] = [13.0827, 80.2707]; // Chennai

const ClickHandler: React.FC<{ onPick: (lat: number, lng: number) => void }> = ({ onPick }) => {
  useMapEvents({ click: (e) => onPick(e.latlng.lat, e.latlng.lng) });
  return null;
};

const FlyTo: React.FC<{ lat: number; lng: number }> = ({ lat, lng }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], Math.max(map.getZoom(), 16), { duration: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lng]);
  return null;
};

export const LocationPicker: React.FC<LocationPickerProps> = ({ value, onChange }) => {
  const [query, setQuery] = useState(value?.address || '');
  const [suggestions, setSuggestions] = useState<GeocodeResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const center: [number, number] = value ? [value.lat, value.lng] : DEFAULT_CENTER;

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      setError('');
      try {
        const results = await autocompletePlaces(query);
        setSuggestions(results);
        setShowDropdown(true);
        if (results.length === 0) setError('No matches yet — keep typing, or click the map.');
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Search failed — try clicking the map instead.');
      } finally {
        setSearching(false);
      }
    }, 350);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const pickSuggestion = (result: GeocodeResult) => {
    onChange({ address: result.displayName, lat: result.lat, lng: result.lng });
    setQuery(result.displayName);
    setSuggestions([]);
    setShowDropdown(false);
    setError('');
  };

  const handleMapClick = async (lat: number, lng: number) => {
    onChange({ address: query || `${lat.toFixed(5)}, ${lng.toFixed(5)}`, lat, lng });
    const place = await reverseGeocode(lat, lng);
    if (place) {
      setQuery(place);
      onChange({ address: place, lat, lng });
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-[#3D4852] mb-2">Location</label>

      <div className="relative mb-3" ref={wrapperRef}>
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
          placeholder="Search e.g. 'SIMATS Engineering College'"
        />
        {searching && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[#A0AEC0]">
            Searching…
          </span>
        )}

        {showDropdown && suggestions.length > 0 && (
          <div className="absolute z-[1000] mt-2 w-full rounded-2xl bg-white shadow-xl overflow-hidden max-h-64 overflow-y-auto border border-[#E0E5EC]">
            {suggestions.map((s, i) => (
              <button
                type="button"
                key={`${s.lat}-${s.lng}-${i}`}
                onClick={() => pickSuggestion(s)}
                className="w-full text-left px-4 py-3 text-sm text-[#3D4852] hover:bg-[#F0F2F6] border-b border-[#F0F2F6] last:border-0 flex items-start gap-2"
              >
                <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-[#6C63FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{s.displayName}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {error && <p className="mb-2 text-sm text-red-500">{error}</p>}

      <div className="rounded-2xl overflow-hidden h-56 shadow-[inset_6px_6px_10px_rgb(163,177,198,0.5),inset_-6px_-6px_10px_rgba(255,255,255,0.5)]">
        <MapContainer center={center} zoom={value ? 16 : 12} style={{ height: '100%', width: '100%' }}>
        <TileLayer
            attribution='&copy; OpenStreetMap contributors &copy; CARTO'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
          {value && <Marker position={[value.lat, value.lng]} />}
          <ClickHandler onPick={handleMapClick} />
          {value && <FlyTo lat={value.lat} lng={value.lng} />}
        </MapContainer>
      </div>
      <p className="mt-2 text-xs text-[#A0AEC0]">
        Type at least 3 letters to see suggestions, or click directly on the map to drop a pin.
      </p>
    </div>
  );
};

export default LocationPicker;