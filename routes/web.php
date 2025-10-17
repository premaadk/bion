<?php

use App\Http\Controllers\Admin\DivisionsController;
use App\Http\Controllers\Admin\PermissionsController;
use App\Http\Controllers\Admin\RolesController;
use App\Http\Controllers\Admin\RubriksController;
use App\Http\Controllers\Admin\UsersController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
});

Route::prefix('admin')->name('admin.')->group(function () {
    // GET: tampilkan form bulk-assign user → role
    Route::get('roles/assign', [RolesController::class, 'assignUsersForm'])
        ->name('roles.assign')
        ->middleware('permission:manage.roles');

    // POST: proses bulk-assign (nama route berbeda agar tidak tabrakan dengan GET)
    Route::post('roles/assign', [RolesController::class, 'assignUsers'])
        ->middleware('permission:manage.roles');

    // Resource (tetap)
    Route::resource('roles', RolesController::class)
        ->middleware('permission:manage.roles');

    // ASSIGNMENT (satu file assign.tsx, dua mode)
    Route::get('/permissions/assign-to-roles', [PermissionsController::class, 'assignToRoles'])->name('permissions.assign.roles');
    Route::get('/permissions/assign-for-user', [PermissionsController::class, 'assignForUser'])->name('permissions.assign.users');

    // toggles (xhr/inertia post)
    Route::post('/permissions/toggle-role-permission', [PermissionsController::class, 'toggleRolePermission'])->name('permissions.assign.toggle.role');
    Route::post('/permissions/toggle-user-permission', [PermissionsController::class, 'toggleUserPermission'])->name('permissions.assign.toggle.user');
    
    // --- Manajemen Permissions ---
    Route::resource('permissions', PermissionsController::class)
        ->middleware('permission:manage.permissions');

    // --- Manajemen Rubriks ---
    Route::resource('rubriks', RubriksController::class)
        ->middleware('permission:manage.rubriks');

    // --- Manajemen Divisions ---
    Route::resource('divisions', DivisionsController::class)
        ->middleware('permission:manage.divisions');

    // --- Manajemen Users ---
    Route::middleware('permission:manage.users')->group(function () {
        // Rute resource standar untuk users
        Route::resource('users', UsersController::class);

        // Rute kustom untuk menugaskan role ke user
        Route::get('users/{user}/assign', [UsersController::class, 'assignForm'])->name('users.assign');
        Route::post('users/{user}/assign', [UsersController::class, 'assign']);

        // Rute kustom untuk menugaskan role secara massal (bulk)
        Route::post('users/bulk-assign-role', [UsersController::class, 'bulkAssignRole'])->name('users.bulk.assign.role');
    });
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
