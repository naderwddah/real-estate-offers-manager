<?php

namespace App\Services;

use App\Models\Reminder;
use Illuminate\Support\Facades\Log;

class NotificationService
{
    public function sendReminderNotification($reminder)
    {
        $target = $reminder->offer ?? $reminder->request;
        if (!$target) return;

        $phone = $target->contact_phone ?? null;
        if (!$phone) {
            Log::warning('لا يوجد رقم هاتف للإشعار', ['reminder_id' => $reminder->id]);
            return;
        }

        $message = $this->formatMessage($reminder, $target);
        
        // إرسال عبر WhatsApp
        $this->sendWhatsApp($phone, $message);
        
        // إرسال عبر SMS (إذا كان متاحاً)
        // $this->sendSMS($phone, $message);
    }

    private function formatMessage($reminder, $target)
    {
        $type = $reminder->offer_id ? 'عرض' : 'طلب';
        $id = $target->display_id ?? $target->id;
        
        return "🔔 *تذكير من نظام مسار*\n\n" .
               "📋 {$type}: {$id}\n" .
               "📝 {$reminder->note}\n" .
               "⏰ التاريخ: " . now()->format('Y-m-d H:i');
    }

    private function sendWhatsApp($phone, $message)
    {
        // استخدام WhatsApp API
        $url = "https://api.whatsapp.com/send?phone={$phone}&text=" . urlencode($message);
        
        Log::info('📱 إرسال واتساب', [
            'phone' => $phone,
            'url' => $url
        ]);

        // يمكن استخدام Twilio أو أي خدمة أخرى
        // Twilio::message($phone, $message);
    }
}