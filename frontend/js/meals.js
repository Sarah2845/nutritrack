/**
 * Gestion des repas - NutriTrack
 * Implémentation des fonctionnalités CRUD avec AJAX
 */

// Variables globales
let allMeals = [];
let filteredMeals = [];
let currentPage = 1;
let itemsPerPage = 10;
let currentSort = { field: 'date', direction: 'desc' };
let currentMealId = null;
let macroChart = null;

// Configuration des traductions pour les types de repas
const mealTypeTranslations = {
    breakfast: 'Petit-déjeuner',
    lunch: 'Déjeuner',
    dinner: 'Dîner',
    snack: 'Collation',
    other: 'Autre'
};

// Icônes pour les types de repas
const mealTypeIcons = {
    breakfast: 'bi-cup-hot',
    lunch: 'bi-egg-fried',
    dinner: 'bi-moon-stars',
    snack: 'bi-apple',
    other: 'bi-three-dots'
};

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
    // Vérifier l'authentification
    checkAuthentication();
    
    // Initialiser les écouteurs d'événements
    setupEventListeners();
    
    // Initialiser les dates dans les filtres (aujourd'hui par défaut)
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('mealDate').value = today;
    
    // Initialiser le graphique des macronutriments
    initializeMacroChart();
    
    // Charger les repas
    loadMeals();
});

// Vérifier si l'utilisateur est authentifié
function checkAuthentication() {
    const token = localStorage.getItem('nutritrack_token');
    const userJson = localStorage.getItem('nutritrack_user');
    
    if (!token || !userJson) {
        // Rediriger vers la page de connexion
        window.location.href = '/app-minimal.html';
        return;
    }
    
    try {
        const user = JSON.parse(userJson);
        // Mettre à jour les éléments de l'interface utilisateur
        updateUserInterface(user);
    } catch (error) {
        console.error('Erreur lors du chargement des données utilisateur:', error);
        // En cas d'erreur, rediriger vers la page de connexion
        localStorage.removeItem('nutritrack_token');
        localStorage.removeItem('nutritrack_user');
        window.location.href = '/app-minimal.html';
    }
}

// Mettre à jour l'interface utilisateur avec les informations de l'utilisateur
function updateUserInterface(user) {
    if (user.name) {
        document.getElementById('username').textContent = user.name;
        document.getElementById('sidebarUsername').textContent = user.name;
    }
    
    // Date d'inscription formatée
    const createdAt = user.createdAt ? new Date(user.createdAt) : new Date();
    const month = createdAt.toLocaleString('fr-FR', { month: 'long' });
    const year = createdAt.getFullYear();
    document.getElementById('memberSince').textContent = `Membre depuis ${month} ${year}`;
    
    // Avatar utilisateur
    updateUserAvatar(user);
}

// Mettre à jour l'avatar de l'utilisateur
function updateUserAvatar(userData) {
    const avatarElement = document.getElementById('sidebarAvatar');
    if (avatarElement) {
        // Utiliser l'avatar stocké dans les données utilisateur ou une image par défaut
        const avatarUrl = userData.avatar || getGravatarUrl(userData.email) || 'https://via.placeholder.com/80';
        avatarElement.src = avatarUrl;
    }
}

// Obtenir un avatar Gravatar basé sur l'email
function getGravatarUrl(email) {
    if (!email) return null;
    // Version simplifiée pour la démo
    return `https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y`;
}

// Configurer les écouteurs d'événements
function setupEventListeners() {
    // Bouton d'ajout de repas
    document.getElementById('addMealBtn').addEventListener('click', function() {
        resetMealForm();
        document.getElementById('modalTitle').textContent = 'Ajouter un repas';
        currentMealId = null;
    });
    
    // Bouton de sauvegarde du repas
    document.getElementById('saveMealBtn').addEventListener('click', saveMeal);
    
    // Bouton de confirmation de suppression
    document.getElementById('confirmDeleteBtn').addEventListener('click', deleteMeal);
    
    // Filtre de recherche
    document.getElementById('searchInput').addEventListener('input', function() {
        applyFilters();
    });
    
    // Filtres de type de repas et de date
    document.getElementById('mealTypeFilter').addEventListener('change', applyFilters);
    document.getElementById('startDateFilter').addEventListener('change', applyFilters);
    document.getElementById('endDateFilter').addEventListener('change', applyFilters);
    
    // Tri des colonnes du tableau
    document.querySelectorAll('.sortable').forEach(function(header) {
        header.addEventListener('click', function() {
            const field = this.getAttribute('data-sort');
            sortMeals(field);
        });
    });
    
    // Bouton de déconnexion
    document.getElementById('logoutBtn').addEventListener('click', function(e) {
        e.preventDefault();
        logout();
    });
}

