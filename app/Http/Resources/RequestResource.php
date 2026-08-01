<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class RequestResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id' => $this->id,
            'display_id' => $this->display_id,
            'contact' => $this->contact ? [
                'id' => $this->contact->id,
                'name' => $this->contact->name,
                'phone' => $this->contact->phone
            ] : null,
            'property_type' => $this->propertyType->name ?? null,
            'deal_type' => $this->dealType->name ?? null,
            'area' => $this->area,
            'budget' => $this->budget,
            'city' => $this->city,
            'districts' => $this->districts,
            'notes' => $this->notes,
            'current_stage' => $this->currentStage->name ?? null,
            'stage_color' => $this->currentStage->color ?? null,
            'log' => $this->log,
            'matched_offer' => $this->matchedOffer ? [
                'id' => $this->matchedOffer->id,
                'display_id' => $this->matchedOffer->display_id,
                'title' => $this->matchedOffer->title
            ] : null,
            'appointment_date' => $this->appointment_date,
            'appointment_time' => $this->appointment_time,
            'request_date' => $this->request_date,
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