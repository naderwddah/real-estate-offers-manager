<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('stages', function (Blueprint $table) {
            $table->id();
            $table->enum('track_type', ['company_offer', 'personal_offer', 'request']);
            $table->string('name', 100);
            $table->integer('stage_order');
            $table->string('color', 20)->default('#808080');
            $table->boolean('is_final')->default(false);
            $table->timestamps();
            
            $table->unique(['track_type', 'stage_order']);
            $table->index('track_type');
        });
    }

    public function down()
    {
        Schema::dropIfExists('stages');
    }
};