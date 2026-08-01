<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Request as RequestModel;
use App\Models\Client;
use App\Models\Offer;
use App\Services\MatchingService;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use App\Models\Stage;
use Illuminate\Support\Facades\Validator;

class RequestController extends Controller
{
    use ApiResponse;

    protected $matchingService;

    public function __construct(MatchingService $matchingService)
    {
        $this->matchingService = $matchingService;
    }

    /**
     * عرض جميع الطلبات
     */
    public function index(Request $request)
    {
        $query = RequestModel::with(['propertyType', 'dealType', 'currentStage', 'contact']);

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

        // فلترة حسب العميل
        if ($request->has('contact_id') && $request->contact_id) {
            $query->where('contact_id', $request->contact_id);
        }

        // بحث
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('display_id', 'like', '%' . $search . '%')
                  ->orWhere('client_name', 'like', '%' . $search . '%')
                  ->orWhere('city', 'like', '%' . $search . '%')
                  ->orWhere('districts', 'like', '%' . $search . '%');
            });
        }

        // ترتيب
        $sortBy = $request->sort_by ?? 'created_at';
        $sortOrder = $request->sort_order ?? 'desc';
        $query->orderBy($sortBy, $sortOrder);

        // تقسيم الصفحات
        $perPage = $request->per_page ?? 15;
        $requests = $query->paginate($perPage);

        return $this->success($requests);
    }

    /**
     * عرض طلب محدد
     */
    public function show($id)
    {
        $request = RequestModel::with([
            'propertyType',
            'dealType',
            'currentStage',
            'contact',
            'creator',
            'attachments',
            'matchedOffer'
        ])->find($id);

        if (!$request) {
            return $this->notFound('الطلب غير موجود');
        }

        return $this->success($request);
    }

    /**
     * إنشاء طلب جديد
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'contact_id' => 'nullable|exists:clients,id',
            'contact_name' => 'required_if:contact_id,null|string|max:255',
            'contact_phone' => 'required_if:contact_id,null|string|max:20',
            'property_type_id' => 'required|exists:property_types,id',
            'deal_type_id' => 'required|exists:deal_types,id',
            'area' => 'required|numeric|min:0',
            'budget' => 'required|numeric|min:0',
            'city' => 'required|string|max:100',
            'districts' => 'required|string|max:255',
            'request_date' => 'required|date'
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

        // إنشاء الطلب
        $requestModel = RequestModel::create([
            'display_id' => $this->generateDisplayId(),
            'contact_id' => $contactId,
            'property_type_id' => $request->property_type_id,
            'deal_type_id' => $request->deal_type_id,
            'area' => $request->area,
            'budget' => $request->budget,
            'city' => $request->city,
            'districts' => $request->districts,
            'notes' => $request->notes,
            'current_stage_id' => $this->getInitialStage('request'),
            'status_date' => date('Y-m-d'),
            'request_date' => $request->request_date,
            'created_by' => auth()->id(),
            'is_active' => true,
            'is_closed' => false
        ]);

        $requestModel->addLog('تم إنشاء الطلب');

        // محاولة المطابقة التلقائية
        $matches = $this->matchingService->findMatchesForRequest($requestModel);
        
        if ($matches->count() > 0) {
            $requestModel->moveToStage($this->getStageId('request', 2)); // جاري المطابقة
            $requestModel->addLog('تم العثور على ' . $matches->count() . ' عرض مطابق');
        }

        return $this->success([
            'request' => $requestModel,
            'matches' => $matches
        ], 'تم إنشاء الطلب بنجاح', 201);
    }

    /**
     * تحديث طلب
     */
    public function update(Request $request, $id)
    {
        $requestModel = RequestModel::find($id);
        if (!$requestModel) {
            return $this->notFound('الطلب غير موجود');
        }

        $validator = Validator::make($request->all(), [
            'property_type_id' => 'sometimes|exists:property_types,id',
            'deal_type_id' => 'sometimes|exists:deal_types,id',
            'area' => 'sometimes|numeric|min:0',
            'budget' => 'sometimes|numeric|min:0',
            'city' => 'sometimes|string|max:100',
            'current_stage_id' => 'sometimes|exists:stages,id'
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $requestModel->update($request->all());
        $requestModel->addLog('تم تحديث الطلب');

        return $this->success($requestModel, 'تم تحديث الطلب بنجاح');
    }

    /**
     * تغيير المرحلة
     */
    public function changeStage(Request $request, $id)
    {
        $requestModel = RequestModel::find($id);
        if (!$requestModel) {
            return $this->notFound('الطلب غير موجود');
        }

        $validator = Validator::make($request->all(), [
            'stage_id' => 'required|exists:stages,id',
            'notes' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $oldStage = $requestModel->current_stage_id;
        $requestModel->moveToStage($request->stage_id);

        $logMessage = 'تم تغيير المرحلة من ' . $oldStage . ' إلى ' . $request->stage_id;
        if ($request->notes) {
            $logMessage .= ' - ملاحظات: ' . $request->notes;
        }
        $requestModel->addLog($logMessage);

        return $this->success($requestModel, 'تم تغيير المرحلة بنجاح');
    }

    /**
     * إيجاد عروض مطابقة للطلب
     */
    public function findMatches($id)
    {
        $requestModel = RequestModel::find($id);
        if (!$requestModel) {
            return $this->notFound('الطلب غير موجود');
        }

        $matches = $this->matchingService->findMatchesForRequest($requestModel);

        return $this->success([
            'request' => $requestModel,
            'matches' => $matches
        ]);
    }

    /**
     * ربط الطلب بعرض
     */
    public function matchOffer(Request $request, $id)
    {
        $requestModel = RequestModel::find($id);
        if (!$requestModel) {
            return $this->notFound('الطلب غير موجود');
        }

        $validator = Validator::make($request->all(), [
            'offer_id' => 'required|exists:offers,id'
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $offer = Offer::find($request->offer_id);
        
        $requestModel->matched_offer_id = $offer->id;
        $requestModel->matched_at = now();
        $requestModel->moveToStage($this->getStageId('request', 3)); // تم اختيار العرض
        $requestModel->save();

        $requestModel->addLog('تم ربط الطلب بالعرض ' . $offer->display_id);

        return $this->success($requestModel, 'تم ربط الطلب بالعرض بنجاح');
    }

    /**
     * إضافة مستند للطلب
     */
    public function addAttachment(Request $request, $id)
    {
        $requestModel = RequestModel::find($id);
        if (!$requestModel) {
            return $this->notFound('الطلب غير موجود');
        }

        $validator = Validator::make($request->all(), [
            'file' => 'required|file|max:10240',
            'doc_type' => 'required|in:صورة,مخطط,صك,وكالة,عقد,سجل تجاري,ترخيص,أخرى'
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $file = $request->file('file');
        $fileName = time() . '_' . $file->getClientOriginalName();
        $filePath = $file->storeAs('requests/' . $requestModel->id, $fileName, 'public');

        $attachment = RequestAttachment::create([
            'request_id' => $requestModel->id,
            'file_name' => $file->getClientOriginalName(),
            'file_path' => $filePath,
            'file_size' => $file->getSize(),
            'mime_type' => $file->getMimeType(),
            'doc_type' => $request->doc_type,
            'uploaded_by' => auth()->id()
        ]);

        $requestModel->addLog('تم رفع مرفق: ' . $file->getClientOriginalName());

        return $this->success($attachment, 'تم رفع الملف بنجاح');
    }

    /**
     * حذف طلب
     */
    public function destroy($id)
    {
        $requestModel = RequestModel::find($id);
        if (!$requestModel) {
            return $this->notFound('الطلب غير موجود');
        }

        $requestModel->delete();

        return $this->success(null, 'تم حذف الطلب بنجاح');
    }

    // دوال مساعدة
    private function generateDisplayId()
    {
        $count = RequestModel::count() + 1;
        return 'ط-' . str_pad($count, 3, '0', STR_PAD_LEFT);
    }

    private function getInitialStage($trackType)
    {
        $stage = Stage::where('track_type', $trackType)
                     ->where('stage_order', 1)
                     ->first();
        return $stage ? $stage->id : 1;
    }

    private function getStageId($trackType, $order)
    {
        $stage = Stage::where('track_type', $trackType)
                     ->where('stage_order', $order)
                     ->first();
        return $stage ? $stage->id : 1;
    }
}