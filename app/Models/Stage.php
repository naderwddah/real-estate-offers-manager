<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Stage extends Model
{
    use HasFactory;

    protected $fillable = [
        'track_type',
        'name',
        'stage_order',
        'color',
        'is_final'
    ];

    protected $casts = [
        'is_final' => 'boolean'
    ];

    // العلاقات
    public function offers()
    {
        return $this->hasMany(Offer::class, 'current_stage_id');
    }

    public function requests()
    {
        return $this->hasMany(Request::class, 'current_stage_id');
    }

    // سكوبات
    public function scopeCompanyOffers($query)
    {
        return $query->where('track_type', 'company_offer');
    }

    public function scopePersonalOffers($query)
    {
        return $query->where('track_type', 'personal_offer');
    }

    public function scopeRequests($query)
    {
        return $query->where('track_type', 'request');
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('stage_order');
    }
}