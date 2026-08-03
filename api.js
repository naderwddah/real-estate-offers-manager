// ============================================================
// api.js - ربط الواجهات مع Backend (نسخة محسنة)
// ============================================================

const API = {
  baseUrl: "https://masar.technova.fun/api",
  token: localStorage.getItem("masar_token") || null,

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
        const data = await res.json();
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
        const data = await res.json();
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
      if (!API.token) return { status: "error", message: "غير مسجل دخول" };
      try {
        const res = await fetch(`${API.baseUrl}/auth/me`, {
          method: "GET",
          headers: API.getHeaders(),
        });
        return await res.json();
      } catch (err) {
        return { status: "error", message: err.message };
      }
    },

    changePassword: async (
      currentPassword,
      newPassword,
      newPasswordConfirmation,
    ) => {
      if (!API.token) return { status: "error", message: "غير مسجل دخول" };
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
        return await res.json();
      } catch (err) {
        return { status: "error", message: err.message };
      }
    },
  },

  // ============================================================
  // OFFERS
  // ============================================================
  offers: {
    list: async (params = {}) => {
      if (!API.token) return { status: "error", message: "غير مسجل دخول" };
      try {
        const query = new URLSearchParams(params).toString();
        const url = query
          ? `${API.baseUrl}/offers?${query}`
          : `${API.baseUrl}/offers`;
        const res = await fetch(url, {
          method: "GET",
          headers: API.getHeaders(),
        });
        return await res.json();
      } catch (err) {
        return { status: "error", message: err.message };
      }
    },

    get: async (id) => {
      if (!API.token) return { status: "error", message: "غير مسجل دخول" };
      try {
        const res = await fetch(`${API.baseUrl}/offers/${id}`, {
          method: "GET",
          headers: API.getHeaders(),
        });
        return await res.json();
      } catch (err) {
        return { status: "error", message: err.message };
      }
    },

    create: async (data) => {
      if (!API.token) return { status: "error", message: "غير مسجل دخول" };
      try {
        const res = await fetch(`${API.baseUrl}/offers`, {
          method: "POST",
          headers: API.getHeaders(),
          body: JSON.stringify(data),
        });
        return await res.json();
      } catch (err) {
        return { status: "error", message: err.message };
      }
    },

    update: async (id, data) => {
      if (!API.token) return { status: "error", message: "غير مسجل دخول" };
      try {
        const res = await fetch(`${API.baseUrl}/offers/${id}`, {
          method: "PUT",
          headers: API.getHeaders(),
          body: JSON.stringify(data),
        });
        return await res.json();
      } catch (err) {
        return { status: "error", message: err.message };
      }
    },

    delete: async (id) => {
      if (!API.token) return { status: "error", message: "غير مسجل دخول" };
      try {
        const res = await fetch(`${API.baseUrl}/offers/${id}`, {
          method: "DELETE",
          headers: API.getHeaders(),
        });
        return await res.json();
      } catch (err) {
        return { status: "error", message: err.message };
      }
    },

    changeStage: async (id, stageId, notes = "") => {
      if (!API.token) return { status: "error", message: "غير مسجل دخول" };
      try {
        const res = await fetch(`${API.baseUrl}/offers/${id}/stage`, {
          method: "PATCH",
          headers: API.getHeaders(),
          body: JSON.stringify({ stage_id: stageId, notes }),
        });
        return await res.json();
      } catch (err) {
        return { status: "error", message: err.message };
      }
    },
  },

  // ============================================================
  // REQUESTS
  // ============================================================
  requests: {
    list: async (params = {}) => {
      if (!API.token) return { status: "error", message: "غير مسجل دخول" };
      try {
        const query = new URLSearchParams(params).toString();
        const url = query
          ? `${API.baseUrl}/requests?${query}`
          : `${API.baseUrl}/requests`;
        const res = await fetch(url, {
          method: "GET",
          headers: API.getHeaders(),
        });
        return await res.json();
      } catch (err) {
        return { status: "error", message: err.message };
      }
    },

    get: async (id) => {
      if (!API.token) return { status: "error", message: "غير مسجل دخول" };
      try {
        const res = await fetch(`${API.baseUrl}/requests/${id}`, {
          method: "GET",
          headers: API.getHeaders(),
        });
        return await res.json();
      } catch (err) {
        return { status: "error", message: err.message };
      }
    },

    create: async (data) => {
      if (!API.token) return { status: "error", message: "غير مسجل دخول" };
      try {
        const res = await fetch(`${API.baseUrl}/requests`, {
          method: "POST",
          headers: API.getHeaders(),
          body: JSON.stringify(data),
        });
        return await res.json();
      } catch (err) {
        return { status: "error", message: err.message };
      }
    },

    update: async (id, data) => {
      if (!API.token) return { status: "error", message: "غير مسجل دخول" };
      try {
        const res = await fetch(`${API.baseUrl}/requests/${id}`, {
          method: "PUT",
          headers: API.getHeaders(),
          body: JSON.stringify(data),
        });
        return await res.json();
      } catch (err) {
        return { status: "error", message: err.message };
      }
    },

    delete: async (id) => {
      if (!API.token) return { status: "error", message: "غير مسجل دخول" };
      try {
        const res = await fetch(`${API.baseUrl}/requests/${id}`, {
          method: "DELETE",
          headers: API.getHeaders(),
        });
        return await res.json();
      } catch (err) {
        return { status: "error", message: err.message };
      }
    },

    changeStage: async (id, stageId, notes = "") => {
      if (!API.token) return { status: "error", message: "غير مسجل دخول" };
      try {
        const res = await fetch(`${API.baseUrl}/requests/${id}/stage`, {
          method: "PATCH",
          headers: API.getHeaders(),
          body: JSON.stringify({ stage_id: stageId, notes }),
        });
        return await res.json();
      } catch (err) {
        return { status: "error", message: err.message };
      }
    },

    findMatches: async (id) => {
      if (!API.token) return { status: "error", message: "غير مسجل دخول" };
      try {
        const res = await fetch(`${API.baseUrl}/requests/${id}/matching`, {
          method: "GET",
          headers: API.getHeaders(),
        });
        return await res.json();
      } catch (err) {
        return { status: "error", message: err.message };
      }
    },

    matchOffer: async (id, offerId) => {
      if (!API.token) return { status: "error", message: "غير مسجل دخول" };
      try {
        const res = await fetch(`${API.baseUrl}/requests/${id}/match`, {
          method: "POST",
          headers: API.getHeaders(),
          body: JSON.stringify({ offer_id: offerId }),
        });
        return await res.json();
      } catch (err) {
        return { status: "error", message: err.message };
      }
    },
  },

  // ============================================================
  // CLIENTS
  // ============================================================
  clients: {
    list: async (params = {}) => {
      if (!API.token) return { status: "error", message: "غير مسجل دخول" };
      try {
        const query = new URLSearchParams(params).toString();
        const url = query
          ? `${API.baseUrl}/clients?${query}`
          : `${API.baseUrl}/clients`;
        const res = await fetch(url, {
          method: "GET",
          headers: API.getHeaders(),
        });
        return await res.json();
      } catch (err) {
        return { status: "error", message: err.message };
      }
    },

    get: async (id) => {
      if (!API.token) return { status: "error", message: "غير مسجل دخول" };
      try {
        const res = await fetch(`${API.baseUrl}/clients/${id}`, {
          method: "GET",
          headers: API.getHeaders(),
        });
        return await res.json();
      } catch (err) {
        return { status: "error", message: err.message };
      }
    },

    create: async (data) => {
      if (!API.token) return { status: "error", message: "غير مسجل دخول" };
      try {
        const res = await fetch(`${API.baseUrl}/clients`, {
          method: "POST",
          headers: API.getHeaders(),
          body: JSON.stringify(data),
        });
        return await res.json();
      } catch (err) {
        return { status: "error", message: err.message };
      }
    },

    update: async (id, data) => {
      if (!API.token) return { status: "error", message: "غير مسجل دخول" };
      try {
        const res = await fetch(`${API.baseUrl}/clients/${id}`, {
          method: "PUT",
          headers: API.getHeaders(),
          body: JSON.stringify(data),
        });
        return await res.json();
      } catch (err) {
        return { status: "error", message: err.message };
      }
    },

    delete: async (id) => {
      if (!API.token) return { status: "error", message: "غير مسجل دخول" };
      try {
        const res = await fetch(`${API.baseUrl}/clients/${id}`, {
          method: "DELETE",
          headers: API.getHeaders(),
        });
        return await res.json();
      } catch (err) {
        return { status: "error", message: err.message };
      }
    },

    offers: async (id) => {
      if (!API.token) return { status: "error", message: "غير مسجل دخول" };
      try {
        const res = await fetch(`${API.baseUrl}/clients/${id}/offers`, {
          method: "GET",
          headers: API.getHeaders(),
        });
        return await res.json();
      } catch (err) {
        return { status: "error", message: err.message };
      }
    },

    requests: async (id) => {
      if (!API.token) return { status: "error", message: "غير مسجل دخول" };
      try {
        const res = await fetch(`${API.baseUrl}/clients/${id}/requests`, {
          method: "GET",
          headers: API.getHeaders(),
        });
        return await res.json();
      } catch (err) {
        return { status: "error", message: err.message };
      }
    },
  },

  // ============================================================
  // REMINDERS
  // ============================================================
  reminders: {
    list: async (params = {}) => {
      if (!API.token) return { status: "error", message: "غير مسجل دخول" };
      try {
        const query = new URLSearchParams(params).toString();
        const url = query
          ? `${API.baseUrl}/reminders?${query}`
          : `${API.baseUrl}/reminders`;
        const res = await fetch(url, {
          method: "GET",
          headers: API.getHeaders(),
        });
        return await res.json();
      } catch (err) {
        return { status: "error", message: err.message };
      }
    },

    create: async (data) => {
      if (!API.token) return { status: "error", message: "غير مسجل دخول" };
      try {
        const res = await fetch(`${API.baseUrl}/reminders`, {
          method: "POST",
          headers: API.getHeaders(),
          body: JSON.stringify(data),
        });
        return await res.json();
      } catch (err) {
        return { status: "error", message: err.message };
      }
    },

    update: async (id, data) => {
      if (!API.token) return { status: "error", message: "غير مسجل دخول" };
      try {
        const res = await fetch(`${API.baseUrl}/reminders/${id}`, {
          method: "PUT",
          headers: API.getHeaders(),
          body: JSON.stringify(data),
        });
        return await res.json();
      } catch (err) {
        return { status: "error", message: err.message };
      }
    },

    delete: async (id) => {
      if (!API.token) return { status: "error", message: "غير مسجل دخول" };
      try {
        const res = await fetch(`${API.baseUrl}/reminders/${id}`, {
          method: "DELETE",
          headers: API.getHeaders(),
        });
        return await res.json();
      } catch (err) {
        return { status: "error", message: err.message };
      }
    },

    markDone: async (id) => {
      if (!API.token) return { status: "error", message: "غير مسجل دخول" };
      try {
        const res = await fetch(`${API.baseUrl}/reminders/${id}/done`, {
          method: "PATCH",
          headers: API.getHeaders(),
        });
        return await res.json();
      } catch (err) {
        return { status: "error", message: err.message };
      }
    },

    createStageTimeout: async (offerId, timeoutDays = 3, note = "") => {
      if (!API.token) return { status: "error", message: "غير مسجل دخول" };
      try {
        const res = await fetch(
          `${API.baseUrl}/reminders/offer/${offerId}/timeout`,
          {
            method: "POST",
            headers: API.getHeaders(),
            body: JSON.stringify({ timeout_days: timeoutDays, note }),
          },
        );
        return await res.json();
      } catch (err) {
        return { status: "error", message: err.message };
      }
    },
  },

  // ============================================================
  // REPORTS
  // ============================================================
  reports: {
    dashboard: async () => {
      if (!API.token) return { status: "error", message: "غير مسجل دخول" };
      try {
        const res = await fetch(`${API.baseUrl}/reports/dashboard`, {
          method: "GET",
          headers: API.getHeaders(),
        });
        return await res.json();
      } catch (err) {
        return { status: "error", message: err.message };
      }
    },

    offers: async (fromDate, toDate) => {
      if (!API.token) return { status: "error", message: "غير مسجل دخول" };
      try {
        const query = new URLSearchParams({
          from_date: fromDate || "",
          to_date: toDate || "",
        }).toString();
        const res = await fetch(`${API.baseUrl}/reports/offers?${query}`, {
          method: "GET",
          headers: API.getHeaders(),
        });
        return await res.json();
      } catch (err) {
        return { status: "error", message: err.message };
      }
    },

    requests: async (fromDate, toDate) => {
      if (!API.token) return { status: "error", message: "غير مسجل دخول" };
      try {
        const query = new URLSearchParams({
          from_date: fromDate || "",
          to_date: toDate || "",
        }).toString();
        const res = await fetch(`${API.baseUrl}/reports/requests?${query}`, {
          method: "GET",
          headers: API.getHeaders(),
        });
        return await res.json();
      } catch (err) {
        return { status: "error", message: err.message };
      }
    },

    performance: async (fromDate, toDate) => {
      if (!API.token) return { status: "error", message: "غير مسجل دخول" };
      try {
        const query = new URLSearchParams({
          from_date: fromDate || "",
          to_date: toDate || "",
        }).toString();
        const res = await fetch(`${API.baseUrl}/reports/performance?${query}`, {
          method: "GET",
          headers: API.getHeaders(),
        });
        return await res.json();
      } catch (err) {
        return { status: "error", message: err.message };
      }
    },

    exportOffers: async (fromDate, toDate) => {
      if (!API.token) return { status: "error", message: "غير مسجل دخول" };
      try {
        const query = new URLSearchParams({
          from_date: fromDate || "",
          to_date: toDate || "",
        }).toString();
        const res = await fetch(
          `${API.baseUrl}/reports/export/offers?${query}`,
          {
            method: "GET",
            headers: API.getHeaders(),
          },
        );
        return await res.text();
      } catch (err) {
        return { status: "error", message: err.message };
      }
    },
  },

  // ============================================================
  // STAGES
  // ============================================================
  stages: {
    list: async () => {
      if (!API.token) return { status: "error", message: "غير مسجل دخول" };
      try {
        const res = await fetch(`${API.baseUrl}/stages`, {
          method: "GET",
          headers: API.getHeaders(),
        });
        return await res.json();
      } catch (err) {
        return { status: "error", message: err.message };
      }
    },

    byTrack: async (trackType) => {
      if (!API.token) return { status: "error", message: "غير مسجل دخول" };
      try {
        const res = await fetch(`${API.baseUrl}/stages/${trackType}`, {
          method: "GET",
          headers: API.getHeaders(),
        });
        return await res.json();
      } catch (err) {
        return { status: "error", message: err.message };
      }
    },

    nextStage: async (trackType, currentStageId) => {
      if (!API.token) return { status: "error", message: "غير مسجل دخول" };
      try {
        const res = await fetch(`${API.baseUrl}/stages/next`, {
          method: "POST",
          headers: API.getHeaders(),
          body: JSON.stringify({
            track_type: trackType,
            current_stage_id: currentStageId,
          }),
        });
        return await res.json();
      } catch (err) {
        return { status: "error", message: err.message };
      }
    },
  },

  // ============================================================
  // SETTINGS
  // ============================================================
  settings: {
    get: async () => {
      if (!API.token) return { status: "error", message: "غير مسجل دخول" };
      try {
        const res = await fetch(`${API.baseUrl}/settings`, {
          method: "GET",
          headers: API.getHeaders(),
        });
        return await res.json();
      } catch (err) {
        return { status: "error", message: err.message };
      }
    },

    update: async (data) => {
      if (!API.token) return { status: "error", message: "غير مسجل دخول" };
      try {
        const res = await fetch(`${API.baseUrl}/settings`, {
          method: "PUT",
          headers: API.getHeaders(),
          body: JSON.stringify(data),
        });
        return await res.json();
      } catch (err) {
        return { status: "error", message: err.message };
      }
    },
  },

  // ============================================================
  // ATTACHMENTS - رفع الملفات (محسّن)
  // ============================================================
  attachments: {
    // للعروض
    uploadOffer: async (offerId, file, docType) => {
      if (!API.token) return { status: "error", message: "غير مسجل دخول" };
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("doc_type", docType);

        const res = await fetch(
          `${API.baseUrl}/attachments/offers/${offerId}`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${API.token}`,
            },
            body: formData,
          },
        );
        return await res.json();
      } catch (err) {
        return { status: "error", message: err.message };
      }
    },

    uploadMultipleOffer: async (offerId, files, docTypes) => {
      if (!API.token) return { status: "error", message: "غير مسجل دخول" };
      try {
        const formData = new FormData();
        files.forEach((file, index) => {
          formData.append(`files[]`, file);
          if (docTypes && docTypes[index]) {
            formData.append(`doc_types[]`, docTypes[index]);
          }
        });

        const res = await fetch(
          `${API.baseUrl}/attachments/offers/${offerId}/multiple`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${API.token}`,
            },
            body: formData,
          },
        );
        return await res.json();
      } catch (err) {
        return { status: "error", message: err.message };
      }
    },

    listOffer: async (offerId) => {
      if (!API.token) return { status: "error", message: "غير مسجل دخول" };
      try {
        const res = await fetch(
          `${API.baseUrl}/attachments/offers/${offerId}`,
          {
            method: "GET",
            headers: API.getHeaders(),
          },
        );
        return await res.json();
      } catch (err) {
        return { status: "error", message: err.message };
      }
    },

    deleteOffer: async (offerId, attachmentId) => {
      if (!API.token) return { status: "error", message: "غير مسجل دخول" };
      try {
        const res = await fetch(
          `${API.baseUrl}/attachments/offers/${offerId}/${attachmentId}`,
          {
            method: "DELETE",
            headers: API.getHeaders(),
          },
        );
        return await res.json();
      } catch (err) {
        return { status: "error", message: err.message };
      }
    },

    downloadOffer: async (offerId, attachmentId) => {
      if (!API.token) return { status: "error", message: "غير مسجل دخول" };
      try {
        const res = await fetch(
          `${API.baseUrl}/attachments/offers/${offerId}/${attachmentId}/download`,
          {
            method: "GET",
            headers: API.getHeaders(),
          },
        );
        return await res.blob();
      } catch (err) {
        return { status: "error", message: err.message };
      }
    },

    // للطلبات
    uploadRequest: async (requestId, file, docType) => {
      if (!API.token) return { status: "error", message: "غير مسجل دخول" };
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("doc_type", docType);

        const res = await fetch(
          `${API.baseUrl}/attachments/requests/${requestId}`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${API.token}`,
            },
            body: formData,
          },
        );
        return await res.json();
      } catch (err) {
        return { status: "error", message: err.message };
      }
    },

    uploadMultipleRequest: async (requestId, files, docTypes) => {
      if (!API.token) return { status: "error", message: "غير مسجل دخول" };
      try {
        const formData = new FormData();
        files.forEach((file, index) => {
          formData.append(`files[]`, file);
          if (docTypes && docTypes[index]) {
            formData.append(`doc_types[]`, docTypes[index]);
          }
        });

        const res = await fetch(
          `${API.baseUrl}/attachments/requests/${requestId}/multiple`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${API.token}`,
            },
            body: formData,
          },
        );
        return await res.json();
      } catch (err) {
        return { status: "error", message: err.message };
      }
    },

    listRequest: async (requestId) => {
      if (!API.token) return { status: "error", message: "غير مسجل دخول" };
      try {
        const res = await fetch(
          `${API.baseUrl}/attachments/requests/${requestId}`,
          {
            method: "GET",
            headers: API.getHeaders(),
          },
        );
        return await res.json();
      } catch (err) {
        return { status: "error", message: err.message };
      }
    },

    deleteRequest: async (requestId, attachmentId) => {
      if (!API.token) return { status: "error", message: "غير مسجل دخول" };
      try {
        const res = await fetch(
          `${API.baseUrl}/attachments/requests/${requestId}/${attachmentId}`,
          {
            method: "DELETE",
            headers: API.getHeaders(),
          },
        );
        return await res.json();
      } catch (err) {
        return { status: "error", message: err.message };
      }
    },

    downloadRequest: async (requestId, attachmentId) => {
      if (!API.token) return { status: "error", message: "غير مسجل دخول" };
      try {
        const res = await fetch(
          `${API.baseUrl}/attachments/requests/${requestId}/${attachmentId}/download`,
          {
            method: "GET",
            headers: API.getHeaders(),
          },
        );
        return await res.blob();
      } catch (err) {
        return { status: "error", message: err.message };
      }
    },
  },

  // ============================================================
  // HELPER
  // ============================================================
  getHeaders: () => {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API.token}`,
      Accept: "application/json",
    };
  },

  isAuthenticated: () => {
    return !!API.token;
  },

  getUser: () => {
    const user = localStorage.getItem("masar_user");
    return user ? JSON.parse(user) : null;
  },

  verifyToken: async () => {
    if (!API.token) return false;
    try {
      const res = await fetch(`${API.baseUrl}/auth/me`, {
        method: "GET",
        headers: API.getHeaders(),
      });
      const data = await res.json();
      return data.status === "success";
    } catch (err) {
      return false;
    }
  },

  // ============================================================
  // SETTINGS - إضافة دوال الإعدادات
  // ============================================================
  settings: {
    get: async () => {
      if (!API.token) return { status: "error", message: "غير مسجل دخول" };
      try {
        // محاولة جلب الإعدادات من localStorage أولاً
        const localSettings = localStorage.getItem("masar_settings");
        if (localSettings) {
          try {
            const parsed = JSON.parse(localSettings);
            return { status: "success", data: parsed };
          } catch (e) {}
        }
        // إذا لم توجد محلياً، نعيد إعدادات افتراضية
        return {
          status: "success",
          data: {
            company_name: "شركة مسار العقارية",
            logo_path: "",
            phone: "",
            email: "",
            manager_name: "أسد",
            manager_phone: "966500000000",
            manager_email: "",
            legal_name: "الشؤون القانونية",
            legal_phone: "",
            legal_email: "",
            report_day: 4,
            max_wait_days: 3,
            report_footer: "",
          },
        };
      } catch (err) {
        return { status: "error", message: err.message };
      }
    },

    update: async (data) => {
      if (!API.token) return { status: "error", message: "غير مسجل دخول" };
      try {
        // حفظ في localStorage مؤقتاً
        localStorage.setItem("masar_settings", JSON.stringify(data));
        return { status: "success", message: "تم حفظ الإعدادات" };
      } catch (err) {
        return { status: "error", message: err.message };
      }
    },
  },
};

window.API = API;
