/*

  SmartClient Ajax RIA system
  Version v12.1p_2021-02-17/LGPL Deployment (2021-02-17)

  Copyright 2000 and beyond Isomorphic Software, Inc. All rights reserved.
  "SmartClient" is a trademark of Isomorphic Software, Inc.

  LICENSE NOTICE
     INSTALLATION OR USE OF THIS SOFTWARE INDICATES YOUR ACCEPTANCE OF
     ISOMORPHIC SOFTWARE LICENSE TERMS. If you have received this file
     without an accompanying Isomorphic Software license file, please
     contact licensing@isomorphic.com for details. Unauthorized copying and
     use of this software is a violation of international copyright law.

  DEVELOPMENT ONLY - DO NOT DEPLOY
     This software is provided for evaluation, training, and development
     purposes only. It may include supplementary components that are not
     licensed for deployment. The separate DEPLOY package for this release
     contains SmartClient components that are licensed for deployment.

  PROPRIETARY & PROTECTED MATERIAL
     This software contains proprietary materials that are protected by
     contract and intellectual property law. You are expressly prohibited
     from attempting to reverse engineer this software or modify this
     software for human readability.

  CONTACT ISOMORPHIC
     For more information regarding license rights and restrictions, or to
     report possible license violations, please contact Isomorphic Software
     by email (licensing@isomorphic.com) or web (www.isomorphic.com).

*/
//>	@class	MeasureItem
// FormItem intended for inputting measurement values like width and height where the value
// can be a fixed numeric number or a percent (%) or expand-to-fill (*).
//
// @inheritsFrom TextItem
// @visibility tools
//<
isc.ClassFactory.defineClass("MeasureItem", "TextItem");
isc.MeasureItem.addProperties({
    changeOnKeypress: false,
    redrawOnChange: true,
    canTabToIcons: false
});

isc.MeasureItem.addMethods({

    drawing : function (itemVisibilityChanged) {
        this.setIcons();
        this.Super("drawing", arguments);
    },

    redrawing : function () {
        this.setIcons();
        this.Super("redrawing", arguments);
    },

    // Editable value should always be the user value - not the current, derived value
    mapValueToDisplay : function (value, recursed, includeValueIcons) {
        return this.getUserValue(this.name);
    },

    storeValue : function (value) {
        // Remove any entered quotation marks
        if (value != null && isc.isA.String(value)) value = value.replaceAll("\"", "");
        return this.Super("storeValue", [value]);
    },

    setIcons : function () {
        var value = this.getUserValue(this.name),
            derivedValue = this.getDerivedValue(this.name)
        ;
        this.icons = this.getDerivedValueIcons(derivedValue, value);
        this._setUpIcons();
    },

    getLiveComponent : function () {
        return (this.form && this.form.currentComponent ? this.form.currentComponent.liveObject : null);
    },

    getUserValue : function (name) {
        var component = this.getLiveComponent(),
            editNode = (component ? component.editNode : null),
            defaults = (editNode ? editNode.defaults : {}),
            userValue = defaults[name]
        ;
        return userValue || "";
    },

    getDerivedValue : function (name) {
        var component = this.getLiveComponent(),
            derivedValue = (component && component.getProperty ? component.getProperty(name) : this.getValue())
        ;
        if (derivedValue == "undefined") derivedValue = null;

        return derivedValue;
    },

    isPercent : function (value) {
        if (value != null && isc.isA.String(value)) value = value.replaceAll("\"", "");
        return (isc.isA.String(value) && value.length > 0 && "%" == value.substring(value.length-1,value.length));
    },

    isExpand : function (value) {
        if (value != null && isc.isA.String(value)) value = value.replaceAll("\"", "");
        return ("*" == value);
    },

    getDerivedValueIcons : function (derivedValue, value) {
        if (derivedValue == null || value == null) return null;
        var icon = {
            name: "derivedValue",
            text: derivedValue,
            width: 24,
            inline: true,
            inlineIconAlign: "right",
            baseStyle: "measureItemCurrentValue",   // In visualBuilder.css
            neverDisable: true,
            showFocused: false,
            showOver: false,
            prompt: "Current value based on configured value of '" + value + "'"
        };
        return [icon];
    }
});

//>	@class	FormFieldMeasureItem
// FormItem intended for inputting measurement values like width where the value
// can be a fixed numeric number or expand-to-fill (*). Percent (%) is not accepted.
//
// @inheritsFrom MeasureItem
// @visibility tools
//<
isc.ClassFactory.defineClass("FormFieldMeasureItem", "MeasureItem");
isc.FormFieldMeasureItem.addProperties({
    keyPressFilter: "[0-9\*]"
});
