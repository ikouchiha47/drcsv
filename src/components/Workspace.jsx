import React, { useEffect, useState } from "react";
import * as dfd from 'danfojs';
import * as Papa from 'papaparse';

import Toolbar from "./Toolbar";
import { SqlLoaderStates } from "../utils/constants";
import GroupFilters from "./Grouping";

import AdvancedCtrl from "./AdvancedCtrls";
import { TableInfo } from "./TableDescription";
import SideDeck from "./SideDeck";
import { ActionError } from "./Errors";

import '../stylesheets/Toolbar.css';
import { sanitizeHeader } from "../utils/dbs";
import { PreviewFrame, SqlFrame } from "./Frames";

window.dfd = dfd;

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

function mapDTypeToJS(dtype, value) {
  switch (dtype) {
    case 'int32':
    case 'int64':
    case 'float32':
    case 'float64':
      return Number(value);
    case 'bool':
    case 'boolean':
      return Boolean(value);
    case 'string':
      return String(value)
    case 'object':
    case 'datetime':
      return Date.parse(value)
    default:
      return JSON.stringify(value);
  }
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

  // const currentFile = useRef(null);

  useEffect(() => {
    if (!file) return;

    const abortCtrl = new AbortController();

    const loadPreview = async (_file) => {
      console.log("initial load", _file.name);

      try {
        let dframe = await load(_file, delimiter, abortCtrl, 1000);

        setDf(dframe)
        setOrigDf(dframe.copy())
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

      // setDf(null)
      // setOrigDf(null)
      // setFilters([])
      // setUniqueFilters(new Set())
      // setSqlState({ ...initialSqlState })
      // toggleAnalyse(false)
      // setDelimiter(',')
      // setOpsHistory([]);
      // toggleAdvCtrl(false);
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
        toggleAdvCtrl(false);

        if (size === dframe.size) {
          // no more data was loaded, skip state update
          console.log("no extra data");
          return;
        }

        setDf(dframe)
        setOrigDf(dframe.copy());

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

      // if (loadPreview) setPreviewLoaded(false);
      // if (loadFull) setLoadedFull(false);
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
    if (typeof filter !== "object" && typeof filter !== "string") return;

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
        origDf && setDf(origDf.copy())
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
    console.log("toggle", _prev, next);

    toggleAdvCtrl(next)
  }

  const handleDelimiterChange = async (_delimiter) => {
    if (_delimiter === delimiter) return;

    try {
      let dframe = await loadData(file, { delimiter: _delimiter });

      setDelimiter(_delimiter)
      setDf(dframe)
      // setOrigDf(dframe.copy())

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

  const shouldRenderWithSql = () => {
    let shouldHide = [
      SqlLoaderStates.FAILED,
      SqlLoaderStates.LOADING
    ].includes(sqlState.status);

    return shouldHide;
  }

  const shouldRenderWithoutSql = () => {
    let shouldRender = [
      SqlLoaderStates.LOADING,
      SqlLoaderStates.FAILED
    ].includes(sqlState.status);

    if (sqlState.status === null) {
      shouldRender = true
    }

    return shouldRender
  }

  const sanitizeData = async (event) => {
    if (!event) return;

    console.log("sanitize data ", event);

    window._df = df;
    window._odf = origDf;

    let { action, isOn } = event;

    setOpsHistory(opsHistory.concat({
      op: "sanitize", data: event
    }))

    if (action === 'remove_header') {
      if (!isOn) return setDf(origDf.copy());

      let dframe = await loadData(file, { header: false })
      setDf(dframe);

      return
    }

    if (action === 'update_df_values') {
      if (!(isOn && event.data)) return setDf(origDf.copy());

      const { defaults } = event.data;
      if (!(df && defaults)) return;

      const dtypeMap = new Map(Array.zip(df.columns, df.dtypes))
      let fillCols = Object.keys(defaultValues);
      let fillValues = Object.keys(defaultValues).map(column => {
        console.log(dtypeMap.get(column), "found", column);

        return mapDTypeToJS(dtypeMap.get(column) || 'string', defaultValues[column]);
      })

      let newDf = df.fillNa(fillValues, { columns: fillCols })
      console.log("new", fillValues, newDf.values)

      setDf(newDf)
      setDefaultValues(defaults)
      // toggleAdvCtrl(false)

      setOpsHistory(opsHistory.concat({
        op: 'apply::defaultvalues',
        data: event.data,
      }))

      return
    }

    if (action === 'update_df_types') {
      console.log(isOn, event);

      if (!(isOn && event.data)) return setDf(origDf.copy());

      let types = event.data;
      let newDf = df;

      Object.entries(types).forEach(([col, typ]) => {
        newDf = newDf.asType(col, typ)
      })

      // newDf.dropNa()
      setDf(newDf);
      return;
    }

    if (action === 'apply_transform') {
      if (!(isOn && event.data)) return setDf(origDf.copy());

      let { column, idx, fn, type, action } = event.data;

      if (action === 'reset') {
        setDf(origDf.copy())
        return;
      }

      let newDf = df.apply((row) => {
        row[idx] = fn(row[idx])
        return row;
      }, { axis: 1 });

      newDf = newDf.asType(column, type)
      setDf(newDf);

      setOpsHistory(opsHistory.concat({
        op: 'apply::transform',
        data: event.data,
      }))
      return
    }
  }

  const handleReset = (_, _prev, next) => {
    if (!next) return;

    setDf(origDf.copy());
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

  if (!(df && origDf)) return null;

  // console.log("history", JSON.stringify(opsHistory, null, 2))
  window._df = df;
  window._odf = origDf;

  // console.log("diff df and odf", df.values[0], origDf.values[0])

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

        <AdvancedCtrl df={df} defaults={defaultValues} handleSanitizer={sanitizeData} show={showAdvCtrl} />
        <ActionError errors={errors} />

        <hr className="separator" />
        {df && <TableInfo df={df} />}
        <hr className="separator" />

        {shouldRenderWithoutSql() ? (
          <PreviewFrame
            df={df}
            fileName={file.name}
            filters={filters}
            delimiter={delimiter}
            isLoadedFull={loadFull}
            isPreview={loadPreview}
            showAnalyzer={doAnalyse}
          />
        ) : null}
        {shouldRenderWithSql() ? (
          <SqlFrame
            df={df}
            file={file}
            sqlState={sqlState}
            handleSqlLaunch={handleSqlLaunch}
            setSqlState={setSqlState}
          />
        ) : null}
        <br />
      </section>
    </>
  );
}

export default WorkSpace;