// Fonction de déconnexion
function logout() {
    // Effacer les données d'authentification
    localStorage.removeItem('nutritrack_token');
    localStorage.removeItem('nutritrack_user');
    
    // Afficher une notification
    showNotification('Déconnexion réussie', 'success');
    
    // Rediriger vers la page de connexion après un court délai
    setTimeout(() => {
        window.location.href = '/login.html';
    }, 1500);
}

// Charger les repas depuis l'API
function loadMeals() {
    console.log('---------- Début du chargement des repas ----------');
    
    // Afficher un indicateur de chargement
    const tableBody = document.getElementById('mealsTableBody');
    tableBody.innerHTML = '<tr><td colspan="7" class="text-center"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Chargement...</span></div></td></tr>';
    
    // Récupérer le token d'authentification
    const token = localStorage.getItem('nutritrack_token');
    if (!token) {
        console.error('Token d\'authentification manquant');
        showNotification('Vous devez être connecté pour accéder à vos repas', 'danger');
        
        // Afficher un message dans le tableau au lieu de rediriger
        tableBody.innerHTML = '<tr><td colspan="7" class="text-center"><div class="alert alert-warning">Vous devez être connecté pour voir vos repas. <a href="/login.html" class="alert-link">Se connecter</a></div></td></tr>';
        return;
    }
    
    // URL de l'API avec les filtres éventuels
    let url = '/api/meals';
    const filters = {};
    
    // Ajouter les filtres de date si spécifiés
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    
    if (startDateInput && startDateInput.value) {
        filters.startDate = startDateInput.value;
    }
    
    if (endDateInput && endDateInput.value) {
        filters.endDate = endDateInput.value;
    }
    
    // Ajouter le filtre de type de repas si spécifié
    const mealTypeSelect = document.getElementById('mealTypeFilter');
    if (mealTypeSelect && mealTypeSelect.value !== 'all') {
        filters.mealType = mealTypeSelect.value;
    }
    
    // Ajouter les filtres à l'URL
    if (Object.keys(filters).length > 0) {
        const queryParams = new URLSearchParams(filters);
        url += `?${queryParams.toString()}`;
    }
    
    console.log(`Chargement des repas depuis ${url}`);
    
    // Ajouter un timestamp pour éviter le cache
    const timestamp = new Date().getTime();
    const urlWithCache = url.includes('?') ? `${url}&_=${timestamp}` : `${url}?_=${timestamp}`;
    
    // Faire la requête AJAX
    fetch(urlWithCache, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        }
    })
    .then(response => {
        console.log('Statut de la réponse:', response.status);
        if (!response.ok) {
            return response.text().then(text => {
                console.error('Réponse d\'erreur complète:', text);
                throw new Error(`Erreur lors de la récupération des repas: ${response.status} ${response.statusText}`);
            });
        }
        return response.json();
    })
    .then(data => {
        console.log('Données reçues:', data);
        
        // Vérifier que les données contiennent des repas
        if (data && data.meals) {
            // Stocker les repas dans la variable globale
            allMeals = data.meals;
            console.log(`${allMeals.length} repas récupérés:`, allMeals);
        } else {
            console.warn('Aucun repas trouvé dans la réponse:', data);
            allMeals = [];
        }
        
        // Mettre à jour l'affichage
        console.log('Mise à jour de l\'affichage des repas...');
        applyFilters();
        
        // Mettre à jour le résumé nutritionnel
        updateNutritionSummary();
    })
    .catch(error => {
        console.error('Erreur complète:', error);
        showNotification(`Erreur: ${error.message}`, 'danger');
        
        // Afficher un message d'erreur dans le tableau
        document.getElementById('mealsTableBody').innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-5 text-danger">
                    <i class="bi bi-exclamation-triangle fs-1 mb-3"></i>
                    <p>Impossible de charger les repas. Veuillez réessayer plus tard.</p>
                </td>
            </tr>
        `;
    });
}

// Appliquer les filtres et trier les repas
function applyFilters() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const mealTypeFilter = document.getElementById('mealTypeFilter').value;
    
    // Filtrer les repas
    filteredMeals = allMeals.filter(meal => {
        // Filtre de recherche
        const nameMatch = meal.name.toLowerCase().includes(searchTerm);
        const descMatch = meal.description && meal.description.toLowerCase().includes(searchTerm);
        
        // Filtre de type
        const typeMatch = !mealTypeFilter || meal.mealType === mealTypeFilter;
        
        return (nameMatch || descMatch) && typeMatch;
    });
    
    // Trier les repas
    sortMeals(currentSort.field, false);
    
    // Mettre à jour l'affichage
    updateMealDisplay();
}

// Trier les repas
function sortMeals(field, toggleDirection = true) {
    // Mettre à jour la direction de tri si nécessaire
    if (toggleDirection && field === currentSort.field) {
        currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
    } else if (toggleDirection) {
        currentSort.field = field;
        currentSort.direction = 'asc';
    }
    
    // Mettre à jour les classes des en-têtes de colonnes
    document.querySelectorAll('.sortable').forEach(header => {
        header.classList.remove('asc', 'desc');
        if (header.getAttribute('data-sort') === currentSort.field) {
            header.classList.add(currentSort.direction);
        }
    });
    
    // Trier les repas
    filteredMeals.sort((a, b) => {
        let valA = a[field];
        let valB = b[field];
        
        // Gérer les cas spéciaux
        if (field === 'date') {
            valA = new Date(valA);
            valB = new Date(valB);
        } else if (typeof valA === 'string') {
            valA = valA.toLowerCase();
            valB = valB.toLowerCase();
        }
        
        // Comparer en fonction de la direction de tri
        if (valA < valB) return currentSort.direction === 'asc' ? -1 : 1;
        if (valA > valB) return currentSort.direction === 'asc' ? 1 : -1;
        return 0;
    });
    
    // Mettre à jour l'affichage
    currentPage = 1;
    updateMealDisplay();
}

// Mettre à jour l'affichage des repas
function updateMealDisplay() {
    const tableBody = document.getElementById('mealsTableBody');
    const paginationInfo = document.getElementById('paginationContainer');
    const pagination = document.getElementById('pagination');
    
    // Calculer les indices de début et de fin pour la pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, filteredMeals.length);
    
    // Mettre à jour les informations de pagination
    document.getElementById('startCount').textContent = filteredMeals.length > 0 ? startIndex + 1 : 0;
    document.getElementById('endCount').textContent = endIndex;
    document.getElementById('totalCount').textContent = filteredMeals.length;
    
    // Afficher ou masquer la pagination en fonction du nombre de repas
    paginationInfo.style.display = filteredMeals.length > 0 ? 'flex' : 'none';
    
    // Vider le tableau
    tableBody.innerHTML = '';
    
    // Si aucun repas, afficher un message
    if (filteredMeals.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-5">
                    <i class="bi bi-journal-x fs-1 text-muted mb-3"></i>
                    <p>Aucun repas trouvé. Ajoutez votre premier repas !</p>
                </td>
            </tr>
        `;
        return;
    }
    
    // Générer les lignes du tableau pour les repas de la page actuelle
    const currentPageMeals = filteredMeals.slice(startIndex, endIndex);
    
    currentPageMeals.forEach(meal => {
        // Calculer les pourcentages de macronutriments
        const totalMacros = meal.proteins + meal.carbs + meal.fats;
        const proteinPercent = totalMacros > 0 ? (meal.proteins / totalMacros) * 100 : 0;
        const carbsPercent = totalMacros > 0 ? (meal.carbs / totalMacros) * 100 : 0;
        const fatsPercent = totalMacros > 0 ? (meal.fats / totalMacros) * 100 : 0;
        
        // Formater la date
        const mealDate = new Date(meal.date);
        const formattedDate = mealDate.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
        
        // Créer la ligne du tableau
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formattedDate}</td>
            <td>
                <div class="d-flex align-items-center">
                    <div class="meal-icon ${meal.mealType}">
                        <i class="bi ${mealTypeIcons[meal.mealType] || 'bi-three-dots'}"></i>
                    </div>
                    <div>
                        <div class="fw-medium">${meal.name}</div>
                        <div class="small text-muted">${meal.description || 'Aucune description'}</div>
                    </div>
                </div>
            </td>
            <td><span class="badge bg-light text-dark">${mealTypeTranslations[meal.mealType] || 'Autre'}</span></td>
            <td><strong>${meal.calories}</strong> kcal</td>
            <td>
                <div class="small mb-1">
                    <span class="text-primary">${meal.proteins}g P</span> • 
                    <span class="text-info">${meal.carbs}g G</span> • 
                    <span class="text-warning">${meal.fats}g L</span>
                </div>
                <div class="macro-chart">
                    <div class="macro-protein" style="width: ${proteinPercent}%"></div>
                    <div class="macro-carbs" style="width: ${carbsPercent}%"></div>
                    <div class="macro-fat" style="width: ${fatsPercent}%"></div>
                </div>
            </td>
            <td>
                <div class="d-flex gap-2">
                    <button class="btn btn-sm btn-outline-primary edit-meal" data-id="${meal.id}">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger delete-meal" data-id="${meal.id}">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </td>
        `;
        
        // Ajouter les écouteurs d'événements pour les boutons d'édition et de suppression
        const editBtn = row.querySelector('.edit-meal');
        editBtn.addEventListener('click', function() {
            editMeal(meal.id);
        });
        
        const deleteBtn = row.querySelector('.delete-meal');
        deleteBtn.addEventListener('click', function() {
            openDeleteModal(meal.id);
        });
        
        // Ajouter la ligne au tableau
        tableBody.appendChild(row);
    });
    
    // Générer la pagination
    generatePagination(pagination, filteredMeals.length);
}

// Générer la pagination
function generatePagination(paginationElement, totalItems) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    // Vider la pagination
    paginationElement.innerHTML = '';
    
    // Générer les éléments de pagination
    // Bouton précédent
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    prevLi.innerHTML = `<a class="page-link" href="#" aria-label="Previous"><span aria-hidden="true">&laquo;</span></a>`;
    prevLi.addEventListener('click', function(e) {
        e.preventDefault();
        if (currentPage > 1) {
            currentPage--;
            updateMealDisplay();
        }
    });
    paginationElement.appendChild(prevLi);
    
    // Pages
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);
    
    if (endPage - startPage < 4 && startPage > 1) {
        startPage = Math.max(1, endPage - 4);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        const pageLi = document.createElement('li');
        pageLi.className = `page-item ${i === currentPage ? 'active' : ''}`;
        pageLi.innerHTML = `<a class="page-link" href="#">${i}</a>`;
        pageLi.addEventListener('click', function(e) {
            e.preventDefault();
            currentPage = i;
            updateMealDisplay();
        });
        paginationElement.appendChild(pageLi);
    }
    
    // Bouton suivant
    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
    nextLi.innerHTML = `<a class="page-link" href="#" aria-label="Next"><span aria-hidden="true">&raquo;</span></a>`;
    nextLi.addEventListener('click', function(e) {
        e.preventDefault();
        if (currentPage < totalPages) {
            currentPage++;
            updateMealDisplay();
        }
    });
    paginationElement.appendChild(nextLi);
}

// Mettre à jour le résumé nutritionnel
function updateNutritionSummary() {
    // Calculer les totaux
    let totalCalories = 0;
    let totalProteins = 0;
    let totalCarbs = 0;
    let totalFats = 0;
    
    // Filtres de date pour les statistiques
    const startDate = document.getElementById('startDateFilter').value || '1900-01-01';
    const endDate = document.getElementById('endDateFilter').value || '2100-12-31';
    
    // Filtrer les repas par date
    const filteredByDate = allMeals.filter(meal => {
        return (!startDate || meal.date >= startDate) && (!endDate || meal.date <= endDate);
    });
    
    // Calculer les totaux
    filteredByDate.forEach(meal => {
        totalCalories += meal.calories || 0;
        totalProteins += meal.proteins || 0;
        totalCarbs += meal.carbs || 0;
        totalFats += meal.fats || 0;
    });
    
    // Mettre à jour les éléments HTML
    document.getElementById('totalCalories').textContent = Math.round(totalCalories);
    document.getElementById('totalMeals').textContent = filteredByDate.length;
    document.getElementById('totalProteins').textContent = Math.round(totalProteins) + 'g';
    document.getElementById('totalCarbs').textContent = Math.round(totalCarbs) + 'g';
    document.getElementById('totalFats').textContent = Math.round(totalFats) + 'g';
    
    // Calculer les pourcentages de macronutriments
    const totalMacros = totalProteins + totalCarbs + totalFats;
    const proteinPercent = totalMacros > 0 ? Math.round((totalProteins / totalMacros) * 100) : 0;
    const carbsPercent = totalMacros > 0 ? Math.round((totalCarbs / totalMacros) * 100) : 0;
    const fatsPercent = totalMacros > 0 ? Math.round((totalFats / totalMacros) * 100) : 0;
    
    // Mettre à jour les pourcentages
    document.getElementById('proteinPercent').textContent = proteinPercent + '%';
    document.getElementById('carbsPercent').textContent = carbsPercent + '%';
    document.getElementById('fatPercent').textContent = fatsPercent + '%';
    
    // Mettre à jour le graphique
    updateMacroChart(proteinPercent, carbsPercent, fatsPercent);
}

// Initialiser le graphique des macronutriments
function initializeMacroChart() {
    const ctx = document.getElementById('macroChart').getContext('2d');
    
    macroChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Protéines', 'Glucides', 'Lipides'],
            datasets: [{
                data: [0, 0, 0],
                backgroundColor: [
                    '#4e73df', // Protéines - bleu
                    '#36b9cc', // Glucides - cyan
                    '#f6c23e'  // Lipides - jaune
                ],
                borderWidth: 1,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.label}: ${context.raw}%`;
                        }
                    }
                }
            }
        }
    });
}

