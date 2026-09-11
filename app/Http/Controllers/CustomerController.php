<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\Rule;

class CustomerController extends Controller
{
    public function index(): JsonResponse
    {
        $customers = Customer::query()
            ->when(request('search'), function ($query, $search) {
                return $query->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            })
            ->when(request('status'), function ($query, $status) {
                return $query->where('status', $status);
            })
            ->orderByDesc('total_purchases')
            ->paginate(request('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $customers->items(),
            'pagination' => [
                'total' => $customers->total(),
                'per_page' => $customers->perPage(),
                'current_page' => $customers->currentPage(),
                'last_page' => $customers->lastPage(),
            ]
        ]);
    }

    public function trashed(): JsonResponse
    {
        $customers = Customer::onlyTrashed()->latest('deleted_at')->paginate(request('per_page', 15));
        return response()->json(['success' => true, 'data' => $customers->items(), 'pagination' => ['total' => $customers->total(), 'per_page' => $customers->perPage(), 'current_page' => $customers->currentPage(), 'last_page' => $customers->lastPage()]]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'email' => 'required|email|max:100|unique:customers',
            'phone' => 'required|string|max:20|unique:customers,phone',
            'address' => 'nullable|string',
            'status' => 'in:active,inactive',
        ]);

        $customer = Customer::create(array_merge($validated, [
            'total_purchases' => 0,
            'purchase_count' => 0,
        ]));

        return response()->json([
            'success' => true,
            'message' => 'Pelanggan berhasil ditambahkan',
            'data' => $customer
        ], 201);
    }

    public function show(Customer $customer): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $customer
        ]);
    }

    public function update(Request $request, Customer $customer): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'email' => ['required', 'email', 'max:100', Rule::unique('customers', 'email')->ignore($customer->id)],
            'phone' => ['required', 'string', 'max:20', Rule::unique('customers', 'phone')->ignore($customer->id)],
            'address' => 'nullable|string',
            'status' => 'in:active,inactive',
        ]);

        $customer->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Pelanggan berhasil diperbarui',
            'data' => $customer
        ]);
    }

    public function destroy(Customer $customer): JsonResponse
    {
        $customer->delete();

        return response()->json([
            'success' => true,
            'message' => 'Pelanggan berhasil dihapus'
        ]);
    }

    public function restore(int $customer): JsonResponse
    {
        $deletedCustomer = Customer::onlyTrashed()->findOrFail($customer);
        $deletedCustomer->restore();
        return response()->json(['success' => true, 'message' => 'Pelanggan berhasil dipulihkan', 'data' => $deletedCustomer->fresh()]);
    }

    public function forceDestroy(int $customer): JsonResponse
    {
        $deletedCustomer = Customer::onlyTrashed()->findOrFail($customer);
        if ($deletedCustomer->transactions()->exists()) {
            return response()->json(['success' => false, 'message' => 'Pelanggan tidak dapat dihapus permanen karena masih memiliki transaksi'], 422);
        }
        $deletedCustomer->forceDelete();
        return response()->json(['success' => true, 'message' => 'Pelanggan berhasil dihapus permanen']);
    }
}
