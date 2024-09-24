import React from "react";

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

export function DescriptionTable({ df }) {
  const columns = ['Column', 'Type'];
  const types = Array.zip(df.columns, df.dtypes);

  return (
    <table style={tableStyles}>
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
