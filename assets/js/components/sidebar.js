(function() {
    'use strict';

    function initSidebar() {
        var currentPage = window.location.pathname.split('/').pop().replace('.html', '') || 'dashboard';
        var links = document.querySelectorAll('.sidebar-link');
        links.forEach(function(link) {
            var page = link.dataset.page;
            if (page === currentPage) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });

        var toggleBtn = document.getElementById('toggleSidebarBtn');
        var sidebar = document.getElementById('appSidebar');
        var overlay = document.getElementById('sidebarOverlay');

        function openSidebar() {
            if (sidebar) sidebar.classList.add('open');
            if (overlay) overlay.classList.add('show');
            document.body.style.overflow = 'hidden';
        }
        function closeSidebar() {
            if (sidebar) sidebar.classList.remove('open');
            if (overlay) overlay.classList.remove('show');
            document.body.style.overflow = '';
        }

        if (toggleBtn) {
            toggleBtn.addEventListener('click', openSidebar);
        }
        if (overlay) {
            overlay.addEventListener('click', closeSidebar);
        }

        window.addEventListener('resize', function() {
            if (window.innerWidth >= 1024) {
                closeSidebar();
            }
        });

        var userBtn = document.getElementById('userMenuBtn');
        var dropdown = document.getElementById('userDropdown');
        if (userBtn && dropdown) {
            userBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                dropdown.classList.toggle('show');
            });
            document.addEventListener('click', function() {
                dropdown.classList.remove('show');
            });
            dropdown.addEventListener('click', function(e) {
                e.stopPropagation();
            });
        }

        var logoutBtns = document.querySelectorAll('#logoutHeaderBtn, #logoutSidebarBtn');
        logoutBtns.forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
                    localStorage.removeItem('token');
                    window.location.href = 'index.html';
                }
            });
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSidebar);
    } else {
        initSidebar();
    }
})();