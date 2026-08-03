<?php

namespace App\Console\Commands;

use App\Models\Reminder;
use App\Models\Offer;
use App\Models\Request as RequestModel;
use App\Services\EmailService;
use App\Services\NotificationService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class ProcessReminders extends Command
{
    protected $signature = 'reminders:process';
    protected $description = 'معالجة التذكيرات المستحقة وإرسالها';

    protected $emailService;
    protected $notificationService;

    public function __construct(EmailService $emailService, NotificationService $notificationService)
    {
        parent::__construct();
        $this->emailService = $emailService;
        $this->notificationService = $notificationService;
    }

    public function handle()
    {
        $this->info('⏰ جاري معالجة التذكيرات المستحقة...');

        // جلب التذكيرات غير المرسلة والتي حان وقتها
        $reminders = Reminder::where('is_sent', false)
            ->where('reminder_time', '<=', now())
            ->get();

        if ($reminders->isEmpty()) {
            $this->info('✅ لا توجد تذكيرات مستحقة');
            return 0;
        }

        $this->info("📋 تم العثور على {$reminders->count()} تذكير مستحق");

        $sentCount = 0;
        foreach ($reminders as $reminder) {
            try {
                $this->sendReminder($reminder);
                $reminder->is_sent = true;
                $reminder->sent_at = now();
                $reminder->save();
                $sentCount++;
                $this->info("✅ تم إرسال التذكير #{$reminder->id}");
            } catch (\Exception $e) {
                $this->error("❌ فشل إرسال التذكير #{$reminder->id}: " . $e->getMessage());
                Log::error('فشل إرسال التذكير', [
                    'reminder_id' => $reminder->id,
                    'error' => $e->getMessage()
                ]);
            }
        }

        $this->info("✅ تم إرسال {$sentCount} تذكير");
        return 0;
    }

    private function sendReminder($reminder)
    {
        $target = $reminder->offer ?? $reminder->request;
        if (!$target) {
            Log::warning('التذكير بدون عرض أو طلب', ['reminder_id' => $reminder->id]);
            return;
        }

        $title = $reminder->note ?? 'تذكير';

        // 1. إرسال بريد إلكتروني
        if ($target->contact_email) {
            $this->emailService->sendReminderEmail($reminder);
            $this->info("📧 تم إرسال بريد إلى: {$target->contact_email}");
        }

        // 2. إرسال WhatsApp (إذا كان متاحاً)
        if ($target->contact_phone) {
            $this->notificationService->sendReminderNotification($reminder);
            $this->info("📱 تم إرسال واتساب إلى: {$target->contact_phone}");
        }

        // 3. تسجيل في سجل النشاط
        $target->addLog("🔔 تم إرسال تذكير: {$title}");

        Log::info('📬 تم إرسال التذكير', [
            'reminder_id' => $reminder->id,
            'title' => $title,
            'target_id' => $target->id,
            'target_type' => $reminder->offer_id ? 'offer' : 'request'
        ]);
    }
}