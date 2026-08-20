<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ProductController extends Controller
{
    public function index(): JsonResponse
    {
        $products = Product::query()
            ->with('category')
            ->when(request('search'), function ($query, $search) {
                return $query->where('name', 'like', "%{$search}%")
                    ->orWhere('sku', 'like', "%{$search}%");
            })
            ->when(request('category_id'), function ($query, $categoryId) {
                return $query->where('category_id', $categoryId);
            })
            ->when(request('active'), function ($query) {
                return $query->where('is_active', true);
            })
            ->paginate(request('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $products->items(),
            'pagination' => [
                'total' => $products->total(),
                'per_page' => $products->perPage(),
                'current_page' => $products->currentPage(),
                'last_page' => $products->lastPage(),
            ]
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'category_id' => 'required|exists:categories,id',
            'sku' => 'required|string|max:50|unique:products',
            'name' => 'required|string|max:100',
            'cost_price' => 'required|numeric|min:0',
            'selling_price' => 'required|numeric|min:0',
            'min_stock' => 'required|integer|min:1',
            'stock' => 'required|integer|min:0',
            'unit' => 'required|string|max:50',
            'image' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $product = Product::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Product created successfully',
            'data' => $product->load('category')
        ], 201);
    }

    public function show(Product $product): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $product->load('category')
        ]);
    }

    public function update(Request $request, Product $product): JsonResponse
    {
        $validated = $request->validate([
            'category_id' => 'exists:categories,id',
            'sku' => "required|string|max:50|unique:products,sku,{$product->id}",
            'name' => 'required|string|max:100',
            'cost_price' => 'required|numeric|min:0',
            'selling_price' => 'required|numeric|min:0',
            'min_stock' => 'required|integer|min:1',
            'stock' => 'required|integer|min:0',
            'unit' => 'required|string|max:50',
            'image' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $product->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Product updated successfully',
            'data' => $product->load('category')
        ]);
    }

    public function destroy(Product $product): JsonResponse
    {
        if ($product->transactionItems()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete product with existing transactions'
            ], 422);
        }

        $product->delete();

        return response()->json([
            'success' => true,
            'message' => 'Product deleted successfully'
        ]);
    }

    public function lowStock(): JsonResponse
    {
        $products = Product::query()
            ->where('stock', '<=', \DB::raw('min_stock'))
            ->where('is_active', true)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $products
        ]);
    }
}
