/*
 * Version 2.29 2015-02-??
 * Word-wrap normal for labels (problem in Firefox on Mac).
 * Don't use <code></code> for already-wrapped [q] and [l].
 * Fix bug -- hint required matching first character.
 *
 * Version 2.28 2015-02-03
 * Hide Qwiz icon when autocomplete starts.
 * Remove resizing handles (because now have images that would show).
 * random="true" option for quizzes.
 * Free-form input ([textentry]) with suggestions/hints.
 *
 * Version 2.27 2015-01-05
 * Toolbar option - keep "next" button active.
 * Just count targets, not labels.
 * Feedback interleaved with choices, optional.
 *
 * Version 2.26 2014-12-21
 * Look for WP content filter-created divs, rewrite only that HTML.
 * Take xqwiz sizing div out of flow.
 *
 * Version 2.25 2014-12-16
 * Fix search for any [qwiz] shortcode.
 *
 * Version 2.24 2014-12-15
 * Make $ (= jQuery) private.
 *
 * Version 2.22 2014-12-07
 * Multiple targets for a single label.
 * Tolerate whitespace before [h].
 * Fix check for paragraph with header plus something else -- don't delete.
 * Reinstate containment for labels -- by table size.
 * qtarget_sibs-... instead of text_target_wrapper (except for backwards compatibility).
 * Don't allow draggable labels to be "underneath" already-placed labels.
 *
 * Version 2.21 2014-12-02
 * Workaround for Firefox 33.1 problem with long regular expression and long
 * string in intro parse.
 *
 * Version 2.20 2014-11-20
 * Handle "smart quotes" in attributes.
 *
 * Version 2.19 2014-11-19
 * Add "Q #1/4" to labeled diagram progress.
 *
 * Version 2.16 2014-11-12
 * Delete <br> in header.
 *
 * Version 2.15 2014-11-09
 * Nicer qwiz icon, hover effect.  Hide icon with flip.
 * Ignore empty paragraphs when no [i]: handle multiple paragraphs.
 * Fix choice highlighting when multiple choices within one paragraph.
 * Handle left- and right-double-quotes in labels="top", etc.
 *
 * Version 2.14 2014-11-04
 * Restore missing double quote -- couldn't split on labeled diagrams.
 *
 * Version 2.12 2014-11-03
 * Distinguish qwiz from qdeck in hiding icon.
 * Feedback padding - don't overlap icon.
 *
 * Version 2.11 2014-11-03
 * New classes for labeled-diagram target/label borders (avoid "flash").
 * Ignore empty paragraphs (with "&nbsp;") in intro without "[i]".
 * Qwiz icon/link on intro or first question only.
 * If labeled diagram is wide, reset qwiz div/borders to match.
 * 'div.container' as content option.
 * Use class "qtarget_assocNNN..." instead of data-...; some implementations
 * eat data-...
 *
 * Version 2.10 2014-10-28
 * Fix topic= for labeled diagram questions.
 * Add labels="top", etc. options for labeled diagram questions.
 *
 * Version 2.09 2014-10-05
 * Fix "Mode" not showing after labeled diagram.
 * Labeled diagram not "correct" until labels placed correctly on first try.
 * A few more strings for internationalization.
 *
 * Version 2.08 2014-10-05
 * Add internationalization - use .po and .mo files.
 * Add div.post-entry as page content location.
 *
 * Version 2.07 2014-10-01
 * Suppress errors, delete source in page/post excerpts.
 *
 * Version 2.06 2014-09-30
 * Bug fix - lost "next" button.
 *
 * Version 2.05 2014-09-29
 * Apply gray-out to label children, too (overwrite specific settings).
 *
 * Version 2.04 2014-09-29
 * Labels list vertical-align top.
 * Fix label placement progress when multiple quizzes.
 * -webkit-user-select none - improves Android Chrome drag.
 * [qwizdemo] tags.
 *
 * Version 2.03 2014-09-26
 * Vertical-center labels in targets.
 *
 * Version 2.02 2014-09-21
 * Re-initialize diagrams (to clone of orig) on restart.
 * Restart button correct in sinqle-question labeled diagram.
 *
 * Version 2.01 2014-09-16
 * Fix highlighting of choices when no intro.
 * If question with only one choice, "Show the answer" button, not radio. 
 *
 * Version 2.00 2014-09-14
 * "Took n tries" feedback on labeled diagram.
 * Border around labels; labels bulleted.
 *
 * Version 1.1b05 2014-09-12
 * Make WordPress consistent in use of standard box-sizing model.
 *
 * Version 1.1b03 2014-09-07
 * Labeled-diagrams capability, including interactive editing.
 * Chrome on Mac: fallback for Flashcards; others: prevent sub/sup showing 
 * through.
 *
 * Version 1.02 2014-08-16
 * Turn off debugs!
 *
 * Version 1.01 2014-08-16
 * Remove <p>s and headers that contain only [!] ... [/!] comments.  Paragraph 
 * marks that remained after comments were deleted were taking space.
 *
 * Version 1.0 2014-07-31
 * Initial WordPress release.
 */

// Do-nothing function for old IE.
if (! window.console) {
   window.console = {log: function(){} };
}


