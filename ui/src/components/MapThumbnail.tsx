import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './MapThumbnail.scss';

interface MapThumbnailProps {
  latitude: number;
  longitude: number;
  locationName?: string | null;
}

const MapThumbnail = ({ latitude, longitude, locationName }: MapThumbnailProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;
    if (map.current) return;

    map.current = L.map(mapContainer.current, {
      dragging: false,
      scrollWheelZoom: false,
      zoomControl: false,
      doubleClickZoom: false,
      boxZoom: false,
      touchZoom: false,
    }).setView([latitude, longitude], 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map.current);

    const icon = L.icon({
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      iconSize: [25, 41],
      shadowSize: [41, 41],
      iconAnchor: [12, 41],
      shadowAnchor: [13, 41],
    });

    L.marker([latitude, longitude], { icon }).addTo(map.current);

    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, [latitude, longitude]);

  return (
    <div className="map-thumbnail">
      <div className="map-thumbnail-container" ref={mapContainer} />
      {locationName && <div className="map-thumbnail-label">{locationName}</div>}
    </div>
  );
};

export default MapThumbnail;
