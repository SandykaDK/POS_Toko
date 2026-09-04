<?php

namespace App\Http\Controllers;

use App\Models\Discount;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class DiscountController extends Controller
{
    public function index(): JsonResponse
    {
        $discounts = Discount::query()
            ->when(request('search'), function ($query, $search) {
                return $query->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%");
            })
            ->when(request()->filled('active'), function ($query) {
                return $query->where('is_active', true)
                    ->where('start_date', '<=', now())
                    ->where(function ($q) {
                        $q->whereNull('end_date')
                            ->orWhere('end_date', '>=', now());
                    });
            })
            ->paginate(request('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $discounts->items(),
            'pagination' => [
                'total' => $discounts->total(),
                'per_page' => $discounts->perPage(),
                'current_page' => $discounts->currentPage(),
                'last_page' => $discounts->lastPage(),
            ]
        ]);
    }

    public function trashed(): JsonResponse
    {
        $discounts = Discount::onlyTrashed()->latest('deleted_at')->paginate(request('per_page', 15));
        return response()->json(['success' => true, 'data' => $discounts->items(), 'pagination' => ['total' => $discounts->total(), 'per_page' => $discounts->perPage(), 'current_page' => $discounts->currentPage(), 'last_page' => $discounts->lastPage()]]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'code' => 'required|string|max:50|unique:discounts',
            'description' => 'nullable|string',
            'type' => 'required|in:percentage,fixed',
            'value' => 'required|numeric|min:0',
            'max_discount' => 'nullable|numeric|min:0',
            'min_purchase' => 'required|numeric|min:0',
            'max_usage' => 'nullable|integer|min:1',
            'start_date' => 'required|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'is_active' => 'boolean',
        ]);

        $discount = Discount::create(array_merge($validated, [
            'usage_count' => 0,
        ]));

        return response()->json([
            'success' => true,
            'message' => 'Diskon berhasil ditambahkan',
            'data' => $discount
        ], 201);
    }

    public function show(Discount $discount): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $discount
        ]);
    }

    public function update(Request $request, Discount $discount): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'code' => "required|string|max:50|unique:discounts,code,{$discount->id}",
            'description' => 'nullable|string',
            'type' => 'required|in:percentage,fixed',
            'value' => 'required|numeric|min:0',
            'max_discount' => 'nullable|numeric|min:0',
            'min_purchase' => 'required|numeric|min:0',
            'max_usage' => 'nullable|integer|min:1',
            'start_date' => 'required|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'is_active' => 'boolean',
        ]);

        $discount->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Diskon berhasil diperbarui',
            'data' => $discount
        ]);
    }

    public function destroy(Discount $discount): JsonResponse
    {
        $discount->delete();

        return response()->json([
            'success' => true,
            'message' => 'Diskon berhasil dihapus'
        ]);
    }

    public function validateCode(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => 'required|string',
            'purchase_amount' => 'required|numeric|min:0',
        ]);

        $discount = Discount::where('code', $validated['code'])->first();

        if (!$discount) {
            return response()->json([
                'success' => false,
                'message' => 'Kode diskon tidak ditemukan'
            ], 404);
        }

        if (!$discount->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Kode diskon sedang tidak aktif'
            ], 422);
        }

        if ($discount->start_date > now()) {
            return response()->json([
                'success' => false,
                'message' => 'Kode diskon belum berlaku'
            ], 422);
        }

        if ($discount->end_date && $discount->end_date < now()) {
            return response()->json([
                'success' => false,
                'message' => 'Kode diskon sudah kedaluwarsa'
            ], 422);
        }

        if ($discount->max_usage && $discount->usage_count >= $discount->max_usage) {
            return response()->json([
                'success' => false,
                'message' => 'Batas penggunaan kode diskon sudah tercapai'
            ], 422);
        }

        if ($validated['purchase_amount'] < $discount->min_purchase) {
            return response()->json([
                'success' => false,
                'message' => "Minimal pembelian adalah {$discount->min_purchase}"
            ], 422);
        }

        $discount_amount = 0;
        if ($discount->type === 'percentage') {
            $discount_amount = ($validated['purchase_amount'] * $discount->value) / 100;
            if ($discount->max_discount) {
                $discount_amount = min($discount_amount, $discount->max_discount);
            }
        } else {
            $discount_amount = $discount->value;
        }

        $final_amount = $validated['purchase_amount'] - $discount_amount;

        return response()->json([
            'success' => true,
            'data' => [
                'discount_amount' => $discount_amount,
                'final_amount' => $final_amount
            ]
        ]);
    }

    public function restore(int $discount): JsonResponse
    {
        $deletedDiscount = Discount::onlyTrashed()->findOrFail($discount);
        $deletedDiscount->restore();
        return response()->json(['success' => true, 'message' => 'Diskon berhasil dipulihkan', 'data' => $deletedDiscount->fresh()]);
    }

    public function forceDestroy(int $discount): JsonResponse
    {
        $deletedDiscount = Discount::onlyTrashed()->findOrFail($discount);
        $deletedDiscount->forceDelete();
        return response()->json(['success' => true, 'message' => 'Diskon berhasil dihapus permanen']);
    }
}
