import React, { useRef, useEffect, useState } from "react";
import Select from 'react-select';

import ConvertToSqlBtn from "./SqlLauncher";
import Portal, { DumbPortal, PortalTypes } from "./Portal";

import { selectStyle } from "../styles/react-select-style";
import 'handsontable/dist/handsontable.full.css';
import '../Analysis.css';
import Filters from "./Filters";

const AggregateColumns = ['sum', 'max', 'min', 'cumsum', 'count'].sort();

const filterHeaderStyle = {
  marginBottom: '1rem',
  fontSize: '1.25rem',
  fontWeight: 700,
}

const Delimiter = ({ handleDelimiter, classNames }) => {
  const inputRef = useRef(null);

  const handleSubmit = () => {
    let value = inputRef.current.value;
    if (!value) return;

    handleDelimiter(value);
  }

  let defaultClasses = new Set(['flex', 'flex-col']);
  if (!classNames) classNames = defaultClasses;
  else classNames = defaultClasses.union(classNames);

  return (
    <section className={[...classNames].join(' ')} style={{ gap: '1rem' }}>
      <h4 style={filterHeaderStyle}>New Delimieter</h4>
      <section className="flex flex-row" style={{ gap: '1rem' }}>
        <input ref={inputRef} type="text" placeholder="Update seperator, defaults to ," id="tableName" />
        <button type="button" onClick={handleSubmit} className="Button Btn-blue">Apply</button>
      </section>
    </section>
  )
};

export const SelectPortalBox = ({ handleChange, classNames, title, columns, isMulti }) => {
  const inputRef = useRef(null);

  const handleSubmit = () => {
    let options = inputRef.current.getValue();

    if (!options) return;
    if (!options.length) return;


    handleChange(options.map(option => option.value));
  }

  let defaultClasses = new Set(['flex', 'flex-col']);

  if (!classNames) classNames = defaultClasses;
  else classNames = defaultClasses.union(classNames);

  return (
    <section className={[...classNames].join(' ')} style={{ gap: '1rem' }}>
      <h4 style={filterHeaderStyle}>{title}</h4>

      <section className="flex flex-row" style={{ gap: '1rem' }}>
        <Select
          isClearable
          isMulti={isMulti || false}
          ref={inputRef}
          hideSelectedOptions={true}
          options={columns}
          styles={selectStyle}
        />
        <button type="button" onClick={handleSubmit} className="Button Btn-blue">Apply</button>
      </section>
    </section>
  )
}

function GroupTool({ columns, handleGroupBy }) {
  const groupColumns = columns.map(col => ({ value: col, label: col }));
  const columnRef = useRef(null);

  useEffect(() => {
    let currentCol = columnRef.current;

    return () => {
      console.log("unmount selector");
      currentCol && currentCol.setValue(null)
    }

  }, [columns, columnRef])

  return (
    <>
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
    </>
  )
}

function AggregatorTool({ columns, handleAggregator, isActive }) {
  const aggrColumns = columns.map(col => ({ value: col, label: col }));
  const actions = AggregateColumns.map(aggr => ({ value: aggr, label: aggr }))

  const aggrRef = useRef(null);
  const actionRef = useRef(null);

  useEffect(() => {
    let currAggr = aggrRef.current;
    let currAction = actionRef.current;

    return () => {
      console.log("unmount selector");

      currAggr && currAggr.setValue(null)
      currAction && currAction.setValue(null);
    }

  }, [columns, aggrRef, actionRef])

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

  return (
    <>
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
    </>
  );
}

const CropTable = ({ origDf, handleCropTable }) => {
  const inputRef = useRef(null);
  const lengths = origDf.values.map(row => row.length)
  const [min, max] = lengths.reduce((acc, v) => {
    let [min, max] = acc;

    return [Math.min(min, v === 0 ? min : v), Math.max(max, v)]
  }, [Infinity, -Infinity])


  const handleSubmit = () => {
    let { value } = inputRef.current;
    if (!value) return;

    if (value === 0) return null;
    if (value > max) return null;

    handleCropTable(value, min, max);
  }

  return (
    <>
      <h4 style={filterHeaderStyle}>Crop Table</h4>
      <div className="flex flex-row aggregations">
        <section className="Form-row">
          <p>Enter Range Between 1 and {max}</p>
          <input type="number" className="Form-input" ref={inputRef} required />
          <button type="button" className="Button Btn-blu" onClick={handleSubmit}>
            Crop
          </button>
        </section>
      </div>
    </>
  )
}

