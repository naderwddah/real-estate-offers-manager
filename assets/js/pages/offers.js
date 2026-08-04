// ============================================================
// assets/js/pages/offers.js - إدارة العروض (دورة حياة كاملة)
// ============================================================

let offers = [];
let currentPage = 1;
const PAGE_SIZE = 6;
let currentEditId = null;
let currentMode = "normal";
let settingsData = {};

// بيانات المراحل والأنواع
let stagesMap = { company: [], personal: [] };
let propertyTypes = [];
let dealTypes = [];

// بيانات الإجراءات القسرية
let forceActionData = {
    offerId: null,
    action: null,
    files: [],
    reminderId: null
};

// ============================================================
// HELPERS
// ============================================================
function formatDate(d) {
    if (!d) return "-";
    try {
        const date = new Date(d);
        if (isNaN(date.getTime())) return d;
        return date.toLocaleDateString("ar-SA", { year: "numeric", month: "short", day: "numeric" });
    } catch (e) { return d; }
}

function formatDateTime(d) {
    if (!d) return "-";
    try {
        const date = new Date(d);
        if (isNaN(date.getTime())) return d;
        return date.toLocaleString("ar-SA", { year: "numeric", month: "short", day: "numeric", hour: '2-digit', minute: '2-digit' });
    } catch (e) { return d; }
}

function formatMoney(n) {
    if (!n && n !== 0) return "—";
    return Number(n).toLocaleString("en-US") + " ريال";
}

function getStageName(stageId, trackType) {
    const stages = stagesMap[trackType] || [];
    const stage = stages.find(s => s.id === stageId);
    return stage ? stage.name : "غير معروف";
}

function getStageColor(stageId, trackType) {
    const stages = stagesMap[trackType] || [];
    const stage = stages.find(s => s.id === stageId);
    return stage ? stage.color : "#9ca3af";
}

function daysBetween(a, b) {
    return Math.round((new Date(b) - new Date(a)) / 86400000);
}

function getPropertyTypeName(id) {
    const pt = propertyTypes.find(p => p.id == id);
    return pt ? pt.name : "-";
}

function getDealTypeName(id) {
    const dt = dealTypes.find(d => d.id == id);
    return dt ? dt.name : "-";
}

function getFinalStageId(trackType) {
    const stages = stagesMap[trackType] || [];
    const final = stages.find(s => s.is_final === 1);
    return final ? final.id : null;
}

// ============================================================
// TOAST
// ============================================================
function showToast(message, type = "success") {
    const toast = document.getElementById("toast");
    const toastMsg = document.getElementById("toastMessage");
    if (!toast || !toastMsg) return;
    toast.className = "toast show " + type;
    toastMsg.textContent = message;
    clearTimeout(toast._hideTimeout);
    toast._hideTimeout = setTimeout(() => toast.classList.remove("show"), 4000);
}

// ============================================================
// SETTINGS
// ============================================================
async function loadSettings() {
    try {
        const result = await API.settings.get();
        if (result.status === "success") {
            settingsData = result.data;
        }
    } catch (e) {
        settingsData = {
            manager_name: "المدير",
            manager_phone: "966500000000",
            manager_email: "",
            legal_name: "الشؤون القانونية",
            legal_phone: "966500000000",
            legal_email: "",
            max_wait_days: 3,
            manager_timeout: 2,
            client_timeout: 3,
            legal_timeout: 3,
            client_sign_timeout: 3
        };
    }
}

// ============================================================
// REMINDER ENGINE (باستخدام API)
// ============================================================
async function checkReminders() {
    try {
        const result = await API.reminders.overdue();
        if (result.status === "success") {
            let overdue = [];
            if (Array.isArray(result.data)) overdue = result.data;
            else if (result.data && Array.isArray(result.data.data)) overdue = result.data.data;
            else overdue = [];
            overdue.forEach(rem => {
                const msg = `🔔 ${rem.note} (العرض: ${rem.offer?.display_id || rem.offer_id})`;
                showToast(msg, "info");
                if ("Notification" in window && Notification.permission === "granted") {
                    new Notification("🔔 تذكير متأخر", { body: rem.note });
                }
                API.reminders.markDone(rem.id).catch(() => {});
            });
        }
    } catch (e) {
        console.warn("فشل فحص التذكيرات:", e.message);
    }
}

async function createReminder(offerId, timeoutDays, note) {
    try {
        const result = await API.reminders.createStageTimeout(offerId, timeoutDays, note);
        if (result.status === "success") {
            return result.data?.id || null;
        }
        return null;
    } catch (e) {
        console.warn("فشل إنشاء تذكير:", e.message);
        return null;
    }
}

async function cancelAllReminders(offerId) {
    try {
        const result = await API.reminders.list({ offer_id: offerId, is_sent: 0 });
        if (result.status === "success") {
            let reminders = [];
            if (Array.isArray(result.data)) reminders = result.data;
            else if (result.data && Array.isArray(result.data.data)) reminders = result.data.data;
            else reminders = [];
            for (const rem of reminders) {
                await API.reminders.markDone(rem.id);
            }
        }
    } catch (e) {
        console.warn("فشل إلغاء التذكيرات:", e.message);
    }
}

// ============================================================
// SMART INPUT
// ============================================================
function parseSmartInput() {
    const text = document.getElementById("smartInput").value;
    const feedback = document.getElementById("smartFeedback");
    if (!text.trim()) {
        feedback.innerHTML = '<span class="error">⚠️ الرجاء لصق رسالة العميل أولاً.</span>';
        feedback.classList.add("show");
        return;
    }

    const pattern = /([^\n:]+):\s*\[([^\]]*)\]/g;
    let match, extracted = {};
    while ((match = pattern.exec(text)) !== null) {
        const key = match[1].trim();
        const value = match[2].trim();
        if (value) extracted[key] = value;
    }

    const fieldMap = {
        "نوع العقار": "f_type",
        "المساحة": "f_area",
        "السعر": "f_price",
        "العنوان": "f_address",
        "رابط الموقع": "f_location",
        "اسم مقدم العرض": "f_providerName",
        "نوع مقدم العرض": "f_providerType",
        "رقم التواصل": "f_phone",
        "نوع الاتفاق": "f_dealType",
        "ملاحظات": "f_notes"
    };

    let filled = 0, missing = [];
    for (const [key, fieldId] of Object.entries(fieldMap)) {
        const el = document.getElementById(fieldId);
        if (!el) continue;
        if (extracted[key] !== undefined && extracted[key] !== "") {
            const val = extracted[key];
            if (el.tagName === "SELECT") {
                const options = Array.from(el.options).map(o => o.value);
                const matched = options.find(o => o.toLowerCase() === val.toLowerCase());
                if (matched) {
                    el.value = matched;
                    filled++;
                } else {
                    missing.push(key);
                }
            } else {
                el.value = val;
                filled++;
            }
        } else {
            missing.push(key);
        }
    }

    let msg = "";
    if (missing.length === 0) {
        msg = `<span class="success">✅ تم ملء جميع الحقول بنجاح (${filled} حقل).</span>`;
    } else {
        msg = `<span class="error">⚠️ الحقول الناقصة: ${missing.join("، ")}. يرجى إكمالها يدوياً.</span>`;
    }
    feedback.innerHTML = msg;
    feedback.classList.add("show");
    if (missing.length === 0) {
        showToast("تم استخراج البيانات بنجاح", "success");
        setMode("normal");
    }
}

function setMode(mode) {
    currentMode = mode;
    document.querySelectorAll(".switch-group button").forEach(b => {
        b.classList.toggle("active", b.dataset.mode === mode);
    });
    document.getElementById("smartArea").classList.toggle("hidden", mode !== "smart");
}

