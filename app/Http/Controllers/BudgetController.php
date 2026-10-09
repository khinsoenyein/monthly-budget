<?php

namespace App\Http\Controllers;

use App\Models\Budget;
use App\Models\BudgetItem;
use App\Models\Category;
use App\Models\Currency;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class BudgetController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('budgets/index', [
            'budgets' => Budget::query()->with('currency:id,code,name')->orderByDesc('month')->orderBy('title')->get(),
            'currencies' => Currency::query()->whereNull('deleted_at')->where('isdeleted', false)
                ->orderBy('code')->get(['id', 'code', 'name', 'isactive']),
            'status' => session('status'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $budget = new Budget($this->validated($request));
        $budget->created_user = $request->user()->id;
        $budget->getConnection()->transaction(function () use ($budget) {
            $budget->save();

            foreach (Category::query()->where('isdeleted', false)->get(['id', 'type', 'default_plan_amount']) as $category) {
                $item = new BudgetItem;
                $item->budget_id = $budget->id;
                $item->category_id = $category->id;
                $item->currency_id = $budget->currency_id;
                $item->type = $category->type;
                $item->plan_amount = $category->default_plan_amount;
                $item->created_user = $budget->created_user;
                $item->save();
            }
        });

        return to_route('budgets.index')->with('status', 'Budget created.');
    }

    public function update(Request $request, Budget $budget): RedirectResponse
    {
        $budget->fill($this->validated($request, $budget));
        $budget->modified_user = $request->user()->id;
        $budget->save();

        return to_route('budgets.index')->with('status', 'Budget updated.');
    }

    public function destroy(Request $request, Budget $budget): RedirectResponse
    {
        $budget->getConnection()->transaction(function () use ($request, $budget) {
            $budget->isdeleted = true;
            $budget->modified_user = $request->user()->id;
            $budget->save();
            $budget->delete();
        });

        return to_route('budgets.index')->with('status', 'Budget deleted.');
    }

    private function validated(Request $request, ?Budget $budget = null): array
    {
        return $request->validate([
            'budget_code' => ['required', 'string', 'max:255', Rule::unique('budgets', 'budget_code')->ignore($budget)],
            'title' => ['required', 'string', 'max:255'],
            'month' => ['required', 'date_format:Y-m'],
            'currency_id' => ['required', 'integer', Rule::exists('currencies', 'id')->whereNull('deleted_at')->where('isdeleted', 0)],
            'opening_balance' => ['required', 'numeric', 'decimal:0,2', 'between:-9999999999.99,9999999999.99'],
            'closing_balance' => ['required', 'numeric', 'decimal:0,2', 'between:-9999999999.99,9999999999.99'],
            'is_closed' => ['required', 'boolean'],
            'isactive' => ['required', 'boolean'],
            'remark' => ['nullable', 'string'],
        ]);
    }
}
