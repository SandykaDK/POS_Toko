<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class CategoryController extends Controller
{
    public function index(): JsonResponse
    {
        $categories = Category::query()
            ->withCount('products')
            ->when(request('search'), function ($query, $search) {
                return $query->where('name', 'like', "%{$search}%");
            })
                ->when(request()->filled('active'), function ($query) {
                    return $query->where('is_active', request()->boolean('active'));
            })
            ->paginate(request('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $categories->items(),
            'pagination' => [
                'total' => $categories->total(),
                'per_page' => $categories->perPage(),
                'current_page' => $categories->currentPage(),
                'last_page' => $categories->lastPage(),
            ]
        ]);
    }

    public function trashed(): JsonResponse
    {
        $categories = Category::onlyTrashed()
            ->latest('deleted_at')
            ->paginate(request('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $categories->items(),
            'pagination' => [
                'total' => $categories->total(),
                'per_page' => $categories->perPage(),
                'current_page' => $categories->currentPage(),
                'last_page' => $categories->lastPage(),
            ]
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'category_code' => ['required', 'string', 'size:3', 'regex:/^[A-Z]{3}$/', 'unique:categories,category_code'],
            'slug' => 'required|string|max:100|unique:categories',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $category = Category::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Kategori berhasil ditambahkan',
            'data' => $category
        ], 201);
    }

    public function show(Category $category): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $category->load('products')
        ]);
    }

    public function update(Request $request, Category $category): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'category_code' => ['required', 'string', 'size:3', 'regex:/^[A-Z]{3}$/', "unique:categories,category_code,{$category->id}"],
            'slug' => "required|string|max:100|unique:categories,slug,{$category->id}",
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $category->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Kategori berhasil diperbarui',
            'data' => $category
        ]);
    }

    public function destroy(Category $category): JsonResponse
    {
        if ($category->products()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Kategori tidak dapat dihapus karena masih memiliki produk'
            ], 422);
        }

        $category->delete();

        return response()->json([
            'success' => true,
            'message' => 'Kategori berhasil dihapus'
        ]);
    }

    public function restore(int $category): JsonResponse
    {
        $deletedCategory = Category::onlyTrashed()->findOrFail($category);
        $deletedCategory->restore();

        return response()->json([
            'success' => true,
            'message' => 'Kategori berhasil dipulihkan',
            'data' => $deletedCategory->fresh(),
        ]);
    }

    public function forceDestroy(int $category): JsonResponse
    {
        $deletedCategory = Category::onlyTrashed()->findOrFail($category);

        if ($deletedCategory->products()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Kategori tidak dapat dihapus permanen karena masih memiliki produk'
            ], 422);
        }

        $deletedCategory->forceDelete();

        return response()->json([
            'success' => true,
            'message' => 'Kategori berhasil dihapus permanen'
        ]);
    }
}
