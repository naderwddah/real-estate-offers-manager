<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Offer;
use App\Models\Request as RequestModel;
use App\Models\OfferAttachment;
use App\Models\RequestAttachment;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class AttachmentController extends Controller
{
    use ApiResponse;

    /**
     * عرض جميع مرفقات العرض
     */
    public function offerAttachments($offerId)
    {
        $offer = Offer::find($offerId);
        if (!$offer) {
            return $this->notFound('العرض غير موجود');
        }

        $attachments = $offer->attachments()->orderBy('created_at', 'desc')->get();

        return $this->success($attachments);
    }

    /**
     * عرض جميع مرفقات الطلب
     */
    public function requestAttachments($requestId)
    {
        $request = RequestModel::find($requestId);
        if (!$request) {
            return $this->notFound('الطلب غير موجود');
        }

        $attachments = $request->attachments()->orderBy('created_at', 'desc')->get();

        return $this->success($attachments);
    }

    /**
     * رفع مرفق للعرض
     */
    public function uploadOfferAttachment(Request $request, $offerId)
    {
        try {
            $offer = Offer::find($offerId);
            if (!$offer) {
                return $this->notFound('العرض غير موجود');
            }

            $validator = Validator::make($request->all(), [
                'file' => 'required|file|max:10240', // 10MB
                'doc_type' => 'required|in:صورة,مخطط,صك,وكالة,عقد,سجل تجاري,ترخيص,أخرى',
                'description' => 'nullable|string|max:255'
            ]);

            if ($validator->fails()) {
                return $this->validationError($validator->errors());
            }

            $file = $request->file('file');
            
            // إنشاء اسم فريد للملف
            $fileName = uniqid() . '_' . $file->getClientOriginalName();
            $filePath = $file->storeAs('offers/' . $offer->id, $fileName, 'public');

            if (!$filePath) {
                Log::error('فشل رفع الملف للعرض', ['offer_id' => $offerId]);
                return $this->error('فشل رفع الملف', 500);
            }

            $attachment = OfferAttachment::create([
                'offer_id' => $offer->id,
                'file_name' => $file->getClientOriginalName(),
                'file_path' => $filePath,
                'file_size' => $file->getSize(),
                'mime_type' => $file->getMimeType(),
                'doc_type' => $request->doc_type,
                'uploaded_by' => auth()->id(),
                'uploaded_at' => now()
            ]);

            // تسجيل في سجل النشاط
            $offer->addLog('تم رفع مرفق: ' . $file->getClientOriginalName() . ' (نوع: ' . $request->doc_type . ')');

            Log::info('تم رفع مرفق للعرض', [
                'offer_id' => $offer->id,
                'attachment_id' => $attachment->id,
                'file_name' => $file->getClientOriginalName()
            ]);

            return $this->success($attachment, 'تم رفع الملف بنجاح');

        } catch (\Exception $e) {
            Log::error('خطأ في رفع مرفق العرض', [
                'offer_id' => $offerId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return $this->error('حدث خطأ أثناء رفع الملف: ' . $e->getMessage(), 500);
        }
    }

    /**
     * رفع مرفق للطلب
     */
    public function uploadRequestAttachment(Request $request, $requestId)
    {
        try {
            $requestModel = RequestModel::find($requestId);
            if (!$requestModel) {
                return $this->notFound('الطلب غير موجود');
            }

            $validator = Validator::make($request->all(), [
                'file' => 'required|file|max:10240', // 10MB
                'doc_type' => 'required|in:صورة,مخطط,صك,وكالة,عقد,سجل تجاري,ترخيص,أخرى',
                'description' => 'nullable|string|max:255'
            ]);

            if ($validator->fails()) {
                return $this->validationError($validator->errors());
            }

            $file = $request->file('file');
            
            // إنشاء اسم فريد للملف
            $fileName = time() . '_' . uniqid() . '_' . $file->getClientOriginalName();
            $filePath = $file->storeAs('requests/' . $requestModel->id, $fileName, 'public');

            if (!$filePath) {
                Log::error('فشل رفع الملف للطلب', ['request_id' => $requestId]);
                return $this->error('فشل رفع الملف', 500);
            }

            $attachment = RequestAttachment::create([
                'request_id' => $requestModel->id,
                'file_name' => $file->getClientOriginalName(),
                'file_path' => $filePath,
                'file_size' => $file->getSize(),
                'mime_type' => $file->getMimeType(),
                'doc_type' => $request->doc_type,
                'uploaded_by' => auth()->id(),
                'uploaded_at' => now()
            ]);

            // تسجيل في سجل النشاط
            $requestModel->addLog('تم رفع مرفق: ' . $file->getClientOriginalName() . ' (نوع: ' . $request->doc_type . ')');

            Log::info('تم رفع مرفق للطلب', [
                'request_id' => $requestModel->id,
                'attachment_id' => $attachment->id,
                'file_name' => $file->getClientOriginalName()
            ]);

            return $this->success($attachment, 'تم رفع الملف بنجاح');

        } catch (\Exception $e) {
            Log::error('خطأ في رفع مرفق الطلب', [
                'request_id' => $requestId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return $this->error('حدث خطأ أثناء رفع الملف: ' . $e->getMessage(), 500);
        }
    }

    /**
     * حذف مرفق عرض
     */
    public function deleteOfferAttachment($offerId, $attachmentId)
    {
        try {
            $attachment = OfferAttachment::where('offer_id', $offerId)
                                         ->where('id', $attachmentId)
                                         ->first();

            if (!$attachment) {
                return $this->notFound('المرفق غير موجود');
            }

            // حذف الملف من التخزين
            if (Storage::disk('public')->exists($attachment->file_path)) {
                Storage::disk('public')->delete($attachment->file_path);
            }

            $attachment->delete();

            // تسجيل في سجل النشاط
            $offer = Offer::find($offerId);
            if ($offer) {
                $offer->addLog('تم حذف مرفق: ' . $attachment->file_name);
            }

            Log::info('تم حذف مرفق العرض', [
                'offer_id' => $offerId,
                'attachment_id' => $attachmentId,
                'file_name' => $attachment->file_name
            ]);

            return $this->success(null, 'تم حذف المرفق بنجاح');

        } catch (\Exception $e) {
            Log::error('خطأ في حذف مرفق العرض', [
                'offer_id' => $offerId,
                'attachment_id' => $attachmentId,
                'error' => $e->getMessage()
            ]);
            return $this->error('حدث خطأ أثناء حذف الملف: ' . $e->getMessage(), 500);
        }
    }

    /**
     * حذف مرفق طلب
     */
    public function deleteRequestAttachment($requestId, $attachmentId)
    {
        try {
            $attachment = RequestAttachment::where('request_id', $requestId)
                                           ->where('id', $attachmentId)
                                           ->first();

            if (!$attachment) {
                return $this->notFound('المرفق غير موجود');
            }

            // حذف الملف من التخزين
            if (Storage::disk('public')->exists($attachment->file_path)) {
                Storage::disk('public')->delete($attachment->file_path);
            }

            $attachment->delete();

            // تسجيل في سجل النشاط
            $request = RequestModel::find($requestId);
            if ($request) {
                $request->addLog('تم حذف مرفق: ' . $attachment->file_name);
            }

            Log::info('تم حذف مرفق الطلب', [
                'request_id' => $requestId,
                'attachment_id' => $attachmentId,
                'file_name' => $attachment->file_name
            ]);

            return $this->success(null, 'تم حذف المرفق بنجاح');

        } catch (\Exception $e) {
            Log::error('خطأ في حذف مرفق الطلب', [
                'request_id' => $requestId,
                'attachment_id' => $attachmentId,
                'error' => $e->getMessage()
            ]);
            return $this->error('حدث خطأ أثناء حذف الملف: ' . $e->getMessage(), 500);
        }
    }

    /**
     * تحميل مرفق عرض
     */
    public function downloadOfferAttachment($offerId, $attachmentId)
    {
        try {
            $attachment = OfferAttachment::where('offer_id', $offerId)
                                         ->where('id', $attachmentId)
                                         ->first();

            if (!$attachment) {
                return $this->notFound('المرفق غير موجود');
            }

            if (!Storage::disk('public')->exists($attachment->file_path)) {
                Log::warning('الملف غير موجود في التخزين', [
                    'attachment_id' => $attachmentId,
                    'file_path' => $attachment->file_path
                ]);
                return $this->error('الملف غير موجود', 404);
            }

            return Storage::disk('public')->download($attachment->file_path, $attachment->file_name);

        } catch (\Exception $e) {
            Log::error('خطأ في تحميل مرفق العرض', [
                'offer_id' => $offerId,
                'attachment_id' => $attachmentId,
                'error' => $e->getMessage()
            ]);
            return $this->error('حدث خطأ أثناء تحميل الملف: ' . $e->getMessage(), 500);
        }
    }

    /**
     * تحميل مرفق طلب
     */
    public function downloadRequestAttachment($requestId, $attachmentId)
    {
        try {
            $attachment = RequestAttachment::where('request_id', $requestId)
                                           ->where('id', $attachmentId)
                                           ->first();

            if (!$attachment) {
                return $this->notFound('المرفق غير موجود');
            }

            if (!Storage::disk('public')->exists($attachment->file_path)) {
                Log::warning('الملف غير موجود في التخزين', [
                    'attachment_id' => $attachmentId,
                    'file_path' => $attachment->file_path
                ]);
                return $this->error('الملف غير موجود', 404);
            }

            return Storage::disk('public')->download($attachment->file_path, $attachment->file_name);

        } catch (\Exception $e) {
            Log::error('خطأ في تحميل مرفق الطلب', [
                'request_id' => $requestId,
                'attachment_id' => $attachmentId,
                'error' => $e->getMessage()
            ]);
            return $this->error('حدث خطأ أثناء تحميل الملف: ' . $e->getMessage(), 500);
        }
    }
}