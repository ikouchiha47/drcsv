import React, { useState, useEffect } from 'react';
import 'handsontable/dist/handsontable.full.css';

import Notifier from './utils/notifications';
import { DuckDB, SQLite } from './utils/dbs';

import './SQLComponent.css';
import './Home.css';
import { ScrollableDataTable } from './DataTable';
import { toDF } from './utils/batcher';

const sqlite = new SQLite();
const duckdb = new DuckDB();

let _ = duckdb;

const DataLoadStates = {
  LOADING: 'loading',
  LOADED: 'loaded',
  FAILED: 'failed'
}

const SQLComponent = ({ file, df, tableName, launched }) => {
  const [db, setDb] = useState(null);
  const [query, setQuery] = useState('');
  const [data, setData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [notifier, setNotifier] = useState(null);

  const [dataLoadStatus, setDataLoaded] = useState(DataLoadStates.LOADING)

  const loadSqlJs = async () => {
    const _db = await sqlite.init()
    setDb(_db);
  };

  const initNotifer = async () => {
    let _notifier = new Notifier();
    await _notifier.init();

    setNotifier(_notifier);
  }

  useEffect(() => {
    const setup = async () => {
      await initNotifer();
      await loadSqlJs();
    }

    setup();
  }, [launched]);

  useEffect(() => {
    const $loadSQLTable = async () => {  // $ signifies it throws error
      if (!db || !df) return false;
      await db.loadCSV(tableName, file, df)
    };

    const fileName = file.name;

    if (db) {
      console.log("importing data")
      $loadSQLTable().then(() => {
        notifier.send('Success', `Imported ${fileName} to table: ${tableName}`);
        setDataLoaded(DataLoadStates.LOADED)
      }).catch(error => {
        notifier.send('Failure', `Failed to build table for ${fileName}`);
        console.error("db:import:error", error)
        setDataLoaded(DataLoadStates.FAILED)
      });
    }
  }, [db, df, notifier, file, tableName])

  // Handle SQL query execution
  const handleQueryExecution = () => {
    if (!db || !query) return;

    try {
      const results = db.exec(query);  // Execute SQL query

      if (results.length > 0) {
        const resultColumns = results[0].columns;
        const resultValues = results[0].values;

        setColumns(resultColumns);
        setData(resultValues);
      } else {
        setColumns([]);
        setData([]);
      }
    } catch (err) {
      console.error('SQL Query Error:', err);
      notifier.send('Failure', `Failed to execute query: ${query}`)
    }
  };


  const render = () => {
    if (dataLoadStatus === DataLoadStates.FAILED) {
      return <p className='error'>Failed to load data to db</p>
    }

    if (dataLoadStatus === DataLoadStates.LOADING) {
      return <p className='info'>Loading Records into database</p>
    }

    if (dataLoadStatus === DataLoadStates.LOADED) {
      return (
        <>
          <div className='Table-info'>
            <p>Table Name: <b>{tableName}</b></p>
            <p>Example Query: <em>SELECT * FROM {tableName}</em></p>
          </div>
          <textarea
            className='query-playground'
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Write your SQL query here..."
          />
          <button className='Button Btn-green' onClick={handleQueryExecution}>Run Query</button>
        </>
      )
    }

    return null;
  }

  return (
    <>
      <hr className='separator' />
      <section className="Playground Container">
        <h3 className='Table-header'>SeQueLize</h3>
        {/* Query Textarea */}
        {render()}
        {/* Results Table */}
        <h3 className='Table-header'>Results</h3>
        {data.length > 0 && db && (
          <ScrollableDataTable df={toDF(columns, data)} classNames={['query-result']} />
        )}
      </section>
    </>
  );
};

export default SQLComponent;
