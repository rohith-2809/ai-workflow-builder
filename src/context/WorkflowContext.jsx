import { createContext, useCallback, useContext, useState } from "react";
// Import 'MarkerType' for the arrowheads and 'addEdge' for the connection logic
import { toast } from "react-toastify";
import { addEdge, MarkerType, useEdgesState, useNodesState } from "reactflow";

const WorkflowContext = createContext(null);

export const WorkflowProvider = ({ children }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  /**
   * This function is called when a user successfully connects two nodes.
   * We are enhancing it to create a more stylish and interactive edge.
   */
  const onConnect = useCallback(
    (params) => {
      // Define the new edge with custom properties
      const newEdge = {
        ...params,
        type: "smoothstep", // Gives a nice curved appearance
        animated: true, // Makes the line "march"
        style: {
          strokeWidth: 2,
        },
        markerEnd: {
          // Adds a solid arrowhead
          type: MarkerType.ArrowClosed,
          color: "#2563eb",
        },
      };
      // Use the 'addEdge' utility to add the new edge to our state
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges]
  );

  const onNodeClick = useCallback(
    (event, node) => {
      setSelectedNode(node);
      // When a node is clicked, always ensure we are not in chat mode
      setIsChatOpen(false);
    },
    [setSelectedNode, setIsChatOpen]
  );

  /**
   * --- NEW: Handle Edge Clicks ---
   * When an edge is clicked, we want to make sure the user sees the canvas,
   * not the chat panel. This deselects any node and exits chat mode.
   */
  const onEdgeClick = useCallback(() => {
    setSelectedNode(null);
    setIsChatOpen(false);
  }, [setSelectedNode, setIsChatOpen]);

  const validateWorkflow = () => {
    if (nodes.length < 2) {
      toast.error("Validation Failed: At least two nodes are required.");
      return false;
    }
    for (const node of nodes) {
      const isTarget = edges.some((edge) => edge.target === node.id);
      const isSource = edges.some((edge) => edge.source === node.id);

      if (node.type !== "userQuery" && !isTarget) {
        toast.error(
          `Validation Failed: Node "${node.data.label}" has no incoming connection.`
        );
        return false;
      }

      if (node.type !== "output" && !isSource) {
        toast.error(
          `Validation Failed: Node "${node.data.label}" has no outgoing connection.`
        );
        return false;
      }
    }
    toast.success("Build Stack Validated Successfully!");
    return true;
  };

  const openChat = () => {
    if (validateWorkflow()) {
      setIsChatOpen(true);
    }
  };

  // Add the new onEdgeClick handler to the context value
  const value = {
    nodes,
    setNodes,
    onNodesChange,
    edges,
    setEdges,
    onEdgesChange,
    onConnect,
    selectedNode,
    setSelectedNode,
    onNodeClick,
    onEdgeClick, // <-- Add this here
    validateWorkflow,
    isChatOpen,
    setIsChatOpen,
    openChat,
  };

  return (
    <WorkflowContext.Provider value={value}>
      {children}
    </WorkflowContext.Provider>
  );
};

export const useWorkflow = () => {
  const context = useContext(WorkflowContext);
  if (!context) {
    throw new Error("useWorkflow must be used within a WorkflowProvider");
  }
  return context;
};