function openMapPicker() {
    window.open("https://www.google.com/maps", "_blank");
    showToast("📌 اختر الموقع على الخريطة، ثم انسخ رابط الصفحة والصقه في حقل الرابط", "info");
}

// ============================================================
// LOAD MASTER DATA
// ============================================================
async function loadMasterData() {
    try {
        const stagesRes = await API.stages.list();
        if (stagesRes.status === "success") {
            let allStages = [];
            if (Array.isArray(stagesRes.data)) {
                allStages = stagesRes.data;
            } else if (stagesRes.data && Array.isArray(stagesRes.data.data)) {
                allStages = stagesRes.data.data;
            } else if (stagesRes.data && Array.isArray(stagesRes.data.stages)) {
                allStages = stagesRes.data.stages;
            } else {
                for (const key in stagesRes.data) {
                    if (Array.isArray(stagesRes.data[key])) {
                        allStages = stagesRes.data[key];
                        break;
                    }
                }
            }
            stagesMap.company = allStages
                .filter(s => s.track_type === "company_offer")
                .sort((a, b) => a.stage_order - b.stage_order);
            stagesMap.personal = allStages
                .filter(s => s.track_type === "personal_offer")
                .sort((a, b) => a.stage_order - b.stage_order);
        }

        try {
            const propRes = await API.propertyTypes.list();
            if (propRes.status === "success") {
                if (Array.isArray(propRes.data)) propertyTypes = propRes.data;
                else if (propRes.data && Array.isArray(propRes.data.data)) propertyTypes = propRes.data.data;
                else propertyTypes = [];
            }
        } catch (e) {
            propertyTypes = [
                { id: 1, name: "أرض" }, { id: 2, name: "محطة وقود" },
                { id: 3, name: "مركز تجاري" }, { id: 4, name: "فيلا" },
                { id: 5, name: "شقة" }, { id: 6, name: "عمارة" },
                { id: 7, name: "مستودع" }, { id: 8, name: "مكتب" }
            ];
        }

        try {
            const dealRes = await API.dealTypes.list();
            if (dealRes.status === "success") {
                if (Array.isArray(dealRes.data)) dealTypes = dealRes.data;
                else if (dealRes.data && Array.isArray(dealRes.data.data)) dealTypes = dealRes.data.data;
                else dealTypes = [];
            }
        } catch (e) {
            dealTypes = [
                { id: 1, name: "بيع" }, { id: 2, name: "إيجار" },
                { id: 3, name: "استثمار" }, { id: 4, name: "مشاركة أرباح" },
                { id: 5, name: "فرنشايز" }
            ];
        }

        populateFormSelects();

    } catch (err) {
        console.warn("فشل تحميل البيانات الأساسية:", err.message);
        propertyTypes = [
            { id: 1, name: "أرض" }, { id: 2, name: "محطة وقود" },
            { id: 3, name: "مركز تجاري" }, { id: 4, name: "فيلا" },
            { id: 5, name: "شقة" }, { id: 6, name: "عمارة" },
            { id: 7, name: "مستودع" }, { id: 8, name: "مكتب" }
        ];
        dealTypes = [
            { id: 1, name: "بيع" }, { id: 2, name: "إيجار" },
            { id: 3, name: "استثمار" }, { id: 4, name: "مشاركة أرباح" },
            { id: 5, name: "فرنشايز" }
        ];
        populateFormSelects();
    }
}

function populateFormSelects() {
    const typeSelect = document.getElementById("f_type");
    if (typeSelect) {
        typeSelect.innerHTML = '<option value="">اختر</option>';
        propertyTypes.forEach(pt => {
            typeSelect.innerHTML += `<option value="${pt.id}">${pt.name}</option>`;
        });
    }
    const dealSelect = document.getElementById("f_dealType");
    if (dealSelect) {
        dealSelect.innerHTML = '<option value="">اختر</option>';
        dealTypes.forEach(dt => {
            dealSelect.innerHTML += `<option value="${dt.id}">${dt.name}</option>`;
        });
    }
    const filterType = document.getElementById("typeFilter");
    if (filterType) {
        filterType.innerHTML = '<option value="all">كل الأنواع</option>';
        propertyTypes.forEach(pt => {
            filterType.innerHTML += `<option value="${pt.id}">${pt.name}</option>`;
        });
    }
}

// ============================================================
// LOAD OFFERS
// ============================================================
async function loadOffers() {
    const isAuth = await API.auth.checkAuth(true);
    if (!isAuth) return;

    try {
        const data = await API.offers.list({ per_page: 100 });
        if (data.status === "success") {
            offers = data.data.data || [];
            renderTable();
            updateStats();
        } else {
            throw new Error(data.message || "فشل تحميل العروض");
        }
    } catch (err) {
        showToast(err.message || "حدث خطأ في تحميل العروض", "error");
        offers = [];
        renderTable();
        updateStats();
    }
}

// ============================================================
// SAVE OFFER (CREATE / UPDATE)
// ============================================================
async function saveOffer() {
    const editId = document.getElementById("editOfferId").value;
    const track = document.getElementById("f_track").value;
    const propertyTypeId = document.getElementById("f_type").value;
    const area = parseFloat(document.getElementById("f_area").value);
    const price = parseFloat(document.getElementById("f_price").value);
    const address = document.getElementById("f_address").value.trim();
    const location = document.getElementById("f_location").value.trim();
    const providerName = document.getElementById("f_providerName").value.trim();
    const providerType = document.getElementById("f_providerType").value;
    const phone = document.getElementById("f_phone").value.trim();
    const dealTypeId = document.getElementById("f_dealType").value;
    const notes = document.getElementById("f_notes").value.trim();

    if (!propertyTypeId || !area || isNaN(area) || !price || isNaN(price) || !address || !location || !providerName || !providerType || !phone || !dealTypeId) {
        showToast("يرجى ملء جميع الحقول المطلوبة (*)", "error");
        return;
    }

    try { new URL(location); } catch (e) {
        showToast("الرجاء إدخال رابط صحيح", "error");
        return;
    }

    let city = address, district = "";
    if (address.includes(" - ")) {
        const parts = address.split(" - ");
        city = parts[0].trim();
        district = parts.slice(1).join(" - ").trim();
    } else if (address.includes("-")) {
        const parts = address.split("-");
        city = parts[0].trim();
        district = parts.slice(1).join("-").trim();
    }

    const payload = {
        track_type: track,
        title: `${getPropertyTypeName(propertyTypeId)} في ${city}`,
        property_type_id: parseInt(propertyTypeId),
        deal_type_id: parseInt(dealTypeId),
        area: area,
        price: price,
        city: city,
        district: district,
        address: address,
        map_url: location,
        description: notes || "",
        contact_name: providerName,
        contact_phone: phone,
        offer_date: new Date().toISOString().slice(0, 10)
    };

    try {
        let result;
        if (editId) {
            result = await API.offers.update(editId, payload);
            if (result.status === "success") {
                showToast("✅ تم تحديث العرض بنجاح", "success");
                closeModal("offerModal");
                loadOffers();
                return;
            }
        } else {
            result = await API.offers.create(payload);
            if (result.status === "success") {
                const newOffer = result.data;
                showToast("✅ تم إضافة العرض بنجاح", "success");
                closeModal("offerModal");
                await loadOffers();

                if (track === "company") {
                    // إنشاء تذكير لمتابعة المدير
                    const reminderNote = `متابعة اعتماد المدير للعرض ${newOffer.display_id || newOffer.id}`;
                    await createReminder(newOffer.id, settingsData.manager_timeout || 2, reminderNote);

                    // فتح واتساب المدير
                    const managerPhone = settingsData.manager_phone || "966500000000";
                    const managerMsg = `📋 *عرض عقاري جديد - ${newOffer.display_id || newOffer.id}*\n` +
                        `🏗️ *النوع:* ${getPropertyTypeName(propertyTypeId)}\n` +
                        `📐 *المساحة:* ${area} م²\n` +
                        `💰 *السعر المبدئي:* ${formatMoney(price)}\n` +
                        `📍 *العنوان:* ${city} - ${district}\n` +
                        `🤝 *نوع الاتفاق:* ${getDealTypeName(dealTypeId)}\n` +
                        `👤 *مقدم العرض:* ${providerName} (${providerType})\n` +
                        `📞 *رقم التواصل:* ${phone}\n` +
                        `📝 *ملاحظات:* ${notes || "لا توجد"}\n\n` +
                        `*يرجى التسعير والتوجيه.*`;
                    window.open(`https://wa.me/${managerPhone}?text=${encodeURIComponent(managerMsg)}`, "_blank");
                    showToast("📤 تم فتح واتساب للمدير", "success");

                    // تغيير المرحلة إلى 2 (سيقوم الباك إند بتعيين sent_to_manager_at تلقائياً)
                    await API.offers.changeStage(newOffer.id, 2, "تم إرسال العرض للمدير للتسعير");

                } else {
                    // عروض شخصية - عرض نافذة مشاركة
                    if (confirm("هل ترغب في مشاركة العرض مع العملاء عبر واتساب؟")) {
                        const shareMsg = `📋 *عرض عقاري جديد*\n` +
                            `🏗️ *النوع:* ${getPropertyTypeName(propertyTypeId)}\n` +
                            `📐 *المساحة:* ${area} م²\n` +
                            `💰 *السعر:* ${formatMoney(price)}\n` +
                            `📍 *العنوان:* ${city} - ${district}\n` +
                            `🤝 *نوع الاتفاق:* ${getDealTypeName(dealTypeId)}\n` +
                            `📝 *ملاحظات:* ${notes || "لا توجد"}\n\n` +
                            `للتفاصيل: ${window.location.origin}/offers-detail.html?id=${newOffer.id}`;
                        window.open(`https://wa.me/?text=${encodeURIComponent(shareMsg)}`, "_blank");
                        showToast("📤 تم فتح واتساب للمشاركة", "success");
                    }
                }
                return;
            }
        }
        throw new Error(result.message || "فشل الحفظ");
    } catch (err) {
        showToast(err.message || "حدث خطأ أثناء الحفظ", "error");
    }
}

