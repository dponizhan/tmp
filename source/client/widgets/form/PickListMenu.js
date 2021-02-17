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
// Class will not work without the ListGrid
if (isc.ListGrid) {



//>	@class PickListMenu
// +link{class:ListGrid} subclass used, by default, by FormItems which implement
// +link{interface:PickList} to display a +link{pickList.dataSetType, flat list} of selectable 
// options.
// <P>
// Can be subclassed, customized and assigned to FormItems 
// via the +link{comboBoxItem.pickListConstructor, pickListConstructor} attribute.
// @inheritsFrom ListGrid
// @treeLocation Client Reference/Forms/Form Items
// @visibility external
//<

isc.ClassFactory.defineClass("PickListMenu", "ScrollingMenu");

isc._ScrollingPickerClassProperties = {
    // object to hold cached pickListMenu instances for databound pickList items
    _cachedDSPickLists:{},
    // Don't cache more than 50 DS pickListMenus    
    pickListCacheLimit:50
};

isc._ScrollingPickerProperties = {
    
    // explicitly doc the default pickList empty message (may be overridden by pickListEmptyMessage
    // on a per-instance basis too)
    //> @attr PickListMenu.emptyMessage (String : "No Items To Show" : IRW) 
    // @include ListGrid.emptyMessage
    // @visibility external
    // @group i18nMessages
    //<
    
    // explicitly doc dataProperties - useful to be able to customize
    //> @attr PickListMenu.dataProperties
    // @include ListGrid.dataProperties
    // @visibility external
    //<
    
    // Don't get fields from the DS.
    useAllDataSourceFields:false,
    
    // disallow tabbing to the pickList
    tabIndex:-1,
    
    // Don't allow fields to be resized, if multiple are showing
    
    canResizeFields:false,
    // Since we don't support drag resize of fields, turn canFreezeFields off by default
    canFreezeFields:false,
    
    //> @attr pickListMenu.styleName (CSSStyleName : "pickListMenu" : IRW)
    // @include listGrid.styleName
    // @visibility external
    //<
    styleName:"pickListMenu",
    //> @attr pickListMenu.bodyStyleName (CSSStyleName : "pickListMenuBody" : IRW)
    // @include listGrid.bodyStyleName
    // @visibility external
    //<
    bodyStyleName:"pickListMenuBody",
    
    
    //> @attr pickListMenu.normalCellHeight (number : 16 : IRWA)
    // @include listGrid.normalCellHeight
    //<
    normalCellHeight:16,

    scrollToCellXPosition: "left",

    scrollToCellYPosition: "top",

    animateTransitions: !isc.Browser.isMobileIE,

    skinUsesCSSTransitions: false,

    animateDuration: 350,
    
    // --- methods
    getTransformCSS : function () {
        if (!this._fillScreenContainer || !isc.Browser._supportsCSSTransitions || !this.animateTransitions || !this.skinUsesCSSTransitions) {
            return null;
        } else {
            var y = !this._showing ? "100%" : "0px";
            return ";" + isc.Element._transformCSSName + ": translateY(" + y + ");";
        }
    },

    handleTransitionEnd : function (event, eventInfo) {
        if (eventInfo.target === this && this._fillScreenContainer != null) {
            this._enableOffsetCoordsCaching();

            if (!this._showing) {
                this._fillScreenContainer.hide();
            } else {
                
                if (this.showModal) this.body.focus();
            }
        }
    },

    _readyToSetFocus : function (focus) {
        
        if (focus &&
            isc.Browser._supportsCSSTransitions && this.animateTransitions && this.skinUsesCSSTransitions &&
            this._showing)
        {
            return false;
        }
        return this.Super("_readyToSetFocus", arguments);
    },

    _animateShow : function () {
        
        if (!isc.Canvas._isInFront(this._fillScreenContainer)) {
            this._fillScreenContainer.bringToFront();
        }

        this._fillScreenContainer.show();

        // ensure the pickList is drawn before firing the animation
        if (!this.isDrawn()) this.draw();

        if (!isc.Browser._supportsCSSTransitions || !this.animateTransitions || !this.skinUsesCSSTransitions) {
            this.show();
            this.moveTo(0, this.getInnerHeight());
            this.animateMove(0, 0, function () {}, this.animateDuration);
        } else {
            this._showing = true;
            this.show();
            
            this.delayCall("__animateShow");
        }
    },

    __animateShow : function () {
        this._disableOffsetCoordsCaching();
        isc.Element._updateTransformStyle(this, "translateY(0px)");
    },

    _animateHide : function () {
        if (!isc.Browser._supportsCSSTransitions || !this.animateTransitions || !this.skinUsesCSSTransitions) {
            var container = this._fillScreenContainer;
            this.animateMove(0, this.getInnerHeight(), function () {
                container.hide();
            }, this.animateDuration);
        } else {
            this._showing = false;
            // Delay the start of the hide transition slightly so that touch browser users can
            // see the rollOver effect on the tapped option.
            this.delayCall("__animateHide", null, 100);
        }
    },

    __animateHide : function () {
        this._disableOffsetCoordsCaching();
        isc.Element._updateTransformStyle(this, "translateY(100%)");
        // shrink the _fillScreenContainer, so that showing it later correctly animates it's 
        // resize and redraws it
        if (this._fillScreenContainer) {
            this._fillScreenContainer.resizeTo(1,1);
            this._fillScreenContainer.hide();
        }
    },

    // Pick up valueIcons from this form item, if specified
    getValueIcon : function (field, value, record) {
        var formItem = this.formItem;

        // If this is a databound pickList, we have 2 sets of valueIcons to consider - 
        // those specified by the formItem and those specified on the field definition itself.
        // - If the form item specifies any valueIcons, we typically want to show them on the 
        //   column that matches the display-value for the formItem.
        //   - This will be the result of formItem.getDisplayField() or formItem.getValueField()
        // - If the developer specified explicit pickListFields for this item, this field may
        //   not be showing. In this case we allow the developer to explicitly specify a 
        //   field to show the form item valueIcons via the property "formItem.valueIconField".
        //   If this property is set, always respect it.
        // - For all other fields, and if the form item has no custom valueIcons, just fall
        //   through to the standard ListGrid implementation, so we can pick up valueIcons
        //   specified on the dataSource fields.
        var hasCustomValueIcons = formItem && !formItem.suppressValueIcons &&
                                  (formItem.valueIcons != null || formItem.getValueIcon !=null);
        
        if (hasCustomValueIcons) {
            var valueField = formItem.getValueFieldName(),
                valueIconField = formItem.valueIconField || 
                                 formItem.getDisplayFieldName() || valueField;
            if (this.getFieldName(field) == valueIconField) {
                // The form item expects the value passed to getValueIcon to be the 'valueField' 
                // value, not the value from whatever field is being displayed in the pickList
                return formItem._getValueIcon(record[valueField]);
            }
        }
        
        return this.Super("getValueIcon", arguments);
    },

    // arrowKeyAction - for single selects we change selection as the user moves
    // around with arrow keys
    // for multi select, we change hilite only and allow the user to select with
    // "space" keypress    
    getArrowKeyAction : function () {
        //if (this.formItem && this.formItem.dataSetType == "tree") {
        //    // we don't want to select in a tree
        //    return "focus";
        //}
        return this.allowMultiSelect ? "focus" : "select";
    },

    // showOverAsSelected - will remap all "Over" styles to use the
    // "Selected" class name.
    
    showOverAsSelected:true,

    // override rowClick / recordClick - we don't want to hide on keyboard navigation
    // Note that generateClickOnSpace is set up dynamically as 
    // part of the 'show' override.
    rowClick : function (record, recordNum, fieldNum, keyboardGenerated) {
        this._keyboardRowClick = keyboardGenerated;
        this.Super("rowClick", arguments);
        delete this._keyboardRowClick;
        if (record && this.clickInCheckboxArea && this.clickInCheckboxArea(record)) {
            // if this is a checkbox-click in a multi-select tree picker, rowClick() 
            // does the selection and swallows the event without firing itemClick() 
            // - do that now
            this.itemClick(record);
        }
    }, 
    recordClick : function (viewer,record,recordNum,field,fieldNum,value,rawValue) {
        var matchSpecialValue = false;
        if (this.allowMultiSelect && this.formItem.specialValues && !this.separateSpecialValues) {
            var data = this.formItem.specialValues,
                fieldName = this.formItem.getValueFieldName(),
         	    value = record[fieldName];

            if (isc.isAn.Array(data)) {
                for (var i = 0; i < data.length; i++) {
                    if (data[i] == value) {
                        matchSpecialValue = true;
                        break;
                    }
                }
            } else if (isc.isAn.Object(data)) {
                if (data[value] != null) matchSpecialValue = true;
            }
        }
        // Skip 'canSelect:false' records. Don't hide the viewer or fire the itemClick handler
        if (!matchSpecialValue && record[viewer.recordCanSelectProperty] == false) return;

        var shouldDismiss;
        if (this._keyboardRowClick) {
            // Nothing to do here on Space key press.
            // On Arrow key press we should update the 'aria-activedescendant' attribute on
            // the formItem if running in screen reader mode.
            
            var keyName = this.ns.EH.getKey(),
                isEnter = (keyName == "Enter");
            if (!isEnter) {
                var formItem = this.formItem;
                if (isc.Canvas.ariaEnabled() &&
                    formItem != null &&
                    formItem.ariaRole === "combobox" &&
                    this.body != null)
                {
                    var startRow = this.body.getDrawArea()[0];
                    var rowElementId = this.getRowElementId(recordNum, recordNum - startRow);
                    formItem.setAriaState("activedescendant", rowElementId);
                }
                if (keyName != "Space" || !formItem.allowMultiSelect) return;
                shouldDismiss = false;

            // On Enter keypress, always dismiss the pickList
            } else {
                shouldDismiss = true;
            }
        } else {
            shouldDismiss = !this.allowMultiSelect;
        }
        
        if (record != null) {
            if (record.isFolder && this.fireItemClickForFolders == false) {
                shouldDismiss = false;
            }
        }

        // hide before firing itemClick.
        // This avoids issues with focus, where the itemClick action is expected to put focus
        // somewhere that is masked until this menu hides.
        if (matchSpecialValue || shouldDismiss) this.hide();
        // itemClick handles updating the formItem with the selected value(s) from the
        // pickList.
        if (record != null) {
            if (record.isFolder) {
                if (this.fireItemClickForFolders) this.itemClick(record);
                else this.toggleFolder(record);
            } else {
                this.itemClick(record);
            }
        }
    },
    
    // This method is fired when the user hits Space or Enter and 
    // generateClickOnSpace/Enter is set to determine whether we should toggle 
    // selection on the row.
    // Overridden to disable toggling selection on Enter keypress in a multi-select
    // pickList, since we dismiss the pickList in this case and it'd be confusing to
    // have the highlighted value be toggled when the user is really attempting
    // to accept the current selection and dismiss the pickList.
    selectOnGeneratedCellClick : function (record, rowNum, colNum, body) {
        if (this.allowMultiSelect && isc.EH.getKey() == "Enter") return false;
        return this.Super("selectOnGeneratedCellClick", arguments);
    },
    
    headerClick : function (fieldNum, header) {
        var rv = this.Super("headerClick", arguments);
        var field = this.getField(fieldNum);
        // check if the checkbox column header was clicked
        if (this.isCheckboxField(field) && this.allowMultiSelect) {
            this.multiSelectChanged();
        }
        return rv;
    },

    multiSelectChanged : function () {
        var formItem = this.formItem,
            fieldName = formItem.getValueFieldName(),
            sel = this.getSelection(),
            value = !sel || sel.length == 0 ? null : sel.getProperty(fieldName)
        ;
        

        formItem.pickValue(value);
    },

    // 'pick' the selected value on click.  Matches Windows ComboBox behavior
    itemClick : function (record) {
        var formItem = this.formItem,
            fieldName = formItem.getValueFieldName(),
            value = record[fieldName],
            specialRecord = null,
            matchSpecialValue = false,
            existSeparateValuesList = formItem.separateValuesList && formItem.separateValuesList.getData().length > 0;
        
        if (existSeparateValuesList) {
            specialRecord = formItem.separateValuesList.find(record);
        } else if (formItem.specialValues) {
            var data = formItem.specialValues;

            if (isc.isAn.Array(data)) {
                for (var i = 0; i < data.length; i++) {
                    if (data[i] == value) {
                        matchSpecialValue = true;
                        break;
                    }
                }
            } else if (isc.isAn.Object(data)) {
                if (data[value] != null) matchSpecialValue = true;
            }
        }
        if (((existSeparateValuesList && specialRecord == null) || 
             (!matchSpecialValue && specialRecord == null) || 
             (!matchSpecialValue && !existSeparateValuesList)) && this.allowMultiSelect)
        {
            this.multiSelectChanged();
        } else {
            var fieldName = formItem.getValueFieldName();
            var valueFieldName = (specialRecord && existSeparateValuesList ? formItem._$separateValuesListValueField : formItem.getValueFieldName());
            var value = record[valueFieldName];
            if (isc.PickList.selectAllStoredValue && value == isc.PickList.selectAllStoredValue) {
                var listGrid = this,
                    data = this.getData(),
                    specialValues = formItem.specialValues || [],
                    arraySpecialValues = [],
                    cache;
                if (!isc.isAn.Array(specialValues)) {
                    var count = 0;
                    for (var prop in specialValues) {
                        arraySpecialValues[count] = prop;
                        count++;
                    }
                } else {
                    arraySpecialValues = specialValues;
                }
                      
                if (isc.ResultSet && isc.isA.ResultSet(data) || isc.isA.ResultTree(data)) {
                    if (data.allMatchingRowsCached()) {
                        cache = data.getAllRows();
                    } else {
                        cache = data.getAllLoadedRows();
                        isc.warn("<b>selectAllStoredValue</b> is not valid when data paging is enabled. "+
                                 "Selecting all loaded rows, behavior from now on is undefined");
                    }
                } else {
                    cache = data;
                }
                var startValue = 0;
                if (!formItem.separateSpecialValues) startValue = arraySpecialValues.length;

                for (var i = startValue; i < cache.length; i++) {
                    formItem.pickList.selectRecord(i);
                }
                var sel = formItem.pickList.getSelection(),
                    value = sel.getProperty(fieldName);
                formItem.pickValue(value);
            } else {
                if (isc.PickList.emptyStoredValue && value == isc.PickList.emptyStoredValue) {
                    formItem.pickList.deselectAllRecords();
                    value = null;
                }
                formItem.pickValue(value);
            }
        }
    },
    
    hide : function (a,b,c,d) {
        var isVisible = this.isVisible() && this.isDrawn();
        if (this._fillScreenContainer) {
            this._animateHide();
        } else {
            this.invokeSuper(isc.PickListMenu, "hide", a,b,c,d);                    
        }
        
        // If we're being hidden as part of a formItem.destroy(), this.formItem will have been 
        // cleared out.
        if (!this.formItem) return;
        
        // put focus back in the item if this was a modal pickList 	 
        if (isVisible && this.showModal) this.formItem.focusInItem();
                 
        // Clear out the showingPickList flag
        this.formItem._showingPickList = null;                 
        
        // fire a notification for observing / overriding the pick list being hidden
        if (isVisible) this.formItem._pickListHidden();
        
        
        delete this.formItem._showOnFilter;

        // Clear the last hilite to reset the "last position" for the purpose
        // of arrow key navigation. Once the PickList is hidden, we don't want
        // it to remember where it was last if re-shown.
        this.clearLastHilite();
    },

    show : function () {
        // If the pickList is already showing we could arguably bail here, but this isn't
        // how Canvas.show() behaves (still calls 'setVisibility()')...
        // Instead we'll just avoid firing the _pickListShown notification function 
        var alreadyShowing = this.isVisible() && this.isDrawn();

        // keyboard generated click handling:
        // "Enter" keypress always generates the "click" event.
        // This accepts the selected values and dismisses the editor
        this.generateClickOnEnter = true;

        // "Space" keypress
        // - no action for single-selects (selection already achieved
        //   on arrow keypress)
        // - Toggles selection for multi-selects, without dismissing the editor
        this.generateClickOnSpace = this.allowMultiSelect;
        // See also recordClick modifications / selectOnGeneratedCellClick

        
        if (this.parentElement == null) this.bringToFront();

        this.Super("show", arguments);
        
        // fire a notification for observing / overriding the pick list being shown                    
        if (!alreadyShowing) {
            this.formItem._pickListShown();
        }
    },

    // Override showClickMask() - if this is a modal PickList, ensure that when the pickList is
    // hidden focus goes to the form item that spawned the pickList.    
    showClickMask : function () {
        if (this._fillScreenContainer) {
            // we don't need mask in this case
            return;
        }
        if (!this.clickMaskUp(this.getID())) {
            // Actually cmID will match this.getID() since that's the default ID for a CM
            // associated with a widget.
            var cmID = this.Super("showClickMask", arguments);
            if (this.formItem) {
                var form = this.formItem.form,
                    mask = isc.EH.clickMaskRegistry.find("ID", cmID);
    
                // Suppress the default behavior of putting focus into whatever had focus before
                // this CM was shown. We'll explicitly put focus into the appropriate item when
                // hiding the pickList
                if (mask._maskedFocusCanvas) mask._maskedFocusCanvas = null;
            }
        }
    },

    getBaseStyle : function (record, rowNum, colNum, d,e,f) {
        var baseStyle = this.invokeSuper(isc.PickListMenu, "getBaseStyle", record, rowNum, colNum, d,e,f);
        // Because of pickList menu sharing, we won't know until runtime whether the pickList
        // menu is bound to a SelectItem.
        var formItem = this.formItem;
        if (isc.isA.SelectItem && isc.isA.SelectItem(formItem) && formItem.multiple &&
            !formItem._defaultPendingStatusChangedBehaviorCanceled && formItem._getShowPending())
        {
            var field = this.getField(colNum),
                fieldName = formItem.getValueFieldName();
            if (this.getField(fieldName) === field) {
                var valuesSet = formItem._valuesSet;
                if (this.isSelected(record)) {
                    if (!valuesSet.has(record[fieldName])) baseStyle += "Pending";
                } else {
                    if (formItem._getShowDeletions() && valuesSet.has(record[fieldName])) {
                        baseStyle += "Deselected";
                    }
                }
            }
        }
        return baseStyle;
    },

    _$_backgroundColor:"background-color:",
    _$_color:"color:",
    getCellCSSText : function (record, rowNum, colNum) {

        var customCSSText = this.Super("getCellCSSText", arguments);
        
        // if it's selected apply the hilite color, if specified
        // Otherwise we rely on regular css class type styling.
        if (this.selectionManager != null && 
            this.selectionManager.getSelectedRecord() == record) 
        {
            var cssText = [];
            if (this.hiliteColor != null) {
                cssText[0] = this._$_backgroundColor;
                cssText[1] = this.hiliteColor;
                cssText[2] = isc.semi;
            }

            if (this.hiliteTextColor != null) {
                cssText[3] = this._$_color;
                cssText[4] = this.hiliteTextColor;
                cssText[5] = isc.semi;
            }
            if (customCSSText != null) {
                if (!customCSSText.endsWith(isc.semi)) customCSSText += isc.semi;
                return cssText.join(isc.emptyString) + customCSSText;
            }
            return cssText.join(isc.emptyString);
        } else if (customCSSText != null) {
            return customCSSText;
        }
    },

    // override keyDown to catch tabs and hide the pickList.
    
    
    keyDown : function () {
        var keyName = isc.EH.lastEvent.keyName;
        if (keyName == "Tab") {
            this.hide();
            return false;
        }
    },
            
    // Override _formatCellValue to call formatPickListValue() if defined (allowing for customized
    // formatting within the pickList).
    
    _formatCellValue : function (value, record, field, rowNum, colNum, a, b, c) {
        if (this.formItem == null) return this.Super("_formatCellValue", arguments);
        
        var fieldName = this.getFieldName(colNum);
        value = this.formItem.formatPickListValue(value, fieldName, record);

        
        return this.Super("_formatCellValue", [value, record, field, rowNum, colNum, a, b, c],
                          arguments);
    },
    
    // override keyPress to allow for navigation to different items by typing
    // the first letter of the option.
    bodyKeyPress : function (event, eventInfo) {
        var keyName = isc.EH.lastEvent.keyName;
        // Catch shift+tab in safari in keyPress rather than keydown
        if (isc.Browser.isSafari) {
            if (keyName == "Tab") {
                this.hide();
                return false;
            }
        }

        var charVal = isc.EH.getKeyEventCharacterValue();
        if (charVal != null && keyName != "Enter") {
            var data = this.formItem.getAllLocalOptions();
            if (!data || data.length < 1) {
                // getAllLocalOptions returns null if we have a partial cache - just search 
                // the local cache of rows
                if (this.data && this.data.localData) data = this.data.localData;
            }
                  
            if (isc.isAn.Array(data) && data.length > 1) {

                // Normalize to a lowercase string for comparison.
                var typedChar = String.fromCharCode(charVal).toLowerCase(),
                    formItem = this.formItem,
                    valueField = formItem.getValueFieldName(),
                    
                    navStyle = this.getArrowKeyAction(),
                    currentIndex = navStyle == "focus" ? this.getFocusRow() : null
                ;
                
                if (currentIndex == null || currentIndex < 0) {
                    // no focusRow - is there's a selectedRecord, use that index, otherwise, -1
                    var selectedRecord = this.getSelectedRecord();
                    if (selectedRecord) currentIndex = data.indexOf(selectedRecord);
                    if (currentIndex == null) currentIndex = -1;
                }
                
                var newIndex = currentIndex < (data.length -1) ? currentIndex + 1 : 0;
                var canRestart = currentIndex > 0;
                var buffer = typedChar;
                
                //this.logWarn("currentIndex = " + currentIndex + ", newIndex = " + newIndex);

                var allowFirstLoop = false;
                if (formItem && formItem._setClearMoveToTimer) {
                    // leverage SelectItem's ability to buffer key-presses into a search string
                    // which is then automatically cleared after item._clearMoveToDelay (500ms)
                    formItem._setClearMoveToTimer(charVal, true);
                    buffer = formItem._moveToBuffer;
                    if (buffer == (typedChar + typedChar)) {
                        // if the same char is typed multiple times, search for just one
                        formItem._moveToBuffer = "";
                        formItem._setClearMoveToTimer(charVal, true);
                        buffer = formItem._moveToBuffer;
                    }
                    if (buffer.length > 1) {
                        newIndex = currentIndex;
                        allowFirstLoop = true;
                    }
                }
                while (allowFirstLoop || newIndex != currentIndex) {
                    allowFirstLoop = false;
                    if (currentIndex < 0) currentIndex = 0;
                    // if record not loaded, there's a partial cache - allow restart from zero
                    if (!data[newIndex]) {
                        if (canRestart) {
                            canRestart = false;
                            newIndex = 0;
                            continue;
                        }
                        return;
                    }
                    var value = data[newIndex][valueField];
                    value = formItem.mapValueToDisplay(value);
                    // strip HTML tags from the value before comparing the first char
                    var compChar = value.replace(/<(?:.|\n)*?>/gm, '').toLowerCase();
                    //this.logWarn("comparing " + buffer + " to value " + value);
                    if (isc.isA.String(value) && value.length > 0 && compChar.startsWith(buffer)) {
                        //this.logWarn("FOUND " + buffer + " in value " + value + " at index " + newIndex);
                        if (!formItem.multiple) this.deselectAllRecords();
                        this.scrollRecordIntoView(newIndex);
                        if (navStyle == "focus") {
                            this._hiliteRecord(newIndex);
                        } else {
                            
                            this._generateCellClick(newIndex,null,true);
                        }
                        return;
                    }
                    newIndex += 1;
                    if (newIndex >= data.length) newIndex = 0;
                }
            }
        }

        // If the "Enter" key was pressed, but no record was selected, dismiss the menu
        // (this is really useful for the ComboBox item when showAllRecords is true and
        // the user has entered a value that isn't in the c-box).
        if (this.getFocusRow() == null && keyName == "Enter") {
            this.cancel();
            return false;
        }

        if (["Page_Up","Page_Down","Home","End"].contains(keyName)) {
            // navigation other than arrow-keys - store the keyName so that scrolled() will
            // hilite an appropriate record, once the viewport has been updated
            this._updateFocusKeyName = keyName;
        }

        // escape click and enter are handled by the superclass implementation
        return this.Super("bodyKeyPress", arguments);
    },

    scrolled : function () {
        if (this._updateFocusKeyName) {
            // scroll was initiated by keyboard-navigation other than arrow-keys - hilite an
            // appropriate record in the new viewport
            var rowNum;
            if (this._updateFocusKeyName == "End") rowNum = this.data.getLength();
            else rowNum = this.getVisibleRows()[0];
            if (rowNum != null) {
                //isc.logWarn("hiliting record " + rowNum);
                this._hiliteRecord(rowNum);
            }
            delete this._updateFocusKeyName;
        }
    },

    // Override dataChanged -- avoid redrawing to show temp. loading rows - wait
    // for the rows to come back from the server instead.
    
    dataChanged : function (operation, record, row, lastUpdateData) {
        var data = this.data;
        if (!data) return;
        
        var data = this.requestVisibleRows();
        if (data && Array.isLoading(data[0])) {
            // this.logWarn("not redrawing since data still loading");
            return;
        }
        
        this.Super("dataChanged", arguments);

        // If the currently selected record changed, we should refresh our value to pick up the
        // change.
        var formItem = this.formItem;
        if (record && this.getSelectedRecord() == record && formItem) {
            var index = this.data.indexOf(record),
                modifiedRecord = index == -1 ? null : this.data.get(index);
            if (modifiedRecord) {
                var fieldName = formItem.getValueFieldName();
                formItem.setValue(modifiedRecord[fieldName]);
            } else {
                formItem.clearValue();
            }
        }
    },
                                
    
    createBodies : function () {
        if (this.body && this.body._reused) delete this.body._reused;
        this.Super("createBodies", arguments);
    }
};


isc.PickListMenu.addClassProperties(isc._ScrollingPickerClassProperties);
isc.PickListMenu.addProperties(isc._ScrollingPickerProperties);
isc.PickListMenu.changeDefaults("bodyDefaults", {
    // Override getCellStyleName() - historically we'd simply select cells to indicate
    // highlighting - no separate over styling required.
    // Now we use standard ListGrid hilighting APIs, so there is a separate Over vs
    // Selected state for cells. However older skins will commonly not have the "Over"
    // styles in place. Therefore we have a flag "showOverAsSelected" which will 
    // show the same styling for hilighted "Over" cells as for "Selected" cells.
    remapOverStyles:[
            0, // 0 = baseStyle
            2, // 1 = Over(1) --> "Selected"
            2, // 2 = Selected(2)
            2, // 3 = Selected(2) + Over(1) --> "Selected"
            4, // 4 = Disabled(4)
            6, // 5 = Disabled(4) + Over(1) --> "Disabled + Selected"
            6, // 6 = Disabled(4) + Selected(2)
            6, // 7 = Disabled(4) + Selected(2) + Over(1) --> "Disabled + Selected"
            8, // 8 = Dark(8)
            10, // 9 = Dark(8) + Over(1) --> "Dark + Selected"
            10, // 10 = Dark(8) + Selected(2)
            10, // 11 = Dark(8) + Selected(2) + Over(1) --> "Dark + Selected"
            12 // 12 = Dark(8) + Disabled(4)
    ],
    getCellStyleName : function (styleIndex, record, rowNum, colNum) {
        if (this.grid && this.grid.showOverAsSelected) {
            styleIndex = this.remapOverStyles[styleIndex];
        }
        return this.Super("getCellStyleName", [styleIndex, record, rowNum, colNum], arguments);
    },

    // Override selectOnMouseDown on the body to catch checkbox selects on a multi-select
    // item and update the item
    
    selectOnMouseDown : function (record, rowNum, colNum, d,e,f) {
    
        var isMulti = this.grid.allowMultiSelect,
            selApp = isMulti && this.grid.selectionAppearance,
            cbSel = (selApp == "checkbox") && 
                    (this.grid.frozenFields == null || this.grid.frozenBody == this) &&
                    (colNum == this.grid.getCheckboxFieldPosition());
        var rv = this.Super("selectOnMouseDown", arguments);
        if (cbSel) {
            this.grid.multiSelectChanged();
        }
        return rv;
    }
});

//>	@class PickTreeMenu
// +link{class:TreeGrid} subclass used, by default, by FormItems which implement
// +link{interface:PickList} to display a +link{pickList.dataSetType, collapsible tree} of 
// selectable options.
// <P>
// Can be subclassed, customized and assigned to FormItems 
// via the +link{comboBoxItem.pickTreeConstructor, pickTreeConstructor} attribute.
// @inheritsFrom TreeGrid
// @treeLocation Client Reference/Forms/Form Items
// @visibility external
//<

isc.defineClass("PickTreeMenu", "ScrollingTreeMenu");
isc.PickTreeMenu.addClassProperties(isc._ScrollingPickerClassProperties);
isc.PickTreeMenu.addProperties(isc._ScrollingPickerProperties);
isc.PickTreeMenu.addProperties({
    fireItemClickForFolders: true
});
isc.PickTreeMenu.changeDefaults("bodyDefaults", {
    // Override getCellStyleName() - historically we'd simply select cells to indicate
    // highlighting - no separate over styling required.
    // Now we use standard ListGrid hilighting APIs, so there is a separate Over vs
    // Selected state for cells. However older skins will commonly not have the "Over"
    // styles in place. Therefore we have a flag "showOverAsSelected" which will 
    // show the same styling for hilighted "Over" cells as for "Selected" cells.
    remapOverStyles:[
            0, // 0 = baseStyle
            2, // 1 = Over(1) --> "Selected"
            2, // 2 = Selected(2)
            2, // 3 = Selected(2) + Over(1) --> "Selected"
            4, // 4 = Disabled(4)
            6, // 5 = Disabled(4) + Over(1) --> "Disabled + Selected"
            6, // 6 = Disabled(4) + Selected(2)
            6, // 7 = Disabled(4) + Selected(2) + Over(1) --> "Disabled + Selected"
            8, // 8 = Dark(8)
            10, // 9 = Dark(8) + Over(1) --> "Dark + Selected"
            10, // 10 = Dark(8) + Selected(2)
            10, // 11 = Dark(8) + Selected(2) + Over(1) --> "Dark + Selected"
            12 // 12 = Dark(8) + Disabled(4)
    ],
    getCellStyleName : function (styleIndex, record, rowNum, colNum) {
        if (this.grid && this.grid.showOverAsSelected) {
            styleIndex = this.remapOverStyles[styleIndex];
        }
        return this.Super("getCellStyleName", [styleIndex, record, rowNum, colNum], arguments);
    }
});

} // end of if (isc.TreeGrid)...
