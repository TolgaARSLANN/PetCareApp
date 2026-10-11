import React from "react";

// Etiket + alan + yardım metni. Yardım metni aria-describedby ile alana bağlanır.
const Field = ({ id, label, hint, required = false, optional = false, className = "", children }) => {
  const hintId = hint ? `${id}-hint` : undefined;
  const control = React.isValidElement(children)
    ? React.cloneElement(children, {
        id,
        required: required || children.props.required,
        "aria-describedby": [children.props["aria-describedby"], hintId].filter(Boolean).join(" ") || undefined,
      })
    : children;

  return (
    <div className={`field ${className}`}>
      <label htmlFor={id} className="field-label">
        {label}
        {required && <span className="field-required" aria-hidden="true"> *</span>}
        {optional && <span className="field-optional"> (isteğe bağlı)</span>}
      </label>
      {control}
      {hint && (
        <p id={hintId} className="field-hint">
          {hint}
        </p>
      )}
    </div>
  );
};

export default Field;
