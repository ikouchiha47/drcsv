import React, { useEffect, useState } from "react";
import * as dfd from 'danfojs';

import Toolbar from "./Toolbar";
import Preview from "./Preview";
import ConvertToSqlBtn, { SqlLoaderStates } from "./SqlLauncher";
import SqlArena from "./SqlArena";
import GroupFilters from "./Grouping";

import '../stylesheets/Toolbar.css';

async function loadData(file) {
  const df = await dfd.readCSV(file);
  const id = Array.from({ length: df.shape[0] }, (_, i) => i);

  df.addColumn('id', id, { inplace: true })

  return df
}

const Filter = {
  type: null,
  column: null,
  action: null,
}

const toFilterKey = (filter) => {
  return [filter.type, filter.column, filter.action].filter(v => v).join('_')
}

const WorkSpace = ({ file }) => {
  const [df, setDf] = useState(null);
  const [sqlState, setSqlState] = useState({ state: null, table: null });

  const [filters, setFilters] = useState([]);
  const [uniqueFilters, setUniqueFilters] = useState(new Set())

  useEffect(() => {
    const loadAndSet = async (_file) => {
      let dframe = await loadData(_file)
      setDf(dframe);
    }

    loadAndSet(file)

    return () => {
      setDf(null)
      setFilters([])
      setUniqueFilters(new Set())
    }

  }, [file]);

  const handleGroupBy = (event) => {
    // console.log(event, "group by")
    if (!event) return null;

    let column = event.value;
    if (!column) return;

    const filter = { ...Filter, type: 'group', column: column }
    const key = toFilterKey(filter);

    if (uniqueFilters.has(key)) return;

    setUniqueFilters((new Set([key])).union(uniqueFilters))
    setFilters(filters.concat(filter))
  }

  const handleAggregator = (aggrBy, aggrFn) => {
    if (!(aggrBy && aggrFn)) return;

    const filter = { ...Filter, type: 'aggr', column: aggrBy, action: aggrFn };
    const key = toFilterKey(filter);

    if (uniqueFilters.has(key)) return;

    setUniqueFilters((new Set([key])).union(uniqueFilters))
    setFilters(filters.concat(filter))
  }


  const handleFilter = (event) => {
  }

  const handleClear = (filter) => {
    if (filter === "all") {
      setUniqueFilters(new Set())
      setFilters([])
      return
    }

    if (typeof filter !== "object") return;

    const key = toFilterKey(filter);
    let newSet = new Set(uniqueFilters)
    let updatedFilters = filters.filter(f => toFilterKey(f) != key)

    newSet.delete(key)

    setUniqueFilters(newSet)
    setFilters(updatedFilters);
  }

  const handleSqlLaunch = (launchData) => {
    if (!launchData) return;
    if (!launchData.table) return;

    setSqlState(launchData);
  }

  const renderWithSql = () => {
    if (sqlState.state === null) return;

    return (
      <>
        <div className='Table-info'>
          <p>Table Name: <b>{sqlState.table}</b></p>
        </div>

        <SqlArena
          df={df}
          tableName={sqlState.table}
          launched={sqlState.state}
          handleSqlState={handleSqlLaunch}
        />
      </>
    )
  }

  const renderWithoutSql = () => {
    console.log("re-render");
    return (
      <>
        <ConvertToSqlBtn handleSqlLaunch={handleSqlLaunch} />
        <Preview df={df} fileName={file.name} filters={filters} />
      </>
    );
  }

  return (
    <section className="workspace" style={{ minWidth: '84%' }}>
      {sqlState.state !== SqlLoaderStates.SUCCESS ? (<Toolbar
        df={df}
        handleGroupBy={handleGroupBy}
        handleAggregator={handleAggregator}
        handleFilter={handleFilter}
        handleClear={handleClear}
      />) : null}

      {filters.length ? <GroupFilters filters={filters} removeFilter={handleClear} /> : null}

      {sqlState.state !== SqlLoaderStates.SUCCESS ? renderWithoutSql() : null}
      {sqlState.state !== SqlLoaderStates.FAILED ? renderWithSql() : null}
    </section>
  );
}


export default WorkSpace;