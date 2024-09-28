import React from "react";
import { TableCellsIcon, TrashIcon } from '@heroicons/react/24/outline'

import '../stylesheets/FileListing.css';
import { TableInfoList } from "./TableDescription";


function RenderFileHistory({ files, df, currentFile, handleSelectFile, handleRemoveFile }) {
  const renderFileList = (_files) => {
    let it = Array.from(_files.entries()).map(([name, file], idx) => {
      return (
        <li
          key={`files-${idx + 1}`}
          style={{ border: 0, padding: '8px' }}
          onClick={async () => await handleSelectFile(file)}
        >
          <p className={currentFile && currentFile.name === file.name ? 'sidebar-table-name active' : 'sidebar-table-name'}>
            <TableCellsIcon width={24} />
            <span style={{ display: 'inline-block', marginLeft: '8px', flex: 1 }}>{name}</span>
            <TrashIcon width={24} onClick={() => handleRemoveFile(file)} />
          </p>
          {currentFile && currentFile.name === file.name ? <TableInfoList df={df} /> : null}
        </li>
      )
    })

    return it;
  }

  return <ul className='List'>{renderFileList(files)}</ul>;
}

function UploadHistory({ files, df, currentFile, handleSelectFile, handleRemoveFile }) {
  if (!files.size) return null;

  return (
    <section className="File-history">
      <RenderFileHistory
        files={files}
        df={df}
        currentFile={currentFile}
        handleSelectFile={handleSelectFile}
        handleRemoveFile={handleRemoveFile}
      />
    </section>
  )
}

export default UploadHistory;
