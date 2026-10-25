/**
 * Abrar Ahmad - Owner Admin Portal & CMS Logic
 * Handles authentication, token management, file uploads,
 * real-time SQLite database updates, and dashboard state.
 */

const TOKEN_KEY = 'abrar_admin_token';
let authToken = localStorage.getItem(TOKEN_KEY) || null;
let currentAdminUser = null;
let portfolioData = null;

// ==========================================================================
// API REQUEST HELPER WITH AUTH TOKEN
// ==========================================================================
async function apiRequest(endpoint, options = {}) {
  const headers = options.headers || {};
  if (authToken) {
    headers['Authorization'] = 'Bearer ' + authToken;
  }

  // If sending JSON body, set Content-Type
  if (options.body && !(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const config = {
    ...options,
    headers
  };

  try {
    const res = await fetch(endpoint, config);
    if (res.status === 401) {
      // Session invalid or expired
      handleAuthFailure();
      throw new Error('Unauthorized or session expired.');
    }
    return res;
  } catch (err) {
    console.error(`API Error on ${endpoint}:`, err);
    throw err;
  }
}

function handleAuthFailure() {
  authToken = null;
  localStorage.removeItem(TOKEN_KEY);
  showLoginView();
  showAdminToast('Session expired. Please sign in again.', 'error');
}

// ==========================================================================
// AUTHENTICATION & LOGIN/LOGOUT
// ==========================================================================
async function checkAuth() {
  if (!authToken) {
    showLoginView();
    return;
  }

  try {
    const res = await apiRequest('/api/auth/verify');
    if (res.ok) {
      const data = await res.json();
      if (data.authenticated) {
        currentAdminUser = data.user;
        showAdminView();
        loadAllDashboardData();
        return;
      }
    }
    showLoginView();
  } catch (err) {
    showLoginView();
  }
}

function showLoginView() {
  document.getElementById('loginView').style.display = 'flex';
  document.getElementById('adminApp').style.display = 'none';
}

function showAdminView() {
  document.getElementById('loginView').style.display = 'none';
  document.getElementById('adminApp').style.display = 'flex';
  if (currentAdminUser) {
    const badge = document.getElementById('adminUsernameBadge');
    if (badge) badge.textContent = currentAdminUser.username;
  }
}

function initAuthHandlers() {
  const loginForm = document.getElementById('loginForm');
  const loginSubmitBtn = document.getElementById('loginSubmitBtn');
  const logoutBtn = document.getElementById('logoutBtn');

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('loginUsername').value.trim();
      const password = document.getElementById('loginPassword').value;

      if (!username || !password) {
        showAdminToast('Please enter your username and password.', 'error');
        return;
      }

      if (loginSubmitBtn) {
        loginSubmitBtn.disabled = true;
        loginSubmitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Signing in...`;
      }

      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });

        const data = await res.json();

        if (res.ok && data.success) {
          authToken = data.token;
          localStorage.setItem(TOKEN_KEY, authToken);
          currentAdminUser = data.user;
          showAdminToast('Welcome back, Abrar! Signed in successfully.', 'success');
          showAdminView();
          loadAllDashboardData();
        } else {
          showAdminToast(data.error || 'Invalid credentials. Please try again.', 'error');
        }
      } catch (err) {
        console.error('Login error:', err);
        showAdminToast('Failed to connect to authentication server.', 'error');
      } finally {
        if (loginSubmitBtn) {
          loginSubmitBtn.disabled = false;
          loginSubmitBtn.innerHTML = `<i class="fa-solid fa-right-to-bracket"></i> <span>Sign In to Dashboard</span>`;
        }
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      if (confirm('Are you sure you want to sign out?')) {
        try {
          await apiRequest('/api/auth/logout', { method: 'POST' });
        } catch (_) {}
        authToken = null;
        localStorage.removeItem(TOKEN_KEY);
        showLoginView();
        showAdminToast('Signed out successfully.', 'info');
      }
    });
  }
}

// ==========================================================================
// TAB SWITCHING & SIDEBAR
// ==========================================================================
function initTabs() {
  const navBtns = document.querySelectorAll('.nav-item-btn[data-tab]');
  const titles = {
    overview: 'Dashboard Overview',
    profile: 'Profile Information & Bio',
    education: 'Education Pathway',
    skills: 'Technical Skills & Proficiencies',
    experience: 'Work Experience & Internships',
    projects: 'Project Portfolio',
    certificates: 'Certificates & Credentials',
    messages: 'Visitor Messages & Inquiries',
    settings: 'Security & Admin Settings'
  };

  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabKey = btn.getAttribute('data-tab');
      switchTab(tabKey);
    });
  });

  // Mobile sidebar toggle
  const menuToggle = document.getElementById('adminMenuToggle');
  const sidebar = document.getElementById('adminSidebar');
  if (menuToggle && sidebar) {
    menuToggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });
  }
}

window.switchTab = function(tabKey) {
  // Update nav buttons
  document.querySelectorAll('.nav-item-btn[data-tab]').forEach(b => {
    if (b.getAttribute('data-tab') === tabKey) {
      b.classList.add('active');
    } else {
      b.classList.remove('active');
    }
  });

  // Update panes
  document.querySelectorAll('.admin-tab-pane').forEach(p => {
    p.classList.remove('active');
  });

  const targetPane = document.getElementById(`tab-${tabKey}`);
  if (targetPane) targetPane.classList.add('active');

  // Update header title
  const pageTitle = document.getElementById('pageTitle');
  const titles = {
    overview: 'Dashboard Overview',
    profile: 'Profile Information & Bio',
    education: 'Education Records',
    skills: 'Technical Skills & Proficiencies',
    experience: 'Experience & Internships',
    projects: 'Project Portfolio Management',
    certificates: 'Certificates & Credentials',
    messages: 'Visitor Inquiries & Messages',
    settings: 'Security & Password Settings'
  };
  if (pageTitle && titles[tabKey]) {
    pageTitle.textContent = titles[tabKey];
  }

  // Close mobile sidebar if open
  const sidebar = document.getElementById('adminSidebar');
  if (sidebar) sidebar.classList.remove('open');
};

// ==========================================================================
// LOAD ALL DATA FROM DATABASE
// ==========================================================================
async function loadAllDashboardData() {
  try {
    const res = await apiRequest('/api/portfolio');
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        portfolioData = json.data;
        populateOverviewStats();
        populateProfileForm();
        renderEducationList();
        renderSkillsList();
        renderExperienceList();
        renderProjectsList();
        renderCertificatesList();
      }
    }
    loadMessages();
  } catch (err) {
    console.error('Failed to load dashboard data:', err);
  }
}

// ==========================================================================
// OVERVIEW STATS
// ==========================================================================
function populateOverviewStats() {
  if (!portfolioData) return;
  const projects = portfolioData.projects || [];
  const certs = portfolioData.certificates || [];
  const skills = portfolioData.skills_list || [];

  document.getElementById('statProjectsCount').textContent = projects.length;
  document.getElementById('statCertsCount').textContent = certs.length;
  document.getElementById('statSkillsCount').textContent = skills.length;
}

// ==========================================================================
// PROFILE MANAGEMENT
// ==========================================================================
function populateProfileForm() {
  if (!portfolioData || !portfolioData.profile) return;
  const p = portfolioData.profile;

  document.getElementById('profName').value = p.full_name || '';
  document.getElementById('profTitle').value = p.title || '';
  document.getElementById('profTagline').value = p.tagline || '';
  document.getElementById('profBio').value = p.bio || '';
  document.getElementById('profSummary').value = p.about_summary || '';
  document.getElementById('profAvatarUrl').value = p.avatar_url || '';
  document.getElementById('profAvatarPreview').src = p.avatar_url || 'assets/images/profile.jpg';
  document.getElementById('profResumeUrl').value = p.resume_url || '';
  document.getElementById('profEmail').value = p.email || '';
  document.getElementById('profPhone').value = p.phone || '';
  document.getElementById('profLocation').value = p.location || '';
  document.getElementById('profGithub').value = p.github_url || '';
  document.getElementById('profLinkedin').value = p.linkedin_url || '';
  document.getElementById('profTwitter').value = p.twitter_url || '';
  document.getElementById('profYears').value = p.experience_years || '2+';
  document.getElementById('profProjCount').value = p.projects_completed || '12+';
  document.getElementById('profSatisfaction').value = p.happy_clients || '100%';
}

function initProfileHandlers() {
  const profileForm = document.getElementById('profileForm');
  const avatarInput = document.getElementById('avatarFileInput');
  const resumeInput = document.getElementById('resumeFileInput');
  const avatarUrlInput = document.getElementById('profAvatarUrl');

  // Preview on manual URL input change
  if (avatarUrlInput) {
    avatarUrlInput.addEventListener('input', () => {
      document.getElementById('profAvatarPreview').src = avatarUrlInput.value || 'assets/images/profile.jpg';
    });
  }

  // Upload Avatar
  if (avatarInput) {
    avatarInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const formData = new FormData();
      formData.append('file', file);

      try {
        showAdminToast('Uploading avatar photo...', 'info');
        const res = await apiRequest('/api/admin/upload', {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        if (res.ok && data.success) {
          document.getElementById('profAvatarUrl').value = data.url;
          document.getElementById('profAvatarPreview').src = data.url;
          showAdminToast('Avatar uploaded successfully!', 'success');
        } else {
          showAdminToast(data.error || 'Failed to upload image.', 'error');
        }
      } catch (err) {
        showAdminToast('File upload error.', 'error');
      }
    });
  }

  // Upload Resume
  if (resumeInput) {
    resumeInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const formData = new FormData();
      formData.append('file', file);

      try {
        showAdminToast('Uploading resume document...', 'info');
        const res = await apiRequest('/api/admin/upload', {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        if (res.ok && data.success) {
          document.getElementById('profResumeUrl').value = data.url;
          showAdminToast('Resume uploaded! Saved URL.', 'success');
        } else {
          showAdminToast(data.error || 'Failed to upload document.', 'error');
        }
      } catch (err) {
        showAdminToast('Resume upload error.', 'error');
      }
    });
  }

  // Save profile changes
  if (profileForm) {
    profileForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const saveBtn = document.getElementById('saveProfileBtn');
      if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Saving...`;
      }

      const payload = {
        full_name: document.getElementById('profName').value.trim(),
        title: document.getElementById('profTitle').value.trim(),
        tagline: document.getElementById('profTagline').value.trim(),
        bio: document.getElementById('profBio').value.trim(),
        about_summary: document.getElementById('profSummary').value.trim(),
        avatar_url: document.getElementById('profAvatarUrl').value.trim(),
        resume_url: document.getElementById('profResumeUrl').value.trim(),
        email: document.getElementById('profEmail').value.trim(),
        phone: document.getElementById('profPhone').value.trim(),
        location: document.getElementById('profLocation').value.trim(),
        github_url: document.getElementById('profGithub').value.trim(),
        linkedin_url: document.getElementById('profLinkedin').value.trim(),
        twitter_url: document.getElementById('profTwitter').value.trim(),
        experience_years: document.getElementById('profYears').value.trim(),
        projects_completed: document.getElementById('profProjCount').value.trim(),
        happy_clients: document.getElementById('profSatisfaction').value.trim()
      };

      try {
        const res = await apiRequest('/api/admin/profile', {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        const data = await res.json();

        if (res.ok && data.success) {
          showAdminToast('Profile details updated and saved to database!', 'success');
          portfolioData.profile = data.data;
        } else {
          showAdminToast(data.error || 'Failed to update profile.', 'error');
        }
      } catch (err) {
        showAdminToast('Error updating profile.', 'error');
      } finally {
        if (saveBtn) {
          saveBtn.disabled = false;
          saveBtn.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> Save Profile Changes`;
        }
      }
    });
  }
}

// ==========================================================================
// EDUCATION CRUD
// ==========================================================================
function renderEducationList() {
  const container = document.getElementById('adminEducationList');
  if (!container || !portfolioData) return;

  const list = portfolioData.education || [];
  if (list.length === 0) {
    container.innerHTML = `<p style="color:var(--text-muted); text-align:center; padding:2rem 0;">No education records added yet.</p>`;
    return;
  }

  container.innerHTML = list.map(item => `
    <div class="admin-item-card">
      <div class="admin-item-info">
        <span class="admin-item-title">${escapeHtml(item.degree)}</span>
        <span class="admin-item-sub">${escapeHtml(item.institution)} • <strong>${escapeHtml(item.period)}</strong> ${item.grade ? `(${escapeHtml(item.grade)})` : ''}</span>
      </div>
      <div class="admin-item-actions">
        <button class="icon-action-btn" onclick="openEduModal(${item.id})" title="Edit"><i class="fa-solid fa-pen-to-square"></i></button>
        <button class="icon-action-btn delete" onclick="deleteEducation(${item.id})" title="Delete"><i class="fa-solid fa-trash-can"></i></button>
      </div>
    </div>
  `).join('');
}

window.openEduModal = function(id = null) {
  const modal = document.getElementById('eduModal');
  const form = document.getElementById('eduForm');
  const title = document.getElementById('eduModalTitle');
  form.reset();

  if (id) {
    title.textContent = 'Edit Education Record';
    const item = portfolioData.education.find(e => e.id === id);
    if (item) {
      document.getElementById('eduId').value = item.id;
      document.getElementById('eduDegree').value = item.degree;
      document.getElementById('eduInstitution').value = item.institution;
      document.getElementById('eduPeriod').value = item.period;
      document.getElementById('eduGrade').value = item.grade || '';
      document.getElementById('eduDesc').value = item.description || '';
    }
  } else {
    title.textContent = 'Add Education Record';
    document.getElementById('eduId').value = '';
  }

  modal.classList.add('active');
};

function initEduFormHandler() {
  const form = document.getElementById('eduForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('eduId').value;
    const payload = {
      degree: document.getElementById('eduDegree').value.trim(),
      institution: document.getElementById('eduInstitution').value.trim(),
      period: document.getElementById('eduPeriod').value.trim(),
      grade: document.getElementById('eduGrade').value.trim(),
      description: document.getElementById('eduDesc').value.trim()
    };

    try {
      const endpoint = id ? `/api/admin/education/${id}` : '/api/admin/education';
      const method = id ? 'PUT' : 'POST';
      const res = await apiRequest(endpoint, {
        method,
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.ok && data.success) {
        showAdminToast(id ? 'Education updated!' : 'Education added!', 'success');
        closeModal('eduModal');
        await loadAllDashboardData();
      } else {
        showAdminToast(data.error || 'Failed to save education.', 'error');
      }
    } catch (err) {
      showAdminToast('Error saving education.', 'error');
    }
  });
}

window.deleteEducation = async function(id) {
  if (!confirm('Are you sure you want to delete this education entry?')) return;
  try {
    const res = await apiRequest(`/api/admin/education/${id}`, { method: 'DELETE' });
    if (res.ok) {
      showAdminToast('Education record deleted.', 'info');
      await loadAllDashboardData();
    }
  } catch (err) {
    showAdminToast('Error deleting education record.', 'error');
  }
};

// ==========================================================================
// SKILLS CRUD
// ==========================================================================
function renderSkillsList() {
  const container = document.getElementById('adminSkillsList');
  if (!container || !portfolioData) return;

  const list = portfolioData.skills_list || [];
  if (list.length === 0) {
    container.innerHTML = `<p style="color:var(--text-muted); text-align:center; padding:2rem 0;">No skills added yet.</p>`;
    return;
  }

  container.innerHTML = list.map(item => `
    <div class="admin-item-card">
      <div class="admin-item-info">
        <span class="admin-item-title">${escapeHtml(item.name)} (${item.proficiency}%)</span>
        <span class="admin-item-sub">Category: <strong>${escapeHtml(item.category)}</strong></span>
      </div>
      <div class="admin-item-actions">
        <button class="icon-action-btn" onclick="openSkillModal(${item.id})" title="Edit"><i class="fa-solid fa-pen-to-square"></i></button>
        <button class="icon-action-btn delete" onclick="deleteSkill(${item.id})" title="Delete"><i class="fa-solid fa-trash-can"></i></button>
      </div>
    </div>
  `).join('');
}

window.openSkillModal = function(id = null) {
  const modal = document.getElementById('skillModal');
  const form = document.getElementById('skillForm');
  const title = document.getElementById('skillModalTitle');
  form.reset();

  if (id) {
    title.textContent = 'Edit Skill';
    const item = portfolioData.skills_list.find(s => s.id === id);
    if (item) {
      document.getElementById('skillId').value = item.id;
      document.getElementById('skillName').value = item.name;
      document.getElementById('skillCategory').value = item.category;
      document.getElementById('skillProficiency').value = item.proficiency;
      document.getElementById('profValDisplay').textContent = `${item.proficiency}%`;
      document.getElementById('skillIcon').value = item.icon || '';
    }
  } else {
    title.textContent = 'Add Technical Skill';
    document.getElementById('skillId').value = '';
    document.getElementById('skillProficiency').value = 85;
    document.getElementById('profValDisplay').textContent = '85%';
  }

  modal.classList.add('active');
};

function initSkillFormHandler() {
  const form = document.getElementById('skillForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('skillId').value;
    const payload = {
      name: document.getElementById('skillName').value.trim(),
      category: document.getElementById('skillCategory').value,
      proficiency: parseInt(document.getElementById('skillProficiency').value, 10),
      icon: document.getElementById('skillIcon').value.trim()
    };

    try {
      const endpoint = id ? `/api/admin/skills/${id}` : '/api/admin/skills';
      const method = id ? 'PUT' : 'POST';
      const res = await apiRequest(endpoint, {
        method,
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.ok && data.success) {
        showAdminToast(id ? 'Skill updated!' : 'Skill added!', 'success');
        closeModal('skillModal');
        await loadAllDashboardData();
      } else {
        showAdminToast(data.error || 'Failed to save skill.', 'error');
      }
    } catch (err) {
      showAdminToast('Error saving skill.', 'error');
    }
  });
}

window.deleteSkill = async function(id) {
  if (!confirm('Are you sure you want to delete this skill?')) return;
  try {
    const res = await apiRequest(`/api/admin/skills/${id}`, { method: 'DELETE' });
    if (res.ok) {
      showAdminToast('Skill deleted.', 'info');
      await loadAllDashboardData();
    }
  } catch (err) {
    showAdminToast('Error deleting skill.', 'error');
  }
};

// ==========================================================================
// EXPERIENCE CRUD
// ==========================================================================
function renderExperienceList() {
  const container = document.getElementById('adminExperienceList');
  if (!container || !portfolioData) return;

  const list = portfolioData.experience || [];
  if (list.length === 0) {
    container.innerHTML = `<p style="color:var(--text-muted); text-align:center; padding:2rem 0;">No experience entries added yet.</p>`;
    return;
  }

  container.innerHTML = list.map(item => `
    <div class="admin-item-card">
      <div class="admin-item-info">
        <span class="admin-item-title">${escapeHtml(item.role)}</span>
        <span class="admin-item-sub">${escapeHtml(item.company)} • <strong>${escapeHtml(item.period)}</strong></span>
      </div>
      <div class="admin-item-actions">
        <button class="icon-action-btn" onclick="openExpModal(${item.id})" title="Edit"><i class="fa-solid fa-pen-to-square"></i></button>
        <button class="icon-action-btn delete" onclick="deleteExperience(${item.id})" title="Delete"><i class="fa-solid fa-trash-can"></i></button>
      </div>
    </div>
  `).join('');
}

window.openExpModal = function(id = null) {
  const modal = document.getElementById('expModal');
  const form = document.getElementById('expForm');
  const title = document.getElementById('expModalTitle');
  form.reset();

  if (id) {
    title.textContent = 'Edit Experience';
    const item = portfolioData.experience.find(e => e.id === id);
    if (item) {
      document.getElementById('expId').value = item.id;
      document.getElementById('expRole').value = item.role;
      document.getElementById('expCompany').value = item.company;
      document.getElementById('expPeriod').value = item.period;
      document.getElementById('expLocation').value = item.location || '';
      document.getElementById('expDesc').value = item.description || '';
    }
  } else {
    title.textContent = 'Add Experience';
    document.getElementById('expId').value = '';
  }

  modal.classList.add('active');
};

function initExpFormHandler() {
  const form = document.getElementById('expForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('expId').value;
    const payload = {
      role: document.getElementById('expRole').value.trim(),
      company: document.getElementById('expCompany').value.trim(),
      period: document.getElementById('expPeriod').value.trim(),
      location: document.getElementById('expLocation').value.trim(),
      description: document.getElementById('expDesc').value.trim()
    };

    try {
      const endpoint = id ? `/api/admin/experience/${id}` : '/api/admin/experience';
      const method = id ? 'PUT' : 'POST';
      const res = await apiRequest(endpoint, {
        method,
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.ok && data.success) {
        showAdminToast(id ? 'Experience updated!' : 'Experience added!', 'success');
        closeModal('expModal');
        await loadAllDashboardData();
      } else {
        showAdminToast(data.error || 'Failed to save experience.', 'error');
      }
    } catch (err) {
      showAdminToast('Error saving experience.', 'error');
    }
  });
}

window.deleteExperience = async function(id) {
  if (!confirm('Are you sure you want to delete this experience entry?')) return;
  try {
    const res = await apiRequest(`/api/admin/experience/${id}`, { method: 'DELETE' });
    if (res.ok) {
      showAdminToast('Experience deleted.', 'info');
      await loadAllDashboardData();
    }
  } catch (err) {
    showAdminToast('Error deleting experience.', 'error');
  }
};

// ==========================================================================
// PROJECTS CRUD
// ==========================================================================
function renderProjectsList() {
  const container = document.getElementById('adminProjectsList');
  if (!container || !portfolioData) return;

  const list = portfolioData.projects || [];
  if (list.length === 0) {
    container.innerHTML = `<p style="color:var(--text-muted); text-align:center; padding:2rem 0;">No projects added yet.</p>`;
    return;
  }

  container.innerHTML = list.map(item => `
    <div class="admin-item-card">
      <div style="width: 60px; height: 42px; border-radius: var(--radius-sm); overflow: hidden; background: var(--bg-secondary); flex-shrink: 0;">
        <img src="${escapeHtml(item.image_url || 'assets/images/project-1.svg')}" style="width:100%; height:100%; object-fit:cover;">
      </div>
      <div class="admin-item-info">
        <span class="admin-item-title">${escapeHtml(item.title)}</span>
        <span class="admin-item-sub">Category: <strong>${escapeHtml(item.category)}</strong> • Status: <strong>${escapeHtml(item.status)}</strong></span>
      </div>
      <div class="admin-item-actions">
        <button class="icon-action-btn" onclick="openEditProjectModal(${item.id})" title="Edit"><i class="fa-solid fa-pen-to-square"></i></button>
        <button class="icon-action-btn delete" onclick="deleteProject(${item.id})" title="Delete"><i class="fa-solid fa-trash-can"></i></button>
      </div>
    </div>
  `).join('');
}

window.openNewProjectModal = function() {
  const modal = document.getElementById('projectModal');
  const form = document.getElementById('projectForm');
  form.reset();
  document.getElementById('projectModalTitle').textContent = 'Add New Project';
  document.getElementById('projectId').value = '';
  document.getElementById('projImgPreview').src = 'assets/images/project-1.svg';
  document.getElementById('projImageUrl').value = 'assets/images/project-1.svg';
  modal.classList.add('active');
};

window.openEditProjectModal = function(id) {
  const modal = document.getElementById('projectModal');
  const item = portfolioData.projects.find(p => p.id === id);
  if (!item) return;

  document.getElementById('projectModalTitle').textContent = 'Edit Project';
  document.getElementById('projectId').value = item.id;
  document.getElementById('projTitle').value = item.title;
  document.getElementById('projCategory').value = item.category;
  document.getElementById('projDesc').value = item.description;
  document.getElementById('projTech').value = item.tech_stack || '';
  document.getElementById('projGithub').value = item.github_url || '';
  document.getElementById('projDemo').value = item.demo_url || '';
  document.getElementById('projStatus').value = item.status || 'Completed';
  document.getElementById('projFeatured').checked = item.featured === 1;

  const img = item.image_url || 'assets/images/project-1.svg';
  document.getElementById('projImageUrl').value = img;
  document.getElementById('projImgPreview').src = img;

  modal.classList.add('active');
};

function initProjectFormHandler() {
  const form = document.getElementById('projectForm');
  const fileInput = document.getElementById('projFileInput');
  const urlInput = document.getElementById('projImageUrl');

  if (urlInput) {
    urlInput.addEventListener('input', () => {
      document.getElementById('projImgPreview').src = urlInput.value || 'assets/images/project-1.svg';
    });
  }

  // Upload project image
  if (fileInput) {
    fileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const formData = new FormData();
      formData.append('file', file);

      try {
        showAdminToast('Uploading project thumbnail...', 'info');
        const res = await apiRequest('/api/admin/upload', {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        if (res.ok && data.success) {
          document.getElementById('projImageUrl').value = data.url;
          document.getElementById('projImgPreview').src = data.url;
          showAdminToast('Thumbnail uploaded!', 'success');
        } else {
          showAdminToast(data.error || 'Failed to upload image.', 'error');
        }
      } catch (err) {
        showAdminToast('Upload failed.', 'error');
      }
    });
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('projectId').value;
      const payload = {
        title: document.getElementById('projTitle').value.trim(),
        category: document.getElementById('projCategory').value,
        description: document.getElementById('projDesc').value.trim(),
        image_url: document.getElementById('projImageUrl').value.trim(),
        tech_stack: document.getElementById('projTech').value.trim(),
        github_url: document.getElementById('projGithub').value.trim(),
        demo_url: document.getElementById('projDemo').value.trim(),
        status: document.getElementById('projStatus').value,
        featured: document.getElementById('projFeatured').checked ? 1 : 0
      };

      try {
        const endpoint = id ? `/api/admin/projects/${id}` : '/api/admin/projects';
        const method = id ? 'PUT' : 'POST';
        const res = await apiRequest(endpoint, {
          method,
          body: JSON.stringify(payload)
        });
        const data = await res.json();

        if (res.ok && data.success) {
          showAdminToast(id ? 'Project updated!' : 'Project added!', 'success');
          closeModal('projectModal');
          await loadAllDashboardData();
        } else {
          showAdminToast(data.error || 'Failed to save project.', 'error');
        }
      } catch (err) {
        showAdminToast('Error saving project.', 'error');
      }
    });
  }
}

window.deleteProject = async function(id) {
  if (!confirm('Are you sure you want to delete this project?')) return;
  try {
    const res = await apiRequest(`/api/admin/projects/${id}`, { method: 'DELETE' });
    if (res.ok) {
      showAdminToast('Project deleted.', 'info');
      await loadAllDashboardData();
    }
  } catch (err) {
    showAdminToast('Error deleting project.', 'error');
  }
};

// ==========================================================================
// CERTIFICATES CRUD
// ==========================================================================
function renderCertificatesList() {
  const container = document.getElementById('adminCertificatesList');
  if (!container || !portfolioData) return;

  const list = portfolioData.certificates || [];
  if (list.length === 0) {
    container.innerHTML = `<p style="color:var(--text-muted); text-align:center; padding:2rem 0;">No certificates added yet.</p>`;
    return;
  }

  container.innerHTML = list.map(item => `
    <div class="admin-item-card">
      <div style="width: 50px; height: 35px; border-radius: var(--radius-sm); overflow: hidden; background: var(--bg-secondary); flex-shrink: 0;">
        <img src="${escapeHtml(item.image_url || 'assets/images/cert-default.svg')}" style="width:100%; height:100%; object-fit:cover;">
      </div>
      <div class="admin-item-info">
        <span class="admin-item-title">${escapeHtml(item.title)}</span>
        <span class="admin-item-sub">Issuer: <strong>${escapeHtml(item.issuer)}</strong> • Year: <strong>${escapeHtml(item.issue_date)}</strong></span>
      </div>
      <div class="admin-item-actions">
        <button class="icon-action-btn" onclick="openEditCertModal(${item.id})" title="Edit"><i class="fa-solid fa-pen-to-square"></i></button>
        <button class="icon-action-btn delete" onclick="deleteCertificate(${item.id})" title="Delete"><i class="fa-solid fa-trash-can"></i></button>
      </div>
    </div>
  `).join('');
}

window.openNewCertModal = function() {
  const modal = document.getElementById('certModal');
  const form = document.getElementById('certForm');
  form.reset();
  document.getElementById('certModalTitle').textContent = 'Add Certificate';
  document.getElementById('certId').value = '';
  document.getElementById('certImgPreview').src = 'assets/images/cert-default.svg';
  document.getElementById('certImageUrl').value = 'assets/images/cert-default.svg';
  modal.classList.add('active');
};

window.openEditCertModal = function(id) {
  const modal = document.getElementById('certModal');
  const item = portfolioData.certificates.find(c => c.id === id);
  if (!item) return;

  document.getElementById('certModalTitle').textContent = 'Edit Certificate';
  document.getElementById('certId').value = item.id;
  document.getElementById('certTitle').value = item.title;
  document.getElementById('certIssuer').value = item.issuer;
  document.getElementById('certDate').value = item.issue_date;
  document.getElementById('certCredId').value = item.credential_id || '';
  document.getElementById('certCredUrl').value = item.credential_url || '';

  const img = item.image_url || 'assets/images/cert-default.svg';
  document.getElementById('certImageUrl').value = img;
  document.getElementById('certImgPreview').src = img;

  modal.classList.add('active');
};

function initCertFormHandler() {
  const form = document.getElementById('certForm');
  const fileInput = document.getElementById('certFileInput');
  const urlInput = document.getElementById('certImageUrl');

  if (urlInput) {
    urlInput.addEventListener('input', () => {
      document.getElementById('certImgPreview').src = urlInput.value || 'assets/images/cert-default.svg';
    });
  }

  // Upload cert image
  if (fileInput) {
    fileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const formData = new FormData();
      formData.append('file', file);

      try {
        showAdminToast('Uploading certificate image...', 'info');
        const res = await apiRequest('/api/admin/upload', {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        if (res.ok && data.success) {
          document.getElementById('certImageUrl').value = data.url;
          document.getElementById('certImgPreview').src = data.url;
          showAdminToast('Certificate image uploaded!', 'success');
        } else {
          showAdminToast(data.error || 'Failed to upload.', 'error');
        }
      } catch (err) {
        showAdminToast('Upload failed.', 'error');
      }
    });
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('certId').value;
      const payload = {
        title: document.getElementById('certTitle').value.trim(),
        issuer: document.getElementById('certIssuer').value.trim(),
        issue_date: document.getElementById('certDate').value.trim(),
        credential_id: document.getElementById('certCredId').value.trim(),
        credential_url: document.getElementById('certCredUrl').value.trim(),
        image_url: document.getElementById('certImageUrl').value.trim()
      };

      try {
        const endpoint = id ? `/api/admin/certificates/${id}` : '/api/admin/certificates';
        const method = id ? 'PUT' : 'POST';
        const res = await apiRequest(endpoint, {
          method,
          body: JSON.stringify(payload)
        });
        const data = await res.json();

        if (res.ok && data.success) {
          showAdminToast(id ? 'Certificate updated!' : 'Certificate added!', 'success');
          closeModal('certModal');
          await loadAllDashboardData();
        } else {
          showAdminToast(data.error || 'Failed to save certificate.', 'error');
        }
      } catch (err) {
        showAdminToast('Error saving certificate.', 'error');
      }
    });
  }
}

window.deleteCertificate = async function(id) {
  if (!confirm('Are you sure you want to delete this certificate?')) return;
  try {
    const res = await apiRequest(`/api/admin/certificates/${id}`, { method: 'DELETE' });
    if (res.ok) {
      showAdminToast('Certificate deleted.', 'info');
      await loadAllDashboardData();
    }
  } catch (err) {
    showAdminToast('Error deleting certificate.', 'error');
  }
};

// ==========================================================================
// MESSAGES MANAGEMENT
// ==========================================================================
async function loadMessages() {
  const container = document.getElementById('adminMessagesList');
  const countBadge = document.getElementById('statMessagesCount');
  const unreadBadge = document.getElementById('unreadBadge');
  if (!container) return;

  try {
    const res = await apiRequest('/api/admin/messages');
    if (res.ok) {
      const json = await res.json();
      const messages = json.data || [];
      const unreadCount = json.unread_count || 0;

      if (countBadge) countBadge.textContent = messages.length;
      if (unreadBadge) {
        if (unreadCount > 0) {
          unreadBadge.textContent = unreadCount;
          unreadBadge.style.display = 'inline-block';
        } else {
          unreadBadge.style.display = 'none';
        }
      }

      if (messages.length === 0) {
        container.innerHTML = `<p style="color:var(--text-muted); text-align:center; padding:3rem 0;">Your inbox is empty. No messages received yet.</p>`;
        return;
      }

      container.innerHTML = messages.map(m => {
        const dateStr = new Date(m.created_at).toLocaleString();
        return `
          <div class="message-card ${m.is_read === 0 ? 'unread' : ''}">
            <div class="message-header">
              <div>
                <span class="message-sender">${escapeHtml(m.name)}</span>
                <span style="color:var(--text-muted); font-size:0.85rem; margin-left:0.5rem;">&lt;${escapeHtml(m.email)}&gt;</span>
              </div>
              <span class="message-date">${escapeHtml(dateStr)}</span>
            </div>

            <div class="message-subject">Subject: ${escapeHtml(m.subject || 'Portfolio Inquiry')}</div>
            <div class="message-body">${escapeHtml(m.message)}</div>

            <div style="display:flex; justify-content:space-between; align-items:center; padding-top:0.75rem; border-top:1px solid var(--border-color);">
              <div>
                ${m.is_read === 0 ? `
                  <button class="btn btn-outline btn-sm" onclick="markMessageRead(${m.id})">
                    <i class="fa-solid fa-check-double"></i> Mark as Read
                  </button>
                ` : `
                  <span style="font-size:0.8rem; color:#10b981;"><i class="fa-solid fa-check"></i> Read</span>
                `}
              </div>
              <div>
                <a href="mailto:${escapeHtml(m.email)}?subject=Re: ${encodeURIComponent(m.subject || 'Portfolio Inquiry')}" class="btn btn-primary btn-sm" style="margin-right:0.5rem;">
                  <i class="fa-solid fa-reply"></i> Reply via Email
                </a>
                <button class="btn btn-outline btn-sm" style="border-color:#ef4444; color:#ef4444;" onclick="deleteMessage(${m.id})">
                  <i class="fa-solid fa-trash"></i>
                </button>
              </div>
            </div>
          </div>
        `;
      }).join('');
    }
  } catch (err) {
    console.error('Failed to load messages:', err);
  }
}

window.markMessageRead = async function(id) {
  try {
    const res = await apiRequest(`/api/admin/messages/${id}/read`, { method: 'PUT' });
    if (res.ok) {
      loadMessages();
    }
  } catch (err) {
    showAdminToast('Failed to mark read.', 'error');
  }
};

window.deleteMessage = async function(id) {
  if (!confirm('Are you sure you want to delete this message?')) return;
  try {
    const res = await apiRequest(`/api/admin/messages/${id}`, { method: 'DELETE' });
    if (res.ok) {
      showAdminToast('Message deleted.', 'info');
      loadMessages();
    }
  } catch (err) {
    showAdminToast('Failed to delete message.', 'error');
  }
};

// ==========================================================================
// PASSWORD CHANGE & RESTORE DEMO
// ==========================================================================
function initSettingsHandlers() {
  const form = document.getElementById('changePasswordForm');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const current_password = document.getElementById('currPass').value;
      const new_password = document.getElementById('newPass').value;
      const confirm_password = document.getElementById('confirmPass').value;

      if (new_password !== confirm_password) {
        showAdminToast('New passwords do not match!', 'error');
        return;
      }

      if (new_password.length < 6) {
        showAdminToast('New password must be at least 6 characters.', 'error');
        return;
      }

      try {
        const res = await apiRequest('/api/admin/change-password', {
          method: 'POST',
          body: JSON.stringify({ current_password, new_password })
        });
        const data = await res.json();

        if (res.ok && data.success) {
          showAdminToast('Admin password successfully updated!', 'success');
          form.reset();
        } else {
          showAdminToast(data.error || 'Failed to update password.', 'error');
        }
      } catch (err) {
        showAdminToast('Error updating password.', 'error');
      }
    });
  }
}

window.confirmResetDemo = async function() {
  const answer = prompt('Type "RESET" to confirm resetting all portfolio content to default demo data:');
  if (answer === 'RESET') {
    try {
      const res = await apiRequest('/api/admin/reset-demo', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        showAdminToast('Demo data restored successfully!', 'success');
        await loadAllDashboardData();
        switchTab('overview');
      }
    } catch (err) {
      showAdminToast('Failed to reset demo data.', 'error');
    }
  }
};

// ==========================================================================
// MODAL CONTROLS
// ==========================================================================
window.closeModal = function(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('active');
};

function initModalEscListeners() {
  document.querySelectorAll('.modal-backdrop').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
      }
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-backdrop.active').forEach(m => m.classList.remove('active'));
    }
  });
}

// ==========================================================================
// THEME SYNC IN ADMIN
// ==========================================================================
function initAdminTheme() {
  const toggleBtn = document.getElementById('adminThemeToggleBtn');
  const icon = document.getElementById('adminThemeIcon');
  const saved = localStorage.getItem('abrar_portfolio_theme') || 'dark';

  document.documentElement.setAttribute('data-theme', saved);
  if (icon) {
    icon.className = saved === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
  }

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('abrar_portfolio_theme', next);
      if (icon) {
        icon.className = next === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
      }
    });
  }
}

// ==========================================================================
// TOAST NOTIFICATIONS
// ==========================================================================
function showAdminToast(message, type = 'info') {
  const container = document.getElementById('adminToastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  let icon = 'fa-solid fa-circle-info';
  if (type === 'success') icon = 'fa-solid fa-circle-check';
  if (type === 'error') icon = 'fa-solid fa-triangle-exclamation';

  toast.innerHTML = `
    <i class="${icon}"></i>
    <span>${escapeHtml(message)}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 400);
  }, 4000);
}

// Helper: Escape HTML
function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ==========================================================================
// INITIALIZATION
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  initAdminTheme();
  initAuthHandlers();
  initTabs();
  initModalEscListeners();
  initProfileHandlers();
  initEduFormHandler();
  initSkillFormHandler();
  initExpFormHandler();
  initProjectFormHandler();
  initCertFormHandler();
  initSettingsHandlers();
  checkAuth();
});
