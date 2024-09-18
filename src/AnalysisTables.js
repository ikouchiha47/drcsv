import React, { useEffect, useRef, useState } from 'react';
import { HotTable } from '@handsontable/react';
import Select from 'react-select';

import 'handsontable/dist/handsontable.full.css';
import './Analysis.css';
import './Home.css';


const AggregateColumns = ['sum', 'max', 'min', 'cumsum', 'count'];

function DescriptionTable({ df }) {
  const columns = ['Header', 'Type'];
  const types = Array.zip(df.columns, df.dtypes);

  return (
    <section className='Description'>
      <h3 className='Table-header'>Table Descriptions</h3>
      <HotTable
        colHeaders={columns}
        autoWrapRow={true}
        autoWrapCol={true}
        data={types}
        licenseKey="non-commercial-and-evaluation"
        // stretchH='all'
        height={'auto'}
      />
    </section>
  )
}

const groupData = (df, filters) => {
  if (!filters) return df;
  if (!Object.keys(filters).length) return df;

  let taggedColumns = Object.values(filters).reduce((acc, filter) => {
    if (filter.type === 'group') {
      acc.groups.push(filter)
    } else if (filter.type === 'aggr') {
      acc.aggrs.push(filter)
    }

    return acc;
  }, { groups: [], aggrs: [] })


  const aggrFound = taggedColumns.aggrs.length > 0;
  const selectedColumns = new Set(taggedColumns.groups.map(col => col.column))
  const groupedDf = df.groupby([...selectedColumns]);

  if (!aggrFound) return groupedDf.apply(g => g);

  const aggregators = taggedColumns.aggrs.reduce((acc, data) => {
    let { column, action } = data;

    if (!AggregateColumns.includes(action)) {
      return acc;
    }

    acc[column] = action;
    return acc;
  }, {})


  return groupedDf.agg(aggregators);
};

function GroupingTable({ df, filters }) {
  if (!Object.keys(filters).length) return;

  const groupedDf = groupData(df.copy(), filters);

  return (
    <div>
      <h3 className='Table-header'>Grouped Data</h3>
      <HotTable
        data={groupedDf.values}
        colHeaders={groupedDf.columns}
        rowHeaders={true}
        height={'auto'}
        stretchH="all"
        licenseKey="non-commercial-and-evaluation"
        hiddenColumns={{ columns: [groupedDf.columns.findIndex(col => col === 'id')] }}
      />
    </div>
  );
}

function GroupSelector({ df, onSelect, onApplyFilters, filterOn }) {
  const groupColumns = df.columns.map(col => ({ value: col, label: col }));
  const aggrColumns = df.columns.map(col => ({ value: col, label: col }));
  const actions = AggregateColumns.map(aggr => ({ value: aggr, label: aggr }))

  const columnRef = useRef(null);
  const aggrRef = useRef(null);
  const actionRef = useRef(null);

  const cleanUpInput = (withGrouper = false) => {
    withGrouper && columnRef && columnRef.current.setValue(null);
    aggrRef && aggrRef.current.setValue(null)
    actionRef && actionRef.current.setValue(null)
  }

  const handleSelect = (e) => {
    e.preventDefault()

    let columnValue = columnRef.current.getValue()[0];
    let aggrValue = aggrRef.current.getValue()[0];
    let actionValue = actionRef.current.getValue()[0];

    if (!columnValue) return;
    if (aggrValue && !actionValue) return

    let res = { [columnValue.value]: { type: 'group', column: columnValue.value } }
    if (aggrValue && actionValue) {
      res = {
        ...res,
        [aggrValue.value]: { type: 'aggr', column: aggrValue.value, action: actionValue.value }
      }
    }

    onSelect(res)
    cleanUpInput()
  }

  useEffect(() => {
    if (!filterOn) cleanUpInput(true);

  }, [filterOn])

  return (
    <div className='flex flex-row' style={{ gap: '16px', marginBottom: '16px', alignItems: 'flex-end' }}>
      <h3>Group By</h3>
      <Select
        isClearable
        defaultValue={null}
        ref={columnRef}
        options={groupColumns}
        hideSelectedOptions={true}
        placeholder="Group By"
        styles={{ menu: base => ({ ...base, zIndex: 999 }) }}
      />
      <h3>Aggregate By</h3>
      <Select
        isClearable
        ref={aggrRef}
        defaultValue={null}
        options={aggrColumns}
        hideSelectedOptions={true}
        placeholder="Aggregate By"
        styles={{ menu: base => ({ ...base, zIndex: 999 }) }}
      />
      <h3>Aggregator</h3>
      <Select
        isClearable
        ref={actionRef}
        defaultValue={null}
        options={actions}
        hideSelectedOptions={true}
        placeholder="Aggregate By"
        styles={{ menu: base => ({ ...base, zIndex: 999 }) }}
      />
      <button className='Button-blue' onClick={handleSelect}>Add</button>

      <button onClick={onApplyFilters} className='Button-blue'>{filterOn ? 'Clear' : 'Apply'}</button>
    </div>
  );
}

function GroupFilters({ filters, removeFilter }) {
  let fss = Object.values(filters)
  if (!fss.length) return;

  return (
    <ul className='Groupings'>
      {fss.map(((filter, idx) => {
        return (
          <li
            key={idx + 1}
            className='flex flex-row'
            style={{ gap: '8px' }}
            onClick={() => removeFilter(filter)}
          >
            <p>{filter.type}: {[filter.column, filter.action].filter(f => f).join('.')}</p>
            <span>x</span>
          </li>
        )
      }))}
    </ul>
  )
}

function AnalysisTables({ df, fileName }) {
  const [filters, setFilters] = useState({});
  const [filterOn, toggleFilter] = useState(false);

  const handleSelect = (option) => {
    setFilters({ ...filters, ...option })
  }

  const handleRemoveFilter = (filter) => {
    let _filters = filters;
    delete (_filters[filter.column])

    setFilters({ ..._filters })
  }

  const applyFilters = (e) => {
    e.preventDefault();

    if (Object.keys(filters).length == 0) return;

    if (filterOn) {
      setFilters({})
    }

    toggleFilter(!filterOn)
  }

  if (!df) return;

  return (
    <section className='Analysis'>
      <DescriptionTable df={df} />

      <section className='Operations'>
        <h3 className='Table-header'>Aggregations</h3>
        <section className='Grouping-container'>
          <GroupSelector df={df} onSelect={handleSelect} onApplyFilters={applyFilters} filterOn={filterOn} />
          <GroupFilters filters={filters} removeFilter={handleRemoveFilter} />
        </section>
      </section>

      {filterOn && <GroupingTable df={df} filters={filters} />}
    </section>
  )
}

export default AnalysisTables;
