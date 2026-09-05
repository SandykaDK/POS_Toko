<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_login_and_access_protected_api(): void
    {
        $user = User::factory()->create(['password' => 'password123']);

        $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'password123',
        ])->assertOk()->assertJsonPath('user.id', $user->id);

        $this->getJson('/api/auth/me')->assertOk()->assertJsonPath('user.id', $user->id);
    }

    public function test_invalid_login_is_rejected(): void
    {
        $user = User::factory()->create(['password' => 'password123']);

        $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'wrong-password',
        ])->assertStatus(422);
    }

    public function test_protected_api_requires_login(): void
    {
        $this->getJson('/api/products')->assertUnauthorized();
    }

    public function test_user_can_logout(): void
    {
        $this->actingAs(User::factory()->create());

        $this->postJson('/api/auth/logout')
            ->assertOk()
            ->assertJsonStructure(['csrf_token']);
        $this->getJson('/api/auth/me')->assertUnauthorized();
    }
}
