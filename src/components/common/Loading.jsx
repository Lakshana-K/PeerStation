export default function Loading({
  size = "md",
  text = "Loading...",
  fullScreen = false
}) {
  const sizes = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
    xl: "w-16 h-16"
  };

  return (
    <div
      className={`flex flex-col items-center justify-center ${
        fullScreen ? "min-h-screen bg-gray-50" : "py-12"
      }`}
      data-loading="true"
    >
      <div
        className={`${sizes[size]} border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin`}
      />
      {text && (
        <p className="mt-4 text-gray-600 font-medium">
          {text}
        </p>
      )}
    </div>
  );
}
