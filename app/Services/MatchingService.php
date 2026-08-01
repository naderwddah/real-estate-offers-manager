<?php

namespace App\Services;

use App\Models\Offer;
use App\Models\Request;
use Illuminate\Support\Collection;

class MatchingService
{
    /**
     * إيجاد عروض مطابقة لطلب
     */
    public function findMatchesForRequest(Request $request): Collection
    {
        $query = Offer::where('is_active', true)
                      ->where('is_closed', false);

        // مطابقة نوع العقار
        if ($request->property_type_id) {
            $query->where('property_type_id', $request->property_type_id);
        }

        // مطابقة المدينة
        if ($request->city) {
            $query->where('city', $request->city);
        }

        // مطابقة المساحة
        $query->where('area', '>=', $request->area * 0.8)
              ->where('area', '<=', $request->area * 1.2);

        // مطابقة الميزانية
        $query->where('price', '<=', $request->budget * 1.1);

        $offers = $query->get();

        // حساب نسبة المطابقة لكل عرض
        $offers->each(function($offer) use ($request) {
            $score = $this->calculateMatchScore($offer, $request);
            $offer->match_score = $score;
        });

        // ترتيب حسب نسبة المطابقة
        return $offers->sortByDesc('match_score')->values();
    }

    /**
     * إيجاد طلبات مطابقة لعرض
     */
    public function findMatchesForOffer(Offer $offer): Collection
    {
        $query = Request::where('is_active', true)
                        ->where('is_closed', false);

        // مطابقة نوع العقار
        if ($offer->property_type_id) {
            $query->where('property_type_id', $offer->property_type_id);
        }

        // مطابقة المدينة
        if ($offer->city) {
            $query->where('city', $offer->city);
        }

        // مطابقة المساحة
        $query->where('area', '>=', $offer->area * 0.8)
              ->where('area', '<=', $offer->area * 1.2);

        // مطابقة الميزانية
        $query->where('budget', '>=', $offer->price * 0.9);

        $requests = $query->get();

        // حساب نسبة المطابقة لكل طلب
        $requests->each(function($request) use ($offer) {
            $score = $this->calculateMatchScore($offer, $request);
            $request->match_score = $score;
        });

        return $requests->sortByDesc('match_score')->values();
    }

    /**
     * حساب نسبة المطابقة
     */
    public function calculateMatchScore(Offer $offer, Request $request): int
    {
        $score = 0;
        $total = 0;

        // نوع العقار (20%)
        if ($offer->property_type_id === $request->property_type_id) {
            $score += 20;
        }
        $total += 20;

        // المدينة (20%)
        if ($offer->city === $request->city) {
            $score += 20;
        }
        $total += 20;

        // المساحة (20%)
        $areaRatio = $offer->area / $request->area;
        if ($areaRatio >= 0.8 && $areaRatio <= 1.2) {
            $score += 20;
        } elseif ($areaRatio >= 0.6 && $areaRatio <= 1.4) {
            $score += 10;
        }
        $total += 20;

        // الميزانية (20%)
        $priceRatio = $offer->price / $request->budget;
        if ($priceRatio <= 1.1) {
            $score += 20;
        } elseif ($priceRatio <= 1.3) {
            $score += 10;
        }
        $total += 20;

        // نوع الصفقة (20%)
        if ($offer->deal_type_id === $request->deal_type_id) {
            $score += 20;
        }
        $total += 20;

        return round(($score / $total) * 100);
    }
}