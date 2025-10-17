<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Spatie\Permission\Models\Permission;

class DirectPermissionsSyncTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\RbacSeeder::class);
    }

    public function test_assign_direct_permissions_syncs(): void
    {
        $admin = User::firstWhere('email','admin@example.com');
        $user = User::factory()->create();
        $p1 = Permission::firstOrCreate(['name'=>'article.create']);
        $p2 = Permission::firstOrCreate(['name'=>'article.review']);

        $this->actingAs($admin);

        $this->post(route('admin.users.assign', $user), [
            'role' => 'Author',
            'rubrik_id' => null,
            'division_id' => null,
            'direct_permissions' => [$p1->name, $p2->name],
        ])->assertRedirect();

        $u = $user->fresh();
        $this->assertTrue($u->hasPermissionTo($p1->name));
        $this->assertTrue($u->hasPermissionTo($p2->name));

        // Remove one
        $this->post(route('admin.users.assign', $user), [
            'role' => 'Author',
            'rubrik_id' => null,
            'division_id' => null,
            'direct_permissions' => [$p2->name],
        ])->assertRedirect();

        $u = $user->fresh();
        $this->assertFalse($u->hasPermissionTo($p1->name));
        $this->assertTrue($u->hasPermissionTo($p2->name));
    }
}
