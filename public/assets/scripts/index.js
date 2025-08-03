tailwind.config = {
  theme: {
    extend: {
      colors: {
        primary: "#6366f1",
        secondary: "#8b5cf6",
        accent: "#06b6d4",
        dark: "#0f172a",
        darker: "#020617",
        darkest: "#030712",
        light: "#f8fafc",
        gray: "#64748b",
        "card-bg": "rgba(255, 255, 255, 0.05)",
        glass: "rgba(255, 255, 255, 0.08)",
        success: "#10b981",
        warning: "#f59e0b",
        danger: "#ef4444",
      },
      fontFamily: {
        inter: ["Inter", "sans-serif"],
        space: ["Space Grotesk", "sans-serif"],
      },
      backgroundImage: {
        "gradient-main":
          "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)",
        "gradient-card":
          "linear-gradient(145deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)",
        "gradient-hero":
          "radial-gradient(circle at 30% 40%, rgba(99, 102, 241, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 60%, rgba(139, 92, 246, 0.15) 0%, transparent 50%)",
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        "pulse-slow": "pulse 3s ease-in-out infinite",
        "fade-in": "fadeIn 0.8s ease-in forwards",
        "slide-up": "slideUp 0.6s ease-out forwards",
        glow: "glow 2s ease-in-out infinite alternate",
        "bounce-slow": "bounce 2s infinite",
        shimmer: "shimmer 2s linear infinite",
      },
      keyframes: {
        float: {
          "0%, 100": { transform: "translateY(0px)" },
          "50": { transform: "translateY(-20px)" },
        },
        fadeIn: {
          "0": { opacity: "0", transform: "translateY(30px)" },
          "100": { opacity: "1", transform: "translateY(0)" },
        },
        slideUp: {
          "0": { transform: "translateY(50px)", opacity: "0" },
          "100": { transform: "translateY(0)", opacity: "1" },
        },
        glow: {
          "0": { boxShadow: "0 0 20px rgba(99, 102, 241, 0.5)" },
          "100": { boxShadow: "0 0 30px rgba(139, 92, 246, 0.8)" },
        },
        shimmer: {
          "0": { backgroundPosition: "-1000px 0" },
          "100": { backgroundPosition: "1000px 0" },
        },
      },
    },
  },
};

// Initialize AOS
AOS.init({
  duration: 800,
  once: true,
  offset: 100,
});

