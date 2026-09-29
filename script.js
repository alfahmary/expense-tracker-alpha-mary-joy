"use strict";

/* =====================================================
   CONSTANTS
   ===================================================== */
const STORAGE_KEY = "expenseTrackerTransactions";

const CATEGORIES = {
    income: ["Salary", "Freelance", "Other Income"],
    expense: ["Food", "Transport", "Shopping", "Entertainment",
              "Bills", "Health", "Education", "Other"]
};

const MAX_AMOUNT = 1000000000;

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June",
                     "July", "August", "September", "October", "November", "December"];

// Colors assigned to categories in the donut chart and legend, in order
const CHART_COLORS = ["#4f46e5", "#7e65b8", "#ec4899", "#f59e0b",
                       "#10b981", "#06b6d4", "#f43f5e", "#84cc16"];

const currencyFormatter = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR"
});

/* =====================================================
   STATE
   ===================================================== */
let transactions = [];
let editingId = null;

/* =====================================================
   DOM REFERENCES
   ===================================================== */
const navAddButton = document.getElementById("nav-add-button");
const addTransactionPanel = document.getElementById("add-transaction-panel");

const form = document.getElementById("transaction-form");
const formTitle = document.getElementById("form-title");
const typeSelect = document.getElementById("type");
const amountInput = document.getElementById("amount");
const categorySelect = document.getElementById("category");
const dateInput = document.getElementById("date");
const descriptionInput = document.getElementById("description");
const submitButton = document.getElementById("submit-button");
const cancelButton = document.getElementById("cancel-button");

const totalIncomeElement = document.getElementById("total-income");
const totalExpensesElement = document.getElementById("total-expenses");
const balanceElement = document.getElementById("balance");

const filterTypeSelect = document.getElementById("filter-type");
const filterCategorySelect = document.getElementById("filter-category");
const emptyMessage = document.getElementById("empty-message");
const transactionTable = document.getElementById("transaction-table");
const transactionList = document.getElementById("transaction-list");

const monthSelect = document.getElementById("overview-month");
const monthExpensesElement = document.getElementById("month-expenses");
const monthExpenseCountElement = document.getElementById("month-expense-count");
const monthCaptionElement = document.getElementById("month-caption");
const monthAverageElement = document.getElementById("month-average");
const monthTopCategoryElement = document.getElementById("month-top-category");

const chartMonthPill = document.getElementById("chart-month-pill");
const chartEmptyMessage = document.getElementById("chart-empty-message");
const breakdownBody = document.getElementById("breakdown-body");
const categoryDonut = document.getElementById("category-donut");
const donutTotal = document.getElementById("donut-total");
const categoryLegend = document.getElementById("category-legend");

// Field name -> input element (used by the validation code)
const fields = {
    type: typeSelect,
    amount: amountInput,
    category: categorySelect,
    date: dateInput,
    description: descriptionInput
};

/* =====================================================
   LOCAL STORAGE
   ===================================================== */
function loadTransactions() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === null) {
        return [];
    }
    try {
        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        return [];
    }
}

function saveTransactions() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

/* =====================================================
   FORMATTING HELPERS
   ===================================================== */
function formatCurrency(amount) {
    return currencyFormatter.format(amount);
}

function formatDate(dateString) {
    const [year, month, day] = dateString.split("-");
    return `${day}/${month}/${year}`;
}

function formatMonth(monthValue) {
    const [year, month] = monthValue.split("-");
    return `${MONTH_NAMES[Number(month) - 1]} ${year}`;
}

function getTodayString() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

/* =====================================================
   FORM: CATEGORY OPTIONS
   ===================================================== */
function createOption(value, label) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    return option;
}

function populateCategoryOptions(type, selectedCategory = "") {
    const options = CATEGORIES[type].map(function (name) {
        return createOption(name, name);
    });
    categorySelect.replaceChildren(createOption("", "Select a category"), ...options);
    categorySelect.value = selectedCategory;
}

/* =====================================================
   FORM: VALIDATION
   ===================================================== */
function getFormValues() {
    return {
        type: typeSelect.value,
        amountText: amountInput.value.trim(),
        amountHasBadInput: amountInput.validity.badInput,
        category: categorySelect.value,
        date: dateInput.value,
        description: descriptionInput.value.trim()
    };
}

