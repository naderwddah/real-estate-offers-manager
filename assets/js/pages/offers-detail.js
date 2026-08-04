// ============================================================
// assets/js/pages/offers-detail.js - تفاصيل العرض (نسخة معتمدة على API)
// ============================================================

let currentOfferId = null;
let currentOfferData = null;
let forceActionData = { offerId: null, action: null, files: [] };

// بيانات النظام الأساسية
let stagesMap = { company: [], personal: [] };
let propertyTypes = [];
let dealTypes = [];
let settings = {};

// متغير لتخزين معرف التذكير المرتبط بالإجراء الحالي
let pendingReminderId = null;

// ============================================================
// HELPERS
// ============================================================
function getStageName(stageId, trackType) {
    const stages = stagesMap[trackType] || [];
    const stage = stages.find(s => s.id === stageId);
    return stage ? stage.name : 'غير معروف';
}

function getStageColor(stageId, trackType) {
    const stages = stagesMap[trackType] || [];
    const stage = stages.find(s => s.id === stageId);
    return stage ? stage.color : '#9ca3af';
}

function getPropertyTypeName(id) {
    const pt = propertyTypes.find(p => p.id == id);
    return pt ? pt.name : '-';
}

function getDealTypeName(id) {
    const dt = dealTypes.find(d => d.id == id);
    return dt ? dt.name : '-';
}

