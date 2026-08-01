<?php

namespace App\Services;

use App\Models\Request as RequestModel;
use App\Models\Client;
use App\Models\Offer;
use App\Models\Stage;
use App\Models\Reminder;
use App\Models\Setting;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Exception;

class RequestService
{
    protected $matchingService;

    public function __construct(MatchingService $matchingService)
    {
        $this->matchingService = $matchingService;
    }

    /**
     * إنشاء طلب جديد
     */
    public function createRequest(array $data)
    {
        try {
            DB::beginTransaction();

            // إنشاء العميل إذا لم يكن موجوداً
            if (!isset($data['contact_id']) && isset($data['contact_name'])) {
                $client = Client::create([
                    'name' => $data['contact_name'],
                    'phone' => $data['contact_phone'] ?? null,
                    'email' => $data['contact_email'] ?? null,
                    'notes' => $data['contact_notes'] ?? null
                ]);
                $data['contact_id'] = $client->id;
            }

            // إنشاء الطلب
            $request = RequestModel::create([
                'display_id' => $this->generateDisplayId(),
                'contact_id' => $data['contact_id'],
                'property_type_id' => $data['property_type_id'],
                'deal_type_id' => $data['deal_type_id'],
                'area' => $data['area'],
                'budget' => $data['budget'],
                'city' => $data['city'],
                'districts' => $data['districts'],
                'notes' => $data['notes'] ?? null,
                'current_stage_id' => $this->getInitialStage(),
                'status_date' => date('Y-m-d'),
                'request_date' => $data['request_date'] ?? date('Y-m-d'),
                'created_by' => auth()->id(),
                'is_active' => true,
                'is_closed' => false
            ]);

            // إضافة سجل أولي
            $request->addLog('تم إنشاء الطلب');

            // محاولة المطابقة التلقائية
            $matches = $this->matchingService->findMatchesForRequest($request);
            
            if ($matches->count() > 0) {
                $request->moveToStage($this->getStageId(2)); // جاري المطابقة
                $request->addLog('تم العثور على ' . $matches->count() . ' عرض مطابق');
            }

            DB::commit();

            Log::info('تم إنشاء طلب جديد', [
                'request_id' => $request->id,
                'display_id' => $request->display_id,
                'matches_found' => $matches->count() ?? 0
            ]);

            return [
                'request' => $request,
                'matches' => $matches ?? collect()
            ];

        } catch (Exception $e) {
            DB::rollBack();
            Log::error('فشل إنشاء الطلب', [
                'data' => $data,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            throw $e;
        }
    }

    /**
     * تحديث الطلب
     */
    public function updateRequest($requestId, array $data)
    {
        try {
            DB::beginTransaction();

            $request = RequestModel::find($requestId);
            if (!$request) {
                throw new Exception('الطلب غير موجود');
            }

            $oldData = $request->toArray();
            $request->update($data);

            // تسجيل التغييرات
            $changes = array_diff_assoc($data, $oldData);
            if (!empty($changes)) {
                $request->addLog('تم تحديث الطلب: ' . json_encode(array_keys($changes)));
            }

            DB::commit();

            Log::info('تم تحديث الطلب', [
                'request_id' => $request->id,
                'changes' => array_keys($changes ?? [])
            ]);

            return $request;

        } catch (Exception $e) {
            DB::rollBack();
            Log::error('فشل تحديث الطلب', [
                'request_id' => $requestId,
                'data' => $data,
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }

    /**
     * تغيير مرحلة الطلب
     */
    public function changeStage($requestId, $stageId, $notes = null)
    {
        try {
            DB::beginTransaction();

            $request = RequestModel::find($requestId);
            if (!$request) {
                throw new Exception('الطلب غير موجود');
            }

            $oldStage = $request->currentStage;
            $request->moveToStage($stageId);

            // تسجيل التغيير
            $logMessage = "تم تغيير المرحلة من '{$oldStage->name}' إلى '{$request->currentStage->name}'";
            if ($notes) {
                $logMessage .= " - ملاحظات: {$notes}";
            }
            $request->addLog($logMessage);

            // إنشاء تذكيرات حسب المرحلة
            $this->createStageReminders($request);

            DB::commit();

            Log::info('تم تغيير مرحلة الطلب', [
                'request_id' => $request->id,
                'old_stage' => $oldStage->id,
                'new_stage' => $stageId
            ]);

            return $request;

        } catch (Exception $e) {
            DB::rollBack();
            Log::error('فشل تغيير مرحلة الطلب', [
                'request_id' => $requestId,
                'stage_id' => $stageId,
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }

    /**
     * ربط الطلب بعرض
     */
    public function matchOffer($requestId, $offerId)
    {
        try {
            DB::beginTransaction();

            $request = RequestModel::find($requestId);
            if (!$request) {
                throw new Exception('الطلب غير موجود');
            }

            $offer = Offer::find($offerId);
            if (!$offer) {
                throw new Exception('العرض غير موجود');
            }

            $request->matched_offer_id = $offer->id;
            $request->matched_at = now();
            $request->moveToStage($this->getStageId(3)); // تم اختيار العرض
            $request->save();

            $request->addLog("تم ربط الطلب بالعرض {$offer->display_id}");

            DB::commit();

            Log::info('تم ربط الطلب بالعرض', [
                'request_id' => $request->id,
                'offer_id' => $offer->id,
                'offer_display_id' => $offer->display_id
            ]);

            return $request;

        } catch (Exception $e) {
            DB::rollBack();
            Log::error('فشل ربط الطلب بالعرض', [
                'request_id' => $requestId,
                'offer_id' => $offerId,
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }

    /**
     * تحديد موعد المعاينة
     */
    public function scheduleAppointment($requestId, $appointmentDate, $notes = null)
    {
        try {
            DB::beginTransaction();

            $request = RequestModel::find($requestId);
            if (!$request) {
                throw new Exception('الطلب غير موجود');
            }

            $request->appointment_date = $appointmentDate;
            $request->appointment_notes = $notes;
            $request->moveToStage($this->getStageId(4)); // جدولة المعاينة
            $request->save();

            $request->addLog("تم تحديد موعد المعاينة: {$appointmentDate}");

            // إنشاء تذكير قبل الموعد بساعتين
            $this->createAppointmentReminder($request, $appointmentDate);

            DB::commit();

            Log::info('تم تحديد موعد المعاينة', [
                'request_id' => $request->id,
                'appointment_date' => $appointmentDate
            ]);

            return $request;

        } catch (Exception $e) {
            DB::rollBack();
            Log::error('فشل تحديد موعد المعاينة', [
                'request_id' => $requestId,
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }

    /**
     * إغلاق الطلب
     */
    public function closeRequest($requestId, $reason)
    {
        try {
            DB::beginTransaction();

            $request = RequestModel::find($requestId);
            if (!$request) {
                throw new Exception('الطلب غير موجود');
            }

            $request->is_closed = true;
            $request->is_active = false;
            $request->closure_reason = $reason;
            $request->completed_at = now();
            $request->save();

            $request->addLog("تم إغلاق الطلب - السبب: {$reason}");

            DB::commit();

            Log::info('تم إغلاق الطلب', [
                'request_id' => $request->id,
                'reason' => $reason
            ]);

            return $request;

        } catch (Exception $e) {
            DB::rollBack();
            Log::error('فشل إغلاق الطلب', [
                'request_id' => $requestId,
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }

    /**
     * إعادة المطابقة التلقائية
     */
    public function rematchRequest($requestId)
    {
        try {
            $request = RequestModel::find($requestId);
            if (!$request) {
                throw new Exception('الطلب غير موجود');
            }

            $matches = $this->matchingService->findMatchesForRequest($request);

            $request->addLog('تم إعادة المطابقة التلقائية، تم العثور على ' . $matches->count() . ' عرض');

            Log::info('تم إعادة مطابقة الطلب', [
                'request_id' => $request->id,
                'matches_found' => $matches->count()
            ]);

            return $matches;

        } catch (Exception $e) {
            Log::error('فشل إعادة مطابقة الطلب', [
                'request_id' => $requestId,
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }

    /**
     * إنشاء تذكيرات للمراحل
     */
    private function createStageReminders($request)
    {
        try {
            $settings = Setting::getSettings();
            $days = $settings->max_wait_days ?? 3;

            // مراحل تتطلب تذكير
            $reminderStages = [2, 4, 6]; // مراحل الانتظار

            if (in_array($request->current_stage_id, $reminderStages)) {
                Reminder::create([
                    'request_id' => $request->id,
                    'reminder_time' => now()->addDays($days),
                    'note' => "تذكير: الطلب {$request->display_id} في مرحلة '{$request->currentStage->name}'",
                    'created_by' => auth()->id()
                ]);
            }

        } catch (Exception $e) {
            Log::warning('فشل إنشاء تذكير المرحلة', [
                'request_id' => $request->id,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * إنشاء تذكير للموعد
     */
    private function createAppointmentReminder($request, $appointmentDate)
    {
        try {
            $reminderTime = \Carbon\Carbon::parse($appointmentDate)->subHours(2);

            Reminder::create([
                'request_id' => $request->id,
                'reminder_time' => $reminderTime,
                'note' => "تذكير بموعد المعاينة للطلب {$request->display_id}",
                'created_by' => auth()->id()
            ]);

        } catch (Exception $e) {
            Log::warning('فشل إنشاء تذكير الموعد', [
                'request_id' => $request->id,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * إنشاء رقم طلب
     */
    private function generateDisplayId()
    {
        $count = RequestModel::count() + 1;
        return 'ط-' . str_pad($count, 3, '0', STR_PAD_LEFT);
    }

    /**
     * الحصول على المرحلة الأولى
     */
    private function getInitialStage()
    {
        $stage = Stage::where('track_type', 'request')
                     ->where('stage_order', 1)
                     ->first();
        return $stage ? $stage->id : 1;
    }

    /**
     * الحصول على معرف المرحلة حسب الترتيب
     */
    private function getStageId($order)
    {
        $stage = Stage::where('track_type', 'request')
                     ->where('stage_order', $order)
                     ->first();
        return $stage ? $stage->id : 1;
    }
}