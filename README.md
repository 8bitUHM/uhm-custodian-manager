# Custodian Manager Dashboard

A comprehensive custodian management system built with React, TypeScript, Tailwind CSS, FastAPI, and PostgreSQL, all containerized with Docker Compose.

## **Table of Contents**
1. [Features](#features)
2. [Tech Stack](#tech-stack)
3. [Quick Start](#quick-start)
4. [Development](#development)
5. [API endpoints](#api-endpoints)
6. [Database Schema](#database-schema)
7. [Project Structure](#project-structure)
8. [Contributing](#contributing)
9. [License](#license)

---

## Features

- **Dashboard Overview**: Real-time statistics and activity monitoring
- **Custodian Management**: Add, edit, and track custodian information
- **Building Management**: Manage buildings and their details
- **Task Management**: Create, assign, and track cleaning and maintenance tasks
- **Responsive Design**: Modern UI with Tailwind CSS
- **RESTful API**: FastAPI backend with automatic documentation

## Tech Stack

### Frontend
- React 18 with TypeScript
- Next.js 14
- Tailwind CSS for styling
- Lucide React for icons
- Axios for API calls

### Backend
- FastAPI with Python 3.11
- SQLAlchemy ORM
- PostgreSQL database
- Pydantic for data validation
- Alembic for database migrations

### Infrastructure
- Docker & Docker Compose
- PostgreSQL 15
- Multi-container setup

## Quick Start

### **Prerequisites**
Ensure you have **Python 3.8+** installed. You can check your Python version with:

```sh
python --version
```

or

```sh
python3 --version
```

If Python is not installed, download and install it from [python.org](https://www.python.org/downloads/).

Node is also needed for this project. Download and install node from [here](https://nodejs.org/en/download) if it is not installed.

Should have [**Docker Desktop**](https://www.docker.com/get-started/) installed. If you are unsure what docker desktop is, please refer to [Section 4-6 of Infrastructure & DevOps](https://8bithawaii.org/learning/lessons/infrastructure-devops).

1. **Clone the repository**
   ```bash
   git clone https://github.com/8bitUHM/uhm-custodian-manager.git
   cd uhm-custodian-manager
   ```

2. **Start up docker desktop**

3. **Start the application**
   ```bash
   docker-compose up --build
   ```
   If you are running the application on macOS
   ```bash
   docker compose up --build
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

## Development

### Pulling from main (after PR is merged)
Make sure to re-run `docker-compose up --build` to get the project running. 
For frontend, you will need to run `npm install` before running the compose.

### Running Individual Services

**Frontend only:**
```bash
cd frontend
npm install
npm run dev
```

**Backend only:**
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

**Database only:**
```bash
docker-compose up db
```

### Environment Variables

Copy `env.example` to `.env` and modify as needed:
```bash
cp env.example .env
```

### How to add a new page and route entry point
1. Make a new folder of what the page will be in the src\app folder
2.	Make a tsx file that's named "page.tsx" in the same folder that you created
3.	Add your content on there
4.	Whatever is the folder name will represent the link name
ex: If i make a folder named "about-me" in the src\app folder and I make a page.tsx in the "about-me" folder, the link that will show the content within the same folder will be localhost:3000/about-me

## API Endpoints

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics

### Custodians
- `GET /api/custodians/` - List all custodians
- `POST /api/custodians/` - Create new custodian
- `GET /api/custodians/{id}` - Get custodian by ID

### Buildings
- `GET /api/buildings/` - List all buildings
- `POST /api/buildings/` - Create new building
- `GET /api/buildings/{id}` - Get building by ID

### Tasks
- `GET /api/tasks/` - List all tasks
- `POST /api/tasks/` - Create new task
- `GET /api/tasks/{id}` - Get task by ID

## Database Schema

### Custodians
- Personal information (name, email, phone)
- Employee ID and status
- Hire date and timestamps

### Buildings
- Building details (name, address, code)
- Floor count and description
- Active status

### Tasks
- Task details (title, description, priority)
- Assignment to custodians and buildings
- Status tracking and scheduling

## Project Structure

```
custodian-manager/
├── frontend/                 # Next.js React application
│   ├── src/
│   │   ├── app/             # App router pages
│   │   └── components/      # Reusable components
│   ├── Dockerfile
│   └── package.json
├── backend/                  # FastAPI application
│   ├── main.py              # FastAPI app and routes
│   ├── models.py            # SQLAlchemy models
│   ├── schemas.py           # Pydantic schemas
│   ├── crud.py              # Database operations
│   ├── database.py          # Database configuration
│   ├── Dockerfile
│   └── requirements.txt
├── docker-compose.yml       # Multi-container setup
├── init.sql                 # Database initialization
└── README.md
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
