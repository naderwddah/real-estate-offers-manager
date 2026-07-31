import json
import time
from playwright.sync_api import sync_playwright

# ==================================================
# الرابط المستهدف (صفحة القائمة)
# ==================================================
TARGET_URL = "https://haraj.com.sa/tags/%D8%AD%D8%B1%D8%A7%D8%AC%20%D8%A7%D9%84%D8%B3%D9%8A%D8%A7%D8%B1%D8%A7%D8%AA"
MAX_SCROLLS = 5          # عدد مرات التمرير لتحميل المزيد من الإعلانات
MAX_DETAIL_PAGES = 20    # الحد الأقصى لعدد صفحات التفاصيل التي سيتم زيارتها (لتجنب الوقت الطويل)
# ==================================================

def extract_post_data_from_list(post_element):
    """
    استخراج البيانات الأساسية من صفحة القائمة
    """
    data = {}

    # 1. رقم الإعلان (من السمة data-test-postid)
    post_id = post_element.get_attribute('data-test-postid')
    data['post_id'] = post_id

    # 2. العنوان والرابط
    title_link = post_element.locator('[data-testid="post-title-link"]')
    if title_link.count() > 0:
        data['title'] = title_link.inner_text().strip()
        href = title_link.get_attribute('href')
        if href and not href.startswith('http'):
            href = "https://haraj.com.sa" + href
        data['link'] = href
    else:
        data['title'] = None
        data['link'] = None

    # 3. السعر
    price_elem = post_element.locator('div[dir="ltr"] span.tabular-nums')
    data['price'] = price_elem.inner_text().strip() if price_elem.count() > 0 else None

    # 4. الموقع
    location_elem = post_element.locator('a.inline-flex.items-center.gap-1.pb-0.shrink-0.h-5 span:last-child')
    data['location'] = location_elem.inner_text().strip() if location_elem.count() > 0 else None

    # 5. الوقت
    time_elem = post_element.locator('div.flex.h-5.shrink-0.items-center.gap-1.overflow-ellipsis span:last-child')
    data['time'] = time_elem.inner_text().strip() if time_elem.count() > 0 else None

    # 6. اسم الناشر
    author_attr = post_element.get_attribute('data-test-author')
    if author_attr:
        data['publisher'] = author_attr
    else:
        publisher_link = post_element.locator('a.hover\\:text-text-primary.flex.h-5.items-center.gap-1\\.5 span:last-child')
        data['publisher'] = publisher_link.inner_text().strip() if publisher_link.count() > 0 else None

    # 7. رابط الصورة الرئيسية
    img_elem = post_element.locator('a img').first
    data['image_url'] = img_elem.get_attribute('src') if img_elem.count() > 0 else None

    return data


def extract_post_details(page, post_data):
    """
    زيارة صفحة التفاصيل واستخراج الوصف الكامل والبيانات الإضافية
    """
    if not post_data.get('link'):
        post_data['description'] = None
        post_data['extra_details'] = {}
        return post_data

    try:
        print(f"   📄 جاري فتح: {post_data['link']}")
        page.goto(post_data['link'], wait_until="networkidle", timeout=30000)
        time.sleep(1)  # انتظار تحميل المحتوى الديناميكي

        # 1. استخراج الوصف من العنصر data-testid="post-article"
        #    نستخدم محدداً أكثر مرونة إذا لم يكن موجوداً
        description = None
        article_elem = page.locator('[data-testid="post-article"]')
        if article_elem.count() > 0:
            description = article_elem.inner_text().strip()
        else:
            # محاولة بديلة: البحث عن أي عنصر يحتوي على النص الوصفي
            # في الصفحة التي تم فحصها، النص موجود مباشرة في body
            # ولكن قد يكون داخل عنصر معين
            body_text = page.locator('body').inner_text().strip()
            # نحاول استخراج الجزء الوصفي (بين العنوان والتفاصيل الأخرى)
            # هذه محاولة تقريبية، يمكن تعديلها حسب الحاجة
            description = body_text

        post_data['description'] = description

        # 2. محاولة استخراج بيانات إضافية من الصفحة (مثل: السعر، الموقع، تاريخ النشر، etc.)
        extra = {}

        # محاولة استخراج السعر من صفحة التفاصيل (قد يكون أكثر دقة)
        price_detail = page.locator('[data-testid="post-price"]')
        if price_detail.count() > 0:
            extra['price_detail'] = price_detail.inner_text().strip()

        # محاولة استخراج تاريخ النشر
        date_elem = page.locator('[data-testid="post-date"]')
        if date_elem.count() > 0:
            extra['publish_date'] = date_elem.inner_text().strip()

        # محاولة استخراج عدد المشاهدات
        views_elem = page.locator('[data-testid="post-views"]')
        if views_elem.count() > 0:
            extra['views'] = views_elem.inner_text().strip()

        # محاولة استخراج اسم الناشر من صفحة التفاصيل
        author_detail = page.locator('[data-testid="post-author"]')
        if author_detail.count() > 0:
            extra['publisher_detail'] = author_detail.inner_text().strip()

        # محاولة استخراج أي نصوص إضافية
        extra_text = page.locator('[data-testid="post-extra"]')
        if extra_text.count() > 0:
            extra['extra_text'] = extra_text.inner_text().strip()

        post_data['extra_details'] = extra

    except Exception as e:
        print(f"   ⚠️ خطأ في استخراج تفاصيل الإعلان: {e}")
        post_data['description'] = None
        post_data['extra_details'] = {'error': str(e)}

    return post_data


