/** 
 * NOTE: Cache is only available on https (secure connections)
 */
const cacheAvailable = 'caches' in self,
	apiRoot = 'https://soleratt.com/wp-json',
	endpoint = '/wp/v2/wprm_recipe?per_page=100'; 

if (cacheAvailable) {
	const cacheName = 'cocktail-recipes';
	fetch(request).then((response) => {
		caches.open(cacheName).then((cache) => {
			return cache.put(request, response);
		});
	});

	caches.open(cacheName).then((cache) => {
		cache.match(request).then((item) => {
			console.log(item);
		});
	});
}

function ready(callbackFunction) {
	if (document.readyState != 'loading') callbackFunction(event);
	else document.addEventListener('DOMContentLoaded', callbackFunction);
}

ready((event) => {
	const apiRoot = 'https://soleratt.com/wp-json',
		articleContainer = document.querySelector('#cocktailsContainer'),
		ingredientListEl = document.getElementById('ingredients'),
		resetBtn = document.getElementById('reset');

	let listCocktails = {}, // app container
		selectedIngredients = [], // Keeps track of clicked ingredients
		ingredientNames = []; // Keeps track of clicked ingredient names

	// Functions

	/**
	 * init - Initialize the listing of posts
	 *
	 */
	listCocktails.init = function () {
		document.body.classList.add('recipe-finder-app');
		fetch(apiRoot + '/wp/v2/wprm_recipe?per_page=100')
			.then((response) => {
				if (response.status !== 200) {
					console.log('Problem! Status Code: ' + response.status);
					return;
				}

				response.json().then((posts) => {
					// Render how many recipes in total
					listCocktails.renderCount(posts.length);

					// Reset the filter if there was a page refresh
					listCocktails.resetFilter();

					// Hide the reset button
					resetBtn.classList.add('hide');
				});
			})
			.catch(function (err) {
				console.log('Error: ', err);
			});
	};
	listCocktails.init();

	listCocktails.getRecipes = function (request, ingredientList) {
		fetch(request)
			.then((response) => {
				if (response.status !== 200) {
					console.log('Problem! Status Code: ' + response.status);
					return;
				}
				response.json().then((posts) => {
					// Remove the list of previous recipes
					listCocktails.clearPosts();

					// Update the total recipes found
					listCocktails.renderCount(posts.length, ingredientList);

					// Update the filter to show selected and associated recipes
					listCocktails.updateFilter(posts);

					// Render new recipe list
					listCocktails.render(posts);

					// Show the reset button
					resetBtn.classList.remove('hide');
				});
			})
			.catch(function (err) {
				console.log('Error: ', err);
			});
	};

	/**
	 *
	 * @param {Array} ingredients Array list of ingredient ids from selected in the filter
	 * @param {Node} target The ingredient that was clicked/hovered
	 * @returns {Array} The updated list of ingredients ids
	 */
	listCocktails.getParams = function (ingredients, target) {
		// Add to list
		if (target.checked && !ingredients.includes(target.value)) {
			// console.log('adding');
			target.parentElement.classList.add('selected');
			ingredients.push(target.value);
		}

		//Remove from list
		if (!target.checked && ingredients.includes(target.value)) {
			// console.log('removing');
			target.parentElement.classList.remove('selected');
			ingredients.splice(ingredients.indexOf(target.value), 1);
		}

		return ingredients.join();
	};

	/**
	 * Build Request Url
	 */
	listCocktails.buildURL = function (params) {
		var jsonUrl = apiRoot + '/wp/v2/wprm_recipe';
		if (typeof params != 'undefined' && params != null) {
			jsonUrl +=
				'?wprm_ingredient[terms]=' +
				params +
				'&wprm_ingredient[operator]=AND';
		}
		return jsonUrl;
	};

	/**
	 * renderPost - Display posts on the page
	 *
	 * @param  {Array} posts Array of Posts in JSON
	 */
	listCocktails.render = function (posts) {
		for (let post of posts) {
			listCocktails.renderPost(post);
		}
	};

	/**
	 * renderPost - Displays an individual post on the page
	 *
	 * @param  {Object} post Individual post
	 */
	listCocktails.renderPost = function (post) {
		const articleEl = document.createElement('article'),
			titleEl = listCocktails.getTitleMarkup(post),
			contentEl = listCocktails.getContentMarkup(post);

		articleEl.classList.add('cocktail-recipe');
		articleEl.appendChild(contentEl);
		articleEl.appendChild(titleEl);
		articleContainer.appendChild(articleEl);
	};

	/**
	 *
	 * @param {Integer} count The number of recipes. Length of the results array
	 * @param {String} ingredients Comma separated ingredient names.
	 */
	listCocktails.renderCount = function (count, ingredients = '') {
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

	/**
	 * getTitleMarkup - Get the markup for a post title
	 *
	 * @param  {Object} post Individual post from the API
	 * @return {Object}      Title markup with link and post title
	 */
	listCocktails.getTitleMarkup = function (post) {
		const titleEl = document.createElement('h2'),
			titleLinkEl = document.createElement('a');

		titleEl.classList.add('cocktail-recipe-title');
		titleLinkEl.innerHTML = post.title.rendered;
		titleLinkEl.href = post.link;
		titleEl.appendChild(titleLinkEl);

		return titleEl;
	};

	/**
	 * getContentMarkup - Get the markup for post content
	 *
	 * @param  {Object} post Individual post from the API
	 * @return {Object}      Content markup with content
	 */
	listCocktails.getContentMarkup = function (post) {
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

	/**
	 * clearPosts - Clear posts from page
	 *
	 */
	listCocktails.clearPosts = function () {
		articleContainer.innerHTML = '';
	};

	/**
	 * Highlight associated ingredients and disabled unassociated ingredients
	 * @param {Array} posts Array of posts in JSON
	 */
	listCocktails.updateFilter = function (posts) {
		let siblingIngredients = [];
		// TO DO
		// If there are no sibling ingredients, array is empty
		// What to do. Right now all ingredient icons are being greyscaled and disabled
		for (const post of posts) {
			siblingIngredients.push(post.wprm_ingredient);
		}

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

	/**
	 * Reset selected ingredients
	 */
	listCocktails.resetFilter = function () {
		const checkboxes = document.querySelectorAll('.c-checkbox input');
		for (let i = 0; i < checkboxes.length; i++) {
			checkboxes[i].checked = false;
			checkboxes[i].parentElement.classList.remove('linked');
			checkboxes[i].removeAttribute('disabled');
		}
		listCocktails.clearPosts();
		selectedIngredients = []; // reset selected ingredients
		ingredientNames = []; // reset ingredients names
	};

	// HELPERS / UTILITIES
	listCocktails.titleCase = function (str) {
		return str
			.toLowerCase()
			.split(' ')
			.map(function (word) {
				return word.charAt(0).toUpperCase() + word.slice(1);
			})
			.join(' ');
	};

	// INTERACTIONS / EVENT LISTENERS

	/**
	 * Listen for clicks on ingredients to filter recipes
	 */
	ingredientListEl.addEventListener('input', function (e) {
		let target = e.target,
			params = listCocktails.getParams(selectedIngredients, target);
		// Get the comma separated list of ingredient ids to pass to buildURL

		if (params.length == '') {
			listCocktails.resetFilter();
			listCocktails.clearPosts();
		}

		if (
			target.checked &&
			!ingredientNames.includes(
				listCocktails.titleCase(target.getAttribute('id'))
			)
		) {
			ingredientNames.push(
				listCocktails.titleCase(target.getAttribute('id'))
			);
		}

		if (
			!target.checked &&
			ingredientNames.includes(
				listCocktails.titleCase(target.getAttribute('id'))
			)
		) {
			ingredientNames.splice(
				ingredientNames.indexOf(
					listCocktails.titleCase(target.getAttribute('id'))
				),
				1
			);
		}

		// Build the request url
		let requestUrl = listCocktails.buildURL(params);

		listCocktails.getRecipes(requestUrl, ingredientNames.join());
	});

	/**
	 * Listen for Mouse Over events on ingredients to filter recipes
	 */
	ingredientListEl.addEventListener('mouseover', function (e) {
		let target = e.target;

		if (target.nodeName == 'INPUT') {
			if (target.checked || target.disabled) {
				return;
			}

			// If selectedIngredients exists, is an array and not empty
			// Just get the associated (sibling ingredients)
			// Initial state, no ingredients selected
			if (
				!Array.isArray(selectedIngredients) ||
				!selectedIngredients.length
			) {
				fetch(
					apiRoot +
						'/wp/v2/wprm_recipe?wprm_ingredient=' +
						target.value
				)
					.then((response) => {
						if (response.status !== 200) {
							console.log(
								'Problem! Status Code: ' + response.status
							);
							return;
						}
						response.json().then((posts) => {
							// Remove the list of previous recipes
							listCocktails.clearPosts();

							// Update the total recipes found
							listCocktails.renderCount(
								posts.length,
								listCocktails.titleCase(
									target.getAttribute('id')
								)
							);

							// Update the filter to show selected and associated recipes
							listCocktails.updateFilter(posts);
						});
					})
					.catch(function (err) {
						console.log('Error: ', err);
					});

				return;
			}

			// If there are selected ingredients add the hovered ingredient to the list
			selectedIngredients.push(target.value);

			let params = selectedIngredients.join();

			let requestUrl = listCocktails.buildURL(params);

			ingredientNames.push(
				listCocktails.titleCase(target.getAttribute('id'))
			);

			listCocktails.getRecipes(requestUrl, ingredientNames.join());
		}
	});

	/**
	 * Listen for Mouse Over events on ingredients to filter recipes
	 */
	ingredientListEl.addEventListener('mouseout', function (e) {
		let target = e.target;

		if (target.nodeName == 'INPUT') {
			/**
			 * 1. Check that the input is checked
			 * Only proceed if input is UNCHECKED.
			 */
			if (target.checked || target.disabled) {
				return;
			}

			if (
				!Array.isArray(selectedIngredients) ||
				!selectedIngredients.length
			) {
				// array does not exist, is not an array, or is empty
				// No ingredients selected so reset filter to initial state

				listCocktails.resetFilter();

				// Update the total recipes found
				// To Do: store total recipes in a variable
				listCocktails.renderCount(43);

				return;
			}

			// Remove hovered ingredient from selected ingredients
			selectedIngredients.splice(
				selectedIngredients.indexOf(target.value),
				1
			);

			let params = selectedIngredients.join();

			let requestUrl = listCocktails.buildURL(params);

			// Remove hovered ingredients from ingredient names list for result count
			if (
				ingredientNames.includes(
					listCocktails.titleCase(target.getAttribute('id'))
				)
			) {
				ingredientNames.splice(
					ingredientNames.indexOf(
						listCocktails.titleCase(target.getAttribute('id'))
					),
					1
				);
			}

			// Fetch recipes without the hovered ingredient
			// Inside getRecipes the filter is updated
			listCocktails.getRecipes(requestUrl, ingredientNames.join());
		}
	});

	/**
	 * Reset Recipes / Clear Recipe List
	 */
	resetBtn.addEventListener('click', function () {
		listCocktails.init();
	});
});
