// ============================================================
// assets/js/pages/settings.js - كود الإعدادات (نسخة منظمة)
// ============================================================

let settings = {};
let propertyTypes = [];
let isEditMode = false;

// ============================================================
// TOAST
// ============================================================
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toastMessage');
    if (!toast || !toastMsg) return;
    toast.className = 'toast show ' + type;
    toastMsg.textContent = message;
    clearTimeout(toast._hideTimeout);
    toast._hideTimeout = setTimeout(() => toast.classList.remove('show'), 4000);
}

// ============================================================
// THEME
// ============================================================
function toggleTheme() {
    const currentTheme = localStorage.getItem('masar_theme') || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('masar_theme', newTheme);
    updateThemeUI(newTheme);
}

function updateThemeUI(theme) {
    const icon = document.getElementById('themeIcon');
    const label = document.getElementById('themeLabel');
    if (theme === 'dark') {
        icon.className = 'fas fa-moon';
        label.textContent = 'مظلم';
    } else {
        icon.className = 'fas fa-sun';
        label.textContent = 'فاتح';
    }
}

// ============================================================
// EDIT MODE TOGGLE
// ============================================================
function toggleEditMode() {
    isEditMode = !isEditMode;
    const inputs = document.querySelectorAll('#settingsForm input, #settingsForm select, #settingsForm textarea');
    const addBtn = document.getElementById('addPropertyBtn');
    const newTypeInput = document.getElementById('newPropertyType');
    const editBtn = document.getElementById('editToggleBtn');
    const saveBtn = document.getElementById('saveBtn');

    inputs.forEach(input => {
        if (input.id !== 'newPropertyType') {
            input.disabled = !isEditMode;
        }
    });

    if (isEditMode) {
        newTypeInput.disabled = false;
        addBtn.disabled = false;
        editBtn.innerHTML = '<i class="fas fa-times"></i> <span>إلغاء</span>';
        editBtn.className = 'btn btn-danger text-sm';
        saveBtn.classList.remove('hidden');
    } else {
        newTypeInput.disabled = true;
        addBtn.disabled = true;
        editBtn.innerHTML = '<i class="fas fa-edit"></i> <span>تعديل</span>';
        editBtn.className = 'btn btn-gold text-sm';
        saveBtn.classList.add('hidden');
        // إعادة تعبئة البيانات من التخزين في حال الإلغاء دون حفظ
        loadSettings();
    }
}

// ============================================================
// LOAD SETTINGS - جلب البيانات من API (قاعدة البيانات)
// ============================================================
async function loadSettings() {
    try {
        // محاولة جلب الإعدادات من الخادم عبر API
        const result = await API.settings.get();
        if (result.status === 'success' && result.data) {
            settings = result.data;
            renderSettings();
            return;
        }
        // في حال فشل الجلب، نستخدم التخزين المحلي كاحتياط
        const saved = localStorage.getItem('masar_settings');
        if (saved) {
            try {
                settings = JSON.parse(saved);
                renderSettings();
                return;
            } catch (e) {}
        }
        // إعدادات افتراضية في حال عدم وجود أي بيانات
        settings = {
            company_name: 'شركة مسار العقارية',
            logo_path: '',
            phone: '',
            email: '',
            manager_name: 'أسد',
            manager_phone: '966500000000',
            manager_email: '',
            legal_name: 'الشؤون القانونية',
            legal_phone: '',
            legal_email: '',
            report_day: 4,
            max_wait_days: 3,
            report_footer: '',
        };
        renderSettings();
    } catch (err) {
        showToast('حدث خطأ في تحميل الإعدادات', 'error');
    }
}

function renderSettings() {
    document.getElementById('companyName').value = settings.company_name || '';
    document.getElementById('companyLogo').value = settings.logo_path || '';
    document.getElementById('companyPhone').value = settings.phone || '';
    document.getElementById('companyEmail').value = settings.email || '';
    document.getElementById('managerName').value = settings.manager_name || '';
    document.getElementById('managerPhone').value = settings.manager_phone || '';
    document.getElementById('managerEmail').value = settings.manager_email || '';
    document.getElementById('legalName').value = settings.legal_name || '';
    document.getElementById('legalPhone').value = settings.legal_phone || '';
    document.getElementById('legalEmail').value = settings.legal_email || '';
    document.getElementById('reportDay').value = settings.report_day || 4;
    document.getElementById('maxWaitDays').value = settings.max_wait_days || 3;
    document.getElementById('reportFooter').value = settings.report_footer || '';
}

