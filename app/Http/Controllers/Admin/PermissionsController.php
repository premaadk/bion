<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Permission\StorePermissionRequest;
use App\Http\Requests\Permission\UpdatePermissionRequest;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class PermissionsController extends Controller implements HasMiddleware
{
    /** Laravel 11/12 style */
    public static function middleware(): array
    {
        return [
            new Middleware('permission:manage.permissions'),
        ];
    }

    /* ====================== Helpers ====================== */

    private function displayName(string $name): string
    {
        $s = str_replace(['.', '_'], '-', $name);
        return (string) Str::of($s)->headline();
    }

    private function categoryFromName(string $name): string
    {
        $base   = Str::of($name)->replace('_', '-');
        $prefix = Str::before((string) $base, '.');
        $prefix = Str::before($prefix, '-');

        $map = [
            'article'  => 'Article',
            'user'     => 'User',
            'manage'   => 'System',
            'system'   => 'System',
            'media'    => 'Media',
            'category' => 'Category',
        ];
        $key = strtolower($prefix);
        return $map[$key] ?? $this->displayName($key ?: 'General');
    }

    private function serializePermission(Permission $p): array
    {
        return [
            'id'           => $p->id,
            'name'         => $p->name,
            'display_name' => $p->display_name ?? $this->displayName($p->name),
            'description'  => $p->description ?? null,
            'guard_name'   => $p->guard_name,
            'category'     => $p->category ?? $this->categoryFromName($p->name),
            'roles_count'  => method_exists($p, 'roles') ? $p->roles()->count() : null,
            'users_count'  => method_exists($p, 'users') ? $p->users()->count() : null,
            'created_at'   => optional($p->created_at)->toIso8601String(),
            'updated_at'   => optional($p->updated_at)->toIso8601String(),
        ];
    }

    private function serializeRole(Role $r): array
    {
        return [
            'id'           => $r->id,
            'name'         => $r->name,
            'display_name' => $r->getAttribute('display_name') ?? Str::of($r->name)->headline(),
            'guard_name'   => $r->guard_name,
            'permissions'  => $r->permissions()->pluck('name')->values()->all(),
        ];
    }

    /* ====================== CRUD ====================== */

    public function index(): Response
    {
        $items = Permission::query()
            ->where('guard_name', 'web')
            ->orderBy('name')
            ->get()
            ->map(fn (Permission $p) => $this->serializePermission($p));

        return Inertia::render('admin/permissions/index', [
            'permissions' => $items,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/permissions/create');
    }

    public function store(StorePermissionRequest $request)
    {
        $perm = Permission::create([
            'name'         => (string) $request->input('name'),
            'display_name' => $request->input('display_name'),
            'description'  => $request->input('description'),
            'guard_name'   => (string) $request->input('guard_name', 'web'),
            'category'     => $request->input('category'),
        ]);

        app(PermissionRegistrar::class)->forgetCachedPermissions();

        return redirect()->route('admin.permissions.index')
            ->with('success', "Permission \"{$perm->name}\" created");
    }

    public function show(): RedirectResponse
    {
        return redirect()->route('admin.permissions.index');
    }

    public function edit(Permission $permission): Response
    {
        return Inertia::render('admin/permissions/edit', [
            'permission' => [
                'id'           => $permission->id,
                'name'         => $permission->name,
                'display_name' => $permission->display_name ?? $this->displayName($permission->name),
                'description'  => $permission->description,
                'guard_name'   => $permission->guard_name,
                'category'     => $permission->category ?? $this->categoryFromName($permission->name),
            ],
        ]);
    }

    public function update(UpdatePermissionRequest $request, Permission $permission)
    {
        $permission->update([
            'name'         => (string) $request->input('name'),
            'display_name' => $request->input('display_name'),
            'description'  => $request->input('description'),
            'guard_name'   => (string) $request->input('guard_name', 'web'),
            'category'     => $request->input('category'),
        ]);

        app(PermissionRegistrar::class)->forgetCachedPermissions();

        return redirect()->route('admin.permissions.index')
            ->with('success', "Permission updated");
    }

    public function destroy(Permission $permission)
    {
        $name = $permission->name;
        $permission->delete();

        app(PermissionRegistrar::class)->forgetCachedPermissions();

        return redirect()->route('admin.permissions.index')
            ->with('success', "Permission \"{$name}\" deleted");
    }

    /* ========== ASSIGNMENT (MATRIX + USERS) ========== */

    /** GET /admin/permissions/assign-to-roles */
    public function assignToRoles(): Response
    {
        $roles = Role::query()
            ->where('guard_name', 'web')
            ->with('permissions:id,name')
            ->orderBy('name')
            ->get()
            ->map(fn (Role $r) => $this->serializeRole($r));

        $perms = Permission::query()
            ->where('guard_name', 'web')
            ->orderBy('name')
            ->get()
            ->map(fn (Permission $p) => $this->serializePermission($p));

        return Inertia::render('admin/permissions/assign', [
            'view'        => 'roles',
            'roles'       => $roles,
            'permissions' => $perms,
        ]);
    }

    /** GET /admin/permissions/assign-for-user */
    public function assignForUser(): Response
    {
        // roles: jangan pilih kolom "display_name" kalau memang tidak ada di DB.
        $roles = Role::query()
            ->where('guard_name', 'web')
            ->orderBy('name')
            ->get()
            ->map(fn (Role $r) => $this->serializeRole($r));

        $perms = Permission::query()
            ->where('guard_name', 'web')
            ->orderBy('name')
            ->get()
            ->map(fn (Permission $p) => $this->serializePermission($p));

        // users: kolom berbeda-beda antar proyek; cek keberadaan kolom dulu.
        $userColumns = ['id', 'name', 'email'];
        if (Schema::hasColumn('users', 'last_login_at')) {
            $userColumns[] = 'last_login_at';
        }
        if (Schema::hasColumn('users', 'avatar_url')) {
            $userColumns[] = 'avatar_url';
        }
        if (Schema::hasColumn('users', 'department')) {
            $userColumns[] = 'department';
        }

        $users = User::query()
            ->with(['roles:id,name', 'permissions:id,name'])
            ->orderBy('name')
            ->get($userColumns)
            ->map(function (User $u) {
                return [
                    'id'                 => $u->id,
                    'name'               => $u->name,
                    'email'              => $u->email,
                    'avatar_url'         => $u->avatar_url ?? null,
                    'department'         => $u->department ?? null,
                    'roles'              => $u->roles->pluck('name')->values()->all(),
                    'direct_permissions' => $u->permissions->pluck('name')->values()->all(),
                    'last_login_at'      => optional($u->last_login_at)->toIso8601String(),
                ];
            });

        return Inertia::render('admin/permissions/assign', [
            'view'        => 'users',
            'roles'       => $roles,
            'permissions' => $perms,
            'users'       => $users,
        ]);
    }

    /** POST: realtime toggle permission pada ROLE */
    public function toggleRolePermission(Request $request)
    {
        // pakai validasi longgar untuk boolean agar "true/false", "1/0", "on/off" tetap lolos
        $data = $request->validate([
            'role_id'    => ['required', 'exists:roles,id'],
            'permission' => ['required', 'string', 'exists:permissions,name'],
            'allow'      => ['required'],
        ]);

        $allow = filter_var($data['allow'], FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
        if ($allow === null) {
            $allow = in_array($data['allow'], [1, '1', 'on', 'yes', 'true'], true);
        }

        /** @var Role $role */
        $role = Role::query()->where('guard_name', 'web')->findOrFail($data['role_id']);

        // abaikan super admin
        if (strcasecmp($role->name, 'Super Admin') === 0 || strcasecmp($role->name, 'super-admin') === 0) {
            return response()->json(['ok' => true, 'ignored' => true]);
        }

        $perm = Permission::where('name', $data['permission'])
            ->where('guard_name', 'web')->firstOrFail();

        if ($allow) {
            $role->givePermissionTo($perm);
        } else {
            $role->revokePermissionTo($perm);
        }

        // pastikan cache spatie terhapus
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        return response()->json(['ok' => true, 'allow' => $allow]);
    }

    /** POST: realtime toggle direct permission pada USER */
    public function toggleUserPermission(Request $request)
    {
        $data = $request->validate([
            'user_id'    => ['required', 'exists:users,id'],
            'permission' => ['required', 'string', 'exists:permissions,name'],
            'allow'      => ['required'],
        ]);

        $allow = filter_var($data['allow'], FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
        if ($allow === null) {
            $allow = in_array($data['allow'], [1, '1', 'on', 'yes', 'true'], true);
        }

        /** @var User $user */
        $user = User::findOrFail($data['user_id']);
        $perm = Permission::where('name', $data['permission'])
            ->where('guard_name', 'web')->firstOrFail();

        if ($allow) {
            $user->givePermissionTo($perm);
        } else {
            $user->revokePermissionTo($perm);
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();

        return response()->json(['ok' => true, 'allow' => $allow]);
    }
}