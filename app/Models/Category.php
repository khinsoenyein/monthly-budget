<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Category extends Model
{
    use SoftDeletes;

    protected $fillable = ['code', 'name', 'type', 'remark', 'isactive', 'default_plan_amount'];

    protected function casts(): array
    {
        return ['isactive' => 'boolean', 'isdeleted' => 'boolean', 'default_plan_amount' => 'decimal:2'];
    }
}
