<?php

namespace App\Console\Commands;

use App\Services\EmailService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class ReadEmailsCommand extends Command
{
    protected $signature = 'emails:read {--limit=10 : عدد الرسائل المراد قراءتها}';
    protected $description = 'قراءة البريد الإلكتروني الوارد عبر IMAP';

    protected $emailService;

    public function __construct(EmailService $emailService)
    {
        parent::__construct();
        $this->emailService = $emailService;
    }

    public function handle()
    {
        $this->info('📧 جاري قراءة البريد الإلكتروني...');

        $limit = $this->option('limit');
        $emails = $this->emailService->readEmails($limit);

        if (empty($emails)) {
            $this->info('📭 لا توجد رسائل جديدة');
            return 0;
        }

        $this->info("📨 تم العثور على {$emails} رسائل جديدة");

        foreach ($emails as $email) {
            $this->info("📩 من: {$email['from_name']} <{$email['from']}>");
            $this->info("📋 الموضوع: {$email['subject']}");
            $this->info("📝 الملخص: " . substr($email['body'], 0, 100) . "...");
            $this->info("---");
        }

        Log::info('تم قراءة البريد الإلكتروني', [
            'count' => count($emails)
        ]);

        return 0;
    }
}