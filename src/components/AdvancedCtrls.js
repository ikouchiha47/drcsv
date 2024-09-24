import React from "react";
import Portal from "./Portal";

function AdvancedCtrl({ df, handleSanitizer }) {
  const removeHeaders = (_, _prev, next) => {
    return handleSanitizer({ action: 'remove_header', isOn: next })
  }

  return (
    <section className="advanced-ctrl margin-b-xl">
      <Portal
        title='Remove Headers'
        handleClick={removeHeaders} />
    </section>
  );
}

export default AdvancedCtrl;
