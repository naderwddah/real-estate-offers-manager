
```markdown
# 📚 توثيق API - نظام مسار العقاري

---

## 🌐 **المعلومات الأساسية**

| الخاصية | القيمة |
|----------|--------|
| **Base URL** | `http://localhost:8000/api` |
| **نوع المصادقة** | JWT Bearer Token |
| **تنسيق البيانات** | JSON |
| **الترميز** | UTF-8 |

---

## 🔑 **المصادقة (Authentication)**

### **تسجيل الدخول**

```
POST /auth/login
```

**Request Body:**
```json
{
    "email": "admin@masar.sa",
    "password": "Admin@123"
}
```

**Response:**
```json
{
    "status": "success",
    "message": "تم تسجيل الدخول بنجاح",
    "data": {
        "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
        "token_type": "bearer",
        "expires_in": 7200,
        "user": {
            "id": 1,
            "name": "مدير النظام",
            "email": "admin@masar.sa",
            "phone": "+966500000000"
        }
    }
}
```

### **تسجيل الخروج**

```
POST /auth/logout
```

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
    "status": "success",
    "message": "تم تسجيل الخروج بنجاح"
}
```

### **بيانات المستخدم**

```
GET /auth/me
```

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
    "status": "success",
    "data": {
        "id": 1,
        "name": "مدير النظام",
        "email": "admin@masar.sa",
        "phone": "+966500000000",
        "created_at": "2024-01-01T00:00:00.000000Z"
    }
}
```

---

## 🏢 **العروض (Offers)**

### **قائمة العروض**

```
GET /offers
```

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**

| المعامل | النوع | الوصف |
|---------|-------|-------|
| `track_type` | string | company / personal |
| `city` | string | فلترة حسب المدينة |
| `is_active` | boolean | true / false |
| `stage_id` | integer | فلترة حسب المرحلة |
| `search` | string | بحث في النص |
| `per_page` | integer | عدد العناصر في الصفحة |
| `sort_by` | string | created_at / price / area |
| `sort_order` | string | asc / desc |

**Response:**
```json
{
    "status": "success",
    "data": {
        "current_page": 1,
        "data": [
            {
                "id": 1,
                "display_id": "ع-001",
                "track_type": "company",
                "title": "أرض سكنية في الرياض",
                "property_type": "أرض",
                "deal_type": "بيع",
                "area": 500.00,
                "price": 1250000.00,
                "city": "الرياض",
                "district": "حي النخيل",
                "current_stage": "عرض جديد",
                "stage_color": "#3B82F6",
                "offer_date": "2024-01-01",
                "is_active": true,
                "is_closed": false
            }
        ],
        "total": 10,
        "per_page": 15
    }
}
```

---

### **تفاصيل العرض**

```
GET /offers/{id}
```

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
    "status": "success",
    "data": {
        "id": 1,
        "display_id": "ع-001",
        "track_type": "company",
        "title": "أرض سكنية في الرياض",
        "property_type": "أرض",
        "deal_type": "بيع",
        "area": 500.00,
        "price": 1250000.00,
        "city": "الرياض",
        "district": "حي النخيل",
        "address": "شارع الملك فهد",
        "map_url": "https://maps.google.com/...",
        "description": "أرض مميزة في موقع استراتيجي",
        "contact": {
            "id": 1,
            "name": "أحمد",
            "phone": "0501234567"
        },
        "current_stage": "عرض جديد",
        "stage_color": "#3B82F6",
        "log": [
            "2024-01-01 10:00:00 - تم إنشاء العرض",
            "2024-01-01 10:30:00 - تم تحديث العرض"
        ],
        "offer_date": "2024-01-01",
        "is_active": true,
        "is_closed": false,
        "attachments": [
            {
                "id": 1,
                "file_name": "صك_الملكية.pdf",
                "file_url": "/storage/offers/1/file.pdf",
                "doc_type": "صك"
            }
        ]
    }
}
```

---

### **إضافة عرض جديد**

```
POST /offers
```

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
    "track_type": "company",
    "title": "أرض سكنية في الرياض",
    "property_type_id": 1,
    "deal_type_id": 1,
    "area": 500.00,
    "price": 1250000.00,
    "city": "الرياض",
    "district": "حي النخيل",
    "address": "شارع الملك فهد",
    "map_url": "https://maps.google.com/...",
    "description": "أرض مميزة في موقع استراتيجي",
    "contact_name": "أحمد",
    "contact_phone": "0501234567",
    "contact_email": "ahmed@example.com",
    "offer_date": "2024-01-01"
}
```

