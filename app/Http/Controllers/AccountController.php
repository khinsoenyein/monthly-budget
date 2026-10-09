<?php

namespace App\Http\Controllers;

use App\Models\Account;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class AccountController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('accounts/index', [
            'accounts' => Account::query()->orderBy('sort_order')->orderBy('name')->get(['id', 'code', 'name', 'type', 'remark', 'isactive', 'sort_order']),
            'status' => session('status'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $account = new Account($this->validated($request));
        $account->created_user = $request->user()->id;
        $account->save();

        return to_route('accounts.index')->with('status', 'Account created.');
    }

    public function update(Request $request, Account $account): RedirectResponse
    {
        $account->fill($this->validated($request, $account));
        $account->modified_user = $request->user()->id;
        $account->save();

        return to_route('accounts.index')->with('status', 'Account updated.');
    }

    public function destroy(Request $request, Account $account): RedirectResponse
    {
        $account->getConnection()->transaction(function () use ($request, $account) {
            $account->isdeleted = true;
            $account->modified_user = $request->user()->id;
            $account->save();
            $account->delete();
        });

        return to_route('accounts.index')->with('status', 'Account deleted.');
    }

    private function validated(Request $request, ?Account $account = null): array
    {
        return $request->validate([
            'code' => ['required', 'string', 'max:255', Rule::unique('accounts', 'code')->ignore($account)],
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', Rule::in(['bank', 'e-wallet', 'cash'])],
            'remark' => ['nullable', 'string'],
            'isactive' => ['required', 'boolean'],
            'sort_order' => ['sometimes', 'required', 'integer', 'between:-2147483648,2147483647'],
        ]);
    }
}
