/* eslint-disable */
import * as Papa from 'papaparse';

console.log("loading async worker")

const handleMessage = (e) => {
  const { action, data } = e.data;

  console.log(e.data, "data");

  if (action === 'load_async') {
    Papa.parse(data.file, {
      worker: true,
      header: true,
      skipEmptyLines: true,
      delimiter: data.delimiter,
      complete: function(results) {
        console.log("done", results.data.length)
        self.postMessage({ success: true, data: results.data })
      },
      error: function(err) {
        console.error(err);
        self.postMessage({ success: false, error: err })
      }
    });
  }
}

self.onmessage = handleMessage
