import React, { useEffect, useRef, useState } from 'react';
import { HotTable } from '@handsontable/react';
import Select from 'react-select';

import 'handsontable/dist/handsontable.full.css';
import './Analysis.css';
import './Home.css';


const AggregateColumns = ['sum', 'max', 'min', 'cumsum', 'count'].sort();

function DescriptionTable({ df }) {
  const columns = ['Header', 'Type'];
  const types = Array.zip(df.columns, df.dtypes);

  return (
    <section className='Description Table-container'>
      <h3 className='Table-header'>Table Descriptions</h3>
      <HotTable
        colHeaders={columns}
        autoWrapRow={true}
        autoWrapCol={true}
        data={types}
        licenseKey="non-commercial-and-evaluation"
        // stretchH='all'
        columnSorting={true}
        height={'auto'}
      />
    </section>
  )
}

const groupData = (df, filters) => {
  if (!filters) return df;
  if (!filters.length) return df;

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

  console.log("queries", taggedColumns)

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

function GroupingTable({ df }) {
  return (
    <div className='Table-container'>
      <h3 className='Table-header'>Grouped Data</h3>
      <HotTable
        data={df.values}
        colHeaders={df.columns}
        rowHeaders={true}
        height={'auto'}
        stretchH="all"
        columnSorting={true}
        licenseKey="non-commercial-and-evaluation"
        hiddenColumns={{ columns: [df.columns.findIndex(col => col === 'id')] }}
      />
    </div>
  );
}

function GroupSelector({ columns, onSelect, onClear }) {
  const groupColumns = columns.map(col => ({ value: col, label: col }));
  const aggrColumns = columns.map(col => ({ value: col, label: col }));
  const actions = AggregateColumns.map(aggr => ({ value: aggr, label: aggr }))

  const columnRef = useRef(null);
  const aggrRef = useRef(null);
  const actionRef = useRef(null);

  useEffect(() => {
    let columnCurrent = columnRef.current;
    let aggrCurrent = aggrRef.current;
    let actionCurrent = actionRef.current;

    return () => {
      console.log("unmount selector")
      [columnCurrent, aggrCurrent, actionCurrent].forEach(curr => curr && curr.setValue(null))
    }

  }, [columns, columnRef, aggrRef, actionRef]) // when columns change, relaod


  const handleSelect = (e) => {
    e.preventDefault()

    let columnValue = columnRef.current.getValue()[0];
    let aggrValue = aggrRef.current.getValue()[0];
    let actionValue = actionRef.current.getValue()[0];

    let res = []
    if (columnValue) {
      res.push({ type: 'group', column: columnValue.value })
    }

    if (aggrValue && actionValue) {
      res.push({ type: 'aggr', column: aggrValue.value, action: actionValue.value })
    }

    onSelect(res)
  }

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
      <button className='Button-blue' onClick={handleSelect}>Apply</button>
      <button onClick={onClear} className='Button-blue'>Clear</button>
    </div>
  );
}

function GroupFilters({ filters, removeFilter }) {
  if (!filters.length) return;

  return (
    <ul className='Groupings'>
      {filters.map((filter, idx) => {
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
      })}
    </ul>
  )
}

function AnalysisTables({ df, fileName }) {
  const [filters, setFilters] = useState([]);
  const [uniqueFilters, setUniqueFilters] = useState(new Set())
  const [groupedDf, setGroupedDf] = useState(df);

  const toFilterKey = (filter) => {
    return [filter.column, filter.type, filter.action].filter(d => d).join('_')
  }

  const handleSelect = (options) => {
    let filteredOptions = options.filter(option => !uniqueFilters.has(toFilterKey(option)))

    let newFilterKeys = new Set(options.map(option => {
      return option && toFilterKey(option)
    }))

    newFilterKeys = newFilterKeys.union(uniqueFilters)
    filteredOptions = filteredOptions.concat(filters)

    setUniqueFilters(newFilterKeys)
    setFilters(filteredOptions)
    setGroupedDf(groupData(df, filteredOptions))
  };

  const handleRemoveFilter = (filter) => {
    let cleanedFilters = filters.filter(f => !(f.type === filter.type && f.column === filter.column))

    setFilters(cleanedFilters)
    setUniqueFilters(new Set(cleanedFilters.map(f => f && toFilterKey(f))))
    setGroupedDf(groupData(df, cleanedFilters))
  };

  const handleClearFilters = () => {
    // console.log("clearing", filters.length)

    if (!filters.length) return

    setGroupedDf(groupData(df, []))
    setFilters([])
    setUniqueFilters(new Set());
  };

  useEffect(() => {
    console.log("clearing effect")

    setGroupedDf(groupData(df, []))
    setFilters([])
    setUniqueFilters(new Set());

  }, [df]);

  return (
    <section className='Analysis'>
      <DescriptionTable df={df} />

      <section className='Operations'>
        <h3 className='Table-header'>Aggregations</h3>
        <section className='Grouping-container'>
          <GroupSelector columns={df.columns} onSelect={handleSelect} onClear={handleClearFilters} />
          <GroupFilters filters={filters} removeFilter={handleRemoveFilter} />
        </section>
      </section>

      {filters.length ? <GroupingTable df={groupedDf} /> : null}
    </section>
  )
}

export default AnalysisTables;
