/*
 * Version 2.11 2014-11-03
 * Use class instead of style for target/label borders (avoid "flash").
 * Use class "qtarget_assocNNN..." instead of data-...; some implementations
 * eat data-...
 * If feedback fadeout stopped, reset opacity (since jQuery doesn't).
 *
 * Version 2.09 2014-10-12
 * Warn/prevent use of images with captions for labeled diagrams.
 *
 * Version 2.08 2014-10-05
 * Add internationalization - use .po and .mo files.
 * Add div.post-entry as page content location.
 *
 * Version 2.01 2014-09-16
 * Modify menu header for Safari on Mac.
 *
 * Version 2.00 2014-09-14
 * Position targets where click.
 * Error message if no questions when click menu.
 * Raise menu z-index (TinyMCE 4.0).
 *
 * Version 1.1b03 2014-09-07
 * Labeled-diagrams capability, including interactive editing.
 */

// Set up interactive labeled diagrams within WordPress editor.  Invoked by
// TinyMCE startup or by added "Q" button.

// Do-nothing function for old IE.
if (! window.console) {
   window.console = {log: function(){} };
}


// =============================================================================
// Isolate namespace.
qwizzled = {};
var qwizzledf = function () {
// =============================================================================
//
var qname = 'qwizzled';

// Debug settings.
var debug = [false];

$ = jQuery;

// Private data, but global to this qwiz instance.
var q = this;

// The identifier -- including qualifiers like "#" -- of the editing frame on
// WordPress.
var edit_area_selector = 'iframe#content_ifr';
var edit_page_header;
var edit_area;
var qwizzled_main_menu_feedback;

var errmsgs = [];

var n_qwizzes = 0;

var tinymce_ed;
var waiting_for_label_click_b = false;
var waiting_for_target_select_b = false;
var qwizzled_question_obj;
var el_label_div;
var label_border_class;
var assoc_id;

var bstyles = ['dotted', 'dashed', 'solid'];
var bcolors = ['red', 'magenta', 'blue', 'aqua'];

horizontal_margin_adjust = 4;
vertical_margin_adjust   = 4;


// -----------------------------------------------------------------------------
/*
$(document).ready (function () {

});
*/


// -----------------------------------------------------------------------------
this.show_main_menu = function (ed, qwiz_button_b) {

   if (debug[0]) {
      console.log ('[show_main_menu] typeof (qwizzled_langs):', typeof (qwizzled_langs));
   }

   // Is the visual editing frame present?
   var ok_f = false;
   if ($ (edit_area_selector).is (':visible')) {
      edit_area = $ (edit_area_selector).contents ().find ('body');
      if (edit_area.length > 0) {
         ok_f = true;
      }
   }
   if (ok_f) {

      // If auto-started (not Q button press) in qwiz_tinymce.js, see if [qwiz]
      // with [l] on page.  Show menu only if it is.
      if (! qwiz_button_b) {
         var contains_obj = edit_area.find ('*:contains("[qwiz")');
         if (debug[0]) {
            console.log ('[show_main_menu] contains_obj:', contains_obj);
         }
         if (contains_obj.length == 0) {

            // No [qwiz] on page.  Do nothing.
            return false;
         }

         // See if [l] on page, too.
         contains_obj = edit_area.find ('*:contains("[l]")');
         if (contains_obj.length == 0) {
            return false;
         }
      }
   } else {

      // Couldn't find editing window.  Error message only if Q button pressed.
      if (qwiz_button_b) {
         alert (T ('Could not find editing window.  You need to be editing a page or post in Visual mode.'));
         return false;
      }
   }

   // Save editor object instance.
   tinymce_ed = ed;
   if (debug[0]) {
      console.log ('[show_main_menu] ed:', ed);
   }

   edit_page_header = $ (edit_area_selector).contents ().find ('head');

   // Is there already a menu present?  If so, delete it and create new.  Assume
   // styles are still present.
   var existing_menu_obj = $ ('#qwizzled_main_menu');
   if (existing_menu_obj.length) {
      existing_menu_obj.remove ();
   } else {

      // No menu present.  Need styles.
      add_style ();
      add_style_edit_area ();
   }

   // Create new menu.  HTML.
   var mm = [];

   mm.push ('<div id="qwizzled_main_menu">');
   mm.push ('   <div id="qwizzled_main_menu_header">');
   mm.push ('      <img src="' + qwizzled_plugin.url + 'images/icon_qwiz.png" class="icon_qwiz" />');
   mm.push ('      <div id="qwizzled_main_menu_title">');
   mm.push ('         Qwiz - ' + T ('labeled diagram editing menu'));
   mm.push ('      </div>');
   mm.push ('      <img src="' + qwizzled_plugin.url + 'images/icon_exit_red.png" class="icon_main_menu_exit" onclick="qwizzled.exit_main_menu ()" />');
   mm.push ('   </div>');
   mm.push ('   <div id="qwizzled_main_menu_items">');
   mm.push ('      <div class="qwizzled_main_menu_item" onclick="qwizzled.create_target1 ()" title="Create a target &ldquo;drop zone&rdquo; for a label - click here, then click label">');
   mm.push ('         Create target for a label');
   mm.push ('         <span id="create_target_spinner">');
   mm.push ('           <img src="' + qwizzled_plugin.url + 'images/spinner16x16.gif" border="0" />');
   mm.push ('         </span>');
   mm.push ('      </div>');
   mm.push ('   </div>');
   mm.push ('   <div class="qwizzled_main_menu_feedback"></div>');
   mm.push ('</div>');

   // Put on current (editor) page, not in content iframe!
   $ ('#wp-content-editor-container').append (mm.join ('\n'));
   qwizzled_main_menu_feedback = $ ('div.qwizzled_main_menu_feedback');

   // Make menu draggable.
   $ ('#qwizzled_main_menu').draggable ({handle: '#qwizzled_main_menu_header'});

   // Make anything that was previously draggable draggable and anything that 
   // was previously resizable resizable.  Also, remove the 'data-mce-style'
   // attribute -- however it's used, it clobbers drag and resize info.
   var draggables = edit_area.find ('[class*="ui-draggable"]');
   var resizables = edit_area.find ('[class*="ui-resizable"]').not ('[class*="ui-resizable-handle"]');
   if (debug[0]) {
      console.log ('draggables.length:', draggables.length);
      console.log ('resizables:', resizables);
      console.log ('resizables.length:', resizables.length);
   }
   draggables.draggable ();
   resizables.resizable ({
      resize: function (e, ui_obj) {

         // Set the left and bottom margins of the target div to offset the 
         // (resized) width and height of the div (kludge to enable use of
         // relative positioning rather than absolute, which gets extra
         // "drag handle" in Firefox).
         $ (this).css ({'margin-right': -(ui_obj.size.width + horizontal_margin_adjust) + 'px', 'margin-bottom': -(ui_obj.size.height + vertical_margin_adjust) + 'px'});
      }
   }).removeAttr ('data-mce-style');

   // Bind TinyMCE image/object selects (note: doesn't apply to text) to
   // function.  UNNEEDED.  Mouseup plus TinyMCE selection.getContent () works
   // for <img .../> html.
   /*
   tinymce_ed.on ('ObjectSelected', function (e) {
      q.target_object_selected (e);
   });
   */

};


// -----------------------------------------------------------------------------
// Hide main menu, reset flags.
this.exit_main_menu = function () {

   $ ('#qwizzled_main_menu').hide ();

   waiting_for_target_select_b = false;
   waiting_for_label_click_b   = false;
}


// -----------------------------------------------------------------------------
// Add style to editing page header (in iframe).
function add_style () {

   var s = [];

   s.push ('<style type="text/css">\n');

   s.push ('#qwizzled_main_menu {');
   s.push ('   position:        fixed;');
   s.push ('   width:           19rem;');

   // Want to beat TinyMCE toolbars at 999.
   s.push ('   z-index:         1000;');
   s.push ('   left:            750px;');
   s.push ('   top:             300px;');
   s.push ('   border:          2px solid rgba(79, 112, 153, 1);');
   s.push ('}');

   s.push ('#qwizzled_main_menu_header {');
   s.push ('   position:        relative;');
   s.push ('   height:          22px;');
   s.push ('   color:           white;');
   s.push ('   background:      rgba(79, 112, 153, 1);');
   s.push ('   font-weight:     bold;');
   //s.push ('   vertical-align:  40%;');
   s.push ('   cursor:          move;');
   s.push ('}');

   s.push ('.icon_qwiz {');
   s.push ('   position:        absolute;');
   s.push ('   background:      white;');
   s.push ('   border:          none;');
   s.push ('}');

   s.push ('#qwizzled_main_menu_title {');
   s.push ('   position:        absolute;');
   s.push ('   left:            24px;');
   s.push ('   top:             0px;');
   s.push ('}');

   s.push ('.icon_main_menu_exit {');
   s.push ('   float:           right;');
   s.push ('   border:          none;');
   s.push ('   margin-top:      2px;');
   s.push ('   margin-right:    1px;');
   s.push ('   cursor:          default;');
   s.push ('}');

   s.push ('#qwizzled_main_menu_items {');
   s.push ('   background:      white;');
   s.push ('   padding:         5px;');
   s.push ('}');

   s.push ('.qwizzled_main_menu_item {');
   s.push ('   border:          1px solid white;');
   s.push ('}');

   s.push ('#create_target_spinner {');
   s.push ('   visibility:         hidden;');
   s.push ('}');

   s.push ('.qwizzled_main_menu_item:hover {');
   s.push ('   border:          1px solid gray;');
   s.push ('   cursor:          pointer;');
   s.push ('}');

   s.push ('.qwizzled_main_menu_item:active {');
   s.push ('   outline:         2px solid lightgray;');
   s.push ('}');

   s.push ('.qwizzled_main_menu_feedback {');
   s.push ('   display:         none;');
   s.push ('   padding:         5px;');
   s.push ('   background:      #FFFF77;');
   s.push ('}');

   s.push ('img.click_on_a_label_exit {');
   s.push ('   float:           right;');
   s.push ('   margin-top:      2px;');
   s.push ('   margin-right:    2px;');
   s.push ('   cursor:          default;');
   s.push ('}');

   s.push ('.qwizzled_highlight_label_border {');
   s.push ('   border:          1px dotted gray;');
   s.push ('}');

   s.push ('</style>');

   $(s.join ('\n')).appendTo ('head');
}


// -----------------------------------------------------------------------------
// Add style to edit content (in iframe).
function add_style_edit_area () {

   var s = [];

   s.push ('<style type="text/css">\n');

   s.push ('div.qwizzled_question {');
   s.push ('   position:        relative;');
   s.push ('   border:          1px dotted blue;');
   s.push ('}');

   s.push ('div.qwizzled_question_bottom_border_title {');
   s.push ('   position:        absolute;');
   s.push ('   width:           100%;');
   s.push ('   height:          10px;');
   s.push ('   left:            0px;');
   s.push ('   bottom:          -7px;');
   s.push ('   cursor:          help;');
   s.push ('   font-size:       0.1px;');
   s.push ('}');

   s.push ('div.qwizzled_canvas {');
   s.push ('   position:        relative;');
   s.push ('   min-height:      250px;');
   s.push ('   outline:         2px solid black;');
   s.push ('   padding:         5px;');
   s.push ('}');

   s.push ('div.qwizzled_canvas p {');
   s.push ('   margin:          0px;');
   s.push ('}');

   s.push ('.qwizzled_highlight_label_border {');
   s.push ('   border:          1px dotted gray;');
   s.push ('}');

   s.push ('div.qwizzled_target {');
   s.push ('   width:           120px;');
   s.push ('   height:          28px;');
   s.push ('   margin-right:     -124px;');
   s.push ('   margin-bottom:   -32px;');
   s.push ('   position:        relative;');
   s.push ('   z-index:         2;');
   s.push ('   cursor:          move;');
   s.push ('}');

   s.push ('.qwizzled_border_all {');
   s.push ('   border-width:    2px;');
   s.push ('}');

   s.push ('.qwizzled_border_left {');
   s.push ('   border-width:    2px 0px 2px 2px;');
   s.push ('}');

   s.push ('.qwizzled_border_right {');
   s.push ('   border-width:    2px 2px 2px 0px;');
   s.push ('}');

   s.push ('.qwizzled_border_center {');
   s.push ('   border-width:    2px 0px 2px 0px;');
   s.push ('}');

   s.push ('.qwizzled_border_class_red {');
   s.push ('   border-color:    red;');
   s.push ('}');

   s.push ('.qwizzled_border_class_magenta {');
   s.push ('   border-color:    magenta;');
   s.push ('}');

   s.push ('.qwizzled_border_class_blue {');
   s.push ('   border-color:    blue;');
   s.push ('}');

   s.push ('.qwizzled_border_class_aqua {');
   s.push ('   border-color:    aqua;');
   s.push ('}');

   s.push ('.qwizzled_border_class_dotted {');
   s.push ('   border-style:    dotted;');
   s.push ('}');

   s.push ('.qwizzled_border_class_dashed {');
   s.push ('   border-style:    dashed;');
   s.push ('}');

   s.push ('.qwizzled_border_class_solid {');
   s.push ('   border-style:    solid;');
   s.push ('}');

   s.push ('.qwizzled_border_class_width {');
   s.push ('   border-width:    2px;');
   s.push ('}');

   s.push ('</style>');

   s.push ('<link rel="stylesheet" href="' + qwizzled_plugin.url + 'jquery-ui.css">');

   $(s.join ('\n')).appendTo (edit_page_header);
}


// -----------------------------------------------------------------------------
// Create a target for a label -- part 1 -- set up to wait for click on label. 
this.create_target1 = function () {

   errmsgs = [];

   // If in text mode, message only.
   if (! $ (edit_area_selector).is (':visible')) {
      alert (T ('Please select "Visual" mode to create a target/drop zone'));
      return;
   }

   // If already waiting for click on label, do nothing (or somehow reiterate
   // instruction/feedback).
   // ...

   // Show spinner -- we're working on it!
   $ ('#create_target_spinner').css ('visibility', 'visible');

   setTimeout ('qwizzled.create_target2 ()', 100);
}


// -----------------------------------------------------------------------------
this.create_target2 = function () {

   // Preliminary check: Look for already-wrapped labels -- label divs --  and
   // make sure no new [l] shortcodes have been added inside.  If so, move out.
   edit_area.find ('.qwizzled_label').each (function () {
      var label_html = $ (this).html ();

      // Grab any opening tags that go with it.
      var r = parse_html_block (label_html, ['[l]'], []);
      var new_label_html = r.htm_block;
      if (new_label_html != 'NA') {

         if (debug[0]) {
            console.log ('[create_target2] new_label_html:', new_label_html);
         }

         // Remove new label from div html.
         label_html = label_html.replace (new_label_html, '');
         $ (this).html (label_html);

         // Add new label after.
         $ (this).after (new_label_html);
      }
   });

   // Grab current editor HTML content.
   var htm = edit_area.html ();
   if (debug[0]) {
      console.log ('[create_target2] htm: ', htm);
   }

   // Take out and save <xmp>...</xmp> code and comments.
   // ...

   // Want labels to be within [qwiz]...[/qwiz] pairs.  Make sure there is such
   // a pair.
   if (! check_qwiz_tag_pairs_ok (htm)) {

      // Hide spinner.
      $ ('#create_target_spinner').css ('visibility', 'hidden');

      return;
   }

   // See if there are labels.  Labels already wrapped in span element look
   // like [<code></code>l].  Get all labels between [qwiz]...[/qwiz] pairs.
   // If any labels not yet wrapped in an inline-block span element, do so.
   var qwiz_matches = htm.match (/\[qwiz[\s\S]*?\[\/qwiz\]/gm);
   if (! qwiz_matches) {
      report_errors ();
      return;
   }
   n_qwizzes = qwiz_matches.length;
   if (debug[0]) {
      console.log ('[create_target2] n_qwizzes: ', n_qwizzes);
   }

   // Loop over qwiz-tag pairs, and over [q] questions within pair.
   var no_q_code_b = true;
   var any_labeled_diagram_questions_b = false;
   var any_new_html_b = false;
   for (i_qwiz=0; i_qwiz<n_qwizzes; i_qwiz++) {

      // Find questions that have already been wrapped -- check that no
      // new [q] tags inside, find labels that haven't been wrapped, wrap 
      // them.
      var question_start_tags = ['<div class="qwizzled_question">'];
      var r = process_questions (qwiz_matches[i_qwiz], question_start_tags, true);
      var any_wrapped_question_has_labels_b = r.any_labels_b;
      var new_html = r.new_html;
      if (new_html) {
         any_new_html_b = true;
         htm = htm.replace (qwiz_matches[i_qwiz], new_html);
      }

      // Find questions that haven't been wrapped -- see if labels [l] inside,
      // along with associated feedback ([f*] and [fx]).  Wrap labels.  If no
      // feedback given, create empty (= use canned response) shortcodes.
      // html returned only if labels inside.
      question_start_tags = ['[q]', '[q '];
      r = process_questions (qwiz_matches[i_qwiz], question_start_tags, false);
      var any_notwrapped_question_has_labels_b = r.any_labels_b;
      new_html = r.new_html;
      if (new_html) {
         any_new_html_b = true;
         htm = htm.replace (qwiz_matches[i_qwiz], new_html);
      }

      if (any_wrapped_question_has_labels_b || any_notwrapped_question_has_labels_b) {
         any_labeled_diagram_questions_b = true;
      } else {

         // See if reason for no labeled diagrams is no [q] shortcodes.
         if (qwiz_matches[i_qwiz].search (/<div class="qwizzled_question|\[q[ \]]/m) != -1) {
            no_q_code_b = false;
         }
      }
   }

   if (! any_labeled_diagram_questions_b) {

      if (no_q_code_b) {
         alert (T ('Did not find any questions [q] within [qwiz]...[/qwiz] shortcode pairs'));
      } else {
         alert (T ('Did not find any labels [l] within [qwiz]...[/qwiz] shortcode pairs'));
      }

      // Hide spinner.
      $ ('#create_target_spinner').css ('visibility', 'hidden');

      return
   }

   if (any_new_html_b) {

      // Update displayed content.
      edit_area.html (htm);

      // Find paragraphs and headers within labels, wrap their inner html with 
      // highlight span if haven't already done so.
      edit_area.find ('*.qwizzled_label > p, :header').each (function () {
         var innerhtm = $ (this).html ();
         if (innerhtm.search ('qwizzled_highlight_label') == -1) {
            $ (this).html ('<span class="qwizzled_highlight_label qwizzled_highlight_label_border">' + innerhtm + '</span>');
         }
      });

      // Find targets.  Get rid of <br> that WordPress likes to put in.
      // DKTMP
      //edit_area.find ('div.qwizzled_target').html ('');
   }

   // For all images within qwizzled divs, ignore max-width set by WordPress.
   // User will have to resize smaller.  Take care of padding and border, too.
   var qwizzled_imgs_obj = edit_area.find ('div.qwizzled_question img');
   if (debug[0]) {
      console.log ('[create_target2] qwizzled_imgs_obj: ', qwizzled_imgs_obj);
      console.log ('                 length: ', qwizzled_imgs_obj.length);
   }
   qwizzled_imgs_obj.css ({'max-width': 'none', padding: '0px', border: '0px'});

   // Find any images inside labels -- set margins to zero.
   var label_imgs_obj = edit_area.find ('*.qwizzled_label img');
   if (debug[0]) {
      console.log ('[create_target2] label_imgs_obj: ', label_imgs_obj);
      console.log ('                 length: ', label_imgs_obj.length);
   }
   label_imgs_obj.css ({margin: '0px', padding: '0px'});

   // Make all labels clickable.
   edit_area.find ('.qwizzled_label').click (function () {
      parent.qwizzled.label_clicked (this); 
   });

   // Set flag that waiting for label to be clicked.
   waiting_for_label_click_b = true;

   // Provide instruction/feedback.
   var click_on_a_label =   'Click on a '
                          + '<span class="qwizzled_highlight_label_border" style="background: white;">'
                          +    'label'
                          + '</span>'
                          + '<img src="' + qwizzled_plugin.url + 'images/icon_exit_bw.jpg" class="click_on_a_label_exit" onclick="qwizzled.exit_click_on_a_label ()" />';

   // First cancel any previous action (fadeout of "You can position..."
   // instruction).  Set opacity back to 1.0 in case gets stuck.
   qwizzled_main_menu_feedback.stop ().html (click_on_a_label).show ().css ('opacity', '1.0');

   // Hide spinner -- we're ready.
   $ ('#create_target_spinner').css ('visibility', 'hidden');

   report_errors ();
};


// -----------------------------------------------------------------------------
this.exit_click_on_a_label = function () {

   qwizzled_main_menu_feedback.hide ();
   waiting_for_label_click_b = false;
}

// -----------------------------------------------------------------------------
// Create a target for a label -- part 2 -- clicked on label.  Check that
// waiting for a click, check if this label already has a target, prompt user to
// select a target.
this.label_clicked = function (local_el_label_div) {

   // Ignore if haven't clicked menu item.  (Flag set in create_target2 ()).
   if (! waiting_for_label_click_b) {
      return false;
   }

   // Save label span element object in global variable.
   el_label_div = local_el_label_div;
   if (debug[0]) {
      console.log ('[label_clicked] el_label_div:', el_label_div);
   }

   waiting_for_label_click_b = false;
   qwizzled_main_menu_feedback.hide ();

   // Zero the margins of any images in this label.
   $ (el_label_div).find ('img').css ({margin: '0px', padding: '0px'});

   // Find question div that is parent of this label.
   qwizzled_question_obj = $ (el_label_div).parents ('.qwizzled_question');

   // Does this label have a target already?  label_border_class will signal
   // new target for existing label.
   var create_target_b = true;
   label_border_class = '';
   var classes = $ (el_label_div).attr ('class');
   var m = classes.match (/qtarget_assoc([0-9]*)/);
   if (m) { 
      assoc_id = m[1];
   } else {
      assoc_id = '';
   }
   if (assoc_id) {

      // Yes.  See if user wants to replace target.
      if (confirm ('This label already has a target.\nDo you want to replace the existing target?')) {

         // Get the association number.
         var m = classes.match (/qtarget_assoc([0-9]*)/);
         assoc_id = m[1];
         if (debug[0]) {
            console.log ('[label_clicked] classes:', classes, ', assoc_id:', assoc_id);
         }

         // If it's a div -- a rectangle on an image -- delete it.  If it's a
         // span or spans, replace the <span> with its content.
         var div_span_obj = qwizzled_question_obj.find ('.qwizzled_target-' + assoc_id);
         if (div_span_obj[0].tagName == 'div') {
            div_span_obj.remove ();
         } else {
            div_span_obj.each (function () {
               $ (this).replaceWith ($ (this).html ());
            });
         }

         // Get the label's current border colors/style classes -- re-use for new
         // target.
         var label_class = $ (el_label_div).find ('.qwizzled_highlight_label').attr ('class');
         if (debug[0]) {
            console.log ('[label_clicked] label_class:', label_class);
         }
         var m = label_class.match (/qwizzled_border_class_[a-z]*/g);
         if (m) {
            label_border_class = m.join (' ');
         }
      } else {
         create_target_b = false;
      }
   }
   if (create_target_b) {

      // Prompt to select target.
      qwizzled_main_menu_feedback.html (T ('Select the text or click on the image (you may have to click twice) where you want the target "drop zone" for this label')).show ();

      // Wait for selection.
      waiting_for_target_select_b = true;

      // Selecting text within question div will involve mouseup, which we can
      // process.  First turn off any previous event handler (just want to 
      // do function call once!).
      qwizzled_question_obj.off ('mouseup', q.target_text_selected);
      qwizzled_question_obj.on ('mouseup', q.target_text_selected);
   }
}


// -----------------------------------------------------------------------------
this.target_text_selected = function (e) {

   var selected_text = tinymce_ed.selection.getContent ();
   var node = tinymce_ed.selection.getNode ();
   var node_obj = $ (node);
   var node_obj_offset = node_obj.offset ();
   var target_left = e.clientX - node_obj_offset.left;
   var target_top  = e.clientY - node_obj_offset.top;
   if (debug[0]) {
      console.log ('[target_text_selected] selected_text: ' + selected_text);
      console.log ('[target_text_selected] node_obj:', node_obj);
      console.log ('target_left:', target_left, 'target_top:', target_top);
   }

   // Ignore if just a click.
   if (! selected_text) {
      return;
   }

   // Turn off further selects.
   qwizzled_question_obj.off ('mouseup', q.target_text_selected);

   if (! waiting_for_target_select_b) {
      return false;
   }
   waiting_for_target_select_b = false;

   // If doesn't exist, create association ID between label and target.  Use
   // time (in seconds) as unique ID.  We'll also use it to identify image
   // wrapper.
   if (! assoc_id) {
      var now = new Date ();
      var now_millisec = now.getTime ();
      assoc_id = parseInt( now_millisec / 1000.0 );
   }

   // Pick border color and style for this label-target pair.  Count how many
   // labels in this question already associated with a target.  Don't do if
   // re-using current label border (new target for existing label).
   if (label_border_class == '') {
      var labels_w_targets = qwizzled_question_obj.find ('div.qwizzled_label[class*="qtarget_assoc"]');
      var n_labels_w_targets = labels_w_targets.length;
      if (debug[0]) {
         console.log ('n_labels_w_targets:', n_labels_w_targets);
      }
      var i_bstyle = parseInt (n_labels_w_targets / bcolors.length);
      var bstyle = bstyles[i_bstyle];
      var i_bcolor = n_labels_w_targets % bcolors.length;
      var bcolor = bcolors[i_bcolor];
   }

   // See if an image and only an image.
   var img_txt = selected_text.match (/<img.*?>/m);
   var slen = selected_text.length;
   if (img_txt && img_txt[0].length == slen) {

      // Yes, image.
      if (debug[0]) {
         console.log ('node tagName:', node_obj[0].tagName);
         //console.log ('parent html:', node_obj.parent ().html ());
         console.log ('parent tagName:', node_obj.parent ()[0].tagName);
         //console.log ('parent parent html:', node_obj.parent ().parent ().html ());
         console.log ('parent parent tagName:', node_obj.parent ().parent ()[0].tagName);
      }

      // If images already wrapped, add target to that div.  Element from
      // TinyMCE, use jQuery to get parent.
      var el_img = tinymce_ed.selection.getNode ();
      var img_wrapper = '';
      if ($ (el_img).parents ().hasClass ('qwizzled_image')) {
         img_wrapper = $ (el_img).parents ('[class*="qwizzled_image"]');
         n_labels_w_targets--;
         if (debug[0]) {
            console.log ('Found img_wrapper:', img_wrapper);
         }
      }
      var caption_b = false;
      if (img_wrapper == '') {

         // Won't work with captions.  Alert to delete caption and try again.
         parent_parent_tagname = node_obj.parent ().parent ()[0].tagName;
         caption_b = parent_parent_tagname == 'DT';
         if (caption_b) {
            alert (T ('Sorry, labeled diagrams do not work with images that have captions.  Please edit the image, delete the caption, and try again.'));

            // Cancel feedback.
            qwizzled_main_menu_feedback.hide ();
         } else {

            // Create wrapper.  First collect attributes from image (that is,
            // everything except "<img " and "/>").
            var img_attributes = selected_text.substr (5, slen-7);

            // Wrap image in div with image's attributes, but transfer height= and
            // width= to style of wrapping div, then delete id=, src=, alt=, 
            // height=, and width=.  Set the margins to zero, since the
            // image's class's margins will take care of that (and don't want to
            // double them), but keep auto margins if aligncenter WordPress class.
            // First grab height and width.
            var m = img_attributes.match (/height\s*=\s*"(.*?)"/m);
            var img_size_style = '';
            if (m) {
               img_size_style += 'height: ' + m[1] + 'px; ';
            }
            m = img_attributes.match (/width\s*=\s*"(.*?)"/m);
            if (m) {
               img_size_style += 'width: ' + m[1] + 'px; ';
            }
            var img_wrapper_attributes = img_attributes.replace (/(id|src|alt|width|height)\s*=\s*".*?"/gm, '');

            // Just use assoc_id to create unique id -- used below as selector
            // for jQuery find.
            var img_wrapper_id = 'id="qwizzled_img_wrapper-' + assoc_id + '" ';
            var img_wrapper_style = ' style="position: relative; ' + img_size_style;
            if (img_attributes.search ('aligncenter') == -1) {
               img_wrapper_style += 'margin: 0px;';
            } else {
               img_wrapper_style += 'margin: 0px auto;';
            }
            img_wrapper_style += '" ';

            // TinyMCE has style that adds padding to image, but this isn't present
            // in page display.  Add style to set padding to zero.  Editor also puts
            // border around image.  Nix that, too.
            //img_attributes = add_attr_value ('style', 'padding: 0px; border: none; ', img_attributes);

            // Take away alignleft, aligncenter, etc.  Messes things up when
            // display page.
            img_attributes = img_attributes.replace (/align(left|center|right|none)/m, '');

            // Add class or to class.
            var new_txt = '<div ' + img_wrapper_id + img_wrapper_style + img_wrapper_attributes + '><img ' + img_attributes + ' /></div>';
            new_txt = add_attr_value ('class', 'qwizzled_image', new_txt);
            if (debug[0]) {
               console.log ('[target_text_selected] new_txt: ' + new_txt);
            }

            // Note: observed setups include
            //   <p>                            <p>
            //      <a> href=...>                  Paragraph text...
            //         <img ...>                   <a href=...>
            //      </a>                              <img ...>
            //      <br data-mce-bogus=1>          </a>
            //   </p>                              more paragraph text...
            //                                  </p>
            //
            //  A div can't live inside a paragraph, so when wrap img in a div,
            //  move the div in front of the paragraph.  If paragraph otherwise
            //  empty, delete.  Note also that el_img (selected text via TinyMCE
            //  is just the <img ...> element.

            // Identify <a href=...> link, if there.
            var img_href = '';
            var link_obj = $ (el_img).parent ('a');
            if (link_obj.length) {
               img_href = link_obj.attr ('href');
               if (debug[0]) {
                  console.log ('[target_text_selected] img_href:', img_href);
               }
            }

            // If image was inside a paragraph, want to move it in front of 
            // paragraph.  Otherwise, just use TinyMCE to replace image with
            // wrapper that includes image.
            var p_obj = $ (el_img).parents ('p');
            if (p_obj.length) {

               // Yes, paragraph parent exists.  Insert wrapping div and img
               // in front of the paragraph, delete existing image with TinyMCE.
               p_obj.before (new_txt);
               tinymce_ed.selection.setContent ('');
               if (debug[0]) {
                  console.log ('inserted wrapper before p_obj:', p_obj);
                  console.log ('p_obj.html ():', p_obj.html ());
               }

            } else {
               tinymce_ed.selection.setContent (new_txt);
            }

            // Use jQuery to get wrapper object.
            img_wrapper = edit_area.find ('#qwizzled_img_wrapper-' + assoc_id);

            // If image link, check that it's now empty.  If parent is <p>,
            // see if just image link and "data-mce-bogus" element.  If so, delete
            // paragraph.
            if (img_href) {
               link_obj = edit_area.find ('a[href="' + img_href + '"]');
               if (link_obj.length) {
                  if (debug[0]) {
                     console.log ('[target_text_selected] link_obj.html():', link_obj.html());
                  }
                  var link_html = link_obj.html ();
                  if (link_html.search (/\S/) == -1) {
                     p_obj = link_obj.parents ('p');
                     if (p_obj.length) {
                        link_obj.remove ();
                        edit_area.find ('[data-mce-bogus]').remove ();
                        var p_html = p_obj.html ();
                        if (debug[0]) {
                           console.log ('[target_text_selected] p_html:', p_html);
                        }
                        if (p_html.search (/\S/) == -1) {
                           p_obj.remove ();
                        }
                     }
                  }
               }
            }
            if (debug[0]) {
               console.log ('[target_text_selected] updated edit_area html:', edit_area.html ());
            }
         }
      }
      if (! caption_b) {

         // Save association with target ID with label.  Use a class to avoid
         // editors that eat the data-... attribute.  Also, set label border
         // same as associated target border.
         $ (el_label_div).addClass ('qtarget_assoc' + assoc_id);
         if (label_border_class == '') {
            if ($ (el_label_div).hasClass ('qwizzled_highlight_label')) {
               $ (el_label_div).removeClass ('qwizzled_highlight_label_border').addClass ('qwizzled_border_class_' + bcolor + ' qwizzled_border_class_' + bstyle + ' qwizzled_border_class_width');
            } else {
               $ (el_label_div).find ('.qwizzled_highlight_label').removeClass ('qwizzled_highlight_label_border').addClass ('qwizzled_border_class_' + bcolor + ' qwizzled_border_class_' + bstyle + ' qwizzled_border_class_width');
            }
         }

         // Add target to span.  Position the target where clicked.
         // clientX and Y are relative to document -- body in iframe in this case.
         // node_obj is our image, with jQuery offset () also relative to body in
         // iframe.  So subtraction should give us click position in image.
         if (debug[0]) {
            console.log ('[target_text_selected] e.clientX:', e.clientX, ', e.clientY:', e.clientY);
         }
         var style = 'left: ' + target_left + 'px; top: ' + target_top + 'px;';

         // Target height and width set in add_style_edit_area ().  Give target
         // classes for border to match label border.
         if (! label_border_class) {
            label_border_class = 'qwizzled_border_class_' + bstyle + ' qwizzled_border_class_' + bcolor + ' qwizzled_border_class_width';
         }

         // Create target, include association ID.  Prepend it to wrapper content.
         var target_html = '<div class="qwizzled_target-' + assoc_id + ' qwizzled_target ' + label_border_class + '" style="' + style + '"></div>';
         img_wrapper.prepend (target_html);

         // Make target draggable, resizable.
         var target_obj = edit_area.find ('.qwizzled_target-' + assoc_id);
         target_obj.draggable ();
         target_obj.resizable ({
            resize: function (e, ui_obj) {

               // Set the left and bottom margins of the target div to offset the 
               // (resized) width and height of the div (kludge to enable use of
               // relative positioning rather than absolute, which gets extra
               // "drag handle" in Firefox).
               $ (this).css ({'margin-right': -(ui_obj.size.width + horizontal_margin_adjust) + 'px', 'margin-bottom': -(ui_obj.size.height + vertical_margin_adjust) + 'px'});
            }
         });

         // Provide instruction/feedback.
         qwizzled_main_menu_feedback.html (T ('You can position and resize the target "drop zone" how you want in relation to the image.')).show ().fadeOut (10000, 'easeInCubic');
      }
   } else {

      // Not just an image.  Regular text; but may include an image.
      // Wrap selected text in span or spans.  If selection is (parts of) more
      // than one paragraph, need separate spans.
      if (label_border_class == '') {
         label_border_class = 'qwizzled_border_class_' + bstyle + ' qwizzled_border_class_' + bcolor;
      }
      var new_txt = create_text_target (selected_text, assoc_id, label_border_class);
      tinymce_ed.selection.setContent (new_txt);

      // Save association with target ID with label.  Use class to avoid editors
      // editors that eat the data-... attribute.  Also, set label border same as
      // associated target border.
      $ (el_label_div).addClass ('qtarget_assoc' + assoc_id);
      $ (el_label_div).find ('.qwizzled_highlight_label').removeClass ('qwizzled_highlight_label_border').addClass (label_border_class + ' qwizzled_border_class_width');

      // Cancel feedback.
      qwizzled_main_menu_feedback.hide ();
   }
}


// -----------------------------------------------------------------------------
function create_text_target (htm, assoc_id, border_class) {

   // Parse into tags and text.
   var t = parse_tags_text (htm);
   var tokens = t.tokens;
   var token_types = t.token_types;

   // Enclose each bit of plain text in <span>.  First and last text tokens
   // get "left" and "right" class.  Find first and last text tokens.
   var n_tokens = tokens.length;
   var i_first = -1;
   var i_last  = -1;
   var n_texts = 0;
   for (var i=0; i<n_tokens; i++) {
      if (token_types[i] != 'tag') {
         n_texts++;
         if (i_first == -1) {
            i_first = i;
         }
         i_last = i;
      }
   }

   // Be sure not to include width class from border_class -- widths set by
   // classes added here.
   border_class = border_class.replace ('qwizzled_border_class_width', '');
   var common = '<span class="qwizzled_target-' + assoc_id + ' qwizzled_target ';
   if (n_texts == 0) {
      alert (T ('Error: no text selected.'));
   } else if (n_texts == 1) {
      tokens[i_first] = common + 'qwizzled_border_all '       + border_class + '">' + tokens[i_first] + '</span>';
   } else if (n_texts >= 2) {
      tokens[i_first] = common + 'qwizzled_border_left '      + border_class + '">' + tokens[i_first] + '</span>';
      tokens[i_last]  = common + 'qwizzled_border_right '     + border_class + '">' + tokens[i_last]  + '</span>';
      for (var i=i_first+1; i<i_last; i++) {
         if (token_types[i] != 'tag') {

            // Leave all-whitespace text alone, but replace with TinyMCE
            // empty-line indicator (apparently).
            if (tokens[i].search (/\S/) == -1) {
               tokens[i] = '<br data-mce-bogus="1">';
            } else {
               tokens[i]    = common + 'qwizzled_border_center ' + border_class + '">' + tokens[i]  + '</span>';
            }
         }
      }
   }

   // Reassemble.
   htm = tokens.join ('');
   if (debug[0]) {
      console.log ('[create_text_target] i_first, i_last, n_texts:', i_first, i_last, n_texts);
      console.log ('[create_text_target] htm:', htm);
   }

   return htm;
}


// -----------------------------------------------------------------------------
function parse_tags_text (htm) {

   var tokens = [''];
   var token_types = [''];
   var i_token = 0;
   var len = htm.length;
   for (var i=0; i<len; i++) {
      if (htm[i] == '<') {
         if (tokens[i_token] == '') {
            tokens[i_token] = '<';
            token_types[i_token] = 'tag';
         } else {
            tokens.push ('<');
            token_types.push ('tag');
            i_token++;
         }
      } else if (htm[i] == '>') {
         tokens[i_token] += '>';
         tokens.push ('');
         token_types.push ('');
         i_token++;
      } else {

         // Add to token.
         tokens[i_token] += htm[i];
      }
   }

   // Remove empty non-tag tokens.
   var new_tokens = [];
   var new_token_types = [];
   var n_tokens = tokens.length;
   for (var i=0; i<n_tokens; i++) {
      if (token_types[i] == 'tag' || tokens[i] != '') {
         new_tokens.push (tokens[i]);
         new_token_types.push (token_types[i]);
      }
   }

   if (debug[0]) {
      console.log ('[parse_tags_text] new_tokens:', new_tokens);
   }

   return {'tokens': new_tokens, 'token_types': new_token_types}
}


// -----------------------------------------------------------------------------
// Add a value to an attribute, if attribute there already, or add attribute
// and value.
function add_attr_value (attr, value, attributes) {
   var re = new RegExp (attr + '\\s*=\\s*["\']', 'im');
   var m = attributes.match (re);
   if (m) {

      // Add only if particular value not already there.
      if (attributes.search (value) == -1) {
         attributes = attributes.replace (re, m[0] + value + ' ');
      }
   } else {
      attributes += ' ' + attr + '="' + value + '"';
   }
   if (debug[0]) {
      console.log ('[add_attr_value] attributes:', attributes);
   }

   return attributes;
}


// -----------------------------------------------------------------------------
// Look for questions in qwiz html.  Do for each question.  find_wrapped_b is
// true if question start tag is "<div ...".
function process_questions (qwiz_html, question_start_tags, find_wrapped_b) {

   var question_next_tags  = ['[q]', '[q ', '<div class="qwizzled_question">', '[x]', '[/qwiz]'];

   var any_new_html_b = false;
   var any_labels_b   = false;

   // Don't revisit questions (in case no new html).
   var ipos = 0;
   var new_qwiz_html = qwiz_html;
   while (true) {

      // Get html up to next question, including labels, feedback, and hints.
      // Question before first label may already be wrapped in "canvas" div.
      var rqwiz = parse_html_block (qwiz_html.substr (ipos), question_start_tags,
                                    question_next_tags);
      var question_html = rqwiz.htm_block;
      if (question_html == 'NA') {
         break;
      }

      var new_question_html = question_html;
      if (find_wrapped_b) {

         // Make sure nothing extraneous (label, feedback, etc.) inside "canvas"
         // div, if there.  To check that no new '[q]' inside div, have to make
         // sure it closes properly.
         // DKTMP.
         // ...
      } else {

         // Create canvas div -- up to first label if or feedback shortcode or
         // hint if one of these present, otherwise everything.
         var label_pos = new_question_html.search (/\[l\]|\[f*\]|\[fx\]|\[hint\]/m);
         var label_etc_start_tags = ['[l]', '[f*]', '[fx]', '[hint]'];
         var r = parse_html_block (new_question_html, question_start_tags, label_etc_start_tags);
         var canvas_div_content = r.htm_block;
         if (debug[0]) {
            console.log ('[process_questions] canvas_div_content:', canvas_div_content);
         }

         // Include clear div in case any images.
         var canvas_div = '<div class="qwizzled_canvas">'
                          + canvas_div_content.replace (/\[q/, '[<code><\/code>q')
                          + '<div style="clear: both;"></div>'
                          + '</div>';
         new_question_html = new_question_html.replace (canvas_div_content, canvas_div);
         if (debug[0]) {
            console.log ('[process_questions] new_question_html:', new_question_html);
         }
      }

      // Look for already-wrapped labels in this question.
      // "[", "]", "*" normally escaped (so can match "[c*]", for example).
      // "{" translated to "[", "}" to "]", "#" to "*".
      var label_start_tags = ['<div{^>}#?class\\s#=\\s#"{^"}#?qwizzled_label'];
      var r = process_labels (new_question_html, label_start_tags, true);
      var any_wrapped_labels_b = r.any_labels_b;
      var new_new_question_html = r.new_html;
      if (new_new_question_html) {

         // Since we found wrapped labels, must be case that question already
         // wrapped.
         any_new_html_b = true;
         new_qwiz_html = new_qwiz_html.replace (question_html, new_new_question_html);
      }

      // Look for not-yet-wrapped labels in this question.  If not followed by
      // [f*] and [fx], add shortcodes and canned responses after wrap.
      label_start_tags = ['[l]'];
      var r = process_labels (new_question_html, label_start_tags, false);
      var any_notwrapped_labels_b = r.any_labels_b;
      var new_new_question_html = r.new_html;
      if (new_new_question_html) {
         any_new_html_b = true;

         // Add wrapper for question only if not wrapped already.  Include div
         // at bottom for title for div bottom border.
         if (! find_wrapped_b) {
            new_new_question_html =   '<div class="qwizzled_question">'
                                    +    new_new_question_html 
                                    +    '<div class="qwizzled_question_bottom_border_title" title="' + T ('End of labeled-diagram question') +'">'
                                    +    '</div>'
                                    + '</div>';
         }
         new_qwiz_html = new_qwiz_html.replace (question_html, new_new_question_html);
         if (debug[0]) {
            console.log ('[process_questions] new_qwiz_html: ', new_qwiz_html);
         }
      }

      // Skip visited.
      ipos += rqwiz.htm_index + question_html.length;

      if (any_wrapped_labels_b || any_notwrapped_labels_b) {
         any_labels_b = true;
      }
   }

   if (! any_new_html_b) {
      new_qwiz_html = '';
   }

   if (debug[0]) {
      console.log ('[process_questions] any_labels_b: ', any_labels_b, ', new_qwiz_html: ', new_qwiz_html);
   }

   return {'any_labels_b': any_labels_b, 'new_html': new_qwiz_html};
}


// -----------------------------------------------------------------------------
function process_labels (question_html, label_start_tags, find_wrapped_b) {

   // Get everything up to next label -- will process/parse out feedback
   // associated with each label, if any.
   var label_next_tags  = ['[l]', '[x]]',
                           '<div{^>}#?class\\s#=\\s#"{^"}#?qwizzled_label'];
   var feedback_start_tags = ['[f*]', '[fx]'];
   var feedback_next_tags = ['[l]', '[f*]', '[fx]', '[hint]', '[x]'];

   // Look for labels in question html.  Do for each [l] found.
   var any_new_html_b = false;
   var any_labels_b = false;

   // Skip visited -- in case no change.
   var ipos = 0;
   var new_question_html = question_html;
   while (true) {
      var r = parse_html_block (question_html.substr (ipos), label_start_tags,
                                label_next_tags);
      var label_html = r.htm_block;
      if (label_html == 'NA') {
         break;
      }

      // Process label only if not all whitespace.
      if (! is_only_tags_and_whitespace (label_html)) {
         any_labels_b = true;
         if (! find_wrapped_b) {
            any_new_html_b = true;
            var new_label_html = label_html.replace (/\[l\]/, '[<code><\/code>l]');
            if (debug[0]) {
               console.log ('[process_labels] new_label_html:', new_label_html);
            }

            // Not yet wrapped, so see if feedback present within the label.
            var feedback_htmls = [];
            while (true) {
               var rf = parse_html_block (new_label_html, feedback_start_tags, 
                                          feedback_next_tags);
               var feedback_html = rf.htm_block;
               if (feedback_html == 'NA') {
                  break;
               }

               // Take feedback out of label.  If feedback is empty, ignore --
               // will create feedback with canned response.  Otherwise, save.
               new_label_html = new_label_html.replace (feedback_html, '');
               if (debug[0]) {
                  console.log ('[process_labels] feedback_html:', feedback_html);
                  console.log ('[process_labels] new_label_html:', new_label_html);
               }
               if (! is_only_tags_and_whitespace (feedback_html.replace (/\[f[\*x]\]/, ''))) {
                  feedback_htmls.push (feedback_html);
               }
            }

            // Div for labels (not span: somebody eats spans around <p> elements).
            // Add highlight class to div only if there are no paragraph or header
            // tags inside.  Also, when no paragraph or header tags, make div
            // inline.
            var highlight = '';
            var style     = '';
            var ph_pos = new_label_html.search (/<p|<h[1-6]/m);
            if (ph_pos == -1) {
               highlight = ' qwizzled_highlight_label';
               style     = ' style="display: inline;"';
            }
            new_label_html = '<div class="qwizzled_label' + highlight + '"' + style + '>' + new_label_html + '</div>'; 

            // Now check feedback for this label.
            var fc_b = false;
            var fx_b = false;
            var f_len = feedback_htmls.length;
            if (f_len > 2) {
               errmsgs.push (T ('Too many feedback shortcodes'));
            }
            for (var i=0; i<f_len; i++) {
               if (feedback_htmls[i].search (/\[fx\]/) != -1) {
                  fx_b = true;
               } else {
                  fc_b = true;
               }
            }
            if (debug[0]) {
               console.log ('[process_labels] fx_b:', fx_b, ', fc_b:', fc_b);
            }
            if (! fx_b) {
               feedback_htmls.push (canned_feedback (false));
            }
            if (! fc_b) {
               feedback_htmls.push (canned_feedback (true));
            }
            if (debug[0]) {
               console.log ('[process_labels] feedback_htmls:', feedback_htmls.join ('\n'));
            }
            new_label_html += feedback_htmls.join ('\n');
            new_question_html = new_question_html.replace (label_html, new_label_html);
         }
      }

      // Skip visited.
      ipos += r.htm_index + label_html.length;
   }

   if (! any_new_html_b) {
      new_question_html = '';
   }

   if (debug[0]) {
      console.log ('[process_labels] any_labels_b: ', any_labels_b);
      console.log ('[process_labels] new_question_html: ', new_question_html);
   }

   return {'any_labels_b': any_labels_b, 'new_html': new_question_html};
}


var correct = ['Good!', 'Correct!', 'Excellent!', 'Great!'];
var incorrect = ['No.', 'No, that&rsquo;s not correct.'];
// -----------------------------------------------------------------------------
function canned_feedback (correct_b) {

   var response;
   if (correct_b) {
      var i = Math.floor (Math.random () * correct.length);
      response = '[f*] ' + correct[i];
   } else {
      var i = Math.floor (Math.random () * incorrect.length);
      response = '[fx] ' + incorrect[i] + '&nbsp; Please try again.';
   }
   response = '<p style="font-weight: bold;">' + response + '</p>';

   if (debug[0]) {
      console.log ('[canned_feedback] response:', response);
   }
   return response;
}


// -----------------------------------------------------------------------------
function check_qwiz_tag_pairs_ok (htm) {

   var error_b = false;

   // Match "[qwiz]" or "[/qwiz]".
   var matches = htm.match (/\[qwiz|\[\/qwiz\]/gm);
   if (matches) {
      var n_tags = matches.length;
      if (n_tags == 0) {
         alert (T ('Did not find [qwiz]...[/qwiz] shortcodes'));
         error_b = true;
      } else {

         if (n_tags % 2 != 0) {
            error_b = true;
         } else {

            // Check proper pairs.
            for (var i=0; i<n_tags; i++) {
               var tag = matches[i];
               if (i % 2 == 0) {
                  if (matches[i] != '[qwiz') {
                     error_b = true;
                     break;
                  }
               } else {
                  if (matches[i] != '[/qwiz]') {
                     error_b = true;
                     break;
                  }
               }
            }
         }
         if (error_b){
            alert (  T ('Unmatched [qwiz] - [/qwiz] pairs.')  + '  '
                   + T ('Please fix and try again.'));
         }
      }
   } else {
      alert (  T ('Did not find [qwiz]...[/qwiz] shortcodes') + '  '
             + T ('Please fix and try again.'));
   }

   return ! error_b;
}


// -----------------------------------------------------------------------------
function report_errors () {

   // Error messages, if any.
   if (errmsgs.length) {
      alert (plural ('Error found', 'Errors found', errmsgs.length) + ':\n\n' + errmsgs.join ('\n'));
   }
}


// -----------------------------------------------------------------------------
function tags_to_pat (tags) {
   var tags_pat = '(' + tags.join (')|(') + ')';
   tags_pat = tags_pat.replace (/([\[\]\*])/g, '\\$1');
   tags_pat = tags_pat.replace (/{/g, '[').replace (/}/g, ']').replace (/#/g, '*');
   tags_pat = '((' + tags_pat + ')\\s*)';
   
   return tags_pat;
}


// -----------------------------------------------------------------------------
// Parse out block of html -- from opening tags, through one of qwiz/qcard
// "shortcodes" up to any opening tags of next qwiz/qcard tags.
function parse_html_block (htm, qtags, qnext_tags) {
   if (debug[0]) {
      console.log ('[parse_html_block] qtags: ', qtags, ', htm: ', htm);
   }

   // Add a default "end" shortcode that will always be found.
   var ZendZ = '[ZendZ]';
   htm += ZendZ;
   qnext_tags.push (ZendZ);

   // Include opening tags before the qwiz/qcard tags in each case
   // -- a series of opening tags with possible whitespace in between, but
   // nothing else.
   var opening_pat = '(\\s*(<[^/][^>]*?>\\s*)*?)'; 

   var tags_pat = opening_pat + tags_to_pat (qtags);
   var next_tags_pat = opening_pat + tags_to_pat (qnext_tags);

   var re_txt = 

         '([\\s\\S]*?)'      // $1 Anything, up to...
       + '('                 // $2
       +   tags_pat          // $3 ... $4 opening tags, if any, followed by
                             // $(4 + n_qtags + 0 ... 2) opening shortcode
       +   '([\\s\\S]*?)'    // $(4 + n_qtags + 3) Anything (text after shortcode)
       + ')'                 // followed by
       + next_tags_pat;      // $(4 + n_qtags + 4 ... 5) opening tags, if any
                             // followed by 
                             // $(4 + n_qtags + 5 + 0 ... 2) next shortcode
   var re = new RegExp (re_txt, 'im');
   var htm_match = htm.match (re);
   var htm_block = '';
   var closing_tags = '';
   var htm_index = -1;
   if (htm_match) {
      htm_block = htm_match[2];

      // Take off default end shortcode if was found.
      htm_block = htm_block.replace (ZendZ, '');
      htm_index = htm.search (tags_pat);
   } else {

      // Didn't find tag-closing tag combo.
      htm_block = 'NA';
   }
   if (debug[0]) {
      console.log ('[parse_html_block] htm_block: ', htm_block);
   }

   return {'htm_block': htm_block, 'htm_index': htm_index};
}


// -----------------------------------------------------------------------------
function is_only_tags_and_whitespace (htm) {

   var htm_wo_tags = htm.replace (/<[^>]+>/gm, '');
   var only_tags_and_whitespace_b = htm_wo_tags.search (/\S/) == -1;

   return only_tags_and_whitespace_b;
}


var number_word = [T ('zero'), T ('one'), T ('two'), T ('three'), T ('four'), T ('five'), T ('six'), T ('seven'), T ('eight'), T ('nine'), T ('ten')];
// -----------------------------------------------------------------------------
function number_to_word (number) {
   var word;
   if (number > 9) {
      word = number;
   } else {
      word = number_word[number];
   }

   return word;
}


// -----------------------------------------------------------------------------
function plural (word, plural_word, n) {
   var new_word;
   if (n == 1) {
      new_word = word;
   } else {
      new_word = plural_word;
   }

   return T (new_word);
}


// -----------------------------------------------------------------------------
function T (string) {

   var t_string = tinymce.translate (string);

   return t_string;
}


// -----------------------------------------------------------------------------
// IE 8 does not have trim () method for strings.
function trim (s) {
   if ('a'.trim) {
      s = s.trim ();
   } else {
      s = s.replace (/^\s+|\s+$/g, '');
   }

   return s;
}


// =============================================================================
// Close - isolate namespace.
};


// -----------------------------------------------------------------------------
qwizzledf.call (qwizzled);


