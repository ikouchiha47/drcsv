import React from 'react';
import UploadHistory from './UploadHistory';

import '../Home.css';

const SideDeck = ({ files, df, currentFile, handleSelectFile }) => {
  return (
    <div className='Sidebar'>
      <UploadHistory
        files={files}
        df={df}
        currentFile={currentFile}
        handleSelectFile={handleSelectFile}
      />
    </div>
  );
}

export default SideDeck;