**Response:**
```json
{
    "status": "success",
    "message": "تم إنشاء العرض بنجاح",
    "data": {
        "id": 1,
        "display_id": "ع-001",
        "track_type": "company",
        "title": "أرض سكنية في الرياض",
        "current_stage_id": 1,
        "is_active": true,
        "created_at": "2024-01-01T10:00:00.000000Z"
    }
}
```

---

### **تحديث عرض**

```
PUT /offers/{id}
```

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
    "title": "أرض سكنية فاخرة في الرياض",
    "price": 1500000.00,
    "description": "أرض مميزة مع إطلالة رائعة"
}
```

**Response:**
```json
{
    "status": "success",
    "message": "تم تحديث العرض بنجاح",
    "data": {
        "id": 1,
        "display_id": "ع-001",
        "title": "أرض سكنية فاخرة في الرياض",
        "price": 1500000.00
    }
}
```

---

### **تغيير مرحلة العرض**

```
PATCH /offers/{id}/stage
```

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
    "stage_id": 2,
    "notes": "تم إرسال العرض للمدير للتسعير"
}
```

**Response:**
```json
{
    "status": "success",
    "message": "تم تغيير المرحلة بنجاح",
    "data": {
        "id": 1,
        "display_id": "ع-001",
        "current_stage_id": 2,
        "stage_name": "بانتظار رد المدير"
    }
}
```

---

### **حذف عرض**

```
DELETE /offers/{id}
```

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
    "status": "success",
    "message": "تم حذف العرض بنجاح"
}
```

---

## 📝 **الطلبات (Requests)**

### **قائمة الطلبات**

```
GET /requests
```

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**

| المعامل | النوع | الوصف |
|---------|-------|-------|
| `city` | string | فلترة حسب المدينة |
| `is_active` | boolean | true / false |
| `stage_id` | integer | فلترة حسب المرحلة |
| `search` | string | بحث في النص |
| `per_page` | integer | عدد العناصر في الصفحة |

**Response:**
```json
{
    "status": "success",
    "data": {
        "current_page": 1,
        "data": [
            {
                "id": 1,
                "display_id": "ط-001",
                "contact": {
                    "id": 2,
                    "name": "محمد",
                    "phone": "0501234567"
                },
                "property_type": "أرض",
                "deal_type": "بيع",
                "area": 500.00,
                "budget": 1500000.00,
                "city": "الرياض",
                "districts": "حي النخيل، حي العليا",
                "current_stage": "طلب جديد",
                "stage_color": "#3B82F6",
                "request_date": "2024-01-01",
                "is_active": true
            }
        ],
        "total": 5,
        "per_page": 15
    }
}
```

---

### **إضافة طلب جديد**

```
POST /requests
```

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
    "contact_name": "محمد",
    "contact_phone": "0501234567",
    "contact_email": "mohammed@example.com",
    "property_type_id": 1,
    "deal_type_id": 1,
    "area": 500.00,
    "budget": 1500000.00,
    "city": "الرياض",
    "districts": "حي النخيل، حي العليا",
    "notes": "يطلب أرض بمساحة 500م في الرياض",
    "request_date": "2024-01-01"
}
```

**Response:**
```json
{
    "status": "success",
    "message": "تم إنشاء الطلب بنجاح",
    "data": {
        "request": {
            "id": 1,
            "display_id": "ط-001",
            "current_stage_id": 1,
            "is_active": true
        },
        "matches": [
            {
                "id": 5,
                "display_id": "ع-001",
                "title": "أرض سكنية في الرياض",
                "match_score": 85
            }
        ]
    }
}
```

---

### **إيجاد عروض مطابقة للطلب**

```
GET /requests/{id}/matching
```

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
    "status": "success",
    "data": {
        "request": {
            "id": 1,
            "display_id": "ط-001"
        },
        "matches": [
            {
                "id": 5,
                "display_id": "ع-001",
                "title": "أرض سكنية في الرياض",
                "price": 1250000.00,
                "city": "الرياض",
                "match_score": 85
            },
            {
                "id": 8,
                "display_id": "ع-002",
                "title": "أرض استثمارية في الرياض",
                "price": 1800000.00,
                "city": "الرياض",
                "match_score": 70
            }
        ]
    }
}
```

---

### **ربط الطلب بعرض**

```
POST /requests/{id}/match
```

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
    "offer_id": 5
}
```