function validateForm(values) {
    const errors = {};

    if (values.type !== "income" && values.type !== "expense") {
        errors.type = "Please select a transaction type.";
    }

    if (values.amountHasBadInput) {
        errors.amount = "Amount must be a valid number.";
    } else if (values.amountText === "") {
        errors.amount = "Amount is required.";
    } else {
        const amount = Number(values.amountText);
        if (!Number.isFinite(amount)) {
            errors.amount = "Amount must be a valid number.";
        } else if (amount <= 0) {
            errors.amount = "Amount must be greater than 0.";
        } else if (amount > MAX_AMOUNT) {
            errors.amount = "Amount is too large.";
        }
    }

    if (values.category === "") {
        errors.category = "Please select a category.";
    } else if (!CATEGORIES[values.type] || !CATEGORIES[values.type].includes(values.category)) {
        errors.category = "This category does not match the transaction type.";
    }

    if (values.date === "") {
        errors.date = "Please select a date.";
    }

    if (values.description === "") {
        errors.description = "Description is required.";
    } else if (!/^[A-Za-z\s]+$/.test(values.description)) {
        errors.description = "Description can only contain letters.";
    }

    return errors;
}

function showFieldError(fieldName, message) {
    const input = fields[fieldName];
    const errorElement = document.getElementById(`${fieldName}-error`);
    errorElement.textContent = message;
    input.classList.toggle("input-invalid", message !== "");
    input.setAttribute("aria-invalid", message !== "" ? "true" : "false");
}

function showErrors(errors) {
    Object.keys(fields).forEach(function (fieldName) {
        showFieldError(fieldName, errors[fieldName] || "");
    });
}

function clearErrors() {
    showErrors({});
}

function validateFieldLive(fieldName) {
    const errors = validateForm(getFormValues());
    showFieldError(fieldName, errors[fieldName] || "");
}

/* =====================================================
   FORM: RESET
   ===================================================== */
function resetForm() {
    form.reset();
    editingId = null;
    populateCategoryOptions(typeSelect.value);
    dateInput.value = getTodayString();
    clearErrors();

    formTitle.textContent = "Add Transaction";
    submitButton.textContent = "Add Transaction";
    cancelButton.hidden = true;
}

/* =====================================================
   CRUD
   ===================================================== */
function addTransaction(data) {
    transactions.push({ id: Date.now(), ...data });
}

function editTransaction(id) {
    const transaction = transactions.find(function (item) {
        return item.id === id;
    });
    if (transaction === undefined) {
        return;
    }

    editingId = transaction.id;
    typeSelect.value = transaction.type;
    populateCategoryOptions(transaction.type, transaction.category);
    amountInput.value = transaction.amount;
    dateInput.value = transaction.date;
    descriptionInput.value = transaction.description;
    clearErrors();

    formTitle.textContent = "Edit Transaction";
    submitButton.textContent = "Update Transaction";
    cancelButton.hidden = false;

    addTransactionPanel.scrollIntoView({ behavior: "smooth" });
    amountInput.focus();
}

function updateTransaction(id, data) {
    const index = transactions.findIndex(function (item) {
        return item.id === id;
    });
    if (index === -1) {
        return;
    }
    transactions[index] = { id: id, ...data };
}

function deleteTransaction(id) {
    const confirmed = window.confirm("Delete this transaction?");
    if (!confirmed) {
        return;
    }

    transactions = transactions.filter(function (item) {
        return item.id !== id;
    });

    if (editingId === id) {
        resetForm();
    }

    saveTransactions();
    refreshDisplay();
}

/* =====================================================
   FORM SUBMIT
   ===================================================== */
function handleSubmit(event) {
    event.preventDefault();

    const values = getFormValues();
    const errors = validateForm(values);
    showErrors(errors);

    const errorFieldNames = Object.keys(errors);
    if (errorFieldNames.length > 0) {
        fields[errorFieldNames[0]].focus();
        return;
    }

    const transactionData = {
        type: values.type,
        amount: Number(values.amountText),
        category: values.category,
        date: values.date,
        description: values.description
    };

    if (editingId === null) {
        addTransaction(transactionData);
    } else {
        updateTransaction(editingId, transactionData);
    }

    saveTransactions();
    refreshDisplay();
    resetForm();
}

/* =====================================================
   SUMMARY (all-time)
   ===================================================== */
function sumByType(list, type) {
    return list
        .filter(function (item) { return item.type === type; })
        .reduce(function (total, item) { return total + item.amount; }, 0);
}

function updateSummary() {
    const totalIncome = sumByType(transactions, "income");
    const totalExpenses = sumByType(transactions, "expense");
    const balance = totalIncome - totalExpenses;

    totalIncomeElement.textContent = formatCurrency(totalIncome);
    totalExpensesElement.textContent = formatCurrency(totalExpenses);
    balanceElement.textContent = formatCurrency(balance);
    balanceElement.classList.toggle("negative", balance < 0);
}

