

let incomes =
    JSON.parse(localStorage.getItem("sbm_incomes")) || [];

let expenses =
    JSON.parse(localStorage.getItem("sbm_expenses")) || [];

let budgets =
    JSON.parse(localStorage.getItem("sbm_budgets")) || {};

let reminders =
    JSON.parse(localStorage.getItem("sbm_reminders")) || {};

let savingsGoal =
    JSON.parse(localStorage.getItem("sbm_goal")) || null;

let expenseChart = null;


/* =========================================================
   FIX REMINDERS DATA IF NEEDED
========================================================= */

if (!Array.isArray(reminders)) {
    reminders = [];
}


/* =========================================================
   DOM ELEMENTS
========================================================= */

const incomeForm =
    document.getElementById("incomeForm");

const expenseForm =
    document.getElementById("expenseForm");

const reminderForm =
    document.getElementById("reminderForm");


/* =========================================================
   PAGE INITIALIZATION
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    setDefaultDates();

    loadTheme();

    updateDashboard();

    renderExpenses();

    renderIncomeHistory();

    renderBudgets();

    renderSavingsGoal();

    renderReminders();

    generateSuggestions();

    checkUpcomingReminders();
});


/* =========================================================
   DEFAULT DATES
========================================================= */

function setDefaultDates() {

    const today =
        new Date().toISOString().split("T")[0];

    const expenseDate =
        document.getElementById("expenseDate");

    const reminderDate =
        document.getElementById("reminderDate");

    if (expenseDate) {
        expenseDate.value = today;
    }

    if (reminderDate) {
        reminderDate.value = today;
    }
}


/* =========================================================
   INCOME
========================================================= */

if (incomeForm) {

    incomeForm.addEventListener("submit", function (e) {

        e.preventDefault();

        const source =
            document
                .getElementById("incomeSource")
                .value
                .trim();

        const amount =
            Number(
                document
                    .getElementById("incomeAmount")
                    .value
            );

        if (!source || amount <= 0) {

            alert(
                "Please enter a valid income source and amount."
            );

            return;
        }

        const income = {

            id: Date.now(),

            source: source,

            amount: amount,

            date: new Date().toISOString()
        };

        incomes.push(income);

        saveData();

        incomeForm.reset();

        updateDashboard();

        renderIncomeHistory();

        generateSuggestions();

        alert(
            "Income added successfully! 💰"
        );
    });
}

/* =========================================================
   INCOME HISTORY
========================================================= */

function renderIncomeHistory() {

    const tbody =
        document.getElementById(
            "incomeTableBody"
        );

    if (!tbody) return;

    tbody.innerHTML = "";

    if (incomes.length === 0) {

        tbody.innerHTML = `

            <tr>

                <td
                    colspan="4"
                    class="empty-state">

                    No income added yet.

                </td>

            </tr>

        `;

        return;
    }

    const sortedIncomes =
        [...incomes].sort(
            (a, b) =>
                new Date(b.date) -
                new Date(a.date)
        );

    sortedIncomes.forEach(income => {

        const row =
            document.createElement("tr");

        row.innerHTML = `

            <td>
                ${formatDate(income.date)}
            </td>

            <td>
                ${escapeHTML(income.source)}
            </td>

            <td>

                <strong>
                    ${formatCurrency(
                        income.amount
                    )}
                </strong>

            </td>

            <td>

                <button
                    class="table-delete"
                    onclick="deleteIncome(${income.id})">

                    Delete

                </button>

            </td>

        `;

        tbody.appendChild(row);
    });
}


/* =========================================================
   DELETE INCOME
========================================================= */

function deleteIncome(id) {

    const confirmDelete =
        confirm(
            "Delete this income?"
        );

    if (!confirmDelete) return;

    incomes =
        incomes.filter(
            income =>
                income.id !== id
        );

    saveData();

    updateDashboard();

    renderIncomeHistory();

    generateSuggestions();

    alert(
        "Income deleted successfully."
    );
}


/* =========================================================
   CLEAR ALL INCOME
========================================================= */

