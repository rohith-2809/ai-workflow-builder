import { useCallback, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import Canvas from "./components/Canvas";
import ConfigPanel from "./components/ConfigPanel";
import Sidebar from "./components/Sidebar";
import { useWorkflow } from "./context/WorkflowContext";

const App = () => {
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const { setNodes, validateWorkflow, openChat } = useWorkflow();

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      const type = event.dataTransfer.getData("application/reactflow");
      if (typeof type === "undefined" || !type || !reactFlowInstance) return;

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode = {
        id: uuidv4(),
        type,
        position,
        data: { label: `${type.charAt(0).toUpperCase() + type.slice(1)} Node` },
      };
      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );

  return (
    <div className="flex flex-col h-screen w-full bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="flex flex-1 h-full overflow-hidden">
        <Sidebar />
        <main className="flex-1 h-full flex flex-col">
          <div className="flex-1 h-full">
            <Canvas
              onDrop={onDrop}
              onDragOver={onDragOver}
              setReactFlowInstance={setReactFlowInstance}
            />
          </div>
          {/* Control Buttons */}
          <div className="flex justify-center items-center gap-4 p-2 bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={validateWorkflow}
              className="px-4 py-2 font-semibold text-white bg-blue-600 rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75"
            >
              Build Stack
            </button>
            <button
              onClick={openChat}
              className="px-4 py-2 font-semibold text-white bg-green-600 rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-75"
            >
              Chat with Stack
            </button>
          </div>
        </main>
        <ConfigPanel />
      </div>
    </div>
  );
};

export default App;
