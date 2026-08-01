<?php

namespace App\Traits;

trait ApiResponse
{
    /**
     * نجاح
     */
    protected function success($data = null, $message = 'تم بنجاح', $code = 200)
    {
        return response()->json([
            'status' => 'success',
            'message' => $message,
            'data' => $data
        ], $code);
    }

    /**
     * خطأ
     */
    protected function error($message = 'حدث خطأ', $code = 400, $errors = null)
    {
        $response = [
            'status' => 'error',
            'message' => $message
        ];

        if ($errors) {
            $response['errors'] = $errors;
        }

        return response()->json($response, $code);
    }

    /**
     * خطأ غير مصرح
     */
    protected function unauthorized($message = 'غير مصرح')
    {
        return $this->error($message, 401);
    }

    /**
     * خطأ غير موجود
     */
    protected function notFound($message = 'العنصر غير موجود')
    {
        return $this->error($message, 404);
    }

    /**
     * خطأ في التحقق
     */
    protected function validationError($errors)
    {
        return $this->error('خطأ في البيانات المدخلة', 422, $errors);
    }
}