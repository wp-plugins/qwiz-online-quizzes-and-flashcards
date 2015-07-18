<?php
/**
 * Plugin Name: Qwizcards - online quizzes and flashcards
 * Plugin URI: http://qwizcards.com
 * Description: Easy online quizzes and flashcards for WordPress
 * Version: beta 9 for 2.32
 * Author: Dan Kirshner
 * Author URI: http://qwizcards.com
 * License: GPL2
 */

/*  Copyright 2015  Dan Kirshner  (email : dan_kirshner@yahoo.com)

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

$debug = false;

$server_loc        = '//qwizcards.com/admin';
$secure_server_loc = 'https://host359.hostmonster.com/~whereisq/qwiz/admin';
//$server_loc        = '//localhost/qwiz/admin';
//$secure_server_loc = '//localhost/qwiz/admin';


function qwiz_language_init () {

   // Try to load "qwiz-{locale}.mo" from 
   //
   //    qwiz-online-quizzes-and-flashcards/languages 
   //
   // where {locale} defaults (right now) to en_US (e.g., qwiz-en_US.mo).
   $loaded = load_plugin_textdomain ('qwiz', false, dirname (plugin_basename (__FILE__)) . '/' . qwiz_beta_subdir () . 'languages/');
}


function add_qwiz_js_and_style () {
   global $server_loc, $secure_server_loc;

   // JavaScript.
   $qwiz                 = qwiz_plugin_url ('qwiz.js');
   $qwizcards            = qwiz_plugin_url ('qwizcards.js');
   $qwiz_qcards_common   = qwiz_plugin_url ('qwiz_qcards_common.js');
   $jquery_ui            = qwiz_plugin_url ('jquery-ui.min.js');
   $jquery_ui_touchpunch = qwiz_plugin_url ('jquery.ui.touch-punch.min.js');
   wp_enqueue_script ('qwiz_handle',                 $qwiz,                 array (), '2.31', true);
   wp_enqueue_script ('qwizcards_handle',            $qwizcards,            array (), '2.31', true);
   wp_enqueue_script ('qwiz_qcards_common_handle',   $qwiz_qcards_common,   array (), '2.31', true);
   wp_enqueue_script ('jquery_ui_handle',            $jquery_ui,            array (), '2.31', true);
   wp_enqueue_script ('jquery_ui_touchpunch_handle', $jquery_ui_touchpunch, array (), '2.31', true);

   // Options/parameters.  Set default content option.
   $plugin_url = qwiz_plugin_url ( '/');
   $options = get_option ('qwiz_options');
   $icon_qwiz         = $options['icon_qwiz'];
   $content           = $options['content'];
   $hint_timeout_sec  = $options['hint_timeout_sec'];
   $translate_strings = $options['translate_strings'];

   // Default for content div selector.
   if (! $content) {
      $content = 'div.entry-content, div.post-entry, div.container';
   }

   // Set qwiz_T as array of strings.
   $qwiz_T = array ();
   include qwiz_beta_subdir () . "languages/strings_to_translate.php";

   // If string substitutions given (from Settings/Admin page), make them now.
   if ($translate_strings) {
      $translate_strings = explode ("\n", $translate_strings);
      $n_translate_strings = count ($translate_strings);
      for ($i=0; $i<$n_translate_strings; $i++) {
         $strings = explode (';', $translate_strings[$i]);
         $old_string = $strings[0];

         // Translation of "Flip" to "Check answer" is default.  Allow "Check
         // answer" to be translated.
         if ($old_string == 'Check answer') {
            $old_string = 'Flip';
         }
         $new_string = trim ($strings[1]);
         $qwiz_T[$old_string] = $new_string;
      }
   }
   $beta = isset ($_SESSION['qwiz_beta']);

   $qwiz_params = array (
      'T'                => $qwiz_T, 
      'url'              => $plugin_url, 
      'icon_qwiz'        => $icon_qwiz,
      'content'          => $content,
      'beta'             => $beta,
      'server_loc'       => $server_loc,
      'secure_server_loc'=> $secure_server_loc,
      'hint_timeout_sec' => $hint_timeout_sec
   );
   wp_localize_script ('qwiz_handle',      'qwiz_params', $qwiz_params);
   wp_localize_script ('qwizcards_handle', 'qwiz_params', $qwiz_params);

   // Stylesheets.
   wp_register_style ('qwiz_css_handle', qwiz_plugin_url ('qwiz.css'));
   wp_register_style ('qwizcards_css_handle', qwiz_plugin_url ('qwizcards.css'));
   wp_register_style ('qwiz_styles_handle', qwiz_plugin_url ('qwiz_styles.css'));
   wp_register_style ('jquery_ui_styles_handle', qwiz_plugin_url ('jquery-ui.css'));

   wp_enqueue_style ('qwiz_css_handle');
   wp_enqueue_style ('qwizcards_css_handle');
   wp_enqueue_style ('qwiz_styles_handle');
   wp_enqueue_style ('jquery_ui_styles_handle');
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
   global $server_loc, $secure_server_loc;

   $plugin_url = qwiz_plugin_url ( '/');
   print "<script type=\"text/javascript\">";
   print "   var qwizzled_plugin = {'url': '$plugin_url', 'server_loc': '$server_loc', 'secure_server_loc': '$secure_server_loc'}\n";
   print "</script>\n";
}


function qwiz_plugin_url ($path) {

   // This is like .../qwiz-online-quizzes-and-flashcards/qwiz.js?ver=2.15.
   $plugin_url = plugins_url ($path, __FILE__);

   $bsub = qwiz_beta_subdir ();
   if ($bsub) {

      // Insert beta version subdir after final '/'.
      $last_slash_pos = strrpos ($plugin_url, '/');
      $plugin_url = substr ($plugin_url, 0, $last_slash_pos + 1) . $bsub
                                   . substr ($plugin_url, $last_slash_pos + 1);
   }

   return $plugin_url;
}

function qwiz_beta_subdir () {

   $bsub = '';
   $options = get_option ('qwiz_options');
   if (isset ($_SESSION['qwiz_beta']) || $options['deploy_beta']) {
      $beta_plugin_file = plugin_dir_path (__FILE__) . BETA_SUBDIR . PLUGIN_FILE;
      if (file_exists ($beta_plugin_file)) {
         $bsub = BETA_SUBDIR;
      }
   }

   return $bsub;
}

// =============================================================================
add_action ('plugins_loaded', 'qwiz_language_init');

add_action ('wp_enqueue_scripts', 'add_qwiz_js_and_style');

add_action ('admin_init', 'qwizzled_button');

// Pass plugin url to qwiz_tinymce.js.
add_action ('admin_head', 'qwizzled_plugin_url');

function qwizzled_add_locale ($locales) {
    $locales ['qwizzled_langs'] = plugin_dir_path (__FILE__) . qwiz_beta_subdir () . 'languages/qwizzled_langs.php';
    //error_log ("[qwizzled_add_locale] locales: " . print_r ($locales, TRUE));
    return $locales;
}
add_filter ('mce_external_languages', 'qwizzled_add_locale');


// =============================================================================
/*
function qwiz_change_mce_options ($mceInit) {
   $mceInit['paste_preprocess'] 
      = 'function (pl, o) {
            console.log ("[qwiz_change_mce_options] o.content: ", o.content);
            o.content = "[[" + o.content + "]]";
         }';
   //error_log ("[qwiz_change_mce_options] mceInit: " . print_r ($mceInit, true));

   return $mceInit;
}

add_filter ('tiny_mce_before_init', 'qwiz_change_mce_options');
*/


