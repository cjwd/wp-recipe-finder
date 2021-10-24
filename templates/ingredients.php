<?php
    $data = file_get_contents(CRF_PLUGIN_DIR . "/data/ingredients.json");
    $ingredients = json_decode($data);

    function slugify($str) {
        $str = strtolower($str);
		$str = str_replace(" ", "-", $str);
        return $str;
    }
?>
<div class="cocktailIngredients">
    
    <div id="results-count-top" class="results-count">
        <!-- There is <span id="count" class="count"></span>recipes with
        <span id="selected-ingredients"> </span> -->
    </div>
    <button
        type="button"
        id="reset"
        class="reset-button c-btn c-btn--primary"
    >
        Reset Recipes
    </button>
    <fieldset id="ingredients" class="ingredients">
        <legend>Select Ingredients</legend>
        <?php foreach ($ingredients as $ingredient) : 
            $name = slugify($ingredient->name);
            $id = $ingredient->id;
        ?>
            <div class="ingredient">
                <label for="<?=  $name; ?>" class="c-checkbox" data-id="<?=  $id; ?>">
                    <input
                        type="checkbox"
                        name="ingredient"
                        id="<?=  $name; ?>"
                        value="<?=  $id; ?>"
                    />
                    <img src="<?php echo plugin_dir_url( __DIR__ ). "images/" .$name . ".png"; ?>" alt="<?=  $ingredient->name; ?>" />
                    <span class="c-checkbox__label"><?=  $ingredient->name; ?></span></label
                >
            </div>
        <?php endforeach; ?>
    </fieldset>
    <div id="results-count-bottom" class="results-count"></div>
</div>
<div id="cocktailsContainer" class="cocktails"></div>