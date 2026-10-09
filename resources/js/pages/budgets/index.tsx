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

type Currency = { id: number; code: string; name: string; isactive?: boolean };
type BudgetForm = {
    budget_code: string;
    title: string;
    month: string;
    currency_id: string;
    opening_balance: string;
    closing_balance: string;
    is_closed: boolean;
    isactive: boolean;
    remark: string;
};
type Budget = Omit<BudgetForm, 'currency_id' | 'remark'> & { id: number; currency_id: number; remark: string | null; currency: Currency | null };
type SortField = 'budget_code' | 'title' | 'month' | 'currency' | 'opening_balance' | 'closing_balance' | 'is_closed' | 'isactive' | 'remark';
const columns: { label: string; field: SortField }[] = [
    { label: 'Code', field: 'budget_code' },
    { label: 'Title', field: 'title' },
    { label: 'Month', field: 'month' },
    { label: 'Currency', field: 'currency' },
    { label: 'Opening balance', field: 'opening_balance' },
    { label: 'Closing balance', field: 'closing_balance' },
    { label: 'Closed', field: 'is_closed' },
    { label: 'Status', field: 'isactive' },
    { label: 'Remarks', field: 'remark' },
];
const emptyForm: BudgetForm = {
    budget_code: '',
    title: '',
    month: '',
    currency_id: '',
    opening_balance: '0.00',
    closing_balance: '0.00',
    is_closed: false,
    isactive: true,
    remark: '',
};

