// ============================================================
// api.js - ربط الواجهات مع Backend (نسخة معتمدة على API فقط)
// ============================================================

const API = {
  baseUrl: "https://masar.technova.fun/api",
  token: localStorage.getItem("masar_token") || null,

  // ============================================================
  // HELPER - معالجة الأخطاء وإعادة التوجيه في حال 401
  // ============================================================
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
    const data = await response.json();
    if (!response.ok) {
      let errorMsg = data.message || "حدث خطأ";
      if (data.errors) {
        errorMsg = Object.values(data.errors).flat().join(", ");
      }
      throw new Error(errorMsg);
    }
    return data;
  },

  // ============================================================
  // AUTH
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
      if (!API.token) throw new Error("غير مسجل دخول");
      try {
        const res = await fetch(`${API.baseUrl}/auth/me`, {
          method: "GET",
          headers: API.getHeaders(),
        });
        return await API.handleResponse(res);
      } catch (err) {
        throw err;
      }
    },

    changePassword: async (
      currentPassword,
      newPassword,
      newPasswordConfirmation
    ) => {
      if (!API.token) throw new Error("غير مسجل دخول");
      try {
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
      } catch (err) {
        throw err;
      }
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
  // OFFERS
  // ============================================================
  offers: {
    list: async (params = {}) => {
      if (!API.token) throw new Error("غير مسجل دخول");
      const query = new URLSearchParams(params).toString();
      const url = query ? `${API.baseUrl}/offers?${query}` : `${API.baseUrl}/offers`;
      const res = await fetch(url, { method: "GET", headers: API.getHeaders() });
      return await API.handleResponse(res);
    },

    get: async (id) => {
      if (!API.token) throw new Error("غير مسجل دخول");
      const res = await fetch(`${API.baseUrl}/offers/${id}`, {
        method: "GET",
        headers: API.getHeaders(),
      });
      return await API.handleResponse(res);
    },

    create: async (data) => {
      if (!API.token) throw new Error("غير مسجل دخول");
      const res = await fetch(`${API.baseUrl}/offers`, {
        method: "POST",
        headers: API.getHeaders(),
        body: JSON.stringify(data),
      });
      return await API.handleResponse(res);
    },

    update: async (id, data) => {
      if (!API.token) throw new Error("غير مسجل دخول");
      const res = await fetch(`${API.baseUrl}/offers/${id}`, {
        method: "PUT",
        headers: API.getHeaders(),
        body: JSON.stringify(data),
      });
      return await API.handleResponse(res);
    },

    delete: async (id) => {
      if (!API.token) throw new Error("غير مسجل دخول");
      const res = await fetch(`${API.baseUrl}/offers/${id}`, {
        method: "DELETE",
        headers: API.getHeaders(),
      });
      return await API.handleResponse(res);
    },

    changeStage: async (id, stageId, notes = "") => {
      if (!API.token) throw new Error("غير مسجل دخول");
      const res = await fetch(`${API.baseUrl}/offers/${id}/stage`, {
        method: "PATCH",
        headers: API.getHeaders(),
        body: JSON.stringify({ stage_id: stageId, notes }),
      });
      return await API.handleResponse(res);
    },
  },

  // ============================================================
  // REQUESTS
  // ============================================================
  requests: {
    list: async (params = {}) => {
      if (!API.token) throw new Error("غير مسجل دخول");
      const query = new URLSearchParams(params).toString();
      const url = query ? `${API.baseUrl}/requests?${query}` : `${API.baseUrl}/requests`;
      const res = await fetch(url, { method: "GET", headers: API.getHeaders() });
      return await API.handleResponse(res);
    },

    get: async (id) => {
      if (!API.token) throw new Error("غير مسجل دخول");
      const res = await fetch(`${API.baseUrl}/requests/${id}`, {
        method: "GET",
        headers: API.getHeaders(),
      });
      return await API.handleResponse(res);
    },

    create: async (data) => {
      if (!API.token) throw new Error("غير مسجل دخول");
      const res = await fetch(`${API.baseUrl}/requests`, {
        method: "POST",
        headers: API.getHeaders(),
        body: JSON.stringify(data),
      });
      return await API.handleResponse(res);
    },

    update: async (id, data) => {
      if (!API.token) throw new Error("غير مسجل دخول");
      const res = await fetch(`${API.baseUrl}/requests/${id}`, {
        method: "PUT",
        headers: API.getHeaders(),
        body: JSON.stringify(data),
      });
      return await API.handleResponse(res);
    },

    delete: async (id) => {
      if (!API.token) throw new Error("غير مسجل دخول");
      const res = await fetch(`${API.baseUrl}/requests/${id}`, {
        method: "DELETE",
        headers: API.getHeaders(),
      });
      return await API.handleResponse(res);
    },

    changeStage: async (id, stageId, notes = "") => {
      if (!API.token) throw new Error("غير مسجل دخول");
      const res = await fetch(`${API.baseUrl}/requests/${id}/stage`, {
        method: "PATCH",
        headers: API.getHeaders(),
        body: JSON.stringify({ stage_id: stageId, notes }),
      });
      return await API.handleResponse(res);
    },

    findMatches: async (id) => {
      if (!API.token) throw new Error("غير مسجل دخول");
      const res = await fetch(`${API.baseUrl}/requests/${id}/matching`, {
        method: "GET",
        headers: API.getHeaders(),
      });
      return await API.handleResponse(res);
    },

    matchOffer: async (id, offerId) => {
      if (!API.token) throw new Error("غير مسجل دخول");
      const res = await fetch(`${API.baseUrl}/requests/${id}/match`, {
        method: "POST",
        headers: API.getHeaders(),
        body: JSON.stringify({ offer_id: offerId }),
      });
      return await API.handleResponse(res);
    },
  },

  // ============================================================
  // CLIENTS
  // ============================================================
  clients: {
    list: async (params = {}) => {
      if (!API.token) throw new Error("غير مسجل دخول");
      const query = new URLSearchParams(params).toString();
      const url = query ? `${API.baseUrl}/clients?${query}` : `${API.baseUrl}/clients`;
      const res = await fetch(url, { method: "GET", headers: API.getHeaders() });
      return await API.handleResponse(res);
    },

    get: async (id) => {
      if (!API.token) throw new Error("غير مسجل دخول");
      const res = await fetch(`${API.baseUrl}/clients/${id}`, {
        method: "GET",
        headers: API.getHeaders(),
      });
      return await API.handleResponse(res);
    },

    create: async (data) => {
      if (!API.token) throw new Error("غير مسجل دخول");
      const res = await fetch(`${API.baseUrl}/clients`, {
        method: "POST",
        headers: API.getHeaders(),
        body: JSON.stringify(data),
      });
      return await API.handleResponse(res);
    },

    update: async (id, data) => {
      if (!API.token) throw new Error("غير مسجل دخول");
      const res = await fetch(`${API.baseUrl}/clients/${id}`, {
        method: "PUT",
        headers: API.getHeaders(),
        body: JSON.stringify(data),
      });
      return await API.handleResponse(res);
    },

    delete: async (id) => {
      if (!API.token) throw new Error("غير مسجل دخول");
      const res = await fetch(`${API.baseUrl}/clients/${id}`, {
        method: "DELETE",
        headers: API.getHeaders(),
      });
      return await API.handleResponse(res);
    },

    offers: async (id) => {
      if (!API.token) throw new Error("غير مسجل دخول");
      const res = await fetch(`${API.baseUrl}/clients/${id}/offers`, {
        method: "GET",
        headers: API.getHeaders(),
      });
      return await API.handleResponse(res);
    },

    requests: async (id) => {
      if (!API.token) throw new Error("غير مسجل دخول");
      const res = await fetch(`${API.baseUrl}/clients/${id}/requests`, {
        method: "GET",
        headers: API.getHeaders(),
      });
      return await API.handleResponse(res);
    },
  },

  // ============================================================
  // REMINDERS - (مع دوال إضافية)
  // ============================================================
  reminders: {
    list: async (params = {}) => {
      if (!API.token) throw new Error("غير مسجل دخول");
      const query = new URLSearchParams(params).toString();
      const url = query ? `${API.baseUrl}/reminders?${query}` : `${API.baseUrl}/reminders`;
      const res = await fetch(url, { method: "GET", headers: API.getHeaders() });
      return await API.handleResponse(res);
    },

    // دالة جديدة: جلب التذكيرات المتأخرة
    overdue: async () => {
      if (!API.token) throw new Error("غير مسجل دخول");
      const now = new Date().toISOString().slice(0, 19).replace("T", " ");
      const query = new URLSearchParams({
        is_sent: 0,
        reminder_time: now,
        overdue: 1
      }).toString();
      const res = await fetch(`${API.baseUrl}/reminders?${query}`, {
        method: "GET",
        headers: API.getHeaders(),
      });
      return await API.handleResponse(res);
    },

    active: async () => {
      if (!API.token) throw new Error("غير مسجل دخول");
      const res = await fetch(`${API.baseUrl}/reminders/active`, {
        method: "GET",
        headers: API.getHeaders(),
      });
      return await API.handleResponse(res);
    },

    create: async (data) => {
      if (!API.token) throw new Error("غير مسجل دخول");
      const res = await fetch(`${API.baseUrl}/reminders`, {
        method: "POST",
        headers: API.getHeaders(),
        body: JSON.stringify(data),
      });
      return await API.handleResponse(res);
    },

    update: async (id, data) => {
      if (!API.token) throw new Error("غير مسجل دخول");
      const res = await fetch(`${API.baseUrl}/reminders/${id}`, {
        method: "PUT",
        headers: API.getHeaders(),
        body: JSON.stringify(data),
      });
      return await API.handleResponse(res);
    },

    delete: async (id) => {
      if (!API.token) throw new Error("غير مسجل دخول");
      const res = await fetch(`${API.baseUrl}/reminders/${id}`, {
        method: "DELETE",
        headers: API.getHeaders(),
      });
      return await API.handleResponse(res);
    },

    markDone: async (id) => {
      if (!API.token) throw new Error("غير مسجل دخول");
      const res = await fetch(`${API.baseUrl}/reminders/${id}/done`, {
        method: "PATCH",
        headers: API.getHeaders(),
      });
      return await API.handleResponse(res);
    },

    createStageTimeout: async (offerId, timeoutDays = 3, note = "") => {
      if (!API.token) throw new Error("غير مسجل دخول");
      const res = await fetch(`${API.baseUrl}/reminders/offer/${offerId}/timeout`, {
        method: "POST",
        headers: API.getHeaders(),
        body: JSON.stringify({ timeout_days: timeoutDays, note }),
      });
      return await API.handleResponse(res);
    },
  },

  // ============================================================
  // REPORTS
  // ============================================================
  reports: {
    dashboard: async () => {
      if (!API.token) throw new Error("غير مسجل دخول");
      const res = await fetch(`${API.baseUrl}/reports/dashboard`, {
        method: "GET",
        headers: API.getHeaders(),
      });
      return await API.handleResponse(res);
    },

    offers: async (fromDate, toDate) => {
      if (!API.token) throw new Error("غير مسجل دخول");
      const query = new URLSearchParams({
        from_date: fromDate || "",
        to_date: toDate || "",
      }).toString();
      const res = await fetch(`${API.baseUrl}/reports/offers?${query}`, {
        method: "GET",
        headers: API.getHeaders(),
      });
      return await API.handleResponse(res);
    },

    requests: async (fromDate, toDate) => {
      if (!API.token) throw new Error("غير مسجل دخول");
      const query = new URLSearchParams({
        from_date: fromDate || "",
        to_date: toDate || "",
      }).toString();
      const res = await fetch(`${API.baseUrl}/reports/requests?${query}`, {
        method: "GET",
        headers: API.getHeaders(),
      });
      return await API.handleResponse(res);
    },

    performance: async (fromDate, toDate) => {
      if (!API.token) throw new Error("غير مسجل دخول");
      const query = new URLSearchParams({
        from_date: fromDate || "",
        to_date: toDate || "",
      }).toString();
      const res = await fetch(`${API.baseUrl}/reports/performance?${query}`, {
        method: "GET",
        headers: API.getHeaders(),
      });
      return await API.handleResponse(res);
    },

    exportOffers: async (fromDate, toDate) => {
      if (!API.token) throw new Error("غير مسجل دخول");
      const query = new URLSearchParams({
        from_date: fromDate || "",
        to_date: toDate || "",
      }).toString();
      const res = await fetch(`${API.baseUrl}/reports/export/offers?${query}`, {
        method: "GET",
        headers: API.getHeaders(),
      });
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
      return await res.text();
    },
  },

  // ============================================================
  // STAGES
  // ============================================================
  stages: {
    list: async () => {
      if (!API.token) throw new Error("غير مسجل دخول");
      const res = await fetch(`${API.baseUrl}/stages`, {
        method: "GET",
        headers: API.getHeaders(),
      });
      return await API.handleResponse(res);
    },

    byTrack: async (trackType) => {
      if (!API.token) throw new Error("غير مسجل دخول");
      const res = await fetch(`${API.baseUrl}/stages/${trackType}`, {
        method: "GET",
        headers: API.getHeaders(),
      });
      return await API.handleResponse(res);
    },

    nextStage: async (trackType, currentStageId) => {
      if (!API.token) throw new Error("غير مسجل دخول");
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
  // PROPERTY TYPES
  // ============================================================
  propertyTypes: {
    list: async () => {
      if (!API.token) throw new Error("غير مسجل دخول");
      const res = await fetch(`${API.baseUrl}/property-types`, {
        method: "GET",
        headers: API.getHeaders(),
      });
      return await API.handleResponse(res);
    },
  },

  // ============================================================
  // DEAL TYPES
  // ============================================================
  dealTypes: {
    list: async () => {
      if (!API.token) throw new Error("غير مسجل دخول");
      const res = await fetch(`${API.baseUrl}/deal-types`, {
        method: "GET",
        headers: API.getHeaders(),
      });
      return await API.handleResponse(res);
    },
  },

  // ============================================================
  // SETTINGS
  // ============================================================
  settings: {
    get: async () => {
      if (!API.token) throw new Error("غير مسجل دخول");
      const res = await fetch(`${API.baseUrl}/settings`, {
        method: "GET",
        headers: API.getHeaders(),
      });
      return await API.handleResponse(res);
    },

    update: async (data) => {
      if (!API.token) throw new Error("غير مسجل دخول");
      const res = await fetch(`${API.baseUrl}/settings`, {
        method: "PUT",
        headers: API.getHeaders(),
        body: JSON.stringify(data),
      });
      return await API.handleResponse(res);
    },
  },

  // ============================================================
  // ATTACHMENTS
  // ============================================================
  attachments: {
    uploadOffer: async (offerId, file, docType) => {
      if (!API.token) throw new Error("غير مسجل دخول");
      const formData = new FormData();
      formData.append("file", file);
      formData.append("doc_type", docType);
      const res = await fetch(`${API.baseUrl}/attachments/offers/${offerId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${API.token}` },
        body: formData,
      });
      return await API.handleResponse(res);
    },

    uploadMultipleOffer: async (offerId, files, docTypes) => {
      if (!API.token) throw new Error("غير مسجل دخول");
      const formData = new FormData();
      files.forEach((file, index) => {
        formData.append(`files[]`, file);
        if (docTypes && docTypes[index]) {
          formData.append(`doc_types[]`, docTypes[index]);
        }
      });
      const res = await fetch(`${API.baseUrl}/attachments/offers/${offerId}/multiple`, {
        method: "POST",
        headers: { Authorization: `Bearer ${API.token}` },
        body: formData,
      });
      return await API.handleResponse(res);
    },

    listOffer: async (offerId) => {
      if (!API.token) throw new Error("غير مسجل دخول");
      const res = await fetch(`${API.baseUrl}/attachments/offers/${offerId}`, {
        method: "GET",
        headers: API.getHeaders(),
      });
      return await API.handleResponse(res);
    },

    deleteOffer: async (offerId, attachmentId) => {
      if (!API.token) throw new Error("غير مسجل دخول");
      const res = await fetch(`${API.baseUrl}/attachments/offers/${offerId}/${attachmentId}`, {
        method: "DELETE",
        headers: API.getHeaders(),
      });
      return await API.handleResponse(res);
    },

    downloadOffer: async (offerId, attachmentId) => {
      if (!API.token) throw new Error("غير مسجل دخول");
      const res = await fetch(`${API.baseUrl}/attachments/offers/${offerId}/${attachmentId}/download`, {
        method: "GET",
        headers: API.getHeaders(),
      });
      if (!res.ok) throw new Error("فشل تحميل الملف");
      return await res.blob();
    },

    uploadRequest: async (requestId, file, docType) => {
      if (!API.token) throw new Error("غير مسجل دخول");
      const formData = new FormData();
      formData.append("file", file);
      formData.append("doc_type", docType);
      const res = await fetch(`${API.baseUrl}/attachments/requests/${requestId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${API.token}` },
        body: formData,
      });
      return await API.handleResponse(res);
    },

    uploadMultipleRequest: async (requestId, files, docTypes) => {
      if (!API.token) throw new Error("غير مسجل دخول");
      const formData = new FormData();
      files.forEach((file, index) => {
        formData.append(`files[]`, file);
        if (docTypes && docTypes[index]) {
          formData.append(`doc_types[]`, docTypes[index]);
        }
      });
      const res = await fetch(`${API.baseUrl}/attachments/requests/${requestId}/multiple`, {
        method: "POST",
        headers: { Authorization: `Bearer ${API.token}` },
        body: formData,
      });
      return await API.handleResponse(res);
    },

    listRequest: async (requestId) => {
      if (!API.token) throw new Error("غير مسجل دخول");
      const res = await fetch(`${API.baseUrl}/attachments/requests/${requestId}`, {
        method: "GET",
        headers: API.getHeaders(),
      });
      return await API.handleResponse(res);
    },

    deleteRequest: async (requestId, attachmentId) => {
      if (!API.token) throw new Error("غير مسجل دخول");
      const res = await fetch(`${API.baseUrl}/attachments/requests/${requestId}/${attachmentId}`, {
        method: "DELETE",
        headers: API.getHeaders(),
      });
      return await API.handleResponse(res);
    },

    downloadRequest: async (requestId, attachmentId) => {
      if (!API.token) throw new Error("غير مسجل دخول");
      const res = await fetch(`${API.baseUrl}/attachments/requests/${requestId}/${attachmentId}/download`, {
        method: "GET",
        headers: API.getHeaders(),
      });
      if (!res.ok) throw new Error("فشل تحميل الملف");
      return await res.blob();
    },
  },

  // ============================================================
  // HELPER
  // ============================================================
  getHeaders: () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${API.token}`,
    Accept: "application/json",
  }),

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
};

window.API = API;