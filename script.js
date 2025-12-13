// ===================================
// --- 0. API CONFIGURATION ---
// ===================================

// ⚠️ PASTE YOUR KITCHEN LOG GOOGLE APPS SCRIPT WEB APP URL HERE
const API_ENDPOINT = 'YOUR_APPS_SCRIPT_WEB_APP_URL_HERE'; 

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
             // Insert alert above forms/sections
             container.insertBefore(div, insertionPoint); 
             setTimeout(() => document.querySelector('.alert')?.remove(), 3000);
        } else {
             container.prepend(div);
             setTimeout(() => document.querySelector('.alert')?.remove(), 3000);
        }
    }
    
    // --- Utility Functions ---
    static clearActivityFields() {
        if (document.querySelector('#activity-form')) {
            document.querySelector('#logDate').value = '';
            document.querySelector('#cookName').value = ''; 
            document.querySelector('#timeIn').value = '';
            document.querySelector('#timeOut').value = '';
            document.querySelector('#meal1').value = '';
            document.querySelector('#meal2').value = '';
            document.querySelector('#meal3').value = '';
            document.querySelector('#rating').value = '5'; 
            document.querySelector('#foodRemarks').value = '';
        }
    }
    
    static clearExpenseFields() {
        if (document.querySelector('#expense-form')) {
            document.querySelector('#logDate').value = '';
            document.querySelector('#category').value = ''; 
            document.querySelector('#restaurant').value = '';
            document.querySelector('#remarks').value = '';
            // Reset number inputs to default '0'
            document.querySelector('#orderAmount').value = '0';
            document.querySelector('#milkAmount').value = '0';
            document.querySelector('#curdAmount').value = '0';
            document.querySelector('#groceryAmount').value = '0';
        }
    }
}


// ===================================
// 2. COMMON STORE CLASS (CORS FIX APPLIED)
// ===================================
export class Store {
    
    /**
     * Fetches data from the Apps Script API using the 'page' parameter for routing.
     * @param {string} page - The module name (e.g., 'logs', 'expense', 'planner').
     */
    static async get(page = 'logs') { 
        const endpoint = `${API_ENDPOINT}?page=${page}`;
        
        try {
            const response = await fetch(endpoint); 
            if (!response.ok) throw new Error('Network response was not ok');
            
            const data = await response.json(); 
            if (data.error) { 
                 UI.showAlert(`API returned an error for ${page}: ${data.error}`, 'alert-danger');
                 return { error: 'API Error.' };
            }
            return data;
        } catch (error) {
            console.error(`Error fetching data for ${page}:`, error);
            UI.showAlert(`Failed to load data for ${page}. Check API URL/Deployment.`, 'alert-danger');
            return { error: 'Network/API Error.' };
        }
    }

    /**
     * Posts data to the Apps Script API using URL parameters for CORS compatibility.
     * NOTE: The 'action' key MUST be included in the input 'data' object.
     * @param {object} data - The data object to send (e.g., { action: 'kitchen_log', logDate: '...' })
     */
    static async post(data) {
        // Post data via URL parameters for CORS compatibility (key fix)
        const params = new URLSearchParams(data).toString();
        const endpoint = `${API_ENDPOINT}?${params}`;
        
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                // IMPORTANT: No headers, no body needed. Data is in URL params.
            });
            
            const result = await response.json();
            
            if (result.result === 'error') {
                 UI.showAlert('API returned an error during save: ' + result.message, 'alert-danger');
                 return false;
            }
            return result.result === 'success';
        } catch (error) {
            console.error('Error adding activity:', error);
            UI.showAlert('Network error during save. Is the API endpoint correct?', 'alert-danger');
            return false;
        }
    }
}

// ===================================
// 3. ROUTER / ENTRY POINT
// ===================================

document.addEventListener('DOMContentLoaded', async () => {
    let moduleName = null;
    
    // Check which module's HTML file is loaded
    if (document.querySelector('#activity-form')) {
        moduleName = 'kitchen';
    }
    else if (document.querySelector('#meal-plan-body')) {
        moduleName = 'planner'; 
    }
    else if (document.querySelector('#expense-form')) {
        moduleName = 'expense';
    }

    if (moduleName) {
        try {
             // Dynamically import the specific module logic
             const module = await import(`./${moduleName}.js`);
             
             if (module && module.init) {
                 module.init();
             } else {
                 throw new Error(`Module ${moduleName}.js did not export an 'init' function.`);
             }

        } catch (error) {
            console.error('Module loading failed:', error);
            // This error often occurs if the module file is missing, the import path is wrong, 
            // or if the module itself contains a syntax error (like the missing 'Store' import or duplicate export).
            UI.showAlert(`Failed to load page logic from ${moduleName}.js. Check file path, syntax, and console for details.`, 'alert-danger');
        }
    }
});

// Expose UI globally for all modules
window.UI = UI;