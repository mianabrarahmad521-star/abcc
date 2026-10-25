"""
Zero-dependency standalone server for Abrar Ahmad's Portfolio.
Uses standard library http.server, urllib, json, sqlite3.
Runs instantly on any standard Python 3 installation without pip packages.
"""

import os
import json
import mimetypes
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
from datetime import datetime, timezone, timedelta
import secrets

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, "backend", "portfolio.db")

from backend.database import (
    init_db,
    get_db_connection,
    verify_password,
    hash_password,
    seed_data
)

def get_auth_user(token):
    if not token:
        return None
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT s.token, s.user_id, s.expires_at, u.username
        FROM sessions s
        JOIN admin_users u ON s.user_id = u.id
        WHERE s.token = ?
    """, (token,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return None
    return {"id": row["user_id"], "username": row["username"]}

class PortfolioHTTPHandler(BaseHTTPRequestHandler):
    def end_headers(self):
        # Enable CORS for local testing if needed
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Admin-Token')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def send_json(self, status_code, data):
        body = json.dumps(data).encode('utf-8')
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def get_token(self):
        auth = self.headers.get('Authorization', '')
        if auth.startswith('Bearer '):
            return auth[7:].strip()
        custom = self.headers.get('X-Admin-Token', '')
        if custom:
            return custom.strip()
        return None

    def read_json_body(self):
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length > 0:
                raw_data = self.rfile.read(content_length).decode('utf-8')
                return json.loads(raw_data)
        except Exception:
            pass
        return {}

    def serve_static(self, file_path):
        if not os.path.exists(file_path) or os.path.isdir(file_path):
            self.send_response(404)
            self.end_headers()
            self.wfile.write(b"404 Not Found")
            return

        mime_type, _ = mimetypes.guess_type(file_path)
        if not mime_type:
            mime_type = 'application/octet-stream'

        try:
            with open(file_path, 'rb') as f:
                content = f.read()
            self.send_response(200)
            self.send_header('Content-Type', mime_type)
            self.send_header('Content-Length', str(len(content)))
            self.end_headers()
            self.wfile.write(content)
        except Exception as e:
            self.send_response(500)
            self.end_headers()
            self.wfile.write(f"500 Internal Error: {e}".encode('utf-8'))

    # -------------------------------------------------------------
    # GET HANDLER
    # -------------------------------------------------------------
    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path

        # Static routing
        if path == '/' or path == '/index.html':
            return self.serve_static(os.path.join(BASE_DIR, 'index.html'))
        if path == '/admin' or path == '/admin.html':
            return self.serve_static(os.path.join(BASE_DIR, 'admin.html'))
        if path.startswith('/css/') or path.startswith('/js/') or path.startswith('/assets/') or path.startswith('/uploads/'):
            clean_path = path.lstrip('/')
            return self.serve_static(os.path.join(BASE_DIR, clean_path))

        # API: Get portfolio
        if path == '/api/portfolio':
            conn = get_db_connection()
            c = conn.cursor()
            c.execute("SELECT * FROM profile WHERE id = 1")
            prof = dict(c.fetchone() or {})
            c.execute("SELECT * FROM education ORDER BY order_num ASC, id ASC")
            edu = [dict(r) for r in c.fetchall()]
            c.execute("SELECT * FROM skills ORDER BY order_num ASC, id ASC")
            skills = [dict(r) for r in c.fetchall()]
            c.execute("SELECT * FROM experience ORDER BY order_num ASC, id ASC")
            exp = [dict(r) for r in c.fetchall()]
            c.execute("SELECT * FROM projects ORDER BY order_num ASC, id ASC")
            proj = [dict(r) for r in c.fetchall()]
            c.execute("SELECT * FROM certificates ORDER BY order_num ASC, id ASC")
            certs = [dict(r) for r in c.fetchall()]
            conn.close()

            return self.send_json(200, {
                "success": True,
                "data": {
                    "profile": prof,
                    "education": edu,
                    "skills_list": skills,
                    "experience": exp,
                    "projects": proj,
                    "certificates": certs
                }
            })

        # API: Verify auth
        if path == '/api/auth/verify':
            token = self.get_token()
            user = get_auth_user(token)
            if not user:
                return self.send_json(401, {"success": False, "authenticated": False})
            return self.send_json(200, {"success": True, "authenticated": True, "user": user})

        # API: Get messages (admin only)
        if path == '/api/admin/messages':
            token = self.get_token()
            if not get_auth_user(token):
                return self.send_json(401, {"success": False, "error": "Unauthorized"})
            conn = get_db_connection()
            c = conn.cursor()
            c.execute("SELECT * FROM messages ORDER BY id DESC")
            msgs = [dict(r) for r in c.fetchall()]
            conn.close()
            unread = sum(1 for m in msgs if m["is_read"] == 0)
            return self.send_json(200, {"success": True, "data": msgs, "unread_count": unread})

        self.send_response(404)
        self.end_headers()
        self.wfile.write(b"Not Found")

    # -------------------------------------------------------------
    # POST HANDLER
    # -------------------------------------------------------------
    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path

        # Contact form submission (public)
        if path == '/api/contact':
            body = self.read_json_body()
            name = (body.get('name') or '').strip()
            email = (body.get('email') or '').strip()
            subject = (body.get('subject') or 'Portfolio Inquiry').strip()
            message = (body.get('message') or '').strip()

            if not name or not email or not message:
                return self.send_json(400, {"success": False, "error": "All fields are required."})

            conn = get_db_connection()
            c = conn.cursor()
            c.execute("""
                INSERT INTO messages (name, email, subject, message, created_at, is_read)
                VALUES (?, ?, ?, ?, ?, 0)
            """, (name, email, subject, message, datetime.now(timezone.utc).isoformat()))
            conn.commit()
            conn.close()

            return self.send_json(201, {
                "success": True,
                "message": f"Thank you, {name}! Your message has been sent successfully."
            })

        # Admin Login
        if path == '/api/auth/login':
            body = self.read_json_body()
            username = (body.get('username') or '').strip()
            password = body.get('password') or ''

            conn = get_db_connection()
            c = conn.cursor()
            c.execute("SELECT * FROM admin_users WHERE username = ?", (username,))
            user = c.fetchone()
            conn.close()

            if not user or not verify_password(password, user["salt"], user["password_hash"]):
                return self.send_json(401, {"success": False, "error": "Invalid username or password."})

            token = secrets.token_urlsafe(32)
            created_at = datetime.now(timezone.utc)
            expires_at = created_at + timedelta(hours=48)

            conn = get_db_connection()
            c = conn.cursor()
            c.execute("INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)",
                      (token, user["id"], created_at.isoformat(), expires_at.isoformat()))
            conn.commit()
            conn.close()

            return self.send_json(200, {
                "success": True,
                "token": token,
                "user": {"id": user["id"], "username": user["username"]}
            })

        # Protected admin endpoints
        user = get_auth_user(self.get_token())
        if not user:
            return self.send_json(401, {"success": False, "error": "Unauthorized admin access."})

        # Create Education
        if path == '/api/admin/education':
            body = self.read_json_body()
            conn = get_db_connection()
            c = conn.cursor()
            c.execute("""
                INSERT INTO education (degree, institution, period, grade, description, order_num)
                VALUES (?, ?, ?, ?, ?, 0)
            """, (body.get('degree'), body.get('institution'), body.get('period'), body.get('grade'), body.get('description')))
            new_id = c.lastrowid
            conn.commit()
            conn.close()
            return self.send_json(201, {"success": True, "id": new_id})

        # Create Skill
        if path == '/api/admin/skills':
            body = self.read_json_body()
            conn = get_db_connection()
            c = conn.cursor()
            c.execute("""
                INSERT INTO skills (name, category, proficiency, icon, order_num)
                VALUES (?, ?, ?, ?, 0)
            """, (body.get('name'), body.get('category'), int(body.get('proficiency', 85)), body.get('icon', '')))
            new_id = c.lastrowid
            conn.commit()
            conn.close()
            return self.send_json(201, {"success": True, "id": new_id})

        # Create Experience
        if path == '/api/admin/experience':
            body = self.read_json_body()
            conn = get_db_connection()
            c = conn.cursor()
            c.execute("""
                INSERT INTO experience (role, company, period, location, description, order_num)
                VALUES (?, ?, ?, ?, ?, 0)
            """, (body.get('role'), body.get('company'), body.get('period'), body.get('location'), body.get('description')))
            new_id = c.lastrowid
            conn.commit()
            conn.close()
            return self.send_json(201, {"success": True, "id": new_id})

        # Create Project
        if path == '/api/admin/projects':
            body = self.read_json_body()
            conn = get_db_connection()
            c = conn.cursor()
            c.execute("""
                INSERT INTO projects (title, category, description, image_url, tech_stack, github_url, demo_url, status, featured, order_num)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
            """, (body.get('title'), body.get('category'), body.get('description'), body.get('image_url'),
                  body.get('tech_stack'), body.get('github_url'), body.get('demo_url'), body.get('status', 'Completed'), int(body.get('featured', 0))))
            new_id = c.lastrowid
            conn.commit()
            conn.close()
            return self.send_json(201, {"success": True, "id": new_id})

        # Create Certificate
        if path == '/api/admin/certificates':
            body = self.read_json_body()
            conn = get_db_connection()
            c = conn.cursor()
            c.execute("""
                INSERT INTO certificates (title, issuer, issue_date, credential_id, credential_url, image_url, order_num)
                VALUES (?, ?, ?, ?, ?, ?, 0)
            """, (body.get('title'), body.get('issuer'), body.get('issue_date'), body.get('credential_id'),
                  body.get('credential_url'), body.get('image_url')))
            new_id = c.lastrowid
            conn.commit()
            conn.close()
            return self.send_json(201, {"success": True, "id": new_id})

        # Reset demo data
        if path == '/api/admin/reset-demo':
            conn = get_db_connection()
            c = conn.cursor()
            c.execute("DELETE FROM profile")
            c.execute("DELETE FROM education")
            c.execute("DELETE FROM skills")
            c.execute("DELETE FROM experience")
            c.execute("DELETE FROM projects")
            c.execute("DELETE FROM certificates")
            seed_data(c)
            conn.commit()
            conn.close()
            return self.send_json(200, {"success": True, "message": "Demo data restored!"})

        # Change password
        if path == '/api/admin/change-password':
            body = self.read_json_body()
            curr = body.get('current_password', '')
            new_p = body.get('new_password', '')
            if len(new_p) < 6:
                return self.send_json(400, {"success": False, "error": "Password too short."})

            conn = get_db_connection()
            c = conn.cursor()
            c.execute("SELECT * FROM admin_users WHERE id = ?", (user["id"],))
            db_user = c.fetchone()
            if not db_user or not verify_password(curr, db_user["salt"], db_user["password_hash"]):
                conn.close()
                return self.send_json(400, {"success": False, "error": "Current password incorrect."})

            new_h, new_s = hash_password(new_p)
            c.execute("UPDATE admin_users SET password_hash = ?, salt = ? WHERE id = ?", (new_h, new_s, user["id"]))
            conn.commit()
            conn.close()
            return self.send_json(200, {"success": True, "message": "Password updated."})

        self.send_response(404)
        self.end_headers()

    # -------------------------------------------------------------
    # PUT HANDLER
    # -------------------------------------------------------------
    def do_PUT(self):
        parsed = urlparse(self.path)
        path = parsed.path
        user = get_auth_user(self.get_token())
        if not user:
            return self.send_json(401, {"success": False, "error": "Unauthorized admin access."})

        # Profile update
        if path == '/api/admin/profile':
            b = self.read_json_body()
            conn = get_db_connection()
            c = conn.cursor()
            c.execute("""
                UPDATE profile
                SET full_name = ?, title = ?, tagline = ?, bio = ?, about_summary = ?,
                    avatar_url = ?, resume_url = ?, email = ?, phone = ?, location = ?,
                    github_url = ?, linkedin_url = ?, twitter_url = ?,
                    experience_years = ?, projects_completed = ?, happy_clients = ?
                WHERE id = 1
            """, (
                b.get('full_name'), b.get('title'), b.get('tagline'), b.get('bio'), b.get('about_summary'),
                b.get('avatar_url'), b.get('resume_url'), b.get('email'), b.get('phone'), b.get('location'),
                b.get('github_url'), b.get('linkedin_url'), b.get('twitter_url'),
                b.get('experience_years'), b.get('projects_completed'), b.get('happy_clients')
            ))
            conn.commit()
            c.execute("SELECT * FROM profile WHERE id = 1")
            updated = dict(c.fetchone())
            conn.close()
            return self.send_json(200, {"success": True, "data": updated})

        # Update Education
        if path.startswith('/api/admin/education/'):
            item_id = int(path.split('/')[-1])
            b = self.read_json_body()
            conn = get_db_connection()
            c = conn.cursor()
            c.execute("""
                UPDATE education SET degree = ?, institution = ?, period = ?, grade = ?, description = ? WHERE id = ?
            """, (b.get('degree'), b.get('institution'), b.get('period'), b.get('grade'), b.get('description'), item_id))
            conn.commit()
            conn.close()
            return self.send_json(200, {"success": True})

        # Update Skill
        if path.startswith('/api/admin/skills/'):
            item_id = int(path.split('/')[-1])
            b = self.read_json_body()
            conn = get_db_connection()
            c = conn.cursor()
            c.execute("UPDATE skills SET name = ?, category = ?, proficiency = ?, icon = ? WHERE id = ?",
                      (b.get('name'), b.get('category'), int(b.get('proficiency', 80)), b.get('icon', ''), item_id))
            conn.commit()
            conn.close()
            return self.send_json(200, {"success": True})

        # Update Project
        if path.startswith('/api/admin/projects/'):
            item_id = int(path.split('/')[-1])
            b = self.read_json_body()
            conn = get_db_connection()
            c = conn.cursor()
            c.execute("""
                UPDATE projects SET title = ?, category = ?, description = ?, image_url = ?, tech_stack = ?,
                       github_url = ?, demo_url = ?, status = ?, featured = ? WHERE id = ?
            """, (b.get('title'), b.get('category'), b.get('description'), b.get('image_url'),
                  b.get('tech_stack'), b.get('github_url'), b.get('demo_url'), b.get('status'), int(b.get('featured', 0)), item_id))
            conn.commit()
            conn.close()
            return self.send_json(200, {"success": True})

        # Update Certificate
        if path.startswith('/api/admin/certificates/'):
            item_id = int(path.split('/')[-1])
            b = self.read_json_body()
            conn = get_db_connection()
            c = conn.cursor()
            c.execute("""
                UPDATE certificates SET title = ?, issuer = ?, issue_date = ?, credential_id = ?, credential_url = ?, image_url = ? WHERE id = ?
            """, (b.get('title'), b.get('issuer'), b.get('issue_date'), b.get('credential_id'), b.get('credential_url'), b.get('image_url'), item_id))
            conn.commit()
            conn.close()
            return self.send_json(200, {"success": True})

        # Mark message read
        if path.startswith('/api/admin/messages/') and path.endswith('/read'):
            item_id = int(path.split('/')[-2])
            conn = get_db_connection()
            c = conn.cursor()
            c.execute("UPDATE messages SET is_read = 1 WHERE id = ?", (item_id,))
            conn.commit()
            conn.close()
            return self.send_json(200, {"success": True})

        self.send_response(404)
        self.end_headers()

    # -------------------------------------------------------------
    # DELETE HANDLER
    # -------------------------------------------------------------
    def do_DELETE(self):
        parsed = urlparse(self.path)
        path = parsed.path
        user = get_auth_user(self.get_token())
        if not user:
            return self.send_json(401, {"success": False, "error": "Unauthorized."})

        table_map = {
            '/api/admin/education/': 'education',
            '/api/admin/skills/': 'skills',
            '/api/admin/experience/': 'experience',
            '/api/admin/projects/': 'projects',
            '/api/admin/certificates/': 'certificates',
            '/api/admin/messages/': 'messages'
        }

        for prefix, table in table_map.items():
            if path.startswith(prefix):
                item_id = int(path.split('/')[-1])
                conn = get_db_connection()
                c = conn.cursor()
                c.execute(f"DELETE FROM {table} WHERE id = ?", (item_id,))
                conn.commit()
                conn.close()
                return self.send_json(200, {"success": True, "message": f"{table} item deleted."})

        self.send_response(404)
        self.end_headers()

def run_standalone(port=5000):
    init_db()
    server_address = ('0.0.0.0', port)
    httpd = HTTPServer(server_address, PortfolioHTTPHandler)
    print(f"Zero-dependency standalone server active at http://localhost:{port}")
    httpd.serve_forever()

if __name__ == '__main__':
    run_standalone()
