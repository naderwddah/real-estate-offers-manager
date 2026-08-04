// ============================================================
// SIDEBAR BUILDER - مع دعم الوضع المظلم الكامل
// ============================================================

(function() {
    "use strict";

    const menuItems = [
        { id: "dashboard", title: "لوحة التحكم", icon: "fa-gauge-high", link: "/pages/dashboard.html" },
        { id: "offers", title: "العروض", icon: "fa-file-signature", link: "/pages/offers.html" },
        { id: "requests", title: "الطلبات", icon: "fa-clipboard-list", link: "/pages/requests.html" },
         { id: "map", title: "مستكشف المواقع", icon: "fa-map-marked-alt", link: "/pages/map_searcher.html" },
        { id: "alerts", title: "التنبيهات والتذكيرات", icon: "fa-bell", link: "/pages/alerts.html" },
        { id: "settings", title: "الإعدادات", icon: "fa-gear", link: "/pages/settings.html" }
    ];

    function getTheme() {
        return localStorage.getItem('masar_theme') || 'dark';
    }

    function setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('masar_theme', theme);
        updateThemeUI(theme);
        updateSidebarThemeButton(theme);
    }

    function toggleTheme() {
        const current = getTheme();
        const newTheme = current === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        // تحديث زر الوضع المظلم في السايدبار
        updateSidebarThemeButton(newTheme);
    }

    function updateThemeUI(theme) {
        const icon = document.querySelector('.theme-toggle i');
        if (icon) {
            icon.className = theme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
        }
        // تحديث زر السايدبار
        updateSidebarThemeButton(theme);
    }

    function updateSidebarThemeButton(theme) {
        const sidebarThemeBtn = document.querySelector('.sidebar-theme-btn');
        if (sidebarThemeBtn) {
            const icon = sidebarThemeBtn.querySelector('i');
            const text = sidebarThemeBtn.querySelector('span');
            if (icon) {
                icon.className = theme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
            }
            if (text) {
                text.textContent = theme === 'dark' ? 'الوضع المظلم' : 'الوضع الفاتح';
            }
        }
    }

    function isAuthenticated() {
        return !!localStorage.getItem('masar_token');
    }

    async function verifyAuth() {
        const token = localStorage.getItem('masar_token');
        if (!token) return false;
        try {
            // استخدام الـ API الفعلي بدلاً من localhost
            const res = await fetch('https://masar.technova.fun/api/auth/me', {
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

        // Theme toggle button (floating) - تأكد من وجوده مرة واحدة فقط
        if (!document.querySelector('.theme-toggle')) {
            const themeBtn = document.createElement('button');
            themeBtn.className = 'theme-toggle';
            themeBtn.setAttribute('aria-label', 'تبديل الوضع');
            const currentTheme = getTheme();
            themeBtn.innerHTML = `<i class="fas ${currentTheme === 'dark' ? 'fa-moon' : 'fa-sun'}"></i>`;
            themeBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                toggleTheme();
            });
            document.body.prepend(themeBtn);
        }

        const currentPage = window.location.pathname.split("/").pop() || "dashboard.html";
        const isAuth = isAuthenticated();
        const currentTheme = getTheme();

        let menuHTML = `
            <div class="sidebar-brand">
                <i class="fas fa-compass"></i>
                <span>مسار</span>
            </div>
            <ul class="sidebar-menu">
        `;

        menuItems.forEach((item) => {
            // تحديد الصفحة النشطة بناءً على الرابط
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

        // زر الوضع المظلم في السايدبار
        menuHTML += `
            <li style="margin-top:8px;padding-top:12px;border-top:1px solid var(--border-color);">
                <a href="#" onclick="toggleTheme(); return false;" class="sidebar-theme-btn" style="display:flex;align-items:center;gap:14px;padding:12px 18px;color:var(--text-secondary);text-decoration:none;border-radius:12px;font-weight:500;font-size:0.95rem;transition:all 0.2s;">
                    <i class="fas ${currentTheme === 'dark' ? 'fa-moon' : 'fa-sun'}" style="width:24px;text-align:center;font-size:1.2rem;"></i>
                    <span>${currentTheme === 'dark' ? 'الوضع المظلم' : 'الوضع الفاتح'}</span>
                </a>
            </li>
        `;

        if (isAuth) {
            menuHTML += `
                <li style="margin-top:4px;border-top:1px solid var(--border-color);padding-top:12px;">
                    <a href="#" onclick="handleLogout(event)" style="color:var(--danger);">
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

        // Hamburger button - تأكد من وجوده مرة واحدة فقط
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

        // إزالة الأحداث القديمة لمنع التكرار
        hamburger.replaceWith(hamburger.cloneNode(true));
        const newHamburger = document.getElementById("hamburgerBtn");
        newHamburger.addEventListener("click", function(e) {
            e.stopPropagation();
            if (sidebar.classList.contains("open")) {
                closeSidebar();
            } else {
                openSidebar();
            }
        });

        overlay.replaceWith(overlay.cloneNode(true));
        const newOverlay = document.getElementById("sidebarOverlay");
        newOverlay.addEventListener("click", closeSidebar);

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

        // Set initial theme
        const savedTheme = getTheme();
        document.documentElement.setAttribute('data-theme', savedTheme);
        updateThemeUI(savedTheme);
        updateSidebarThemeButton(savedTheme);

        // منع التنقل غير المصرح به
        const links = sidebar.querySelectorAll(".sidebar-menu a");
        links.forEach((link) => {
            link.addEventListener("click", async function(e) {
                if (this.getAttribute('onclick') && this.getAttribute('onclick').includes('handleLogout')) {
                    return;
                }
                if (this.getAttribute('onclick') && this.getAttribute('onclick').includes('toggleTheme')) {
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

    // Expose theme functions globally
    window.getTheme = getTheme;
    window.setTheme = setTheme;
    window.toggleTheme = toggleTheme;
    window.updateThemeUI = updateThemeUI;
    window.updateSidebarThemeButton = updateSidebarThemeButton;

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", renderSidebar);
    } else {
        renderSidebar();
    }
})();