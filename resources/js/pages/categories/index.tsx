import InputError from '@/components/input-error';
import SuccessToast from '@/components/success-toast';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { Head, useForm } from '@inertiajs/react';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { useCallback, useState, type FormEvent } from 'react';

type CategoryForm = { code: string; name: string; type: 'income' | 'expense' | 'saving'; remark: string; isactive: boolean };
type Category = Omit<CategoryForm, 'remark'> & { id: number; remark: string | null };
type SortField = 'name' | 'code' | 'type' | 'isactive' | 'remark';
const sortableColumns: { label: string; field: SortField }[] = [
    { label: 'Code', field: 'code' },
    { label: 'Name', field: 'name' },
    { label: 'Type', field: 'type' },
    { label: 'Status', field: 'isactive' },
    { label: 'Remarks', field: 'remark' },
];
const emptyForm: CategoryForm = { code: '', name: '', type: 'expense', remark: '', isactive: true };

function categoryCode(name: string, type: CategoryForm['type']) {
    const words = name.trim().split(/\s+/u).filter(Boolean);
    return words.length ? (type[0] + words.map((word) => Array.from(word)[0]).join('')).toUpperCase() : '';
}

export default function Categories({ categories, status, reservedCodes }: { categories: Category[]; status?: string; reservedCodes: string[] }) {
    const [editing, setEditing] = useState<number | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [sortField, setSortField] = useState<SortField>('name');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [toast, setToast] = useState<{ message: string; id: number } | null>(status ? { message: status, id: 0 } : null);
    const dismissToast = useCallback(() => setToast(null), []);
    const form = useForm<CategoryForm>(emptyForm);
    const deletion = useForm({});
    const baseCode = categoryCode(form.data.name, form.data.type);
    const editedCategory = categories.find((category) => category.id === editing);
    const usedCodes = new Set(reservedCodes.filter((code) => code !== editedCategory?.code).map((code) => code.toUpperCase()));
    let generatedCode = baseCode;
    if (editedCategory && categoryCode(editedCategory.name, editedCategory.type) === baseCode) {
        generatedCode = editedCategory.code;
    }
    for (let suffix = 1; generatedCode && usedCodes.has(generatedCode.toUpperCase()); suffix++) {
        generatedCode =
            Array.from(baseCode)
                .slice(0, 255 - String(suffix).length)
                .join('') + suffix;
    }
    const query = search.trim().toLocaleLowerCase();
    const visibleCategories = categories
        .filter((category) =>
            [category.code, category.name, category.type, category.isactive ? 'active' : 'inactive', category.remark ?? ''].some((value) =>
                value.toLocaleLowerCase().includes(query),
            ),
        )
        .sort((a, b) => {
            const value = (category: Category) =>
                sortField === 'isactive' ? (category.isactive ? 'Active' : 'Inactive') : (category[sortField] ?? '');
            const comparison = value(a).localeCompare(value(b), undefined, { sensitivity: 'base', numeric: true }) || a.id - b.id;
            return sortDirection === 'asc' ? comparison : -comparison;
        });
    const pageCount = Math.max(1, Math.ceil(visibleCategories.length / pageSize));
    const currentPage = Math.min(page, pageCount);
    const startIndex = (currentPage - 1) * pageSize;
    const pageCategories = visibleCategories.slice(startIndex, startIndex + pageSize);

    function sortBy(field: SortField) {
        setPage(1);
        if (field === sortField) setSortDirection((direction) => (direction === 'asc' ? 'desc' : 'asc'));
        else {
            setSortField(field);
            setSortDirection('asc');
        }
    }

    function reset() {
        setDialogOpen(false);
        setEditing(null);
        form.setData(emptyForm);
        form.clearErrors();
    }

    function submit(event: FormEvent) {
        event.preventDefault();
        const options = {
            preserveScroll: true,
            onSuccess: () => {
                setToast((previous) => ({ message: editing !== null ? 'Category updated.' : 'Category created.', id: (previous?.id ?? 0) + 1 }));
                reset();
            },
        };
        if (editing !== null) form.put(route('categories.update', editing), options);
        else form.post(route('categories.store'), options);
    }

    function edit(category: Category) {
        setEditing(category.id);
        form.clearErrors();
        form.setData({ code: category.code, name: category.name, type: category.type, remark: category.remark ?? '', isactive: category.isactive });
        setDialogOpen(true);
    }

    function remove(category: Category) {
        if (!window.confirm(`Delete category "${category.name}"?`)) return;
        deletion.delete(route('categories.destroy', category.id), {
            preserveScroll: true,
            onSuccess: () => {
                setToast((previous) => ({ message: 'Category deleted.', id: (previous?.id ?? 0) + 1 }));
                if (editing === category.id) reset();
            },
        });
    }

    return (
        <AppLayout breadcrumbs={[{ title: 'Categories', href: '/categories' }]}>
            <Head title="Categories" />
            {toast && <SuccessToast key={toast.id} message={toast.message} onDismiss={dismissToast} />}
            <div className="space-y-6 p-4 md:p-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold">Categories</h1>
                        <p className="text-sm text-muted-foreground">Manage categories.</p>
                    </div>
                    <Button
                        onClick={() => {
                            reset();
                            setDialogOpen(true);
                        }}
                        disabled={form.processing || deletion.processing}
                    >
                        Add Category
                    </Button>
                </div>
                <Dialog
                    open={dialogOpen}
                    onOpenChange={(open) => {
                        if (!form.processing && !open) reset();
                    }}
                >
                    <DialogContent className="max-h-[90dvh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>{editing !== null ? 'Edit Category' : 'Add Category'}</DialogTitle>
                            <DialogDescription>
                                {editing !== null ? 'Update the category details below.' : 'Enter the details for your new category.'}
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={submit} className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Name</Label>
                                    <Input
                                        id="name"
                                        value={form.data.name}
                                        onChange={(e) => form.setData('name', e.target.value)}
                                        required
                                        maxLength={255}
                                    />
                                    <InputError message={form.errors.name} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="code">Code</Label>
                                    <Input id="code" value={generatedCode} readOnly aria-describedby="code-description" />
                                    <p id="code-description" className="text-xs text-muted-foreground">
                                        Auto-generated
                                    </p>
                                    <InputError message={form.errors.code} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="type">Type</Label>
                                    <Select value={form.data.type} onValueChange={(value) => form.setData('type', value as CategoryForm['type'])}>
                                        <SelectTrigger id="type" aria-invalid={!!form.errors.type}>
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="income">Income</SelectItem>
                                            <SelectItem value="expense">Expense</SelectItem>
                                            <SelectItem value="saving">Saving</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <InputError message={form.errors.type} />
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        id="isactive"
                                        type="checkbox"
                                        checked={form.data.isactive}
                                        onChange={(e) => form.setData('isactive', e.target.checked)}
                                    />
                                    <Label htmlFor="isactive">Active</Label>
                                    <InputError message={form.errors.isactive} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="remark">Remarks</Label>
                                <textarea
                                    id="remark"
                                    className="min-h-20 w-full rounded-md border bg-background px-3 py-2 text-sm"
                                    value={form.data.remark}
                                    onChange={(e) => form.setData('remark', e.target.value)}
                                />
                                <InputError message={form.errors.remark} />
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={reset} disabled={form.processing}>
                                    Cancel
                                </Button>
                                <Button disabled={form.processing || deletion.processing}>
                                    {editing !== null ? 'Save changes' : 'Create category'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                    <div className="flex-1 space-y-2">
                        <Label htmlFor="category-search">Search</Label>
                        <Input
                            id="category-search"
                            type="search"
                            placeholder="Search categories..."
                            value={search}
                            onChange={(event) => {
                                setSearch(event.target.value);
                                setPage(1);
                            }}
                        />
                    </div>
                    <div className="space-y-2 sm:w-36">
                        <Label htmlFor="category-page-size">Rows per page</Label>
                        <Select
                            value={String(pageSize)}
                            onValueChange={(value) => {
                                setPageSize(Number(value));
                                setPage(1);
                            }}
                        >
                            <SelectTrigger id="category-page-size">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {[10, 25, 50].map((size) => (
                                    <SelectItem key={size} value={String(size)}>
                                        {size}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <p role="status" className="text-sm text-muted-foreground">
                    Showing {visibleCategories.length === 0 ? 0 : startIndex + 1}–{Math.min(startIndex + pageSize, visibleCategories.length)} of{' '}
                    {visibleCategories.length} categories
                    {query && ` (${categories.length} total)`}
                </p>
                <div className="overflow-x-auto rounded-xl border">
                    <table className="w-full text-left text-sm">
                        <caption className="sr-only">Categories</caption>
                        <thead className="border-b bg-muted/50">
                            <tr>
                                <th scope="col" className="p-3 font-medium">
                                    No.
                                </th>
                                {sortableColumns.map(({ label, field }) => (
                                    <th
                                        key={field}
                                        scope="col"
                                        className="p-3 font-medium"
                                        aria-sort={sortField === field ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                                    >
                                        <button
                                            type="button"
                                            onClick={() => sortBy(field)}
                                            className="flex items-center gap-2 rounded-sm hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2"
                                            aria-label={`Sort by ${label}, ${sortField === field && sortDirection === 'asc' ? 'descending' : 'ascending'}`}
                                        >
                                            {label}
                                            {sortField !== field ? (
                                                <ArrowUpDown className="size-4 text-muted-foreground" aria-hidden="true" />
                                            ) : sortDirection === 'asc' ? (
                                                <ArrowUp className="size-4" aria-hidden="true" />
                                            ) : (
                                                <ArrowDown className="size-4" aria-hidden="true" />
                                            )}
                                        </button>
                                    </th>
                                ))}
                                <th scope="col" className="p-3 font-medium">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {visibleCategories.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="p-6 text-center text-muted-foreground">
                                        {categories.length === 0
                                            ? 'No categories yet. Click Add Category to create your first category.'
                                            : 'No categories match your search.'}
                                    </td>
                                </tr>
                            )}
                            {pageCategories.map((category, index) => (
                                <tr key={category.id} className="border-b last:border-0">
                                    <td className="p-3">{startIndex + index + 1}</td>
                                    <td className="p-3">{category.code}</td>
                                    <td className="p-3">{category.name}</td>
                                    <td className="p-3 capitalize">{category.type}</td>
                                    <td className="p-3">{category.isactive ? 'Active' : 'Inactive'}</td>
                                    <td className="max-w-xs p-3 break-words whitespace-pre-wrap">{category.remark || '—'}</td>
                                    <td className="p-3">
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => edit(category)}
                                                disabled={form.processing || deletion.processing}
                                                aria-label={`Edit ${category.name}`}
                                            >
                                                Edit
                                            </Button>
                                            {/* <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => remove(category)}
                                                disabled={form.processing || deletion.processing}
                                                aria-label={`Delete ${category.name}`}
                                            >
                                                Delete
                                            </Button> */}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <nav aria-label="Category pagination" className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm text-muted-foreground">
                        Page {currentPage} of {pageCount}
                    </p>
                    <div className="flex flex-wrap gap-2">
                        <Button type="button" variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setPage(1)}>
                            First
                        </Button>
                        <Button type="button" variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>
                            Previous
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={currentPage === pageCount}
                            onClick={() => setPage(currentPage + 1)}
                        >
                            Next
                        </Button>
                        <Button type="button" variant="outline" size="sm" disabled={currentPage === pageCount} onClick={() => setPage(pageCount)}>
                            Last
                        </Button>
                    </div>
                </nav>
            </div>
        </AppLayout>
    );
}
