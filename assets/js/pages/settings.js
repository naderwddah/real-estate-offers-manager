// ============================================================
// assets/js/pages/settings.js - الإعدادات (نسخة نهائية مع دعم الشعار)
// ============================================================

let settings = {};
let propertyTypes = [];
let isEditMode = false;
let originalSettings = {};
let logoFileData = null; // لتخزين الصورة مؤقتاً في localStorage

// ============================================================
// TOAST
// ============================================================
function showToast(message, type = "success") {
    const toast = document.getElementById("toast");
    const toastMsg = document.getElementById("toastMessage");
    if (!toast || !toastMsg) return;
    const icon = toast.querySelector("i");
    if (type === "success") icon.className = "fas fa-check-circle text-emerald-400";
    else if (type === "error") icon.className = "fas fa-exclamation-circle text-red-400";
    else icon.className = "fas fa-info-circle text-blue-400";
    toast.className = "toast show " + type;
    toastMsg.textContent = message;
    clearTimeout(toast._hideTimeout);
    toast._hideTimeout = setTimeout(() => toast.classList.remove("show"), 4500);
}

// ============================================================
// THEME
// ============================================================
function toggleTheme() {
    const current = localStorage.getItem("masar_theme") || "dark";
    const next = current === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("masar_theme", next);
    updateThemeUI(next);
}

function updateThemeUI(theme) {
    const icon = document.getElementById("themeIcon");
    const label = document.getElementById("themeLabel");
    if (icon) icon.className = theme === "dark" ? "fas fa-moon" : "fas fa-sun";
    if (label) label.textContent = theme === "dark" ? "مظلم" : "فاتح";
}

// ============================================================
// LOGO HANDLING (تخزين الصورة في localStorage مؤقتاً)
// ============================================================
function handleLogoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
        showToast("⚠️ حجم الصورة كبير جداً، الحد الأقصى 2MB", "error");
        event.target.value = "";
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        const base64 = e.target.result;
        logoFileData = base64;
        
        // عرض الصورة في المعاينة
        const preview = document.getElementById("logoPreview");
        const placeholder = document.getElementById("logoPlaceholder");
        const removeBtn = document.getElementById("removeLogoBtn");
        
        if (preview) {
            preview.src = base64;
            preview.classList.remove("hidden");
        }
        if (placeholder) placeholder.classList.add("hidden");
        if (removeBtn) removeBtn.classList.remove("hidden");
        
        // حفظ الصورة في localStorage مؤقتاً (لأن الخادم قد لا يقبلها)
        try {
            localStorage.setItem("masar_logo_temp", base64);
        } catch (e) {
            console.warn("فشل حفظ الصورة في localStorage:", e.message);
        }
        
        // تحديث الحقل المخفي
        const logoInput = document.getElementById("companyLogo");
        if (logoInput) logoInput.value = "data:image/temp"; // وضع قيمة رمزية
        
        showToast("✅ تم تحميل الشعار (سيتم حفظه مؤقتاً)", "success");
    };
    reader.readAsDataURL(file);
}

function removeLogo() {
    logoFileData = null;
    const preview = document.getElementById("logoPreview");
    const placeholder = document.getElementById("logoPlaceholder");
    const removeBtn = document.getElementById("removeLogoBtn");
    const logoInput = document.getElementById("companyLogo");
    const fileInput = document.getElementById("logoFileInput");
    
    if (preview) { preview.src = ""; preview.classList.add("hidden"); }
    if (placeholder) placeholder.classList.remove("hidden");
    if (removeBtn) removeBtn.classList.add("hidden");
    if (logoInput) logoInput.value = "";
    if (fileInput) fileInput.value = "";
    
    try {
        localStorage.removeItem("masar_logo_temp");
    } catch (e) {}
    
    showToast("🗑️ تم إزالة الشعار", "info");
}