/* =====================================================
   FILTERING AND SORTING (transaction table)
   ===================================================== */
function filterTransactions() {
    const selectedType = filterTypeSelect.value;
    const selectedCategory = filterCategorySelect.value;

    return transactions.filter(function (item) {
        const typeMatches = selectedType === "all" || item.type === selectedType;
        const categoryMatches = selectedCategory === "all" || item.category === selectedCategory;
        return typeMatches && categoryMatches;
    });
}

function sortNewestFirst(list) {
    return [...list].sort(function (a, b) {
        if (a.date !== b.date) {
            return b.date.localeCompare(a.date);
        }
        return b.id - a.id;
    });
}

/* =====================================================
   TRANSACTION TABLE RENDERING
   ===================================================== */
function createCell(text, label, className) {
    const cell = document.createElement("td");
    cell.textContent = text;
    cell.dataset.label = label;
    if (className) {
        cell.className = className;
    }
    return cell;
}

function createActionButton(text, className, ariaLabel, onClick) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = text;
    button.className = className;
    button.setAttribute("aria-label", ariaLabel);
    button.addEventListener("click", onClick);
    return button;
}

function createTransactionRow(transaction) {
    const row = document.createElement("tr");

    const typeCell = document.createElement("td");
    typeCell.dataset.label = "Type";
    const badge = document.createElement("span");
    badge.className = `badge badge-${transaction.type}`;
    badge.textContent = transaction.type === "income" ? "Income" : "Expense";
    typeCell.appendChild(badge);

    const sign = transaction.type === "income" ? "+" : "-";
    const amountCell = createCell(
        `${sign} ${formatCurrency(transaction.amount)}`,
        "Amount",
        `amount-${transaction.type}`
    );

    const actionsCell = document.createElement("td");
    actionsCell.dataset.label = "Actions";
    const actionsWrapper = document.createElement("div");
    actionsWrapper.className = "actions";

    const editButton = createActionButton(
        "Edit", "btn-edit", `Edit transaction: ${transaction.description}`,
        function () { editTransaction(transaction.id); }
    );
    const deleteButton = createActionButton(
        "Delete", "btn-delete", `Delete transaction: ${transaction.description}`,
        function () { deleteTransaction(transaction.id); }
    );

    actionsWrapper.append(editButton, deleteButton);
    actionsCell.appendChild(actionsWrapper);

    row.append(
        createCell(formatDate(transaction.date), "Date"),
        typeCell,
        createCell(transaction.category, "Category"),
        createCell(transaction.description, "Description"),
        amountCell,
        actionsCell
    );

    return row;
}

function renderTransactions() {
    const visibleTransactions = sortNewestFirst(filterTransactions());
    transactionList.replaceChildren();

    if (visibleTransactions.length === 0) {
        emptyMessage.textContent = transactions.length === 0
            ? "No transactions yet. Add your first transaction above."
            : "No transactions match the selected filters.";
        emptyMessage.hidden = false;
        transactionTable.hidden = true;
        return;
    }

    emptyMessage.hidden = true;
    transactionTable.hidden = false;
    visibleTransactions.forEach(function (transaction) {
        transactionList.appendChild(createTransactionRow(transaction));
    });
}

/* =====================================================
   MONTHLY OVERVIEW + DONUT CHART
   ===================================================== */
function getAvailableMonths() {
    const months = transactions.map(function (item) {
        return item.date.slice(0, 7);
    });
    return [...new Set(months)].sort().reverse();
}

function populateMonthOptions() {
    const previousSelection = monthSelect.value;
    const months = getAvailableMonths();

    if (months.length === 0) {
        monthSelect.replaceChildren(createOption("", "No transactions yet"));
        monthSelect.disabled = true;
        return "";
    }

    monthSelect.disabled = false;
    monthSelect.replaceChildren(...months.map(function (month) {
        return createOption(month, formatMonth(month));
    }));

    monthSelect.value = months.includes(previousSelection) ? previousSelection : months[0];
    return monthSelect.value;
}

function getExpenseTotalsByCategory(list) {
    const totals = list
        .filter(function (item) { return item.type === "expense"; })
        .reduce(function (result, item) {
            result[item.category] = (result[item.category] || 0) + item.amount;
            return result;
        }, {});

    return Object.entries(totals).sort(function (a, b) { return b[1] - a[1]; });
}