// Mettre à jour le graphique des macronutriments
function updateMacroChart(proteins, carbs, fats) {
    if (macroChart) {
        macroChart.data.datasets[0].data = [proteins, carbs, fats];
        macroChart.update();
    }
}

// Réinitialiser le formulaire d'ajout/édition de repas
function resetMealForm() {
    document.getElementById('mealForm').reset();
    document.getElementById('mealId').value = '';
    document.getElementById('modalTitle').textContent = 'Ajouter un repas';
    
    // Définir la date à aujourd'hui par défaut
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('mealDate').value = today;
    
    currentMealId = null;
}

// Ouvrir le modal pour éditer un repas
function editMeal(mealId) {
    const meal = allMeals.find(m => m.id === mealId);
    
    if (!meal) {
        showNotification('Repas non trouvé', 'danger');
        return;
    }
    
    // Remplir le formulaire avec les données du repas
    document.getElementById('mealId').value = meal.id;
    document.getElementById('mealName').value = meal.name;
    document.getElementById('mealDate').value = meal.date;
    document.getElementById('mealType').value = meal.mealType;
    document.getElementById('mealDescription').value = meal.description || '';
    document.getElementById('mealCalories').value = meal.calories;
    document.getElementById('mealProteins').value = meal.proteins;
    document.getElementById('mealCarbs').value = meal.carbs;
    document.getElementById('mealFats').value = meal.fats;
    
    // Mettre à jour le titre du modal
    document.getElementById('modalTitle').textContent = 'Éditer un repas';
    
    // Stocker l'ID du repas en cours d'édition
    currentMealId = meal.id;
    
    // Ouvrir le modal
    const mealModal = new bootstrap.Modal(document.getElementById('mealModal'));
    mealModal.show();
}

