import React, { useRef, useState } from 'react';
import Select from "react-select";
import { selectStyle } from '../styles/react-select-style';

const mapDtypeToClass = (dtype) => {
  switch (dtype) {
    case 'string':
      return String;
    case 'int32':
    case 'float32':
      return Number;
    case 'boolean':
      return Boolean;
    case 'datetime':
      return Date.parse
    default:
      return null;
  }
}

const ApplyTransform = ({ df, handleApplyTransform }) => {
  const selectRef = useRef(null);
  const inputRef = useRef(null);

  const [error, setError] = useState('');

  const options = df.columns.map((col, i) => ({ label: col, value: col, idx: i }));
  const dtypemap = new Map(Array.zip(df.columns, df.dtypes));

  const validateFn = (value, fn, expectedType) => {
    let result = fn(value);

    try {
      let Klassify = mapDtypeToClass(expectedType);
      if (Klassify === null) {
        console.log(`Failed to convert to ${result} to ${expectedType}`)
        return false;
      }

      Klassify(result)
      return true;
    } catch (e) {
      console.error(`Failed to convert to ${result} to ${expectedType}`)
    }

    return false;
  }

  const handleClick = () => {
    const { value: column, idx } = selectRef.current.getValue()[0];
    const fnInput = inputRef.current.value;

    let columnVal = df[column].values[0];
    const applyFunc = new Function('value', `return value && (${fnInput})`);

    try {
      let result = validateFn(columnVal, applyFunc, dtypemap.get(column));

      if (!result) return setError(`Invalid operation, result ${result}`);

      handleApplyTransform({ column, idx, action: 'apply', fn: applyFunc, type: dtypemap.get(column) });
    } catch (err) {
      console.log(`Failed to apply func, ${fnInput}`, err);
      setError(`Failed to apply func ${err.message}`)
    }
  }

  return (
    <section className='Transforms'>
      <h3>Apply Transform To Columns</h3>
      <form className='Form margin-b-m'>
        <div className='flex flex-row' style={{ gap: '16px' }}>
          <Select
            isClearable
            hideSelectedOptions={true}
            ref={selectRef}
            options={options}
            styles={selectStyle}
          />
          <input
            type='text'
            className='Form-input'
            ref={inputRef}
            placeholder={'variable `value` is available, represents a cell value for column'}
          />
        </div>
        <div className='flex flex-row' style={{ gap: '16px' }}>
          <button type='button' className='Button Btn-green' style={{ width: 'max-content' }} onClick={handleClick}>
            Apply
          </button>
          <button type='button' className='Button Btn-yellow' style={{ width: 'max-content' }} onClick={() => handleApplyTransform({ action: 'reset' })}>
            Reset All
          </button>
        </div>
      </form>
      <em style={{ color: '#ddd' }} className='margin-b-m'>This takes a javascript operation as input, for example <code>value.slice(1, -1)</code>, will apply the transformaton and remove the first element from the string.</em>
      <div className='errors' style={{ color: '#24d6f4' }}>
        {error}
      </div>
    </section>
  )
}
export default ApplyTransform;
