/* eslint-disable */
import * as dfd from 'danfojs';
import { batchDf } from '../utils/batcher';

console.log("loading analyzer");

const handleAnalyze = (self, data) => {
  const { df, delimiter } = data;
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
  self.postMessage({ action: 'analyze::response', data: { columns, values } });
}

function handleTransform(self, data) {
  const { df, transform: { column, idx, fnode, type, action } } = data;
  const fn = new Function(fnode.var, fnode.body);

  let newDf = new dfd.DataFrame(df);


  // const validateFn = (value, fn, expectedType) => {
  //   let result = fn(value);
  //   let errMsg = `Failed to convert ${value} to ${expectedType}`
  //
  //   try {
  //     // TODO: mapDTypeToClass is defined in ApplyTransform
  //     let Klassify = mapDtypeToClass(expectedType);
  //     if (Klassify === null) {
  //       throw new Error(errMsg);
  //     }
  //
  //     Klassify(result)
  //     return true;
  //   } catch (e) {
  //     console.log(`Worker error message ${e}`);
  //     throw new Error(errMsg)
  //   }
  // }

  try {
    // action === 'apply' && validateFn(column, fn, type);
    if (action !== 'apply') {
      self.postMessage({ action: 'tranform::error', data: { error: `Invalid action` } })
      return
    }

    newDf = newDf.apply((row) => {
      row[idx] = fn(row[idx])
      return row;
    }, { axis: 1 });

    newDf = newDf.asType(column, type)
    self.postMessage({ action: 'transform::success', data: { columns: newDf.columns, values: newDf.values } })

  } catch (e) {
    self.postMessage({ action: 'tranform::error', data: { error: e.message } })
  }
}

const handleMessage = function(e) {
  const { action } = e.data;

  console.log(e.data, action, "worker");

  if (action === 'analyze') {
    handleAnalyze(self, e.data)
    return;
  }

  if (action === 'transform::value') {
    handleTransform(self, e.data)
  }
}

self.onmessage = handleMessage;

