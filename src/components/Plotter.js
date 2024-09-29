import React from "react";
import Select from "react-select";

const Plotter = ({ df }) => {
  return (
    <section className="plotter">
      <h3>Plot your results</h3>
      <section className="plotter-ui-container">
        <Select
          isClearable
          isSearchable
          isMulti

        />
      </section>
    </section>
  )
}

export default Plotter;
