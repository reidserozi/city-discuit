import { useEffect, useState } from 'react';
import { SiteClosedReason, isDigestWindow } from '../siteHours';
import { mfetchjson } from '../helper';
import LinkImage from '../components/PostCard/LinkImage';
import MapThumbnail from '../components/MapThumbnail';
import type { Post } from '../serverTypes';

const copy: Record<SiteClosedReason, { emoji: string; heading: string; body: string }> = {
  night: {
    emoji: '🌙',
    heading: 'Goodnight, Raleigh.',
    body: 'Sleep well. Get some rest - we will be back at 8:00 AM.',
  },
  sunday: {
    emoji: '☀️',
    heading: 'Go be Raleigh.',
    body: 'Get outside. Walk a greenway, sit in a park, be with the people you love — and if one of today\'s topics is nearby, go see it for yourself. We\'ll be back tomorrow at 8:00 AM.',
  },
};

function extractExcerpt(text: string, maxLength: number = 120): string {
  if (!text) return '';
  // Strip basic markdown: **bold**, *italic*, [link](url), etc.
  let excerpt = text
    .replace(/\*\*(.+?)\*\*/g, '$1') // **bold**
    .replace(/\*(.+?)\*/g, '$1')     // *italic*
    .replace(/\[(.+?)\]\(.+?\)/g, '$1') // [text](url)
    .replace(/^#+\s+/gm, '');        // # Headings

  // Truncate and add ellipsis if needed
  if (excerpt.length > maxLength) {
    excerpt = excerpt.substring(0, maxLength).trim() + '…';
  }
  return excerpt;
}

function getLinkBadge(post: Post): { icon: string; label: string } | null {
  if (post.type !== 'link' || !post.link?.hostname) return null;

  const hostname = post.link.hostname.toLowerCase();
  const videoHosts = ['youtube.com', 'www.youtube.com', 'youtu.be', 'm.youtube.com', 'vimeo.com', 'www.vimeo.com'];

  if (videoHosts.includes(hostname)) {
    return { icon: '▶', label: 'Video' };
  }

  return { icon: '🔗', label: hostname };
}

const SiteClosed = ({ reason }: { reason: SiteClosedReason }) => {
  const { emoji, heading, body } = copy[reason];
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const showDigest = isDigestWindow();

  useEffect(() => {
    const fetchDigest = async () => {
      if (!showDigest) {
        setLoading(false);
        return;
      }

      try {
        const response = await mfetchjson('/api/posts/digest?limit=5');
        if (response && response.posts) {
          setPosts(response.posts);
        }
      } catch (err) {
        console.error('Failed to load digest:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDigest();
  }, [showDigest]);

  return (
    <div className="page-site-closed">
      <div className="page-site-closed-emoji">{emoji}</div>
      <h1>{heading}</h1>
      <p>{body}</p>
      <div className="page-site-closed-hours">Open Monday-Saturday, 8:00 AM - 10:00 PM</div>

      {showDigest && !loading && posts.length > 0 && (
        <div className="page-site-closed-digest">
          <div className="digest-header">Posts to explore</div>
          <div className="digest-list">
            {posts.map((post) => {
              const image = post.image || post.images?.[0] || post.link?.image;
              const linkBadge = getLinkBadge(post);
              const hasLocation = post.latitude !== null && post.longitude !== null && post.latitude !== undefined && post.longitude !== undefined;

              return (
                <div key={post.id} className="digest-item">
                  {image && (
                    <div className="digest-item-image-wrapper">
                      <LinkImage image={image} loading="lazy" isImagePost={post.type === 'image'} />
                      {linkBadge && <div className="digest-item-badge">{linkBadge.icon} {linkBadge.label}</div>}
                    </div>
                  )}

                  <div className="digest-item-content">
                    <div className="digest-item-title">{post.title}</div>
                    <div className="digest-item-meta">
                      <span className="community-badge">{post.communityName || 'Community'}</span>
                    </div>
                    {post.body && <div className="digest-item-excerpt">{extractExcerpt(post.body, 100)}</div>}
                  </div>

                  {hasLocation && post.latitude !== null && post.longitude !== null && post.latitude !== undefined && post.longitude !== undefined && (
                    <div className="digest-item-map">
                      <MapThumbnail latitude={post.latitude as number} longitude={post.longitude as number} locationName={post.locationName} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default SiteClosed;
