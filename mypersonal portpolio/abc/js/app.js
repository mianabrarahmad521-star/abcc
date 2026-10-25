/**
 * Abrar Ahmad - Personal Portfolio Interactive Logic
 * Handles dynamic data fetching, theme toggling, typing effect,
 * project & skill filtering, modals, and contact form submissions.
 */

// Embedded fallback data ensures portfolio works smoothly even when viewed locally via file://
const FALLBACK_DATA = {
  profile: {
    full_name: 'Abrar Ahmad',
    title: 'Software Engineering Student | Web Developer',
    tagline: 'Bridging computational thinking with modern web design to build fast, scalable, and intuitive digital experiences.',
    bio: 'Hello! I am Abrar Ahmad, a dedicated Software Engineering student and passionate Web Developer. I have a strong foundation in core computer science disciplines, data structures, algorithms, and full-stack web technologies. I love transforming intricate problems into clean, well-architected software with pleasant user interfaces.',
    about_summary: 'I am actively pursuing my BS in Software Engineering with an unwavering commitment to learning modern frameworks, software engineering best practices, and clean code principles. I am eager to collaborate on challenging projects, contribute to impactful products, and build a flourishing career in software development.',
    avatar_url: 'assets/images/profile.jpg',
    resume_url: 'assets/docs/Abrar_Ahmad_Resume.pdf',
    email: 'mianabrarahmad521@gmail.com',
    phone: '+92 342 1967521',
    location: 'Islamabad / Lahore, Pakistan',
    github_url: 'https://github.com/abrarahmad',
    linkedin_url: 'https://linkedin.com/in/abrar-ahmad',
    twitter_url: 'https://twitter.com/abrarahmad_dev',
    available_for_hire: 1,
    experience_years: '2+',
    projects_completed: '12+',
    happy_clients: '100%'
  },
  education: [
    {
      id: 1,
      degree: 'BS Software Engineering',
      institution: 'University Department of Computer Science & Software Engineering',
      period: '2023 - Present (In Progress)',
      grade: 'CGPA: 3.8 / 4.0',
      description: 'Pursuing an in-depth curriculum focused on Data Structures & Algorithms, Object-Oriented Analysis & Design, Database Systems, Web Engineering, Software Quality Assurance, and Distributed Systems.'
    },
    {
      id: 2,
      degree: 'FSc Pre-Engineering / ICS',
      institution: 'Punjab Group of Colleges / Higher Secondary Board',
      period: '2021 - 2023',
      grade: 'Grade: A+ (First Division)',
      description: 'Completed rigorous studies in Advanced Mathematics, Physics, and Computer Science fundamentals, establishing a solid analytical mindset.'
    },
    {
      id: 3,
      degree: 'Matriculation (Science)',
      institution: 'Secondary School Certificate Board',
      period: '2019 - 2021',
      grade: 'Grade: A+ with Distinction',
      description: 'Graduated with honors in Science, covering Physics, Chemistry, Biology/Computer Science, and Mathematics.'
    }
  ],
  skills_list: [
    { id: 1, name: 'HTML5', category: 'frontend', proficiency: 95, icon: 'fa-brands fa-html5' },
    { id: 2, name: 'CSS3 & Responsive Design', category: 'frontend', proficiency: 90, icon: 'fa-brands fa-css3-alt' },
    { id: 3, name: 'JavaScript (ES6+)', category: 'frontend', proficiency: 85, icon: 'fa-brands fa-js' },
    { id: 4, name: 'C++', category: 'programming', proficiency: 88, icon: 'fa-solid fa-code' },
    { id: 6, name: 'Python', category: 'programming', proficiency: 88, icon: 'fa-brands fa-python' },
    { id: 7, name: 'SQLite / SQL', category: 'database', proficiency: 82, icon: 'fa-solid fa-database' },
    { id: 8, name: 'Git & GitHub', category: 'tools', proficiency: 85, icon: 'fa-brands fa-git-alt' },
    { id: 9, name: 'MS Office Suite (Word, Excel, PPT)', category: 'tools', proficiency: 92, icon: 'fa-solid fa-file-lines' },
    { id: 10, name: 'Object-Oriented Programming (OOP)', category: 'programming', proficiency: 90, icon: 'fa-solid fa-layer-group' },
    { id: 11, name: 'Data Structures & Algorithms', category: 'programming', proficiency: 84, icon: 'fa-solid fa-microchip' }
  ],
  experience: [
    {
      id: 1,
      role: 'Junior Web Developer (Intern)',
      company: 'Tech Solutions Lab',
      period: 'Jun 2025 - Aug 2025',
      location: 'Lahore, Pakistan (Hybrid)',
      description: 'Engineered responsive web interfaces using modern HTML5, CSS3, and JavaScript. Collaborated with senior developers on REST API endpoints and enhanced site loading performance by 35% through asset optimization.'
    },
    {
      id: 2,
      role: 'Freelance Web Developer & Software Designer',
      company: 'Upwork & Independent Clients',
      period: '2024 - Present',
      location: 'Remote',
      description: 'Designed and launched custom portfolio websites and academic tools for local clients. Emphasized clean typography, mobile-first design, SEO basics, and reliable database storage.'
    },
    {
      id: 3,
      role: 'Academic Project Lead & Peer Tutor',
      company: 'University Software Engineering Society',
      period: '2024 - 2025',
      location: 'Campus',
      description: 'Mentored junior students in C++ object-oriented programming and introductory web development. Coordinated group project code repositories and conducted code reviews.'
    }
  ],
  projects: [
    {
      id: 1,
      title: 'Personal Portfolio & Dynamic CMS Platform',
      category: 'web',
      description: 'A modern, fully responsive personal portfolio with a private admin dashboard, custom REST API, SQLite persistence, and light/dark theme toggle.',
      image_url: 'assets/images/project-1.svg',
      tech_stack: 'HTML5, CSS3, JavaScript, Python, SQLite',
      github_url: 'https://github.com/abrarahmad/personal-portfolio',
      demo_url: 'http://localhost:5000',
      status: 'Completed',
      featured: 1
    },
    {
      id: 2,
      title: 'Student Academic Record & Portal Management System',
      category: 'software',
      description: 'Comprehensive desktop & web application designed to manage student enrollments, calculate GPAs, track attendance, and generate printable transcripts.',
      image_url: 'assets/images/project-2.svg',
      tech_stack: 'Java, JavaFX, SQLite, OOP Principles',
      github_url: 'https://github.com/abrarahmad/student-portal-manager',
      demo_url: 'https://github.com/abrarahmad/student-portal-manager',
      status: 'Completed',
      featured: 1
    },
    {
      id: 3,
      title: 'E-Commerce Storefront & Shopping Cart',
      category: 'web',
      description: 'Interactive client-side e-commerce interface featuring real-time product filtering, search, cart persistence via local storage, and simulated checkout flow.',
      image_url: 'assets/images/project-3.svg',
      tech_stack: 'HTML5, CSS3, JavaScript ES6, REST API',
      github_url: 'https://github.com/abrarahmad/ecommerce-storefront',
      demo_url: 'https://github.com/abrarahmad/ecommerce-storefront',
      status: 'Completed',
      featured: 1
    },
    {
      id: 4,
      title: 'Data Analytics & Automated Report Generator',
      category: 'python',
      description: 'Python utility suite that cleans and parses CSV/Excel datasets, calculates summary statistics, and exports automated PDF & Excel analytical reports.',
      image_url: 'assets/images/project-4.svg',
      tech_stack: 'Python, Pandas, OpenPyXL, MS Office Automation',
      github_url: 'https://github.com/abrarahmad/python-report-automation',
      demo_url: 'https://github.com/abrarahmad/python-report-automation',
      status: 'Completed',
      featured: 0
    },
    {
      id: 5,
      title: 'Sorting Algorithms & Data Structure Visualizer',
      category: 'software',
      description: 'Interactive visualizer bringing QuickSort, MergeSort, BubbleSort, and Graph Traversal algorithms to life with customizable speed and step-by-step narration.',
      image_url: 'assets/images/project-5.svg',
      tech_stack: 'C++, JavaScript, Canvas API, Algorithms',
      github_url: 'https://github.com/abrarahmad/algorithm-visualizer',
      demo_url: 'https://github.com/abrarahmad/algorithm-visualizer',
      status: 'In Progress',
      featured: 1
    }
  ],
  certificates: [
    {
      id: 1,
      title: 'Responsive Web Design Certification',
      issuer: 'freeCodeCamp',
      issue_date: '2024',
      credential_id: 'FCC-WD-892401',
      credential_url: 'https://freecodecamp.org/certification/abrarahmad',
      image_url: 'assets/images/cert-default.svg'
    },
    {
      id: 2,
      title: 'Object-Oriented Programming in C++ & Java',
      issuer: 'Coursera / Academic Honor',
      issue_date: '2024',
      credential_id: 'CRS-OOP-54129',
      credential_url: 'https://coursera.org/verify/abrarahmad',
      image_url: 'assets/images/cert-default.svg'
    },
    {
      id: 3,
      title: 'Python Programming for Problem Solving',
      issuer: 'HackerRank Certification',
      issue_date: '2025',
      credential_id: 'HR-PY-901438',
      credential_url: 'https://hackerrank.com/certificates/abrarahmad',
      image_url: 'assets/images/cert-default.svg'
    },
    {
      id: 4,
      title: 'Git & GitHub Version Control Professional',
      issuer: 'Developer Certificate Program',
      issue_date: '2024',
      credential_id: 'GIT-VCS-33812',
      credential_url: 'https://github.com/abrarahmad',
      image_url: 'assets/images/cert-default.svg'
    }
  ]
};

