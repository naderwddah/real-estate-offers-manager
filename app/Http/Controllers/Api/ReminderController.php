<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Reminder;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

use Illuminate\Support\Facades\Validator;

class ReminderController extends Controller
{
    use ApiResponse;

    /**
     * عرض جميع التذكيرات
     */
    public function index(Request $request)
    {
        $query = Reminder::with(['offer', 'request', 'creator']);

        // فلترة حسب الحالة
        if ($request->has('is_sent')) {
            $query->where('is_sent', $request->is_sent);
        }

        // فلترة حسب العرض
        if ($request->has('offer_id') && $request->offer_id) {
            $query->where('offer_id', $request->offer_id);
        }

        // فلترة حسب الطلب
        if ($request->has('request_id') && $request->request_id) {
            $query->where('request_id', $request->request_id);
        }

        // التذكيرات القادمة
        if ($request->has('upcoming') && $request->upcoming) {
            $query->where('reminder_time', '>=', now())
                  ->where('is_sent', false);
        }

        // ترتيب حسب الوقت
        $query->orderBy('reminder_time', 'asc');

        // تقسيم الصفحات
        $perPage = $request->per_page ?? 15;
        $reminders = $query->paginate($perPage);

        return $this->success($reminders);
    }

    /**
     * إنشاء تذكير جديد
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'offer_id' => 'nullable|exists:offers,id',
            'request_id' => 'nullable|exists:requests,id',
            'reminder_time' => 'required|date|after:now',
            'note' => 'required|string|max:255'
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        // التأكد من وجود عرض أو طلب
        if (!$request->offer_id && !$request->request_id) {
            return $this->error('يجب تحديد إما عرض أو طلب', 400);
        }

        $reminder = Reminder::create([
            'offer_id' => $request->offer_id,
            'request_id' => $request->request_id,
            'reminder_time' => $request->reminder_time,
            'note' => $request->note,
            'created_by' => auth()->id()
        ]);

        return $this->success($reminder, 'تم إنشاء التذكير بنجاح', 201);
    }

    /**
     * تحديث تذكير
     */
    public function update(Request $request, $id)
    {
        $reminder = Reminder::find($id);
        if (!$reminder) {
            return $this->notFound('التذكير غير موجود');
        }

        $validator = Validator::make($request->all(), [
            'reminder_time' => 'sometimes|date|after:now',
            'note' => 'sometimes|string|max:255'
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $reminder->update($request->all());

        return $this->success($reminder, 'تم تحديث التذكير بنجاح');
    }

    /**
     * تأكيد التذكير (تم إرساله)
     */
    public function markDone($id)
    {
        $reminder = Reminder::find($id);
        if (!$reminder) {
            return $this->notFound('التذكير غير موجود');
        }

        $reminder->markAsSent();

        return $this->success($reminder, 'تم تأكيد التذكير');
    }

    /**
     * حذف تذكير
     */
    public function destroy($id)
    {
        $reminder = Reminder::find($id);
        if (!$reminder) {
            return $this->notFound('التذكير غير موجود');
        }

        $reminder->delete();

        return $this->success(null, 'تم حذف التذكير بنجاح');
    }

    /**
     * إنشاء تذكير تلقائي لتأخر المرحلة
     */
    public function createStageTimeout($offerId)
    {
        $offer = Offer::find($offerId);
        if (!$offer) {
            return $this->notFound('العرض غير موجود');
        }

        // التحقق من وجود تذكير سابق
        $existing = Reminder::where('offer_id', $offerId)
                            ->where('is_sent', false)
                            ->where('reminder_time', '>', now())
                            ->first();

        if ($existing) {
            return $this->success($existing, 'يوجد تذكير نشط بالفعل');
        }

        $settings = Setting::getSettings();
        $days = $settings->max_wait_days ?? 3;

        $reminder = Reminder::create([
            'offer_id' => $offerId,
            'reminder_time' => now()->addDays($days),
            'note' => 'تذكير: العرض ' . $offer->display_id . ' في المرحلة ' . $offer->currentStage->name . ' منذ ' . $days . ' أيام',
            'created_by' => auth()->id()
        ]);

        return $this->success($reminder, 'تم إنشاء تذكير تأخر المرحلة');
    }
}