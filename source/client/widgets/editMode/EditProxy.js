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
//> @class EditProxy
// An EditProxy is attached to an editable component when editMode is enabled. This proxy
// has methods and properties which affect the component during editing.
//
// @group devTools
// @treeLocation Client Reference/Tools
// @visibility external
//<


isc.defineClass("EditProxy", "Class");

isc.EditProxy.addClassProperties({
    resizeThumbConstructor:isc.Canvas,
    resizeThumbDefaults:{
        autoDraw:false,
        destroyWithMaster:false,
        _showWithMaster:true,
        _setOpacityWithMaster:false,
        overflow:"hidden", 
        canDrag:true,
        canDragResize:true,
        // resizeEdge should be the edge of the target, not the thumb
        getEventEdge : function () { return this.edge; },
        depeered : function (oldMaster, name) {
            this.hide();
        }
    },

    minimumDropMargin: 2,
    minimumDropTargetSize: 10,

    // Resize thumbs
    // ---------------------------------------------------------------------------------------

    // NOTE: EditProxy thumbs vs one-piece mask?
    // - since we reuse the same set of thumbs, there's no real performance issue
    // - one-piece mask implementations: 
    //   - if an image with transparent regions, thumbs would scale 
    //   - if a table
    //     - event handling iffy - transparent table areas may or may not intercept
    //     - would have to redraw on resize
    //   - transparent Canvas with absolutely-positioned DIVs as content
    //     - event handling might be iffy
    // - would have bug: when thumbs are showing, should be able to click between them to hit
    //   something behind the currently selected target
    // - when thumbs are not showing, mask still needs to be there, but would need to shrink and not
    //   show thumbs
    _makeResizeThumbs : function () {
        
        var edgeCursors = isc.Canvas.getInstanceProperty("edgeCursorMap"),
            thumbs = {},
            thumbClass = isc.ClassFactory.getClass(this.resizeThumbConstructor, true);
        for (var thumbPosition in edgeCursors) {
            var corner = thumbPosition.length == 1;
            // NOTE: can't use standard autoChild creation because we are in static scope -
            // thumbs are globally shared
            thumbs[thumbPosition] = thumbClass.create({
                 ID:"isc_resizeThumb_" + thumbPosition,
                 edge:thumbPosition,
                 snapTo:thumbPosition,
                 snapOffsetTop:(thumbPosition[0] === "T" ? -7 : (thumbPosition[0] === "B" ? 7 : 0)),
                 snapOffsetLeft:(thumbPosition[thumbPosition.length - 1] === "R" ? 7 : (thumbPosition[thumbPosition.length - 1] === "L" ? -7 : 0)),
                 styleName: corner? "resizeThumb": "resizeThumb cornerResizeThumb",
                 width: corner? 7 : 9,
                 height: corner? 7 : 9
            }, this.resizeThumbDefaults, this.resizeThumbProperties)
        }
        this._resizeThumbs = thumbs;

        this._observer = isc.Class.create();
    },

    // target is either the mask or the masked-component
    showResizeThumbs : function (target) {
        if (!target) return;
        if (target.editProxy) {
            if (!target.editProxy.hasEditMask()) {
                // Component has no edit mask so resize thumbs are not applicable
                return;
            }
            target = target.editProxy.getEditMask();
        }

        if (!isc.EditProxy._resizeThumbs) isc.EditProxy._makeResizeThumbs();

        var thumbSize = isc.EditProxy.resizeThumbDefaults.width,
            thumbs = isc.EditProxy._resizeThumbs;

        for (var thumbName in thumbs) {
            var thumb = thumbs[thumbName];
            // set all the thumbs to drag resize the canvas we're masking
            thumb.dragTarget = target;
            // show all the thumbs
            thumb.bringToFront();
            thumb.show();
            target.addPeer(thumb);
        }

        this._thumbTarget = target;
        target.enableKeyMovement(true);
    },

    hideResizeThumbs : function () {
        var thumbs = this._resizeThumbs;
        for (var thumbName in thumbs) {
            var thumb = thumbs[thumbName];
            thumb.depeer();
        }
        if (this._thumbTarget) this._thumbTarget.enableKeyMovement(false);

        this._thumbTarget = null;
    },

    getThumbTarget : function () {
        return this._thumbTarget;
    },

    // Splits a string into an array of values based on the <separatorChar>.
    // Handles escaping of <separatorChar>.
    splitString : function (string, separatorChar, escapeChar) {
        if (!string) return [];
        var chars = string.split(""),
            escaped = false,
            values = [],
            value = []
        ;
        for (var i = 0; i < chars.length; i++) {
            var char = chars[i];
            if (char == escapeChar && !escaped) {
                escaped = true;
                // eat escape char
            } else if (escaped) {
                // Only un-escape an escaped separatorChar
                if (char != separatorChar) value.push(escapeChar);
                value.push(char);
                escaped = false;
            } else if (char == separatorChar) {
                // save trimmed value
                values.push(isc.EditProxy.trimTrailingSpaces(value.join("").replace(/^\s+/g,"")));
                value = [];
            } else {
                value.push(char);
            }
        }
        if (value.length > 0) {
            // save trimmed value
            values.push(isc.EditProxy.trimTrailingSpaces(value.join("").replace(/^\s+/g,"")));
        }
        return values;
    },

    
    parseStringValueMap : function (string, separatorChar, escapeChar, displaySeparatorChar, selectedChar, matchDisplayWithValue, alwaysUseMap) {
        var values = isc.EditProxy.splitString(string, separatorChar, escapeChar);
        if (values.length == 0) return {};

        var map = {},
            array = [],
            selectedValues = [],
            usingMap = alwaysUseMap,
            splitCount = 0,
            majority = (values.length/2) << 0
        ;
        for (var i = 0; i < values.length; i++) {
            var value = values[i];
            if (!displaySeparatorChar) {
                var result = isc.EditProxy._getSelectedValue(value, escapeChar, selectedChar);
                if (result.selected) selectedValues.push(result.value);
                array.push(result.value);
            } else {
                // If there are a mixture of value:displayValue and value only records
                // entered, we will process these into both the array and map. If the
                // number of value:displayValue records becomes a majority, the map
                // will be returned; otherwise the array is used.
                var displayValues = isc.EditProxy.splitString(value, displaySeparatorChar, escapeChar);
                var result = isc.EditProxy._getSelectedValue(displayValues[0], escapeChar, selectedChar);
                if (result.selected) selectedValues.push(result.value);

                array.push(result.value);

                if (displayValues.length == 1) {
                    map[result.value] = (matchDisplayWithValue ? result.value : null);
                } else {
                    value = result.value;
                    var result = isc.EditProxy._getSelectedValue(displayValues[1], escapeChar, selectedChar);
                    map[value] = result.value;
                    if (result.selected && !selectedValues.contains(value)) selectedValues.push(value);

                    // If we reached a majority of split values, return map
                    if (++splitCount > majority) usingMap = true;
                }
            }
        }

        return {
            valueMap: (usingMap ? map : array),
            value: (selectedValues.length == 0 ? null : (selectedValues.length == 1 ? selectedValues[0] : selectedValues))
        };
    },

    // Trim trailing spaces from the string respecting escaped spaces (i.e. "\ ")
    trimTrailingSpaces : function (string, escapeChar) {
        escapeChar = escapeChar || "\\";

        var length = string.length;
        if (length == 1) {
            if (string == " ") return "";
            return string;
        }

        for (var i = length-1; i > 0; i--) {
            var c = string.substring(i,i+1),
                pc = string.substring(i-1,i)
            ;
            if (c != " " || pc == "\\") {
                string = string.substring(0,i+1);
                break;
            } 
        }
        return string;
    },

    _getSelectedValue : function (string, escapeChar, selectedChar) {
        var result = {};
        if (selectedChar && string.startsWith(selectedChar)) {
            result.value = string.substring(1).replace(/^\s+/,"");
            result.selected = true;
        } else if (selectedChar && string.endsWith(selectedChar)) {
            if (string.substring(string.length-2,string.length-1) != escapeChar) {
                result.value = isc.EditProxy.trimTrailingSpaces(string.substring(0,string.length-1));
                result.selected = true;
            } else {
                result.value = string;
            }
        } else {
            result.value = string;
        }
        return result;
    },

    // helper for extracting meaningful properties defaults using schema
    filterLiveObjectBySchema : function(nodeType, liveObject) {
        var result = {};

        var schema = isc.DS.get(nodeType);
        if (!schema) return result;

        var fields = schema.fields;
        for (var key in fields) {
            var value = liveObject[key];
            if (fields.hasOwnProperty(key) && liveObject.hasOwnProperty(key)) {
                if (!isc.isAn.Object(value)) result[key] = value;
            }
        }
        return result;
    }
});

isc.EditProxy.addProperties({
    //> @attr editProxy.useEditMask (Boolean: null : IR)
    // When <code>true</code> an +link{editProxy.editMask} will be auto-generated and
    // placed over the component to allow selection, positioning and resizing.
    // <P>
    // If this property is not set it will enabled when added to an EditContext if its
    // parent component has an editProxy and +link{editProxy.autoMaskChildren} is <code>true</code>.
    //
    // @visibility external
    //<

    //> @attr editProxy.autoMaskChildren  (Boolean : null : IR)
    // When child nodes are added to an EditContext, should they be masked by setting
    // +link{editProxy.useEditMask} <code>true</code> if not explicitly set?
    //
    // @visibility external
    //<

    //> @attr editProxy.canSelectChildren    (Boolean : null : IRW)
    // Whether to allow selection of the children of this +link{EditNode}.  The appearance and
    // behavior of selected components is controlled by +link{selectedAppearance}, or centrally
    // across an +link{EditContext} via +link{editContext.selectedAppearance}.
    // <p>
    // Individual children can be marked non-selectable via setting +link{editProxy.canSelect}
    // to <code>false</code>.
    // <p>
    // Use the +link{EditContext} to access and manipulate the currently selected set of
    // EditNodes, via APIs such as +link{editContext.getSelectedEditNode()},
    // +link{editContext.selectSingleEditNode()} and
    // +link{editContext.selectedEditNodesUpdated}.
    //
    // @visibility external
    // @see editContext.canSelectEditNodes
    //<

    //> @attr editProxy.childrenSnapToGrid (Boolean : null : IRW)
    // If not null the +link{canvas.childrenSnapToGrid} on the component represented by this
    // EditProxy is set to this value only while in edit mode. This allows snapToGrid functionality
    // to be enforced during edit mode but not when live.
    //
    // @visibility external
    //<

    //> @attr editProxy.childrenSnapResizeToGrid (Boolean : null: IRW)
    // If not null the +link{canvas.childrenSnapResizeToGrid} on the component represented by this
    // EditProxy is set to this value only while in edit mode. This allows snapResizeToGrid functionality
    // to be enforced during edit mode but not when live.
    //
    // @visibility external
    //<

    //> @method editProxy.setCanSelectChildren() (A)
    // Setter for +link{editProxy.canSelectChildren,canSelectChildren}.
    // @param canSelect (boolean) the new canSelectChildren
    //
    // @visibility external
    //<
    setCanSelectChildren : function (canSelect) {
        if (canSelect == this.canSelectChildren) return;

        // Update properties to match new selection option
        this.restoreOverrideProperties();
        this.canSelectChildren = canSelect;
        this.saveOverrideProperties();

        // Enable copy/paste shortcuts on root node if canSelectChildren==true
        if (this.useCopyPasteShortcuts != false && canSelect && this.creator.editContext.getRootEditNode().liveObject == this.creator) {
            this.useCopyPasteShortcuts = true;
            this.enableCopyPasteKeyPressHandler(true);
        }
    },

    //> @attr editProxy.canSelect    (Boolean : null : IR)
    // Can this component be selected? Selection is allowed unless this
    // property is set to <code>false</code>.
    // @visibility external
    //<

    //> @attr editProxy.allowNestedDrops (Boolean : null : IR)
    // This property acts as a component-specific override for the +link{EditContext.allowNestedDrops}
    // property. Unless explicitly set to false, the +link{EditContext.allowNestedDrops} controls whether
    // a drop can be made into this component.
    // @visibility external
    //<

    // Copy and Paste
    // ---------------------------------------------------------------------------------------

    //> @attr editProxy.useCopyPasteShortcuts (Boolean : null : IR)
    // Whether to enable keyboard shortcuts to +link{editContext.copyEditNodes,copy} and
    // +link{editContext.pasteEditNodes,paste} <code>editNodes</code>.
    // <p>
    // Enabled by default if +link{editProxy.canSelectChildren,selection of children} is also enabled.
    // <p>
    // For pasting, if +link{editContext.allowNestedDrops} is enabled, only one editNode is selected and
    // it is a valid container for the contents of the clipboard, editNodes will be pasted as new
    // children of the selected container.  Otherwise, they will be pasted at the root level of the
    // +link{EditContext.getEditNodeTree(),editNodeTree}.
    // <p>
    // <code>useCopyPasteShortcuts</code> may only be set on the root <code>editNode</code>
    // within any one +link{editContext.getEditNodeTree(),editNodeTree}.
    //
    // @visibility external
    //<
 
    // Edit Mask
    // ---------------------------------------------------------------------------------------

    // At the Canvas level the Edit Mask provides moving, resizing, and standard context menu items.
    // The editMask should be extended on a per-widget basis to add things like drop behaviors or
    // additional context menu items.  Any such extensions should be delineated with 
    //>EditMode 
    //<EditMode
    // .. markers so it can be eliminated from normal builds.

    //> @attr editProxy.editMask (AutoChild Canvas : null : IR)
    // An editMask is created for any component placed into editMode with
    // +link{editProxy.useEditMask}:true.
    // <P>
    // Common customization properties can be provided by +link{editContext.editMaskProperties}.
    //
    // @visibility external
    //<

    editMaskDefaults:{

        canFocus: true,

        // Thumb handling
        // ---------------------------------------------------------------------------------------
        draw : function () {
            this.Super("draw", arguments);

            // stay above the master
            this.observe(this.masterElement, "setZIndex", "observer.moveAbove(observed)");

            // match the master's prompt (native tooltip).  Only actually necessary in Moz since IE
            // considers the eventMask transparent with respect to determining the prompt.
            this.observe(this.masterElement, "setPrompt", "observer.setPrompt(observed.prompt)");

            // disable/re-enable key movement during inline edits
            this.observe(this.masterElement.editProxy, "startInlineEditing", "observer.editingStarted()");
            this.observe(this.masterElement.editProxy, "inlineEditingComplete", "observer.editingComplete()");

            return this;
        },
        parentVisibilityChanged : function (newVisibility, parent, parentIsVisible) {
            this.Super("parentVisibilityChanged", arguments);
            if (isc.EditProxy.getThumbTarget() == this) isc.EditProxy.hideResizeThumbs();
        },
        // The _resizeWithMaster setting doesn't handle the DynamicForm situation where
        // overflow:visible is used.
        masterResized : function (deltaX, deltaY, reason) {
            // Resizing of the mask normally attempts to update the master element as well.
            // That is us. To prevent this recursive call set the flag used internally by
            // resized() to skip resizing the master.
            this._resizingMaster = true;
            this.resizeTo(this.masterElement.getVisibleWidth(), this.masterElement.getVisibleHeight());
            this._resizingMaster = false;
        },

        handleClick : function () {
            this.Super("handleClick", arguments);
            this.select();

            var component = this.masterElement;
            if (component.editProxy.supportsInlineEdit && 
                    this.editContext.enableInlineEdit &&
                    component.editProxy.inlineEditEvent == "click")
            {
                component.editProxy.startInlineEditing();
            }
            if (this.editContext.editMaskClicked) {
                this.editContext.editMaskClicked(component.editNode, component);
            }
            return isc.EH.STOP_BUBBLING;
        },

        handleDoubleClick : function () {
            this.Super("handleDoubleClick", arguments);
            this.select();

            var component = this.masterElement;
            if (component.editProxy.supportsInlineEdit && 
                    this.editContext.enableInlineEdit &&
                    (component.editProxy.inlineEditEvent == "doubleClick" || component.editProxy.inlineEditEvent == "dblOrKeypress"))
            {
                component.editProxy.startInlineEditing();
            }
            return isc.EH.STOP_BUBBLING;
        },

        // Only used with no group selection mask
        enableKeyMovement : function (enable) {
            if (enable) {
                if (!this._keyPressEventID) {
                    this._keyPressEventID = isc.Page.setEvent("keyPress", this);
                }
            } else {
                if (this._keyPressEventID) {
                    isc.Page.clearEvent("keyPress", this._keyPressEventID);
                    delete this._keyPressEventID;
                }
            }
        },

        // Keypress positioning of mask must be disabled while in inline edit
        // mode or the key is processed outside of the entry
        editingStarted : function () {
            this._keyPressEnabledBeforeEdit = (this._keyPressEventID != null);
            if (this._keyPressEnabledBeforeEdit) this.enableKeyMovement(false);
        },
        
        editingComplete : function () {
            if (this._keyPressEnabledBeforeEdit) this.enableKeyMovement(true);
        },

        select : function () {
            if (this.editPaneProxy && this.editPaneProxy.canSelectChildren) {
                var target = this.getTarget(),
                    multiSelect = (this.editContext.selectionType == isc.Selection.MULTIPLE)
                ;
                if (target.editProxy && target.editProxy.canSelect == false) return;
                if (this.editPaneProxy.bringToFrontOnSelect) target.bringToFront();
                else this.bringToFront();
    
                var modifierKeyDown = (isc.EH.shiftKeyDown() || (isc.Browser.isWin && isc.EH.ctrlKeyDown()));
    
                if (!this.editContext.isComponentSelected(target)) {
                    if (!multiSelect || !modifierKeyDown) {
                        this.editContext.selectSingleComponent(target);
                    } else {
                        this.editContext.selectComponent(target);
                    }
                } else {
                    if (!multiSelect || !modifierKeyDown) {
                        this.editContext.selectSingleComponent(target);
                    } else {
                        this.editContext.deselectComponents(target);
                    }
                }
            }
        },

        // Event Bubbling
        // ---------------------------------------------------------------------------------------

        

        
        moveAbove : function (canvas) {
            if (!this.editContext.isComponentSelected(this.masterElement) ||
                    this.getZIndex(true) <= canvas.getZIndex(true))
            {
                this.Super("moveAbove", arguments);
            }
        },

        // prevent bubbling to the editor otherwise we'll start a selection while trying to
        // select/move a component
        handleMouseDown : function () {
            this.Super("handleMouseDown", arguments);
            return isc.EH.STOP_BUBBLING;
        },

        handleMouseUp : function () {
            this.Super("handleMouseUp", arguments);
            return isc.EH.STOP_BUBBLING;
        },

        dragRepositionStart : function() {
            if (this.editPaneProxy && (!this.editPaneProxy.canSelectChildren || this.editPaneProxy.canSelect == false)) {
                // Cancel drag
                return false;
            }
            var target = this.getTarget();

            if (this.editPaneProxy && this.editPaneProxy.bringToFrontOnSelect) target.bringToFront();
            else this.bringToFront();
            // When we start to drag a component it should be selected
            if (this.editPaneProxy && this.editPaneProxy.canSelectChildren &&
                (this.editContext.selectionType != isc.Selection.MULTIPLE ||
                        !this.editContext.isComponentSelected(target))) 
            {
                this.editContext.selectSingleComponent(target);
            }

            // Let target's editProxy perform reposition start actions like showing snap grid
            return target.editProxy.dragRepositionStart();
        },

        dragRepositionStop : function() {
            // Let target's editProxy perform reposition stop actions like hiding snap grid
            var target = this.getTarget();
            return target.editProxy.dragRepositionStop();
        },

        dragResizeStart : function() {
            // Let target's editProxy perform resizing start actions like hiding snap grid
            var target = this.getTarget();
            return target.editProxy.dragResizeStart();
        },

        dragResizeStop : function() {
            // Let target's editProxy perform resizing stop actions like hiding snap grid
            var target = this.getTarget();
            return target.editProxy.dragResizeStop();
        },

        pageKeyPress : function (target, eventInfo) {
            // If root pane (or child) does not have focus, ignore keyPress 
            var rootPane = this.editContext.getRootEditNode().liveObject;
            if (!rootPane.containsFocus()) return;
            
            var keyName = isc.EH.getKey();
            if (keyName == null ||
                (keyName != "Arrow_Up" && keyName != "Arrow_Down" && keyName != "Arrow_Left" && keyName != "Arrow_Right"))
            {
                return;
            }
            var masked = this.masterElement,
                selection = masked.editContext.getSelectedComponents()
            ;

            // If our masked component is not selected, ignore the keypress
            if (!selection.contains(masked)) return;

            // Ignore keyboard movement for percentage-placed components
            if (this.isPercent(masked.left) || this.isPercent(masked.top)) return;

            // Ignore keyboard movement If component is positioned by snapTo with offset in percentage
            if (masked.snapTo && 
                    (this.isPercent(masked.snapOffsetLeft) || this.isPercent(masked.snapOffsetTop)))
            {
                return;
            }

            var parent = masked.parentElement,
                shiftPressed = isc.EH.shiftKeyDown(),
                vGap = (shiftPressed ? 1 : parent.snapVGap),
                hGap = (shiftPressed ? 1 : parent.snapHGap),
                delta = [0,0],
                result = false
            ;

            switch (keyName) {
            case "Arrow_Up":
                delta = [0, vGap * -1];
                break;
            case "Arrow_Down":
                delta = [0, vGap];
                break;
            case "Arrow_Left":
                delta = [hGap * -1, 0];
                break;
            case "Arrow_Right":
                delta = [hGap, 0];
                break;
            default:
                result = null;
                break;
            }

            
            if (delta[0] != 0 || delta[1] != 0) {
                parent._movingSelection = true;
                if (masked.snapTo) {
                    // Instead of repositioning component directly, just adjust the
                    // snapOffsets
                    masked.setSnapOffsetLeft((masked.snapOffsetLeft || 0) + delta[0]);
                    masked.setSnapOffsetTop((masked.snapOffsetTop || 0) + delta[1]);
                } else {
                    masked.moveBy(delta[0], delta[1]);
                }
                parent._movingSelection = false;
            }
            return result;
        },

        _$percent: "%",
        isPercent : function (value) {
            return (isc.isA.String(value) && isc.endsWith(value, this._$percent));
        },

        // Drag and drop move and resize
        // ---------------------------------------------------------------------------------------
        // D&D: some awkwardness
        // - if we set dragTarget to the masterElement, it will get the setDragTracker(), 
        //   dragRepositionMove() etc events, which it may have overridden, whereas we want just a
        //   basic reposition or resize, so we need to be the dragTarget
        // - to be in the right parental context, and to automatically respond to programmatic
        //   manipulation of the parent's size and position, we want to be a peer, but at the end of
        //   drag interactions we also need to move/resize the master, which would normally cause
        //   the master to move us, so we need to switch off automatic peer behaviors while we move
        //   the master

        // allow the mask to be moved around (only the thumbs allow resize)
        canDrag:true,
        canDragReposition:true,
        dragRepositionAppearance:"target",
    
        // don't allow setDragTracker to bubble in case some parent tries to set it inappropriately
        setDragTracker: function () { return isc.EH.STOP_BUBBLING },

        // when we're moved or resized, move/resize the master and update thumb positions
        moved : function () {
            this.Super("moved", arguments);

            var masked = this.masterElement;
            if (masked) {
                // calculate the amount the editMask was moved
                var deltaX = this.getOffsetLeft() - masked.getLeft();
                var deltaY = this.getOffsetTop() - masked.getTop();

                // relocate our master component (avoiding double notifications)
                this._moveWithMaster = false;
                masked.moveTo(this.getOffsetLeft(), this.getOffsetTop());
                this._moveWithMaster = true;
            }

            if (isc.EditProxy.getThumbTarget() == this) isc.EditProxy.showResizeThumbs(this);
        },

        resized : function() {
            this.Super("resized", arguments);

            // Recalculate dropMargin based on new visible size
            if (this.editPaneProxy) this.editPaneProxy.updateDropMargin();

            // don't loop if we resize master, master overflows, and we resize to overflow'd size
            if (this._resizingMaster) return;
            this._resizingMaster = true;

            var master = this.masterElement;
            if (master) {
                // resize the widget we're masking (avoiding double notifications)
                this._resizeWithMaster = false;
                master.resizeTo(this.getWidth(), this.getHeight());
                this._resizeWithMaster = true;

                // the widget we're masking may overflow, so redraw if necessary to get new size so,
                // and match its overflow'd size
                master.redrawIfDirty();
                this.resizeTo(master.getVisibleWidth(), master.getVisibleHeight());
            }

            // update thumb positions
            if (isc.EditProxy.getThumbTarget() == this) isc.EditProxy.showResizeThumbs(this);

            this._resizingMaster = false;
        },

        // Editing Context Menus
        // ---------------------------------------------------------------------------------------
        // standard context menu items plus the ability to add "editMenuItems" on the master
        showContextMenu : function () {
            // Showing context menu should also shift selected component unless
            // the component is part of a selection already.
            var target = this.masterElement,
                targetSelected = this.editContext.isComponentSelected(target);
            if (this.editPaneProxy && this.editPaneProxy.canSelectChildren && this.editPaneProxy.canSelect != false) {
                if (!targetSelected) {
                    this.editContext.selectSingleComponent(target);
                }
            }

            // Show multiple-selection menu iff menu target is part of selection
            var selection = this.editContext.getSelectedComponents(),
                menuItems;
            if (selection.length > 1 && targetSelected) { 
                // multi-select
                menuItems = this.multiSelectionMenuItems;
            } else {
                menuItems = this.standardMenuItems;
            }

            if (!this.contextMenu) this.contextMenu = this.getMenuConstructor().create({});
            this.contextMenu.setData(menuItems);

            // NOTE: show the menu on the mask to allow reference to the editPane
            // and/or proxy.
            this.contextMenu.showContextMenu(this);
            return false;
        },
        // Menu actions
        componentsRemove : function () {
            this.editContext.getSelectedComponents().callMethod("destroy");
        },
        componentsBringToFront : function () {
            this.editContext.getSelectedComponents().callMethod("bringToFront");
        },
        componentsSendToBack : function () {
            this.editContext.getSelectedComponents().callMethod("sendToBack");
        },
        // Single and multiple-selection menus
        standardMenuItems:[
            {title:"Bring to front", click:"target.componentsBringToFront()"},
            {title:"Send to back", click:"target.componentsSendToBack()"},
            {title:"Remove", click:"target.componentsRemove()"}
        ],
        multiSelectionMenuItems: [
            {title:"Bring to front", click:"target.componentsBringToFront()"},
            {title:"Send to back", click:"target.componentsSendToBack()"},
            {title: "Remove selected items", click:"target.componentsRemove()"}
        ]
    }
});

