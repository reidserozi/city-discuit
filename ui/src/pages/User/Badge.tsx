import React from 'react';
import { Badge as BadgeType } from '../../serverTypes';
import { badgeImage } from './badgeImage';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  badge: BadgeType;
}

function Badge({ className = '', badge, ...props }: BadgeProps) {
  const renderBadgeContent = () => {
    if (badge.type === 'supporter') {
      const { src, alt } = badgeImage(badge.type);
      return (
        <div style={{
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#FDD835',
          padding: '2px',
        }}>
          <img
            src={src}
            alt={alt}
            style={{
              width: '90%',
              height: '90%',
              objectFit: 'cover',
              borderRadius: '50%'
            }}
          />
        </div>
      );
    }
    const { src, alt } = badgeImage(badge.type);
    return <img src={src} alt={alt} />;
  };
  return (
    <div className={'user-badge' + (className ? ` ${className}` : '')} {...props}>
      {renderBadgeContent()}
    </div>
  );
}

export default Badge;
