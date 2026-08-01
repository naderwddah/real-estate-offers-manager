<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class ClientResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'phone' => $this->phone,
            'email' => $this->email,
            'notes' => $this->notes,
            'offers_count' => $this->offers->count(),
            'requests_count' => $this->requests->count(),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at
        ];
    }
}