function clearIncome() {

    if (incomes.length === 0) {

        alert(
            "There is no income to clear."
        );

        return;
    }

    const confirmClear =
        confirm(
            "Are you sure you want to delete all income?"
        );

    if (!confirmClear) return;

    incomes = [];

    saveData();

    updateDashboard();

    renderIncomeHistory();

    generateSuggestions();

    alert(
        "All income cleared."
    );
}


/* =========================================================
   EXPENSE
========================================================= */

if (expenseForm) {

    expenseForm.addEventListener("submit", function (e) {

        e.preventDefault();

        const name =
            document
                .getElementById("expenseName")
                .value
                .trim();

        const category =
            document
                .getElementById("expenseCategory")
                .value;

        const amount =
            Number(
                document
                    .getElementById("expenseAmount")
                    .value
            );

        const date =
            document
                .getElementById("expenseDate")
                .value;

        if (
            !name ||
            !category ||
            amount <= 0 ||
            !date
        ) {

            alert(
                "Please fill all expense details."
            );

            return;
        }

        const expense = {

            id: Date.now(),

            name: name,

            category: category,

            amount: amount,

            date: date
        };

        expenses.push(expense);

        saveData();

        expenseForm.reset();

        setDefaultDates();

        updateDashboard();

        renderExpenses();

        renderBudgets();

        generateSuggestions();

        checkBudgetAlert(category);

        alert(
            "Expense added successfully! 🧾"
        );
    });
}


/* =========================================================
   SAVE DATA
========================================================= */

function saveData() {

    localStorage.setItem(
        "sbm_incomes",
        JSON.stringify(incomes)
    );

    localStorage.setItem(
        "sbm_expenses",
        JSON.stringify(expenses)
    );

    localStorage.setItem(
        "sbm_budgets",
        JSON.stringify(budgets)
    );

    localStorage.setItem(
        "sbm_reminders",
        JSON.stringify(reminders)
    );

    localStorage.setItem(
        "sbm_goal",
        JSON.stringify(savingsGoal)
    );
}


/* =========================================================
   CALCULATIONS
========================================================= */

function getTotalIncome() {

    return incomes.reduce(
        (total, income) =>
            total + Number(income.amount),
        0
    );
}


function getTotalExpense() {

    return expenses.reduce(
        (total, expense) =>
            total + Number(expense.amount),
        0
    );
}


function getBalance() {

    return getTotalIncome() -
        getTotalExpense();
}


/* =========================================================
   DASHBOARD UPDATE
========================================================= */

function updateDashboard() {

    const totalIncome =
        getTotalIncome();

    const totalExpense =
        getTotalExpense();

    const balance =
        totalIncome - totalExpense;

    /*
       Available to Save means money remaining
       after expenses.
    */

    const availableToSave =
        Math.max(balance, 0);

    const incomeElement =
        document.getElementById("totalIncome");

    const expenseElement =
        document.getElementById("totalExpense");

    const balanceElement =
        document.getElementById("remainingBalance");

    const savingsElement =
        document.getElementById("savingsAmount");

    if (incomeElement) {

        incomeElement.textContent =
            formatCurrency(totalIncome);
    }

    if (expenseElement) {

        expenseElement.textContent =
            formatCurrency(totalExpense);
    }

    if (balanceElement) {

        balanceElement.textContent =
            formatCurrency(balance);
    }

    if (savingsElement) {

        savingsElement.textContent =
            formatCurrency(availableToSave);
    }

    const overviewIncome =
        document.getElementById(
            "overviewIncome"
        );

    const overviewExpense =
        document.getElementById(
            "overviewExpense"
        );

    const overviewBalance =
        document.getElementById(
            "overviewBalance"
        );

    if (overviewIncome) {

        overviewIncome.textContent =
            formatCurrency(totalIncome);
    }

    if (overviewExpense) {

        overviewExpense.textContent =
            formatCurrency(totalExpense);
    }

    if (overviewBalance) {

        overviewBalance.textContent =
            formatCurrency(balance);
    }

    updateSpendingProgress(
        totalIncome,
        totalExpense
    );

    updateMonthlyReport();

    updateChart();

    renderSavingsGoal();
}


/* =========================================================
   CURRENCY
========================================================= */

