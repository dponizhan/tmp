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
//> @class ClickStream
// A <code>ClickStream</code> captures event details as JavaScript objects as they are handled
// by the +link{EventHandler}.  The event target +link{canvas,canvas} ID and
// +link{class.getClassName(),class name} as well the +link{AutoTestLocator,locator} are
// included, as available.  Event-specific data (for example, the +link{KeyName} for keyboard
// events) are also included where appropriate.  See +link{CSEvent} for more information.
// <P>
// You can configure the stream to capture most DOM event types and other useful events,
// such as +link{group:relogin,relogins} and JavaScript errors that are triggered by events:
// <table border="1"><thead><tr><th>Event Category</th><th>Includes (source DOM
// <span style="font-family:courier">eventType(s)</span> or description)</th>
// <th>Controlling Attribute</th><th>From DOM Event?</tr><thead><tbody>
// <tr><td>click events</td><td><code>mouseDown</code>, <code>mouseUp</code>,
// <code>click</code>, <code>dblClick</code></td><td>+link{clickStream.captureClickEvents,
// captureClickEvents}</td><td>Y</td></tr>
// <tr><td>move events</td><td><code>mouseMove</code>, <code>mouseOut</code>
// </td><td>+link{clickStream.captureMoveEvents,captureMoveEvents}</td><td>Y</td></tr>
// <tr><td>key events</td><td><code>keyDown</code>, <code>keyPress</code>,
// <code>keyUp</code></td><td>+link{clickStream.captureKeyEvents,captureKeyEvents}</td>
// <td>Y</td></tr>
// <tr><td>drag events</td><td><code>dragStart</code>, <code>dragMove</code>,
// <code>dragStop</code></td><td>+link{clickStream.captureDragEvents,captureDragEvents}</td>
// <td>Y</td></tr>
// <tr><td>context menu events</td><td><code>contextMenu</code></td><td>
// +link{clickStream.captureMenuEvents,captureMenuEvents}</td><td>Y</td></tr>
// <tr><td>mouse wheel events</td><td><code>mouseWheel</code></td><td>
// +link{clickStream.captureWheelEvents,captureWheelEvents}</td><td>Y</td></tr>
// <tr><td>page events</td><td><code>load</code>, <code>unload</code>, <code>resize</code></td>
// <td>+link{clickStream.capturePageEvents,capturePageEvents}</td><td>Y</td></tr>
// <tr><td>login events</td><td>Successful +link{group:relogin,relogin} via the
// +link{RPCManager}</td><td>+link{clickStream.captureLoginEvents,captureLoginEvents}</td>
// <td>N</td></tr>
// <tr><td>+link{group:visualBuilder,VisualBuilder} file events</td>
// <td>Project and screen (auto)saves and loads</td><td>+link{clickStream.captureDSFileEvents,
// captureDSFileEvents}</td><td>N</td></tr>
// <tr><td>event errors</td><td>JavaScript exceptions</td><td>
// +link{clickStream.captureEventErrors,captureEventErrors}</td><td>N</td></tr>
// </tbody></table>
// (Pointer and touch equivalents to mouse events have not been listed above.  See the
// associated attribute for a more inclusive list.)
// <P>
// Note that several types of DOM events can be collapsed so that one event is reported instead
// of many if they occur over the same target.  You can enable collapsing for
// +link{clickStream.collapseMoveEvents,move and drag events},
// +link{clickStream.collapseKeyEvents,key events},
// +link{clickStream.collapseWheelEvents,wheel events}, and
// +link{clickStream.collapsePageEvents,page events}.  A +link{clickStream.maxSize,
// stream capture limit} is also supported via circular buffering, so that only the most recent
// events are preserved.  All available events can be returned as an array of +link{CSEvent} via
// +link{clickStream.getEvents(),getEvents()}.
// <P>
// A <code>ClickStream</code> will start capturing events as soon as it's created by default,
// but if you set +link{clickStream.autoStart,autoStart}: false, you can start capturing
// manually by calling +link{clickStream.start(),start()}.  Calling +link{clickStream.end(),
// end()} will end capturing and return the +link{ClickStreamData}.
// @see EventHandler
// @see RPCManager
// @see group:visualBuilder
// @visibility tools
//<

