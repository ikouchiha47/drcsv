import React from "react";
import Preview from "./Preview";
import CSVAnalyzer from "./Analyzer";
import SqlArena from "./SqlArena";
// import DuckArena from "./DuckArena";

export const PreviewFrame = ({
  df,
  fileName,
  delimiter,
  filters,
  isLoadedFull,
  isPreview,
  showAnalyzer,
}) => {
  return (
    <>
      <Preview
        df={df}
        fileName={fileName}
        filters={filters}
        loadedFull={isLoadedFull}
        loadedPreview={isPreview}
      />
      {showAnalyzer ? <CSVAnalyzer df={df} show={showAnalyzer} delimiter={delimiter} /> : null}
    </>
  );
}

export const SqlFrame = ({
  df,
  file,
  sqlState,
  handleSqlLaunch,
  setSqlState,
}) => {
  return (
    <>
      <header className='Table-name-header'>
        <p style={{ fontSize: '28px' }}>Table: <b>{sqlState.table}</b></p>
        <button type="button"
          className="Button Btn-yellow"
          onClick={() => { setSqlState({ status: null, table: sqlState.table }) }}
        >
          Switch Back
        </button>
      </header>

      <SqlArena
        df={df}
        file={file}
        tableName={sqlState.table}
        launched={sqlState.state}
        handleSqlState={handleSqlLaunch}
      />
      {/*<DuckArena
          df={df}
          file={file}
          tableName={sqlState.table}
          launched={sqlState.state}
          handleSqlState={handleSqlLaunch}
        />*/}
    </>
  )
}