// ============================================================
// RENDER FUNCTIONS
// ============================================================
function renderTable() {
    const filtered = getFilteredOffers();
    const total = filtered.length;
    const totalPages = Math.ceil(total / PAGE_SIZE) || 1;
    if (currentPage > totalPages) currentPage = totalPages;
    const start = (currentPage - 1) * PAGE_SIZE;
    const end = Math.min(start + PAGE_SIZE, total);
    const pageItems = filtered.slice(start, end);

    const tbody = document.getElementById("offersTableBody");
    if (pageItems.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center py-12 text-muted"><i class="fas fa-inbox text-3xl block mb-2"></i> لا توجد عروض</td></tr>`;
    } else {
        tbody.innerHTML = pageItems.map(o => {
            const stageName = getStageName(o.current_stage_id, o.track_type);
            const color = getStageColor(o.current_stage_id, o.track_type);
            const isPulse = o.track_type === "company" && [2, 4, 6, 8, 11].includes(o.current_stage_id);
            return `
                <tr class="offer-row border-b border-line" onclick="openDetail('${o.id}')">
                    <td class="px-3 py-3 font-bold text-gold text-sm">${o.display_id || o.id}</td>
                    <td class="px-3 py-3 text-sm text-ink">${o.contact?.name || "-"}</td>
                    <td class="px-3 py-3 text-sm text-ink">${getPropertyTypeName(o.property_type_id)}</td>
                    <td class="px-3 py-3 text-sm max-w-[120px] truncate text-muted" title="${stageName}">${stageName}</td>
                    <td class="px-3 py-3">
                        <span class="status-badge" style="background:${color}22; color:${color}; border:1px solid ${color}55;">
                            <span class="status-dot ${isPulse ? "pulse" : ""}" style="background:${color};"></span>
                            ${stageName}
                        </span>
                    </td>
                    <td class="px-3 py-3 text-sm text-ink">${o.contact?.name || "-"}</td>
                    <td class="px-3 py-3 text-sm text-muted">${formatDate(o.created_at)}</td>
                    <td class="px-3 py-3">
                        <div class="flex items-center gap-1">
                            <button class="text-muted hover:text-gold px-1" onclick="event.stopPropagation(); openDetail('${o.id}')" title="عرض التفاصيل"><i class="fas fa-eye"></i></button>
                            <button class="text-muted hover:text-gold px-1" onclick="event.stopPropagation(); openEditOffer('${o.id}')" title="تعديل"><i class="fas fa-pen"></i></button>
                            <button class="text-muted hover:text-danger px-1" onclick="event.stopPropagation(); deleteOffer('${o.id}')" title="حذف"><i class="fas fa-trash"></i></button>
                        </div>
                    </td>
                </tr>
            `;
        }).join("");
    }

    const cardList = document.getElementById("offersCardList");
    if (pageItems.length === 0) {
        cardList.innerHTML = `<div class="text-center py-12 text-muted"><i class="fas fa-inbox text-3xl block mb-2"></i> لا توجد عروض</div>`;
    } else {
        cardList.innerHTML = pageItems.map(o => {
            const stageName = getStageName(o.current_stage_id, o.track_type);
            const color = getStageColor(o.current_stage_id, o.track_type);
            const isPulse = o.track_type === "company" && [2, 4, 6, 8, 11].includes(o.current_stage_id);
            const maxWait = settingsData.max_wait_days || 3;
            const isDelayed = o.current_stage_id > 1 && o.current_stage_id < (stagesMap[o.track_type]?.length || 10) &&
                daysBetween(o.created_at, new Date().toISOString().slice(0, 10)) >= maxWait;
            const cardClass = isDelayed ? "delayed" : "";
            return `
                <div class="offer-card-item ${cardClass}" onclick="openDetail('${o.id}')">
                    <div class="top-row">
                        <span class="offer-id">${o.display_id || o.id}</span>
                        <span class="status-badge" style="background:${color}22; color:${color}; border:1px solid ${color}55; font-size:0.7rem;">
                            <span class="status-dot ${isPulse ? "pulse" : ""}" style="background:${color};"></span>
                            ${stageName}
                        </span>
                    </div>
                    <div class="offer-meta">
                        <span><i class="far fa-user ml-1"></i> ${o.contact?.name || "-"}</span>
                        <span><i class="fas fa-tag ml-1"></i> ${getPropertyTypeName(o.property_type_id)}</span>
                        <span><i class="fas fa-map-marker-alt ml-1"></i> ${o.city || ""}</span>
                        <span><i class="fas fa-route ml-1"></i> ${stageName}</span>
                    </div>
                    <div style="font-size:0.8rem;color:var(--text-secondary);margin-top:4px">
                        <i class="far fa-calendar ml-1"></i> ${formatDate(o.created_at)}
                        <span style="margin-right:12px"><i class="fas fa-user-tie ml-1"></i> ${o.contact?.name || "-"}</span>
                        ${isDelayed ? '<span style="margin-right:12px;color:var(--danger);">⏰ متأخر</span>' : ""}
                    </div>
                    <div class="offer-actions">
                        <button onclick="event.stopPropagation(); openDetail('${o.id}')"><i class="fas fa-eye"></i> عرض</button>
                        <button onclick="event.stopPropagation(); openEditOffer('${o.id}')"><i class="fas fa-pen"></i> تعديل</button>
                        <button class="danger" onclick="event.stopPropagation(); deleteOffer('${o.id}')"><i class="fas fa-trash"></i> حذف</button>
                    </div>
                </div>
            `;
        }).join("");
    }

    document.getElementById("paginationInfo").textContent = `عرض ${total > 0 ? start + 1 : 0}-${end} من ${total}`;
    const controls = document.getElementById("paginationControls");
    let html = `<button class="px-3 py-1 border border-line rounded-full ${currentPage === 1 ? "opacity-40 cursor-default text-muted" : "text-ink hover:bg-surface2"}" onclick="goPage(${currentPage - 1})"><i class="fas fa-chevron-right"></i></button>`;
    for (let i = 1; i <= totalPages; i++) {
        html += `<button class="px-3 py-1 border border-line rounded-full ${i === currentPage ? "bg-gold text-bg" : "text-ink hover:bg-surface2"}" onclick="goPage(${i})">${i}</button>`;
    }
    html += `<button class="px-3 py-1 border border-line rounded-full ${currentPage === totalPages ? "opacity-40 cursor-default text-muted" : "text-ink hover:bg-surface2"}" onclick="goPage(${currentPage + 1})"><i class="fas fa-chevron-left"></i></button>`;
    controls.innerHTML = html;
}

