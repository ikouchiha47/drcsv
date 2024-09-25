import React, { useState } from "react";
import DefaultValueForm, { DefaultTypeForm } from "./DefaultValueForm";
import Portal, { DumbPortal } from "./Portal";

const isDefaultValueForm = (formID) => formID === 'default_values';
const isDefaultTypeForm = (formID) => formID === 'default_types';

function AdvancedCtrl({ df, handleSanitizer }) {
  const [activeForm, setActiveForm] = useState('');

  const removeHeaders = (_, _prev, next) => {
    return handleSanitizer({ action: 'remove_header', isOn: next, data: null })
  }

  const handleSetActiveForm = (targetForm, targetState) => {
    if (targetForm === activeForm) {
      setActiveForm(''); // toggle off
      return
    }

    setActiveForm(targetForm);
  }

  const handleUpdateDf = (df) => {
    return handleSanitizer({
      action: 'update_df_values',
      isOn: activeForm === 'default_values',
      data: df,
    })
  }

  const handleUpdateTypes = (types) => {
    return handleSanitizer({
      action: 'update_df_types',
      isOn: activeForm === 'default_types',
      data: types,
    })
  }

  return (
    <section className="advanced-ctrl margin-b-xl">
      <div className="flex flex-row" style={{ gap: '16px' }}>
        <Portal
          title='Remove Headers'
          handleClick={removeHeaders} />
        <DumbPortal
          title='Update Default Types'
          handleClick={() => handleSetActiveForm('default_types')}
          showHide={isDefaultTypeForm(activeForm)}
        />
        <DumbPortal
          title='Update Default Values'
          handleClick={() => handleSetActiveForm('default_values')}
          showHide={isDefaultValueForm(activeForm)}
        />
      </div>

      {df && isDefaultTypeForm(activeForm) ? <DefaultTypeForm df={df} updateTypes={handleUpdateTypes} /> : null}
      {df && isDefaultValueForm(activeForm) ? <DefaultValueForm df={df} onUpdateDF={handleUpdateDf} /> : null}
    </section>
  );
}

export default AdvancedCtrl;
