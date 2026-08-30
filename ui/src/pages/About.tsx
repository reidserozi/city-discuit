import StaticPage from '../components/StaticPage';

const About = () => {
  return (
    <StaticPage className="" title="About">
      <main className="document">
        <h1>A memo on why we made Edit Raleigh</h1>

        <p>
          There's an official city sign — a white placard staked into the ground — on a street you drive every day. Case number, phone number, date. Eighteen months later, something is standing there.
        </p>

        <img
          src="/zoning-sign.jpg"
          alt="A City of Raleigh zoning case sign staked into the ground on a street"
        />

        <p>
          That gap — between the sign and what gets built — is where a city is actually decided. None of it's secret; the agendas are posted, the maps are public. But knowing isn't the same as having somewhere to <em>do</em> something with what you know. We've mostly had two options: three minutes at a podium on a Tuesday night, or a feed where a broken streetlight becomes a fight about who belongs here.
        </p>

        <p>Edit Raleigh is a third option: one place to research, propose, and sharpen civic ideas, organized by topic, grounded in real locations, built so the results are useful to the people who actually decide.</p>

        <h2>Only what the city is actually deciding</h2>

        <p>The rule: if it's headed for a vote, a hearing, a permit, or a plan, it belongs here. Rezoning cases, ordinance changes, budget lines, plans out for public comment — real things with a case number and a decision waiting at the end. Everyone's working from the same staff report, the same map, so the conversation goes straight to what would make it better. We also welcome early-stage ideas: a crosswalk nobody has proposed yet, a park that isn't in any plan, a bus route that should exist. Submit those too — they belong here even earlier, before a formal process begins.</p>

        <h2>Organized by topic, not neighborhood</h2>

        <p>Your neighborhood already has a Facebook group; we're not trying to replace it. But sorting people by geography produces neighborhood-sized thinking — a hundred silos, each convinced its own block is the whole picture. Stormwater doesn't respect a subdivision line, and neither does a bus route or a budget. So Edit Raleigh is organized by subject — zoning, transit, parks, the budget — where the person working beside you on an issue lives four miles away with an entirely different view out the window. You still post as someone from a specific part of Raleigh. You just don't argue from inside a silo.</p>

        <h2>A proposal, never a verdict</h2>

        <p>The test: could this be handed to a council member or a city planner and be genuinely useful to them? A good comment here adds a cost estimate, a site photo, a precedent from another city — not just an opinion. We're building a workshop, not an audience. And when a proposal reaches the city, we write down what happened to it, wins and losses alike, same typeface.</p>

        <h2>Closed nights and Sundays</h2>

        <p>Every night at midnight, the site goes quiet. It doesn't open on Sundays. Good discourse rarely shows up at 1 a.m. — that's a product working exactly as designed, somewhere else. We'd rather you sleep, and we'd rather Sunday be for going outside and actually looking at the thing you're arguing about.</p>

        <h2>No business model</h2>

        <p>Nobody makes money here — no ads, no investors, nothing to sell. That's leverage: we can afford to admit when something's not working, and if this ever becomes the outrage machine we built it to avoid, we'll close it. Not throttle it. Close it.</p>

        <p>Go edit your city. We open at six, close at midnight, and on Sunday, go explore Raleigh.</p>

        <p style={{ fontSize: '0.9em', fontStyle: 'italic', opacity: 0.8, marginTop: '3rem' }}>
          Edit Raleigh is an independent, volunteer-run civic platform for Raleigh, North Carolina. It is not affiliated with the City of Raleigh or Wake County. Built on{' '}
          <a href="https://discuit.org/" target="_blank" rel="noopener">
            Discuit
          </a>{' '}
          , open-source software, and open-source itself.
        </p>
      </main>
    </StaticPage>
  );
};

export default About;
