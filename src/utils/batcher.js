import * as dfd from 'danfojs';

export function* batchDf(df, batchSize = 500) {
  const totalRows = df.shape[0];

  for (let start = 0; start < totalRows; start += batchSize) {
    const end = Math.min(start + batchSize, totalRows - 1);
    yield df.iloc([start, end]).drop({ columns: ['id'] });
  }
}

export function toDF(columns, values) {
  return new dfd.DataFrame(values, { columns });
}
