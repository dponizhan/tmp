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
//>	@class	MultiLinkSelection
//
// Maintains a 'selected' subset of a +link{tree.multiLinkTree,multi-link tree}.  Multi-link
// trees cannot use the +link{class:Selection,regular selection manager} because they allow 
// multiple occurences of the same node; therefore, selection caching must be done in a way 
// that allows duplicate nodes to be unambiguously identified.  Because the base 
// <code>Selection</code> class caches pointers to the selected nodes or records directly, it 
// is fundamentally unable to do this. <code>MultiLinkSelection</code>, by contrast, caches 
// +link{object:NodeLocator} objects.
// <p>
// Includes methods for programmatically selecting node occurences and checking which node
// occurences are selected, and also for selecting node occurences as a result of mouse events,
// including drag selection support.
// The selection object is used automatically to handle selection APIs on +link{class:TreeGrid}
// instances where the data model is multi-linked (see +link{resultTree.linkDataSource} and 
// +link{tree.linkData} for further details).
// <p>
// Note that selection and deselection are skipped for nodes that aren't enabled, or that are
// marked as non-selectable; the relevant properties are +link{ListGrid.recordEnabledProperty} 
// and +link{ListGrid.recordCanSelectProperty}.  The recommended approach to affect disabled 
// objects via the Selection APIs is to temporarily enable them beforehand.
//
// @visibility external
// @see ListGrid.selectionManager
// @see DataBoundComponent.selectRange()
// @see DataBoundComponent.selectRecord()
// @treeLocation Client Reference/System
//<


isc.ClassFactory.defineClass("MultiLinkSelection", isc.Selection);