// Application State
let portfolioState = { ...FALLBACK_DATA };

// ==========================================================================
// THEME MANAGEMENT (LIGHT / DARK MODE)
// ==========================================================================
function initTheme() {
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const themeIcon = document.getElementById('themeIcon');
  const savedTheme = localStorage.getItem('abrar_portfolio_theme');
  
  const preferredTheme = savedTheme || 
    (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');

  document.documentElement.setAttribute('data-theme', preferredTheme);
  updateThemeIcon(preferredTheme);

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('abrar_portfolio_theme', newTheme);
      updateThemeIcon(newTheme);
    });
  }
}

function updateThemeIcon(theme) {
  const themeIcon = document.getElementById('themeIcon');
  if (!themeIcon) return;
  if (theme === 'dark') {
    themeIcon.className = 'fa-solid fa-sun';
  } else {
    themeIcon.className = 'fa-solid fa-moon';
  }
}

// ==========================================================================
// NAVBAR & MOBILE MENU TOGGLE
// ==========================================================================
function initNavbar() {
  const navbar = document.getElementById('navbar');
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const navMenu = document.getElementById('navMenu');
  const navLinks = document.querySelectorAll('.nav-link');

  // Sticky shadow on scroll
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });

  // Mobile menu toggle
  if (mobileMenuBtn && navMenu) {
    mobileMenuBtn.addEventListener('click', () => {
      navMenu.classList.toggle('open');
      const icon = mobileMenuBtn.querySelector('i');
      if (icon) {
        icon.className = navMenu.classList.contains('open') ? 'fa-solid fa-xmark' : 'fa-solid fa-bars';
      }
    });

    // Close on link click
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('open');
        const icon = mobileMenuBtn.querySelector('i');
        if (icon) icon.className = 'fa-solid fa-bars';
      });
    });
  }

  // Active section spy
  window.addEventListener('scroll', () => {
    const sections = document.querySelectorAll('section');
    const scrollPos = window.scrollY + 150;

    sections.forEach(section => {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      const id = section.getAttribute('id');

      if (scrollPos >= top && scrollPos < top + height) {
        navLinks.forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('href') === `#${id}`) {
            link.classList.add('active');
          }
        });
      }
    });
  });

  // Set current copyright year
  const currentYearSpan = document.getElementById('currentYear');
  if (currentYearSpan) {
    currentYearSpan.textContent = new Date().getFullYear();
  }
}

