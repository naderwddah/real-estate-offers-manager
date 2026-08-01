<?php

namespace App\Services;

use App\Models\Offer;
use App\Models\Client;
use App\Models\Stage;
use App\Models\Reminder;
use App\Models\Setting;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Exception;

class OfferService
{
    /**
     * إنشاء عرض جديد مع كامل الإجراءات
     */
    public function createOffer(array $data)
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

            // إنشاء العرض
            $offer = Offer::create([
                'display_id' => $this->generateDisplayId(),
                'track_type' => $data['track_type'],
                'title' => $data['title'],
                'property_type_id' => $data['property_type_id'],
                'deal_type_id' => $data['deal_type_id'],
                'area' => $data['area'],
                'price' => $data['price'],
                'city' => $data['city'],
                'district' => $data['district'] ?? null,
                'address' => $data['address'] ?? null,
                'map_url' => $data['map_url'] ?? null,
                'description' => $data['description'] ?? null,
                'purpose' => $data['purpose'] ?? null,
                'contact_id' => $data['contact_id'],
                'current_stage_id' => $this->getInitialStage($data['track_type']),
                'status_date' => date('Y-m-d'),
                'offer_date' => $data['offer_date'] ?? date('Y-m-d'),
                'created_by' => auth()->id(),
                'is_active' => true,
                'is_closed' => false
            ]);

            // إضافة سجل أولي
            $offer->addLog('تم إنشاء العرض');

            // إذا كان عرض شركة، إضافة تذكير لإرساله للمدير
            if ($data['track_type'] === 'company') {
                $this->createManagerReminder($offer);
            }

            DB::commit();

            Log::info('تم إنشاء عرض جديد', [
                'offer_id' => $offer->id,
                'display_id' => $offer->display_id,
                'track_type' => $offer->track_type
            ]);

