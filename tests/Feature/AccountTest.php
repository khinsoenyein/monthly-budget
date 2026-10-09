<?php

namespace Tests\Feature;

use App\Models\Account;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AccountTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_cannot_access_account_routes(): void
    {
        $account = Account::create($this->payload());
        $this->get(route('accounts.index'))->assertRedirect(route('login'));
        $this->post(route('accounts.store'), $this->payload())->assertRedirect(route('login'));
        $this->put(route('accounts.update', $account), $this->payload())->assertRedirect(route('login'));
        $this->delete(route('accounts.destroy', $account))->assertRedirect(route('login'));
    }

    public function test_accounts_can_be_created_listed_updated_and_soft_deleted(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);
        $this->post(route('accounts.store'), [...$this->payload(), 'created_user' => 999])
            ->assertRedirect(route('accounts.index'))->assertSessionHas('status', 'Account created.');
        $account = Account::firstOrFail();
        $this->assertSame($user->id, $account->created_user);
        $this->get(route('accounts.index'))->assertInertia(fn (Assert $page) => $page
            ->component('accounts/index')->has('accounts', 1)->where('accounts.0.code', 'CASH')->where('accounts.0.isactive', true));
        $this->put(route('accounts.update', $account), $this->payload(['name' => 'Bank account', 'type' => 'bank', 'isactive' => false]))
            ->assertRedirect(route('accounts.index'))->assertSessionHas('status', 'Account updated.');
        $this->assertDatabaseHas('accounts', ['id' => $account->id, 'name' => 'Bank account', 'type' => 'bank', 'isactive' => false, 'modified_user' => $user->id]);
        $this->delete(route('accounts.destroy', $account))->assertRedirect(route('accounts.index'))->assertSessionHas('status', 'Account deleted.');
        $this->assertSoftDeleted($account);
        $this->assertTrue($account->fresh()->isdeleted);
        $this->get(route('accounts.index'))->assertInertia(fn (Assert $page) => $page->has('accounts', 0));
        $this->put(route('accounts.update', $account), $this->payload())->assertNotFound();
        $this->delete(route('accounts.destroy', $account))->assertNotFound();
    }

    public function test_validation_rejects_duplicate_codes_and_invalid_fields(): void
    {
        $this->actingAs(User::factory()->create());
        $account = Account::create($this->payload());
        $other = Account::create($this->payload(['code' => 'OTHER']));
        $this->post(route('accounts.store'), $this->payload())->assertSessionHasErrors('code');
        $this->put(route('accounts.update', $other), $this->payload())->assertSessionHasErrors('code');
        $this->post(route('accounts.store'), $this->payload(['code' => '', 'name' => '', 'type' => 'invalid', 'isactive' => 'invalid']))
            ->assertSessionHasErrors(['code', 'name', 'type', 'isactive']);
        $this->put(route('accounts.update', $account), $this->payload(['type' => 'e-wallet', 'remark' => null]))->assertSessionHasNoErrors();
        $this->assertDatabaseHas('accounts', ['id' => $account->id, 'type' => 'e-wallet', 'remark' => null]);
        $account->delete();
        $this->post(route('accounts.store'), $this->payload())->assertSessionHasErrors('code');
        $this->assertDatabaseCount('accounts', 2);
    }

    private function payload(array $overrides = []): array
    {
        return array_replace(['code' => 'CASH', 'name' => 'Cash account', 'type' => 'cash', 'remark' => 'Daily spending', 'isactive' => true], $overrides);
    }

    public function test_sort_order_defaults_to_zero_and_can_be_updated_and_sorted(): void
    {
        $this->actingAs(User::factory()->create());
        $this->post(route('accounts.store'), $this->payload())->assertSessionHasNoErrors();
        $account = Account::firstOrFail();
        $this->assertSame(0, $account->sort_order);
        $this->put(route('accounts.update', $account), $this->payload(['sort_order' => 10]))->assertSessionHasNoErrors();
        $this->assertSame(10, $account->fresh()->sort_order);
        $this->post(route('accounts.store'), $this->payload(['code' => 'BANK', 'sort_order' => 2]))->assertSessionHasNoErrors();
        $this->get(route('accounts.index'))->assertInertia(fn (Assert $page) => $page
            ->where('accounts.0.sort_order', 2)->where('accounts.1.sort_order', 10));
        foreach (['1.5', 'invalid', '', 2147483648, -2147483649] as $value) {
            $this->put(route('accounts.update', $account), $this->payload(['sort_order' => $value]))->assertSessionHasErrors('sort_order');
        }
        $this->assertSame(10, $account->fresh()->sort_order);
    }
}
