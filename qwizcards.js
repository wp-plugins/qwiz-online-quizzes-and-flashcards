/*
 * Version 2.28 2015-01-??
 * Resize card front/back to larger of two (including alternate textentry backs).
 * Textentry with required input and suggestions/hints.
 *
 * Version 2.27 2015-01-05
 * Reset header width to match card width for summary report.
 * Toolbar option - keep "next" button active.
 * Don't increment number of cards reviewed until "Check answer"/flip.
 *
 * Version 2.26 2014-12-21
 * Look for WP content filter-created divs, rewrite only that HTML.
 * On back side of card, "Flip"/"Check answer" -> "Flip back".
 * Gray-out/disable "Need more practice" and "Got it!" until user clicks "Check answer".
 *
 * Version 2.25 2014-12-16
 * Fix search for any [qdeck] shortcode.
 * Reorder buttons, default translation: "Flip" -> "Check answer".
 *
 * Version 2.24 2014-12-15
 * Make $ (= jQuery) private.
 *
 * Version 2.23 2014-12-13
 * Explicit visible/hidden for card front/back (Chrome backface-visibility?)
 *
 * Version 2.22 2014-12-07
 * Tolerate whitespace before [h].
 * Fix check for paragraph with header plus something else -- don't delete.
 * Qwiz icon within <td> - keep the icon inside the border.
 *
 * Version 2.21 2014-12-02
 * Workaround for Firefox 33.1 problem with long regular expression and long
 * string in intro parse.
 *
 * Version 2.20 2014-11-20
 * Handle "smart quotes" in attributes.
 *
 * Version 2.17 2014-11-13
 * Bug fix: "text before intro"
 *
 * Version 2.16 2014-11-12
 * Separate out "Got it!" from summary text.
 * Delete <br> in header.
 *
 * Version 2.15 2014-11-09
 * Nicer qwiz icon, hover effect.  Hide icon with flip.
 * Fix ignore empty paragraphs when no [i].  Also, handle multiple paragraphs.
 * Handle left- and right-double-quotes in random="true", etc.
 * Correct sizing of larger of front and back (border showing through in
 * Firefox).
 *
 * Version 2.12 2014-11-03
 * Distinguish qwiz from qdeck in hiding icon.
 *
 * Version 2.11 2014-11-03
 * Ignore empty paragraphs (with "&nbsp;") in intro without "[i]".
 * Qwiz icon/link on intro or first card only.
 * 'div.container' as content option.
 *
 * Version 2.09 2014-10-12
 * Add random="true" option - initial order randomized.
 *
 * Version 2.08 2014-10-05
 * Add internationalization - use .po and .mo files.
 * Add div.post-entry as page content location.
 *
 * Version 2.07 2014-10-01
 * Suppress errors, delete source in page/post excerpts.
 *
 * Version 2.05 2014-09-29
 * [qcarddemo] tags.
 *
 * Version 2.00 2014-09-07
 * Labeled-diagrams capability, including interactive editing.
 * Chrome on Mac: fallback for Flashcards; others: prevent sub/sup showing
 * through.
 * Don't focus on textarea if first flashcard initially displayed.
 *
 * Version 1.02 2014-08-16
 * Turn off debugs!
 *
 * Version 1.01 2014-08-16
 * Remove <p>s and headers that contain only [!] ... [/!] comments.  Paragraph
 * marks that remained after comments were deleted were taking space.
 *
 * Remove <br />s after textentry.
 *
 * Remove spacing/margins from back side.
 */

// Do-nothing function for old IE.
if (! window.console) {
   window.console = {log: function(){} };
}