// =============================================================================
// Isolate namespace.
qwiz_ = {};
var qwizf = function () {
// =============================================================================
//
var qname = 'qwiz_';

// Debug settings.
var debug = [];
debug.push (true );    // 0 - general.
debug.push (false);    // 1 - radio/choices html.
debug.push (false);    // 2 - feedback html.
debug.push (false);    // 3 - old/new html dump.
debug.push (true );    // 4 - question tags/topics.
debug.push (false);    // 5 - [textentry] / autocomplete.

var $ = jQuery;

// Private data, but global to this qwiz instance.
var q = this;
var qqc;
q.processing_complete_b = false;

var content;
var correct;
var incorrect;
var errmsgs = [];

var n_qwizzes = 0;
var qwizzled_b;
var no_intro_b = [];

var qwizdata = [];

var header_html;

var drag_and_drop_initialized_b = false;
var try_again_obj = '';
var next_button_active_b = false;

var textentry_b = false;
var loaded_metaphone_js_b = false;

// Object (singular and plural) of arrays of term-metaphone pairs.
// Constant across quizzes.  
var default_textentry_terms_metaphones;

// (qwizdata[i_qwiz].textentry_terms_metaphones are quiz-specific terms given
// with [terms]...[/terms].)

// These vary with quiz, and are set up anew for each [textentry] question.
var current_question_textentry_terms_metaphones = {};

var textentry_answers = {};
var textentry_answer_metaphones = {};

var textentry_matches = {};
var lc_textentry_matches = {};
var textentry_i_qwiz;

var Tcheck_answer_message;

var qrecord_b = false;
var declined_login_b;

// -----------------------------------------------------------------------------
$ (document).ready (function () {

   qqc = qwiz_qcards_common;

   correct = [T ('Good!'), T ('Correct!'), T ('Excellent!'), T ('Great!')];
   incorrect = [T ('No.'), T ('No, that\'s not correct.'), T ('Sorry, that\'s not correct.')];

   // The identifier -- including qualifiers like "#" -- of the page content (that
   // perhaps contains inline quizzes) on WordPress.  Multiple-entries default
   // set in qwiz-online-quizzes-wp-plugin.php: div.entry-content, div.post-entry,
   // div.container.  Apparently themes can change this; these have come up so far.
   // Body default for stand-alone use.
   content = qqc.get_qwiz_param ('content', 'body');
   Tcheck_answer_message = T ('Enter your best guess - eventually we\'ll provide suggestions or offer a hint');

   // Set flag to skip login if cookie set.
   declined_login_b = $.cookie ('qwiz_declined_login');

   process_html ();

   // Error messages, if any.
   if (errmsgs.length) {
      alert (Tplural ('Error found', 'Errors found', errmsgs.length) + ':\n\n' + errmsgs.join ('\n'));
   }

   if (n_qwizzes) {
      for (var i_qwiz=0; i_qwiz<n_qwizzes; i_qwiz++) {

         // If no intro for a quiz or single-question quiz, move immediately to
         // first question.
         if (no_intro_b[i_qwiz] || qwizdata[i_qwiz].n_questions == 1) {
            q.next_question (i_qwiz);
         }
      }
   }

});


// -----------------------------------------------------------------------------
function process_html () {

   // Delete paragraphs and headers that contain only [!] ... [/!] comments
   // and whitespace/tags outside.
   $ ('p:contains("[!]"), :header:contains("[!]")').each (function () {

      // See if only whitespace outside [!] ... [/!].
      var comment_htm = $ (this).html ();
      if (comment_htm.search (/\s*(<.+?>)*\s*\[!+\][\s\S]*?\[\/!+\]\s*(<.+?>)*\s*$/m) == 0) {
         $ (this).remove ();
      }
   });

   // Look for [qwiz] and [/qwiz] that are only thing inside parents (e.g.,
   // <p>[qwiz]</p>).  Replace with "unwrapped" content if so.
   $ ('p:contains("qwiz"), :header:contains("qwiz")').each (function () {
      var tag_htm = $ (this).html ();
      if (tag_htm.search (/\s*\[\/{0,1}qwiz[^\]]*\]\s*/m) == 0) {
         $ (this).replaceWith (tag_htm);
      }
   });

   // We're either going to deal with HTML (stand-alone version) or divs (added
   // by WordPress content filter).  The divs allow us to replace content
   // specific to qwiz/qdeck -- avoid clobbering any events bound to remaining
   // html by other plugins.  See if there are such divs.  WP content filter
   // always adds at least one empty div, so don't have to do HTML branch.
   var div_html_selector = '';
   var qwiz_divs_obj = $ ('div.qwiz_wrapper');
   if (qwiz_divs_obj.length) {
      div_html_selector = 'div.qwiz_wrapper';
   } else {
      div_html_selector = content;
   }

   // Read appropriate divs, look for inline qcard shortcodes, loop over
   // shortcode pairs.
   var i_qwiz = 0;
   $ (div_html_selector).each (function () {
      var htm = $ (this).html ();
      if (! htm) {

         //errmsgs.push ('Did not find page content (looking for div "' + content + '")');
      } else {

         // See if there is a qwiz or qwizzes.
         var qwiz_pos = htm.search (/\[qwiz/);
         if (qwiz_pos != -1) {

            // Remove and save text inside [qwizdemo] ... [/qwizdemo] pairs.
            // Replace with <qwizdemo></qwizdemo> pairs as placeholder.
            var qwizdemo_re = new RegExp ('\\[qwizdemo\\][\\s\\S]*?\\[\\/qwizdemo\\]', 'gm');
            var qwizdemos = htm.match (qwizdemo_re);
            var n_qwizdemos = 0;
            if (qwizdemos) {
               n_qwizdemos = qwizdemos.length;
               htm = htm.replace (qwizdemo_re, '<qwizdemo></qwizdemo>');
               if (debug[0]) {
                  console.log ('[process_html] n_qwizdemos: ', n_qwizdemos);
               }
            }

            // Delete comments -- don't want to process [qwiz][/qwiz] pairs or any other
            // qwiz-related tags that are in comments.
            var new_htm = htm.replace (/<!--[\s\S]*?-->/gm, '');

            // Take out any remaining [!]...[\!] comments (those that were not
            // inside paragraph or header elements).
            new_htm = new_htm.replace (/\[!+\][\s\S]*?\[\/!+\]/gm, '');

            // Check that there are pairs.
            var do_not_process_htm = check_qwiz_tag_pairs (new_htm);
            if (do_not_process_htm) {
               new_htm = do_not_process_htm;
            } else {

               // Get text, including beginning and ending tags.  "." does not
               // match line-ends (!), so use the whitespace/not-whitespace
               // construct.  Non-greedy search, global, multiline.
               qwizzled_b = false;
               var qwiz_matches = new_htm.match (/\[qwiz[\s\S]*?\[\/qwiz\]/gm);
               if (qwiz_matches) {
                  var local_n_qwizzes = qwiz_matches.length;
                  if (debug[0]) {
                     console.log ('[process_html] local_n_qwizzes: ', local_n_qwizzes);
                     console.log ('               qwiz_matches[0]: ', qwiz_matches[0]);
                  }

                  // Loop over qwiz-tag pairs.
                  for (ii_qwiz=0; ii_qwiz<local_n_qwizzes; ii_qwiz++) {
                     var new_qwiz_html = process_qwiz_pair (qwiz_matches[ii_qwiz], i_qwiz);

                     // Let's take out <p...> and <h...> from before [qwiz].
                     new_htm = new_htm.replace (/(<[ph][^>]*>\s*)*?\[qwiz[\s\S]*?\[\/qwiz\]/m, new_qwiz_html);
                     i_qwiz++;
                  }
                  if (debug[3]) {
                     console.log ('process_html] new_htm:', new_htm);
                  }
               }
            }

            // Restore examples, but without [qwizdemo] ... [/qwizdemo] tags.
            //                               0----+----1    ----+----1-
            for (var i_qwizdemo=0; i_qwizdemo< n_qwizdemos; i_qwizdemo++) {
               var qwizdemo_i = qwizdemos[i_qwizdemo];
               var len = qwizdemo_i.length;
               qwizdemo_i = qwizdemo_i.substring (10, len - 11);
               new_htm = new_htm.replace ('<qwizdemo></qwizdemo>', qwizdemo_i);
            }

            // Replace content html.
            $ (this).html (new_htm);

            // If any labeled diagrams in this content div, do prep: targets
            // no longer draggable, targets, size image wrappers.
            if (qwizzled_b) {
               init_qwizzled ($ (this), local_n_qwizzes);
            }
         }

         // If wrapper divs, unwrap.
         if (qwiz_divs_obj.length) {
            $ (this).contents ().unwrap ();
         }
      }
      n_qwizzes = i_qwiz;
   });

   // If any quizzes subject to recording, set user menus -- if this comes after
   // check_session_id () callback, it will properly set the menus (while the
   // callback may not have worked if the html hadn't been set at that time).
   if (qrecord_b) {
      q.set_user_menus_and_icons ();
   }

   // If any [textentry] free-form input, set up autocomplete.
   if (textentry_b) {

      // If this is stand-alone version, and qcard_ present, wait until it's
      // done (since re-writes body html).
      if (content == 'body' && typeof (qcard_) != 'undefined') {
         var n_tries = 0;
         var run_init_textentry_autocomplete = function () {
            var ok_b = false;
            console.log ('[run_init_textentry_autocomplete]', n_tries);
            if (qcard_.processing_complete_b || n_tries > 30) {
               console.log ('[run_init_textentry_autocomplete] OK');
               init_textentry_autocomplete ();
               ok_b = true;
            }

            // Do every 10th of a second until success.
            if (! ok_b) {
               setTimeout (run_init_textentry_autocomplete, 100);
               n_tries++;
            }
         }
         run_init_textentry_autocomplete ();
      } else {
         init_textentry_autocomplete ();
      }

   }

   // Set flag to display page (qwizscripts.js).
   q.processing_complete_b = true;
}


// -----------------------------------------------------------------------------
function init_qwizzled (content_obj, local_n_qwizzes) {

   // Targets no longer draggable (from qwizzled create/edit step).
   // Also reset borders.
   content_obj.find ('td.qwizzled_canvas .qwizzled_target').removeClass ('ui-draggable ui-draggable-handle').css ({'border-style': 'dotted', 'border-color': 'gray'});

   // Remove resizing handle divs.
   content_obj.find ('td.qwizzled_canvas .qwizzled_target div.ui-resizable-handle').remove ();

   // Image-linked targets need border-width.
   content_obj.find ('div.qwizzled_image div.qwizzled_target').css ('border-width', '2px');

   // Eliminate label borders.
   content_obj.find ('.qwizzled_highlight_label').css ('border', 'none');

   // (Setting up drag-and-drop here doesn't stick -- perhaps WordPress cancels
   // events.  Done by init_drag_and_drop () when first mouseover a qwizzled
   // question div.)

   // Resize image wrappers.  Find images inside wrappers, get width, set
   // wrapper to match.  (Wrapper was small for "tight" fit during editing,
   // but here small wrapper causes image to shrink for some reason.)
   content_obj.find ('.qwizzled_image img').each (function () {
      var img_width_px = $ (this).attr ('width');
      if (debug[0]) {
         console.log ('[init_qwizzled] img_width_px:', img_width_px);
      }
      if (! img_width_px) {

         // width="235" not present.  Try to get from src, which sometimes
         // looks like: .../diagram.png?resize=455%2C336   ("%2C" is ",")
         var src = $ (this).attr ('src');
         var m = src.match (/resize=([0-9]+)(%2C|,)/);
         if (m) {
            img_width_px = m[1];
         }
      }
      if (img_width_px) {
         $ (this).parent ().css ('width', img_width_px + 'px');
      } else {
         console.log ('[init_qwizzled] Did not find image width - $ (this).attr (\'src\')', $ (this).attr ('src'));
      }
   });

   // Save deep copy of each qwizzled question -- in case restart quiz.
   // Set up object.
   for (var i_qwiz=n_qwizzes; i_qwiz<n_qwizzes+local_n_qwizzes; i_qwiz++) {
      if (qwizdata[i_qwiz].qwizzled_b) {
         qwizdata[i_qwiz].qwizzled = {};

         // See if this qwiz that has one or more labeled diagrams has non-
         // default width.
         var initial_width = $ ('#xqwiz' + i_qwiz).outerWidth ();
         if (debug[0]) {
            console.log ('[init_qwizzled] initial_width:', initial_width);
         }
         if (initial_width) {
            qwizdata[i_qwiz].initial_width = initial_width;
         }
      }
   }

   content_obj.find ('div.qwizzled').each (function () {

      // Get qwiz number from id -- id looks like "qwiz0-q0".
      var id = $ (this).attr ('id');
      if (debug[0]) {
         console.log ('[init_qwizzled] id:', id);
      }
      var fields = id.split ('-');
      var i_qwiz     = parseInt (fields[0].substr (4));
      if (debug[0]) {
         console.log ('                i_qwiz:', i_qwiz);
      }
      qwizdata[i_qwiz].qwizzled[id] = $ (this).clone (true);
   });
}


// -----------------------------------------------------------------------------
function init_textentry_autocomplete () {

   $ ('input.qwiz_textentry').autocomplete ({
      minLength:     3,
      source:        find_matching_terms,
      close:         menu_closed,
      open:          menu_shown,
      select:        item_selected
   });

   $ ('.qwiz_textentry').keyup (menu_closed);
}



// -----------------------------------------------------------------------------
this.label_dragstart = function (label_obj) {

   // Reset things only if flag is set indicating a label was incorrectly
   // placed.
   if (try_again_obj) {
      var local_try_again_obj = try_again_obj;
      try_again_obj = '';

      if (debug[0]) {
         console.log ('[label_dragstart] label_obj:', label_obj);
         console.log ('[label_dragstart] local_try_again_obj:', local_try_again_obj);
         console.log ('[label_dragstart] local_try_again_obj.label_obj.attr (\'id\'):', local_try_again_obj.label_obj.attr ('id'), ', label_obj.attr (\'id\'):', label_obj.attr ('id'));
      }

      // Reset background of incorrectly-placed label.
      local_try_again_obj.label_obj.find ('.qwizzled_highlight_label').css ({background: 'none'});
      local_try_again_obj.label_obj.find ('.qwizzled_highlight_label img').css ({outline: 'none'});

      // If dragging a label other than the one that was incorrectly placed,
      // move the incorrectly-placed label back to list.
      if (local_try_again_obj.label_obj.attr ('id') != label_obj.attr ('id')) {
         local_try_again_obj.label_obj.animate ({left: '0px', top: '0px'}, {duration: 750});
      }

      // Reset feedback.
      local_try_again_obj.feedback_obj.hide ();

      // Make target droppable again.
      local_try_again_obj.target_obj.droppable ('option', 'disabled', false);
   }
}


// -----------------------------------------------------------------------------
this.label_dropped = function (target_obj, label_obj) {

   // Is this the right target?  Get the association id from the label class.
   // If no matching class, use data () (backwards compatibility).
   var classes = label_obj.attr ('class');
   var m = classes.match (/qtarget_assoc([0-9]*)/);
   if (m) { 
      var assoc_id = m[1];
   } else {
      var assoc_id = label_obj.data ('label_target_id');
   }
   if (debug[0]) {
      console.log ('[label_dropped] target_obj:', target_obj, ', assoc_id:', assoc_id);
   }

   // Get label id (so know which feedback to show).  Looks like
   // label-qwiz0-q0-a0.  Feedback id looks like qwiz0-q0-a0x.
   var label_id = label_obj.attr ('id');
   var feedback_selector = '#' + label_id.substr (6);
   var fields = feedback_selector.split ('-');
   var question_selector = fields[0] + '-' + fields[1];
   var i_qwiz = fields[0].substr (5);
   var i_question = fields[1].substr (1);
   if (debug[0]) {
      console.log ('[label_dropped] question_selector:', question_selector);
   }

   // If no separate intro page, and this is first question, hide qwiz icon.
   if (i_question == 0 && (no_intro_b[i_qwiz]
                                     || qwizdata[i_qwiz].n_questions == 1)) {
      $ ('div.qwiz div#icon_qwiz' + i_qwiz).hide ();
   }

   // Increment number of tries.
   qwizdata[i_qwiz].n_label_attempts++;
   // Hide previous feedback, if any.  
   $ ('[id^=qwiz' + i_qwiz + '-q' + i_question + '-a]').hide ();

   // Does the target have this id as a class?  (Note: not using id=
   // because WordPress eats ids).
   if (target_obj.hasClass ('qwizzled_target-' + assoc_id)) {
      if (debug[0]) {
         console.log ('[label_dropped] feedback_selector:', feedback_selector + 'c');
      }

      // Yes.  Show positive feedback for this label.
      $ (feedback_selector + 'c').show ();

      // See if multiple targets for this label.
      var multiple_targets_b = false;
      m = classes.match (/qwizzled_n_targets([0-9]*)/);
      if (m) {
         multiple_targets_b = true;

         // Either decrement targets remaining, or, if only one left, remove
         // class.
         var current_n_targets = m[0];
         var n_targets = parseInt (m[1]);
         var current_n_targets = m[0];
         if (n_targets == 2) {

            // Will be only one left.  Can treat as "normal".  Remove class.
            label_obj.removeClass (current_n_targets);
         } else {

            // Decrement.  Set flag, remove existing class, add decremented
            // class.
            var new_class = 'qwizzled_n_targets' + (--n_targets);
            label_obj.removeClass (current_n_targets).addClass (new_class);
         }
      }

      // Do-it-myself snap to target.  Make copy of label into child of the
      // target.  Clone false arg says do not copy events (namely, dragging
      // effect).
      var label_copy_obj = label_obj.clone (false);
      label_copy_obj.appendTo (target_obj);
      label_copy_obj.css ({position: 'absolute', left: '4px', top: '50%', height: 'auto', width: '100%', transform: 'translateY(-50%)'});
      label_copy_obj.removeClass ('qwizzled_label_unplaced'); 
      label_copy_obj.find ('.qwizzled_highlight_label').css ('cursor', 'default');

      // Move original label back to original position.
      label_obj.css ({left: '0px', top: '0px'});

      // If not multiple targets, disable drag of original label, and remove 
      // class to signal no re-enable.  Also remove cursor css.
      // Gray-out (apply to children, too, in case need to overcome default),
      // move to original position.
      if (! multiple_targets_b) {
         label_obj.draggable ('disable').removeClass ('qwizzled_label_unplaced'); 
         label_obj.css ({color: 'lightgray', left: '0px', top: '0px'});
         label_obj.find ('*').css ({color: 'lightgray'});
         label_obj.find ('.qwizzled_highlight_label').css ('cursor', 'default');
      }

      // This target no longer droppable.  If div, just this.  If span (text
      // target, possibly with multiple spans) find relevant siblings.
      if (target_obj[0].tagName.toLowerCase () == 'div') {
         target_obj.droppable ('option', 'disabled', true);
      } else {
         var classes = target_obj.attr ('class');
         var m = classes.match (/qtarget_sib-[0-9]*/);
         if (m) {
            $ ('span.' + m[0]).droppable ('option', 'disabled', true);
         } else {

            // Backwards compatibility -- assume they're in a wrapper span.
            target_obj.siblings ('span').andSelf ().droppable ('option', 'disabled', true);
         }
      }
       
      // Increment number of labels correctly placed.  See if done with
      // diagram.
      qwizdata[i_qwiz].n_labels_correct++;
      var qwizq_id = '#qwiz' + i_qwiz + '-q' + i_question;
      if (qwizdata[i_qwiz].n_labels_correct == qwizdata[i_qwiz].n_label_targets) {

         // Done with labeled diagram.  Show summary.
         var n_tries = qwizdata[i_qwiz].n_label_attempts;
         var n_label_targets = qwizdata[i_qwiz].n_label_targets;
         var correct_b = n_tries == n_label_targets;
         var qwizzled_summary;
         if (correct_b) {
            qwizzled_summary = 'You placed all of the items correctly on the first try!';
         } else {
            qwizzled_summary = Tplural ('It took you one try', 'It took you %s tries', n_tries) + ' ' + Tplural ('to place this label correctly', 'to place these labels correctly', n_label_targets) + '.';
            qwizzled_summary = qwizzled_summary.replace ('%s', qqc.number_to_word (n_tries));
         }
         $ (qwizq_id + '-ff').html (qwizzled_summary).show ();

         // Exit text if this is a single-question qwiz and there is exit
         // text.
         if (qwizdata[i_qwiz].finished_diagram_div) {

            $ (qwizq_id + ' td.qwizzled_feedback').append (qwizdata[i_qwiz].finished_diagram_div);

            // Update progress bar.
            display_qwizzled_progress (i_qwiz);
         } else {

            // Consider correct only if all labels properly placed on first try.
            if (correct_b) {
               qwizdata[i_qwiz].n_correct++;
               $ (qwizq_id).data ('answered_correctly', 1);
            } else {

               // Record number of incorrect responses.
               qwizdata[i_qwiz].n_incorrect++;

               // If repeating incorrect, record as incorrect response as signal
               // to restore labeled diagram state.  If not repeating incorrect,
               // do same to record incorrect response.
               $ (qwizq_id).data ('answered_correctly', 0);
            }
            update_topic_statistics (i_qwiz, i_question, correct_b);

            // Show next-button.
            update_progress_show_next (i_qwiz);
         }
      } else {

         // Update progress bar.
         display_qwizzled_progress (i_qwiz);
      }
   } else {

      // Incorrectly placed.  Show feedback with "Try again" button.
      // Label background red.  Set indicator to reset things if drag a label
      // (which label dropped).
      if (debug[0]) {
         console.log ('[label_dropped] feedback_selector:', feedback_selector + 'x');
      }
      var feedback_obj = $ (feedback_selector + 'x');
      feedback_obj.show ();
      label_obj.find ('.qwizzled_highlight_label').css ({background: '#FF8080'});
      label_obj.find ('.qwizzled_highlight_label img').css ({outline: '2px solid #FF8080'});
      try_again_obj = { label_obj: label_obj, feedback_obj:  feedback_obj,
                        target_obj: target_obj};

      // Make target no longer droppable -- starting drag while over the
      // target seems to count as a "drop".  Will re-enable droppability in
      // label_dragstart ().
      target_obj.droppable ('option', 'disabled', true);
       
      //$ (question_selector + ' .qwizzled_label_unplaced').draggable ('disable');

      // No move cursor for all unplaced labels.
      //$ (question_selector + ' .qwizzled_label_unplaced .qwizzled_highlight_label').css ('cursor', 'default');
      //$ (question_selector + ' .qwizzled_label_unplaced .qwizzled_highlight_label a').css ('cursor', 'default');
   }
}


// -----------------------------------------------------------------------------
this.try_again = function (i_qwiz, i_question, i_label) {

   // Make target droppable again.
   try_again_obj.target_obj.droppable ('option', 'disabled', false);

   // Unset indicator.
   try_again_obj = '';

   // Hide feedback.
   var feedback_selector = '#qwiz' + i_qwiz + '-q' + i_question + '-a' + i_label + 'x';
   $ (feedback_selector).hide ();

   var label_selector = '#label-qwiz' + i_qwiz + '-q' + i_question + '-a' + i_label;
   if (debug[0]) {
      console.log ('[try_again] label_selector:', label_selector);
   }

   // Delete label background.  Return label to its original position.
   $ (label_selector + ' .qwizzled_highlight_label').css ({background: 'none'});
   $ (label_selector + ' .qwizzled_highlight_label img').css ({outline: 'none'});
   $ (label_selector).animate ({left: '0px', top: '0px'}, {duration: 750});

   // Re-enable drag.
   //var question_selector = '#qwiz' + i_qwiz + '-q' + i_question;
   //$ (question_selector + ' .qwizzled_label_unplaced').draggable ('enable');

   // Restore move cursor for all unplaced labels.
   //$ (question_selector + ' .qwizzled_label_unplaced .qwizzled_highlight_label').css ('cursor', 'move');
   //$ (question_selector + ' .qwizzled_label_unplaced .qwizzled_highlight_label a').css ('cursor', 'move');
}


// -----------------------------------------------------------------------------
function process_qwiz_pair (htm, i_qwiz) {

   // Data object for this qwiz.
   qwizdata.push ({});
   qwizdata[i_qwiz].n_correct   = 0;
   qwizdata[i_qwiz].n_incorrect = 0;
   qwizdata[i_qwiz].i_question  = -1;
   qwizdata[i_qwiz].initial_width = 500;
   qwizdata[i_qwiz].qrecord_id = false;

   var qwiz_tag = htm.match (/\[qwiz[^\]]*\]/m)[0];
   if (debug[0]) {
      console.log ('[process_qwiz_pair] qwiz_tag: ', qwiz_tag);
   }

   var n_questions = 0;
   var new_htm = '';
   var no_intro_i_b = false;

   // Is qwiz encoded?  Decode if necessary.  Turns tag into plain '[qwiz]'.
   //htm = decode_qwiz (htm, qwiz_tag);

   // Capture any initial closing tags after [qwiz ...] -- will put them in
   // front of <div> that replaces [qwiz ...].
   var m = htm.match (/\[qwiz[^\]]*\]((<\/[^>]+>\s*)*)/m, '');
   if (m) {
      var initial_closing_tags = m[1];
      new_htm += initial_closing_tags;
      if (debug[0]) {
         console.log ('[process_qwiz_pair] initial_closing_tags: ', initial_closing_tags);
      }
   }

   // Delete [qwiz], any initial closing tags.
   htm = htm.replace (/\[qwiz[^\]]*\]((<\/[^>]+>\s*)*)/m, '');

   // Delete any initial whitespace.
   htm = qqc.trim (htm);

   // Make sure there's at least one question.
   if (htm.search (/\[(q|<code><\/code>q)([^\]]*)\]/m) == -1) {
      errmsgs.push (T ('Did not find question tags ("[q]") for') + ' qwiz ' + (i_qwiz + 1));
   } else {

      // Look for [terms]...[/terms] and/or [add_terms]...[/add_terms] pairs.
      // Parse, and delete.  Include opening tags in front and closing tags
      // after.
      htm = qqc.process_inline_textentry_terms (htm, 'terms', qwizdata, i_qwiz);
      errmsgs = errmsgs.concat (qwizdata.additional_errmsgs);
      htm = qqc.process_inline_textentry_terms (htm, 'add_terms', qwizdata, i_qwiz);
      errmsgs = errmsgs.concat (qwizdata.additional_errmsgs);

      // See if html up to first shortcode is just whitespace, including empty
      // paragraphs.  Limit to first 2000 characters.
      var whitespace = parse_html_block (htm.substr (0, 2000), ['^'], ['[h]', '[i]', '[q]', '[q '], 'return whitespace');
      if (whitespace) {

         // Yes, delete it.
         htm = htm.replace (whitespace, '');
      }

      // See if header.  Sets header_html global variable.
      htm = process_header (htm, i_qwiz, 0, true);

      // See if intro.  Limit to first 2000 characters.
      var intro_html = parse_html_block (htm.substr (0, 2000), ['[i]'], ['[q]', '[q ', '<div class="qwizzled_question">']);

      // See if no [i].
      if (intro_html == 'NA') {
         
         // No [i] -- intro may be text before [q].  See if there is.  Add flag
         // to ignore &nbsp; (empty paragraph).
         intro_html = parse_html_block (htm.substr (0, 2000), ['^'], ['[q]', '[q ', '<div class="qwizzled_question">'], true);
      }

      // See if intro was just tags and whitespace.
      if (intro_html == '') {
         no_intro_i_b = true;
      } else {

         // Error if text before [i].
         if (htm.substr (0, 5) != intro_html.substr (0, 5)) {
            errmsgs.push (T ('Text before intro') + ' [i] - qwiz ' + (i_qwiz + 1));
         }

         // Delete [i] from intro.
         intro_html = intro_html.replace ('[i]', '');

         // Create div with introductory text -- html before first "[q]".
         new_htm += '<div id="intro-qwiz' + i_qwiz + '">\n' + intro_html + '</div>\n';
      }

      // question_html -- everything from first [q] on.
      var question_html = htm.match (/(\[q [^\]]*\]|<div class="qwizzled_question">|\[q\])[\s\S]*/m)[0];

      // Find topic attributes, if any, for each question.  First get array of
      // tags.
      var question_tags = question_html.match (/\[(<code><\/code>)*q([^\]]*)\]/gm);
      if (debug[4]) {
         console.log ('[process_qwiz_pair] question_tags: ', question_tags);
      }
      process_topics (i_qwiz, question_tags);

      // Capture any opening tags before each "[q...] tag.
      var matches = htm.match (/(<[^\/][^>]*>\s*)*?(\[q[ \]]|<div class="qwizzled_question">)/gm);
      var q_opening_tags = [];
      var n_q_opening_tags = matches.length;
      for (var i_tag=0; i_tag<n_q_opening_tags; i_tag++) {
         var match_i = matches[i_tag];
         match_i = match_i.replace (/\[q[ \]]|<div class="qwizzled_question">/m, '');
         q_opening_tags.push (match_i);
      }
      if (debug[0]) {
         console.log ('[process_qwiz_pair] q_opening_tags: ', q_opening_tags.join (', '));
         console.log ('[process_qwiz_pair] question_html: ', question_html);
      }

      // Take off initial [q] or [q topic=...] or <div class="qwizzled_question">
      //                                          ----+----1----+----2----+----3-
      // Save flag for which.
      var first_q_qwizzled_b = question_html.substr (0, 2) != '[q';
      if (first_q_qwizzled_b) {
         question_html = question_html.substr (31);
      } else {
         var start = question_html.search (/\]/) + 1;
         question_html = question_html.substr (start);
      }

      // Take off closing "[/qwiz]".
      var len = question_html.length;
      question_html = question_html.substring (0, len-7);

      // If there's exit text, capture for summary div, and delete.
      var exit_html = question_html.match (/\[x\]([\s\S]*)/m);
      if (exit_html) {
         exit_html = exit_html[1];

         // Error if a [q] tag inside exit text.
         if (exit_html.search (/\[q[ \]]|<div class="qwizzled_question">/) != -1) {
            errmsgs.push ('[x] ' + T ('(exit text) must be last'));
         } else {
            question_html = question_html.replace (/\[x\][\s\S]*/m, '');
         }
      } else {
         exit_html = '';
      }

      // Split into individual items.  First split on qwizzled_question divs.
      var qwizzled_pieces = question_html.split ('<div class="qwizzled_question">');
      if (debug[0]) {
         console.log ('[process_qwiz_pair] qwizzled_pieces.length:', qwizzled_pieces.length);
      }
      questions_html = [];
      if (qwizzled_pieces.length == 1) {

         // No splits.  Split on [q].
         var q_split = question_html.split (/\[q [^\]]*\]|\[<code><\/code>q [^\]]*\]|\[q\]|\[<code><\/code>q\]/);
         var i_qbeg = 0;
         if (first_q_qwizzled_b) {

            // Put first and second qsplit pieces back together (with the q).
            questions_html.push (q_split[0] + '[q]' + q_split[1]);
            i_qbeg = 2;
         }

         // Regular questions, if any.
         for (var i_q=i_qbeg; i_q<q_split.length; i_q++) {
            questions_html.push (q_split[i_q]);
         }
      } else if (qwizzled_pieces.length > 1) {
         if (first_q_qwizzled_b) {

            // Split each piece on regular [q]s, including old-style (with
            // <code></code>).  Put first and second pieces back together in
            // each case.
            for (var i_qwizzled=0; i_qwizzled<qwizzled_pieces.length; i_qwizzled++) {

               // Note: regular expression /\[(<code><\/code)*q... didn't work --
               // caused extra splits.
               var q_split = qwizzled_pieces[i_qwizzled].split (/\[q [^\]]*\]|\[<code><\/code>q [^\]]*\]|\[q\]|\[<code><\/code>q\]/);
               questions_html.push (q_split[0] + '[q]' + q_split[1]);

               // Additional, if any.
               for (var i_q=2; i_q<q_split.length; i_q++) {
                  questions_html.push (q_split[i_q]);
               }
            }
         } else {

            // First piece before a qwizzled question is all regular questions.
            var q_split =  qwizzled_pieces[0].split (/\[q [^\]]*\]|\[q\]/);
            for (var i_q=0; i_q<q_split.length; i_q++) {
               questions_html.push (q_split[i_q]);
            }

            // Split remaining pieces on regular [q]s.  Put first and second
            // pieces back together in each case.
            for (var i_qwizzled=1; i_qwizzled<qwizzled_pieces.length; i_qwizzled++) {
               var q_split = qwizzled_pieces[i_qwizzled].split (/\[q [^\]]*\]|\[<code><\/code>q [^\]]*\]|\[q\]|\[<code><\/code>q\]/);
               questions_html.push (q_split[0] + '[q]' + q_split[1]);

               // Additional, if any.
               for (var i_q=2; i_q<q_split.length; i_q++) {
                  questions_html.push (q_split[i_q]);
               }
            }
         }
      }

      //var questions_html = question_html.split (/\[q [^\]]*\]|\[q\]|<div class="qwizzled_question">/);
      n_questions = questions_html.length;
      if (debug[0]) {
         console.log ('[process_qwiz_pair] n_questions:', n_questions);
         console.log ('[process_qwiz_pair] questions_html:', questions_html.join ('\n================================================\n'));
      }

      // Create a div for each.
      var question_divs = [];
      for (var i_question=0; i_question<n_questions; i_question++) {

         // See if multiple-choice question or free-form entry.
         var question_div;
         if (questions_html[i_question].search (/\[c\]|\[c\*\]/m) != -1) {

            // See if free-form entry.
            if (questions_html[i_question].search (/\[textentry/m) != -1) {

               question_div = process_textentry (i_qwiz, i_question,
                                                questions_html[i_question],
                                                q_opening_tags[i_question]);
            } else {

               // Regular multiple-choice question.
               question_div = process_question (i_qwiz, i_question,
                                                questions_html[i_question],
                                                q_opening_tags[i_question]);
            }
         } else if (questions_html[i_question].search (/\[l\]|<div class="qwizzled_label/m) != -1) {

            // Labels.
            qwizzled_b = true;
            qwizdata[i_qwiz].qwizzled_b = true;
            question_div = process_qwizzled (i_qwiz, i_question,
                                             questions_html[i_question],
                                             q_opening_tags[i_question],
                                             question_tags[i_question]);
         } else {

            // Error: didn't find choices or labels.
            errmsgs.push (T ('Did not find choices ("[c]") or labels ("[l]") for') + ' qwiz ' + (i_qwiz + 1) + ', ' + T ('question') + ' ' + (i_question + 1));
         }
         question_divs.push (question_div);
      }
      new_htm += question_divs.join ('\n');

      //if (debug[3]) {
      //   console.log ('[process_qwiz_pair] new_htm: ', new_htm);
      //}
   }
   no_intro_b.push (no_intro_i_b);
   qwizdata[i_qwiz].n_questions = n_questions;

   // First qwiz tag becomes opening div for box around qwiz.  Add additional
   // div elements (progress, login div, summary div, "next" button).
   new_htm = create_qwiz_divs (i_qwiz, qwiz_tag, new_htm, exit_html);

   //if (debug[3]) {
   //   console.log ('[process_qwiz_pair] new_htm: ', new_htm);
   //}

   return new_htm;
}


