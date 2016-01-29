// helper class to run object updates as a background process

var async = require('async');
var util = require("./util");

var ITERATION_DELAY = 1000;

var _LOCK = function(obj, workFunction)
{
    process.locks.lock(obj.objectType() + "-" + obj._doc, workFunction);
};

var _scheduledObjects = {};
var _scheduledCallbacks = {};

// background "process" that updates settings to the server
var UpdateRunner = function()
{
    var count = 0;
    for (var k in _scheduledObjects)
    {
        count++;
    }

    if (count === 0)
    {
        setTimeout(UpdateRunner, ITERATION_DELAY);
        return;
    }

    console.log("Update Runner updating: " + count + " objects");

    var fns = [];
    for (var _doc in _scheduledObjects)
    {
        var object = _scheduledObjects[_doc];
        var callbacks = _scheduledCallbacks[_doc];

        var fn = function(object, callbacks) {
            return function(done) {

                // only allow one "thread" at a time to work with a settings instance
                _LOCK(object, function(releaseLockFn) {

                    Chain(object).update().then(function() {

                        delete _scheduledObjects[object._doc];
                        delete _scheduledCallbacks[object._doc];

                        // release the lock
                        releaseLockFn();

                        // fire all of the callbacks
                        if (callbacks)
                        {
                            for (var i = 0; i < callbacks.length; i++)
                            {
                                callbacks[i](null, object);
                            }
                        }

                        done();
                    });
                });
            }
        }(object, callbacks);
        fns.push(fn);
    }

    async.parallel(fns, function() {
        setTimeout(UpdateRunner, ITERATION_DELAY);
    });
};

// start in 5 seconds
setTimeout(UpdateRunner, 5000);

module.exports = function() {

    var r = {};

    /**
     * Schedules a Gitana object to be updated.  If a callback is provided, it will be called once the object
     * update completes.
     *
     * @param object
     * @param callback
     */
    r.schedule = function (object, callback)
    {
        _scheduledObjects[object._doc] = object;

        if (!_scheduledCallbacks[object._doc])
        {
            _scheduledCallbacks[object._doc] = [];
        }

        _scheduledCallbacks[object._doc].push(callback);
    };

    /**
     * Takes the lock (mutex) for a Gitana object.  If the lock is not available, the running process will wait.
     * Once the lock is acquired, the callback function is fired.
     *
     * @param object
     * @param callback
     */
    r.lock = function(object, callback)
    {
        _LOCK(object, function(releaseLockFn) {
            callback(releaseLockFn);
        });
    };

    return r;
}();
