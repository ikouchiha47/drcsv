import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as dfd from 'danfojs';
import { HotTable } from '@handsontable/react';

import 'handsontable/dist/handsontable.full.css';
import './Home.css';

const BATCH_SIZE = 20;
const WINDOW_SIZE = 100;

function loadMoreData(df, start, count) {
  const end = Math.min(start + count, df.shape[0]);
  start = Math.max(0, start);

  return df.loc({ rows: [`${start}:${end}`] });
}

export const ScrollableDataTable = ({ df }) => {
  const [data, setData] = useState([]);
  const [startIdx, setStartIdx] = useState(0);
  const [loading, setLoading] = useState(false);

  const dfRef = useRef(null);
  const scrollRef = useRef(null);

  dfRef.current = df;

  useEffect(() => {
    const loadData = async () => {
      if (!df) return;

      try {
        const initialData = df.head(WINDOW_SIZE);

        setData(initialData.values);
        // setColumns(df.columns.map(name => ({ data: name, title: name })));
        setStartIdx(WINDOW_SIZE)

      } catch (err) {
        console.error("Error loading CSV data:", err);
      }
    };

    loadData();
  }, [df]);

  // const handleAfterChange = (changes, source) => {
  //   if (changes) {
  //     changes.forEach(([row, col, oldValue, newValue]) => {
  //       if (oldValue !== newValue) {
  //         // console.log(col, columnName, row, "rrr")
  //         dfRef.current.values[row][col] = newValue;
  //       }
  //     });
  //   }
  // };


  let columns = df.columns;

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;

    if (scrollTop + clientHeight >= scrollHeight - 50 && !loading) {
      console.log("loading more")

      setLoading(true);

      let moreData = loadMoreData(dfRef.current, startIdx, BATCH_SIZE);

      setData(prevData => {
        const prevDataDf = new dfd.DataFrame(prevData, { columns: columns });
        const combinedDf = dfd.concat({ dfList: [moreData, prevDataDf], axis: 0 })

        // const slicedDf = combinedDf.tail(WINDOW_SIZE);
        // console.log("sliced", slicedDf.values.length);
        return combinedDf.values;
      });

      setStartIdx(startIdx + BATCH_SIZE);

      setLoading(false);
    }
  }, [loading, startIdx, columns])

  useEffect(() => {
    let container = scrollRef.current;

    if (container) {
      container.addEventListener('scroll', handleScroll);
    }

    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScroll);
      }
    };
  }, [handleScroll]);

  return (
    <>
      {
        data.length > 0 && columns.length > 0 && (
          <div
            ref={scrollRef}
            style={{ height: ['auto', '240px'][Number(data.length > 20)], width: '100%', overflowY: 'auto' }}
          >
            <HotTable
              ref={scrollRef}
              data={data}
              colHeaders={columns.map(col => col.title)}
              rowHeaders={true}
              licenseKey="non-commercial-and-evaluation"
              stretchH="all"
              manualColumnResize={true}
              manualRowResize={true}
              height={'auto'}
              width='100%'
              contextMenu={true}
              hiddenColumns={{ columns: [columns.findIndex(col => col.data === 'id')] }}
              columnSorting={true}
            // afterChange={handleAfterChange}
            />
          </div>
        )
      }
    </>
  );
};

function DataTable({ df, header }) {
  return (
    <div className='Table-container Preview-Table-container'>
      <h2>{header}</h2>
      <ScrollableDataTable df={df} />
    </div>
  )
}

export default DataTable;
