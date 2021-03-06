var page = require('webpage').create(),
    system = require('system');

function someCallback(pageNum, numPages) {
    return "<h1> somCallback: " + pageNum + " / " + numPages + "</h1>";
}

if (system.args.length < 3) {
    console.log('Usage: printheaderfooter.js URL filename');
    phantom.exit();
} else {
    var address = system.args[1];
    var output = system.args[2];
    page.viewportSize = { width: 600, height: 600 };
    page.paperSize = {
        format: 'A4',
        margin: "1cm",
        /* default header/footer for pages that don't have custom overwrites (see below) */
        header: {
            height: "1cm",
            contents: phantom.callback(function(pageNum, numPages) {
                if (pageNum == 1) {
                    return "";
                }
                return "<h1>Header <span style='float:right'>" + pageNum + " / " + numPages + "</span></h1>";
            })
        },
        footer: {
            height: "1cm",
            contents: phantom.callback(function(pageNum, numPages) {
                if (pageNum == numPages) {
                    return "";
                }
                return "<h1>Footer <span style='float:right'>" + pageNum + " / " + numPages + "</span></h1>";
            })
        }
    };
    page.open(address, function (status) {
        if (status !== 'success') {
            console.log('Unable to load the address!');
        } else {
            /* check whether the loaded page overwrites the header/footer setting,
               i.e. whether a PhantomJSPriting object exists. Use that then instead
               of our defaults above. */
            if (page.evaluate(function(){return typeof PhantomJSPrinting == "object";})) {
                paperSize = page.paperSize;
                paperSize.header.height = page.evaluate(function() {
                    console.log("woot?", PhantomJSPrinting.header.height);
                    return PhantomJSPrinting.header.height;
                });
                paperSize.header.contents = phantom.callback(function(pageNum, numPages) {
                    return page.evaluate(function(pageNum, numPages){return PhantomJSPrinting.header.contents(pageNum, numPages);}, pageNum, numPages);
                });
                paperSize.footer.height = page.evaluate(function() {
                    return PhantomJSPrinting.footer.height;
                });
                paperSize.footer.contents = phantom.callback(function(pageNum, numPages) {
                    return page.evaluate(function(pageNum, numPages){return PhantomJSPrinting.footer.contents(pageNum, numPages);}, pageNum, numPages);
                });
                page.paperSize = paperSize;
                console.log(page.paperSize.header.height);
                console.log(page.paperSize.footer.height);
            }
            window.setTimeout(function () {
                page.render(output);
                phantom.exit();
            }, 200);
        }
    });
}
