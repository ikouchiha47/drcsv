import React, { useEffect, useState } from "react";
import * as dfd from 'danfojs';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';

import { ScrollableDataTable } from "./DataTable";
import Plotter from "./Plotter";

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

  let filteredDf = df;
  let emptyDf = new dfd.DataFrame();

  let availCols = new Set(df.columns);

  // Apply filters first.
  if (clausesFound) {
    for (let data of taggedColumns.filters) {
      let { column, action, clause } = data;

      if (filteredDf.size === 0) return emptyDf;
      if (!availCols.has(column)) continue;

      // _df.loc({ rows: _df['column'].gt(value)})
      // _df.loc({ rows: _df['column'][operation](value)})

      console.log("filter", column, action, clause);

      try {
        filteredDf = filteredDf.loc({ rows: filteredDf[column][action](clause) })
      } catch (err) {
        console.error('df filter error', err);
        continue
      }
    }
    // taggedColumns.filters.forEach(data => {
    //   let { column, action, clause } = data;
    //
    //   // _df.loc({ rows: _df['column'].gt(value)})
    //   // _df.loc({ rows: _df['column'][operation](value)})
    //   if (!availCols.has(column)) return;
    //   if (filteredDf.size === 0) return;
    //
    //   try {
    //     filteredDf = filteredDf.loc({ rows: filteredDf[column][action](clause) })
    //   } catch (err) {
    //     console.error('df filter error', err);
    //     filteredDf = new dfd.DataFrame()
    //   }
    // })
  }
  // BHARATIYA JANATA PARTY
  // ALL INDIA TRINAMOOL CONGRESS

  console.log("aggr",
    selectedColumns,
    taggedColumns,
    !aggrFound,
    !clausesFound);

  if (filteredDf.size === 0) return filteredDf;

  let groupedDf = filteredDf.groupby([...selectedColumns]);

  if (aggrFound) {
    const aggregators = taggedColumns.aggrs.reduce((acc, data) => {
      let { column, action } = data;

      acc[column] = action;
      return acc;
    }, {})

    return groupedDf.agg(aggregators)
  }

  return groupedDf.apply(g => g)
}

const Preview = ({ df, fileName, filters, loadedFull, loadedPreview }) => {
  const [gdf, setAggregatedDf] = useState(df);

  useEffect(() => {
    if (df) {
      setAggregatedDf(groupData(df, filters))
    }
  }, [df, filters])


  const renderFileLoadStatus = () => {
    // console.log("fileload status", loadedPreview, loadedFull);
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
    <>
      <section className="preview-table margin-b-xl relative">
        <header className="flex flex-row">
          <h3 className="Section-header">Preview:</h3>
          <p style={{ width: '20rem', overflow: 'hidden', whiteSpace: 'nowrap', cursor: 'pointer' }}>
            <em style={{ maxWidth: '100%', textOverflow: 'ellipsis', overflow: 'hidden' }} title={fileName}>{fileName}</em>
          </p>
          {renderFileLoadStatus()}
          <ArrowDownTrayIcon
            className="absolute"
            width={'2.25rem'}
            title='Export Data'
            style={{ right: 0, top: 0, cursor: 'pointer' }}
            onClick={() => dfd.toCSV(df, { fileName: fileName, download: true })}
          />
        </header>
        {gdf && gdf.size > 0 ? <ScrollableDataTable df={gdf} /> : <p style={{ fontSize: '20px', color: 'var(--btn-yellow)' }}>No results Found</p>}

      </section>
      <hr className="separator" />
      {df && df.size > 0 && loadedFull && <Plotter df={gdf} />}
    </>
  )
}

export default Preview;
