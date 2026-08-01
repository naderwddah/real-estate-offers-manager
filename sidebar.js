// ============================================================
// SIDEBAR BUILDER - واجهة مظلمة مع دعم API
// ============================================================

(function () {
  "use strict";

  const menuItems = [
    { id: "dashboard", title: "لوحة التحكم", icon: "fa-gauge-high", link: "dashboard.html" },
    { id: "offers", title: "العروض", icon: "fa-file-signature", link: "offers.html" },
    { id: "requests", title: "الطلبات", icon: "fa-clipboard-list", link: "requests.html" },
    { id: "alerts", title: "التنبيهات والتذكيرات", icon: "fa-bell", link: "alerts.html" },
    { id: "settings", title: "الإعدادات", icon: "fa-gear", link: "settings.html" }
  ];

  function isAuthenticated() {
    return !!localStorage.getItem('masar_token');
  }

  async function verifyAuth() {
    const token = localStorage.getItem('masar_token');
    if (!token) return false;
    try {
      const res = await fetch('http://localhost:8000/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      return data.status === 'success';
    } catch (err) {
      return false;
    }
  }

  function renderSidebar() {
    let container = document.getElementById("sidebar-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "sidebar-container";
      document.body.prepend(container);
    }

    const currentPage = window.location.pathname.split("/").pop() || "dashboard.html";
    const isAuth = isAuthenticated();

    let menuHTML = `
      <div class="sidebar-brand">
        <i class="fas fa-compass"></i>
        <span>مسار</span>
      </div>
      <ul class="sidebar-menu">
    `;

    menuItems.forEach((item) => {
      const isActive = item.link === currentPage ? "active" : "";
      menuHTML += `
        <li>
          <a href="${item.link}" class="${isActive}" data-page="${item.id}">
            <i class="fas ${item.icon}"></i>
            <span>${item.title}</span>
          </a>
        </li>
      `;
    });

    if (isAuth) {
      menuHTML += `
        <li style="margin-top:20px;border-top:1px solid rgba(237,234,226,0.08);padding-top:12px;">
          <a href="#" onclick="handleLogout(event)" style="color:#E05A4A;">
            <i class="fas fa-sign-out-alt"></i>
            <span>تسجيل الخروج</span>
          </a>
        </li>
      `;
    }

    menuHTML += `</ul>`;
    menuHTML += `
      <div class="toast" id="toast">
        <i class="fas fa-check-circle"></i>
        <span id="toastMessage">تم الإجراء بنجاح</span>
      </div>
    `;

    container.innerHTML = menuHTML;

    // Hamburger button
    if (!document.getElementById("hamburgerBtn")) {
      const hamburger = document.createElement("button");
      hamburger.id = "hamburgerBtn";
      hamburger.className = "hamburger-btn";
      hamburger.setAttribute("aria-label", "تبديل القائمة");
      hamburger.innerHTML = '<i class="fas fa-bars"></i>';
      document.body.prepend(hamburger);
    }

    if (!document.getElementById("sidebarOverlay")) {
      const overlay = document.createElement("div");
      overlay.id = "sidebarOverlay";
      overlay.className = "sidebar-overlay";
      document.body.prepend(overlay);
    }

    const sidebar = document.getElementById("sidebar-container");
    const overlay = document.getElementById("sidebarOverlay");
    const hamburger = document.getElementById("hamburgerBtn");

    function openSidebar() {
      sidebar.classList.add("open");
      overlay.classList.add("active");
      document.body.style.overflow = "hidden";
      hamburger.innerHTML = '<i class="fas fa-times"></i>';
    }

    function closeSidebar() {
      sidebar.classList.remove("open");
      overlay.classList.remove("active");
      document.body.style.overflow = "";
      hamburger.innerHTML = '<i class="fas fa-bars"></i>';
    }

    hamburger.addEventListener("click", function(e) {
      e.stopPropagation();
      if (sidebar.classList.contains("open")) {
        closeSidebar();
      } else {
        openSidebar();
      }
    });

    overlay.addEventListener("click", closeSidebar);

    window.addEventListener("resize", function() {
      if (window.innerWidth > 768 && sidebar.classList.contains("open")) {
        closeSidebar();
      }
    });

    document.addEventListener("keydown", function(e) {
      if (e.key === "Escape" && sidebar.classList.contains("open")) {
        closeSidebar();
      }
    });

    // منع التنقل غير المصرح به
    const links = sidebar.querySelectorAll(".sidebar-menu a");
    links.forEach((link) => {
      link.addEventListener("click", async function(e) {
        if (this.getAttribute('onclick') && this.getAttribute('onclick').includes('handleLogout')) {
          return;
        }

        const href = this.getAttribute('href');
        if (!href || href === currentPage) {
          if (window.innerWidth <= 768) closeSidebar();
          return;
        }

        if (!isAuthenticated()) {
          e.preventDefault();
          showToast('الرجاء تسجيل الدخول أولاً', 'error');
          setTimeout(() => { window.location.href = 'dashboard.html'; }, 500);
          return;
        }

        const isValid = await verifyAuth();
        if (!isValid) {
          e.preventDefault();
          localStorage.removeItem('masar_token');
          localStorage.removeItem('masar_user');
          showToast('انتهت صلاحية الجلسة، يرجى تسجيل الدخول مجدداً', 'error');
          setTimeout(() => { window.location.href = 'dashboard.html'; }, 500);
          return;
        }

        if (window.innerWidth <= 768) closeSidebar();
      });
    });
  }

  window.handleLogout = async function(e) {
    if (e) e.preventDefault();
    if (!confirm('هل أنت متأكد من تسجيل الخروج؟')) return;

    try {
      if (window.API) {
        await API.auth.logout();
      }
    } catch (err) {}

    localStorage.removeItem('masar_token');
    localStorage.removeItem('masar_user');
    window.location.href = 'dashboard.html';
  };

  window.showToast = window.showToast || function(msg, type) {
    const toast = document.getElementById('toast');
    if (!toast) { alert(msg); return; }
    const text = document.getElementById('toastMessage');
    if (text) text.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove('show'), 3500);
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderSidebar);
  } else {
    renderSidebar();
  }
})();