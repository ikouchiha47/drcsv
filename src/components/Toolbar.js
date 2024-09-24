import React, { useRef, useEffect } from "react";
import Select from 'react-select';

import 'handsontable/dist/handsontable.full.css';
import '../Analysis.css';

const AggregateColumns = ['sum', 'max', 'min', 'cumsum', 'count'].sort();

function GroupSelector({
  columns,
  handleGroupBy,
  handleAggregator,
  handleFilter,
  handleClear,
}) {
  const groupColumns = columns.map(col => ({ value: col, label: col }));
  const aggrColumns = columns.map(col => ({ value: col, label: col }));
  const actions = AggregateColumns.map(aggr => ({ value: aggr, label: aggr }))

  const columnRef = useRef(null);
  const aggrRef = useRef(null);
  const actionRef = useRef(null);
  // const filterRef = useRef(null);

  const nullify = () => {
    let columnCurrent = columnRef.current;
    let aggrCurrent = aggrRef.current;
    let actionCurrent = actionRef.current;
    // let filterCurrent = filterRef.current;

    [
      columnCurrent,
      aggrCurrent,
      actionCurrent,
      // filterCurrent,
    ].forEach(cur => { cur && cur.setValue(null) })
  }

  useEffect(() => {
    return () => {
      console.log("unmount selector");
      nullify();
    }

  }, [
    columns,
    columnRef,
    aggrRef,
    actionRef,
    // filterRef,
  ]) // reload when columns change

  const onClear = () => {
    nullify();
    handleClear('all');
  }

  const onAggregatorChange = (e) => {
    if (!e) return;

    let action = e.value;
    let aggrValue = aggrRef.current.getValue()[0];

    if (!AggregateColumns.includes(action)) return;
    if (!aggrValue) return;

    // setTimeout(() => {
    //   aggrRef.current.setValue(null);
    //   actionRef.current.setValue(null);
    // }, 0)

    handleAggregator(aggrValue.value, action);
  }


  const selectStyle = {
    option: provided => ({
      ...provided,
      color: 'black'
    }),
    control: provided => ({
      ...provided,
      color: 'black'
    }),
    singleValue: provided => ({
      ...provided,
      color: 'black'
    }),
    menu: base => ({ ...base, zIndex: 999 }),
  }

  return (
    <div className="flex flex-row toolbar">
      <h3>Group By</h3>
      <Select
        isClearable
        defaultValue={null}
        ref={columnRef}
        options={groupColumns}
        hideSelectedOptions={true}
        placeholder="Group By"
        onChange={handleGroupBy}
        styles={selectStyle}
      />
      <div className="flex flex-row aggregations">
        <h3>Aggregate By</h3>
        <Select
          isClearable
          ref={aggrRef}
          defaultValue={null}
          options={aggrColumns}
          hideSelectedOptions={true}
          placeholder="Aggregate By"
          styles={selectStyle}
        />
        <h3>Aggregator</h3>
        <Select
          isClearable
          ref={actionRef}
          defaultValue={null}
          options={actions}
          hideSelectedOptions={true}
          onChange={onAggregatorChange}
          placeholder="Aggregate By"
          styles={selectStyle}
        />
      </div>
      {/*<h3>Filter By</h3>
      <Select
        isClearable
        ref={filterRef}
        defaultValue={null}
        options={groupColumns}
        hideSelectedOptions={true}
        onChange={onAggregatorChange}
        placeholder="Filter By"
        styles={{ menu: base => ({ ...base, zIndex: 999 }) }}
      />*/}
      <button onClick={onClear} className='Button Btn-blue'>Clear</button>
    </div>
  );
}

const Toolbar = ({
  df,
  handleGroupBy,
  handleAggregator,
  handleFilter,
  handleClear,
}) => {
  if (!df) return null;

  return (
    <section className="toolbar-wrapper margin-b-xl">
      <h3>Action Center</h3>
      <GroupSelector
        columns={df.columns}
        handleGroupBy={handleGroupBy}
        handleAggregator={handleAggregator}
        handleFilter={handleFilter}
        handleClear={handleClear}
      />
    </section>
  )

}

export default Toolbar;
