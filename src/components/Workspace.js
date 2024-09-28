import React, { useEffect, useState } from "react";
import * as dfd from 'danfojs';
import * as Papa from 'papaparse';

import Toolbar from "./Toolbar";
import Preview from "./Preview";
import { SqlLoaderStates } from "../utils/constants";
import SqlArena from "./SqlArena";
import DuckArena from "./DuckArena";
import GroupFilters from "./Grouping";

import AdvancedCtrl from "./AdvancedCtrls";
import { TableInfo } from "./TableDescription";
import SideDeck from "./SideDeck";
import { ActionError } from "./Errors";
import CSVAnalyzer from "./Analyzer";

import '../stylesheets/Toolbar.css';
import { sanitizeHeader } from "../utils/dbs";

async function load(file, delimiter, signal, preview) {
  preview ||= 0;

  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      worker: preview === 0,
      header: true,
      skipEmptyLines: true,
      preview: preview,
      delimiter: delimiter,
      complete: function(results, _file) {
        let isAborted = signal && signal.signal.aborted;

        if (isAborted) {
          console.log('cancelled for', _file && file._name);
          return
        };

        if (!results) {
          reject(new Error('EmptyResults'))
          return;
        }

        let df = new dfd.DataFrame(results.data)
        resolve(df);
      },
      error: function(err) {
        if (signal && signal.signal.aborted) {
          console.error('load', err, 'aborted')
          return;
        }

        reject(err);
      }
    })
  })
}

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

const toFilterKey = (filter) => {
  return [filter.type, filter.column, filter.action].filter(v => v).join('_')
}

const initialSqlState = { status: null, table: null };

