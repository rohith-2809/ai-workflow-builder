import { useState, useEffect } from 'react';
import { useWorkflow } from '../../context/WorkflowContext';
import { toast } from 'react-toastify';

const OutputConfig = () => {
    const { nodes, edges } = useWorkflow();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // --- NEW: State to trigger the effect ---
    const [currentQuery, setCurrentQuery] = useState('');

    // This effect runs when `currentQuery` is set.
    // This is the correct way to handle fetch side-effects.
    useEffect(() => {
        // Don't run if there's no query to execute
        if (!currentQuery) {
            return;
        }

        // Use AbortController for cleanup. This is crucial for preventing memory leaks
        // and is the key to solving the double-rendering issue.
        const controller = new AbortController();

        const executeQuery = async () => {
            setIsLoading(true);
            // Add a placeholder for the AI response
            setMessages(prev => [...prev, { sender: 'ai', text: '' }]);

            try {
                const response = await fetch('http://localhost:8000/api/query', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        workflow: JSON.stringify({ nodes, edges }),
                        query: currentQuery,
                    }),
                    signal: controller.signal, // Pass the abort signal to fetch
                });

                if (!response.body) return;
                const reader = response.body.getReader();
                const decoder = new TextDecoder();

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value);
                    setMessages(prev => {
                        const updatedMessages = [...prev];
                        const lastMessage = updatedMessages[prev.length - 1];
                        if (lastMessage && lastMessage.sender === 'ai') {
                            lastMessage.text += chunk;
                        }
                        return updatedMessages;
                    });
                }

            } catch (error) {
                if (error.name === 'AbortError') {
                    console.log('Fetch aborted.');
                } else {
                    toast.error(`An error occurred: ${error.message}`);
                    setMessages(prev => {
                        const updatedMessages = [...prev];
                        const lastMessage = updatedMessages[prev.length - 1];
                        if (lastMessage) {
                            lastMessage.text = "Sorry, something went wrong.";
                        }
                        return updatedMessages;
                    });
                }
            } finally {
                setIsLoading(false);
                setCurrentQuery(''); // Reset query after execution
            }
        };

        executeQuery();

        // Cleanup function: This will be called if the component unmounts
        // or if the effect runs again. It cancels the in-flight fetch request.
        return () => {
            controller.abort();
        };

    }, [currentQuery, nodes, edges]); // Effect dependencies

    // The handleSend function is now much simpler.
    // It just updates the UI with the user's message and sets the query to trigger the effect.
    const handleSend = () => {
        if (!input.trim() || isLoading) return;
        setMessages(prev => [...prev, { sender: 'user', text: input }]);
        setCurrentQuery(input); // Trigger the useEffect
        setInput('');
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 bg-white dark:bg-gray-700 rounded-lg p-4 overflow-y-auto mb-4">
                {messages.length === 0 && <div className="text-center text-gray-400">Ask a question to get started.</div>}
                {messages.map((msg, index) => (
                    <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} mb-3`}>
                        <div className={`py-2 px-3 rounded-lg max-w-xs shadow ${msg.sender === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-white'}`}>
                            {msg.text}
                        </div>
                    </div>
                ))}
                {isLoading && messages[messages.length - 1]?.text === '' && (
                     <div className="flex justify-start mb-3">
                        <div className="py-2 px-3 rounded-lg max-w-xs shadow bg-gray-200 dark:bg-gray-600">
                           <div className="flex items-center justify-center space-x-2 h-5">
                                <div className="w-2 h-2 rounded-full bg-gray-500 animate-pulse [animation-delay:-0.3s]"></div>
                                <div className="w-2 h-2 rounded-full bg-gray-500 animate-pulse [animation-delay:-0.15s]"></div>
                                <div className="w-2 h-2 rounded-full bg-gray-500 animate-pulse"></div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <div className="flex flex-shrink-0">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Ask a question..."
                    className="flex-1 p-2 border rounded-l-lg bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:outline-none"
                    disabled={isLoading}
                />
                <button
                    onClick={handleSend}
                    className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-r-lg hover:bg-blue-700 disabled:bg-blue-400"
                    disabled={isLoading}
                >
                    Send
                </button>
            </div>
        </div>
    );
};

export default OutputConfig;