function formatDate(d) {
    if (!d) return '-';
    try {
        const date = new Date(d);
        if (isNaN(date.getTime())) return d;
        return date.toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (e) {
        return d;
    }
}

function formatDateTime(d) {
    if (!d) return '-';
    try {
        const date = new Date(d);
        if (isNaN(date.getTime())) return d;
        return date.toLocaleString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch (e) {
        return d;
    }
}

function formatMoney(n) {
    if (!n && n !== 0) return '—';
    return Number(n).toLocaleString('en-US') + ' ريال';
}

function daysBetween(a, b) {
    return Math.round((new Date(b) - new Date(a)) / 86400000);
}

function goBack() {
    window.history.back();
}

function getFinalStageId(trackType) {
    const stages = stagesMap[trackType] || [];
    const final = stages.find(s => s.is_final === 1);
    return final ? final.id : null;
}

function getStageSelectOptions(trackType) {
    const stages = stagesMap[trackType] || [];
    return stages.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
}

// ============================================================
// TOAST
// ============================================================
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toastMessage');
    if (!toast || !toastMsg) return;
    const icon = toast.querySelector('i');
    if (type === 'success') icon.className = 'fas fa-check-circle text-emerald-400';
    else if (type === 'error') icon.className = 'fas fa-exclamation-circle text-red-400';
    else icon.className = 'fas fa-info-circle text-blue-400';
    toast.className = 'toast show ' + type;
    toastMsg.textContent = message;
    clearTimeout(toast._hideTimeout);
    toast._hideTimeout = setTimeout(() => toast.classList.remove('show'), 4500);
}

// ============================================================
// LOAD MASTER DATA
// ============================================================
async function loadMasterData() {
    try {
        // 1. جلب المراحل
        const stagesRes = await API.stages.list();
        if (stagesRes.status === 'success') {
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
                .filter(s => s.track_type === 'company_offer')
                .sort((a, b) => a.stage_order - b.stage_order);
            stagesMap.personal = allStages
                .filter(s => s.track_type === 'personal_offer')
                .sort((a, b) => a.stage_order - b.stage_order);
        }

        // 2. جلب أنواع العقارات
        try {
            const propRes = await API.propertyTypes.list();
            if (propRes.status === 'success') {
                if (Array.isArray(propRes.data)) propertyTypes = propRes.data;
                else if (propRes.data && Array.isArray(propRes.data.data)) propertyTypes = propRes.data.data;
                else propertyTypes = [];
            }
        } catch (e) {
            propertyTypes = [
                { id: 1, name: 'أرض' }, { id: 2, name: 'محطة وقود' },
                { id: 3, name: 'مركز تجاري' }, { id: 4, name: 'فيلا' },
                { id: 5, name: 'شقة' }, { id: 6, name: 'عمارة' },
                { id: 7, name: 'مستودع' }, { id: 8, name: 'مكتب' }
            ];
        }

        // 3. جلب أنواع الاتفاقات
        try {
            const dealRes = await API.dealTypes.list();
            if (dealRes.status === 'success') {
                if (Array.isArray(dealRes.data)) dealTypes = dealRes.data;
                else if (dealRes.data && Array.isArray(dealRes.data.data)) dealTypes = dealRes.data.data;
                else dealTypes = [];
            }
        } catch (e) {
            dealTypes = [
                { id: 1, name: 'بيع' }, { id: 2, name: 'إيجار' },
                { id: 3, name: 'استثمار' }, { id: 4, name: 'مشاركة أرباح' },
                { id: 5, name: 'فرنشايز' }
            ];
        }

        // 4. جلب الإعدادات
        try {
            const settingsRes = await API.settings.get();
            if (settingsRes.status === 'success' && settingsRes.data) {
                settings = settingsRes.data;
            } else {
                settings = getDefaultSettings();
            }
        } catch (e) {
            settings = getDefaultSettings();
        }

    } catch (err) {
        console.warn('فشل تحميل البيانات الأساسية:', err.message);
        // بيانات افتراضية
        propertyTypes = [
            { id: 1, name: 'أرض' }, { id: 2, name: 'محطة وقود' },
            { id: 3, name: 'مركز تجاري' }, { id: 4, name: 'فيلا' },
            { id: 5, name: 'شقة' }, { id: 6, name: 'عمارة' },
            { id: 7, name: 'مستودع' }, { id: 8, name: 'مكتب' }
        ];
        dealTypes = [
            { id: 1, name: 'بيع' }, { id: 2, name: 'إيجار' },
            { id: 3, name: 'استثمار' }, { id: 4, name: 'مشاركة أرباح' },
            { id: 5, name: 'فرنشايز' }
        ];
        settings = getDefaultSettings();
    }
}

function getDefaultSettings() {
    return {
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
        report_footer: '',
        max_wait_days: 3,
        report_day: 4,
        manager_timeout: 2,
        client_timeout: 3,
        legal_timeout: 3,
        client_sign_timeout: 3
    };
}

// ============================================================
// LOAD OFFER DETAIL
// ============================================================
async function loadOfferDetail() {
    const isAuth = await API.auth.checkAuth(true);
    if (!isAuth) return;

    const params = new URLSearchParams(window.location.search);
    const offerId = params.get('id');

    if (!offerId) {
        document.getElementById('loadingState').style.display = 'none';
        document.getElementById('detailContent').style.display = 'block';
        document.getElementById('detailContent').innerHTML = `
            <div class="text-center py-12 text-muted">
                <i class="fas fa-exclamation-circle text-4xl block mb-4"></i>
                <p>لم يتم تحديد رقم العرض</p>
                <button class="btn btn-gold mt-4" onclick="goBack()">العودة للقائمة</button>
            </div>
        `;
        return;
    }

    currentOfferId = offerId;

    try {
        // جلب تفاصيل العرض
        const result = await API.offers.get(offerId);
        if (result.status === 'success') {
            currentOfferData = result.data;
            
            // جلب المرفقات
            try {
                const attachmentsRes = await API.attachments.listOffer(offerId);
                if (attachmentsRes.status === 'success') {
                    currentOfferData.attachments = attachmentsRes.data || [];
                } else {
                    currentOfferData.attachments = [];
                }
            } catch (e) {
                currentOfferData.attachments = [];
            }

            document.getElementById('loadingState').style.display = 'none';
            document.getElementById('detailContent').style.display = 'block';
            renderOfferDetail(currentOfferData);
        } else {
            document.getElementById('loadingState').style.display = 'none';
            document.getElementById('detailContent').style.display = 'block';
            document.getElementById('detailContent').innerHTML = `
                <div class="text-center py-12 text-muted">
                    <i class="fas fa-exclamation-circle text-4xl block mb-4"></i>
                    <p>${result.message || 'العرض غير موجود'}</p>
                    <button class="btn btn-gold mt-4" onclick="goBack()">العودة للقائمة</button>
                </div>
            `;
        }
    } catch (err) {
        document.getElementById('loadingState').style.display = 'none';
        document.getElementById('detailContent').style.display = 'block';
        document.getElementById('detailContent').innerHTML = `
            <div class="text-center py-12 text-muted">
                <i class="fas fa-exclamation-triangle text-4xl block mb-4"></i>
                <p>حدث خطأ في تحميل البيانات: ${err.message}</p>
                <button class="btn btn-gold mt-4" onclick="loadOfferDetail()">🔄 إعادة المحاولة</button>
            </div>
        `;
    }
}

// ============================================================
// RENDER OFFER DETAIL
// ============================================================
function renderOfferDetail(o) {
    const trackType = o.track_type || 'company';
    const stages = stagesMap[trackType] || [];
    const stageName = getStageName(o.current_stage_id, trackType);
    const color = getStageColor(o.current_stage_id, trackType);
    const isComplete = stages.find(s => s.id === o.current_stage_id)?.is_final || false;
    const maxWait = settings.max_wait_days || 3;
    const isDelayed = o.current_stage_id > 1 && o.current_stage_id < stages.length &&
        daysBetween(o.created_at, new Date().toISOString().slice(0, 10)) >= maxWait;

    // Timeline
    let timelineHtml = stages.map((s, idx) => {
        const isCompleted = idx < stages.findIndex(st => st.id === o.current_stage_id);
        const isActive = s.id === o.current_stage_id;
        let dotClass = 'pending';
        let lineClass = 'pending';
        if (isCompleted) { dotClass = 'completed'; lineClass = 'completed'; }
        else if (isActive) { dotClass = isDelayed ? 'delayed' : 'active'; lineClass = isDelayed ? 'delayed' : 'pending'; }
        return `
            <div class="timeline-item">
                <div style="display:flex;flex-direction:column;align-items:center;padding-top:2px">
                    <div class="timeline-dot ${dotClass}"></div>
                    ${idx < stages.length - 1 ? `<div class="timeline-line ${lineClass}"></div>` : ''}
                </div>
                <div class="timeline-content">
                    <div class="stage-name">${s.name}</div>
                    ${isActive ? `<div class="stage-date">🔵 المرحلة الحالية</div>` : ''}
                    ${isCompleted && s.id === o.current_stage_id ? `<div class="stage-date">✅ تم الإنجاز</div>` : ''}
                </div>
            </div>
        `;
    }).join('');

    // Documents (من attachments)
    let docsHtml = '';
    if (o.attachments && o.attachments.length > 0) {
        docsHtml = o.attachments.map(a => `
            <span class="doc-item">
                <a href="${a.file_url}" target="_blank" class="text-gold hover:underline">${a.file_name}</a>
                <span class="text-xs text-muted">(${a.doc_type || 'مرفق'})</span>
                <span class="del" onclick="deleteAttachment('${o.id}','${a.id}')" title="حذف">✕</span>
            </span>
        `).join('');
    } else {
        docsHtml = '<span style="color:var(--text-secondary);">لا توجد مستندات</span>';
    }

    // Log
    let logHtml = '';
    if (o.log && Array.isArray(o.log) && o.log.length > 0) {
        logHtml = o.log.map(l => {
            const parts = l.split(' - ');
            const time = parts[0] || '';
            const text = parts.slice(1).join(' - ') || l;
            return `
                <div class="log-entry">
                    <span class="log-time">${time}</span>
                    <span>${text}</span>
                </div>
            `;
        }).join('');
    } else {
        logHtml = '<div style="color:var(--text-secondary);">لا توجد سجلات</div>';
    }

    // Action buttons
    let actionsHtml = '';
    if (!isComplete) {
        const stageId = o.current_stage_id;
        if (trackType === 'company') {
            if (stageId === 1) {
                actionsHtml += `<button class="btn btn-gold btn-sm" onclick="showForceAction('${o.id}','send_to_manager','قم بإرسال العرض للمدير للتسعير.')">📤 إرسال للمدير</button>`;
            } else if (stageId === 2) {
                actionsHtml += `<button class="btn btn-gold btn-sm" onclick="showForceAction('${o.id}','record_price','يرجى إدخال السعر المعتمد من المدير.')">💰 تسجيل السعر</button>`;
            } else if (stageId === 3 || stageId === 4) {
                actionsHtml += `<button class="btn btn-gold btn-sm" onclick="showForceAction('${o.id}','receive_docs','قم بتأكيد استلام المستندات من العميل.')">📄 استلام المستندات</button>`;
            } else if (stageId === 5) {
                actionsHtml += `<button class="btn btn-gold btn-sm" onclick="showForceAction('${o.id}','send_to_legal','قم بإرسال المستندات للشؤون القانونية.')">⚖️ إرسال للقانونية</button>`;
            } else if (stageId === 6) {
                actionsHtml += `<button class="btn btn-gold btn-sm" onclick="showForceAction('${o.id}','legal_approved','تم اعتماد العقد؟ قم برفعه وإرساله للعميل.')">📄 اعتماد قانوني</button>`;
            } else if (stageId === 7 || stageId === 8) {
                actionsHtml += `<button class="btn btn-gold btn-sm" onclick="showForceAction('${o.id}','client_signed','تم توقيع العميل؟ قم برفع العقد الموقع.')">📝 توقيع العميل</button>`;
            } else if (stageId === 9) {
                actionsHtml += `<button class="btn btn-gold btn-sm" onclick="showForceAction('${o.id}','complete_offer','قم برفع العقد الموقع وإغلاق الصفقة.')">📁 إغلاق الصفقة</button>`;
            } else if (stageId === 11) {
                actionsHtml += `<button class="btn btn-gold btn-sm" onclick="completeCompanyOffer('${o.id}')">✅ إكمال الصفقة</button>`;
            }
        } else {
            // شخصي
            if (stageId === 1) {
                actionsHtml += `<button class="btn btn-gold btn-sm" onclick="showForceAction('${o.id}','share_offer','هل ترغب في مشاركة العرض مع العملاء؟')">📤 مشاركة العرض</button>`;
            }
        }
        actionsHtml += `<button class="btn btn-outline btn-sm" onclick="openEditOffer('${o.id}')"><i class="fas fa-pen"></i> تعديل</button>`;
        if (stageId > 1 && stageId !== 11) {
            actionsHtml += `<button class="btn btn-outline btn-sm" onclick="openStageSelect('${o.id}')"><i class="fas fa-undo"></i> تغيير المرحلة</button>`;
        }
    } else {
        actionsHtml = `<span class="text-emerald-400 font-bold text-lg">✅ الصفقة مكتملة</span>`;
    }

    const docAction = !isComplete ? `<button class="btn btn-outline btn-sm" onclick="addDocument('${o.id}')">+ إضافة مستند</button>` : '';

    const fullAddress = (o.city || '') + ' - ' + (o.district || '');

    const html = `
        <div class="detail-section">
            <div class="flex flex-wrap justify-between items-start gap-4">
                <div>
                    <h2 class="text-2xl font-extrabold text-gold">${o.display_id || o.id} — ${getPropertyTypeName(o.property_type_id)}</h2>
                    <div class="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted">
                        <span><i class="far fa-user ml-1"></i> ${o.contact?.name || '-'}</span>
                        <span><i class="far fa-phone ml-1"></i> ${o.contact?.phone || '-'}</span>
                        <span><i class="far fa-calendar ml-1"></i> ${formatDate(o.created_at)}</span>
                        <span class="status-badge" style="background:${color}22; color:${color}; border:1px solid ${color}55;">
                            <span class="status-dot ${isDelayed ? 'pulse' : ''}" style="background:${color};"></span>
                            ${stageName}
                        </span>
                        ${isDelayed ? '<span class="text-danger font-bold text-sm">⏰ متأخر</span>' : ''}
                        <span class="chip ${trackType === 'company' ? 'bg-emeraldSoft text-emerald' : 'bg-surface3 text-muted'}">${trackType === 'company' ? '🏢 شركة' : '👤 شخصي'}</span>
                    </div>
                </div>
                <div class="flex flex-wrap gap-2">${actionsHtml}</div>
            </div>
            ${isDelayed ? `<div class="mt-3 text-danger font-bold bg-dangerSoft/20 p-2 rounded-xl text-sm">⏰ متأخر (أكثر من ${maxWait} أيام)</div>` : ''}
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="detail-section">
                <div class="section-title"><i class="fas fa-info-circle text-gold"></i> معلومات العقار</div>
                <div class="grid grid-cols-2 gap-4">
                    <div><span class="text-sm text-muted">النوع</span><div class="font-bold text-ink">${getPropertyTypeName(o.property_type_id)}</div></div>
                    <div><span class="text-sm text-muted">المساحة</span><div class="font-bold text-ink">${o.area || '-'} م²</div></div>
                    <div class="col-span-2"><span class="text-sm text-muted">العنوان</span><div class="font-bold text-ink">${fullAddress}</div></div>
                    <div><span class="text-sm text-muted">نوع الاتفاق</span><div class="font-bold text-ink">${getDealTypeName(o.deal_type_id)}</div></div>
                    <div><span class="text-sm text-muted">السعر</span><div class="font-bold text-gold">${formatMoney(o.price)}</div></div>
                    <div class="col-span-2"><span class="text-sm text-muted">الموقع</span><div class="text-sm break-all"><a href="${o.map_url || '#'}" target="_blank" class="text-gold underline">${o.map_url || '-'}</a></div></div>
                    <div class="col-span-2"><span class="text-sm text-muted">ملاحظات</span><div class="text-sm text-ink">${o.description || '-'}</div></div>
                </div>
            </div>

            <div class="detail-section">
                <div class="section-title"><i class="fas fa-user-tie text-gold"></i> مقدم العرض</div>
                <div class="space-y-2">
                    <div><span class="text-sm text-muted">الاسم</span><div class="font-bold text-ink">${o.contact?.name || '-'}</div></div>
                    <div><span class="text-sm text-muted">النوع</span><div class="text-ink">${o.contact?.type || '-'}</div></div>
                    <div><span class="text-sm text-muted">رقم الجوال</span><div class="text-ink">${o.contact?.phone || '-'}</div></div>
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

    document.getElementById('detailContent').innerHTML = html;
}

// ============================================================
// ACTIONS
// ============================================================
function openEditOffer(id) {
    window.location.href = `offers.html?edit=${id}`;
}

function addDocument(id) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.jpg,.jpeg,.png,.doc,.docx';
    input.onchange = async function(e) {
        const file = e.target.files[0];
        if (!file) return;

        const docType = prompt('نوع المستند (صورة/مخطط/صك/وكالة/عقد/سجل تجاري/ترخيص/أخرى):', 'صورة');
        if (!docType) return;

        try {
            const result = await API.attachments.uploadOffer(id, file, docType);
            if (result.status === 'success') {
                showToast('✅ تم رفع المستند', 'success');
                loadOfferDetail();
            } else {
                showToast(result.message || 'فشل رفع المستند', 'error');
            }
        } catch (err) {
            showToast(err.message || 'حدث خطأ', 'error');
        }
    };
    input.click();
}

async function deleteAttachment(offerId, attachmentId) {
    if (!confirm('هل أنت متأكد من حذف هذا المرفق؟')) return;
    try {
        const result = await API.attachments.deleteOffer(offerId, attachmentId);
        if (result.status === 'success') {
            showToast('✅ تم حذف المرفق', 'success');
            loadOfferDetail();
        } else {
            showToast(result.message || 'فشل الحذف', 'error');
        }
    } catch (err) {
        showToast(err.message || 'حدث خطأ', 'error');
    }
}

// ============================================================
// STAGE SELECT MODAL
// ============================================================
let stageSelectOfferId = null;

function openStageSelect(id) {
    const o = currentOfferData;
    if (!o) return;
    const trackType = o.track_type || 'company';
    const options = getStageSelectOptions(trackType);
    const select = document.getElementById('stageSelectInput');
    if (select) {
        select.innerHTML = options;
        select.value = o.current_stage_id || 1;
    }
    stageSelectOfferId = id;
    document.getElementById('stageSelectModal').classList.add('active');
}

function stageSelectSubmit(e) {
    e.preventDefault();
    const select = document.getElementById('stageSelectInput');
    const newStageId = parseInt(select.value);
    if (!newStageId) {
        showToast('الرجاء اختيار مرحلة صحيحة', 'error');
        return;
    }
    changeStage(stageSelectOfferId, newStageId);
}

async function changeStage(id, newStageId) {
    if (!confirm(`هل أنت متأكد من تغيير المرحلة؟`)) return;
    try {
        const result = await API.offers.changeStage(id, newStageId, 'تم التغيير بواسطة المستخدم');
        if (result.status === 'success') {
            showToast(`✅ تم تغيير المرحلة بنجاح`, 'success');
            closeModal('stageSelectModal');
            loadOfferDetail();
        } else {
            showToast(result.message || 'فشل تغيير المرحلة', 'error');
        }
    } catch (err) {
        showToast(err.message || 'حدث خطأ', 'error');
    }
}

// ============================================================
// COMPLETE OFFER
// ============================================================
async function completeCompanyOffer(id) {
    const finalStageId = getFinalStageId('company');
    if (!finalStageId) {
        showToast('لم يتم العثور على المرحلة النهائية', 'error');
        return;
    }
    if (!confirm('هل أنت متأكد من إكمال الصفقة؟')) return;

    try {
        const result = await API.offers.changeStage(id, finalStageId, 'تم إكمال الصفقة');
        if (result.status === 'success') {
            // إلغاء أي تذكيرات مرتبطة
            await cancelAllReminders(id);
            showToast('🎉 تم إكمال الصفقة بنجاح!', 'success');
            loadOfferDetail();
        } else {
            showToast(result.message || 'فشل إكمال الصفقة', 'error');
        }
    } catch (err) {
        showToast(err.message || 'حدث خطأ', 'error');
    }
}

// ============================================================
// CANCEL ALL REMINDERS FOR OFFER
// ============================================================
async function cancelAllReminders(offerId) {
    try {
        const result = await API.reminders.list({ offer_id: offerId, is_sent: 0 });
        if (result.status === 'success') {
            let reminders = [];
            if (Array.isArray(result.data)) reminders = result.data;
            else if (result.data && Array.isArray(result.data.data)) reminders = result.data.data;
            else reminders = [];
            for (const rem of reminders) {
                await API.reminders.markDone(rem.id);
            }
        }
    } catch (e) {
        console.warn('فشل إلغاء التذكيرات:', e.message);
    }
}

// ============================================================
// FORCE ACTION
// ============================================================
function showForceAction(offerId, actionType, message) {
    const modal = document.getElementById('forceActionModal');
    const title = document.getElementById('forceActionTitle');
    const msg = document.getElementById('forceActionMessage');
    const body = document.getElementById('forceActionBody');
    const primaryBtn = document.getElementById('forceActionPrimaryBtn');

    forceActionData.offerId = offerId;
    forceActionData.action = actionType;
    forceActionData.files = [];

    let titleText = '📢 إجراء مطلوب';
    let messageText = message || 'يرجى تنفيذ الخطوة التالية لإكمال العملية.';
    let bodyHtml = '';
    let btnText = 'تأكيد';

    switch (actionType) {
        case 'send_to_manager':
            titleText = '📤 إرسال للمدير';
            messageText = 'سيتم فتح واتساب لإرسال تفاصيل العرض للمدير للتسعير.';
            bodyHtml = `
                <p style="margin-bottom:12px;">سيتم فتح واتساب مع <strong style="color:var(--gold);">${settings.manager_name || 'المدير'}</strong> لإرسال تفاصيل العرض.</p>
                <div style="background:var(--bg-primary);border:1px solid var(--emerald);border-radius:12px;padding:12px;margin-bottom:12px;">
                    <p style="font-size:0.9rem;color:var(--emerald);"><i class="fas fa-clock ml-1"></i> سيتم تسجيل تاريخ الإرسال، وفي حال تأخر المدير ${settings.manager_timeout || 2} أيام سيصلك تنبيه.</p>
                </div>
            `;
            btnText = '📤 إرسال للمدير';
            break;

        case 'record_price':
            closeModal('forceActionModal');
            document.getElementById('recordPriceOfferId').value = offerId;
            document.getElementById('forceOldPrice').value = currentOfferData?.price || 0;
            document.getElementById('forcePriceInput').value = '';
            document.getElementById('forcePriceNotes').value = '';
            document.getElementById('recordPriceModal').classList.add('active');
            return;

        case 'receive_docs':
            titleText = '📄 استلام مستندات العميل';
            messageText = 'يرجى رفع المستندات التي استلمتها من العميل:';
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
                    <p style="font-size:0.9rem;color:var(--emerald);"><i class="fas fa-clock ml-1"></i> في حال تأخر العميل ${settings.client_timeout || 4} أيام سيصلك تنبيه.</p>
                </div>
            `;
            btnText = '✅ استلام المستندات';
            break;

        case 'send_to_legal':
            titleText = '⚖️ إرسال للشؤون القانونية';
            messageText = 'سيتم فتح واتساب لإرسال المستندات للشؤون القانونية للمراجعة.';
            bodyHtml = `
                <p style="margin-bottom:12px;">سيتم فتح واتساب مع <strong style="color:var(--gold);">${settings.legal_name || 'الشؤون القانونية'}</strong> لإرسال العقد للمراجعة.</p>
                <div style="background:var(--bg-primary);border:1px solid var(--emerald);border-radius:12px;padding:12px;">
                    <p style="font-size:0.9rem;color:var(--emerald);"><i class="fas fa-clock ml-1"></i> سيتم تسجيل تاريخ الإرسال، وفي حال تأخر الموظف ${settings.legal_timeout || 3} أيام سيصلك تنبيه.</p>
                </div>
            `;
            btnText = '📤 إرسال للشؤون القانونية';
            break;

        case 'legal_approved':
            titleText = '✅ اعتماد الشؤون القانونية';
            messageText = 'تم اعتماد العقد من الشؤون القانونية، يرجى رفع العقد النهائي:';
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
            btnText = '📤 رفع العقد وإرسال للعميل';
            break;

        case 'client_signed':
            titleText = '📝 توقيع العميل على العقد';
            messageText = 'تم توقيع العميل على العقد، يرجى رفع العقد الموقع:';
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
            btnText = '📁 رفع العقد الموقع وإغلاق الصفقة';
            break;

        case 'complete_offer':
            titleText = '📁 إكمال الصفقة';
            messageText = 'يرجى رفع العقد النهائي الموقع لإتمام الصفقة:';
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
            btnText = '📁 إكمال وإغلاق الصفقة';
            break;

        case 'share_offer':
            titleText = '📤 مشاركة العرض';
            messageText = 'سيتم فتح واتساب لمشاركة العرض مع العملاء.';
            bodyHtml = `
                <p style="margin-bottom:12px;">سيتم فتح واتساب مع قائمة جهات الاتصال الخاصة بك.</p>
                <div style="background:var(--bg-primary);border:1px solid var(--emerald);border-radius:12px;padding:12px;">
                    <p style="font-size:0.9rem;color:var(--emerald);"><i class="fas fa-share-alt ml-1"></i> يمكنك اختيار جهة الاتصال المناسبة لمشاركة العرض.</p>
                </div>
            `;
            btnText = '📤 مشاركة';
            break;

        default:
            bodyHtml = '<p class="text-muted">لا توجد تفاصيل إضافية.</p>';
    }

    title.textContent = titleText;
    msg.innerHTML = messageText;
    body.innerHTML = bodyHtml;
    primaryBtn.textContent = btnText;

    primaryBtn.onclick = function() {
        executeForceAction();
    };

    modal.classList.add('active');
}

