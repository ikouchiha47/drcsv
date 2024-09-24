import React from 'react';
import UploadHistory from './UploadHistory';

import '../Home.css';

const SideDeck = ({ files, currentFile, handleSelectFile }) => {
  return (
    <div className='Sidebar'>
      <UploadHistory
        files={files}
        currentFile={currentFile}
        handleSelectFile={handleSelectFile}
      />
    </div>
  );
}

export default SideDeck;
