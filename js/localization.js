/* 
 * @link http://www.rinup.com/.
 * @copyright Copyright (c) 2014 OWEXX
 * @license http://www.rinup.com/license/
 */

if (typeof rinup === "undefined") {
    throw new Error("Requires Rinup");
}

rinup.localization = (function ($) {

    var pub = {
        isActive: true,
        init: function (config) {

        },
        taxesModel: function (config) {
            var self = this;

            self.owner = null;
            self.items = ko.observableArray()


            var init = function (config) {
                config = $.extend({
                    owner: null
                }, config);

                self.owner(config.owner);
            };

            self.add = function (model) {
                var taxModel = ko.utils.arrayFirst(self.items(), function (child) {
                    return child.rate() === model.taxRate();
                });

                if (!taxModel) {
                    taxModel = new TaxModel({
                        rate: model.taxRate(),
                    });
                    self.items.push(taxModel);
                }

                taxModel.addTaxableModel(model);
            };

            self.totalAmount = function () {
                var total = 0;
                self.items().forEach(function (taxModel) {
                    total += taxModel.amount()
                });

                return total;
            };

        }

    };


    var TaxModel = function (config) {
        var self = this;

        self.owner = null;
        self.rate = ko.observable(0);
        self.taxableAmountTI = ko.observable(0);
        self.taxableModels = ko.observableArray();



        var init = function (config) {
            config = $.extend({
                rate: 0,
            }, config);

            self.rate(config.rate);
        };

        self.addTaxableModel = function (model) {

            self.taxableModels.push(model);

        };

        self.amount = function () {
            var total = 0;
            self.taxableModels().forEach(function (model) {
                total += model.taxableAmountTI()
            });

            return rinup.currency.toFixed(total - total / (1 + self.rate() / 100), 2);
        };

        self.renderAmount = function () {

            return rinup.currency.formatCurrency(self.amount());
        };


        init(config);
    };

    return pub;
})(jQuery);