// ============================================================
// PROPERTY TYPES
// ============================================================
function loadPropertyTypes() {
    const saved = localStorage.getItem('masar_property_types');
    if (saved) {
        try {
            propertyTypes = JSON.parse(saved);
        } catch (e) {
            propertyTypes = ['أرض', 'محطة وقود', 'مركز تجاري'];
        }
    } else {
        propertyTypes = ['أرض', 'محطة وقود', 'مركز تجاري'];
        localStorage.setItem('masar_property_types', JSON.stringify(propertyTypes));
    }
    renderPropertyTypes();
}

function renderPropertyTypes() {
    const container = document.getElementById('propertyTypesTags');
    if (!container) return;
    if (propertyTypes.length === 0) {
        container.innerHTML = '<span class="text-muted text-sm">لا توجد أنواع عقارات مضافة</span>';
        return;
    }
    container.innerHTML = propertyTypes.map((p, index) => `
        <span class="tag-item">
            ${p}
            ${isEditMode ? `<span class="remove" onclick="deletePropertyType(${index})">✕</span>` : ''}
        </span>
    `).join('');
}

function addPropertyType() {
    if (!isEditMode) {
        showToast('الرجاء تفعيل وضع التعديل أولاً', 'error');
        return;
    }
    const input = document.getElementById('newPropertyType');
    const name = input.value.trim();
    if (!name) {
        showToast('الرجاء إدخال اسم النوع', 'error');
        return;
    }
    if (propertyTypes.includes(name)) {
        showToast('هذا النوع موجود بالفعل', 'error');
        return;
    }
    propertyTypes.push(name);
    localStorage.setItem('masar_property_types', JSON.stringify(propertyTypes));
    renderPropertyTypes();
    input.value = '';
    showToast('✅ تم إضافة النوع', 'success');
}

function deletePropertyType(index) {
    if (!isEditMode) {
        showToast('الرجاء تفعيل وضع التعديل أولاً', 'error');
        return;
    }
    if (!confirm('هل أنت متأكد من حذف هذا النوع؟')) return;
    propertyTypes.splice(index, 1);
    localStorage.setItem('masar_property_types', JSON.stringify(propertyTypes));
    renderPropertyTypes();
    showToast('✅ تم الحذف', 'success');
}

