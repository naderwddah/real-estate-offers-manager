<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('offers', function (Blueprint $table) {
            $table->id();
            $table->string('display_id', 20)->unique();
            $table->enum('track_type', ['company', 'personal']);
            
            $table->string('title', 255);
            $table->foreignId('property_type_id')->constrained()->restrictOnDelete();
            $table->foreignId('deal_type_id')->constrained()->restrictOnDelete();
            $table->decimal('area', 12, 2);
            $table->decimal('price', 15, 2);
            $table->string('city', 100);
            $table->string('district', 100)->nullable();
            $table->string('address', 255)->nullable();
            $table->string('map_url', 500)->nullable();
            $table->text('description')->nullable();
            $table->string('purpose', 255)->nullable();
            
            $table->foreignId('contact_id')->nullable()->constrained('clients')->nullOnDelete();
            $table->foreignId('current_stage_id')->constrained('stages')->restrictOnDelete();
            $table->date('status_date');
            
            $table->json('log')->nullable();
            
            $table->date('offer_date');
            $table->datetime('sent_to_manager_at')->nullable();
            $table->datetime('manager_response_at')->nullable();
            $table->text('manager_notes')->nullable();
            $table->datetime('client_notified_at')->nullable();
            $table->datetime('client_response_at')->nullable();
            $table->datetime('legal_review_at')->nullable();
            $table->enum('legal_status', ['قيد المراجعة', 'معتمد', 'مرفوض', 'مطلوب تعديل'])->nullable();
            $table->datetime('contract_sent_at')->nullable();
            $table->datetime('contract_signed_at')->nullable();
            $table->datetime('completed_at')->nullable();
            
            $table->boolean('is_active')->default(true);
            $table->boolean('is_closed')->default(false);
            $table->string('closure_reason', 255)->nullable();
            
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->timestamps();
            
            $table->index('display_id');
            $table->index('track_type');
            $table->index('city');
            $table->index('price');
            $table->index('current_stage_id');
            $table->index('is_active');
            $table->index('contact_id');
            $table->index('offer_date');
        });
    }

    public function down()
    {
        Schema::dropIfExists('offers');
    }
};