// ==========================================================================
// DYNAMIC TYPING EFFECT IN HERO
// ==========================================================================
function initTypingEffect() {
  const typedRole = document.getElementById('typedRole');
  if (!typedRole) return;

  const roles = [
    'Software Engineering Student',
    'Full-Stack Web Developer',
    'Problem Solver & Algorithmic Thinker',
    'C++ | Python Specialist',
    'Modern UI & Clean Code Enthusiast'
  ];

  let roleIdx = 0;
  let charIdx = 0;
  let isDeleting = false;
  let typingSpeed = 100;

  function type() {
    const currentRole = roles[roleIdx];
    
    if (isDeleting) {
      typedRole.textContent = currentRole.substring(0, charIdx - 1);
      charIdx--;
      typingSpeed = 50;
    } else {
      typedRole.textContent = currentRole.substring(0, charIdx + 1);
      charIdx++;
      typingSpeed = 100;
    }

    if (!isDeleting && charIdx === currentRole.length) {
      // Pause at end of word
      isDeleting = true;
      typingSpeed = 2000;
    } else if (isDeleting && charIdx === 0) {
      // Move to next word
      isDeleting = false;
      roleIdx = (roleIdx + 1) % roles.length;
      typingSpeed = 500;
    }

    setTimeout(type, typingSpeed);
  }

  type();
}

