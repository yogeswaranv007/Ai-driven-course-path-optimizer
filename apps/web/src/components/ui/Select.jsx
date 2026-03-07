// Select component for dropdown fields
const Select = ({
  label,
  error,
  helper,
  disabled = false,
  options = [],
  className = '',
  ...props
}) => {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
      <select
        disabled={disabled}
        className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 bg-white
          focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
          disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
          ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}
          ${className}`}
        {...props}
      >
        <option value="">Select an option</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
      {helper && !error && <p className="text-xs text-gray-500 mt-1">{helper}</p>}
    </div>
  );
};

export default Select;
