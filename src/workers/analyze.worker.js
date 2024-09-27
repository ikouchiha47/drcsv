/* eslint-disable */
import * as dfd from 'danfojs';
import { batchDf } from '../utils/batcher';

console.log("loading analyzer");

const handleMessage = function(e) {
  const { df, delimiter } = e.data;
  const newDf = new dfd.DataFrame(df);

  const origCols = newDf.columns;
  const nHeaders = newDf.columns.length;
  let generator = batchDf(newDf, 1000, newDf.shape[0])

  const hasMismatchCols = (values) => {
    // filter undefined because, json-ing fucks it up
    return values.filter(value => value !== undefined).length !== nHeaders;
  }

  const getColumnName = (_, i) => {
    return i < nHeaders ? origCols[i] : `extra_${i + 1}`
  }

  let issues = [];
  let maxColumnLen = nHeaders;

  for (const bDf of generator) {
    const offenders = bDf.values.filter(hasMismatchCols);

    maxColumnLen = Math.max.apply(
      null,
      [maxColumnLen].concat(offenders.map(off => off.length))
    );

    issues = issues.concat(offenders)
  }

  const columns = Array.from(Array(maxColumnLen)).map(getColumnName);


  const values = issues.map(values => {
    if (values.length === maxColumnLen) return values;
    // At this point, there can't be any values, whose
    // length is greater than maxLen, duh

    let extras = [];
    for (let i = 0; i < (maxColumnLen - values.length); i++) {
      extras.push(delimiter)
    }
    return values.concat(extras);
  })

  // Return results
  self.postMessage({ action: 'column_mismatch', data: { columns, values } });
}

self.onmessage = handleMessage;

