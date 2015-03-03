(function() {
     /* Register the button. */
     tinymce.create('tinymce.plugins.qwiz_tinymce', {
          init : function(ed, url) {

               // Part of init: run qwizzled.
               run_qwizzled (ed);

               /**
               * Run-qwizzled button.
               */
               ed.addButton( 'button_q', {
                    title : 'Qwiz - labeled-diagram - enable/restart editing',
                    image : qwizzled_plugin.url + 'images/icon_qwiz.png',
                    onclick : function() {
                         qwizzled.show_main_menu (ed, true);
                    }
               });
          },
          createControl : function(n, cm) {
               return null;
          },
     });
     /* Start the buttons */
     tinymce.PluginManager.add ( 'qwizzled_button_script', tinymce.plugins.qwiz_tinymce );


     // Load qwizzled JavaScript, jquery-ui, start qwizzled.
     function run_qwizzled (ed) {
        //console.log ('qwiz_tinymce.js [run_qwizzled] qwizzled_plugin:', qwizzled_plugin);
        var scripts = '<script src="' + qwizzled_plugin.url + 'qwizzled.js"></script>'
                    + '<script src="' + qwizzled_plugin.url + 'jquery-ui.min.js"></script>';
        jQuery (scripts).appendTo ('body');

        // Closure to pass editor instance.
        function menu_start () {
           //console.log ('qwiz_tinymce.js [menu_start] ed', ed);
           qwizzled.show_main_menu (ed, false);
        }

        setTimeout (menu_start, 500);
     }
     
})();
