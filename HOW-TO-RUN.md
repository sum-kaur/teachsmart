# How to Run Locally

## Single command (recommended)

> **Windows users:** Run this in **Command Prompt (cmd.exe)**, NOT PowerShell.
> If you must use PowerShell, first run: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`

```bat
cd "c:\Users\visha\OneDrive - UTS\Microsoft hackathon\teachsmart"
npx pnpm run dev
```

This starts both the API server and frontend together in one terminal.
Then open **[http://localhost:5173](http://localhost:5173)** in your browser.
(If port 5173 is taken, Vite will use 5174 — check the terminal output.)

---

## Or run separately (2 terminals)

**Terminal 1 — API Server (port 8080):**
```bash
npx pnpm --filter @workspace/api-server run dev
```

**Terminal 2 — Frontend (port 5173):**
```bash
PORT=5173 npx pnpm --filter @workspace/teachsmart run dev
```

---

## Notes

- The API server must be running before you use the frontend
- If you see API errors, check Terminal 1 for logs
- Demo scenarios work without a Groq API key (instant results, no AI call)
- To use live AI, add your Groq key to `.env`: `GROQ_API_KEY=your_key_here`
- `.env` is git-ignored — never commit it

## Demo Scenarios (work offline, no API key needed)

| Year | State | Subject | Topic |
|------|-------|---------|-------|
| Year 9 | NSW | Science | Climate Change |
| Year 9 | NSW | Mathematics | Algebra |
| Year 8 | VIC | English | Romeo and Juliet |
| Year 10 | QLD | History | Rights and Freedoms |
| Year 7 | NSW | Geography | Ecosystems |
