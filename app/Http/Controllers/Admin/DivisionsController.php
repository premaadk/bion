<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Division\StoreDivisionRequest;
use App\Http\Requests\Division\UpdateDivisionRequest;
use App\Models\Division;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Inertia\Inertia;

class DivisionsController extends Controller implements HasMiddleware
{
    /** Laravel 11/12 way */
    public static function middleware(): array
    {
        return [
            new Middleware('can:manage.divisions'),
        ];
    }

    /* ------------ Helpers ------------ */

    /**
     * Slug versi "dot": spasi -> ".", non a-z0-9 -> ".", rapikan titik ganda & tepi.
     */
    private function slugifyDot(string $s): string
    {
        $slug = strtolower(trim($s));
        $slug = preg_replace('/\s+/', '.', $slug);        // spasi -> "."
        $slug = preg_replace('/[^a-z0-9.]+/', '.', $slug); // selain a-z0-9 atau "." -> "."
        $slug = preg_replace('/\.+/', '.', $slug);         // rapikan .. menjadi .
        return trim($slug, '.');                           // buang titik di awal/akhir
    }

    /* ------------ Pages ------------ */

    public function index()
    {
        // kirim created_at & updated_at agar kolom "Created" terisi
        $divisions = Division::query()
            ->orderBy('name')
            ->get(['id', 'name', 'slug', 'description', 'created_at', 'updated_at']);

        return Inertia::render('admin/divisions/index', [
            'divisions' => $divisions,
        ]);
    }

    public function create()
    {
        return Inertia::render('admin/divisions/create');
    }

    public function store(StoreDivisionRequest $request)
    {
        $data = $request->validated();

        // gunakan slug dot; jika input slug kosong, ambil dari name
        $data['slug'] = $this->slugifyDot($data['slug'] ?? ($data['name'] ?? ''));

        Division::create($data);

        return redirect()
            ->route('admin.divisions.index')
            ->with('success', 'Division created');
    }
    
    public function show(): RedirectResponse
    {
        return redirect()->route('admin.rubriks.index');
    }

    public function edit(Division $division)
    {
        // tidak wajib, tapi aman kirim timestamps bila suatu saat dipakai
        return Inertia::render('admin/divisions/edit', [
            'division' => $division->only(['id', 'name', 'slug', 'description', 'created_at', 'updated_at']),
        ]);
    }

    public function update(UpdateDivisionRequest $request, Division $division)
    {
        $data = $request->validated();
        $data['slug'] = $this->slugifyDot($data['slug'] ?? ($data['name'] ?? ''));

        $division->update($data);

        return redirect()
            ->route('admin.divisions.index')
            ->with('success', 'Division updated');
    }

    public function destroy(Division $division)
    {
        $division->delete();

        return redirect()
            ->route('admin.divisions.index')
            ->with('success', 'Division deleted');
    }
}