import React, { useState } from "react";
import { TableCellsIcon, TrashIcon } from '@heroicons/react/24/outline'

import '../stylesheets/FileListing.css';
import { TableInfoList } from "./TableDescription";


function RenderFileHistory({
  files,
  df,
  currentFile,
  handleSelectFile,
  handleRemoveFile,
}) {
  const [activeCol, setActiveColumn] = useState({});

  useState(() => {
    if (currentFile && files.size) {
      let idx = Array.from(files.keys()).findIndex(fileName => fileName === currentFile.name);
      if (idx < 0) return;

      if (activeCol[idx]) return; // already true?

      setActiveColumn({ ...activeCol, [idx]: true });
    }
  }, [])

  const handleOpenCloseCols = (e, idx) => {
    e.preventDefault();
    setActiveColumn({ ...activeCol, [idx]: !activeCol[idx] });
  }

  //TODO: fix re-rendering unnecesarily
  const renderFileList = (_files) => {
    let it = Array.from(_files.entries()).map(([name, file], idx) => {
      // console.log(file.name, currentFile.name, "fname");
      console.log('re-rendering file list')
      return (
        <div
          key={`files-${idx + 1}`}
          style={{ border: 0, padding: '0.5rem' }}
          onClick={async () => await handleSelectFile(file)}
        >
          <p className={currentFile && currentFile.name === name ? 'sidebar-table-name active' : 'sidebar-table-name'}>
            <TableCellsIcon width={24} onClick={(e) => handleOpenCloseCols(e, idx)} />
            <span style={{ display: 'inline-block', marginLeft: '0.5rem', flex: 1 }}>{name}</span>
            <TrashIcon width={24} onClick={() => handleRemoveFile(file)} />
          </p>
          {currentFile && currentFile.name === file.name ? <TableInfoList df={df} isActive={activeCol[idx]} /> : null}
        </div>
      )
    })

    return it;
  }

  return <section className='List'>{renderFileList(files)}</section>;
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
