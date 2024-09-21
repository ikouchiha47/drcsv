import React, { useState } from 'react';
import * as dfd from 'danfojs';
import { ArrowUpTrayIcon } from '@heroicons/react/24/outline'

import './Home.css';
import './Form.css';

async function loadData(file) {
  const df = await dfd.readCSV(file);
  const id = Array.from({ length: df.shape[0] }, (_, i) => i);

  df.addColumn('id', id, { inplace: true })

  return df
}

function mapDTypeToJS(dtype, value) {
  switch (dtype) {
    case 'int32':
    case 'int64':
    case 'float32':
    case 'float64':
      return Number(value);
    case 'bool':
      return Boolean(value);
    case 'string':
      return String(value)
    case 'object':
    default:
      return JSON.stringify(value);
  }
}

function DefaultValueForm({ df, onUpdateDF }) {
  const [defaultValues, setDefaultValues] = useState({});

  const handleInputChange = (e, column) => {
    setDefaultValues({
      ...defaultValues,
      [column]: e.target.value,
    });
  };

  const dtypeMap = new Map(Array.zip(df.columns, df.dtypes))

  const handleApplyDefaults = () => {
    let newDf = df.copy();

    for (let column in defaultValues) {
      if (defaultValues[column]) {
        newDf[column] = newDf[column].fillNa(mapDTypeToJS(dtypeMap.get(column) || 'string', defaultValues[column]));
      }
    }

    onUpdateDF(newDf);
  };

  return (
    <section className='Defaults'>
      <h3>Set Default Values</h3>
      <form className='Form' id='default-value-form'>
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

function WareHouse({ df, onDataProcessed, onSqlLaunch }) {
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

      setCurrentFile(file)
      onDataProcessed(_df, file)

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

      setCurrentFile(file)
      onDataProcessed(_df, file)

    } catch (e) {
      console.error(e)
    }
  }

  const handleCleanData = () => {
    if (!df) return

    onDataProcessed(df.dropNa(), currentFile)
  }

  const handleDfUpdate = (df) => {
    onDataProcessed(df, currentFile)
  }

  const renderFileHistory = () => {
    if (!currentFile) return;

    return (
      <section className='File-history'>
        <RenderFileHistory files={files} selectFile={handleSelectFile} currentFile={currentFile.name} />
      </section>
    )
  }

  return (
    <div className="Sidebar">
      <div className="Vertical-split-container">
        <div className='Scrollable'>
          <section className='Upload-section'>
            <FileUpload handleFileUpload={handleFileUpload} />
          </section>
          {renderFileHistory()}
        </div>
        <div className="Static">
          <h3>Operations</h3>
          {df && (
            <ul className='List'>
              <li onClick={handleCleanData}>Clean</li>
              <li onClick={() => onSqlLaunch(true)}>Sequelize</li>
              <li><DefaultValueForm df={df} onUpdateDF={handleDfUpdate} /></li>
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function FileUpload({ handleFileUpload }) {
  return (
    <div className="upload-card">
      <input
        type="file"
        id="fileUpload"
        accept=".csv"
        onChange={handleFileUpload}
        hidden
      />
      <label htmlFor="fileUpload" className="upload-label">
        <ArrowUpTrayIcon className='upload-icon' />
        <p>Upload CSV</p>
      </label>
    </div>
  )
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