// =============================================================================
// Isolate namespace.
qcard_ = {};
var qcardf = function () {
// =============================================================================

var qname = 'qcard_';

// Debug settings.
var debug = [];
debug.push (false);    // 0 - general.
debug.push (false);    // 1 - process_card_input ().
debug.push (false);    // 2 - answer (card back) html.
debug.push (false);    // 3 - old/new html dump.
debug.push (false);    // 4 - card tags/topics.
debug.push (false);    // 5 - "next" buttons, element objects.
debug.push (false);    // 6 - [textentry] w/ required input.

var $ = jQuery;

// Private data, but global to this qcard instance.
var q = this;
var qqc;
q.processing_complete_b = false;

var content;
var errmsgs = [];

var n_decks = 0;
var no_intro_b = [];

var deck_id;
var deckdata = [];

var card_reviewed_b = false;
var next_button_active_b  = false;

var textentry_i_deck;
var loaded_metaphone_js_b = false;

// Object (singular and plural) of arrays of term-metaphone pairs.
// Constant across quizzes.  
var default_textentry_terms_metaphones;

// (deckdata[i_deck].textentry_terms_metaphones are quiz-specific terms given
// with [terms]...[/terms].)

// These vary with quiz, and are set up anew for each [textentry] question.
var current_card_textentry_terms_metaphones = {};

var textentry_answers = {};
var textentry_answer_metaphones = {};

var textentry_matches = {};
var lc_textentry_matches = {};

var Tcheck_answer_message;

// ----------------------
// Array of topics (will check that individual card entries are in this list).
// Short names.
var topics = [];
var n_topics;

// Topic description for summary report.
var topic_descriptions = {};

// Statistics by topic.
var topic_statistics = {};

// -----------------------------------------------------------------------------
$(document).ready (function () {

   qqc = qwiz_qcards_common;

   // The identifier -- including qualifiers like "#" -- of the page content (that
   // perhaps contains inline flashcard decks) on WordPress.  Default
   // set in qwiz-online-quizzes-wp-plugin.php: div.entry-content, div.post-entry,
   // div.container.  Apparently themes can change this; these have come up so far.
   // Body default for stand-alone use.
   var content = qqc.get_qwiz_param ('content', 'body');
   Tcheck_answer_message = T ('Enter your best guess - eventually we\'ll provide suggestions or offer a hint');

   // Add default styles for qcard divs to page.
   add_style ();

   process_html ();

   // Error messages, if any.
   if (errmsgs.length) {
      alert (Tplural ('Error found', 'Errors found', errmsgs.length) + ':\n\n' + errmsgs.join ('\n'));
   }

   if (n_decks) {
      for (var i_deck=0; i_deck<n_decks; i_deck++) {

         init_element_pointers (i_deck);
         init_card_order (i_deck);

         // If no intro for a deck or single-card deck, move immediately to
         // first card.  Otherwise, set header and show introductory html along
         // with button to start deck.

         // Set header so there's something in it (measure height).
         set_header (i_deck, 'front', true);
         if (no_intro_b[i_deck] || deckdata[i_deck].n_cards == 1) {
            q.set_next_buttons (i_deck);
            q.process_card (i_deck);
         } else {
            deckdata[i_deck].el_qcard_card_front.html (deckdata[i_deck].intro_html);
         }

         // Set to match larger of front and back.
         set_container_width_height (i_deck);
         set_header (i_deck, 'front', true);
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

   // Look for [qdeck] and [/qdeck] that are only thing inside parents (e.g.,
   // <p>[qdeck]</p>).  Replace with "unwrapped" content if so.
   $ ('p:contains("qdeck"), :header:contains("qdeck")').each (function () {
      var tag_htm = $ (this).html ();
      if (tag_htm.search (/\s*\[\/{0,1}qdeck[^\]]*\]\s*/m) == 0) {
         $ (this).replaceWith (tag_htm);
      }
   });

   // We're either going to deal with HTML (stand-alone version) or divs (added
   // by WordPress content filter).  The divs allow us to replace content
   // specific to qwiz/qdeck -- avoid clobbering any events bound to remaining
   // html by other plugins.  See if there are such divs.  WP content filter
   // always adds at least one empty div, so don't have to do HTML branch.
   var div_html_selector = '';
   var qdeck_divs_obj = $ ('div.qdeck_wrapper');
   if (qdeck_divs_obj.length) {
      div_html_selector = 'div.qdeck_wrapper';
   } else {
      div_html_selector = content;
   }

   // Read appropriate divs, look for inline qcard shortcodes, loop over
   // shortcode pairs.
   var i_deck = 0;
   $(div_html_selector).each (function () {
      var htm = $(this).html ();
      if (! htm) {

         //errmsgs.push (T ('Did not find page content (looking for div') + ' "' + content + '")');
      } else {

         // See if there is a deck or decks.
         var qdeck_pos = htm.search (/\[qdeck/);
         if (qdeck_pos != -1) {

            // Remove and save text inside [qdeckdemo] ... [/qdeckdemo] pairs.
            // Replace with <qdeckdemo></qdeckdemo> pairs as placeholder.
            var qdeckdemo_re = new RegExp ('\\[qdeckdemo\\][\\s\\S]*?\\[\\/qdeckdemo\\]', 'gm');
            var qdeckdemos = htm.match (qdeckdemo_re);
            var n_qdeckdemos = 0;
            if (qdeckdemos) {
               n_qdeckdemos = qdeckdemos.length;
               htm = htm.replace (qdeckdemo_re, '<qdeckdemo></qdeckdemo>');
               if (debug[0]) {
                  console.log ('[process_html] n_qdeckdemos: ', n_qdeckdemos);
               }
            }

            // Delete comments -- don't want to process [qdeck][/qdeck] pairs or any other
            // deck-related tags that are in comments.
            var new_html = htm.replace (/<!--[\s\S]*?-->/gm, '');

            // Take out any remaining [!]...[\!] comments (those that were not
            // inside paragraph or header elements).
            new_html = new_html.replace (/\[!+\][\s\S]*?\[\/!+\]/gm, '');

            // Check that there are pairs.
            var do_not_process_html = check_qdeck_tag_pairs (new_html);
            if (do_not_process_html) {
               new_html = do_not_process_html;
            } else {

               // Get text, including beginning and ending tags.
               // "." does not match line-ends (!), so use the whitespace/not-whitespace
               // construct.  Non-greedy search, global, multiline.
               var qdeck_matches = new_html.match (/\[qdeck[\s\S]*?\[\/qdeck\]/gm);
               if (qdeck_matches) {
                  var local_n_decks = qdeck_matches.length;
                  if (debug[0]) {
                     console.log ('[process_html] local_n_decks: ', local_n_decks);
                     console.log ('               qdeck_matches[0]: ', qdeck_matches[0]);
                  }

                  // Loop over qdeck-tag pairs.
                  for (var ii_deck=0; ii_deck<local_n_decks; ii_deck++) {
                     var new_deck_html = process_qdeck_pair (qdeck_matches[ii_deck], i_deck);

                     // Let's take out <p...> and <h...> from before [qdeck].
                     new_html = new_html.replace (/(<[ph][^>]*>\s*)*?\[qdeck[\s\S]*?\[\/qdeck\]/m, new_deck_html);
                     i_deck++;
                  }
               }
            }

            // Restore examples, but without [qdeckdemo] ... [/qdeckdemo] tags.
            for (var i_qdeckdemo=0; i_qdeckdemo< n_qdeckdemos; i_qdeckdemo++) {
               var qdeckdemo_i = qdeckdemos[i_qdeckdemo];
               var len = qdeckdemo_i.length;
               qdeckdemo_i = qdeckdemo_i.substring (11, len - 12);
               new_html = new_html.replace ('<qdeckdemo></qdeckdemo>', qdeckdemo_i);
            }

            // Replace content html.
            $ (this).html (new_html);
         }

         // If wrapper divs, unwrap.
         if (qdeck_divs_obj.length) {
            $ (this).contents ().unwrap ();
         }
      }
      n_decks = i_deck;
   });

   // Set flag to display page (qwizscripts.js).
   q.processing_complete_b = true;
}


// -----------------------------------------------------------------------------
// Set up [textentry] autocomplete for this card.
function init_textentry_autocomplete (i_deck, i_card) {

   $ ('.qdeck_textentry_autocomplete').autocomplete ({
      minLength:     3,
      source:        find_matching_terms,
      close:         menu_closed,
      open:          menu_shown,
      select:        item_selected
   });

   $ ('.qdeck_textentry_autocomplete').keyup (menu_closed);

   // Gray out "Check answer"/"Flip" button, but leave enabled -- click will
   // print alert rather than do flip.  Also provide alert text as title.
   $ ('button.flip-qdeck' + i_deck).removeClass ('qbutton').addClass ('qbutton_disabled').attr ('title', Tcheck_answer_message);
   deckdata[i_deck].check_answer_disabled_b = true;
   deckdata[i_deck].textentry_n_hints = 0;

   // If haven't loaded metaphone.js, do so now.
   if (! loaded_metaphone_js_b) {
      loaded_metaphone_js_b = true;
      var plugin_url = qqc.get_qwiz_param ('url');
      qqc.add_script (plugin_url + 'metaphone.js');
   }

   // Use terms given with [terms]...[/terms] for this flashcard deck; otherwise
   // load default terms if haven't done so already.
   if (deckdata[i_deck].terms) {

      // Only do this once per flashcard deck.
      if (! deckdata[i_deck].textentry_terms_metaphones) {
         deckdata[i_deck].textentry_terms_metaphones = qqc.process_textentry_terms (deckdata[i_deck].terms);
      }
   } else {
      if (! default_textentry_terms_metaphones) {
         var terms_data = qqc.get_textentry_terms (plugin_url + 'terms.txt');
         default_textentry_terms_metaphones = qqc.process_textentry_terms (terms_data);
      }
   }

   // Also need to process additional terms for this flashcard deck, if any.
   // Only do once per deck.
   if (deckdata[i_deck].add_terms) {
      if (! deckdata[i_deck].add_textentry_terms_metaphones) {
         deckdata[i_deck].add_textentry_terms_metaphones = qqc.process_textentry_terms (deckdata[i_deck].add_terms);
      }
   }

   // Set terms for this card.  List of terms (term, metaphone pairs): 
   // (1) default or specific to this flashcard deck; plus (2) additional terms
   // for this deck, if any; and (3) specified entries for this [textentry].
   // Singular or plural in each case.
   var card = deckdata[i_deck].cards[i_card];

   var singular_plural;
   if (card.textentry_plural_b) {
      singular_plural = 'plural';
   } else {
      singular_plural = 'singular';
   }

   // (1) Quiz-specific or default.
   if (deckdata[i_deck].terms) {
      current_card_textentry_terms_metaphones[i_deck] = deckdata[i_deck].textentry_terms_metaphones[singular_plural];
   } else {
      current_card_textentry_terms_metaphones[i_deck] = default_textentry_terms_metaphones[singular_plural];
   }

   // (2) Additional.
   if (deckdata[i_deck].add_terms) {
      current_card_textentry_terms_metaphones[i_deck] = current_card_textentry_terms_metaphones[i_deck].concat (deckdata[i_deck].add_textentry_terms_metaphones[singular_plural]);
   }
   // (3) All specified entries.  Calculate metaphones up to first blank
   // following a non-blank.
   textentry_answers[i_deck] = card.all_choices;
   textentry_answer_metaphones[i_deck]
      = textentry_answers[i_deck].map (function (answer) {
                                          answer = answer.replace (/\s*(\S+)\s.*/, '\$1');
                                          return metaphone (answer);
                                       })

   var textentry_answers_metaphones
      = textentry_answers[i_deck].map (function (answer) {
                                  return [answer, metaphone (answer)];
                               });
   if (debug[6]) {
      console.log ('[display_question] textentry_answers_metaphones: ', textentry_answers_metaphones);
   }
   current_card_textentry_terms_metaphones[i_deck] = current_card_textentry_terms_metaphones[i_deck].concat (textentry_answers_metaphones);

   // Sort and de-dupe.
   current_card_textentry_terms_metaphones[i_deck]
      = qqc.sort_dedupe_terms_metaphones (current_card_textentry_terms_metaphones[i_deck]);

   if (debug[6]) {
      console.log ('[display_question] current_card_textentry_terms_metaphones[i_deck].length: ', current_card_textentry_terms_metaphones[i_deck].length);
      console.log ('[display_question] current_card_textentry_terms_metaphones[i_deck].slice (0, 10): ', current_card_textentry_terms_metaphones[i_deck].slice (0, 10));
      var i_start = current_card_textentry_terms_metaphones[i_deck].length - 10;
      if (i_start > 0) {
         console.log ('[display_question] current_card_textentry_terms_metaphones[i_deck].slice (' + i_start + '): ', current_card_textentry_terms_metaphones[i_deck].slice (i_start));
      }
   }
}


// -----------------------------------------------------------------------------
function add_style () {

   var s = [];

   s.push ('<style type="text/css">');

   /* The "canvas" for each item: question, answers (choices), feedback. */
   s.push ('.qcard_window {');
   s.push ('   position:            relative;');
   s.push ('}');

   s.push ('.qcard_progress {');
   s.push ('   text-align:          right;');
   s.push ('}');

   s.push ('.qcard_progress p {');
   s.push ('   font-size:           90%;');
   s.push ('   color:               gray;');
   s.push ('   margin:              0px;');
   s.push ('}');

   s.push ('div.qcard_header {');
   s.push ('   color:               white;');
   s.push ('   background:          black;');
   s.push ('   margin:              0px;');
   s.push ('   padding:             0px;');
   s.push ('}');

   /* Any sub-elements of header have zero margin. */
   s.push ('div.qcard_header * {');
   s.push ('   margin:              0px;');
                                 /* top right bot left */
   s.push ('   padding:             0px 5px 0px 5px;');
   s.push ('}');

            /* Card */
   s.push ('div.qcard_card {');
   s.push ('   position:            relative;');
   s.push ('}');

   s.push ('.qcard_textentry {');
   s.push ('   display:             inline-block;');
   s.push ('   position:            relative;');
   s.push ('   width:               240px;');
   s.push ('   font-weight:         bold;');
   s.push ('   color:               blue;');
   s.push ('}');

   s.push ('div.card_back_textentry {');
   s.push ('   position:            absolute;');
   s.push ('   top:                 0px;');
   s.push ('   left:                0px;');
   s.push ('   visibility:          hidden;');
   s.push ('}');

   s.push ('.back_qcard_textentry {');
   s.push ('   font-weight:         bold;');
   s.push ('   color:               blue;');
   s.push ('}');

   s.push ('input.qcard_textentry::-webkit-input-placeholder {');
   s.push ('   font-size:           83%;');
   s.push ('   font-weight:         normal;');
   s.push ('   color:               gray;');
   s.push ('}');

   s.push ('input.qcard_textentry::-moz-placeholder {');
   s.push ('   font-size:           83%;');
   s.push ('   font-weight:         normal;');
   s.push ('   color:               gray;');
   s.push ('}');

   /* Older versions of Firefox */
   s.push ('input.qcard_textentry:-moz-placeholder {');
   s.push ('   font-size:           83%;');
   s.push ('   font-weight:         normal;');
   s.push ('   color:               gray;');
   s.push ('}');

   s.push ('input.qcard_textentry:-ms-input-placeholder {');
   s.push ('   font-size:           83%;');
   s.push ('   font-weight:         normal;');
   s.push ('   color:               gray;');
   s.push ('}');

   s.push ('button.textentry_hint {');
   s.push ('   position:            absolute;');
   s.push ('   right:               2px;');
   s.push ('   top:                 50%;');
   s.push ('   transform:           translateY(-50%);');
   s.push ('   font-size:           11px;');
   s.push ('   line-spacing:        90%;');
                                 /* top right bot left */
   s.push ('   padding:             2px 2px 1px 2px;');
   s.push ('   border-radius:       5px;');
   s.push ('   display:             none;');
   s.push ('}');

   s.push ('.back_textentry_p {');
   s.push ('   margin-top:          0px;');
   s.push ('}');

   s.push ('table.qcard_table {');
   s.push ('   border-collapse:     separate;');
   s.push ('}');

   s.push ('div.qcard_card .front {');
   s.push ('   min-height:          280px;');
   s.push ('}');

   s.push ('div.qcard_card td.center {');
   s.push ('   position:            relative;');
   s.push ('   padding:             5px;');
   s.push ('   text-align:          center;');
   s.push ('   vertical-align:      middle;');
   s.push ('   font-size:           12pt;');
   s.push ('   font-weight:         bold;');
   s.push ('}');

   s.push ('div.qcard_card img {');
   s.push ('   border:              0px;');
   s.push ('   box-shadow:          none;');
   s.push ('}');

   s.push ('div.icon_qdeck {');
   s.push ('   position:        absolute;');
   s.push ('   left:            2px;');
   s.push ('   bottom:          2px;');
   s.push ('   width:           16px;');
   s.push ('   height:          16px;');
   s.push ('   line-height:     0px;');
   s.push ('}');

   s.push ('img.icon_qdeck {');
   s.push ('   opacity:         0.4;');
   s.push ('}');

   s.push ('img.icon_qdeck:hover {');
   s.push ('   opacity:         1.0;');
   s.push ('}');

   s.push ('div.qcard_card .back .center {');
   s.push ('   background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAf4AAAE2CAIAAAAPtmerAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAEnklEQVR4nO3YMW1AMRQEwTgyf3ix9Mm8sLCLnUFw1Ra3ZuYHgJLf1wMAuE36AXKkHyBH+gFypB8gR/oBcqQfIEf6AXKkHyBH+gFypB8gR/oBcqQfIEf6AXKkHyBH+gFypB8gR/oBcqQfIEf6AXKkHyBH+gFypB8gR/oBcqQfIEf6AXKkHyBH+gFypB8gR/oBcqQfIEf6AXKkHyBH+gFypB8gR/oBcqQfIEf6AXKkHyBH+gFypB8gR/oBcqQfIEf6AXKkHyBH+gFypB8gR/oBcqQfIGf//P293gDAVWtmXm8A4CqHD0CO9APkSD9AjvQD5Eg/QI70A+RIP0CO9APkSD9AjvQD5Eg/QI70A+RIP0CO9APkSD9AjvQD5Eg/QI70A+RIP0CO9APkSD9AjvQD5Eg/QI70A+Ts883rDQBctWakH6DF4QOQI/0AOdIPkCP9ADnSD5Aj/QA50g+QI/0AOdIPkCP9ADnSD5Aj/QA50g+QI/0AOdIPkCP9ADnSD5Aj/QA50g+QI/0AOdIPkCP9ADnSD5Aj/QA5+3zzegMAV60Z6QdocfgA5Eg/QI70A+RIP0CO9APkSD9AjvQD5Eg/QI70A+RIP0CO9APkSD9AjvQD5Eg/QI70A+RIP0CO9APkSD9AjvQD5Eg/QI70A+RIP0CO9APkSD9Azj7fvN4AwFVrRvoBWhw+ADnSD5Aj/QA50g+QI/0AOdIPkCP9ADnSD5Aj/QA50g+QI/0AOdIPkCP9ADnSD5Aj/QA50g+QI/0AOdIPkCP9ADnSD5Aj/QA50g+QI/0AOdIPkLPPN683AHDVmpF+gBaHD0CO9APkSD9AjvQD5Eg/QI70A+RIP0CO9APkSD9AjvQD5Eg/QI70A+RIP0CO9APkSD9AjvQD5Eg/QI70A+RIP0CO9APkSD9AjvQD5Eg/QI70A+Ts883rDQBctWakH6DF4QOQI/0AOdIPkCP9ADnSD5Aj/QA50g+QI/0AOdIPkCP9ADnSD5Aj/QA50g+QI/0AOdIPkCP9ADnSD5Aj/QA50g+QI/0AOdIPkCP9ADnSD5Aj/QA5+3zzegMAV60Z6QdocfgA5Eg/QI70A+RIP0CO9APkSD9AjvQD5Eg/QI70A+RIP0CO9APkSD9AjvQD5Eg/QI70A+RIP0CO9APkSD9AjvQD5Eg/QI70A+RIP0CO9APkSD9Azj7fvN4AwFVrRvoBWhw+ADnSD5Aj/QA50g+QI/0AOdIPkCP9ADnSD5Aj/QA50g+QI/0AOdIPkCP9ADnSD5Aj/QA50g+QI/0AOdIPkCP9ADnSD5Aj/QA50g+QI/0AOdIPkLPPN683AHDVmpF+gBaHD0CO9APkSD9AjvQD5Eg/QI70A+RIP0CO9APkSD9AjvQD5Eg/QI70A+RIP0CO9APkSD9AjvQD5Eg/QI70A+RIP0CO9APkSD9AjvQD5Eg/QI70A+Ts883rDQBctWakH6DF4QOQI/0AOdIPkCP9ADnSD5Aj/QA50g+QI/0AOdIPkCP9ADnSD5Aj/QA50g+QI/0AOdIPkCP9ADnSD5Aj/QA50g+QI/0AOdIPkCP9ADnSD5Aj/QA5/8mNPTHI1j+2AAAAAElFTkSuQmCC);');
   s.push ('   background-repeat:   no-repeat;');
   s.push ('   background-size:     contain;');
   s.push ('   background-position: center;');
   s.push ('   min-height:          280px;');
   s.push ('   line-height:         25px;');
   s.push ('   font-size:           12pt;');
   s.push ('}');
   s.push ('div.qcard_card button.cbutton {');
   s.push ('   display:          none;');
   s.push ('}');
   s.push ('.qcard_next_buttons {');
   s.push ('   position:            relative;');
   s.push ('   margin-top:          5px;');
   s.push ('   text-align:          center;');
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
   s.push ('.qbutton_disabled {');
   s.push ('   margin-bottom: 2px;');
   s.push ('   border-top: 1px solid #cccccc;');
   s.push ('   background: #cccccc;');
   s.push ('   padding: 3px 3px;');
   s.push ('   -webkit-border-radius: 8px;');
   s.push ('   -moz-border-radius: 8px;');
   s.push ('   border-radius: 8px;');
   s.push ('   -webkit-box-shadow: none;');
   s.push ('   -moz-box-shadow: none;');
   s.push ('   box-shadow: none;');
   s.push ('   text-shadow: none;');
   s.push ('   color: #e6e6e6;');
   s.push ('   font-size: 14px;');
   s.push ('   font-weight: bold;');
   s.push ('   font-family: arial, verdana, sans-serif;');
   s.push ('   text-decoration: none;');
   s.push ('   vertical-align: middle;');
   s.push ('}');
   s.push ('.qcard_next_buttons .qbutton:hover {');
   s.push ('   border-top-color: #28597a;');
   s.push ('   background: #28597a;');
   s.push ('   color: #ccc;');
   s.push ('}');
   s.push ('.qcard_next_buttons .qbutton:active {');
   s.push ('   border-top-color: #1b435e;');
   s.push ('   background: #1b435e;');
   s.push ('}');
   s.push ('.clear {');
   s.push ('   clear:               both;');
   s.push ('}');
   s.push ('// flipCard_v2.css.');
   s.push ('div.fc_card-container img{');
   s.push ('        position: static !important;');
   s.push ('}');
            /* === CARD CONTAINER === */
   s.push ('div.card-container {');
   s.push ('   position: relative;');
   s.push ('   display: block;');
   s.push ('   padding: 0;');
   s.push ('   margin: 0;');
   s.push ('        ');
   s.push ('   -webkit-perspective: 1000px;');
   s.push ('      -moz-perspective: 1000px;');
   s.push ('        -o-perspective: 1000px;');
   s.push ('       -ms-perspective: 1000px;');
   s.push ('           perspective: 1000px;');
   s.push ('}');
            /* === CARD === */
   s.push ('.card-container .card {');
   s.push ('   border-radius: 0px;');
   s.push ('   width: 100%;');
   s.push ('   height: 100%;');
   s.push ('   position: absolute;');
   s.push ('   display: inline-block;');
   s.push ('   padding: 0;');
   s.push ('   margin: 0;');
   s.push ('   -webkit-transition: -webkit-transform .7s;');
   s.push ('    -moz-transition: -moz-transform .7s;');
   s.push ('      -o-transition: -o-transform .7s;');
   s.push ('     -ms-transition: -o-transform .7s;');
   s.push ('         transition: transform .7s;');
   s.push ('   -webkit-transform-style: preserve-3d;');
   s.push ('      -moz-transform-style: preserve-3d;');
   s.push ('        -o-transform-style: preserve-3d;');
   s.push ('       -ms-transform-style: preserve-3d;');
   s.push ('           transform-style: preserve-3d;');
   s.push ('}');
            /* === STYLE FOR THE FRONT & BACK SIDE === */
   s.push ('.card-container .card>div{	');
   s.push ('   border-radius: 0px;');
   s.push ('   ');
   s.push ('   height: 100%;');
   s.push ('   width: 100%;');
   s.push ('   position: absolute;');
   s.push ('   background: #FFFFFF;');
   s.push ('   text-align: center;');
   s.push ('   ');
   s.push ('   margin: 0;');
   s.push ('   -webkit-box-sizing:border-box;');
   s.push ('      -moz-box-sizing:border-box;');
   s.push ('       -ms-box-sizing:border-box;');
   s.push ('           box-sizing:border-box;');
   s.push ('   -webkit-backface-visibility: hidden;');
   s.push ('      -moz-backface-visibility: hidden;');
   s.push ('        -o-backface-visibility: hidden;');
   s.push ('       -ms-backface-visibility: hidden;');
   s.push ('           backface-visibility: hidden;');
   s.push ('}');
            /* === BEGINNING EFFECT === */
   s.push ('.card-container .card[data-direction="top"] .back, .card-container .card[data-direction="bottom"] .back{');
   s.push ('   -webkit-transform: rotateX(180deg);');
   s.push ('      -moz-transform: rotateX(180deg);');
   s.push ('        -o-transform: rotateX(180deg);');
   s.push ('       -ms-transform: rotateX(180deg);');
   s.push ('           transform: rotateX(180deg);');
   s.push ('}');
   s.push ('.card-container .card[data-direction="right"] .back, .card-container .card[data-direction="left"] .back{');
   s.push ('        -webkit-transform: rotateY(180deg);');
   s.push ('         -moz-transform: rotateY(180deg);');
   s.push ('           -o-transform: rotateY(180deg);');
   s.push ('          -ms-transform: rotateY(180deg);');
   s.push ('              transform: rotateY(180deg);');
   s.push ('}');
            /* === EFFECT DIRECTIONS === */
   s.push ('.flipping-right {');
   s.push (' -webkit-transform: rotateY(180deg);');
   s.push ('    -moz-transform: rotateY(180deg);');
   s.push ('      -o-transform: rotateY(180deg);');
   s.push ('     -ms-transform: rotateY(180deg);');
   s.push ('         transform: rotateY(180deg);');
   s.push ('}');
   s.push ('.flipping-left {');
   s.push ('   -webkit-transform: rotateY(-180deg);');
   s.push ('    -moz-transform: rotateY(-180deg);');
   s.push ('      -o-transform: rotateY(-180deg);');
   s.push ('     -ms-transform: rotateY(-180deg);');
   s.push ('         transform: rotateY(-180deg);');
   s.push ('}');
   s.push ('.flipping-top {');
   s.push ('   -webkit-transform: rotateX(180deg);');
   s.push ('      -moz-transform: rotateX(180deg);');
   s.push ('        -o-transform: rotateX(180deg);');
   s.push ('       -ms-transform: rotateX(180deg);');
   s.push ('           transform: rotateX(180deg);');
   s.push ('}');
   s.push ('.flipping-bottom {');
   s.push ('   -webkit-transform: rotateX(-180deg);');
   s.push ('    -moz-transform: rotateX(-180deg);');
   s.push ('      -o-transform: rotateX(-180deg);');
   s.push ('     -ms-transform: rotateX(-180deg);');
   s.push ('         transform: rotateX(-180deg);');
   s.push ('}');
   s.push ('.noCSS3Container{');
   s.push ('        -webkit-perspective: none !important;');
   s.push ('           -moz-perspective: none !important;');
   s.push ('                 -o-perspective: none !important;');
   s.push ('            -ms-perspective: none !important;');
   s.push ('                        perspective: none !important; ');
   s.push ('}');
   s.push ('.noCSS3Card{');
   s.push ('   -webkit-transition: none !important;');
   s.push ('      -moz-transition: none !important;');
   s.push ('        -o-transition: none !important;');
   s.push ('       -ms-transition: none !important;');
   s.push ('                    transition: none !important;');
   s.push ('   -webkit-transform-style: none !important;');
   s.push ('      -moz-transform-style: none !important;');
   s.push ('        -o-transform-style: none !important;');
   s.push ('       -ms-transform-style: none !important;');
   s.push ('           transform-style: none !important;');
   s.push ('}');
   s.push ('.noCSS3Sides{');
   s.push ('   -webkit-backface-visibility: visible !important;');
   s.push ('      -moz-backface-visibility: visible !important;');
   s.push ('        -o-backface-visibility: visible !important;');
   s.push ('       -ms-backface-visibility: visible !important;');
   s.push ('           backface-visibility: visible !important;');
   s.push ('   -webkit-transform: none !important;');
   s.push ('      -moz-transform: none !important;');
   s.push ('        -o-transform: none !important;');
   s.push ('       -ms-transform: none !important;');
   s.push ('           transform: none !important;');
   s.push ('}');
   s.push ('</style>');

   $(s.join ('\n')).appendTo ('head');
}


// -----------------------------------------------------------------------------
function process_qdeck_pair (htm, i_deck) {

   // Data object for this deck.
   deckdata.push ({});

   // Array of cards ("cards").
   deckdata[i_deck].cards = [];

   deckdata[i_deck].showing_front_b = true;

   deckdata[i_deck].i_card = 0;

   deckdata[i_deck].n_reviewed = 0;
   deckdata[i_deck].n_got_it   = 0;

   deckdata[i_deck].exit_html = '';

   // Include any opening tags (e.g., "<p>" in WordPress).
   var qdeck_tag = htm.match (/(<[^\/][^>]*>\s*)*?\[qdeck[^\]]*\]/m)[0];

   var n_decks = 0;
   var new_html = '';
   var no_intro_i_b = false;

   // Is deck encoded?  Decode if necessary.
   //htm = decode_qdeck (htm, qdeck_tag);

   // Capture any initial closing tags after [qdeck ...] -- will put them in
   // front of <div> that replaces [qdeck ...].
   var m = htm.match (/\[qdeck[^\]]*\]((<\/[^>]+>\s*)*)/m, '');
   if (m) {
      var initial_closing_tags = m[1];
      new_html += initial_closing_tags;
   }

   // Delete [qdeck], any initial closing tags.
   htm = htm.replace (/\[qdeck[^\]]*\]((<\/[^>]+>\s*)*)/m, '');

   // Make sure there's at least one card.
   if (htm.search (/\[q([^\]]*)\]/m) == -1) {
      errmsgs.push (T ('Did not find question tags ("[q]") for') + ' qdeck ' + (i_deck + 1));
   } else {

      // See if html up to first shortcode is just whitespace, including empty
      // paragraphs.  Limit to first 2000 characters.
      var whitespace = parse_html_block (htm.substr (0, 2000), ['^'], ['[h]', '[i]', '[q]', '[q '], 'return whitespace');
      if (whitespace) {

         // Yes, delete it.
         htm = htm.replace (whitespace, '');
      }

      // See if header.  Sets deckdata[i_deck].header_html.
      htm = process_header (htm, i_deck, true);

      // See if intro.  Limit to first 2000 characters.
      var intro_html = parse_html_block (htm.substr (0, 2000), ['[i]'], ['[q]', '[q ']);

      // See if no [i].
      if (intro_html == 'NA') {

         // No [i] -- intro may be text before [q].  See if there is.
         intro_html = parse_html_block (htm.substr (0, 2000), ['^'], ['[q]', '[q '], true);
      }

      // See if intro was just tags and whitespace.
      if (intro_html == '') {
         no_intro_i_b = true;
      } else {
         // Error if text before [i].
         if (htm.substr (0, 5) != intro_html.substr (0, 5)) {
            errmsgs.push (T ('Text before intro') + ' [i] - qdeck ' + (i_deck + 1));
         }

         // Delete [i] from intro.
         intro_html = intro_html.replace ('[i]', '');

         // If there's a [start] tag, replace with start button html.  Otherwise
         // add start button html.
         var start_button_html = '<button class="qbutton" onclick="' + qname + '.start_deck (' + i_deck + ')">' + T ('Start reviewing cards') + '</button>';
         if (intro_html.indexOf ('[start]') != -1) {
            intro_html = intro_html.replace ('[start]', start_button_html);
         } else {
            intro_html += start_button_html;
         }

         // Add Qwiz icon to intro.
         intro_html += create_qwiz_icon_div (i_deck);

         // Save introductory html.
         deckdata[i_deck].intro_html = intro_html;
      }

      // card_html -- everything from first [q] on.
      var card_html = htm.match (/\[q [^\]]*\][\s\S]*|\[q\][\s\S]*/m)[0];

      // Find topic attributes, if any, for card.  First get [q] tags.
      var card_tags = card_html.match (/\[q[^\]]*\]/gm);
      if (debug[4]) {
         console.log ('[process_qdeck_pair] card_tags[0]: ', card_tags[0]);
      }
      var n_cards = card_tags.length;
      if (debug[0]) {
         console.log ('[process_qdeck_pair] n_cards: ', n_cards);
      }

      // Topic or topics each card.
      deckdata[i_deck].card_topics = new Array (n_cards);

      // List of all topics.
      deckdata[i_deck].topics = [];

      process_topics (i_deck, card_tags);

      // Capture any opening tags before each "[q...] tag.  Skip "[qdeck]".
      var matches = htm.match (/(<[^\/][^>]*>\s*)*?\[q[ \]]/gm);
      var q_opening_tags = [];
      for (var i_card=0; i_card<n_cards; i_card++) {
         var len = matches[i_card].length;
         q_opening_tags.push (matches[i_card].substr (0, len-3));
      }
      if (debug[0]) {
         console.log ('[process_qdeck_pair] q_opening_tags: ', q_opening_tags.join (', '));
      }

      // Take off initial "[q]" (or "[q topic=...]" and closing "[/qdeck]".
      var start = card_html.search (/\]/) + 1;
      var len = card_html.length;
      card_html = card_html.substring (start, len-8);

      // If there's exit html, capture for summary report.
      var exit_html = card_html.match (/\[x\]([\s\S]*)/m);
      if (exit_html) {

         // If "[restart]" tag there, replace with restart button html.
         var restart_button_html =
                          '    <button class="qbutton"'
                        + '            onclick="' + qname + '.start_deck (' + i_deck + ')">\n'
                        +          T ('Review this flashcard stack again') + '\n'
                        + '    </button>\n';
         exit_html = exit_html[1].replace ('[restart]', restart_button_html);
         deckdata[i_deck].exit_html = exit_html;

         // Delete exit html from card html.
         card_html = card_html.replace (/\[x\][\s\S]*/m, '');
      }

      // Split into individual cards -- [q] (fronts) and [a] (backs).
      var cards_html = card_html.split (/\[q [^\]]*\]|\[q\]/);

      // Save each card and answer html in data array.
      for (var i_card=0; i_card<n_cards; i_card++) {
         var card;

         // See if required input for [textentry] -- [c] or [c*] on card.
         if (cards_html[i_card].search (/\[c\]|\[c\*\]/m) != -1) {
            card = process_textentry (i_deck, i_card, cards_html[i_card],
                                      q_opening_tags[i_card]);
         } else {
            card = process_card_input (i_deck, i_card, cards_html[i_card],
                                       q_opening_tags[i_card]);
         }
         deckdata[i_deck].cards.push (card);
      }

   }
   no_intro_b.push (no_intro_i_b);
   deckdata[i_deck].n_cards = n_cards;
   deckdata[i_deck].n_to_go = n_cards;

   // First [qdeck] tag becomes start of container for card.  Add additional
   // div elements (progress, summary div, "next" buttons).
   new_html = create_qdeck_divs (i_deck, qdeck_tag);

   if (debug[3]) {
      console.log ('                    new_html: ', new_html);
   }

   return new_html;
}