// API Helper Functions
const API = {
  async checkHealth() {
    try {
      const response = await fetch("/api/health", {
        method: "GET",
        headers: { "Cache-Control": "no-cache" },
      });
      return response.ok;
    } catch (error) {
      console.warn("Health check failed:", error);
      return false;
    }
  },

  async request(endpoint, options = {}) {
    try {
      const response = await fetch(`/api${endpoint}`, {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error ||
            `HTTP ${response.status}: ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error("API Request failed:", error);
      throw error;
    }
  },

  async getGallery() {
    return this.request("/gallery");
  },

  async getStructure() {
    return this.request("/structure");
  },

  async getConfessions() {
    return this.request("/confessions");
  },

  async postConfession(message) {
    return this.request("/confessions", {
      method: "POST",
      body: JSON.stringify({ message }),
    });
  },

  async getStats() {
    return this.request("/stats");
  },
};

// Notification System
function showNotification(message, type = "info", duration = 5000) {
  const container = document.getElementById("notification-container");
  const notification = document.createElement("div");

  const colors = {
    success: "bg-green-500 border-green-400",
    error: "bg-red-500 border-red-400",
    warning: "bg-yellow-500 border-yellow-400",
    info: "bg-blue-500 border-blue-400",
  };

  const icons = {
    success: "✅",
    error: "❌",
    warning: "⚠️",
    info: "ℹ️",
  };

  notification.className = `notification px-6 py-4 rounded-xl text-white font-medium shadow-2xl max-w-sm border-l-4 ${colors[type]} transform transition-all duration-300 translate-x-full`;

  notification.innerHTML = `
    <div class="flex items-start space-x-3">
      <div class="flex-shrink-0 text-lg">
        ${icons[type]}
      </div>
      <div class="flex-1">
        <p class="text-sm leading-relaxed">${message}</p>
      </div>
      <button class="ml-2 text-white/80 hover:text-white transition-colors" onclick="this.closest('.notification').remove()">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>
    </div>
  `;

  container.appendChild(notification);

  setTimeout(() => {
    notification.classList.remove("translate-x-full");
  }, 100);

  setTimeout(() => {
    if (notification.parentNode) {
      notification.classList.add("translate-x-full");
      setTimeout(() => {
        if (notification.parentNode) {
          notification.remove();
        }
      }, 300);
    }
  }, duration);
}

// Loading Modal
function showLoading() {
  document.getElementById("loading-modal").classList.remove("hidden");
}

function hideLoading() {
  document.getElementById("loading-modal").classList.add("hidden");
}

// Character counter
const confessMessage = document.getElementById("confess-message");
const charCount = document.getElementById("char-count");

if (confessMessage && charCount) {
  confessMessage.addEventListener("input", function () {
    const count = this.value.length;
    charCount.textContent = `${count}/500`;
    charCount.className =
      count > 450 ? "text-xs text-red-400" : "text-xs text-slate-500";
  });
}

// Load Gallery with API and Initialize Swiper
async function loadGallery() {
  const galleryLoading = document.getElementById("gallery-loading");
  const galleryContent = document.getElementById("gallery-content");

  try {
    galleryLoading.style.display = "grid";
    galleryContent.style.display = "none";

    const gallery = await API.getGallery();

    galleryLoading.style.display = "none";
    galleryContent.style.display = "block";

    if (gallery.length === 0) {
      galleryContent.innerHTML = `
        <div class="text-center p-16">
          <div class="text-6xl mb-6">📸</div>
          <h3 class="text-2xl font-semibold text-slate-300 mb-4">No Photos Yet</h3>
          <p class="text-slate-400 mb-6">Kirim foto kelas Anda!</p>
          <div class="w-16 h-1 bg-gradient-to-r from-primary to-secondary mx-auto rounded-full"></div>
        </div>
      `;
      document.getElementById("stat-gallery").textContent = "0";
      return;
    }

    document.getElementById("stat-gallery").textContent = gallery.length;

    const sortedGallery = [...gallery].sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return new Date(b.uploadDate || 0) - new Date(a.uploadDate || 0);
    });

    const swiperSlidesHTML = sortedGallery
      .map(
        (photo) => `
      <div class="swiper-slide">
        <figure>
          <img src="/assets/images/gallery/${photo.filename}"
               alt="${photo.title || "Gallery Image"}"
               loading="lazy"
               onerror="this.onerror=null;this.src='https://placehold.co/600x800/ef4444/white?text=Error';">
        </figure>
      </div>
    `
      )
      .join("");

    galleryContent.innerHTML = `
      <div class="swiper gallery-swiper">
        <div class="swiper-wrapper">
          ${swiperSlidesHTML}
        </div>
        <div class="swiper-pagination"></div>
      </div>
    `;

    setTimeout(function () {
      if (document.querySelector(".gallery-swiper")) {
        const swiper = new Swiper(".gallery-swiper", {
          effect: "coverflow",
          grabCursor: true,
          centeredSlides: true,
          loop: true,
          slidesPerView: "auto",
          coverflowEffect: {
            rotate: 0,
            stretch: 0,
            depth: 100, // Ini memberikan efek kedalaman 3D
            modifier: 1,
            slideShadows: false, // Set ke true jika ingin bayangan
          },
          autoplay: {
            delay: 5000,
            disableOnInteraction: false,
          },
          pagination: {
            el: ".swiper-pagination",
            clickable: true,
          },
        });
      } else {
        console.error(
          "Swiper container .gallery-swiper not found after loading gallery data."
        );
      }
    }, 100);
  } catch (error) {
    console.error("Error loading gallery:", error);
    galleryLoading.style.display = "none";
    galleryContent.style.display = "block";
    galleryContent.innerHTML = `
      <div class="text-center p-16">
        <div class="text-6xl mb-6">❌</div>
        <h3 class="text-xl font-semibold text-red-400 mb-4">Failed to Load Gallery</h3>
        <p class="text-slate-400 mb-6">Please check your connection and try again</p>
        <button onclick="loadGallery()" class="px-6 py-3 bg-primary hover:bg-primary/80 rounded-lg font-medium transition-colors">
          Try Again
        </button>
      </div>
    `;
  }
}

// Load Structure with API
async function loadStructure() {
  const structureLoading = document.getElementById("structure-loading");
  const structureContent = document.getElementById("structure-content");

  try {
    structureLoading.style.display = "grid";
    structureContent.style.display = "none";

    const structure = await API.getStructure();

    structureLoading.style.display = "none";
    structureContent.style.display = "flex";
    structureContent.innerHTML = "";

    if (structure.length === 0) {
      structureContent.innerHTML = `
        <div class="w-full text-center py-16">
          <div class="text-6xl mb-6">👥</div>
          <h3 class="text-2xl font-semibold text-slate-300 mb-4">No Structure Data</h3>
          <p class="text-slate-400">Class structure will be loaded from admin dashboard</p>
        </div>
      `;
      return;
    }

    const levels = {
      leader: structure.filter(
        (m) => m.level === "leader" || m.position === "Wali Kelas"
      ),
      executive: structure.filter(
        (m) =>
          m.level === "executive" ||
          ["Ketua Kelas", "Wakil Ketua"].includes(m.position)
      ),
      staff: structure.filter(
        (m) =>
          m.level === "staff" ||
          m.position.includes("Sekretaris") ||
          m.position.includes("Bendahara")
      ),
      division: structure.filter(
        (m) =>
          m.level === "division" ||
          ["Keamanan", "Rohani", "Kebersihan"].some((d) =>
            m.position.includes(d)
          )
      ),
    };

    ["leader", "executive", "staff", "division"].forEach(
      (levelName, levelIndex) => {
        if (levels[levelName].length > 0) {
          const levelDiv = document.createElement("div");
          levelDiv.className = "org-level";

          levels[levelName].forEach((member, index) => {
            const card = document.createElement("div");
            card.className = `org-card ${levelName} animate-fade-in`;
            card.style.animationDelay = `${
              levelIndex * 0.2 + index * 0.1
            }s`;
            card.innerHTML = `
              <div class="text-4xl mb-4">${member.icon}</div>
              <h3 class="text-lg font-space font-bold ${getColorClass(
                levelName
              )} mb-2">${member.position}</h3>
              <p class="text-slate-300 font-medium mb-3">${member.name}</p>
              <div class="text-xs text-slate-400 ${getBgColorClass(
                levelName
              )} px-3 py-1 rounded-full">
                ${getLevelLabel(levelName)}
              </div>
            `;
            levelDiv.appendChild(card);
          });

          structureContent.appendChild(levelDiv);
        }
      }
    );
  } catch (error) {
    console.error("Error loading structure:", error);
    structureLoading.style.display = "none";
    structureContent.style.display = "flex";
    structureContent.innerHTML = `
      <div class="w-full text-center py-16">
        <div class="text-6xl mb-6">❌</div>
        <h3 class="text-xl font-semibold text-red-400 mb-4">Failed to Load Structure</h3>
        <p class="text-slate-400 mb-6">Please check your connection and try again</p>
        <button onclick="loadStructure()" class="px-6 py-3 bg-primary hover:bg-primary/80 rounded-lg font-medium transition-colors">
          Try Again
        </button>
      </div>
    `;
  }
}

function getColorClass(level) {
  const colors = {
    leader: "text-primary",
    executive: "text-secondary",
    staff: "text-accent",
    division: "text-primary",
  };
  return colors[level] || "text-primary";
}

function getBgColorClass(level) {
  const bgColors = {
    leader: "bg-primary/10",
    executive: "bg-secondary/10",
    staff: "bg-accent/10",
    division: "bg-primary/10",
  };
  return bgColors[level] || "bg-primary/10";
}

function getLevelLabel(level) {
  const labels = {
    leader: "Pembimbing",
    executive: "Leadership",
    staff: "Core Staff",
    division: "Division",
  };
  return labels[level] || "Staff";
}

// Load Confessions
async function loadConfessions(retryCount = 0) {
  const confessList = document.getElementById("confess-list");
  const maxRetries = 3;
  const retryDelay = 1000;

  try {
    if (retryCount === 0) {
      confessList.innerHTML =
        '<div id="confess-loading" class="text-center py-12"><div class="animate-spin w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full mx-auto mb-4"></div><p class="text-slate-400">Loading confessions...</p></div>';
    } else {
      confessList.innerHTML = `<div id="confess-loading" class="text-center py-12"><div class="animate-spin w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full mx-auto mb-4"></div><p class="text-slate-400">Retrying... (${retryCount}/${maxRetries})</p></div>`;
    }

    const confessions = await API.getConfessions();

    confessList.innerHTML = "";

    if (confessions.length === 0) {
      confessList.innerHTML = `
        <div class="text-center py-16">
          <div class="text-6xl mb-6">💭</div>
          <h3 class="text-xl font-semibold text-slate-300 mb-2">Belum Ada Pesan</h3>
          <p class="text-slate-400 mb-4">Jadilah yang pertama berbagi perasaan secara anonim!</p>
          <div class="w-16 h-1 bg-gradient-to-r from-primary to-secondary mx-auto rounded-full"></div>
        </div>
      `;
      return;
    }

    const confessionsHTML = confessions
      .slice()
      .reverse()
      .map(
        (confess, index) => `
      <div class="glass-effect rounded-xl p-6 border-l-4 border-primary animate-fade-in hover-glow transition-all duration-300"
           style="animation-delay: ${index * 0.1}s">
        <div class="flex items-start space-x-4">
          <div class="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-r from-primary/30 to-secondary/30 flex items-center justify-center">
            <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
            </svg>
          </div>
          <div class="flex-1">
            <p class="text-slate-200 leading-relaxed mb-3">"${confess.message
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;")}"</p>
            <div class="flex items-center justify-between">
              <span class="text-slate-500 text-xs">Anonymous</span>
              <span class="text-slate-500 text-xs">${formatDate(
                confess.timestamp
              )}</span>
            </div>
          </div>
        </div>
      </div>
    `
      )
      .join("");

    confessList.innerHTML = confessionsHTML;
    console.log("✅ Confessions loaded successfully");
  } catch (error) {
    console.error("Error loading confessions:", error);
    if (retryCount < maxRetries) {
      console.log(
        `🔄 Retrying confession load (${retryCount + 1}/${maxRetries})...`
      );
      setTimeout(() => {
        loadConfessions(retryCount + 1);
      }, retryDelay * (retryCount + 1));
      return;
    }

    confessList.innerHTML = `
      <div class="text-center py-16 glass-effect rounded-xl border border-red-500/20">
        <div class="text-6xl mb-6">⚠️</div>
        <h3 class="text-xl font-semibold text-red-400 mb-2">Gagal Memuat Confessions</h3>
        <p class="text-slate-400 mb-6">Pastikan server backend berjalan dengan baik</p>
        <button onclick="loadConfessions()" class="px-6 py-2 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 hover:bg-red-500/30 transition-colors duration-300">
          Coba Lagi
        </button>
      </div>
    `;
  }
}

// Update Stats
async function updateStats() {
  try {
    const stats = await API.getStats();
    document.getElementById("stat-gallery").textContent =
      stats.gallery || 0;
  } catch (error) {
    console.error("Error loading stats:", error);
  }
}

// Confession Form Handler
const confessForm = document.getElementById("confess-form");
const confessMessageInput = document.getElementById("confess-message");
const submitButton = confessForm?.querySelector('button[type="submit"]');
const submitText = document.getElementById("submit-text");
const refreshButton = document.getElementById("refresh-confessions");

if (confessForm) {
  confessForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    const message = confessMessageInput.value.trim();

    if (message === "") {
      showNotification("Pesan tidak boleh kosong!", "error");
      return;
    }

    if (message.length > 500) {
      showNotification(
        "Pesan terlalu panjang! Maksimal 500 karakter.",
        "error"
      );
      return;
    }

    const originalText = submitText.innerHTML;
    submitText.innerHTML = "Mengirim...";
    submitButton.disabled = true;
    submitButton.classList.add("opacity-50");

    try {
      await API.postConfession(message);

      confessMessageInput.value = "";
      charCount.textContent = "0/500";
      loadConfessions();
      showNotification("Pesan berhasil dikirim! 🎉", "success");
    } catch (error) {
      console.error("Error:", error);
      showNotification(
        error.message || "Terjadi kesalahan saat mengirim pesan",
        "error"
      );
    } finally {
      submitText.innerHTML = originalText;
      submitButton.disabled = false;
      submitButton.classList.remove("opacity-50");
    }
  });
}

if (refreshButton) {
  refreshButton.addEventListener("click", loadConfessions);
}

function formatDate(timestamp) {
  if (!timestamp) return "Just now";
  try {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
    return date.toLocaleDateString();
  } catch (error) {
    return "Just now";
  }
}

const mobileMenuButton = document.getElementById("mobile-menu-button");
const mobileMenu = document.getElementById("mobile-menu");

if (mobileMenuButton && mobileMenu) {
  mobileMenuButton.addEventListener("click", () => {
    mobileMenu.classList.toggle("hidden");
  });

  document.addEventListener("click", (e) => {
    if (
      !mobileMenuButton.contains(e.target) &&
      !mobileMenu.contains(e.target)
    ) {
      mobileMenu.classList.add("hidden");
    }
  });

  document.querySelectorAll("#mobile-menu a").forEach((link) => {
    link.addEventListener("click", () => {
      mobileMenu.classList.add("hidden");
    });
  });
}

document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute("href"));
    if (target) {
      const offsetTop = target.offsetTop - 80;
      window.scrollTo({
        top: offsetTop,
        behavior: "smooth",
      });
    }
  });
});

function updateActiveNavigation() {
  let current = "";
  const sections = document.querySelectorAll("section[id]");

  sections.forEach((section) => {
    const sectionTop = section.offsetTop - 100;
    if (pageYOffset >= sectionTop) {
      current = section.getAttribute("id");
    }
  });

  document.querySelectorAll(".nav-link").forEach((link) => {
    link.classList.remove("text-primary");
    if (link.getAttribute("href") === `#${current}`) {
      link.classList.add("text-primary");
    }
  });
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

