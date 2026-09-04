<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\Discount;
use App\Models\Product;
use App\Models\Transaction;
use App\Models\TransactionItem;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index(): JsonResponse
    {
        $today = Carbon::today();
        $tomorrow = $today->copy()->addDay();
        $sevenDaysAgo = $today->copy()->subDays(6);
        $thirtyDaysAgo = $today->copy()->subDays(29);

        $completedToday = Transaction::query()
            ->where('status', 'completed')
            ->where('transaction_date', '>=', $today)
            ->where('transaction_date', '<', $tomorrow);

        $salesByDay = Transaction::query()
            ->where('status', 'completed')
            ->where('transaction_date', '>=', $sevenDaysAgo)
            ->where('transaction_date', '<', $tomorrow)
            ->selectRaw('DATE(transaction_date) as date, COUNT(*) as transactions, SUM(total_amount) as sales')
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        $topProducts = TransactionItem::query()
            ->join('transactions', 'transactions.id', '=', 'transaction_items.transaction_id')
            ->join('products', 'products.id', '=', 'transaction_items.product_id')
            ->where('transactions.status', 'completed')
            ->where('transactions.transaction_date', '>=', $thirtyDaysAgo)
            ->whereNull('transactions.deleted_at')
            ->select(
                'products.id',
                'products.name',
                'products.product_code',
                DB::raw('SUM(transaction_items.quantity) as quantity_sold'),
                DB::raw('SUM(transaction_items.subtotal) as sales'),
            )
            ->groupBy('products.id', 'products.name', 'products.product_code')
            ->orderByDesc('quantity_sold')
            ->limit(5)
            ->get();

        $recentTransactions = Transaction::query()
            ->with('customer')
            ->where('status', 'completed')
            ->latest('transaction_date')
            ->limit(6)
            ->get(['id', 'invoice_number', 'customer_id', 'transaction_date', 'total_amount', 'payment_method', 'status']);

        $lowStockProducts = Product::query()
            ->where('is_active', true)
            ->whereColumn('stock', '<=', 'min_stock')
            ->orderBy('stock')
            ->limit(6)
            ->get(['id', 'name', 'product_code', 'stock', 'min_stock', 'unit']);

        return response()->json([
            'success' => true,
            'data' => [
                'stats' => [
                    'sales_today' => (float) ($completedToday->sum('total_amount') ?? 0),
                    'transactions_today' => $completedToday->count(),
                    'average_transaction' => (float) ($completedToday->avg('total_amount') ?? 0),
                    'active_products' => Product::where('is_active', true)->count(),
                    'low_stock_count' => Product::where('is_active', true)->whereColumn('stock', '<=', 'min_stock')->count(),
                    'customers_count' => Customer::count(),
                    'active_discounts' => Discount::where('is_active', true)
                        ->where('start_date', '<=', now())
                        ->where(function ($query) {
                            $query->whereNull('end_date')->orWhere('end_date', '>=', now());
                        })->count(),
                ],
                'sales_by_day' => $salesByDay,
                'top_products' => $topProducts,
                'low_stock_products' => $lowStockProducts,
                'recent_transactions' => $recentTransactions,
            ],
        ]);
    }
}