const WorkSpace = ({ files, file, handleSelectFile, handleRemoveFile }) => {
  const [df, setDf] = useState(null);
  const [origDf, setOrigDf] = useState(null);

  const [loadPreview, setPreviewLoaded] = useState(false);
  const [loadFull, setLoadedFull] = useState(false);

  const [sqlState, setSqlState] = useState({ ...initialSqlState });

  const [filters, setFilters] = useState([]);
  const [uniqueFilters, setUniqueFilters] = useState(new Set())
  const [showAdvCtrl, toggleAdvCtrl] = useState(false)
  const [errors, setErrors] = useState([])

  const [defaultValues, setDefaultValues] = useState({})
  const [opsHistory, setOpsHistory] = useState([]);

  const [delimiter, setDelimiter] = useState(',');
  const [doAnalyse, toggleAnalyse] = useState(false);

  useEffect(() => {
    if (!file) return;

    const abortCtrl = new AbortController();

    const loadPreview = async (_file) => {
      console.log("initial load", _file.name);
      try {
        let dframe = await load(_file, delimiter, abortCtrl, 1000);

        window._df = dframe;

        setDf(dframe)
        setOrigDf(dframe)
        setPreviewLoaded(true);

      } catch (err) {
        console.error(err);
        console.log(`Something went wrong, Please reload the page and lose your work. Because, ${err.message}`)
      }
    }

    loadPreview(file);

    return () => {
      console.log("unmount");

      if (abortCtrl) {
        console.log("aborting", file && file.name, "file");
        abortCtrl.abort();
      }

      setDf(null)
      setOrigDf(null)
      setFilters([])
      setUniqueFilters(new Set())
      setSqlState({ ...initialSqlState })
      toggleAnalyse(false)
      setDelimiter(',')
      setOpsHistory([]);
    }

  }, [file, delimiter]);

  useEffect(() => {
    if (!file) return;
    if (!loadPreview) return;

    const abortCtrl = new AbortController();

    const loadRest = async (_file) => {
      if (!loadPreview) return;
      if (!df) return;

      const size = df.size;

      console.log("getting rest", _file.name)
      try {
        let dframe = await load(_file, delimiter, abortCtrl);
        console.log("got rest", _file.name)

        setLoadedFull(true)

        if (size === dframe.size) {
          // no more data was loaded, skip state update
          return;
        }

        window._df = dframe;

        setDf(dframe)
        setOrigDf(dframe);

        //TODO: apply the opsHistory till now

      } catch (err) {
        console.error(`Load rest failed`)

        alert(`Something went wrong, If you have more than 1000 records, you are seeing partial data. Because, ${err.message}`)
      }
    }

    console.log("preview changed", loadPreview)
    loadRest(file);

    return () => {
      console.log("unmount rest");

      if (abortCtrl) {
        console.log("more aborting", file && file.name, "ffile")
        abortCtrl.abort()
      }

      setPreviewLoaded(false);
      setLoadedFull(false);
    }

  }, [loadPreview, df, file, delimiter])

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

    setOpsHistory(opsHistory.concat(
      {
        op: 'update::filter', data: {
          type: 'group',
          filterIdx: [key],
          filter: [filter],
        }
      }
    ))
  }

  const handleAggregator = (aggrBy, aggrFn) => {
    if (!(aggrBy && aggrFn)) return;

    const filter = { ...Filter, type: 'aggr', column: aggrBy, action: aggrFn };
    const key = toFilterKey(filter);

    if (uniqueFilters.has(key)) return;

    setUniqueFilters((new Set([key])).union(uniqueFilters))
    setFilters(filters.concat(filter))

    setOpsHistory(opsHistory.concat(
      {
        op: 'update::filter', data: {
          type: 'aggr',
          filterIdx: [key],
          filter: [filter],
        }
      }
    ))
  }


  // const hasColumnsChanged = () => {
  //   return ((new Set(origDf.columns)).difference(new Set(df.columns))).size > 0
  // }

  const handleFixHeaders = (_, _prev, next) => {
    console.log("next", next);

    let renamed = null;

    if (next) {
      renamed = df.columns.reduce((acc, col) => {
        acc[col] = sanitizeHeader(col);
        return acc;
      }, {})
    } else {
      renamed = origDf.columns.reduce((acc, col) => {
        acc[sanitizeHeader(col)] = col;
        return acc;
      }, {})
    }

    if (!renamed) return;

    let newDf = df.rename(renamed)
    setDf(newDf)

    setOpsHistory(opsHistory.concat(
      {
        op: 'fix::headers', data: {
          columns: renamed,
        }
      }
    ))
  }

  const handleClear = (filter) => {
    if (typeof filter !== "object" || typeof filter !== "string") return;

    setOpsHistory(opsHistory.concat(
      { op: 'clear::filter', data: { filter } }
    ))

    if (filter === "all") {
      setUniqueFilters(new Set())
      setFilters([])

      return
    }

    const key = toFilterKey(filter);
    const updatedFilters = filters.filter(f => toFilterKey(f) !== key)

    let newSet = new Set(uniqueFilters)
    newSet.delete(key)

    setUniqueFilters(newSet)
    setFilters(updatedFilters);

    setOpsHistory(opsHistory.concat(
      {
        op: 'delete::filter', data: {
          filterIdx: [key],
          filter: filter,
        }
      }
    ))
  }

  const handleSqlLaunch = (launchData) => {
    if (!launchData) return;
    if (!launchData.table) return;

    setSqlState(launchData);
    setOpsHistory(opsHistory.concat(
      { op: 'action::sqllaunch', data: { table: launchData.table } }
    ))
  }

  // For reseting cleaned data
  // skip for operations:
  // - updated types
  // - updated values
  const handleDataClean = (_, _prev, next) => {
    if (!next) {
      // for now handle manually
      // later check from ops history
      let prevTypes = new Set(origDf.dtypes);
      let newTypes = new Set(df.dtypes);

      if (newTypes.difference(prevTypes).size === 0) {
        origDf && setDf(origDf)
        return;
      }

      // otherwise, apply the operations on original df
      // in this case, its only type update.
      // we need to explicitly handle null values
      // for numbers its NaN
      // but for string, its still null, so it will
      // error out, converting null to string.
      let newDf = origDf;

      Array.zip(df.columns, df.dtypes).forEach(([col, typ]) => {
        try {
          let d = newDf.asType(col, typ)
          newDf = d;
        } catch (e) {
          console.error(`${col} has null values, and cannot converted back to ${typ}`)
        }
      })

      setDf(newDf);
      return;
    }

    try {
      setDf(df.dropNa())
      setOpsHistory(opsHistory.concat({
        op: 'action::cleandata',
      }))
    } catch (e) {
      setErrors(errors.concat({ action: 'dropNa', error: e.message }))
    }
  }

  const showAdvancedControls = (_, _prev, next) => {
    toggleAdvCtrl(next)
  }

  const handleDelimiterChange = async (_delimiter) => {
    if (_delimiter === delimiter) return;

    try {
      let dframe = await loadData(file, { delimiter: _delimiter });

      setDelimiter(_delimiter)
      setDf(dframe)
      setOrigDf(dframe)
      setOpsHistory(opsHistory.concat({
        op: 'delimiter', data: { delimiter: _delimiter }
      }))
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
    setOpsHistory(opsHistory.concat({
      op: 'where::clause', data: { filter }
    }))
  }

  const handleAnalyseData = (_, _prev, next) => {
    toggleAnalyse(next)
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

        <SqlArena
          df={df}
          file={file}
          tableName={sqlState.table}
          launched={sqlState.state}
          handleSqlState={handleSqlLaunch}
        />
        {/*<DuckArena
          df={df}
          file={file}
          tableName={sqlState.table}
          launched={sqlState.state}
          handleSqlState={handleSqlLaunch}
        />*/}
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
      <>
        <Preview df={df} fileName={file.name} filters={filters} loadedFull={loadFull} loadedPreview={loadPreview} />
        {doAnalyse ? <CSVAnalyzer df={df} show={doAnalyse} delimiter={delimiter} /> : null}
      </>
    );
  }

  const sanitizeData = async (event) => {
    if (!event) return;

    let { action, isOn } = event;

    setOpsHistory(opsHistory.concat({
      op: "sanitize", data: event
    }))

    if (action === 'remove_header') {
      if (!isOn) return setDf(origDf);

      let dframe = await loadData(file, { header: false })
      setDf(dframe);

      return
    }

    if (action === 'update_df_values') {
      if (!(isOn && event.data)) return setDf(origDf);

      const { df, defaults } = event.data;

      if (df && defaults) {
        setDf(df)
        setDefaultValues(defaults)
      }

      return
    }

    if (action === 'update_df_types') {
      console.log(isOn, event);

      if (!(isOn && event.data)) return setDf(origDf);

      let types = event.data;
      let newDf = df;

      Object.entries(types).forEach(([col, typ]) => {
        newDf = newDf.asType(col, typ)
      })

      // newDf.dropNa()
      setDf(newDf);
    }
  }

  const handleReset = (_, _prev, next) => {
    if (!next) return;

    setDf(origDf);
    setOpsHistory(opsHistory.concat({
      op: 'reset',
    }))
  }

  const handleDropColumns = (columns) => {
    if (!columns) return;
    if (!columns.length) return;

    let dropCols = Array.from((new Set(columns)).intersection(new Set(df.columns)))
    if (!dropCols.length) return;

    let newDf = df.drop({ columns: dropCols });

    setOpsHistory(opsHistory.concat({
      op: 'drop::column',
      data: { columns },
    }))
    setDf(newDf);
  }

  if (!df) return null;
  // console.log("sqltrace", sqlState);

  return (
    <>
      <SideDeck
        df={df}
        files={files}
        currentFile={file}
        handleSelectFile={handleSelectFile}
        handleRemoveFile={handleRemoveFile}
      />
      <section className="workspace" style={{ minWidth: '84%' }}>
        {sqlState.state !== SqlLoaderStates.SUCCESS ? (
          <Toolbar
            df={df}
            handleGroupBy={handleGroupBy}
            handleAggregator={handleAggregator}
            handleClear={handleClear}
            handleSqlLaunch={handleSqlLaunch}
            handleDataClean={handleDataClean}
            handleAdvancedControls={showAdvancedControls}
            handleDelimiterChange={handleDelimiterChange}
            handleWhereClauses={handleWhereClauses}
            handleFixHeaders={handleFixHeaders}
            handleAnalyseData={handleAnalyseData}
            handleDropColumns={handleDropColumns}
            handleReset={handleReset}
            sqlLaunched={sqlState.status === SqlLoaderStates.SUCCESS}
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

        {showAdvCtrl ? <AdvancedCtrl df={df} defaults={defaultValues} handleSanitizer={sanitizeData} /> : null}
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
