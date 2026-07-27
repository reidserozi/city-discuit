import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
// @ts-ignore - leaflet.markercluster types are incomplete
import MarkerClusterGroup from 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { mfetchjson } from '../helper';
import type { Post } from '../serverTypes';

const MapView = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<any>(null);

  const raleighLat = 35.7796;
  const raleighLng = -78.6382;

  // Fetch posts with locations
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const response = await mfetchjson('/api/posts?feed=all&hasLocation=true&sort=latest&limit=100');
        if (response && response.posts) {
          setPosts(response.posts);
          setError(null);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load posts');
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current) return;

    if (!mapRef.current) {
      mapRef.current = L.map(containerRef.current).setView([raleighLat, raleighLng], 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(mapRef.current);

      // Add marker cluster group
      markersRef.current = (MarkerClusterGroup as any)();
      mapRef.current.addLayer(markersRef.current);
    }
  }, []);

  // Add/update markers when posts load
  useEffect(() => {
    if (!mapRef.current || !markersRef.current) return;

    // Clear existing markers
    markersRef.current.clearLayers();

    // Add markers for each post with location
    posts.forEach((post) => {
      if (post.latitude !== null && post.longitude !== null && post.latitude !== undefined && post.longitude !== undefined) {
        const marker = L.marker([post.latitude, post.longitude]);

        // Create popup content
        const communityName = post.community?.name || 'Unknown Community';
        const authorName = post.author?.username || 'Unknown';
        const commentCount = post.noComments || 0;
        const popupContent = `
          <div style="max-width: 250px;">
            <h4 style="margin: 0 0 8px 0; font-size: 14px;">
              <a href="/${post.community?.name}/post/${post.id}" style="color: #0066cc; text-decoration: none;">
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
        markersRef.current!.addLayer(marker);
      }
    });
  }, [posts]);

  if (loading) {
    return <div className="page-map-view"><div className="loading">Loading posts with locations...</div></div>;
  }

  return (
    <div className="page-map-view">
      {error && <div className="error-message">{error}</div>}
      <div className="map-container" ref={containerRef}></div>
      <div className="map-info">
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

export default MapView;
