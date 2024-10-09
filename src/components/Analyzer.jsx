import React, { useState, useEffect } from 'react';
import * as dfd from 'danfojs';

import { ScrollableDataTable } from './DataTable';

const worker = new Worker(
  new URL('../workers/analyze.worker.js', import.meta.url),
  { type: "module" }
);

const CSVAnalyzer = ({ df, delimiter, show }) => {
  const [status, setStatus] = useState(null);
  const [offenderDf, setOffenderDf] = useState(null);

  useEffect(() => {
    const analyzeCSV = (df) => {
      setStatus('Analysing');

      // Handle messages from the worker
      worker.onmessage = (e) => {
        const { action, data } = e.data;

        // console.log("data", data)
        if (action === 'analyzer::response') {
          const { columns, values } = data;

          if (values.length) {
            const ofDf = new dfd.DataFrame(values, { columns });
            setOffenderDf(ofDf);
            setStatus(null)
          } else {
            setStatus('Data looks good')
          }

          return;
        }

        setStatus(null);
      };

      worker.onerror = (error) => {
        console.error('Worker error:', error);
        setStatus(`Something went wrong`);
      };


      worker.postMessage({ action: 'analyze', df: dfd.toJSON(df, { format: 'row' }), delimiter });
    };

    analyzeCSV(df);

    return () => {
      worker.onmessage = null;

      setStatus(null)
      setOffenderDf(null)
    }
  }, [df])

  if (!df) return null;

  return (
    <div>
      <hr className='separator' />
      {show ? <h3 className='margin-b-m'>Analysis Results:</h3> : null}
      {status && <p style={{ fontSize: '1.5rem' }}>{status}...</p>}
      {offenderDf && (
        <div>
          <ScrollableDataTable df={offenderDf} />
        </div>
      )}
    </div>
  );
}

export default CSVAnalyzer;
