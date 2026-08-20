<?php

namespace App\Http\Controllers;

use App\Models\TransactionItem;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class TransactionItemController extends Controller
{
    public function index(): JsonResponse
    {
        $items = TransactionItem::query()
            ->with('transaction', 'product')
            ->when(request('transaction_id'), function ($query, $transactionId) {
                return $query->where('transaction_id', $transactionId);
            })
            ->when(request('product_id'), function ($query, $productId) {
                return $query->where('product_id', $productId);
            })
            ->paginate(request('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $items->items(),
            'pagination' => [
                'total' => $items->total(),
                'per_page' => $items->perPage(),
                'current_page' => $items->currentPage(),
                'last_page' => $items->lastPage(),
            ]
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'transaction_id' => 'required|exists:transactions,id',
            'product_id' => 'required|exists:products,id',
            'quantity' => 'required|integer|min:1',
            'unit_price' => 'required|numeric|min:0',
            'discount_per_item' => 'numeric|min:0',
        ]);

        $item = TransactionItem::create(array_merge($validated, [
            'subtotal' => ($validated['quantity'] * $validated['unit_price']) - ($validated['discount_per_item'] ?? 0),
        ]));

        return response()->json([
            'success' => true,
            'message' => 'Transaction item created successfully',
            'data' => $item->load('transaction', 'product')
        ], 201);
    }

    public function show(TransactionItem $transactionItem): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $transactionItem->load('transaction', 'product')
        ]);
    }

    public function update(Request $request, TransactionItem $transactionItem): JsonResponse
    {
        $validated = $request->validate([
            'quantity' => 'required|integer|min:1',
            'unit_price' => 'required|numeric|min:0',
            'discount_per_item' => 'numeric|min:0',
        ]);

        $transactionItem->update(array_merge($validated, [
            'subtotal' => ($validated['quantity'] * $validated['unit_price']) - ($validated['discount_per_item'] ?? 0),
        ]));

        return response()->json([
            'success' => true,
            'message' => 'Transaction item updated successfully',
            'data' => $transactionItem->load('transaction', 'product')
        ]);
    }

    public function destroy(TransactionItem $transactionItem): JsonResponse
    {
        if ($transactionItem->transaction->status === 'completed') {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete items from completed transactions'
            ], 422);
        }

        $transactionItem->delete();

        return response()->json([
            'success' => true,
            'message' => 'Transaction item deleted successfully'
        ]);
    }
}
