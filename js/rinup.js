/* 
 * @link http://www.rinup.com/.
 * @copyright Copyright (c) 2014 OWEXX
 * @license http://www.rinup.com/license/
 */

if (typeof jQuery === "undefined") {
    throw new Error("Rinup requires jQuery");
}

rinup = (function ($) {
    var logs = [];
    var pub = {
        isActive: true,
        csrf: 'csrf',
        csrfToken: null,
        RESPONSE_OK: 'OK',
        RESPONSE_ERROR: 'ERROR',
        aliases: {},
        translationNS: ['rinup'],
        env: 'prod',
        debug: false,
        loadedModules: [],
        /**
         * 
         * @returns {undefined}
         */
        init: function () {
        },
        initModule: function (module, id) {
            if (!rinup.isset(id)) {
                id = 'rinup';
            }

            if (module.isActive !== "undefined" && module.isActive) {

                if ($.isFunction(module.init) && (pub.loadedModules.indexOf(id) === -1)) {
                    module.init();
                    pub.info('init ' + id + ' module');
                    pub.loadedModules.push(id);
                }

                $.each(module, function (k, v) {

                    if ($.isPlainObject(this) && $.type(v.isActive) !== "undefined") {
                        pub.initModule(this, k);
                    }
                });
            }
        },
        isDev: function () {
            return pub.env === 'dev';
        },
        trace: function (msg) {
            if (pub.debug) {
                console.trace(msg);
            }

            log(msg, 'trace');
        },
        log: function (msg) {
            if (pub.debug) {
                console.log(msg);
            }

            log(msg, 'log');
        },
        info: function (msg) {
            if (pub.debug) {
                console.info(msg);
            }

            log(msg, 'info');
        },
        error: function (msg) {
            if (pub.debug) {
                console.error(msg);
            }

            log(msg, 'error');
        },
        warn: function (msg) {
            if (pub.debug) {
                console.warn(msg);
            }

            log(msg, 'warn');
        },
        dump: function (msg) {
            if (pub.debug) {
                console.log(msg);
            }
        },
        isset: function () {
            var a = arguments,
                    l = a.length,
                    i = 0,
                    undef;
            if (l === 0) {
                throw new Error('Empty isset');
            }

            while (i !== l) {
                if (a[i] === undef || a[i] === null) {
                    return false;
                }
                i++;
            }
            return true;
        },
        /**
         * 
         * @param {type} url
         * @returns {unresolved}
         */
        getUrl: function (url) {
            return url;
        },
        /**
         * 
         * @param {type} alias
         * @returns {undefined}
         */
        getAlias: function (alias, throwException) {

            if (!this.isset(throwException)) {
                throwException = true;
            }

            if (alias.indexOf("@") === -1) {
                return alias;
            }

            var pos = alias.indexOf("/");
            var root = pos === -1 ? alias : alias.substr(0, pos);
            if (this.isset(this.aliases[root])) {
                return  pos === -1 ? this.aliases[root] : this.aliases[root] + alias.substr(pos);
            } else {
                if (throwException) {
                    throw new Error("Invalid path alias: " + root);
                } else {
                    return false;
                }
            }
        },
        setAlias: function (alias, path) {

            if ($.isPlainObject(alias)) {
                $.each(alias, function (k, v) {
                    pub.setAlias(k, v);
                });
                return;
            }

            if (alias.indexOf("@") === -1) {
                alias = '@' + alias;
            }

            this.aliases[alias] = path;
        },
        confirm: function (message, ok, cancel) {
            rinupDialog.confirm(message, function (result) {
                if (result) {
                    !ok || ok();
                } else {
                    !cancel || cancel();
                }
            });
        },
        alert: function (message, callback) {
            rinupDialog.alert(message, callback);
        },
        /**         
         * @returns {rect.w.innerHeight|w.innerHeight|chroma.clientHeight|Boolean.clientHeight|value.g.clientHeight|Number.clientHeight|x.clientHeight|b@call;round.clientHeight|g.clientHeight|b.clientHeight|eventCtrl@call;fire.clientHeight|e.clientHeight|e@arr;@arr;changedTouches.clientHeight|panel@call;fire.clientHeight}       * 
         */
        appHeight: function () {
            var w = window, d = document, e = d.documentElement;
            var g = d.getElementsByTagName('body')[0];
            var a = w.innerHeight || e.clientHeight || g.clientHeight;
            //var b = $("#viewport-proxy").height();
            return a;
        },
        url: {
            toParams: function (url, queryVars) {
                var urlPath = rinup.url.getUrlPath(url);
                var fullUrl = urlPath;
                var urlParams = rinup.url.getUrlParams(url);
                for (var key in queryVars) {
                    if ($.type(queryVars[key]) === 'object') {
                        if (rinup.isset(queryVars[key].name) && rinup.isset(queryVars[key].value)) {
                            urlParams[queryVars[key].name] = queryVars[key].value;
                        }
                    } else {
                        urlParams[key] = queryVars[key];
                    }
                }

                var queryString = $.param(urlParams);
                if (queryString) {
                    fullUrl += '?' + queryString;
                }
                return fullUrl;
            },
            getUrlParams: function (url) {

                // get query string from url (optional) or window
                var queryString = url ? url.split('?')[1] : window.location.search.slice(1);

                // we'll store the parameters here
                var obj = {};

                // if query string exists
                if (queryString) {

                    // stuff after # is not part of query string, so get rid of it
                    queryString = queryString.split('#')[0];

                    // split our query string into its component parts
                    var arr = queryString.split('&');

                    for (var i = 0; i < arr.length; i++) {
                        // separate the keys and the values
                        var a = arr[i].split('=');

                        // set parameter name and value (use 'true' if empty)
                        var paramName = a[0];
                        var paramValue = typeof (a[1]) === 'undefined' ? true : a[1];

                        // (optional) keep case consistent
                        paramName = paramName.toLowerCase();
                        if (typeof paramValue === 'string')
                            paramValue = paramValue.toLowerCase();

                        // if the paramName ends with square brackets, e.g. colors[] or colors[2]
                        if (paramName.match(/\[(\d+)?\]$/)) {

                            // create key if it doesn't exist
                            var key = paramName.replace(/\[(\d+)?\]/, '');
                            if (!obj[key])
                                obj[key] = [];

                            // if it's an indexed array e.g. colors[2]
                            if (paramName.match(/\[\d+\]$/)) {
                                // get the index value and add the entry at the appropriate position
                                var index = /\[(\d+)\]/.exec(paramName)[1];
                                obj[key][index] = paramValue;
                            } else {
                                // otherwise add the value to the end of the array
                                obj[key].push(paramValue);
                            }
                        } else {
                            // we're dealing with a string
                            if (!obj[paramName]) {
                                // if it doesn't exist, create property
                                obj[paramName] = paramValue;
                            } else if (obj[paramName] && typeof obj[paramName] === 'string') {
                                // if property does exist and it's a string, convert it to an array
                                obj[paramName] = [obj[paramName]];
                                obj[paramName].push(paramValue);
                            } else {
                                // otherwise add the property
                                obj[paramName].push(paramValue);
                            }
                        }
                    }
                }

                return obj;
            },
            getUrlPath: function (url) {
                return url.split('?')[0];
            }
        },
        ui: {
            select: {
                add: function (element, key, value, options) {
                    if (!$('option[value="' + key + '"]', element).length) {
                        element.append($('<option>', {
                            value: key,
                            text: value
                        }));
                    }

                },
                remove: function (element, key) {
                    var option = $('option[value="' + key + '"]', element);
                    if (option.length) {
                        option.remove();
                    }
                }


            }
        },
        helpers: {
            html: {
                back: function () {
                    if (history.length > 1) {
                        history.back();
                        return false;
                    } else {
                        return true;
                    }
                }
            },
            model: {
                load: function (model, data) {
                    $.each(data, function (k, v) {
                        if ($.type(model[k]) === 'function') {
                            model[k](v);
                        } else {
                            if ($.type(model[k]) !== "undefined") {
                                model[k] = v;
                            }
                        }
                    });
                }
            },
            string: {
                plural: function (value, words) {
                    var wordsList = words.split(","),
                            one = value % 10,
                            many = value % 100;

                    if (wordsList.length === 3) {
                        if (one === 1 && !(many >= 11 && many <= 19)) {
                            return wordsList[0].trim();
                        }
                        if (one >= 2 && one <= 9 && !(many >= 11 && many <= 19)) {
                            return wordsList[1].trim();
                        }

                        return wordsList[1].trim();
                    }
                }
            },
            number: {
                round: function (num, precision, mode) {
                    if (!rinup.isset(mode)) {
                        mode = 'halfUp';
                    }

                    switch (mode) {
                        case 'halfUp':
                            precision = Math.pow(10, precision)
                            return Math.round(num * precision) / precision;

                        case 'up':
                            precision = Math.pow(10, precision)
                            return Math.ceil(num * precision) / precision;

                        case 'down':
                            precision = Math.pow(10, precision)
                            return Math.floor(num * precision) / precision;

                    }

                },
                floatSafeRemainder: function (val, step) {
                    var valDecCount = (val.toString().split('.')[1] || '').length;
                    var stepDecCount = (step.toString().split('.')[1] || '').length;
                    var decCount = valDecCount > stepDecCount ? valDecCount : stepDecCount;
                    var valInt = parseInt(val.toFixed(decCount).replace('.', ''));
                    var stepInt = parseInt(step.toFixed(decCount).replace('.', ''));
                    return (valInt % stepInt) / Math.pow(10, decCount);
                }
            }
        }

    };

    function log(msg, level, category) {
        if (!pub.debug) {
            return;
        }

        if ($.type(category) === "undefined") {
            category = 'application';
        }

        logs.push({
            message: msg,
            level: level,
            category: category
        });
    }

    return pub;
})(jQuery);

/**
 * init rinup
 * @param {type} param
 */
jQuery(document).ready(function () {
    rinup.initModule(rinup);
});
/** HELPERS **/
if (typeof _fb !== 'function') {
    function _fb(msg) {
        rinup.log(msg);
    }
}

/**
 * message modelis skirtas pranesimu (ajax) apdorojimas 
 */
var RnMessage = function () {
    var self = this;

    self.message = ko.observable(null);
    self.type = ko.observable(null);
};