isc.ClassFactory.defineClass("ClickStream").addClassProperties({

    // constants for event filters
    _$click: "captureClickEvents",
    _$move:  "captureMoveEvents",
    _$key:   "captureKeyEvents",
    _$drag:  "captureDragEvents",
    _$menu:  "captureMenuEvents",
    _$wheel: "captureWheelEvents",
    _$page:  "capturePageEvents",
    _$login: "captureLoginEvents",
    _$file:  "captureDSFileEvents",
    _$error: "captureEventErrors",

    
    RELOGIN: "relogin",
    FILE_LOAD: "fileLoad",
    FILE_SAVE: "fileSave",

    //> @classMethod ClickStream.getCommonFrameworkStream()
    // Returns the shared ClickStream used internally by the Framework and controlled by the
    // Developer Console.  When using +link{reifyForDevelopers,Reify}, this stream is created
    // automatically when the app is loaded, to assist in debugging.
    // @return (ClickStream)
    //<
    getCommonFrameworkStream : function (a, b, c, d) {
        if (!this._stream) this._stream = this.create(a, b, c, d);
        return this._stream;
    },


    ////////////////////////////////////////////////////////////////////////////////
    //  APIs to support cross-window DMI from ClickStreamViewer (Developer Console)

    //> @classMethod ClickStream.getCommonStreamCapture()
    // Returns whether the shared ClickStream used internally by the Framework and controlled by
    // the Developer Console is currently capturing events.
    // @return (boolean)
    //<
    getCommonStreamCapture : function () {
        return !!(this._stream && this._stream.capturing);
    },

    //> @classMethod ClickStream.setCommonStreamCapture()
    // Starts or stops event capturing by the shared ClickStream if needed to match the desired
    // capture state.
    // @param capture (boolean)
    // @see getCommonStreamCapture()
    //<
    setCommonStreamCapture : function (capture) {
        // if we're already in the desired state, bail out
        if (capture == this.getCommonStreamCapture()) return;

        // otherwise, start or stop capturing as needed
        var common = this.getCommonFrameworkStream();
        if (capture) common.start();
        else         common.end();
    },

    //> @classMethod ClickStream.getAvailableStreams()
    // Returns the streams available to the ClickStream module, including:<ul>
    // <li>all stream instances currently capturing events
    // <li>the common Framework stream, if it exists, whether currently capturing or not</ul>
    // @return (Array of ClickStream)
    //<
    getAvailableStreams : function () {
        var streams = this.streams ? this.streams.duplicate() : [];
        // include common Framework stream even if it's not capturing events
        if (this._stream && !this._stream.capturing) streams.add(this._stream);
        return streams;
    },

    //> @classMethod ClickStream.getStreamValueMap()
    // Returns value map of epoch millis -> stream summary for available streams.
    // @return (Map)
    //<
    getStreamValueMap : function () {
        var streams = isc.ClickStream.getAvailableStreams();

        var valueMap = {};
        for (var i = 0; i < streams.length; i++) {
            var startTime = streams[i].startTime;
            if (!startTime) continue;

            valueMap[startTime.getTime()] = startTime.toNormalDate() +
                " (" + streams[i].nEvents + " events)";
        }
        return valueMap;
    },

    //> @classMethod ClickStream.getClickStreamData()
    // Returns a +link{ClickStream} as +link{ClickStreamData}.
    // @param date (Date) +link{startTime} of the stream whose data you want
    // @return (ClickStreamData) representation of stream as a JavaScriptObject
    //<
    getClickStreamData : function (date) {
        var streams = isc.ClickStream.getAvailableStreams();
        if (streams) for (var i = 0; i < streams.length; i++) {
            if (+date != +streams[i].startTime) continue;
            return streams[i].toClickStreamData();
        }
    },


    ////////////////////////////////////////////////////////////////////////////////
    // Dedicated, per-eventType APIs for EventHandler

    

    // mouseDown, mouseUp, click, dblClick,
    // pointerDown, pointerUp, pointerCancel,
    // touchStart, touchEnd, touchCancel
    addClickEvent : function (event, eventType, synthetic) {
        this._addEvent(event, this._$click, eventType, synthetic);
    },

    // mouseMove, mouseOut
    addMoveEvent : function (event, eventType, synthetic) {
        this._addEvent(event, this._$move, eventType, synthetic);
    },

    _modifierKeys: {
        "Ctrl": true,
        "Shift": true,
        "Alt": true,
        "Meta": true
    },

    // keyDown, keyPress, keyUp
    addKeyEvent : function (event, eventType) {
        
        var keyName = event.keyName;
        
        if (!keyName) return;

        // capture keyPress for non-modifiers, keyDown/keyUp for modifiers
        if ((keyName.length == 1 || !this._modifierKeys[keyName]) ==
            ((eventType || event.eventType) == isc.EH.KEY_PRESS))
        {
            this._addEvent(event, this._$key, eventType);
        }
    },

    // dragStart, dragRepositionStart, dragResizeStart, dragSelectStart
    // dragMove, dragRepositionMove, dragResizeMove, dragSelectMove
    // dragStop, dragRepositionStop, dragResizeStop, dragSelectStop
    // dropOver, dragLeave, drop
    addDragEvent : function (event, eventType, synthetic) {
        this._addEvent(event, this._$drag, eventType, synthetic);
    },

    // contextMenu
    addMenuEvent : function (event, eventType, synthetic) {
        this._addEvent(event, this._$menu, eventType, synthetic);
    },

    // mouseWheel
    addWheelEvent : function (event) {
        this._addEvent(event, this._$wheel);
    },

    // load, unload, resize
    addPageEvent : function (event, eventType) {
        this._addEvent(event, this._$page, eventType);
    },


    ////////////////////////////////////////////////////////////////////////////////
    // Build an EventHandler event from a DOM event without touching EH.lastEvent

    getEventProperties : function (DOMevent, isKeyEvent) {
        var EH = isc.EH,
            lastEvent = this.lastEvent;
        if (!lastEvent) this.lastEvent = lastEvent = {};
        if (isKeyEvent) EH.getKeyEventProperties(DOMevent, lastEvent);
        else          EH.getMouseEventProperties(DOMevent, lastEvent);

        
        if (!lastEvent.eventType && DOMevent.type) lastEvent.eventType = DOMevent.type;

        return lastEvent;
    },


    ////////////////////////////////////////////////////////////////////////////////
    // APIs to capture certain non-DOM events ordered with events from EventHandler

    

    addLoginEvent : function (transaction, eventType) {
        this._addEvent({
            eventType: eventType,
            URL: transaction && transaction.URL || isc.RPCManager.actionURL
        }, this._$login);
    },

    
    addDSFileEvent : function (dataSource, dsResponse, eventType) {
        var event = {
            eventType: eventType,
            dataSource: dataSource.ID,
            status: dsResponse.status
        };

        var CS = isc.ClickStream,
            data = dsResponse.data ? dsResponse.data[0] : null;
        if (data) {
            var versionField = dataSource.fileVersionField || "fileLastModified",
                fileVersion = data[versionField],
                context = dsResponse.context
            ;

            event.fileName = data.fileName;
            event.fileVersion = fileVersion;
            event.fileType = data.fileType == "proj" ? "project" : "screen";

            // capture whether a save was an autosave
            if (eventType == CS.FILE_SAVE) {
                var fileSpec = context.data ? context.data.values : null,
                    autoSaved = fileSpec ? fileSpec.fileAutoSaved : null;
                if (autoSaved != null) event.autoSaved = autoSaved;
            }
        }

        this._addEvent(event, this._$file);
    },

    
    addEventError : function (errorTrace) {
        var streams = this.streams;
        if (!streams) return;

        var DOMevent = isc.EH._lastDispatchedEvent;

        // wrap inner handling so calling addEventError() never itself throws an error
        try {

            // iterate across each stream capturing event errors
            for (var i = 0; i < streams.length; i++) {
                var stream = streams[i];
                if (stream.capturing && stream[this._$error]) {
                    stream.addEventError(DOMevent, errorTrace);
                }
            }

        } catch (e) {
            
            var errorReport = (e.stack || e).toString();
            this.logWarn("exception while handling a JS error: " + errorReport, "clickStream");
        }
    },


    ////////////////////////////////////////////////////////////////////////////////
    // Support annotating events already captured with info not originally available

    markDragCanceled : function (eventType) {
        this._modifyEvent(this._$drag, eventType, function (record) {
            record.dragCanceled = true;
        });
    },

    _modifyEvent : function (filterProp, eventType, modifyFunc) {
        var streams = this.streams;
        if (!streams) return;

        for (var i = 0; i < streams.length; i++) {
            var stream = streams[i];
            if (stream._shouldProcessEvent(eventType, filterProp)) {
                stream.modifyEvent(filterProp, eventType, modifyFunc);
            }
        }
    },


    ////////////////////////////////////////////////////////////////////////////////
    // Main class-level event handling logic; forward the event if needed per-stream

    _addEvent : function(event, filterProp, eventType, synthetic) {
        var streams = this.streams;
        if (!streams) return;

        var EH = isc.EH,
            coords, locator,
            target, initialized,
            dispatchEventType = eventType || event.eventType
        ;

        // wrap inner handling so calling addXXXEvent() never itself throws an error
        try {

            // iterate across each stream capturing event errors
            for (var i = 0; i < streams.length; i++) {
                var stream = streams[i];
                if (!stream._shouldProcessEvent(dispatchEventType, filterProp)) {
                    continue;
                }
                // initialize coordinates and locator on demand as needed
                if (!initialized) {
                    initialized = true;
                    coords = [EH.getX(event), EH.getY(event)];
                    var nativeTarget = event._mouse ? event.nativeTarget :
                                                      event.nativeKeyTarget;
                    locator = isc.AutoTest.getLocator(nativeTarget, true, coords);
                }
                
                switch (dispatchEventType) {
                    // if we've already prepared a record (non-DOM events), add it as an event
                case this.RELOGIN:
                case this.FILE_LOAD:
                case this.FILE_SAVE:
                    event.timeOffset = new Date() - stream.startTime;
                    delete stream.lastDOMevent;
                    stream._addEvent(event);
                    break;
                    // otherwise, for all DOM events, run standard instance logic in addEvent()
                default:
                    stream.addEvent(event, filterProp, coords, locator, eventType, synthetic);
                    break;
                }
            }

        } catch (e) {
            var errorReport = (e.stack || e).toString();
            this.logWarn("exception while handling " + dispatchEventType + " event: " +
                         errorReport, "clickStream");
        }
    }

});

