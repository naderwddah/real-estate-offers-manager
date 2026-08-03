<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    protected function schedule(Schedule $schedule)
    {
        // تشغيل التذكيرات كل دقيقة
        $schedule->command('reminders:process')->everyMinute();

        // إنشاء تذكيرات لتأخر المراحل يومياً
        $schedule->command('reminders:timeout')->daily();

        // قراءة البريد الإلكتروني كل 10 دقائق
        $schedule->command('emails:read --limit=5')->everyTenMinutes();
    }

    protected function commands()
    {
        $this->load(__DIR__.'/Commands');
        require base_path('routes/console.php');
    }
}