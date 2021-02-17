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
// Codify the main picker window into a separate class
//> @class StatefulImageChooser
// A UI component for choosing a series of image URLs or stock-icon entries associated with
// various "states". This interface is useful for creating a +link{SCStatefulImgConfig} object
// @inheritsFrom Window
// @visibility tools
//<
isc.ClassFactory.defineClass("StatefulImageChooser", "Window");

isc.StatefulImageChooser.addProperties({

    title:"Image Picker",
    autoSize:true,
    isModal:true,
    
    // dismissOnOutsideClick:true,

    initWidget : function () {

        this.instructionLabel = this.createAutoChild("instructionLabel", {
            contents:this.instructionText
        });

        this.imageChooserForm = this.createAutoChild("imageChooserForm", {
            items:this.getItemsForStates()
        });

        this.clearButton = this.createAutoChild("clearButton", {title:this.clearButtonTitle});

        this.okButton = this.createAutoChild("okButton", {title:this.okButtonTitle});
        this.cancelButton = this.createAutoChild("cancelButton", {title:this.cancelButtonTitle});

        this.toolbar = this.createAutoChild("toolbar", {
            members:[
                this.clearButton, isc.LayoutSpacer.create({width:"*"}), 
                this.cancelButton, this.okButton
            ]
        });

        this.items = [this.instructionLabel, this.imageChooserForm, this.toolbar];
        
        // Set up the image chooser form to drive the width of the instruction text, etc
        if (this.bodyProperties == null) {
            this.bodyProperties = {};
        }
        this.bodyProperties.minBreadthMember = this.imageChooserForm;

        return this.Super("initWidget", arguments);
        
    },

    //> @attr statefulImageChooser.instructionText (String : "Select an Image for each state you would like to represent" : IR)
    // Instruction text to display to the user
    // @group I18nMessages
    // @visibility tools
    //<
    instructionText:"Select an Image for each state you would like to represent",

    //> @attr statefulImageChooser.instructionLabel (AutoChild Label : null : R)
    // Label containing +link{instructionText}
    // @visibility tools
    //<
    instructionLabelConstructor:isc.Label,
    instructionLabelDefaults:{
        align:"center",
        height:1,
        overflow:"visible",
        padding:5
    },

    //> @attr statefulImageChooser.imageChooserForm (AutoChild DynamicForm : null : R)
    // Automatically generated DynamicForm containing a series of +link{ImageChooserItems}
    // allowing the user to select media for each +link{statefulImageChooser.states,state}.
    //
    // @visibility tools
    //<
    
    imageChooserFormConstructor:isc.DynamicForm,
    imageChooserFormDefaults : {
        width:300
    },

    //> @attr statefulImageChooser.imageChooserItem (MultiAutoChild ImageChooserItem : null : R)
    // A +link{ImageChooserItem} will be created for each +link{StatefulImageChooser.states,state}.
    // These follow the +link{MultiAutoChild} pattern and may be customized by modifying
    // <code>imageChooserItemDefaults</code> and <code>imageChooserItemProperties</code>
    // @visibility tools
    //<
    imageChooserItemDefaults:{
        editorType:"ImageChooserItem"
    },

    // Method to build the set of ImageChooserItems for this.states
    getItemsForStates : function () {
        var items = [];
        if (this.states == null) return items;

        for (var state in this.states) {
            items.add(isc.addProperties({
                name:state,
                title:this.states[state],
                
                pickerTitle:"Image Picker - " + this.states[state] + " state"
            }, this.imageChooserItemDefaults, this.imageChooserItemProperties));
        }
        return items;
    },

    // OK / Cancel button toolbar

    //> @attr statefulImageChooser.toolbar (AutoChild HLayout : null : R)
    // Automatically generated toolbar containing +link{okButton}, +link{cancelButton}
    // @visibility tools
    //<
    toolbarConstructor:isc.HLayout,
    toolbarDefaults:{
        height:1,
        width:"100%",
        membersMargin:5, layoutMargin:5,
        align:"right"
    },

    //> @attr statefulImageChooser.clearButton (AutoChild IButton : null : R)
    // Button to clear any currently selected values
    // @visibility tools
    //<

    //> @attr statefulImageChooser.clearButtonTitle (String : "Clear All" : IR)
    // Title for the +link{clearButton}
    // @visibility tools
    //<
    clearButtonTitle:"Clear All",
    clearButtonDefaults: {
        _constructor: "IButton",
        autoDraw: false,
        click : function () {
            this.creator.clearClick()
        }
    },

    //> @method statefulImageButton.clearClick()
    // Click handler for the +link{clearButton}. Default implementation clears
    // any selected values
    // @visibility tools
    //<
    clearClick : function () {
        this.imageChooserForm.clearValues();
    },

    //> @attr statefulImageChooser.okButton (AutoChild IButton : null : R)
    // Button to accept currently selected values
    // @visibility tools
    //<

    //> @attr statefulImageChooser.okButtonTitle (String : "Ok" : IR)
    // Title for the +link{okButton}
    // @visibility tools
    //<
    okButtonTitle:"OK",
    okButtonDefaults: {
        _constructor: "IButton",
        autoDraw: false,
        click : function () {
            this.creator.okClick()
        }
    },

    //> @attr statefulImageChooser.autoDismiss (Boolean : true : IRW)
    // Should this chooser be cleared on +link{okClick()}?
    // @visibility tools
    //<
    autoDismiss:true,

    //> @method statefulImageChooser.okClick()
    // Click handler for the +link{okButton}. Default implementation will
    // clear the picker if +link{statefulImageChooser.autoDismiss} is true, and
    // fire the +link{dataAccepted()} notification.
    //
    // @visibility tools
    //<
    okClick : function () {
        if (this.autoDismiss) this.clear();
        // we need a getValue that'll work
        this.dataAccepted();
    },

    //> @attr statefulImageChooser.cancelButton (AutoChild IButton : null : R)
    // Button to dismiss the chooser without accepting the currently selected values
    // @visibility tools
    //<

    //> @attr statefulImageChooser.cancelButtonTitle (String : "Cancel" : IR)
    // Title for the +link{cancelButton}
    // @visibility tools
    //<    
    cancelButtonTitle:"Cancel",
    cancelButtonDefaults: {
        _constructor: "IButton",
        autoDraw: false,
        click : function () {
            this.creator.cancelClick()
        }
    },

    //> @method statefulImageChooser.cancelClick()
    // Click handler for the +link{cancelButton}. Default implementation will clear the
    // picker
    //
    // @visibility tools
    //<
    cancelClick : function () {
        this.clear();
    },

    //> @attr statefulImageChooser.states (Object : null : IRW)
    // This attribute should be an object mapping the set of state-names for which 
    // the user can choose media to user-friendly titles for those states.<br>
    // For example, for a standard +link{SCStatefulImgConfig}, states might be set to:
    // <pre>
    // { _base:"Normal",
    //   Focused:"Focused",
    //   Selected:"Selected",
    //   Over:"Over",
    //   Down:"Down",
    //   Disabled:"Disabled" }
    // </pre>
    // @visibility tools
    //<
    // states:null,

    //> @method statefulImageChooser.setStates()
    // Setter for the +link{states} attribute
    // @param states (Object) new mapping of state names to titles
    //
    // @visibility tools
    //<
    setStates : function (states) {

        if (isc.objectsAreEqual(states, this.states)) return;

        this.states = states;
        this.imageChooserForm.setItems(this.getItemsForStates());
    },

    // For building a standard SCStatefulImgConfig we basically want to get the form values
    // call this "data".
    // Note that we also have the "ImageRecords", used directly by the StatefulImageChooserItem
    // below. This gives us some more context - most importantly user-friendly "names" for
    // stock icons
    

    //> @method StatefulImageChooser.getData()
    // Returns the current set of selected image URLs for the specified +link{states}.
    // @return (Object) Object mapping state names to selected image URLs
    // @visibility tools
    //<
    getData : function () {
        return this.imageChooserForm.getValues();
    },

    //> @method StatefulImageChooser.setData()
    // Set the selected image URLs for the specified +link{states}.
    // @param data (Object) Object mapping state names to selected image URLs
    // @visibility tools
    //<
    setData : function (data) {
        this.imageChooserForm.setValues(data);
    },

    //> @method StatefulImageChooser.getImageRecords()
    // Returns the current set of selected images for the specified +link{states} as
    // image properties objects.<br>
    // Each selected image will be an object with <code>url</code> set to the selected
    // image URL and optional other properties including <code>name</code> [a user-friendly
    // name for stock icons].
    // 
    // @return (Object) Object mapping state names to selected images
    // @visibility tools
    //<
    
    getImageRecords : function () {
        var data = {},
            items = this.imageChooserForm.getItems();

        for (var i = 0; i < items.length; i++) {
            var item = items[i],
                imageRecord = item.getImageProperties();
            if (imageRecord != null) {
                data[item.name] = imageRecord;
            }
        }
        return data;
    },
    //> @method StatefulImageChooser.setImageRecords()
    // Update the current set of selected images for the specified +link{states} as
    // image properties objects.
    //
    // @param (Object) Object mapping state names to selected images
    // @visibility tools
    //<    
    setImageRecords : function (data) {
        //  this.imageChooserForm.setValues(data);
        this.imageChooserForm.clearValues();
        for (var state in data) {
            var item = this.imageChooserForm.getItem(state);
            if (item == null) {
                this.logWarn("setImageRecrods passed image value for state:" +state + 
                ". This state is not included in the specified 'states' for this component and" +
                " cannot be displayed");
            } else {
                item.setImageRecord(data[state]);
            }
        }
    },

    //> @method statefulImageChooser.dataAccepted()
    // Notification method fired from +link{statefulImageChooser.okClick()}. May be observed or
    // overridden to react to the selected value.
    // @visibility tools
    //<
    dataAccepted : function () {

    }
});

