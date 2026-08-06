import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import Link from './Link';
import { RootState } from '../store';
import { MainState } from '../slices/mainSlice';

const Footer = () => {
  const className = 'footer';
  const sidebarCommunities = useSelector<RootState>(
    (state) => state.main.sidebarCommunities
  ) as MainState['sidebarCommunities'];

  // For some reason, on Firefox desktop, there's a small (2 pixels perhaps)
  // white bar on the bottom of the page. This useEffect hook gets rid of that
  // by making it the background color of the footer.
  useEffect(() => {
    const footerEl = document.querySelector(className);
    if (footerEl) {
      const background = document.documentElement.style.background;
      document.documentElement.style.background = window.getComputedStyle(footerEl).background;
      return () => {
        document.documentElement.style.background = background;
      };
    }
  }, []);

  const topCommunities = sidebarCommunities.slice(0, 5);

  return (
    <footer className={className}>
      <div className="footer__inner">
        <div className="footer__brand">
          <div className="footer__wordmark">
            <Link to="/">{import.meta.env.VITE_SITENAME}</Link>
          </div>
          <p className="footer__tagline">A draft with a deadline.</p>
          <div className="footer__hours">Open Mon–Sat, 8:00 AM – 10:00 PM</div>
          <div className="footer__hours-sub">Closed Sundays. Go outside.</div>
        </div>

        <nav className="footer__col" aria-labelledby="footer-communities-title">
          <div className="footer__col-title" id="footer-communities-title">
            Communities
          </div>
          <ul className="footer__links">
            {topCommunities.map((community) => (
              <li key={community.id}>
                <Link to={`/c/${community.name}`}>{community.name}</Link>
              </li>
            ))}
            <li>
              <Link to="/communities" className="footer__link-accent">
                All communities →
              </Link>
            </li>
          </ul>
        </nav>

        <nav className="footer__col" aria-labelledby="footer-about-title">
          <div className="footer__col-title" id="footer-about-title">
            About
          </div>
          <ul className="footer__links">
            <li>
              <Link to="/about">Why we made this</Link>
            </li>
            <li>
              <Link to="/guidelines">Guidelines</Link>
            </li>
            <li>
              <Link to="/terms">Terms of use</Link>
            </li>
            <li>
              <Link to="/privacy-policy">Privacy</Link>
            </li>
            {import.meta.env.VITE_GITHUBURL && (
              <li>
                <a
                  href={import.meta.env.VITE_GITHUBURL}
                  target="_blank"
                  rel="noopener"
                >
                  Source code
                </a>
              </li>
            )}
          </ul>
        </nav>
      </div>

      <div className="footer__note">
        An independent, volunteer-run project. Not affiliated with the City of Raleigh or Wake County. Posts are written by residents. Nothing posted here constitutes official public comment or professional advice.
      </div>
    </footer>
  );
};

export default Footer;
