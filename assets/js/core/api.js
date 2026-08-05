// ============================================================
// api.js - ربط الواجهات مع Backend (نسخة معتمدة على API فقط)
// Base URL: https://masar.technova.fun/api
// ============================================================

const API = {
  baseUrl: "https://masar.technova.fun/api",
  token: localStorage.getItem("masar_token") || null,

  // ============================================================
  // CORE - معالجة الردود والأخطاء
  // ============================================================

  getHeaders: () => {
    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    if (API.token) {
      headers.Authorization = `Bearer ${API.token}`;
    }
    return headers;
  },

  /**
   * دالة مساعدة للتحقق من التوكن وإعادة التوجيه إذا لزم الأمر
   * تُستدعى في بداية كل دالة API تحتاج إلى مصادقة
   * - إذا لم يكن هناك توكن: تعيد التوجيه إلى index.html (إلا إذا كنا فيها)
   * - إذا كان هناك توكن: ترجع true
   */
  _ensureAuth: () => {
    const token = localStorage.getItem("masar_token");
    if (!token) {
      if (!window.location.pathname.includes("index.html")) {
        window.location.href = "index.html";
      }
      throw new Error("غير مسجل دخول");
    }
    API.token = token;
    return true;
  },

  /**
   * معالجة الرد من السيرفر
   * - 401: إزالة التوكن وإعادة التوجيه إلى index.html
   * - JSON parsing مع دعم الردود الفارغة
   * - تجميع أخطاء Validation
   */
  handleResponse: async (response) => {
    if (response.status === 401) {
      localStorage.removeItem("masar_token");
      localStorage.removeItem("masar_user");
      API.token = null;
      if (!window.location.pathname.includes("index.html")) {
        window.location.href = "index.html";
      }
      throw new Error("جلسة منتهية، يرجى تسجيل الدخول مجدداً");
    }

    if (response.status === 204) {
      return { status: "success", data: null };
    }

    let data;
    try {
      data = await response.json();
    } catch (e) {
      if (!response.ok) {
        throw new Error("حدث خطأ غير متوقع من الخادم");
      }
      data = { status: "success", data: null };
    }

    if (!response.ok) {
      let errorMsg = data.message || "حدث خطأ";
      if (data.errors && typeof data.errors === "object") {
        const messages = [];
        for (const key in data.errors) {
          if (Array.isArray(data.errors[key])) {
            messages.push(...data.errors[key]);
          } else {
            messages.push(String(data.errors[key]));
          }
        }
        if (messages.length > 0) errorMsg = messages.join("، ");
      }
      throw new Error(errorMsg);
    }

    return data;
  },

  /**
   * تصفية المعاملات الفارغة قبل بناء Query String
   */
  buildQuery: (params) => {
    const filtered = {};
    for (const key in params) {
      const val = params[key];
      if (val !== undefined && val !== null && val !== "") {
        filtered[key] = val;
      }
    }
    const query = new URLSearchParams(filtered).toString();
    return query ? `?${query}` : "";
  },

  // ============================================================
  // AUTH - المصادقة
  // ============================================================
  auth: {
    login: async (email, password) => {
      try {
        const res = await fetch(`${API.baseUrl}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const data = await API.handleResponse(res);
        if (data.status === "success" && data.data?.token) {
          API.token = data.data.token;
          localStorage.setItem("masar_token", data.data.token);
          if (data.data.user) {
            localStorage.setItem("masar_user", JSON.stringify(data.data.user));
          }
        }
        return data;
      } catch (err) {
        API.token = null;
        localStorage.removeItem("masar_token");
        localStorage.removeItem("masar_user");
        return { status: "error", message: err.message };
      }
    },

    logout: async () => {
      if (!API.token) return { status: "error", message: "غير مسجل دخول" };
      try {
        const res = await fetch(`${API.baseUrl}/auth/logout`, {
          method: "POST",
          headers: API.getHeaders(),
        });
        const data = await API.handleResponse(res);
        API.token = null;
        localStorage.removeItem("masar_token");
        localStorage.removeItem("masar_user");
        return data;
      } catch (err) {
        API.token = null;
        localStorage.removeItem("masar_token");
        localStorage.removeItem("masar_user");
        return { status: "error", message: err.message };
      }
    },

    me: async () => {
      API._ensureAuth();
      const res = await fetch(`${API.baseUrl}/auth/me`, {
        method: "GET",
        headers: API.getHeaders(),
      });
      return await API.handleResponse(res);
    },

    changePassword: async (
      currentPassword,
      newPassword,
      newPasswordConfirmation,
    ) => {
      API._ensureAuth();
      const res = await fetch(`${API.baseUrl}/auth/change-password`, {
        method: "POST",
        headers: API.getHeaders(),
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
          new_password_confirmation: newPasswordConfirmation,
        }),
      });
      return await API.handleResponse(res);
    },

    checkAuth: async (redirect = true) => {
      const token = localStorage.getItem("masar_token");
      if (!token) {
        if (redirect) window.location.href = "index.html";
        return false;
      }
      API.token = token;
      try {
        await API.auth.me();
        return true;
      } catch (err) {
        localStorage.removeItem("masar_token");
        localStorage.removeItem("masar_user");
        API.token = null;
        if (redirect) window.location.href = "index.html";
        return false;
      }
    },
  },

  // ============================================================
  // OFFERS - العروض
  // ============================================================
  offers: {
    list: async (params = {}) => {
      API._ensureAuth();
      const url = `${API.baseUrl}/offers${API.buildQuery(params)}`;
      const res = await fetch(url, {
        method: "GET",
        headers: API.getHeaders(),
      });
      return await API.handleResponse(res);
    },

    get: async (id) => {
      API._ensureAuth();
      const res = await fetch(`${API.baseUrl}/offers/${id}`, {
        method: "GET",
        headers: API.getHeaders(),
      });
      return await API.handleResponse(res);
    },

    create: async (data) => {
      API._ensureAuth();
      const res = await fetch(`${API.baseUrl}/offers`, {
        method: "POST",
        headers: API.getHeaders(),
        body: JSON.stringify(data),
      });
      return await API.handleResponse(res);
    },

    update: async (id, data) => {
      API._ensureAuth();
      const res = await fetch(`${API.baseUrl}/offers/${id}`, {
        method: "PUT",
        headers: API.getHeaders(),
        body: JSON.stringify(data),
      });
      return await API.handleResponse(res);
    },

    delete: async (id) => {
      API._ensureAuth();
      const res = await fetch(`${API.baseUrl}/offers/${id}`, {
        method: "DELETE",
        headers: API.getHeaders(),
      });
      return await API.handleResponse(res);
    },

    changeStage: async (id, stageId, notes = "") => {
      API._ensureAuth();
      const res = await fetch(`${API.baseUrl}/offers/${id}/stage`, {
        method: "PATCH",
        headers: API.getHeaders(),
        body: JSON.stringify({ stage_id: stageId, notes }),
      });
      return await API.handleResponse(res);
    },
  },

  // ============================================================
  // REQUESTS - الطلبات
  // ============================================================
  requests: {
    list: async (params = {}) => {
      API._ensureAuth();
      const url = `${API.baseUrl}/requests${API.buildQuery(params)}`;
      const res = await fetch(url, {
        method: "GET",
        headers: API.getHeaders(),
      });
      return await API.handleResponse(res);
    },

    get: async (id) => {
      API._ensureAuth();
      const res = await fetch(`${API.baseUrl}/requests/${id}`, {
        method: "GET",
        headers: API.getHeaders(),
      });
      return await API.handleResponse(res);
    },

    create: async (data) => {
      API._ensureAuth();
      const res = await fetch(`${API.baseUrl}/requests`, {
        method: "POST",
        headers: API.getHeaders(),
        body: JSON.stringify(data),
      });
      return await API.handleResponse(res);
    },

    update: async (id, data) => {
      API._ensureAuth();
      const res = await fetch(`${API.baseUrl}/requests/${id}`, {
        method: "PUT",
        headers: API.getHeaders(),
        body: JSON.stringify(data),
      });
      return await API.handleResponse(res);
    },

    delete: async (id) => {
      API._ensureAuth();
      const res = await fetch(`${API.baseUrl}/requests/${id}`, {
        method: "DELETE",
        headers: API.getHeaders(),
      });
      return await API.handleResponse(res);
    },

    changeStage: async (id, stageId, notes = "") => {
      API._ensureAuth();
      const res = await fetch(`${API.baseUrl}/requests/${id}/stage`, {
        method: "PATCH",
        headers: API.getHeaders(),
        body: JSON.stringify({ stage_id: stageId, notes }),
      });
      return await API.handleResponse(res);
    },

    findMatches: async (id) => {
      API._ensureAuth();
      const res = await fetch(`${API.baseUrl}/requests/${id}/matching`, {
        method: "GET",
        headers: API.getHeaders(),
      });
      return await API.handleResponse(res);
    },

    matchOffer: async (id, offerId) => {
      API._ensureAuth();
      const res = await fetch(`${API.baseUrl}/requests/${id}/match`, {
        method: "POST",
        headers: API.getHeaders(),
        body: JSON.stringify({ offer_id: offerId }),
      });
      return await API.handleResponse(res);
    },
  },

  // ============================================================
  // CLIENTS - العملاء
  // ============================================================
  clients: {
    list: async (params = {}) => {
      API._ensureAuth();
      const url = `${API.baseUrl}/clients${API.buildQuery(params)}`;
      const res = await fetch(url, {
        method: "GET",
        headers: API.getHeaders(),
      });
      return await API.handleResponse(res);
    },

    get: async (id) => {
      API._ensureAuth();
      const res = await fetch(`${API.baseUrl}/clients/${id}`, {
        method: "GET",
        headers: API.getHeaders(),
      });
      return await API.handleResponse(res);
    },

    create: async (data) => {
      API._ensureAuth();
      const res = await fetch(`${API.baseUrl}/clients`, {
        method: "POST",
        headers: API.getHeaders(),
        body: JSON.stringify(data),
      });
      return await API.handleResponse(res);
    },

    update: async (id, data) => {
      API._ensureAuth();
      const res = await fetch(`${API.baseUrl}/clients/${id}`, {
        method: "PUT",
        headers: API.getHeaders(),
        body: JSON.stringify(data),
      });
      return await API.handleResponse(res);
    },

    delete: async (id) => {
      API._ensureAuth();
      const res = await fetch(`${API.baseUrl}/clients/${id}`, {
        method: "DELETE",
        headers: API.getHeaders(),
      });
      return await API.handleResponse(res);
    },

    offers: async (id) => {
      API._ensureAuth();
      const res = await fetch(`${API.baseUrl}/clients/${id}/offers`, {
        method: "GET",
        headers: API.getHeaders(),
      });
      return await API.handleResponse(res);
    },

    requests: async (id) => {
      API._ensureAuth();
      const res = await fetch(`${API.baseUrl}/clients/${id}/requests`, {
        method: "GET",
        headers: API.getHeaders(),
      });
      return await API.handleResponse(res);
    },
  },

  // ============================================================
  // REMINDERS - التذكيرات (تم التعديل هنا)
  // ============================================================
  reminders: {
    list: async (params = {}) => {
      API._ensureAuth();
      // ✅ تغيير إلى GET مع query string
      const url = `${API.baseUrl}/reminders${API.buildQuery(params)}`;
      const res = await fetch(url, {
        method: "GET",
        headers: API.getHeaders(),
      });
      return await API.handleResponse(res);
    },

    get: async (id) => {
      API._ensureAuth();
      const res = await fetch(`${API.baseUrl}/reminders/${id}`, {
        method: "GET",
        headers: API.getHeaders(),
      });
      return await API.handleResponse(res);
    },

    active: async () => {
      API._ensureAuth();
      const res = await fetch(`${API.baseUrl}/reminders/active`, {
        method: "GET",
        headers: API.getHeaders(),
      });
      return await API.handleResponse(res);
    },

    overdue: async () => {
      API._ensureAuth();
      const res = await fetch(`${API.baseUrl}/reminders/overdue`, {
        method: "GET",
        headers: API.getHeaders(),
      });
      return await API.handleResponse(res);
    },

    create: async (data) => {
      API._ensureAuth();
      const res = await fetch(`${API.baseUrl}/reminders`, {
        method: "POST",
        headers: API.getHeaders(),
        body: JSON.stringify(data),
      });
      return await API.handleResponse(res);
    },

    update: async (id, data) => {
      API._ensureAuth();
      const res = await fetch(`${API.baseUrl}/reminders/${id}`, {
        method: "PUT",
        headers: API.getHeaders(),
        body: JSON.stringify(data),
      });
      return await API.handleResponse(res);
    },

    delete: async (id) => {
      API._ensureAuth();
      const res = await fetch(`${API.baseUrl}/reminders/${id}`, {
        method: "DELETE",
        headers: API.getHeaders(),
      });
      return await API.handleResponse(res);
    },

    markDone: async (id) => {
      API._ensureAuth();
      const res = await fetch(`${API.baseUrl}/reminders/${id}/done`, {
        method: "PATCH",
        headers: API.getHeaders(),
      });
      return await API.handleResponse(res);
    },

    createStageTimeout: async (offerId, timeoutDays = 3, note = "") => {
      API._ensureAuth();
      const res = await fetch(
        `${API.baseUrl}/reminders/offer/${offerId}/timeout`,
        {
          method: "POST",
          headers: API.getHeaders(),
          body: JSON.stringify({ timeout_days: timeoutDays, note }),
        },
      );
      return await API.handleResponse(res);
    },

    createRequestTimeout: async (requestId, timeoutDays = 3, note = "") => {
      API._ensureAuth();
      const res = await fetch(
        `${API.baseUrl}/reminders/request/${requestId}/timeout`,
        {
          method: "POST",
          headers: API.getHeaders(),
          body: JSON.stringify({ timeout_days: timeoutDays, note }),
        },
      );
      return await API.handleResponse(res);
    },
  },

  // ============================================================
  // REPORTS - التقارير
  // ============================================================
  reports: {
    dashboard: async () => {
      API._ensureAuth();
      const res = await fetch(`${API.baseUrl}/reports/dashboard`, {
        method: "GET",
        headers: API.getHeaders(),
      });
      return await API.handleResponse(res);
    },

    offers: async (fromDate, toDate) => {
      API._ensureAuth();
      const res = await fetch(
        `${API.baseUrl}/reports/offers${API.buildQuery({ from_date: fromDate, to_date: toDate })}`,
        {
          method: "GET",
          headers: API.getHeaders(),
        },
      );
      return await API.handleResponse(res);
    },

    requests: async (fromDate, toDate) => {
      API._ensureAuth();
      const res = await fetch(
        `${API.baseUrl}/reports/requests${API.buildQuery({ from_date: fromDate, to_date: toDate })}`,
        {
          method: "GET",
          headers: API.getHeaders(),
        },
      );
      return await API.handleResponse(res);
    },

    performance: async (fromDate, toDate) => {
      API._ensureAuth();
      const res = await fetch(
        `${API.baseUrl}/reports/performance${API.buildQuery({ from_date: fromDate, to_date: toDate })}`,
        {
          method: "GET",
          headers: API.getHeaders(),
        },
      );
      return await API.handleResponse(res);
    },

    reminders: async (fromDate, toDate) => {
      API._ensureAuth();
      const res = await fetch(
        `${API.baseUrl}/reports/reminders${API.buildQuery({ from_date: fromDate, to_date: toDate })}`,
        {
          method: "GET",
          headers: API.getHeaders(),
        },
      );
      return await API.handleResponse(res);
    },

    exportOffers: async (fromDate, toDate) => {
      API._ensureAuth();
      const res = await fetch(
        `${API.baseUrl}/reports/export/offers${API.buildQuery({ from_date: fromDate, to_date: toDate })}`,
        {
          method: "GET",
          headers: API.getHeaders(),
        },
      );
      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem("masar_token");
          localStorage.removeItem("masar_user");
          API.token = null;
          if (!window.location.pathname.includes("index.html")) {
            window.location.href = "index.html";
          }
          throw new Error("جلسة منتهية");
        }
        throw new Error("فشل تصدير التقرير");
      }
      return await res.blob();
    },
  },

  // ============================================================
  // STAGES - المراحل
  // ============================================================
  stages: {
    list: async () => {
      API._ensureAuth();
      const res = await fetch(`${API.baseUrl}/stages`, {
        method: "GET",
        headers: API.getHeaders(),
      });
      return await API.handleResponse(res);
    },

    byTrack: async (trackType) => {
      API._ensureAuth();
      const res = await fetch(`${API.baseUrl}/stages/${trackType}`, {
        method: "GET",
        headers: API.getHeaders(),
      });
      return await API.handleResponse(res);
    },

    nextStage: async (trackType, currentStageId) => {
      API._ensureAuth();
      const res = await fetch(`${API.baseUrl}/stages/next`, {
        method: "POST",
        headers: API.getHeaders(),
        body: JSON.stringify({
          track_type: trackType,
          current_stage_id: currentStageId,
        }),
      });
      return await API.handleResponse(res);
    },
  },

  // ============================================================
  // PROPERTY TYPES - أنواع العقارات
  // ============================================================
  propertyTypes: {
    list: async () => {
      API._ensureAuth();
      const res = await fetch(`${API.baseUrl}/property-types`, {
        method: "GET",
        headers: API.getHeaders(),
      });
      return await API.handleResponse(res);
    },
  },

  // ============================================================
  // DEAL TYPES - أنواع المعاملات
  // ============================================================
  dealTypes: {
    list: async () => {
      API._ensureAuth();
      const res = await fetch(`${API.baseUrl}/deal-types`, {
        method: "GET",
        headers: API.getHeaders(),
      });
      return await API.handleResponse(res);
    },
  },

  // ============================================================
  // SETTINGS - الإعدادات
  // ============================================================
  settings: {
    get: async () => {
      API._ensureAuth();
      const res = await fetch(`${API.baseUrl}/settings`, {
        method: "GET",
        headers: API.getHeaders(),
      });
      return await API.handleResponse(res);
    },

    update: async (data) => {
      API._ensureAuth();
      const res = await fetch(`${API.baseUrl}/settings`, {
        method: "PUT",
        headers: API.getHeaders(),
        body: JSON.stringify(data),
      });
      return await API.handleResponse(res);
    },
  },

  // ============================================================
  // EMAILS - البريد الإلكتروني
  // ============================================================
  emails: {
    read: async (limit = 10) => {
      API._ensureAuth();
      const res = await fetch(
        `${API.baseUrl}/emails/read${API.buildQuery({ limit })}`,
        {
          method: "GET",
          headers: API.getHeaders(),
        },
      );
      return await API.handleResponse(res);
    },

    send: async (to, subject, body) => {
      API._ensureAuth();
      const res = await fetch(`${API.baseUrl}/emails/send`, {
        method: "POST",
        headers: API.getHeaders(),
        body: JSON.stringify({ to, subject, body }),
      });
      return await API.handleResponse(res);
    },
  },

  // ============================================================
  // ATTACHMENTS - المرفقات
  // ============================================================
  attachments: {
    uploadOffer: async (offerId, file, docType) => {
      API._ensureAuth();
      const formData = new FormData();
      formData.append("file", file);
      formData.append("doc_type", docType);
      const headers = {};
      if (API.token) headers.Authorization = `Bearer ${API.token}`;
      const res = await fetch(`${API.baseUrl}/attachments/offers/${offerId}`, {
        method: "POST",
        headers: headers,
        body: formData,
      });
      return await API.handleResponse(res);
    },

    uploadMultipleOffer: async (offerId, files, docTypes) => {
      API._ensureAuth();
      const formData = new FormData();
      files.forEach((file, index) => {
        formData.append(`files[]`, file);
        if (docTypes && docTypes[index]) {
          formData.append(`doc_types[]`, docTypes[index]);
        }
      });
      const headers = {};
      if (API.token) headers.Authorization = `Bearer ${API.token}`;
      const res = await fetch(
        `${API.baseUrl}/attachments/offers/${offerId}/multiple`,
        {
          method: "POST",
          headers: headers,
          body: formData,
        },
      );
      return await API.handleResponse(res);
    },

    listOffer: async (offerId) => {
      API._ensureAuth();
      const res = await fetch(`${API.baseUrl}/attachments/offers/${offerId}`, {
        method: "GET",
        headers: API.getHeaders(),
      });
      return await API.handleResponse(res);
    },

    deleteOffer: async (offerId, attachmentId) => {
      API._ensureAuth();
      const res = await fetch(
        `${API.baseUrl}/attachments/offers/${offerId}/${attachmentId}`,
        {
          method: "DELETE",
          headers: API.getHeaders(),
        },
      );
      return await API.handleResponse(res);
    },

    downloadOffer: async (offerId, attachmentId) => {
      API._ensureAuth();
      const res = await fetch(
        `${API.baseUrl}/attachments/offers/${offerId}/${attachmentId}/download`,
        {
          method: "GET",
          headers: API.getHeaders(),
        },
      );
      if (!res.ok) throw new Error("فشل تحميل الملف");
      return await res.blob();
    },

    uploadRequest: async (requestId, file, docType) => {
      API._ensureAuth();
      const formData = new FormData();
      formData.append("file", file);
      formData.append("doc_type", docType);
      const headers = {};
      if (API.token) headers.Authorization = `Bearer ${API.token}`;
      const res = await fetch(
        `${API.baseUrl}/attachments/requests/${requestId}`,
        {
          method: "POST",
          headers: headers,
          body: formData,
        },
      );
      return await API.handleResponse(res);
    },

    uploadMultipleRequest: async (requestId, files, docTypes) => {
      API._ensureAuth();
      const formData = new FormData();
      files.forEach((file, index) => {
        formData.append(`files[]`, file);
        if (docTypes && docTypes[index]) {
          formData.append(`doc_types[]`, docTypes[index]);
        }
      });
      const headers = {};
      if (API.token) headers.Authorization = `Bearer ${API.token}`;
      const res = await fetch(
        `${API.baseUrl}/attachments/requests/${requestId}/multiple`,
        {
          method: "POST",
          headers: headers,
          body: formData,
        },
      );
      return await API.handleResponse(res);
    },

    listRequest: async (requestId) => {
      API._ensureAuth();
      const res = await fetch(
        `${API.baseUrl}/attachments/requests/${requestId}`,
        {
          method: "GET",
          headers: API.getHeaders(),
        },
      );
      return await API.handleResponse(res);
    },

    deleteRequest: async (requestId, attachmentId) => {
      API._ensureAuth();
      const res = await fetch(
        `${API.baseUrl}/attachments/requests/${requestId}/${attachmentId}`,
        {
          method: "DELETE",
          headers: API.getHeaders(),
        },
      );
      return await API.handleResponse(res);
    },

    downloadRequest: async (requestId, attachmentId) => {
      API._ensureAuth();
      const res = await fetch(
        `${API.baseUrl}/attachments/requests/${requestId}/${attachmentId}/download`,
        {
          method: "GET",
          headers: API.getHeaders(),
        },
      );
      if (!res.ok) throw new Error("فشل تحميل الملف");
      return await res.blob();
    },
  },

  // ============================================================
  // HELPERS - دوال مساعدة
  // ============================================================

  isAuthenticated: () => !!API.token,

  getUser: () => {
    const user = localStorage.getItem("masar_user");
    return user ? JSON.parse(user) : null;
  },

  verifyToken: async () => {
    if (!API.token) return false;
    try {
      await API.auth.me();
      return true;
    } catch {
      return false;
    }
  },

  requireAuth: async (redirect = true) => {
    if (window.location.pathname.includes("index.html")) {
      return true;
    }
    const isValid = await API.verifyToken();
    if (!isValid && redirect) {
      window.location.href = "index.html";
      return false;
    }
    return isValid;
  },
};

// جعل API متاحاً عالمياً
window.API = API;
