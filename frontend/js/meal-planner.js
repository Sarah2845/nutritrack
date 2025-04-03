/**
 * Planification de menus - NutriTrack
 * Implémentation des fonctionnalités CRUD avec AJAX
 */

// Variables globales
let currentWeekStart = new Date(); // Date de début de la semaine affichée
let mealPlans = []; // Plans de repas pour la semaine
let availableMeals = []; // Liste des repas disponibles
let currentEditPlanId = null; // ID du plan en cours d'édition

// Constantes
const DAYS_OF_WEEK = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const MEAL_TIMES = ['breakfast', 'lunch', 'dinner', 'snack'];
const MEAL_TIMES_FR = {
    breakfast: 'Petit-déjeuner',
    lunch: 'Déjeuner',
    dinner: 'Dîner',
    snack: 'Collation'
};

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    // Vérification de l'authentification
    if (!Auth.isAuthenticated()) {
        window.location.href = '/login.html';
        return;
    }
    
    // Permettre le chargement normal de la page si l'utilisateur est authentifié

    // Mise à jour des informations utilisateur
    updateUserInterface(Auth.getCurrentUser());

    // Mettre à jour l'affichage de la semaine actuelle
    setWeekToCurrentWeek();
    updateWeekDisplay();

    // Charger les repas disponibles et les plans de repas
    // Assurer que les repas sont chargés avant les plans
    console.log('Chargement initial des données');
    loadAvailableMeals().then(() => {
        console.log('Repas chargés, chargement des plans...');
        return loadMealPlans();
    }).catch(err => {
        console.error('Erreur lors du chargement initial:', err);
        showNotification('Erreur lors du chargement des données', 'danger');
    });

    // Configurer les écouteurs d'événements
    setupEventListeners();
});

// Configurer les écouteurs d'événements
function setupEventListeners() {
    // Navigation entre les semaines
    document.getElementById('prevWeekBtn').addEventListener('click', () => {
        navigateWeek(-7);
    });
    
    document.getElementById('nextWeekBtn').addEventListener('click', () => {
        navigateWeek(7);
    });

    // Sauvegarde d'un plan de repas
    document.getElementById('saveMealPlanBtn').addEventListener('click', saveMealPlan);

    // Confirmation de suppression
    document.getElementById('confirmDeleteBtn').addEventListener('click', deleteMealPlan);
    
    // Génération de liste de courses
    document.getElementById('createShoppingListBtn').addEventListener('click', generateShoppingList);
    
    // Exportation du plan
    document.getElementById('exportPlanBtn').addEventListener('click', exportMealPlan);
    
    // Partage du plan
    document.getElementById('sharePlanBtn').addEventListener('click', shareMealPlan);
    
    // Déconnexion
    document.getElementById('logoutBtn').addEventListener('click', logout);
}

// Mise à jour de l'interface utilisateur avec les informations de l'utilisateur
function updateUserInterface(user) {
    if (user) {
        document.getElementById('username').textContent = user.name || user.email;
    }
}

// Fonction de déconnexion
function logout() {
    Auth.logout();
    window.location.href = '/login.html';
}

// Définir la semaine actuelle
function setWeekToCurrentWeek() {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = dimanche, 1 = lundi, ..., 6 = samedi
    
    // Ajuster pour que lundi soit le premier jour de la semaine
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Si c'est dimanche, on recule de 6 jours, sinon on ajuste
    
    currentWeekStart = new Date(today);
    currentWeekStart.setDate(today.getDate() + diff);
    currentWeekStart.setHours(0, 0, 0, 0);
    
    console.log('Semaine réglée à partir du:', currentWeekStart);
    console.log('Format ISO de la date de début:', currentWeekStart.toISOString());
    console.log('Format API de la date de début:', formatDateForAPI(currentWeekStart));
}

// Mettre à jour l'affichage de la semaine
function updateWeekDisplay() {
    const weekEnd = new Date(currentWeekStart);
    weekEnd.setDate(currentWeekStart.getDate() + 6);
    
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    const startStr = currentWeekStart.toLocaleDateString('fr-FR', options);
    const endStr = weekEnd.toLocaleDateString('fr-FR', options);
    
    document.getElementById('currentWeekDisplay').textContent = `Semaine du ${startStr} au ${endStr}`;
    
    // Générer les colonnes pour chaque jour
    generateWeeklyPlanLayout();
}

// Naviguer entre les semaines
function navigateWeek(daysToAdd) {
    currentWeekStart.setDate(currentWeekStart.getDate() + daysToAdd);
    updateWeekDisplay();
    loadMealPlans();
}

