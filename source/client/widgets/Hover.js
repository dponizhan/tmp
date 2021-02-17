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
//>	@class	Hover
// The Hover class handles showing a simple SmartClient canvas containing arbitrary HTML, or
// triggering some other action in response to a user holding the mouse-pointer (or hovering)
// over a specific widget.
//  @treeLocation Client Reference/Control
//  @visibility external
//<
 
// singleton that implements
//	-- hover timing
//	-- hover window display
//
// Hover.show() / Hover.hide() and some appearance management properties exposed to allow
// displaying / customizing content of hovers.
// Other Hover APIs exist at the widget level, enabling custom actions in response to hover 
// events.


isc.ClassFactory.defineClass("Hover");


isc.Hover.addClassProperties({
    // This delay is a default - may be overridden via the optional delay param passed to 
    // setAction()
    
	delay:500,
	//timer:null,
	
	//action:null,
	//actionArgs:null,
	//actionTarget:null,

	//isActive:false,
    
    //>@classAttr Hover.moveWithMouse (boolean : false : RWA)
    // When the Hover canvas is shown by default, should it move as the user moves the
    // mouse pointer?<br>
    // May be overridden by including a <code>moveWithMouse</code> attribute on the 
    // properties block passed to +link{Hover.show()}
    // @visibility external
    //<
	//moveWithMouse:false,
    
    //>@classAttr Hover.leftOffset (number : 15 : RW)
    // When positioning the hover canvas, this will be the default left offset from the 
    // mousepointer, if no explicit position was passed to the +link{Hover.show()} method
    // @visibility external
    //<
	leftOffset:15,

    //>@classAttr Hover.topOffset (number : 15 : RW)
    // When positioning the hover canvas, this will be the default top offset from the 
    // mousepointer, if no explicit position was passed to the +link{Hover.show()} method
    // @visibility external
    //<    
	topOffset:15,

    //>@classAttr Hover.edgeOffset (number : 5 : RW)
    // When positioning the hover canvas, this will be the minimum offset from page edge.
    // The hover is always positioned not to show outside the page but this offset keeps the
    // canvas from possibly being positioned adjoining the page edge.
    // @visibility external
    //<    
    edgeOffset:5,

	//>	@classAttr	canvas.hoverCanvas		(Canvas : null : RA)
	// Reference to the hoverCanvas currently visible.  Null if none.
	//<		   
    
    //hoverCanvas:null,

    //>	@classAttr	Hover.hoverCanvasDefaults   (Object: {...} : IRW)
    // Defaults to apply to the Hover canvas shown when the user hovers over some widget.
    // By default this property is set to this object:<br><pre>
    //       { defaultWidth:100, 
    //         defaultHeight:1,
    //         baseStyle:"canvasHover",
    //         align:"left",
    //         valign:"top",
    //         opacity:null
    //        }
    // </pre><br>
    // Note that these properties can be overridden by individual widgets showing hovers, by
    // modifying +link{canvas.hoverWidth}, +link{canvas.hoverHeight}, 
    // +link{canvas.hoverStyle}, +link{canvas.hoverAlign}, +link{canvas.hoverVAlign}, 
    // +link{canvas.hoverOpacity}, and +link{canvas.hoverWrap}.
    // @visibility external
    //<
    hoverCanvasDefaults:{
        defaultWidth:100,
        defaultHeight:1,
        
		baseStyle:"canvasHover",
        align:isc.Canvas.LEFT,
		valign:isc.Canvas.TOP,
        wrap:true,
        
        autoDraw:false,
        contributeToRuleContext:false
        
    },
    // FocusKeyHintLabel - this will contain text like "Press 'f2' to focus" if there's a focus
    // key
    showFocusKeyHint:true,
    showFocusKeyHintDelay:0,
    focusKeyHintMessage:'Pin Hover: Press <i>${focusKey}</i>',

    focusKeyHintLabelDefaults : {
        autoDraw:false,
        wrap:false,
        dynamicContents:true,
        margin:10,
        // We want to float at the bottom edge of the hover
        // However - if the hover pokes offscreen we actually want to keep this *onscreen*, so
        // we can't use simple snap positioning or rely on moveWithMaster etc
        _moveWithMaster:false,
        masterMoved : function () {
            isc.Hover.positionFocusKeyHintLabel();
        },
        masterResized : function () {
            isc.Hover.positionFocusKeyHintLabel();
        },
        width:80, height:30, overflow:"visible",
        styleName:"darkHover",
        snapTo:"T", snapEdge:"B", snapOffsetTop:6 // show along the center of the top edge of the hover
    }					
});


