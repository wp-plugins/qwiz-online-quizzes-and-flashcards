<?php
   // Included in qwiz-online-quizzes-wp-plugin.php
   // and languages/qwizzled_langs.php.
   $q = 'qwiz';
   $qwiz_T = array (
      /* Translators: 
        The first set of strings are seen by users.
        The second set is seen only by quiz creators when they 
        create and edit labeled diagrams in the WordPress editor.
        The last set is error messages not normally seen by
        users.
       */
      'zero' => __ ('zero', $q),
      'one' => __ ('one', $q),
      'two' => __ ('two', $q),
      'three' => __ ('three', $q),
      'four' => __ ('four', $q),
      'five' => __ ('five', $q),
      'six' => __ ('six', $q),
      'seven' => __ ('seven', $q),
      'eight' => __ ('eight', $q),
      'nine' => __ ('nine', $q),
      'ten' => __ ('ten', $q),

      /* Translators: as in "All questions..." */
      'All' => __ ('All', $q),

      'answer' => __ ('answer', $q),
      'answers' => __ ('answers', $q),

      /* Translators: as in "Both questions..." */
      'Both' => __ ('Both', $q),

      'card' => __ ('card', $q),
      'cards' => __ ('cards', $q),

      /* Translators: as in "there are three cards in total" */
      'cards total' => __ ('cards total', $q),

      'Congratulations, you answered all questions correctly' => __ ('Congratulations, you answered all questions correctly', $q),
      'Flip' => __ ('Flip', $q),

      /* Translators: as in "For topic Biology..." */
      'For topic' => __ ('For topic', $q),

      'Got it!' => __ ('Got it!', $q),

      /* Translators: as in "In this five-flashcard stack..." */
      'In this %s-flashcard stack, you marked every card "got it" on the first try' => __ ('In this %s-flashcard stack, you marked every card "got it" on the first try', $q),

      'It took you one try' => __ ('It took you one try', $q),
      'It took you one try' => __ ('It took you one try', $q),
      'It took you %s tries' => __ ('It took you %s tries', $q),
      'item' => __ ('item', $q),
      'items' => __ ('items', $q),
      'Learn mode: questions repeat until answered correctly' => __ ('Learn mode: questions repeat until answered correctly', $q),
      'Move each item to its correct <span class="qwizzled_target_border">place</span>' => __ ('Move each item to its correct <span class="qwizzled_target_border">place</span>', $q),
      'Need more practice' => __ ('Need more practice', $q),

      /* Translators: as in "Click here to go to the next question" */
      'Next question' => __ ('Next question', $q),

      'on the first try' => __ ('on the first try', $q),

      /* Translators: as in "three out of four" */
      'out of' => __ ('out of', $q),

      'Put this card at the bottom of stack, show the next card' => __ ('Put this card at the bottom of stack, show the next card', $q),
      'question' => __ ('question', $q),
      'questions' => __ ('questions', $q),
      'Randomly shuffle the remaining cards' => __ ('Randomly shuffle the remaining cards', $q),
      'Remove this card from the stack' => __ ('Remove this card from the stack', $q),

      /* Translators: as in "three cards have been reviewed" */
      'reviewed' => __ ('reviewed', $q),

      'response' => __ ('response', $q),
      'responses' => __ ('responses', $q),
      'Review this flashcard stack again' => __ ('Review this flashcard stack again', $q),
      'Show the other side' => __ ('Show the other side', $q),

      /* Translators: as in "Shuffle the deck of cards" */
      'Shuffle' => __ ('Shuffle', $q),

      /* Translators: as in "Click here to start quiz" */
      'Start quiz' => __ ('Start quiz', $q),

      'Start reviewing cards' => __ ('Start reviewing cards', $q),
      'Take the quiz again' => __ ('Take the quiz again', $q),
      'Test mode: incorrectly-answered questions do not repeat' => __ ('Test mode: incorrectly-answered questions do not repeat', $q),
      'There was' => __ ('There was', $q),
      'There were' => __ ('There were', $q),
      'This flashcard stack had %s cards.  It took you %s tries until you felt comfortable enough to to mark "got it" for each card' => __ ('This flashcard stack had %s cards.  It took you %s tries until you felt comfortable enough to to mark "got it" for each card', $q),
      'to answer this question correctly' => __ ('to answer this question correctly', $q),
      'to answer these questions correctly' => __ ('to answer these questions correctly', $q),

      /* Translators: as in "there are three cards to go" */
      'to go' => __ ('to go', $q),

      'View summary report' => __ ('View summary report', $q),
      'You answered all of these questions correctly' => __ ('You answered all of these questions correctly', $q),
      'You answered both of these questions correctly' => __ ('You answered both of these questions correctly', $q),
      'You answered this question correctly' => __ ('You answered this question correctly', $q),
      'Your score is' => __ ('Your score is', $q),
      'Your score is %s correct out of %s' => __ ('Your score is %s correct out of %s', $q),

      /* Translators:
        The following strings are the second set.
        These are part of the labeled diagram editing function
        that is only seen by quiz creators.  */
      '' => __ ('', $q),
      'Create a target "drop zone" for a label - click here, then click label' => __ ('Create a target "drop zone" for a label - click here, then click label', $q),
      'Could not find editing window.  You need to be editing a page or post in Visual mode.' => __ ('Could not find editing window.  You need to be editing a page or post in Visual mode.', $q),
      'Did not find [qwiz]...[/qwiz] shortcodes' => __ ('Did not find [qwiz]...[/qwiz] shortcodes', $q),
      'End of labeled-diagram question' => __ ('End of labeled-diagram question', $q),
      'Error: no text selected' => __ ('Error: no text selected', $q),
      'labeled diagram editing menu' => __ ('labeled diagram editing menu', $q),
      'Please select "Visual" mode to create a target/drop zone' => __ ('Please select "Visual" mode to create a target/drop zone', $q),
      'Select the text or click on the image (you may have to click twice) where you want the target "drop zone" for this label' => __ ('Select the text or click on the image (you may have to click twice) where you want the target "drop zone" for this label', $q),
      'You can position and resize the target "drop zone" how you want in relation to the image' => __ ('You can position and resize the target "drop zone" how you want in relation to the image', $q),

      /* Translators: The remaining strings are error messages - not normally
         seen by the user -- only by the quiz/flashcard creator.  */
      'Did not find answer ("[a]") -- card back -- for' => __ ('Did not find answer ("[a]") -- card back -- for', $q),
      'Did not find choices ("[c]") for' => __ ('Did not find choices ("[c]") for', $q),
      'Did not find choices ("[c]") or labels ("[l]") for' => __ ('Did not find choices ("[c]") or labels ("[l]") for', $q),
      'Did not find end of image area.  Please check that all labels and target "drop zones" were correctly processed and saved during the edit of this page' => __ ('Did not find end of image area.  Please check that all labels and target "drop zones" were correctly processed and saved during the edit of this page', $q),
      'Did not find feedback ("[f]") for' => __ ('Did not find feedback ("[f]") for', $q),
      'Did not find question tags ("[q]") for' => __ ('Did not find question tags ("[q]") for', $q),
      'Did not find target "drop-zones" for labels.  Please check that all labels and target "drop zones" were correctly processed and saved during the edit of this page' => __ ('Did not find target "drop-zones" for labels.  Please check that all labels and target "drop zones" were correctly processed and saved during the edit of this page', $q),
      'Did not find topic within double quotes for' => __ ('Did not find topic within double quotes for', $q),
      'does not match number of labels' => __ ('does not match number of labels', $q),
      'Error found' => __ ('Error found', $q),
      'Errors found' => __ ('Errors found', $q),
      '(exit text) must be last' => __ ('(exit text) must be last', $q),
      'Got more than one card back ("[a]") for' => __ ('Got more than one card back ("[a]") for', $q),
      'More than one choice was marked correct' => __ ('More than one choice was marked correct', $q),
      'No choice was marked correct' => __ ('No choice was marked correct', $q),
      'Number of feedback items does not match number of choices' => __ ('Number of feedback items does not match number of choices', $q),
      'Number of feedback items' => __ ('Number of feedback items', $q),
      'Text before header' => __ ('Text before header', $q),
      'Text before intro' => __ ('Text before intro', $q),
      '[textentry] on back of card, but not on front' => __ ('[textentry] on back of card, but not on front', $q),
      'Topic(s) were given for at least one question, but at least one question doesn\'t have a topic' => __ ('Topic(s) were given for at least one question, but at least one question doesn\'t have a topic', $q),
      'Unmatched [qdeck] - [/qdeck] pairs' => __ ('Unmatched [qdeck] - [/qdeck] pairs', $q),
      'Unmatched [qwiz] - [/qwiz] pairs' => __ ('Unmatched [qwiz] - [/qwiz] pairs', $q)
   );
?>

