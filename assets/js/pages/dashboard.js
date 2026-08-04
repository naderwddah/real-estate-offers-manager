// ============================================================
// assets/js/pages/dashboard.js - لوحة التحكم الرئيسية
// مع إصلاح إظهار المحتوى وإضافة التحقق من المصادقة
// ============================================================

let dashboardData = {};
let refreshInterval = null;

// ============================================================
// TOAST HELPER
// ============================================================
function showToast(message, type = "success") {
  const toast = document.getElementById("toast");
  const toastMsg = document.getElementById("toastMessage");
  if (!toast || !toastMsg) return;

  // إعادة تعيين الأيقونة حسب النوع
  const icon = toast.querySelector("i");
  if (icon) {
    if (type === "success") {
      icon.className = "fas fa-check-circle text-emerald-400";
    } else if (type === "error") {
      icon.className = "fas fa-exclamation-circle text-red-400";
    } else {
      icon.className = "fas fa-info-circle text-blue-400";
    }
  }

  toast.className = "toast show " + type;
  toastMsg.textContent = message;
  clearTimeout(toast._hideTimeout);
  toast._hideTimeout = setTimeout(() => {
    toast.classList.remove("show");
  }, 4000);
}

// ============================================================
// RENDER FUNCTIONS
// ============================================================

/**
 * عرض البطاقات الإحصائية
 */
function renderStats(data) {
  const stats = [
    {
      label: "العروض",
      value: data.total_offers || 0,
      icon: "fa-file-signature",
      color: "blue",
      link: "offers.html",
    },
    {
      label: "الطلبات",
      value: data.total_requests || 0,
      icon: "fa-clipboard-list",
      color: "purple",
      link: "requests.html",
    },
    {
      label: "عروض نشطة",
      value: data.active_offers || 0,
      icon: "fa-check-circle",
      color: "emerald",
      link: "offers.html",
    },
    {
      label: "قيد المطابقة",
      value: data.pending_requests || 0,
      icon: "fa-hourglass-half",
      color: "amber",
      link: "requests.html",
    },
    {
      label: "معاينات اليوم",
      value: data.today_appointments || 0,
      icon: "fa-calendar-check",
      color: "blue",
      link: "#",
      onclick: "showTodayAppointments()",
    },
    {
      label: "متأخرة",
      value: data.delayed || 0,
      icon: "fa-exclamation-triangle",
      color: "red",
      link: "#",
    },
  ];

  const grid = document.getElementById("statsGrid");
  if (!grid) return;

  grid.innerHTML = stats
    .map(
      (s) => `
        <div class="stat-card rounded-xl px-3 py-3 md:py-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow" 
             onclick="${s.onclick ? s.onclick : (s.link ? `window.location.href='${s.link}'` : '')}">
            <div class="flex items-center gap-3">
                <div class="stat-icon bg-${s.color}-50 text-${s.color}-600 w-10 h-10 flex items-center justify-center rounded-xl">
                    <i class="fas ${s.icon}"></i>
                </div>
                <div>
                    <p class="text-xs text-gray-400 font-medium">${s.label}</p>
                    <p class="text-xl md:text-2xl font-bold text-[#1e3a5f]">${s.value}</p>
                </div>
            </div>
        </div>
    `,
    )
    .join("");

  // تحديث العدادات في الهيدر
  document.getElementById("alertCount").textContent =
    (data.alerts?.length || 0) + " تنبيه";
  document.getElementById("appointmentCount").textContent =
    data.today_appointments || 0;
}

/**
 * عرض التنبيهات
 */
function renderAlerts(data) {
  const container = document.getElementById("alertsContainer");
  if (!container) return;

  const alerts = data.alerts || [];
  if (alerts.length === 0) {
    container.innerHTML = `
      <div class="text-center py-8 text-gray-400">
        <i class="fas fa-check-circle text-2xl block mb-2"></i>
        لا توجد تنبيهات
      </div>`;
    return;
  }

  container.innerHTML = alerts
    .slice(0, 6)
    .map(
      (a) => `
        <div class="alert-item rounded-xl p-3 mb-2 flex items-center justify-between ${a.level || 'info'}">
            <div class="flex items-center gap-3">
                <span class="text-lg">${a.icon || "📌"}</span>
                <div>
                    <div class="text-sm font-medium">${a.title || a.message || ""}</div>
                    <div class="text-xs text-gray-500">${a.detail || a.description || ""}</div>
                </div>
            </div>
            ${a.link ? `<button onclick="window.location.href='${a.link}'" class="text-xs text-[#1e3a5f] hover:underline font-bold">عرض</button>` : ""}
        </div>
    `,
    )
    .join("");
}

