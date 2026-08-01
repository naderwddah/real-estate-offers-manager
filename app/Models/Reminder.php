<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Reminder extends Model
{
    use HasFactory;

    protected $fillable = [
        'offer_id',
        'request_id',
        'reminder_time',
        'note',
        'is_sent',
        'sent_at',
        'created_by'
    ];

    protected $casts = [
        'is_sent' => 'boolean'
    ];

    protected $dates = [
        'reminder_time',
        'sent_at'
    ];

    // العلاقات
    public function offer()
    {
        return $this->belongsTo(Offer::class);
    }

    public function request()
    {
        return $this->belongsTo(Request::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    // سكوبات
    public function scopePending($query)
    {
        return $query->where('is_sent', false)
                     ->where('reminder_time', '<=', now());
    }

    public function scopeNotSent($query)
    {
        return $query->where('is_sent', false);
    }

    // دوال مساعدة
    public function markAsSent()
    {
        $this->is_sent = true;
        $this->sent_at = now();
        $this->save();
    }
}