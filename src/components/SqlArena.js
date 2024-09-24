import React, { useState, useEffect } from 'react';
import { ScrollableDataTable } from './DataTable';

import Notifier from '../utils/notifications';
import { DuckDB, SQLite } from '../utils/dbs';
import { toDF } from '../utils/batcher';

import 'handsontable/dist/handsontable.full.css';
import '../SQLComponent.css';
import { SqlLoaderStates } from './SqlLauncher';
import { DescriptionTable } from './TableDescription';


const sqlite = new SQLite();
const duckdb = new DuckDB();

let _ = duckdb;

const SqlArena = ({ df, tableName, launched, handleSqlState }) => {
  const [db, setDb] = useState(null);
  const [query, setQuery] = useState('');
  const [data, setData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [notifier, setNotifier] = useState(null);

  const [dataLoadStatus, setDataLoaded] = useState(SqlLoaderStates.LOADING)

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
      await db.loadCSV(tableName, null, df)
    };


    if (db) {
      console.log("importing data")
      $loadSQLTable().then(() => {
        notifier.send('Success', `Imported to table: ${tableName}`);

        setDataLoaded(SqlLoaderStates.SUCCESS)

        let head = df.head(100);
        setColumns(df.columns);
        setData(head.values);

        handleSqlState({ state: SqlLoaderStates.SUCCESS, table: tableName })

      }).catch(error => {
        notifier.send('Failure', `Failed to build table`);
        console.error("db:import:error", error)

        setDataLoaded(SqlLoaderStates.FAILED)
        handleSqlState({ table: tableName, state: SqlLoaderStates.FAILED })
      });
    }
  }, [db, df, notifier, tableName])

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
    if (dataLoadStatus === SqlLoaderStates.FAILED) {
      return <p className='error'>Failed to load data to db</p>
    }

    if (dataLoadStatus === SqlLoaderStates.LOADING) {
      return <p className='info'>Loading Records into database</p>
    }

    if (dataLoadStatus === SqlLoaderStates.SUCCESS) {
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
            <DescriptionTable df={df} />
          </section>
        </div>
        {/* Results Table */}
        <h3 className='Table-header'>Results</h3>
        {data.length > 0 && db && (
          <ScrollableDataTable df={toDF(columns, data)} classNames={['query-result']} />
        )}
      </section>
    </>
  );
};

export default SqlArena;