function updateLogoPreview(imageUrl) {
    const preview = document.getElementById("logoPreview");
    const placeholder = document.getElementById("logoPlaceholder");
    const removeBtn = document.getElementById("removeLogoBtn");
    const logoInput = document.getElementById("companyLogo");
    
    if (imageUrl && imageUrl.length > 0 && imageUrl.startsWith("data:image")) {
        if (preview) {
            preview.src = imageUrl;
            preview.classList.remove("hidden");
        }
        if (placeholder) placeholder.classList.add("hidden");
        if (removeBtn) removeBtn.classList.remove("hidden");
        if (logoInput) logoInput.value = imageUrl;
        logoFileData = imageUrl;
    } else if (imageUrl && imageUrl.length > 0) {
        // رابط خارجي
        if (preview) {
            preview.src = imageUrl;
            preview.classList.remove("hidden");
        }
        if (placeholder) placeholder.classList.add("hidden");
        if (removeBtn) removeBtn.classList.remove("hidden");
        if (logoInput) logoInput.value = imageUrl;
        logoFileData = imageUrl;
    } else {
        if (preview) { preview.src = ""; preview.classList.add("hidden"); }
        if (placeholder) placeholder.classList.remove("hidden");
        if (removeBtn) removeBtn.classList.add("hidden");
        if (logoInput) logoInput.value = "";
        logoFileData = null;
    }
}

// ============================================================
// EDIT MODE
// ============================================================
function toggleEditMode() {
    isEditMode = !isEditMode;
    const inputs = document.querySelectorAll('#settingsForm input, #settingsForm select, #settingsForm textarea');
    const addBtn = document.getElementById('addPropertyBtn');
    const newTypeInput = document.getElementById('newPropertyType');
    const editBtn = document.getElementById('editToggleBtn');
    const saveBtn = document.getElementById('saveBtn');
    const indicator = document.getElementById('editIndicator');

    inputs.forEach(input => {
        if (input && input.id !== 'newPropertyType' && input.id !== 'logoFileInput') {
            input.disabled = !isEditMode;
        }
    });

    if (isEditMode) {
        if (newTypeInput) newTypeInput.disabled = false;
        if (addBtn) addBtn.disabled = false;
        if (editBtn) {
            editBtn.innerHTML = '<i class="fas fa-times"></i> <span>إلغاء</span>';
            editBtn.className = 'btn btn-rose text-sm';
        }
        if (saveBtn) saveBtn.classList.remove('hidden');
        document.body.classList.add('edit-mode');
        if (indicator) indicator.style.display = 'inline-block';
        originalSettings = JSON.parse(JSON.stringify(settings));
        originalSettings.logo_data = logoFileData;
    } else {
        if (newTypeInput) newTypeInput.disabled = true;
        if (addBtn) addBtn.disabled = true;
        if (editBtn) {
            editBtn.innerHTML = '<i class="fas fa-edit"></i> <span>تعديل</span>';
            editBtn.className = 'btn btn-gold text-sm';
        }
        if (saveBtn) saveBtn.classList.add('hidden');
        document.body.classList.remove('edit-mode');
        if (indicator) indicator.style.display = 'none';
        renderSettings(settings);
        renderPropertyTypes();
        if (settings.logo_path) {
            updateLogoPreview(settings.logo_path);
        } else {
            removeLogo();
        }
    }
}

// ============================================================
// LOAD SETTINGS
// ============================================================
async function loadSettings() {
    try {
        const result = await API.settings.get();
        if (result.status === "success" && result.data) {
            settings = result.data;
        } else {
            settings = getDefaultSettings();
        }
    } catch (err) {
        console.warn("فشل جلب الإعدادات:", err.message);
        settings = getDefaultSettings();
        const saved = localStorage.getItem("masar_settings");
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                settings = { ...settings, ...parsed };
            } catch (e) {}
        }
    }

    const timeouts = loadTimeoutSettings();
    settings = { ...settings, ...timeouts };

    renderSettings(settings);
}

function getDefaultSettings() {
    return {
        company_name: "شركة مسار العقارية",
        logo_path: "",
        phone: "",
        email: "",
        manager_name: "أسد",
        manager_phone: "966500000000",
        manager_email: "",
        legal_name: "الشؤون القانونية",
        legal_phone: "",
        legal_email: "",
        report_footer: "",
        max_wait_days: 3,
        report_day: 4,
        manager_timeout: 2,
        client_timeout: 3,
        legal_timeout: 3,
        client_sign_timeout: 3
    };
}

