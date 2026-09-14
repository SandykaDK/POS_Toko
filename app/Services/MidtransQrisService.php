<?php

namespace App\Services;

use App\Models\Transaction;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class MidtransQrisService
{
    public function charge(Transaction $transaction): array
    {
        $serverKey = config('services.midtrans.server_key');
        if (!$serverKey) {
            throw new RuntimeException('MIDTRANS_SERVER_KEY belum dikonfigurasi.');
        }

        $response = Http::withBasicAuth($serverKey, '')
            ->acceptJson()
            ->post(config('services.midtrans.base_url') . '/v2/charge', [
                'payment_type' => 'qris',
                'transaction_details' => [
                    'order_id' => $transaction->invoice_number,
                    'gross_amount' => (int) round((float) $transaction->total_amount),
                ],
                'item_details' => $transaction->transactionItems->map(fn ($item) => [
                    'id' => (string) $item->product_id,
                    'price' => (int) round((float) $item->unit_price),
                    'quantity' => $item->quantity,
                    'name' => $item->product_name,
                ])->values()->all(),
                'customer_details' => [
                    'first_name' => $transaction->customer_name ?: 'Pelanggan',
                ],
                'qris' => [
                    'acquirer' => config('services.midtrans.qris_acquirer', 'gopay'),
                ],
            ]);

        if (!$response->successful()) {
            throw new RuntimeException('Midtrans gagal membuat QRIS: ' . ($response->json('status_message') ?: $response->body()));
        }

        $payload = $response->json();
        $action = collect($payload['actions'] ?? [])->first(fn ($item) => in_array($item['name'] ?? '', ['generate-qr-code-v2', 'generate-qr-code'], true));
        if (empty($action['url'] ?? null)) {
            throw new RuntimeException('Midtrans tidak mengembalikan URL QRIS.');
        }

        $qrResponse = Http::withBasicAuth($serverKey, '')
            ->get($action['url']);
        if (!$qrResponse->successful()) {
            throw new RuntimeException('QR code Midtrans gagal diambil.');
        }

        return [
            'provider_transaction_id' => $payload['transaction_id'],
            'qr_code_data' => 'data:image/png;base64,' . base64_encode($qrResponse->body()),
            'expires_at' => now()->addMinutes(config('services.midtrans.qris_expiry_minutes', 15)),
        ];
    }
}
