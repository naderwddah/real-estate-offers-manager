<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Offer;
use App\Models\Request as RequestModel;
use App\Models\Client;
use App\Models\Setting;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    use ApiResponse;

    /**
     * إحصائيات لوحة التحكم
     */
    public function dashboard()
    {
        $stats = [
            // العروض
            'total_offers' => Offer::count(),
            'active_offers' => Offer::where('is_active', true)->count(),
            'company_offers' => Offer::where('track_type', 'company')->count(),
            'personal_offers' => Offer::where('track_type', 'personal')->count(),
            'completed_offers' => Offer::where('is_closed', true)->count(),
            
            // الطلبات
            'total_requests' => RequestModel::count(),
            'active_requests' => RequestModel::where('is_active', true)->count(),
            'completed_requests' => RequestModel::where('is_closed', true)->count(),
            
            // العملاء
            'total_clients' => Client::count(),
            
            // العروض حسب المدينة
            'offers_by_city' => Offer::select('city', DB::raw('count(*) as count'))
                                     ->where('is_active', true)
                                     ->groupBy('city')
                                     ->orderBy('count', 'desc')
                                     ->limit(10)
                                     ->get(),
            
            // الطلبات حسب المدينة
            'requests_by_city' => RequestModel::select('city', DB::raw('count(*) as count'))
                                              ->where('is_active', true)
                                              ->groupBy('city')
                                              ->orderBy('count', 'desc')
                                              ->limit(10)
                                              ->get(),
            
            // العروض حسب المرحلة
            'offers_by_stage' => Offer::select('current_stage_id', DB::raw('count(*) as count'))
                                      ->where('is_active', true)
                                      ->groupBy('current_stage_id')
                                      ->with('currentStage')
                                      ->get()
        ];

        return $this->success($stats);
    }

    /**
     * تقرير العروض
     */
    public function offers(Request $request)
    {
        $query = Offer::with(['propertyType', 'dealType', 'currentStage']);

        // فلترة حسب التاريخ
        if ($request->has('from_date') && $request->from_date) {
            $query->whereDate('offer_date', '>=', $request->from_date);
        }
        if ($request->has('to_date') && $request->to_date) {
            $query->whereDate('offer_date', '<=', $request->to_date);
        }

        // فلترة حسب النوع
        if ($request->has('track_type') && $request->track_type) {
            $query->where('track_type', $request->track_type);
        }

        // فلترة حسب المدينة
        if ($request->has('city') && $request->city) {
            $query->where('city', $request->city);
        }

        $offers = $query->orderBy('offer_date', 'desc')->get();

        // إحصائيات
        $summary = [
            'total' => $offers->count(),
            'total_value' => $offers->sum('price'),
            'average_price' => $offers->avg('price'),
            'by_type' => $offers->groupBy('track_type')->map->count(),
            'by_city' => $offers->groupBy('city')->map->count()
        ];

        return $this->success([
            'summary' => $summary,
            'data' => $offers
        ]);
    }

    /**
     * تقرير الطلبات
     */
    public function requests(Request $request)
    {
        $query = RequestModel::with(['propertyType', 'dealType', 'currentStage', 'matchedOffer']);

        // فلترة حسب التاريخ
        if ($request->has('from_date') && $request->from_date) {
            $query->whereDate('request_date', '>=', $request->from_date);
        }
        if ($request->has('to_date') && $request->to_date) {
            $query->whereDate('request_date', '<=', $request->to_date);
        }

        // فلترة حسب المدينة
        if ($request->has('city') && $request->city) {
            $query->where('city', $request->city);
        }

        $requests = $query->orderBy('request_date', 'desc')->get();

        // إحصائيات
        $summary = [
            'total' => $requests->count(),
            'total_budget' => $requests->sum('budget'),
            'average_budget' => $requests->avg('budget'),
            'by_city' => $requests->groupBy('city')->map->count(),
            'matched' => $requests->whereNotNull('matched_offer_id')->count()
        ];

        return $this->success([
            'summary' => $summary,
            'data' => $requests
        ]);
    }

    /**
     * تقرير الأداء
     */
    public function performance(Request $request)
    {
        $year = $request->year ?? date('Y');
        $month = $request->month ?? date('m');

        // العروض حسب الشهر
        $monthlyOffers = Offer::select(
            DB::raw('MONTH(offer_date) as month'),
            DB::raw('COUNT(*) as count'),
            DB::raw('SUM(price) as total_value')
        )
        ->whereYear('offer_date', $year)
        ->groupBy(DB::raw('MONTH(offer_date)'))
        ->orderBy(DB::raw('MONTH(offer_date)'))
        ->get();

        // العروض المكتملة
        $completed = Offer::where('is_closed', true)
                          ->whereYear('completed_at', $year)
                          ->count();

        // متوسط وقت الإنجاز
        $avgCompletionTime = Offer::where('is_closed', true)
                                  ->whereNotNull('completed_at')
                                  ->select(DB::raw('AVG(DATEDIFF(completed_at, offer_date)) as avg_days'))
                                  ->first();

        // الطلبات المطابقة
        $matched = RequestModel::whereNotNull('matched_offer_id')
                               ->whereYear('matched_at', $year)
                               ->count();

        return $this->success([
            'year' => $year,
            'monthly_offers' => $monthlyOffers,
            'completed_offers' => $completed,
            'avg_completion_days' => round($avgCompletionTime->avg_days ?? 0, 1),
            'matched_requests' => $matched,
            'success_rate' => $completed > 0 ? round(($completed / Offer::whereYear('offer_date', $year)->count()) * 100, 2) : 0
        ]);
    }

    /**
     * تصدير تقرير العروض
     */
    public function exportOffers(Request $request)
    {
        $query = Offer::with(['propertyType', 'dealType', 'currentStage', 'contact']);

        // فلترة حسب التاريخ
        if ($request->has('from_date') && $request->from_date) {
            $query->whereDate('offer_date', '>=', $request->from_date);
        }
        if ($request->has('to_date') && $request->to_date) {
            $query->whereDate('offer_date', '<=', $request->to_date);
        }

        $offers = $query->orderBy('offer_date', 'desc')->get();

        // تحويل إلى CSV
        $headers = [
            'رقم العرض',
            'العنوان',
            'النوع',
            'نوع الصفقة',
            'المساحة',
            'السعر',
            'المدينة',
            'المرحلة',
            'التاريخ',
            'مقدم العرض',
            'الحالة'
        ];

        $rows = $offers->map(function($offer) {
            return [
                $offer->display_id,
                $offer->title,
                $offer->propertyType->name ?? '-',
                $offer->dealType->name ?? '-',
                $offer->area,
                $offer->price,
                $offer->city,
                $offer->currentStage->name ?? '-',
                $offer->offer_date,
                $offer->contact->name ?? '-',
                $offer->is_closed ? 'مغلق' : 'نشط'
            ];
        });

        // إنشاء ملف CSV
        $filename = 'تقرير_العروض_' . date('Y-m-d') . '.csv';
        $handle = fopen('php://temp', 'w+');
        fputcsv($handle, $headers);

        foreach ($rows as $row) {
            fputcsv($handle, $row);
        }

        rewind($handle);
        $content = stream_get_contents($handle);
        fclose($handle);

        return response($content, 200, [
            'Content-Type' => 'text/csv; charset=utf-8',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"'
        ]);
    }
}