function forceActionFilesSelected(input) {
    const files = input.files;
    const list = document.getElementById('forceFileList');
    if (!list) return;
    let html = '';
    for (let i = 0; i < files.length; i++) {
        html += `<div style="display:inline-block;background:var(--input-bg);border:1px solid var(--border-light);border-radius:6px;padding:4px 12px;margin:4px;font-size:0.8rem;color:var(--text-primary);">
            📎 ${files[i].name}
        </div>`;
        forceActionData.files.push(files[i]);
    }
    list.innerHTML = html;
}

// ============================================================
// EXECUTE FORCE ACTION
// ============================================================
async function executeForceAction() {
    const offerId = forceActionData.offerId;
    const action = forceActionData.action;

    if (!offerId) {
        showToast('لم يتم تحديد العرض', 'error');
        closeModal('forceActionModal');
        return;
    }

    try {
        const offerResult = await API.offers.get(offerId);
        if (offerResult.status !== 'success') {
            showToast('العرض غير موجود', 'error');
            closeModal('forceActionModal');
            return;
        }
        const offer = offerResult.data;
        const now = new Date().toISOString();

        switch (action) {
            case 'send_to_manager': {
                // تحديث المرحلة إلى 2
                await API.offers.changeStage(offerId, 2, 'تم إرسال العرض للمدير للتسعير');
                await API.offers.update(offerId, { sent_to_manager_at: now });

                // فتح واتساب المدير
                const managerPhone = settings.manager_phone || '966500000000';
                const managerMsg = `📋 *عرض عقاري جديد - ${offer.display_id || offer.id}*\n` +
                    `🏗️ *النوع:* ${getPropertyTypeName(offer.property_type_id)}\n` +
                    `📐 *المساحة:* ${offer.area} م²\n` +
                    `💰 *السعر المبدئي:* ${formatMoney(offer.price)}\n` +
                    `📍 *العنوان:* ${offer.city} - ${offer.district}\n` +
                    `🤝 *نوع الاتفاق:* ${getDealTypeName(offer.deal_type_id)}\n` +
                    `👤 *مقدم العرض:* ${offer.contact?.name || 'غير معروف'}\n` +
                    `📞 *رقم التواصل:* ${offer.contact?.phone || 'غير معروف'}\n` +
                    `📝 *ملاحظات:* ${offer.description || 'لا توجد'}\n\n` +
                    `*يرجى التسعير والتوجيه.*`;
                window.open(`https://wa.me/${managerPhone}?text=${encodeURIComponent(managerMsg)}`, '_blank');
                showToast('📤 تم فتح واتساب للمدير', 'success');

                // إنشاء تذكير لمتابعة المدير
                const timeoutDays = settings.manager_timeout || 2;
                await API.reminders.createStageTimeout(offerId, timeoutDays, `متابعة رد المدير على العرض ${offer.display_id || offer.id}`);

                closeModal('forceActionModal');
                loadOfferDetail();
                break;
            }

            case 'record_price': {
                // يتم التعامل معها في recordPriceSubmit
                break;
            }

            case 'receive_docs': {
                await API.offers.changeStage(offerId, 5, 'تم استلام المستندات من العميل');
                // رفع الملفات
                for (const file of forceActionData.files) {
                    await API.attachments.uploadOffer(offerId, file, 'مستند');
                }
                showToast('✅ تم استلام المستندات', 'success');

                // فتح البريد الإلكتروني للشؤون القانونية
                const legalEmail = settings.legal_email || 'legal@masar.sa';
                const subject = encodeURIComponent(`مستندات العرض ${offer.display_id || offer.id}`);
                const body = encodeURIComponent(`الرجاء مراجعة مستندات العرض وإعداد العقد.\n\nرابط العرض: ${window.location.origin}/offers-detail.html?id=${offerId}`);
                window.open(`mailto:${legalEmail}?subject=${subject}&body=${body}`, '_blank');
                showToast('📧 تم فتح البريد الإلكتروني للشؤون القانونية', 'success');

                closeModal('forceActionModal');
                loadOfferDetail();
                break;
            }

            case 'send_to_legal': {
                await API.offers.changeStage(offerId, 6, 'تم إرسال المستندات للشؤون القانونية');
                await API.offers.update(offerId, { legal_review_at: now });
                showToast('📤 تم إرسال المستندات للشؤون القانونية', 'success');

                // فتح واتساب للشؤون القانونية
                const legalPhone = settings.legal_phone || '966500000000';
                const legalMsg = `⚖️ مستندات العرض ${offer.display_id || offer.id} - ${getPropertyTypeName(offer.property_type_id)}\nالموقع: ${offer.city} - ${offer.district}\nيرجى المراجعة القانونية وإصدار العقد.`;
                window.open(`https://wa.me/${legalPhone}?text=${encodeURIComponent(legalMsg)}`, '_blank');
                showToast('📤 تم فتح واتساب للشؤون القانونية', 'success');

                // إنشاء تذكير لمتابعة العقد
                const legalTimeout = settings.legal_timeout || 3;
                await API.reminders.createStageTimeout(offerId, legalTimeout, `متابعة إعداد العقد للعرض ${offer.display_id || offer.id}`);

                closeModal('forceActionModal');
                loadOfferDetail();
                break;
            }

            case 'legal_approved': {
                // رفع العقد النهائي
                for (const file of forceActionData.files) {
                    await API.attachments.uploadOffer(offerId, file, 'عقد');
                }
                await API.offers.changeStage(offerId, 7, 'تم اعتماد العقد من الشؤون القانونية');
                await API.offers.update(offerId, {
                    contract_sent_at: now,
                    legal_status: 'معتمد'
                });

                // إلغاء تذكير العقد
                await cancelAllReminders(offerId);

                showToast('✅ تم اعتماد العقد ورفعه', 'success');

                // فتح واتساب العميل لإرسال العقد
                const clientPhone = offer.contact?.phone || '966500000000';
                const clientMsg = `📋 بخصوص العرض ${offer.display_id || offer.id} - ${getPropertyTypeName(offer.property_type_id)}\n📍 ${offer.city} - ${offer.district}\n📄 تم الانتهاء من العقد النهائي، يرجى مراجعته وتوقيعه.`;
                window.open(`https://wa.me/${clientPhone}?text=${encodeURIComponent(clientMsg)}`, '_blank');
                showToast('📱 تم فتح واتساب للعميل لإرسال العقد', 'success');

                // إنشاء تذكير لمتابعة توقيع العميل
                const signTimeout = settings.client_sign_timeout || 3;
                await API.reminders.createStageTimeout(offerId, signTimeout, `متابعة توقيع العميل على العقد ${offer.display_id || offer.id}`);

                closeModal('forceActionModal');
                loadOfferDetail();
                break;
            }

            case 'client_signed':
            case 'complete_offer': {
                // رفع العقد الموقع
                for (const file of forceActionData.files) {
                    await API.attachments.uploadOffer(offerId, file, 'عقد موقع');
                }

                const finalStageId = getFinalStageId(offer.track_type || 'company');
                await API.offers.changeStage(offerId, finalStageId, 'تم توقيع العميل على العقد وإتمام الصفقة');
                await API.offers.update(offerId, {
                    contract_signed_at: now,
                    completed_at: now,
                    is_closed: 1
                });

                // إلغاء جميع التذكيرات
                await cancelAllReminders(offerId);

                showToast('🎉 تم إتمام الصفقة بنجاح!', 'success');

                // إرسال البريد الإلكتروني للشؤون القانونية
                const legalEmail2 = settings.legal_email || 'legal@masar.sa';
                const subject2 = encodeURIComponent(`العقد الموقع - العرض ${offer.display_id || offer.id}`);
                const body2 = encodeURIComponent(`تم توقيع العقد من قبل العميل للعرض ${offer.display_id || offer.id}.\n\nيرجى أرشفة الملفات.`);
                window.open(`mailto:${legalEmail2}?subject=${subject2}&body=${body2}`, '_blank');
                showToast('📧 تم فتح البريد الإلكتروني للشؤون القانونية', 'success');

                closeModal('forceActionModal');
                loadOfferDetail();
                break;
            }

            case 'share_offer': {
                // مشاركة العرض الشخصي
                const shareMsg = `📋 *عرض عقاري جديد*\n` +
                    `🏗️ *النوع:* ${getPropertyTypeName(offer.property_type_id)}\n` +
                    `📐 *المساحة:* ${offer.area} م²\n` +
                    `💰 *السعر:* ${formatMoney(offer.price)}\n` +
                    `📍 *العنوان:* ${offer.city} - ${offer.district}\n` +
                    `🤝 *نوع الاتفاق:* ${getDealTypeName(offer.deal_type_id)}\n` +
                    `📝 *ملاحظات:* ${offer.description || 'لا توجد'}\n\n` +
                    `للتفاصيل: ${window.location.origin}/offers-detail.html?id=${offer.id}`;
                window.open(`https://wa.me/?text=${encodeURIComponent(shareMsg)}`, '_blank');
                showToast('📤 تم فتح واتساب للمشاركة', 'success');

                // تغيير المرحلة إلى 2 (تفاوض) للعروض الشخصية
                await API.offers.changeStage(offerId, 2, 'تم مشاركة العرض');

                closeModal('forceActionModal');
                loadOfferDetail();
                break;
            }

            default:
                showToast('إجراء غير معروف', 'error');
                closeModal('forceActionModal');
        }
    } catch (err) {
        showToast(err.message || 'حدث خطأ أثناء تنفيذ الإجراء', 'error');
        closeModal('forceActionModal');
    }
}

