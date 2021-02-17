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
//>	@class	ImageChooserItem
// Form item for selecting an image via a pop-up +link{ImagePicker}.
//
// @inheritsFrom TextItem
// @treeLocation Client Reference/Forms/Form Items
// @visibility tools
//<
isc.defineClass("ImageChooserItem", "TextItem");
isc.ImageChooserItem.addProperties({
	_elementIsReadOnly : function () {
	    return true;
    },
    changeOnKeypress:false,
    
    textColor: "#999999",
    
    disableIconsOnReadOnly: false,
    
    updatePickerIconOnOver: false,
    
    formatOnBlur: true,
    formatOnFocusChange: true,

    pickerWindowDefaults: {
        _constructor: "Window",
        canDragResize: true,
        canDragMove: true,
        autoSize: true,
        isModal: true,
        showMinimizeButton: false,
        modalMaskOpacity: 0
    },
    
    //> @attr imageChooserItem.pickerTitle (String : "Image Picker" : IR)
    // The title for the +link{formItem.picker, picker window}.
    // @group i18nMessages
    // @visibility tools
    //<
    pickerTitle: "Image Picker",

    //> @attr imageChooserItem.picker (AutoChild ImagePicker : null : [IRW])
    // The +link{class:ImagePicker, imagePicker} displayed when +link{showPicker()} is called 
    // due to a click on the +link{formItem.showPickerIcon, picker icon}.
    // @visibility tools
    //<
    pickerConstructor: "ImagePicker",
    pickerDefaults: {
        autoDraw: false,
        // ImagePickers fire accept/CancelSelection() notifications for Ok and Cancel buttons
        acceptSelection : function (imageRecord) { 
            this.callingFormItem._pickerImageSelected(imageRecord) 
        },
        cancelSelection : function () {
            this.callingFormItem._pickerCancelled();
        }
    },

    //> @attr imageChooserItem.showPickerIcon (Boolean : true : IRW)
    // Should the picker icon be shown for choosing an image from an +link{class:ImagePicker}?
    // @visibility tools
    //<
    showPickerIcon: true,
    
    // separate the icon from the dataElement a bit
    pickerIconHSpace: 2,

    pickerIconPrompt: "Click to select an image",

    pickerIconDefaults: {
        showOver: false,
        showFocused: false
    },

    //> @attr imageChooserItem.clearValueIcon (Autochild FormItemIcon : null : IRW)
    // +link{autoChild,AutoChild} FormItemIcon that clears this item's value when clicked.  
    // Only visible when the item has a value.  The icon is generated automatically and can be
    // customized via +link{imageChooserItem.clearValueIconProperties, the AutoChild pattern}.
    // @visibility tools
    //<
    clearValueIconDefaults: {
        // "clear" icon - just an x 
        text: "&#x2715;",
        width: 12,
        inline: true,
        inlineIconAlign: "right",
        neverDisable: true,
        showFocused: false,
        showOver: false,
        prompt: "Clear the current value",
        showIf: "return false;",
        click : function (form, item, icon) {
            item.clearValue();
        }
    },
    //> @attr imageChooserItem.clearValueIconProperties (FormItemIcon Properties : null : IRW)
    // FormItemIcon properties to apply to the automatically generated +link{clearValueIcon}
    // +link{autoChild,AutoChild}.
    // @visibility tools
    //<
    
    init : function () {
        // set up the clearValue icon, initially hidden
        this.icons = [isc.addProperties({}, 
            this.clearValueIconDefaults, this.clearValueIconProperties, 
            { name: "clearValue" }
        )];
        this.Super("init", arguments);
    },

    mapValueToDisplay : function (value) {
        // if the value is a stockIcon, the object returned by getImageProperties() will 
        // have a "name" attribute - show [name] instead of the actual value
        if (!value || value == "") return "";
        var sI = this.getImageProperties();
        if (sI) {
            var result = !sI.name ? sI.src : "[" + sI.name + "]";
            return result;
        }
        return value;
    },

    //> @attr imageChooserItem.showActionIcons (boolean : true : IR)
    // When true, the picker shows a section containing the standard framework Action icons.
    // @visibility tools
    //<
    showActionIcons: true,

    //> @attr imageChooserItem.showHeaderIcons (boolean : true : IR)
    // When true, the picker shows a section containing the standard framework Header icons.
    // @visibility tools
    //<
    showHeaderIcons: true,

    //> @attr imageChooserItem.showCustomImages (Boolean : null : IR)
    // When true, the picker shows a +link{imagePicker.customImagesTitle, Custom Images} 
    // section containing the specified +link{imagePicker.customImages, images}.
    // @visibility internal
    //<

    // use a local picker by default
    useSharedPicker: false,

    // Override 'showPicker'
    showPicker : function () {
        var props = isc.addProperties({}, this.pickerDefaults, this.pickerProperties);
        if (this.useSharedPicker) {
            // use the shared imagePicker - false by default
            this.picker = isc.ImagePicker.getSharedImagePicker(props);
        } else if (!this.picker) {
            // picker not yet created
            this.picker = isc.ImagePicker.create(props);
        }

        if (!this.pickerWindow) {
            // initialize the pickerWindow that houses the ImagePicker layout
            this.pickerWindow = this.createAutoChild("pickerWindow", 
                { title: this.pickerTitle, items: [ this.picker ] }
            );
        }

        var picker = this.picker;

        var oldItem = picker.callingFormItem;
        if (oldItem != this) {
            picker.callingFormItem = this;
            picker.callingForm = this.form;
        }

        // select the current image in the picker or clear selection there
        var imageRecord = this.getImageProperties();
        picker.selectImage(imageRecord);
        this.pickerWindow.moveTo(0, -1000);
        this.pickerWindow.show();
        this.pickerWindow.placeNear(isc.EH.getX(), isc.EH.getY());
    },

    //> @method imageChooserItem.pickerCancelled()
    // Notification method fired when this item's picker is cancelled.
    // @visibility tools
    //<
    _pickerCancelled : function () {
        this.pickerWindow.hide();
        if (this.pickerCancelled) {
            // public notification
            this.pickerCancelled();
        }
    },

    //> @method imageChooserItem.pickerImageSelected()
    // Notification method fired when a new image is selected from this item's picker.
    // @param imageRecord (Record) the properties for the currently selected image
    // @visibility tools
    //<

    _pickerImageSelected : function (imageRecord) {
        this.pickerWindow.hide();
        this.setImageRecord(imageRecord);
        if (this.pickerImageSelected) {
            // public notification
            this.pickerImageSelected(this.imageRecord);
        }
    },

    // setImageRecord() - updates the imageRecord and value (URL/src) for this item
    setImageRecord : function (imageRecord) {
        this.imageRecord = imageRecord;
        this.setValue(this.imageRecord && this.imageRecord.src);
    },

    itemHoverHTML : function (item, form) {
        if (!item.imageRecord) return;
        var iR = item.imageRecord;
        var html = isc.Canvas.imgHTML(iR.src) + "<br>" + iR.src;
        return html;
    },

    // override setValue to update the icon
    setValue : function (value, b, c, d) {
        // If passed an invalid URL just refuse to accept it - revert to the current _value
        if (value != null && value != "") {
            if (!this._isValidURL(value)) {
                value = this._value;
            }
        }
        // save the value and update the display
        this.storeValue(value, true);
        return value;
    },

    // When our value is changed (via user interaction or 'setValue()' call), update
    // the clear icon visibility
    saveValue : function () {
        this.Super("saveValue", arguments);
        if (this.getValue() != null) this.showIcon("clearValue");
        else this.hideIcon("clearValue");
    },

    clearValue : function () {
        // clear out the imageRecord
        this.imageRecord = null;
        this.Super("clearValue", arguments);
    },

    //> @method imageChooserItem.getImageProperties()
    // Return a settings object for the selected image - at least a src, and potentially also
    // width and height.
    // @param imageProperties (Record) An object defining properties of the selected image,
    //    such as src, width and height
    // @visibility tools
    //<
    getImageProperties : function () {
        var value = this.getValue();
        if (value == null || value.length == 0) return null;
        var img = this.imageRecord || {};
        if (value != img.src) {
            // the imageRecord is stale - see if the new value is a stock-icon
            img = isc.ImagePicker.getStockIcon(value, "src");

            if (!img) {
                // if not, make a new one - only a src
                img = { src: value };
            }
            this.imageRecord = img;
        }
        return this.imageRecord;
    },
    
    _isValidURL : function (value) {
        var isValidUrl = /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[\-;:&=\+\$,\w]+@)?[A-Za-z0-9\.\-]+|(?:www\.|[\-;:&=\+\$,\w]+@)[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-_]*)?\??(?:[\-\+=&;%@\.\w_]*)#?(?:[\.\!\/\\\w]*))?)/;
        return isValidUrl.test(value);
    }
});
