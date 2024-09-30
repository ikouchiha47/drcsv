import * as dfd from 'danfojs';

export function* batchDf(df, batchSize = 500, totalRows) {
  for (let start = 0; start < totalRows; start += batchSize) {
    let end = Math.min(start + batchSize, totalRows);

    yield df.iloc({ rows: [`${start}:${end}`] }) // .drop({ columns: ['id'] });
  }
}

export function toDF(columns, values) {
  return new dfd.DataFrame(values, { columns, config: { lowMemoryMode: true } });
}
