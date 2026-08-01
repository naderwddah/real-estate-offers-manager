// ============================================================
// global.js - دوال عامة
// ============================================================

// دالة عرض الإشعارات
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const icon = toast?.querySelector('i');
    const text = document.getElementById('toastMessage');
    if (!toast || !text) {
        console.warn('Toast element not found:', message);
        return;
    }

    text.textContent = message;
    if (icon) {
        if (type === 'error') {
            icon.style.color = '#E05A4A';
            icon.className = 'fas fa-exclamation-circle';
        } else if (type === 'success') {
            icon.style.color = '#1F7A5C';
            icon.className = 'fas fa-check-circle';
        } else {
            icon.style.color = '#C9A24B';
            icon.className = 'fas fa-info-circle';
        }
    }
    toast.classList.add('show');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove('show'), 3500);
}

// دالة تنسيق التاريخ
function formatDate(dateString) {
    if (!dateString) return '-';
    try {
        const d = new Date(dateString);
        return d.toLocaleDateString('ar-SA', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch (e) {
        return dateString;
    }
}

// دالة تنسيق الوقت
function formatTime(dateString) {
    if (!dateString) return '';
    try {
        const d = new Date(dateString);
        return d.toLocaleTimeString('ar-SA', {
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (e) {
        return '';
    }
}

// دالة تنسيق المبلغ
function formatMoney(amount) {
    if (!amount && amount !== 0) return '—';
    return Number(amount).toLocaleString('en-US') + ' ريال';
}

// دالة توليد معرف مؤقت
function generateTempId() {
    return 'temp_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// دالة الحصول على اسم مرحلة العرض
function getOfferStageName(stageId, trackType = 'company') {
    const stages = trackType === 'company' ?
        ['عرض جديد', 'بانتظار رد المدير', 'تم تحديد السعر', 'تم إبلاغ المالك', 'تم استلام المستندات', 'عند الشؤون القانونية', 'مكتمل'] :
        ['عرض جديد', 'تفاوض', 'تم الاتفاق', 'مكتمل'];
    return stages[stageId - 1] || 'غير معروف';
}

// دالة الحصول على اسم مرحلة الطلب
function getRequestStageName(stageId) {
    const stages = ['طلب جديد', 'جاري المطابقة', 'تم اختيار العرض', 'جدولة المعاينة', 'مكتمل'];
    return stages[stageId - 1] || 'غير معروف';
}

// دالة الحصول على لون الحالة
function getStatusColor(stageId, type = 'offer') {
    const colors = {
        1: '#f97316', 2: '#f59e0b', 3: '#3b82f6',
        4: '#8b5cf6', 5: '#10b981', 6: '#f59e0b',
        7: '#10b981', 10: '#10b981', 11: '#f59e0b'
    };
    return colors[stageId] || '#9ca3af';
}

// تصدير الدوال
window.showToast = showToast;
window.formatDate = formatDate;
window.formatTime = formatTime;
window.formatMoney = formatMoney;
window.generateTempId = generateTempId;
window.getOfferStageName = getOfferStageName;
window.getRequestStageName = getRequestStageName;
window.getStatusColor = getStatusColor;