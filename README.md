# X-Ray: Intelligent Agentic Workflow Engine

X-Ray is an advanced, AI-powered system designed to visualize the "thought process" of autonomous agents. It transforms natural language user requests into structured, transparent execution workflows. Unlike "black box" AI, X-Ray explicitly visualizes every step: generation, search, filtering, and reasoning.

It currently features intelligent routing between multiple workflows (e.g., **Product Search** and **Blog Recommendations**) and employs a novel **Schema-Agnostic Dynamic Filtering** engine that allows the AI to invent and apply filters based on any data structure without hardcoding.

---

## How to Run

### Prerequisites

- Node.js (v18+ recommended)
- `npm` or `yarn`
- An **OpenAI API Key**

### 1. Backend Setup

The backend handles the AI orchestration, database simulation, and state management.

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure Environment:
   Create a `.env` file in `backend/` and add your key:
   ```env
   OPENAI_API_KEY=sk-your-key-here
   PORT=3000
   ```
4. Start the Server:
   ```bash
   npm run dev
   ```
   _Server runs on `http://localhost:3000`_

### 2. Frontend Setup

The frontend provides a real-time dashboard to watch the agent think and act.

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the UI:
   ```bash
   npm run dev
   ```
   _UI runs on `http://localhost:5173` (typically)_

---

## Features

- **Transparent "Thought" Process**: Visualizes the AI's internal chain of thought. See exactly what keywords were generated, what search results were found, and _why_ specific items were filtered out.
- **Real-Time Streaming (SSE)**: Uses Server-Sent Events to stream execution steps to the UI instantly. The interface updates live as the agent "thinks", "searches", and "evaluates".
- **Intelligent Workflow Routing**: The system analyzes user intent to dynamically select the best strategy (e.g., _Shopping_ intent -> `ProductSearchWorkflow`, _Learning_ intent -> `BlogRecommendationWorkflow`).
- **Dynamic Schema-Agnostic Filtering**: A breakthrough feature where the AI inspects the _structure_ of data (JSON) at runtime to generate valid filter rules (e.g., "Price < 50", "Difficulty == Advanced") without hardcoded logic.
- **"Honest" Debugging**: The system is designed to show failures clearly. If a search yields zero results due to strict filters, it explains _why_ (e.g., "Filter 'Price < $1' excluded all 50 items") rather than hallucinating results.
- **Rich Visualization**:
  - **Highlighted Keywords**: Search terms are highlighted in results.
  - **Tables**: Semantic relevance scores and rankings are shown in structured tables.
  - **Raw Data**: Full JSON artifacts are always available for inspection.

---

## Technology Stack

### Frontend

- **Framework**: React 18 (Vite)
- **Language**: TypeScript
- **State Management**: Redux Toolkit (RTK)
- **Styling**: TailwindCSS
- **Communication**: EventSource API (SSE)

### Backend

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **AI Integration**: OpenAI SDK (GPT-4 / GPT-3.5)
- **Architecture**: Event-Driven (EventEmitter), Strategy Pattern
- **Persistence**: In-Memory `ExecutionStore` (Singleton)

---

## High-Level Design (HLD)

### Backend Architecture

The backend follows a modular, extensible architecture designed for autonomous agents.

1. **Service Layer**:

   - `XRayService`: The main facade. acts as a **Dispatcher**. It accepts a request, initializes the `XRay` core, and uses the `Intent Classification` step to route to the correct Workflow.
   - `OpenAIService` (Singleton): Handles all LLM interactions with centralized logging and configuration.

2. **Workflow Engine (Strategy Pattern)**:

   - `IWorkflow`: The interface that all workflows must implement (`run(input, xray)`).
   - `ProductSearchWorkflow`: Implements search, filtering, and ranking for e-commerce data.
   - `BlogRecommendationWorkflow`: Implements content discovery and difficulty filtering for articles.

3. **Core Logic**:
   - `XRay`: The core execution context. It manages the lifecycle of `Steps`, artifacts, and state.
   - `DynamicFilterService`: A universal service that accepts _any_ dataset, infers its schema (types, enums, ranges), and prompts the LLM to generate code-safe filter rules.
   - `ExecutionStore` (EventEmitter): Stores the state of all executions and emits `update:<id>` events whenever the state changes.

### Frontend Architecture

1. **Store (`executionSlice`)**:

   - Manages the list of executions.
   - Handles the `selected` execution state.
   - Updates state via Redux actions triggered by SSE messages.

2. **Live Updates**:
   - The Dashboard component subscribes to `/api/executions/:id/stream` using the browser's `EventSource`.
   - Incoming JSON events are dispatched directly to Redux, causing immediate re-renders of the timeline and artifacts.

---

## Frontend-Backend Communication

The system uses a **Hybrid Async + Stream** approach to prevent UI freezing and ensure responsiveness.

1. **Request (POST)**:

   - **Frontend** sends `POST /api/executions` with `userInput`.
   - **Backend** creates the Execution ID, sets status to `pending`, and starts the workflow in the **background** (fire-and-forget).
   - **Backend** returns `202 Accepted` with the `{ executionId }` immediately.

2. **Stream (SSE)**:

   - **Frontend** receives the ID and immediately opens an `EventSource` connection to `/api/executions/:id/stream`.
   - **Backend** (via `ExecutionStore` events) pushes a JSON payload every time a Step starts, updates, or finishes.
   - **Frontend** updates the UI in real-time.

3. **Query (GET)**:
   - Standard `GET /api/executions` allows listing past history.
