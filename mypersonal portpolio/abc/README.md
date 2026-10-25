# Professional Personal Portfolio Website — Abrar Ahmad

A complete, modern, professional, and fully responsive personal portfolio website and Content Management System (CMS) designed specifically for **Abrar Ahmad** (Software Engineering Student & Web Developer).

---

## 🌟 Key Features

### 1. Website Owner Profile (Abrar Ahmad)
- **Profile Information**: Full Name, Professional Title, Avatar, Bio, Tagline, Contact Details (Email, Phone, Location), and Social Links (GitHub, LinkedIn, Twitter/X).
- **Education Section**: Visual progression highlighting **BS Software Engineering (In Progress)**, **FSc Pre-Engineering / ICS**, and **Matriculation (Science)** with academic distinctions.
- **Technical Skills**: Grouped and filterable by Frontend Web, Programming Languages (C++, Java, Python), Database & SQL, and Tools & Productivity (MS Office, Git/GitHub) with interactive proficiency bars.
- **Projects Showcase**: Interactive cards featuring project screenshot, status pill (*Completed* / *In Progress*), description, tech stack tags, GitHub repository link, and live demo link. Filterable by Web, Software/OOP, and Python.
- **Certificates & Credentials**: Professional credential badges with issue dates, credential IDs, verification links, and a full-size modal certificate inspector.
- **Experience Timeline**: Highlights internships (Junior Web Developer), freelance projects, and university leadership roles.
- **Interactive Contact Form**: Allows visitors to send direct messages stored securely in the database for the owner to review.
- **Downloadable Resume**: Direct one-click download of Abrar's PDF resume.

### 2. Modern Design & User Experience
- **Sleek Aesthetic**: Professional deep navy/slate dark mode and crisp modern light mode with instant toggle and persistent user preference.
- **Hero Section**: Animated dynamic typing effect, glowing avatar frame, quick stats counters, and Call-To-Action buttons.
- **Smooth Navigation**: Sticky glassmorphic navbar with active section scroll spy, mobile drawer navigation, and smooth scroll behaviors.
- **100% Responsive**: Tailored layout for mobile smartphones, tablets, laptops, and ultra-wide desktop monitors.
- **Zero Broken Links**: Embedded fallback seed data ensures the portfolio displays beautifully even if opened offline.

### 3. Owner Private Admin Dashboard (CMS)
- **Secure Password-Protected Login**: Dedicated `/admin` route requiring authenticated credentials.
- **Full Content Management**:
  - Edit Name, Title, Tagline, Bio, Email, Phone, Location, Social Profiles, and Stats.
  - Upload Profile Pictures, Project Thumbnails, and Certificate Images with instant preview.
  - Upload PDF Resumes directly.
  - Add, Edit, and Delete Education records.
  - Add, Edit, and Delete Skills with visual category selectors and proficiency sliders.
  - Add, Edit, and Delete Projects and Experience records.
  - Add, Edit, and Delete Certificates.
  - View visitor messages, mark as read, or reply directly via email.
  - Change Admin Password securely.
- **SQLite Database Persistence**: All updates are saved to `backend/portfolio.db` permanently — refreshing or restarting never loses your data.

### 4. Visitor Security & Permissions
- **Read-Only Public Access**: Visitors can browse projects, read education, view certificates, download the resume, and submit contact messages.
- **Server-Side Authorization**: Visitors cannot edit data, modify photos, or tamper with records. Admin endpoints (`/api/admin/*`, `/api/upload`) reject unauthorized requests with `401 Unauthorized`.
- **PBKDF2 Password Hashing**: Passwords are salted and hashed using PBKDF2-HMAC-SHA256 with 200,000 rounds.

---

## 📁 Project Structure

```
mypersonal portpolio/
├── index.html                   # Public portfolio website
├── admin.html                   # Private Owner Admin Dashboard
├── css/
│   ├── style.css                # Portfolio layout, dark/light theme, animations
│   └── admin.css                # Admin CMS styling, tables, modals, upload dropzone
├── js/
│   ├── app.js                   # Client-side dynamic loader, filter, typing effect
│   └── admin.js                 # Admin dashboard logic, CRUD, authentication, uploads
├── assets/
│   ├── images/                  # Crisp default vector illustrations & placeholders
│   │   ├── avatar-default.svg
│   │   ├── project-1.svg
│   │   ├── project-2.svg
│   │   ├── project-3.svg
│   │   ├── project-4.svg
│   │   ├── project-5.svg
│   │   └── cert-default.svg
│   └── docs/
│       └── Abrar_Ahmad_Resume.pdf
├── uploads/                     # Uploaded user images and resumes
├── backend/
│   ├── app.py                   # Flask REST API backend & static server
│   ├── server_standalone.py     # Zero-dependency Python standard library server
│   ├── database.py              # SQLite database schema, seeding, and models
│   ├── auth.py                  # Token creation, verification, and password hashing
│   └── portfolio.db             # Persistent SQLite database file
├── requirements.txt             # Python requirements (Flask)
├── run.bat                      # 1-Click launcher for Windows
├── run.py                       # Cross-platform runner with auto-browser opening
└── README.md                    # Documentation & deployment guide
```

