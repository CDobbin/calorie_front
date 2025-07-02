const API_URL = 'https://calorie-api-e5my.onrender.com';
const token = localStorage.getItem('token');

let selectedFood = null;
let recipes = [];

const getEl = id => document.getElementById(id);

if (!token) {
  alert('You must log in first.');
  window.location.href = 'index.html';
}

getEl('logout').addEventListener('click', () => {
  localStorage.removeItem('token');
  localStorage.removeItem('ingredients');
  window.location.href = 'index.html';
});

let debounceTimer;
getEl('ingredient-input').addEventListener('input', async e => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(async () => {
    const query = e.target.value.trim();
    getEl('suggestion-list').innerHTML = query ? '<p>Loading...</p>' : '';
    if (!query) return;
    try {
      const res = await fetch(`${API_URL}/search_ingredient?query=${encodeURIComponent(query)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Search failed');
      const foods = await res.json();
      getEl('suggestion-list').innerHTML = foods.map(f => `
        <div class="p-2 cursor-pointer hover:bg-gray-100" data-id="${f.fdcId}" data-name="${f.description}">${f.description}</div>
      `).join('');
      document.querySelectorAll('#suggestion-list > div').forEach(div => {
        div.addEventListener('click', () => {
          selectedFood = { fdcId: div.dataset.id, name: div.dataset.name };
          getEl('ingredient-input').value = selectedFood.name;
          getEl('suggestion-list').innerHTML = '';
          getEl('quantity-input').focus();
        });
      });
    } catch (error) {
      getEl('suggestion-list').innerHTML = `<p class="text-red-600">Error: ${error.message}</p>`;
    }
  }, 300);
});

getEl('add-ingredient').addEventListener('click', () => {
  const qty = parseFloat(getEl('quantity-input').value);
  if (!selectedFood || isNaN(qty) || qty <= 0) {
    alert('Select a valid ingredient and quantity.');
    return;
  }
  const ingredients = JSON.parse(localStorage.getItem('ingredients') || '[]');
  ingredients.push({ ...selectedFood, quantity: qty });
  localStorage.setItem('ingredients', JSON.stringify(ingredients));
  selectedFood = null;
  getEl('ingredient-input').value = '';
  getEl('quantity-input').value = '';
  renderList();
});

getEl('clear-ingredients').addEventListener('click', () => {
  localStorage.removeItem('ingredients');
  renderList();
  getEl('results').innerHTML = '';
});

getEl('calculate').addEventListener('click', async () => {
  getEl('calculate').disabled = true;
  getEl('results').innerHTML = '<p>Loading...</p>';
  try {
    const ingredients = JSON.parse(localStorage.getItem('ingredients') || '[]');
    if (!ingredients.length) throw new Error('No ingredients added');
    const res = await fetch(`${API_URL}/calculate_nutrition`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ ingredients })
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to calculate nutrition');
    const data = await res.json();
    getEl('results').innerHTML = `
      <p><strong>Calories:</strong> ${data.calories ? data.calories.toFixed(2) : '0.00'} kcal</p>
      <p><strong>Protein:</strong> ${data.protein ? data.protein.toFixed(2) : '0.00'} g</p>
      <p><strong>Fat:</strong> ${data.fat ? data.fat.toFixed(2) : '0.00'} g</p>
      <p><strong>Carbs:</strong> ${data.carbohydrates ? data.carbohydrates.toFixed(2) : '0.00'} g</p>
      <p><strong>Fiber:</strong> ${data.fiber ? data.fiber.toFixed(2) : '0.00'} g</p>
    `;
  } catch (error) {
    getEl('results').innerHTML = `<p class="text-red-600">Error: ${error.message}</p>`;
  } finally {
    getEl('calculate').disabled = false;
  }
});

getEl('save-recipe').addEventListener('click', async () => {
  const name = getEl('recipe-name').value.trim();
  if (!name) {
    alert('Enter a recipe name.');
    return;
  }
  const ingredients = JSON.parse(localStorage.getItem('ingredients') || '[]');
  const nutritionHTML = getEl('results').innerHTML;
  if (!nutritionHTML || nutritionHTML.includes('Error')) {
    alert('Calculate nutrition first.');
    return;
  }
  const nutrition = Object.fromEntries([...getEl('results').querySelectorAll('p')].map(p => {
    const [key, val] = p.textContent.split(':');
    return [key.trim().toLowerCase(), parseFloat(val) || 0];
  }));
  getEl('save-recipe').disabled = true;
  try {
    const res = await fetch(`${API_URL}/save_recipe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ name, ingredients, nutrition })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to save recipe');
    alert(data.message);
    getEl('recipe-name').value = '';
  } catch (error) {
    alert(`Error: ${error.message}`);
  } finally {
    getEl('save-recipe').disabled = false;
  }
});

