// ============================================================
// SIDEBAR BUILDER (Responsive Drawer)
// ============================================================

(function () {
  "use strict";

  // 1. تعريف عناصر القائمة (كل صفحة واسمها وأيقونتها)
  const menuItems = [
    {
      id: "dashboard",
      title: "لوحة التحكم",
      icon: "fa-gauge-high",
      link: "dashboard.html",
    },
    {
      id: "offers",
      title: "العروض",
      icon: "fa-file-signature",
      link: "offers.html",
    },
    {
      id: "requests",
      title: "الطلبات",
      icon: "fa-clipboard-list",
      link: "requests.html",
    },
    {
      id: "alerts",
      title: "التنبيهات والتذكيرات",
      icon: "fa-bell",
      link: "alerts.html",
    },
    {
      id: "settings",
      title: "الإعدادات",
      icon: "fa-gear",
      link: "settings.html",
    },
  ];

  // 2. دالة إنشاء السايد بار وحقنه في الصفحة
  function renderSidebar() {
    // التأكد من وجود الحاوية
    let container = document.getElementById("sidebar-container");
    if (!container) {
      // إذا لم توجد الحاوية، ننشئها
      container = document.createElement("div");
      container.id = "sidebar-container";
      document.body.prepend(container);
    }

    // تحديد الصفحة الحالية
    const currentPage =
      window.location.pathname.split("/").pop() || "dashboard.html";

    // بناء HTML القائمة
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
                    <a href="${item.link}" class="${isActive}">
                        <i class="fas ${item.icon}"></i>
                        <span>${item.title}</span>
                    </a>
                </li>
            `;
    });

    menuHTML += `</ul>`;

    // إضافة Toast container (موجود في global.css)
    menuHTML += `
            <div class="toast" id="toast">
                <i class="fas fa-check-circle"></i>
                <span id="toastMessage">تم الإجراء بنجاح</span>
            </div>
        `;

    container.innerHTML = menuHTML;

    // ========================================
    // 3. إضافة زر الهامبورجر والطبقة الخلفية
    // ========================================

    // التأكد من عدم وجودهما مسبقاً (تجنب التكرار)
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

    // ========================================
    // 4. ربط الأحداث (فتح/غلق)
    // ========================================
    const sidebar = document.getElementById("sidebar-container");
    const overlay = document.getElementById("sidebarOverlay");
    const hamburger = document.getElementById("hamburgerBtn");

    // دالة فتح السايد بار
    function openSidebar() {
      sidebar.classList.add("open");
      overlay.classList.add("active");
      document.body.style.overflow = "hidden";
      hamburger.innerHTML = '<i class="fas fa-times"></i>';
    }

    // دالة غلق السايد بار
    function closeSidebar() {
      sidebar.classList.remove("open");
      overlay.classList.remove("active");
      document.body.style.overflow = "";
      hamburger.innerHTML = '<i class="fas fa-bars"></i>';
    }

    // دالة التبديل
    function toggleSidebar() {
      if (sidebar.classList.contains("open")) {
        closeSidebar();
      } else {
        openSidebar();
      }
    }

    // ربط الأحداث
    hamburger.addEventListener("click", toggleSidebar);
    overlay.addEventListener("click", closeSidebar);

    // إغلاق السايد بار عند تغيير حجم الشاشة إلى وضع الديسكتوب
    window.addEventListener("resize", function () {
      if (window.innerWidth > 768 && sidebar.classList.contains("open")) {
        closeSidebar();
      }
    });

    // إغلاق السايد بار عند الضغط على مفتاح Escape
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && sidebar.classList.contains("open")) {
        closeSidebar();
      }
    });

    // ========================================
    // 5. إغلاق السايد بار تلقائياً عند النقر على رابط (لتجنب بقاءه مفتوحاً)
    // ========================================
    const links = sidebar.querySelectorAll(".sidebar-menu a");
    links.forEach((link) => {
      link.addEventListener("click", function () {
        if (window.innerWidth <= 768) {
          closeSidebar();
        }
      });
    });
  }

  // تنفيذ الدالة بعد تحميل DOM
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderSidebar);
  } else {
    renderSidebar();
  }
})();
