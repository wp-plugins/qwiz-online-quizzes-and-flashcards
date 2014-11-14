<?php
// Admin page.

function qwiz_admin () {
   // Args: 1: Page title.  2: Menu title.  3: Capability required by user for
   // menu option to be available.  4: Menu id name.  5: Function to print
   // content for page.
   add_options_page ('Qwiz', 'Qwiz', 'manage_options', 
                     'qwiz-online-quizzes-and-flashcards-admin', 'qwiz_options');
}


function qwiz_options () {
   if ( !current_user_can( 'manage_options' ) )  {
      wp_die( __( 'You do not have sufficient permissions to access this page.' ) );
   }
   print '<div class="wrap">' . "\n";
   print    '<h2>Qwiz options</h2>' . "\n";
   print    '<form action="options.php" method="post">' . "\n";

                // Output nonce, action, and option_page fields for this settings
                // page.  Arg: Group name (matches register_setting ()).
                settings_fields ('qwiz_options_group');

                // Arg: Id of page (matches add_settings_section ()).
                do_settings_sections ('qwiz-options-page'); 

   //print       '<input name="Submit" type="submit" value="' . esc_attr_e ('Save changes') . '" />' . "\n";
   print       '<input name="Submit" type="submit" value="Save changes" />' . "\n";
   print    '</form>';
   print '</div>';
}


function qwiz_admin_init () {

   // ........................................................................
   // Icon display.
   // Args: 1: group (same as settings_fields () call).  2: name of options
   // field (all options will be stored in this array).  3: function to validate
   // options.
   register_setting ( 'qwiz_options_group', 'qwiz_options', 'qwiz_options_validate' );

   // Args: 1: ID for section.  2: section title (printed on page).  
   // 3: function to display section intro/text.  4: Page name (matches 
   // do_settings_sections () call).
   add_settings_section ('qwiz-icon_qwiz-section', 'First-card Qwiz icon/link',
                         'icon_qwiz_text', 'qwiz-options-page');

   // Args 1: ID for field.  2: title.  3: function to display field input.
   // 4: page name.  5: ID of section (first arg to add_settings_section ()).
   add_settings_field ('qwiz-icon_qwiz-field', 'Display Qwiz icon/link', 
                       'icon_qwiz_field_input', 'qwiz-options-page', 
                       'qwiz-icon_qwiz-section');
   // ........................................................................
   // Strings and "translations" (substitutions).
   // Args: 1: ID for section.  2: section title (printed on page).  
   // 3: function to display section intro/text.  4: Page name (matches 
   // do_settings_sections () call).
   add_settings_section ('qwiz-translate_strings-section', 
                         'Customize button labels, etc.',
                         'translate_strings_text', 'qwiz-options-page');

   // Args 1: ID for field.  2: title.  3: function to display field input.
   // 4: page name.  5: ID of section (first arg to add_settings_section ()).

   $title = 'Current string; new string (semicolon-separated pair each line)'
            . '<br /><br /><br />'
            . '<input name="Submit" type="submit" value="Save changes" />';
   add_settings_field ('qwiz-translate_strings-field', $title,
                       'translate_strings_field_input', 'qwiz-options-page', 
                       'qwiz-translate_strings-section');

   // ........................................................................
   // Content div.
   // Args: 1: ID for section.  2: section title (printed on page).  
   // 3: function to display section intro/text.  4: Page name (matches 
   // do_settings_sections () call).
   add_settings_section ('qwiz-content-section', 
                         'HTML element that contains quiz and flashcard content (shortcodes, etc.)',
                         'content_text', 'qwiz-options-page');

   // Args 1: ID for field.  2: title.  3: function to display field input.
   // 4: page name.  5: ID of section (first arg to add_settings_section ()).
   add_settings_field ('qwiz-content-field', 'Qwiz-content HTML<br />element(s)', 
                       'content_field_input', 'qwiz-options-page', 
                       'qwiz-content-section');
}


