
**AI-Powered Project Management Board**

### Installation & Running (Short)

**Prerequisites**

* Node.js v16+
* MongoDB
* OpenAI API Key

---

### 1. Clone

```bash
git clone <repo-url>
cd ai-project-board
```

---

### 2. Backend

```bash
cd backend
npm install
```

Create `backend/.env`

```
PORT=5001
MONGODB_URI=mongodb://localhost:27017/ai-project-board
JWT_SECRET=your_jwt_secret
OPENAI_API_KEY=your_openai_key
FRONTEND_URL=http://localhost:5173
```

Run backend:

```bash
npm run dev
```

---

### 3. Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env`

```
VITE_API_URL=http://localhost:5001
VITE_WS_URL=http://localhost:5001
```

Run frontend:

```bash
npm run dev
```

---

### 4. Open App

* Frontend: [http://localhost:5173](http://localhost:5173/)
* Backend: [http://localhost:5001](http://localhost:5001/)