// ============================================================
// SAVE SETTINGS - حفظ عبر API
// ============================================================
async function saveAllSettings() {
    const btn = document.getElementById('saveBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> جاري الحفظ...';

    try {
        const updatedSettings = {
            company_name: document.getElementById('companyName').value.trim(),
            logo_path: document.getElementById('companyLogo').value.trim(),
            phone: document.getElementById('companyPhone').value.trim(),
            email: document.getElementById('companyEmail').value.trim(),
            manager_name: document.getElementById('managerName').value.trim(),
            manager_phone: document.getElementById('managerPhone').value.trim(),
            manager_email: document.getElementById('managerEmail').value.trim(),
            legal_name: document.getElementById('legalName').value.trim(),
            legal_phone: document.getElementById('legalPhone').value.trim(),
            legal_email: document.getElementById('legalEmail').value.trim(),
            report_day: parseInt(document.getElementById('reportDay').value),
            max_wait_days: parseInt(document.getElementById('maxWaitDays').value) || 3,
            report_footer: document.getElementById('reportFooter').value.trim(),
        };

        if (!updatedSettings.company_name || !updatedSettings.manager_name || !updatedSettings.manager_phone) {
            showToast('⚠️ يرجى ملء الحقول المطلوبة (*)', 'error');
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-save"></i> حفظ';
            return;
        }

        // حفظ عبر API
        const result = await API.settings.update(updatedSettings);
        if (result.status === 'success') {
            settings = updatedSettings;
            // حفظ أيضاً في localStorage كاحتياط
            localStorage.setItem('masar_settings', JSON.stringify(settings));
            showToast('✅ تم حفظ جميع الإعدادات بنجاح', 'success');
            // إيقاف وضع التعديل
            isEditMode = true; // لتشتغل toggleEditMode وتقلبه
            toggleEditMode();
        } else {
            showToast(result.message || 'فشل حفظ الإعدادات', 'error');
        }
    } catch (err) {
        showToast(err.message || 'حدث خطأ أثناء الحفظ', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-save"></i> حفظ';
    }
}

// ============================================================
// STATISTICS
// ============================================================
async function loadStatistics() {
    try {
        const result = await API.reports.dashboard();
        if (result.status === 'success') {
            const data = result.data;
            document.getElementById('statOffers').textContent = data.total_offers || 0;
            document.getElementById('statRequests').textContent = data.total_requests || 0;
            document.getElementById('statContacts').textContent = data.total_clients || 0;
            document.getElementById('statOwners').textContent = data.total_users || 0;
        }
    } catch (err) {
        // تجاهل الأخطاء في الإحصائيات
    }
}

// ============================================================
// BACKUP & RESTORE
// ============================================================
function backupData() {
    const data = {
        settings: settings,
        propertyTypes: propertyTypes,
        timestamp: new Date().toISOString(),
        version: '1.0',
    };
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `backup_masar_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    showToast('✅ تم تحميل النسخة الاحتياطية', 'success');
}

function restoreData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = function (e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function (ev) {
            try {
                const data = JSON.parse(ev.target.result);
                if (data.settings) {
                    settings = data.settings;
                    renderSettings();
                    localStorage.setItem('masar_settings', JSON.stringify(settings));
                    showToast('✅ تم استعادة الإعدادات بنجاح', 'success');
                }
                if (data.propertyTypes) {
                    propertyTypes = data.propertyTypes;
                    renderPropertyTypes();
                    localStorage.setItem('masar_property_types', JSON.stringify(propertyTypes));
                }
            } catch (err) {
                showToast('ملف غير صالح', 'error');
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

function resetSystem() {
    if (!confirm('⚠️ هل أنت متأكد من إعادة تعيين الإعدادات إلى القيم الافتراضية؟')) return;
    settings = {
        company_name: 'شركة مسار العقارية',
        logo_path: '',
        phone: '',
        email: '',
        manager_name: 'أسد',
        manager_phone: '966500000000',
        manager_email: '',
        legal_name: 'الشؤون القانونية',
        legal_phone: '',
        legal_email: '',
        report_day: 4,
        max_wait_days: 3,
        report_footer: '',
    };
    renderSettings();
    localStorage.setItem('masar_settings', JSON.stringify(settings));
    showToast('✅ تم إعادة تعيين الإعدادات', 'success');
}

function clearAllData() {
    if (!confirm('🚨 سيتم حذف جميع البيانات محلياً. هل أنت متأكد؟')) return;
    if (!confirm('تأكيد نهائي: هل تريد حذف كل شيء؟')) return;
    localStorage.removeItem('masar_settings');
    localStorage.removeItem('masar_property_types');
    localStorage.removeItem('masarOffersLocal');
    localStorage.removeItem('masarRequestsLocal');
    localStorage.removeItem('masarRemindersLocal');
    settings = {};
    propertyTypes = [];
    renderSettings();
    renderPropertyTypes();
    showToast('✅ تم مسح جميع البيانات', 'success');
}

// ============================================================
// KEYBOARD SHORTCUTS
// ============================================================
document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (isEditMode) {
            saveAllSettings();
        } else {
            showToast('الرجاء تفعيل وضع التعديل أولاً', 'info');
        }
    }
    if (e.key === 'Escape' && isEditMode) {
        toggleEditMode();
    }
});

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', async function () {
    // التحقق من المصادقة مع التوجيه التلقائي
    const isAuth = await API.auth.checkAuth(true);
    if (!isAuth) return;

    // إظهار المحتوى
    const main = document.getElementById('mainContent');
    if (main) {
        main.style.display = 'block';
        main.classList.add('visible');
    }

    // تحميل الثيم
    const savedTheme = localStorage.getItem('masar_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeUI(savedTheme);

    // تحميل الإعدادات من الخادم
    await loadSettings();

    // تحميل أنواع العقارات
    loadPropertyTypes();

    // تحميل الإحصائيات
    await loadStatistics();

    // تعطيل وضع التعديل افتراضياً
    isEditMode = false;
    // تأكيد أن الحقول معطلة
    document.querySelectorAll('#settingsForm input, #settingsForm select, #settingsForm textarea').forEach(el => {
        if (el.id !== 'newPropertyType') el.disabled = true;
    });
    document.getElementById('newPropertyType').disabled = true;
    document.getElementById('addPropertyBtn').disabled = true;
});

// ============================================================
// EXPOSE GLOBALS
// ============================================================
window.saveAllSettings = saveAllSettings;
window.toggleEditMode = toggleEditMode;
window.toggleTheme = toggleTheme;
window.backupData = backupData;
window.restoreData = restoreData;
window.resetSystem = resetSystem;
window.clearAllData = clearAllData;
window.addPropertyType = addPropertyType;
window.deletePropertyType = deletePropertyType;
window.showToast = showToast;