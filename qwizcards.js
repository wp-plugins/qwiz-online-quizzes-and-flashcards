/*
 * Version 3.00 2015-??-??
 * Team login.
 * Login timeout.
 *
 * Version 2.29 2015-04-26
 * topic= implemented.
 * Recording implemented.
 *
 * Version 2.28 2015-02-03
 * Don't do container set on one-card deck.
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

var qrecord_b = false;
var q_and_a_text = '';

// -----------------------------------------------------------------------------
$(document).ready (function () {

   qqc = qwiz_qcards_common;

   // The identifier -- including qualifiers like "#" -- of the page content (that
   // perhaps contains inline flashcard decks) on WordPress.  Default
   // set in qwiz-online-quizzes-wp-plugin.php: div.entry-content, div.post-entry,
   // div.container.  Apparently themes can change this; these have come up so far.
   // Body default for stand-alone use.
   content = qqc.get_qwiz_param ('content', 'body');
   Tcheck_answer_message = T ('Enter your best guess - eventually we\'ll provide suggestions or offer a hint');

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

            // For decks that have no intro or are single-card, set boolean to
            // record "start" time when first interact with deck (in flip ()).
            if (deckdata[i_deck].qrecord_id) {
               deckdata[i_deck].record_start_b = true;
            }
            q.process_card (i_deck);
         } else {
            deckdata[i_deck].el_qcard_card_front.html (deckdata[i_deck].intro_html);

            // Set to match larger of front and back.
            set_container_width_height (i_deck);
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

   // If any quizzes subject to recording, set user menus -- if this comes after
   // check_session_id () callback, it will properly set the menus (while the
   // callback may not have worked if the html hadn't been set at that time).
   if (qrecord_b) {
      qqc.set_user_menus_and_icons ();
   }

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

   // Use terms given with [terms]...[/terms] for this flashcard deck; otherwise
   // load default terms if haven't done so already.
   if (deckdata[i_deck].terms) {

      // Only do this once per flashcard deck.
      if (! deckdata[i_deck].textentry_terms_metaphones) {
         deckdata[i_deck].textentry_terms_metaphones = qqc.process_textentry_terms (deckdata[i_deck].terms);
      }
   } else {
      if (! default_textentry_terms_metaphones) {
         var plugin_url = qqc.get_qwiz_param ('url', './');
         var terms_data = qqc.get_textentry_terms (plugin_url + 'terms.txt', deckdata);
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
                                          return qqc.metaphone (answer);
                                       })

   var textentry_answers_metaphones
      = textentry_answers[i_deck].map (function (answer) {
                                  return [answer, qqc.metaphone (answer)];
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

   deckdata[i_deck].qrecord_id = false;

   // Include any opening tags (e.g., "<p>" in WordPress).
   var m = htm.match (/(<[^\/][^>]*>\s*)*?\[qdeck([^\]]*)\]/m);
   var qdeck_tag  = m[0];
   var attributes = m[2];

   // If "qrecord_id=..." present, parse out database ID.  Set flag indicating
   // one or more quizzes subject to recording.  Set up array to save question
   // text.
   attributes = qqc.replace_smart_quotes (attributes);
   if (debug[0]) {
      console.log ('[process_qdeck_pair] qdeck_tag: ', qdeck_tag);
      console.log ('[process_qdeck_pair] attributes: ', attributes);
   }
   var qrecord_id = qqc.get_attr (attributes, 'qrecord_id');
   if (qrecord_id) {
      deckdata[i_deck].qrecord_id = qrecord_id;
      deckdata[i_deck].q_and_a_text = {};

      // If haven't checked already, see if user already logged in (get session
      // ID in cookie, see if still valid).
      if (! qrecord_b) {
         qrecord_b = true;
         if (typeof (document_qwiz_user_logged_in_b) == 'undefined'
                              || document_qwiz_user_logged_in_b == 'not ready') {
            qqc.check_session_id (i_deck, qrecord_id);
         }
      }
   }

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

   // Delete any initial whitespace.
   htm = qqc.trim (htm);

   // Make sure there's at least one card.
   if (htm.search (/\[q([^\]]*)\]/m) == -1) {
      errmsgs.push (T ('Did not find question tags ("[q]") for') + ' qdeck ' + (i_deck + 1));
   } else {

      // Look for [terms]...[/terms] and/or [add_terms]...[/add_terms] pairs.
      // Parse, and delete.  Include opening tags in front and closing tags
      // after.
      htm = qqc.process_inline_textentry_terms (htm, 'terms', deckdata, i_deck);
      errmsgs = errmsgs.concat (deckdata.additional_errmsgs);
      htm = qqc.process_inline_textentry_terms (htm, 'add_terms', deckdata, i_deck);
      errmsgs = errmsgs.concat (deckdata.additional_errmsgs);

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

   // If recording, save text without tags.  Also, replace non-breaking spaces
   // and EOLs with space, multiple spaces with single space, trim.
   if (deckdata[i_deck].qrecord_id) {
      var q_and_a_text = qqc.remove_tags_eols (card_front_html);
      deckdata[i_deck].q_and_a_text[i_card] = q_and_a_text;
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

   // If recording, add card-back text to q_and_a_text.
   if (deckdata[i_deck].qrecord_id) {
      var q_and_a_text = qqc.remove_tags_eols (card_back_items[0]);
      deckdata[i_deck].q_and_a_text[i_card] += '\n' + q_and_a_text;
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

   // If recording, save card front without tags.
   if (deckdata[i_deck].qrecord_id) {
      var q_and_a_text = qqc.remove_tags_eols (htm);
      deckdata[i_deck].q_and_a_text[i_card] = q_and_a_text;
   }

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
   if (deckdata[i_deck].qrecord_id) {
      var addclass = '';
      if (no_intro_b[i_deck] || deckdata[i_deck].n_cards == 1) {
         addclass = ' qwiz-usermenu_icon_no_intro';
      }
      divs.push ('   <div id="usermenu_icon-qdeck' + i_deck + '" class="qwiz-usermenu_icon' + addclass + '" onmouseover="' + qname + '.show_usermenu (' + i_deck + ')">');
      divs.push (      '&#x25bc;');
      divs.push ('   </div>');
   }

   divs.push ('   <span class="progress_text">');
   divs.push ('   </span>');

   if (deckdata[i_deck].qrecord_id) {

      // Add user menu div.  Don't populate until after start/login.
      divs.push ('<div id="usermenu-qdeck' + i_deck + '" class="qq-usermenu qdeck-usermenu">');
      divs.push ('</div>');
   }
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

   // Topic or topics each card, if any.
   deckdata[i_deck].card_topics = new Array (n_cards);

   // List of all topics.
   deckdata[i_deck].topics = [];

   // Loop over tags.
   var n_cards_w_topics = 0;
   var n_cards = card_tags.length;
   for (var i_card=0; i_card<n_cards; i_card++) {
      var card_tag = card_tags[i_card];

      // See if any topic attribute.
      var matches = card_tag.match (/\[q +([^\]]*)\]/);
      if (matches) {
         var attributes = matches[1];

         // Look for "topic=" attribute.
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
   if (debug[4]) {
      console.log ('[process_topics] deckdata[i_deck].card_topics:', deckdata[i_deck].card_topics);
   }

   if (n_cards_w_topics > 0) {

      // If any topics given, every card must have at least one topic.
      if (n_cards_w_topics != n_cards) {
         errmsgs.push (T ('A topic was given for at least one card, but at least one card doesn\'t have a topic in deck') + ' ' + (i_deck + 1));
      }
      if (debug[4]) {
         console.log ('[process_topics] topics: ' + deckdata[i_deck].topics);
      }

      // Set up statistics by topic.  Object of objects (list of lists).
      deckdata[i_deck].topic_statistics = {};
      var n_topics = deckdata[i_deck].topics.length;
      for (var i_topic=0; i_topic<n_topics; i_topic++) {
         var topic = deckdata[i_deck].topics[i_topic];
         deckdata[i_deck].topic_statistics[topic] = {};
         deckdata[i_deck].topic_statistics[topic].n_cards = 0;
         deckdata[i_deck].topic_statistics[topic].n_reviewed = 0;
      }

      // Count how many cards with each topic.
      for (var i_card=0; i_card<n_cards; i_card++) {
         var card_topics = deckdata[i_deck].card_topics[i_card];
         if (card_topics) {
            if (debug[4]) {
               console.log ('[process_topics] i_card:', i_card, ', card_topics: ' + card_topics);
            }
            var n_topics = card_topics.length;
            for (var i_topic=0; i_topic<n_topics; i_topic++) {
               var topic = card_topics[i_topic];
               deckdata[i_deck].topic_statistics[topic].n_cards++;
            }
         }
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

   var n_topics = deckdata[i_deck].topics.length;
   for (var i_topic=0; i_topic<n_topics; i_topic++) {
      var topic = deckdata[i_deck].topics[i_topic];
      deckdata[i_deck].topic_statistics[topic].n_reviewed = 0;
   }

   init_card_order (i_deck);

   // If deck may be recorded, and user not logged in, go to login rather than
   // first card (if user hasn't declined).
   if (deckdata[i_deck].qrecord_id) {
      var user_logged_in_b 
         = typeof (document_qwiz_user_logged_in_b) != 'undefined'
                                              && document_qwiz_user_logged_in_b;
      if (   user_logged_in_b 
          || (   typeof (document_qwiz_declined_login_b) != 'undefined'
              && document_qwiz_declined_login_b)) {
         if (user_logged_in_b) {

            // If more than __ minutes since last login, confirm // continue.
            var now_sec = new Date ().getTime ()/1000.0;
            var login_timeout_min = qqc.get_qwiz_param ('login_timeout_min', 40);
            if (now_sec > document_qwiz_current_login_sec + login_timeout_min*60) {
               if (confirm (T ('You are logged in as') + ' ' + document_qwiz_username + '.\n' + T ('Do you want to continue?  (Click "Cancel" to sign out)'))) {
                  document_qwiz_current_login_sec = now_sec;
               } else {
                  q.sign_out ();
               }
            }

            // If logged in as team, check if want to continue as team.
            if (typeof (document_qwiz_team_b) != 'undefined' && document_qwiz_team_b) {
               if (! confirm (T ('You are logged in as team') + ': ' + document_qwiz_username + '.\n' + T ('Do you want to continue as this team?'))) {

                  // No.  Reset document global flags and user menu.
                  document_qwiz_session_id = document_qwiz_session_id.split (';')[0];
                  document_qwiz_username   = document_qwiz_username.split ('; ')[0];
                  document_qwiz_team_b     = false;
                  qqc.set_user_menus_and_icons ();
                  var msg = T ('OK.  Only %s is logged in now');
                  msg = msg.replace ('%s', document_qwiz_username);
                  alert (msg)
               }
            }
            var now_sec = new Date ().getTime ()/1000.0;
            var data = {type: 'start', now_sec: now_sec};
            qqc.jjax (qname, i_deck, deckdata[i_deck].qrecord_id, 'record_qcard', data);
         }
      } else {
         q.display_login (i_deck);
         return false;
      }
   }
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
function init_element_pointers (i_deck) {

   // jQuery element objects for this deck.
   deckdata[i_deck].el_qcard_container  = $('div#qcard_window-qdeck' + i_deck + ' div.card-container');
   deckdata[i_deck].el_flip             = $('button.cbutton-qdeck' + i_deck);
   deckdata[i_deck].el_progress         = $('div#qcard_progress-qdeck' + i_deck);
   deckdata[i_deck].el_progress_text    = $('div#qcard_progress-qdeck' + i_deck + ' span.progress_text');
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
            deckdata[i_deck].card_reviewed_b = false;
            if (deckdata[i_deck].qrecord_id) {
               deckdata[i_deck].current_first_flip_sec = 0;
               deckdata[i_deck].n_flips = 0;
               deckdata[i_deck].current_first_textentry_sec = 0;
            }
            if (! next_button_active_b) {
               $ ('button.got_it-qdeck' + i_deck + ', button.next_card-qdeck' + i_deck).attr ('disabled', true).removeClass ('qbutton').addClass ('qbutton_disabled');
            }

            // If only one to go, disable and gray out more practice/next card
            // and shuffle buttons.
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

   deckdata[i_deck].el_progress_text.html ('');
   deckdata[i_deck].el_qcard_card_back.html ('');
   deckdata[i_deck].el_next_buttons.html ('');

   var report_html = [];

   // Overall.
   var overall;
   var n_cards = deckdata[i_deck].n_cards;
   var n_reviewed = deckdata[i_deck].n_reviewed;
   if (n_reviewed == n_cards) {
      overall = T ('In this %s-flashcard stack, you clicked') + ' &ldquo;' + T ('Got it!') + '&rdquo; ' + T ('on the first try for every card') + '.';
   } else {
      overall = T('This flashcard stack had %s cards.') + ' ';
      overall += T ('It took you') + ' ' + qqc.number_to_word (n_reviewed) + ' ' + Tplural ('try', 'tries', n_reviewed) + ' ' + T ('until you felt comfortable enough to click') + ' &ldquo;' + T ('Got it!') + '&rdquo; ' + Tplural ('for this card', 'for each card', n_cards) + '.';
   }
   overall = overall.replace ('%s', qqc.number_to_word (n_cards));
   report_html.push ('<p>' + overall + '</p>');

   // By topic.
   var n_topics = deckdata[i_deck].topics.length;
   if (n_topics == 1) {
      var topic = deckdata[i_deck].topics[0];
      var all_both_n;
      if (n_cards == 1) {
         all_both_n = T ('This');
      } else if (n_cards == 2) {
         all_both_n = T ('Both');
      } else {
         all_both_n = T ('All') + ' '+ qqc.number_to_word (n_cards);
      }
      report_html.push ('<p>' + all_both_n + ' ' + Tplural ('card was', 'cards were', n_cards) + ' about topic &ldquo;' + topic + '.&rdquo;</p>');
   } else if (n_topics > 1 && n_reviewed > n_cards) {

      // We'll show only topics where user clicked "Need more practice".  See
      // which.
      var need_more_practice_topics = [];
      for (var i_topic=0; i_topic<n_topics; i_topic++) {
         var topic = deckdata[i_deck].topics[i_topic];
         var i_topic_n_cards = deckdata[i_deck].topic_statistics[topic].n_cards;
         var i_topic_n_reviewed = deckdata[i_deck].topic_statistics[topic].n_reviewed;
         if (debug[4]) {
            console.log ('[done] topic:', topic, ', i_topic_n_cards:', i_topic_n_cards, ', i_topic_n_reviewed:', i_topic_n_reviewed);
         }
         if (i_topic_n_reviewed > i_topic_n_cards) {
            var topic_text = '<strong>' + topic + '</strong>: ' + qqc.number_to_word (i_topic_n_cards) + ' ' + Tplural ('card', 'cards', i_topic_n_cards) + ', ' + qqc.number_to_word (i_topic_n_reviewed) + ' ' + 'tries';
            need_more_practice_topics.push (topic_text);
         }
      }
      var n_need_more_practice_topics = need_more_practice_topics.length;
      var topic_list_html = '<p class="topic_list">';
      if (n_need_more_practice_topics > 1) {
         topic_list_html += T ('These are the topics of cards where you clicked');
         for (var i=0; i<n_need_more_practice_topics; i++) {
            need_more_practice_topics[i] = '&bull; ' + need_more_practice_topics[i];
         }
      } else {
         topic_list_html += T ('This is the only topic for which you clicked');
      }
      topic_list_html += ' &ldquo;' + T ('Need more practice') + '&rdquo;:<br />';
      topic_list_html += need_more_practice_topics.join ('; ') + '.';
      topic_list_html += '</p>';
      report_html.push (topic_list_html);
   }

   // Show exit text.
   report_html.push (deckdata[i_deck].exit_html);

   deckdata[i_deck].el_qcard_card_front.html (report_html.join ('\n'));

   // Set to match larger of front and back.
   set_container_width_height (i_deck);
}


// -----------------------------------------------------------------------------
function display_progress (i_deck) {
   var progress_html;
   progress_html = '<p>' + deckdata[i_deck].n_cards + ' ' + T ('cards total') + ', ' + deckdata[i_deck].n_reviewed + ' ' + Tplural ('card', 'cards', deckdata[i_deck].n_reviewed) + ' ' + T ('reviewed') + ', ' + deckdata[i_deck].n_to_go + ' ' + Tplural ('card', 'cards', deckdata[i_deck].n_to_go) + ' ' + T ('to go') + '</p>';
   deckdata[i_deck].el_progress_text.html (progress_html);
}


// -----------------------------------------------------------------------------
this.display_login = function (i_deck, add_team_member_f) {

   // Close menu in case came from there.
   $ ('#usermenu-qdeck' + i_deck).hide ();

   if (! add_team_member_f) {

      // Stop any bouncing icons (no-intro quizzes/flashcard decks) bouncing.
      $ ('div.qwiz-usermenu_icon_no_intro').removeClass ('qwiz-icon-bounce');
   }

   if (deckdata[i_deck].showing_front_b) {
      deckdata[i_deck].el_qcard_card_front.html (get_login_html (i_deck, add_team_member_f));
   } else {
      deckdata[i_deck].el_qcard_card_back.html (get_login_html (i_deck, add_team_member_f));
   }

   // Hide buttons.
   $ ('#qcard_next_buttons-qdeck' + i_deck).css ('visibility', 'hidden');

   // Focus on username field.
   $ ('#qdeck_username-qdeck' + i_deck).focus ();
}


// -----------------------------------------------------------------------------
function get_login_html (i_deck, add_team_member_f) {

   add_team_member_f = add_team_member_f ? 1 : 0;
   var onfocus = 'onfocus="jQuery (\'#qdeck_login-qdeck' + i_deck + ' p.login_error\').css (\'visibility\', \'hidden\')"';

   var login_html =
       '<div id="qdeck_login-qdeck' + i_deck + '" class="qdeck-login">\n'
     +    '<p>';
   if (add_team_member_f) {
      login_html +=
             '<strong>' + T ('Add team member') + '</strong>';
   } else {
      login_html +=
             '<strong>' + T ('Record score/credit?') + '</strong>';
   }
   login_html +=
          '</p>\n'
     +    '<table border="0" align="center" style="width: auto;">'
     +       '<tr>'
     +          '<td>'
     +             '<label for="qdeck_username-qdeck' + i_deck + '">'+ T ('User name') + '</label>'
     +          '</td>'
     +          '<td>'
     +             '<input type="text" id="qdeck_username-qdeck' + i_deck + '" ' + onfocus + ' />'
     +          '</td>'
     +       '</tr>'
     +       '<tr>'
     +          '<td>'
     +             '<label for="qdeck_password-qdeck' + i_deck + '">'+ T ('Password') + '</label>'
     +          '</td>'
     +          '<td>'
     +             '<input type="password" id="qdeck_password-qdeck' + i_deck + '" ' + onfocus + ' />'
     +          '</td>'
     +       '<tr>'
     +    '</table>\n'
     +    '<button class="qbutton" onclick="' + qname + '.login (' + i_deck + ',' + add_team_member_f + ')">'
     +       T ('Login')
     +    '</button>'
     +    '&emsp;' 
     +    '<button class="qbutton" onclick="' + qname + '.no_login (' + i_deck + ',' + add_team_member_f + ')">';
   if (add_team_member_f) {
      login_html +=
             T ('Cancel')
     +    '</button>';
   } else {
      login_html +=
             T ('No thanks')
     +    '</button>'
     +    '<br />'
     +    '<span class="qdeck-remember" title="' + T ('Save preference (do not use on shared computer)') + '"><label><span><input type="checkbox" /></span> ' + T ('Remember') + '</label></span>';
   }
   login_html +=
          '<p class="login_error">'
     +       T ('Login incorrect. Please try again')
     +    '</p>\n'
     + '</div>\n';

   return login_html;
}


// -----------------------------------------------------------------------------
this.login = function (i_deck, add_team_member_f) {

   add_team_member_f = add_team_member_f ? 1 : 0;

   // In case previously declined login option, unset cookie and local flag.
   $.removeCookie ('qdeck_declined_login', {path: '/'});
   document_qwiz_declined_login_b = false;

   // Have we got username and password?
   var username_obj = $ ('#qdeck_username-qdeck' + i_deck);
   var username = username_obj.val ();
   if (! username ) {
      alert (T ('Please enter User name'));
      username_obj.focus ();
      return;
   }

   if (add_team_member_f) {

      // Check if this username already on team list.
      var usernames = document_qwiz_username.split ('; ');
      if (usernames.indexOf (username) != -1) {
         alert ('User ' + username + ' is already on your team.');
         return false;
      }
   }

   var password_obj = $ ('#qdeck_password-qdeck' + i_deck);
   var password = password_obj.val ();
   if (! password) {
      alert (T ('Please enter Password'));
      password_obj.focus ();
      return;
   }

   // We'll send "SHA3" of password.
   var sha3_password = CryptoJS.SHA3 (password).toString ();

   var remember_f;
   if (add_team_member_f) {
      remember_f = document_qwiz_remember_f;
   } else {

      // Pass state of "Remember" checkbox.
      remember_f = $ ('#qdeck_login-qdeck' + i_deck + ' input[type="checkbox"]').prop('checked') ? 1 : 0;
      document_qwiz_remember_f = remember_f;
   }

   // Do jjax call.  First disable login button, show spinner.  DKTMP
   var data = {username: username, sha3_password: sha3_password, remember_f: remember_f, add_team_member_f: add_team_member_f};
   if (add_team_member_f) {
      data.previous_username = document_qwiz_username;
   }
   qqc.jjax (qname, i_deck, deckdata[i_deck].qrecord_id, 'login', data);
}


// -----------------------------------------------------------------------------
this.login_ok = function (i_deck, session_id, remember_f) {

   // Success.  Create session cookie, valid for this session, or -- if flag
   // set -- 1 day, good for whole site.  Value set by server.  Callback 
   // script also saves session ID as global (document) variable
   // document_qwiz_session_id.
   var options = {path: '/'};
   if (remember_f == 1) {
      options.expires = 1;
   }
   $.cookie ('qwiz_session_id', document_qwiz_session_id, options);
   

   // Set flag, record time.
   document_qwiz_user_logged_in_b = true;
   document_qwiz_current_login_sec = new Date ().getTime ()/1000.0;

   // Set user menus.
   qqc.set_user_menus_and_icons ();

   // Hide login.
   $ ('#qdeck_login-qdeck' + i_deck).hide ();

   // If recording any decks, reset all start times.
   if (qrecord_b) {
      var qrecord_ids = [];
      for (var ii_deck=0; ii_deck<n_decks; ii_deck++) {
         if (deckdata[ii_deck].qrecord_id) {
            qrecord_ids.push (deckdata[ii_deck].qrecord_id);
         }
      }
      qrecord_ids = qrecord_ids.join ('\t');
      var now_sec = new Date ().getTime ()/1000.0;
      qqc.jjax (qname, i_deck, qrecord_ids, 'record_qcard', {type: 'start', now_sec: now_sec});
   }

   // Show buttons.
   $ ('#qcard_next_buttons-qdeck' + i_deck).css ('visibility', 'visible');

   if (deckdata[i_deck].i_card == 0) {

      // Go to first card.
      q.process_card (i_deck);
   } else {

      // Re-display current card.
      i_card = deckdata[i_deck].i_card;
      q.set_card_front_and_back (i_deck, i_card);
   }
}


// -----------------------------------------------------------------------------
this.login_not_ok = function (i_deck) {

   // Invalid login.  Error message.
   $ ('#qdeck_login-qdeck' + i_deck + ' p.login_error').css ('visibility', 'visible');
   if (debug[0]) {
      console.log ('[login_not_ok] $ (\'#qdeck_login-qdeck' + i_deck + ' p.login_error\'):', $ ('#qdeck_login-qdeck' + i_deck + ' p.login_error'));
   }
}


// -----------------------------------------------------------------------------
this.no_login = function (i_deck, add_team_member_f) {

   // Skip login.  Hide login, go to first question.  If checkbox checked, set
   // cookie and local flag to skip in the future.
   if (! add_team_member_f) {
      if ($ ('#qdeck_login-qdeck' + i_deck + ' input[type="checkbox"]').prop('checked')) {
         $.cookie ('qwiz_declined_login', 1, {path: '/'});
         document_qwiz_declined_login_b = true;
      }
   }

   // Stop any bouncing icons (no-intro quizzes) bouncing.
   $ ('div.qwiz-usermenu_icon_no_intro').removeClass ('qwiz-icon-bounce');

   // Show buttons.
   $ ('#qcard_next_buttons-qdeck' + i_deck).css ('visibility', 'visible');

   q.process_card (i_deck);
}


// -----------------------------------------------------------------------------
this.icon_no_login = function (i_deck) {

   // Stop icon from bouncing.  If checkbox checked, set cookie and local flag
   // to skip bouncing/login in the future.
   $ ('div.qwiz-usermenu_icon_no_intro').removeClass ('qwiz-icon-bounce');

   if ($ ('#usermenu-qdeck' + i_deck + ' input[type="checkbox"]').prop('checked')) {
      $.cookie ('qwiz_declined_login', 1, {path: '/'});
      document_qwiz_declined_login_b = true;
   }

   // Close menu.
   $ ('#usermenu-qdeck' + i_deck).hide ();
}


// -----------------------------------------------------------------------------
this.show_usermenu = function (i_deck) {
   $ ('#usermenu-qdeck' + i_deck).show ().mouseleave (function () {
                                                        $ (this).hide ();
                                                     });
}


// -----------------------------------------------------------------------------
this.sign_out = function () {

   // Delete cookie, unset flag.
   $.removeCookie ('qwiz_session_id', {path: '/'});
   document_qwiz_user_logged_in_b = false;

   // Reset menus to reflect current (logged-out) state.  Flag to NOT start
   // bouncing icons.
   qqc.set_user_menus_and_icons (true);
}


// -----------------------------------------------------------------------------
this.flip = function (i_deck) {

   if (deckdata[i_deck].check_answer_disabled_b) {
      alert (Tcheck_answer_message);
      return;
   }

   var textentry_obj = $ ('#textentry-qdeck' + i_deck);
   var front_obj = $ ('#qcard_card-qdeck' + i_deck + ' div.front');

   var set_front_back;
   if (deckdata[i_deck].showing_front_b) {

      // If recording, count number of flips (front-to-back only).
      if (deckdata[i_deck].qrecord_id && document_qwiz_user_logged_in_b) {
         deckdata[i_deck].n_flips++;

         // If this is first interaction with no-intro, single-card deck, record
         // as start time.  
         if (deckdata[i_deck].record_start_b && document_qwiz_user_logged_in_b) {
            deckdata[i_deck].record_start_b = false;
            var now_sec = new Date ().getTime ()/1000.0;
            var data = {type: 'start', now_sec: now_sec};
            qqc.jjax (qname, i_deck, deckdata[i_deck].qrecord_id, 'record_qcard', data);
         }
      }

      // Hide whole thing (Chrome randomly ignoring backface-visibility?),
      // superscripts and subscripts (!) (shows through in Safari, Chrome,
      // "flashing" in Chrome on Mac).  Closure for setTimeout ().
      var hideFrontElements = function () {
         front_obj.css ('visibility', 'hidden');
         front_obj.find ('sup, sub').css ('visibility', 'hidden');
      }

      // Hide qwiz icon/link.
      var i_card = deckdata[i_deck].i_card;
      if (i_card == 0) {
         $ ('div.qcard_window div#icon_qdeck' + i_deck).hide ();
      }

      // "Flip"/"Check answer" button - for back, change to "Flip back";
      $ ('button.flip-qdeck' + i_deck).html (T ('Flip back'));

      // Enable "Need more practice" and "Got it!" buttons, un-gray.
      $ ('button.got_it-qdeck' + i_deck + ', button.next_card-qdeck' + i_deck).attr ('disabled', false).removeClass ('qbutton_disabled').addClass ('qbutton');

      // Increment n_reviewed on first flip for this card and redisplay progress.
      if (! deckdata[i_deck].card_reviewed_b) {
         deckdata[i_deck].card_reviewed_b = true;
         deckdata[i_deck].n_reviewed++;

         // By topic, too.
         var card_topics = deckdata[i_deck].card_topics[i_card];
         if (debug[4]) {
            console.log ('[flip] card_topics:', card_topics);
         }
         if (card_topics) {
            for (var ii=0; ii<card_topics.length; ii++) {
               var topic = card_topics[ii];
               deckdata[i_deck].topic_statistics[topic].n_reviewed++;
            }
         }
         display_progress (i_deck);

         // If recording this deck, record (locally) time of first flip.
         if (deckdata[i_deck].qrecord_id) {
            var now_sec = new Date ().getTime ()/1000.0;
            deckdata[i_deck].current_first_flip_sec = now_sec;
         }
      }

      // If there's a text entry box...
      if (textentry_obj.length) {

         // Hide it (shows through in Safari, Chrome, "flashing" in Chrome on
         // Mac).
         textentry_obj.css ('visibility', 'hidden');

         var card = deckdata[i_deck].cards[i_card];
         if (card.textentry_required_b) {

            // Find with which choice the user textentry is associated, set card
            // back to answer for that choice.
            textentry_set_card_back (i_deck, card);
         } else {

            // If something entered in text box, then set back-side element to
            // what was entered.
            var textentry = textentry_obj.val ();
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

   deckdata[i_deck].el_flip.trigger ('click');

   // Closure for setTimeout ().
   var showFrontElements = function () {
      if (textentry_obj.length) {
         textentry_obj.css ('visibility', 'visible');
      }
      front_obj.css ('visibility', 'visible');
      front_obj.find ('sup, sub').css ('visibility', 'visible');
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
         if (no_intro_b[i_deck] && deckdata[i_deck].n_reviewed == 0) {
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

   // How soon does new html show?  Test.
   /*
   var ms_count = 0;
   var width_front = 0;
   var width_back  = 0;
   var now = new Date ();
   var start_ms = now.getTime ();
   var size_test = function () {
      var new_width_front  = deckdata[i_deck].el_qcard_table_front.outerWidth ();
      var new_width_back  = deckdata[i_deck].el_qcard_table_back.outerWidth ();
      if (new_width_front != width_front || new_width_back != width_back) {
         width_front = new_width_front;
         width_back  = new_width_back;
         var now = new Date ();
         var e_ms = now.getTime () - start_ms;
         console.log ('[size_test] ms_count: ', ms_count, ', e_ms: ', e_ms, ', width_front: ', width_front, ', width_back: ', width_back);
      }

      if (ms_count < 200) {
         setTimeout (size_test, 5);
      }
      ms_count += 5;
   }
   size_test ();
   */

   // Set card size to larger of front or back.
   set_container_width_height (i_deck, card.textentry_required_b);
};


