import { useEffect, useState } from 'react';
import { SiteClosedReason } from '../siteHours';
import { mfetchjson } from '../helper';
import type { Post } from '../serverTypes';

const copy: Record<SiteClosedReason, { emoji: string; heading: string; body: string }> = {
  night: {
    emoji: '🌙',
    heading: 'Goodnight, Raleigh.',
    body: 'Sleep well. Get some rest - we will be back at 8:00 AM.',
  },
  sunday: {
    emoji: '☀️',
    heading: 'Take today off.',
    body: 'Go explore a park, a greenway, or just be outside with the people you love. We will be back tomorrow at 8:00 AM.',
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

  useEffect(() => {
    const fetchDigest = async () => {
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
  }, []);

  return (
    <div className="page-site-closed">
      <div className="page-site-closed-emoji">{emoji}</div>
      <h1>{heading}</h1>
      <p>{body}</p>
      <div className="page-site-closed-hours">Open Monday-Saturday, 8:00 AM - 10:00 PM</div>

      {!loading && posts.length > 0 && (
        <div className="page-site-closed-digest">
          <div className="digest-header">Posts to explore</div>
          <div className="digest-list">
            {posts.map((post) => (
              <div
                key={post.id}
                className="digest-item"
              >
                <div className="digest-item-title">{post.title}</div>
                <div className="digest-item-meta">
                  <span className="community-badge">{post.communityName || 'Community'}</span>
                </div>
                {post.body && <div className="digest-item-excerpt">{extractExcerpt(post.body)}</div>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SiteClosed;
