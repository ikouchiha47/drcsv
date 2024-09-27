import React, { useState, useEffect } from "react";

import '../Form.css';

const availableDTypes = [
  { value: 'int32', label: 'int32' },
  { value: 'float32', label: 'float32' },
  { value: 'boolean', label: 'boolean' },
  { value: 'string', label: 'string' },
];

function mapDTypeToJS(dtype, value) {
  switch (dtype) {
    case 'int32':
    case 'int64':
    case 'float32':
    case 'float64':
      return Number(value);
    case 'bool':
    case 'boolean':
      return Boolean(value);
    case 'string':
      return String(value)
    case 'object':
    default:
      return JSON.stringify(value);
  }
}

function DefaultValueForm({ df, onUpdateDF }) {
  const [defaultValues, setDefaultValues] = useState({});

  const handleInputChange = (e, column) => {
    setDefaultValues({
      ...defaultValues,
      [column]: e.target.value,
    });
  };

  const dtypeMap = new Map(Array.zip(df.columns, df.dtypes))

  const handleApplyDefaults = () => {
    let newDf = df.copy();

    for (let column in defaultValues) {
      if (defaultValues[column]) {
        newDf[column] = newDf[column].fillNa(mapDTypeToJS(dtypeMap.get(column) || 'string', defaultValues[column]));
      }
    }

    onUpdateDF(newDf);
  };

  return (
    <section className='Defaults'>
      <h3>Set Default Values</h3>
      <form className='Form' id='default-value-form'>
        {df.columns.map((column, idx) => (
          <div key={idx} className="Form-row">
            <label className='Form-label'>
              {column}:
            </label>
            <input
              type="text"
              className="Form-input"
              onChange={(e) => handleInputChange(e, column)}
            />
          </div>
        ))}
        <button type="button" className="Submit-button" onClick={handleApplyDefaults}>
          Apply Default Values
        </button>
      </form>
    </section>
  );
}

export function DefaultTypeForm({ df, updateTypes }) {
  const [defaultTypes, setDefaultTypes] = useState({});
  const [updatedTypes, setUpdatedTypes] = useState({});

  const dtypes = Array.zip(df.columns, df.dtypes)

  useEffect(() => {
    const dtypes = Array.zip(df.columns, df.dtypes)
    const initialTypes = new Map(dtypes);

    setDefaultTypes(Object.fromEntries(initialTypes.entries()));
  }, [df])

  const handleInputChange = (e, column) => {
    if (defaultTypes[column] === e.target.value) return;

    setDefaultTypes({
      ...defaultTypes,
      [column]: e.target.value,
    });

    setUpdatedTypes({
      ...updatedTypes,
      [column]: e.target.value,
    })

  };

  const handleApplyDefaults = () => {
    updateTypes(updatedTypes);
  };

  return (
    <section className='Defaults'>
      <h3>Set Default Types</h3>
      <form className='Form' id='default-value-form'>
        {dtypes.map(([column, typ], idx) => (
          <div key={idx} className="Form-row">
            <label className='Form-label'>
              {column}:
            </label>
            <input
              type="text"
              value={defaultTypes[column] || ''}
              className="Form-input"
              onChange={(e) => handleInputChange(e, column)}
            />
          </div>
        ))}
        <button type="button" className="Submit-button" onClick={handleApplyDefaults}>
          Apply
        </button>
        {/*<em>*Rows missing value in target columns will be dropped*</em>*/}
      </form>
    </section>
  );
}

export default DefaultValueForm;
