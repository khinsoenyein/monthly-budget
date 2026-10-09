<?php

namespace Tests\Feature;

use App\Models\Account;
use App\Models\Budget;
use App\Models\BudgetItem;
use App\Models\Category;
use App\Models\Currency;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class TransactionTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_cannot_access_transaction_routes(): void
    {
        $transaction = Transaction::create($this->payload());
        $this->get(route('transactions.index'))->assertRedirect(route('login'));
        $this->post(route('transactions.store'), $this->payload())->assertRedirect(route('login'));
        $this->put(route('transactions.update', $transaction), $this->payload())->assertRedirect(route('login'));
        $this->delete(route('transactions.destroy', $transaction))->assertRedirect(route('login'));
    }

    public function test_transactions_can_be_created_listed_updated_and_soft_deleted(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);
        $data = $this->relatedPayload();
        $this->post(route('transactions.store'), [...$data, 'created_user' => 999])
            ->assertRedirect(route('transactions.index'))->assertSessionHas('status', 'Transaction created.');
        $transaction = Transaction::firstOrFail();
        $this->assertSame($user->id, $transaction->created_user);
        $this->assertSame('1500.25', $transaction->amount);
        $this->get(route('transactions.index'))->assertInertia(fn (Assert $page) => $page
            ->component('transactions/index')->has('transactions', 1)->has('budgets', 1)->has('categories', 1)
            ->has('accounts', 1)->has('currencies', 1)->has('budgetItems', 1)
            ->where('transactions.0.date', '2026-10-08')->where('transactions.0.account.name', 'Cash')
            ->where('transactions.0.currency.code', 'MMK'));
        $this->put(route('transactions.update', $transaction), [...$data, 'amount' => '2000.50', 'isactive' => false, 'transaction_type' => 'payable'])
            ->assertRedirect(route('transactions.index'))->assertSessionHas('status', 'Transaction updated.');
        $this->assertDatabaseHas('transactions', ['id' => $transaction->id, 'amount' => '2000.50', 'isactive' => false, 'transaction_type' => 'payable', 'modified_user' => $user->id]);
        $this->delete(route('transactions.destroy', $transaction))->assertRedirect(route('transactions.index'))
            ->assertSessionHas('status', 'Transaction deleted.');
        $this->assertSoftDeleted($transaction);
        $this->assertTrue($transaction->fresh()->isdeleted);
        $this->get(route('transactions.index'))->assertInertia(fn (Assert $page) => $page->has('transactions', 0));
        $this->put(route('transactions.update', $transaction), $data)->assertNotFound();
        $this->delete(route('transactions.destroy', $transaction))->assertNotFound();
    }

    public function test_optional_relations_can_be_empty_and_invalid_input_is_rejected(): void
    {
        $this->actingAs(User::factory()->create());
        $data = $this->payload();
        $this->post(route('transactions.store'), $data)->assertSessionHasNoErrors();
        $transaction = Transaction::firstOrFail();
        $this->put(route('transactions.update', $transaction), $data)->assertSessionHasNoErrors();
        $this->post(route('transactions.store'), $data)->assertSessionHasErrors('transaction_code');
        $this->post(route('transactions.store'), [...$data, 'transaction_code' => '', 'type' => 'invalid', 'transaction_type' => 'invalid',
            'date' => '2026-02-30', 'amount' => '1.234', 'isactive' => 'invalid', 'budget_id' => 999, 'category_id' => 999,
            'account_id' => 999, 'currency_id' => 999, 'budget_item_id' => 999])
            ->assertSessionHasErrors(['transaction_code', 'type', 'transaction_type', 'date', 'amount', 'isactive', 'budget_id', 'category_id', 'account_id', 'currency_id', 'budget_item_id']);
        foreach (['-1.00', '10000000000'] as $amount) {
            $this->put(route('transactions.update', $transaction), [...$data, 'amount' => $amount])->assertSessionHasErrors('amount');
        }
        $this->assertDatabaseCount('transactions', 1);
    }

    public function test_mismatched_categories_budget_items_and_deleted_relations_are_rejected(): void
    {
        $this->actingAs(User::factory()->create());
        $data = $this->relatedPayload();
        $this->post(route('transactions.store'), [...$data, 'type' => 'income'])->assertSessionHasErrors('category_id');
        foreach (['budget_id', 'category_id', 'currency_id'] as $field) {
            $this->post(route('transactions.store'), [...$data, $field => null])->assertSessionHasErrors('budget_item_id');
        }
        Account::findOrFail($data['account_id'])->delete();
        $this->post(route('transactions.store'), $data)->assertSessionHasErrors('account_id');
        $this->assertDatabaseCount('transactions', 0);
    }

    private function payload(): array
    {
        return ['transaction_code' => 'T001', 'type' => 'expense', 'transaction_type' => '-', 'date' => '2026-10-08',
            'amount' => '1500.25', 'description' => 'Lunch', 'remark' => null, 'isactive' => true,
            'budget_id' => null, 'category_id' => null, 'account_id' => null, 'currency_id' => null, 'budget_item_id' => null];
    }

    private function relatedPayload(): array
    {
        $currency = Currency::forceCreate(['code' => 'MMK', 'name' => 'Myanmar Kyat']);
        $budget = Budget::create(['budget_code' => 'B001', 'title' => 'October', 'month' => '2026-10', 'currency_id' => $currency->id]);
        $category = Category::create(['code' => 'EF', 'name' => 'Food', 'type' => 'expense']);
        $account = Account::create(['code' => 'CASH', 'name' => 'Cash', 'type' => 'cash']);
        $item = BudgetItem::forceCreate(['budget_id' => $budget->id, 'category_id' => $category->id, 'currency_id' => $currency->id, 'type' => 'expense']);

        return [...$this->payload(), 'budget_id' => $budget->id, 'category_id' => $category->id, 'currency_id' => $currency->id,
            'account_id' => $account->id, 'budget_item_id' => $item->id];
    }
}
