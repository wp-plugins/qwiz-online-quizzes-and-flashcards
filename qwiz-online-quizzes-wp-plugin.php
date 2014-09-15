<?php
/**
 * Plugin Name: Qwiz - online quizzes and flashcards
 * Plugin URI: http://dkprojects.net/qwiz
 * Description: Easy online quizzes and flashcards for WordPress
 * Version: 1.11
 * Author: Dan Kirshner
 * Author URI: http://dkprojects.net/qwiz
 * License: GPL2
 */

/*  Copyright 2014  Dan Kishner  (email : dan_kirshner@yahoo.com)

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

function add_qwiz_js () {
   $qwiz      = plugins_url ('qwiz.js',      __FILE__);
   $qwizcards = 'http://berkeleyballet.org/qwizcards.js';
   $qwizcards = plugins_url ('qwizcards.js', __FILE__);
   $jquery_ui = plugins_url ('jquery-ui.min.js', __FILE__);
   wp_enqueue_script ('qwiz_handle',      $qwiz,      array (), '1.1b6', true);
   wp_enqueue_script ('qwizcard_handle',  $qwizcards, array (), '1.1b6', true);
   wp_enqueue_script ('jquery_ui_handle', $jquery_ui, array (), '1.1b6', true);
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
   $plugin_url = plugins_url( '/', __FILE__ );
   print "<script type=\"text/javascript\">";
   print "   var qwizzled_plugin = {'url': '$plugin_url'}\n";
   print "</script>\n";
}


add_action('wp_enqueue_scripts', 'add_qwiz_js');

add_action('admin_init', 'qwizzled_button');

// Pass plugin url to qwiz_tinymce.js.
add_action ('admin_head', 'qwizzled_plugin_url');

?>
