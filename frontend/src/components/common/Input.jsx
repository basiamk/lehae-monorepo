import React from 'react';

const Input = ({
  label,
  type = 'text',
  name,
  value,
  onChange,
  required = false,
  className = '',
  ...props
}) => {
  return (
    <div className="relative">
      <label htmlFor={name} className="sr-only">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        className={`appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm ${className}`}
        placeholder={label}
        {...props}
      />
    </div>
  );
};

export default Input; 