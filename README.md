سأقوم بإعادة كتابة الملفين مع التحديثات الجديدة (التذكيرات، البريد الإلكتروني، IMAP، والأوامر الجديدة):

---

## 📄 **ملف `README.md` - النسخة المحدثة**

```markdown
# 🏗️ مسار - نظام متابعة العروض والطلبات العقارية

نظام متابعة وإدارة العروض والطلبات العقارية مصمم خصيصاً للمسوقين العقاريين لإدارة أعمالهم اليومية بكفاءة.

---

## 📋 **نبذة عن المشروع**

نظام **مسار** هو CRM شخصي متكامل للمسوق العقاري، يهدف إلى تنظيم وإدارة:

- **العروض العقارية**: إدارة العقارات المعروضة للبيع أو الإيجار
- **الطلبات**: متابعة طلبات العملاء وتلبية احتياجاتهم
- **دورة العمل**: متابعة الصفقات من البداية إلى الإتمام
- **المرفقات**: إدارة المستندات والصور المرتبطة بكل عرض أو طلب
- **التذكيرات**: نظام تذكيرات تلقائي مع إشعارات عبر البريد الإلكتروني وWhatsApp
- **التقارير**: تقارير شاملة مع إمكانية التصدير

---

## ✨ **المميزات الرئيسية**

### 🏢 **العروض العقارية**
- عرضين أنواع: **شركة** (إجراءات رسمية) و **شخصي** (إجراءات مبسطة)
- 11 مرحلة متسلسلة لعروض الشركة
- 4 مراحل مبسطة للعروض الشخصية
- إدارة المستندات والمرفقات لكل عرض
- سجل زمني كامل للنشاطات
- نظام المطابقة التلقائية مع الطلبات

### 📝 **الطلبات**
- 8 مراحل متسلسلة
- مطابقة تلقائية مع العروض المتاحة
- إمكانية ربط الطلب بعرض محدد
- جدولة المعاينات مع تذكيرات
- إمكانية البحث عن عروض خارج النظام

### 👤 **إدارة العملاء**
- جدول واحد موحد لجميع الأطراف (مالك، وسيط، عميل)
- عرض جميع العروض والطلبات المرتبطة بكل عميل
- إدارة جهات الاتصال بشكل مركزي

### 🔔 **التذكيرات والإشعارات**
- تذكيرات تلقائية بعد 3 أيام من تأخر المرحلة
- تذكيرات قبل المواعيد بساعتين
- إرسال إشعارات عبر البريد الإلكتروني
- إرسال إشعارات عبر WhatsApp
- نظام جدولة تلقائي للتذكيرات (Cron Jobs)
- قراءة البريد الإلكتروني عبر IMAP

### 📊 **التقارير**
- لوحة تحكم شاملة مع إحصائيات فورية
- تقارير دورية للعروض والطلبات
- تصدير البيانات بصيغة CSV و Excel
- تقارير الأداء والإنجازات

---

## 🛠️ **التقنيات المستخدمة**

| التقنية | الإصدار | الاستخدام |
|---------|---------|-----------|
| PHP | ^8.3 | لغة البرمجة الأساسية |
| Laravel | ^13.8 | إطار العمل |
| MySQL | 8.0 | قاعدة البيانات |
| JWT | ^2.3 | المصادقة |
| Sanctum | ^4.3 | حماية API |
| PHPMailer | ^6.0 | إرسال البريد الإلكتروني |
| IMAP | - | قراءة البريد الإلكتروني |

---

## 📁 **هيكل المشروع**

```
masar-backend/
├── app/
│   ├── Console/
│   │   └── Commands/
│   │       ├── ProcessReminders.php      # معالجة التذكيرات
│   │       ├── ReminderTimeoutCommand.php # تذكيرات تأخر المراحل
│   │       └── ReadEmailsCommand.php     # قراءة البريد الإلكتروني
│   ├── Http/
│   │   ├── Controllers/Api/              # وحدات التحكم API
│   │   ├── Middleware/                   # الوسائط
│   │   └── Resources/                    # موارد API
│   ├── Models/                           # نماذج البيانات
│   ├── Providers/                        # مزودي الخدمة
│   ├── Services/
│   │   ├── EmailService.php              # خدمة البريد الإلكتروني
│   │   ├── NotificationService.php       # خدمة الإشعارات
│   │   ├── OfferService.php              # خدمة العروض
│   │   ├── RequestService.php            # خدمة الطلبات
│   │   └── MatchingService.php           # خدمة المطابقة
│   └── Traits/
│       └── ApiResponse.php               # خصائص مشتركة
├── config/
│   ├── app.php
│   ├── database.php
│   ├── cors.php
│   ├── jwt.php
│   └── mail.php
├── database/
│   ├── migrations/                       # هيكل قاعدة البيانات
│   └── seeders/                          # البيانات الأولية
├── routes/
│   ├── api.php                           # مسارات API
│   ├── web.php                           # مسارات الويب
│   └── console.php                       # مسارات Console
├── public/
│   └── index.php
├── storage/
│   └── logs/                             # سجلات التطبيق
├── .env                                  # متغيرات البيئة
├── .env.example                          # نموذج متغيرات البيئة
├── composer.json                         # إدارة الحزم
└── README.md                             # هذا الملف
```

---

## 🗄️ **هيكل قاعدة البيانات**

| الجدول | الوصف | عدد الحقول |
|--------|-------|-----------|
| `users` | مستخدم النظام | 5 |
| `settings` | إعدادات الشركة | 13 |
| `property_types` | أنواع العقارات | 4 |
| `deal_types` | أنواع المعاملات | 4 |
| `stages` | مراحل العمل | 7 |
| `clients` | جهات الاتصال | 5 |
| `offers` | العروض العقارية | 27 |
| `offer_attachments` | مرفقات العروض | 8 |
| `requests` | طلبات العملاء | 22 |
| `request_attachments` | مرفقات الطلبات | 8 |
| `reminders` | التذكيرات | 7 |

---

## 🚀 **طريقة التثبيت**

### **المتطلبات الأساسية**
- PHP 8.3 أو أعلى
- MySQL 8.0 أو أعلى
- Composer
- Node.js و NPM (لتطوير الواجهة)
- IMAP extension (لقراءة البريد)

### **خطوات التثبيت**

```bash
# 1. استنساخ المشروع
git clone https://github.com/your-username/masar-backend.git
cd masar-backend

