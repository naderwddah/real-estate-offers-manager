<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_name',
        'logo_path',
        'phone',
        'email',
        'manager_name',
        'manager_phone',
        'manager_email',
        'legal_name',
        'legal_phone',
        'legal_email',
        'report_footer',
        'max_wait_days',
        'report_day'
    ];

    protected $casts = [
        'max_wait_days' => 'integer',
        'report_day' => 'integer'
    ];

    /**
     * الحصول على إعدادات الشركة
     */
    public static function getSettings()
    {
        return self::first() ?? new self();
    }

    /**
     * تحديث الإعدادات
     */
    public static function updateSettings(array $data)
    {
        $settings = self::first() ?? new self();
        $settings->fill($data);
        $settings->save();
        return $settings;
    }
}