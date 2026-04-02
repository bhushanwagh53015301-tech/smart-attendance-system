# Smart Attendance System

Modern, role-based attendance platform with Student, Teacher, and Admin dashboards built for college use.

## Project Structure

- `frontend/` - Static UI (HTML, CSS, JS)
- `backend/` - FastAPI server with JWT auth and SQLite
- `database/` - SQLite database file (auto-created)
- `assets/` - Shared assets (future)
- `components/` - UI components (future)

## Setup Instructions

### 1. Backend

1. Open a terminal in the project folder.
2. Create a virtual environment:
   - Windows: `python -m venv .venv`
3. Activate it:
   - Windows PowerShell: `.venv\Scripts\Activate.ps1`
4. Install dependencies:
   - `pip install -r backend/requirements.txt`
5. Run the server:
   - `uvicorn backend.main:app --reload`

The API will be available at `http://localhost:8000`.

### 2. Frontend

Open `frontend/index.html` in your browser. Login to access dashboards.

### Live API Configuration

For production hosting, set your backend URL in `frontend/assets/config.js`:

```js
window.SAS_API_BASE = "https://your-backend-domain";
```

Example:

```js
window.SAS_API_BASE = "https://smart-attendance-api.onrender.com";
```

## Sample Login Credentials

- Admin: `admin@smartattendance.edu` / `Admin@123`
- Teacher: `teacher@smartattendance.edu` / `Teacher@123`
- Student: `student@smartattendance.edu` / `Student@123`

## Bonus Features Included

- QR Code attendance (Teacher dashboard)
- CSV export of attendance (Teacher dashboard)
- Student ID login endpoint (`/login-id`)
- Student self-attendance endpoint (`/attendance/self`)
- Email alert simulation for low attendance (Admin dashboard)

## Notes

- SQLite database is generated automatically at `database/attendance.db`.
- CORS is enabled for local development.