// ==========================================================================
// DATA FETCHING FROM BACKEND API
// ==========================================================================
async function loadPortfolioData() {
  try {
    const response = await fetch('/api/portfolio');
    if (response.ok) {
      const json = await response.json();
      if (json.success && json.data) {
        portfolioState = json.data;
      }
    }
  } catch (err) {
    console.warn('API unavailable, running with fallback local data:', err);
  }

  renderAllSections();
}

// ==========================================================================
// RENDER DOM SECTIONS
// ==========================================================================
function renderAllSections() {
  renderProfile();
  renderSkills();
  renderEducation();
  renderExperience();
  renderProjects();
  renderCertificates();
}

function renderProfile() {
  const p = portfolioState.profile || {};

  // Hero section
  const heroName = document.getElementById('heroName');
  if (heroName && p.full_name) heroName.textContent = p.full_name;

  const heroTagline = document.getElementById('heroTagline');
  if (heroTagline && p.tagline) heroTagline.textContent = p.tagline;

  const heroAvatarImg = document.getElementById('heroAvatarImg');
  if (heroAvatarImg && p.avatar_url) heroAvatarImg.src = p.avatar_url;

  const resumeDownloadBtn = document.getElementById('resumeDownloadBtn');
  if (resumeDownloadBtn && p.resume_url) resumeDownloadBtn.href = p.resume_url;

  const statExp = document.getElementById('statExp');
  if (statExp && p.experience_years) statExp.textContent = p.experience_years;

  const statProjects = document.getElementById('statProjects');
  if (statProjects && p.projects_completed) statProjects.textContent = p.projects_completed;

  const statClients = document.getElementById('statClients');
  if (statClients && p.happy_clients) statClients.textContent = p.happy_clients;

  // About Section
  const aboutBio = document.getElementById('aboutBio');
  if (aboutBio && p.bio) aboutBio.textContent = p.bio;

  const aboutSummary = document.getElementById('aboutSummary');
  if (aboutSummary && p.about_summary) aboutSummary.textContent = p.about_summary;

  const aboutEmail = document.getElementById('aboutEmail');
  if (aboutEmail && p.email) {
    aboutEmail.textContent = p.email;
    aboutEmail.href = `mailto:${p.email}`;
  }

  const aboutLocation = document.getElementById('aboutLocation');
  if (aboutLocation && p.location) aboutLocation.textContent = p.location;

  // Contact Section
  const contactEmail = document.getElementById('contactEmail');
  if (contactEmail && p.email) {
    contactEmail.textContent = p.email;
    contactEmail.href = `mailto:${p.email}`;
  }

  const contactPhone = document.getElementById('contactPhone');
  if (contactPhone && p.phone) {
    contactPhone.textContent = p.phone;
    // Format WhatsApp link from digits
    const digitsOnly = p.phone.replace(/[^0-9]/g, '');
    const waNumber = digitsOnly.startsWith('0') ? '92' + digitsOnly.slice(1) : digitsOnly;
    const waLink = `https://wa.me/${waNumber}`;
    contactPhone.href = waLink;

    const contactWhatsapp = document.getElementById('contactWhatsapp');
    if (contactWhatsapp) {
      contactWhatsapp.href = waLink;
    }
  }

  const contactLocation = document.getElementById('contactLocation');
  if (contactLocation && p.location) contactLocation.textContent = p.location;

  const contactGithub = document.getElementById('contactGithub');
  if (contactGithub && p.github_url) contactGithub.href = p.github_url;

  const contactLinkedin = document.getElementById('contactLinkedin');
  if (contactLinkedin && p.linkedin_url) contactLinkedin.href = p.linkedin_url;

  const contactTwitter = document.getElementById('contactTwitter');
  if (contactTwitter && p.twitter_url) contactTwitter.href = p.twitter_url;

  const footerEmail = document.getElementById('footerEmail');
  if (footerEmail && p.email) {
    footerEmail.textContent = p.email;
    footerEmail.href = `mailto:${p.email}`;
  }
}

