import React, { useEffect, useState } from 'react';
import DataGrid from 'react-data-grid';

const EditableCell = ({ row, column }) => {
  const [value, setValue] = useState(row[column.key]);

  const handleRowChange = (updatedRow, columnKey, newValue) => {
    console.log("change", updatedRow, columnKey, newValue)
  }

  const handleBlur = () => {
    handleRowChange(row, column.key, value);
  };

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={handleBlur}
      style={{ width: "100%" }}
    />
  );
};

const DataTable = ({ df, header }) => {
  const [rows, setRows] = useState([]);
  const [columns, setColumns] = useState([]);

  const getRows = (df) => {
    return df.values.map((row) => {
      let rowData = {};
      df.columns.forEach((col, idx) => {
        rowData[col] = row[idx];
      });
      return rowData;
    })
  }

  const getColumns = (df) => {
    return df.columns.map(col => ({
      key: col,
      name: col,
      editable: true,
      resizable: true,
      sortable: true,
    }))
  }

  useEffect(() => {
    console.log("datatable::useeffect")
    setRows(getRows(df))
    setColumns(getColumns(df))
  }, [df])

  const renderColumns = (columns) => {
    return columns.map((col) => ({ ...col, formatter: (props) => <EditableCell row={props.row} column={col} /> }));
  }

  console.log("df", df);

  if (!df) {
    return;
  }

  return (
    <div>
      <h2>{header}</h2>
      <DataGrid
        columns={renderColumns(columns)}
        rows={rows}
        rowHeight={50} />
    </div>
  );

}

// function DataTable({df}) {
//   return (
//     <div>
//       <Table df={df} />
//     </div>
//   );
// }

function Table({ df }) {
  return (
    <table>
      <thead>
        <tr>
          {df.columns.map((col) => (
            <th key={col}>{col}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {df.values.map((row, idx) => (
          <tr key={idx}>
            {row.map((val, idx2) => (
              <td key={idx2}>{val}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default DataTable;
