<?php

namespace App\Services;

use App\Models\Reminder;
use App\Models\Offer;
use App\Models\Request as RequestModel;
use App\Models\Setting;
use Illuminate\Support\Facades\Log;

class ReminderService
{
    /**
     * معالجة التذكيرات المستحقة
     */
    public function processDueReminders()
    {
        $reminders = Reminder::where('is_sent', false)
                             ->where('reminder_time', '<=', now())
                             ->get();

        foreach ($reminders as $reminder) {
            $this->sendReminder($reminder);
        }

        return $reminders->count();
    }

    /**
     * إرسال التذكير
     */
    public function sendReminder(Reminder $reminder)
    {
        try {
            // هنا يمكن إضافة إرسال إشعار أو بريد إلكتروني
            // حالياً نقوم فقط بتسجيله
            Log::info('تم إرسال تذكير', [
                'id' => $reminder->id,
                'note' => $reminder->note,
                'time' => $reminder->reminder_time
            ]);

            $reminder->markAsSent();
        } catch (\Exception $e) {
            Log::error('فشل إرسال التذكير: ' . $e->getMessage());
        }
    }

    /**
     * إنشاء تذكير لتأخر المرحلة
     */
    public function createStageTimeoutReminder(Offer $offer)
    {
        $settings = Setting::getSettings();
        $days = $settings->max_wait_days ?? 3;

        // التحقق من وجود تذكير سابق
        $existing = Reminder::where('offer_id', $offer->id)
                            ->where('is_sent', false)
                            ->where('reminder_time', '>', now())
                            ->first();

        if ($existing) {
            return $existing;
        }

        $stageName = $offer->currentStage->name ?? 'المرحلة الحالية';

        $reminder = Reminder::create([
            'offer_id' => $offer->id,
            'reminder_time' => now()->addDays($days),
            'note' => "تذكير: العرض {$offer->display_id} في مرحلة '{$stageName}' منذ أكثر من {$days} أيام",
            'created_by' => 1 // المسوق الرئيسي
        ]);

        return $reminder;
    }

    /**
     * إنشاء تذكير للمواعيد
     */
    public function createAppointmentReminder($requestId, $appointmentDate, $notes = null)
    {
        $reminderTime = \Carbon\Carbon::parse($appointmentDate)->subHours(2);

        $reminder = Reminder::create([
            'request_id' => $requestId,
            'reminder_time' => $reminderTime,
            'note' => $notes ?? 'تذكير بموعد المعاينة',
            'created_by' => 1
        ]);

        return $reminder;
    }

    /**
     * معالجة تذكيرات تأخر المراحل تلقائياً
     */
    public function processStageTimeouts()
    {
        $settings = Setting::getSettings();
        $days = $settings->max_wait_days ?? 3;

        // العروض المتأخرة
        $offers = Offer::where('is_active', true)
                       ->where('is_closed', false)
                       ->where('status_date', '<=', now()->subDays($days))
                       ->get();

        foreach ($offers as $offer) {
            $this->createStageTimeoutReminder($offer);
        }

        return $offers->count();
    }
}