// -----------------------------------------------------------------------------
function create_qwiz_icon_div (i_deck) {
   var style = '';
   if (qqc.get_qwiz_param ('beta')) {
      style = 'style = "background: red;"';
   }
   var divs = [];
   divs.push ('<div id="icon_qdeck' + i_deck + '" class="icon_qdeck" ' + style + '>');
   var icon_qwiz = qqc.get_qwiz_param ('icon_qwiz');
   if (icon_qwiz != 'Not displayed') {
      var title = 'Qwiz - online quizzes and flashcards';
      if (icon_qwiz != 'Icon only') {
         divs.push ('<a href="//dkprojects.net/qwiz">');
      } else {
         title += ' - dkprojects.net/qwiz';
      }

      divs.push ('      <img class="icon_qdeck" style="border: none;" title="' + title + '" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAUCAIAAAALACogAAAABnRSTlMA/wD/AP83WBt9AAAACXBIWXMAAA7EAAAOxAGVKw4bAAABP0lEQVR4nGP8//8/AymAiSTV5GhgwSZ4rcRrxRooW3futlBnJDlGND/cXzXVccFLVP0oepiwqtZJyH2wrenBtogQBgYGhsv9q15j9cO1qTDVW8JEGRgYGBi0PJ0YGBgYrjzCpuH+qv1rGBgYGHQLoaoZGBgYlOTEGRgYGB68uY+h4fXuQy8ZGBgYnLSRvXjv0UsGBgYGBRFFdA1Prm+6x8DAwBBio4XsyO37GBgYGHTkEHaixYO4mszrWTl1CjmH7iMcKe5nhdAAi4cnL6/A3HbrHgMDw56pJ0QYIOHr5JgmgzASZoOFdggDAwPDy03HRCEhs6YJEne6c0uQHYkUcXt76pL3oTqQQbxqVjay8Sh+cC5pmuuEpkFMWQZNBCNpwMDrWTmT2+5hCCu54EqtomkVLjqYwgoiuGzACWifgQDhK2rq5bcX2gAAAABJRU5ErkJggg==" />');

      if (icon_qwiz != 'Icon only') {
         divs.push ('</a>');
      }
   }
   divs.push ('</div>');

   return divs.join ('');
}