isc.EditProxy.addMethods({

    setEditMode : function (editingOn) {
        if (editingOn) {
            this.saveOverrideProperties();
            // Calculate dropMargin based on visible size
            if (isc.isA.Canvas(this.creator)) this.updateDropMargin();
            // Add an event mask if so configured
            if (this.useEditMask) {
                var editContext = this.creator.editContext,
                    parentNode = editContext.getParentNode(this.creator.editNode)
                ;
                if (parentNode && parentNode.liveObject) this.showEditMask(parentNode.liveObject);
            }
            if (this.hasEditMask()) this.showEditMask();

            // Enable copy/paste shortcuts on root node if canSelectChildren==true
            if (this.useCopyPasteShortcuts != false &&
                this.canSelectChildren &&
                this.creator.editContext.getRootEditNode().liveObject == this.creator)
            {
                this.useCopyPasteShortcuts = true;
            }
            if (this.useCopyPasteShortcuts) {
                this.enableCopyPasteKeyPressHandler(true);
            }

        } else {
            this.restoreOverrideProperties();
            this.hideEditMask();
            this.enableCopyPasteKeyPressHandler(false);
        }
        // Set initial/final state
        this.updateVisibilityMask();

        // Convert property to boolean if needed
        if (this.persistCoordinates != null && isc.isA.String(this.persistCoordinates)) {
            this.persistCoordinates = (this.persistCoordinates == "true");
        }
    },

    // called after any node is updated which could involve changes in visibility rules
    editNodeUpdated : function (editNode, editContext, modifiedProperties) {
        this.updateVisibilityMask();
    },

    componentHiddenByRuleMessage: "Component would be hidden by visibility rule - edit Visible When property to change",
    componentInitiallyHiddenMessage: "Component is marked as initially hidden",

    getVisibilityMaskManager : function () {
        var liveObject = this.creator,
            manager
        ;
        if (liveObject.editContext && liveObject.editContext.getVisibilityMaskManager) {
            manager = liveObject.editContext.getVisibilityMaskManager();
        }
        return manager;
    },

    updateVisibilityMask : function () {
        var liveObject = this.creator,
            node = liveObject.editNode,
            editingOn = liveObject.editingOn
        ;

        // When removing a rule the rule won't fire again so node._hiddenByRule is left
        // in its last state. Since this method is triggered on the remove check for that
        // condition and remove the orphaned state.
        if (node && node._hiddenByRule) {
            var defaults = node.defaults || {};
            if (!defaults.visibleWhen) delete node._hiddenByRule;
        }

        var formItemProxyCanvas;
        if (isc.isA.FormItemProxyCanvas(liveObject)) {
            formItemProxyCanvas = liveObject;
            liveObject = liveObject.formItem;
        }
        var visibilityMaskManager = this.getVisibilityMaskManager();
        if (!visibilityMaskManager) return;

        if (editingOn && ((isc.isA.Window(liveObject) && liveObject.isModal) ||
                            (node && node._hiddenByRule)))
        {
            var reason = (node && node._hiddenByRule
                ? this.componentHiddenByRuleMessage
                : this.componentInitiallyHiddenMessage);

            if (isc.isA.FormItem(liveObject)) {
                visibilityMaskManager.addFormItem(liveObject.form,
                    formItemProxyCanvas || liveObject,
                    reason);
            } else {
                visibilityMaskManager.addComponent(liveObject, reason);
            }
        } else if (visibilityMaskManager) {
            if (isc.isA.FormItem(liveObject)) {
                visibilityMaskManager.removeFormItem(liveObject.form,
                    formItemProxyCanvas || liveObject);
            } else {
                visibilityMaskManager.removeComponent(liveObject);
            }
        }
    },

    // Called by "visibility" validator (used by VisibleWhen rules) to indicate the actual
    // hidden state of component per rule. The validator will always make the component
    // visible in editMode so this state allows hidden components to be indicated with
    // special attributes.
    setHiddenByRule : function (hidden) {
        var liveObject = this.creator,
            node = liveObject.editNode
        ;
        if (!node) return;

        var changed = false;
        if (hidden && !node._hiddenByRule) {
            node._hiddenByRule = true;
            changed = true;
        } else if (!hidden && node._hiddenByRule) {
            delete node._hiddenByRule;
            changed = true;
        }
        if (changed) this.updateVisibilityMask();
    },

    getOverrideProperties : function () {
        var properties = {
            canAcceptDrop: true,
            canDropComponents: true
        };

        if (this.canSelectChildren) {
            isc.addProperties(properties, {
                canDrag: true,
                dragAppearance: "none"
                
            });
        }
        if (this.childrenSnapToGrid != null) {
            if (isc.isA.String(this.childrenSnapToGrid)) this.childrenSnapToGrid = (this.childrenSnapToGrid == "true");
            properties.childrenSnapToGrid = this.childrenSnapToGrid;
            properties.snapGridStyle = "lines";
        }
        if (this.showSnapGrid != null) {
            if (isc.isA.String(this.showSnapGrid)) this.showSnapGrid = (this.showSnapGrid == "true");
            properties.showSnapGrid = this.showSnapGrid;
            properties.snapGridStyle = "lines";
        }
        if (this.childrenSnapAlign != null) {
            if (isc.isA.String(this.childrenSnapAlign)) this.childrenSnapAlign = (this.childrenSnapAlign == "true");
            properties.childrenSnapAlign = this.childrenSnapAlign;
            properties.childrenSnapEdgeAlign = false;
            
        }
        if (this.childrenSnapResizeToGrid != null) {
            if (isc.isA.String(this.childrenSnapResizeToGrid)) this.childrenSnapResizeToGrid = (this.childrenSnapResizeToGrid == "true");
            properties.childrenSnapResizeToGrid = this.childrenSnapResizeToGrid;
        }
        return properties;
    },

    destroy : function () {
        this.enableCopyPasteKeyPressHandler(false);

        // Remove any visibility masks
        var liveObject = this.creator,
            formItemProxyCanvas
        ;
        if (isc.isA.FormItemProxyCanvas(liveObject)) {
            formItemProxyCanvas = liveObject;
            liveObject = liveObject.formItem;
        }
        var visibilityMaskManager = this.getVisibilityMaskManager();
        if (visibilityMaskManager) {
            if (isc.isA.FormItem(liveObject)) {
                visibilityMaskManager.removeFormItem(liveObject.form,
                    formItemProxyCanvas || liveObject);
            } else {
                visibilityMaskManager.removeComponent(liveObject);
            }
        }

        this.Super("destroy", arguments);
    },

    
    addDynamicProperty : function (propertyName, source, fromInit) {
        var liveObject = this.creator;
        liveObject.addDynamicProperty(propertyName, source, fromInit);
    },

    clearDynamicProperty : function (propertyName) {
        var liveObject = this.creator;
        liveObject.clearDynamicProperty(propertyName);
    },

    removeDynamicProperty : function (propertyName) {
        var liveObject = this.creator;
        liveObject.removeDynamicProperty(propertyName);
    },

    hasDynamicProperty : function (propertyName) {
        var liveObject = this.creator;
        return liveObject.hasDynamicProperty(propertyName);
    },

    getDynamicProperty : function (propertyName) {
        var liveObject = this.creator;
        return liveObject.getDynamicProperty(propertyName);
    },

    enableCopyPasteKeyPressHandler : function (enable) {
        if (enable) {
            if (!this._keyPressEventID) {
                this._keyPressEventID = isc.Page.setEvent("keyPress", this);
            }
        } else {
            if (this._keyPressEventID) {
                isc.Page.clearEvent("keyPress", this._keyPressEventID);
                delete this._keyPressEventID;
            }
        }
    },

    // Called after a new node is created by a drop
    nodeDropped : function (node, parentNode) {
        if (this.inlineEditOnDrop) {
            // Give the object a chance to draw before we start the edit, otherwise the 
            // editor co-ordinates will be wrong
            this.delayCall("startInlineEditing");
        }
        // track what palette component the user has dropped
        if (this.creator.editContext.addUsageRecord) {
            this.creator.editContext.addUsageRecord("componentAdd", node, parentNode);
        }
    },

    editTitle : function (liveObject, initialValue, completionCallback) {
        var liveObject = liveObject || this.creator,
            left,
            width,
            top;

        if (isc.isA.Button(liveObject)) {  // This includes Labels and SectionHeaders
            left = liveObject.getPageLeft() + liveObject.getLeftBorderSize() + liveObject.getLeftMargin() + 1 
                                                  - liveObject.getScrollLeft(); 
            width = liveObject.getVisibleWidth() - liveObject.getLeftBorderSize() - liveObject.getLeftMargin() 
                               - liveObject.getRightBorderSize() - liveObject.getRightMargin() - 1;
        } else if (isc.isA.StretchImgButton(liveObject)) {
            left = liveObject.getPageLeft() + liveObject.capSize;
            width = liveObject.getVisibleWidth() - liveObject.capSize * 2;
        } else {
            isc.logWarn("Ended up in editTitle with a StatefulCanvas of type '" + 
                    liveObject.getClass() + "'.  This is neither a Button " +
                        "nor a StretchImgButton - editor will work, but will hide the " +
                        "entire component it is editing");
            left = liveObject.getPageLeft();
            width = liveObject.getVisibleWidth();
        }

        isc.Timer.setTimeout({target: isc.EditContext,
                              methodName: "manageTitleEditor", 
                              args: [liveObject, left, width, top, null, initialValue, null, completionCallback]}, 0);
    },

    // This function is only called for ImgTabs that need to be scrolled into view
    repositionTitleEditor : function () {
        var liveObject = this.creator;
        var left = liveObject.getPageLeft() + liveObject.capSize,
            width = liveObject.getVisibleWidth() - liveObject.capSize * 2;
        
        isc.EditContext.positionTitleEditor(liveObject, left, width);
    },

    // Save/restore property functionality
    // ---------------------------------------------------------------------------------------

    // These methods are based on Class.saveToOriginalValues and Class.restoreFromOriginalValues.
    // This is necessary because edit values can be merged into saved values and should be
    // restored when done.
    saveOverrideProperties : function () {
        var properties = this.getOverrideProperties();
        this.overrideProperties(properties);
    },
    
    restoreOverrideProperties : function () {
        var properties = this.getOverrideProperties();
        this.restoreProperties(isc.getKeys(properties));
    },

    overrideProperties : function (properties) {
        this.creator.saveToOriginalValues(isc.getKeys(properties));
        this.creator.setProperties(properties);
    },

    restoreProperties : function (fieldNames) {
        if (fieldNames == null) return;
        this.creator.restoreFromOriginalValues(fieldNames);
    },

    // Edit Mask
    // ---------------------------------------------------------------------------------------

    showEditMask : function (editPane) {
        var liveObject = this.creator,
            svgID = liveObject.getID() + ":<br>" + liveObject.src;

        // create an edit mask if we've never created one or it was destroyed
        
        if (!this._editMask || this._editMask.destroyed) {

            // special SVG handling
            // FIXME: move all SVG-specific handling to SVG.js
            var svgProps = { };
            if (isc.SVG && isc.isA.SVG(liveObject) && isc.Browser.isIE) {
                isc.addProperties(svgProps, {
                    backgroundColor : "gray",
                    mouseOut : function () { this._maskTarget.Super("_hideDragMask"); },
                    contents : isc.Canvas.spacerHTML(10000,10000, svgID)
                });
            }
    
            var props = isc.addProperties({}, this.editMaskDefaults, this.editMaskProperties, 
                                          // assume the editContext is the parent if none is
                                          // provided
                                          {editPane:editPane,
                                           editPaneProxy:editPane.editProxy,
                                           editContext:liveObject.editContext || liveObject.parentElement, 
                                           keepInParentRect: liveObject.keepInParentRect},
                                          svgProps);
            // When placing an editMask over a CanvasItem (ex. FileItem),
            // must use the internal canvas as the target
            if (isc.isA.CanvasItem(liveObject)) {
                liveObject.canvas.editProxy = liveObject.editProxy;
                liveObject = liveObject.canvas;
            }
            this._editMask = isc.EH.makeEventMask(liveObject, props);
        }
        this._editMask.show();

        // SVG-specific
        if (isc.SVG && isc.isA.SVG(liveObject)) {
            if (isc.Browser.isIE) liveObject.showNativeMask();
            else {
                liveObject.setBackgroundColor("gray");
                liveObject.setContents(svgID);
            }
        }
    },
    hideEditMask : function () {
        if (this._editMask) this._editMask.hide();
    },
    setEditMaskBorder : function (style) {
        if (this._editMask) this._editMask.setBorder(style);
    },
    hasEditMask : function () {
        return (this._editMask != null);
    },
    getEditMask : function () {
        return this._editMask;
    },


    // Drag move and resize
    // ---------------------------------------------------------------------------------------
    // Implemented in Canvas.childResized and Canvas.childMoved.

    mouseDown : function (event) {
        var liveObject = this.creator,
            target = event.target
        ;

        // Even in editMode some components need to pass on special
        // clicks to parts of the component. An example is a Tab which
        // has a close icon that should still close the tab in editMode.
        if (target == liveObject && liveObject.useEventParts) {
            if (liveObject.firePartEvent(event, isc.EH.MOUSE_DOWN) == false) return false;
        }
    },

    dragMove : function() {
        if (this.creator == this.creator.ns.EH.dragTarget) {
            return false;
        }
        if (this.creator.dragMove) return this.creator.dragMove();
    },

    // Snap grid
    // --------------------------------------------------------------------------------------------

    dragRepositionStart : function() {
        var retVal;
        if (this.creator.dragRepositionStart) retVal = this.creator.dragRepositionStart();
        // Show snap grid on parent
        if (this.creator.parentElement && this.creator.parentElement.editProxy) this.creator.parentElement.editProxy._showSnapGrid(true);

        return retVal;
    },

    dragRepositionStop : function() {
        var retVal;
        if (this.creator.dragRepositionStop) retVal = this.creator.dragRepositionStop();
        // Hide snap grid on parent
        if (this.creator.parentElement && this.creator.parentElement.editProxy) this.creator.parentElement.editProxy._showSnapGrid(false);

        return retVal;
    },

    dragResizeStart : function() {
        var retVal;
        if (this.creator.dragResizeStart) retVal = this.creator.dragResizeStart();
        // Show snap grid on parent
        if (this.creator.parentElement && this.creator.parentElement.editProxy) this.creator.parentElement.editProxy._showSnapGrid(true);

        return retVal;
    },

    dragResizeStop : function() {
        var retVal;
        if (this.creator.dragResizeStop) retVal = this.creator.dragResizeStop();
        // Hide snap grid on parent
        if (this.creator.parentElement && this.creator.parentElement.editProxy) this.creator.parentElement.editProxy._showSnapGrid(false);

        return retVal;
    },

    // Selection
    // ---------------------------------------------------------------------------------------

    //> @attr editProxy.selectedAppearance (SelectedAppearance : null : IR)
    // Appearance that is applied to selected component. Default value is determined from
    // +link{editContext.selectedAppearance}.
    // <P>
    // When value is <code>null</code> the appearance is determined by:
    // <ul>
    // <li>If multiple selection is enabled, "tintMask" is used</li>
    // <li>Otherwise, "outlineMask" is used 
    // </ul>
    // @visibility external
    // @see editProxy.selectedBorder
    // @see editProxy.selectedTintColor
    // @see editProxy.selectedTintOpacity
    //<

    //> @attr editProxy.selectedBorder (String : null : IR)
    // Set the CSS border to be applied to the selection outline of the selected components.
    // Default value is determined from +link{editContext.selectedBorder}.
    // This property is used when +link{editProxy.selectedAppearance} is <code>outlineMask</code>
    // or <code>outlineEdges</code>.
    //
    // @visibility external
    //<

    //> @attr editProxy.selectedLabelBackgroundColor (String : null : IR)
    // The background color for the selection outline label. The
    // default is defined on +link{SelectionOutline} or +link{editContext.selectedLabelBackgroundColor}.
    // <P>
    // NOTE: A selected component label is only supported when
    // +link{editProxy.selectedAppearance,selectedAppearance} is "outlineEdges".
    //
    // @visibility external
    //<

    //> @attr editProxy.selectedTintColor (CSSColor : null : IR)
    // Mask color applied to +link{editProxy.editMask,editMask} of selected component when
    // +link{editProxy.selectedAppearance,selectedAppearance} is "tintMask".
    // Default value is determined from +link{editContext.selectedTintColor}.
    // @visibility external
    // @see editProxy.selectedTintOpacity
    //<

    //> @attr editProxy.selectedTintOpacity (Number : null : IR)
    // Opacity applied to +link{editProxy.editMask,editMask} of selected component when
    // +link{editProxy.selectedAppearance,selectedAppearance} is "tintMask".
    // @visibility external
    // @see editProxy.selectedTintColor
    //<

    //> @attr editProxy.showDragHandle (Boolean : null : IR)
    // Should drag handles or thumb be shown when this component is selected?
    // These are shown unless this property is set to <code>false</code>.
    // @visibility external
    //<

    click : function () {
        var liveObject = this.creator;

        if (liveObject.editNode) {
            isc.EditContext.selectCanvasOrFormItem(liveObject, true);

            // Make sure focus is somewhere in edit components.
            // This is needed to provide support for copy/paste keys
            var rootLiveObject = liveObject.editContext.getRootEditNode().liveObject;
            if (!rootLiveObject.containsFocus()) {
                rootLiveObject.setFocus(true);
            }
            return isc.EH.STOP_BUBBLING;
        }
    },

    getAllSelectableComponents : function () {
        var liveObject = this.creator;

        if (!liveObject.children) return null;
        var components = [];
        for (var i = 0; i < liveObject.children.length; i++) {
            var child = this.deriveSelectedComponent(liveObject.children[i]);
            if (child) components.add(child);
        }
        return components;
    },

    _$tintMask:"tintMask",
    _$outlineMask:"outlineMask",
    _$outlineEdges:"outlineEdges",
    _getSelectedAppearance : function () {
        if (this.selectedAppearance) return this.selectedAppearance;
        return (this.creator.editContext.selectionType == isc.Selection.MULTIPLE ? this._$tintMask : this._$outlineMask);
    },

    //> @method editProxy.showSelectedAppearance
    // This method applies the +link{editProxy.selectedAppearance,selectedAppearance} to the selected component
    // or resets it to the non-selected appearance. Override this method to create a custom
    // appearance.
    //
    // @param show (boolean) true to show component as selected, false otherwise
    // @visibility external
    //<
    showSelectedAppearance : function (show, hideLabel, showThumbsOrDragHandle, suppressDrag) {
        var undef,
            mode = this._getSelectedAppearance()
        ;

        if (mode == this._$tintMask) {
            var editMask = this.getEditMask();
            if (!editMask || editMask.destroyed) return;

            // Save original background color and opacity
            if (editMask._originalBackgroundColor === undef) {
                editMask._originalBackgroundColor = (editMask.backgroundColor === undef ? null : editMask.backgroundColor);
            }
            if (editMask._originalOpacity === undef) {
                editMask._originalOpacity = (editMask.opacity === undef ? null : editMask.opacity);
            }

            // Set or reset background color
            if (show && this.selectedTintColor != editMask.backgroundColor) {
                editMask.setBackgroundColor(this.selectedTintColor);
            } else if (!show && editMask._originalBackgroundColor != editMask.backgroundColor) {
                editMask.setBackgroundColor(editMask._originalBackgroundColor);
            }

            // Set or reset opacity
            if (show && this.selectedTintOpacity != editMask.opacity) {
                editMask.setOpacity(this.selectedTintOpacity);
            } else if (!show && editMask._originalOpacity != editMask.opacity) {
                editMask.setOpacity(editMask._originalOpacity);
            }

            // Restore default drag resizing appearance
            editMask.dragResizeAppearance = null;

            // Show/hide thumbs
            if (show && showThumbsOrDragHandle) isc.EditProxy.showResizeThumbs(editMask);
            else isc.EditProxy.hideResizeThumbs();

            // If not selected, make sure editMask is pushed back just
            // above the component.
            if (!show) editMask.moveAbove(this.creator);
        } else if (mode == this._$outlineMask) {
            var editMask = this.getEditMask();
            if (!editMask || editMask.destroyed) return;
            
            // Save original border
            if (editMask._originalBorder === undef) {
                editMask._originalBorder = (editMask.border === undef ? null : editMask.border);
            }

            // Set or reset border
            if (show && this.selectedBorder != editMask.border) {
                editMask.setBorder(this.selectedBorder);
            } else if (!show && editMask._originalBorder != editMask.border) {
                editMask.setBorder(editMask._originalBorder);
            }

            // Show resized component as it is being drag resized
            editMask.dragResizeAppearance = "target";

            // Show/hide thumbs
            if (show && showThumbsOrDragHandle) isc.EditProxy.showResizeThumbs(editMask);
            else isc.EditProxy.hideResizeThumbs();

            // If not selected, make sure editMask is pushed back just
            // above the component.
            if (!show) editMask.moveAbove(this.creator);
        } else if (mode == this._$outlineEdges) {
            var object = this.creator;

            if (show) {
                var underlyingObject,
                    label;
                if (object._visualProxy) {
                    var type = object.type || object._constructor;
                    label = "[" + type + " " + (object.name ? "name:" : "ID");
                    label += object.name || object.ID;
                    label += "]";
                    underlyingObject = object;
                    object = object._visualProxy;
                }

                var editContext = this.creator.editContext,
                    showLabel = !hideLabel
                ;

                // Set outline clipCanvas to our root component so the outline will be
                // clipped to it's actual, drawn dimension. This is only valid with 
                var rootComponent = editContext.getRootEditNode().liveObject;
                if (rootComponent.overflow != "visible") {
                    isc.SelectionOutline.clipCanvas = editContext.getRootEditNode().liveObject;
                }

                // Update SelectionOutline with this context's properties
                if (this.selectedBorder) isc.SelectionOutline.border = this.selectedBorder;
                if (editContext.selectedLabelBackgroundColor) isc.SelectionOutline.labelBackgroundColor = editContext.selectedLabelBackgroundColor;

                // Disable selection label if context has it disabled
                if (editContext.showSelectedLabel == false) showLabel = false;

                // Allow context user to override the selectionLabel text
                if (showLabel != false && !label && editContext.getSelectedLabelText) {
                    label = editContext.getSelectedLabelText(object);
                }

                // Only enable key movement when container allows absolute positioning
                var node = object.editNode,
                    parentNode = editContext.getEditNodeTree().getParent(node),
                    parentObject = (parentNode ? parentNode.liveObject : null),
                    enableKeys = (parentObject && parentNode != editContext.getRootEditNode() &&
                        ((isc.isA.DynamicForm(parentObject) && parentObject.itemLayout == "absolute") ||
                            (!isc.isA.DynamicForm(parentObject) && !isc.isA.Layout(parentObject))));
                ;
            
                isc.SelectionOutline.select(object, false, showLabel, label, this.getResizeEdges(), enableKeys);

                // Show drag handle (except on TabBar controls)
                
                if (showThumbsOrDragHandle && this.showDragHandle != false &&
                    !isc.isA.TabBar(object.parentElement))
                {
                    isc.SelectionOutline.showDragHandle();
                }
                if (!suppressDrag && this.overrideDragProperties) this.overrideDragProperties();

                // Allow context user to override the selectionLabel leading/trailing tools
                
                if (showLabel != false && editContext.getSelectedLabelTools) {
                    var tools = editContext.getSelectedLabelTools(object);
                    if (tools && tools[0] != null) isc.SelectionOutline.showLeadingTools(tools[0]);
                    if (tools && tools[1] != null) isc.SelectionOutline.showTrailingTools(tools[1]);
                }

            } else if (isc.SelectionOutline.getSelectedObject() == object) {
                isc.SelectionOutline.deselect();
                if (this.restoreDragProperties) this.restoreDragProperties();
            }
        }
    },

    // Callbacks from SelectionOutline so the parent snapGrid can be shown/hidden if enabled
    
    resizeStart : function () {
        if (isc.isA.FormItem(this.creator) && this.creator.form && this.creator.form.editProxy) {
            this.creator.form.editProxy._showSnapGrid(true);
        } else if (this.creator.parentElement && this.creator.parentElement.editProxy) {
            this.creator.parentElement.editProxy._showSnapGrid(true);
        }
    },
    
    resizeStop : function () {
        if (isc.isA.FormItem(this.creator) && this.creator.form && this.creator.form.editProxy) {
            this.creator.form.editProxy._showSnapGrid(false);
        } else if (this.creator.parentElement && this.creator.parentElement.editProxy) {
            this.creator.parentElement.editProxy._showSnapGrid(false);
        }
    },

    getResizeEdges : function () {
        // If parent component is a H/VLayout or Stack configure the highlight to
        // allow resizing of the component from along the length axis.
        var liveObject = this.creator,
            editContext = liveObject.editContext,
            node = liveObject.editNode,
            parentNode = liveObject.editContext.getEditNodeTree().getParent(node),
            resizeFrom
        ;
        if (parentNode) {
            var parentLiveObject = parentNode.liveObject;
            if (parentLiveObject) {
                if (isc.isA.Layout(parentLiveObject)) {
                    var vertical = parentLiveObject.vertical,
                        fill = ((vertical ? parentLiveObject.vPolicy : parentLiveObject.hPolicy) == isc.Layout.FILL),
                        childCount = parentLiveObject.getMembers().length,
                        objectIndex = parentLiveObject.getMemberNumber(liveObject),
                        lastMember = (objectIndex == (childCount-1)),
                        canResize = (!fill || !lastMember)
                    ;
                    // Normally we don't allow the last member of a layout to be resized,
                    // however, if the last member is explicitly sized by declaration in the
                    // class (ie. AbsoluteForm) or in the PalleteNode or EditNode defaults,
                    // allow the resize.
                    if (lastMember && !canResize) {
                        var hasExplicitNodeSize = (vertical ? node.defaults.height != null : node.defaults.width != null);
                        var hasExplicitInstanceSize = liveObject.getClass().getInstanceProperty(vertical ? "height" : "width") != null;
                        canResize = hasExplicitNodeSize || hasExplicitInstanceSize;
                    }
                    if (canResize) {
                        resizeFrom = (vertical ? "B" : "R");
                    }
                }
                if (parentLiveObject.editProxy) {
                    if ((editContext.persistCoordinates == null && parentLiveObject.editProxy.persistCoordinates) ||
                            (editContext.persistCoordinates && parentLiveObject.editProxy.persistCoordinates != false))
                    {
                        resizeFrom = ["B", "R"];
                    }
                }
            }
        }
        return resizeFrom;
    },

    // Copy and Paste
    // ---------------------------------------------------------------------------------------

    pageKeyPress : function (target, eventInfo) {
        var liveObject = this.creator;
        if (!liveObject.containsFocus()) return;

        if (this.useCopyPasteShortcuts) {
            var editContext = liveObject.editContext,
                selection = editContext.getSelectedComponents(),
                result = null
            ;

            var metaKeyDown = (isc.Browser.isMac ? isc.EH.metaKeyDown() : isc.EH.ctrlKeyDown());
            if (metaKeyDown) {
                switch (isc.EH.getKey()) {
                case "C":
                    var editNodes = editContext.getSelectedEditNodes();
                    editContext.copyEditNodes(editNodes);
                    result = false;
                    break;
                case "V":
                    if (selection.length == 1 && editContext.allowNestedDrops) {
                        editContext.pasteEditNodes(selection[0].editNode);
                    } else {
                        editContext.pasteEditNodes();
                    }
                    result = false;
                    break;
                }
            }
            return result;
        }
    },

    // Inline edit handling
    // ---------------------------------------------------------------------------------------

    doubleClick : function () {
        var liveObject = this.creator;

        // select the liveObject in the component tree, binding it to the properties pane
        if (liveObject.editNode) isc.EditContext.selectCanvasOrFormItem(liveObject, true);
        
        if (this.supportsInlineEdit && liveObject.editContext.enableInlineEdit &&
            (this.inlineEditEvent == "doubleClick" || this.inlineEditEvent == "dblOrKeypress"))
        {
            this.startInlineEditing();
        }
        return isc.EH.STOP_BUBBLING;
    },

    // Drag/drop method overrides
    // ---------------------------------------------------------------------------------------

    getEventDragData : function () {
        var liveObject = this.creator,
            dragData = liveObject.ns.EH.dragTarget.getDragData()
        ;

        // If dragData is null, this is probably because we are drag-repositioning a component
        // in a layout - the dragData is the component itself
        if (dragData == null || (isc.isAn.Array(dragData) && dragData.length == 0)) {
            dragData = liveObject.ns.EH.dragTarget;
            if (isc.isA.FormItemProxyCanvas(dragData)) {
                dragData = dragData.formItem;
            }
        } else if (isc.isAn.Array(dragData)) {
            dragData = dragData[0];
        }
        return dragData;
    },

    getEventDragType : function (dragData) {
        var dragType;
        if (isc.isA.Class(dragData)) dragType = dragData._constructor || dragData.Class;
        else if (dragData) dragType = dragData.type || dragData.className;
        return dragType;
    },

    willAcceptDrop : function (changeObjectSelection) {
        var liveObject = this.creator;

        // Prevent accepting drop of form onto itself
        var dragTarget = liveObject.ns.EH.dragTarget;
        if (liveObject == dragTarget) {
            this.logInfo("editProxy.willAcceptDrop for " + liveObject.ID + " = false - targeting self", "editModeDragTarget");
            return false;
        }

        var dragData = this.getEventDragData(),
            dragType = this.getEventDragType(dragData),
            logMessagePrefix = (this.logIsInfoEnabled("editModeDragTarget")
                ? "editProxy.willAcceptDrop for " + liveObject.ID + " using dragType " + dragType
                : null)
        ;
        if (!dragType) return false;

        this.logInfo(logMessagePrefix, "editModeDragTarget");

        var hiliteCanvas = this.findEditNode(dragType);

        var canAdd = this.canAddNode(dragType, dragTarget, dragData);

        // If canAdd is false, then we conclusively deny the add, without checking parents
        if (canAdd === false) {
            this.logInfo(logMessagePrefix + " = false - explicit canAddNode false", "editModeDragTarget");
            return false;
        }

        // If canAdd is falsy but not false (i.e. null or undefined), then we
        // check ancestors which are in editMode, to see if they can accept the
        // drop.
        
        if (dragType == null || !canAdd) {
            this.logInfo(logMessagePrefix + " - drop not accepted. Checking ancestors.", "editModeDragTarget");

            var ancestor = liveObject.parentElement;
            while (ancestor && !ancestor.editorRoot) {
                if (ancestor.editingOn) {
                    // Note that this may itself recurse to further ancestors ...
                    // thus, once it returns, all ancestors have been checked.
                    var ancestorAcceptsDrop = ancestor.editProxy.willAcceptDrop();
                    if (!ancestorAcceptsDrop) {
                        this.logInfo(logMessagePrefix + " = " + ancestorAcceptsDrop + " - No ancestor accepts drop.", "editModeDragTarget");
                        if (changeObjectSelection != false) {
                            // Hide any existing selected object
                            hiliteCanvas = isc.SelectionOutline.getSelectedObject();
                            if (hiliteCanvas && hiliteCanvas.editProxy) {
                                hiliteCanvas.editProxy.showSelectedAppearance(false);
                            }
                            this.setNoDropIndicator();
                        }
                        // Pass through the null or false response
                        return ancestorAcceptsDrop;
                    }
                    this.logInfo(logMessagePrefix + " = true - An ancestor accepts drop.", "editModeDragTarget");
                    return true;
                }
                // Note that the effect of the return statements in the
                // condition above is that we'll stop walking
                // the ancestor tree at the first parent where editingOn is true ...
                // at that point, we'll re-enter editProxy.willAcceptDrop
                ancestor = ancestor.parentElement;
            }

            // Given the return statements in the while condition above, we'll only get
            // here if no ancestor had editingOn: true
            if (changeObjectSelection != false) {
                if (hiliteCanvas && hiliteCanvas.editProxy) {
                    hiliteCanvas.editProxy.showSelectedAppearance(false);
                }
                this.setNoDropIndicator();
            }

            // The effect of returning "false" here (rather than "null"), is
            // that we don't let the potential drop bubble outside of the
            // ancestors that are in editMode. That is, if the EditContext as a
            // whole can't handle the drop, we indicate to callers that it
            // shouldn't bubble to ancestors of the EditContext.
            this.logInfo(logMessagePrefix + " = false - No parentElement in editMode found.", "editModeDragTarget");
            return false;
        }

        // This canvas can accept the drop, so select its top-level parent (in case it's a 
        // sub-component like a TabSet's PaneContainer)
        this.logInfo(logMessagePrefix + " = true", "editModeDragTarget");
        if (hiliteCanvas) {
            if (changeObjectSelection != false) {
                this.logInfo(liveObject.ID + ": selecting editNode object " + hiliteCanvas.ID);
                if (hiliteCanvas.editProxy && hiliteCanvas.editContext.allowNestedDrops) {
                    hiliteCanvas.editProxy.showSelectedAppearance(true, false, null, true);
                    hiliteCanvas.editProxy.clearNoDropIndicator();
                }
            }
            return true;
        } else {
            this.logInfo("findEditNode() returned null for " + liveObject.ID, "editModeDragTarget");
        }
        
        
        if (changeObjectSelection != false) {
            this.logInfo("In editProxy.willAcceptDrop, '" + liveObject.ID + "' was willing to accept a '" + 
                     dragType + "' drop but we could not find an ancestor with an editNode");
        }
        return true;
    }, 

    // Can a component be dropped at this level in the hierarchy?
    canDropAtLevel : function () {
        var liveObject = this.creator,
            editContext = liveObject.editContext,
            rootNode = editContext.getRootEditNode(),
            rootObject = editContext.getLiveObject(rootNode)
        ;
        
        return this.allowNestedDrops != false && 
            (editContext.allowNestedDrops != false || liveObject == rootObject);
    },

    // Override to provide special editNode canvas selection (note that this impl does not 
    // care about dragType, but some special implementations - eg, TabSet - return different
    // objects depending on what is being dragged)
    findEditNode : function (dragType) {
        var liveObject = this.creator;
        if (!liveObject.editNode) {
            this.logInfo("Skipping '" + liveObject + "' - has no editNode", "editModeDragTarget");
            if (liveObject.parentElement && 
                liveObject.parentElement.editProxy && 
                liveObject.parentElement.editProxy.findEditNode) 
            {
                return liveObject.parentElement.editProxy.findEditNode(dragType);
            } else {
                return null;
            }
        }
        return liveObject;
    },

    // Tests whether this Canvas can accept a child of type "type".  If it can't, and "type"
    // names some kind of FormItem, then we'll accept it if this Canvas is willing to accept a
    // child of type "DynamicForm" -- we'll cope with this downstream by auto-wrapping the
    // dropped FormItem inside a DynamicForm that we create for that very purpose.  Similarly,
    // if the type represents some type of DrawItem then we'll accept the child if this Canvas
    // can contain a DrawPane.
    
    _excludedFields: {
        "children": true,
        "peers": true
    },

    //> @method editProxy.canAddNode()
    // Can a new node be added to this component? Response takes into account drop rules to
    // include drops that may be replaced, automatically wrapped by other components, or
    // target adjusted.
    // <p>
    // PaletteNode behaviors that affect the node that will be first dropped are consulted
    // in the process.
    // <p>
    // By using optional argument <code>dropOnFolder</code> subclasses can reject a drop in
    // the editTree if there is not enough context to determine what to do.
    //
    // @param dragType (String) the type of component to be added
    // @param [dragTarget] (Canvas) the source of the component if being dragged
    // @param [dragData] (Object) the paletteNode or editNode being dragged
    // @param [dropOnFolder] (boolean) true if component is being dropped onto a folder in the editTree
    // @return (Boolean) true if this component will accept an add of the type or component.
    //                   false if the component will not accept the add at all and no further checks are needed
    //                   null if the component will not accept the add but caller may want to check our parent
    //<
    canAddNode : function (dragType, dragTarget, dragData, dropOnFolder) {
        var liveObject = this.creator,
            editNode = liveObject.editNode,
            logMessagePrefix = (this.logIsInfoEnabled("editModeAddNode")
                ? "canAddNode to " + liveObject.ID + " of type " + dragType
                : null)
        ;

        // For a component that is always dropped at the root level, we accept the drop
        if (dragData && (dragData.alwaysAllowRootDrop == true || dragData.alwaysAllowRootDrop == "true")) {
            this.logInfo(logMessagePrefix + " = true - alwaysAllowRootDrop = true", "editModeAddNode");
            return true;
        }

        if (!this.canDropAtLevel()) {
            this.logInfo(logMessagePrefix + " = false - cannot drop at level", "editModeAddNode");
            return false;
        }

        // Support restrictToTarget paletteNode rule for drops in edit tree.
        if (dragTarget && dragTarget.isA("Palette") && dragData && dragData.restrictToTarget) {
            if (!liveObject.isA(dragData.restrictToTarget.class)) {
                // This component does not meet restriction
                this.logInfo(logMessagePrefix + " = null - restrictToTarget not matched (" +
                    dragData.restrictToTarget.class + ")", "editModeAddNode");
                return null;
            }
        }

        // Remainder of checks should use substitute node if applicable
        if (dragData) {
            var origDragData = dragData;
            dragData = this.substituteNode(editNode, dragData);
            dragType = this.getEventDragType(dragData); 
            if (origDragData != dragData) {
                this.logInfo("canAddNode to " + liveObject.ID + " of type " + dragType +
                    ": substitute node: " + this.echoLeaf(dragData), "editModeAddNode");
            }

            var container = this.getContainerNode(editNode, dragData);
            if (container) {
                // If a container node will be wrapped around the new node, use it for remaining checks
                dragData = container;
                dragType = this.getEventDragType(dragData); 
                this.logInfo("canAddNode to " + liveObject.ID + " of type " + dragType +
                    ": container node: " + this.echoLeaf(dragData), "editModeAddNode");
            }
            logMessagePrefix = (this.logIsInfoEnabled("editModeAddNode")
                ? "canAddNode to " + liveObject.ID + " of type " + dragType
                : null);
        }

        // If this component has a field to hold new component type an add is fine
        if (liveObject.getObjectField(dragType) != null) {
            var dragItem = (dragData && dragData.liveObject ? dragData.liveObject : dragData);
            if (dragTarget && !dragTarget.isA("Palette") && !isc.isA.Class(dragItem)) {
                var tree = liveObject.editContext.getEditNodeTree(),
                    dragItemParentNode = tree.getParent(dragData)
                ;
                if (editNode != dragItemParentNode) {
                    
                    this.logInfo(logMessagePrefix + " = null - cannot drag existing " +
                        dragType + " to another container", "editModeAddNode");
                    return null;
                }
            }
            this.logInfo(logMessagePrefix + " = true - has object field for " + dragType,
                "editModeAddNode");
            return true;
        }

        // If node has an addToChild configuration and the dropped type matches the
        // target then it must be allowed
        if (editNode && editNode.addToChild) {
            var addToChild = editNode.addToChild;
            if (dragType == addToChild.ifDropClass) {
                this.logInfo(logMessagePrefix + " = true - matches addToChild.ifDropClass",
                    "editModeAddNode");
                return true;
            }
        }

        // A FormItem or DrawItem added to a normal canvas is allowed if this component will
        // allow their default container to be added.
        var clazz = isc.ClassFactory.getClass(dragType);
        if (clazz) {
            var targetType;
            if (clazz.isA("FormItem")) {
                // Don't allow FormItem reposition drop that is not on the same form.
                // A new FormItem drop is fine too.
                
                var form = dragData && dragData.form;
                if ((dragTarget && dragTarget.isA("Palette")) ||
                    (liveObject.form && liveObject.form == form))
                {
                    targetType = "DynamicForm";
                }
            } else if (clazz.isA("DrawItem")) {
                targetType = "DrawPane";
            }
            if (targetType) {
                var objField = liveObject.getObjectField(targetType, this._excludedFields);
                if (objField != null) {
                    this.logInfo(logMessagePrefix + " = true - has object field for explicit wrapper " + targetType,
                        "editModeAddNode");
                    return true;
                }
            }
        }

        // By default, return null to indicate that we can't add the item,
        // but callers may wish to check our parent. Subclasses can return
        // "false" to suggest to callers that they should not check parents
        // ...  that is, that we "claim" the potential add and conclusively
        // reject it. This matches the semantics of willAcceptDrop()
        this.logInfo(logMessagePrefix + " = null - fall through", "editModeAddNode");
        return null;
    },

    // Canvas.clearNoDropindicator no-ops if the internal _noDropIndicator flag is null.  This
    // isn't good enough in edit mode because a canvas can be dragged over whilst the no-drop
    // cursor is showing, and we want to revert to a droppable cursor regardless of whether 
    // _noDropIndicatorSet has been set on this particular canvas. 
    clearNoDropIndicator : function (type) {
        var liveObject = this.creator;
        if (liveObject._noDropIndicatorSet) delete liveObject._noDropIndicatorSet;
        liveObject._updateCursor();
        
        // XXX May need to add support for no-drop drag tracker here if we ever implement 
        // such a thing in Visual Builder
    },
    
    // Special editMode version of setNoDropCursor - again, because the base version no-ops in 
    // circumstances where we need it to refresh the cursor.
    setNoDropIndicator : function () {
        var liveObject = this.creator;
        liveObject._noDropIndicatorSet = true;
        liveObject._applyCursor(liveObject.noDropCursor);
    },

    

    defaultDropMargin: 10,
    dropMargin: 10,
    updateDropMargin : function () {

        // Fix up the dropMargin to prevent not-very-tall canvas from passing *every* drop 
        // through to parent layouts
        var liveObject = this.creator,
            newDropMargin = this.defaultDropMargin;
        if (newDropMargin * 2 > liveObject.getVisibleHeight() - isc.EditProxy.minimumDropTargetSize) {
            newDropMargin = Math.round((liveObject.getVisibleHeight() - isc.EditProxy.minimumDropTargetSize) / 2);
            if (newDropMargin < isc.EditProxy.minimumDropMargin) newDropMargin = isc.EditProxy.minimumDropMargin; 
        }
        this.dropMargin = newDropMargin;
    },

    shouldPassDropThrough : function () {
        var liveObject = this.creator,
            dragTarget = liveObject.ns.EH.dragTarget
        ;

        var dragData = this.getEventDragData(),
            dragType = this.getEventDragType(dragData),
            logMessagePrefix = (this.logIsInfoEnabled("editModeDragTarget")
                ? "editProxy.shouldPassDropThrough for " + liveObject.ID + " using dragType " + dragType
                : null)
        ;
        if (!dragType) return false;

        if (!this.canAddNode(dragType, dragTarget, dragData)) {
            this.logInfo(logMessagePrefix + " = true - cannot add dragType",
                "editModeDragTarget");
            return true;
        }

        // If we do not have an editable parent willing to accept the drop, then
        // return false (i.e. we should *not* pass the drop through).
        if (liveObject.parentElement == null ||
            liveObject.parentElement.editProxy == null ||
            !liveObject.parentElement.editProxy.willAcceptDrop(false))
        {
            this.logInfo(logMessagePrefix + " = false - no ancestor willing to add",
                "editModeDragTarget");
            return false;
        }

        if (liveObject.parentElement == dragTarget) {
            this.logInfo(logMessagePrefix + " = false - cannot drop on self",
                "editModeDragTarget");
            return false;
        }

        if (this.persistCoordinates) {
            this.logInfo(logMessagePrefix + " = false - canvas is persisting coordinates",
                "editModeDragTarget");
            return false;
        }

        var x = isc.EH.getX(),
            y = isc.EH.getY(),
            work = liveObject.getPageRect(),
            rect = {
                left: work[0], 
                top: work[1], 
                right: work[0] + work[2], 
                bottom:work[1] + work[3]
            }
            
        if (!liveObject.orientation || liveObject.orientation == "vertical") {
            if (x < rect.left + this.dropMargin  || x > rect.right - this.dropMargin) {
                this.logInfo(logMessagePrefix + " = true - close to right or left edge",
                    "editModeDragTarget");
                return true;
            }
        }
        if (!liveObject.orientation || liveObject.orientation == "horizontal") {
            if (y < rect.top + this.dropMargin  || y > rect.bottom - this.dropMargin) {
                this.logInfo(logMessagePrefix + " = true - close to top or bottom edge",
                    "editModeDragTarget");
                return true;
            }
        }

        this.logInfo(logMessagePrefix + " = false - fall through", "editModeDragTarget");
        return false;
    },
    
    
    drop : function () {
        if (this.shouldPassDropThrough()) {
            return;
        }
    
        var liveObject = this.creator,
            dragTarget = liveObject.ns.EH.dragTarget,
            paletteNode = this.getEventDragData()
        ;
    
        // If node is dropped from a tree, clean it of internal properties
        if (dragTarget.isA("TreePalette")) {
            paletteNode = dragTarget.data.getCleanNodeData(paletteNode, false, false, false);
        }

        // Palette node could be modified later if there are palettized components within.
        // Copy it now so that future drops are not affected.
        paletteNode = isc.clone(paletteNode);
        paletteNode.dropped = true;

        // if the dragTarget isn't a Palette, we're drag/dropping an existing component, so remove the 
        // existing component and re-create it in its new position
        if (!dragTarget.isA("Palette")) {
            this.completeReparent(true);
        } else {
            this.completeDrop(paletteNode, { skipSnapToGrid: isc.EH.shiftKeyDown() });
        }
        return isc.EH.STOP_BUBBLING;
    },

    // Called to complete the drop process from above and also from palette.folderDrop so
    // that the same processing occurs in both cases.
    // settings.index - should be the index into the parent component, not the index within the editTree
    completeDrop : function (paletteNode, settings, callback) {
        var liveObject = this.creator;

        if (!liveObject.editContext) return;

        // loadData() operates asynchronously, so we'll have to finish the item drop off-thread.
        // Although addWithWrapper and addFromPaletteNodes called below will also asynchronously
        // load a node, doing so there breaks the sequential process which is crucial to completing
        // the drop.
        if (paletteNode.loadData && !paletteNode.isLoaded) {
            var _this = this;
            paletteNode.loadData(paletteNode, function (loadedNode) {
                loadedNode = loadedNode || paletteNode;
                loadedNode.isLoaded = true;
                _this.completeDrop(loadedNode, settings, function (editNode) {
                    editNode.dropped = paletteNode.dropped;
                    if (callback) callback(editNode);
                });
            });
            return;
        }

        // Unwrap settings
        var index = (settings ? settings.index : null),
            parentProperty = (settings ? settings.parentProperty : null),
            skipNodeAddedNotification = (settings ? settings.skipNodeAddedNotification : null),
            skipSnapToGrid = (settings ? settings.skipSnapToGrid : null)
        ;

        var editContext = liveObject.editContext,
            parentNode = liveObject.editNode,
            editNode,
            wrapped = false
        ;

        
        if (index != null) {
            var tree = editContext.getEditNodeTree(),
                children = tree.getChildren(parentNode),
                iscClass = isc.DataSource.getNearestSchemaClass(paletteNode.type)
            ;
            // Special case: If dropping as non-DS as the first node and there is already a DS,
            // adjust drop below DS. This keeps the DS at the top of the children.
            if (index == 0 && children.length > 0 &&
                isc.isA.DataSource(children[0].liveObject) &&
                (!iscClass || !iscClass.isA(isc.DataSource)))
            {
                index++;
            } else {
                for (var i = 0; i < Math.min(index, children.length); i++) {
                    if (isc.isA.DataSource(children[i].liveObject)) {
                        index++;
                        break;
                    }
                }
            }
        }

        // Allow substitute nodes
        paletteNode = this.substituteNode(parentNode, paletteNode);
        var nodeType = paletteNode.type || paletteNode.className,

        // Find best parent for drop
        parentNode = this.adjustParentNode(parentNode, paletteNode);

        var clazz = isc.ClassFactory.getClass(nodeType);
        if (clazz && (clazz.isA("FormItem") || clazz.isA("DrawItem"))) {
            editNode = editContext.makeEditNode(paletteNode);
            if (clazz && clazz.isA("FormItem")) {
                editNode = liveObject.editContext.addWithWrapper(editNode, parentNode, index, parentProperty, null, skipNodeAddedNotification);
            } else {
                editNode = liveObject.editContext.addWithWrapper(editNode, parentNode, index, parentProperty, true, skipNodeAddedNotification);
            }
            wrapped = true;
        } else {
            // Obtain container node to wrap dropped node in if applicable
            var container = this.getContainerNode(parentNode, paletteNode);
            if (container) {
                var containerNode = editContext.makeEditNode(container);
                parentNode = editContext.addNode(containerNode, parentNode, index);
                index = 0;
            }
    
            // Using addFromPaletteNodes instead of addFromPaletteNode because the former
            // will find other components within the defaults like a DataSource and create it
            // as well. This is used in Mockups mode pervasively.
            var nodes = editContext.addFromPaletteNodes([paletteNode], parentNode, index, parentProperty, skipNodeAddedNotification, false);
            if (nodes && nodes.length > 0) editNode = nodes[0];
        }
        var node = editNode;
        if (!node) return;

        if (index == null) {
            // move new component to the current mouse position.
            // if editNode was wrapped, update the wrapper node position
            if (wrapped) {
                var tree = editContext.getEditNodeTree(),
                    parent = tree.getParent(node)
                ;
                if (parent) node = parent;
            }
            var x = liveObject.getOffsetX(),
                y = liveObject.getOffsetY()
            ;
            // Respect snapTo grid if specified 
            if (liveObject.childrenSnapToGrid && !skipSnapToGrid) {
                x = liveObject.getHSnapPosition(x);
                y = liveObject.getVSnapPosition(y);
            }
            if (node.liveObject && node.liveObject.moveTo) node.liveObject.moveTo(x, y);
        }

        // Once DS is added to component, make sure component is selected
        if (isc.isA.DataSource(node.liveObject)) {
            // Force correct selection - DBC might already be marked as selected
            // but the selection updated event should be triggered.
            editContext.deselectAllComponents();
            // Delay selection to allow component to draw and be potentially resized by
            // its container before grabbing size during selection
            editContext.delayCall("selectSingleComponent", [parentNode.liveObject]);
        } else if (this.canSelectChildren && editNode.liveObject.editProxy != null &&
            editNode.liveObject.editProxy.canSelect != false)
        {
            // Delay selection to allow component to draw and be potentially resized by
            // its container before grabbing size during selection
            editContext.delayCall("selectSingleComponent", [node.liveObject]);
        }
    
        var liveObject = node.liveObject;

        // Let node's proxy know that it has just been dropped in place
        if (liveObject && liveObject.editProxy && liveObject.editProxy.nodeDropped) {
            liveObject.editProxy.nodeDropped(node, parentNode);
        }
        
        if (liveObject && isc.isA.Function(liveObject.focus)) {
            //isc.logWarn("Trying to focus Canvas " + liveObject.ID + " in completeDrop");
            liveObject._eventMask ? liveObject._eventMask.focus() : liveObject.focus();
            //isc.logWarn(liveObject.ID + (liveObject._eventMask ? "_eventMask" : "") +
            //    " has the focus? " + (liveObject._eventMask ?
            //                          liveObject._eventMask.hasFocus : liveObject.hasFocus));
        }

        if (callback) callback(node);
    },

    // dragTarget passed in by overrides that present a dialog before completing the drop
    completeReparent : function (reposition, dragTarget) {
        var liveObject = this.creator;
        dragTarget = dragTarget || liveObject.ns.EH.dragTarget

        // Cannot drop a component onto itself
        if (dragTarget == liveObject) return;

        var editContext = liveObject.editContext,
            editNode = liveObject.editNode,
            sourceNode = dragTarget.editNode
        ;

        if (this.logIsInfoEnabled("editing")) {
            var editTree = editContext.getEditNodeTree(),
                oldParent = editTree.getParent(sourceNode)
            ;
            this.logInfo("Reparenting " + dragTarget.ID + " from " + oldParent.liveObject.ID +
                " to " + liveObject.ID, "editing");
        }

        // Remove existing editNode from editTree.
        editContext.removeNode(sourceNode, null, true);

        var node;
        if (dragTarget.isA("FormItem")) {
            if (dragTarget.isA("CanvasItem")) {
                node = editContext.addNode(dragTarget.canvas.editNode, editNode);
            } else {
                node = editContext.addWithWrapper(sourceNode, editNode);
            }
        } else if (dragTarget.isA("DrawItem")) {
            node = editContext.addWithWrapper(sourceNode, editNode, null, null, true);
        } else {
            // Don't offer a binding dialog if so configured because the node isn't really new
            node = editContext.addNode(sourceNode, editNode, null, null, null, null, true);

            if (reposition) {
                // Assign position based on the dragRect because the mouse pointer is
                // likely offset from there into what was the dragHandle and we want
                // the drop to occur where the target outline shows
                var dragRect = isc.EH.getDragRect(),
                    x = (dragRect ? dragRect[0] - liveObject.getPageLeft() : liveObject.getOffsetX()),
                    y = (dragRect ? dragRect[1] - liveObject.getPageTop() : liveObject.getOffsetY())
                ;
                node.liveObject.moveTo(x, y);
            }
        }
        if (node && node.liveObject) {
            isc.EditContext.selectCanvasOrFormItem(node.liveObject, true);
        }
        if (node) {
            var tree = editContext.getEditNodeTree(),
                oldParentNode = tree.getParent(sourceNode);
            editContext.fireNodeMoved(sourceNode, oldParentNode, node, editNode);
        }
        return node;
    },

    // Returns node to be "dropped" which could be a substitute
    substituteNode : function (parentNode, paletteNode) {
        if (paletteNode.substituteDrop) {
            var substituteDrop = paletteNode.substituteDrop,
                substitute = true
            ;

            var parentClass = (parentNode ? isc.ClassFactory.getClass(parentNode.type) : null);
            if (!parentClass ||
                (substituteDrop.ifParentClass && !parentClass.isA(substituteDrop.ifParentClass)) ||
                (substituteDrop.ifNotParentClass && parentClass.isA(substituteDrop.ifNotParentClass)))
            {
                substitute = false;
            }

            if (substitute) {
                var liveObject = this.creator,
                    editContext = liveObject.editContext,
                    newPaletteNode = substituteDrop;
                ;
                if (substituteDrop.useNode) {
                    // substitute comes from a reference to another paletteNode
                    newPaletteNode = editContext.findPaletteNode("refID", substituteDrop.useNode);
                    if (!newPaletteNode) {
                        // Invalid refID
                        this.logWarn("Invalid 'substituteDrop.useNode' reference found in palette node for " + paletteNode.type + ". Ignoring substituteDrop.");
                    }
                    var palette = editContext.getDefaultPalette();
                    if (!isc.isA.TreePalette(palette)) {
                        newPaletteNode = isc.clone(newPaletteNode);
                    }
                } else {
                    newPaletteNode = isc.clone(newPaletteNode);
                    delete newPaletteNode.ifParentClass;
                    delete newPaletteNode.ifNotParentClass;
                }
                if (newPaletteNode) paletteNode = newPaletteNode;
            }
        }
        return paletteNode;
    },

    // Returns node to be wrapped around "dropped" node (i.e. container)
    getContainerNode : function (parentNode, paletteNode) {
        var container;
        if (parentNode && parentNode.insertContainer) {
            var insertContainer = parentNode.insertContainer,
                wrap = true
            ;

            if (insertContainer.ifDropClass) {
                var dragType = paletteNode.type || paletteNode.className;
                var dropClass = isc.ClassFactory.getClass(dragType);
                if (!dropClass ||
                    (insertContainer.ifDropClass && !dropClass.isA(insertContainer.ifDropClass)))
                {
                    wrap = false;
                }
            }

            if (wrap) {
                var liveObject = this.creator,
                    editContext = liveObject.editContext,
                    newPaletteNode = insertContainer
                ;
                if (insertContainer.useNode) {
                    // container comes from a reference to another paletteNode
                    newPaletteNode = editContext.findPaletteNode("refID", insertContainer.useNode);
                    if (!newPaletteNode) {
                        // Invalid refID
                        this.logWarn("Invalid 'insertContainer.useNode' reference found in palette node for " + parentNode.type + ". Ignoring insertContainer.");
                    }
                    var palette = editContext.getDefaultPalette();
                    if (!isc.isA.TreePalette(palette)) {
                        newPaletteNode = isc.clone(newPaletteNode);
                    }
                } else {
                    newPaletteNode = isc.clone(newPaletteNode);
                    delete newPaletteNode.ifDropClass;
                }
                if (newPaletteNode) container = newPaletteNode;
            }
        }
        return container;
    },
    
    // Returns node to be used as parent
    adjustParentNode : function (parentNode, paletteNode) {
        var liveObject = this.creator,
            editContext = liveObject.editContext
        ;

        if (parentNode.addToChild) {
            var addToChild = parentNode.addToChild;
            if (paletteNode.type == addToChild.ifDropClass) {
                var editTree = liveObject.editContext.getEditNodeTree(),
                    childNodes = editTree.getChildren(parentNode),
                    childClass = addToChild.childClass,
                    childNode
                ;
                if (childClass) {

                    if (childNodes && childNodes.length > 0) {
                        for (var i = 0; i < childNodes.length; i++) {
                            if (childClass == childNodes[i].type) {
                                childNode = childNodes[i];
                                break;
                            }
                        }
                    }
                    if (childNode) {
                        // Found child class
                        return childNode;
                    } else {
                        // Child class not found, create an instance
                        // new child comes from a reference to another paletteNode
                        if (addToChild.createFrom) {
                            var childPaletteNode = editContext.findPaletteNode("refID", addToChild.createFrom);
                            if (childPaletteNode) {
                                var editNode = editContext.makeEditNode(childPaletteNode);
                                editNode.dropped = true;
                                parentNode = editContext.addNode(editNode, parentNode, null, null, null, null, true);
                            } else {
                                // Invalid refID
                                this.logWarn("Invalid 'addToChild.createFrom' reference found in palette node for " + parentNode.type + ". Ignoring addToChild.");
                            }
                        } else {
                            // createFrom not defined
                            this.logWarn("Invalid 'addToChild.createFrom' found in palette node for " + parentNode.type + ". Ignoring addToChild.");
                        }
                    }
                } else {
                    // Missing childClass
                    this.logWarn("Invalid 'addToChild.childClass' found in palette node for " + parentNode.type + ". Ignoring addToChild.");
                }
            } else if (!addToChild.ifDropClass) {
                // Missing ifDropClass
                this.logWarn("Invalid 'addToChild.ifDropClass' found in palette node for " + parentNode.type + ". Ignoring addToChild.");
            }
        } else if (paletteNode.alwaysAllowRootDrop == true || paletteNode.alwaysAllowRootDrop == "true") {
            var editTree = liveObject.editContext.getEditNodeTree();
            parentNode = editTree.getRoot();
        }
        return parentNode;
    },

    dropMove : function () {
        if (!this.canDropAtLevel()) return;

        if (!this.willAcceptDrop()) return false;
        if (!this.shouldPassDropThrough()) {
            
            if (this.creator.dropMove &&
                    this.creator.getClass() != isc.Canvas && this.creator.getClass() != isc.AbsoluteContainer &&
                    this.creator.getClass() != isc.EditPane && this.creator.getClass() != isc.TabSet &&
                    this.creator.getClass() != isc.DetailViewer && this.creator.getClass() != isc.SectionHeader)
            {
                this.creator.Super("dropMove", arguments);
            }
            var liveObject = this.creator,
                parentElement = liveObject.parentElement;
            if (parentElement && parentElement.hideDropLine) {
                parentElement.hideDropLine();
                if (parentElement.isA("FormItem")) {
                    parentElement.form.hideDragLine();
                } else if (parentElement.isA("DrawItem")) {
                    parentElement.drawPane.hideDragLine();
                }
            }
            return isc.EH.STOP_BUBBLING;
        }
    },

    dragOver : function () {
        if (!this.willAcceptDrop()) {
            return false;
        }
        return this.Super("dragOver", arguments);
    },

    dropOver : function () {
        if (!this.canDropAtLevel()) return;

        if (!this.willAcceptDrop()) {
            if (this.creator == this.creator.ns.EH.dragTarget) {
                return;
            }
            return false;
        }
        if (!this.shouldPassDropThrough()) {
            if (this.creator.dropOver &&
                    this.creator.getClass() != isc.Canvas && this.creator.getClass() != isc.AbsoluteContainer &&
                    this.creator.getClass() != isc.EditPane && this.creator.getClass() != isc.DrawPane && 
                    this.creator.getClass() != isc.TabSet && this.creator.getClass() != isc.DetailViewer && 
                    this.creator.getClass() != isc.TabSet && this.creator.getClass() != isc.TileGrid)
            {
                this.creator.Super("dropOver", arguments);
            }
            var liveObject = this.creator,
                parentElement = liveObject.parentElement;
            if (parentElement && parentElement.hideDropLine) {
                parentElement.hideDropLine();
                if (parentElement.isA("FormItem")) {
                    parentElement.form.hideDragLine();
                } else if (parentElement.isA("DrawItem")) {
                    parentElement.drawPane.hideDragLine();
                }
            }
            // Show snap grid
            this._showSnapGrid(true);

            return isc.EH.STOP_BUBBLING;
        }
        // Show snap grid
        this._showSnapGrid(true);
    },

    dropOut : function () {
        var liveObject = this.creator;
        this.showSelectedAppearance(false);
	    if (liveObject.dropOut) this.creator.dropOut();
        // Hide snap grid
        this._showSnapGrid(false);

        // If stopping drag over ourselves, allow parent to handle event because
        // a snap grid can be displayed there
        if (!this.willAcceptDrop() && liveObject == liveObject.ns.EH.dragTarget) {
            return;
        }

        return isc.EH.STOP_BUBBLING; 
    },

    // In editMode, we allow dragging the selected canvas using the drag-handle
    // This involves overriding some default behaviors at the widget level.
    overrideDragProperties : function () {
        if (this._overrideDrag) return;
        var liveObject = this.creator;

        var properties = {
            canDrop: true,
            dragAppearance: "outline",

            // These method overrides are to clobber special record-based drag handling
            // implemented by ListGrid and its children
            dragStart : function () {
                // If we are dragging the current selection and using the selection outline
                // (which include dragHandle) then reset the drag offset to [0,0],
                // top-left corner of the drag target
                if (isc.EH.dragTarget == isc.SelectionOutline.getSelectedObject()) {
                    isc.EH.dragStartOffsetX = isc.EH.dragStartOffsetY = 0;
                }
                return true;
            },
            dragMove : function () { return true; },
            setDragTracker : function () {isc.EH.setDragTracker(""); return false; },
            dragStop : function () {
                isc.SelectionOutline.positionDragHandle();
            },
            dragResized : function (deltaX, deltaY) {
                // Called for width/height property change and for drag resizing

                

                this._resizedDrag(deltaX, deltaY);
            },
            resized : function (deltaX, deltaY) {
                this.Super("resized", arguments);
                if (this._settingWidthOrHeight) {
                    this._resizedDrag(deltaX, deltaY);
                }
            },
            _resizedDrag : function (deltaX, deltaY) {
                var origOverflow = this.getOriginalValue("overflow");
                if (origOverflow == "visible" && (deltaX < 0 || deltaY < 0)) {
                    this._resizedSmallerWithOverflow();
                }

                // The current width/height is correct for saving. However, we also need to
                // update the corresponding saved values so that when they are restored
                // the new sizes are re-applied.
                this.saveToOriginalValues(["width","height"]);

                this.editContext.refreshSelectedAppearance(this);
            },
            _resizedSmallerWithOverflow : function () {
                // User resized component smaller than it's original size and the component
                // is configured for overflow visible. It's possible that the drawn size
                // (with overflow) will be larger than the new size (size bounce).
                // In that case the new component size should be min(origSize, resize) and
                // the user should be notified that overflow is causing the size. 
                //
                // If the drawn size (with overflow) doesn't change (no size bounce) then
                // the new component size should the resize.

                var resizedWidth = this.width,
                    resizedHeight = this.height
                ;

                // Test whether the overflow setting produces a drawn size larger than the
                // resize:

                // Turn overflow back on temporarily and draw the component immediately
                // to see if the size changes
                this.setProperty("overflow", "visible");
                this.redraw("overflow changed");

                // Check if new drawn size is larger than drag size (bounced)
                var drawnWidth = this.getVisibleWidth(),
                    drawnHeight = this.getVisibleHeight()
                ;

                if (drawnWidth > resizedWidth || drawnHeight > resizedHeight) {
                    // Size bounced indicating that the specified size is smaller than the
                    // rendered size with overflow.

                    // Save min(origSize, resized)
                    var origWidth = this.getOriginalValue("width"),
                        origHeight = this.getOriginalValue("height")
                    ;
                    if (origWidth < resizedWidth || origHeight < resizedHeight) {
                        resizedWidth = origWidth;
                        resizedHeight = origHeight;
                    }
                    this.setProperty("width", resizedWidth);
                    this.setProperty("height", resizedHeight);

                    // Update the current component size to match the overflowed size just
                    // like what happens at selection time. Wait to do it after the
                    // method returns leaving this.width and this.height of the correct
                    // resized value.
                    var _this = this;
                    isc.Timer.setTimeout(function () {
                        _this.setProperty("width", drawnWidth);
                        _this.setProperty("height", drawnHeight);
                        // Turn overflow back on until selection is removed
                        _this.setProperty("overflow", "hidden");
                        _this.editContext.refreshSelectedAppearance(_this);
                    }, 0);

                    
                    if (this.editContext.isVisualBuilder) {
                        isc.Notify.addMessage("This component has its Scrolling property set to Expand. " +
                            "Change to Clip or Automatic if you want to resize the component smaller.",
                            null, null, { duration: 5000 });
                    }
                } else {
                    // Turn overflow back off until selection is removed
                    this.setProperty("overflow", "hidden");
                }
            },
            setEditableProperties : function (properties) {
                this.Super("setEditableProperties", arguments);

                // If width or height is updated and those values were saved in original
                // values, the super call will only update the original values - not the
                // actual component. Instead we want the normal resizing logic above to
                // work so update those properties on the component and let the resize
                // logic run.
                var undef;
                for (var key in properties) {
                    if (this.editModeOriginalValues[key] !== undef &&
                        (key == "width" || key == "height"))
                    {
                        this.logInfo("Field " + key + " - value is going to live values also", 
                                "editModeOriginalValues");

                        // set flag so resized() method above can treat the width/height
                        // change as similar to a drag resize
                        this._settingWidthOrHeight = true;
                        this.setProperty(key, properties[key]);
                        delete this._settingWidthOrHeight;
                    }
                }
            }
        };

        var resizeWidth,
            resizeHeight
        ;
        
        if (liveObject.overflow == "visible" &&
            !isc.isA.TabBar(liveObject.parentElement) &&
            !isc.isA.ToolStrip(liveObject))
        {
            // Turn off overflow on the component so dragging shows the resize correctly.
            // Also, set the current size to be the drawn size with overflow, if any,
            // otherwise the component size on the screen will shift. The original size
            // values will be restored when unselected if a drag resize doesn't update them.

            // Doing this such that the selected size is correct and the restored properly
            // is a bit complicated. Using override properties to update width and height
            // doesn't work correctly because they are set separately causing an enclosing
            // layout to resize for each one. Additionally, overflow needs to be set once
            // the explicit size is updated. Therefore save existing properties values
            // by setting them to the current values. Application of the correct settings
            // occurs further below.
            properties.width = liveObject.width;
            properties.height = liveObject.height;
            properties.overflow = liveObject.overflow;

            // The internal _userWidth/Height values must be reset when unselected so the
            // component can be properly resized by its container. These values are never
            // cleared once set unless another explicit size is applied.
            properties._userWidth = null;
            properties._userHeight = null;

            // Record current visible size to apply below
            resizeWidth = liveObject.getVisibleWidth();
            resizeHeight = liveObject.getVisibleHeight();
        }

        this.overrideProperties(properties);
        this._overrideDrag = true;

        // Continuation of changing overflow detailed above
        if (properties.overflow) {
            liveObject.resizeTo(resizeWidth,resizeHeight);
            liveObject.setOverflow("hidden");
        }
    },
    
    restoreDragProperties : function () {
        var liveObject = this.creator;
        // As noted in overrideDragProperties above the order and means of setting the
        // width, height and overflow properties is important. The same applies to restoring
        // the original values. Restore the normal properties and then apply these special
        // values if needed explicitly below.
        liveObject.restoreFromOriginalValues([
            "canDrag", 
            "canDrop",
            "dragAppearance",
            "dragStart",
            "dragMove",
            "dragStop",
            "setDragTracker"
        ]);

        // If overflow property was saved it needs to be restored along with the original sizes.
        var overflow = liveObject.getOriginalValue("overflow");
        if (overflow) {
            var resizeWidth = liveObject.getOriginalValue("width"),
                resizeHeight = liveObject.getOriginalValue("height"),
                _userWidth = liveObject.getOriginalValue("_userWidth"),
                _userHeight = liveObject.getOriginalValue("_userHeight"),
                undef
            ;
            if (resizeWidth != null) liveObject.resizeTo(resizeWidth, resizeHeight);
            if (_userWidth !== undef) liveObject._userWidth = _userWidth;
            if (_userHeight !== undef) liveObject._userHeight = _userHeight;
            liveObject.setOverflow(overflow);

            // restoreFromOriginalValues automatically removes restored values the original
            // values store. Applying them manually does not so they are cleared explicitly.
            liveObject.clearOriginalValues([
                "width",
                "height",
                "overflow",
                "_userWidth",
                "_userHeight"
            ])
        }
        this._overrideDrag = false;
    },

    _showSnapGrid : function (show) {
        var liveObject = this.creator;
        if (liveObject.childrenSnapToGrid || liveObject.childrenSnapResizeToGrid) {
            liveObject.setShowSnapGrid(show);
        }
    },

    // DataBoundComponent functionality
    // ---------------------------------------------------------------------------------------

    // In editMode, when setDataSource is called, generate editNodes for each field so that the
    // user can modify the generated fields.
    // On change of DataSource, remove any auto-gen field that the user has not changed.
    
    setDataSource : function (dataSource, fields, forceRebind) {
        //this.logWarn("editProxy.setDataSource called" + isc.Log.getStackTrace());

        var liveObject = this.creator,
            editContext = liveObject.editContext
        ;

        // _loadingNodeTree is a flag set by Visual Builder - its presence indicates that we are 
        // loading a view from disk.  In this case, we do NOT want to perform the special 
        // processing in this function, otherwise we'll end up with duplicate components in the
        // componentTree.  So we'll just fall back to the base impl in that case.
        if (isc._loadingNodeTree) {
            // Because we are binding with a DS and no fields are specified, all DS
            // fields will be used by default. In EditMode this is not desired because
            // editNodes will specify exactly which fields to use. Therefore, suppress
            // the DS fields during the bind and let the correct fields be added later.
            var oldSuppressAllDSFields = liveObject.suppressAllDSFields;
            liveObject.suppressAllDSFields = true;
            liveObject.setDataSource(dataSource, fields);
            liveObject.suppressAllDSFields = oldSuppressAllDSFields;
            return;
        }

        if (dataSource == liveObject.dataSource && !forceRebind) return;

        // When rebinding a DS (i.e. new version of the previously bound DS) we don't want to
        // add any new DS fields and we want to remove all bound fields for removed DS fields
        // if they haven't been edited.
        var rebinding = (dataSource && liveObject.dataSource && liveObject.dataSource.ID == dataSource.ID);

        // If this dataSource has a single complex field, use the schema of that field in lieu
        // of the schema that was dropped.
        var schema;
        if (dataSource != null) {
            var schemaFields = dataSource.fields;
            if (schemaFields && isc.getKeys(schemaFields).length == 1 &&
                    schemaFields[isc.firstKey(fields)] &&
                    dataSource.fieldIsComplexType(schemaFields[isc.firstKey(fields)].name))
            {
                schema = dataSource.getSchema(schemaFields[isc.firstKey(fields)].type);
            } else {
                schema = dataSource;
            }
        }

        var existingFields = (liveObject.getAllFields ? liveObject.getAllFields() : liveObject.getFields()),
            allSchemaFields = (schema != null ? schema.getFields() : {}),
            keepFields = []
        ;

        // If DBC specifies certain default fields, use those instead of the full DS list.
        // Note that if implemented *only* those fields returned will be auto-generated
        if (schema && liveObject.getDefaultFields) {
            allSchemaFields = liveObject.getDefaultFields(schema);
        }

        // remove all automatically generated fields that have not been edited by the user
        
        if (existingFields && existingFields.length > 0) {
            var tree = editContext.getEditNodeTree(),
                parentNode = tree.findById(liveObject.ID),
                children = tree.getChildren(parentNode),
                gridKeepFields = [],
                removeNodes = []
            ;
            for (var i = 0; i < existingFields.length; i++) {
                var field = existingFields[i],
                    editNode = null
                ;
                for (var j = 0; j < children.length; j++) {
                    var child = children[j];
                    if (field.name == child.name) {
                        editNode = child;
                        break;
                    }
                }

                if (editNode) {
                    // Pull any field renames from the editContext placed there by VB
                    var renames = editContext.fieldRenames,
                        mappedFieldName = (renames && renames[field.name] ? renames[field.name] : field.name),
                        fieldInNewList = (allSchemaFields[mappedFieldName] != null),
                        fieldEdited = this.fieldEdited(liveObject, editNode)
                    ;

                    if (!fieldInNewList && (!fieldEdited || rebinding)) {
                        // Field was not manually edited and is not in DataSource
                        removeNodes.add(editNode);
                    } else {
                        // For non-edited fields be sure to only copy the defaults....
                        var keepField = isc.addProperties({}, field.editingOn ? field.editNode.defaults : field);
                        if (!fieldEdited) {
                            keepField = isc.addProperties({}, editNode.defaults);
                        }
                        if (field.name != mappedFieldName) {
                            keepField = isc.addProperties({}, keepField, allSchemaFields[mappedFieldName]);
                            editContext.setNodeProperties(editNode, keepField, true);
                        }
                        keepFields.add(keepField);

                        // Make copy of field properties to pass to dbc.setFields because these
                        // objects may be updated by the dbc with addition attributes that are
                        // not wanted when binding the new DS.
                        gridKeepFields.add(isc.addProperties({}, keepField));
                    }
                }
            }

            liveObject.setFields(gridKeepFields);

            for (var i = 0; i < removeNodes.length; i++) {
                editContext.removeNode(removeNodes[i], true);
            }
        }


        if (dataSource == null) {
            if (isc.isA.ListGrid(liveObject) || isc.isA.DetailViewer(liveObject)) {
                
                liveObject.setData([]);
                liveObject.dataSource = null;
                liveObject.setFields([]);
            }
            if (isc.isA.DynamicForm(liveObject) && keepFields.length == 0) {
                liveObject.setData({});
                liveObject.dataSource = null;
                liveObject.setFields([]);
            }
            return;
        }

        // add one editNode for every field in the DataSource that the component would normally
        // display or use.  
        

        var fields = [],
            newFields = []
        ;

        // Remaining fields (keepFields) is ordered in the original editNode order
        // and should be retained for the new fields as well. Other fields in the
        // new DS are added on the end.
        for (var i = 0; i < keepFields.length; i++) {
            fields.add(keepFields[i]);
        }

        // Add new fields
        if (!rebinding) {
            for (var key in allSchemaFields) {
                var field = allSchemaFields[key],
                    fieldName = field.name
                ;
                if (!liveObject.shouldUseField(field, dataSource)) continue;
                if (keepFields.find("name", key) || keepFields.find("autoName", key)) continue;

                // duplicate the field on the DataSoure - we don't want to have the live component
                // sharing actual field objects with the DataSource
                var fieldCopy = isc.addProperties({}, field);

                fields.add(fieldCopy);
                newFields.add(fieldCopy);
            }
        }
        if (this.layoutNewFields) this.layoutNewFields(dataSource, fields);

        liveObject.setDataSource(dataSource, fields);

        if (!rebinding) {
            for (var i = 0; i < newFields.length; i++) {
                var field = newFields[i],
                    defaults = null
                ;
                if (field.top != null || field.left != null) {
                    defaults = { top: field.top, left: field.left };
                }
                // What constitutes a "field" varies by DBC type
                var fieldConfig = this.makeFieldPaletteNode(editContext, field, schema, defaults);
                
                var editNode = editContext.makeEditNode(fieldConfig);
                //this.logWarn("editProxy.setDataSource adding field: " + field.name);

                // Use field index as the position within the node to add this field.
                // addNode() will adjust to account for DS edit node so 0 is immediately
                // after the DS node. Without the index the field is added at the end
                // which can leave a node such as a DynamicProperty between the DS node
                // and the fields.
                editContext.addNode(editNode, liveObject.editNode, i, null, true);
            }
        }

        
        editContext.fireEditNodeUpdated(liveObject.editNode, { dataSource: dataSource });
    },

    // whether a field has been edited
    // Strategy: An edited field will likely have more properties than just
    // the base "name" and "title". Therefore if there are more properties
    // consider the field edited. Otherwise, if the title is different from
    // the auto-generated title or from the original DataSource field title
    // then the field title has been edited.
    fieldEdited : function (parentCanvas, editNode) {
        var edited = false;
        if (editNode.defaults) {
            var defaults = editNode.defaults,
                hasNonBaseProperties = false
            ;

            var name = defaults.name || defaults.autoName,
                dsType,
                dsTitle
            ;
            if (name && parentCanvas && parentCanvas.dataSource) {
                var ds = parentCanvas.dataSource;
                if (isc.isA.String(ds)) ds = isc.DS.getDataSource(ds);
                if (ds) {
                    var dsField = ds.getField(name)
                    if (dsField) {
                        dsType = dsField.type;
                        dsTitle = dsField.title;
                    }
                }
            }

            var nonBaseProperties = [];
            for (var key in defaults) {
                if (key == "name" || key == "autoName" || key == "title" || key == "parentProperty" || key.startsWith("_")) continue;
                if (key == "type" && dsType && dsType == defaults.type) continue;
                nonBaseProperties.add(key);
                hasNonBaseProperties = true;
            }
            // If the extra properties are only a specific placement treat them as base
            if (hasNonBaseProperties && nonBaseProperties.length == 2 && nonBaseProperties.contains("top") && nonBaseProperties.contains("left")) {
                hasNonBaseProperties = false;
            }
            if (!hasNonBaseProperties) {
                var title = defaults.title;
                if (title) {
                    if ((!dsTitle && title != isc.DataSource.getAutoTitle(name)) || 
                            (dsTitle && title != dsTitle)) 
                    {
                        edited = true;
                    }
                }
            } else {
                edited = true;
            }
        }
        return edited;
    },

    // Makes a palette node for a DataSourceField
    makeFieldPaletteNode : function (editContext, field, dataSource, defaults) {
        // works for ListGrid, TreeGrid, DetailViewer, etc.  DynamicForm overrides
        var fieldType = this.creator.Class + "Field",
            defaults = isc.addProperties({}, defaults, {name: field.name})
        ;

        // Pull paletteNode from editContext so it has the proper icon, etc.
        var paletteNode;
        if (editContext) {
            paletteNode = editContext.findPaletteNode("type", fieldType) || editContext.findPaletteNode("className", fieldType) || { type: fieldType };
            paletteNode = isc.addProperties({}, paletteNode, { defaults: defaults });
        } else {
            paletteNode = {
                type: fieldType,
                defaults: defaults
            };
        }

        // For a DS-bound ListGrid, don't add type or title to fields.
        // These will be picked up from the DS.
        if (fieldType != "ListGridField" || !dataSource) {
            // install a type if one is present in DSF
            if (field.type) defaults.type = field.type;
            else     delete defaults.type;

            // XXX this makes the code more verbose since the title could be left blank and be
            // inherited from the DataSource.  However if we don't supply one here, currently
            // the process of creating an editNode and adding to the editTree generates a title
            // anyway, and without using getAutoTitle().
            if (field.title || !defaults.title) {
                defaults.title = field.title || dataSource.getAutoTitle(field.name);
            }
        }
        return paletteNode;
    },

    // Component editor handling
    // ---------------------------------------------------------------------------------------

    //> @attr editProxy.supportsInlineEdit (Boolean : true : IR)
    // Whether this EditProxy has an inline edit behavior, which allows an end user to
    // configure a component by editing a simple text representation of its configuration.  
    // <p>
    // For example, when inline edit is enabled, a +link{SelectItem} allows
    // +link{selectItemEditProxy.getInlineEditText,editing its valueMap} as a comma-separated
    // string, and a +link{ListGrid}'s columns and data can be edited as several lines of
    // comma-separated headings and data values.
    // <p>
    // See +link{editProxy.inlineEditEvent} for more details and configuration options.
    //
    // @visibility external
    //<
    supportsInlineEdit: true,

    //> @attr editProxy.inlineEditOnDrop (Boolean : null : IR)
    // Should the inline editor be shown when new component is first dropped?
    //
    // @visibility external
    //<

    //> @attr editProxy.inlineEditEvent (InlineEditEvent : null : IR)
    // Event that triggers inline editing, showing the +link{inlineEditForm}, which consists of a single
    // text input (single or multi-line according to +link{inlineEditMultiline}) shown in the
    // +link{inlineEditForm} AutoChild.
    // <p>
    // The initial value in the form comes from +link{getInlineEditText()} and is applied via
    // +link{setInlineEditText()}.
    // <p>
    // Many +link{EditProxy} subclasses have built-in modes for inline editing.
    //
    // @visibility external
    //<
    inlineEditEvent: "doubleClick",

    //> @type InlineEditEvent
    // Event that will trigger inline editing.  See +link{editProxy.inlineEditEvent}.
    //
    // @value "click"             A single mouse click triggers inline editing
    // @value "doubleClick"       A double click triggers inline editing
    // @value "none"              No mouse event will trigger inline editing, but it can still
    //                            be triggered by a call to +link{EditProxy.startInlineEditing()}.
    // @value "dblOrKeypress"     A double click triggers inline editing.  In addition, <i>if
    //                            the widget is selected</i>, starting to type triggers inline editing.
    //
    // @group editing
    // @visibility external
    //<

    //> @method editProxy.startInlineEditing() 
    // Manual means of triggering inline editing.  See +link{inlineEditEvent}.
    //
    // @param [appendChar] (String) optional String to append to current value as editing starts
    // @visibility external
    //<
    _$editField:"edit",
    startInlineEditing : function (appendChar, key) {
        if (!this.supportsInlineEdit || !this.creator.editContext.enableInlineEdit) return;

        var form = this.createInlineEditForm(),
            value = this.getInlineEditText(),
            isBackspace = key === "Backspace"
        ;
        if (appendChar != null) value = (value ? value + appendChar : appendChar);
        else if (isBackspace) {
            if (!value) value = "";
            else {
                value = String(value);
                value = value.substring(0, value.length - 1);
            }
        }

        form.setValues({ edit: value });
        this.inlineEditForm = form;

        // Create or clear editor layout
        if (!this.inlineEditLayout) {
            this.inlineEditLayout = this.createInlineEditLayout();
        } else if (this.inlineEditLayout.getMembers().length > 0) {
            this.inlineEditLayout.removeMembers(this.inlineEditLayout.getMembers());
        }

        var editor = this.inlineEditLayout;
        editor.addMember(form);

        if (this.inlineEditInstructions) {
            // Initialize style from Hover on first use 
            if (!this.inlineEditInstructionLabelDefaults.baseStyle) {
                isc.EditProxy.changeDefaults("inlineEditInstructionLabelDefaults", {
                    baseStyle: isc.Hover.hoverCanvasDefaults.baseStyle
                });
            }

            if (!this.inlineEditInstructionLabel) {
                this.inlineEditInstructionLabel = this.createInlineEditInstructionLabel();
            }
            this.inlineEditInstructionLabel.setContents(this.inlineEditInstructions);

            editor.addMember(this.inlineEditInstructionLabel);
        }

        this.positionAndSizeInlineEditor();

        editor.show();

        // Configure click mask around editor so it can be closed when
        // clicking outside of it
        editor.showClickMask(
                {
                    target: editor,
                    methodName: "dismissEditor"
                },
                "soft",
                // Don't mask editor
                [editor]
        );
        
        var item = form.getItem(this._$editField);
        if (item) {
            item.delayCall("focusInItem");

            if (appendChar || isBackspace) {
                var valueLength = (value != null ? value.length : 0);
                item.delayCall("setSelectionRange", [valueLength, valueLength]);
            } else {
                item.delayCall("selectValue");
            }
        }
    },

    createInlineEditLayout : function () {
        return isc.VStack.create({
            dismissEditor : function () {
                // Automatic blur event on form will save value if needed
                this.hide();
            }
        });
    },

    createInlineEditForm : function () {
        var editFieldConfig =  isc.addProperties(
            {
                name: this._$editField,
                type: (this.inlineEditMultiline ? "TextArea" : "text"),
                allowNativeResize: this.inlineEditMultiline,
                width: "*", height: "*",
                showTitle: false
            },
            this.inlineEditFieldProperties,
            {
                keyPress : function (item, form, keyName) {
                    if (keyName == "Escape") {
                        form.discardUpdate = true;
                        form.parentElement.hide();
                    } else if (keyName == "Enter") {
                        if (!isc.isA.TextAreaItem(item)) item.blurItem();
                    }
                }, 
                blur : function (form, item) {
                    form.saveOrDiscardValue();
                    form.parentElement.hide();
                    if (form.creator.inlineEditingComplete) form.creator.inlineEditingComplete();
                }
            }
        );

        var form = this.createAutoChild("inlineEditForm", {
            margin: 0, padding: 0, cellPadding: 0,
            // set a min width larger than the Framework default for reasonable editing space
            minWidth: (this.inlineEditMultiline ? 250 : 80),
            fields: [editFieldConfig],
            saveOrDiscardValue : function () {
                if (!this.discardUpdate) {
                    var value = this.getValue(this.creator._$editField);
                    this.creator.setInlineEditText(value);
                }
            }
        });

        return form;
    },

    createInlineEditInstructionLabel : function () {
        return this.createAutoChild("inlineEditInstructionLabel");
    },

    positionAndSizeInlineEditor : function () {
        this.sizeInlineEditor();
        this.positionInlineEditor();
    },

    positionInlineEditor : function () {
        var liveObject = this.creator,
            height = liveObject.getVisibleHeight(),
            left = liveObject.getPageLeft(),
            top = liveObject.getPageTop()
        ;
        if (this.centerInlineEdit && this.inlineEditForm.getHeight() < height) {
            // Center editor vertically within target
            top += Math.round((height - this.inlineEditForm.getHeight()) / 2);
        }
        this.inlineEditLayout.moveTo(left, top);
    },

    sizeInlineEditor : function () {
        var liveObject = this.creator,
            layout = this.inlineEditLayout,
            width = liveObject.getVisibleWidth(),
            minWidth = this.inlineEditForm.minWidth || 1,
            height = liveObject.getVisibleHeight(),
            minHeight = this.inlineEditForm.minHeight || 1
        ;

        // Adjust width and height for minimum
        width = Math.max(width, minWidth);
        if (this.inlineEditMultiline) height = Math.max(height, 50);
        else height = minHeight;

        layout.setWidth(width);
        this.inlineEditForm.setHeight(height);
    },

    // Method called when inline editing completes (save or cancel).
    // Can be observed to perform operation upon completion.
    inlineEditingComplete : function () {
        // force refresh of properties pane to pick up changes
        var editContext = this.creator.editContext;
        if (editContext) editContext.fireSelectedEditNodesUpdated();
    },

    //> @attr editProxy.inlineEditForm (MultiAutoChild DynamicForm : null : IR)
    // See +link{editProxy.inlineEditEvent}.
    //
    // @visibility external
    //<
    inlineEditFormConstructor: "DynamicForm",
    inlineEditFormDefaults: {
        minWidth: 80,
        minHeight: 20,
        numCols: 1
    },

    //> @attr editProxy.inlineEditInstructionLabel (AutoChild Label : null : IR)
    // Label AutoChild used to display +link{inlineEditInstructions} below the text entry
    // area if provided. Defaults to the same styling as the system +link{Hover}.
    //
    // @visibility external
    //<
    inlineEditInstructionLabelConstructor: "Label",
    inlineEditInstructionLabelDefaults: {
        height: 10  // Small height to allow auto-fit vertically
    },

    //> @attr editProxy.inlineEditInstructions (HTMLString : null : IR)
    // Instructions that appear below the text entry area if inline editing is enabled.  See
    // +link{editProxy.inlineEditEvent} and +link{editProxy.inlineEditInstructionLabel}.
    //
    // @visibility external
    //<

    //> @attr editProxy.inlineEditMultiline (Boolean : false : IR)
    // Whether inline editing should be single or multi-line.
    // <p>
    // Single-line input appears at the control's top-left corner, multiline covers the control.
    //
    // @visibility external
    //<
    inlineEditMultiline: false,

    //> @method editProxy.getInlineEditText()
    // Returns the text based on the current component state to be edited inline.
    // Called by the +link{inlineEditForm} to obtain the starting edit value.
    // <p>
    // For a canvas with <code>isGroup</code> enabled, the <code>groupTitle</code>
    // is returned. Otherwise the <code>contents</code> is returned.
    //
    // @visibility external
    //<
    getInlineEditText : function () {
        if (this.creator.isGroup) return this.creator.groupTitle;
        return this.creator.getContents();
    },

    //> @method editProxy.setInlineEditText()
    // Save the new value into the component's state. Called by the
    // +link{inlineEditForm} to commit the change.
    // <p>
    // For a canvas with <code>isGroup</code> enabled, the <code>groupTitle</code>
    // is updated. Otherwise the <code>contents</code> is updated.
    //
    // @param newValue (String) the new component state
    //
    // @visibility external
    //<
    setInlineEditText : function (newValue) {
        var liveObject = this.creator,
            properties
        ;

        if (liveObject.isGroup) properties = { groupTitle: newValue };
        else properties = { contents: newValue };

        liveObject.editContext.setNodeProperties(liveObject.editNode, properties);
    }
});

