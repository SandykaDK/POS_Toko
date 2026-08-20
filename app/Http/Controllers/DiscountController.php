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
            ->when(request('active'), function ($query) {
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
            'start_date' => 'required|datetime',
            'end_date' => 'nullable|datetime|after_or_equal:start_date',
            'is_active' => 'boolean',
        ]);

        $discount = Discount::create(array_merge($validated, [
            'usage_count' => 0,
        ]));

        return response()->json([
            'success' => true,
            'message' => 'Discount created successfully',
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
            'start_date' => 'required|datetime',
            'end_date' => 'nullable|datetime|after_or_equal:start_date',
            'is_active' => 'boolean',
        ]);

        $discount->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Discount updated successfully',
            'data' => $discount
        ]);
    }

    public function destroy(Discount $discount): JsonResponse
    {
        $discount->delete();

        return response()->json([
            'success' => true,
            'message' => 'Discount deleted successfully'
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
                'message' => 'Discount code not found'
            ], 404);
        }

        if (!$discount->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Discount code is inactive'
            ], 422);
        }

        if ($discount->start_date > now()) {
            return response()->json([
                'success' => false,
                'message' => 'Discount code is not yet valid'
            ], 422);
        }

        if ($discount->end_date && $discount->end_date < now()) {
            return response()->json([
                'success' => false,
                'message' => 'Discount code has expired'
            ], 422);
        }

        if ($discount->max_usage && $discount->usage_count >= $discount->max_usage) {
            return response()->json([
                'success' => false,
                'message' => 'Discount code usage limit reached'
            ], 422);
        }

        if ($validated['purchase_amount'] < $discount->min_purchase) {
            return response()->json([
                'success' => false,
                'message' => "Minimum purchase amount is {$discount->min_purchase}"
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
}