function formatCurrency(amount) {

    return "₹" +
        Number(amount).toLocaleString(
            "en-IN",
            {
                maximumFractionDigits: 2
            }
        );
}


/* =========================================================
   SPENDING PROGRESS
========================================================= */

function updateSpendingProgress(
    income,
    expense
) {

    let percentage = 0;

    if (income > 0) {

        percentage =
            (expense / income) * 100;
    }

    const displayPercentage =
        Math.round(percentage);

    const safePercentage =
        Math.min(
            Math.max(percentage, 0),
            100
        );

    const percentageElement =
        document.getElementById(
            "spendingPercentage"
        );

    const progressElement =
        document.getElementById(
            "spendingProgress"
        );

    if (percentageElement) {

        percentageElement.textContent =
            displayPercentage + "%";
    }

    if (progressElement) {

        progressElement.style.width =
            safePercentage + "%";
    }
}


/* =========================================================
   EXPENSE CHART
========================================================= */

function updateChart() {

    const canvas =
        document.getElementById(
            "expenseChart"
        );

    if (!canvas) return;

    const categoryTotals = {};

    expenses.forEach(expense => {

        if (!categoryTotals[expense.category]) {

            categoryTotals[expense.category] = 0;
        }

        categoryTotals[expense.category] +=
            Number(expense.amount);
    });

    const labels =
        Object.keys(categoryTotals);

    const data =
        Object.values(categoryTotals);

    if (expenseChart) {

        expenseChart.destroy();

        expenseChart = null;
    }

    expenseChart =
        new Chart(canvas, {

            type: "doughnut",

            data: {

                labels:
                    labels.length
                        ? labels
                        : ["No Expenses"],

                datasets: [{

                    data:
                        data.length
                            ? data
                            : [1],

                    backgroundColor: [

                        "#6366f1",
                        "#10b981",
                        "#f59e0b",
                        "#ef4444",
                        "#06b6d4",
                        "#8b5cf6",
                        "#ec4899",
                        "#64748b"
                    ],

                    borderWidth: 2
                }]
            },

            options: {

                responsive: true,

                maintainAspectRatio: false,

                plugins: {

                    legend: {

                        position: "bottom"
                    },

                    tooltip: {

                        callbacks: {

                            label:
                                function (context) {

                                    if (!data.length) {

                                        return " No expenses yet";
                                    }

                                    return (
                                        " " +
                                        context.label +
                                        ": " +
                                        formatCurrency(
                                            context.raw
                                        )
                                    );
                                }
                        }
                    }
                }
            }
        });
}


/* =========================================================
   EXPENSE HISTORY
========================================================= */

function renderExpenses() {

    const tbody =
        document.getElementById(
            "expenseTableBody"
        );

    if (!tbody) return;

    tbody.innerHTML = "";

    if (expenses.length === 0) {

        tbody.innerHTML = `

            <tr>

                <td
                    colspan="5"
                    class="empty-state">

                    No expenses added yet.

                </td>

            </tr>

        `;

        return;
    }

    const sortedExpenses =
        [...expenses].sort(
            (a, b) =>
                new Date(b.date) -
                new Date(a.date)
        );

    sortedExpenses.forEach(expense => {

        const row =
            document.createElement("tr");

        row.innerHTML = `

            <td>
                ${formatDate(expense.date)}
            </td>

            <td>
                ${escapeHTML(expense.name)}
            </td>

            <td>

                <span class="category-badge">

                    ${getCategoryIcon(
                        expense.category
                    )}

                    ${escapeHTML(
                        expense.category
                    )}

                </span>

            </td>

            <td>

                <strong>
                    ${formatCurrency(
                        expense.amount
                    )}
                </strong>

            </td>

            <td>

                <button
                    class="table-delete"
                    onclick="deleteExpense(${expense.id})">

                    Delete

                </button>

            </td>

        `;

        tbody.appendChild(row);
    });
}


/* =========================================================
   DELETE EXPENSE
========================================================= */

