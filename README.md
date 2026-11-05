# Legal-Precedent-Case-Analyzer

# ⚖️ Legal Precedent Case Analyzer

<h1 align="center">⚖️ Legal Precedent Case Analyzer</h1>

<p align="center">
  <b>AI-Powered Legal Case Analysis & Management Platform</b>
</p>

<p align="center">
  An intelligent web-based platform designed to simplify legal case management, analyze case documents using AI, discover relevant legal precedents, and connect advocates with clients.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React"/>
  <img src="https://img.shields.io/badge/Python-3.12-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python"/>
  <img src="https://img.shields.io/badge/Django-5.1-092E20?style=for-the-badge&logo=django&logoColor=white" alt="Django"/>
  <img src="https://img.shields.io/badge/AI-Google%20Gemini-4285F4?style=for-the-badge&logo=googlegemini&logoColor=white" alt="Google Gemini"/>
  <img src="https://img.shields.io/badge/Database-PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL"/>
</p>

<p align="center">
  <a href="https://github.com/Jainam259/Legal-Precedent-Case-Analyzer">GitHub Repository</a> •
  <a href="#features">Features</a> •
  <a href="#installation--setup">Installation</a> •
  <a href="#api-endpoints">API Endpoints</a>
</p>

---

## 📌 Table of Contents

