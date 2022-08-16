let app = {},
	selectedIngredients = [], //Keeps tracks of clicked/hovered ingredients
	ingredientNames = []; // Keeps track of clicked ingredient names

const resetBtn = document.getElementById('reset'),
	articleContainer = document.querySelector('#cocktailsContainer'),
	ingredientListEl = document.getElementById('ingredients');

app.APIROOT = 'https://soleratt.com/wp-json';
app.ENDPOINT = '/wp/v2/wprm_recipe?per_page=100';

app.init = function (els) {
	document.body.classList.add('recipe-finder-app');

	resetBtn.classList.add('hide');

	// Reset the filter if there was a page refresh
	app.resetFilter(articleContainer);


	let data = app.getPosts();
	data.then((recipes) => {
		app.renderCount(recipes.length);

		if(!localStorage.getItem('recipes') || localStorage.getItem('recipes') == null) {
			localStorage.setItem('recipes', JSON.stringify(recipes));
			localStorage.setItem('recipe-count', recipes.length);
		}
	});
};

app.resetFilter = function (container) {
	const checkboxes = document.querySelectorAll('.c-checkbox input');
	for (let i = 0; i < checkboxes.length; i++) {
		checkboxes[i].checked = false;
		checkboxes[i].parentElement.classList.remove('linked');
		checkboxes[i].removeAttribute('disabled');
	}

	app.clearPosts(container);
	selectedIngredients = []; // reset selected ingredients
	ingredientNames = []; // reset ingredients names
};

app.getPosts = async function () {
	const response = await fetch(app.APIROOT + app.ENDPOINT);
	const data = await response.json();
	return data;
};

app.clearPosts = function () {
	articleContainer.innerHTML = '';
};

app.renderCount = function (count, ingredients = '') {
	const countElTop = document.getElementById('results-count-top'),
		countElBottom = document.getElementById('results-count-bottom');

	let output = '';

	countElTop.innerText = '';
	countElBottom.innerText = '';

	if (ingredients == '') {
		output = `There ${
			count > 1 ? 'are' : 'is'
		} <span class="count">${count}</span> ${
			count > 1 ? 'recipes' : 'recipe'
		}. Select ingredients to filter.`;
	} else {
		output = `There ${
			count > 1 ? 'are' : 'is'
		} <span class="count">${count}</span> ${
			count > 1 ? 'recipes' : 'recipe'
		} with <span class="ingredient-list">${ingredients}</span>. Scroll Down.`;
	}

	countElTop.innerHTML = output;
	countElBottom.innerHTML = output;
};

app.titleCase = function (str) {
	return str
		.toLowerCase()
		.split(' ')
		.map(function (word) {
			return word.charAt(0).toUpperCase() + word.slice(1);
		})
		.join(' ');
};

app.filter = function (search, ingredients) {
	let recipes = JSON.parse(localStorage.getItem('recipes'));
	let filtered = recipes.filter((recipe) => {
		let ingredients = recipe.wprm_ingredient;
		return search.every((id) => ingredients.includes(id));
	});

	app.clearPosts();
	app.render(filtered);
	app.renderCount(filtered.length, ingredients);
};

app.updateFilter = function (search, ingredientNames) {
	let recipes = JSON.parse(localStorage.getItem('recipes'));
	let siblingIngredients = [];
	let filtered = recipes.filter((recipe) => {
		let ingredients = recipe.wprm_ingredient;
		return search.every((id) => ingredients.includes(id));
	});

	app.renderCount(filtered.length, ingredientNames);

	for (const recipe of filtered) {
		// recipe.wprm_ingredient is an array of ingredient IDs
		siblingIngredients.push(recipe.wprm_ingredient);
	}

	// Flatten array and Remove duplicate IDs
	siblingIngredients = [...new Set(siblingIngredients.flat())];

	document
		.querySelectorAll('input[type=checkbox]')
		.forEach((checkbox) => {
		if (siblingIngredients.includes(parseInt(checkbox.value))) {
			checkbox.parentElement.classList.add('linked');
			checkbox.removeAttribute('disabled');
		} else {
			checkbox.setAttribute('disabled', '');
			checkbox.parentElement.classList.remove('linked');
		}
	});
};

app.render = function (posts) {
	for (let post of posts) {
		app.renderPost(post);
	}
};

app.renderPost = function (post) {
	const articleEl = document.createElement('article'),
		titleEl = app.getTitleMarkup(post),
		contentEl = app.getContentMarkup(post);

	articleEl.classList.add('cocktail-recipe');
	articleEl.appendChild(contentEl);
	articleEl.appendChild(titleEl);
	articleContainer.appendChild(articleEl);
};

app.getTitleMarkup = function (post) {
	const titleEl = document.createElement('h2'),
		titleLinkEl = document.createElement('a');

	titleEl.classList.add('cocktail-recipe-title');
	titleLinkEl.innerHTML = post.title.rendered;
	titleLinkEl.href = post.link;
	titleEl.appendChild(titleLinkEl);

	return titleEl;
};

app.getContentMarkup = function (post) {
	const contentEl = document.createElement('div'),
		imgEl = document.createElement('img'),
		imageLinkEl = document.createElement('a');

	contentEl.classList.add('cocktail-image');
	imgEl.src = post.recipe.image_url;
	imgEl.width = '200';
	imgEl.height = '200';
	imageLinkEl.href = post.link;
	imageLinkEl.appendChild(imgEl);
	contentEl.appendChild(imageLinkEl);

	return contentEl;
};

