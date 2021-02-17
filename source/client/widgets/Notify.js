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
//>	@class Notify
// Notify provides a means to display on-screen messages that are automatically dismissed after
// a configurable amount of time, as an alternative to +link{isc.confirm(),modal notification}
// dialogs that can lower end user productivity.  Messages may be shown at a particular
// location, specified either with viewport-relative coordinates, or as an edge or center
// location relative to the viewport or a canvas.  Messages can be configured to appear and
// disappear instantly, by sliding into (or out of) view, or by fading in (or out).
// <P>
// One or more +link{NotifyAction,actions} can be provided when +link{Notify.addMessage(),
// addMessage()} is called to display a message.  They will be rendered as links on which to
// click to execute the action.
// <P>
// The behavior and appearance of messages are configured per +link{NotifyType}, which is simply
// a string that identifies that message group, similar to +link{class.logWarn(),log category}.
// By calling +link{Notify.configureMessages(),configureMessages()} with the
// <code>NotifyType</code>, it can be assigned a +link{NotifySettings} configuration to control
// message animation, placement, and the the +link{Label} used to render each message, allowing
// styling and autofit behavior to be configured.
// <P>
// Messages of the same <code>NotifyType</code> may be stacked to provide a visible
// history, with a configurable stacking direction and maximum stacking depth.  Details on how
// to configure messages are provided in the documentation for +link{NotifySettings}.
// <P>
// Messages for different <code>NotifyType</code>s are stacked separately and animated by
// independent Framework pipelines.  It's up to you to configure the placement of supported
// <code>NotifyType</code>s in your app so that they don't overlap, as the Framework doesn't
// manage it.  For example, separate <code>NotifyType</code>s could be assigned separate screen
// edges, or assigned a different +link{notifySettings.positionCanvas}.
// <P>
// To dismiss a message manually before its scheduled duration expires, you may call
// +link{Notify.dismissMessage(),dismissMessage()} with a <code>NotifyType</code> (to dismiss
// all such messages) or an ID previously returned by +link{Notify.addMessage(),addMessage()}
// (to dismiss that single message).
// <P>
// <B>Warnings and Errors</B>
// <P>
// Each notification may be assigned a +link{NotifySettings.messagePriority,messagePriority} in
// the settings passed to +link{notify.addMessage(),addMessage()}.  By default, all
// <code>NotifyType</code>s are configured to have priority +link{Notify.MESSAGE}, except for
// "error" and "warn" <code>NotifyType</code>s, which are configured with priority
// +link{Notify.ERROR} and +link{Notify.WARN}, respectively.
// <P>
// The +link{NotifySettings.messagePriority,messagePriority} determines the default styling of a
// message, and which message to remove if a new message is sent while the message stack is
// already at its limit.  We recommended applying a +link{NotifySettings.messagePriority,
// messagePriority} as the best approach for showing pre-styled warnings and errors, since that
// allows you to interleave them with ordinary messages in a single <code>NotifyType</code>.
// <P>
// Alternatively, you can display pre-styled warnings and errors by calling
// +link{notify.addMessage(),addMessage()} with the separate <code>NotifyType</code>s
// "warning" and "error", respectively, but then you must take care to
// +link{notify.configureMessages(),assign each NotifyType} used to a separate screen
// location to avoid one rendering on top of the other.
// <P>
// <B>Viewport Considerations</B>
// <P>
// Messages are edge or corner-aligned based on the +link{page.getScrollWidth(),viewport width}
// and +link{page.getScrollHeight(),viewport height} of the current page rather than screen, so
// you may need to scroll to see the targeted corner or edge.  Note that widgets placed
// offscreen below or to the right of a page may cause the browser to report a larger viewport,
// and prevent messages from being visible, even if no scrollbars are present.  If you need to
// stage widgets offscreen for measurement or other reasons, place them above or to the left.
// <P>
// <B>Modal Windows and Click Masks</B>
// <P>
// Messages are always shown above all other widgets, including +link{window.isModal,
// modal windows} and +link{canvas.showClickMask(),click masks}.  This is because it's expected
// that messages are "out of band" and logically indepedent of the widget hierarchy being shown.
// We apply this layering policy even for windows and widgets created by +link{notifyAction}s.
// If there may a scenario where a message can block a window created by an action, set
// +link{notifySettings.canDismiss} to true so that an unobstructed view of the underlying
// widgets can be restored.
// <P>
// In the linked sample, note how we take care to reuse the existing modal window, if any, if
// the "Launch..." link is clicked, so that repeated clicks never stack windows over each other.
//
// @see isc.say()
// @see isc.confirm()
// @treeLocation Client Reference/Control
// @example notifications
// @visibility external
//<
isc.ClassFactory.defineClass("Notify");

