import * as duckdb from '@duckdb/duckdb-wasm';

import initSqlJs from 'sql.js';
import { batchDf } from './batcher';

const isValidDate = (value) => {
  const date = new Date(value);
  return !isNaN(date.getTime());
}

const isValidTime = (value) => {
  const timePattern = /^\d{2}:\d{2}:\d{2}$/; // HH:mm:ss format
  return timePattern.test(value);
}

// Add support for Date
function mapToSqlType(dtype) {
  switch (dtype) {
    case 'int32':
    case 'int64':
      return 'BIGINT';
    case 'float32':
    case 'float64':
      return 'REAL';
    case 'bool':
      return 'BOOLEAN';
    case 'object':
    default:
      return 'TEXT';
  }
}

function mapToDuckType(dtype) {
  switch (dtype) {
    case 'int32':
      return 'INTEGER';
    case 'int64':
      return 'BIGINT';
    case 'float32':
    case 'float64':
      return 'FLOAT';
    case 'bool':
      return 'BOOLEAN';
    case 'string':
      return 'VARCHAR';
    default:
      return 'VARCHAR';
  }
}

export class SQLite {
  constructor() {
    this.db = null;
    this.config = { useBigInt: true }
  }

  async init() {
    const SQL = await initSqlJs({
      locateFile: file => `https://sql.js.org/dist/${file}`,
    });
    this.db = new SQL.Database();
    return this;
  }

  _getColumns(df, withoutID = true) {
    const isID = (col) => col && col === 'id';

    return df.columns.filter(col => withoutID ? !isID(col) : true).map(col => col.toLowerCase());
  }

  _overrideDefFields(df, idx) {
    let sample = df.head(100).values.map(row => row[idx]);

    const isDate = sample.every(isValidDate)
    const isTime = sample.every(isValidTime)

    if (isDate) return 'DATE'
    if (isTime) return 'DATETIME'
    return 'TEXT'
  }

  _getColumnDefs(df) {
    let defaultColumns = [['id', 'INTEGER', 'PRIMARY KEY AUTOINCREMENT']];

    let defs = df.columns.map((column, idx) => {
      let colType = mapToSqlType(df.dtypes[idx]);
      if (colType === 'TEXT') colType = this._overrideDefFields(df, idx);

      return [column.toLowerCase(), colType, 'DEFAULT NULL']
    }).filter(col => col && col[0] !== 'id').concat(defaultColumns);

    return defs
  }

  async createTable(tableName, df) {
    const columns = this._getColumnDefs(df);
    const stmt = `CREATE TABLE IF NOT EXISTS ${tableName} (\n${columns.map(frags => frags.join(' ').trim()).join(', ').trim()}\n);`

    console.log("create", stmt);
    this.db.run(stmt, this.config);
  }

  async insertData(tableName, df) {
    const columns = this._getColumns(df);
    const totalRows = df.shape[0];
    const generator = batchDf(df, 500, totalRows);

    for (const batch of generator) {
      const insertSQL = `INSERT INTO ${tableName} (${columns.join(',')}) VALUES `;

      const values = batch.values.map(row => {
        const placeholders = row.map(() => '?').join(', ');
        return `(${placeholders})`;
      }).join(', ');

      const sql = insertSQL + values;

      console.log("insert", batch.shape, batch.values.length);

      const stmt = this.db.prepare(sql);
      const flatValues = batch.values.flat();

      stmt.run(flatValues);
      stmt.free();
    }

    console.log(`Inserted ${totalRows} records into ${tableName}`);
  }

  exec(query) {
    return this.db.exec(query, this.config)
  }

  async loadCSV(tableName, file, df) {
    await this.createTable(tableName, df);
    await this.insertData(tableName, df);
    console.log('Data inserted into SQLite table:', tableName);
  }
}


export class DuckDB {
  constructor() {
    this.db = null;
    this.conn = null;
  }

  async init() {
    if (this.conn) return this.conn;

    const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();

    // Select a bundle based on browser checks
    const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);
    if (!bundle.mainWorker) {
      throw Error("failed to init worker")
    }

    const worker_url = URL.createObjectURL(
      new Blob([`importScripts("${bundle.mainWorker}");`], { type: 'text/javascript' })
    );

    // Instantiate the asynchronus version of DuckDB-wasm
    const worker = new Worker(worker_url);
    const logger = new duckdb.ConsoleLogger();
    const db = new duckdb.AsyncDuckDB(logger, worker);
    await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
    URL.revokeObjectURL(worker_url);

    this.db = db;
    this.conn = await db.connect();
    return this;
  }

  _overrideDefFields(df, idx) {
    let sample = df.head(100).values.map(row => row[idx]);

    const isDate = sample.every(isValidDate)
    const isTime = sample.every(isValidTime)

    if (isDate) return 'DATE'
    if (isTime) return 'TIME'
    return 'VARCHAR'
  }

  exec(query) {
    return this.db.exec(query, this.config)
  }

  // NOTE: this could also be done with CREATE TABLE and COPY
  // to emulate primary key in duckdb, we do;
  // CREATE SEQUENCE seq_id START 1;
  // CREATE TABLE tbl (id INTEGER DEFAULT nextval('seq_id'), s VARCHAR);
  // For now, we are directly saving it from csv file, without df values.
  createImportQuery(df, tableName) {
    const colTypes = df.columns.reduce((acc, column, idx) => {
      let col = column.toLowerCase();
      let duckType = mapToDuckType(df.dtypes[idx])
      if (duckType === 'VARCHAR') duckType = this._overrideDefFields(df, idx)

      acc[col] = duckType;
      return acc;
    }, {})

    return {
      schema: 'main',
      name: tableName,
      detect: false,
      headers: true,
      delimiter: ',',
      columns: colTypes,
    }
  }

  async loadCSV(tableName, file, df) {
    await this.db.importCSVFromPath(file.name, this.createImportQuery(df, tableName));
    console.log('Data inserted into DuckDB table:', tableName);
  }
}
