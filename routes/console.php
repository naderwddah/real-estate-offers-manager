<?php

use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('reminders:process', function () {
    $this->info('جاري معالجة التذكيرات...');
    // سيتم إضافة منطق التذكيرات هنا لاحقاً
})->purpose('معالجة التذكيرات المستحقة');