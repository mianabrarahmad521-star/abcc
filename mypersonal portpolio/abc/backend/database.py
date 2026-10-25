"""
Database initialization and management for Abrar Ahmad's Portfolio.
Uses Python's built-in SQLite3 engine for zero-dependency persistent storage.
"""

import os
import sqlite3
import hashlib
import secrets
from datetime import datetime, timezone

DATA_DIR = os.environ.get("PORTFOLIO_DATA_DIR")
DB_FILE = os.path.join(
    DATA_DIR or os.path.dirname(os.path.abspath(__file__)),
    "portfolio.db"
)
os.makedirs(os.path.dirname(DB_FILE), exist_ok=True)

def get_db_connection():
    """Returns a SQLite connection with row factory configured as dictionaries."""
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def hash_password(password: str, salt: str = None) -> tuple[str, str]:
    """Hashes password with PBKDF2-HMAC-SHA256 and salt."""
    if salt is None:
        salt = secrets.token_hex(16)
    hashed = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt.encode('utf-8'),
        200000
    ).hex()
    return hashed, salt

def verify_password(password: str, salt: str, expected_hash: str) -> bool:
    """Verifies a password against the stored salt and hash."""
    hashed, _ = hash_password(password, salt)
    return secrets.compare_digest(hashed, expected_hash)

