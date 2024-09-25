import React from "react";


function GroupFilters({ filters, removeFilter }) {
  if (!filters.length) return;

  return (
    <ul className='Groupings margin-b-xl'>
      {filters.map((filter, idx) => {
        return (
          <li
            key={idx + 1}
            className='flex flex-row'
            style={{ gap: '8px' }}
            onClick={() => removeFilter(filter)}
          >
            <p>{filter.type}: {[filter.column, filter.action, filter.clause].filter(f => f).join('.')}</p>
            <span>x</span>
          </li>
        )
      })}
    </ul>
  )
}

export default GroupFilters;