// Générer la mise en page du planning hebdomadaire
function generateWeeklyPlanLayout() {
    const container = document.getElementById('weeklyPlanContainer');
    container.innerHTML = '';
    
    for (let i = 0; i < 7; i++) {
        const date = new Date(currentWeekStart);
        date.setDate(currentWeekStart.getDate() + i);
        
        const dayName = DAYS_OF_WEEK[i];
        const formattedDate = date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
        
        const column = document.createElement('div');
        column.className = 'col-md-3 col-sm-6 col-lg mb-4';
        column.innerHTML = `
            <div class="day-column">
                <div class="meal-day-header">
                    <h5 class="m-0">${dayName}</h5>
                    <small>${formattedDate}</small>
                </div>
                ${MEAL_TIMES.map(mealTime => `
                    <div class="meal-slot" data-day="${i}" data-meal-time="${mealTime}">
                        <div class="meal-slot-header d-flex justify-content-between align-items-center mb-2">
                            <span class="text-muted">${MEAL_TIMES_FR[mealTime]}</span>
                            <i class="bi bi-plus-circle add-meal-btn" 
                               onclick="openAddMealModal(${i}, '${mealTime}')"></i>
                        </div>
                        <div class="meal-items-container" id="meals-day-${i}-${mealTime}">
                            <!-- Les repas planifiés seront ajoutés ici dynamiquement -->
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        
        container.appendChild(column);
    }
}

// Charger les repas disponibles
async function loadAvailableMeals() {
    try {
        const token = localStorage.getItem('nutritrack_token');
        if (!token) {
            showNotification('Vous devez être connecté pour accéder à vos repas', 'danger');
            return;
        }
        
        console.log('Début du chargement des repas disponibles');
        
        // Ajouter un timestamp pour éviter le cache
        const timestamp = new Date().getTime();
        const url = `/api/meals?_=${timestamp}`;
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Erreur lors du chargement des repas: ${response.status}`);
        }
        
        const data = await response.json();
        availableMeals = data.meals || [];
        console.log(`${availableMeals.length} repas disponibles chargés`);
        console.log('IDs des repas disponibles:', availableMeals.map(m => m.id).join(', '));
        
    } catch (error) {
        console.error('Erreur lors du chargement des repas:', error);
        showNotification('Impossible de charger les repas disponibles', 'danger');
    }
}

// Charger les plans de repas pour la semaine sélectionnée
async function loadMealPlans() {
    try {
        const token = localStorage.getItem('nutritrack_token');
        if (!token) {
            showNotification('Vous devez être connecté pour accéder à vos plans de repas', 'danger');
            return;
        }
        
        // Formater les dates pour l'API
        const startDate = formatDateForAPI(currentWeekStart);
        const endDate = formatDateForAPI(new Date(currentWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000));
        
        // Ajouter un timestamp pour éviter le cache
        const timestamp = new Date().getTime();
        const url = `/api/meal-plans?startDate=${startDate}&endDate=${endDate}&_=${timestamp}`;
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Cache-Control': 'no-cache, no-store, must-revalidate'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Erreur lors du chargement des plans de repas: ${response.status}`);
        }
        
        const data = await response.json();
        mealPlans = data.mealPlans || [];
        console.log(`${mealPlans.length} plans de repas chargés`);
        console.log('Plans chargés:', JSON.stringify(mealPlans));
        
        // Mettre à jour l'affichage
        updateMealPlanDisplay();
        updateWeeklyNutritionSummary();
        
    } catch (error) {
        console.error('Erreur lors du chargement des plans de repas:', error);
        showNotification('Impossible de charger les plans de repas', 'danger');
    }
}

// Formater une date pour l'API (YYYY-MM-DD)
function formatDateForAPI(date) {
    return date.toISOString().split('T')[0];
}

