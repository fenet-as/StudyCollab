# StudyCollab 📚🤝

StudyCollab is a collaborative learning platform designed to help students connect, study together, share knowledge, and improve productivity through organized digital collaboration.

The platform aims to create a more interactive and engaging study environment where students can communicate, manage study activities, and work together efficiently.

---

## 🚀 Features

* 🔐 User Authentication & Authorization
* 👥 Create and Join Study Groups
* 💬 Real-time Collaboration & Communication
* 📂 Share Study Resources and Materials
* 📝 Organize Study Sessions and Tasks
* 📱 Responsive User Interface
* ⚡ Fast and Modern Web Experience

---

## 🎯 Project Goals

The goal of StudyCollab is to improve collaborative learning by providing students with a centralized platform where they can:

* Communicate effectively
* Share educational resources
* Study together remotely
* Build productive learning communities
* Improve teamwork and knowledge sharing

---

## 🛠️ Tech Stack

* **Backend:** Java 21+ / Spring Boot 3.2.2, Spring Security, Spring Data JPA, Hibernate
* **Frontend:** React 19, Vite, React Router, Lucide Icons
* **Database:** PostgreSQL 16+
* **Storage & Email:** Cloudflare R2 (S3-compatible object storage) & Resend (optional for local dev)
* **DevOps:** Docker & Docker Compose

---

## 💻 Getting Started Locally

Follow the steps below to set up and run StudyCollab on your local machine.

### 📋 Prerequisites

Before you start, make sure you have the following installed:

1. **Java JDK 21 or later** (JDK 21 or 25 recommended)
   * Verify: `java -version`
   * Ensure `JAVA_HOME` environment variable is configured and points to your JDK directory.
2. **Node.js (v18+) & npm**
   * Verify: `node -v` and `npm -v`
3. **PostgreSQL 16+** (Installed locally or via Docker)
   * Verify local install: `psql -U postgres`
4. **Git**
   * Verify: `git --version`
5. *(Optional)* **Docker Desktop** (if running via Docker Compose)

---

### Option 1: Standard Local Development (Recommended)

#### Step 1: Clone the Repository
```bash
git clone https://github.com/fenet-as/StudyCollab.git
cd StudyCollab
```

#### Step 2: Database Setup
Make sure PostgreSQL is running on port `5432` and create a database named `studycollab`:

* **Using local PostgreSQL (CLI / psql):**
  ```sql
  CREATE DATABASE studycollab;
  ```
* **Or using Docker for just the database:**
  ```bash
  docker run --name studycollab-db -e POSTGRES_DB=studycollab -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:16-alpine
  ```

#### Step 3: Backend Setup (Spring Boot)

1. Open a terminal and navigate to the `backend` directory:
   ```bash
   cd backend
   ```

2. Configure environment variables:
   * A ready-to-use development configuration is provided in `.env.dev`. Copy it to `.env`:
     * **Windows (PowerShell):**
       ```powershell
       Copy-Item .env.dev .env
       ```
     * **macOS / Linux:**
       ```bash
       cp .env.dev .env
       ```
   * Open `backend/.env` and ensure `SPRING_DATASOURCE_PASSWORD` matches your PostgreSQL password (defaults to `123456` or `postgres`).

3. Ensure `JAVA_HOME` is set:
   * **Windows (PowerShell - current session):**
     ```powershell
     $env:JAVA_HOME = "C:\Program Files\Java\jdk-25.0.2" # Adjust to your JDK path
     ```
   * **macOS / Linux:**
     ```bash
     export JAVA_HOME=/path/to/your/jdk
     ```

4. Build and start the backend:
   * **Windows:**
     ```powershell
     .\mvnw.cmd clean compile
     .\mvnw.cmd spring-boot:run
     ```
   * **macOS / Linux:**
     ```bash
     ./mvnw clean compile
     ./mvnw spring-boot:run
     ```

5. Once started, the backend runs at `http://localhost:8080`.
   * Test Health Endpoint: `curl http://localhost:8080/api/health`
     ```json
     {"service":"studycollab-backend","timestamp":"...","status":"UP","database":"UP"}
     ```

#### Step 4: Frontend Setup (React + Vite)

1. Open a **second terminal** and navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```

2. Verify environment configuration:
   * The file `.env.development` is already configured with:
     ```env
     VITE_API_BASE_URL=http://localhost:8080/api
     ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to:
   ```
   http://localhost:5173
   ```

---

### Option 2: Running with Docker Compose

If you have Docker Desktop installed and prefer running all services in containers:

1. In the repository root, copy the environment template:
   * **Windows (PowerShell):**
     ```powershell
     Copy-Item .env.example .env
     ```
   * **macOS / Linux:**
     ```bash
     cp .env.example .env
     ```

2. Start the services:
   ```bash
   docker compose up --build
   ```

3. Access the services:
   * **Frontend:** `http://localhost:5173`
   * **Backend:** `http://localhost:8080`
   * **Database:** `localhost:5432`

---

## 🔧 Common Troubleshooting & Gotchas

* **`JAVA_HOME not found in your environment`**:
  * Set `JAVA_HOME` to your JDK installation path (e.g. `C:\Program Files\Java\jdk-25.0.2` on Windows or `/usr/lib/jvm/...` on Linux).
* **Compilation or cache error during backend build**:
  * Run `mvn clean compile` (or `.\mvnw.cmd clean compile`) to ensure all classes are freshly compiled with the configured Java level.
* **Database connection refused (`Connection to localhost:5432 refused`)**:
  * Verify your PostgreSQL service is running (`Get-Service *postgres*` on Windows or `sudo systemctl status postgresql` on Linux).
  * Verify the username, password, and port in `backend/.env` match your local PostgreSQL credentials.
* **Port conflicts**:
  * Port `8080` (Backend) or `5173` (Frontend) already in use: Close the conflicting process or change the port in `backend/.env` and `frontend/vite.config.js`.

---

## 📁 Repository Structure

```text
StudyCollab/
├── backend/            # Spring Boot REST API
│   ├── src/main/java/  # Java controllers, services, security, models
│   ├── .env.dev        # Development environment template
│   └── pom.xml         # Maven project configuration
├── frontend/           # React 19 + Vite web application
│   ├── src/            # Components, pages, hooks, API clients
│   └── package.json    # Frontend dependencies and scripts
├── docker-compose.yml  # Docker multi-container setup
└── README.md           # Project documentation
```
