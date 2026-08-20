<?php

use App\Http\Controllers\CategoryController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\DiscountController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\SupplierController;
use App\Http\Controllers\TransactionController;
use Illuminate\Support\Facades\Route;

Route::get('/health', function () {
    return response()->json([
        'success' => true,
        'message' => 'TokoPOS API is running',
    ]);
});

// Custom routes harus SEBELUM resource routes agar di-match terlebih dahulu
Route::get('products/low-stock', [ProductController::class, 'lowStock']);
Route::get('transactions/sales-report', [TransactionController::class, 'salesReport']);
Route::get('transactions/{transaction}/items', [TransactionController::class, 'items']);
Route::post('discounts/validate', [DiscountController::class, 'validateCode']);
Route::get('inventory/report', [InventoryController::class, 'inventoryReport']);

// Resource routes
Route::apiResource('categories', CategoryController::class);
Route::apiResource('products', ProductController::class);
Route::apiResource('customers', CustomerController::class);
Route::apiResource('suppliers', SupplierController::class);
Route::apiResource('discounts', DiscountController::class);
Route::apiResource('inventory', InventoryController::class);
Route::apiResource('transactions', TransactionController::class);
Route::apiResource('payments', PaymentController::class);
