import React, { forwardRef, InputHTMLAttributes } from "react";
import clsx from "clsx";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      className,
      id,
      ...props
    },
    ref
  ) => {
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={id}
            className="block mb-1 text-sm font-medium text-gray-700"
          >
            {label}
          </label>
        )}

        <div
          className={clsx(
            "flex items-center border rounded-lg px-3 transition-all",
            error
              ? "border-red-500 focus-within:ring-2 focus-within:ring-red-200"
              : "border-gray-300 focus-within:ring-2 focus-within:ring-blue-200",
            props.disabled && "bg-gray-100 cursor-not-allowed"
          )}
        >
          {leftIcon && (
            <span className="mr-2 text-gray-400">{leftIcon}</span>
          )}

<input
  ref={ref}
  id={id}
  className={clsx(
    "w-full py-2 outline-none bg-transparent text-sm text-black dark:text-white",
    className
  )}
  {...props}
/>


          {rightIcon && (
            <span className="ml-2 text-gray-400">{rightIcon}</span>
          )}
        </div>

        {error ? (
          <p className="mt-1 text-sm text-red-500">{error}</p>
        ) : helperText ? (
          <p className="mt-1 text-sm text-gray-500">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
