<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Role\StoreRoleRequest;
use App\Http\Requests\Role\UpdateRoleRequest;
use App\Models\User;
use App\Models\Rubrik;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RolesController extends Controller implements HasMiddleware
{
    /**
     * Laravel 11/12 style: deklarasi middleware pada controller
     * Gunakan 'permission:manage.roles' (spatie) atau 'can:manage.roles' (Gate).
     */
    public static function middleware(): array
    {
        return [
            new Middleware('permission:manage.roles'),
            // atau:
            // new Middleware('can:manage.roles'),
        ];
    }

    /**
     * Helper: role ini butuh rubrik?
     * - Role bawaan: Admin Rubrik / Editor Rubrik
     * - Juga role custom yang namanya mengandung 'rubrik' (case-insensitive)
     */
    protected function roleNeedsRubrik(Role $role): bool
    {
        if (in_array($role->name, ['Admin Rubrik', 'Editor Rubrik'], true)) {
            return true;
        }
        return Str::contains(Str::lower($role->name), 'rubrik');
    }

    /**
     * LIST ROLES (dipakai halaman /admin/roles)
     */
    public function index(): Response
    {
        $roles = Role::query()
            ->where('guard_name', 'web')
            ->with('permissions:id,name')
            ->withCount('users')
            ->orderBy('name')
            ->get()
            ->map(function (Role $r) {
                return [
                    'id'           => $r->id,
                    'name'         => $r->name,
                    // kolom ini opsional di DB; bila tidak ada akan bernilai null
                    'display_name' => $r->getAttribute('display_name'),
                    'description'  => $r->getAttribute('description'),
                    'guard_name'   => $r->guard_name,
                    'permissions'  => $r->permissions->pluck('name')->values()->all(),
                    'userCount'    => $r->users_count,
                    'created_at'   => optional($r->created_at)->toIso8601String(),
                    'updated_at'   => optional($r->updated_at)->toIso8601String(),
                    'canEdit'      => true,
                    // lindungi Super Admin dari delete (atau pakai Policy bila ada)
                    'canDelete'    => $r->name !== 'Super Admin',
                ];
            });

        return Inertia::render('admin/roles/index', [
            'roles'  => $roles,
            'totals' => [
                'users'       => User::count(),
                'permissions' => Permission::where('guard_name', 'web')->count(),
            ],
        ]);
    }

    public function create(): Response
    {
        $permissions = Permission::query()
            ->where('guard_name', 'web')
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn (Permission $p) => ['id' => $p->id, 'name' => $p->name]);

        $guards = collect(config('auth.guards'))->keys()->values();

        return Inertia::render('admin/roles/create', [
            'permissions' => $permissions,
            'guards'      => $guards,
        ]);
    }

    public function store(StoreRoleRequest $request): RedirectResponse
    {
        $name       = (string) $request->input('name');
        $display    = $request->input('display_name');
        $desc       = $request->input('description');
        $guard      = (string) $request->input('guard_name', 'web');
        $permNames  = (array)  $request->input('permissions', []);

        $role = Role::create([
            'name'         => $name,
            'display_name' => $display,   // aman bila kolom tersedia
            'description'  => $desc,      // aman bila kolom tersedia
            'guard_name'   => $guard,
        ]);

        $role->syncPermissions($permNames);

        return redirect()->route('admin.roles.index')->with('success', 'Role created.');
    }

    public function show(): RedirectResponse
    {
        return redirect()->route('admin.roles.index');
    }

    public function edit(Role $role): Response
    {
        abort_if($role->guard_name !== 'web', 404);

        $permissions = Permission::query()
            ->where('guard_name', 'web')
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn (Permission $p) => ['id' => $p->id, 'name' => $p->name]);

        $roleData = [
            'id'           => $role->id,
            'name'         => $role->name,
            'display_name' => $role->getAttribute('display_name'),
            'description'  => $role->getAttribute('description'),
            'guard_name'   => $role->guard_name,
            'permissions'  => $role->permissions()->pluck('name')->values(),
        ];

        $guards = collect(config('auth.guards'))->keys()->values();

        return Inertia::render('admin/roles/edit', [
            'role'        => $roleData,
            'permissions' => $permissions,
            'guards'      => $guards,
        ]);
    }

    public function update(UpdateRoleRequest $request, Role $role): RedirectResponse
    {
        abort_if($role->guard_name !== 'web', 404);

        $role->update([
            'name'         => (string) $request->input('name'),
            'display_name' => $request->input('display_name'),
            'description'  => $request->input('description'),
            'guard_name'   => (string) $request->input('guard_name', 'web'),
        ]);

        $permNames = (array) $request->input('permissions', []);
        $role->syncPermissions($permNames);

        return redirect()->route('admin.roles.index')->with('success', 'Role updated.');
    }

    public function destroy(Role $role): RedirectResponse
    {
        abort_if($role->guard_name !== 'web', 404);

        if ($role->name === 'Super Admin') {
            return back()->with('error', 'Super Admin tidak boleh dihapus.');
        }

        $role->delete();

        return redirect()->route('admin.roles.index')->with('success', 'Role deleted.');
    }

    /**
     * GET: Form bulk-assign role → users  (/admin/roles/assign)
     * Mengirim: roles (+requires_rubrik), users, selectedRoleId, rubriks
     */
    public function assignUsersForm(Request $request): Response
    {
        $selectedRoleId = $request->input('role_id'); // jangan paksa integer agar aman untuk UUID

        $roles = Role::query()
            ->where('guard_name', 'web')
            ->orderBy('name')
            // pilih kolom yang pasti ada
            ->get(['id', 'name', 'guard_name'])
            ->map(function (Role $r) {
                return [
                    'id'               => $r->id,
                    'name'             => $r->name,
                    'display_name'     => Str::of($r->name)->headline(),
                    'guard_name'       => $r->guard_name,
                    'requires_rubrik'  => $this->roleNeedsRubrik($r),
                ];
            });

        $users = User::query()
            ->with(['roles:id,name'])
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'rubrik_id'])
            ->map(fn (User $u) => [
                'id'          => $u->id,
                'name'        => $u->name,
                'email'       => $u->email,
                'currentRole' => optional($u->roles->first())->name,
                'rubrik_id'   => $u->rubrik_id,
            ]);

        $rubriks = Rubrik::query()
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn (Rubrik $r) => ['id' => $r->id, 'name' => $r->name]);

        return Inertia::render('admin/roles/assign', [
            'roles'          => $roles,
            'users'          => $users,
            'selectedRoleId' => $selectedRoleId,
            'rubriks'        => $rubriks,
        ]);
    }

    /**
     * POST: Proses bulk-assign.
     * - Enforce single-role (syncRoles([$role]))
     * - Role yang butuh rubrik → validasi rubrik_id dan pastikan user punya rubrik.
     * - Bila ada user tanpa rubrik & dikirim rubrik_id, akan diisi otomatis.
     */
    public function assignUsers(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'role_id'     => ['required', 'exists:roles,id'],
            'user_ids'    => ['required', 'array', 'min:1'],
            'user_ids.*'  => ['exists:users,id'],
            // 'rubrik_id' divalidasi dinamis di bawah
        ]);

        /** @var Role $role */
        $role = Role::query()
            ->where('guard_name', 'web')
            ->findOrFail($validated['role_id']);

        $needsRubrik = $this->roleNeedsRubrik($role);

        if ($needsRubrik) {
            $request->validate([
                'rubrik_id' => ['required', 'exists:rubriks,id'],
            ]);
        }

        $userIds  = (array) $validated['user_ids'];
        $rubrikId = $needsRubrik ? $request->input('rubrik_id') : null;

        // Isi rubrik_id untuk user yang masih null (opsional tapi membantu)
        if ($needsRubrik && $rubrikId) {
            User::query()
                ->whereIn('id', $userIds)
                ->whereNull('rubrik_id')
                ->update(['rubrik_id' => $rubrikId]);
        }

        // Pastikan semua user yang dituju sudah punya rubrik
        if ($needsRubrik) {
            $missing = User::query()
                ->whereIn('id', $userIds)
                ->whereNull('rubrik_id')
                ->pluck('email')
                ->all();

            if (!empty($missing)) {
                return back()
                    ->withErrors([
                        'user_ids' => 'Role "' . $role->name . '" memerlukan rubrik. User tanpa rubrik: ' . implode(', ', $missing),
                    ])
                    ->withInput();
            }
        }

        // Assign single-role
        User::query()
            ->whereIn('id', $userIds)
            ->get()
            ->each(function (User $user) use ($role) {
                $user->syncRoles([$role]);
            });

        return redirect()
            ->route('admin.roles.assign')
            ->with('success', 'Role "' . $role->name . '" berhasil di-assign ke ' . count($userIds) . ' user.');
    }
}