function deleteExpense(id) {

    const confirmDelete =
        confirm(
            "Delete this expense?"
        );

    if (!confirmDelete) return;

    expenses =
        expenses.filter(
            expense =>
                expense.id !== id
        );

    saveData();

    updateDashboard();

    renderExpenses();

    renderBudgets();

    generateSuggestions();
}


/* =========================================================
   CLEAR EXPENSES
========================================================= */

function clearExpenses() {

    if (expenses.length === 0) {

        alert(
            "There are no expenses to clear."
        );

        return;
    }

    const confirmClear =
        confirm(
            "Are you sure you want to delete all expenses?"
        );

    if (!confirmClear) return;

    expenses = [];

    saveData();

    updateDashboard();

    renderExpenses();

    renderBudgets();

    generateSuggestions();

    alert(
        "All expenses cleared."
    );
}


/* =========================================================
   CATEGORY ICON
========================================================= */

function getCategoryIcon(category) {

    const icons = {

        Food: "🍔",

        Travel: "🚌",

        Education: "📚",

        Shopping: "🛍️",

        Entertainment: "🎮",

        Bills: "💡",

        Health: "🏥",

        Other: "📦"
    };

    return icons[category] || "📦";
}


/* =========================================================
   SET CATEGORY BUDGET
========================================================= */

function setBudget() {

    const category =
        document.getElementById(
            "budgetCategory"
        ).value;

    const amount =
        Number(
            document.getElementById(
                "budgetAmount"
            ).value
        );

    if (!category || amount <= 0) {

        alert(
            "Please select a category and enter a valid amount."
        );

        return;
    }

    budgets[category] = amount;

    saveData();

    document.getElementById(
        "budgetCategory"
    ).value = "";

    document.getElementById(
        "budgetAmount"
    ).value = "";

    renderBudgets();

    alert(
        `${category} budget set to ${formatCurrency(amount)}`
    );
}


/* =========================================================
   RENDER CATEGORY BUDGETS
========================================================= */

function renderBudgets() {

    const container =
        document.getElementById(
            "budgetList"
        );

    if (!container) return;

    container.innerHTML = "";

    const categories =
        Object.keys(budgets);

    if (categories.length === 0) {

        container.innerHTML = `

            <div class="empty-state">

                No category budgets set yet.

            </div>

        `;

        return;
    }

    categories.forEach(category => {

        const limit =
            Number(budgets[category]);

        const spent =
            expenses

                .filter(
                    expense =>
                        expense.category ===
                        category
                )

                .reduce(
                    (total, expense) =>
                        total +
                        Number(expense.amount),
                    0
                );

        const percentage =
            limit > 0
                ? (spent / limit) * 100
                : 0;

        const safePercentage =
            Math.min(
                Math.max(percentage, 0),
                100
            );

        let statusHTML = "";

        /*
           Correct budget logic:

           < 80%  = Normal
           80-99% = Warning
           100%   = Limit reached
           >100%  = Exceeded
        */

        if (percentage > 100) {

            statusHTML = `

                <p class="budget-warning">

                    🚨 Budget exceeded!

                </p>

            `;

        }

        else if (percentage === 100) {

            statusHTML = `

                <p class="budget-warning">

                    ⚠️ Budget limit reached!

                </p>

            `;

        }

        else if (percentage >= 80) {

            statusHTML = `

                <p class="budget-warning">

                    ⚠️ You are close to your budget limit.

                </p>

            `;

        }

        else {

            statusHTML = `

                <p>

                    ${Math.round(percentage)}% used

                </p>

            `;
        }

        const item =
            document.createElement("div");

        item.className =
            "budget-item";

        item.innerHTML = `

            <div class="budget-item-header">

                <span>

                    ${getCategoryIcon(category)}

                    ${escapeHTML(category)}

                </span>

                <span>

                    ${formatCurrency(spent)}
                    /
                    ${formatCurrency(limit)}

                </span>

            </div>

            <div class="budget-progress">

                <div
                    class="budget-progress-fill"
                    style="width:${safePercentage}%">

                </div>

            </div>

            ${statusHTML}

            <button
                class="table-delete"
                onclick="deleteBudget('${escapeAttribute(category)}')">

                Remove

            </button>

        `;

        container.appendChild(item);
    });
}