const Toolbar = ({
  df,
  origDf,
  handleGroupBy,
  handleAggregator,
  handleClear,
  handleSqlLaunch,
  handleDataClean,
  handleAdvancedControls,
  handleDelimiterChange,
  handleWhereClauses,
  handleFixHeaders,
  handleAnalyseData,
  handleDropColumns,
  handleReset,
  handleSanitizeData,
  sqlLaunched,
}) => {
  const [activePortal, setActivePortal] = useState(null);

  if (!df) return null;

  const columns = df.columns;

  const isActivePortal = (targetPortal) => {
    return targetPortal === activePortal;
  }

  // if the same portal is selected, deselect it
  const _setActivePortal = (targetPortal) => {
    if (isActivePortal(targetPortal)) setActivePortal(null);
    else setActivePortal(targetPortal)
  }

  const onHandleLaunch = (data) => {
    _setActivePortal(null);
    handleSqlLaunch(data);
  }

  const onAdvanceCtrl = (_, _prev, next) => {
    handleAdvancedControls(next)
  }

  const handleCropTable = (_, _prev, next) => {
    handleSanitizeData({
      action: 'crop_table',
      isOn: next,
    })
  }

  return (
    <section className="toolbar-wrapper margin-b-xl">
      <header className="flex flex-row" style={{ alignItems: 'center', gap: '1rem' }}>
        <h3 className="Section-header">Action Center</h3>
        <em className="caption">! operations invalidate previous operations</em>
      </header>
      <div className="flex flex-row toolbar">

        <Portal title='Fix Headers' handleClick={handleFixHeaders} />
        <Portal title='Clean Data' handleClick={handleDataClean} />
        <Portal title='Crop Table' alt='Crops table to columns length' handleClick={handleCropTable} />
        <Portal title='Analyse Full' handleClick={handleAnalyseData} />
        <Portal title='Reset !' handleClick={handleReset} />

        <DumbPortal title='Change Delimiter'
          handleClick={() => _setActivePortal(PortalTypes.DELIMITER)}
          showHide={isActivePortal(PortalTypes.DELIMITER)}
        >
          <Delimiter handleDelimiter={handleDelimiterChange} />
        </DumbPortal>



        <DumbPortal title='Drop Column !'
          handleClick={() => _setActivePortal(PortalTypes.DROP_COLUMN)}
          showHide={isActivePortal(PortalTypes.DROP_COLUMN)}
        >
          <SelectPortalBox
            id='dropColumn'
            title='Delete extra columns'
            isMulti={true}
            columns={df.columns.map(col => ({ label: col, value: col }))}
            handleChange={handleDropColumns} />

        </DumbPortal>

        <DumbPortal title='Group'
          handleClick={() => _setActivePortal(PortalTypes.GROUP_BY)}
          showHide={isActivePortal(PortalTypes.GROUP_BY)}
        >
          <GroupTool columns={columns} handleGroupBy={handleGroupBy} />
        </DumbPortal>

        <DumbPortal title='Aggregator'
          handleClick={() => _setActivePortal(PortalTypes.AGGREGATOR)}
          showHide={isActivePortal(PortalTypes.AGGREGATOR)}
        >
          <AggregatorTool columns={columns} handleAggregator={handleAggregator} />
        </DumbPortal>

        <DumbPortal title='Filters'
          handleClick={() => _setActivePortal(PortalTypes.FILTERS)}
          showHide={isActivePortal(PortalTypes.FILTERS)}
        >
          <Filters df={df} handleUpdateClauses={handleWhereClauses} />
        </DumbPortal>

        {!sqlLaunched ? (
          <DumbPortal title='Sequelize'
            handleClick={() => _setActivePortal(PortalTypes.SEQUELIZE)}
            showHide={isActivePortal(PortalTypes.SEQUELIZE)}
          >
            <h4 style={filterHeaderStyle}>Table Name</h4>
            <ConvertToSqlBtn
              classNames={['margin-b-s']}
              handleSqlLaunch={onHandleLaunch} />
            <em style={{ fontWeight: 700, color: '#fff' }}>Recommended: Fix Headers before</em>
          </DumbPortal>
        ) : null}

        <Portal title='Advanced'
          handleClick={onAdvanceCtrl}
        />
      </div>
    </section>
  )

}

export default Toolbar;
