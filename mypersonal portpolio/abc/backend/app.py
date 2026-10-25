"""
Flask backend application for Abrar Ahmad's Personal Portfolio & CMS.
Provides:
- Public static file serving for the portfolio website
- Public read-only REST API endpoints (/api/portfolio, /api/contact)
- Secure, protected Owner Admin Dashboard endpoints (/api/admin/*)
- Multi-format file uploads (photos, certificates, PDF resumes)
"""

import os
import sys
import uuid
from datetime import datetime, timezone

# Ensure project root is in sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)
from werkzeug.utils import secure_filename
from flask import Flask, request, jsonify, send_from_directory, send_file
from backend.database import (
    init_db,
    get_db_connection,
    hash_password,
    verify_password,
    seed_data
)
from backend.auth import (
    create_session,
    validate_token,
    delete_session,
    require_admin,
    get_token_from_request
)

# Root project directory
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")
if os.environ.get("PORTFOLIO_DATA_DIR"):
    UPLOAD_FOLDER = os.path.join(os.environ["PORTFOLIO_DATA_DIR"], "uploads")
ASSETS_FOLDER = os.path.join(BASE_DIR, "assets")
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'pdf'}
MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max upload

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(ASSETS_FOLDER, exist_ok=True)

app = Flask(__name__, static_folder=None)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_CONTENT_LENGTH

# Initialize database on app load (works with Gunicorn, WSGI, or direct python)
init_db()

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# -------------------------------------------------------------
# STATIC FILE SERVING
# -------------------------------------------------------------
@app.route('/')
def serve_index():
    return send_file(os.path.join(BASE_DIR, 'index.html'))

@app.route('/health')
def health_check():
    return jsonify({"status": "ok"})

@app.route('/admin')
@app.route('/admin.html')
def serve_admin():
    response = send_file(os.path.join(BASE_DIR, 'admin.html'))
    response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    return response

@app.route('/css/<path:filename>')
def serve_css(filename):
    return send_from_directory(os.path.join(BASE_DIR, 'css'), filename)

@app.route('/js/<path:filename>')
def serve_js(filename):
    return send_from_directory(os.path.join(BASE_DIR, 'js'), filename)

@app.route('/assets/<path:filename>')
def serve_assets(filename):
    return send_from_directory(ASSETS_FOLDER, filename)

