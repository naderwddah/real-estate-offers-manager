<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Offer extends Model
{
    use HasFactory;

    protected $fillable = [
        'display_id',
        'track_type',
        'title',
        'property_type_id',
        'deal_type_id',
        'area',
        'price',
        'city',
        'district',
        'address',
        'map_url',
        'description',
        'purpose',
        'contact_id',
        'current_stage_id',
        'status_date',
        'log',
        'offer_date',
        'sent_to_manager_at',
        'manager_response_at',
        'manager_notes',
        'client_notified_at',
        'client_response_at',
        'legal_review_at',
        'legal_status',
        'contract_sent_at',
        'contract_signed_at',
        'completed_at',
        'is_active',
        'is_closed',
        'closure_reason',
        'created_by'
    ];

    protected $casts = [
        'log' => 'array',
        'price' => 'decimal:2',
        'area' => 'decimal:2',
        'is_active' => 'boolean',
        'is_closed' => 'boolean',
    ];

    protected $dates = [
        'offer_date',
        'status_date',
        'sent_to_manager_at',
        'manager_response_at',
        'client_notified_at',
        'client_response_at',
        'legal_review_at',
        'contract_sent_at',
        'contract_signed_at',
        'completed_at',
    ];

    // العلاقات
    public function propertyType()
    {
        return $this->belongsTo(PropertyType::class);
    }

    public function dealType()
    {
        return $this->belongsTo(DealType::class);
    }

    public function contact()
    {
        return $this->belongsTo(Client::class, 'contact_id');
    }

    public function currentStage()
    {
        return $this->belongsTo(Stage::class, 'current_stage_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function attachments()
    {
        return $this->hasMany(OfferAttachment::class);
    }

    public function matchedRequests()
    {
        return $this->hasMany(Request::class, 'matched_offer_id');
    }

    // سكوبات
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeCompany($query)
    {
        return $query->where('track_type', 'company');
    }

    public function scopePersonal($query)
    {
        return $query->where('track_type', 'personal');
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