// Edit Proxy for ValuesManager
//-------------------------------------------------------------------------------------------

//> @class ValuesManagerEditProxy
// +link{EditProxy} that handles +link{ValuesManager,ValuesManager} objects when editMode is enabled.
//
// @inheritsFrom EditProxy
// @group devTools
// @treeLocation Client Reference/Tools/EditProxy
// @visibility external
//<
isc.defineClass("ValuesManagerEditProxy", "EditProxy").addProperties({

    // override of EditProxy.canAddNode
    // - Allow drop of DataSource from a palette
    canAddNode : function (dragType, dragTarget, dragData, dropOnFolder) {
        var canAdd = this.Super("canAddNode", arguments);

        if (canAdd == null) {
            var liveObject = this.creator;
            if (dragTarget && dragTarget.isA("Palette")) {
                var clazz = isc.ClassFactory.getClass(dragType);
                if (clazz && clazz.isA("DataSource")) canAdd = true;
            }
        }

        return canAdd;
    },

    // override - drop doesn't add new node but just calls setDataSource on ValuesManager
    completeDrop : function (paletteNode, settings, callback) {
        var liveObject = this.creator;

        if (!liveObject.editContext) return;

        // loadData() operates asynchronously, so we'll have to finish the item drop off-thread.
        // Although addWithWrapper and addFromPaletteNodes called below will also asynchronously
        // load a node, doing so there breaks the sequential process which is crucial to completing
        // the drop.
        if (paletteNode.loadData && !paletteNode.isLoaded) {
            var _this = this;
            paletteNode.loadData(paletteNode, function (loadedNode) {
                loadedNode = loadedNode || paletteNode;
                loadedNode.isLoaded = true;
                _this.completeDrop(loadedNode, settings, function (editNode) {
                    editNode.dropped = paletteNode.dropped;
                    if (callback) callback(editNode);
                });
            });
            return;
        }

        var ds = paletteNode.liveObject;

        if (!ds) return;

        var parentNode = liveObject.editNode;

        liveObject.setDataSource(ds.ID);
        liveObject.editContext.setNodeProperties(parentNode, { dataSource: ds.ID });

        // Once DS is added to component, make sure component is selected

        // Force correct selection - DBC might already be marked as selected
        // but the selection updated event should be triggered.
        liveObject.editContext.deselectAllComponents();
        liveObject.editContext.selectSingleComponent(parentNode.liveObject);

        if (callback) callback(paletteNode);
    },

    setDataSource : function (dataSource, fields, forceRebind) {
        //this.logWarn("editProxy.setDataSource called" + isc.Log.getStackTrace());
        var liveObject = this.creator;

        liveObject.setDataSource(dataSource, fields);
    },

    showSelectedAppearance : function (show, hideLabel, showThumbsOrDragHandle) {
        var liveObject = this.creator;

        // Selecting a ValuesManager shows an outline around all member components that
        // are visible.
        if (show) {
            // Update SelectionOutline with this context's properties
            isc.SelectionOutline.border = "1px dashed blue";

            var members = liveObject.getMembers();
            if (members && members.length > 0) {
                // editContext root canvas may be part of VM. Don't select it.
                var rootCanvas = liveObject.editContext.getRootEditNode().liveObject,
                    targets = []
                ;
                for (var i = 0; i < members.length; i++) {
                    if (members[i] != rootCanvas) targets.add(members[i]);
                }
                isc.SelectionOutline.select(targets, false, false);
            } else {
                isc.SelectionOutline.deselect();
            }

        } else if (isc.SelectionOutline.getSelectedObject() == liveObject) {
            isc.SelectionOutline.deselect();
        }
    }

});

