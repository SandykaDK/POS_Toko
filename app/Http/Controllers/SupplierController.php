<?php

namespace App\Http\Controllers;

use App\Models\Supplier;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class SupplierController extends Controller
{
    public function index(): JsonResponse
    {
        $suppliers = Supplier::query()
            ->when(request('search'), function ($query, $search) {
                return $query->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            })
            ->when(request('active'), function ($query) {
                return $query->where('is_active', true);
            })
            ->paginate(request('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $suppliers->items(),
            'pagination' => [
                'total' => $suppliers->total(),
                'per_page' => $suppliers->perPage(),
                'current_page' => $suppliers->currentPage(),
                'last_page' => $suppliers->lastPage(),
            ]
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'email' => 'required|email|max:100|unique:suppliers',
            'phone' => 'required|string|max:20',
            'address' => 'required|string',
            'city' => 'required|string|max:50',
            'province' => 'required|string|max:50',
            'postal_code' => 'required|string|max:20',
            'notes' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $supplier = Supplier::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Supplier created successfully',
            'data' => $supplier
        ], 201);
    }

    public function show(Supplier $supplier): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $supplier
        ]);
    }

    public function update(Request $request, Supplier $supplier): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'email' => "required|email|max:100|unique:suppliers,email,{$supplier->id}",
            'phone' => 'required|string|max:20',
            'address' => 'required|string',
            'city' => 'required|string|max:50',
            'province' => 'required|string|max:50',
            'postal_code' => 'required|string|max:20',
            'notes' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $supplier->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Supplier updated successfully',
            'data' => $supplier
        ]);
    }

    public function destroy(Supplier $supplier): JsonResponse
    {
        if ($supplier->inventoryLogs()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete supplier with existing inventory logs'
            ], 422);
        }

        $supplier->delete();

        return response()->json([
            'success' => true,
            'message' => 'Supplier deleted successfully'
        ]);
    }
}
