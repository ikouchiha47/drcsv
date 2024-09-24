import React, { useEffect, useState } from "react";
import { ScrollableDataTable } from "./DataTable";

const groupData = (df, filters) => {
  if (!filters) return df;
  if (!filters.length) return df;

  let taggedColumns = Object.values(filters).reduce((acc, filter) => {
    if (filter.type === 'group') {
      acc.groups.push(filter)
    } else if (filter.type === 'aggr') {
      acc.aggrs.push(filter)
    }

    return acc;
  }, { groups: [], aggrs: [] })


  const aggrFound = taggedColumns.aggrs.length > 0;
  const selectedColumns = new Set(taggedColumns.groups.map(col => col.column))
  const groupedDf = df.groupby([...selectedColumns]);

  console.log("queries", taggedColumns)

  if (!aggrFound) return groupedDf.apply(g => g);

  const aggregators = taggedColumns.aggrs.reduce((acc, data) => {
    let { column, action } = data;

    // if (!AggregateColumns.includes(action)) {
    //   return acc;
    // }

    acc[column] = action;
    return acc;
  }, {})


  return groupedDf.agg(aggregators);
}

const Preview = ({ df, fileName, filters }) => {
  const [gdf, setAggregatedDf] = useState(df);

  useEffect(() => {
    if (df) {
      setAggregatedDf(groupData(df, filters))
    }
  }, [df, filters])

  if (!df) return null;

  return (
    <section className="preview-table margin-b-xl">
      <header className="flex flex-row">
        <h3>Preview:</h3>
        <em>{fileName}</em>
      </header>
      {gdf && <ScrollableDataTable df={gdf} />}
    </section>
  )
}

export default Preview;