// Builds "color 0% 40%, color2 40% 100%" for the CSS conic-gradient
function buildConicGradient(categoryTotals, totalExpenses) {
    let cumulative = 0;
    const stops = categoryTotals.map(function ([, total], index) {
        const color = CHART_COLORS[index % CHART_COLORS.length];
        const start = (cumulative / totalExpenses) * 100;
        cumulative += total;
        const end = (cumulative / totalExpenses) * 100;
        return `${color} ${start}% ${end}%`;
    });
    return `conic-gradient(${stops.join(", ")})`;
}

function renderLegend(categoryTotals, totalExpenses) {
    categoryLegend.replaceChildren();

    categoryTotals.forEach(function ([category, total], index) {
        const percent = (total / totalExpenses) * 100;
        const color = CHART_COLORS[index % CHART_COLORS.length];

        const dot = document.createElement("span");
        dot.className = "legend-dot";
        dot.style.background = color;

        const name = document.createElement("strong");
        name.textContent = category;

        const sub = document.createElement("span");
        sub.className = "legend-sub";
        sub.textContent = `${percent.toFixed(1)}% · ${formatCurrency(total)}`;

        const text = document.createElement("span");
        text.className = "legend-text";
        text.append(name, sub);

        const row = document.createElement("li");
        row.className = "legend-row";
        row.append(dot, text);

        categoryLegend.appendChild(row);
    });
}

function renderSpendingBreakdown(monthTransactions, selectedMonth) {
    const categoryTotals = getExpenseTotalsByCategory(monthTransactions);
    const totalExpenses = sumByType(monthTransactions, "expense");

    chartMonthPill.textContent = selectedMonth ? formatMonth(selectedMonth) : "-";

    if (categoryTotals.length === 0 || totalExpenses === 0) {
        chartEmptyMessage.hidden = false;
        breakdownBody.hidden = true;
        return;
    }

    chartEmptyMessage.hidden = true;
    breakdownBody.hidden = false;

    categoryDonut.style.background = buildConicGradient(categoryTotals, totalExpenses);
    donutTotal.textContent = formatCurrency(totalExpenses);
    renderLegend(categoryTotals, totalExpenses);
}

function renderMonthlyOverview() {
    const selectedMonth = populateMonthOptions();

    const monthTransactions = transactions.filter(function (item) {
        return selectedMonth !== "" && item.date.startsWith(selectedMonth);
    });

    const expenseItems = monthTransactions.filter(function (item) {
        return item.type === "expense";
    });
    const totalExpenses = sumByType(monthTransactions, "expense");
    const categoryTotals = getExpenseTotalsByCategory(monthTransactions);
    const average = expenseItems.length > 0 ? totalExpenses / expenseItems.length : 0;

    monthExpensesElement.textContent = formatCurrency(totalExpenses);
    monthExpenseCountElement.textContent =
        `${expenseItems.length} expense${expenseItems.length === 1 ? "" : "s"}`;
    monthAverageElement.textContent = formatCurrency(average);
    monthTopCategoryElement.textContent = categoryTotals.length > 0 ? categoryTotals[0][0] : "-";

    monthCaptionElement.textContent = expenseItems.length > 0
        ? `${formatMonth(selectedMonth)} spending across ${categoryTotals.length} categor${categoryTotals.length === 1 ? "y" : "ies"}.`
        : "No expenses recorded for this month.";

    renderSpendingBreakdown(monthTransactions, selectedMonth);
}

/* =====================================================
   REFRESH EVERYTHING
   ===================================================== */
function refreshDisplay() {
    renderTransactions();
    updateSummary();
    renderMonthlyOverview();
}

/* =====================================================
   EVENT LISTENERS
   ===================================================== */
form.addEventListener("submit", handleSubmit);
cancelButton.addEventListener("click", resetForm);

typeSelect.addEventListener("change", function () {
    populateCategoryOptions(typeSelect.value);
});

filterTypeSelect.addEventListener("change", renderTransactions);
filterCategorySelect.addEventListener("change", renderTransactions);
monthSelect.addEventListener("change", renderMonthlyOverview);

navAddButton.addEventListener("click", function () {
    resetForm();
    addTransactionPanel.scrollIntoView({ behavior: "smooth" });
    typeSelect.focus();
});

["amount", "description"].forEach(function (fieldName) {
    fields[fieldName].addEventListener("input", function () {
        validateFieldLive(fieldName);
    });
});

["category", "date"].forEach(function (fieldName) {
    fields[fieldName].addEventListener("change", function () {
        validateFieldLive(fieldName);
    });
});

/* =====================================================
   START
   ===================================================== */
function init() {
    transactions = loadTransactions();
    resetForm();
    refreshDisplay();
}

init();