getEl('load-recipes').addEventListener('click', async () => {
  getEl('load-recipes').disabled = true;
  getEl('saved-recipes').innerHTML = '<p>Loading...</p>';
  try {
    const res = await fetch(`${API_URL}/get_recipes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({})
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to load recipes');
    recipes = await res.json();
    getEl('saved-recipes').innerHTML = recipes.length ? recipes.map(r => `
      <div class="border p-2 mb-2 rounded">
        <h4 class="font-bold">${r.name}</h4>
        <p><strong>Saved:</strong> ${new Date(r.created_at).toLocaleString()}</p>
        <p><strong>Ingredients:</strong> ${r.ingredients.map(i => `${i.name} (${i.quantity}g)`).join(', ')}</p>
        <p><strong>Nutrition:</strong> ${Object.entries(r.nutrition).map(([k, v]) => `${k}: ${v.toFixed(2)}`).join(', ')}</p>
        <button class="text-blue-600 load-recipe-btn" data-id="${r.id}">Load Recipe</button>
      </div>`).join('') : '<p>No saved recipes.</p>';
  } catch (error) {
    getEl('saved-recipes').innerHTML = `<p class="text-red-600">Error: ${error.message}</p>`;
  } finally {
    getEl('load-recipes').disabled = false;
  }
});

getEl('saved-recipes').addEventListener('click', e => {
  if (e.target.classList.contains('load-recipe-btn')) {
    const recipeId = e.target.dataset.id;
    const recipe = recipes.find(r => r.id === parseInt(recipeId));
    if (recipe) {
      localStorage.setItem('ingredients', JSON.stringify(recipe.ingredients));
      renderList();
      getEl('recipe-name').value = recipe.name;
      getEl('results').innerHTML = `
        <p><strong>Calories:</strong> ${recipe.nutrition.calories ? recipe.nutrition.calories.toFixed(2) : '0.00'} kcal</p>
        <p><strong>Protein:</strong> ${recipe.nutrition.protein ? recipe.nutrition.protein.toFixed(2) : '0.00'} g</p>
        <p><strong>Fat:</strong> ${recipe.nutrition.fat ? recipe.nutrition.fat.toFixed(2) : '0.00'} g</p>
        <p><strong>Carbs:</strong> ${recipe.nutrition.carbohydrates ? recipe.nutrition.carbohydrates.toFixed(2) : '0.00'} g</p>
        <p><strong>Fiber:</strong> ${recipe.nutrition.fiber ? recipe.nutrition.fiber.toFixed(2) : '0.00'} g</p>
      `;
    }
  }
});

function renderList() {
  const list = getEl('ingredient-list');
  const ingredients = JSON.parse(localStorage.getItem('ingredients') || '[]');
  list.innerHTML = ingredients.length ? ingredients.map((i, idx) => `
    <div class="flex justify-between items-center py-1">
      <span>${i.name} (${i.quantity}g)</span>
      <div>
        <button class="text-blue-600 mr-2 edit-btn" data-index="${idx}">Edit</button>
        <button class="text-red-600 delete-btn" data-index="${idx}">Remove</button>
      </div>
    </div>`).join('') : '<p>No ingredients added.</p>';

  list.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const ingredients = JSON.parse(localStorage.getItem('ingredients'));
      ingredients.splice(btn.dataset.index, 1);
      localStorage.setItem('ingredients', JSON.stringify(ingredients));
      renderList();
    });
  });

  list.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const ingredients = JSON.parse(localStorage.getItem('ingredients'));
      const item = ingredients[btn.dataset.index];
      const newQty = prompt(`Edit quantity for ${item.name} (g)`, item.quantity);
      const qty = parseFloat(newQty);
      if (!isNaN(qty) && qty > 0) {
        ingredients[btn.dataset.index].quantity = qty;
        localStorage.setItem('ingredients', JSON.stringify(ingredients));
        renderList();
      } else {
        alert('Please enter a valid quantity.');
      }
    });
  });
}

renderList();