// -----------------------------------------------------------------------------
// Get card front and card back html, put into data array.
function process_card_input (i_deck, i_card, htm, opening_tags) {

   // Object for this card.
   var card = {};
   card.got_it = false;

   // Start with any opening tags that preceded "[q]" tag.
   var card_front_html = opening_tags + htm;

   // Get rid of everything from "[a]" (card back) on.
   card_front_html = card_front_html.replace (/\[a\][\s\S]*/m, '');
   if (debug[1]) {
      console.log ('[process_card_input] card_front_html: ', card_front_html);
   }

   // If [textentry], change to html equivalent.  Save flag if there.
   var new_card_front_html = card_front_textentry_html (card_front_html, i_deck);
   card.card_front = new_card_front_html;
   var front_textentry_b = new_card_front_html.length != card_front_html.length;


   // ..........................................................................
   // Find card back html.
   var card_back_html = htm.match (/\[a\][\s\S]*/m);
   if (debug[0]) {
      console.log ('[process_card_input] card_back_html: ', card_back_html);
   }

   // Take off initial "[a]".
   if (! card_back_html) {
      errmsgs.push (T ('Did not find answer ("[a]") -- card back -- for') + ' qdeck ' + (i_deck + 1) + ', ' + T ('card') + ' ' + (i_card + 1) + '\n' + htm);
      card_back_html = '';
   } else {
      card_back_html = card_back_html[0].substring (3);
   }

   // Split into individual items.  Should be just one.
   var card_back_items = card_back_html.split (/\[a\]/);
   if (card_back_items.length != 1) {
      errmsgs.push (T ('Got more than one answer ("[a]") -- card back -- for') + ': qdeck ' + (1 + i_deck) + ', ' + T ('card') + ' ' + (1 + i_card) + '\n' + htm);
   }

   // Capture any opening tags before "[a]" tag.
   var a_opening_tags;
   var m = htm.match (/(<[^\/][^>]*>\s*)*?\[a\]/m);
   if (m && m[1]) {
      a_opening_tags = m[1];
      if (debug[0]) {
         console.log ('[process_card_input] a_opening_tags: ', a_opening_tags);
      }
   } else {
      a_opening_tags = '';
   }

   // Save html for "[a]".
   card.card_back = create_card_back_html (i_deck, i_card, card_back_items[0],
                                           a_opening_tags, front_textentry_b);
   return card;
}


// -----------------------------------------------------------------------------
// Process input for card with [textentry] with required input/autocomplete.
function process_textentry (i_deck, i_card, htm, opening_tags) {

   // Object for this card.
   var card = {};
   card.got_it = false;

   // Start with any opening tags that preceded "[q]" tag.
   var card_front_html = opening_tags + htm;

   // Look for [textentry], see if plurals specified..
   var textentry_plural_b = false;
   var m = htm.match (/\[textentry([^\]]*)\]/m);
   if (! m) {
      errmsgs.push (T ('Free-form input choices [c] or [c*] card does not have [textentry]'));
   } else {
      var attributes = m[1];
      if (attributes) {

         // Look for "plural=" attribute.  Match regular double-quote, or
         // left- or right-double-quote.
         attributes = qqc.replace_smart_quotes (attributes);
         textentry_plural_b = qqc.get_attr (attributes, 'plural') == 'true';
      }
   }

   // Replace [textentry] with input textbox and (hidden, initially) hint button.
   var input_and_button_htm =   '<div class="qcard_textentry">\n'
                              +    '<input type="text" id="textentry-qdeck' + i_deck + '" class="qcard_textentry qdeck_textentry_autocomplete" placeholder="' + T ('Type chars, then select from list') + '" onfocus="' + qname + '.set_textentry_i_deck (this)" />\n'
                              +    '<button id="textentry_hint-qdeck' + i_deck + '" class="qbutton textentry_hint" onclick="' + qname + '.textentry_hint (' + i_deck + ')" disabled>'
                              +        T ('Hint')
                              +    '</button>\n'
                              + '</div>\n';
   htm = htm.replace (/\[textentry([^\]]*)\]/, input_and_button_htm);

   // Look for choices and answers/feedback (interleaved, answer/feedback
   // required for each choice).  Save as data, delete here.
   var choice_start_tags = ['[c]', '[c*]'];
   var choice_next_tags  = ['[c]', '[c*]', '[x]'];

   var got_feedback_b = false;

   // Look for first [c], including any opening tags.
   var c_pos = htm.search (/\s*(<[^\/][^>]*\s*)*?\[c\*{0,1}\]/m); 

   // Start with [c]s.
   var remaining_htm = htm.substr (c_pos);

   // Delete opening tags before first [c] and the rest.
   htm = htm.substr (0, c_pos);

   // Save as card front, set flag that entry required.
   card.card_front = htm;
   card.textentry_required_b = true;

   // Set up data for this card, create a div for each feedback alt -- so can
   // measure each, set front and back card size.  Div to show selected in
   // this.flip () > textentry_set_card_back () depending on text entered.
   card.choices = [];
   card.textentry_plural_b = textentry_plural_b;
   card.feedback_htmls = [];
   card.all_choices = [];
   card.card_back = '';
   var card_back = '';

   // Loop over [c]s.
   var i_choice = 0;
   var default_choice_given_b = false;
   while (true) {
      var choice_html = parse_html_block (remaining_htm, choice_start_tags,
                                          choice_next_tags);
      if (choice_html == 'NA') {
         break;
      }
      remaining_htm = remaining_htm.substr (choice_html.length);

      // See if there's feedback within the choice html.
      var r = process_feedback_item (choice_html);
      choice_html  = r.choice_html;

      if (r.feedback_html) {
         got_feedback_b = true;

         card.feedback_htmls.push (r.feedback_html);
         card_back +=  '<div id="textentry_feedback_qdeck' + i_deck + '-f' + i_choice + '" class="card_back_textentry">\n'
                     +    '<p class="back_textentry_p">' + T ('You entered') + ' &ldquo;<span class="back_qcard_textentry">&emsp;&emsp;&emsp;&emsp;&emsp;</span>&rdquo;</p>'
                     +    r.feedback_html
                     + '</div>\n';


         // Check that there's not more than one feedback item accompanying
         // this choice.
         var r = process_feedback_item (choice_html);
         if (r.feedback_html) {
            errmsgs.push (T ('More than one answer or feedback shortcode [a] or [f] given with [textentry] choice') + ': qdeck ' + (1 + i_deck) + ', ' + T ('card') + ' ' + (1 + i_card) + ', ' + T ('choice') + ' ' + (1 + i_choice));
         }
      } else {

         // No answers/feedback given for this choice.
         errmsgs.push (T ('Did not get answer/feedback [a] or [f] for [textentry] choice') + ': qdeck ' + (1 + i_deck) + ', ' + T ('card') + ' ' + (1 + i_card) + ', ' + T ('choice') + ' ' + (1 + i_choice));
         card.feedback_htmls.push ('');
      }

      // Parse choice data.  [c] or [c*] followed by semicolon-separated list
      // of potential answers.  Delete up through [c] or [c*].
      choice_html = choice_html.replace (/.*\[c\*{0,1}\]/m, '');

      // Delete any tags and EOLs and non-breaking spaces.
      choice_html = choice_html.replace (/<[^>]+>|\n|&nbsp;/g, '');

      // Error if just blanks and semicolons.
      if (choice_html.replace (';', '').search (/\S/) == -1) {
         errmsgs.push (T ('No text given for [textentry] choice') + ' - qdeck ' + (i_deck + 1) + ', ' + T ('question') + ' ' + (1 + i_card) + ', ' + T ('choice') + ' ' + (1 + i_choice));
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

         // Must be accompanied by feedback/answer (no default for "wrong
         // answers").
         if (card.feedback_htmls[i_choice] == '') {
            errmsgs.push (T ('For [textentry] card, wildcard choice ("*", for any other user entry) must be accompanied by answer/feedback "[a] or [f]"'));
         }
      }

      // Save these, associated with this choice.
      card.choices.push (nonblank_alts);

      // Also save as simple array for this card.  Check no duplicates (only
      // first instance feedback would be given).
      var n_alts = nonblank_alts.length;
      for (var i=0; i<n_alts; i++) {
         if (card.all_choices.indexOf (nonblank_alts[i]) != -1) {
            errmsgs.push (T ('Entry given in more than one [textentry] choice') + ': ' + nonblank_alts[i] + ' - qdeck ' + (i_deck + 1) + ', ' + T ('card') + ' ' + (1 + i_card) + ', ' + T ('choice') + ' ' + (1 + i_choice));
         }
      }
      card.all_choices = card.all_choices.concat (nonblank_alts);
      i_choice++;
   }
   card.card_back = card_back;

   // If default choice ([c] *) and feedback/answer supplied, must be at least
   // one other choice-feedback/answer pair.
   if (default_choice_given_b) {
      if (card.choices.length == 1) {
         errmsgs.push (T ('Need to define acceptable entries for [textentry] card in addition to "other entry" choice ([c] *)') + ' - qdeck ' + (i_deck + 1) + ', ' + T ('card') + ' ' + (1 + i_card));
      }
   }
   if (debug[6]) {
      console.log ('[process_textentry] card.choices:', card.choices);
      console.log ('[process_textentry] card.feedback_htmls:', card.feedback_htmls);
   }

   return card;
}


