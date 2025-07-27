import os
import io
import json
import asyncio
from fastapi import FastAPI, Request, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
# --- CHANGE #1: Import StreamingResponse instead of EventSourceResponse ---
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Dict, Any
from dotenv import load_dotenv

# --- Tool Imports ---
import fitz  # PyMuPDF
import chromadb
from serpapi import GoogleSearch
import google.generativeai as genai

# --- Initializations and Configurations ---
load_dotenv()

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
if not GOOGLE_API_KEY:
    raise ValueError("GOOGLE_API_KEY not found in environment variables. Please check your .env file.")
genai.configure(api_key=GOOGLE_API_KEY)

chroma_client = chromadb.PersistentClient(path="./chroma_db")

# --- Pydantic Models ---
class NodeData(BaseModel):
    label: str
    fileName: str | None = None
    webSearch: bool | None = None
    systemPrompt: str | None = ""

class Node(BaseModel):
    id: str
    type: str
    position: Dict[str, float]
    data: NodeData

class Edge(BaseModel):
    id: str
    source: str
    target: str

class Workflow(BaseModel):
    nodes: List[Node]
    edges: List[Edge]

class QueryRequest(BaseModel):
    workflow: str
    query: str

# --- FastAPI App ---
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Core Logic Functions ---
def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    try:
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        return "".join(page.get_text() for page in doc)
    except Exception as e:
        print(f"Error extracting PDF text: {e}")
        return ""

def get_or_create_collection(name: str):
    return chroma_client.get_or_create_collection(name=name)

def perform_web_search(query: str) -> str:
    SERPAPI_API_KEY = os.getenv("SERPAPI_API_KEY")
    if not SERPAPI_API_KEY: return "SerpAPI key not configured."
    try:
        params = {"api_key": SERPAPI_API_KEY, "engine": "google", "q": query}
        search = GoogleSearch(params)
        results = search.get_dict()
        if "answer_box" in results and "snippet" in results["answer_box"]: return results["answer_box"]["snippet"]
        if "organic_results" in results and "snippet" in results["organic_results"][0]: return results["organic_results"][0]["snippet"]
        return "No direct answer found from web search."
    except Exception as e:
        print(f"Error during SerpAPI search: {e}")
        return "Could not perform web search due to an error."

async def execute_knowledge_base(node: Node, context: Dict[str, Any]) -> Dict[str, Any]:
    print(f"Executing KnowledgeBase Node: {node.data.label}")
    try:
        collection = get_or_create_collection(f"kb_{node.id}")
        if collection.count() == 0:
            context['retrieved_context'] = "Note: The Knowledge Base is empty. Please upload a document."
            return context
        results = collection.query(query_texts=[context['query']], n_results=3)
        context['retrieved_context'] = "\n".join(results['documents'][0])
    except Exception as e:
        context['retrieved_context'] = f"Error retrieving context: {e}"
    return context

async def execute_llm(node: Node, context: Dict[str, Any]) -> Dict[str, Any]:
    print(f"Executing LLM Node: {node.data.label}")

    # --- CHANGE #2: A much better and more explicit prompt for accuracy ---
    prompt_parts = []

    if node.data.systemPrompt:
        prompt_parts.append(f"System Instruction: {node.data.systemPrompt}")

    # This is a standard RAG (Retrieval-Augmented Generation) prompt format
    if context.get('retrieved_context'):
        prompt_parts.append(f"You are answering a question based on the following document context. The context is extracted from a resume. Formulate a complete, natural-sounding sentence for your answer.\n\n--- CONTEXT ---\n{context['retrieved_context']}\n--- END CONTEXT ---")

    if node.data.webSearch:
        print("-> Web search enabled.")
        web_context = perform_web_search(context['query'])
        prompt_parts.append(f"Additionally, use this web context:\n{web_context}")

    prompt_parts.append(f"Based on all available information, please answer this question: {context['query']}")
    final_prompt = "\n\n".join(prompt_parts)
    # --- End of prompt changes ---

    print("-> FINAL PROMPT:\n", final_prompt) # Log the prompt for debugging

    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        context['final_answer_stream'] = model.generate_content(final_prompt, stream=True)
    except Exception as e:
        print(f"Error calling Gemini API: {e}")
        async def error_stream():
            yield f"Error communicating with the LLM: {e}"
        context['final_answer_stream'] = error_stream()

    return context

NODE_EXECUTION_MAP = {"knowledgeBase": execute_knowledge_base, "llm": execute_llm}

# --- API Endpoints ---
@app.post("/api/upload")
async def upload_document(file: UploadFile = File(...), node_id: str = Form(...)):
    if not file.filename.endswith(".pdf"): raise HTTPException(400, "Only PDFs are allowed.")
    text = extract_text_from_pdf(await file.read())
    if not text: raise HTTPException(500, "Could not extract text from PDF.")
    chunks = [p.strip() for p in text.split("\n\n") if p.strip()]
    collection = get_or_create_collection(f"kb_{node_id}")
    collection.add(documents=chunks, ids=[f"{file.filename}_{i}" for i in range(len(chunks))])
    return {"status": "success", "filename": file.filename, "chunks_stored": len(chunks)}

@app.post("/api/query")
async def handle_query(request: QueryRequest):
    try:
        workflow = Workflow(**json.loads(request.workflow))
    except Exception as e:
        raise HTTPException(400, f"Invalid workflow format: {e}")

    try:
        current_node_id = next(n.id for n in workflow.nodes if n.type == 'userQuery')
    except StopIteration:
        raise HTTPException(400, "Workflow must have a 'userQuery' start node.")

    context = {"query": request.query}
    while True:
        try:
            edge = next(e for e in workflow.edges if e.source == current_node_id)
            node = next(n for n in workflow.nodes if n.id == edge.target)
            if node.type in NODE_EXECUTION_MAP:
                context = await NODE_EXECUTION_MAP[node.type](node, context)
            current_node_id = node.id
            if node.type == 'output': break
        except StopIteration: break

    async def stream_generator():
        if 'final_answer_stream' in context:
            try:
                for chunk in context['final_answer_stream']:
                    if hasattr(chunk, 'text') and chunk.text:
                        yield chunk.text
                        await asyncio.sleep(0.01) # Faster streaming
            except Exception as e:
                yield f"Error during streaming: {e}"
        else:
            yield "Workflow completed, but no answer was generated."

    # --- CHANGE #3: Use StreamingResponse for a clean, raw text stream ---
    return StreamingResponse(stream_generator(), media_type="text/event-stream")

@app.get("/")
def read_root(): return {"message": "AI Workflow Builder Backend is running!"}