@app.route('/uploads/<path:filename>')
def serve_uploads(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

# -------------------------------------------------------------
# PUBLIC READ-ONLY PORTFOLIO API
# -------------------------------------------------------------
@app.route('/api/portfolio', methods=['GET'])
def get_portfolio_data():
    """Public read-only endpoint returning all portfolio sections."""
    conn = get_db_connection()
    cursor = conn.cursor()

    # Profile
    cursor.execute("SELECT * FROM profile WHERE id = 1")
    profile_row = cursor.fetchone()
    profile = dict(profile_row) if profile_row else {}

    # Education (ordered)
    cursor.execute("SELECT * FROM education ORDER BY order_num ASC, id ASC")
    education = [dict(row) for row in cursor.fetchall()]

    # Skills (all & categorized)
    cursor.execute("SELECT * FROM skills ORDER BY order_num ASC, id ASC")
    skills_raw = [dict(row) for row in cursor.fetchall()]
    skills_by_category = {
        "frontend": [],
        "programming": [],
        "tools": [],
        "database": []
    }
    for s in skills_raw:
        cat = s.get("category", "other")
        if cat in skills_by_category:
            skills_by_category[cat].append(s)
        else:
            skills_by_category.setdefault("other", []).append(s)

    # Experience
    cursor.execute("SELECT * FROM experience ORDER BY order_num ASC, id ASC")
    experience = [dict(row) for row in cursor.fetchall()]

    # Projects
    cursor.execute("SELECT * FROM projects ORDER BY order_num ASC, id ASC")
    projects = [dict(row) for row in cursor.fetchall()]

    # Certificates
    cursor.execute("SELECT * FROM certificates ORDER BY order_num ASC, id ASC")
    certificates = [dict(row) for row in cursor.fetchall()]

    conn.close()

    return jsonify({
        "success": True,
        "data": {
            "profile": profile,
            "education": education,
            "skills": skills_by_category,
            "skills_list": skills_raw,
            "experience": experience,
            "projects": projects,
            "certificates": certificates
        }
    })

# -------------------------------------------------------------
# PUBLIC CONTACT FORM SUBMISSION
# -------------------------------------------------------------
@app.route('/api/contact', methods=['POST'])
def submit_contact():
    """Allows public visitors to send a message to Abrar Ahmad."""
    data = request.get_json(silent=True) or request.form
    name = (data.get('name') or '').strip()
    email = (data.get('email') or '').strip()
    subject = (data.get('subject') or 'Portfolio Inquiry').strip()
    message = (data.get('message') or '').strip()

    if not name or not email or not message:
        return jsonify({
            "success": False,
            "error": "Please provide your name, a valid email address, and a message."
        }), 400

    if '@' not in email or '.' not in email:
        return jsonify({
            "success": False,
            "error": "Please provide a valid email address."
        }), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO messages (name, email, subject, message, created_at, is_read)
        VALUES (?, ?, ?, ?, ?, 0)
    """, (name, email, subject, message, datetime.now(timezone.utc).isoformat()))
    conn.commit()
    conn.close()

    return jsonify({
        "success": True,
        "message": f"Thank you, {name}! Your message has been sent successfully. Abrar will get back to you shortly."
    }), 201

# -------------------------------------------------------------
# ADMIN AUTHENTICATION ENDPOINTS
# -------------------------------------------------------------
@app.route('/api/auth/login', methods=['POST'])
def admin_login():
    data = request.get_json(silent=True) or request.form
    username = (data.get('username') or '').strip()
    password = data.get('password') or ''

    if not username or not password:
        return jsonify({"success": False, "error": "Username and password are required."}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM admin_users WHERE username = ?", (username,))
    user = cursor.fetchone()
    conn.close()

    if not user or not verify_password(password, user["salt"], user["password_hash"]):
        return jsonify({"success": False, "error": "Invalid username or password."}), 401

    token = create_session(user["id"])
    return jsonify({
        "success": True,
        "token": token,
        "user": {
            "id": user["id"],
            "username": user["username"]
        },
        "message": "Login successful!"
    })

@app.route('/api/auth/verify', methods=['GET'])
def admin_verify():
    token = get_token_from_request()
    user = validate_token(token)
    if not user:
        return jsonify({"success": False, "authenticated": False}), 401
    return jsonify({"success": True, "authenticated": True, "user": user})

@app.route('/api/auth/logout', methods=['POST'])
def admin_logout():
    token = get_token_from_request()
    if token:
        delete_session(token)
    return jsonify({"success": True, "message": "Logged out successfully."})

@app.route('/api/admin/change-password', methods=['POST'])
@require_admin
def change_password():
    data = request.get_json(silent=True) or request.form
    current_password = data.get('current_password') or ''
    new_password = data.get('new_password') or ''

    if len(new_password) < 6:
        return jsonify({"success": False, "error": "New password must be at least 6 characters long."}), 400

    user_id = request.current_user["id"]
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM admin_users WHERE id = ?", (user_id,))
    user = cursor.fetchone()

    if not user or not verify_password(current_password, user["salt"], user["password_hash"]):
        conn.close()
        return jsonify({"success": False, "error": "Current password is incorrect."}), 400

    new_hash, new_salt = hash_password(new_password)
    cursor.execute("""
        UPDATE admin_users
        SET password_hash = ?, salt = ?
        WHERE id = ?
    """, (new_hash, new_salt, user_id))
    conn.commit()
    conn.close()

    return jsonify({"success": True, "message": "Password updated successfully!"})

# -------------------------------------------------------------
# SECURE FILE UPLOAD ENDPOINT (ADMIN ONLY)
# -------------------------------------------------------------
@app.route('/api/admin/upload', methods=['POST'])
@require_admin
def upload_file():
    """Allows authenticated owner to upload images or resume documents."""
    if 'file' not in request.files:
        return jsonify({"success": False, "error": "No file uploaded."}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({"success": False, "error": "Empty filename."}), 400

    if not allowed_file(file.filename):
        return jsonify({
            "success": False,
            "error": f"Invalid file type. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        }), 400

    original_ext = file.filename.rsplit('.', 1)[1].lower()
    unique_filename = f"{uuid.uuid4().hex[:12]}_{secure_filename(file.filename)}"
    save_path = os.path.join(UPLOAD_FOLDER, unique_filename)
    file.save(save_path)

    relative_url = f"uploads/{unique_filename}"
    return jsonify({
        "success": True,
        "url": relative_url,
        "filename": unique_filename,
        "message": "File uploaded successfully!"
    })

# -------------------------------------------------------------
# ADMIN PROFILE MANAGEMENT
# -------------------------------------------------------------
@app.route('/api/admin/profile', methods=['GET', 'PUT'])
@require_admin
def manage_profile():
    conn = get_db_connection()
    cursor = conn.cursor()

    if request.method == 'GET':
        cursor.execute("SELECT * FROM profile WHERE id = 1")
        row = cursor.fetchone()
        conn.close()
        return jsonify({"success": True, "data": dict(row) if row else {}})

    # PUT: Update profile
    data = request.get_json(silent=True) or request.form
    cursor.execute("""
        UPDATE profile
        SET full_name = ?, title = ?, tagline = ?, bio = ?, about_summary = ?,
            avatar_url = ?, resume_url = ?, email = ?, phone = ?, location = ?,
            github_url = ?, linkedin_url = ?, twitter_url = ?, available_for_hire = ?,
            experience_years = ?, projects_completed = ?, happy_clients = ?
        WHERE id = 1
    """, (
        data.get('full_name', 'Abrar Ahmad'),
        data.get('title', 'Software Engineering Student | Web Developer'),
        data.get('tagline', ''),
        data.get('bio', ''),
        data.get('about_summary', ''),
        data.get('avatar_url', 'assets/images/avatar-default.svg'),
        data.get('resume_url', 'assets/docs/Abrar_Ahmad_Resume.pdf'),
        data.get('email', 'abrar.ahmad.dev@example.com'),
        data.get('phone', ''),
        data.get('location', ''),
        data.get('github_url', ''),
        data.get('linkedin_url', ''),
        data.get('twitter_url', ''),
        int(data.get('available_for_hire', 1)),
        data.get('experience_years', '2+ Years'),
        data.get('projects_completed', '10+'),
        data.get('happy_clients', '100%')
    ))
    conn.commit()

    cursor.execute("SELECT * FROM profile WHERE id = 1")
    updated = dict(cursor.fetchone())
    conn.close()

    return jsonify({"success": True, "message": "Profile updated successfully!", "data": updated})

# -------------------------------------------------------------
# ADMIN EDUCATION CRUD
# -------------------------------------------------------------
@app.route('/api/admin/education', methods=['POST'])
@require_admin
def create_education():
    data = request.get_json(silent=True) or request.form
    degree = (data.get('degree') or '').strip()
    institution = (data.get('institution') or '').strip()
    period = (data.get('period') or '').strip()
    grade = data.get('grade', '')
    description = data.get('description', '')
    order_num = int(data.get('order_num', 0))

    if not degree or not institution or not period:
        return jsonify({"success": False, "error": "Degree, Institution, and Period are required."}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO education (degree, institution, period, grade, description, order_num)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (degree, institution, period, grade, description, order_num))
    new_id = cursor.lastrowid
    conn.commit()
    conn.close()

    return jsonify({"success": True, "message": "Education record added!", "id": new_id}), 201

@app.route('/api/admin/education/<int:item_id>', methods=['PUT', 'DELETE'])
@require_admin
def handle_education(item_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    if request.method == 'DELETE':
        cursor.execute("DELETE FROM education WHERE id = ?", (item_id,))
        conn.commit()
        conn.close()
        return jsonify({"success": True, "message": "Education record deleted."})

    data = request.get_json(silent=True) or request.form
    cursor.execute("""
        UPDATE education
        SET degree = ?, institution = ?, period = ?, grade = ?, description = ?, order_num = ?
        WHERE id = ?
    """, (
        data.get('degree'),
        data.get('institution'),
        data.get('period'),
        data.get('grade'),
        data.get('description'),
        int(data.get('order_num', 0)),
        item_id
    ))
    conn.commit()
    conn.close()
    return jsonify({"success": True, "message": "Education record updated."})

# -------------------------------------------------------------
# ADMIN SKILLS CRUD
# -------------------------------------------------------------
@app.route('/api/admin/skills', methods=['POST'])
@require_admin
def create_skill():
    data = request.get_json(silent=True) or request.form
    name = (data.get('name') or '').strip()
    category = data.get('category', 'programming')
    proficiency = int(data.get('proficiency', 80))
    icon = data.get('icon', 'code')
    order_num = int(data.get('order_num', 0))

    if not name:
        return jsonify({"success": False, "error": "Skill name is required."}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO skills (name, category, proficiency, icon, order_num)
        VALUES (?, ?, ?, ?, ?)
    """, (name, category, proficiency, icon, order_num))
    new_id = cursor.lastrowid
    conn.commit()
    conn.close()

    return jsonify({"success": True, "message": "Skill added!", "id": new_id}), 201

