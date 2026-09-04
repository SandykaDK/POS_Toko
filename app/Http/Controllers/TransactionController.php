<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
use App\Models\TransactionItem;
use App\Models\Product;
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
                'transaction_date' => 'required|date',
                'subtotal' => 'required|numeric|min:0',
                'discount_amount' => 'required|numeric|min:0',
                'total_amount' => 'required|numeric|min:0',
                'payment_method' => 'required|string|max:50',
                'status' => 'in:pending,completed,cancelled',
                'notes' => 'nullable|string',
                'items' => 'required|array|min:1',
                'items.*.product_id' => 'required|exists:products,id',
                'items.*.quantity' => 'required|integer|min:1',
                'items.*.unit_price' => 'required|numeric|min:0',
                'items.*.discount_per_item' => 'numeric|min:0',
            ]);

            $transaction = Transaction::create([
                'invoice_number' => $validated['invoice_number'],
                'user_id' => $validated['user_id'],
                'customer_id' => $validated['customer_id'] ?? null,
                'transaction_date' => $validated['transaction_date'],
                'subtotal' => $validated['subtotal'],
                'discount_amount' => $validated['discount_amount'],
                'total_amount' => $validated['total_amount'],
                'payment_method' => $validated['payment_method'],
                'status' => $validated['status'] ?? 'completed',
                'notes' => $validated['notes'] ?? null,
            ]);

            foreach ($validated['items'] as $item) {
                TransactionItem::create([
                    'transaction_id' => $transaction->id,
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'discount_per_item' => $item['discount_per_item'] ?? 0,
                    'subtotal' => ($item['quantity'] * $item['unit_price']) - ($item['discount_per_item'] ?? 0),
                ]);

                Product::findOrFail($item['product_id'])
                    ->decrement('stock', $item['quantity']);
            }

            if ($transaction->customer) {
                $transaction->customer->increment('purchase_count');
                $transaction->customer->increment('total_purchases', $transaction->total_amount);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Transaksi berhasil dibuat',
                'data' => $transaction->load('customer', 'user', 'transactionItems')
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