isc.MultiLinkSelection.addProperties({

//>	@method	multiLinkSelection.select()
// Select a particular node occurence.  Note if you do not pass a +link{object:NodeLocator}, 
// the recordNum parameter is required.
//		@group	selection
//
//		@param	node	    (Node | NodeLocator)  node to select, or a NodeLocator that 
//                                                identifies it
//      @param  [recordNum] (Integer)             Optional index into the underlying Tree's 
//                                                openList (which will be the same as the record
//                                                number in a +link{class:TreeGrid})
//		@return				(boolean)	true == selection actually changed, false == no change
// @visibility external
//<
select : function (item, recordNum) {
    return this.setSelected(item, true, recordNum);
},

//>	@method	multiLinkSelection.deselect()
// Deselect a particular node occurence.  Note if you do not pass a +link{object:NodeLocator}, 
// the recordNum parameter is required.
//		@group	selection
//
//		@param	node	    (Node | NodeLocator)  node to deselect, or a NodeLocator that 
//                                                identifies it
//      @param  [recordNum] (Integer)             Optional index into the underlying Tree's 
//                                                openList (which will be the same as the record
//                                                number in a +link{class:TreeGrid})
//		@return				(boolean)	true == selection actually changed, false == no change
// @visibility external
//<
deselect : function (item, recordNum) {
    return this.setSelected(item, false, recordNum);
},

//>	@method	multiLinkSelection.selectSingle()
// Select a single node occurence and deselect everything else.  Note if you do not pass a 
// +link{object:NodeLocator}, the recordNum parameter is required.
//		@group	selection
//
//		@param	node	    (Node | NodeLocator)  node to select, or a NodeLocator that 
//                                                identifies it
//      @param  [recordNum] (Integer)             Optional index into the underlying Tree's 
//                                                openList (which will be the same as the record
//                                                number in a +link{class:TreeGrid})
//		@return				(boolean)	true == selection actually changed, false == no change
// @visibility external
//<
selectSingle : function (item, recordNum) {
    var itemWasSelected, othersWereSelected;
    

    // deselect the item if selected (and remember whether it was)
    itemWasSelected = this.deselect(item, recordNum);
    // deselect everything else
    othersWereSelected = this.deselectAll();
    // Reselect the single item
    this.select(item, recordNum);

    // return true if the item became selected or others were cleared
    return !itemWasSelected || othersWereSelected;
},

transformItem : function(item, recordNum) {
    //>DEBUG
    this._assert(this.data.isMultiLinkTree() && (this.data.isANodeLocator(item) || recordNum != null));
    //<DEBUG
    if (this.data.isANodeLocator(item)) {
        this.lastSelectionNodeLocator = item;
    } else {
        this._assert(isc.isA.Number(recordNum) && recordNum >= 0);
        this.lastSelectionNodeLocator = this.data.getNodeLocator(recordNum);
    }
    this.lastSelectionRecordNum = recordNum != null ? recordNum
                                                    : this.lastSelectionNodeLocator.openListIndex;
    return this.lastSelectionNodeLocator.node;
},

// Calls to setSelected() do not always come from a context that can supply a recordNum (for 
// example, selectList).  However, such calls always pass NodeLocators rather than nodes, so 
// we should ALWAYS have either a recordNum or a NodeLocator which contains a recordNum - see 
// the assert() in transformItem.  Therefore, as long as transformRecordNum() is always called
// soon after transformItem(), it is safe to assume that lastSelectionRecordNum is correct
transformRecordNum : function(recordNum) {
    return recordNum != null ? recordNum : this.lastSelectionRecordNum;
},

transformItemForCaching : function(item, recordNum) {
    this._assert(this.data.isMultiLinkTree());
    var nodeLocator;
    if (this.data.isANodeLocator(item)) {
        nodeLocator = item;
    } else {
        isc.MultiLinkSelection._assert(isc.isA.Number(recordNum) && recordNum >= 0);
        nodeLocator = this.data.getNodeLocator(recordNum);
    }
    //>DEBUG
    this._assert(item == nodeLocator || item == nodeLocator.node);
    //<DEBUG
    return nodeLocator;
},

getRange : function(start, end) {
    var range = [];
    for (var i = start; i < end; i++) {
        range.add(this.data.getNodeLocator(i))
    }
    return range;
},

getPartiallySelectedFlag : function(item, recordNum, useLastSelected) {
    var nodeLocator;
    if (recordNum != null) {
        nodeLocator = this.data.getNodeLocator(recordNum);
    } else if (useLastSelected) {
        // WRWRWR - slightly queasy about this: the useLastSelected param tells us the 
        // lastSelectedNodeLocator is safe to use for whatever use case has resulted in this 
        // call, so why don't we always do that (instead of only when there is no recordNum)?
        nodeLocator = this.lastSelectionNodeLocator;
    }
    return this.data._getNodePartiallySelectedStateFromIndex(nodeLocator);
},
setPartiallySelectedFlag : function(item, recordNum, value, useLastSelected) {
    var nodeLocator;
    if (recordNum != null) {
        nodeLocator = this.data.getNodeLocator(recordNum);
    } else if (useLastSelected) {
        nodeLocator = this.lastSelectionNodeLocator;
    }
    this.data._setNodePartiallySelectedStateInIndex(nodeLocator, value);
},
clearPartiallySelectedFlag : function(item, recordNum, useLastSelected) {
    var nodeLocator;
    if (recordNum != null) {
        nodeLocator = this.data.getNodeLocator(recordNum);
    } else if (useLastSelected) {
        nodeLocator = this.lastSelectionNodeLocator;
    }
    this.data._setNodePartiallySelectedStateInIndex(nodeLocator, null);
},
 
getSelectedFlag : function(item, recordNum, useLastSelected) {
    var nodeLocator;
    if (recordNum != null) {
        nodeLocator = this.data.getNodeLocator(recordNum);
    } else if (useLastSelected) {
        nodeLocator = this.lastSelectionNodeLocator;
    }
    return this.data._getNodeSelectedStateFromIndex(nodeLocator);
},
setSelectedFlag : function(item, recordNum, newState) {
/*    var nodeLocator;
    if (recordNum != null) {
        nodeLocator = this.data.getNodeLocator(recordNum);
    } else if (useLastSelected) {
        nodeLocator = this.lastSelectionNodeLocator;
    }
    this.data._setNodeSelectedStateInIndex(nodeLocator, value); */
    this._assert(isc.isA.Number(recordNum) && recordNum >= 0)
    var nodeLocator = this.data.getNodeLocator(recordNum);
    this._assert(!!nodeLocator)
    this.data._setNodeSelectedStateInIndex(nodeLocator, newState);
},
clearSelectedFlag : function(item, recordNum) {
    var nodeLocator = this.data.getNodeLocator(recordNum);
    this.data._setNodeSelectedStateInIndex(nodeLocator, null);
},

getParent : function(item, recordNum) {
    // This method is only called by setSelected(), which will cope correctly with the 
    // returned value being a NodeLocator (we can't just retuen a node because it is going to
    // be used in upward propagation)
    var nodeLocator = this.data.getNodeLocator(recordNum);
    return this.data._getParentNodeLocator(nodeLocator);
},

recurseSelectionUpward : function(parent, newState, recordNum, cascadeDirection) { 
    //>DEBUG
    isc.MultiLinkSelection._assert(this.data.isANodeLocator(parent));
    //<DEBUG
    this.setSelected(parent, newState, parent.openListIndex, cascadeDirection);
},

preserveAdditionalSetSelectionState : function() {
    if (!this._lastSelectionNodeLocators) {
        this._lastSelectionNodeLocators = [];
        this._lastSelectionRecordNums = [];
    }
    this._lastSelectionNodeLocators.push(this.lastSelectionNodeLocator);
    this._lastSelectionRecordNums.push(this.lastSelectionRecordNum);
},
restoreAdditionalSetSelectionState : function() {
    if (!this._lastSelectionNodeLocators) return;
    this.lastSelectionNodeLocator = this._lastSelectionNodeLocators.pop();
    this.lastSelectionRecordNum = this._lastSelectionRecordNums.pop();
},

cacheSelection : function (onlyOpen, dontSort) {
    
    this.Super("cacheSelection", [true, dontSort], arguments);

    // HACK - this is even more temporary than the above code forcing onlyOpen to true, it 
    // just lets me test the solution based on openList
    if (this._openCache) {
        this._openCache._cache = null;
        this._cache = this._openCache;
    }

    // Yet another hack - the dirty flag is only reset on a full cache
    this._dirty = false;    
},

isSelected : function (item, recordNum, onlyOpen) {
    
    onlyOpen = true;
    //>DEBUG
    this._assert(this.data.isANodeLocator(item) || isc.isA.Number(recordNum));
    //<DEBUG

    if (onlyOpen && (this.cascadeSelection || !isc.isA.Tree(this.data))) {
    //    onlyOpen = false;
    }

    if (this._dirty && !(onlyOpen == true && this._openCache != null) && !this._cachingSelection) {
        this.cacheSelection(onlyOpen);
    }

    

    if (item == null) return false;
    var nodeLocator = item;
    if (!this.data.isANodeLocator(item)) {
        nodeLocator = this.data.getNodeLocator(recordNum);
    }
    return this.data._getNodeSelectedStateFromIndex(nodeLocator);
},

isPartiallySelected : function (item, recordNum) {
    //>DEBUG
    this._assert(isc.isA.Number(recordNum) && recordNum >= 0);
    //<DEBUG

    
    if (this._dirty && !this._cachingSelection) this.cacheSelection();
    if (item == null) return false;
    return this.data._getNodePartiallySelectedStateFromIndex(this.data.getNodeLocator(recordNum));
},

performReselectOnUpdate : function (modifiedRecord, recordNum) {
    
    this.select(modifiedRecord, recordNum);
},

getSelectedRecord : function () {
    var selected = this.Super("getSelectedRecord", arguments);
    if (this.data.isANodeLocator(selected)) {
        selected = selected.node;
    }
    return selected;
},

//>	@method	multiLinkSelection.getSelection()
// Returns the selected nodes in this grid as a list of +link{object:NodeLocator}s.
//
// @group	selection
// @return (Array of NodeLocator)	The list of selected node occurences in the grid
// @visibility external
//<
getSelection : function () {
    return this.Super("getSelection", arguments);
},

//>	@method	multiLinkSelection.getSelectedRecords()
// Returns the selected nodes in this grid as a direct array of records.  Contrast this with 
// +link{MultiLinkSelection.getSelection()}, which returns a list of +link{object:NodeLocator}s.
// Note, because this is <code>MultiLinkSelection</code>, this method may return an array 
// containing the same node multiple times, with no way of discerning which particular 
// occurence(s) are selected.  If you need an unambiguous list of selected node occurences, use
// <code>getSelection()</code>.
//
// @group	selection
// @return (Array of TreeNode)	The list of selected nodes in the grid
// @visibility external
//<
getSelectedRecords : function () {
    var selected = this.getSelection();
    if (!selected || selected.length == 0) return selected;
    if (this.data.isANodeLocator(selected[0])) {  // ASSERT: It will be
        var nodeLocators = selected;
        selected = [];
        for (var i = 0; i < nodeLocators.length; i++) {
            selected[selected.length] = nodeLocators[i].node;
        }
    }
    return selected;
},

selectList : function (list, newState, selectionChanged, caller, skipDataCheck) {
    
    var rtnValue = this.invokeSuper(isc.MultiLinkSelection, "selectList", list, newState, selectionChanged, caller, true);
    // Re-cache when we're done
    if (rtnValue) {
        
        this._dirty = true;
        this.cacheSelection();
    }
    return rtnValue;
},

getLastIndex : function(record, recordNum) {
    return recordNum;
},

getBaseIndex : function() {
    return this._shiftSelectBaseRecordNum; 
}

});