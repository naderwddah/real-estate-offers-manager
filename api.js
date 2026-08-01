// ============================================================
// api.js - ربط الواجهات مع Backend
// ============================================================

const API = {
    baseUrl: 'http://localhost:8000/api',
    token: localStorage.getItem('masar_token') || null,

    // ============================================================
    // AUTH
    // ============================================================
    auth: {
        login: async (email, password) => {
            const res = await fetch(`${API.baseUrl}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            if (data.status === 'success' && data.data?.token) {
                API.token = data.data.token;
                localStorage.setItem('masar_token', data.data.token);
                if (data.data.user) {
                    localStorage.setItem('masar_user', JSON.stringify(data.data.user));
                }
            }
            return data;
        },

        logout: async () => {
            if (!API.token) return { status: 'error', message: 'غير مسجل دخول' };
            try {
                const res = await fetch(`${API.baseUrl}/auth/logout`, {
                    method: 'POST',
                    headers: API.getHeaders()
                });
                const data = await res.json();
                API.token = null;
                localStorage.removeItem('masar_token');
                localStorage.removeItem('masar_user');
                return data;
            } catch (err) {
                API.token = null;
                localStorage.removeItem('masar_token');
                localStorage.removeItem('masar_user');
                return { status: 'error', message: err.message };
            }
        },

        me: async () => {
            if (!API.token) return { status: 'error', message: 'غير مسجل دخول' };
            const res = await fetch(`${API.baseUrl}/auth/me`, {
                method: 'GET',
                headers: API.getHeaders()
            });
            return await res.json();
        },

        changePassword: async (currentPassword, newPassword, newPasswordConfirmation) => {
            if (!API.token) return { status: 'error', message: 'غير مسجل دخول' };
            const res = await fetch(`${API.baseUrl}/auth/change-password`, {
                method: 'POST',
                headers: API.getHeaders(),
                body: JSON.stringify({
                    current_password: currentPassword,
                    new_password: newPassword,
                    new_password_confirmation: newPasswordConfirmation
                })
            });
            return await res.json();
        }
    },

    // ============================================================
    // OFFERS
    // ============================================================
    offers: {
        list: async (params = {}) => {
            const query = new URLSearchParams(params).toString();
            const url = query ? `${API.baseUrl}/offers?${query}` : `${API.baseUrl}/offers`;
            const res = await fetch(url, { method: 'GET', headers: API.getHeaders() });
            return await res.json();
        },
        get: async (id) => {
            const res = await fetch(`${API.baseUrl}/offers/${id}`, { method: 'GET', headers: API.getHeaders() });
            return await res.json();
        },
        create: async (data) => {
            const res = await fetch(`${API.baseUrl}/offers`, {
                method: 'POST',
                headers: API.getHeaders(),
                body: JSON.stringify(data)
            });
            return await res.json();
        },
        update: async (id, data) => {
            const res = await fetch(`${API.baseUrl}/offers/${id}`, {
                method: 'PUT',
                headers: API.getHeaders(),
                body: JSON.stringify(data)
            });
            return await res.json();
        },
        delete: async (id) => {
            const res = await fetch(`${API.baseUrl}/offers/${id}`, {
                method: 'DELETE',
                headers: API.getHeaders()
            });
            return await res.json();
        },
        changeStage: async (id, stageId, notes = '') => {
            const res = await fetch(`${API.baseUrl}/offers/${id}/stage`, {
                method: 'PATCH',
                headers: API.getHeaders(),
                body: JSON.stringify({ stage_id: stageId, notes })
            });
            return await res.json();
        }
    },

    // ============================================================
    // REQUESTS
    // ============================================================
    requests: {
        list: async (params = {}) => {
            const query = new URLSearchParams(params).toString();
            const url = query ? `${API.baseUrl}/requests?${query}` : `${API.baseUrl}/requests`;
            const res = await fetch(url, { method: 'GET', headers: API.getHeaders() });
            return await res.json();
        },
        get: async (id) => {
            const res = await fetch(`${API.baseUrl}/requests/${id}`, { method: 'GET', headers: API.getHeaders() });
            return await res.json();
        },
        create: async (data) => {
            const res = await fetch(`${API.baseUrl}/requests`, {
                method: 'POST',
                headers: API.getHeaders(),
                body: JSON.stringify(data)
            });
            return await res.json();
        },
        update: async (id, data) => {
            const res = await fetch(`${API.baseUrl}/requests/${id}`, {
                method: 'PUT',
                headers: API.getHeaders(),
                body: JSON.stringify(data)
            });
            return await res.json();
        },
        delete: async (id) => {
            const res = await fetch(`${API.baseUrl}/requests/${id}`, {
                method: 'DELETE',
                headers: API.getHeaders()
            });
            return await res.json();
        },
        changeStage: async (id, stageId, notes = '') => {
            const res = await fetch(`${API.baseUrl}/requests/${id}/stage`, {
                method: 'PATCH',
                headers: API.getHeaders(),
                body: JSON.stringify({ stage_id: stageId, notes })
            });
            return await res.json();
        },
        findMatches: async (id) => {
            const res = await fetch(`${API.baseUrl}/requests/${id}/matching`, {
                method: 'GET',
                headers: API.getHeaders()
            });
            return await res.json();
        },
        matchOffer: async (id, offerId) => {
            const res = await fetch(`${API.baseUrl}/requests/${id}/match`, {
                method: 'POST',
                headers: API.getHeaders(),
                body: JSON.stringify({ offer_id: offerId })
            });
            return await res.json();
        }
    },

    // ============================================================
    // CLIENTS
    // ============================================================
    clients: {
        list: async (params = {}) => {
            const query = new URLSearchParams(params).toString();
            const url = query ? `${API.baseUrl}/clients?${query}` : `${API.baseUrl}/clients`;
            const res = await fetch(url, { method: 'GET', headers: API.getHeaders() });
            return await res.json();
        },
        get: async (id) => {
            const res = await fetch(`${API.baseUrl}/clients/${id}`, { method: 'GET', headers: API.getHeaders() });
            return await res.json();
        },
        create: async (data) => {
            const res = await fetch(`${API.baseUrl}/clients`, {
                method: 'POST',
                headers: API.getHeaders(),
                body: JSON.stringify(data)
            });
            return await res.json();
        },
        update: async (id, data) => {
            const res = await fetch(`${API.baseUrl}/clients/${id}`, {
                method: 'PUT',
                headers: API.getHeaders(),
                body: JSON.stringify(data)
            });
            return await res.json();
        },
        delete: async (id) => {
            const res = await fetch(`${API.baseUrl}/clients/${id}`, {
                method: 'DELETE',
                headers: API.getHeaders()
            });
            return await res.json();
        },
        offers: async (id) => {
            const res = await fetch(`${API.baseUrl}/clients/${id}/offers`, { method: 'GET', headers: API.getHeaders() });
            return await res.json();
        },
        requests: async (id) => {
            const res = await fetch(`${API.baseUrl}/clients/${id}/requests`, { method: 'GET', headers: API.getHeaders() });
            return await res.json();
        }
    },

    // ============================================================
    // REMINDERS
    // ============================================================
    reminders: {
        list: async (params = {}) => {
            const query = new URLSearchParams(params).toString();
            const url = query ? `${API.baseUrl}/reminders?${query}` : `${API.baseUrl}/reminders`;
            const res = await fetch(url, { method: 'GET', headers: API.getHeaders() });
            return await res.json();
        },
        create: async (data) => {
            const res = await fetch(`${API.baseUrl}/reminders`, {
                method: 'POST',
                headers: API.getHeaders(),
                body: JSON.stringify(data)
            });
            return await res.json();
        },
        update: async (id, data) => {
            const res = await fetch(`${API.baseUrl}/reminders/${id}`, {
                method: 'PUT',
                headers: API.getHeaders(),
                body: JSON.stringify(data)
            });
            return await res.json();
        },
        delete: async (id) => {
            const res = await fetch(`${API.baseUrl}/reminders/${id}`, {
                method: 'DELETE',
                headers: API.getHeaders()
            });
            return await res.json();
        },
        markDone: async (id) => {
            const res = await fetch(`${API.baseUrl}/reminders/${id}/done`, {
                method: 'PATCH',
                headers: API.getHeaders()
            });
            return await res.json();
        },
        createStageTimeout: async (offerId, timeoutDays, note = '') => {
            const res = await fetch(`${API.baseUrl}/reminders/offer/${offerId}/timeout`, {
                method: 'POST',
                headers: API.getHeaders(),
                body: JSON.stringify({ timeout_days: timeoutDays, note })
            });
            return await res.json();
        }
    },

    // ============================================================
    // REPORTS
    // ============================================================
    reports: {
        dashboard: async () => {
            const res = await fetch(`${API.baseUrl}/reports/dashboard`, {
                method: 'GET',
                headers: API.getHeaders()
            });
            return await res.json();
        },
        offers: async (fromDate, toDate) => {
            const query = new URLSearchParams({ from_date: fromDate, to_date: toDate }).toString();
            const res = await fetch(`${API.baseUrl}/reports/offers?${query}`, {
                method: 'GET',
                headers: API.getHeaders()
            });
            return await res.json();
        },
        requests: async (fromDate, toDate) => {
            const query = new URLSearchParams({ from_date: fromDate, to_date: toDate }).toString();
            const res = await fetch(`${API.baseUrl}/reports/requests?${query}`, {
                method: 'GET',
                headers: API.getHeaders()
            });
            return await res.json();
        },
        performance: async (fromDate, toDate) => {
            const query = new URLSearchParams({ from_date: fromDate, to_date: toDate }).toString();
            const res = await fetch(`${API.baseUrl}/reports/performance?${query}`, {
                method: 'GET',
                headers: API.getHeaders()
            });
            return await res.json();
        },
        exportOffers: async (fromDate, toDate) => {
            const query = new URLSearchParams({ from_date: fromDate, to_date: toDate }).toString();
            const res = await fetch(`${API.baseUrl}/reports/export/offers?${query}`, {
                method: 'GET',
                headers: API.getHeaders()
            });
            return await res.text();
        }
    },

    // ============================================================
    // HELPER
    // ============================================================
    getHeaders: () => {
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API.token}`
        };
    },

    isAuthenticated: () => {
        return !!API.token;
    },

    getUser: () => {
        const user = localStorage.getItem('masar_user');
        return user ? JSON.parse(user) : null;
    },

    verifyToken: async () => {
        if (!API.token) return false;
        try {
            const res = await fetch(`${API.baseUrl}/auth/me`, {
                method: 'GET',
                headers: API.getHeaders()
            });
            const data = await res.json();
            return data.status === 'success';
        } catch (err) {
            return false;
        }
    }
};

window.API = API;