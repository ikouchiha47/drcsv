import React, { useState, useEffect } from 'react';

import { ScrollableDataTable } from './DataTable';
import Notifier from '../utils/notifications';

import { DuckDB } from '../utils/dbs';
import { toDF } from '../utils/batcher';

import 'handsontable/dist/handsontable.full.css';
import '../Home.css';
import '../SQLComponent.css';

import { SqlLoaderStates } from '../utils/constants';


const duckdb = new DuckDB();

const notifier = new Notifier();
// await notifier.init();

const DuckArena = ({ df, file, tableName, launched, handleSqlState }) => {
  const [query, setQuery] = useState('');

  const [data, setData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [errors, setErrors] = useState([]);

  let initalDbStatus = { status: SqlLoaderStates.LOADING, message: 'Creating Database' }
  const [dataLoadStatus, setDataLoaded] = useState(initalDbStatus)

  useEffect(() => {
    if (!launched) return;

    setDataLoaded({ status: SqlLoaderStates.SEEDING, message: 'Importing Data' });

    const handleSetup = async () => {
      try {
        console.log("handling");

        await notifier.init();
        await duckdb.init();
        console.log("loading csv");

        let totalRows = await duckdb.loadCSV(tableName, file, df);

        setDataLoaded({ status: SqlLoaderStates.SUCCESS, message: `Imported ${totalRows} records` });
        handleSqlState({ status: SqlLoaderStates.SUCCESS, table: tableName })
      } catch (e) {
        console.log(e)
        setDataLoaded({ status: SqlLoaderStates.FAILED, message: `Failed to import data ${e.message}` });
        handleSqlState({ status: SqlLoaderStates.FAILED, table: tableName })
      }
    }

    handleSetup()

  }, [launched, df, file, tableName, handleSqlState])


  const handleQueryExecution = async () => {
    if (!query) return;

    try {
      let results = await duckdb.exec(query);
      console.log("results", results);

      if (results.columns && results.values) {
        setColumns(results.columns)
        setData(results.values)
      }
    } catch (err) {
      setErrors([err])
      setColumns([])
      setData([])
    }
  }


  const render = () => {
    if (dataLoadStatus.status === SqlLoaderStates.FAILED) {
      return <p className='error'>{dataLoadStatus.message}</p>
    }

    if (dataLoadStatus.status === SqlLoaderStates.SUCCESS) {
      return (
        <section className='query-editor margin-b-xl' style={{ flex: 1 }}>
          <textarea
            className='query-playground'
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`SELECT * FROM ${tableName}`}
          />
          <button className='Button Btn-green' onClick={handleQueryExecution}>Run Query</button>
        </section>
      )
    }

    return null;
  }

  const renderErrors = (errors) => {
    if (!errors.length) return null;

    return (
      <ul className='Table-errors'>
        {errors.map((err, idx) => {
          return <li key={`table-errors-${idx}`}>{err}</li>
        })}
      </ul>
    )
  }

  const renderStatus = (response, errors) => {
    // console.log(response.status, "response status")

    if (response.status === SqlLoaderStates.FAILED) return null;
    if (response.status === SqlLoaderStates.SUCCESS) return null;
    if (errors.length) return renderErrors();

    return <p style={{ fontWeight: 600, fontSize: '24px' }}>{response.message}</p>
  }

  if (!df) return null;

  // console.log("sqlarenatrace", dataLoadStatus, data.length)

  return (
    <>
      <hr className='separator' />
      <section className="margin-b-xl">
        {/* Query Textarea */}
        <div className='editor-wrapper flex flex-row margin-b-m'>
          {render()}
        </div>
        {/* Results Table */}
        {renderStatus(dataLoadStatus, errors)}
        {data.length > 0 ? (
          <>
            <h3 className='Table-header'>Results</h3>
            <ScrollableDataTable df={toDF(columns, data)} classNames={['query-result']} />
          </>
        ) : null}

      </section>
    </>
  );
};

export default DuckArena;