// Edit Proxy for Canvas
//-------------------------------------------------------------------------------------------

//> @class CanvasEditProxy
// +link{EditProxy} that handles +link{Canvas,Canvas} objects when editMode is enabled.
//
// @inheritsFrom EditProxy
// @group devTools
// @treeLocation Client Reference/Tools/EditProxy
// @visibility external
//<
isc.defineClass("CanvasEditProxy", "EditProxy").addProperties({
    //> @attr editProxy.bringToFrontOnSelect (Boolean : null : IR)
    // Should component be brought to front when selected? Applies when +link{editProxy.useEditMask}:true.
    //
    // @visibility external
    //<

    //> @attr editProxy.persistCoordinates (Boolean : null : IRW)
    // Changes to all child +link{EditNode.liveObject,liveObject}'s position
    // and size can be persisted to their +link{EditNode,EditNodes} based on this
    // attribute setting and +link{EditContext.persistCoordinates}. This
    // applies to both programmatic calls and user interaction (drag reposition
    // or drag resize).
    // <p>
    // The default value of <code>null</code> allows +link{EditContext.persistCoordinates}
    // to control all coordinate persistence. An explicit value of <code>false</code>
    // overrides the EditContext setting so that no children of the component save coordinates.
    // <p>
    // All coordinate persisting can be disabled with +link{EditContext.persistCoordinates}.
    // Additionally, all control of persistence can be deferred to each EditProxy by setting
    // +link{EditContext.persistCoordinates} to <code>null</code>.
    //
    // @visibility external
    //<
    persistCoordinates: null
});

isc.CanvasEditProxy.addMethods({
    // Hoop selection
    // --------------------------------------------------------------------------------------------

    //> @attr editProxy.hoopSelector (AutoChild Canvas : null : IR)
    // Hoop selector canvas used for selecting multiple components.
    // <P>
    // Common customization properties can be provided by +link{editContext.hoopSelectorProperties}.
    //
    // @visibility external
    //<
    hoopSelectorDefaults: {
        _constructor:"Canvas",
        _isHoopSelector:true,   // Allow saveCoordinates to skip
        autoDraw:false,
        keepInParentRect: true,
        redrawOnResize:false,
        overflow: "hidden"
    },

    mouseDown : function (event) {
        var result = this.Super("mouseDown", arguments);
        if (result == false) return result;

        var liveObject = this.creator,
            target = event.target
        ;

        if (!this.canSelectChildren || this.canSelect == false) return;
        var editContext = liveObject.editContext;

        // don't start hoop selection unless the mouse went down on the Canvas itself, as
        // opposed to on one of the live objects
        if (target != liveObject) {
            // look at parent canvas chain to handle case where target is canvas in canvasItem
            while (target.parentElement && !target.canvasItem) target = target.parentElement;
            if (!target.canvasItem || target.canvasItem.containerWidget != liveObject) return;
        }

        if (editContext.selectionType != isc.Selection.MULTIPLE) return;

        // Since mouse is pressed outside of a component clear current selection
        if (!(isc.EH.shiftKeyDown() || (isc.Browser.isWin && isc.EH.ctrlKeyDown()))) {
            editContext.deselectAllComponents();
        }

        if (this.hoopSelector == null) {
            var properties = isc.addProperties({},
                    this.hoopSelectorDefaults, 
                    this.hoopSelectorProperties,
                    { border: this.selectedBorder },
                    { left: isc.EH.getX(), top: isc.EH.getY() }
                );

            // Create hoop selector as a child on our liveObject
            this.hoopSelector = liveObject.createAutoChild("hoopSelector", properties);
            liveObject.addChild(this.hoopSelector);
        }
        this._hoopStartX = liveObject.getOffsetX();
        this._hoopStartY = liveObject.getOffsetY();

        // Save current selection to determine if this mouseDown is paired
        // with a mouseUp that does not change the selection. In that case
        // we should not fire the selectedEditNodesUpdated event.
        this._startingSelection = editContext.getSelectedComponents();

        this.resizeHoopSelector();
        this.hoopSelector.show();
    },

    // resize hoop on dragMove
    // hide selector hoop on mouseUp or dragStop
    dragMove : function() {
        this.Super("dragMove", arguments);
        if (this.hoopSelector && this.hoopSelector.isVisible()) this.resizeHoopSelector();
    },

    dragStop : function() {
        if (this.hoopSelector && this.hoopSelector.isVisible()) {
            this.hoopSelector.hide();
            var currentSelection = this.creator.editContext.getSelectedComponents();
            if (!this._startingSelection.equals(currentSelection)) {
                this.creator.editContext.showGroupSelectionBox();
                // Fire callback now that selection has completed 
                this.creator.editContext.fireSelectedEditNodesUpdated();
            }
        }
    },

    mouseUp : function () {
        if (!this.canSelectChildren) return;
        if (this.hoopSelector && this.hoopSelector.isVisible()) {
            this.hoopSelector.hide();
            var currentSelection = this.creator.editContext.getSelectedComponents();
            if (!this._startingSelection.equals(currentSelection)) {
                this.creator.editContext.showGroupSelectionBox();
                // Fire callback now that selection has completed 
                this.creator.editContext.fireSelectedEditNodesUpdated();
            }
        }
    },

    // figure out which components intersect the selector hoop, and show the selected outline on
    // those
    updateCurrentSelection : function () {
        var liveObject = this.creator,
            editContext = liveObject.editContext,
            isDrawPane = isc.isA.DrawPane(liveObject)
        ;

        var children = (isDrawPane ? liveObject.drawItems : liveObject.children);
        if (!children) return;
        var oldSelection = editContext.getSelectedComponents(),
            matchFunc = (editContext.hoopSelectionMode == "intersects" ? "intersects" : "encloses"),
            modifierKeyDown = (isc.EH.shiftKeyDown() || (isc.Browser.isWin && isc.EH.ctrlKeyDown()))
        ;

        // make a list of all the children which currently intersect the selection hoop.
        // Update editContext selectedComponents directly because we don't want to fire
        // the selectedEditNodesUpdated event during hoop dragging.
        if (!modifierKeyDown) editContext.selectedComponents = [];
        for (var i = 0; i < children.length; i++) {
            var child = children[i],
                isInternal = (child.creator && (isc.isA.DrawKnob(child.creator) || child._internal))
            ;

            if (!isInternal && this.hoopSelector[matchFunc](child)) {
                if (!isDrawPane) child = this.deriveSelectedComponent(child);
                if (child && !editContext.selectedComponents.contains(child)) {
                    if (child.editProxy && child.editProxy.canSelect != false) {
                        editContext.selectedComponents.add(child);
                    }
                }
            }
        }

        // set outline on components currently within the hoop
        for (var i = 0; i < editContext.selectedComponents.length; i++) {
            editContext.selectedComponents[i].editProxy.showSelectedAppearance(true, true);
        }

        // de-select anything that is no longer within the hoop
        if (!modifierKeyDown) {
            oldSelection.removeList(editContext.selectedComponents);
            for (var i = 0; i < oldSelection.length; i++) {
                oldSelection[i].editProxy.showSelectedAppearance(false);
            }
        }
    },

    // given a child in the canvas, derive the editComponent if there is one
    deriveSelectedComponent : function (comp) {
        var liveObject = this.creator;

        // if the component has a master, it's either an editMask or a peer of some editComponent
        if (comp.masterElement) return this.deriveSelectedComponent(comp.masterElement);
        if (!comp.parentElement || comp.parentElement == liveObject) {
            // if it has an event mask, it's an edit component
            if (comp.editProxy && comp.editProxy.hasEditMask()) return comp;
            // otherwise it's a mask or the hoop
            return null;
        }
        // XXX does this case exist?  how can a direct child have a parent element other than its
        // parent?
        return this.deriveSelectedComponent(comp.parentElement);
    },

    // resize selector to current mouse coordinates
    resizeHoopSelector : function () {
        var liveObject = this.creator,
            x = liveObject.getOffsetX(),
            y = liveObject.getOffsetY();

        if (this.hoopSelector.keepInParentRect) {
            if (x < 0) x = 0;
            var parentHeight = this.hoopSelector.parentElement.getVisibleHeight();
            if (y > parentHeight) y = parentHeight;
        }
    
        // resize to the distances from the start coordinates
        this.hoopSelector.resizeTo(Math.abs(x-this._hoopStartX), Math.abs(y-this._hoopStartY));

        // if we are above/left of the origin set top/left to current mouse coordinates,
        // otherwise to start coordinates.
        if (x < this._hoopStartX) this.hoopSelector.setLeft(x);
        else this.hoopSelector.setLeft(this._hoopStartX);

        if (y < this._hoopStartY) this.hoopSelector.setTop(y);
        else this.hoopSelector.setTop(this._hoopStartY);

        // figure out which components are now in the selector hoop
        this.updateCurrentSelection();
    },

    // Shared confirm replacement question
    confirmReplaceComponent : function (existingNode, newNode, callback) {
        var _this = this;
        this.makeConfirmReplaceDialog(existingNode, newNode, function (wrapperType) {
            if (callback) _this.fireCallback(callback, "wrapperType", [wrapperType]);
        });
    
        this.showConfirmReplaceDialog(existingNode.liveObject);
    },
    
    showConfirmReplaceDialog : function (target) {
        // Window is automatically drawn off-screen so that
        // the size is correct based on contents.
        //
        var window = this.confirmReplaceWindow;

        if (target.isVisible()) {
            var width = window.getVisibleWidth(),
                height = window.getVisibleHeight(),
                left = ((target.getWidth() - width) / 2) + 
                            Math.max(0, 
                                target.getScrollLeft()
                            ),
                top = ((target.getHeight() - height) / 2) +
                            Math.max(0, 
                                target.getScrollTop()
                            );

            // Don't try to apply decimal positions, don't position top of window off-screen
            left = Math.round(left);
            top = Math.max(Math.round(top),0);

            window.placeNear(left + target.getPageLeft(), top + target.getPageTop());
        } else {
            window.centerInPage();
        }
        window.show();
    },
    
    dialogLayoutDefaults: {
        _constructor: isc.VLayout,
        autoDraw: false,
        width: 600,
        padding: 5
    },

    confirmReplaceFormDefaults: {
        _constructor: isc.DynamicForm,
        autoParent: "dialogLayout",
        autoDraw: false,
        width: "100%",
        height: "100%",
        numCols: 1,
        initWidget : function () {
            this.fields = [
                {name: "blurb", type: "blurb", defaultValue: this.intro },
                {name: "action", type: "radioGroup", showTitle: false, wrap: false,
                 valueMap: this.actions}
            ];
            this.values = { action: this.actions[0] };
            this.Super("initWidget", arguments);
        }
    },

    buttonsLayoutDefaults: {
        _constructor: isc.HLayout,
        autoParent: "dialogLayout",
        autoDraw: false,
        width: "100%",
        height: 30,
        membersMargin: 10,
        align: "right"
    },
    okButtonDefaults: {
        _constructor: "IButton",
        autoParent: "buttonsLayout",
        autoDraw: false,
        title: "OK",
        getSelectedIndex : function () {
            var values = this.form.actions,
                value = this.form.getValue("action")
            ;
            for (var i = 0; i < values.length; i++) {
                if (value == values[i]) return i;
            }
            return null;
        }
    },
    cancelButtonDefaults: {
        _constructor: "IButton",
        autoParent: "buttonsLayout",
        autoDraw: false,
        title: "Cancel",
        click : function () {
            this.creator.cancelClick();
        }
    },

    // Wrapper types that correlate to valueMap defined below
    _wrapperTypes: [
        "VLayout",
        "HLayout",
        null
    ],

    makeConfirmReplaceDialog : function (existingNode, newNode, callback) {
        var liveObject = this.creator,
            editContext = liveObject.editContext,
            _this = this,
            paneDesc = "pane"
        ;
    
        if (this.getChildNodeDescription) {
            paneDesc = this.getChildNodeDescription(existingNode);
            paneDesc = paneDesc.substring(1, paneDesc.length-1);
        }

        if (this.confirmReplaceForm) this.confirmReplaceForm.markForDestroy();

        var existingComponentDesc = editContext.getEditNodeIDDescription(existingNode, true);
        var newComponentDesc = editContext.getEditNodeIDDescription(newNode, true);

        var intro = "There is already a component in the " + paneDesc + ". Do you want to:",
            valueMap = [
                "combine " + newComponentDesc + " with " + existingComponentDesc + " in VLayout (vertical stacking)",
                "combine " + newComponentDesc + " with " + existingComponentDesc + " in HLayout (horizontal stacking)",
                "replace " + existingComponentDesc + " with " + newComponentDesc
            ]
        ;

        if (this.confirmReplaceWindow) this.confirmReplaceWindow.markForDestroy();

        this.confirmReplaceForm = this.createAutoChild("confirmReplaceForm", { intro: intro, actions: valueMap });
        this.cancelButton = this.createAutoChild("cancelButton", {
            click : function () {
                this.creator.confirmReplaceWindow.hide();
            }
        });
        this.okButton = this.createAutoChild("okButton", {
            form: this.confirmReplaceForm,
            click : function () {
                var index = this.getSelectedIndex();
                this.creator.confirmReplaceWindow.hide();
                if (callback) {
                    var wrapperType = _this._wrapperTypes[index];
                    _this.fireCallback(callback, "wrapperType", [wrapperType]);
                }
            }
        });
        this.buttonsLayout = this.createAutoChild("buttonsLayout", { members: [this.cancelButton, this.okButton] });
        this.dialogLayout = this.createAutoChild("dialogLayout", { members: [this.confirmReplaceForm, this.buttonsLayout ]});

        this.confirmReplaceWindow = isc.Window.create({
            title: "Replace existing component?",
            // autoDraw off-screen to get correct size
            autoDraw: true,
            top: -500, left: -1000,
            showCloseButton: false,
            showMinimizeButton: false,
    
            isModal: true, showModalMask: true,
            autoSize: true,
    
            items: [ this.dialogLayout ]
        });
    },   // end makeConfirmReplaceDialog

    wrapExistingComponent : function (existingNode, wrapperType) {
        var liveObject = this.creator,
            editContext = liveObject.editContext,
            parentNode = editContext.getParentNode(existingNode)
        ;

        // Remove existing component from editTree
        editContext.removeNode(existingNode, null, true);

        // Reset user sizes on component so wrapper layout can perform clean layout
        var existingObject = existingNode.liveObject;
        if (existingObject.updateUserSize) {
            existingObject.updateUserSize(null, existingObject._$width);
            existingObject.updateUserSize(null, existingObject._$height);
        }

        // Remove reference to parentProperty from existing node so it isn't used to
        // add to new wrapper parent
        if (existingNode.defaults) delete existingNode.defaults.parentProperty;

        // Create new wrapper for wrapperType
        var paletteNode = editContext.findPaletteNode("type", wrapperType) || editContext.findPaletteNode("className", wrapperType);
        if (!paletteNode) {
            paletteNode = {
                type: wrapperType,
                defaults : { _constructor: wrapperType }
            };
        }
        paletteNode = isc.clone(paletteNode);

        var wrapperNode = editContext.makeEditNode(paletteNode);

        // add the wrapper to the parent
        editContext.addNode(wrapperNode, parentNode, null, null, null, null, true);

        // add the existing component node to the wrapper
        editContext.addNode(existingNode, wrapperNode);

        return wrapperNode;
    }
});

// Edit Proxy for AbsoluteContainer
//-------------------------------------------------------------------------------------------

//> @class AbsoluteContainerEditProxy
// +link{EditProxy} that handles +link{Canvas,Canvas} objects when editMode is enabled.
//
// @inheritsFrom EditProxy
// @group devTools
// @treeLocation Client Reference/Tools/EditProxy
// @visibility external
//<
isc.defineClass("AbsoluteContainerEditProxy", "CanvasEditProxy").addProperties({

    // override of EditProxy.canAddNode
    // - Allow drop of Canvas, FormItem and DrawItem from a palette
    canAddNode : function (dragType, dragTarget, dragData, dropOnFolder) {
        var canAdd = this.Super("canAddNode", arguments);

        if (canAdd == null) {
            var liveObject = this.creator;
            if (isc.isAn.AbsoluteContainer(liveObject) && dragTarget && dragTarget.isA("Palette")) {
                // We also accept a drop of a FormItem; this will be detected downstream and handled by
                // wrapping the FormItem inside an auto-created DynamicForm.  Similarly a DrawItem
                // can be accepted because it will be wrapped inside an auto-created DrawPane.
                var clazz = isc.ClassFactory.getClass(dragType);
                if (clazz && clazz.isA("Canvas") || clazz.isA("FormItem") || clazz.isA("DrawItem")) {
                    canAdd = true;
                }
            }
        }

        return canAdd;
    },

    shouldPassDropThrough : function () {
        // Never pass a drop through
        return false;
    }
});


// Edit Proxy for Layout
//-------------------------------------------------------------------------------------------

//> @class LayoutEditProxy
// +link{EditProxy} that handles +link{Layout} objects when editMode is enabled.
//
// @inheritsFrom CanvasEditProxy
// @group devTools
// @treeLocation Client Reference/Tools/EditProxy
// @visibility external
//<
isc.defineClass("LayoutEditProxy", "CanvasEditProxy").addMethods({

    drop : function () {
        var liveObject = this.creator,
            editContext = liveObject.editContext
        ;

        if (this.shouldPassDropThrough()) {
            liveObject.hideDropLine();
            return;
        }

        isc.EditContext.hideAncestorDragDropLines(liveObject);

        var source = isc.EH.dragTarget,
            paletteNode,
            editNode,
            dropType;

        if (!source.isA("Palette")) {
            if (source.isA("FormItemProxyCanvas")) {
                source = source.formItem;
            }
            dropType = source._constructor || source.Class;
        } else {
            paletteNode = source.transferDragData();
            if (isc.isAn.Array(paletteNode)) paletteNode = paletteNode[0];
            dropType = paletteNode.type || paletteNode.className;
        }

        // Establish the actual drop node (this may not be the canvas accepting the drop - for a
        // composite component like TabSet, the dropped-on canvas will be the tabBar or 
        // paneContainer)
        var dropTargetNode = this.findEditNode(dropType);
        if (dropTargetNode) {
            dropTargetNode = dropTargetNode.editNode;
        }

        // If drop target isn't this layout and not another LayoutEditProxy, defer handling
        // to the correct proxy.
        if (dropTargetNode.liveObject != liveObject &&
            dropTargetNode.liveObject.editProxy &&
            dropTargetNode.liveObject.editProxy != this)
        {
            liveObject.hideDropLine();

            // If node is dropped from a tree, clean it of internal properties
            if (source.isA("TreePalette")) {
                paletteNode = source.data.getCleanNodeData(paletteNode, false, false, false);
            }

            // Palette node could be modified later if there are palettized components within.
            // Copy it now so that future drops are not affected.
            if (paletteNode) {
                paletteNode = isc.clone(paletteNode);
                paletteNode.dropped = true;
            }

            // if the dragTarget isn't a Palette, we're drag/dropping an existing component, so remove the 
            // existing component and re-create it in its new position
            var editProxy = dropTargetNode.liveObject.editProxy;
            if (!source.isA("Palette")) {
                editProxy.completeReparent(true);
            } else {
                editProxy.completeDrop(paletteNode, { skipSnapToGrid: isc.EH.shiftKeyDown() });
            }
            return isc.EH.STOP_BUBBLING;
        }

        var index = this.getDropPosition();

        if (paletteNode) {
            // Allow substitute nodes
            paletteNode = this.substituteNode(dropTargetNode, paletteNode);
            dropType = paletteNode.type || paletteNode.className;

            // Find best parent for drop
            var oldDropTargetNode = dropTargetNode;
            dropTargetNode = this.adjustParentNode(dropTargetNode, paletteNode);
            if (oldDropTargetNode != dropTargetNode) index = null;
        }

        if (paletteNode) {
            editNode = editContext.makeEditNode(paletteNode);
            editNode.dropped = true;
        }

        // modifyEditNode() is a late-modify hook for components with unusual drop requirements
        // that don't fit in with the normal scheme of things (SectionStack only, as of August 09).
        // This method can be used to modify the editNode that is going to be the parent - or 
        // replace it with a whole different one 
        if (this.modifyEditNode) {
            dropTargetNode = this.modifyEditNode(editNode, dropTargetNode, dropType);
            if (!dropTargetNode) {
                liveObject.hideDropLine();
                return isc.EH.STOP_BUBBLING;
            }
        }


        // if the source isn't a Palette, we're drag/dropping an existing component, so remove the 
        // existing component and re-create it in its new position
        if (!source.isA("Palette")) {
            if (source == liveObject) return;  // Can't drop a component onto itself
            var tree = editContext.getEditNodeTree(),
                oldParent = tree.getParent(source.editNode),
                oldIndex = tree.getChildren(oldParent).indexOf(source.editNode),
                newIndex = index;
            editContext.removeNode(source.editNode, null, true);

            // If we've moved the child component to a slot further down in the same parent, 
            // indices will now be off by one because we've just removeed it from its old slot
            if (oldParent == this.editNode && newIndex > oldIndex) newIndex--;
            var node;
            if (source.isA("FormItem")) {
                // If the source is a CanvasItem, unwrap it and insert the canvas into this Layout
                // directly; otherwise, we would end up with teetering arrangments of Canvases in
                // inside CanvasItems inside DynamicForms inside CanvasItems inside DynamicForms...
                if (source.isA("CanvasItem")) {
                    node = editContext.addNode(source.canvas.editNode, dropTargetNode, newIndex);
                } else {
                    // Wrap the FormItem in a DynamicForm
                    node = editContext.addWithWrapper(source.editNode, dropTargetNode, newIndex);
                }
            } else if (source.isA("DrawItem")) {
                // Wrap the DrawItem in a DrawPane
                node = editContext.addWithWrapper(source.editNode, dropTargetNode, newIndex, null, true);
            } else {
                // Don't offer a binding dialog if so configured because the node isn't really new
                node = editContext.addNode(source.editNode, dropTargetNode, newIndex, null, null, null, true);
            }

            if (node) {
                editContext.fireNodeMoved(source.editNode, oldParent, node, dropTargetNode);
            }

            if (isc.isA.TabSet(dropTargetNode.liveObject)) {
                dropTargetNode.liveObject.selectTab(source);
            } else if (node && node.liveObject) {
                isc.EditContext.delayCall("selectCanvasOrFormItem", [node.liveObject, true], 200);
            }
        } else {
            var clazz = isc.ClassFactory.getClass(dropType),
                nodeAdded;
            if (clazz && clazz.isA("FormItem")) {
                // Create a wrapper form to allow the FormItem to be added to this Canvas
                nodeAdded = editContext.addWithWrapper(editNode, dropTargetNode, index);
            } else if (clazz && clazz.isA("DrawItem")) {
                // Create a wrapper form to allow the DrawItem to be added to this Canvas
                nodeAdded = editContext.addWithWrapper(editNode, dropTargetNode, index, null, true);
            } else {
                // A DataSource drop should always be dropped at position 0. Probably a ListGrid.
                var iscClass = isc.DataSource.getNearestSchemaClass(dropType);
                if (iscClass && iscClass.isA(isc.DataSource)) index = 0;

                // Obtain container node to wrap dropped node in if applicable
                var container = this.getContainerNode(dropTargetNode, editNode);
                if (container) {
                    var containerNode = liveObject.editContext.makeEditNode(container);
                    nodeAdded = editContext.addNode(containerNode, dropTargetNode, index);
                    dropTargetNode = nodeAdded;
                    index = 0;
                }
        
                nodeAdded = editContext.addNode(editNode, dropTargetNode, index);
            }
            if (nodeAdded != null) {
                if (this.canSelectChildren && editNode.liveObject.editProxy != null &&
                    editNode.liveObject.editProxy.canSelect != false)
                {
                    // Delay selecting the component so it has time to draw and be adjusted
                    // to the correct size by the layout. Selection appearance depends on
                    // the component being the correct size when selected.
                    editContext.delayCall("selectSingleComponent", [editNode.liveObject]);
                }
        
                // Let node's proxy know that it has just been dropped in place
                if (editNode.liveObject.editProxy && editNode.liveObject.editProxy.nodeDropped)
                {
                    editNode.liveObject.editProxy.nodeDropped(editNode, dropTargetNode);
                }
            }
        }

        liveObject.hideDropLine();
        return isc.EH.STOP_BUBBLING;
    },

    // override point (see HeaderEditProxy)
    getDropPosition : function () {
        return this.creator.getDropPosition();
    },

    dropMove : function () {
        if (!this.willAcceptDrop()) return false;
        if (!this.shouldPassDropThrough()) {
            var liveObject = this.creator;
            if (liveObject.dropMove) liveObject.dropMove();
            if (liveObject.parentElement && liveObject.parentElement.hideDropLine) {
                liveObject.parentElement.hideDropLine();
                if (liveObject.parentElement.isA("FormItem")) {
                    liveObject.parentElement.form.hideDragLine();
                } else if (liveObject.parentElement.isA("DrawItem")) {
                    liveObject.parentElement.drawPane.hideDragLine();
                }
            }
            return isc.EH.STOP_BUBBLING;        
        } else {
            this.creator.hideDropLine();
        }
    },

    dropOver : function () {
        var liveObject = this.creator;

        if (!this.willAcceptDrop()) {
            if (liveObject == liveObject.ns.EH.dragTarget) {
                return;
            }
            return false;
        }
        if (!this.shouldPassDropThrough()) {
            if (liveObject.dropOver) liveObject.dropOver();
            if (liveObject.parentElement && liveObject.parentElement.hideDropLine) {
                liveObject.parentElement.hideDropLine();
                if (liveObject.parentElement.isA("FormItem")) {
                    liveObject.parentElement.form.hideDragLine();
                } else if (liveObject.parentElement.isA("DrawItem")) {
                    liveObject.parentElement.drawPane.hideDragLine();
                }
            }
            return isc.EH.STOP_BUBBLING;        
        } else {
            this.creator.hideDropLine();
        }
    },

    dropOut : function () {
        var liveObject = this.creator;
        this.showSelectedAppearance(false);

        if (!this.shouldPassDropThrough()) {
            if (liveObject.dropOut) liveObject.dropOut();
            return isc.EH.STOP_BUBBLING;        
        } else {
            this.creator.hideDropLine();
        }
    },

    // Component editor handling
    // ---------------------------------------------------------------------------------------

    supportsInlineEdit: false
});    

