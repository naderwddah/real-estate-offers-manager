<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Stage;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class StageController extends Controller
{
    use ApiResponse;

    /**
     * عرض جميع المراحل
     */
    public function index()
    {
        $stages = Stage::all()->groupBy('track_type');
        return $this->success($stages);
    }

    /**
     * عرض مراحل حسب المسار
     */
    public function byTrack($trackType)
    {
        $validTracks = ['company_offer', 'personal_offer', 'request'];
        
        if (!in_array($trackType, $validTracks)) {
            return $this->error('مسار غير صحيح', 400);
        }

        $stages = Stage::where('track_type', $trackType)
                       ->orderBy('stage_order')
                       ->get();

        return $this->success($stages);
    }

    /**
     * الحصول على المرحلة التالية
     */
    public function nextStage(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'track_type' => 'required|in:company_offer,personal_offer,request',
            'current_stage_id' => 'required|exists:stages,id'
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors());
        }

        $currentStage = Stage::find($request->current_stage_id);
        
        $nextStage = Stage::where('track_type', $request->track_type)
                          ->where('stage_order', '>', $currentStage->stage_order)
                          ->orderBy('stage_order')
                          ->first();

        if (!$nextStage) {
            return $this->success(null, 'هذه هي المرحلة النهائية');
        }

        return $this->success($nextStage);
    }
}