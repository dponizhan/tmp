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
//> @class StackedListEditor
// A user-interface component for creation and editing a list of components.
// @treeLocation Client Reference/Data Binding
// @visibility stackedListEditor
//<
isc.defineClass("StackedListEditor", "VLayout").addProperties({

    //> @attr stackedListEditor.items (Array of Class : null : IR)
    // Specifies the list of existing items to be edited.
    //
    // @visibility stackedListEditor
    //<

    //> @attr stackedListEditor.canAddItems (Boolean : null : IR)
    // When explicitly set to false, disallows new items to be added.
    //
    // @visibility stackedListEditor
    //<

    //> @attr stackedListEditor.showAddButtonInHeader (Boolean : null : IR)
    // By default when items can be added an add button is shown beneath
    // the last item. By enabling this setting the add button is instead
    // shown in the last item's header next to the remove button, if enabled.
    //
    // @visibility stackedListEditor
    //<

    //> @attr stackedListEditor.addButtonTitle (String : null : IR)
    // Title to show for add new item button.
    //
    // @visibility stackedListEditor
    //<
    addButtonTitle: "Add item",

    //> @attr stackedListEditor.canRemoveItems (Boolean : null : IR)
    // When explicitly set to false, disallows removing items.
    //
    // @visibility stackedListEditor
    //<

    //> @attr stackedListEditor.canReorderItems (Boolean : null : IR)
    // When explicitly set to false, disallows reordering items.
    //
    // @visibility stackedListEditor
    //<

    //> @attr stackedListEditor.showReorderButtons (Boolean : null : IR)
    // When explicitly set to false and +link{canReorderItems} is not
    // also false, reorder buttons are not shown in
    // section headers. List reordering can only be done by dragging.
    //
    // @visibility stackedListEditor
    //<

    //> @attr stackedListEditor.newItemTitle (String : "[New item]" : IR)
    // Title to show for a new item.
    //
    // @visibility stackedListEditor
    //<
    newItemTitle: "[New item]",

    //> @attr stackedListEditor.itemEditorConstructor (SCClassName : null : IR)
    // Class used to construct the editor for each item.
    //
    // @visibility stackedListEditor
    //<

    //> @attr stackedListEditor.addIcon (SCImgURL : "[SKIN]actions/add.png" : IR)
    // Default icon to show for add item button..
    // @visibility stackedListEditor
    //<
    addIcon: "[SKIN]actions/add.png",

    //> @attr stackedListEditor.addIconSize (Number : 16 : IRW)
    // Default width and height of +link{addIcon,add icon}.
    //
    // @visibility stackedListEditor
    //<
    addIconSize: 16,

    //> @attr stackedListEditor.removeIcon (SCImgURL : "[SKIN]actions/remove.png" : IR)
    // Default icon to show for remove item button..
    // @visibility stackedListEditor
    //<
    removeIcon: "[SKIN]actions/remove.png",

    //> @attr stackedListEditor.removeIconSize (Number : 16 : IRW)
    // Default width and height of +link{removeIcon,remove icons}.
    //
    // @visibility stackedListEditor
    //<
    removeIconSize: 16,

    mainLayoutDefaults: {
        _constructor: isc.VLayout,
        height: "100%",
        membersMargin: 5
    },

    stackDefaults: {
        _constructor: isc.SectionStack,
        autoParent: "mainLayout",
        visibilityMode: "multiple",
        overflow: "auto",
        membersChanged : function () {
            // Keep add button showing on the last section after reordering
            this.creator.updateSectionControls();
        }
    },

    upButtonDefaults: {
        _constructor: isc.ImgButton,
        src:"[SKIN]headerIcons/arrow_up.png", size:16,
        prompt: "Move item up",
        showDisabled: false, showDown:false,
        click : "this.creator.moveItemUp(this.itemEditor);return false;"
    },

    downButtonDefaults: {
        _constructor: isc.ImgButton,
        src:"[SKIN]headerIcons/arrow_down.png", size:16,
        prompt: "Move item down",
        showDisabled: false, showDown:false,
        click : "this.creator.moveItemDown(this.itemEditor);return false;"
    },

    addButtonDefaults: {
        _constructor: isc.ImgButton,
        src:"[SKIN]actions/add.png", size:16,
        showFocused:false, showRollOver:false, showDown:false,
        click : "this.creator.addItem();return false;"
    },

    lowerAddButtonDefaults: {
        _constructor: isc.IButton,
        wrap: false, autoFit: true,
        icon:"[SKIN]actions/add.png", iconSize:16,
        layoutAlign: "center",
        click : "this.creator.addItem();return false;"
    },

    removeButtonDefaults: {
        _constructor: isc.ImgButton,
        src:"[SKIN]actions/remove.png", size:16,
        showFocused:false, showRollOver:false, showDown:false,
        click : "this.creator.removeItem(this.itemEditor);return false;"
    },

    itemEditorDefaults: {
        height: 50  // Minimum height
    },

    initWidget : function () {
        this.Super("initWidget", arguments);

        this.addAutoChild("mainLayout");
        this.addAutoChild("stack", { canReorderSections: (this.canReorderItems != false) });

        if (this.canAddItems != false && !this.showAddButtonInHeader) {
            var properties = { icon: this.addIcon, iconSize: this.addIconSize, title: this.addButtonTitle },
                addButton = this.createAutoChild("lowerAddButton", properties)
            ;
            this.mainLayout.addMember(addButton);
        }

        if (this.items) {
            this.setItems(this.items.duplicate());
        } else if (this.canAddItems != false) {
            // Add empty item
            this.addItem();
        }
    },

    moveSection : function (sections, position) {
        this.Super("moveSection", arguments);
        this.updateSectionControls();
    },

    updateSectionControls : function () {
        var sections = this.stack.getSections();
        for (var i = 0; i < sections.length; i++) {
            var sectionHeader = this.stack.getSectionHeader(sections[i]),
                buttonLayout = sectionHeader.controls[this.showReorderButtons != false ? 2 : 0],
                moveLayout = sectionHeader.controls[0];
            ;
            buttonLayout.showAddButton(this.canAddItems != false && i == sections.length-1);
            if (this.showReorderButtons != false) {
                var states = [];
                if (i == 0) states.add("top");
                if (i == sections.length-1) states.add("bottom");
                moveLayout.setStates(states);
            }
        }
    },

    //> @method stackedListEditor.handleTitleChanged()
    // Can be called by an item editor to change the section title
    // for the item.
    //
    // @param itemEditor (Canvas) item editor making the change
    // @param title (String) new title
    // @visibility stackedListEditor
    //<
    handleTitleChanged : function (itemEditor, title) {
        var sectionNum = this.stack.getSectionNumber(itemEditor.sectionName);
        if (sectionNum >= 0) {
            this.stack.setSectionTitle(sectionNum, title);
        }
    },

    //> @method stackedListEditor.getItemTitle()
    // Returns the title to show for the section for the item.
    //
    // @param item (Object) item
    // @return (String) section title
    // @visibility stackedListEditor
    //<

    //> @method stackedListEditor.getItemEditorProperties()
    // Returns per-item editor custom properties to be applied.
    //
    // @param item (Object) item
    // @return (Object) custom properties
    // @visibility stackedListEditor
    //<

    //> @method stackedListEditor.getSectionProperties()
    // Returns per-item section custom properties to be applied.
    // Useful to tracking information within the section that is not
    // applicable for the editor.
    //
    // @param item (Object) item
    // @return (Object) custom properties
    // @visibility stackedListEditor
    //<

    //> @method stackedListEditor.getItemEditorValue()
    // Returns the item value from the item editor.
    //
    // @param itemEditor (Canvas) item editor making the change
    // @param section (Canvas) stack section
    // @return (Any) editor value
    // @visibility stackedListEditor
    //<
    getItemEditorValue : function (itemEditor, section) {
        return null;
    },

    getSectionIndexForEditor : function (itemEditor) {
        var sections = this.stack.getSections();
        for (var i = 0; i < sections.length; i++) {
            var sectionHeader = this.stack.getSectionHeader(sections[i]),
                editor = sectionHeader.items[0]
            ;
            if (itemEditor == editor) return i;
        }
        return null;
    },

    moveItemUp : function (itemEditor) {
        var sectionIndex = this.getSectionIndexForEditor(itemEditor);
        if (sectionIndex != null) {
            this.stack.moveSection(sectionIndex, sectionIndex-1);
        }
    },

    moveItemDown : function (itemEditor) {
        var sectionIndex = this.getSectionIndexForEditor(itemEditor);
        if (sectionIndex != null) {
            this.stack.moveSection(sectionIndex, sectionIndex+1);
        }
    },

    addItem : function (item) {
        var title = this.newItemTitle;
        if (item) title = this.getItemTitle(item);

        var itemEditorProperties = (this.getItemEditorProperties ? this.getItemEditorProperties(item) : {}),
            editor = this.createAutoChild("itemEditor", itemEditorProperties),
            sectionItems = [ editor ],
            sectionControls
        ;

        if ((this.canAddItems != false && this.showAddButtonInHeader) || this.canRemoveItems != false) {
            var members = [],
                canAdd = this.canAddItems != false && this.showAddButtonInHeader
            ;
            if (canAdd) {
                var properties = { src: this.addIcon, size: this.addIconSize },
                    addButton = this.createAutoChild("addButton", properties)
                ;
                members.add(addButton);
            }
            if (this.canRemoveItems != false) {
                var properties = { itemEditor: editor, src: this.removeIcon, size: this.removeIconSize },
                    removeButton = this.createAutoChild("removeButton", properties)
                ;
                members.add(removeButton);
            }

            var buttonLayout = isc.HLayout.create({
                height: Math.max(this.addIconSize, this.removeIconSize),
                width: 16,
                membersMargin: 2,
                align: "right",
                members: members,
                showAddButton : function (show) {
                    if (!canAdd) return;
                    var addButton = this.getMember(0);
                    if (show) addButton.show();
                    else addButton.hide();
                }
            });

            sectionControls = [ buttonLayout ];
        }
        if (this.showReorderButtons != false) {
            var upButton = this.createAutoChild("upButton", { itemEditor: editor }),
                downButton = this.createAutoChild("downButton", { itemEditor: editor })
            ;
            var buttonLayout = isc.HLayout.create({
                height: 16,
                width: 16,
                membersMargin: 2,
                align: "right",
                members: [ upButton, downButton],
                setStates : function (states) {
                    var upButton = this.getMember(0),
                        downButton = this.getMember(1)
                    ;
                    if (states.contains("top")) upButton.disable();
                    else upButton.enable();
                    if (states.contains("bottom")) downButton.disable();
                    else downButton.enable();
                }
            });

            if (!sectionControls) sectionControls = [];
            sectionControls.addAt(isc.LayoutSpacer.create({ width: 5 }), 0);
            sectionControls.addAt(buttonLayout, 0);
        }

        var sectionProperties = {
            title: title,
            items: sectionItems,
            expanded: !item,
            controls: sectionControls
        };
        if (this.getSectionProperties) isc.addProperties(sectionProperties, this.getSectionProperties(item));
        this.stack.addSection(sectionProperties);

        // save item's sectionName on the editor to be used in handleTitleChanged
        var sectionNames = this.stack.getSectionNames(),
            sectionName = sectionNames[sectionNames.length-1]
        ;
        editor.sectionName = sectionName;

        this.updateSectionControls();
    },

    removeItem : function (itemEditor) {
        var section = this.stack.sectionForItem(itemEditor);
        this.removeItemInSection(section.name);

        // Always keep at least one item in stack 
        var sections = this.stack.getSections();
        if (sections.length == 0) {
            this.addItem();
        }
        this.updateSectionControls();
    },

    removeItemInSection : function (section) {
        
        var stack = this.stack;
        this.stack.collapseSection(section, function () {
            stack.removeSection(section);
        });
    },

    //> @method stackedListEditor.validate()
    // Validate the current set of items. Entries without a validator type selected
    // are ignored.
    // @return (boolean) true if validation passed for all validator forms, false otherwise.
    // @visibility stackedListEditor
    //<
    validate : function () {
        var failed = false,
            sections = this.stack.getSections()
        ;
        for (var i = 0; i < sections.length; i++) {
            var section = sections[i],
            header = this.stack.getSectionHeader(section),
            itemEditor = header.items[0]
            ;
            failed = (itemEditor.validate() == false) || failed;
        }
        return !failed;
    },

    //> @method stackedListEditor.getItems()
    // Get the list of entered items. Null values will be
    // skipped. (see +link{getItemEditorValue})
    // @return (Array of Class) list of edited items
    // @visibility stackedListEditor
    //<
    getItems : function () {
        var sections = this.stack.getSections(),
            items = []
        ;
        for (var i = 0; i < sections.length; i++) {
            var section = sections[i],
                header = this.stack.getSectionHeader(section),
                itemEditor = header.items[0],
                item = this.getItemEditorValue(itemEditor, header)
            ;

            if (item) items.add(item);
        }
        return items;
    },

    //> @method stackedListEditor.setItems()
    // Show the specified items in this stackedListEditor.
    // @param Class (Array of Class) list of items to edit.
    // @visibility stackedListEditor
    //<
    setItems: function (items) {
        this.items = items;

        var editor = this;
        var createSections = function (items) {
            for (var i = 0; i < items.length; i++) {
                editor.addItem(items[i]);
            }
            if (editor.canAddItems != false) {
                // Add empty item
                editor.addItem();
            }
        };

        var sections = this.stack.getSections();
        if (sections && sections.length > 0) {
            var stack = this.stack;
            this.stack.collapseSection(sections, function () {
                stack.removeSection(sections);
                createSections(items);
            });
        } else {
            createSections(items);
        }
    }
});
