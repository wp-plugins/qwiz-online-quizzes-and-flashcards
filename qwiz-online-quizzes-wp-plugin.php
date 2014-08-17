<?php
/**
 * Plugin Name: Qwiz - online quizzes and flashcards
 * Plugin URI: http://dkprojects.net/qwiz
 * Description: Easy online quizzes and flashcards for WordPress
 * Version: 1.01
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
   $qwiz = plugins_url ('qwiz.js', __FILE__);
   $qwizcards = plugins_url ('qwizcards.js', __FILE__);
   wp_enqueue_script ('qwiz_handle', $qwiz, array (), '1.0', true);
   wp_enqueue_script ('qwizcard_handle', $qwizcards, array (), '1.0', true);
}

add_action('wp_enqueue_scripts', 'add_qwiz_js');
?>
