import React, { useState, useEffect } from "react";
import Select from "react-select";

import { selectStyle } from "../styles/react-select-style";
import '../Form.css';
import { column } from "mathjs";

const availableDTypes = [
  { value: 'int32', label: 'int32' },
  { value: 'float32', label: 'float32' },
  { value: 'boolean', label: 'boolean' },
  { value: 'string', label: 'string' },
  { value: 'datetime', label: 'datetime' },
];


function DefaultValueForm({ df, defaults, onUpdateDF }) {
  const [defaultValues, setDefaultValues] = useState({});

  console.log("reload", df.columns)

  const handleInputChange = (e, column) => {
    setDefaultValues({
      ...defaultValues,
      [column]: e.target.value,
    });
  };

  const dtypeMap = new Map(Array.zip(df.columns, df.dtypes))

  const handleApplyDefaults = () => {
    onUpdateDF({ defaults: defaultValues });
  };

  if (!df) return null;

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
              placeholder={dtypeMap.get(column)}
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


  useEffect(() => {
    const dtypes = Array.zip(df.columns, df.dtypes)
    const initialTypes = new Map(dtypes);

    setDefaultTypes(Object.fromEntries(initialTypes.entries()));
  }, [df])

  const handleInputChange = (e, column) => {
    if (defaultTypes[column] === e.value) return;

    setDefaultTypes({
      ...defaultTypes,
      [column]: e.value,
    });

    setUpdatedTypes({
      ...updatedTypes,
      [column]: e.value,
    })

  };

  const handleApplyDefaults = () => {
    updateTypes(updatedTypes);
  };

  if (!df) return null;

  const dtypes = Array.zip(df.columns, df.dtypes)

  return (
    <section className='Defaults'>
      <h3>Set Default Types</h3>
      <form className='Form' id='default-value-form'>
        {dtypes.map(([column, typ], idx) => {
          let defaultTyp = defaultTypes[column] || null;
          let defaultVal = null;
          if (defaultTyp) {
            defaultVal = { label: defaultTyp, value: defaultTyp }
          }

          return (
            <div key={idx} className="Form-row">
              <label className='Form-label'>
                {column}:
              </label>
              <Select
                value={defaultVal}
                hideSelectedOptions={true}
                options={availableDTypes}
                styles={selectStyle}
                onChange={(e) => handleInputChange(e, column)}
              />
            </div>
          )
        })}
        <button type="button" className="Submit-button" onClick={handleApplyDefaults}>
          Apply
        </button>
        {/*<em>*Rows missing value in target columns will be dropped*</em>*/}
      </form>
    </section>
  );
}

export default DefaultValueForm;
