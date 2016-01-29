$(document).ready(function() {

    var viewingProductPage = window.APP.moduleId && window.APP.productId && window.APP.sectionId;

    // on product page viewer, support spacebar + right arrow (to go next) and left arrow (to go previous)
    if (viewingProductPage) {

        // start up the keydrown loop
        kd.run(function () {
            kd.tick();
        });

        var handle = function(direction) {
            return function(e) {
                e.preventDefault();
                e.stopImmediatePropagation();

                window.location.href = "/training/modules/" + window.APP.moduleId + "/products/" + window.APP.productId + "/nav/" + direction + "?sectionId=" + window.APP.sectionId;
            };
        };

        // next
        kd.SPACE.up(handle("next"));
        kd.RIGHT.up(handle("next"));

        // previous
        kd.LEFT.up(handle("previous"));

        // auto focus the global wrapper so that kb events can be picked up
        $("#globalWrapper").focus();
    }

    $("#quiz-form").rememberState({"objName": "quiz-form-store"});
    $("#quiz-form").rememberState("restoreState");

    var validateSubmit = function() {

        var totalNumberOfQuestions = parseInt($("#quiz-form").attr("data-question-length"), 10);

        // how many are checked
        var totalChecked = $("#quiz-form input:checked").size();

        var valid = totalChecked === totalNumberOfQuestions;

        if (!valid) {
            $("#quiz-form-submit").prop("disabled", "disabled");
        } else {
            $("#quiz-form-submit").prop("disabled", "");
        }
    };
    $("#quiz-form input").change(function() {
        validateSubmit();
    });
    validateSubmit();


    // adjust any thumbnails so that images are centered
    $(".thumbnail img").one('load', function() {
        var height = $(this).height();
        if (height < 240) {
            var padding = (240 - height) / 2;
            $(this).css("padding-top", padding + "px");
            $(this).css("padding-bottom", padding + "px");
        }
    });

    var doResize = function() {

        // if we're on a product page, bump the bottom margin to account for the footer
        if ($(".product-page-content").length > 0)
        {
            $(".product-page-content").css("margin-bottom", "180px");
        }

        var windowWidth = $(window).outerWidth();
        if (windowWidth > 990)
        {
            // if width > 990, then we have a left-hand nav and a right-hand content section
            // we adjust page height by setting left-hand nav height

            var headerHeight = $(".navbar").outerHeight();
            var footerHeight = $("footer").outerHeight();

            var leftNavHeight = $(document).height() - headerHeight - footerHeight;

            $(".leftnav").css("height", leftNavHeight + "px");
        }
        else
        {
            // otherwise, things are arranged vertically
            // we set .leftnav back to auto
            $(".leftnav").css("height", "auto");
        }
    };

    $(window).on("resize", function() {
        doResize();
    });

    setTimeout(function() {
        doResize();
    }, 25);

    // make manually embedded images in a content section responsive so they resize with the screen
    $(".product-page-content .content-section p img").addClass("img-responsive");

    // add bootstrap classes to tables
    $("table").addClass("table table-bordered table-hover");

    // right align price column
    var headerPriceRegexp = /price/gi;
    var index = 0;
    $(".line-list-table tbody tr:nth-child(1) th").each(function() {
        ++index;
        var value = $(this).html();
        if (value && value.match(headerPriceRegexp))
        {
            $(".line-list-table tbody tr th:nth-child(" + index + ")").css("text-align", "right");
            $(".line-list-table tbody tr td:nth-child(" + index + ")").css("text-align", "right");
        }
    });

    $(".line-list-table tbody tr th").css("vertical-align", "middle");
    $(".line-list-table tbody tr td").css("vertical-align", "middle");

    // blue column for Moen products
    var headerColorRegexp = /^moen$/gi;
    $(".competitive-positioning table").each(function() {
        var thisTable = this;
        var index = 0;
        $("tbody tr:nth-child(1) td", thisTable).each(function() {
            ++index;
            var value = $(this).html();
            if (value && value.match(headerColorRegexp))
            {
                $("tr td:nth-child("+ index +")", thisTable).css("background", "#b2e5fe");
                $("tr td:nth-child("+ index +")", thisTable).css("border-top-color", "rgb(100, 100, 100)");
                $("tr td:nth-child("+ index +")", thisTable).css("border-bottom-color", "rgb(100, 100, 100)");
                $("tr td:nth-child("+ index +")", thisTable).css("border-right-color", "rgb(100, 100, 100)");
                $("tr td:nth-child("+ (index-1) +")", thisTable).css("border-right-color", "rgb(100, 100, 100)");
            }
        });
    });

    $(".competitive-positioning table tr td:nth-child(1)").css("word-wrap", "break-word");
    $(".competitive-positioning table tr td:nth-child(1)").css("max-width", "135px");
    $(".competitive-positioning table tr td:nth-child(1)").css("white-space", "normal");

    // competitive positioning, markdown generated tables
    // adjust for images
    $(".competitive-positioning table tr td").each(function() {
        var imgRegexp = /([A-Z0-9_\-\s]+)/gi;

        var value = $(this).html();
        if (value)
        {
            // replace with image url
            if (value.indexOf("image---") === 0)
            {
                var productId = value.substring(8);
                productId = productId.match(imgRegexp);
                productId = productId[0].trim();

                var html = "<img class='img-responsive' src='/static/path/comp_images/2016/" + productId + ".jpg??attachment=_preview_default_upload64_64&fallback=/images/missing-128.png'>";

                $(this).html(html);

                $(this).css("text-align", "center");
                $(this).css("background", "white");
            }
            // convert text strings delimited by _ with bulleted lists
            else if (value.indexOf("bullets---") === 0)
            {
                value = value.substring(10);

                var tokens = value.split("_");

                var html = "<ul>";
                for (var i = 0; i < tokens.length; i++)
                {
                    html += "<li>" + tokens[i] + "</li>";
                }
                html += "</ul>";

                $(this).html(html);
            }

        }
    });

    var titleSize = 0;
    $(".module-title").each(function() {
        if($(this).outerHeight() > titleSize)
        {
            titleSize = $(this).outerHeight();
        }
    });

    $(".module-title").each(function() {
        if($(this).outerHeight() < titleSize)
        {
            $(this).css("min-height", titleSize+"px");
        }
    });

    /*
    // lock in analytics to track all anchor clicks
    if ($.fn.insight) {
        $("A").insight();
    }
    */
});