// -----------------------------------------------------------------------------
/*
function decode_qwiz (htm, qwiz_tag) {

   // Get html after [qwiz] tag and before [/qwiz] tag.
   htm = htm.substring (qwiz_tag.length, htm.length-7);
   while (true) {

      // See if non-base64 character (blank, for now) in html.
      var cpos = htm.search (' ');
      if (cpos != -1) {
         break;
      } else {
         htm = atob (htm);
      }
   }

   // Add back [qwiz] [/qwiz] tags.
   htm = '[qwiz]' + htm + '[/qwiz]';

   return htm;
}
*/


// -----------------------------------------------------------------------------
// Divs at top of question (qwiz itself, progress), and at bottom "next".
function create_qwiz_divs (i_qwiz, qwiz_tag, htm, exit_html) {

   // Capture any style info or other attributes provided.
   var m = qwiz_tag.match (/\[qwiz([^\]]*)\]/m);
   var attributes = m[1];
   if (debug[0]) {
      console.log ('[create_qwiz_divs] attributes: ', attributes);
   }
   
   // If non-default width set, set flag.
   attributes = qqc.replace_smart_quotes (attributes);
   var non_default_width_b = attributes.search (/[\s;"]width/m) != -1;

   // If "qrecord_id=..." present, parse out database ID.  Set flag indicating
   // one or more quizzes subject to recording.
   var qrecord_id = qqc.get_attr (attributes, 'qrecord_id');
   if (qrecord_id) {
      qrecord_b = true;
   }

   // If qrecord_id present -- quiz can be taken for credit, etc. -- and haven't
   // checked already, see if user already logged in (get session id in cookie,
   // see if still valid).
   if (qrecord_id) {
      qwizdata[i_qwiz].qrecord_id = qrecord_id;
      if (typeof (document_qwiz_user_logged_in_b) == 'undefined'
                                          || ! document_qwiz_user_logged_in_b) {
         check_session_id (i_qwiz, qrecord_id);
      }
   }


   // If "repeat_incorrect=..." present, parse out true/false.
   var repeat_incorrect_value = qqc.get_attr (attributes, 'repeat_incorrect');
   qwizdata[i_qwiz].repeat_incorrect_b = repeat_incorrect_value != 'false';
   if (debug[0]) {
      console.log ('[create_qwiz_divs] repeat_incorrect_value:', repeat_incorrect_value, ', repeat_incorrect_b:', qwizdata[i_qwiz].repeat_incorrect_b);
   }


   // If "random=..." present, parse out true/false.
   var random = qqc.get_attr (attributes, 'random');
   qwizdata[i_qwiz].random_b = random == 'true';
   if (debug[0]) {
      console.log ('[create_qwiz_divs] random:', random, ', random_b:', qwizdata[i_qwiz].random_b);
   }

   // Undisplayed version of qwiz div, so can measure default width if need to.
   // Keep out of flow.  (Don't let margins, padding take up room.)
   var top_html = '';
   if (non_default_width_b) {
      var xattributes = attributes.replace (/(style\s*=\s*"[^"]*)/, '$1; position: absolute;');

      // Correct double ";;" if we've done that.
      xattributes = xattributes.replace (/;\s*;/g, ';');
      top_html = '<div id="xqwiz' + i_qwiz + '" class="xqwiz" ' + xattributes + '></div>\n';
   }

   // This qwiz opening div.
   top_html += '<div id="qwiz' + i_qwiz + '" class="qwiz" ' + attributes + '>\n';

   // Header div.  If no initial header, hide.
   var style = '';
   if (header_html == '' || header_html == 'NA') {
      style = ' style="display: none;"';
   }
   top_html += '<div id="header-qwiz' + i_qwiz + '" class="qwiz-header"'
               + style + '>' + header_html + '</div>\n';

   // ..........................................................................
   // Mode and progress divs.  (Set up in any case, in case single-question
   // qwiz consisting of a labeled diagram.)
   var progress_div_html = '<div>\n';
   var learn_mode_title = T ('Learn mode: questions repeat until answered correctly.');
   var test_mode_title  = T ('Test mode: incorrectly-answered questions do not repeat.');
   var mode;
   var title;
   if (qwizdata[i_qwiz].repeat_incorrect_b) {
      mode = T ('Learn');
      title = learn_mode_title + ' ' + test_mode_title;
   } else {
      mode = T ('Test');
      title = test_mode_title + ' ' + learn_mode_title;
   }
   progress_div_html += '<div id="mode-qwiz' + i_qwiz + '" class="qwiz-mode" title="' + title + '">\n'
                      +    'Mode: ' + mode + '\n'
                      + '</div>\n';
   if (qrecord_id) {

      // Set up pull-down arrow for user menu login/logout, etc.  Right end of
      // progress bar.  Add class if this quiz doesn't have an intro/start
      // button.
      var addclass = '';
      if (no_intro_b[i_qwiz]) {
         addclass = ' qwiz-usermenu_icon_no_intro';
      }
      progress_div_html +=   '<div id="usermenu_icon-qwiz' + i_qwiz + '" class="qwiz-usermenu_icon' + addclass + '" onmouseover="' + qname + '.show_usermenu (' + i_qwiz + ')">\n'
                           +    '&#x25bc;'
                           + '</div>\n';
   }
   progress_div_html +=    '<div id="progress-qwiz' + i_qwiz + '" class="qwiz-progress">\n'
                      +    '</div>\n';
   if (qrecord_id) {

      // Add user menu div.  Don't populate until after start/login.
      progress_div_html += '<div id="usermenu-qwiz' + i_qwiz + '" class="qwiz-usermenu">'
                         + '</div>';
   }
   progress_div_html += '</div>\n';

   // ..........................................................................
   // Login div, if quiz may be recorded.
   var login_div_html = '';
   if (qwizdata[i_qwiz].qrecord_id) {
      var onfocus = 'onfocus="jQuery (\'#qwiz_login-qwiz' + i_qwiz + ' p.login_error\').hide ()"';

      login_div_html =   '<div id="qwiz_login-qwiz' + i_qwiz + '" class="qwiz-login">\n'
                       +    '<p>'
                       +       '<strong>' + T ('Record score/credit?') + '</strong>'
                       +    '</p>\n'
                       +    '<table border="0" align="center">'
                       +       '<tr>'
                       +          '<td>'
                       +             '<label>' + T ('User name')
                       +          '</td>'
                       +          '<td>'
                       +             '<input type="text" id="qwiz_username-qwiz' + i_qwiz + '" ' + onfocus + ' /></label>'
                       +          '</td>'
                       +       '</tr>'
                       +       '<tr>'
                       +          '<td>'
                       +             '<label>' + T ('Password')
                       +          '</td>'
                       +          '<td>'
                       +             '<input type="password" id="qwiz_password-qwiz' + i_qwiz + '" ' + onfocus + ' /></label>'
                       +          '</td>'
                       +       '<tr>'
                       +    '</table>\n'
                       +    '<table border="0" align="center">'
                       +       '<tr>'
                       +          '<td class="qwiz-remember">'
                       +             '<button class="qbutton" onclick="' + qname + '.login (' + i_qwiz + ')">'
                       +                T ('Login')
                       +             '</button>'
                       +          '</td>'
                       +          '<td class="qwiz-remember">'
                       +             '<button class="qbutton" onclick="' + qname + '.no_login (' + i_qwiz + ')">'
                       +                T ('No thanks')
                       +             '</button>'
                       +             '<br />'
                       +             '<span class="qwiz-remember" title="' + T ('Skip login in the future') + '"><span><input type="checkbox" /></span> ' + T ('Remember') + '</span>'
                       +          '</td>'
                       +       '<tr>'
                       +    '</table>\n'
                       +    '<p class="login_error">'
                       +       'Login incorrect.&nbsp; Please try again'
                       +    '</p>\n'
                       + '</div>\n';
   }


   // ..........................................................................
   var bottom_html = '';
   if (qwizdata[i_qwiz].n_questions > 1) {

      // Summary div.  If exit text, replace "[restart]", if there, with restart
      // button html.
      exit_html = create_restart_button (i_qwiz, exit_html);
      bottom_html +=   '<div id="summary-qwiz' + i_qwiz + '" class="summary">\n'
                     + '    <div id="summary_report-qwiz' + i_qwiz + '">'
                     + '    </div>\n'
                     +      exit_html + '\n'
                     + '</div>\n';
   } else {

      // Single-question quiz.  If labeled diagram, save exit text for feedback
      // area.  If not labeled diagram, don't take any space with progress bar.
      if (qwizdata[i_qwiz].qwizzled_b) {
         exit_html = create_restart_button (i_qwiz, exit_html);
         qwizdata[i_qwiz].finished_diagram_div
                            =  '<div id="finished_diagram-qwiz' + i_qwiz + '">\n'
                             +    exit_html
                             + '</div>\n';
      } else {
         progress_div_html = '';
      }
   }

   // "Next" button.  Begins as "Start quiz" button.  If quiz may be recorded,
   // and user not logged in, go to login rather than first question (if hasn't
   // declined).
   bottom_html +=  '<div class="next_button" id="next_button-qwiz' + i_qwiz + '">\n'
                 + '   <button class="qbutton" onclick="' + qname + '.start_quiz (' + i_qwiz + ')">'
                 +        '<span id="next_button_text-qwiz' + i_qwiz + '">'
                 +           T ('Start quiz')
                 +        '</span>'
                 +    '</button>\n'
                 + '</div>\n';

   // "Check answer" and "Hint" buttons for [textentry] questions.  Check
   // answer starts out gray (but not actually disabled, so can provide alert
   // message).  Hint starts out hidden.
   bottom_html +=  '<div class="textentry_check_answer_div" id="textentry_check_answer_div-qwiz' + i_qwiz + '">\n'
                 + '   <button class="qbutton_disabled textentry_check_answer" title="' + Tcheck_answer_message + '" onclick="' + qname + '.textentry_check_answer (' + i_qwiz + ')">'
                 +        T ('Check answer')
                 +    '</button>\n'
                 +    '&emsp;\n'
                 +    '<button class="qbutton qwiz_textentry_hint" style="display: none; font-size: 11px; padding: 2px 2px; border-radius: 5px;" onclick="' + qname + '.textentry_hint (' + i_qwiz + ')" disabled>'
                 +        T ('Hint')
                 +    '</button>\n'
                 + '</div>\n';


   style = '';
   if (qqc.get_qwiz_param ('beta')) {
      style = 'style = "background: red;"';
   }
   bottom_html += '<div class="icon_qwiz" id="icon_qwiz' + i_qwiz + '" ' + style + '>';
   var icon_qwiz = qqc.get_qwiz_param ('icon_qwiz');
   if (icon_qwiz != 'Not displayed') {
      var title = 'Qwiz - online quizzes and flashcards';
      if (icon_qwiz != 'Icon only') {
         bottom_html += '<a href="//dkprojects.net/qwiz">';
      } else {
         title += ' - dkprojects.net/qwiz';
      }
      bottom_html += '<img class="icon_qwiz" style="border: none;" title="' + title + '" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAUCAIAAAALACogAAAABnRSTlMA/wD/AP83WBt9AAAACXBIWXMAAA7EAAAOxAGVKw4bAAABP0lEQVR4nGP8//8/AymAiSTV5GhgwSZ4rcRrxRooW3futlBnJDlGND/cXzXVccFLVP0oepiwqtZJyH2wrenBtogQBgYGhsv9q15j9cO1qTDVW8JEGRgYGBi0PJ0YGBgYrjzCpuH+qv1rGBgYGHQLoaoZGBgYlOTEGRgYGB68uY+h4fXuQy8ZGBgYnLSRvXjv0UsGBgYGBRFFdA1Prm+6x8DAwBBio4XsyO37GBgYGHTkEHaixYO4mszrWTl1CjmH7iMcKe5nhdAAi4cnL6/A3HbrHgMDw56pJ0QYIOHr5JgmgzASZoOFdggDAwPDy03HRCEhs6YJEne6c0uQHYkUcXt76pL3oTqQQbxqVjay8Sh+cC5pmuuEpkFMWQZNBCNpwMDrWTmT2+5hCCu54EqtomkVLjqYwgoiuGzACWifgQDhK2rq5bcX2gAAAABJRU5ErkJggg==" />';
      if (icon_qwiz != 'Icon only') {
         bottom_html += '</a>';
      }
   }
   bottom_html += '</div>';

   // This qwiz closing div.
   bottom_html += '</div>\n';

   // Add opening and closing html.
   htm = top_html + progress_div_html + login_div_html + htm + bottom_html;

   return htm;
}


