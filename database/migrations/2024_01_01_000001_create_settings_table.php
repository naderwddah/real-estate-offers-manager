<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('settings', function (Blueprint $table) {
            $table->id();
            $table->string('company_name', 255);
            $table->string('logo_path', 500)->nullable();
            $table->string('phone', 20)->nullable();
            $table->string('email', 255)->nullable();
            $table->string('manager_name', 100)->nullable();
            $table->string('manager_phone', 20)->nullable();
            $table->string('manager_email', 255)->nullable();
            $table->string('legal_name', 100)->nullable();
            $table->string('legal_phone', 20)->nullable();
            $table->string('legal_email', 255)->nullable();
            $table->text('report_footer')->nullable();
            $table->integer('max_wait_days')->default(3);
            $table->integer('report_day')->default(4);
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('settings');
    }
};