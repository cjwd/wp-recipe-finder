<?php

/**
 * Plugin Name: Recipe Finder
 * Description: Interactive Recipe Finder
 * Version: 1.2.0
 * Author: Chinara James
 * Text Domain: crf
 * 
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit; // Exit if accessed directly
}

/**
 * @todo
 * Remove woocommerce scripts from this page
 * Load stylesheet and script only on this page
 */

/**
 * Current plugin version.
 */
define('CRF_VERSION', '1.2.0');

/**
 * Plugin and template directories
 */
define('CRF_PLUGIN_URL', plugin_dir_url(__FILE__));
define('CRF_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('CRF_PLUGIN_TEMPLATE_DIR', CRF_PLUGIN_DIR . 'templates/');

if( ! class_exists( 'Gamajo_Template_Loader' ) ) {
	require CRF_PLUGIN_DIR . '/includes/class-gamajo-template-loader.php';
}
require CRF_PLUGIN_DIR . '/includes/class-crf-template-loader.php';

function crf_ingredient_shortcode() {

	$templates = new CRF_Template_Loader;

	ob_start();
	$templates->get_template_part( 'ingredients' );
	return ob_get_clean();

}
add_shortcode( 'ingredients', 'crf_ingredient_shortcode' );

/**
 * Enqueue scripts and styles
 */
function cjwd_crf_enqueue_scripts() {
    wp_enqueue_style('crf-css', CRF_PLUGIN_URL . '/dist/style.css', [], CRF_VERSION);

    wp_enqueue_script('crf-js', CRF_PLUGIN_URL . '/dist/main-min.js', [], CRF_VERSION, true);
}
add_action('wp_enqueue_scripts', 'cjwd_crf_enqueue_scripts');


/**
 * Add classes to body
 */
function cjwd_crf_body_classes($classes) {
    if(is_page_template('ingredients.php')) {
        return array_merge( $classes, array( 'recipe-finder-app' ) );
    }
    return $classes;
}
add_filter('body_class', 'cjwd_crf_body_classes');