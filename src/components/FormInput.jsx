'use client';

import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function FormInput({
  id,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  icon: Icon,
  error,
  required = false,
  autoComplete,
  disabled = false,
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const effectiveType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className="form-group w-full">
      <div className={`input-wrapper ${error ? 'has-error' : ''} ${disabled ? 'is-disabled' : ''}`}>
        {Icon && (
          <span className="input-icon-left">
            <Icon size={18} />
          </span>
        )}

        <input
          id={id || name}
          name={name}
          type={effectiveType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          disabled={disabled}
          className={`custom-input ${Icon ? 'with-left-icon' : ''} ${isPassword ? 'with-right-icon' : ''}`}
        />

        {isPassword && (
          <button
            type="button"
            className="input-icon-right"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>

      {error && <span className="input-error-msg">{error}</span>}
    </div>
  );
}
