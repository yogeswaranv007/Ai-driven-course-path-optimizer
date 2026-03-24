// Button component with variants: primary, secondary, destructive, disabled
const Button = ({
  children,
  variant = 'primary',
  size = 'base',
  disabled = false,
  className = '',
  ...props
}) => {
  const baseStyles =
    'font-medium rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95';

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    base: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-base',
  };

  const variantStyles = {
    primary:
      'bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:shadow-lg hover:-translate-y-0.5 hover:from-indigo-500 hover:to-violet-500 focus:ring-indigo-500',
    secondary:
      'border border-gray-200 text-gray-700 bg-white/80 backdrop-blur-sm hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm hover:-translate-y-0.5 focus:ring-indigo-500',
    destructive:
      'bg-red-600 text-white hover:bg-red-500 hover:shadow-lg hover:-translate-y-0.5 focus:ring-red-500',
    outline:
      'border border-indigo-200 text-indigo-600 bg-transparent hover:bg-indigo-50 hover:border-indigo-300 hover:shadow-sm hover:-translate-y-0.5 focus:ring-indigo-500',
  };

  return (
    <button
      disabled={disabled}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
