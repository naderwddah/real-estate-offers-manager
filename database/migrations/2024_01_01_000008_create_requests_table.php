<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('requests', function (Blueprint $table) {
            $table->id();
            $table->string('display_id', 20)->unique();
            
            $table->foreignId('contact_id')->nullable()->constrained('clients')->nullOnDelete();
            
            $table->foreignId('property_type_id')->constrained()->restrictOnDelete();
            $table->foreignId('deal_type_id')->constrained()->restrictOnDelete();
            $table->decimal('area', 12, 2);
            $table->decimal('budget', 15, 2);
            $table->string('city', 100);
            $table->string('districts', 255);
            $table->text('notes')->nullable();
            
            $table->foreignId('current_stage_id')->constrained('stages')->restrictOnDelete();
            $table->date('status_date');
            
            $table->json('log')->nullable();
            
            $table->foreignId('matched_offer_id')->nullable()->constrained('offers')->nullOnDelete();
            
            $table->date('appointment_date')->nullable();
            $table->string('appointment_time', 10)->nullable();
            $table->text('appointment_notes')->nullable();
            
            $table->date('request_date');
            $table->datetime('matched_at')->nullable();
            $table->datetime('completed_at')->nullable();
            
            $table->boolean('is_active')->default(true);
            $table->boolean('is_closed')->default(false);
            $table->string('closure_reason', 255)->nullable();
            
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->timestamps();
            
            $table->index('display_id');
            $table->index('city');
            $table->index('is_active');
            $table->index('request_date');
            $table->index('current_stage_id');
            $table->index('contact_id');
        });
    }

    public function down()
    {
        Schema::dropIfExists('requests');
    }
};