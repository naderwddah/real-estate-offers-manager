// ============================================================
// assets/js/pages/offers.js - كود العروض (نسخة منظمة ومحسنة)
// ============================================================

let offers = [];
let currentPage = 1;
const PAGE_SIZE = 6;
let currentEditId = null;
let currentMode = "normal";

let forceActionData = {
  offerId: null,
  action: null,
  callback: null,
  files: [],
};

// ============================================================
// STAGES
// ============================================================
const STAGES_COMPANY = [
  { id: 1, name: "عرض جديد (استلام)" },
  { id: 2, name: "بانتظار تسعير المدير" },
  { id: 3, name: "تم تحديد السعر" },
  { id: 4, name: "بانتظار مستندات العميل" },
  { id: 5, name: "تم استلام المستندات" },
  { id: 6, name: "بانتظار مراجعة قانونية" },
  { id: 7, name: "تم اعتماد العقد قانونياً" },
  { id: 8, name: "بانتظار توقيع العميل" },
  { id: 9, name: "تم توقيع العميل" },
  { id: 10, name: "✅ مكتمل" },
  { id: 11, name: "بانتظار العميل" },
];

const STAGES_PERSONAL = [
  { id: 1, name: "عرض جديد" },
  { id: 2, name: "تفاوض" },
  { id: 3, name: "تم الاتفاق" },
  { id: 4, name: "مكتمل ✅" },
];

function getStages(track) {
  return track === "company" ? STAGES_COMPANY : STAGES_PERSONAL;
}

function getStageName(id, track) {
  const stages = getStages(track);
  const s = stages.find((s) => s.id === id);
  return s ? s.name : "غير معروف";
}

// ============================================================
// STATUS MAP
// ============================================================
const STATUS_MAP = {
  1: { label: "جديد", color: "#f97316", statusType: "جديد" },
  2: { label: "انتظار تسعير", color: "#f59e0b", statusType: "انتظار" },
  3: { label: "تم التسعير", color: "#3b82f6", statusType: "قيد" },
  4: { label: "انتظار مستندات", color: "#f59e0b", statusType: "انتظار" },
  5: { label: "استلم المستندات", color: "#3b82f6", statusType: "قيد" },
  6: { label: "مراجعة قانونية", color: "#f59e0b", statusType: "انتظار" },
  7: { label: "اعتماد قانوني", color: "#3b82f6", statusType: "قيد" },
  8: { label: "انتظار توقيع", color: "#f59e0b", statusType: "انتظار" },
  9: { label: "تم التوقيع", color: "#3b82f6", statusType: "قيد" },
  10: { label: "مكتمل ✅", color: "#10b981", statusType: "مغلق" },
  11: { label: "بانتظار العميل", color: "#f59e0b", statusType: "انتظار" },
};

