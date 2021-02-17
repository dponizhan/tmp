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
//>	@class	TreeGrid
//
// The SmartClient system supports hierarchical data (also referred to as tree data
// due to its "branching" organization) with:
// <ul>
//   <li> the +link{class:Tree} class, which manipulates hierarchical data sets
//   <li> the TreeGrid widget class, which extends the ListGrid class to visually
//        present tree data in an expandable/collapsible format.
// </ul>
// For information on DataBinding Trees, see +link{group:treeDataBinding}.
// <p>
// A TreeGrid works just like a +link{ListGrid}, except one column (specified by
// +link{TreeGridField.treeField}) shows a hierarchical +link{Tree}.  A TreeGrid is not limited
// to displaying just the +link{Tree} column - you can define additional columns (via
// +link{TreeGrid.fields}) which will render just like the columns of a +link{ListGrid}, and
// support all of the functionality of ListGrid columns, such as
// +link{listGridField.formatCellValue,formatters}.
// <p>
// Except where explicitly overridden, +link{ListGrid} methods, callbacks, and properties
// apply to TreeGrids as well.  The +link{ListGrid} defines some methods as taking/returning
// +link{ListGridField} and +link{ListGridRecord}.  When using those methods in a TreeGrid,
// those types will be +link{TreeGridField} and +link{TreeNode}, respectively.
// 
// @inheritsFrom ListGrid
// @implements DataBoundComponent    
// @treeLocation Client Reference/Grids
// @visibility external
//<

// define us as a subclass of the ListGrid
isc.ClassFactory.defineClass("TreeGrid", "ListGrid");

// Synonym for backCompat.  NOTE: define an alias rather than make a subclass, otherwise,
// attempts to skin the class using the old name would only affect the subclass!
isc.addGlobal("TreeViewer", isc.TreeGrid);

//>	@class	TreeGridBody
//
//  GridRenderer displayed as the body of a TreeGrid. Includes various overrides for
//  specialized event handling and display.
//
//  @treeLocation Client Reference/Grids/TreeGrid/
//  @visibility internal
//<
isc.defineClass("TreeGridBody", isc.GridBody).addProperties({
    // Override the internal _updateCellStyle() method to style the tree-field's internal
    // table (without regening the HTML)
    _$TABLE:"TABLE",
    _$zeroBorderPadding:"padding:0px;border:0px;",


    _getShowClippedValuesOnHover : function () {
        if (this.showClippedValuesOnHover == null) return true;
        return this.showClippedValuesOnHover;
    },

    cellValueIsClipped : function (rowNum, colNum, c, d, e) {
        var grid = this.grid,
            treeFieldNum = grid._treeFieldNum,
            treeFieldBody = grid.getFieldBody(treeFieldNum);
        if (this === treeFieldBody && colNum == grid.getLocalFieldNum(treeFieldNum)) {
            var titleClipperHandle;
            if (grid.writeTreeCellTable) {
                var cell = this.getTableElement(rowNum, colNum);
                if (cell == null) return false;
                var table = cell.firstChild; 
                while (table && table.tagName != this._$TABLE) table = table.firstChild;
                if (table && table.rows && table.rows[0]) {
                    var titleCell = table.rows[0].lastChild,
                        titleClipperHandle = titleCell;
                    
                    if (isc.Browser.isMoz && titleCell.firstChild && titleCell.firstChild.hasAttribute &&
                        titleCell.firstChild.hasAttribute("_titleClipper"))
                    {
                        titleClipperHandle = titleCell.firstChild;
                    }
                }
            // If we used DIVs rather than nested tables for our tree-cell value we
            // have slightly different logic to navigate to the clipping element
            } else {
                var treeCellValueDiv = isc.Element.get(grid._getTreeCellValueID(rowNum));
                if (treeCellValueDiv) {
                    // We write out the _titleClipper div inside the treeCellValueDiv
                    // in all browsers
                    titleClipperHandle = treeCellValueDiv.firstChild;
                    if (titleClipperHandle && 
                        (!titleClipperHandle.hasAttribute || 
                         !titleClipperHandle.hasAttribute("_titleClipper")))
                    {
                        titleClipperHandle = null;
                    }
                }
            }
            if (titleClipperHandle) {
                return this._cellValueIsClipped(titleClipperHandle);
            }
            
        }
        return this.invokeSuper(isc.TreeGridBody, "cellValueIsClipped", rowNum, colNum, c, d, e);
    },

    // Implement 'bypassCellValueCache' method - if we're measuring the tree cell value
    // we have to avoid fixing title width in the measurement HTML.
    bypassCellValueCache:function (record,rowNum,colNum) {
        
        var bypassCache = isc.GridBody._instancePrototype.bypassCellValueCache.call(this,record,rowNum,colNum);
        if (bypassCache) return true;

        // If fixedFieldWidths is false (unlikely) we never write out title clipping
        // HTML, so no need to bypass cache
        if (this.fixedColumnWidths) {
            var grid = this.grid,
                treeFieldNum = grid._treeFieldNum,
                treeFieldBody = grid.getFieldBody(treeFieldNum);
    
            if (this === treeFieldBody && colNum == grid.getLocalFieldNum(treeFieldNum)) {
                return true;
            }
        }
        return false;
    },

    defaultCellValueHoverHTML : function (record, rowNum, colNum, d, e, f) {
        var grid = this.grid,
            treeFieldNum = grid._treeFieldNum,
            treeFieldBody = grid.getFieldBody(treeFieldNum);
        if (this === treeFieldBody && colNum == grid.getLocalFieldNum(treeFieldNum)) {
            // Call the standard ListGrid.getCellValue() method to give us the formatted title
            // of the cell being dragged, excluding the TreeGrid folder/file icons, etc.
            return this.grid.invokeSuper(isc.TreeGrid, "getCellValue", record, rowNum, treeFieldNum);
        }
        return this.invokeSuper(isc.TreeGridBody, "defaultCellValueHoverHTML", record, rowNum, colNum, d, e, f);
    },

    _updateCellStyle : function (record, rowNum, colNum, cell, className) {
        if (cell == null) cell = this.getTableElement(rowNum, colNum);
        if (cell == null) return; // cell not currently drawn

        if (!this.showHiliteInCells && 
            colNum == this.grid.getLocalFieldNum(this.grid.getTreeFieldNum()) &&
            this.grid.writeTreeCellTable) 
        {
            if (record == null) record = this.getCellRecord(rowNum, colNum);
            // determine the CSS style className if not provided
            if (className == null) className = this.getCellStyle(record, rowNum, colNum);

            
            var tables = cell.getElementsByTagName(this._$TABLE),
                table = tables && tables[0]
            ;     
            if (table) {

                var customCSSText;

                // Apply custom css text from getCellCSSText to the table element and any cells.
                // Note: this is not required in most cases - we write out no-style-doubling css
                // on these elements so we'll ignore bg color, images, border etc. 
                // This is really just required to pick up changes to the text color / weight etc
                if (this.getCellCSSText) {
                    customCSSText = this.getCellCSSText(record, rowNum, colNum);
                    if (customCSSText != null && !isc.isAn.emptyString(customCSSText)) {
                        // we always append no-style-doubling css to the custom css to avoid
                        // doubled borders etc
                        
                        customCSSText += isc.Canvas._$noStyleDoublingCSS;
                    } else customCSSText = null;
                }

                table.className = className;
                if (customCSSText != null) table.cssText = customCSSText;

                var innerRows = table.rows,
                    
                    innerCells = innerRows[0].childNodes;
                if (innerCells && innerCells.length > 0) {
                    for (var i = 0; i < innerCells.length; i++) {
                        innerCells[i].className = className;
                        if (customCSSText) {
                            // Title is the last cell in the tree-title table - this cell
                            // requires additional specification for the icon padding
                            if (i == innerCells.length-1) {
                                
                                customCSSText += (this.isRTL() ? "padding-right:" : "padding-left:")
                                                + this.grid.getIconPadding(record) + "px"; 
                            }
                            innerCells[i].style.cssText = customCSSText;
                        }
                    }
                }
            }
        }

        // Actually style the cell itself
        return isc.GridRenderer.getPrototype()._updateCellStyle.apply(
                                        this, [record, rowNum, colNum, cell, className]);
    },

    //>	@method	treeGridBody.click()	(A)
    // Handle a click in the "open" area of a record specially
    //		@group	event handling	
    //
    //		@return	(boolean)	false == cancel further event processing
    //<
    // Note: We override click rather than putting this logic into rowClick / cellClick, as
    // we don't want folder toggling to occur if the user's mouse is hovering over the open
    // area while the user triggers standard record click handling by hitting the Space-bar.
    
    click : function (event, eventInfo) {
        if (!this._suppressEventHandling()) {

            var tg = this.grid,
                recordNum = tg.getEventRecordNum(),
                node = recordNum < 0 ? null : tg.getRecord(recordNum);
            // if what they clicked on is a folder, toggle it's state.  The 'open' observation
            // will automaticaly redraw for us
            if (node != null && tg.data.isFolder(node) && tg.clickInOpenArea(node)) {
                
                if (isc.screenReader) {
                    this._putNativeFocusInRow(recordNum, this.getEventColumn());
                }

                var nodeLocator;
                if (tg.data.isMultiLinkTree()) {
                    nodeLocator = tg.data.getNodeLocator(recordNum);
                }

                tg.toggleFolder(nodeLocator || node);

                // clear out the pointer to the last record clicked, and the last row selected
                // by keyboard navigation. (Prevents index-based keyboard navigation from
                // jumping around due to the number of rows changing as folders toggle)
                tg.clearLastHilite();
                tg._lastRecordClicked = null;
                
                // If we set up a maskedMouseDownCell, clear it up so it doesn't confuse
                // future click events.
                
                delete this._maskedMouseDownCell;

                // Note: if you click in the open area to toggle a folder, no nodeClick or
                // folderClick events will be fired, since we've already taken action in
                // response to your click by toggling a folder
                // Return EH.STOP_BUBBLING to stop propogation.
                return isc.EH.STOP_BUBBLING;
            }
        }
        return this.Super("click", arguments);
    },

    // Override mouseDown and mouseUp in the body to avoid selecting when clicking in open
    // area by default.
    
    //>	@method	treeGridBody.mouseDown()	(A)
    // Handle a click in the open area on mouseDown specially
    //		@group	event handling	
    //
    //		@return	(boolean)	false == cancel further event processing
    //<
    mouseDown : function () {
        // get the item that was clicked on -- bail if not found
        var cell = this._getMouseDownCell(),
            rowNum = cell[0],
            node = rowNum < 0 ? null : this.grid.data.get(rowNum);


        if (node != null) {
            if (this.grid.clickInOpenArea(node)) {
                // if they clicked in the open area of the record,
                // just bail because we're supposed to open the folder instead
                // TreeGrid.click() will actually open the folder
                
                return isc.EH.STOP_BUBBLING;
            } else if (this.grid.clickInCheckboxArea(node) && this.canSelectRecord(node)) {

                // Toggle node selection state
                var selectionType = this.grid.selectionType;
                if (selectionType == isc.Selection.SINGLE) {
                    this.deselectAllRecords();
                    this.selectRecord(node);
                } else if (selectionType == isc.Selection.SIMPLE ||
                           selectionType == isc.Selection.MULTIPLE) 
                {
                    if (this.selectionManager.isSelected(node, rowNum)) {
                        this.deselectRecord(node);
                    } else {
                        this.selectRecord(node);
                    }
                }

                // Note: if you click in the checkbox area to select a node, no nodeClick or
                // folderClick events will be fired, since we've already taken action in
                // response to your click by selecting/deselected the node.
                // Return EH.STOP_BUBBLING to stop propogation.
                return isc.EH.STOP_BUBBLING;
            }
        }

        return this.Super("mouseDown", arguments);
    },

    //>	@method	treeGridBody.mouseUp()	(A)
    // Handle a click in the open area on mouseUp specially
    //		@group	event handling	
    //
    //		@return	(boolean)	false == cancel further event processing
    //<
    mouseUp : function () {
        // get the item that was clicked on -- bail if not found
        var rowNum = this.getEventRow(),
            node = rowNum < 0 ? null : this.grid.data.get(rowNum);
        if (node != null &&
            (this.grid.clickInOpenArea(node) || this.grid.clickInCheckboxArea(node)))
        {
            // don't select the row; on click() we'll open the folder
            return isc.EH.STOP_BUBBLING;
        } else {
            // proceed to super (select the row)
            return this.Super("mouseUp", arguments);
        }
    },

    // Override to place embedded components for the tree field indented as a title
    // would be if TG.indentRecordComponents == true.
    placeEmbeddedComponent : function (component) {
        if (this.grid.indentRecordComponents) {
            var colNum = component._currentColNum;
            if (colNum == this.grid.getTreeFieldNum() && !component.snapOffsetLeft) {
                var record = component.embeddedRecord;
                if (record != null) {
                    component.snapOffsetLeft
                        = this.grid.getOpenAreaWidth(record) + this.grid.getIconPadding(record);
                }
            }
        }
        return this.Super("placeEmbeddedComponent", arguments);
    },

    getTableHTML : function (colNum, startRow, endRow, discreteCols, asyncCallback, isAsync, isWritingHTML) {
        var data = this.grid.data,
            preCacheRange = (
                isc.isA.ResultTree(data) &&
                
                !this.isEmpty());

        var actualStartRow = startRow,
            actualEndRow = endRow;

        if (preCacheRange) {
            
            var rowRange = (startRow != null && endRow != null) 
                            ? this._limitFragmentRowRange(startRow, endRow) 
                            : this._getTableHTMLDrawArea(false);

            actualStartRow = rowRange[0];
            actualEndRow = rowRange[1];

            
            data._pushCachedRange(actualStartRow, actualEndRow);
        }

        var ret = this.invokeSuper(
                isc.TreeGridBody,
                "getTableHTML",
                colNum, startRow, endRow, discreteCols, asyncCallback, isAsync, isWritingHTML);

        if (preCacheRange) {
            data._popCachedRange(actualStartRow, actualEndRow);
        }
        return ret;
    }
});

isc.TreeGrid.addClassProperties({

    // default field to display a tree
    TREE_FIELD : {

        name: "nodeTitle", treeField: true, canFilter: false,    

        // This flag will avoid standard type formatters running based on field
        // type as part of _formatCellValue.
        // type formatting already occurs in the default getNodeTitle() 
        // implementation.
        // This is the correct place for this formatting, since if that method is
        // overridden we would expect it to return a string rather than an object
        // of whatever field type the treeField is.
        _suppressTypeFormatting:true,

        getCellValue : function (list,record,recordNum,colNum) {
            if (!list.getNodeTitle) {
                var fieldName = colNum == null ? null : list.getFieldName(colNum);
                return record == null || fieldName == null ? null : record[fieldName];
            }
            return list.getNodeTitle(record,recordNum, this)
        },

        // return the title for the Header Button over the tree column.
        
        getFieldTitle : function (viewer, fieldNum) {
            var field = viewer.getField(fieldNum);              
            if (field.name == "nodeTitle") return viewer.treeFieldTitle;
            
            // otherwise just return the title of the field, or failing that, the field's name
            return field.title || field.name;
        }
    },

    // define normalizer for TREE_FIELD - records won't actually contain a "nodeTitle" field
    _pagedTreeFieldSortNormalizer : function (record, fieldName, list) {
        return list.getNodeTitle(record, -1, this);
    },
    
    // _getTreeCellTemplate - returns the HTML template array used for the start of
    // tree grid cells.
    // This is a dynamic method - it incorporates the standard 'noDoublingCSS' string into the
    // returned HTML template. That string can change at runtime due to setNeverUseFilters()
    // so we need to react to this and regenerate the template.
    _getTreeCellTemplate : function () {
        if (!this._observingDoublingStrings) {
            isc.Canvas._doublingStringObservers.add({
                target:this, 
                methodName:"_doublingStringsChanged"
            });
            this._observingDoublingStrings = true;
        }
        if (this._$treeCellTemplate == null) {
            this._$treeCellTemplate = [
                
                "<table" + (isc.Browser.isIE && isc.screenReader ? " unselectable='on'" : "") +
                " role='presentation' cellpadding=0 cellspacing=0 class='", // [0]
                ,                                                   // [1] - this.getCellStyle()
                "' style='",          // [2]
                ,                                                   // [3] - getCellCSSText()
                // use _$noStyleDoublingCSS to suppress any border / background image etc from the
                // cell style
                // Also use noStyleDoublingCSS and explicitly re-apply the gridrenderer cell style and 
                // cell cssText to each cell within the tree-cell table.
                
                isc.Canvas._$noStyleDoublingCSS + "'><colgroup><col width='",// [4]
                ,                                                   // [5] - indent cell width
                "px'/><col width='",                                // [6]
                ,                                                   // [7] - icon cell width
                
                "px'/><col/></colgroup><tbody><tr><td" +
                (isc.Browser.isIE && isc.screenReader ? " unselectable='on'" : "") + " style='line-height:0px;", // [8] (indent cell)
                ,                                                   // [9] - getCellCSSText()
                isc.Canvas._$noStyleDoublingCSS + "' class='",      // [10]
                ,                                                   // [11] - getCellStyle()
                "'>",                                               // [12]
                ,                                                   // [13] - indentHTML
                "</td>"                                             // [14] 
                // (we'll write the title cell out using _$treeCellTitleTemplate)
            ];
        }
        return this._$treeCellTemplate;
    },

    _getTreeCellTitleTemplate : function () {
        if (!this._observingDoublingStrings) {
             isc.Canvas._doublingStringObservers.add({
                target:this, 
                methodName:"_doublingStringsChanged"
            });
            this._observingDoublingStrings = true;
        }

        if (this._$treeCellTitleTemplate == null) {
            this._$treeCellTitleTemplate = [

                
                "<td" + (isc.Browser.isIE && isc.screenReader ? " unselectable='on'" : "") + " style='line-height:0px;", // [0] (icon(s) cell)
                ,                                                      // [1] - getCellCSSText()
                ";" + isc.Canvas._$noStyleDoublingCSS + "' class='",   // [2]
                ,                                                      // [3] - getCellStyle()
                
                "'>" + (isc.Browser.isSafari || isc.Browser.isIE ? "<nobr>" : ""), // [4]
                ,                                                   // [5] - opener icon HTML
                ,                                                   // [6] - 'extra' icon if there is one
                ,                                                   // [7] - icon for item (eg folder/file icon)
                (isc.Browser.isSafari || isc.Browser.isIE ? "</nobr>" : "") +
                    "</td><td",                                     // [8] (start of value cell)
                ,                                                   // [9] ID attribute, or null
                (isc.Browser.isIE && isc.screenReader ? " unselectable='on'" : "") + " style='", // [10]
                ,                                                   // [11] - getCellCSSText()
                ";" + isc.Canvas._$noStyleDoublingCSS 
                    + (isc.Page.isRTL()
                       ? "padding-left:1px;padding-right:"
                       : "padding-right:1px;padding-left:"),        // [12]
                ,                                                   // [13] - this.iconPadding
                "px;' class='",                                     // [14]
                ,                                                   // [15] - getCellStyle()
                "'>",                                               // [16]
                ,                                                   // [17] - <NOBR> or null
                ,                                                   // [18] - value
                ,                                                   // [19] - </NOBR> or null
                "</td>"                                             // [20]
            ];
        }
        return this._$treeCellTitleTemplate;
    },
    
    _doublingStringsChanged : function () {
        this._$treeCellTemplate = null;
        this._$treeCellTitleTemplate = null
    },

    // Centralized logic to assemble full set of possible URLs for opener media based
    // on base image name and node state [opened vs closed, selected, rtl]
    
    _openerImageMap:{},    
    getOpenerImageMap : function (img) {

        if (!this._openerImageMap[img]) {

            
            
            this._openerImageMap[img] = [
                // use Img.urlForState
                // This handles splitting the base name into base + extension, and plugging in
                // the state name parameter (third parameter).
                null,                                                           // 0
                isc.Img.urlForState(img, null, null, "opened"),                 // 1
                isc.Img.urlForState(img, null, null, "closed"),                 // 2
                isc.Img.urlForState(img, null, null, "opening"),                // 3
                null,                                                           // 4
                isc.Img.urlForState(img, null, null, "opened_selected"),        // 5
                isc.Img.urlForState(img, null, null, "closed_selected"),        // 6
                isc.Img.urlForState(img, null, null, "opening_selected"),       // 7
                null,                                                           // 8
                isc.Img.urlForState(img, null, null, "opened_rtl"),             // 9
                isc.Img.urlForState(img, null, null, "closed_rtl"),             // 10
                isc.Img.urlForState(img, null, null, "opening_rtl"),            // 11
                null,                                                           // 12
                isc.Img.urlForState(img, null, null, "opened_selected_rtl"),    // 13
                isc.Img.urlForState(img, null, null, "closed_selected_rtl"),    // 14
                isc.Img.urlForState(img, null, null, "opening_selected_rtl")    // 15
            ];
        }
        return this._openerImageMap[img];
    },
    
    // Centralized logic to build the "connector" image map.
    
    _connectorImageMap:{},
    _connectorImageMapRTL:{},
    getConnectorImageMap : function (img, isRTL) {
    
        var map = isRTL ? this._connectorImageMapRTL : this._connectorImageMap;
        if (map[img] == null) {
        
            var baseStates = [
                "", "opened", "closed"
            ];
            var parts = [
                "single",
                "start",
                "end",
                "middle"
            ];
            
            var suffixes = [];
            for (var i = 0; i < parts.length; i++) {
                for (var ii = 0; ii < baseStates.length; ii++) {
                    suffixes.add(baseStates[ii] + 
                        (baseStates[ii] == "" ? "" : "_") + parts[i]);
                }
            }
            
            // Create "_selected" versions of each state in addition to non-selected versions
            var suffixesLength = suffixes.length;
            for (var i = 0; i < suffixesLength; i++) {
                suffixes.add(suffixes[i] + "_selected");
            }
            
            // Append "rtl" suffixes if asked for the RTL versions
            if (isRTL) {
                for (var i = 0; i < suffixes.length; i++) {
                    suffixes[i] += "_rtl";
                }
            }
            map[img] = [];
            for (var i = 0; i < suffixes.length; i++) {
                map[img][i] = isc.Img.urlForState(img, null, null, suffixes[i]);
            }
        }
        
        return map[img];
    }

});