/* =========================================================
   DELETE BUDGET
========================================================= */

function deleteBudget(category) {

    const confirmDelete =
        confirm(
            `Remove ${category} budget?`
        );

    if (!confirmDelete) return;

    delete budgets[category];

    saveData();

    renderBudgets();
}


/* =========================================================
   BUDGET ALERT
========================================================= */

function checkBudgetAlert(category) {

    if (!budgets[category]) return;

    const limit =
        Number(budgets[category]);

    const spent =
        expenses

            .filter(
                expense =>
                    expense.category ===
                    category
            )

            .reduce(
                (total, expense) =>
                    total +
                    Number(expense.amount),
                0
            );

    if (spent > limit) {

        alert(
            `🚨 ${category} budget exceeded!`
        );

    }

    else if (spent === limit) {

        alert(
            `⚠️ ${category} budget limit reached!`
        );

    }

    else if (spent >= limit * 0.8) {

        alert(
            `⚠️ You have used more than 80% of your ${category} budget.`
        );
    }
}


/* =========================================================
   SMART SAVING SUGGESTIONS
========================================================= */

function generateSuggestions() {

    const container =
        document.getElementById(
            "suggestions"
        );

    if (!container) return;

    container.innerHTML = "";

    const income =
        getTotalIncome();

    const expense =
        getTotalExpense();

    const balance =
        Math.max(
            income - expense,
            0
        );

    if (income === 0 && expense === 0) {

        container.innerHTML = `

            <div class="suggestion">

                💡 Add your income and expenses
                to receive personalized
                saving suggestions.

            </div>

        `;

        return;
    }

    const suggestions = [];


    /* -----------------------------------------
       INCOME / EXPENSE ANALYSIS
    ----------------------------------------- */

    if (income > 0) {

        const ratio =
            (expense / income) * 100;

        if (expense === 0) {

            suggestions.push(

                "🎉 You have not recorded any expenses yet. Start tracking your spending to build better saving habits."

            );

        }

        else if (ratio >= 90) {

            suggestions.push(

                "🚨 Your spending is very high compared with your income. Try reducing non-essential expenses."

            );

        }

        else if (ratio >= 70) {

            suggestions.push(

                "⚠️ More than 70% of your income is being spent. Consider setting stricter category budgets."

            );

        }

        else {

            suggestions.push(

                `✅ Your spending is ${Math.round(ratio)}% of your income. Consider saving a portion of your ${formatCurrency(balance)} remaining balance.`

            );
        }
    }


    /* -----------------------------------------
       CATEGORY ANALYSIS
    ----------------------------------------- */

    const categoryTotals = {};

    expenses.forEach(expense => {

        if (!categoryTotals[expense.category]) {

            categoryTotals[expense.category] = 0;
        }

        categoryTotals[expense.category] +=
            Number(expense.amount);
    });

    const categories =
        Object.entries(categoryTotals);

    if (categories.length > 0) {

        categories.sort(
            (a, b) => b[1] - a[1]
        );

        const highest =
            categories[0];

        suggestions.push(

            `📊 Your highest spending category is ${highest[0]} at ${formatCurrency(highest[1])}. Consider reducing unnecessary spending in this category.`

        );
    }


    /* -----------------------------------------
       FOOD SUGGESTION
    ----------------------------------------- */

    const foodExpense =
        categoryTotals["Food"] || 0;

    if (
        income > 0 &&
        foodExpense >= income * 0.20
    ) {

        suggestions.push(

            "🍔 Food expenses are taking a significant portion of your income. Preparing food at home or choosing affordable options may help you save."

        );
    }


    /* -----------------------------------------
       SHOPPING SUGGESTION
    ----------------------------------------- */

    const shoppingExpense =
        categoryTotals["Shopping"] || 0;

    if (
        income > 0 &&
        shoppingExpense > income * 0.15
    ) {

        suggestions.push(

            "🛍️ Your shopping expenses are relatively high. Try a 24-hour waiting rule before making non-essential purchases."

        );
    }


    /* -----------------------------------------
       BUDGET SUGGESTIONS
    ----------------------------------------- */

    Object.keys(budgets).forEach(category => {

        const limit =
            Number(budgets[category]);

        const spent =
            expenses

                .filter(
                    expense =>
                        expense.category ===
                        category
                )

                .reduce(
                    (total, expense) =>
                        total +
                        Number(expense.amount),
                    0
                );

        if (limit <= 0) return;

        const percentage =
            (spent / limit) * 100;

        if (percentage > 100) {

            suggestions.push(

                `🚨 Your ${category} expenses have exceeded the budget by ${formatCurrency(spent - limit)}.`

            );

        }

        else if (percentage >= 80) {

            suggestions.push(

                `⚠️ Your ${category} budget is ${Math.round(percentage)}% used. Try to control further spending in this category.`

            );
        }
    });


    /* -----------------------------------------
       SAVINGS GOAL SUGGESTION
    ----------------------------------------- */

    if (savingsGoal) {

        const target =
            Number(
                savingsGoal.target
            );

        const saved =
            Math.max(
                getBalance(),
                0
            );

        if (saved >= target) {

            suggestions.push(

                `🎉 Congratulations! You have enough available balance to reach your "${savingsGoal.name}" savings goal.`

            );

        }

        else {

            const remaining =
                target - saved;

            suggestions.push(

                `🎯 You need ${formatCurrency(remaining)} more to reach your "${savingsGoal.name}" goal.`

            );
        }
    }


    /* -----------------------------------------
       DEFAULT SUGGESTION
    ----------------------------------------- */

    if (suggestions.length === 0) {

        suggestions.push(

            "💡 Keep tracking your expenses regularly to understand your spending habits better."

        );
    }


    suggestions.forEach(text => {

        const div =
            document.createElement("div");

        div.className =
            "suggestion";

        div.textContent =
            text;

        container.appendChild(div);
    });
}


