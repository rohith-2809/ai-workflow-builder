const ChatInterface = () => {
  return (
    <div className="p-4 border-t border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold mb-2">Chat & Test</h3>
      <div className="h-40 bg-white dark:bg-gray-700 rounded-md p-2 mb-2 overflow-y-auto">
        {/* Chat messages would go here */}
      </div>
      <input
        type="text"
        placeholder="Test your workflow..."
        className="w-full p-2 border rounded bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
      />
    </div>
  );
};

export default ChatInterface;