// Ouvrir le modal de confirmation de suppression
function openDeleteModal(mealId) {
    document.getElementById('deleteId').value = mealId;
    const deleteModal = new bootstrap.Modal(document.getElementById('deleteModal'));
    deleteModal.show();
}

// Enregistrer un repas (ajout ou modification)
function saveMeal() {
    // Validation du formulaire
    const form = document.getElementById('mealForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        console.log('Formulaire invalide');
        return;
    }
    
    // Récupérer les données du formulaire
    const mealData = {
        name: document.getElementById('mealName').value,
        date: document.getElementById('mealDate').value,
        mealType: document.getElementById('mealType').value,
        description: document.getElementById('mealDescription').value,
        calories: Number(document.getElementById('mealCalories').value),
        proteins: Number(document.getElementById('mealProteins').value),
        carbs: Number(document.getElementById('mealCarbs').value),
        fats: Number(document.getElementById('mealFats').value)
    };
    
    // Log des données à envoyer
    console.log('Données du repas à enregistrer:', mealData);
    
    // Récupérer le token d'authentification
    const token = localStorage.getItem('nutritrack_token');
    if (!token) {
        console.error('Token d\'authentification manquant');
        showNotification('Vous devez être connecté pour enregistrer un repas', 'danger');
        return;
    }
    
    // URL et méthode en fonction de l'action (ajout ou modification)
    let url = '/api/meals';
    let method = 'POST';
    
    if (currentMealId) {
        url += `/${currentMealId}`;
        method = 'PUT';
    }
    
    console.log(`Envoi des données vers ${url} avec la méthode ${method}`);
    
    // Faire la requête AJAX
    fetch(url, {
        method: method,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(mealData)
    })
    .then(response => {
        console.log('Statut de la réponse:', response.status);
        if (!response.ok) {
            return response.text().then(text => {
                console.error('Réponse d\'erreur complète:', text);
                throw new Error(`Erreur lors de l'enregistrement du repas: ${response.status} ${response.statusText}`);
            });
        }
        return response.json();
    })
    .then(data => {
        // Log des données reçues
        console.log('Données reçues après enregistrement:', data);
        
        // Forcer un rechargement complet et immédiat depuis le serveur
        // C'est la solution la plus fiable pour résoudre les problèmes d'affichage
        console.log('Rechargement complet des repas depuis le serveur...');
        
        // Nous ne tentons plus de manipuler allMeals localement car cela peut être source d'erreurs
        
        // Fermer le modal
        const mealModal = bootstrap.Modal.getInstance(document.getElementById('mealModal'));
        mealModal.hide();
        
        // Afficher une notification
        showNotification(
            currentMealId ? 'Repas modifié avec succès' : 'Repas ajouté avec succès', 
            'success'
        );
        
        // Solution fiable : forcer un rechargement complet
        // Recharger immédiatement les repas depuis l'API
        loadMeals();
        
        // Si pour une raison quelconque le premier chargement échoue, réessayer après un délai
        setTimeout(() => {
            console.log('Vérification des données après 1 seconde...');
            loadMeals();
        }, 1000);
    })
    .catch(error => {
        console.error('Erreur complète:', error);
        showNotification(`Erreur: ${error.message}`, 'danger');
    });
}

