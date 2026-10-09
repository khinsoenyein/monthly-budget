<?php

namespace Tests\Feature;

use App\Models\Budget;
use App\Models\BudgetItem;
use App\Models\Category;
use App\Models\Currency;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class BudgetTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_cannot_access_budget_routes(): void
    {
        $data = $this->payload();
        $budget = Budget::create($data);
        $this->get(route('budgets.index'))->assertRedirect(route('login'));
        $this->post(route('budgets.store'), $data)->assertRedirect(route('login'));
        $this->put(route('budgets.update', $budget), $data)->assertRedirect(route('login'));
        $this->delete(route('budgets.destroy', $budget))->assertRedirect(route('login'));
    }

    public function test_budgets_can_be_created_listed_updated_and_soft_deleted(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);
        $data = $this->payload();
        $this->post(route('budgets.store'), [...$data, 'created_user' => 999])->assertRedirect(route('budgets.index'))
            ->assertSessionHas('status', 'Budget created.');
        $budget = Budget::firstOrFail();
        $this->assertSame($user->id, $budget->created_user);
        $this->assertSame('1000.50', $budget->opening_balance);
        $this->get(route('budgets.index'))->assertInertia(fn (Assert $page) => $page
            ->component('budgets/index')->has('budgets', 1)->has('currencies', 1)
            ->where('budgets.0.currency.code', 'MMK')->where('budgets.0.is_closed', false));
        $this->put(route('budgets.update', $budget), [...$data, 'title' => 'Updated budget', 'closing_balance' => '200.25', 'is_closed' => true, 'isactive' => false])
            ->assertRedirect(route('budgets.index'))->assertSessionHas('status', 'Budget updated.');
        $budget->refresh();
        $this->assertSame('Updated budget', $budget->title);
        $this->assertSame('200.25', $budget->closing_balance);
        $this->assertTrue($budget->is_closed);
        $this->assertFalse($budget->isactive);
        $this->assertSame($user->id, $budget->modified_user);
        $this->delete(route('budgets.destroy', $budget))->assertRedirect(route('budgets.index'))
            ->assertSessionHas('status', 'Budget deleted.');
        $this->assertSoftDeleted($budget);
        $this->assertTrue($budget->fresh()->isdeleted);
        $this->get(route('budgets.index'))->assertInertia(fn (Assert $page) => $page->has('budgets', 0));
        $this->put(route('budgets.update', $budget), $data)->assertNotFound();
        $this->delete(route('budgets.destroy', $budget))->assertNotFound();
    }

    public function test_budget_validation_rejects_duplicates_invalid_month_currency_and_balances(): void
    {
        $this->actingAs(User::factory()->create());
        $data = $this->payload();
        $budget = Budget::create($data);
        $this->post(route('budgets.store'), $data)->assertSessionHasErrors('budget_code');
        $this->put(route('budgets.update', $budget), $data)->assertSessionHasNoErrors();
        $other = Budget::create([...$data, 'budget_code' => 'OTHER']);
        $this->put(route('budgets.update', $other), $data)->assertSessionHasErrors('budget_code');
        $this->post(route('budgets.store'), [...$data, 'budget_code' => '', 'title' => '', 'month' => '2026-13', 'currency_id' => 999999,
            'opening_balance' => '1.234', 'closing_balance' => '10000000000', 'is_closed' => 'invalid', 'isactive' => 'invalid'])
            ->assertSessionHasErrors(['budget_code', 'title', 'month', 'currency_id', 'opening_balance', 'closing_balance', 'is_closed', 'isactive']);
        $this->assertDatabaseCount('budgets', 2);
        $this->delete(route('budgets.destroy', $budget))->assertRedirect();
        $this->post(route('budgets.store'), $data)->assertSessionHasErrors('budget_code');
    }

    public function test_deleted_currencies_cannot_be_selected(): void
    {
        $this->actingAs(User::factory()->create());
        $data = $this->payload();
        Currency::whereKey($data['currency_id'])->update(['deleted_at' => now(), 'isdeleted' => true]);
        $this->post(route('budgets.store'), $data)->assertSessionHasErrors('currency_id');
        $this->get(route('budgets.index'))->assertInertia(fn (Assert $page) => $page->has('currencies', 0));
    }

    private function payload(): array
    {
        $currency = Currency::forceCreate(['code' => 'MMK', 'name' => 'Myanmar Kyat']);

        return ['budget_code' => 'B202610', 'title' => 'October budget', 'month' => '2026-10', 'currency_id' => $currency->id,
            'opening_balance' => '1000.50', 'closing_balance' => '0.00', 'is_closed' => false, 'isactive' => true, 'remark' => 'Monthly budget'];
    }

    public function test_creation_saves_an_item_for_every_undeleted_category_using_the_budget_currency(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);
        $categories = collect(['income', 'expense', 'saving'])->map(fn ($type) => Category::create([
            'code' => strtoupper($type), 'name' => $type, 'type' => $type, 'isactive' => $type !== 'saving',
            'default_plan_amount' => match ($type) { 'income' => '1500.75', 'expense' => '250.50', default => '0.00' },
        ]));
        $deleted = Category::create(['code' => 'DELETED', 'name' => 'Deleted', 'type' => 'expense']);
        $deleted->delete();
        Category::forceCreate(['code' => 'FLAGGED', 'name' => 'Flagged', 'type' => 'expense', 'isdeleted' => true]);
        $data = $this->payload();
        $this->post(route('budgets.store'), $data)->assertSessionHasNoErrors()->assertRedirect(route('budgets.index'));
        $budget = Budget::firstOrFail();
        $this->assertDatabaseCount('budget_items', 3);
        foreach ($categories as $category) {
            $this->assertDatabaseHas('budget_items', [
                'budget_id' => $budget->id, 'category_id' => $category->id, 'currency_id' => $budget->currency_id,
                'type' => $category->type, 'plan_amount' => $category->default_plan_amount, 'created_user' => $user->id,
            ]);
        }
        $this->put(route('budgets.update', $budget), [...$data, 'title' => 'Changed title'])->assertSessionHasNoErrors();
        $this->assertDatabaseCount('budget_items', 3);
        $this->post(route('budgets.store'), [...$data, 'budget_code' => 'SECOND'])->assertSessionHasNoErrors();
        $second = Budget::where('budget_code', 'SECOND')->firstOrFail();
        $this->assertSame(3, BudgetItem::where('budget_id', $second->id)->count());
        $this->assertDatabaseCount('budget_items', 6);
    }

    public function test_budget_creation_rolls_back_when_an_item_cannot_be_saved(): void
    {
        $this->actingAs(User::factory()->create());
        Category::create(['code' => 'FOOD', 'name' => 'Food', 'type' => 'expense']);
        $data = $this->payload();
        $this->withoutExceptionHandling();
        $event = 'eloquent.creating: '.BudgetItem::class;
        Event::listen($event, function () {
            throw new \RuntimeException('Item save failed');
        });
        try {
            $this->post(route('budgets.store'), $data);
            $this->fail('Expected item creation to fail.');
        } catch (\RuntimeException $exception) {
            $this->assertSame('Item save failed', $exception->getMessage());
        } finally {
            Event::forget($event);
        }
        $this->assertDatabaseCount('budgets', 0);
        $this->assertDatabaseCount('budget_items', 0);
    }
}