isc.Hover.addClassMethods({

//>	@classMethod Hover.show()
// Displays a standard Hover canvas containing the specified HTML content.<br>
// This method may also be called to modify the content of the hover if it is already showing.
// Call +link{Hover.hide()} to hide the canvas again.<br>
// A common use case for calling this method is to asynchronously fetch detail data from the
// server about some component, and display it in the Hover canvas when the data is returned.
// Note that in this case you will typically need to verify that the user is still hovering 
// over the component in question before calling Hover.show() - if the user has moved the mouse 
// off the component, the information will not apply to whatever is now under the mouse. 
// Suggested approaches for handling this are to either use a +link{Canvas.mouseOut()} handler
// to track when the user moves off the component, or checking +link{EventHandler.getTarget()}
// as part of the asynchronous callback
// <p>
// The default Hover canvas position will be based on the mouse pointer position, adjusted by
// +link{Hover.leftOffset} and +link{Hover.topOffset}. If this position would render the
// Hover canvas partially clipped, it will be automatically modified to ensure the Hover 
// is entirely visible.
// @param contents (HTMLString | Canvas) contents for the hover
// @param properties (Label Properties) object containing attributes for managing the hover canvas' 
//  appearance. Valid properties include:<ul>
//  <li>left, top, width, height
//  <li>baseStyle
//  <li>opacity
//  <li>wrap
// <smartclient>
//  <li>moveWithMouse [overrides +link{Hover.moveWithMouse}]
//  <li>autoFitWidth: If true, any specified width will be treated as a minimum and the
//      hover canvas will expand horizontally to fit the content string (without wrapping)
//      up to the specified autoFitMaxWidth. This setting differs from
//      simply setting +link{label.wrap,wrap:false} for the hover in that wrapping of
//      text will occur if the autoFitMaxWidth is exceeded.
//  <li>autoFitMaxWidth: Maximum width to expand to without wrapping (if autoFitWidth is true).
// </smartclient>
// </ul>
//    
// @visibility external
//<
// @param rect (object) boundary rectangle along which the hoverCanvas should be drawn; if
//     left and top are specified in properties, this parameter is ignored
// @param [targetCanvas] (Canvas) Passed in by canvas.showHover() - allows us to track which canvas
//     showed the hover and handle cases such as that canvas being destroyed etc. 
show : function (contents, properties, rect, targetCanvas) {

    // If a hover is currently showing, Hover.show() is the documented way to update the
    // content of the hoverCanvas with new content (and styling etc)
    // In this case, avoid repositioning the hover, or setting properties based on defaults
    // rather than properties explicitly passed in
    var updateInPlace = this.hoverCanvas && this.hoverCanvas.isDrawn() 
                                    && this.hoverCanvas.isVisible();

    // If we're passed a new canvas as the first arg, don't attempt to update in place.
    if (updateInPlace && 
        isc.isA.Canvas(contents) && contents == this.hoverCanvas)
    {
        updateInPlace = false;
    }
    // If we're explicitly passed a target canvas and it differs from the current targetCanvas
    // don't attempt to update in place
    if (updateInPlace && (targetCanvas != null) && (targetCanvas != this.lastHoverCanvas)) {
        updateInPlace = true;
    }

    if (this.canvasObserver == null) {
        // observe resizes so the canvas can be moved back on-screen if it has async content 
        // that changes it's size after draw - use a dummy instance because observe() isn't static
        this.canvasObserver = isc.Class.create({
            hoverCanvasResized : function () {
                var hc = isc.Hover.hoverCanvas,
                    left = hc.getLeft(), 
                    top = hc.getTop()
                ;

                // ensure hoverCanvas isn't clipped by the viewport
                var edgeOffset = isc.Hover.edgeOffset;

                // shrink the hc to fit in the screen, to prevent browser scrollbars - needed,
                // eg, for autoFitData grids
                var rect = hc.getPageRect();
                if (rect[3] > isc.Page.getHeight() - (edgeOffset*2)) {
                    // hc is taller than the screen, move it to top:0 and shrink it to fit
                    hc.setOverflow("hidden");
                    hc.setHeight(isc.Page.getHeight() - (edgeOffset*2));
                    top = 0;
                }
                if (rect[2] > isc.Page.getWidth() - (edgeOffset*2)) {
                    // hc is wider than the screen, move it to left:0 and shrink it to fit
                    hc.setOverflow("hidden");
                    hc.setWidth(isc.Page.getWidth() - (edgeOffset*2));
                    left = 0;
                }

                hc.placeNear(left, top, edgeOffset);

                // move occluding hoverCanvas as appropriate
                if (isc.Hover._canMoveOccludingHover()) {
                    isc.Hover._moveOccludingHover(left, top);
                }
            }
        });
    }
    if (!updateInPlace && this.hoverCanvas && this.canvasObserver.isObserving(this.hoverCanvas, "resized")) 
    {
        this.canvasObserver.ignore(this.hoverCanvas, "resized");
    }

    if (isc.isA.Canvas(contents) && !updateInPlace) {
        // we've been passed a Canvas as content for the hover - this will now become the 
        // hoverCanvas, rather than being the content for a newly created hoverCanvas
        this.showingHoverComponent = true;
        this.hoverCanvas = contents;
        this.hoverCanvas.hide = function () {
            this.Super("hide", arguments);
            isc.Hover.hoverCanvasHidden();
        };
        if (targetCanvas != null) {
            targetCanvas.hoverCanvas = contents;
        }
    }

    // position and show hoverCanvas with contents & properties
	if (!this.hoverCanvas) this._makeHoverCanvas();
	
    var hoverCanvas = this.hoverCanvas;
    
    delete this.hoverContext;

    if (isc.Hover.suppressNextShow) {
        
        delete isc.Hover.suppressNextShow;
        hoverCanvas.logInfo("Blocking server-request issued while showing this widget as a " +
            "hover-component - hiding hover.", "Hover");
        // set hoverCanvas on the target and lastHoverCanvas on Hover, so that hiding properly
        // destroys the hoverCanvas - see code in Canvas._hoverHidden()
        targetCanvas.hoverCanvas = hoverCanvas;
        this.lastHoverCanvas = targetCanvas;
        isc.Hover.hide();
        return;
    }

	// check parameters
	if (contents == null || contents == "" || contents == isc.nbsp) {
        hoverCanvas.hide();
		return;
	}

    // remember which target showed the canvas
    // (Cleared on hoverCanvas.hide())
    if (!updateInPlace) this.lastHoverCanvas = targetCanvas;

    // set the hover to display the new contents
    if (!this.showingHoverComponent) hoverCanvas.setContents(contents);

    if (properties == null) properties = {};

    // Hide on mouseDown (or, if focused, hide on mouseDown outside the hover canvas) by default
    
    var hideOnMouseDown = properties.hideOnMouseDown;
    if (hideOnMouseDown == null && !updateInPlace) {
        hideOnMouseDown = true;
    }
    if (hideOnMouseDown != null) {
        this._hideOnMouseDown = hideOnMouseDown;
    }
    if (!this._hideOnMouseDownEvent) {
            
        this._hideOnMouseDownEvent = isc.Page.setEvent(
            "mouseDown", 
            this,
            null,
            "hideHoverOnMouseDown"
        );
    }
        
    // If a focusKey was specified, set up an event to listen for it, and
    // on keypress, give the hover "focus", so it stays up and the user can interact with it
    var focusKey = properties.focusKey;
    if (!updateInPlace) {
        if (focusKey != null) {
            this._focusKey = focusKey;
            if (!this._focusOnKeyEvent) {
                this._focusOnKeyEvent = isc.Page.setEvent(
                    "keyPress", 
                    this,
                    null,
                    "focusOnKeyHandler"
                );
            }
            if (this.showFocusKeyHint) {
                if (this.showFocusKeyHintDelay) {
                    this._focusHintTimer = this.delayCall(
                            "showFocusKeyHintLabel", [focusKey], this.showFocusKeyHintDelay);
                } else {
                    this.showFocusKeyHintLabel(focusKey);
                }
            }
        }
    }

    // Apply the properties to the hoverCanvas (except for positioning props)
    
    var defaults = this.hoverCanvasDefaults;
    
    var align = properties.align;
    if (!updateInPlace && align == null) align = defaults.align;
    if (align != null && hoverCanvas.isA("Button") && hoverCanvas.setAlign) hoverCanvas.setAlign(align);

    var valign = properties.valign;
    if (!updateInPlace && valign == null) valign = defaults.valign;
    if (valign != null && hoverCanvas.isA("Button") && hoverCanvas.setVAlign) hoverCanvas.setVAlign(valign);

    var baseStyle = properties.baseStyle;
    if (!updateInPlace && baseStyle == null) baseStyle = defaults.baseStyle;
    if (baseStyle && hoverCanvas.setBaseStyle) hoverCanvas.setBaseStyle(baseStyle);

    var opacity = properties.opacity;
    if (!updateInPlace && opacity == null) opacity = defaults.opacity;
    if (opacity != null && hoverCanvas.setOpacity) hoverCanvas.setOpacity(opacity);

    var wrap = properties.wrap;
    if (wrap == null) wrap = defaults.wrap;
    if (hoverCanvas.setWrap) hoverCanvas.setWrap(wrap);

    // Should we move the hover canvas around with the mouse
    if (properties.moveWithMouse != null) this._shouldMoveWithMouse = properties.moveWithMouse
    else if (!updateInPlace) this._shouldMoveWithMouse = this.moveWithMouse;
    
	// set properties of new hoverCanvas.
	// placement: by default, offset from mouse (no occlusion by mouse), and on-screen (if
    //            possible).  Can be modified by the caller with attributes of the properties
    //            parameter.
	// note that all properties set here (aside from left/top) must be set back to defaults in
    // Hover.hide()
	var lastX = isc.EH.getX(),
        lastY = isc.EH.getY(),
        left = properties.left,
        top = properties.top,
        // NOTE: boolean check OK because width and height can't validly be zero
        width = properties.width,
        height = properties.height;

    if (!updateInPlace) {
        if (width == null) width = this.showingHoverComponent ? hoverCanvas.width : defaults.defaultWidth;
        if (height == null) height = this.showingHoverComponent ? hoverCanvas.height : defaults.defaultHeight;
    }
    // apply content autofitting
	if (properties.autoFitWidth) {
	    // warn if autoFitWidth+wrap:false are set. It's not invalid but it is 
	    // weird and quite possible a dev has misunderstood the settings.
	    if (properties.wrap == false) {
            this.logWarn("Hover.show(): autoFitWidth:true specified in conjunction with " +
                "wrap:false.  These settings are usually not intended to be used in " + 
                "conjunction - hovers with autoFitWidth enabled, and wrapping enabled will " +
                "allow content to wrap if the unwrapped content would exceed autoFitMaxWidth.",
                "Hover");
        }
        var wrapWidth = this._getAutoFitWidth(properties, hoverCanvas, contents);
        
        wrapWidth += 1;
	    if (wrapWidth > width) {
	        this.logDebug("Hover shown with autoFitWidth enabled. Hover will expand " +
	                      "from specified width:" + width + " to content width:" + wrapWidth);
            width = wrapWidth;
        }
    }

    // If either left or top is specified in the arguments to Hover.show(), respect them and don't
    // use Canvas._placeRect to adjust the position of the hover
    if (left != null || top != null) {
        // default left and top if they weren't specified in the properties argument
        left = left ? left : lastX + this.leftOffset;
        top = top ? top : lastY + this.topOffset;
    } else if (!updateInPlace) {
        
        //this.logWarn("sizing hover to: " + [width, height]);
        hoverCanvas.setRect(null, -9999, width, height);
        if (!hoverCanvas.isDrawn()) hoverCanvas.draw();
        // Has to be visible as when we hide a shadow we shift it so it sits UNDER the widget.
        if (!hoverCanvas.isVisible()) hoverCanvas.show();
        else hoverCanvas.redrawIfDirty("placing hover");
        // Use '_placeRect' to position the hover next to a boundary rectangle with the mouse 
        // pointer as its center, a width of 2 * this.leftOffset and a height of 2* 
        // this.topOffset
        var avoidRect = rect ? rect : [lastX - this.leftOffset, lastY - this.topOffset,
                                       2 * this.leftOffset, 2 * this.topOffset];
        // call getPeerRect() to take into account dropShadow.  NOTE: technically if the hover
        // had peers to the left/top expanding the peer rect, we would need to place the hover
        // itself to the right/bottom of the position returned by placeRect()
        var hoverRect = hoverCanvas.getPeerRect();
        var pos = isc.Canvas._placeRect(hoverRect[2], hoverRect[3], avoidRect, 
            "bottom", false, "outside-right", isc.Hover.edgeOffset
        );
        left = pos[0];
        top = pos[1];

        
        this.hoverContext = {avoidRect: avoidRect};
    }
    
    // If updateInPlace is true, respect left/top/width/height iff passed
    if (left != null || top != null || width != null || height != null) {
        hoverCanvas.setRect(left, top, width, height);
    }

    hoverCanvas.bringToFront();
    if (this.focusKeyHintLabel) this.focusKeyHintLabel.moveAbove(hoverCanvas);
	
	// show the hoverCanvas
	if (!hoverCanvas.isDrawn() || !hoverCanvas.isVisible()) hoverCanvas.show();

    // set a page-level mouseMove handler to move the hoverCanvas
	if (this._shouldMoveWithMouse && !this._mouseMoveHandler) {
		this._mouseMoveHandler = 
            isc.Page.setEvent("mouseMove", function () { isc.Hover._moveWithMouse() });
	}
    
    // observe resized on the hoverCanvas, so it can be moved back on-screen
    if (!updateInPlace) {
        this.canvasObserver.observe(
            this.hoverCanvas, "resized", "observer.hoverCanvasResized()"
        );
    }

},

// Animate a label saying "Press 'f2' to focus" into view above the hover

createFocusKeyHintLabel : function () {
    this.focusKeyHintLabel = isc.Label.create(
            this.focusKeyHintLabelDefaults, this.focusKeyHintLabelProperties);
},
showFocusKeyHintLabel : function (focusKey) {
    delete this._focusHintTimer;
    if (!this.focusKeyHintLabel) {
        this.createFocusKeyHintLabel("focusKeyHintLabel");
    }

    if (this.hoverCanvas.isDirty()) this.hoverCanvas.redraw();

    // Already have focus - no need to show the hint
    if (this._hoverHasFocus) return;

    // Ensure the correct title shows
    var label = this.focusKeyHintLabel;
    
    if (isc.Browser.isMac &&
        (focusKey.length == 2 || focusKey.length == 3) && focusKey.startsWith("f")) 
    {
        focusKey = "fn-" + focusKey;
    }
    label.dynamicContentsVars = {focusKey:focusKey};
    label.setContents(this.focusKeyHintMessage);
    if (!label.isDrawn()) {

        this.hoverCanvas.addPeer(label);
        this.positionFocusKeyHintLabel();
    }
    label.moveAbove(this.hoverCanvas);
},
// Fired from masterMoved/masterResized
positionFocusKeyHintLabel : function () {
    var label = this.focusKeyHintLabel;

    
    var left = (this.hoverCanvas.getRight() - label.getVisibleWidth()),
        top = (this.hoverCanvas.getBottom() - label.getVisibleHeight());

    top = Math.min(top, isc.Page.getHeight()-label.getVisibleHeight());
    label.moveTo(left,top);

},
hideFocusKeyHintLabel : function () {
    if (this._focusHintTimer) {
        isc.Timer.clear(this._focusHintTimer);
        delete this._focusHintTimer;
    }

    if (!this.focusKeyHintLabel) return;
    this.focusKeyHintLabel.clear();
    this.focusKeyHintLabel.depeer();
},


//>@classAttr Hover.moveOccludingResize (Boolean : true : IRWA)
// Whether a hover that is auto-resized due to data arriving, etc., should be moved if it
// occludes the mouse pointer.  This will only be done if we can avoid shifting the hover to the
// other side of the mouse pointer, to avoid jarring hover movement.
// <P>
// Note that a hover that is clipped by the viewport after an auto-resize will always get moved
// back into the viewport if space is available, regardless of this setting.
// @see leftOffset
// @see topOffset
//<
moveOccludingResize: true,

// whether we should try to move an occluding hover; look at hoverCanvas and isc.Hover settings
_canMoveOccludingHover : function () {
    if (this.moveOccludingResize == false || !this.hoverCanvas) return this.moveOccludingResize;
    // respect moveOccludingResize: true/false on hoverCanvas
    var moveOccludingResize = this.hoverCanvas.moveOccludingResize;
    return moveOccludingResize != null ? moveOccludingResize : this.moveOccludingResize;
},

// try to move hoverCanvas if it's occluding the avoidRect
_moveOccludingHover : function (originalLeft, originalTop) {
    if (!this.hoverContext) return;

    var context = this.hoverContext,
        avoidRect = context.avoidRect,
        hoverCanvas = this.hoverCanvas
    ;
    // hoverCanvas has been resized and possibly moved
    var hoverRect = hoverCanvas.getPeerRect(),
        hoverLeft   = hoverRect[0],
        hoverTop    = hoverRect[1],
        hoverWidth  = hoverRect[2],
        hoverHeight = hoverRect[3]
    ;

    // if the avoidRect hasn't been breached, then just bail out as there's nothing to do
    if (avoidRect[0] >= hoverLeft + hoverWidth  || avoidRect[0] + avoidRect[2] <= hoverLeft ||
        avoidRect[1] >= hoverTop  + hoverHeight || avoidRect[1] + avoidRect[3] <= hoverTop)
    {
        return;
    }

    // rerun _placeRect() to find the new non-occluding location for the hoverCanvas
    var pos = isc.Canvas._placeRect(hoverWidth, hoverHeight, avoidRect, "bottom", false,
                                    "outside-right", this.edgeOffset);

    
    if ((pos[0] != null && (originalLeft >  avoidRect[0] && pos[0] <= avoidRect[0] ||
                            originalLeft <= avoidRect[0] && pos[0] >  avoidRect[0])) ||
        (pos[1] != null && (originalTop >  avoidRect[1] && pos[1] <= avoidRect[1] ||
                            originalTop <= avoidRect[1] && pos[1] >  avoidRect[1])))
    {
        if (!this.alwaysMoveOccluding) return;
    }

    if (pos[0] != null || pos[1] != null) {
        hoverCanvas.setPageRect(pos[0], pos[1]);
        if (this.logIsInfoEnabled()) {
            this.logInfo("hoverCanvas has been moved to " + pos + " from " +
                         [hoverLeft, hoverTop] + " to avoid rect " + avoidRect, "Hover");
        }
    }
},

focusOnKeyHandler : function () {
    var key = isc.EH.getKeyName();
    if (key == this._focusKey && !this._hoverHasFocus) {
        // This flag is checked by EventHandler logic that would normally hide
        // the hover as the user rolls off the hover target.
        this._hoverHasFocus = true;

        // set overflow to "auto" so the user can scroll to get at contents if it would otherwise
        // poke offscreen
        var hc = this.hoverCanvas;
        if (hc) {
            var desiredWidth = Math.min(hc.getVisibleWidth(), (isc.Page.getWidth() - hc.getPageLeft())),
                desiredHeight = Math.min(hc.getVisibleHeight(), (isc.Page.getHeight() - hc.getPageTop()));
            this._originalHoverDetails = [hc.getWidth(),hc.getHeight(),hc.overflow];
            this.hoverCanvas.setWidth(desiredWidth);
            this.hoverCanvas.setHeight(desiredHeight);
            this.hoverCanvas.setOverflow("auto");
            
        }

        // (Stop listening for this key)
        isc.Page.clearEvent("keyPress", this._focusOnKeyEvent);
        delete this._focusOnKeyEvent;
        delete this._focusKey;

        // if we're showing the focusKeyHintLabel, hide it now...
        this.hideFocusKeyHintLabel();

    }
},

_getAutoFitWidth : function (configProps, canvas, contents) {
    var contentString = contents,
        baseStyle = canvas.baseStyle
    ;

    
    if (isc.Button && isc.isA.Button(canvas)) {
        contentString = canvas._getSizeTestHTML(contents, false);
        baseStyle = null;
    }
    var wrapWidth = isc.Canvas.measureContent(contentString, baseStyle, false, true);

    var autoFitMaxWidth = configProps.autoFitMaxWidth;
	if (autoFitMaxWidth != null) {
	    var maxWidth = autoFitMaxWidth;
	    if (isc.isA.String(maxWidth)) {
	        if (maxWidth.endsWith("%")) {
	            var percentWidth = parseInt(maxWidth);
	            maxWidth = Math.round(isc.Page.getWidth() * (percentWidth / 100));
	        } else {
	            maxWidth = parseInt(maxWidth);
	            if (isNaN(maxWidth)) {
	                maxWidth = wrapWidth;
	            }
	        }
	    }
	    wrapWidth = Math.min(wrapWidth, maxWidth);
	}
    return wrapWidth;
},

hideHoverOnMouseDown : function () {
    
    // If the mouse went down inside a focused hover-canvas, allow it to stay up
    // User may be scrolling, clicking on a link in hover text, etc.
    if (this._hoverHasFocus && this.hoverCanvas.containsEvent()) {
        return;
    }
    // If hideOnMouseDown was explicitly set to false when the hover was shown, just bail
    if (!this._hideOnMouseDown) {
        return;
    }

    // Hiding will also clear the mouseDown event
    this.hide();
},

// notification fired from the hover canvas on hide
hoverCanvasHidden : function () {
    var lhc = this.lastHoverCanvas;
    delete this.lastHoverCanvas;
    
    if (lhc != null) {
        // call an internal method so we can auto-destroy hover components with 
        // hoverAutoDestroy: true before calling the generic notification method
        lhc._hoverHidden();
    }
    if (this._hideOnMouseDownEvent) {
        isc.Page.clearEvent("mouseDown", this._hideOnMouseDownEvent);
        delete this._hideOnMouseDownEvent;
    }
    if (this._focusOnKeyEvent != null) {
        isc.Page.clearEvent("keyPress", this._focusOnKeyEvent);
        delete this._focusOnKeyEvent;
    }
    if (this._hoverHasFocus) {
        delete this._hoverHasFocus;
        // Reset the temp size/overflow we applied if approriate
        if (this.hoverCanvas && this._originalHoverDetails && !this.hoverCanvas.destroyed) {
            this.hoverCanvas.resizeTo(this._originalHoverDetails[0], this._originalHoverDetails[1]);
            this.hoverCanvas.setOverflow(this._originalHoverDetails[2]);
            delete this._originalHoverDetails;
        }
    }
    // If we're showing the hint label, drop it
    if (this.focusKeyHintLabel) {
        this.hideFocusKeyHintLabel()
    }

},


//> @classMethod Hover.hide()
// Hide hover hover Canvas shown via +link{Hover.show()}
// @visibility external
//<
hide : function () {
	var hoverCanvas = isc.Hover.hoverCanvas;
	if (hoverCanvas != null) {
        if (this.canvasObserver.isObserving(hoverCanvas, "resized")) {
            // scrap the resized observation that keeps custom canvases on-screen
            this.canvasObserver.ignore(hoverCanvas, "resized");
        }

		// clear the page-level mouseMove handler that moves the hoverCanvas
		if (this._mouseMoveHandler) {
			isc.Page.clearEvent("mouseMove", this._mouseMoveHandler);
            delete this._mouseMoveHandler;
		}

		// hide the hoverCanvas - if the canvas was flagged with hoverAutoDestroy: true, it
        // is destroyed by the owning canvas at this point
		hoverCanvas.hide();

        if (this.showingHoverComponent) {
            if (!hoverCanvas) return;
            delete this.hoverCanvas;
            this.showingHoverComponent = false;
        } else {

            // move the hover offscreen to prevent page-level scrollbars if the hover extends out
            // of the page.
            var defaults = this.hoverCanvasDefaults;
            hoverCanvas.setRect(0, -1000);
        }
	}
},


_makeHoverCanvas : function () {
    
    var defaults = isc.addProperties({
        hide : function () {
            this.Super("hide", arguments);
            isc.Hover.hoverCanvasHidden();
        }
    }, this.hoverCanvasDefaults);

    this.hoverCanvas = isc.Label.create(defaults);

},

_moveWithMouse : function () {
    
    if (this._hoverHasFocus) return;
    
    // call getPeerRect to take into account dropShadow
    var hoverRect = this.hoverCanvas.getPeerRect();
    var pos = isc.Canvas._placeRect(
        hoverRect[2], hoverRect[3],
        this.getMousePointerRect(), "bottom", false, "outside-right"
    );
    this.hoverCanvas.moveTo(pos[0], pos[1]);
},

// Return a rectangle suitable for use as the bounding rectangle along which the hover should
// be drawn.
//
// Center point of the rectangle is the pointer location, and it extends in each direction a
// length equal to the offset along the axis (so the height = 2 * topOffset, 
// width = 2 * leftOffset)
getMousePointerRect : function () {
    return [
        isc.EH.getX() - this.leftOffset,
        isc.EH.getY() - this.topOffset,
        2 * this.leftOffset,
        2 * this.topOffset
    ];
},

//>	@classMethod Hover.setAction()
//		sets the action to be executed by the hover window
//
//		@param target (Object) object to which action belongs (defaults to Hover).
//		@param action (Method) action to be executed when timer has elapsed.
//		@param actionArgs (Array) arguments for action method.
//      @param [delay] (number) optional ms delay to apply to the hover action
//<
setAction : function (target, action, actionArgs, delay) {
    if (delay == null) delay = this.delay;
    // if already active or no delay, apply action immediately
	if (this.isActive || delay == 0) {
        // see note below about IE JS errors with empty args
		action.apply((target ? target : this), actionArgs ? actionArgs : []);
		this.isActive = true;
	}
	// otherwise set up a delayed action
	else {
		if (this.timer != null) this.timer = isc.Timer.clear(this.timer);
		this.actionTarget = (target ? target : this);	
		this.action = action;
        
		this.actionArgs = actionArgs ? actionArgs : [];
		// maybe check actionTime in _doAction()
		// this.actionTime = timeStamp() + this.delay;
		this.timer = isc.Timer.setTimeout({target:isc.Hover, methodName:"_doAction"}, delay);
	}
},


_doAction : function () {
	if (this.action && !this.actionTarget.destroyed) {
        this.action.apply(this.actionTarget, this.actionArgs);
    }
    this.actionTarget = this.action = this.actionArgs = null;
	this.isActive = true;
},

//> @classMethod Hover.clear()
// If the hover canvas is currently showing, hides it via +link{Hover.hide()}
// If a hover action was set up via +link{Hover.setAction()}, clear this pending action now.
//<
clear : function () {
    if (!this.hoverCanvas || !this.hoverCanvas.isVisible()) return;
    this.hide();
	if (this.timer != null) this.timer = isc.Timer.clear(this.timer);
	this.actionTarget = this.action = this.actionArgs = null;
	this.isActive = false;
},

//> @classMethod Hover.showForTargetMouseOver()
// The user has rolled onto something that would normally show a hover
// Show a hover unless the user has given focus to a hover that's already up
// in which case we want to leave it up
//<
showForTargetMouseOver : function (contents, properties, rect, targetCanvas) {
    if (!this._hoverHasFocus) {
        this.show(contents, properties, rect, targetCanvas);
    }
},

//> @classMethod Hover.clearForTargetMouseOut()
// The user has rolled off whatever launched this hover.
// This will hide the hover unless it has focus
//<
clearForTargetMouseOut : function () {
    if (this._hoverHasFocus) {
        if (this.timer != null) this.timer = isc.Timer.clear(this.timer);
    } else {
        this.clear();
    }

}


});
