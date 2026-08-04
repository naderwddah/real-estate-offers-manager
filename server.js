const express = require('express');
const cors = require('cors');
const path = require('path');
const { getJson } = require('serpapi');

const app = express();

// تفعيل مشاركة الموارد (CORS)
app.use(cors());

// ✅ التعديل الجديد: إخبار الخادم بقراءة وعرض ملف index.html الموجود في نفس المجلد
app.use(express.static(__dirname));

// ⚠️ لا تنسَ وضع مفتاح SerpApi الحقيقي الخاص بك هنا بدلاً من النص
const API_KEY = "5882feb85ac6777549c00c646cdd8cd1c655f0ae95b84375108496eae05f2b96";

// نقطة الاتصال لاستقبال طلبات البحث من الواجهة
app.get('/api/search', (req, res) => {
    const { activity, location } = req.query;
    
    // حماية إضافية: التأكد من أن المستخدم أدخل البيانات
    if (!activity || !location) {
        return res.status(400).json({ error: "الرجاء إدخال النشاط والمنطقة." });
    }
    
    const searchQuery = `${activity} في ${location}`; 
    console.log(`⏳ جاري البحث الحي عن: ${searchQuery}...`);

    try {
        // إرسال الطلب إلى SerpApi
        getJson({
            engine: "google_maps",
            q: searchQuery,
            type: "search",
            api_key: API_KEY
        }, (json) => {
            // التقاط أخطاء SerpApi (مثل مفتاح خاطئ أو انتهاء الرصيد)
            if(json.error) {
                console.error("❌ خطأ من SerpApi:", json.error);
                return res.status(500).json({ error: json.error });
            }
            
            // إرسال النتائج بنجاح إلى الواجهة الأمامية
            const results = json.local_results || [];
            console.log(`✅ تم العثور على ${results.length} نتيجة.`);
            res.json(results);
        });
    } catch (error) {
        // التقاط أي أخطاء برمجية مفاجئة حتى لا يتوقف السيرفر
        console.error("❌ خطأ داخلي في الخادم:", error);
        res.status(500).json({ error: "حدث خطأ غير متوقع في الخادم." });
    }
});

// المسار الرئيسي لفتح الصفحة
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages/map_searcher.html'));
});

// تشغيل الخادم على المنفذ 3000
const PORT = 3000;
app.listen(PORT, () => {
    console.log('====================================');
    console.log('🚀 السيرفر يعمل الآن بنجاح!');
    console.log(`🔗 لفتح الموقع، اضغط على الرابط التالي (أو انسخه في المتصفح):`);
    console.log(`👉 http://localhost:${PORT}`);
    console.log('====================================');
});