const debouncedScrollHandler = debounce(() => {
  updateActiveNavigation();

  const navbar = document.querySelector("header");
  if (window.scrollY > 50) {
    navbar.classList.add("backdrop-blur-xl");
    navbar.style.background = "rgba(15, 23, 42, 0.95)";
  } else {
    navbar.classList.remove("backdrop-blur-xl");
    navbar.style.background = "rgba(15, 23, 42, 0.9)";
  }
}, 10);

window.addEventListener("scroll", debouncedScrollHandler);

const observeElements = document.querySelectorAll(
  ".animate-fade-in, .animate-slide-up"
);

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = "1";
        entry.target.style.transform = "translateY(0)";
        observer.unobserve(entry.target);
      }
    });
  },
  {
    threshold: 0.1,
    rootMargin: "50px",
  }
);

observeElements.forEach((el) => {
  el.style.opacity = "0";
  el.style.transform = "translateY(30px)";
  el.style.transition = "all 0.8s ease-out";
  observer.observe(el);
});

document.addEventListener("keydown", function (e) {
  if (e.altKey && e.key === "a") {
    e.preventDefault();
    window.open("/admin", "_blank");
  }
  if (e.key === "Escape") {
    document.querySelectorAll(".notification").forEach((n) => n.remove());
  }
  if (e.key === "Enter" && e.ctrlKey) {
    if (e.target.id === "confess-message") {
      e.preventDefault();
      confessForm.dispatchEvent(new Event("submit"));
    }
  }
});

