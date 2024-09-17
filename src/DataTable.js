import React, { useState, useEffect, useRef } from 'react';
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';

import 'handsontable/dist/handsontable.full.css';
import './Home.css';

registerAllModules();

const DataTable = ({ df, header }) => {
  const [data, setData] = useState([]);
  const [columns, setColumns] = useState([]);
  const dfRef = useRef(null); // Create a ref object to store the DataFrame

  dfRef.current = df;

  useEffect(() => {
    const loadData = async () => {
      try {
        const dataArray = df.values;
        const columnNames = df.columns;

        setData(dataArray);
        setColumns(columnNames.map(name => ({ data: name, title: name })));
      } catch (err) {
        console.error("Error loading CSV data:", err);
      }
    };

    loadData();
  }, [df]);

  const handleAfterChange = (changes, source) => {
    if (changes) {
      changes.forEach(([row, col, oldValue, newValue]) => {
        if (oldValue !== newValue) {
          // Update the DataFrame
          // console.log(col, columnName, row, "rrr")
          dfRef.current.values[row][col] = newValue;
        }
      });
    }
  };

  return (
    <div className='Table-container'>
      <h2>{header}</h2>
      {data.length > 0 && columns.length > 0 && (
        <HotTable
          data={data}
          colHeaders={columns.map(col => col.title)}
          rowHeaders={true}
          licenseKey="non-commercial-and-evaluation"
          stretchH="all"
          manualColumnResize={true}
          manualRowResize={true}
          contextMenu={true}
          hiddenColumns={{ columns: [columns.findIndex(col => col.data == 'id')] }}
          columnSorting={true}
          afterChange={handleAfterChange}
        />
      )}
    </div>
  );
};


export default DataTable;
