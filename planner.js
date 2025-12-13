// planner.js - Handles Meal Planner Page

// CRITICAL FIX: Import Store from the shared script.js
import { Store } from './script.js';

// UI Rendering for this module
function displayMealPlan(plan) {
    const list = document.querySelector('#meal-plan-body');
    if (!list) return;

    list.innerHTML = '';
    
    // Helper to format date string to DD-MMM (e.g., 20-Dec)
    const formatDate = (dateString) => {
        if (!dateString) return '-';
        try {
            const date = new Date(dateString + 'T00:00:00'); 
            const day = date.getDate().toString().padStart(2, '0');
            const month = date.toLocaleDateString('en-US', { month: 'short' });
            return `${day}-${month}`;
        } catch (e) {
            console.error("Date parsing error:", e);
            return dateString; 
        }
    };
    
    // Find the date range for the header
    if (plan.length > 0) {
        const startDate = formatDate(plan[0].date);
        const endDate = formatDate(plan[plan.length - 1].date);
        document.querySelector('#date-range-header').textContent = `(${startDate} to ${endDate})`;
    } else {
        document.querySelector('#date-range-header').textContent = `(No plan available)`;
    }


    plan.forEach((meal) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${meal.day}</strong></td>
            <td>${formatDate(meal.date)}</td>
            <td>${meal.breakfast || '-'}</td>
            <td>${meal.lunch || '-'}</td>
            <td>${meal.dinner || '-'}</td>
        `;
        list.appendChild(row);
    });
}

// Page Handler (Initialization logic)
export async function init() {
    UI.showAlert('Loading weekly meal plan from Sheet...', 'alert-success'); 
    
    const mealPlan = await Store.get('planner'); 
    
    if (mealPlan.error) {
        UI.showAlert('Failed to load meal plan. Check Sheet name/Deployment.', 'alert-danger');
    } else {
        displayMealPlan(mealPlan);
        document.querySelector('.alert')?.remove(); 
    }
}

// Export the init function as the entry point
export { init };