isc.ClickStream.addMethods({

    init : function () {
        // initialize circular buffer
        this.events = [];
        this.nEvents = 0;

        // Using Infinity minimizes the logic paths needed
        if (this.maxSize == null) this.maxSize = Infinity;

        if (this.autoStart) this.start();
    },

    //> @attr clickStream.autoStart (boolean : true : IR)
    // Whether the stream should automatically begin capturing events.  If false, the steam
    // won't start capturing events until +link{start} is called.
    // @visibility tools
    //<
    autoStart: true,

    //> @method clickStream.start()
    // Starts capturing all enabled events.  See the overview of +link{ClickStream} for a list
    // of filter properties you can configure to control which events are captured.
    // <P>
    // If called after +link{end()}, capturing will restart, but all previously stored events
    // will be lost.
    // @see autoStart
    // @see end
    // @visibility tools
    //<
    start : function () {
        if (this.capturing) return;

        var CS = isc.ClickStream,
            streams = CS.streams;
        if (streams) streams.add(this);
        else {
            
            CS.streams = [this];
            CS.observe(isc.Log, "_reportJSErrorStack", "observer.addEventError(arguments[0])");
        }

        // handle case where capturing is being restarted after call to end()
        if (this.endTime) {
            this.logInfo("restarting capturing will drop all stored events");
            // clear all events from storage
            this.events = [], this.nEvents = 0;
            // clear event error tracking
            delete this._errorEventNumber;
            delete this.lastErrorOffset;
            // clear capture end time
            delete this.endTime;
        }

        this.capturing = true;
        this.startTime = new Date();

        this.logInfo("Starting to capture all configured events");
        return true;
    },

    //> @method clickStream.end()
    // Ends event capturing and returns the +link{ClickStreamData}.  Once ended, capturing
    // cannot be restarted without losing all stored events.
    // @return (ClickStreamData)
    // @see autoStart
    // @see start
    // @visibility tools
    //<
    end : function () {
        if (!this.endTime) {
            this.capturing = false;
            this.endTime = new Date();
            isc.ClickStream.streams.remove(this);
        }
        return this.toClickStreamData();
    },

    //> @method clickStream.getStartTime()
    // Returns when this stream started capturing events (i.e. when +link{start()} got called).
    // @return (Date)
    // @see start()
    // @see autoStart
    // @visibility tools
    //<
    getStartTime : function () {
        return this.startTime;
    },

    //> @method clickStream.getEvents()
    // Returns all available captured events, oldest first.  At most +link{maxSize} events will
    // be returned.
    // @return (Array of CSEvent)
    // @see end
    // @visibility tools
    //<
    
    getEvents : function (length) {
        var maxSize = this.maxSize;
        // default length to maxSize so that we return all CSEvents
        if (length == null || length > maxSize) length = maxSize;
        else if (length < 1)                    length = 1;

        var events = this.events,
            nEvents = this.nEvents
        ;
        // if we've wrapped around, we must extract a properly-ordered array
        if (nEvents > maxSize) {
            events = []; // add maxSize below to ensure modulo is non-negative
            for (var i = (nEvents + maxSize - length) % maxSize, j = 0; j < length;
                     i = i < maxSize - 1 ? i + 1 : 0, j++)
            {
                events[j] = this.events[i];
            }

        
        } else {
            
            events = events.slice(-length);
        }

        
        var deleteScribbling = !isc.isA.Function(Object.defineProperty);
        for (var i = 0; i < events.length; i++) {
            var event = events[i];
            if (deleteScribbling) delete event._dupError;
            else Object.defineProperty(event, "_dupError", {enumerable:false});
        }

        return events;
    },

    // convert stream instance to a JavaScript object
    toClickStreamData : function (nEvents) {
        var data = {
            startTime: this.startTime,
            events: this.getEvents(nEvents),
            nEvents: this.nEvents
        };
        // only add endTime if end() has been called
        if (this.endTime) {
            data.endTime = this.endTime;
        }
        // when reporting errors, include last error offset
        if (this.lastErrorOffset && nEvents != null) {
            data.lastErrorOffset = this.lastErrorOffset;
        }
        return data;
    },

	//> @method Callbacks.EventErrorCallback
	// A +link{type:Callback} called to report +link{ClickStream.captureEventErrors,
    // event errors} from an +link{clickStream.start(),active} +link{ClickStream} to a listener.
    //
    // @param data (ClickStreamData) A JavaScript object representing the current state of the
    //                               stream; +link{clickStreamData.events,events} will be an
    //                               array of all retained +link{CSEvent}s captured by the
    //                               stream since the last time the callback was invoked, oldest
    //                               first.  The last array element should be the
    //                               <code>CSEvent</code> that triggered this call and have an
    //                               +link{CSEvent.errorTrace,errorTrace}.
    // @param nEvents (int) The number of events captured by the stream since the last time the
    //                      callback was invoked.  Compare with +link{clickStreamData.nEvents}.
    // @see clickStream.maxSize
    // @see clickStream.setEventErrorListener()
    // @visibility tools
    //<

    //> @method ClickStream.setEventErrorListener()
    // Installs a callback that will be called when the ClickStream reports an
    // +link{captureEventError,event error}, subject to the +link{minErrorReportingInterval,
    // error reporting interval}.  The callback will be passed all retained +link{CSEvent}s
    // captured by the stream since the last time it was called.
    //
    // @param callback (EventErrorCallback) Callback to fire when the stream encounters an event
    //                                      error, subject to the reporting interval
    // @see maxSize
    // @see minErrorReportingInterval
    // @visibility tools
    //<
    setEventErrorListener : function (callback) {
        if (isc.isA.Function(callback) || isc.isA.String(callback) || isc.isAn.Object(callback))
        {
            this.errorListener = callback;

        } else {
            this.logWarn("setEventErrorListener(): failed to register for event errors; " +
                         "a valid callback must be supplied", "clickStream");
        }
    },

    //> @attr clickStream.maxSize (Integer : 10000 : IR)
    // Maximum number of events that will be stored by this <code>ClickStream</code>.  After
    // <code>maxSize</code> events are captured, the oldest events will be overwritten.
    // Set this property to <code>null</code> to capture events without ever overwriting.
    // @visibility tools
    //<
    maxSize: 10000,

    //> @attr clickStream.captureClickEvents (boolean : true : IR)
    // Whether mouse button-driven events (or their touch equivalents) should be captured by the
    // stream.
    // <P>
    // Includes such +link{CSevent.eventType,eventType}s as <code>mouseDown</code>,
    // <code>mouseUp</code>, <code>click</code>, <code>doubleClk</code>,
    // <code>pointerDown</code>, <code>pointerUp</code>, <code>pointerCancel</code>,
    // <code>touchStart</code>, <code>touchEnd</code>, and <code>touchCancel</code>.
    // @visibility tools
    //<
    captureClickEvents: true,

    //> @attr clickStream.captureMoveEvents (boolean : false : IR)
    // Whether mouse or touch motion-related events (other than dragging) should be captured by
    // the stream.  Multple adjacent "move events" having the same +link{CSEvent.eventType,
    // eventType} and +link{CSEvent.targetID,targetID} will be collapsed into one if
    // +link{collapseMoveEvents} is true.
    // <P>
    // Includes such +link{CSevent.eventType,eventType}s as <code>mouseMove</code>,
    // <code>pointerMove</code>, <code>touchMove</code>, and <code>mouseOut</code>.
    // @visibility tools
    //<
    
    //> @attr clickStream.collapseMoveEvents (boolean : true : IR)
    // Whether mouse or touch-motion related events (including dragging) with the same
    // +link{CSEvent.eventType,eventType} and +link{CSEvent.targetID,targetID} should be
    // collapsed into a single event.
    // <P>
    // Note that if an error is thrown while handling an event, it won't be collapsed,
    // but see +link{minErrorReportingInterval}.
    // @see captureMoveEvents
    // @visibility tools
    //<
    collapseMoveEvents: true,

    //> @attr clickStream.captureKeyEvents (boolean : false : IR)
    // Whether keyboard input events should be captured by the stream.  For non-modifier keys,
    // which includes all the self-inserting visible keyboard characters, we capture only the
    // <code>keyPress</code>, as <code>keyDown</code>/<code>keyUp</code> are generally not
    // useful.  Conversely, for modifier keys (e.g. Shift), we capture <i>only</i> the
    // <code>keyDown</code> and <code>keyUp</code>. events, and not the <code>keyPress</code>.
    // <P>
    // If +link{collapseKeyEvents} is true, multiple adjacent keyPress events may be collapsed
    // into a single event for greater readability and a more compact event trace.
    // <P>
    // Note that if an error is thrown while handling an event, it will get reported regardless
    // of this setting and the above capturing rules, but see +link{minErrorReportingInterval}.
    // So for example an error handling a <code>keyDown</code> would still generally end up in
    // the event trace, even for a self-inserting key such as "A".
    // @visibility tools
    //<
    captureKeyEvents:true,

    //> @attr clickStream.collapseKeyEvents (boolean : true : IR)
    // Whether to collapse adjacent <code>keyPress</code> events into one event where possible.
    // Self-inserting keys will generally be collapsed by concatenating them into a single
    // string, +link{CSEvent.keyNames}.  On the other hand, special keys such as "Esc" and
    // "Backspace" will only be collapsed for repeating sequences of the same key, which will
    // be reported as +link{CSEvent.count}.
    // <P>
    // Note that if an error is thrown while handling an event, it won't be collapsed,
    // but see +link{minErrorReportingInterval}.
    // @see captureKeyEvents
    // @visibility tools
    //<
    collapseKeyEvents: true,

    //> @attr clickStream.captureDragEvents (boolean : true : IR)
    // Whether dragging-related events should be captured by the stream.  Multiple "drag move"
    // type events that have the same +link{CSEvent.eventType,eventType} and
    // +link{CSEvent.targetID,targetID} will be collapsed into one if +link{collapseMoveEvents}
    // is true.
    // <P>
    // Includes such +link{CSevent.eventType,eventType}s as:<ul>
    // <li><code>dragStart</code>, <code>dragRepositionStart</code>,
    // <code>dragResizeStart</code>, <code>dragSelectStart</code>,
    // <li> <code>dragMove</code>, <code>dragRepositionMove</code>,
    // <code>dragResizeMove</code>, <code>dragSelectMove</code>,
    // <li><code>dragStop</code>, <code>dragRepositionStop</code>, <code>dragResizeStop</code>,
    // <code>dragSelectStop</code>,
    // <li><code>drop</code>, <code>dropOver</code>, and <code>dragLeave</code>.
    // </ul>
    // @visibility tools
    //<
    captureDragEvents: true,

    //> @attr clickStream.captureMenuEvents (boolean : true : IR)
    // Whether opening a context menu should be captured by the stream.  This may occur due to
    // mouse or keyboard interaction.
    // <P>
    // Includes the +link{CSevent.eventType,eventType} <code>contextMenu</code>.
    // @visibility tools
    //<
    captureMenuEvents: true,

    //> @attr clickStream.captureWheelEvents (boolean : true : IR)
    // Whether mouse wheel events should be captured by the stream.  If the preceding
    // "wheel event" has the same +link{CSEvent.targetID,targetID} and scroll directions, it
    // will be replaced by the current one, subject to +link{collapseWheelEvents}, with the
    // +link{CSEvent.deltaX,delta offsets} in the "collapsed" event getting adjusted to be the
    // sum of those from all the original events.
    // <P>
    // Includes the +link{CSevent.eventType,eventType} <code>mouseWheel</code>.    
    // @visibility tools
    //<
    captureWheelEvents: true,

    //> @attr clickStream.collapseWheelEvents (boolean : true : IR)
    // Whether mouse wheel events with the same +link{CSEvent.targetID,targetID} and
    // scroll directions should be collapsed into a single event, containing a sum of the
    // +link{CSEvent.deltaX,delta offsets} from the original events.
    // <P>
    // Note that if an error is thrown while handling an event, it won't be collapsed,
    // but see +link{minErrorReportingInterval}.
    // @see captureWheelEvents
    // @visibility tools
    //<
    collapseWheelEvents: true,

    //> @attr clickStream.capturePageEvents (boolean : false : IR)
    // Whether page-level events such as a page load or resize should be captured by the stream.
    // Multple adjacent page events having the same eventType will be collapsed into one if
    // +link{collapsePageEvents} is true.
    // <P>
    // Includes such +link{CSevent.eventType,eventType}s as <code>load</code>,
    // <code>unload</code>, and <code>resize</code>.    
    // @visibility tools
    //<

    //> @attr clickStream.collapsePageEvents (boolean : true : IR)
    // Whether adjacgent page events with the same +link{CSEvent.eventType,eventType} should be
    // collapsed into a single event.
    // <P>
    // Note that if an error is thrown while handling an event, it won't be collapsed,
    // but see +link{minErrorReportingInterval}.
    // @see capturePageEvents
    // @visibility tools
    //<
    collapsePageEvents: true,

    //> @attr clickStream.captureLoginEvents (boolean : true : IR)
    // Whether +link{group:relogin,relogin}s are captured by the stream.  Login events are
    // non-DOM events originating from the +link{RPCManager} rather than the
    // +link{EventHandler}.  Login events have a +link{CSEvent.URL,transaction URL}.
    // <P>
    // Includes the +link{CSevent.eventType,eventType} <code>relogin</code>.
    // @visibility tools
    //<
    captureLoginEvents: true,

    //> @attr clickStream.captureDSFileEvents (boolean : true : IR)
    // Whether to capture loads and saves of projects and screens in +link{group:visualBuilder}.
    // A +link{DataSource} file event includes the +link{CSEvent.status,response status},
    // +link{CSEvent.dataSource,DataSource ID}, +link{CSEvent.fileName,fileName},
    // +link{CSEvent.fileVersion,fileVersion}, +link{CSEvent.fileType,fileType},
    // and +link{CSEvent.autoSaved,autosave status}.
    // <P>
    // Includes such +link{CSevent.eventType,eventType}s as <code>fileLoad</code> and
    // <code>fileSave</code>.
    // @visibility tools
    //<
    captureDSFileEvents: true,

    //> @attr clickStream.captureEventErrors (boolean : true : IR)
    // Whether to capture JavaScript errors.  If an already-captured event triggered the error,
    // the details will attached to that event.  Otherwise, a separate event will be created,
    // with the +link{CSEvent.eventType,eventType} of the last dispatched DOM event (i.e.,
    // there is no special "error" +link{CSEvent.eventType,eventType}.)
    // <P>
    // +link{CSEvent} records annotated or specially-reported with error details will contain an
    // +link{CSEvent.errorTrace,errorTrace} with the error stack trace, and a
    // +link{CSEvent.threadCode,threadCode} reporting the thread ID from the +link{EventHandler}
    // responsible for the error.
    // @visibility tools
    //<
    captureEventErrors: true,

    //> @attr clickStream.minErrorReportingInterval (int : 10 : IR)
    // Number of seconds that must elapse before another event error will be reported.  This
    // allows you to avoid the stream getting flooded with likely duplicate errors that may
    // be rapidly and repeatedly reported, due to mouseMove or repeatedly executing code.
    // Setting the property to zero disables it (avoiding any timestamp checking).
    // <P>
    // Note that when an error is reported by the Framework, this property will be ignored if
    // the last captured event triggered the error and has no +link{CSEvent.errorTrace,
    // errorTrace}, so that it effectively only prevents adding new events to the stream
    // specifically to report errors.  However, an +link{CSEvent.errorTrace,errorTrace} attached
    // to an event within the reporting interval of the previous error won't prevent that event
    // from being +link{collapseMoveEvents,collapsed}.
    //
    // @see collapseMoveEvents
    // @see collapseKeyEvents
    // @see collapseWheelEvents
    // @see collapsePageEvents
    // @visibility tools
    //<
    minErrorReportingInterval:10,

    //> @object ClickStreamData
    // A JavaScript object representing the state of a live +link{ClickStream} instance,
    // including all captured events retained by the stream.  When +link{ClickStream.end()} is
    // called to complete capturing, a <code>ClickStreamData</code> object is returned.
    // <P>
    // Note that <code>ClickStreamData</code> is essentially JSON, except that dates remain
    // JavaScript +link{Date}s, rather than being converted to string format.  This ensures that
    // if you +link{JSON.encode(),serialize} the data and then +link{JSON.decode(),deserialize}
    // it, dates round trip properly and time zone information is not lost.
    // @see CSEvent
    // @visibility tools
    //<

    //> @attr clickStreamData.startTime (String : null : R)
    // A string representation of the <code>DateTime</code> when capturing for the stream
    // +link{ClickStream.start(),started}.
    // @see endTime
    // @visibility tools
    //<

    //> @attr clickStreamData.endTime (String : null : R)
    // A string representation of the <code>DateTime</code> when capturing for the stream was
    // +link{ClickStream.end(),completed}.
    // @see startTime
    // @visibility tools
    //<

    //> @attr clickStreamData.events (Array of CSEvent : null : R)
    // An array of the captured +link{CSEvent,event records} retained by the stream.  Only the
    // last +link{clickStream.maxSize} event records will be present, though more events may
    // have been captured since capturing +link{clickStream.start(),started}.
    // <P>
    // Note that +link{clickStreamData} reported via an +link{Callbacks.EventErrorCallback,
    // error callback} will only contain events that have occurred after the last callback, for
    // efficiency.
    // @see nEvents
    // @visibility tools
    //<

    //> @attr clickStreamData.nEvents (int : null : R)
    // The total number of events captured by the stream since capturing
    // +link{clickStream.start(),started}.  This value may exceed the length of the
    // reported +link{events}, which only contains the most recent events.
    // @visibility tools
    //<

    // An array of the captured +link{CSEvent,event records} retained by the stream.  Only the
    // last +link{clickStream.maxSize} event records will be present, though more events may
    // have been captured during the life of the stream.
    // @visibility tools
    //<

    //> @object CSEvent
    // A JavaScript object representing an event captured by a +link{ClickStream}.
    // <code>CSEvent</code>s may represent DOM events (wrapped by the +link{EventHandler}),
    // or other operations such as +link{group:relogin,relogins} or
    // +link{group:visualBuilder,VisualBuilder} file operations on screens and projects.
    // <P>
    // An +link{CSEvent.eventType,eventType} should always be present, but not all properties
    // will be present for a given <code>CSEvent</code>, since their relevance depends on the
    // <code>eventType</code>.
    // <P>
    // In addition to the instance attributes documented for <code>CSEvent</code>, if
    // we're capturing +link{ClickStream.captureMoveEvents,move events} but not
    // +link{ClickStream.captureDragEvents,drag events}, the move event starting a drag will
    // be tagged with the drag start <code>eventType</code> as a boolean attribute.  So for
    // example,<pre>
    //     dragResizeStart: true</pre>
    // might appear in the <code>CSEvent</code> for a <code>mouseMove</code>, if it started
    // a drag but we weren't capturing +link{ClickStream.captureDragEvents,drag events}.
    // @visibility tools
    //<

    //> @attr CSEvent.eventType (String : null : R)
    // The type of the +link{CSEvent}.  For DOM events, this is just the official
    // +link{EventHandler} name for the event, such as <code>mouseDown</code>.  Otherwise, it's
    // unique to +link{ClickStream}, but should reflect what event was captured, such as
    // <code>fileLoad</code> or <code>relogin</code>.
    // @visibility tools
    //<

    //> @attr CSEvent.originalType (String : null : R)
    // For synthetic events (where the +link{EventHandler} has (re)dispatched a DOM event
    // as a new type), the original <code>eventType</code>.
    // @see CSEvent.synthetic
    // @visibility tools
    //<

    //> @attr CSEvent.synthetic (boolean : null : R)
    // True For synthetic events.  Otherwise, not present at all.  When true,
    // +link{originalType} should be set indicating the original <code>eventType</code>.
    // @see CSEvent.originalType
    // @visibility tools
    //<

    //> @attr CSEvent.locator (AutoTestLocator : null : R)
    // The locator representing the event target, if one exists.  Designed to be robust, the
    // the locator provides a future-proof way to specify a +link{Canvas}, +link{FormItem}, or
    // widget part such as a row of a +link{ListGrid}.
    // @see group:usingSelenium
    // @see AutoTest.getObject()
    // @visibility tools
    //<    

    //> @attr CSEvent.timeOffset (int : null : R)
    // The time offset of this event from +link{ClickStreamData.startTime}, when capturing
    // started, in milliseconds.
    // @visibility tools
    //<

    //> @attr CSEvent.targetID (GlobalId : null : R)
    // The +link{canvas.ID,widget ID} of the event target, if one exists.  Page-level and
    // non-DOM events may not have any target.
    // @see targetClass
    // @see targetX
    // @see targetY
    // @visibility tools
    //<

    //> @attr CSEvent.targetClass (String : null : R)
    // The +link{class.getClassName(),class name} of the event target, if one exists.
    // Page-level and non-DOM events may not have any target.
    // @see targetID
    // @see targetX
    // @see targetY
    // @visibility tools
    //<

    //> @attr CSEvent.targetX (int : null : R)
    // The horizontal offset of the event from the +link{canvas.left,left edge} of the event
    // target, if one exists.  Keyboard, page-level, and non-DOM events may not have any target.
    // @see targetID
    // @see targetClass
    // @see targetY
    // @visibility tools
    //<

    //> @attr CSEvent.targetY (int : null : R)
    // The vertical offset of the event from the +link{canvas.top,top edge} of the event
    // target, if one exists.  Keyboard, page-level, and non-DOM events may not have any target.
    // @see targetID
    // @see targetClass
    // @see targetY
    // @visibility tools
    //<

    //> @attr CSEvent.X (int : null : R)
    // The left offset of the event on the page.  This property typically won't be set unless
    // no +link{targetID,target} is present and the event has an +link{errorTrace}.
    // @see Y
    // @visibility tools
    //<

    //> @attr CSEvent.Y (int : null : R)
    // The top offset of the event on the page.  This property typically won't be set unless
    // no +link{targetID,target} is present and the event has an +link{errorTrace}.
    // @see X
    // @visibility tools
    //<

    //> @attr CSEvent.dragTargetID (GlobalId : null : R)
    // The +link{canvas.ID,widget ID} of the +link{EventHandler.getDragTarget(),drag target},
    // present for most +link{ClickStream.captureDragEvents,drag events}.
    // <P>
    // Note that if drag events are not being captured, it will be populated for the
    // <code>mouseUp</code> event terminating the drag.
    // @see dropTargetID
    // @see dropTargetClass
    // @see dragTargetClass
    // @visibility tools
    //<

    //> @attr CSEvent.dragTargetClass (String : null : R)
    // The +link{class.getClassName(),class name} of the +link{EventHandler.getDragTarget(),
    // drag target}, present for most +link{ClickStream.captureDragEvents,drag events}.
    // <P>
    // Note that if drag events are not being captured, it will be populated for the
    // <code>mouseUp</code> event terminating the drag.
    // @see dragTargetID
    // @see dropTargetID
    // @see dropTargetClass
    // @visibility tools
    //<

    //> @attr CSEvent.dropTargetID (GlobalId : null : R)
    // The +link{canvas.ID,widget ID} of the +link{Canvas.drop(),drop target},
    // present for some +link{ClickStream.captureDragEvents,drag events}.
    // <P>
    // Note that if drag events are not being captured, it will be populated for the
    // <code>mouseUp</code> event terminating the drag.
    // @see dragTargetID
    // @see dragTargetClass
    // @see dropTargetClass
    // @visibility tools
    //<

    //> @attr CSEvent.dropTargetClass (String : null : R)
    // The +link{class.getClassName(),class name} of the +link{Canvas.drop(),drop target},
    // present for some +link{ClickStream.captureDragEvents,drag events}.
    // <P>
    // Note that if drag events are not being captured, it will be populated for the
    // <code>mouseUp</code> event terminating the drag.
    // @see dropTargetID
    // @see dragTargetID
    // @see dragTargetClass
    // @visibility tools
    //<

    //> @attr CSEvent.dragCanceled (boolean : null : R)
    // Set on the event captured at the end of a drag if the drag is canceled.  This is
    // normally an event such as <code>dragStop</code>, <code>dragRepositionStop</code>,
    // <code>dragResizeStop</code>, or <code>dragSelectStop</code>, but if
    // +link{ClickStream.captureDragEvents,drag events} aren't being captured, this property may
    // be set on the <code>mouseUp</code> ending the drag.
    // @visibility tools
    //<

    //> @attr CSEvent.count (int : null : R)
    // Contains a count of the number of events (if any) collapsed into this event if collapsing
    // is active, which includes:<ul>
    // <li>+link{clickStream.collapseMoveEvents,move events}
    // <li>+link{clickStream.collapseKeyEvents,key events}
    // <li>+link{clickStream.collapseWheelEvents,wheel events}
    // <li>+link{clickStream.collapsePageEvents,page events}</ul>
    // The count, if present, includes the event itself so it will always be a number greater
    // than or equal to two.
    // @visibility tools
    //<

    //> @attr CSEvent.keyName (KeyName : null : R)
    // The name of the key that triggered this event, present for
    // +link{ClickStream.captureKeyEvents,key events}.  Typically, the <code>keyName</code> will
    // not convey the case, as that's implied by the presence of +link{shiftKey}.
    // @see KeyName
    // @see shiftKey
    // @see ctrlKey
    // @see metaKey
    // @visibility tools
    //<

    //> @attr CSEvent.keyNames (String : null : R)
    // When +link{clickStream.collapseKeyEvents,key event collapsing} is active and other events
    // have been collapsed into this one, contains a string representing the concatenated
    // +link{CSevent.keyName,keyNames} from the collapsed events.  The length of this string
    // should match +link{count}, and the first character in the string should be
    // +link{attr:keyName}.
    // @see attr:keyName
    // @visibility tools
    //<

    //> @attr CSEvent.shiftKey (boolean : null : R)
    // Present for +link{ClickStream.captureKeyEvents,key events} if the shift key was down when
    // the event got triggered.  Otherwise, not present.
    // @see CSEvent.keyName
    // @see ctrlKey
    // @see metaKey
    // @visibility tools
    //<

    //> @attr CSEvent.ctrlKey (boolean : null : R)
    // Present for +link{ClickStream.captureKeyEvents,key events} if the control key was down
    // when the event got triggered.  Otherwise, not present.
    // @see CSEvent.keyName
    // @see shiftKey
    // @see metaKey
    // @visibility tools
    //<

    //> @attr CSEvent.metaKey (boolean : null : R)
    // Present for +link{ClickStream.captureKeyEvents,key events} if the meta key was down
    // when the event got triggered.  Otherwise, not present.
    // @see CSEvent.keyName
    // @see shiftKey
    // @see ctrlKey
    // @visibility tools
    //<

    //> @attr CSEvent.width (int : null : R)
    // The +link{Page.getWidth(),page width}, present for page-level
    // +link{ClickStream.capturePageEvents,resize events}.
    // @see height
    // @visibility tools
    //<    

    //> @attr CSEvent.height (int : null : R)
    // The +link{Page.getHeight(),page height}, present for page-level
    // +link{ClickStream.capturePageEvents,resize events}.
    // @see width
    // @visibility tools
    //<    

    //> @attr CSEvent.deltaX (float : null : R)
    // The +link{Eventhandler.getWheelDeltaX(),horizontal scroll delta}, present for
    // +link{ClickStream.captureWheelEvents,wheel events}.
    // @see deltaY
    // @visibility tools
    //<    

    //> @attr CSEvent.deltaY (float : null : R)
    // The +link{Eventhandler.getWheelDeltaX(),vertiacl scroll delta}, present for
    // +link{ClickStream.captureWheelEvents,wheel events}.
    // @see deltaX
    // @visibility tools
    //<    

    //> @attr CSEvent.errorTrace (String : null : R)
    // The stack reported when a JavaScript error is hit processing an event.  The
    // <code>errorTrace</code> contains an initial description of the error, and formatting
    // whitespace and newlines to make the trace readable.
    // @see threadCode
    // @see errorEvent
    // @visibility tools
    //<    

    //> @attr CSEvent.threadCode (String : null : R)
    // A symbolic thead ID useful for debugging, present when a JavaScript error is hit
    // processing an event.
    // @see errorTrace
    // @see errorEvent
    // @visibility tools
    //<

    //> @attr CSEvent.errorEvent (boolean : null : R)
    // Present along with +link{errorTrace} and +link{threadCode} if the event triggering the
    // error wasn't already captured, and required adding a new event.  If a stream is
    // configured to +link{ClickStream.captureEventErrors,capture event errors}, then through
    // error reporting it may capture +link{eventType}s not specified by the filters.
    // @see eventType
    // @see errorTrace
    // @visibility tools
    //<        

    //> @attr CSEvent.URL (URL : null : R)
    // The transaction <code>URL</code> associated wtih the successful +link{group:relogin,
    // relogin}.  Only present for +link{ClickStream.captureLoginEvents,login events}.
    // @visibility tools    
    //<

    //> @attr CSEvent.status (int : null : R)
    // The +link{DSResponse.status,server response status} of a
    // +link{group:visualBuilder,VisualBuilder} load or save event.  Present for
    // +link{ClickStream.captureDSFileEvents,file events}.
    // @see fileName
    // @see fileType
    // @see fileVersion
    // @visibility tools    
    //<        

    //> @attr CSEvent.dataSource (GlobalId : null : R)
    // The +link{dataSource.ID,ID} of the screen or project +link{DataSource} used for a
    // +link{group:visualBuilder,VisualBuilder} load or save event.  Present for
    // +link{ClickStream.captureDSFileEvents,file events}.  
    // @see fileName
    // @see fileType
    // @see fileVersion
    // @visibility tools    
    //<

    //> @attr CSEvent.fileName (String : null : R)
    // The file name of the +link{group:visualBuilder,VisualBuilder} screen or project being
    // saved or loaded.  Present for +link{ClickStream.captureDSFileEvents,file events}.  
    // @see fileType
    // @see fileVersion
    // @see autoSaved
    // @see CSEvent.dataSource
    // @visibility tools    
    //<        

    //> @attr CSEvent.fileVersion (Date : null : R)
    // The version of the +link{group:visualBuilder,VisualBuilder} screen or project file being
    // saved or loaded.  This is typically the file's creation <code>DateTime</code>.
    // <P>
    // This attribute is only present for +link{ClickStream.captureDSFileEvents,file events}.
    // @see fileName
    // @see fileType
    // @see autoSaved
    // @visibility tools    
    //<        

    //> @attr CSEvent.fileType (String : null : R)
    // Whether the save or load involves a +link{group:visualBuilder,VisualBuilder}
    // "screen" or "project".  Present for +link{ClickStream.captureDSFileEvents,file events}.
    // @see fileName
    // @see fileVersion
    // @see autoSaved
    // @visibility tools    
    //<        

    //> @attr CSEvent.autoSaved (boolean : null : R)
    // Whether the +link{group:visualBuilder,VisualBuilder} screen or project file is being
    // autosaved.  Not present for loads or manual saves.
    // @see fileName
    // @see fileType
    // @see fileVersion
    // @visibility tools    
    //<        

    
    ////////////////////////////////////////////////////////////////////////////////
    // Event Collapsing Logic

    
    _collapseMoveEvent : function (targetID, coords, locator, eventType) {
        if (!this.collapseMoveEvents) return;

        var EH = isc.EH,
            events = this.events,
            nEvents = this.nEvents,
            maxSize = this.maxSize;
        for (var i = nEvents - 1, j = 0; i >= 0 && j < maxSize; i--, j++) {
            var event = events[i % maxSize];
            switch (event.eventType) {
            case EH.MOUSE_MOVE:
            case EH.MOUSE_OVER:
            case EH.MOUSE_OUT:
            case EH.DRAG_MOVE:
            case EH.DRAG_RESIZE_MOVE:
            case EH.DRAG_SELECT_MOVE:
            case EH.DRAG_REPOSITION_MOVE:
                // if targetID differs or an (important) error is present, don't collapse events
                
                if (event.targetID != targetID || event.errorTrace && !event._dupError) {
                    return;
                }
                if (event.eventType == eventType) {
                    // update the target coordinates
                    if (event.targetID) {
                        event.targetX = coords[0];
                        event.targetY = coords[1];
                    }
                    event.locator = locator;
                    return event;
                }
                break;
            default:
                return;
            }
        }
    },

    // allow "Space" to be concatenated like the other self-inserting visible characters
    _getKeyNameForConcat : function (keyName) {
        return keyName == "Space" ? " " : keyName;
    },

    // collapse multiple keyPress events if possible into a single keyPress event; standard
    // self-inserting keys will be concatenated, but special keys will only be collapsed if
    // they're identical, so for example 10 backspace keyPress events can be collapsed into 1
    _collapseKeyEventNames : function (targetID, keyName) {
        if (!this.collapseKeyEvents) return;

        var EH = isc.EH,
            oldEvent = this._getLastEvent(EH.KEY_PRESS)
        ;

        // don't attempt to collapse if the targetID differs or an important error is present
        if (!oldEvent || oldEvent.targetID != targetID ||
            oldEvent.errorTrace && !oldEvent._dupError)
        {
            return;
        }

        
        var oldKeyName = this._getKeyNameForConcat(oldEvent.keyName),
            newKeyName = this._getKeyNameForConcat(keyName);
        if (!oldKeyName || !newKeyName) return;

        // if new and old events are special keys, we can collapse only if they're identical
        if (oldKeyName.length > 1 || newKeyName.length > 1) {
            if (oldKeyName != newKeyName) return;

        // otherwise, for self-inserting keys, we can always concatenated them into keyNames
        } else {
            if (oldEvent.keyNames == null) oldEvent.keyNames = oldKeyName + newKeyName;
            else                           oldEvent.keyNames +=             newKeyName;
        }

        return oldEvent;
    },

    _collapseWheelEvent : function (targetID, deltaX, deltaY, locator, eventType) {
        if (!this.collapseWheelEvents) return;

        var wheelEvent = this._getLastEvent(isc.EH.MOUSE_WHEEL);
        if (!wheelEvent) return;

        // if targetID or scroll direction differ, or an (important) error is present, bail
        
        if (wheelEvent.targetID != targetID || wheelEvent.errorTrace && !wheelEvent._dupError ||
            wheelEvent.deltaX < 0 && deltaX >= 0 || wheelEvent.deltaX > 0 && deltaX <= 0 ||
            wheelEvent.deltaY < 0 && deltaY >= 0 || wheelEvent.deltaY > 0 && deltaY <= 0)
        {
            return;
        }
        wheelEvent.deltaX += deltaX;
        wheelEvent.deltaY += deltaY;
        wheelEvent.locator = locator;
        return wheelEvent;
    },

    _collapseResizeEvent : function () {
        if (!this.collapsePageEvents) return;

        var resizeEvent = this._getLastEvent(isc.EH.RESIZE);
        if (!resizeEvent || resizeEvent.errorTrace && !resizeEvent._dupError) return;

        this._setPageSize(resizeEvent);
        return resizeEvent;
    },

    _getLastEvent : function (eventType, searchEvents) {
        var events = this.events,
            nEvents = this.nEvents,
            maxSize = this.maxSize;
        for (var i = nEvents - 1, j = 0; i >= 0 && j < maxSize; i--, j++) {
            var event = events[i % maxSize];
            if (!eventType || event.eventType == eventType) return event;
            if (!searchEvents) return;
        }
    },

    ////////////////////////////////////////////////////////////////////////////////
    // Adding Event MetaData

    _addMetaData : function (eventType) {
        var EH = isc.EH,
            events = this.events;
        switch (eventType) {
        case EH.DRAG_START:
        case EH.DRAG_RESIZE_START:
        case EH.DRAG_SELECT_START:
        case EH.DRAG_REPOSITION_START:
            var event = this._getLastEvent(EH.MOUSE_MOVE, true);
            if (event) event[eventType] = true;
            break;
        case EH.DRAG_STOP:
        case EH.DRAG_RESIZE_STOP:
        case EH.DRAG_SELECT_STOP:
        case EH.DRAG_REPOSITION_STOP:
            var event = this._getLastEvent(EH.MOUSE_UP, true);
            if (event) {
                event[eventType] = true;
                this._addDragInfo(event);
            }
            break;
        }
    },

    _addDragInfo : function (record) {
        var EH = isc.EH,
            dragTarget = EH.dragTarget;
        if (dragTarget) isc.addProperties(record, {
            dragTargetID: dragTarget.ID,
            dragTargetClass: dragTarget.getClassName()
        });
        var dropTarget = EH.dropTarget;
        if (dropTarget) isc.addProperties(record, {
            dropTargetID: dropTarget.ID,
            dropTargetClass: dropTarget.getClassName()
        });
    },

    _addKeyInfo : function (record, event) {
        var EH = isc.EH,
            keyName = EH.getKey(event);
        if (!keyName) return;
        record.keyName  = keyName;

        if (EH.shiftKeyDown(event)) record.shiftKey = true;
        if (EH.ctrlKeyDown(event))  record.ctrlKey  = true;
        if (EH.metaKeyDown(event))  record.metaKey  = true;
    },

    _setPageSize : function (record) {
        record.height = isc.Page.getHeight();
        record.width  = isc.Page.getWidth();
    },

    
    ////////////////////////////////////////////////////////////////////////////////
    // Adding an Event Error or Error Trace

    // report the event error, either against the last event or by adding a new event
    addEventError : function (DOMevent, errorTrace) {
        var EH = isc.EH,
            CS = isc.ClickStream
        ;
        // check error against reporting interval; mark violations as duplicate
        var duplicate = false,
            interval = this.minErrorReportingInterval;
        if (interval) {
            var now = new Date(),
                lastErrorTime = this._lastErrorTime;
            if (lastErrorTime && (now - lastErrorTime < interval * 1000)) {
                // too soon! likely duplicate
                duplicate = true; 
            } else {
                // interval expired; reset it
                this._lastErrorTime = now;
            }
        }

        // if the source event is already in the stream, just add the error details
        if (this._canAddErrorToLastEvent(DOMevent, duplicate)) {
            var event = this._getLastEvent();
            event.errorTrace = errorTrace;
            event.threadCode = EH._thread;
            event._dupError = duplicate;

        // otherwise, create a new event for the error, but only if the interval expired
        } else if (!duplicate) {
            
            var event = EH.lastEvent,
                nativeType = DOMevent.type
            ;
            // if source DOMevent not reflected in EH.lastEvent, build our own event
            
            if (EH._getDOMevent(event) != DOMevent || event.eventType == null) { 
                event = CS.getEventProperties(DOMevent, nativeType.startsWith("key"));
            }
            var eventType = event.eventType,
                coords = [EH.getX(event), EH.getY(event)],
                filterProp = eventType ? this._getFilterPropForType(eventType) : null,
                nativeTarget = event._mouse ? event.nativeTarget : event.nativeKeyTarget,
                locator = isc.AutoTest.getLocator(nativeTarget, true, coords)
            ;
            this.addEvent(event, filterProp, coords, locator, null, null, errorTrace);

        // drop the error
        } else {
            if (this.logIsInfoEnabled("clickStream")) {
                this.logInfo("ignoring error reported against event with nativeType: " +
                             DOMevent.type + " due to configured reporting interval", "cliskStream");
            }
            return;
        }

        

        var lastEventNumber = this._errorEventNumber,
            eventNumber = this._errorEventNumber = this.nEvents - 1;

        if (this.errorListener) {
            
            if (lastEventNumber == null) lastEventNumber = -1;

            var nEvents = eventNumber - lastEventNumber;
            this.fireCallback(this.errorListener, "events,count",
                              [this.toClickStreamData(nEvents), nEvents]);
        }

        
        this.lastErrorOffset = event.timeOffset;
    },

    // whether error can be added to the last event in this stream
    _canAddErrorToLastEvent : function (DOMevent, duplicate) {
        if (this.lastDOMevent != DOMevent) return false;

        // don't reuse the event if it already reports an error
        var event = this._getLastEvent();
        return event && (!event.errorTrace || event._dupError && !duplicate);
    },

    
    _getFilterPropForType : function (eventType) {
        var EH = isc.EH,
            filterProp;
        if      (eventType.startsWith("drag")) filterProp = this._$drag;
        else if (eventType.startsWith("key"))  filterProp = this._$key;
        else switch (eventType) {
            case EH.LOAD:
            case EH.UNLOAD:
            case EH.RESIZE:
            filterProp = this._$page;
            break;
        }
        return filterProp;
    },


    ////////////////////////////////////////////////////////////////////////////////
    // Common logic to add or modify events

    addEvent : function (event, filterProp, coords, locator, eventType, synthetic, errorTrace) {

        var EH = isc.EH,
            CS = isc.ClickStream,
            DOMevent = EH._getDOMevent(event),
            originalType = event.originalType
        ;
        // set originalType from the event if an eventType is passed
        
        if (eventType) {
            if (!originalType && event.eventType != eventType) {
                originalType = event.eventType;
            }
        } else {
            eventType = event.eventType;
        }

        
        if (!this[filterProp] && !errorTrace) {
            this._addMetaData(eventType);
            return;
        }

        // update the target and add deltaX, deltaY details, as appropriate
        var deltaX, deltaY,
            target = event.target;
        switch (eventType) {
        case EH.CONTEXT_MENU:
            if (event.keyboardContextMenu) target = event.keyTarget || event.target;
            break;
        case EH.KEY_DOWN:
        case EH.KEY_PRESS:
        case EH.KEY_UP:
            target = event.keyTarget ? event.keyTarget :
                EH.getEventTargetCanvas(DOMevent, event.nativeKeyTarget);
            break;
        case EH.MOUSE_WHEEL:
            deltaX = event.wheelDeltaX;
            deltaY = event.wheelDeltaY;
        }

        // if a target is present, make the coordinates target relative
        if (target) {
            coords[0] -= target.getPageLeft();
            coords[1] -= target.getPageTop();
        }
        
        var targetID = target ? target.ID : null,
            timeOffset = new Date() - this.startTime
        ;

        // if we're collapsing events, update old event and skip adding new event
        var oldEvent;
        if (!errorTrace) switch (eventType) {
        case EH.MOUSE_MOVE:
        case EH.MOUSE_OVER:
        case EH.MOUSE_OUT:
        case EH.DRAG_MOVE:
        case EH.DRAG_RESIZE_MOVE:
        case EH.DRAG_SELECT_MOVE:
        case EH.DRAG_REPOSITION_MOVE:
            oldEvent = this._collapseMoveEvent(targetID, coords, locator, eventType);
            break;
        case EH.MOUSE_WHEEL:
            oldEvent = this._collapseWheelEvent(targetID, deltaX, deltaY, locator, eventType);
            break;
        case EH.KEY_PRESS:
            oldEvent = this._collapseKeyEventNames(targetID, EH.getKey(event));
            break;
        case EH.RESIZE:
            oldEvent = this._collapseResizeEvent();
            break;
        }
        
        if (oldEvent) {
            oldEvent.lastCollapse = timeOffset;

            if (!oldEvent.count) oldEvent.count = 2;
            else                 oldEvent.count++;

            this.lastDOMevent = DOMevent;
            return;
        }

        // create the new CSEvent record
        var record = {
            eventType: eventType,
            timeOffset: timeOffset
        };
        if (locator) record.locator = locator;

        // mark synthetic events with originalType
        if (originalType && synthetic != false) {
            record.originalType = originalType;
            record.synthetic =  true;
        }

        // if a target is set, install the targetID, targetClass, and offset
        if (targetID) {
            record.targetID    = targetID;
            record.targetClass = target.getClassName();
            // targetX, targetY offset likely not useful for keyboard events
            if (filterProp != CS._$key) {
                record.targetX = coords[0], record.targetY = coords[1];
            }

        // no target; still add coordinates if we're reporting an error
        } else if (errorTrace) {
            record.X = coords[0];
            record.Y = coords[1];
        }

        // apply event group-specific metadata
        switch (filterProp) {
        case CS._$drag:
            this._addDragInfo(record);
            break;
        case CS._$key:
            this._addKeyInfo(record, event);
            break;
        case CS._$page:
            this._setPageSize(record);            
        }

        // apply delta offsets (mouseWheel events)
        if (deltaX != null) record.deltaX = deltaX;
        if (deltaY != null) record.deltaY = deltaY;

        // add trace and threadCode for errors
        if (errorTrace) {
            record.errorTrace = errorTrace;
            record.threadCode = EH._thread;
            record.errorEvent = true;
        }

        
        this.lastDOMevent = DOMevent;
        this._addEvent(record);
    },

    // annotate an existing event with details not originally available
    modifyEvent : function (filterProp, eventType, modifyFunc) {
        var EH = isc.EH;
        switch (eventType) {
        case EH.DRAG_STOP:
        case EH.DRAG_RESIZE_STOP:
        case EH.DRAG_SELECT_STOP:
        case EH.DRAG_REPOSITION_STOP:
            var event = this._getLastEvent(this[filterProp] ? eventType : EH.MOUSE_UP, true);
            if (event) {
                modifyFunc.call(this, event);
            }
            return;
        }
    },

    _addEvent : function (record) {
        this.events[this.nEvents++ % this.maxSize] = record;
    },

    
    _shouldProcessEvent : function (eventType, filterProp) {
        if (!this.capturing) return false;
        if (this[filterProp]) return true;

        var EH = isc.EH,
            CS = isc.ClickStream
        ;
        if (filterProp == CS._$drag) {
            switch (eventType) {
            case EH.DRAG_START:
            case EH.DRAG_RESIZE_START:
            case EH.DRAG_SELECT_START:
            case EH.DRAG_REPOSITION_START:
                return this[CS._$move];
            case EH.DRAG_STOP:
            case EH.DRAG_RESIZE_STOP:
            case EH.DRAG_SELECT_STOP:
            case EH.DRAG_REPOSITION_STOP:
                return this[CS._$click];
            }
        }
        return false;
    }

});


isc.ClickStream.addClassMethods({
    observe : isc.ClickStream.getPrototype().observe,
    ignore :  isc.ClickStream.getPrototype().ignore
});