**Response:**
```json
{
    "status": "success",
    "message": "تم ربط الطلب بالعرض بنجاح",
    "data": {
        "id": 1,
        "display_id": "ط-001",
        "matched_offer_id": 5,
        "matched_at": "2024-01-01T10:30:00.000000Z",
        "current_stage_id": 3
    }
}
```

---

## 👤 **العملاء (Clients)**

### **قائمة العملاء**

```
GET /clients
```

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
    "status": "success",
    "data": {
        "current_page": 1,
        "data": [
            {
                "id": 1,
                "name": "أحمد",
                "phone": "0501234567",
                "email": "ahmed@example.com",
                "notes": "عميل مميز",
                "offers_count": 3,
                "requests_count": 1,
                "created_at": "2024-01-01T00:00:00.000000Z"
            }
        ],
        "total": 10,
        "per_page": 15
    }
}
```

---

### **إضافة عميل جديد**

```
POST /clients
```

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
    "name": "خالد",
    "phone": "0509876543",
    "email": "khalid@example.com",
    "notes": "عميل جديد"
}
```

**Response:**
```json
{
    "status": "success",
    "message": "تم إنشاء العميل بنجاح",
    "data": {
        "id": 11,
        "name": "خالد",
        "phone": "0509876543",
        "email": "khalid@example.com"
    }
}
```

---

## 📎 **المرفقات (Attachments)**

### **رفع مرفق للعرض**

```
POST /attachments/offers/{offerId}
```

**Headers:**
```
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Request Body:**
```
file: (binary file)
doc_type: صك
```

**Response:**
```json
{
    "status": "success",
    "message": "تم رفع الملف بنجاح",
    "data": {
        "id": 1,
        "file_name": "صك_الملكية.pdf",
        "file_url": "/storage/offers/1/file.pdf",
        "doc_type": "صك",
        "file_size": 1024576
    }
}
```

---

### **مرفقات العرض**

```
GET /attachments/offers/{offerId}
```

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
    "status": "success",
    "data": [
        {
            "id": 1,
            "file_name": "صك_الملكية.pdf",
            "file_url": "/storage/offers/1/file.pdf",
            "doc_type": "صك",
            "uploaded_at": "2024-01-01T10:00:00.000000Z"
        },
        {
            "id": 2,
            "file_name": "مخطط.jpg",
            "file_url": "/storage/offers/1/plan.jpg",
            "doc_type": "مخطط",
            "uploaded_at": "2024-01-01T10:30:00.000000Z"
        }
    ]
}
```

---

### **رفع مرفق للطلب**

```
POST /attachments/requests/{requestId}
```

**Headers:**
```
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Request Body:**
```
file: (binary file)
doc_type: صورة
```

**Response:**
```json
{
    "status": "success",
    "message": "تم رفع الملف بنجاح",
    "data": {
        "id": 3,
        "file_name": "طلب_العميل.pdf",
        "file_url": "/storage/requests/1/file.pdf",
        "doc_type": "صورة",
        "file_size": 512000
    }
}
```

---

### **حذف مرفق**

```
DELETE /attachments/offers/{offerId}/{attachmentId}
```

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
    "status": "success",
    "message": "تم حذف المرفق بنجاح"
}
```

---

## 🔔 **التذكيرات (Reminders)**

### **قائمة التذكيرات**

```
GET /reminders
```

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**

| المعامل | النوع | الوصف |
|---------|-------|-------|
| `is_sent` | boolean | تم إرساله / لم يتم |
| `upcoming` | boolean | التذكيرات القادمة فقط |

**Response:**
```json
{
    "status": "success",
    "data": {
        "current_page": 1,
        "data": [
            {
                "id": 1,
                "note": "تذكير: إرسال العرض للمدير للتسعير",
                "reminder_time": "2024-01-04T10:00:00.000000Z",
                "is_sent": false,
                "offer": {
                    "id": 1,
                    "display_id": "ع-001",
                    "title": "أرض سكنية في الرياض"
                }
            }
        ],
        "total": 5
    }
}
```