//> @class LayoutResizeBarEditProxy
// +link{EditProxy} that handles +link{LayoutResizeBar}
// objects when editMode is enabled.
//
// @inheritsFrom EditProxy
// @group devTools
// @treeLocation Client Reference/Tools/EditProxy
// @visibility external
//<
isc.defineClass("LayoutResizeBarEditProxy", "EditProxy").addMethods({

    // This component should operate as it does in live mode so no drag handle is shown
    showDragHandle: false,

    // Override EditProxy.dragMove to let the component do the normal dragMove operation
    dragMove : function() {
        return this.creator.dragMove();
    },

    click : function () {
        // Let proxy click handler select canvas if needed
        var result = this.Super("click", arguments);
        // Then pass click event back to component to perform normal action
        this.creator.click();
        return result;
    },

    // Component editor handling
    // ---------------------------------------------------------------------------------------

    supportsInlineEdit: false,
    inlineEditOnDrop: false
});

isc.defineClass("DeckEditProxy", "LayoutEditProxy").addMethods({
    // When a pane is dropped into the Deck, set the new pane as the current pane.
    addPane : function (pane, index) {
        var liveObject = this.creator;
        liveObject.addPane(pane, index);
        liveObject.setCurrentPane(pane);
    }
});


// Edit Proxy for SplitPane
// -------------------------------------------------------------------------------------------

//> @class SplitPaneEditProxy
// +link{EditProxy} that handles +link{SplitPane} objects when editMode is enabled.
//
// @inheritsFrom LayoutEditProxy
// @group devTools
// @treeLocation Client Reference/Tools/EditProxy
// @visibility external
//<
isc.defineClass("SplitPaneEditProxy", "LayoutEditProxy").addMethods({

    // observe() callbacks - rerun logic to locate first breadth-first DBC
    _$updatePaneComponent:  "observer._updatePaneComponent(arguments[1])",
    _$updatePaneComponents: "observer._updatePaneComponent(arguments[1]);" +
         "if(arguments[1]!=arguments[3])observer._updatePaneComponent(arguments[3])",

    // When a component is dragged onto a SplitPane show an overlay with 2 or 3 panes as targets
    // for the drop. Panes show the current component, if any. 
    // 
    // A SplitPane shows 2 panes for drop where a TriplePane shows 3 panes.

    

    setEditMode : function (editingOn) {
        this.Super("setEditMode", arguments);
        var liveObject = this.creator;

        this.isTriplePane = isc.isA.TriplePane(liveObject);

        if (editingOn) {
            // Show instruction canvas where no content panes are yet assigned.
            // Overridden set*Pane methods will remove the instruction canvas when
            // adding a real pane and create a new if the pane is removed.
            var detailListPane = (this.isTriplePane ? "List Pane" : "Navigation Pane");
            if (!liveObject.navigationPane) {
                liveObject._setNavigationPane(this.createInstructionPane(null, "Navigation Pane",
                                                                        "navigationPane"));
            }
            if (!liveObject.listPane && this.isTriplePane) {
                liveObject._setListPane(this.createInstructionPane(null, "List Pane", "listPane"));
            }
            if (!liveObject.detailPane) {
                liveObject._setDetailPane(this.createInstructionPane(null, "Detail Pane",
                                                                    "detailPane", detailListPane));
            }
        } else {
            // Remove any instruction panes
            if (liveObject.navigationPane && liveObject.navigationPane._instructionPane) {
                var pane = liveObject.navigationPane;
                liveObject._setNavigationPane(null);
                pane.destroy();
            }
            if (liveObject.listPane && liveObject.listPane._instructionPane) {
                var pane = liveObject.listPane;
                liveObject._setListPane(null);
                pane.destroy();
            }
            if (liveObject.detailPane && liveObject.detailPane._instructionPane) {
                var pane = liveObject.detailPane;
                liveObject._setDetailPane(null);
                pane.destroy();
            }
        }

        
        var editContext = liveObject.editContext;
        if (editingOn) {
            this.observe(editContext, "nodeAdded",   this._$updatePaneComponent);
            this.observe(editContext, "nodeRemoved", this._$updatePaneComponent);
            this.observe(editContext, "nodeMoved",   this._$updatePaneComponents);
        } else {
            this.ignore(editContext, "nodeAdded");
            this.ignore(editContext, "nodeRemoved");
            this.ignore(editContext, "nodeMoved");
        }
        
        liveObject.updateUI(true);
    },

    
    _updatePaneComponent : function (parentEditNode) {
        if (!parentEditNode) return;

        var liveObject = this.creator,
            listPane = liveObject.listPane,
            navPane = liveObject.navigationPane,
            parentNode = parentEditNode.liveObject
        ;
        // walk up the parent chain looking for our SplitPane's panes
        while (parentNode != null) {
            if (listPane == parentNode) {
                liveObject._observePane("list", listPane, true);
                return;
            }
            if (navPane == parentNode) {
                liveObject._observePane("navigation", navPane, true);
                return;
            }
            parentNode = parentNode.parentElement;
        }
        // node wasn't under our SplitPane's navigation or list pane
    },

    getOverrideProperties : function () {
        var properties = this.Super("getOverrideProperties", arguments);

        properties = isc.addProperties({}, properties, {
            // Override set*Pane methods to remove or add instruction pane
            setNavigationPane: this.setNavigationPane,
            setListPane: this.setListPane,
            setDetailPane: this.setDetailPane
        });
        return properties;
    },

    setNavigationPane : function (pane) {
        var oldPane = this.creator.navigationPane;
        if (!pane) pane = this.createInstructionPane(null, "Navigation Pane", "navigationPane");

        this.creator.Super("setNavigationPane", [pane]);
        if (oldPane != null && oldPane != pane && oldPane._instructionPane) {
            oldPane.destroy();
        }
    },

    setListPane : function (pane) {
        var oldPane = this.creator.listPane;
        if (!pane) pane = this.createInstructionPane(null, "List Pane", "listPane");

        this.creator.Super("setListPane", [pane]);
        if (oldPane != null && oldPane != pane && oldPane._instructionPane) {
            oldPane.destroy();
        }
    },

    setDetailPane : function (pane) {
        var oldPane = this.creator.detailPane;
        if (!pane) {
            var detailListPane = (this.isTriplePane ? "List Pane" : "Navigation Pane");
            pane = this.createInstructionPane(null, "Detail Pane", "detailPane", detailListPane);
        }

        this.creator.Super("setDetailPane", [pane]);
        if (oldPane != null && oldPane != pane && oldPane._instructionPane) {
            oldPane.destroy();
        }
    },

    // override of EditProxy.canAddNode
    // - Reject reparenting within the EditTree
    canAddNode : function (dragType, dragTarget, dragData, dropOnFolder) {
        var canAdd = this.Super("canAddNode", arguments);

        // Reject reparenting within the EditTree
        // This type of drop would be handled by EditTree.folderDrop directly and that would
        // bypass assigning the correct target pane to the drop.
        if (canAdd && dropOnFolder && dragTarget && !dragTarget.isA("Palette")) {
            canAdd = null;
        }

        return canAdd;
    },

    drop : function () {
        // SplitPane doesn't accept drop directly in preview; drop is performed on overlay
        return isc.EH.STOP_BUBBLING;        
    },

    dropOver : function () {
        if (!this.canDropAtLevel()) return;

        if (!this.willAcceptDrop()) {
            if (this.creator == this.creator.ns.EH.dragTarget) {
                return;
            }
            return false;
        }
        if (!this.shouldPassDropThrough()) {
            this.showDropOverlay(true);
            this.creator.hideDropLine();
        }
        return isc.EH.STOP_BUBBLING;
    },

    dropMove : function () {
        var result = this.Super("dropMove", arguments);

        // While dropOver normally handles showing the drop overlay, if the first "over"
        // location is in the dropMargin, shouldPassDropThrough returns true to allow drop
        // over parent component and therefore doesn't show the drop overlay. Once the
        // drop location moves further over this component and therefore not being passed
        // through (i.e. returns STOP_BUBBLING) make sure the drop overlay is showing.
        if (result == isc.EH.STOP_BUBBLING) {
            this.showDropOverlay(true);
            this.creator.hideDropLine();
        }
        return result;
    },

    dropOut : function () {
        this.showSelectedAppearance(false);
        this.showDropOverlay(false);
    },

    // Called to complete the drop process from above and also from palette.folderDrop so
    // that the same processing occurs in both cases.
    // settings.index - should be the index into the parent component, not the index within the editTree
    completeDrop : function (paletteNode, settings, callback, source) {
        var liveObject = this.creator;

        if (!liveObject.editContext) return;

        source = source || isc.EH.dragTarget;

        // loadData() operates asynchronously, so we'll have to finish the item drop off-thread.
        // Although addWithWrapper and addFromPaletteNodes called below will also asynchronously
        // load a node, doing so there breaks the sequential process which is crucial to completing
        // the drop.
        if (paletteNode.loadData && !paletteNode.isLoaded) {
            var _this = this;
            paletteNode.loadData(paletteNode, function (loadedNode) {
                loadedNode = loadedNode || paletteNode;
                loadedNode.isLoaded = true;
                _this.completeDrop(loadedNode, settings, function (editNode) {
                    editNode.dropped = paletteNode.dropped;
                    if (callback) callback(editNode);
                }, source);
            });
            return;
        }

        // Unwrap settings
        var parentProperty = (settings ? settings.parentProperty : null);

        var editContext = liveObject.editContext,
            parentNode = liveObject.editNode,
            editNode,
            dropType
        ;

        // Auto-assign parentProperty to first empty pane or detailPane if all are full
        if (!parentProperty) parentProperty = this.getDropParentProperty();

        if (!source.isA("Palette")) {
            if (source.isA("FormItemProxyCanvas")) {
                source = source.formItem;
            }
            dropType = source._constructor || source.Class;
            editNode = source.editNode;
        } else {
            // Allow substitute nodes
            paletteNode = this.substituteNode(liveObject.editNode, paletteNode);

            // Find best parent for drop
            parentNode = this.adjustParentNode(parentNode, paletteNode);
            if (parentNode != liveObject.editNode) {
                // Not adding to the split pane
                editContext.addFromPaletteNodes([paletteNode], parentNode, null, null, false);
                return;
            }

            editNode = editContext.makeEditNode(paletteNode);
            editNode.dropped = true;
            editNode.defaults.parentProperty = parentProperty;
            dropType = editNode.type || editNode.className;
        }

        if (isc.isA.DataSource(editNode.liveObject)) {
            return;
        }

        var existingComponent = isc.DS.getChildObject(liveObject, "Canvas", null, parentProperty),
            _this = this;
        if (existingComponent && !existingComponent._instructionPane) {
            this.confirmReplaceComponent(existingComponent.editNode, editNode, function (wrapperType) {
                // Wrap ResizeBar in VLayout if replacing existing component
                if (!wrapperType && dropType == "LayoutResizeBar") wrapperType = "VLayout";
                _this.finishAddPane(parentProperty, editNode, dropType, wrapperType);
            });
        } else {
            // set*Pane override methods above will remove the instruction pane as needed
            // Wrap ResizeBar in VLayout if dropping into an empty pane
            var wrapperType = (dropType == "LayoutResizeBar" ? "VLayout" : null);
            this.finishAddPane(parentProperty, editNode, dropType, wrapperType);
        }
    },

    _paneNames: ["navigationPane", "listPane", "detailPane"],
    getDropParentProperty : function () {
        for (var i = 0; i < this._paneNames.length; i++) {
            var paneName = this._paneNames[i],
                pane = this.creator[paneName]
            ;
            // listPane is not applicable for SplitPane - only TriplePane
            if (!this.isTriplePane && paneName == "listPane") continue;

            if (!pane || pane._instructionPane) {
                return paneName;
            }
        }
    },

    // Instruction panes

    paneDefaults : {
        _constructor: "VLayout",
        align: "center",
        showDropLines: false,
        padding: 30,
        membersMargin: 5,
        overflow: "hidden"
    },

    paneHeaderDefaults: {
        _constructor: "Label",
        autoDraw: false,
        height: 10,
        align: "center",
        styleName: "instructionsHeader"
    },

    paneExistingComponentDefaults: {
        _constructor: "Label",
        autoDraw: false,
        height: 10,
        align: "center",
        styleName: "instructionsComponent"
    },

    paneInstructionsDefaults: {
        _constructor: "Label",
        autoDraw: false,
        height: 10,
        align: "center",
        styleName: "instructionsText"
    },

    paneImageDefaults: {
        _constructor: "Img",
        autoDraw: false,
        layoutAlign: "center",
    
        overflow:"hidden",

    
        // Explicitly size the image to fit the available space while maintaining the 
        // desired ratio
        redrawOnResize:true,
        imageType:"center",
        getInnerHTML : function () {
            if (this._imageRatio == null) {
                // maxWidth/height were passed in as the native image dimensions
                // the layout code will avoid resizing larger than that, but we can
                // also use it to determine the ratio to maintain
                this._imageRatio = this.maxHeight / this.maxWidth;
            }
            var width = this.width,
                height = this.height,
                targetWidth = width,
                targetHeight = Math.floor(width * this._imageRatio);
            if (targetHeight > height) {
                targetHeight = height;
                targetWidth = Math.floor(height / this._imageRatio);
            }
            this.imageWidth = targetWidth;
            this.imageHeight = targetHeight;

            return this.Super("getInnerHTML", arguments);
        }
    },

    paneToolStripSpacerDefaults: {
        _constructor: "LayoutSpacer",
        height: 30
    },

    _paneDetails: {
        navigationPane: {
            showResizeBar: true,
            text: "Typically contains a TreeGrid or ListGrid that updates data " +
                  "in other panes when clicked.",
            imageSrc: "SplitPane_navigationPane.png",
            imageHeight: 230,
            imageWidth: 310
        },
        listPane: {
            showResizeBar: true,
            text: "Usually contains a ListGrid which is updated based on " +
                  "selections in the navigation pane.",
            imageSrc: "SplitPane_listPane.png",
            imageHeight: 195,
            imageWidth: 296
        },
        detailPane: {
            text: "Add new records, or view / update those selected in the ${detailListPane} " +
                  "by adding a DetailGrid or TableLayoutForm.",
            imageSrc: "SplitPane_detailPane.png",
            imageHeight: 170,
            imageWidth: 370
        }
    },

    createInstructionPane : function (width, title, parentProperty, detailListPane, showToolStripSpacer) {
        var paneDetails = this._paneDetails[parentProperty];

        var pane = this.createAutoChild("pane", {
            _instructionPane: true,
            width: width,
            name: title,
            canAcceptDrop: true,
            parentProperty: parentProperty,
            showResizeBar: (width != null ? paneDetails.showResizeBar : false),
            drop : function () {
                return this.creator.addPane(this.parentProperty);
            }
        });

        var paneHeader = pane.paneHeader = this.createAutoChild("paneHeader", {
            contents: this.getTitleSpan(title, false)
        });

        var paneExistingComponent = pane.paneExistingComponent = this.createAutoChild("paneExistingComponent", {
            visibility: "hidden"
        });

        var paneInstructions = this.createAutoChild("paneInstructions", {
            contents: paneDetails.text.evalDynamicString(null, { detailListPane: detailListPane })
        });

        var paneImage = this.createAutoChild("paneImage", {
            src: paneDetails.imageSrc,
            maxHeight: paneDetails.imageHeight,
            maxWidth: paneDetails.imageWidth,

            // Don't allow it to shrink small enough to be basically incomprehensible
            minHeight:50
        });

        // If showing a toolStrip spacer, add it to the top of the pane
        var toolStripSpacer;
        if (showToolStripSpacer) {
            // Grab pane's toolstrip header height. Assumption is that both list and detail
            // toolstrips are the same height.
            var toolStrip = this.creator.listToolStrip || this.creator.detailToolStrip,
                height = (toolStrip ? toolStrip.getVisibleHeight() : 0)
            ;
            if (height > 0) height -= pane.membersMargin;
            toolStripSpacer = this.createAutoChild("paneToolStripSpacer", {
                height: height
            });
        }

        pane.addMembers([toolStripSpacer, paneHeader, paneExistingComponent, paneInstructions, paneImage]);

        return pane;
    },

    getTitleSpan : function (title, over) {
        var titleStyle = (over ? "style='color:#0000ff'" : ""),
            span = "<span " + titleStyle + ">" + title + "</span>"
        ;
        return span;
    },

    dropOverlayDefaults: {

        backgroundColor: "white",
        visibility: "hidden",
        width: "100%",
        height: "100%",

        initWidget : function () {
            this.Super("initWidget", arguments);

            // Create drop panes. For a TriplePane all 3 panes are shown but for a
            // SplitPane just show the nav and detail panes
            this._panes = [];
            var detailListPane = (this.isTriplePane ? "List Pane" : "Navigation Pane");
            if (this.showNavPane != false) {
                this.navPane = this.creator.createInstructionPane("40%", "Navigation Pane", "navigationPane");
                this._panes.add(this.navPane);
            } else {
                this.navPane = isc.Canvas.create({ height: 1, width: "40%", border: "1px solid red", showResizeBar: true });
                this._panes.add(this.navPane);
            }
            if (this.showDetailPane != false) {
                this.detailPane = this.creator.createInstructionPane("100%", "Detail Pane", "detailPane", detailListPane, true);
                this._panes.add(this.detailPane);
            }

            var rightPaneMembers = [this.detailPane];
            if (this.isTriplePane) {
                this.listPane = this.creator.createInstructionPane("100%", "List Pane", "listPane", null, true);
                rightPaneMembers.addAt(this.listPane, 0);
                this._panes.add(this.listPane);
            }

            var rightLayout = isc.VLayout.create({
                width: "60%",
                members: rightPaneMembers
            });
            this.addChild(isc.HLayout.create({
                width: "100%",
                height: "100%",
                members: [ this.navPane, rightLayout ]
            }));
        },

        updatePane : function (pane, over) {
            if (pane.paneHeader) {
                pane.paneHeader.setContents(this.creator.getTitleSpan(pane.name, over));
            }
            if (pane.paneExistingComponent) {
                var existingComponent = this.getPaneComponent(pane);
                pane.paneExistingComponent.setContents(existingComponent);
                if (!existingComponent) pane.paneExistingComponent.hide();
                else pane.paneExistingComponent.show();
            }
        },

        getPaneComponent : function (pane) {
            var editProxy = this.creator,
                liveObject = editProxy.creator,
                component = liveObject[pane.parentProperty],
                text = null;
    		;
            if (component && !component._instructionPane) {
                var label = (this.editContext.getSelectedLabelText
                                ? this.editContext.getSelectedLabelText(component)
                                : component.toString());
                text = "Currently: " + label;
            }
            return text;
        },

        canAcceptDrop: true,
        drop : function () {
            
            if (this._dropOutPane) {
                this.creator.addPane(this._dropOutPane.parentProperty);
            }
            return isc.EH.STOP_BUBBLING;
        },
        dropMove : function () {
            var dropPane,
                x = isc.EH.getX(),
                y = isc.EH.getY()
            ;
            for (var i = 0; i < this._panes.length; i++) {
                if (this._panes[i].containsPoint(x, y)) {
                    dropPane = this._panes[i];
                    break;
                }
            }
            if (!this._lastDropPane || this._lastDropPane != dropPane) {
                if (this._lastDropPane && this._lastDropPane != dropPane) {
                    this.updatePane(this._lastDropPane, false);
                }
                if (dropPane) {
                    this.updatePane(dropPane, true);
                }

                this._lastDropPane = dropPane;
            }
            return isc.EH.STOP_BUBBLING;
        },
        dropOver : function () {
            this._dropOutPane = null;
        },
        dropOut : function () {
            
            var dropPane,
                x = isc.EH.getX(),
                y = isc.EH.getY()
            ;
            for (var i = 0; i < this._panes.length; i++) {
                if (this._panes[i].containsPoint(x, y)) {
                    dropPane = this._panes[i];
                    break;
                }
            }
            this._dropOutPane = dropPane;

            this.hide();

            return isc.EH.STOP_BUBBLING;
        },

        show : function () {
            this.Super("show", arguments);
            delete this._lastDropPane;
            for (var i = 0; i < this._panes.length; i++) {
                var pane = this._panes[i];
                this.updatePane(pane, false);
            }
        },

        draw : function () {
            this.Super("draw", arguments);

            // stay above the parent
            if (!this.isObserving(this.creator.creator, "setZIndex")) {
                this.observe(this.creator.creator, "setZIndex", "observer.moveAbove(observed)");
            }

            return this;
        },

        matchPaneSizes : function () {
            var master = this.creator.creator;
            if (master) {
                if (master.navigationPane) this.navPane.setWidth(master.navigationPane.getVisibleWidth());
                if (master.listPane) {
                    var toolStripHeight = (master.listToolStrip ? master.listToolStrip.getVisibleHeight() : 0);
                    this.listPane.setHeight(toolStripHeight + master.listPane.getVisibleHeight());
                } else if (master.detailPane) {
                    var toolStripHeight = (master.detailToolStrip ? master.detailToolStrip.getVisibleHeight() : 0);
                    this.detailPane.setHeight(toolStripHeight + master.detailPane.getVisibleHeight());
                }
            }
        },

        // Event Bubbling
        // ---------------------------------------------------------------------------------------

        // XXX FIXME: this is here to maintain z-order on dragReposition.  EH.handleDragStop()
        // brings the mask to the front when we stop dragging - which is not what we want, so we
        // suppress it here.
        bringToFront : function () { },
    
        // When showing the overlay it needs to be brought to the front of all other children.
        // If not, the resize bar in the component may bleed through if manually moved.
        _bringToFront : function () {
            this.Super("bringToFront", arguments);
        },

        // Resize
        // ---------------------------------------------------------------------------------------

        resized : function() {
            this.Super("resized", arguments);

            var master = this.creator.creator;
            if (master) {
                // the widget we're masking may overflow, so redraw if necessary to get new size so,
                // and match its overflow'd size
                master.redrawIfDirty();
                this.resizeTo(master.getVisibleWidth(), master.getVisibleHeight());
            }
        }
    },

    showDropOverlay : function (show) {
        if (show) {
            var liveObject = this.creator;
            if (!this._dropOverlay) {
                var props = isc.addProperties({}, this.dropOverlayDefaults, this.dropOverlayProperties, {
                    editContext: liveObject.editContext,
                    creator: this,
                    isTriplePane: this.isTriplePane
                });
                this._dropOverlay = isc.Canvas.create(props);
                liveObject.addChild(this._dropOverlay);
            }
            this._dropOverlay.matchPaneSizes();
            this._dropOverlay._bringToFront();
            this._dropOverlay.show();
        } else if (this._dropOverlay) {
            this._dropOverlay.hide();
        }
    },

    addPane : function (parentProperty) {
        this.creator.hideDropLine();

        var source = isc.EH.dragTarget,
            paletteNode = source.transferDragData()
        ;
        if (isc.isAn.Array(paletteNode)) paletteNode = paletteNode[0];

        // If node is dropped from a tree, clean it of internal properties
        if (source.isA("TreePalette")) {
            paletteNode = source.data.getCleanNodeData([paletteNode], false, false, false)[0];
        } else {
            // Palette node could be modified later if there are palettized components within.
            // Copy it now so that future drops are not affected.
            paletteNode = isc.clone(paletteNode);
        }

        // Prevent adding a pane for a drop that isn't a canvas
        if (paletteNode) {
            var dropType = paletteNode.type || paletteNode.className;
            var clazz = isc.ClassFactory.getClass(dropType);
            if (!isc.isA.Canvas(clazz)) paletteNode = null;
        }

        // completeDrop is called to process the drop from here and from an EditTree folder drop
        if (paletteNode) this.completeDrop(paletteNode, { parentProperty: parentProperty });
        return isc.EH.STOP_BUBBLING;
    },

    // Drop always positions node at the end but we want them to always show in the
    // "targetPositions" order below. Reorder new node to maintain this desired
    // order. Note that on screen re-load the order is as defined in the
    // SplitPane schema so the corresponding fields there must also be in this
    // order.
    _targetPositions: {
        "navigationPane": 0,
        "listPane"      : 1,
        "detailPane"    : 2
    },

    finishAddPane : function (parentProperty, editNode, dropType, wrapperType) {
        var liveObject = this.creator,
            editContext = liveObject.editContext
        ;

        // Establish the actual drop node (this may not be the canvas accepting the drop - for a
        // composite component like TabSet, the dropped-on canvas will be the tabBar or 
        // paneContainer)
        var dropTargetNode = this.findEditNode(dropType);
        if (dropTargetNode) {
            dropTargetNode = dropTargetNode.editNode;
        }

        // dropTargetNode is the SplitPane
        // parentProperty identifies the pane
        // wrapperType [null, VLayout, HLayout] specifies the desired wrapper

        // If the editNode is an existing component being reparented, remove it from
        // it's original location. A new editNode that does not yet exist in the tree
        // will be ignore.
        editContext.removeNode(editNode);

        // Determine targetPosition for drop node
        var data = editContext.getEditNodeTree(),
            children = data.getChildren(dropTargetNode),
            targetPosition = this._targetPositions[parentProperty],
            dropIndex = liveObject.getDropPosition(dropType)
        ;

        // By default the parentNode of our drop is the dropTarget unless a wrapper is applied
        var parentNode = dropTargetNode,
            wrapperNode
        ;

        if (wrapperType != null) {
            // Wrapping existing component and new editNode with a "wrapperType" container.
            // Wrapper could also be used to place a VLayout around a LayoutResizeBar drop
            // but there won't be an existing component in that case.

            // Remove existing component from editTree (if any)
            var existingComponent = isc.DS.getChildObject(liveObject, "Canvas", null, parentProperty),
                existingNode,
                index
            ;
            if (existingComponent && existingComponent._instructionPane) existingComponent = null;

            if (existingComponent) {
                existingNode = existingComponent.editNode;
                index = children.indexOf(existingComponent.editNode);

                editContext.removeNode(existingNode, null, true);

                // Reset user sizes on component so wrapper layout can perform clean layout
                if (existingComponent.updateUserSize) {
                    existingComponent.updateUserSize(null, existingComponent._$width);
                    existingComponent.updateUserSize(null, existingComponent._$height);
                }

                // Remove reference to parentProperty from existing node so it isn't used to
                // add to new wrapper parent
                if (existingNode.defaults) delete existingNode.defaults.parentProperty;
            }

            // Create new wrapper for wrapperType
            var paletteNode = {
                type: wrapperType,
                defaults : { _constructor: wrapperType },
                parentProperty: parentProperty
            };
            wrapperNode = editContext.makeEditNode(paletteNode);

            // add the wrapper to the parent
            editContext.addNode(wrapperNode, parentNode, index, parentProperty, null, null, true);

            // add the existing component node to the wrapper
            if (existingComponent) {
                editContext.addNode(existingNode, wrapperNode);
            }

            // Addition of actual dropped component goes into wrapperNode.
            // And parentProperty is no longer needed.
            parentNode = wrapperNode;
            parentProperty = null;
            dropIndex = null;

            // Remove reference to parentProperty from new node so it isn't used to
            // add to new wrapper parent
            if (editNode.defaults) delete editNode.defaults.parentProperty;
        }

        // modifyEditNode() is a late-modify hook for components with unusual drop requirements
        // that don't fit in with the normal scheme of things (SectionStack only, as of August 09).
        // This method can be used to modify the editNode that is going to be the parent - or 
        // replace it with a whole different one 
        if (this.modifyEditNode) {
            parentNode = this.modifyEditNode(editNode, parentNode, dropType);
            if (!parentNode) return;
        }

        var nodeAdded;
        var clazz = isc.ClassFactory.getClass(dropType);
        if (clazz && clazz.isA("FormItem")) {
            // Create a wrapper form to allow the FormItem to be added to this Canvas
            nodeAdded = editContext.addWithWrapper(editNode, parentNode, null, parentProperty);
        } else if (clazz && clazz.isA("DrawItem")) {
            // Create a wrapper form to allow the DrawItem to be added to this Canvas
            nodeAdded = editContext.addWithWrapper(editNode, parentNode, null, parentProperty, true);
        } else {
            nodeAdded = editContext.addNode(editNode, parentNode,
                    dropIndex, parentProperty);
        }
        if (nodeAdded != null) {
            var paneNode = wrapperNode || nodeAdded;

            // Reorder new node to maintain this desired order.
            if (targetPosition != null) {
                // Find current position
                var currentPosition = null;
                for (var i = 0; i < children.length; i++) {
                    var childNode = children[i];
                    if (childNode == paneNode) {
                        currentPosition = i;
                        break;
                    }
                }
                // Reorder node into correct position if needed
                if (currentPosition != null) {
                    var targetChild = children[targetPosition];
                    if (targetChild != paneNode) {
                        editContext.reorderNode(dropTargetNode, currentPosition, targetPosition);
                    }
                }
            }

            // Fire "event"
            if (editNode.liveObject.editProxy && editNode.liveObject.editProxy.nodeDropped) {
                editNode.liveObject.editProxy.nodeDropped(paneNode, parentNode);
            }
        }
    },

    getChildNodeDescription : function (node) {
        var liveObject = this.creator,
            pane = node.liveObject
        ;
        if (liveObject.navigationPane == pane) return "[Navigation Pane]";
        else if (liveObject.listPane == pane) return "[List Pane]";
        else if (liveObject.detailPane == pane) return "[Detail Pane]";
    },

    // Component editor handling
    // ---------------------------------------------------------------------------------------

    supportsInlineEdit: false
});    

