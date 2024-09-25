import React, { useRef, useEffect } from "react";
import Select from 'react-select';

import ConvertToSqlBtn from "./SqlLauncher";
import Portal from "./Portal";

import 'handsontable/dist/handsontable.full.css';
import '../Analysis.css';
import Filters from "./Filters";

const AggregateColumns = ['sum', 'max', 'min', 'cumsum', 'count'].sort();

const filterHeaderStyle = {
  marginBottom: '16px',
  fontSize: '20px',
  fontWeight: 700,
}

const Delimiter = ({ handleDelimiter, classNames }) => {
  const inputRef = useRef(null);

  const handleSubmit = () => {
    let value = inputRef.current.value;
    if (!value) return;

    handleDelimiter(value);
  }

  let defaultClasses = new Set(['flex', 'flex-row']);
  if (!classNames) classNames = defaultClasses;
  else classNames = defaultClasses.union(classNames);

  return (
    <section className={[...classNames].join(' ')} style={{ gap: '16px' }}>
      <input ref={inputRef} type="text" placeholder="Update Seperator" id="tableName" />
      <button type="button" onClick={handleSubmit} className="Button Btn-blue">Apply</button>
    </section>
  )
};

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
      <Portal title='Group'>
        <h4 style={filterHeaderStyle}>Group By</h4>
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
        <h4 style={filterHeaderStyle}>Aggreate Records By</h4>
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
  handleDataClean,
  handleAdvancedControls,
  handleDelimiterChange,
  handleWhereClauses,
  sqlLaunched,
}) => {
  if (!df) return null;

  return (
    <section className="toolbar-wrapper margin-b-xl">
      <h3>Action Center</h3>
      <div className="flex flex-row toolbar">
        <Portal title='Change Delimiter'>
          <Delimiter handleDelimiter={handleDelimiterChange} />
        </Portal>

        <GroupSelector
          columns={df.columns}
          handleGroupBy={handleGroupBy}
          handleAggregator={handleAggregator}
          handleFilter={handleFilter}
          handleClear={handleClear}
        />

        <Portal title='Filters'>
          <Filters df={df} handleUpdateClauses={handleWhereClauses} />
        </Portal>

        {!sqlLaunched ? (
          <Portal title='Sequelize'>
            <ConvertToSqlBtn handleSqlLaunch={handleSqlLaunch} />
          </Portal>
        ) : null}

        <Portal title='Clean Data' handleClick={handleDataClean} />
        <Portal title='Advanced' handleClick={handleAdvancedControls} />
      </div>
    </section>
  )

}

export default Toolbar;
