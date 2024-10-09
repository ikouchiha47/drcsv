import React, { useEffect, useRef, useState } from "react";

export const PortalTypes = Object.freeze({
  GROUP_BY: 'group_by',
  AGGREGATOR: 'aggregator',
  FILTERS: 'filters',
  SEQUELIZE: 'sequelize',
  ADVANCED: 'advanced',
  DELIMITER: 'delimiter',
  DROP_COLUMN: 'drop_column',
  CROP_TABLE: 'crop_table',
})

function Portal({ title, handleClick, noToggle, alt, children }) {
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
        title={alt || ''}
      >
        {`${title}${noToggle ? '!' : ''}`}
      </h3>
      {showHide && children ? <section className="portal-content">{children}</section> : null}
    </section>
  )
}

export function DumbPortal({ title, handleClick, showHide, children, alt }) {
  const elRef = useRef(null)
  const rectRef = useRef(null)

  const [alignLeft, setAlignLeft] = useState(false)

  useEffect(() => {
    if (!showHide) return;

    const viewportWidth = window.innerWidth;
    const rect = rectRef.current.getBoundingClientRect()

    const spaceOnRight = viewportWidth - rect.right;
    const portalWidth = rectRef.current.offsetWidth;

    // console.log("vw", viewportWidth, "rc", spaceOnRight, portalWidth);

    setAlignLeft(spaceOnRight > portalWidth)

  }, [showHide])

  return (
    <section className="portal" ref={rectRef}>
      <h3
        style={{ cursor: 'pointer' }}
        onClick={handleClick}
        className={showHide ? 'active' : ''}
        title={alt || ''}
      >
        {title}
      </h3>
      {showHide && children ? (
        <section ref={elRef} className="portal-content" style={{ left: alignLeft ? 'auto' : 0 }}>{children}</section>
      ) : null}
    </section>
  )

}

export default Portal;