isc.Notify.addClassMethods({
    _$message: "message",
    _$warn:    "warn",
    _$error:   "error",

    settings: {},
    typeState: {},

    _initializeSettings : function () {
        this._settingsInitialized = true;
        this.configureMessages(this._$message, this._initNotifySettings(this._$message));
        this.configureMessages(this._$warn,    this._initNotifySettings(this._$warn));
        this.configureMessages(this._$error,   this._initNotifySettings(this._$error));
    },

    //> @type MessagePriority
    // A positive integer representing the priority of a message.  Lower numerical values have
    // higher priority.
    // @see NotifySettings.messagePriority
    // @baseType int
    // @visibility external
    //<
    

    //> @classAttr Notify.ERROR (MessagePriority : 1 : [R])
    // Highest priority.  Default priority of +link{NotifyType}: "error".
    // @see WARN
    // @see MESSAGE
    // @visibility external
    // @constant
    //<
    ERROR: 1,

    //> @classAttr Notify.WARN (MessagePriority : 2 : [R])
    // Second-highest priority.  Default priority of +link{NotifyType}: "warn".
    // @see ERROR
    // @see MESSAGE
    // @visibility external
    // @constant
    //<
    WARN: 2,

    //> @classAttr Notify.MESSAGE (MessagePriority : 3 : [R])
    // Third-highest priority.  Default priority for all +link{NotifyType}s other than "error"
    // and "warn".
    // @see ERROR
    // @see WARN
    // @visibility external
    // @constant
    //<
    MESSAGE: 3,


    ////////////////////////////////////////////////////////////////////////////////
    // New Message

    //> @classMethod Notify.addMessage()
    // Displays a new message, subject to the +link{configureMessages(),stored configuration}
    // for the passed <code>notifyType</code>, overridden by any passed <code>settings</code>.
    // Returns an opaque <code>MessageID</code> that can be passed to +link{dismissMessage()}
    // to clear it.
    // <P>
    // Note that an empty string may be passed for <code>contents</code> if <code>actions</code>
    // have been provided, so you may have the message consist only of your specified actions.
    // <P>
    // Most users should do all configuration up front via a call to +link{configureMessages()}.
    // The <code>settings</code> argument in this method is provided to allow adjustment of
    // properties that affect only one message, such as +link{NotifySettings.autoFitWidth,
    // autoFitWidth}, +link{NotifySettings.styleName,styleName}, or 
    // +link{NotifySettings.labelProperties,labelProperties}.  Making changes to 
    // +link{multiMessageMode,stacking}-related properties via this argument isn't supported,
    // unless specifically documented on the property.
    // 
    // @param  contents     (HTMLString)             message to be displayed
    // @param  [actions]    (Array of NotifyAction)  actions (if any) for this message
    // @param  [notifyType] (NotifyType)             category of message; default "message"
    // @param  [settings]   (NotifySettings)         display and behavior settings for
    //                                               this message that override the
    //                                               +link{configureMessages(),configured}
    //                                               settings for the <code>notifyType</code>
    // @return  (MessageID)  opaque identifier for message
    // @see isc.say()
    // @see isc.confirm()
    // @see isc.notify()
    // @visibility external
    //<
    addMessage : function (contents, actions, notifyType, settings) {
        // sanity check - we require contents or at least one titled NotifyAction
        if (!contents && !this._hasTitledActions(actions)) {
            this.logWarn("addMessage(): you must either provide valid contents for " +
                         "the message, or at least one NotifyAction with a title", "notify");
            return;
        }

        if (!notifyType) notifyType = this._$message;

        // create default NotifySettings for NotifyType if needed
        var typeSettings = this.settings[notifyType];
        if (!typeSettings) {
            this.configureMessages(notifyType);
            typeSettings = this.settings[notifyType];
        }
        

        // passed settings override configured settings for notifyType
        settings = this._filterCustomSettings(settings, typeSettings);

        // create a new typeState for this notifyType if needed
        var typeState = this.typeState[notifyType];
        if (!typeState) {
            typeState = this.typeState[notifyType] = {
                notifyType: notifyType,
                pendingQueue: [],
                liveMessages: [],
                dismissQueue: [],
                replaceQueue: []
            };
        }

        // message state/config
        var messageState = {
            contents: contents,
            actions:  actions,
            settings: settings
        };

        
        var ready = this._prepareForNewMessage(typeState, settings);
        if (ready) {
            this._addMessage(typeState, messageState);
            if (this.logIsDebugEnabled("notify")) {
                this.logDebug("addMessage(): showing message with notifyType: " +
                              notifyType + " and contents: '" + contents + "'", "notify");
            }
        } else {
            typeState.pendingQueue.add(messageState);
            if (this.logIsInfoEnabled("notify")) {
                this.logInfo("addMessage(): queuing message with notifyType: " +
                             notifyType + " and contents: '" + contents + "'", "notify");
            }
        }

        return {notifyType: notifyType, messageState: messageState};
    },

    _addMessage : function (typeState, messageState) {
        

        typeState.liveMessages.add(messageState);

        this._createMessageLabel(typeState, messageState);

        

        var stackCoords, settings = messageState.settings,
            messageCoords = this._getMessageCoords(typeState, messageState)
        ;

        // create stack if stacking messages and compute its position
        if (settings.multiMessageMode == "stack") {
            if (typeState.stack == null) {
                var direction = settings.stackDirection,
                    vertical = direction == "up" || direction == "down",
                    stackClass = vertical ? isc.VStack : isc.HStack
                ;
                typeState.stack = stackClass.create({
                    left: messageCoords[0], 
                    top: messageCoords[1],
                    width: 1, height: 1,
                    _notifyZLayer: true,

                    instantRelayout: true, autoDraw: true,
                    membersMargin: settings.stackSpacing,
                    
                    
                    _setAnimation : function (effect, time) {
                        this.setProperties({
                            animateMembers: true,
                            animateMemberTime: time,
                            animateMemberEffect: effect
                        });
                    },
                    _clearAnimation : function () {
                        this.setProperty("animateMembers", false);
                    }
                });
                typeState.stack.bringToFront();

                
                typeState.placeholder = isc.Canvas.create({
                    opacity: 0, top: -1000
                });
            } else {
                var stack = typeState.stack;
                if (!stack.members.length) {
                    stack.moveTo(messageCoords[0], messageCoords[1]);
                }
            }
            // message coords are affected by stacking, so (re)compute message and stack coords
            stackCoords = this._getStackCoords(typeState, messageState, false);
            messageCoords = this._getStackedMessageCoords(typeState, messageState, stackCoords);
        }

        var stack = typeState.stack,
            label = messageState.label,
            liveMessages = typeState.liveMessages;
        

        var appearMethod = settings.appearMethod;
        if (this.logIsDebugEnabled("notify")) {
            this.logDebug("addMessage(): starting message animation: " + appearMethod +
                " to/at coordinates: " + messageCoords + " and stack slide to coordinates: " +
                stackCoords + " for notifyType: " + typeState.notifyType + " with contents: '" +
                messageState.contents + "'", "notify");
        }
        switch (appearMethod) {
        case "fade":
            
            if (liveMessages.length > 1) {
                this._prepSlideStack(typeState, messageState, messageCoords, stackCoords);
            } else {
                this._fadeInMessage(typeState, messageState, messageCoords, stackCoords);
            }
            break;
        case "slide":
            this._slideInMessage(typeState, messageState, messageCoords, stackCoords);
            break;
        case "instant":
        default:
            if (stack) this._addLabelToStack(typeState, messageState, stackCoords);
            else label.moveTo(messageCoords[0], messageCoords[1]);
            break;
        }

        // if a non-zero duration was supplied, the message will auto-dismiss after it elapses
        if (settings.duration) this._scheduleMessageDismissal(typeState, messageState);
    },

    
    _crossMessageProps : [
        "multiMessageMode", "stackDirection", "maxStackSize", "maxStackDismissMode",
        "stackSpacing", "repositionMethod"
    ],

    // return new NotifySettings representing only allowed overrides of the configured settings
    _filterCustomSettings : function (changedSettings, configuredSettings) {
        // return configured settings if no settings changed
        if (!changedSettings) return configuredSettings;

        var violation,
            propsToRemove = this._crossMessageProps,
            filtered = isc.addProperties({}, changedSettings)
        ;
        // remove setting and warn for props that we can't customize
        for (var i = 0; i < propsToRemove.length; i++) {
            var prop = propsToRemove[i];
            if (prop in filtered) {
                delete filtered[prop];
                violation = true;
            }
        }
        if (violation) {
            this.logWarn("addMessage(): you cannot change stack properties in a call to " +
                "addMessage() - they can only be set through configureMessages()", "notify");
        }

        // apply priority-related defaults if appropriate (requires messagePriority, etc.)
        if (this._shouldApplyPriorityToAppearance(filtered, configuredSettings)) {
            var messagePriority = filtered.messagePriority,
                prioritySettings = this._getConfigSettingsByPriority(messagePriority);
            for (var prop in this._messageDefaults) {
                if (!(prop in filtered)) filtered[prop] = prioritySettings[prop];
            }
        }

        return isc.addDefaults(filtered, configuredSettings);
    },

    _hasTitledActions : function (actions) {
        if (!actions) return false;
        for (var i = 0; i < actions.length; i++) {
            if (actions[i].title) return true;
        }
        return false;
    },


    ////////////////////////////////////////////////////////////////////////////////
    // Message Dismissal

    //> @classMethod Notify.dismissMessage()
    // Dismisses one or more messages currently being shown, subject to the existing settings
    // for their +link{NotifyType}.  You may either pass the opaque message identifier returned
    // from the call to +link{addMessage()} to dismiss a single message, or a
    // <code>NotifyType</code> to dismiss all such messages.
    // @param messageID  (MessageID | NotifyType)  message identifier or category to dismiss
    // @see notifySettings.duration
    // @see notifyAction.wholeMessage
    // @visibility external
    //<
    dismissMessage : function (messageID) {
        if (this._isValidMessageID(messageID)) {
            var typeState = this.typeState[messageID.notifyType];
            this._dismissMessage(typeState, messageID.messageState);

        } else if (isc.isA.String(messageID)) {
            var typeState = this.typeState[messageID];
            if (typeState) {
                if (this.logIsInfoEnabled("notify")) {
                    this.logInfo("dismissMessage(): dismissing all messages for " +
                                 "notifyType: " + typeState.notifyType, "notify");
                }
                
                var pendingQueue = typeState.pendingQueue.duplicate();
                for (var i = 0; i < pendingQueue.length; i++) {
                    this._dismissMessage(typeState, pendingQueue[i]);
                }
                var liveMessages = typeState.liveMessages.duplicate();
                for (var i = 0; i < liveMessages.length; i++) {                
                    this._dismissMessage(typeState, liveMessages[i]);
                }
            }
        } else {
            this.logWarn("dismissMessage(): " + messageID + " is neither a valid " +
                         "messageID nor a valid notifyType", "notify");
        }
    },

    _dismissMessage : function (typeState, messageState) {
        

        var notifyType = typeState.notifyType,
            pendingQueue = typeState.pendingQueue,
            liveMessages = typeState.liveMessages,
            dismissQueue = typeState.dismissQueue,
            contents = messageState.contents
        ;

        if (!this._canDismissMessage(typeState, messageState)) {
            this.logWarn("dismissMessage(): can't dismiss messageID with notifyType: " +
                notifyType + "and contents: ;" + contents + "' as it can't be found", "notify");
            return;
        }

        // if the message hasn't yet been shown, we can just remove it instantly
        if (pendingQueue.contains(messageState)) {
            if (this.logIsDebugEnabled("notify")) {
                this.logDebug("dismissMessage(): removing message with notifyType: " + 
                              notifyType + " and contents: '" + contents +
                              "' from the 'pending add' message queue", "notify");
            }
            pendingQueue.remove(messageState);
            return true;
        }

        // if the message has already been dismissed, then there's nothing to do
        if (dismissQueue.contains(messageState) || 
            typeState.opMessage == messageState && messageState.dismissed) 
        {
            if (this.logIsInfoEnabled("notify")) {
                this.logInfo("dismissMessage(): message with notifyType: " + 
                             notifyType + " and contents: '" + contents + 
                             "' has already been dismissed or queued for dismissal", "notify");
            }
            return false;
        }

        // if we're busy with some other animation, then we've got to queue the dismiss
        if (typeState.op != null) {
            if (this.logIsInfoEnabled("notify")) {
                this.logInfo("dismissMessage(): queuing message with notifyType: " +
                    notifyType + " and contents: '" + contents + "' for dismissal", "notify");
            }
            dismissQueue.add(messageState);
            return false;
        }

        

        // clear the timer for the message, if any
        if (messageState.dismissEvent) {
            isc.Timer.clear(messageState.dismissEvent);
            messageState.dismissEvent = null;
        }
        messageState.dismissed = true;

        var stackCoords,
            stack = typeState.stack,
            label = messageState.label,
            settings = messageState.settings
        ;
        if (stack) stackCoords = this._getStackCoords(typeState, messageState, true);

        var disappearMethod = settings.disappearMethod;
        if (this.logIsDebugEnabled("notify")) {
            var messageCoords = [label.getPageLeft(), label.getPageTop()];
            this.logDebug("dismissMessage(): starting message animation: " + 
                disappearMethod + " from/at coordinates: " + messageCoords + " and stack " +
                "slide to coordinates: " + stackCoords + " for notifyType: " + notifyType + 
                " with contents: '" + contents + "'", "notify");
        }
        switch (disappearMethod) {
        case "fade":
            this._fadeOutMessage(typeState, messageState, stackCoords);
            return false;
        case "slide":
            this._slideOutMessage(typeState, messageState, stackCoords);
            return false;
        case "instant":
        default:
            
            typeState.liveMessages.remove(messageState);
            if (stack) {
                stack.moveTo(stackCoords[0], stackCoords[1]);
                stack.removeMember(label);
            }
            if (label) label.destroy();
            return true;
        }
    },

    _scheduleMessageDismissal : function (typeState, messageState) {
        var settings = messageState.settings,
            duration = settings.duration
        ;

        
        if (settings.stackPersistence == "reset") {
            var messages = typeState.liveMessages,
                dismissed = typeState.dismissQueue,
                resetCutoff = isc.timeStamp() + duration
            ;
            for (var i = 0; i < messages.length - 1; i++) {
                
                var dismissEvent = messages[i].dismissEvent;
                if (dismissEvent && !dismissed.contains(messages[i]) &&
                    isc.Timer.getTimeoutFireTime(dismissEvent) < resetCutoff)
                {
                    isc.Timer.clear(dismissEvent);

                    
                    var messageToReset = messages[i]; // fix message for closure!
                    messageToReset.dismissEvent = isc.Timer.setTimeout(function () {
                        isc.Notify._dismissMessage(typeState, messageToReset);
                    }, duration - messages.length + i + 1);

                    if (this.logIsInfoEnabled("notify")) {
                        this.logInfo("addMessage(): reset message with notifyType: " +
                                     typeState.notifyType + " and contents: '" +
                                     messageToReset.contents + "' to auto-dismiss after " +
                                     duration + "ms to match new message's duration", "notify");
                    }
                }
            }
        }

        messageState.dismissEvent = isc.Timer.setTimeout(function () {
            isc.Notify._dismissMessage(typeState, messageState);
        }, duration);
    },

    _isValidMessageID : function (messageID) {
        if (messageID == null) return false;
        var notifyType = messageID.notifyType;
        return notifyType != null && this.typeState[notifyType] && messageID.messageState;
    },

    //> @classMethod Notify.canDismissMessage()
    // Can the message corresponding to the <code>messageID</code> be dismissed?  Returns false
    // if the message is no longer being shown.  The <code>messageID</code> must have been
    // previously returned by +link{addMessage}.
    // @param messageID  (MessageID)  message identifier to dismiss
    // @return (boolean) whether message can be dismissed
    // @see dismissMessage
    // @visibility external
    //<
    canDismissMessage : function (messageID) {
        if (this._isValidMessageID(messageID)) {
            var typeState = this.typeState[messageID.notifyType];
            return this._canDismissMessage(typeState, messageID.messageState);

        }
        isc.logWarn("canDismissMessage(): " + messageID + " isn't a valid messageID",
                    "notify");
        return false;
    },

    _canDismissMessage : function (typeState, messageState) {
        return typeState.pendingQueue.contains(messageState) || 
               typeState.liveMessages.contains(messageState) ||
               typeState.dismissQueue.contains(messageState);
    },

    _destroyMessages : function (notifyType) {
        var settings = this.settings[notifyType],
            typeState = this.typeState[notifyType];
        

        // destroy messages and cancel timeouts
        var messages = typeState.liveMessages;
        for (var i = 0; i < messages.length; i++) {
            var messageState = messages[i],
                label = messageState.label;
            if (label) label.destroy();

            var dismissEvent = messageState.dismissEvent;
            if (dismissEvent) isc.Timer.clear(dismissEvent);
        }

        // destroy stack widget (if any)
        var stack = typeState.stack;
        if (stack) stack.destroy();

        // wipe out notifyType's typeState
        delete this.typeState[notifyType];
    },


    ////////////////////////////////////////////////////////////////////////////////
    // Message Configuration

    //> @classMethod Notify.configureMessages()
    // Sets the default +link{NotifySettings} for the specified +link{NotifyType}.  This
    // may be overridden by passing settings to +link{addMessage()} when the message
    // is shown, but changing +link{multiMessageMode,stacking}-related properties via
    // +link{addMessage()} isn't supported,
    // <P>
    // By default, the +link{NotifyType}s "message", "warn", and "error" are predefined, each
    // with their own +link{NotifySettings} with different +link{NotifySettings.styleName,
    // styleName}s.  When configuring a new (non-predefined) NotifyType with this method, any
    // +link{NotifySettings} left unset will default to those for NotifyType "message".
    // 
    // @param  notifyType  (NotifyType)      category of message; null defaults to "message" 
    // @param  settings    (NotifySettings)  settings to store for the <code>notifyType</code>
    // @see configureDefaultSettings
    // @visibility external
    //<
    configureMessages : function (notifyType, settings) {
        // initialize the default notifyType categories lazily now
        if (!this._settingsInitialized) this._initializeSettings();

        // if needed, default notifyType to "message"
        if (!notifyType) notifyType = this._$message;

        // if the previous configuration has already been used, we must clear out all state
        if (this.typeState[notifyType]) {
            if (this.logIsInfoEnabled("notify")) {
                this.logInfo("configureMessages(): destroying all state and widgets " +
                    "associated with the current configuration of notifyType: " + notifyType,
                    "notify");
            }
            this._destroyMessages(notifyType);
        }

        // initialize new NotifySettings with defaults, or update existing NotifySettings
        var typeSettings = this.settings[notifyType];
        if (typeSettings) isc.addProperties(typeSettings, settings);
        else this.settings[notifyType] = this._initNotifySettings(notifyType, settings);

        this.logInfo("configureMessages(): Changed settings for NotifyType: " + notifyType,
                     "notify");
    },

    //> @classMethod Notify.configureDefaultSettings()
    // Changes the default settings that are applied when you create a new +link{NotifyType}
    // with +link{configureMessages()}.  If you want to change the defaults for the built-in
    // NotifyTypes "message", "warn", and "error", with this method, it must be called before
    // the first call to +link{configureMessages()} or +link{addMessage()}.  Once a NotifyType
    // has been created, you must use +link{configureMessages()} to change its settings.
    // <P>
    // Note that for defaults that depend on priority (and thus differ between the built-in
    // NotifyTypes), this method only sets the defaults for the "message" NotifyType.
    // 
    // @param  settings  (NotifySettings)  changes to NotifyType defaults
    // @see configureMessages
    // @visibility external
    //<
    configureDefaultSettings : function (settings) {
        var commonDefaults = this.commonDefaults,
            priorityDefaults = this._messageDefaults;
        // update global NotifyType defaults or priority-related "message" notifyType defaults
        for (var prop in settings) {
            var targetDefaults = prop in priorityDefaults ? priorityDefaults : commonDefaults;
            targetDefaults[prop] = settings[prop];
        }
        this.logInfo("configureDefaultSettings(): Changed global defaults for new NotifyTypes",
                     "notify");
    },


    ////////////////////////////////////////////////////////////////////////////////
    // Message Content Update

    //> @classMethod Notify.setMessageContents() [A]
    // Updates the contents of the message from what was passed originally to
    // +link{addMessage()}, while preserving any existing +link{NotifyAction,actions}.
    // <P>
    // The purpose of this method is to support messages that contain timer countdowns or other
    // data that perhaps need refreshing during display.  If you find yourself replacing the
    // entire content with something new, you should probably just add it as a new message.
    // <P>
    // Note that this method has minimal animation support.  The change in message content and
    // corresponding resizing are instant, but the repositioning of the message or stack (if
    // stacked) to keep your requested +link{notifySettings.position,alignment} is controlled
    // by +link{notifySettings.repositionMethod}, allowing slide animation.  However, that
    // setting is ignored and the repositioning is instant if you've chosen
    // +link{notifySettings.positionCanvas,viewport alignment} to a border or corner along
    // the +link{notifySettings.position,bottom or right} viewport edge, or if an animation is
    // already in progress, in which case the instant repositioning will happen after it
    // completes.
    // @param  messageID  (MessageID)   message identifier from +link{addMessage()}
    // @param  contents   (HTMLString)  updated message
    // @visibility external
    //<
    
    setMessageContents : function (messageID, contents, actions) {
        if (!this._isValidMessageID(messageID)) {
            this.logWarn("setMessageContents(): can't set contents - invalid messageID",
                         "notify");
            return;
        }
        var messageState = messageID.messageState,
            typeState = this.typeState[messageID.notifyType]
        ;
        

        if (!this._canDismissMessage(typeState, messageState)) {
            this.logInfo("setMessageContents(): that message was dismissed - nothing to do",
                         "notify");
            return;
        }
        
        var undef;

        // default method arguments from existing message state
        if (contents == null) contents = messageState.contents;
        if (actions === undef) actions = messageState.actions;

        // sanity check - we require contents or at least one titled NotifyAction
        if (!contents & !this._hasTitledActions(actions)) {
            this.logWarn("setMessageContents(): you must either provide valid contents for " +
                         "the message, or at least one NotifyAction with a title", "notify");
            return;
        }
        // save changes to message state
        messageState.contents = contents;
        messageState.actions  = actions;
        
        if (this.logIsDebugEnabled("notify")) {
            this.logDebug("setMessageContents(): updating message with notifyType: " +
                messageID.notifyType + " to have contents: '" + contents + "'", "notify");
        }
            
        // update the message contents
        if (actions && actions.length) {
            var actionHTML = this._getActionHTML(messageState);
            if (actionHTML) contents = contents ? contents + actionHTML : actionHTML;
        }

        // if an animation is in progress, then queue the contents update
        
        if (typeState.op != null) {
            var replaceQueue = typeState.replaceQueue;
            if (!replaceQueue.contains(messageState)) {
                replaceQueue.add(messageState);
            }
            messageState._labelContents = contents;
            return;
        }
        

        this._setMessageContents(typeState, messageState, contents);
    },        
        
    _setMessageContents : function (typeState, messageState, contents) {
        if (!this._canDismissMessage(typeState, messageState)) {
            this.logInfo("setMessageContents(): that message was dismissed - nothing to do",
                         "notify");
            return;
        }

        var label = messageState.label,
            settings = messageState.settings;
        

        // cache viewport size so we can restore bottom or right alignment
        var fixViewport = this._hasViewportDependentAlignment(settings);
        if (fixViewport) {
            this._pageWidth  = isc.Page.getScrollWidth();
            this._pageHeight = isc.Page.getScrollHeight();
        }

        

        
        label.setContents(contents);

        // recalculate the autofit based on new contents
        this._autoFitMessageContents(settings, label);

        // update cached message width and height
        
        label.redraw("contents changed");
        messageState.width  = label.getVisibleWidth();
        messageState.height = label.getVisibleHeight();

        // reposition stack or message now, instantly if on the bottom or right edge or delayed
        this._fixStackOrMessagePosition(typeState, fixViewport || messageState._labelContents);
        if (fixViewport) delete this._pageWidth, delete this._pageHeight;
    },

    
    _applyContentsToMessages : function (typeState) {
        var replaceQueue = typeState.replaceQueue;
        for (var i = 0; i < replaceQueue.length; i++) {
            var message = replaceQueue[i];
            this._setMessageContents(typeState, message, message._labelContents);
            delete message._labelContents;
        }
        replaceQueue.length = 0;
    },

    // along the bottom or right viweport edge, overflowed messages can expand the viewport
    _hasViewportDependentAlignment : function (settings) {
        if (settings.positionCanvas) return false;
        // we have viewport-based alignment; check for alignment along bottom or right
        var position = settings.position;
        return position ? position.indexOf("B") >= 0 || position.indexOf("R") >= 0 : false;
    },

    //> @classMethod Notify.setMessageActions()
    // Updates the actions of the message from those, if any, passed originally to
    // +link{addMessage()}, while preserving any existing +link{addMessage(),contents}.
    // <P>
    // See +link{setMessageContents()} for further guidance and animation details.
    // @param  messageID  (MessageID)  message identifier from +link{addMessage()}
    // @param  actions    (Array of NotifyAction)  updated actions for this message
    // @visibility external
    //<
    setMessageActions : function (messageID, actions) {
        this.setMessageContents(messageID, null, actions);
    },

    //> @classMethod Notify.messageHasActions()
    // @param   messageID  (MessageID)  message identifier to check
    // @return  (boolean)  whether message has any actions
    // @see addMessage()
    // @see setMessageActions()
    // @visibility external
    //<
    messageHasActions : function (messageID) {
        if (this._isValidMessageID(messageID)) {
            var messageState = messageID.messageState,
                actions = messageState ? messageState.actions : null;
            return actions && actions.length > 0;
        }
    },


    ////////////////////////////////////////////////////////////////////////////////
    // Message Queue

    
    _prepareForNewMessage : function (typeState, settings) {
        var messages = typeState.liveMessages;
        if (messages.length == 0 || 
            settings.multiMessageMode == "stack" && messages.length < settings.maxStackSize)
        {
            return typeState.op == null;
        }
        var message = typeState.opMessage,
            dismiss = typeState.dismissQueue
        ;
        if (dismiss.length > 0 || message && message.dismissed) return false;

        // dismiss the least important message to make room for the new message
        var doomedMessage = this._getLeastImportantMessage(typeState, settings);
        return this._dismissMessage(typeState, doomedMessage);
    },

    
    _getLeastImportantMessage : function (typeState, settings) {
        var messages = typeState.liveMessages;
        
        if (messages.length == 1) return messages[0];

        // calculate the lowest priority (highest number) of any message
        var lowestPriority = 0;
        for (var i = 0; i < messages.length; i++) {
            var messageSettings = messages[i].settings;
            if (lowestPriority < messageSettings.messagePriority) {
                lowestPriority = messageSettings.messagePriority;
            }
        }
        // now trim to that priority the available candidates to dismiss 
        messages = messages.filter(function (message) {
            return message.settings.messagePriority == lowestPriority;
        });

        // in "countdown" mode, pick the message with the least time left to live
        if (settings.maxStackDismissMode == "countdown" && messages.length > 1) {
            var lowestFireTime, dismissIndex;
            for (var i = messages.length - 1; i >= 0; i--) {
                var dismissEvent = messages[i].dismissEvent;
                if (!dismissEvent) continue;

                var fireTime = isc.Timer.getTimeoutFireTime(dismissEvent);
                if (lowestFireTime == null || fireTime < lowestFireTime) {
                    lowestFireTime = fireTime;
                    dismissIndex = i;
                }
            }
            // if any message had a timeout, we should have a dismissIndex
            if (dismissIndex != null) return messages[dismissIndex];
        }

        
        return messages[0];
    },

    // process pending dismiss requests and added messages
    
    _processMessageQueue : function (typeState) {
        var dismiss = typeState.dismissQueue;
        while (dismiss.length > 0 && typeState.op == null) {
            this._dismissMessage(typeState, dismiss.removeAt(0));
        }
        var pending = typeState.pendingQueue;
        while (pending.length > 0 && this._prepareForNewMessage(typeState, pending[0].settings))
        {
            this._addMessage(typeState, pending.removeAt(0));
        }
    },

    // for dismissals, we want to remove the message before procesing pending messages
    _completeMessageHandling : function (typeState, messageState, stackCoords, dismiss) {
        if (dismiss) {
            var stack = typeState.stack,
                label = messageState.label,
                messages = typeState.liveMessages
            ;
            
            if (label) label.destroy();
            messages.remove(messageState);
            
            if (stack && !messages.length) {
                //stack.moveTo(stackCoords[0], stackCoords[1]);
            }
        }
        this._processMessageQueue(typeState);        
    },


    ////////////////////////////////////////////////////////////////////////////////
    // Label/Action Creation

    
    _createMessageLabel : function (typeState, messageState) {
        var actions = messageState.actions,
            settings = messageState.settings,
            contents = messageState.contents,
            notifyType = typeState.notifyType
        ;
        // required label-related settings
        var styleName       = settings.styleName,
            messageIcon     = settings.messageIcon,
            iconOrientation = settings.messageIconOrientation
        ;        

        var label = messageState.label = isc.NotifyLabel.create(settings.labelProperties,
            {
                contents: contents,
                notifyType: notifyType,
                messageState: messageState,
                styleName: styleName,

                animateShowTime: settings.fadeInDuration,
                animateHideTime: settings.fadeOutDuration
            },
            settings.zIndex ? {zIndex: settings.zIndex} : null,

            messageIcon                 ? {icon:               messageIcon} : null,
            iconOrientation             ? {iconAlign:      iconOrientation,
                                          iconOrientation: iconOrientation} : null,
            settings.messageIconSpacing ? {iconSpacing: settings.messageIconSpacing} : null,
            settings.messageIconWidth   ? {iconWidth:   settings.messageIconWidth}   : null,
            settings.messageIconHeight  ? {iconHeight:  settings.messageIconHeight}  : null);

        if (actions && actions.length) {
            var actionHTML = this._getActionHTML(messageState);
            if (actionHTML) contents = contents ? contents + actionHTML : actionHTML;
            label.setContents(contents);
        }
        label.bringToFront();

        
        label._origWidth = label.getWidth();
        this._autoFitMessageContents(settings, label);
        label.draw();

        // cache this message's width and height
        
        messageState.width  = label.getVisibleWidth();
        messageState.height = label.getVisibleHeight();
    },

    _autoFitMessageContents : function (settings, label) {
	    if (!settings.autoFitWidth) return;

	    // warn of potentially unintentional and suboptimal autoFitWidth: true + wrap: false
	    if (label.wrap == false) {
	        this.logWarn("addMessage(): autoFitWidth:true specified in " + 
                "conjunction with wrap:false.  These settings are usually not intended " +
                "to be used in conjunction as autoFitWidth is specifically intended to " +
                "allow text to wrap when autoFitMaxWidth would otherwise be exceeded.",
                "notify");
        }

        var contents = label.contents,
            origWidth = label._origWidth,
            wrapWidth = isc.Hover._getAutoFitWidth(settings, label, contents)
        ;

        // if the computed autofit width exceeds the original label width, apply it
	    if (wrapWidth > origWidth) {
            if (this.logIsDebugEnabled("notify")) {
	            this.logDebug("addMessage(): message shown with autoFitWidth enabled. " +
                    "It will expand from specified width:" + origWidth + " to content width:" +
                    wrapWidth, "notify");
            }
	        label.setWidth(wrapWidth);
	    }
    },

    
    _addMessageWidgets : function (unmaskedList) {
        for (var notifyType in this.typeState) {
            var typeState = this.typeState[notifyType];
            if (typeState.stack) unmaskedList.add(typeState.stack);
            // liveMessages - visible notifications
            var liveMessages = typeState.liveMessages;
            for (var i = 0; i < liveMessages.length; i++) {
                var label = liveMessages[i].label;
                if (!label.parentElement) unmaskedList.add(label);
            }
            // dismissQueue - these are still visible
            var dismissQueue = typeState.dismissQueue;
            for (var i = 0; i < dismissQueue.length; i++) {
                var label = dismissQueue[i].label;
                if (!label.parentElement) unmaskedList.add(label);
            }
        }
    },
            
    _getActionHTML : function (messageState) {
        var label = messageState.label,
            actions = messageState.actions,
            settings = messageState.settings,
            separate = !!messageState.contents,
            styleName = settings.actionStyleName
        ;
        var actionHTML = isc.StringBuffer.create();
        for (var i = 0; i < actions.length; i++) {
            var action = actions[i],
                title = action.title;
            if (title) {
                if (separate) actionHTML.append(action.separator || settings.actionSeparator); 
                if (action.wholeMessage) actionHTML.append(title);
                else {
                    actionHTML.append("<span eventpart='action' id='", label.getID(),
                        "_action_", i, "' class='", styleName, "'>", title, "</span>");
                }
                separate = true;
            }
        }
        return actionHTML.toString();
    },


    ////////////////////////////////////////////////////////////////////////////////
    // Coordinates and Positioning

    // resolve the desired location of the message into x, y coordinates
    _getMessageCoords : function (typeState, messageState) {
        var settings = messageState.settings;
        if (settings.x != null && settings.y != null) return [settings.x, settings.y];

        var label = messageState.label,
            container = settings.positionCanvas
        ;
        

        var position = settings.position;
        if (!position) {
            if (container) position = "C";
            else {
                position = settings.slideInOrigin || settings.slideOutOrigin;
                if (!position || !position.match(/[TBRLC]/)) position = "L";
            }
        }

        return this._getPositionCoords(typeState, messageState, position, container);
    },

    // resolve the desired location of the stack into x, y coordinates;
    // includes messageState's label unless isDismiss has been set
    _getStackCoords : function (typeState, messageState, isDismiss) {
        var latestMessage = typeState.liveMessages.last(),
            latestSettings = latestMessage.settings;
        if (latestSettings.x != null && latestSettings.y != null) {
            return [latestSettings.x, latestSettings.y];
        }
        var container = latestSettings.positionCanvas;

        

        var position = latestSettings.position;
        if (!position) {
            if (container) position = "C";
            else {
                var settings = messageState.settings;
                position = settings.slideInOrigin || settings.slideOutOrigin;
                if (!position || !position.match(/[TBRLC]/)) position = "L";
            }
        }

        return this._getPositionCoords(typeState, messageState, position, container, isDismiss);
    },

    // get the slide start/end coordinates of the message - these should be just _off screen_
    _getSlideOriginCoords : function (typeState, messageState, configCoords, isSlideIn) {
        var label = messageState.label,
            settings = messageState.settings,
            origin = isSlideIn ? settings.slideInOrigin : settings.slideOutOrigin
        ;

        

        var left = configCoords ? configCoords[0] : label.getPageLeft(),
            top  = configCoords ? configCoords[1] : label.getPageTop()
        ;

        var nearest = messageState.nearest || 
                this._getNearestEdge(typeState, messageState, left, top)
        ;
        if (!origin || !origin.match(/[TBRL]/)) {
            if (isSlideIn && !settings.defaultSlideOutToNearest) {
                messageState.nearest = nearest;
            }
            origin = nearest;
        }

        return this._getPositionCoords(typeState, messageState, origin, null, null, left, top);
    },

    _getPositionCoords : function (typeState, messageState, position, container, isDismiss, 
                                   left, top) 
    {
        var containerLeft, containerTop,
            containerWidth, containerHeight
        ;
        if (container) {
            containerLeft = container.getPageLeft();
            containerTop = container.getPageTop();
            containerWidth = container.getVisibleWidth();
            containerHeight = container.getVisibleHeight();
        } else {
            containerLeft = containerTop = 0;
            // use cached viewport size when repositioning due to content change
            
            containerWidth  = this._pageWidth  || isc.Page.getScrollWidth();
            containerHeight = this._pageHeight || isc.Page.getScrollHeight();
        }

        var isStack = isDismiss != null,
            isSlide = left != null && top != null
        ;

        
        var firstMessage = isDismiss ? typeState.liveMessages.last() : messageState,
            firstSettings = firstMessage.settings,
            width = firstMessage.width,
            height = firstMessage.height,
            xOffset = 0, yOffset = 0
        ;

        // when stacking messages, adjust width and height based on stack size
        if (isStack) {
            var stackSize = this._getPostEffectsStackSize(typeState, isDismiss ? 
                                                          messageState : null);
            switch (firstSettings.stackDirection) {
            case "down": case "right":
                switch (position) {
                case "BR":
                    height = stackSize[1];
                    width = stackSize[0];
                case "B": case "BL":
                    height = stackSize[1];
                    break;
                case "R": case "TR":
                    width = stackSize[0];
                    break;
                default:
                case "T": case "L": case "C": case "TL":
                    break;
                }
                break;
            case "up":
                switch (position) {
                case "R": case "BR":
                    width = stackSize[0];
                    // fall through
                case "B": case "L": case "C": case "BL":
                    yOffset = height - stackSize[1];
                    break;
                case "TR":
                    width = stackSize[0];
                    // fall through
                case "T": case "TL":
                    height = stackSize[1];
                    break;
                }
                break;
            case "left":
                switch (position) {
                case "B": case "BR":
                    height = stackSize[1];
                    // fall through
                case "R": case "C": case "T": case "TR":
                    xOffset = width - stackSize[0];
                    break;
                case "BL":
                    height = stackSize[1];
                    // fall through
                case "L": case "TL":
                    width = stackSize[0];
                    break;
                }
                break;
            }
        }

        

        switch (position) { // left/x coordinate
        case "L": case "TL": case "BL":
            left = containerLeft;
            if (isSlide) left -= width;
            break;
        case "R": case "TR": case "BR":
            left = containerLeft + containerWidth;
            if (!isSlide) left -= width;
            break;
        default:
        //case "T": case "B": case "C":
            if (!isSlide) left = Math.floor(containerLeft + containerWidth / 2 - width / 2);
            break;
        }
        switch (position) { // top/y coordinate
        case "T": case "TL": case "TR":
            top = containerTop;
            if (isSlide) top -= height;
            break;
        case "B": case "BL": case "BR":
            top = containerTop + containerHeight;
            if (!isSlide) top -= height;
            break;
        default:
        //case "L": case "R": case "C": 
            if (!isSlide) top = Math.floor(containerTop + containerHeight / 2 - height / 2);
            break;
        }

        return [left + xOffset, top + yOffset];
    },

    // calculate the viewport edge nearest to the provided x, y coordinates
    _getNearestEdge : function (typeState, messageState, left, top) {
        var viewportWidth = isc.Page.getScrollWidth(),
            viewportHeight = isc.Page.getScrollHeight()
        ;
        var rightOffset  = viewportWidth - left - messageState.width,
            bottomOffset = viewportHeight - top - messageState.height
        ;
        if (left <= rightOffset) {
            if (top <= bottomOffset) return left <= top          ? "L" : "T";
            else                     return left <= bottomOffset ? "L" : "B";
        } else {
            if (top <= bottomOffset) return rightOffset <= top          ? "R" : "T";
            else                     return rightOffset <= bottomOffset ? "R" : "B";
        }
    },

    _getStackedMessageCoords : function (typeState, messageState, stackCoords) {
        var direction = messageState.settings.stackDirection,
            messageLeft = stackCoords[0], messageTop = stackCoords[1];
        if (direction == "up" || direction == "left") {
            var stackSize = this._getPostEffectsStackSize(typeState);
            if (direction == "up") messageTop += stackSize[1] - messageState.height;
            else                  messageLeft += stackSize[0] - messageState.width;
        }
        return [messageLeft, messageTop];
    },

    _getPostEffectsStackSize : function (typeState, excludedMessage) {
        var liveMessages = typeState.liveMessages;
        if (!liveMessages.length) return [1, 1];

        var width = 0, height = 0,
            stack = typeState.stack,
            vertical = stack.vertical
        ;
        for (var i = 0; i < liveMessages.length; i++) {
            var messageState = liveMessages[i];
            if (messageState == excludedMessage) continue;

            var messageWidth = messageState.width,
                messageHeight = messageState.height
            ;
            if (vertical) {
                if (height > 0) height += stack.membersMargin;
                if (messageWidth > width) width = messageWidth;
                height += messageHeight;
            } else {
                if (width > 0) width += stack.membersMargin;
                if (messageHeight > height) height = messageHeight;
                width += messageWidth;
            };
        }
        return [width, height];
    },


    ////////////////////////////////////////////////////////////////////////////////
    // Animation/Stack Mechanics - Common

    // compute a duration given two points and a slideSpeed in pixels/second
    _getSlideDuration : function (startX, startY, endX, endY, slideSpeed) {
        if (slideSpeed < 1) slideSpeed = 1;

        var deltaX = endX - startX, deltaY = endY - startY,
            distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
        ;
        return Math.ceil(1000 * distance / slideSpeed);
    },

    _addLabelToStack : function (typeState, messageState, stackCoords, callback) {
        var stack = typeState.stack,
            label = messageState.label,
            direction = messageState.settings.stackDirection,
            addFirst = direction == "down" || direction == "right"
        ;
        stack.addMember(label, addFirst ? 0 : null, null, callback);
        if (stackCoords) stack.moveTo(stackCoords[0], stackCoords[1]);
    },

    // run appropriate animation for the stack during dismissal of a message
    
    _moveStackForDismiss : function (typeState, messageState, stackCoords, callback, duration) {
        var animations = 0,
            stack = typeState.stack;
        if (stack.getLeft() != stackCoords[0] || stack.getTop() != stackCoords[1]) {
            var liveMessages = typeState.liveMessages,
                pendingQueue = typeState.pendingQueue;
            if (liveMessages.length > 1 && pendingQueue.length == 0) {
                stack.animateMove(stackCoords[0], stackCoords[1], callback, duration);
                animations++;
            }
        }
        return animations;
    },

    _moveStackForAdd : function (typeState, messageState, stackCoords, callback, duration) {
        var animations = 0,
            stack = typeState.stack,
            stackLeft = stackCoords[0],
            stackTop = stackCoords[1],
            settings = messageState.settings,
            membersMargin = stack.membersMargin
        ;
        switch (settings.stackDirection) {
        case "right":
            stackLeft += messageState.width + membersMargin;
            break;
        case "down":
            stackTop += messageState.height + membersMargin;
            break;
        }
        if (stack.getLeft() != stackLeft || stack.getTop() != stackTop) {
            stack.animateMove(stackLeft, stackTop, callback, duration);
            animations++;
        }
        return animations;
    },

    // clear tracking of the in-progress animation and then clean up and check message queues
    _completeAnimation : function (typeState, messageState, stackCoords, dismiss) {
        delete typeState.op;
        delete typeState.opCount;
        delete typeState.opMessage;

        if (typeState.stack) {
            typeState.stack._clearAnimation();
        }

        // reposition the stack (or message if not stacking) if contents have changed
        if (typeState.replaceQueue.length > 0) this._applyContentsToMessages(typeState);

        this._completeMessageHandling(typeState, messageState, stackCoords, dismiss);
    },

    // reposition the stack or message to account for contents changing in setMessageContents()
    
    _fixStackOrMessagePosition : function (typeState, forceInstant) {
        var stack = typeState.stack,
            messages = typeState.liveMessages,
            first = messages[0];
        if (!first) return;

        // resolve which target to reposition, and get its message state
        var target, messageState;
        if (stack) {
            messageState = messages.find("label", stack.getMember(0));
            target = stack;
        } else {
            messageState = first;
            target = first.label;
        }
        if (!messageState) return;

        

        // calculate the desired new stack or message coordinates for proper alignment
        var coords = stack ? this._getStackCoords(typeState, messageState, false) :
                             this._getMessageCoords(typeState, messageState);

        // reposition the animation target; skip animation unless possible and configured
        var settings = messageState.settings,
            effect = settings.repositionMethod,
            left = target.left, top = target.top;
        if (effect == "instant"  || coords[0] == left && coords[1] == top || forceInstant) {
            target.moveTo(coords[0], coords[1]);
            return;
        }

        // slide the target to its new coordinates, using slideSpeed setting
        var duration = this._getSlideDuration(left, top, coords[0], coords[1],
                                              settings.slideSpeed);
        target.animateMove(coords[0], coords[1], null, duration);
    },


    ////////////////////////////////////////////////////////////////////////////////
    // "Slide In" Animation

    

    _slideInMessage : function (typeState, messageState, messageCoords, stackCoords) {
        var Notify = this,
            stack = typeState.stack,
            label = messageState.label,
            settings = messageState.settings,
            callback = function () {
                Notify._slideInComplete(typeState, messageState, stackCoords);
            },
            startCoords = this._getSlideOriginCoords(typeState, messageState, messageCoords, 
                                                     true)
        ;
        label.moveTo(startCoords[0], startCoords[1]);

        var animations = 1,
            duration = this._getSlideDuration(startCoords[0], startCoords[1], 
                           messageCoords[0], messageCoords[1], settings.slideSpeed)
        ;
        label.animateMove(messageCoords[0], messageCoords[1], callback, duration);

        if (stack) {
            animations += this._moveStackForAdd(typeState, messageState, stackCoords, callback,
                                                duration);
        }

        
        typeState.op        = "slideIn";
        typeState.opCount   = animations;
        typeState.opMessage = messageState;
    },

    _slideInComplete : function (typeState, messageState, stackCoords) {
        if (--typeState.opCount > 0) return;

        if (typeState.stack) {
            this._addLabelToStack(typeState, messageState, stackCoords);
        }

        this._completeAnimation(typeState, messageState);
    },


    ////////////////////////////////////////////////////////////////////////////////
    // "Fade In" Animation

    

    _prepSlideStack : function (typeState, messageState, messageCoords, stackCoords) {
        var stack = typeState.stack,
            vertical = stack.vertical,
            label = messageState.label,
            settings = messageState.settings,
            duration = settings.fadeInDuration
        ;
        
        

        var animate = this._moveStackForAdd(typeState, messageState, stackCoords, function () {
            isc.Notify._prepSlideComplete(typeState, messageState, messageCoords, stackCoords);
        }, duration);

        if (animate) {
            
            typeState.op        = "slideStack";
            typeState.opMessage = messageState;

        } else {
            this._fadeInMessage(typeState, messageState, messageCoords, stackCoords);
        }
    },

    _prepSlideComplete : function (typeState, messageState, messageCoords, stackCoords) {
        delete typeState.op;
        delete typeState.opMessage;

        this._fadeInMessage(typeState, messageState, messageCoords, stackCoords);
    },

    _fadeInMessage : function (typeState, messageState, messageCoords, stackCoords) {
        var Notify = this,
            stack = typeState.stack,
            label = messageState.label,
            settings = messageState.settings,
            callback = function () {
                Notify._fadeInComplete(typeState, messageState);
            }
        ;
        if (stack) {
            var duration = settings.fadeInDuration;
            stack._setAnimation("fade", duration);
            this._addLabelToStack(typeState, messageState, stackCoords, callback);
        } else {
            label.hide();
            label.moveTo(messageCoords[0], messageCoords[1]);
            label.animateShow(null, callback);
        }

        
        typeState.op        = "fadeIn";
        typeState.opMessage = messageState;
    },

    _fadeInComplete : function (typeState, messageState) {
        if (--typeState.opCount > 0) return;
        this._completeAnimation(typeState, messageState);
    },


    ////////////////////////////////////////////////////////////////////////////////
    // "Slide Out" Animation

    

    _slideOutMessage : function (typeState, messageState, stackCoords) {
        var Notify = this,
            stack = typeState.stack,
            label = messageState.label,
            settings = messageState.settings,
            startLeft = label.getPageLeft(),
            startTop = label.getPageTop()
        ;

        var animations = 1,
            callback = function () {
                Notify._slideOutComplete(typeState, messageState, stackCoords);
            },
            endCoords = this._getSlideOriginCoords(typeState, messageState),
            duration = this._getSlideDuration(startLeft, startTop, endCoords[0], endCoords[1],
                                              settings.slideSpeed)
        ;

        if (stack) {
            // size the placeholder to match the label, and make sure it's visible
            var placeholder = typeState.placeholder;
            placeholder.resizeTo(label.getVisibleWidth(), label.getVisibleHeight());
            placeholder.show();

            // replace label with placeholder, but then draw the label right where it was before
            stack._replaceMember(label, placeholder);
            label.moveTo(startLeft, startTop);
            label.moveAbove(stack);
            label.draw();

            // slide the stack's placeholder slot closed
            stack._setAnimation("slide", duration);
            stack.removeMember(placeholder, null, callback);
            animations++;

            // slide the stack into its new desired position (if it's changed)
            animations += this._moveStackForDismiss(typeState, messageState, stackCoords,
                                                    callback, duration);
        }

        // slide the label off screen to the configured or nearest screen edge
        label.animateMove(endCoords[0], endCoords[1], callback, duration, duration);

        
        typeState.op        = "slideOut";
        typeState.opCount   = animations;
        typeState.opMessage = messageState;
    },

    _slideOutComplete : function (typeState, messageState, stackCoords) {
        if (--typeState.opCount > 0) return;
        this._completeAnimation(typeState, messageState, stackCoords, true);
    },


    ////////////////////////////////////////////////////////////////////////////////
    // "Fade Out" Animation

    

    _fadeOutMessage : function (typeState, messageState, stackCoords) {
        var Notify = this, 
            animations = 1,
            stack = typeState.stack,
            label = messageState.label,
            settings = messageState.settings,            
            callback = function () {
                Notify._fadeOutComplete(typeState, messageState, stackCoords, slideStack);
            }
        ;

        if (stack) {
            var duration = settings.fadeOutDuration,
                slideStack = stack.members.last() != messageState.label
            ;
            // fade out dismissed member; stack will be "slid closed" later
            if (slideStack) { 
                label.animateFade(0, callback, duration);

            // optimized case - no separate stack "slide closed" is required
            } else { 
                stack._setAnimation("fade", duration);
                stack.removeMember(label, null, callback);

                animations += this._moveStackForDismiss(typeState, messageState, stackCoords,
                                                        callback, duration);
            }
        } else {
            label.animateHide(null, callback);
        }

        
        typeState.op        = "fadeOut";
        typeState.opCount   = animations;
        typeState.opMessage = messageState;
    },

    _fadeOutComplete : function (typeState, messageState, stackCoords, slideStack) {
        if (--typeState.opCount > 0) return;

        delete typeState.op;
        delete typeState.opCount;
        delete typeState.opMessage;

        if (slideStack) {
            this._slideClosedStack(typeState, messageState, stackCoords);
        } else {
            this._completeAnimation(typeState, messageState, stackCoords, true);
        }
    },

    _slideClosedStack : function (typeState, messageState, stackCoords) {
        var animations = 1,
            stack = typeState.stack,
            vertical = stack.vertical,
            label = messageState.label,
            settings = messageState.settings,
            duration = settings.fadeOutDuration,
            callback = function () {
                isc.Notify._slideClosedComplete(typeState, messageState, stackCoords);
            };
        ;

        
        if (this._canUpdateStackInstantly(typeState, messageState, stackCoords)) {
            stack.removeMember(label);
            stack.moveTo(stackCoords[0], stackCoords[1]);
            this._completeMessageHandling(typeState, messageState, stackCoords, true);
            return;
        }

        

        stack._setAnimation("slide", duration);
        stack.removeMember(label, null, callback);

        animations += this._moveStackForDismiss(typeState, messageState, stackCoords, callback,
                                                duration);

        
        typeState.op        = "slideClosed";
        typeState.opCount   = animations;
        typeState.opMessage = messageState;        
    },

    _slideClosedComplete : function (typeState, messageState, stackCoords) {
        if (--typeState.opCount > 0) return;
        this._completeAnimation(typeState, messageState, stackCoords, true);
    },

     _canUpdateStackInstantly : function (typeState, messageState, stackCoords) {
         var settings = messageState.settings,
             direction = settings.stackDirection,
             pendingQueue = typeState.pendingQueue,
             liveMessages = typeState.liveMessages
         ;
         if (liveMessages.length < 2 || pendingQueue.length || 
             direction == "down" || direction == "right") 
         {
             return;
         }
         var stack = typeState.stack,
             label = messageState.label;
         if (label != stack.members.first()) return;

         var second = stack.members[1];
         if (second.getPageLeft() == stackCoords[0] && 
             second.getPageTop()  == stackCoords[1]) 
         {
             return true;
         }
         return false;
     }

});

