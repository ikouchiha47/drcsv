import React, { useRef } from "react";
import Select from "react-select";

const dfActions = [
  { label: 'greater', value: 'gt' },
  { label: 'greater equals', value: 'ge' },
  { label: 'lower', value: 'lt' },
  { label: 'lower equals', value: 'le' },
  { label: 'equals', value: 'eq' },
]

function convertDTypeToJS(dtype, value) {
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
    default:
      return null;
  }
}

const selectStyle = {
  option: provided => ({
    ...provided,
    color: 'black'
  }),
  control: provided => ({
    ...provided,
    color: 'black'
  }),
  singleValue: provided => ({
    ...provided,
    color: 'black'
  }),
  menu: base => ({ ...base, zIndex: 999 }),
}

const filterHeaderStyle = {
  marginBottom: '1rem',
  fontSize: '1.25rem',
  fontWeight: 700,
}

const formRowStyle = {
  gap: '1rem',
  alignItems: 'baseline',
  marginBottom: '1px',
}

const inputStyle = { minHeight: '1.5rem', padding: '4px' }

const Filters = ({ df, handleUpdateClauses }) => {
  let columns = df.columns;
  let dtypes = new Map(Array.zip(columns, df.dtypes));

  const colRef = useRef(null);
  const opRef = useRef(null);
  const valRef = useRef(null)

  const validateAndSubmit = () => {
    let currentCol = colRef.current.getValue()[0]
    let currentOp = opRef.current.getValue()[0]

    let values = [
      currentCol && currentCol.value,
      currentOp && currentOp.value,
      valRef.current.value,
    ];

    if (values.some(v => !v)) {
      console.error("some fields were empty")
      return;
    }

    const entries = Object.fromEntries(Array.zip(['column', 'action', 'clause'], values));

    if (dtypes.has(entries.column)) {
      let v = convertDTypeToJS(dtypes.get(entries.column), entries.clause);
      if (!v) {
        console.error("invalid value type")
        return;
      }

      entries.clause = v;
    }

    console.log(entries);
    handleUpdateClauses(entries)
  }

  return (
    <section className="filterForm">
      <h4 style={filterHeaderStyle}>Show Records</h4>
      <div className="filterFormRow flex flex-row" style={formRowStyle}>
        <span style={{ fontWeight: 'bold', fontSize: '1.25rem', color: '#fff' }}>Where</span>
        <Select
          isClearable
          defaultValue={null}
          hideSelectedOptions={true}
          placeholder='Select Column'
          ref={colRef}
          options={columns.map(col => ({ label: col, value: col }))}
          styles={selectStyle}
        />
        <Select
          isClearable
          defaultValue={null}
          hideSelectedOptions={true}
          placeholder='Operator'
          ref={opRef}
          options={dfActions}
          styles={selectStyle}
        />
        <input
          type='text'
          placeholder='Enter value'
          ref={valRef}
          style={inputStyle}
        />
      </div>
      <button
        type="button"
        className="Button Btn-blue"
        onClick={validateAndSubmit}
      >Apply</button>
    </section>
  )
};

export default Filters;