@app.route('/api/admin/skills/<int:item_id>', methods=['PUT', 'DELETE'])
@require_admin
def handle_skill(item_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    if request.method == 'DELETE':
        cursor.execute("DELETE FROM skills WHERE id = ?", (item_id,))
        conn.commit()
        conn.close()
        return jsonify({"success": True, "message": "Skill deleted."})

    data = request.get_json(silent=True) or request.form
    cursor.execute("""
        UPDATE skills
        SET name = ?, category = ?, proficiency = ?, icon = ?, order_num = ?
        WHERE id = ?
    """, (
        data.get('name'),
        data.get('category'),
        int(data.get('proficiency', 80)),
        data.get('icon', 'code'),
        int(data.get('order_num', 0)),
        item_id
    ))
    conn.commit()
    conn.close()
    return jsonify({"success": True, "message": "Skill updated."})

# -------------------------------------------------------------
# ADMIN EXPERIENCE CRUD
# -------------------------------------------------------------
@app.route('/api/admin/experience', methods=['POST'])
@require_admin
def create_experience():
    data = request.get_json(silent=True) or request.form
    role = (data.get('role') or '').strip()
    company = (data.get('company') or '').strip()
    period = (data.get('period') or '').strip()
    location = data.get('location', '')
    description = data.get('description', '')
    order_num = int(data.get('order_num', 0))

    if not role or not company or not period:
        return jsonify({"success": False, "error": "Role, company, and period are required."}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO experience (role, company, period, location, description, order_num)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (role, company, period, location, description, order_num))
    new_id = cursor.lastrowid
    conn.commit()
    conn.close()

    return jsonify({"success": True, "message": "Experience added!", "id": new_id}), 201

@app.route('/api/admin/experience/<int:item_id>', methods=['PUT', 'DELETE'])
@require_admin
def handle_experience(item_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    if request.method == 'DELETE':
        cursor.execute("DELETE FROM experience WHERE id = ?", (item_id,))
        conn.commit()
        conn.close()
        return jsonify({"success": True, "message": "Experience deleted."})

    data = request.get_json(silent=True) or request.form
    cursor.execute("""
        UPDATE experience
        SET role = ?, company = ?, period = ?, location = ?, description = ?, order_num = ?
        WHERE id = ?
    """, (
        data.get('role'),
        data.get('company'),
        data.get('period'),
        data.get('location'),
        data.get('description'),
        int(data.get('order_num', 0)),
        item_id
    ))
    conn.commit()
    conn.close()
    return jsonify({"success": True, "message": "Experience updated."})

# -------------------------------------------------------------
# ADMIN PROJECTS CRUD
# -------------------------------------------------------------
@app.route('/api/admin/projects', methods=['POST'])
@require_admin
def create_project():
    data = request.get_json(silent=True) or request.form
    title = (data.get('title') or '').strip()
    category = data.get('category', 'web')
    description = (data.get('description') or '').strip()
    image_url = data.get('image_url', 'assets/images/project-1.svg')
    tech_stack = data.get('tech_stack', '')
    github_url = data.get('github_url', '')
    demo_url = data.get('demo_url', '')
    status = data.get('status', 'Completed')
    featured = int(data.get('featured', 0))
    order_num = int(data.get('order_num', 0))

    if not title or not description:
        return jsonify({"success": False, "error": "Project title and description are required."}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO projects (title, category, description, image_url, tech_stack, github_url, demo_url, status, featured, order_num)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (title, category, description, image_url, tech_stack, github_url, demo_url, status, featured, order_num))
    new_id = cursor.lastrowid
    conn.commit()
    conn.close()

    return jsonify({"success": True, "message": "Project added successfully!", "id": new_id}), 201

@app.route('/api/admin/projects/<int:item_id>', methods=['PUT', 'DELETE'])
@require_admin
def handle_project(item_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    if request.method == 'DELETE':
        cursor.execute("DELETE FROM projects WHERE id = ?", (item_id,))
        conn.commit()
        conn.close()
        return jsonify({"success": True, "message": "Project deleted."})

    data = request.get_json(silent=True) or request.form
    cursor.execute("""
        UPDATE projects
        SET title = ?, category = ?, description = ?, image_url = ?, tech_stack = ?,
            github_url = ?, demo_url = ?, status = ?, featured = ?, order_num = ?
        WHERE id = ?
    """, (
        data.get('title'),
        data.get('category'),
        data.get('description'),
        data.get('image_url'),
        data.get('tech_stack'),
        data.get('github_url'),
        data.get('demo_url'),
        data.get('status', 'Completed'),
        int(data.get('featured', 0)),
        int(data.get('order_num', 0)),
        item_id
    ))
    conn.commit()
    conn.close()
    return jsonify({"success": True, "message": "Project updated successfully."})

# -------------------------------------------------------------
# ADMIN CERTIFICATES CRUD
# -------------------------------------------------------------
@app.route('/api/admin/certificates', methods=['POST'])
@require_admin
def create_certificate():
    data = request.get_json(silent=True) or request.form
    title = (data.get('title') or '').strip()
    issuer = (data.get('issuer') or '').strip()
    issue_date = (data.get('issue_date') or '').strip()
    credential_id = data.get('credential_id', '')
    credential_url = data.get('credential_url', '')
    image_url = data.get('image_url', 'assets/images/cert-default.svg')
    order_num = int(data.get('order_num', 0))

    if not title or not issuer or not issue_date:
        return jsonify({"success": False, "error": "Title, issuer, and date are required."}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO certificates (title, issuer, issue_date, credential_id, credential_url, image_url, order_num)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (title, issuer, issue_date, credential_id, credential_url, image_url, order_num))
    new_id = cursor.lastrowid
    conn.commit()
    conn.close()

    return jsonify({"success": True, "message": "Certificate added successfully!", "id": new_id}), 201

@app.route('/api/admin/certificates/<int:item_id>', methods=['PUT', 'DELETE'])
@require_admin
def handle_certificate(item_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    if request.method == 'DELETE':
        cursor.execute("DELETE FROM certificates WHERE id = ?", (item_id,))
        conn.commit()
        conn.close()
        return jsonify({"success": True, "message": "Certificate deleted."})

    data = request.get_json(silent=True) or request.form
    cursor.execute("""
        UPDATE certificates
        SET title = ?, issuer = ?, issue_date = ?, credential_id = ?, credential_url = ?, image_url = ?, order_num = ?
        WHERE id = ?
    """, (
        data.get('title'),
        data.get('issuer'),
        data.get('issue_date'),
        data.get('credential_id'),
        data.get('credential_url'),
        data.get('image_url'),
        int(data.get('order_num', 0)),
        item_id
    ))
    conn.commit()
    conn.close()
    return jsonify({"success": True, "message": "Certificate updated successfully."})

# -------------------------------------------------------------
# ADMIN MESSAGES (VIEW, MARK READ, DELETE)
# -------------------------------------------------------------
@app.route('/api/admin/messages', methods=['GET'])
@require_admin
def get_messages():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM messages ORDER BY id DESC")
    messages = [dict(row) for row in cursor.fetchall()]
    unread_count = sum(1 for m in messages if m["is_read"] == 0)
    conn.close()
    return jsonify({"success": True, "data": messages, "unread_count": unread_count})

@app.route('/api/admin/messages/<int:item_id>/read', methods=['PUT'])
@require_admin
def mark_message_read(item_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE messages SET is_read = 1 WHERE id = ?", (item_id,))
    conn.commit()
    conn.close()
    return jsonify({"success": True, "message": "Message marked as read."})

@app.route('/api/admin/messages/<int:item_id>', methods=['DELETE'])
@require_admin
def delete_message(item_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM messages WHERE id = ?", (item_id,))
    conn.commit()
    conn.close()
    return jsonify({"success": True, "message": "Message deleted."})

# -------------------------------------------------------------
# ADMIN RESET DEMO DATA
# -------------------------------------------------------------
@app.route('/api/admin/reset-demo', methods=['POST'])
@require_admin
def reset_demo_data():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM profile")
    cursor.execute("DELETE FROM education")
    cursor.execute("DELETE FROM skills")
    cursor.execute("DELETE FROM experience")
    cursor.execute("DELETE FROM projects")
    cursor.execute("DELETE FROM certificates")
    seed_data(cursor)
    conn.commit()
    conn.close()
    return jsonify({"success": True, "message": "Demo data has been restored to default values!"})

# -------------------------------------------------------------
# MAIN RUNNER
# -------------------------------------------------------------
if __name__ == '__main__':
    init_db()
    port = int(os.environ.get("PORT", 5000))
    print(f"============================================================")
    print(f" Abrar Ahmad's Professional Portfolio & Admin Portal")
    print(f" Local URL:   http://localhost:{port}")
    print(f" Admin Panel: http://localhost:{port}/admin")
    print(f" Default Admin Credentials:")
    print(f"   Username:  admin")
    print(f"   Password:  admin123 (Change inside admin dashboard)")
    print(f"============================================================")
    app.run(host='0.0.0.0', port=port, debug=True)
