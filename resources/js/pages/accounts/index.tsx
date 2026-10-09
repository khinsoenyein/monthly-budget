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

type AccountForm = { code: string; name: string; type: 'bank' | 'e-wallet' | 'credit-card' | 'cash'; remark: string; isactive: boolean; sort_order: string };
type Account = Omit<AccountForm, 'remark' | 'sort_order'> & { id: number; remark: string | null; sort_order: number };
type SortField = 'name' | 'code' | 'type' | 'isactive' | 'remark' | 'sort_order';
const sortableColumns: { label: string; field: SortField }[] = [
    { label: 'Code', field: 'code' },
    { label: 'Name', field: 'name' },
    { label: 'Type', field: 'type' },
    { label: 'Status', field: 'isactive' },
    { label: 'Remarks', field: 'remark' },
    { label: 'Sort order', field: 'sort_order' },
];
const emptyForm: AccountForm = { code: '', name: '', type: 'cash', remark: '', isactive: true, sort_order: '0' };

export default function Accounts({ accounts, status }: { accounts: Account[]; status?: string }) {
    const [editing, setEditing] = useState<number | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [sortField, setSortField] = useState<SortField>('sort_order');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [toast, setToast] = useState<{ message: string; id: number } | null>(status ? { message: status, id: 0 } : null);
    const dismissToast = useCallback(() => setToast(null), []);
    const form = useForm<AccountForm>(emptyForm);
    const deletion = useForm({});
    const query = search.trim().toLocaleLowerCase();
    const visibleAccounts = accounts
        .filter((account) =>
            [account.code, account.name, account.type, account.isactive ? 'active' : 'inactive', account.remark ?? ''].some((value) =>
                value.toLocaleLowerCase().includes(query),
            ),
        )
        .sort((a, b) => {
            const value = (account: Account) => (sortField === 'isactive' ? (account.isactive ? 'Active' : 'Inactive') : (account[sortField] ?? ''));
            const comparison =
                (sortField === 'sort_order'
                    ? a.sort_order - b.sort_order
                    : String(value(a)).localeCompare(String(value(b)), undefined, { sensitivity: 'base', numeric: true })) ||
                a.name.localeCompare(b.name) ||
                a.id - b.id;
            return sortDirection === 'asc' ? comparison : -comparison;
        });
    const pageCount = Math.max(1, Math.ceil(visibleAccounts.length / pageSize));
    const currentPage = Math.min(page, pageCount);
    const startIndex = (currentPage - 1) * pageSize;
    const pageAccounts = visibleAccounts.slice(startIndex, startIndex + pageSize);

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
                setToast((previous) => ({ message: editing !== null ? 'Account updated.' : 'Account created.', id: (previous?.id ?? 0) + 1 }));
                reset();
            },
        };
        if (editing !== null) form.put(route('accounts.update', editing), options);
        else form.post(route('accounts.store'), options);
    }

    function edit(account: Account) {
        setEditing(account.id);
        form.clearErrors();
        form.setData({
            code: account.code,
            name: account.name,
            type: account.type,
            remark: account.remark ?? '',
            isactive: account.isactive,
            sort_order: String(account.sort_order),
        });
        setDialogOpen(true);
    }

    function remove(account: Account) {
        if (!window.confirm(`Delete account "${account.name}"?`)) return;
        deletion.delete(route('accounts.destroy', account.id), {
            preserveScroll: true,
            onSuccess: () => {
                setToast((previous) => ({ message: 'Account deleted.', id: (previous?.id ?? 0) + 1 }));
                if (editing === account.id) reset();
            },
        });
    }

    return (
        <AppLayout breadcrumbs={[{ title: 'Accounts', href: '/accounts' }]}>
            <Head title="Accounts" />
            {toast && <SuccessToast key={toast.id} message={toast.message} onDismiss={dismissToast} />}
            <div className="space-y-6 p-4 md:p-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold">Accounts</h1>
                        <p className="text-sm text-muted-foreground">Manage accounts.</p>
                    </div>
                    <Button
                        onClick={() => {
                            reset();
                            setDialogOpen(true);
                        }}
                        disabled={form.processing || deletion.processing}
                    >
                        Add Account
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
                            <DialogTitle>{editing !== null ? 'Edit Account' : 'Add Account'}</DialogTitle>
                            <DialogDescription>
                                {editing !== null ? 'Update the account details below.' : 'Enter the details for your new account.'}
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
                                    <Input
                                        id="code"
                                        value={form.data.code}
                                        onChange={(event) => form.setData('code', event.target.value)}
                                        required
                                        maxLength={255}
                                    />
                                    <InputError message={form.errors.code} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="type">Type</Label>
                                    <Select value={form.data.type} onValueChange={(value) => form.setData('type', value as AccountForm['type'])}>
                                        <SelectTrigger id="type" aria-invalid={!!form.errors.type}>
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="bank">Bank</SelectItem>
                                            <SelectItem value="e-wallet">E-wallet</SelectItem>
                                            <SelectItem value="credit-card">Credit card</SelectItem>
                                            <SelectItem value="cash">Cash</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <InputError message={form.errors.type} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="sort-order">Sort order</Label>
                                    <Input
                                        id="sort-order"
                                        type="number"
                                        step="1"
                                        min="-2147483648"
                                        max="2147483647"
                                        required
                                        value={form.data.sort_order}
                                        onChange={(event) => form.setData('sort_order', event.target.value)}
                                    />
                                    <InputError message={form.errors.sort_order} />
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
                                    {editing !== null ? 'Save changes' : 'Create account'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                    <div className="flex-1 space-y-2">
                        <Label htmlFor="account-search">Search</Label>
                        <Input
                            id="account-search"
                            type="search"
                            placeholder="Search accounts..."
                            value={search}
                            onChange={(event) => {
                                setSearch(event.target.value);
                                setPage(1);
                            }}
                        />
                    </div>
                    <div className="space-y-2 sm:w-36">
                        <Label htmlFor="account-page-size">Rows per page</Label>
                        <Select
                            value={String(pageSize)}
                            onValueChange={(value) => {
                                setPageSize(Number(value));
                                setPage(1);
                            }}
                        >
                            <SelectTrigger id="account-page-size">
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
                    Showing {visibleAccounts.length === 0 ? 0 : startIndex + 1}–{Math.min(startIndex + pageSize, visibleAccounts.length)} of{' '}
                    {visibleAccounts.length} accounts
                    {query && ` (${accounts.length} total)`}
                </p>
                <div className="overflow-x-auto rounded-xl border">
                    <table className="w-full text-left text-sm">
                        <caption className="sr-only">Accounts</caption>
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
                            {visibleAccounts.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="p-6 text-center text-muted-foreground">
                                        {accounts.length === 0
                                            ? 'No accounts yet. Click Add Account to create your first account.'
                                            : 'No accounts match your search.'}
                                    </td>
                                </tr>
                            )}
                            {pageAccounts.map((account, index) => (
                                <tr key={account.id} className="border-b last:border-0">
                                    <td className="p-3">{startIndex + index + 1}</td>
                                    <td className="p-3">{account.code}</td>
                                    <td className="p-3">{account.name}</td>
                                    <td className="p-3">
                                        <Badge
                                            variant="outline"
                                            className={
                                                account.type === 'bank'
                                                    ? 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300'
                                                    :   account.type === 'e-wallet'
                                                      ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300'
                                                      : account.type === 'credit-card'
                                                      ? 'border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-950 dark:text-purple-300'
                                                      : 'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300'
                                            }
                                        >
                                            {account.type === 'bank' ? 'Bank' : account.type === 'e-wallet' ? 'E-wallet' : account.type === 'credit-card' ? 'Credit Card' : 'Cash'}
                                        </Badge>
                                    </td>
                                    <td className="p-3">{account.isactive ? 'Active' : 'Inactive'}</td>
                                    <td className="max-w-xs p-3 break-words whitespace-pre-wrap">{account.remark || '—'}</td>
                                    <td className="p-3">{account.sort_order}</td>
                                    <td className="p-3">
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => edit(account)}
                                                disabled={form.processing || deletion.processing}
                                                aria-label={`Edit ${account.name}`}
                                            >
                                                Edit
                                            </Button>
                                            {/* <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => remove(account)}
                                                disabled={form.processing || deletion.processing}
                                                aria-label={`Delete ${account.name}`}
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
                <nav aria-label="Account pagination" className="flex flex-wrap items-center justify-between gap-3">
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
