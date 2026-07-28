import { useState } from 'react';
import StaticPage from '../components/StaticPage';

const About = () => {
  const faqItems = [
    {
      question: 'Why does Edit Raleigh close at night and stay closed all day Sunday?',
      answer: (
        <>
          {`Nothing good has ever been written about a neighbor at one in the morning. We know how strange it sounds for something on the internet, but it's deliberate. We'd rather you sleep. We'd rather Sunday belong to your kids, your congregation, your garden, the greenway, the block you're arguing about. Sunday isn't a hole in the week — it's the half of this that happens outdoors. On Saturday evening we hand you a short list of open proposals with pins near where you live. Then we get out of the way. Go stand at the intersection. Photograph the culvert. See how long the walk really takes. Monday morning, tell everyone what you saw.`}
        </>
      ),
    },
    {
      question: 'Why do posts need a location?',
      answer: `Civic argument falls apart in the abstract. "Traffic is bad" is unanswerable. "The crossing at this intersection gives you eleven seconds and the curb ramp points into the turn lane" is a thing a person can fix. Every post here is pinned to a real point in the city — a proposed sidewalk connection, a park that needs one more shade tree, a stretch of a transit line where the route makes no sense to anyone who's ridden it. You can open the map and see your neighborhood's open questions the way you'd see them on a walk. Geography tells you whether a conversation is yours.`,
    },
    {
      question: 'Why do I need an invite code to join?',
      answer: `Membership starts with a code from a neighborhood leader. This is deliberately slow, and we know exactly what it costs us in growth. We'd rather grow the way a city does — block by block, through people who already know each other — than the way a platform does. The code isn't a velvet rope. It's a handshake, and a quiet promise that you've met at least one person here who'll notice how you behave.`,
    },
    {
      question: 'What makes a good post?',
      answer: (
        <>
          {`Every post here is a proposal or a question — never a verdict. We hold ourselves to one test: could this be handed to a council member, a city planner, or a community coalition and be genuinely useful to them? If yes, it belongs here. That means a good comment adds a cost estimate, a photo from the site, a precedent from Durham or Greenville, a paragraph from the zoning code, or a reason the idea won't work that the original poster hadn't considered. We're trying to build a workshop, not an audience.`}
        </>
      ),
    },
    {
      question: 'How can I contact someone at Edit Raleigh?',
      answer: (
        <>
          You can send an email to{' '}
          <a href={`mailto:${import.meta.env.VITE_EMAILCONTACT}`}>
            {import.meta.env.VITE_EMAILCONTACT}
          </a>
          .
        </>
      ),
    },
    {
      question: 'I have feedback or want to report a bug. What should I do?',
      answer: (
        <>
          {`You can create an issue on our `}
          <a href={`${import.meta.env.VITE_GITHUBURL}/issues`}>GitHub repository</a>
          {`, or email us at `}
          <a href={`mailto:${import.meta.env.VITE_EMAILCONTACT}`}>
            {import.meta.env.VITE_EMAILCONTACT}
          </a>
          .
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
            Edit Raleigh is a platform for the people building Raleigh. Posts are proposals and questions pinned to real places. Nothing is secret. The agendas are posted. But knowing is not the same as having somewhere to do something with what you know. This is that place.
          </h2>
        </div>
        <div className="squiggly-line"></div>
      </div>
      <div className="about-rest">
        <div className="wrap">
          <div className="about-section about-mission">
            <h2>The premise</h2>
            <p>
              Nothing about Raleigh is finished. The greenway ends where someone stopped drawing it. The bus comes every thirty minutes because of a line in a budget. A zoning code is a document, and documents get edited — usually by whoever shows up with the most specific idea.
            </p>
            <p>
              We wanted a verb. Not <em>report Raleigh</em>, not <em>rate Raleigh</em>. <strong>Edit</strong>. The posture of someone who assumes the draft can be improved and intends to improve it.
            </p>
            <p>
              The other half is that every editor works against a press time. A council meets. An item is heard. A vote lands on a Tuesday night whether or not a single person wrote anything down beforehand. That deadline is what separates this from every other place you could be typing: <strong>things end here.</strong> The item gets heard, the thread closes, and the outcome goes on the record next to what we asked for.
            </p>
          </div>

          <div className="about-section about-highlights">
            <h2>How it works</h2>
            <div className="about-highlight">
              <span className="is-bold">Posts have addresses.</span>
              Every proposal or question here is pinned to a real point in the city. You can open the map and see your neighborhood's open questions the way you'd see them on a walk. Geography tells you whether a conversation is yours.
            </div>
            <div className="about-highlight">
              <span className="is-bold">Everything lives in rooms.</span>
              Transit. Zoning and land use. Parks. Schools. The budget. Downtown. Neighborhoods. You join the rooms where you have something to offer and skip the rest without guilt. A room accumulates knowledge. A stream only has today.
            </div>
            <div className="about-highlight">
              <span className="is-bold">It closes at night and all day Sunday.</span>
              We'd rather you sleep. We'd rather Sunday belong to your kids, your congregation, your garden, the greenway. When Saturday evening comes, we hand you a list of open proposals near where you live. Then we get out of the way.
            </div>
            <div className="about-highlight">
              <span className="is-bold">You get in through someone who's already here.</span>
              Membership starts with a code from a neighborhood leader. We'd rather grow block by block, through people who already know each other, than the way a platform grows. It's a handshake, and a quiet promise that you've met at least one person here who'll notice how you behave.
            </div>
          </div>

          <div className="about-section about-faq">
            <h2>Questions</h2>
            <div className="about-faq-list">{renderFaqItems()}</div>
          </div>
        </div>
      </div>
    </StaticPage>
  );
};

export default About;
