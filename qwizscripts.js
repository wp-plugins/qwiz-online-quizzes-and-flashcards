// UNUSED CURRENTLY.  UNWRAP OF DIVS IN QWIZ.JS / QWIZCARDS.JS.
// Once page has loaded, look for completion of both qwiz.js and qwizcards.js,
// then turn on content display.
// -----------------------------------------------------------------------------
jQuery (document).ready (function () {

   var n_tries = 0;
   display_content = function () {
      var ok_b = false;
      if (typeof (qwiz_) != 'undefined' && typeof (qcard_) != 'undefined') {
         //console.log ('qwiz_, qcard_ .processing_complete_b:', qwiz_.processing_complete_b, qcard_.processing_complete_b);
         if ((qwiz_.processing_complete_b && qcard_.processing_complete_b)
                                                              || n_tries > 30) {
              
            jQuery ('div.qwiz_hide_shortcodes_wrapper').removeClass ('qwiz_shortcodes_hidden');
            ok_b = true;
         }
      }

      // Do every 10th of a second until success.
      if (! ok_b) {
         setTimeout (display_content, 100);
         n_tries++;
      }
   }

   display_content ();

});
