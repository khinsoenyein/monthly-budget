<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class CategoryTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_cannot_access_category_routes(): void
    {
        $category = Category::create($this->payload());
        $this->get(route('categories.index'))->assertRedirect(route('login'));
        $this->post(route('categories.store'), $this->payload())->assertRedirect(route('login'));
        $this->put(route('categories.update', $category), $this->payload())->assertRedirect(route('login'));
        $this->delete(route('categories.destroy', $category))->assertRedirect(route('login'));
    }

    public function test_categories_can_be_created_listed_updated_and_soft_deleted(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);
        $this->post(route('categories.store'), $this->payload())->assertRedirect(route('categories.index'));
        $category = Category::firstOrFail();
        $this->assertSame($user->id, $category->created_user);
        $this->get(route('categories.index'))->assertInertia(fn (Assert $page) => $page
            ->component('categories/index')->has('categories', 1)->where('categories.0.code', 'EF'));
        $this->put(route('categories.update', $category), $this->payload(['name' => 'Groceries', 'isactive' => false]))
            ->assertRedirect(route('categories.index'));
        $this->assertDatabaseHas('categories', ['id' => $category->id, 'name' => 'Groceries', 'code' => 'EG', 'isactive' => false, 'modified_user' => $user->id]);
        $this->delete(route('categories.destroy', $category))->assertRedirect(route('categories.index'));
        $this->assertSoftDeleted($category);
        $this->assertDatabaseHas('categories', ['id' => $category->id, 'isdeleted' => true]);
        $this->get(route('categories.index'))->assertInertia(fn (Assert $page) => $page->has('categories', 0));
        $this->put(route('categories.update', $category), $this->payload())->assertNotFound();
    }

    public function test_duplicate_codes_receive_suffixes_and_invalid_fields_are_rejected(): void
    {
        $this->actingAs(User::factory()->create());
        $category = Category::create($this->payload());
        $other = Category::create($this->payload(['code' => 'OTHER', 'name' => 'Other']));
        $this->post(route('categories.store'), $this->payload())->assertSessionHasNoErrors();
        $this->assertDatabaseHas('categories', ['code' => 'EF1']);
        $this->put(route('categories.update', $other), $this->payload())->assertSessionHasNoErrors();
        $this->assertSame('EF2', $other->fresh()->code);
        $this->put(route('categories.update', $other), $this->payload(['remark' => 'Updated']))->assertSessionHasNoErrors();
        $this->assertSame('EF2', $other->fresh()->code);
        $this->post(route('categories.store'), $this->payload(['code' => '', 'name' => '', 'type' => 'invalid', 'isactive' => 'invalid']))
            ->assertSessionHasErrors(['name', 'type', 'isactive']);
        $this->put(route('categories.update', $category), $this->payload())->assertSessionHasNoErrors();
        $this->assertDatabaseCount('categories', 3);
    }

    private function payload(array $overrides = []): array
    {
        return array_replace(['code' => 'EF', 'name' => 'Food', 'type' => 'expense', 'remark' => 'Daily meals', 'isactive' => true], $overrides);
    }

    public function test_code_is_generated_from_type_and_name_and_ignores_supplied_code(): void
    {
        $this->actingAs(User::factory()->create());
        $this->post(route('categories.store'), $this->payload(['name' => '  Meter   Bill  ', 'code' => 'CUSTOM']))
            ->assertSessionHasNoErrors();
        $category = Category::firstOrFail();
        $this->assertSame('EMB', $category->code);
        $data = $this->payload(['name' => 'Monthly Salary', 'type' => 'income']);
        unset($data['code']);
        $this->put(route('categories.update', $category), $data)->assertSessionHasNoErrors();
        $this->assertSame('IMS', $category->fresh()->code);
        $this->post(route('categories.store'), $this->payload(['name' => 'Meal Budget']))->assertSessionHasNoErrors();
        $this->post(route('categories.store'), $this->payload(['name' => 'Meter Bill']))->assertSessionHasNoErrors();
        $this->assertDatabaseHas('categories', ['name' => 'Meter Bill', 'code' => 'EMB1']);
    }

    public function test_soft_deleted_codes_remain_reserved(): void
    {
        $this->actingAs(User::factory()->create());
        $category = Category::create($this->payload());
        $category->delete();
        $this->post(route('categories.store'), $this->payload())->assertSessionHasNoErrors();
        $this->assertSame('EF1', Category::firstOrFail()->code);
    }
}
