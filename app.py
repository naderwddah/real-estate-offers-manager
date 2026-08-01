from flask import Flask, render_template, jsonify
from playwright.sync_api import sync_playwright
import time

app = Flask(__name__)

# ==================================================
# الإعدادات الجديدة (تم تعديلها لزيادة العدد وحصرها للبيع)
# ==================================================
# استخدمنا رابط البحث عن "للبيع" داخل قسم "حراج العقار"
TARGET_URL = "https://haraj.com.sa/search/%D9%84%D9%84%D8%A8%D9%8A%D8%B9?tag=%D8%AD%D8%B1%D8%A7%D8%AC%20%D8%A7%D9%84%D8%B9%D9%82%D8%A7%D8%B1"

MAX_SCROLLS = 8          # تم زيادة التمرير لأسفل لجلب عناصر أكثر في الصفحة الرئيسية
MAX_DETAIL_PAGES = 50    # تم زيادة الحد الأقصى للإعلانات التي سيتم جلب وصفها بالكامل (يمكنك تغييره حسب الرغبة)
# ==================================================

def scrape_haraj_real_estate():
    all_posts = []
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        page = context.new_page()

        print("⏳ جاري فتح صفحة العقارات (المخصصة للبيع)...")
        page.goto(TARGET_URL, wait_until="networkidle", timeout=60000)

        # التمرير لتحميل إعلانات أكثر
        for i in range(MAX_SCROLLS):
            page.mouse.wheel(0, 1500)
            time.sleep(1.5)

        post_elements = page.locator('[data-testid="post-item"]')
        total_posts = post_elements.count()
        print(f"✅ تم العثور على {total_posts} إعلان في الصفحة الرئيسية.")

        # استخراج البيانات الأساسية وفلترة الإيجار
        collected_count = 0
        for i in range(total_posts):
            if collected_count >= MAX_DETAIL_PAGES:
                break # نتوقف إذا وصلنا للعدد المطلوب

            element = post_elements.nth(i)
            data = {}
            
            # العنوان والرابط
            title_link = element.locator('[data-testid="post-title-link"]')
            if title_link.count() > 0:
                title = title_link.inner_text().strip()
                
                # ==== شرط الفلترة الإضافي ====
                # نتجاهل الإعلان فوراً إذا كان يحتوي على كلمة إيجار أو مطلوب
                if 'ايجار' in title or 'إيجار' in title or 'مطلوب' in title:
                    continue 

                data['title'] = title
                href = title_link.get_attribute('href')
                data['link'] = ("https://haraj.com.sa" + href) if href and not href.startswith('http') else href
            else:
                continue # تخطي إذا لم يوجد عنوان

            data['id'] = element.get_attribute('data-test-postid') or f"unknown_{i}"
            
            # السعر
            price_elem = element.locator('div[dir="ltr"] span.tabular-nums')
            data['price'] = price_elem.inner_text().strip() if price_elem.count() > 0 else "غير محدد"

            # المدينة/الموقع
            location_elem = element.locator('a.inline-flex.items-center.gap-1.pb-0.shrink-0.h-5 span:last-child')
            data['city'] = location_elem.inner_text().strip() if location_elem.count() > 0 else "غير محدد"

            # الناشر
            author_attr = element.get_attribute('data-test-author')
            data['author'] = author_attr if author_attr else "غير محدد"

            data['description'] = "جاري التحميل..."
            all_posts.append(data)
            collected_count += 1

        # الدخول لصفحة كل إعلان لجلب الوصف (التفاصيل)
        print(f"⏳ جاري الدخول لـ {len(all_posts)} إعلان لجلب الوصف الدقيق...")
        detail_page = context.new_page()
        
        for index, post in enumerate(all_posts):
            if not post.get('link'):
                post['description'] = "لا يوجد رابط"
                continue
                
            try:
                print(f" 📄 استخراج الإعلان رقم {index+1} من {len(all_posts)}...")
                detail_page.goto(post['link'], wait_until="domcontentloaded", timeout=20000)
                
                article_elem = detail_page.locator('[data-testid="post-article"]')
                if article_elem.count() > 0:
                    desc_text = article_elem.inner_text().strip()
                    # أخذ أول 300 حرف لتوضيح التفاصيل للعميل بدون تشويه الجدول
                    post['description'] = desc_text[:300] + "..." if len(desc_text) > 300 else desc_text
                else:
                    post['description'] = "لا يوجد وصف"
                    
            except Exception as e:
                print(f"⚠️ خطأ في الإعلان {post['id']}: {e}")
                post['description'] = "خطأ في جلب الوصف"

        detail_page.close()
        browser.close()
        
        print("🎉 اكتمل السحب بنجاح!")
        return all_posts

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/ads')
def get_ads():
    data = scrape_haraj_real_estate()
    return jsonify(data)

if __name__ == '__main__':
    app.run(debug=True, port=5000)