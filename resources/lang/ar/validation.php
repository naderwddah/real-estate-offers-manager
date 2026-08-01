<?php

return [
    /*
    |--------------------------------------------------------------------------
    | رسائل التحقق من صحة البيانات
    |--------------------------------------------------------------------------
    */

    'accepted' => 'يجب قبول :attribute.',
    'accepted_if' => 'يجب قبول :attribute عندما يكون :other هو :value.',
    'active_url' => ':attribute ليس عنوان URL صحيحاً.',
    'after' => ':attribute يجب أن يكون تاريخاً بعد :date.',
    'after_or_equal' => ':attribute يجب أن يكون تاريخاً بعد أو يساوي :date.',
    'alpha' => ':attribute يجب أن يحتوي على أحرف فقط.',
    'alpha_dash' => ':attribute يجب أن يحتوي على أحرف وأرقام وشرطات فقط.',
    'alpha_num' => ':attribute يجب أن يحتوي على أحرف وأرقام فقط.',
    'array' => ':attribute يجب أن يكون مصفوفة.',
    'before' => ':attribute يجب أن يكون تاريخاً قبل :date.',
    'before_or_equal' => ':attribute يجب أن يكون تاريخاً قبل أو يساوي :date.',
    'between' => [
        'array' => ':attribute يجب أن يحتوي على بين :min و :max عنصر.',
        'file' => ':attribute يجب أن يكون بين :min و :max كيلوبايت.',
        'numeric' => ':attribute يجب أن يكون بين :min و :max.',
        'string' => ':attribute يجب أن يكون بين :min و :max أحرف.',
    ],
    'boolean' => ':attribute يجب أن يكون صحيح أو خطأ.',
    'confirmed' => 'تأكيد :attribute غير متطابق.',
    'current_password' => 'كلمة المرور الحالية غير صحيحة.',
    'date' => ':attribute ليس تاريخاً صحيحاً.',
    'date_equals' => ':attribute يجب أن يكون تاريخاً مساوياً لـ :date.',
    'date_format' => ':attribute لا يتطابق مع التنسيق :format.',
    'declined' => ':attribute يجب أن يكون مرفوضاً.',
    'declined_if' => ':attribute يجب أن يكون مرفوضاً عندما يكون :other هو :value.',
    'different' => ':attribute و :other يجب أن يكونا مختلفين.',
    'digits' => ':attribute يجب أن يكون :digits أرقام.',
    'digits_between' => ':attribute يجب أن يكون بين :min و :max أرقام.',
    'dimensions' => ':attribute يحتوي على أبعاد صورة غير صالحة.',
    'distinct' => ':attribute يحتوي على قيمة مكررة.',
    'doesnt_end_with' => ':attribute يجب ألا ينتهي بأحد القيم التالية: :values.',
    'doesnt_start_with' => ':attribute يجب ألا يبدأ بأحد القيم التالية: :values.',
    'email' => ':attribute يجب أن يكون عنوان بريد إلكتروني صحيح.',
    'ends_with' => ':attribute يجب أن ينتهي بأحد القيم التالية: :values.',
    'enum' => ':attribute غير صالح.',
    'exists' => ':attribute المحدد غير موجود.',
    'file' => ':attribute يجب أن يكون ملفاً.',
    'filled' => ':attribute يجب أن يحتوي على قيمة.',
    'gt' => [
        'array' => ':attribute يجب أن يحتوي على أكثر من :value عنصر.',
        'file' => ':attribute يجب أن يكون أكبر من :value كيلوبايت.',
        'numeric' => ':attribute يجب أن يكون أكبر من :value.',
        'string' => ':attribute يجب أن يكون أكبر من :value أحرف.',
    ],
    'gte' => [
        'array' => ':attribute يجب أن يحتوي على :value عنصر أو أكثر.',
        'file' => ':attribute يجب أن يكون أكبر من أو يساوي :value كيلوبايت.',
        'numeric' => ':attribute يجب أن يكون أكبر من أو يساوي :value.',
        'string' => ':attribute يجب أن يكون أكبر من أو يساوي :value أحرف.',
    ],
    'image' => ':attribute يجب أن تكون صورة.',
    'in' => ':attribute المحدد غير صحيح.',
    'in_array' => ':attribute غير موجود في :other.',
    'integer' => ':attribute يجب أن يكون عدداً صحيحاً.',
    'ip' => ':attribute يجب أن يكون عنوان IP صحيح.',
    'ipv4' => ':attribute يجب أن يكون عنوان IPv4 صحيح.',
    'ipv6' => ':attribute يجب أن يكون عنوان IPv6 صحيح.',
    'json' => ':attribute يجب أن يكون نص JSON صحيح.',
    'lowercase' => ':attribute يجب أن يكون أحرف صغيرة.',
    'lt' => [
        'array' => ':attribute يجب أن يحتوي على أقل من :value عنصر.',
        'file' => ':attribute يجب أن يكون أقل من :value كيلوبايت.',
        'numeric' => ':attribute يجب أن يكون أقل من :value.',
        'string' => ':attribute يجب أن يكون أقل من :value أحرف.',
    ],
    'lte' => [
        'array' => ':attribute يجب ألا يحتوي على أكثر من :value عنصر.',
        'file' => ':attribute يجب أن يكون أقل من أو يساوي :value كيلوبايت.',
        'numeric' => ':attribute يجب أن يكون أقل من أو يساوي :value.',
        'string' => ':attribute يجب أن يكون أقل من أو يساوي :value أحرف.',
    ],
    'mac_address' => ':attribute يجب أن يكون عنوان MAC صحيح.',
    'max' => [
        'array' => ':attribute يجب ألا يحتوي على أكثر من :max عنصر.',
        'file' => ':attribute يجب ألا يكون أكبر من :max كيلوبايت.',
        'numeric' => ':attribute يجب ألا يكون أكبر من :max.',
        'string' => ':attribute يجب ألا يكون أكبر من :max أحرف.',
    ],
    'max_digits' => ':attribute يجب ألا يحتوي على أكثر من :max أرقام.',
    'mimes' => ':attribute يجب أن يكون ملفاً من النوع: :values.',
    'mimetypes' => ':attribute يجب أن يكون ملفاً من النوع: :values.',
    'min' => [
        'array' => ':attribute يجب أن يحتوي على على الأقل :min عنصر.',
        'file' => ':attribute يجب أن يكون على الأقل :min كيلوبايت.',
        'numeric' => ':attribute يجب أن يكون على الأقل :min.',
        'string' => ':attribute يجب أن يكون على الأقل :min أحرف.',
    ],
    'min_digits' => ':attribute يجب أن يحتوي على على الأقل :min أرقام.',
    'missing' => ':attribute يجب أن يكون مفقوداً.',
    'missing_if' => ':attribute يجب أن يكون مفقوداً عندما يكون :other هو :value.',
    'missing_unless' => ':attribute يجب أن يكون مفقوداً ما لم يكن :other هو :value.',
    'missing_with' => ':attribute يجب أن يكون مفقوداً عند وجود :values.',
    'missing_with_all' => ':attribute يجب أن يكون مفقوداً عند وجود :values.',
    'multiple_of' => ':attribute يجب أن يكون مضاعفاً لـ :value.',
    'not_in' => ':attribute المحدد غير صحيح.',
    'not_regex' => 'تنسيق :attribute غير صحيح.',
    'numeric' => ':attribute يجب أن يكون رقماً.',
    'password' => [
        'letters' => ':attribute يجب أن يحتوي على حرف واحد على الأقل.',
        'mixed' => ':attribute يجب أن يحتوي على حرف كبير وصغير واحد على الأقل.',
        'numbers' => ':attribute يجب أن يحتوي على رقم واحد على الأقل.',
        'symbols' => ':attribute يجب أن يحتوي على رمز واحد على الأقل.',
        'uncompromised' => ':attribute تم اختراقه. يرجى اختيار :attribute آخر.',
    ],
    'present' => ':attribute يجب أن يكون موجوداً.',
    'prohibited' => ':attribute ممنوع.',
    'prohibited_if' => ':attribute ممنوع عندما يكون :other هو :value.',
    'prohibited_unless' => ':attribute ممنوع ما لم يكن :other في :values.',
    'prohibits' => ':attribute يمنع وجود :other.',
    'regex' => 'تنسيق :attribute غير صحيح.',
    'required' => ':attribute مطلوب.',
    'required_array_keys' => ':attribute يجب أن يحتوي على مدخلات لـ :values.',
    'required_if' => ':attribute مطلوب عندما يكون :other هو :value.',
    'required_if_accepted' => ':attribute مطلوب عند قبول :other.',
    'required_unless' => ':attribute مطلوب ما لم يكن :other في :values.',
    'required_with' => ':attribute مطلوب عند وجود :values.',
    'required_with_all' => ':attribute مطلوب عند وجود :values.',
    'required_without' => ':attribute مطلوب عند عدم وجود :values.',
    'required_without_all' => ':attribute مطلوب عند عدم وجود أي من :values.',
    'same' => ':attribute و :other يجب أن يكونا متطابقين.',
    'size' => [
        'array' => ':attribute يجب أن يحتوي على :size عنصر.',
        'file' => ':attribute يجب أن يكون :size كيلوبايت.',
        'numeric' => ':attribute يجب أن يكون :size.',
        'string' => ':attribute يجب أن يكون :size أحرف.',
    ],
    'starts_with' => ':attribute يجب أن يبدأ بأحد القيم التالية: :values.',
    'string' => ':attribute يجب أن يكون نصاً.',
    'timezone' => ':attribute يجب أن يكون منطقة زمنية صحيحة.',
    'unique' => ':attribute مستخدم مسبقاً.',
    'uploaded' => 'فشل رفع :attribute.',
    'uppercase' => ':attribute يجب أن يكون أحرف كبيرة.',
    'url' => ':attribute يجب أن يكون عنوان URL صحيحاً.',
    'uuid' => ':attribute يجب أن يكون UUID صحيحاً.',

    /*
    |--------------------------------------------------------------------------
    | رسائل التحقق المخصصة
    |--------------------------------------------------------------------------
    */
    'custom' => [
        'offer_id' => [
            'exists' => 'رقم العرض المحدد غير موجود.',
            'required' => 'رقم العرض مطلوب.',
            'integer' => 'رقم العرض يجب أن يكون عدداً صحيحاً.',
        ],
        'request_id' => [
            'exists' => 'رقم الطلب المحدد غير موجود.',
            'required' => 'رقم الطلب مطلوب.',
        ],
        'client_id' => [
            'exists' => 'رقم العميل المحدد غير موجود.',
            'required' => 'رقم العميل مطلوب.',
        ],
        'email' => [
            'required' => 'البريد الإلكتروني مطلوب.',
            'email' => 'البريد الإلكتروني غير صحيح.',
            'unique' => 'البريد الإلكتروني مستخدم مسبقاً.',
        ],
        'password' => [
            'required' => 'كلمة المرور مطلوبة.',
            'min' => 'كلمة المرور يجب أن تكون على الأقل 6 أحرف.',
            'confirmed' => 'تأكيد كلمة المرور غير متطابق.',
        ],
        'current_password' => [
            'required' => 'كلمة المرور الحالية مطلوبة.',
        ],
        'new_password' => [
            'required' => 'كلمة المرور الجديدة مطلوبة.',
            'min' => 'كلمة المرور الجديدة يجب أن تكون على الأقل 6 أحرف.',
            'confirmed' => 'تأكيد كلمة المرور الجديدة غير متطابق.',
        ],
        'name' => [
            'required' => 'الاسم مطلوب.',
            'string' => 'الاسم يجب أن يكون نصاً.',
            'max' => 'الاسم يجب ألا يتجاوز 255 حرفاً.',
        ],
        'phone' => [
            'required' => 'رقم الهاتف مطلوب.',
            'string' => 'رقم الهاتف يجب أن يكون نصاً.',
        ],
        'title' => [
            'required' => 'العنوان مطلوب.',
            'string' => 'العنوان يجب أن يكون نصاً.',
            'max' => 'العنوان يجب ألا يتجاوز 255 حرفاً.',
        ],
        'description' => [
            'string' => 'الوصف يجب أن يكون نصاً.',
        ],
        'amount' => [
            'numeric' => 'المبلغ يجب أن يكون رقماً.',
            'min' => 'المبلغ يجب أن يكون أكبر من 0.',
        ],
        'track_type' => [
            'required' => 'نوع المسار مطلوب.',
            'in' => 'نوع المسار غير صحيح.',
        ],
        'stage_id' => [
            'exists' => 'رقم المرحلة المحدد غير موجود.',
        ],
        'status' => [
            'in' => 'الحالة غير صحيحة.',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | أسماء السمات المخصصة
    |--------------------------------------------------------------------------
    */
    'attributes' => [
        'offer_id' => 'رقم العرض',
        'request_id' => 'رقم الطلب',
        'client_id' => 'رقم العميل',
        'email' => 'البريد الإلكتروني',
        'password' => 'كلمة المرور',
        'current_password' => 'كلمة المرور الحالية',
        'new_password' => 'كلمة المرور الجديدة',
        'name' => 'الاسم',
        'phone' => 'رقم الهاتف',
        'title' => 'العنوان',
        'description' => 'الوصف',
        'amount' => 'المبلغ',
        'track_type' => 'نوع المسار',
        'stage_id' => 'رقم المرحلة',
        'status' => 'الحالة',
        'type' => 'النوع',
        'notes' => 'الملاحظات',
        'date' => 'التاريخ',
        'time' => 'الوقت',
        'created_at' => 'تاريخ الإنشاء',
        'updated_at' => 'تاريخ التحديث',
    ],
];