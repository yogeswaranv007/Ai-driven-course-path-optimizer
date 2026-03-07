// Textarea component for longer text input
const Textarea = ({
  label,
  error,
  helper,
  disabled = false,
  rows = 4,
  className = '',
  ...props
}) => {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
      <textarea
        disabled={disabled}
        rows={rows}
        className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400
          focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
          disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
          resize-none
          ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}
          ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
      {helper && !error && <p className="text-xs text-gray-500 mt-1">{helper}</p>}
    </div>
  );
};

export default Textarea;
