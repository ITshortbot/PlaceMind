# PlaceMind
Students preparing for placements often use many separate tools for resumes, coding practice, learning, and interview preparation, which makes the process confusing and inefficient. The proposed platform brings these activities into one AI-powered system that gives personalized guidance, tracks progress, and improves placement readiness .


# PlaceMind 🚀

PlaceMind is an AI-powered placement platform designed to streamline the hiring process through intelligent resume analysis, mock interviews, and career roadmap generation[cite: 1].

## 🏗️ High-Level Architecture

PlaceMind utilizes a highly scalable, dual-backend microservices architecture to separate standard web traffic from heavy AI workloads[cite: 1]:

*   **API Gateway (Node.js/Express):** Handles the "fast" CRUD operations, authentication (JWT), and HTTP routing[cite: 1].
*   **AI Service (Python/FastAPI):** Runs heavy AI/ML workloads in isolation, utilizing the Gemini LLM for high-performance async AI calls[cite: 1].
*   **Frontend (React + TS):** A modern Single Page Application providing a type-safe, fast user experience[cite: 1].

## ✨ Core Features

*   **Resume Intelligence:** Parses uploaded PDFs/DOCXs, extracts skills, compares them against job descriptions, and calculates ATS match scores[cite: 1].
*   **Mock Interview Engine:** Adapts technical and HR questions in real-time based on sentiment and correctness, storing history for review[cite: 1].
*   **Career Roadmap Generator:** Builds ordered milestones and timelines based on academic year, CGPA, and current skills using graph traversal[cite: 1].
*   **Course Recommendation Engine:** Suggests ranked learning resources using collaborative filtering and content-based skill tags[cite: 1].
*   **Hiring Prediction:** Uses gradient boosting (XGBoost) and Gemini insights to calculate the probability of placement per company[cite: 1].

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 18+, TypeScript, Vite, Tailwind CSS, Redux Toolkit[cite: 1] |
| **Gateway API** | Node.js, Express.js, TypeScript[cite: 1] |
| **AI Microservices** | Python 3.12, FastAPI, Google Gemini API[cite: 1] |
| **Database** | PostgreSQL 15, Prisma ORM[cite: 1] |
| **Cache** | Redis 7[cite: 1] |
| **Storage** | MinIO (S3-compatible)[cite: 1] |
| **Orchestration** | Docker Compose[cite: 1] |

## 🚀 Local Development (Getting Started)

We use Docker Compose to ensure a consistent development environment across all operating systems and machines.

### Prerequisites
*   [Docker](https://docs.docker.com/get-docker/) installed and running.
*   [Docker Compose](https://docs.docker.com/compose/install/) installed.
*   Git installed.

### Quick Start

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/your-username/placemind.git](https://github.com/your-username/placemind.git)
    cd placemind
    ```

2.  **Set up environment variables:**
    Copy the example environment files and populate them with your specific keys (like your Gemini API key and database credentials)[cite: 1].
    ```bash
    cp src/backend/.env.example src/backend/.env
    cp src/ai-services/ai.env.example src/ai-services/.env
    ```

3.  **Build and spin up the containers:**
    ```bash
    docker compose up --build
    ```

### Services & Ports

Once Docker Compose is running, the following services will be available:

*   **Frontend (React):** `http://localhost:5173`
*   **Node/Express Gateway:** `http://localhost:3000`
*   **FastAPI AI Service:** `http://localhost:8000`
*   **PostgreSQL:** `localhost:5432`
*   **Redis:** `localhost:6379`
*   **MinIO Console:** `http://localhost:9001`

## 🧪 Testing Strategy

*   **Unit Tests:** Jest for TypeScript, PyTest for Python[cite: 1].
*   **Integration Tests:** Supertest for Node API contracts, TestClient for FastAPI[cite: 1].

To run tests locally within the containers:
```bash
docker exec -it placemind-backend npm run test
docker exec -it placemind-ai pytest tests/