// -----------------------------------------------------------------------------
function process_feedback_item (choice_html) {

   // Answers/feedback.
   var feedback_start_tags = ['[a]', '[f]'];
   var feedback_next_tags  = ['[a]', '[f]', '[x]'];

   var feedback_html = parse_html_block (choice_html, feedback_start_tags,
                                              feedback_next_tags);
   if (feedback_html != 'NA') {

      // Yes.  Take out of the choice html.
      choice_html = choice_html.replace (feedback_html, '');

      // Delete [a] or [f].
      feedback_html = feedback_html.replace (/\[[af]\]/, '');
      if (debug[2]) {
         console.log ('[process_feedback_item] feedback_html: ', feedback_html);
      }
   } else {
      feedback_html = '';
   }
   if (debug[2]) {
      console.log ('[process_feedback_item] feedback_html:', feedback_html);
      console.log ('[process_feedback_item] choice_html:', choice_html);
   }

   return {'feedback_html': feedback_html, 'choice_html': choice_html};
}


// -----------------------------------------------------------------------------
// Provide first letters of first correct answer as hint, up to five letters.
this.textentry_hint = function (i_deck) {
   deckdata[i_deck].textentry_n_hints++;

   // Disable hint button, reset label.
   $ ('#textentry_hint-qdeck' + i_deck).attr ('disabled', true).removeClass ('qbutton').addClass ('qbutton_disabled').html ('Add.<br />hint');

   var i_card = deckdata[i_deck].i_card;
   var card = deckdata[i_deck].cards[i_card];
   var textentry_hint = card.all_choices[0].substr (0, deckdata[i_deck].textentry_n_hints);
   var textentry_obj = $ ('#textentry-qdeck' + i_deck);
   textentry_obj.val (textentry_hint).focus ();

   // Trigger search on entry -- handles hints that don't match anything (grays
   // "Check answer"/"Flip") and those that do.
   textentry_obj.autocomplete ('search');
}


// -----------------------------------------------------------------------------
this.set_textentry_i_deck = function (input_el) {

   // See which flashcard deck this is.  Save in global (private) variable.
   // id looks like textentry-qdeck0
   var id = input_el.id;
   textentry_i_deck = id.match (/[0-9]+/)[0];
   if (debug[6]) {
      console.log ('[set_textentry_i_deck] textentry_i_deck: ', textentry_i_deck);
   }
}


