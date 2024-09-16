import React, { useState, useEffect } from 'react';
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';

import 'handsontable/dist/handsontable.full.css';

registerAllModules();

const DataTable = ({ df, header }) => {
  const [data, setData] = useState([]);
  const [columns, setColumns] = useState([]);

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


  return (
    <div>
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
        />
      )}
    </div>
  );
};


export default DataTable;