---

### **إنشاء تذكير جديد**

```
POST /reminders
```

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
    "offer_id": 1,
    "reminder_time": "2024-01-05 14:00:00",
    "note": "تذكير: متابعة العرض مع العميل"
}
```

**Response:**
```json
{
    "status": "success",
    "message": "تم إنشاء التذكير بنجاح",
    "data": {
        "id": 6,
        "note": "تذكير: متابعة العرض مع العميل",
        "reminder_time": "2024-01-05 14:00:00",
        "is_sent": false
    }
}
```

---

## 📊 **التقارير (Reports)**

### **لوحة التحكم**

```
GET /reports/dashboard
```

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
    "status": "success",
    "data": {
        "total_offers": 25,
        "active_offers": 20,
        "company_offers": 15,
        "personal_offers": 10,
        "completed_offers": 5,
        "total_requests": 12,
        "active_requests": 8,
        "completed_requests": 4,
        "total_clients": 30,
        "offers_by_city": [
            {
                "city": "الرياض",
                "count": 8
            },
            {
                "city": "جدة",
                "count": 5
            }
        ],
        "requests_by_city": [
            {
                "city": "الرياض",
                "count": 6
            }
        ]
    }
}
```

---

### **تقرير العروض**

```
GET /reports/offers
```

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**

| المعامل | النوع | الوصف |
|---------|-------|-------|
| `from_date` | date | من تاريخ (YYYY-MM-DD) |
| `to_date` | date | إلى تاريخ (YYYY-MM-DD) |
| `track_type` | string | company / personal |
| `city` | string | فلترة حسب المدينة |

**Response:**
```json
{
    "status": "success",
    "data": {
        "summary": {
            "total": 25,
            "total_value": 25000000.00,
            "average_price": 1000000.00,
            "by_type": {
                "company": 15,
                "personal": 10
            },
            "by_city": {
                "الرياض": 12,
                "جدة": 8,
                "الدمام": 5
            }
        },
        "data": [
            {
                "id": 1,
                "display_id": "ع-001",
                "title": "أرض سكنية في الرياض",
                "price": 1250000.00,
                "city": "الرياض",
                "offer_date": "2024-01-01"
            }
        ]
    }
}
```

---

### **تصدير تقرير العروض (CSV)**

```
GET /reports/export/offers
```

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**

| المعامل | النوع | الوصف |
|---------|-------|-------|
| `from_date` | date | من تاريخ (YYYY-MM-DD) |
| `to_date` | date | إلى تاريخ (YYYY-MM-DD) |

**Response:**
- ملف CSV للتحميل

---

## 📋 **رموز الأخطاء**

| الكود | المعنى |
|-------|--------|
| 200 | نجاح |
| 201 | تم الإنشاء بنجاح |
| 400 | طلب غير صحيح |
| 401 | غير مصرح (توكن غير صالح) |
| 404 | العنصر غير موجود |
| 422 | خطأ في التحقق (Validation) |
| 500 | خطأ في الخادم |

---

## 📌 **تنسيق الأخطاء**

```json
{
    "status": "error",
    "message": "بيانات الدخول غير صحيحة",
    "code": 401
}
```

```json
{
    "status": "error",
    "message": "خطأ في البيانات المدخلة",
    "errors": {
        "email": [
            "البريد الإلكتروني مطلوب"
        ],
        "password": [
            "كلمة المرور يجب أن تكون 6 أحرف على الأقل"
        ]
    }
}
```

---

## 🔧 **نصائح للاستخدام**

1. **التوكن**: يتم إرسال التوكن في كل طلب عبر Header: `Authorization: Bearer {token}`
2. **صلاحية التوكن**: 7200 ثانية (ساعتين)
3. **رفع الملفات**: استخدم `multipart/form-data` مع المرفقات
4. **التواريخ**: استخدم تنسيق `YYYY-MM-DD` للتواريخ
5. **الأوقات**: استخدم تنسيق `YYYY-MM-DD HH:mm:ss` للأوقات

---

## 📞 **الدعم الفني**

- **البريد الإلكتروني**: support@masar.sa
- **GitHub Issues**: https://github.com/your-username/masar-backend/issues

---

**تم توثيق API بواسطة فريق مسار** 🚀
```