// -----------------------------------------------------------------------------
function create_restart_button (i_qwiz, exit_html) {
   if (exit_html) {
      var restart_button_html =
                          '    <button onclick="' + qname + '.restart_quiz (' + i_qwiz + ')">\n'
                        +          T ('Take the quiz again') + '\n'
                        + '    </button>\n';
      exit_html = exit_html.replace ('[restart]', restart_button_html);
   }

   return exit_html;
}


// -----------------------------------------------------------------------------
function process_topics (i_qwiz, question_tags) {

   // Topic or topics each question, if any.
   qwizdata[i_qwiz].question_topics = new Array (n_questions);

   // List of all topics.
   qwizdata[i_qwiz].topics = [];

   // Loop over tags.
   var n_questions_w_topics = 0;
   var n_questions = question_tags.length;
   for (var i_question=0; i_question<n_questions; i_question++) {
      var question_tag = question_tags[i_question];

      // Find attributes, if any.
      var m = question_tag.match (/\[(<code><\/code>)*q([^\]]*)\]/m);
      var attributes = m[2];
      if (attributes) {

         // Look for "topic=" attribute.
         attributes = qqc.replace_smart_quotes (attributes);
         var question_topics = qqc.get_attr (attributes, 'topic');
         if (question_topics) {
            if (debug[4]) {
               console.log ('[process_topics] question_topics: ', question_topics);
            }

            // Multiple topics for a question - separated by semicolon (and
            // optional space).  Split into array.
            question_topics = question_topics.split (/; */);
            qwizdata[i_qwiz].question_topics[i_question] = question_topics;
            n_questions_w_topics++;

            // Add topics to list of topics if not already in list.
            for (var i=0; i<question_topics.length; i++) {
               var topic = question_topics[i];
               if (qwizdata[i_qwiz].topics.indexOf (topic) == -1) {
                  qwizdata[i_qwiz].topics.push (topic);
               }
            }
         }
      }
   }

   if (n_questions_w_topics > 0) { 

      // If any topics given, every question must have at least one topic.
      if (n_questions_w_topics != n_questions) {
         errmsgs.push (T ('Topic(s) were given for at least one question, but at least one question doesn\'t have a topic.'));
      }
      if (debug[4]) {
         console.log ('[process_topics] topics: ' + qwizdata[i_qwiz].topics.join ('; '));
      }

      // Set up statistics by topic.  Object of objects (list of lists).
      qwizdata[i_qwiz].topic_statistics = {};
      var n_topics = qwizdata[i_qwiz].topics.length;
      for (var i_topic=0; i_topic<n_topics; i_topic++) {
         var topic = qwizdata[i_qwiz].topics[i_topic];
         qwizdata[i_qwiz].topic_statistics[topic] = {};
         qwizdata[i_qwiz].topic_statistics[topic].n_correct = 0;
         qwizdata[i_qwiz].topic_statistics[topic].n_incorrect = 0;
      }
   }
}


// -----------------------------------------------------------------------------
this.restart_quiz = function (i_qwiz) {

   // Hide summary report.
   $ ('#summary-qwiz' + i_qwiz).hide ();

   qwizdata[i_qwiz].n_correct = 0;
   qwizdata[i_qwiz].n_incorrect = 0;

   // Reset qwizzled divs to original state (cloned in init_qwizzled ()).
   for (var id in qwizdata[i_qwiz].qwizzled) {
      $ ('div#' + id).replaceWith (qwizdata[i_qwiz].qwizzled[id]);

      // For reasons beyond me, it's necessary to re-initialize the cloned
      // object.
      qwizdata[i_qwiz].qwizzled[id] = $ ('div#' + id).clone (true);
   }


   for (var i_question=0; i_question<qwizdata[i_qwiz].n_questions; i_question++) {
      var qwizq_id = '#qwiz' + i_qwiz + '-q' + i_question;
      $ (qwizq_id).data ('answered_correctly', '');
   }

   var n_topics = qwizdata[i_qwiz].topics.length;
   for (var i_topic=0; i_topic<n_topics; i_topic++) {
      var topic = qwizdata[i_qwiz].topics[i_topic];
      qwizdata[i_qwiz].topic_statistics[topic].n_correct = 0;
      qwizdata[i_qwiz].topic_statistics[topic].n_incorrect = 0;
   }
   qwizdata[i_qwiz].i_question = -1;
   q.next_question (i_qwiz);
};


// -----------------------------------------------------------------------------
// "Start quiz" clicked.  If quiz may be recorded, and user not logged in, go
// to login rather than first question (if hasn't declined).
this.start_quiz = function (i_qwiz) {
   if (qwizdata[i_qwiz].qrecord_id) {
      var user_logged_in_b 
         = typeof (document_qwiz_user_logged_in_b) != 'undefined'
                                              && document_qwiz_user_logged_in_b;
      if (user_logged_in_b || declined_login_b) {

         q.next_question (i_qwiz);
      } else {
         q.display_login (i_qwiz);
      }
   } else {
      q.next_question (i_qwiz);
   }
}


// -----------------------------------------------------------------------------
this.next_question = function (i_qwiz) {

   var i_question = qwizdata[i_qwiz].i_question;

   var qwiz_id = 'qwiz' + i_qwiz;

   var n_questions = qwizdata[i_qwiz].n_questions;
   if (debug[0]) {
      console.log ('[next_question] i_question: ', i_question, ', n_questions: ', n_questions);
   }

   // If width was reset, set back.
   if (qwizdata[i_qwiz].width_reset) {
      $ ('#' + qwiz_id).css ('width', qwizdata[i_qwiz].initial_width + 'px');
      qwizdata[i_qwiz].width_reset = false;
   }

   // If was displaying intro and more than one question -- came from
   // "Start quiz" button...
   if (i_question == -1) {
      if (n_questions > 1) {

         // Hide intro (intro -- if any -- shows with the question of a single-
         // question quiz).
         $ ('#intro-' + qwiz_id).hide ();

         // If intro was showing, can hide qwiz icon now.
         if (! no_intro_b[i_qwiz]) {
            $ ('div.qwiz div#icon_qwiz' + i_qwiz).hide ();
         }

         // After "Start quiz", button is left-aligned.
         $ ('#next_button-qwiz' + i_qwiz).css ('text-align', 'left');

         // Also, show progress and change button text.  Only if more than one
         // question in quiz.
         display_progress (i_qwiz);
         $ ('#next_button_text-' + qwiz_id).html (T ('Next question'));
      } else {

         // Don't show mode.
         $ ('#mode-' + qwiz_id).css ('visibility', 'hidden');
      }

   } else {

      // Hide previous question.
      var qwizq_id = '#' + qwiz_id + '-q' + i_question;
      $ (qwizq_id).hide ();
   }

   // Hide "next" button until user makes a choice.
   if (! next_button_active_b) {
      $ ('#next_button-' + qwiz_id).hide ();

      // Record state.
      qwizdata[i_qwiz].next_button_show_b = false;
   }

   // Next question -- if repeating incorrect, keep running through questions
   // until all answered correctly.  If done, show summary/exit text.
   var n_done = qwizdata[i_qwiz].n_correct;
   if (! qwizdata[i_qwiz].repeat_incorrect_b) {
      n_done += qwizdata[i_qwiz].n_incorrect;
   }
   if (n_done == n_questions) {
      display_summary_and_exit (i_qwiz);
   } else {

      // If random order, start at random place to look for next not-yet-
      // answered-correctly question.
      if (qwizdata[i_qwiz].random_b) {
         i_question = Math.floor (Math.random () * n_questions);
      }
      while (true) {
         i_question++;
         if (i_question >= n_questions) {
            i_question = 0;
         }
         var qwizq_id = '#' + qwiz_id + '-q' + i_question;
         if (! $ (qwizq_id).data ('answered_correctly')) {
            break;
         }
      }
      qwizdata[i_qwiz].i_question = i_question;
      display_question (i_qwiz, i_question);
   }
};


// -----------------------------------------------------------------------------
function display_question (i_qwiz, i_question) {

   var qwizq_id = 'qwiz' + i_qwiz + '-q' + i_question;

   // Hide feedback in case previously displayed.  jQuery operator "^=" is for
   // "startswith."
   $ ('[id^=' + qwizq_id + ']').hide ();

   var qwizq_obj = $ ('#' + qwizq_id);
   var qwizzled_b = qwizq_obj.hasClass ('qwizzled');


   // If a labeled diagram, if previously-answered incorrectly, restore state.
   if (qwizzled_b) {
      if ($ ('#' + qwizq_id).data ('answered_correctly') == 0) {
         $ ('div#' + qwizq_id).replaceWith (qwizdata[i_qwiz].qwizzled[qwizq_id]);
         qwizq_obj = $ ('#' + qwizq_id);

         // As in restart_quiz (), re-initialize the cloned object.
         qwizdata[i_qwiz].qwizzled[qwizq_id] = $ ('div#' + qwizq_id).clone (true);
         if (debug[0]) {
            console.log ('[display_question] qwizq_id:', qwizq_id);
         }
      }

      // Also, reset progress bar.
      qwizdata[i_qwiz].n_labels_correct = 0;
      qwizdata[i_qwiz].n_label_attempts = 0;

      // This collects multiple spans if they're spread across a text target.
      // If don't have qtarget_sib... just count, but de-dup sibs.
      var n_label_targets = 0;
      var target_count = {};
      qwizq_obj.find ('div.qwizzled_target, span.qwizzled_target').each (function () {
         var classes = $ (this).attr ('class');
         var m = classes.match (/qtarget_sib-[0-9]*/);
         if (m) {
            var qwizzled_target_assoc_id = m[0];
            target_count[qwizzled_target_assoc_id] = 1;
         } else {

            // Backwards compatibility.
            m = classes.match (/qwizzled_target-[0-9]*/);
            if (m) {
               var qwizzled_target_assoc_id = m[0];
               target_count[qwizzled_target_assoc_id] = 1;
            } else {
               n_label_targets++;
            }
         }
      });
      qwizdata[i_qwiz].n_label_targets = n_label_targets + Object.keys (target_count).length;
      display_qwizzled_progress (i_qwiz);
   }

   qwizq_obj.show ();

   if (qwizzled_b) {

      // If layout table is wider than default qwiz width (defines border),
      // set wider for now.  Get width of table.  Add 10px for border and 
      // padding of qwiz div.
      var table_width = 10 + qwizq_obj.find ('table.qwizzled_table').outerWidth ();
      if (debug[0]) {
         console.log ('[display_question] table_width:', table_width, ', initial_width:', qwizdata[i_qwiz].initial_width);
      }
      if (table_width > qwizdata[i_qwiz].initial_width) {
         $ ('#qwiz' + i_qwiz).css ('width', table_width + 'px');

         // Set flag to reset width on next question.
         qwizdata[i_qwiz].width_reset = true;
      }
   } else {

      // See if this is a [textentry] question.
      if (qwizdata[i_qwiz].textentry && qwizdata[i_qwiz].textentry[i_question]) {

         // ....................................................................
         // [textentry] question.
         // Use terms given with [terms]...[/terms] for this quiz; otherwise
         // load default terms if haven't done so already.
         if (qwizdata[i_qwiz].terms) {

            // Only do this once per quiz.
            if (! qwizdata[i_qwiz].textentry_terms_metaphones) {
               qwizdata[i_qwiz].textentry_terms_metaphones = qqc.process_textentry_terms (qwizdata[i_qwiz].terms);
            }
         } else {
            if (! default_textentry_terms_metaphones) {
               var plugin_url = qqc.get_qwiz_param ('url', './');
               var terms_data = qqc.get_textentry_terms (plugin_url + 'terms.txt', qwizdata);
               default_textentry_terms_metaphones = qqc.process_textentry_terms (terms_data);
            }
         }

         // Also need to process additional terms for this quiz, if any.
         // Only do once per quiz.
         if (qwizdata[i_qwiz].add_terms) {
            if (! qwizdata[i_qwiz].add_textentry_terms_metaphones) {
               qwizdata[i_qwiz].add_textentry_terms_metaphones = qqc.process_textentry_terms (qwizdata[i_qwiz].add_terms);
            }
         }

         // Show "Check answer" and "Hint" buttons.  "Check answer" starts out
         // gray (but not actually disabled, so click provides alert message).
         // Hint starts out not visible.
         var check_answer_obj = $ ('#textentry_check_answer_div-qwiz' + i_qwiz);
         check_answer_obj.find ('button.textentry_check_answer').removeClass ('qbutton').addClass ('qbutton_disabled');
         qwizdata[i_qwiz].check_answer_disabled_b = true;
         check_answer_obj.find ('button.qwiz_textentry_hint').html ('Hint').hide ();
         check_answer_obj.show ();

         // Set focus to textentry box, if there is one.  Don't do if first
         // question and no intro (avoid scrolling page to this quiz).
         if (i_question != 0 || ! no_intro_b[i_qwiz]) {
            $ ('#textentry-qwiz' + i_qwiz + '-q' + i_question).val ('').focus ();
         }

         qwizdata[i_qwiz].check_answer_disabled_b = true;
         qwizdata[i_qwiz].textentry_n_hints = 0;

         // Calculate metaphones of answers -- both correct and incorrect  --
         // up to first blank following a non-blank.
         textentry_answers[i_qwiz] = qwizdata[i_qwiz].textentry[i_question].answers;
         textentry_answer_metaphones[i_qwiz]
            = textentry_answers[i_qwiz].map (function (answer) {
                                                answer = answer.replace (/\s*(\S+)\s.*/, '\$1');
                                                return qqc.metaphone (answer);
                                             })

         // List of terms (term, metaphone pairs) for this question: (1) default
         // or specific to this qwiz; plus (2) additional terms for this quiz,
         // if any; and (3) answers (correct and incorrect) for this question.
         // Singular or plural in each case.
         var singular_plural;
         if (qwizdata[i_qwiz].textentry[i_question].textentry_plural_b) {
            singular_plural = 'plural';
         } else {
            singular_plural = 'singular';
         }

         // (1) Quiz-specific or default.
         if (qwizdata[i_qwiz].terms) {
            current_question_textentry_terms_metaphones[i_qwiz] = qwizdata[i_qwiz].textentry_terms_metaphones[singular_plural];
         } else {
            current_question_textentry_terms_metaphones[i_qwiz] = default_textentry_terms_metaphones[singular_plural];
         }

         // (2) Additional.
         if (qwizdata[i_qwiz].add_terms) {
            current_question_textentry_terms_metaphones[i_qwiz] = current_question_textentry_terms_metaphones[i_qwiz].concat (qwizdata[i_qwiz].add_textentry_terms_metaphones[singular_plural]);
         }
         // (3) Answers.
         var textentry_answers_metaphones
            = textentry_answers[i_qwiz].map (function (answer) {
                                        return [answer, qqc.metaphone (answer)];
                                     });
         if (debug[5]) {
            console.log ('[display_question] textentry_answers_metaphones: ', textentry_answers_metaphones);
         }
         current_question_textentry_terms_metaphones[i_qwiz] = current_question_textentry_terms_metaphones[i_qwiz].concat (textentry_answers_metaphones);

         // Sort and de-dupe.
         current_question_textentry_terms_metaphones[i_qwiz]
            = qqc.sort_dedupe_terms_metaphones (current_question_textentry_terms_metaphones[i_qwiz]);

         if (debug[5]) {
            console.log ('[display_question] current_question_textentry_terms_metaphones[i_qwiz].length: ', current_question_textentry_terms_metaphones[i_qwiz].length);
            console.log ('[display_question] current_question_textentry_terms_metaphones[i_qwiz].slice (0, 10): ', current_question_textentry_terms_metaphones[i_qwiz].slice (0, 10));
            var i_start = current_question_textentry_terms_metaphones[i_qwiz].length - 10;
            if (i_start > 0) {
               console.log ('[display_question] current_question_textentry_terms_metaphones[i_qwiz].slice (' + i_start + '): ', current_question_textentry_terms_metaphones[i_qwiz].slice (i_start));
            }
         }

      } else {

         // ....................................................................
         // Multiple-choice question.
         // Enable radio clicks in case previously disabled for this question.
         // Also, show radios unclicked.
         $ ('input[name=' + qwizq_id + ']').removeAttr ('disabled').removeAttr ('checked');

         // Re-enable highlight choices on mouseover, cursor to indicate
         // clickable.
         $ ('.choices-' + qwizq_id).on ('mouseover', function () {
            $ (this).css ({'cursor': 'pointer', 'color': '#045FB4'})
         }).on ('mouseout', function () {;
            $ (this).css ({'cursor': 'text', 'color': 'black'})
         });
      }
   }
}


