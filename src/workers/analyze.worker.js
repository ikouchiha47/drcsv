/* eslint-disable */
import * as dfd from 'danfojs';
import { batchDf } from '../utils/batcher';

console.log("loading analyzer");

Array.zip = function(keys, values) {
  return keys.map((key, idx) => [key, values[idx]])
}

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

  // TODO: maybe validateFn here, since its
  // on a single value, its done in the main loop

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

const adjustRows = (df, targetLength, padValue = null) => {
  const newData = df.values.map(row => {
    if (row.length < targetLength) {
      return [...row, ...Array(targetLength - row.length).fill(padValue)];  // Pad shorter rows
    } else if (row.length > targetLength) {
      return row.slice(0, targetLength);  // Truncate longer rows
    }
    return row;
  });

  return [newData, df.columns.slice(0, targetLength)]
  // return new dfd.DataFrame(newData, { columns: df.columns.slice(0, targetLength) });
}

const handleCropping = (self, data) => {
  const { df } = data;
  let newDf = new dfd.DataFrame(df);

  const [values, columns] = adjustRows(newDf, newDf.columns.length)

  self.postMessage({
    action: 'croptable::response',
    data: { columns, values },
  })
}

const handleUpdateDefaults = (self, data) => {
  const { fillCols, fillValues, defaults } = data;

  let df = new dfd.DataFrame(data.df);
  // these are for NaN and undefined
  let newDf = df.fillNa(fillValues, { columns: fillCols })

  const colIdxMap = Object.fromEntries(df.columns.map((col, idx) => [col, idx]));
  const colTransMap = fillCols.map(col => ([colIdxMap[col], defaults[col]]));

  newDf = newDf.apply((row) => {
    colTransMap.forEach(([idx, value]) => {
      if (row[idx] === "") row[idx] = value
    })
    return row;
  }, { axis: 1 })


  self.postMessage({
    action: 'update::dfvalues::response',
    data: { columns: newDf.columns, values: newDf.values }
  });
}

const handleCleanData = (self, data) => {
  let df = new dfd.DataFrame(data.df);

  if (data.reset) {
    Array.zip(df.columns, df.dtypes).forEach(([col, typ]) => {
      try {
        df = df.asType(col, typ)
      } catch (e) {
        console.error(`${col} has null values, and cannot converted back to ${typ}`)
      }
    })
  } else {
    df = df.dropNa()
  }

  self.postMessage({
    action: 'update::dfclean::response',
    columns: df.columns,
    values: df.values,
  })
}

const handleMessage = function(e) {
  const { action } = e.data;

  console.log(e.data, action, "worker");

  switch (action) {
    case 'analyze':
      handleAnalyze(self, e.data)
      return;
    case 'transform::value':
      handleTransform(self, e.data)
      return
    case 'croptable':
      handleCropping(self, e.data)
      return;
    case 'update::dfvalues':
      handleUpdateDefaults(self, e.data)
      return
    case 'update:dfclean':
      handleCleanData(self, e.data)
      return
  }
}

self.onmessage = handleMessage;

