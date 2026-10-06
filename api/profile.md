# Alan Teixidó — profile for "Ask my CV"

The only source the assistant answers from (api/ask.py). Same facts as the
website; keep both in sync when the CV changes.

## Summary
Fullstack & AI engineer based in Barcelona, Spain. Builds AI agents that answer
from company knowledge with Google ADK, Vertex AI and RAG, the Python and .NET
APIs behind them, and React and React Native apps on top. Cares about the full
picture: clean architecture on the server, polished UI on the client, and
reliable delivery pipelines in between.

Open to full-time roles, or just a conversation about AI systems and software.
Contact: teixido.alan@gmail.com · linkedin.com/in/alanteixidosararols ·
github.com/AlanTeixido · website alanteixido.dev (CV as PDF on the site).

## Experience

### Plain Concepts — Software Engineer, Fullstack & AI (2025 – present)
Barcelona, Spain. Client: Puig.
Stack: Google ADK, Vertex AI, RAG, Python, FastAPI, Azure Bot Service, Azure
DevOps, .NET (C#), React Native, TypeScript, PostgreSQL, Firebase.
- Built AI agents with Google ADK on Vertex AI, using RAG over Vertex AI data
  stores to ground answers in company documents.
- Designed the document ingestion workflow: JSON metadata, data store imports
  and content updates, so the agents always answer from current knowledge.
- Developed the FastAPI (Python) backend connecting the agents with the rest of
  the platform.
- Integrated the agents into Microsoft Teams via Azure Bot Service, in a
  multi-cloud architecture (Google Cloud + Azure).
- Built Azure DevOps CI/CD pipelines to deploy across four repositories
  (agents, bot, API and infrastructure).
- Designed .NET REST APIs (CQRS, Clean Architecture) and React Native apps for
  iOS and Android, with Firebase release tooling (App Distribution,
  Crashlytics, Analytics).

### Quantion — Backend Developer (.NET), internship (Oct 2024 – Mar 2025)
Barcelona, Spain. Stack: .NET (C#), REST APIs, Azure DevOps, Git.
- Shipped backend features in .NET (C#) within a live production codebase from
  day one.
- Built and validated REST API endpoints with automated test coverage.
- Refactored legacy code applying Clean Code principles and established
  architectural patterns.
- Worked in iterative delivery cycles within a cross-functional Scrum team.

### SJAS Summer Camp — Camp Counselor (Jul – Aug 2024)
Lucerne, Switzerland.
- Led international groups in structured outdoor and team-based activities;
  strengthened leadership, communication and cross-cultural teamwork.

### CamperXpress — Sales Representative & Web Developer (May – Jul 2022)
Barcelona, Spain.
- Handled sales and client support, and built and maintained the company
  website.

### Pista Cero Informática — Hardware Technician (Jun 2021 – Apr 2022)
Barcelona, Spain.
- Assembled, repaired and upgraded computers, supported end users and server
  maintenance.

## Projects
- GenAI Data Platform (case study): natural-language analytics platform built
  during a corporate GenAI mentorship program. Business users ask questions in
  plain language; an LLM translates them into SQL, a governed semantic layer
  validates every query (read-only, row-level security), and the result runs on
  a PostgreSQL warehouse and is published automatically as Metabase charts and
  dashboards through its REST API. Alan authored the semantic business-term
  definitions, built the Metabase integration bridge and automated dashboard
  composition, and developed the Streamlit web interface. Python, PostgreSQL,
  text-to-SQL.
- Fit (live at fit.alanteixido.dev): personal training app with an AI coach,
  dashboard and activity tracking that he uses daily. The coach is built on the
  Claude API with tool use over his own data (meals, workouts, daily metrics
  and goals), plus Strava and Google Health Connect integrations. Next.js,
  Supabase, Claude API.
- ProTactics: fullstack football club management platform, built as a team
  project with two classmates (three developers in total). Clubs manage
  coaches and teams; coaches plan training sessions, track players, share
  publications and draw tactics on an interactive canvas board. JWT auth with
  role-based access. Vue 3, Node.js, PostgreSQL. Live demo (runs in the
  browser with sample data): https://alanteixido.github.io/ProTactics/
- Smaller builds: Pokédex app and Crypto Tracker (Next.js, TypeScript),
  Minesweeper (vanilla JavaScript), BarberStyle BCN (Vue 3, Vite, Tailwind)
  and AutoTech demo site (vanilla HTML, CSS, JavaScript).
- Ask my CV (this assistant, live on alanteixido.dev): an AI assistant in the
  terminal on the home page that answers questions about Alan from his CV only,
  streaming the answer live. A small Python service (standard library, no
  dependencies) behind nginx on his own VPS calls the Gemini API with the
  profile as context. Guardrails: the prompt keeps it on topic and treats the
  visitor's message as a question, never as instructions; question length
  limits, per-visitor and daily caps and nginx rate limiting; questions are
  never logged; systemd runs it sandboxed and restarts it on every deploy.
  Code: github.com/AlanTeixido/cvAlanTeixido (api/ folder).
- This website: static HTML, CSS and JavaScript on his own VPS with nginx and a
  GitHub Actions deploy, with a draggable interactive terminal in the hero.

## Skills
- AI & agents: Google ADK, Vertex AI, RAG, Vertex AI Data Stores, Azure Bot
  Service, Claude API.
- Backend & architecture: .NET (C#), ASP.NET Core, Python, FastAPI, REST APIs,
  CQRS, API versioning, Clean Architecture.
- Frontend: React, Next.js, Vue.js, TypeScript, JavaScript, HTML, CSS,
  Tailwind CSS.
- Mobile: React Native, Expo, Kotlin, Android, iOS, Firebase App Distribution,
  Crashlytics, Firebase Analytics.
- DevOps & cloud: Azure, Azure DevOps, Google Cloud, Docker, Git, CI/CD
  pipelines, Application Insights.
- Databases: PostgreSQL, Entity Framework Core, SQL.

## Education
- Higher VET Diploma in Web Application Development (CFGS DAW), Institut
  Tecnològic de Barcelona, 2024 – 2025.
- Intermediate VET Diploma in Microcomputer Systems & Networks (CFGM SMX), IFP
  Hospitalet, 2021 – 2023.
- Primary & secondary education, SEK Catalunya (La Garriga), 2013 – 2020.

## Languages
Catalan (native), Spanish (native), English (native), French (basic).

## What's next
Already ships AI agents to production; next he wants to make them reliable at
scale: evaluating answer quality, observability, grounding and guardrails, and
keeping latency and cost under control. Looking for a team that treats AI
systems with the same rigor as any other production software.

## Personal
Strong interest in sports and a competitive mindset.