// -----------------------------------------------------------------------------
function process_question (i_qwiz, i_question, htm, opening_tags) {

   var new_htm;
   var remaining_htm;

   // Span for default indented paragraph style for choices.  Want this ahead of
   // any opening tags user put in before first "[c]".
   var span_pos = htm.search (/(<[^\/][^>]*>\s*)*?\[c\*{0,1}\]/m);
   if (span_pos == -1) {
      errmsgs.push (T ('Did not find choices ("[c]") for') + ' qwiz ' + (i_qwiz + 1) + ', ' + T ('question') + ' ' + (i_question + 1));
      new_htm = '';
      remaining_htm = '';
   } else {
      var question_htm = htm.substr (0, span_pos);
      if (debug[0]) {
         console.log ('[process_question] span_pos: ', span_pos);
         console.log ('[process_question] question_htm: ', question_htm);
      }

      // Wrap in div for this qwiz and question.
      new_htm =   '<div id="qwiz' + i_qwiz + '-q' + i_question + '" class="qwizq">\n'
                 +    opening_tags + question_htm;

      if (debug[1]) {
         console.log ('[process_question] new_htm: ', new_htm);
      }

      remaining_htm = htm.substr (span_pos);

      // Include paragraph-close -- without this, if there's a paragraph-close
      // within the choices that corresponds to a previous unclosed paragraph,
      // then the span won't work.
      new_htm += '</p><span class="qwiz-choices">';
   }

   // Do choice tags.  Change [c] to radio button, enclose text in span to
   // highlight on mouseover.  Choice text includes opening tags and
   // corresponding closing tags (if any), up to next [c] tag or first [f] tag.
   // Count choice tags.
   var choice_tags = htm.match (/\[c\*{0,1}\]/gm);
   var n_choices = 0;
   if (choice_tags) {
      n_choices = choice_tags.length;
   }
   if (debug[0]) {
      console.log ('[process_question] n_choices: ', n_choices);
   }

   var n_correct = 0;

   var choice_start_tags = ['[c]', '[c*]'];
   var choice_next_tags  = ['[c]', '[c*]', '[x]'];

   var got_feedback_b = false;
   var feedback_divs = [];
   var i_choice_correct = 0;
   for (var i_choice=0; i_choice<n_choices; i_choice++) {

      // Find choice text -- from opening tags through [c] or [c*] up to
      // opening tags for next tag.  Delete it from remaining_htm.
      var choice_html = parse_html_block (remaining_htm, choice_start_tags,
                                          choice_next_tags);
      remaining_htm = remaining_htm.substr (choice_html.length);

      // See if there's feedback within the choice html.
      var r = process_feedback_item (choice_html, i_qwiz, i_question, i_choice);
      choice_html  = r.choice_html;

      if (r.feedback_div) {

         // If this is the last choice, and didn't previously get feedback
         // with choices, then may have all feedback items together following
         // choice items (backwards compatibility).
         if (i_choice == n_choices-1 && ! got_feedback_b && n_choices != 1) {

            // Assume just got feedback for the first choice.  Create an empty
            // div for the last choice.
            feedback_divs[0] = r.feedback_div;
            feedback_divs.push ('');

            // Look for rest.
            var n_feedback_items = 1;
            for (var i_feedback=1; i_feedback<n_choices; i_feedback++) {
               var r = process_feedback_item (choice_html, i_qwiz, i_question,
                                              i_feedback);
               choice_html  = r.choice_html;
               if (! r.feedback_div) {
                  break;
               }
               feedback_divs[i_feedback] = r.feedback_div;
               n_feedback_items++;
            }

            // Either got just one feedback item (for last choice),
            // or should get one item for each choice.
            if (n_feedback_items == 1) {

               // Move that item to the last choice.
               feedback_divs[n_choices-1] = feedback_divs[0];
               feedback_divs[0] = '';
            } else {

               // Check got them all.
               if (n_feedback_items != n_choices) {
                  errmsgs.push (T ('Number of feedback items does not match number of choices') + ': qwiz ' + (1 + i_qwiz) + ', ' + T('question') + ' ' + (1 + i_question));
               } else {

                  // First feedback item needs to have ID updated to indicate
                  // really belongs to first choice.
                  feedback_divs[0] = feedback_divs[0].replace (/(qwiz[0-9]+-q[0-9]+-a)[0-9]+/, '\$10');
               }
            }
         } else {

            // Create a div for the feedback we just processed.
            got_feedback_b = true;
            feedback_divs.push (r.feedback_div);

            // Check that there's not more than one feedback item accompanying
            // this (not-last) choice.
            var r = process_feedback_item (choice_html, i_qwiz, i_question,
                                           i_feedback);
            if (r.feedback_div) {
               errmsgs.push (T ('More than one feedback shortcode [f] given with choice') + ': qwiz ' + (1 + i_qwiz) + ', ' + T ('question') + ' ' + (1 + i_question) + ', ' + T ('choice') + ' ' + (1 + i_choice));
            }
         }
      } else {

         // No feedback given for this choice.  Record with empty "div".
         feedback_divs.push ('');
      }

      if (n_choices > 1) {

         // Replace [c] or [c*] with radio button.
         var radio_button_html = create_radio_button_html (i_qwiz, i_question, i_choice, choice_tags[i_choice]);
         if (radio_button_html[0]) {
            n_correct++;
            i_choice_correct = i_choice;
         }
         choice_html = choice_html.replace (/\[c\*{0,1}\]/m, radio_button_html[1]);

         // Assemble with span to make choice clickable and highlight on
         // mouseover.  If starts with a paragraph or header tag, but does not
         // end with corresponding closing tag, move the span _after_ the 
         // opening tag.
         if (choice_html.substr (0, 2) == '<p' || choice_html.substr (0, 2) == '<h') {
            var len = choice_html.length;

            // len - 4 is third character from end. </p> </h1>
            //                                      4321 54321
            if (choice_html.substr (length - 4, 3) != '</p' 
                && choice_html.substr (length - 5, 3) != '</h') {
               var end_opening_tag_pos = choice_html.indexOf ('>');
               if (end_opening_tag_pos != -1) {
                  new_htm += choice_html.substr (0, end_opening_tag_pos + 1);
                  choice_html = choice_html.substr (end_opening_tag_pos + 1);
               }
            }
         }
         new_htm += '<span class="qwiz-choice choices-qwiz' + i_qwiz + '-q' + i_question + '" onclick="' + qname + '.process_choice (\'qwiz' + i_qwiz + '-q' + i_question + '-a' + i_choice + '\')">\n'
                    + choice_html + '</span>';
      } else {

         // Only one choice - do as regular button rather than radio.  Left
         // margin to clear Qwiz icon on first page.
         choice_html = choice_html.replace (/\[c\*{0,1}\]/m, '');
         n_correct = 1;
         new_htm += '<button class="qbutton" style="margin-left: 20px;" onclick="' + qname + '.process_choice (\'qwiz' + i_qwiz + '-q' + i_question + '-a' + i_choice + '\')">' + choice_html + '</button>\n';

         // Require feedback for "Show-the-answer" type question.
         if (! feedback_divs[0]) {
            errmsgs.push (T ('Feedback [f] is required for a one-choice question') + ': qwiz ' + (1 + i_qwiz) + ', ' + T ('question') + ' ' + (1 + i_question));
         }
      }
   }

   // Close span for default indented paragraph style for choices.
   new_htm += '</span>\n';

   // Include clearing div in case image floating left or right (needed to
   // expand parent div and its border).
   new_htm += '<div style="clear: both;"></div>\n';

   if (debug[1]) {
      console.log ('[process_question] new_htm: ', new_htm);
   }

   // Check that one and only one choice is marked correct.
   if (n_correct == 0) {
      errmsgs.push (T ('No choice was marked correct') + ': qwiz ' + (1 + i_qwiz) + ', ' + T ('question') + ' ' + (1 + i_question));
   } else if (n_correct > 1) {
      errmsgs.push (T ('More than one choice was marked correct') + ': qwiz ' + (1 + i_qwiz) + ', ' + T ('question') + ' ' + (1 + i_question));
   }

   // ..........................................................................
   // Create canned feedback for any empty feedback items
   for (var i_choice=0; i_choice<n_choices; i_choice++) {
      if (! feedback_divs[i_choice]) {
         var response = canned_feedback (i_choice == i_choice_correct);
         feedback_divs[i_choice] = create_feedback_div_html (i_qwiz, i_question,
                                                             i_choice, response);
      }
   }

   // Add feedback divs to html string.
   new_htm += feedback_divs.join ('\n');
   if (debug[2]) {
      console.log ('[process_question] new_htm: ', new_htm);
   }

   // Close question div.
   new_htm += '</div>\n';

   return new_htm;
}


// -----------------------------------------------------------------------------
function process_textentry (i_qwiz, i_question, htm, opening_tags) {

   // If this is first textentry question for this quiz, create data object.
   // Also set flag that there is [textentry] on this page.
   if (! qwizdata[i_qwiz].textentry) {
      qwizdata[i_qwiz].textentry = {};
      textentry_b = true;
   }

   // Wrap in div for this qwiz and question.
   var new_htm =   '<div id="qwiz' + i_qwiz + '-q' + i_question + '" class="qwizq">\n'
                 +    opening_tags + htm;

   // See if plurals specified.  Any attributes?
   var textentry_plural_b = false;
   var m = new_htm.match (/\[textentry([^\]]*)\]/m);
   if (m) {
      var attributes = m[1];
      if (attributes) {

         // Look for "plural=" attribute.  Match regular double-quote, or
         // left- or right-double-quote.
         attributes = qqc.replace_smart_quotes (attributes);
         textentry_plural_b = qqc.get_attr (attributes, 'plural') == 'true';
      }
   }

   // Replace [textentry] with input textbox.
   new_htm = new_htm.replace (/\[textentry([^\]]*)\]/, '<input type="text" id="textentry-qwiz' + i_qwiz + '-q' + i_question + '" class="qwiz_textentry" placeholder="' + T ('Type chars, then select from list') + '" onfocus="' + qname + '.set_textentry_i_qwiz (this)" />');

   // Look for choices and feedback (interleaved only, feedback optional).
   // Save as data, delete here.
   var n_correct = 0;

   var choice_start_tags = ['[c]', '[c*]'];
   var choice_next_tags  = ['[c]', '[c*]', '[x]'];

   var got_feedback_b = false;
   var feedback_divs = [];

   // Look for first [c], including any opening tags.
   var c_pos = new_htm.search (/\s*(<[^\/][^>]*\s*)*?\[c\*{0,1}\]/m); 

   // Start with [c]s.
   var remaining_htm = new_htm.substr (c_pos);

   // Up to first [c].
   new_htm = new_htm.substr (0, c_pos);
   var i_choice = 0;
   var default_choice_given_b = false;

   // Object for this question set to array of choices.
   qwizdata[i_qwiz].textentry[i_question] = {};
   qwizdata[i_qwiz].textentry[i_question].choices = [];
   qwizdata[i_qwiz].textentry[i_question].textentry_plural_b = textentry_plural_b;
   qwizdata[i_qwiz].textentry[i_question].choices_correct = [];
   qwizdata[i_qwiz].textentry[i_question].answers = [];
   qwizdata[i_qwiz].textentry[i_question].first_correct_answer = '';
   qwizdata[i_qwiz].check_answer_disabled_b = true;

   // Loop over [c]s.
   while (true) {
      var choice_html = parse_html_block (remaining_htm, choice_start_tags,
                                          choice_next_tags);
      if (choice_html == 'NA') {
         break;
      }
      remaining_htm = remaining_htm.substr (choice_html.length);

      // See if there's feedback within the choice html.
      var r = process_feedback_item (choice_html, i_qwiz, i_question, i_choice);
      choice_html  = r.choice_html;

      if (r.feedback_div) {
         got_feedback_b = true;

         feedback_divs.push (r.feedback_div);

         // Check that there's not more than one feedback item accompanying
         // this choice.
         var r = process_feedback_item (choice_html, i_qwiz, i_question,
                                        i_choice);
         if (r.feedback_div) {
            errmsgs.push (T ('More than one feedback shortcode [f] given with choice') + ': qwiz ' + (1 + i_qwiz) + ', ' + T ('question') + ' ' + (1 + i_question) + ', ' + T ('choice') + ' ' + (1 + i_choice));
         }
      } else {

         // No feedback given for this choice.  Record with empty "div".
         feedback_divs.push ('');
      }

      // Parse choice data.  [c] or [c*] followed by semicolon-separated list
      // of potential answers.
      var correct_b = choice_html.search (/\[c\*\]/) != -1;
      if (correct_b) {
         n_correct++;
      }

      // Delete up through [c] or [c*].
      choice_html = choice_html.replace (/.*\[c\*{0,1}\]/m, '');

      // Delete any tags and EOLs and non-breaking spaces.
      choice_html = choice_html.replace (/<[^>]+>|\n|&nbsp;/g, '');

      // Error if just blanks and semicolons.
      if (choice_html.replace (';', '').search (/\S/) == -1) {
         errmsgs.push (T ('No text given for [textentry] choice') + ' - qwiz ' + (i_qwiz + 1) + ', ' + T ('question') + ' ' + (1 + i_question) + ', ' + T ('choice') + ' ' + (1 + i_choice));
      }

      // Split on semicolons.
      var alts = choice_html.split (/\s*;\s*/);

      // Eliminate any blank entries.
      var nonblank_alts = [];
      for (var i=0; i<alts.length; i++) {
         if (alts[i].search (/\S/) != -1) {
            nonblank_alts.push (qqc.trim (alts[i]));
         }
      }

      // If default choice/feedback ("*" entered), set indicator.
      if (nonblank_alts[0] == '*') {
         default_choice_given_b = true;
         if (correct_b) {
            errmsgs.push (T ('For [textentry] question, wildcard choice ("*", for any other user entry) cannot be marked correct "[c*]"'));
         }
         if (feedback_divs[i_choice] == '') {
            errmsgs.push (T ('For [textentry] question, wildcard choice ("*", for any other user entry) must be accompanied by feedback "[f]"'));
         }
      }

      // Save these, associated with this choice.
      qwizdata[i_qwiz].textentry[i_question].choices.push (nonblank_alts);
      qwizdata[i_qwiz].textentry[i_question].choices_correct.push (correct_b);

      // Save first correct answer -- for hint.
      if (correct_b) {
         if (qwizdata[i_qwiz].textentry[i_question].first_correct_answer == '') {
            qwizdata[i_qwiz].textentry[i_question].first_correct_answer = nonblank_alts[0];
         }
      }

      // Also save as simple array for this question.  Make sure no duplicates
      // (wouldn't want same answer to be both correct and incorrect!).
      var n_alts = nonblank_alts.length;
      for (var i=0; i<n_alts; i++) {
         if (qwizdata[i_qwiz].textentry[i_question].answers.indexOf (nonblank_alts[i]) != -1) {
            errmsgs.push (T ('Answer given in more than one choice') + ': ' + nonblank_alts[i] + ' - qwiz ' + (i_qwiz + 1) + ', ' + T ('question') + ' ' + (1 + i_question) + ', ' + T ('choice') + ' ' + (1 + i_choice));
         }
      }
      qwizdata[i_qwiz].textentry[i_question].answers
                 = qwizdata[i_qwiz].textentry[i_question].answers.concat (nonblank_alts);
      i_choice++;
   }

   // If default choice not given, add it.
   if (! default_choice_given_b) {
      qwizdata[i_qwiz].textentry[i_question].choices.push (['*']);
      qwizdata[i_qwiz].textentry[i_question].choices_correct.push (false);
      i_choice++;
   }
   var n_choices = i_choice;

   // Include clearing div in case image floating left or right (needed to
   // expand parent div and its border).
   new_htm += '<div style="clear: both;"></div>\n';

   // Check that got at least one correct choice.
   if (n_correct == 0) {
      errmsgs.push (T ('No choice was marked correct') + ': qwiz ' + (1 + i_qwiz) + ', ' + T ('question') + ' ' + (1 + i_question));
   }

   // ..........................................................................
   // Create canned feedback for any empty feedback items
   for (var i_choice=0; i_choice<n_choices; i_choice++) {
      if (! feedback_divs[i_choice]) {
         var response = canned_feedback (qwizdata[i_qwiz].textentry[i_question].choices_correct[i_choice]);
         feedback_divs[i_choice] = create_feedback_div_html (i_qwiz, i_question,
                                                             i_choice, response);
      }
   }

   // Add feedback divs to html string.
   new_htm += feedback_divs.join ('\n');
   if (debug[2]) {
      console.log ('[process_textentry] new_htm: ', new_htm);
   }

   // Close question div.
   new_htm += '</div>\n';

   return new_htm;
}