export default function Budgets({ budgets, currencies, status }: { budgets: Budget[]; currencies: Currency[]; status?: string }) {
    const [editing, setEditing] = useState<number | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [sortField, setSortField] = useState<SortField>('month');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [toast, setToast] = useState<{ message: string; id: number } | null>(status ? { message: status, id: 0 } : null);
    const dismissToast = useCallback(() => setToast(null), []);
    const form = useForm<BudgetForm>(emptyForm);
    const deletion = useForm({});
    const busy = form.processing || deletion.processing;
    const query = search.trim().toLocaleLowerCase();

    function displayValue(budget: Budget, field: SortField): string {
        if (field === 'currency') return budget.currency?.code ?? '';
        if (field === 'is_closed') return budget.is_closed ? 'Closed' : 'Open';
        if (field === 'isactive') return budget.isactive ? 'Active' : 'Inactive';
        return budget[field] ?? '';
    }

    const results = budgets
        .filter((budget) =>
            [...columns.map(({ field }) => displayValue(budget, field)), budget.currency?.name ?? ''].some((value) =>
                value.toLocaleLowerCase().includes(query),
            ),
        )
        .sort((a, b) => {
            const comparison =
                (sortField === 'opening_balance' || sortField === 'closing_balance'
                    ? Number(a[sortField]) - Number(b[sortField])
                    : displayValue(a, sortField).localeCompare(displayValue(b, sortField), undefined, { sensitivity: 'base', numeric: true })) ||
                a.id - b.id;
            return sortDirection === 'asc' ? comparison : -comparison;
        });
    const pageCount = Math.max(1, Math.ceil(results.length / pageSize));
    const currentPage = Math.min(page, pageCount);
    const startIndex = (currentPage - 1) * pageSize;
    const rows = results.slice(startIndex, startIndex + pageSize);

    function notify(message: string) {
        setToast((previous) => ({ message, id: (previous?.id ?? 0) + 1 }));
    }
    function close() {
        setDialogOpen(false);
        setEditing(null);
        form.setData(emptyForm);
        form.clearErrors();
    }
    function edit(budget: Budget) {
        setEditing(budget.id);
        form.clearErrors();
        form.setData({
            budget_code: budget.budget_code,
            title: budget.title,
            month: budget.month,
            currency_id: String(budget.currency_id),
            opening_balance: budget.opening_balance,
            closing_balance: budget.closing_balance,
            is_closed: budget.is_closed,
            isactive: budget.isactive,
            remark: budget.remark ?? '',
        });
        setDialogOpen(true);
    }
    function submit(event: FormEvent) {
        event.preventDefault();
        const options = {
            preserveScroll: true,
            onSuccess: () => {
                notify(editing !== null ? 'Budget updated.' : 'Budget created.');
                close();
            },
        };
        if (editing !== null) form.put(route('budgets.update', editing), options);
        else form.post(route('budgets.store'), options);
    }
    function remove(budget: Budget) {
        if (!window.confirm(`Delete budget "${budget.title}"?`)) return;
        deletion.delete(route('budgets.destroy', budget.id), { preserveScroll: true, onSuccess: () => notify('Budget deleted.') });
    }
    function sortBy(field: SortField) {
        setPage(1);
        if (sortField === field) setSortDirection((direction) => (direction === 'asc' ? 'desc' : 'asc'));
        else {
            setSortField(field);
            setSortDirection('asc');
        }
    }

    return (
        <AppLayout breadcrumbs={[{ title: 'Budgets', href: '/budgets' }]}>
            <Head title="Budgets" />
            {toast && <SuccessToast key={toast.id} message={toast.message} onDismiss={dismissToast} />}
            <div className="space-y-6 p-4 md:p-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold">Budgets</h1>
                        <p className="text-sm text-muted-foreground">Manage monthly budgets and balances.</p>
                    </div>
                    <Button
                        disabled={busy || currencies.length === 0}
                        onClick={() => {
                            close();
                            setDialogOpen(true);
                        }}
                    >
                        Add Budget
                    </Button>
                </div>
                {currencies.length === 0 && <p className="text-sm text-muted-foreground">Add a currency before creating a budget.</p>}
                <Dialog
                    open={dialogOpen}
                    onOpenChange={(open) => {
                        if (!open && !form.processing) close();
                    }}
                >
                    <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>{editing !== null ? 'Edit Budget' : 'Add Budget'}</DialogTitle>
                            <DialogDescription>Enter the budget details below.</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={submit} className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                {(['budget_code', 'title'] as const).map((field) => (
                                    <div key={field} className="space-y-2">
                                        <Label htmlFor={`budget-${field}`}>{field === 'title' ? 'Title' : 'Code'}</Label>
                                        <Input
                                            id={`budget-${field}`}
                                            required
                                            maxLength={255}
                                            value={form.data[field]}
                                            onChange={(event) => form.setData(field, event.target.value)}
                                        />
                                        <InputError message={form.errors[field]} />
                                    </div>
                                ))}
                                <div className="space-y-2">
                                    <Label htmlFor="budget-month">Month</Label>
                                    <Input
                                        id="budget-month"
                                        type="month"
                                        required
                                        value={form.data.month}
                                        onChange={(event) => form.setData('month', event.target.value)}
                                    />
                                    <InputError message={form.errors.month} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="budget-currency">Currency</Label>
                                    <Select value={form.data.currency_id} onValueChange={(value) => form.setData('currency_id', value)}>
                                        <SelectTrigger id="budget-currency" aria-invalid={!!form.errors.currency_id}>
                                            <SelectValue placeholder="Select currency" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {currencies.map((currency) => (
                                                <SelectItem key={currency.id} value={String(currency.id)}>
                                                    {currency.code} - {currency.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={form.errors.currency_id} />
                                </div>
                                {(['opening_balance', 'closing_balance'] as const).map((field) => (
                                    <div key={field} className="space-y-2">
                                        <Label htmlFor={`budget-${field}`}>
                                            {field === 'opening_balance' ? 'Opening balance' : 'Closing balance'}
                                        </Label>
                                        <Input
                                            id={`budget-${field}`}
                                            type="number"
                                            step="0.01"
                                            min="-9999999999.99"
                                            max="9999999999.99"
                                            required
                                            value={form.data[field]}
                                            onChange={(event) => form.setData(field, event.target.value)}
                                        />
                                        <InputError message={form.errors[field]} />
                                    </div>
                                ))}
                                {(['is_closed', 'isactive'] as const).map((field) => (
                                    <div key={field} className="flex items-center gap-2">
                                        <input
                                            id={`budget-${field}`}
                                            type="checkbox"
                                            checked={form.data[field]}
                                            onChange={(event) => form.setData(field, event.target.checked)}
                                        />
                                        <Label htmlFor={`budget-${field}`}>{field === 'is_closed' ? 'Closed' : 'Active'}</Label>
                                        <InputError message={form.errors[field]} />
                                    </div>
                                ))}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="budget-remark">Remarks</Label>
                                <textarea
                                    id="budget-remark"
                                    className="min-h-20 w-full rounded-md border bg-background px-3 py-2 text-sm"
                                    value={form.data.remark}
                                    onChange={(event) => form.setData('remark', event.target.value)}
                                />
                                <InputError message={form.errors.remark} />
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={close} disabled={form.processing}>
                                    Cancel
                                </Button>
                                <Button disabled={busy}>{editing !== null ? 'Save changes' : 'Create budget'}</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                    <div className="flex-1 space-y-2">
                        <Label htmlFor="budget-search">Search</Label>
                        <Input
                            id="budget-search"
                            type="search"
                            placeholder="Search budgets..."
                            value={search}
                            onChange={(event) => {
                                setSearch(event.target.value);
                                setPage(1);
                            }}
                        />
                    </div>
                    <div className="space-y-2 sm:w-36">
                        <Label htmlFor="budget-page-size">Rows per page</Label>
                        <Select
                            value={String(pageSize)}
                            onValueChange={(value) => {
                                setPageSize(Number(value));
                                setPage(1);
                            }}
                        >
                            <SelectTrigger id="budget-page-size">
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
                    Showing {results.length === 0 ? 0 : startIndex + 1}-{Math.min(startIndex + pageSize, results.length)} of {results.length} budgets
                    {query && ` (${budgets.length} total)`}
                </p>
                <div className="overflow-x-auto rounded-xl border">
                    <table className="w-full text-left text-sm">
                        <caption className="sr-only">Budgets</caption>
                        <thead className="border-b bg-muted/50">
                            <tr>
                                <th scope="col" className="p-3 font-medium">
                                    No.
                                </th>
                                {columns.map(({ label, field }) => (
                                    <th
                                        key={field}
                                        scope="col"
                                        className="p-3 font-medium"
                                        aria-sort={sortField === field ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                                    >
                                        <button
                                            type="button"
                                            onClick={() => sortBy(field)}
                                            className="flex items-center gap-2 rounded-sm whitespace-nowrap hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2"
                                            aria-label={`Sort by ${label}, ${sortField === field && sortDirection === 'asc' ? 'descending' : 'ascending'}`}
                                        >
                                            {label}
                                            {sortField !== field ? (
                                                <ArrowUpDown className="size-4" aria-hidden="true" />
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
                            {rows.length === 0 && (
                                <tr>
                                    <td colSpan={11} className="p-6 text-center text-muted-foreground">
                                        {budgets.length === 0 ? 'No budgets yet. Add your first budget above.' : 'No budgets match your search.'}
                                    </td>
                                </tr>
                            )}
                            {rows.map((budget, index) => (
                                <tr key={budget.id} className="border-b last:border-0">
                                    <td className="p-3">{startIndex + index + 1}</td>
                                    {columns.map(({ field }) => (
                                        <td
                                            key={field}
                                            className={field === 'remark' ? 'max-w-xs p-3 break-words whitespace-pre-wrap' : 'p-3 whitespace-nowrap'}
                                        >
                                            {displayValue(budget, field) || '-'}
                                        </td>
                                    ))}
                                    <td className="p-3">
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled={busy}
                                                onClick={() => edit(budget)}
                                                aria-label={`Edit ${budget.title}`}
                                            >
                                                Edit
                                            </Button>
                                            {/* <Button
                                                variant="destructive"
                                                size="sm"
                                                disabled={busy}
                                                onClick={() => remove(budget)}
                                                aria-label={`Delete ${budget.title}`}
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
                <nav aria-label="Budget pagination" className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm text-muted-foreground">
                        Page {currentPage} of {pageCount}
                    </p>
                    <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setPage(1)}>
                            First
                        </Button>
                        <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>
                            Previous
                        </Button>
                        <Button variant="outline" size="sm" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}>
                            Next
                        </Button>
                        <Button variant="outline" size="sm" disabled={currentPage === pageCount} onClick={() => setPage(pageCount)}>
                            Last
                        </Button>
                    </div>
                </nav>
            </div>
        </AppLayout>
    );
}
