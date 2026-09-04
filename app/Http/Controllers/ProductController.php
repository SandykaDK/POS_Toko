<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class ProductController extends Controller
{
    public function index(): JsonResponse
    {
        $products = Product::query()
            ->with('category')
            ->when(request('search'), function ($query, $search) {
                return $query->where('name', 'like', "%{$search}%")
                    ->orWhere('product_code', 'like', "%{$search}%");
            })
            ->when(request('category_id'), function ($query, $categoryId) {
                return $query->where('category_id', $categoryId);
            })
            ->when(request()->filled('active'), function ($query) {
                return $query->where('is_active', request()->boolean('active'));
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

    public function trashed(): JsonResponse
    {
        $products = Product::onlyTrashed()->with('category')->latest('deleted_at')->paginate(request('per_page', 15));
        return response()->json(['success' => true, 'data' => $products->items(), 'pagination' => ['total' => $products->total(), 'per_page' => $products->perPage(), 'current_page' => $products->currentPage(), 'last_page' => $products->lastPage()]]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'category_id' => 'required|exists:categories,id',
            'product_code' => 'required|string|max:50|unique:products',
            'name' => 'required|string|max:100',
            'cost_price' => 'required|numeric|min:0',
            'selling_price' => 'required|numeric|min:0',
            'min_stock' => 'required|integer|min:1',
            'stock' => 'required|integer|min:0',
            'unit' => 'required|string|max:50',
            'description' => 'nullable|string',
            'image' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
            'is_active' => 'boolean',
        ]);

        if ($request->hasFile('image')) {
            $validated['image'] = $request->file('image')->store('products', 'public');
        }

        $product = Product::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Produk berhasil ditambahkan',
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
            'product_code' => "required|string|max:50|unique:products,product_code,{$product->id}",
            'name' => 'required|string|max:100',
            'cost_price' => 'required|numeric|min:0',
            'selling_price' => 'required|numeric|min:0',
            'min_stock' => 'required|integer|min:1',
            'stock' => 'required|integer|min:0',
            'unit' => 'required|string|max:50',
            'description' => 'nullable|string',
            'image' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
            'is_active' => 'boolean',
        ]);

        if ($request->hasFile('image')) {
            if ($product->image) {
                Storage::disk('public')->delete($product->image);
            }
            $validated['image'] = $request->file('image')->store('products', 'public');
        } else {
            unset($validated['image']);
        }

        $product->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Produk berhasil diperbarui',
            'data' => $product->load('category')
        ]);
    }

    public function destroy(Product $product): JsonResponse
    {
        if ($product->transactionItems()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Produk tidak dapat dihapus karena masih memiliki transaksi'
            ], 422);
        }

        $product->delete();

        return response()->json([
            'success' => true,
            'message' => 'Produk berhasil dihapus'
        ]);
    }

    public function lowStock(): JsonResponse
    {
        $products = Product::query()
            ->where('stock', '<=', DB::raw('min_stock'))
            ->where('is_active', true)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $products
        ]);
    }

    public function restore(int $product): JsonResponse
    {
        $deletedProduct = Product::onlyTrashed()->findOrFail($product);
        $deletedProduct->restore();
        return response()->json(['success' => true, 'message' => 'Produk berhasil dipulihkan', 'data' => $deletedProduct->fresh()->load('category')]);
    }

    public function forceDestroy(int $product): JsonResponse
    {
        $deletedProduct = Product::onlyTrashed()->findOrFail($product);
        if ($deletedProduct->transactionItems()->exists()) {
            return response()->json(['success' => false, 'message' => 'Produk tidak dapat dihapus permanen karena masih memiliki transaksi'], 422);
        }
        $deletedProduct->forceDelete();
        return response()->json(['success' => true, 'message' => 'Produk berhasil dihapus permanen']);
    }
}
