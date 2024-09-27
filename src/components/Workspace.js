import React, { useEffect, useState } from "react";
import * as dfd from 'danfojs';

import Toolbar from "./Toolbar";
import Preview from "./Preview";
import { SqlLoaderStates } from "../utils/constants";
// import SqlArena from "./SqlArena";
import DuckArena from "./DuckArena";
import GroupFilters from "./Grouping";

import '../stylesheets/Toolbar.css';
import AdvancedCtrl from "./AdvancedCtrls";
import { TableInfo } from "./TableDescription";
import SideDeck from "./SideDeck";
import { ActionError } from "./Errors";
import { sanitizeHeader } from "../utils/dbs";

async function loadData(file, options) {
  const df = await dfd.readCSV(file, options);
  // const id = Array.from({ length: df.shape[0] }, (_, i) => i);

  // return df.
  // addColumn('id', id).
  return df.rename(df.columns.reduce((acc, col) => ({ ...acc, [col]: col.trim() }), {}))
}

const Filter = {
  type: null,
  column: null,
  action: null,
  clause: null,
}

// const hasUnmatchedColumns = (err) => {
//   return err && err.includes('DtypeError') && err.includes('array of length')
// }

const toFilterKey = (filter) => {
  return [filter.type, filter.column, filter.action].filter(v => v).join('_')
}

const WorkSpace = ({ files, file, handleSelectFile }) => {
  const [df, setDf] = useState(null);
  const [origDf, setOrigDf] = useState(null);

  const [sqlState, setSqlState] = useState({ status: null, table: null });

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

  const handleFixHeaders = () => {
    let renamed = df.columns.reduce((acc, col) => {
      acc[col] = sanitizeHeader(col)
      return acc;
    }, {})

    let newDf = df.rename(renamed)
    setDf(newDf)
  }

  const handleClear = (filter) => {
    if (filter === "all") {
      setUniqueFilters(new Set())
      setFilters([])
      return
    }

    if (typeof filter !== "object") return;

    const key = toFilterKey(filter);
    const updatedFilters = filters.filter(f => toFilterKey(f) !== key)

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

  const handleDelimiterChange = async (delimiter) => {
    try {
      let dframe = await loadData(file, { delimiter: delimiter })
      setDf(dframe)
      setOrigDf(dframe)
    } catch (e) {
      console.error("delimiter change failed", e)
    }
  }

  // [ { type: 'filter', action: 'gt/lt', column: '', clause: <T>} ]
  const handleWhereClauses = ({ column, action, clause }) => {
    const filter = {
      ...Filter,
      type: 'filter',
      column: column,
      action: action,
      clause: clause,
    };
    const key = toFilterKey(filter);

    if (uniqueFilters.has(key)) return;

    setUniqueFilters((new Set([key])).union(uniqueFilters))
    setFilters(filters.concat(filter))
  }

  const renderWithSql = () => {
    if (sqlState.status === null) return null;

    let shouldHide = [SqlLoaderStates.FAILED, SqlLoaderStates.LOADING].includes(sqlState.status);
    if (shouldHide) return null;

    return (
      <>
        <header className='Table-name-header'>
          <p style={{ fontSize: '28px' }}>Table: <b>{sqlState.table}</b></p>
          <button type="button"
            className="Button Btn-yellow"
            onClick={() => { setSqlState({ status: null, table: sqlState.table }) }}
          >
            Switch Back
          </button>
        </header>

        {/*<SqlArena
          df={df}
          tableName={sqlState.table}
          launched={sqlState.state}
          handleSqlState={handleSqlLaunch}
        />*/}
        <DuckArena
          df={df}
          file={file}
          tableName={sqlState.table}
          launched={sqlState.state}
          handleSqlState={handleSqlLaunch}
        />
      </>
    )
  }

  const renderWithoutSql = () => {
    let shouldRender = [
      SqlLoaderStates.LOADING,
      SqlLoaderStates.FAILED
    ].includes(sqlState.status);

    if (sqlState.status === null) {
      shouldRender = true
    }

    if (!shouldRender) return null;

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

      setDf(newDf);
    }
  }

  // console.log("sqltrace", sqlState);

  return (
    <>
      <SideDeck
        df={df}
        files={files}
        currentFile={file}
        handleSelectFile={handleSelectFile}
      />
      <section className="workspace" style={{ minWidth: '84%' }}>
        {sqlState.state !== SqlLoaderStates.SUCCESS ? (
          <Toolbar
            df={df}
            handleGroupBy={handleGroupBy}
            handleAggregator={handleAggregator}
            handleFilter={handleFilter}
            handleClear={handleClear}
            handleSqlLaunch={handleSqlLaunch}
            handleDataClean={handleDataClean}
            handleAdvancedControls={showAdvancedControls}
            handleDelimiterChange={handleDelimiterChange}
            handleWhereClauses={handleWhereClauses}
            handleFixHeaders={handleFixHeaders}
            sqlLaunched={sqlState.state === SqlLoaderStates.SUCCESS}
          />) : null}

        {filters.length ? <GroupFilters filters={filters} removeFilter={handleClear} /> : null}
        {filters.length ? (
          <button
            type="button"
            className="Button Btn-blue"
            style={{ marginBottom: '16px' }}
            onClick={() => handleClear('all')}
          >
            Clear All
          </button>
        ) : null}

        {showAdvCtrl ? <AdvancedCtrl df={df} handleSanitizer={sanitizeData} /> : null}
        <ActionError errors={errors} />

        <hr className="separator" />
        {df && <TableInfo df={df} />}
        <hr className="separator" />

        {renderWithoutSql()}
        {renderWithSql()}
      </section>
    </>
  );
}

export default WorkSpace;
