<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('offer_attachments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('offer_id')->constrained()->cascadeOnDelete();
            $table->string('file_name', 255);
            $table->string('file_path', 500);
            $table->bigInteger('file_size')->unsigned()->nullable();
            $table->string('mime_type', 100)->nullable();
            $table->enum('doc_type', ['صورة', 'مخطط', 'صك', 'وكالة', 'عقد', 'سجل تجاري', 'ترخيص', 'أخرى']);
            $table->datetime('uploaded_at')->default(DB::raw('CURRENT_TIMESTAMP'));
            $table->foreignId('uploaded_by')->constrained('users')->restrictOnDelete();
            $table->timestamps();
            
            $table->index('offer_id');
            $table->index('doc_type');
        });
    }

    public function down()
    {
        Schema::dropIfExists('offer_attachments');
    }
};