function qwiz_options_validate ($options) {

   global $qwiz_T;

   // ............................................
   // Check icon_qwiz option.
   $new_icon_qwiz = trim ($options['icon_qwiz']);
   if (   $new_icon_qwiz != 'Icon and link'
       && $new_icon_qwiz != 'Icon only'
       && $new_icon_qwiz != 'Not displayed') {

      // Reset to default.
      $new_icon_qwiz = 'Icon and link';
   }
   $options['icon_qwiz'] = $new_icon_qwiz;

   // ............................................
   // Check "content" HTML element.
   $new_content = trim ($options['content']);
   if ($new_content == '') {

      // Reset to default.
      $new_content = 'div.entry-content, div.post-entry, div.container';

      // Error feedback.  Args: 1: Id of the setting.  2:  Id for error.
      // 3: message.
      add_settings_error ('qwiz-content-section', 'qwiz-content-errmsg',
                          'All-blank Qwiz-content HTML element(s) not allowed.  Resetting to default...');
   }
   $options['content'] = $new_content;

   // ............................................
   // Check "translate_strings".
   $errmsg = '';
   $translate_strings = trim ($options['translate_strings']);
   $new_translate_strings = array ();
   if ($translate_strings != '') {

      // Split into lines, loop over lines.
      $lines = explode ("\n", $translate_strings);
      $n_lines = count ($lines);
      for ($i=0; $i<$n_lines; $i++) {

         // Skip blank lines.
         $line = trim ($lines[$i]);
         if ($line == '') {
            continue;
         }

         // Split line by semicolon.
         $strings = explode (';', $line);
         if (count ($strings) != 2) {

            // Error feedback.  Args: 1: Id of the setting.  2:  Id for error.
            // 3: message.
            add_settings_error ('qwiz-content-section', 'qwiz-strings_to_translate-errmsg1',
                                'Custom labels line' . ($i + 1) . ': didn\'t get two strings separated by semi-colon.');
            // Set for sake of correction after error message.
            $new_translate_strings[] = $line;
         } else {
            $old_string = trim ($strings[0]);
            $new_string = trim ($strings[1]);
            if (strlen ($old_string) == 0 || strlen ($new_string) == 0 ) {
               add_settings_error ('qwiz-content-section', 'qwiz-strings_to_translate-errmsg2',
                                   'Custom labels line' . ($i + 1) . ': null string before or after semicolon not allowed.');

               // Set for sake of correction after error message.
               $new_translate_strings[] = $old_string . '; ' . $new_string;
            } else {

               // Check if string exists in list.
               if (! array_key_exists ($old_string, $qwiz_T)) {
                  add_settings_error ('qwiz-content-section', 'qwiz-strings_to_translate-errmsg3',
                                      'Custom labels line' . ($i + 1) . ': could not find current string ("' . $old_string . '") in list of strings.  Either incorrectly entered or missing from list (see languages/strings_to_translate.php in the Qwiz plugin directory).');
               }

               // Append to array (even if not in list: no harm, but allows
               // correction after error message.
               $new_translate_strings[] = $old_string . '; ' . $new_string;
            }
         }
      }
   }

   // Join into new-line separated string.
   $options['translate_strings'] = implode ("\n", $new_translate_strings);

   return $options;
}


// -----------------------------------------------------------------------------
function icon_qwiz_text () {
   print '<p>';
   print 'The Qwiz icon appears on the first or introductory card/page ';
   print 'of a quiz or a flashcard deck.  It provides a link to the Qwiz ';
   print 'website. ';
   print '</p>';
}


