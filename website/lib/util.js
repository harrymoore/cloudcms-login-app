module.exports = function() {

    var r = {};
    var async = require('async');

    r.getUserId = function(req) {
        var id = null;

        if (req.user) {
            id = req.user.id;
        }

        return id;
    };

    /**
     * List users in the domain.
     *
     * @param req
     * @param callback
     */
    r.listUsers = function(req, callback) {
        var reportData = [];
        var userIds = [];

        req.gitana.getPlatform().readDomain(req.user.domainId).then(function() {
            var domain = this;

            this.listUsers({
                "limit": 1000
            }).each(function() {
                var user = JSON.parse(JSON.stringify(this));
                // console.log("user " + JSON.stringify(user));
                if(!user.name.indexOf("appuser-") == 0)
                {
                    reportData.push(user);
                    userIds.push(user._doc);
                }
            }).then(function(){
                req.gitana.application().querySettings({
                    "key": {
                        "$in": userIds
                    }
                },{
                    "limit": 1000
                }).then(function(){
                    var settings = this;
                    settings = JSON.parse(JSON.stringify(settings));
                    // console.log("***settings " + JSON.stringify(settings));

                    var data = reportData.map(function(user){
                        var thisUser = user;

                        thisUser.settings = {};
                        for(var objKey in settings)
                        {
                            if(settings[objKey].key == thisUser._doc)
                            {
                                thisUser.settings = JSON.parse(JSON.stringify(settings[objKey]));
                            }
                        }
                        return thisUser;
                    });
                    // console.log("***data " + JSON.stringify(data));
                    callback(null, { "users": data });
                });
            });
        });
    };

    r.readProgressRelatedProducts = function(req, callback) {
        var progressProducts = {};
        req.cache.read("progressProducts", function(err, cachedProgressProducts) {
            if(cachedProgressProducts)
            {
                // console.log("found cachedProgressProducts in cache: " + JSON.stringify(cachedProgressProducts));
                callback(null, cachedProgressProducts);
                return;
            }

            req.branch(function(err, branch) {
                branch.trap(function(err) {
                    callback(err);
                    return false;
                }).queryNodes({
                    "_type": "dennison:product",
                    "active": true
                }).each(function() {
                    var product = this;
                    progressProducts[product.id] = product.title;
                }).then(function() {
                    // console.log("progressProducts " + JSON.stringify(progressProducts));
                    req.cache.write("progressProducts", progressProducts, 60 * 15 /* cache for 15 minutes */, function() {
                        callback(null, progressProducts);
                    });
                });
            });
        });
    };

    /**
     * Either finds or creates the settings for a given user.
     * Uses local caching for performance.
     *
     * @param req
     * @param userId
     * @param callback
     */
    var findOrCreateUserSettings = r.findOrCreateUserSettings = function(req, userId, callback) {

        // SETTINGS CACHE: READ
        req.cache.read("settings-" + userId, function(err, settings) {

            if (settings)
            {
                return callback(null, settings);
            }

            var createSettings = function(done) {

                req.gitana.application().createSettings({
                    "scope": "user",
                    "key": userId
                }).then(function() {

                    // SETTINGS CACHE: WRITE
                    req.cache.write("settings-" + userId, this);
                    done(null, this);
                });
            };

            var findSettings = function(done) {

                req.gitana.application().querySettings({
                    "scope": "user",
                    "key": userId
                }).count(function(c) {
                    if (c > 0) {
                        this.keepOne().then(function () {
                            done(null, this);
                        });
                    } else {
                        done();
                    }
                });
            };

            findSettings(function(err, settings) {

                if (err) {
                    return callback(err);
                }

                if (!settings) {
                    createSettings(function(err, settings) {
                        callback(err, settings);
                    });
                    return;
                }

                callback(null, settings);
            });
        });
    };

    /**
     * Deletes the settings for a user.
     * Invalidates local cache.
     *
     * @param req
     * @param userId
     * @param callback
     */
    r.deleteUserSettings = function(req, userId, callback) {

        // SETTINGS CACHE: REMOVE
        req.cache.remove("settings-" + userId);

        // delete the settings
        req.gitana.application().trap(function(error) {
            // doesn't exist, no big deal
            callback();
            return false;
        }).querySettings({
            "scope": "user",
            "key": userId
        }, {
            "limit": -1
        }).each(function() {
            this.del();
        }).then(function() {
            callback();
        });
    };

    /**
     * Deletes all settings.
     * Invalidates local cache.
     *
     * @param req
     * @param callback
     */
    r.deleteAllUserSettings = function(req, callback) {

        /*
        // remove all cached settings
        req.cache.keys(function(err, keys) {
            for (var i = 0; i < keys.length; i++)
            {
                var key = keys[i];

                if (key.indexOf("settings-") === 0)
                {
                    //req.cache.remove(key);
                    console.log("Found cache key: " + key);
                }
            }
        });
        */
        req.cache.invalidate("settings-");

        // delete all settings from Cloud CMS
        req.gitana.application().trap(function(error) {
            // doesn't exist, no big deal
            callback();
            return false;
        }).querySettings({
            "scope": "user"
        }, {
            "limit": -1
        }).each(function() {
            console.log("Deleting settings: " + this.key);
            this.del();
        }).then(function() {
            callback();
        });
    };

    /**
     * Updates the settings for a user.
     * Writes to local cache for performance.
     *
     * @param settings
     * @param callback
     */
    r.updateSettings = function(req, settings, userId, callback) {

        // SETTINGS CACHE: WRITE
        if (req)
        {
            req.cache.write("settings-" + userId, settings);
        }

        settings.update().then(function() {
            callback(null, this);
        });
    };

    /**
     * Reads a product for a given ID.  Anything read through this method is cached on the request
     * for performance purposes.
     *
     * @param req
     * @param productId
     * @param callback
     */
    r.readProduct = function(req, productId, callback) {

        // check local cache
        req.cache.read("product-" + productId, function(err, product) {

            if (product) {
                return callback(null, product);
            }

            req.branch(function(err, branch) {
                branch.trap(function(err) {
                    callback(err);
                    return false;
                }).queryNodes({
                    "$or": [{
                        "_type": "dennison:product",
                        "id": productId
                    },{
                        "_type": "dennison:product",
                        "_doc": productId
                    }]
                }).keepOne().then(function() {

                    var product = this;

                    // write to cache
                    req.cache.write("product-" + productId, product, function() {
                        callback(null, product);
                    });
                });
            });

        });
    };

    /**
     * Reads a module for a given ID.  Anything read through this method is cached on the request
     * for performance purposes.
     *
     * @param req
     * @param moduleId
     * @param callback
     */
    r.readModule = function(req, moduleId, callback) {

        req.cache.read("module-" + moduleId, function(err, module) {

            if (module) {
                return callback(null, module);
            }

            req.branch(function(err, branch) {
                branch.trap(function(err) {
                    callback(err);
                    return false;
                }).queryNodes({
                    "$or": [{
                        "_type": "dennison:module",
                        "id": moduleId
                    },{
                        "_type": "dennison:module",
                        "_doc": moduleId
                    }]
                }).keepOne().then(function() {

                    var module = this;

                    // write to cache
                    req.cache.write("module-" + moduleId, module, function() {
                        callback(null, module);
                    });

                });
            });

        });
    };


    /**
     * Provides an initialization hook so that the server can pre-load all products on server startup.
     *
     * @param callback
     */
    r.init = function(app, callback)
    {
        console.log("Initializing...");

        var gitanaConfig = require("../gitana.json");
        var applicationId = gitanaConfig.application;

        var reqCache = app.cache.createNamespacedCache.call(app.cache, applicationId);

        Gitana.connect(gitanaConfig, function(err) {

            // preload all products
            this.datastore("content").readBranch("master").then(function() {

                var branch = this;

                // stores module _doc -> module instance
                var moduleMap = {};

                // preload modules
                Chain(branch).queryNodes({
                    "_type": "dennison:module"
                }).each(function() {

                    var module = this;
                    moduleMap[module._doc] = module;

                    // write to cache
                    reqCache.write("module-" + module.id, module);

                }).then(function() {

                    // stores product _doc -> product instance
                    var productMap = {};

                    // preload products
                    Chain(branch).queryNodes({
                        "_type": "dennison:product"
                    }).each(function() {

                        var product = this;
                        productMap[product._doc] = product;

                        // write to cache
                        reqCache.write("product-" + product.id, product);

                    }).then(function() {
                        calculateTotalProgress(reqCache, moduleMap, productMap, function() {

                            for (var k in productMap)
                            {
                                console.log(" -> Preloaded product: " + productMap[k].id);
                            }

                            for (var k in moduleMap)
                            {
                                console.log(" -> Preloaded module: " + moduleMap[k].id);
                            }

                            callback();
                        })
                    })

                });
            });
        });
    };

    /**
     * Calculates the total progress bars for all modules, products and also the top most level.
     *
     * @param reqCache
     * @param moduleMap
     * @param productMap
     * @param callback
     */
    var calculateTotalProgress = function(reqCache, moduleMap, productMap, callback)
    {
        var progressTotals = {
            "products": {},
            "modules": {},
            "all": 0
        };

        // init all modules
        for (var _doc in moduleMap)
        {
            var module = moduleMap[_doc];

            progressTotals.modules[module.id] = 0;
        }

        for (var _doc in productMap)
        {
            var product = productMap[_doc];

            progressTotals.products[product.id] = 0;

            // if sections, product progressTotal = sectionLenth
            if (product.sections)
            {
                progressTotals.products[product.id] = productMap[_doc].sections.length;
            }

            // push progressTotal sums up to parent modules if they have them
            if (product.includeInProgress)
            {
                if (product.parentModule && product.parentModule.id) // id = _doc
                {
                    var parentModuleDoc = product.parentModule.id;
                    var parentModule = moduleMap[parentModuleDoc];
                    if (parentModule)
                    {
                        progressTotals.modules[parentModule.id] += progressTotals.products[product.id];

                        // TODO: special case: if the module also has a parent module...
                        if (parentModule.parentModule && parentModule.parentModule.id)
                        {
                            var p2doc = parentModule.parentModule.id;
                            var p2 = moduleMap[p2doc];
                            if (p2)
                            {
                                progressTotals.modules[p2.id] += progressTotals.products[product.id];
                            }
                        }
                    }
                }
            }
        }

        // sum up all modules into "all"
        for (var _doc in moduleMap)
        {
            var module = moduleMap[_doc];

            progressTotals.all += progressTotals.modules[module.id];
        }

        // report
        console.log("Progress Totals");
        for (var productId in progressTotals.products)
        {
            console.log("Product: " + productId + " -> " + progressTotals.products[productId]);
        }
        for (var moduleId in progressTotals.modules)
        {
            console.log("Module: " + moduleId + " -> " + progressTotals.modules[moduleId]);
        }
        console.log("All: " + progressTotals.all);

        // set all progress onto cache
        // this lets any request simply grab it from here
        reqCache.write("progressTotals", progressTotals);

        callback();
    };

    return r;

}();
