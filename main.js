let ingredients = [];

document.getElementById('ingredient-input').addEventListener('input', async function(e) {
    const query = e.target.value;
    if (query.length < 2) {
        document.getElementById('suggestion-list').style.display = 'none';
        return;
    }

    try {
        const response = await fetch(`http://localhost:5000/search_ingredient?query=${encodeURIComponent(query)}`);
        const foods = await response.json();
        const suggestionList = document.getElementById('suggestion-list');
        suggestionList.innerHTML = '';
        
        foods.forEach(food => {
            const div = document.createElement('div');
            div.className = 'suggestion-item p-2';
            div.textContent = food.description;
            div.dataset.fdcId = food.fdcId;
            div.addEventListener('click', () => {
                document.getElementById('ingredient-input').value = food.description;
                document.getElementById('ingredient-input').dataset.fdcId = food.fdcId;
                suggestionList.style.display = 'none';
            });
            suggestionList.appendChild(div);
        });
        suggestionList.style.display = foods.length ? 'block' : 'none';
    } catch (error) {
        console.error('Error fetching suggestions:', error);
    }
});

document.getElementById('add-ingredient').addEventListener('click', () => {
    const input = document.getElementById('ingredient-input');
    const quantity = document.getElementById('quantity-input').value;
    const fdcId = input.dataset.fdcId;

    if (!input.value || !quantity || !fdcId) {
        alert('Please select an ingredient and enter a quantity.');
        return;
    }

    ingredients.push({ name: input.value, quantity, fdcId });
    updateIngredientList();
    input.value = '';
    input.dataset.fdcId = '';
    document.getElementById('quantity-input').value = '';
    document.getElementById('suggestion-list').style.display = 'none';
});

document.getElementById('calculate').addEventListener('click', async () => {
    if (!ingredients.length) {
        alert('Please add at least one ingredient.');
        return;
    }

    try {
        const response = await fetch('http://localhost:5000/calculate_nutrition', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ingredients })
        });
        const result = await response.json();
        if (result.error) {
            alert(result.error);
            return;
        }

        const resultsDiv = document.getElementById('results');
        resultsDiv.innerHTML = `
            <h2 class="text-xl font-bold">Total Nutrition</h2>
            <p>Calories: ${result.calories.toFixed(2)} kcal</p>
            <p>Protein: ${result.protein.toFixed(2)} g</p>
            <p>Fat: ${result.fat.toFixed(2)} g</p>
            <p>Carbohydrates: ${result.carbohydrates.toFixed(2)} g</p>
            <p>Fiber: ${result.fiber.toFixed(2)} g</p>
        `;
    } catch (error) {
        alert('Error calculating nutrition: ' + error.message);
    }
});

function updateIngredientList() {
    const list = document.getElementById('ingredient-list');
    list.innerHTML = '<h2 class="text-xl font-bold">Ingredients</h2>';
    ingredients.forEach((ing, index) => {
        const div = document.createElement('div');
        div.textContent = `${ing.name}: ${ing.quantity} g`;
        list.appendChild(div);
    });
}