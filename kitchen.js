// kitchen.js - Handles Kitchen Activity Log Page

// CRITICAL FIX: Import Store from the shared script.js
import { Store } from './script.js';

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

// Page Handler (Initialization logic)
export async function initKitchen() {
    UI.showAlert('Loading kitchen activity logs from Sheet...', 'alert-success');
    
    const activities = await Store.get('logs');
    
    if (activities.error) {
        UI.showAlert('Failed to load kitchen log. Check Sheet name/Deployment.', 'alert-danger');
    } else {
        displayActivities(activities);
        document.querySelector('.alert')?.remove();
    }
    
    // Setup form submission
    setupFormSubmission();
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