function loadTimeoutSettings() {
    try {
        const data = localStorage.getItem("masar_timeout_settings");
        if (data) return JSON.parse(data);
    } catch (e) {}
    return {
        manager_timeout: 2,
        client_timeout: 3,
        legal_timeout: 3,
        client_sign_timeout: 3
    };
}

function saveTimeoutSettings(timeouts) {
    localStorage.setItem("masar_timeout_settings", JSON.stringify(timeouts));
}

function getElementValue(id, defaultValue = "") {
    const el = document.getElementById(id);
    if (!el) {
        console.warn(`⚠️ Element with id "${id}" not found`);
        return defaultValue;
    }
    return el.value !== undefined ? el.value : defaultValue;
}

function setElementValue(id, value) {
    const el = document.getElementById(id);
    if (el) {
        el.value = value;
    } else {
        console.warn(`⚠️ Element with id "${id}" not found for setting value`);
    }
}

function renderSettings(data) {
    const map = {
        companyName: data.company_name || "",
        companyLogo: data.logo_path || "",
        companyPhone: data.phone || "",
        companyEmail: data.email || "",
        managerName: data.manager_name || "",
        managerPhone: data.manager_phone || "",
        managerEmail: data.manager_email || "",
        legalName: data.legal_name || "",
        legalPhone: data.legal_phone || "",
        legalEmail: data.legal_email || "",
        reportFooter: data.report_footer || "",
        maxWaitDays: data.max_wait_days || 3,
        reportDay: data.report_day || 4,
        managerTimeout: data.manager_timeout || 2,
        clientTimeout: data.client_timeout || 3,
        legalTimeout: data.legal_timeout || 3,
        clientSignTimeout: data.client_sign_timeout || 3
    };
    for (const [id, value] of Object.entries(map)) {
        setElementValue(id, value);
    }
    
    if (data.logo_path) {
        updateLogoPreview(data.logo_path);
    } else {
        // محاولة استعادة الصورة من localStorage
        const tempLogo = localStorage.getItem("masar_logo_temp");
        if (tempLogo) {
            updateLogoPreview(tempLogo);
        } else {
            removeLogo();
        }
    }
}

// ============================================================
// PROPERTY TYPES
// ============================================================
async function loadPropertyTypes() {
    try {
        const result = await API.propertyTypes.list();
        if (result.status === "success") {
            if (Array.isArray(result.data)) propertyTypes = result.data;
            else if (result.data && Array.isArray(result.data.data)) propertyTypes = result.data.data;
            else propertyTypes = [];
        } else {
            throw new Error("فشل الجلب");
        }
    } catch (err) {
        const saved = localStorage.getItem("masar_property_types");
        if (saved) {
            try { propertyTypes = JSON.parse(saved); } catch (e) { propertyTypes = []; }
        }
        if (propertyTypes.length === 0) {
            propertyTypes = [
                { id: 1, name: "أرض" },
                { id: 2, name: "محطة وقود" },
                { id: 3, name: "مركز تجاري" },
                { id: 4, name: "فيلا" },
                { id: 5, name: "شقة" },
                { id: 6, name: "عمارة" },
                { id: 7, name: "مستودع" },
                { id: 8, name: "مكتب" }
            ];
        }
    }
    renderPropertyTypes();
}

function renderPropertyTypes() {
    const container = document.getElementById("propertyTypesTags");
    if (!container) return;
    if (!propertyTypes || propertyTypes.length === 0) {
        container.innerHTML = '<span class="text-muted text-sm">لا توجد أنواع عقارات مضافة</span>';
        return;
    }
    container.innerHTML = propertyTypes.map((p, index) => `
        <span class="tag-item">
            ${p.name}
            ${isEditMode ? `<span class="remove" onclick="deletePropertyType(${index})">✕</span>` : ''}
        </span>
    `).join('');
}