def init_db():
    """Initializes tables and populates with initial data if empty."""
    conn = get_db_connection()
    cursor = conn.cursor()

    # 1. Profile Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS profile (
        id INTEGER PRIMARY KEY,
        full_name TEXT NOT NULL,
        title TEXT NOT NULL,
        tagline TEXT,
        bio TEXT,
        about_summary TEXT,
        avatar_url TEXT,
        resume_url TEXT,
        email TEXT,
        phone TEXT,
        location TEXT,
        github_url TEXT,
        linkedin_url TEXT,
        twitter_url TEXT,
        available_for_hire INTEGER DEFAULT 1,
        experience_years TEXT DEFAULT '2+',
        projects_completed TEXT DEFAULT '10+',
        happy_clients TEXT DEFAULT '100%'
    )
    """)

    # 2. Education Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS education (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        degree TEXT NOT NULL,
        institution TEXT NOT NULL,
        period TEXT NOT NULL,
        grade TEXT,
        description TEXT,
        order_num INTEGER DEFAULT 0
    )
    """)

    # 3. Skills Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS skills (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category TEXT NOT NULL, -- 'frontend', 'programming', 'tools', 'database'
        proficiency INTEGER DEFAULT 80,
        icon TEXT,
        order_num INTEGER DEFAULT 0
    )
    """)

    # 4. Experience Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS experience (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        role TEXT NOT NULL,
        company TEXT NOT NULL,
        period TEXT NOT NULL,
        location TEXT,
        description TEXT,
        order_num INTEGER DEFAULT 0
    )
    """)

    # 5. Projects Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        category TEXT NOT NULL, -- 'web', 'software', 'python'
        description TEXT NOT NULL,
        image_url TEXT,
        tech_stack TEXT, -- Comma-separated or JSON string
        github_url TEXT,
        demo_url TEXT,
        status TEXT DEFAULT 'Completed',
        featured INTEGER DEFAULT 0,
        order_num INTEGER DEFAULT 0
    )
    """)

    # 6. Certificates Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS certificates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        issuer TEXT NOT NULL,
        issue_date TEXT NOT NULL,
        credential_id TEXT,
        credential_url TEXT,
        image_url TEXT,
        order_num INTEGER DEFAULT 0
    )
    """)

    # 7. Messages Table (from contact form)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        subject TEXT,
        message TEXT NOT NULL,
        created_at TEXT NOT NULL,
        is_read INTEGER DEFAULT 0
    )
    """)

    # 8. Admin Users Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS admin_users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        salt TEXT NOT NULL,
        created_at TEXT NOT NULL
    )
    """)

    # 9. Active Admin Sessions
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES admin_users(id)
    )
    """)

    conn.commit()

    # Seed default data if profile doesn't exist
    cursor.execute("SELECT COUNT(*) as count FROM profile")
    if cursor.fetchone()["count"] == 0:
        seed_data(cursor)
        conn.commit()

    # Seed admin user if not exists
    cursor.execute("SELECT COUNT(*) as count FROM admin_users")
    if cursor.fetchone()["count"] == 0:
        admin_username = os.environ.get("ADMIN_USERNAME", "admin")
        admin_pass = os.environ.get("ADMIN_PASSWORD", "admin123")
        pwd_hash, pwd_salt = hash_password(admin_pass)
        cursor.execute("""
            INSERT INTO admin_users (username, password_hash, salt, created_at)
            VALUES (?, ?, ?, ?)
        """, (admin_username, pwd_hash, pwd_salt, datetime.now(timezone.utc).isoformat()))
        conn.commit()
        print(f"Admin user created: username='{admin_username}'")

    conn.close()

def seed_data(cursor):
    """Populates the database with initial portfolio data for Abrar Ahmad."""
    # Profile
    cursor.execute("""
    INSERT INTO profile (
        id, full_name, title, tagline, bio, about_summary,
        avatar_url, resume_url, email, phone, location,
        github_url, linkedin_url, twitter_url, available_for_hire,
        experience_years, projects_completed, happy_clients
    ) VALUES (
        1,
        'Abrar Ahmad',
        'Software Engineering Student | Web Developer',
        'Bridging computational thinking with modern web design to build fast, scalable, and intuitive digital experiences.',
        'Hello! I am Abrar Ahmad, a dedicated Software Engineering student and passionate Web Developer. I have a strong foundation in core computer science disciplines, data structures, algorithms, and full-stack web technologies. I love transforming intricate problems into clean, well-architected software with pleasant user interfaces.',
        'I am actively pursuing my BS in Software Engineering with an unwavering commitment to learning modern frameworks, software engineering best practices, and clean code principles. I am eager to collaborate on challenging projects, contribute to impactful products, and build a flourishing career in software development.',
        'assets/images/profile.jpg',
        'assets/docs/Abrar_Ahmad_Resume.pdf',
        'mianabrarahmad521@gmail.com',
        '+92 342 1967521',
        'Islamabad / Lahore, Pakistan',
        'https://github.com/abrarahmad',
        'https://linkedin.com/in/abrar-ahmad',
        'https://twitter.com/abrarahmad_dev',
        1,
        '2+ Years',
        '12+',
        '100%'
    )
    """)

    # Education (Matric, FSc, BS Software Engineering)
    education_data = [
        (
            'BS Software Engineering',
            'University Department of Computer Science & Software Engineering',
            '2023 - Present (In Progress)',
            'CGPA: 3.8 / 4.0',
            'Pursuing an in-depth curriculum focused on Data Structures & Algorithms, Object-Oriented Analysis & Design, Database Systems, Web Engineering, Software Quality Assurance, and Distributed Systems.',
            1
        ),
        (
            'FSc Pre-Engineering / ICS',
            'Punjab Group of Colleges / Higher Secondary Board',
            '2021 - 2023',
            'Grade: A+ (First Division)',
            'Completed rigorous studies in Advanced Mathematics, Physics, and Computer Science fundamentals, establishing a solid analytical mindset.',
            2
        ),
        (
            'Matriculation (Science)',
            'Secondary School Certificate Board',
            '2019 - 2021',
            'Grade: A+ with Distinction',
            'Graduated with honors in Science, covering Physics, Chemistry, Biology/Computer Science, and Mathematics.',
            3
        )
    ]
    for deg, inst, period, grade, desc, order in education_data:
        cursor.execute("""
        INSERT INTO education (degree, institution, period, grade, description, order_num)
        VALUES (?, ?, ?, ?, ?, ?)
        """, (deg, inst, period, grade, desc, order))

    # Skills (HTML, CSS, JavaScript, C++, Python, MS Office, SQL, Git)
    skills_data = [
        ('HTML5', 'frontend', 95, 'html5', 1),
        ('CSS3 & Responsive Design', 'frontend', 90, 'css3', 2),
        ('JavaScript (ES6+)', 'frontend', 85, 'javascript', 3),
        ('C++', 'programming', 88, 'cplusplus', 4),
        ('Python', 'programming', 88, 'python', 5),
        ('SQLite / SQL', 'database', 82, 'database', 6),
        ('Git & GitHub', 'tools', 85, 'git', 7),
        ('MS Office Suite (Word, Excel, PowerPoint)', 'tools', 92, 'file-text', 8),
        ('Object-Oriented Programming (OOP)', 'programming', 90, 'layers', 9),
        ('Data Structures & Algorithms', 'programming', 84, 'cpu', 10)
    ]
    for name, cat, prof, icon, order in skills_data:
        cursor.execute("""
        INSERT INTO skills (name, category, proficiency, icon, order_num)
        VALUES (?, ?, ?, ?, ?)
        """, (name, cat, prof, icon, order))

    # Experience
    experience_data = [
        (
            'Junior Web Developer (Intern)',
            'Tech Solutions Lab',
            'Jun 2025 - Aug 2025',
            'Lahore, Pakistan (Hybrid)',
            'Engineered responsive web interfaces using modern HTML5, CSS3, and JavaScript. Collaborated with senior developers on REST API endpoints and enhanced site loading performance by 35% through asset optimization.',
            1
        ),
        (
            'Freelance Web Developer & Software Designer',
            'Upwork & Independent Clients',
            '2024 - Present',
            'Remote',
            'Designed and launched custom portfolio websites and academic tools for local clients. Emphasized clean typography, mobile-first design, SEO basics, and reliable database storage.',
            2
        ),
        (
            'Academic Project Lead & Peer Tutor',
            'University Software Engineering Society',
            '2024 - 2025',
            'Campus',
            'Mentored junior students in C++ object-oriented programming and introductory web development. Coordinated group project code repositories and conducted code reviews.',
            3
        )
    ]
    for role, comp, period, loc, desc, order in experience_data:
        cursor.execute("""
        INSERT INTO experience (role, company, period, location, description, order_num)
        VALUES (?, ?, ?, ?, ?, ?)
        """, (role, comp, period, loc, desc, order))

    # Projects
    projects_data = [
        (
            'Personal Portfolio & Dynamic CMS Platform',
            'web',
            'A modern, fully responsive personal portfolio with a private admin dashboard, custom REST API, SQLite persistence, and light/dark theme toggle.',
            'assets/images/project-1.svg',
            'HTML5, CSS3, JavaScript, Python, SQLite',
            'https://github.com/abrarahmad/personal-portfolio',
            'http://localhost:5000',
            'Completed',
            1,
            1
        ),
        (
            'Student Academic Record & Portal Management System',
            'software',
            'Comprehensive desktop & web application designed to manage student enrollments, calculate GPAs, track attendance, and generate printable transcripts.',
            'assets/images/project-2.svg',
            'Java, JavaFX, SQLite, OOP Principles',
            'https://github.com/abrarahmad/student-portal-manager',
            'https://github.com/abrarahmad/student-portal-manager',
            'Completed',
            1,
            2
        ),
        (
            'E-Commerce Storefront & Shopping Cart',
            'web',
            'Interactive client-side e-commerce interface featuring real-time product filtering, search, cart persistence via local storage, and simulated checkout flow.',
            'assets/images/project-3.svg',
            'HTML5, CSS3, JavaScript ES6, REST API',
            'https://github.com/abrarahmad/ecommerce-storefront',
            'https://github.com/abrarahmad/ecommerce-storefront',
            'Completed',
            1,
            3
        ),
        (
            'Data Analytics & Automated Report Generator',
            'python',
            'Python utility suite that cleans and parses CSV/Excel datasets, calculates summary statistics, and exports automated PDF & Excel analytical reports.',
            'assets/images/project-4.svg',
            'Python, Pandas, OpenPyXL, MS Office Automation',
            'https://github.com/abrarahmad/python-report-automation',
            'https://github.com/abrarahmad/python-report-automation',
            'Completed',
            0,
            4
        ),
        (
            'Sorting Algorithms & Data Structure Visualizer',
            'software',
            'Interactive visualizer bringing QuickSort, MergeSort, BubbleSort, and Graph Traversal algorithms to life with customizable speed and step-by-step narration.',
            'assets/images/project-5.svg',
            'C++, JavaScript, Canvas API, Algorithms',
            'https://github.com/abrarahmad/algorithm-visualizer',
            'https://github.com/abrarahmad/algorithm-visualizer',
            'In Progress',
            1,
            5
        )
    ]
    for title, cat, desc, img, tech, gh, demo, status, feat, order in projects_data:
        cursor.execute("""
        INSERT INTO projects (title, category, description, image_url, tech_stack, github_url, demo_url, status, featured, order_num)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (title, cat, desc, img, tech, gh, demo, status, feat, order))

    # Certificates
    certificates_data = [
        (
            'Responsive Web Design Certification',
            'freeCodeCamp',
            '2024',
            'FCC-WD-892401',
            'https://freecodecamp.org/certification/abrarahmad',
            'assets/images/cert-default.svg',
            1
        ),
        (
            'Object-Oriented Programming in C++ & Java',
            'Coursera / Academic Honor',
            '2024',
            'CRS-OOP-54129',
            'https://coursera.org/verify/abrarahmad',
            'assets/images/cert-default.svg',
            2
        ),
        (
            'Python Programming for Problem Solving',
            'HackerRank Certification',
            '2025',
            'HR-PY-901438',
            'https://hackerrank.com/certificates/abrarahmad',
            'assets/images/cert-default.svg',
            3
        ),
        (
            'Git & GitHub Version Control Professional',
            'Developer Certificate Program',
            '2024',
            'GIT-VCS-33812',
            'https://github.com/abrarahmad',
            'assets/images/cert-default.svg',
            4
        )
    ]
    for title, issuer, date, cred_id, cred_url, img, order in certificates_data:
        cursor.execute("""
        INSERT INTO certificates (title, issuer, issue_date, credential_id, credential_url, image_url, order_num)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (title, issuer, date, cred_id, cred_url, img, order))

if __name__ == '__main__':
    init_db()
    print("Database initialized successfully!")
