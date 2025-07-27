import { Switch } from "@headlessui/react";
import { useWorkflow } from "../../context/WorkflowContext";
import Tooltip from "../Tooltip";

const LLMConfig = () => {
  const { selectedNode, setNodes } = useWorkflow();

  const handleToggle = (enabled) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === selectedNode.id) {
          return { ...node, data: { ...node.data, webSearch: enabled } };
        }
        return node;
      })
    );
  };

  return (
    <div className="space-y-4">
      <h4 className="font-bold text-lg">{selectedNode.data.label}</h4>
      <div>
        <label className="block text-sm font-medium mb-1">
          System Prompt (Optional)
        </label>
        <Tooltip text="A custom prompt to guide the LLM's behavior and responses.">
          <textarea
            rows="4"
            placeholder="e.g., You are a helpful AI assistant."
            className="w-full p-2 border rounded bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
          />
        </Tooltip>
      </div>
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium">
          Enable Web Search (SerpAPI)
        </label>
        <Tooltip text="Allows the LLM to search the web for real-time information.">
          <Switch
            checked={selectedNode.data.webSearch || false}
            onChange={handleToggle}
            className={`${
              selectedNode.data.webSearch ? "bg-blue-600" : "bg-gray-400"
            } relative inline-flex h-6 w-11 items-center rounded-full transition-colors`}
          >
            <span
              className={`${
                selectedNode.data.webSearch ? "translate-x-6" : "translate-x-1"
              } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
            />
          </Switch>
        </Tooltip>
      </div>
    </div>
  );
};

export default LLMConfig;
