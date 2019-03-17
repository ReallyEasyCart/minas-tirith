(function ($) {

	// Check that jQuery is accessible
    if (typeof $ === 'undefined') {
        handleError("McKarousel doesn't have access to jQuery");
    }

    var McKarousel = {};

    McKarousel.enable = function ($carousel, options) {
    	// Check if we've been passed across a jQuery selected element
    	if (! ($carousel instanceof jQuery)) {
    		debug('Passed a non-jQuery element, converting');
    		$carousel = $($carousel);
    	}

    	// If we can't find the element, exit
    	if ($carousel.length < 1) {
    		debug('Target element not found, exiting');
    		return;
    	}

	    // Merge options together
    	var Options = {
            sliderType: 'slider',
	    	enableDebug: false,
	    	adjustSlidesToScreen: false
	    };
    	Options = $.extend(Options, options);

    	var activeSlide = 0,
    		slideCount = 0,
    		$wrapper = false,
    		$body = $('body'),
    		carouselWidth = 0,
            resizeInterval = null; 

        // Add McKarosel class to element
        $carousel.addClass('McKarousel');
        if (Options.sliderType == 'grid-slider') {
            $carousel.addClass('grid-slider');
        }

        // Wrap carousel contents in a div
        $carousel.html('<div class="McKarousel-wrapper">' + $carousel.html() + '</div>');
        $wrapper = $carousel.find('.McKarousel-wrapper');

        // Setup Resizing
        function resize() {
        	var items = $carousel.find('.McKarousel-wrapper > div'),
                height = 0,
                itemWidth = 100 / items.length,
                carouselWidthMultiplier = 100,
                slideCountModifier = 1,
                heightOverride = false;  

            // Question: Why use Modernizr?
            // Answer: I was previous doing "... && $body.width() >= 1024". But I was seeing a problem
            // in Chrome where the there was a difference of about 10px between what Chrome was saying was 1024
            // and what $body.width() was saying wasy 1024. Using Modernizr.mq means that I can lock this to the
            // exact same media queries we use in REC.
            if (Options.sliderType == 'grid-slider') {
                if (Modernizr.mq('(min-width: 48em)')) {
                    // Two item width grid
                    carouselWidthMultiplier = 0;
                    slideCountModifier = 2;
                    itemWidth = 49;
                    heightOverride = '100%';
                }
                if (Modernizr.mq('(min-width: 64em)')) {
                    // Three items width grid
                    carouselWidthMultiplier = 0;
                    slideCountModifier = 3;
                    itemWidth = 33;
                    heightOverride = '100%';
                }
            }

        	slideCount = items.length / slideCountModifier;
        	carouselWidth = items.length * carouselWidthMultiplier;

            if (!carouselWidth) {
                carouselWidth = 100;
            }

        	debug(slideCount + ' items found, setting wrapper width to ' + carouselWidth + '% and item width to ' + itemWidth + '%');

        	$wrapper.css('width', carouselWidth + '%');
	        items.each(function (i, el) {
                // Set the width before trying to get the height
                $(this).css('width', itemWidth + '%');
	        }).each(function (i, el) {
                var elHeight = $(el).height();
                
                if (elHeight > height) {
                    height = elHeight;
                }
            });
	        $carousel.css('height', !heightOverride ? height + 'px' : heightOverride);

            if (Options.sliderType == 'grid-slider' && Modernizr.mq('(min-width: 48em)')) {
                // Set all carousel items to be the same height as well
                items.each(function (i, el) {
                    $(el).height(height);
                });
            }

            // reload current slide after 100 milliseconds (delayed as to not be soo jolty)
            clearTimeout(resizeInterval);
            resizeInterval = setTimeout(function () {
                go(activeSlide);
            }, 100);

        }
        resize();
        $(window).resize(resize);

    	// Setup the controls
    	function go(i) {
    		activeSlide = i;

    		debug('Moving to slide ' + i);

    		if (activeSlide >= slideCount) {
    			activeSlide = 0;
    			debug('Corrected to slide ' + activeSlide);
    		}
    		if (activeSlide < 0) {
    			activeSlide = slideCount - 1;
    			debug('Corrected to slide ' + activeSlide);
    		}

    		$wrapper.stop().animate({
    			left: -(activeSlide * 100) + '%'
    		}, 500);

    		return;
    	}
    	function next() {
    		debug('Next');
    		return go(activeSlide + 1);
    	}
    	function prev() {
    		debug('Previous');
    		return go(activeSlide - 1);
    	}

    	// Setup the arrow html
    	var leftArrow = '<span class="McKarousel-arrow McKarousel-left"><i class="fa fa-chevron-left"></i></span>',
    		rightArrow = '<span class="McKarousel-arrow McKarousel-right"><i class="fa fa-chevron-right"></i></span>';

    	// Prepend the arrows
    	$carousel.prepend(leftArrow, rightArrow);

    	$carousel.on('click', '.McKarousel-arrow', function () {
    		var $this = $(this);

    		if ($this.hasClass('McKarousel-left')) {
    			prev();
    		} else {
    			next();
    		}
    	});

        var startX,
            currentX,
            directionX,
            dragging = false,
            clickDetectTimeout = null,
            clickDetectTimeoutSeconds = 100; // tiny delay in drag in order to tell the difference between click and drag
        function dragStart(e) {
            // Don't scroll tablet+
            if (Modernizr.mq('(max-width: 35.5em)')) {
                e.pageX = e.pageX ? e.pageX : e.originalEvent.touches[0].pageX;

                clickDetectTimeout = setTimeout(function () {
                    if (e.button === 0 || e.button === undefined) { // Left mouse click or swipe
                        startX = e.pageX;

                        $body.on('touchmove.mckarousel-drag mousemove.mckarousel-drag', dragMove);
                    }
                }, clickDetectTimeoutSeconds);
            }
        }

        function dragMove (e) {
            e.pageX = e.pageX ? e.pageX : e.originalEvent.touches[0].pageX;

            if (e.pageX != currentX) {
                currentLeft = -(activeSlide * 100);
                dragging = true;
                $wrapper.css('left', 'calc(' + currentLeft + '% - ' + (startX - e.pageX) + 'px)');
                directionX = e.pageX > currentX ? 'left' : 'right';
                currentX = e.pageX;
            }
        }

        function dragEnd(e) {
            var movementPercent = 100 / carouselWidth * (startX - currentX);

            if (clickDetectTimeout) {
                clearTimeout(clickDetectTimeout);
            }

            if (!dragging) {
                return;
            }

            $body.off('.mckarousel-drag');

            if (movementPercent > 25 && directionX === 'right') {
                next();
            } else if (movementPercent < -25 && directionX === 'left') {
                prev();
            } else {
                go(activeSlide);
            }

            setTimeout(function () {
                dragging = false;
            }, 0);
        }
        $carousel.on('touchstart mousedown', dragStart);
        $body.on('touchend mouseup', dragEnd);
        $carousel.on('click', function () {
            if (dragging) return false;
        });

    	// Handle Error function
    	function handleError(message) {
    		throw new Error(message);
    	}

    	// Debug function (saves time and stops me repeating the prefix)
    	function debug(message) {
    		if (Options.enableDebug) {
	   			console.log('[McKarousel] ' + message);
	   		}
    	}
    };

    window.McKarousel = McKarousel;

})(window.jQuery);