// =============================================================================
function qwiz_admin_bar_item ($wp_admin_bar) {

   $args = array (
      'id'     => 'qwiz_menu',
      'title'  => 'Qwizcards'
   );
   $wp_admin_bar->add_node ($args);

   $args = array (
      'id'     => 'qwiz_menu_keep_next_active',
      'parent' => 'qwiz_menu',
      'title'  => 'Keep "next" button active',
      'href'   => '#',
      'meta'   => array ('onclick' => 'qwiz_.keep_next_button_active (); qcard_.keep_next_button_active (); return false;',
                         'title'   => 'Allows you to skip questions/cards')
   );
   $wp_admin_bar->add_node ($args);
}


add_action ('admin_bar_menu', 'qwiz_admin_bar_item', 999);


// =============================================================================
// For each post, look through for [qwiz]...[/qwiz] or [qdeck]...[/qdeck] valid
// pairs.  If all valid (exclude those within [qwizdemo] or [qcarddemo] pairs),
// then, wrap each in a div, with class for no display.  qwiz.js and
// qwizcards.js will rewrite those divs within the DOM, which will avoid 
// clobbering events bound elsewhere (rewriting the html does the clobbering).
function qwiz_process_shortcodes_initially ($content) {
   global $debug;

   if (strpos ($content, '[qwiz') !== false || strpos ($content, '[qdeck') !== false) {

      // [qwizdemo] and [qcarddemo] contents -- save, replace with placeholder
      // (restore when done).
      list ($content, $qwizdemos)  = qwiz_cut_demos ($content, 'qwiz');
      list ($content, $qdeckdemos) = qwiz_cut_demos ($content, 'qdeck');

      // Check that have valid [qwiz] and [qdeck] open/close pairs.
      if (qwiz_check_shortcode_pairs_ok ($content, 'qwiz')
                         && qwiz_check_shortcode_pairs_ok ($content, 'qdeck')) {

         // Yes, valid pairs.  Preface content with one empty wrapper div of 
         // each type: signals we're on WordPress.  (Do only if valid pairs
         // so that JavaScript can separately catch and report the error.)
         $content =   '<div class="qwiz_wrapper"  style="display: none;"></div>'
                    . '<div class="qdeck_wrapper" style="display: none;"></div>'
                    . $content;

         // Wrap each such pair, but make sure balanced <div> ... </div> 
         // tag pairs inside (move unmatched tags outside).
         $content = qwiz_wrap_shortcode_pairs ($content, 'qwiz');
         $content = qwiz_wrap_shortcode_pairs ($content, 'qdeck');
      }

      // Restore demo contents, without the opening/closing shortcodes.
      $content = qwiz_unwrap_and_paste_demos ($content, $qwizdemos, 'qwiz');
      $content = qwiz_unwrap_and_paste_demos ($content, $qdeckdemos, 'qdeck');
      if ($debug) {
         error_log ("[qwiz_process_shortcodes_initially] content:\n" . $content);
      }
   }

   return $content;
}


