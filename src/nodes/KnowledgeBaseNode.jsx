import { Handle, Position } from "reactflow";

const KnowledgeBaseNode = ({ data }) => {
  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-white dark:bg-gray-800 border-2 border-stone-400">
      <div className="flex">
        <div className="rounded-full w-12 h-12 flex justify-center items-center bg-green-100 dark:bg-green-900">
          KB
        </div>
        <div className="ml-2">
          <div className="text-lg font-bold">Knowledge Base</div>
          <div className="text-gray-500">{data.label}</div>
        </div>
      </div>
      <Handle
        type="target"
        position={Position.Left}
        className="w-2 h-2 !bg-gray-500"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-2 h-2 !bg-teal-500"
      />
    </div>
  );
};

export default KnowledgeBaseNode;