/**
 * عرض معاينات اليوم
 */
function renderAppointments(data) {
  const container = document.getElementById("appointmentsContainer");
  if (!container) return;

  const appointments = data.today_appointments_list || [];
  if (appointments.length === 0) {
    container.innerHTML = `
      <div class="text-center py-8 text-gray-400">
        <i class="fas fa-calendar-day text-2xl block mb-2"></i>
        لا توجد معاينات اليوم
      </div>`;
    return;
  }

  container.innerHTML = appointments
    .slice(0, 6)
    .map(
      (a) => `
        <div class="flex items-center gap-3 p-3 bg-slate-50 rounded-xl mb-2 hover:bg-slate-100 transition-colors">
            <div class="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">${(a.client || a.contact_name || "?").charAt(0)}</div>
            <div class="flex-1">
                <div class="text-sm font-semibold">${a.client || a.contact_name || "عميل"}</div>
                <div class="text-xs text-gray-500">${a.type || a.deal_type || ""} · ${a.appointment_time || a.time || "غير محدد"}</div>
                <div class="text-xs text-gray-400">${a.display_id || a.id || ""}</div>
            </div>
            <button onclick="window.location.href='${a.link || "requests.html"}'" class="text-xs text-[#1e3a5f] font-bold hover:underline">فتح</button>
        </div>
    `,
    )
    .join("");
}

/**
 * عرض المخططات البيانية
 */
function renderCharts(data) {
  // مخطط توزيع العقارات حسب النوع
  const types = data.property_types || {};
  const labels = Object.keys(types);
  const values = Object.values(types);
  const max = Math.max(...values, 1);
  const colors = ["#10b981", "#f59e0b", "#3b82f6", "#8b5cf6", "#ef4444"];

  const chartContainer = document.getElementById("propertyChart");
  if (chartContainer) {
    if (labels.length === 0) {
      chartContainer.innerHTML =
        `<div class="text-center text-gray-400 w-full">لا توجد بيانات كافية</div>`;
    } else {
      chartContainer.innerHTML = labels
        .map(
          (label, i) => `
            <div class="flex flex-col items-center gap-2 flex-1">
                <span class="text-xs font-bold text-gray-600">${values[i]}</span>
                <div class="w-full max-w-[40px] rounded-t-lg chart-bar" style="height:${(values[i] / max) * 120}px; background:${colors[i % colors.length]}; transition: height 0.6s ease;"></div>
                <span class="text-xs text-gray-500 truncate max-w-[60px]">${label}</span>
            </div>
        `,
        )
        .join("");
    }
  }

  // مخطط حالات الطلبات
  const statuses = data.request_statuses || {};
  const statusLabels = Object.keys(statuses);
  const statusValues = Object.values(statuses);
  const statusMax = Math.max(...statusValues, 1);

  const requestChart = document.getElementById("requestChart");
  if (requestChart) {
    if (statusLabels.length === 0) {
      requestChart.innerHTML =
        `<div class="text-center text-gray-400 w-full">لا توجد بيانات كافية</div>`;
    } else {
      requestChart.innerHTML = statusLabels
        .map(
          (label, i) => `
            <div class="flex flex-col items-center gap-2 flex-1">
                <span class="text-xs font-bold text-gray-600">${statusValues[i]}</span>
                <div class="w-full max-w-[40px] rounded-t-lg chart-bar" style="height:${(statusValues[i] / statusMax) * 120}px; background:${colors[(i + 2) % colors.length]}; transition: height 0.6s ease;"></div>
                <span class="text-xs text-gray-500 truncate max-w-[60px]">${label}</span>
            </div>
        `,
        )
        .join("");
    }
  }
}

/**
 * عرض آخر النشاطات
 */
function renderActivity(data) {
  const container = document.getElementById("activityFeed");
  if (!container) return;

  const activities = data.recent_activity || [];
  if (activities.length === 0) {
    container.innerHTML =
      `<div class="text-center py-6 text-gray-400 text-sm">لا توجد نشاطات حديثة</div>`;
    return;
  }

  const colorMap = {
    offer: "gold",
    request: "purple",
    appointment: "blue",
    reminder: "amber",
    system: "gray",
  };

  container.innerHTML = activities
    .slice(0, 6)
    .map(
      (a) => `
        <div class="activity-item">
            <div class="activity-dot ${colorMap[a.type] || "gray"}"></div>
            <div class="flex-1">
                <div class="text-sm font-medium">${a.text || a.title || ""}</div>
                <div class="text-xs text-gray-500">${a.detail || a.description || ""}</div>
                <div class="text-xs text-gray-400 mt-0.5">${a.time || a.created_at || ""}</div>
            </div>
            <button onclick="window.location.href='${a.link || "#"}'" class="text-xs text-[#1e3a5f] hover:underline">فتح</button>
        </div>
    `,
    )
    .join("");
}

