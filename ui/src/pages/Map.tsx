import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { mfetchjson } from '../helper';
import type { Post } from '../serverTypes';

const Map = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const markers = useRef<L.MarkerClusterGroup | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await mfetchjson('/api/posts?feed=all&hasLocation=true&sort=latest&limit=50');
        if (response && response.posts) {
          setPosts(response.posts);
        }
      } catch (err) {
        console.error('Failed to load posts:', err);
      }
    };
    fetchPosts();
  }, []);

  useEffect(() => {
    if (!mapContainer.current) return;
    if (map.current) return;

    map.current = L.map(mapContainer.current).setView([35.7796, -78.6382], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map.current);

    markers.current = L.markerClusterGroup();
    map.current.addLayer(markers.current);

    requestAnimationFrame(() => {
      map.current?.invalidateSize();
    });
  }, []);

  useEffect(() => {
    if (!map.current || !markers.current) return;
    markers.current.clearLayers();

    posts.forEach((post) => {
      if (post.latitude !== null && post.longitude !== null && post.latitude !== undefined && post.longitude !== undefined) {
        const icon = L.icon({
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
          iconSize: [25, 41],
          shadowSize: [41, 41],
          iconAnchor: [12, 41],
          shadowAnchor: [13, 41],
        });
        const marker = L.marker([post.latitude, post.longitude], { icon });
        const communityName = post.communityName || 'Unknown';
        const authorName = post.username || 'Unknown';
        const commentCount = post.noComments || 0;
        const postLink = `/${communityName}/post/${post.publicId}`;
        const popupContent = `
          <div style="max-width: 250px;">
            <h4 style="margin: 0 0 8px 0; font-size: 14px;">
              <a href="${postLink}" style="color: #0066cc; text-decoration: none;">
                ${escapeHtml(post.title)}
              </a>
            </h4>
            <p style="margin: 4px 0; font-size: 12px; color: #666;">
              ${communityName} • by @${authorName} • ${commentCount} comment${commentCount !== 1 ? 's' : ''}
            </p>
            ${post.locationName ? `<p style="margin: 4px 0; font-size: 11px; color: #999;">${escapeHtml(post.locationName)}</p>` : ''}
          </div>
        `;
        marker.bindPopup(popupContent);
        markers.current!.addLayer(marker);
      }
    });
  }, [posts]);

  return (
    <div style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div ref={mapContainer} style={{ flex: 1, width: '100%', position: 'relative' }} />
      <div style={{ padding: '12px 16px', background: 'var(--color-page-bg)', borderTop: '1px solid var(--color-border)', fontSize: '13px', color: 'var(--color-text-secondary)', textAlign: 'center' }}>
        Showing {posts.length} proposals with locations
      </div>
    </div>
  );
};

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

export default Map;