document.addEventListener("contextmenu", function (e) {
  if (e.ctrlKey && e.shiftKey) {
    e.preventDefault();
    const adminPrompt = prompt("Enter admin access code:");
    if (adminPrompt === "pplgtwo2025") {
      window.open("/admin", "_blank");
      showNotification("Admin dashboard opened!", "success");
    }
  }
});

let autoRefreshInterval;
let consecutiveErrors = 0;
const maxConsecutiveErrors = 3;

function startAutoRefresh() {
  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval);
  }

  autoRefreshInterval = setInterval(async () => {
    if (!document.hidden) {
      try {
        const healthCheck = await API.checkHealth();
        if (healthCheck) {
          await loadConfessions();
          consecutiveErrors = 0;
        } else {
          throw new Error("Server health check failed");
        }
      } catch (error) {
        consecutiveErrors++;
        console.warn(
          `Auto-refresh failed (${consecutiveErrors}/${maxConsecutiveErrors}):`,
          error
        );

        if (consecutiveErrors >= maxConsecutiveErrors) {
          console.warn(
            "Too many consecutive errors, stopping auto-refresh"
          );
          stopAutoRefresh();
          showNotification(
            "Auto-refresh stopped due to connection issues. Click refresh to try again.",
            "warning",
            8000
          );
        }
      }
    }
  }, 30000);
}

