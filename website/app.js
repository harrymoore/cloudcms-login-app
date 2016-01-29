var server = require("cloudcms-server/server");

var customRoutes = require("./routes/routes.js");
server.routes(customRoutes);

/**
 * This gets displayed once the server starts up.
 */
server.report(function(callback) {

    var cpuCount = require('os').cpus().length;

    // provide some debug info
    console.log("");
    console.log("Moen Training App Started Up");
    console.log("");
    console.log("Node Version: " + process.version);
    console.log("Server Version: " + process.env.CLOUDCMS_APPSERVER_PACKAGE_VERSION);
    console.log("Server Mode: " + process.env.CLOUDCMS_APPSERVER_MODE);
    console.log("Server Base Path: " + process.env.CLOUDCMS_APPSERVER_BASE_PATH);
    console.log("Gitana Scheme: " + process.env.GITANA_PROXY_SCHEME);
    console.log("Gitana Host: " + process.env.GITANA_PROXY_HOST);
    console.log("Gitana Port: " + process.env.GITANA_PROXY_PORT);
    console.log("Temp Directory: " + process.env.CLOUDCMS_TEMPDIR_PATH);
    console.log("CPU Count: " + cpuCount);
    console.log("Store Configuration: " + process.env.CLOUDCMS_STORE_CONFIGURATION);
    console.log("Broadcast Provider: " + process.env.CLOUDCMS_BROADCAST_TYPE);
    console.log("Cache Provider: " + process.env.CLOUDCMS_CACHE_TYPE);
    console.log("LaunchPad Mode: " + process.env.CLOUDCMS_LAUNCHPAD_SETUP);
    console.log("Server mode: " + (process.env.NODE_ENV ? process.env.NODE_ENV : "development"));
    console.log("");
    console.log("Web Server: http://localhost:" + process.env.PORT);
    console.log("");

    callback();
});

/**
 * Start the Server
 */
server.start({
    "setup": "single",
    "welcome": {
        "enabled": true,
        "file": "test.html"
    },
    "wcm": {
        "enabled": true,
        "cache": true
    },
    "serverTags": {
        "enabled": true
    },
    "autoRefresh": {
        "log": true
    },
    "session": {
        "enabled": true,
        "type": "file"
    },
    "auth": {
        "enabled": true//,
        // "providers": {
        //     "cas": {
        //         "enabled": true,
        //         "successRedirect": "/index.html",
        //         "failureRedirect": "/error.html",
        //         "ssoBaseURL": "http://www.example.com/",
        //         "serverBaseURL": "http://localhost:3000",
        //         "callbackURL": "/auth/cas/callback",
        //         "passTicket": true,
        //         "passToken": true,
        //         "autoRegister": true
        //     },
            // "google": {
            //     "enabled": true,
            //     "successRedirect": "/index.html",
            //     "failureRedirect": "/error.html",
            //     "clientID": "520954640638-n9q6c2ap1d61foa02ne0105es6rini3n.apps.googleusercontent.com",
            //     "clientSecret": "Ts_XcQFB-aX6h1Ot51lnAHK6",
            //     "callbackURL": "/auth/google/callback",
            //     "passTicket": true,
            //     "passToken": true,
            //     "autoRegister": true
            // },
            // "github": {
            //     "enabled": true,
            //     "successRedirect": "/index.html",
            //     "failureRedirect": "/error.html",
            //     "callbackUrl": "/auth/github/callback",
            //     "clientID": "7efe9b468c79c0366229",
            //     "clientSecret": "616d9e926c9310bf9ff7fc0c9b7bfc0c31d6e232",
            //     "passTicket": false,
            //     "passToken": true,
            //     "autoRegister": true
            // },
        //     "facebook": {
        //         "enabled": true,
        //         "successRedirect": "/index.html",
        //         "failureRedirect": "/error.html",
        //         "callbackUrl": "/auth/facebook/callback",
        //         "appId": "19554140894",
        //         "appSecret": "cd273345f845a7e6b5451eb5d81d3d7d",
        //         "passTicket": false,
        //         "passToken": true,
        //         "autoRegister": true
        //     }
        // }
    }
});

// touch
