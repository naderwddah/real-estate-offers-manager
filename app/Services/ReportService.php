<?php

namespace App\Services;

use App\Models\Offer;
use App\Models\Request as RequestModel;
use App\Models\Client;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ReportService
{
    /**
     * إحصائيات عامة
     */
    public function getGeneralStats()
    {
        return [
            'offers' => [
                'total' => Offer::count(),
                'active' => Offer::where('is_active', true)->count(),
                'completed' => Offer::where('is_closed', true)->count(),
                'company' => Offer::where('track_type', 'company')->count(),
                'personal' => Offer::where('track_type', 'personal')->count()
            ],
            'requests' => [
                'total' => RequestModel::count(),
                'active' => RequestModel::where('is_active', true)->count(),
                'completed' => RequestModel::where('is_closed', true)->count(),
                'matched' => RequestModel::whereNotNull('matched_offer_id')->count()
            ],
            'clients' => [
                'total' => Client::count()
            ]
        ];
    }

    /**
     * إحصائيات حسب الفترة
     */
    public function getPeriodStats($fromDate, $toDate)
    {
        return [
            'offers' => [
                'total' => Offer::whereBetween('offer_date', [$fromDate, $toDate])->count(),
                'total_value' => Offer::whereBetween('offer_date', [$fromDate, $toDate])->sum('price'),
                'completed' => Offer::whereBetween('completed_at', [$fromDate, $toDate])->count()
            ],
            'requests' => [
                'total' => RequestModel::whereBetween('request_date', [$fromDate, $toDate])->count(),
                'matched' => RequestModel::whereBetween('matched_at', [$fromDate, $toDate])->count()
            ]
        ];
    }

    /**
     * إحصائيات حسب المنطقة
     */
    public function getCityStats()
    {
        return [
            'offers' => Offer::select('city', DB::raw('count(*) as count'))
                             ->where('is_active', true)
                             ->groupBy('city')
                             ->orderBy('count', 'desc')
                             ->limit(10)
                             ->get(),
            'requests' => RequestModel::select('city', DB::raw('count(*) as count'))
                                      ->where('is_active', true)
                                      ->groupBy('city')
                                      ->orderBy('count', 'desc')
                                      ->limit(10)
                                      ->get()
        ];
    }

    /**
     * إحصائيات الأداء
     */
    public function getPerformanceStats($year)
    {
        $monthlyOffers = Offer::select(
            DB::raw('MONTH(offer_date) as month'),
            DB::raw('COUNT(*) as count')
        )
        ->whereYear('offer_date', $year)
        ->groupBy(DB::raw('MONTH(offer_date)'))
        ->orderBy(DB::raw('MONTH(offer_date)'))
        ->get();

        $completedOffers = Offer::where('is_closed', true)
                                ->whereYear('completed_at', $year)
                                ->count();

        $avgTime = Offer::where('is_closed', true)
                        ->whereNotNull('completed_at')
                        ->whereYear('completed_at', $year)
                        ->select(DB::raw('AVG(DATEDIFF(completed_at, offer_date)) as avg_days'))
                        ->first();

        return [
            'year' => $year,
            'monthly_offers' => $monthlyOffers,
            'completed_offers' => $completedOffers,
            'avg_completion_days' => round($avgTime->avg_days ?? 0, 1),
            'success_rate' => $this->calculateSuccessRate($year)
        ];
    }

    /**
     * حساب نسبة النجاح
     */
    private function calculateSuccessRate($year)
    {
        $total = Offer::whereYear('offer_date', $year)->count();
        $completed = Offer::whereYear('completed_at', $year)->where('is_closed', true)->count();

        if ($total == 0) return 0;
        
        return round(($completed / $total) * 100, 2);
    }
}