import { ChevronDoubleDownIcon, ChevronDoubleUpIcon } from "@heroicons/react/24/outline";
import React, { useState } from "react";
import { sanitizeHeader } from "../utils/dbs";

const tableStyles = {
  width: '100%',
  borderCollapse: 'collapse',
  border: '1px solid #ccc',
};

const headerCellStyles = {
  padding: '8px',
  textAlign: 'left',
  borderBottom: '1px solid #ddd',
  backgroundColor: 'rgba(70, 66, 126, 0.18)',
};

const cellStyles = {
  padding: '8px',
  borderBottom: '1px solid #eee',
  textAlign: 'left',
  fontSize: '16px',
  color: '#ccc',
};

export const DescriptionTable = ({ df, tableWidth }) => {
  const columns = ['Column', 'Type'];
  const types = Array.zip(df.columns, df.dtypes);

  tableWidth ||= '100%';

  return (
    <table style={{ ...tableStyles, width: tableWidth, overflowX: true }}>
      <thead>
        <tr>
          {columns.map((col, index) => (
            <th key={index} style={headerCellStyles}>{col}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {types.map((row, rowIndex) => (
          <tr key={rowIndex}>
            {row.map((cell, cellIndex) => (
              <td key={cellIndex} style={cellStyles}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
};

export const TableInfoList = ({ df }) => {
  if (!df) return;

  const tinfos = Array.zip(df.columns, df.dtypes);

  return (
    <ul className="sidebar-table-info">
      {tinfos.map((tinfo, key) => {
        return (
          <li key={`tinfo-list-${key}`} className="flex flex-row" style={{ justifyContent: 'space-between', border: 0 }}>
            <b>{tinfo[0]}</b>
            <span>{tinfo[1]}</span>
          </li>
        )
      })}
    </ul>
  )

}

export const TableInfo = ({ df }) => {
  const [showHide, toggleShowHide] = useState(false)

  const handleShowHide = () => {
    toggleShowHide(!showHide)
  }

  const renderToggle = () => {
    if (!showHide) {
      return <ChevronDoubleDownIcon
        width={16}
        style={{ cursor: 'pointer' }}
        onClick={handleShowHide}
      />
    }

    return <ChevronDoubleUpIcon
      width={16}
      style={{ cursor: 'pointer' }}
      onClick={handleShowHide}
    />
  }

  const renderInfo = () => {
    if (!showHide) return null;
    if (!df) return null;

    const shape = df.shape;
    const columns = df.columns;

    let sanitizedCols = new Set(columns.map(sanitizeHeader))

    return (
      <>
        <div className="flex flex-col" style={{ gap: '16px' }}>
          <section className="shape">
            <p><b>Rows:</b> {shape[0]}</p>
            <p><b>Columns:</b> {shape[1]}</p>
          </section>

          {sanitizedCols.difference(new Set(columns)) ? <p className="alert">Column Names Need Fixup</p> : null}
          {/*descDf && <ScrollableDataTable df={descDf} />*/}
        </div>
      </>
    );
  }

  return (
    <section className="Table-info" style={{ marginBottom: '32px' }}>
      <header className="flex flex-row" style={{ gap: '16px', alignItems: 'center', marginBottom: '16px' }}>
        <h3>Info</h3>
        {renderToggle()}
      </header>
      {renderInfo()}
    </section>
  )
}


