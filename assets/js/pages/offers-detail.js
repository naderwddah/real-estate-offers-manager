// ============================================================
// assets/js/pages/offers-detail.js - كود تفاصيل العرض (منفصل)
// ============================================================

let currentOfferId = null;
let currentOfferData = null;
let forceActionData = { offerId: null, action: null, files: [] };

// ============================================================
// HELPERS
// ============================================================
function getStageName(id, track) {
    const stages = track === 'company' ? [
        { id: 1, name: 'عرض جديد (استلام)' },
        { id: 2, name: 'بانتظار تسعير المدير' },
        { id: 3, name: 'تم تحديد السعر' },
        { id: 4, name: 'بانتظار مستندات العميل' },
        { id: 5, name: 'تم استلام المستندات' },
        { id: 6, name: 'بانتظار مراجعة قانونية' },
        { id: 7, name: 'تم اعتماد العقد قانونياً' },
        { id: 8, name: 'بانتظار توقيع العميل' },
        { id: 9, name: 'تم توقيع العميل' },
        { id: 10, name: '✅ مكتمل' },
        { id: 11, name: 'بانتظار العميل' }
    ] : [
        { id: 1, name: 'عرض جديد' },
        { id: 2, name: 'تفاوض' },
        { id: 3, name: 'تم الاتفاق' },
        { id: 4, name: 'مكتمل ✅' }
    ];
    const s = stages.find(s => s.id === id);
    return s ? s.name : 'غير معروف';
}

function getStatusInfo(id) {
    const map = {
        1: { label: 'جديد', color: '#f97316', statusType: 'جديد' },
        2: { label: 'انتظار تسعير', color: '#f59e0b', statusType: 'انتظار' },
        3: { label: 'تم التسعير', color: '#3b82f6', statusType: 'قيد' },
        4: { label: 'انتظار مستندات', color: '#f59e0b', statusType: 'انتظار' },
        5: { label: 'استلم المستندات', color: '#3b82f6', statusType: 'قيد' },
        6: { label: 'مراجعة قانونية', color: '#f59e0b', statusType: 'انتظار' },
        7: { label: 'اعتماد قانوني', color: '#3b82f6', statusType: 'قيد' },
        8: { label: 'انتظار توقيع', color: '#f59e0b', statusType: 'انتظار' },
        9: { label: 'تم التوقيع', color: '#3b82f6', statusType: 'قيد' },
        10: { label: 'مكتمل ✅', color: '#10b981', statusType: 'مغلق' },
        11: { label: 'بانتظار العميل', color: '#f59e0b', statusType: 'انتظار' }
    };
    return map[id] || { label: 'غير معروف', color: '#9ca3af', statusType: 'other' };
}

