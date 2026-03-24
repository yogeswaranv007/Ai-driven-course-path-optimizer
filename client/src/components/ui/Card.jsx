// Card component for consistent container styling
const Card = ({ children, className = '', ...props }) => {
  return (
    <div
      className={`bg-white/90 backdrop-blur-xl rounded-2xl shadow-sm border border-indigo-50/50 p-6 transition-smooth hover:shadow-glow hover:-translate-y-1 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
