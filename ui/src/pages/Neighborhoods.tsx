import StaticPage from '../components/StaticPage';

const Neighborhoods = () => {
  return (
    <StaticPage className="" title="Add Your Neighborhood">
      <main className="document">
        <h1>How to Add Your Neighborhood</h1>

        <p>
          Every account on Edit Raleigh is tied to a neighborhood. This is how we grow block by block — so the person working through a rezoning question alongside you might be someone you&apos;d run into at the farmers market.
        </p>

        <p>
          Some neighborhoods require a code to join — a quiet handshake with someone who&apos;s already here, not a velvet rope. That code comes from your neighborhood leader: the person who&apos;s taking responsibility for bringing your block into this conversation.
        </p>

        <h2>Don&apos;t see your neighborhood in the sign-up list?</h2>

        <p>
          If your neighborhood isn&apos;t in the dropdown when you sign up, it hasn&apos;t been added to Edit Raleigh yet. Message us on X:{' '}
          <a href="https://x.com/RaleighWiki" target="_blank" rel="noopener">
            @RaleighWiki
          </a>
          . New to DMs?{' '}
          <a href="https://help.x.com/en/using-x/direct-messages" target="_blank" rel="noopener">
            Here&apos;s how
          </a>
          . Tell us your neighborhood name and we&apos;ll get it added.
        </p>

        <h2>Don&apos;t have a code?</h2>

        <p>
          Codes come from your neighborhood leader — someone already representing your area here. We&apos;d rather you make that connection yourself; tracking down your neighborhood leader is usually the start of a good working relationship, not just a step to get past.
        </p>

        <p>
          A good place to start: your neighborhood&apos;s Citizen Advisory Council (CAC). Raleigh already organizes by neighborhood through its CACs, and they&apos;re often the fastest way to find out who&apos;s leading the conversation in your area.
        </p>

        <h2>Become a neighborhood leader</h2>

        <p>
          If your neighborhood doesn&apos;t have a leader yet and you&apos;d like to bring it into Edit Raleigh, we want to talk to you. This isn&apos;t a huge responsibility — just someone who cares about your block and wants to grow the conversation there. Before you start sharing your code, please read our <a href="/neighborhood-leader-conduct">Code of Conduct for neighborhood leaders</a>. Then reach out on X:{' '}
          <a href="https://x.com/RaleighWiki" target="_blank" rel="noopener">
            @RaleighWiki
          </a>
          .
        </p>
      </main>
    </StaticPage>
  );
};

export default Neighborhoods;
