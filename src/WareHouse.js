import React, { useState } from 'react';
import * as dfd from 'danfojs';

import './Home.css';
import './Form.css';

async function loadData(file) {
  const df = await dfd.readCSV(file);
  const id = Array.from({ length: df.shape[0] }, (_, i) => i);

  df.addColumn('id', id, { inplace: true })
  // df.dropNa({ inplace: true })
  // df.fillNa("", { axis: 1 })

  return df
}

function DefaultValueForm({ df, onUpdateDF }) {
  const [defaultValues, setDefaultValues] = useState({});

  const handleInputChange = (e, column) => {
    setDefaultValues({
      ...defaultValues,
      [column]: e.target.value,
    });
  };

  const handleApplyDefaults = () => {
    let newDf = df.copy();
    for (let column in defaultValues) {
      if (defaultValues[column]) {
        newDf[column] = newDf[column].fillNa(defaultValues[column]);
      }
    }
    onUpdateDF(newDf);
  };

  if (!df) return;

  return (
    <section className='Defaults'>
      <h3>Set Default Values</h3>
      <form className='Form'>
        {df.columns.map((column, idx) => (
          <div key={idx} className="Form-row">
            <label className='Form-label'>
              {column}:
            </label>
            <input
              type="text"
              className="Form-input"
              onChange={(e) => handleInputChange(e, column)}
            />
          </div>
        ))}
        <button type="button" className="Submit-button" onClick={handleApplyDefaults}>
          Apply Default Values
        </button>
      </form>
    </section>
  );
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

  const handleDfUpdate = (df) => {
    setDf(df);
    onDataProcessed(df, currentFile)
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
            {df && <li>
              <DefaultValueForm df={df} onUpdateDF={handleDfUpdate} />
            </li>}
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