function stopAutoRefresh() {
  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval);
    autoRefreshInterval = null;
  }
  consecutiveErrors = 0;
}

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    stopAutoRefresh();
  } else {
    startAutoRefresh();
    loadConfessions();
  }
});

async function loadSettings() {
  try {
    const response = await fetch("/api/settings");
    if (response.ok) {
      const settings = await response.json();

      if (settings.siteName) {
        document.getElementById("site-brand").textContent =
          settings.siteName;
        document.getElementById("site-title").textContent =
          settings.siteName;
        document.getElementById("footer-brand").textContent =
          settings.siteName;
      }

      if (settings.siteDescription) {
        document.getElementById("site-description").innerHTML =
          settings.siteDescription;
      }

      if (settings.welcomeText) {
        document.getElementById("welcome-text").textContent =
          settings.welcomeText;
      }

      if (settings.siteTitle) {
        document.title = settings.siteTitle;
      }
    }
  } catch (error) {
    console.warn("Failed to load settings:", error);
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  console.log("🚀 Initializing PPLGTWO Website...");

  document.body.style.opacity = "0";
  document.body.style.transition = "opacity 0.5s ease-in-out";

  try {
    showLoading();

    const serverHealthy = await API.checkHealth();
    if (!serverHealthy) {
      console.warn(
        "Server health check failed, continuing with degraded functionality"
      );
    }

    const results = await Promise.allSettled([
      loadSettings(),
      loadGallery(),
      loadStructure(),
      updateStats(),
    ]);

    const failures = results.filter(
      (result) => result.status === "rejected"
    );
    if (failures.length > 0) {
      console.warn("Some sections failed to load:", failures);
      showNotification(
        `${failures.length} section(s) failed to load`,
        "warning"
      );
    }

    setTimeout(() => {
      loadConfessions();
    }, 100);

    hideLoading();

    setTimeout(() => {
      document.body.style.opacity = "1";
    }, 100);

    if (!document.hidden) {
      startAutoRefresh();
    }

    console.log("✅ Website initialized successfully");
  } catch (error) {
    console.error("❌ Error initializing website:", error);
    hideLoading();

    showNotification(
      "Failed to connect to server. Please check if the backend is running.",
      "error",
      10000
    );

    setTimeout(() => {
      loadConfessions();
    }, 2000);

    setTimeout(() => {
      document.body.style.opacity = "1";
    }, 100);
  }
});

