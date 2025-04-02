// Script de débogage amélioré
console.log('Script de débogage chargé');

// Vérifier si des erreurs se sont produites avant le chargement de ce script
console.log('Erreurs précédentes:', window.onerror ? 'Oui' : 'Non');

// Capturer les erreurs future
window.onerror = function(message, source, lineno, colno, error) {
    console.error('Erreur JavaScript:', message, 'sur', source, 'ligne', lineno);
    const errorInfo = document.createElement('div');
    errorInfo.style = 'position: fixed; top: 70px; left: 0; right: 0; background: red; color: white; padding: 10px; text-align: center; z-index: 9999;';
    errorInfo.textContent = `Erreur: ${message} (${source}:${lineno})`;
    document.body.appendChild(errorInfo);
    return false;
};

// Vérifier si les éléments DOM existent
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM chargé dans debug.js');
    
    // Vérifier l'élément app
    const app = document.getElementById('app');
    console.log('Élément app existe:', !!app);
    
    // Vérifier l'élément authContainer
    const authContainer = document.getElementById('authContainer');
    console.log('Élément authContainer existe:', !!authContainer);
    
    // Vérifier que les templates existent
    const templates = [
        'dashboardTemplate',
        'mealsTemplate', 
        'goalsTemplate',
        'statsTemplate',
        'profileTemplate'
    ];
    
    templates.forEach(id => {
        const template = document.getElementById(id);
        console.log(`Template ${id} existe:`, !!template);
    });
    
    // Ajouter un élément visible pour confirmer que le script fonctionne
    const debugInfo = document.createElement('div');
    debugInfo.style = 'position: fixed; bottom: 10px; right: 10px; background: red; color: white; padding: 10px; z-index: 9999;';
    debugInfo.textContent = 'Debug script loaded';
    document.body.appendChild(debugInfo);

    // Vérifier si tous les modules nécessaires sont disponibles
    setTimeout(() => {
        const debugStatus = document.createElement('div');
        debugStatus.style = 'position: fixed; top: 40px; left: 10px; background: black; color: white; padding: 10px; z-index: 9999; font-family: monospace; text-align: left; font-size: 12px;';
        let statusHTML = '<strong>Statut des modules:</strong><br>';
        
        // Liste des modules à vérifier
        const modules = [
            { name: 'API', obj: window.API },
            { name: 'Auth', obj: window.Auth },
            { name: 'App', obj: window.App },
            { name: 'Utils', obj: window.Utils },
            { name: 'Dashboard', obj: window.Dashboard },
            { name: 'Meals', obj: window.Meals },
            { name: 'Goals', obj: window.Goals },
            { name: 'Stats', obj: window.Stats },
            { name: 'Profile', obj: window.Profile }
        ];
        
        modules.forEach(module => {
            statusHTML += `${module.name}: <span style="color: ${module.obj ? 'lime' : 'red'};">${module.obj ? 'Chargé' : 'Non chargé'}</span><br>`;
        });
        
        // Vérifier les éléments DOM importants
        statusHTML += '<br><strong>Éléments DOM importants:</strong><br>';
        const elements = [
            { name: 'app', el: document.getElementById('app') },
            { name: 'authContainer', el: document.getElementById('authContainer') },
            { name: 'pageContent', el: document.getElementById('pageContent') },
            { name: 'loginForm', el: document.getElementById('loginForm') },
            { name: 'registerForm', el: document.getElementById('registerForm') }
        ];
        
        elements.forEach(el => {
            statusHTML += `${el.name}: <span style="color: ${el.el ? 'lime' : 'red'};">${el.el ? 'Trouvé' : 'Non trouvé'}</span><br>`;
        });
        
        debugStatus.innerHTML = statusHTML;
        document.body.appendChild(debugStatus);
        
        // Tester une initialisation manuelle des modules
        console.log('Tentative d\'initialisation manuelle des modules...');
        try {
            if (window.Auth && typeof window.Auth.init === 'function') {
                window.Auth.init();
                console.log('Auth.init() exécuté avec succès');
            }
            
            if (window.App && typeof window.App.init === 'function') {
                window.App.init();
                console.log('App.init() exécuté avec succès');
            }
        } catch (error) {
            console.error('Erreur lors de l\'initialisation manuelle:', error);
        }
    }, 1000);
});