// DOM Ready Function
function ready(cb) {
	if (document.readyState != 'loading') {
		cb();
	} else {
		document.addEventListener('DOMContentLoaded', cb);
	}
}

// When the DOM is ready
ready(() => {
	const els = {
		resetBtn: document.getElementById('reset'),
		articleContainer: document.querySelector('#cocktailsContainer'),
		ingredientListEl: document.getElementById('ingredients'),
	};

	app.init(els);

	els.resetBtn.addEventListener('click', function () {
		app.init();
	});

	/**
	 * Event Functions
	 */
	// Run on every checkbox input change
	function displaySelectedRecipes(e) {
		let target = e.target,
			targetValue = parseInt(target.value), // Ingredient ID
			checkboxes = document.querySelectorAll('.ingredient input'),
			targetID = target.getAttribute('id');

		// Check for checked inputs (ingredients)
		let checked = Array.from(checkboxes).filter((el) => el.checked);

		// Are any input (ingredients) checked
		if (checked.length == 0) {
			app.resetFilter(articleContainer);
			app.clearPosts(articleContainer);
			resetBtn.classList.add('hide');
		} else {
			// Ingredients are checked

			// 1. Show the reset button
			resetBtn.classList.remove('hide');

			// 2. Update ingredient names list

			if (
				target.checked &&
				!ingredientNames.includes(app.titleCase(targetID))
			) {
				// Add to list of ingredient names
				ingredientNames.push(app.titleCase(targetID));
			}

			if (
				!target.checked &&
				ingredientNames.includes(app.titleCase(targetID))
			) {
				// Remove from list of ingredient names
				ingredientNames.splice(
					ingredientNames.indexOf(app.titleCase(targetID)),
					1
				);
			}

			// 3. Update selected ingredients list

			// Add to list of selected ingredients
			// Checked
			if (target.checked && !selectedIngredients.includes(targetValue)) {
				target.parentElement.classList.add('selected');
				selectedIngredients.push(targetValue);
			}

			//Remove from list of selected ingredients
			// Unchecked
			if (!target.checked && selectedIngredients.includes(targetValue)) {
				target.parentElement.classList.remove('selected');
				selectedIngredients.splice(
					selectedIngredients.indexOf(targetValue),
					1
				);
			}

			// console.log(selectedIngredients);
			// Update the filter
			app.updateFilter(selectedIngredients, ingredientNames);

			// Filter the list of recipes with the selected ingredients
			app.filter(selectedIngredients, ingredientNames);
		}
	}

	function displayHoveredRecipes(e) {
		let target = e.target,
			targetValue = parseInt(target.value),
			targetID = target.getAttribute('id');

		if (target.nodeName == 'INPUT') {
			if (target.checked || target.disabled) {
				return;
			}

			//If there are no selected (checked) ingredients
			if (
				!Array.isArray(selectedIngredients) ||
				!selectedIngredients.length
			) {
				// console.log('no ingredients selected, getting siblings');
				// Get sibling ingredients of hovered ingredient
				app.updateFilter([targetValue], app.titleCase(targetID));

				return; // don't continue
			}

			// Ingredients are already selected
			// so the selectedIngredients and ingredientNames array shouldn't be empty
			// Add the hovered ingredient to the arrays
			selectedIngredients.push(targetValue);
			ingredientNames.push(app.titleCase(targetID));

			// console.log(selectedIngredients);
			// console.log(ingredientNames);

			// Update the filter
			app.updateFilter(selectedIngredients, ingredientNames);

			// Filter the list of recipes with the selected ingredients
			app.filter(selectedIngredients, ingredientNames);
		}
	}

	function removeHoveredRecipes(e) {
		let target = e.target,
			targetValue = parseInt(target.value),
			ingName = target.getAttribute('id');

		if (target.nodeName == 'INPUT') {
			//console.log(e.relatedTarget);
			if (target.checked || target.disabled) {
				return;
			}

			// console.log(selectedIngredients);

			//If there are no selected (checked) ingredients
			if (
				!Array.isArray(selectedIngredients) ||
				!selectedIngredients.length
			) {
				//No ingredient selected or hovered so go back to initial state
				// console.log('Resetting Filter. removing siblings');
				// console.log(selectedIngredients);
				// console.log(ingredientNames);
				app.resetFilter();

				app.renderCount(parseInt(localStorage.getItem('recipe-count')));

				return; // don't continue
			}

			/**
			 * When unchecking an ingredient ( removed for array) and
			 * mousing out causing it to be removed again
			 * This adds in back into the array to then be deleted
			 */
			if (!target.checked && !selectedIngredients.includes(targetValue)) {
				selectedIngredients.push(targetValue);
				ingredientNames.push(app.titleCase(ingName));
			}

			// Remove hovered ingredient from selected ingredients
			selectedIngredients.splice(
				selectedIngredients.indexOf(targetValue),
				1
			);

			// Removed hovered ingredients from ingredient names list
			if (ingredientNames.includes(app.titleCase(ingName))) {
				ingredientNames.splice(
					ingredientNames.indexOf(app.titleCase(ingName)),
					1
				);
			}

			// Update the filter
			app.updateFilter(selectedIngredients, ingredientNames);

			// Filter the list of recipes with the selected ingredients
			app.filter(selectedIngredients, ingredientNames);
		}
	}

	/**
	 * Click Events
	 */
	ingredientListEl.addEventListener('input', displaySelectedRecipes);

	// Hover Event - MouseOver
	ingredientListEl.addEventListener('mouseover', displayHoveredRecipes);

	// Hover Event - MouseOut
	ingredientListEl.addEventListener('mouseout', removeHoveredRecipes);
});