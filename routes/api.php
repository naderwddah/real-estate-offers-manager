<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\OfferController;
use App\Http\Controllers\Api\RequestController;
use App\Http\Controllers\Api\ClientController;
use App\Http\Controllers\Api\StageController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\ReminderController;
use App\Http\Controllers\Api\AttachmentController;

// ============================================================
// المسارات العامة
// ============================================================
Route::post('/auth/login', [AuthController::class, 'login']);

// ============================================================
// المسارات المحمية (تتطلب توثيق)
// ============================================================
Route::middleware('auth:api')->group(function () {

    // المصادقة
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/change-password', [AuthController::class, 'changePassword']);

    // العروض
    Route::prefix('offers')->group(function () {
        Route::get('/', [OfferController::class, 'index']);
        Route::get('/{id}', [OfferController::class, 'show']);
        Route::post('/', [OfferController::class, 'store']);
        Route::put('/{id}', [OfferController::class, 'update']);
        Route::delete('/{id}', [OfferController::class, 'destroy']);
        Route::patch('/{id}/stage', [OfferController::class, 'changeStage']);
    });

    // الطلبات
    Route::prefix('requests')->group(function () {
        Route::get('/', [RequestController::class, 'index']);
        Route::get('/{id}', [RequestController::class, 'show']);
        Route::post('/', [RequestController::class, 'store']);
        Route::put('/{id}', [RequestController::class, 'update']);
        Route::delete('/{id}', [RequestController::class, 'destroy']);
        Route::patch('/{id}/stage', [RequestController::class, 'changeStage']);
        Route::get('/{id}/matching', [RequestController::class, 'findMatches']);
        Route::post('/{id}/match', [RequestController::class, 'matchOffer']);
    });

    // العملاء
    Route::prefix('clients')->group(function () {
        Route::get('/', [ClientController::class, 'index']);
        Route::get('/{id}', [ClientController::class, 'show']);
        Route::post('/', [ClientController::class, 'store']);
        Route::put('/{id}', [ClientController::class, 'update']);
        Route::delete('/{id}', [ClientController::class, 'destroy']);
        Route::get('/{id}/offers', [ClientController::class, 'offers']);
        Route::get('/{id}/requests', [ClientController::class, 'requests']);
    });

    // المراحل
    Route::prefix('stages')->group(function () {
        Route::get('/', [StageController::class, 'index']);
        Route::get('/{trackType}', [StageController::class, 'byTrack']);
        Route::post('/next', [StageController::class, 'nextStage']);
    });

    // التذكيرات
    Route::prefix('reminders')->group(function () {
        Route::get('/', [ReminderController::class, 'index']);
        Route::post('/', [ReminderController::class, 'store']);
        Route::put('/{id}', [ReminderController::class, 'update']);
        Route::delete('/{id}', [ReminderController::class, 'destroy']);
        Route::patch('/{id}/done', [ReminderController::class, 'markDone']);
        Route::post('/offer/{id}/timeout', [ReminderController::class, 'createStageTimeout']);
    });

    // المرفقات
    Route::prefix('attachments')->group(function () {
        // للعروض
        Route::get('/offers/{offerId}', [AttachmentController::class, 'offerAttachments']);
        Route::post('/offers/{offerId}', [AttachmentController::class, 'uploadOfferAttachment']);
        Route::delete('/offers/{offerId}/{attachmentId}', [AttachmentController::class, 'deleteOfferAttachment']);
        Route::get('/offers/{offerId}/{attachmentId}/download', [AttachmentController::class, 'downloadOfferAttachment']);
        
        // للطلبات
        Route::get('/requests/{requestId}', [AttachmentController::class, 'requestAttachments']);
        Route::post('/requests/{requestId}', [AttachmentController::class, 'uploadRequestAttachment']);
        Route::delete('/requests/{requestId}/{attachmentId}', [AttachmentController::class, 'deleteRequestAttachment']);
        Route::get('/requests/{requestId}/{attachmentId}/download', [AttachmentController::class, 'downloadRequestAttachment']);
    });

    // التقارير
    Route::prefix('reports')->group(function () {
        Route::get('/dashboard', [ReportController::class, 'dashboard']);
        Route::get('/offers', [ReportController::class, 'offers']);
        Route::get('/requests', [ReportController::class, 'requests']);
        Route::get('/performance', [ReportController::class, 'performance']);
        Route::get('/export/offers', [ReportController::class, 'exportOffers']);
    });
});