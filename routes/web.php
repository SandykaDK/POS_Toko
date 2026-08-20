<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('app');
});

// Fallback route untuk SPA, tapi exclude /api/ paths
Route::get('/{any?}', function () {
    return view('app');
})->where('any', '^(?!api/).*');