# 2. تثبيت الحزم
composer install --ignore-platform-req=ext-curl -W

# 3. إنشاء ملف البيئة
cp .env.example .env

# 4. تحديث إعدادات قاعدة البيانات في ملف .env
DB_DATABASE=masar_crm
DB_USERNAME=root
DB_PASSWORD=your_password

# 5. إعدادات البريد الإلكتروني في .env
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_ENCRYPTION=tls

# 6. إعدادات IMAP لقراءة البريد
MAIL_IMAP_HOST=imap.gmail.com
MAIL_IMAP_PORT=993
MAIL_IMAP_ENCRYPTION=ssl
MAIL_IMAP_USERNAME=your-email@gmail.com
MAIL_IMAP_PASSWORD=your-app-password

# 7. إنشاء مفتاح التطبيق
php artisan key:generate

# 8. إنشاء مفتاح JWT
php artisan jwt:secret

# 9. تشغيل الـ Migrations
php artisan migrate

# 10. تشغيل الـ Seeders
php artisan db:seed

# 11. تشغيل الخادم
php artisan serve
```

---

## 🔧 **الأوامر المتاحة**

### **أوامر التذكيرات**

```bash
# معالجة التذكيرات المستحقة
php artisan reminders:process

# إنشاء تذكيرات لتأخر المراحل
php artisan reminders:timeout

# قراءة البريد الإلكتروني الوارد
php artisan emails:read --limit=10
```

### **أوامر التطوير**

```bash
# تشغيل خادم التطوير
php artisan serve

# تنظيف الـ Cache
php artisan optimize:clear

# تشغيل الـ Migrations
php artisan migrate:fresh --seed

# تشغيل الـ Scheduler محلياً
php artisan schedule:work
```

---

## ⏰ **جدولة المهام (Cron Jobs)**

أضف هذه السطور في **crontab** لتشغيل المهام تلقائياً:

```bash
# تشغيل التذكيرات كل دقيقة
* * * * * php /path/to/project/artisan reminders:process

# إنشاء تذكيرات تأخر المراحل يومياً
0 0 * * * php /path/to/project/artisan reminders:timeout

# قراءة البريد الإلكتروني كل 10 دقائق
*/10 * * * * php /path/to/project/artisan emails:read --limit=5