---

## 🚀 Running the Website Locally

### Option 1: 1-Click Launch (Recommended for Windows)
Simply double-click the **`run.bat`** file in the project folder.  
It will:
1. Initialize the SQLite database.
2. Launch the web server.
3. Automatically open your default browser to `http://localhost:5000`.

### Option 2: Command Line
Open your terminal or PowerShell in the project directory and run:

```bash
python run.py
```

Then visit:
- **Public Portfolio:** [http://localhost:5000](http://localhost:5000)
- **Owner Admin CMS:** [http://localhost:5000/admin](http://localhost:5000/admin)

> **Note:** If Flask is not installed on a new machine, the runner automatically switches to `backend/server_standalone.py` which uses Python's built-in standard library with **zero external dependencies**!

---

## 🔐 Accessing the Owner Admin Dashboard

1. Navigate to [http://localhost:5000/admin](http://localhost:5000/admin) (or click the **Admin** button in the top navigation bar).
2. Enter the default credentials:
   - **Username:** `admin`
   - **Password:** `admin123`
3. Click **Sign In to Dashboard**.

### Changing Your Password:
1. In the admin dashboard, click **Security & Pass** in the left sidebar.
2. Enter your current password (`admin123`).
3. Enter your new desired password (minimum 6 characters).
4. Click **Update Password**. Your new password is now active and securely hashed in the database!

---

## ✏️ How to Edit and Update Content

| Content | Where to Edit in Admin Dashboard |
| :--- | :--- |
| **Profile Photo** | Click **Profile & Bio** &rarr; Click **Upload Image File** under Profile Picture &rarr; Click **Save Profile Changes**. |
| **Name, Title, Bio** | Click **Profile & Bio** &rarr; Update inputs &rarr; Click **Save Profile Changes**. |
| **Resume (CV)** | Click **Profile & Bio** &rarr; Click **Upload PDF Resume** &rarr; Click **Save Profile Changes**. |
| **Education** | Click **Education** &rarr; Click **Add Education** or the edit icon next to Matric, FSc, or BS Software Eng. |
| **Skills** | Click **Skills** &rarr; Click **Add New Skill** &rarr; Select Category &amp; Proficiency &rarr; Save. |
| **Projects** | Click **Projects** &rarr; Click **Add New Project** &rarr; Upload thumbnail, enter title, description, tech stack, and links &rarr; Save. |
| **Certificates** | Click **Certificates** &rarr; Click **Add Certificate** &rarr; Upload image or enter URL &rarr; Save. |
| **Contact Messages** | Click **Messages** &rarr; Review messages sent by visitors, mark as read, or click **Reply via Email**. |

---

## 🌐 Deploying to Render

This project includes a Render Blueprint (`render.yaml`) configured for the Flask API,
Gunicorn, a health check, and a persistent disk for the SQLite database and uploaded files.
The persistent disk requires a paid Render web-service plan.

1. Push the project to a GitHub repository.
2. In Render, choose **New +** → **Blueprint** and connect the repository.
3. When prompted, set `ADMIN_PASSWORD` to a strong, unique password. Do not use `admin123`
   for a public deployment.
4. Review the Blueprint and create the service. Render builds with
   `pip install -r requirements.txt` and starts Gunicorn automatically.
5. Once the deployment is live, open the service URL and sign in at `/admin` with
   username `admin` and the password you supplied.
6. Check `/health` to verify the service is responding.

The first deployment creates the admin user using `ADMIN_USERNAME` and `ADMIN_PASSWORD`.
Changing these environment variables later does not change an already-created database
account; change an existing password from the dashboard instead. The persistent disk keeps
the database and uploads across deploys. Back up the disk regularly.

Vercel and Netlify are primarily static/serverless platforms and do not directly run this
Flask + SQLite application with persistent storage. They would require a separate backend
and database service.

---

## 🛡️ Visitor Security Guarantee
- Visitors can view everything publicly and submit contact inquiries.
- Visitors **cannot** alter profile data, change photos, access messages, or delete projects.
- Any direct POST/PUT/DELETE attempts to `/api/admin/*` without a valid Bearer token are rejected with `401 Unauthorized`.