/**
 * عرض القوائم المعلقة
 */
function renderPending(data) {
  // العروض المعلقة
  const pendingOffers = data.pending_offers || [];
  const offersList = document.getElementById("pendingOffersList");
  if (offersList) {
    if (pendingOffers.length === 0) {
      offersList.innerHTML =
        `<div class="text-center py-4 text-gray-400 text-sm">لا توجد عروض قيد الانتظار</div>`;
    } else {
      offersList.innerHTML = pendingOffers
        .slice(0, 5)
        .map(
          (o) => `
            <div class="flex items-center justify-between p-2 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                <div>
                    <div class="text-sm font-semibold">${o.display_id || o.id || ""} — ${o.type || o.deal_type || ""}</div>
                    <div class="text-xs text-gray-500">${o.city || ""} · ${o.stage_name || "قيد الانتظار"}</div>
                </div>
                <button onclick="window.location.href='offers.html'" class="text-xs text-[#1e3a5f] font-bold hover:underline">عرض</button>
            </div>
        `,
        )
        .join("");
    }
  }

  // الطلبات المعلقة
  const pendingRequests = data.pending_requests_list || [];
  const requestsList = document.getElementById("pendingRequestsList");
  if (requestsList) {
    if (pendingRequests.length === 0) {
      requestsList.innerHTML =
        `<div class="text-center py-4 text-gray-400 text-sm">لا توجد طلبات قيد المطابقة</div>`;
    } else {
      requestsList.innerHTML = pendingRequests
        .slice(0, 5)
        .map(
          (r) => `
            <div class="flex items-center justify-between p-2 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                <div>
                    <div class="text-sm font-semibold">${r.display_id || r.id || ""} — ${r.type || r.deal_type || ""}</div>
                    <div class="text-xs text-gray-500">${r.city || ""} · ${r.client || r.contact_name || ""}</div>
                </div>
                <button onclick="window.location.href='requests.html'" class="text-xs text-[#1e3a5f] font-bold hover:underline">عرض</button>
            </div>
        `,
        )
        .join("");
    }
  }
}

/**
 * تحديث رسالة الترحيب
 */
