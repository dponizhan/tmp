/*

  SmartClient Ajax RIA system
  Version v12.1p_2021-02-17/LGPL Development Only (2021-02-17)

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

if(window.isc&&window.isc.module_Core&&!window.isc.module_AceEditor){isc.module_AceEditor=1;isc._moduleStart=isc._AceEditor_start=(isc.timestamp?isc.timestamp():new Date().getTime());if(isc._moduleEnd&&(!isc.Log||(isc.Log&&isc.Log.logIsDebugEnabled('loadTime')))){isc._pTM={message:'AceEditor load/parse time: '+(isc._moduleStart-isc._moduleEnd)+'ms',category:'loadTime'};if(isc.Log&&isc.Log.logDebug)isc.Log.logDebug(isc._pTM.message,'loadTime');else if(isc._preLog)isc._preLog[isc._preLog.length]=isc._pTM;else isc._preLog=[isc._pTM]}isc.definingFramework=true;if(window.isc&&isc.version!="v12.1p_2021-02-17/LGPL Development Only"&&!isc.DevUtil){isc.logWarn("SmartClient module version mismatch detected: This application is loading the core module from SmartClient version '"+isc.version+"' and additional modules from 'v12.1p_2021-02-17/LGPL Development Only'. Mixing resources from different SmartClient packages is not supported and may lead to unpredictable behavior. If you are deploying resources from a single package you may need to clear your browser cache, or restart your browser."+(isc.Browser.isSGWT?" SmartGWT developers may also need to clear the gwt-unitCache and run a GWT Compile.":""))}
isc.ClassFactory.defineClass("AceEditor","Canvas");isc.A=isc.AceEditor;isc.B=isc._allFuncs;isc.C=isc.B._maxIndex;isc.D=isc._funcClasses;isc.D[isc.C]=isc.A.Class;isc.B.push(isc.A.$193m=function isc_c_AceEditor__applyCreateProperties(_1){for(var i=1;i<arguments.length;i++){var _3=arguments[i];if(isc.isAn.Object(_3)){for(var _4 in _3){var _5=_3[_4],_6="set"+_4.substring(0,1).toUpperCase()+_4.substring(1);if(_5!=null){if(isc.isA.Function(_1[_6])){_1[_6](_5)}
else _1[_4]=_5}}}}});isc.B._maxIndex=isc.C+1;isc.A=isc.AceEditor.getPrototype();isc.B=isc._allFuncs;isc.C=isc.B._maxIndex;isc.D=isc._funcClasses;isc.D[isc.C]=isc.A.Class;isc.B.push(isc.A.init=function isc_AceEditor_init(){this.redrawOnResize=false;this.useClipDiv=false;this.styleName="";this.Super("init",arguments)},isc.A.destroy=function isc_AceEditor_destroy(){if(this.editor)this.editor.destroy();this.Super("destroy",arguments)},isc.A.getInnerHTML=function isc_AceEditor_getInnerHTML(){var _1=this.getValue();if(this.editor){this.editor.destroy();this.editor=null}
return _1},isc.A.modifyContent=function isc_AceEditor_modifyContent(){var _1=this.$67h(),_2=this;_1.on('blur',function(){_2.$lf(false)});_1.on('focus',function(){_2.$lf(true)});_1.on('change',function(_3){_2.$48z(_3)});this.editor=_1;if(this.autoComplete!=null)this.setAutoComplete(this.autoComplete);if(this.liveAutoComplete!=null)this.setLiveAutoComplete(this.liveAutoComplete)},isc.A.$67h=function isc_AceEditor__createEditor(){if(!isc.AceEditor.$193n){isc.AceEditor.$193n=ace.require("./editor").Editor;ace.require("./lib/event")}
var _1=this.getContentElement();var _2=isc.AceRenderer.create(this.rendererDefaults,this.rendererProperties,{containerElement:_1}),_3=isc.AceUndoManager.create(),_4=isc.AceDocument.create({value:this.getValue()}),_5=isc.AceEditSession.create({document:_4,undoManager:_3,mode:this.mode},this.editSessionDefaults,this.editSessionProperties);this.renderer=_2;this.session=_5;var _6=new isc.AceEditor.$193n(_2.getAceObj(),_5.getAceObj());_6.scRef=this;var _7=_1.getElementsByTagName("textarea")[0];_7.setAttribute("handleNativeEvents","false");isc.AceEditor.$193m(_6,{theme:this.theme,readOnly:this.readOnly});return _6},isc.A.$193o=function isc_AceEditor__getStyleRules(_1){if(_1==null)return;var _2;try{_2=_1.rules;if(_2==null)_2=_1.cssRules}catch(e){this.logDebug("skipped stylesheet '"+_1+"' due to exception accessing rules")}
return _2},isc.A.$193p=function isc_AceEditor__updateAutoCompleteCss(){if(this.$193q)return;this.$193q=true;var _1=document.styleSheets;for(var i=0;i<_1.length;i++){if(_1[i].href!=null)continue;var _3=this.$193o(_1[i]);if(_3==null)continue;var _4=[];for(var j=0;j<_3.length;j++){var _6=_3[j].style;if(_6==null)continue;if(_3[j].selectorText==".ace_editor.ace_autocomplete"){var _7=_6["z-index"];if(_7!=null){_7=parseInt(_7);var _8=this.getZIndex(true);if(_7<_8){_6["z-index"]=_8+2}}}}}},isc.A.$48z=function isc_AceEditor__changed(_1){if(this.changed)this.changed(_1.start,_1.end,_1.action,_1.lines)},isc.A.focus=function isc_AceEditor_focus(){this.Super("focus",arguments);this.editor.focus()},isc.A.blur=function isc_AceEditor_blur(_1){this.Super("blur",arguments);this.editor.blur()},isc.A.resized=function isc_AceEditor_resized(){if(this.editor)this.editor.resize()},isc.A.dropMove=function isc_AceEditor_dropMove(){if(this.editor.getReadOnly()||!this.willAcceptDrop())return;var _1=this.editor.renderer.screenToTextCoordinates(isc.EventHandler.getX(),isc.EventHandler.getY());this.editor.navigateTo(_1.row,_1.column)},isc.A.getAceObj=function isc_AceEditor_getAceObj(){return this.editor},isc.A.getSession=function isc_AceEditor_getSession(){return this.session},isc.A.setSession=function isc_AceEditor_setSession(_1){this.session=_1;this.editor.setSession(_1.getAceObj())},isc.A.getRenderer=function isc_AceEditor_getRenderer(){return this.renderer},isc.A.setMode=function isc_AceEditor_setMode(_1){this.mode=_1;if(this.getSession())this.getSession().getAceObj().setMode(_1)},isc.A.setValue=function isc_AceEditor_setValue(_1){if(this.editor){this.editor.setValue(_1)}},isc.A.getValue=function isc_AceEditor_getValue(){var _1=this.value;if(this.editor){_1=this.editor.getValue()}
return _1},isc.A.setReadOnly=function isc_AceEditor_setReadOnly(_1){this.readOnly=_1;if(this.editor)this.editor.setReadOnly(_1)},isc.A.addSelectionMarker=function isc_AceEditor_addSelectionMarker(_1){return this.editor.addSelectionMarker(_1)},isc.A.removeSelectionMarker=function isc_AceEditor_removeSelectionMarker(_1){this.editor.removeSelectionMarker(_1)},isc.A.getCursorPosition=function isc_AceEditor_getCursorPosition(){return this.editor.getCursorPosition()},isc.A.getCursorPositionScreen=function isc_AceEditor_getCursorPositionScreen(){return this.editor.getCursorPositionScreen()},isc.A.clearSelection=function isc_AceEditor_clearSelection(){this.editor.clearSelection()},isc.A.getSelectionRange=function isc_AceEditor_getSelectionRange(){var _1=this.editor.getSelectionRange();if(_1==null)return null;return(_1.scRef?_1.scRef:isc.AceRange.create({range:_1}))},isc.A.getFirstVisibleRow=function isc_AceEditor_getFirstVisibleRow(){return this.editor.getFirstVisibleRow()},isc.A.getLastVisibleRow=function isc_AceEditor_getLastVisibleRow(){return this.editor.getLastVisibleRow()},isc.A.isRowVisible=function isc_AceEditor_isRowVisible(_1){return this.editor.isRowVisible(_1)},isc.A.insert=function isc_AceEditor_insert(_1){this.editor.insert(_1)},isc.A.redo=function isc_AceEditor_redo(){this.editor.redo()},isc.A.undo=function isc_AceEditor_undo(){this.editor.undo(dontSelect||false)},isc.A.updateSelectionMarkers=function isc_AceEditor_updateSelectionMarkers(){this.editor.updateSelectionMarkers()},isc.A.setAutoComplete=function isc_AceEditor_setAutoComplete(_1){this.autoComplete=_1;if(this.editor){window.ace.require("./ext/language_tools");this.editor.setOptions({enableBasicAutocompletion:_1});if(_1){this.$193p()}}},isc.A.setLiveAutoComplete=function isc_AceEditor_setLiveAutoComplete(_1){this.liveAutoComplete=_1;if(this.editor){ace.require("./ext/language_tools");this.editor.setOptions({enableLiveAutocompletion:_1});if(_1){this.$193p()}}},isc.A.setCompleters=function isc_AceEditor_setCompleters(_1){if(!isc.AceEditor.$193r){isc.AceEditor.$193r=ace.require("./ext/language_tools")}
if(_1!=null){_1=(isc.isAn.Array(_1)?_1:[_1]);for(var i=0;i<_1.length;i++){this.$193s(_1[i])}}
isc.AceEditor.$193r.setCompleters(_1)},isc.A.addCompleter=function isc_AceEditor_addCompleter(_1){if(!isc.AceEditor.$193r){isc.AceEditor.$193r=ace.require("./ext/language_tools")}
this.$193s(_1);isc.AceEditor.$193r.addCompleter(_1)},isc.A.$193s=function isc_AceEditor__prepareCompleter(_1){_1.$193t=_1.getCompletions;_1.getCompletions=function(_4,_5,_6,_7,_8){if(_1.$193t){return _1.$193t(_4,_5,_6,_7,function(_9){if(_1.useCustomInsertMatch&&_1.insertMatch){if(_9!=null){for(var i=0;i<_9.length;i++){_9[i].completer=(_1.getJsObj?_1.getJsObj:_1)}}}
_8(null,_9)})}else{_8(null,[])}}
if(_1.useCustomInsertMatch&&_1.insertMatch){_1.$193u=_1.insertMatch;_1.insertMatch=function(_4,_5){var _3=_4.completer.completions.filterText;_1.$193u(_4.scRef,_3,_5)}}});isc.B._maxIndex=isc.C+38;isc.AceEditor.registerStringMethods({changed:"start,end,action,lines"});isc.ClassFactory.defineClass("AceCompleter");isc.AceCompleter.addProperties({})
isc.AceCompleter.registerStringMethods({getCompletions:"editor,session,pos,prefix,callback",insertMatch:"editor,filterText,data"});isc.ClassFactory.defineClass("AceCompletionResult");isc.AceCompletionResult.addProperties({})
isc.ClassFactory.defineClass("AceRenderer");isc.A=isc.AceRenderer;isc.A.baseProperties=["showGutter","showPrintMargin"];isc.A=isc.AceRenderer.getPrototype();isc.B=isc._allFuncs;isc.C=isc.B._maxIndex;isc.D=isc._funcClasses;isc.D[isc.C]=isc.A.Class;isc.B.push(isc.A.init=function isc_AceRenderer_init(){if(!isc.AceRenderer.$193n){isc.AceRenderer.$193n=ace.require("./virtual_renderer").VirtualRenderer}
var _1=new isc.AceRenderer.$193n(this.containerElement,this.theme);_1.scRef=this;var _2=this;_1.$193v=_1.setSession;_1.setSession=function(_3){this.$193v(_3);_2.pushInitialSettings()};this.renderer=_1},isc.A.destroy=function isc_AceRenderer_destroy(){if(this.renderer)this.renderer.destroy();this.Super("destroy",arguments)},isc.A.getAceObj=function isc_AceRenderer_getAceObj(){return this.renderer},isc.A.pushInitialSettings=function isc_AceRenderer_pushInitialSettings(){for(var i=0;i<isc.AceRenderer.baseProperties.length;i++){var _2=isc.AceRenderer.baseProperties[i],_3=this[_2],_4="set"+_2.substring(0,1).toUpperCase()+_2.substring(1);if(_3!=null){if(isc.isA.Function(this[_4]))this[_4](_3);else this[_2]=_3}}},isc.A.hideCursor=function isc_AceRenderer_hideCursor(){this.renderer.hideCursor()},isc.A.showCursor=function isc_AceRenderer_showCursor(){this.renderer.showCursor()});isc.B._maxIndex=isc.C+6;isc.A=isc.AceRenderer.getPrototype();isc.B=isc._allFuncs;isc.C=isc.B._maxIndex;isc.D=isc._funcClasses;isc.D[isc.C]=isc.A.Class;isc.B.push(isc.A.setTheme=function isc_AceRenderer_setTheme(_1){this.theme=_1;this.renderer.setTheme(_1)},isc.A.setShowGutter=function isc_AceRenderer_setShowGutter(_1){this.showGutter=_1;this.renderer.setShowGutter(_1)},isc.A.setShowPrintMargin=function isc_AceRenderer_setShowPrintMargin(_1){this.showPrintMargin=_1;this.renderer.setShowPrintMargin(_1)});isc.B._maxIndex=isc.C+3;isc.ClassFactory.defineClass("AceDocument");isc.A=isc.AceDocument.getPrototype();isc.B=isc._allFuncs;isc.C=isc.B._maxIndex;isc.D=isc._funcClasses;isc.D[isc.C]=isc.A.Class;isc.B.push(isc.A.init=function isc_AceDocument_init(){if(!isc.AceDocument.$193n){isc.AceDocument.$193n=ace.require("./document").Document}
this.document=new isc.AceDocument.$193n(this.value);this.document.scRef=this},isc.A.getAceObj=function isc_AceDocument_getAceObj(){return this.document},isc.A.createAnchor=function isc_AceDocument_createAnchor(_1,_2){if(isc.isAn.Object(_1)){_2=_1.column;_1=_1.row}
var _3=this.document.createAnchor(_1,_2);return(_3?isc.AceAnchor.create({anchor:_3}):null)},isc.A.getLength=function isc_AceDocument_getLength(){return this.document.getLength()},isc.A.getTextRange=function isc_AceDocument_getTextRange(_1){return this.document.getTextRange(_1.getAceObj())});isc.B._maxIndex=isc.C+5;isc.A=isc.AceDocument.getPrototype();isc.B=isc._allFuncs;isc.C=isc.B._maxIndex;isc.D=isc._funcClasses;isc.D[isc.C]=isc.A.Class;isc.B.push(isc.A.getValue=function isc_AceDocument_getValue(){return this.document.getValue()},isc.A.setValue=function isc_AceDocument_setValue(_1){this.document.setValue(_1)});isc.B._maxIndex=isc.C+2;isc.ClassFactory.defineClass("AceEditSession");isc.A=isc.AceEditSession;isc.A.baseProperties=["undoManager","tabSize"];isc.A=isc.AceEditSession.getPrototype();isc.B=isc._allFuncs;isc.C=isc.B._maxIndex;isc.D=isc._funcClasses;isc.D[isc.C]=isc.A.Class;isc.B.push(isc.A.init=function isc_AceEditSession_init(){if(!isc.AceEditSession.$193n){isc.AceEditSession.$193n=ace.require("./edit_session").EditSession}
if(!this.session){var _1=(this.document?this.document.getAceObj():this.value);this.session=new isc.AceEditSession.$193n(_1,this.mode);this.session.scRef=this;this.pushInitialSettings()}},isc.A.getAceObj=function isc_AceEditSession_getAceObj(){return this.session},isc.A.pushInitialSettings=function isc_AceEditSession_pushInitialSettings(){for(var i=0;i<isc.AceEditSession.baseProperties.length;i++){var _2=isc.AceEditSession.baseProperties[i],_3=this[_2],_4="set"+_2.substring(0,1).toUpperCase()+_2.substring(1);if(_3!=null){if(isc.isA.Function(this[_4]))this[_4](_3);else this[_2]=_3}}},isc.A.getValue=function isc_AceEditSession_getValue(){return this.session.getValue()},isc.A.setUndoManager=function isc_AceEditSession_setUndoManager(_1){this.undoManager=_1;this.session.setUndoManager(_1.getAceObj())},isc.A.getUndoManager=function isc_AceEditSession_getUndoManager(){return this.undoManager||isc.AceUndoManager.create({undoManager:this.session.getUndoManager()})},isc.A.getDocument=function isc_AceEditSession_getDocument(){return this.document},isc.A.insert=function isc_AceEditSession_insert(_1,_2){this.session.insert(_1,_2)},isc.A.remove=function isc_AceEditSession_remove(_1){this.session.remove(_1.getAceObj())},isc.A.getLength=function isc_AceEditSession_getLength(){return this.session.getLength()},isc.A.getLine=function isc_AceEditSession_getLine(_1){return this.session.getLine(_1)},isc.A.getLines=function isc_AceEditSession_getLines(_1,_2){return this.session.getLines(_1,_2)},isc.A.addMarker=function isc_AceEditSession_addMarker(_1,_2,_3,_4){return this.session.addMarker(_1.getAceObj(),_2,_3,_4)},isc.A.addFloatingMarker=function isc_AceEditSession_addFloatingMarker(_1,_2,_3,_4){_1.setStart(this.getDocument().createAnchor(_1.getStart()));_1.setEnd(this.getDocument().createAnchor(_1.getEnd()));return this.session.addMarker(_1.getAceObj(),_2,_3,_4)},isc.A.removeMarker=function isc_AceEditSession_removeMarker(_1){this.session.removeMarker(_1)},isc.A.getMarker=function isc_AceEditSession_getMarker(_1){var _2=this.session.getMarkers(),_3=(_2?_2[_1]:null);return(_3?isc.AceMarker.create({marker:_3}):null)},isc.A.getMarkers=function isc_AceEditSession_getMarkers(_1){var _2=this.session.getMarkers(_1),_3=[];for(var _4 in _2){_3.push(isc.AceMarker.create({marker:_2[_4]}))}
return _3},isc.A.getTextRange=function isc_AceEditSession_getTextRange(_1){return this.session.getTextRange(_1.getAceObj())});isc.B._maxIndex=isc.C+18;isc.A=isc.AceEditSession.getPrototype();isc.B=isc._allFuncs;isc.C=isc.B._maxIndex;isc.D=isc._funcClasses;isc.D[isc.C]=isc.A.Class;isc.B.push(isc.A.setTabSize=function isc_AceEditSession_setTabSize(_1){this.tabSize=_1;this.session.setTabSize(_1)});isc.B._maxIndex=isc.C+1;isc.ClassFactory.defineClass("AceUndoManager");isc.A=isc.AceUndoManager.getPrototype();isc.B=isc._allFuncs;isc.C=isc.B._maxIndex;isc.D=isc._funcClasses;isc.D[isc.C]=isc.A.Class;isc.B.push(isc.A.init=function isc_AceUndoManager_init(){if(!isc.AceUndoManager.$193n){isc.AceUndoManager.$193n=ace.require("./undomanager").UndoManager}
this.undoManager=new isc.AceUndoManager.$193n();this.undoManager.scRef=this},isc.A.getAceObj=function isc_AceUndoManager_getAceObj(){return this.undoManager},isc.A.hasRedo=function isc_AceUndoManager_hasRedo(){return this.undoManager.hasRedo()},isc.A.hasUndo=function isc_AceUndoManager_hasUndo(){return this.undoManager.hasUndo()},isc.A.redo=function isc_AceUndoManager_redo(_1){return this.undoManager.redo(_1||false)},isc.A.undo=function isc_AceUndoManager_undo(_1){return this.undoManager.undo(_1||false)},isc.A.reset=function isc_AceUndoManager_reset(){return this.undoManager.reset()});isc.B._maxIndex=isc.C+7;isc.ClassFactory.defineClass("AceRange");isc.A=isc.AceRange.getPrototype();isc.B=isc._allFuncs;isc.C=isc.B._maxIndex;isc.D=isc._funcClasses;isc.D[isc.C]=isc.A.Class;isc.B.push(isc.A.init=function isc_AceRange_init(){if(!isc.AceRange.$193n){isc.AceRange.$193n=ace.require("./range").Range}
if(!this.range){var _1=this.start||{},_2=this.end||{};this.range=new isc.AceRange.$193n(_1.row||0,_1.column||0,_2.row||0,_2.column||0)}
this.range.scRef=this},isc.A.getAceObj=function isc_AceRange_getAceObj(){return this.range},isc.A.clone=function isc_AceRange_clone(){return isc.AceRange.create({range:this.range.clone()})},isc.A.compare=function isc_AceRange_compare(_1,_2){return this.range.compare(_1,_2)},isc.A.compare=function isc_AceRange_compare(_1,_2){return this.range.compare(_1,_2)},isc.A.comparePosition=function isc_AceRange_comparePosition(_1){return this.range.comparePoint(_1)},isc.A.comparePoint=function isc_AceRange_comparePoint(_1){return this.range.comparePoint(_1)},isc.A.compareRange=function isc_AceRange_compareRange(_1){return this.range.compareRange(_1.getAceObj())},isc.A.contains=function isc_AceRange_contains(_1,_2){return this.range.contains(_1,_2)},isc.A.containsRange=function isc_AceRange_containsRange(_1){return this.range.containsRange(_1.getAceObj())},isc.A.extend=function isc_AceRange_extend(_1,_2){var _3=this.range.extend(_1,_2);if(this.range===_3){return this}
return isc.AceRange.create({range:_3})},isc.A.fromPoints=function isc_AceRange_fromPoints(_1,_2){return isc.AceRange.create({range:this.range.fromPoints(_1,_2)})},isc.A.fromPosition=function isc_AceRange_fromPosition(_1,_2){return isc.AceRange.create({range:this.range.fromPoints(_1,_2)})},isc.A.inside=function isc_AceRange_inside(_1,_2){return this.range.inside(_1,_2)},isc.A.isEqual=function isc_AceRange_isEqual(_1){return this.range.isEqual(_1.getAceObj())},isc.A.isMultiLine=function isc_AceRange_isMultiLine(){return this.range.isMultiLine()},isc.A.toString=function isc_AceRange_toString(){return this.range.toString()});isc.B._maxIndex=isc.C+17;isc.A=isc.AceRange.getPrototype();isc.B=isc._allFuncs;isc.C=isc.B._maxIndex;isc.D=isc._funcClasses;isc.D[isc.C]=isc.A.Class;isc.B.push(isc.A.setStart=function isc_AceRange_setStart(_1){if(_1.$onChange){this.range.start=_1}else if(isc.isAn.AceAnchor(_1)){this.range.start=_1.getAceObj()}else{this.range.setStart(_1.row,_1.column)}},isc.A.getStart=function isc_AceRange_getStart(){return this.range.start},isc.A.setEnd=function isc_AceRange_setEnd(_1){if(_1.$onChange){this.range.end=_1}else if(isc.isAn.AceAnchor(_1)){this.range.end=_1.getAceObj()}else{this.range.setEnd(_1.row,_1.column)}},isc.A.getEnd=function isc_AceRange_getEnd(){return this.range.end});isc.B._maxIndex=isc.C+4;isc.ClassFactory.defineClass("AceAnchor");isc.A=isc.AceAnchor.getPrototype();isc.B=isc._allFuncs;isc.C=isc.B._maxIndex;isc.D=isc._funcClasses;isc.D[isc.C]=isc.A.Class;isc.B.push(isc.A.init=function isc_AceAnchor_init(){if(!isc.AceAnchor.$193n){isc.AceAnchor.$193n=ace.require("./anchor").Anchor}
if(!this.anchor){var _1=(this.document?this.document.getAceObj():null);this.anchor=new isc.AceAnchor.$193n(_1,this.row,this.column);this.anchor.scRef=this}},isc.A.getAceObj=function isc_AceAnchor_getAceObj(){return this.anchor},isc.A.getPosition=function isc_AceAnchor_getPosition(){return this.anchor.getPosition()},isc.A.setPosition=function isc_AceAnchor_setPosition(_1,_2,_3){return this.anchor.setPosition(_1,_2,_3)});isc.B._maxIndex=isc.C+4;isc.A=isc.AceAnchor.getPrototype();isc.B=isc._allFuncs;isc.C=isc.B._maxIndex;isc.D=isc._funcClasses;isc.D[isc.C]=isc.A.Class;isc.B.push(isc.A.getDocument=function isc_AceAnchor_getDocument(){return(this.anchor.document?this.anchor.document.scRef:null)},isc.A.getRow=function isc_AceAnchor_getRow(){return this.getPosition().row},isc.A.getColumn=function isc_AceAnchor_getColumn(){return this.getPosition().column});isc.B._maxIndex=isc.C+3;isc.ClassFactory.defineClass("AceMarker");isc.A=isc.AceMarker.getPrototype();isc.B=isc._allFuncs;isc.C=isc.B._maxIndex;isc.D=isc._funcClasses;isc.D[isc.C]=isc.A.Class;isc.B.push(isc.A.init=function isc_AceMarker_init(){this.marker=this.marker||{}},isc.A.getAceObj=function isc_AceMarker_getAceObj(){return this.marker});isc.B._maxIndex=isc.C+2;isc.A=isc.AceMarker.getPrototype();isc.B=isc._allFuncs;isc.C=isc.B._maxIndex;isc.D=isc._funcClasses;isc.D[isc.C]=isc.A.Class;isc.B.push(isc.A.getMarkerId=function isc_AceMarker_getMarkerId(){return(this.marker?this.marker.id:null)},isc.A.getRange=function isc_AceMarker_getRange(){if(!this.$102j&&this.marker&&this.marker.range){this.$102j=isc.AceRange.create({range:this.marker.range})}
return this.$102j},isc.A.getType=function isc_AceMarker_getType(){return(this.marker?this.marker.type:null)},isc.A.getStyle=function isc_AceMarker_getStyle(){return(this.marker?this.marker.clazz:null)},isc.A.getInFront=function isc_AceMarker_getInFront(){return(this.marker?this.marker.inFront:null)});isc.B._maxIndex=isc.C+5;isc._nonDebugModules=(isc._nonDebugModules!=null?isc._nonDebugModules:[]);isc._nonDebugModules.push('AceEditor');isc.checkForDebugAndNonDebugModules();isc._moduleEnd=isc._AceEditor_end=(isc.timestamp?isc.timestamp():new Date().getTime());if(isc.Log&&isc.Log.logIsInfoEnabled('loadTime'))isc.Log.logInfo('AceEditor module init time: '+(isc._moduleEnd-isc._moduleStart)+'ms','loadTime');delete isc.definingFramework;if(isc.Page)isc.Page.handleEvent(null,"moduleLoaded",{moduleName:'AceEditor',loadTime:(isc._moduleEnd-isc._moduleStart)});}else{if(window.isc&&isc.Log&&isc.Log.logWarn)isc.Log.logWarn("Duplicate load of module 'AceEditor'.");}
