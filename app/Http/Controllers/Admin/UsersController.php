<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\User\AssignUserRequest;
use App\Http\Requests\User\BulkAssignRoleRequest;
use App\Http\Requests\User\StoreUserRequest;
use App\Http\Requests\User\UpdateUserRequest;
use App\Models\Division;
use App\Models\Rubrik;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class UsersController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [ new Middleware('can:manage.users') ];
    }

    public function index(Request $request)
    {
        $users = User::query()
            ->with([
                'rubrik:id,name',
                'division:id,name',
                'roles:id,name',
                'permissions:id,name',
            ])
            ->orderBy('name')
            ->get(['id','name','email','rubrik_id','division_id','created_at','updated_at'])
            ->map(fn (User $u) => [
                'id' => $u->id,
                'name' => $u->name,
                'email' => $u->email,
                'rubrik' => $u->rubrik?->name,
                'division' => $u->division?->name,
                'role' => $u->roles->first()?->name,
                'direct_permissions' => $u->permissions->pluck('name'),
                'created_at' => optional($u->created_at)?->toDateTimeString(),
                'updated_at' => optional($u->updated_at)?->toDateTimeString(),
            ]);

        return Inertia::render('admin/users/index', [
            'users'  => $users,
            'roles'  => Role::orderBy('name')->get(['id','name']),
            'totals' => [
                'roles'       => Role::count(),
                'permissions' => Permission::count(),
                'rubriks'     => Rubrik::count(),
                'divisions'   => Division::count(),
            ],
        ]);
    }

    public function create()
    {
        return Inertia::render('admin/users/create', [
            'roles'       => Role::orderBy('name')->get(['id','name']),
            'permissions' => Permission::orderBy('name')->get(['id','name']),
            'rubriks'     => Rubrik::orderBy('name')->get(['id','name']),
            'divisions'   => Division::orderBy('name')->get(['id','name']),
        ]);
    }

    public function store(StoreUserRequest $request)
    {
        $user = User::create([
            'name'        => (string) $request->input('name'),
            'email'       => (string) $request->input('email'),
            'password'    => Hash::make((string) $request->input('password')),
            'rubrik_id'   => $request->input('rubrik_id'),
            'division_id' => $request->input('division_id'),
        ]);

        // default role = Author jika kosong
        $role = trim((string) $request->input('role', ''));
        $role = $role === '' ? 'Author' : $role;
        $user->syncRoles([$role]);

        $user->syncPermissions($request->input('direct_permissions', []));

        return to_route('admin.users.index')->with('success', 'User created.');
    }

    public function show(): RedirectResponse
    {
        return redirect()->route('admin.users.index');
    }

    public function edit(User $user)
    {
        return Inertia::render('admin/users/edit', [
            'user'        => $user->only('id','name','email','rubrik_id','division_id'),
            'currentRole' => $user->roles()->first()?->name,
            'directPermissions' => $user->getPermissionNames()->values(),
            'roles'       => Role::orderBy('name')->get(['id','name']),
            'permissions' => Permission::orderBy('name')->get(['id','name']),
            'rubriks'     => Rubrik::orderBy('name')->get(['id','name']),
            'divisions'   => Division::orderBy('name')->get(['id','name']),
        ]);
    }

    public function update(UpdateUserRequest $request, User $user)
    {
        $payload = [
            'name'        => (string) $request->input('name'),
            'email'       => (string) $request->input('email'),
            'rubrik_id'   => $request->input('rubrik_id'),
            'division_id' => $request->input('division_id'),
        ];
        if ($request->filled('password')) {
            $payload['password'] = Hash::make((string) $request->input('password'));
        }

        $user->update($payload);

        if ($request->filled('role')) {
            $user->syncRoles([(string) $request->input('role')]);
        }
        $user->syncPermissions($request->input('direct_permissions', []));

        return to_route('admin.users.index')->with('success', 'User updated.');
    }

    public function destroy(User $user)
    {
        if ($user->hasRole('Super Admin')) {
            return back()->with('error','Cannot delete Super Admin user');
        }
        $user->delete();
        return to_route('admin.users.index')->with('success','User deleted');
    }

    public function assignForm(User $user)
    {
        return Inertia::render('admin/users/assign', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'rubrik_id' => $user->rubrik_id,
                'division_id' => $user->division_id,
                'role' => $user->roles()->first()?->name,
                'direct_permissions' => $user->permissions()->pluck('name'),
            ],
            'roles' => Role::orderBy('name')->get(['id','name']),
            'permissions' => Permission::orderBy('name')->get(['id','name']),
            'rubriks' => Rubrik::orderBy('name')->get(['id','name']),
            'divisions' => Division::orderBy('name')->get(['id','name']),
            'totals' => [
                'roles' => Role::count(),
                'permissions' => Permission::count(),
            ],
        ]);
    }

    public function assign(AssignUserRequest $request, User $user): RedirectResponse
    {
        $user->syncRoles([(string) $request->input('role')]);
        $user->rubrik_id   = $request->input('rubrik_id');
        $user->division_id = $request->input('division_id');
        $user->save();
        $user->syncPermissions($request->input('direct_permissions', []));

        return to_route('admin.users.index')->with('success', 'User assigned.');
    }

    public function bulkAssignRole(BulkAssignRoleRequest $request): RedirectResponse
    {
        $roleName = (string) $request->input('role');
        $ids = $request->input('user_ids', []);
        User::whereIn('id', $ids)->get()->each(fn (User $u) => $u->syncRoles([$roleName]));
        return to_route('admin.users.index')->with('success', 'Roles updated in bulk.');
    }
}