- [About the Project](#about-the-project)
- [Problem Statement](#problem-statement)
- [Project Objectives](#project-objectives)
- [Features](#features)
- [User Roles](#user-roles)
- [Technology Stack](#technology-stack)
- [Project Architecture](#project-architecture)
- [Project Structure](#project-structure)
- [How the System Works](#how-the-system-works)
- [Installation & Setup](#installation--setup)
- [Environment Variables](#environment-variables)
- [API Endpoints](#api-endpoints)
- [Database Models](#database-models)
- [Screenshots](#screenshots)
- [Future Enhancements](#future-enhancements)
- [Important Disclaimer](#important-disclaimer)
- [Author](#author)

---

## 📖 About the Project

**Legal Precedent Case Analyzer** is an AI-powered legal assistance and case management web application developed using React.js, Python, Django REST Framework, PostgreSQL, and Google Gemini AI.

The system helps advocates manage their legal cases, upload PDF documents, generate AI-powered case summaries, extract important legal information, and search for relevant legal precedents.

It also provides a dedicated client portal where clients can view their case information and connect with advocates.

An administrative dashboard allows administrators to monitor and manage advocates, clients, and cases.

The main goal of this project is to make legal document analysis and case management more organized, efficient, and accessible through a centralized web application.

## 🎯 Problem Statement

Traditional legal case management often involves manually reviewing lengthy documents, organizing case information, tracking hearing dates, and searching for relevant legal precedents.

These activities can consume significant time and effort.

This project aims to address these challenges by providing:

- AI-assisted legal document analysis.
- Centralized case and document management.
- Organized client and advocate information.
- Relevant legal precedent searching.
- Case analytics and progress tracking.
- Automated hearing reminder emails.

## 🚀 Project Objectives

1. Develop a centralized platform for legal case management.
2. Automate the extraction of important information from legal PDF documents.
3. Generate AI-powered case summaries and analysis.
4. Help advocates search for relevant legal precedents.
5. Provide separate dashboards for Admin, Advocate, and Client.
6. Simplify communication and hearing-date tracking.
7. Improve the organization and accessibility of legal documents.

---

## ✨ Features

### 🤖 1. AI-Powered Case Analysis

- Upload legal case documents in PDF format.
- Extract text from uploaded PDF documents.
- Generate AI-powered executive summaries.
- Identify important dates and parties involved.
- Extract relevant Acts and legal sections.
- Generate case timelines.
- Identify available evidence.
- Highlight potentially missing documents.
- Display AI confidence information returned by the analysis service.

### 🔍 2. AI Legal Precedent Search

- Search for relevant legal information.
- Use AI-assisted legal search.
- Retrieve information related to legal queries.
- Support advocates in legal research.

### 👨‍⚖️ 3. Advocate Module

- Advocate registration and login.
- Advocate dashboard.
- Create and upload new cases.
- Upload case PDF documents.
- View all assigned cases.
- View individual case details.
- Edit case information.
- Manage case updates.
- Manage advocate professional profiles.
- View case analytics.
- Access AI analysis results.
- Maintain a PDF document library.

### 👤 4. Client Module

- Client registration and login.
- Client dashboard.
- Browse available advocates.
- Search for case information.
- View case details.
- Access case-related information.

### 🛡️ 5. Admin Module

- Admin login.
- Admin dashboard.
- View system statistics.
- Manage advocate records.
- View and manage client records.
- View and manage legal cases.
- Delete advocate, client, and case records.

### 📄 6. PDF Document Management

- Upload legal case PDF files.
- Extract PDF text for analysis.
- Store case-related documents.
- Maintain a PDF library.
- View and manage uploaded documents.

### 📧 7. Email Notifications

- Send case creation notifications to clients.
- Send hearing-date reminder emails.
- Use Gmail SMTP for email delivery.
- Provide a Django management command for hearing reminders.

### 📊 8. Case Analytics

- View case statistics.
- Analyze case information.
- Monitor case progress.
- Display case analytics through the advocate dashboard.

---

## 👥 User Roles

The application supports three primary user roles.

| Role | Responsibilities |
|---|---|
| Admin | Manage advocates, clients, cases, and system statistics. |
| Advocate | Manage cases, upload documents, perform AI analysis, and manage clients. |
| Client | Register, log in, browse advocates, and view case information. |

---

## 🛠️ Technology Stack

### Frontend

| Technology | Purpose |
|---|---|
| React.js | Frontend development |
| JavaScript | Application functionality |
| HTML5 | Web page structure |
| CSS3 | UI styling |
| React Router | Page navigation |
| Axios | API communication |
| React Icons | UI icons |
| Vite | Frontend development and build tool |

### Backend

| Technology | Purpose |
|---|---|
| Python | Backend programming |
| Django | Backend framework |
| Django REST Framework | REST API development |
| Google Gemini AI | AI-powered case analysis and search |
| PyMuPDF | PDF text extraction |
| Python-dotenv | Environment variable management |

### Database

| Technology | Purpose |
|---|---|
| PostgreSQL | Relational database |

### Tools

- Visual Studio Code
- Git
- GitHub
- Postman
- Google AI Studio

---

## 🏗️ Project Architecture

The application follows a frontend-backend architecture.

```text
                 LEGAL PRECEDENT CASE ANALYZER
                              |
               +--------------+--------------+
               |                             |
          FRONTEND                       BACKEND
               |                             |
           React.js                    Django REST API
               |                             |
          React Router                Business Logic
               |                             |
             Axios                         |
               |                  +----------+----------+
               |                  |          |          |
               +------------------+          |          |
                                      PostgreSQL    Google Gemini
                                           |          AI
                                           |
                                     Case Data
                                     User Data
                                     Documents
                                           |
                                      PyMuPDF
                                           |
                                    PDF Processing
```

### Main Components

- **React Frontend:** Provides user interfaces and dashboards.
- **Django Backend:** Handles authentication, business logic, and API requests.
- **PostgreSQL:** Stores application data.
- **Google Gemini AI:** Supports AI-based case analysis and legal search.
- **PyMuPDF:** Extracts text from PDF documents.
- **Email Service:** Sends case notifications and hearing reminders.

---

## 📁 Project Structure

```text
Legal-Precedent-Case-Analyzer/
│
├── backend/
│   │
│   ├── backend/
│   │   ├── __init__.py
│   │   ├── settings.py
│   │   ├── urls.py
│   │   ├── asgi.py
│   │   └── wsgi.py
│   │
│   ├── case/
│   │   ├── migrations/
│   │   ├── management/
│   │   │   └── commands/
│   │   │       └── send_hearing_reminders.py
│   │   │
│   │   ├── admin.py
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── urls.py
│   │   ├── ai_service.py
│   │   ├── ai_search.py
│   │   ├── emails.py
│   │   └── services.py
│   │
│   └── manage.py
│
├── frontend/
│   │
│   ├── public/
│   │
│   ├── src/
│   │   ├── api/
│   │   │   └── axios.js
│   │   │
│   │   ├── assets/
│   │   │
│   │   ├── pages/
│   │   │   ├── admin/
│   │   │   ├── advocate/
│   │   │   ├── client/
│   │   │   └── Home.jsx
│   │   │
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── main.jsx
│   │
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── .gitignore
├── README.md
├── package.json
└── package-lock.json
```

---

## ⚙️ How the System Works

### Step 1: User Authentication

Users access the application through the login and registration pages according to their roles.

### Step 2: Case Creation

The advocate creates a new legal case and enters the required information, including client details, case number, case type, court name, and hearing date.

### Step 3: PDF Upload

The advocate uploads the legal case document in PDF format.

### Step 4: AI Processing

The backend processes the uploaded PDF using PyMuPDF and sends the extracted content to the configured Google Gemini AI service.

### Step 5: Analysis Results

The system generates structured information such as:

- Executive Summary
- Case Story
- Important Dates
- Parties Involved
- Acts
- Legal Sections
- Case Timeline
- Evidence
- Missing Documents
- AI Confidence

### Step 6: Case Management

The advocate can review case details, manage updates, maintain documents, and view analytics.

### Step 7: Client Communication

The system can send case-related notifications and hearing reminders through email.

---

## 💻 Installation & Setup

Follow these instructions to run the project locally.

### 1. Clone the Repository

```bash
git clone https://github.com/Jainam259/Legal-Precedent-Case-Analyzer.git
```

Navigate to the project directory:

```bash
cd Legal-Precedent-Case-Analyzer
```

### 2. Backend Setup

Navigate to the backend directory:

```bash
cd backend
```

Create a Python virtual environment:

```bash
python -m venv venv
```

Activate the virtual environment on Windows:

```bash
venv\Scripts\activate
```

Install the backend dependencies:

```bash
pip install Django djangorestframework django-cors-headers python-dotenv google-genai PyMuPDF psycopg2-binary
```

> These are the main dependencies identified in the project. Install any additional dependencies required by your environment.

### 3. Configure PostgreSQL

1. Install PostgreSQL.
2. Start the PostgreSQL server.
3. Create a database for the project.
4. Configure the database credentials in Django settings using environment variables.

### 4. Configure Environment Variables

Create a `.env` file inside the `backend/` directory.

Example:

```env
GEMINI_API_KEY=your_gemini_api_key

EMAIL_HOST_USER=your_email@gmail.com
EMAIL_HOST_PASSWORD=your_gmail_app_password

DB_NAME=your_database_name
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_HOST=localhost
DB_PORT=5432
```

Make sure Django settings read these environment variables for the AI service, email configuration, and PostgreSQL connection.

**Important:** Never upload your actual `.env` file to GitHub.

### 5. Apply Database Migrations

Run:

```bash
python manage.py makemigrations
```

```bash
python manage.py migrate
```

### 6. Create Django Superuser

```bash
python manage.py createsuperuser
```

Follow the instructions to create your admin account.

### 7. Start Django Backend

```bash
python manage.py runserver
```

Backend URL:

```text
http://127.0.0.1:8000/
```

Django Admin:

```text
http://127.0.0.1:8000/admin/
```

### 8. Frontend Setup

Open another terminal.

Navigate to the frontend directory:

```bash
cd frontend
```

Install frontend dependencies:

```bash
npm install
```

Start the React development server:

```bash
npm run dev
```

Frontend URL:

```text
http://localhost:5173/
```

### 9. Access the Application

Open the following address in your browser:

```text
http://localhost:5173/
```

Make sure the Django backend and React frontend are both running.

---

## 🔗 API Endpoints

The following API routes are defined in the Django backend.

### Authentication APIs

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/advocate/register/` | Advocate registration |
| POST | `/api/advocate/login/` | Advocate login |
| POST | `/api/client/register/` | Client registration |
| POST | `/api/client/login/` | Client login |
| POST | `/api/admin/login/` | Admin login |

### Case Management APIs

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/cases/` | Upload/create a case |
| GET | `/api/cases/all/` | Retrieve advocate cases |
| GET | `/api/cases/<id>/` | Retrieve case details |
| DELETE | `/api/cases/delete/<id>/` | Delete a case |
| PUT/PATCH | `/api/cases/<id>/edit/` | Edit case information |
| POST | `/api/cases/<id>/updates/` | Add a case update |
| POST | `/api/cases/<id>/documents/add/` | Add a case document |
| GET | `/api/cases/analytics/` | Retrieve case analytics |

### AI & Search APIs

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/ai-search/` | AI-assisted legal search |
| GET | `/api/client/search-case/` | Search client cases |
| GET | `/api/client/advocates/` | Retrieve available advocates |

### Advocate Profile APIs

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/advocate/profile/<id>/` | Retrieve advocate profile |
| PUT/PATCH | `/api/advocate/profile/update/<id>/` | Update advocate profile |

### PDF Library APIs

| Method | Endpoint | Description |
|---|---|---|
| GET/POST | `/api/pdf-library/` | Retrieve or upload PDF library documents |
| DELETE | `/api/pdf-library/<id>/delete/` | Delete a PDF library document |

### Admin APIs

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/admin/stats/` | Retrieve admin statistics |
| GET | `/api/admin/advocates/` | List advocates |
| DELETE | `/api/admin/advocates/<id>/delete/` | Delete advocate |
| GET | `/api/admin/clients/` | List clients |
| DELETE | `/api/admin/clients/<id>/delete/` | Delete client |
| GET | `/api/admin/cases/` | List cases |
| DELETE | `/api/admin/cases/<id>/delete/` | Delete case |

*Note: The HTTP methods above describe the expected operations. Check the corresponding Django views for exact supported methods and request parameters.*

---

## 🗄️ Database Models

The backend uses Django models to manage application information.

The main database entities include:

| Model | Purpose |
|---|---|
| Advocate | Stores advocate information and professional details. |
| Client | Stores client information. |
| Case | Stores legal case information. |
| CaseDocument | Stores uploaded case PDF documents. |
| AIAnalysis | Stores AI-generated case analysis results. |
| CaseUpdate | Stores updates related to cases. |
| PdfLibraryDocument | Stores PDF library documents. |

The database migrations are maintained in:

```text
backend/case/migrations/
```

---

## 📸 Screenshots

Screenshots of the application can be added here to demonstrate the user interface and project functionality.

Recommended screenshots:

| Screenshot | Description |
|---|---|
| Home Page | Main landing page |
| Advocate Login | Advocate authentication |
| Client Login | Client authentication |
| Admin Dashboard | Admin management interface |
| Advocate Dashboard | Advocate workspace |
| New Case | Case creation and PDF upload |
| AI Analysis | AI-generated analysis results |
| Case Analytics | Case statistics and analytics |
| PDF Library | Document management |
| Client Dashboard | Client workspace |

To add screenshots:

1. Create a folder named `screenshots` in the root directory.
2. Save your project screenshots inside that folder.
3. Add them to this README using Markdown.

Example:

```markdown
![Home Page](screenshots/home.png)

![Advocate Dashboard](screenshots/advocate-dashboard.png)

![AI Analysis](screenshots/ai-analysis.png)
```

---

## 🔮 Future Enhancements

The following improvements can be considered for future versions:

- Advanced legal precedent recommendation.
- More comprehensive legal document comparison.
- Multi-language legal document support.
- Improved document summarization.
- Advanced case outcome insights.
- Real-time notifications.
- Enhanced role-based access control.
- Production deployment and cloud storage.
- Advanced reporting and downloadable case reports.

---

## ⚠️ Important Disclaimer

This project is developed for educational and informational purposes.

AI-generated summaries, extracted legal information, and search results may contain inaccuracies or incomplete information. They should not be considered professional legal advice or a substitute for reviewing original legal documents and consulting a qualified legal professional.

---

## 👨‍💻 Author

**Jainam Shah**

BCA Student | Python Developer | Full Stack Developer | AI Enthusiast

- **GitHub:** [Jainam259](https://github.com/Jainam259)
- **Project Repository:** [Legal Precedent Case Analyzer](https://github.com/Jainam259/Legal-Precedent-Case-Analyzer)
- **LinkedIn:** [Jainam Shah](https://www.linkedin.com/in/jainam259/)

---

<p align="center">
  <b>⭐ If you find this project interesting, consider giving it a star on GitHub!</b>
</p>

<p align="center">
  Made with ❤️ by Jainam Shah
</p>
