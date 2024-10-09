import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as dfd from 'danfojs';
import { HotTable } from '@handsontable/react';

import 'handsontable/dist/handsontable.full.css';
import '../Home.css';

const BATCH_SIZE = 50;
const WINDOW_SIZE = 100;

function loadMoreData(df, start, count, totalRows) {
  let end = Math.min(Math.max(0, start) + count, totalRows);

  return df.iloc({ rows: [`${start}:${end}`] });
}

export const ScrollableDataTable = ({ df, classNames, hiddenColumns }) => {
  const [data, setData] = useState([]);
  const [startIdx, setStartIdx] = useState(WINDOW_SIZE);
  const [loading, setLoading] = useState(false);

  const dfRef = useRef(null);
  const scrollRef = useRef(null);

  dfRef.current = df;

  classNames ||= [];
  hiddenColumns ||= []; // [columns.findIndex(col => col.title === 'id')]

  useEffect(() => {
    const loadData = async () => {
      if (!df) return;

      try {
        const initialData = df.head(WINDOW_SIZE);

        setData(initialData.values);
        setStartIdx(initialData.shape[0])

      } catch (err) {
        console.error("Error loading CSV data:", err);
      }
    };

    loadData();
  }, [df]);

  console.log("table", df.size);

  let columns = df.columns.map(name => ({ data: name, title: name }));
  const totalRows = df.shape[0];

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;

    if (startIdx + BATCH_SIZE > totalRows) return;

    if (scrollTop + clientHeight >= scrollHeight - 100 && !loading) {
      setLoading(true);

      let moreData = loadMoreData(dfRef.current, startIdx, BATCH_SIZE, totalRows);

      setData(prevData => {
        const prevDataDf = new dfd.DataFrame(prevData, { columns: columns.map(col => col.title), config: { lowMemoryMode: true } });
        const combinedDf = dfd.concat({ dfList: [prevDataDf, moreData], axis: 0 })

        // console.log("loadmore", prevDataDf.shape[0], moreData.shape[0], combinedDf.shape[0]);
        // const slicedDf = combinedDf.tail(WINDOW_SIZE);
        // console.log("sliced", slicedDf.values.length);
        return combinedDf.values;
      });


      setStartIdx(startIdx + BATCH_SIZE);
      setTimeout(() => {
        setLoading(false);
      }, 0)
    }
  }, [loading, startIdx, columns, totalRows])

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
            style={{ height: ['auto', '720px'][Number(data.length > 20)], width: '100%', overflowY: 'auto' }}
            className={classNames.join(' ')}
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
              className='hottable-overrides'
              hiddenColumns={{ columns: hiddenColumns }}
              columnSorting={true}
            />
          </div>
        )
      }

      <em style={{ marginTop: '1rem', color: '#999' }}> {loading ? `loading...` : ''}&nbsp;</em>
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