/* =========================================================
   SAVINGS GOAL
========================================================= */

function setSavingsGoal() {

    const name =
        document
            .getElementById("goalName")
            .value
            .trim();

    const target =
        Number(
            document
                .getElementById("goalAmount")
                .value
        );

    if (!name || target <= 0) {

        alert(
            "Please enter a goal name and valid target amount."
        );

        return;
    }

    savingsGoal = {

        name: name,

        target: target,

        createdAt:
            new Date().toISOString()
    };

    saveData();

    document.getElementById(
        "goalName"
    ).value = "";

    document.getElementById(
        "goalAmount"
    ).value = "";

    renderSavingsGoal();

    generateSuggestions();

    alert(
        "Savings goal created! 🎯"
    );
}


/* =========================================================
   RENDER SAVINGS GOAL
========================================================= */

function renderSavingsGoal() {

    const container =
        document.getElementById(
            "goalDisplay"
        );

    if (!container) return;

    if (!savingsGoal) {

        container.innerHTML = `

            <p>
                No savings goal set.
            </p>

        `;

        return;
    }

    /*
       Current project logic:
       Available balance is treated as
       money available for savings.

       Progress is capped at 100%.
    */

    const balance =
        Math.max(
            getBalance(),
            0
        );

    const target =
        Number(
            savingsGoal.target
        );

    const percentage =
        target > 0
            ? (balance / target) * 100
            : 0;

    const safePercentage =
        Math.min(
            Math.max(
                percentage,
                0
            ),
            100
        );

    container.innerHTML = `

        <h3>

            🎯
            ${escapeHTML(
                savingsGoal.name
            )}

        </h3>

        <div class="goal-progress">

            <div
                class="goal-progress-fill"
                style="width:${safePercentage}%">

            </div>

        </div>

        <div class="goal-info">

            <span>

                Available:

                ${formatCurrency(balance)}

            </span>

            <span>

                Target:

                ${formatCurrency(target)}

            </span>

        </div>

        <p style="margin-top:10px;">

            ${Math.round(
                safePercentage
            )}% completed

        </p>

        ${
            safePercentage >= 100
                ? `
                    <p style="margin-top:8px;">
                        🎉 Goal achieved!
                    </p>
                  `
                : `
                    <p style="margin-top:8px;">
                        ${formatCurrency(
                            Math.max(
                                target - balance,
                                0
                            )
                        )}
                        remaining
                    </p>
                  `
        }

        <button
            class="table-delete"
            onclick="deleteSavingsGoal()"
            style="margin-top:12px;">

            Remove Goal

        </button>

    `;
}