// -----------------------------------------------------------------------------
function create_card_back_html (i_deck, i_card, htm, opening_tags, front_textentry_b) {

   var new_html = opening_tags + htm;

   // See if '[textentry]' present.
   if (htm.search (/\[.*textentry.*/) != -1) {

      // Yes.  Error if no textentry on front.
      if (! front_textentry_b) {
         errmsg.push (T ('[textentry] on back of card, but not on front') + ' - qdeck ' + (i_deck+1) + ', ' + T ('card') + ' ' (i_card+1));
      }

      // Convert to equivalent html.
      new_html = card_back_textentry_html (new_html);
   } else {

      // No.  If there was textentry on front, create default echo.
      if (front_textentry_b) {
         var prepend_html = '<p id="back_textentry_p-qdeck' + i_deck + '" class="back_textentry_p">' + T ('You wrote') + ' &ldquo;<span id="back_textentry-qdeck' + i_deck + '" class="back_qcard_textentry">&emsp;&emsp;&emsp;&emsp;&emsp;</span>&rdquo;</p>';
         new_html = prepend_html + new_html;
      }
   }
   if (debug[2]) {
      console.log ('[create_card_back_html] new_html:', new_html);
   }

   return opening_tags + new_html;
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
   var opening_pat =  '\\s*(<[^/][^>]*>\\s*)*?';
   var tags_pat = opening_pat + tags_to_pat (qtags);
   var next_tags_pat = opening_pat + tags_to_pat (qnext_tags);

   // Final term collects any immediate closing tags after next qtags.
   var closing_pat = '((</[^>]+>\\s*)*)';
   var re = new RegExp ('([\\s\\S]*?)(' + tags_pat + '[\\s\\S]*?)' + next_tags_pat + closing_pat, 'im');
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
function process_header (htm, i_deck, intro_b) {
   var qtags = ['[h]'];
   var qnext_tags = ['[q]', '[q '];
   if (intro_b != undefined) {
      qnext_tags.push ('[i]');
   }

   // Limit to first 1000 characters.
   var header_html = parse_html_block (htm.substr (0, 1000), qtags, qnext_tags);
   if (header_html != 'NA' && header_html != '') {

      // Error if text before [h].
      if (htm.substr (0, 5) != header_html.substr (0, 5)) {
         errmsgs.push (T ('Text before header') + ' [h] - qdeck ' + (i_deck + 1));
      }

      // Delete header from htm.
      htm = htm.replace (header_html, '');

      // Delete [h] from header.
      header_html = header_html.replace (/\[h\]/ig, '');

      // Delete line-breaks from header.
      header_html = header_html.replace (/<br.*?>/ig, '');
   }
   deckdata[i_deck].header_html = header_html;

   return htm;
}


// -----------------------------------------------------------------------------
// Divs for card, progress, "next" buttons.
function create_qdeck_divs (i_deck, qdeck_tag) {

   // Capture any style info or other attributes provided.  If styles not set
   // for width, height, and border do so now.  (Do as style in order to
   // override WordPress class for <table>).
   var m = qdeck_tag.match (/\[qdeck([^\]]*)\]/m);
   var attributes = m[1];
   var default_style = ' style="width: 500px; height: 300px; border: 2px solid black;"';
   deckdata[i_deck].card_width_setting = '500px';
   deckdata[i_deck].card_height_setting = '300px';
   if (! attributes) {
      attributes = default_style;
   } else {

      // Replace any "smart quotes" with regular quotes.
      attributes = qqc.replace_smart_quotes (attributes);
      if (attributes.search (/style\s*?=/m) == -1) {
         attributes += default_style;
      } else {
         if (attributes.search ('width') == -1) {
            attributes = attributes.replace (/(style\s*?=\s*?["'])/m, '$1width: 500px; ');
         } else {
            m = attributes.match (/width\s*:\s*([^;\s]*)[;\s$]/m);
            if (m) {
               deckdata[i_deck].card_width_setting = m[1];
            }
         }
         if (attributes.search ('height') == -1) {
            attributes = attributes.replace (/(style\s*?=\s*?["'])/m, '$1height: 300px; ');
         } else {
            m = attributes.match (/height\s*:\s*([^;\s]*)[;\s$]/m);
            if (m) {
               deckdata[i_deck].card_height_setting = m[1];
            }
         }
         if (attributes.search ('border') == -1) {
            attributes = attributes.replace (/(style\s*?=\s*?["'])/m, '$1border: 2px solid black; ');
         }
      }

      // If "random=..." present, parse out true/false.
      var random = qqc.get_attr (attributes, 'random');
      deckdata[i_deck].random_b = random == 'true';
      if (debug[0]) {
         console.log ('[create_qdeck_divs] random:', random, ', random_b:', deckdata[i_deck].random_b);
      }
   }

   if (debug[0]) {
      console.log ('[create_qdeck_divs] attributes: ', attributes);
   }

   var divs = [];

   // Add z-index, so if large graphic expands card, will stay on top of decks
   // farther down the page.
   divs.push ('<div id="qcard_window-qdeck' + i_deck + '" class="qcard_window" style="z-index: ' + (20 - i_deck) + ';">');
   divs.push ('   <div id="qcard_progress-qdeck' + i_deck + '" class="qcard_progress">');
   divs.push ('   </div>');
   divs.push ('   <div id="qcard_header-qdeck' + i_deck + '" class="qcard_header">');
   divs.push ('   </div>');
   divs.push ('   <div class="card-container"> ');
   divs.push ('      <div id="qcard_card-qdeck' + i_deck + '" class="qcard_card card" data-direction="right"> <button class="cbutton-qdeck' + i_deck + ' cbutton">Flip</button>');
   divs.push ('         <div class="front">');
   divs.push ('            <table class="qcard_table" ' + attributes + ' cellspacing="0" cellpadding="0">');
   divs.push ('               <tr>');
   divs.push ('                  <td class="center">');
   divs.push ('                  </td>');
   divs.push ('               </tr>');
   divs.push ('            </table>');
   divs.push ('         </div>');
   divs.push ('         <div class="back">');
   divs.push ('            <table class="qcard_table" ' + attributes + ' cellspacing="0" cellpadding="0">');
   divs.push ('               <tr>');
   divs.push ('                  <td class="center">');
   divs.push ('                  </td>');
   divs.push ('               </tr>');
   divs.push ('            </table>');
   divs.push ('         </div>');
   divs.push ('      </div>');
   divs.push ('   </div>');
   divs.push ('   <div id="qcard_next_buttons-qdeck' + i_deck + '" class="qcard_next_buttons">');
   divs.push ('   </div>');
   divs.push ('</div>');

   return divs.join ('\n');
}


// -----------------------------------------------------------------------------
function process_topics (i_deck, card_tags) {

   // Loop over tags.
   var n_cards_w_topics = 0;
   var n_cards = card_tags.length;
   for (var i_card=0; i_card<n_cards; i_card++) {
      var card_tag = card_tags[i_card];

      // See if any topic attribute.
      var matches = card_tag.match (/\[q +([^\]]*)\]/);
      if (matches) {
         var attributes = matches[1];
         attributes = qqc.replace_smart_quotes (attributes);
         var card_topics = qqc.get_attr (attributes, 'topic');
         if (card_topics) {
            if (debug[4]) {
               console.log ('[process_topics] card_topics: ', card_topics);
            }

            // Multiple topics for a card - separated by semicolon (and
            // optional space).  Split into array.
            card_topics = card_topics.split (/; */);
            deckdata[i_deck].card_topics[i_card] = card_topics;
            n_cards_w_topics++;

            // Add topics to list of topics if not already in list.
            for (var i=0; i<card_topics.length; i++) {
               var topic = card_topics[i];
               if (deckdata[i_deck].topics.indexOf (topic) == -1) {
                  deckdata[i_deck].topics.push (topic);
               }
            }
         }
      }
   }

   if (n_cards_w_topics > 0) {

      // If any topics given, every card must have at least one topic.
      if (n_cards_w_topics != n_cards) {
         errmsgs.push (T ('Topic(s) were given for at least one card, but at least one card doesn\'t have a topic'));
      }
      if (debug[4]) {
         console.log ('[process_topics] topics: ' + deckdata[i_deck].topics.join ('; '));
      }

      // Set up statistics by topic.  Object of objects (list of lists).
      deckdata[i_deck].topic_statistics = {};
      var n_topics = deckdata[i_deck].topics.length;
      for (var i_topic=0; i_topic<n_topics; i_topic++) {
         var topic = deckdata[i_deck].topics[i_topic];
         deckdata[i_deck].topic_statistics[topic] = {};
         deckdata[i_deck].topic_statistics[topic].n_correct = 0;
         deckdata[i_deck].topic_statistics[topic].n_incorrect = 0;
      }
   }
}


// -----------------------------------------------------------------------------
this.start_deck = function (i_deck) {
   deckdata[i_deck].i_card = 0;
   deckdata[i_deck].n_got_it = 0;
   deckdata[i_deck].n_reviewed = 0;

   var n_cards = deckdata[i_deck].n_cards;
   deckdata[i_deck].n_to_go = n_cards;

   q.set_next_buttons (i_deck);

   for (var ii_card=0; ii_card<n_cards; ii_card++) {
      deckdata[i_deck].cards[ii_card].got_it = false;
   }

   for (var i_topic=0; i_topic<n_topics; i_topic++) {
      var topic = deckdata[i_deck].topics[i_topic];
      deckdata[i_deck].topic_statistics[topic].n_got_it = 0;
   }

   init_card_order (i_deck);
   q.process_card (i_deck);
};


// -----------------------------------------------------------------------------
function check_qdeck_tag_pairs (htm) {

   var new_htm = '';

   // Match "[qdeck]" or "[/qdeck]".
   var matches = htm.match (/\[qdeck|\[\/qdeck\]/gm);
   if (matches) {
      var n_tags = matches.length;
      var error_b = false;

      if (n_tags % 2 != 0) {
         error_b = true;
      } else {

         // Check proper pairs.
         for (var i=0; i<n_tags; i++) {
            if (i % 2 == 0) {
               if (matches[i] != '[qdeck') {
                  error_b = true;
                  break;
               }
            } else {
               if (matches[i] != '[/qdeck]') {
                  error_b = true;
                  break;
               }
            }
         }
      }
      if (error_b){

         // If we're inside an excerpt, no error.  Delete from '[qdeck]' up to
         // '<p class="more-link' if possible,  In any event non-null return
         // signals not to process.
         if (htm.search ('more-link') != -1) {

            var pos_qdeck = htm.search (/\[qdeck/);
            var pos_more  = htm.search ('<p class="more-link');
            if (pos_more != -1) {
               new_htm = htm.substring (0, pos_qdeck) + htm.substr (pos_more);
            } else {
               new_htm = htm;
            }
         } else {
            alert (T ('Unmatched [qdeck] - [/qdeck] pairs.'));
         }
      }
   }

   return new_htm;
}


// -----------------------------------------------------------------------------
function card_front_textentry_html (htm, i_deck) {

   // Change '[textentry]' to appropriate htm.
   var new_html = htm.replace ('[textentry]', '<input type="text" id="textentry-qdeck' + i_deck + '" class="qcard_textentry" />');
   if (debug[1]) {
      console.log ('[card_front_textentry_html] new_html: ', new_html);
   }
   return new_html;
}


// -----------------------------------------------------------------------------
function card_back_textentry_html (htm, i_deck) {

   // Change to appropriate html.
   // Spec is either
   //    (1) [optional text textentry more optional text]
   // or (2) [optional text <span id="back_textentry" class="qdeck_textentry" etc.></span> more optional text]
   //
   // If user does not make an entry on front of card, then nothing within
   // square brackets is shown when flip to back.

   // Change id="back_textentry" to id="textentry-qdeck...", otherwise expand to
   // equivalent.
   if (htm.indexOf ('id="back_textentry"') != -1) {
      htm = htm.replace ('back_textentry', 'back_textentry-qdeck' + i_deck);
   } else {
      htm = htm.replace ('textentry', '<span id="back_textentry-qdeck' + i_deck + '" class="back_qdeck_textentry"></span>');
   }

   // Convert "[" and "]" to paragraph.
   htm = htm.replace (/\[([^[]*textentry.*?)\]/, '<p id="back_textentry_p-qdeck' + i_deck + '" class="back_textentry_p">$1</p>');
   if (debug[0]) {
      console.log ('[card_back_textentry_html] htm:', htm);
   }

   return htm;
}


// -----------------------------------------------------------------------------
function check_and_init_topics () {

   var errmsg = [];

   // Collect topics from cards, see if we have a topic description.
   for (var ii_card=0; ii_card<n_cards; ii_card++) {
      var card_topics = cards[ii_card].topics;
      for (var ii=0; ii<card_topics.length; ii++) {
         topic = card_topics[ii];
         if (topics.indexOf (topic) == -1) {

            // Add to list.
            topics.push (topic);
         }

         // Did we get a topic description?
         if (! topic_descriptions.hasOwnProperty (topic)) {
            errmsg.push ('Did not get topic/description for topic ' + topic);
         }
      }
   }
   n_topics = topics.length;

   // Set up statistics by topic.  Object of objects (list of lists).
   for (var i_topic=0; i_topic<n_topics; i_topic++) {
      var topic = topics[i_topic];
      topic_statistics[topic] = {};
      topic_statistics[topic].n_got_it = 0;
   }

   return errmsg;
}


// -----------------------------------------------------------------------------
function init_element_pointers (i_deck) {

   // jQuery element objects for this deck.
   deckdata[i_deck].el_qcard_container  = $('div#qcard_window-qdeck' + i_deck + ' div.card-container');
   deckdata[i_deck].el_flip             = $('button.cbutton-qdeck' + i_deck);
   deckdata[i_deck].el_progress         = $('div#qcard_progress-qdeck' + i_deck);
   deckdata[i_deck].el_header           = $('div#qcard_header-qdeck' + i_deck);
   deckdata[i_deck].el_qcard_card       = $('div#qcard_card-qdeck' + i_deck);
   deckdata[i_deck].el_qcard_table_front= $('div#qcard_card-qdeck' + i_deck + ' div.front table');
   deckdata[i_deck].el_qcard_table_back = $('div#qcard_card-qdeck' + i_deck + ' div.back  table');
   deckdata[i_deck].el_qcard_card_front = $('div#qcard_card-qdeck' + i_deck + ' div.front td.center');
   deckdata[i_deck].el_qcard_card_back  = $('div#qcard_card-qdeck' + i_deck + ' div.back  td.center');
   deckdata[i_deck].el_next_buttons     = $('div#qcard_next_buttons-qdeck' + i_deck);

   if (debug[5]) {
      console.log ('[init_element_pointers] el_next_buttons:', deckdata[i_deck].el_next_buttons);
   }
}


// -----------------------------------------------------------------------------
function init_card_order (i_deck) {
   var n_cards = deckdata[i_deck].n_cards;
   deckdata[i_deck].card_order = new Array (n_cards);
   for (var i=0; i<n_cards; i++) {
      deckdata[i_deck].card_order[i] = i;
   }

   // Shuffle if attribute for initial random order set (random="true").
   if (deckdata[i_deck].random_b) {
      deckdata[i_deck].card_order = shuffle (deckdata[i_deck].card_order);
   }
}


// -----------------------------------------------------------------------------
// Needs to be available publicly -- e.g., as qcard.set_next_buttons () -- for
// onclick ().  "this" for "this qcard instance".
this.set_next_buttons = function (i_deck) {
   var htm = '';

   // "Flip" / "Check answer".
   htm += '<button class="qbutton flip-qdeck' + i_deck + '" onclick="' + qname + '.flip (' + i_deck + ')" title="' + T ('Show the other side') + '">' + T ('Flip') + '</button> &nbsp; ';

   // "Need more practice".  Starts out disabled, gray.
   if (deckdata[i_deck].n_to_go > 1) {
      htm += '<button class="qbutton_disabled next_card-qdeck' + i_deck + '" disabled="true" onclick="' + qname + '.next_card (' + i_deck + ')" title="' + T ('Put this card at the bottom of stack, show the next card') + '">' + T ('Need more practice') + '</button> &nbsp; ';
   }

   // "Got it".  Starts out disabled, gray.
   if (next_button_active_b) {
      htm += '<button class="qbutton got_it got_it-qdeck' + i_deck + '" onclick="' + qname + '.got_it (' + i_deck + ')" title="' + T ('Remove this card from the stack') + '">' + T ('Got it!') + '</button> &nbsp; ';
   } else {
      htm += '<button class="qbutton_disabled got_it got_it-qdeck' + i_deck + '" disabled="true" onclick="' + qname + '.got_it (' + i_deck + ')" title="' + T ('Remove this card from the stack') + '">' + T ('Got it!') + '</button> &nbsp; ';
   }

   // "Shuffle".
   if (deckdata[i_deck].n_to_go > 1) {
      htm += '<button class="qbutton shuffle-qdeck' + i_deck + '" onclick="' + qname + '.shuffle_order (' + i_deck + ')" title="' + T ('Randomly shuffle the remaining cards') +'">' + T ('Shuffle') + '</button> &nbsp; ';
   }
   if (debug[5]) {
      console.log ('[set_next_buttons] htm:', htm);
   }

   deckdata[i_deck].el_next_buttons.html (htm);
};


// -----------------------------------------------------------------------------
// Needs to be available publicly -- e.g., as qcard.process_card () -- for
// onclick ().  "this" for "this qcard instance".
this.process_card = function (i_deck) {

   // Keep running through cards until got_it true for all.
   if (deckdata[i_deck].n_to_go == 0) {
      done (i_deck);
   } else {

      var i_card = deckdata[i_deck].i_card;
      while (true) {

         // Display only those cards not yet marked got_it.
         var ii_card = deckdata[i_deck].card_order[i_card];
         if (! deckdata[i_deck].cards[ii_card].got_it) {

            // Display card - not "reviewed" until "Check answer"/flip.  "Need
            // more practice" and "Got it!" buttons start out disabled, gray.
            card_reviewed_b = false;
            if (! next_button_active_b) {
               $ ('button.got_it-qdeck' + i_deck + ', button.next_card-qdeck' + i_deck).attr ('disabled', true).removeClass ('qbutton').addClass ('qbutton_disabled');
            }

            // If only one to go, disable and gray out
            // more practice/next card and shuffle buttons.
            if (deckdata[i_deck].n_to_go == 1) {
               $ ('button.next_card-qdeck' + i_deck + ', button.shuffle-qdeck' + i_deck).attr ('disabled', true).removeClass ('qbutton').addClass ('qbutton_disabled');
            }
            deckdata[i_deck].i_card = i_card;
            q.set_card_front_and_back (i_deck, i_card);
            break;
         } else {
            i_card++;
            if (i_card >= deckdata[i_deck].n_cards) {
               i_card = 0;
            }
         }
      }
   }
};

// -----------------------------------------------------------------------------
function done (i_deck) {

   // If showing back, change to front.
   if (! deckdata[i_deck].showing_front_b) {
      q.flip (i_deck);
   }

   deckdata[i_deck].el_progress.html ('');
   deckdata[i_deck].el_qcard_card_back.html ('');
   deckdata[i_deck].el_next_buttons.html ('');

   var report_html = [];

   // Overall.
   var overall;
   if (deckdata[i_deck].n_reviewed == deckdata[i_deck].n_cards) {
      overall = T ('In this %s-flashcard stack, you clicked') + ' "' + T ('Got it!') + '" ' + T ('on the first try for every card') + '.';
      overall = overall.replace ('%s', qqc.number_to_word (deckdata[i_deck].n_cards));
   } else {
      overall = T('This flashcard stack had %s cards.  It took you %s tries until you felt comfortable enough to click') + ' "' + T ('Got it!') + '" ' + T ('for each card') + '.';
      overall = overall.replace ('%s', qqc.number_to_word (deckdata[i_deck].n_cards));
      overall = overall.replace ('%s', qqc.number_to_word (deckdata[i_deck].n_reviewed));
   }
   report_html.push ('<p>' + overall + '</p>');

   // Show exit text.
   report_html.push (deckdata[i_deck].exit_html);

   deckdata[i_deck].el_qcard_card_front.html (report_html.join ('\n'));

   // Set to match larger of front and back.
   set_container_width_height (i_deck);

   // Set the widths of the progress, header, and next-button divs to match
   // card.
   set_header (i_deck, 'front');

}


// -----------------------------------------------------------------------------
function display_progress (i_deck) {
   var progress_html;
   progress_html = '<p>' + deckdata[i_deck].n_cards + ' ' + T ('cards total') + ', ' + deckdata[i_deck].n_reviewed + ' ' + Tplural ('card', 'cards', deckdata[i_deck].n_reviewed) + ' ' + T ('reviewed') + ', ' + deckdata[i_deck].n_to_go + ' ' + Tplural ('card', 'cards', deckdata[i_deck].n_to_go) + ' ' + T ('to go') + '</p>';
   deckdata[i_deck].el_progress.html (progress_html);
}


// -----------------------------------------------------------------------------
this.flip = function (i_deck) {

   if (deckdata[i_deck].check_answer_disabled_b) {
      alert (Tcheck_answer_message);
      return;
   }

   var el_textentry = $ ('#textentry-qdeck' + i_deck);
   var el_front = $ ('#qcard_card-qdeck' + i_deck + ' div.front');

   var set_front_back;
   if (deckdata[i_deck].showing_front_b) {

      // Hide whole thing (Chrome randomly ignoring backface-visibility?),
      // superscripts and subscripts (!) (shows through in Safari, Chrome,
      // "flashing" in Chrome on Mac).  Closure for setTimeout ().
      var hideFrontElements = function () {
         el_front.css ('visibility', 'hidden');
         el_front.find ('sup, sub').css ('visibility', 'hidden');
      }

      // Hide qwiz icon/link.
      if (deckdata[i_deck].i_card == 0) {
         $ ('div.qcard_window div#icon_qdeck' + i_deck).hide ();
      }

      // "Flip"/"Check answer" button - for back, change to "Flip back";
      $ ('button.flip-qdeck' + i_deck).html (T ('Flip back'));

      // Enable "Need more practice" and "Got it!" buttons, un-gray.
      $ ('button.got_it-qdeck' + i_deck + ', button.next_card-qdeck' + i_deck).attr ('disabled', false).removeClass ('qbutton_disabled').addClass ('qbutton');

      // Increment n_reviewed on first flip for this card and redisplay progress.
      if (! card_reviewed_b) {
         card_reviewed_b = true;
         deckdata[i_deck].n_reviewed++;
         display_progress (i_deck);
      }

      // If there's a text entry box...
      if (el_textentry.length) {

         // Hide it (shows through in Safari, Chrome, "flashing" in Chrome on
         // Mac).
         el_textentry.css ('visibility', 'hidden');

         var i_card = deckdata[i_deck].i_card;
         var card = deckdata[i_deck].cards[i_card];
         if (card.textentry_required_b) {

            // Find with which choice the user textentry is associated, set card
            // back to answer for that choice.
            textentry_set_card_back (i_deck, card);
         } else {

            // If something entered in text box, then set back-side element to
            // what was entered.
            var textentry = el_textentry.val ();
            if (textentry) {

               // Show what was within square brackets, insert user entry.
               //$('#back_textentry_p-qdeck' + i_deck).show ();
               $('#back_textentry_p-qdeck' + i_deck).css ('visibility', 'visible');
               $('#back_textentry-qdeck' + i_deck).html (textentry);
            } else {

               // No entry on front. Don't show any of paragraph on back, but
               // keep spacing.
               $('#back_textentry_p-qdeck' + i_deck).css ('visibility', 'hidden');
               //$('#back_textentry_p-qdeck' + i_deck).hide ();
            }
         }
      }
      set_front_back = 'back';
   } else {
      set_front_back = 'front';

      // "Flip"/"Check answer" button - for front, change back.
      $ ('button.flip-qdeck' + i_deck).html (T ('Flip'));

   }

   // Set the widths of the progress, header, and next-button divs to match
   // card front/back.
   //set_header (i_deck, set_front_back);

   deckdata[i_deck].el_flip.trigger ('click');

   // Closure for setTimeout ().
   var showFrontElements = function () {
      if (el_textentry.length) {
         el_textentry.css ('visibility', 'visible');
      }
      el_front.css ('visibility', 'visible');
      el_front.find ('sup, sub').css ('visibility', 'visible');
   };

   // Doing explicit show/hide for whole front back -- Chrome seemed to 
   // randomly ignore "backface-visibility."  Also do for front text box and
   // super/subscripts ("flashing" in Chrome). Wait till after flip is halfway
   // through  (Time based on that in flipCard.css.)
   if (deckdata[i_deck].showing_front_b) {
      setTimeout (hideFrontElements, 300);
   } else {
      setTimeout (showFrontElements, 300);
   }

   // Keep track whether showing front or back.
   deckdata[i_deck].showing_front_b = ! deckdata[i_deck].showing_front_b;
};


// -----------------------------------------------------------------------------
function set_header (i_deck, front_back, init_b) {

   // If no initial header, hide.
   if (init_b != undefined) {
      var header_html = deckdata[i_deck].header_html;
      if (header_html == '' || header_html == 'NA') {
         deckdata[i_deck].el_header.hide ();
      } else {
         deckdata[i_deck].el_header.html (header_html);
      }
   }

   // Set the widths of the progress div and header div to match card side.
   var qcard_width = $('#qcard_card-qdeck' + i_deck + ' div.' + front_back + ' table.qcard_table').outerWidth ();
   if (debug[0]) {
      console.log ('[set_header] qcard_width: ', qcard_width);
   }
   deckdata[i_deck].el_progress.width (qcard_width);
   deckdata[i_deck].el_header.width (qcard_width);
   deckdata[i_deck].el_next_buttons.width (qcard_width);

   return qcard_width;
}


// -----------------------------------------------------------------------------
this.set_card_front_and_back = function (i_deck, i_card) {

   // Reset card width and height to original settings (so possible resize of
   // previous card won't persist).
   deckdata[i_deck].el_qcard_table_front.css ({
                        width:    deckdata[i_deck].card_width_setting,
                        height: deckdata[i_deck].card_height_setting});
   deckdata[i_deck].el_qcard_table_back.css ({
                        width:    deckdata[i_deck].card_width_setting,
                        height: deckdata[i_deck].card_height_setting});

   var card_front_back = ['card_front', 'card_back'];

   // Show progress.
   display_progress (i_deck);

   var ii_card = deckdata[i_deck].card_order[i_card];
   var card = deckdata[i_deck].cards[ii_card];

   for (var i_side=0; i_side<2; i_side++) {
      var side = card_front_back[i_side];

      // Card front/back text.
      if (side == 'card_front') {

         // If no intro, and this is first card, add Qwiz icon to front.
         var qwiz_icon_div = '';
         if (no_intro_b[i_deck] && deckdata[i_deck].n_reviewed == 1) {
            qwiz_icon_div = create_qwiz_icon_div (i_deck);
         }
         deckdata[i_deck].el_qcard_card_front.html (card[side] + qwiz_icon_div);
      } else {
         deckdata[i_deck].el_qcard_card_back.html (card[side]);
      }
   }

   // Set focus to textentry box, if there is one.  Don't do if first card and
   // no intro (avoid scrolling page to this flashcard deck).
   if (i_card != 0 || ! no_intro_b[i_deck]) {
      $('#textentry-qdeck' + i_deck).focus ();
   }

   // If textentry with required input/autocomplete set up autocomplete (since
   // just set new html).  Also load metaphone.js, and -- if needed -- terms, if
   // haven't done so already.
   if (card.textentry_required_b) {
      init_textentry_autocomplete (i_deck, i_card);
   } else {

      // In case previous card was textentry with required input, set button
      // title back to default, make sure flag set.
      $ ('button.flip-qdeck' + i_deck).attr ('title', T ('Show the other side'));
   }

   // Set card size to larger of front or back.
   set_container_width_height (i_deck, card.textentry_required_b);

   // Set the widths of the progress, header, and next-button divs to match
   // card.
   set_header (i_deck, 'front');
};


// -----------------------------------------------------------------------------
function textentry_set_card_back (i_deck, card) {

   // See with which choice the user textentry is associated, make div for
   // feedback for that choice visible.  Hide others.
   var el_textentry = $ ('#textentry-qdeck' + i_deck);
   var entry = el_textentry.val ();

   // See if entry among choices; identify default choice ("*").
   var i_choice = -1;
   var n_choices = card.choices.length;
   var i_default_choice = 0;
   for (var i=0; i<n_choices; i++) {
      var alts = card.choices[i];
      if (alts[0] == '*') {
         i_default_choice = i;
      } else {
         var lc_alts = alts.map (function (item) {
                                    return item.toLowerCase ();
                                 });
         if (lc_alts.indexOf (entry) != -1) {

            // Yes, this one.
            i_choice = i;
            break;
         }
      }
   }
   if (i_choice == -1) {
      i_choice = i_default_choice;
   }

   // Hide all.
   var el_qcard_card_back = deckdata[i_deck].el_qcard_card_back;
   el_qcard_card_back.find ('div.card_back_textentry').css ({visibility: 'hidden'});

   // Set the textentry value.
   el_qcard_card_back.find ('span.back_qcard_textentry').html (entry);

   // Show this one.  Do "manual" centering, because position relative has
   // different effect on table cell.
   var card_width  = el_qcard_card_back.outerWidth ();
   var card_height = el_qcard_card_back.outerHeight ();

   var div_width  = el_qcard_card_back.find ('#textentry_feedback_qdeck' + i_deck + '-f' + i_choice).outerWidth ();
   var div_height = el_qcard_card_back.find ('#textentry_feedback_qdeck' + i_deck + '-f' + i_choice).outerHeight ();

   var left = card_width/2  - div_width/2;
   var top  = card_height/2 - div_height/2

   el_qcard_card_back.find ('#textentry_feedback_qdeck' + i_deck + '-f' + i_choice).css ({visibility: 'visible', left: left + 'px', top: top + 'px'});
}


// -----------------------------------------------------------------------------
function set_container_width_height (i_deck, textentry_required_b) {

   // Get width and height of front and back, set size to match largest
   // dimensions.
   var width_front  = deckdata[i_deck].el_qcard_table_front.outerWidth ();
   var height_front = deckdata[i_deck].el_qcard_table_front.outerHeight ();

   var width_back  = 0;
   var height_back = 0;
   if (textentry_required_b) {

      // Find largest width and height of alternate feedback divs.
      var el_qcard_table_back = deckdata[i_deck].el_qcard_table_back;
      var i_card = deckdata[i_deck].i_card;
      var n_choices = deckdata[i_deck].cards[i_card].choices.length;
      for (var i_choice=0; i_choice<n_choices; i_choice++) {
         var width_back_i  = el_qcard_table_back.find ('#textentry_feedback_qdeck' + i_deck + '-f' + i_choice).outerWidth ();
         var height_back_i = el_qcard_table_back.find ('#textentry_feedback_qdeck' + i_deck + '-f' + i_choice).outerHeight ();
         width_back  = Math.max (width_back,  width_back_i);
         height_back = Math.max (height_back, height_back_i);
      }
   } else {
      width_back  = deckdata[i_deck].el_qcard_table_back.outerWidth ();
      height_back = deckdata[i_deck].el_qcard_table_back.outerHeight ();
   }

   // Add 10px for padding (that position: absolute absorbs).
   var max_width  = Math.max (width_front,  width_back)  + 10;
   var max_height = Math.max (height_front, height_back) + 10;

   if (debug[0]) {
      var header_height = deckdata[i_deck].el_header.height ();
      console.log ('[set_container_width_height] height_front: ', height_front, ', height_back: ', height_back, ', header_height: ', header_height);
   }

   deckdata[i_deck].el_qcard_table_front.outerWidth (max_width);
   deckdata[i_deck].el_qcard_table_back.outerWidth (max_width);

   deckdata[i_deck].el_qcard_table_front.outerHeight (max_height);
   deckdata[i_deck].el_qcard_table_back.outerHeight (max_height);

   // Set height and width of container to match.
   deckdata[i_deck].el_qcard_container.height (max_height);
   deckdata[i_deck].el_qcard_container.width (max_width);
}


// -----------------------------------------------------------------------------
// Mark card, increment counters, go to next card.
this.got_it = function (i_deck) {

   var i_card = deckdata[i_deck].i_card;
   var ii_card = deckdata[i_deck].card_order[i_card];
   deckdata[i_deck].cards[ii_card].got_it = true;
   deckdata[i_deck].n_to_go--;
   q.next_card (i_deck);
};


var directions = ['right', 'left', 'top', 'bottom'];
// -----------------------------------------------------------------------------
// Go to next card.
this.next_card = function (i_deck) {

   // If showing back, change to front.
   if (! deckdata[i_deck].showing_front_b) {
      q.flip (i_deck);
   }

   // Randomly pick a new flip direction.
   var i = Math.floor (Math.random () * 4.0);
   var new_direction = directions[i];
   deckdata[i_deck].el_qcard_card.attr ('data-direction', new_direction);
   deckdata[i_deck].el_qcard_card.data('direction', new_direction);

   deckdata[i_deck].i_card++;
   if (deckdata[i_deck].i_card >= deckdata[i_deck].n_cards) {
      deckdata[i_deck].i_card = 0;
   }
   setTimeout (qname + '.process_card (' + i_deck + ')', 375);
};


// -----------------------------------------------------------------------------
/*
function decode_qdeck (htm, qdeck_tag) {

   // Get html after [qdeck] tag and before [/qdeck] tag.
   var len = htm.length;
   htm = htm.substring (qdeck_tag.length, htm.length-8);
   while (true) {

      // See if non-base64 character (blank, for now) in html.
      var cpos = htm.search (' ');
      if (cpos != -1) {
         break;
      } else {
         htm = atob (htm);
      }
   }

   // Add back [qdeck] [/qdeck] tags.
   htm = qdeck_tag + htm + '[/qdeck]';

   return htm;
}
*/


// -----------------------------------------------------------------------------
this.shuffle_order = function (i_deck) {

   // Shuffle, but make sure current card changes!
   var i_card = deckdata[i_deck].i_card;
   var ii_card = deckdata[i_deck].card_order[i_card];
   while (true) {
      var new_ii_card = deckdata[i_deck].card_order[i_card];
      if (new_ii_card != ii_card && ! deckdata[i_deck].cards[new_ii_card].got_it) {
         break;
      }
      deckdata[i_deck].card_order = shuffle (deckdata[i_deck].card_order);
   }

   // If showing back, change to front.
   if (! deckdata[i_deck].showing_front_b) {
      q.flip (i_deck);
   }

   q.process_card (i_deck);
};


// -----------------------------------------------------------------------------
function shuffle (array) {
  var currentIndex = array.length
    , temporaryValue
    , randomIndex
    ;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor (Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}


// -----------------------------------------------------------------------------
var find_matching_terms = function (request, response) {

   var entry = request.term.toLowerCase ();
   var entry_metaphone = metaphone (entry);
   if (debug[6]) {
      console.log ('[find_matching_terms] entry_metaphone; ', entry_metaphone);
   }

   // See if first character of entry metaphone matches first
   // character of any answer metaphone.  If so, determine shortest
   // answer metaphone that matches.
   var required_entry_length = 100;
   var required_metaphone_length = 100;
   for (var i=0; i<textentry_answer_metaphones[textentry_i_deck].length; i++) {
      if (entry[0] == textentry_answers[textentry_i_deck][i][0].toLowerCase ()) {
         required_entry_length = Math.min (required_entry_length, textentry_answers[textentry_i_deck][i].length);
         if (debug[6]) {
            console.log ('[find_matching_terms] entry[0]:', entry[0], ', textentry_answers[textentry_i_deck][i][0]:', textentry_answers[textentry_i_deck][i][0]);
         }
      }
      if (entry_metaphone[0] == textentry_answer_metaphones[textentry_i_deck][i][0]) {
         required_metaphone_length = Math.min (required_metaphone_length, textentry_answer_metaphones[textentry_i_deck][i].length);
         if (debug[6]) {
            console.log ('[find_matching_terms] textentry_answer_metaphones[textentry_i_deck][i]:', textentry_answer_metaphones[textentry_i_deck][i], ', required_metaphone_length:', required_metaphone_length);
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
   if (debug[6]) {
      console.log ('[find_matching_terms] required_entry_length:', required_entry_length, ', required_metaphone_length:', required_metaphone_length);
   }

   // Entry consisting of repeated single character doesn't count as "long".
   // Replace any three or more of same character in a row with just one.
   var deduped_entry = entry.replace (/(.)\1{2,}/gi, '\$1');
   if (deduped_entry.length < required_entry_length && entry_metaphone.length < required_metaphone_length) {
      textentry_matches[textentry_i_deck] = [];

   } else {
      if (debug[6]) {
         console.log ('[find_matching_terms] request.term:', request.term, entry_metaphone, entry_metaphone.length);
      }
      textentry_matches[textentry_i_deck] = $.map (current_card_textentry_terms_metaphones[textentry_i_deck], function (term_i) {
         if (term_i[1].indexOf (entry_metaphone) === 0 || term_i[0].toLowerCase ().indexOf (entry) === 0) {
            if (debug[6]) {
               console.log ('[find_matching_terms] term_i:', term_i);
            }
            return term_i[0];
         }
      });
      lc_textentry_matches[textentry_i_deck] 
         = textentry_matches[textentry_i_deck].map (function (item) {
                                                       return item.toLowerCase ();
                                                    });
      if (debug[6]) {
         console.log ('[find_matching_terms] textentry_matches[textentry_i_deck]:', textentry_matches[textentry_i_deck]);
      }
   }

   // If entry length five or more, and matches list does not include first
   // correct answer, and haven't used up hints, enable hint.
   if (debug[6]) {
      console.log ('[find_matching_terms] deduped_entry.length: ', deduped_entry.length, ', textentry_matches[textentry_i_deck].length: ', textentry_matches[textentry_i_deck].length, ', deckdata[textentry_i_deck].textentry_n_hints: ', deckdata[textentry_i_deck].textentry_n_hints);
   }
   if (deduped_entry.length >= 5 && deckdata[textentry_i_deck].textentry_n_hints < 5) {
      var i_card = deckdata[textentry_i_deck].i_card;
      var card = deckdata[textentry_i_deck].cards[i_card];
      var lc_first_choice = card.all_choices[0];
      if (lc_textentry_matches[textentry_i_deck].indexOf (lc_first_choice) == -1) {
         $ ('#textentry_hint-qdeck' + textentry_i_deck).removeAttr ('disabled').removeClass ('qbutton_disabled').addClass ('qbutton').show ();
      }
   }
   response (textentry_matches[textentry_i_deck]);
}


// -----------------------------------------------------------------------------
// When menu closed: if current entry doesn't fully match anything on the last
// set of matches, disable "Check answer".
function menu_closed (e) {

   // Do only if "Check answer" not already disabled.
   if (! deckdata[textentry_i_deck].check_answer_disabled_b) {
      var lc_entry = e.target.value.toLowerCase ();
      if (debug[6]) {
         console.log ('[menu_closed] textentry_matches[textentry_i_deck]: ', textentry_matches[textentry_i_deck]);
      }
      if (lc_textentry_matches[textentry_i_deck].indexOf (lc_entry) == -1) {
         $ ('button.flip-qdeck' + textentry_i_deck).removeClass ('qbutton').addClass ('qbutton_disabled');
         deckdata[textentry_i_deck].check_answer_disabled_b = true;
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

   // Does matches list include first choice in list of possible choices?
   var i_card = deckdata[textentry_i_deck].i_card;
   var card = deckdata[textentry_i_deck].cards[i_card];
   var lc_first_choice = card.all_choices[0];
   if (lc_textentry_matches[textentry_i_deck].indexOf (lc_first_choice) != -1) {
      $ ('#textentry_hint-qdeck' + textentry_i_deck).attr ('disabled', true).removeClass ('qbutton').addClass ('qbutton_disabled');
   }
   if (lc_textentry_matches[textentry_i_deck].indexOf (lc_entry) != -1) {
      $ ('button.flip-qdeck' + textentry_i_deck).removeAttr ('disabled').removeClass ('qbutton_disabled').addClass ('qbutton');
      deckdata[textentry_i_deck].check_answer_disabled_b = false;
   } else {
      $ ('button.flip-qdeck' + textentry_i_deck).removeClass ('qbutton').addClass ('qbutton_disabled');
      deckdata[textentry_i_deck].check_answer_disabled_b = true;
   }
}


// -----------------------------------------------------------------------------
// When item selected, enable check answer.
function item_selected () {
   $ ('button.flip-qdeck' + textentry_i_deck).removeAttr ('disabled').removeClass ('qbutton_disabled').addClass ('qbutton');
   deckdata[textentry_i_deck].check_answer_disabled_b = false;
}


// -----------------------------------------------------------------------------
this.keep_next_button_active = function () {
   next_button_active_b = true;
   $ ('button.got_it').attr ('disabled', false).removeClass ('qbutton_disabled').addClass ('qbutton');

}


// -----------------------------------------------------------------------------
function T (string) {
   return qqc.T (string);
}


// -----------------------------------------------------------------------------
function Tplural (word, plural_word, n) {
   return qqc.Tplural (word, plural_word, n);
}


// =============================================================================
// Close - isolate namespace.
};


// -----------------------------------------------------------------------------
qcardf.call (qcard_);

// =============================================================================
// =============================================================================
/* =======================================================
 * Flipping Cards 3D
 * By David Blanco
 *
 * Contact: http://codecanyon.net/user/davidbo90
 *
 * Created: January 2013
 *
 * Copyright (c) 2013, David Blanco. All rights reserved.
 * Released under CodeCanyon License http://codecanyon.net/
 *
 * ======================================================= */

(function($){
   $(document).ready(function(){

      // CHECKS FOR FALLBACK -----------------------
      var debug = false;
      var fallback = false;
      var dk_fallback = false;
      var supportsPerspective;
      var testDiv;
      var is_chrome;
      var is_safari;

      // -----------------------------------------------------------------------
      function getInternetExplorerVersion()
      // Returns the version of Windows Internet Explorer or a -1
      // (indicating the use of another browser).
      {
         var rv = -1; // Return value assumes failure.
         if (navigator.appName == 'Microsoft Internet Explorer');
         {
            var ua = navigator.userAgent;
            var re = new RegExp("MSIE ([0-9]{1,}[\.0-9]{0,})");
            if (re.exec(ua) != null)
               rv = parseFloat( RegExp.$1 );
         }

         var isAtLeastIE11 = !!(navigator.userAgent.match(/Trident/) && !navigator.userAgent.match(/MSIE/));
         if(isAtLeastIE11){
               rv = 11; //if it is IE 11
         }

         return rv;
      }
      // -----------------------------------------------------------------------


      if( getInternetExplorerVersion() != -1 ){ //IF IS IE
         fallback = true;
         dk_fallback = true;
      }


      // -----------------------------------------------------------------------
      var supports = (function() {
         var   div = document.createElement('div'),
           vendors = 'Khtml Ms O Moz Webkit'.split(' '),
               len = vendors.length;

         return function(prop) {
           if ( prop in div.style ) return true;

           prop = prop.replace(/^[a-z]/, function(val) {
              return val.toUpperCase();
           });

           while(len--) {
              if ( vendors[len] + prop in div.style ) {
                 // browser supports box-shadow. Do what you need.
                 // Or use a bang (!) to test if the browser doesn't.
                 return true;
              }
           }
           return false;
         };
      })();
      // -----------------------------------------------------------------------


      if ( !supports('backfaceVisibility') ) { //IF IT DOES NOT SUPPORT BACKFACE VISIBILITY
         if (debug) {
            alert ('!backfaceVisibility');
         }
         fallback = true;
      }


      is_chrome = navigator.userAgent.toLowerCase().indexOf('chrome') > -1 && !!window.chrome;
      is_safari =  navigator.userAgent.toLowerCase().indexOf('safari') > -1 && !window.chrome;

      // If is Chrome or Safari, set up div to test 3D support.
      if (is_chrome || is_safari) {
         testDiv = document.createElement('div');
         var properties = ['perspectiveProperty', 'WebkitPerspective'];
         for (var i = properties.length - 1; i >= 0; i--){
            supportsPerspective = supportsPerspective ? supportsPerspective : testDiv.style[properties[i]] != undefined;
         };
         if (! supportsPerspective) {
            fallback = true;
            if (debug) {
               alert ('!perspectiveProperty');
            }
         } else {
            var testStyle = document.createElement('style');
            testStyle.textContent = '@media (-webkit-transform-3d){#test3d{height:3px}}';
            document.getElementsByTagName('head')[0].appendChild(testStyle);
            testDiv.id = 'test3d';
            document.body.appendChild(testDiv);
         }
      }

      setTimeout (part2, 100);


      // -----------------------------------------------------------------------
      function part2 () {

         // If is Chrome or is Safari, and good so far, check if supports
         // 3D transform.
         if (is_chrome || is_safari){
            if (! fallback) {

               // If Chrome on Mac, give up.  DK 2014-09-05.
               var is_mac = navigator.platform.toLowerCase().indexOf('mac') != -1;
               if (is_chrome && is_mac) {
                  fallback = true;
               }

               retOffsetHeight = testDiv.offsetHeight === 3;
               if (! retOffsetHeight) {
                  fallback = true;
                  if (debug) {
                     alert ('!3D_transform');
                  }
               }

               // Clean-up.
               testStyle.parentNode.removeChild(testStyle);
               testDiv.parentNode.removeChild(testDiv);
            }
         }

         if( fallback ){
            jQuery('div.card-container').addClass('noCSS3Container');

            jQuery('.card').addClass('noCSS3Card');

            jQuery('.card').children('div').addClass('noCSS3Sides');

            jQuery('.back').hide();
         }

         $('.over').parents('.card-container').on('mouseenter',function(){
            $this = $(this);

            if(!$this.hasClass('mouseenter')){
               $this.addClass('mouseenter');
            }

            direction($this.find('.over'));

         });

         $('.over').parents('.card-container').on('mouseleave',function(){
            $this = $(this);

            if($this.hasClass('mouseenter')){
               direction($this.find('.over'));
            }

         });

         $('.click').on('click', function(){
            $this = $(this);

            direction($this);

         });

         //Stop propagation
         $('.click').on('click', '.ignoreEvent', function(e){
            e.stopPropagation();
         });

         $('.card').on('click', '.cbutton', function(e){
            e.preventDefault();
            $this = $(this);

            direction($this.parents('.card'));
         });

         var intervals = Array();

         function direction($this, index){

            $this.stop(true, true);

            if($this.data('autoflip') != undefined && index != undefined){
               intervals[index] = setTimeout(function(){
                                 direction($this, index);
                              }, $this.data('autoflip'));
            }

            //In auto flip feature if it has a mouseover
            if($this.data('mouse') == 'true'){
               return;
            }

            if( fallback ){

               var div_front = $this.find ('div.front');
               var div_back  = $this.find ('div.back');

               var toggle_front = function () {
                  div_front.toggle ('clip');
               };
               var toggle_back = function () {
                  div_back.toggle ('clip');
               };

               if (div_front.is (':visible')) {
                  toggle_front ();
                  setTimeout (toggle_back, 500);
               } else {
                  toggle_back ();
                  setTimeout (toggle_front, 500);
               }

               //$this.find('div.front').fadeToggle();
               //$this.find('div.back').fadeToggle();
               return;
            }

            if($this.data('direction') === 'right'){

               $this.toggleClass('flipping-right');

            }else if($this.data('direction') === 'left'){

               $this.toggleClass('flipping-left');

            }else if($this.data('direction') === 'top'){

               $this.toggleClass('flipping-top');

            }else if($this.data('direction') === 'bottom'){

               $this.toggleClass('flipping-bottom');

            }

         }


         //AUTO FLIP FEATURE ----------------------->

         var card = $('.card[data-autoflip]');

         function start(){
            card.each(function(index){
               $this = $(this);

               (function(c){

                     var autoStart = c.data('start');

                     if(autoStart == undefined){
                        autoStart = c.data('autoflip');
                     }

                     intervals[index] = setTimeout(function(){
                                       direction(c, index);
                                    }, autoStart);

                  })($this);

            });
         }

         start();

         var restart = function() {
             //clear all intervals and start again
             for(var i=0; i<intervals.length; i++){
               clearTimeout(intervals[i]);
             }

             card.removeClass('flipping-right');
             card.removeClass('flipping-left');
             card.removeClass('flipping-top');
             card.removeClass('flipping-bottom');

             start();
         };

         if (window.addEventListener){
           window.addEventListener('focus', restart, false);
         } else if (window.attachEvent){
           window.attachEvent('onfocus', restart);
         }


         card.on('mouseenter', function(){
            $(this).data('mouse', 'true');
         });

         card.on('mouseleave', function(){
            $(this).data('mouse', 'false');
         });
      }
   });
})(jQuery);
