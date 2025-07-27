import { Switch } from "@headlessui/react";
import { useEffect, useState } from "react";
import { useWorkflow } from "../context/WorkflowContext";
import KnowledgeBaseConfig from "./config/KnowledgeBaseConfig";
import LLMConfig from "./config/LLMConfig";
import OutputConfig from "./config/OutputConfig"; // This is our Chat Interface

/**
 * ConfigPanel Component
 *
 * This component serves as the main right-hand sidebar for the application.
 * Its primary responsibility is to display the correct view based on the application's state:
 *  1. If the user is in "chat mode," it displays the chat interface (`OutputConfig`).
 *  2. If not, it displays the configuration options for the currently selected node.
 *  3. If no node is selected, it shows a placeholder message.
 *
 * It also contains the UI for toggling between light and dark modes.
 */
const ConfigPanel = () => {
  // --- State Management from Global Context ---
  /**
   * We retrieve state from our global `WorkflowContext`.
   * - `selectedNode`: The node object the user has currently clicked on.
   * - `isChatOpen`: A boolean flag that tells us if we should be in "chat mode."
   * - `setIsChatOpen`: The function to update the chat mode state. We need this for our new "Back" button.
   */
  const { selectedNode, isChatOpen, setIsChatOpen } = useWorkflow();

  // --- Dark Mode State ---
  /**
   * This state handles the visual theme of the application.
   * It initializes its state by directly checking the class list of the root <html> element.
   * This ensures the toggle is in the correct position even on the first render.
   */
  const [isDarkMode, setIsDarkMode] = useState(() =>
    document.documentElement.classList.contains("dark")
  );

  // This effect synchronizes the dark mode toggle with the actual theme.
  // It uses a MutationObserver to watch for changes to the `class` attribute of the <html> tag.
  // This is a robust way to keep the UI in sync if the theme were changed from another part of the app.
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDarkMode(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    // Cleanup function to prevent memory leaks when the component unmounts.
    return () => observer.disconnect();
  }, []);

  /**
   * Toggles the 'dark' class on the root <html> element,
   * which is what Tailwind CSS uses to apply dark mode styles.
   */
  const toggleDarkMode = () => {
    document.documentElement.classList.toggle("dark");
  };

  /**
   * This is the handler for our new "Back" button.
   * It sets the global `isChatOpen` state to false, which tells the component
   * to switch from the chat view back to the node configuration view.
   */
  const handleGoBack = () => {
    setIsChatOpen(false);
  };

  /**
   * This function contains the core conditional logic for the panel.
   * It decides which UI to render based on the global state.
   */
  const renderContent = () => {
    // Priority #1: If chat mode is active, always show the chat interface.
    if (isChatOpen) {
      return <OutputConfig />;
    }

    // Priority #2: If not in chat mode, check if a node is selected.
    if (!selectedNode) {
      return (
        <div className="text-center p-8">
          <p className="text-gray-500">
            Select a node to configure its settings.
          </p>
        </div>
      );
    }

    // Priority #3: If a node is selected, show its specific configuration component.
    switch (selectedNode.type) {
      case "knowledgeBase":
        return <KnowledgeBaseConfig />;
      case "llm":
        return <LLMConfig />;
      // For Output and UserQuery, there's no special config, so we show a default message.
      case "output":
      case "userQuery":
      default:
        return (
          <div className="text-center p-4">
            <p className="text-sm text-gray-400">
              No configuration required for this node.
            </p>
          </div>
        );
    }
  };

  // --- Component JSX ---
  return (
    // The main container is a flex column to manage the header and scrolling content area.
    <aside className="w-96 p-4 bg-gray-100 dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col">
      {/* Header section. 'flex-shrink-0' prevents it from shrinking. */}
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          {/* --- NEW: Back Button --- */}
          {/* This button is only rendered when `isChatOpen` is true. */}
          {isChatOpen && (
            <button
              onClick={handleGoBack}
              className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              title="Back to Configuration"
            >
              {/* Simple SVG for a back arrow icon */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          )}
          {/* The title dynamically changes based on the current mode. */}
          <h3 className="text-xl font-bold">
            {isChatOpen ? "Chat" : "Configuration"}
          </h3>
        </div>

        {/* Dark mode toggle remains on the right. */}
        <div className="flex items-center">
          <span className="text-sm mr-2">{isDarkMode ? "Dark" : "Light"}</span>
          <Switch
            checked={isDarkMode}
            onChange={toggleDarkMode}
            className={`${
              isDarkMode ? "bg-blue-600" : "bg-gray-200"
            } relative inline-flex h-6 w-11 items-center rounded-full transition-colors`}
          >
            <span
              className={`${
                isDarkMode ? "translate-x-6" : "translate-x-1"
              } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
            />
          </Switch>
        </div>
      </div>
      {/* A simple horizontal line to separate the header from the content. */}
      <hr className="mb-4 border-gray-200 dark:border-gray-700 flex-shrink-0" />

      {/*
        This is the main content area.
        'flex-grow' allows it to take up all available vertical space.
        'overflow-y-auto' makes ONLY this div scrollable if its content is too tall.
      */}
      <div className="flex-grow overflow-y-auto">{renderContent()}</div>
    </aside>
  );
};

export default ConfigPanel;
