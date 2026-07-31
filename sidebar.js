// sidebar.js

// 1. تعريف عناصر القائمة (كل صفحة واسمها وأيقونتها)
const menuItems = [
    { id: 'dashboard', title: 'لوحة التحكم', icon: 'fa-gauge-high', link: 'dashboard.html' },
    { id: 'offers', title: 'العروض', icon: 'fa-file-signature', link: 'offers.html' },
    { id: 'requests', title: 'الطلبات', icon: 'fa-clipboard-list', link: 'requests.html' },
    // { id: 'contacts', title: 'جهات الاتصال', icon: 'fa-address-book', link: 'contacts.html' },
    { id: 'alerts', title: 'التنبيهات والتذكيرات', icon: 'fa-bell', link: 'alerts.html' },
    // { id: 'reports', title: 'التقارير', icon: 'fa-chart-pie', link: 'reports.html' },
    { id: 'settings', title: 'الإعدادات', icon: 'fa-gear', link: 'settings.html' }
];

// 2. دالة إنشاء السايد بار وحقنه في الصفحة
function renderSidebar() {
    const container = document.getElementById('sidebar-container');
    if (!container) return; // لو ما فيه حاوية نخرج

    // نحدد اسم الملف الحالي (مثلاً settings.html)
    const currentPage = window.location.pathname.split('/').pop() || 'dashboard.html';

    // بناء HTML القائمة
    let menuHTML = `
        <div class="sidebar-brand">
            <i class="fas fa-compass"></i>
            <span>مسار</span>
        </div>
        <ul class="sidebar-menu">
    `;

    menuItems.forEach(item => {
        // نتحقق إذا كان الرابط الحالي يطابق رابط العنصر
        const isActive = (item.link === currentPage) ? 'active' : '';
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

    // نضيف أيضاً Toast container (موجود في global.css)
    menuHTML += `
        <div class="toast" id="toast">
            <i class="fas fa-check-circle" style="color: #34d399;"></i>
            <span id="toastMessage">تم الإجراء بنجاح</span>
        </div>
    `;

    container.innerHTML = menuHTML;
}

// 3. تنفيذ الدالة عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', renderSidebar);