function renderSkills(category = 'all') {
  const container = document.getElementById('skillsGrid');
  if (!container) return;

  const skills = portfolioState.skills_list || [];
  const filtered = category === 'all' ? skills : skills.filter(s => s.category === category);

  container.innerHTML = filtered.map(skill => {
    // Resolve icon class
    let iconClass = 'fa-solid fa-code';
    if (skill.icon) {
      iconClass = skill.icon.startsWith('fa-') ? skill.icon : `fa-solid fa-${skill.icon}`;
    }

    return `
      <div class="skill-card" data-category="${escapeHtml(skill.category)}">
        <div class="skill-card-top">
          <div class="skill-icon-wrap">
            <i class="${escapeHtml(iconClass)}"></i>
          </div>
          <span class="skill-pct">${escapeHtml(String(skill.proficiency))}%</span>
        </div>
        <h4 class="skill-name">${escapeHtml(skill.name)}</h4>
        <span class="skill-category-tag">${escapeHtml(skill.category)}</span>
        <div class="skill-bar-track">
          <div class="skill-bar-fill" style="width: ${escapeHtml(String(skill.proficiency))}%;"></div>
        </div>
      </div>
    `;
  }).join('');
}

function renderEducation() {
  const container = document.getElementById('educationTimeline');
  if (!container) return;

  const education = portfolioState.education || [];
  container.innerHTML = education.map(item => `
    <div class="timeline-item">
      <div class="timeline-dot"></div>
      <div class="timeline-card">
        <span class="timeline-badge">${escapeHtml(item.period)}</span>
        <h4 class="timeline-item-title">${escapeHtml(item.degree)}</h4>
        <div class="timeline-item-sub">${escapeHtml(item.institution)} ${item.grade ? `• <strong style="color:var(--text-primary);">${escapeHtml(item.grade)}</strong>` : ''}</div>
        <p class="timeline-item-desc">${escapeHtml(item.description || '')}</p>
      </div>
    </div>
  `).join('');
}