window.addEventListener("beforeunload", () => {
  stopAutoRefresh();
});

window.addEventListener("error", (event) => {
  console.error("Global error:", event.error);
  showNotification("An unexpected error occurred", "error");
});

window.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled promise rejection:", event.reason);
  showNotification("A network error occurred", "error");
  event.preventDefault();
});

console.log(`
  ╔══════════════════════════════════════╗
  ║              PPLGTWO                 ║
  ║        Website Kelas v2.0            ║
  ║                                      ║
  ║  🎨 Dynamic Gallery Loading         ║
  ║  👥 Real-time Structure Updates     ║
  ║  💭 Live Anonymous Confessions       ║
  ║  📊 Auto-updating Statistics         ║
  ║  🔄 Robust Error Handling            ║
  ║  ⚡ Performance Optimized            ║
  ║                                      ║
  ║  Made with ❤️ by PPLGTWO Class      ║
  ║  Happy exploring! 🚀                ║
  ╚══════════════════════════════════════╝
`);

if (
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
) {
  window.PPLGTWO_DEBUG = {
    loadGallery,
    loadStructure,
    loadConfessions,
    loadSettings,
    updateStats,
    showNotification,
    API,
    startAutoRefresh,
    stopAutoRefresh,
  };
  console.log(
    "🔧 Debug mode enabled. Access PPLGTWO_DEBUG object for utilities."
  );
}

window.addEventListener("load", () => {
  if (window.performance && window.performance.timing) {
    const loadTime =
      window.performance.timing.loadEventEnd -
      window.performance.timing.navigationStart;
    console.log(`⏱️ Page load time: ${loadTime}ms`);
  }
});

function checkFeatureSupport() {
  const features = {
    fetch: typeof fetch !== "undefined",
    intersectionObserver: "IntersectionObserver" in window,
    customScrollbar: CSS.supports("backdrop-filter", "blur(10px)"),
    gridLayout: CSS.supports("display", "grid"),
  };

  console.log("🔍 Feature support:", features);

  if (!features.fetch) {
    console.warn(
      "⚠️ Fetch API not supported. Some features may not work."
    );
  }

  if (!features.intersectionObserver) {
    console.warn(
      "⚠️ IntersectionObserver not supported. Animations may be limited."
    );
  }

  return features;
}

checkFeatureSupport();

if ("serviceWorker" in navigator) {
  console.log("💡 This website could be enhanced with PWA features!");
}