//> @class StatefulImageChooserItem
// This FormItem uses the +link{StatefulImageChooser} component to let a user to select
// media for multiple states of a Stateful image. (See +link{SCStatefulImgConfig}).
// <P>
// The +link{formItem.value,value} for this item will be an Object containing mappings
// from +link{getStates(),state names} to image URLs
//
// @inheritsFrom TextItem
// @visibility tools
//<
isc.ClassFactory.defineClass("StatefulImageChooserItem", "TextItem");


isc.StatefulImageChooserItem.addProperties({

    // Don't allow typing in the text box - all changes come from the picker
	_elementIsReadOnly : function () {
	    return true;
    },
    textColor: "#999999",

    showPickerIcon:true,
    // separate the icon from the dataElement a bit
    pickerIconHSpace: 2,
    pickerIconPrompt: "Click to select images",


    //> @attr statefulImageChooserItem.clearValueIcon (Autochild FormItemIcon : null : IRW)
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
        showIf: "return false",
        click : function (form, item, icon) {
            item.imageRecords = null;
            item.storeValue(null, true);
        }
    },
    //> @attr statefulImageChooserItem.clearValueIconProperties (FormItemIcon Properties : null : IRW)
    // FormItemIcon properties to apply to the automatically generated +link{clearValueIcon}
    // +link{autoChild,AutoChild}.
    // @visibility tools
    //<
    
    init : function () {
        // set up the clearValue icon, initially hidden
        if (this.icons == null) this.icons = [];
        this.icons.addAt(isc.addProperties({}, 
            this.clearValueIconDefaults, this.clearValueIconProperties, 
            { name: "clearValue" }
        ), 0);
        return this.Super("init", arguments);
    },

    // When our value is changed (via user interaction or 'setValue()' call), update
    // the clear icon visibility
    saveValue : function () {
        this.Super("saveValue", arguments);
        if (this.getValue() != null) this.showIcon("clearValue");
        else this.hideIcon("clearValue");

    },
    //> @attr statefulImageChooserItem.pickerTitle (String : "Image Picker" : IRW)
    // Title for the +link{statefulImageChooser}
    // @visibility tools
    //<
    pickerTitle:"Image Picker",
    
    //> @attr picker (AutoChild StatefulImageChooser : null : IR)
    // Auto generated StatefulImageChooser shown when the user clicks the picker icon
    // @visibility tools
    //<
    pickerConstructor:isc.StatefulImageChooser,
    pickerDefaults:{
        dataAccepted : function () {
            this.creator.chooserDataAccepted(this.getImageRecords(), true);
        }
    },

    showPicker : function () {
        if (this.picker == null) {
            this.picker = this.createAutoChild("picker",
                {
                    title:this.pickerTitle,
                    states:this.getStates()
                }
            );
        } else {
            this.picker.setStates(this.getStates());
        }

        this.picker.setImageRecords(this.getImageRecords());

        this.picker.placeNear(isc.EH.getX(), isc.EH.getY());
        this.picker.show();
    },

    chooserDataAccepted : function (data) {
        this.imageRecords = data;

        var vals;
        if (data != null) {
            vals = {};
            for (var state in data) {
                vals[state] = data[state].src;
            }        
        }
        this.storeValue(vals, true);
    },

    // Events: Show the picker on general click, use a hover to "preview" the stateful images
    click : function (form,item) {
        this.showPicker();
    },

    itemHoverHTML : function (item, form) {
        var imageRecords = this.getImageRecords();
        if (!imageRecords || isc.isAn.emptyObject(imageRecords)) return;
        var tableHTML = "<table border=0><tr><td><b>State</b></td><td><b>Image</b></td></tr>";
        for (var key in imageRecords) {
            var iR = imageRecords[key];
            tableHTML += "<tr><td>" + key  + "</td><td>" 
                        + isc.Canvas.imgHTML(iR.src) + "<br>" + iR.src;
        }
        return tableHTML;
    },


    
    getImageRecords : function () {
        return this.imageRecords
    },
    setValue : function (newValue, allowNullValue, timeCritical, dontResetCursor) {
        if (newValue == null) {
            this.imageRecords = null;
        } else if (isc.isAn.Object(newValue)) {
            this.imageRecords = {};

            for (var state in newValue) {

                var stateVal = isc.Img.resolveStatefulImgConfigEntry(state,newValue),
                    stateURL = isc.Canvas.getImgURL(stateVal);

                var imgRecord = isc.ImagePicker.getStockIcon(stateURL, "src") ||
                                { src: stateURL };
                this.imageRecords[state] = imgRecord;
            }
        }
        return this.Super("setValue", arguments);
    },

    mapValueToDisplay : function (value) {
        
        if (this.imageRecords == null) return this.Super("mapValueToDisplay", arguments);
        var displayVals = [];
        for (var state in this.imageRecords) {
            var record = this.imageRecords[state];
            displayVals.add(record.name ? "[" + record.name + "]" : record.src);
        }
        return displayVals.join(", ");
    },

    //> @attr statefulImageChooserItem.states (Object : null : IRWA)
    // This attribute may be set to an object mapping the set of state-names for which 
    // the user can choose media to user-friendly titles for those states.
    // <P>
    // If unset the mapping will be picked up from +link{defaultStates} or 
    // +link{defaultCombinedStates}, depending on +link{showCombinedStates}.
    //
    // @visibility tools
    //<
    // states:null,

    //> @attr statefulImageChooserItem.defaultStates (Object : {...} : IRWA)
    // Default value for +link{states} if +link{showCombinedStates} is <code>false</code>.
    // This object contains the standard set of states used by stateful components such as
    // +link{ImgButton}, ommitting combined states such as <code>"Focused" + "Selected"</code>.
    // <P>
    // Value is set to:
    // <pre>
    // { _base:"Normal",
    //   Focused:"Focused",
    //   Selected:"Selected",
    //   Over:"Over",
    //   Down:"Down",
    //   Disabled:"Disabled" }
    // </pre>
    // @visibility tools
    //<
    defaultStates:{
        _base:"Normal",
        Focused:"Focused",
        Selected:"Selected",
        Over:"Over",
        Down:"Down",
        Disabled:"Disabled"
    },

    //> @attr statefulImageChooserItem.defaultCombinedStates (Object : {...} : IRWA)
    // Default value for +link{states} if +link{showCombinedStates} is <code>true</code>
    // This object contains the standard set of states used by stateful components such as
    // +link{ImgButton}, including combined states such as <code>"Focused" + "Selected"</code>.
    // <P>
    // Value is set to:
    // <pre>
    // { _base:"Normal",
    //   Focused:"Focused",
    //   Selected:"Selected",
    //   Over:"Over",
    //   Down:"Down",
    //   Disabled:"Disabled"
    //   
    //   FocusedSelected:"Focused+Selected",
    //   FocusedSelectedOver:"Focused+SelectedOver",
    //   FocusedSelectedDown:"Focused+SelectedDown",
    //   
    //   Disabled:"Disabled",
    //   SelectedDisabled:"Selected+Disabled" }
    // </pre>
    // @visibility tools
    //<
    defaultCombinedStates:{
        _base:"Normal",
        Focused:"Focused",
        Selected:"Selected",
        Over:"Over",
        Down:"Down",

        FocusedOver:"Focused+Over",
        SelectedOver:"Selected+Over",
        FocusedSelected:"Focused+Selected",
        FocusedSelectedOver:"Focused+Selected+Over",
        FocusedSelectedDown:"Focused+Selected+Down",

        Disabled:"Disabled",
        // No focused, over or down + disabled
        SelectedDisabled:"Selected+Disabled"
    },

    //> @attr statefulImageChooserItem.showCombinedStates (Boolean : true : IRWA)
    // If no explicit +link{states} are specified, should the default states we show
    // include combined states (such as <code>"Focused" + "Over"</code>?
    // @visibility tools
    //<
    showCombinedStates:true,

    //> @method statefulImageChooserItem.getStates()
    // Returns the set of state-names for which the user can choose media.
    // <P>
    // If +link{states} is explicitly populated, it will be returned, otherwise 
    // +link{defaultStates} or +link{defaultCombinedStates} will be used, depending on
    // the value of +link{showCombinedStates}.
    // @return (Object) Object mapping state names to user-visible state titles
    // @visibility tools
    //<
    getStates : function () {
        // Support explicit custom states
        if (this.states != null) return this.states;

        if (this.showCombinedStates) {
            return isc.addProperties({}, this.defaultCombinedStates);
        } else {
            return isc.addProperties({}, this.defaultStates);
        }
    }

});