//Edit Proxy for NavPanel
//-------------------------------------------------------------------------------------------
isc.defineClass("NavPanelEditProxy", "LayoutEditProxy").addMethods({

    setEditMode : function (editingOn) {
        this.Super("setEditMode", arguments);

        var navPanel = this.creator,
            navGrid = navPanel.navGrid
        ;

        if (editingOn) {
            var overrideProperties = {
                canAcceptDroppedRecords: true,
                canDragRecordsOut: true,
                canReorderRecords: false,
                canReparentNodes: false,
                canDropOnLeaves: true,
                onFolderDrop: this.onFolderDrop,
                dragDataAction: "copy",
                showOpenIcons: true,
                showDropIcons: true
            };
            navGrid.saveToOriginalValues(isc.getKeys(overrideProperties));
            navGrid.setProperties(overrideProperties);
        } else {
            navGrid.restoreFromOriginalValues([
                "canAcceptDroppedRecords",
                "canDragRecordsOut",
                "canReorderRecords",
                "canReparentNodes",
                "canDropOnLeaves",
                "onFolderDrop",
                "dragDataAction",
                "showOpenIcons",
                "showDropIcons"
            ]);
            this.removeInstructionPanes();
            navPanel.refreshData();
        }
        navGrid._setUpDragProperties();
    },

    getOverrideProperties : function () {
        var properties = this.Super("getOverrideProperties", arguments);

        properties = isc.addProperties({}, properties, {
            // Override method to insert instruction panes into empty NavItems
            _processTreeAndReturnNavItemsPanes: this._processTreeAndReturnNavItemsPanes
        });
        return properties;
    },

    // override for NavPanel._processTreeAndReturnNavItemsPanes applied by getOverrideProperties.
    // Add instruction panes to NavItems that have no pane.
    _processTreeAndReturnNavItemsPanes : function (items) {
        // this => NavPanel
        var origFunc = this.getOriginalValue("_processTreeAndReturnNavItemsPanes");
        var panes =  origFunc.apply(this, [items]);

        // If not in editMode, return panes as-is
        if (!this.editingOn) return panes;

        // Add instruction panes for NavItems without a pane
        var items = isc.NavPanel._flattenNavItemTree(items);
        for (var i = 0, numItems = items.length; i < numItems; ++i) {
            var item = items[i];
            if (item.isSeparator || item.canSelect == false) continue;

            if (!item.pane) {
                var pane = this.editProxy.createInstructionPane(null, "Components", "detailPane");
                panes.add(pane);
                item.pane = pane;
            }
        }
        return panes;
    },

    // Remove instruction panes from NavItems
    removeInstructionPanes : function () {
        var items = isc.NavPanel._flattenNavItemTree(this.creator.navItems);
        for (var i = 0, numItems = items.length; i < numItems; ++i) {
            var item = items[i];
            if (item.isSeparator || item.canSelect == false) continue;
            var pane = item.pane;

            if (pane && pane._instructionPane) {
                item.pane = null;
                pane.markForDestroy();
            }
        }
    },

    loadComplete : function () {
        // Called after a screen is completely loaded and after a NavPanel is dropped into
        // a screen.
        var navPanel = this.creator,
            hasNavItems = (navPanel.navItems && navPanel.navItems.length > 0)
        ;
        if (!hasNavItems) {
            var pane = this.createInstructionPane(null, "NavPanel", "navigationPane");
            // Original navigationPane is also referenced as navGrid so no need to save it
            navPanel.setNavigationPane(pane);
        }
    },

    onFolderDrop: function (draggedNodes, folder, targetIndex, dropPosition, sourceWidget) {
        var liveObject = this.creator;
        var editContext = folder.editContext || liveObject.editContext;
        var editNode = folder.editNode || liveObject.editNode;
        var dropType = draggedNodes[0].type;

        // If the dropType is null/undefined (this indicates that a live object is being dropped
        // rather than a palette node), then return early so that we do not crash.
        if (dropType == null) return;

        // If showing navGrid instructions, remove them now since we have a drop
        if (liveObject.navigationPane != liveObject.navGrid) {
            var instructionPane = liveObject.navigationPane;
            liveObject.setNavigationPane(liveObject.navGrid);
            instructionPane.markForDestroy();
        }

        // If a non-NavItem is dropped into tree and dropPosition isn't "over" convert it to
        // "over". To insert a folder into the tree where desired, the user should drop
        // a NavItem directly.
        if (dropType != "NavItem" && dropType != "NavSeparator" && dropType != "NavHeader" &&
            editNode.type == "NavItem" &&
            (dropPosition == "before" || dropPosition == "after"))
        {
            dropPosition = "over";
        }

        var addedNavItemNode;
        if (dropPosition == "after" && editNode.type == "NavPanel") {
            // If the user drops a NavItem node over the blank area of the navGrid, then create
            // a new NavItem.
            if (dropType == "NavItem") {
                addedNavItemNode = editContext.addFromPaletteNode(draggedNodes[0], editNode, targetIndex);

            // If the user drops a widget node over the blank area of the navGrid, then implicitly
            // create a new NavItem whose pane is the widget created from the dropped widget node.
            } else {
                var navItemNode = editContext.findPaletteNode("type", "NavItem")
                var innerNode = editContext.addFromPaletteNode(navItemNode, editNode, targetIndex);
                addedNavItemNode = innerNode;

                var itemPaneNode = null;

                // Wrap ResizeBar in VLayout if dropping into an empty pane
                if (dropType == "LayoutResizeBar") {
                    var paletteNode = {
                        type: "VLayout",
                        defaults : { _constructor: "VLayout" }
                    };
                    itemPaneNode = innerNode = editContext.addFromPaletteNode(paletteNode, innerNode);
                }

                var droppedNode = addedNavItemNode.liveObject.editContext.addFromPaletteNode(draggedNodes[0], innerNode);
                if (!itemPaneNode) itemPaneNode = droppedNode;
            }
        } else {
            var parentNode = editNode;
            if (dropPosition == "before") {
                // Dropping "before" the target node allows an insert into the tree
                var tree = editContext.getEditNodeTree();
                parentNode = tree.getParent(editNode);

                var siblings = tree.getChildren(parentNode);
                targetIndex = siblings.findIndex("ID", editNode.ID);
            }

            // If the user drops a NavItem node, then create a new NavItem where the NavItem
            // node was dropped.
            if (dropType == "NavItem") {
                addedNavItemNode = editContext.addFromPaletteNode(draggedNodes[0], parentNode, targetIndex);

            // If the user drops a widget node onto a header NavItem, then implicitly create a
            // new NavItem whose pane is the widget created from the dropped widget node.
            // This makes sense because a header NavItem cannot itself have a pane.
            
            } else if (folder == this.creator.navGrid.data.getRoot() || parentNode.liveObject.isHeader) {

                var navItemNode = editContext.findPaletteNode("type", "NavItem")
                var innerNode = editContext.addFromPaletteNode(navItemNode, parentNode, targetIndex);
                addedNavItemNode = innerNode;

                var itemPaneNode = null;

                // Wrap ResizeBar in VLayout if dropping into an empty pane
                if (dropType == "LayoutResizeBar") {
                    var paletteNode = {
                        type: "VLayout",
                        defaults : { _constructor: "VLayout" }
                    };
                    itemPaneNode = innerNode = editContext.addFromPaletteNode(paletteNode, innerNode);
                }

                var droppedNode = addedNavItemNode.liveObject.editContext.addFromPaletteNode(draggedNodes[0], innerNode);
                if (!itemPaneNode) itemPaneNode = droppedNode;

            // Otherwise, create a widget from the dropped node (presumably a widget node) and
            // set the item pane of whichever NavItem onto which the node was dropped.
            } else {

                var existingComponent = isc.DS.getChildObject(parentNode.liveObject, "Canvas"),
                    editProxy = this.creator.editProxy
                ;
                var finishAdd = function (dropNode, parentNode, targetIndex, paneNode) {
                    var nodeType = dropNode.type || dropNode.class,
                        clazz = isc.ClassFactory.getClass(nodeType),
                        itemPaneNode
                    ;
                    if (clazz && (clazz.isA("FormItem") || clazz.isA("DrawItem"))) {
                        var editNode = editContext.makeEditNode(dropNode),
                            itemNode
                        ;
                        if (clazz && clazz.isA("FormItem")) {
                            itemNode = editContext.addWithWrapper(editNode, parentNode, targetIndex, null, null);
                        } else {
                            itemNode = editContext.addWithWrapper(editNode, parentNode, targetIndex, null, true);
                        }
                        var tree = editContext.getEditNodeTree(),
                            parent = tree.getParent(itemNode)
                        ;
                        if (parent) itemPaneNode = parent;
                    } else {
                        itemPaneNode = editContext.addFromPaletteNode(dropNode, parentNode, targetIndex);
                    }
                    if (!paneNode) paneNode = itemPaneNode;
                    liveObject.setCurrentItem(folder);
                };
                // By default a new component dropped onto a NavItem is placed at index 0
                // so it shows before any sub-items
                targetIndex = 0;

                // Drop NavItem pane if it is an instruction pane
                if (existingComponent && existingComponent._instructionPane) {
                    liveObject.setItemPane(folder, null);
                    existingComponent = null;
                }

                if (existingComponent) {
                    var droppedNode = draggedNodes[0];
                    editProxy.confirmReplaceComponent(existingComponent.editNode, droppedNode, function (wrapperType) {
                        // Wrap existing component if specified
                        var paneNode = null;
                        // Wrap ResizeBar in VLayout if replacing existing component
                        if (!wrapperType && dropType == "LayoutResizeBar") wrapperType = "VLayout";
                        if (wrapperType) {
                            parentNode = paneNode = editProxy.wrapExistingComponent(existingComponent.editNode, wrapperType);
                            // Add at default position within wrapper
                            targetIndex = null;
                        }
                        finishAdd(droppedNode, parentNode, targetIndex, paneNode);
                    });
                } else {
                    // Wrap ResizeBar in VLayout if dropping into an empty pane
                    if (dropType == "LayoutResizeBar") {
                        var wrapperType = "VLayout";
                        parentNode = paneNode = editProxy.wrapExistingComponent(existingComponent.editNode, wrapperType);
                        // Add at default position within wrapper
                        targetIndex = null;
                    }
                    finishAdd(draggedNodes[0], parentNode, targetIndex);
                }
            }
        }

        // Select and start inline editing of any new non-separator NavItem.
        if (addedNavItemNode != null) {
            var addedNavItem = addedNavItemNode.liveObject;
            isc.addProperties(addedNavItem, {
                _panel: liveObject,
                addPane : function (pane) {
                    this._panel.setItemPane(addedNavItem, pane);
                }
            });
            if (!addedNavItem.isSeparator) {
                liveObject.setCurrentItem(addedNavItem);
                liveObject.editProxy.delayCall("startItemInlineEditing", [addedNavItem, liveObject.navGrid.getRecordIndex(addedNavItem)]);
            }
        }

        return false;
    },

    // override of EditProxy.canAddNode
    // - Don't allow a NavItem to be dropped outside the NavGrid
    // - Don't allow any non-NavItem drop in the component tree
    canAddNode : function (dragType, dragTarget, dragData, dropOnFolder) {
        var canAdd = this.Super("canAddNode", arguments);

        // Don't allow a NavItem to be dropped outside the NavGrid
        if (canAdd && !dropOnFolder && dragType == "NavItem" &&
            !this.creator.navigationPane.containsEvent())
        {
            canAdd = null;
        }

        // Don't allow any non-NavItem drop in the component tree
        if (dropOnFolder && dragType != "NavItem") canAdd = false;

        return canAdd;
    },

    // override of EditProxy.completeDrop
    // - adjust drop position
    completeDrop : function (paletteNode, settings, callback) {
        var liveObject = this.creator,
            editContext = liveObject.editContext,
            parentNode = liveObject.editNode
        ;
        // Unwrap settings
        var index = (settings ? settings.index : 0);
    
        var tree = editContext.getEditNodeTree(),
            siblings = tree.getChildren(parentNode),
            folder = parentNode,
            targetIndex = index,
            dropPosition = "over"
        ;

        if (index < siblings.length) {
            folder = siblings[index];
        } else {
            dropPosition = "after";
        }
        this.onFolderDrop([paletteNode], folder, targetIndex, dropPosition);
    },

    drop : function () {
        if (this.shouldPassDropThrough()) {
            return;
        }

        var liveObject = this.creator,
            source = isc.EH.dragTarget,
            paletteNode
        ;

        if (!source.isA("Palette")) {
            if (source.isA("FormItemProxyCanvas")) {
                source = source.formItem;
            }
        } else {
            paletteNode = source.transferDragData();
            if (isc.isAn.Array(paletteNode)) paletteNode = paletteNode[0];
            paletteNode.dropped = true;
        }

        // If node is dropped from a tree, clean it of internal properties
        if (source.isA("TreePalette")) {
            paletteNode = source.data.getCleanNodeData([paletteNode], false, false, false)[0];
        }

        // Palette node could be modified later if there are palettized components within.
        // Copy it now so that future drops are not affected.
        paletteNode = isc.clone(paletteNode);

        // if the source isn't a Palette, we're drag/dropping an existing component, so remove the 
        // existing component and re-create it in its new position
        if (!source.isA("Palette")) {
            if (source == liveObject) return;  // Can't drop a component onto itself
            liveObject.editContext.removeNode(source.editNode);
        }
        
        var folder = this.creator.navGrid.getSelectedRecord();
        if (folder == null) {
            folder = this.creator.navGrid.data.getRoot();
        }
        this.onFolderDrop([paletteNode], folder, 0, "over");

        return isc.EH.STOP_BUBBLING;
    },

    dropOut : function () {
        this.showSelectedAppearance(false);
    },

    dropMove : function () {
        if (!this.willAcceptDrop()) return false;
        if(this.creator.hideDropLine) this.creator.hideDropLine();
        if (!this.shouldPassDropThrough()) {
            return isc.EH.STOP_BUBBLING;
        }
    },

    // Instruction panes
    // ---------------------------------------------------------------------------------------
    

    paneDefaults : {
        _constructor: "VLayout",
        align: "center",
        showDropLines: false,
        padding: 30,
        membersMargin: 5,
        overflow: "hidden"
    },

    paneHeaderDefaults: {
        _constructor: "Label",
        autoDraw: false,
        height: 10,
        align: "center",
        styleName: "instructionsHeader"
    },

    paneExistingComponentDefaults: {
        _constructor: "Label",
        autoDraw: false,
        height: 10,
        align: "center",
        styleName: "instructionsComponent"
    },

    paneInstructionsDefaults: {
        _constructor: "Label",
        autoDraw: false,
        height: 10,
        align: "center",
        styleName: "instructionsText"
    },

    paneImageDefaults: {
        _constructor: "Img",
        autoDraw: false,
        layoutAlign: "center",
    
        overflow:"hidden",

        // Explicitly size the image to fit the available space while maintaining the 
        // desired ratio
        redrawOnResize:true,
        imageType:"center",
        getInnerHTML : function () {
            if (this._imageRatio == null) {
                // maxWidth/height were passed in as the native image dimensions
                // the layout code will avoid resizing larger than that, but we can
                // also use it to determine the ratio to maintain
                this._imageRatio = this.maxHeight / this.maxWidth;
            }
            var width = this.width,
                height = this.height,
                targetWidth = width,
                targetHeight = Math.floor(width * this._imageRatio);
            if (targetHeight > height) {
                targetHeight = height;
                targetWidth = Math.floor(height / this._imageRatio);
            }
            this.imageWidth = targetWidth;
            this.imageHeight = targetHeight;

            return this.Super("getInnerHTML", arguments);
        }
    },

    paneToolStripSpacerDefaults: {
        _constructor: "LayoutSpacer",
        height: 30
    },

    _paneDetails: {
        navigationPane: {
            text: "Drop NavItems, NavHeaders and NavSeparators to build the application navigation.",
            imageSrc: "SplitPane_navigationPane.png",
            imageHeight: 230,
            imageWidth: 310
        },
        detailPane: {
            text: "Drop components such as ListGrids and TableLayouts, etc. to be shown " +
                    "here when the corresponding NavPanel Item is selected in the left pane.",
            imageSrc: "SplitPane_detailPane.png",
            imageHeight: 170,
            imageWidth: 370
        }
    },

    createInstructionPane : function (width, title, parentProperty, detailListPane, showToolStripSpacer) {
        var paneDetails = this._paneDetails[parentProperty];

        var pane = this.createAutoChild("pane", {
            _instructionPane: true,
            width: width,
            name: title,
            canAcceptDrop: true,
            parentProperty: parentProperty,
            showResizeBar: (width != null ? paneDetails.showResizeBar : false)
        });

        var paneHeader = pane.paneHeader = this.createAutoChild("paneHeader", {
            contents: this.getTitleSpan(title, false)
        });

        var paneExistingComponent = pane.paneExistingComponent = this.createAutoChild("paneExistingComponent", {
            visibility: "hidden"
        });

        var paneInstructions = this.createAutoChild("paneInstructions", {
            contents: paneDetails.text.evalDynamicString(null, { detailListPane: detailListPane })
        });

        var paneImage = this.createAutoChild("paneImage", {
            src: paneDetails.imageSrc,
            maxHeight: paneDetails.imageHeight,
            maxWidth: paneDetails.imageWidth,

            // Don't allow it to shrink small enough to be basically incomprehensible
            minHeight:50
        });

        // If showing a toolStrip spacer, add it to the top of the pane
        var toolStripSpacer;
        if (showToolStripSpacer) {
            // Grab pane's toolstrip header height. Assumption is that both list and detail
            // toolstrips are the same height.
            var toolStrip = this.creator.listToolStrip || this.creator.detailToolStrip,
                height = (toolStrip ? toolStrip.getVisibleHeight() : 0)
            ;
            if (height > 0) height -= pane.membersMargin;
            toolStripSpacer = this.createAutoChild("paneToolStripSpacer", {
                height: height
            });
        }

        pane.addMembers([toolStripSpacer, paneHeader, paneExistingComponent, paneInstructions, paneImage]);

        return pane;
    },

    getTitleSpan : function (title, over) {
        var titleStyle = (over ? "style='color:#0000ff'" : ""),
            span = "<span " + titleStyle + ">" + title + "</span>"
        ;
        return span;
    },
    
    // Component editor handling
    // ---------------------------------------------------------------------------------------

    supportsInlineEdit: true,

    // inline editing will only be triggered programmatically
    inlineEditEvent: "none",

    startItemInlineEditing : function (navItem, recordNum) {
        this._inlineEditItem = navItem;
        this._inlineEditRecordNum = recordNum;
        this.startInlineEditing();
    },

    positionAndSizeInlineEditor : function () {
        var liveObject = this.creator,
            liveNavGrid = liveObject.navGrid,
            pageOffsets = liveNavGrid.getPageOffsets(),
            rowTop = liveNavGrid.getRowTop(this._inlineEditRecordNum),
            width = liveNavGrid.getVisibleWidth(),
            minWidth = this.inlineEditForm.minWidth || 1,
            height = liveNavGrid.getRowHeight(this._inlineEditItem, this._inlineEditRecordNum),
            minHeight = this.inlineEditForm.minHeight || 1;
        this.inlineEditLayout.setRect(pageOffsets.left,
                                      pageOffsets.top + rowTop,
                                      Math.max(minWidth, width),
                                      Math.max(minHeight, height));
    },

    getInlineEditText : function () {
        var inlineEditItem = this._inlineEditItem;
        if (inlineEditItem == null || inlineEditItem.title == null) return "";
        return inlineEditItem.title;
    },

    setInlineEditText : function (newValue) {
        var liveObject = this.creator;
        var editContext = liveObject.editContext;
        editContext.setNodeProperties(this._inlineEditItem.editNode, { title: newValue });

        // Redraw the navGrid body immediately so that the old title is not briefly visible.
        var liveNavGrid = liveObject.navGrid;
        if (liveNavGrid != null) {
            var liveNavGridBody = liveNavGrid.body;
            if (liveNavGridBody != null) liveNavGridBody.redrawIfDirty("setInlineEditText");
        }

        this.delayCall("selectNavItem", [this._inlineEditItem], 100);
    },

    selectNavItem : function (item) {
        var liveObject = this.creator;
        isc.EditContext.selectCanvasOrFormItem(liveObject);
        // Force reset of currentItem so navGrid shows correct selection
        if (liveObject.currentItem === item) liveObject.setCurrentItem(null);
        liveObject.setCurrentItem(item);
    }
});

//Edit Proxy for NavItem
//-------------------------------------------------------------------------------------------
isc.defineClass("NavItemEditProxy", "EditProxy").addMethods({
    // Explicitly define canSelect:true to indicate to editMode behaviors that this component
    // can be selected and showSelectedAppearance should be called. Normally only UI
    // components can be selected.
    canSelect: true,
    canSelectChildren: true,

    // override of EditProxy.canAddNode
    // - Don't allow a NavItem to be dropped into the NavGrid
    canAddNode : function (dragType, dragTarget, dragData, dropOnFolder) {
        var canAdd = this.Super("canAddNode", arguments);

        // Don't allow a NavItem to be dropped on another NavItem
        if (canAdd && (dragType == "NavItem" || dragType == "NavSeparator" || dragType == "NavHeader")) {
            canAdd = null;
        }

        return canAdd;
    },

    // override of EditProxy.completeDrop
    // - defer drop to NavPanel to allow combining components or replacing
    completeDrop : function (paletteNode, settings, callback) {
        var liveObject = this.creator,
            navPanel = liveObject.getNavPanel()
        ;
        navPanel.editProxy.onFolderDrop([paletteNode], liveObject, 0, "over");
    },

    showSelectedAppearance : function (show, hideLabel, showThumbsOrDragHandle) {
        var liveObject = this.creator;
        if (show) liveObject.selectNavItem();
        // Not really anything to do if no selected - leave last NavItem selected
    }
});

// Edit Proxy for TabSet
//-------------------------------------------------------------------------------------------

//> @class TabSetEditProxy
// +link{EditProxy} that handles +link{TabSet} objects when editMode is enabled.
//
// @inheritsFrom CanvasEditProxy
// @group devTools
// @treeLocation Client Reference/Tools/EditProxy
// @visibility external
//<
isc.defineClass("TabSetEditProxy", "CanvasEditProxy").addMethods({

    // Don't persist coordinates on tab panes
    persistCoordinates: false,
    inlineEditOnDrop: true,

    setEditMode : function(editingOn) {
        this.Super("setEditMode", arguments);

        // If we're going into edit mode, add close icons to every tab
        var liveObject = this.creator;
        if (editingOn) {
            for (var i = 0; i < liveObject.tabs.length; i++) {
                var tab = liveObject.tabs[i];
                this.saveTabProperties(tab);
            }
            liveObject.closeClick = function(tab) {
                // Suppress normal click behavior
            }
        } else {
            // If we're coming out of edit mode, revert to whatever was on the init data
            for (var i = 0; i < liveObject.tabs.length; i++) {
                var tab = liveObject.tabs[i];
                this.restoreTabProperties(tab);
            }
        }
        
        // Set edit mode on the TabBar and PaneContainer.  Note that we deliberately pass null as
        // the editNode - this allows the components to pick up the special editMode method 
        // overrides, but prevents them from actually being edited
        liveObject.tabBar.setEditMode(editingOn, liveObject.editContext, null);
        if (liveObject.paneContainer) liveObject.paneContainer.setEditMode(editingOn, liveObject.editContext, null);
    },

    getOverrideProperties : function () {
        var properties = this.Super("getOverrideProperties", arguments);
        // The TabSet updates the selectedTab property on tab change to indicate the
        // currently selected tab. That would also change our "initial" choice in the
        // editNode which isn't desired. By overriding this property with the current
        // value changes to this property in editMode will be saved until complete and
        // overwrite the current value producing the expected results.
        isc.addProperties(properties, { selectedTab: this.creator.selectedTab });
        return properties;
    },

    saveTabProperties : function (tab) {
        var liveTab = this.creator.getTab(tab);
        if (liveTab) {
            liveTab.saveToOriginalValues(["closeClick",
                                          "setDisabled",
                                          "getStateSuffix"]);
            if (liveTab.disabled) {
                liveTab.disabled = false;
                liveTab._saveDisabled = true;
                liveTab._saveGetStateSuffix = liveTab.getStateSuffix;
                liveTab.getStateSuffix = function() {
                    return "Disabled";
                }
            }
            liveTab.setDisabled = function(disabled) {
                // Do not actually disable the tab, just give it disabled appearance
                this.disabled = false;
                if (disabled) {
                    this._saveDisabled = true;
                    if (!this._saveGetStateSuffix) {
                        this._saveGetStateSuffix = this.getStateSuffix;
                    }
                    this.getStateSuffix = function() {
                        return "Disabled";
                    }
                    this.setState(isc.StatefulCanvas.STATE_DISABLED);
                } else {
                    delete this._saveDisabled;
                    this.getStateSuffix = this._saveGetStateSuffix;
                    this.setState(isc.StatefulCanvas.STATE_UP);
                }
            }
                                          
        }
    },

    restoreTabProperties : function (tab) {
        var liveTab = this.creator.getTab(tab);
        if (liveTab) {
            liveTab.restoreFromOriginalValues(["closeClick",
                                               "setDisabled",
                                               "getStateSuffix"]);
            // NOTE: We can't handle "disabled" via the original values system because doing so
            // inhibits live updates (you only see the effect of changing anything stored in 
            // original values when you switch back to Live mode)
            liveTab.setDisabled(liveTab._saveDisabled);
            delete liveTab._saveDisabled;
        }
    },

    // Component editor handling
    // ---------------------------------------------------------------------------------------

    inlineEditInstructions: "Enter tab titles (comma separated)",

    //> @method tabSetEditProxy.getInlineEditText()
    // Returns the text based on the current component state to be edited inline.
    // Called by the +link{editProxy.inlineEditForm} to obtain the starting edit value.
    // <p>
    // Returns a comma-separated list of tab titles. A " [x]" suffix is added
    // for any tab with <code>canClose</code> enabled.
    //
    // @visibility external
    //<
    getInlineEditText : function () {
        var liveObject = this.creator,
            tabs = liveObject.tabs,
            editText = null
        ;

        for (var i = 0; i < tabs.length; i++) {
            var title = tabs[i].title.replace(/,/, "\\,");

            editText = (editText ? editText + ", " : "") + title + (tabs[i].canClose ? " [x]" : "");
        }
        return editText;
    },
    
    //> @method tabSetEditProxy.setInlineEditText()
    // Save the new value into the component's state. Called by the
    // +link{editProxy.inlineEditForm} to commit the change.
    // <p>
    // Takes a comma-separated list of tab titles. Add " [x]" to a title
    // to enable <code>canClose</code> for the tab.
    //
    // @param newValue (String) the new component state
    //
    // @visibility external
    //<
    setInlineEditText : function (newValue) {
        var tabNames = isc.EditProxy.splitString(newValue, ",", "\\");

        // Determine which tabs allow closing
        var canClose = [];
        for (var i = 0; i < tabNames.length; i++) {
            if (tabNames[i].endsWith("[x]") || tabNames[i].endsWith("[X]")) {
                tabNames[i] = tabNames[i].replace(/\[[xX]\]/, "").replace(/\s+$/, "");
                canClose.add(tabNames[i]);
            }
        }

        // Remove tabs not in new title list
        // and update canClose on existing tabs
        var liveObject = this.creator,
            tabs = liveObject.tabs,
            nodesToRemove = [],
            existingTabNames = []
        ;
        if (tabs.length > 0) {
            for (var i = 0; i < tabs.length; i++) {
                if (!tabNames.contains(tabs[i].title)) {
                    nodesToRemove.add(tabs[i].editNode);
                } else if (tabNames.contains(tabs[i].title)) {
                    existingTabNames.add(tabs[i].title);
                    this.creator.editContext.setNodeProperties(tabs[i].editNode, { canClose: canClose.contains(tabs[i].title) });
                }
            }
        }

        nodesToRemove.map(function (node) { 
            liveObject.editContext.removeNode(node);
        });

        var editContext = this.creator.editContext,
            paletteNode = this.getNodePropertiesForType("Tab")
        ;

        // Add new tabs
        for (var i = 0; i < tabNames.length; i++) {
            if (existingTabNames.contains(tabNames[i])) continue;

            var nodeProperties = paletteNode || { type: "Tab" };
            nodeProperties.defaults = { title: tabNames[i] };

            this.creator.editContext.addNode(
                editContext.makeEditNode(nodeProperties),
                this.creator.editNode,
                i);
        }
    },

    getNodePropertiesForType : function (type) {
        var editContext = this.creator.editContext,
            palette = editContext.getDefaultPalette(),
            paletteNode
        ;
        if (palette && palette.findPaletteNode) {
            paletteNode = palette.findPaletteNode("type", type);
            if (paletteNode) paletteNode = isc.clone(paletteNode);
        }
        return paletteNode;
    },

    // Extra stuff to do when tabSet.addTabs() is called when the tabSet is in an editable context
    // (though not necessarily actually in editMode)
    addTabsEditModeExtras : function (newTabs) {
        // If the TabSet is in editMode, put the new tab(s) into edit mode too
        if (this.creator.editingOn) {
            for (var i = 0; i < newTabs.length; i++) {
                this.saveTabProperties(newTabs[i]);
            }
        }
    },

    // Extra stuff to do when tabSet.removeTabs() is called when the tabSet is in an editable 
    // context (though not necessarily actually in editMode)
    removeTabsEditModeExtras : function () { },

    //Extra stuff to do when tabSet.reorderTab() is called when the tabSet is in an editable 
    //context (though not necessarily actually in editMode)
    reorderTabsEditModeExtras : function (originalPosition, moveToPosition) {
        if (this.creator.editContext && this.creator.editContext.reorderNode) {
            this.creator.editContext.reorderNode(this.creator.editNode, originalPosition, moveToPosition);
        }
    },

    // Override of EditProxy.findEditNode.  If the item being dragged is a Tab, falls back to the 
    // Canvas impl (which will return the TabSet itself).  If the item being dragged is not a 
    // Tab, returns the currently selected Tab if it has an editNode, otherwise the first Tab 
    // with an editNode, otherwise returns the result of calling the parent element's 
    // findEditNode(), because this is a TabSet with no tabs in edit mode
    findEditNode : function (dragType) {
        this.logInfo("In TabSet.findEditNode, dragType is " + dragType, "editModeDragTarget");
        if (dragType != "Tab") {
            var tab = this.creator.getTab(this.creator.getSelectedTabNumber());
            if (tab && tab.editNode) return tab;
            for (var i = 0; i < this.creator.tabs.length; i++) {
                tab = this.creator.getTab(i);
                if (tab.editNode) return tab;
            }
            if (this.creator.parentElement && this.creator.parentElement.editProxy) {
                return this.creator.parentElement.editProxy.findEditNode(dragType);
            }
        }
        return this.Super("findEditNode", arguments);
    },

    // Override completeDrop() to initiate title editing
    completeDrop : function (paletteNode, settings, callback) {
        var liveObject = this.creator,
            editContext = liveObject.editContext
        ;

        // If dropping something other than a tab, make it the pane of a new tab
        var dropType = paletteNode.type || paletteNode.className;
        if (dropType != "Tab") {
            var tabPaletteNode = {
                type: "Tab",
                defaults : { _constructor: "Tab" }
            };
            var tabNode = editContext.makeEditNode(tabPaletteNode);
            tabNode = editContext.addNode(tabNode, liveObject.editNode, null, null, null, null, true);

            // add the dropped component node to the tab
            var editNode = editContext.makeEditNode(paletteNode);
            editContext.addNode(editNode, tabNode);
            return;
        }

        this.Super("completeDrop", [paletteNode, settings, function (editNode) {
            if (editNode && (editNode.type || editNode.className) == "Tab") {
                var targetComponent = editNode.liveObject;
                liveObject.selectTab(targetComponent);
                
                targetComponent.editProxy.delayCall("editTitle");
                if (callback) callback(editNode);
            }
        }]);
    }
});


isc.defineClass("TabBarEditProxy", "CanvasEditProxy").addMethods({

    // override of EditProxy.mouseDown
    // - suppress event bubbling
    mouseDown : function (event) {
        return isc.EH.STOP_BUBBLING;
    },

    // Drag/drop method overrides
    // ---------------------------------------------------------------------------------------

    // Potentially override dropOver, dropMove and dropOut to show target of drop:
    // items vs controls.

    // override of EditProxy.drop
    // - drop on right half of tabbar adds component as tabBarControl
    // - drop on left half adds component to parent layout if found
    drop : function () {
        var liveObject = this.creator,
            source = isc.EH.dragTarget,
            dragType
        ;
        if (!source.isA("Palette")) {
            // Ignore drop of existing nodes onto controls for now
            return isc.EH.STOP_BUBBLING;
        } else {
            var paletteNode = source.transferDragData();
            if (isc.isAn.Array(paletteNode)) paletteNode = paletteNode[0];
            dragType = paletteNode.type || paletteNode.className;
        }

        if (this.isDroppingIntoTabBarControls(dragType)) {
            // If node is dropped from a tree, clean it of internal properties
            if (source.isA("TreePalette")) {
                paletteNode = source.data.getCleanNodeData(paletteNode, false, false, false);
            } else {
                // Palette node could be modified later if there are palettized components within.
                // Copy it now so that future drops are not affected.
                paletteNode = isc.clone(paletteNode);
            }
    
            var newEditNode = liveObject.editContext.makeEditNode(paletteNode, liveObject.editNode);
            this.logWarn("### ADD AS CONTROL TO " + this.echo(liveObject));

            liveObject.editContext.addNode(newEditNode, liveObject.parentElement.editNode, null, "tabBarControls");
    
            return isc.EH.STOP_BUBBLING;
        }

        // If dropping a non-Tab component onto the tab bar, defer drop handling to the enclosing
        // layout. See findEditNode below for details.
        if (dragType != "Tab" && liveObject.parentElement &&
                isc.isA.Layout(liveObject.parentElement.parentElement) &&
                liveObject.parentElement.parentElement.editProxy)
        {
            return liveObject.parentElement.parentElement.editProxy.drop();
        }

        this.Super("drop", arguments);
    },

    // override of EditProxy.findEditNode
    // - special handling of target for drop position within tabbar
    findEditNode : function (dragType) {
        
        if (this.isDroppingIntoTabBarControls(dragType)) {
            return this.creator.parentElement.editNode;
        }
        if (dragType == "Tab") {
            // Delegate to the TabSet's findEditNode()
            return this.creator.parentElement.editProxy.findEditNode(dragType);
        } else if (this.creator.parentElement &&
            isc.isA.Layout(this.creator.parentElement.parentElement) &&
            this.creator.parentElement.parentElement.editProxy)
        {
            return this.creator.parentElement.parentElement.editProxy.findEditNode(dragType);
        }
        
        return this.Super("findEditNode", arguments);
    },

    isDroppingIntoTabBarControls : function (dragType) {
        // Consider the TabBar to be divided horizontally into half.
        // A drop in the right half is added to the "tabBarControls" where a drop
        // elsewhere is added to the normal "tabs" array. A "Tab" drop is always
        // considered *not* in controls.
        if (dragType == "Tab") return false;

        // use tabSet width instead of tabBar width because tabBar width does not include
        // any existing tabBarControls
        var liveObject = this.creator,
            left = liveObject.getPageLeft(),
            tabSetWidth = liveObject.parentElement.getVisibleWidth(),
            center = left + (tabSetWidth / 2),
            x = isc.EH.getX()
        ;
        return (x > center);
    },

    // Component editor handling
    // ---------------------------------------------------------------------------------------

    supportsInlineEdit: true,
    
    startInlineEditing : function () {
        var tabset = this.creator.parentElement;
        tabset.editProxy.startInlineEditing();
    }
});

