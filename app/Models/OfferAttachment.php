<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OfferAttachment extends Model
{
    use HasFactory;

    protected $fillable = [
        'offer_id',
        'file_name',
        'file_path',
        'file_size',
        'mime_type',
        'doc_type',
        'uploaded_at',
        'uploaded_by'
    ];

    protected $dates = [
        'uploaded_at'
    ];

    // العلاقات
    public function offer()
    {
        return $this->belongsTo(Offer::class);
    }

    public function uploader()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    // دوال مساعدة
    public function getFileUrlAttribute()
    {
        return asset('storage/' . $this->file_path);
    }

    public function getFileSizeFormattedAttribute()
    {
        if (!$this->file_size) return '0 B';
        
        $units = ['B', 'KB', 'MB', 'GB'];
        $i = 0;
        while ($this->file_size >= 1024 && $i < 3) {
            $this->file_size /= 1024;
            $i++;
        }
        return round($this->file_size, 2) . ' ' . $units[$i];
    }
}