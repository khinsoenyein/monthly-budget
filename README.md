# 📘 Monthly Budget Web App

A personal finance tracking system built with **Laravel**, **React**, and **shadcn/ui**. This application helps users manage their **monthly budget**, **income**, **expenses**, **accounts**, **payables**, **receivables**, and **savings** — all in one place.

---

## 🚀 Features

* 🔒 User authentication (optional)
* 📅 Monthly budget creation with opening/closing balance
* 📊 Plan vs. Actual tracking per category
* 💰 Multi-currency support
* 💸 Income & Expense recording
* 🏦 Account management (bank, wallet, cash)
* 📥 Receivables tracking
* 📤 Payables tracking
* 🔄 Linked transactions to accounts, payables & receivables
* 🧾 Reporting-ready data structure

---

## 🧱 Tech Stack

| Layer           | Technology           |
| --------------- | -------------------- |
| Backend         | Laravel 11+          |
| Frontend        | React (Vite)         |
| UI Library      | shadcn/ui + Tailwind |
| Auth (optional) | Laravel Breeze       |
| DB              | MySQL or PostgreSQL  |

---

## ⚙️ Setup Instructions

1. **Clone the repo**

```bash
git clone https://github.com/khinsoenyein/monthly-budget.git
cd monthly-budget
```

2. **Install dependencies**

```bash
composer install
npm install && npm run dev
```

3. **Set up environment**

```bash
cp .env.example .env
php artisan key:generate
```

4. **Configure DB** in `.env`

```dotenv
DB_DATABASE=your_db_name
DB_USERNAME=your_db_user
DB_PASSWORD=your_password
```

5. **Run migrations**

```bash
php artisan migrate
```

6. (Optional) **Seed currency & demo data**

```bash
php artisan db:seed
```

7. **Start the server**

```bash
php artisan serve
```

8. **Visit the app**

```bash
http://localhost:8000
```

---

## 📁 Key Folders

* `resources/js` – React frontend
* `resources/views` – Blade entry point
* `app/Models` – Laravel Eloquent models
* `app/Http/Controllers/Api` – API controllers
* `database/migrations` – Schema files

---

## 📌 Core Database Tables

* `budgets` – Monthly budget plans
* `budget_items` – Plan/actual by category
* `transactions` – Income/expense + payables/receivables
* `accounts` – Cash, bank, wallet, etc.
* `payables` / `receivables` – Amounts to pay/receive
* `entities` – People/organizations you owe/receive from
* `currencies` – Currency definitions

---

## 💡 Future Enhancements

* PDF export of budget reports
* Graphs for cash flow visualization
* Notifications/reminders for due payables/receivables
* Budget auto-closing and rollover
* Multi-user household sharing

---

## 🧑‍💻 Author

Created by \[Khin Soe Nyein]. Contributions welcome!

---

## 📄 License

Free to use and modify.