function getFilteredOffers() {
    const search = document.getElementById("searchInput").value.trim().toLowerCase();
    const type = document.getElementById("typeFilter").value;
    const status = document.getElementById("statusFilter").value;
    const from = document.getElementById("dateFrom").value;
    const to = document.getElementById("dateTo").value;

    return offers.filter(o => {
        if (type !== "all" && o.property_type_id != type) return false;
        if (status !== "all") {
            const stageName = getStageName(o.current_stage_id, o.track_type);
            if (stageName !== status) return false;
        }
        if (search) {
            const displayId = o.display_id || o.id || "";
            const match = displayId.includes(search) ||
                (o.contact?.name || "").includes(search) ||
                (o.city || "").includes(search) ||
                (o.contact?.phone || "").includes(search);
            if (!match) return false;
        }
        if (from && o.created_at && o.created_at.slice(0, 10) < from) return false;
        if (to && o.created_at && o.created_at.slice(0, 10) > to) return false;
        return true;
    });
}

function goPage(p) {
    const filtered = getFilteredOffers();
    const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
    if (p < 1 || p > totalPages) return;
    currentPage = p;
    renderTable();
}

function filterTable() {
    currentPage = 1;
    renderTable();
}

function updateStats() {
    const total = offers.length;
    document.getElementById("totalOffers").textContent = total;
    const pending = offers.filter(o => {
        const stageName = getStageName(o.current_stage_id, o.track_type);
        return stageName.includes("انتظار") || stageName.includes("جديد");
    }).length;
    const completed = offers.filter(o => {
        const stage = stagesMap[o.track_type]?.find(s => s.id === o.current_stage_id);
        return stage?.is_final === 1;
    }).length;
    document.getElementById("pendingOffers").textContent = pending;
    document.getElementById("completedOffers").textContent = completed;
    const land = offers.filter(o => o.property_type_id == 1).length;
    const gas = offers.filter(o => o.property_type_id == 2).length;
    const mall = offers.filter(o => o.property_type_id == 3).length;
    document.getElementById("countLand").textContent = land;
    document.getElementById("countGas").textContent = gas;
    document.getElementById("countMall").textContent = mall;
}

async function deleteOffer(id) {
    if (!confirm(`هل أنت متأكد من حذف العرض؟`)) return;
    try {
        await API.offers.delete(id);
        showToast("✅ تم حذف العرض", "success");
        loadOffers();
    } catch (err) {
        showToast(err.message || "فشل الحذف", "error");
    }
}

// ============================================================
// DETAIL VIEW
// ============================================================
async function openDetail(id) {
    try {
        const result = await API.offers.get(id);
        if (result.status === "success") {
            document.getElementById("listView").classList.add("hidden");
            document.getElementById("detailView").classList.remove("hidden");
            renderDetail(result.data);
        } else {
            showToast(result.message || "العرض غير موجود", "error");
        }
    } catch (err) {
        showToast(err.message || "حدث خطأ", "error");
    }
}

