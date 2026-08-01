<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Offer;
use App\Models\Client;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class OfferController extends Controller
{
    use ApiResponse;

    /**
     * عرض جميع العروض مع فلترة
     */
    public function index(Request $request)
    {
        $query = Offer::with(['propertyType', 'dealType', 'currentStage', 'contact']);

        // فلترة حسب النوع
        if ($request->has('track_type') && $request->track_type) {
            $query->where('track_type', $request->track_type);
        }

        // فلترة حسب المدينة
        if ($request->has('city') && $request->city) {
            $query->where('city', 'like', '%' . $request->city . '%');
        }

        // فلترة حسب الحالة
        if ($request->has('is_active')) {
            $query->where('is_active', $request->is_active);
        }

        // فلترة حسب المرحلة
        if ($request->has('stage_id') && $request->stage_id) {
            $query->where('current_stage_id', $request->stage_id);
        }

        // بحث
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('display_id', 'like', '%' . $search . '%')
                  ->orWhere('title', 'like', '%' . $search . '%')
                  ->orWhere('city', 'like', '%' . $search . '%')
                  ->orWhere('address', 'like', '%' . $search . '%');
            });
        }

        // ترتيب
        $sortBy = $request->sort_by ?? 'created_at';
        $sortOrder = $request->sort_order ?? 'desc';
        $query->orderBy($sortBy, $sortOrder);

        // تقسيم الصفحات
        $perPage = $request->per_page ?? 15;
        $offers = $query->paginate($perPage);

        return $this->success($offers);
    }

    /**
     * عرض عرض محدد
     */
    public function show($id)
    {
        $offer = Offer::with([
            'propertyType',
            'dealType',
            'currentStage',
            'contact',
            'creator',
            'attachments',
            'matchedRequests'
        ])->find($id);

        if (!$offer) {
            return $this->notFound('العرض غير موجود');
        }

        return $this->success($offer);
    }

    /**
     * إنشاء عرض جديد
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'track_type' => 'required|in:company,personal',
            'title' => 'required|string|max:255',
            'property_type_id' => 'required|exists:property_types,id',
            'deal_type_id' => 'required|exists:deal_types,id',
            'area' => 'required|numeric|min:0',
            'price' => 'required|numeric|min:0',
            'city' => 'required|string|max:100',
            'contact_id' => 'nullable|exists:clients,id',
            'contact_name' => 'required_if:contact_id,null|string|max:255',
            'contact_phone' => 'required_if:contact_id,null|string|max:20',
            'offer_date' => 'required|date'
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        // إنشاء العميل إذا لم يكن موجوداً
        if (!$request->contact_id) {
            $client = Client::create([
                'name' => $request->contact_name,
                'phone' => $request->contact_phone,
                'email' => $request->contact_email ?? null,
                'notes' => $request->contact_notes ?? null
            ]);
            $contactId = $client->id;
        } else {
            $contactId = $request->contact_id;
        }

        // إنشاء العرض
        $offer = Offer::create([
            'display_id' => $this->generateDisplayId(),
            'track_type' => $request->track_type,
            'title' => $request->title,
            'property_type_id' => $request->property_type_id,
            'deal_type_id' => $request->deal_type_id,
            'area' => $request->area,
            'price' => $request->price,
            'city' => $request->city,
            'district' => $request->district,
            'address' => $request->address,
            'map_url' => $request->map_url,
            'description' => $request->description,
            'purpose' => $request->purpose,
            'contact_id' => $contactId,
            'current_stage_id' => $this->getInitialStage($request->track_type),
            'status_date' => date('Y-m-d'),
            'offer_date' => $request->offer_date,
            'created_by' => auth()->id(),
            'is_active' => true,
            'is_closed' => false
        ]);

        $offer->addLog('تم إنشاء العرض');

        // إذا كان عرض شركة، نضيف تذكير لإرساله للمدير
        if ($request->track_type === 'company') {
            $this->createReminder(
                $offer->id,
                null,
                'إرسال العرض للمدير للتسعير',
                date('Y-m-d H:i:s', strtotime('+1 day'))
            );
        }

        return $this->success($offer, 'تم إنشاء العرض بنجاح', 201);
    }

    /**
     * تحديث عرض
     */
    public function update(Request $request, $id)
    {
        $offer = Offer::find($id);
        if (!$offer) {
            return $this->notFound('العرض غير موجود');
        }

        $validator = Validator::make($request->all(), [
            'title' => 'sometimes|string|max:255',
            'property_type_id' => 'sometimes|exists:property_types,id',
            'deal_type_id' => 'sometimes|exists:deal_types,id',
            'area' => 'sometimes|numeric|min:0',
            'price' => 'sometimes|numeric|min:0',
            'city' => 'sometimes|string|max:100',
            'current_stage_id' => 'sometimes|exists:stages,id'
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $offer->update($request->all());
        $offer->addLog('تم تحديث العرض');

        return $this->success($offer, 'تم تحديث العرض بنجاح');
    }

    /**
     * تغيير المرحلة
     */
    public function changeStage(Request $request, $id)
    {
        $offer = Offer::find($id);
        if (!$offer) {
            return $this->notFound('العرض غير موجود');
        }

        $validator = Validator::make($request->all(), [
            'stage_id' => 'required|exists:stages,id',
            'notes' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $oldStage = $offer->current_stage_id;
        $offer->moveToStage($request->stage_id);

        $logMessage = 'تم تغيير المرحلة من ' . $oldStage . ' إلى ' . $request->stage_id;
        if ($request->notes) {
            $logMessage .= ' - ملاحظات: ' . $request->notes;
        }
        $offer->addLog($logMessage);

        return $this->success($offer, 'تم تغيير المرحلة بنجاح');
    }

    /**
     * إضافة مستند
     */
    public function addAttachment(Request $request, $id)
    {
        $offer = Offer::find($id);
        if (!$offer) {
            return $this->notFound('العرض غير موجود');
        }

        $validator = Validator::make($request->all(), [
            'file' => 'required|file|max:10240', // 10MB
            'doc_type' => 'required|in:صورة,مخطط,صك,وكالة,عقد,سجل تجاري,ترخيص,أخرى'
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $file = $request->file('file');
        $fileName = time() . '_' . $file->getClientOriginalName();
        $filePath = $file->storeAs('offers/' . $offer->id, $fileName, 'public');

        $attachment = OfferAttachment::create([
            'offer_id' => $offer->id,
            'file_name' => $file->getClientOriginalName(),
            'file_path' => $filePath,
            'file_size' => $file->getSize(),
            'mime_type' => $file->getMimeType(),
            'doc_type' => $request->doc_type,
            'uploaded_by' => auth()->id()
        ]);

        $offer->addLog('تم رفع مرفق: ' . $file->getClientOriginalName());

        return $this->success($attachment, 'تم رفع الملف بنجاح');
    }

    /**
     * حذف عرض
     */
    public function destroy($id)
    {
        $offer = Offer::find($id);
        if (!$offer) {
            return $this->notFound('العرض غير موجود');
        }

        $offer->delete();

        return $this->success(null, 'تم حذف العرض بنجاح');
    }

    // دوال مساعدة
    private function generateDisplayId()
    {
        $count = Offer::count() + 1;
        return 'ع-' . str_pad($count, 3, '0', STR_PAD_LEFT);
    }

    private function getInitialStage($trackType)
    {
        $stage = Stage::where('track_type', $trackType . '_offer')
                     ->where('stage_order', 1)
                     ->first();
        return $stage ? $stage->id : 1;
    }

    private function createReminder($offerId, $requestId, $note, $time)
    {
        return Reminder::create([
            'offer_id' => $offerId,
            'request_id' => $requestId,
            'reminder_time' => $time,
            'note' => $note,
            'created_by' => auth()->id()
        ]);
    }
}