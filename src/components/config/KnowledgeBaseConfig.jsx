import { toast } from "react-toastify";
import { useWorkflow } from "../../context/WorkflowContext";
import Tooltip from "../Tooltip";

const KnowledgeBaseConfig = () => {
  const { selectedNode, setNodes } = useWorkflow();

  const handleFileChange = async (e) => {
    // --- LOG #1: Check if the function is even being called ---
    console.log("🔥 handleFileChange FUNCTION CALLED!");

    const file = e.target.files[0];

    // --- LOG #2: Check if we have a valid file object ---
    console.log("Selected file object:", file);

    if (!file) {
      console.log("No file selected, exiting function.");
      return;
    }

    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === selectedNode.id) {
          return { ...node, data: { ...node.data, fileName: file.name } };
        }
        return node;
      })
    );

    const formData = new FormData();
    formData.append("file", file);
    formData.append("node_id", selectedNode.id);

    // --- LOG #3: Check if we are about to make the request ---
    console.log("✅ Preparing to send fetch request with this data:", formData);

    try {
      const response = await fetch("http://localhost:8000/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "File upload failed");
      }

      const result = await response.json();
      toast.success(
        `Successfully stored ${result.chunks_stored} chunks from ${result.filename}!`
      );
    } catch (error) {
      toast.error(error.message);
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === selectedNode.id) {
            const { fileName, ...restData } = node.data;
            return { ...node, data: restData };
          }
          return node;
        })
      );
    }
  };

  return (
    <div className="space-y-4 p-1">
      <h4 className="font-bold text-lg">{selectedNode.data.label}</h4>
      <div>
        <label className="block text-sm font-medium mb-1">
          Knowledge Base File (PDF)
        </label>
        <Tooltip text="Upload a PDF document. It will be automatically processed and stored in the vector database.">
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 dark:file:bg-blue-900 file:text-blue-700 dark:file:text-blue-200 hover:file:bg-blue-100"
          />
        </Tooltip>
        {selectedNode.data.fileName && (
          <p className="text-xs text-green-500 mt-1">
            File Loaded: {selectedNode.data.fileName}
          </p>
        )}
      </div>
      <div>
        <label
          htmlFor="embedding-model"
          className="block text-sm font-medium mb-1"
        >
          Embedding Model
        </label>
        <Tooltip text="The Gemini model used to create vector embeddings for the document.">
          <select
            id="embedding-model"
            className="w-full p-2 border rounded bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
            disabled
          >
            <option>models/embedding-001 (Default)</option>
          </select>
        </Tooltip>
      </div>
    </div>
  );
};

export default KnowledgeBaseConfig;
