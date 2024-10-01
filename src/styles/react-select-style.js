export const selectStyle = {
  option: provided => ({
    ...provided,
    color: 'black'
  }),
  control: provided => ({
    ...provided,
    width: '320px',
    color: 'black'
  }),
  singleValue: provided => ({
    ...provided,
    color: 'black'
  }),
  menu: base => ({
    ...base,
    width: '320px',
    zIndex: 999,
  }),
}
