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
          <div className="digest-header">Proposals to explore</div>
          <div className="digest-list">
            {posts.map((post) => (
              <a
                key={post.id}
                href={`/${post.community?.name}/post/${post.id}`}
                className="digest-item"
              >
                <div className="digest-item-title">{post.title}</div>
                <div className="digest-item-meta">
                  {post.community?.name && <span className="community-badge">{post.community.name}</span>}
                  <span className="comment-count">{post.noComments} comment{post.noComments !== 1 ? 's' : ''}</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SiteClosed;