rinup.currency = (function ($) {

    var pub = {
        isActive: true,
        config: {
            currency: {
                symbol: "€", // default currency symbol is '$'
                format: "%s %v", // controls output: %s = symbol, %v = value (can be object, see docs)
                decimal: ",", // decimal point separator
                thousand: ".", // thousands separator
                precision: 2, // decimal places
                grouping: 3 // digit grouping (not implemented yet)
            },
            number: {
                precision: 2, // default precision on numbers is 0
                grouping: 3, // digit grouping (not implemented yet)
                thousand: ",",
                decimal: "."
            }
        },

        init: function (config) {
            init(config);
        },

        formatCurrency: function (number, symbol, precision, thousand, decimal, format) {
            return formatCurrency(number, symbol, precision, thousand, decimal, format)
        },

        rawNumber: function (val) {
            return Number(val.replace(/[^\d\.\-]/g, ""));
        },

        toFixed: function (value, precision) {
            precision = checkPrecision(precision, pub.config.currency.precision);
            return toFixed(Math.abs(value), precision);
        }
    };
    // Store reference to possibly-available ECMAScript 5 methods for later
    var nativeMap = Array.prototype.map,
            nativeIsArray = Array.isArray,
            toString = Object.prototype.toString;

    var unformat = function (value, decimal) {
        // Recursively unformat arrays:
        if (isArray(value)) {
            return map(value, function (val) {
                return unformat(val, decimal);
            });
        }

        // Fails silently (need decent errors):
        value = value || 0;
        // Return the value as-is if it's already a number:
        if (typeof value === "number")
            return value;
        // Default decimal point comes from settings, but could be set to eg. "," in opts:
        decimal = decimal || pub.config.number.decimal;
        // Build regex to strip out everything except digits, decimal point and minus sign:
        var regex = new RegExp("[^0-9-" + decimal + "]", ["g"]),
                unformatted = parseFloat(
                        ("" + value)
                        .replace(/\((?=\d+)(.*)\)/, "-$1") // replace bracketed values with negatives
                        .replace(regex, '')         // strip out any cruft
                        .replace(decimal, '.')      // make sure decimal point is standard
                        );
        // This will fail silently which may cause trouble, let's wait and see:
        return !isNaN(unformatted) ? unformatted : 0;
    };
    function formatCurrency(number, symbol, precision, thousand, decimal, format) {
        // Resursively format arrays:
        if (isArray(number)) {
            return map(number, function (val) {
                return formatMoney(val, symbol, precision, thousand, decimal, format);
            });
        }

        if (symbol === "undefined") {
            symbol = pub.config.currency.symbol;
        }

        if (precision === "undefined") {
            symbol = pub.config.currency.precision;
        }

        if (thousand === "undefined") {
            symbol = pub.config.currency.thousand;
        }

        if (decimal === "undefined") {
            symbol = pub.config.currency.decimal;
        }

        if (format === "undefined") {
            symbol = pub.config.currency.format;
        }

        // Clean up number:
        number = unformat(number);
        // Build options object from second param (if object) or all params, extending defaults:
        var opts = defaults(
                (isObject(symbol) ? symbol : {
                    symbol: symbol,
                    precision: precision,
                    thousand: thousand,
                    decimal: decimal,
                    format: format
                }),
                pub.config.currency
                ),
                // Check format (returns object with pos, neg and zero):
                formats = checkCurrencyFormat(opts.format),
                // Choose which format to use for this value:
                useFormat = number > 0 ? formats.pos : number < 0 ? formats.neg : formats.zero;
        // Return with currency symbol added:
        return useFormat.replace('%s', opts.symbol).replace('%v', formatNumber(Math.abs(number), checkPrecision(opts.precision), opts.thousand, opts.decimal));
    }
    ;
    function formatNumber(number, precision, thousand, decimal) {
        // Resursively format arrays:
        if (isArray(number)) {
            return map(number, function (val) {
                return formatNumber(val, precision, thousand, decimal);
            });
        }

        // Clean up number:
        number = unformat(number);
        // Build options object from second param (if object) or all params, extending defaults:
        var opts = defaults(
                (isObject(precision) ? precision : {
                    precision: precision,
                    thousand: thousand,
                    decimal: decimal
                }),
                pub.config.number
                ),
                // Clean up precision
                usePrecision = checkPrecision(opts.precision),
                // Do some calc:
                negative = number < 0 ? "-" : "",
                base = parseInt(toFixed(Math.abs(number || 0), usePrecision), 10) + "",
                mod = base.length > 3 ? base.length % 3 : 0;
        // Format the number:
        return negative + (mod ? base.substr(0, mod) + opts.thousand : "") + base.substr(mod).replace(/(\d{3})(?=\d)/g, "$1" + opts.thousand) + (usePrecision ? opts.decimal + toFixed(Math.abs(number), usePrecision).split('.')[1] : "");
    }
    ;
    function checkCurrencyFormat(format) {
        var defaults = pub.config.currency.format;
        // Allow function as format parameter (should return string or object):
        if (typeof format === "function")
            format = format();
        // Format can be a string, in which case `value` ("%v") must be present:
        if (isString(format) && format.match("%v")) {

            // Create and return positive, negative and zero formats:
            return {
                pos: format,
                neg: format.replace("-", "").replace("%v", "-%v"),
                zero: format
            };
            // If no format, or object is missing valid positive value, use defaults:
        } else if (!format || !format.pos || !format.pos.match("%v")) {

            // If defaults is a string, casts it to an object for faster checking next time:
            return (!isString(defaults)) ? defaults : pub.config.currency.format = {
                pos: defaults,
                neg: defaults.replace("%v", "-%v"),
                zero: defaults
            };
        }
        // Otherwise, assume format was fine:
        return format;
    }

    function checkPrecision(val, base) {
        val = Math.round(Math.abs(val));
        return isNaN(val) ? base : val;
    }

    function defaults(object, defs) {
        var key;
        object = object || {};
        defs = defs || {};
        // Iterate over object non-prototype properties:
        for (key in defs) {
            if (defs.hasOwnProperty(key)) {
// Replace values with defaults only if undefined (allow empty/zero values):
                if (object[key] == null)
                    object[key] = defs[key];
            }
        }
        return object;
    }
    ;
    /**
     * Tests whether supplied parameter is a string
     * from underscore.js
     */
    function isString(obj) {
        return !!(obj === '' || (obj && obj.charCodeAt && obj.substr));
    }


    /**
     * Tests whether supplied parameter is an array
     * from underscore.js, delegates to ECMA5's native Array.isArray
     */
    function isArray(obj) {
        return nativeIsArray ? nativeIsArray(obj) : toString.call(obj) === '[object Array]';
    }


    /**
     * Tests whether supplied parameter is a true object
     */
    function isObject(obj) {
        return obj && toString.call(obj) === '[object Object]';
    }


    function toFixed(value, precision) {
        precision = checkPrecision(precision, pub.config.number.precision);
        var exponentialForm = Number(unformat(value) + 'e' + precision);
        var rounded = Math.round(exponentialForm);
        var finalResult = Number(rounded + 'e-' + precision).toFixed(precision);
        return finalResult;
    }

    function init(config) {

        ko.bindingHandlers.currency = {
            init: function (element, valueAccessor, allBindingsAccessor) {
                //only inputs need this, text values don't write back
                if ($(element).is("input") === true) {
                    var underlyingObservable = valueAccessor(),
                            interceptor = ko.computed({
                                read: underlyingObservable,
                                write: function (value) {
                                    if (value === "") {
                                        underlyingObservable(null);
                                    } else {
                                        underlyingObservable(pub.rawNumber(value));
                                    }
                                }
                            });
                    ko.bindingHandlers.value.init(element, function () {
                        return interceptor;
                    }, allBindingsAccessor);
                }
            },
            update: function (element, valueAccessor, allBindingsAccessor) {
                var
                        symbol = ko.unwrap(allBindingsAccessor().symbol !== undefined ? allBindingsAccessor().symbol : rinup.currency.config.currency.symbol),
                        precision = ko.unwrap(allBindingsAccessor().symbol !== undefined ? allBindingsAccessor().precision : rinup.currency.config.currency.precision),
                        value = ko.unwrap(valueAccessor());
                if ($(element).is("input") === true) {
                    //leave the boxes empty by default
                    value = value !== null && value !== undefined && value !== "" ? pub.formatCurrency(parseFloat(value), symbol, precision) : "";
                    $(element).val(value);
                } else {
                    //text based bindings its nice to see a 0 in place of nothing
                    value = value || 0;
                    $(element).text(pub.formatCurrency(parseFloat(value), symbol, precision));
                }
            }
        };
    }

    return pub;
})(jQuery);