// -----------------------------------------------------------------------------
function textentry_set_card_back (i_deck, card) {

   // See with which choice the user textentry is associated, make div for
   // feedback for that choice visible.  Hide others.
   var textentry_obj = $ ('#textentry-qdeck' + i_deck);
   var entry = textentry_obj.val ();

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

   var width_back   = deckdata[i_deck].el_qcard_table_back.outerWidth ();
   var height_back  = deckdata[i_deck].el_qcard_table_back.outerHeight ();

   var max_width  = Math.max (width_front,  width_back);
   var max_height = Math.max (height_front, height_back);
   if (debug[0]) {
      console.log ('[set_container_width_height] width_front: ', width_front, ', width_back: ', width_back);
   }

   // We'll set things right away, and again after a delay if rendering is
   // catching up.  Closure.
   var init_b = true;
   var delay_set_container_width_height = function () {
      var new_width_front  = deckdata[i_deck].el_qcard_table_front.outerWidth ();
      var new_height_front = deckdata[i_deck].el_qcard_table_front.outerHeight ();

      var new_width_back  = 0;
      var new_height_back = 0;
      if (textentry_required_b) {

         // Find largest width and height of alternate feedback divs.
         var el_qcard_table_back = deckdata[i_deck].el_qcard_table_back;
         var i_card = deckdata[i_deck].i_card;
         var n_choices = deckdata[i_deck].cards[i_card].choices.length;
         for (var i_choice=0; i_choice<n_choices; i_choice++) {
            var new_width_back_i  = el_qcard_table_back.find ('#textentry_feedback_qdeck' + i_deck + '-f' + i_choice).outerWidth ();
            var new_height_back_i = el_qcard_table_back.find ('#textentry_feedback_qdeck' + i_deck + '-f' + i_choice).outerHeight ();
            new_width_back  = Math.max (new_width_back,  new_width_back_i);
            new_height_back = Math.max (new_height_back, new_height_back_i);
         }
      } else {
         new_width_back  = deckdata[i_deck].el_qcard_table_back.outerWidth ();
         new_height_back = deckdata[i_deck].el_qcard_table_back.outerHeight ();
      }

      var new_max_width  = Math.max (new_width_front,  new_width_back);
      var new_max_height = Math.max (new_height_front, new_height_back);

      if (init_b || new_max_width != max_width || new_max_height != max_height) {
         init_b = false;
         if (textentry_required_b) {

            // Add 10px for padding (that position: absolute absorbs).
            new_max_width  += 10;
            new_max_height += 10;
         }
         max_width  = new_max_width;
         max_height = new_max_height;

         if (debug[0]) {
            console.log ('[delay_set_container_width_height] new_width_front: ', new_width_front, ', new_width_back: ', new_width_back);
         }

         deckdata[i_deck].el_qcard_table_front.outerWidth (max_width);
         deckdata[i_deck].el_qcard_table_back.outerWidth (max_width);

         deckdata[i_deck].el_qcard_table_front.outerHeight (max_height);
         deckdata[i_deck].el_qcard_table_back.outerHeight (max_height);

         // Set width and height of container to match.
         deckdata[i_deck].el_qcard_container.width (max_width);
         deckdata[i_deck].el_qcard_container.height (max_height);

         // Set the widths of the progress, header, and next-button divs to match
         // card.
         set_header (i_deck, 'front');
      }
   }
   setTimeout (delay_set_container_width_height, 10);
   setTimeout (delay_set_container_width_height, 500);
}


