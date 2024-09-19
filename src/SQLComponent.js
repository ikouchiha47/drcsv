import React, { useState, useEffect, useRef } from 'react';
import { HotTable } from '@handsontable/react';
import 'handsontable/dist/handsontable.full.css';
import initSqlJs from 'sql.js';

const notifyUser = () => {
  if (Notification.permission === 'granted') {
    new Notification('SQL Execution Completed!', {
      body: 'The SQL query has been successfully executed.'
    });
  }
};

const SQLComponent = ({ file }) => {
  const [db, setDb] = useState(null);
  const [query, setQuery] = useState('');
  const [data, setData] = useState([]);
  const [columns, setColumns] = useState([]);

  useEffect(() => {
    const loadSqlJs = async () => {
      const SQL = await initSqlJs({
        locateFile: file => `https://sql.js.org/dist/${file}`
      });

      setDb(new SQL.Database());
    };

    loadSqlJs();

    if (Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (db) {
      try {
        db.run(`.import ${file.name} CSV`);

        // Notify user about the import success
        notifyUser();

      } catch (error) {
        console.error("Error importing CSV into SQL.js:", error);
      }
    }
  }, [])

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
      notifyUser();  // Notify user of query completion
    } catch (err) {
      console.error('SQL Query Error:', err);
    }
  };

  return (
    <div className="sql-container">
      {/* Query Textarea */}
      <div className="query-container">
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Write your SQL query here..."
        />
        <button onClick={handleQueryExecution}>Run Query</button>
      </div>

      {/* Results Table */}
      {data.length > 0 && (
        <HotTable
          data={data}
          colHeaders={columns}
          rowHeaders={true}
          licenseKey="non-commercial-and-evaluation"
          stretchH="all"
        />
      )}
    </div>
  );
};

export default SQLComponent;
