<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class OfferResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id' => $this->id,
            'display_id' => $this->display_id,
            'track_type' => $this->track_type,
            'title' => $this->title,
            'property_type' => $this->propertyType->name ?? null,
            'deal_type' => $this->dealType->name ?? null,
            'area' => $this->area,
            'price' => $this->price,
            'city' => $this->city,
            'district' => $this->district,
            'address' => $this->address,
            'map_url' => $this->map_url,
            'description' => $this->description,
            'contact' => $this->contact ? [
                'id' => $this->contact->id,
                'name' => $this->contact->name,
                'phone' => $this->contact->phone
            ] : null,
            'current_stage' => $this->currentStage->name ?? null,
            'stage_color' => $this->currentStage->color ?? null,
            'log' => $this->log,
            'offer_date' => $this->offer_date,
            'is_active' => $this->is_active,
            'is_closed' => $this->is_closed,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'attachments' => $this->attachments->map(function($attachment) {
                return [
                    'id' => $attachment->id,
                    'file_name' => $attachment->file_name,
                    'file_url' => $attachment->file_url,
                    'doc_type' => $attachment->doc_type
                ];
            })
        ];
    }
}