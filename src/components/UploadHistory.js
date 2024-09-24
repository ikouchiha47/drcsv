import React from "react";
import { TableCellsIcon } from '@heroicons/react/24/outline'

import '../stylesheets/FileListing.css';

function RenderFileHistory({ files, selectFile, currentFile }) {
  const renderFileList = (_files) => {
    let it = Array.from(_files.entries()).map(([name, file], idx) => {
      return (
        <li
          key={`files-${idx + 1}`}
          className={currentFile && currentFile.name === file.name ? 'Table-name active' : 'Table-name'}
          onClick={async () => await selectFile(file)}
        >
          <TableCellsIcon width={24} />
          <span style={{ display: 'inline-block', marginLeft: '8px' }}>{name}</span>
        </li>
      )
    })

    return it;
  }

  return <ul className='List'>{renderFileList(files)}</ul>;
}

function UploadHistory({ files, currentFile, handleSelectFile }) {
  if (!files.size) return null;

  return (
    <section className="File-history">
      <RenderFileHistory
        files={files}
        currentFile={currentFile}
        selectFile={handleSelectFile}
      />
    </section>
  )
}

export default UploadHistory;
