// expense.js - Handles Monthly Expense Tracker Page

// CRITICAL FIX: Import Store from the shared script.js
import { Store } from './script.js';

// Data Class for this module
class ExpenseItem {
    constructor(id, logDate, category, restaurant, orderAmount, milkAmount, curdAmount, groceryAmount, remarks) {
        this.logDate = logDate;
        this.category = category;
        this.restaurant = restaurant;
        this.orderAmount = parseFloat(orderAmount) || 0;
        this.milkAmount = parseFloat(milkAmount) || 0;
        this.curdAmount = parseFloat(curdAmount) || 0;
        this.groceryAmount = parseFloat(groceryAmount) || 0; 
        this.remarks = remarks || '';
        this.id = id || `${logDate}-${category}-${Date.now()}`;
    }
}

// UI Rendering for this module
function displayExpenses(expenses) {
    const list = document.querySelector('#expense-list');
    if (!list) return;
    
    list.innerHTML = ''; 
    expenses.sort((a, b) => new Date(b.logDate) - new Date(a.logDate));

    let totalOrder = 0;
    let totalMilk = 0;
    let totalCurd = 0;
    let totalGrocery = 0; 

    // Helper to format date string to YYYY-MM
    const getMonthYear = (dateStr) => {
        if (!dateStr) return null;
        const date = new Date(dateStr);
        // Ensure date calculation is consistent, using YYYY-MM
        return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0');
    };

    const today = new Date();
    const currentMonthYear = getMonthYear(today);

    expenses.forEach((expense) => {
        // Calculate total for the row
        const total = expense.orderAmount + expense.milkAmount + expense.curdAmount + expense.groceryAmount; 
        
        const expenseMonthYear = getMonthYear(expense.logDate);

        // Sum up totals only for the current month
        if (expenseMonthYear === currentMonthYear) {
            totalOrder += expense.orderAmount;
            totalMilk += expense.milkAmount;
            totalCurd += expense.curdAmount;
            totalGrocery += expense.groceryAmount; 
        }

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${expense.logDate}</td>
            <td>${expense.category}</td>
            <td>${expense.restaurant || '-'}</td>
            <td>₹${expense.orderAmount.toFixed(2)}</td>
            <td>₹${expense.milkAmount.toFixed(2)}</td>
            <td>₹${expense.curdAmount.toFixed(2)}</td>
            <td>₹${expense.groceryAmount.toFixed(2)}</td> 
            <td><strong>₹${total.toFixed(2)}</strong></td>
            <td>${expense.remarks || '-'}</td>
        `;
        list.appendChild(row);
    });
    
    displaySummary(totalOrder, totalMilk, totalCurd, totalGrocery);
}

// Summary function for this module
function displaySummary(order, milk, curd, grocery) {
    const grandTotal = order + milk + curd + grocery; 
    
    document.querySelector('#summary-order').textContent = `₹${order.toFixed(2)}`;
    document.querySelector('#summary-milk').textContent = `₹${milk.toFixed(2)}`;
    document.querySelector('#summary-curd').textContent = `₹${curd.toFixed(2)}`;
    document.querySelector('#summary-grocery').textContent = `₹${grocery.toFixed(2)}`; 
    document.querySelector('#summary-total').textContent = `₹${grandTotal.toFixed(2)}`;

    const monthYear = new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    
    // Update the summary header
    const summaryHeader = document.querySelector('#summary-header');
    if(summaryHeader) {
        summaryHeader.textContent = `Monthly Summary for ${monthYear}`;
    }
}

// Page Handler (Initialization logic)
export async function init() {
    UI.showAlert('Loading expense logs from Sheet...', 'alert-success'); 
    
    const expenses = await Store.get('expense');
    
    if (expenses.error) {
        UI.showAlert('Failed to load expenses. Check API URL/Deployment.', 'alert-danger');
    } else {
        displayExpenses(expenses); 
        document.querySelector('.alert')?.remove(); 
    }

    // POST listener
    document.querySelector('#expense-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const logDate = document.querySelector('#logDate').value;
        const category = document.querySelector('#category').value;
        const restaurant = document.querySelector('#restaurant').value;
        const orderAmount = document.querySelector('#orderAmount').value;
        const milkAmount = document.querySelector('#milkAmount').value;
        const curdAmount = document.querySelector('#curdAmount').value;
        const groceryAmount = document.querySelector('#groceryAmount').value;
        const remarks = document.querySelector('#remarks').value;

        if (logDate === '' || category === '') {
            UI.showAlert('Please fill in Date and Category', 'alert-danger');
            return;
        }
        
        if (parseFloat(orderAmount) <= 0 && parseFloat(milkAmount) <= 0 && parseFloat(curdAmount) <= 0 && parseFloat(groceryAmount) <= 0) {
            UI.showAlert('Please enter an amount for at least one category.', 'alert-danger');
            return;
        }

        const expense = new ExpenseItem(null, logDate, category, restaurant, orderAmount, milkAmount, curdAmount, groceryAmount, remarks);

        // CRITICAL CORS FIX: Create the final object to send with 'action'
        const dataToSend = {
            action: 'expense_log', // Required by Code.gs router
            logDate: expense.logDate,
            category: expense.category,
            restaurant: expense.restaurant,
            orderAmount: expense.orderAmount,
            milkAmount: expense.milkAmount,
            curdAmount: expense.curdAmount,
            groceryAmount: expense.groceryAmount,
            remarks: expense.remarks
        };
        
        const success = await Store.post(dataToSend);
        
        if (success) {
            UI.showAlert('Expense Logged Successfully! Recalculating totals...', 'alert-success');
            const updatedExpenses = await Store.get('expense');
            displayExpenses(updatedExpenses);
            UI.clearExpenseFields();
        }
    });
}

// Export the init function as the entry point
export { init }; 
// NOTE: Only one 'export { init };' statement is now present.