// -----------------------------------------------------------------------------
function process_feedback_item (choice_html, i_qwiz, i_question, i_choice) {

   var feedback_start_tags = ['[f]'];
   var feedback_next_tags  = ['[f]', '[x]'];

   var feedback_item_html = parse_html_block (choice_html, feedback_start_tags,
                                              feedback_next_tags);
   var feedback_div = '';
   if (feedback_item_html != 'NA') {

      // Yes.  Take out of the choice html.
      choice_html = choice_html.replace (feedback_item_html, '');

      // Delete [f].
      feedback_item_html = feedback_item_html.replace (/\[f\]/, '');
      if (debug[2]) {
         console.log ('[process_feedback_item] feedback_item_html: ', feedback_item_html);
      }
      feedback_div = create_feedback_div_html (i_qwiz, i_question, i_choice,
                                               feedback_item_html)
   }
   if (debug[2]) {
      console.log ('[process_feedback_item] feedback_div:', feedback_div);
      console.log ('[process_feedback_item] choice_html:', choice_html);
   }

   return {'feedback_div': feedback_div, 'choice_html': choice_html};
}


// -----------------------------------------------------------------------------
function process_qwizzled (i_qwiz, i_question, question_htm, opening_tags,
                           question_tag) {

   if (debug[1]) {
      console.log ('[process_qwizzled] question_htm: ', question_htm);
   }

   // Labeled diagram.  First see that has been properly processed by qwizzled:
   // no unwrapped labels, and that each label has been associated with a
   // target.
   // DKTMP
   // ...

   // See if labels placement specified by "attribute", e.g., [q labels="top"].
   // Default is "right".  Find attributes, if any.
   var labels_position = '';
   var m = question_tag.match (/\[(<code><\/code>)*q([^\]]*)\]/m);
   if (m) {
      var attributes = m[2];
      if (attributes) {

         // Look for "labels=" attribute.  Match regular double-quote, or
         // left- or right-double-quote.
         attributes = qqc.replace_smart_quotes (attributes);
         labels_position = qqc.get_attr (attributes, 'labels');
         labels_position = labels_position.toLowerCase ();
         if (debug[0]) {
            console.log ('[process_qwizzled] labels_position:', labels_position);
         }
      }
   }

   // Begin with standard question div, plus beginning of layout table --
   // "canvas" on left, labels on right, and feedback below both.
   // canvas div will get turned into <td.
   var new_htm = '<div id="qwiz' + i_qwiz + '-q' + i_question
                 + '" class="qwizq qwizzled" onmouseover="' + qname + '.init_drag_and_drop (this)">'
                 + '<table class="qwizzled_table">'
                 + '<tr>' + question_htm;
   if (debug[1]) {
      console.log ('[process_qwizzled] new_htm: ', new_htm);
   }

   // Turn "canvas" div into table cell.  Find extent of div.
   var canvas_div_pos = new_htm.search ('<div class="qwizzled_canvas">');
   if (canvas_div_pos == -1) {
      errmsgs.push (T ('Did not find target "drop-zones" for labels.  Please check that all labels and target "drop zones" were correctly processed and saved during the edit of this page.') + '  qwiz ' + (i_qwiz + 1) + ', ' + T ('question') + ' ' + (i_question + 1));
      return '';
   }
   var div_html = find_matching_block (new_htm.substr (canvas_div_pos));
   if (! div_html) {
      errmsgs.push ('Did not find end of image area.  Please check that all labels and target "drop zones" were correctly processed and saved during the edit of this page.');
      return '';
   }
   var remaining_htm = new_htm.substr (canvas_div_pos + div_html.length);
   new_htm = new_htm.substr (0, canvas_div_pos + div_html.length);

   // Just change "div" to "td".  Can keep class.
   var td_canvas = '<td' + div_html.substring (4, div_html.length - 4) + 'td>';

   // Add on label cell and feedback cell.
   var td_labels_style = '';
   if (labels_position == 'left') {
      td_labels_style = ' style="padding-right: 5px;"'
   }
   var td_labels_add_class = '';
   if (labels_position != 'top' && labels_position != 'bottom') {
      td_labels_add_class = ' qwizzled_labels_left_right';
   }
   var td_labels   = '<td class="qwizzled_labels' + td_labels_add_class + '"' + td_labels_style + '>'
                   +    '<div class="qwizzled_labels_border">'
                   +        'Q-LABELS-Q'
                   +        '<div style="clear: both;"></div>\n';
                   +    '</div>'
                   + '</td>';
   var td_feedback = '<td class="qwizzled_feedback" colspan="2">QWIZZLED-FEEDBACK-Q</td>';
                 //+ '</tr>'
                 //+ '</table>';

   // Different table setups (after first "<tr">, already in new_htm, above.
   var table_html;
   if (labels_position == "top") {
      table_html =            td_labels + '</tr>'
                   + '<tr>' + td_canvas + '</tr>';
   } else if (labels_position == "bottom") {
      table_html =            td_canvas + '</tr>'
                   + '<tr>' + td_labels + '</tr>';
   } else if (labels_position == "left") {
      table_html =            td_labels + td_canvas + '</tr>';
                   + '<tr>' + td_canvas + '</tr>';
   } else {

      // Default ("right").
      table_html =            td_canvas + td_labels + '</tr>';
                   + '<tr>' + td_canvas + '</tr>';
   }
   if (debug[0]) {
      console.log ('[process_qwizzled] table_html.substr (0, 40):', table_html.substr (0, 40));
   }

   // Feedback is always below.  Finish table.
   table_html +=      '<tr>' + td_feedback + '</tr>'
                 + '</table>';

   new_htm = new_htm.replace (div_html, table_html);

   // Take out the (possibly "encoded", if old style) [q].
   new_htm = new_htm.replace (/\[(<code><\/code>)*q[^\]]*\]/, '');

   if (debug[0]) {
      console.log ('[process_qwizzled] new_htm:', new_htm);
      console.log ('[process_qwizzled] remaining_htm:', remaining_htm);
   }

   // . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
   // Process labels and feedback -- feedback is optional, but must immediately
   // follow label, if given.  Do label by label -- look for feedback associated
   // with each.  First take out [<code></code>l] (old style) or [l].
   remaining_htm = remaining_htm.replace (/\[(<code><\/code>)*l\]/gm, '');
   var label_divs = [];
   var i_label = 0;
   while (true) {
      var label_div_pos = remaining_htm.search (/<div class="qwizzled_label/m);
      if (label_div_pos == -1) {
         break;
      }
      var label_div = find_matching_block (remaining_htm.substr (label_div_pos));

      // Number the labels with id.  Make bulleted list.
      var new_label_div = '<li><div id="label-qwiz' + i_qwiz + '-q' + i_question + '-a' + i_label + '"'
                          + label_div.substr (4) + '</li>';
      label_divs.push (new_label_div);
      remaining_htm = remaining_htm.replace (label_div, '');
      i_label++;
   }
   if (debug[0]) {
      console.log ('[process_qwizzled] label_divs:', label_divs.join ('\n'));
      console.log ('[process_qwizzled] remaining_htm:', remaining_htm);
   }

   // Put labels in labels area.
   var label_head = '<p class="qwizzled_label_head">Move each item to its correct <span class="qwizzled_target_border">place</span></p>';
   var ul;
   if (labels_position == "top" || labels_position == "bottom") {
      ul = '<ul class="qwizzled_labels qwizzled_labels_inline">';
   } else {
      ul = '<ul class="qwizzled_labels qwizzled_labels_std">';
   }
   new_htm = new_htm.replace ('Q-LABELS-Q', label_head + ul + label_divs.join ('\n') + '</ul>');

   // ..........................................................................
   // Process feedback -- [f*] (label correctly placed) and [fx] (label not
   // correctly placed).
   var feedback_html = remaining_htm;
   var feedback_divs = [];
   var feedback_start_tags = ['[f*]', '[fx]'];
   var feedback_next_tags = ['[f*]', '[fx]', '[x]'];
   var i_item = 0;
   while (true) {
      var feedback_item_html 
                       = parse_html_block (feedback_html, feedback_start_tags,
                                           feedback_next_tags);
      if (feedback_item_html == 'NA') {
         break;
      }

      // Take item out of remaining html.
      feedback_html = feedback_html.replace (feedback_item_html, '');

      // Flag which are correct and which not.
      var c_x;
      if (feedback_item_html.search (/\[f\*\]/) != -1) {
         c_x = 'c';
      } else {
         c_x = 'x';
      }

      // Delete [f*] or [fx].
      feedback_item_html = feedback_item_html.replace (/\[f[\*x]\]/, '');

      if (debug[2]) {
         console.log ('[process_qwizzled] feedback_item_html: ', feedback_item_html);
      }

      // Create a div for each.
      feedback_divs.push (
            create_feedback_div_html (i_qwiz, i_question, parseInt (i_item/2),
                                      feedback_item_html, c_x)
      );
      i_item++;
   }

   // Take the question closing div off the last item.
   var n_feedback_items = feedback_divs.length;
   var len = feedback_divs[n_feedback_items - 1].length; 
   feedback_divs[n_feedback_items - 1] = feedback_divs[n_feedback_items - 1].replace (/<\/div>\s*/m, '')

   // Check that number of feedback items corresponds to number of labels.
   var n_labels = label_divs.length;
   if (n_labels*2 != n_feedback_items) {
      errmsgs.push (T ('Number of feedback items') + ' (' + n_feedback_items + ') ' + T ('does not match number of labels') + ' (' + n_labels + '): qwiz ' + (1 + i_qwiz) + ', question ' + (1 + i_question) + ' labeled diagram' + '\n'
                    + '(' + T ('There should be two feedback items -- correct and incorrect -- for each label') + ')');
   }

   // Add final feedback div.
   var htm = '<div class="qwiz-feedback" id="qwiz' + i_qwiz + '-q' + i_question + '-ff"></div>\n';
   feedback_divs.push (htm);

   new_htm = new_htm.replace ('QWIZZLED-FEEDBACK-Q', feedback_divs.join (''));

   // Close question div.
   new_htm += '</div>\n';

   if (debug[2]) {
      console.log ('[process_qwizzled] new_htm: ', new_htm)
   }

   return new_htm;
}


// -----------------------------------------------------------------------------
this.init_drag_and_drop = function (qwizq_elm) {

   if (debug[0]) {
      console.log ('[init_drag_and_drop] qwizq_elm:', qwizq_elm);
   }
   var qwizq_obj = $ (qwizq_elm);

   // Do this only once for this qwizzled question.  Remove attribute.
   qwizq_obj.removeAttr ('onmouseover');

   qwizq_obj.find ('td.qwizzled_labels div.qwizzled_label').each (function () {
      if (debug[0]) {
         console.log ('[init_drag_and_drop] \'td.qwizzled_labels div.qwizzled_label\':', $ (this));
         console.log ('                       parents (\'.qwizq\':', $ (this).parents ('.qwizq'));
      }
      $ (this).draggable ({
         containment:   $ (this).parents ('table.qwizzled_table'),
         start:         function (event, ui) {

                           // If label previously incorrectly placed, reset
                           // things ("try again").
                           q.label_dragstart ($ (this));
                        },
      }).addClass ('qwizzled_label_unplaced');
   });

   // Targets as drop zones.  Droppable when pointer over target.
   qwizq_obj.find ('.qwizzled_target').droppable ({
      accept:           '.qwizzled_label',
      hoverClass:       'qwizzled_target_hover',
      drop:             function (event, ui) {

                           // Provide feedback, next-step options.
                           q.label_dropped ($ (this), ui.draggable);
                        },
      tolerance:        'pointer',
   });
}


// -----------------------------------------------------------------------------
function find_matching_block (htm) {

   var htm_block = '';

   // Whatever this block of htm starts with ("<div", for example), find 
   // htm up to matching close ("</div>" in this case).
   var m = htm.match (/<([^\s>]+)/);
   var tag = m[1];

   // Look through for opening/closing tags.
   var len = htm.length;
   var i = 3;
   var i_level = 0;
   while (i < len) {
      if (htm[i] == '<') {

         // Ignore old-style breaks.
         if (htm.substr (i, 4) == '<br>') {
            i += 3;
            continue;
         } else if (htm.substr (i, 4) == '<img') {

            // Images appear to be old-style (end with '>', not '/>').
            // Search for end of image.
            i += 3;
            while (i < len) {
               i++;
               if (htm[i] == '>') {
                  break;
               }
            }
            continue
         }
         i++;
         if (htm[i] == '/') {
            if (i_level <= 0) {

               // This is closing tag.
               htm_block = htm.substring (0, i + tag.length + 2);
               break;
            }
            i_level--;
         } else {
            i_level++;
         }
      } else if (htm[i] == '/') {
         i++;
         if (htm[i] == '>') {
            i_level--;
         }
      }
      i++;
   }
   if (debug[0]) {
      console.log ('[find_matching_block] htm_block:', htm_block);
   }

   return htm_block;
}


// -----------------------------------------------------------------------------
function tags_to_pat (tags) {
   var tags_pat = '(' + tags.join (')|(') + ')';
   tags_pat = tags_pat.replace (/([\[\]\*])/g, '\\$1');
   tags_pat = '((' + tags_pat + ')\\s*)';
   
   return tags_pat;
}


// -----------------------------------------------------------------------------
// Parse out block of html -- from opening tags, through one of qwiz/qcard
// "tags" up to any opening tags of next qwiz/qcard tags.
function parse_html_block (htm, qtags, qnext_tags, ignore_nbsp_b) {

   if (debug[0]) {
      console.log ('[parse_html_block] qtags: ', qtags, ', htm: ', htm);
   }

   // String is presumably "return whitespace".  Flag to do so only if is all
   // whitespace (including empty paragraphs).
   var return_whitespace_b = typeof (ignore_nbsp_b) == 'string';

   // Add a default "end" shortcode that will always be found.
   var ZendZ = '[ZendZ]';
   htm += ZendZ;
   qnext_tags.push (ZendZ);

   // Include opening tags before the qwiz/qcard tags in each case.
   // -- a series of opening tags with possible whitespace in between, but
   // nothing else.
   var opening_pat = '(\\s*(<[^/][^>]*>\\s*)*?)'; 
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
   if (htm_match) {
      htm_block = htm_match[2];

      // Take off default end shortcode if was found.
      htm_block = htm_block.replace (ZendZ, '');

      // If htm is only tags and whitespace, set to empty string.
      var htm_wo_tags = htm_block.replace (/<[^>]+>/gm, '');

      // If flag set, also ignore &nbsp;
      if (ignore_nbsp_b != undefined) {
         htm_wo_tags = htm_wo_tags.replace (/&nbsp;/gm, '');
      }
      var is_whitespace_b = htm_wo_tags.search (/\S/) == -1;
      if (is_whitespace_b) {
         if (! return_whitespace_b) {
            htm_block = '';
         }
      /*
      } else {
         var i_qnext_tag = 7 + qtags.length;
         var qnext_tag = htm_match[i_qnext_tag];
         if (qnext_tag && qnext_tag[1] == '/') {
            htm_block += qnext_tag;
         }
         var i_closing_tags = i_qnext_tag + 2 + qnext_tags.length;
         var closing_tags = htm_match[i_closing_tags];
         if (closing_tags) {
            htm_block += closing_tags;
         }
      */
      }

      // If returning only whitespace, and not all whitespace, return empty
      // string.
      if (return_whitespace_b && ! is_whitespace_b) {
         htm_block = '';
      }
   } else {

      // Didn't find tag-closing tag combo.
      htm_block = 'NA';
   }
   if (debug[0]) {
      console.log ('[parse_html_block] htm_block: ', htm_block);
   }

   return htm_block;
}


// -----------------------------------------------------------------------------
// If [h] (or [H]), capture header tag/text, including opening tags before
// [h], up to intro ([i]) if allowed, or question ([q]).  Delete header from
// intro.
function process_header (htm, i_qwiz, i_question, intro_b) {
   var qtags = ['[h]'];
   var qnext_tags = ['[q]', '[q ', '<div class="qwizzled_question">'];
   if (intro_b != undefined) {
      qnext_tags.push ('[i]');
   }

   // Global variable.  Limit to first 1000 characters.
   header_html = parse_html_block (htm.substr (0, 1000), qtags, qnext_tags);
   if (header_html != 'NA' && header_html != '') {

      // Error if text before [h].
      if (htm.substr (0, 5) != header_html.substr (0, 5)) {
         errmsgs.push (T ('Text before header') + ' [h] - qwiz ' + (i_qwiz + 1));
      }

      // Delete header from htm.
      htm = htm.replace (header_html, '');

      // Delete [h] from header.
      header_html = header_html.replace (/\[h\]/ig, '');

      // Delete line-breaks from header.
      header_html = header_html.replace (/<br.*?>/ig, '');
   }

   return htm;
}


