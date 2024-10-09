export const selectStyle = {
  option: provided => ({
    ...provided,
    color: 'black'
  }),
  control: provided => ({
    ...provided,
    width: '20rem',
    // width: '320px',
    color: 'black'
  }),
  singleValue: provided => ({
    ...provided,
    color: 'black'
  }),
  menu: base => ({
    ...base,
    width: '20rem',
    zIndex: 999,
  }),
}
