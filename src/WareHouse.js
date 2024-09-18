import React, { useState } from 'react';
import * as dfd from 'danfojs';

import './Home.css';

async function loadData(file) {
  const df = await dfd.readCSV(file);
  const id = Array.from({ length: df.shape[0] }, (_, i) => i);

  df.addColumn('id', id, { inplace: true })
  // df.dropNa({ inplace: true })
  // df.fillNa("", { axis: 1 })

  return df
}

function WareHouse({ onDataProcessed }) {
  const [df, setDf] = useState(null);
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
      let _df = await loadData(file)

      setDf(_df);
      onDataProcessed(_df, file.name)
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
      let _df = await loadData(file)

      setDf(_df)
      onDataProcessed(_df, file.name)
      setCurrentFile(file.name)

    } catch (e) {
      console.error(e)
    }
  }

  const handleCleanData = () => {
    if (!df) return

    let _cleaned = df.copy()
    _cleaned.dropNa({ inplace: true })

    setDf(_cleaned)
    onDataProcessed(_cleaned, currentFile)
  }

  return (
    <div className="Sidebar">
      <div className="Vertical-split-container">
        <div className='Scrollable'>
          <section className='Upload-section'>
            <FileUpload handleFileUpload={handleFileUpload} />
          </section>
          <section className='File-history'>
            <RenderFileHistory files={files} selectFile={handleSelectFile} currentFile={currentFile} />
          </section>
        </div>
        <div className="Static">
          <h3>Operations</h3>
          <ul className='List'>
            <li onClick={handleCleanData}>Clean</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function FileUpload({ handleFileUpload }) {
  return <input type="file" accept=".csv" onChange={handleFileUpload} />
}

function RenderFileHistory({ files, selectFile, currentFile }) {
  const renderFileList = (_files) => {
    let it = Array.from(_files.entries()).map(([name, file], idx) => {
      return (
        <li
          key={`files-${idx + 1}`}
          className={currentFile === file.name ? 'active' : ''}
          onClick={async () => await selectFile(file)}
        >
          {name}
        </li>
      )
    })

    return it;
  }

  if (!files) return;

  return <ul className='List'>{renderFileList(files)}</ul>;
}

export default WareHouse;
