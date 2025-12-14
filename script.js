// ===================================
// --- 0. API CONFIGURATION ---
// ===================================

// ⚠️ PASTE YOUR KITCHEN LOG GOOGLE APPS SCRIPT WEB APP URL HERE
const API_ENDPOINT = 'https://script.google.com/macros/s/AKfycbzjeNrAJJYCvd3m_UYnN8Z3s8K0VLyjsMA_Oi2vW49m9WWcmRqlR9E92rualolgaamu/exec'; 

// ===================================
// 1. COMMON UI CLASS 
// ===================================

class UI {
    // --- General UI ---
    static showAlert(message, className) {
        const container = document.querySelector('.container');
        if (!container) return; 
        
        const div = document.createElement('div');
        div.className = `alert ${className}`;
        div.appendChild(document.createTextNode(message));
        
        const insertionPoint = document.querySelector('form') || document.querySelector('h2') || document.querySelector('.table');
        
        if (insertionPoint) {
             container.insertBefore(div, insertionPoint); 
             setTimeout(() => document.querySelector('.alert')?.remove(), 3000);
        } else {
             container.prepend(div);
             setTimeout(() => document.querySelector('.alert')?.remove(), 3000);
        }
    }
    
    // --- Utility Functions ---
    // UPDATED: To handle the 'Pallavi' default cook name and clear kitchen fields
    static clearActivityFields() {
        const form = document.querySelector('#activity-form');
        if (form) {
            form.reset();
            // Explicitly set cookName back to the default value
            document.querySelector('#cookName').value = 'Pallavi'; 
        }
    }
    
    // Added for Expense Tracker form clearing
    static clearExpenseFields() {
        const form = document.querySelector('#expense-form');
        if (form) {
            form.reset(); 
        }
    }
}


// ===================================
// 2. DATA/STORE CLASS 
// ===================================

class Store {
    
    // FETCH data (GET request)
    static async get(pageName) {
        try {
            const response = await fetch(`${API_ENDPOINT}?page=${pageName}`, {
                method: 'GET',
                redirect: 'follow', 
                cache: 'no-cache'
            });
            
            if (!response.ok) {
                return { error: `HTTP error! status: ${response.status}` };
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Fetch error:', error);
            return { error: 'Failed to fetch data. See console for details.' };
        }
    }

    // POST data (Submission)
    static async post(data) {
        try {
            // Encode the data object into URL search parameters
            const urlSearchParams = new URLSearchParams(data);
            
            const response = await fetch(`${API_ENDPOINT}?${urlSearchParams.toString()}`, {
                method: 'POST',
                redirect: 'follow'
            });

            if (!response.ok) {
                UI.showAlert(`Submission failed! HTTP status: ${response.status}`, 'alert-danger');
                return false;
            }

            const result = await response.json();
            
            if (result.result === 'error') {
                 UI.showAlert(`Server Error: ${result.message}`, 'alert-danger');
                 return false;
            }
            
            return true;

        } catch (error) {
            console.error('Post error:', error);
            UI.showAlert('Failed to post data. Check console for details.', 'alert-danger');
            return false;
        }
    }
}


// Export the Store class for other modules
export { Store };


// ===================================
// 3. ROUTER / ENTRY POINT
// ===================================

document.addEventListener('DOMContentLoaded', async () => {
    let moduleName = null;
    let initFunctionName = null; // Store the function name to call
    
    // Check which page we are on based on a unique element
    if (document.querySelector('#activity-form')) {
        moduleName = 'kitchen';
        initFunctionName = 'initKitchen'; // The new function name
        
        // Set the cook name default on load, just in case JS loads before form is rendered
        const cookNameField = document.querySelector('#cookName');
        if (cookNameField && !cookNameField.value) { // Only set if empty
            cookNameField.value = 'Pallavi'; 
        }
    }
    else if (document.querySelector('#meal-plan-body')) {
        moduleName = 'planner'; 
        initFunctionName = 'initPlanner'; // The new function name
    }
    else if (document.querySelector('#expense-form')) {
        moduleName = 'expense';
        initFunctionName = 'initExpense'; // The new function name
    }

    if (moduleName) {
        try {
             // Dynamically import the required module (e.g., ./kitchen.js)
             const module = await import(`./${moduleName}.js`);
             
             // Check if the specific, renamed function exists in the module
             if (module && module[initFunctionName]) {
                 module[initFunctionName](); // <-- CALL THE RENAMED FUNCTION
             } else {
                 throw new Error(`Module ${moduleName}.js did not export a '${initFunctionName}' function.`);
             }

        } catch (error) {
            console.error('Module loading failed:', error);
            UI.showAlert(`Failed to load page logic from ${moduleName}.js. Check console for details.`, 'alert-danger');
        }
    }
});

window.UI = UI;