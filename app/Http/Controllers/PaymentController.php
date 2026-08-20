<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class PaymentController extends Controller
{
    public function index(): JsonResponse
    {
        $payments = Payment::query()
            ->with('transaction')
            ->when(request('status'), function ($query, $status) {
                return $query->where('status', $status);
            })
            ->when(request('payment_method'), function ($query, $method) {
                return $query->where('payment_method', $method);
            })
            ->when(request('transaction_id'), function ($query, $transactionId) {
                return $query->where('transaction_id', $transactionId);
            })
            ->orderByDesc('payment_date')
            ->paginate(request('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $payments->items(),
            'pagination' => [
                'total' => $payments->total(),
                'per_page' => $payments->perPage(),
                'current_page' => $payments->currentPage(),
                'last_page' => $payments->lastPage(),
            ]
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'transaction_id' => 'required|exists:transactions,id',
            'payment_method' => 'required|string|max:50',
            'amount' => 'required|numeric|min:0',
            'reference_number' => 'nullable|string|max:100',
            'status' => 'in:pending,success,failed',
            'notes' => 'nullable|string',
            'payment_date' => 'required|datetime',
        ]);

        $payment = Payment::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Payment created successfully',
            'data' => $payment->load('transaction')
        ], 201);
    }

    public function show(Payment $payment): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $payment->load('transaction')
        ]);
    }

    public function update(Request $request, Payment $payment): JsonResponse
    {
        $validated = $request->validate([
            'payment_method' => 'required|string|max:50',
            'amount' => 'required|numeric|min:0',
            'reference_number' => 'nullable|string|max:100',
            'status' => 'in:pending,success,failed',
            'notes' => 'nullable|string',
            'payment_date' => 'required|datetime',
        ]);

        $payment->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Payment updated successfully',
            'data' => $payment->load('transaction')
        ]);
    }

    public function destroy(Payment $payment): JsonResponse
    {
        $payment->delete();

        return response()->json([
            'success' => true,
            'message' => 'Payment deleted successfully'
        ]);
    }
}
