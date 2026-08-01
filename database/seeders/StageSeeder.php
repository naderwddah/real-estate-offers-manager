<?php

namespace Database\Seeders;

use App\Models\Stage;
use Illuminate\Database\Seeder;

class StageSeeder extends Seeder
{
    public function run()
    {
        // مراحل عروض الشركة
        $companyStages = [
            ['name' => 'عرض جديد', 'order' => 1, 'color' => '#3B82F6'],
            ['name' => 'بانتظار رد المدير', 'order' => 2, 'color' => '#F59E0B'],
            ['name' => 'تم تحديد السعر', 'order' => 3, 'color' => '#8B5CF6'],
            ['name' => 'تم إبلاغ المالك', 'order' => 4, 'color' => '#EC4899'],
            ['name' => 'تم استلام المستندات', 'order' => 5, 'color' => '#10B981'],
            ['name' => 'قيد المراجعة القانونية', 'order' => 6, 'color' => '#6366F1'],
            ['name' => 'تم اعتماد العقد', 'order' => 7, 'color' => '#06B6D4'],
            ['name' => 'بانتظار توقيع العميل', 'order' => 8, 'color' => '#F59E0B'],
            ['name' => 'تم توقيع العميل', 'order' => 9, 'color' => '#10B981'],
            ['name' => 'تم إرسال العقد الموقع للقانونية', 'order' => 10, 'color' => '#6366F1'],
            ['name' => 'مكتمل', 'order' => 11, 'color' => '#059669', 'final' => true],
        ];

        foreach ($companyStages as $stage) {
            Stage::create([
                'track_type' => 'company_offer',
                'name' => $stage['name'],
                'stage_order' => $stage['order'],
                'color' => $stage['color'],
                'is_final' => $stage['final'] ?? false,
            ]);
        }

        // مراحل العروض الشخصية
        $personalStages = [
            ['name' => 'عرض جديد', 'order' => 1, 'color' => '#3B82F6'],
            ['name' => 'تفاوض', 'order' => 2, 'color' => '#F59E0B'],
            ['name' => 'تم الاتفاق', 'order' => 3, 'color' => '#10B981'],
            ['name' => 'مكتمل', 'order' => 4, 'color' => '#059669', 'final' => true],
        ];

        foreach ($personalStages as $stage) {
            Stage::create([
                'track_type' => 'personal_offer',
                'name' => $stage['name'],
                'stage_order' => $stage['order'],
                'color' => $stage['color'],
                'is_final' => $stage['final'] ?? false,
            ]);
        }

        // مراحل الطلبات
        $requestStages = [
            ['name' => 'طلب جديد', 'order' => 1, 'color' => '#3B82F6'],
            ['name' => 'جاري المطابقة', 'order' => 2, 'color' => '#F59E0B'],
            ['name' => 'تم اختيار العرض', 'order' => 3, 'color' => '#8B5CF6'],
            ['name' => 'جدولة المعاينة', 'order' => 4, 'color' => '#EC4899'],
            ['name' => 'تمت المعاينة', 'order' => 5, 'color' => '#10B981'],
            ['name' => 'قيد التفاوض', 'order' => 6, 'color' => '#6366F1'],
            ['name' => 'تم الاتفاق', 'order' => 7, 'color' => '#06B6D4'],
            ['name' => 'مكتمل', 'order' => 8, 'color' => '#059669', 'final' => true],
        ];

        foreach ($requestStages as $stage) {
            Stage::create([
                'track_type' => 'request',
                'name' => $stage['name'],
                'stage_order' => $stage['order'],
                'color' => $stage['color'],
                'is_final' => $stage['final'] ?? false,
            ]);
        }
    }
}