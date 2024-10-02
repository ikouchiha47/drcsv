import React from 'react';
import UploadHistory from './UploadHistory';

// import '../Home.css';

const SideDeck = ({ files, df, currentFile, handleSelectFile, handleRemoveFile }) => {
  console.log("re-rendering side deck");

  return (
    <div className='Sidebar'>
      <UploadHistory
        files={files}
        df={df}
        currentFile={currentFile}
        handleSelectFile={handleSelectFile}
        handleRemoveFile={handleRemoveFile}
      />
    </div>
  );
}

export default SideDeck;
