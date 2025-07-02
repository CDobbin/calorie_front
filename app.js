const API_URL = 'https://calorie-api-e5my.onrender.com';
const userId = localStorage.getItem('userId');

let selectedFood = null;

const getEl = id => document.getElementById(id);

if (!userId) {
  alert('You must log in first.');
  window.location.href = 'index.html';
}

getEl('ingredient-input').addEventListener('input', async e => {
  const query = e.target.value.trim();
  if (!query) return getEl('suggestion-list').innerHTML = '';
  const res = await fetch(`${API_URL}/search_ingredient?query=${encodeURIComponent(query)}`);
  const foods = await res.json();
  getEl('suggestion-list').innerHTML = foods.map(f => `<div class="p-2 cursor-pointer hover:bg-gray-100" data-id="${f.fdcId}" data-name="${f.description}">${f.description}</div>`).join('');
  document.querySelectorAll('#suggestion-list > div').forEach(div => {
    div.addEventListener('click', () => {
      selectedFood = { fdcId: div.dataset.id, name: div.dataset.name };
      getEl('ingredient-input').value = selectedFood.name;
      getEl('suggestion-list').innerHTML = '';
      getEl('quantity-input').focus();
    });
  });
});

getEl('add-ingredient').addEventListener('click', () => {
  const qty = parseFloat(getEl('quantity-input').value);
  if (!selectedFood || isNaN(qty) || qty <= 0) return alert('Select a valid ingredient and quantity.');
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
  const ingredients = JSON.parse(localStorage.getItem('ingredients') || '[]');
  const res = await fetch(`${API_URL}/calculate_nutrition`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ingredients })
  });
  const data = await res.json();
  getEl('results').innerHTML = `
    <p><strong>Calories:</strong> ${data.calories.toFixed(2)} kcal</p>
    <p><strong>Protein:</strong> ${data.protein.toFixed(2)} g</p>
    <p><strong>Fat:</strong> ${data.fat.toFixed(2)} g</p>
    <p><strong>Carbs:</strong> ${data.carbohydrates.toFixed(2)} g</p>
    <p><strong>Fiber:</strong> ${data.fiber.toFixed(2)} g</p>
  `;
});

getEl('save-recipe').addEventListener('click', async () => {
  const name = getEl('recipe-name').value.trim();
  if (!name) return alert('Enter a recipe name.');
  const ingredients = JSON.parse(localStorage.getItem('ingredients') || '[]');
  const nutritionHTML = getEl('results').innerHTML;
  if (!nutritionHTML) return alert('Calculate nutrition first.');
  const nutrition = Object.fromEntries([...getEl('results').querySelectorAll('p')].map(p => {
    const [key, val] = p.textContent.split(':');
    return [key.trim().toLowerCase(), parseFloat(val)];
  }));
  const res = await fetch(`${API_URL}/save_recipe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, name, ingredients, nutrition })
  });
  const data = await res.json();
  alert(data.message || data.error);
});

getEl('load-recipes').addEventListener('click', async () => {
  const res = await fetch(`${API_URL}/get_recipes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId })
  });
  const recipes = await res.json();
  getEl('saved-recipes').innerHTML = recipes.map(r => `
    <div class="border p-2 mb-2">
      <h4 class="font-bold">${r.name}</h4>
      <p><strong>Saved:</strong> ${new Date(r.created_at).toLocaleString()}</p>
      <p><strong>Nutrition:</strong> ${JSON.stringify(r.nutrition)}</p>
    </div>`).join('');
});

function renderList() {
  const list = getEl('ingredient-list');
  const ingredients = JSON.parse(localStorage.getItem('ingredients') || '[]');
  list.innerHTML = ingredients.map((i, idx) => `
    <div class="flex justify-between items-center py-1">
      <span>${i.name} (${i.quantity}g)</span>
      <div>
        <button class="text-blue-600 mr-2 edit-btn" data-index="${idx}">Edit</button>
        <button class="text-red-600 delete-btn" data-index="${idx}">Remove</button>
      </div>
    </div>`).join('');

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
      const newQty = prompt(`Edit quantity for ${item.name}`, item.quantity);
      const qty = parseFloat(newQty);
      if (!isNaN(qty) && qty > 0) {
        ingredients[btn.dataset.index].quantity = qty;
        localStorage.setItem('ingredients', JSON.stringify(ingredients));
        renderList();
      }
    });
  });
}

renderList();
