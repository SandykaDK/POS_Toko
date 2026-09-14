<?php

namespace Database\Seeders;

use App\Models\Customer;
use App\Models\Discount;
use App\Models\Product;
use App\Models\Payment;
use App\Models\Transaction;
use App\Models\TransactionItem;
use App\Models\User;
use Illuminate\Database\Seeder;

class TransactionSeeder extends Seeder
{
    public function run(): void
    {
        $user = User::where('email', 'admin@gmail.com')->firstOrFail();
        $products = Product::whereIn('name', [
            'Indomie Goreng 85g', 'Indomie Goreng Jumbo 129g', 'Adem Sari', 'Aqua 600ml',
            'Joyko Correction Tape CT-522', 'Bodrexin Demam',
        ])->get()->keyBy('name');
        $customers = Customer::whereIn('email', [
            'andi@tokopos.test', 'budi@tokopos.test', 'citra@tokopos.test',
            'dedi@tokopos.test', 'eka@tokopos.test', 'fajar@tokopos.test',
        ])->get()->keyBy('email');
        $discounts = Discount::whereIn('code', ['SAVE10', 'HEMAT25', 'FLASH75'])->get()->keyBy('code');

        $transactions = [
            ['invoice' => 'INV-DEMO-001', 'customer' => 'andi@tokopos.test', 'days' => 1, 'hour' => 9, 'payment' => 'cash', 'discount' => 'SAVE10', 'items' => [['Indomie Goreng Jumbo 129g', 10], ['Adem Sari', 5], ['Joyko Correction Tape CT-522', 5]]],
            ['invoice' => 'INV-DEMO-002', 'customer' => 'budi@tokopos.test', 'days' => 3, 'hour' => 11, 'payment' => 'transfer', 'discount' => 'HEMAT25', 'items' => [['Indomie Goreng Jumbo 129g', 10], ['Joyko Correction Tape CT-522', 10], ['Aqua 600ml', 10]]],
            ['invoice' => 'INV-DEMO-003', 'customer' => 'citra@tokopos.test', 'days' => 5, 'hour' => 14, 'payment' => 'cash', 'discount' => null, 'items' => [['Indomie Goreng 85g', 5], ['Adem Sari', 4], ['Aqua 600ml', 5], ['Bodrexin Demam', 2]]],
            ['invoice' => 'INV-DEMO-004', 'customer' => 'dedi@tokopos.test', 'days' => 7, 'hour' => 16, 'payment' => 'cash', 'discount' => 'FLASH75', 'items' => [['Joyko Correction Tape CT-522', 20], ['Indomie Goreng Jumbo 129g', 10], ['Adem Sari', 10], ['Aqua 600ml', 10]]],
            ['invoice' => 'INV-DEMO-005', 'customer' => 'eka@tokopos.test', 'days' => 0, 'hour' => 8, 'payment' => 'cash', 'discount' => null, 'items' => [['Indomie Goreng 85g', 3], ['Aqua 600ml', 2]]],
            ['invoice' => 'INV-DEMO-006', 'customer' => 'fajar@tokopos.test', 'days' => 12, 'hour' => 18, 'payment' => 'cash', 'discount' => null, 'items' => [['Indomie Goreng Jumbo 129g', 4], ['Adem Sari', 3], ['Bodrexin Demam', 2]]],
        ];

        foreach ($transactions as $data) {
            $customer = $customers->get($data['customer']);
            $lineItems = collect($data['items'])->map(function (array $item) use ($products) {
                $product = $products->get($item[0]);
                $quantity = $item[1];

                return [
                    'product' => $product,
                    'quantity' => $quantity,
                    'subtotal' => $quantity * (float) $product->selling_price,
                ];
            });
            $subtotal = $lineItems->sum('subtotal');
            $discount = $data['discount'] ? $discounts->get($data['discount']) : null;
            $discountAmount = 0;

            if ($discount) {
                $discountAmount = $discount->type === 'percentage'
                    ? ($subtotal * (float) $discount->value) / 100
                    : (float) $discount->value;

                if ($discount->type === 'percentage' && $discount->max_discount) {
                    $discountAmount = min($discountAmount, (float) $discount->max_discount);
                }
            }

            $transaction = Transaction::updateOrCreate(
                ['invoice_number' => $data['invoice']],
                [
                    'user_id' => $user->id,
                    'customer_id' => $customer->id,
                    'customer_name' => $customer->name,
                    'transaction_date' => now()->subDays($data['days'])->setTime($data['hour'], 0),
                    'subtotal' => $subtotal,
                    'discount_amount' => $discountAmount,
                    'total_amount' => max($subtotal - $discountAmount, 0),
                    'cash_received' => $data['payment'] === 'cash' && ($data['status'] ?? 'completed') === 'completed'
                        ? max($subtotal - $discountAmount, 0) + 5000
                        : null,
                    'change_amount' => $data['payment'] === 'cash' && ($data['status'] ?? 'completed') === 'completed'
                        ? 5000
                        : null,
                    'payment_method' => $data['payment'],
                    'status' => $data['status'] ?? 'completed',
                    'notes' => 'Transaksi demo untuk pengujian riwayat dan filter tanggal.',
                ]
            );

            $transaction->transactionItems()->delete();
            $transaction->payments()->delete();
            foreach ($lineItems as $lineItem) {
                TransactionItem::create([
                    'transaction_id' => $transaction->id,
                    'product_id' => $lineItem['product']->id,
                    'product_name' => $lineItem['product']->name,
                    'quantity' => $lineItem['quantity'],
                    'unit_price' => $lineItem['product']->selling_price,
                    'discount_per_item' => 0,
                    'subtotal' => $lineItem['subtotal'],
                ]);
            }

            Payment::create([
                'transaction_id' => $transaction->id,
                'payment_method' => $data['payment'],
                'amount' => $transaction->total_amount,
                'status' => ($data['status'] ?? 'completed') === 'completed' ? 'success' : 'pending',
                'payment_date' => ($data['status'] ?? 'completed') === 'completed' ? now() : null,
                'notes' => ($data['status'] ?? 'completed') === 'completed'
                    ? 'Pembayaran demo diterima.'
                    : 'Menunggu konfirmasi pembayaran QRIS.',
            ]);
        }

        Customer::query()->each(function (Customer $customer) {
            $summary = $customer->transactions()
                ->where('status', 'completed')
                ->selectRaw('COUNT(*) as purchase_count, COALESCE(SUM(total_amount), 0) as total_purchases')
                ->first();

            $customer->update([
                'purchase_count' => $summary->purchase_count,
                'total_purchases' => $summary->total_purchases,
            ]);
        });
    }
}