function addPropertyType() {
    if (!isEditMode) {
        showToast("الرجاء تفعيل وضع التعديل أولاً", "error");
        return;
    }
    const input = document.getElementById("newPropertyType");
    if (!input) {
        showToast("عنصر الإدخال غير موجود", "error");
        return;
    }
    const name = input.value.trim();
    if (!name) {
        showToast("الرجاء إدخال اسم النوع", "error");
        return;
    }
    if (propertyTypes.some(p => p.name === name)) {
        showToast("هذا النوع موجود بالفعل", "error");
        return;
    }
    const newId = Math.max(...propertyTypes.map(p => p.id || 0), 0) + 1;
    propertyTypes.push({ id: newId, name: name });
    localStorage.setItem("masar_property_types", JSON.stringify(propertyTypes));
    renderPropertyTypes();
    input.value = '';
    showToast("✅ تم إضافة النوع", "success");
}

function deletePropertyType(index) {
    if (!isEditMode) {
        showToast("الرجاء تفعيل وضع التعديل أولاً", "error");
        return;
    }
    if (!confirm("هل أنت متأكد من حذف هذا النوع؟")) return;
    propertyTypes.splice(index, 1);
    localStorage.setItem("masar_property_types", JSON.stringify(propertyTypes));
    renderPropertyTypes();
    showToast("✅ تم الحذف", "success");
}

// ============================================================
// SAVE SETTINGS
// ============================================================
async function saveAllSettings() {
    const btn = document.getElementById('saveBtn');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner"></span> جاري الحفظ...';
    }

    try {
        const getVal = (id, def = "") => {
            const el = document.getElementById(id);
            return el ? el.value.trim() : def;
        };
        const getNum = (id, def = 3) => {
            const el = document.getElementById(id);
            if (!el) return def;
            const val = parseInt(el.value);
            return isNaN(val) ? def : val;
        };

        const company_name = getVal('companyName');
        // لا نرسل logo_path إذا كانت صورة base64 كبيرة
        let logo_path = getVal('companyLogo');
        const phone = getVal('companyPhone');
        const email = getVal('companyEmail');
        const manager_name = getVal('managerName');
        const manager_phone = getVal('managerPhone');
        const manager_email = getVal('managerEmail');
        const legal_name = getVal('legalName');
        const legal_phone = getVal('legalPhone');
        const legal_email = getVal('legalEmail');
        const report_footer = getVal('reportFooter');
        const max_wait_days = getNum('maxWaitDays', 3);
        const report_day = getNum('reportDay', 4);

        const manager_timeout = getNum('managerTimeout', 2);
        const client_timeout = getNum('clientTimeout', 3);
        const legal_timeout = getNum('legalTimeout', 3);
        const client_sign_timeout = getNum('clientSignTimeout', 3);

        if (!company_name || !manager_name || !manager_phone) {
            showToast("⚠️ يرجى ملء الحقول المطلوبة (*)", "error");
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-save"></i> حفظ';
            }
            return;
        }

        // إذا كان logo_path يحتوي على base64 طويل، نهملها ونحتفظ بالصورة في localStorage
        if (logo_path && logo_path.startsWith("data:image")) {
            // حفظ الصورة في localStorage مؤقتاً
            try {
                localStorage.setItem("masar_logo_temp", logo_path);
            } catch (e) {}
            // إرسال قيمة فارغة للخادم
            logo_path = "";
        }

        const payload = {
            company_name,
            logo_path,
            phone,
            email,
            manager_name,
            manager_phone,
            manager_email,
            legal_name,
            legal_phone,
            legal_email,
            report_footer,
            max_wait_days,
            report_day
        };

        const result = await API.settings.update(payload);
        if (result.status === "success") {
            settings = { ...settings, ...payload };

            const timeouts = { manager_timeout, client_timeout, legal_timeout, client_sign_timeout };
            saveTimeoutSettings(timeouts);
            settings = { ...settings, ...timeouts };

            localStorage.setItem('masar_settings', JSON.stringify(settings));
            showToast("✅ تم حفظ جميع الإعدادات بنجاح", "success");

            isEditMode = true;
            toggleEditMode();
            loadStatistics();
        } else {
            showToast(result.message || "فشل حفظ الإعدادات", "error");
        }
    } catch (err) {
        showToast(err.message || "حدث خطأ أثناء الحفظ", "error");
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-save"></i> حفظ';
        }
    }
}

