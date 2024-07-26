ko.bindingHandlers.fadeVisible = {
    init: function (element, valueAccessor) {
        // Initially set the element to be instantly visible/hidden depending on the value
        var value = valueAccessor();
        $(element).toggle(ko.unwrap(value)); // Use "unwrapObservable" so we can handle values that may or may not be observable
    },
    update: function (element, valueAccessor) {
        // Whenever the value subsequently changes, slowly fade the element in or out
        var value = valueAccessor();
        ko.unwrap(value) ? $(element).stop(true, true).fadeIn() : $(element).fadeOut();
    }
};

ko.bindingHandlers.stopBinding = {
    init: function () {
        return {controlsDescendantBindings: true};
    }
};

ko.virtualElements.allowedBindings.stopBinding = true;

ko.extenders.numeric = function(target, precision) {
    //create a writable computed observable to intercept writes to our observable
    var result = ko.pureComputed({
        read: target,  //always return the original observables value
        write: function(newValue) {
            var current = target(),
                roundingMultiplier = Math.pow(10, precision),
                newValueAsNum = isNaN(newValue) ? 0 : +newValue,
                valueToWrite = Math.round(newValueAsNum * roundingMultiplier) / roundingMultiplier;
 
            //only write if it changed
            if (valueToWrite !== current) {
                target(valueToWrite);
            } else {
                //if the rounded value is the same, but a different value was written, force a notification for the current field
                if (newValue !== current) {
                    target.notifySubscribers(valueToWrite);
                }
            }
        }
    }).extend({ notify: 'always' });
 
    //initialize with current value to make sure it is rounded appropriately
    result(target());
 
    //return the new computed observable
    return result;
};