// ============================================================
// RECORD PRICE SUBMIT
// ============================================================
async function recordPriceSubmit(e) {
    e.preventDefault();
    const offerId = document.getElementById('recordPriceOfferId').value;
    const price = document.getElementById('forcePriceInput').value;
    const notes = document.getElementById('forcePriceNotes').value;

    if (!price || Number(price) <= 0) {
        showToast('الرجاء إدخال سعر صحيح', 'error');
        return;
    }

    try {
        // تحديث السعر
        await API.offers.update(offerId, { price: Number(price) });
        // تغيير المرحلة إلى 3 (تم تحديد السعر)
        await API.offers.changeStage(offerId, 3, `تم تحديد السعر المعتمد: ${formatMoney(price)} - ملاحظات: ${notes || 'بدون'}`);

        // إلغاء تذكير المدير
        await cancelAllReminders(offerId);

        showToast(`✅ تم تسجيل السعر: ${formatMoney(price)}`, 'success');

        // فتح واتساب العميل
        const offer = currentOfferData || await API.offers.get(offerId);
        const clientPhone = offer.contact?.phone || '966500000000';
        const clientMsg = `📋 بخصوص العرض ${offer.display_id || offer.id} - ${getPropertyTypeName(offer.property_type_id)}\n📍 ${offer.city} - ${offer.district}\n💰 السعر المعتمد: ${formatMoney(price)}\nيرجى الرد لتأكيد الاستلام.`;
        window.open(`https://wa.me/${clientPhone}?text=${encodeURIComponent(clientMsg)}`, '_blank');
        showToast('📱 تم فتح واتساب للعميل لإبلاغه بالسعر', 'success');

        // إنشاء تذكير لمتابعة العميل
        const clientTimeout = settings.client_timeout || 3;
        await API.reminders.createStageTimeout(offerId, clientTimeout, `متابعة رد العميل على العرض ${offer.display_id || offer.id}`);

        closeModal('recordPriceModal');
        loadOfferDetail();
    } catch (err) {
        showToast(err.message || 'حدث خطأ', 'error');
    }
}

