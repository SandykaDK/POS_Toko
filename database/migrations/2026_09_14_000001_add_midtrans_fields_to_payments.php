<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->string('provider')->nullable()->after('payment_method');
            $table->string('provider_transaction_id')->nullable()->after('provider')->index();
            $table->longText('qr_code_data')->nullable()->after('provider_transaction_id');
            $table->datetime('expires_at')->nullable()->after('payment_date');
        });
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropIndex(['provider_transaction_id']);
            $table->dropColumn(['provider', 'provider_transaction_id', 'qr_code_data', 'expires_at']);
        });
    }
};
