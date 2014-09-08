/*
 * Version 1.1b03 2014-09-07
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
debug = [];
debug.push (false);    // 0 - general.
debug.push (false);    // 1 - process_card_input ().
debug.push (false);    // 2 - answer (card back) html.
debug.push (false);    // 3 - old/new html dump.
debug.push (false);    // 4 - card tags/topics.
debug.push (false);    // 5 - "next" buttons, element objects.

$ = jQuery;

// Private data, but global to this qcard instance.
var q = this;

// The identifier -- including qualifiers like "#" -- of the page content (that
// perhaps contains inline qwizcard decks) on WordPress.
var content = 'div.entry-content';
//var content = 'main';

var errmsgs = [];

var n_decks = 0;
var no_intro_b = [];

var deck_id;
var deckdata = [];

// ----------------------
// DKTMP: needs to be by deck

// Array of topics (will check that individual card entries are in this list).
// Short names.
var topics = [];
var n_topics;

// Topic description for summary report.
var topic_descriptions = new Object;

// Statistics by topic.
var topic_statistics = new Object;


// -----------------------------------------------------------------------------
$(document).ready (function () {

   // Add default styles for qcard divs to page.
   add_style ();

   process_html ();

   // Error messages, if any.
   if (errmsgs.length) {
      alert (plural ('Error', errmsgs.length) + ' found:\n\n' + errmsgs.join ('\n'));
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

         // Do it again to set proper width.
         var qcard_width = set_header (i_deck, 'front', true);
         set_container_width_height (i_deck, qcard_width);
      }
   }

});


// -----------------------------------------------------------------------------
function process_html () {

   // Ignore qcard-tag pairs inside <xmp></xmp> pairs.
   // Loop over tags (if any), save html, replace (temporarily) with null html.
   var xmp_htmls = [];
   $('xmp').each (function () {
      xmp_htmls.push ($(this).html ());
      $(this).html ('');
   });

   // Delete paragraphs and headers that contain only [!] ... [/!] comments
   // and whitespace.  Two "contains": both [!] and [/!] must be present.
   $ ('p:contains("[!]"), :header:contains("[!]")').each (function () {

      // See if only whitespace outside [!] ... [/!].
      var comment_htm = $ (this).html ();
      if (comment_htm.search (/\s*\[!\][\s\S]*\[\/!\]\s*/m) == 0) {
         $ (this).remove ();
      }
   });

   // Read WordPress user content divs, look for inline qcard "tags", loop
   // over tag pairs.
   $(content).each (function () {
      var htm = $(this).html ();
      if (! htm) {

         //errmsgs.push ('Did not find page content (looking for div "' + content + '")');
      } else {

         // See if there is a deck or decks.
         var qdeck_pos = htm.search ('[qdeck]');
         if (qdeck_pos != -1) {

            // Delete comments -- don't want to process [qdeck][/qdeck] pairs or any other
            // deck-related tags that are in comments.
            var new_html = htm.replace (/<!--[\s\S]*?-->/gm, '');

            // Take out any remaining [!]...[\!] comments (those that were not
            // inside paragraph or header elements).
            new_html = new_html.replace (/\[!\][\s\S]*?\[\/!\]/gm, '');

            // Check that there are pairs.
            check_qdeck_tag_pairs (new_html);

            // Get text, including beginning and ending tags.
            // "." does not match line-ends (!), so use the whitespace/not-whitespace
            // construct.  Non-greedy search, global, multiline.
            var qdeck_matches = new_html.match (/\[qdeck[\s\S]*?\[\/qdeck\]/gm);
            if (qdeck_matches) {
               n_decks = qdeck_matches.length;
               if (debug[0]) {
                  console.log ('[process_html] n_decks: ', n_decks);
                  console.log ('               qdeck_matches[0]: ', qdeck_matches[0]);
               }

               // Loop over qdeck-tag pairs.
               for (var i_deck=0; i_deck<n_decks; i_deck++) {
                  var new_deck_html = process_qdeck_pair (qdeck_matches[i_deck], i_deck);
                  new_html = new_html.replace (/\[qdeck[\s\S]*?\[\/qdeck\]/m, new_deck_html);
               }
            }

            // Replace content html.
            $(this).html (new_html);
         }
      }
   });

   // Restore <xmp> content.
   if (xmp_htmls.length) {
      $('xmp').each (function (i) {
         $(this).html (xmp_htmls[i]);
      });
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
   s.push ('   color:           white;');
   s.push ('   background:      black;');
   s.push ('   margin:          0px;');
   s.push ('   padding:         0px;');
   s.push ('}');

   /* Any sub-elements of header have zero margin. */
   s.push ('div.qcard_header * {');
   s.push ('   margin:          0px;');
                             /* top right bot left */
   s.push ('   padding:         0px 5px 0px 5px;');
   s.push ('}');

            /* Card */
   s.push ('.qcard_card {');
   s.push ('   position:            relative;');
   s.push ('}');

   s.push ('.qcard_textentry {');
   s.push ('   font-size:           13pt;');
   s.push ('   font-weight:         bold;');
   s.push ('   color:               blue;');
   s.push ('}');

   s.push ('.back_textentry_p {');
   s.push ('   margin-top:          0px;');
   s.push ('}');

   s.push ('.qcard_card .front {');
   s.push ('   min-height:          280px;');
   s.push ('}');

   s.push ('.qcard_card td.center {');
   s.push ('   padding:             5px;');
   s.push ('   text-align:          center;');
   s.push ('   vertical-align:      middle;');
   s.push ('   font-size:           12pt;');
   s.push ('   font-weight:         bold;');
   s.push ('}');

   s.push ('.qcard_card img {');
   s.push ('   border:              0px;');
   s.push ('   box-shadow:          none;');
   s.push ('}');

   s.push ('.qcard_card .back .center {');
   s.push ('   background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAf4AAAE2CAIAAAAPtmerAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAEnklEQVR4nO3YMW1AMRQEwTgyf3ix9Mm8sLCLnUFw1Ra3ZuYHgJLf1wMAuE36AXKkHyBH+gFypB8gR/oBcqQfIEf6AXKkHyBH+gFypB8gR/oBcqQfIEf6AXKkHyBH+gFypB8gR/oBcqQfIEf6AXKkHyBH+gFypB8gR/oBcqQfIEf6AXKkHyBH+gFypB8gR/oBcqQfIEf6AXKkHyBH+gFypB8gR/oBcqQfIEf6AXKkHyBH+gFypB8gR/oBcqQfIEf6AXKkHyBH+gFypB8gR/oBcqQfIGf//P293gDAVWtmXm8A4CqHD0CO9APkSD9AjvQD5Eg/QI70A+RIP0CO9APkSD9AjvQD5Eg/QI70A+RIP0CO9APkSD9AjvQD5Eg/QI70A+RIP0CO9APkSD9AjvQD5Eg/QI70A+Ts883rDQBctWakH6DF4QOQI/0AOdIPkCP9ADnSD5Aj/QA50g+QI/0AOdIPkCP9ADnSD5Aj/QA50g+QI/0AOdIPkCP9ADnSD5Aj/QA50g+QI/0AOdIPkCP9ADnSD5Aj/QA5+3zzegMAV60Z6QdocfgA5Eg/QI70A+RIP0CO9APkSD9AjvQD5Eg/QI70A+RIP0CO9APkSD9AjvQD5Eg/QI70A+RIP0CO9APkSD9AjvQD5Eg/QI70A+RIP0CO9APkSD9Azj7fvN4AwFVrRvoBWhw+ADnSD5Aj/QA50g+QI/0AOdIPkCP9ADnSD5Aj/QA50g+QI/0AOdIPkCP9ADnSD5Aj/QA50g+QI/0AOdIPkCP9ADnSD5Aj/QA50g+QI/0AOdIPkLPPN683AHDVmpF+gBaHD0CO9APkSD9AjvQD5Eg/QI70A+RIP0CO9APkSD9AjvQD5Eg/QI70A+RIP0CO9APkSD9AjvQD5Eg/QI70A+RIP0CO9APkSD9AjvQD5Eg/QI70A+Ts883rDQBctWakH6DF4QOQI/0AOdIPkCP9ADnSD5Aj/QA50g+QI/0AOdIPkCP9ADnSD5Aj/QA50g+QI/0AOdIPkCP9ADnSD5Aj/QA50g+QI/0AOdIPkCP9ADnSD5Aj/QA5+3zzegMAV60Z6QdocfgA5Eg/QI70A+RIP0CO9APkSD9AjvQD5Eg/QI70A+RIP0CO9APkSD9AjvQD5Eg/QI70A+RIP0CO9APkSD9AjvQD5Eg/QI70A+RIP0CO9APkSD9Azj7fvN4AwFVrRvoBWhw+ADnSD5Aj/QA50g+QI/0AOdIPkCP9ADnSD5Aj/QA50g+QI/0AOdIPkCP9ADnSD5Aj/QA50g+QI/0AOdIPkCP9ADnSD5Aj/QA50g+QI/0AOdIPkLPPN683AHDVmpF+gBaHD0CO9APkSD9AjvQD5Eg/QI70A+RIP0CO9APkSD9AjvQD5Eg/QI70A+RIP0CO9APkSD9AjvQD5Eg/QI70A+RIP0CO9APkSD9AjvQD5Eg/QI70A+Ts883rDQBctWakH6DF4QOQI/0AOdIPkCP9ADnSD5Aj/QA50g+QI/0AOdIPkCP9ADnSD5Aj/QA50g+QI/0AOdIPkCP9ADnSD5Aj/QA50g+QI/0AOdIPkCP9ADnSD5Aj/QA5/8mNPTHI1j+2AAAAAElFTkSuQmCC);');
   s.push ('   background-repeat:   no-repeat;');
   s.push ('   background-size:     contain;');
   s.push ('   background-position: center;');
   s.push ('   min-height:          280px;');
   s.push ('   line-height:         25px;');
   s.push ('   font-size:           12pt;');
   s.push ('}');
   s.push ('.qcard_card .cbutton {');
   s.push ('   display:          none;');
   s.push ('}');
   s.push ('.qcard_next_buttons {');
   s.push ('   position:            relative;');
   s.push ('   margin-top:          5px;');
   s.push ('   text-align:          center;');
   s.push ('}');
   s.push ('.qbutton {');
   s.push ('   margin-bottom: 10px;');
   s.push ('   border-top: 1px solid #96d1f8;');
   s.push ('   background: #65a9d7;');
   s.push ('   background: -webkit-gradient(linear, left top, left bottom, from(#3e779d), to(#65a9d7));');
   s.push ('   background: -webkit-linear-gradient(top, #3e779d, #65a9d7);');
   s.push ('   background: -moz-linear-gradient(top, #3e779d, #65a9d7);');
   s.push ('   background: -ms-linear-gradient(top, #3e779d, #65a9d7);');
   s.push ('   background: -o-linear-gradient(top, #3e779d, #65a9d7);');
   s.push ('   padding: 5px 10px;');
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
   var qdeck_tag = htm.match (/(<[^>\/]*?>\s*)*?\[qdeck[^\]]*\]/m)[0];

   var n_decks = 0;
   var new_html = '';
   var no_intro_i_b = false;

   // Is deck encoded?  Decode if necessary.
   htm = decode_qdeck (htm, qdeck_tag);

   // Capture any initial closing tags after [qdeck ...] -- will put them in
   // front of <div> that replaces [qdeck ...].
   var m = htm.match (/\[qdeck[^\]]*\]((<\/[^>]*?>\s*)*)/m, '');
   if (m) {
      var initial_closing_tags = m[1];
      new_html += initial_closing_tags;
   }

   // Delete [qdeck], any initial closing tags.
   htm = htm.replace (/\[qdeck[^\]]*\]((<\/[^>]*?>\s*)*)/m, '');

   // Delete any initial whitespace.
   htm = trim (htm);

   // Make sure there's at least one question.
   if (htm.search (/\[q([^\]]*)\]/m) == -1) {
      errmsgs.push ('Did not find question tags ("[q]") for qdeck ' + (i_deck + 1));
   } else {

      // See if header.  Sets deckdata[i_deck].header_html.
      htm = process_header (htm, i_deck, 0, true);

      // See if intro.
      var intro_html = parse_html_block (htm, ['[i]'], ['[q]', '[q ']);

      // See if no [i].
      if (intro_html == 'NA') {
         
         // No [i] -- intro may be text before [q].  See if there is.
         intro_html = parse_html_block (htm, ['^'], ['[q]', '[q ']);
      }

      // See if intro was just tags and whitespace.
      if (intro_html == '') {
         no_intro_i_b = true;
      } else {
         // Error if text before [i].
         if (htm.substr (0, 5) != intro_html.substr (0, 5)) {
            errmsgs.push ('Text before intro [i] - qdeck ' + (i_deck + 1));
         }

         // Delete [i] from intro.
         intro_html = intro_html.replace ('[i]', '');

         // If there's a [start] tag, replace with start button html.  Otherwise
         // add start button html.
         var start_button_html = '<button class="qbutton" onclick="' + qname + '.start_deck (' + i_deck + ')">Start reviewing cards</button>';
         if (intro_html.indexOf ('[start]') != -1) {
            intro_html = intro_html.replace ('[start]', start_button_html);
         } else {
            intro_html += start_button_html;
         }

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
      var matches = htm.match (/(<[^>\/]*?>\s*)*?\[q[ \]]/gm);
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
                        + '       Review this flashcard stack again\n'
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
         card = process_card_input (i_deck, i_card, cards_html[i_card],
                                    q_opening_tags[i_card]);
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
// Get card front and card back html, put into data array.
function process_card_input (i_deck, i_card, htm, opening_tags) {

   // Object for this card.
   var card = new Object;
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
   var front_textentry_b = new_card_front_html != card_front_html;


   // ..........................................................................
   // Find card back html.
   var card_back_html = htm.match (/\[a\][\s\S]*/m);
   if (debug[0]) {
      console.log ('[process_card_input] card_back_html: ', card_back_html);
   }

   // Take off initial "[a]".
   if (! card_back_html) {
      errmsgs.push ('Did not find answer ("[a]") -- card back -- for qdeck ' + (i_deck + 1) + ', card ' + (i_card + 1) + '\n' + htm);
      card_back_html = '';
   } else {
      card_back_html = card_back_html[0].substring (3);
   }

   // Split into individual items.  Should be just one.
   var card_back_items = card_back_html.split (/\[a\]/);
   if (card_back_items.length != 1) {
      errmsgs.push ('Got more than one card back ("[a]") for: qdeck ' + (1 + i_deck) + ', card ' + (1 + i_card) + '\n' + htm);
   }

   // Capture any opening tags before "[a]" tag.
   var a_opening_tags;
   var m = htm.match (/(<[^>\/]*?>\s*)*?\[a\]/m);
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
function create_card_back_html (i_deck, i_card, htm, opening_tags, front_textentry_b) {

   var new_html = opening_tags + htm;

   // See if '[textentry]' present.
   if (htm.search (/\[.*textentry.*/) != -1) {

      // Yes.  Error if no textentry on front.
      if (! front_textentry_b) {
         errmsg.push ('[textentry] on back of card, but not on front - deck ' + (i_deck+1) + ', card ' (i_card+1));
      }

      // Convert to equivalent html.
      new_html = card_back_textentry_html (new_html);
   } else {

      // No.  If there was textentry on front, create default echo.
      if (front_textentry_b) {
         var prepend_html = '<p id="back_textentry_p-qdeck' + i_deck + '" class="back_textentry_p">You wrote &ldquo;<span id="back_textentry-qdeck' + i_deck + '" class="qcard_textentry"></span>&rdquo;</p>';
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
function parse_html_block (htm, qtags, qnext_tags) {

   // Include opening tags before the qwiz/qcard tags in each case.
   var opening_pat = '(<[^/][^>]*?>\\s*)*?'; 
   var tags_pat = opening_pat + tags_to_pat (qtags);
   var next_tags_pat = opening_pat + tags_to_pat (qnext_tags);

   // Final term collects any immediate closing tags after next qtags.
   var closing_pat = '((</[^>]*?>\\s*)*)';
   var re = new RegExp ('([\\s\\S]*?)(' + tags_pat + '[\\s\\S]*?)' + next_tags_pat + closing_pat, 'im');
   var htm_match = htm.match (re);
   var htm_block = '';
   var closing_tags = '';
   if (htm_match) {
      htm_block = htm_match[2];

      // If htm is only tags and whitespace, set to empty string.
      var htm_wo_tags = htm_block.replace (/<[^>]+>/gm, '');
      if (htm_wo_tags.search (/\S/) == -1) {
         htm_block = '';
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
function process_header (htm, i_deck, i_question, intro_b) {
   var qtags = ['[h]'];
   var qnext_tags = ['[q]', '[q '];
   if (intro_b != undefined) {
      qnext_tags.push ('[i]');
   }

   var header_html = parse_html_block (htm, qtags, qnext_tags);
   if (header_html != 'NA' && header_html != '') {

      // Error if text before [h].
      if (htm.substr (0, 5) != header_html.substr (0, 5)) {
         errmsgs.push ('Text before header [h] - qdeck ' + (i_deck + 1));
      }

      // Delete header from htm.
      htm = htm.replace (header_html, '');

      // See if [h] (header this page only) or [H] (persistent, but only until
      // next header given -- an empty header erases).
      //header_persist_b = (header_html.search ('[H]') != -1);

      // Delete [h] from header.
      header_html = header_html.replace (/\[h\]/ig, '');
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
   if (! attributes) {
      attributes = default_style;
   } else {
      if (attributes.search (/style\s*?=/m) == -1) {
         attributes += default_style;
      } else {
         if (attributes.search ('width') == -1) {
            attributes = attributes.replace (/(style\s*?=\s*?["'])/m, '$1width: 500px; ');
         }
         if (attributes.search ('height') == -1) {
            attributes = attributes.replace (/(style\s*?=\s*?["'])/m, '$1height: 300px; ');
         }
         if (attributes.search ('border') == -1) {
            attributes = attributes.replace (/(style\s*?=\s*?["'])/m, '$1border: 2px solid black; ');
         }
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
   divs.push ('   <div id="qcard_next_buttons-qdeck' + i_deck + '" + class="qcard_next_buttons">');
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

      // See if any attribute.
      var matches = card_tag.match (/\[q +([^\]]*)\]/);
      if (matches && matches[1].substr (0, 7) == 'topic="') {
         var attribute = matches[1].substr (7);
         var matches = attribute.match (/([^"]*)"/);
         if (matches) {
            var card_topics = trim (matches[1]);
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
         errmsgs.push ('Topic(s) were given for at least one card, but at least one card doesn\'t have a topic.');
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
            var tag = matches[i];
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
         alert        ('Unmatched [qdeck] - [/qdeck] pairs.');
         errmsgs.push ('Unmatched [qdeck] - [/qdeck] pairs.');
      }
   }
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
      htm = htm.replace ('textentry', '<span id="back_textentry-qdeck' + i_deck + '" class="qdeck_textentry"></span>');
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
      topic_statistics[topic] = new Object;
      topic_statistics[topic].n_got_it = 0;
   }

   return errmsg;
}


// -----------------------------------------------------------------------------
function init_element_pointers (i_deck) {

   // jQuery element objects for this deck.
   deckdata[i_deck].el_qcard_container  = $('#qcard_window-qdeck' + i_deck + ' div.card-container');
   deckdata[i_deck].el_flip             = $('.cbutton-qdeck' + i_deck);
   deckdata[i_deck].el_progress         = $('#qcard_progress-qdeck' + i_deck);
   deckdata[i_deck].el_header           = $('#qcard_header-qdeck' + i_deck);
   deckdata[i_deck].el_qcard_card       = $('#qcard_card-qdeck' + i_deck);
   deckdata[i_deck].el_qcard_card_front = $('#qcard_card-qdeck' + i_deck + ' div.front td.center');
   deckdata[i_deck].el_qcard_card_back  = $('#qcard_card-qdeck' + i_deck + ' div.back  td.center');
   deckdata[i_deck].el_next_buttons     = $('#qcard_next_buttons-qdeck' + i_deck);

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
}


// -----------------------------------------------------------------------------
// Needs to be available publicly -- e.g., as qcard.set_next_buttons () -- for
// onclick ().  "this" for "this qcard instance".
this.set_next_buttons = function (i_deck) {
   var htm = '';
   htm += '<button class="qbutton" onclick="' + qname + '.got_it (' + i_deck + ')" title="Remove this card from the stack">Got it!</button> &nbsp; ';
   if (deckdata[i_deck].n_to_go > 1) {
      htm += '<button class="qbutton next_card-qdeck' + i_deck + '" onclick="' + qname + '.next_card (' + i_deck + ')" title="Put this card at the bottom of stack, show the next card">Need more practice</button> &nbsp; ';
   }
   htm += '<button class="qbutton" onclick="' + qname + '.flip (' + i_deck + ')" title="Show the other side">Flip</button> &nbsp; ';
   if (deckdata[i_deck].n_to_go > 1) {
      htm += '<button class="qbutton shuffle-qdeck' + i_deck + '" onclick="' + qname + '.shuffle_order (' + i_deck + ')" title="Randomly shuffle the remaining cards">Shuffle</button> &nbsp; ';
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

            // Display card.  If only one to go, disable and gray out
            // more practice/next card and shuffle buttons.
            if (deckdata[i_deck].n_to_go == 1) {
               $('.next_card-qdeck' + i_deck).attr ('disabled', true);
               $('.next_card-qdeck' + i_deck).css ({color: '#e6e6e6', background: '#cccccc', 'border-top-color': '#cccccc', 'text-shadow': 'none', 'box-shadow': 'none'});

               $('.shuffle-qdeck' + i_deck).attr ('disabled', true);
               $('.shuffle-qdeck' + i_deck).css ({color: '#e6e6e6', background: '#cccccc', 'border-top-color': '#cccccc', 'text-shadow': 'none', 'box-shadow': 'none'});
            }
            deckdata[i_deck].i_card = i_card;
            deckdata[i_deck].n_reviewed++;
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
   if (deckdata[i_deck].n_reviewed == deckdata[i_deck].n_cards) {
      report_html.push ('<p>In this ' + number_to_word (deckdata[i_deck].n_cards) + '-flashcard stack, you marked every card &lsquo;got it&rsquo; on the first try.</p>');
   } else {
      report_html.push ('<p>This flashcard stack had ' + deckdata[i_deck].n_cards + ' cards.  It took you ' + deckdata[i_deck].n_reviewed + ' tries until you felt comfortable enough to to mark &lsquo;got it&rsquo; for each card.</p>');
   }

   // See if more than one topic in this deck.
   /*
   var multiple_topics_b = false;
   var first_topic = cards[0].topics[0];
   for (var ii_card=0; ii_card<n_cards; ii_card++) {
      var card_topics = cards[ii_card].topics;
      for (var ii=0; ii<card_topics.length; ii++) {
         if (card_topics[ii] != first_topic) {
            multiple_topics_b = true;
            break;
         }
      }
      if (multiple_topics_b) {
         break;
      }
   }
   if (! multiple_topics_b) {
      report_html.push ('<p>All ' + number_to_word (n_cards) + ' ' + plural ('question', deckdata[i_deck].n_cards) + ' were about ' + topic_descriptions[first_topic] + '.</p>');
   } else {

      // By topic.
      report_html.push ('<ul>');
      for (var i_topic=0; i_topic<n_topics; i_topic++) {
         var topic = topics[i_topic];
         var n_topic_cards = topic_statistics[topic].n_got_it;
         if (n_topic_cards > 0) {
            var topic_html = '<li>There ' + plural ('was', n_topic_cards) + ' ' + number_to_word (n_topic_cards) + ' ' + plural ('question', n_topic_cards) + ' about ' +  topic_descriptions[topic] + '.&nbsp;';
            if (n_topic_incorrect == 0) {
               if (n_topic_cards > 2) {
                  topic_html += 'You answered all of these questions correctly on the first try.';
               } else if (n_topic_cards == 2) {
                  topic_html += 'You answered both of these questions correctly on the first try.';
               } else {
                  topic_html += 'You answered this question correctly on the first try.';
               }
            } else if (n_topic_cards == 1) {
               topic_html += 'It took you ' + number_to_word (n_topic_cards + n_topic_incorrect) + ' tries to answer this question correctly.';
            } else {
               topic_html += 'It took you ' + number_to_word (n_topic_cards + n_topic_incorrect) + ' tries to answer these ' + number_to_word (n_topic_cards) + ' questions correctly.';
            }
            topic_html += '</li>';
            report_html.push (topic_html);
         }
      }
      report_html.push ('</ul>');
   }
   */

   // Show exit text.
   report_html.push (deckdata[i_deck].exit_html);

   deckdata[i_deck].el_qcard_card_front.html (report_html.join ('\n'));
}


// -----------------------------------------------------------------------------
function display_progress (i_deck) {
   var progress_html;
   progress_html = '<p>' + deckdata[i_deck].n_cards + ' cards total, ' + deckdata[i_deck].n_reviewed + ' ' + plural ('card', deckdata[i_deck].n_reviewed) + ' reviewed, ' + deckdata[i_deck].n_to_go + ' ' + plural ('card', deckdata[i_deck].n_to_go) + ' to go</p>';
   deckdata[i_deck].el_progress.html (progress_html);
}


// -----------------------------------------------------------------------------
this.flip = function (i_deck) {

   var el_textentry = $ ('#textentry-qdeck' + i_deck);
   var el_front = $ ('#qcard_card-qdeck' + i_deck + ' div.front');

   var set_front_back;
   if (deckdata[i_deck].showing_front_b) {

      // Hide superscripts and subscripts (!) (shows through in Safari, Chrome,
      // "flashing" in Chrome on Mac).
      el_front.find ('sup, sub').css ('visibility', 'hidden');

      // If there's a text entry box...
      if (el_textentry.length) {

         // Hide it (shows through in Safari, Chrome, "flashing" in Chrome on
         // Mac.
         el_textentry.css ('visibility', 'hidden');

         // If something entered in text box, then set back-side element to what
         // was entered.
         var textentry = el_textentry.val ();
         if (textentry) {

            // Show what was within square brackets, insert user entry.
            $('#back_textentry_p-qdeck' + i_deck).show ();
            $('#back_textentry-qdeck' + i_deck).html (textentry);
         } else {

            // No entry on front. Don't display any of paragraph on back.
            $('#back_textentry_p-qdeck' + i_deck).hide ();
         }
      }
      set_front_back = 'back';
   } else {
      set_front_back = 'front';
   }

   // Set the widths of the progress, header, and next-button divs to match
   // card front/back.
   set_header (i_deck, set_front_back);

   deckdata[i_deck].el_flip.trigger ('click');

   // Closure for setTimeout ().
   var showFrontElements = function () {
      if (el_textentry.length) {
         el_textentry.css ('visibility', 'visible');
      }
      el_front.find ('sup, sub').css ('visibility', 'visible');
   };

   // In case was hidden, show front text box and super/subscripts, but wait 
   // till after flip completes ("flashing" in Chrome).  (Time equal to that in
   // flipCard.css.)
   if (! deckdata[i_deck].showing_front_b) {
      setTimeout (showFrontElements, 700);
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

   // Set the widths of the progress div and header div to match card front.
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

   var card_front_back = ['card_front', 'card_back'];

   // Show progress.
   display_progress (i_deck);

   var i_card = deckdata[i_deck].i_card;
   var ii_card = deckdata[i_deck].card_order[i_card];
   var card = deckdata[i_deck].cards[ii_card];

   for (var i_side=0; i_side<2; i_side++) {
      var side = card_front_back[i_side];

      // Card front/back text.
      if (side == 'card_front') {
         deckdata[i_deck].el_qcard_card_front.html (card[side]);
      } else {
         deckdata[i_deck].el_qcard_card_back.html (card[side]);
      }
   }

   // Set focus to textentry box, if there is one.  Don't do if first card and
   // no intro (avoid scrolling page to this flashcard deck).
   if (i_card != 0 || ! no_intro_b[i_deck]) {
      $('#textentry-qdeck' + i_deck).focus ();
   }

   // Set the widths of the progress, header, and next-button divs to match
   // card front.
   var qcard_width = set_header (i_deck, 'front');

   set_container_width_height (i_deck, qcard_width);
};


// -----------------------------------------------------------------------------
function set_container_width_height (i_deck, qcard_width) {

   // Get height of front and back, set height of container to larger of the
   // two.
   var height_front = deckdata[i_deck].el_qcard_card_front.outerHeight ();
   var height_back  = deckdata[i_deck].el_qcard_card_back.outerHeight ();
   var max_height = Math.max (height_front, height_back);

   if (debug[0]) {
      var header_height = deckdata[i_deck].el_header.height ();
      console.log ('[set_container_width_height] height_front: ', height_front, ', height_back: ', height_back, ', header_height: ', header_height);
   }

   // Add height of header, progress div and "next" buttons.
   deckdata[i_deck].el_qcard_container.height (max_height);
   deckdata[i_deck].el_qcard_container.width (qcard_width);
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

   // Do not increment number reviewed -- "undo" increment in process_card ().
   deckdata[i_deck].n_reviewed--;
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
var number_word = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];

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
function plural (word, n) {
   var new_word;
   if (n == 1) {
      new_word = word;
   } else {

      // Specials first.
      if (word == 'was') {
         new_word = 'were';

      } else if (word == 'this') {
         new_word = 'these';

      } else {

         // The simple case.
         new_word = word + 's';
      }
   }

   return new_word;
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

               /*
               $this.find('div.front').fadeToggle();
               $this.find('div.back').fadeToggle();
               */
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