function formatDate(d) {
    if (!d) return '-';
    try {
        const date = new Date(d);
        return date.toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (e) {
        return d;
    }
}

function formatMoney(n) {
    return n ? Number(n).toLocaleString('en-US') + ' ريال' : '—';
}

function daysBetween(a, b) {
    return Math.round((new Date(b) - new Date(a)) / 86400000);
}

function goBack() {
    window.history.back();
}

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
// LOAD OFFER DETAIL
// ============================================================
async function loadOfferDetail() {
    // التحقق من المصادقة مع التوجيه التلقائي
    const isAuth = await API.auth.checkAuth(true);
    if (!isAuth) return;

    // الحصول على ID من URL
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
        const result = await API.offers.get(offerId);
        
        if (result.status === 'success') {
            currentOfferData = result.data;
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
    const stages = o.track_type === 'company' ? [
        { id: 1, name: 'عرض جديد (استلام)' },
        { id: 2, name: 'بانتظار تسعير المدير' },
        { id: 3, name: 'تم تحديد السعر' },
        { id: 4, name: 'بانتظار مستندات العميل' },
        { id: 5, name: 'تم استلام المستندات' },
        { id: 6, name: 'بانتظار مراجعة قانونية' },
        { id: 7, name: 'تم اعتماد العقد قانونياً' },
        { id: 8, name: 'بانتظار توقيع العميل' },
        { id: 9, name: 'تم توقيع العميل' },
        { id: 10, name: '✅ مكتمل' },
        { id: 11, name: 'بانتظار العميل' }
    ] : [
        { id: 1, name: 'عرض جديد' },
        { id: 2, name: 'تفاوض' },
        { id: 3, name: 'تم الاتفاق' },
        { id: 4, name: 'مكتمل ✅' }
    ];

    const st = getStatusInfo(o.stage_id);
    const stageName = getStageName(o.stage_id, o.track_type);
    const isComplete = o.stage_id === 10 || (o.track_type === 'personal' && o.stage_id === 4);
    const isDelayed = [2, 4, 6, 8, 11].includes(o.stage_id);
    
    const maxWait = 3;
    const isOverdue = o.stage_id > 1 && o.stage_id < stages.length && 
                      daysBetween(o.status_date || o.created_at, new Date().toISOString().slice(0, 10)) >= maxWait;

    // Timeline
    let timelineHtml = stages.map((s, idx) => {
        const isCompleted = idx < o.stage_id;
        const isActive = idx === o.stage_id - 1;
        let dotClass = 'pending';
        let lineClass = 'pending';
        if (isCompleted) {
            dotClass = 'completed';
            lineClass = 'completed';
        } else if (isActive) {
            dotClass = isOverdue ? 'delayed' : 'active';
            lineClass = isOverdue ? 'delayed' : 'pending';
        }
        return `
            <div class="timeline-item">
                <div style="display:flex;flex-direction:column;align-items:center;padding-top:2px">
                    <div class="timeline-dot ${dotClass}"></div>
                    ${idx < stages.length - 1 ? `<div class="timeline-line ${lineClass}"></div>` : ''}
                </div>
                <div class="timeline-content">
                    <div class="stage-name">${s.name}</div>
                    ${isActive ? `<div class="stage-date">🔵 المرحلة الحالية</div>` : ''}
                    ${isCompleted && idx === o.stage_id - 1 ? `<div class="stage-date">✅ تم الإنجاز</div>` : ''}
                </div>
            </div>
        `;
    }).join('');

    // Documents
    let docsHtml = '';
    const docNames = Object.keys(o.documents || {});
    if (docNames.length) {
        docsHtml = docNames.map(d => `
            <span class="doc-item">
                ${d} ${o.documents[d] ? '✅' : '⏳'}
                <span class="del" onclick="toggleDoc('${o.id}','${d}')">✕</span>
            </span>
        `).join('');
    } else {
        docsHtml = '<span style="color:var(--text-secondary);">لا توجد مستندات</span>';
    }

    // Log
    let logHtml = (o.log || []).map(l => `
        <div class="log-entry">
            <span class="log-time">${l.slice(0, 16)}</span>
            <span>${l.slice(16)}</span>
        </div>
    `).join('') || '<div style="color:var(--text-secondary);">لا توجد سجلات</div>';

    // Action buttons
    let actionsHtml = '';
    if (!isComplete) {
        if (o.track_type === 'company' && o.stage_id === 11) {
            actionsHtml += `<button class="btn btn-gold btn-sm" onclick="completeCompanyOffer('${o.id}')">✅ إكمال الصفقة</button>`;
        } else if (o.stage_id === 1) {
            actionsHtml += `<button class="btn btn-gold btn-sm" onclick="showForceAction('${o.id}','send_to_manager','قم بإرسال العرض للمدير للتسعير.')">📤 إرسال للمدير</button>`;
        } else if (o.stage_id === 2) {
            actionsHtml += `<button class="btn btn-gold btn-sm" onclick="showForceAction('${o.id}','record_price','يرجى إدخال السعر المعتمد من المدير.')">💰 تسجيل السعر</button>`;
        } else if (o.stage_id === 3) {
            actionsHtml += `<button class="btn btn-gold btn-sm" onclick="showForceAction('${o.id}','receive_docs','قم بتأكيد استلام المستندات من العميل.')">📄 استلام المستندات</button>`;
        } else if (o.stage_id === 4) {
            actionsHtml += `<button class="btn btn-gold btn-sm" onclick="showForceAction('${o.id}','receive_docs','تم استلام المستندات؟ قم برفعها.')">📄 استلام المستندات</button>`;
        } else if (o.stage_id === 5) {
            actionsHtml += `<button class="btn btn-gold btn-sm" onclick="showForceAction('${o.id}','send_to_legal','قم بإرسال المستندات للشؤون القانونية.')">⚖️ إرسال للقانونية</button>`;
        } else if (o.stage_id === 6) {
            actionsHtml += `<button class="btn btn-gold btn-sm" onclick="showForceAction('${o.id}','legal_approved','تم اعتماد العقد؟ قم برفعه وإرساله للعميل.')">📄 اعتماد قانوني</button>`;
        } else if (o.stage_id === 7) {
            actionsHtml += `<button class="btn btn-gold btn-sm" onclick="showForceAction('${o.id}','legal_approved','قم برفع العقد النهائي وإرساله للعميل.')">📤 إرسال العقد للعميل</button>`;
        } else if (o.stage_id === 8) {
            actionsHtml += `<button class="btn btn-gold btn-sm" onclick="showForceAction('${o.id}','client_signed','تم توقيع العميل؟ قم برفع العقد الموقع.')">📝 توقيع العميل</button>`;
        } else if (o.stage_id === 9) {
            actionsHtml += `<button class="btn btn-gold btn-sm" onclick="showForceAction('${o.id}','client_signed','قم برفع العقد الموقع وإغلاق الصفقة.')">📁 إغلاق الصفقة</button>`;
        }
        actionsHtml += `<button class="btn btn-outline btn-sm" onclick="openEditOffer('${o.id}')"><i class="fas fa-pen"></i> تعديل</button>`;
        if (o.stage_id > 1) {
            actionsHtml += `<button class="btn btn-outline btn-sm" onclick="regressStage('${o.id}')"><i class="fas fa-undo"></i> رجوع</button>`;
        }
    } else {
        actionsHtml = `<span class="text-emerald-400 font-bold text-lg">✅ الصفقة مكتملة</span>`;
    }

    const fullAddress = (o.city || '') + ' - ' + (o.district || '');

    const html = `
        <div class="detail-section">
            <div class="flex flex-wrap justify-between items-start gap-4">
                <div>
                    <h2 class="text-2xl font-extrabold text-gold">${o.display_id || o.id} — ${o.title || o.property_type}</h2>
                    <div class="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted">
                        <span><i class="far fa-user ml-1"></i> ${o.client_name || o.contact?.name || '-'}</span>
                        <span><i class="far fa-phone ml-1"></i> ${o.contact_phone || o.contact?.phone || '-'}</span>
                        <span><i class="far fa-calendar ml-1"></i> ${formatDate(o.created_at || o.offer_date)}</span>
                        <span class="status-badge" style="background:${st.color}22; color:${st.color}; border:1px solid ${st.color}55;">
                            <span class="status-dot ${isDelayed ? 'pulse' : ''}" style="background:${st.color};"></span>
                            ${st.label}
                        </span>
                        ${isOverdue ? '<span class="text-danger font-bold text-sm">⏰ متأخر</span>' : ''}
                        <span class="chip ${o.track_type === 'company' ? 'bg-emeraldSoft text-emerald' : 'bg-surface3 text-muted'}">${o.track_type === 'company' ? '🏢 شركة' : '👤 شخصي'}</span>
                    </div>
                </div>
                <div class="flex flex-wrap gap-2">${actionsHtml}</div>
            </div>
            ${isOverdue ? `<div class="mt-3 text-danger font-bold bg-dangerSoft/20 p-2 rounded-xl text-sm">⏰ متأخر (أكثر من ${maxWait} أيام)</div>` : ''}
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="detail-section">
                <div class="section-title"><i class="fas fa-info-circle text-gold"></i> معلومات العقار</div>
                <div class="grid grid-cols-2 gap-4">
                    <div><span class="text-sm text-muted">النوع</span><div class="font-bold text-ink">${o.property_type || o.type}</div></div>
                    <div><span class="text-sm text-muted">المساحة</span><div class="font-bold text-ink">${o.area || '-'} م²</div></div>
                    <div class="col-span-2"><span class="text-sm text-muted">العنوان</span><div class="font-bold text-ink">${fullAddress}</div></div>
                    <div><span class="text-sm text-muted">نوع الاتفاق</span><div class="font-bold text-ink">${o.deal_type || o.agreement || '-'}</div></div>
                    <div><span class="text-sm text-muted">السعر</span><div class="font-bold text-gold">${formatMoney(o.price)}</div></div>
                    <div class="col-span-2"><span class="text-sm text-muted">الموقع</span><div class="text-sm break-all"><a href="${o.location_url || o.map_url || o.location || '#'}" target="_blank" class="text-gold underline">${o.location_url || o.map_url || o.location || '-'}</a></div></div>
                    <div class="col-span-2"><span class="text-sm text-muted">ملاحظات</span><div class="text-sm text-ink">${o.description || o.notes || '-'}</div></div>
                </div>
            </div>

            <div class="detail-section">
                <div class="section-title"><i class="fas fa-user-tie text-gold"></i> مقدم العرض</div>
                <div class="space-y-2">
                    <div><span class="text-sm text-muted">الاسم</span><div class="font-bold text-ink">${o.provider_name || o.contact?.name || '-'}</div></div>
                    <div><span class="text-sm text-muted">النوع</span><div class="text-ink">${o.provider_type || o.contact?.contact_type || '-'}</div></div>
                    <div><span class="text-sm text-muted">رقم الجوال</span><div class="text-ink">${o.contact_phone || o.contact?.phone || '-'}</div></div>
                </div>
            </div>
        </div>

        <div class="detail-section">
            <div class="section-title"><i class="fas fa-route text-gold"></i> مسار الصفقة</div>
            <div class="timeline">${timelineHtml}</div>
        </div>

        <div class="detail-section">
            <div class="section-title"><i class="fas fa-file-alt text-gold"></i> المستندات <button class="btn btn-outline btn-sm" onclick="addDocument('${o.id}')" style="margin-right:8px;">+ إضافة مستند</button></div>
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

function toggleDoc(id, docName) {
    showToast('جاري تحديث المستند...', 'info');
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

function regressStage(id) {
    const stageId = prompt('أدخل رقم المرحلة الجديدة (1-11):', '1');
    if (!stageId) return;
    
    const newStage = parseInt(stageId);
    if (isNaN(newStage) || newStage < 1 || newStage > 11) {
        showToast('مرحلة غير صالحة', 'error');
        return;
    }
    
    API.offers.changeStage(id, newStage, 'تم الرجوع للمرحلة بواسطة المستخدم')
        .then(result => {
            if (result.status === 'success') {
                showToast('✅ تم تغيير المرحلة', 'success');
                loadOfferDetail();
            } else {
                showToast(result.message || 'فشل تغيير المرحلة', 'error');
            }
        })
        .catch(err => {
            showToast(err.message || 'حدث خطأ', 'error');
        });
}

function completeCompanyOffer(id) {
    if (!confirm('هل أنت متأكد من إكمال الصفقة؟')) return;
    
    API.offers.changeStage(id, 10, 'تم إكمال الصفقة')
        .then(result => {
            if (result.status === 'success') {
                showToast('🎉 تم إكمال الصفقة بنجاح!', 'success');
                loadOfferDetail();
            } else {
                showToast(result.message || 'فشل إكمال الصفقة', 'error');
            }
        })
        .catch(err => {
            showToast(err.message || 'حدث خطأ', 'error');
        });
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
                <p style="margin-bottom:12px;">سيتم فتح واتساب مع <strong style="color:var(--gold);">المدير</strong> لإرسال تفاصيل العرض.</p>
                <div style="background:var(--bg-primary);border:1px solid var(--emerald);border-radius:12px;padding:12px;margin-bottom:12px;">
                    <p style="font-size:0.9rem;color:var(--emerald);"><i class="fas fa-clock ml-1"></i> سيتم تسجيل تاريخ الإرسال، وفي حال تأخر المدير يومين سيصلك تنبيه.</p>
                </div>
            `;
            btnText = '📤 إرسال للمدير';
            break;

        case 'record_price':
            titleText = '💰 تسجيل السعر المعتمد';
            messageText = 'يرجى إدخال السعر المعتمد من المدير:';
            document.getElementById('recordPriceOfferId').value = offerId;
            document.getElementById('forceOldPrice').value = currentOfferData?.price || 0;
            document.getElementById('forcePriceInput').value = '';
            document.getElementById('forcePriceNotes').value = '';
            closeModal('forceActionModal');
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
                    <p style="font-size:0.9rem;color:var(--emerald);"><i class="fas fa-clock ml-1"></i> في حال تأخر العميل 4 أيام سيصلك تنبيه.</p>
                </div>
            `;
            btnText = '✅ استلام المستندات';
            break;

        case 'send_to_legal':
            titleText = '⚖️ إرسال للشؤون القانونية';
            messageText = 'سيتم فتح واتساب لإرسال المستندات للشؤون القانونية للمراجعة.';
            bodyHtml = `
                <p style="margin-bottom:12px;">سيتم فتح واتساب مع <strong style="color:var(--gold);">الشؤون القانونية</strong> لإرسال العقد للمراجعة.</p>
                <div style="background:var(--bg-primary);border:1px solid var(--emerald);border-radius:12px;padding:12px;">
                    <p style="font-size:0.9rem;color:var(--emerald);"><i class="fas fa-clock ml-1"></i> سيتم تسجيل تاريخ الإرسال، وفي حال تأخر الموظف يومين سيصلك تنبيه.</p>
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

        default:
            bodyHtml = '<p class="text-muted">لا توجد تفاصيل إضافية.</p>';
    }

    title.textContent = titleText;
    msg.textContent = messageText;
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

function executeForceAction() {
    const offerId = forceActionData.offerId;
    const action = forceActionData.action;

    switch (action) {
        case 'send_to_manager':
            API.offers.changeStage(offerId, 2, 'تم إرسال العرض للمدير')
                .then(result => {
                    if (result.status === 'success') {
                        showToast('📤 تم إرسال العرض للمدير', 'success');
                        closeModal('forceActionModal');
                        loadOfferDetail();
                    } else {
                        showToast(result.message || 'فشل الإرسال', 'error');
                    }
                })
                .catch(err => {
                    showToast(err.message || 'حدث خطأ', 'error');
                });
            break;

        case 'record_price':
            // يتم التعامل معها في recordPriceSubmit
            break;

        case 'receive_docs':
            API.offers.changeStage(offerId, 5, 'تم استلام المستندات من العميل')
                .then(result => {
                    if (result.status === 'success') {
                        showToast('✅ تم استلام المستندات', 'success');
                        closeModal('forceActionModal');
                        loadOfferDetail();
                    } else {
                        showToast(result.message || 'فشل التأكيد', 'error');
                    }
                })
                .catch(err => {
                    showToast(err.message || 'حدث خطأ', 'error');
                });
            break;

        case 'send_to_legal':
            API.offers.changeStage(offerId, 6, 'تم إرسال المستندات للشؤون القانونية')
                .then(result => {
                    if (result.status === 'success') {
                        showToast('📤 تم إرسال المستندات للشؤون القانونية', 'success');
                        closeModal('forceActionModal');
                        loadOfferDetail();
                    } else {
                        showToast(result.message || 'فشل الإرسال', 'error');
                    }
                })
                .catch(err => {
                    showToast(err.message || 'حدث خطأ', 'error');
                });
            break;

        case 'legal_approved':
            API.offers.changeStage(offerId, 7, 'تم اعتماد العقد من الشؤون القانونية')
                .then(result => {
                    if (result.status === 'success') {
                        showToast('✅ تم اعتماد العقد', 'success');
                        closeModal('forceActionModal');
                        loadOfferDetail();
                    } else {
                        showToast(result.message || 'فشل الاعتماد', 'error');
                    }
                })
                .catch(err => {
                    showToast(err.message || 'حدث خطأ', 'error');
                });
            break;

        case 'client_signed':
            API.offers.changeStage(offerId, 10, 'تم توقيع العميل على العقد')
                .then(result => {
                    if (result.status === 'success') {
                        showToast('🎉 تم إتمام الصفقة!', 'success');
                        closeModal('forceActionModal');
                        loadOfferDetail();
                    } else {
                        showToast(result.message || 'فشل التأكيد', 'error');
                    }
                })
                .catch(err => {
                    showToast(err.message || 'حدث خطأ', 'error');
                });
            break;

        default:
            showToast('إجراء غير معروف', 'error');
            closeModal('forceActionModal');
    }
}

function recordPriceSubmit(e) {
    e.preventDefault();
    const offerId = document.getElementById('recordPriceOfferId').value;
    const price = document.getElementById('forcePriceInput').value;
    const notes = document.getElementById('forcePriceNotes').value;

    if (!price || Number(price) <= 0) {
        showToast('الرجاء إدخال سعر صحيح', 'error');
        return;
    }

    // تحديث السعر ثم تغيير المرحلة
    API.offers.update(offerId, { price: Number(price) })
        .then(result => {
            if (result.status === 'success') {
                return API.offers.changeStage(offerId, 3, `تم تحديد السعر المعتمد: ${formatMoney(price)} - ملاحظات: ${notes || 'بدون'}`);
            } else {
                throw new Error(result.message || 'فشل تحديث السعر');
            }
        })
        .then(result => {
            if (result.status === 'success') {
                showToast(`✅ تم تسجيل السعر: ${formatMoney(price)}`, 'success');
                closeModal('recordPriceModal');
                loadOfferDetail();
            } else {
                showToast(result.message || 'فشل تغيير المرحلة', 'error');
            }
        })
        .catch(err => {
            showToast(err.message || 'حدث خطأ', 'error');
        });
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
    // التحقق من المصادقة مع التوجيه التلقائي
    const isAuth = await API.auth.checkAuth(true);
    if (isAuth) {
        const main = document.getElementById('mainContent');
        if (main) {
            main.style.display = 'block';
            main.classList.add('visible');
        }
        loadOfferDetail();
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
window.toggleDoc = toggleDoc;
window.addDocument = addDocument;
window.regressStage = regressStage;
window.completeCompanyOffer = completeCompanyOffer;
window.openEditOffer = openEditOffer;