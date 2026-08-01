<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Tymon\JWTAuth\Facades\JWTAuth;
use Tymon\JWTAuth\Exceptions\JWTException;

class AuthController extends Controller
{
    use ApiResponse;

    /**
     * تسجيل الدخول
     */
public function login(Request $request)
{
    $validator = Validator::make($request->all(), [
        'email' => 'required|email',
        'password' => 'required|string|min:6'
    ]);

    if ($validator->fails()) {
        return $this->validationError($validator->errors());
    }

    // البحث عن المستخدم بالبريد الإلكتروني
    $user = User::where('email', $request->email)->first();
    
    // التحقق من وجود المستخدم وصحة كلمة المرور
    if (!$user || !Hash::check($request->password, $user->password_hash)) {
        return $this->error('بيانات الدخول غير صحيحة', 401);
    }

    // إنشاء التوكن للمستخدم
    $token = JWTAuth::fromUser($user);

    return $this->success([
        'token' => $token,
        'token_type' => 'bearer',
        'expires_in' => auth()->factory()->getTTL() * 60,
        'user' => [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone
        ]
    ], 'تم تسجيل الدخول بنجاح');
}

    /**
     * تسجيل الخروج
     */
    public function logout()
    {
        try {
            auth()->logout();
            return $this->success(null, 'تم تسجيل الخروج بنجاح');
        } catch (\Exception $e) {
            return $this->error('حدث خطأ في تسجيل الخروج', 500);
        }
    }

    /**
     * بيانات المستخدم الحالي
     */
    public function me()
    {
        $user = auth()->user();
        return $this->success([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'created_at' => $user->created_at
        ]);
    }

    /**
     * تحديث كلمة المرور
     */
    public function changePassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'current_password' => 'required|string|min:6',
            'new_password' => 'required|string|min:6|confirmed'
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $user = auth()->user();

        if (!Hash::check($request->current_password, $user->password_hash)) {
            return $this->error('كلمة المرور الحالية غير صحيحة', 400);
        }

        $user->password_hash = Hash::make($request->new_password);
        $user->save();

        return $this->success(null, 'تم تحديث كلمة المرور بنجاح');
    }
}