// Supprimer un repas
function deleteMeal() {
    const mealId = document.getElementById('deleteId').value;
    
    if (!mealId) {
        showNotification('ID de repas manquant', 'danger');
        return;
    }
    
    // Récupérer le token d'authentification
    const token = localStorage.getItem('nutritrack_token');
    
    // Faire la requête AJAX
    fetch(`/api/meals/${mealId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Erreur lors de la suppression du repas');
        }
        return response.json();
    })
    .then(data => {
        // Fermer le modal
        const deleteModal = bootstrap.Modal.getInstance(document.getElementById('deleteModal'));
        deleteModal.hide();
        
        // Afficher une notification
        showNotification('Repas supprimé avec succès', 'success');
        
        // Recharger les repas
        loadMeals();
    })
    .catch(error => {
        console.error('Erreur:', error);
        showNotification('Erreur lors de la suppression du repas', 'danger');
    });
}

// Afficher une notification toast
function showNotification(message, type) {
    const notification = document.getElementById('notification');
    notification.classList.remove('bg-success', 'bg-danger', 'bg-warning', 'bg-info');
    notification.classList.add(`bg-${type}`);
    
    const toastBody = notification.querySelector('.toast-body');
    toastBody.textContent = message;
    
    const toast = new bootstrap.Toast(notification);
    toast.show();
}
