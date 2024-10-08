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

const reservedKeywords = new Set([
  "select", "from", "table",
  "insert", "into",
  "where", "case",
  "having",
]);

export function sanitizeHeader(header) {
  let sanitized = header
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_]/g, '')
    .replace(/^[0-9]/, '_$&')
    .toLowerCase();

  if (reservedKeywords.has(sanitized)) {
    sanitized = sanitized + '_col';  // Append '_col' if it's a reserved keyword
  }

  return sanitized;
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
    case 'datetime':
      return 'DATETIME';
    case 'object':
    default:
      return 'TEXT';
  }
}

function mapToDuckType(dtype) {
  switch (dtype) {
    case 'int32':
      return 'INTEGER'
    case 'int64':
      return 'BIGINT'
    case 'float32':
    case 'float64':
      return 'FLOAT';
    case 'bool':
    case 'boolean':
      return 'BOOLEAN';
    case 'string':
      return 'VARCHAR'
    default:
      return 'BLOB';
  }
}

export const DBEvents = Object.freeze({
  INIT: 'init',
  SEED: 'seed',
  EXEC: 'exec',
  RUN: 'run',
  ERROR: 'error',
  SUCCESS: 'success',
})

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

  _getColumns(df) {
    // const isID = (col) => col && col === 'id';
    return df.columns.map(col => col.toLowerCase());
  }

  _overrideDefFields(df, idx) {
    let sample = df.head(100).values.map(row => row[idx]);

    const isDate = sample.every(isValidDate)
    const isTime = sample.every(isValidTime)

    if (isDate) return 'DATE'
    if (isTime) return 'DATETIME'
    return 'TEXT'
  }

  _hasDB() {
    if (this.db) return true;

    throw new Error("DBError", {
      message: 'Db not initialized'
    })
  }

  _getColumnDefs(df) {
    let defaultColumns = [['id', 'INTEGER', 'PRIMARY KEY AUTOINCREMENT']];

    let defs = df.columns.map((column, idx) => {
      let colType = mapToSqlType(df.dtypes[idx]);
      if (colType === 'TEXT') colType = this._overrideDefFields(df, idx);

      return [column.toLowerCase(), colType, 'DEFAULT NULL']
    });

    if (!df.columns.includes('id')) {
      defs = defaultColumns.concat(defs.filter(col => col && col[0] !== 'id')) //.concat(defaultColumns)
    }

    return defs
  }

  async createTable(tableName, df) {
    this._hasDB();

    const columns = this._getColumnDefs(df);

    // console.log("columns", columns, "tablename", tableName)
    const stmt = `CREATE TABLE IF NOT EXISTS ${tableName} (\n${columns.map(frags => frags.join(' ').trim()).join(', ').trim()}\n);`

    console.log("create", stmt);
    this.db.run(stmt, this.config);
  }

  async insertBatch(tableName, columns, batch) {
    return new Promise((resolve, reject) => {
      const insertSQL = `INSERT INTO ${tableName} (${columns.join(',')}) VALUES `;

      const values = batch.values.map(row => {
        const placeholders = row.map(() => '?').join(', ');
        return `(${placeholders})`;
      }).join(', ');

      const sql = insertSQL + values;

      // console.log("insert", sql, batch.values.flat());

      const stmt = this.db.prepare(sql);
      const flatValues = batch.values.flat();

      stmt.run(flatValues);
      stmt.free();
      resolve({ success: true })
    })
  }

  async insertData(tableName, df) {
    this._hasDB()

    const columns = this._getColumns(df);
    const totalRows = df.shape[0];
    const generator = batchDf(df, 1000, totalRows);

    console.log("inserting data")

    let resolvers = [];

    for (const batch of generator) {
      resolvers.push(this.insertBatch(tableName, columns, batch));
    }

    console.log(`Inserted ${totalRows} records into ${tableName}`);
    let results = await Promise.allSettled(resolvers)

    let hasError = results.find(result => result.status === 'rejected');
    console.log("insert has error", hasError.reason);

    if (hasError) throw new Error('SqlInsertError', {
      cause: hasError.reason.message,
    })

    return totalRows;
  }

  exec(query) {
    this._hasDB();

    return this.db.exec(query, this.config)
  }

  async loadCSV(tableName, file, df) {
    await this.createTable(tableName, df);
    const totalRows = await this.insertData(tableName, df);

    console.log('Data inserted into SQLite table:', tableName);

    return totalRows
  }
}


