<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Rubrik\StoreRubrikRequest;
use App\Http\Requests\Rubrik\UpdateRubrikRequest;
use App\Models\Rubrik;
use Illuminate\Http\RedirectResponse;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Inertia\Inertia;
use Inertia\Response;

class RubriksController extends Controller implements HasMiddleware
{
    /** Laravel 11/12 style middleware */
    public static function middleware(): array
    {
        // Sesuaikan ability/permission yang Anda pakai
        return [
            new Middleware('permission:manage.rubriks'),
        ];
    }

    /* ---------------------- Helpers ---------------------- */

    /** Normalisasi slug berbasis titik: spasi -> ".", non a-z0-9 -> ".", rapikan titik ganda & trim. */
    private function normalizeDotSlug(string $slug): string
    {
        $s = strtolower(trim($slug));
        $s = preg_replace('/\s+/', '.', $s);         // spasi -> titik
        $s = preg_replace('/[^a-z0-9.]+/', '.', $s); // selain a-z0-9/titik -> titik
        $s = preg_replace('/[.]+/', '.', $s);        // titik ganda -> satu titik
        return trim($s, '.');                        // hilangkan titik di awal/akhir
    }

    private function serializeRubrik(Rubrik $r): array
    {
        return [
            'id'          => $r->id,
            'name'        => $r->name,
            'slug'        => $r->slug,
            'description' => $r->description,
            'created_at'  => optional($r->created_at)->toIso8601String(),
            'updated_at'  => optional($r->updated_at)->toIso8601String(),
        ];
    }

    /* ------------------------ CRUD ----------------------- */

    public function index(): Response
    {
        $items = Rubrik::query()
            ->orderBy('name')
            ->get(['id', 'name', 'slug', 'description', 'created_at', 'updated_at'])
            ->map(fn (Rubrik $r) => $this->serializeRubrik($r));

        // Jika tidak ada relasi permission untuk rubrik,
        // kirim 0 agar di UI tidak jadi "—"
        $totals = [
            'rubriks'            => $items->count(),
            'permissions'        => 0, // untuk kompatibilitas jika UI membaca totals.permissions
            'linkedPermissions'  => 0, // kalau UI membaca totals.linkedPermissions
        ];

        return Inertia::render('admin/rubriks/index', [
            'rubriks' => $items,
            'totals'  => $totals,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/rubriks/create');
    }

    public function store(StoreRubrikRequest $request)
    {
        $data = $request->validated();
        // Pertahankan format slug titik (bukan Str::slug)
        $data['slug'] = $this->normalizeDotSlug($data['slug'] ?: $data['name']);
        Rubrik::create($data);

        return redirect()
            ->route('admin.rubriks.index')
            ->with('success', 'Rubrik created');
    }

    public function show(): RedirectResponse
    {
        return redirect()->route('admin.rubriks.index');
    }

    public function edit(Rubrik $rubrik): Response
    {
        return Inertia::render('admin/rubriks/edit', [
            'rubrik' => $this->serializeRubrik($rubrik),
        ]);
    }

    public function update(UpdateRubrikRequest $request, Rubrik $rubrik)
    {
        $data = $request->validated();
        $data['slug'] = $this->normalizeDotSlug($data['slug'] ?: $data['name']);
        $rubrik->update($data);

        return redirect()
            ->route('admin.rubriks.index')
            ->with('success', 'Rubrik updated');
    }

    public function destroy(Rubrik $rubrik)
    {
        $rubrik->delete();

        return redirect()
            ->route('admin.rubriks.index')
            ->with('success', 'Rubrik deleted');
    }
}