// ============================================================
// MODAL CONTROLS
// ============================================================
function closeModal(id) {
    document.getElementById(id).classList.remove('active');
}

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', async function() {
    const isAuth = await API.auth.checkAuth(true);
    if (isAuth) {
        const main = document.getElementById('mainContent');
        if (main) {
            main.style.display = 'block';
            main.classList.add('visible');
        }
        // تحميل البيانات الأساسية أولاً
        await loadMasterData();
        // ثم تحميل تفاصيل العرض
        await loadOfferDetail();
    }
});

// ============================================================
// EXPOSE GLOBALS
// ============================================================
window.goBack = goBack;
window.showToast = showToast;
window.closeModal = closeModal;
window.executeForceAction = executeForceAction;
window.forceActionFilesSelected = forceActionFilesSelected;
window.recordPriceSubmit = recordPriceSubmit;
window.loadOfferDetail = loadOfferDetail;
window.showForceAction = showForceAction;
window.addDocument = addDocument;
window.deleteAttachment = deleteAttachment;
window.openEditOffer = openEditOffer;
window.openStageSelect = openStageSelect;
window.stageSelectSubmit = stageSelectSubmit;
window.changeStage = changeStage;
window.completeCompanyOffer = completeCompanyOffer;
window.loadMasterData = loadMasterData;
window.cancelAllReminders = cancelAllReminders;