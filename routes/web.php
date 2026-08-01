<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return redirect('/api');
});

Route::get('/login', function () {
    return response()->json([
        'status' => 'error',
        'message' => 'يجب تسجيل الدخول أولاً'
    ], 401);
})->name('login');