function updateGreeting(data) {
  const hour = new Date().getHours();
  let greeting = "صباح الخير";
  if (hour >= 12 && hour < 17) greeting = "مساء الخير";
  else if (hour >= 17) greeting = "مساء الخير";

  // محاولة جلب اسم المستخدم
  let userName = "خالد";
  try {
    const user = API.getUser();
    if (user && user.name) userName = user.name;
  } catch (e) {
    // استخدام الاسم الافتراضي
  }

  const greetingEl = document.getElementById("greetingText");
  if (greetingEl) {
    greetingEl.textContent = `${greeting}، ${userName} 👋 إليك ملخص أعمالك اليوم`;
  }

  const dateEl = document.getElementById("currentDate");
  if (dateEl) {
    dateEl.textContent = new Date().toLocaleDateString("ar-SA", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }
}

// ============================================================
// LOAD DASHBOARD - تحميل بيانات لوحة التحكم
// ============================================================
async function loadDashboard() {
  try {
    // عرض حالة التحميل
    const loadingEl = document.getElementById("loadingState");
    if (loadingEl) loadingEl.style.display = "block";

    const data = await API.reports.dashboard();

    // إخفاء حالة التحميل
    if (loadingEl) loadingEl.style.display = "none";

    if (data.status === "success") {
      dashboardData = data.data || {};

      // التأكد من وجود جميع الحقول المطلوبة
      dashboardData = {
        total_offers: dashboardData.total_offers || 0,
        total_requests: dashboardData.total_requests || 0,
        active_offers: dashboardData.active_offers || 0,
        pending_requests: dashboardData.pending_requests || 0,
        today_appointments: dashboardData.today_appointments || 0,
        delayed: dashboardData.delayed || 0,
        alerts: dashboardData.alerts || [],
        today_appointments_list: dashboardData.today_appointments_list || [],
        property_types: dashboardData.property_types || {},
        request_statuses: dashboardData.request_statuses || {},
        recent_activity: dashboardData.recent_activity || [],
        pending_offers: dashboardData.pending_offers || [],
        pending_requests_list: dashboardData.pending_requests_list || [],
      };

      // عرض البيانات
      renderStats(dashboardData);
      renderAlerts(dashboardData);
      renderAppointments(dashboardData);
      renderCharts(dashboardData);
      renderActivity(dashboardData);
      renderPending(dashboardData);
      updateGreeting(dashboardData);

      // إظهار المحتوى بعد التحميل
      const content = document.getElementById("dashboardContent");
      if (content) content.style.display = "block";

    } else {
      showToast(data.message || "فشل تحميل البيانات", "error");
    }
  } catch (err) {
    console.error("خطأ في تحميل لوحة التحكم:", err);
    showToast(err.message || "حدث خطأ في الاتصال", "error");

    // إخفاء حالة التحميل وإظهار رسالة خطأ
    const loadingEl = document.getElementById("loadingState");
    if (loadingEl) loadingEl.style.display = "none";

    const errorEl = document.getElementById("errorState");
    if (errorEl) errorEl.style.display = "block";
  }
}

// ============================================================
// ACTIONS - الإجراءات التفاعلية
// ============================================================

/**
 * عرض معاينات اليوم
 */
function showTodayAppointments() {
  const appointments = dashboardData.today_appointments_list || [];
  if (appointments.length === 0) {
    showToast("📅 لا توجد معاينات اليوم", "info");
    return;
  }
  let msg = "📅 معاينات اليوم:\n";
  appointments.forEach((a) => {
    msg += `\n${a.display_id || a.id || ""} — ${a.client || a.contact_name || ""} — ${a.type || ""} (${a.appointment_time || a.time || "غير محدد"})`;
  });
  alert(msg);
}

/**
 * تصدير التقرير إلى Excel (CSV)
 */
async function exportExcel() {
  try {
    showToast("⏳ جاري تحضير التقرير...", "info");

    const today = new Date();
    const fromDate = new Date(today.getFullYear(), today.getMonth() - 1, 1)
      .toISOString()
      .slice(0, 10);
    const toDate = today.toISOString().slice(0, 10);

    const result = await API.reports.offers(fromDate, toDate);

    if (result.status === "success" && result.data) {
      const rows = result.data.data || result.data || [];
      if (rows.length === 0) {
        showToast("لا توجد بيانات للتصدير", "error");
        return;
      }

      // إنشاء ملف CSV
      const headers = Object.keys(rows[0]);
      let csv = "\uFEFF" + headers.join(",") + "\n";
      rows.forEach((r) => {
        csv +=
          headers
            .map((h) => `"${String(r[h] || "").replace(/"/g, '""')}"`)
            .join(",") + "\n";
      });

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `تقرير_لوحة_التحكم_${today.toISOString().slice(0, 10)}.csv`;
      link.click();

      showToast("✅ تم تصدير التقرير بنجاح", "success");
    } else {
      showToast(result.message || "فشل التصدير", "error");
    }
  } catch (err) {
    console.error("خطأ في التصدير:", err);
    showToast(err.message || "حدث خطأ أثناء التصدير", "error");
  }
}

// ============================================================
// CHECK AUTH & INIT - التحقق من المصادقة وتهيئة الصفحة
// ============================================================
document.addEventListener("DOMContentLoaded", async function () {
  console.log("📊 تحميل لوحة التحكم...");

  // 1. التحقق من صحة التوكن
  const isAuthenticated = await API.auth.checkAuth(true);
  if (!isAuthenticated) {
    // سيتم التحويل تلقائياً بواسطة checkAuth
    return;
  }

  // 2. إظهار المحتوى وإخفاء حالة التحميل
  const loadingEl = document.getElementById("loadingState");
  if (loadingEl) loadingEl.style.display = "none";

  const contentEl = document.getElementById("dashboardContent");
  if (contentEl) contentEl.style.display = "block";

  // 3. تحميل البيانات
  await loadDashboard();

  // 4. تشغيل التحديث التلقائي كل 60 ثانية
  if (refreshInterval) clearInterval(refreshInterval);
  refreshInterval = setInterval(loadDashboard, 60000);

  console.log("✅ لوحة التحكم جاهزة");
});

// ============================================================
// EXPOSE GLOBALS - تصدير الدوال للاستخدام العالمي
// ============================================================
window.showTodayAppointments = showTodayAppointments;
window.exportExcel = exportExcel;
window.loadDashboard = loadDashboard;
window.showToast = showToast;

console.log("📊 dashboard.js loaded successfully");