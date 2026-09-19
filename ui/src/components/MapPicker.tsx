import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './MapPicker.scss';

interface MapPickerProps {
  onLocationSelect: (lat: number, lng: number, name: string) => void;
  initialLat?: number;
  initialLng?: number;
  initialName?: string;
}

// Fix marker icon paths for Leaflet. Static -- no props/state dependency --
// so it lives at module scope and is usable outside the map-init effect too.
const defaultIcon = L.icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  shadowSize: [41, 41],
  iconAnchor: [12, 41],
  shadowAnchor: [13, 41],
});

const MapPicker = ({ onLocationSelect, initialLat, initialLng, initialName }: MapPickerProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const marker = useRef<L.Marker | null>(null);
  const [locationName, setLocationName] = useState(initialName || '');
  const locationNameRef = useRef(locationName);
  locationNameRef.current = locationName;
  const [coordinates, setCoordinates] = useState<[number, number] | null>(
    initialLat && initialLng ? [initialLat, initialLng] : null
  );
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState<string | null>(null);

  // Removes the old marker, adds a new one, and reports the change upward.
  // Shared by the manual map-click handler and the "use my location" button
  // so both ways of picking a spot go through the same logic.
  const placeMarker = (lat: number, lng: number) => {
    if (!map.current) return;
    setCoordinates([lat, lng]);
    onLocationSelect(lat, lng, locationNameRef.current);

    if (marker.current) {
      map.current.removeLayer(marker.current);
    }
    marker.current = L.marker([lat, lng], { icon: defaultIcon }).addTo(map.current);
  };

  useEffect(() => {
    if (!mapContainer.current || map.current) return; // Don't reinitialize

    // Raleigh, NC coordinates
    const raleighLat = 35.7796;
    const raleighLng = -78.6382;

    map.current = L.map(mapContainer.current).setView([raleighLat, raleighLng], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map.current);

    // Add initial marker if provided
    if (initialLat && initialLng) {
      marker.current = L.marker([initialLat, initialLng], { icon: defaultIcon }).addTo(
        map.current
      );
    }

    // Handle map clicks
    const handleMapClick = (e: L.LeafletMouseEvent) => {
      placeMarker(e.latlng.lat, e.latlng.lng);
    };

    map.current.on('click', handleMapClick);

    return () => {
      if (map.current) {
        map.current.off('click', handleMapClick);
      }
    };
  }, []); // Empty deps - only initialize once

  const handleLocationNameChange = (name: string) => {
    setLocationName(name);
    if (coordinates) {
      onLocationSelect(coordinates[0], coordinates[1], name);
    }
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      setLocateError("Your browser doesn't support location.");
      return;
    }
    setLocating(true);
    setLocateError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        placeMarker(latitude, longitude);
        map.current?.setView([latitude, longitude], 17);
        setLocating(false);
      },
      (err) => {
        setLocateError(
          err.code === err.PERMISSION_DENIED
            ? 'Location permission denied.'
            : 'Could not get your location.'
        );
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="map-picker">
      <div className="map-picker__container" ref={mapContainer}>
        <button
          type="button"
          className="map-picker__locate-button"
          onClick={handleLocateMe}
          disabled={locating}
          title="Use my location"
          aria-label="Use my location"
        >
          {locating ? (
            <span className="map-picker__locate-spinner" />
          ) : (
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M12 8a4 4 0 100 8 4 4 0 000-8zm0 6a2 2 0 110-4 2 2 0 010 4z" />
              <path d="M21 11h-2.06A7.002 7.002 0 0013 4.06V2h-2v2.06A7.002 7.002 0 004.06 11H2v2h2.06A7.002 7.002 0 0011 19.94V22h2v-2.06A7.002 7.002 0 0019.94 13H22v-2zM12 18a6 6 0 110-12 6 6 0 010 12z" />
            </svg>
          )}
        </button>
      </div>
      <div className="map-picker__controls">
        <div className="map-picker__instruction">Click on map to select location</div>
        {locateError && <div className="map-picker__locate-error">{locateError}</div>}
        <input
          type="text"
          placeholder="Location name (optional)"
          value={locationName}
          onChange={(e) => handleLocationNameChange(e.target.value)}
          className="map-picker__input"
        />
        {coordinates && (
          <div className="map-picker__coordinates">
            ✓ Location selected: {coordinates[0].toFixed(6)}, {coordinates[1].toFixed(6)}
          </div>
        )}
      </div>
    </div>
  );
};

export default MapPicker;
