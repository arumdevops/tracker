// ===================================
// --- 0. API CONFIGURATION ---
// ===================================

// ⚠️ PASTE YOUR KITCHEN LOG GOOGLE APPS SCRIPT WEB APP URL HERE
// This URL must be correct and your script must be deployed.
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
        
        // Find a safe insertion point
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
    static clearActivityFields() {
        const form = document.querySelector('#activity-form');
        if (form) {
            form.reset();
            // Explicitly set cookName back to the default value
            document.querySelector('#cookName').value = 'Pallavi'; 
            // Clear the dynamically populated meal fields
            document.querySelector('#meal1').value = '';
            document.querySelector('#meal2').value = '';
            document.querySelector('#meal3').value = '';
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
    
    /**
     * Fetches data from the Google Sheet backend.
     * @param {string} pageName - The type of data to fetch ('logs', 'planner', 'expense').
     * @param {string | null} [date=null] - Optional date in YYYY-MM-DD format for specific lookups (e.g., meal plan).
     */
    static async get(pageName, date = null) {
        let url = `${API_ENDPOINT}?page=${pageName}`;
        
        if (pageName === 'planner' && date) {
            url += `&date=${date}`; // Add the date parameter for specific meal plan lookup
        }

        try {
            const response = await fetch(url, {
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
            // Provide a clear error message if the fetch itself fails (e.g., network, CORS, bad API_ENDPOINT)
            return { error: 'Failed to fetch data. Check API_ENDPOINT and network connection.' };
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
export { Store, UI }; 

// ===================================
// 3. ROUTER / ENTRY POINT
// ===================================

document.addEventListener('DOMContentLoaded', async () => {
    let moduleName = null;
    let initFunctionName = null; 
    
    // Check which page we are on based on a unique element
    if (document.querySelector('#activity-form')) {
        moduleName = 'kitchen';
        initFunctionName = 'initKitchen'; 
        
        const cookNameField = document.querySelector('#cookName');
        if (cookNameField && !cookNameField.value) { 
            cookNameField.value = 'Pallavi'; 
        }
    }
    else if (document.querySelector('#meal-plan-body')) {
        moduleName = 'planner'; 
        initFunctionName = 'initPlanner'; 
    }
    else if (document.querySelector('#expense-form')) {
        moduleName = 'expense';
        initFunctionName = 'initExpense'; 
    }

    if (moduleName) {
        try {
             const module = await import(`./${moduleName}.js`);
             
             if (module && module[initFunctionName]) {
                 module[initFunctionName]();
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