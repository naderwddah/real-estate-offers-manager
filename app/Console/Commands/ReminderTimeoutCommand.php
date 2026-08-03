<?php

namespace App\Console\Commands;

use App\Models\Offer;
use App\Models\Stage;
use App\Models\Reminder;
use App\Models\Setting;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class ReminderTimeoutCommand extends Command
{
    protected $signature = 'reminders:timeout';
    protected $description = 'إنشاء تذكيرات للعروض المتأخرة في المراحل';

    public function handle()
    {
        $this->info('⏰ جاري فحص العروض المتأخرة...');

        $settings = Setting::first();
        $maxWaitDays = $settings->max_wait_days ?? 3;

        // ✅ تصحيح: استخدام current_stage_id بدلاً من stage_id
        $waitingStages = [2, 4, 6, 8, 11];

        $offers = Offer::where('is_active', true)
            ->where('is_closed', false)
            ->whereIn('current_stage_id', $waitingStages)  // ✅ تصحيح هنا
            ->where('status_date', '<=', now()->subDays($maxWaitDays))
            ->get();

        $this->info("📋 تم العثور على {$offers->count()} عرض متأخر");

        $createdCount = 0;
        foreach ($offers as $offer) {
            // التحقق من وجود تذكير سابق
            $existing = Reminder::where('offer_id', $offer->id)
                ->where('is_sent', false)
                ->where('reminder_time', '>', now())
                ->first();

            if (!$existing) {
                $stage = Stage::find($offer->current_stage_id);
                $stageName = $stage->name ?? 'المرحلة الحالية';
                
                Reminder::create([
                    'offer_id' => $offer->id,
                    'reminder_time' => now()->addDays(1),
                    'note' => "تذكير: العرض {$offer->display_id} في مرحلة '{$stageName}' منذ أكثر من {$maxWaitDays} أيام",
                    'created_by' => 1
                ]);

                $createdCount++;
                $this->info("✅ تم إنشاء تذكير للعرض {$offer->display_id}");
                Log::info('✅ تم إنشاء تذكير تأخر', [
                    'offer_id' => $offer->id,
                    'stage' => $stageName
                ]);
            }
        }

        $this->info("✅ تم إنشاء {$createdCount} تذكير تأخر");
        return 0;
    }
}