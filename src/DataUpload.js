
import React, { useState } from 'react';
import * as dfd from 'danfojs';

import './Home.css';

async function loadData(file) {
  const df = await dfd.readCSV(file);
  const id = Array.from({ length: df.shape[0] }, (_, i) => i);

  df.addColumn('id', id, { inplace: true })
  // df.fillNa("", { axis: 1 })
  //
  return df
}

function DataUpload({ onDataProcessed }) {
  const [files, updateFiles] = useState(new Map());
  const [currentFile, setCurrentFile] = useState(null);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) {
      onDataProcessed(null, '')
      return
    }

    updateFiles(files.set(file.name, file))

    try {
      let df = await loadData(file)

      onDataProcessed(df, file.name)
      setCurrentFile(file.name)

    } catch (e) {
      console.error(e)
    }

    event.target.value = null;
  };

  const handleSelectFile = async (file) => {
    if (!files.has(file.name)) {
      return
    }


    try {
      let df = await loadData(file)

      onDataProcessed(df, file.name)
      setCurrentFile(file.name)

    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="Sidebar">
      <section className='Upload-section'>
        <input type="file" accept=".csv" onChange={handleFileUpload} />
      </section>
      <section className='File-history'>
        <RenderFileHistory files={files} selectFile={handleSelectFile} currentFile={currentFile} />
      </section>
    </div>
  );
}

function RenderFileHistory({ files, selectFile, currentFile }) {
  const renderFileList = (_files) => {
    let it = _files.entries().map(([name, file], idx) => {
      return (
        <li
          key={`files-${idx + 1}`}
          className={currentFile == file.name ? 'active' : ''}
          onClick={async () => await selectFile(file)}
        >
          {name}
        </li>
      )
    })

    return Array.from(it)
  }


  return <ul>{renderFileList(files)}</ul>;
}

export default DataUpload;
