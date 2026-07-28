import { useState } from 'react';
import StaticPage from '../components/StaticPage';

const About = () => {
  const faqItems = [
    {
      question: 'Why does Edit Raleigh close at night and all day Sunday?',
      answer: (
        <>
          {`Nothing good has ever been written about a neighbor at one in the morning. We know how strange it sounds for something on the internet, but it's the most deliberate decision we've made. We'd rather you sleep. We'd rather Sunday belong to your kids, your congregation, your garden, the greenway, the block you're arguing about. Sunday isn't a hole in the week — it's the half of this that happens outdoors. On Saturday evening we hand you a short list of open proposals with pins near where you live. Then we get out of the way. Go stand at the intersection. Photograph the culvert. See how long the walk really takes. Monday morning, tell everyone what you saw.`}
        </>
      ),
    },
    {
      question: 'Why do posts need a location?',
      answer: `Civic argument falls apart in the abstract. "Traffic is bad" is unanswerable. "The crossing at this intersection gives you eleven seconds and the curb ramp points into the turn lane" is a thing a person can fix. Every post here is pinned to a real point in the city. You can open the map and see your neighborhood's open questions the way you'd see them on a walk. Geography does something that tags never could: it tells you whether a conversation is yours.`,
    },
    {
      question: 'Why is there no room for neighborhoods?',
      answer: `Your neighborhood already has somewhere to talk to itself. A Facebook group, an old listserv, an app built for precisely that. Those work fine for what they are. But a platform organized by neighborhood produces neighborhood-sized thinking — a hundred small rooms, each one convinced that its own block is the entire argument. Stormwater does not respect a subdivision boundary. Neither does a bus route, a school assignment, a floodplain, or a budget. Those things need Southeast Raleigh and North Hills in the same conversation — occasionally annoyed with one another — working out something that has to hold true for the whole city. So geography stays on your profile, not on the door. You still post as someone from a specific part of Raleigh; that's the accountability. But you walk into a room organized around a subject, where the person disagreeing with you lives four miles away and has an entirely different view out the window.`,
    },
    {
      question: 'What makes a good post?',
      answer: (
        <>
          {`Every post here is a proposal or a question — never a verdict. We hold ourselves to one test: could this be handed to a council member, a city planner, or a community coalition and be genuinely useful to them? If yes, it belongs here. A good comment here adds a cost estimate, a photo from the site, a precedent from Durham or Greenville, a paragraph from the UDO that the original poster missed, or a reason the idea won't work that the poster hadn't considered. Dissent is welcome — sharp dissent especially — as long as it leaves the proposal better than it found it. We are trying to build a workshop, not an audience.`}
        </>
      ),
    },
    {
      question: 'How do I join?',
      answer: `Membership starts with a code from a neighborhood leader. This is deliberately slow, and we know exactly what it costs us in growth. We'd rather grow the way a city does — block by block, through people who already know each other — than the way a platform does. The code isn't a velvet rope. It's a handshake, and a quiet promise that you've met at least one person here who'll notice how you behave.`,
    },
    {
      question: 'How can I contact someone?',
      answer: (
        <>
          {`You can reach us on `}
          <a href={import.meta.env.VITE_TWITTERURL} target="_blank" rel="noreferrer">
            X / Twitter (@RaleighWiki)
          </a>
          {`, or create an issue on our `}
          <a href={`${import.meta.env.VITE_GITHUBURL}/issues`}>GitHub repository</a>.
        </>
      ),
    },
  ];

  const [faqItemOpenedIndex, _setFaqItemOpenedIndex] = useState<number | null>(null);
  const setFaqItemOpenedIndex = (index: number) => {
    _setFaqItemOpenedIndex((value) => {
      if (value === index) return null;
      return index;
    });
  };

  const renderFaqItems = () => {
    const elems = faqItems.map((item, index) => {
      const { question, answer } = item;
      const isOpen = faqItemOpenedIndex === index;
      return (
        <div className={'about-faq-item' + (isOpen ? ' is-open' : '')} key={index}>
          <div className="about-faq-question" onClick={() => setFaqItemOpenedIndex(index)}>
            <span>{question}</span>
            <svg
              width="19"
              height="10"
              viewBox="0 0 19 10"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M1 1L9.5 8L17.5 1" stroke="currentColor" strokeWidth="2" />
            </svg>
          </div>
          <div className="about-faq-answer">{answer}</div>
        </div>
      );
    });
    return <>{elems}</>;
  };

  return (
    <StaticPage className="page-about" title="About" noWrap>
      <div className="about-landing">
        <div className="wrap">
          <h1 className="about-heading heading-highlight">
            Raleigh is a draft with a deadline.
          </h1>
          <h2 className="about-subheading">
            Edit Raleigh is a third option. A platform for the people building Raleigh, where proposals and questions stay pinned to the places they matter.
          </h2>
        </div>
        <div className="squiggly-line"></div>
      </div>
      <div className="about-rest">
        <div className="wrap">
          <div className="about-section">
            <h2>The premise</h2>
            <p>
              Nothing about Raleigh is finished. The greenway ends where someone stopped drawing it. The bus comes every thirty minutes because of a line in a budget. A zoning code is a document, and documents get edited — usually by whoever shows up with the most specific idea.
            </p>
            <p>
              We wanted a verb. Not <em>report Raleigh</em>, not <em>rate Raleigh</em>. <strong>Edit.</strong> The posture of someone who assumes the draft can be improved and intends to improve it.
            </p>
            <p>
              Every editor works against a press time. A council meets. An item is heard. A vote lands on a Tuesday night whether or not a single person wrote anything down beforehand. <strong>Things end here.</strong> The item gets heard, the thread closes, and the outcome goes on the record next to what we asked for. A year from now you'll be able to open one page and see exactly what this city said yes to, what it didn't, and what we managed to change.
            </p>
          </div>

          <div className="about-section">
            <h2>Everything lives in a room</h2>
            <p>
              On most platforms there is one stream and everything falls into it — shuffled together and sorted by whatever is loudest this afternoon. That's an inbox. Inboxes are where subjects go to get buried.
            </p>
            <p>
              Edit Raleigh is built out of communities organized by subject instead. Zoning. Transit. Parks and greenways. Public safety. Schools. The budget. Stormwater, which turns out to matter enormously. You join the rooms where you have something to offer and you skip the rest without guilt.
            </p>
            <p>
              You get to care about one thing well. And a room accumulates. A community that's been discussing zoning for two years contains people who've read every case, remember what was promised in 2024, and can tell a newcomer in one paragraph what took them a year to learn. A stream only has today.
            </p>
          </div>

          <div className="about-section">
            <h2>There is no room for your neighborhood</h2>
            <p>
              That's on purpose, and it's the choice people argue with most. Your neighborhood already has somewhere to talk to itself. A Facebook group, an old listserv, an app built for precisely that. Those work fine.
            </p>
            <p>
              But a platform organized by neighborhood produces neighborhood-sized thinking. Sort people by geography and you get a hundred small rooms, each one reasonably convinced that its own block is the entire argument — which is exactly the silo we're already living in. Stormwater does not respect a subdivision boundary. Neither does a bus route, a school assignment, a floodplain, an ordinance, or a budget.
            </p>
            <p>
              So geography stays on your profile, not on the door. You still post as someone from a specific part of Raleigh; that's the accountability. But you walk into a room organized around a subject, where the person disagreeing with you lives four miles away and has an entirely different view out the window. That friction is the feature.
            </p>
          </div>

          <div className="about-section">
            <h2>You post from a neighborhood</h2>
            <p>
              When you sign up, you claim a part of the city, and it travels with your name. Not your street address — your neighborhood. This is a small thing that changes the temperature of a room. It means the person you're disagreeing with about a rezoning case is someone who might be standing in front of you at the farmers market. It makes the stakes legible: you can see immediately who lives with the consequences of an idea and who's just nearby. Accountability without exposure. Neighbors, not usernames.
            </p>
          </div>

          <div className="about-section">
            <h2>What this is not</h2>
            <p>
              It's not 311; if your garbage bin wasn't picked up, call the city, they're good at that. It's not a campaign; candidates and causes can find their own megaphones. It's not a place to be clever about how much you hate a developer. And it is emphatically not a feed for suspicion about who's walking down your street.
            </p>
          </div>

          <div className="about-section">
            <h2>Why not just use Facebook or email?</h2>
            <p>
              Fair. The neighborhood group and the old listserv have the one thing we don't: your neighbors, already there, already posting. We're not asking anyone to leave.
            </p>
            <p>
              But those places have three blind spots. They have no map — none of them can show you a proposal in space, where the sidewalk would actually connect, which block floods, how long the walk really is. Here, the argument sits on top of the geography that caused it. They forget — a post in a neighborhood group is gone in a week, unsearchable to the public. Edit Raleigh accumulates. A thread from two years ago is a citation you can paste into a public comment. And nobody there is tuning your feed. Platforms that run on engagement figured out long ago that suspicion is the most engaging thing a neighborhood produces. There's no algorithm here deciding what will upset you most, because there's nobody to sell your attention to.
            </p>
          </div>

          <div className="about-section">
            <h2>What we're aiming at</h2>
            <p>
              A year from now, a council member preparing for a Tuesday meeting should be able to open Edit Raleigh and get an honest read on the city. Not a poll. Not the eleven people who happened to email. A legible picture of what residents have actually thought through, where they genuinely disagree, and which parts of town are behind what. City staff scoping a corridor study should find real observations here — gathered by the people who live on that corridor, with photographs, locations, and dates attached.
            </p>
            <p>
              Government listens to whoever is legible. Today that's whoever shows up angriest at the podium, or whoever can afford a consultant to write the memo. Both of those are beatable. That's the thing worth building. Not a bigger microphone — a better draft.
            </p>
          </div>

          <div className="about-section">
            <h2>This is an experiment</h2>
            <p>
              One more thing to know before you sign up. Nobody makes money here. There's no company, no investors, no ad inventory, no plan to sell anything to anyone — not the software, not your attention, not your address. It's open-source code on a server that costs about what two lunches cost, run by people who live in this city.
            </p>
            <p>
              That absence of a business model is not modesty. It's leverage. A platform with a payroll can't afford to admit its comment section has gone rancid; it has to keep the numbers moving. We can afford to admit it. And if this becomes the thing we were trying to avoid — outrage, factions, the same six people relitigating the same grievance in every thread — we will close it. Not throttle it, not ship a moderation feature and hope. Close it.
            </p>
            <p>
              We'd rather run a small useful thing for two years and stop than a large ugly one forever. Which makes you a participant in an experiment, not a customer of a service.
            </p>
          </div>

          <div className="about-section">
            <h2>Who we're hoping finds this</h2>
            <p>
              The person who read the entire staff report and has notes. The one with unreasonably strong opinions about bus shelters. The retired engineer who can tell you why that culvert floods. The parent who's mapped every unsafe walk to school in a two-mile radius. The renter who's lived in four Raleigh neighborhoods in six years and sees the pattern. The person who's been to one council meeting, found it baffling, and hasn't gone back.
            </p>
            <p>
              If you've ever driven past something in this city and thought <em>someone should just</em> — you're already doing the work. This is where you write it down, in public, where someone else can add to it. Raleigh is being edited right now, every week, in rooms most of us will never sit in. The draft is open and the deadline is real. Come mark it up.
            </p>
            <p>
              We open at eight. We close at ten. On Sunday, go outside.
            </p>
          </div>

          <div className="about-section about-faq">
            <h2>Questions</h2>
            <div className="about-faq-list">{renderFaqItems()}</div>
          </div>

          <div className="about-section">
            <p style={{ fontSize: '0.9em', fontStyle: 'italic', opacity: 0.8, marginTop: '3rem' }}>
              Edit Raleigh is an independent, volunteer-run civic platform for Raleigh, North Carolina. It is not affiliated with the City of Raleigh or Wake County. Built on open-source software, and open-source itself.
            </p>
          </div>
        </div>
      </div>
    </StaticPage>
  );
};

export default About;
