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
//>	@class	LayoutAlignItem
// FormItem intended for selecting the appropriate layoutAlign value based on context.
//
// @inheritsFrom SelectItem
// @visibility tools
//<
isc.ClassFactory.defineClass("LayoutAlignItem", "SelectItem");
isc.LayoutAlignItem.addMethods({

    width: "*",

    mapValueToDisplay : function (value, recursed, includeValueIcons) {
        var isApplicable = this.isApplicable();
        this.setDisabled(!isApplicable);
        if (!isApplicable) return "[inapplicable]";
        if (value == null) {
            value = this.getDefaultLayoutAlign();
        }
        return value;
    },

    setValue : function (newValue) {
        var valueMap = this.getAlignmentValueMap();
        this.valueMap = valueMap;
        return this.Super("setValue", arguments);
    },

    storeValue : function (newValue) {
        var defaultLayoutAlign = this.getDefaultLayoutAlign();
        if (newValue == defaultLayoutAlign) newValue = null;
        this.Super("storeValue", [newValue]);
    },

    getLiveComponent : function () {
        return (this.form && this.form.currentComponent ? this.form.currentComponent.liveObject : null);
    },

    getParentLiveComponent : function () {
        var currentComponent = this.getLiveComponent();
        return (currentComponent ? currentComponent.getParentCanvas() : null);
    },

    isApplicable : function () {
        var parentComponent = this.getParentLiveComponent();
        return (parentComponent && isc.isA.Layout(parentComponent));
    },

    getAlignmentValueMap : function () {
        var parentComponent = this.getParentLiveComponent();
        if (!parentComponent) return null;
        var vertical = parentComponent.vertical || (parentComponent.orientation == "vertical"),
            valueMap = []
        ;
        if (vertical) valueMap = ["left", "center", "right"];
        else valueMap = ["top", "center", "bottom"];
        return valueMap;
    },

    getDefaultLayoutAlign : function () {
        var parentComponent = this.getParentLiveComponent(),
            vertical = parentComponent.vertical || (parentComponent.orientation == "vertical")
        ;
        return parentComponent.defaultLayoutAlign || (vertical ? "left" : "top");
    }
});
