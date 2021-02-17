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
//>	@class	EditorTypeItem
// FormItem intended for selecting alternate editor types.
//
// @inheritsFrom SelectItem
// @visibility tools
//<
isc.ClassFactory.defineClass("EditorTypeItem", "SelectItem");
isc.EditorTypeItem.addClassProperties({
    _alternateEditors: {
        "text": [
            { title: "Text", className: "TextItem" },
            { title: "Text Area", className: "TextAreaItem" }
            // RichTextItem module is not loaded in VB by default
            // { title: "Rich Text", className: "RichTextItem" }
        ],
        "integer": [
            { title: "Integer", className: "IntegerItem" },
            { title: "Slider", className: "SliderItem" },
            { title: "Spinner", className: "SpinnerItem" }
        ],
        "float": [
            { title: "Float", className: "FloatItem" },
            { title: "Slider", className: "SliderItem" },
            { title: "Spinner", className: "SpinnerItem" }
        ],
        "date": [
            { title: "Date", className: "DateItem" },
            { title: "Relative Date", className: "RelativeDateItem" }
        ],
        "time": [
            { title: "Date", className: "DateItem" },
            { title: "Relative Date", className: "RelativeDateItem" }
        ],
        "enum": [
            { title: "Select", className: "SelectItem" },
            { title: "Radio Buttons", className: "RadioGroupItem" },
            { title: "Combo Box", className: "ComboBoxItem" },
            { title: "Multi Combo Box", className: "MultiComboBoxItem" }
        ]
    }
});

isc.EditorTypeItem.addMethods({

    width: "*",
    displayField: "title",
    valueField: "className",
    emptyPickListMessage: "No alternate editors",

    setValue : function (newValue) {
        this.assignDataSource();
        var isDataBound = this.isDataBound(),
            hasChoices = false,
            prompt = (!isDataBound ? "Editor type is changed by dragging a new component into place" : null)
        ;
        if (isDataBound) {
            hasChoices = (this.optionDataSource.getCacheData().length > 0);
            prompt = "No other editors are available for the current data type";
        }
        this.setDisabled(!hasChoices);
        this.setPrompt(prompt);
        return this.Super("setValue", arguments);
    },

    destroy : function () {
        if (this.optionDataSource) {
            this.optionDataSource.destroy();
            this.optionDataSource = null;
        }
        this.Super("destroy", arguments);
    },

    getLiveComponent : function () {
        return (this.form && this.form.currentComponent ? this.form.currentComponent.liveObject : null);
    },

    getLiveComponentType : function () {
        var currentComponent = this.getLiveComponent(),
            type = currentComponent.type
        ;
        if (currentComponent.form) {
            var form = currentComponent.form,
                ds = form.getDataSource()
            ;
            if (ds) {
                var field = ds.getField(currentComponent.name);
                if (field) {
                    type = field.type;
                }
            }
        }
        // A text or integer field can have a valueMap or optionDataSource thus creating
        // an "enum" type. Use this type to narrow editor choices.
        if (currentComponent.valueMap || currentComponent.optionDataSource) {
            type = "enum";
        }
        return type;
    },

    isDataBound : function () {
        var currentComponent = this.getLiveComponent(),
            ds = (currentComponent && currentComponent.form ? currentComponent.form.getDataSource() : null)
        ;
        return (ds != null);
    },

    assignDataSource : function () {
        if (!this.optionDataSource) {
            var dsID = this.ID + "_ods";
            this.optionDataSource = isc.DataSource.create({
                ID: dsID,
                clientOnly: true,
                fields: [
                    { name: "title", type: "string" },
                    { name: "className", type: "string" }
                ]
            });
        }

        var type = this.getLiveComponentType();

        this.optionDataSource.setCacheData([]);
        if (type) {
            var altEditors = isc.EditorTypeItem._alternateEditors[type];
            if (altEditors) {
                var cacheData = [
                    { title: "Available editors for data type \"" + type + "\"", enabled: false }
                ];
                cacheData.addList(altEditors);
                this.optionDataSource.setCacheData(cacheData);
            }
        }
    }
});
