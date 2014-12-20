/*
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
debug.push (false);    // 0 - general.
debug.push (false);    // 1 - radio/choices html.
debug.push (false);    // 2 - feedback html.
debug.push (false);    // 3 - old/new html dump.
debug.push (false);    // 4 - question tags/topics.

var $ = jQuery;

// Private data, but global to this qwiz instance.
var q = this;
q.processing_complete_b = false;

// The identifier -- including qualifiers like "#" -- of the page content (that
// perhaps contains inline quizzes) on WordPress.  Multiple-entries default
// set in qwiz-online-quizzes-wp-plugin.php: div.entry-content, div.post-entry,
// div.container.  Apparently themes can change this; these have come up so far.
// Body default for stand-alone use.
var content = get_qwiz_param ('content', 'body');

var errmsgs = [];

var n_qwizzes = 0;
var qwizzled_b;
var no_intro_b = [];

var qwizdata = [];

var header_html;

var drag_and_drop_initialized_b = false;
var try_again_obj = '';


// -----------------------------------------------------------------------------
$ (document).ready (function () {

   // Add default styles for qwiz divs to page.
   add_style ();

   process_html ();

   // Error messages, if any.
   if (errmsgs.length) {
      alert (plural ('Error found', 'Errors found', errmsgs.length) + ':\n\n' + errmsgs.join ('\n'));
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

   // Read WordPress user content divs, look for inline qwiz "tags", loop
   // over tag pairs.
   $ (content).each (function () {
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
                  n_qwizzes = qwiz_matches.length;
                  if (debug[0]) {
                     console.log ('[process_html] n_qwizzes: ', n_qwizzes);
                     console.log ('               qwiz_matches[0]: ', qwiz_matches[0]);
                  }

                  // Loop over qwiz-tag pairs.
                  for (i_qwiz=0; i_qwiz<n_qwizzes; i_qwiz++) {
                     var new_qwiz_html = process_qwiz_pair (qwiz_matches[i_qwiz]);

                     // Let's take out <p...> and <h...> from before [qwiz].
                     new_htm = new_htm.replace (/(<[ph][^>]*>\s*)*?\[qwiz[\s\S]*?\[\/qwiz\]/m, new_qwiz_html);
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
               init_qwizzled ($ (this));
            }
         }
      }
   });

   // Set flag to display page (qwizscripts.js).
   q.processing_complete_b = true;
}


// -----------------------------------------------------------------------------
function init_qwizzled (content_obj) {

   // Targets no longer draggable (from qwizzled create/edit step).
   // Also reset borders.
   content_obj.find ('td.qwizzled_canvas .qwizzled_target').removeClass ('ui-draggable ui-draggable-handle ui-resizable').css ({'border-style': 'dotted', 'border-color': 'gray'});

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
   for (var i_qwiz=0; i_qwiz<n_qwizzes; i_qwiz++) {
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
      label_copy_obj.css ({position: 'absolute', left: '4px', top: '50%', transform: 'translateY(-50%)'});
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

         // Done with labeled diagram.  Show summary, final feedback DKTMP.
         var n_tries = qwizdata[i_qwiz].n_label_attempts;
         var n_label_targets = qwizdata[i_qwiz].n_label_targets;
         var correct_b = n_tries == n_label_targets;
         var qwizzled_summary;
         if (correct_b) {
            qwizzled_summary = 'You placed all of the items correctly on the first try!';
         } else {
            qwizzled_summary = plural ('It took you one try', 'It took you %s tries', n_tries) + ' ' + plural ('to place this label correctly', 'to place these labels correctly', n_label_targets) + '.';
            qwizzled_summary = qwizzled_summary.replace ('%s', number_to_word (n_tries));
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
function add_style () {

   var s = [];

   s.push ('<style type="text/css">\n');

   s.push ('.qwiz {');
   s.push ('   position:        relative;');
   s.push ('   border:          2px solid black;');
   s.push ('   width:           500px;');
   s.push ('   min-height:      300px;');
   s.push ('   padding:         5px;');
   s.push ('   box-sizing:      content-box;');
   s.push ('   -moz-box-sizing: content-box;');
   s.push ('}');

   s.push ('.xqwiz {');
   s.push ('   visibility:      hidden;');
   s.push ('   height:          0px;');
   s.push ('   box-sizing:      content-box;');
   s.push ('   -moz-box-sizing: content-box;');
   s.push ('}');

   s.push ('.qwiz img {');
   s.push ('   border:          0px;');
   s.push ('}');

   s.push ('div.qwiz-header {');
   s.push ('   color:           white;');
   s.push ('   background:      black;');
   s.push ('   padding:         0px;');
                             /* top right bot left */
   s.push ('   margin:          -5px -5px 0px -5px;');
   s.push ('}');

   /* All sub-elements of header have zero margin. */
   s.push ('div.qwiz-header * {');
   s.push ('   margin:          0px;');
   //s.push ('   padding:         5px;');
   s.push ('   padding:         0px 5px 0px 5px;');
   s.push ('}');

   s.push ('.qwiz-mode {');
   s.push ('   font-size:       90%;');
   s.push ('   display:         inline-block;');
   s.push ('   margin:          0px;');
   s.push ('   padding-left:    3px;');
   s.push ('   padding-right:   3px;');
   s.push ('   color:           gray;');
   s.push ('   cursor:          help;');
   //s.push ('   background:      #CCCCCC;');
   //s.push ('   border:          1px solid gray;');
   //s.push ('   border-radius:   4px;');
   s.push ('}');

   s.push ('.qwiz-progress {');
   s.push ('   font-size:       90%;');
   s.push ('   display:         inline-block;');
   s.push ('   float:           right;');
   s.push ('   margin:          0px;');
   s.push ('   color:           gray;');
   s.push ('}');

   // Questions start out hidden.
   s.push ('.qwizq {');
   s.push ('   display:         none;');
   s.push ('   position:        relative;');
   s.push ('}');

   s.push ('.qwiz-choice:hover {');
   s.push ('   cursor:          pointer;');
   s.push ('   color:           #045FB4;');
   s.push ('}');

   s.push ('.qwiz-choices p {');
   s.push ('   padding-left:    1.6em;');
   s.push ('   text-indent:     -1.6em;');
   s.push ('   margin-top:      0px;');
   s.push ('   margin-bottom:   0.5em;');
   s.push ('}');

   s.push ('.qwiz-feedback {');
   s.push ('   display:         none;');
   s.push ('}');

   s.push ('.qwiz-feedback p {');
   s.push ('   margin-bottom:   0.3em;');
   s.push ('}');

   s.push ('div.icon_qwiz {');
   s.push ('   position:        absolute;');
   s.push ('   left:            2px;');
   s.push ('   bottom:          2px;');
   s.push ('   width:           16px;');
   s.push ('   height:          16px;');
   s.push ('}');

   s.push ('img.icon_qwiz {');
   s.push ('   opacity:         0.4;');
   s.push ('}');

   s.push ('img.icon_qwiz:hover {');
   s.push ('   opacity:         1.0;');
   s.push ('}');

   // Labeled-diagram layout table.
   s.push ('table.qwizzled_table {');
   s.push ('   width:           100%;');
   s.push ('   border:          none;');
   s.push ('   margin:          0px;');
   s.push ('}');

   s.push ('table.qwizzled_table p {');
   s.push ('   margin:          0px;');
   s.push ('}');

   // Labeled-diagram "canvas" table cell.
   s.push ('td.qwizzled_canvas {');
   s.push ('   width:           75%;');
   s.push ('   border:          none;');
   s.push ('   padding:         0px;');
   //s.push ('   border-right:    1px solid black;');
   s.push ('}');

   // Labeled-diagram labels table cell.
   s.push ('td.qwizzled_labels {');
   s.push ('   vertical-align:  top;');
   s.push ('   border:          none;');
   s.push ('   padding:         0px;');
   s.push ('}');

   s.push ('td.qwizzled_labels_left_right {');
   s.push ('   width:           25%;');
   s.push ('   min-width:       125px;');
   s.push ('}');

   // Box around labels.
   s.push ('div.qwizzled_labels_border {');
   s.push ('   border:          1px solid black;');
   s.push ('   padding:         3px;');
   s.push ('}');

   s.push ('p.qwizzled_label_head {');
   s.push ('   font-size:       85%;');
   s.push ('   font-style:      italic;');
   s.push ('   font-weight:     bold;');
   s.push ('   line-height:     135%;');
   s.push ('   margin-bottom:   0.5rem;');
   s.push ('}');

   s.push ('ul.qwizzled_labels {');
   s.push ('   margin:          0px;');
   s.push ('   padding:         0px;');
   s.push ('}');

   // Bulleted labels indent (= padding).
   s.push ('ul.qwizzled_labels_std li {');
   s.push ('   padding:         0px;');
   s.push ('   margin:          0 0 0 1rem;');
   s.push ('   margin-left:     1rem;');
   s.push ('}');

   s.push ('ul.qwizzled_labels_inline li {');
   s.push ('   float:           left;');
   s.push ('   padding:         0px;');
   s.push ('   margin:          0 0 0 2rem;');
   s.push ('   margin-left:     2rem;');
   s.push ('}');

   // Labeled-diagram labels feedback cell.
   s.push ('td.qwizzled_feedback {');
   s.push ('   border:          none;');
   //s.push ('   border-top:      1px solid black;');
   s.push ('}');

   s.push ('button.qwizzled_try_again {');
   s.push ('   width:           6em;');
   s.push ('   height:          1.7em;');
   s.push ('   padding:         2px;');
   s.push ('   margin-bottom:   -3px;');
   s.push ('   border:          1px solid black;');
   s.push ('   border-radius:   5px;');
   s.push ('   font-size:       9pt;');
   s.push ('   font-weight:     normal;');
   s.push ('   text-transform:  none;');
   s.push ('   color:           black;');
   s.push ('   background:      lightgray;');
   s.push ('}');

   s.push ('button.qwizzled_try_again:hover {');
   s.push ('   color:           gray;');
   s.push ('   background:      white;');
   s.push ('   border:          1px solid gray;');
   s.push ('}');

   s.push ('div.qwizzled_target {');
   s.push ('   width:           120px;');
   s.push ('   height:          28px;');
   s.push ('   margin-right:     -124px;');
   s.push ('   margin-bottom:   -32px;');
   s.push ('   position:        absolute;');
   s.push ('   box-sizing:      content-box;');
   s.push ('   -moz-box-sizing: content-box;');
   s.push ('}');

   s.push ('span.qwizzled_target {');
   s.push ('   position:        relative;');
   s.push ('}');

   s.push ('.qwizzled_target_border {');
   s.push ('   border:          2px dotted gray;');
   s.push ('   padding-left:    2px;');
   s.push ('   padding-right:   2px;');
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

   s.push ('.qwizzled_target_hover {');
   s.push ('   outline:         3px solid lightgray;');
   s.push ('}');

   s.push ('.qwizzled_label {');
   s.push ('   -webkit-user-select: none;');
   s.push ('}');

   s.push ('.qwizzled_label_unplaced {');
   s.push ('   z-index:         2;');
   s.push ('}');

   s.push ('.qwizzled_highlight_label {');
   s.push ('   cursor:          move;');
   s.push ('   -webkit-user-select: none;');
   s.push ('}');

   s.push ('.qwizzled_label a {');
   s.push ('   cursor:          move;');
   s.push ('}');

   s.push ('div.qwizzled_question_bottom_border_title {');
   s.push ('   display:         none;');
   s.push ('}');

   // Summary also hidden.
   s.push ('.summary {');
   s.push ('   display:         none;');
   s.push ('}');

   // Starts out centered.
   s.push ('.next_button {');
   s.push ('   text-align:      center;');
   s.push ('}');

   s.push ('.qbutton {');
   s.push ('   margin-bottom: 2px;');
   s.push ('   border-top: 1px solid #96d1f8;');
   s.push ('   background: #65a9d7;');
   s.push ('   background: -webkit-gradient(linear, left top, left bottom, from(#3e779d), to(#65a9d7));');
   s.push ('   background: -webkit-linear-gradient(top, #3e779d, #65a9d7);');
   s.push ('   background: -moz-linear-gradient(top, #3e779d, #65a9d7);');
   s.push ('   background: -ms-linear-gradient(top, #3e779d, #65a9d7);');
   s.push ('   background: -o-linear-gradient(top, #3e779d, #65a9d7);');
   s.push ('   padding: 3px 3px;');
   s.push ('   -webkit-border-radius: 8px;');
   s.push ('   -moz-border-radius: 8px;');
   s.push ('   border-radius: 8px;');
   s.push ('   -webkit-box-shadow: rgba(0,0,0,1) 0 1px 0;');
   s.push ('   -moz-box-shadow: rgba(0,0,0,1) 0 1px 0;');
   s.push ('   box-shadow: rgba(0,0,0,1) 0 1px 0;');
   s.push ('   text-shadow: rgba(0,0,0,.4) 0 1px 0;');
   s.push ('   color: white;');
   s.push ('   font-size: 14px;');
   s.push ('   font-weight: bold;');
   s.push ('   font-family: arial, verdana, sans-serif;');
   s.push ('   text-decoration: none;');
   s.push ('   vertical-align: middle;');
   s.push ('}');
   s.push ('.qbutton:hover {');
   s.push ('   border-top-color: #28597a;');
   s.push ('   background: #28597a;');
   s.push ('   color: #ccc;');
   s.push ('}');
   s.push ('.qbutton:active {');
   s.push ('   border-top-color: #1b435e;');
   s.push ('   background: #1b435e;');
   s.push ('}');
   s.push ('.qbutton p {');
   s.push ('   margin: 0px;');
   s.push ('}');

   s.push ('</style>');;

   $ (s.join ('\n')).appendTo ('head');
}


