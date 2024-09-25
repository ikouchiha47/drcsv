import React, { useEffect, useState } from "react";
import * as dfd from 'danfojs';

import Toolbar from "./Toolbar";
import Preview from "./Preview";
import { SqlLoaderStates } from "./SqlLauncher";
import SqlArena from "./SqlArena";
import GroupFilters from "./Grouping";

import '../stylesheets/Toolbar.css';
import AdvancedCtrl from "./AdvancedCtrls";
import { TableInfo } from "./TableDescription";
import SideDeck from "./SideDeck";
import { ActionError } from "./Errors";

async function loadData(file, options) {
  const df = await dfd.readCSV(file, options);
  const id = Array.from({ length: df.shape[0] }, (_, i) => i);

  return df.
    addColumn('id', id).
    rename(df.columns.reduce((acc, col) => ({ ...acc, [col]: col.trim() }), {}))
}

const Filter = {
  type: null,
  column: null,
  action: null,
}

const hasUnmatchedColumns = (err) => {
  return err && err.includes('DtypeError') && err.includes('array of length')
}

const toFilterKey = (filter) => {
  return [filter.type, filter.column, filter.action].filter(v => v).join('_')
}

const WorkSpace = ({ files, file, handleSelectFile }) => {
  const [df, setDf] = useState(null);
  const [origDf, setOrigDf] = useState(null);

  const [sqlState, setSqlState] = useState({ state: null, table: null });

  const [filters, setFilters] = useState([]);
  const [uniqueFilters, setUniqueFilters] = useState(new Set())
  const [showAdvCtrl, toggleAdvCtrl] = useState(false)
  const [errors, setErrors] = useState([])

  useEffect(() => {
    const loadAndSet = async (_file) => {
      let dframe = await loadData(_file)

      window._df = dframe;

      setDf(dframe);
      setOrigDf(dframe);
    }

    loadAndSet(file)

    return () => {
      setDf(null)
      setOrigDf(null)
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

  const handleFilter = () => { }

  const handleClear = (filter) => {
    if (filter === "all") {
      setUniqueFilters(new Set())
      setFilters([])
      return
    }

    if (typeof filter !== "object") return;

    const key = toFilterKey(filter);
    const updatedFilters = filters.filter(f => toFilterKey(f) != key)

    let newSet = new Set(uniqueFilters)
    newSet.delete(key)

    setUniqueFilters(newSet)
    setFilters(updatedFilters);
  }

  const handleSqlLaunch = (launchData) => {
    if (!launchData) return;
    if (!launchData.table) return;

    setSqlState(launchData);
  }

  const handleDataClean = (_, _prev, next) => {
    if (!next) {
      origDf && setDf(origDf)
      return;
    }

    try {
      setDf(df.dropNa())
    } catch (e) {
      setErrors(errors.concat({ action: 'dropNa', error: e.message }))
    }
  }

  const showAdvancedControls = (_, prev, next) => {
    toggleAdvCtrl(next)
  }

  const renderWithSql = () => {
    if (sqlState.state === null) return;

    return (
      <>
        <div className='Table-info'>
          <p>Table Name: <b>{sqlState.table}</b></p>
          <button type="button" onClick={() => { setSqlState({ state: null, table: sqlState.table }) }}>Switch Back</button>
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
    return (
      <Preview df={df} fileName={file.name} filters={filters} />
    );
  }

  const sanitizeData = async (event) => {
    if (!event) return;

    let { action, isOn } = event;

    if (action === 'remove_header') {
      if (!isOn) return setDf(origDf);

      let dframe = await loadData(file, { header: false })
      setDf(dframe);

      return
    }

    if (action === 'update_df_values') {
      if (!(isOn && event.data)) return setDf(origDf);

      setDf(event.data)

      return
    }

    if (action === 'update_df_types') {
      if (!(isOn && event.data)) return setDf(origDf);

      let types = event.data;
      let newDf = df.dropNa();

      Object.entries(types).forEach(([col, typ]) => {
        newDf = newDf.asType(col, typ)
      })

      // console.log("old", df.dtypes, "new", newDf.dtypes)
      setDf(newDf);
    }

  }

  return (
    <>
      <SideDeck
        df={df}
        files={files}
        currentFile={file}
        handleSelectFile={handleSelectFile}
      />
      <section className="workspace" style={{ minWidth: '84%' }}>
        {sqlState.state !== SqlLoaderStates.SUCCESS ? (<Toolbar
          df={df}
          handleGroupBy={handleGroupBy}
          handleAggregator={handleAggregator}
          handleFilter={handleFilter}
          handleClear={handleClear}
          handleSqlLaunch={handleSqlLaunch}
          handleDataClean={handleDataClean}
          handleAdvancedControls={showAdvancedControls}
          sqlLaunched={sqlState.state === SqlLoaderStates.SUCCESS}
        />) : null}

        {filters.length ? <GroupFilters filters={filters} removeFilter={handleClear} /> : null}

        {showAdvCtrl ? <AdvancedCtrl df={df} handleSanitizer={sanitizeData} /> : null}
        <ActionError errors={errors} />
        <hr className="separator" />
        {df && <TableInfo df={df} />}
        <hr className="separator" />
        {sqlState.state !== SqlLoaderStates.SUCCESS ? renderWithoutSql() : null}
        {sqlState.state !== SqlLoaderStates.FAILED ? renderWithSql() : null}
      </section>
    </>
  );
}

export default WorkSpace;
