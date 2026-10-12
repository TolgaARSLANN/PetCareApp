import React, { forwardRef, useState } from "react";
import { Eye, EyeSlash } from "@phosphor-icons/react";

// ref iç <input>'a iletilir (ör. formun hatalı alana odaklanabilmesi için)
const PasswordInput = forwardRef(({ id, value, onChange, autoComplete, minLength, required, ...rest }, ref) => {
  const [visible, setVisible] = useState(false);
  return (
    <div className="input-with-action">
      <input
        ref={ref}
        id={id}
        type={visible ? "text" : "password"}
        className="input"
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        minLength={minLength}
        required={required}
        {...rest}
      />
      <button
        type="button"
        className="input-action"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Parolayı gizle" : "Parolayı göster"}
        aria-pressed={visible}
      >
        {visible ? <EyeSlash size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
      </button>
    </div>
  );
});

PasswordInput.displayName = "PasswordInput";

export default PasswordInput;
