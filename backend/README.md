## Backend (SQLite Auth + Progress)

### Start API server

```powershell
cd c:\Users\User\Desktop\IELTS
python backend\server.py
```

or start with one click from project root:

```powershell
.\start_backend.bat
```

API runs on:

`http://127.0.0.1:8000`

### Default admin

- Login: `azamat_admin`
- Password: `AA20080608zz`

The server creates SQLite DB file automatically:

`backend/database.db`

### Available endpoints

- `POST /api/register` - create user
- `POST /api/login` - login
- `POST /api/task/complete` - save task completion
- `GET /api/quiz/status?username=<name>&course=<course>&lesson=<n>` - quiz attempt status
- `POST /api/quiz/submit` - save quiz attempt and answers
- `POST /api/homework/submit` - submit homework (text + optional file)
- `GET /api/task/completions?username=<name>` - list completed tasks
- `GET /api/admin/overview?username=<name>` - admin dashboard data
- `GET /api/health` - server health check

