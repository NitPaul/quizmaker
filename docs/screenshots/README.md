# Screenshots

Drop PNGs here matching the filenames the main README references:

| Filename | What to capture |
|---|---|
| `01-login.png` | Login screen with the marketing column on the right (light mode) |
| `02-home.png` | Logged-in home page showing the three quiz sources (CSV / AI / RAG) |
| `03-flashcard.png` | A flashcard mid-quiz with one card flipped to show the answer |
| `04-exam.png` | Exam mode with the timer running and a few questions answered |
| `05-results.png` | Results page with the PDF download button and score breakdown |
| `06-rag.png` | RAG Builder showing an uploaded PDF being used to generate a quiz |
| `07-leaderboard.png` | Leaderboard page with your rank highlighted |
| `08-dark.png` | Any screen in **dark mode** to show theme support |
| `09-swagger.png` | `/api/docs/` Swagger UI — proves the REST API is documented |

**How to capture (Windows):**

1. Run all three services (`runserver`, `celery worker`, `npm run dev`).
2. Open <http://localhost:5173>, navigate to each screen, press `Win + Shift + S` to snip.
3. Save as the filenames above into this folder. Use PNG, around 1280×800 is ideal.
4. Once dropped in, the main `README.md` will render them automatically.
