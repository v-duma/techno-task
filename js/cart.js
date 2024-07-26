/* 
 * @link http://www.rinup.com/.
 * @copyright Copyright (c) 2014 OWEXX
 * @license http://www.rinup.com/license/
 */

if (typeof rinup === "undefined") {
    throw new Error("Requires Rinup");
}

rinup.cart = (function ($) {

    var pub = {
        isActive: true,

        init: function () {

        },
        pay: {
            formSelector: null,
            paymentMethodAttribName: '',
            paymentIdAttribName: '',
            init: function (config) {
                pub.pay.formSelector = config.formSelector;
                pub.pay.paymentMethodAttribName = config.paymentMethodAttribName;
                pub.pay.paymentIdAttribName = config.paymentIdAttribName;
            },
            setPaymentMethod: function (id, method, elem, options) {
                var $form;

                options = $.extend({submit: true}, options);

                $form = $(pub.pay.formSelector);
                $('[name="' + pub.pay.paymentMethodAttribName + '"]', $form).val(method);
                $('[name="' + pub.pay.paymentIdAttribName + '"]', $form).val(id);

                if (options.submit) {
                    $form.submit();
                }
            }
        },
        product: {
            addUrl: '/cart/cart/add',
            removeUrl: '/cart/cart/remove',
            cartViewUrl: '/cart/cart/view',
            messageZeroQuantity: '',
            addModels: [],
            inited: false,
            init: function (config) {
                if (pub.product.inited) {
                    return;
                }

                pub.product.inited = true;

                config = $.extend({
                    messageZeroQuantity: '',
                    addUrl: null,
                    removeUrl: null
                }, config);

                pub.product.addUrl = config.addUrl;
                pub.product.removeUrl = config.removeUrl;
                pub.product.cartViewUrl = config.cartViewUrl;
                pub.product.messageZeroQuantity = config.messageZeroQuantity;

                $(rinup).on('rinup.cart.remove', function (e, data) {
                    if (!(data.model instanceof AddModel) && data.response && data.response.data && data.response.data.totalQuantity == 0) {

                        $.each(pub.product.addModels, function (k, v) {
                            v.quantity(0);
                            v.id(null);
                        });
                    }
                });

                pub.product.initAdd(config);



            },
            findAddModelById: function (mid, mch) {
                for (var i = 0; i < pub.product.addModels.length; i++) {
                    var model = pub.product.addModels[i];
                    if (model.mid() == mid && model.mch() == mch) {
                        return model;
                    }
                }
            },
            initAdd: function (config) {

                config = $.extend({}, config);

                var addSelector = config.addSelector ? config.addSelector : 'cart-add';
                registerAddComponent(config);

                $(addSelector).each(function () {
                    ko.applyBindings({}, $(this).get(0));
                });
            },
            clearModels: function () {
                pub.product.addModels = [];
            }
        },

        headerBox: {
            model: null,
            removeUrl: '/cart/cart/remove',
            removeAllUrl: '/cart/cart/remove-all',
            loadUrl: '/cart/cart/header-box',
            init: function (config) {
                config = $.extend({
                    selector: null
                }, config);
                if (config.selector) {
                    var $elem = $(config.selector);
                    if ($elem.length) {
                        var model = new HeaderBoxModel(config);
                        model.$elem = $elem;
                        ko.applyBindings(model, $(config.selector).get(0));
                        pub.headerBox.model = model;
                        return model;
                    }
                }
            }
        },
        view: {
            removeUrl: '/cart/cart/remove',
            removeAllUrl: '/cart/cart/remove-all',
            changeUrl: '/cart/cart/change',
            model: null,
            init: function (config) {
                config = $.extend({selector: null}, config);

                if (config.selector) {
                    var $elem = $(config.selector);
                    if ($elem.length) {
                        var model = new ViewModel(config);
                        model.$elem = $elem;
                        ko.applyBindings(model, $(config.selector).get(0));
                        pub.view.model = model;
                    }
                }
            }
        }
    };

    var registerAddComponent = function (config) {
        if (!ko.components.isRegistered('cart-add')) {
            ko.components.register('cart-add', {
                viewModel: {
                    createViewModel: function (params, componentInfo) {
                        var model = new AddModel(params);
                        pub.product.addModels.push(model);
                        $(rinup).trigger('rinup.cart.product.addModel', {model: model});
                        return model;
                    }
                },
                template: {element: 'cart-add'}
            });
        }
    };

    var AddModel = function (config) {

        var self = this;

        self.id = ko.observable(null);

        /**
         * krepselyje esanciu prekiu kiekis
         */
        self.quantity = ko.observable(0);

        /**
         * 
         */
        self.loading = ko.observable(null);

        /**
         * url - krepselio papildymui
         */
        self.url = ko.observable(null);

        /**
         * url - pasalinimas is krepselio
         */
        self.removeUrl = ko.observable(null);

        self.cartViewUrl = ko.observable(null);

        /**
         * modelio id
         */
        self.mid = ko.observable(null);

        /**
         * modelio klase
         */
        self.mch = ko.observable(null);

        /**
         * combination modelio id
         */
        self.cmid = ko.observable(null);

        /**
         * combination modelio klase
         */
        self.cmch = ko.observable(null);

        /**
         * viso vnt kiekis krepslyje
         */
        self.totalQuantity = ko.observable(0);

        /**
         * viso prekiu kiekis krepslyje
         */
        self.count = ko.observable(0);

        /**
         * 
         */
        self.messages = ko.observableArray([]);

        /**
         * items suma 
         */
        self.totalAmount = ko.observable(0);

        /**
         * view tipas (listas, produkto vidinis,...)
         */
        self.type = ko.observable(0);

        /**
         * 
         */
        self.domain = ko.observable(null);

        /**
         * 
         */
        self.service = ko.observable(null);

        /**
         * 
         */
        self.productType = ko.observable(null);

        /**
         * 
         */
        self.period = ko.observable(null);

        /**
         * 
         */
        self.xhr = null;

        self.add = function () {

            if (self.xhr !== null) {
                return;
            }

            self.messages([]);
            self.errors = [];


            var requestData = {
                mid: self.mid(),
                mch: self.mch(),
                options: {}
            };

            if (self.cmid() !== null) {
                requestData.options.cmid = self.cmid();
                requestData.options.cmch = self.cmch();
            }

            if (self.domain() !== null) {
                requestData.options.domain = self.domain();
            }

            if (self.service() !== null) {
                requestData.options.service = self.service();
            }

            if (self.productType() !== null) {
                requestData.options.productType = self.productType();
            }

            if (self.period() !== null) {
                requestData.options.period = self.period();
            }

            if (requestData.quantity === 0) {
                self.messages.push(pub.product.messageZeroQuantity);
            }

            var event = $.Event("rinup.cart.before-add");
            $(rinup).trigger(event, {model: self});
            if (event.result === false) {
                rinup.warn('rinup.cart.before-add grazino false reiksme');
                return;
            }

            if (self.messages().length) {
                return;
            }

            self.loading(true);
            self.xhr = $.ajax({
                method: 'POST',
                url: self.url(),
                data: requestData
            }).done(function (response, textStatus, jqXHR) {
                if (response.status === rinup.RESPONSE_OK) {
                    var data = response.data;
                    rinup.helpers.model.load(self, data.item);
                    if (data.cart.redirectUrl) {
                        window.location.href = data.cart.redirectUrl;
                    }
                } else {
                    $.each(response.errorMessages, function (k, v) {
                        self.messages.push(v);
                    });
                }

                $(rinup).trigger("rinup.cart.add", {model: self, response: response});
            }).always(function (response, textStatus, errorThrown) {
                self.loading(false);
                self.xhr = null;
            });
        };

        self.remove = function () {

            if (self.xhr !== null) {
                return;
            }

            self.messages([]);
            self.errors = [];

            var requestData = {
                mid: self.mid(),
                mch: self.mch(),
                options: {}
            };

            if (self.cmid() !== null) {
                requestData.options.cmid = self.cmid();
                requestData.options.cmch = self.cmch();
            }

            if (self.domain() !== null) {
                requestData.options.domain = self.domain();
            }

            if (self.service() !== null) {
                requestData.options.service = self.service();
            }

            if (self.productType() !== null) {
                requestData.options.productType = self.productType();
            }

            if (requestData.quantity === 0) {
                self.messages.push(pub.product.messageZeroQuantity);
            }

            var event = $.Event("rinup.cart.before-remove");
            $(rinup).trigger(event, {model: self});
            if (event.result === false) {
                rinup.warn('rinup.cart.before-remove grazino false reiksme');
                return;
            }

            if (self.messages().length) {
                return;
            }

            self.loading(true);
            self.xhr = $.ajax({
                method: 'POST',
                url: self.removeUrl(),
                data: requestData
            }).done(function (response, textStatus, jqXHR) {
                if (response.status === rinup.RESPONSE_OK) {
                    rinup.helpers.model.load(self, response.data.item);
                } else {
                    rinup.helpers.model.load(self, response.data.item);
                    $.each(response.errorMessages, function (k, v) {
                        self.messages.push(v);
                    });
                }

                $(rinup).trigger("rinup.cart.remove", {model: self, response: response});
            }).always(function (response, textStatus, errorThrown) {
                self.loading(false);
                self.xhr = null;
            });
        };

        var init = function (config) {
            rinup.helpers.model.load(self, config);

            if (!config.url) {
                self.url(pub.product.addUrl);
            }

            if (!config.removeUrl) {
                self.removeUrl(pub.product.removeUrl);
            }

            if (!config.cartViewUrl) {
                self.cartViewUrl(pub.product.cartViewUrl);
            }


        };

        init(config);
    };

    var HeaderBoxModel = function (config) {
        var self = this;

        self.$elem = null;
        self.items = ko.observableArray([]);
        self.xhr = null;
        self.loadUrl = ko.observable(null);
        self.removeUrl = ko.observable(null);
        self.removeAllUrl = ko.observable(null);
        self.totalQuantity = ko.observable(0);
        self.totalAmount = ko.observable(0);
        self.loading = ko.observable(true);
        self.isLoaded = ko.observable(false);
        self.maxVisibleItems = ko.observable(5);
        self.showAll = ko.observable(false);
        /**
         * busena - dedama i krepseli ir pan.
         */
        self.status = ko.observable(null);

        // messages
        self.messageRemove = ko.observable(null);
        self.messageRemoveAll = ko.observable(null);

        self.amount = ko.computed(function () {
            var amount = 0;
            self.items().forEach(function (item) {
                amount += item.amount();
            });
            return amount;
        });

        self.load = function () {

            if (!self.isLoaded()) {
                if (self.xhr) {
                    self.xhr.abort();
                }

                self.loading(true);

                self.xhr = $.ajax({
                    url: self.loadUrl()
                }).done(function (response, textStatus, jqXHR) {
                    if (response.status === rinup.RESPONSE_OK) {
                        self.totalQuantity(response.data.cart.totalQuantity);
                        self.totalAmount(response.data.cart.totalAmount);

                        self.items.removeAll();
                        $.each(response.data.items, function (k, v) {
                            var model = new HeaderBoxItemModel(v);
                            model.headerBoxModel = self;
                            self.items.push(model);
                        });
                    }
                }).always(function (response, textStatus, errorThrown) {
                    self.isLoaded(true);
                    self.xhr = null;
                    self.loading(false);
                });
            }
        };

        self.remove = function (item) {
            rinup.confirm(self.messageRemove(), function () {

                var requestData = {
                    id: item.id()
                };

                if (self.xhr) {
                    self.xhr.abort();
                }

                self.loading(true);
                self.xhr = $.ajax({
                    url: self.removeUrl(),
                    data: requestData
                }).done(function (response, textStatus, jqXHR) {
                    if (response.status === rinup.RESPONSE_OK) {
                        self.totalQuantity(response.data.cart.totalQuantity);
                        self.totalAmount(response.data.cart.totalAmount);
                        $(rinup).trigger("rinup.cart.remove", {item: item, model: self});
                    }
                }).always(function (response, textStatus, errorThrown) {
                    self.items.removeAll();
                    self.isLoaded(false);
                    self.xhr = null;
                    self.loading(false);
                    self.load();
                });
            });
        };

        self.removeAll = function () {
            rinup.confirm(self.messageRemoveAll(), function () {

                if (self.xhr) {
                    self.xhr.abort();
                }

                self.loading(true);
                self.xhr = $.ajax({
                    url: self.removeAllUrl(),
                }).done(function (response, textStatus, jqXHR) {
                    if (response.status === rinup.RESPONSE_OK) {
                        self.totalQuantity(response.data.cart.totalQuantity);
                        self.totalAmount(response.data.cart.totalAmount);
                        self.items.removeAll();
                        $(rinup).trigger("rinup.cart.remove", {model: self, response: response});
                    }

                }).always(function (response, textStatus, errorThrown) {
                    self.xhr = null;
                    self.loading(false);
                });
            });
        };

        self.toggleShowAll = function (e) {
            self.showAll(!self.showAll());
        };

        self.visibleShowAllButton = function () {
            return !self.showAll() && self.items().length > self.maxVisibleItems();
        };

        self.hasItems = function () {
            return self.items().length > 0;
        };

        var init = function (config) {

            config = $.extend({
                loadUrl: pub.headerBox.loadUrl,
                removeUrl: pub.headerBox.removeUrl,
                removeAllUrl: pub.headerBox.removeAllUrl,
                totalQuantity: 0,
                totalAmount: 0,
                messageRemove: '',
                messageRemoveAll: '',
                maxVisibleItems: 5
            }, config);

            self.messageRemove(config.messageRemove);
            self.messageRemoveAll(config.messageRemoveAll);
            self.loadUrl(config.loadUrl);
            self.removeUrl(config.removeUrl);
            self.removeAllUrl(config.removeAllUrl);
            self.totalQuantity(config.totalQuantity);
            self.totalAmount(config.totalAmount);
            self.maxVisibleItems(config.maxVisibleItems);

            $(rinup).on("rinup.cart.change", function (e, data) {
                self.items.removeAll();
                self.isLoaded(false);
                self.totalQuantity(data.model.totalQuantity());
                self.totalAmount(data.model.totalAmount());
            });

            $(rinup).on("rinup.cart.add", function (e, data) {
                self.items.removeAll();
                self.isLoaded(false);
                self.totalQuantity(data.model.totalQuantity());
                self.totalAmount(data.model.totalAmount());
            });

            $(rinup).on("rinup.cart.remove", function (e, data) {
                if (data.model !== self) {
                    self.items.removeAll();
                    self.isLoaded(false);
                    self.totalQuantity(data.model.totalQuantity());
                    self.totalAmount(data.model.totalAmount());
                }
            });

            $(rinup).on("rinup.cart.removeAll", function (e, data) {
                self.items.removeAll();
                self.isLoaded(false);
                self.totalQuantity(0);
                self.totalAmount(0);
            });
        };

        init(config);
    };

    var HeaderBoxItemModel = function (config) {
        var self = this;

        self.headerBoxModel = null;
        self.url = ko.observable(null);
        self.title = ko.observable(null);
        self.label = ko.observable(null);
        self.amount = ko.observable(0);
        self.grandTotal = ko.observable(0);
        self.quantity = ko.observable(0);
        self.measureTitle = ko.observable(null);
        self.image = ko.observable(null);
        self.id = ko.observable(null);
        self.productType = ko.observable(null);
        self.service = ko.observable(null);
        self.domain = ko.observable(null);
        self.services = ko.observableArray([]);
        self.baseGrandTotal = ko.observable(0);

        self.remove = function () {
            self.headerBoxModel.remove(self);
        };

        self.visible = function (index) {
            if (self.headerBoxModel && (index < self.headerBoxModel.maxVisibleItems() || self.headerBoxModel.showAll())) {
                return true;
            } else {
                return false;
            }
        };

        self.setServices = function (items) {
            self.services(items);
        };

        self.hasGrandDiscount = function () {
            return self.baseGrandTotal() > self.grandTotal();
        };

        var init = function (config) {
            rinup.helpers.model.load(self, config);
        };


        init(config);
    };

    var ViewModel = function (config) {
        var self = this;

        self.$elem = null;
        self.itemClass = null;
        self.loading = ko.observable(false);
        self.items = ko.observableArray([]);
        self.removeUrl = ko.observable(null);
        self.removeAllUrl = ko.observable(null);
        self.changeUrl = ko.observable(null);
        self.grandTotalTE = ko.observable(0);
        self.taxes = ko.observableArray([])
        self.grandTotalTI = ko.observable(0);
        self.totalQuantity = ko.observable(0);
        self.totalAmount = ko.observable(0);
        self.xhr = null;

        /**
         * MESSAGES
         */
        self.messageRemove = ko.observable(null);
        self.messageRemoveAll = ko.observable(null);

        self.hasItems = function () {
            return self.items().length;
        };

        self.change = function (item, sender) {
            var requestData = item.getRequestData();
            var url = rinup.url.toParams(self.changeUrl(), {id: item.id()});

            item.messages([]);
            self.loading(true);
            self.xhr = $.post(url, requestData)
                    .done(function (response, textStatus, jqXHR) {
                        if (response.status === rinup.RESPONSE_OK) {
                            var itemData = response.data.item;
                            delete itemData.id;
                            rinup.helpers.model.load(item, itemData);
                            rinup.helpers.model.load(self, response.data.cart);
                        } else {
                            if (response.errorMessages.items) {
                                self.$elem.yiiActiveForm('updateMessages', response.errorMessages.items, true);
                            } else {
                                if (response.errorMessages) {
                                    item.messages(response.errorMessages);
                                }
                            }
                        }

                        $(rinup).trigger("rinup.cart.change", {
                            item: item,
                            model: self,
                            sender: sender
                        });

                    })
                    .always(function (response, textStatus, errorThrown) {
                        self.loading(false);
                        self.xhr = null;
                    });

        };

        self.remove = function (item) {
            rinup.confirm(self.messageRemove(), function () {
                var requestData = item.getRequestData();
                var url = rinup.url.toParams(self.removeUrl(), {id: item.id()});

                item.messages([]);
                self.loading(true);
                self.xhr = $.post(url, requestData)
                        .done(function (response, textStatus, jqXHR) {
                            var id = item.id();
                            if (response.status === rinup.RESPONSE_OK) {
                                item.$elem.remove();
                                self.items.remove(item);
                                rinup.helpers.model.load(self, response.data.cart);
                                $(rinup).trigger("rinup.cart.remove", {item: item, model: self});
                            } else {
                                self.$elem.yiiActiveForm('updateMessages', response.errorMessages, true);
                            }

                            self.removeByOwnerId(id);

                        })
                        .always(function (response, textStatus, errorThrown) {
                            self.loading(false);
                            self.xhr = null;
                        });
            });
        };

        self.removeByOwnerId = function (id) {
            self.items().forEach(function (item) {
                if (item.ownerId() == id) {
                    self.items.remove(item);
                }
            });
        };

        self.removeAll = function () {

            rinup.confirm(self.messageRemoveAll(), function () {

                var url = self.removeAllUrl();

                self.loading(true);
                self.xhr = $.post(url)
                        .done(function (response, textStatus, jqXHR) {
                            if (response.status === rinup.RESPONSE_OK) {
                                self.items().forEach(function (item) {
                                    item.$elem.remove();
                                });

                                self.items.removeAll();
                                rinup.helpers.model.load(self, response.data.cart);
                                $(rinup).trigger("rinup.cart.remove", {model: self});
                            } else {

                            }

                        })
                        .always(function (response, textStatus, errorThrown) {
                            self.loading(false);
                            self.xhr = null;
                        });
            });
        };

        self.totalTax = ko.computed(function () {
            var amount = 0;
            self.taxes().forEach(function (item) {
                amount += item.amount;
            });
            return amount;
        });

        var init = function (config) {

            config = $.extend({
                items: {},
                itemClass: null,
                removeUrl: pub.view.removeUrl,
                removeAllUrl: pub.view.removeAllUrl,
                changeUrl: pub.view.changeUrl,
                messageRemove: '',
                messageRemoveAll: '',
                grandTotalTE: 0,
                taxes: [],
                grandTotalTI: 0,
                totalQuantity: 0,
                totalAmount: 0
            }, config);

            self.itemClass = config.itemClass;
            self.changeUrl(config.changeUrl);
            self.removeUrl(config.removeUrl);
            self.removeAllUrl(config.removeAllUrl);
            self.grandTotalTE(config.grandTotalTE);
            self.grandTotalTI(config.grandTotalTI);
            self.taxes(config.taxes);
            self.totalQuantity(config.totalQuantity);
            self.messageRemove(config.messageRemove);
            self.messageRemoveAll(config.messageRemoveAll);
            self.totalAmount(config.totalAmount)


            $.each(config.items, function (k, v) {
                var model;
                if (v.productType === 'domain') {
                    model = new ViewItemDomainModel(v);
                }

                if (v.productType === 'hosting') {
                    model = new ViewItemHostingModel(v);
                }

                if (
                        v.productType === 'cloud_server'
                        || v.productType === 'eshop'
                        || v.productType === 'website'
                        || v.productType === 'email'
                        || v.productType === 'ssl'
                        || v.productType === 'dedicated_server'
                        || v.productType === 'virtual_dedicated_server'
                        ) {
                    model = new ViewItemProductModel(v);
                }

                if (!model) {
                    rinup.warn('nenustatytas productType [id:' + v.id + ']');
                    model = new ViewItemModel(v);
                }

                var $elem = $('.' + self.itemClass + '[data-id="' + v.id + '"]');

                if ($elem.length) {
                    model.$elem = $elem;
                    model.viewModel = self;

                    ko.applyBindings(model, $elem.get(0));
                    self.items.push(model);
                }

            });

        };

        init(config);
    };

    var ViewItemModel = function (config) {
        var self = this;
        self.viewModel = null;
        self.$elem = null;
        self.id = ko.observable(null);
        self.ownerId = ko.observable(null);
        self.total = ko.observable(0);
        self.messages = ko.observableArray([]);

        var init = function (config) {
            rinup.helpers.model.load(self, config);
        };

        self.change = function () {

        };

        self.remove = function () {
            self.viewModel.remove(self);
        };

        self.getRequestData = function () {

        };

        init(config);
    };

    var ViewItemHostingModel = function (config) {
        var self = this;

        self.$elem = null;
        self.viewModel = null;
        self.id = ko.observable(null);
        self.ownerId = ko.observable(null);
        self.total = ko.observable(0);
        self.grandTotal = ko.observable(0);
        self.baseGrandTotal = ko.observable(0);


        self.messages = ko.observableArray([]);

        var init = function (config) {
            rinup.helpers.model.load(self, config);
        };

        self.change = function () {
            self.viewModel.change(self);
        };

        self.remove = function () {
            self.viewModel.remove(self);
        };

        self.getRequestData = function () {
            return $('input,select', self.$elem).serialize();
        };

        init(config);
    };

    var ViewItemDomainModel = function (config) {
        var self = this;

        self.$elem = null;
        self.viewModel = null;
        self.id = ko.observable(null);
        self.ownerId = ko.observable(null);
        self.localPresenceAmount = ko.observable(0);
        self.privacyProtectionAmount = ko.observable(0);
        self.total = ko.observable(0);
        self.grandTotal = ko.observable(0);
        self.baseGrandTotal = ko.observable(0);


        self.messages = ko.observableArray([]);

        var init = function (config) {
            rinup.helpers.model.load(self, config);
        };

        self.change = function (sender) {
            self.viewModel.change(self, sender);
        };

        self.remove = function () {
            self.viewModel.remove(self);
        };

        self.getRequestData = function () {
            return $('input,select', self.$elem).serialize();
        };

        self.hasGrandDiscount = function () {
            return self.baseGrandTotal() > self.grandTotal();
        };

        init(config);
    };

    var ViewItemProductModel = function (config) {
        var self = this;

        self.$elem = null;
        self.viewModel = null;
        self.id = ko.observable(null);
        self.ownerId = ko.observable(null);
        self.total = ko.observable(0);
        self.grandTotal = ko.observable(0);
        self.baseGrandTotal = ko.observable(0);
        self.serviceTitle = ko.observable(null);


        self.messages = ko.observableArray([]);

        var init = function (config) {
            rinup.helpers.model.load(self, config);
        };

        self.change = function () {
            self.viewModel.change(self);
        };

        self.remove = function () {
            self.viewModel.remove(self);
        };

        self.getRequestData = function () {
            return $('input,select', self.$elem).serialize();
        };

        init(config);
    };

    return pub;
})(jQuery);