def scrape_all_posts():
    """
    الدالة الرئيسية: فتح صفحة القائمة، استخراج الروابط، ثم زيارة كل رابط للحصول على التفاصيل
    """
    with sync_playwright() as p:
        # تشغيل المتصفح (headless=True للتشغيل الخلفي)
        browser = p.chromium.launch(headless=False)
        context = browser.new_context()
        page = context.new_page()

        print(f"⏳ جاري تحميل صفحة القائمة: {TARGET_URL}")
        page.goto(TARGET_URL, wait_until="networkidle")

        # انتظار ظهور الإعلانات الأولى
        try:
            page.wait_for_selector('[data-testid="post-item"]', timeout=15000)
            print("✅ تم تحميل الإعلانات الأولية.")
        except:
            print("⚠️ لم يتم العثور على إعلانات، قد يكون هناك مشكلة في التحميل.")

        # التمرير لأسفل لتحميل إعلانات إضافية
        print(f"⏳ جاري التمرير {MAX_SCROLLS} مرات لتحميل المزيد...")
        previous_count = 0
        for i in range(MAX_SCROLLS):
            page.mouse.wheel(0, 800)
            time.sleep(2)

            current_items = page.locator('[data-testid="post-item"]')
            current_count = current_items.count()
            print(f"   التمرير {i+1}: تم العثور على {current_count} إعلان")

            if current_count == previous_count and i > 0:
                print("   لم يتم تحميل إعلانات جديدة، التوقف عن التمرير.")
                break
            previous_count = current_count

        # الحصول على جميع عناصر الإعلانات من صفحة القائمة
        post_elements = page.locator('[data-testid="post-item"]')
        total_posts = post_elements.count()
        print(f"\n📊 إجمالي الإعلانات التي تم تحميلها: {total_posts}")

        # استخراج البيانات الأساسية من كل إعلان في صفحة القائمة
        all_posts = []
        for i in range(total_posts):
            element = post_elements.nth(i)
            post_data = extract_post_data_from_list(element)
            all_posts.append(post_data)

            if (i + 1) % 10 == 0:
                print(f"   تم استخراج {i+1} إعلان من صفحة القائمة...")

        print(f"✅ تم استخراج {len(all_posts)} إعلان من صفحة القائمة.")

        # =============================================================
        # الآن: زيارة صفحة كل إعلان للحصول على الوصف والتفاصيل الإضافية
        # =============================================================
        print(f"\n⏳ جاري استخراج التفاصيل من {min(len(all_posts), MAX_DETAIL_PAGES)} إعلان...")

        # نفتح صفحة جديدة للتفاصيل حتى لا نؤثر على صفحة القائمة
        detail_page = context.new_page()

        for i, post in enumerate(all_posts[:MAX_DETAIL_PAGES]):
            print(f"\n--- استخراج تفاصيل الإعلان {i+1}/{min(len(all_posts), MAX_DETAIL_PAGES)} ---")
            post = extract_post_details(detail_page, post)
            all_posts[i] = post  # تحديث البيانات

            # تحديث التقدم
            print(f"   ✅ تم استخراج التفاصيل للإعلان: {post.get('title', 'بدون عنوان')[:30]}...")

        # إغلاق صفحة التفاصيل
        detail_page.close()

        # حفظ البيانات في ملف JSON
        output_file = 'haraj_posts_with_details.json'
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(all_posts, f, ensure_ascii=False, indent=2)

        print(f"\n💾 تم حفظ البيانات في ملف '{output_file}'")

        # عرض عينة من أول 3 إعلانات مع الوصف
        print("\n📋 عينة من أول 3 إعلانات مع الوصف:")
        for i, post in enumerate(all_posts[:3], 1):
            print(f"\n--- الإعلان {i} ---")
            print(f"  المعرف: {post['post_id']}")
            print(f"  العنوان: {post['title']}")
            print(f"  السعر: {post['price']}")
            print(f"  الموقع: {post['location']}")
            print(f"  الناشر: {post['publisher']}")
            print(f"  الرابط: {post['link']}")
            print(f"  الوصف (أول 200 حرف): {post.get('description', '')[:200]}...")
            if post.get('extra_details'):
                print(f"  بيانات إضافية: {post['extra_details']}")

        # إحصاءات سريعة
        posts_with_desc = [p for p in all_posts if p.get('description')]
        print("\n📊 إحصاءات سريعة:")
        print(f"  - عدد الإعلانات الكلي: {len(all_posts)}")
        print(f"  - عدد الإعلانات التي تم استخراج وصفها: {len(posts_with_desc)}")
        if posts_with_desc:
            avg_len = sum(len(p.get('description', '')) for p in posts_with_desc) // len(posts_with_desc)
            print(f"  - متوسط طول الوصف: {avg_len} حرف")

        browser.close()


if __name__ == "__main__":
    scrape_all_posts()