//> @class StatefulCanvasEditProxy
// +link{EditProxy} that handles +link{StatefulCanvas} objects when editMode is enabled.
//
// @inheritsFrom CanvasEditProxy
// @group devTools
// @treeLocation Client Reference/Tools/EditProxy
// @visibility external
//<
isc.defineClass("StatefulCanvasEditProxy", "CanvasEditProxy").addMethods({

    inlineEditOnDrop: true,

    getOverrideProperties : function () {
        var properties = this.Super("getOverrideProperties", arguments);
        // Prevent a StatefulCanvas from accidentally allowing drops.
        // Also allows a parent snapGrid to be properly applied.
        delete properties.canAcceptDrop;
        delete properties.canDropComponents;
        // Prevent change to overflow. Main proxy marks overflow:"hidden" but that
        // will turn of autoFit for a button which doesn't match the normal operation.
        delete properties.overflow;
        return properties;
    },

    // override of EditProxy.mouseDown
    // - Allow live component to process mouseDown event via handleMouseDown
    mouseDown : function (event, eventInfo) {
        var result = this.Super("mouseDown", arguments);
        if (result == false) return result;

        var liveObject = this.creator;

        // In editMode allow stateful canvas to process mouseDown events so that special
        // media or styling can be applied during that state.
        if (liveObject.handleMouseDown) return liveObject.handleMouseDown(event, eventInfo);
    },

    // override of EditProxy.mouseUp
    // - Allow live component to process mouseUp event via handleMouseUp
    mouseUp : function (event, eventInfo) {
        var result = this.Super("mouseUp", arguments);
        if (result == false) return result;

        var liveObject = this.creator;

        // In editMode allow stateful canvas to process mouseUp events so that special
        // media or styling can be applied during the mouseDown state and restored.
        if (liveObject.handleMouseUp) return liveObject.handleMouseUp(event, eventInfo);
    },

    click : function (event, eventInfo) {
        var result = this.Super("click", arguments);

        
        if (this.creator.handleActivate) this.creator.handleActivate(event, eventInfo);
        return result;
    },

    getNodeDescription : function (node) {
        if (node.type == "Tab") {
            // A Tab is auto-assigned an ID but that doesn't match well with the
            // tab's title so use the title as additional description
            var liveObject = this.creator;
            return (liveObject.title ? "Tab: " + liveObject.title.asHTML() : null);
        }
    },

    completeReparent : function (reposition) {
        var liveObject = this.creator,
            dragTarget = liveObject.ns.EH.dragTarget
        ;

        // Cannot drop a component onto itself
        if (dragTarget == liveObject) return;

        var sourceNode = dragTarget.editNode;

        // When dropping a component onto a Tab button we offer to replace the existing
        // pane or modify it
        if (isc.isA.TabBar(liveObject.parentElement)) {
            var existingComponent = isc.DS.getChildObject(liveObject, "Canvas"),
                _this = this
            ;
            if (existingComponent) {
                this.confirmReplaceComponent(existingComponent.editNode, sourceNode, function (wrapperType) {
                    // "replace" is the normal operation - let superclass take care of it
                    if (!wrapperType) return _this.Super("completeReparent", [reposition,dragTarget]);

                    // Add wrapper and move existing component into wrapper
                    var wrapperNode = this.wrapExistingComponent(existingComponent.editNode, wrapperType);

                    // Complete the original drop using the wrapper EditProxy so all behaviors can be applied
                    return wrapperNode.liveObject.editProxy.completeReparent(reposition, dragTarget);
                });
                return;
            }
        }
        return this.Super("completeReparent", arguments);
    },

    completeDrop : function (paletteNode, settings, callback) {
        var liveObject = this.creator;

        // When dropping a component onto a Tab button we offer to replace the existing
        // pane or modify it
        if (isc.isA.TabBar(liveObject.parentElement)) {
            var existingComponent = isc.DS.getChildObject(liveObject, "Canvas");
            if (existingComponent) {
                var _this = this,
                    args = arguments
                ;
                this.confirmReplaceComponent(existingComponent.editNode, paletteNode, function (wrapperType) {
                    // "replace" is the normal operation - let superclass take care of it
                    if (!wrapperType) return _this.Super("completeDrop", args);

                    // Add wrapper and move existing component into wrapper
                    var wrapperNode = this.wrapExistingComponent(existingComponent.editNode, wrapperType);

                    // Complete the original drop using the wrapper EditProxy so all behaviors can be applied
                    return wrapperNode.liveObject.editProxy.completeDrop(paletteNode, settings, callback);
                });
                return;
            }
        }
        return this.Super("completeDrop", arguments);
    },

    // Component editor handling
    // ---------------------------------------------------------------------------------------

    //> @method statefulCanvasEditProxy.getInlineEditText()
    // Returns the text based on the current component state to be edited inline.
    // Called by the +link{editProxy.inlineEditForm} to obtain the starting edit value.
    // <p>
    // Returns the component's title.
    //
    // @visibility external
    //<
    getInlineEditText : function () {
        return this.creator.getTitle();
    },
    
    //> @method statefulCanvasEditProxy.setInlineEditText()
    // Save the new value into the component's state. Called by the
    // +link{editProxy.inlineEditForm} to commit the change.
    // <p>
    // Updates the component's title.
    //
    // @param newValue (String) the new component title
    //
    // @visibility external
    //<
    setInlineEditText : function (newValue) {
        var liveObject = this.creator;

        liveObject.editContext.setNodeProperties(liveObject.editNode, { title: newValue });
    }
});

//> @class ImgEditProxy
// +link{EditProxy} that handles +link{Img} objects when editMode is enabled.
//
// @inheritsFrom StatefulCanvasEditProxy
// @group devTools
// @treeLocation Client Reference/Tools/EditProxy
// @visibility external
//<
isc.defineClass("ImgEditProxy", "StatefulCanvasEditProxy").addProperties({
    supportsInlineEdit: false,
    inlineEditOnDrop: false
});

//> @class ToolStripSeparatorEditProxy
// +link{EditProxy} that handles +link{ToolStripSeparator} objects when editMode is enabled.
//
// @group devTools
// @treeLocation Client Reference/Tools/EditProxy
// @visibility external
//<
isc.defineClass("ToolStripSeparatorEditProxy", "ImgEditProxy").addMethods({
    inlineEditOnDrop: false,
    canSelectChildren: false
});

//> @class LabelEditProxy
// +link{EditProxy} that handles +link{Label} objects when editMode is enabled.
//
// @inheritsFrom StatefulCanvasEditProxy
// @group devTools
// @treeLocation Client Reference/Tools/EditProxy
// @visibility external
//<
isc.defineClass("LabelEditProxy", "StatefulCanvasEditProxy").addMethods({

    // Component editor handling
    // ---------------------------------------------------------------------------------------

    //> @method labelEditProxy.getInlineEditText()
    // Returns the text based on the current component state to be edited inline.
    // Called by the +link{editProxy.inlineEditForm} to obtain the starting edit value.
    // <p>
    // Returns the component's <code>contents</code>.
    //
    // @visibility external
    //<
    getInlineEditText : function () {
        return this.creator.getContents();
    },
    
    //> @method labelEditProxy.setInlineEditText()
    // Save the new value into the component's state. Called by the
    // +link{editProxy.inlineEditForm} to commit the change.
    // <p>
    // Updates the component's <code>contents</code>.
    //
    // @param newValue (String) the new component contents
    //
    // @visibility external
    //<
    setInlineEditText : function (newValue) {
        var liveObject = this.creator;

        liveObject.editContext.setNodeProperties(liveObject.editNode, { contents: newValue });
    }
});

//> @class HeaderEditProxy
// +link{HeaderEditProxy} that handles +link{Header} objects when editMode is enabled.
//
// @inheritsFrom LayoutEditProxy
// @group devTools
// @treeLocation Client Reference/Tools/EditProxy
// @visibility external
//<
isc.defineClass("HeaderEditProxy", "LayoutEditProxy").addMethods({

    // override of EditProxy.willAcceptDrop
    // - Disallow drop before the built-in header label
    
    willAcceptDrop : function () {
        var liveObject = this.creator,
            position = liveObject.getDropPosition()
        ;
        if (!isc.isA.Number(position) || position == 0) return null;

        return this.Super("willAcceptDrop", arguments);
    },

    // override - adjust drop position (liveIndex) to editNode index
    getDropPosition : function () {
        // liveIndex is the position within the layout members of the drop.
        // index is the position within the child nodes where the drop occurs.
        // Adjust index because title is always at liveIndex 0 but never shows in child nodes.
        var liveIndex = this.Super("getDropPosition", arguments),
            index = (liveIndex > 0 ? liveIndex-1 : liveIndex)
        ;
        return index;
    },

    // Component editor handling
    // ---------------------------------------------------------------------------------------

    supportsInlineEdit: true,
    inlineEditOnDrop: true,

    //> @method headerEditProxy.getInlineEditText()
    // Returns the text based on the current component state to be edited inline.
    // Called by the +link{editProxy.inlineEditForm} to obtain the starting edit value.
    // <p>
    // Returns the component's <code>title</code>.
    //
    // @visibility external
    //<
    getInlineEditText : function () {
        return this.creator.title;
    },
    
    //> @method headerEditProxy.setInlineEditText()
    // Save the new value into the component's state. Called by the
    // +link{editProxy.inlineEditForm} to commit the change.
    // <p>
    // Updates the component's <code>title</code>.
    //
    // @param newValue (String) the new component title
    //
    // @visibility external
    //<
    setInlineEditText : function (newValue) {
        var liveObject = this.creator;

        liveObject.editContext.setNodeProperties(liveObject.editNode, { title: newValue });
    }
});

//> @class ProgressbarEditProxy
// +link{EditProxy} that handles +link{Progressbar} objects when editMode is enabled.
//
// @inheritsFrom StatefulCanvasEditProxy
// @group devTools
// @treeLocation Client Reference/Tools/EditProxy
// @visibility external
//<
isc.defineClass("ProgressbarEditProxy", "StatefulCanvasEditProxy").addMethods({

    inlineEditOnDrop: false,

    // Component editor handling
    // ---------------------------------------------------------------------------------------

    //> @method progressbarEditProxy.getInlineEditText()
    // Returns the text based on the current component state to be edited inline.
    // Called by the +link{editProxy.inlineEditForm} to obtain the starting edit value.
    // <p>
    // Returns the component's <code>percentDone</code>.
    //
    // @visibility external
    //<
    getInlineEditText : function () {
        return (this.creator.percentDone != null ? this.creator.percentDone.toString() : "");
    },

    //> @method progressbarEditProxy.setInlineEditText()
    // Save the new value into the component's state. Called by the
    // +link{editProxy.inlineEditForm} to commit the change.
    // <p>
    // Updates the component's <code>percentDone</code>.
    //
    // @param newValue (String) the new component percentDone
    //
    // @visibility external
    //<
    setInlineEditText : function (newValue) {
        var liveObject = this.creator;

        var parsedValue = parseInt(newValue);
        if (isNaN(parsedValue)) parsedValue = null;

        liveObject.editContext.setNodeProperties(liveObject.editNode, { percentDone: parsedValue });
    }
});

//> @class WindowEditProxy
// +link{EditProxy} that handles +link{Window} objects when editMode is enabled.
//
// @group devTools
// @inheritsFrom LayoutEditProxy
// @treeLocation Client Reference/Tools/EditProxy
// @visibility external
//<
isc.defineClass("WindowEditProxy", "LayoutEditProxy").addMethods({

    // override of EditProxy.canAddNode
    // - Allow header/footer component drop only in correct target area
    canAddNode : function (dragType, dragTarget, dragData, dropOnFolder) {
        var canAdd = this.Super("canAddNode", arguments);

        if (canAdd && !dropOnFolder) {
            // Allow header/footer component drop only in correct target area
            var liveObject = this.creator;
            var typeClass = isc.ClassFactory.getClass(dragType);
            if (typeClass && typeClass._markerTarget) {
                // Don't allow drop by default and don't look for other targets
                canAdd = false;

                var liveObject = this.creator;
                if (typeClass._markerTarget == "header" &&
                    liveObject.header && liveObject.header.containsEvent())
                {
                    canAdd = true;
                } else if (typeClass._markerTarget == "footer" &&
                    liveObject.footer && liveObject.footer.containsEvent())
                {
                    canAdd = true;
                }
            }
        }

        return canAdd;
    },

    // Sections of the window
    HEADER_SECTION: 0,
    BODY_SECTION: 1,
    FOOTER_SECTION: 2,

    loadComplete : function () {
        // Create editNodes to match the window header and footer default components 
        // if they have not been overridden by screen contents. These are then available
        // to make rearranging them simple and they are needed if other components are
        // placed into the header or footer because the defaults will be ignored in
        // that case.
        //
        // This method will also be called to do the same when a new Window is dropped
        // into the screen.

        var liveObject = this.creator,
            editContext = liveObject.editContext,
            editNode = liveObject.editNode
        ;

        var tree = editContext.getEditNodeTree();

        // Have built-in component editNodes been created already? Also, grab the
        // first index for the header/footer components to adjusted our drop index
        var _this = this;
        [this.HEADER_SECTION, this.FOOTER_SECTION].map(function (targetSection) {
            var children = tree.getChildren(editNode),
                haveEditNodes = false,
                firstEditNodeIndex = null
            ;
            for (var i = 0; i < children.length; i++) {
                var child = children[i],
                    childSection = _this._getTargetSection(child)
                ;
                if (childSection == targetSection) {
                    haveEditNodes = true;
                    firstEditNodeIndex = i;
                    break;
                }
                if (firstEditNodeIndex == null && childSection > targetSection) {
                    firstEditNodeIndex = i;
                }
            }

            if (!haveEditNodes) {
                var parentProperty = _this._targetSectionParentProperty[targetSection];
                _this.createDefaultEditNodes(parentProperty, firstEditNodeIndex);
            }
        });
    },

    // Mapping from built-in header/footer component marker names to class name
    _windowComponentsMap : {
        "headerIcon": "WindowHeaderIcon",
        "headerLabel": "WindowHeaderLabel",
        "closeButton": "WindowCloseButton",
        "minimizeButton": "WindowMinimizeButton",
        "maximizeButton": "WindowMaximizeButton",
        "spacer": "WindowFooterSpacer",
        "resizer": "WindowResizer"
    },

    createDefaultEditNodes : function (parentProperty, firstEditNodeIndex) {
        var liveObject = this.creator,
            editContext = liveObject.editContext,
            controls = liveObject[parentProperty]
        ;

        for (var i = 0; i < controls.length; i++) {
            var control = controls[i],
                paletteNode = editContext.findPaletteNode("type", this._windowComponentsMap[control])
            ;
            // Palette node could be modified later if there are palettized components within.
            // Copy it now so that future drops are not affected.
            paletteNode = isc.clone(paletteNode);

            var editNode = editContext.makeEditNode(paletteNode),
                index = (firstEditNodeIndex != null ? firstEditNodeIndex+i : null)
            ;
            editContext.addNode(editNode, liveObject.editNode, index, parentProperty, true, null, true);
        }
    },

    // Called prior to serializing a childNode. Return false to suppress serializing it.
    // If childNode is for headerControls or footerControls and the target has not changed
    // from defaults (not initial load state) then we don't want to serialize it.
    // This way, a screen's componentXML is simplified until the user actually changes
    // the header/footer controls.
    canSaveChildNode : function (childNode, parentProperty) {
        var canSave = true;
        if (parentProperty == "headerControls") {
            canSave = this.creator.haveHeaderControlsChanged();
        } else if (parentProperty == "footerControls") {
            canSave = this.creator.haveFooterControlsChanged();
        }
        return canSave;
    },

    // Drag/drop method overrides
    // ---------------------------------------------------------------------------------------

    dropMove : function () {
        if (!this.willAcceptDrop()) return false;
        if (this.creator.hideDropLine) this.creator.hideDropLine();
        if (!this.shouldPassDropThrough()) {
            if (this.creator.header) {
                if (this.creator.header.containsEvent()) {
                    this.showDropBorder("header");
                } else {
                    this.hideDropBorder();
                }
            }
            if (this.creator.footer) {
                if (this.creator.footer.containsEvent()) {
                    this.showDropBorder("footer");
                } else {
                    this.hideDropBorder();
                }
            }
            return isc.EH.STOP_BUBBLING;
        }
    },

    dropOut : function () {
        this.showSelectedAppearance(false);
        this.hideDropBorder();
    },

    drop : function () {
        this.hideDropBorder();

        var targetContainer = this.creator,
            targetAttribute;
        if (this.creator.header && this.creator.header.containsEvent()) {
            targetContainer = this.creator.header;
            targetAttribute = "headerControls";
        } else if (this.creator.footer && this.creator.footer.containsEvent()) {
            targetContainer = this.creator.footer;
            targetAttribute = "footerControls";
        }

        if (targetContainer) {
            if (this.shouldPassDropThrough()) return;

            var liveObject = this.creator,
                editContext = liveObject.editContext,
                source = isc.EH.dragTarget,
                paletteNode,
                dropType;

            if (!source.isA("Palette")) {
                dropType = source._constructor || source.Class;
            } else {
                paletteNode = source.transferDragData();
                if (isc.isAn.Array(paletteNode)) paletteNode = paletteNode[0];
                paletteNode.dropped = true;
                dropType = paletteNode.type || paletteNode.className;
            }

            // If node is dropped from a tree, clean it of internal properties
            if (source.isA("TreePalette")) {
                paletteNode = source.data.getCleanNodeData([paletteNode], false, false, false)[0];
            }

            // Palette node could be modified later if there are palettized components within.
            // Copy it now so that future drops are not affected.
            paletteNode = isc.clone(paletteNode);

            // if the source isn't a Palette, we're drag/dropping an existing component, so remove the 
            // existing component and re-create it in its new position
            var skipNodeAddedNotification = null,
                wrapped = false
            ;
            if (!source.isA("Palette")) {
                if (source == liveObject) return;  // Can't drop a component onto itself
                editContext.removeNode(source.editNode, null, true);
                skipNodeAddedNotification = true;
            } else {
                var clazz = isc.ClassFactory.getClass(dropType);
                if (clazz && (clazz.isA("FormItem") || clazz.isA("DrawItem"))) {
                    var editNode = editContext.makeEditNode(paletteNode);
                    if (clazz && clazz.isA("FormItem")) {
                        editNode = editContext.addWithWrapper(editNode, liveObject.editNode, null, targetAttribute);
                    } else {
                        editNode = editContext.addWithWrapper(editNode, liveObject.editNode, null, targetAttribute, true);
                    }
                    wrapped = true;
                }
            }

            if (!wrapped) {
                var newEditNode = liveObject.editContext.makeEditNode(paletteNode, liveObject.editNode);
                // Don't offer a binding dialog if so configured because the node isn't really new
                newEditNode = editContext.addNode(newEditNode,liveObject.editNode, null,
                    targetAttribute, null, null, skipNodeAddedNotification);

                // Let node's proxy know that it has just been dropped in place
                if(newEditNode.liveObject.editProxy&&newEditNode.liveObject.editProxy.nodeDropped) {
                    newEditNode.liveObject.editProxy.nodeDropped(newEditNode, liveObject.editNode);
                }

                if (skipNodeAddedNotification) {
                    var oldEditNode = source.editNode,
                        tree = editContext.getEditNodeTree(),
                        oldParentNode = tree.getParent(oldEditNode);
                    editContext.fireNodeMoved(oldEditNode, oldParentNode, newEditNode, liveObject.editNode);
                }
            }
        }
        return isc.EH.STOP_BUBBLING;
    },

    // Drop always positions node at the end but we want them to always show in the
    // "targetPositions" order below. Reorder new node to maintain this desired
    // order. Note that on screen re-load the order is as defined in the
    // SplitPane schema so the corresponding fields there must also be in this order.
    _targetSectionParentProperty: [ "headerControls", null, "footerControls" ],

    // override of EditProxy.completeDrop
    // - adjust drop index to be with the same group
    completeDrop : function (paletteNode, settings, callback) {
        var liveObject = this.creator,
            editContext = liveObject.editContext,
            parentNode = liveObject.editNode
        ;
        this.hideDropBorder();

        // Drop can be completed from two different sources:
        //   1. Folder drop in edit tree
        //   2. Component drop into the header or footer
        //
        // When dropped into the edit tree the index is where the user wants the component
        // to reside. Only adjust it if the component is an explicit header/footer
        // component and is dropped into the wrong section.
        //
        // When a component is dropped into the header or footer the proxy will determine
        // the correct index based on the position within the header/footer itself.

        // Unwrap settings
        var index = (settings ? settings.index : null);

        // Assumption is that the current siblings are already sorted by section

        var tree = editContext.getEditNodeTree(),
            siblings = tree.getChildren(parentNode),
            targetSection = this._getTargetSection(paletteNode),
            targetParentProperty = this._targetSectionParentProperty[targetSection],
            targetIndex
        ;

        // If dropped component is explicitly targeted for the header or footer, make sure
        // it's in the correct place.
        if (targetParentProperty) {
            for (var i = 0; i < siblings.length; i++) {
                var sibling = siblings[i],
                    siblingSection = this._getTargetSection(sibling)
                ;
                if (targetSection < siblingSection || (index == i && targetSection == siblingSection)) {
                    targetIndex = i;
                    break;
                }
            }
        } else {
            // Otherwise assume drop location is where the user wants this component
            targetIndex = index;
        }

        if (!settings) settings = {};
        if (targetIndex != null || settings.index != null) {
            settings.index = targetIndex;
        }
        if (targetIndex != null) {
            // When dropping a generic component, pick up the parentProperty
            // from the existing node at the target position. This allows a button to be
            // dropped into the header/footer controls within the editTree. 
            if (!targetParentProperty) {
                var sibling = siblings[targetIndex];
                if (sibling) {
                    var siblingSection = this._getTargetSection(sibling);
                    targetParentProperty =  this._targetSectionParentProperty[siblingSection];
                }
            }
        }
        if (targetParentProperty) settings.parentProperty = targetParentProperty;

        this.Super("completeDrop", [paletteNode, settings, callback]);

        // Window folder in editTree defaults to closed to keep tree display simple. When
        // a new node is dropped into a Window automatically open the folder.
        tree.openFolder(parentNode);
    },

    _getTargetSection : function (node) {
        var type = node.type || node.className,
            typeClass = isc.ClassFactory.getClass(type)
        ;
        if (typeClass && typeClass._markerTarget) {
            return (typeClass._markerTarget == "header" ? this.HEADER_SECTION : this.FOOTER_SECTION);
        }

        var parentProperty = (node.defaults ? node.defaults.parentProperty : null);

        return (parentProperty == "headerControls"
                ? this.HEADER_SECTION
                : (parentProperty == "footerControls" ? this.FOOTER_SECTION : this.BODY_SECTION));
    },

    showDropBorder : function (target) {
        var liveObject = this.creator,
            dropTarget = (target == "header" ? liveObject.header : liveObject.footer)
        ;
        if (dropTarget) dropTarget.setBorder("2px dashed blue");
    },

    hideDropBorder : function () {
        if (this.creator.header) this.creator.header.setBorder("");
        if (this.creator.footer) this.creator.footer.setBorder("");
    },

    _windowComponentShowAttrNames : {
        "headerIcon": "showHeaderIcon",
        "headerLabel": "showTitle",
        "closeButton": "showCloseButton",
        "minimizeButton": "showMinimizeButton",
        "maximizeButton": "showMaximizeButton",
        "resizer": "showResizer"
    },

    mapDropPositionToIndex : function (controls, dropPosition) {
        var liveObject = this.creator;

        // controls has an element for each potential header/footer control to display.
        // However, the window has properties to show/hide the controls so even though
        // it is defined in the controls array it may not exist in the actual header/footer.
        // The dropPosition is the position within the visible components.

        var index = dropPosition;
        for (var i = 0; i <= dropPosition; i++) {
            var control = controls[i];
            if (isc.isA.String(control)) {
                var showControlAttrName = this._windowComponentShowAttrNames[control];
                if (!liveObject[showControlAttrName]) index++;
            }
        }

        return index;
    },

    mapIndexToDropPosition : function (controls, index) {
        var liveObject = this.creator;

        // headerControls has an element for each potential header/footer control to display.
        // However, the window has properties to show/hide the controls so even though
        // it is defined in the controls array it may not exist in the actual header/footer.
        // The dropPosition is the position within the visible components.

        var dropPosition = index;
        for (var i = 0; i <= index; i++) {
            var control = controls[i];
            if (isc.isA.String(control)) {
                var showControlAttrName = this._windowComponentShowAttrNames[control];
                if (!liveObject[showControlAttrName]) dropPosition--;
            }
        }

        return dropPosition;
    },

    // override of EditProxy.getResizeEdges
    // - A modal window can be resized
    getResizeEdges : function () {
        var liveObject = this.creator;
        if (isc.isA.ModalWindow(liveObject) || liveObject.isModal) {
            this.persistCoordinates = true;
            return ["B", "R"];
        }
        return this.Super("getResizeEdges", arguments);
    },

    getNodeDescription : function (node) {
        var liveObject = this.creator;
        return (liveObject.isModal ? "initially hidden" : null);
    },

    getChildNodeDescription : function (node) {
        var child = node.liveObject,
            parentProperty = (node.defaults ? node.defaults.parentProperty : null),
            description = "[Body]"
        ;
        if (parentProperty == "headerControls") {
            description = (child._markerName ? null : "[Header Control]");
        } else if (parentProperty == "footerControls") {
            description = (child._markerName ? null : "[Footer Control]");
        }
        return description;
    },

    // Component editor handling
    // ---------------------------------------------------------------------------------------

    supportsInlineEdit: true,

    //> @method windowEditProxy.getInlineEditText()
    // Returns the text based on the current component state to be edited inline.
    // Called by the +link{editProxy.inlineEditForm} to obtain the starting edit value.
    // <p>
    // Returns the component's title.
    //
    // @visibility external
    //<
    getInlineEditText : function () {
        return this.creator.title;
    },
    
    //> @method windowEditProxy.setInlineEditText()
    // Save the new value into the component's state. Called by the
    // +link{editProxy.inlineEditForm} to commit the change.
    // <p>
    // Updates the component's title.
    //
    // @param newValue (String) the new component title
    //
    // @visibility external
    //<
    setInlineEditText : function (newValue) {
        var liveObject = this.creator;

        liveObject.editContext.setNodeProperties(liveObject.editNode, { title: newValue });
    }
});

isc.defineClass("WindowHeaderEditProxy", "LayoutEditProxy").addMethods({

    getOverrideProperties : function () {
        var properties = this.Super("getOverrideProperties", arguments);
        isc.addProperties(properties, { canAcceptDrop: true });
        return properties;
    },

    // Drag/drop method overrides
    // ---------------------------------------------------------------------------------------

    drop : function () {
        this.creator.hideDropLine();

        var liveObject = this.creator,
            source = isc.EH.dragTarget,
            dropPosition = this.getDropPosition(),
            paletteNode = source.transferDragData()
        ;
        if (isc.isAn.Array(paletteNode)) paletteNode = paletteNode[0];

        // If node is dropped from a tree, clean it of internal properties
        if (source.isA("TreePalette")) {
            paletteNode = source.data.getCleanNodeData(paletteNode, false, false, false);
        } else {
            // Palette node could be modified later if there are palettized components within.
            // Copy it now so that future drops are not affected.
            paletteNode = isc.clone(paletteNode);
        }
        paletteNode.dropped = true;
        if (!paletteNode.defaults) paletteNode.defaults = {};
        paletteNode.defaults.parentProperty = (this.isHeader ? "headerControls" : "footerControls");

        // dropPosition is the position with the header layout which may not match up
        // with the editTree nodes in the window. The built-in components have window
        // properties to show/hide them even though they are represented by editNodes.
        // Find the index into the editNodes for the correct position to add the node.

        var window = liveObject.parentElement,
            index = window.editProxy.mapDropPositionToIndex(window.headerControls, dropPosition)
        ;

        // On the first drop into a header after initial creation with default header/footer
        // components, all controls are automatically removed. There are also no matching
        // editNodes for the default components keeping the editTree and screen definition
        // clean until the user customizes the header/footer.
        //
        // Therefore, on the first drop, editNdoes must be added to match the defaults and
        // then the new drop placed where it belongs.

        var editContext = liveObject.editContext,
            parentNode = window.editNode
        ;

        var tree = editContext.getEditNodeTree(),
            siblings = tree.getChildren(parentNode),
            targetSection = window.editProxy._getTargetSection(paletteNode)
        ;

        // Have built-in component editNodes been created already? Also, grab the
        // first index for the header/footer components to adjusted our drop index
        var firstEditNodeIndex = null;
        for (var i = 0; i < siblings.length; i++) {
            var sibling = siblings[i],
                siblingSection = window.editProxy._getTargetSection(sibling)
            ;
            if (siblingSection == targetSection) {
                firstEditNodeIndex = i;
                break;
            }
            if (firstEditNodeIndex == null && siblingSection > targetSection) {
                firstEditNodeIndex = i;
            }
        }

        if (firstEditNodeIndex != null) index += firstEditNodeIndex;

        window.editProxy.completeDrop(paletteNode, { index: index })
        return isc.EH.STOP_BUBBLING;
    }
});

//> @class DetailViewerEditProxy
// +link{EditProxy} that handles +link{DetailViewer} components when editMode is enabled.
//
// @inheritsFrom CanvasEditProxy
// @group devTools
// @treeLocation Client Reference/Tools/EditProxy
// @visibility external
//<
isc.defineClass("DetailViewerEditProxy", "CanvasEditProxy").addMethods({

    // Component editor handling
    // ---------------------------------------------------------------------------------------

    supportsInlineEdit: true,
    inlineEditMultiline: true,
    inlineEditInstructions: "Enter options, one per line. Use \"*\" to mark the selected option. " +
    "Use \"Field:Value\" to create a mapping between fields and values.",

    //> @attr detailViewerEditProxy.dataSeparatorChar (String : "," : IR)
    // If +link{editProxy.inlineEditEvent,inline editing} for this viewer edits the
    // +link{detailViewer.data}, character that should be used as a separator between
    // values, or between pairs of field name vs values if the user is entering such
    // a +link{ValueMap} using the +link{dataDisplaySeparatorChar,dataDisplaySeparatorChar}.
    // <p>
    // If +link{editProxy.inlineEditMultiline} is enabled, newlines will be used as value
    // separators and the <code>dataSeparatorChar</code>
    // <p>
    // The +link{dataEscapeChar,dataEscapeChar} can be used to enter the separator
    // char as part of a field name or value.
    //
    // @visibility external
    //<
    dataSeparatorChar: ",",

    //> @attr detailViewerEditProxy.dataDisplaySeparatorChar (String : ":" : IR)
    // If +link{editProxy.inlineEditEvent,inline editing} for this viewer edits the
    // +link{detailViewer.data}, character that should be used as a separator for
    // entering +link{ValueMap}-style entries that map from a field name to a value.
    // <p>
    // With the default of ":", the following input:
    // <pre>
    //      1:Fixed, 2:Won't Fix, 3:Resolved
    // </pre>
    // Would be assumed to be a mapping like this (expressed in JSON):
    // <pre>
    //   {
    //      "1" : "Fixed",
    //      "2" : "Won't Fix",
    //      "3" : "Resolved"
    //   }
    // </pre>
    // <p>
    // Any entry without a separator char has an implied value of <code>null</code>.
    // For example, for this input:
    // <pre>
    //       Fixed:Reported Fixed, WontFix:Won't Fix, Resolved
    // </pre>
    // The resulting <code>data</code> would be:
    // <pre>
    //   {
    //      "Fixed" : "Reported Fixed",
    //      "WontFix" : "Won't Fix",
    //      "Resolved" : null
    //   }
    // </pre>
    // <p>
    // The +link{dataEscapeChar,dataEscapeChar} can be used to enter literal colon characters.
    // <p>
    // Set <code>dataDisplaySeparatorChar</code> to null to prevent entry of values
    // - user input will always be treated as just a list of legal field names.
    //
    // @visibility external
    //<
    dataDisplaySeparatorChar: ":",

    //> @attr detailViewerEditProxy.dataEscapeChar (String : "\" : IR)
    // If +link{editProxy.inlineEditEvent,inline editing} for this viewer edits the
    // +link{detailViewer.data}, character that can be used to enter literal separator
    // chars (such as the +link{dataSeparatorChar,dataSeparatorChar}) or literal
    // leading or trailing whitespace.
    // <p>
    // Repeat this character twice to enter it literally.  For example, with the default
    // of "\", inputting "\\" would result in a literal backslash in the value.
    //
    // @visibility external
    //<
    dataEscapeChar: "\\",

    //> @method detailViewerEditProxy.getInlineEditText()
    // Returns the text based on the current component state to be edited inline.
    // Called by the +link{editProxy.inlineEditForm} to obtain the starting edit value.
    // <p>
    // Returns the component's data one-field-per-line as specified in
    // +link{detailViewerEditProxy.dataDisplaySeparatorChar}.
    //
    // @visibility external
    //<
    getInlineEditText : function () {
        var liveObject = this.creator;

        if (!liveObject.data) return null;

        var separatorChar = (this.inlineEditMultiline ? "\n" : this.dataSeparatorChar),
            values = liveObject.data,
            fields = liveObject.fields,
            string = ""
        ;

        for (var i = 0; i < fields.length; i++) {
            var field = fields[i],
                value = values[field.name]
            ;
            if (value != null) value = value.replace(this.dataDisplaySeparatorChar, this.dataEscapeChar + this.dataDisplaySeparatorChar);
            string = string + (string.length > 0 ? separatorChar : "") + 
                field.name + 
                (value != null ? this.dataDisplaySeparatorChar + value : ""); 
        }
        return string;
    },

    //> @method detailViewerEditProxy.setInlineEditText()
    // Save the new value into the component's state. Called by the
    // +link{editProxy.inlineEditForm} to commit the change.
    // <p>
    // Updates the component's <code>data</code> and <code>fields</code>.
    //
    // @param newValue (String) the new component data
    //
    // @visibility external
    //<
    setInlineEditText : function (newValue) {
        var separatorChar = (this.inlineEditMultiline ? "\n" : this.dataSeparatorChar);
        var value = isc.EditProxy.parseStringValueMap(newValue,
                separatorChar,
                this.dataEscapeChar,
                this.dataDisplaySeparatorChar,
                null,
                false,
                true);
        // Extract field definitions from map
        var values = value.valueMap,
            fields = []
        ;
        for (var key in values) fields.add({ name: key });
        this.creator.editContext.setNodeProperties(this.creator.editNode, { data: values, fields: fields });
    }
});

//> @class MenuEditProxy
// +link{EditProxy} that handles +link{MenuButton} and +link{MenuBar} objects when editMode is enabled.
//
// @inheritsFrom CanvasEditProxy
// @group devTools
// @treeLocation Client Reference/Tools/EditProxy
// @visibility external
//<
isc.defineClass("MenuEditProxy", "CanvasEditProxy").addClassMethods({
    // Parse a MenuButton string which has a single menu
    parseMenuButtonString : function (string) {
        var menus = isc.MenuEditProxy.parseMenuBarString(string, true);
        return (menus.length > 0 ? menus[0] : null);
    },

    // Parse a MenuBar string which has multiple menus
    parseMenuBarString : function (string, singleMenu) {
        // Each menu (button) starts at a title definition: --, == or title:
        // and runs until the next title or end of entry
        var items = string.trim().split("\n"),
            menuLines = [],
            menus = [],
            menuTitle
        ;
        for (var i = 0; i < items.length; i++) {
            var item = items[i].trim();
            if (/^-+$/.test(item) || /^=+$/.test(item)) {
                menuLines.add(item);
                continue;
            }
            if (item.startsWith("--") || item.startsWith("==") || item.startsWith("title:")) {
                if (menuLines.length > 0) {
                    var menuItems = isc.MenuEditProxy.parseMenuString(menuLines.join("\n")),
                        menu = {
                            title: menuTitle || "Menu",
                            data: menuItems
                        }
                    ;

                    menus.add(menu);
                    menuLines = [];

                    if (singleMenu) return menus;
                } else if (menuTitle) {
                    menus.add({ title: menuTitle });

                    if (singleMenu) return menus;
                }
                if (item.startsWith("title:")) {
                    menuTitle = item.replace(/^title:/, "").trim();
                } else {
                    menuTitle = item.substring(2).trim();
                }
            } else {
                menuLines.add(item);
            }
        }

        if (menuLines.length > 0 || menuTitle) {
            var menuItems = this.parseMenuString(menuLines.join("\n")),
                menu = {
                    title: menuTitle || "Menu",
                    data: menuItems
                }
            ;

            menus.add(menu);
        }

        return menus;
    },

    // Parse a single-menu
    parseMenuString : function (string) {
        var items = string.trim().split("\n");
        var menuItems = [];
        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            if (/^-+$/.test(item) || /^=+$/.test(item)) {
                menuItems.add({isSeparator: true});
            } else {
                var itemParts = item.split(",");
                var name = itemParts[0];
                var menuItem = {
                    title: isc.MenuEditProxy.parseTextWikiSymbols(itemParts[0])
                }
                if (itemParts.length > 1) {
                    menuItem.keyTitle = itemParts[1];
                }
                if (menuItem.title.endsWith(">")) {
                    menuItem.title = menuItem.title.substring(0, menuItem.title.length-1);
                    menuItem.submenu = [{}];
                }
                if (menuItem.title.startsWith("x") || menuItem.title.startsWith("o")) {
                    menuItem.title = menuItem.title.substring(1);
                    menuItem.checked = true;
                }
                if (menuItem.title.startsWith("-") && menuItem.title.endsWith("-")) {
                    menuItem.title = menuItem.title.substring(1,menuItem.title.length-1);
                    menuItem.enabled = false;
                }
                menuItems.add(menuItem);
            }
        }
        return menuItems;
    },

    // Tool function for parsing balsamiq text - it encoded using wiki-style
    // Replaces '\r' by '<br/>', '[text]' by text in a link, '*text*' by text in bold,
    // '_text_' by text in italic.
    // See:  http://support.balsamiq.com/customer/portal/articles/110121
    parseTextWikiSymbols : function (text) {
        var italic = false;
        var bold = false;
        var link = false;
        var res = [];
        for (var i = 0; i < text.length; i++) {
            var c = text.charAt(i);
            if (c == '\\') {
                if( (i + 1) < text.length && text.charAt(i + 1) == 'r') {
                    c = "<br/>";
                    i++;    
                }
            } else if (c == '[' && text.indexOf("]",i + 1) > 0) {
                c = "<a href='#'>";
                link = true;
            } else if (c == ']') {
                if (link) {
                    c = "</a>";
                    link = false;
                }
            } else if (c == '*') {
                if (bold) {
                    bold = false;
                    c = "</b>";
                } else {
                    bold = true;
                    c = "<b>";
                }
            } else if (c == '_') {
                if (italic) {
                    italic = false;
                    c = "</i>";
                } else {
                    italic = true;
                    c = "<i>";
                }
            }
            res.push(c);
        }
        return res.join("");
    },

    // Given a menu { title, data } return the wiki-style string defintion
    menuToWikiText : function (menu) {
        var string = "== " + menu.title + "\n";
        if (menu.data) {
            var menuItems = menu.data;
            for (var i = 0; i < menuItems.length; i++) {
                string += isc.MenuEditProxy.menuItemToWikiText(menuItems[i]) + "\n";
            }
        }
        return string;
    },

    // Given a menuItem return the wiki-style string defintion
    menuItemToWikiText : function (menuItem) {
        var string = "";
        if (menuItem.isSeparator) return "---";
        if (menuItem.enabled == false) string += "-";
        else if (menuItem.checked) string += "x ";
        string += menuItem.title;
        if (menuItem.submenu) string += " >";
        if (menuItem.keyTitle) string += "," + menuItem.keyTitle;

        return string;
    }
});