// Find qwizdemo or qdeckdemo pairs, replace with placeholder, return for
// save.
function qwiz_cut_demos ($content, $qwiz_qdeck) {

   // Grab content of demo pair with subexpression.
   $match_pat = "/\[${qwiz_qdeck}demo\]([\s\S]*?)\[\/${qwiz_qdeck}demo\]/";
   preg_match_all ($match_pat, $content, $matches, PREG_SET_ORDER);

   $replace_pat = "${qwiz_qdeck}_PLACEHOLDER";
   $content = preg_replace ($match_pat, $replace_pat, $content);

   return array ($content, $matches);
}


function qwiz_unwrap_and_paste_demos ($content, $demos, $qwiz_qdeck) {
   $n_demos = count ($demos);
   $match_pat = "/${qwiz_qdeck}_PLACEHOLDER/";
   for ($i=0; $i<$n_demos; $i++) {

      // Get the subexpression (demo pair content).
      $demo = $demos[$i][1];

      // Do one at a time.
      $content = preg_replace ($match_pat, $demo, $content, 1);
   }

   return $content;
}


function qwiz_wrap_shortcode_pairs ($content, $qwiz_qdeck) {

   // Find [qwiz] ... [/qwiz] pairs and content.  Include opening/closing
   // <p>, <h*>, and <span> tags.
   $qmatch_pat = "/(<(p|h|span)[^>]*>\s*)*\[${qwiz_qdeck}[\s\S]*?\[\/$qwiz_qdeck\](<\/(p|h|span)[^>]*>\s*)*/";
   $n_qwiz_qdecks = preg_match_all ($qmatch_pat, $content, $matches, PREG_SET_ORDER);
   //print_r ($matches);

   // Also find "pieces" outside [qwiz] ... [/qwiz] pairs.
   $pieces = preg_split ($qmatch_pat, $content);

   // Process each [qwiz] ... [/qwiz] pair contents.
   $new_content = array ($pieces[0]);
   for ($i=0; $i<$n_qwiz_qdecks; $i++) {
      $qcontent = $matches[$i][0];
      array_push ($new_content, qwiz_check_fix_wrap_matched_divs ($qcontent, $qwiz_qdeck));
      array_push ($new_content, $pieces[$i+1]);
   }

   return implode ('', $new_content);
}