// Mettre à jour l'affichage des plans de repas
function updateMealPlanDisplay() {
    console.log('===== Début de mise à jour de l\'affichage des plans =====');
    console.log('Date de début de la semaine actuelle:', currentWeekStart);
    console.log('Nombre de plans à afficher:', mealPlans.length);
    console.log('Nombre de repas disponibles:', availableMeals.length);
    
    // Réinitialiser tous les conteneurs de repas
    DAYS_OF_WEEK.forEach((_, dayIndex) => {
        MEAL_TIMES.forEach(mealTime => {
            const container = document.getElementById(`meals-day-${dayIndex}-${mealTime}`);
            if (container) {
                container.innerHTML = '';
            } else {
                console.error(`Conteneur non trouvé: meals-day-${dayIndex}-${mealTime}`);
            }
        });
    });
    
    // Parcourir tous les plans de repas pour la semaine
    mealPlans.forEach((plan, index) => {
        console.log(`Plan ${index+1}:`, plan);
        
        // Convertir correctement les dates en objets Date
        const planDateParts = plan.date.split('-').map(p => parseInt(p));
        const planDate = new Date(planDateParts[0], planDateParts[1]-1, planDateParts[2]);
        const currentWeekStartObj = new Date(currentWeekStart);
        
        // Déterminer l'index du jour à utiliser
        let dayIndex;
        
        // Si dayIndex est déjà enregistré dans le plan, l'utiliser
        if (plan.dayIndex !== undefined && plan.dayIndex !== null) {
            dayIndex = parseInt(plan.dayIndex);
            console.log(`  Utilisation de l'index du jour enregistré: ${dayIndex}`);
        } else {
            // Alternative simplifiée - extraire le jour de la semaine directement
            // Le nom du plan contient le jour (lundi, mardi, etc.)
            if (plan.mealTime) {
                // On obtient l'index en fonction du moment du repas et de la date
                const mealDate = new Date(planDate);
                // 0 = dimanche, 1 = lundi, ..., 6 = samedi
                const mealDayOfWeek = mealDate.getDay();
                // Convertir pour que lundi = 0, mardi = 1, etc.
                dayIndex = mealDayOfWeek === 0 ? 6 : mealDayOfWeek - 1;
                console.log(`  Calcul de l'index du jour à partir du jour de la semaine: ${dayIndex}`);
            } else {
                // Méthode de secours - essayer de déterminer à partir de la différence de dates
                const mondayOfWeek = new Date(currentWeekStartObj);
                // Réinitialiser l'heure
                mondayOfWeek.setHours(0, 0, 0, 0);
                planDate.setHours(0, 0, 0, 0);
                
                // Calcul plus précis basé sur la différence de dates ISO
                const mondayStr = mondayOfWeek.toISOString().split('T')[0];
                const planStr = planDate.toISOString().split('T')[0];
                
                // Calculer la différence en jours
                const diffTime = Math.abs(planDate - mondayOfWeek);
                dayIndex = Math.round(diffTime / (1000 * 60 * 60 * 24));
                
                console.log(`  Méthode de secours - Calcul de l'index: ${dayIndex}`);
                console.log(`  Jour du plan ISO: ${planStr}, Jour du lundi ISO: ${mondayStr}`);
            }
        }
        
        console.log(`  Date du plan: ${planDate}, format: ${plan.date}`);
        console.log(`  Date de début de semaine: ${currentWeekStartObj}`);
        console.log(`  Index du jour final: ${dayIndex}`);
        
        // Vérifier si nous avons un index de jour valide pour cette semaine
        if (dayIndex >= 0 && dayIndex <= 6) {
            console.log(`  Ce plan est pour le jour ${dayIndex} de la semaine actuelle`);
            // Trouver le repas correspondant
            const meal = availableMeals.find(m => m.id === plan.mealId);
            if (!meal) {
                console.error(`  ERREUR: Repas non trouvé pour l'ID: ${plan.mealId}`);
                return;
            }
            console.log(`  Repas trouvé: ${meal.name}`);
            
            // Créer l'élément de repas
            const container = document.getElementById(`meals-day-${dayIndex}-${plan.mealTime}`);
            
            // Calculer les valeurs nutritionnelles en fonction du nombre de portions
            const calories = Math.round(meal.calories * plan.servings);
            const proteins = Math.round(meal.proteins * plan.servings * 10) / 10;
            const carbs = Math.round(meal.carbs * plan.servings * 10) / 10;
            const fats = Math.round(meal.fats * plan.servings * 10) / 10;
            
            const mealItem = document.createElement('div');
            mealItem.className = 'meal-item';
            mealItem.innerHTML = `
                <div class="d-flex justify-content-between align-items-start">
                    <h6 class="mb-1">${meal.name}</h6>
                    <div>
                        <i class="bi bi-pencil-square text-primary me-1" 
                           onclick="openEditMealModal('${plan.id}')"></i>
                        <i class="bi bi-trash text-danger" 
                           onclick="openDeleteModal('${plan.id}')"></i>
                    </div>
                </div>
                <p class="mb-1 text-muted small">${calories} kcal | P: ${proteins}g | G: ${carbs}g | L: ${fats}g</p>
                ${plan.notes ? `<p class="mb-0 small fst-italic">${plan.notes}</p>` : ''}
                <span class="badge bg-secondary">${plan.servings} portion${plan.servings > 1 ? 's' : ''}</span>
            `;
            
            container.appendChild(mealItem);
            console.log(`  Repas ajouté à l'interface avec succès`);
        } else {
            console.log(`  Ce plan n'est pas dans la semaine actuelle (jour ${dayDiff})`);
        }
    });
    console.log('===== Fin de mise à jour de l\'affichage des plans =====');
}

