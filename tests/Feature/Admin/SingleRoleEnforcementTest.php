<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Spatie\Permission\Models\Role;

class SingleRoleEnforcementTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\RbacSeeder::class);
    }

    public function test_user_has_only_one_role_after_assign(): void
    {
        $admin = User::firstWhere('email','admin@example.com');
        $user = User::factory()->create();

        $this->actingAs($admin);

        $this->post(route('admin.users.assign', $user), [
            'role' => 'Author',
            'rubrik_id' => null,
            'division_id' => null,
            'direct_permissions' => [],
        ])->assertRedirect();

        $this->assertTrue($user->fresh()->hasRole('Author'));

        $this->post(route('admin.users.assign', $user), [
            'role' => 'Editor Rubrik',
            'rubrik_id' => null, // invalid: must be required
            'division_id' => null,
            'direct_permissions' => [],
        ])->assertSessionHasErrors('rubrik_id');

        // Assign properly with rubrik
        // For quick test, create a rubrik:
        $rubrikId = \App\Models\Rubrik::create(['name'=>'Tech','slug'=>'tech'])->id;

        $this->post(route('admin.users.assign', $user), [
            'role' => 'Editor Rubrik',
            'rubrik_id' => $rubrikId,
            'division_id' => null,
            'direct_permissions' => [],
        ])->assertRedirect();

        $u = $user->fresh();
        $this->assertTrue($u->hasRole('Editor Rubrik'));
        $this->assertEquals($rubrikId, $u->rubrik_id);

        // Reassign to Super Admin should nullify rubrik
        $this->post(route('admin.users.assign', $user), [
            'role' => 'Super Admin',
            'rubrik_id' => $rubrikId, // should be ignored & invalid
            'division_id' => null,
            'direct_permissions' => [],
        ])->assertSessionHasErrors('rubrik_id');
    }
}
