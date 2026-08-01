<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DealType extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'is_active'
    ];

    protected $casts = [
        'is_active' => 'boolean'
    ];

    // العلاقات
    public function offers()
    {
        return $this->hasMany(Offer::class);
    }

    public function requests()
    {
        return $this->hasMany(Request::class);
    }

    // سكوبات
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}