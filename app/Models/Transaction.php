<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Transaction extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'transaction_code', 'budget_id', 'type', 'category_id', 'budget_item_id',
        'currency_id', 'account_id', 'date', 'amount', 'description', 'transaction_type', 'remark', 'isactive',
    ];

    protected function casts(): array
    {
        return ['date' => 'date:Y-m-d', 'amount' => 'decimal:2', 'isactive' => 'boolean', 'isdeleted' => 'boolean'];
    }

    public function budget(): BelongsTo
    {
        return $this->belongsTo(Budget::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class);
    }

    public function currency(): BelongsTo
    {
        return $this->belongsTo(Currency::class);
    }

    public function budgetItem(): BelongsTo
    {
        return $this->belongsTo(BudgetItem::class);
    }
}
