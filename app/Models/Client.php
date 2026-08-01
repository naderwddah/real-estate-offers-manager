<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Client extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'phone',
        'email',
        'notes'
    ];

    public function offers()
    {
        return $this->hasMany(Offer::class, 'contact_id');
    }

    public function requests()
    {
        return $this->hasMany(Request::class, 'contact_id');
    }
}