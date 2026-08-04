// ============================================================
// assets/js/pages/alerts.js - التنبيهات والتذكيرات (نسخة محسنة)
// ============================================================

let notifications = [];
let reminders = [];
let currentNotifFilter = "all";
let currentReminderFilter = "all";

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

function formatTime(d) {
  if (!d) return "";
  try {
    const date = typeof d === "string" ? new Date(d) : new Date(d);
    if (isNaN(date.getTime())) return "";
    return date.toLocaleTimeString("ar-SA", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (e) {
    return "";
  }
}

function generateTempId() {
  return "temp_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// ============================================================
// REMINDERS - CRUD (مع التخزين المحلي كاحتياط)
// ============================================================
function saveRemindersLocally() {
  if (Array.isArray(reminders)) {
    localStorage.setItem("masarRemindersLocal", JSON.stringify(reminders));
  }
}

function loadRemindersLocally() {
  try {
    const data = localStorage.getItem("masarRemindersLocal");
    if (data) {
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch (e) {}
  return [];
}

function getSampleReminders() {
  const now = new Date();
  const future = new Date(now.getTime() + 86400000);
  return [
    {
      id: "rem_1",
      title: "متابعة عرض ع-١٢٣",
      reminder_time: future.toISOString(),
      notes: "تذكير بمتابعة العرض مع العميل",
      done: false,
    },
  ];
}

async function loadReminders() {
  try {
    const result = await API.reminders.list({ per_page: 100 });
    if (result.status === "success") {
      // استخراج المصفوفة من الاستجابة
      const data = result.data.data || [];
      // تحويل البيانات إلى هيكل موحد يحتوي على title, notes, done
      reminders = data.map(item => ({
        id: item.id,
        title: item.note || "بدون عنوان",
        notes: item.note || "",
        reminder_time: item.reminder_time,
        done: item.is_sent || false,
        // الاحتفاظ بالبيانات الأصلية إذا لزم الأمر
        _raw: item
      }));
      saveRemindersLocally();
      renderReminders();
      renderStats();
      return;
    }
    // إذا فشل API، نستخدم التخزين المحلي
    reminders = loadRemindersLocally();
    if (reminders.length === 0) {
      reminders = getSampleReminders();
      saveRemindersLocally();
    }
  } catch (err) {
    console.warn("فشل تحميل التذكيرات من API:", err.message);
    reminders = loadRemindersLocally();
    if (reminders.length === 0) {
      reminders = getSampleReminders();
      saveRemindersLocally();
    }
  }
  renderReminders();
  renderStats();
}

// ============================================================
// NOTIFICATIONS - تحميل من لوحة التحكم
// ============================================================
async function loadNotifications() {
  try {
    const result = await API.reports.dashboard();
    if (result.status === "success") {
      // في حال لم يحتوي على alerts، نولدها من التذكيرات المتأخرة
      const alerts = result.data.alerts || [];
      notifications = Array.isArray(alerts) ? alerts : [];
      // إذا لم توجد إشعارات، نصنع بعضها من التذكيرات المتأخرة
      if (notifications.length === 0 && reminders.length > 0) {
        const now = new Date().toISOString();
        const overdue = reminders.filter(r => !r.done && r.reminder_time && r.reminder_time < now);
        notifications = overdue.map(r => ({
          id: `notif_${r.id}`,
          title: "تذكير متأخر",
          message: r.title || r.note || "تذكير",
          time: r.reminder_time,
          icon: "⏰",
          read: false,
          link: "#"
        }));
      }
      renderNotifications();
      renderStats();
      return;
    }
    notifications = [];
  } catch (err) {
    console.warn("فشل تحميل الإشعارات:", err.message);
    notifications = [];
  }
  renderNotifications();
  renderStats();
}

// ============================================================
// LOAD ALL DATA
// ============================================================
async function loadData() {
  // التحقق من المصادقة
  const isAuth = await API.auth.checkAuth(false);
  if (!isAuth) {
    // إذا لم يكن مسجلاً، نعرض البيانات المحلية فقط
    reminders = loadRemindersLocally();
    if (reminders.length === 0) {
      reminders = getSampleReminders();
      saveRemindersLocally();
    }
    notifications = [];
    renderNotifications();
    renderReminders();
    renderStats();
    return;
  }

  // تحميل التذكيرات أولاً، ثم الإشعارات
  await loadReminders();
  await loadNotifications();
}

// ============================================================
// RENDER NOTIFICATIONS
// ============================================================
function renderNotifications() {
  if (!Array.isArray(notifications)) notifications = [];

  let filtered = [...notifications];
  if (currentNotifFilter === "unread") {
    filtered = filtered.filter((n) => !n.read);
  } else if (currentNotifFilter === "read") {
    filtered = filtered.filter((n) => n.read);
  }
  filtered.sort((a, b) => new Date(b.time || b.created_at) - new Date(a.time || a.created_at));

  const container = document.getElementById("notificationsList");
  const badge = document.getElementById("notifBadge");
  const unread = notifications.filter((n) => !n.read).length;
  badge.textContent = unread;

  document.getElementById("totalNotifications").textContent = notifications.length;
  document.getElementById("unreadNotifications").textContent = unread;

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="text-center py-10 text-muted">
        <div class="text-4xl mb-3">🔔</div>
        <p>لا توجد إشعارات</p>
        <p class="text-sm">ستظهر هنا الإشعارات القادمة من النظام</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered
    .map((n) => {
      const notifId = n.id || n.notification_id || `notif_${Math.random()}`;
      const title = n.title || "تنبيه";
      const message = n.message || n.text || "";
      const icon = n.icon || "📢";
      const time = n.time || n.created_at || new Date().toISOString();
      const link = n.link || n.action_url || "";
      const read = n.read || n.is_read || false;
      return `
      <div class="notif-item ${read ? "" : "unread"}">
        <div class="notif-icon">${icon}</div>
        <div class="notif-content">
          <div class="notif-title">${title}</div>
          <div class="notif-message">${message}</div>
          <div class="notif-time">${formatDate(time)} ${formatTime(time)}</div>
        </div>
        <div class="notif-actions">
          ${link ? `<button onclick="window.location.href='${link}'" title="فتح"><i class="fas fa-external-link-alt"></i></button>` : ""}
          ${!read ? `<button onclick="markRead('${notifId}')" title="تحديد كمقروء"><i class="fas fa-check"></i></button>` : ""}
          <button class="danger" onclick="deleteNotification('${notifId}')" title="حذف"><i class="fas fa-trash"></i></button>
        </div>
      </div>
    `;
    })
    .join("");

  document.querySelectorAll("#tab-notifications .filter-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.filter === currentNotifFilter);
  });
}

function filterNotifications(filter) {
  currentNotifFilter = filter;
  renderNotifications();
}

function markRead(id) {
  if (!Array.isArray(notifications)) {
    notifications = [];
    return;
  }
  const n = notifications.find(
    (x) => String(x.id || x.notification_id) === String(id)
  );
  if (n) {
    n.read = true;
    renderNotifications();
    renderStats();
    showToast("✅ تم تحديد الإشعار كمقروء", "success");
  }
}

function markAllRead() {
  if (!Array.isArray(notifications)) {
    notifications = [];
    return;
  }
  notifications.forEach((n) => (n.read = true));
  renderNotifications();
  renderStats();
  showToast("✅ تم تحديد جميع الإشعارات كمقروءة", "success");
}

function deleteNotification(id) {
  if (!Array.isArray(notifications)) {
    notifications = [];
    return;
  }
  notifications = notifications.filter(
    (n) => String(n.id || n.notification_id) !== String(id)
  );
  renderNotifications();
  renderStats();
}

function clearAllNotifications() {
  if (!confirm("هل أنت متأكد من حذف جميع الإشعارات؟")) return;
  if (!Array.isArray(notifications)) {
    notifications = [];
    return;
  }
  notifications = [];
  renderNotifications();
  renderStats();
  showToast("🗑️ تم حذف جميع الإشعارات", "info");
}

// ============================================================
// RENDER REMINDERS
// ============================================================
function renderReminders() {
  if (!Array.isArray(reminders)) reminders = [];

  let filtered = [...reminders];
  if (currentReminderFilter === "pending") {
    filtered = filtered.filter((r) => !r.done);
  } else if (currentReminderFilter === "done") {
    filtered = filtered.filter((r) => r.done);
  }
  filtered.sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    return new Date(a.reminder_time) - new Date(b.reminder_time);
  });

  const container = document.getElementById("remindersList");
  const badge = document.getElementById("reminderBadge");
  const pending = reminders.filter((r) => !r.done).length;
  badge.textContent = pending;

  document.getElementById("totalReminders").textContent = reminders.length;
  const now = new Date().toISOString();
  const overdue = reminders.filter(
    (r) => !r.done && r.reminder_time && r.reminder_time < now
  ).length;
  document.getElementById("overdueReminders").textContent = overdue;

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="text-center py-10 text-muted">
        <div class="text-4xl mb-3">⏰</div>
        <p>لا توجد تذكيرات</p>
        <p class="text-sm">أضف تذكيراً جديداً لتلقي إشعارات بالمهام المهمة</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered
    .map((r) => {
      const reminderId = r.id || r.reminder_id || `rem_${Math.random()}`;
      const title = r.title || r.note || "بدون عنوان";
      const notes = r.notes || r.note || "";
      const time = r.reminder_time || r.time || new Date().toISOString();
      const done = r.done || r.is_sent || false;
      return `
      <div class="reminder-item ${done ? "done" : ""}">
        <div class="reminder-header">
          <div class="reminder-title">${title}</div>
          <div class="reminder-date">${formatDate(time)} ${formatTime(time)}</div>
        </div>
        ${notes ? `<div class="reminder-notes">${notes}</div>` : ""}
        <div class="reminder-actions">
          ${
            !done
              ? `<button class="done-btn" onclick="toggleReminderDone('${reminderId}')">✅ تم الإنجاز</button>`
              : `<button class="done-btn" onclick="toggleReminderDone('${reminderId}')" style="background:var(--bg-surface);color:var(--text-secondary);">↩️ إعادة فتح</button>`
          }
          <button class="edit-btn" onclick="editReminder('${reminderId}')"><i class="fas fa-pen"></i> تعديل</button>
          <button class="delete-btn" onclick="deleteReminder('${reminderId}')"><i class="fas fa-trash"></i> حذف</button>
        </div>
      </div>
    `;
    })
    .join("");

  document.querySelectorAll("#tab-reminders .filter-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.filter === currentReminderFilter);
  });
}

function filterReminders(filter) {
  currentReminderFilter = filter;
  renderReminders();
}

// ============================================================
// REMINDER CRUD - مع دعم التخزين المحلي
// ============================================================
async function toggleReminderDone(id) {
  if (!Array.isArray(reminders)) reminders = [];
  const r = reminders.find((x) => String(x.id || x.reminder_id) === String(id));
  if (!r) {
    showToast("التذكير غير موجود", "error");
    return;
  }

  const newDone = !r.done;
  try {
    // محاولة التحديث عبر API
    if (API.isAuthenticated()) {
      const result = await API.reminders.markDone(id);
      if (result.status === "success") {
        r.done = newDone;
        r.is_sent = newDone;
        saveRemindersLocally();
        renderReminders();
        renderStats();
        showToast(
          newDone ? "✅ تم إنجاز التذكير" : "↩️ تم إعادة فتح التذكير",
          "success"
        );
        return;
      }
    }
    // إذا فشل API أو لم يكن مستخدمًا مسجلاً، نحدث محلياً
    r.done = newDone;
    r.is_sent = newDone;
    saveRemindersLocally();
    renderReminders();
    renderStats();
    showToast(
      newDone ? "✅ تم إنجاز التذكير" : "↩️ تم إعادة فتح التذكير",
      "success"
    );
  } catch (err) {
    r.done = newDone;
    r.is_sent = newDone;
    saveRemindersLocally();
    renderReminders();
    renderStats();
    showToast(
      newDone ? "✅ تم إنجاز التذكير" : "↩️ تم إعادة فتح التذكير",
      "success"
    );
  }
}

async function deleteReminder(id) {
  if (!Array.isArray(reminders)) reminders = [];
  if (!confirm("هل أنت متأكد من حذف هذا التذكير؟")) return;

  try {
    if (API.isAuthenticated()) {
      const result = await API.reminders.delete(id);
      if (result.status === "success") {
        reminders = reminders.filter((r) => String(r.id || r.reminder_id) !== String(id));
        saveRemindersLocally();
        renderReminders();
        renderStats();
        showToast("🗑️ تم حذف التذكير", "info");
        return;
      }
    }
    reminders = reminders.filter((r) => String(r.id || r.reminder_id) !== String(id));
    saveRemindersLocally();
    renderReminders();
    renderStats();
    showToast("🗑️ تم حذف التذكير", "info");
  } catch (err) {
    reminders = reminders.filter((r) => String(r.id || r.reminder_id) !== String(id));
    saveRemindersLocally();
    renderReminders();
    renderStats();
    showToast("🗑️ تم حذف التذكير", "info");
  }
}

// ============================================================
// REMINDER MODAL
// ============================================================
function openAddReminder() {
  document.getElementById("reminderModalTitle").textContent = "إضافة تذكير جديد";
  document.getElementById("editReminderId").value = "";
  document.getElementById("remTitle").value = "";
  const now = new Date();
  // تعيين التاريخ والوقت الحاليين
  document.getElementById("remDate").value = now.toISOString().slice(0, 10);
  document.getElementById("remTime").value = now.toTimeString().slice(0, 5);
  document.getElementById("remNotes").value = "";
  document.getElementById("reminderModal").classList.add("active");
}

function editReminder(id) {
  if (!Array.isArray(reminders)) reminders = [];
  const r = reminders.find((x) => String(x.id || x.reminder_id) === String(id));
  if (!r) {
    showToast("التذكير غير موجود", "error");
    return;
  }
  document.getElementById("reminderModalTitle").textContent = "تعديل التذكير";
  document.getElementById("editReminderId").value = id;
  document.getElementById("remTitle").value = r.title || r.note || "";
  if (r.reminder_time) {
    const dt = new Date(r.reminder_time);
    document.getElementById("remDate").value = dt.toISOString().slice(0, 10);
    document.getElementById("remTime").value = dt.toTimeString().slice(0, 5);
  } else {
    document.getElementById("remDate").value = "";
    document.getElementById("remTime").value = "";
  }
  document.getElementById("remNotes").value = r.notes || r.note || "";
  document.getElementById("reminderModal").classList.add("active");
}

function closeModal(id) {
  document.getElementById(id).classList.remove("active");
}

document
  .getElementById("reminderForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();
    const editId = document.getElementById("editReminderId").value;
    const title = document.getElementById("remTitle").value.trim();
    const date = document.getElementById("remDate").value;
    const time = document.getElementById("remTime").value;
    const notes = document.getElementById("remNotes").value.trim();

    if (!title || !date) {
      showToast("يرجى ملء العنوان والتاريخ", "error");
      return;
    }

    // بناء الوقت بصيغة YYYY-MM-DD HH:mm:ss
    const reminderTime = date + (time ? " " + time + ":00" : " 00:00:00");

    // تحضير البيانات للإرسال (نستخدم note بدلاً من title)
    const payload = {
      note: title, // API يتوقع note
      reminder_time: reminderTime,
      // يمكن إضافة offer_id أو request_id إذا كانت متوفرة
    };

    try {
      let result;

      if (editId) {
        // تحديث تذكير
        if (API.isAuthenticated()) {
          result = await API.reminders.update(editId, payload);
          if (result.status === "success") {
            const idx = reminders.findIndex(
              (r) => String(r.id || r.reminder_id) === String(editId)
            );
            if (idx !== -1) {
              reminders[idx] = {
                ...reminders[idx],
                title: title,
                note: title,
                reminder_time: reminderTime,
                notes: notes,
              };
              saveRemindersLocally();
            }
            closeModal("reminderModal");
            showToast("✅ تم تحديث التذكير", "success");
            await loadData(); // إعادة تحميل البيانات من الخادم
            return;
          }
        }
        // إذا فشل API، نحدث محلياً
        const idx = reminders.findIndex(
          (r) => String(r.id || r.reminder_id) === String(editId)
        );
        if (idx !== -1) {
          reminders[idx] = {
            ...reminders[idx],
            title: title,
            note: title,
            reminder_time: reminderTime,
            notes: notes,
          };
          saveRemindersLocally();
          closeModal("reminderModal");
          showToast("✅ تم تحديث التذكير محلياً", "success");
          renderReminders();
          renderStats();
          return;
        }
      } else {
        // إضافة تذكير جديد
        const id = generateTempId();
        const newReminder = {
          id: id,
          title: title,
          note: title,
          reminder_time: reminderTime,
          notes: notes,
          done: false,
          is_sent: false,
        };

        if (API.isAuthenticated()) {
          result = await API.reminders.create(payload);
          if (result.status === "success" && result.data) {
            newReminder.id = result.data.id || id;
          }
        }
        reminders.push(newReminder);
        saveRemindersLocally();
        closeModal("reminderModal");
        showToast("✅ تم حفظ التذكير", "success");
        // إعادة تحميل البيانات من الخادم للحصول على أحدث إصدار
        await loadData();
        return;
      }
    } catch (err) {
      // في حالة الخطأ، نحفظ محلياً
      if (!editId) {
        const id = generateTempId();
        reminders.push({
          id: id,
          title: title,
          note: title,
          reminder_time: reminderTime,
          notes: notes,
          done: false,
          is_sent: false,
        });
        saveRemindersLocally();
        closeModal("reminderModal");
        showToast("✅ تم حفظ التذكير محلياً", "success");
        renderReminders();
        renderStats();
      } else {
        showToast(err.message || "حدث خطأ", "error");
      }
    }
  });