isc.TreeGrid.addProperties({

	//>	@attr	treeGrid.dataSource		(DataSource | ID : null : IRW)
    // @include dataBoundComponent.dataSource
	//<

	//>	@attr	treeGrid.data		(Tree : null : IRW)
	// A +link{class:Tree} object containing of nested +link{object:TreeNode}s to 
    // display as rows in this TreeGrid.  
    // The <code>data</code> property will typically not be explicitly specified for 
    // databound TreeGrids, where the data is returned from the server via databound component
    // methods such as <code>fetchData()</code>
	//      @visibility external
	//		@group	data
	//<

    //> @attr treeGrid.initialData (List of TreeNode : null : IRA)
    // You can specify the initial set of data for a databound TreeGrid using this property.
    // The value of this attribute should be a list of <code>parentId</code>-linked
    // +link{TreeNode}s in a format equivalent to that documented on +link{Tree.data} or, for
    // TreeGrids with +link{treeGrid.dataFetchMode,dataFetchMode} set to
    // +link{type:FetchMode,"paged"}, on +link{ResultTree.data}.
    // <P>
    // If you create a standalone +link{class:Tree} or +link{class:ResultTree} as the
    // TreeGrid's +link{treeGrid.data,data} then you may equivalently specify this initial set
    // of tree nodes in that tree's +link{Tree.data,data} property.
    // @see TreeNode
    // @see Tree.data
    // @see ResultTree.data
    // @visibility external
    // @example initialData
    //<
    
    //> @attr treeGrid.loadDataOnDemand   (boolean : null : IRW)
    // For databound treeGrid instances, should the entire tree of data be loaded on initial 
    // fetch, or should folders load their children as they are opened.
    // <P>
    // If unset, calling +link{fetchData()} will default it to true, otherwise, if a ResultTree
    // is passed to +link{setData()}, the +link{resultTree.loadDataOnDemand} setting is
    // respected.  Must be enabled on the underlying +link{ResultTree} when using
    // +link{dataFetchMode}: "paged".
    // <P>
    // Note that when using <code>loadDataOnDemand</code>, every node returned by the server is
    // assumed be a folder which may load further children.  See
    // +link{resultTree.defaultIsFolder} for how to control this behavior.
    // 
    // @see dataFetchMode
    // @group databinding
    // @visibility external
    // @example initialData
    //<
    

    //> @attr treeGrid.keepParentsOnFilter (boolean : null : IR)
    // @include resultTree.keepParentsOnFilter
    // @visibility external
    //<

    //> @attr treeGrid.dataFetchMode (FetchMode : "basic" : IR)
    // @include resultTree.fetchMode
    // @visibility external
    //<

    //> @attr treeGrid.serverFilterFields (Array of String : null : IR)
    // @include resultTree.serverFilterFields
    // @visibility external
    //<

    //> @attr treeGrid.autoFetchTextMatchStyle (TextMatchStyle : "exact" : IR)
    // With +link{loadDataOnDemand}:true, TreeGrids fetch data by selecting the child nodes of
    // each parent, which should be exact match, so we default to
    // <code>autoFetchTextMatchStyle:"exact"</code> when autoFetchData is true.
    // <P>
    // See +link{listGrid.autoFetchTextMatchStyle} for details.
    //
    // @group dataBinding
    // @see resultTree.useSimpleCriteriaLOD
    // @visibility external
    //<
    autoFetchTextMatchStyle:"exact",
    
    //> @attr treeGrid.cascadeSelection (Boolean : false : [IR])
    // Should children be selected when parent is selected? And should parent be
    // selected when any child is selected?
    // @visibility external
    //<
    cascadeSelection:false,

    //> @attr treeGrid.showPartialSelection (Boolean : false : [IRW])
    // Should partially selected parents be shown with special icon?
    // @visibility external
    //<
    showPartialSelection:false,

    //> @attr treeGrid.selectionProperty (String : null : [IRA])
    // @include listGrid.selectionProperty
    // @visibility external
    //<

    //> @attr treeGrid.canSelectAll (boolean : null : [IRW])
    // This property is not supported on TreeGrid, and only applies to the +link{ListGrid}
    // superclass.
    // 
    // @group selection
    // @visibility external
    //<

    
    booleanTrueImage:null,
    booleanFalseImage:null,
    booleanPartialImage:null,

    showClippedValuesOnHover:null,

    //> @attr treeGrid.treeRootValue (Any : null : IRA)
    // For databound trees, use this attribute to supply a +link{DataSourceField.rootValue} for this
    // component's generated data object.
    // <P> 
    // This property allows you to have a particular component navigate a tree starting from any
    // given node as the root.
    // @group databinding
    // @visibility external
    //<
    
    
    //> @attr   treeGrid.fields       (Array of TreeGridField: null : IRW)
    // An array of field objects, specifying the order, layout, dynamic calculation, and
    // sorting behavior of each field in the treeGrid object. In TreeGrids, the fields
    // array specifies columns. Each field in the fields array is TreeGridField object.
    // <p>
    // If +link{TreeGrid.dataSource} is also set, this value acts as a set of overrides as
    // explained in +link{attr:DataBoundComponent.fields}.
    //
    // @group databinding
    // @see TreeGridField
    // @visibility external
    //<

    //> @object TreeGridField
    //
    // An object literal with a particular set of properties used to configure the display of
    // and interaction with the columns of a +link{TreeGrid}.
    // +link{TreeGrid} is a subclass of +link{ListGrid} and as a result, for all fields except
    // the field containing the +link{Tree} itself (specified by
    // +link{treeGridField.treeField}, all properties settable on
    // +link{ListGridField} apply to TreeGridField as well.
    // <p>
    // This class documents just those properties that are specific to TreeGridFields - see
    // +link{ListGridField} for the set of inherited properties.
    // 
    // @see ListGridField
    // @see TreeGrid.fields
    // @see ListGrid.setFields
    // @inheritsFrom ListGridField
    // @treeLocation Client Reference/Grids/TreeGrid
    // @visibility external
    //< 

    // Tree Field
    // ---------------------------------------------------------------------------------------

    //> @attr treeGridField.treeField (Boolean : see below : IRW)
    //
    // The field containing <code>treeField: true</code> will display the +link{Tree}.  If no
    // field specifies this property, if a field named after the +link{Tree.titleProperty} of
    // the Tree is present in +link{TreeGrid.fields}, that field will show the tree.  Note that
    // when using a DataSource, you typically define the title field via
    // +link{DataSource.titleField} and the generated +link{ResultTree} automatically uses this
    // field.
    //
    // If none of the above rules apply, the first field in +link{TreeGrid.fields} is assigned to
    // display the +link{Tree}.
    //
    // @group treeField
    // @visibility external
    //<

    //> @attr treeGridField.canExport (Boolean : null : IR)
    //	Dictates whether the data in this field be exported.  Explicitly set this
    //  to false to prevent exporting.  Has no effect if the underlying 
    //  +link{dataSourceField.canExport, dataSourceField} is explicitly set to 
    //  canExport: false.
    //
    // @visibility external
    //<

    //>	@attr	treeGrid.treeFieldTitle		(String : "Name" : IR)
	//	Visible title for the tree column (field).
    // @group treeField
    // @visibility external
	//<
	treeFieldTitle:"Name",		
    
    //> @attr treeGrid.autoAssignTreeField (boolean : true : IR)
    // If this grid was passed an explicit set of fields, but no field was specified as the
    // "tree-field" (showing indentations for tree hierarchy
    // and tree icons), should we assign one of the other fields to be the tree-field?
    // <P>
    // When true, if we're showing a field for the +link{attr:Tree.titleProperty} of the tree, 
    // this will be displayed as a Tree Field by default. If not, the first entry in the 
    // specified fields array will be used.
    // <P>
    // This may be set to false to display a tree or partial tree as a flattened list within
    // a TreeGrid.
    //
    // @visibility external
    // @group treeField
    //<
    autoAssignTreeField:true,

    //>	@attr	treeGrid.showRoot		(Boolean : false : IR)
    // Specifies whether the root node should be displayed in the treeGrid.
    // <P>
    // This property is only available for "children" modelType trees, hence is not allowed for
    // trees that load data from the server dynamically via +link{fetchData()}.  
    // <P>
    // To get the equivalent of a visible "root" node in a tree that loads data dynamically,
    // add a singular, top-level parent to the data.  However, note that this top-level parent
    // will technically be the only child of root, and the implicit root object will be
    // returned by +link{tree.getRoot,this.data.getRoot()}.
    //
    // @group treeField
    // @visibility external
	//<
	showRoot:false,
    
    //>	@attr	treeGrid.separateFolders		(boolean : null : IR)
    // If specified, this attribute will override +link{Tree.separateFolders} on the
    // data for this treeGrid.
    // <P>
    // Specifies whether folders and leaves should be segregated in the treeGrid display.
    // Use +link{tree.sortFoldersBeforeLeaves} to customize whether folders appear before 
    // or after their sibling leaves.
    // <P>
    // If unset, at the treeGrid level, the property can be set directly on
    // +link{treeGrid.data,the tree data object} or for dataBound TreeGrids on the
    // +link{treeGrid.dataProperties}.
    //
    // @group treeField
    // @visibility external
	//<
//	separateFolders:false,

	//> @attr treeGrid.dataProperties (Tree : null : IR)
    // For a <code>TreeGrid</code> that uses a DataSource, these properties will be passed to
    // the automatically-created ResultTree.  This can be used for various customizations such as
    // modifying the automatically-chosen +link{tree.parentIdField}.
    // @group databinding
    // @visibility external
    //<
	//
    //> @attr treeGrid.sortFoldersBeforeLeaves (boolean : null : IR)
    // If specified, this attribute will override +link{tree.sortFoldersBeforeLeaves} on
    // the data for this treeGrid.
    // <P>
    // Specifies whether when +link{tree.separateFolders} is true, folders should be displayed
    // before or after their sibling leaves in a sorted tree. If set to true, with
    // sortDirection set to Array.ASCENDING, folders are displayed before their sibling leaves
    // and with sort direction set to Array.DESCENDING they are displayed after. To invert
    // this behavior, set this property to false.
    // @group treeField
    // @see treeGrid.separateFolders
    // @visibility external
    //<
//    sortFoldersBeforeLeaves:null,

	//>	@attr	treeGrid.displayNodeType (DisplayNodeType : isc.Tree.FOLDERS_AND_LEAVES : [IRW])
    //          Specifies the type of nodes displayed in the treeGrid. 
    // @see type:DisplayNodeType for options
    // @group treeField
    // @visibility external
	//<
	displayNodeType:isc.Tree.FOLDERS_AND_LEAVES,
	
	//> @attr treeGrid.autoPreserveOpenState (PreserveOpenState : null : [IR])
	// For dataBound treeGrids this specifies the +link{resultTree.autoPreserveOpenState},
	// governing whether the open state of the tree should be preserved when new data
	// arrives due to cache invalidation.
	//
	// @visibility external
	//<
	
	// Drag and Drop
	// --------------------------------------------------------------------------------------------
    //> @attr treeGrid.canDragRecordsOut (Boolean : false : IRW)
    // @include ListGrid.canDragRecordsOut
    // @group dragdrop
    // @see TreeNode.canDrag
    // @see TreeNode.canAcceptDrop
    // @see ListGrid.showDragHandles()
    // @visibility external
    // @example treeDropEvents
    //<
	canDragRecordsOut:false,			

	// Drag and Drop
	// --------------------------------------------------------------------------------------------

    //>	@attr	treeGrid.canAcceptDroppedRecords		(Boolean : false : IRW)
	//	@include ListGrid.canAcceptDroppedRecords
    // @see TreeNode.canDrag
    // @see TreeNode.canAcceptDrop
    //  @group	dragdrop
    // @visibility external
    // @example treeDragReparent
    //<
	//canAcceptDroppedRecords:false,		
	
    //> @attr treeGrid.canReorderRecords (Boolean : false : IRWA)
    // @include ListGrid.canReorderRecords
    // @see TreeNode.canDrag
    // @see TreeNode.canAcceptDrop
    // @see ListGrid.showDragHandles()
    // @group dragdrop
    // @visibility external
    // @example treeDragReparent
	//<
	//canReorderRecords:false,
 
    //> @attr treeGrid.canDropOnLeaves          (Boolean : false : IRWA)   
    // Whether drops are allowed on leaf nodes.
    // <P>
    // Dropping is ordinarily not allowed on leaf nodes unless +link{canReorderRecords} is
    // set.  
    // <P>
    // The default action for a drop on a leaf node is to place the node in that leaf's parent
    // folder.  This can be customized by overriding +link{folderDrop()}.
    // <P>
    // Note that enabling <code>canDropOnLeaves</code> is usually only appropriate where you
    // intend to add a custom +link{folderDrop()} implementation that <b>does not</b> add a
    // child node under the leaf.  If you want to add a child nodes to a leaf, instead of
    // enabling canDropOnLeaves, use empty folders instead - see +link{Tree.isFolder} for how
    // to control whether a node is considered a folder.
    //
    // @visibility external
    //<

    //> @attr treeGrid.canDropRootNodes (Boolean : true : IRW)   
    // Whether to allow dropping new root nodes for the grid
    // <P>
    // If this property is false, attempts to drop a new root node will result in dropping
    // on the nearest root node instead.
    //<
    canDropRootNodes: true, 
    
    //> @attr treeGrid.canReparentNodes     (boolean : null : IRW)
    // If set this property allows the user to reparent nodes by dragging them from their
    // current folder to a new folder.<br>
    // <b>Backcompat:</b> For backwards compatibility with versions prior to SmartClient 1.5,
    // if this property is unset, but <code>this.canAcceptDroppedRecords</code> is true, we
    // allow nodes to be dragged to different folders.
    // @see TreeNode.canDrag
    // @see TreeNode.canAcceptDrop
    // @group dragdrop
    // @visibility external
    //<
    //canReparentNodes:null,
	
	//>	@attr	treeGrid.dragDataAction		(DragDataAction : isc.ListGrid.MOVE : IRWA)
    //
    // Specifies what to do with data dragged from this TreeGrid (into another component, or
    // another node in this TreeGrid.  The default action is to move the data.  A setting of
    // "none" is not recommended for trees because Trees maintain the node open state on the nodes
    // themselves, and hence having multiple Tree objects share a reference to a node can have
    // unintended consequences (such as opening a folder in one tree also triggering an open in
    // another tree that shares the same node).
    // <P>
    // See +link{treeGrid.folderDrop()} for a full explanation of default behaviors on drop, and how to
    // customize them.
	//
    // @see group:sharingNodes
    // @visibility external
	//<
	dragDataAction:isc.ListGrid.MOVE,
    
    
    
    //> @attr treeGrid.openDropFolderDelay (Integer : 600 : IRWA)
    // When dragging something over a closed folder, delay in milliseconds before the folder
    // automatically opens.
    //<
    openDropFolderDelay:600,

    // D&D Error Messages
    // error messages for invalid drag and drop situations.  Can be customized on a per
    // instance basis so something more application-specific can be said, eg "a manager cannot
    // become his own employee"

    //> @attr treeGrid.parentAlreadyContainsChildMessage (String : "This item already contains a child item with that name." : IR)
    // Message displayed when user attempts to drag a node into a parent that already contains
    // a child of the same name/ID.  
    // @see attr:treeGrid.canDragRecordsOut
    // @see attr:treeGrid.canAcceptDroppedRecords
    // @see attr:treeGrid.canReorderRecords
    // @see attr:treeGrid.cantDragMultipleNodeOccurencesMessage
    // @group i18nMessages
    // @visibility external
    //<
    
    parentAlreadyContainsChildMessage:"This item already contains a child item with that name.",
    
	//>	@attr treeGrid.cantDragIntoSelfMessage (String : "You can't drag an item into itself." : IR)
    // Message displayed when user attempts to drop a dragged node onto itself.
    // @see attr:treeGrid.canDragRecordsOut
    // @see attr:treeGrid.canAcceptDroppedRecords
    // @see attr:treeGrid.canReorderRecords
    // @group i18nMessages
    // @visibility external    
    //<
	cantDragIntoSelfMessage:"You can't drag an item into itself.",

	//>	@attr treeGrid.cantDragIntoChildMessage (String : "You can't drag an item into one of it's children." : IR)
    // Message displayed when user attempts to drop a node into a child of itself.
    // @see attr:treeGrid.canDragRecordsOut
    // @see attr:treeGrid.canAcceptDroppedRecords
    // @see attr:treeGrid.canReorderRecords
    // @group i18nMessages
    // @visibility external
    //<
	cantDragIntoChildMessage:"You can't drag an item into one of it's children.",

	//>	@attr treeGrid.cantDragMultipleNodeOccurencesMessage (String : "You can't drag two occurences of the same node into a parent." : IR)
    // For +link{tree.isMultiLinkTree(),Multi-link trees} only, the message displayed when the 
    // user attempts to drag two or more occurences of the same node into a parent.
    // @see attr:treeGrid.canDragRecordsOut
    // @see attr:treeGrid.canAcceptDroppedRecords
    // @see attr:treeGrid.canReorderRecords
    // @see attr:treeGrid.parentAlreadyContainsChildMessage
    // @group i18nMessages
    // @visibility external
    //<
    
	cantDragMultipleNodeOccurencesMessage:"You can't drag two occurences of the same node into a parent.",

    // Body Rendering
	// --------------------------------------------------------------------------------------------

    //>	@attr	treeGrid.fixedFieldWidths		(boolean : true : IRWA)
	//			make trees fixedFieldWidths by default
	//		@group	appearance
	//<
	fixedFieldWidths:true,

    //>	@attr	treeGrid.wrapCells		(boolean : false : IRWA)
	//			don't wrap, as that will mess up the look of the trees
	//		@group	appearance
	//<
	wrapCells:false,

	//>	@attr	treeGrid.showHiliteInCells		(boolean : false : IRWA)
	// Should the hilite show across the entire record or just in the text of the item itself	
	//<
	showHiliteInCells:false,
	
    // Images: locations, sizes, and names
    // --------------------------------------------------------------------------------------------
    //> @attr treeGrid.indentSize (number : 20 : IRW)
    // The amount of indentation (in pixels) to add to a node's icon/title for each level
    // down in this tree's hierarchy.
    // <p>
    // This value is ignored when +link{treeGrid.showConnectors,showConnectors} is
    // <code>true</code> because fixed-size images are used to render the connectors.
    // @visibility external
    // @group appearance
    //<
    indentSize:20,
    
    //> @attr treeGrid.extraIconGap (int: 2 : IR)
    // The amount of gap (in pixels) between the extraIcon (see +link{treeGrid.getExtraIcon()})
    // or checkbox icon and the +link{treeGrid.nodeIcon,nodeIcon}/
    // +link{treeGrid.folderIcon,folderIcon} or node text.
    // @group appearance
    // @visibility external
    //<
    extraIconGap:2,
    
    //>	@attr	treeGrid.iconSize		(number : 16 : [IRW])
    //          The standard size (same height and width, in pixels) of node icons in this
    //          treeGrid.
    // @group treeIcons
    // @visibility external
    //<
	iconSize:16,

    //>	@attr	treeGrid.openerIconSize		(number : null : [IRW])
    // Default width and height in pixels of the opener icons, that is, the icons which show
    // the open or closed state of the node, typically a [+] or [-] symbol, if not overridden
    // by +link{TreeGrid.openerIconWidth}/+link{TreeGrid.openerIconHeight}.
    // <P>
    // If +link{showConnectors} is true, the opener icon includes the connector line, and
    // defaults to +link{listGrid.cellHeight,cellHeight}.
    // <P>
    // Otherwise, <code>openerIconSize</code> defaults to +link{iconSize}.
    //
    // @group treeIcons
    // @visibility external
    //<
    
    //> @attr treeGrid.openerIconWidth (number : null : [IRW])
    // Width in pixels of the opener icons, that is, the icons which show the open or closed
    // state of the node, typically a [+] or [-] symbol.
    // <P>
    // If not specified, +link{TreeGrid.openerIconSize} is used instead.
    //
    // @group treeIcons
    // @visibility external
    //<

    //> @attr treeGrid.openerIconHeight (number : null : [IRW])
    // Height in pixels of the opener icons, that is, the icons which show the open or closed
    // state of the node, typically a [+] or [-] symbol.
    // <P>
    // If not specified, +link{TreeGrid.openerIconSize} is used instead.
    //
    // @group treeIcons
    // @visibility external
    //<

    //>	@attr	treeGrid.skinImgDir		(SCImgURL : "images/TreeGrid/" : IRWA)
	//		Where do 'skin' images (those provided with the class) live?
	//		This is local to the Page.skinDir
	//		@group	appearance, images
	//<
	skinImgDir:"images/TreeGrid/",	

    //> @attr treeGrid.showLoadingIcons (boolean : true : IR)
    // If set, when a folder is loading its children from the server (+link{Tree.getLoadState()}
    // returns "loading"), it uses a distinct icon image given by +link{loadingIcon}.  This is
    // typically used to show a small animating "spinner" icon to let the user know data is being
    // fetched.
    // @group treeIcons
    // @visibility external
    //<
    showLoadingIcons:true,
    
    //> @attr treeGrid.loadingIcon (SCImgURL : "[SKIN]folder_loading.gif" : [IRW])
    // If +link{showLoadingIcons} is set, this icon will be used when the folder is 
    // +link{Tree.getLoadState(),loading children from the server}.
    // @group treeIcons
    // @visibility external
    //<
    loadingIcon:"[SKIN]folder_loading.gif",
    
    //>	@attr	treeGrid.folderIcon        (SCImgURL : "[SKIN]folder.gif" : [IRW])
    // The URL of the base icon for all folder nodes in this treeGrid. Note that this URL will
    // have +link{treeGrid.openIconSuffix}, +link{treeGrid.closedIconSuffix} or 
    // +link{treeGrid.dropIconSuffix} appended to indicate state changes if appropriate - 
    // see documentation on  +link{treeGrid.showOpenIcons}, +link{treeGrid.showSelectedIcons}
    // and +link{treeGrid.showDropIcons}.
    // <P>
    // See +link{treeGrid.showNodeIcons} and +link{treeGrid.showFolderIcons} for details on suppressing 
    // display of icons
    //
    // @group treeIcons
    //      @visibility external
    // @example nodeTitles
    //<
    folderIcon:"[SKIN]/folder.gif",


    //> @attr treeGrid.iconPadding (Integer : 2 : IR)
    // Default padding to show between the folder or leaf node icon and cell value in the tree cell.
    // <P>
    // May be overridden for +link{folderIcon,folderIcons} by via +link{folderIconPadding}.
    // May also be overridden for individual nodes by setting the +link{iconPaddingProperty} 
    // value on individual nodes
    //
    // @visibility external
    //<
    // Default iconPadding is set in ListGrid.js
    // See TreeCell.js for getIconPadding() implementation

    //> @attr treeGrid.folderIconPadding (Integer : null : IR)
    // Default padding to show between folder icon and cell value in the tree cell.
    // This property is only consulted for folder nodes. If unset, +link{iconPadding} will be
    // applied to both folder and leaf nodes.
    // <P>
    // To set the icon padding for individual nodes, use +link{iconPaddingProperty}
    // 
    // @visibility external
    //<

    //> @attr treeGrid.iconPaddingProperty (String : "iconPadding" : IR)
    // This property allows the developer to specify custom 
    // +link{iconPadding} for specific nodes
    //
    // @group treeIcons
    // @visibility external
    //<
    iconPaddingProperty:"iconPadding",


    //> @attr   treeGrid.dropIconSuffix   (String : "drop" : [IR])
    // If +link{treeGrid.showDropIcons} is true, this suffix will be appended to the
    // +link{treeGrid.folderIcon} when the user drop-hovers over some folder.
    // @group treeIcons
    // @visibility external
    //<
    dropIconSuffix:"drop",
    
    //> @attr   treeGrid.openIconSuffix   (String : "open" : [IR])
    // If +link{showOpenIcons} is true, this suffix will be appended to the
    // +link{folderIcon} for open folders in this grid.
    // @group treeIcons
    // @visibility external
    //<
    openIconSuffix:"open",
    
    //> @attr   treeGrid.closedIconSuffix   (String : "closed" : [IR])
    // This suffix will be appended to the +link{folderIcon} for closed folders.
    // If +link{showOpenIcons} is set to <code>false</code> this suffix will also be
    // appended to open folders' icons.
    // @group treeIcons
    // @visibility external
    //<
    closedIconSuffix:"closed",

    //> @attr   treeGrid.selectedIconSuffix   (String : "selected" : [IR])
    // If +link{showSelectedIcons} is true, this suffix will be appended to the
    // +link{folderIcon} for selected nodes in this grid.
    // @group treeIcons
    // @visibility external
    //<
    selectedIconSuffix:"selected",
    
    //> @attr   treeGrid.nodeIcon  (SCImgURL : "[SKIN]file.gif" : [IRW])
    // The filename of the default icon for all leaf nodes in this grid. To specify a 
    // custom image for an individual node, set the +link{customIconProperty} directly on
    // the node.
    // <P>
    // See +link{treeGrid.showNodeIcons} and +link{treeGrid.showFolderIcons} for details on suppressing 
    // display of icons
    //
    // @group treeIcons
    // @visibility external
    // @example nodeTitles
    //<
    nodeIcon:"[SKIN]/file.gif",    
    
    //>@attr treeGrid.showOpenIcons (Boolean : true : IRW)
    // If true, show a different icon for <code>open</code> folders than closed folders.
    // This is achieved by appending the +link{openIconSuffix} onto the 
    // +link{folderIcon} URL [for example <code>"[SKIN]/folder.gif"</code> might be 
    // replaced by <code>"[SKIN]/folder_open.gif"</code>.<br>
    // <b>Note</b> If this property is set to <code>false</code> the same icon is shown for
    // open folders as for closed folders, unless a custom folder icon was specified. This will be
    // determined by +link{folderIcon} plus the +link{closedIconSuffix}.
    // @group treeIcons
    // @visibility external
    // @example nodeTitles
    //<
    
    showOpenIcons:true,

    //>@attr treeGrid.showSelectedIcons (Boolean : false : IRW)
    // If true, show a different icon for selected nodes than unselected nodes.
    // This is achieved by appending the +link{selectedIconSuffix} onto the 
    // +link{folderIcon} URL or +link{nodeIcon} for selected records.
    // <P>
    // If appropriate, this suffix will be combined with the 
    // +link{treeGrid.openIconSuffix} or +link{treeGrid.closedIconSuffix} (see 
    // +link{treeGrid.showOpenIcons}. So a treeGrid with its <code>folderIcon</code>
    // property set to <code>"[SKIN]/folder.gif"</code>, with both
    // <code>showSelectedIcons</code> and <code>showOpenIcons</code> set to true would show
    // an icon with the URL <code>"[SKIN]/folder_open_selected.gif"</code> for a
    // folder that was both selected and opened.
    //
    // @group treeIcons
    // @visibility external
    //<
    showSelectedIcons:false,

    //>@attr treeGrid.showDropIcons (Boolean : true : IRW)
    // If true, when the user drags a droppable target over a folder in this TreeGrid, show 
    // a different folder icon.
    // This is achieved by appending the +link{treeGrid.dropIconSuffix} onto the
    // +link{TreeGrid.folderIcon} URL (for example <code>"[SKIN]/folder.gif"</code> may be
    // replaced by <code>"[SKIN]/folder_drop.gif"</code>).
    // @group treeIcons
    // @visibility external
    // @example nodeTitles
    //<
    showDropIcons:true,
    
    //> @attr   treeGrid.customIconProperty   (String : "icon" : [IRW])
    // This property allows the developer to rename the 
    // +link{TreeNode.icon, default node.icon} property.
    // @group treeIcons
    // @visibility external
    //<
    customIconProperty:"icon",

    //> @attr   treeGrid.customIconOpenProperty (String : "showOpenIcon" : [IRWA])
    // This property allows the developer to rename the 
    // +link{TreeNode.showOpenIcon, default node.showOpenIcon} property.
    // @see treeGrid.customIconProperty
    // @see treeGrid.showCustomIconOpen
    // @visibility external
    // @group treeIcons
    //<
    customIconOpenProperty:"showOpenIcon",
    
    //> @attr   treeGrid.customIconDropProperty (String : "showDropIcon" : [IRWA])
    // This property allows the developer to rename the 
    // +link{TreeNode.showDropIcon, default node.showDropIcon} property.
    // @see treeGrid.customIconProperty
    // @see treeGrid.showCustomIconDrop
    // @visibility external
    // @group treeIcons
    //<
    customIconDropProperty:"showDropIcon",

    //> @attr treeGrid.customIconSelectedProperty (String : "showSelectedIcon" : [IRWA])
    // This property allows the developer to rename the 
    // +link{TreeNode.showSelectedIcon, default node.showSelectedIcon} property.
    // @see treeGrid.customIconProperty
    // @see treeGrid.showCustomIconSelected
    // @visibility external
    // @group treeIcons
    //<
    customIconSelectedProperty:"showSelectedIcon",

    //> @attr   treeGrid.showCustomIconOpen   (Boolean : false : [IRWA])
    // Should folder nodes showing custom icons (set via the +link{customIconProperty}),
    // show open state images when the folder is opened.
    // If true, the +link{openIconSuffix} will be appended to the image URL
    // (so <code>"customFolder.gif"</code> might be replaced with 
    // <code>"customFolder_open.gif"</code>).<br>
    // <b>Note</b> that the +link{closedIconSuffix} is never appended to custom folder icons.<br>
    // Can be overridden at the node level via the default property +link{treeNode.showOpenIcon}
    // and that property can be renamed via +link{treeGrid.customIconOpenProperty}.
    // @group treeIcons
    // @visibility external
    //<
    showCustomIconOpen:false,
    
    //> @attr   treeGrid.showCustomIconDrop   (Boolean : false : [IRWA])
    // Should folder nodes showing custom icons (set via the +link{treeGrid.customIconProperty},
    // default +link{treeNode.icon}),
    // show drop state images when the user is drop-hovering over the folder.
    // If true, the +link{treeGrid.dropIconSuffix} will be appended to the image URL
    // (so <code>"customFolder.gif"</code> might be replaced with 
    // <code>"customFolder_drop.gif"</code>).<br>
    // Can be overridden at the node level via the default property +link{treeNode.showDropIcon}
    // and that property can be renamed via +link{treeGrid.customIconDropProperty}.
    // @group treeIcons
    // @visibility external
    //<
    showCustomIconDrop:false,
    
    //> @attr   treeGrid.showCustomIconSelected   (Boolean : false : [IRWA])
    // Should folder nodes showing custom icons (set via the +link{customIconProperty}),
    // show selected state images when the folder is selected, 
    // if +link{showSelectedIcons} is true?
    // <P>
    // If true, the +link{selectedIconSuffix} will be appended to the image URL
    // (so <code>"customFolder.gif"</code> might be replaced with 
    // <code>"customFolder_selected.gif"</code>).<br>
    // Can be overridden at the node level via the default property +link{treeNode.showSelectedIcon}
    // and that property can be renamed via +link{treeGrid.customIconSelectedProperty}.
    // @group treeIcons
    // @visibility external
    //<
    showCustomIconSelected:false,
    
    //> @attr   treeGrid.showDisabledSelectionCheckbox  (Boolean : false : [IR])
    // Should tree nodes show a disabled checkbox 
    // +link{ListGrid.selectionAppearance, selectionAppearance}:"checkbox" 
    // is set on the treegrid, and a node can't be selected? 
    // <P>
    // If set to <code>false</code> the treeGrid will use 
    // +link{treeGrid.leaveSelectionCheckboxGap} to determine whether to leave
    // a blank space where the checkbox would normally appear.
    //
    // @see ListGrid.recordCanSelectProperty
    // @group treeIcons
    // @visibility external
    //<
    
    //> @attr treeGrid.leaveSelectionCheckboxGap (Boolean : true : [IR])
    // If +link{ListGrid.selectionAppearance, selectionAppearance}:"checkbox" 
    // is set on the treegrid, and a node can't be selected, should a gap be left where
    // the checkbox icon would normally appear, in order to make the node's icon and title
    // line up with the content for other nodes in the same parent?
    // <p>
    // Has no effect if +link{showDisabledSelectionCheckbox} is <code>true</code>
    // @see ListGrid.recordCanSelectProperty
    // @group treeIcons
    // @visibility external
    //<
    leaveSelectionCheckboxGap:true,
    
    // ---------------------------------
    // DEPRECATED ICON PROPERTIES:
    // 
            
    //>	@attr	treeGrid.folderOpenImage        (String : null : [IRW])
    //          The filename of the default icon for all open folder nodes in this treeGrid.
    //      @visibility external
    //  @deprecated as part of SmartClient release 5.5 in favor of +link{TreeGrid.folderIcon}
    //<

    //>	@attr	treeGrid.folderClosedImage		(String : null : [IRW])
    // The filename of the default icon for all closed folder nodes in this treeGrid. Use
    // the node.icon property (null by default) to specify a custom image for an individual
    // folder node. The same custom image will be used for both the open and closed folder
    // images.
    //      @visibility external
    //  @deprecated as part of SmartClient release 5.5 in favor of +link{TreeGrid.folderIcon}
    //<

    //>	@attr	treeGrid.folderDropImage       (String : null : [IRW])
    // The filename of the icon displayed for a folder node that will accept drag-and-drop
    // data when the mouse is released.
    //      @visibility external
    //  @deprecated as part of SmartClient release 5.5 in favor of +link{TreeGrid.folderIcon}    
    //<

    //>	@attr	treeGrid.fileImage             (SCImgURL : "[SKIN]file.gif" : [IRW])
    // The filename of the default icon for all leaf nodes in this treeGrid. Use the
    // node.icon property (null by default) to specify a custom image for an individual
    // node.
    //      @visibility external
    //  @deprecated as part of SmartClient release 5.5 in favor of +link{TreeGrid.nodeIcon}
    //<
    
    // --------------------

    //>	@attr	treeGrid.manyItemsImage        (SCImgURL : "[SKIN]folder_file.gif" : [IRW])
    // The filename of the icon displayed use as the default drag tracker when for multiple
    // files and/or folders are being dragged.
    // @group dragdrop
    //      @visibility external
    //<
	manyItemsImage:"[SKIN]folder_file.gif",
    
    //>	@attr	treeGrid.showConnectors (Boolean : false : [IRW])
    // Should this treeGrid show connector lines illustrating the tree's hierarchy?
    // <P>
    // For the set of images used to show connectors, see +link{connectorImage}.
    // <P>
    // <b>Note</b>: in order for connector images to be perfectly connected, all styles for
    // cells must have no top or bottom border or padding.  If you see small gaps in connector
    // lines, check your CSS files.  See the example below for an example of correct
    // configuration, including example CSS.
    // 
    // @group treeIcons
    // @example connectors
    // @visibility external
    //<
    
    showConnectors : false,
    
    //>	@attr	treeGrid.showFullConnectors (Boolean : true : [IRW])
    // If +link{treeGrid.showConnectors} is true, this property determines whether we should show
    // vertical continuation lines for each level of indenting within the tree. Setting to
    // false will show only the hierarchy lines are only shown for the most indented path ("sparse"
    // connectors).
    // @group treeIcons
    // @visibility external
    //<
    // Default to false since older skins won't have all the media required to render full
    // connector lines out.
    // The logic to show full connectors involves iterating through the parents for each node
    // being written out. This is a potential performance hit. We could improve this performance
    // by adding caching logic to the Tree when calculating where the continuation lines should
    // appear if this is a problem.
    showFullConnectors:true,
    
    //> @attr treeGrid.showOpener (Boolean : true : [IRW])
    // Should the opener icon be displayed next to folder nodes? This is an icon
    // which visually indicates whether the folder is opened or closed (typically via
    // a [+] or [-] image, or a turn-down arrow) and may be clicked to expand or collapse
    // the folder.
    // <P>
    // For folders with no children, this icon is not shown unless 
    // +link{treeGrid.alwaysShowOpener} is <code>true</code>. Note that for trees which
    // +link{treeGrid.loadDataOnDemand,load data on demand}, we may not know if a folder
    // has any descendants if it has never been opened. As such we will show the
    // opener icon next to the folder. Once the user opens the icon and a fetch occurs,
    // if the folder is empty, and +link{alwaysShowOpener} is false, the opener icon
    // will be hidden.
    // <P>
    // For more information on load on demand trees, and how we determine whether
    // a node is a a folder or a leaf, please refer to the +link{group:treeDataBinding}
    // documentation.
    // <P>
    // The opener icon URL is derived from the specified
    // +link{treeGrid.openerImage} or +link{treeGrid.connectorImage} depending on
    // +link{treeGrid.showConnectors}. If +link{treeGrid.showSelectedOpener} is specified
    // a separate opener icon will be displayed for selected nodes.
    //
    // @visibility external
    //<
    showOpener:true,
    
    //> @attr treeGrid.alwaysShowOpener (Boolean : false : IRW)
    // If +link{treeGrid.showOpener} is true, should we display the opener icon
    // for folders even if they have no children?
    // <P>
    // Note that for trees which
    // +link{treeGrid.loadDataOnDemand,load data on demand}, we may not know if a folder
    // has any descendants if it has never been opened. As such we will show the
    // opener icon next to the folder. Once the user opens the icon and a fetch occurs,
    // if the folder is empty, and this property is false, the opener icon
    // will be hidden.
    // <P>
    // For more information on load on demand trees, and how we determine whether
    // a node is a a folder or a leaf, please refer to the +link{group:treeDataBinding}
    // documentation.
    //
    // @visibility external
    //<
    alwaysShowOpener:false,

    //> @attr treeGrid.showSelectedOpener (Boolean : false : [IRW])a
    // If +link{treeGrid.showOpener} is true, should a different opener icon be displayed
    // for selected nodes? This provides a way for developers to show a "selected"
    // version of the opener icon set which looks optimal with the 
    // +link{group:cellStyleSuffixes,selected appearance} applied the selected record.
    // <P>
    // The selected icon URL is created by appending the suffix 
    // <code>"_selected"</code> to the +link{treeGrid.openerImage} or
    // +link{treeGrid.connectorImage}.
    // @group treeIcons
    // @visibility external
    //<

    //>	@attr	treeGrid.openerImage        (SCImgURL : "[SKIN]opener.gif" : [IR])
    // The base filename of the opener icon for the folder node when 'showConnectors' is false
    // for this TreeGrid.<br>
    // The opener icon is displayed beside the folder icon in the Tree column for folder nodes.
    // Clicking on this icon will toggle the open state of the folder.<br>
    // The filenames for these icons are assembled from this base filename and the state of the
    // node, as follows:<br>
    // If the openerImage is set to <code>{baseName}.{extension}</code>, 
    // <code>{baseName}_opened.{extension}</code> will be displayed next to opened folders, and
    // <code>{baseName}_closed.{extension}</code> will be displayed next to closed folders, or
    // if this page is in RTL mode, <code>{baseName}_opened_rtl.{extension}</code> and
    // <code>{baseName}_closed_rtl.{extension}</code> will be used.
    // <P>
    // If +link{showSelectedOpener} is true the URL for selected nodes will append
    // the string <code>"_selected"</code> to the image URLs described above.
    // So for an openerImage set to <code>{baseName}.{extension}</code>, the URLs
    // for selected records would be
    // <code>{baseName}_opened_selected.{extension}</code>, 
    // <code>{baseName}_closed_selected.{extension}</code>, etc.
    //
    // @group treeIcons
    //      @visibility external
    //<
	openerImage:"[SKIN]opener.gif",
    

    //>	@attr	treeGrid.connectorImage        (SCImgURL : "[SKIN]connector.gif" : [IR])
    // The base filename for connector icons shown when +link{TreeGrid.showConnectors} is true.
    // Connector icons are rendered into the title field of each row and show the dotted
    // hierarchy lines between siblings of the same parent node. For each node, a connector icon
    // may be shown:<ul>
    // <li>As an opener icon for folder nodes, next to the folder icon</li>
    // <li>In place of an opener icon for leaf nodes, next to the leaf icon</li>
    // <li>As a standalone vertical continuation line in the indent to the left of the node, to show
    //     a connection between some ancestor node's siblings (only relevant if
    //     +link{TreeGrid.showFullConnectors} is true).</li>
    // </ul>
    // Note that +link{TreeGrid.showFullConnectors} governs whether connector lines will be
    // displayed for all indent levels, or just for the innermost level of the tree.
    // <P>
    // The filenames for these icons are assembled from this base filename and the state of the
    // node.  Assuming the connectorImage is set to <code>{baseName}.{extension}</code>, the
    // full set of images to be displayed will be:
    // <P>
    // <code>{baseName}_ancestor[_rtl].{extension}</code> if +link{TreeGrid.showFullConnectors}
    //  is true, this is the URL for the vertical continuation image to be displayed at the
    //  appropriate indent levels for ancestor nodes with subsequent children.
    // <P>
    // For nodes with no children:
    // <ul>
    // <li><code>{baseName}_single[_rtl].{extension}</code>: Shown when there is no connector line
    //  attached to the parent or previous sibling, and no connector line to the next sibling. For
    //  +link{TreeGrid.showFullConnectors,showFullConnectors:true} trees, there will always be a
    //  connector leading to the parent or previous sibling if its present in the tree so this
    //  icon can only be displayed for the first row.</li>
    // <li><code>{baseName}_start[_rtl].{extension}</code>:  Shown when the there is no connector
    //  line attached to the parent or previous sibling, but there is a connector to the next
    //  sibling. As with <code>_single</code> this will only ever be used for the first row if
    //  +link{TreeGrid.showFullConnectors} is true</li>
    // <li><code>{baseName}_end[_rtl].{extension}</code>:  Shown if we are not showing a connector 
    //  line attached to the next sibling of this node (but are showing a connection to the previous
    //  sibling or parent).</li>
    // <li><code>{baseName}_middle[_rtl].{extension}</code>:  Shown where the we have a connector
    //  line leading to both the previous sibling (or parent) and the next sibling.
    // </ul>
    // For folders with children. Note that if +link{TreeGrid.showFullConnectors} is false, open
    // folders will never show a connector to subsequent siblings:
    // <ul>
    // <li><code>{baseName}_opened_single[_rtl].{extension}</code> opened folder node with 
    //  children when no connector line is shown attaching to either the folder's previous sibling
    //  or parent, or to any subsequent siblings.</li>
    // <li><code>{baseName}_opened_start[_rtl].{extension}</code>:  opened folder with children
    //  when the there is no connector line attached to the parent or previous sibling, but there 
    //  is a connector to the next sibling.</li>
    // <li><code>{baseName}_opened_end[_rtl].{extension}</code>:  opened folder with children 
    //  if we are not showing a connector line attached to the next sibling of this node (but are
    //  showing a connection to the previous sibling or parent).</li>
    // <li><code>{baseName}_opened_middle[_rtl].{extension}</code>: opened folder with children 
    //  where the we have a connector line leading to both the previous sibling (or parent) and the
    //  next sibling.
    // </ul>
    // <ul>
    // <li><code>{baseName}_closed_single[_rtl].{extension}</code> closed folder node with 
    //  children when no connector line is shown attaching to either the folder's previous sibling
    //  or parent, or to any subsequent siblings.</li>
    // <li><code>{baseName}_closed_start[_rtl].{extension}</code>:  closed folder with children
    //  when the there is no connector line attached to the parent or previous sibling, but there 
    //  is a connector to the next sibling.</li>
    // <li><code>{baseName}_closed_end[_rtl].{extension}</code>:  closed folder with children 
    //  if we are not showing a connector line attached to the next sibling of this node (but are
    //  showing a connection to the previous sibling or parent).</li>
    // <li><code>{baseName}_closed_middle[_rtl].{extension}</code>: closed folder with children 
    //  where the we have a connector line leading to both the previous sibling (or parent) and the
    //  next sibling.
    // </ul>
    // (Note '[_rtl]' means that "_rtl" will be attached if isRTL() is true for this widget).
    // <P>
    // If +link{showSelectedOpener} is true the URL for selected nodes will append
    // the string <code>"_selected"</code> to the image URLs described above.
    // So for a connectorImage set to <code>{baseName}.{extension}</code>, the URLs
    // for selected records would be
    // <code>{baseName}_ancestor[_rtl]_selected.{extension}</code>, 
    // <code>{baseName}_single[_rtl]_selected.{extension}</code>, etc.
    //
    // @group treeIcons
    //      @visibility external
    //<
	connectorImage:"[SKIN]connector.gif",

    //>	@attr treeGrid.offlineNodeMessage (String : "This data not available while offline" : [IRW])
    // For TreeGrids with loadDataOnDemand: true, a message to show the user if an attempt is 
    // made to open a folder, and thus load that node's children, while we are offline and 
    // there is no offline cache of that data.  The message will be presented to the user in 
    // in a pop-up dialog box.
    // 
    // @visibility external
    // @group offlineGroup, i18nMessages
    // @see dataBoundComponent.offlineMessage
    //<
    offlineNodeMessage: "This data not available while offline",
    
    //> @attr treeGrid.indentRecordComponents (Boolean : true : IRW)
    // For record components placed "within" the +link{TreeGridField.treeField,treeField}
    // column, should the component be indented to the position where a title would normally
    // show?
    // <P>
    // For more general placement of embedded components, see
    // +link{ListGrid.addEmbeddedComponent, addEmbeddedComponent}.
    // 
    // @visibility external
    //<
    indentRecordComponents: true,

    //> @attr treeGrid.createDefaultTreeField (Boolean : true : IR)
    // If no fields are specified, create a single field with 
    // +link{treeGridField.treeField} set to <code>true</code> to show the tree.
    // <P>
    // This automatically generated field will display values derived by calling
    // +link{treeGrid.getNodeTitle()}, and have the column title set to the specified
    // +link{TreeGrid.treeFieldTitle}.
    // <P>
    // Has no effect if fields are explicitly specified.
    // <P>
    // This is a convenience setting to allow a TreeGrid to be created without specifying a
    // field list.  If fields are specified, refer to the documentation on property
    // +link{treeGrid.autoAssignTreeField} for a way to automatically have one of the fields be
    // use as the tree field if no fields have +link{treeGridField.treeField} set.
    // <P>
    // For databound treeGrids, if there is no explicit fields array specified, developers
    // who wish to pick up all fields from the DataSource definition rather than displaying
    // this single automatically generated tree field may 
    // either set this property to false, or set +link{treeGrid.useAllDataSourceFields}
    // to <code>true</code>.
    //
    // @visibility external
    //<
    createDefaultTreeField: true,
    
    //> @attr treeGrid.useAllDataSourceFields (boolean : null : IRW)
    // @include listGrid.useAllDataSourceFields
    // @visibility external
    //<

    // Disble groupBy for TreeGrids altogether - we're already showing data-derived hierarchy!
    canGroupBy: false,
    
    
    ignoreEmptyCriteria: false,
 
    // users tend to navigate trees by opening and closing nodes more often than by scrolling,
    // so optimize for that use case.
    drawAllMaxCells:50,
    drawAheadRatio:isc.Browser.useHighPerformanceGridTimings ? 2.0 : 1.0,
    
    // heavily used strings for templating
    _openIconIDPrefix: "open_icon_",
    _extraIconIDPrefix:"extra_icon_",
    _iconIDPrefix: "icon_",
    _titleField: "nodeTitle"

});

