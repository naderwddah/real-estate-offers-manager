// global.js
// يحتوي على الدوال التي تستخدمها عدة صفحات (مثل دالة التوست)

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const icon = toast?.querySelector('i');
    const text = document.getElementById('toastMessage');
    if (!toast || !text) return;

    text.textContent = message;

    // تغيير لون الأيقونة حسب النوع
    if (icon) {
        if (type === 'error') {
            icon.style.color = '#f87171'; // أحمر
            icon.className = 'fas fa-exclamation-circle';
        } else if (type === 'success') {
            icon.style.color = '#34d399'; // أخضر
            icon.className = 'fas fa-check-circle';
        } else {
            icon.style.color = '#60a5fa'; // أزرق
            icon.className = 'fas fa-info-circle';
        }
    }

    toast.classList.add('show');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove('show'), 3500);
}

// دالة مساعدة لقراءة البيانات من localStorage (تتكرر في كل صفحة)
function loadData(key) {
    const data = localStorage.getItem(key);
    if (data) {
        try { return JSON.parse(data); } catch (e) {}
    }
    return [];
}

// دالة مساعدة لحفظ البيانات
function saveData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

// نعرض الدوال في النطاق العام عشان نستخدمها في الأونكليك
window.showToast = showToast;
window.loadData = loadData;
window.saveData = saveData;