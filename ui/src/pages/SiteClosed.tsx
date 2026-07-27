import { SiteClosedReason } from '../siteHours';

const copy: Record<SiteClosedReason, { emoji: string; heading: string; body: string }> = {
  night: {
    emoji: '🌙',
    heading: 'Goodnight, Raleigh.',
    body: "Sleep well. Get some rest — we'll be back at 8:00 AM.",
  },
  sunday: {
    emoji: '☀️',
    heading: 'Take today off.',
    body: 'Go explore a park, a greenway, or just be outside with the people you love. We’ll be back tomorrow at 8:00 AM.',
  },
};

const SiteClosed = ({ reason }: { reason: SiteClosedReason }) => {
  const { emoji, heading, body } = copy[reason];
  return (
    <div className="page-site-closed">
      <div className="page-site-closed-emoji">{emoji}</div>
      <h1>{heading}</h1>
      <p>{body}</p>
      <div className="page-site-closed-hours">Open Monday–Saturday, 8:00 AM – 10:00 PM</div>
    </div>
  );
};

export default SiteClosed;