isc.TreeGrid.addMethods({

initWidget : function () {
	this.invokeSuper(isc.TreeGrid, this._$initWidget);
    
    // if no dataSource is specified on this TG, pick up the dataSource off the data model
    if (!this.dataSource && this.data != null && this.data.dataSource) {
        this.dataSource = this.data.dataSource;
    }

    if (this.createDefaultTreeField && 
        (this.getDataSource() == null || !this.useAllDataSourceFields))
    {
	    // if the fields are not set or of zero length, initialize with a single TREE_FIELD
        // NB: it is not safe to try to determine the tree field before setFields has been run,
        // since fields in this.fields might not be shown if they have a showIf:false
	    if (!this.fields || this.fields.length == 0) {
		    this.fields = [isc.TreeGrid.TREE_FIELD];
        }
    }
},

setDataSource : function (ds, fields) {
    if (this.createDefaultTreeField) {
        // if no fields were passed in, default to showing the tree field.  This matches the
        // behavior if a datbound treeGrid is initialized with no fields.
        if (fields == null || fields.length == 0) {
            fields = [isc.TreeGrid.TREE_FIELD];
        }
    }
    return this.Super("setDataSource", [ds, fields]);
},

cellValueHoverHTML : function (record, rowNum, colNum, defaultHTML) {
    if (colNum == this._treeFieldNum) {
        var returnVal = this.Super("cellValueHoverHTML", arguments);
        if (returnVal != null && !isc.isAn.emptyString(returnVal)) returnVal = "<nobr>" + returnVal + "</nobr>";
        return returnVal;

    // the clipped value hovers are only enabled by default for the tree field.
    } else if (this.showClippedValuesOnHover !== true) return null;
    else return defaultHTML;
},

// make sure one of the fields has been set up as the special "tree field"
_initTreeField : function () {

	// if the fields are not set or of zero length, initialize with a single TREE_FIELD
	if ((!this.fields || this.fields.length == 0) &&
	     (this.getDataSource() == null || !this.useAllDataSourceFields)) 
	{
        
        if (this.createDefaultTreeField) this.fields = [isc.TreeGrid.TREE_FIELD];
	} else {
    
        // see which field is the tree field.  Note this handles both the case that the special
        // constant TreeGrid.TREE_FIELD was provided as a field, and the case that the caller
        // marked a field as a the treeField.
        
        // if none of the fields is specified as the treeField, we look for a "title" field,
        // then we default to the first field in the array; we use this.completeFields so that
        // the treeField property of hidden fields will be checked as well--otherwise we would
        // default another field to be the tree field, and end up with more than one treeField
        // if the hidden treeField became visible again.
        
        var completeFields = this.completeFields,
            fields = this.fields,
            treeFieldNum;
        
        for (var i = 0; i < completeFields.length; i++) {
            if (completeFields[i].treeField) {
                treeFieldNum = fields.indexOf(completeFields[i]);
                break;
            }
        }

        if (treeFieldNum == null) {
            // if autoAssignTreeField has been set false, don't assign a default tree field in 
            // the absence of an explicit marker
            if (!this.autoAssignTreeField) return;
        
    	    // if there is no explicit marker, look for the field that matches the
            // titleProperty declared on the Tree
    	    var titleProp = this.data.titleProperty,
                fieldNum = fields.findIndex(this.fieldIdProperty, titleProp);
            if (fieldNum != -1) treeFieldNum = fieldNum;
        }

        // use the first field if none were marked as the tree field
        if (treeFieldNum == null) {
            treeFieldNum = 0;
            // Skip any fields where treeField is explicitly marked false
            // this includes auto-generated checkbox, rowNumber, etc fields
            while (this.fields[treeFieldNum] && 
                    this.fields[treeFieldNum].treeField == false) 
            {
                treeFieldNum++;
            }
            if (this.fields[treeFieldNum] == null) return;
        }

        // store the chosen fieldNum
        this._treeFieldNum = treeFieldNum;

        // use the properties of TREE_FIELD as defaults for the field
        // Note: We're manipulating the field object in the fields array. 
        // this.completeFields also contains a pointer to this object.
        // We don't want to replace the slot in either array with a different object as
        // that would make them out of synch (causes errors sorting, etc.)
        // - instead just copy any unset properties across from the TREE_FIELD field.
        var treeField = fields[treeFieldNum],
            fieldDefaults = isc.TreeGrid.TREE_FIELD,
            // Don't clobber explicit formatCellValue() / displayField with our
            // custom node title logic.
            hasCustomCellValue = treeField.formatCellValue != null
                             || treeField.displayField != null;
        for (var property in fieldDefaults) {
            if (hasCustomCellValue && property == "getCellValue") {
                continue;
            }
            if (treeField[property] == null) {
                treeField[property] = fieldDefaults[property]
            }
        }
    }
},

// because we store _treeFieldNum as a number, we need to recalc when fields are changed or
// their numbering changes.  This include setFields(), reorderFields(), showField() and hideField().
// 
// Note that the chosen treeField won't shift on reorder, because we install the TREE_FIELD
// properties into the chosen field, and the TREE_FIELD properties includes the treeField:true
// marker.
deriveVisibleFields : function (a,b,c,d) {
    this.invokeSuper(isc.TreeGrid, "deriveVisibleFields", a,b,c,d);
    this._initTreeField();
},

getEmptyMessage : function () {

    if (this.isOffline()) {
        return this.offlineMessage;
    }
    
    // can't just check for data != null because ListGrid initWidget sets data to [] if unset
    // and we must make sure we have a tree.
    if (isc.isA.Tree(this.data) && this.data.getLoadState(this.data.getRoot()) == isc.Tree.LOADING) 
        return this.loadingDataMessage == null ? "&nbsp;" 
                                : this.loadingDataMessage.evalDynamicString(this, {
            loadingImage: this.imgHTML(isc.Canvas.loadingImageSrc, 
                                       isc.Canvas.loadingImageSize, 
                                       isc.Canvas.loadingImageSize)
        });
    return this.emptyMessage.evalDynamicString(this, {
        loadingImage: this.imgHTML(isc.Canvas.loadingImageSrc, 
                                   isc.Canvas.loadingImageSize, 
                                   isc.Canvas.loadingImageSize)
    });
},

isEmpty : function () {

    // can't just check for data != null because ListGrid initWidget sets data to [] if unset
    // and we must make sure we have a tree.
    if (!isc.isA.Tree(this.data)) return true;

    if (this.showNewRecordRow) return false;

    var root = this.data.getRoot();
    if (root == null) return true;

    var rootHasChildren = this.data.hasChildren(root);
    if (rootHasChildren || this.showRoot || this.data.showRoot) return false;
    return true;
},

// Folder Animation
// ---------------------------------------------------------------------------------------
// Because of grouping, the implementation of all of these properties is actually on ListGrid, but is
// re-doc'd here for clarity

//> @attr treeGrid.animateFolders (Boolean : true : IRW)
// If true, when folders are opened / closed children will be animated into view.
// <p>
//  Folder animations are automatically disabled if +link{listGrid.autoFitData} is set to "vertical" or "both", or 
//  if +link{listGrid.showRecordComponents,records components} are used.
// @group animation
// @visibility animation
// @example animateTree
//<

//> @attr treeGrid.animateFolderMaxRows (Integer : null : IRW)
// If +link{animateFolders} is true for this grid, this number can be set to designate
// the maximum number of rows to animate at a time when opening / closing a folder.
// @see getAnimateFolderMaxRows()
// @group animation 
// @visibility external
//<

//> @attr treeGrid.animateFolderTime (number : 100 : IRW)
// When animating folder opening / closing, if +link{treeGrid.animateFolderSpeed} is not
// set, this property designates the duration of the animation in ms.
// @group animation
// @visibility animation
// @see treeGrid.animateFolderSpeed
//<

//> @attr treeGrid.animateFolderSpeed (number : 3000 : IRW)
// When animating folder opening / closing, this property designates the speed of the
// animation in pixels shown (or hidden) per second. Takes precedence over the 
// +link{treeGrid.animateFolderTime} property, which allows the developer to specify a
// duration for the animation rather than a speed.
// @group animation
// @visibility animation
// @see treeGrid.animateFolderTime
// @example animateTree
//<    
    
//> @attr treeGrid.animateFolderEffect (AnimationAcceleration : null : IRW)
// When animating folder opening / closing, this property can be set to apply an
// animated acceleration effect. This allows the animation speed to be "weighted", for
// example expanding or collapsing at a faster rate toward the beginning of the animation
// than at the end.
// @group animation
// @visibility animation
//<    

//> @attr treeGrid.animateRowsMaxTime (number : 1000 : IRW)
// If animateFolderSpeed is specified as a pixels / second value, this property will cap
// the duration of the animation.
// @group animation
// @visibility animation_advanced
//<    

//> @method treeGrid.shouldAnimateFolder ()
// Should this folder be animated when opened / closed? Default implementation will
// return true if +link{treeGrid.animateFolders} is true, the folder being actioned
// has children and the child-count is less than the result of
// +link{treeGrid.getAnimateFolderMaxRows}.
// @group animation
// @param folder (TreeNode) folder being opened or closed.
// @return (boolean) returns true if folders should be animated when opened / closed.
// @visibility external
//<

//> @method treeGrid.getAnimateFolderMaxRows() [A]
// If +link{animateFolders} is true for this treeGrid, this method returns the 
// the maximum number of rows to animate at a time when opening / closing a folder.
// This method will return +link{treeGrid.animateFolderMaxRows} if set. Otherwise
// the value will be calculated as 3x the number of rows required to fill a viewport,
// capped at a maximum value of 75.
// @return (Integer) maximum number of rows to be animated when opening or closing folders.
// @group animation
// @visibility external
//<

// View State 
// ---------------------------------------------------------------------------------------
 
//> @type TreeGridOpenState  
// An object containing the open state for a treeGrid.
// Note that this object is not intended to be interrogated directly, but may be stored 
// (for example) as a blob on the server for state persistence across sessions.
// 
// @baseType String
// @group viewState
// @visibility external
//<
// TreeGridOpenState object is implemented as an array of strings, each of which is the path
// to a currently open folder (all other folders are closed)


//> @method treeGrid.getOpenState() 
// Returns a snapshot of the current open state of this grid's data as
// a +link{type:TreeGridOpenState} object.<br>
// This object can be passed to +link{treeGrid.setOpenState()} to open the same set of folders
// within the treeGrid's data (assuming the nodes are still present in the data).
// @return (TreeGridOpenState) current open state for the grid.
// @group viewState
// @see treeGrid.setOpenState()
// @visibility external
//<
getOpenState : function () {
    var tree = this.data;
    if (tree == null) {
        this.logWarn("getOpenState() called for a treeGrid with no data");
        return [];
    }
    // Defer to ResultTree if available
    if (tree.getOpenState) return tree.getOpenState();

    // Must be using a static Tree
    var root = tree.getRoot(),
        openState = [];
        
    this._addNodeToOpenState(tree, root, openState);
    return isc.Comm.serialize(openState);
},  
// _addNodeToOpenState implemented in ListGrid
// Used for groupTree open/closed state maintenance logic
    
//>	@method	treeGrid.setOpenState() 
// Reset this set of open folders within this grid's data to match the 
// +link{type:TreeGridOpenState} object passed in.<br>
// Used to restore previous state retrieved from the grid by a call to 
// +link{treeGrid.getOpenState()}.
//
// @param openState (TreeGridOpenState) Object describing the desired set of open folders.
// @group viewState
// @see treeGrid.getOpenState()
// @visibility external
//<
setOpenState : function (openState) {
    // Defer to ResultTree if available
    if (this.data && this.data.setOpenState) {
        this.data.setOpenState(openState);
        return;
    }
    // Must be using a static Tree
    openState = this.evalViewState(openState, "openState")
    if (!openState) return;
    
    if (!this.data) {
        this.logWarn("unable to set open state for this treeGrid as this.data is unset");
        return;
    }
    this.data.closeAll();
    this.data.openFolders(openState);
},

//>	@method	treeGrid.getSelectedPaths() 
// Returns a snapshot of the current selection within this treeGrid as 
// a +link{type:ListGridSelectedState} object.<br>
// This object can be passed to +link{treeGrid.setSelectedPaths()} to reset this grid's selection
// the current state (assuming the same data is present in the grid).<br>
// @group viewState
// @see treeGrid.setSelectedPaths();
// @visibility external
// @return (ListGridSelectedState) current state of this grid's selection
//<
getSelectedPaths : function () {
    if (!this.selectionManager) return null;

    if (isc.isA.MultiLinkSelection(this.selectionManager)) {
        return this.getSelectedMultiLinkPaths();
    }

    var selection = this.selectionManager.getSelection(),
        selectionLength = selection.length,
        selectedPaths = [];

    // store paths only.
    for (var i = 0; i < selectionLength; ++i) {
        selectedPaths[i] = this.data.getPath(selection[i]);
    }
    return isc.Comm.serialize(selectedPaths);
},

getSelectedMultiLinkPaths : function () {
    var paths = [];
    
    // TODO - implement!
    
    return paths;
},


// ----------------------------------------------------------------------------
// panelHeader related methods

showActionInPanel : function (action) {
    return this.Super("showActionInPanel", arguments);
},


//>	@method	treeGrid.setSelectedPaths() 
// Reset this grid's selection to match the +link{type:ListGridSelectedState} object passed in.<br>
// Used to restore previous state retrieved from the grid by a call to 
// +link{treeGrid.getSelectedPaths()}.
//
// @group viewState
// @param selectedPaths (ListGridSelectedState) Object describing the desired selection state of
//                                              the grid
// @see treeGrid.getSelectedPaths()
// @visibility external
//<
setSelectedPaths : function (selectedPaths) {
    selectedPaths = this.evalViewState(selectedPaths, "selectedPaths")
    if (!selectedPaths) return;
    
    var selection = this.selectionManager, data = this.data;
    if (data && selection) {
        selection.deselectAll();
        var nodes = [];
        // use find to look up node by path
        for (var i = 0; i < selectedPaths.length; i++) {
            var node = data.find(selectedPaths[i]);
            if (node) nodes.add(node);
        }
        this.selectionManager.selectList(nodes);
        this.fireSelectionUpdated();
    }
},

//> @type   TreeGridViewState  
// An object containing the "view state" information for a treeGrid. In addition to the 
// state data contained by a +link{type:ListGridViewState} object, this will also contain the 
// current open state of the treeGrid in question.<br>
// Note that this object is not intended to be interrogated directly, but may be stored 
// (for example) as a blob on the server for view state persistence across sessions.
// 
// @baseType String
// @group viewState
// @visibility external
//<
// TreeGridViewState object is implemented as a simple JS object containing the following 
// fields:
// - selected [an (undocumented) treeGridSelectedState object - an array of selected nodes' paths]
// - field [a ListGridFieldState object]
// - sort [a ListGridSortState object]
// - open [a TreeGridOpenState object]

//>	@method	treeGrid.getViewState() 
// Overridden to return a +link{type:TreeGridViewState} object for the grid.
// @return (TreeGridViewState) current view state for the grid.
// @group viewState
// @see type:TreeGridViewState
// @see treeGrid.setViewState();
// @visibility external
//<    
getViewState : function () {
    var state = this.Super("getViewState", [true]);
    state.open = this.getOpenState();
    return "(" + isc.Comm.serialize(state) + ")";
},
    

//>	@method	treeGrid.setViewState() 
// Overridden to take a +link{type:TreeGridViewState} object.
//
// @param viewState (TreeGridViewState) Object describing the desired view state for the grid
// @group viewState
// @see treeGrid.getViewState()
// @visibility external
//<    
setViewState : function (state) {

    // Ensure we set open state after setting sort state
    this.Super("setViewState", arguments);
    // don't bother warning on error - Super() will have done that already
    state = this.evalViewState(state, "viewState", true)
    if (!state) return;
    
    if (state.open) this.setOpenState(state.open);
    // Re-apply selection so that nodes just opened can be found.
    if (state.selected) this.setSelectedState(state.selected);
},


// if data is not specified, use an empty Tree.
getDefaultData : function () {
    // NOTE: initializing to a ResultTree would effectively trigger fetch on draw.  Don't want
    // to do this unless fetchData() is called (possibly via autoFetchData property), in which
    // case the empty starter Tree will be discarded and replaced by a ResultTree
    //if (this.dataSource) return this.createResultTree();
    return isc.Tree.create({_autoCreated:true});
},

//>	@method	treeGrid.setData()
// Set the +link{class:Tree} object this TreeGrid will view and manipulate.
//
// @param newData (Tree) Tree to show
// @visibility external
//<
setData : function (newData) {
    if (this.data) {
        if (this.separateFolders != null) this.data.setSeparateFolders(this.separateFolders);
        if (this.sortFoldersBeforeLeaves != null) {
            this.data.setSortFoldersBeforeLeaves(this.sortFoldersBeforeLeaves);
        }
    }

    this.Super("setData", arguments);
    if (!isc.isA.Tree(this.data)) return;

    // Set the `separateFolders` and `showRoot` options of the tree as well.
    if (this.separateFolders != null) this.data.setSeparateFolders(this.separateFolders);
    if (this.sortFoldersBeforeLeaves != null) {
        this.data.setSortFoldersBeforeLeaves(this.sortFoldersBeforeLeaves);
    }

    if (this.showRoot && isc.ResultTree && isc.isA.ResultTree(this.data)) {
        this.logWarn("showRoot may not be set with a databound treeGrid, unexpected " +
                     "results may occur");
    }
    this.data.setShowRoot(this.showRoot);

    // should we show only branches or leaves
    this.data.setOpenDisplayNodeType(this.displayNodeType);

    if (this.autoPreserveOpenState != null) {
        this.data.autoPreserveOpenState = this.autoPreserveOpenState
    }
},

// helper to get the parent nodes to fetch to refresh this TG
_getNodesToOpenForRefresh : function (request, context) {

    var nodes = [],
        data = this.data
    ;

    
    if (data.isPaged()) {
        // use offset to center page around draw area if it's large enough
        var visibleRows = this.getVisibleRows(),
            nRows = visibleRows[1] - visibleRows[0] + 1,
            offset = Math.max(0, Math.floor((data.resultSize - nRows) / 2))
        ;

        // loop through rows of the draw area, accumulating parent and ancestor nodes
        var parents = [];
        for (var i = visibleRows[0]; i <= visibleRows[1]; i++) {
            var parent, record = this.getRecord(i), isOpen;

            if (data.isMultiLinkTree()) {
                isOpen = data.isOpen(data.getNodeLocator(data.getPathForOpenListIndex(i)));
            } else {
                isOpen = data.isOpen(record);
            }
            // consider record a parent if it's open
            var recordPath;
            if (isOpen) {
                parent = record, record = null;
            } else {
                if (data.isMultiLinkTree()) {
                    recordPath = data.getPathForOpenListIndex(i);
                    parent = data.getParent(data.getNodeLocator(recordPath));
                } else {
                    parent = data.getParent(record);
                }
            }

            // skip any parent that's already been accounted
            if (!parent || parent._openForRefresh) continue;

            // build a list of ancestors, with those closest to the root at the end
			var chainedParentPath = data._deriveParentPath(recordPath);
            for (var chainedRecord = record,    chainedParent = parent; chainedParent; 
                 chainedRecord = chainedParent, chainedParent = data.getParent(chainedParent, chainedParentPath))
            {
                if (chainedParent._openForRefresh == null) {
                    // configure startRow based on position of record relative to parent
                    var children = data.getChildren(chainedParent);
                    if (children && chainedRecord) {
                        var index = children.indexOf(chainedRecord);
                        if (index > offset) chainedParent._refreshStart = index - offset;
                    }
					
                    chainedParent._openForRefresh = true;
                    parents.add(chainedParent);
                }
				chainedParentPath = data._deriveParentPath(chainedParentPath);
            }
            // add ancestors to master list in reverse - so root is first
            while (parents.length > 0) {
                nodes.add(parents.last());
                parents.length--;
            }
        }

        // clean accounting scribblings off the parent nodes
        nodes.map(function (node) { delete node._openForRefresh; });

        // configure request for dataFetchMode: "paged"
        if (this.keepParentsOnFilter) {
            request.keepParentsOnFilter = true;
        }
        request.sortBy = isc.shallowClone(this._serverSortBy);

        // remember the first visible node so it can be restored
        var topNode = this.getRecord(visibleRows[0]);
        if (topNode) context.topNodePath = data.getPath(topNode);

    } else { // non-paged

        
        if (!data.showRoot) nodes.add(data.getRoot());
        nodes.addList(data._getOpenList().filter(function(node, index) {
            if (!data.isMultiLinkTree()) {
                return data.isOpen(node);
            } else {
                return data.isOpen(data.getNodeLocator(index));
            }
        }));
        request.dataFetchMode = data.fetchMode;
        request.sortBy = this.getSort();
    }

    return nodes;
},

// method to refreshData() for a multi-DS or "load on demand" TreeGrid
_refreshResultTreeData : function (callback, skipDataChanged) {

    var data = this.getData();

    

    var request = {
        showPrompt: false,
        willHandleError: true,
        componentId: this.getID()
    };

    // context for _refreshResultTreeDataReply()
    var refreshContext = this._refreshContext = {
        newData: null,
        callback: callback,
        skipDataChanged: skipDataChanged,
        openState: data.getOpenState(),
        selectedState: this.getSelectedState()
    };

    // many fetches may be issued - queue for performance
    isc.RPCManager.startQueue();

    // configure the request using the existing RT's context
    var context = data.context;
    if (context && context.textMatchStyle) request.textMatchStyle = context.textMatchStyle;
    if (context && context.operationId)    request.operationId    = context.operationId;

    if (this.implicitCriteria) {
        request.dbcImplicitCriteria = this.getImplicitCriteria();
    }

    // for new RT, determine which parent nodes should have their children fetched
    var nodesToOpen = this._getNodesToOpenForRefresh(request, refreshContext)

    for (var i = 0; i < nodesToOpen.length; i++) {
        
        var parentNode = nodesToOpen[i],
            relationship = data._getRelationship(parentNode, true),
            childDS = relationship.childDS,
            parentDS = relationship.parentDS
        ;

        // fetch criteria - this will differ from the overall ResultTree.criteria
        var criteria = data._getLoadChildrenCriteria(parentNode, relationship, true);

        
        var internalClientContext = {
            fetchCount : ++data.currentFetch,
            parentPath: data.getPath(parentNode),
            relationship: relationship
        };

        // build request props based on parentNode, fixed request, and data/client context
        var requestProperties = data._getLoadChildrenRequestPropsFromContext(childDS, parentDS,
                                    parentNode, internalClientContext, request);

        // install startRow/endRow for paged RTs
        if (data.isPaged()) {
            var start = 0;
            if (parentNode._refreshStart > 0) {
                start = parentNode._refreshStart;
                delete parentNode._refreshStart;
            }
            requestProperties.startRow = start;
            requestProperties.endRow = start + data.resultSize;
        }

        // we've got to hook each reply to install a parentNode from new tree
        childDS.fetchData(criteria, function (dsResponse, data, dsRequest) {

            // if one of the responses is bad, mark refreshContext as failed
            if (dsResponse.status != 0 && !refreshContext._badResponse) {
                refreshContext._badRequest  = dsRequest;
                refreshContext._badResponse = dsResponse;
            }
            if (refreshContext._badResponse) return;

            // first response - create new tree with old criteria and context
            if (!refreshContext.newData) {
                var oldData = this.getData();
                refreshContext.newData = this.createResultTree(oldData.criteria, null, 
                                             oldData.context, null, null, true);
            }
            // now resolve the parentNode from its path and call loadChildrenReply()
            var newData = refreshContext.newData,
                clientContext = dsResponse.internalClientContext,
                parentNode = newData.find(clientContext.parentPath);
            if (newData.isMultiLinkTree() && !newData.linkData && oldData) {
                newData.linkData = oldData.linkData;
            }
            if (parentNode) {
                clientContext.parentNode = parentNode;
                var childDS = clientContext.relationship.childDS;
                parentNode._derivedChildNodeType = childDS.ID;
                newData.loadChildrenReply(dsResponse, data, dsRequest);
            }
        }.bind(this), requestProperties);

    } // end fetching nodesToOpen

    // send the fetches as a single, batched request - responses will complete refresh
    isc.RPCManager.sendQueue({caller: this, methodName: "_refreshResultTreeDataReply"});
},

// complete _refreshResultTreeData() by installing new RT, reapplying old state
_refreshResultTreeDataReply : function (dsResponses) {
                         
    var refreshContext = this._refreshContext;
    delete this._refreshContext;

    var callback = refreshContext.callback,
        badRequest = refreshContext._badRequest,
        badResponse = refreshContext._badResponse
    ;

    // failed to refresh data - report error and fire callback
    if (badRequest) {
        if (callback) callback(dsResponses);
        return this._handleRefreshDataError(badResponse, badRequest);
    }

    // open all nodes that were originally open
    var newData = refreshContext.newData;
    newData.setOpenState(refreshContext.openState);

    // save total row count to detect changes
    var origTotalRows = this.getTotalRows();

    // install the new RT into the TG, and restore selected rows
    var originalPreserveEditsOnSetData = this.preserveEditsOnSetData;
    this.preserveEditsOnSetData = true;
    this.setData(newData);
    this.preserveEditsOnSetData = originalPreserveEditsOnSetData;
    this.setSelectedState(refreshContext.selectedState);

    
    var topPath = refreshContext.topNodePath,
        topNode = topPath ? newData.find(topPath) : null;
    if (topNode) {
        var index = this.getRecordIndex(topNode);
        if (index >= 0) this.scrollToRow(index, "top", true);
    }

    // run the dataChanged() notification if the grid's total row count has changed
    
    if (origTotalRows != this.getTotalRows()) {
        this.logDebug("refreshData() has changed the total row count", "refreshData");
        if (!refreshContext._skipDataChanged) this.dataChanged();
    }

    // deliver our arguments to the callback
    if (callback) callback(dsResponses);
},

_getSortNormalizerForField : function(field, b, c, d) {
    
    if (field == isc.TreeGrid.TREE_FIELD && isc.ResultTree && isc.isA.ResultTree(this.data)) {
        if (this.data.isPaged()) return isc.TreeGrid._pagedTreeFieldSortNormalizer;
    }
    return this.invokeSuper(isc.TreeGrid, "_getSortNormalizerForField", field, b, c, d);
},

draw : function (a,b,c,d) {
    
    if (this.initialData && (!isc.ResultSet || !isc.isA.ResultSet(this.data)) &&
        (!this.data || !isc.isA.ResultTree(this.data))) {
        // create and initialize the ResultTree for this TreeGrid without doing a fetch
        
        var context = isc.addProperties({_alreadyDuped: true, _suppressFetch: true}, 
                                        this.getInitialFetchContext());
        this.fetchData(this.getInitialCriteria(), null, context);
        delete context._suppressFetch;
    }
    
    this.invokeSuper(isc.TreeGrid, "draw", a,b,c,d);
},

bodyConstructor:"TreeGridBody",

// Override bodyKeyPress to handle open and closing of trees
// Note: standard windows behavior with Left and Right arrow key presses in a treeGrid is:
// - multiple selection seems to *always* be disallowed, so doesn't come into play
// - arrow right on a closed folder will open the folder
// - arrow right on an open folder (with content) will move selection to the first child node
// - arrow left on an open folder will close the folder
// - arrow left on a node within a folder will move selection to the node's parent folder

bodyKeyPress : function (event) {

    // if exactly one record is selected, mimic windows LV behaviors for arrow left and right
    var selection = this.selectionManager;
    if (this.selectionType != isc.Selection.NONE && 
        this.data.getLength() > 0 &&
        selection.anySelected() &&
        // no multipleSelected on CellSelection
        (!selection.multipleSelected || !selection.multipleSelected()))
    {
        var focusCell = this.getFocusCell(),
            rowNum = focusCell[0],
            colNum = focusCell[1],
            node = this.getRecord(rowNum),
            nodeLocator, parent;

        if (this.data.isMultiLinkTree()) {
            var path = this.data.getPathForOpenListIndex(rowNum);
            parent = this.data.getParent(node, path);
            nodeLocator = this.data.createNodeLocator(node, parent, null, path);
        } else {
            parent = this.data.getParent(node);
        }

        // Left/right arrow key interaction if we can expand records:
        // - allow first right arrow to open a folder
        // - allow second right arrow to expand a folder
        // - allow third right arrow to navigate into the the folder
        // 
        // - allow first left arrow to collapse a 'canExpand' folder
        // - allow second left arrow to close a folder
        // - allow third left arrow to navigate up to parent
        // Expand / collapse is implemented at the ListGrid level.
        // 
        // If cell selection is enabled, some of this becomes non-intuitive, so 
        // we limit behavior in this case:
        // - if focus is on the first cell of a folder, allow a right/left arrow click to
        //   open/close the folder if it's not already in the expected state
        // - otherwise just shift focus through the columns in the row as we would in a ListGrid
        if (event.keyName == "Arrow_Left") {
            if (!this.canExpandRecords || 
                       !(this._canExpandRecord(node,this.getFocusRow()) 
                         && this.isExpanded(node))
                        ) 
            {
                if ((!this.canSelectCells || 
                    (this.getTreeFieldNum() == colNum)) &&
                    (this.data.isFolder(node) && this.data.isOpen(nodeLocator || node))) 
                {
                     this.closeFolder(nodeLocator || node, path);
                    return false;
                // If canSelectCells is true, navigating to parents/children on right/left
                // arrow keypress is counter-intuitive
                } else if (!this.canSelectCells) {
                    // if node is open and has parent, iterate over nodes, until we
                    // reach to parent then navigate to that record directly.
                    if (parent) {
                        var row = rowNum;
                        while(row>0 && this.getRecord(row) != parent) {
                            row--;
                        }

                        // if parent was found, navigate to it
                        if (this.getRecord(row) == parent) {
                            this._navigateToNextRecord(row-this.getFocusRow(),false);
                            return false;
                        }
                    }
                }
            }
            
        } else if (event.keyName == "Arrow_Right") {
            if (this.data.isFolder(node)) {
                if ((!this.canSelectCells || 
                    (this.getTreeFieldNum() == colNum)) && 
                    !this.data.isOpen(node, path)) 
                {
                    this.openFolder(node, path);
                    return false;
                // If we're collapsed, allow left arrow to collapse, before navigating!
                } else if (!this.canSelectCells && 
                            (!this.canExpandRecords || 
                           !(this._canExpandRecord(node,this.getFocusRow()) 
                             && !this.isExpanded(node))
                            )
                          ) 
                {
                    if (this.data.hasChildren(node)) {
                        this._navigateToNextRecord(1,false);
                        return false;
                    }
                }
            } 
        }
    // Otherwise, support left/right arrow closing/opening of folders only
    } else {
        var node = this.getRecord(this.getFocusRow());

        // Left/right arrow key interaction if we can expand records:
        // - allow right arrow to open a folder
        // - allow left arrow to close a folder
        if (event.keyName == "Arrow_Left") {
            if ((!this.canSelectCells || 
                (this.getTreeFieldNum() == colNum)) &&
                this.data.isFolder(node) && this.data.isOpen(node, path)) 
            {
                this.closeFolder(node, path);
                return false;
            }
            
        } else if (event.keyName == "Arrow_Right") {
            if ((!this.canSelectCells || 
                (this.getTreeFieldNum() == colNum)) &&
                this.data.isFolder(node) && !this.data.isOpen(node, path)) 
            {
                this.openFolder(node, path);
                return false;
            } 
        }
    }
    
    return this.Super("bodyKeyPress", arguments);
    
},


// fire synthetic context menu events for nodes
_cellContextClick : function (record, recordNum, fieldNum) {

	if (recordNum < 0 || fieldNum < 0) return true; // not in body, allow native context menu

	var isFolder = this.data.isFolder(record);
    
    // fire synthetic context click events.  Note any of these can cancel further processing by
    // returning an explicit false, which presumably indicates they've shown a context menu
    if (this.nodeContextClick && this.nodeContextClick(this, record, recordNum) == false) {
        return false;
    }
    if (isFolder) {
        if (this.folderContextClick && this.folderContextClick(this, record, recordNum) == false) {
            return false;
        }
    } else {
        if (this.leafContextClick && this.leafContextClick(this, record, recordNum) == false) {
            return false;
        }
    }

    // fire the superclass implementation of this method to fire 'cellContextClick', if defined,
    // and show the default context menu if appropriate
    return this.Super("_cellContextClick", arguments);
	
},

//>	@method	treeGrid.handleEditCellEvent()
//		@group	event handling	
//			Override handleEditCellEvent to not allow editing if the click / doubleClick event 
//          occurred over the open area of the treeGrid
//
//		@return	(boolean)	false == cancel further event processing
//<
handleEditCellEvent : function (recordNum, fieldNum) {

    var record = this.getRecord(recordNum);
    // if they're clicking in the open or checkbox area of the list,
    // don't allow editing to proceed
    if (this.clickInOpenArea(record) || this.clickInCheckboxArea(record)) return false;
	
	// return the results of a call to the superclass method
	return this.Super("handleEditCellEvent",arguments);
},

//>	@method     treeGrid.canEditCell()	
// Overridden to disallow editing of the +link{treeNode.name, name} field of this grid's data
// tree. Also disallows editing of the auto-generated tree field, which displays the result
// of +link{method:Tree.getTitle} on the node.
// @return (Boolean) Whether to allow editing this cell
// @visibility external
//<
canEditCell : function (rowNum, colNum) {

    if (this.Super("canEditCell", arguments) == false) return false;

    
    if (this.getField(colNum)[this.fieldIdProperty] == this.data.nameProperty) return false;
    
    
    if (this.getField(colNum)[this.fieldIdProperty] == this._titleField) return false;

    return true;
},

//> @method treeGrid.startEditingNew()
// This inherited +link{listGrid.startEditingNew,ListGrid API} is not supported by the TreeGrid
// since adding a new tree node arbitrarily at the end of the tree is usually not useful.
// Instead, to add a new tree node and begin editing it, use either of these two strategies:
// <ol>
// <li> add a new node to the client-side Tree model via +link{Tree.add()}, then use
// +link{listGrid.startEditing(), TreeGrid.startEditing()} to begin editing this node.  Note that if using a DataSource, when the
// node is saved, an "update" operation will be used since adding a node directly to the
// client-side +link{ResultTree} effectively means a new node has been added server side.
// <li> use +link{DataSource.addData()} to immediately save a new node.  Automatic cache sync
// by the +link{ResultTree} will cause the node to be integrated into the tree.  When the
// callback to addData() fires, locate the new node by matching primary key and call
// +link{listGrid.startEditing(), TreeGrid.startEditing()} to begin editing it.
// </ol>
//
// @group  editing
//
// @param  [newValues] (Object)  Optional initial set of properties for the new record
// @param  [suppressFocus] (boolean) Whether to suppress the default behavior of moving focus
//                                   to the newly shown editor.
// @visibility external
//<

// Override the method to determine the widths of the form items displayed while editing to
// account for the tree-field indents
getEditFormItemFieldWidths : function (record) {

    var level = this.data.getLevel(record);
    if (!this.showRoot) level--;
    var openerIconSize = this.getOpenerIconWidth(record),
        indentSize = level * (this.showConnectors ? openerIconSize : this.indentSize)
    ;
    indentSize += this.iconSize + openerIconSize;
    if (this._getCheckboxIcon(record)) {
        indentSize += (this._getCheckboxFieldImageWidth() + this.extraIconGap);
    } else if (this.getExtraIcon(record)) {
        indentSize += (this.iconSize + this.extraIconGap);
    }
    
    var widths = this.Super("getEditFormItemFieldWidths", arguments),
        treeFieldNum = this.getTreeFieldNum();

    widths[treeFieldNum] -= indentSize;
    return widths;
},

// return the DataSource for the current record, to allow embedded editing
getRecordDataSource : function (record) {
    return this.data.getNodeDataSource(record);
},

//>	@method	treeGrid.rowClick()
//
// This override to +link{ListGrid.rowClick()}.  This implementation calls through to the
// +link{TreeGrid.nodeClick}, +link{TreeGrid.folderClick}, +link{TreeGrid.leafClick} methods, as
// appropriate unless the click was on the expand/collapse control of a folder - in which case
// those callbacks are not fired.
// <p>
// Do not override this method unless you need a rowClick callback that fires even when the
// user clicks on the expand/collapse control.  If you do override this method, be sure to call
// <code>return this.Super("rowClick", arguments);</code> at the end of your override to
// preserver other handler that are called from the superclass (for example,
// +link{ListGrid.recordClick()}.
// <p>
//
//      @param  record      (TreeNode)    record that was clicked on
//		@param	recordNum   (number)	index of the row where the click occurred
//		@param	fieldNum	(number)	index of the col where the click occurred
//
// @see TreeGrid.nodeClick()
// @see TreeGrid.folderClick()
// @see TreeGrid.leafClick()
// @see ListGrid.recordClick()
//
// @visibility external
//<

rowClick : function (record, recordNum, fieldNum) {

    var node = record;

	// if they're clicking in the open or checkbox area of the list, 
	//  it's already been processed properly on mouseDown so just bail
	if (this.clickInOpenArea(node) || this.clickInCheckboxArea(node)) return false;
	
	this._lastRecordClicked = recordNum;
	if (recordNum < 0 || fieldNum < 0) return false; // not in body
	
	var node = this.getRecord(recordNum),
        isFolder = this.data.isFolder(node);

    if (this.nodeClick) this.nodeClick(this, node, recordNum);

    if (isFolder) {
        if (this.folderClick) this.folderClick(this, node, recordNum);
    } else {
        if (this.leafClick) this.leafClick(this, node, recordNum);
    }
	
	// execute the super class click method - to pick up field click and recordClick
    // Note: be sure not to call any handlers the ListGrid will call so as not to get a dup
	return this.Super("rowClick",arguments);
},



//>	@method	treeGrid.recordDoubleClick()
//
// Handle a doubleClick on a tree node - override of ListGrid stringMethod of same name.  If
// the node is a folder, this implementation calls +link{TreeGrid.toggleFolder()} on it.  If
// the node is a leaf, calls +link{TreeGrid.openLeaf()} on it.
// 
// @see listGrid.recordDoubleClick()
// @visibility external
//<
recordDoubleClick : function (viewer, record, recordNum, field, fieldNum, value, rawValue) {
	// if the're clicking in the open or checkbox area of the list, 
	//  it's already been processed properly on mouseDown so just bail
	if (this.clickInOpenArea(record) || this.clickInCheckboxArea(record)) return false;
	// If this is an editable grid, don't toggle the folder, but do return true to allow
	// editing to proceed.
	if (this.canEdit != false && this.editEvent == isc.EH.DOUBLE_CLICK &&
	    this.canEditCell(recordNum,fieldNum)) 
	{
	    return true;
	}
	if (this.data.isFolder(record)) {
		return this.toggleFolder(record, this.data.getPathForOpenListIndex(recordNum));
	} else
		return this.openLeaf(record);
},
    
dataChanged : function () {
    
    this.Super("dataChanged", isc._emptyArray, arguments);

    
    var folder = this._pendingFolderAnim;
    if (folder && 
            (!this.data.isMultiLinkTree() || this.data._getPathEntryFromIndex(folder)) && 
            this.data.isOpen(folder) && 
            this.data.getLoadState(folder) == isc.Tree.LOADED) 
    {
        this._startFolderAnimation(folder);
        this._pendingFolderAnim = null;
    }
    this._provideCriteriaToRuleContext();
},
    

//>	@method	treeGrid.openLeaf()   ([A])
// Executed when a leaf node receives a 'doubleClick' event. This handler must be
// specified as a function, whose single parameter is a reference to the relevant leaf node in
// the tree's data.<br>
// See the ListGrid Widget Class for inherited recordClick and recordDoubleClick events.
//
//      @visibility external
//		@param	node		(TreeNode)		node to open
//      @see    class:ListGrid
//<
openLeaf : function (node) {},


// Drag and Drop
// ----------------------------------------------------------------------------------------



//>	@method	treeGrid.transferDragData()
// @include dataBoundComponent.transferDragData()
//<

// ----------------------------------------------------------------------------------
// Customizations of the drag-tracker for tree grids

//> @method treeGrid.getDragTrackerIcon()
// Return an icon to display as a drag tracker when the user drags some node(s).<br>
// Default implementation:<br>
// If multiple nodes are selected and +link{TreeGrid.manyItemsImage} is defined, this
// image will be returned.<br>
// Otherwise returns the result of +link{TreeGrid.getIcon()} for the first node being 
// dragged.
// <p>
// Note: Only called if +link{listGrid.dragTrackerMode} is set to <code>"icon"</code>. 
// @param records (Array of ListGridRecord) Records being dragged
// @return (String) Image URL of icon to display
// @group dragTracker
// @visibility external
//<
getDragTrackerIcon : function (records) {
    
    

    var icon;
    if (records && records.length > 1 && this.manyItemsImage !=null)
        icon = this.manyItemsImage;
    else if (records && records[0]) icon = this.getIcon(records[0], null, true);
    return icon;
},

// Override getDragTrackerTitle() to just return the icon and title of the row, not
// the indent, opener icon, etc.
// Override not currently documented as it's essentially the same as the superclass 
// implementation - we just reformat the title cell value to avoid it showing the
// indent and opener icon.
getDragTrackerTitle : function (record, rowNum, a,b,c,d) {
    var fieldNum = this.getFieldNum(this.getTitleField()); 
    if (fieldNum != this.getTreeFieldNum()) 
        return this.invokeSuper(isc.TreeGrid, "getDragTrackerTitle", record, rowNum, a,b,c,d);
    
    // We need to apply the base (non selected) standard cellStyle/cssText to the drag tracker 
    // table.
    
    var cellStyle = this.getCellStyle(record, rowNum, fieldNum),
        cellCSSText = this.getCellCSSText(record,rowNum,fieldNum);
        
    if (this.selectionManager.isSelected(record, rowNum)) {
        var styleIndex = this.body.getCellStyleIndex(record, rowNum, fieldNum),
            standardSelectedStyle = this.body.getCellStyleName(styleIndex, record, 
                                                                rowNum, fieldNum);
        if (standardSelectedStyle == cellStyle) {
            styleIndex -= 2;
            cellStyle = this.body.getCellStyleName(styleIndex, record, rowNum, fieldNum);
        }
    }
    
    
    // Call the standard ListGrid.getCellValue() method to give us the formatted title
    // of the cell being dragged, excluding the TreeGrid folder/file icons, etc.
    var value = this.invokeSuper(isc.TreeGrid, "getCellValue",  record, rowNum, fieldNum);
    
    // Now use _getTreeCellTitleArray() to tack on the icon for the node.
    var titleCell = this._getTreeCellTitleArray(
                        value, record, rowNum, fieldNum, false, cellStyle, cellCSSText ).join(isc.emptyString);
    
    
    return ["<table class='", cellStyle,
             "' style='", cellCSSText, 
             "'><tr>", titleCell, "</tr></table>"].join(isc.emptyString);
},


//>	@method	treeGrid.getDraggedNodeLocators()	(A)
//
// <b>NOTE:</b> Applicable only to +link{tree.multiLinkTree,multi-link trees}; if called on a 
// regular <code>TreeGrid</code>, returns an empty array.
// <p>
// During a drag-and-drop interaction, this method returns the set of node occurences being 
// dragged out of the component, wrapped inside +link{object:NodeLocator}s.  In the default 
// implementation, this is the list of currently selected node occurences<p>

// @param source (TreeGrid) source grid from which the records will be transferred
// 
// @group	dragging, data
//
// @return	(Array of NodeLocator)		Array of +link{NodeLocator}s unambiguously identifying
//                                      the node occurences that are currently selected
// 
// @visibility external
//<
getDraggedNodeLocators : function () {
    var selection;
    if (isc.MultiLinkSelection && isc.isA.MultiLinkSelection(this.selectionManager)) {
        selection = this.selectionManager.getSelection();
    } else {
        selection = [];
    }
    return selection;
},



//>	@method	treeGrid.willAcceptDrop()	(A)
// 
// This method overrides +link{ListGrid.willAcceptDrop()} and works as follows:
// <br><br>
// First, +link{ListGrid.willAcceptDrop()} (the superclass definition) is consulted.  If it
// returns false, then this method returns false immediately.<br>
// This handles the following cases:<br>
// - reordering of records withing this TreeGrid when +link{ListGrid.canReorderRecords} is true<br>
// - accepting dropped records from another dragTarget when +link{ListGrid.canAcceptDroppedRecords} 
//   is true and the dragTarget gives us a valid set of records to drop into place.<br>
// - disallowing drop over disabled nodes, or nodes with <code>canAcceptDrop:false</code>
// <br>
// This method will also return false if the drop occurred over a leaf node whos immediate 
// parent has <code>canAcceptDrop</code> set to <code>false</code><br>
// If +link{TreeGrid.canReparentNodes} is true, and the user is dragging a node from one folder
// to another, this method will return true to allow the change of parent folder.<br>
// <br><br>
// Otherwise this method returns true.
//
// @group event handling	
// @return	(boolean)	true if this component will accept a drop of the dragData
//
// @visibility external
//<
willAcceptDrop : function () {
    // Bail if Superclass willAcceptDrop fails
    // (Checks that the record is enabled, etc.)
    var superAccept = this.Super("willAcceptDrop", arguments);
    if (!superAccept) return superAccept;

    isc._useBoxShortcut = true;
	// get the record being dropped on
	var recordNum = this.getEventRecordNum(null, true),
        newParent = recordNum < 0 ? null : this.data.get(recordNum),
        newParentNodeLocator;
    if (this.data.isMultiLinkTree()) {
        newParentNodeLocator = this.data.getNodeLocator(recordNum);
    }

    isc._useBoxShortcut = false;

    // dropping in the body in open space means add to root
    if (newParent == null) {
        if (this.canDropInEmptyArea == false || !this.canDropRootNodes) return false;
        newParent = this.data.getRoot();
    }

	// if we can't get the new parent, or it can't accept drops, return false
	if (!newParent || newParent.canAcceptDrop == false) return false;

    // don't allow drop over non-folder nodes, unless we're allowing record reordering or
    // canDropOnLeaves is set
    var isFolder = this.data.isFolder(newParent);
    if (!isFolder && !(this.canReorderRecords || this.canDropOnLeaves)) return false;

    // check for dropErrors (dropping record over self, etc.)
    var moveList = isc.EH.dragTarget.getDragData();
    var moveRecords = moveList;
    if (this.data.isMultiLinkTree()) {
        moveRecords = [];
        for (var i = 0; i < moveList.length; i++) {
            //>DEBUG
            this._assert(isc.Tree.isANodeLocator(moveList[i]));
            //<DEBUG
            moveRecords[i] = moveList[i].node;
        }
    }
    if (!isc.isAn.Object(moveList) || 
            this.getDropError(moveRecords, newParentNodeLocator || newParent) != null) 
    {
        return false
    }
    // Even if we are allowing record reordering, don't allow the user to drop into a 
    // parent with canAcceptDrop explicitly set to false
    
    if (!isFolder) {
        newParent = this.data.getParent(newParentNodeLocator || newParent);
        if (newParent.canAcceptDrop == false) return false;
    }

    // If we're dragging data in from another listGrid we're done here
    // (this relies on canAcceptDropRecords getting checked by the superClass implementation
    // for this case).
    if (isc.EH.dragTarget != this) return true;
    
    // If we can reorder records, but not reparent, we need to catch the cases where
    // - records selected currently come from multiple folders
    // - the drop folder doesn't match the source folder for the node[s]
    var canReparent = this.canReparentNodes;
    //>!BackCompat 2006.06.27
    if (canReparent == null && this.canAcceptDroppedRecords) canReparent = true;
    //<!BackCompat
    
    if (!canReparent) {
        if (!isc.isAn.Array(moveList)) moveList = [moveList];
        var currentParent;
        currentParent = this.data.getParent(moveList[0]);

        if (currentParent != newParent) return false;
        
        for (var i = 1; i < moveList.length; i++) {
            if (currentParent != this.data.getParent(moveList[i])) {
                return false;
            }
        }
    }
    
	// if we get here, it should be OK!
	return true;
},

// Override setUpDragProperties to pick up this.canReparentNodes 
_setUpDragProperties : function () {

    // set up our specific drag-and-drop properties
	this.canDrag = (this.canDrag || this.canDragRecordsOut || 
                    this._canDragRecordsToSelf() || this.canDragSelect);
	this.canDrop = (this.canDrop || this.canDragRecordsOut || this._canDragRecordsToSelf());
	this.canAcceptDrop = (this.canAcceptDrop || this.canAcceptDroppedRecords || 
                            this._canDragRecordsToSelf());
},


// allow the user to drag records to self if they can be reordered or reparented
_canDragRecordsToSelf : function () {
    var canReparentNodes = this.canReparentNodes;
    //>!BackCompat 2006.06.27
    if (canReparentNodes == null && this.canAcceptDroppedRecords) {
        if (!this._canReparentBackcompatNotified) {
            this.logInfo("'canReparentNodes' is unset. Allowing node reparenting as " + 
                         "'canAcceptDroppedRecords' is set to true. For explicit control, " +
                         "use 'canReparentNodes' instead.", "dragDrop");
            this._canReparentBackcompatNotified = true;
        }
        canReparentNodes = this.canAcceptDroppedRecords;
    }
    //<!BackCompat
    
    return this.canReorderRecords || canReparentNodes;
},

// if there's a problem that makes this drop invalid, return an error string to display
getDropError : function (moveList, newParent) {

    var newParentNodeLocator;
    if (this.data.isANodeLocator(newParent)) {
        newParentNodeLocator = newParent;
        newParent = newParent.node;
    }

	// don't allow a parent to be dropped on it's own descendant
	for (var i = 0, length = moveList.length; i < length; i++) {
		if (this.data.isDescendantOf(newParent, moveList[i])) {
			return this.cantDragIntoChildMessage;
		}
	}

	// make sure they're not trying to drag a folder into itself
    var isFolder = this.data.isFolder(newParent);
    if (isFolder) {
    	for (i = 0; i < length; i++) {
	    	if (moveList[i] == newParent) {
		    	return this.cantDragIntoSelfMessage;
    		}
	    }
    }

    

    return null;
},

//>	@method	treeGrid.dropMove()	(A)
//			mouse is moving over the list while dragging is happening
//			show a hilite in the appropriate record if necessary
//		@group	event handling	
//
//		@return	(boolean)	false == cancel further event processing
//<
dropMove : function () {
    var eventRow = this.getEventRow();
    // before the beginning of the rendered area, aka over the header; do nothing
    if (eventRow == -1) return false;

    // bail on drops over foreign widgets if not configured to drag records out
    if (this.canDragRecordsOut == false && isc.EH.dropTarget != this && !this.contains(isc.EH.dropTarget)) return false;
    
    // bail on drops from foreign widgets if not configured to accept foreign drops
    if (!this.canAcceptDroppedRecords && isc.EH.dragTarget != this) {
        return false;
    }
    
    // if after the end of the list, choose root
    var eventNode = (eventRow == -2 ? this.data.getRoot() : this.data.get(eventRow)),
        dropFolder = this.getDropFolder(),
        position = (this.canReorderRecords ? this.getRecordDropPosition(eventRow) : null);

    var dropFolderNodeLocator;
    if (this.data.isANodeLocator(dropFolder)) {
        dropFolderNodeLocator = dropFolder;
        dropFolder = dropFolder.node;
    }
        
    // We used to check willAcceptDrop() here, but that prevented spring-loaded folders
    // from working in the case where the folder being hovered over is will not accept the
    // drop, but one of its children might accept the drop.  So now, we always set the
    // timer to open a folder being hovered on and updateDropFolder() logic checks for
    // willAcceptDrop().
    
    // suppress duplicate runs, but updateDropFolder() whenever the lastDropFolder, eventNode
    // or lastPosition have changed because event though we may still be within the same
    // dropFolder, we may want to change the dropFolder icon state based on whether the tree
    // willAcceptDrop() at the new location.
    var changed;
    if (this.data.isMultiLinkTree()) {
        changed = !this.dropFolderLocator || !this.lastDropFolderLocator ||
                    dropFolderNodeLocator.path != this.lastDropFolderLocator.path || 
                    eventRow != this._lastEventRow || position != this._lastPosition;
    } else {
        changed = dropFolder != this.lastDropFolder || 
                    eventNode != this._lastEventNode || position != this._lastPosition;
    }

    if (changed) {
        // Set up a function to be executed in the global scope to open the drop folder.
        if (!this._openDropFolder) {
            this._openDropFolder = this.getID() + ".openDropFolder()";
        }

        // If there's a running openDropFolderTimer, clear it
        if (this.openDropFolderTimer) isc.Timer.clear(this.openDropFolderTimer);    
			
        // If the dropFolder is closed, set up a new openDropFolderTimer
        if (!this.data.isOpen(dropFolderNodeLocator || dropFolder)) {
            this.openDropFolderTimer = 
                            isc.Timer.setTimeout(this._openDropFolder, this.openDropFolderDelay);
        }

        // remember the new drop-folder as this.lastDropFolder, and update its icon.
        // [note this calls 'willAcceptDrop()']
        this.updateDropFolder(dropFolderNodeLocator || dropFolder);
    }

    // If the drop is disallowed, show the 'no drop' cursor
    
    if (!this.willAcceptDrop()) {
        this.body.setNoDropIndicator();
    } else {        
        this.body.clearNoDropIndicator();
    }
    
    // Show the drag line if appropriate
    if (this.shouldShowDragLineForRecord(dropFolder)) {
        if (this.data.isOpen(dropFolderNodeLocator || dropFolder)) {
            this.showDragLineForRecord(eventRow, position, dropFolderNodeLocator);
        } else {
            this.hideDragLine();
        }
    }
    this._lastEventNode = eventNode;
    this._lastEventRow = eventRow;
    this._lastPosition = position;

    
},

//>	@method	treeGrid.getEventRow()
// @include gridRenderer.getEventRow()
// @group events
// @visibility external
//<

    
getEventRecordNum : function (y, allowRootNodeRemapping) {
    var recordNum = this.Super("getEventRecordNum", arguments);
    if (recordNum < 0 && allowRootNodeRemapping && !this.canDropRootNodes) {
        var data = this.data,
            children = data.getChildren();
        if (children != null) {
            if (recordNum == -2) {
                for (var i = children.length - 1; i >= 0; i--) {
                    if (data.isFolder(children[i])) return this.getRecordIndex(children[i]);
                }
            } else {
                for (var i = 0; i < children.length; i++) {
                    if (data.isFolder(children[i])) return this.getRecordIndex(children[i]);
                }
            }
        }
    }
    return recordNum;
},

//> @attr treeGrid.recordDropAppearance (RecordDropAppearance : isc.ListGrid.BOTH : [IRW])
// If +link{canAcceptDroppedRecords} is true for this treeGrid, this property governs
// whether the user can drop between, or over records within the grid.
// This controls what +link{type:RecordDropPosition} is passed to the +link{recordDrop()}
// event handler.
//
// @visibility external
//<

recordDropAppearance: isc.ListGrid.BOTH,

//>	@method	treeGrid.openDropFolder()	(A)
// Method to open the folder we're currently hovering over (about to drop)
// Called on a timer set up by this.dropMove
//		@group	event handling	
//<
openDropFolder : function () {
    var dropFolder = this.lastDropFolder,
        dropFolderLocator;
    if (this.data.isMultiLinkTree()) {
        dropFolderLocator = this.lastDropFolderLocator;
    }
    
    // if we're not over a closed folder, bail!
    if (!dropFolder || !this.data.isFolder(dropFolder) || 
            this.data.isOpen(dropFolderLocator || dropFolder))
    {
        return false;
    }

    // Open the folder
    this.openFolder(dropFolderLocator || dropFolder);
    // show the drag line if we can reorder
    if (this.shouldShowDragLineForRecord(dropFolder)) {
        this.showDragLineForRecord(this.data.indexOf(dropFolder), isc.ListGrid.OVER, dropFolderLocator);
    }
    
},

getRecordDropPosition : function (recordNum, y, dropAppearance) {
    if (this.recordDropAppearance == isc.ListGrid.OVER) return isc.ListGrid.OVER;
    if (this.recordDropAppearance == isc.ListGrid.BODY) return null;

    // If a y-coordinate was not passed, get it from the offset of the last event
    if (y == null) y = this.body.getOffsetY();

    // which row is the mouse over?
    if (recordNum == null) recordNum = this.getEventRow(y);

    var data = this.data;
    if (!isc.isA.Number(recordNum)) recordNum = data.indexOf(recordNum);

    var record = recordNum < 0 ? null : data.get(recordNum);

    if (record && data.isFolder(record)) {
        return this._getRecordDropPosition(recordNum, y, dropAppearance);
    }

    // if no recordDropAppearance override was supplied, force it to BETWEEN
    // unless +link{TreeGrid.canDropOnLeaves} has been set to true
    if (dropAppearance == null && !this.canDropOnLeaves) {
        dropAppearance = isc.ListGrid.BETWEEN;
    }
        
    // If we're over a leaf, allow the super method to take care of it.
    return this.invokeSuper(isc.TreeGrid, "getRecordDropPosition", recordNum, y, 
                            dropAppearance);
},

// Override showDragLineFor record - if the drop will occur inside a folder, we'll show the
// drag line after the folder (before the first child)
showDragLineForRecord : function (recordNum, position, folderLocator, a,b,c) {

    if (recordNum == null) recordNum = this.getEventRecordNum();    
    if (position == null) position = this.getRecordDropPosition(recordNum);

    // If dropping over an open folder, show the drag line before the first child (after the
    // folder)    
    if (position == isc.ListGrid.OVER) {
        var node = this.getRecord(recordNum),
            data = this.data;
        if (data.isFolder(node) && data.isOpen(folderLocator || node)) {
            position = isc.ListGrid.AFTER;
        }
    }
    
    // Have the default implementation actually show the drag line.
    return this.invokeSuper(isc.TreeGrid, "showDragLineForRecord", recordNum, position, a,b,c);
},


//>	@method	treeGrid.dropOut()	(A)
//			mouse just moved out of the range of the list while dragging is going on
//			remove the hilite
//		@group	event handling	
//
//		@return	(boolean)	false == cancel further event processing
//<
dropOut : function () {
    // Hide drag line
    this.hideDragLine();
    // clear no-drop indicator
    this.body.clearNoDropIndicator();
    
    // Clear any remembered drop folder
    this._lastEventNode = null;
    delete this._lastEventRow;
    this.updateDropFolder();
    
    // If we have a timer waiting to open a drop folder, clear it
    // (Note - if it did fire it would bail anyway because lastDropMoveRow has gone, but
    // this is more efficient)
    if (this.openDropFolderTimer) isc.Timer.clear(this.openDropFolderTimer);    
    
},

//>	@method	treeGrid.updateDropFolder()	(A)
// Takes a record (or record index) as a parameter
// Applies the folderDropImage icon to the parameter (or parent folder, if passed a leaf)
// Clears out any folderDropImage applied to another folder.
// Remembers the folder passed in as this.lastDropFolder.
//		@group	drawing, event handling
//
//		@param newFolder (Object | Index)
//<
updateDropFolder : function (newFolder) {

    var locator, lastLocator;
    if (this.data.isANodeLocator(newFolder)) {
        lastLocator = this.lastDropFolderLocator
        locator = this.lastDropFolderLocator = newFolder;
        newFolder = newFolder.node;
    } else if (this.data.isMultiLinkTree()) {
        lastLocator = this.lastDropFolderLocator
        locator = this.lastDropFolderLocator = null;
    }

    var LDF = this.lastDropFolder;
    this.lastDropFolder = newFolder;

    this.logDebug("In updateDropFolder.  NodeLocator: " + (locator ? locator.path : "(n/a)") +
                    ".  Last locator: " + (lastLocator ? lastLocator.path : "(n/a)") + 
                    ".  Node ID: " + (newFolder ? newFolder.oid : "(n/a)"));

    // Set the icons on both the previous and current drop folder
    //
    // Special _willAcceptDrop flag: set for getIcon() and only update to drop state if the
    // body willAcceptDrop() the new folder - see comments in dropMove()
    if (newFolder) {
        var recordNum;
        if (locator) {
            if (locator.node == this.data.root) {
                recordNum = -2;
            } else {
                var pathEntry = this.data._getPathEntryFromIndex(locator);
                //>DEBUG
                isc.TreeGrid._assert(!!pathEntry && pathEntry.openListIndex != null);
                //<DEBUG
                recordNum = pathEntry.openListIndex;
            }
            
            newFolder._willAcceptDrop = this.body.willAcceptDrop(newFolder);
            this.logDebug("In updateDropFolder, setting icon on row " + recordNum);
            this.setRowIcon(recordNum, this.getIcon(newFolder, recordNum));
        } else {
            newFolder._willAcceptDrop = this.body.willAcceptDrop(newFolder);
            this.logDebug("In updateDropFolder, setting icon by object!!");
            this.setRowIcon(newFolder, this.getIcon(newFolder, recordNum));
        }
    }

    var changed;
    if (this.data.isMultiLinkTree()) {
        changed = lastLocator && lastLocator.path != (locator ? locator.path : null);
    } else {
        changed = LDF && LDF != newFolder;
    }

    if (changed) {
        if (LDF) delete LDF._willAcceptDrop;
        var lastRecordNum;
        if (lastLocator) {
            if (lastLocator.node == this.data.root) {
                lastRecordNum = -2;
            } else {
                var pathEntry = this.data._getPathEntryFromIndex(lastLocator);
                //>DEBUG
                isc.TreeGrid._assert(!!pathEntry && pathEntry.openListIndex != null);
                //<DEBUG
                lastRecordNum = pathEntry.openListIndex;
            }
            this.logDebug("In updateDropFolder, clearing icon for row " + lastRecordNum);
            this.setRowIcon(lastRecordNum, this.getIcon(LDF, lastRecordNum));
        } else {
            this.logDebug("In updateDropFolder, clearing icon by object!!");
            this.setRowIcon(LDF, this.getIcon(LDF, lastRecordNum));
        }
    }
},


//> @method treeGrid.transferSelectedData()
// Simulates a drag / drop type transfer of the selected records in some other grid to this
// treeGrid, without requiring any user interaction.<br>
// See the +link{group:dragging} documentation for an overview of grid drag/drop data
// transfer.
// @param sourceGrid (ListGrid) source grid from which the records will be transferred
// @param [folder] (TreeNode) parent node into which records should be dropped - if null
//    records will be transferred as children of the root node.
// @param [index] (Integer) target index (drop position) within the parent folder 
// @param [callback] (Callback) optional callback to be fired when the transfer process has 
//                       completed.  The callback will be passed a single parameter "records",
//                       the list of nodes actually transferred to this component (it is called 
//                       "records" because this logic is shared with +link{class:ListGrid}).
// @group dragging
// @example dragTree
// @visibility external
//<
transferSelectedData : function (source, folder, index, callback) {
    
    if (!this.isValidTransferSource(source)) { 
        if (callback) this.fireCallback(callback);
        return; 
    }
    
    // don't check willAcceptDrop() this is essentially a parallel mechanism, so the developer 
    // shouldn't have to set that property directly.
    if (index == null) index = 0;
    if (folder == null) folder = this.data.getRoot();
    
    // Call cloneDragData() to pull the records out of the source's dataSet
    // Note we don't need to call 'transferDragData' here - that is all handled after 
    // transferNodes now, potentially by a server callback
    
    var nodes = source.cloneDragData();

    this.transferNodes(nodes, folder, index, source, callback);
},

//>	@method	treeGrid.drop()	(A)
//		@group	event handling	
//			handle a drop in the list
//			if possible, move or copy the items automatically
//			NOTE: at this point, we should be assured that we can accept whatever was dragged...
//		@return	(boolean)	false == cancel further event processing
//<
drop : function () {
	return this.dropTreeNode();
},

// NOTE: Overrides (but invokes) the DBC version
_updateComplete : function (dsResponse, data, dsRequest) {
    if (!dsRequest.dragTree) return;
    
    // If the node we're dropping into is not in the tree (ie, it is neither the root node
    // nor the child of another node), warn the user and bail
    if (dsRequest.newParentNode != this.data.root &&
        dsRequest.dragTree.getParent(dsRequest.newParentNode) == null)
    {
        isc.logWarn("Target folder is no longer in the Tree in TreeGrid cache sync");
        return;
    }
    
    var neighbor = dsRequest.dropNeighbor,
        dragTree = dsRequest.dragTree,
        siblings = dragTree.getChildren(dsRequest.newParentNode),
        nodeList = dsRequest.draggedNodeList,
        idField = dragTree.idField,
        nodePosition = nodeList.findIndex(idField, dsRequest.draggedNode[idField]),
        index, undef;
    if (neighbor == null) {
        index = 0;
    } else {
        for (var i = 0, siblingsLength = siblings.getLength(); i < siblingsLength; ++i) {
            var sibling = siblings.getCachedRow(i);
            if (sibling == neighbor) {
                index = i + 1;
                break;
            }
        }
    }
    
    if (index !== undef) { 
        // Step the insert point forward to ensure that nodes are inserted in the same order
        // they were passed to folderDrop.  This is necessary because some of the nodes may 
        // have already been moved into position synchronously (if we had a multi-node drag
        // where the dragged nodes came from several parents)
        //isc.logWarn("nodeList: " + nodeList.getProperty("Name"));
        var siblingsLength = siblings.getLength();
        while (index < siblingsLength) {
            var sibling = siblings.getCachedRow(index);
            if (sibling != null) {
                //isc.logWarn("existing node: " + sibling.Name);
                var existingIndex = nodeList.findIndex(idField, sibling[idField]);
                //isc.logWarn("existingIndex: " + existingIndex + ", nodePosition: " + nodePosition);
                if (existingIndex == -1 || existingIndex > nodePosition) break;
            }
            index++;
        }
    }
    
    if (index === undef) {
        isc.logWarn("Could not order dropped node by reference to neighbor; trying absolute index");
        index = dsRequest.dropIndex;
    }
    
    // If index is still undefined, something's gone wrong.  Log a warning and bail
    if (index === undef) {
        isc.logWarn("Unable to determine drop location in TreeGrid cache sync");
        return;
    }

//    dragTree.move(dsRequest.draggedNode, dsRequest.newParentNode, index);
    var nodeToMove = this.data.find(idField, dsRequest.draggedNode[idField]);
    dragTree.move(nodeToMove, dsRequest.newParentNode, index);
    
    this.Super("_updateComplete", arguments);
},


// // Tree-specific HTML generation
// // --------------------------------------------------------------------------------------------



getTreeFieldInnerWidth : function (fieldNum) {
    if (this._treeFieldTitleWidth != null) return this._treeFieldTitleWidth;
    
    var body = this.getFieldBody(fieldNum),
        // fieldNum passed in for convenience as we have it in the calling method.
        bodyColNum = this.getLocalFieldNum(fieldNum),

        width = body.getInnerColumnWidth(bodyColNum);
    
    // Cache this for performance so we don't have to look up the body / run the
    // logic to reduce body-specified-width by border/margin size etc for each cell
    this._treeFieldTitleWidth = width;
    return width;
},
// When column-widths change, drop the cached 'treeFieldTitleWidth'
setBodyFieldWidths : function (a,b,c,d) {
    delete this._treeFieldTitleWidth;
    return this.invokeSuper(isc.TreeGrid, "setBodyFieldWidths", a,b,c,d);
},

//> @method TreeGrid.getCellAlign()
// Return the horizontal alignment for cell contents. Default implementation will always
// left-align the special +link{treeGridField.treeField} [or right-align if the page is in
// RTL mode] - otherwise will return +link{listGridField.cellAlign} if specified, otherwise
// +link{listGridField.align}.
//
//
// @param   record (ListGridRecord) this cell's record
// @param	rowNum	(number)	row number for the cell
// @param	colNum	(number)	column number of the cell
// @return	(Alignment)     Horizontal alignment of cell contents: 'right', 'center', or 'left'	
// @visibility external
//< 
getCellAlign : function (record, rowNum, colNum) {
    var field = this.getField(colNum);
    if (field && field.treeField) {
        return this.isRTL() ? "right" : "left";
    }
    return this.Super("getCellAlign", arguments);
},


// Override getCellValue() to return custom HTML for the tree-field
// Note: Developers are always advised to override formatCellValue rather than this method
// directly (which could lead to certain conflicts). 
getCellValue : function (record, rowNum, colNum, gridBody, b, c, d) {
    var value = this.invokeSuper(isc.TreeGrid, "getCellValue", record, rowNum, colNum, gridBody, b,c,d);
    if (colNum == this.getTreeFieldNum()) {
// that takes an already formatted value and applies stuff to it.    
        value = this.getTreeCellValue(value, record, rowNum, colNum, gridBody);
    }
    return value;
},

// overridden to create/clear draw cache
// (Fired for both frozen and normal body)
bodyDrawing : function (body,a,b,c,d) {
    this._drawCache = {};
    return this.invokeSuper(isc.TreeGrid, "bodyDrawing", body,a,b,c,d);
},

//> @method TreeGrid.getNodeTitle()
//
// Returns the title to show for a node in the tree column.  If the field specifies the
// <code>name</code> attribute, then the current <code>node[field.name]</code> is returned.
// Otherwise, the result of calling +link{method:Tree.getTitle} on the node is called.
// <P>
// You can override this method to return a custom title for node titles in the tree column.
// <P>
// <b>Note:</b> if a default tree field is generated for you by +link{createDefaultTreeField}
// being true, and you've overridden this method, it will be called with <code>recordNum: -1
// </code> during sorting of the tree field, if the tree is +link{resultTree.fetchMode, paged}.
//
// @param node      (TreeNode)  The node for which the title is being requested.
// @param recordNum (Number)  The index of the node.
// @param field     (DSField) The field for which the title is being requested.
// 
// @return (HTMLString) the title to display.
//
// @see method:Tree.getTitle
//
// @visibility external
//<
getNodeTitle : function (record, recordNum, field) {
    
    var value;
    if (field.name && field.name != this._titleField) {
        
        if (recordNum == -1) return record[field.name];
        value = this.getEditedCell(recordNum, field);
    } else {
        value = this.data.getTitle(record);
    }
    // This will convert to a string etc.
    return this.applyCellTypeFormatters(value, record, field, recordNum, this.getFieldNum(field));

},

//> @method TreeGrid.getTitleField()
// Method to return the fieldName which represents the "title" for records in this
// TreeGrid.<br>
// If <code>this.titleField</code> is explicitly specified for this treeGrid, respect it - 
// otherwise always return the tree-field (+link{TreeGrid.treeField}) for this grid.
// @return (String) fieldName for title field for this grid.
//<
getTitleField : function () {
    if (this.titleField != null) return this.titleField;
    return this.getFieldName(this.getTreeFieldNum());
},

//>	@method	treeGrid.getOpenAreaWidth()	(A)
//		
//		@param	node		(TreeNode)		tree node clicked on
//
//		@return	(number)	Return the width of the open area (relative to wherever the tree field is)
//<
getOpenAreaWidth : function (node) {
    var openerIconSize = this.showOpener ? this.getOpenerIconWidth(node) : 0,
        indentSize = (this.showConnectors ? openerIconSize : this.indentSize)
    ;
    return ((this.data.getLevel(node)-(this.showRoot?0:1)) * indentSize) + openerIconSize;
},

getOpenerIconSize : function (node) {
    return (this.openerIconSize || (this.showConnectors ? this.cellHeight : this.iconSize));
},
getOpenerIconWidth : function (node) {
    return this.openerIconWidth || this.getOpenerIconSize(node);
},
getOpenerIconHeight : function (node) {
    return this.openerIconHeight || this.getOpenerIconSize(node);
},

//>	@method	treeGrid.clickInOpenArea()	(A)
//			for a given click, was it in the open/close area or on the main part of the item
//			OVERRIDE in your subclasses for different open/close schemes
//		@param	node		(TreeNode)		tree node clicked on
//
//		@return	(boolean)		true == click was in open area, false == normal click
//<
clickInOpenArea : function (node) {

	if (!this.data.isFolder(node) || ! this.showOpener) return false;
	
	// get some dimensions
	var treeFieldNum = this.getTreeFieldNum(),
        body = this.getFieldBody(treeFieldNum),
        localFieldNum = this.getLocalFieldNum(treeFieldNum),
		fieldLeft = body.getColumnLeft(localFieldNum),
		fieldWidth = body.getColumnWidth(localFieldNum),
		openAreaWidth = this.getOpenAreaWidth(node),
		x = body.getOffsetX()
    ;
	// textDirection: switch based on drawing in left-to-right (default) or right-to-left order
	if (this.isRTL()) {
        fieldLeft += body.getScrollWidth() - body.getViewportWidth();
		fieldLeft -= this.cellPadding;
        var fieldRight = fieldLeft + fieldWidth;
		return x >= (fieldRight - openAreaWidth) && x <= fieldRight;
	} else {
        fieldLeft += this.cellPadding;
		return x >= fieldLeft && x < fieldLeft + openAreaWidth;	
	}
},

//> @method treeGrid.isOverOpenArea()
// Returns true if the last event occurred over the indented area or over the
// open / close icon of a folder node in this TreeGrid. Returns false if the event
// did not occur over a folder node.
//
// @return (Boolean) true if the user clicked the open icon
// @visibility external
//<
isOverOpenArea : function () {
    var node = this.getRecord(this.getEventRow());
    if (node == null) return false;
    return this.clickInOpenArea(node);
},

//> @method treeGrid.clickInCheckboxArea() (A)
// For a given click, was it in the checkbox area?
// @param  node (TreeNode) tree node clicked on
//
// @return (boolean)       true == click was in checkbox area, false == normal click
//<
clickInCheckboxArea : function (node) {
	if (this.selectionAppearance != this._$checkbox) return false;
	return this.isOverExtraIcon(node);
},

//> @method treeGrid.isOverExtraIcon()
// Returns true if the last event occurred over +link{TreeGrid.getExtraIcon(),extra icon}
// for the current node.
// <P>
// Returns false if the event did not occur over an extraIcon, or if no extraIcon is
// showing for the node in question.
//
// @return (Boolean) true if the user clicked the extra icon
// @visibility external
//<

isOverExtraIcon : function (node) {

    if (node == null) node = this.getRecord(this.getEventRow());
    if (node == null) return false;
    // No extra-icon for the node
    var checkboxIcon = this._getCheckboxIcon(node),
        extraIcon = checkboxIcon || this.getExtraIcon(node);
        
    // No checkbox/extra icon - just bail.
    if (extraIcon == null) return false;

    var extraIconSize = (checkboxIcon != null ?  this._getCheckboxFieldImageWidth() : this.iconSize);

	// get some dimensions
	var treeFieldNum = this.getTreeFieldNum(),
        body = this.getFieldBody(treeFieldNum),
        localFieldNum = this.getLocalFieldNum(treeFieldNum),
		fieldLeft = body.getColumnLeft(localFieldNum),
		fieldWidth = body.getColumnWidth(localFieldNum),
		openAreaWidth = this.getOpenAreaWidth(node),
		x = body.getOffsetX()
    ;

	// textDirection: switch based on drawing in left-to-right (default) or right-to-left order
	if (this.isRTL()) {
        var fieldRight = fieldLeft + fieldWidth;
        fieldLeft -= this.cellPadding;
		return (x >= (fieldRight - openAreaWidth - extraIconSize) &&
		    x <= (fieldRight - openAreaWidth));
	} else {
        fieldLeft += this.cellPadding;
		return (x >= (fieldLeft + openAreaWidth) &&
		    x < (fieldLeft + openAreaWidth + extraIconSize));
	}
},

//>	@method	treeGrid.getOpenIcon()	(A)
// Get the appropriate open/close opener icon for a node. Returns null if +link{showOpener} is
// set to false.
//
// @param	node (TreeNode)	tree node in question
// @return	(URL)		URL for the icon to show the node's open state
//
// @visibility external
//<
getOpenIcon : function (record) {
    if (this.showOpener == false && !this.showConnectors) return null;
    if (!this.data) return null;
    var recordNum, recordPath, nodeLocator;
	if (isc.isA.Number(record)) {
        // Internal calls to this method always pass recordNum, because there is no other way
        // to disambiguate between two instances of the same node in a multiLink tree
        recordNum = record;
        record = this.data.get(recordNum);
        nodeLocator = this.data.isMultiLinkTree() ? this.data.getNodeLocator(recordNum) : null;
    }
    if (record == null) return null;
    
	// if the record has a specific openIcon, use that
	if (record.openIcon) {
		return record.openIcon;

	} else {

        // If showOpener is false, this method will show just lines for both leaves and folders
        var isFolder = this.showOpener && this.data.isFolder(record),
            // non-folders can never have children, or be open
            hasChildren = isFolder,
            isOpen = isFolder,
            // does this node have adjacent siblings above or below, or is there a gap
            // between it's next sibling at the same level in either direction.
            start,
            end;
        if (isFolder) {
    		// If the folder doesn't have it's data fully loaded show the
            // folder as being closed
    		var loadState = this.data.getLoadState(record);
            if (loadState == isc.Tree.UNLOADED || 
                (loadState == isc.Tree.FOLDERS_LOADED && 
                 this.displayNodeType != isc.Tree.FOLDERS_ONLY)) 
            {
                hasChildren = true;
                isOpen = false;
            // If the data is loaded for the folder, use the data APIs to determine
            // whether this has children or not.
    		} else {
                hasChildren = this.data.hasChildren(record, this.displayNodeType);
                isOpen = (hasChildren || this.alwaysShowOpener) && this.data.isOpen(nodeLocator || record);
            }

        }
        
        // if we're an open folder, showing sparse connectors, we have a gap below us
        if (isOpen && !this.showFullConnectors) end = true
        else {
            end = !this._shouldShowNextLine(record, recordNum);
        }

        start = !this._shouldShowPreviousLine(record, recordNum);

        var isSelected = this.showSelectedOpener && this.isSelected(record, recordNum);
        // punt it over to getOpenerImageURL which will assmble the URL from the state info.
        return this.getOpenerImageURL(isFolder, hasChildren, isOpen, isSelected, start, end);
	}
},

// _shouldShowPreviousLine
// Internal method - should we show a continuation connector line going up to the previous row 
// for some record?
// True if the previous row is a sibling of this record, or if this is the first record in
// some folder (so the previous row contains parent of this record)
_shouldShowPreviousLine : function (record, rowNum) {
    if (!this.data.isEmpty() && this.data.first() == record) {
        return false;
    }

    // always show a previous line if we're showing "full connectors"
    if (this.showFullConnectors) return true;

    rowNum = rowNum == null ? this.data.indexOf(record) : rowNum;
    var previousRecord = this.getRecord(rowNum - 1),
        parent = this.data.getParent(record, this.data.getPathForOpenListIndex(rowNum));

    if (previousRecord == null) return false;
    return (parent == previousRecord || parent == 
                this.data.getParent(previousRecord, this.data.getPathForOpenListIndex(rowNum)));
},

// _shouldShowNextLine
// Internal method - should we show a continuation connector line going down to the next row for
// some record?
// True only if the next row is a sibling of this record.
_shouldShowNextLine : function (record, rowNum) {
    if (this.showFullConnectors) {
        var data = this.data,
            parent = data.getParent(record),
            children = data.getChildren(parent);
        return (children.indexOf(record) != (children.getLength() - 1));
    }
    rowNum = rowNum == null ? this.data.indexOf(record) : rowNum;
    var nextRecord = this.getRecord(rowNum + 1);
    
    if (nextRecord == null) return false;
    return (this.data.getParent(record, this.data.getPathForOpenListIndex(rowNum)) == 
                this.data.getParent(nextRecord, this.data.getPathForOpenListIndex(rowNum)));
},

//>	@method	treeGrid.getOpenerImageURL()	(A)
// Helper method called from getOpenIcon to retrieve the appropriate image URL string for
// the opener.
//
// @param isFolder (boolean) Is the node in question a folder? For showConnectors:true mode, this 
//                          method returns connector lines for leaves as well as open icons for folders
// @param	hasChildren (boolean)   Is the node in question a folder with children?
// @param   isOpen   (boolean)  Is the node an open folder?
// @param   isSelected   (boolean)  Is the node selected?
// @param   startLine (boolean)   True if the previous row in the TreeGrid is not a sibling
//                                  or the parent of the node in question.  (Node effectively
//                                  starts a new hierarchy continuation line).
// @param   endLine   (boolean)   True if the next row in the TreeGrid is not a sibling
//                                  of the node in question.  (Node effectively ends a
//                                  hierarchy continuation line).
// @return	(String)		URL for the icon to show the node's state
//
// @visibility internal
//<
getOpenerImageURL : function (isFolder, hasChildren, isOpen, isSelected, startLine, endLine) {
    
    // The static TreeGrid.getConnectorImageMap / getOpenerImageMap methods will lazily
    // assemble the full set of possible URLs based on baseFileName plus various states.
    // This method extracts the appropriate URL from that set for the current node.
    if (this.showConnectors) {

        var imageMap = isc.TreeGrid.getConnectorImageMap(this.connectorImage, this.isRTL());

        
        var singleIndex = 0,
            startIndex = 3,
            endIndex = 6,
            middleIndex = 9,
            
            openOffset = 1, closedOffset = 2,
            
            selectedOffset = 12;
    
        var folderIcon = (hasChildren || (isFolder && this.alwaysShowOpener)),
            index;
    
        // Folders: Sparse connectors: if open it's either single [startLine] or end
        if (folderIcon && isOpen && !this.showFullConnectors) {
            index = startLine ? singleIndex : endIndex;
        } else {
            index = startLine && endLine ? singleIndex :
                            startLine ? startIndex :
                                endLine ? endIndex : middleIndex;
        }
        
        if (folderIcon) {
            index += isOpen ? openOffset : closedOffset;
        }
        
        if (isSelected) {
            index += 12;
        }
        
        return imageMap[index];

    // no connectors - use openerImage instead
    } else {
        // we don't return any image if we're not showing connectors, and this is not a folder
        // with children.
        if (!isFolder || (!hasChildren && !this.alwaysShowOpener)) return null;
        
        
        var imageMap = isc.TreeGrid.getOpenerImageMap(this.openerImage);
        
        // We don't show a different RTL image for opened folders' opener icon
        
        var isRTL = !isOpen ? this.isRTL() : false;

                
        var index = (isOpen ? 1 : 2);
        if (isSelected) index += 4;
        if (isRTL) index += 8;
        return imageMap[index];
    }
},

//>	@method	treeGrid.setRowIcon()	(A)
// Set the icon for a particular record to a specified URL (relative to Page.imgDir + this.imgDir
//
//		@param	record		(TreeNode)	tree node
//		@param	URL		(URL)		URL for the record icon
//<
setRowIcon : function (record, URL) {

	// normalize the record to a number if necessary
	if (!isc.isA.Number(record)) record = this.data.indexOf(record);
    // set the image
    
    if (record != -1 && this.getIcon(record) != null) {
        this.logDebug("In setRowIcon, about to set icon " + URL + " for row " + record);
        this.setImage(this._iconIDPrefix + record, URL, null, isc.Canvas._generateSpanForBlankImgHTML);
    }
},

//> @method treeGrid.setNodeIcon() 
// Set the icon for a particular treenode to a specified URL
//
//		@param node		(TreeNode) tree node
//		@param icon		(SCImgURL) path to the resource
//		@group treeIcons
//		@visibility external
//<		
setNodeIcon : function (node, icon) {
	//make the change persist across redraws 
	node[this.customIconProperty] = icon;
	//efficiently refresh the image
    this.setImage(this._iconIDPrefix + this.getRecordIndex(node), icon, null, isc.Canvas._generateSpanForBlankImgHTML);
},

// Override getCellsToRefreshOnSelectionChange(): We need to redraw the treeField if
// we're showing selected icons or openers for the row
getCellsToRefreshOnSelectionChange : function (rowNum) {

    // no need to call Super: Default implementation will return the checkboxField
    // if present. For TreeGrids, shouldShowCheckboxField always returns false and the
    // checkbox icon is written into the treeField.    
    
    var treeField = this.getTreeFieldNum();
    if (treeField != null) {
        if (this.selectionAppearance == "checkbox") return [[rowNum, treeField]];
        if (this.showSelectedOpener) return [[rowNum, treeField]];

        var node = this.data && this.data.get(rowNum);
        if (node && node[this.customIconProperty] != null) {
        
            var showSelectedIcon = node[this.customIconSelectedProperty];
            if (showSelectedIcon == null) showSelectedIcon = this.showCustomIconSelected;
            
            if (showSelectedIcon) return [[rowNum, treeField]];
        } else {
            if (this.showSelectedIcons) return [[rowNum, treeField]];
        }
    }
},

// -------------------
// Printing

getPrintHTML : function (printProperties, callback) {
    var expand = this.printExpandTree;
    if (expand == null) expand = printProperties ? printProperties.expandTrees : null;
    
    if (expand && this.data) {
        if (isc.ResultTree && isc.isA.ResultTree(this.data) && this.data.loadDataOnDemand) {
            this.logWarn("Printing TreeGrid with option to expand folders on print not supported " +
                            "for load on demand trees.");
        } else {
            this.data.openAll();
        }
    }
    return this.Super("getPrintHTML", arguments);
},

// Multiple copies of this string are prepended to the tree field, in order to indent it,
// when exporting tree data via +link{DataBoundComponent.getClientExportData}.
//exportIndentString:null,

getExportFieldValue : function (record, fieldName, fieldIndex) {
    var val = this.Super("getExportFieldValue", arguments);
    
    // Prepend tree depth indent string, ensuring that children of root are not indented
    if (fieldIndex == this.getTreeFieldNum() && this.exportIndentString) {
        var level = this.data.getLevel(record);
        while (--level > 0) val = this.exportIndentString + val;
    }

    return val;
}
});