function renderDetail(o) {
    const stageName = getStageName(o.current_stage_id, o.track_type);
    const color = getStageColor(o.current_stage_id, o.track_type);
    const stages = stagesMap[o.track_type] || [];
    const isComplete = stages.find(s => s.id === o.current_stage_id)?.is_final || false;
    const maxWait = settingsData.max_wait_days || 3;
    const isDelayed = o.current_stage_id > 1 && o.current_stage_id < stages.length &&
        daysBetween(o.created_at, new Date().toISOString().slice(0, 10)) >= maxWait;

    let timelineHtml = stages.map((s, idx) => {
        const isCompleted = idx < stages.findIndex(st => st.id === o.current_stage_id);
        const isActive = s.id === o.current_stage_id;
        let dotClass = "pending";
        let lineClass = "pending";
        if (isCompleted) { dotClass = "completed"; lineClass = "completed"; }
        else if (isActive) { dotClass = isDelayed ? "delayed" : "active"; lineClass = isDelayed ? "delayed" : "pending"; }
        return `
            <div class="timeline-item">
                <div style="display:flex;flex-direction:column;align-items:center;padding-top:2px">
                    <div class="timeline-dot ${dotClass}"></div>
                    ${idx < stages.length - 1 ? `<div class="timeline-line ${lineClass}"></div>` : ""}
                </div>
                <div class="timeline-content">
                    <div class="stage-name">${s.name}</div>
                    ${isActive ? `<div class="stage-date">🔵 المرحلة الحالية</div>` : ""}
                    ${isCompleted && s.id === o.current_stage_id ? `<div class="stage-date">✅ تم الإنجاز</div>` : ""}
                </div>
            </div>
        `;
    }).join("");

    let docsHtml = "";
    if (o.attachments && o.attachments.length > 0) {
        docsHtml = o.attachments.map(a => `
            <span class="doc-item">
                ${a.file_name} ✅
                <span class="del" onclick="deleteAttachment('${o.id}','${a.id}')">✕</span>
            </span>
        `).join("");
    } else {
        docsHtml = '<span style="color:var(--text-secondary);">لا توجد مستندات</span>';
    }

    let logHtml = "";
    if (o.log && Array.isArray(o.log) && o.log.length > 0) {
        logHtml = o.log.map(l => {
            const parts = l.split(" - ");
            const time = parts[0] || "";
            const text = parts.slice(1).join(" - ") || l;
            return `
                <div class="log-entry">
                    <span class="log-time">${time}</span>
                    <span>${text}</span>
                </div>
            `;
        }).join("");
    } else {
        logHtml = '<div style="color:var(--text-secondary);">لا توجد سجلات</div>';
    }

    let actionsHtml = "";
    if (!isComplete) {
        if (o.current_stage_id === 1) {
            actionsHtml += `<button class="btn btn-gold btn-sm" onclick="showForceAction('${o.id}','send_to_manager','قم بإرسال العرض للمدير للتسعير.')">📤 إرسال للمدير</button>`;
        } else if (o.current_stage_id === 2) {
            actionsHtml += `<button class="btn btn-gold btn-sm" onclick="showForceAction('${o.id}','record_price','يرجى إدخال السعر المعتمد من المدير.')">💰 تسجيل السعر</button>`;
        } else if (o.current_stage_id === 3 || o.current_stage_id === 4) {
            actionsHtml += `<button class="btn btn-gold btn-sm" onclick="showForceAction('${o.id}','receive_docs','قم بتأكيد استلام المستندات من العميل.')">📄 استلام المستندات</button>`;
        } else if (o.current_stage_id === 5) {
            actionsHtml += `<button class="btn btn-gold btn-sm" onclick="showForceAction('${o.id}','send_to_legal','قم بإرسال المستندات للشؤون القانونية.')">⚖️ إرسال للقانونية</button>`;
        } else if (o.current_stage_id === 6) {
            actionsHtml += `<button class="btn btn-gold btn-sm" onclick="showForceAction('${o.id}','legal_approved','تم اعتماد العقد؟ قم برفعه وإرساله للعميل.')">📄 اعتماد قانوني</button>`;
        } else if (o.current_stage_id === 7 || o.current_stage_id === 8) {
            actionsHtml += `<button class="btn btn-gold btn-sm" onclick="showForceAction('${o.id}','client_signed','تم توقيع العميل؟ قم برفع العقد الموقع.')">📝 توقيع العميل</button>`;
        } else if (o.current_stage_id === 9) {
            actionsHtml += `<button class="btn btn-gold btn-sm" onclick="showForceAction('${o.id}','complete_offer','قم برفع العقد الموقع وإغلاق الصفقة.')">📁 إغلاق الصفقة</button>`;
        } else if (o.current_stage_id === 11) {
            actionsHtml += `<button class="btn btn-gold btn-sm" onclick="changeStage('${o.id}', 10)">✅ إكمال الصفقة</button>`;
        }
        actionsHtml += `<button class="btn btn-outline btn-sm" onclick="openEditOffer('${o.id}')"><i class="fas fa-pen"></i> تعديل</button>`;
        if (o.current_stage_id > 1 && o.current_stage_id !== 11) {
            actionsHtml += `<button class="btn btn-outline btn-sm" onclick="changeStage('${o.id}', ${o.current_stage_id - 1})"><i class="fas fa-undo"></i> رجوع</button>`;
        }
    } else {
        actionsHtml = `<span class="text-emerald-400 font-bold text-lg">✅ الصفقة مكتملة</span>`;
    }

    const docAction = !isComplete ? `<button class="btn btn-outline btn-sm" onclick="addDocument('${o.id}')">+ إضافة مستند</button>` : "";
    const fullAddress = (o.city || '') + ' - ' + (o.district || '');

    const html = `
        <div class="detail-section">
            <div class="flex flex-wrap justify-between items-start gap-4">
                <div>
                    <h2 class="text-2xl font-extrabold text-gold">${o.display_id || o.id} — ${getPropertyTypeName(o.property_type_id)}</h2>
                    <div class="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted">
                        <span><i class="far fa-user ml-1"></i> ${o.contact?.name || "-"}</span>
                        <span><i class="far fa-phone ml-1"></i> ${o.contact?.phone || "-"}</span>
                        <span><i class="far fa-calendar ml-1"></i> ${formatDate(o.created_at)}</span>
                        <span class="status-badge" style="background:${color}22; color:${color}; border:1px solid ${color}55;">
                            <span class="status-dot ${isDelayed ? "pulse" : ""}" style="background:${color};"></span>
                            ${stageName}
                        </span>
                        ${isDelayed ? '<span class="text-danger font-bold text-sm">⏰ متأخر</span>' : ""}
                        <span class="chip ${o.track_type === "company" ? "bg-emeraldSoft text-emerald" : "bg-surface3 text-muted"}">${o.track_type === "company" ? "🏢 شركة" : "👤 شخصي"}</span>
                    </div>
                </div>
                <div class="flex flex-wrap gap-2">${actionsHtml}</div>
            </div>
            ${isDelayed ? `<div class="mt-3 text-danger font-bold bg-dangerSoft/20 p-2 rounded-xl text-sm">⏰ متأخر (أكثر من ${maxWait} أيام)</div>` : ""}
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="detail-section">
                <div class="section-title"><i class="fas fa-info-circle text-gold"></i> معلومات العقار</div>
                <div class="grid grid-cols-2 gap-4">
                    <div><span class="text-sm text-muted">النوع</span><div class="font-bold text-ink">${getPropertyTypeName(o.property_type_id)}</div></div>
                    <div><span class="text-sm text-muted">المساحة</span><div class="font-bold text-ink">${o.area || "-"} م²</div></div>
                    <div class="col-span-2"><span class="text-sm text-muted">العنوان</span><div class="font-bold text-ink">${fullAddress}</div></div>
                    <div><span class="text-sm text-muted">نوع الاتفاق</span><div class="font-bold text-ink">${getDealTypeName(o.deal_type_id)}</div></div>
                    <div><span class="text-sm text-muted">السعر</span><div class="font-bold text-gold">${formatMoney(o.price)}</div></div>
                    <div class="col-span-2"><span class="text-sm text-muted">الموقع</span><div class="text-sm break-all"><a href="${o.map_url || "#"}" target="_blank" class="text-gold underline">${o.map_url || "-"}</a></div></div>
                    <div class="col-span-2"><span class="text-sm text-muted">ملاحظات</span><div class="text-sm text-ink">${o.description || "-"}</div></div>
                </div>
            </div>

            <div class="detail-section">
                <div class="section-title"><i class="fas fa-user-tie text-gold"></i> مقدم العرض</div>
                <div class="space-y-2">
                    <div><span class="text-sm text-muted">الاسم</span><div class="font-bold text-ink">${o.contact?.name || "-"}</div></div>
                    <div><span class="text-sm text-muted">النوع</span><div class="text-ink">${o.contact?.type || "-"}</div></div>
                    <div><span class="text-sm text-muted">رقم الجوال</span><div class="text-ink">${o.contact?.phone || "-"}</div></div>
                </div>
            </div>
        </div>

        <div class="detail-section">
            <div class="section-title"><i class="fas fa-route text-gold"></i> مسار الصفقة</div>
            <div class="timeline">${timelineHtml}</div>
        </div>

        <div class="detail-section">
            <div class="section-title"><i class="fas fa-file-alt text-gold"></i> المستندات ${docAction}</div>
            <div class="flex flex-wrap gap-2">${docsHtml}</div>
        </div>

        <div class="detail-section">
            <div class="section-title"><i class="fas fa-history text-gold"></i> سجل النشاط</div>
            <div class="max-h-60 overflow-y-auto">${logHtml}</div>
        </div>
    `;

    document.getElementById("detailContent").innerHTML = html;
}

function closeDetail() {
    document.getElementById("detailView").classList.add("hidden");
    document.getElementById("listView").classList.remove("hidden");
    renderTable();
}

// ============================================================
// STAGE ACTIONS
// ============================================================
async function changeStage(id, newStageId) {
    if (!confirm(`هل أنت متأكد من تغيير المرحلة؟`)) return;
    try {
        const result = await API.offers.changeStage(id, newStageId, "تم التغيير بواسطة المستخدم");
        if (result.status === "success") {
            showToast(`✅ تم تغيير المرحلة بنجاح`, "success");
            loadOffers();
            if (!document.getElementById("detailView").classList.contains("hidden")) {
                openDetail(id);
            }
        } else {
            showToast(result.message || "فشل تغيير المرحلة", "error");
        }
    } catch (err) {
        showToast(err.message || "حدث خطأ", "error");
    }
}

