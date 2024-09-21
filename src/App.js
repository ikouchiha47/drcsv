import React, { useState } from 'react';

import { registerAllModules } from 'handsontable/registry';

import './App.css';
import './Home.css';

import WareHouse from './WareHouse';
import DataTable from './DataTable';
import AnalysisTables from './AnalysisTables';
import SQLComponent from './SQLComponent';

Array.zip = (src, dst) => {
  return src.map((item, i) => [item, dst[i]])
}

registerAllModules();

function Header() {
  return (
    <header className="App-header">
      <a
        className="App-link"
        href="https://reactjs.org"
        target="_blank"
        rel="noopener noreferrer"
      >
        dr.csv
      </a>
    </header>
  )
}

function App() {
  const [df, setDf] = useState(null);
  const [file, setFile] = useState(null);
  const [launchSqlite, signalLanuchSql] = useState(false);

  const handleDataProcessed = (dataFrame, file) => {
    setDf(dataFrame);
    setFile(file);

    window.df = dataFrame.copy()
  };

  return (
    <div className="App">
      <Header />
      <section className='App-container'>
        <WareHouse df={df} onDataProcessed={handleDataProcessed} onSqlLaunch={signalLanuchSql} />
        <section className='Main'>
          {df && <DataTable df={df} header={file.name} />}
          {df && <AnalysisTables
            df={df}
            fileName={file.name}
          />
          }
          {launchSqlite ? <SQLComponent df={df} file={file} launched={launchSqlite} tableName='dummy' /> : null}
        </section>
      </section>
    </div>
  );
}

export default App;
