import ReactDOM from "react-dom/client";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ReactFlowProvider } from "reactflow";
import App from "./App.jsx";
import { WorkflowProvider } from "./context/WorkflowContext.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <ReactFlowProvider>
    <WorkflowProvider>
      <App />
      <ToastContainer
        position="bottom-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
    </WorkflowProvider>
  </ReactFlowProvider>
);