# تشغيل الجدولة العامة
* * * * * php /path/to/project/artisan schedule:run >> /dev/null 2>&1
```

---

## 🔑 **المستخدم الافتراضي**

| البريد الإلكتروني | كلمة المرور |
|-------------------|-------------|
| admin@masar.sa | Admin.123 |

---

## 📡 **API Endpoints**

### **المصادقة (Authentication)**

| الطريقة | المسار | الوصف |
|---------|--------|-------|
| POST | `/api/auth/login` | تسجيل الدخول |
| POST | `/api/auth/logout` | تسجيل الخروج |
| GET | `/api/auth/me` | بيانات المستخدم |

### **العروض (Offers)**

| الطريقة | المسار | الوصف |
|---------|--------|-------|
| GET | `/api/offers` | قائمة العروض |
| GET | `/api/offers/{id}` | تفاصيل العرض |
| POST | `/api/offers` | إضافة عرض |
| PUT | `/api/offers/{id}` | تحديث عرض |
| DELETE | `/api/offers/{id}` | حذف عرض |
| PATCH | `/api/offers/{id}/stage` | تغيير المرحلة |

### **الطلبات (Requests)**

| الطريقة | المسار | الوصف |
|---------|--------|-------|
| GET | `/api/requests` | قائمة الطلبات |
| GET | `/api/requests/{id}` | تفاصيل الطلب |
| POST | `/api/requests` | إضافة طلب |
| PUT | `/api/requests/{id}` | تحديث طلب |
| DELETE | `/api/requests/{id}` | حذف طلب |
| GET | `/api/requests/{id}/matching` | إيجاد عروض مطابقة |

### **التذكيرات (Reminders)**

| الطريقة | المسار | الوصف |
|---------|--------|-------|
| GET | `/api/reminders` | قائمة التذكيرات |
| GET | `/api/reminders/active` | التذكيرات النشطة |
| GET | `/api/reminders/overdue` | التذكيرات المتأخرة |
| POST | `/api/reminders` | إنشاء تذكير |
| PUT | `/api/reminders/{id}` | تحديث تذكير |
| DELETE | `/api/reminders/{id}` | حذف تذكير |
| PATCH | `/api/reminders/{id}/done` | تأكيد التذكير |

### **التقارير (Reports)**

| الطريقة | المسار | الوصف |
|---------|--------|-------|
| GET | `/api/reports/dashboard` | لوحة التحكم |
| GET | `/api/reports/offers` | تقرير العروض |
| GET | `/api/reports/requests` | تقرير الطلبات |
| GET | `/api/reports/performance` | تقرير الأداء |

---

## 📝 **مراحل العمل**

### **مراحل عروض الشركة (11 مرحلة)**

| # | المرحلة | اللون |
|---|---------|-------|
| 1 | عرض جديد | 🔵 #3B82F6 |
| 2 | بانتظار رد المدير | 🟡 #F59E0B |
| 3 | تم تحديد السعر | 🟣 #8B5CF6 |
| 4 | تم إبلاغ المالك | 🩷 #EC4899 |
| 5 | تم استلام المستندات | 🟢 #10B981 |
| 6 | قيد المراجعة القانونية | 🟣 #6366F1 |
| 7 | تم اعتماد العقد | 🔵 #06B6D4 |
| 8 | بانتظار توقيع العميل | 🟡 #F59E0B |
| 9 | تم توقيع العميل | 🟢 #10B981 |
| 10 | تم إرسال العقد الموقع للقانونية | 🟣 #6366F1 |
| 11 | ✅ مكتمل | 🟢 #059669 |

### **مراحل الطلبات (8 مراحل)**

| # | المرحلة | اللون |
|---|---------|-------|
| 1 | طلب جديد | 🔵 #3B82F6 |
| 2 | جاري المطابقة | 🟡 #F59E0B |
| 3 | تم اختيار العرض | 🟣 #8B5CF6 |
| 4 | جدولة المعاينة | 🩷 #EC4899 |
| 5 | تمت المعاينة | 🟢 #10B981 |
| 6 | قيد التفاوض | 🟣 #6366F1 |
| 7 | تم الاتفاق | 🔵 #06B6D4 |
| 8 | ✅ مكتمل | 🟢 #059669 |

---

## 🧪 **اختبار API**

### **مثال طلب تسجيل الدخول**

```bash
POST /api/auth/login
Content-Type: application/json

{
    "email": "admin@masar.sa",
    "password": "Admin@123"
}
```

### **مثال إنشاء تذكير**

```bash
POST /api/reminders
Authorization: Bearer {token}
Content-Type: application/json

{
    "offer_id": 1,
    "reminder_time": "2024-01-05 14:00:00",
    "note": "متابعة العرض مع العميل"
}
```

---

## 📧 **إعدادات البريد الإلكتروني**

### **SMTP (للإرسال)**

```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS="info@masar.sa"
MAIL_FROM_NAME="${APP_NAME}"
```

### **IMAP (للاستقبال)**

```env
MAIL_IMAP_HOST=imap.gmail.com
MAIL_IMAP_PORT=993
MAIL_IMAP_ENCRYPTION=ssl
MAIL_IMAP_USERNAME=your-email@gmail.com
MAIL_IMAP_PASSWORD=your-app-password
```

---

## 📁 **السجلات (Logs)**

يتم تخزين السجلات في:

```
storage/logs/
├── laravel.log              # سجلات التطبيق
├── php_errors.log           # أخطاء PHP
└── laravel-YYYY-MM-DD.log   # سجلات يومية
```

---

**تم التطوير بواسطة فريق مسار** 🚀
```
