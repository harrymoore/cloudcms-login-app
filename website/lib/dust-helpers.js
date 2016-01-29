var util = require("./util.js");

var cloudcmsUtil = require("cloudcms-server/util/util");

var tracker = require("cloudcms-server/duster/tracker");

module.exports = function(app, dust, cb) {

    var support = require('cloudcms-server/duster/support')(dust);
    var end = support.end;

    dust.helpers.loadReportData = function (chunk, context, bodies, params) {
        return support.map(chunk, function (chunk) {
            // current request
            var req = context.get("req");
            // current user
            var user = req.user;

            var newContext = {};
            util.listUsers(req, function(err, users){
                users = users.users;
                // dust.log(JSON.stringify(users.users));
                newContext = context.push({"users": users});
                util.readProgressRelatedProducts(req, function(err, products){
                    newContext = context.push({
                        "productNames": products,
                        "users": users
                    });
                    chunk.render(bodies.block, newContext);
                    return end(chunk, context);
                });
            });
        });
    };

    dust.helpers.loadModule = function (chunk, context, bodies, params) {
        return support.map(chunk, function (chunk) {

            // current request
            var req = context.get("req");

            if (!req._module)
            {
                chunk.render(bodies.block, context);
                return end(chunk, context);
            }

            // current module
            var module = req._module;

            // WCM pages cache with respect to a "moduleId" variable
            tracker.requires(context, "moduleId", module.id);

            // add as dust context variable
            var newContext = context.push({
                "module": module
            });

            // process bodies
            chunk.render(bodies.block, newContext);
            return end(chunk, context);

        });
    };

    dust.helpers.loadProduct = function (chunk, context, bodies, params) {
        return support.map(chunk, function (chunk) {

            // current request
            var req = context.get("req");

            if (!req._product)
            {
                chunk.render(bodies.block, context);
                return end(chunk, context);
            }

            // current product
            var product = req._product;

            // WCM pages cache with respect to a "productId" variable
            tracker.requires(context, "productId", product.id);

            // add as dust context variable
            var newContext = context.push({
                "product": product
            });

            // process bodies
            chunk.render(bodies.block, newContext);
            return end(chunk, context);

        });
    };

    dust.helpers.loadSettings = function (chunk, context, bodies, params) {
        return support.map(chunk, function (chunk) {

            // current request
            var req = context.get("req");

            // current user and settings
            var user = req.user;
            var settings = req._settings; // loaded in middleware

            // if we're missing one or the other, bail...
            if (!user || !settings)
            {
                chunk.render(bodies.block, context);
                return end(chunk, context);
            }

            // WCM pages cache with respect to a "settingsId" variable
            tracker.requires(context, "settingsId", settings._doc);

            // WCM pages cache with respect to a "progressCounter" variable
            tracker.requires(context, "progressCounter", req._progressCounter);

            // add as dust context variable
            var newContext = context.push({
                "settings": settings
            });

            // process bodies
            chunk.render(bodies.block, newContext);
            return end(chunk, context);
        });
    };

    dust.helpers.loadBreadcrumb = function (chunk, context, bodies, params) {
        return support.map(chunk, function (chunk) {

            // current request
            var req = context.get("req");

            // current module
            var module = context.get("module");
            if (!module)
            {
                chunk.render(bodies.block, context);
                return end(chunk, context);
            }

            var completionFunction = function (err, parentModule) {

                if (err)
                {
                    console.log(err);
                    chunk.render(bodies.block, context);
                    return end(chunk, context);
                }

                var breadcrumb = [];

                if (parentModule)
                {
                    breadcrumb.push({
                        "title": parentModule.title, "id": parentModule.id
                    });
                }

                breadcrumb.push({
                    "title": module.title, "id": module.id
                });

                var newContext = context.push({
                    "breadcrumb": breadcrumb
                });

                // process bodies
                chunk.render(bodies.block, newContext);
                return end(chunk, context);
            };

            // load parent module?
            if (module.parentModule)
            {
                util.readModule(req, module.parentModule.id, function (err, parentModule) {
                    completionFunction(err, parentModule);
                });
            }
            else
            {
                completionFunction();
            }
        });
    };

    dust.helpers.loadQuizResults = function (chunk, context, bodies, params) {
        return support.map(chunk, function (chunk) {

            // current user settings
            var settings = context.get("settings");
            if (!settings)
            {
                chunk.render(bodies.block, context);
                return end(chunk, context);
            }

            // current product
            var product = context.get("product");
            if (!product)
            {
                chunk.render(bodies.block, context);
                return end(chunk, context);
            }

            // quiz index
            var quizIndex = context.resolve(params.index);
            if (!quizIndex)
            {
                chunk.render(bodies.block, context);
                return end(chunk, context);
            }

            var quizResults = settings.products[product.id].quizes[quizIndex];

            var newContext = context.push({
                "results": quizResults
            });

            // process bodies
            chunk.render(bodies.block, newContext);
            return end(chunk, context);
        });
    };

    dust.helpers.showTest = function(chunk, context, bodies, params ){
        var body = bodies.block;
        var skip = bodies['else'];

        var product = context.get("product");
        var settings = context.get("settings");

        var progressCounter = settings.products[product.id].progressCounter;
        var progressTotal = settings.products[product.id].progressTotal;

        if (progressCounter >= progressTotal - 1)
        {
            if(body) {
                return chunk.render( bodies.block, context );
            }
            else {
                _console.log( "Missing body block in the showTest helper!" );
                return chunk;
            }
        }
        else if (skip)
        {
            return chunk.render(bodies['else'], context);
        }

        return chunk;
    };

    return cb();
};