// -----------------------------------------------------------------------------
function display_summary_and_exit (i_qwiz) {

   var report_html = [];

   // Overall.
   var n_questions = qwizdata[i_qwiz].n_questions;
   var n_correct   = qwizdata[i_qwiz].n_correct;
   var n_incorrect = qwizdata[i_qwiz].n_incorrect;

   if (qwizdata[i_qwiz].repeat_incorrect_b) {
      report_html.push ('<p><b>Congratulations, you\'re done!</b></p>');
      if (n_incorrect == 0) {
         report_html.push ('<p>In this ' + qqc.number_to_word (n_questions) + '-question quiz, you answered every question correctly on the first try!</p>');
      } else {
         report_html.push ('<p>In finishing this ' + qqc.number_to_word (n_questions) + '-question quiz, you entered ' + qqc.number_to_word (n_incorrect) + ' incorrect ' + Tplural ('answer', 'answers', n_incorrect) + '.</p>');
      }
   } else {
      if (n_incorrect == 0) {
         report_html.push ('<p>' + T ('Congratulations, you answered all questions correctly') + '.</p>');
      } else {
         report_html.push ('<p>' + T ('Your score is') + ' ' + qqc.number_to_word (n_correct) + ' ' + T ('out of') + ' ' + qqc.number_to_word (n_questions) + ' ' + T ('questions') + '.</p>');
      }
   }

   var n_topics = qwizdata[i_qwiz].topics.length;
   if (n_topics == 1) {
      var topic = qwizdata[i_qwiz].topics[0];
      var all_both_n;
      if (n_questions == 2) {
         all_both_n = T ('Both');
      } else {
         all_both_n = T ('All') + ' '+ qqc.number_to_word (n_questions);
      }
      report_html.push ('<p>' + all_both_n + ' ' + Tplural ('question', 'questions', n_questions) + ' were about topic &ldquo;' + topic + '.&rdquo;</p>');
   } else if (n_topics > 1) {

      // By topic.
      report_html.push ('<ul>');
      for (var i_topic=0; i_topic<n_topics; i_topic++) {
         var topic = qwizdata[i_qwiz].topics[i_topic];
         var n_topic_correct = qwizdata[i_qwiz].topic_statistics[topic].n_correct;
         var n_topic_incorrect = qwizdata[i_qwiz].topic_statistics[topic].n_incorrect;
         var n_topic_items = n_topic_correct + n_topic_incorrect;
         if (n_topic_items > 0) {
            var topic_html = '<li>';
            topic_html += T ('For topic') + ' &ldquo;' + topic + '&rdquo; ' + Tplural ('there was', 'there were', n_topic_items) + ' ' + qqc.number_to_word (n_topic_items) + ' ' + Tplural ('question', 'questions', n_topic_items) + '.&nbsp;';
            if (n_topic_incorrect == 0) {
               if (n_topic_items > 2) {
                  topic_html += T ('You answered all of these questions correctly');
               } else if (n_topic_items == 2) {
                  topic_html += T ('You answered both of these questions correctly');
               } else {
                  topic_html += T ('You answered this question correctly');
               }
               if (qwizdata[i_qwiz].repeat_incorrect_b) {
                  topic_html += ' ' + T ('on the first try.');
               } else {
                  topic_html += '.';
               }
            } else {
               if (qwizdata[i_qwiz].repeat_incorrect_b) {
                  var n_tries = n_topic_items + n_topic_incorrect;
                  topic_html += Tplural ('It took you one try', 'It took you %s tries', n_tries) + ' ' + Tplural ('to answer this question correctly', 'to answer these questions correctly', n_topic_items) + '.';
                  topic_html = topic_html.replace ('%s', qqc.number_to_word (n_tries));
               } else {
                  topic_html += T ('Your score is %s correct out of %s') + '.';
                  topic_html = topic_html.replace ('%s', qqc.number_to_word (n_topic_correct));
                  topic_html = topic_html.replace ('%s', qqc.number_to_word (n_topic_items));
               }
            }
            topic_html += '</li>';
            report_html.push (topic_html);
         }
      }
      report_html.push ('</ul>');
   }

   // Place in report div.
   $ ('#summary_report-qwiz' + i_qwiz).html (report_html.join ('\n'));

   // Show summary div.
   $ ('#summary-qwiz' + i_qwiz).show ();
}


