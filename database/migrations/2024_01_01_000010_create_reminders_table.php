<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('reminders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('offer_id')->nullable()->constrained()->cascadeOnDelete();
            $table->foreignId('request_id')->nullable()->constrained()->cascadeOnDelete();
            $table->datetime('reminder_time');
            $table->string('note', 255);
            $table->boolean('is_sent')->default(false);
            $table->datetime('sent_at')->nullable();
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->timestamps();
            
            $table->index('offer_id');
            $table->index('request_id');
            $table->index('reminder_time');
            $table->index('is_sent');
        });
    }

    public function down()
    {
        Schema::dropIfExists('reminders');
    }
};