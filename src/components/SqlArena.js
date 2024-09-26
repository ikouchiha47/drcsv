import React, { useState, useEffect } from 'react';
import { ScrollableDataTable } from './DataTable';
import * as dfd from 'danfojs';

import Notifier from '../utils/notifications';
import { DBEvents, DuckDB, SQLite } from '../utils/dbs';
import { toDF } from '../utils/batcher';

import 'handsontable/dist/handsontable.full.css';
import '../SQLComponent.css';
import { SqlLoaderStates } from '../utils/constants';
import { DescriptionTable } from './TableDescription';

const worker = new Worker(new URL('../workers/sqlite.worker.js', import.meta.url), { type: "module" });

// const sqlite = new SQLite();
// const duckdb = new DuckDB();

const notifier = new Notifier();
await notifier.init();

const SqlArena = ({ df, tableName, launched, handleSqlState }) => {
  const [query, setQuery] = useState('');

  const [data, setData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [errors, setErrors] = useState([]);

  let initalDbStatus = { status: SqlLoaderStates.LOADING, message: 'Creating Database' }
  const [dataLoadStatus, setDataLoaded] = useState(initalDbStatus)


  useEffect(() => {
    const handleMessage = (e) => {
      // console.log("handling", e)

      const {
        status,
        data,
        errors,
        warns,
      } = e.data;

      if (!tableName || !df) {
        return;
      }

      if (!worker) return;
      ;

      if (warns.length) {
        console.warn(warns.join('\n'))
      }

      if (status === SqlLoaderStates.CREATED) {
        worker.postMessage({ action: DBEvents.SEED, tableName: tableName, df: dfd.toJSON(df, { format: 'row' }) })
        setDataLoaded({ status: SqlLoaderStates.SEEDING, message: 'Importing Data' })

        return;
      }

      if (status === SqlLoaderStates.SEEDED) {
        setDataLoaded({ status: SqlLoaderStates.SUCCESS, message: `Imported ${data} records` })
        notifier.send('Success', `Imported ${data} records to ${tableName}`)
        return
      }

      if (status === SqlLoaderStates.RESULT) {
        setDataLoaded({ status: SqlLoaderStates.SUCCESS, message: '' })

        console.log(data, "result")
        if (!data || (data && !data.length)) {
          setErrors(errors)
          setColumns([])
          setData([])
          return;
        }

        const resultColumns = data[0].columns;
        const resultValues = data[0].values;

        setColumns(resultColumns);
        setData(resultValues);
      }

      if (status === SqlLoaderStates.FAILED) {
        setDataLoaded({ status: SqlLoaderStates.FAILED, message: errors.join('\n') })
        return;
      }
    }

    const setup = async () => {
      console.log("setting up")

      worker.onmessage = handleMessage
      worker.postMessage({ action: DBEvents.INIT })
    }

    setup()

    return () => {
      console.log("deregistered");
      worker.onmessage = null;
    }
  }, [launched, df, tableName])


  const handleQueryExecution = () => {
    if (!worker || !query) return;

    worker.postMessage({
      action: DBEvents.EXEC,
      tableName: tableName,
      query: query,
    })
  }


  const render = () => {
    if (dataLoadStatus.status === SqlLoaderStates.FAILED) {
      return <p className='error'>Failed to load data to db</p>
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
    console.log(response.status, "response status")
    if (response.status !== SqlLoaderStates.SUCCESS) return null;
    if (errors.length) return renderErrors();
    return <p>{response.message}</p>
  }

  if (!df) return null;

  console.log("load status", dataLoadStatus, data.length, columns.length)

  return (
    <>
      <hr className='separator' />
      <section className="margin-b-xl">
        {/* Query Textarea */}
        <div className='editor-wrapper flex flex-row'>
          {render()}
          <section
            className="table-description"
            style={{
              height: 'max-content',
              padding: '16px',
              flexShrink: 0
            }}
          >
            {dataLoadStatus.status === SqlLoaderStates.SUCCESS ? <DescriptionTable df={df} /> : null}
          </section>
        </div>
        {/* Results Table */}
        <h3 className='Table-header'>Results</h3>
        {renderStatus(dataLoadStatus, errors)}
        {data.length > 0 && df && (
          <ScrollableDataTable df={toDF(columns, data)} classNames={['query-result']} />
        )}

      </section>
    </>
  );
};

export default SqlArena;
