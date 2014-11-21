<?php
// This file is based on wp-includes/js/tinymce/langs/wp-langs.php

//error_log ("[qwizzled_langs.php]");

if ( ! defined ('ABSPATH') ) {
    error_log ("[qwizzled_langs.php] ABSPATH not defined");
    exit;
}

if (! class_exists ('_WP_Editors'))
    require(ABSPATH . WPINC . '/class-wp-editor.php');

function qwizzled_translation () {

    // Set qwiz_T as array of strings.
    $qwiz_T = array ();
    include "strings_to_translate.php";

    //$locale = _WP_Editors::$mce_locale;
    //$translated = 'tinyMCE.addI18n ("' . $locale . '.qwiz", ' . json_encode( $strings ) . ");\n";
    $translated = 'tinyMCE.addI18n ("qwiz", ' . json_encode ($qwiz_T) . ");\n";

    return $translated;
}

$strings = qwizzled_translation ();