// Calculer et mettre à jour le résumé nutritionnel de la semaine
function updateWeeklyNutritionSummary() {
    console.log('===== Mise à jour du résumé nutritionnel =====');
    let totalCalories = 0;
    let totalProteins = 0;
    let totalCarbs = 0;
    let totalFats = 0;
    
    // Parcourir tous les plans de repas pour la semaine
    mealPlans.forEach(plan => {
        // Déterminer si le plan est pour cette semaine en utilisant la même logique que pour l'affichage
        
        // Convertir correctement la date du plan
        const planDateParts = plan.date.split('-').map(p => parseInt(p));
        const planDate = new Date(planDateParts[0], planDateParts[1]-1, planDateParts[2]);
        const currentWeekStartObj = new Date(currentWeekStart);
        
        // Déterminer l'index du jour
        let dayIndex;
        
        // Si dayIndex est déjà enregistré dans le plan, l'utiliser
        if (plan.dayIndex !== undefined && plan.dayIndex !== null) {
            dayIndex = parseInt(plan.dayIndex);
        } else {
            // Même logique que dans updateMealPlanDisplay pour déterminer le jour
            const mealDate = new Date(planDate);
            const mealDayOfWeek = mealDate.getDay();
            dayIndex = mealDayOfWeek === 0 ? 6 : mealDayOfWeek - 1;
            
            // Vérification supplémentaire au besoin
            if (dayIndex < 0 || dayIndex > 6) {
                const mondayOfWeek = new Date(currentWeekStartObj);
                mondayOfWeek.setHours(0, 0, 0, 0);
                planDate.setHours(0, 0, 0, 0);
                const diffTime = Math.abs(planDate - mondayOfWeek);
                dayIndex = Math.round(diffTime / (1000 * 60 * 60 * 24));
            }
        }
        
        // Vérifier si le plan est pour cette semaine (0-6)
        if (dayIndex >= 0 && dayIndex <= 6) {
            // Trouver le repas correspondant
            const meal = availableMeals.find(m => m.id === plan.mealId);
            if (!meal) {
                console.error(`Repas non trouvé pour l'ID: ${plan.mealId} dans le résumé nutritionnel`);
                return;
            }
            
            // Additionner les valeurs nutritionnelles
            totalCalories += meal.calories * plan.servings;
            totalProteins += meal.proteins * plan.servings;
            totalCarbs += meal.carbs * plan.servings;
            totalFats += meal.fats * plan.servings;
            console.log(`Ajout des macros pour ${meal.name}: ${meal.calories} kcal x ${plan.servings} portions`);
        }
    });
    
    // Arrondir les valeurs pour un meilleur affichage
    totalCalories = Math.round(totalCalories);
    totalProteins = Math.round(totalProteins * 10) / 10;
    totalCarbs = Math.round(totalCarbs * 10) / 10;
    totalFats = Math.round(totalFats * 10) / 10;
    
    // Mettre à jour l'affichage
    document.getElementById('weeklyCalories').textContent = totalCalories;
    document.getElementById('weeklyProteins').textContent = `${totalProteins} g`;
    document.getElementById('weeklyCarbs').textContent = `${totalCarbs} g`;
    document.getElementById('weeklyFats').textContent = `${totalFats} g`;
}

// Ouvrir le modal pour ajouter un repas au planning
function openAddMealModal(dayIndex, mealTime) {
    // Réinitialiser le formulaire
    document.getElementById('mealPlanForm').reset();
    document.getElementById('planId').value = '';
    currentEditPlanId = null;
    
    // Configurer le modal
    document.getElementById('modalTitle').textContent = `Ajouter un repas - ${MEAL_TIMES_FR[mealTime]}`;
    document.getElementById('dayOfWeek').value = dayIndex;
    document.getElementById('mealTime').value = mealTime;
    
    // Remplir le sélecteur de repas
    populateMealSelector();
    
    // Ouvrir le modal
    const modal = new bootstrap.Modal(document.getElementById('mealPlanModal'));
    modal.show();
}

// Ouvrir le modal pour éditer un repas planifié
function openEditMealModal(planId) {
    // Rechercher le plan dans la liste
    const plan = mealPlans.find(p => p.id === planId);
    if (!plan) {
        showNotification('Plan de repas non trouvé', 'danger');
        return;
    }
    
    // Stocker l'ID du plan en cours d'édition
    currentEditPlanId = planId;
    
    // Réinitialiser et remplir le formulaire
    document.getElementById('mealPlanForm').reset();
    
    document.getElementById('planId').value = planId;
    
    const planDate = new Date(plan.date);
    const dayDiff = Math.floor((planDate - currentWeekStart) / (24 * 60 * 60 * 1000));
    document.getElementById('dayOfWeek').value = dayDiff;
    
    document.getElementById('mealTime').value = plan.mealTime;
    document.getElementById('servings').value = plan.servings;
    document.getElementById('planNotes').value = plan.notes || '';
    
    // Configurer le modal
    document.getElementById('modalTitle').textContent = `Modifier le repas - ${MEAL_TIMES_FR[plan.mealTime]}`;
    
    // Remplir le sélecteur de repas
    populateMealSelector(plan.mealId);
    
    // Ouvrir le modal
    const modal = new bootstrap.Modal(document.getElementById('mealPlanModal'));
    modal.show();
}

