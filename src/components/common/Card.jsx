export default function Card({ 
  children, 
  className = "",
  hover = false,
  padding = "default"
}) {
  const paddingStyles = {
    none: "",
    small: "p-4",
    default: "p-6",
    large: "p-8"
  };

  const hoverStyles = hover 
    ? "hover:shadow-lg hover:-translate-y-1 cursor-pointer" 
    : "";

  return (
    <div className={`bg-white rounded-xl shadow-md transition-all duration-200 ${hoverStyles} ${paddingStyles[padding]} ${className}`}>
      {children}
    </div>
  );
}