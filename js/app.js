/**
 * TodoList PWA 
 * Application JavaScript pour gérer les tâches
 */

// DOM Elements
const todoInput = document.getElementById('todo-input');
const addTodoBtn = document.getElementById('add-todo');
const todoList = document.getElementById('todo-list');
const itemsLeft = document.getElementById('items-left');
const clearCompletedBtn = document.getElementById('clear-completed');
const filterButtons = document.querySelectorAll('.filter-btn');
const installBanner = document.getElementById('install-banner');
const installBtn = document.getElementById('install-btn');
const closeBannerBtn = document.getElementById('close-banner');

// Variables globales
let todos = [];
let currentFilter = 'all';
let deferredPrompt;

// Fonctions principales
function init() {
    loadTodos();
    renderTodos();
    addEventListeners();
}

function addEventListeners() {
    // Ajouter une tâche
    addTodoBtn.addEventListener('click', addTodo);
    todoInput.addEventListener('keypress', e => {
        if (e.key === 'Enter') addTodo();
    });

    // Gérer les tâches
    todoList.addEventListener('click', handleTodoClick);
    
    // Filtres
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            setFilter(btn.dataset.filter);
        });
    });

    // Actions
    clearCompletedBtn.addEventListener('click', clearCompleted);

    // Installation PWA
    installBtn.addEventListener('click', installApp);
    closeBannerBtn.addEventListener('click', () => {
        installBanner.style.display = 'none';
        localStorage.setItem('installBannerClosed', 'true');
    });

    // Événement de l'API d'installation
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        
        // Afficher la bannière d'installation si elle n'a pas été fermée
        if (localStorage.getItem('installBannerClosed') !== 'true') {
            installBanner.style.display = 'flex';
        }
    });
}

// Gestion des tâches
function addTodo() {
    const text = todoInput.value.trim();
    
    if (text) {
        const newTodo = {
            id: Date.now(),
            text: text,
            completed: false,
            createdAt: new Date().toISOString()
        };
        
        todos.push(newTodo);
        saveTodos();
        renderTodos();
        todoInput.value = '';
    }
}

function toggleTodo(id) {
    todos = todos.map(todo => {
        if (todo.id === id) {
            return { ...todo, completed: !todo.completed };
        }
        return todo;
    });
    
    saveTodos();
    renderTodos();
}

function deleteTodo(id) {
    todos = todos.filter(todo => todo.id !== id);
    saveTodos();
    renderTodos();
}

function clearCompleted() {
    todos = todos.filter(todo => !todo.completed);
    saveTodos();
    renderTodos();
}

function handleTodoClick(e) {
    const item = e.target.closest('.todo-item');
    
    if (!item) return;
    
    const id = parseInt(item.dataset.id);
    
    if (e.target.classList.contains('delete-todo')) {
        deleteTodo(id);
    } else if (e.target.classList.contains('todo-checkbox') || e.target.classList.contains('todo-text')) {
        toggleTodo(id);
    }
}

// Fonctions de filtrage
function setFilter(filter) {
    currentFilter = filter;
    
    filterButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === filter);
    });
    
    renderTodos();
}

function getFilteredTodos() {
    switch (currentFilter) {
        case 'active':
            return todos.filter(todo => !todo.completed);
        case 'completed':
            return todos.filter(todo => todo.completed);
        default:
            return todos;
    }
}

// Rendu et affichage
function renderTodos() {
    const filteredTodos = getFilteredTodos();
    
    todoList.innerHTML = '';
    
    if (filteredTodos.length === 0) {
        const emptyMessage = document.createElement('li');
        emptyMessage.className = 'todo-item empty';
        emptyMessage.textContent = 'Aucune tâche à afficher';
        todoList.appendChild(emptyMessage);
    } else {
        filteredTodos.forEach(todo => {
            const li = document.createElement('li');
            li.className = `todo-item${todo.completed ? ' completed' : ''}`;
            li.dataset.id = todo.id;
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'todo-checkbox';
            checkbox.checked = todo.completed;
            
            const text = document.createElement('span');
            text.className = 'todo-text';
            text.textContent = todo.text;
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-todo';
            deleteBtn.innerHTML = '&times;';
            deleteBtn.setAttribute('aria-label', 'Supprimer la tâche');
            
            li.appendChild(checkbox);
            li.appendChild(text);
            li.appendChild(deleteBtn);
            
            todoList.appendChild(li);
        });
    }
    
    // Mettre à jour le compteur
    const activeTodosCount = todos.filter(todo => !todo.completed).length;
    itemsLeft.textContent = `${activeTodosCount} tâche${activeTodosCount !== 1 ? 's' : ''} restante${activeTodosCount !== 1 ? 's' : ''}`;
}

// Stockage local
function saveTodos() {
    localStorage.setItem('todos', JSON.stringify(todos));
}

function loadTodos() {
    const storedTodos = localStorage.getItem('todos');
    todos = storedTodos ? JSON.parse(storedTodos) : [];
}

// Installation PWA
function installApp() {
    if (!deferredPrompt) {
        alert('L\'installation n\'est pas disponible sur cet appareil ou ce navigateur.');
        return;
    }
    
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(choiceResult => {
        if (choiceResult.outcome === 'accepted') {
            console.log('Utilisateur a accepté l\'installation');
        } else {
            console.log('Utilisateur a refusé l\'installation');
        }
        deferredPrompt = null;
        installBanner.style.display = 'none';
    });
}

// Initialisation de l'application
document.addEventListener('DOMContentLoaded', init); 