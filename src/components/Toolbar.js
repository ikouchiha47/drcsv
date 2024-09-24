import React, { useRef, useEffect, useState } from "react";
import Select from 'react-select';

import ConvertToSqlBtn from "./SqlLauncher";

import 'handsontable/dist/handsontable.full.css';
import '../Analysis.css';

const AggregateColumns = ['sum', 'max', 'min', 'cumsum', 'count'].sort();

function Portal({ title, handleClick, noToggle, children }) {
  const [showHide, toggleShowHide] = useState(false)

  let onClick = () => toggleShowHide(!showHide)

  if (handleClick) {
    onClick = (e) => {
      handleClick(e);

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
    <>
      <Portal title='Group By'>
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
      </Portal>

      <Portal title='Aggregator'>
        <div className="flex flex-row aggregations">
          <Select
            isClearable
            ref={aggrRef}
            defaultValue={null}
            options={aggrColumns}
            hideSelectedOptions={true}
            placeholder="Aggregate By"
            styles={selectStyle}
          />
          <Select
            isClearable
            ref={actionRef}
            defaultValue={null}
            options={actions}
            hideSelectedOptions={true}
            onChange={onAggregatorChange}
            placeholder="Operation"
            styles={selectStyle}
          />
        </div>

      </Portal>
      {/*<button onClick={onClear} className='Button Btn-blue'>Clear</button>*/}
    </>
  );
}

const Toolbar = ({
  df,
  handleGroupBy,
  handleAggregator,
  handleFilter,
  handleClear,
  handleSqlLaunch,
  sqlLaunched,
  handleDataClean,
}) => {
  if (!df) return null;

  return (
    <section className="toolbar-wrapper margin-b-xl">
      <h3>Action Center</h3>
      <div className="flex flex-row toolbar">
        <GroupSelector
          columns={df.columns}
          handleGroupBy={handleGroupBy}
          handleAggregator={handleAggregator}
          handleFilter={handleFilter}
          handleClear={handleClear}
        />
        {!sqlLaunched ? (
          <Portal title='Squelize'>
            <ConvertToSqlBtn handleSqlLaunch={handleSqlLaunch} />
          </Portal>
        ) : null}
        <Portal title='Clean Data' noToggle={true} handleClick={handleDataClean} />
      </div>
    </section>
  )

}

export default Toolbar;
