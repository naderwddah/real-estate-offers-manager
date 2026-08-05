(function () {
  "use strict";

  // ============================================================
  // RENDER HELPERS
  // ============================================================

  function formatNumber(num) {
    if (num === undefined || num === null) return "0";
    return num.toLocaleString("ar-SA");
  }

  function formatDate(dateStr) {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return d.toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function formatCurrency(amount) {
    if (amount === undefined || amount === null) return "—";
    return Number(amount).toLocaleString("ar-SA") + " ر.س";
  }

  function getStageStyle(color) {
    return `background:${color}15;color:${color};border:1px solid ${color}30;`;
  }

  // ============================================================
  // STATS RENDER
  // ============================================================

  function renderStats(data) {
    const stats = [
      {
        label: "إجمالي العروض",
        value: data.total_offers,
        icon: "fa-tags",
        colors: "linear-gradient(135deg, #fef3c7, #fde68a);color:#b45309;",
      },
      {
        label: "العروض النشطة",
        value: data.active_offers,
        icon: "fa-bolt",
        colors: "linear-gradient(135deg, #dbeafe, #bfdbfe);color:#1d4ed8;",
      },
      {
        label: "إجمالي الطلبات",
        value: data.total_requests,
        icon: "fa-clipboard-list",
        colors: "linear-gradient(135deg, #d1fae5, #a7f3d0);color:#059669;",
      },
      {
        label: "العملاء",
        value: data.total_clients,
        icon: "fa-users",
        colors: "linear-gradient(135deg, #fce7f3, #fbcfe8);color:#be185d;",
      },
      {
        label: "عروض الشركة",
        value: data.company_offers,
        icon: "fa-building",
        colors: "linear-gradient(135deg, #e0e7ff, #c7d2fe);color:#4338ca;",
      },
      {
        label: "عروض شخصية",
        value: data.personal_offers,
        icon: "fa-user",
        colors: "linear-gradient(135deg, #fef9c3, #fde047);color:#a16207;",
      },
      {
        label: "مكتملة - عروض",
        value: data.completed_offers,
        icon: "fa-check-circle",
        colors: "linear-gradient(135deg, #dcfce7, #86efac);color:#15803d;",
      },
      {
        label: "مكتملة - طلبات",
        value: data.completed_requests,
        icon: "fa-check-double",
        colors: "linear-gradient(135deg, #ccfbf1, #5eead4);color:#0f766e;",
      },
    ];

    const rows = [stats.slice(0, 4), stats.slice(4, 8)];

    rows.forEach((row, rowIndex) => {
      const container = document.getElementById(
        rowIndex === 0 ? "statsContainer" : "statsContainer2"
      );
      if (!container) return;
      container.innerHTML = row
        .map(
          (s) => `
                <div class="stat-box animate-fade-in">
                    <div class="flex items-center justify-between mb-2">
                        <div>
                            <p class="text-xs font-medium" style="color: var(--text-secondary);">${s.label}</p>
                            <h3 class="text-2xl font-extrabold mt-1" style="color: var(--text-primary);">${formatNumber(s.value)}</h3>
                        </div>
                        <div class="stat-icon-box" style="background: ${s.colors}">
                            <i class="fas ${s.icon}"></i>
                        </div>
                    </div>
                </div>
            `
        )
        .join("");
    });
  }

  // ============================================================
  // CITIES RENDER
  // ============================================================

  function renderCities(offersByCity, requestsByCity) {
    const container = document.getElementById("citiesList");
    if (!container) return;

    const allCities = {};
    (offersByCity || []).forEach((c) => {
      allCities[c.city] = (allCities[c.city] || 0) + c.count;
    });
    (requestsByCity || []).forEach((c) => {
      allCities[c.city] = (allCities[c.city] || 0) + c.count;
    });

    const sorted = Object.entries(allCities)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
    const max = sorted.length > 0 ? sorted[0][1] : 1;

    if (sorted.length === 0) {
      container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-city"></i>
                    <p class="text-sm">لا توجد بيانات متاحة</p>
                </div>
            `;
      return;
    }

    container.innerHTML = sorted
      .map(([city, count], i) => {
        const pct = Math.round((count / max) * 100);
        return `
                <div class="city-item animate-fade-in" style="animation-delay:${i * 0.05}s;">
                    <div class="flex items-center gap-3 flex-1 min-w-0">
                        <span class="text-sm font-semibold" style="color:var(--text-primary);min-width:80px;">${city}</span>
                        <div class="flex-1" style="max-width:200px;">
                            <div style="background:var(--border-color);height:8px;border-radius:4px;overflow:hidden;">
                                <div class="chart-bar" style="width:0%;" data-width="${pct}%"></div>
                            </div>
                        </div>
                    </div>
                    <span class="text-sm font-bold mr-3" style="color:var(--gold-primary);">${formatNumber(count)}</span>
                </div>
            `;
      })
      .join("");

    setTimeout(() => {
      container.querySelectorAll("[data-width]").forEach((bar) => {
        bar.style.width = bar.dataset.width;
      });
    }, 100);
  }

  // ============================================================
  // RECENT OFFERS RENDER
  // ============================================================

  function renderRecentOffers(offers) {
    const container = document.getElementById("recentOffersList");
    if (!container) return;

    if (!offers || offers.length === 0) {
      container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-tags"></i>
                    <p class="text-sm">لا توجد عروض حالياً</p>
                </div>
            `;
      return;
    }

    container.innerHTML = offers
      .map(
        (o, i) => `
            <div class="table-row flex items-center justify-between py-3 px-2 animate-fade-in" style="animation-delay:${i * 0.05}s;">
                <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-2 mb-1">
                        <span class="text-xs font-bold" style="color:var(--gold-primary);">${o.display_id || "—"}</span>
                        <span class="stage-badge" style="${getStageStyle(o.stage_color || "#808080")}">
                            <span class="w-2 h-2 rounded-full" style="background:${o.stage_color || "#808080"};"></span>
                            ${o.current_stage || "—"}
                        </span>
                    </div>
                    <p class="text-sm font-semibold truncate" style="color:var(--text-primary);">${o.title || "—"}</p>
                    <p class="text-xs" style="color:var(--text-muted);">${o.city || "—"} · ${formatCurrency(o.price)}</p>
                </div>
                <a href="offers-detail.html?id=${o.id}" class="mr-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition" style="color:var(--text-muted);">
                    <i class="fas fa-chevron-left"></i>
                </a>
            </div>
        `
      )
      .join("");
  }

  // ============================================================
  // RECENT REQUESTS RENDER
  // ============================================================

  function renderRecentRequests(requests) {
    const container = document.getElementById("recentRequestsList");
    if (!container) return;

    if (!requests || requests.length === 0) {
      container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-clipboard-list"></i>
                    <p class="text-sm">لا توجد طلبات حالياً</p>
                </div>
            `;
      return;
    }

    container.innerHTML = requests
      .map(
        (r, i) => `
            <div class="table-row flex items-center justify-between py-3 px-2 animate-fade-in" style="animation-delay:${i * 0.05}s;">
                <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-2 mb-1">
                        <span class="text-xs font-bold" style="color:var(--gold-primary);">${r.display_id || "—"}</span>
                        <span class="stage-badge" style="${getStageStyle(r.stage_color || "#808080")}">
                            <span class="w-2 h-2 rounded-full" style="background:${r.stage_color || "#808080"};"></span>
                            ${r.current_stage || "—"}
                        </span>
                    </div>
                    <p class="text-sm font-semibold truncate" style="color:var(--text-primary);">${r.contact?.name || "عميل"}</p>
                    <p class="text-xs" style="color:var(--text-muted);">${r.city || "—"} · ميزانية: ${formatCurrency(r.budget)}</p>
                </div>
                <a href="requests-detail.html?id=${r.id}" class="mr-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition" style="color:var(--text-muted);">
                    <i class="fas fa-chevron-left"></i>
                </a>
            </div>
        `
      )
      .join("");
  }

  // ============================================================
  // REMINDERS RENDER
  // ============================================================

  function renderReminders(reminders) {
    const container = document.getElementById("remindersList");
    if (!container) return;

    if (!reminders || reminders.length === 0) {
      container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-bell-slash"></i>
                    <p class="text-sm">لا توجد تنبيهات حالياً</p>
                </div>
            `;
      return;
    }

    container.innerHTML = reminders
      .map((r, i) => {
        const now = new Date();
        const reminderTime = new Date(r.reminder_time);
        const isOverdue = reminderTime < now && !r.is_sent;
        const isDone = r.is_sent;
        const dotClass = isDone
          ? "reminder-done"
          : isOverdue
          ? "reminder-overdue"
          : "reminder-upcoming";
        const timeText = isDone
          ? "تم الإرسال"
          : isOverdue
          ? "متأخر"
          : formatDate(r.reminder_time);
        const timeColor = isDone
          ? "var(--success)"
          : isOverdue
          ? "var(--danger)"
          : "var(--text-muted)";

        return `
                <div class="reminder-item animate-fade-in" style="animation-delay:${i * 0.05}s;">
                    <div class="reminder-dot ${dotClass}"></div>
                    <div class="flex-1 min-w-0">
                        <p class="text-sm font-semibold" style="color:var(--text-primary);">${r.note || "—"}</p>
                        <div class="flex items-center gap-2 mt-1 flex-wrap">
                            ${r.offer ? `<span class="text-xs" style="color:var(--gold-primary);"><i class="fas fa-tag ml-1"></i>${r.offer.display_id}</span>` : ""}
                            ${r.request ? `<span class="text-xs" style="color:var(--info);"><i class="fas fa-clipboard ml-1"></i>${r.request.display_id}</span>` : ""}
                            <span class="text-xs" style="color:${timeColor};"><i class="far fa-clock ml-1"></i>${timeText}</span>
                        </div>
                    </div>
                </div>
            `;
      })
      .join("");
  }

  // ============================================================
  // LOAD DATA
  // ============================================================

  async function loadDashboard() {
    // التحقق من المصادقة
    const isAuthenticated = await API.requireAuth();
    if (!isAuthenticated) {
      return;
    }

    // جلب الإحصائيات
    try {
      const statsRes = await API.reports.dashboard();
      if (statsRes.status === "success" && statsRes.data) {
        renderStats(statsRes.data);
        renderCities(
          statsRes.data.offers_by_city,
          statsRes.data.requests_by_city
        );
      }
    } catch (err) {
      console.error("Dashboard stats error:", err);
    }

    // جلب آخر العروض
    try {
      const offersRes = await API.offers.list({
        per_page: 5,
        sort_by: "created_at",
        sort_order: "desc",
      });
      if (offersRes.status === "success" && offersRes.data?.data) {
        renderRecentOffers(offersRes.data.data);
      }
    } catch (err) {
      console.error("Recent offers error:", err);
      const el = document.getElementById("recentOffersList");
      if (el) {
        el.innerHTML = `
          <div class="empty-state">
            <i class="fas fa-exclamation-triangle" style="color:var(--danger);"></i>
            <p class="text-sm" style="color:var(--danger);">فشل تحميل العروض</p>
          </div>
        `;
      }
    }

    // جلب آخر الطلبات
    try {
      const requestsRes = await API.requests.list({
        per_page: 5,
        sort_by: "created_at",
        sort_order: "desc",
      });
      if (requestsRes.status === "success" && requestsRes.data?.data) {
        renderRecentRequests(requestsRes.data.data);
      }
    } catch (err) {
      console.error("Recent requests error:", err);
      const el = document.getElementById("recentRequestsList");
      if (el) {
        el.innerHTML = `
          <div class="empty-state">
            <i class="fas fa-exclamation-triangle" style="color:var(--danger);"></i>
            <p class="text-sm" style="color:var(--danger);">فشل تحميل الطلبات</p>
          </div>
        `;
      }
    }

    // ===== جلب التذكيرات (باستخدام تقرير التذكيرات بدلاً من reminders.list) =====
    try {
      // استخدام نقطة نهاية التقارير للحصول على التذكيرات ضمن فترة زمنية (الشهر الحالي)
      const today = new Date();
      const nextMonth = new Date(today);
      nextMonth.setMonth(today.getMonth() + 1);
      const fromDate = today.toISOString().split('T')[0];
      const toDate = nextMonth.toISOString().split('T')[0];
      
      const remindersRes = await API.reports.reminders(fromDate, toDate);
      if (remindersRes.status === "success") {
        const reminders = remindersRes.data?.data || remindersRes.data || [];
        renderReminders(reminders);
      }
    } catch (err) {
      console.error("Reminders error:", err);
      const el = document.getElementById("remindersList");
      if (el) {
        el.innerHTML = `
          <div class="empty-state">
            <i class="fas fa-exclamation-triangle" style="color:var(--danger);"></i>
            <p class="text-sm" style="color:var(--danger);">فشل تحميل التنبيهات</p>
          </div>
        `;
      }
    }
  }

  // ============================================================
  // INIT
  // ============================================================

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadDashboard);
  } else {
    loadDashboard();
  }
})(); 