<?php

namespace App\Http\Controllers;

use App\Models\Inventory;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class InventoryController extends Controller
{
    public function index(): JsonResponse
    {
        $inventories = Inventory::query()
            ->with('product', 'supplier', 'user')
            ->when(request('product_id'), function ($query, $productId) {
                return $query->where('product_id', $productId);
            })
            ->when(request('type'), function ($query, $type) {
                return $query->where('type', $type);
            })
            ->orderByDesc('transaction_date')
            ->paginate(request('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $inventories->items(),
            'pagination' => [
                'total' => $inventories->total(),
                'per_page' => $inventories->perPage(),
                'current_page' => $inventories->currentPage(),
                'last_page' => $inventories->lastPage(),
            ]
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'supplier_id' => 'nullable|exists:suppliers,id',
            'type' => 'required|in:in,out,adjustment',
            'quantity' => 'required|integer|min:1',
            'cost_per_unit' => 'required|numeric|min:0',
            'reference_number' => 'nullable|string|max:100',
            'notes' => 'nullable|string',
            'user_id' => 'required|exists:users,id',
            'transaction_date' => 'required|datetime',
        ]);

        $product = Product::findOrFail($validated['product_id']);

        if ($validated['type'] === 'in') {
            $product->increment('stock', $validated['quantity']);
        } elseif ($validated['type'] === 'out') {
            $product->decrement('stock', $validated['quantity']);
        } elseif ($validated['type'] === 'adjustment') {
            $product->update(['stock' => $validated['quantity']]);
        }

        $inventory = Inventory::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Inventory logged successfully',
            'data' => $inventory->load('product', 'supplier', 'user')
        ], 201);
    }

    public function show(Inventory $inventory): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $inventory->load('product', 'supplier', 'user')
        ]);
    }

    public function update(Request $request, Inventory $inventory): JsonResponse
    {
        $validated = $request->validate([
            'notes' => 'nullable|string',
        ]);

        $inventory->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Inventory updated successfully',
            'data' => $inventory->load('product', 'supplier', 'user')
        ]);
    }

    public function destroy(Inventory $inventory): JsonResponse
    {
        $inventory->delete();

        return response()->json([
            'success' => true,
            'message' => 'Inventory deleted successfully'
        ]);
    }

    public function inventoryReport(): JsonResponse
    {
        $products = Product::query()
            ->where('is_active', true)
            ->select('id', 'name', 'sku', 'stock', 'min_stock', 'unit')
            ->get()
            ->map(function ($product) {
                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'sku' => $product->sku,
                    'current_stock' => $product->stock,
                    'min_stock' => $product->min_stock,
                    'unit' => $product->unit,
                    'status' => $product->stock <= $product->min_stock ? 'low_stock' : 'ok'
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $products
        ]);
    }
}