isc.MenuEditProxy.changeDefaults("inlineEditFormDefaults", { minHeight: 150 });

isc.MenuEditProxy.addMethods({

    // Assigning a visualProxy for a Menu might be helpful but is not required at present
    // setEditMode : function (editingOn) {
    //     this.Super("setEditMode", arguments);
    
    //     if (isc.isA.Menu(this.creator)) {
    //         var editContext = this.creator.editContext,
    //             parentNode = editContext.getParentNode(this.creator.editNode)
    //         ;
        
    //         if (parentNode.liveObject.menu == this.creator) {
    //             this.creator._visualProxy = parentNode.liveObject;
    //         }
    //     }
    // },

    // Disable autoDismissOnBlur for the menuButton
    getOverrideProperties : function () {
        var properties = this.Super("getOverrideProperties", arguments);

        var liveObject = this.creator;
        if (isc.isA.Menu(liveObject)) {
            var editContext = liveObject.editContext,
                parentNode = editContext.getParentNode(liveObject.editNode),
                parentComponent = (parentNode ? parentNode.liveObject : null)
            ;
            // A context menu isn't shown in the UI.
            if (!parentComponent || parentComponent.contextMenu != liveObject) {
                // For a normal menu have it stay visible when shown until explicitly hidden
                isc.addProperties(properties, { autoDismiss: false, autoDismissOnBlur: false });
            }
        }
        return properties;
    },
    
    showSelectedAppearance : function (show, hideLabel, showThumbsOrDragHandle) {
        this.Super("showSelectedAppearance", arguments);

        // Show/hide the menu
        var liveObject = this.creator;
        if (isc.isA.Menu(liveObject)) {
            var editContext = liveObject.editContext,
                parentNode = editContext.getParentNode(liveObject.editNode),
                parentComponent = (parentNode ? parentNode.liveObject : null)
            ;
            // A context menu isn't shown in the UI.
            if (!parentComponent || parentComponent.contextMenu != liveObject) {
                if (show) this.showMenu()
                else this.hideMenu();
            }
        }
    },

    
    showMenu : function () {
        var liveObject = this.creator,
            show = function (object) {
                if (object.contextMenu && object.showContextMenu) object.showContextMenu();
                else if (object.menu && object.showMenu) object.showMenu();
            }
        ;
        if (isc.isA.Menu(liveObject)) {
            var editContext = this.creator.editContext,
                parentNode = editContext.getParentNode(liveObject.editNode)
            ;

            if (parentNode && parentNode.liveObject) {
                var parentObject = parentNode.liveObject;
                show(parentObject);
            }
        } else {
            show(liveObject);
        }
    },

    hideMenu : function () {
        var liveObject = this.creator,
            hide = function (object) {
                if (object.contextMenu && object.showContextMenu) object.hideContextMenu();
                else if (object.menu && object.showMenu) object.menu.hide();
            }
        ;
        if (isc.isA.Menu(liveObject)) {
            var editContext = this.creator.editContext,
                parentNode = editContext.getParentNode(liveObject.editNode)
            ;

            if (parentNode && parentNode.liveObject) {
                var parentObject = parentNode.liveObject;
                hide(parentObject);
            }
        } else {
            hide(liveObject);
        }
     },

    // Component editor handling
    // ---------------------------------------------------------------------------------------

    supportsInlineEdit: true,
    inlineEditMultiline: true,

    // A MenuButton should support inline editing in both VB and mockup mode.
    // editContext.isVisualBuilder == true when in VB mode.
    createInlineEditForm : function () {
        var liveObject = this.creator,
            editContext = liveObject.editContext
        ;
        if (editContext.isVisualBuilder && this.inlineEditMultiline) {
            this.inlineEditMultiline = false;
            isc.MenuEditProxy.changeDefaults("inlineEditFormDefaults", { minHeight: 20 });
        } else if (!editContext.isVisualBuilder && !this.inlineEditMultiline) {
            this.inlineEditMultiline = true;
            isc.MenuEditProxy.changeDefaults("inlineEditFormDefaults", { minHeight: 150 });
        }

        return this.Super("createInlineEditForm", arguments);
    },

    //> @method menuEditProxy.getInlineEditText()
    // Returns the text based on the current component state to be edited inline.
    // Called by the +link{editProxy.inlineEditForm} to obtain the starting edit value.
    // <p>
    // Returns the component's menu definition in wiki-style.
    //
    // @visibility external
    //<
    getInlineEditText : function () {
        var liveObject = this.creator,
            editContext = liveObject.editContext
        ;
        if (editContext.isVisualBuilder) {
            return this.creator.getTitle();
        }

        var string = "";
        if (isc.isA.MenuButton(liveObject)) {
            var menu = liveObject.menu || liveObject.data;
            string += isc.MenuEditProxy.menuToWikiText({ title: liveObject.title, data: menu });
        } else {
            var menus = liveObject.menus;
            for (var i = 0; i < menus.length; i++) {
                string += isc.MenuEditProxy.menuToWikiText(menus[i]);
            }
        }
        return string;
    },

    //> @method menuEditProxy.setInlineEditText()
    // Save the new value into the component's state. Called by the
    // +link{editProxy.inlineEditForm} to commit the change.
    // <p>
    // Updates the component's menu.
    // <p>
    // Lines starting with "--", "==" or "title:" are considered titles for the
    // MenuButtons. The menuItem definitions follow the title to define the menu
    // contents.
    // <p>
    // Each menuItem title is entered on its own line. A keyTitle can follow the title
    // separated by a comma. A leading "x" or "o" marks the menuItem as checked.
    // MenuItems can be marked as disabled with a leading or trailing dash (-).
    // A sub-menu is indicated with a trailing &gt;. Any line consisting entirely of
    // one or more dashes (-) or equals (=) indicates a separator line. 
    //
    // @param newValue (String) the new component menu
    //
    // @visibility external
    //<
    setInlineEditText : function (newValue) {
        var liveObject = this.creator,
            editContext = liveObject.editContext
        ;
        if (editContext.isVisualBuilder) {
            liveObject.editContext.setNodeProperties(liveObject.editNode, { title: newValue });
            return;
        }

        if (isc.isA.MenuButton(liveObject)) {
            var menu = isc.MenuEditProxy.parseMenuButtonString(newValue);
            if (menu) {
                liveObject.editContext.setNodeProperties(liveObject.editNode, menu);
            } else {
                liveObject.editContext.removeNodeProperties(liveObject.editNode, ["title", "menu"]);
            }
        } else {
            // If the MenuBar was loaded the individual menus will be extracted into
            // the editTree. This is not necessary and if menus are updated on the
            // MenuBar itself they will be serialized along with the editTree nodes.
            // The editNodes are just dropped at this point.
            var editTree = liveObject.editContext.getEditNodeTree(),
                childNodes = editTree.getChildren(liveObject.editNode)
            ;
            if (childNodes && childNodes.length > 0) editTree.removeList(childNodes);

            var menus = isc.MenuEditProxy.parseMenuBarString(newValue);
            liveObject.editContext.setNodeProperties(liveObject.editNode, { menus: menus });
        }
    }
});

// Edit Proxy for SectionStack
//-------------------------------------------------------------------------------------------

//> @class SectionStackEditProxy
// +link{EditProxy} that handles +link{SectionStack} objects when editMode is enabled.
//
// @group devTools
// @inheritsFrom LayoutEditProxy
// @treeLocation Client Reference/Tools/EditProxy
// @visibility external
//<
isc.defineClass("SectionStackEditProxy", "LayoutEditProxy").addMethods({

    // override of EditProxy.canAddNode
    // - Allow any Canvas, FormItem or DrawItem to be dropped into a section
    canAddNode : function (dragType, dragTarget, dragData, dropOnFolder) {
        var canAdd = this.Super("canAddNode", arguments);

        if (!canAdd) {
            // SectionStack is a special case for DnD - although it is a VLayout, its schema marks
            // children, peers and members as inapplicable.  However, anything can be put into a 
            // SectionStackSection.  Therefore, we accept drop of any canvas, and handle adding it 
            // to the appropriate section in the drop method.
            //
            // We also accept a drop of a FormItem; this will be detected downstream and handled by
            // wrapping the FormItem inside an auto-created DynamicForm.  Similarly a DrawItem
            // can be accepted because it will be wrapped inside an auto-created DrawPane.
            var classObject = isc.ClassFactory.getClass(dragType);
            if (classObject &&
                (classObject.isA("Canvas") || classObject.isA("FormItem") || classObject.isA("DrawItem")))
            {
                canAdd = true;
            }
        }

        return canAdd;
    },

    //  Return the modified editNode (or a completely different one); return false to abandon 
    //  the drop
    modifyEditNode : function (paletteNode, newEditNode, dropType) {
        if (dropType == "SectionStackSection") return newEditNode;
        var dropPosition = this.creator.getDropPosition();
        if (dropPosition == 0) {
            isc.warn("Cannot drop before the first section header");
            return false;
        }

        var headers = this._getHeaderPositions();
        for (var i = headers.length-1; i >= 0; i--) {
            if (dropPosition > headers[i]) {
                // Return the edit node off the section header
                return this.creator.getSectionHeader(i).editNode;
            }
        }
        // Shouldn't ever get here
        return newEditNode;
    },

    //  getDropPosition() - explicitly called from SectionStack.getDropPosition if the user isn't doing
    //  a drag reorder of sections.
    getDropPosition : function (dropType) {
        var pos = this.creator.invokeSuper(isc.SectionStack, "getDropPosition");
        if (!dropType || dropType == "SectionStackSection") {
            return pos;
        }

        var headers = this._getHeaderPositions();
        for (var i = headers.length-1; i >= 0; i--) {
            if (pos > headers[i]) {
                return pos - headers[i] - 1;
            }
        }

        return 0;
    },

    _getHeaderPositions : function () {
        var liveObject = this.creator,
            headers = [],
            j = 0;
        for (var i = 0; i < liveObject.getMembers().length; i++) {
            if (liveObject.getMember(i).isA(liveObject.sectionHeaderClass)) {
                headers[j++] = i;
            }
        }
        return headers;
    },
    
    // Component editor handling
    // ---------------------------------------------------------------------------------------

    supportsInlineEdit: false
});

//> @class SectionStackSectionEditProxy
// +link{EditProxy} that handles +link{SectionStackSection} objects when editMode is enabled.
//
// @group devTools
// @inheritsFrom LabelEditProxy
// @treeLocation Client Reference/Tools/EditProxy
// @visibility external
//<
isc.defineClass("SectionStackSectionEditProxy", "LabelEditProxy").addMethods({

    // Disable double-click suppression on header
    getOverrideProperties : function () {
        var properties = this.Super("getOverrideProperties", arguments);
        isc.addProperties(properties, { noDoubleClicks: false, canAcceptDrop: true });
        return properties;
    },

    getNodeDescription : function (node) {
        // A Section is auto-assigned an ID but that doesn't match well with the
        // section's title so use the title as additional description
        var liveObject = this.creator;
        return (liveObject.title ? "Section: " + liveObject.title.asHTML() : null);
    },

    getChildNodeDescription : function (node) {
        var liveObject = this.creator,
            child = node.liveObject
        ;
        if (liveObject.controls && liveObject.controls.contains(child)) return "[Header control]";
        return null;
    },

    // Drag/drop method overrides
    // ---------------------------------------------------------------------------------------

    // Potentially override dropOver, dropMove and dropOut to show target of drop:
    // items vs controls.

    drop : function () {
        // Consider the SectionHeader to be divided horizontally into thirds.
        // A drop in the middle third is added to the "controls" where a drop
        // elsewhere is added to the normal "items" array.

        var liveObject = this.creator,
            width = liveObject.getVisibleWidth(),
            rect = liveObject.getPageRect(),
            left = rect[0],
            right = left + width,
            x = isc.EH.getX()
        ;

        // If normal "items" drop, let superclass handle the drop
        if (x < (left + (width / 3)) || x > (right - (width / 3))) {
            return this.Super("drop", arguments);
        }

        // Drop on controls
        var source = isc.EH.dragTarget;
        if (!source.isA("Palette")) {
            // Ignore drop of existing nodes onto controls for now
            return isc.EH.STOP_BUBBLING;
        }

        var paletteNode = source.transferDragData();
        if (isc.isAn.Array(paletteNode)) paletteNode = paletteNode[0];
        paletteNode.dropped = true;

        // If node is dropped from a tree, clean it of internal properties
        if (source.isA("TreePalette")) {
            paletteNode = source.data.getCleanNodeData([paletteNode], false, false, false)[0];
        }

        // Palette node could be modified later if there are palettized components within.
        // Copy it now so that future drops are not affected.
        paletteNode = isc.clone(paletteNode);

        var newEditNode = liveObject.editContext.makeEditNode(paletteNode, liveObject.editNode);
        liveObject.editContext.addNode(newEditNode, liveObject.editNode, null, "controls");

        return isc.EH.STOP_BUBBLING;
    },

    // Component editor handling
    // ---------------------------------------------------------------------------------------

    supportsInlineEdit: true,
    centerInlineEdit: true,

    getInlineEditText : function () {
        return this.creator.getTitle();
    },
    
    setInlineEditText : function (newValue) {
        var liveObject = this.creator;

        liveObject.editContext.setNodeProperties(liveObject.editNode, { title: newValue });
    },

    extraEditorPadding: 6,

    // Position editor to the right of the icon
    positionInlineEditor : function () {
        this.Super("positionInlineEditor", arguments);

        var liveObject = this.creator;

        if (!liveObject.background) {
            var iconWidth = (liveObject.icon ? liveObject.iconWidth || liveObject.iconSize : 0),
                iconSpace = iconWidth + liveObject.getIconSpacing() + this.extraEditorPadding
            ;
            if (iconSpace > 0) this.inlineEditLayout.moveBy(iconSpace, 0);
        }
    },

    // Adjust editor width to exclude the space taken up by the icon and controls
    sizeInlineEditor : function () {
        this.Super("sizeInlineEditor", arguments);

        var liveObject = this.creator,
            width;
        if (liveObject.background) {
            width = liveObject.background.label.getVisibleWidth();
        } else {
            var iconWidth = (liveObject.icon ? liveObject.iconWidth || liveObject.iconSize : 0),
                iconSpace = iconWidth + liveObject.getIconSpacing() + this.extraEditorPadding,
                controlsSpace = (liveObject.controlsLayout ? liveObject.controlsLayout.getVisibleWidth() + this.extraEditorPadding: 0)
            ;
            width = this.inlineEditLayout.getWidth() - iconSpace - controlsSpace;
        }
        this.inlineEditLayout.setWidth(width);
    },

    
    doubleClick : function () {
        var liveObject = this.creator;
        if (liveObject._clearPendingClickTimer) liveObject._clearPendingClickTimer();
        this.Super("doubleClick", arguments);
    }
});


// Proxy canvas used to anchor mask over a form item
isc.ClassFactory.defineClass("FormItemVisibilityProxyCanvas", "Canvas");

isc.FormItemVisibilityProxyCanvas.addProperties({
    autoDraw: false,

    // start out hidden, only show if explicitly shown
    visibility:"hidden",
    _showWithMaster:false,
    _moveWithMaster:false,

    init : function () {
        this.Super("init", arguments);
        if (this.formItem) this.setFormItem(this.formItem);
    },

    destroy : function () {
        var formItem = this.formItem,
            form = this.formItem.containerWidget
        ;
        if (form && this.isObserving(form, "setZIndex")) {
            this.ignore(form, "setZIndex");
        }
        if (this.isObserving(formItem, "moved")) {
            this.ignore(formItem, "moved");
        }
        if (this.isObserving(formItem, "visibilityChanged")) {
            this.ignore(formItem, "visibilityChanged");
        }
        this.Super("destroy", arguments);
    },

    setFormItem : function (formItem) {
        var form = formItem.containerWidget;

        this.formItem = formItem;
        this.syncWithFormItemPosition();
        this.syncZIndex(form);

        // stay just below the form
        if (!this.isObserving(form, "setZIndex")) {
            this.observe(form, "setZIndex",
                "observer.syncZIndex(observed)");
        }

        // and stay in position with form item
        if (!this.isObserving(formItem, "moved")) {
            this.observe(formItem, "moved",
                "observer.syncWithFormItemPosition()");
        }

        // Mirror visibility with underlying FormItem.
        if (!this.isObserving(formItem, "visibilityChanged")) {
            this.observe(formItem, "visibilityChanged",
                "observer.formItemVisibilityChanged()");
        }
    },

    syncWithFormItemPosition : function () {
        if (!this.formItem || !this.formItem.containerWidget) return; // formItem not yet part of a form?
        this._syncing = true;
        // Get rectangle that covers not only the editor but also the title
        var parent = this.parentElement || this.formItem.form,
            parentRect = parent.getPageRect(),
            rect = this.formItem.getPageRectIncludingTitle()
        ;
        // Make sure size isn't 0,0 so it will actually draw something
        if (!rect[2]) rect[2] = 10; // width
        if (!rect[3]) rect[3] = 10; // height

        // And that width isn't wider than the form causing it to resize
        if (rect[2] > this.formItem.form.getWidth()) rect[2] = this.formItem.form.getWidth();

        // Position within parent because this proxy canvas is a peer to the form
        this.moveTo(rect[0] - parentRect[0], rect[1] - parentRect[1]);
        // And resize
        this.resizeTo(rect[2], rect[3]);
        this._syncing = false;
    },

    resizeTo : function (width, height) {
        // Prevent save while syncing from outline update
        var formItem = this.formItem;
        if (!this._syncing && formItem) formItem.redraw();

        this.Super("resizeTo", arguments);
    },

    // Float this mask just behind the form so the event mask will be just above it
    syncZIndex : function (canvas) {
        var z = canvas.getZIndex(true);
        this.setZIndex(z - 3);
    },

    formItemVisibilityChanged : function () {
        // If form isn't drawn then visibility must be hidden
        var drawnState = this.formItem.form.getDrawnState();
        if (drawnState != isc.Canvas.UNDRAWN && this.formItem.isVisible()) this.show();
        else this.hide();
    },

    show : function () {
        this.Super("show", arguments);
        if (this.visibilityMask) this.visibilityMask.show();
    },
    hide : function () {
        if (this.visibilityMask) this.visibilityMask.hide();
        this.Super("hide", arguments);
    }
});

isc.defineClass("VisibilityMaskManager", "Class");

isc.VisibilityMaskManager.addMethods({

    //> @attr visibilityMaskManager.container (Canvas : null : IR)
    // Top-level canvas for all screen components.
    //<

    init : function () {
        this.Super("init", arguments);

        this.entries = {};
    },

    addComponent : function (component, reason) {
        var entryID = this._getEntryID(component),
            entry = this._getEntry(entryID)
        ;
        if (!entry) {
            entry = this._createEntry(component, null, reason);
            this._addEntry(entryID, entry);
            this._setupPageMouseHandlers();
        }
        // Draw initial mask
        this.overComponent(component, false);
    },

    addFormItem : function (form, formItem, reason) {
        if (!form.isDrawn() || !formItem.isDrawn()) {
            this.delayCall("addFormItem", [form,formItem,reason]);
            return;
        }
        var entryID = this._getEntryID(form, formItem),
            entry = this._getEntry(entryID)
        ;
        if (!entry) {
            entry = this._createEntry(form, formItem, reason);
            this._addEntry(entryID, entry);
            this._setupPageMouseHandlers();
        }
        // Draw initial mask
        this.overFormItem(form, formItem, false);
    },

    removeComponent : function (component) {
        var entry = this._removeEntry(this._getEntryID(component));
        if (entry && !this._hasEntries()) {
            this._clearPageMouseHandlers();
        }
        return (entry != null);
    },

    removeFormItem : function (form, formItem) {
        var entry = this._removeEntry(this._getEntryID(form, formItem));
        if (entry && !this._hasEntries()) {
            this._clearPageMouseHandlers();
        }
        return (entry != null);
    },

    // Internal entry management
    // ---------------------------------------------------------------------------------------

    // An entry represents a component that is masked when the mouse is not over it
    // and the mask is hidden when the mouse moves over.

    _getEntryID : function (component, formItem) {
        return (formItem ? component.getID() + "_" + formItem.name : component.getID());
    },

    _createEntry : function (component, formItem, reason) {
        var form = (formItem ? component : null);
        var entry = {
            component: component,
            form: form,
            formItem: formItem,
            reason: reason
        };
        return entry;
    },

    _addEntry : function (ID, entry) {
        this.entries[ID] = entry;
    },

    _getEntry : function (ID) {
        return this.entries[ID];
    },

    _removeEntry : function (ID) {
        var entry = this.entries[ID];
        if (entry) {
            delete this.entries[ID];
            this._clearEntryHandlers(entry);
            if (entry.mask) {
                if (entry.formItem) {
                    entry.formItem.form.removePeer(entry.mask);
                }
                entry.mask.destroy();
                entry.mask = null;
            }
        }
        return entry;
    },

    _hasEntries : function () {
        return !isc.isAn.emptyObject(this.entries);
    },

    _setupEntryHandlers : function (entry) {
        if (entry.component && !entry.form) {
            var manager = this,
                component = entry.component,
                mask = entry.mask
            ;
            // stay above the master
            this.observe(component, "setZIndex", function () {
                manager.moveMaskAbove(mask, component);
            });

            // and only show when the master is visible
            this.observe(component, "visibilityChanged", function () {
                manager.updateVisibility(mask, component);
            });
        }
    },

    _clearEntryHandlers : function (entry) {
        if (entry.component) {
            var component = entry.component;
            if (this.isObserving(component, "setZIndex")) {
                this.ignore(component, "setZIndex");
            }

            if (this.isObserving(component, "visibilityChanged")) {
                this.ignore(component, "visibilityChanged");
            }
        }
    },

    moveMaskAbove : function (mask, component) {
        
        if (mask.getZIndex(true) <= component.getZIndex(true)) {
            mask.moveAbove(component);
        }
    },

    updateVisibility : function (mask, component) {
        if (component.isVisible()) {
            mask.show();
        } else {
            mask.hide();
            this._showReasonLabel(null);
        }
    },

    // Show/hide mask
    // ---------------------------------------------------------------------------------------

    overComponent : function (component, state) {
        if (!component) return;
        if (isc.isA.FormItem(component)) {
            return this.overFormItem(component.containerWidget, component, state);
        }
        var entry = this._getEntry(this._getEntryID(component));
        if (entry) {
            if (!entry.mask) {
                entry.mask = this._createMask(entry);
                this._setupEntryHandlers(entry);
            }
            if (!state) {
                // Mouse is not "over" component so make sure mask is showing
                if (component.isVisible()/* && !entry.mask.isVisible()*/) {
                    entry.mask.show();
                    this._showReasonLabel(null);
                }
            } else {
                // Mouse is "over" component so hide the mask but show an indication label
                entry.mask.hide();
                this._showReasonLabel(entry);
            }
        }
    },

    overFormItem : function (form, formItem, state) {
        if (!form || !formItem) return;
        var entry = this._getEntry(this._getEntryID(form, formItem));
        if (entry) {
            if (!entry.mask) {
                entry.mask = this._createMask(entry);
                this._setupEntryHandlers(entry);
            }
            if (!state) {
                // Mouse is not "over" component so make sure mask is showing
                if (form.isVisible() && formItem.isVisible() && !entry.mask.isVisible()) {
                    entry.mask.show();
                    this._showReasonLabel(null);
                }
            } else {
                // Mouse is "over" component so hide the mask but show an indication label
                entry.mask.hide();
                this._showReasonLabel(entry);
            }
        }
    },

    // Mask
    // ---------------------------------------------------------------------------------------

    maskDefaults:{
        backgroundImage: "crosshatch.png",
        backgroundRepeat: "repeat",
        opacity: 50
    },

    hiddenImageDefaults: {
        _constructor: "Img",
        autoDraw: false,
        width:32, height:18,
        imageType: "stretch",
        src: "hiddenComponent32.png",
        snapTo: "R"
    },

    hiddenImageLargeDefaults: {
        _constructor: "Img",
        autoDraw: false,
        width:60, height:32,
        imageType: "stretch",
        src: "hiddenComponent60.png",
        snapTo: "TR"
    },

    _createMask : function (entry) {
        var target = entry.component;
        if (entry.formItem) {
            // Wrap mask with a FormItemVisibilityProxyCanvas because a FormItem
            // is not a canvas and a mask needs a canvas to mirror
            target = isc.FormItemVisibilityProxyCanvas.create({ formItem: entry.formItem });
            // Must add as peer on form to allow z-index to function properly
            entry.form.addPeer(target);
        }

        var props = isc.addProperties({}, this.maskDefaults, this.maskProperties, {
                keepInParentRect: target.keepInParentRect
            }),
            mask = isc.EH.makeEventMask(target, props),
            hiddenImageName = (target.getVisibleHeight() > 32 ? "hiddenImageLarge" : "hiddenImage"),
            hiddenImage = this.createAutoChild(hiddenImageName)
        ;
        mask.addChild(hiddenImage);
        mask.hiddenImage = hiddenImage;

        if (entry.formItem) {
            // Mask is proxy canvas
            target.visibilityMask = mask;
            mask = target;
        }

        return mask;
    },

    // Note: we set the label to autoDraw offscreen, so that getVisibleWidth() returns
    // the correct value when we come to snap it to the edge of the outline for the 
    // first time
    reasonLabelDefaults: {
        _constructor: "Label",
        autoDraw: true, top: -1000, left: -100,
        autoFit: true,
        autoFitDirection:"both",
        padding: 2,
        wrap: false,
        isMouseTransparent: true,
        backgroundColor: "white",
        opacity: 100,
        edgeOffset: 2,

        // Quick flag to indicate to "over" logic that this component is treated special
        _isReasonLabel: true,

        // Slide the label out of the way for a couple of seconds if the user hovers over
        // it for a short while
        mouseOver : function () {
            if (this._movedAway) {
                isc.Timer.clear(this._snapBackTimer);
                this.moveTo(null, this._originalTop);
                this._movedAway = false;
            } else {
                var _this = this;
                this._slideAwayTimer = isc.Timer.setTimeout(function () {
                    _this._slideAway();
                }, 300);
            }
        },
        mouseOut : function () {
            if (this._slideAwayTimer) {
                isc.Timer.clear(this._slideAwayTimer);
                delete this._slideAwayTimer;
            }
        },
        _slideAway : function () {
            isc.Timer.clear(this._snapBackTimer);
            this._movedAway = true;
            this._originalTop = this.getPageTop();
            this.animateMove(null, this.getPageTop() + this.getVisibleHeight() + this.edgeOffset, null, 200);
            var label = this;
            this._snapBackTimer = isc.Timer.setTimeout(function () {
                label.moveTo(null, label._originalTop);
                label._movedAway = false;
            }, 3000);
        }
    },

    _showReasonLabel : function (entry, left, bottom) {
        if (entry) {
            var reasonLabel = this._createReasonLabel("[" + entry.reason + "]");

            // Only show label if the height of the component (i.e. mask) is large enough
            // for it not to cover all the vertical space
            var maskHeight = entry.mask.getVisibleHeight(),
                labelHeight = reasonLabel.getVisibleHeight()
            ;
            if (maskHeight > (labelHeight*2)) {
                var left = entry.mask.getPageLeft(),
                    bottom = entry.mask.getPageBottom()
                ;
                reasonLabel.moveTo(left, bottom - labelHeight - reasonLabel.edgeOffset);
            }
        } else if (this.reasonLabel) {
            // Don't hide the label but move it offscreen
            this.reasonLabel.moveTo(null, -1000);
        }
    },

    _createReasonLabel : function (reason) {
        if (this.reasonLabel) {
            // When reusing label, make sure it starts offscreen
            this.reasonLabel.moveTo(null, -1000)
            this.reasonLabel.setContents(reason);
            return this.reasonLabel;
        }
        this.reasonLabel = this.createAutoChild("reasonLabel", { contents: reason });

        return this.reasonLabel;
    },

    // Mouse event handlers
    // ---------------------------------------------------------------------------------------

    _setupPageMouseHandlers : function () {
        var manager = this;
        if (!this._mouseOverEventId) {
            this._mouseOverEventId = isc.Page.setEvent("mouseOver",
                function (target) { manager._mouseOver(target); });
        }
        if (!this._dropOverEventId) {
            this._dropOverEventId = isc.Page.setEvent("dropOver",
                function (target) { manager._mouseOver(target); });
        }
        if (!this._mouseMoveEventId) {
            this._mouseMoveEventId = isc.Page.setEvent("mouseMove",
                function (target) { manager._mouseMove(target); });
        }
        if (!this._dropMoveEventId) {
            this._dropMoveEventId = isc.Page.setEvent("dropMove",
                function (target) { manager._mouseMove(target); });
        }
    },

    _clearPageMouseHandlers : function () {
        if (this._mouseOverEventId) {
            isc.Page.clearEvent("mouseOver", this._mouseOverEventId);
            delete this._mouseOverEventId;
        }
        if (this._dropOverEventId) {
            isc.Page.clearEvent("dropOver", this._dropOverEventId);
            delete this._dropOverEventId;
        }
        if (this._mouseMoveEventId) {
            isc.Page.clearEvent("mouseMove", this._mouseMoveEventId);
            delete this._mouseMoveEventId;
        }
        if (this._dropMoveEventId) {
            isc.Page.clearEvent("dropMove", this._dropMoveEventId);
            delete this._dropMoveEventId;
        }
    },

    _overStack: [],

    
    _mouseOver : function (target) {
        if (!target) return;
        // Ignore reasonLabel as target
        if (target._isReasonLabel) return;

        // If moving over an eventMask, we want to process the target of the mask
        if (target && target._maskTarget) {
            target = target._maskTarget;
        }

        var isFormItem = false;
        if (isc.isA.FormItemVisibilityProxyCanvas(target)) {
            target = target.formItem;
            isFormItem = true;
        } else if (target && target.getEventItemInfo) {
            var itemInfo = target.getEventItemInfo();
            isFormItem = (itemInfo && itemInfo.overItem);
            target = (isFormItem ? itemInfo.item : target);
        }

        // If target is outside of the container, clear stack showing any masks
        if (target && !this._isCanvasInContainer(target)) {
            while (this._overStack.length > 0) {
                var last = this._overStack.pop();
                this.overComponent(last, false);
            }
            return;
        }

        if (this._overStack.length > 0 && this._overStack[this._overStack.length-1] == target) {
            // Over self - nothing to do
            // This happens when mousing over the "reasonLabel" which is moved out of the way
            // during operation and doesn't affect the masking
            return;
        } else if (this._overStack.length > 1 && this._overStack[this._overStack.length-2] == target) {
            // Over immediate predecessor
            var last = this._overStack.pop();
            this.overComponent(last, false);
        } else if (this._overStack.contains(target)) {
            // Returning over a previous component
            while (this._overStack.length > 0 && this._overStack[this._overStack.length-1] != target) {
                var last = this._overStack.pop();
                this.overComponent(last, false);
            }
        } else {
            // Over a new component or FormItem

            // For overlapping components it is possible to move from a partially hidden
            // form into a modal window for example. The mouse isn't really over the
            // form anymore as far as the masking is concerned so update the mask appropriately.
            var targetTopElement = this._getTopElement(isFormItem ? target.form : target),
                last = (this._overStack.length > 0 ? this._overStack[this._overStack.length-1] : null),
                lastTopElement = (last ? this._getTopElement(isc.isA.FormItem(last) ? last.form : last) : null)
            ;
            if (lastTopElement && lastTopElement != targetTopElement) {
                this.overComponent(last, false);
            } else {
                while (last && !this._isAncestorOf(target, last)) {
                    this.overComponent(last, false);
                    this._overStack.pop();
                    last = (this._overStack.length > 0 ? this._overStack[this._overStack.length-1] : null);
                }
            }

            // Record new "over" component
            this._overStack.push(target);

            // Enable/disable _mouseMove processing
            this._isOverFormItem = isFormItem;
        }

        // Ignore reasonLabel as target
        if (target._isReasonLabel) return;

        this.overComponent(target, true);
    },

    _mouseMove : function (target) {
        // mouseMove event is only needed once the mouse is detected over a FormItem
        // to determine when the FormItem is exited. 
        if (!this._isOverFormItem) return;

        // If moving over an eventMask, we want to process the target of the mask
        if (target && target._maskTarget) {
            target = target._maskTarget;
        }

        var itemInfo,
            item
        ;
        if (isc.isA.FormItemVisibilityProxyCanvas(target)) {
            item = target.formItem;
        } else if (target && target.getEventItemInfo) {
            itemInfo = target.getEventItemInfo();
            item = (itemInfo && itemInfo.overItem ? itemInfo.item : null);
        }

        var last = (this._overStack.length > 0 ? this._overStack[this._overStack.length-1] : null),
            lastItem = (last && isc.isA.FormItem(last) ? last : null)
        ;
        if (item && item != lastItem) {
            if (lastItem) {
                this.overComponent(lastItem, false);

                this._overStack.pop();
            }
            if (item) {
                this._overStack.push(item);
                this.overComponent(item, true);
            } else {
                this._isOverFormItem = false;
            }
        } else if (lastItem && !item) {
            this.overComponent(lastItem, false);

            this._overStack.pop();
            last = (this._overStack.length > 0 ? this._overStack[this._overStack.length-1] : null),

            this._isOverFormItem = false;
        }
    },

    _getTopElement : function (target) {
        var topElement;
        if (target && target.getParentElements) {
            var parents = target.getParentElements();
            for (var i = 0; i < parents.length; i++) {
                var parent = parents[i];
                if (parent == this.container) break;
                topElement = parent;
            }
        }
        return topElement;
    },

    _isCanvasInContainer : function (target) {
        return this._isAncestorOf(target, this.container);
    },

    _isAncestorOf : function (canvas, target) {
        if (isc.isA.FormItem(canvas)) {
            if (canvas.form == target) return true;
            canvas = canvas.form;
        }
        if (canvas && canvas.getParentElements) {
            var parents = canvas.getParentElements();
            if (parents.contains(target)) return true;
        }
    }
});