// ============================================================
// HELPERS
// ============================================================
function formatDate(d) {
  if (!d) return "-";
  try {
    const date = typeof d === "string" ? new Date(d) : new Date(d);
    if (isNaN(date.getTime())) return d;
    return date.toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch (e) {
    return d;
  }
}

function formatMoney(n) {
  if (!n && n !== 0) return "—";
  return Number(n).toLocaleString("en-US") + " ريال";
}

function getStatusInfo(id) {
  return (
    STATUS_MAP[id] || {
      label: "غير معروف",
      color: "#9ca3af",
      statusType: "other",
    }
  );
}

function generateId() {
  const nums = offers.filter((o) => {
    const id = o.display_id || o.id || "";
    return String(id).startsWith("ع-");
  }).length;
  return "ع-" + String(nums + 1).padStart(3, "0");
}

function daysBetween(a, b) {
  return Math.round((new Date(b) - new Date(a)) / 86400000);
}

function saveOffersLocally() {
  localStorage.setItem("masarOffersLocal", JSON.stringify(offers));
}

function loadOffersLocally() {
  const saved = localStorage.getItem("masarOffersLocal");
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {}
  }
  return [];
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
// SMART INPUT
// ============================================================
function parseSmartInput() {
  const text = document.getElementById("smartInput").value;
  const feedback = document.getElementById("smartFeedback");
  if (!text.trim()) {
    feedback.innerHTML =
      '<span class="error">⚠️ الرجاء لصق رسالة العميل أولاً.</span>';
    feedback.classList.add("show");
    return;
  }

  const pattern = /([^\n:]+):\s*\[([^\]]*)\]/g;
  let match;
  const extracted = {};
  while ((match = pattern.exec(text)) !== null) {
    const key = match[1].trim();
    const value = match[2].trim();
    if (value) extracted[key] = value;
  }

  const fieldMap = {
    "نوع العقار": "f_type",
    المساحة: "f_area",
    السعر: "f_price",
    العنوان: "f_address",
    "رابط الموقع": "f_location",
    "اسم مقدم العرض": "f_providerName",
    "نوع مقدم العرض": "f_providerType",
    "رقم التواصل": "f_phone",
    "نوع الاتفاق": "f_dealType",
    ملاحظات: "f_notes",
  };

  let filled = 0;
  let missing = [];
  for (const [key, fieldId] of Object.entries(fieldMap)) {
    const el = document.getElementById(fieldId);
    if (!el) continue;
    if (extracted[key] !== undefined && extracted[key] !== "") {
      const val = extracted[key];
      if (el.tagName === "SELECT") {
        const options = Array.from(el.options).map((o) => o.value);
        const matched = options.find(
          (o) => o.toLowerCase() === val.toLowerCase()
        );
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
  document.querySelectorAll(".switch-group button").forEach((b) => {
    b.classList.toggle("active", b.dataset.mode === mode);
  });
  document
    .getElementById("smartArea")
    .classList.toggle("hidden", mode !== "smart");
}

function openMapPicker() {
  window.open("https://www.google.com/maps", "_blank");
  showToast(
    "📌 اختر الموقع على الخريطة، ثم انسخ رابط الصفحة والصقه في حقل الرابط",
    "info"
  );
}

// ============================================================
// UPLOAD FILE
// ============================================================
async function uploadOfferFile(offerId, file, docType) {
  if (!API.isAuthenticated()) {
    showToast("الرجاء تسجيل الدخول أولاً", "error");
    return;
  }

  try {
    const result = await API.attachments.uploadOffer(offerId, file, docType);
    if (result.status === "success") {
      showToast("✅ تم رفع الملف بنجاح", "success");
      const o = offers.find((x) => String(x.id) === String(offerId));
      if (o) {
        if (!o.documents) o.documents = {};
        o.documents[file.name] = true;
        saveOffersLocally();
        renderDetail(offerId);
        renderTable();
      }
    } else {
      showToast(result.message || "فشل رفع الملف", "error");
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
                    <p style="font-size:0.9rem;color:var(--emerald);"><i class="fas fa-clock ml-1"></i> سيتم تسجيل تاريخ الإرسال، وفي حال تأخر المدير يومين سيصلك تنبيه.</p>
                </div>
            `;
      btnText = "📤 إرسال للمدير";
      break;

    case "record_price":
      titleText = "💰 تسجيل السعر المعتمد";
      messageText = "يرجى إدخال السعر المعتمد من المدير:";
      bodyHtml = `
                <div class="field" style="margin-bottom:12px;">
                    <label>السعر السابق (ريال)</label>
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
                    <p style="font-size:0.9rem;color:var(--emerald);"><i class="fas fa-clock ml-1"></i> في حال تأخر العميل 4 أيام سيصلك تنبيه.</p>
                </div>
            `;
      btnText = "✅ استلام المستندات";
      break;

    case "send_to_legal":
      titleText = "⚖️ إرسال للشؤون القانونية";
      messageText = "سيتم فتح واتساب لإرسال المستندات للشؤون القانونية للمراجعة.";
      bodyHtml = `
                <p style="margin-bottom:12px;">سيتم فتح واتساب مع <strong style="color:var(--gold);">الشؤون القانونية</strong> لإرسال العقد للمراجعة.</p>
                <div style="background:var(--bg-primary);border:1px solid var(--emerald);border-radius:12px;padding:12px;">
                    <p style="font-size:0.9rem;color:var(--emerald);"><i class="fas fa-clock ml-1"></i> سيتم تسجيل تاريخ الإرسال، وفي حال تأخر الموظف يومين سيصلك تنبيه.</p>
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

    default:
      bodyHtml = '<p class="text-muted">لا توجد تفاصيل إضافية.</p>';
  }

  title.textContent = titleText;
  msg.textContent = messageText;
  body.innerHTML = bodyHtml;
  primaryBtn.textContent = btnText;

  if (actionType === "record_price") {
    const o = offers.find((x) => String(x.id) === String(offerId));
    if (o) {
      document.getElementById("forceOldPrice").value = o.price || 0;
    }
  }

  primaryBtn.onclick = function () {
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

function executeForceAction() {
  const offerId = forceActionData.offerId;
  const action = forceActionData.action;
  const o = offers.find((x) => String(x.id) === String(offerId));
  if (!o) {
    showToast("العرض غير موجود", "error");
    closeModal("forceActionModal");
    return;
  }

  const now = new Date().toISOString().slice(0, 16).replace("T", " ");
  const stages = getStages(o.track_type);

  switch (action) {
    case "send_to_manager":
      const managerPhone = "966500000000";
      const managerMsg = `📋 *عرض عقاري جديد - ${o.id}*\n🏗️ *النوع:* ${o.property_type}\n📐 *المساحة:* ${o.area} م²\n💰 *السعر المبدئي:* ${formatMoney(o.price)}\n📍 *العنوان:* ${o.city} - ${o.district}\n🤝 *نوع الاتفاق:* ${o.deal_type}\n👤 *مقدم العرض:* ${o.provider_name} (${o.provider_type})\n📞 *رقم التواصل:* ${o.contact_phone}\n📝 *ملاحظات:* ${o.description || "لا توجد"}\n\n*يرجى التسعير والتوجيه.*`;
      window.open(
        `https://wa.me/${managerPhone}?text=${encodeURIComponent(managerMsg)}`,
        "_blank"
      );
      o.stage_id = 2;
      o.sentToManagerDate = new Date().toISOString().slice(0, 10);
      if (!o.log) o.log = [];
      o.log.push(now + " 📤 تم إرسال العرض للمدير للتسعير");
      saveOffersLocally();
      showToast("📤 تم فتح واتساب للمدير", "success");
      closeModal("forceActionModal");
      renderDetail(offerId);
      renderTable();
      scheduleReminder(
        offerId,
        2,
        "تذكير: المدير لم يرد على تسعير العرض " + o.id
      );
      break;

    case "record_price":
      const priceInput = document.getElementById("forcePriceInput");
      if (!priceInput || !priceInput.value || parseFloat(priceInput.value) <= 0) {
        showToast("الرجاء إدخال سعر صحيح", "error");
        return;
      }
      const newPrice = parseFloat(priceInput.value);
      const notes = document.getElementById("forcePriceNotes")?.value || "";
      o.price = newPrice;
      o.stage_id = 3;
      if (!o.log) o.log = [];
      o.log.push(now + ` 💰 تم تسجيل السعر المعتمد: ${formatMoney(newPrice)}`);
      saveOffersLocally();
      showToast(`✅ تم تسجيل السعر: ${formatMoney(newPrice)}`, "success");
      closeModal("forceActionModal");
      renderDetail(offerId);
      renderTable();

      const clientPhone = o.contact_phone || "966500000000";
      const clientMsg = `📋 بخصوص العرض ${o.id} - ${o.property_type}\n📍 ${o.city} - ${o.district}\n💰 السعر المعتمد: ${formatMoney(newPrice)}\nيرجى الرد لتأكيد الاستلام.`;
      window.open(
        `https://wa.me/${clientPhone}?text=${encodeURIComponent(clientMsg)}`,
        "_blank"
      );
      showToast("📱 تم فتح واتساب للعميل لإبلاغه بالسعر", "success");

      setTimeout(() => {
        o.stage_id = 4;
        saveOffersLocally();
        renderDetail(offerId);
        renderTable();
        scheduleReminder(
          offerId,
          4,
          "تذكير: العميل لم يرد على العرض " + o.id
        );
      }, 2000);
      break;

    case "receive_docs":
      const clientNotes =
        document.getElementById("forceClientNotes")?.value || "";
      o.stage_id = 5;
      if (!o.log) o.log = [];
      o.log.push(
        now +
          " 📄 تم استلام المستندات من العميل" +
          (clientNotes ? " - ملاحظات: " + clientNotes : "")
      );
      o.documents = o.documents || {};
      forceActionData.files.forEach((f) => {
        o.documents[f.name] = true;
      });
      saveOffersLocally();
      showToast("✅ تم استلام المستندات بنجاح", "success");
      closeModal("forceActionModal");
      renderDetail(offerId);
      renderTable();
      setTimeout(() => {
        showForceAction(
          offerId,
          "send_to_legal",
          "قم بإرسال المستندات للشؤون القانونية للمراجعة."
        );
      }, 1000);
      break;

    case "send_to_legal":
      const legalPhone = "966500000000";
      const legalMsg = `⚖️ مستندات العرض ${o.id} - ${o.property_type}\nالموقع: ${o.city} - ${o.district}\nيرجى المراجعة القانونية وإصدار العقد.`;
      window.open(
        `https://wa.me/${legalPhone}?text=${encodeURIComponent(legalMsg)}`,
        "_blank"
      );
      o.stage_id = 6;
      o.sentToLegalDate = new Date().toISOString().slice(0, 10);
      if (!o.log) o.log = [];
      o.log.push(now + " ⚖️ تم إرسال المستندات للشؤون القانونية");
      saveOffersLocally();
      showToast("📤 تم إرسال المستندات للشؤون القانونية", "success");
      closeModal("forceActionModal");
      renderDetail(offerId);
      renderTable();
      scheduleReminder(
        offerId,
        2,
        "تذكير: الشؤون القانونية لم ترد على العرض " + o.id
      );
      break;

    case "legal_approved":
      o.stage_id = 7;
      if (!o.log) o.log = [];
      o.log.push(now + " ✅ تم اعتماد العقد من الشؤون القانونية");
      forceActionData.files.forEach((f) => {
        o.documents = o.documents || {};
        o.documents["العقد النهائي - " + f.name] = true;
      });
      saveOffersLocally();
      showToast("✅ تم اعتماد العقد ورفعه", "success");
      closeModal("forceActionModal");
      renderDetail(offerId);
      renderTable();

      const clientPhone2 = o.contact_phone || "966500000000";
      const clientMsg2 = `📋 بخصوص العرض ${o.id} - ${o.property_type}\n📍 ${o.city} - ${o.district}\n📄 تم الانتهاء من العقد النهائي، يرجى مراجعته وتوقيعه.`;
      window.open(
        `https://wa.me/${clientPhone2}?text=${encodeURIComponent(clientMsg2)}`,
        "_blank"
      );
      showToast("📱 تم فتح واتساب للعميل لإرسال العقد", "success");

      o.stage_id = 8;
      saveOffersLocally();
      renderDetail(offerId);
      renderTable();
      scheduleReminder(
        offerId,
        2,
        "تذكير: العميل لم يرد على العقد " + o.id
      );
      break;

    case "client_signed":
      o.stage_id = 10;
      if (!o.log) o.log = [];
      o.log.push(now + " 📝 تم توقيع العميل على العقد ورفع العقد الموقع");
      forceActionData.files.forEach((f) => {
        o.documents = o.documents || {};
        o.documents["العقد موقع - " + f.name] = true;
      });
      saveOffersLocally();
      showToast("🎉 تم إتمام الصفقة بنجاح!", "success");
      closeModal("forceActionModal");
      renderDetail(offerId);
      renderTable();

      const legalPhone2 = "966500000000";
      const legalMsg2 = `✅ تم توقيع العميل على العقد للعرض ${o.id}\n📍 ${o.city} - ${o.district}\nتم إغلاق الصفقة بنجاح.`;
      window.open(
        `https://wa.me/${legalPhone2}?text=${encodeURIComponent(legalMsg2)}`,
        "_blank"
      );
      showToast(
        "📱 تم فتح واتساب للشؤون القانونية لإرسال العقد الموقع",
        "success"
      );
      break;

    default:
      showToast("إجراء غير معروف", "error");
      closeModal("forceActionModal");
  }
}

// ============================================================
// REMINDER ENGINE
// ============================================================
function scheduleReminder(offerId, days, message) {
  const o = offers.find((x) => String(x.id) === String(offerId));
  if (!o) return;
  const reminderDate = new Date();
  reminderDate.setDate(reminderDate.getDate() + days);
  const reminderKey = "reminder_" + offerId + "_" + days;
  localStorage.setItem(
    reminderKey,
    JSON.stringify({
      offerId: offerId,
      date: reminderDate.toISOString().slice(0, 10),
      message: message,
      done: false,
    })
  );
  checkReminders();
}

function checkReminders() {
  const today = new Date().toISOString().slice(0, 10);
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith("reminder_")) {
      try {
        const data = JSON.parse(localStorage.getItem(key));
        if (!data.done && data.date <= today) {
          showToast("🔔 " + data.message, "info");
          data.done = true;
          localStorage.setItem(key, JSON.stringify(data));
          if ("Notification" in window && Notification.permission === "granted") {
            new Notification("🔔 تذكير", { body: data.message });
          }
        }
      } catch (e) {}
    }
  }
}

// ============================================================
// LOAD OFFERS
// ============================================================
async function loadOffers() {
  // التحقق من المصادقة مع التوجيه التلقائي في حال الفشل
  const isAuth = await API.auth.checkAuth(true);
  if (!isAuth) return;

  try {
    const data = await API.offers.list({ per_page: 100 });
    if (data.status === "success") {
      offers = data.data.data || [];
      const localOffers = loadOffersLocally();
      localOffers.forEach((local) => {
        const existing = offers.find(
          (o) => String(o.id) === String(local.id)
        );
        if (existing) {
          if (local.log) existing.log = local.log;
          if (local.documents) existing.documents = local.documents;
        } else {
          offers.push(local);
        }
      });
      renderTable();
      updateStats();
    } else {
      offers = loadOffersLocally();
      if (offers.length === 0) {
        offers = getSampleOffers();
      }
      renderTable();
      updateStats();
      showToast("تم تحميل البيانات من التخزين المحلي", "info");
    }
  } catch (err) {
    offers = loadOffersLocally();
    if (offers.length === 0) {
      offers = getSampleOffers();
    }
    renderTable();
    updateStats();
    showToast("تم تحميل البيانات من التخزين المحلي", "info");
  }
}

function getSampleOffers() {
  return [
    {
      id: "ع-١٢٣",
      client_name: "شركة الإعمار",
      property_type: "أرض",
      deal_type: "بيع",
      provider_name: "أحمد",
      provider_type: "مالك",
      contact_phone: "0501111111",
      area: 500,
      city: "الرياض",
      district: "حي النخيل",
      location: "https://maps.google.com/",
      description: "تطل على شارع رئيسي",
      created_at: "2026-07-20",
      stage_id: 10,
      price: 1250000,
      track_type: "company",
      documents: { "صك ملكية": true, هوية: true },
      log: [
        "2026-07-20 10:00 تم استلام العرض",
        "2026-07-21 09:00 تم إرساله للمدير",
        "2026-07-22 14:00 تم تحديد السعر",
        "2026-07-23 11:00 تم إبلاغ المالك",
        "2026-07-24 08:00 تم استلام المستندات",
        "2026-07-25 13:00 عند الشؤون القانونية",
        "2026-07-28 10:00 تم توقيع العقد",
        "2026-07-29 12:00 ✅ تم رفع الملف النهائي",
      ],
    },
    {
      id: "ع-١٢٤",
      client_name: "محمد السهلي",
      property_type: "محطة وقود",
      deal_type: "إيجار",
      provider_name: "سعد",
      provider_type: "وسيط",
      contact_phone: "0502222222",
      area: 800,
      city: "جدة",
      district: "حي الشاطئ",
      location: "https://maps.google.com/",
      description: "قريبة من الطريق السريع",
      created_at: "2026-07-22",
      stage_id: 6,
      price: 850000,
      track_type: "company",
      documents: { صك: true },
      log: [
        "2026-07-22 10:00 تم استلام العرض",
        "2026-07-23 09:00 تم إرساله للمدير",
        "2026-07-24 14:00 تم تحديد السعر",
        "2026-07-25 11:00 تم إبلاغ المالك",
        "2026-07-26 08:00 تم استلام المستندات",
        "2026-07-27 13:00 عند الشؤون القانونية",
      ],
    },
  ];
}

// ============================================================
// SAVE OFFER
// ============================================================
async function saveOffer() {
  const editId = document.getElementById("editOfferId").value;
  const track = document.getElementById("f_track").value;
  const propertyType = document.getElementById("f_type").value;
  const area = parseFloat(document.getElementById("f_area").value);
  const price = parseFloat(document.getElementById("f_price").value);
  const address = document.getElementById("f_address").value.trim();
  const location = document.getElementById("f_location").value.trim();
  const providerName = document.getElementById("f_providerName").value.trim();
  const providerType = document.getElementById("f_providerType").value;
  const phone = document.getElementById("f_phone").value.trim();
  const dealType = document.getElementById("f_dealType").value;
  const notes = document.getElementById("f_notes").value.trim();

  if (
    !propertyType ||
    !area ||
    isNaN(area) ||
    !price ||
    isNaN(price) ||
    !address ||
    !location ||
    !providerName ||
    !providerType ||
    !phone ||
    !dealType
  ) {
    showToast("يرجى ملء جميع الحقول المطلوبة (*)", "error");
    return;
  }

  try {
    new URL(location);
  } catch (e) {
    showToast("الرجاء إدخال رابط صحيح", "error");
    return;
  }

  let city = address;
  let district = "";
  if (address.includes(" - ")) {
    const parts = address.split(" - ");
    city = parts[0].trim();
    district = parts.slice(1).join(" - ").trim();
  } else if (address.includes("-")) {
    const parts = address.split("-");
    city = parts[0].trim();
    district = parts.slice(1).join("-").trim();
  }

  const now = new Date().toISOString().slice(0, 16).replace("T", " ");

  const planFile = document.getElementById("f_plan").files[0];
  const imagesFiles = document.getElementById("f_images").files;
  const docsFiles = document.getElementById("f_docs").files;

  if (editId) {
    const o = offers.find((x) => String(x.id) === String(editId));
    if (!o) {
      showToast("العرض غير موجود", "error");
      return;
    }
    o.track_type = track;
    o.property_type = propertyType;
    o.area = area;
    o.price = price;
    o.city = city;
    o.district = district;
    o.location = location;
    o.provider_name = providerName;
    o.provider_type = providerType;
    o.contact_phone = phone;
    o.deal_type = dealType;
    o.description = notes || "لا توجد ملاحظات";
    o.client_name = providerName;
    if (!o.log) o.log = [];
    o.log.push(now + " ✏️ تم تعديل العرض");

    if (planFile) await uploadOfferFile(editId, planFile, "مخطط");
    for (let i = 0; i < imagesFiles.length; i++) {
      await uploadOfferFile(editId, imagesFiles[i], "صورة");
    }
    for (let i = 0; i < docsFiles.length; i++) {
      await uploadOfferFile(editId, docsFiles[i], "أخرى");
    }

    saveOffersLocally();
    closeModal("offerModal");
    showToast("✅ تم تحديث العرض", "success");
    renderTable();
    if (!document.getElementById("detailView").classList.contains("hidden")) {
      renderDetail(editId);
    }
    return;
  }

  const id = generateId();
  const newOffer = {
    id: id,
    client_name: providerName,
    property_type: propertyType,
    deal_type: dealType,
    provider_name: providerName,
    provider_type: providerType,
    contact_phone: phone,
    area: area,
    price: price,
    city: city,
    district: district,
    location: location,
    description: notes || "لا توجد ملاحظات",
    created_at: new Date().toISOString().slice(0, 10),
    track_type: track,
    documents: {},
    log: [now + " 📝 تم استلام العرض"],
  };

  if (planFile) await uploadOfferFile(id, planFile, "مخطط");
  for (let i = 0; i < imagesFiles.length; i++) {
    await uploadOfferFile(id, imagesFiles[i], "صورة");
  }
  for (let i = 0; i < docsFiles.length; i++) {
    await uploadOfferFile(id, docsFiles[i], "أخرى");
  }

  if (track === "company") {
    newOffer.stage_id = 1;
    offers.push(newOffer);
    saveOffersLocally();
    closeModal("offerModal");
    showToast(`✅ تم إضافة العرض ${id}`, "success");
    renderTable();
    setTimeout(() => {
      showForceAction(
        id,
        "send_to_manager",
        "قم بإرسال العرض للمدير للتسعير."
      );
    }, 800);
  } else {
    newOffer.stage_id = 1;
    offers.push(newOffer);
    saveOffersLocally();
    closeModal("offerModal");
    showToast(`✅ تم إضافة العرض ${id}`, "success");
    renderTable();
    setTimeout(() => {
      showForceAction(
        id,
        "send_to_manager",
        "قم بإرسال العرض للمدير للتسعير."
      );
    }, 800);
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
    tbody.innerHTML = pageItems
      .map((o) => {
        const st = getStatusInfo(o.stage_id);
        const stageName = getStageName(o.stage_id, o.track_type);
        const isPulse = [2, 4, 6, 8, 11].includes(o.stage_id);
        const displayId = o.display_id || o.id || "-";
        const clientName = o.client_name || o.contact?.name || "-";
        const propertyType = o.property_type || o.type || "-";
        const providerName = o.provider_name || o.contact?.name || "-";
        const createdDate = o.created_at || o.offer_date || "-";

        return `
                <tr class="offer-row border-b border-line" onclick="openDetail('${o.id}')">
                    <td class="px-3 py-3 font-bold text-gold text-sm">${displayId}</td>
                    <td class="px-3 py-3 text-sm text-ink">${clientName}</td>
                    <td class="px-3 py-3 text-sm text-ink">${propertyType}</td>
                    <td class="px-3 py-3 text-sm max-w-[120px] truncate text-muted" title="${stageName}">${stageName}</td>
                    <td class="px-3 py-3">
                        <span class="status-badge" style="background:${st.color}22; color:${st.color}; border:1px solid ${st.color}55;">
                            <span class="status-dot ${isPulse ? "pulse" : ""}" style="background:${st.color};"></span>
                            ${st.label}
                        </span>
                    </td>
                    <td class="px-3 py-3 text-sm text-ink">${providerName}</td>
                    <td class="px-3 py-3 text-sm text-muted">${formatDate(createdDate)}</td>
                    <td class="px-3 py-3">
                        <div class="flex items-center gap-1">
                            <button class="text-muted hover:text-gold px-1" onclick="event.stopPropagation(); openDetail('${o.id}')" title="عرض التفاصيل"><i class="fas fa-eye"></i></button>
                            <button class="text-muted hover:text-gold px-1" onclick="event.stopPropagation(); openEditOffer('${o.id}')" title="تعديل"><i class="fas fa-pen"></i></button>
                            <button class="text-muted hover:text-danger px-1" onclick="event.stopPropagation(); deleteOffer('${o.id}')" title="حذف"><i class="fas fa-trash"></i></button>
                        </div>
                    </td>
                </tr>
            `;
      })
      .join("");
  }

  const cardList = document.getElementById("offersCardList");
  if (pageItems.length === 0) {
    cardList.innerHTML = `<div class="text-center py-12 text-muted"><i class="fas fa-inbox text-3xl block mb-2"></i> لا توجد عروض</div>`;
  } else {
    cardList.innerHTML = pageItems
      .map((o) => {
        const st = getStatusInfo(o.stage_id);
        const stageName = getStageName(o.stage_id, o.track_type);
        const isPulse = [2, 4, 6, 8, 11].includes(o.stage_id);
        const maxWait = 3;
        const isDelayed =
          o.stage_id > 1 &&
          o.stage_id < getStages(o.track_type).length &&
          daysBetween(
            o.statusDate || o.created_at,
            new Date().toISOString().slice(0, 10)
          ) >= maxWait;
        const cardClass = isDelayed ? "delayed" : "";
        return `
                <div class="offer-card-item ${cardClass}" onclick="openDetail('${o.id}')">
                    <div class="top-row">
                        <span class="offer-id">${o.id}</span>
                        <span class="status-badge" style="background:${st.color}22; color:${st.color}; border:1px solid ${st.color}55; font-size:0.7rem;">
                            <span class="status-dot ${isPulse ? "pulse" : ""}" style="background:${st.color};"></span>
                            ${st.label}
                        </span>
                    </div>
                    <div class="offer-meta">
                        <span><i class="far fa-user ml-1"></i> ${o.client_name || "-"}</span>
                        <span><i class="fas fa-tag ml-1"></i> ${o.property_type}</span>
                        <span><i class="fas fa-map-marker-alt ml-1"></i> ${o.city || ""}</span>
                        <span><i class="fas fa-route ml-1"></i> ${stageName}</span>
                    </div>
                    <div style="font-size:0.8rem;color:var(--text-secondary);margin-top:4px">
                        <i class="far fa-calendar ml-1"></i> ${formatDate(o.created_at)}
                        <span style="margin-right:12px"><i class="fas fa-user-tie ml-1"></i> ${o.provider_name || "-"}</span>
                        ${isDelayed ? '<span style="margin-right:12px;color:var(--danger);">⏰ متأخر</span>' : ""}
                    </div>
                    <div class="offer-actions">
                        <button onclick="event.stopPropagation(); openDetail('${o.id}')"><i class="fas fa-eye"></i> عرض</button>
                        <button onclick="event.stopPropagation(); openEditOffer('${o.id}')"><i class="fas fa-pen"></i> تعديل</button>
                        <button class="danger" onclick="event.stopPropagation(); deleteOffer('${o.id}')"><i class="fas fa-trash"></i> حذف</button>
                    </div>
                </div>
            `;
      })
      .join("");
  }

  document.getElementById("paginationInfo").textContent =
    `عرض ${total > 0 ? start + 1 : 0}-${end} من ${total}`;
  const controls = document.getElementById("paginationControls");
  let html = `<button class="px-3 py-1 border border-line rounded-full ${currentPage === 1 ? "opacity-40 cursor-default text-muted" : "text-ink hover:bg-surface2"}" onclick="goPage(${currentPage - 1})"><i class="fas fa-chevron-right"></i></button>`;
  for (let i = 1; i <= totalPages; i++) {
    html += `<button class="px-3 py-1 border border-line rounded-full ${i === currentPage ? "bg-gold text-bg" : "text-ink hover:bg-surface2"}" onclick="goPage(${i})">${i}</button>`;
  }
  html += `<button class="px-3 py-1 border border-line rounded-full ${currentPage === totalPages ? "opacity-40 cursor-default text-muted" : "text-ink hover:bg-surface2"}" onclick="goPage(${currentPage + 1})"><i class="fas fa-chevron-left"></i></button>`;
  controls.innerHTML = html;
}

function getFilteredOffers() {
  const search = document
    .getElementById("searchInput")
    .value.trim()
    .toLowerCase();
  const type = document.getElementById("typeFilter").value;
  const status = document.getElementById("statusFilter").value;
  const from = document.getElementById("dateFrom").value;
  const to = document.getElementById("dateTo").value;

  let filtered = offers.filter((o) => {
    const propertyType = o.property_type || o.type || "";
    const city = o.city || "";
    const clientName = o.client_name || o.contact?.name || "";
    const providerName = o.provider_name || o.contact?.name || "";
    const displayId = o.display_id || o.id || "";

    if (type !== "all" && propertyType !== type) return false;
    if (status !== "all") {
      const st = getStatusInfo(o.stage_id);
      if (st.statusType !== status) return false;
    }
    if (search) {
      const match =
        displayId.includes(search) ||
        clientName.includes(search) ||
        propertyType.includes(search) ||
        city.includes(search) ||
        providerName.includes(search);
      if (!match) return false;
    }
    const createdDate = o.created_at || o.offer_date || "";
    if (from && createdDate && createdDate.slice(0, 10) < from) return false;
    if (to && createdDate && createdDate.slice(0, 10) > to) return false;
    return true;
  });
  return filtered;
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
  const pending = offers.filter((o) =>
    ["انتظار", "جديد"].includes(getStatusInfo(o.stage_id).statusType)
  ).length;
  const completed = offers.filter(
    (o) => getStatusInfo(o.stage_id).statusType === "مغلق"
  ).length;
  document.getElementById("pendingOffers").textContent = pending;
  document.getElementById("completedOffers").textContent = completed;
  const land = offers.filter(
    (o) => (o.property_type || o.type) === "أرض"
  ).length;
  const gas = offers.filter(
    (o) => (o.property_type || o.type) === "محطة وقود"
  ).length;
  const mall = offers.filter(
    (o) => (o.property_type || o.type) === "مركز تجاري"
  ).length;
  document.getElementById("countLand").textContent = land;
  document.getElementById("countGas").textContent = gas;
  document.getElementById("countMall").textContent = mall;
}

async function deleteOffer(id) {
  if (!confirm(`هل أنت متأكد من حذف العرض ${id}؟`)) return;
  offers = offers.filter((o) => String(o.id) !== String(id));
  saveOffersLocally();
  renderTable();
  showToast(`تم حذف العرض ${id}`, "success");
}

// ============================================================
// DETAIL VIEW
// ============================================================
async function openDetail(id) {
  const o = offers.find((x) => String(x.id) === String(id));
  if (!o) {
    showToast("العرض غير موجود", "error");
    return;
  }
  document.getElementById("listView").classList.add("hidden");
  document.getElementById("detailView").classList.remove("hidden");
  renderDetail(id);
}

function renderDetail(id) {
  const o = offers.find((x) => String(x.id) === String(id));
  if (!o) {
    document.getElementById("detailContent").innerHTML =
      '<div class="text-center py-12 text-muted">العرض غير موجود</div>';
    return;
  }

  const st = getStatusInfo(o.stage_id);
  const stages = getStages(o.track_type);
  const stageName = getStageName(o.stage_id, o.track_type);
  const isComplete = o.stage_id === stages.length;
  const isDelayed =
    o.stage_id > 1 &&
    o.stage_id < stages.length &&
    daysBetween(
      o.statusDate || o.created_at,
      new Date().toISOString().slice(0, 10)
    ) >= 3;

  // Timeline
  let timelineHtml = stages
    .map((s, idx) => {
      const isCompleted = idx < o.stage_id;
      const isActive = idx === o.stage_id - 1;
      let dotClass = "pending";
      let lineClass = "pending";
      if (isCompleted) {
        dotClass = "completed";
        lineClass = "completed";
      } else if (isActive) {
        dotClass = isDelayed ? "delayed" : "active";
        lineClass = isDelayed ? "delayed" : "pending";
      }
      return `
            <div class="timeline-item">
                <div style="display:flex;flex-direction:column;align-items:center;padding-top:2px">
                    <div class="timeline-dot ${dotClass}"></div>
                    ${idx < stages.length - 1 ? `<div class="timeline-line ${lineClass}"></div>` : ""}
                </div>
                <div class="timeline-content">
                    <div class="stage-name">${s.name}</div>
                    ${isActive ? `<div class="stage-date">🔵 المرحلة الحالية</div>` : ""}
                    ${isCompleted && idx === o.stage_id - 1 ? `<div class="stage-date">✅ تم الإنجاز</div>` : ""}
                </div>
            </div>
        `;
    })
    .join("");

  // Documents
  let docsHtml = "";
  const docNames = Object.keys(o.documents || {});
  if (docNames.length) {
    docsHtml = docNames
      .map(
        (d) => `
            <span class="doc-item">
                ${d} ${o.documents[d] ? "✅" : "⏳"}
                <span class="del" onclick="toggleDoc('${o.id}','${d}')">✕</span>
            </span>
        `
      )
      .join("");
  } else {
    docsHtml =
      '<span style="color:var(--text-secondary);">لا توجد مستندات</span>';
  }

  // Log
  let logHtml =
    (o.log || [])
      .map(
        (l) => `
        <div class="log-entry">
            <span class="log-time">${l.slice(0, 16)}</span>
            <span>${l.slice(16)}</span>
        </div>
    `
      )
      .join("") ||
    '<div style="color:var(--text-secondary);">لا توجد سجلات</div>';

  // Action buttons
  let actionsHtml = "";
  if (!isComplete) {
    if (o.stage_id === 1) {
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
    } else if (o.stage_id === 11) {
      actionsHtml += `<button class="btn btn-gold btn-sm" onclick="changeStage('${o.id}', 10)">✅ إكمال الصفقة</button>`;
    }
    actionsHtml += `<button class="btn btn-outline btn-sm" onclick="openEditOffer('${o.id}')"><i class="fas fa-pen"></i> تعديل</button>`;
    if (o.stage_id > 1 && o.stage_id !== 11) {
      actionsHtml += `<button class="btn btn-outline btn-sm" onclick="changeStage('${o.id}', ${o.stage_id - 1})"><i class="fas fa-undo"></i> رجوع</button>`;
    }
  } else {
    actionsHtml = `<span class="text-emerald-400 font-bold text-lg">✅ الصفقة مكتملة</span>`;
  }

  const docAction = !isComplete
    ? `<button class="btn btn-outline btn-sm" onclick="addDocument('${o.id}')">+ إضافة مستند</button>`
    : "";

  const html = `
        <div class="detail-section">
            <div class="flex flex-wrap justify-between items-start gap-4">
                <div>
                    <h2 class="text-2xl font-extrabold text-gold">${o.id} — ${o.property_type}</h2>
                    <div class="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted">
                        <span><i class="far fa-user ml-1"></i> ${o.client_name || "-"}</span>
                        <span><i class="far fa-phone ml-1"></i> ${o.contact_phone || "-"}</span>
                        <span><i class="far fa-calendar ml-1"></i> ${formatDate(o.created_at)}</span>
                        <span class="status-badge" style="background:${st.color}22; color:${st.color}; border:1px solid ${st.color}55;">
                            <span class="status-dot ${isDelayed ? "pulse" : ""}" style="background:${st.color};"></span>
                            ${st.label}
                        </span>
                        ${isDelayed ? '<span class="text-danger font-bold text-sm">⏰ متأخر</span>' : ""}
                        <span class="chip ${o.track_type === "company" ? "bg-emeraldSoft text-emerald" : "bg-surface3 text-muted"}">${o.track_type === "company" ? "🏢 شركة" : "👤 شخصي"}</span>
                    </div>
                </div>
                <div class="flex flex-wrap gap-2">${actionsHtml}</div>
            </div>
            ${isDelayed ? `<div class="mt-3 text-danger font-bold bg-dangerSoft/20 p-2 rounded-xl text-sm">⏰ متأخر (أكثر من 3 أيام)</div>` : ""}
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="detail-section">
                <div class="section-title"><i class="fas fa-info-circle text-gold"></i> معلومات العقار</div>
                <div class="grid grid-cols-2 gap-4">
                    <div><span class="text-sm text-muted">النوع</span><div class="font-bold text-ink">${o.property_type}</div></div>
                    <div><span class="text-sm text-muted">المساحة</span><div class="font-bold text-ink">${o.area || "-"} م²</div></div>
                    <div class="col-span-2"><span class="text-sm text-muted">العنوان</span><div class="font-bold text-ink">${o.city || ""} - ${o.district || ""}</div></div>
                    <div><span class="text-sm text-muted">نوع الاتفاق</span><div class="font-bold text-ink">${o.deal_type || "-"}</div></div>
                    <div><span class="text-sm text-muted">السعر</span><div class="font-bold text-gold">${formatMoney(o.price)}</div></div>
                    <div class="col-span-2"><span class="text-sm text-muted">الموقع</span><div class="text-sm break-all"><a href="${o.location || "#"}" target="_blank" class="text-gold underline">${o.location || "-"}</a></div></div>
                    <div class="col-span-2"><span class="text-sm text-muted">ملاحظات</span><div class="text-sm text-ink">${o.description || "-"}</div></div>
                </div>
            </div>

            <div class="detail-section">
                <div class="section-title"><i class="fas fa-user-tie text-gold"></i> مقدم العرض</div>
                <div class="space-y-2">
                    <div><span class="text-sm text-muted">الاسم</span><div class="font-bold text-ink">${o.provider_name || "-"}</div></div>
                    <div><span class="text-sm text-muted">النوع</span><div class="text-ink">${o.provider_type || "-"}</div></div>
                    <div><span class="text-sm text-muted">رقم الجوال</span><div class="text-ink">${o.contact_phone || "-"}</div></div>
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
function changeStage(id, newStage) {
  const o = offers.find((x) => String(x.id) === String(id));
  if (!o) {
    showToast("العرض غير موجود", "error");
    return;
  }
  const stages = getStages(o.track_type);
  if (newStage > stages.length) {
    showToast("مرحلة غير صالحة", "error");
    return;
  }

  o.stage_id = newStage;
  o.statusDate = new Date().toISOString().slice(0, 10);
  if (!o.log) o.log = [];
  const stageName = getStageName(newStage, o.track_type);
  o.log.push(
    `${new Date().toISOString().slice(0, 16).replace("T", " ")} 🔄 تم تغيير المرحلة إلى "${stageName}"`
  );
  saveOffersLocally();
  showToast(`✅ تم تغيير المرحلة إلى "${stageName}"`, "success");
  renderDetail(id);
  renderTable();
}

// ============================================================
// DOCUMENTS
// ============================================================
function toggleDoc(id, docName) {
  const o = offers.find((x) => String(x.id) === String(id));
  if (!o) return;
  if (!o.documents) o.documents = {};
  o.documents[docName] = !o.documents[docName];
  saveOffersLocally();
  renderDetail(id);
}

function addDocument(id) {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".pdf,.jpg,.jpeg,.png,.doc,.docx";
  input.onchange = async function (e) {
    const file = e.target.files[0];
    if (!file) return;
    const docType = prompt(
      "نوع المستند (صورة/مخطط/صك/وكالة/عقد/سجل تجاري/ترخيص/أخرى):",
      "صورة"
    );
    if (!docType) return;
    await uploadOfferFile(id, file, docType);
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

function openEditOffer(id) {
  const o = offers.find((x) => String(x.id) === String(id));
  if (!o) {
    showToast("العرض غير موجود", "error");
    return;
  }
  currentEditId = id;
  document.getElementById("modalTitle").textContent = "تعديل العرض";
  document.getElementById("editOfferId").value = id;
  document.getElementById("f_track").value = o.track_type || "company";
  document.getElementById("f_type").value = o.property_type || "";
  document.getElementById("f_area").value = o.area || "";
  document.getElementById("f_price").value = o.price || "";
  document.getElementById("f_address").value =
    (o.city || "") + " - " + (o.district || "");
  document.getElementById("f_location").value =
    o.map_url || o.location || "";
  document.getElementById("f_providerName").value =
    o.provider_name || o.contact?.name || "";
  document.getElementById("f_providerType").value = o.provider_type || "";
  document.getElementById("f_phone").value =
    o.contact_phone || o.contact?.phone || "";
  document.getElementById("f_dealType").value = o.deal_type || "";
  document.getElementById("f_notes").value =
    o.description || o.notes || "";
  document.getElementById("smartInput").value = "";
  document.getElementById("smartFeedback").classList.remove("show");
  setMode("normal");
  document.getElementById("offerModal").classList.add("active");
}

function closeModal(id) {
  document.getElementById(id).classList.remove("active");
  if (id === "forceActionModal") {
    forceActionData = {
      offerId: null,
      action: null,
      callback: null,
      files: [],
    };
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
  const headers = [
    "رقم العرض",
    "العميل",
    "نوع العقار",
    "العنوان",
    "نوع الاتفاق",
    "مقدم العرض",
    "رقم التواصل",
    "المساحة",
    "السعر",
    "المرحلة",
    "الحالة",
    "التاريخ",
    "ملاحظات",
  ];
  const rows = offers.map((o) => {
    const st = getStatusInfo(o.stage_id);
    const fullAddress = (o.city || "") + " - " + (o.district || "");
    return [
      o.id,
      o.client_name,
      o.property_type,
      fullAddress,
      o.deal_type,
      o.provider_name,
      o.contact_phone,
      o.area,
      o.price || 0,
      getStageName(o.stage_id, o.track_type),
      st.label,
      o.created_at,
      o.description,
    ];
  });
  let csv = "\uFEFF" + headers.join(",") + "\n";
  rows.forEach((r) => {
    csv +=
      r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",") + "\n";
  });
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `تقرير_العروض_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  showToast("✅ تم تصدير التقرير", "success");
}

// ============================================================
// KEYBOARD
// ============================================================
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    document
      .querySelectorAll(".modal-overlay.active")
      .forEach((el) => el.classList.remove("active"));
    if (
      !document.getElementById("detailView").classList.contains("hidden")
    )
      closeDetail();
  }
  if ((e.ctrlKey || e.metaKey) && e.key === "n") {
    e.preventDefault();
    openAddOffer();
  }
});

// ============================================================
// INIT
// ============================================================
document.addEventListener("DOMContentLoaded", async function () {
  // التحقق من المصادقة مع التوجيه التلقائي في حال الفشل
  const isAuth = await API.auth.checkAuth(true);
  if (isAuth) {
    // إظهار المحتوى
    const main = document.getElementById("mainContent");
    if (main) {
      main.style.display = "block";
      main.classList.add("visible");
    }
    await loadOffers();
    setInterval(checkReminders, 30000);
    if (
      "Notification" in window &&
      Notification.permission === "default"
    ) {
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
window.toggleDoc = toggleDoc;
window.addDocument = addDocument;
window.scheduleReminder = scheduleReminder;
window.loadOffers = loadOffers;