// ============================================================
// FORCE ACTION MODAL
// ============================================================
function showForceAction(offerId, actionType, message) {
    const modal = document.getElementById("forceActionModal");
    const title = document.getElementById("forceActionTitle");
    const msg = document.getElementById("forceActionMessage");
    const body = document.getElementById("forceActionBody");
    const primaryBtn = document.getElementById("forceActionPrimaryBtn");

    forceActionData.offerId = offerId;
    forceActionData.action = actionType;
    forceActionData.files = [];

    let titleText = "📢 إجراء مطلوب";
    let messageText = message || "يرجى تنفيذ الخطوة التالية لإكمال العملية.";
    let bodyHtml = "";
    let btnText = "تأكيد";

    switch (actionType) {
        case "send_to_manager":
            titleText = "📤 إرسال للمدير";
            messageText = "سيتم فتح واتساب لإرسال تفاصيل العرض للمدير للتسعير.";
            bodyHtml = `
                <p style="margin-bottom:12px;">سيتم فتح واتساب مع <strong style="color:var(--gold);">المدير</strong> لإرسال تفاصيل العرض.</p>
                <div style="background:var(--bg-primary);border:1px solid var(--emerald);border-radius:12px;padding:12px;margin-bottom:12px;">
                    <p style="font-size:0.9rem;color:var(--emerald);"><i class="fas fa-clock ml-1"></i> سيتم تسجيل تاريخ الإرسال، وفي حال تأخر المدير ${settingsData.manager_timeout || 2} أيام سيصلك تنبيه.</p>
                </div>
            `;
            btnText = "📤 إرسال للمدير";
            break;

        case "record_price":
            titleText = "💰 تسجيل السعر المعتمد";
            messageText = "يرجى إدخال السعر المعتمد من المدير:";
            bodyHtml = `
                <div class="field" style="margin-bottom:12px;">
                    <label>السعر الحالي (ريال)</label>
                    <input type="number" id="forceOldPrice" class="w-full border-2 border-line rounded-xl px-4 py-2.5" readonly style="background:var(--input-bg);color:var(--text-secondary);" />
                </div>
                <div class="field" style="margin-bottom:12px;">
                    <label>السعر المعتمد الجديد (ريال) *</label>
                    <input type="number" id="forcePriceInput" class="w-full border-2 border-line rounded-xl px-4 py-2.5" placeholder="أدخل السعر..." style="background:var(--input-bg);color:var(--text-primary);" />
                </div>
                <div class="field">
                    <label>ملاحظات المدير</label>
                    <textarea id="forcePriceNotes" rows="2" style="width:100%;border:2px solid var(--border-light);border-radius:12px;padding:10px;font-size:0.9rem;font-family:'Tajawal',sans-serif;background:var(--input-bg);color:var(--text-primary);" placeholder="أي ملاحظات إضافية..."></textarea>
                </div>
                <div style="margin-top:12px;background:var(--bg-primary);border:1px solid var(--emerald);border-radius:12px;padding:12px;">
                    <p style="font-size:0.9rem;color:var(--emerald);"><i class="fas fa-clock ml-1"></i> بعد الحفظ، سيتم فتح واتساب لإبلاغ العميل بالسعر الجديد.</p>
                </div>
            `;
            btnText = "💰 تسجيل السعر وإبلاغ العميل";
            break;

        case "receive_docs":
            titleText = "📄 استلام مستندات العميل";
            messageText = "يرجى رفع المستندات التي استلمتها من العميل:";
            bodyHtml = `
                <div class="file-upload-area" onclick="document.getElementById('forceFileInput').click()" style="background:var(--input-bg);">
                    📎 اضغط لرفع المستندات
                </div>
                <input type="file" id="forceFileInput" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" multiple style="display:none" onchange="forceActionFilesSelected(this)" />
                <div id="forceFileList" style="margin-top:8px;font-size:0.85rem;color:var(--text-secondary);"></div>
                <div class="field" style="margin-top:12px;">
                    <label>ملاحظات الاتفاق مع العميل</label>
                    <textarea id="forceClientNotes" rows="2" style="width:100%;border:2px solid var(--border-light);border-radius:12px;padding:10px;font-size:0.9rem;font-family:'Tajawal',sans-serif;background:var(--input-bg);color:var(--text-primary);" placeholder="أي ملاحظات تم الاتفاق عليها مع العميل..."></textarea>
                </div>
                <div style="margin-top:12px;background:var(--bg-primary);border:1px solid var(--emerald);border-radius:12px;padding:12px;">
                    <p style="font-size:0.9rem;color:var(--emerald);"><i class="fas fa-clock ml-1"></i> في حال تأخر العميل ${settingsData.client_timeout || 4} أيام سيصلك تنبيه.</p>
                </div>
            `;
            btnText = "✅ استلام المستندات";
            break;

        case "send_to_legal":
            titleText = "⚖️ إرسال للشؤون القانونية";
            messageText = "سيتم فتح واتساب لإرسال المستندات للشؤون القانونية للمراجعة.";
            bodyHtml = `
                <p style="margin-bottom:12px;">سيتم فتح واتساب مع <strong style="color:var(--gold);">${settingsData.legal_name || "الشؤون القانونية"}</strong> لإرسال العقد للمراجعة.</p>
                <div style="background:var(--bg-primary);border:1px solid var(--emerald);border-radius:12px;padding:12px;">
                    <p style="font-size:0.9rem;color:var(--emerald);"><i class="fas fa-clock ml-1"></i> سيتم تسجيل تاريخ الإرسال، وفي حال تأخر الموظف ${settingsData.legal_timeout || 3} أيام سيصلك تنبيه.</p>
                </div>
            `;
            btnText = "📤 إرسال للشؤون القانونية";
            break;

        case "legal_approved":
            titleText = "✅ اعتماد الشؤون القانونية";
            messageText = "تم اعتماد العقد من الشؤون القانونية، يرجى رفع العقد النهائي:";
            bodyHtml = `
                <div class="file-upload-area" onclick="document.getElementById('forceFileInput').click()" style="background:var(--input-bg);">
                    📎 اضغط لرفع العقد النهائي المعتمد
                </div>
                <input type="file" id="forceFileInput" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" style="display:none" onchange="forceActionFilesSelected(this)" />
                <div id="forceFileList" style="margin-top:8px;font-size:0.85rem;color:var(--text-secondary);"></div>
                <div style="margin-top:12px;background:var(--bg-primary);border:1px solid var(--emerald);border-radius:12px;padding:12px;">
                    <p style="font-size:0.9rem;color:var(--emerald);"><i class="fas fa-share-alt ml-1"></i> بعد الرفع سيتم فتح واتساب لإرسال العقد للعميل للتوقيع.</p>
                </div>
            `;
            btnText = "📤 رفع العقد وإرسال للعميل";
            break;

        case "client_signed":
            titleText = "📝 توقيع العميل على العقد";
            messageText = "تم توقيع العميل على العقد، يرجى رفع العقد الموقع:";
            bodyHtml = `
                <div class="file-upload-area" onclick="document.getElementById('forceFileInput').click()" style="background:var(--input-bg);">
                    📎 اضغط لرفع العقد الموقع من العميل
                </div>
                <input type="file" id="forceFileInput" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" style="display:none" onchange="forceActionFilesSelected(this)" />
                <div id="forceFileList" style="margin-top:8px;font-size:0.85rem;color:var(--text-secondary);"></div>
                <div style="margin-top:12px;background:var(--bg-primary);border:1px solid var(--emerald);border-radius:12px;padding:12px;">
                    <p style="font-size:0.9rem;color:var(--emerald);"><i class="fas fa-share-alt ml-1"></i> بعد الرفع سيتم إرسال العقد الموقع للشؤون القانونية وإغلاق الصفقة.</p>
                </div>
            `;
            btnText = "📁 رفع العقد الموقع وإغلاق الصفقة";
            break;

        case "complete_offer":
            titleText = "📁 إكمال الصفقة";
            messageText = "يرجى رفع العقد النهائي الموقع لإتمام الصفقة:";
            bodyHtml = `
                <div class="file-upload-area" onclick="document.getElementById('forceFileInput').click()" style="background:var(--input-bg);">
                    📎 اضغط لرفع العقد الموقع النهائي
                </div>
                <input type="file" id="forceFileInput" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" style="display:none" onchange="forceActionFilesSelected(this)" />
                <div id="forceFileList" style="margin-top:8px;font-size:0.85rem;color:var(--text-secondary);"></div>
                <div style="margin-top:12px;background:var(--bg-primary);border:1px solid var(--emerald);border-radius:12px;padding:12px;">
                    <p style="font-size:0.9rem;color:var(--emerald);"><i class="fas fa-check-circle ml-1"></i> سيتم إغلاق الصفقة وإرسال نسخة للشؤون القانونية.</p>
                </div>
            `;
            btnText = "📁 إكمال وإغلاق الصفقة";
            break;

        default:
            bodyHtml = '<p class="text-muted">لا توجد تفاصيل إضافية.</p>';
    }

    title.textContent = titleText;
    msg.textContent = messageText;
    body.innerHTML = bodyHtml;
    primaryBtn.textContent = btnText;

    if (actionType === "record_price") {
        const offer = offers.find(o => o.id == offerId);
        if (offer) {
            document.getElementById("forceOldPrice").value = offer.price || 0;
        }
    }

    primaryBtn.onclick = function() {
        executeForceAction();
    };

    modal.classList.add("active");
}

