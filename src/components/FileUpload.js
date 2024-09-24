import React from 'react'
import { ArrowUpTrayIcon } from '@heroicons/react/24/outline'

export function FileUpload({ handleFileUpload, wrapperClass }) {
  return (
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
  )
};
