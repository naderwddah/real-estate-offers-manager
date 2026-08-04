// ============================================================
// assets/js/pages/requests.js - كود الطلبات (نسخة منظمة)
// ============================================================

let requests = [];
let currentPage = 1;
const PAGE_SIZE = 6;
let currentEditId = null;
let currentMode = "normal";

// ============================================================
// STAGES
// ============================================================
const REQUEST_STAGES = [
  { id: 1, name: "طلب جديد" },
  { id: 2, name: "جاري المطابقة" },
  { id: 3, name: "تم اختيار العرض" },
  { id: 4, name: "جدولة المعاينة" },
  { id: 5, name: "مكتمل ✅" },
];

function getRequestStageName(id) {
  const s = REQUEST_STAGES.find((s) => s.id === id);
  return s ? s.name : "غير معروف";
}

const REQUEST_STATUS_MAP = {
  1: { label: "جديد", color: "#f97316", statusType: "جديد" },
  2: { label: "جاري المطابقة", color: "#3b82f6", statusType: "مطابقة" },
  3: { label: "تم اختيار العرض", color: "#8b5cf6", statusType: "مختار" },
  4: { label: "جدولة المعاينة", color: "#f59e0b", statusType: "تنسيق" },
  5: { label: "مكتمل ✅", color: "#10b981", statusType: "مغلق" },
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

function getRequestStatusInfo(id) {
  return (
    REQUEST_STATUS_MAP[id] || {
      label: "غير معروف",
      color: "#9ca3af",
      statusType: "other",
    }
  );
}

function generateRequestId() {
  const nums = requests.filter((r) => {
    const id = r.display_id || r.id || "";
    return String(id).startsWith("ط-");
  }).length;
  return "ط-" + String(nums + 1).padStart(3, "0");
}

function saveRequestsLocally() {
  localStorage.setItem("masarRequestsLocal", JSON.stringify(requests));
}

function loadRequestsLocally() {
  const saved = localStorage.getItem("masarRequestsLocal");
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
    "نوع الاتفاق": "f_agreement",
    المساحة: "f_area",
    الميزانية: "f_budget",
    المدينة: "f_city",
    "المناطق المطلوبة": "f_districts",
    "اسم العميل": "f_clientName",
    "رقم التواصل": "f_phone",
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

// ============================================================
// LOAD REQUESTS
// ============================================================
async function loadRequests() {
  const isAuth = await API.auth.checkAuth(true);
  if (!isAuth) return;

  try {
    const data = await API.requests.list({ per_page: 100 });
    if (data.status === "success") {
      requests = data.data.data || [];
      const localRequests = loadRequestsLocally();
      localRequests.forEach((local) => {
        const existing = requests.find(
          (r) => String(r.id) === String(local.id)
        );
        if (existing) {
          if (local.log) existing.log = local.log;
          if (local.stage_id) existing.stage_id = local.stage_id;
          if (local.matched_offer_id)
            existing.matched_offer_id = local.matched_offer_id;
          if (local.appointmentDate)
            existing.appointmentDate = local.appointmentDate;
          if (local.appointmentTime)
            existing.appointmentTime = local.appointmentTime;
        } else {
          requests.push(local);
        }
      });
      renderTable();
      updateStats();
    } else {
      requests = loadRequestsLocally();
      if (requests.length === 0) requests = getSampleRequests();
      renderTable();
      updateStats();
      showToast("تم تحميل البيانات من التخزين المحلي", "info");
    }
  } catch (err) {
    requests = loadRequestsLocally();
    if (requests.length === 0) requests = getSampleRequests();
    renderTable();
    updateStats();
    showToast("تم تحميل البيانات من التخزين المحلي", "info");
  }
}

function getSampleRequests() {
  return [
    {
      id: "ط-١٠١",
      client_name: "أحمد محمد",
      property_type: "أرض",
      deal_type: "بيع",
      area: 600,
      budget: 1800000,
      city: "الرياض",
      districts: "حي النخيل، شارع الأمير سلطان",
      contact_phone: "0501111111",
      notes: "يفضل شارع رئيسي، تشطيب فاخر",
      created_at: "2026-07-20",
      stage_id: 5,
      matched_offer_id: "ع-١٢٣",
      log: [
        "2026-07-20 10:00 تم تسجيل الطلب",
        "2026-07-20 10:05 جاري المطابقة مع العروض",
        "2026-07-20 10:30 تم اختيار العرض ع-١٢٣",
        "2026-07-21 09:00 بدء جدولة المعاينة",
        "2026-07-22 14:00 تم تحديد موعد المعاينة",
        "2026-07-23 11:00 تمت المعاينة وتم الاتفاق",
        "2026-07-28 10:00 ✅ تم إتمام الصفقة وإغلاق الطلب",
      ],
    },
    {
      id: "ط-١٠٢",
      client_name: "سعد القحطاني",
      property_type: "محطة وقود",
      deal_type: "استثمار",
      area: 800,
      budget: 2500000,
      city: "جدة",
      districts: "حي الشاطئ، طريق الملك",
      contact_phone: "0502222222",
      notes: "قريبة من الطريق السريع",
      created_at: "2026-07-22",
      stage_id: 2,
      matched_offer_id: null,
      log: [
        "2026-07-22 10:00 تم تسجيل الطلب",
        "2026-07-22 10:05 جاري المطابقة مع العروض",
      ],
    },
  ];
}

// ============================================================
// FORCE ACTION MODAL (MATCHING)
// ============================================================
function showForceAction(requestId, actionType, message) {
  const modal = document.getElementById("forceActionModal");
  const title = document.getElementById("forceActionTitle");
  const msg = document.getElementById("forceActionMessage");
  const body = document.getElementById("forceActionBody");
  const primaryBtn = document.getElementById("forceActionPrimaryBtn");

  const r = requests.find((x) => String(x.id) === String(requestId));
  if (!r) {
    showToast("الطلب غير موجود", "error");
    return;
  }

  let titleText = "🔍 مطابقة العروض";
  let messageText = message || "عروض مطابقة للطلب:";
  let bodyHtml = "";
  let btnText = "تحديث المطابقة";

  if (actionType === "match_offers") {
    titleText = "🔍 نتائج المطابقة";
    messageText = `طلبات مطابقة للطلب <strong style="color:var(--gold);">${r.id}</strong> — ${r.property_type} | ${r.deal_type} | ${r.city}`;

    const offersData = localStorage.getItem("masarOffersLocal");
    let offers = [];
    if (offersData) {
      try {
        offers = JSON.parse(offersData);
      } catch (e) {}
    }

    const matches = offers
      .filter((o) => {
        if (o.stage_id >= 10 || o.stage_id === 7) return false;
        if (o.property_type !== r.property_type) return false;
        if (o.deal_type !== r.deal_type) return false;
        if (o.city !== r.city) return false;

        let score = 0;
        const reqDistricts = r.districts
          ? r.districts.split(/[,،\s]+/).filter((s) => s.trim())
          : [];
        const offerDistrict = o.district || "";
        let districtMatch = false;
        reqDistricts.forEach((d) => {
          if (offerDistrict.includes(d.trim())) districtMatch = true;
        });
        if (districtMatch) score += 40;

        if (o.price && o.price <= r.budget * 1.1) {
          const diff = Math.abs(o.price - r.budget) / r.budget;
          if (diff <= 0.1) score += 30;
          else if (diff <= 0.2) score += 15;
        }

        if (r.area && o.area) {
          const diff = Math.abs(o.area - r.area) / r.area;
          if (diff <= 0.1) score += 20;
          else if (diff <= 0.2) score += 10;
        }

        score = Math.min(score, 100);
        return score >= 30;
      })
      .map((o) => {
        let score = 0;
        const reqDistricts = r.districts
          ? r.districts.split(/[,،\s]+/).filter((s) => s.trim())
          : [];
        const offerDistrict = o.district || "";
        reqDistricts.forEach((d) => {
          if (offerDistrict.includes(d.trim())) score += 40;
        });
        if (o.price && o.price <= r.budget * 1.1) {
          const diff = Math.abs(o.price - r.budget) / r.budget;
          if (diff <= 0.1) score += 30;
          else if (diff <= 0.2) score += 15;
        }
        if (r.area && o.area) {
          const diff = Math.abs(o.area - r.area) / r.area;
          if (diff <= 0.1) score += 20;
          else if (diff <= 0.2) score += 10;
        }
        score = Math.min(score, 100);
        return { offer: o, score: score };
      })
      .sort((a, b) => b.score - a.score);

    if (matches.length > 0) {
      bodyHtml = `
                <div style="margin-bottom:12px;font-size:0.85rem;color:var(--text-secondary);">
                    <i class="fas fa-info-circle ml-1"></i> تم العثور على ${matches.length} عرض مطابق. اختر العرض المناسب.
                </div>
                <div id="matchResults">
                    ${matches
                      .map(
                        (m) => `
                        <div class="match-card">
                            <div style="flex:1;">
                                <div style="font-weight:700;color:var(--text-primary);">${m.offer.title || m.offer.property_type}</div>
                                <div style="font-size:0.85rem;color:var(--text-secondary);">
                                    ${m.offer.city} - ${m.offer.district || ""} · ${m.offer.area} م² · ${formatMoney(m.offer.price)}
                                </div>
                            </div>
                            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                                <span class="match-score ${m.score >= 70 ? "high" : m.score >= 40 ? "medium" : "low"}">${m.score}%</span>
                                <button class="btn btn-outline btn-sm" onclick="shareOfferToClient('${requestId}','${m.offer.id}')" style="color:var(--text-primary);border-color:var(--border-light);">
                                    <i class="fas fa-share-alt"></i> مشاركة
                                </button>
                                <button class="btn btn-gold btn-sm" onclick="selectOffer('${requestId}','${m.offer.id}')">
                                    ✅ اختيار
                                </button>
                            </div>
                        </div>
                    `,
                      )
                      .join("")}
                </div>
            `;
      btnText = "🔄 تحديث المطابقة";
    } else {
      bodyHtml = `
                <div style="color:var(--text-secondary);text-align:center;padding:20px;">
                    <i class="fas fa-search" style="font-size:2rem;display:block;margin-bottom:12px;color:var(--gold);"></i>
                    <p>⚠️ لا توجد عروض مطابقة حالياً.</p>
                    <p style="font-size:0.85rem;margin-top:8px;">يمكنك البحث خارج النظام، وإذا وجدت عرضاً جديداً، أضفه في صفحة العروض ثم عد للمطابقة.</p>
                </div>
                <div style="text-align:center;margin-top:12px;">
                    <button class="btn btn-amber btn-sm" onclick="closeModal('forceActionModal'); window.location.href='offers.html'">
                        ➕ إضافة عرض جديد
                    </button>
                    <button class="btn btn-outline btn-sm" onclick="sendToExternalBroker('${requestId}')" style="margin-right:8px;color:var(--text-primary);border-color:var(--border-light);">
                        📨 إرسال لوسيط خارجي
                    </button>
                </div>
            `;
      btnText = "🔄 تحديث المطابقة";
    }
  } else if (actionType === "offer_selected") {
    titleText = "✅ تم اختيار العرض";
    messageText = `تم ربط الطلب <strong style="color:var(--gold);">${r.id}</strong> بالعرض <strong style="color:var(--gold);">${r.matched_offer_id || "غير معروف"}</strong>`;
    bodyHtml = `
            <div style="background:var(--bg-primary);border:1px solid var(--emerald);border-radius:12px;padding:12px;margin-bottom:12px;">
                <p style="font-size:0.9rem;color:var(--emerald);">
                    <i class="fas fa-check-circle ml-1"></i> تم ربط الطلب بالعرض بنجاح. يمكنك الآن بدء مرحلة التنسيق.
                </p>
            </div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
                <button class="btn btn-gold btn-sm" onclick="advanceStage('${requestId}', 4)">📅 جدولة المعاينة</button>
                <button class="btn btn-outline btn-sm" onclick="closeModal('forceActionModal')" style="color:var(--text-primary);border-color:var(--border-light);">إغلاق</button>
            </div>
        `;
    btnText = "تحديث";
  }

  title.textContent = titleText;
  msg.innerHTML = messageText;
  body.innerHTML = bodyHtml;
  primaryBtn.textContent = btnText;

  primaryBtn.onclick = function () {
    if (requestId) {
      showForceAction(requestId, "match_offers", "عروض مطابقة للطلب:");
    }
  };

  modal.classList.add("active");
}

function executeForceAction() {}

// ============================================================
// OFFER SELECTION
// ============================================================
function selectOffer(requestId, offerId) {
  const r = requests.find((x) => String(x.id) === String(requestId));
  if (!r) {
    showToast("الطلب غير موجود", "error");
    return;
  }

  r.matched_offer_id = offerId;
  r.stage_id = 3;
  if (!r.log) r.log = [];
  r.log.push(
    `${new Date().toISOString().slice(0, 16).replace("T", " ")} ✅ تم اختيار العرض ${offerId}`
  );
  saveRequestsLocally();
  showToast("✅ تم اختيار العرض بنجاح", "success");
  closeModal("forceActionModal");
  renderTable();
  renderDetail(requestId);

  setTimeout(() => {
    showForceAction(requestId, "offer_selected", "تم اختيار العرض بنجاح");
  }, 400);
}

function shareOfferToClient(requestId, offerId) {
  const r = requests.find((x) => String(x.id) === String(requestId));
  if (!r) {
    showToast("الطلب غير موجود", "error");
    return;
  }

  const offersData = localStorage.getItem("masarOffersLocal");
  let offers = [];
  if (offersData) {
    try {
      offers = JSON.parse(offersData);
    } catch (e) {}
  }
  const o = offers.find((x) => String(x.id) === String(offerId));
  if (!o) {
    showToast("العرض غير موجود", "error");
    return;
  }

  const clientPhone = r.contact_phone || "966500000000";
  const msg =
    `📋 *عرض عقاري مطابق لطلبك*\n\n` +
    `🏷️ *الطلب:* ${r.id}\n` +
    `🏗️ *نوع العقار:* ${o.property_type}\n` +
    `🤝 *نوع الاتفاق:* ${o.deal_type || o.agreement}\n` +
    `📍 *الموقع:* ${o.city} - ${o.district || ""}\n` +
    `📐 *المساحة:* ${o.area} م²\n` +
    `💰 *السعر:* ${formatMoney(o.price)}\n` +
    `📝 *المواصفات:* ${o.description || "لا توجد"}\n` +
    `\nيرجى إعلامنا بقرارك.`;

  window.open(
    `https://wa.me/${clientPhone}?text=${encodeURIComponent(msg)}`,
    "_blank"
  );
  showToast("📱 تم فتح واتساب للعميل", "success");

  if (!r.log) r.log = [];
  r.log.push(
    `${new Date().toISOString().slice(0, 16).replace("T", " ")} 📤 تم مشاركة العرض ${offerId} مع العميل`
  );
  saveRequestsLocally();
}

function sendToExternalBroker(requestId) {
  const r = requests.find((x) => String(x.id) === String(requestId));
  if (!r) {
    showToast("الطلب غير موجود", "error");
    return;
  }

  const brokerPhone = "966500000000";
  const msg =
    `📋 *طلب عميل - ${r.id}*\n` +
    `🏗️ *نوع العقار:* ${r.property_type}\n` +
    `🤝 *نوع الاتفاق:* ${r.deal_type}\n` +
    `📍 *المدينة:* ${r.city}\n` +
    `📍 *المناطق:* ${r.districts}\n` +
    `📐 *المساحة:* ${r.area} م²\n` +
    `💰 *الميزانية:* ${formatMoney(r.budget)}\n` +
    `📝 *ملاحظات:* ${r.notes || "لا توجد"}\n\n` +
    `يرجى المساعدة في إيجاد عرض مناسب.`;

  window.open(
    `https://wa.me/${brokerPhone}?text=${encodeURIComponent(msg)}`,
    "_blank"
  );
  showToast("📨 تم فتح واتساب للوسيط الخارجي", "success");

  if (!r.log) r.log = [];
  r.log.push(
    `${new Date().toISOString().slice(0, 16).replace("T", " ")} 📨 تم إرسال الطلب لوسيط خارجي`
  );
  saveRequestsLocally();
  closeModal("forceActionModal");
  renderTable();
  renderDetail(requestId);
}

// ============================================================
// APPOINTMENT FUNCTIONS
// ============================================================
function setAppointment(requestId) {
  const r = requests.find((x) => String(x.id) === String(requestId));
  if (!r) {
    showToast("الطلب غير موجود", "error");
    return;
  }

  const date = prompt(
    "أدخل تاريخ المعاينة (YYYY-MM-DD):",
    new Date().toISOString().slice(0, 10)
  );
  if (!date) return;
  const time = prompt("أدخل وقت المعاينة (HH:MM):", "10:00");
  if (!time) return;

  r.appointmentDate = date;
  r.appointmentTime = time;
  if (!r.log) r.log = [];
  r.log.push(
    `${new Date().toISOString().slice(0, 16).replace("T", " ")} 📅 تم تحديد موعد المعاينة: ${date} ${time}`
  );
  r.stage_id = 4;
  saveRequestsLocally();
  showToast("✅ تم تسجيل موعد المعاينة", "success");
  renderDetail(requestId);
  renderTable();
}

function editAppointment(requestId) {
  const r = requests.find((x) => String(x.id) === String(requestId));
  if (!r) {
    showToast("الطلب غير موجود", "error");
    return;
  }

  const currentDate = r.appointmentDate || new Date().toISOString().slice(0, 10);
  const currentTime = r.appointmentTime || "10:00";
  const date = prompt("تعديل تاريخ المعاينة (YYYY-MM-DD):", currentDate);
  if (!date) return;
  const time = prompt("تعديل وقت المعاينة (HH:MM):", currentTime);
  if (!time) return;

  r.appointmentDate = date;
  r.appointmentTime = time;
  if (!r.log) r.log = [];
  r.log.push(
    `${new Date().toISOString().slice(0, 16).replace("T", " ")} ✏️ تم تعديل موعد المعاينة إلى: ${date} ${time}`
  );
  saveRequestsLocally();
  showToast("✅ تم تعديل موعد المعاينة", "success");
  renderDetail(requestId);
  renderTable();
}

function confirmAppointment(requestId) {
  const r = requests.find((x) => String(x.id) === String(requestId));
  if (!r) {
    showToast("الطلب غير موجود", "error");
    return;
  }

  if (!r.appointmentDate || !r.appointmentTime) {
    showToast("⚠️ يرجى تحديد موعد المعاينة أولاً", "error");
    return;
  }

  if (!confirm("هل تمت المعاينة بنجاح وحضر الطرفان؟")) return;

  const choice = confirm(
    'هل تم الاتفاق مع صاحب العرض؟\nاضغط "موافق" إذا تم الاتفاق، "إلغاء" إذا لم يتم الاتفاق.'
  );
  if (choice) {
    r.stage_id = 5;
    if (!r.log) r.log = [];
    r.log.push(
      `${new Date().toISOString().slice(0, 16).replace("T", " ")} ✅ تم الاتفاق وإتمام الصفقة (تم إغلاق الطلب والعرض)`
    );

    if (r.matched_offer_id) {
      const offersData = localStorage.getItem("masarOffersLocal");
      let offers = [];
      if (offersData) {
        try {
          offers = JSON.parse(offersData);
        } catch (e) {}
      }
      const matchedOffer = offers.find(
        (off) => String(off.id) === String(r.matched_offer_id)
      );
      if (matchedOffer) {
        matchedOffer.stage_id = 10;
        matchedOffer.status = "مباع";
        if (!matchedOffer.log) matchedOffer.log = [];
        matchedOffer.log.push(
          `${new Date().toISOString().slice(0, 16).replace("T", " ")} ✅ تم إغلاق العرض المرتبط بالطلب ${r.id}`
        );
        localStorage.setItem("masarOffersLocal", JSON.stringify(offers));
        showToast(`✅ تم إغلاق العرض ${matchedOffer.id} تلقائياً`, "success");
      }
    }
    saveRequestsLocally();
    showToast("🎉 تم إتمام الصفقة وإغلاق الطلب", "success");
    renderDetail(requestId);
    renderTable();
  } else {
    r.stage_id = 2;
    r.matched_offer_id = null;
    r.appointmentDate = null;
    r.appointmentTime = null;
    if (!r.log) r.log = [];
    r.log.push(
      `${new Date().toISOString().slice(0, 16).replace("T", " ")} 🔄 لم يتم الاتفاق، تم فك الارتباط بالعرض والعودة للمطابقة`
    );
    saveRequestsLocally();
    showToast("🔄 تم فك الارتباط والعودة للمطابقة", "info");
    renderDetail(requestId);
    renderTable();
    setTimeout(() => {
      showForceAction(requestId, "match_offers", "ابحث عن عرض آخر للعميل.");
    }, 600);
  }
}

// ============================================================
// SAVE REQUEST
// ============================================================
function saveRequest() {
  const editId = document.getElementById("editRequestId").value;
  const propertyType = document.getElementById("f_type").value;
  const dealType = document.getElementById("f_agreement").value;
  const area = parseFloat(document.getElementById("f_area").value);
  const budget = parseFloat(document.getElementById("f_budget").value);
  const city = document.getElementById("f_city").value.trim();
  const districts = document.getElementById("f_districts").value.trim();
  const clientName = document.getElementById("f_clientName").value.trim();
  const phone = document.getElementById("f_phone").value.trim();
  const notes = document.getElementById("f_notes").value.trim();

  if (
    !propertyType ||
    !dealType ||
    !area ||
    isNaN(area) ||
    !budget ||
    isNaN(budget) ||
    !city ||
    !districts ||
    !clientName ||
    !phone
  ) {
    showToast("يرجى ملء جميع الحقول المطلوبة (*)", "error");
    return;
  }

  const now = new Date().toISOString().slice(0, 16).replace("T", " ");

  if (editId) {
    const r = requests.find((x) => String(x.id) === String(editId));
    if (!r) {
      showToast("الطلب غير موجود", "error");
      return;
    }
    r.property_type = propertyType;
    r.deal_type = dealType;
    r.area = area;
    r.budget = budget;
    r.city = city;
    r.districts = districts;
    r.client_name = clientName;
    r.contact_phone = phone;
    r.notes = notes || "لا توجد ملاحظات";
    if (!r.log) r.log = [];
    r.log.push(now + " ✏️ تم تعديل الطلب");
    saveRequestsLocally();
    closeModal("requestModal");
    showToast("✅ تم تحديث الطلب بنجاح", "success");
    renderTable();
    if (!document.getElementById("detailView").classList.contains("hidden")) {
      renderDetail(editId);
    }
    return;
  }

  const id = generateRequestId();
  const newRequest = {
    id: id,
    client_name: clientName,
    property_type: propertyType,
    deal_type: dealType,
    area: area,
    budget: budget,
    city: city,
    districts: districts,
    contact_phone: phone,
    notes: notes || "لا توجد ملاحظات",
    created_at: new Date().toISOString().slice(0, 10),
    stage_id: 1,
    matched_offer_id: null,
    appointmentDate: null,
    appointmentTime: null,
    log: [now + " 📝 تم تسجيل الطلب"],
  };

  requests.push(newRequest);
  saveRequestsLocally();
  closeModal("requestModal");
  showToast(`✅ تم إضافة الطلب ${id}`, "success");
  renderTable();

  setTimeout(() => {
    newRequest.stage_id = 2;
    if (!newRequest.log) newRequest.log = [];
    newRequest.log.push(
      `${new Date().toISOString().slice(0, 16).replace("T", " ")} 🔍 جاري المطابقة مع العروض`
    );
    saveRequestsLocally();
    renderTable();
    showForceAction(id, "match_offers", "عروض مطابقة للطلب:");
  }, 600);
}

// ============================================================
// RENDER FUNCTIONS
// ============================================================
function renderTable() {
  const filtered = getFilteredRequests();
  const total = filtered.length;
  const totalPages = Math.ceil(total / PAGE_SIZE) || 1;
  if (currentPage > totalPages) currentPage = totalPages;
  const start = (currentPage - 1) * PAGE_SIZE;
  const end = Math.min(start + PAGE_SIZE, total);
  const pageItems = filtered.slice(start, end);

  const tbody = document.getElementById("requestsTableBody");
  if (pageItems.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center py-12 text-muted"><i class="fas fa-inbox text-3xl block mb-2"></i> لا توجد طلبات</td></tr>`;
  } else {
    tbody.innerHTML = pageItems
      .map((r) => {
        const st = getRequestStatusInfo(r.stage_id);
        const stageName = getRequestStageName(r.stage_id);
        const isPulse = [2, 4].includes(r.stage_id);
        const displayId = r.display_id || r.id || "-";
        return `
                <tr class="request-row" onclick="openDetail('${r.id}')">
                    <td class="px-3 py-3 font-bold text-gold text-sm">${displayId}</td>
                    <td class="px-3 py-3 text-sm text-ink">${r.client_name || "-"}</td>
                    <td class="px-3 py-3 text-sm text-ink">${r.property_type}</td>
                    <td class="px-3 py-3 text-sm text-ink">${r.deal_type || "-"}</td>
                    <td class="px-3 py-3 text-sm max-w-[120px] truncate text-muted" title="${stageName}">${stageName}</td>
                    <td class="px-3 py-3">
                        <span class="status-badge" style="background:${st.color}22; color:${st.color}; border:1px solid ${st.color}55;">
                            <span class="status-dot ${isPulse ? "pulse" : ""}" style="background:${st.color};"></span>
                            ${st.label}
                        </span>
                    </td>
                    <td class="px-3 py-3 text-sm text-muted">${formatDate(r.created_at)}</td>
                    <td class="px-3 py-3">
                        <div class="flex items-center gap-1">
                            <button class="text-muted hover:text-gold px-1" onclick="event.stopPropagation(); openDetail('${r.id}')" title="عرض التفاصيل"><i class="fas fa-eye"></i></button>
                            <button class="text-muted hover:text-gold px-1" onclick="event.stopPropagation(); openEditRequest('${r.id}')" title="تعديل"><i class="fas fa-pen"></i></button>
                            <button class="text-muted hover:text-danger px-1" onclick="event.stopPropagation(); deleteRequest('${r.id}')" title="حذف"><i class="fas fa-trash"></i></button>
                        </div>
                    </td>
                </tr>
            `;
      })
      .join("");
  }

  const cardList = document.getElementById("requestsCardList");
  if (pageItems.length === 0) {
    cardList.innerHTML = `<div class="text-center py-12 text-muted"><i class="fas fa-inbox text-3xl block mb-2"></i> لا توجد طلبات</div>`;
  } else {
    cardList.innerHTML = pageItems
      .map((r) => {
        const st = getRequestStatusInfo(r.stage_id);
        const stageName = getRequestStageName(r.stage_id);
        const isPulse = [2, 4].includes(r.stage_id);
        const appointmentInfo =
          r.stage_id === 4 && r.appointmentDate
            ? ` 📅 ${formatDate(r.appointmentDate)} ${r.appointmentTime || ""}`
            : "";
        return `
                <div class="request-card-item" onclick="openDetail('${r.id}')">
                    <div class="top-row">
                        <span class="req-id">${r.id}</span>
                        <span class="status-badge" style="background:${st.color}22; color:${st.color}; border:1px solid ${st.color}55; font-size:0.7rem;">
                            <span class="status-dot ${isPulse ? "pulse" : ""}" style="background:${st.color};"></span>
                            ${st.label}
                        </span>
                    </div>
                    <div class="req-meta">
                        <span><i class="far fa-user ml-1"></i> ${r.client_name || "-"}</span>
                        <span><i class="fas fa-tag ml-1"></i> ${r.property_type}</span>
                        <span><i class="fas fa-handshake ml-1"></i> ${r.deal_type || "-"}</span>
                        <span><i class="fas fa-map-marker-alt ml-1"></i> ${r.city}</span>
                        <span><i class="fas fa-route ml-1"></i> ${stageName}</span>
                    </div>
                    <div style="font-size:0.8rem;color:var(--text-secondary);margin-top:4px">
                        <i class="far fa-calendar ml-1"></i> ${formatDate(r.created_at)}
                        ${appointmentInfo ? `<span style="margin-right:12px;">${appointmentInfo}</span>` : ""}
                        <span style="margin-right:12px"><i class="fas fa-phone ml-1"></i> ${r.contact_phone || "-"}</span>
                    </div>
                    <div class="req-actions">
                        <button onclick="event.stopPropagation(); openDetail('${r.id}')"><i class="fas fa-eye"></i> عرض</button>
                        <button onclick="event.stopPropagation(); openEditRequest('${r.id}')"><i class="fas fa-pen"></i> تعديل</button>
                        <button class="danger" onclick="event.stopPropagation(); deleteRequest('${r.id}')"><i class="fas fa-trash"></i> حذف</button>
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

function getFilteredRequests() {
  const search = document
    .getElementById("searchInput")
    .value.trim()
    .toLowerCase();
  const type = document.getElementById("typeFilter").value;
  const status = document.getElementById("statusFilter").value;
  const from = document.getElementById("dateFrom").value;
  const to = document.getElementById("dateTo").value;

  let filtered = requests.filter((r) => {
    if (type !== "all" && r.property_type !== type) return false;
    if (status !== "all") {
      const st = getRequestStatusInfo(r.stage_id);
      if (st.statusType !== status) return false;
    }
    if (search) {
      const displayId = r.display_id || r.id || "";
      const match =
        displayId.includes(search) ||
        (r.client_name || "").includes(search) ||
        (r.property_type || "").includes(search) ||
        (r.city || "").includes(search) ||
        (r.contact_phone || "").includes(search);
      if (!match) return false;
    }
    if (from && r.created_at && r.created_at.slice(0, 10) < from) return false;
    if (to && r.created_at && r.created_at.slice(0, 10) > to) return false;
    return true;
  });
  return filtered;
}

function goPage(p) {
  const filtered = getFilteredRequests();
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
  const total = requests.length;
  document.getElementById("totalRequests").textContent = total;
  const pending = requests.filter((r) => r.stage_id === 2).length;
  const completed = requests.filter((r) => r.stage_id === 5).length;
  document.getElementById("pendingRequests").textContent = pending;
  document.getElementById("completedRequests").textContent = completed;
  const land = requests.filter((r) => r.property_type === "أرض").length;
  const other = requests.filter((r) => r.property_type !== "أرض").length;
  document.getElementById("countLand").textContent = land;
  document.getElementById("countOther").textContent = other;
}

function deleteRequest(id) {
  if (!confirm(`هل أنت متأكد من حذف الطلب ${id}؟`)) return;
  requests = requests.filter((r) => String(r.id) !== String(id));
  saveRequestsLocally();
  renderTable();
  showToast(`تم حذف الطلب ${id}`, "success");
}

// ============================================================
// DETAIL VIEW
// ============================================================
function openDetail(id) {
  const r = requests.find((x) => String(x.id) === String(id));
  if (!r) {
    showToast("الطلب غير موجود", "error");
    return;
  }
  document.getElementById("listView").classList.add("hidden");
  document.getElementById("detailView").classList.remove("hidden");
  renderDetail(id);
}

function renderDetail(id) {
  const r = requests.find((x) => String(x.id) === String(id));
  if (!r) {
    document.getElementById("detailContent").innerHTML =
      '<div class="text-center py-12 text-muted">الطلب غير موجود</div>';
    return;
  }

  const st = getRequestStatusInfo(r.stage_id);
  const stageName = getRequestStageName(r.stage_id);
  const isComplete = r.stage_id === 5;
  const isDelayed = r.stage_id === 2 || r.stage_id === 4;

  let timelineHtml = REQUEST_STAGES.map((s, idx) => {
    const isCompleted = idx < r.stage_id;
    const isActive = idx === r.stage_id - 1;
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
                    ${idx < REQUEST_STAGES.length - 1 ? `<div class="timeline-line ${lineClass}"></div>` : ""}
                </div>
                <div class="timeline-content">
                    <div class="stage-name">${s.name}</div>
                    ${isActive ? `<div class="stage-date">🔵 المرحلة الحالية</div>` : ""}
                </div>
            </div>
        `;
  }).join("");

  let logHtml =
    (r.log || [])
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

  let actionsHtml = "";
  if (!isComplete) {
    if (r.stage_id === 1 || r.stage_id === 2) {
      actionsHtml += `<button class="btn btn-gold btn-sm" onclick="showForceAction('${r.id}','match_offers','عروض مطابقة للطلب:')">🔍 المطابقة</button>`;
    }
    if (r.stage_id === 3) {
      actionsHtml += `<button class="btn btn-gold btn-sm" onclick="advanceStage('${r.id}', 4)">📅 جدولة المعاينة</button>`;
    }
    if (r.stage_id === 4) {
      if (!r.appointmentDate) {
        actionsHtml += `<button class="btn btn-gold btn-sm" onclick="setAppointment('${r.id}')">📅 تحديد موعد</button>`;
      } else {
        actionsHtml += `<button class="btn btn-outline btn-sm" onclick="editAppointment('${r.id}')" style="color:var(--text-primary);border-color:var(--border-light);"><i class="fas fa-pen"></i> تعديل الموعد</button>`;
        actionsHtml += `<button class="btn btn-emerald btn-sm" onclick="confirmAppointment('${r.id}')">✅ تأكيد الحضور</button>`;
      }
    }
    if (r.stage_id === 2 || r.stage_id === 3) {
      actionsHtml += `<button class="btn btn-amber btn-sm" onclick="sendToExternalBroker('${r.id}')">📨 إرسال لوسيط</button>`;
    }
    actionsHtml += `<button class="btn btn-outline btn-sm" onclick="openEditRequest('${r.id}')" style="color:var(--text-primary);border-color:var(--border-light);"><i class="fas fa-pen"></i> تعديل</button>`;
    if (r.stage_id > 1) {
      actionsHtml += `<button class="btn btn-outline btn-sm" onclick="regressStage('${r.id}')" style="color:var(--text-primary);border-color:var(--border-light);"><i class="fas fa-undo"></i> رجوع</button>`;
    }
  } else {
    actionsHtml = `<span class="text-emerald-400 font-bold text-lg">✅ الطلب مكتمل</span>`;
  }

  let matchedOfferHtml = "";
  if (r.matched_offer_id) {
    matchedOfferHtml = `
            <div style="background:var(--bg-primary);border:1px solid var(--emerald);border-radius:12px;padding:12px;margin-bottom:12px;">
                <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
                    <div>
                        <span style="font-weight:700;color:var(--emerald);">🔗 مرتبط بالعرض</span>
                        <div style="font-weight:700;font-size:1.1rem;color:var(--text-primary);">${r.matched_offer_id}</div>
                    </div>
                    <button class="btn btn-outline btn-sm" onclick="window.location.href='offers-detail.html?id=${r.matched_offer_id}'" style="color:var(--text-primary);border-color:var(--border-light);">
                        <i class="fas fa-external-link-alt ml-1"></i> عرض التفاصيل
                    </button>
                </div>
            </div>
        `;
  }

  let appointmentHtml = "";
  if (r.stage_id === 4 || r.stage_id === 3 || r.stage_id === 5) {
    if (r.appointmentDate) {
      appointmentHtml = `
                <div style="background:var(--bg-primary);border:1px solid var(--gold);border-radius:12px;padding:12px;margin:12px 0;">
                    <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;">
                        <div>
                            <span style="font-weight:700;color:var(--gold);">📅 موعد المعاينة</span>
                            <div style="font-weight:700;font-size:1.1rem;color:var(--text-primary);">${formatDate(r.appointmentDate)} ${r.appointmentTime || ""}</div>
                        </div>
                        <div style="display:flex;gap:8px;flex-wrap:wrap;">
                            <button class="btn btn-outline btn-sm" onclick="editAppointment('${r.id}')" style="color:var(--text-primary);border-color:var(--border-light);"><i class="fas fa-pen"></i> تعديل</button>
                            <button class="btn btn-gold btn-sm" onclick="confirmAppointment('${r.id}')">✅ تأكيد الحضور</button>
                        </div>
                    </div>
                </div>
            `;
    } else if (r.stage_id === 4) {
      appointmentHtml = `
                <div style="background:var(--bg-primary);border:1px solid var(--gold);border-radius:12px;padding:12px;margin:12px 0;">
                    <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;">
                        <div>
                            <span style="font-weight:700;color:var(--gold);">⏳ لم يتم تحديد موعد المعاينة بعد</span>
                        </div>
                        <button class="btn btn-gold btn-sm" onclick="setAppointment('${r.id}')">📅 تحديد موعد</button>
                    </div>
                </div>
            `;
    }
  }

  const html = `
        <div class="detail-section">
            <div class="flex flex-wrap justify-between items-start gap-4">
                <div>
                    <h2 class="text-2xl font-extrabold text-gold">${r.id} — ${r.property_type}</h2>
                    <div class="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted">
                        <span><i class="far fa-user ml-1"></i> ${r.client_name || "-"}</span>
                        <span><i class="far fa-phone ml-1"></i> ${r.contact_phone || "-"}</span>
                        <span><i class="far fa-calendar ml-1"></i> ${formatDate(r.created_at)}</span>
                        <span class="status-badge" style="background:${st.color}22; color:${st.color}; border:1px solid ${st.color}55;">
                            <span class="status-dot ${isDelayed ? "pulse" : ""}" style="background:${st.color};"></span>
                            ${st.label}
                        </span>
                        <span class="text-xs bg-surface3 px-2 py-1 rounded-full">👤 شخصي</span>
                    </div>
                </div>
                <div class="flex flex-wrap gap-2">${actionsHtml}</div>
            </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="detail-section">
                <div class="section-title"><i class="fas fa-info-circle text-gold"></i> تفاصيل الطلب</div>
                <div class="grid grid-cols-2 gap-4">
                    <div><span class="text-sm text-muted">نوع العقار</span><div class="font-bold text-ink">${r.property_type}</div></div>
                    <div><span class="text-sm text-muted">نوع الاتفاق</span><div class="font-bold text-ink">${r.deal_type || "-"}</div></div>
                    <div><span class="text-sm text-muted">المساحة</span><div class="font-bold text-ink">${r.area || "-"} م²</div></div>
                    <div><span class="text-sm text-muted">الميزانية</span><div class="font-bold text-gold">${formatMoney(r.budget)}</div></div>
                    <div><span class="text-sm text-muted">المدينة</span><div class="font-bold text-ink">${r.city || "-"}</div></div>
                    <div class="col-span-2"><span class="text-sm text-muted">المناطق المطلوبة</span><div class="font-bold text-ink">${r.districts || "-"}</div></div>
                    <div class="col-span-2"><span class="text-sm text-muted">ملاحظات</span><div class="text-sm text-ink">${r.notes || "-"}</div></div>
                </div>
            </div>

            <div class="detail-section">
                <div class="section-title"><i class="fas fa-user-tie text-gold"></i> معلومات العميل</div>
                <div class="space-y-2">
                    <div><span class="text-sm text-muted">الاسم</span><div class="font-bold text-ink">${r.client_name || "-"}</div></div>
                    <div><span class="text-sm text-muted">رقم الجوال</span><div class="text-ink">${r.contact_phone || "-"}</div></div>
                </div>
                <div style="margin-top:16px;padding-top:16px;border-top:1px solid var(--border-color);">
                    <div class="section-title" style="font-size:15px;margin-bottom:8px;"><i class="fas fa-handshake text-gold"></i> العرض المرتبط</div>
                    ${matchedOfferHtml || '<div style="color:var(--text-secondary);">لا يوجد عرض مرتبط بعد</div>'}
                    ${appointmentHtml}
                </div>
            </div>
        </div>

        <div class="detail-section">
            <div class="section-title"><i class="fas fa-route text-gold"></i> مسار الطلب</div>
            <div class="timeline">${timelineHtml}</div>
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
function advanceStage(id, newStage) {
  const r = requests.find((x) => String(x.id) === String(id));
  if (!r) {
    showToast("الطلب غير موجود", "error");
    return;
  }

  if (newStage === 4 && !r.matched_offer_id) {
    showToast(
      "⚠️ لا يمكن بدء جدولة المعاينة بدون اختيار عرض مطابق أولاً",
      "error"
    );
    return;
  }

  r.stage_id = newStage;
  const stageName = getRequestStageName(newStage);
  if (!r.log) r.log = [];
  r.log.push(
    `${new Date().toISOString().slice(0, 16).replace("T", " ")} ➡️ ${stageName}`
  );
  saveRequestsLocally();
  showToast(`✅ تم الانتقال إلى "${stageName}"`, "success");
  renderDetail(id);
  renderTable();
}

function regressStage(id) {
  const r = requests.find((x) => String(x.id) === String(id));
  if (!r) {
    showToast("الطلب غير موجود", "error");
    return;
  }
  if (r.stage_id <= 1) {
    showToast("لا يمكن الرجوع عن المرحلة الأولى", "error");
    return;
  }
  r.stage_id--;
  const stageName = getRequestStageName(r.stage_id);
  if (!r.log) r.log = [];
  r.log.push(
    `${new Date().toISOString().slice(0, 16).replace("T", " ")} 🔄 رجوع إلى "${stageName}"`
  );
  saveRequestsLocally();
  showToast(`↩️ تم الرجوع إلى "${stageName}"`, "info");
  renderDetail(id);
  renderTable();
}

// ============================================================
// MODAL
// ============================================================
function openAddRequest() {
  currentEditId = null;
  document.getElementById("modalTitle").textContent = "طلب جديد";
  document.getElementById("editRequestId").value = "";
  document.getElementById("requestForm").reset();
  document.getElementById("f_type").value = "";
  document.getElementById("f_agreement").value = "";
  document.getElementById("smartInput").value = "";
  document.getElementById("smartFeedback").classList.remove("show");
  setMode("normal");
  document.getElementById("requestModal").classList.add("active");
}

function openEditRequest(id) {
  const r = requests.find((x) => String(x.id) === String(id));
  if (!r) {
    showToast("الطلب غير موجود", "error");
    return;
  }
  currentEditId = id;
  document.getElementById("modalTitle").textContent = "تعديل الطلب";
  document.getElementById("editRequestId").value = id;
  document.getElementById("f_type").value = r.property_type || "";
  document.getElementById("f_agreement").value = r.deal_type || "";
  document.getElementById("f_area").value = r.area || "";
  document.getElementById("f_budget").value = r.budget || "";
  document.getElementById("f_city").value = r.city || "";
  document.getElementById("f_districts").value = r.districts || "";
  document.getElementById("f_clientName").value = r.client_name || "";
  document.getElementById("f_phone").value = r.contact_phone || "";
  document.getElementById("f_notes").value = r.notes || "";
  document.getElementById("smartInput").value = "";
  document.getElementById("smartFeedback").classList.remove("show");
  setMode("normal");
  document.getElementById("requestModal").classList.add("active");
}

function closeModal(id) {
  document.getElementById(id).classList.remove("active");
}

// ============================================================
// EXPORT
// ============================================================
function exportRequestsExcel() {
  if (requests.length === 0) {
    showToast("لا توجد بيانات", "error");
    return;
  }
  const headers = [
    "رقم الطلب",
    "العميل",
    "نوع العقار",
    "نوع الاتفاق",
    "المدينة",
    "المناطق",
    "المساحة",
    "الميزانية",
    "المرحلة",
    "الحالة",
    "التاريخ",
    "موعد المعاينة",
    "ملاحظات",
  ];
  const rows = requests.map((r) => {
    const st = getRequestStatusInfo(r.stage_id);
    const appointment = r.appointmentDate
      ? formatDate(r.appointmentDate) + " " + (r.appointmentTime || "")
      : "-";
    return [
      r.id,
      r.client_name,
      r.property_type,
      r.deal_type,
      r.city || "",
      r.districts || "",
      r.area,
      r.budget || 0,
      getRequestStageName(r.stage_id),
      st.label,
      r.created_at,
      appointment,
      r.notes || "",
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
  link.download = `تقرير_الطلبات_${new Date().toISOString().slice(0, 10)}.csv`;
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
    if (!document.getElementById("detailView").classList.contains("hidden"))
      closeDetail();
  }
  if ((e.ctrlKey || e.metaKey) && e.key === "n") {
    e.preventDefault();
    openAddRequest();
  }
});

// ============================================================
// INIT
// ============================================================
document.addEventListener("DOMContentLoaded", async function () {
  const isAuth = await API.auth.checkAuth(true);
  if (isAuth) {
    const main = document.getElementById("mainContent");
    if (main) {
      main.style.display = "block";
      main.classList.add("visible");
    }
    loadRequests();
    setInterval(() => loadRequests(), 60000);
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }
});

// ============================================================
// EXPOSE GLOBALS
// ============================================================
window.openAddRequest = openAddRequest;
window.openEditRequest = openEditRequest;
window.closeModal = closeModal;
window.saveRequest = saveRequest;
window.deleteRequest = deleteRequest;
window.openDetail = openDetail;
window.closeDetail = closeDetail;
window.advanceStage = advanceStage;
window.regressStage = regressStage;
window.filterTable = filterTable;
window.goPage = goPage;
window.exportRequestsExcel = exportRequestsExcel;
window.showToast = showToast;
window.setMode = setMode;
window.parseSmartInput = parseSmartInput;
window.showForceAction = showForceAction;
window.selectOffer = selectOffer;
window.shareOfferToClient = shareOfferToClient;
window.sendToExternalBroker = sendToExternalBroker;
window.setAppointment = setAppointment;
window.editAppointment = editAppointment;
window.confirmAppointment = confirmAppointment;
window.loadRequests = loadRequests;