import React, { useEffect, useState } from "react";
import * as dfd from 'danfojs';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';

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
  let groupedDf = df.groupby([...selectedColumns]);

  // console.log("queries", taggedColumns)
  // console.log("tg", taggedColumns, aggrFound, clausesFound)

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

const Preview = ({ df, fileName, filters, loadedFull, loadedPreview }) => {
  const [gdf, setAggregatedDf] = useState(df);

  useEffect(() => {
    if (df) {
      setAggregatedDf(groupData(df, filters))
    }
  }, [df, filters])


  const renderFileLoadStatus = () => {
    console.log("fileload status", loadedPreview, loadedFull);

    if (loadedPreview && loadedFull) {
      return <span className="text-green text-bold">Full Dataset Loaded</span>
    };

    if (!loadedPreview && !loadedFull) {
      return <span className="text-blue text-bold">Loading Dataset</span>
    }

    if (loadedPreview) {
      return <span className="text-yellow text-bold">Showing Preview, Yet to load all data. Please wait..</span>
    }

    return null;
  }

  return (
    <section className="preview-table margin-b-xl relative">
      <header className="flex flex-row">
        <h3 className="Section-header">Preview:</h3>
        <p style={{ width: '320px', overflow: 'hidden', whiteSpace: 'nowrap', cursor: 'pointer' }}>
          <em style={{ maxWidth: '100%', textOverflow: 'ellipsis', overflow: 'hidden' }} title={fileName}>{fileName}</em>
        </p>
        {renderFileLoadStatus()}
        <ArrowDownTrayIcon
          className="absolute"
          width={32}
          title='Export Data'
          style={{ left: '80vw', top: 0, cursor: 'pointer' }}
          onClick={() => dfd.toCSV(df, { fileName: fileName, download: true })}
        />
      </header>
      {gdf && <ScrollableDataTable df={gdf} />}
    </section>
  )
}

export default Preview;