/* =========================================================
   DELETE SAVINGS GOAL
========================================================= */

function deleteSavingsGoal() {

    const confirmDelete =
        confirm(
            "Remove your savings goal?"
        );

    if (!confirmDelete) return;

    savingsGoal = null;

    saveData();

    renderSavingsGoal();

    generateSuggestions();
}


/* =========================================================
   PAYMENT REMINDERS
========================================================= */

if (reminderForm) {

    reminderForm.addEventListener(
        "submit",
        function (e) {

            e.preventDefault();

            const name =
                document
                    .getElementById("reminderName")
                    .value
                    .trim();

            const amount =
                Number(
                    document
                        .getElementById("reminderAmount")
                        .value
                );

            const date =
                document
                    .getElementById("reminderDate")
                    .value;

            if (
                !name ||
                amount <= 0 ||
                !date
            ) {

                alert(
                    "Please enter valid reminder details."
                );

                return;
            }

            const reminder = {

                id: Date.now(),

                name: name,

                amount: amount,

                date: date,

                notified: false
            };

            reminders.push(reminder);

            saveData();

            reminderForm.reset();

            setDefaultDates();

            renderReminders();

            alert(
                "Payment reminder added! 🔔"
            );
        }
    );
}


/* =========================================================
   RENDER PAYMENT REMINDERS
========================================================= */

function renderReminders() {

    const container =
        document.getElementById(
            "reminderList"
        );

    if (!container) return;

    container.innerHTML = "";

    if (reminders.length === 0) {

        container.innerHTML = `

            <div class="empty-state">

                No payment reminders added.

            </div>

        `;

        return;
    }

    const sorted =
        [...reminders].sort(
            (a, b) =>
                new Date(a.date) -
                new Date(b.date)
        );

    sorted.forEach(reminder => {

        const status =
            getReminderStatus(
                reminder.date
            );

        const item =
            document.createElement("div");

        item.className =
            "reminder-item";

        item.innerHTML = `

            <div class="reminder-info">

                <h4>

                    🔔
                    ${escapeHTML(
                        reminder.name
                    )}

                </h4>

                <p>

                    Due:
                    ${formatDate(
                        reminder.date
                    )}

                </p>

                <p>

                    ${status.text}

                </p>

            </div>

            <div class="reminder-amount">

                ${formatCurrency(
                    reminder.amount
                )}

            </div>

            <button
                class="delete-btn"
                onclick="deleteReminder(${reminder.id})">

                ✕

            </button>

        `;

        container.appendChild(item);
    });
}


/* =========================================================
   REMINDER STATUS
========================================================= */

function getReminderStatus(dateString) {

    const today =
        new Date();

    today.setHours(
        0,
        0,
        0,
        0
    );

    const dueDate =
        new Date(dateString);

    dueDate.setHours(
        0,
        0,
        0,
        0
    );

    const difference =
        Math.ceil(
            (
                dueDate - today
            ) /
            (1000 * 60 * 60 * 24)
        );

    if (difference < 0) {

        return {
            text: "🔴 Overdue",
            days: difference
        };
    }

    if (difference === 0) {

        return {
            text: "🔴 Due Today",
            days: 0
        };
    }

    if (difference === 1) {

        return {
            text: "🟠 Due Tomorrow",
            days: 1
        };
    }

    return {
        text:
            `🟢 Due in ${difference} days`,
        days: difference
    };
}


/* =========================================================
   DELETE REMINDER
========================================================= */

function deleteReminder(id) {

    reminders =
        reminders.filter(
            reminder =>
                reminder.id !== id
        );

    saveData();

    renderReminders();
}


/* =========================================================
   UPCOMING REMINDER CHECK
========================================================= */