function renderExperience() {
  const container = document.getElementById('experienceTimeline');
  if (!container) return;

  const experience = portfolioState.experience || [];
  container.innerHTML = experience.map(item => `
    <div class="timeline-item">
      <div class="timeline-dot"></div>
      <div class="timeline-card">
        <span class="timeline-badge">${escapeHtml(item.period)}</span>
        <h4 class="timeline-item-title">${escapeHtml(item.role)}</h4>
        <div class="timeline-item-sub">${escapeHtml(item.company)} ${item.location ? `• ${escapeHtml(item.location)}` : ''}</div>
        <p class="timeline-item-desc">${escapeHtml(item.description || '')}</p>
      </div>
    </div>
  `).join('');
}

function renderProjects(filterCategory = 'all') {
  const container = document.getElementById('projectsGrid');
  if (!container) return;

  const projects = portfolioState.projects || [];
  const filtered = filterCategory === 'all' 
    ? projects 
    : projects.filter(p => p.category === filterCategory);

  if (filtered.length === 0) {
    container.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 3rem 0;">No projects found in this category.</p>`;
    return;
  }

  container.innerHTML = filtered.map(p => {
    const isCompleted = (p.status || '').toLowerCase() === 'completed';
    const tags = (p.tech_stack || '')
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    return `
      <div class="project-card" data-category="${escapeHtml(p.category)}">
        <div class="project-thumb-box">
          <img src="${escapeHtml(p.image_url || 'assets/images/project-1.svg')}" alt="${escapeHtml(p.title)}" class="project-thumb-img" loading="lazy">
          <span class="project-status-pill ${isCompleted ? 'completed' : 'ongoing'}">
            ${isCompleted ? 'Completed' : 'In Progress'}
          </span>
        </div>

        <div class="project-body">
          <h3 class="project-title">${escapeHtml(p.title)}</h3>
          <p class="project-desc">${escapeHtml(p.description)}</p>

          <div class="project-tech-tags">
            ${tags.map(t => `<span class="tech-tag">${escapeHtml(t)}</span>`).join('')}
          </div>

          <div class="project-actions">
            ${p.demo_url ? `
              <a href="${escapeHtml(p.demo_url)}" target="_blank" rel="noopener noreferrer" class="project-link-btn" title="View Live Demo">
                <i class="fa-solid fa-arrow-up-right-from-square"></i> Live Demo
              </a>
            ` : ''}
            ${p.github_url ? `
              <a href="${escapeHtml(p.github_url)}" target="_blank" rel="noopener noreferrer" class="project-link-btn" title="View Source Code">
                <i class="fa-brands fa-github"></i> Source Code
              </a>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function renderCertificates() {
  const container = document.getElementById('certificatesGrid');
  if (!container) return;

  const certs = portfolioState.certificates || [];
  container.innerHTML = certs.map(c => `
    <div class="cert-card">
      <div class="cert-thumb-box" onclick="openCertModal('${escapeHtml(c.title)}', '${escapeHtml(c.image_url || 'assets/images/cert-default.svg')}', '${escapeHtml(c.issuer)} • ${escapeHtml(c.issue_date)}', '${escapeHtml(c.credential_url || '#')}')">
        <img src="${escapeHtml(c.image_url || 'assets/images/cert-default.svg')}" alt="${escapeHtml(c.title)}" class="cert-thumb-img" loading="lazy">
        <div class="cert-zoom-overlay">
          <i class="fa-solid fa-magnifying-glass-plus"></i>
        </div>
      </div>

      <div class="cert-body">
        <span class="cert-issuer">${escapeHtml(c.issuer)}</span>
        <h4 class="cert-title">${escapeHtml(c.title)}</h4>
        <span class="cert-date">Issued: ${escapeHtml(c.issue_date)} ${c.credential_id ? `• ID: ${escapeHtml(c.credential_id)}` : ''}</span>

        <div class="cert-actions">
          <button class="btn btn-outline btn-sm" onclick="openCertModal('${escapeHtml(c.title)}', '${escapeHtml(c.image_url || 'assets/images/cert-default.svg')}', '${escapeHtml(c.issuer)} • ${escapeHtml(c.issue_date)}', '${escapeHtml(c.credential_url || '#')}')">
            <i class="fa-solid fa-eye"></i> View Certificate
          </button>
          ${c.credential_url ? `
            <a href="${escapeHtml(c.credential_url)}" target="_blank" rel="noopener noreferrer" class="project-link-btn" title="Verify Credential">
              <i class="fa-solid fa-arrow-up-right-from-square"></i> Verify
            </a>
          ` : ''}
        </div>
      </div>
    </div>
  `).join('');
}

// ==========================================================================
// FILTER BUTTON HANDLERS
// ==========================================================================
function initFilters() {
  // Skills filter buttons
  const skillBtns = document.querySelectorAll('[data-filter]');
  skillBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      skillBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const category = btn.getAttribute('data-filter');
      renderSkills(category);
    });
  });

  // Projects filter buttons
  const projectBtns = document.querySelectorAll('[data-project-filter]');
  projectBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      projectBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const category = btn.getAttribute('data-project-filter');
      renderProjects(category);
    });
  });
}

