<?php

namespace App\Http\Controllers;

use App\Models\Account;
use App\Models\Budget;
use App\Models\BudgetItem;
use App\Models\Category;
use App\Models\Currency;
use App\Models\Transaction;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class TransactionController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('transactions/index', [
            'transactions' => Transaction::query()->with(['budget:id,budget_code,title', 'category:id,code,name', 'account:id,code,name', 'currency:id,code,name'])
                ->orderByDesc('date')->orderByDesc('id')->get(),
            'budgets' => Budget::query()->where('isdeleted', false)->orderByDesc('month')->get(['id', 'budget_code', 'title', 'currency_id']),
            'categories' => Category::query()->where('isdeleted', false)->orderBy('name')->get(['id', 'code', 'name', 'type']),
            'accounts' => Account::query()->where('isdeleted', false)->orderBy('sort_order')->orderBy('name')->get(['id', 'code', 'name']),
            'currencies' => Currency::query()->whereNull('deleted_at')->where('isdeleted', false)->orderBy('code')->get(['id', 'code', 'name']),
            'budgetItems' => BudgetItem::query()->where('isdeleted', false)->orderBy('id')->get(['id', 'budget_id', 'category_id', 'currency_id', 'type']),
            'status' => session('status'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $transaction = new Transaction($this->validated($request));
        $transaction->created_user = $request->user()->id;
        $transaction->save();

        return to_route('transactions.index')->with('status', 'Transaction created.');
    }

    public function update(Request $request, Transaction $transaction): RedirectResponse
    {
        $transaction->fill($this->validated($request, $transaction));
        $transaction->modified_user = $request->user()->id;
        $transaction->save();

        return to_route('transactions.index')->with('status', 'Transaction updated.');
    }

    public function destroy(Request $request, Transaction $transaction): RedirectResponse
    {
        $transaction->getConnection()->transaction(function () use ($request, $transaction) {
            $transaction->isdeleted = true;
            $transaction->modified_user = $request->user()->id;
            $transaction->save();
            $transaction->delete();
        });

        return to_route('transactions.index')->with('status', 'Transaction deleted.');
    }

    private function validated(Request $request, ?Transaction $transaction = null): array
    {
        $exists = fn (string $table) => Rule::exists($table, 'id')->whereNull('deleted_at')->where('isdeleted', 0);
        $data = $request->validate([
            'transaction_code' => ['required', 'string', 'max:255', Rule::unique('transactions', 'transaction_code')->ignore($transaction)],
            'type' => ['required', Rule::in(['income', 'expense', 'saving'])],
            'transaction_type' => ['required', Rule::in(['payable', 'receivable', '-'])],
            'budget_id' => ['nullable', 'integer', $exists('budgets')],
            'category_id' => ['nullable', 'integer', $exists('categories')->where('type', $request->input('type'))],
            'account_id' => ['nullable', 'integer', $exists('accounts')],
            'currency_id' => ['nullable', 'integer', $exists('currencies')],
            'budget_item_id' => ['nullable', 'integer', $exists('budget_items')],
            'date' => ['nullable', 'date_format:Y-m-d'],
            'amount' => ['required', 'numeric', 'decimal:0,2', 'between:0,9999999999.99'],
            'description' => ['nullable', 'string', 'max:65535'],
            'remark' => ['nullable', 'string'],
            'isactive' => ['required', 'boolean'],
        ]);

        if (! empty($data['budget_item_id'])) {
            $item = BudgetItem::findOrFail($data['budget_item_id']);
            foreach (['budget_id', 'category_id', 'currency_id', 'type'] as $field) {
                if ((string) ($data[$field] ?? '') !== (string) $item->{$field}) {
                    throw ValidationException::withMessages(['budget_item_id' => 'The budget item must match the selected budget, category, currency, and type.']);
                }
            }
        }

        return $data;
    }
}
