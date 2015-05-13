(function(window) {
    var $allSketches = $(".all-sketches");
    var $navbarElement = $(".nav");

    function initializeSketchAndNav(sketchName) {
        var sketch = getSketch(sketchName);
        var $sketchElement = initializeSketch(sketch, $allSketches);

        // add sketch element to nav
        var $navElement = $('<li></li>');
        $navElement.text(sketch.id)
                   .click(function () {
                       $('body').animate({ scrollTop: $sketchElement.offset().top - 55 }, 600);
                   })
                   .appendTo($navbarElement);
    }

    initializeSketchAndNav("line");
    initializeSketchAndNav("dots");
    initializeSketchAndNav("waves");
})(window);