function qwiz_check_fix_wrap_matched_divs ($qcontent, $qwiz_qdeck) {
   global $debug;

   // Find all opening/closing divs.
   $div_match_pat = "/<div[^>]*>|<\/div>/";
   $n_tags = preg_match_all ($div_match_pat, $qcontent, $div_matches, PREG_SET_ORDER);

   // Loop over tags.  Mark matches.
   $matched_pair_b = array ();
   for ($i=0; $i<$n_tags; $i++) {
      array_push ($matched_pair_b, false);
      $tag = $div_matches[$i][0];
      if (substr ($tag, 0, 2) == '</') {

         // Closing </div>.  Look for previous unmatched opening <div>.  If
         // found, mark pair as matched.
         for ($jj=$i-1; $jj>=0; $jj--) {
            if (substr ($div_matches[$jj][0], 0, 2) == '<d' && ! $matched_pair_b[$jj]) {
               $matched_pair_b[$jj] = true;
               $matched_pair_b[$i] = true;
               break;
            }
         }
      }
   }

   // Move unmatched tags to after [qwiz]...[/qwiz] pair.  First split this
   // pair's contents on div tags.
   $pieces = preg_split ($div_match_pat, $qcontent);

   // Prepend wrapper.
   $new_qcontent = array ("<div class=\"${qwiz_qdeck}_wrapper qwiz_shortcodes_hidden\">\n");

   // Put back together with divs, except those unmatched.
   array_push ($new_qcontent, $pieces[0]);
   for ($i=0; $i<$n_tags; $i++) {
      if ($matched_pair_b[$i]) {
         if ($debug) {
            error_log ('[qwiz_check_fix_wrap_matched_divs] matched pair tag html: ' . summary ($div_matches[$i][0], 100));
         }
         $tag = $div_matches[$i][0];
         array_push ($new_qcontent, $tag);
      }
      array_push ($new_qcontent, $pieces[$i+1]);
   }

   // Close wrapper.
   array_push ($new_qcontent, "\n</div>  <!-- ${qwiz_qdeck}_wrapper -->\n");

   // Finally, add unmatched divs afterword.
   for ($i=0; $i<$n_tags; $i++) {
      if (! $matched_pair_b[$i]) {
         if ($debug) {
            error_log ('[qwiz_check_fix_wrap_matched_divs] unmatched pair tag html: ' . summary ($div_matches[$i][0], 100));
         }
         $tag = $div_matches[$i][0];
         array_push ($new_qcontent, $tag);
      }
   }

   return implode ('', $new_qcontent);
}


function qwiz_check_shortcode_pairs_ok ($content, $qwiz_qdeck) {
   global $debug;

   $error_b = false;
   $n_qwiz_qdecks = preg_match_all ("/\[$qwiz_qdeck|\[\/$qwiz_qdeck\]/", $content, $matches, PREG_SET_ORDER);
   if ($debug) {
      error_log ("[qwiz_check_shortcode_pairs_ok] n_${qwiz_qdeck}_s: $n_qwiz_qdecks");
   }
   if ($n_qwiz_qdecks) {
      if ($n_qwiz_qdecks % 2 != 0) {
         $error_b = true;
      } else {

         // Check proper pairs.
         for ($i=0; $i<$n_qwiz_qdecks; $i++) {
            $shortcode = $matches[$i][0];
            if ($i % 2 == 0) {
               if ($shortcode != "[$qwiz_qdeck") {
                  $error_b = true;
                  break;
               }
            } else {
               if ($shortcode != "[/$qwiz_qdeck]") {
                  $error_b = true;
                  break;
               }
            }
         }
      }
   }   

   $ok_b = ! $error_b;
   if ($debug) {
      error_log ("[qwiz_check_shortcode_pairs_ok] ok_b: $ok_b");
   }

   return $ok_b;
}


function summary ($txt, $summary_len) {
   $txtlen = strlen ($txt);
   if ($txtlen > 2*$summary_len) {
      $errtxt = substr ($txt, 0, $summary_len)
                . ' ... ' . substr ($txt, -$summary_len);
   } else {
      $errtxt = $txt;
   }

   return $errtxt;
}


add_filter ('the_content', 'qwiz_process_shortcodes_initially');


// -----------------------------------------------------------------------------
// Admin page.
include "qwiz_admin.php";
