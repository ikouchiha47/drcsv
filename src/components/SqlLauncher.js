import React, { useRef } from "react";

export const SqlLoaderStates = {
  LOADING: 'loading',
  SUCCESS: 'success',
  FAILED: 'failed'
}

const SqlState = {
  state: null,
  table: null,
}

const ConvertToSqlBtn = ({ handleSqlLaunch }) => {
  const tableRef = useRef(null);

  const handleSubmit = () => {
    let value = tableRef.current.value;
    if (!value) return;

    handleSqlLaunch({ state: SqlLoaderStates.LOADING, table: value });
  }
  return (
    <section className="flex flex-row margin-b-xl" style={{ gap: '16px' }}>
      <input ref={tableRef} type="text" placeholder="Enter table name" id="tableName" />
      <button type="button" onClick={handleSubmit} className="Button Btn-blue">Convert to SQL</button>
    </section>
  )
};

export default ConvertToSqlBtn;
