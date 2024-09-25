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
    } else if (filter.type === 'filter') {
      acc.filters.push(filter)
    }

    return acc;
  }, { groups: [], aggrs: [], filters: [] })


  const aggrFound = taggedColumns.aggrs.length > 0;
  const clausesFound = taggedColumns.filters.length > 0;

  const selectedColumns = new Set(taggedColumns.groups.map(col => col.column))
  let groupedDf = df.dropNa().groupby([...selectedColumns]);

  // console.log("queries", taggedColumns)

  console.log("tg", taggedColumns, aggrFound, clausesFound)

  if (!aggrFound && !clausesFound) return groupedDf.apply(g => g);

  if (aggrFound) {
    const aggregators = taggedColumns.aggrs.reduce((acc, data) => {
      let { column, action } = data;

      acc[column] = action;
      return acc;
    }, {})

    groupedDf = groupedDf.agg(aggregators)
  }

  if (clausesFound) {
    taggedColumns.filters.forEach(data => {
      let { column, action, clause } = data;

      // _df.loc({ rows: _df['column'].gt(value)})
      // _df.loc({ rows: _df['column'][operation](value)})
      groupedDf = groupedDf.loc({ rows: groupedDf[column][action](clause) })
    })
  }

  return groupedDf;
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