export class DuckDB {
  constructor(delimiter) {
    this.db = null;
    this.conn = null;
    this.delimiter = delimiter || ','
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

    console.log("connected");

    return this;
  }

  _overrideDefFields(df, idx) {
    let sample = df.head(100).values.map(row => row[idx]);

    const isDate = sample.every(isValidDate)
    const isTime = sample.every(isValidTime)

    if (isDate) return 'TIME'
    if (isTime) return 'TIMESTAMP'
    return 'BLOB'
  }

  _hasDB() {
    if (this.db && this.conn) return true;

    throw new Error("DBError", {
      message: 'Db not initialized'
    })
  }

  _getColumnDefs(df) {
    // let defaultColumns = [['id', 'INTEGER', "PRIMARY KEY DEFAULT nextval('seq_id')"]];
    let defaultColumns = []

    let defs = df.columns.map((column, idx) => {
      let colType = mapToDuckType(df.dtypes[idx]);
      if (colType === 'BLOB') colType = this._overrideDefFields(df, idx);

      return [column.toLowerCase(), colType, 'DEFAULT NULL']
    }).filter(col => col && col[0] !== 'id').concat(defaultColumns);

    return defs
  }

  async createTable(tableName, df) {
    this._hasDB();

    const columns = this._getColumnDefs(df);
    const stmt = `CREATE SEQUENCE seq_id START 1; CREATE TABLE IF NOT EXISTS ${tableName} (\n${columns.map(frags => frags.join(' ').trim()).join(', ').trim()}\n);`

    console.log("create", stmt);

    await this.exec(stmt, true);
    return true;
  }

  async insertData(tableName, fileName) {
    this._hasDB();

    // let stmt = `SELECT * FROM read_csv('${fileName}', name='${tableName}', delim='${this.delimiter}', header=true, columns=${JSON.stringify(colDefs)})`
    let stmt = `COPY ${tableName} FROM '${fileName}' (FORMAT CSV, DELIMITER '${this.delimiter}', HEADER)`
    console.log("insert", stmt);

    await this.exec(stmt, true)
    return true
  }

  async exec(query, writeMode) {
    this._hasDB()

    let result = await this.conn.query(query)
    if (writeMode) {
      return result
    }

    // const columns = result.schema.fields.map(field => field.name); // Extract column names
    const parsedResult = result.toArray().map(v => v.toJSON());
    const columns = Object.keys(parsedResult[0])

    const data = {
      columns: columns,
      values: parsedResult.map(result => Object.values(result).map(value => {
        if (typeof value === 'bigint') {
          return Number(value);
        }
        return value;
      }))
    }

    console.log("ducky", data);

    return data
  }

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
      delimiter: this.delimiter,
      columns: colTypes,
    }
  }

  async _count(tableName) {
    const query = `SELECT COUNT(1) AS total FROM ${tableName}`;
    const result = await this.conn.query(query);

    console.log(result, "duck");

    const count = result.get('total')[0];
    return count
  }

  async loadCSV(tableName, file, df) {
    // await this.conn.insertCSVFromPath(file.name, this.createImportQuery(df, tableName));

    let reader = new FileReader();

    reader.onload = async (e) => {
      const csvContent = e.target.result;

      console.log(csvContent);

      await this.db.registerFileText(file.name, csvContent);

      // const opts = this.createImportQuery(df, tableName)
      // console.log(opts, "opts")

      await this.createTable(tableName, df);
      await this.insertData(tableName, file.name);

      console.log('Data inserted into DuckDB table:', tableName);
    }

    reader.readAsText(file)

    return 0;
  }
}