// ============================================================
// STATISTICS
// ============================================================
async function loadStatistics() {
    try {
        const result = await API.reports.dashboard();
        if (result.status === "success") {
            const data = result.data;
            const setStat = (id, val) => {
                const el = document.getElementById(id);
                if (el) el.textContent = val || 0;
            };
            setStat('statOffers', data.total_offers);
            setStat('statRequests', data.total_requests);
            setStat('statClients', data.total_clients);
            setStat('statUsers', data.total_users);
        }
    } catch (err) {
        console.warn("فشل تحميل الإحصائيات:", err.message);
    }
}

// ============================================================
// BACKUP & RESTORE
// ============================================================
function backupData() {
    const timeouts = loadTimeoutSettings();
    const data = {
        settings: settings,
        propertyTypes: propertyTypes,
        timeouts: timeouts,
        timestamp: new Date().toISOString(),
        version: '2.0'
    };
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `backup_masar_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    showToast("✅ تم تحميل النسخة الاحتياطية", "success");
}

function restoreData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(ev) {
            try {
                const data = JSON.parse(ev.target.result);
                if (data.settings) {
                    settings = data.settings;
                    renderSettings(settings);
                    localStorage.setItem('masar_settings', JSON.stringify(settings));
                }
                if (data.propertyTypes) {
                    propertyTypes = data.propertyTypes;
                    renderPropertyTypes();
                    localStorage.setItem('masar_property_types', JSON.stringify(propertyTypes));
                }
                if (data.timeouts) {
                    saveTimeoutSettings(data.timeouts);
                }
                showToast("✅ تم استعادة الإعدادات بنجاح", "success");
                loadStatistics();
            } catch (err) {
                showToast("ملف غير صالح", "error");
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

function resetSystem() {
    if (!confirm("⚠️ هل أنت متأكد من إعادة تعيين الإعدادات إلى القيم الافتراضية؟")) return;
    settings = getDefaultSettings();
    renderSettings(settings);
    localStorage.setItem('masar_settings', JSON.stringify(settings));
    const defaultTimeouts = { manager_timeout: 2, client_timeout: 3, legal_timeout: 3, client_sign_timeout: 3 };
    saveTimeoutSettings(defaultTimeouts);
    removeLogo();
    showToast("✅ تم إعادة تعيين الإعدادات", "success");
    loadStatistics();
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
            showToast("الرجاء تفعيل وضع التعديل أولاً", "info");
        }
    }
    if (e.key === 'Escape' && isEditMode) {
        toggleEditMode();
    }
});

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', async function() {
    console.log("🔧 بدء تحميل الإعدادات...");
    
    const isAuth = await API.auth.checkAuth(true);
    if (!isAuth) return;

    const main = document.getElementById('mainContent');
    if (main) {
        main.style.display = 'block';
        main.classList.add('visible');
    }

    const savedTheme = localStorage.getItem('masar_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeUI(savedTheme);

    await loadSettings();
    await loadPropertyTypes();
    await loadStatistics();

    isEditMode = false;
    document.querySelectorAll('#settingsForm input, #settingsForm select, #settingsForm textarea').forEach(el => {
        if (el && el.id !== 'newPropertyType' && el.id !== 'logoFileInput') {
            el.disabled = true;
        }
    });
    const newType = document.getElementById('newPropertyType');
    if (newType) newType.disabled = true;
    const addBtn = document.getElementById('addPropertyBtn');
    if (addBtn) addBtn.disabled = true;
    const indicator = document.getElementById('editIndicator');
    if (indicator) indicator.style.display = 'none';
    
    console.log("✅ تم تحميل الإعدادات بنجاح");
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
window.addPropertyType = addPropertyType;
window.deletePropertyType = deletePropertyType;
window.showToast = showToast;
window.loadSettings = loadSettings;
window.loadPropertyTypes = loadPropertyTypes;
window.loadStatistics = loadStatistics;
window.handleLogoUpload = handleLogoUpload;
window.removeLogo = removeLogo;
window.updateLogoPreview = updateLogoPreview;