// Register "stringMethods" for this class
isc.TreeGrid.registerStringMethods({
//    folderDropMove:"viewer,folder,childIndex,child,position",

    //> @method treeGrid.folderOpened()
    //
    // This method is called when a folder is opened either via the user manipulating the
    // expand/collapse control in the UI or via +link{TreeGrid.openFolder()}.  You can return
    // <code>false</code> to cancel the open.
    //
    // @param node   (TreeNode) the folder (record) that is being opened
    // @param [path] (String)   optional parameter containing the full path to the node.
    //                          This is essential context for a
    //                          +link{tree.multiLinkTree,multi-link tree}, but is not 
    //                          required in ordinary trees
    // 
    // @return (boolean) false to cancel the open, true to all it to proceed
    //
    // @visibility external
    //<
    folderOpened : "node",

    //> @method treeGrid.folderClosed()
    //
    // This method is called when a folder is closed either via the user manipulating the
    // expand/collapse control in the UI or via +link{TreeGrid.closeFolder()}.  You can return
    // <code>false</code> to cancel the close.
    //
    // @param node (TreeNode) the folder (record) that is being closed
    // 
    // @return (boolean) false to cancel the close, true to all it to proceed
    //
    // @visibility external
    //<
    folderClosed : "node",

    //> @method treeGrid.folderClick()
    //
    // This method is called when a folder record is clicked on.
    //
    // @param viewer (TreeGrid) The TreeGrid on which folderClick() occurred.
    // @param folder (TreeNode) The folder (record) that was clicked
    // @param recordNum (number) Index of the row where the click occurred.
    // 
    // @see treeGrid.nodeClick()
    //
    // @visibility external
    //<
    folderClick : "viewer,folder,recordNum",

    //> @method treeGrid.leafClick()
    //
    // This method is called when a leaf record is clicked on.
    //
    // @param viewer (TreeGrid) The TreeGrid on which leafClick() occurred.
    // @param leaf (TreeNode) The leaf (record) that was clicked
    // @param recordNum (number) Index of the row where the click occurred.
    // 
    // @see treeGrid.nodeClick()
    //
    // @visibility external
    //<
    leafClick : "viewer,leaf,recordNum",

    //> @method treeGrid.nodeClick()
    //
    // This method is called when a leaf or folder record is clicked on.  Note that if you set
    // up a callback for <code>nodeClick()</code> and e.g. +link{treeGrid.leafClick()}, then
    // both will fire (in that order) if a leaf is clicked on.
    //
    // @param viewer (TreeGrid) The TreeGrid on which leafClick() occurred.
    // @param node (TreeNode) The node (record) that was clicked
    // @param recordNum (number) Index of the row where the click occurred.
    // 
    // @see treeGrid.folderClick()
    // @see treeGrid.leafClick()
    //
    // @visibility external
    // @example treeDropEvents
    //<
    nodeClick : "viewer,node,recordNum",

    //> @method treeGrid.folderContextClick()
    //
    // This method is called when a context click occurs on a folder record.
    //
    // @param viewer (TreeGrid) The TreeGrid on which the contextclick occurred.
    // @param folder (TreeNode) The folder (record) on which the contextclick occurred.
    // @param recordNum (number) Index of the row where the contextclick occurred.
    //
    // @return (boolean) whether to cancel the event
    //
    // @see treeGrid.nodeContextClick();
    //
    // @visibility external
    //<
    folderContextClick : "viewer,folder,recordNum",

    //> @method treeGrid.leafContextClick()
    //
    // This method is called when a context click occurs on a leaf record.
    //
    // @param viewer (TreeGrid) The TreeGrid on which the contextclick occurred.
    // @param leaf (TreeNode) The leaf (record) on which the contextclick occurred.
    // @param recordNum (number) Index of the row where the contextclick occurred.
    //
    // @return (boolean) whether to cancel the event
    //
    // @see treeGrid.nodeContextClick();
    //
    // @visibility external
    //<
    leafContextClick : "viewer,leaf,recordNum",

    //> @method treeGrid.nodeContextClick()
    //
    // This method is called when a context click occurs on a leaf or folder record.  Note that
    // if you set up a callback for <code>nodeContextClick()</code> and
    // e.g. +link{treeGrid.leafContextClick}, then both will fire (in that order) if a leaf
    // is contextclicked - unless <code>nodeContextClick()</code> returns false, in which case
    // no further contextClick callbacks will be called.
    //
    // @param viewer (TreeGrid) The TreeGrid on which the contextclick occurred.
    // @param node (TreeNode) The node (record) on which the contextclick occurred.
    // @param recordNum (number) Index of the row where the contextclick occurred.
    //
    // @return (boolean) whether to cancel the event
    //
    // @see treeGrid.folderContextClick();
    // @see treeGrid.leafContextClick();
    //
    // @visibility external
    //<
	nodeContextClick : "viewer,node,recordNum",

    //> @method treeGrid.dataArrived
    // Notification method fired whenever this TreeGrid receives new data nodes from the 
    // dataSource. Only applies to databound TreeGrids where +link{treeGrid.data} is a 
    // +link{ResultTree} - either explicitly created and applied via +link{treeGrid.setData()} or
    // automatically generated via a +link{treeGrid.fetchData(),fetchData()} call.
    // <P>
    // Note that <code>dataArrived()</code>, unlike +link{dataChanged()}, only fires in limited
    // circumstances - when data for a +link{resultTree} arrives from the server due to a fetch
    // or cache invalidation, or as a result of filtering.  If you want to catch all data
    // changes, you should instead react to +link{dataChanged()}.
    //
    // @param parentNode (TreeNode) The parentNode for which children were just loaded
    // @see dataChanged
    // @visibility external
    //<
    dataArrived:"parentNode",

    //> @method treeGrid.dataChanged() (A)
    // Notification method fired when the TreeGrid's data changes, for any reason.<smartclient>
    // If overridden (rather than +link{observe(), observed}), you must +link{Super(),call the
    // superclass implementation} to ensure proper Framework behavior.</smartclient>
    // <P>
    // Examples of why data changed might be:<ul>
    // <li> a call to +link{addData()}, +link{updateData()}, or +link{removeData()}
    // <li> +link{DataSource} updates from the server for +link{ResultTree} data
    // (triggered by record editing, etc.)
    // <li> fetches arriving back from the server for +link{ResultTree} data
    // <li> programmatic changes to +link{Tree} data if made through APIs such as
    // +link{Tree.add()}, +link{Tree.remove()}, etc.
    // <li> cache invalidation
    // <li> filtering
    // </ul>
    // Calling +link{setData()} doesn't call this notification directly, but it may
    // fire if one of the above listed events is triggered (e.g. a server fetch for 
    // +link{ResultTree} data).
    // <P>
    // Note that the <code>operationType</code> parameter is optional and will be passed and
    // contain the operation (e.g. "update") if this notification was triggered by a fetch,
    // an +link{addData()}, +link{updateData()}, or +link{removeData()}, or a +link{DataSource}
    // update for +link{ResultTree} data (the first three reasons listed above) but otherwise
    // will be <smartclient>undefined</smartclient><smartgwt>null</smartgwt>.
    //
    // @param [operationType] (String) optionally passed operation causing the change
    // @see dataArrived()
    // @visibility external
    //<

    //> @method treeGrid.onFolderDrop
    // @param nodes (Array of TreeNode) List of nodes being dropped
    // @param folder (TreeNode) The folder being dropped on
    // @param index (Integer) Within the folder being dropped on, the index at which the drop is
    //                        occurring.
    // @param dropPosition (RecordDropPosition) position with respect to the target record
    // @param sourceWidget (Canvas) The component that is the source of the nodes (where the nodes
    //                              were dragged from).
    // @return (boolean) return false to cancel standard folder drop processing
    // @include TreeGrid.folderDrop
    // @visibility sgwt
    //<
    onFolderDrop:"nodes,folder,index,dropPosition,sourceWidget"
});
