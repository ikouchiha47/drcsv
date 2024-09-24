import React, { useRef } from "react";

export const SqlLoaderStates = {
  LOADING: 'loading',
  SUCCESS: 'success',
  FAILED: 'failed'
}

// const SqlState = {
//   state: null,
//   table: null,
// }

const ConvertToSqlBtn = ({ handleSqlLaunch, classNames }) => {
  const tableRef = useRef(null);

  const handleSubmit = () => {
    let value = tableRef.current.value;
    if (!value) return;

    handleSqlLaunch({ state: SqlLoaderStates.LOADING, table: value });
  }

  let defaultClasses = new Set(['flex', 'flex-row']);
  if (!classNames) classNames = defaultClasses;
  else classNames = defaultClasses.union(classNames);

  return (
    <section className={[...classNames].join(' ')} style={{ gap: '16px' }}>
      <input ref={tableRef} type="text" placeholder="Enter table name" id="tableName" />
      <button type="button" onClick={handleSubmit} className="Button Btn-blue">Load Data</button>
    </section>
  )
};

export default ConvertToSqlBtn;
