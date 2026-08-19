import PropTypes from 'prop-types';
import React from 'react';
import MarkdownBody from '../../components/MarkdownBody';
import { CommunityItem } from '../../serverTypes';

export const ItemsList = ({
  items,
  unordered = false,
}: {
  items: CommunityItem[];
  unordered?: boolean;
}) => {
  let oitems = items;
  if (unordered) {
    oitems = [...items];
    oitems.sort((a, b) => a.id - b.id);
  }

  const renderText = (markdown?: string | null) => {
    return <MarkdownBody veryBasic>{markdown}</MarkdownBody>;
  };

  return (
    <>
      {oitems.map((item, i) => (
        <React.Fragment key={item.id}>
          <div>{i + 1}.</div>
          <div>{renderText(item.item)}</div>
          <div></div>
          <div>{renderText(item.description)}</div>
        </React.Fragment>
      ))}
    </>
  );
};

ItemsList.propTypes = {
  items: PropTypes.arrayOf(PropTypes.object).isRequired,
  unordered: PropTypes.bool,
};

const Items = ({ items, unordered = false }: { items: CommunityItem[]; unordered?: boolean }) => {
  if (!items) {
    return null;
  }

  return (
    <div className="card card-sub card-items">
      <div className="card-head">
        <div className="card-title">Discussion items</div>
      </div>
      <div className="card-content">
        <div className="card-items-list">
          <ItemsList items={items} unordered={unordered} />
        </div>
      </div>
    </div>
  );
};

export default Items;
