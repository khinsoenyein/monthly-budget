<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class CategoryController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('categories/index', [
            'categories' => Category::query()->orderBy('name')->get(['id', 'code', 'name', 'type', 'remark', 'isactive']),
            'status' => session('status'),
            'reservedCodes' => Category::withTrashed()->pluck('code'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $category = new Category($this->validated($request));
        $category->created_user = $request->user()->id;
        $category->save();

        return to_route('categories.index')->with('status', 'Category created.');
    }

    public function update(Request $request, Category $category): RedirectResponse
    {
        $category->fill($this->validated($request, $category));
        $category->modified_user = $request->user()->id;
        $category->save();

        return to_route('categories.index')->with('status', 'Category updated.');
    }

    public function destroy(Request $request, Category $category): RedirectResponse
    {
        $category->getConnection()->transaction(function () use ($request, $category) {
            $category->isdeleted = true;
            $category->modified_user = $request->user()->id;
            $category->save();
            $category->delete();
        });

        return to_route('categories.index')->with('status', 'Category deleted.');
    }

    private function validated(Request $request, ?Category $category = null): array
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', Rule::in(['income', 'expense', 'saving'])],
            'remark' => ['nullable', 'string'],
            'isactive' => ['required', 'boolean'],
        ]);

        $words = preg_split('/\s+/u', trim($data['name']), -1, PREG_SPLIT_NO_EMPTY);
        $code = mb_strtoupper(mb_substr($data['type'], 0, 1).implode('', array_map(
            fn (string $word) => mb_substr($word, 0, 1), $words
        )));

        $baseCode = $code;
        $usedCodes = Category::withTrashed()
            ->when($category, fn ($query) => $query->where('id', '!=', $category->id))
            ->pluck('code')->map(fn (string $value) => mb_strtoupper($value))->all();

        if ($category && preg_match('/^'.preg_quote($baseCode, '/').'[0-9]*$/u', $category->code)) {
            $code = $category->code;
        }
        $suffix = 1;
        while (in_array($code, $usedCodes, true)) {
            $code = mb_substr($baseCode, 0, 255 - strlen((string) $suffix)).$suffix;
            $suffix++;
        }

        $request->merge(['code' => $code]);
        $request->validate([
            'code' => ['required', 'string', 'max:255', Rule::unique('categories', 'code')->ignore($category)],
        ]);

        return [...$data, 'code' => $code];
    }
}