function forceActionFilesSelected(input) {
    const files = input.files;
    const list = document.getElementById("forceFileList");
    if (!list) return;
    let html = "";
    for (let i = 0; i < files.length; i++) {
        html += `<div style="display:inline-block;background:var(--input-bg);border:1px solid var(--border-light);border-radius:6px;padding:4px 12px;margin:4px;font-size:0.8rem;color:var(--text-primary);">
            📎 ${files[i].name}
        </div>`;
        forceActionData.files.push(files[i]);
    }
    list.innerHTML = html;
}

async function executeForceAction() {
    const offerId = forceActionData.offerId;
    const action = forceActionData.action;

    if (!offerId) {
        showToast("لم يتم تحديد العرض", "error");
        return;
    }

    try {
        const offerResult = await API.offers.get(offerId);
        if (offerResult.status !== "success") {
            showToast("العرض غير موجود", "error");
            closeModal("forceActionModal");
            return;
        }
        const offer = offerResult.data;
        const now = new Date().toISOString();

        switch (action) {
            case "send_to_manager": {
                await API.offers.changeStage(offerId, 2, "تم إرسال العرض للمدير للتسعير");
                // الباك إند سيقوم بتعيين sent_to_manager_at تلقائياً
                showToast("📤 تم إرسال العرض للمدير", "success");
                closeModal("forceActionModal");
                loadOffers();
                openDetail(offerId);
                break;
            }

            case "record_price": {
                const priceInput = document.getElementById("forcePriceInput");
                if (!priceInput || !priceInput.value || parseFloat(priceInput.value) <= 0) {
                    showToast("الرجاء إدخال سعر صحيح", "error");
                    return;
                }
                const newPrice = parseFloat(priceInput.value);
                const notes = document.getElementById("forcePriceNotes")?.value || "";

                // تحديث السعر
                await API.offers.update(offerId, { 
                    price: newPrice,
                    manager_notes: notes
                });
                // تغيير المرحلة (الباك إند سيعين manager_response_at)
                await API.offers.changeStage(offerId, 3, `تم تحديد السعر: ${formatMoney(newPrice)} - ${notes}`);

                // إلغاء تذكير المدير
                await cancelAllReminders(offerId);

                showToast(`✅ تم تسجيل السعر: ${formatMoney(newPrice)}`, "success");

                // فتح واتساب العميل
                const clientPhone = offer.contact?.phone || "966500000000";
                const clientMsg = `📋 بخصوص العرض ${offer.display_id || offer.id} - ${getPropertyTypeName(offer.property_type_id)}\n📍 ${offer.city} - ${offer.district}\n💰 السعر المعتمد: ${formatMoney(newPrice)}\nيرجى الرد لتأكيد الاستلام.`;
                window.open(`https://wa.me/${clientPhone}?text=${encodeURIComponent(clientMsg)}`, "_blank");
                showToast("📱 تم فتح واتساب للعميل لإبلاغه بالسعر", "success");

                // إنشاء تذكير لمتابعة العميل
                await createReminder(offerId, settingsData.client_timeout || 3, `متابعة رد العميل على العرض ${offer.display_id || offer.id}`);

                closeModal("forceActionModal");
                loadOffers();
                openDetail(offerId);
                break;
            }

            case "receive_docs": {
                await API.offers.changeStage(offerId, 5, "تم استلام المستندات من العميل");
                for (const file of forceActionData.files) {
                    await API.attachments.uploadOffer(offerId, file, "مستند");
                }
                showToast("✅ تم استلام المستندات", "success");
                
                const legalEmail = settingsData.legal_email || "legal@masar.sa";
                const subject = encodeURIComponent(`مستندات العرض ${offer.display_id || offer.id}`);
                const body = encodeURIComponent(`الرجاء مراجعة مستندات العرض وإعداد العقد.\n\nرابط العرض: ${window.location.origin}/offers-detail.html?id=${offerId}`);
                window.open(`mailto:${legalEmail}?subject=${subject}&body=${body}`, "_blank");
                showToast("📧 تم فتح البريد الإلكتروني للشؤون القانونية", "success");

                closeModal("forceActionModal");
                loadOffers();
                openDetail(offerId);
                break;
            }

            case "send_to_legal": {
                await API.offers.changeStage(offerId, 6, "تم إرسال المستندات للشؤون القانونية");
                // الباك إند سيعين legal_review_at تلقائياً
                showToast("📤 تم إرسال المستندات للشؤون القانونية", "success");

                await createReminder(offerId, settingsData.legal_timeout || 3, `متابعة إعداد العقد للعرض ${offer.display_id || offer.id}`);

                const legalPhone = settingsData.legal_phone || "966500000000";
                const legalMsg = `⚖️ مستندات العرض ${offer.display_id || offer.id} - ${getPropertyTypeName(offer.property_type_id)}\nالموقع: ${offer.city} - ${offer.district}\nيرجى المراجعة القانونية وإصدار العقد.`;
                window.open(`https://wa.me/${legalPhone}?text=${encodeURIComponent(legalMsg)}`, "_blank");
                showToast("📤 تم فتح واتساب للشؤون القانونية", "success");

                closeModal("forceActionModal");
                loadOffers();
                openDetail(offerId);
                break;
            }

            case "legal_approved": {
                for (const file of forceActionData.files) {
                    await API.attachments.uploadOffer(offerId, file, "عقد");
                }
                await API.offers.changeStage(offerId, 7, "تم اعتماد العقد من الشؤون القانونية");
                // الباك إند سيعين contract_sent_at و legal_status تلقائياً
                await cancelAllReminders(offerId);
                showToast("✅ تم اعتماد العقد ورفعه", "success");

                const clientPhone2 = offer.contact?.phone || "966500000000";
                const clientMsg2 = `📋 بخصوص العرض ${offer.display_id || offer.id} - ${getPropertyTypeName(offer.property_type_id)}\n📍 ${offer.city} - ${offer.district}\n📄 تم الانتهاء من العقد النهائي، يرجى مراجعته وتوقيعه.`;
                window.open(`https://wa.me/${clientPhone2}?text=${encodeURIComponent(clientMsg2)}`, "_blank");
                showToast("📱 تم فتح واتساب للعميل لإرسال العقد", "success");

                await createReminder(offerId, settingsData.client_sign_timeout || 3, `متابعة توقيع العميل على العقد ${offer.display_id || offer.id}`);

                closeModal("forceActionModal");
                loadOffers();
                openDetail(offerId);
                break;
            }

            case "client_signed":
            case "complete_offer": {
                for (const file of forceActionData.files) {
                    await API.attachments.uploadOffer(offerId, file, "عقد موقع");
                }
                const finalStageId = getFinalStageId(offer.track_type || "company");
                await API.offers.changeStage(offerId, finalStageId || 11, "تم توقيع العميل على العقد وإتمام الصفقة");
                // الباك إند سيعين contract_signed_at, completed_at, is_closed تلقائياً
                await cancelAllReminders(offerId);
                showToast("🎉 تم إتمام الصفقة بنجاح!", "success");

                const legalEmail2 = settingsData.legal_email || "legal@masar.sa";
                const subject2 = encodeURIComponent(`العقد الموقع - العرض ${offer.display_id || offer.id}`);
                const body2 = encodeURIComponent(`تم توقيع العقد من قبل العميل للعرض ${offer.display_id || offer.id}.\n\nيرجى أرشفة الملفات.`);
                window.open(`mailto:${legalEmail2}?subject=${subject2}&body=${body2}`, "_blank");
                showToast("📧 تم فتح البريد الإلكتروني للشؤون القانونية", "success");

                closeModal("forceActionModal");
                loadOffers();
                openDetail(offerId);
                break;
            }

            default:
                showToast("إجراء غير معروف", "error");
                closeModal("forceActionModal");
        }
    } catch (err) {
        showToast(err.message || "حدث خطأ أثناء تنفيذ الإجراء", "error");
        closeModal("forceActionModal");
    }
}

