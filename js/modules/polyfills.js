
//
// Older Browser Polyfills for new javascript memthods
//

//
// "".trim()
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/Trim
//
if (!String.prototype.trim) {
    String.prototype.trim = function () {
        return this.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');
    };
}

//
// [].filter()
// https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Array/filter
//
if (!Array.prototype.filter) {
    Array.prototype.filter = function(fun/*, thisArg*/) {
        'use strict';

        if (this === void 0 || this === null) {
            throw new TypeError();
        }

        var t = Object(this);
        var len = t.length >>> 0;
        if (typeof fun !== 'function') {
            throw new TypeError();
        }

        var res = [];
        var thisArg = arguments.length >= 2 ? arguments[1] : void 0;
        for (var i = 0; i < len; i++) {
            if (i in t) {
                var val = t[i];

                // NOTE: Technically this should Object.defineProperty at
                //       the next index, as push can be affected by
                //       properties on Object.prototype and Array.prototype.
                //       But that method's new, and collisions should be
                //       rare, so use the more-compatible alternative.
                if (fun.call(thisArg, val, i, t)) {
                    res.push(val);
                }
            }
        }

        return res;
    };
}

//
// {}.bind
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_objects/Function/bind
//
if (!Function.prototype.bind) {
    Function.prototype.bind = function(oThis) {
        if (typeof this !== 'function') {
            // closest thing possible to the ECMAScript 5
            // internal IsCallable function
            throw new TypeError('Function.prototype.bind - what is trying to be bound is not callable');
        }

        var aArgs   = Array.prototype.slice.call(arguments, 1),
            fToBind = this,
            fNOP    = function() {},
            fBound  = function() {
                return fToBind.apply(this instanceof fNOP ? this : oThis, aArgs.concat(Array.prototype.slice.call(arguments)));
            };

        if (this.prototype) {
            // Function.prototype doesn't have a prototype property
            fNOP.prototype = this.prototype;
        }
        fBound.prototype = new fNOP();

        return fBound;
    };
}

jQuery(function ($) {
    //
    // ie8 bug where icons don't display on hover
    // http://stackoverflow.com/questions/9809351/ie8-css-font-face-fonts-only-working-for-before-content-on-over-and-sometimes/10557782#10557782
    //
    var $html = $('html'),
        $head = $('head');

    if ($html.is('.lt-ie9')) {
        window.redrawFontAwesomeIcons = function () {
            $head.append('<style id="tmpStyle">:before,:after{content:none !important;}</style>');
            setTimeout(function(){
                $('#tmpStyle').remove();
            }, 0);
        };

        window.redrawFontAwesomeIcons();
    }

    // IE9 doesn't support placeholders, which makes forms that use placeholders instead of labels unusable
    if (!Modernizr.input.placeholder) {
        $('input, textarea').each(function () {
            var $self = $(this);

            if ($self.val() == '' && $self.attr('placeholder') != '') {
                $self.addClass('placeholder-polyfill');

                $self.val($self.attr('placeholder'));

                $self.focus(function () {
                    if ($(this).val() == $(this).attr('placeholder')) {
                        $(this).val('');
                    }
                });
                $self.blur(function () {
                    if ($(this).val() == '') {
                        $(this).val($(this).attr('placeholder'));
                    }
                });
            }
        });

        $('form').submit(function () {
            $(this).find('.placeholder-polyfill').each(function () {
                if ($(this).val() == $(this).attr('placeholder')) {
                    $(this).val('');
                }
            });
        });
    }
});

