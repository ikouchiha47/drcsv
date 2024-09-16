
import React, { useState } from 'react';
import * as dfd from 'danfojs';

import "./DataUpload.css"

function DataUpload({ onDataProcessed }) {
  // const [df, setDf] = useState(null);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) {
      onDataProcessed(null, '')
      return
    }

    const df = await dfd.readCSV(file);
    // df.fillNa("", { axis: 1 })

    // setDf(df);
    onDataProcessed(df, file.fileName)
  };

  return (
    <div className="DataUpload">
      <input type="file" accept=".csv" onChange={handleFileUpload} />
    </div>
  );
}

export default DataUpload;



// function DataUpload({ onDataProcessed }) {
//   const handleFileUpload = async (event) => {
//     const file = event.target.files[0];
//
//     if (file) {
//       console.log(file)
//
//       // const reader = new FileReader();
//
//       let df = await dfd.readCSV("https://raw.githubusercontent.com/plotly/datasets/master/finance-charts-apple.csv")
//       console.log(df, "df");
//
//       onDataProcessed(df)
//     }
//   }
//
//
//   return (
//     <div className='DataUpload'>
//       <input type="file" accept=".csv" onChange={handleFileUpload} />
//     </div>
//   )
// }