// ============================================================
// DOCUMENTS
// ============================================================
async function deleteAttachment(offerId, attachmentId) {
    if (!confirm("هل أنت متأكد من حذف هذا المرفق؟")) return;
    try {
        await API.attachments.deleteOffer(offerId, attachmentId);
        showToast("✅ تم حذف المرفق", "success");
        openDetail(offerId);
    } catch (err) {
        showToast(err.message || "فشل الحذف", "error");
    }
}

function addDocument(id) {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf,.jpg,.jpeg,.png,.doc,.docx";
    input.onchange = async function(e) {
        const file = e.target.files[0];
        if (!file) return;
        const docType = prompt("نوع المستند (صورة/مخطط/صك/وكالة/عقد/سجل تجاري/ترخيص/أخرى):", "صورة");
        if (!docType) return;
        try {
            await API.attachments.uploadOffer(id, file, docType);
            showToast("✅ تم رفع الملف", "success");
            openDetail(id);
        } catch (err) {
            showToast(err.message || "فشل الرفع", "error");
        }
    };
    input.click();
}

// ============================================================
// MODAL
// ============================================================
function openAddOffer() {
    currentEditId = null;
    document.getElementById("modalTitle").textContent = "عرض جديد";
    document.getElementById("editOfferId").value = "";
    document.getElementById("offerForm").reset();
    document.getElementById("f_track").value = "company";
    document.getElementById("f_type").value = "";
    document.getElementById("f_dealType").value = "";
    document.getElementById("f_providerType").value = "";
    document.getElementById("f_address").value = "";
    document.getElementById("f_location").value = "";
    document.getElementById("f_price").value = "";
    document.getElementById("smartInput").value = "";
    document.getElementById("smartFeedback").classList.remove("show");
    setMode("normal");
    document.getElementById("offerModal").classList.add("active");
}

async function openEditOffer(id) {
    try {
        const result = await API.offers.get(id);
        if (result.status !== "success") {
            showToast(result.message || "العرض غير موجود", "error");
            return;
        }
        const o = result.data;
        currentEditId = id;
        document.getElementById("modalTitle").textContent = "تعديل العرض";
        document.getElementById("editOfferId").value = id;
        document.getElementById("f_track").value = o.track_type || "company";
        document.getElementById("f_type").value = o.property_type_id || "";
        document.getElementById("f_area").value = o.area || "";
        document.getElementById("f_price").value = o.price || "";
        document.getElementById("f_address").value = (o.city || "") + " - " + (o.district || "");
        document.getElementById("f_location").value = o.map_url || "";
        document.getElementById("f_providerName").value = o.contact?.name || "";
        document.getElementById("f_providerType").value = o.contact?.type || "";
        document.getElementById("f_phone").value = o.contact?.phone || "";
        document.getElementById("f_dealType").value = o.deal_type_id || "";
        document.getElementById("f_notes").value = o.description || "";
        document.getElementById("smartInput").value = "";
        document.getElementById("smartFeedback").classList.remove("show");
        setMode("normal");
        document.getElementById("offerModal").classList.add("active");
    } catch (err) {
        showToast(err.message || "حدث خطأ", "error");
    }
}

function closeModal(id) {
    document.getElementById(id).classList.remove("active");
    if (id === "forceActionModal") {
        forceActionData = { offerId: null, action: null, files: [] };
    }
}

// ============================================================
// EXPORT
// ============================================================
function exportExcel() {
    if (offers.length === 0) {
        showToast("لا توجد بيانات", "error");
        return;
    }
    const headers = ["رقم العرض", "العميل", "نوع العقار", "العنوان", "نوع الاتفاق", "مقدم العرض", "رقم التواصل", "المساحة", "السعر", "المرحلة", "الحالة", "التاريخ", "ملاحظات"];
    const rows = offers.map(o => {
        const stageName = getStageName(o.current_stage_id, o.track_type);
        const fullAddress = (o.city || "") + " - " + (o.district || "");
        return [
            o.display_id || o.id,
            o.contact?.name || "",
            getPropertyTypeName(o.property_type_id),
            fullAddress,
            getDealTypeName(o.deal_type_id),
            o.contact?.name || "",
            o.contact?.phone || "",
            o.area || 0,
            o.price || 0,
            stageName,
            stageName,
            o.created_at,
            o.description || ""
        ];
    });
    let csv = "\uFEFF" + headers.join(",") + "\n";
    rows.forEach(r => {
        csv += r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",") + "\n";
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `تقرير_العروض_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    showToast("✅ تم تصدير التقرير", "success");
}

// ============================================================
// KEYBOARD SHORTCUTS
// ============================================================
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        document.querySelectorAll(".modal-overlay.active").forEach(el => el.classList.remove("active"));
        if (!document.getElementById("detailView").classList.contains("hidden")) closeDetail();
    }
    if ((e.ctrlKey || e.metaKey) && e.key === "n") {
        e.preventDefault();
        openAddOffer();
    }
});

// ============================================================
// INIT
// ============================================================
document.addEventListener("DOMContentLoaded", async function() {
    const isAuth = await API.auth.checkAuth(true);
    if (isAuth) {
        const main = document.getElementById("mainContent");
        if (main) {
            main.style.display = "block";
            main.classList.add("visible");
        }
        await loadSettings();
        await loadMasterData();
        await loadOffers();
        await checkReminders();
        setInterval(checkReminders, 60000);
        if ("Notification" in window && Notification.permission === "default") {
            Notification.requestPermission();
        }
    }
});

// ============================================================
// EXPOSE GLOBALS
// ============================================================
window.openAddOffer = openAddOffer;
window.openEditOffer = openEditOffer;
window.closeModal = closeModal;
window.saveOffer = saveOffer;
window.deleteOffer = deleteOffer;
window.openDetail = openDetail;
window.closeDetail = closeDetail;
window.changeStage = changeStage;
window.filterTable = filterTable;
window.goPage = goPage;
window.exportExcel = exportExcel;
window.showToast = showToast;
window.setMode = setMode;
window.parseSmartInput = parseSmartInput;
window.openMapPicker = openMapPicker;
window.showForceAction = showForceAction;
window.executeForceAction = executeForceAction;
window.addDocument = addDocument;
window.deleteAttachment = deleteAttachment;
window.loadOffers = loadOffers;
window.forceActionFilesSelected = forceActionFilesSelected;
window.checkReminders = checkReminders;
window.cancelAllReminders = cancelAllReminders;