// define a default static label config for notification labels
isc.defineClass("NotifyLabel", "Label").addProperties({

    width: 1, height: 1,
    animateHideEffect: "fade",
    animateShowEffect: "fade",
    left: 0, top: -1000, 
    autoDraw: false,

    
    _getAfterPadding : function () {
        return this._afterPadding ? this._afterPadding : null;
    },

    _notifyZLayer: true,

    
    ID: null,

    closeButtonConstructor: "ImgButton",
    closeButtonDefaults: {
        snapTo:         isc.Page.isRTL() ? "L" : "R",
        snapOffsetLeft: isc.Page.isRTL() ?   8 :  -8,
        imageType: "center",

        showDown: false,
        showRollOver: false,

        src: "[SKINIMG]/Notify/close.png",
        click : function () {
            var label = this.creator,
                typeState = isc.Notify.typeState[label.notifyType];
            isc.Notify._dismissMessage(typeState, label.messageState);
        }
    },

    closeButtonSize: 12,

    initWidget : function () {
        this.Super("initWidget", arguments);

        // configure the closeButton if canDismiss is set
        var size = this.closeButtonSize,
            settings = this.messageState.settings;
        if (settings.canDismiss) {
            this.addAutoChild("closeButton", {
                size: size, imageWidth: size, imageHeight: size
            });
            // padding may be needed depending on the applied style
            var controlPadding = settings.messageControlPadding;
            if (controlPadding) this._afterPadding = controlPadding;
        }
    },
    click : function () {
        var messageState = this.messageState,
            actions = messageState.actions;
        if (!actions) return;

        for (var i = 0; i < actions.length; i++) {
            var action = actions[i];
            if (action.wholeMessage) {
                isc.Class.fireCallback(action);
            }
        }
    },
    actionClick : function (element, ID, event) {
        

        var messageState = this.messageState,
            action = messageState.actions[ID];
        if (!action) return;
        // fire target[methodName] if defined (or method for SGWT)
        if (action.target && action.methodName || action.method) {
            isc.Class.fireCallback(action);
            return false;
        }
    }

});

