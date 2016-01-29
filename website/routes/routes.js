module.exports = function(app, callback) {

    // app.use(blockUnauthenticatedRoutesHandler);
    // app.use(ensureAuthenticated);

    callback();
};

var blockUnauthenticatedRoutesHandler = function(req, res, next) {
    console.log("isAuthenticated " + req.isAuthenticated());

    if (!req.isAuthenticated() && (req.path === "/index.html"|| req.path === "/"))
    {
        // redirect to /index.html
        console.log("REDIRECT TO INDEX!!");
        res.redirect("/login.html");
        return;
    }

    // if (req.path.indexOf("/auth/") !== -1
    //     || req.path === "/auth/"
    //     || req.path === "/register"
    //     || req.path === "/login"
    //     || req.path === "/login.html")
    // {
    //     next();
    //     return;
    // }
    // else
    // {
    //     // they must be authenticated
    //     if (!req.isAuthenticated())
    //     {
    //         // redirect to /index.html
    //         console.log("REDIRECT TO INDEX!!");
    //         res.redirect("/login.html");
    //         return;
    //     }
    // }

    next();
};

// function ensureAuthenticated(req, res, next) {
//     if (req.path === "/login.html")
//     {
//         return next();
//     }
//
//     if (req.path === "/login.html")
//     {
//         return next();
//     }
//
//     if (req.isAuthenticated()) { return next(); }
//
//     res.redirect('/login.html');
// }
