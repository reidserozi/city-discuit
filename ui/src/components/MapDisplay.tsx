import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './MapDisplay.scss';

interface MapDisplayProps {
  latitude: number;
  longitude: number;
  locationName?: string | null;
}

const MapDisplay = ({ latitude, longitude, locationName }: MapDisplayProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    map.current = L.map(mapContainer.current).setView([latitude, longitude], 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map.current);

    const defaultIcon = L.icon({
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      iconSize: [25, 41],
      shadowSize: [41, 41],
      iconAnchor: [12, 41],
      shadowAnchor: [13, 41],
    });

    const marker = L.marker([latitude, longitude], { icon: defaultIcon }).addTo(map.current);

    if (locationName) {
      marker.bindPopup(locationName, {
        className: 'leaflet-popup-large',
      });
    }

    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, [latitude, longitude, locationName]);

  return (
    <div className="map-display card">
      <div className="map-display__title">📍 Location</div>
      {locationName && <div className="map-display__name">{locationName}</div>}
      <div className="map-display__container" ref={mapContainer} />
      <div className="map-display__coords">
        {latitude.toFixed(6)}, {longitude.toFixed(6)}
      </div>
    </div>
  );
};

export default MapDisplay;
