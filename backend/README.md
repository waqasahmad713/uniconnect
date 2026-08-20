# UniConnect Backend

FastAPI API for UniConnect.

From this folder:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

API docs: [http://localhost:8000/docs](http://localhost:8000/docs)  
Health check: [http://localhost:8000/health](http://localhost:8000/health)
