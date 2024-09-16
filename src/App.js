import React, { useState } from 'react';

import './App.css';

import DataUpload from './DataUpload';
import DataTable from './DataTable';

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
  const [fileName, setFileName] = useState('');

  const handleDataProcessed = (dataFrame, fileName) => {
    setDf(dataFrame);
    setFileName(fileName);
  };

  return (
    <div className="App">
      <Header />
      <DataUpload onDataProcessed={handleDataProcessed} />
      {df && (
        <div>
          <h2>Processed Data</h2>
          <DataTable df={df} header={fileName} />
        </div>
      )}
    </div>
  );
}

export default App;