function checkUpcomingReminders() {

    if (reminders.length === 0) return;

    const today =
        new Date();

    today.setHours(
        0,
        0,
        0,
        0
    );

    let changed = false;

    reminders.forEach(reminder => {

        if (reminder.notified === true) {
            return;
        }

        const dueDate =
            new Date(reminder.date);

        dueDate.setHours(
            0,
            0,
            0,
            0
        );

        const difference =
            Math.ceil(
                (
                    dueDate - today
                ) /
                (1000 * 60 * 60 * 24)
            );

        if (
            difference >= 0 &&
            difference <= 1
        ) {

            alert(

                `🔔 Payment Reminder\n\n` +

                `${reminder.name}\n` +

                `Amount: ${formatCurrency(
                    reminder.amount
                )}\n` +

                `Due: ${formatDate(
                    reminder.date
                )}`

            );

            reminder.notified = true;

            changed = true;
        }
    });

    if (changed) {

        saveData();
    }
}


/* =========================================================
   MONTHLY REPORT
========================================================= */

function updateMonthlyReport() {

    const now =
        new Date();

    const currentMonth =
        now.getMonth();

    const currentYear =
        now.getFullYear();

    const monthlyExpenses =
        expenses.filter(expense => {

            const date =
                new Date(expense.date);

            return (

                date.getMonth() ===
                currentMonth &&

                date.getFullYear() ===
                currentYear
            );
        });

    const monthlyIncome =
        incomes.filter(income => {

            const date =
                new Date(income.date);

            return (

                date.getMonth() ===
                currentMonth &&

                date.getFullYear() ===
                currentYear
            );
        });

    const income =
        monthlyIncome.reduce(
            (total, item) =>
                total +
                Number(item.amount),
            0
        );

    const expense =
        monthlyExpenses.reduce(
            (total, item) =>
                total +
                Number(item.amount),
            0
        );

    const balance =
        income - expense;

    const reportIncome =
        document.getElementById(
            "reportIncome"
        );

    const reportExpense =
        document.getElementById(
            "reportExpense"
        );

    const reportBalance =
        document.getElementById(
            "reportBalance"
        );

    const reportCount =
        document.getElementById(
            "reportCount"
        );

    if (reportIncome) {

        reportIncome.textContent =
            formatCurrency(income);
    }

    if (reportExpense) {

        reportExpense.textContent =
            formatCurrency(expense);
    }

    if (reportBalance) {

        reportBalance.textContent =
            formatCurrency(balance);
    }

    if (reportCount) {

        reportCount.textContent =
            monthlyExpenses.length;
    }
}


/* =========================================================
   DARK MODE
========================================================= */

function toggleTheme() {

    document.body.classList.toggle(
        "dark-mode"
    );

    const isDark =
        document.body.classList.contains(
            "dark-mode"
        );

    localStorage.setItem(
        "sbm_theme",
        isDark
            ? "dark"
            : "light"
    );

    updateThemeButton();
}


/* =========================================================
   LOAD THEME
========================================================= */

function loadTheme() {

    const theme =
        localStorage.getItem(
            "sbm_theme"
        );

    if (theme === "dark") {

        document.body.classList.add(
            "dark-mode"
        );
    }

    updateThemeButton();
}


/* =========================================================
   THEME BUTTON
========================================================= */

function updateThemeButton() {

    const button =
        document.getElementById(
            "themeBtn"
        );

    if (!button) return;

    const isDark =
        document.body.classList.contains(
            "dark-mode"
        );

    button.textContent =
        isDark
            ? "☀️"
            : "🌙";
}


/* =========================================================
   DATE FORMAT
========================================================= */

function formatDate(dateString) {

    if (!dateString) return "-";

    const date =
        new Date(dateString);

    if (isNaN(date)) {

        return dateString;
    }

    return date.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );
}


/* =========================================================
   HTML SECURITY
========================================================= */

function escapeHTML(value) {

    return String(value)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );
}


/* =========================================================
   ATTRIBUTE SECURITY
========================================================= */

function escapeAttribute(value) {

    return String(value)

        .replace(
            /\\/g,
            "\\\\"
        )

        .replace(
            /'/g,
            "\\'"
        );
}


/* =========================================================
   AUTO SAVE
========================================================= */

window.addEventListener(
    "beforeunload",
    saveData
);