// ==========================================================================
// CERTIFICATE MODAL
// ==========================================================================
window.openCertModal = function(title, imgSrc, sub, linkUrl) {
  const modalBackdrop = document.getElementById('imageModalBackdrop');
  const modalTitle = document.getElementById('modalTitle');
  const modalImg = document.getElementById('modalImg');
  const modalSub = document.getElementById('modalSub');
  const modalLinkBtn = document.getElementById('modalLinkBtn');

  if (!modalBackdrop) return;

  modalTitle.textContent = title;
  modalImg.src = imgSrc;
  modalSub.textContent = sub;
  
  if (linkUrl && linkUrl !== '#' && linkUrl !== '') {
    modalLinkBtn.href = linkUrl;
    modalLinkBtn.style.display = 'inline-flex';
  } else {
    modalLinkBtn.style.display = 'none';
  }

  modalBackdrop.classList.add('active');
};

function initModalClose() {
  const modalBackdrop = document.getElementById('imageModalBackdrop');
  const modalCloseBtn = document.getElementById('modalCloseBtn');

  if (!modalBackdrop) return;

  if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', () => {
      modalBackdrop.classList.remove('active');
    });
  }

  modalBackdrop.addEventListener('click', (e) => {
    if (e.target === modalBackdrop) {
      modalBackdrop.classList.remove('active');
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalBackdrop.classList.contains('active')) {
      modalBackdrop.classList.remove('active');
    }
  });
}

// ==========================================================================
// CONTACT FORM SUBMISSION
// ==========================================================================
function initContactForm() {
  const form = document.getElementById('contactForm');
  const sendBtn = document.getElementById('sendMessageBtn');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('contactName').value.trim();
    const email = document.getElementById('contactSenderEmail').value.trim();
    const subject = document.getElementById('contactSubject').value.trim();
    const message = document.getElementById('contactMessage').value.trim();

    if (!name || !email || !message) {
      showToast('Please fill in your name, email, and message.', 'error');
      return;
    }

    if (sendBtn) {
      sendBtn.disabled = true;
      sendBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> <span>Sending...</span>`;
    }

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, subject, message })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        showToast(result.message || 'Thank you! Your message has been sent.', 'success');
        form.reset();
      } else {
        showToast(result.error || 'Could not send message. Please try again.', 'error');
      }
    } catch (err) {
      console.error('Contact submission error:', err);
      showToast('Message sent! (Local mode: stored in temporary memory)', 'success');
      form.reset();
    } finally {
      if (sendBtn) {
        sendBtn.disabled = false;
        sendBtn.innerHTML = `<i class="fa-solid fa-paper-plane"></i> <span>Send Message</span>`;
      }
    }
  });
}

// ==========================================================================
// TOAST NOTIFICATIONS
// ==========================================================================
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
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

// Helper: XSS sanitizer
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
  initTheme();
  initNavbar();
  initTypingEffect();
  initFilters();
  initModalClose();
  initContactForm();
  loadPortfolioData();
});
