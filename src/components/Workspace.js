import React, { useEffect, useState } from "react";
import * as dfd from 'danfojs';

import Toolbar from "./Toolbar";
import Preview from "./Preview";
import { SqlLoaderStates } from "../utils/constants";
import SqlArena from "./SqlArena";
import DuckArena from "./DuckArena";
import GroupFilters from "./Grouping";

import '../stylesheets/Toolbar.css';
import AdvancedCtrl from "./AdvancedCtrls";
import { TableInfo } from "./TableDescription";
import SideDeck from "./SideDeck";
import { ActionError } from "./Errors";
import { sanitizeHeader } from "../utils/dbs";
import CSVAnalyzer from "./Analyzer";

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

const initialSqlState = { status: null, table: null };

const WorkSpace = ({ files, file, handleSelectFile }) => {
  const [df, setDf] = useState(null);
  const [origDf, setOrigDf] = useState(null);


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
      setSqlState({ ...initialSqlState })
      toggleAnalyse(false)
      setDelimiter(',')

      setOpsHistory([]);
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

  const handleFilter = () => { }

  const hasColumnsChanged = () => {
    return ((new Set(origDf.columns)).difference(new Set(df.columns))).size > 0
  }

  const handleFixHeaders = (_, _prev, next) => {
    if (!hasColumnsChanged()) return;

    let _df = !next ? origDf : df;

    let renamed = _df.columns.reduce((acc, col) => {
      acc[col] = col;
      return acc;
    }, {})


    let newDf = _df.rename(renamed)
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
    if (filter === "all") {
      setUniqueFilters(new Set())
      setFilters([])

      setOpsHistory(opsHistory.concat(
        { op: 'clear::filter' }
      ))
      return
    }

    if (typeof filter !== "object") return;

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

    // console.log(shouldRender, sqlState, "wsql")

    if (!shouldRender) return null;

    return (
      <>
        <Preview df={df} fileName={file.name} filters={filters} />
        {doAnalyse ? <CSVAnalyzer df={df} show={doAnalyse} delimiter={delimiter} /> : null}
      </>
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
            handleAnalyseData={handleAnalyseData}
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
