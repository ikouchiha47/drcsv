import React from 'react';
import { ArrowUpTrayIcon } from '@heroicons/react/24/outline'

export function FileUpload({ handleFileUpload, handleFileURLUpload, wrapperClass }) {
  const handlePrompt = () => {
    const result = window.prompt('Enter valid public URL:');
    if (result !== null) {
      handleFileURLUpload(result);
    }
  }

  return (
    <>
      <div className={wrapperClass} onClick={handlePrompt}>
        <button type="button" className="upload-label" style={{ border: 0 }}>
          <ArrowUpTrayIcon className='upload-icon' />
          <p>Import URL</p>
        </button>
      </div>

      <div className={wrapperClass}>
        <input
          type="file"
          id="fileUpload"
          accept=".csv"
          onChange={handleFileUpload}
          hidden
        />
        <label htmlFor="fileUpload" className="upload-label">
          <ArrowUpTrayIcon className='upload-icon' />
          <p>Import CSV</p>
        </label>
      </div>
    </>
  )
};

