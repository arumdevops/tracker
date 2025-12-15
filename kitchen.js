// kitchen.js - Handles Kitchen Activity Log Page

import { Store, UI } from './script.js';

// Data Class for this module
class CookActivity {
    constructor(id, logDate, cookName, timeIn, timeOut, meal1, meal2, meal3, rating, foodRemarks) {
        this.logDate = logDate;
        this.cookName = cookName;
        this.timeIn = timeIn; 
        this.timeOut = timeOut; 
        this.meal1 = meal1;
        this.meal2 = meal2;
        this.meal3 = meal3;
        this.rating = rating;
        this.foodRemarks = foodRemarks || ''; 
        this.id = id || `${logDate}-${cookName}-${Date.now()}`; 
    }
}

// UI Rendering for this module
function displayActivities(activities) {
    const list = document.querySelector('#activity-list');
    if (!list) return;

    list.innerHTML = ''; 
    activities.sort((a, b) => new Date(b.logDate) - new Date(a.logDate));
    
    activities.forEach((activity) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${activity.logDate}</td>
            <td>${activity.cookName}</td>
            <td>${activity.timeIn} - ${activity.timeOut}</td>
            <td>${activity.meal1 || '-'}</td>
            <td>${activity.meal2 || '-'}</td>
            <td>${activity.meal3 || '-'}</td>
            <td class="text-center">${activity.rating || '-'}</td>
            <td>${activity.foodRemarks || '-'}</td>
        `;
        list.appendChild(row);
    });
}

// NEW FUNCTIONALITY: Fetch and populate meals based on date (Fix for Bug 3)
async function fetchMealPlanForDate(date) {
    if (!date) {
        // Clear meal fields if the date is cleared
        document.querySelector('#meal1').value = '';
        document.querySelector('#meal2').value = '';
        document.querySelector('#meal3').value = '';
        return;
    }

    UI.showAlert('Fetching meal plan...', 'alert-info');
    
    const meal = await Store.get('planner', date); 

    const meal1Field = document.querySelector('#meal1');
    const meal2Field = document.querySelector('#meal2');
    const meal3Field = document.querySelector('#meal3');

    // Clear previous values before populating
    meal1Field.value = '';
    meal2Field.value = '';
    meal3Field.value = '';

    if (meal && !meal.error) {
        if (meal.breakfast || meal.lunch || meal.dinner) {
            meal1Field.value = meal.breakfast || '';
            meal2Field.value = meal.lunch || '';
            meal3Field.value = meal.dinner || '';
            UI.showAlert(`Meal plan for ${date} loaded successfully.`, 'alert-success');
        } else {
             UI.showAlert(`No meal plan found for ${date}. Fields cleared.`, 'alert-warning');
        }
    } else if (meal && meal.error) {
         UI.showAlert(`Error fetching meal plan: ${meal.error}`, 'alert-danger');
    } else {
        UI.showAlert(`No meal plan found for ${date}. Please enter manually.`, 'alert-warning');
    }
}


// Page Handler (Initialization logic - Fix for Bug 2: History Load)
export async function initKitchen() {
    
    // 1. Setup date change listener
    const logDateField = document.querySelector('#logDate');
    
    if (logDateField) {
        logDateField.addEventListener('change', (e) => {
            fetchMealPlanForDate(e.target.value);
        });

        if (!logDateField.value) {
            const today = new Date().toISOString().split('T')[0];
            logDateField.value = today;
        }

        // Initial load check: fetch meal plan if a date is present
        if (logDateField.value) {
            fetchMealPlanForDate(logDateField.value);
        }
    }

    // 2. Setup form submission
    setupFormSubmission();

    // 3. Load and display existing activities (Crucial for Bug 2 fix)
    UI.showAlert('Loading past kitchen activities...', 'alert-info'); 
    
    const activities = await Store.get('logs'); 
    
    if (activities.error) {
        // This alert is critical for debugging - if you see this, check your API_ENDPOINT!
        UI.showAlert('Failed to load logs. Check console and API_ENDPOINT.', 'alert-danger');
    } else {
        displayActivities(activities);
        // Clear the initial "Loading" alert after successful load
        document.querySelector('.alert')?.remove();
    }
}

// Form Submission Logic
function setupFormSubmission() {
    document.querySelector('#activity-form').addEventListener('submit', async (e) => {
        e.preventDefault();

        // Get form values
        const logDate = document.querySelector('#logDate').value;
        const cookName = document.querySelector('#cookName').value;
        const timeIn = document.querySelector('#timeIn').value;
        const timeOut = document.querySelector('#timeOut').value;
        const meal1 = document.querySelector('#meal1').value;
        const meal2 = document.querySelector('#meal2').value;
        const meal3 = document.querySelector('#meal3').value;
        const rating = document.querySelector('#rating').value;
        const foodRemarks = document.querySelector('#foodRemarks').value; 

        if (logDate === '' || cookName === '' || timeIn === '' || timeOut === '') {
            UI.showAlert('Please fill in all required fields', 'alert-danger');
            return;
        }
        
        const activity = new CookActivity(null, logDate, cookName, timeIn, timeOut, meal1, meal2, meal3, rating, foodRemarks);

        const dataToSend = {
            action: 'kitchen_log', 
            logDate: activity.logDate,
            cookName: activity.cookName,
            timeIn: activity.timeIn,
            timeOut: activity.timeOut,
            meal1: activity.meal1,
            meal2: activity.meal2,
            meal3: activity.meal3,
            rating: activity.rating,
            foodRemarks: activity.foodRemarks
        };
        
        const success = await Store.post(dataToSend); 
        
        if (success) {
            UI.showAlert('Activity Logged Successfully! Refreshing list...', 'alert-success');
            const updatedActivities = await Store.get('logs'); 
            displayActivities(updatedActivities);
            UI.clearActivityFields();
        }
    });
}