// =============================================================================
// Isolate namespace.
qwiz_qcards_common = {};
var qwiz_qcards_common_f = function () {

var $ = jQuery;

var qqc = this;

var number_word;
var jjax_script_no = 0;
var head;

var debug = [];
debug.push (true);    // 0 - general.


// -----------------------------------------------------------------------------
$ (document).ready (function () {
   number_word = [qqc.T ('zero'), qqc.T ('one'), qqc.T ('two'), qqc.T ('three'), qqc.T ('four'), qqc.T ('five'), qqc.T ('six'), qqc.T ('seven'), qqc.T ('eight'), qqc.T ('nine'), qqc.T ('ten')];

   head = document.getElementsByTagName ('head')[0];
});


// -----------------------------------------------------------------------------
this.jjax = function (qname, i_qwiz, qrecord_id, user_id, dest, data) {

   // Add script to this page -- sends/receives via src=.
   // Several different script IDs, in case calls in too-quick succession.
   jjax_script_no++;
   jjax_script_no = jjax_script_no % 5;

   // Delete previous script with same ID, if there.
   var script_id = 'jjax' + jjax_script_no;
   var script = document.getElementById (script_id);
   if (script) {
      try {
         if (head) {
            head.removeChild (script);
         } else {
            document.body.removeChild (script);
         }
      } catch (e) {
         console.log ('[jjax] script_id:', script_id, ', script:', script);
      }
   }
   var script = document.createElement ('script');
   script.id = script_id;
   script.setAttribute ('charset', 'utf-8');

   // Always send qname, i_qwiz and qwiz database id.
   var send_data = '?';
   if (data) {
      send_data = '?';
      for (var property in data) {
         send_data += property + '=' + encodeURIComponent (data[property]) + '&'
      }
   }
   send_data += 'qname=' + qname + '&i_qwiz=' + i_qwiz + '&qrecord_id=' + qrecord_id;

   // Add something unique each time, so IE will re-retrieve javascript!
   dNow = new Date();
   var msec = dNow.getTime();
   send_data += '&msec=' + msec;

   // Send user id, if set.
   if (user_id) {
      send_data += '&user_id=' + user_id;
   }

   var server_dest = qqc.get_qwiz_param ('server_loc', '//localhost/qwiz/server') + '/' + dest + '.php';
   script.src = server_dest + send_data;
   if (debug[0]) {
      console.log ( '[jjax] script.src:', script.src );
   }

   if (head) {
      head.appendChild (script);
   } else {
      document.body.appendChild (script);
   }
}


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
      terms.singular.push ([term_i_singular, qqc.metaphone (term_i_singular)]);
      terms.plural.push   ([term_i_plural,   qqc.metaphone (term_i_plural)]);
   }

   return terms;
}