// -----------------------------------------------------------------------------
function process_qwiz_pair (htm) {

   // Data object for this qwiz.
   qwizdata.push ({});
   qwizdata[i_qwiz].n_correct   = 0;
   qwizdata[i_qwiz].n_incorrect = 0;
   qwizdata[i_qwiz].i_question  = -1;
   qwizdata[i_qwiz].initial_width = 500;

   var qwiz_tag = htm.match (/\[qwiz[^\]]*\]/m)[0];
   if (debug[0]) {
      console.log ('[process_qwiz_pair] qwiz_tag: ', qwiz_tag);
   }

   var n_questions = 0;
   var new_htm = '';
   var no_intro_i_b = false;

   // Is qwiz encoded?  Decode if necessary.  Turns tag into plain '[qwiz]'.
   htm = decode_qwiz (htm, qwiz_tag);

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
   htm = trim (htm);

   // Make sure there's at least one question.
   if (htm.search (/\[(q|<code><\/code>q)([^\]]*)\]/m) == -1) {
      errmsgs.push (T ('Did not find question tags ("[q]") for') + ' qwiz ' + (i_qwiz + 1));
   } else {

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
      var question_tags = question_html.match (/\[(<code><\/code>)*?q([^\]]*)\]/gm);
      if (debug[4]) {
         console.log ('[process_qwiz_pair] question_tags: ', question_tags);
      }
      n_questions = question_tags.length;
      if (debug[0]) {
         console.log ('[process_qwiz_pair] n_questions: ', n_questions);
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
      if (question_html.substr (0, 2) == '[q') {
         var start = question_html.search (/\]/) + 1;
         question_html = question_html.substr (start);
      } else {
         question_html = question_html.substr (31);
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

      // Split into individual items.  Include search for qwizzled_question
      // divs.
      var questions_html = question_html.split (/\[q [^\]]*\]|\[q\]|<div class="qwizzled_question">/);
      if (debug[0]) {
         console.log ('[process_qwiz_pair] questions_html:', questions_html.join ('//\n\n'));
      }

      // Create a div for each.
      var question_divs = [];
      for (var i_question=0; i_question<n_questions; i_question++) {

         // See if multiple-choice question.
         var question_div;
         if (questions_html[i_question].search (/\[c\]|\[c\*\]/m) != -1) {

            question_div = process_question (i_qwiz, i_question,
                                             questions_html[i_question],
                                             q_opening_tags[i_question]);
         // See if labels.
         } else if (questions_html[i_question].search (/\[l\]|<div class="qwizzled_label/m) != -1) {
            qwizzled_b = true;
            qwizdata[i_qwiz].qwizzled_b = true;
            question_div = process_qwizzled (i_qwiz, i_question,
                                             questions_html[i_question],
                                             q_opening_tags[i_question],
                                             question_tags[i_question]);
         } else {

            // Error: didn't find choices or labels.
            errmsgs.push (T ('Did not find choices ("[c]") or labels ("[l]") for') + ' qwiz ' + (i_qwiz + 1) + ', question ' + (i_question + 1));
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
   // div elements (progress, summary div, "next" button).
   new_htm = create_qwiz_divs (i_qwiz, qwiz_tag, new_htm, exit_html);

   //if (debug[3]) {
   //   console.log ('[process_qwiz_pair] new_htm: ', new_htm);
   //}

   return new_htm;
}


// -----------------------------------------------------------------------------
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
   attributes = replace_smart_quotes (attributes);
   var non_default_width_b = attributes.search (/[\s;"]width/m) != -1;

   // If "repeat_incorrect=..." present, parse out true/false.
   var repeat_incorrect_value = get_attr (attributes, 'repeat_incorrect');
   qwizdata[i_qwiz].repeat_incorrect_b = repeat_incorrect_value != 'false';
   if (debug[0]) {
      console.log ('[create_qwiz_divs] repeat_incorrect_value:', repeat_incorrect_value, ', repeat_incorrect_b:', qwizdata[i_qwiz].repeat_incorrect_b);
   }

   // Undisplayed version of qwiz div, so can measure default width if need to.
   var top_html = '';
   if (non_default_width_b) {
      top_html = '<div id="xqwiz' + i_qwiz + '" class="xqwiz" ' + attributes + '></div>\n';
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
   progress_div_html += '   <div id="mode-qwiz' + i_qwiz + '" class="qwiz-mode" title="' + title + '">\n';
   progress_div_html += '      Mode: ' + mode + '\n';
   progress_div_html += '   </div>\n';
   progress_div_html += '   <div id="progress-qwiz' + i_qwiz + '" class="qwiz-progress">\n';
   progress_div_html += '   </div>\n';
   progress_div_html += '</div>\n';

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

   // "Next" button.
   bottom_html +=  '<div class="next_button" id="next_button-qwiz' + i_qwiz + '">\n'
                 + '   <button class="qbutton" onclick="' + qname + '.next_question (' + i_qwiz + ')">'
                 +        '<span id="next_button_text-qwiz' + i_qwiz + '">'
                 +           T ('Start quiz')
                 +        '</span>'
                 +    '</button>\n'
                 + '</div>\n';

   style = '';
   if (get_qwiz_param ('beta')) {
      style = 'style = "background: red;"';
   }
   bottom_html += '<div class="icon_qwiz" id="icon_qwiz' + i_qwiz + '" ' + style + '>';
   var icon_qwiz = get_qwiz_param ('icon_qwiz');
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
   htm = top_html + progress_div_html + htm + bottom_html;

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
      var m = question_tag.match (/\[(<code><\/code>)*?q([^\]]*)\]/m);
      var attributes = m[2];
      if (attributes) {

         // Look for "topic=" attribute.
         attributes = replace_smart_quotes (attributes);
         var question_topics = get_attr (attributes, 'topic');
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

   // If was displaying intro, hide -- but show intro (if any) with the single
   // question of a single-question quiz.
   if (i_question == -1) {
      if (n_questions > 1) {
         $ ('#intro-' + qwiz_id).hide ();

         // After "Start quiz", button is left-aligned.
         $ ('#next_button-qwiz' + i_qwiz).css ('text-align', 'left');

         // Also, show progress and change button text.  Only if more than one
         // question in quiz.
         display_progress (i_qwiz);
         $ ('#next_button_text-' + qwiz_id).html (T ('Next question'));

         // If intro was showing, can hide qwiz icon now.
         if (! no_intro_b[i_qwiz]) {
            $ ('div.qwiz div#icon_qwiz' + i_qwiz).hide ();
         }

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
   $ ('#next_button-' + qwiz_id).hide ();

   // Next question -- if repeating incorrect, keep running through questions
   // until all answered correctly.  If done, show summary/exit text.
   var n_done = qwizdata[i_qwiz].n_correct;
   if (! qwizdata[i_qwiz].repeat_incorrect_b) {
      n_done += qwizdata[i_qwiz].n_incorrect;
   }
   //if (qwizdata[i_qwiz].repeat_incorrect_b) {
   if (n_done == n_questions) {
      display_summary_and_exit (i_qwiz);
   } else {
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
      if (qwizq_obj.find ('[class*="qwizzled_n_targets"]').length) {

         // This collects multiple spans if they're spread across a text target.
         // If don't have qtarget_sib... just count, but de-dup sibs.
         var n_label_targets = 0;
         var target_count = new Object ();
         qwizq_obj.find ('div.qwizzled_target, span.qwizzled_target').each (function () {
            var classes = $ (this).attr ('class');
            var m = classes.match (/qtarget_sib-[0-9]*/);
            if (m) {
               var qwizzled_target_assoc_id = m[0];
               target_count[qwizzled_target_assoc_id] = 1;
            } else {
               n_label_targets++;
            }
         });
         qwizdata[i_qwiz].n_label_targets = n_label_targets + Object.keys (target_count).length;
      } else {
         qwizdata[i_qwiz].n_label_targets = qwizq_obj.find ('div.qwizzled_label').length;
      }
      display_qwizzled_progress (i_qwiz);
   }

   qwizq_obj.show ();

   if (qwizzled_b) {

      // If layout table is wider than default qwiz width (defines border),
      // set wider for now.  Get width of table.
      var table_width = qwizq_obj.find ('table.qwizzled_table').outerWidth ();
      if (table_width > qwizdata[i_qwiz].initial_width) {
         $ ('#qwiz' + i_qwiz).css ('width', table_width + 'px');

         // Set flag to reset width on next question.
         qwizdata[i_qwiz].width_reset = true;
      }
   } else {

      // Enable radio clicks in case previously disabled for this question.
      // Also, show radios unclicked.
      $ ('input[name=' + qwizq_id + ']').removeAttr ('disabled').removeAttr ('checked');

      // Re-enable highlight choices on mouseover, cursor to indicate clickable.
      $ ('.choices-' + qwizq_id).on ('mouseover', function () {
         $ (this).css ({'cursor': 'pointer', 'color': '#045FB4'})
      }).on ('mouseout', function () {;
         $ (this).css ({'cursor': 'text', 'color': 'black'})
      });
   }
}


// -----------------------------------------------------------------------------
function process_question (i_qwiz, i_question, htm, opening_tags) {

   // Span for default indented paragraph style for choices.  Want this ahead of
   // any opening tags user put in before first "[c]".
   var span_pos = htm.search (/(<[^\/][^>]*>\s*)*?\[c\*{0,1}\]/m);
   if (span_pos == -1) {
      errmsgs.push (T ('Did not find choices ("[c]") for') + ' qwiz ' + (i_qwiz + 1) + ', question ' + (i_question + 1));
      new_htm = '';
      remaining_htm = '';
   } else {
      var question_htm = htm.substr (0, span_pos);
      if (debug[0]) {
         console.log ('[process_question] span_pos: ', span_pos);
         console.log ('[process_question] question_htm: ', question_htm);
      }

      // Wrap in div for this qwiz and question.
      var new_htm =   '<div id="qwiz' + i_qwiz + '-q' + i_question + '" class="qwizq">\n'
                     +    opening_tags + question_htm;

      if (debug[1]) {
         console.log ('[process_question] new_htm: ', new_htm);
      }

      var remaining_htm = htm.substr (span_pos);

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

   var qtags = ['[c]', '[c*]'];
   var qnext_tags = ['[c]', '[c*]', '[f]'];
   var n_correct = 0;
   for (var i_choice=0; i_choice<n_choices; i_choice++) {

      // Find choice text -- from opening tags through [c] or [c*] up to
      // opening tags for next tag.  Delete it from remaining_htm.
      var choice_html = parse_html_block (remaining_htm, qtags, qnext_tags);
      remaining_htm = remaining_htm.substr (choice_html.length);

      if (n_choices > 1) {

         // Replace [c] or [c*] with radio button.
         var radio_button_html = create_radio_button_html (i_qwiz, i_question, i_choice, choice_tags[i_choice]);
         n_correct += radio_button_html[0];
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
         new_htm += '<button class="qbutton" style="margin-left: 20px;" onclick="' + qname + '.process_choice (\'qwiz' + i_qwiz + '-q' + i_question + '-a' + i_choice + '\')">' + choice_html + '</button>\n'
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
      errmsgs.push (T ('No choice was marked correct') + ': qwiz ' + (1 + i_qwiz) + ', question ' + (1 + i_question));
   } else if (n_correct > 1) {
      errmsgs.push (T ('More than one choice was marked correct') + ': qwiz ' + (1 + i_qwiz) + ', question ' + (1 + i_question));
   }

   // . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
   // Find feedback alternatives for this question, make into alternative divs.
   // Feedback html -- from opening tags before first [f] through end.
   var m = remaining_htm.match (/(<[^\/][^>]*>\s*)*?\[f\][\s\S]*/m);
   var feedback_html = '';
   if (m) {
      feedback_html = m[0];
   }
   if (debug[2]) {
      console.log ('[process_question] feedback_html: ', feedback_html);
   }

   if (! feedback_html) {
      errmsgs.push (T ('Did not find feedback ("[f]") for') + ' qwiz ' + (i_qwiz + 1) + ', question ' + (i_question + 1));
      feedback_html = '';
   } else {

      // Parse into individual items.
      var feedback_divs = [];
      var feedback_start_tags = ['[f]'];
      var feedback_next_tags = ['[f]', '[x]'];
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

         // Delete [f].
         feedback_item_html = feedback_item_html.replace (/\[f\]/, '');

         if (debug[2]) {
            console.log ('[process_question] feedback_item_html: ', feedback_item_html);
         }

         // Create a div for each.
         feedback_divs.push (
               create_feedback_div_html (i_qwiz, i_question, i_item,
                                         feedback_item_html)
         );
         i_item++;
      }

      var n_feedback_items = feedback_divs.length;

      if (debug[2]) {
         console.log ('[process_question] n_feedback_items: ', n_feedback_items);
      }

      // Check that number of feedback items matches number of choices.
      if (n_choices != n_feedback_items) {
         errmsgs.push (T ('Number of feedback items does not match number of choices') + ': qwiz ' + (1 + i_qwiz) + ', question ' + (1 + i_question));
      }

      new_htm += feedback_divs.join ('\n');
      if (debug[2]) {
         console.log ('[process_question] new_htm: ', new_htm)
      }
   }

   // Close question div.
   new_htm += '</div>\n';

   return new_htm;
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
   var m = question_tag.match (/\[<code><\/code>q([^\]]*)\]/m);
   if (m) {
      var attributes = m[1];
      if (attributes) {

         // Look for "labels=" attribute.  Match regular double-quote, or
         // left- or right-double-quote.
         attributes = replace_smart_quotes (attributes);
         labels_position = get_attr (attributes, 'labels');
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
      errmsgs.push (T ('Did not find target "drop-zones" for labels.  Please check that all labels and target "drop zones" were correctly processed and saved during the edit of this page.'));
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

   // Take out the ("encoded") [q].
   new_htm = new_htm.replace (/\[<code><\/code>q[^\]]*\]/, '');

   if (debug[0]) {
      console.log ('[process_qwizzled] new_htm:', new_htm);
      console.log ('[process_qwizzled] remaining_htm:', remaining_htm);
   }

   // . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
   // Process labels and feedback -- feedback is optional, but must immediately
   // follow label, if given.  Do label by label -- look for feedback associated
   // with each.  First take out [<code></code>l].
   remaining_htm = remaining_htm.replace (/\[<code><\/code>l\]/gm, '');
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
   var feedback_next_tags = ['[f*]', '[fx]', '[hint]', '[x]'];
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
         report_html.push ('<p>In this ' + number_to_word (n_questions) + '-question quiz, you answered every question correctly on the first try!</p>');
      } else {
         report_html.push ('<p>In finishing this ' + number_to_word (n_questions) + '-question quiz, you entered ' + number_to_word (n_incorrect) + ' incorrect ' + plural ('answer', 'answers', n_incorrect) + '.</p>');
      }
   } else {
      if (n_incorrect == 0) {
         report_html.push ('<p>' + T ('Congratulations, you answered all questions correctly') + '.</p>');
      } else {
         report_html.push ('<p>' + T ('Your score is') + ' ' + number_to_word (n_correct) + ' ' + T ('out of') + ' ' + number_to_word (n_questions) + ' ' + T ('questions') + '.</p>');
      }
   }

   var n_topics = qwizdata[i_qwiz].topics.length;
   if (n_topics == 1) {
      var topic = qwizdata[i_qwiz].topics[0];
      var all_both_n;
      if (n_questions == 2) {
         all_both_n = T ('Both');
      } else {
         all_both_n = T ('All') + ' '+ number_to_word (n_questions);
      }
      report_html.push ('<p>' + all_both_n + ' ' + plural ('question', 'questions', n_questions) + ' were about topic &ldquo;' + topic + '.&rdquo;</p>');
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
            topic_html += T ('For topic') + ' &ldquo;' + topic + '&rdquo; ' + plural ('there was', 'there were', n_topic_items) + ' ' + number_to_word (n_topic_items) + ' ' + plural ('question', 'questions', n_topic_items) + '.&nbsp;';
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
                  topic_html += plural ('It took you one try', 'It took you %s tries', n_tries) + ' ' + plural ('to answer this question correctly', 'to answer these questions correctly', n_topic_items) + '.';
                  topic_html = topic_html.replace ('%s', number_to_word (n_tries));
               } else {
                  topic_html += T ('Your score is %s correct out of %s') + '.';
                  topic_html = topic_html.replace ('%s', number_to_word (n_topic_correct));
                  topic_html = topic_html.replace ('%s', number_to_word (n_topic_items));
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
   htm += '<input type="radio" id="radio-qwiz' + i_qwiz + '-q' + i_question + '-a' + i_choice + '" name="qwiz' + i_qwiz + '-q' + i_question + '" ' + data_correct + ' onclick="' + qname + '.process_choice (\'qwiz' + i_qwiz + '-q' + i_question + '-a' + i_choice + '\')" />\n';

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
      progress_html = 'Questions in this quiz: ' + n_to_go;
   } else {
      progress_html = qwizdata[i_qwiz].n_questions + ' questions, ' + n_attempts + ' ' + plural ('response', 'responses', n_attempts) + ', ' + qwizdata[i_qwiz].n_correct + ' correct, ' + qwizdata[i_qwiz].n_incorrect + ' incorrect, ' + n_to_go + ' to go';
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
function get_attr (htm, attr_name) {

   var attr_value = '';

   var attr_re = new RegExp (attr_name + '\\s*?=\\s*?["\\u201C\\u201D]([^"\u201C\u201D]+)["\\u201C\\u201D]', 'm');
   var attr_match = htm.match (attr_re);
   if (attr_match) {
      attr_value = trim (attr_match[1]);
   }

   return attr_value;
}


// -----------------------------------------------------------------------------
function replace_smart_quotes (string) {
   var new_string = string.replace (/[\u201C\u201D]/gm, '"');

   return new_string;
}


// -----------------------------------------------------------------------------
var number_word = [T ('zero'), T ('one'), T ('two'), T ('three'), T ('four'), T ('five'), T ('six'), T ('seven'), T ('eight'), T ('nine'), T ('ten')];

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

   var t_string = '';

   // Translation, if available.
   if (typeof (qwiz_params) != 'undefined') {
      if (typeof (qwiz_params.T) != 'undefined') {
         if (typeof (qwiz_params.T[string]) != 'undefined') {
            t_string = qwiz_params.T[string];
         }
      }
   }
   if (t_string == '') {

      // Translation not available.  Just use default string.
      t_string = string;
   }

   return t_string;
}


// -----------------------------------------------------------------------------
function get_qwiz_param (key, default_value) {

   var value = '';
   if (typeof (qwiz_params) != 'undefined') {
      if (typeof (qwiz_params[key]) != 'undefined') {
         value = qwiz_params[key];
      }
   }
   if (value == '') {

      // qwiz_params object or key not present.  Return default value, if 
      // given, or ''.
      if (default_value != undefined) {
         value = default_value;
      }
   }

   return value;
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
qwizf.call (qwiz_);