function icon_qwiz_field_input () {

   // Get the options array from the WordPress database.
   $options = get_option ('qwiz_options');

   $icon_qwiz = $options['icon_qwiz'];

   // Default.
   if ($icon_qwiz == '') {
      $icon_qwiz = 'Icon and link';
   }

   // Form field to input new value.
   print '<select id="qwiz_qwiz_icon_qwiz" name="qwiz_options[icon_qwiz]">' . "\n";

   $select_options = array ('Icon and link', 'Icon only', 'Not displayed');
   $n_select_options = count ($select_options);
   for ($i_opt=0; $i_opt<$n_select_options; $i_opt++) {
      $value = $select_options[$i_opt];
      $selected = $icon_qwiz == $value ? 'selected' : '';
      print    '<option value = "' . $value . '" ' . $selected . ">\n";
      print       $value;
      print    "</option>\n";
   }

   print "</select>\n";
}


// -----------------------------------------------------------------------------
function translate_strings_text () {
   print '<p>';
   print 'You can change the labels that are currently displayed on buttons or ';
   print 'in headers (or just about anywhere else for that matter).';
   print 'Enter the current text string you want to change, followed by a ';
   print 'semicolon, and then the replacement text. ';
   print 'Enter each such replacement on a separate line. ';
   print '</p>';
   print '<p>';
   print 'Note: the "current text string" must be entered in its entirety, ';
   print 'exactly as it currently appears.  Thus, "Got it!" must be entered ';
   print 'with the uppercase G and the exclamation point. ';
   print '</p>';
   print '<p>';
   print 'Note also: while one could translate the plugin to another language ';
   print 'in this manner, there actually is a standard WordPress ';
   print '"internationalization" method; see the languages directory in the ';
   print 'Qwiz plugin directory.';
   print '</p>';
   print '<p>';
   print 'Example: to replace the Flashcard button "Need more practice" ';
   print 'with "Try card again later", enter<br />';
   print '&emsp;&emsp; Need more practice; Try card again later ';
   print '</p>';
}


function translate_strings_field_input () {

   // Get the options array from the WordPress database.
   $options = get_option ('qwiz_options');

   $translate_strings = $options['translate_strings'];

   // Form field to input new value.
   print '<textarea id="qwiz_translate_strings" ';
   print '          name="qwiz_options[translate_strings]" ';
   print '          wrap="off" ';
   print '          style="width: 40rem; height: 5rem;">';
   print $translate_strings;
   print '</textarea>';
}


// -----------------------------------------------------------------------------
function content_text () {
   print '<p>';
   print 'The Qwiz "content" HTML element identifies the "container" for quiz ';
   print 'and flashcard deck shortcodes, etc.  In WordPress, this is where ';
   print 'page and post content appears.  The default setting includes divs ';
   print 'having class "entry-content", "post-content", or "container". ';
   print 'These vary sometimes depending on theme.  This option lets you ';
   print 'change or add to the default setting.';
   print '</p>';
   print '<p>';
   print 'Note: pages that include excerpts from several pages or posts ';
   print '(including the results of a search) include multiple such HTML ';
   print 'elements, which may contain incomplete quizzes or flashcard decks. ';
   print 'The Qwiz plugin handles this, but will be confused if it thinks ';
   print 'the excerpts are all part of the same page or post. ';
   print 'So don\'t define "body" to be the Qwiz-content HTML element!';
   print '</p>';
   print '<p>';
   print 'HTML elements are entered CSS-fashion, such as div.class or div#id. Examples:<br />';
   print '&emsp;&emsp; div#special-container - div element with id="special-container"<br />';
   print '&emsp;&emsp; span.content-span - span element with class="content-span"';
   print '</p>';
}

function content_field_input () {

   // Get the options array from the WordPress database.
   $options = get_option ('qwiz_options');

   $content = $options['content'];

   // Default.
   if ($content == '') {
      $content = 'div.entry-content, div.post-entry, div.container';
   }

   // Form field to input new value.
   print '<input id="qwiz_content" name="qwiz_options[content]" type="text" '
         . 'style="width: 30rem;" value="' . $content . '" />' . "\n";
}

add_action ('admin_menu', 'qwiz_admin');

add_action ('admin_init', 'qwiz_admin_init');