//> @type NotifyType
// An identifier passed to +link{Notify} APIs to group related messages together so that they
// all use the same behavior and display settings.
// @baseType Identifier
// @see Notify.addMessage()
// @see Notify.configureMessages()
// @see Notify.dismissMessage()
// @visibility external
//<


////////////////////////////////////////////////////////////////////////////////
// NotifySettings

//> @object NotifySettings
// An object used to configure how messages shown by +link{Notify.addMessage()} are drawn and
// behave.
// @see Notify.addMessage()
// @see Notify.configureMessages()
// @treeLocation Client Reference/System
// @visibility external
//<

isc.Notify.addClassMethods({

    commonDefaults: {
        //> @attr notifySettings.duration (int : 5000 : IR)
        // Length of time a message is shown before being auto-dismissed, in milliseconds.
        // A value of 0 means that the message will not be dismissed automatically.
        // Messages can always be dismissed by calling +link{Notify.dismissMessage()} or,
        // if +link{canDismiss} is set, by performing a "close click".
        // @visibility external
        //<
        duration: 5000,

        //> @attr notifySettings.stayIfHovered (boolean : false : IR)
        // If true, pauses the auto-dismiss countdown timer when the mouse is over the
        // messasge.
        // @visibility external
        //<
        
        //> @attr notifySettings.x (Integer : null : IR)
        // Where to show the message, as a viewport-relative x coordinate offset to the
        // left edge of the +link{Label} rendering the message.  Properties +link{position}
        // and +link{positionCanvas} will only be used to place messages if coordinates
        // aren't provided.
        // @see y
        // @visibility external
        //<

        //> @attr notifySettings.y (Integer : null : IR)
        // Where to show the message, as a viewport-relative y coordinate offset to the top
        // edge of the +link{Label} rendering the message.
        // @see x
        // @visibility external
        //<

        //> @attr notifySettings.position (EdgeName : varies : IR)
        // Where to show the message, specified as an edge ("T", "B", "R", "L"), a corner
        // ("TL", "TR", "BL", "BR), or "C" for center,  similar to +link{canvas.snapTo}.
        // If an edge is specified, the message will be shown at its center (or the very
        // center for "C").  Only used if +link{x,coordinates} haven't been provided.
        // <P>
        // If a +link{positionCanvas} has been specified, the <code>position</code> is
        // interpreted relative to it instead of the viewport, and this property defaults
        // to "C".  Otherwise, if no <code>positionCanvas</code> is present, the default is
        // to use +link{slideInOrigin} or +link{slideOutOrigin}, or "L" if neither property
        // is defined.
        // @visibility external
        //<

        //> @attr notifySettings.positionCanvas (Canvas : null : IR)
        // Canvas over which to position the message, available as an alternative means of
        // placement if viewport-relative +link{x,coordinates} aren't provided.  Note that
        // the canvas is only used to compute where to the place message, and will not be
        // altered.
        // @see x
        // @visibility external
        //<

        //>@type NotifyTransition
        // @value  "slide"    message slide-animates onto or off of the screen
        // @value  "fade"     message appears or disappears via a fade effect
        // @value  "instant"  message instantly appears or disappears
        // @visibility external
        //<

        //> @attr notifySettings.appearMethod (NotifyTransition : "slide" : IR)
        // Controls how messages appear at or reach their requested location.  The default
        // of "slide" is recommended because the motion will draw the user's attention to
        // the notification.
        // @visibility external
        //<
        appearMethod: "slide",

        //> @attr notifySettings.disappearMethod (NotifyTransition : "fade" : IR)
        // Controls how messages disappear from or leave their requested location.  The
        // default of "fade" is recommended because a slide animation would draw too much
        // attention to a notification that is no longer current, whereas a subtle fade
        // should draw a minimum of attention (less even than instantaneously
        // disappearing).
        // @visibility external
        //<
        disappearMethod: "fade",

        //> @attr notifySettings.repositionMethod (NotifyTransition : "slide" : IR)
        // Controls how the stack or message is repositioned, if required, after
        // +link{notify.setMessageContents()} has been called.  Valid values are "slide" and
        // "instant".
        // @visibility external
        //<        
        repositionMethod: "slide",

        //> @attr notifySettings.canDismiss (Boolean : false : IR)
        // Displays an icon to allow a message to be dismissed through the UI.  Messages
        // can always be dismissed programmatically by calling
        // +link{Notify.dismissMessage()}.
        // @visibility external
        //<

        //> @attr notifySettings.slideInOrigin (String : null : IR)
        // Determines where messages originate when they appear for +link{appearMethod}:
        // "slide".  Possible values are "L", "R", "T", and "B".
        // <P> 
        // If not specified, the edge nearest the message's requested coordinates or
        // position is used.
        // @visibility external
        //<

        //> @attr notifySettings.slideOutOrigin (String : null : IR)
        // Determines where messages go when they disappear for +link{disappearMethod}:
        // "slide".  Possible values are "L", "R", "T", and "B".  <P> If not specified, the
        // edge nearest the message's requested coordinates or position is used.
        // @visibility external
        //<

        //> @attr notifySettings.defaultSlideOutToNearest (boolean : false : IR)
        // If +link{disappearMethod} is "slide", should we default +link{slideOutOrigin} to
        // the edge nearest to the location of a message at the moment it's dismissed?  The
        // default value of false means that if +link{appearMethod} is "slide" and
        // +link{slideInOrigin} isn't set, we'll reuse the edge nearest to the initial
        // location of the message to default +link{slideOutOrigin}, if needed, so that the
        // message slides in from, and out to, the same edge.
        //<

        //> @attr notifySettings.slideSpeed (int : 300 : IR)
        // Animation speed for +link{NotifyTransition}: "slide", in pixels/second.
        // @visibility external
        //<
        slideSpeed: 300,

        //> @attr notifySettings.fadeInDuration (int : 500 : IR)
        // Time over which the fade-in effect runs for +link{NotifyTransition}: "fade", in
        // milliseconds.
        // @visibility external
        //<
        fadeInDuration: 500,

        //> @attr notifySettings.fadeOutDuration (int : 500 : IR)
        // Time over which the fade-out effect runs for +link{NotifyTransition}: "fade", in
        // milliseconds.
        // @visibility external
        //<
        fadeOutDuration: 500,

        //> @type MultiMessageMode
        // @value  "stack"  messages of the same +link{NotifyType} are arranged in a stack
        // @value  "replace"  messages of the same +link{NotifyType} replace each other
        // @visibility external
        //<

        //> @attr notifySettings.multiMessageMode (MultiMessageMode : "stack": IR)
        // Determines what happens if a message appears while there's still another one of
        // the same +link{NotifyType} being shown.  Such messages are either stacked or
        // replace one another,
        // @visibility external
        //<
        multiMessageMode: "stack",

        //> @type StackDirection
        // @value  "up"     older messages move up
        // @value  "down"   older messages move down
        // @value  "right"  older messages move right
        // @value  "left"   older messages move left
        // @visibility external
        //<

        //> @attr notifySettings.stackDirection (StackDirection : "down" : IR)
        // Determines how messages are stacked if +link{multiMessageMode} is "stack".  For
        // example, "down" means that older messages move down when a new message of the
        // same +link{NotifyType} appears.
        // @visibility external
        //<
        stackDirection: "down",

        //> @attr notifySettings.stackSpacing (int : 2 : IR)
        // Space between each message when +link{multiMessageMode} is "stack".
        // @visibility external
        //<
        stackSpacing: 2,

        //> @attr notifySettings.maxStackSize (int : 3 : IR)
        // Sets a limit on how many messages may be stacked if +link{multiMessageMode} is
        // "stack".  The oldest message of the affected +link{NotifyType} will be dismissed
        // to enforce this limit.
        // @visibility external
        //<
        maxStackSize: 3,

        //> @type StackPersistence
        // @value  "none"   older messages disappear as if unrelated
        // @value  "reset"  older messages have their duration timers reset so they stick
        //                  around as long as the new message if they've got less time left 
        //                  than that message
        // @visibility external
        //<

        //> @attr notifySettings.stackPersistence (StackPersistence : "none" : IRA)
        // Controls how older messages' +link{duration} countdowns are affected when a new
        // message of the same +link{NotifyType} appears.  We either continue the
        // countdowns on the older messages as if they are unrelated, or we reset any
        // countdowns that are less than the new message's <code>duration</code>.
        // <P>
        // Note that you can set this property in a call to +link{NOtify.addMessage()} even
        // though it has "stack" in its name, since it governs the logic run on behalf of
        // this message.
        // @visibility external
        //<
        stackPersistence: "none",

        //> @type MaxStackDismissMode
        // @value  "oldest"     dismiss the oldest message 
        // @value  "countdown"  dismiss the message with least time left
        // @visibility external
        //<    

        //> @attr notifySettings.maxStackDismissMode (MaxStackDismissMode : "oldest" : IR)
        // Specifies how to pick which message to dismiss when the +link{maxStackSize} is
        // reached, and the lowest priority value (highest numerical 
        // +link{notifySettings.messagePriority,messagePriority}) is shared by more than one
        // message. 
        // <P>
        // We can simply dismiss the oldest message of that 
        // +link{notifySettings.messagePriority,messagePriority}, or we can pick the message
        // with the least time left until it's auto-dismissed.
        // @see duration
        // @see Notify.dismissMessage
        // @visibility external
        //<
        maxStackDismissMode: "oldest",    

        //> @attr notifySettings.actionSeparator (HTMLString : " " : IR)
        // HTML to be added before each action to separate it from the previous action.
        // For the first action, it will only be added if the message contents aren't
        // empty.
        // <P>
        // You may override this on a per action basis using +link{notifyAction.separator}.
        // <P>
        // Besides the default, some other known useful values are "&amp;emsp;" and "&amp;nbsp;".
        // @visibility external
        //<
        actionSeparator: " ",

        //> @attr notifySettings.messageIcon (SCImgURL : varies : IR)
        // Optional icon to be shown in the +link{Label} drawn for this message.  Default is
        // <ul>
        // <li>"[SKIN]/Notify/error.png" for +link{NotifyType}: "error",
        // <li>"[SKIN]/Notify/warning.png" for +link{NotifyType}: "warn", and
        // <li>"[SKIN]/Notify/checkmark.png" for all other +link{NotifyType}s.
        // </ul>
        // However, if you specify a +link{notifySettings.messagePriority,messagePriority}, 
        // it will determine the default rather than the actual <code>NotifyType</code>, if
        // +link{applyPriorityToAppearance} is true.
        // @see NotifySettings.messagePriority
        // @visibility external
        //<

        //> @attr notifySettings.messageIconWidth (int : 17 : IR)
        // Width in pixels of the icon image.
        // @see label.iconWidth
        // @visibility external
        //<
        messageIconWidth: 17,

        //> @attr notifySettings.messageIconHeight (int : 17 : IR)
        // Height in pixels of the icon image.
        // @see label.iconHeight
        // @visibility external
        //<
        messageIconHeight: 17,

        //> @attr notifySettings.messageIconSpacing (int : 20 : IR)
        // Pixels between icon and title text.
        // @see label.iconSpacing
        // @visibility external
        //<
        messageIconSpacing: 20,

        //> @attr notifySettings.messageControlPadding (int : null : IR)
        // Optional specified padding to apply after the message content when showing a
        // +link{canDismiss,dismiss button} so that the button doesn't occlude any content.
        // Only needed if the message +link{styleName,styling} doesn't already provide
        // enough padding.
        // @visibility external
        //<

        //> @attr notifySettings.messagePriority (MessagePriority : varies : IRA)
        // Sets the priority of the message.  Priority is used to determine which message to
        // dismiss if +link{maxStackSize} is hit.  Lower numerical values have higher
        // priority.
        // <p>The default is:
        // <ul>
        // <li>+link{Notify.ERROR} for +link{NotifyType}: "error",
        // <li>+link{Notify.WARN} for +link{NotifyType}: "warn", and
        // <li>+link{Notify.MESSAGE} for all other +link{NotifyType}s
        // </ul>
        // <b>Impact on Appearance</b>
        // <p>
        // If you specify <code>messagePriority</code>, and +link{applyPriorityToAppearance}
        // is set, the properties:
        // <ul>
        // <li> +link{messageIcon},
        // <li> +link{styleName}, and 
        // <li> +link{actionStyleName}
        // </ul>
        // will be assigned, if not specified, to the default values from:<ul>
        // <li> +link{NotifyType}: "error" for priority +link{Notify.ERROR},
        // <li> +link{NotifyType}: "warn" for priority +link{Notify.WARN}, or
        // <li> +link{NotifyType}: "message" for priorities at or below 
        //                         +link{Notify.MESSAGE} (greater or equal numerically)
        // </ul>
        // This allows you to automatically set "error" or "warn" styling, on a per-message
        // basis, for any non-"error" or "warn" <code>NotifyType</code> by simply supplying
        // a <code>messagePriority</code> for that message.
        // @see Notify.addMessage()
        // @see NotifySettings.maxStackDismissMode
        // @visibility external
        //<
        messagePriority: isc.Notify.MESSAGE,

        //> @attr notifySettings.applyPriorityToAppearance (boolean : varies : IRA)
        // Whether to default properties affecting the message appearance to those of the
        // built-in +link{NotifyType} corresponding to the 
        // +link{notifySettings.messagePriority,messagePriority}.  Default is true except
        // for +link{NotifyType}s "error" and "warn", which default to false.
        // @see NotifySettings.messagePriority
        // @visibility external
        //<    
        applyPriorityToAppearance: true,

        //> @attr notifySettings.messageIconOrientation (String : varies : IR)
        // If an icon is present, should it appear to the left or right of the title?
        // valid options are <code>"left"</code> and <code>"right"</code>.  If unset,
        // default is "left" unless +link{page.isRTL(),RTL} is active, in which case it's
        // "right".
        // <P>
        // Note that the icon will automatically be given an alignment matching its
        // orientation, so "left" for <code>messageIconOrientation</code> "left", and vice
        // versa.
        // @see label.iconAlign
        // @see label.iconOrientation
        // @visibility external
        //<
        messageIconOrientation: isc.Page.isRTL() ? "right" : "left",    

        //> @attr notifySettings.styleName (CSSStyleName : varies : IR)
        // The CSS class to apply to the +link{Label} drawn for this message.  Default is:
        // <ul>
        // <li>"notifyError" for +link{NotifyType}: "error",
        // <li>"notifyWarn" for +link{NotifyType}: "warn", and
        // <li>"notifyMessage" for all other +link{NotifyType}s.
        // </ul>
        // However, if you specify a +link{notifySettings.messagePriority,messagePriority},
        // it will determine the default rather than the actual <code>NotifyType</code>, if
        // +link{applyPriorityToAppearance} is true.
        // <P>
        // Note that if +link{page.isRTL(),RTL} is active, the default will be as above, but
        // with an "RTL" suffix added.
        // @see NotifySettings.messagePriority
        // @visibility external
        //<

        //> @attr notifySettings.actionStyleName (CSSStyleName : varies : IR)
        // The CSS class to apply to action text in this message.  default is:
        // <ul>
        // <li>"notifyErrorActionLink" for +link{NotifyType}: "error",
        // <li>"notifyWarnActionLink" for +link{NotifyType}: "warn", and
        // <li>"notifyMessageActionLink" for all other +link{NotifyType}s.
        // </ul>
        // However, if you specify a +link{notifySettings.messagePriority,messagePriority},
        // it will determine the default rather than the actual <code>NotifyType</code>, if
        // +link{applyPriorityToAppearance} is true.
        // @see NotifySettings.messagePriority
        // @visibility external
        //<

        //> @attr notifySettings.zIndex (Integer : null : IRA)
        // Provides control over which message occludes the other if messages of different
        // +link{NotifyType}s overlap.  (By design, messages of the same
        // <code>NotifyType</code> are guaranteed not to overlap.)
        // <P>
        // Generally, you should avoid overlapping messages.  The default behavior is that
        // more recent messages will occlude older ones.
        //<
        

        //> @attr notifySettings.autoFitWidth (Boolean : null : IRA)
        // If true, the specified width of the +link{Label} drawn for this message will be
        // treated as a minimum width.  If the message content string exceeds this, the
        // +link{Label} will expand to accomodate it up to +link{autoFitMaxWidth} (without
        // the text wrapping).
        // <P>
        // Using this setting differs from simply disabling wrapping via
        // +link{label.wrap,wrap:false} as the content will wrap if the
        // +link{autoFitMaxWidth} is exceeded.
        // @visibility external
        //<
        autoFitWidth: true,

        //> @attr notifySettings.autoFitMaxWidth (Integer | String : 300 : IR)
        // Maximum auto-fit width for a message if +link{autoFitWidth} is enabled. May be
        // specified as a pixel value, or a percentage of page width.
        // @see autoFitWidth
        // @visibility external
        //<
        autoFitMaxWidth: 300

        //> @attr notifySettings.labelProperties (Label Properties : null : IR)
        // Configures the properties, such as +link{label.autoFit}, +link{label.align}, and
        // +link{label.width}. of the +link{Label} autochildren that will be used to draw messages,
        // where not already determined by message layout or other <code>NotifySettings</code>
        // properties such as +link{styleName}.
        // @visibility external
        //<
    },

    // get the default messagePriority for the notifyType
    _getDefaultPriority : function(notifyType) {
        switch (notifyType) {
        case this._$error: return isc.Notify.ERROR;
        case this._$warn:  return isc.Notify.WARN;
        case this._$message:
        default:
            return isc.Notify.MESSAGE;
        }
    },

    _initNotifySettings : function(notifyType, settings) {
        // duplicate settings to avoid ever sharing them
        settings = isc.addProperties({}, settings);

        // don't default the appearance from priority for notifyTypes "error" and "warn"
        var messagePriority = this._getDefaultPriority(notifyType);
        if (messagePriority < isc.Notify.MESSAGE) isc.addDefaults(settings, {
            applyPriorityToAppearance: false, messagePriority: messagePriority
        });
        settings._defaultPriority = messagePriority;

        // default priority-related styling properties according to the notifyType
        isc.addDefaults(settings, this._getPriorityRelatedDefaults(messagePriority));
        // now default the remaining common message properties
        isc.addDefaults(settings, this.commonDefaults);

        return settings;
    },


    ////////////////////////////////////////////////////////////////////////////////
    // Priority-related Defaults

    _errorDefaults : { // notifyType: "error"
        messageIcon: "[SKIN]/Notify/error.png",
        actionStyleName: "notifyErrorActionLink",
        styleName: isc.Page.isRTL() ? "notifyErrorRTL" : "notifyError"
    },

    _warnDefaults : { // notifyType: "warn"
        messageIcon: "[SKIN]/Notify/warning.png",
        actionStyleName: "notifyWarnActionLink",
        styleName: isc.Page.isRTL() ? "notifyWarnRTL" : "notifyWarn"
    },

    _messageDefaults : { // notifyType: "message"
        messageIcon: "[SKIN]/Notify/checkmark.png",
        actionStyleName: "notifyMessageActionLink",
        styleName: isc.Page.isRTL() ? "notifyMessageRTL" : "notifyMessage",
        messageControlPadding: null // declares it "priority-related"
    },

    _getPriorityRelatedDefaults : function (priority) {
        switch (priority) {
        case isc.Notify.ERROR: 
            return this._errorDefaults;
        case isc.Notify.WARN: 
            return this._warnDefaults;
        default:
        case isc.Notify.MESSAGE:
            return this._messageDefaults;
        }
    },

    _getConfigSettingsByPriority : function (priority) {
        var settings = this.settings;
        switch (priority) {
        case isc.Notify.ERROR: return settings[this._$error];
        case isc.Notify.WARN:  return settings[this._$warn];
        default:
        case isc.Notify.MESSAGE:
            return settings[this._$message];
        }
    },

    _shouldApplyPriorityToAppearance : function (changedSettings, configuredSettings) {
        if (changedSettings.messagePriority == null) return false;
        // allow applyPriorityToAppearance to be specified per-message
        return changedSettings.applyPriorityToAppearance != null ?
               changedSettings.applyPriorityToAppearance :
            configuredSettings.applyPriorityToAppearance;
    }

});


