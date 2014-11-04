<?php
/**
 * Plugin Name: Qwiz - online quizzes and flashcards
 * Plugin URI: http://dkprojects.net/qwiz
 * Description: Easy online quizzes and flashcards for WordPress
 * Version: 2.11
 * Author: Dan Kirshner
 * Author URI: http://dkprojects.net/qwiz
 * License: GPL2
 */

/*  Copyright 2014  Dan Kirshner  (email : dan_kirshner@yahoo.com)

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License, version 2, as
    published by the Free Software Foundation.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program; if not, write to the Free Software
    Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
*/

function language_init () {
   global $qwiz_T;

   // Try to load "qwiz-{locale}.mo" from 
   //
   //    qwiz-online-quizzes-and-flashcards/languages 
   //
   // where {locale} defaults (right now) to en_US (e.g., qwiz-en_US.mo).
   $loaded = load_plugin_textdomain ('qwiz', false, dirname (plugin_basename (__FILE__)) . '/languages/');

   // Set qwiz_T as array of strings.
   $qwiz_T = array ();
   include "languages/strings_to_translate.php";

}



function add_qwiz_js () {
   global $qwiz_T;

   $qwiz                 = plugins_url ('qwiz.js',      __FILE__);
   $qwizcards            = plugins_url ('qwizcards.js', __FILE__);
   $jquery_ui            = plugins_url ('jquery-ui.min.js', __FILE__);
   $jquery_ui_touchpunch = plugins_url ('jquery.ui.touch-punch.min.js', __FILE__);
   wp_enqueue_script ('qwiz_handle',                 $qwiz,                 array (), '2.11', true);
   wp_enqueue_script ('qwizcard_handle',             $qwizcards,            array (), '2.11', true);
   wp_enqueue_script ('jquery_ui_handle',            $jquery_ui,            array (), '2.11', true);
   wp_enqueue_script ('jquery_ui_touchpunch_handle', $jquery_ui_touchpunch, array (), '2.11', true);


   $plugin_url = plugins_url ( '/', __FILE__ );
   wp_localize_script ('qwiz_handle',                'qwiz_plugin_data', array ('T' => $qwiz_T, 'url' => $plugin_url));
   wp_localize_script ('qwizcard_handle',            'qwiz_plugin_data', array ('T' => $qwiz_T, 'url' => $plugin_url));
}


function qwizzled_button () {
     if ( current_user_can ('edit_posts' ) && current_user_can ('edit_pages')) {
          add_filter ('mce_buttons', 'register_qwizzled_button');
          add_filter ('mce_external_plugins', 'add_qwizzled_button');
     }
}


function register_qwizzled_button ($buttons) {
     array_push ($buttons, "button_q", "qwizzled_button");
     return $buttons;
}


function add_qwizzled_button ($plugin_array) {
     $plugin_array['qwizzled_button_script'] = plugins_url ( 'qwiz_tinymce.js', __FILE__ ) ;
     return $plugin_array;
}


function qwizzled_plugin_url () {
   $plugin_url = plugins_url ( '/', __FILE__ );
   print "<script type=\"text/javascript\">";
   print "   var qwizzled_plugin = {'url': '$plugin_url'}\n";
   print "</script>\n";
}

add_action ('plugins_loaded', 'language_init');

add_action ('wp_enqueue_scripts', 'add_qwiz_js');

add_action ('admin_init', 'qwizzled_button');

// Pass plugin url to qwiz_tinymce.js.
add_action ('admin_head', 'qwizzled_plugin_url');

function qwizzled_add_locale($locales) {
    $locales ['qwizzled_langs'] = plugin_dir_path (__FILE__) . 'languages/qwizzled_langs.php';
    //error_log ("[qwizzled_add_locale] locales: " . print_r ($locales, TRUE));
    return $locales;
}
add_filter ('mce_external_languages', 'qwizzled_add_locale');

?>
