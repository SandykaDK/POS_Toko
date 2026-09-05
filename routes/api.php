<?php

use App\Http\Controllers\CategoryController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DiscountController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\TransactionController;
use App\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Route;

Route::middleware('web')->group(function () {
    Route::post('auth/login', [AuthController::class, 'login'])->middleware('throttle:5,1');

    Route::get('/health', function () {
        return response()->json([
            'success' => true,
            'message' => 'TokoPOS API is running',
        ]);
    });

    Route::middleware('auth')->group(function () {
        Route::get('auth/me', [AuthController::class, 'me']);
        Route::post('auth/logout', [AuthController::class, 'logout']);

        Route::get('dashboard', [DashboardController::class, 'index']);

        // Custom routes harus SEBELUM resource routes agar di-match terlebih dahulu
        Route::get('products/low-stock', [ProductController::class, 'lowStock']);
        Route::get('transactions/sales-report', [TransactionController::class, 'salesReport']);
        Route::get('transactions/{transaction}/items', [TransactionController::class, 'items']);
        Route::post('discounts/validate', [DiscountController::class, 'validateCode']);

        Route::get('categories/trashed', [CategoryController::class, 'trashed']);
        Route::patch('categories/{category}/restore', [CategoryController::class, 'restore']);
        Route::delete('categories/{category}/force-delete', [CategoryController::class, 'forceDestroy']);

        Route::get('products/trashed', [ProductController::class, 'trashed']);
        Route::patch('products/{product}/restore', [ProductController::class, 'restore']);
        Route::delete('products/{product}/force-delete', [ProductController::class, 'forceDestroy']);

        Route::get('customers/trashed', [CustomerController::class, 'trashed']);
        Route::patch('customers/{customer}/restore', [CustomerController::class, 'restore']);
        Route::delete('customers/{customer}/force-delete', [CustomerController::class, 'forceDestroy']);

        Route::get('discounts/trashed', [DiscountController::class, 'trashed']);
        Route::patch('discounts/{discount}/restore', [DiscountController::class, 'restore']);
        Route::delete('discounts/{discount}/force-delete', [DiscountController::class, 'forceDestroy']);

        // Resource routes
        Route::apiResource('categories', CategoryController::class);
        Route::apiResource('products', ProductController::class);
        Route::apiResource('customers', CustomerController::class);
        Route::apiResource('discounts', DiscountController::class);
        Route::apiResource('transactions', TransactionController::class);
        Route::apiResource('payments', PaymentController::class);
    });
});
