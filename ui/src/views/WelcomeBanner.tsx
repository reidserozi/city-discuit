import clsx from 'clsx';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { createCommunityModalOpened, MainState, signupModalOpened } from '../slices/mainSlice';
import { RootState } from '../store';

export interface WelcomeBannerProps extends React.HTMLAttributes<HTMLDivElement> {
  hideIfMember?: boolean;
}

const WelcomeBanner = ({
  className,
  children,
  hideIfMember = false,
  ...props
}: WelcomeBannerProps) => {
  const dispatch = useDispatch();

  const user = useSelector<RootState>((state) => state.main.user) as MainState['user'];
  const loggedIn = user !== null;

  const usersCount = useSelector<RootState>((state) => state.main.noUsers) as MainState['noUsers'];

  if (hideIfMember && loggedIn) {
    return null;
  }

  const canCreateForum = loggedIn && (user.isAdmin || !import.meta.env.VITE_DISABLEFORUMCREATION);

  return (
    <div
      className={clsx(
        'card card-sub card-padding home-welcome',
        !loggedIn && 'is-guest',
        className
      )}
      {...props}
    >
      <div className="home-welcome-text">
        <div className="home-welcome-join">Improve Raleigh</div>
        <div className="home-welcome-subtext">
          Edit Raleigh is where <span>{usersCount}</span> residents propose, discuss, and improve
          their city.
        </div>
      </div>
      <div className="home-welcome-buttons">
        {loggedIn && (
          <Link to="/new" className={'button' + (loggedIn ? ' button-main' : '')}>
            Create post
          </Link>
        )}
        {canCreateForum && (
          <>
            <button
              onClick={() => dispatch(createCommunityModalOpened())}
              className={'button' + (loggedIn ? ' button-main' : '')}
            >
              Create community
            </button>
          </>
        )}
        <>{children}</>
        {!loggedIn && (
          <button onClick={() => dispatch(signupModalOpened())}>Create new account</button>
        )}
      </div>
    </div>
  );
};

export default WelcomeBanner;
