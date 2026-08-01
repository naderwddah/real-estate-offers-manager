<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Tymon\JWTAuth\Contracts\JWTSubject;

class User extends Authenticatable implements JWTSubject
{
    use HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password_hash',
        'phone'
    ];

    protected $hidden = [
        'password_hash'
    ];

    public function getJWTIdentifier()
    {
        return $this->getKey();
    }

    public function getJWTCustomClaims()
    {
        return [];
    }

    public function offers()
    {
        return $this->hasMany(Offer::class, 'created_by');
    }

    public function requests()
    {
        return $this->hasMany(Request::class, 'created_by');
    }

    public function reminders()
    {
        return $this->hasMany(Reminder::class, 'created_by');
    }
}