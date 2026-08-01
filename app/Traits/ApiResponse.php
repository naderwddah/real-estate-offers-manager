<?php

namespace App\Traits;

use Illuminate\Support\Facades\Lang;

trait ApiResponse
{
    /**
     * نجاح
     */
    protected function success($data = null, $message = null, $code = 200)
    {
        return response()->json([
            'status' => 'success',
            'message' => $message ?? __('تم بنجاح'),
            'data' => $data
        ], $code);
    }

    /**
     * خطأ
     */
    protected function error($message = null, $code = 400, $errors = null)
    {
        $response = [
            'status' => 'error',
            'message' => $message ?? __('حدث خطأ')
        ];

        if ($errors) {
            $response['errors'] = $this->translateErrors($errors);
        }

        return response()->json($response, $code);
    }

    /**
     * خطأ غير مصرح
     */
    protected function unauthorized($message = null)
    {
        return $this->error($message ?? __('غير مصرح'), 401);
    }

    /**
     * خطأ غير موجود
     */
    protected function notFound($message = null)
    {
        return $this->error($message ?? __('العنصر غير موجود'), 404);
    }

    /**
     * خطأ في التحقق
     */
    protected function validationError($errors)
    {
        // ترجمة أخطاء التحقق
        $translatedErrors = $this->translateValidationErrors($errors);
        
        return response()->json([
            'status' => 'error',
            'message' => __('خطأ في البيانات المدخلة'),
            'errors' => $translatedErrors
        ], 422);
    }

    /**
     * ترجمة أخطاء التحقق من الصحة
     */
    private function translateValidationErrors($errors): array
    {
        $translated = [];

        foreach ($errors->toArray() as $field => $messages) {
            $translated[$field] = [];
            foreach ($messages as $message) {
                $translated[$field][] = $this->translateValidationMessage($field, $message);
            }
        }

        return $translated;
    }

    /**
     * ترجمة رسالة تحقق واحدة
     */
    private function translateValidationMessage($field, $message): string
    {
        // 1. محاولة الحصول على ترجمة مخصصة للحقل
        $customKey = "validation.custom.{$field}." . $this->extractRule($message);
        if (Lang::has($customKey)) {
            return __($customKey);
        }

        // 2. محاولة ترجمة الرسالة كاملة
        $translated = __($message);
        if ($translated !== $message) {
            return $translated;
        }

        // 3. محاولة ترجمة القاعدة مع اسم الحقل
        $fieldName = __('validation.attributes.' . $field) ?? $field;
        $rule = $this->extractRule($message);
        $ruleKey = "validation.{$rule}";
        
        if (Lang::has($ruleKey)) {
            // استبدال :attribute باسم الحقل
            $translatedRule = __($ruleKey);
            return str_replace(':attribute', $fieldName, $translatedRule);
        }

        // 4. ترجمة يدوية كحل أخير
        return $this->manualTranslate($field, $message);
    }

    /**
     * استخراج قاعدة التحقق من الرسالة
     */
    private function extractRule($message): string
    {
        $rules = [
            'required' => 'required',
            'exists' => 'exists',
            'email' => 'email',
            'unique' => 'unique',
            'confirmed' => 'confirmed',
            'numeric' => 'numeric',
            'integer' => 'integer',
            'string' => 'string',
            'in' => 'in',
            'url' => 'url',
            'min' => 'min',
            'max' => 'max',
            'between' => 'between',
            'date' => 'date',
            'boolean' => 'boolean',
            'image' => 'image',
            'mimes' => 'mimes',
            'regex' => 'regex',
            'same' => 'same',
            'different' => 'different',
            'size' => 'size',
            'before' => 'before',
            'after' => 'after',
            'prohibited' => 'prohibited',
            'present' => 'present',
            'filled' => 'filled',
            'accepted' => 'accepted',
            'active_url' => 'active_url',
        ];

        foreach ($rules as $key => $rule) {
            if (str_contains($message, $key)) {
                return $rule;
            }
        }

        return 'default';
    }

    /**
     * ترجمة يدوية للرسائل (حل أخير)
     */
    private function manualTranslate($field, $message): string
    {
        $fieldName = __('validation.attributes.' . $field) ?? $field;

        $patterns = [
            '/required/' => "{$fieldName} مطلوب.",
            '/exists/' => "{$fieldName} المحدد غير موجود.",
            '/email/' => "{$fieldName} يجب أن يكون عنوان بريد إلكتروني صحيح.",
            '/unique/' => "{$fieldName} مستخدم مسبقاً.",
            '/confirmed/' => "تأكيد {$fieldName} غير متطابق.",
            '/numeric/' => "{$fieldName} يجب أن يكون رقماً.",
            '/integer/' => "{$fieldName} يجب أن يكون عدداً صحيحاً.",
            '/string/' => "{$fieldName} يجب أن يكون نصاً.",
            '/url/' => "{$fieldName} يجب أن يكون رابطاً صحيحاً.",
            '/date/' => "{$fieldName} يجب أن يكون تاريخاً صحيحاً.",
            '/boolean/' => "{$fieldName} يجب أن يكون صحيح أو خطأ.",
            '/image/' => "{$fieldName} يجب أن تكون صورة.",
        ];

        foreach ($patterns as $pattern => $replacement) {
            if (preg_match($pattern, $message)) {
                return $replacement;
            }
        }

        // معالجة القواعد التي تحتوي على معاملات
        if (preg_match('/min (\d+)/', $message, $matches)) {
            return "{$fieldName} يجب أن يكون على الأقل {$matches[1]}.";
        }

        if (preg_match('/max (\d+)/', $message, $matches)) {
            return "{$fieldName} يجب ألا يتجاوز {$matches[1]}.";
        }

        if (preg_match('/between (\d+) and (\d+)/', $message, $matches)) {
            return "{$fieldName} يجب أن يكون بين {$matches[1]} و {$matches[2]}.";
        }

        if (preg_match('/in ([a-zA-Z, ]+)/', $message, $matches)) {
            return "{$fieldName} المحدد غير صحيح.";
        }

        if (preg_match('/same ([a-zA-Z_]+)/', $message, $matches)) {
            $otherField = __('validation.attributes.' . $matches[1]) ?? $matches[1];
            return "{$fieldName} و {$otherField} يجب أن يكونا متطابقين.";
        }

        return $message;
    }

    /**
     * ترجمة أخطاء مخصصة (للحقول الخاصة)
     */
    protected function translateError($message, $replacements = []): string
    {
        // إذا كانت الرسالة تحتوي على :attribute
        if (str_contains($message, ':attribute')) {
            foreach ($replacements as $key => $value) {
                $message = str_replace(':' . $key, $value, $message);
            }
        }

        // محاولة الترجمة
        $translated = __($message, $replacements);
        
        return $translated !== $message ? $translated : $message;
    }
}