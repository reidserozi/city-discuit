import { useEffect, useState } from 'react';
import { SiteClosedReason, isDigestWindow } from '../siteHours';
import { mfetchjson } from '../helper';
import CommunityLink from '../components/PostCard/CommunityLink';
import LinkImage from '../components/PostCard/LinkImage';
import PostCardImage from '../components/PostCard/PostCardImage';
import { useIsMobile } from '../hooks';
import type { Post } from '../serverTypes';

const copy: Record<SiteClosedReason, { emoji: string; heading: string; body: string }> = {
  night: {
    emoji: '🌙',
    heading: 'Goodnight, Raleigh.',
    body: 'Sleep well. Get some rest - we will be back at 8:00 AM.',
  },
  sunday: {
    emoji: '☀️',
    heading: 'Raleigh is Open.',
    body: 'We\'re closed on Sundays. Raleigh isn\'t.\nBelow are a few things people are working on, each pinned to a real spot. If you pass one today, it\'s worth a look — a post reads differently when you\'re standing in it. We\'ll be back tomorrow at 8:00 AM.',
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

const SiteClosed = ({ reason }: { reason: SiteClosedReason }) => {
  const { emoji, heading, body } = copy[reason];
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const showDigest = isDigestWindow();
  const isMobile = useIsMobile();

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
      <div className="page-site-closed-hero">
        <div className="page-site-closed-emoji">{emoji}</div>
        <h1>{heading}</h1>
        <p>{body}</p>
        <div className="page-site-closed-hours">Open Monday-Saturday, 8:00 AM - 10:00 PM</div>
      </div>

      {showDigest && !loading && posts.length > 0 && (
        <div className="page-site-closed-digest">
          <div className="digest-header">Posts to explore</div>
          <div className="digest-list">
            {posts.map((post) => {
              const showImage = post.type === 'image' && post.image;
              const linkImage = post.type === 'link' && post.link?.image;
              const hasLocation = post.latitude !== null && post.longitude !== null && post.latitude !== undefined && post.longitude !== undefined;

              return (
                <div key={post.id} className="post-card">
                  <div className="card post-card-card">
                    <div className="post-card-heading">
                      <div className="post-card-heading-details">
                        <div className="left">
                          <CommunityLink name={post.communityName} proPic={post.communityProPic} noLink />
                        </div>
                      </div>
                    </div>
                    <div className="post-card-body">
                      <div className="post-card-title">
                        <div className="post-card-title-text">
                          <span className="post-card-title-main">{post.title}</span>
                        </div>
                        {linkImage && (
                          <div className="post-card-link-image">
                            <LinkImage image={linkImage} loading="lazy" isImagePost={false} />
                          </div>
                        )}
                      </div>
                      {showImage && post.image && <PostCardImage image={post.image} isMobile={isMobile} loading="lazy" />}
                      {!showImage && !linkImage && post.body && (
                        <div className="post-card-text">
                          <div className="digest-excerpt">{extractExcerpt(post.body, 100)}</div>
                        </div>
                      )}
                    </div>
                    {hasLocation && (
                      <div className="digest-location-section">
                        <a
                          href={`https://www.openstreetmap.org/?mlat=${post.latitude}&mlon=${post.longitude}#map=17/${post.latitude}/${post.longitude}`}
                          target="_blank"
                          rel="noreferrer"
                          className="digest-location-link"
                          title={post.locationName || undefined}
                        >
                          📍 {(post.latitude as number).toFixed(4)}°, {(post.longitude as number).toFixed(4)}°
                        </a>
                      </div>
                    )}
                  </div>
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
