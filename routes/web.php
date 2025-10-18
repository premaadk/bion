<?php

use App\Http\Controllers\Admin\DivisionsController;
use App\Http\Controllers\Admin\PermissionsController;
use App\Http\Controllers\Admin\RolesController;
use App\Http\Controllers\Admin\RubriksController;
use App\Http\Controllers\Admin\UsersController;
use App\Http\Controllers\Admin\ArticleApprovalController;
use App\Http\Controllers\AuthorArticlesController;
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

Route::middleware(['auth'])->prefix('admin')->name('admin.')->group(function () {
    // submit (Author)
    Route::get('articles/manage', [ArticleApprovalController::class, 'index'])->name('articles.manage.index');
    Route::get('articles/manage/{article}', [ArticleApprovalController::class, 'show'])->name('articles.manage.show');
    
    // === Management Article (Editor/Admin/Super Admin) ===
    Route::post('articles/{article}/submit', [AuthorArticlesController::class, 'submit'])->name('articles.submit');
    Route::put('articles/{article}/content', [ArticleApprovalController::class, 'updateContent']);
    
    // Editor actions
    Route::post('articles/{article}/review-editor', [ArticleApprovalController::class, 'startEditorReview'])->name('articles.review.editor');
    Route::post('articles/{article}/request-revision', [ArticleApprovalController::class, 'requestRevision'])->name('articles.request.revision');
    Route::post('articles/{article}/approve', [ArticleApprovalController::class, 'approve'])->name('articles.approve');
    
    // Admin actions
    Route::post('articles/{article}/review-admin', [ArticleApprovalController::class, 'startAdminReview'])->name('articles.review.admin');
    Route::post('articles/{article}/reject', [ArticleApprovalController::class, 'reject'])->name('articles.reject');
    Route::post('articles/{article}/publish', [ArticleApprovalController::class, 'publish'])->name('articles.publish');
    
});

Route::middleware(['auth', 'verified'])->group(function () {
    // === My Article (Author) ===
    Route::get('/articles/{rubrik}/{slug}', [AuthorArticlesController::class, 'published'])->name('articles.published');
    Route::post('articles/{article}/cover', [AuthorArticlesController::class, 'updateCover'])->name('articles.cover');
    Route::post('articles/{article}/revised', [AuthorArticlesController::class, 'markRevised'])->name('articles.revised');
    Route::resource('articles', AuthorArticlesController::class);
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
