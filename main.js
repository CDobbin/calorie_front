document.addEventListener('DOMContentLoaded', () => {
    const ingredientInput = document.getElementById('ingredient-input');
    const quantityInput = document.getElementById('quantity-input');
    const suggestionList = document.getElementById('suggestion-list');
    const addBtn = document.getElementById('add-ingredient');
    const ingredientList = document.getElementById('ingredient-list');
    const clearBtn = document.getElementById('clear-ingredients');
    const calcBtn = document.getElementById('calculate');
    const results = document.getElementById('results');

    let selectedFood = null;

    ingredientInput.addEventListener('input', async () => {
        const query = ingredientInput.value.trim();
        if (!query) return suggestionList.innerHTML = '';

        const res = await fetch(`http://localhost:5000/search_ingredient?query=${encodeURIComponent(query)}`);
        const foods = await res.json();

        suggestionList.innerHTML = foods.map(f => `<div class="p-2 cursor-pointer hover:bg-gray-100" data-id="${f.fdcId}" data-name="${f.description}">${f.description}</div>`).join('');
        document.querySelectorAll('#suggestion-list > div').forEach(div => {
            div.addEventListener('click', () => {
                selectedFood = { fdcId: div.dataset.id, name: div.dataset.name };
                ingredientInput.value = selectedFood.name;
                suggestionList.innerHTML = '';
                quantityInput.focus();
            });
        });
    });

    addBtn.addEventListener('click', () => {
        const qty = parseFloat(quantityInput.value);
        if (!selectedFood || isNaN(qty) || qty <= 0) return alert('Select a valid ingredient and quantity.');

        const ingredients = JSON.parse(localStorage.getItem('ingredients') || '[]');
        ingredients.push({ ...selectedFood, quantity: qty });
        localStorage.setItem('ingredients', JSON.stringify(ingredients));
        ingredientInput.value = quantityInput.value = '';
        selectedFood = null;
        renderList();
    });

    clearBtn.addEventListener('click', () => {
        localStorage.removeItem('ingredients');
        renderList();
        results.textContent = '';
    });

    calcBtn.addEventListener('click', async () => {
        const ingredients = JSON.parse(localStorage.getItem('ingredients') || '[]');
        const res = await fetch('http://localhost:5000/calculate_nutrition', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ingredients })
        });
        const data = await res.json();
        results.innerHTML = `
            <p><strong>Calories:</strong> ${data.calories.toFixed(2)} kcal</p>
            <p><strong>Protein:</strong> ${data.protein.toFixed(2)} g</p>
            <p><strong>Fat:</strong> ${data.fat.toFixed(2)} g</p>
            <p><strong>Carbs:</strong> ${data.carbohydrates.toFixed(2)} g</p>
            <p><strong>Fiber:</strong> ${data.fiber.toFixed(2)} g</p>
        `;
    });

    function renderList() {
        const ingredients = JSON.parse(localStorage.getItem('ingredients') || '[]');
        ingredientList.innerHTML = ingredients.map((i, idx) => `
            <div class="flex justify-between items-center py-1">
                <span>${i.name} (${i.quantity}g)</span>
                <div>
                    <button class="text-blue-600 mr-2 edit-btn" data-index="${idx}">Edit</button>
                    <button class="text-red-600 delete-btn" data-index="${idx}">Remove</button>
                </div>
            </div>`).join('');

        ingredientList.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const ingredients = JSON.parse(localStorage.getItem('ingredients'));
                ingredients.splice(btn.dataset.index, 1);
                localStorage.setItem('ingredients', JSON.stringify(ingredients));
                renderList();
            });
        });

        ingredientList.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const ingredients = JSON.parse(localStorage.getItem('ingredients'));
                const index = btn.dataset.index;
                const item = ingredients[index];
                const newQty = prompt(`Edit quantity for ${item.name} (grams):`, item.quantity);
                const qty = parseFloat(newQty);
                if (!isNaN(qty) && qty > 0) {
                    ingredients[index].quantity = qty;
                    localStorage.setItem('ingredients', JSON.stringify(ingredients));
                    renderList();
                } else {
                    alert('Please enter a valid number.');
                }
            });
        });
    }

    renderList();
});