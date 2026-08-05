(function() {
    'use strict';

    function loadComponent(selector, url, callback) {
        fetch(url)
            .then(function(res) {
                if (!res.ok) throw new Error('Failed to load ' + url);
                return res.text();
            })
            .then(function(html) {
                var container = document.createElement('div');
                container.innerHTML = html;
                var target = document.querySelector(selector);
                if (target && target.parentNode) {
                    target.parentNode.replaceChild(container.firstElementChild, target);
                } else {
                    document.body.insertBefore(container.firstElementChild, document.body.firstChild);
                }
                if (typeof callback === 'function') callback();
            })
            .catch(function(err) {
                console.error('Error loading component:', err);
            });
    }

    function initTheme() {
        var stored = localStorage.getItem('theme') || 'light';
        var isDark = stored === 'dark';
        document.documentElement.classList.toggle('dark', isDark);

        var icon = document.getElementById('themeIcon');
        if (icon) {
            icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
        }

        var toggleBtn = document.getElementById('themeToggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', function() {
                var currentlyDark = document.documentElement.classList.contains('dark');
                var newDark = !currentlyDark;
                document.documentElement.classList.toggle('dark', newDark);
                localStorage.setItem('theme', newDark ? 'dark' : 'light');
                var icon2 = document.getElementById('themeIcon');
                if (icon2) {
                    icon2.className = newDark ? 'fas fa-sun' : 'fas fa-moon';
                }
            });
        }
    }

    document.addEventListener('DOMContentLoaded', function() {
        var headerPlaceholder = document.createElement('div');
        headerPlaceholder.id = 'header-placeholder';
        document.body.prepend(headerPlaceholder);

        var sidebarPlaceholder = document.createElement('div');
        sidebarPlaceholder.id = 'sidebar-placeholder';
        document.body.prepend(sidebarPlaceholder);

        loadComponent('#header-placeholder', '../components/header.html', function() {
            initTheme();
        });

        loadComponent('#sidebar-placeholder', '../components/sidebar.html', function() {
            var script = document.createElement('script');
            script.src = '../assets/js/components/sidebar.js';
            document.body.appendChild(script);
        });
    });
})();