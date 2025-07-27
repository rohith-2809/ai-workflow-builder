const Tooltip = ({ text, children }) => {
  return (
    <div className="relative flex items-center group">
      {children}
      <div className="absolute left-full ml-4 w-48 px-2 py-1 bg-gray-800 text-white text-sm rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
        {text}
      </div>
    </div>
  );
};

export default Tooltip;