// -----------------------------------------------------------------------------
// Mark card, increment counters, go to next card.
this.got_it = function (i_deck) {

   var i_card = deckdata[i_deck].i_card;
   var ii_card = deckdata[i_deck].card_order[i_card];
   deckdata[i_deck].cards[ii_card].got_it = true;
   deckdata[i_deck].n_to_go--;
   q.next_card (i_deck, true);
};


// -----------------------------------------------------------------------------
// Go to next card.
var directions = ['right', 'left', 'top', 'bottom'];
this.next_card = function (i_deck, got_it_f) {

   // If recording, record either "Need more practice" or "Got it/check answer"
   // button press, as well as stored data.
   if (deckdata[i_deck].qrecord_id && document_qwiz_user_logged_in_b) {
      i_card = deckdata[i_deck].i_card;
      var textentry = '';  // DKTMP
      var now_sec = new Date ().getTime ()/1000.0;
      got_it_f = got_it_f ? 1 : 0;
      var data = {type:                'flashcard',
                  i_card:              i_card,
                  q_and_a_text:        deckdata[i_deck].q_and_a_text[i_card],
                  first_flip_sec:      deckdata[i_deck].current_first_flip_sec,
                  n_flips:             deckdata[i_deck].n_flips,
                  first_textentry_sec: deckdata[i_deck].current_first_textentry_sec,
                  response:            textentry,
                  now_sec:             now_sec,
                  got_it_f:            got_it_f
                 };
      qqc.jjax (qname, i_deck, deckdata[i_deck].qrecord_id, 'record_qcard', data)
   }

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
   var entry_metaphone = qqc.metaphone (entry);
   if (debug[6]) {
      console.log ('[find_matching_terms] entry_metaphone; ', entry_metaphone);
   }

   // If recording this deck, record (locally) time of first interaction with
   // free-format input (textentry_i_deck set on focus in set_textentry_i_deck ()).
   if (deckdata[textentry_i_deck].qrecord_id) {
      if (! deckdata[textentry_i_deck].current_first_textentry_sec) {
         var now_sec = new Date ().getTime ()/1000.0;
         deckdata[textentry_i_deck].current_first_textentry_sec = now_sec;
      }
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
      required_entry_length = Math.min (3, required_entry_length);
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
   if (deduped_entry.length >= 3 && deckdata[textentry_i_deck].textentry_n_hints < 5) {
      var i_card = deckdata[textentry_i_deck].i_card;
      var card = deckdata[textentry_i_deck].cards[i_card];
      var lc_first_choice = card.all_choices[0];
      if (typeof (lc_textentry_matches[textentry_i_deck]) == 'undefined'
            || lc_textentry_matches[textentry_i_deck].indexOf (lc_first_choice) == -1) {
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

qcardf.call (qcard_);


/* =============================================================================
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
