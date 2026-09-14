<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
use App\Models\TransactionItem;
use App\Models\Product;
use App\Models\Customer;
use App\Models\Discount;
use App\Models\Payment;
use App\Services\MidtransQrisService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class TransactionController extends Controller
{
    public function index(): JsonResponse
    {
        $transactions = Transaction::query()
            ->with('customer', 'user', 'transactionItems.product')
            ->when(request('status'), function ($query, $status) {
                return $query->where('status', $status);
            })
            ->when(request('customer_id'), function ($query, $customerId) {
                return $query->where('customer_id', $customerId);
            })
            ->when(request('invoice_number'), function ($query, $invoice) {
                return $query->where('invoice_number', 'like', "%{$invoice}%");
            })
            ->when(request('start_date'), function ($query, $startDate) {
                return $query->whereDate('transaction_date', '>=', $startDate);
            })
            ->when(request('end_date'), function ($query, $endDate) {
                return $query->whereDate('transaction_date', '<=', $endDate);
            })
            ->orderByDesc('transaction_date')
            ->paginate(request('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $transactions->items(),
            'pagination' => [
                'total' => $transactions->total(),
                'per_page' => $transactions->perPage(),
                'current_page' => $transactions->currentPage(),
                'last_page' => $transactions->lastPage(),
            ]
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        try {
            DB::beginTransaction();

            $validated = $request->validate([
                'invoice_number' => 'required|string|unique:transactions',
                'user_id' => 'required|exists:users,id',
                'customer_id' => 'nullable|exists:customers,id',
                'discount_code' => 'nullable|string|max:50',
                'transaction_date' => 'required|date',
                'subtotal' => 'required|numeric|min:0',
                'discount_amount' => 'required|numeric|min:0',
                'total_amount' => 'required|numeric|min:0',
                'payment_method' => 'required|in:cash,qris',
                'cash_received' => 'nullable|numeric|min:0|required_if:payment_method,cash',
                'status' => 'in:pending,completed,cancelled',
                'notes' => 'nullable|string',
                'items' => 'required|array|min:1',
                'items.*.product_id' => 'required|exists:products,id',
                'items.*.quantity' => 'required|integer|min:1',
                'items.*.unit_price' => 'required|numeric|min:0',
                'items.*.discount_per_item' => 'numeric|min:0',
            ]);

            $discountAmount = 0;
            if ($validated['discount_code'] ?? null) {
                $discount = Discount::where('code', $validated['discount_code'])->first();

                if (!$discount || !$discount->is_active || $discount->start_date > now() || ($discount->end_date && $discount->end_date < now())) {
                    throw new \RuntimeException('Kode diskon tidak valid atau sudah tidak berlaku.');
                }

                if ($discount->max_usage && $discount->usage_count >= $discount->max_usage) {
                    throw new \RuntimeException('Batas penggunaan kode diskon sudah tercapai.');
                }

                if ($validated['subtotal'] < $discount->min_purchase) {
                    throw new \RuntimeException("Minimal pembelian adalah {$discount->min_purchase}.");
                }

                $discountAmount = $discount->type === 'percentage'
                    ? ($validated['subtotal'] * $discount->value) / 100
                    : $discount->value;
                if ($discount->type === 'percentage' && $discount->max_discount) {
                    $discountAmount = min($discountAmount, $discount->max_discount);
                }
            } elseif ((float) $validated['discount_amount'] > 0) {
                throw new \RuntimeException('Kode diskon wajib dikirim untuk menggunakan potongan harga.');
            }

            $totalAmount = max($validated['subtotal'] - $discountAmount, 0);
            $cashReceived = $validated['payment_method'] === 'cash' ? (float) $validated['cash_received'] : null;
            if ($validated['payment_method'] === 'cash' && $cashReceived < $totalAmount) {
                throw new \RuntimeException('Jumlah uang dibayarkan kurang dari total transaksi.');
            }
            $changeAmount = $cashReceived === null ? null : $cashReceived - $totalAmount;
            $transactionStatus = $validated['payment_method'] === 'qris' ? 'pending' : 'completed';

            $products = Product::whereIn('id', collect($validated['items'])->pluck('product_id')->unique())
                ->lockForUpdate()
                ->get()
                ->keyBy('id');

            $requestedQuantities = collect($validated['items'])
                ->groupBy('product_id')
                ->map(fn ($items) => $items->sum('quantity'));

            foreach ($requestedQuantities as $productId => $quantity) {
                $product = $products->get($productId);

                if (!$product->is_active) {
                    throw new \RuntimeException("Produk {$product->name} tidak aktif.");
                }

                if ($quantity > $product->stock) {
                    throw new \RuntimeException("Stok produk {$product->name} tidak mencukupi. Stok tersedia: {$product->stock}.");
                }
            }

            $transaction = Transaction::create([
                'invoice_number' => $validated['invoice_number'],
                'user_id' => $validated['user_id'],
                'customer_id' => $validated['customer_id'] ?? null,
                'customer_name' => $validated['customer_id']
                    ? Customer::findOrFail($validated['customer_id'])->name
                    : null,
                'transaction_date' => $validated['transaction_date'],
                'subtotal' => $validated['subtotal'],
                'discount_amount' => $discountAmount,
                'total_amount' => $totalAmount,
                'cash_received' => $cashReceived,
                'change_amount' => $changeAmount,
                'payment_method' => $validated['payment_method'],
                'status' => $transactionStatus,
                'notes' => $validated['notes'] ?? null,
            ]);

            $payment = Payment::create([
                'transaction_id' => $transaction->id,
                'payment_method' => $validated['payment_method'],
                'amount' => $totalAmount,
                'status' => $transactionStatus === 'completed' ? 'success' : 'pending',
                'payment_date' => $transactionStatus === 'completed' ? now() : null,
                'notes' => $transactionStatus === 'completed' ? 'Pembayaran tunai diterima.' : 'Menunggu konfirmasi pembayaran QRIS.',
            ]);

            foreach ($validated['items'] as $item) {
                TransactionItem::create([
                    'transaction_id' => $transaction->id,
                    'product_id' => $item['product_id'],
                    'product_name' => $products->get($item['product_id'])->name,
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'discount_per_item' => $item['discount_per_item'] ?? 0,
                    'subtotal' => ($item['quantity'] * $item['unit_price']) - ($item['discount_per_item'] ?? 0),
                ]);
            }

            if ($transaction->status === 'completed') {
                foreach ($requestedQuantities as $productId => $quantity) {
                    $products->get($productId)->decrement('stock', (int) $quantity);
                }

                if ($transaction->customer) {
                    $transaction->customer->increment('purchase_count');
                    $transaction->customer->increment('total_purchases', $transaction->total_amount);
                }
            }

            if ($transaction->payment_method === 'qris') {
                $qris = app(MidtransQrisService::class)->charge($transaction->load('transactionItems'));
                $payment->update([
                    'provider' => 'midtrans',
                    'provider_transaction_id' => $qris['provider_transaction_id'],
                    'qr_code_data' => $qris['qr_code_data'],
                    'expires_at' => $qris['expires_at'],
                ]);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Transaksi berhasil dibuat',
                'data' => $transaction->load('customer', 'user', 'transactionItems', 'payments')
            ], 201);
        } catch (\Exception $e) {
            DB::rollback();

            return response()->json([
                'success' => false,
                'message' => 'Transaksi gagal dibuat: ' . $e->getMessage()
            ], 422);
        }
    }

    public function show(Transaction $transaction): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $transaction->load('customer', 'user', 'transactionItems', 'payments')
        ]);
    }

    public function confirmPayment(Transaction $transaction): JsonResponse
    {
        try {
            DB::beginTransaction();

            if ($transaction->status !== 'pending') {
                throw new \RuntimeException('Hanya transaksi pending yang dapat dikonfirmasi.');
            }

            $items = $transaction->transactionItems()->get();
            $products = Product::withTrashed()
                ->whereIn('id', $items->pluck('product_id')->unique())
                ->lockForUpdate()
                ->get()
                ->keyBy('id');

            foreach ($items->groupBy('product_id') as $productId => $productItems) {
                $quantity = (int) $productItems->sum('quantity');
                $product = $products->get($productId);

                if (!$product || !$product->is_active) {
                    throw new \RuntimeException('Produk transaksi sudah tidak aktif.');
                }

                if ($quantity > $product->stock) {
                    throw new \RuntimeException("Stok produk {$product->name} tidak mencukupi.");
                }

                $product->decrement('stock', $quantity);
            }

            $payment = $transaction->payments()->where('status', 'pending')->latest()->first();
            if (!$payment) {
                $payment = Payment::create([
                    'transaction_id' => $transaction->id,
                    'payment_method' => $transaction->payment_method,
                    'amount' => $transaction->total_amount,
                ]);
            }

            $payment->update([
                'status' => 'success',
                'payment_date' => now(),
                'notes' => 'Pembayaran QRIS dikonfirmasi.',
            ]);
            $transaction->update(['status' => 'completed']);

            if ($transaction->customer) {
                $transaction->customer->increment('purchase_count');
                $transaction->customer->increment('total_purchases', $transaction->total_amount);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Pembayaran QRIS berhasil dikonfirmasi.',
                'data' => $transaction->load('customer', 'user', 'transactionItems', 'payments'),
            ]);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Konfirmasi pembayaran gagal: ' . $e->getMessage(),
            ], 422);
        }
    }

    public function update(Request $request, Transaction $transaction): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'in:pending,completed,cancelled',
            'notes' => 'nullable|string',
        ]);

        $transaction->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Transaksi berhasil diperbarui',
            'data' => $transaction->load('customer', 'user', 'transactionItems')
        ]);
    }

    public function destroy(Transaction $transaction): JsonResponse
    {
        if ($transaction->payments()->where('status', 'success')->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Transaksi tidak dapat dihapus karena sudah memiliki pembayaran berhasil'
            ], 422);
        }

        $transaction->delete();

        return response()->json([
            'success' => true,
            'message' => 'Transaksi berhasil dihapus'
        ]);
    }

    public function items(Transaction $transaction): JsonResponse
    {
        $items = $transaction->transactionItems()->with('product')->get();

        return response()->json([
            'success' => true,
            'data' => $items
        ]);
    }

    public function salesReport(): JsonResponse
    {
        $startDate = request('start_date');
        $endDate = request('end_date');

        $report = Transaction::query()
            ->when($startDate, function ($query) use ($startDate) {
                return $query->whereDate('transaction_date', '>=', $startDate);
            })
            ->when($endDate, function ($query) use ($endDate) {
                return $query->whereDate('transaction_date', '<=', $endDate);
            })
            ->where('status', 'completed')
            ->selectRaw('DATE(transaction_date) as date, COUNT(*) as total_transactions, SUM(total_amount) as total_sales')
            ->groupBy('date')
            ->orderByDesc('date')
            ->get();

        $summary = Transaction::query()
            ->when($startDate, function ($query) use ($startDate) {
                return $query->whereDate('transaction_date', '>=', $startDate);
            })
            ->when($endDate, function ($query) use ($endDate) {
                return $query->whereDate('transaction_date', '<=', $endDate);
            })
            ->where('status', 'completed')
            ->selectRaw('COUNT(*) as total_transactions, SUM(total_amount) as total_sales, AVG(total_amount) as average_sale')
            ->first();

        return response()->json([
            'success' => true,
            'data' => $report,
            'summary' => $summary
        ]);
    }
}
