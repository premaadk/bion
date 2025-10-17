<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BulkAssignRoleTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\RbacSeeder::class);
    }

    public function test_bulk_assign_role_overwrites_existing(): void
    {
        $admin = User::firstWhere('email','admin@example.com');
        $u1 = User::factory()->create();
        $u2 = User::factory()->create();

        $this->actingAs($admin);

        $this->post(route('admin.roles.assign.users'), [
            'user_ids' => [$u1->id, $u2->id],
            'role' => 'Author',
        ])->assertRedirect();

        $this->assertTrue($u1->fresh()->hasRole('Author'));
        $this->assertTrue($u2->fresh()->hasRole('Author'));
    }
}
