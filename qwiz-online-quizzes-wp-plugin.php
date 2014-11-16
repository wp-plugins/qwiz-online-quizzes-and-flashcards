<?php
/**
 * Plugin Name: Qwiz - online quizzes and flashcards
 * Plugin URI: http://dkprojects.net/qwiz
 * Description: Easy online quizzes and flashcards for WordPress
 * Version: 2.18
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

define ('PLUGIN_DIR', 'qwiz-online-quizzes-and-flashcards/');
define ('PLUGIN_FILE', 'qwiz-online-quizzes-wp-plugin.php');
define ('BETA_SUBDIR', 'beta/' . PLUGIN_DIR);

function language_init () {

   // Try to load "qwiz-{locale}.mo" from 
   //
   //    qwiz-online-quizzes-and-flashcards/languages 
   //
   // where {locale} defaults (right now) to en_US (e.g., qwiz-en_US.mo).
   $loaded = load_plugin_textdomain ('qwiz', false, dirname (plugin_basename (__FILE__)) . '/' . beta_subdir () . 'languages/');
}


function add_qwiz_js () {
   $qwiz                 = qwiz_plugin_url ('qwiz.js');
   $qwizcards            = qwiz_plugin_url ('qwizcards.js');
   $jquery_ui            = qwiz_plugin_url ('jquery-ui.min.js');
   $jquery_ui_touchpunch = qwiz_plugin_url ('jquery.ui.touch-punch.min.js');
   wp_enqueue_script ('qwiz_handle',                 $qwiz,                 array (), '2.15', true);
   wp_enqueue_script ('qwizcard_handle',             $qwizcards,            array (), '2.15', true);
   wp_enqueue_script ('jquery_ui_handle',            $jquery_ui,            array (), '2.15', true);
   wp_enqueue_script ('jquery_ui_touchpunch_handle', $jquery_ui_touchpunch, array (), '2.15', true);

   // Options/parameters.  Set default content option.
   $plugin_url = qwiz_plugin_url ( '/');
   $options = get_option ('qwiz_options');
   $icon_qwiz         = $options['icon_qwiz'];
   $content           = $options['content'];
   $translate_strings = $options['translate_strings'];

   // Default for content div selector.
   if (! $content) {
      $content = 'div.entry-content, div.post-entry, div.container';
   }

   // Set qwiz_T as array of strings.
   $qwiz_T = array ();
   include beta_subdir () . "languages/strings_to_translate.php";

   // If string substitutions given (from Settings/Admin page), make them now.
   if ($translate_strings) {
      $translate_strings = explode ("\n", $translate_strings);
      $n_translate_strings = count ($translate_strings);
      for ($i=0; $i<$n_translate_strings; $i++) {
         $strings = explode (';', $translate_strings[$i]);
         $old_string = $strings[0];
         $new_string = trim ($strings[1]);
         $qwiz_T[$old_string] = $new_string;
      }
   }
   $beta = isset ($_SESSION['qwiz_beta']);

   $qwiz_params = array (
      'T'         => $qwiz_T, 
      'url'       => $plugin_url, 
      'icon_qwiz' => $icon_qwiz,
      'content'   => $content,
      'beta'      => $beta
   );
   wp_localize_script ('qwiz_handle',     'qwiz_params', $qwiz_params);
   wp_localize_script ('qwizcard_handle', 'qwiz_params', $qwiz_params);
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
     $plugin_array['qwizzled_button_script'] = qwiz_plugin_url ( 'qwiz_tinymce.js') ;
     return $plugin_array;
}


function qwizzled_plugin_url () {
   $plugin_url = qwiz_plugin_url ( '/');
   print "<script type=\"text/javascript\">";
   print "   var qwizzled_plugin = {'url': '$plugin_url'}\n";
   print "</script>\n";
}


function qwiz_plugin_url ($path) {

   // This is like .../qwiz-online-quizzes-and-flashcards/qwiz.js?ver=2.15.
   $plugin_url = plugins_url ($path, __FILE__);

   $bsub = beta_subdir ();
   if ($bsub) {

      // Insert beta version subdir after final '/'.
      $last_slash_pos = strrpos ($plugin_url, '/');
      $plugin_url = substr ($plugin_url, 0, $last_slash_pos + 1) . $bsub
                                   . substr ($plugin_url, $last_slash_pos + 1);
   }

   return $plugin_url;
}

function beta_subdir () {

   $bsub = '';
   if (isset ($_SESSION['qwiz_beta'])) {
      $beta_plugin_file = plugin_dir_path (__FILE__) . BETA_SUBDIR . PLUGIN_FILE;
      if (file_exists ($beta_plugin_file)) {
         $bsub = BETA_SUBDIR;
      }
   }

   return $bsub;
}

// =============================================================================
add_action ('plugins_loaded', 'language_init');

add_action ('wp_enqueue_scripts', 'add_qwiz_js');

add_action ('admin_init', 'qwizzled_button');

// Pass plugin url to qwiz_tinymce.js.
add_action ('admin_head', 'qwizzled_plugin_url');

function qwizzled_add_locale ($locales) {
    $locales ['qwizzled_langs'] = plugin_dir_path (__FILE__) . beta_subdir () . 'languages/qwizzled_langs.php';
    //error_log ("[qwizzled_add_locale] locales: " . print_r ($locales, TRUE));
    return $locales;
}
add_filter ('mce_external_languages', 'qwizzled_add_locale');


// Admin page.
include "qwiz_admin.php";
