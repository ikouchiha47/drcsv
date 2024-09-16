import React, { useEffect, useState } from 'react';
import DataGrid from 'react-data-grid';

import 'react-data-grid/lib/styles.css';

const EditableCell = ({ row, column, key }) => {
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
      key={key}
    />
  );
};

Array.zip = (src, dst) => {
  return src.map((item, i) => [item, dst[i]])
}

const getTestRows = (df) => {
  return [
    {
      "product_id": 1,
      "product_name": "Apple",
      "category": "Fruit",
      "price": 1,
      "stock_quantity": 100,
      "id": 0
    },
    {
      "product_id": 2,
      "product_name": "Banana",
      "category": "Fruit",
      "price": 0.5,
      "stock_quantity": 150,
      "id": 1
    },
    {
      "product_id": 3,
      "product_name": "Orange",
      "category": "Fruit",
      "price": null,
      "stock_quantity": null,
      "id": 2
    },
    {
      "product_id": 4,
      "product_name": "Carrot",
      "category": "Vegetable",
      "price": 0.75,
      "stock_quantity": 80,
      "id": 3
    },
    {
      "product_id": 5,
      "product_name": "Potato",
      "category": "Vegetable",
      "price": 0.6,
      "stock_quantity": null,
      "id": 4
    },
    {
      "product_id": 6,
      "product_name": "Broccoli",
      "category": "Vegetable",
      "price": 1.25,
      "stock_quantity": 50,
      "id": 5
    },
    {
      "product_id": 7,
      "product_name": "Cucumber",
      "category": "Vegetable",
      "price": 1,
      "stock_quantity": 60,
      "id": 6
    }
  ]
}

const getTestColumns = (df) => {
  return [
    {
      "key": "product_id",
      "name": "product_id",
    },
    {
      "key": "product_name",
      "name": "product_name",
    },
    {
      "key": "category",
      "name": "category",
      sortable: true,
    },
    {
      "key": "price",
      "name": "price",
      sortable: true,
    },
    {
      "key": "stock_quantity",
      "name": "stock_quantity",
    },
    {
      "key": "id",
      "name": "id",
    }
  ]
}

const getRows = (df) => {
  return df.values.map((row) => Object.fromEntries(new Map(Array.zip(df.columns, row))))
}

const getColumns = (df) => {
  return df.columns.map(col => ({
    key: col,
    name: col,
    resizable: true,
    sortable: true,
    hidden: true,
  }))
}



const DataTable = ({ df, header }) => {
  const [rows, setRows] = useState([]);
  const [columns, setColumns] = useState([]);
  const [sortColumns, setSortColumns] = useState([]);

  const onSortColumnsChange = (sortColumns) => {
    setSortColumns(sortColumns);

    const sortedRows = [...rows].sort((a, b) => {
      for (const sort of sortColumns) {
        const comparator = (a, b) => {
          if (a[sort.columnKey] === b[sort.columnKey]) return 0;
          return a[sort.columnKey] > b[sort.columnKey] ? 1 : -1;
        };
        const compResult = comparator(a, b);
        if (compResult !== 0) {
          return sort.direction === 'ASC' ? compResult : -compResult;
        }
      }
      return 0;
    });
    setRows(sortedRows);
  };

  useEffect(() => {
    console.log("datatable::useeffect")
    let [_rows, _columns] = [getRows(df), getColumns(df)];

    console.log("rows", _rows)
    console.log("columns", _columns)

    setRows(_rows)
    setColumns(_columns)
  }, [df])

  const renderColumns = (columns) => {
    return columns.map((col) => ({ ...col, formatter: (props) => <EditableCell row={props.row} column={col} /> }));
  }

  if (!df) {
    return;
  }

  return (
    <div>
      <h2>{header}</h2>
      <DataGrid
        columns={columns}
        rows={rows}
        defaultColumnOptions={{ sortable: true }}
        sortColumns={sortColumns}
        onSortColumnsChange={onSortColumnsChange}
      />
    </div>
  );

}

export default DataTable;
