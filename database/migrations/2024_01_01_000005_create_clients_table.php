<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('clients', function (Blueprint $table) {
            $table->id();
            $table->string('name', 255);
            $table->string('phone', 20);
            $table->string('email', 255)->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            
            $table->index('phone');
            $table->index('name');
        });
    }

    public function down()
    {
        Schema::dropIfExists('clients');
    }
};