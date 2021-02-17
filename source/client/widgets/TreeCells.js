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
isc.ListGrid.addProperties({
    
iconPadding:3,
_$closeTreeCellTable:"</tr></tbody></table>",
_$semi:";",

// Undocumented flag to shift to tree-cell rendering which doesn't require nested tables

writeTreeCellTable:true,

getTreeCellHoverHTML : function (record, rowNum, colNum) {
    // return the hoverHTML for cells in the TreeField - includes node icon and title only
    var cellCSSText = this.getCellCSSText(record,rowNum,colNum);

    // Call the standard ListGrid.getCellValue() method to give us the formatted title
    // of the cell being hovered, excluding the TreeGrid folder/file icons, etc.
    var value = this.invokeSuper(isc.TreeGrid, "getCellValue",  record, rowNum, colNum);

    // Now use _getTreeCellTitleArray() to tack on the icon for the node.
    var titleCell = this._getTreeCellTitleArray(
                        value, record, rowNum, colNum, false, null, cellCSSText ).join(isc.emptyString);

    return ["<table><tr>", titleCell, "</tr></table>"].join(isc.emptyString);
},

getTreeCellValue : function (value, record, recordNum, fieldNum, gridBody) {
    // This returns HTML to achieve
    //  - an indent equal to what level of the tree you're viewing
    //  - open / close icon
    //  - an optional additional icon
    //  - Folder / Record icon
    //  - title for the cell.

    // If passed a null or LOADING record just return the value passed in.
    if (record == null || Array.isLoading(record)) {
        return value;
    }

    
    var tree = this._treeData || this.data;

    if (this.writeTreeCellTable) {
        // get the level of the node
        var level = tree.getLevel(record, recordNum),    
            template = isc.TreeGrid._getTreeCellTemplate(),
            cssText = this.getCellCSSText(record, recordNum, fieldNum),
            styleName = this.getCellStyle(record, recordNum, fieldNum);
        
        template[1] = styleName;
        template[3] = (this._fixTitleWidth()
                       ? "table-layout:fixed;width:100%;" + (cssText != null ? cssText : "")
                       : cssText);

        // catch custom css text with no closing ";"
        if (template[3] != null && !template[3].endsWith(this._$semi)) template[3] += this._$semi;

        // styling for indent cell
        template[9] = cssText;
        template[11] = styleName;

        
        var indentInfo = this.getIndentHTML(level, record, recordNum, true);
        template[5] = indentInfo[1];
        template[13] = indentInfo[0];

        // Get the HTML for the icons and title from _getTreeCellTitleArray(), and fold them
        // into our template
        var titleCellTemplate = this._getTreeCellTitleArray(value, record, recordNum, 
                                    fieldNum, this.shouldShowOpenerIcon(), 
                                    styleName, cssText, template, 7);
        for (var i = 0, j = 15; i < titleCellTemplate.length; i++) {
            template[j] = titleCellTemplate[i];
            j++;
        }
        template[j] = this._$closeTreeCellTable;
        
        return template.join(isc.emptyString);
        
    // alternative version which avoids writing out a nested HTML table
    
    } else {
        // get the level of the node
        var level = tree.getLevel(record);

        var template = [
            // indent div
            "<DIV style='display:table-cell;vertical-align:middle;margin:0px;padding:0px;width:",     // [0]
            ,                                                           // [1] indent div width
            "px;'>",                                                    // [2]
            ,                                                           // [3] indent HTML
            // icon div
            "</DIV><DIV style='display:table-cell;vertical-align:middle;margin:0px;padding:0px;width:", // [4]
            ,                                                           // [5] icon div width
            "px;'>",                                                    // [6]
            ,                                                           // [7] icon HTML
            // content div
            "</DIV><DIV style='display:table-cell;vertical-align:middle;margin:0px;", // [8]
            (isc.Page.isRTL() ? "padding-left:1px;padding-right:"
                              : "padding-right:1px;padding-left:"),     // [9]
            ,                                                           // [10] iconPadding
            "px;' ",                                                       // [11]
            ,                                                           // [12] optional ID='
            ,                                                           // [13] optional content element ID
            ,                                                           // [14] optional close-quote
            ">",                                                        // [15]
            ,                                                           // [16] optional clipper-div start
            ,                                                           // [17] cell value
            ,                                                           // [18] optional clipper-div end
            "</DIV>"
        ];
        
        // -- Indent Div
        var indentInfo = this.getIndentHTML(level, record, recordNum, true),
            indentDivWidth = indentInfo[1];
        template[1] = indentDivWidth;
        template[3] = indentInfo[0];


        // -- Icon Div
        var iconCellWidth = 0;

        // open icon (inc width)
        var openIconHTML = isc.emptyString;
        // Note: if this.showOpener is false, we may still use the icon to render out
        // connectors, etc
        if (this.shouldShowOpenerIcon()) {
            var openIcon = this.getOpenIcon(recordNum),
            openIconWidth = this.getOpenerIconWidth(record);
            // ignore configured height in showConnectors mode, so icon stretches.  Otherwise
            // lines are not continuous
            var openIconHeight = this.showConnectors ? this.cellHeight : this.getOpenerIconHeight(record),
                openerID = (recordNum != null ? this._openIconIDPrefix+recordNum : null);
            if (openIcon) {
                openIconHTML = this.getIconHTML(openIcon, openerID, openIconWidth, null, openIconHeight);
            } else {
                openIconHTML = this._indentHTML(openIconWidth || this.iconSize);
            }
            iconCellWidth += openIconWidth;
        }

        // checkbox or extra icon
        var checkboxIcon = this._getCheckboxIcon(record, recordNum),
            extraIcon = checkboxIcon || this.getExtraIcon(record),
            extraIconID = (recordNum != null ? this._extraIconIDPrefix+recordNum : null),
            extraIconSize = (checkboxIcon != null ?  this._getCheckboxFieldImageWidth() : this.iconSize),
            extraIconGap = this.extraIconGap,
            extraIconHTML = isc.emptyString
        ;
        // extra icon if there is one
        if (extraIcon) {
            extraIconHTML = this.getIconHTML(extraIcon, extraIconID, extraIconSize, extraIconGap);
            iconCellWidth += extraIconSize + extraIconGap;
        }

        // folder or file icon (from getIcon())
        var icon = this.getIcon(record, recordNum),
            iconID = (recordNum != null ? this._iconIDPrefix+recordNum : null),
            mainIconHTML = isc.emptyString
        ;
        if (icon != null) {
            mainIconHTML = this.getIconHTML(icon, iconID, record.iconSize);
            iconCellWidth += (record.iconSize || this.iconSize);
        }
        template[5] = iconCellWidth;    // icon div width
        template[7] = openIconHTML + extraIconHTML + mainIconHTML;  // icon HTML

        // -- Actual value div
        
        template[10] = this.getIconPadding(record);    // icon padding applied to the left of the value 'cell'
        
        // When ARIA is enabled, set an ID on the value cell so that we can reference it.
        // We also use this ID to determine if we clipped our cell value
        if (isc.Canvas.ariaEnabled() || this._fixTitleWidth()) {
            template[12] = " id='";
            template[13] = this._getTreeCellValueID(recordNum);
            template[14] = "'";
        } else {
            template[12] = template[13] = template[14] = null;
        }

        if (this._fixTitleWidth()) {
        
            // helper to get the px available for the title
            var width = this.getTreeFieldInnerWidth(fieldNum) 
                        - (iconCellWidth + indentDivWidth);
            template[16] = "<div style='width:" +
                             width + "px;overflow:hidden;" +
                             isc.Browser._textOverflowPropertyName + ":ellipsis' _titleClipper='true'>";
            template[17] = value;
            template[18] = "</div>";

        } else {
            template[16] = template[18] = null;
            template[17] = value;
        }
        
        
        return template.join(isc.emptyString);    
    }
},

shouldShowOpenerIcon : function () {
    // Note if showOpener is false, but showConnectors is true, we still want
    // to show an "opener icon" by the node folder or leaf icon - it's just going to
    // be the end of a connector line
    return this.showOpener || this.showConnectors; 
},

_getTreeCellValueID : function (recordNum) {
    return this.ID + "_"+"valueCell" + recordNum;
},

// _getTreeCellTitleArray() - helper method for getTreeCellValue() to return the
// "title" portion of the treeCell value - that is: the icons and the title, without
// any indent

_getTreeCellTitleArray : function (value, record, recordNum, fieldNum, showOpener,
                                   cellStyle, cellCSSText, treeCellTemplate, iconCellWidthOffset) {

    var iconCellWidth = 0;

    if (cellCSSText == null) cellCSSText = this.getCellCSSText(record, recordNum, fieldNum);
    if (cellCSSText == null) cellCSSText = isc.emptyString;
    else cellCSSText += ";";
    if (!this.wrapCells) cellCSSText += "white-space:nowrap;";
    if (cellStyle == null) cellStyle = this.getCellStyle(record, recordNum, fieldNum);

    var template = isc.TreeGrid._getTreeCellTitleTemplate();
    template[1] = cellCSSText;
    template[3] = cellStyle;
    if (showOpener) {
        // opener icon (or small indent)
        var openIcon = this.getOpenIcon(recordNum),        
            openIconWidth = this.getOpenerIconWidth(record),
            // ignore configured height in showConnectors mode, so icon stretches.  Otherwise
            // lines are not continuous
            openIconHeight = this.showConnectors ? this.cellHeight : this.getOpenerIconHeight(record),
            openerID = (recordNum != null ? this._openIconIDPrefix+recordNum : null);
        if (openIcon) {
            template[5] = this.getIconHTML(openIcon, openerID, openIconWidth, null, openIconHeight);
            iconCellWidth += openIconWidth;
        } else {
            template[5] = this._indentHTML(openIconWidth || this.iconSize);
            iconCellWidth += openIconWidth;
        }
    } else template[5] = null;
    var checkboxIcon = this._getCheckboxIcon(record),
        extraIcon = checkboxIcon || this.getExtraIcon(record),
        extraIconID = (recordNum != null ? this._extraIconIDPrefix+recordNum : null),
        extraIconSize = (checkboxIcon != null ?  this._getCheckboxFieldImageWidth() : this.iconSize),
        extraIconGap = this.extraIconGap,
        icon = this.getIcon(record, recordNum),
        iconID = (recordNum != null ? this._iconIDPrefix+recordNum : null)
    ;

    // extra icon if there is one
    if (extraIcon) {
        template[6] = this.getIconHTML(extraIcon, extraIconID, extraIconSize, extraIconGap);
        iconCellWidth += extraIconSize + extraIconGap;
    } else template[6] = null;
    // folder or file icon
    template[7] = this.getIconHTML(icon, iconID, record.iconSize);
    iconCellWidth += icon == null ? 0 : (record.iconSize || this.iconSize);

    // When ARIA is enabled, set an ID on the value cell so that we can reference it.
    if (isc.Canvas.ariaEnabled()) {
        template[9] = " id='" + this._getTreeCellValueID(recordNum) + "'";
    } else {
        template[9] = null;
    }
    template[11] = cellCSSText;
    if (this._fixTitleWidth()) {
        template[11] += "overflow:hidden;" + isc.Browser._textOverflowPropertyName +
                       ":ellipsis";
    }
    
    template[13] = this.getIconPadding(record);
    template[15] = cellStyle;

    if (isc.Browser.isIE && isc.Browser.version < 10 && !this.wrapCells) {
        template[17] = "<NOBR>";
        template[19] = "</NOBR>";

    
    } else if (this._fixTitleWidth() && isc.Browser.isMoz && isc.Browser.version < 21) {
        template[17] = "<div style='overflow:hidden;text-overflow:ellipsis' _titleClipper='true'>";
        template[19] = "</div>";
    } else {
        template[19] = template[17] = null;
    }

    template[18] = value;

    if (treeCellTemplate) {
        // This is the slot in the tree-cell template that governs the width specification
        // for the icon column (applied to the <col...> entry in the colgroup)
        

        treeCellTemplate[iconCellWidthOffset] = iconCellWidth;
    }
    return template;
},

getIconPadding : function (record) {
    // Support custom icon padding for specific nodes
    if (this.iconPaddingProperty != null && record != null && 
            record[this.iconPaddingProperty] != null) 
    {
        return record[this.iconPaddingProperty];
    }
    // Support custom padding for folders in Trees
    if (this.folderIconPadding != null && this.data && this.data.isFolder && 
        this.data.isFolder(record)) 
    {
        return this.folderIconPadding;
    }
    return this.iconPadding;
},

_fixTitleWidth : function () {
    var treeField = this.getTreeFieldNum(),
        frozen = this.fields[treeField] && this.fields[treeField].frozen,
        gettingAutoSize = 
            frozen ? (this.frozenBody && this.frozenBody._gettingAutoSizeHTML) 
                    : (this.body && this.body._gettingAutoSizeHTML);
    return this.fixedFieldWidths && !gettingAutoSize;
},

//> @method treeGrid.getTreeFieldNum()  (A)
//      Return the number of the tree field for this treeGrid.
//
//      @return (number)    Number for the tree node.
//<
getTreeFieldNum : function () { return this._treeFieldNum; },


_getFollowingSiblingLevels : function (record, level) {
    return this.data._getFollowingSiblingLevels(record);
},

//> @method treeGrid.getIndentHTML() (A)
// Return the HTML to indent a record
// @param level  (number)   indent level (0 == root, 1 == first child, etc)
// @param record (TreeNode) record for which we're returning indent HTML
//
// @return (HTMLString) HTML to indent the child
//<
getIndentHTML : function (level, record, recordNum, returnCellWidth) {
    var drawLevel = level;
    if (!this.showRoot) drawLevel--;

    var indentWidth = (this.showConnectors ? this.getOpenerIconWidth(record) : this.indentSize),
        
        shift1px = this.isPrinting || isc.Browser.isIE || isc.Browser.isOpera || isc.Browser.isEdge,
        indentCellWidth = (shift1px ? 1 : 0);

    // If showFullConnectors is true we need to write out vertical connector lines between 
    // ancestors who are siblings.
    
    if (this.showConnectors && this.showFullConnectors) {
        // assume the level passed in is correct
        //var level = this.data.getLevel(record),
        var levels = this._getFollowingSiblingLevels(record, level);
        // we don't care about the innermost level (connector written out as part of opener icon)
        levels.remove(level);        
        if (!this.showRoot) levels.remove(0);
        if (levels.length != 0) {
            if (!this._ancestorConnectorHTML) {
                var state = "ancestor",
                    selectedState = "ancestor_selected";
                    
                if (this.isRTL()) {
                    state += "_rtl";
                    selectedState += "_rtl";
                }
                
                
                var connectorURL = isc.Img.urlForState(this.connectorImage, null, null,
                                                        state),
                    selectedConnectorURL = isc.Img.urlForState(this.connectorImage, null, null,
                                                        selectedState),
                    connectorHTML = this.getIconHTML(connectorURL, null,
                                        this.getOpenerIconWidth(record), null,
                                        this.cellHeight),
                    selectedConnectorHTML = this.getIconHTML(selectedConnectorURL, null,
                                        this.getOpenerIconWidth(record), null,
                                        this.cellHeight);
                                        
                this._ancestorConnectorHTML = connectorHTML;
                this._selectedAncestorConnectorHTML = selectedConnectorHTML;
            }
            
            
            var singleIndent = this._indentHTML(indentWidth),
                indent = isc.StringBuffer.create(isc.emptyString),
                selected = this.showSelectedOpener && this.isSelected(record, recordNum)
            ;

            // explicit NOBR tag required in IE6 to ensure the indents don't wrap
            // when they run out of horizontal space 
            indent.append("<NOBR>");
            var firstLevel = (this.showRoot ? 0 : 1);
            for (var i = firstLevel; i < level; i ++) {                
                if (levels.contains(i)) {
                      if (shift1px && firstLevel == i) indent.append(this._indentHTML(1));
                    indent.append(selected ? this._selectedAncestorConnectorHTML 
                                            : this._ancestorConnectorHTML);
                } else {
                    indent.append(singleIndent);
                }
                indentCellWidth += indentWidth;
            }
            indent.append("</NOBR>");
            indent = indent.release(false);

            if (returnCellWidth)
                return [indent, indentCellWidth];
            else
                return indent;
        }
    }
    indentCellWidth = drawLevel * indentWidth;
    if (shift1px) indentCellWidth = Math.max(1, indentCellWidth);
    var indentHTML = this._indentHTML(indentCellWidth);
    
    if (isc.Browser.isIE9 || (isc.Browser.isStrict && (isc.Browser.isIE7 || isc.Browser.isIE8))) {
        indentHTML = "<NOBR>" + indentHTML + "</NOBR>";
    }
    if (returnCellWidth) {
        return [indentHTML, indentCellWidth];
    } else {
        return indentHTML;
    }
},


_indentHTML : function (numPixels) {
    if (numPixels == 0) return isc.emptyString;

    var cache = isc.TreeGrid._indentHTMLCache;
    if (cache == null) cache = isc.TreeGrid._indentHTMLCache = {};

    if (cache[numPixels] == null) cache[numPixels] = isc.Canvas.spacerHTML(numPixels, 1);

    return cache[numPixels];
},

_$checkbox:"checkbox",
_getCheckboxIcon : function (record, recordNum) {
    var icon = null;      
    if (this.selectionAppearance == this._$checkbox) {
        var isSel = this.selectionManager.isSelected(record, recordNum) ? true : false;
        var isPartSel = (isSel && this.showPartialSelection &&
                    this.selectionManager.isPartiallySelected(record)) ? true : false;
        // checked if selected, otherwise unchecked        
        icon = isPartSel ? (this.checkboxFieldPartialImage || this.booleanPartialImage)
                             : isSel ? (this.checkboxFieldTrueImage || this.booleanTrueImage)
                                     : (this.checkboxFieldFalseImage || this.booleanFalseImage);
        if (!this.body.canSelectRecord(record)) {
            if (this.showDisabledSelectionCheckbox) {
                // show the disabled checkbox, making sure to capture the
                // disabled state
                if (icon != this._$blank) icon = isc.Img.urlForState(icon, null, null, "Disabled");
            } else {
                if (this.leaveSelectionCheckboxGap) {
                    // record cannot be selected but we want
                    // the space allocated for the checkbox anyway.
                    icon = isc.Canvas._blankImgURL;
                } else {
                    // leaving no gap looks better in some cases (EG showConnectors
                    // set to true)
                    icon = null;
                }
            }
        }
        if (icon == this._$blank) icon = isc.Canvas._blankImgURL;
    }
    return icon;
},

//> @method treeGrid.getExtraIcon() (A)
// Get an additional icon to show between the open icon and folder/node icon for a particular 
// node.
// <P>
// NOTE: If +link{listGrid.selectionAppearance} is <code>"checkbox"</code>, this method will
// NOT be called. Extra icons cannot be shown for that appearance.
//
// @param   node (TreeNode) tree node in question
// @return  (URL)       URL for the extra icon (null if none required)
//
// @visibility external
//<
getExtraIcon : function (record) {
    // Default trees don't make use of this.
    return null;
},

//> @attr treeGrid.showNodeIcons (Boolean : true : IRW)
// Should nodes in this TreeGrid show folder / leaf node icons by default?
// <P>
// May be overridden for folder nodes via +link{treeGrid.showFolderIcons}
// <P>
// See +link{treeGrid.getIcon()} for more details on treeGrid icons
// 
// @visibility external
//<
showNodeIcons:true,

//> @attr treeGrid.showFolderIcons (Boolean : null : IRW)
// Should folder nodes in this TreeGrid show icons by default?
// <P>
// If unset, folder node icons will be shown if +link{treeGrid.showNodeIcons} is true
// <P>
// See +link{treeGrid.getIcon()} for more details on treeGrid icons
// 
// @visibility external
//<
//showFolderIcons:null,

//> @method treeGrid.getIcon()
// Get the appropriate icon for a node.
// <P>
// By default icons are derived from +link{folderIcon} and +link{nodeIcon}.
// Custom icons for individual nodes can be overridden by setting the +link{customIconProperty}
// on a node.
// <P>
// To suppress icons altogether, set +link{showNodeIcons,showNodeIcons:false}, or, 
// for folder icons only +link{showFolderIcons,showFolderIcons:false}.<br>
// You can also provide an override of this method that returns null to suppress icons for
// specific nodes.
// <p> 
// Note that the full icon URL will be derived by applying +link{Canvas.getImgURL()} to the
// value returned from this method.
//
// @param   node (TreeNode) tree node in question
// @param   [rowNum] (Integer) the row number of the node in the TreeGrid.  This additional 
//                             context is required for +link{tree.multiLinkTree,multi-link trees}
//                             because the same node can appear in multiple places
// @return  (URL)       URL for the icon to show for this node
// @visibility external
//<
getIcon : function (node, rowNum, defaultState) {
    if (isc.isA.Number(node)) {
        rowNum = node;
        node = this.data.get(node);
    }
    if (!node) return null;

    var tree = this._treeData || this.data,
        icon = node[this.customIconProperty],
        customIcon = (icon != null),
        isFolder = tree.isFolder(node),
        suppressIcon = (isFolder && this.showFolderIcons != null) 
                        ? !this.showFolderIcons : !this.showNodeIcons;
    
    if (suppressIcon) return null;
  
    if (!customIcon) {
        if (isFolder) icon = this.folderIcon;
        else icon = this.nodeIcon;
    }

    var state;
    if (isFolder) {
        // Default folder icon is the 'closed' icon. This will be used for dragTrackers, etc
        // Note: check for the special _willAcceptDrop flag set by updateDropFolder() - when a
        // user hovers over a folder for a while, we spring it open, and that causes a redraw,
        // but the folder is not necessarily droppable.
        var nodeLocator;
        if (tree.isMultiLinkTree()) {
            nodeLocator = tree.getNodeLocator(rowNum);
        }
        var isDrop = defaultState ? false : (this.lastDropFolder == node && node._willAcceptDrop),
            isOpen = defaultState ? false : !!tree.isOpen(nodeLocator || node),
            isLoading = tree.getLoadState(node) == isc.Tree.LOADING;
            
        if (isLoading && this.showLoadingIcons) {
            return this.loadingIcon;
        } else if (isDrop) {
            // backCompat - respect old dropIcon / folderDropImage if specified
            if (node.dropIcon != null) {
                icon = node.dropIcon;
            } else if (!customIcon && this.folderDropImage != null) {
                icon = this.folderDropImage;
            } else {
                var showDrop;
                if (customIcon) {
                    showDrop = node[this.customIconDropProperty];
                    if (showDrop == null) showDrop = this.showCustomIconDrop;
                } else { 
                    showDrop = this.showDropIcons;
                }
                if (showDrop) state = this.dropIconSuffix;
            }
        } else if (isOpen) {
                
            // backCompat - respect old openIcon / folderOpenImage if specified
            if (node.openedIcon != null) icon = node.openedIcon;
            else if (!customIcon && this.folderOpenImage != null) icon = this.folderOpenImage;
            // Don't override already set drop state
            else {
                var showOpen;
                if (customIcon) {
                    showOpen = node[this.customIconOpenProperty];
                    if (showOpen == null) showOpen = this.showCustomIconOpen;
                } else {
                    showOpen = this.showOpenIcons;
                }
                if (showOpen) state = this.openIconSuffix;                
                
                else if (!customIcon) state = this.closedIconSuffix;
            }
        } else {
            
            // Respect old 'folderClosedImage' if specified
            // Otherwise - if the icon is not custom, append "_closed" state
            
            if (!customIcon) {
                if (this.folderClosedImage) icon = this.folderClosedImage;
                else state = this.closedIconSuffix;
            }
        }
    // not a folder:
    } else {
        // Pick up the old 'fileImage' for back compat, if specified.
        if (!customIcon && this.fileImage) icon = this.fileImage;
    }
    
    
    // If the node is selected we may need to append a "selected" suffix
    if (this.isSelected(node, rowNum, true)) {
        var showSelected;
        if (customIcon) {
            showSelected = node[this.customIconSelectedProperty];
            if (showSelected == null) showSelected = this.showCustomIconSelected;
        } else {
            showSelected = this.showSelectedIcons;
        }
        if (showSelected) {
            if (state == null || isc.isAn.emptyString(state)) state = this.selectedIconSuffix;
            else state += "_" + this.selectedIconSuffix;
        }
    }
    
    return icon == null ? null : isc.Img.urlForState(icon, false, false, state);
},

// helper method - caches generated image templates on a per-draw basis for faster html generation.
_getIconHTMLCacheKey : function (icon, iconWidth, extraRightMargin, iconHeight) {
    return icon + "#w=" + iconWidth + ",extraRightMargin=" + extraRightMargin + ",h=" + iconHeight;
},
_$absMiddle: "absmiddle",

getIconHTML : function (icon, iconID, iconWidth, extraRightMargin, iconHeight) {

    if (icon == null) return isc.emptyString;

    
    if (isc.isAn.Object(icon)) {
        icon = isc.Img.urlForState(icon);
    }

    if (iconWidth == null) iconWidth = this.iconSize;
    if (iconHeight == null) iconHeight = iconWidth;

    // make sure the iconHTML cache exists
    // Note this method can fire before drawCache has been set up due to autoSize logic
    // requesting cell HTML before body draw. If this occurs, just default the
    // cache object.
    if (this._drawCache == null) {
        this._drawCache = {};
    }
    var cache = this._drawCache.iconHTML;
    if (cache == null) cache = this._drawCache.iconHTML = {};

    // if not in cache, generate and store - keyed by the image src
    var cacheKey = this._getIconHTMLCacheKey(icon, iconWidth, extraRightMargin, iconHeight),
        template = cache[cacheKey];
    if (template == null) {
        

        var extraCSSText;
        if (extraRightMargin) {
            
            extraCSSText = (this.isRTL() ? "margin-left:" : "margin-right:") + extraRightMargin + "px";
        }
        template = cache[cacheKey] = this._getImgHTMLTemplate({
            src: icon,
            width: iconWidth,
            height: iconHeight,
            name: iconID,
            align: this._$absMiddle,
            extraCSSText: extraCSSText,
            
            generateSpan: isc.Canvas._generateSpanForBlankImgHTML
        });
    }

    // Note: We need to update the image ID for each icon - the template itself
    // tells us which slot this is in the strings array (see Canvas.imgHTML())
    template[template._idSlot] = iconID;

    return template.join(isc._emptyString);
},



// Insert after last child if we're not allowed to drop a new root node, drop occurs directly
// on a folder that's open and is a child of the root node, and the drop position is "after".
_dropAfterLastChild : function (position, dropItem, newParent) {
    if (this.canDropRootNodes) return false;
    if (dropItem != newParent) return false;

    var data = this._treeData || this.data, 
        parent = data.getParent(dropItem);
    return data.isRoot(parent) && data.isOpen(dropItem) && position == isc.ListGrid.AFTER;    
},


dropTreeNode : function () {
    if (!this.willAcceptDrop()) return false;

    var treeData = this._treeData || this.data;

    // NOTE: we perform some redundant checks with willAcceptDrop(), but this is not a time
    // critical method, and the errors being checked for would corrupt the Tree and so should
    // never be allowed, so it makes sense to check them here as well since willAcceptDrop()
    // might be incorrectly overidden.

    // get what was dropped and where it was dropped
    var moveList = isc.EH.dragTarget.cloneDragData(),
        recordNum = this.getEventRecordNum(null, true),
        position = this.getRecordDropPosition(recordNum),
        dropItem = recordNum < 0 ? null : this.data.get(recordNum),
        newParent = this.getDropFolder();

    var newParentNodeLocator;
    if (treeData.isANodeLocator(newParent)) {
        newParentNodeLocator = newParent;
        newParent = newParent.node;
    }

    // dropping in the body in open space means add to root
    if (!dropItem) dropItem = treeData.getRoot();

    //this.logWarn("valid drop with parent: " + this.echo(newParent));

    // figure out if this is a drag within the same Tree data model.  This can happen within the
    // same TreeGrid or across two TreeGrids.
    var dragTree = isc.EH.dragTarget.getData(),
        dragWithinTree = ( isc.isA.Tree(dragTree) && 
                           isc.isA.Tree(treeData) && 
                           dragTree.getRoot() == treeData.getRoot() );
    // make sure that they're not trying to drag into parent containing child with same name.
    // NOTE: this particular check is postponed until drop() because it's not self-evident why
    // the widget won't accept drop, so we want to warn() the user
    
    for (var i = 0; i < moveList.length; i++) {
        
        var child = moveList[i];

        // Forbid dropping two occurences of the same node if allowDuplicateChildren is not set
        if (treeData.isMultiLinkTree() && !treeData.allowDuplicateChildren) {
            for (var n = i+1; n < moveList.length; n++) {
                if (moveList[n].node == child.node) {
                    isc.warn(this.cantDragMultipleNodeOccurencesMessage);
                    return false;
                }
            }
        }

        // NOTE: If dragging in from another tree - set dragDataAction to "copy" to test the
        // code below, otherwise you end up with 2 trees pointing at the same object

        // name collision: see if there's already a child under the newParent that has the same
        // name as the child we're trying to put under that parent
        var collision = (treeData.findChildNum(newParent, treeData.getName(child)) != -1);

        // this collision is not a problem if we're reordering under the same parent
        // Or this is a multiLink tree and allowDuplicateChildren is set
        var legalReorder = dragWithinTree && this.canReorderRecords && 
                            newParent == treeData.getParent(child);
        if (collision && !legalReorder  && (!treeData.isMultiLinkTree() || !treeData.allowDuplicateChildren)) {
            this.logInfo("already a child named: " + treeData.getName(child) + 
                         " under parent: " + 
                         (treeData.isMultiLinkTree() ? 
                            treeData.getPathForOpenListIndex(recordNum) :
                            treeData.getPath(newParent)
                         )
            );
            isc.warn(this.parentAlreadyContainsChildMessage);
            return false;
        }            
    }

    // At this point, everything looks OK and we are accepting the drop 

    // figure out where the dropped should be placed in the parent's children 
    var index = null;
    if (this.canReorderRecords) {
        if (recordNum < 0 || this._dropAfterLastChild(position, dropItem, newParent)) {
            // already set dropItem to root
            newParent = dropItem;
            // special case: dropped in empty area of body, make last child of root
            index = treeData.getChildren(newParent).getLength();
        } else if (dropItem == newParent) {
            // if dropped directly on a folder, place at beginning of children
            index = 0;
        } else {
            // otherwise place before or after leaf's index within parent
            index = (position == isc.ListGrid.BEFORE ? 0 : 1) + 
                        treeData.getChildren(newParent).indexOf(dropItem);
        }
    }
    
    var dropPosition = position;
    // if onFolderDrop exists - allow it to cancel the drop
    
    if (this.onFolderDrop != null &&  
        (this.onFolderDrop(moveList,newParent,index,dropPosition,isc.EH.dragTarget) == false)) return false;
    
    this.folderDrop(moveList, newParentNodeLocator || newParent, index, isc.EH.dragTarget);

    // open the folder the nodes were dropped into
    treeData.openFolder(newParentNodeLocator || newParent);
            
    // return false to cancel further event processing
    return false;
},

//> @method treeGrid.recordDrop()
// The superclass event +link{listGrid.recordDrop} does not fire on a TreeGrid, use
// +link{folderDrop} instead.
//
// @visibility external
//<

//> @method treeGrid.folderDrop() [A]
//
// Process a drop of one or more nodes on a TreeGrid folder.
// <smartclient>
// <P>
// This method can be overridden to provide custom drop behaviors and is a more appropriate
// override point than the lower level +link{Canvas.drop()} handler.
// </smartclient>
// <smartgwt>
// Add logic in your drop handler to perform custom drop behaviors; to suppress the built-in 
// behavior described below, use <code>event.cancel()</code>
// </smartgwt>
// <P>
// The default behavior is to simply delegate to the +link{transferNodes()} method; thus, the 
// correct way to perform a programmatic folder drop, with all the built-in behaviors described
// below, is to call <code>transferNodes()</code>
// <P>
// If this is a self-drop, nodes are simply reordered. An "update" operation will
// be submitted to update the +link{tree.parentIdField,parentId} field of the moved node(s). 
// <P>
// For a drop from another widget, +link{treeGrid.transferDragData()} is called which,
// depending on the +link{TreeGrid.dragDataAction,dragDataAction} specified on the source
// widget, may either remove the source nodes from the original list (<code>dragDataAction:"move"</code>)
// or just provide a copy to this tree (<code>dragDataAction:"copy"</code>).
// <P>
// In either case the new row(s) appear in the <code>folder</code> at the <code>index</code>
// specified by the arguments of the same name.
// <P>
// If this grid is databound, the new nodes will be added to the dataset by calling
// +link{dataSource.addData()}.  Further, if the new nodes were dragged from another
// databound component, and +link{DataBoundComponent.addDropValues,addDropValues}
// is true, +link{DataBoundComponent.getDropValues,getDropValues} will be called for every item
// being dropped.
// <P>
// As a special case, if the <code>sourceWidget</code> is also databound and a
// +link{dataSourceField.foreignKey,foreignKey} relationship is declared from the
// <code>sourceWidget</code>'s DataSource to this TreeGrid's DataSource, the interaction will
// be treated as a "drag recategorization" use case such as files being placed in folders,
// employees being assigned to teams, etc.  "update" DSRequests will be submitted that
// change the foreignKey field in the dropped records to point to the tree folder that was the
// target of the drop.  In this case no change will be made to the Tree data as such, only to
// the dropped records. 
// <P>
// For multi-record drops, Queuing is automatically used to combine all DSRequests into a
// single HTTP Request (see QuickStart Guide, Server Framework chapter).  This allows the
// server to persist all changes caused by the drop in a single transaction (and this is
// automatically done when using the built-in server DataSources with Power Edition and
// above).
// <P>
// If these default persistence behaviors are undesirable, 
// <smartclient>return false to cancel them</smartclient>
// <smartgwt>use <code>event.cancel()</code></smartgwt>, then implement your own behavior, 
// typically by using grid.updateData() or addData() to add new records.
// <p><b>NOTE:</b> the records you receive in this event are the actual Records from the source
// component.  Use +link{DataSource.copyRecords()} to create a copy before modifying the records
// or using them with updateData() or addData().
//
// @param nodes (Array of TreeNode) List of nodes being dropped
// @param folder (TreeNode) The folder being dropped on
// @param index (int) Within the folder being dropped on, the index at which the drop is
//                    occurring.  Only passed if +link{treeGrid.canReorderRecords,
//                    canReorderRecords} is true.
// @param sourceWidget (Canvas) The component that is the source of the nodes (where the nodes
//                              were dragged from)
//
// @see method:transferNodes
// @visibility external
// @example treeDropEvents
//<
folderDrop : function (nodes, folder, index, sourceWidget, callback) {
    
    this.transferNodes(nodes, folder, index, sourceWidget, callback);
},

//> @method treeGrid.transferNodes() [A]
//
// Transfer a list of +link{TreeNode}s from another component (does not have to be a databound
// component) into this component.  This method is only applicable to list-type components,
// such as +link{ListGrid,listGrid}, +link{TreeGrid,treeGrid} or +link{TileGrid,tileGrid}.
// <P>
// This method implements the automatic drag-copy and drag-move behavior and calling it is
// equivalent to completing a drag and drop of the <code>nodes</code> (the default 
// +link{folderDrop()} implementation simply calls <code>transferNodes()</code>)
// <P>
// Note that this method is asynchronous - it may need to perform server turnarounds to prevent
// duplicates in the target component's data.  If you wish to be notified when the transfer
// process has completed, you can either pass the optional callback to this method or implement
// the +link{dataBoundComponent.dropComplete()} method on this component.
// <P>
// For a TreeGrid, see also +link{treeGrid.transferSelectedData(),transferSelectedData()}.
//
// @param nodes (Array of TreeNode) Nodes to transfer to this component
// @param folder (TreeNode) The target folder (eg, of a drop interaction), for context
// @param index (Integer) Insert point within the target folder data for the transferred nodes
// @param sourceWidget (Canvas) The databound or non-databound component from which the nodes
//                              are to be transferred.
// @param [callback] (Callback) optional callback to be fired when the transfer process has
//                       completed.  The callback will be passed a single parameter "records",
//                       the list of nodes actually transferred to this component (it is called
//                       "records" because this is logic shared with +link{class:ListGrid})
//
// @visibility external
// @example treeDropEvents
//<
transferNodes : function (nodes, folder, index, sourceWidget, callback) {

    // storeTransferState returns false if a prior transfer is still running, in which case
    // we just bail out (transferNodes() will be called again when the first transfer 
    // completes, so we aren't abandoning this transfer, just postponing it) 
    if (!this._storeTransferState("transferNodes", nodes, folder, index, 
                                  sourceWidget, callback)) {
        return;
    }

    var treeData = this._treeData || this.data;

    // If parent folder is null, we're dropping into the TreeGrid body, which implies root
    folder = folder || treeData.root;

    // figure out if this is a drag within the same Tree (even if from another TreeGrid)
    var dragTree = sourceWidget.getData(),
        dragWithinTree = ( isc.isA.Tree(dragTree) && 
                           isc.isA.Tree(treeData) && 
                           dragTree.getRoot() == treeData.getRoot() );
    // if we're dropping an item from one tree to another that both share the same root, perform a
    // move instead.  Note that this ignores dragType (eg clone vs copy) completely.
    var dataSource = this.getDataSource(),
        sourceDS = sourceWidget.getDataSource();
    if (dragWithinTree && (this.dragDataAction != isc.TreeGrid.COPY && 
                           this.dragDataAction != isc.TreeGrid.CLONE)) 
    {
        if (dataSource != null && treeData != null && 
            isc.ResultTree && isc.isA.ResultTree(treeData)) 
        {
            this._dropRecords[0].noRemove = true;
            var wasAlreadyQueuing = isc.rpc.startQueue();

            // NOTE: We are possibly going to do some client-side reordering here.  Depending 
            // on whether we're moving nodes forwards or backwards within their siblings, or
            // neither (if we're reparenting) or both (if we have multiple selected), we'll be
            // changing which index within the parent is the correct one to insert at.  Thus
            // we'll establish upfront which is the correct sibling node to insert before, and
            // always the actual index by reference to that node's current location as the 
            // loop progresses
            var currentChildren = dragTree.getChildren(folder);
            var insertBeforeNode, undef;
            if (index != null) {
                if (index < currentChildren.getLength()) {
                    insertBeforeNode = currentChildren.get(index);
                }
            }
            if (insertBeforeNode == undef) {
                insertBeforeNode = currentChildren.last();
            }

            var insertBeforeNodeLocator;
            
            var loadingMarker = isc.ResultSet.getLoadingMarker();
            var autoUpdatedSiblings = [];
            var addIndexDelta = 0;
            if (treeData.isMultiLinkTree()) {
                // In the slightly odd edge case where we are dragging a node and its own 
                // child(ren), we must re-order the nodes so that children are handled before 
                // their own parents.  If we don't do this, the parent will have moved by the 
                // time we come to move the child, so the nodeLocator we stashed to enable us to 
                // identify the pre-move position of the child will no longer be valid, and the
                // integrity of the tree is now broken...
                for (var i = 0; i < nodes.length; i++) {
                    var potentialChild = nodes[i];
                    for (var j = 0; j < i; j++) {
                        var potentialParent = nodes[j].node;
                        if (potentialChild.parentId == potentialParent[treeData.idField]) {
                            nodes.removeAt(i);
                            nodes.addAt(potentialChild, j);
                            break;
                        }
                    }
                }
                // Pre-calculate an adjustment value for the "add" index(es) if any of the 
                // dragged nodes is being dragged from earlier in the target parent
                for (var i = 0; i < nodes.length; i++) {
                    //>DEBUG
                    this._assert(treeData.isANodeLocator(nodes[i]));
                    //<DEBUG
                    delete nodes[i]._addIndexDelta;
                    if (nodes[i].parentId == folder.node[treeData.idField]) {
                        var linkData = dragTree.getLinkRecord(nodes[i]);
                        var fromIndex = treeData.allowDuplicateChildren && linkData ? 
                                        linkData[dragTree.linkPositionField] :
                                        dragTree.getChildren(folder.node).indexOf(nodes[i].node);
                        if (fromIndex < index) {
                            addIndexDelta--;
                        }
                        nodes[i]._addIndexDelta = addIndexDelta;
                    }
                }
            }
            for (var i = 0; i < nodes.length; i++) {
                var node = nodes[i];
                if (node == null) continue;
                if (this.shouldSaveLocally() || 
                        (!treeData.isMultiLinkTree() && treeData.getParent(node) == folder))
                {
                    // The user has dragged a node to a different location within the the same
                    // parent.  For a multiLink tree, this is just a normal remove and re-add
                    // with the linkPositionField set to the new index.  For a non-multiLink 
                    // tree, this change cannot be automatically persisted, so we'll just
                    // reflect the change locally so it doesn't appear to the user that nothing
                    // has happened (though, in fact, nothing *has* happened - some kind of 
                    // index update on the underlying persistent store needs to be performed in
                    // order for a user interaction of this type to persist beyond the current
                    // UI session).
                    // If index is null, it's unclear what we should do.  We could either leave 
                    // the node where it is, or move it to the end of the list (as we would if
                    // we were adding to the parent).  This may change, but right now we just 
                    // leave it where it is
                    // Note: We use the 'moveBefore' API on tree rather than simple "move"
                    // - we want to ensure we end up next to the "nextSibling" rather than
                    //   necessarily at the current index of the next-sibling
                    if (index != null) {
                        dragTree.moveBefore(node, insertBeforeNodeLocator || insertBeforeNode);
                    }
                } else {
                    
                    // NOTE: getCleanNodeData() scrubs off the isOpen flag if it was auto-
                    // generated, but we need to hang onto it, otherwise dragging an open 
                    // folder from one parent to another causes it to snap shut.
                    var saveIsOpenFlag = nodes[i]["_isOpen_" + treeData.ID];
                    node = isc.addProperties({}, treeData.getCleanNodeData(node, true, false));
                    var oldValues = isc.addProperties({}, node);
                    if (saveIsOpenFlag != null) node["_isOpen_" + treeData.ID] = saveIsOpenFlag;
                    node[treeData.parentIdField] = folder[treeData.idField];
                    var dropNeighbor = null,
                        children = treeData.getChildren(folder);
                    if (index == null) {
                        dropNeighbor = children.last();
                        if (dropNeighbor == loadingMarker) {
                            dropNeighbor = null;
                        }
                    } else if (index > 0) {
                        dropNeighbor = children.get(index - 1);
                        if (dropNeighbor == loadingMarker) {
                            dropNeighbor = null;
                        }
                    }
                    
                    if (!dragTree.isMultiLinkTree()) {
                        // We pass a number of parameters relating to this drop up to the server,
                        // so that they are available in the callback.  This allows us to give
                        // the impression that a drop has taken place at a particular position
                        // within the parent.  This isn't what has actually happened - see the 
                        // above comment about dragging nodes to different locations within the
                        // same parent in a databound TreeGrid.
                        this.updateDataViaDataSource(node, dataSource, { 
                            oldValues: oldValues,  
                            parentNode: treeData.getParent(nodes[i]),
                            position: index,
                            nodeLocator: treeData.isMultiLinkTree() ? nodes[i] : null,
                            newParentNode: folder,
                            dragTree: dragTree,
                            draggedNode: node,
                            draggedNodeList: nodes,
                            dropNeighbor: dropNeighbor,
                            dropIndex: index
                        }, sourceWidget);                          
                    } else {
                        var linkDataSource = isc.DataSource.get(dragTree.linkDataSource),
                            linkData = dragTree.getLinkRecord(nodes[i]),
                            oldParentId = nodes[i].parentId,
                            oldParentNode = dragTree._getNodeFromIndex(oldParentId);
                        var linkRequestProperties = {
                            clientContext: {
                                isDragMove: true, 
                                oldParentNode: oldParentNode,
                                oldParentNodeLocator: dragTree._getParentNodeLocator(nodes[i]),
                                nodeLocator: nodes[i], 
                                newParentNode: folder.node,
                                newParentNodeLocator: folder, 
                                position: index + i + (nodes[i]._addIndexDelta ? nodes[i]._addIndexDelta : 0),
                                sourceRootValue: dragTree.rootValue,
                                sourceTree: dragTree
                            },
                            parameters: {
                                isDragMove: true
                            }
                        }
                        if (dragTree.linkDataRemoveOperation) {
                            linkRequestProperties.operationId = dragTree.linkDataRemoveOperation;
                        }
                        linkDataSource.removeData(linkData, null, linkRequestProperties);

                        var addLinkData = isc.addProperties({}, linkData);
                        addLinkData[treeData.parentIdField] = folder.node[treeData.idField];
                        var insertPos;
                        if (treeData.allowDuplicateChildren) {
                            insertPos = index;
                        } else {
                            if (!dropNeighbor) {
                                insertPos = treeData.firstPositionValue;
                            } else {
                                var neighborLink = treeData.getLinkRecord(
                                                folder.node[treeData.idField], 
                                                dropNeighbor[treeData.idField]);
                                insertPos = neighborLink[treeData.linkPositionField];
                                if (insertPos != null) {
                                    insertPos += 1;
                                }
                            }
                        }
                        addLinkData[treeData.linkPositionField] = insertPos == null ? null : 
                                                                    insertPos + addIndexDelta + i;
                        linkDataSource = isc.DataSource.get(treeData.linkDataSource);
                        if (treeData.linkDataAddOperation) {
                            linkRequestProperties.operationId = treeData.linkDataAddOperation;
                        } else {
                            delete linkRequestProperties.operationId;
                        }
                        var linkPKs = linkDataSource.getPrimaryKeyFieldNames();
                        // Strip the old PK values out of the link record to be added - they 
                        // would be ignored if we just left them in there, but it is confusing
                        // to see an add going up to the server with a PK value specified
                        for (var k = 0; k < linkPKs.length; k++) {
                            delete addLinkData[linkPKs[k]];
                        }

                        linkDataSource.addData(addLinkData, function(resp, data, req) {
                        }, linkRequestProperties);

                        if (dragTree.autoUpdateSiblingNodesOnDrag) {
                            var oldParentId = nodes[i].parentId,
                                oldParentNode = dragTree._getNodeFromIndex(oldParentId),
                                originalSiblings = dragTree.getChildren(oldParentNode),
                                newParentNode = folder.node,
                                newParentId = newParentNode[treeData.idField],
                                newParentNodeLocator = folder,

                            linkDataSource = isc.DataSource.get(dragTree.linkDataSource);
                            var linkPKs = linkDataSource.getPrimaryKeyFieldNames();
                            var start = this.getChildOrdinalPosition(dragTree, nodes[i], oldParentNode);
                            for (var j = start+1; j < originalSiblings.length; j++) {
                                var childId = originalSiblings[j][dragTree.idField];
                                var linkData = dragTree.getLinkRecord(oldParentId, childId, j);
                                if (linkData) {
                                    for (var q = 0; q < nodes.length; q++) {
                                        var removed = true;
                                        var testLinkData = dragTree.getLinkRecord(nodes[q]);
                                        if (!testLinkData) {
                                            // ASSERT - will not happen
                                            continue;
                                        }
                                        for (var k = 0; k < linkPKs.length; k++) {
                                            if (linkData[linkPKs[k]] != testLinkData[linkPKs[k]]) {
                                                removed = false;
                                                break;
                                            }
                                        }
                                        if (removed) {
                                            break;
                                        }
                                    }
                                    if (!removed) {
                                        var siblingKey = {$_parentId: oldParentId, $_childId: childId, $_position: j};
                                        var sibling = autoUpdatedSiblings.find(siblingKey);
                                        if (!sibling) {
                                            sibling = isc.addProperties(siblingKey, linkData);
                                            sibling.$_delta = 0;
                                            autoUpdatedSiblings.add(sibling);
                                        }
                                        sibling.$_delta -= 1;
                                    }
                                }
                            }
                            // Must do the removes and adds separately - they do not necessarily
                            // affect the same nodes (there may not even be any overlap)
                            linkDataSource = isc.DataSource.get(treeData.linkDataSource);
                            var linkPKs = linkDataSource.getPrimaryKeyFieldNames();
                            var newSiblings = treeData.getChildren(newParentNode);
                            for (var j = index; j < newSiblings.length; j++) {
                                var childId = newSiblings[j][treeData.idField];
                                var linkData = treeData.getLinkRecord(newParentId, childId, j);
                                for (var q = 0; q < nodes.length; q++) {
                                    var removed = true;
                                    var testLinkData = dragTree.getLinkRecord(nodes[q]);
                                    if (!testLinkData) {
                                        // ASSERT - will not happen
                                        continue;
                                    }
                                    for (var k = 0; k < linkPKs.length; k++) {
                                        if (linkData[linkPKs[k]] != testLinkData[linkPKs[k]]) {
                                            removed = false;
                                            break;
                                        }
                                    }
                                    if (removed) {
                                        break;
                                    }
                            }
                                if (!removed) {
                                    var siblingKey = {$_parentId: newParentId, $_childId: childId, $_position: j};
                                    var sibling = autoUpdatedSiblings.find(siblingKey);
                                    if (!sibling) {
                                        sibling = isc.addProperties(siblingKey, linkData);
                                        sibling.$_delta = 0;
                                        autoUpdatedSiblings.add(sibling);
                                    }
                                    sibling.$_delta += 1;
                                }
                            }
                        }
                    }
                }
            }
            
            if (dragTree.autoUpdateSiblingNodesOnDrag) {
                delete linkRequestProperties.operationId;
                for (var i = 0; i < autoUpdatedSiblings.length; i++) {
                    var updateLinkData = autoUpdatedSiblings[i];
                    delete updateLinkData.$_parentId;
                    delete updateLinkData.$_childId;
                    delete updateLinkData.$_position;
                    updateLinkData[treeData.linkPositionField] += updateLinkData.$_delta;
                    delete updateLinkData.$_delta;
                    linkDataSource.updateData(updateLinkData, function(resp, data, req) {
                    }, linkRequestProperties);
                }
            }
        } else {
            // deselect the nodes moving to this (target widget) from source widget
            if (sourceWidget != this) sourceWidget._deselectDropRecordsToMove(nodes);

            // move the nodes within the tree
            var currentChildren = dragTree.getChildren(folder);
            var insertBeforeNode, undef;
            if (index != null) {
                if (index < currentChildren.getLength()) {
                    insertBeforeNode = currentChildren.get(index);
                }
            }

            if (dragTree.isMultiLinkTree()) {
                dragTree._draggedLinkRecords = [];
                for (var i = 0; i < nodes.length; i++) {
                    this._assert(dragTree.isANodeLocator(nodes[i]));
                    dragTree._draggedLinkRecords.add(dragTree.getLinkRecord(nodes[i]));
                }
            }

            if (insertBeforeNode == null) {
                dragTree.moveList(nodes, folder, index);
            } else {            
                dragTree.moveListBefore(nodes, insertBeforeNode, folder);
            }
            if (dragTree.isMultiLinkTree()) {
                delete dragTree._draggedLinkRecords;
            }
        }
    } else if (dataSource != null) {
         var canRecat;
        if (this.dragRecategorize == "always" || this.dragRecategorize != "never" &&
            (sourceDS != null && sourceDS != dataSource && treeData != null && 
             isc.ResultTree && isc.isA.ResultTree(treeData) && 
             sourceWidget.dragDataAction == isc.TreeGrid.MOVE))
        {
            // check for a foreign key relationship between some field in the source DS to some
            // field in the treeGrid DS
            var relationship = sourceDS.getTreeRelationship(dataSource);
            
            if (relationship != null && relationship.parentIdField) {
                var cannotRecat = false,
                    pkFields = sourceDS.getPrimaryKeyFields();
                
                // If the detected foreignKeyField is a Primary Key, we can't modify it.
                // Catch this case and log a warning
                
                for (var pk in pkFields) {
                    if (pk == relationship.parentIdField) {
                        this.logWarn("dragRecategorize: data source has dataSource:" 
                                    + sourceDS.getID() + ". foreignKey relationship with " +
                                    "target dataSource " + dataSource.getID() + 
                                    " is based on primary key which cannot be modified.");
                        cannotRecat = true;
                    }
                }
                if (!cannotRecat) canRecat = true;
                //>DEBUG
                this.logInfo("Recategorizing dropped nodes in dataSource:" + sourceDS.getID());
                //<DEBUG
            }
            
            // Remember that we performed updates rather than adds, so we don't remove records
            // later on in transferDragData()
            this._dropRecords[0].noRemove = true;
    
            var wasAlreadyQueuing = isc.rpc.startQueue();
            for (var i = 0; i < nodes.length; i++) {
                var node = {};
                var pks = sourceDS.getPrimaryKeyFieldNames();
                for (var j = 0; j < pks.length; j++) {
                    node[pks[j]] = nodes[i][pks[j]];
                }
                if (canRecat) {
                    node[relationship.parentIdField] = folder[relationship.idField];
                }
                isc.addProperties(node, 
                    this.getDropValues(node, sourceDS, folder, index, sourceWidget));

                this.updateDataViaDataSource(node, sourceDS, null, sourceWidget);
            }
        } else {
            // deselect the nodes moving to this (target widget) from source widget
            if (sourceWidget != this) sourceWidget._deselectDropRecordsToMove(nodes);

            
            if (isc.isA.Tree(dragTree) && sourceWidget.dragDataAction == isc.TreeGrid.MOVE) {
                nodes = dragTree.getCleanNodeData(nodes, sourceWidget.dataSource == null);
            }

            

            var wasAlreadyQueuing = isc.rpc.startQueue();
            for (var i = 0; i < nodes.length; i++) {
                var data = nodes[i],
                    resultTree = treeData;
                if (resultTree) {
                    data[resultTree.parentIdField] = folder[resultTree.idField];
                }
                isc.addProperties(data, 
                    this.getDropValues(data, sourceDS, folder, index, sourceWidget));
                
                if (isc.isA.Tree(this.data) && this.data.isMultiLinkTree()) {
                    this._addMultiLinkIfNotDuplicate(data, sourceDS, sourceWidget, null, index, folder);
                } else {
                    this._addIfNotDuplicate(data, sourceDS, sourceWidget, null, index, folder);
                }
            }
        }
    } else {
        // deselect the nodes moving to this (target widget) from source widget
        if (sourceWidget != this) sourceWidget._deselectDropRecordsToMove(nodes);

        // add the dropped nodes to the tree at the specified point - they could be rows from a
        // ListGrid, or anything - it's up to the developer to have it make sense
        //this.logWarn("adding dragData at parent: " + newParent + ", position: " + position);
        for (var i = 0; i < nodes.length; i++) {
            if (isc.isA.Tree(this.data) && this.data.isMultiLinkTree()) {
                this._addMultiLinkIfNotDuplicate(nodes[i], sourceDS, sourceWidget, null, index, folder);
            } else {
                this._addIfNotDuplicate(nodes[i], sourceDS, sourceWidget, null, index, folder);
            }
        }
    }

    // If this._transferDuplicateQuery is undefined or 0,we didn't need to fire any server 
    // queries, so we can call transferDragData to complete the transfer and send the queue 
    // of updates to the server 
    if (!this._transferDuplicateQuery) {
        isc.Log.logDebug("Invoking transferDragData from inside transferNodes - no server " +
                         "queries needed?", "dragDrop");
        sourceWidget.transferDragData(this._transferExceptionList, this);
        if (dataSource) {
            // send the queue unless we didn't initiate queuing
            if (!this._wasAlreadyQueuing) isc.rpc.sendQueue();
        }
    }
    
    this._transferringRecords = false;
    
},

getChildOrdinalPosition : function (tree, node, parent) {
    var nodeLocator;
    if (tree.isANodeLocator(node)) {
        nodeLocator = node;
        node = node.node;
    }
    if (this.allowDuplicateChildren) {
        return nodeLocator ? nodeLocator.position : 0;
    }
    var children = tree.getChildren(parent);
    if (!children) return -1;
    return children.indexOf(node);
},

_addMultiLinkIfNotDuplicate : function (nodeLocator, sourceDS, sourceWidget, foreignKeys, 
                                            index, newParentNodeLocator, select) 
{
    var ds = this.getDataSource(),
        linkDS = isc.DataSource.get(this.data.linkDataSource),
        pks = ds && ds.getPrimaryKeyFields(),
        _treeGrid = this,
        sourceData = sourceWidget.data,
        sourceTree = isc.isA.Tree(sourceData) ? sourceData : null;

    var thisData = this.data;
    if (this.creator && this.creator.data && this.creator.data.columnTree) {
        thisData = this.creator.data;
    }

    var record = nodeLocator.node;

    if (this.addOperation) {
        isc.addProperties(addProps, { operationId: this.addOperation });
    }

    if (this._isDuplicateMultiLinkOnClient(nodeLocator, newParentNodeLocator.node, index)) {
        if (this.duplicateDragMessage != null) isc.warn(this.duplicateDragMessage);
        isc.Log.logDebug("Found client-side duplicate, adding '" +
            record[isc.firstKey(record)] +
            "' to exception list", "dragDrop");
        this._transferExceptionList.add(isc.Tree.isANodeLocator(record) 
                                            ? record 
                                            : this.getCleanRecordData(record));
        return false;
    }

     

    var linkData = isc.addProperties({}, sourceTree.getLinkRecord(nodeLocator));
    linkData[thisData.parentIdField] = newParentNodeLocator.node[thisData.idField];
    linkData[thisData.linkPositionField] = index;

    var nodeExists = this._nodeExistsOnClient(record);
    if (!ds) {
        if (!nodeExists) {
            thisData.data.add(record);
        }
        thisData.linkData.add(linkData);
        var node = thisData._getNodeFromIndex(nodeLocator.node[thisData.idField]);
        var parentNode = thisData._getNodeFromIndex(newParentNodeLocator.node[thisData.idField]);
        thisData._multiLinkNodes([parentNode, node], thisData.idField, thisData.parentIdField, 
                                 thisData.linkPositionField, thisData.rootValue, 
                                 thisData.isFolderProperty, newParentNodeLocator, false, 
                                 linkData, true);
    } else {
        // We have a dataSource and client-side search failed to find a duplicate node.  Although
        // we can view the client-side link dup check as authoritative, that is not true of the
        // node check - the node may exist elsewhere, in a part of the tree that has not yet 
        // been loaded.  Note, if the node does already exist, that is not an error or even a 
        // warning, it just means that we don't need to create it - the important thing we are
        // creating in this multi-link flow is the link, not the node
        var linkPKs = linkDS && linkDS.getPrimaryKeyFields();
        if (linkPKs) {
            // Remove the PK value(s), or we'll get a duplicate key complaint.  Note, this 
            // requires either a "sequence" PK or custom code on the server side to provide 
            // a PK value during addition
            for (var key in linkPKs) {
                delete linkData[key];
            }
        }

        var addProps = {
            nodeLocator: nodeLocator, 
            newParentNodeLocator: newParentNodeLocator, 
            position: index,
            sourceRootValue: sourceTree ? sourceTree.rootValue : null,
            targetRootValue: thisData.rootValue
        }

        if (ds && sourceDS == ds) {
            if (pks && isc.firstKey(pks) != null) {
                // Source DS and target DS are the same and we have a primary key
                var criteria = isc.applyMask(record, pks);
            } else {
                // Source DS and target DS are the same and we have no primary key
                criteria = this.getCleanRecordData(record);
            }
        
        } else if (ds && pks && isc.firstKey(pks) != null) {
            // Target DS exists and has PKs defined, but either there is no source DS, or the 
            // source DS is different.  Report duplicate if there is a PK collision
            criteria = isc.applyMask(record, pks);
        } else {
            // Either the target grid is not bound to a DS, or the target DS has no PKs
            criteria = this.getCleanRecordData(record);
        }
        ds.fetchData(criteria, function (dsResponse, data, dsRequest) {
            if (!data || data.length == 0) {
                //if (!sourceWidget._updatesSent) sourceWidget._updatesSent = 0;
                //sourceWidget._updatesSent++;
                ds.addData(record, function (dsResponse, data, dsRequest) { 
                    // WRWRWR - is this even necessary??
                    sourceWidget._updateComplete(dsResponse, data, dsRequest); 
                    linkDS.addData(linkData, function(resp, data, req) {
                    }, addProps);
                }, addProps);
            } else {
                linkDS.addData(linkData, function(resp, data, req) {
                }, addProps);
            }
        }, {sendNoQueue: true});
    }
},

_isDuplicateMultiLinkOnClient: function (nodeLocator, newParent, position) {
    //>DEBUG
    this._assert(isc.isA.Tree(this.data) && this.data.isMultiLinkTree());
    //<DEBUG
    var tree = this.data;
    if (!isc.Tree.isANodeLocator(nodeLocator)) {
        return false;
    }
    var indexEntry = tree._getNodeIndexEntry(nodeLocator.node[tree.idField]);
    var dup = false;
    for (var i = 0; i < indexEntry.positions.length; i++) {
        if (indexEntry.positions[i].parentId == newParent[tree.idField]) {
            if (!tree.allowDuplicateChildren || 
                        indexEntry.positions[i].position == position)
            {
                dup = true;
                break;
            }
        }
    }
    return dup;
},

_nodeExistsOnClient : function (record) {
    return !!this.data._getNodeFromIndex(record[this.data.idField]);
},

//> @method treeGrid.getDropFolder()
// When the user is dragging a droppable element over this grid, this method returns the folder
// which would contain the item if dropped. This is the current drop node if the user is hovering
// over a folder, or the node's parent if the user is hovering over a leaf.
// @group events
// @return (Node | NodeLocator)  If this is a regular treeGrid, the target drop folder; if this
//                               is a treeGrid based on a +link{Tree.multiLinkTree,multiLink tree},
//                               a NodeLocator unambiguously identifying the specific occurence
//                               of the drop folder in the tree
// @visibility external
//<
getDropFolder : function () {

    var eventRow = this.getEventRecordNum(null, true),
        data = this._treeData || this.data,
        // before the beginning of the list (over header), or after the end, use root
        eventNode = (eventRow < 0 ? data.getRoot() : data.get(eventRow)),
        eventNodeLocator;
    if (data.isMultiLinkTree()) {
        eventNodeLocator = data.getNodeLocator(eventRow);
    }
    
    // if we're over the root, we're going to drop into the root (no choice)
    if (data.isRoot(eventNode)) {
        return !!eventNodeLocator ? 
                    data.createNodeLocator(data.getRoot(), null, null, data.pathDelim) :
                    data.getRoot();
    }
    
    var isFolder = data.isFolder(eventNode);

    // if we can't reorder records, it's easy
    if (!this.canReorderRecords) {
        if (isFolder) {
            return eventNodeLocator || eventNode;
        } else {
            if (!!eventNodeLocator) {
                return data._getParentNodeLocator(eventNodeLocator);
            } else {
                return data.getParent(eventNode);
            }
        }
    }
    

    var position = this.getRecordDropPosition(eventNode);
    
    // If we're over a leaf (anywhere), or
    // we're over the "before" or "after" part (top / bottom 1/4) of any folder, or
    // we're over the "after" part (bottom 1/4) of a closed or empty folder, return the 
    // parent of the node,
    // except don't return the parent of a folder if the parent is the root node and
    // canDropRootNodes is false; return the node itself in that case.
    if (!isFolder || position == isc.ListGrid.BEFORE || position == isc.ListGrid.AFTER &&
        (!data.isOpen(eventNodeLocator || eventNode) || !data.hasChildren(eventNode)))
    {
        var parent = data.getParent(eventNodeLocator || eventNode);
        if (isFolder && !this.canDropRootNodes && data.isRoot(parent)) {
            return eventNodeLocator || eventNode;
        }
        if (!eventNodeLocator) {
            return parent;
        } else {
            return data._getParentNodeLocator(eventNodeLocator);
        }
    } else {
        // In this case we're either over the "over" position of a closed folder, or the 
        // "below" position for an open folder.  In either case we'll want to drop into this 
        // folder, before the first child
        return eventNodeLocator || eventNode;
    }

}



});