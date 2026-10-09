import InputError from '@/components/input-error';
import SuccessToast from '@/components/success-toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { Head, useForm } from '@inertiajs/react';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { useCallback, useState, type FormEvent } from 'react';

type Option = { id: number; code: string; name: string };
type Budget = { id: number; budget_code: string; title: string; currency_id: number };
type Category = Option & { type: string };
type BudgetItem = { id: number; budget_id: number | null; category_id: number | null; currency_id: number | null; type: string };
type RelationField = 'budget_id' | 'category_id' | 'account_id' | 'currency_id' | 'budget_item_id';
type TransactionForm = Record<RelationField, string> & {
    transaction_code: string;
    type: 'income' | 'expense' | 'saving';
    transaction_type: '-' | 'payable' | 'receivable';
    date: string;
    amount: string;
    description: string;
    remark: string;
    isactive: boolean;
};
type Transaction = Omit<TransactionForm, RelationField | 'date' | 'description' | 'remark'> &
    Record<RelationField, number | null> & {
        id: number;
        date: string | null;
        description: string | null;
        remark: string | null;
        budget: Pick<Budget, 'id' | 'budget_code' | 'title'> | null;
        category: Option | null;
        account: Option | null;
        currency: Option | null;
    };
type Props = {
    transactions: Transaction[];
    budgets: Budget[];
    categories: Category[];
    accounts: Option[];
    currencies: Option[];
    budgetItems: BudgetItem[];
    status?: string;
};
type SortField =
    | 'transaction_code'
    | 'date'
    | 'type'
    | 'budget'
    | 'category'
    | 'account'
    | 'currency'
    | 'amount'
    | 'transaction_type'
    | 'description'
    | 'isactive';
const columns: { label: string; field: SortField }[] = [
    { label: 'Code', field: 'transaction_code' },
    { label: 'Date', field: 'date' },
    { label: 'Type', field: 'type' },
    { label: 'Budget', field: 'budget' },
    { label: 'Category', field: 'category' },
    { label: 'Account', field: 'account' },
    { label: 'Currency', field: 'currency' },
    { label: 'Amount', field: 'amount' },
    { label: 'Payment type', field: 'transaction_type' },
    { label: 'Description', field: 'description' },
    { label: 'Status', field: 'isactive' },
];
const emptyForm: TransactionForm = {
    transaction_code: '',
    type: 'expense',
    transaction_type: '-',
    budget_id: '',
    category_id: '',
    account_id: '',
    currency_id: '',
    budget_item_id: '',
    date: '',
    amount: '0.00',
    description: '',
    remark: '',
    isactive: true,
};

