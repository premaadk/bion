<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RbacSeeder extends Seeder
{
    public function run(): void
    {
        // 1) Permissions (umum)
        $permNames = [
            'manage.users', 'manage.roles', 'manage.permissions', 'manage.rubriks', 'manage.divisions',
            'article.create', 'article.review', 'article.approve', 'article.publish', 'article.reject',
        ];

        foreach ($permNames as $p) {
            Permission::findOrCreate($p, 'web');
        }

        // 2) Roles
        $roles = [
            'Super Admin',
            'Admin Rubrik',
            'Editor Rubrik',
            'Author',
        ];

        foreach ($roles as $r) {
            Role::findOrCreate($r, 'web');
        }

        // 3) Default mapping role -> permissions
        //   - Super Admin: all permissions
        //   - Admin Rubrik: rubrik mgmt + review/approve/publish/reject
        //   - Editor Rubrik: review + approve
        //   - Author: create
        /** @var Role $super */
        $super = Role::findByName('Super Admin', 'web');
        $super->syncPermissions(Permission::where('guard_name', 'web')->pluck('name')->toArray());

        /** @var Role $adminRubrik */
        $adminRubrik = Role::findByName('Admin Rubrik', 'web');
        $adminRubrik->syncPermissions([
            'manage.rubriks', 'article.review', 'article.approve', 'article.publish', 'article.reject',
        ]);

        /** @var Role $editorRubrik */
        $editorRubrik = Role::findByName('Editor Rubrik', 'web');
        $editorRubrik->syncPermissions([
            'article.review', 'article.approve',
        ]);

        /** @var Role $author */
        $author = Role::findByName('Author', 'web');
        $author->syncPermissions([
            'article.create',
        ]);

        // 4) Default Super Admin user
        $admin = User::query()->firstOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name' => 'Super Admin',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ]
        );
        $admin->syncRoles(['Super Admin']);
        $admin->syncPermissions($super->permissions->pluck('name')->toArray());
    }
}