// ============================================================
// STATS
// ============================================================
function renderStats() {
  if (!Array.isArray(notifications)) notifications = [];
  if (!Array.isArray(reminders)) reminders = [];

  const unread = notifications.filter((n) => !n.read).length;
  document.getElementById("unreadNotifications").textContent = unread;
  document.getElementById("totalNotifications").textContent = notifications.length;
  document.getElementById("totalReminders").textContent = reminders.length;
  const now = new Date().toISOString();
  const overdue = reminders.filter(
    (r) => !r.done && r.reminder_time && r.reminder_time < now
  ).length;
  document.getElementById("overdueReminders").textContent = overdue;
  document.getElementById("notifBadge").textContent = unread;
  document.getElementById("reminderBadge").textContent = reminders.filter(
    (r) => !r.done
  ).length;
}

// ============================================================
// TAB SWITCH
// ============================================================
function switchTab(tab) {
  document
    .querySelectorAll(".tab-content")
    .forEach((el) => el.classList.remove("active"));
  document.getElementById("tab-" + tab).classList.add("active");
  document
    .querySelectorAll(".tab-btn")
    .forEach((el) => el.classList.remove("active"));
  document
    .querySelector(`.tab-btn[data-tab="${tab}"]`)
    .classList.add("active");
  if (tab === "notifications") renderNotifications();
  else renderReminders();
}

