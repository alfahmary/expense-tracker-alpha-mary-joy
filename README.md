# Expense Tracker

## Overview
A simple Expense Tracker web application built with HTML, CSS and vanilla JavaScript, created for the LTS Software Developer Intern recruitment task. Users can record income and expenses, see monthly spending broken down by category, and keep their data in the browser after a refresh.

## Features
- Add, edit and delete income and expense transactions (amount, category, date, description)
- Total income, total expenses and current balance, updated automatically
- Monthly overview: pick a month to see its total spent, expense count, average expense, and top spending category
- Category-wise spending breakdown for the selected month, shown as a donut chart with a legend (built with plain CSS, no chart library)
- Filter transactions by type (income / expense) and by category; both filters work together
- Newest transactions shown first
- Data saved in Local Storage and preserved after refreshing the page
- Inline validation messages for every field, shown live while typing (amount must be a number greater than 0; description must contain letters only)
- "+ Add Transaction" button that jumps straight to the form
- Responsive layout for desktop, tablet and mobile (table becomes stacked cards on small screens)
- Amounts shown in Indian Rupees (₹)

## Technologies Used
- HTML5
- CSS3
- JavaScript (ES6+, no frameworks or libraries)
- Browser Local Storage

## Project Structure
```
expense-tracker-alpha-mary-joy/
├── index.html
├── style.css
├── script.js
└── README.md
```

## How to Run
1. Download or clone this repository.
2. Open `index.html` in any modern web browser (double-click the file, or right-click it and choose "Open with" your browser).

No installation, server, or build step is required — everything runs directly in the browser.

## Local Storage
Transactions are stored in the browser under the key `expenseTrackerTransactions` as a JSON array. Each transaction has an `id`, `type`, `amount`, `category`, `date` and `description`. Data stays on the user's own device and browser; clearing the browser's site data will remove it.

## Author
Alpha Mary Joy
GitHub: https://github.com/alfahmary