import ReactFlow, { Background, Controls } from "reactflow";
import "reactflow/dist/style.css";

import { useWorkflow } from "../context/WorkflowContext";
import KnowledgeBaseNode from "../nodes/KnowledgeBaseNode";
import LLMNode from "../nodes/LLMNode";
import OutputNode from "../nodes/OutputNode";
import UserQueryNode from "../nodes/UserQueryNode";

// The nodeTypes definition remains the same (defined outside the component for performance)
const nodeTypes = {
  userQuery: UserQueryNode,
  knowledgeBase: KnowledgeBaseNode,
  llm: LLMNode,
  output: OutputNode,
};

const Canvas = ({ onDrop, onDragOver, setReactFlowInstance }) => {
  // Get all state and handlers from the global context, including our new onEdgeClick
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onNodeClick,
    onEdgeClick, // <-- Get the new handler from the context
  } = useWorkflow();

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick} // <-- Pass the handler to ReactFlow
        onDrop={onDrop}
        onDragOver={onDragOver}
        onInit={setReactFlowInstance}
        nodeTypes={nodeTypes}
        fitView
        className="dark:bg-gray-800"
      >
        <Controls />
        <Background color="#aaa" gap={16} className="dark:bg-gray-900" />
      </ReactFlow>
    </div>
  );
};

export default Canvas;
