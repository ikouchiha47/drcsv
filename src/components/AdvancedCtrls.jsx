import React, { useState } from "react";
import DefaultValueForm, { DefaultTypeForm } from "./DefaultValueForm";
import Portal, { DumbPortal } from "./Portal";
import ApplyTransform from "./ApplyTransform";

const isDefaultValueForm = (formID) => formID === 'default_values';
const isDefaultTypeForm = (formID) => formID === 'default_types';
const isApplyTransformForm = (formID) => formID === 'apply_transform';

function AdvancedCtrl({ df, defaults, handleSanitizer, show }) {
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

  const handleUpdateDf = (data) => {
    return handleSanitizer({
      action: 'update_df_values',
      isOn: activeForm === 'default_values',
      data,
    })
  }

  const handleUpdateTypes = (data) => {
    return handleSanitizer({
      action: 'update_df_types',
      isOn: activeForm === 'default_types',
      data: data,
    })
  }

  const handleApplyTransform = (data) => {
    return handleSanitizer({
      action: 'apply_transform',
      isOn: activeForm === 'apply_transform',
      data: data,
    })
  }

  if (!df) return null;
  if (!show) return null;

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
        <DumbPortal
          title='Transform Values'
          handleClick={() => handleSetActiveForm('apply_transform')}
          showHide={isApplyTransformForm(activeForm)}
        />
      </div>

      {isDefaultTypeForm(activeForm) ? <DefaultTypeForm df={df} updateTypes={handleUpdateTypes} /> : null}
      {isDefaultValueForm(activeForm) ? (
        <DefaultValueForm
          df={df}
          defaults={defaults}
          handleUpdateDefaults={handleUpdateDf} />
      ) : null}
      {isApplyTransformForm(activeForm) ? <ApplyTransform df={df} handleApplyTransform={handleApplyTransform} /> : null}
    </section>
  );
}

export default AdvancedCtrl;
