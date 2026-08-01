<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Request extends Model
{
    use HasFactory;

    protected $fillable = [
        'display_id',
        'contact_id',
        'property_type_id',
        'deal_type_id',
        'area',
        'budget',
        'city',
        'districts',
        'notes',
        'current_stage_id',
        'status_date',
        'log',
        'matched_offer_id',
        'appointment_date',
        'appointment_time',
        'appointment_notes',
        'request_date',
        'matched_at',
        'completed_at',
        'is_active',
        'is_closed',
        'closure_reason',
        'created_by'
    ];

    protected $casts = [
        'log' => 'array',
        'area' => 'decimal:2',
        'budget' => 'decimal:2',
        'is_active' => 'boolean',
        'is_closed' => 'boolean',
    ];

    protected $dates = [
        'request_date',
        'status_date',
        'appointment_date',
        'matched_at',
        'completed_at'
    ];

    // العلاقات
    public function contact()
    {
        return $this->belongsTo(Client::class, 'contact_id');
    }

    public function propertyType()
    {
        return $this->belongsTo(PropertyType::class);
    }

    public function dealType()
    {
        return $this->belongsTo(DealType::class);
    }

    public function currentStage()
    {
        return $this->belongsTo(Stage::class, 'current_stage_id');
    }

    public function matchedOffer()
    {
        return $this->belongsTo(Offer::class, 'matched_offer_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function attachments()
    {
        return $this->hasMany(RequestAttachment::class);
    }

    // سكوبات
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    // دوال مساعدة
    public function addLog($entry)
    {
        $log = $this->log ?? [];
        $log[] = date('Y-m-d H:i:s') . ' - ' . $entry;
        $this->log = $log;
        $this->save();
    }

    public function moveToStage($stageId)
    {
        $this->current_stage_id = $stageId;
        $this->status_date = date('Y-m-d');
        $this->save();
    }
}