import React from "react";

export const ActionError = ({ errors }) => {
  if (!errors) return null;
  if (!errors.length) return null;

  return (
    <ul>
      {errors.map((err, idx) => {
        return <li key={`act-error-${idx}`}>Failed to {err.action}, Reason: {err.message}</li>
      })}
    </ul>
  )
};
