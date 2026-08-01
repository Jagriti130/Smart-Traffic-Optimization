# Deployment Guide

## 1. Backend on Render

1. Create a new Web Service in Render.
2. Connect this repository.
3. Use the following settings:
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
4. Render will expose the backend API URL.

## 2. Frontend on Vercel

1. Import the repository into Vercel.
2. Set the frontend folder as the project root.
3. Add the environment variable:
   - `REACT_APP_API_URL=https://<your-render-backend-url>/api`
4. Deploy.

## 3. Local preview

- Backend: `python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000`
- Frontend: `cd frontend && npm start`
