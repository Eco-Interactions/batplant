const Encore = require('@symfony/webpack-encore');
const CircularDependencyPlugin = require('circular-dependency-plugin')
// const WorkboxPlugin = require('workbox-webpack-plugin');
 
/** ================= Create local development config ======================= */
Encore
    // the project directory where all compiled assets will be stored
    .setOutputPath('web/build/')
    // the public path used by the web server to access the previous directory
    .setPublicPath('/batplant/web/build')
    /** The prefix isn't being recognized for some reason */
    .setManifestKeyPrefix('build')
    // allow legacy applications to use $/jQuery as an app variable 
    // Note: Doesn't work if js not processed through webpack
    .autoProvidejQuery()
    // enable source maps during development
    .enableSourceMaps(!Encore.isProduction())
    // empty the outputPath dir before each build
    .cleanupOutputBeforeBuild()
    // show OS notifications when builds finish/fail /** Stopped working and I don't know why. */
    .enableBuildNotifications()
    // filenames include a hash that changes whenever the file contents change
    .enableVersioning()
    // you can use this method to provide other common global variables,
    // such as '_' for the 'underscore' library
    .autoProvideVariables({
        L: 'leaflet',
    })
    .addPlugin(
        new CircularDependencyPlugin({
            exclude: /a\.js|node_modules/,  // exclude detection of files based on a RegExp
            failOnError: false,  // add errors to webpack instead of warnings
            cwd: process.cwd(),  // set the current working directory for displaying module paths
    }))     
    // .addPlugin(
    //     new WorkboxPlugin.GenerateSW({
    //         // these options encourage the ServiceWorkers to get in there fast 
    //         // and not allow any straggling "old" SWs to hang around
    //         clientsClaim: true,
    //         skipWaiting: true,
    //         importsDirectory: 'sw/'
    // }))
    /** ------- Site Js/Style Entries ----------------- */
    .addEntry('app', './assets/js/app/oi.js' )
    .addEntry('db', './assets/js/db/db-page.js')
    .addEntry('feedback', './assets/js/misc/feedback-viewer.js')
    .createSharedEntry('libs', ['jquery', './assets/js/libs/beaverslider.js', 
        './assets/js/libs/selectize.min.js', './assets/js/libs/flatpickr.min.js',
        'leaflet' ])
; 
const local = Encore.getWebpackConfig();
// Set a unique name for the config (needed to generate assets via cli!)
local.name = 'local';
// reset Encore to build the second config
Encore.reset();

/** ======================= Create server config ============================ */
Encore
    // the project directory where all compiled assets will be stored
    .setOutputPath('web/build/')
    // the public path used by the web server to access the previous directory
    .setPublicPath('/build')
    /** The prefix isn't being recognized for some reason */
    .setManifestKeyPrefix('build')
    // allow legacy applications to use $/jQuery as an app variable 
    // Note: Doesn't work if js not processed through webpack
    .autoProvidejQuery()
    // enable source maps during development
    .enableSourceMaps(!Encore.isProduction())
    // empty the outputPath dir before each build
    .cleanupOutputBeforeBuild()
    // show OS notifications when builds finish/fail /** Stopped working and I don't know why. */
    .enableBuildNotifications()
    // filenames include a hash that changes whenever the file contents change
    .enableVersioning()
    // use this method to provide common global variables
    .autoProvideVariables({
        L: 'leaflet'
    })
    // .addPlugin(
    //     new WorkboxPlugin.GenerateSW({
    //         // these options encourage the ServiceWorkers to get in there fast 
    //         // and not allow any straggling "old" SWs to hang around
    //         clientsClaim: true,
    //         skipWaiting: true,
    //         importsDirectory: 'sw/'
    // }))
    /** ------- Site Js/Style Entries ----------------- */
    .addEntry('app', './assets/js/app/oi.js' )
    .addEntry('db', './assets/js/db/db-page.js')
    .addEntry('feedback', './assets/js/misc/feedback-viewer.js')
    .createSharedEntry('libs', ['jquery', './assets/js/libs/beaverslider.js', 
        './assets/js/libs/selectize.min.js', './assets/js/libs/flatpickr.min.js',
        'leaflet' ])
; 
const server = Encore.getWebpackConfig();
// Set a unique name for the config (needed to generate assets via cli!)
server.name = 'server';

// export the final configuration
module.exports = [server, local];

// Run [yarn run encore dev --config-name server] to generate assets for sites on server