////////////////////////////////////////////////////////////////////////////////
// NotifyAction

//> @object NotifyAction
// Represents an action that's associated with a message.  Similar to the object form of
// +link{Callback}, except a title must also be specified, which is rendered as a clickable
// link in the message (unless +link{notifyAction.wholeMessage,wholeMessage} is set).
// @see Notify.configureMessages()
// @treeLocation Client Reference/System
// @visibility external
//<

//> @attr notifyAction.title (HTMLString : null : IR)
// The title of the action to render into the message.
// @visibility external
//<

//> @attr notifyAction.separator (HTMLString : null : IR)
// Overrides +link{NotifySettings.actionSeparator} for this action.
// @visibility external
//<

//> @attr notifyAction.target (Object : null : IR)
// The object that will be passed as <code>this</code> when the action is executed.
// @visibility external
//<

//> @attr notifyAction.methodName (String : null : IR)
// The method to invoke on the +link{target} when the action is executed.
// @visibility external
//<

//> @attr notifyAction.wholeMessage (Boolean : null : IR)
// Allows a click anywhere on the notification to execute the action.  If true, the action won't
// be rendered as a link.
// @visibility external
//<

//> @method Callbacks.NotifyActionCallback
// A +link{type:Callback} called when +link{NotifyAction} fires.
// @visibility sgwt
//<
    
//>	@staticMethod isc.notify()
// Displays a new message that's automatically dismissed after a configurable amount of time,
// as an alternative to +link{isc.confirm(),modal notification} dialogs that can lower end user
// productivity.
// <P>
// This method is simply a shorthand way to call +link{Notify.addMessage()}.  For further study,
// see the +link{Notify} class overview, and the class methods +link{Notify.dismissMessage(),
// dismissMessage()} and +link{Notify.configureMessages(),configureMessages()}.
// @param  contents     (HTMLString)             message to be displayed
// @param  [actions]    (Array of NotifyAction)  actions (if any) for this message
// @param  [notifyType] (NotifyType)             category of message
// @param  [settings]   (NotifySettings)         display and behavior settings for this message,
//                                               overriding any stored settings for this
//                                               <code>NotifyType</code>
// @return  (MessageID)  opaque identifier for message
// @see isc.say()
// @see isc.confirm()
// @visibility external
//<
isc.addGlobal("notify", function (contents, actions, notifyType, settings) {
    isc.Notify.addMessage(contents, actions, notifyType, settings);
});
