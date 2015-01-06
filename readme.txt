=== Qwiz - online quizzes and flashcards ===
Contributors: dan_kirshner
Tags: interactive quiz, quiz, flashcards, labeled diagrams
Tested up to: 4.1
Stable tag: 2.27
License: GPL2
License URI: http://www.gnu.org/licenses/gpl-2.0.html

Qwiz lets you create quizzes and flashcard decks using simple shortcodes (such as "[q]" for a question) that you include in your page/post.


== Description ==
Easy online quizzes and flashcards for WordPress - use simple shortcodes (such as "[q]" for a question) in your page or post.  See http://dkprojects.net/qwiz
Note: Version 2.20 fixed a problem with custom widths, borders, etc. of quizzes and flashcard decks that WordPress 4.01 introduced with at least one theme (Magazine Basic).

== Installation ==
Upload 'qwiz-online-qwizzes-wp-plugin.php' to your plugins directory ('.../wp-content/plugins').
Activate the plugin through the 'Plugins' menu in WordPress

== Screenshots ==

== Changelog ==

= 2.27 =
2015-01-05
Make sure labeled-diagram questions contain matching opening/closing divs.
Just count targets, not labels.
Toolbar option - keep "next" button active.
Check for allow_url_fopen, check version number.
Don't increment number of cards reviewed until "Check answer"/flip.
Feedback interleaved with choices, optional.

= 2.26 =
2014-12-21
Avoid clobbering other plugins' events - WP content filter creates divs for each qwiz/qdeck - rewrite only those divs.
On back side of card, "Flip"/"Check answer" -> "Flip back".
Gray-out/disable "Need more practice" and "Got it!" until user clicks "Check answer".
Take xqwiz sizing div out of flow.


= 2.25 =
2014-12-16
Fix search for any [qwiz] or [qdeck] shortcodes.
Reorder flashcard buttons, default translation: "Flip" -> "Check answer".

= 2.24 =
2014-12-15
Alternate edit-area iframe id: wpb_tinymce_content_ifr.
Make $ (= jQuery) private.
Use jQuery rather than $ in qwizscripts.js.

= 2.23 =
2014-12-13
Explicit visible/hidden for card front/back. (Chrome backface-visibility?)

= 2.22 =
2014-12-07
Multiple targets for a single label.
Accommodate image resizing (resize wrapper, reposition targets).
Tolerate whitespace before [h].
Fix check for paragraph with header plus something else -- don't delete.
Qwiz icon within <td> - keep the icon inside the border.
Reinstate containment for labels -- by table size.
qtarget_sibs-... instead of text_target_wrapper (except for backwards compatibility).
Don't allow draggable labels to be "underneath" already-placed labels.
Keep [!] comments at end of labeled-diagram question outside the question div.
Fix: made headers into labels.

= 2.21 =
2014-12-02
Workaround for Firefox 33.1 problem with long regular expression and long
string in intro parse.

= 2.20 =
2014-11-20
Handle "smart quotes" in attributes.

= 2.19 =
2014-11-19
Hide shortcodes until finished processing.
Option to deploy beta.
Add "Q #1/4" to labeled diagram progress.


= 2.18 =
2014-11-16
Admin/settings: beta capability, revert capability.
More backwards compatibility fixes (labeled diagrams assoc_id).
Move comments ([!] ... [/!] after labels, delete trailing whitespace in labels.

= 2.17 =
2014-11-13
Bug fix - "text before intro"

= 2.16 =
2014-11-12
Delete question and label divs with nothing in them.
Nicer formatting of labeled diagram borders in editor.
Delete <br> in header.
Separate out "Got it!" from summary text.
Editing: improve backwards compatibility with data- (identify labels having targets).

= 2.15 =
2014-11-09
Nicer qwiz icon, hover effect.  Hide icon with flip.
Ignore empty paragraphs when no [i]: handle multiple paragraphs.
Fix choice highlighting when multiple choices within one paragraph.
Admin page: option to hide qwiz icon, or display without link, option to 
change content div location; option to replace button labels.
Handle left- and right-double-quotes in labels="top", etc.
Flashcards: correct sizing of larger of front and back (border showing through in
Firefox).

= 2.14 =
2014-11-04
Restore missing double quote -- couldn't split on labeled diagrams.

= 2.13 =
2014-11-04
Delete php closing tags in .php files.

= 2.12 =
2014-11-03
A few minor fixes.

= 2.11 =
2014-11-03
Use classes for labeled-diagram target/label borders - avoid "flash" on page
load.  (Fixes newly-created labeled diagrams only.)
Ignore empty paragraphs (with "&nbsp;") in intro without "[i]".
Qwiz icon/link on intro or first question only.
If labeled diagram is wide, reset qwiz div/borders to match.
'div.container' as content option.
Use class "qtarget_assocNNN..." instead of data-...; some implementations
eat data-...

= 2.10 =
2014-10-28
Fix topic= for labeled diagram questions.
Add labels="top", etc. options for labeled diagram questions.

= 2.09 =
2014-10-12
Fix "Mode" not showing after labeled diagram.
Labeled diagram not "correct" until labels placed correctly on first try.
Add random="true" option for flashcard decks - initial order randomized.
Warn/prevent use of images with captions for labeled diagrams.
A few more strings for internationalization.

= 2.08 =
2014-10-05
Add internationalization - use .po and .mo files.
Add div.post-entry as page content location.

= 2.07 =
2014-10-01
Suppress errors, delete source in page/post excerpts.

= 2.06 =
2014-09-29
Bug fix - lost "next" button.

= 2.05 =
2014-09-29
Apply gray-out to label children, too (overwrite specific settings).
[qwizdemo] tags in qwizcards.js, too.

= 2.04 =
2014-09-29
Labels list vertical-align top.
Fix label placement progress when multiple quizzes.
-webkit-user-select none - improves Android Chrome drag.
[qwizdemo] tags.

= 2.03 =
2014-09-26
Vertical-center labels in targets.
jquery.ui.touch-punch for phone drag-and-drop.

= 2.02 =
2014-09-21
Re-initialize diagrams (to clone of orig) on restart.
Restart button correct in sinqle-question labeled diagram.

= 2.01 =
2014-09-16
Fix highlighting of choices when no intro.
If question with only one choice, "Show the answer" button, not radio. 
Modify menu header for Safari on Mac.

= 2.00 =
2014-09-14
Position targets where click.
Error message if no questions when click menu.
Raise menu z-index (TinyMCE 4.0).
"Took n tries" feedback on labeled diagram.
Border around labels; labels bulleted.

= 1.1b05 =
2014-09-12
While editing, mark bottom border of labeled-diagram question.
Cancel fadeout of instruction if new click.
In labeled diagrams, ignore max-width of images set by WordPress.
Make WordPress consistent in use of standard box-sizing model.
Position editing menu fixed.

= 1.1b01-4 =
2014-09-07
Labeled-diagrams capability, including interactive editing.
Chrome on Mac: fallback for Flashcards; others: prevent sub/sup showing 
through.
Don't focus on textarea if first Flashcard initially displayed.

= 1.02 =
2014-08-16
Turn off debugs!

= 1.01 =
2014-08-16
Remove paragraph marks and headers that contain only [!] ... [/!] comments.  Paragraph marks that remained after comments were deleted were taking space.

qwizcards: Remove breaks after textentry.

qwizcards: Remove spacing/margins from back side.

= 1.0 =
Initial WordPress release 2014-07-31