// ============================================================
// KEYBOARD
// ============================================================
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    document
      .querySelectorAll(".modal-overlay.active")
      .forEach((el) => el.classList.remove("active"));
  }
  if ((e.ctrlKey || e.metaKey) && e.key === "n") {
    e.preventDefault();
    openAddReminder();
  }
});

// ============================================================
// NOTIFICATION PERMISSION
// ============================================================
if ("Notification" in window && Notification.permission === "default") {
  Notification.requestPermission();
}

// ============================================================
// INIT
// ============================================================
document.addEventListener("DOMContentLoaded", async function () {
  // إظهار المحتوى
  const main = document.getElementById("mainContent");
  if (main) {
    main.style.display = "block";
    main.classList.add("visible");
  }

  await loadData();

  // تحديث البيانات كل 60 ثانية
  setInterval(loadData, 60000);
});

// ============================================================
// EXPOSE GLOBALS
// ============================================================
window.switchTab = switchTab;
window.filterNotifications = filterNotifications;
window.filterReminders = filterReminders;
window.markRead = markRead;
window.markAllRead = markAllRead;
window.deleteNotification = deleteNotification;
window.clearAllNotifications = clearAllNotifications;
window.toggleReminderDone = toggleReminderDone;
window.deleteReminder = deleteReminder;
window.openAddReminder = openAddReminder;
window.editReminder = editReminder;
window.closeModal = closeModal;
window.showToast = showToast;
window.loadData = loadData;