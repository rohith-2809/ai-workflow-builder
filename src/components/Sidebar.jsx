const DraggableNode = ({ type, label }) => {
  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData("application/reactflow", nodeType);
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <div
      className="p-3 mb-4 text-center bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-md cursor-grab"
      onDragStart={(event) => onDragStart(event, type)}
      draggable
    >
      {label}
    </div>
  );
};

const Sidebar = () => {
  return (
    <aside className="w-64 p-4 bg-gray-100 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
      <h2 className="text-xl font-bold mb-6">Workflow Components</h2>
      <DraggableNode type="userQuery" label="User Query" />
      <DraggableNode type="knowledgeBase" label="Knowledge Base" />
      <DraggableNode type="llm" label="LLM Engine" />
      <DraggableNode type="output" label="Output" />
    </aside>
  );
};

export default Sidebar;