// Remplir le sélecteur de repas
function populateMealSelector(selectedMealId = null) {
    const selector = document.getElementById('mealSelector');
    selector.innerHTML = '<option value="">Sélectionner un repas...</option>';
    
    if (availableMeals.length === 0) {
        selector.innerHTML += '<option value="" disabled>Aucun repas disponible</option>';
        return;
    }
    
    availableMeals.forEach(meal => {
        const option = document.createElement('option');
        option.value = meal.id;
        option.textContent = `${meal.name} (${meal.calories} kcal)`;
        option.selected = meal.id === selectedMealId;
        selector.appendChild(option);
    });
}

// Enregistrer un plan de repas
async function saveMealPlan() {
    try {
        // Valider le formulaire
        const form = document.getElementById('mealPlanForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }
        
        // Récupérer les données du formulaire
        const planId = document.getElementById('planId').value;
        const dayIndex = parseInt(document.getElementById('dayOfWeek').value);
        const mealTime = document.getElementById('mealTime').value;
        const mealId = document.getElementById('mealSelector').value;
        const servings = parseFloat(document.getElementById('servings').value);
        const notes = document.getElementById('planNotes').value;
        
        // Calculer la date du plan
        const planDate = new Date(currentWeekStart);
        planDate.setDate(currentWeekStart.getDate() + dayIndex);
        
        // Préparer les données
        const planData = {
            mealId,
            date: formatDateForAPI(planDate),
            mealTime,
            servings,
            notes,
            dayIndex   // Stocker l'index du jour sélectionné
        };
        
        console.log('Données du plan à enregistrer:', planData);
        
        // Récupérer le token d'authentification
        const token = localStorage.getItem('nutritrack_token');
        if (!token) {
            showNotification('Vous devez être connecté pour enregistrer un plan de repas', 'danger');
            return;
        }
        
        // URL et méthode en fonction de l'action (ajout ou modification)
        let url = '/api/meal-plans';
        let method = 'POST';
        
        if (currentEditPlanId) {
            url += `/${currentEditPlanId}`;
            method = 'PUT';
        }
        
        // Faire la requête AJAX
        const response = await fetch(url, {
            method: method,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(planData)
        });
        
        if (!response.ok) {
            throw new Error(`Erreur lors de l'enregistrement du plan: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Plan enregistré:', data);
        
        // Fermer le modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('mealPlanModal'));
        modal.hide();
        
        // Afficher une notification
        showNotification(
            currentEditPlanId ? 'Plan modifié avec succès' : 'Plan ajouté avec succès', 
            'success'
        );
        
        // Recharger les repas puis les plans de repas pour s'assurer que tout est à jour
        console.log('Rechargement après ajout/modification d\'un plan');
        loadAvailableMeals().then(() => {
            return loadMealPlans();
        }).catch(err => {
            console.error('Erreur lors du rechargement après ajout:', err);
        });
        
    } catch (error) {
        console.error('Erreur lors de l\'enregistrement du plan de repas:', error);
        showNotification('Erreur lors de l\'enregistrement du plan', 'danger');
    }
}

// Ouvrir le modal de confirmation de suppression
function openDeleteModal(planId) {
    document.getElementById('deletePlanId').value = planId;
    const modal = new bootstrap.Modal(document.getElementById('deletePlanModal'));
    modal.show();
}

// Supprimer un plan de repas
async function deleteMealPlan() {
    try {
        const planId = document.getElementById('deletePlanId').value;
        
        if (!planId) {
            showNotification('Erreur: ID du plan manquant', 'danger');
            return;
        }
        
        // Récupérer le token d'authentification
        const token = localStorage.getItem('nutritrack_token');
        if (!token) {
            showNotification('Vous devez être connecté pour supprimer un plan de repas', 'danger');
            return;
        }
        
        // Faire la requête AJAX
        const response = await fetch(`/api/meal-plans/${planId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`Erreur lors de la suppression du plan: ${response.status}`);
        }
        
        // Fermer le modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('deletePlanModal'));
        modal.hide();
        
        // Afficher une notification
        showNotification('Plan supprimé avec succès', 'success');
        
        // Recharger les plans de repas
        loadMealPlans();
        
    } catch (error) {
        console.error('Erreur lors de la suppression du plan de repas:', error);
        showNotification('Erreur lors de la suppression du plan', 'danger');
    }
}

// Générer une liste de courses à partir du plan de repas
function generateShoppingList() {
    // Initialiser les ingrédients comme une Map pour éliminer les doublons
    // et additionner les quantités similaires
    const ingredients = new Map();
    
    // Parcourir tous les plans de repas pour la semaine
    let hasPlans = false;
    mealPlans.forEach(plan => {
        const planDate = new Date(plan.date);
        const dayDiff = Math.floor((planDate - currentWeekStart) / (24 * 60 * 60 * 1000));
        
        // Vérifier si le plan est pour cette semaine (0-6)
        if (dayDiff >= 0 && dayDiff <= 6) {
            hasPlans = true;
            // Trouver le repas correspondant
            const meal = availableMeals.find(m => m.id === plan.mealId);
            if (!meal || !meal.ingredients) return;
            
            // Ajouter les ingrédients à la liste
            meal.ingredients.forEach(ing => {
                const key = ing.name.toLowerCase();
                const currentQuantity = ingredients.has(key) ? ingredients.get(key).quantity : 0;
                const newQuantity = currentQuantity + (ing.quantity * plan.servings);
                
                ingredients.set(key, {
                    name: ing.name,
                    quantity: newQuantity,
                    unit: ing.unit
                });
            });
        }
    });
    
    if (!hasPlans) {
        showNotification('Aucun repas planifié pour cette semaine', 'warning');
        return;
    }
    
    // Convertir la Map en Array et trier par nom
    const sortedIngredients = Array.from(ingredients.values()).sort((a, b) => 
        a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' })
    );
    
    // Créer un document HTML pour l'impression
    const printWindow = window.open('', '_blank');
    
    if (!printWindow) {
        showNotification('Veuillez autoriser les fenêtres pop-up pour générer la liste de courses', 'warning');
        return;
    }
    
    // Créer le contenu HTML de la liste de courses
    const weekStart = currentWeekStart.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
    const weekEnd = new Date(currentWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000)
        .toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    
    printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="fr">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Liste de courses - NutriTrack</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                h1 { color: #4e73df; }
                .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
                .logo { font-weight: bold; font-size: 24px; color: #4e73df; }
                .date { color: #666; margin-bottom: 10px; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                th, td { padding: 8px 12px; text-align: left; border-bottom: 1px solid #ddd; }
                th { background-color: #f2f2f2; }
                .print-btn { background-color: #4e73df; color: white; border: none; padding: 10px 20px; cursor: pointer; }
                .print-btn:hover { background-color: #2e59d9; }
                @media print {
                    .no-print { display: none; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <div>
                    <div class="logo">NutriTrack</div>
                    <div class="date">Liste de courses - Semaine du ${weekStart} au ${weekEnd}</div>
                </div>
                <button class="print-btn no-print" onclick="window.print(); setTimeout(() => window.close(), 500);">Imprimer</button>
            </div>
            
            <table>
                <thead>
                    <tr>
                        <th>Ingrédient</th>
                        <th>Quantité</th>
                        <th>Unité</th>
                        <th class="no-print">Acheté</th>
                    </tr>
                </thead>
                <tbody>
                    ${sortedIngredients.map(ing => `
                        <tr>
                            <td>${ing.name}</td>
                            <td>${ing.quantity.toFixed(1).replace(/\.0$/, '')}</td>
                            <td>${ing.unit || ''}</td>
                            <td class="no-print"><input type="checkbox"></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            
            <div class="notes no-print">
                <h3>Notes</h3>
                <textarea rows="4" style="width: 100%" placeholder="Ajoutez vos notes ici..."></textarea>
            </div>
        </body>
        </html>
    `);
    
    printWindow.document.close();
}

// Exporter le plan de repas au format PDF ou CSV
function exportMealPlan() {
    // Vérifier s'il y a des repas planifiés
    let hasPlans = false;
    mealPlans.forEach(plan => {
        const planDate = new Date(plan.date);
        const dayDiff = Math.floor((planDate - currentWeekStart) / (24 * 60 * 60 * 1000));
        if (dayDiff >= 0 && dayDiff <= 6) hasPlans = true;
    });
    
    if (!hasPlans) {
        showNotification('Aucun repas planifié pour cette semaine', 'warning');
        return;
    }
    
    // Créer un document HTML pour l'exportation
    const exportWindow = window.open('', '_blank');
    
    if (!exportWindow) {
        showNotification('Veuillez autoriser les fenêtres pop-up pour exporter le plan', 'warning');
        return;
    }
    
    // Période
    const weekStart = currentWeekStart.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
    const weekEnd = new Date(currentWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000)
        .toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    
    // Générer le tableau des repas
    let mealTableRows = [];
    
    for (let i = 0; i < 7; i++) {
        const date = new Date(currentWeekStart);
        date.setDate(currentWeekStart.getDate() + i);
        const formattedDate = date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
        
        // Pour chaque type de repas
        MEAL_TIMES.forEach(mealTime => {
            const plansForMeal = mealPlans.filter(plan => {
                const planDate = new Date(plan.date);
                const dayDiff = Math.floor((planDate - currentWeekStart) / (24 * 60 * 60 * 1000));
                return dayDiff === i && plan.mealTime === mealTime;
            });
            
            if (plansForMeal.length > 0) {
                plansForMeal.forEach(plan => {
                    const meal = availableMeals.find(m => m.id === plan.mealId);
                    if (!meal) return;
                    
                    // Calculer les valeurs nutritionnelles
                    const calories = Math.round(meal.calories * plan.servings);
                    const proteins = Math.round(meal.proteins * plan.servings * 10) / 10;
                    const carbs = Math.round(meal.carbs * plan.servings * 10) / 10;
                    const fats = Math.round(meal.fats * plan.servings * 10) / 10;
                    
                    mealTableRows.push(`
                        <tr>
                            <td>${formattedDate}</td>
                            <td>${MEAL_TIMES_FR[mealTime]}</td>
                            <td>${meal.name}</td>
                            <td>${plan.servings}</td>
                            <td>${calories}</td>
                            <td>${proteins}g</td>
                            <td>${carbs}g</td>
                            <td>${fats}g</td>
                            <td>${plan.notes || '-'}</td>
                        </tr>
                    `);
                });
            }
        });
    }
    
    // Calculer le total nutritionnel
    let totalCalories = 0, totalProteins = 0, totalCarbs = 0, totalFats = 0;
    
    mealPlans.forEach(plan => {
        const planDate = new Date(plan.date);
        const dayDiff = Math.floor((planDate - currentWeekStart) / (24 * 60 * 60 * 1000));
        
        if (dayDiff >= 0 && dayDiff <= 6) {
            const meal = availableMeals.find(m => m.id === plan.mealId);
            if (!meal) return;
            
            totalCalories += meal.calories * plan.servings;
            totalProteins += meal.proteins * plan.servings;
            totalCarbs += meal.carbs * plan.servings;
            totalFats += meal.fats * plan.servings;
        }
    });
    
    // Arrondir les totaux
    totalCalories = Math.round(totalCalories);
    totalProteins = Math.round(totalProteins * 10) / 10;
    totalCarbs = Math.round(totalCarbs * 10) / 10;
    totalFats = Math.round(totalFats * 10) / 10;
    
    // Générer le document HTML
    exportWindow.document.write(`
        <!DOCTYPE html>
        <html lang="fr">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Plan de repas - NutriTrack</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                h1, h2 { color: #4e73df; }
                .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
                .logo { font-weight: bold; font-size: 24px; color: #4e73df; }
                .date { color: #666; margin-bottom: 10px; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                th, td { padding: 8px 12px; text-align: left; border-bottom: 1px solid #ddd; }
                th { background-color: #f2f2f2; }
                .totals { background-color: #f8f9fa; font-weight: bold; }
                .print-btn { background-color: #4e73df; color: white; border: none; padding: 10px 20px; cursor: pointer; }
                .print-btn:hover { background-color: #2e59d9; }
                .export-btn { background-color: #1cc88a; color: white; border: none; padding: 10px 20px; cursor: pointer; margin-left: 10px; }
                .export-btn:hover { background-color: #169a6e; }
                @media print {
                    .no-print { display: none; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <div>
                    <div class="logo">NutriTrack</div>
                    <div class="date">Plan de repas - Semaine du ${weekStart} au ${weekEnd}</div>
                </div>
                <div>
                    <button class="print-btn no-print" onclick="window.print(); setTimeout(() => window.close(), 500);">Imprimer</button>
                    <button class="export-btn no-print" onclick="exportToCSV()">Exporter en CSV</button>
                </div>
            </div>
            
            <h2>Résumé nutritionnel</h2>
            <table>
                <thead>
                    <tr>
                        <th>Calories</th>
                        <th>Protéines</th>
                        <th>Glucides</th>
                        <th>Lipides</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>${totalCalories} kcal</td>
                        <td>${totalProteins}g</td>
                        <td>${totalCarbs}g</td>
                        <td>${totalFats}g</td>
                    </tr>
                </tbody>
            </table>
            
            <h2>Détail des repas</h2>
            <table>
                <thead>
                    <tr>
                        <th>Jour</th>
                        <th>Repas</th>
                        <th>Nom</th>
                        <th>Portions</th>
                        <th>Calories</th>
                        <th>Protéines</th>
                        <th>Glucides</th>
                        <th>Lipides</th>
                        <th>Notes</th>
                    </tr>
                </thead>
                <tbody>
                    ${mealTableRows.join('')}
                </tbody>
            </table>
            
            <script>
                function exportToCSV() {
                    // Préparer les en-têtes CSV
                    let csv = 'Jour,Repas,Nom,Portions,Calories,Protéines,Glucides,Lipides,Notes\n';
                    
                    // Sélectionner toutes les lignes du tableau sauf l'en-tête
                    const rows = document.querySelectorAll('table:nth-of-type(2) tbody tr');
                    
                    // Convertir chaque ligne en CSV
                    rows.forEach(row => {
                        const cells = row.querySelectorAll('td');
                        const rowData = Array.from(cells).map(cell => {
                            // Échapper les guillemets et les virgules dans les valeurs
                            let value = cell.textContent.trim();
                            if (value.includes(',')) {
                                value = '"' + value.replace(/"/g, '""') + '"';
                            }
                            return value;
                        });
                        csv += rowData.join(',') + '\n';
                    });
                    
                    // Créer un élément de lien pour télécharger le fichier
                    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                    const link = document.createElement('a');
                    
                    // Créer une URL pour le blob
                    const url = URL.createObjectURL(blob);
                    link.setAttribute('href', url);
                    link.setAttribute('download', 'plan_repas_${weekStart.replace(/ /g, '_')}.csv');
                    link.style.visibility = 'hidden';
                    
                    // Ajouter le lien au document et cliquer dessus
                    document.body.appendChild(link);
                    link.click();
                    
                    // Nettoyer
                    document.body.removeChild(link);
                }
            </script>
        </body>
        </html>
    `);
    
    exportWindow.document.close();
}

// Partager le plan de repas
function shareMealPlan() {
    // Vérifier s'il y a des repas planifiés
    let hasPlans = false;
    mealPlans.forEach(plan => {
        const planDate = new Date(plan.date);
        const dayDiff = Math.floor((planDate - currentWeekStart) / (24 * 60 * 60 * 1000));
        if (dayDiff >= 0 && dayDiff <= 6) hasPlans = true;
    });
    
    if (!hasPlans) {
        showNotification('Aucun repas planifié pour cette semaine', 'warning');
        return;
    }
    
    // Préparer les données pour le partage
    const weekStart = currentWeekStart.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
    const weekEnd = new Date(currentWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000)
        .toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    
    // Générer un résumé textuel du plan
    let summary = `Plan de repas - Semaine du ${weekStart} au ${weekEnd}\n\n`;
    
    for (let i = 0; i < 7; i++) {
        const date = new Date(currentWeekStart);
        date.setDate(currentWeekStart.getDate() + i);
        const formattedDate = date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
        
        summary += `${formattedDate}:\n`;
        let hasMealsForDay = false;
        
        // Pour chaque type de repas
        MEAL_TIMES.forEach(mealTime => {
            const plansForMeal = mealPlans.filter(plan => {
                const planDate = new Date(plan.date);
                const dayDiff = Math.floor((planDate - currentWeekStart) / (24 * 60 * 60 * 1000));
                return dayDiff === i && plan.mealTime === mealTime;
            });
            
            if (plansForMeal.length > 0) {
                hasMealsForDay = true;
                summary += `  ${MEAL_TIMES_FR[mealTime]}: `;
                
                plansForMeal.forEach((plan, idx) => {
                    const meal = availableMeals.find(m => m.id === plan.mealId);
                    if (!meal) return;
                    
                    summary += `${meal.name} (${plan.servings} portion${plan.servings > 1 ? 's' : ''})`;
                    if (idx < plansForMeal.length - 1) summary += ', ';
                });
                summary += '\n';
            }
        });
        
        if (!hasMealsForDay) {
            summary += '  Aucun repas planifié\n';
        }
        
        summary += '\n';
    }
    
    // Vérifier si l'API Web Share est disponible
    if (navigator.share) {
        navigator.share({
            title: `Plan de repas - Semaine du ${weekStart} au ${weekEnd}`,
            text: summary
        }).catch(err => {
            console.error('Erreur lors du partage:', err);
            fallbackShare();
        });
    } else {
        fallbackShare();
    }
    
    // Méthode alternative de partage
    function fallbackShare() {
        // Créer un élément textarea temporaire
        const textarea = document.createElement('textarea');
        textarea.value = summary;
        textarea.style.position = 'fixed';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        
        try {
            // Copier dans le presse-papier
            const successful = document.execCommand('copy');
            
            if (successful) {
                showNotification('Plan de repas copié dans le presse-papier', 'success');
            } else {
                showNotification('Impossible de copier le plan', 'warning');
            }
        } catch (err) {
            console.error('Erreur lors de la copie:', err);
            showNotification('Impossible de copier le plan', 'danger');
        }
        
        document.body.removeChild(textarea);
    }
}

// Fonction utilitaire pour afficher des notifications
function showNotification(message, type = 'info') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    const toastTitle = document.getElementById('toastTitle');
    
    // Définir le type de notification
    toast.classList.remove('bg-success', 'bg-danger', 'bg-warning', 'bg-info');
    
    switch (type) {
        case 'success':
            toast.classList.add('bg-success', 'text-white');
            toastTitle.textContent = 'Succès';
            break;
        case 'danger':
            toast.classList.add('bg-danger', 'text-white');
            toastTitle.textContent = 'Erreur';
            break;
        case 'warning':
            toast.classList.add('bg-warning');
            toastTitle.textContent = 'Attention';
            break;
        default:
            toast.classList.add('bg-info', 'text-white');
            toastTitle.textContent = 'Information';
    }
    
    // Définir le message
    toastMessage.textContent = message;
    
    // Afficher la notification
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
}
