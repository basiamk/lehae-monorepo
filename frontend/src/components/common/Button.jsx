import React from 'react';
import { motion } from 'framer-motion';

const variants = {
  primary: 'bg-secondary text-white hover:bg-neutral-800 border border-secondary',
  secondary: 'bg-neutral-100 text-secondary hover:bg-neutral-200 border border-neutral-200',
  outline: 'bg-transparent text-secondary border border-neutral-300 hover:border-secondary hover:bg-neutral-50',
  ghost: 'bg-transparent text-neutral-600 hover:text-secondary hover:bg-neutral-100 border border-transparent',
  danger: 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100',
  accent: 'bg-accent text-white hover:bg-primary-dark border border-accent',
};

const sizes = {
  xs: 'px-3 py-1.5 text-xs rounded-lg',
  sm: 'px-4 py-2 text-sm rounded-xl',
  md: 'px-5 py-2.5 text-sm rounded-xl',
  lg: 'px-7 py-3 text-base rounded-xl',
  xl: 'px-10 py-4 text-lg rounded-2xl',
};

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  type = 'button',
  onClick,
  ...props
}) => {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileTap={disabled ? {} : { scale: 0.97 }}
      whileHover={disabled ? {} : { scale: 1.01 }}
      transition={{ duration: 0.15 }}
      className={`
        inline-flex items-center justify-center gap-2
        font-medium transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant] || variants.primary}
        ${sizes[size] || sizes.md}
        ${className}
      `}
      {...props}
    >
      {children}
    </motion.button>
  );
};

export default Button;