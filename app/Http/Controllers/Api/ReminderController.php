<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Reminder;
use App\Models\Offer;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ReminderController extends Controller
{
    use ApiResponse;

    /**
     * عرض التذكيرات مع فلترة
     */
    public function index(Request $request)
    {
        $query = Reminder::with(['offer', 'request', 'creator']);

        // فلترة حسب الحالة
        if ($request->has('is_sent')) {
            $query->where('is_sent', $request->is_sent);
        }

        // التذكيرات القادمة
        if ($request->has('upcoming') && $request->upcoming) {
            $query->where('reminder_time', '>=', now())
                  ->where('is_sent', false);
        }

        // التذكيرات المتأخرة
        if ($request->has('overdue') && $request->overdue) {
            $query->where('reminder_time', '<', now())
                  ->where('is_sent', false);
        }

        $query->orderBy('reminder_time', 'asc');
        $perPage = $request->per_page ?? 15;
        $reminders = $query->paginate($perPage);

        return $this->success($reminders);
    }

    /**
     * إنشاء تذكير (محسّن)
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'offer_id' => 'nullable|exists:offers,id',
            'request_id' => 'nullable|exists:requests,id',
            'reminder_time' => 'required|date',
            'note' => 'required|string|max:255'
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

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

        // تسجيل في سجل النشاط
        if ($request->offer_id) {
            $offer = Offer::find($request->offer_id);
            if ($offer) {
                $offer->addLog("📌 تم إنشاء تذكير: {$request->note} - تاريخ: {$request->reminder_time}");
            }
        }

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
            'reminder_time' => 'sometimes|date',
            'note' => 'sometimes|string|max:255'
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $reminder->update($request->all());

        return $this->success($reminder, 'تم تحديث التذكير بنجاح');
    }

    /**
     * تأكيد إرسال التذكير (mark as sent)
     */
    public function markDone($id)
    {
        $reminder = Reminder::find($id);
        if (!$reminder) {
            return $this->notFound('التذكير غير موجود');
        }

        $reminder->is_sent = true;
        $reminder->sent_at = now();
        $reminder->save();

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
     * إنشاء تذكير لتأخر المرحلة
     */
    public function createStageTimeout(Request $request, $offerId)
    {
        $offer = Offer::find($offerId);
        if (!$offer) {
            return $this->notFound('العرض غير موجود');
        }

        $timeoutDays = $request->timeout_days ?? 3;
        $stageName = $offer->stage->name ?? 'المرحلة الحالية';

        $reminder = Reminder::create([
            'offer_id' => $offerId,
            'reminder_time' => now()->addDays($timeoutDays),
            'note' => $request->note ?? "تذكير: العرض {$offer->display_id} في مرحلة '{$stageName}'",
            'created_by' => auth()->id()
        ]);

        return $this->success($reminder, 'تم إنشاء تذكير تأخر المرحلة');
    }

    /**
     * التذكيرات النشطة (للـ Frontend)
     */
    public function active()
    {
        $reminders = Reminder::where('is_sent', false)
            ->where('reminder_time', '>=', now())
            ->with(['offer', 'request'])
            ->orderBy('reminder_time', 'asc')
            ->get();

        return $this->success($reminders);
    }

    /**
     * التذكيرات المتأخرة
     */
    public function overdue()
    {
        $reminders = Reminder::where('is_sent', false)
            ->where('reminder_time', '<', now())
            ->with(['offer', 'request'])
            ->orderBy('reminder_time', 'asc')
            ->get();

        return $this->success($reminders);
    }
}