export default function Transactions({ transactions, budgets, categories, accounts, currencies, budgetItems, status }: Props) {
    const [editing, setEditing] = useState<number | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [sortField, setSortField] = useState<SortField>('date');
    const [direction, setDirection] = useState<'asc' | 'desc'>('desc');
    const [toast, setToast] = useState<{ message: string; id: number } | null>(status ? { message: status, id: 0 } : null);
    const dismissToast = useCallback(() => setToast(null), []);
    const form = useForm<TransactionForm>(emptyForm);
    const deletion = useForm({});
    const busy = form.processing || deletion.processing;

    function displayValue(transaction: Transaction, field: SortField): string {
        if (field === 'budget') return transaction.budget?.title ?? '';
        if (field === 'category' || field === 'account') return transaction[field]?.name ?? '';
        if (field === 'currency') return transaction.currency?.code ?? '';
        if (field === 'isactive') return transaction.isactive ? 'Active' : 'Inactive';
        return transaction[field] ?? '';
    }
    const query = search.trim().toLocaleLowerCase();
    const results = transactions
        .filter((transaction) =>
            [...columns.map(({ field }) => displayValue(transaction, field)), transaction.remark ?? ''].some((value) =>
                value.toLocaleLowerCase().includes(query),
            ),
        )
        .sort((a, b) => {
            const comparison =
                (sortField === 'amount'
                    ? Number(a.amount) - Number(b.amount)
                    : displayValue(a, sortField).localeCompare(displayValue(b, sortField), undefined, { sensitivity: 'base', numeric: true })) ||
                a.id - b.id;
            return direction === 'asc' ? comparison : -comparison;
        });
    const pageCount = Math.max(1, Math.ceil(results.length / pageSize));
    const currentPage = Math.min(page, pageCount);
    const startIndex = (currentPage - 1) * pageSize;
    const rows = results.slice(startIndex, startIndex + pageSize);
    const matchingItems = budgetItems.filter(
        (item) =>
            item.type === form.data.type &&
            String(item.budget_id ?? '') === form.data.budget_id &&
            String(item.category_id ?? '') === form.data.category_id &&
            String(item.currency_id ?? '') === form.data.currency_id,
    );
    const relationOptions: { field: RelationField; label: string; options: { value: string; label: string }[] }[] = [
        {
            field: 'budget_id',
            label: 'Budget',
            options: budgets.map((budget) => ({ value: String(budget.id), label: `${budget.budget_code} - ${budget.title}` })),
        },
        {
            field: 'category_id',
            label: 'Category',
            options: categories
                .filter((category) => category.type === form.data.type)
                .map((category) => ({ value: String(category.id), label: `${category.code} - ${category.name}` })),
        },
        {
            field: 'account_id',
            label: 'Account',
            options: accounts.map((account) => ({ value: String(account.id), label: `${account.code} - ${account.name}` })),
        },
        {
            field: 'currency_id',
            label: 'Currency',
            options: currencies.map((currency) => ({ value: String(currency.id), label: `${currency.code} - ${currency.name}` })),
        },
        {
            field: 'budget_item_id',
            label: 'Budget item',
            options: matchingItems.map((item) => ({
                value: String(item.id),
                label: `Item #${item.id} - ${categories.find((category) => category.id === item.category_id)?.name ?? item.type}`,
            })),
        },
    ];

    function notify(message: string) {
        setToast((previous) => ({ message, id: (previous?.id ?? 0) + 1 }));
    }
    function close() {
        setDialogOpen(false);
        setEditing(null);
        form.setData(emptyForm);
        form.clearErrors();
    }
    function edit(transaction: Transaction) {
        setEditing(transaction.id);
        form.clearErrors();
        form.setData({
            transaction_code: transaction.transaction_code,
            type: transaction.type,
            transaction_type: transaction.transaction_type,
            date: transaction.date ?? '',
            amount: transaction.amount,
            description: transaction.description ?? '',
            remark: transaction.remark ?? '',
            isactive: transaction.isactive,
            budget_id: String(transaction.budget_id ?? ''),
            category_id: String(transaction.category_id ?? ''),
            currency_id: String(transaction.currency_id ?? ''),
            account_id: String(transaction.account_id ?? ''),
            budget_item_id: String(transaction.budget_item_id ?? ''),
        });
        setDialogOpen(true);
    }
    function submit(event: FormEvent) {
        event.preventDefault();
        const options = {
            preserveScroll: true,
            onSuccess: () => {
                notify(editing !== null ? 'Transaction updated.' : 'Transaction created.');
                close();
            },
        };
        if (editing !== null) form.put(route('transactions.update', editing), options);
        else form.post(route('transactions.store'), options);
    }
    function remove(transaction: Transaction) {
        if (!window.confirm(`Delete transaction "${transaction.transaction_code}"?`)) return;
        deletion.delete(route('transactions.destroy', transaction.id), { preserveScroll: true, onSuccess: () => notify('Transaction deleted.') });
    }
    function selectRelation(field: RelationField, value: string) {
        const selected = value === 'none' ? '' : value;
        form.setData((data) => ({
            ...data,
            [field]: selected,
            ...(field !== 'account_id' && field !== 'budget_item_id' ? { budget_item_id: '' } : {}),
            ...(field === 'budget_id' && selected
                ? { currency_id: String(budgets.find((budget) => String(budget.id) === selected)?.currency_id ?? '') }
                : {}),
        }));
    }
    function sortBy(field: SortField) {
        setPage(1);
        if (sortField === field) setDirection((value) => (value === 'asc' ? 'desc' : 'asc'));
        else {
            setSortField(field);
            setDirection('asc');
        }
    }

    return (
        <AppLayout breadcrumbs={[{ title: 'Transactions', href: '/transactions' }]}>
            <Head title="Transactions" />
            {toast && <SuccessToast key={toast.id} message={toast.message} onDismiss={dismissToast} />}
            <div className="space-y-6 p-4 md:p-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold">Transactions</h1>
                        <p className="text-sm text-muted-foreground">Manage income, expense, and saving transactions.</p>
                    </div>
                    <Button
                        disabled={busy}
                        onClick={() => {
                            close();
                            setDialogOpen(true);
                        }}
                    >
                        Add Transaction
                    </Button>
                </div>
                <Dialog
                    open={dialogOpen}
                    onOpenChange={(open) => {
                        if (!open && !form.processing) close();
                    }}
                >
                    <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>{editing !== null ? 'Edit Transaction' : 'Add Transaction'}</DialogTitle>
                            <DialogDescription>Enter the transaction details below.</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={submit} className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="transaction-code">Code</Label>
                                    <Input
                                        id="transaction-code"
                                        required
                                        maxLength={255}
                                        value={form.data.transaction_code}
                                        onChange={(event) => form.setData('transaction_code', event.target.value)}
                                    />
                                    <InputError message={form.errors.transaction_code} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="transaction-date">Date</Label>
                                    <Input
                                        id="transaction-date"
                                        type="date"
                                        value={form.data.date}
                                        onChange={(event) => form.setData('date', event.target.value)}
                                    />
                                    <InputError message={form.errors.date} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="transaction-type">Type</Label>
                                    <Select
                                        value={form.data.type}
                                        onValueChange={(value) =>
                                            form.setData((data) => ({
                                                ...data,
                                                type: value as TransactionForm['type'],
                                                category_id: '',
                                                budget_item_id: '',
                                            }))
                                        }
                                    >
                                        <SelectTrigger id="transaction-type">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="income">Income</SelectItem>
                                            <SelectItem value="expense">Expense</SelectItem>
                                            <SelectItem value="saving">Saving</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <InputError message={form.errors.type} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="transaction-amount">Amount</Label>
                                    <Input
                                        id="transaction-amount"
                                        type="number"
                                        required
                                        min="0"
                                        max="9999999999.99"
                                        step="0.01"
                                        value={form.data.amount}
                                        onChange={(event) => form.setData('amount', event.target.value)}
                                    />
                                    <InputError message={form.errors.amount} />
                                </div>
                                {relationOptions.map(({ field, label, options }) => (
                                    <div key={field} className="space-y-2">
                                        <Label htmlFor={`transaction-${field}`}>{label}</Label>
                                        <Select value={form.data[field] || 'none'} onValueChange={(value) => selectRelation(field, value)}>
                                            <SelectTrigger id={`transaction-${field}`} aria-invalid={!!form.errors[field]}>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">None</SelectItem>
                                                {options.map((option) => (
                                                    <SelectItem key={option.value} value={option.value}>
                                                        {option.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <InputError message={form.errors[field]} />
                                    </div>
                                ))}
                                <div className="space-y-2">
                                    <Label htmlFor="transaction-payment-type">Payment type</Label>
                                    <Select
                                        value={form.data.transaction_type}
                                        onValueChange={(value) => form.setData('transaction_type', value as TransactionForm['transaction_type'])}
                                    >
                                        <SelectTrigger id="transaction-payment-type">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="-">None</SelectItem>
                                            <SelectItem value="payable">Payable</SelectItem>
                                            <SelectItem value="receivable">Receivable</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <InputError message={form.errors.transaction_type} />
                                </div>
                            </div>
                            {(['description', 'remark'] as const).map((field) => (
                                <div key={field} className="space-y-2">
                                    <Label htmlFor={`transaction-${field}`}>{field === 'description' ? 'Description' : 'Remarks'}</Label>
                                    <textarea
                                        id={`transaction-${field}`}
                                        className="min-h-20 w-full rounded-md border bg-background px-3 py-2 text-sm"
                                        value={form.data[field]}
                                        onChange={(event) => form.setData(field, event.target.value)}
                                    />
                                    <InputError message={form.errors[field]} />
                                </div>
                            ))}
                            <div className="flex items-center gap-2">
                                <input
                                    id="transaction-active"
                                    type="checkbox"
                                    checked={form.data.isactive}
                                    onChange={(event) => form.setData('isactive', event.target.checked)}
                                />
                                <Label htmlFor="transaction-active">Active</Label>
                                <InputError message={form.errors.isactive} />
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" disabled={form.processing} onClick={close}>
                                    Cancel
                                </Button>
                                <Button disabled={busy}>{editing !== null ? 'Save changes' : 'Create transaction'}</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                    <div className="flex-1 space-y-2">
                        <Label htmlFor="transaction-search">Search</Label>
                        <Input
                            id="transaction-search"
                            type="search"
                            placeholder="Search transactions..."
                            value={search}
                            onChange={(event) => {
                                setSearch(event.target.value);
                                setPage(1);
                            }}
                        />
                    </div>
                    <div className="space-y-2 sm:w-36">
                        <Label htmlFor="transaction-page-size">Rows per page</Label>
                        <Select
                            value={String(pageSize)}
                            onValueChange={(value) => {
                                setPageSize(Number(value));
                                setPage(1);
                            }}
                        >
                            <SelectTrigger id="transaction-page-size">
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
                    Showing {results.length === 0 ? 0 : startIndex + 1}-{Math.min(startIndex + pageSize, results.length)} of {results.length}{' '}
                    transactions{query && ` (${transactions.length} total)`}
                </p>
                <div className="overflow-x-auto rounded-xl border">
                    <table className="w-full text-left text-sm">
                        <caption className="sr-only">Transactions</caption>
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
                                        aria-sort={sortField === field ? (direction === 'asc' ? 'ascending' : 'descending') : 'none'}
                                    >
                                        <button
                                            type="button"
                                            onClick={() => sortBy(field)}
                                            className="flex items-center gap-2 rounded-sm whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2"
                                            aria-label={`Sort by ${label}, ${sortField === field && direction === 'asc' ? 'descending' : 'ascending'}`}
                                        >
                                            {label}
                                            {sortField !== field ? (
                                                <ArrowUpDown className="size-4" aria-hidden="true" />
                                            ) : direction === 'asc' ? (
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
                                    <td colSpan={columns.length + 2} className="p-6 text-center text-muted-foreground">
                                        {transactions.length === 0
                                            ? 'No transactions yet. Add your first transaction above.'
                                            : 'No transactions match your search.'}
                                    </td>
                                </tr>
                            )}
                            {rows.map((transaction, index) => (
                                <tr key={transaction.id} className="border-b last:border-0">
                                    <td className="p-3">{startIndex + index + 1}</td>
                                    {columns.map(({ field }) => (
                                        <td
                                            key={field}
                                            className={
                                                field === 'description' ? 'max-w-xs p-3 break-words whitespace-pre-wrap' : 'p-3 whitespace-nowrap'
                                            }
                                        >
                                            {field === 'type' ? (
                                                <Badge variant="secondary" className="capitalize">
                                                    {transaction.type}
                                                </Badge>
                                            ) : (
                                                displayValue(transaction, field) || '-'
                                            )}
                                        </td>
                                    ))}
                                    <td className="p-3">
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                disabled={busy}
                                                onClick={() => edit(transaction)}
                                                aria-label={`Edit ${transaction.transaction_code}`}
                                            >
                                                Edit
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                disabled={busy}
                                                onClick={() => remove(transaction)}
                                                aria-label={`Delete ${transaction.transaction_code}`}
                                            >
                                                Delete
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <nav aria-label="Transaction pagination" className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm text-muted-foreground">
                        Page {currentPage} of {pageCount}
                    </p>
                    <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" disabled={currentPage === 1} onClick={() => setPage(1)}>
                            First
                        </Button>
                        <Button size="sm" variant="outline" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>
                            Previous
                        </Button>
                        <Button size="sm" variant="outline" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}>
                            Next
                        </Button>
                        <Button size="sm" variant="outline" disabled={currentPage === pageCount} onClick={() => setPage(pageCount)}>
                            Last
                        </Button>
                    </div>
                </nav>
            </div>
        </AppLayout>
    );
}
