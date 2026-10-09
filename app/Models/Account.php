<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Account extends Model
{
    use SoftDeletes;

    protected $fillable = ['code', 'name', 'type', 'remark', 'isactive', 'sort_order'];

    protected function casts(): array
    {
        return ['isactive' => 'boolean', 'isdeleted' => 'boolean', 'sort_order' => 'integer'];
    }
}
