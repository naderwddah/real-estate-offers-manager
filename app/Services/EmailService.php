<?php

namespace App\Services;

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;
use Illuminate\Support\Facades\Log;

class EmailService
{
    protected $mailer;

    public function __construct()
    {
        $this->mailer = new PHPMailer(true);
    }

    /**
     * إرسال بريد إلكتروني
     */
    public function sendEmail($to, $subject, $body, $attachments = [])
    {
        try {
            // إعدادات SMTP
            $this->mailer->isSMTP();
            $this->mailer->Host = env('MAIL_HOST', 'smtp.gmail.com');
            $this->mailer->SMTPAuth = true;
            $this->mailer->Username = env('MAIL_USERNAME');
            $this->mailer->Password = env('MAIL_PASSWORD');
            $this->mailer->SMTPSecure = env('MAIL_ENCRYPTION', 'tls');
            $this->mailer->Port = env('MAIL_PORT', 587);
            
            // إعدادات البريد
            $this->mailer->setFrom(env('MAIL_FROM_ADDRESS'), env('MAIL_FROM_NAME'));
            $this->mailer->addAddress($to);
            $this->mailer->isHTML(true);
            $this->mailer->Subject = $subject;
            $this->mailer->Body = $this->buildHtmlBody($body);
            $this->mailer->AltBody = strip_tags($body);

            // إضافة المرفقات
            foreach ($attachments as $attachment) {
                if (file_exists($attachment)) {
                    $this->mailer->addAttachment($attachment);
                }
            }

            $this->mailer->send();
            
            Log::info('📧 تم إرسال البريد الإلكتروني', [
                'to' => $to,
                'subject' => $subject
            ]);

            return true;

        } catch (Exception $e) {
            Log::error('فشل إرسال البريد الإلكتروني', [
                'to' => $to,
                'subject' => $subject,
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }

    /**
     * إرسال إشعار تذكير عبر البريد
     */
    public function sendReminderEmail($reminder)
    {
        $target = $reminder->offer ?? $reminder->request;
        if (!$target) return false;

        $to = $target->contact_email ?? env('MAIL_FROM_ADDRESS');
        $subject = "🔔 تذكير من نظام مسار";
        
        $body = $this->buildReminderBody($reminder, $target);

        return $this->sendEmail($to, $subject, $body);
    }

    /**
     * بناء نص البريد للتذكير
     */
    private function buildReminderBody($reminder, $target)
    {
        $type = $reminder->offer_id ? 'عرض' : 'طلب';
        $id = $target->display_id ?? $target->id;
        $stageName = $target->stage->name ?? '-';

        return "
        <div style='font-family: Tajawal, Arial, sans-serif; direction: rtl; max-width: 600px; margin: 0 auto; padding: 20px; background: #0B121E; color: #EDEAE2; border-radius: 16px;'>
            <div style='text-align: center; padding: 20px 0; border-bottom: 1px solid rgba(237, 234, 226, 0.08);'>
                <h1 style='color: #C9A24B; font-size: 28px;'>🏢 مسار</h1>
                <p style='color: #8B96A8;'>نظام متابعة العروض العقارية</p>
            </div>
            
            <div style='padding: 20px 0;'>
                <h2 style='color: #C9A24B; font-size: 22px;'>🔔 تذكير</h2>
                
                <div style='background: #121B2C; border: 1px solid rgba(237, 234, 226, 0.08); border-radius: 12px; padding: 16px; margin: 16px 0;'>
                    <p><strong>📋 {$type}:</strong> {$id}</p>
                    <p><strong>📝 الملاحظة:</strong> {$reminder->note}</p>
                    <p><strong>📍 المرحلة:</strong> {$stageName}</p>
                    <p><strong>⏰ تاريخ التذكير:</strong> " . now()->format('Y-m-d H:i') . "</p>
                </div>
                
                <div style='background: #1A2740; border-radius: 8px; padding: 12px; margin: 16px 0;'>
                    <p style='color: #8B96A8; text-align: center;'>
                        هذا تذكير تلقائي من نظام مسار
                    </p>
                </div>
            </div>
            
            <div style='text-align: center; padding: 20px 0; border-top: 1px solid rgba(237, 234, 226, 0.08);'>
                <p style='color: #5A6A7A; font-size: 12px;'>
                    © 2024 مسار - جميع الحقوق محفوظة
                </p>
            </div>
        </div>
        ";
    }

    /**
     * بناء نص HTML للبريد
     */
    private function buildHtmlBody($body)
    {
        return "
        <!DOCTYPE html>
        <html dir='rtl'>
        <head>
            <meta charset='UTF-8'>
            <meta name='viewport' content='width=device-width, initial-scale=1.0'>
        </head>
        <body>
            {$body}
        </body>
        </html>
        ";
    }

    /**
     * قراءة البريد الإلكتروني عبر IMAP
     */
    public function readEmails($limit = 10)
    {
        try {
            $host = env('MAIL_IMAP_HOST', '{imap.gmail.com:993/imap/ssl}INBOX');
            $username = env('MAIL_IMAP_USERNAME');
            $password = env('MAIL_IMAP_PASSWORD');

            $inbox = imap_open($host, $username, $password);
            if (!$inbox) {
                Log::error('فشل الاتصال بـ IMAP: ' . imap_last_error());
                return [];
            }

            $emails = imap_search($inbox, 'UNSEEN');
            if (!$emails) {
                imap_close($inbox);
                return [];
            }

            $results = [];
            $count = 0;
            foreach ($emails as $emailId) {
                if ($count >= $limit) break;
                
                $header = imap_headerinfo($inbox, $emailId);
                $body = imap_fetchbody($inbox, $emailId, 1);
                
                // تحويل النص إلى UTF-8
                if ($body) {
                    $body = quoted_printable_decode($body);
                    $body = mb_convert_encoding($body, 'UTF-8', 'auto');
                }

                $results[] = [
                    'id' => $emailId,
                    'from' => $header->from[0]->mailbox . '@' . $header->from[0]->host,
                    'from_name' => $header->from[0]->personal ?? 'غير معروف',
                    'subject' => $header->subject ?? 'بدون موضوع',
                    'date' => $header->date,
                    'body' => strip_tags($body),
                    'body_html' => $body
                ];

                // تحديد كـ مقروء
                imap_setflag_full($inbox, $emailId, "\\Seen");
                $count++;
            }

            imap_close($inbox);
            return $results;

        } catch (\Exception $e) {
            Log::error('خطأ في قراءة البريد IMAP: ' . $e->getMessage());
            return [];
        }
    }
}