// -----------------------------------------------------------------------------
function check_qwiz_tag_pairs (htm) {

   var new_htm = '';

   // Match "[qwiz]" or "[/qwiz]".
   var matches = htm.match (/\[qwiz|\[\/qwiz\]/gm);
   if (matches) {
      var n_tags = matches.length;
      var error_b = false;

      if (n_tags % 2 != 0) {
         error_b = true;
      } else {

         // Check proper pairs.
         for (var i=0; i<n_tags; i++) {
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

         // If we're inside an excerpt, no error.  Delete from '[qwiz]' up to
         // '<p class="more-link' if possible,  In any event non-null return
         // signals not to process.
         if (htm.search ('more-link') != -1) {

            var pos_qwiz = htm.search (/\[qwiz/);
            var pos_more = htm.search ('<p class="more-link');
            if (pos_more != -1) {
               new_htm = htm.substring (0, pos_qwiz) + htm.substr (pos_more);
            } else {
               new_htm = htm;
            }
         } else {
            alert (T ('Unmatched [qwiz] - [/qwiz] pairs.'));
         }
      }
   }

   return new_htm;
}


// -----------------------------------------------------------------------------
function create_radio_button_html (i_qwiz, i_question, i_choice, choice_tag) {
   var htm = '';

   // Data attribute to mark correct choice.
   var data_correct = '';
   var correct = 0;
   if (choice_tag == '[c*]') {
      data_correct = 'data-correct="1" ';
      correct = 1;
   }
   htm += '<input type="radio" id="radio-qwiz' + i_qwiz + '-q' + i_question + '-a' + i_choice + '" name="qwiz' + i_qwiz + '-q' + i_question + '" ' + data_correct + ' style="border: none;" onclick="' + qname + '.process_choice (\'qwiz' + i_qwiz + '-q' + i_question + '-a' + i_choice + '\')" />\n';

   if (debug[1]) {
      console.log ('[create_radio_button_html] htm: ', htm);
   }

   return [correct, htm];
}


// -----------------------------------------------------------------------------
this.process_choice = function (feedback_id) {

   // Hide others, show this one.
   // feedback_id looks like:  qwiz0-q0-a0
   //                          (qwiz #, question #, answer #).
   // Identify quiz and question.  Greedy search matches to final "-".
   var matches = feedback_id.match (/(.*)-/);
   qwizq_id = matches[1];

   // Qwiz number.  Non-greedy search.
   var qwiz_id = feedback_id.match (/(.*?)-/)[1];
   i_qwiz = parseInt (qwiz_id.substr (4));
   if (debug[0]) {
      console.log ('[process_choice] feedback_id: ', feedback_id, ', qwizq_id: ', qwizq_id, ', i_qwiz: ', i_qwiz);
   }

   // Don't do if already disabled.
   var disabled = $ ('input[name=' + qwizq_id + ']').attr ('disabled');
   if (disabled != 'disabled') {

      $ ('#' + qwizq_id + ' .qwiz-feedback').hide ();
      $ ('#' + feedback_id).show ();

      // In case clicked on text rather than radio, show radio as clicked.
      // If one-choice question, substituted button for radio, so skip.
      // For some reason, jQuery method not working!
      //$ ('#radio-' + feedback_id).attr ('checked', true);
      var correct_f = true;
      var elm = document.getElementById ('radio-' + feedback_id);
      if (elm) {
         elm.checked = true;

         // Disable further radio clicks for this question.
         $ ('input[name=' + qwizq_id + ']').attr ('disabled', true);

         // Also, don't show pointer cursor on paragraphs, and turn off highlighting.
         $ ('.choices-' + qwizq_id).on('mouseover', function () {
            $ (this).css ({'cursor': 'text', 'color': 'black'})
         });

         correct_f = $ ('#radio-' + feedback_id).data ('correct');
      }

      // Record statistics.
      if (correct_f) {
         qwizdata[i_qwiz].n_correct++;

         // Also, mark this question as correct.
         $ ('#' + qwizq_id).data ('answered_correctly', 1);

      } else {

         // Record number of incorrect responses.
         qwizdata[i_qwiz].n_incorrect++;

         // If not repeating incorrect, record incorrect response.
         if (! qwizdata[i_qwiz].repeat_incorrect_b) {
            $ ('#' + qwizq_id).data ('answered_correctly', 0);
         }
      }

      // If topics, statistics by topics this question.
      var i_question = feedback_id.match (/-q([0-9]+)-/)[1];
      update_topic_statistics (i_qwiz, i_question, correct_f);

      // If no separate intro page, hide qwiz icon now.
      if (i_question == 0 && (no_intro_b[i_qwiz]
                                        || qwizdata[i_qwiz].n_questions == 1)) {
         $ ('div.qwiz div#icon_qwiz' + i_qwiz).hide ();
      }

      // Update progress and show next button -- only if more than one question.
      update_progress_show_next (i_qwiz);
   }
};


// -----------------------------------------------------------------------------
function update_topic_statistics (i_qwiz, i_question, correct_f) {
   var question_topics = qwizdata[i_qwiz].question_topics[i_question];
   if (question_topics) {
      for (var ii=0; ii<question_topics.length; ii++) {
         var topic = question_topics[ii];
         if (correct_f) {
            qwizdata[i_qwiz].topic_statistics[topic].n_correct++;
         } else {
            qwizdata[i_qwiz].topic_statistics[topic].n_incorrect++;
         }
      }
   }
}


// -----------------------------------------------------------------------------
function update_progress_show_next (i_qwiz) {
   if (qwizdata[i_qwiz].n_questions > 1) {
      display_progress (i_qwiz);

      // "next" button.  If finished, change text.
      var n_done = qwizdata[i_qwiz].n_correct;
      if (! qwizdata[i_qwiz].repeat_incorrect_b) {
         n_done += qwizdata[i_qwiz].n_incorrect;
      }
      if (n_done == qwizdata[i_qwiz].n_questions) {
         $ ('#next_button_text-qwiz' + i_qwiz).html (T ('View summary report'));
      }
      $ ('#next_button-qwiz' + i_qwiz).show ();

      // Record state.
      qwizdata[i_qwiz].next_button_show_b = true;
   }
}


// -----------------------------------------------------------------------------
function display_progress (i_qwiz) {

   var progress_html;
   var n_attempts = qwizdata[i_qwiz].n_correct + qwizdata[i_qwiz].n_incorrect;
   var n_done = qwizdata[i_qwiz].n_correct;
   if (! qwizdata[i_qwiz].repeat_incorrect_b) {
      n_done += qwizdata[i_qwiz].n_incorrect;
   }
   var n_to_go = qwizdata[i_qwiz].n_questions - n_done;

   if (n_attempts == 0) {
      progress_html = T ('Questions in this quiz:') + ' ' + n_to_go;
   } else {
      progress_html = qwizdata[i_qwiz].n_questions + ' ' + T ('questions') + ', ' + n_attempts + ' ' + Tplural ('response', 'responses', n_attempts) + ', ' + qwizdata[i_qwiz].n_correct + ' ' + T ('correct') + ', ' + qwizdata[i_qwiz].n_incorrect + ' ' + T ('incorrect') + ', ' + n_to_go + ' ' + T ('to go');
   }
   $ ('#progress-qwiz' + i_qwiz).html (progress_html);
}


// -----------------------------------------------------------------------------
function display_qwizzled_progress (i_qwiz) {

   var i_question  = qwizdata[i_qwiz].i_question + 1;
   var n_questions = qwizdata[i_qwiz].n_questions;
   var progress_html = 'Q #' + i_question + '/' + n_questions + '; Correctly labeled ' + qwizdata[i_qwiz].n_labels_correct + ' out of ' + qwizdata[i_qwiz].n_label_targets + ' items';

   // Do show () in case single-question qwiz.
   $ ('#progress-qwiz' + i_qwiz).html (progress_html).show ();
}


// -----------------------------------------------------------------------------
function create_feedback_div_html (i_qwiz, i_question, i_item, item, c_x) {
                                                           
   var local_c_x = '';
   if (c_x != undefined) {
      local_c_x = c_x;
   }

   // Add "Try again" button to end of incorrect feedback, but put inside of
   // any closing tags (such as </p>) at end.
   /*
   var ii_pos;
   if (local_c_x == 'x') {
      var button_htm = '&nbsp; <button class="qwizzled_try_again" onclick="' + qname + '.try_again (' + i_qwiz + ', ' + i_question + ', ' + i_item + ')">Try again</button>';
      ii_pos = item.search (/((<\/[^>]*?>\s*)+)$/m);
      if (debug[0]) {
         console.log ('[create_feedback_div_html] closing tags ii_pos:', ii_pos);
      }
      if (ii_pos != -1) {
         item = item.substr (0, ii_pos) + button_htm + item.substr (ii_pos);
      } else {
         item += button_htm;
      }
   }
   */

   var htm = '<div class="qwiz-feedback" id="qwiz' + i_qwiz + '-q' + i_question + '-a' + i_item + local_c_x + '">\n';
   if (! local_c_x) {
      htm += '<hr style="margin: 0px;" />\n';
   }
   htm += item;

   // Include clearing div in case image floating left or right.
   htm += '<div style="clear: both;"></div>\n';
   htm += '</div>\n';
   if (debug[2]) {
      console.log ('[create_feedback_div_html] htm: ', htm)
   }

   return htm;
}


// -----------------------------------------------------------------------------
function canned_feedback (correct_b) {

   var response;
   if (correct_b) {
      var i = Math.floor (Math.random () * correct.length);
      response = correct[i];
   } else {
      var i = Math.floor (Math.random () * incorrect.length);
      response = incorrect[i];
   }
   response = '<p><strong>' + response + '</strong></p>';

   if (debug[0]) {
      console.log ('[canned_feedback] response:', response);
   }
   return response;
}


// -----------------------------------------------------------------------------
var find_matching_terms = function (request, response) {

   // If no separate intro page, and this is first question, hide qwiz icon.
   if (qwizdata[textentry_i_qwiz].i_question == 0 
                         && (no_intro_b[textentry_i_qwiz] 
                             || qwizdata[textentry_i_qwiz].n_questions == 1)) {
      $ ('div.qwiz div#icon_qwiz' + textentry_i_qwiz).hide ();
   }

   var entry = request.term.toLowerCase ();
   var entry_metaphone = qqc.metaphone (entry);
   if (debug[5]) {
      console.log ('[find_matching_terms] entry_metaphone; ', entry_metaphone);
   }

   // See if first character of entry metaphone matches first character of any
   // answer metaphone.  If so, determine shortest answer metaphone that
   // matches.
   var required_entry_length = 100;
   var required_metaphone_length = 100;
   for (var i=0; i<textentry_answer_metaphones[textentry_i_qwiz].length; i++) {
      if (entry[0] == textentry_answers[textentry_i_qwiz][i][0].toLowerCase ()) {
         required_entry_length = Math.min (required_entry_length, textentry_answers[textentry_i_qwiz][i].length);
         if (debug[5]) {
            console.log ('[find_matching_terms] entry[0]:', entry[0], ', textentry_answers[textentry_i_qwiz][i][0]:', textentry_answers[textentry_i_qwiz][i][0]);
         }
      }
      if (entry_metaphone[0] == textentry_answer_metaphones[textentry_i_qwiz][i][0]) {
         required_metaphone_length = Math.min (required_metaphone_length, textentry_answer_metaphones[textentry_i_qwiz][i].length);
         if (debug[5]) {
            console.log ('[find_matching_terms] textentry_answer_metaphones[textentry_i_qwiz][i]:', textentry_answer_metaphones[textentry_i_qwiz][i], ', required_metaphone_length:', required_metaphone_length);
         }
      }
   }
   if (required_entry_length != 100) {
      required_entry_length -= 2;
      required_entry_length = Math.min (5, required_entry_length);
   }

   if (required_metaphone_length != 100) {
      required_metaphone_length--;
      if (required_metaphone_length < 2) {
         required_metaphone_length = 2;
      } else if (required_metaphone_length > 4) {
         required_metaphone_length = 4;
      }
   }
   if (debug[5]) {
      console.log ('[find_matching_terms] required_entry_length:', required_entry_length, ', required_metaphone_length:', required_metaphone_length);
   }

   // Entry consisting of repeated single character doesn't count as "long".
   // Replace any three or more of same character in a row with just one.
   var deduped_entry = entry.replace (/(.)\1{2,}/gi, '\$1');
   if (deduped_entry.length < required_entry_length && entry_metaphone.length < required_metaphone_length) {
      textentry_matches[textentry_i_qwiz] = [];
      lc_textentry_matches[textentry_i_qwiz] = [];

   } else {
      if (debug[5]) {
         console.log ('[find_matching_terms] request.term:', request.term, entry_metaphone, entry_metaphone.length);
      }
      textentry_matches[textentry_i_qwiz] = $.map (current_question_textentry_terms_metaphones[textentry_i_qwiz], function (term_i) {
         if (term_i[1].indexOf (entry_metaphone) === 0 || term_i[0].toLowerCase ().indexOf (entry) === 0) {
            if (debug[5]) {
               console.log ('[find_matching_terms] term_i:', term_i);
            }
            return term_i[0];
         }
      });
      lc_textentry_matches[textentry_i_qwiz] 
         = textentry_matches[textentry_i_qwiz].map (function (item) {
                                                       return item.toLowerCase ();
                                                    });
      if (debug[5]) {
         console.log ('[find_matching_terms] textentry_matches[textentry_i_qwiz]:', textentry_matches[textentry_i_qwiz]);
      }
   }

   // If entry length five or more, and matches list does not include first
   // correct answer, and haven't used up hints, enable hint.
   if (debug[5]) {
      console.log ('[find_matching_terms] deduped_entry.length: ', deduped_entry.length, ', textentry_matches[textentry_i_qwiz].length: ', textentry_matches[textentry_i_qwiz].length, ', qwizdata[textentry_i_qwiz].textentry_n_hints: ', qwizdata[textentry_i_qwiz].textentry_n_hints);
   }
   if (deduped_entry.length >= 5 && qwizdata[textentry_i_qwiz].textentry_n_hints < 5) {
      var i_question = qwizdata[textentry_i_qwiz].i_question;
      var lc_first_correct_answer = qwizdata[textentry_i_qwiz].textentry[i_question].first_correct_answer.toLowerCase ();
      if (lc_textentry_matches[textentry_i_qwiz].indexOf (lc_first_correct_answer) == -1) {
         $ ('#textentry_check_answer_div-qwiz' + textentry_i_qwiz + ' button.qwiz_textentry_hint').removeAttr ('disabled').removeClass ('qbutton_disabled').addClass ('qbutton').show ();
      }
   }
   response (textentry_matches[textentry_i_qwiz]);
}


// -----------------------------------------------------------------------------
// When menu closed: if current entry doesn't fully match anything on the last
// set of matches, disable "Check answer".
function menu_closed (e) {

   // Do only if "Check answer" not already disabled.
   if (! qwizdata[textentry_i_qwiz].check_answer_disabled_b) {
      var lc_entry = e.target.value.toLowerCase ();
      if (debug[5]) {
         console.log ('[menu_closed] textentry_matches[textentry_i_qwiz]: ', textentry_matches[textentry_i_qwiz]);
      }
      if (lc_textentry_matches[textentry_i_qwiz].indexOf (lc_entry) == -1) {
         $ ('#textentry_check_answer_div-qwiz' + textentry_i_qwiz + ' button.textentry_check_answer').removeClass ('qbutton').addClass ('qbutton_disabled');
         qwizdata[textentry_i_qwiz].check_answer_disabled_b = true;
      }
   }
}


// -----------------------------------------------------------------------------
// When suggestion menu shown: (1) if the matches list shown includes the first
// correct answer, then set flag that hint not needed; (2) if current entry
// _fully_ matches anything on the matches list shown, then enable "Check
// answer"; otherwise disable "Check answer".
function menu_shown (e) {

   // Lowercase entry and matches list.
   var lc_entry = e.target.value.toLowerCase ();

   // Does matches list include first correct answer?
   var i_question = qwizdata[textentry_i_qwiz].i_question;
   var lc_first_correct_answer = qwizdata[textentry_i_qwiz].textentry[i_question].first_correct_answer.toLowerCase ();
   if (lc_textentry_matches[textentry_i_qwiz].indexOf (lc_first_correct_answer) != -1) {
      $ ('#textentry_check_answer_div-qwiz' + textentry_i_qwiz + ' button.qwiz_textentry_hint').attr ('disabled', true).removeClass ('qbutton').addClass ('qbutton_disabled');
   }
   if (lc_textentry_matches[textentry_i_qwiz].indexOf (lc_entry) != -1) {
      $ ('#textentry_check_answer_div-qwiz' + textentry_i_qwiz + ' button.textentry_check_answer').removeClass ('qbutton_disabled').addClass ('qbutton');
      qwizdata[textentry_i_qwiz].check_answer_disabled_b = false;
   } else {
      $ ('#textentry_check_answer_div-qwiz' + textentry_i_qwiz + ' button.textentry_check_answer').removeClass ('qbutton').addClass ('qbutton_disabled');
      qwizdata[textentry_i_qwiz].check_answer_disabled_b = true;
   }
}


// -----------------------------------------------------------------------------
this.textentry_check_answer = function (i_qwiz) {

   if (qwizdata[i_qwiz].check_answer_disabled_b) {
      alert (Tcheck_answer_message);
      return;
   }

   // Hide "Check answer" button div.
   $ ('#textentry_check_answer_div-qwiz' + i_qwiz).hide ();

   var i_question = qwizdata[i_qwiz].i_question;
   var entry = $ ('#textentry-qwiz' + i_qwiz + '-q' + i_question).val ().toLowerCase ();

   // See if entry among choices; identify default choice ("*").
   var i_choice = -1;
   var correct_b = false;
   var n_choices = qwizdata[i_qwiz].textentry[i_question].choices.length;
   var i_default_choice;
   for (var i=0; i<n_choices; i++) {
      var alts = qwizdata[i_qwiz].textentry[i_question].choices[i];
      if (alts[0] == '*') {
         i_default_choice = i;
      } else {
         var lc_alts = alts.map (function (item) {
                                    return item.toLowerCase ();
                                 });
         if (lc_alts.indexOf (entry) != -1) {

            // Yes, this one.  Correct?
            correct_b = qwizdata[i_qwiz].textentry[i_question].choices_correct[i];
            i_choice = i;
            break;
         }
      }
   }
   if (i_choice == -1) {
      i_choice = i_default_choice;
   }
   $ ('#qwiz' + i_qwiz + '-q' + i_question + '-a' + i_choice).show ();

   // Update statistics.
   if (correct_b) {
      qwizdata[i_qwiz].n_correct++;
      $ ('#qwiz' + i_qwiz + '-q' + i_question).data ('answered_correctly', 1);
   } else {

      // Record number of incorrect responses.
      qwizdata[i_qwiz].n_incorrect++;
      $ ('#qwiz' + i_qwiz + '-q' + i_question).data ('answered_correctly', 0);
   }
   update_topic_statistics (i_qwiz, i_question, correct_b);

   // Update progress and show next button -- only if more than one question.
   update_progress_show_next (i_qwiz);
}


// -----------------------------------------------------------------------------
// Provide first letters of first correct answer as hint, up to five letters.
this.textentry_hint = function (i_qwiz) {
   qwizdata[i_qwiz].textentry_n_hints++;

   var i_question = qwizdata[i_qwiz].i_question;
   var textentry_hint_val = qwizdata[i_qwiz].textentry[i_question].first_correct_answer.substr (0, qwizdata[i_qwiz].textentry_n_hints);
   $ ('#textentry-qwiz' + i_qwiz + '-q' + i_question).val (textentry_hint_val).focus ();

   // Disable hint button, reset label.
   $ ('#textentry_check_answer_div-qwiz' + i_qwiz + ' button.qwiz_textentry_hint').attr ('disabled', true).removeClass ('qbutton').addClass ('qbutton_disabled').html ('Add. hint');
}


// -----------------------------------------------------------------------------
this.set_textentry_i_qwiz = function (input_el) {

   // See which quiz this is.  Save in global (private) variable.
   // id looks like textentry-qwiz0-q0
   var id = input_el.id;
   textentry_i_qwiz = id.match (/[0-9]+/)[0];
   if (debug[5]) {
      console.log ('[set_textentry_i_qwiz] textentry_i_qwiz: ', textentry_i_qwiz);
   }
}


// -----------------------------------------------------------------------------
// When item selected, enable check answer.
function item_selected () {
   $ ('#textentry_check_answer_div-qwiz' + textentry_i_qwiz + ' button.textentry_check_answer').removeClass ('qbutton_disabled').addClass ('qbutton');
   qwizdata[textentry_i_qwiz].check_answer_disabled_b = false;
}


// -----------------------------------------------------------------------------
this.keep_next_button_active = function () {
   next_button_active_b = true;
   $ ('.next_button').show ();
}


// -----------------------------------------------------------------------------
this.display_login = function (i_qwiz) {

   // Close menu in case came from there.
   $ ('#usermenu-qwiz' + i_qwiz).hide ();

   if (qwizdata[i_qwiz].i_question == -1) {

      // Hide intro (intro -- if any -- shows with the question of a single-
      // question quiz).
      $ ('#intro-qwiz' + i_qwiz).hide ();

      // If intro was showing, can hide qwiz icon now.
      if (! no_intro_b[i_qwiz]) {
         $ ('div.qwiz div#icon_qwiz' + i_qwiz).hide ();
      }
   } else {

      // Hide current question.
      $ ('#qwiz' + i_qwiz + '-q' + qwizdata[i_qwiz].i_question).hide ();
   }

   // Don't show next button.
   $ ('#next_button-qwiz' + i_qwiz).hide ();

   $ ('#qwiz_login-qwiz' + i_qwiz).show ();

   $ ('#qwiz_username-qwiz' + i_qwiz).focus ();
}


// -----------------------------------------------------------------------------
function check_session_id (i_qwiz, qrecord_id) {

   // Get cookie, check if still valid (server call).
   var qwiz_session_id = $.cookie ('qwiz_session_id');

   var data = {qwiz_session_id: qwiz_session_id};
   qqc.jjax (qname, i_qwiz, qrecord_id, '', 'check_session_id', data);
}


// -----------------------------------------------------------------------------
this.login = function (i_qwiz) {

   // If previously declined login option, unset cookie and local flag.
   $.removeCookie ('qwiz_declined_login', {path: '/'});
   declined_login_b = false;

   // Have we got username and password?
   var username_obj = $ ('#qwiz_username-qwiz' + i_qwiz);
   var username = username_obj.val ();
   if (! username ) {
      alert (T ('Please enter User name'));
      username_obj.focus ();
      return;
   }
   document_qwiz_username = username;

   var password_obj = $ ('#qwiz_password-qwiz' + i_qwiz);
   var password = password_obj.val ();
   if (! password) {
      alert (T ('Please enter Password'));
      password_obj.focus ();
      return;
   }

   // Do jjax call.  First disable login button, show spinner.
   // ...
   var data = {username: username, password: password};
   qqc.jjax (qname, i_qwiz, qwizdata[i_qwiz].qrecord_id, '', 'login', data);
}


// -----------------------------------------------------------------------------
this.login_ok = function (i_qwiz, session_id) {

   // Success.  Create session cookie.  Valid just for this session, good for
   // whole site.  Value set by server.
   $.cookie ('qwiz_session_id', session_id, {path: '/'});

   // Set flag.
   document_qwiz_user_logged_in_b = true;

   // Set user menus.
   q.set_user_menus_and_icons ();

   // Hide login.
   $ ('#qwiz_login-qwiz' + i_qwiz).hide ();

   if (qwizdata[i_qwiz].i_question == -1) {

      // Go to first question.
      q.next_question (i_qwiz);
   } else {

      // Re-display current question.
      $ ('#qwiz' + i_qwiz + '-q' + qwizdata[i_qwiz].i_question).show ();

      // Show next button if was showing.
      if (qwizdata[i_qwiz].next_button_show_b) {
         $ ('#next_button-qwiz' + i_qwiz).show ();
      }
   }
}


// -----------------------------------------------------------------------------
this.login_not_ok = function (i_qwiz) {

   // Invalid login.  Error message.
   $ ('#qwiz_login-qwiz' + i_qwiz + ' p.login_error').show ();
   if (debug[0]) {
      console.log ('[login_not_ok] $ (\'#qwiz_login-qwiz' + i_qwiz + ' p.login_error\'):', $ ('#qwiz_login-qwiz' + i_qwiz + ' p.login_error'));
   }
}


// -----------------------------------------------------------------------------
this.no_login = function (i_qwiz) {

   // Skip login.  Hide login, go to first question.  If checkbox checked, set
   // cookie and local flag to skip in the future.
   if ($ ('div.qwiz-login input[type="checkbox"]').prop('checked')) {
      $.cookie ('qwiz_declined_login', 1, {path: '/'});
      declined_login_b = true;
   }
   $ ('#qwiz_login-qwiz' + i_qwiz).hide ();
   q.next_question (i_qwiz);
}


// -----------------------------------------------------------------------------
this.icon_no_login = function (i_qwiz) {

   // Stop icon from bouncing.  If checkbox checked, set cookie and local flag
   // to skip bouncing/login in the future.
   /* DKTMP
   if ($ ('div.qwiz-login input[type="checkbox"]').prop('checked')) {
      $.cookie ('qwiz_declined_login', 1, {path: '/'});
      declined_login_b = true;
   }
   */
   $ ('div.qwiz-usermenu_icon_no_intro').removeClass ('qwiz-icon-bounce');

   // Close menu.
   $ ('#usermenu-qwiz' + i_qwiz).hide ();
}


// -----------------------------------------------------------------------------
this.show_usermenu = function (i_qwiz) {
   $ ('#usermenu-qwiz' + i_qwiz).show ().mouseleave (function () {
                                                        $ (this).hide ();
                                                     });
}


// -----------------------------------------------------------------------------
this.set_user_menus_and_icons = function () {
   var htm = '';
   var icon_color;

   // See if logged in.
   if (typeof (document_qwiz_user_logged_in_b) != 'undefined'
                                            && document_qwiz_user_logged_in_b) {

      // Yes.  Show login name.
      htm +=    '<div>'
             +     T ('Logged in as') + ' <strong>' + document_qwiz_username + '</strong>'
             +  '</div>';

      // Menu item for records.
      htm +=    '<div>'
             +      T ('My scores')
             +  '</div>';

      // Menu item for logout.
      htm +=    '<div>'
             +      T ('Not') + ' ' + document_qwiz_username + '? '
             +     '<a href="javascript: ' + qname + '.sign_out ()">'
             +         T ('Sign out')
             +     '</a>'
             +  '</div>';

      icon_color = 'green';

      // Logged in.  No animation for no-intro quizzes icon.
      $ ('div.qwiz-usermenu_icon_no_intro').removeClass ('qwiz-icon-bounce');
   } else {

      // Not logged in: login menu item.
      htm +=    '<div  onclick="' + qname + '.display_login (i_qwiz)">'
             +     '<a href="javascript: ' + qname + '.display_login (i_qwiz)">'
             +        '<strong>' + T ('Log in') + '</strong> ' + T ('to record/get credit')
             +     '</a>'
             +  '</div>';

      // "No thanks" item.
      htm +=    '<div>'
             +     '<a href="javascript: ' + qname + '.icon_no_login (i_qwiz)">'
             +        '<strong>' + T ('No thanks') + '</strong>'
             +     '</a>'
             +     ' &nbsp;<span class="qwiz-remember" title="' + T ('Skip login in the future') + '"><span><input type="checkbox" /></span> ' + T ('Remember') + '</span>'
             +  '</div>';

      icon_color = 'black';

      // Not logged in.  No-intro quizzes get animated icon.
      $ ('div.qwiz-usermenu_icon_no_intro').addClass ('qwiz-icon-bounce');
   }

   // All user menus (every quiz with qrecord_id).
   $ ('div.qwiz-usermenu').each (function () {
                                    // Get qwiz number from id - looks like
                                    // usermenu-qwiz0.
                                    // 0----+----1---
                                    var id = $ (this).attr ('id');
                                    var i_qwiz = id.substr (13);
                                    $ (this).html (htm.replace (/i_qwiz/g, i_qwiz));
                                 });

   // Also set icons visible, color based on login state.
   $ ('div.qwiz-usermenu_icon').css ({visibility: 'visible', color: icon_color});
}


// -----------------------------------------------------------------------------
this.sign_out = function () {

   // Delete cookie, unset flag.
   $.removeCookie ('qwiz_session_id', {path: '/'});
   document_qwiz_user_logged_in_b = false;

   // Reset menus to reflect current (logged-out) state.
   q.set_user_menus_and_icons ();
}


// -----------------------------------------------------------------------------
function T (string) {
   return qqc.T (string);
}


// -----------------------------------------------------------------------------
function Tplural (word, plural_word, n) {
   return qqc.Tplural (word, plural_word, n);
}


// -----------------------------------------------------------------------------
function inarray0 (array_of_arrays, query) {
   var len = array_of_arrays.length;
   for (var i=0; i<len; i++) {
      if (array_of_arrays[i][0] == query) {
         return true;
      }
   }

   return false;
}


// =============================================================================
// Close - isolate namespace.
};


// -----------------------------------------------------------------------------
qwizf.call (qwiz_);

