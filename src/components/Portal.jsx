import React, { useState } from "react";

export const PortalTypes = Object.freeze({
  GROUP_BY: 'group_by',
  AGGREGATOR: 'aggregator',
  FILTERS: 'filters',
  SEQUELIZE: 'sequelize',
  ADVANCED: 'advanced',
  DELIMITER: 'delimiter',
  DROP_COLUMN: 'drop_column',
})

function Portal({ title, handleClick, noToggle, children }) {
  const [showHide, toggleShowHide] = useState(false)

  let onClick = () => toggleShowHide(!showHide)

  if (handleClick) {
    onClick = (e) => {
      handleClick(e, showHide, !showHide);

      if (noToggle && showHide) {
        return;
      }

      toggleShowHide(!showHide)
    }
  }

  return (
    <section className="portal">
      <h3
        style={{ cursor: 'pointer' }}
        onClick={onClick}
        className={showHide ? 'active' : ''}
      >
        {`${title}${noToggle ? '!' : ''}`}
      </h3>
      {showHide && children ? <section className="portal-content">{children}</section> : null}
    </section>
  )
}

export function DumbPortal({ title, handleClick, showHide, children }) {
  return (
    <section className="portal">
      <h3
        style={{ cursor: 'pointer' }}
        onClick={handleClick}
        className={showHide ? 'active' : ''}
      >
        {title}
      </h3>
      {showHide && children ? <section className="portal-content">{children}</section> : null}
    </section>
  )

}

export default Portal;
