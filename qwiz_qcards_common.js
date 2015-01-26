// =============================================================================
// Isolate namespace.
qwiz_qcards_common = {};
var qwiz_qcards_common_f = function () {

var $ = jQuery;

var qqc = this;

var number_word;

// -----------------------------------------------------------------------------
$ (document).ready (function () {
   number_word = [qqc.T ('zero'), qqc.T ('one'), qqc.T ('two'), qqc.T ('three'), qqc.T ('four'), qqc.T ('five'), qqc.T ('six'), qqc.T ('seven'), qqc.T ('eight'), qqc.T ('nine'), qqc.T ('ten')];
});


// -----------------------------------------------------------------------------
this.process_textentry_terms = function (data) {

   terms = {singular: [], plural: []};

   // One per line, and/or semicolon-separated.
   var terms_base = data.split (/\n|;/);
   var n_terms = terms_base.length;
   for (var i=0; i<n_terms; i++) {
      var term_i_singular;
      var term_i_plural;
      var term_i = terms_base[i];

      // Ignore blank lines.
      if (term_i.search (/\S/) == -1) {
         continue;
      }
      var i_pos_slash = term_i.indexOf ('/');
      if (i_pos_slash == -1) {

         // No slash.  For plural, if ends in "y", substitute "ies";
         // if ends in "s", add "es"; otherwise, just add "s".
         term_i_singular = term_i
         var last = term_i.length - 1;
         if (term_i[last] == 'y') {
            term_i_plural = term_i.substr (0, last) + 'ies';
         } else if (term_i[i_pos_slash-1] == 's') {
            term_i_plural = term_i.substr (0, last) + 'es';
         } else {
            term_i_plural = term_i + 's';
         }
      } else {

         // Slash.  Either plural form given (after slash), or there is no
         // plural form (nothing after slash).
         term_i_singular = term_i.substr (0, i_pos_slash); 
         if (i_pos_slash == term_i.length-1) {
            term_i_plural = term_i.substr (0, i_pos_slash);
         } else {
            term_i_plural = term_i.substr (i_pos_slash+1); 
         }
      }
      terms.singular.push ([term_i_singular, metaphone (term_i_singular)]);
      terms.plural.push   ([term_i_plural,   metaphone (term_i_plural)]);
   }

   return terms;
}


// -----------------------------------------------------------------------------
this.process_inline_textentry_terms = function (htm, terms_add_terms, qdata, i_q) {

   // Allow multiple [add_terms]...[/add_terms] pairs.
   var multiple_b = terms_add_terms == 'add_terms';
   var r_local = extract_delete_shortcode_content (htm, terms_add_terms, multiple_b);
   if (r_local.content == 'NA') {
      return htm;
   }
   var terms_htm = [r_local.content];
   var anchor_re = new RegExp ('<a.*?href="([^"]*)"[\\s\\S]*?<\\/a>', 'm');

   // Extract link URLs, if there (may be multiple).
   while (true) {
      var m = terms_htm[0].match (anchor_re);
      if (! m) {
         break;
      } else {

         // Download linked-file content.
         var terms_url = m[1];
         var terms_data = qqc.get_textentry_terms (terms_url);

         // If linked file not .txt, look for [terms]...[/terms] shortcodes, get
         // content.
         if (terms_url.substr (terms_url.length - 4) != '.txt') {
            /*
            if (debug[5]) {
               console.log ('[process_inline_textentry_terms] terms_url: ', terms_url);
               console.log ('[process_inline_textentry_terms] terms_data.substr (0, 100): ', terms_data.substr (0, 100));
            }
            */
            r_remote = extract_delete_shortcode_content (terms_data, 'terms', false);
            if (r_remote.content == 'NA') {
               errmsgs.push (T ('Did not find [terms]...[/terms] shortcode pair in file') + ' ' + terms_url);
            } else {
               terms_htm.push (r_remote.content);
            }
         } else {

            // Is .txt file. If [terms] present, parse content between shortcode
            // pairs.  Otherwise, use whole thing.
            if (terms_data.indexOf ('[terms]') != -1) {
               r_remote = extract_delete_shortcode_content (terms_data, 'terms', false);
               if (r_remote.content == 'NA') {
                  errmsgs.push (T ('Did not find [terms]...[/terms] shortcode pair in file') + ' ' + terms_url);
               } else {
                  terms_htm.push (r_remote.content);
               }
            } else {
               terms_htm.push (terms_data);
            }
         }

         // Delete <a ... </a> from initial (local, not remote) terms_htm.
         terms_htm[0] = terms_htm[0].replace (anchor_re, '');
      }
   }
   terms_htm = terms_htm.join ('');

   // Replace tags and nonbreaking spaces with EOLs.
   terms_htm = terms_htm.replace (/<[^>]+>|&nbsp;/g, '\n');

   // Save for this quiz -- processed when get to first [textentry], in
   // process_textentry_terms ().
   qdata[i_q][terms_add_terms] = terms_htm;

   // Return htm with shortcodes and content/tags removed.
   return r_local.htm;
}


// -----------------------------------------------------------------------------
function extract_delete_shortcode_content (htm, shortcode, multiple_b) {

   var content = [];

   var opening_shortcode = '[' + shortcode + ']';
   var closing_shortcode = '[/' + shortcode + ']';

   while (true) {
      var opening_pos = htm.indexOf (opening_shortcode);
      if (opening_pos == -1) {
         break;
      } else {

         var closing_pos = htm.indexOf (closing_shortcode);
         if (closing_pos < opening_pos) {
            errmsgs.push (opening_shortcode + ' ' + T ('found, but not') + ' ' + closing_shortcode);
         } else {

            // Find shortcodes, including opening and closing tags.
            var terms_re = new RegExp ('(<[^\\/][^>]*>\\s*)*?\\[' + shortcode + '\\]([\\s\\S]*?)\\[\\/' + shortcode + '\\]((<\\/[^>]+>\\s*)*)', 'm');
            var m = htm.substr (opening_pos).match (terms_re);
            content.push (m[2]);

            // Delete from htm.
            htm = htm.replace (terms_re, '');
         }
      }
      if (! multiple_b) {
         break;
      }
   }
   if (content.length) {
      content = content.join ('');
   } else {
      content = 'NA';
   }

   return {'htm': htm, 'content': content};
}


// -----------------------------------------------------------------------------
// Sort and de-dupe array of terms-metaphone pairs.
this.sort_dedupe_terms_metaphones = function (terms_metaphones) {

   // Sort on terms (zeroth element of each pair).
   terms_metaphones.sort (function (a, b) {
      return a[0].toLowerCase ().localeCompare (b[0].toLowerCase ());
   });

   // De-dupe.
   var deduped_terms_metaphones = [terms_metaphones[0]];
   var len = terms_metaphones.length;
   for (var i=1; i<len; i++) {
      if (terms_metaphones[i][0] != terms_metaphones[i-1][0]) {
         deduped_terms_metaphones.push (terms_metaphones[i]);
      }
   }

   return deduped_terms_metaphones;
}


// -----------------------------------------------------------------------------
this.get_textentry_terms = function (terms_url) {

   var terms_data = '';

   // Don't do asynchronously -- question can get displayed before have terms!
   $.ajax ({
      type:       'GET',
      async:      false,
      url:        terms_url,
      dataType:   'text',
      error:      function (xhr, desc, exceptionobj) {
                     alert (qqc.T ('Could not read terms file') + ': ' + terms_url);
                  },
      success:    function (data) {
                     terms_data = data;
                  }
   });
   return terms_data;
}


// -----------------------------------------------------------------------------
this.get_attr = function (htm, attr_name) {

   var attr_value = '';

   var attr_re = new RegExp (attr_name + '\\s*?=\\s*?["\\u201C\\u201D]([^"\u201C\u201D]+)["\\u201C\\u201D]', 'm');
   var attr_match = htm.match (attr_re);
   if (attr_match) {
      attr_value = qqc.trim (attr_match[1]);
   }

   return attr_value;
}


// -----------------------------------------------------------------------------
this.replace_smart_quotes = function (string) {
   var new_string = string.replace (/[\u201C\u201D]/gm, '"');

   return new_string;
}


// -----------------------------------------------------------------------------
this.number_to_word = function (number) {
   var word;
   if (number > 9) {
      word = number;
   } else {
      word = number_word[number];
   }

   return word;
}


// -----------------------------------------------------------------------------
this.Tplural = function (word, plural_word, n) {
   var new_word;
   if (n == 1) {
      new_word = word;
   } else {
      new_word = plural_word;
   }

   return qqc.T (new_word);
}


// -----------------------------------------------------------------------------
this.T = function (string) {

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
/*
function T (string) {
   return qqc.T (string);
}
*/


// -----------------------------------------------------------------------------
this.get_qwiz_param = function (key, default_value) {

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
this.trim = function (s) {
   if ('a'.trim) {
      s = s.trim ();
   } else {
      s = s.replace (/^\s+|\s+$/g, '');
   }

   return s;
}


// -----------------------------------------------------------------------------
this.add_script = function (script_url) {
   var script = document.createElement ('script');
   script.setAttribute ('charset', 'utf-8');
   script.src = script_url;

   var head = $ ('head');
   if (head.length) {
      head.append (script);
   } else {
      $ ('body').append (script);
   }
}


// =============================================================================
// Close - isolate namespace.
};


// -----------------------------------------------------------------------------
qwiz_qcards_common_f.call (qwiz_qcards_common);

