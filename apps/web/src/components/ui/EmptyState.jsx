// Empty state component for pages with no content
const EmptyState = ({ icon: Icon, title, description, action, className = '' }) => {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 ${className}`}>
      {Icon && (
        <div className="w-16 h-16 mb-4 text-gray-400">
          <Icon className="w-full h-full" strokeWidth={1.5} />
        </div>
      )}
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-gray-600 text-center mb-6 max-w-sm">{description}</p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
};

export default EmptyState;