            return $offer;

        } catch (Exception $e) {
            DB::rollBack();
            Log::error('فشل إنشاء العرض', [
                'data' => $data,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            throw $e;
        }
    }

    /**
     * تحديث العرض
     */
    public function updateOffer($offerId, array $data)
    {
        try {
            DB::beginTransaction();

            $offer = Offer::find($offerId);
            if (!$offer) {
                throw new Exception('العرض غير موجود');
            }

            // حفظ البيانات القديمة للتسجيل
            $oldData = $offer->toArray();

            $offer->update($data);

            // تسجيل التغييرات
            $changes = array_diff_assoc($data, $oldData);
            if (!empty($changes)) {
                $offer->addLog('تم تحديث العرض: ' . json_encode(array_keys($changes)));
            }

            DB::commit();

            Log::info('تم تحديث العرض', [
                'offer_id' => $offer->id,
                'changes' => array_keys($changes ?? [])
            ]);

            return $offer;

        } catch (Exception $e) {
            DB::rollBack();
            Log::error('فشل تحديث العرض', [
                'offer_id' => $offerId,
                'data' => $data,
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }

    /**
     * تغيير مرحلة العرض
     */
    public function changeStage($offerId, $stageId, $notes = null)
    {
        try {
            DB::beginTransaction();

            $offer = Offer::find($offerId);
            if (!$offer) {
                throw new Exception('العرض غير موجود');
            }

            $oldStageId = $offer->current_stage_id;
            $oldStage = $offer->currentStage;

            $offer->moveToStage($stageId);

            // تسجيل التغيير
            $logMessage = "تم تغيير المرحلة من '{$oldStage->name}' إلى '{$offer->currentStage->name}'";
            if ($notes) {
                $logMessage .= " - ملاحظات: {$notes}";
            }
            $offer->addLog($logMessage);

            // تحديث التواريخ حسب المرحلة
            $this->updateStageDates($offer, $stageId);

            // إنشاء تذكيرات للمراحل المستقبلية
            $this->createStageReminders($offer);

            DB::commit();

            Log::info('تم تغيير مرحلة العرض', [
                'offer_id' => $offer->id,
                'old_stage' => $oldStageId,
                'new_stage' => $stageId
            ]);

            return $offer;

        } catch (Exception $e) {
            DB::rollBack();
            Log::error('فشل تغيير مرحلة العرض', [
                'offer_id' => $offerId,
                'stage_id' => $stageId,
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }

    /**
     * إغلاق العرض
     */
    public function closeOffer($offerId, $reason)
    {
        try {
            DB::beginTransaction();

            $offer = Offer::find($offerId);
            if (!$offer) {
                throw new Exception('العرض غير موجود');
            }

            $offer->is_closed = true;
            $offer->is_active = false;
            $offer->closure_reason = $reason;
            $offer->completed_at = now();
            $offer->save();

            $offer->addLog("تم إغلاق العرض - السبب: {$reason}");

            DB::commit();

            Log::info('تم إغلاق العرض', [
                'offer_id' => $offer->id,
                'reason' => $reason
            ]);

            return $offer;

        } catch (Exception $e) {
            DB::rollBack();
            Log::error('فشل إغلاق العرض', [
                'offer_id' => $offerId,
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }

    /**
     * إرسال العرض للمدير
     */
    public function sendToManager($offerId)
    {
        try {
            $offer = Offer::find($offerId);
            if (!$offer) {
                throw new Exception('العرض غير موجود');
            }

            $settings = Setting::getSettings();

            // تحديث العرض
            $offer->sent_to_manager_at = now();
            $offer->save();

            $offer->addLog('تم إرسال العرض للمدير');

            // إرسال إشعار للمدير (يمكن تفعيل البريد الإلكتروني)
            if ($settings->manager_email) {
                $this->sendManagerNotification($offer, $settings);
            }

            Log::info('تم إرسال العرض للمدير', [
                'offer_id' => $offer->id,
                'manager_email' => $settings->manager_email
            ]);

            return $offer;

        } catch (Exception $e) {
            Log::error('فشل إرسال العرض للمدير', [
                'offer_id' => $offerId,
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }

    /**
     * إنشاء تذكير للمدير
     */
    private function createManagerReminder($offer)
    {
        try {
            $settings = Setting::getSettings();
            $days = $settings->max_wait_days ?? 3;

            Reminder::create([
                'offer_id' => $offer->id,
                'reminder_time' => now()->addDays($days),
                'note' => "تذكير: إرسال العرض {$offer->display_id} للمدير للتسعير",
                'created_by' => auth()->id()
            ]);

        } catch (Exception $e) {
            Log::warning('فشل إنشاء تذكير المدير', [
                'offer_id' => $offer->id,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * إنشاء تذكيرات للمراحل
     */
    private function createStageReminders($offer)
    {
        try {
            $settings = Setting::getSettings();
            $days = $settings->max_wait_days ?? 3;

            // مراحل تتطلب تذكير
            $reminderStages = [2, 4, 6, 8]; // مراحل الانتظار

            if (in_array($offer->current_stage_id, $reminderStages)) {
                Reminder::create([
                    'offer_id' => $offer->id,
                    'reminder_time' => now()->addDays($days),
                    'note' => "تذكير: العرض {$offer->display_id} في مرحلة '{$offer->currentStage->name}'",
                    'created_by' => auth()->id()
                ]);
            }

        } catch (Exception $e) {
            Log::warning('فشل إنشاء تذكير المرحلة', [
                'offer_id' => $offer->id,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * تحديث التواريخ حسب المرحلة
     */
    private function updateStageDates($offer, $stageId)
    {
        $stage = Stage::find($stageId);
        if (!$stage) return;

        $dateFields = [
            'sent_to_manager_at' => 'بانتظار رد المدير',
            'manager_response_at' => 'تم تحديد السعر',
            'client_notified_at' => 'تم إبلاغ المالك',
            'client_response_at' => 'تم استلام المستندات',
            'legal_review_at' => 'قيد المراجعة القانونية',
            'contract_sent_at' => 'تم اعتماد العقد',
            'contract_signed_at' => 'تم توقيع العميل',
            'completed_at' => 'مكتمل'
        ];

        foreach ($dateFields as $field => $stageName) {
            if ($stage->name === $stageName && !$offer->$field) {
                $offer->$field = now();
                $offer->save();
                break;
            }
        }
    }

    /**
     * إرسال إشعار للمدير
     */
    private function sendManagerNotification($offer, $settings)
    {
        try {
            $data = [
                'offer' => $offer,
                'settings' => $settings,
                'offer_url' => url('/admin/offers/' . $offer->id)
            ];

            // يمكن تفعيل البريد الإلكتروني هنا
            // Mail::to($settings->manager_email)->send(new OfferNotification($data));

            Log::info('تم إرسال إشعار للمدير', [
                'offer_id' => $offer->id,
                'email' => $settings->manager_email
            ]);

        } catch (Exception $e) {
            Log::warning('فشل إرسال إشعار للمدير', [
                'offer_id' => $offer->id,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * إنشاء رقم عرض
     */
    private function generateDisplayId()
    {
        $count = Offer::count() + 1;
        return 'ع-' . str_pad($count, 3, '0', STR_PAD_LEFT);
    }

    /**
     * الحصول على المرحلة الأولى
     */
    private function getInitialStage($trackType)
    {
        $stage = Stage::where('track_type', $trackType . '_offer')
                     ->where('stage_order', 1)
                     ->first();
        return $stage ? $stage->id : 1;
    }
}