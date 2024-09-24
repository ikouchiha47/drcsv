import React, { useState } from 'react';

import { registerAllModules } from 'handsontable/registry';

import './App.css';
import './Home.css';

// import WareHouse from './WareHouse';
// import DataTable from './DataTable';
// import AnalysisTables from './AnalysisTables';
// import SQLComponent from './SQLComponent';

import { FileUpload } from './components/FileUpload';
import SideDeck from './components/SideDeck';
import WorkSpace from './components/Workspace';

Array.zip = (src, dst) => {
  return src.map((item, i) => [item, dst[i]])
}

registerAllModules();

function Header({ handleFileUpload }) {
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

      <FileUpload handleFileUpload={handleFileUpload} wrapperClass='Upload-container' />
    </header>
  )
}

function App() {
  const [file, setFile] = useState(null);
  const [files, updateFiles] = useState(new Map());

  const onFileUpload = async (event) => {
    const files = event.target.files;

    if (!files) return;
    if (!files.length) return;

    updateFiles(prevFiles => {
      let newMap = new Map(prevFiles);

      return [...files].reduce((acc, file) => {
        acc.set(file.name, file)
        return acc;
      }, newMap)
    })

    setFile(files[0]);
  }

  const onFileSelected = (file) => {
    setFile(file);
  }

  return (
    <div className="App">
      <Header handleFileUpload={onFileUpload} />
      <section className='App-container'>
        <SideDeck files={files} currentFile={file} handleSelectFile={onFileSelected} />
        {file && <WorkSpace file={file} />}
      </section>
    </div>
  )
}

export default App;
