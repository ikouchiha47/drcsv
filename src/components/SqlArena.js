import React, { useState, useEffect } from 'react';
import * as dfd from 'danfojs';

import { ScrollableDataTable } from './DataTable';
import Notifier from '../utils/notifications';

import { DBEvents } from '../utils/dbs';
import { toDF } from '../utils/batcher';

import 'handsontable/dist/handsontable.full.css';
import '../Home.css';
import '../SQLComponent.css';

import { SqlLoaderStates } from '../utils/constants';

const worker = new Worker(
  new URL('../workers/sqlite.worker.js', import.meta.url),
  { type: "module" }
);

const notifier = new Notifier();
// await notifier.init();

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

      if (warns.length) {
        console.warn(warns.join('\n'))
      }

      if (status === SqlLoaderStates.CREATED) {
        worker.postMessage({
          action: DBEvents.SEED,
          tableName: tableName,
          df: dfd.toJSON(df, { format: 'row' })
        })

        setDataLoaded({ status: SqlLoaderStates.SEEDING, message: 'Importing Data' })
        handleSqlState({ status: SqlLoaderStates.SEEDING, table: tableName })

        return;
      }

      if (status === SqlLoaderStates.SEEDED) {
        setDataLoaded({ status: SqlLoaderStates.SUCCESS, message: `Imported ${data} records` })
        handleSqlState({ status: SqlLoaderStates.SUCCESS, table: tableName })

        notifier.send('Success', `Imported ${data} records to ${tableName}`)
        return
      }

      if (status === SqlLoaderStates.RESULT) {
        setDataLoaded({ status: SqlLoaderStates.SUCCESS, message: '' })

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

        return;
      }

      if (status === SqlLoaderStates.FAILED) {
        setDataLoaded({ status: SqlLoaderStates.FAILED, message: errors.join('\n') })
        // setErrors(errors)
        handleSqlState({ status: SqlLoaderStates.FAILED, table: tableName })
        return;
      }
    }

    const setup = async () => {
      console.log("setting up")

      await notifier.init();

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
    console.log(response.status, "response status")

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

export default SqlArena;
