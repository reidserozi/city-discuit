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

const MapPicker = ({ onLocationSelect, initialLat, initialLng, initialName }: MapPickerProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const marker = useRef<L.Marker | null>(null);
  const [locationName, setLocationName] = useState(initialName || '');
  const [coordinates, setCoordinates] = useState<[number, number] | null>(
    initialLat && initialLng ? [initialLat, initialLng] : null
  );

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

    // Fix marker icon paths for Leaflet
    const defaultIcon = L.icon({
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      iconSize: [25, 41],
      shadowSize: [41, 41],
      iconAnchor: [12, 41],
      shadowAnchor: [13, 41],
    });

    // Add initial marker if provided
    if (initialLat && initialLng) {
      marker.current = L.marker([initialLat, initialLng], { icon: defaultIcon }).addTo(
        map.current
      );
    }

    // Handle map clicks
    const handleMapClick = (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      const newCoordinates: [number, number] = [lat, lng];
      setCoordinates(newCoordinates);

      // Immediately update parent component with new location
      onLocationSelect(newCoordinates[0], newCoordinates[1], locationName);

      // Remove old marker
      if (marker.current) {
        map.current?.removeLayer(marker.current);
      }

      // Add new marker
      marker.current = L.marker([lat, lng], { icon: defaultIcon }).addTo(map.current!);
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

  return (
    <div className="map-picker">
      <div className="map-picker__container" ref={mapContainer} />
      <div className="map-picker__controls">
        <div className="map-picker__instruction">Click on map to select location</div>
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