// -----------------------------------------------------------------------------
this.process_inline_textentry_terms = function (htm, terms_add_terms, qdata, i_q) {

   qdata.additional_errmsgs = [];

   // Allow multiple [add_terms]...[/add_terms] pairs.
   var multiple_b = terms_add_terms == 'add_terms';
   var r_local = extract_delete_shortcode_content (htm, terms_add_terms, multiple_b, qdata);
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
         var terms_data = qqc.get_textentry_terms (terms_url, qdata);
         if (terms_data) {

            // If linked file not .txt, look for [terms]...[/terms] shortcodes, get
            // content.
            if (terms_url.substr (terms_url.length - 4) != '.txt') {
               /*
               if (debug[5]) {
                  console.log ('[process_inline_textentry_terms] terms_url: ', terms_url);
                  console.log ('[process_inline_textentry_terms] terms_data.substr (0, 100): ', terms_data.substr (0, 100));
               }
               */
               r_remote = extract_delete_shortcode_content (terms_data, 'terms', false, qdata);
               if (r_remote.content == 'NA') {
                  qdata.additional_errmsgs.push (qqc.T ('Did not find [terms]...[/terms] shortcode pair in file') + ' ' + terms_url);
               } else {
                  terms_htm.push (r_remote.content);
               }
            } else {

               // Is .txt file. If [terms] present, parse content between shortcode
               // pairs.  Otherwise, use whole thing.
               if (terms_data.indexOf ('[terms]') != -1) {
                  r_remote = extract_delete_shortcode_content (terms_data, 'terms', false, qdata);
                  if (r_remote.content == 'NA') {
                     qdata.additional_errmsgs.push (qqc.T ('Did not find [terms]...[/terms] shortcode pair in file') + ' ' + terms_url);
                  } else {
                     terms_htm.push (r_remote.content);
                  }
               } else {
                  terms_htm.push (terms_data);
               }
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
function extract_delete_shortcode_content (htm, shortcode, multiple_b, qdata) {

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
            qdata.additional_errmsgs.push (opening_shortcode + ' ' + qqc.T ('found, but not') + ' ' + closing_shortcode);
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
this.get_textentry_terms = function (terms_url, qdata) {

   var error_b = false;
   var terms_data = '';

   // Don't do asynchronously -- question can get displayed before have terms!
   $.ajax ({
      type:       'GET',
      async:      false,
      url:        terms_url,
      dataType:   'text',
      error:      function (xhr, desc, exceptionobj) {
                     qdata.additional_errmsgs.push (qqc.T ('Could not read terms file') + ': ' + terms_url);
                     error_b = true;
                  },
      success:    function (data) {
                     terms_data = data;
                  }
   });
   if (! error_b) {
      if (! terms_data) {
         qdata.additional_errmsgs.push (qqc.T ('No data read from terms file') + ': ' + terms_url);
      }
   }
   return terms_data;
}


// -----------------------------------------------------------------------------
this.get_attr = function (htm, attr_name) {

   var attr_value = '';

   // get_attr () is always preceded by replace_smart_quotes (), so can just
   // handle regular quotes.
   var attr_re = new RegExp (attr_name + '\\s*=\\s*"([^"]+)"', 'm');
   var attr_match = htm.match (attr_re);
   if (attr_match) {
      attr_value = qqc.trim (attr_match[1]);
   }

   return attr_value;
}


// -----------------------------------------------------------------------------
this.replace_smart_quotes = function (string) {
   var new_string = string.replace (/[\u201C\u201D\u2033]/gm, '"');

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


// -----------------------------------------------------------------------------
this.metaphone = function (word, max_phonemes) {
  //  discuss at: http://phpjs.org/functions/metaphone/
  // original by: Greg Frazier
  // improved by: Brett Zamir (http://brett-zamir.me)
  // improved by: Rafal Kukawski (http://kukawski.pl)
  //   example 1: metaphone('Gnu');
  //   returns 1: 'N'
  //   example 2: metaphone('bigger');
  //   returns 2: 'BKR'
  //   example 3: metaphone('accuracy');
  //   returns 3: 'AKKRS'
  //   example 4: metaphone('batch batcher');
  //   returns 4: 'BXBXR'

  var type = typeof word;

  if (type === 'undefined' || type === 'object' && word !== null) {
    return null; // weird!
  }

  // infinity and NaN values are treated as strings
  if (type === 'number') {
    if (isNaN(word)) {
      word = 'NAN';
    } else if (!isFinite(word)) {
      word = 'INF';
    }
  }

  if (max_phonemes < 0) {
    return false;
  }

  max_phonemes = Math.floor(+max_phonemes) || 0;

  // alpha depends on locale, so this var might need an update
  // or should be turned into a regex
  // for now assuming pure a-z
  var alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    vowel = 'AEIOU',
    soft = 'EIY',
    leadingNonAlpha = new RegExp('^[^' + alpha + ']+');

  word = typeof word === 'string' ? word : '';
  word = word.toUpperCase()
    .replace(leadingNonAlpha, '');

  if (!word) {
    return '';
  }

  var is = function(p, c) {
    return c !== '' && p.indexOf(c) !== -1;
  };

  var i = 0,
    cc = word.charAt(0), // current char. Short name, because it's used all over the function
    nc = word.charAt(1), // next char
    nnc, // after next char
    pc, // previous char
    l = word.length,
    meta = '',
    // traditional is an internal param that could be exposed
    // for now let it be a local var
    traditional = true;

  switch (cc) {
    case 'A':
      meta += nc === 'E' ? nc : cc;
      i += 1;
      break;
    case 'G':
    case 'K':
    case 'P':
      if (nc === 'N') {
        meta += nc;
        i += 2;
      }
      break;
    case 'W':
      if (nc === 'R') {
        meta += nc;
        i += 2;
      } else if (nc === 'H' || is(vowel, nc)) {
        meta += 'W';
        i += 2;
      }
      break;
    case 'X':
      meta += 'S';
      i += 1;
      break;
    case 'E':
    case 'I':
    case 'O':
    case 'U':
      meta += cc;
      i++;
      break;
  }

  for (; i < l && (max_phonemes === 0 || meta.length < max_phonemes); i += 1) {
    cc = word.charAt(i);
    nc = word.charAt(i + 1);
    pc = word.charAt(i - 1);
    nnc = word.charAt(i + 2);

    if (cc === pc && cc !== 'C') {
      continue;
    }

    switch (cc) {
      case 'B':
        if (pc !== 'M') {
          meta += cc;
        }
        break;
      case 'C':
        if (is(soft, nc)) {
          if (nc === 'I' && nnc === 'A') {
            meta += 'X';
          } else if (pc !== 'S') {
            meta += 'S';
          }
        } else if (nc === 'H') {
          meta += !traditional && (nnc === 'R' || pc === 'S') ? 'K' : 'X';
          i += 1;
        } else {
          meta += 'K';
        }
        break;
      case 'D':
        if (nc === 'G' && is(soft, nnc)) {
          meta += 'J';
          i += 1;
        } else {
          meta += 'T';
        }
        break;
      case 'G':
        if (nc === 'H') {
          if (!(is('BDH', word.charAt(i - 3)) || word.charAt(i - 4) === 'H')) {
            meta += 'F';
            i += 1;
          }
        } else if (nc === 'N') {
          if (is(alpha, nnc) && word.substr(i + 1, 3) !== 'NED') {
            meta += 'K';
          }
        } else if (is(soft, nc) && pc !== 'G') {
          meta += 'J';
        } else {
          meta += 'K';
        }
        break;
      case 'H':
        if (is(vowel, nc) && !is('CGPST', pc)) {
          meta += cc;
        }
        break;
      case 'K':
        if (pc !== 'C') {
          meta += 'K';
        }
        break;
      case 'P':
        meta += nc === 'H' ? 'F' : cc;
        break;
      case 'Q':
        meta += 'K';
        break;
      case 'S':
        if (nc === 'I' && is('AO', nnc)) {
          meta += 'X';
        } else if (nc === 'H') {
          meta += 'X';
          i += 1;
        } else if (!traditional && word.substr(i + 1, 3) === 'CHW') {
          meta += 'X';
          i += 2;
        } else {
          meta += 'S';
        }
        break;
      case 'T':
        if (nc === 'I' && is('AO', nnc)) {
          meta += 'X';
        } else if (nc === 'H') {
          meta += '0';
          i += 1;
        } else if (word.substr(i + 1, 2) !== 'CH') {
          meta += 'T';
        }
        break;
      case 'V':
        meta += 'F';
        break;
      case 'W':
      case 'Y':
        if (is(vowel, nc)) {
          meta += cc;
        }
        break;
      case 'X':
        meta += 'KS';
        break;
      case 'Z':
        meta += 'S';
        break;
      case 'F':
      case 'J':
      case 'L':
      case 'M':
      case 'N':
      case 'R':
        meta += cc;
        break;
    }
  }

  return meta;

  /*
  "    abc", "ABK", // skip leading whitespace
  "1234.678!@abc", "ABK", // skip leading non-alpha chars
  "aero", "ER", // leading 'a' followed by 'e' turns into 'e'
  "air", "AR", // leading 'a' turns into 'e', other vowels ignored
  // leading vowels added to result
  "egg", "EK",
  "if", "IF",
  "of", "OF",
  "use", "US",
  // other vowels ignored
  "xAEIOU", "S",
  // GN, KN, PN become 'N'
  "gnome", "NM",
  "knight", "NFT",
  "pneumatic", "NMTK",
  // leading 'WR' becomes 'R'
  "wrong", "RNK",
  // leading 'WH+vowel" becomes 'W'
  "wheel", "WL",
  // leading 'X' becomes 'S', 'KS' otherwise
  "xerox", "SRKS",
  "exchange", "EKSXNJ",
  // duplicate chars, except 'C' are ignored
  "accuracy", "AKKRS",
  "blogger", "BLKR",
  "fffound", "FNT",
  // ignore 'B' if after 'M'
  "billboard", "BLBRT",
  "symbol", "SML",
  // 'CIA' -> 'X'
  "special", "SPXL",
  // 'SC[IEY]' -> 'C' ignored
  "science", "SNS",
  // '[^S]C' -> 'C' becomes 'S'
  "dance", "TNS",
  // 'CH' -> 'X'
  "change", "XNJ",
  "school", "SXL",
  // 'C' -> 'K'
  "micro", "MKR",
  // 'DGE', 'DGI', DGY' -> 'J'
  // 'T' otherwise
  "bridge", "BRJ",
  "pidgin", "PJN",
  "edgy", "EJ",
  "handgun", "HNTKN",
  "draw", "TR",
  //'GN\b' 'GNED' -> ignore 'G'
  "sign", "SN",
  "signed", "SNT",
  "signs", "SKNS",
  // [^G]G[EIY] -> 'J'...
  "agency", "AJNS",
  // 'GH' -> 'F' if not b--gh, d--gh, h--gh
  "night", "NFT",
  "bright", "BRT",
  "height", "HT",
  "midnight", "MTNT",
  // 'K' otherwise
  "jogger", "JKR",
  // '[^CGPST]H[AEIOU]' -> 'H', ignore otherwise
  "horse", "HRS",
  "adhere", "ATHR",
  "mahjong", "MJNK",
  "fight", "FFT", // interesting
  "ghost", "FST",
  // 'K' -> 'K' if not after 'C'
  "ski", "SK",
  "brick", "BRK",
  // 'PH' -> 'F'
  "phrase", "FRS",
  // 'P.' -> 'P'
  "hypnotic", "PNTK",
  "topnotch", "TPNX",
  // 'Q' -> 'K'
  "quit", "KT",
  "squid", "SKT",
  // 'SIO', 'SIA', 'SH' -> 'X'
  "version", "FRXN",
  "silesia", "SLX",
  "enthusiasm", "EN0XSM",
  "shell", "XL",
  // 'S' -> 'S' in other cases
  "spy", "SP",
  "system", "SSTM",
  // 'TIO', 'TIA' -> 'X'
  "ratio", "RX",
  "nation", "NXN",
  "spatial", "SPXL",
  // 'TH' -> '0'
  "the", "0",
  "nth", "N0",
  "truth", "TR0",
  // 'TCH' -> ignore 'T'
  "watch", "WX",
  // 'T' otherwise
  "vote", "FT",
  "tweet", "TWT",
  // 'V' -> 'F'
  "evolve", "EFLF",
  // 'W' -> 'W' if followed by vowel
  "rewrite", "RRT",
  "outwrite", "OTRT",
  "artwork", "ARTWRK",
  // 'X' -> 'KS' if not first char
  "excel", "EKSSL",
  // 'Y' -> 'Y' if followed by vowel
  "cyan", "SYN",
  "way", "W",
  "hybrid", "BRT",
  // 'Z' -> 'S'
  "zip", "SP",
  "zoom", "SM",
  "jazz", "JS",
  "zigzag", "SKSK",
  "abc abc", "ABKBK" // eventhough there are two words, second 'a' is ignored
  */
}


// =============================================================================
// Close - isolate namespace.
};


// -----------------------------------------------------------------------------
qwiz_qcards_common_f.call (qwiz_qcards_common);


// =============================================================================
/*!
 * jQuery Cookie Plugin v1.4.1
 * https://github.com/carhartl/jquery-cookie
 *
 * Copyright 2013 Klaus Hartl
 * Released under the MIT license
 */
(function (factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD
		define(['jquery'], factory);
	} else if (typeof exports === 'object') {
		// CommonJS
		factory(require('jquery'));
	} else {
		// Browser globals
		factory(jQuery);
	}
}(function ($) {

	var pluses = /\+/g;

	function encode(s) {
		return config.raw ? s : encodeURIComponent(s);
	}

	function decode(s) {
		return config.raw ? s : decodeURIComponent(s);
	}

	function stringifyCookieValue(value) {
		return encode(config.json ? JSON.stringify(value) : String(value));
	}

	function parseCookieValue(s) {
		if (s.indexOf('"') === 0) {
			// This is a quoted cookie as according to RFC2068, unescape...
			s = s.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\');
		}

		try {
			// Replace server-side written pluses with spaces.
			// If we can't decode the cookie, ignore it, it's unusable.
			// If we can't parse the cookie, ignore it, it's unusable.
			s = decodeURIComponent(s.replace(pluses, ' '));
			return config.json ? JSON.parse(s) : s;
		} catch(e) {}
	}

	function read(s, converter) {
		var value = config.raw ? s : parseCookieValue(s);
		return $.isFunction(converter) ? converter(value) : value;
	}

	var config = $.cookie = function (key, value, options) {

		// Write

		if (value !== undefined && !$.isFunction(value)) {
			options = $.extend({}, config.defaults, options);

			if (typeof options.expires === 'number') {
				var days = options.expires, t = options.expires = new Date();
				t.setTime(+t + days * 864e+5);
			}

			return (document.cookie = [
				encode(key), '=', stringifyCookieValue(value),
				options.expires ? '; expires=' + options.expires.toUTCString() : '', // use expires attribute, max-age is not supported by IE
				options.path    ? '; path=' + options.path : '',
				options.domain  ? '; domain=' + options.domain : '',
				options.secure  ? '; secure' : ''
			].join(''));
		}

		// Read

		var result = key ? undefined : {};

		// To prevent the for loop in the first place assign an empty array
		// in case there are no cookies at all. Also prevents odd result when
		// calling $.cookie().
		var cookies = document.cookie ? document.cookie.split('; ') : [];

		for (var i = 0, l = cookies.length; i < l; i++) {
			var parts = cookies[i].split('=');
			var name = decode(parts.shift());
			var cookie = parts.join('=');

			if (key && key === name) {
				// If second argument (value) is a function it's a converter...
				result = read(cookie, value);
				break;
			}

			// Prevent storing a cookie that we couldn't decode.
			if (!key && (cookie = read(cookie)) !== undefined) {
				result[name] = cookie;
			}
		}

		return result;
	};

	config.defaults = {};

	$.removeCookie = function (key, options) {
		if ($.cookie(key) === undefined) {
			return false;
		}

		// Must not alter options, thus extending a fresh object...
		$.cookie(key, '', $.extend({}, options, { expires: -1 }));
		return !$.cookie(key);
	};

}));

