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
//>	@class	Img
//
//	The Img widget class implements a simple widget that displays a single image.
//
//  @inheritsFrom StatefulCanvas
//  @treeLocation Client Reference/Foundation
//  @visibility external
//  @example img
//<

isc.defineClass("Img", "StatefulCanvas").addClassMethods({
    _buffer : [],
    urlForState : function (baseURL, selected, focused, state, pieceName, customState) {
        if (!baseURL) return baseURL;

        // Stateful sprited images:
        // if passed a single sprited image config like 
        //  sprite:someSprite.png;offset:100,100;size:25,25
        // or
        //  sprite:cssClass:someClassName;size:25,25
        // apply statefulness via the following steps:
        // - if there's an image URL, append the stateful suffix to it 
        // - if there's a css class, append the stateful suffix to that (without any "_" chars)
        // (If both are specified, do both)
        
        var spriteConfig;
        if (baseURL.isSprite) spriteConfig = baseURL;
        else spriteConfig = isc.Canvas._getSpriteConfig(baseURL);
        if (spriteConfig != null) {
            var url = spriteConfig.src,
                cssClass = spriteConfig.cssClass;
            if (url != null) {
                // Go recursive to append statefulness to URL
                spriteConfig.src = this.urlForState(url, selected, focused, state, pieceName, customState);
            } if (cssClass != null) {
                spriteConfig.cssClass = spriteConfig.cssClass += 
                                        isc.StatefulCanvas._getStateSuffix(state, selected, focused, customState);
            }
            
            return isc.Canvas._encodeSpriteConfig(spriteConfig);
        }

        // Handle being passed a SCStatefulImgConfig object
        // This is an object which contains image URL for multiple states
        // States in this object are optional - if we can't find exactly the requested
        // state we back off to an equivalent that is present
        // (So if an object is Selected + Focused, but SelectedFocused is not defined, we
        // back off to Focused, or Selected if present). Details below.
        if (isc.isAn.Object(baseURL)) {
            // a config with no "_base" is likely, though not necessarily, invalid.
            // Warn if we encounter this.
            if (baseURL._base == null) {
                this.logWarn("Attempt to derive stateful URL for object:" + this.echo(baseURL) +
                    " This has no explicit '_base' attribute and as such appears not to match " +
                    "standard SCStatefulImgConfig format.", "StatefulImgConfig");
            }
            

            // short circuit to just return baseURL for the simple case
            if (!state && !pieceName && !selected && !focused && !customState) return baseURL._base;


            // If passed arguments for a combination of 'selected', 'focused', 'state', 'pieceName'
            // and 'customState', we want to find a corresponding attribute by combining
            // these into a single attribute name
            //
            // selected+focused+"over"+"RTL"+"Opened" = baseURL.selectedFocusedOverRTLOpened
            // 
            // If this is un-populated we want to gracefully back off to whatever alternative
            // state makes sense.
            //
            

            var hasState = !(state == null && pieceName == null && customState == null);
            if (hasState && (selected || focused)) {
                // Full attribute
                if (selected && focused) {
                    var combinedAttribute = this._getCombinedStatefulImgAttribute([
                        "Selected",
                        "Focused",
                        state,
                        pieceName,
                        customState
                    ]);
                    if (baseURL[combinedAttribute]) {
                        return this.resolveStatefulImgConfigEntry(combinedAttribute, baseURL);
                    }
                } 
                if (selected) {
                    var combinedAttribute = this._getCombinedStatefulImgAttribute([
                        "Selected",
                        state,
                        pieceName,
                        customState
                    ]);
                    if (baseURL[combinedAttribute]) {
                        return this.resolveStatefulImgConfigEntry(combinedAttribute, baseURL);
                    }

                } 
                if (focused) {
                    var combinedAttribute = this._getCombinedStatefulImgAttribute([
                        "Focused",
                        state,
                        pieceName,
                        customState
                    ]);
                    if (baseURL[combinedAttribute]) {
                        return this.resolveStatefulImgConfigEntry(combinedAttribute, baseURL);
                    }
                }
            }

            // At this state we know we don't have a combination of state + selected/focused
            // Either use the state with no selected/focused modifier, or the
            // selected/focused status with no state modifier

            var modifiersAttr;
            if (selected && focused && baseURL.SelectedFocused) {
                modifiersAttr = "SelectedFocused";
            }
            if (!modifiersAttr && selected && baseURL.Selected) {
                modifiersAttr = "Selected";
            }
            if (!modifiersAttr && focused && baseURL.Focused) {
                modifiersAttr = "Focused";
            }

            // If no state was passed in, or we prefer the modifiers to the state,
            // use the modifiers attribute by default ("SelectedFocused" or whatever)
            if (modifiersAttr && (!hasState || this.preferModifiersToState[state])) {
                return this.resolveStatefulImgConfigEntry(modifiersAttr, baseURL);
            }

            // If we have a state and we should prefer the state to the modifiers [the default]
            // *or* the config didn't include any Selected/Focused entries, look for
            // a simple state entry
            if (hasState) {
                var stateAttribute = this._getCombinedStatefulImgAttribute([
                    state,
                    pieceName,
                    customState
                ]);
                if (baseURL[stateAttribute]) {
                    return this.resolveStatefulImgConfigEntry(stateAttribute, baseURL);
                }
            }

            // At this stage if we have a Selected/Focused entry we had a specified state
            // but couldn't find an entry for it in the config object.
            // Just use the Selected/Focused entry, or back off to the _base URL
            if (modifiersAttr) {
                return this.resolveStatefulImgConfigEntry(modifiersAttr, baseURL);
            }

            return baseURL._base;
        
        } // End of the SCStatefulImgConfig handling

        // Below here will assume baseURL is a string and assemble a new stateful URL
        // by modifying it

        // short circuit to just return baseURL for the simple case
        if (!state && !pieceName && !selected && !focused && !customState) return baseURL;

        // break baseURL up into name and extension
        var period = baseURL.lastIndexOf(isc.dot),
            name = baseURL.substring(0, period),
            extension = baseURL.substring(period),
            buffer = this._buffer;
        buffer.length = 1;
        buffer[0] = name;
        // add selected
        if (selected) {
            buffer[1] = isc._underscore;
            buffer[2] = isc.StatefulCanvas.SELECTED;
        }
        // add focused
        if (focused) {
            buffer[3] = isc._underscore;
            buffer[4] = isc.StatefulCanvas.FOCUSED;
        }
        // add state
        if (state) {
            buffer[5] = isc._underscore;
            buffer[6] = state;
        }
        if (customState) {
            buffer[7] = isc._underscore;
            buffer[8] = customState;
        }
        // add pieceName
        if (pieceName) {
            buffer[9] = isc._underscore;
            buffer[10] = pieceName;
        }
        buffer[11] = extension;
        var result = buffer.join(isc._emptyString);
        return result;
    },
    // Helper to combine a sparse array of state names into a single attribute name
    _getCombinedStatefulImgAttribute : function (stateNames) {
        stateNames.removeEmpty();
        var combinedAttr;
        for (var i = 0; i < stateNames.length; i++) {
            if (stateNames[i] == "") continue;
            if (combinedAttr == null) {
                combinedAttr = stateNames[i];
            } else {
                combinedAttr += stateNames[i].substring(0,1).toUpperCase() + stateNames[i].substring(1);
            }
        }        
        return combinedAttr;
    },

    // This is a list of states for which if we're looking for as stateful image
    // representing a modifier with the state ("Selected" + "Over") say, and we can't
    // find an entry in a statefulImgConfig for this combined state, we should
    // back off to the modifier(s) ("Selected") rather than backing off to the state ("Over")
    preferModifiersToState : [
        "Over", "Down"
    ],

    // Helper to resolve the special meta value naming pattern for entries in a 
    // statefulImgConfigEntry.
    // If #modifier:<xxx> is specified, apply the modifier as a suffix to the base img URL
    // If #state:<xxx> is specified, pick up the value of the other specified state
    // Third parameter is used when the method calls recursively to resolve #state:... entries
    // to detect circular references in the config object.
    // For example: 
    // {state1:"#state:state2",
    //  state2:"#state:state1"}
    resolveStatefulImgConfigEntry : function (entry, config, previousValues) {
        var value = config[entry];
        if (value == null) return null;
        if (value.startsWith("#")) {
            var splitVal = value.split(":");
            switch (splitVal[0]) {
                case "#modifier" :
                    var finalValue = config._base,
                        suffixIndex = finalValue.lastIndexOf(".");
                    finalValue = finalValue.substring(0,suffixIndex) + 
                            splitVal[1] + 
                            finalValue.substring(suffixIndex);
                    return finalValue;
                case "#state" :
                    if (previousValues != null) {
                        if (previousValues.contains(splitVal[1]) && !config._warnedOnCircularRef) {
                            // Avoid spamming this warning repeatedly
                            config._warnedOnCircularRef = true;
                            this.logWarn("Stateful image Configuration contains a circular reference:" + 
                                this.echo(config) + ". Unable to resolve " + previousValues[0] + " to an image");
                            return null;
                        }

                        previousValues.add(entry);
                    } else {
                        previousValues = [entry];
                    }
                    return this.resolveStatefulImgConfigEntry(splitVal[1], config, previousValues);
                default :
                    // it's unlikely that the file name starts with a hash tag.
                    // If it does, log a warning but use it anyway.
                    this.logWarn("stateful image configuration value:" 
                            + entry + " from configutation object:" + this.echo(config) +
                            " has hash prefix but does not conform to expected naming" +
                            " pattern for meta value. Returning as is.");
            }
        }
        return value;
    }
});

// add default properties
isc.Img.addProperties( {
    //> @attr	img.name	(String : "main" : IA)
	// The value of this attribute is specified as the value of the 'name' attribute in the
    // resulting HTML.
    // <p>
    // Note: this attribute is ignored if the imageType is set to "tile"
    // 
    // @visibility external
	//<
    name:"main",
    
    //> @object SCStatefulImgConfig
    //
    // A configuration object containing image URLs for a set of possible
    // images to display based on the +link{StatefulCanvas.state,state} of some components.
    // See the +link{group:statefulImages,stateful images overview} for more information.
    // <P>
    // Each attribute in this configuration object maps a state to a target URL.<br>
    // Each URL may be specified in one of three ways
    // <ul><li>a standard +link{SCImgURL} may be used to refer directly to an image file.</li>
    //     <li>the <code>"#state:"</code> prefix may be used to display media from another
    //         specified state.</li>
    //     <li>the <code>"#modifier:"</code> prefix may be used to specify a modifier 
    //         string to apply to the +link{SCStatefulImgConfig._base,base image}.<br>
    //         The modifier will be applied to the base file name before the file type suffix.</li>
    // </ul>
    // For example, consider a stateful image config with the following properties:
    // <pre>
    // {    _base:"button.png",
    //      Over:"bright_button.png",
    //      Focused:"#state:Over",
    //      Selected:"#state:Over",
    //      Disabled:"#modifier:_Disabled",
    //      SelectedDisabled:"#state:Selected"
    // }
    // </pre>
    // In this case
    // <ul>
    // <li>the base image URL and the the "Over" state image URL would be determined using
    //     the standard +link{SCImgURL} rules</li>
    // <li>the "Focused" and "Selected" state images would re-use the "Over" state image
    //     (<code>"bright_button.png"</code>)</li>
    // <li>the "Disabled" state image would be the base state image with a
    //      <code>"_Disabled"</code> suffix applied to the file name
    //      (<code>"button_Disabled.png"</code>)</li>
    // <li>the <code>"SelectedDisabled"</code> entry would be used for the combined 
    //     <code>"Selected"</code> and <code>"Disabled"</code> states, and would
    //     re-use the "Selected" state image (which in turn maps back to
    //     the "Over" state, resolving to <code>"bright_button.png"</code>)</li>
    // </ul>
    // <P>
    // The default set of standard states are explicitly documented, but this object format
    // is extensible.
    // A developer may specify additional attributes on a SCStatefulImgConfig beyond the
    // standard documented states and they may be picked up if a custom state is applied to 
    // a component (via a call to +link{StatefulCanvas.setState()}, for example).
    // <P>
    // <h3>Combined states and missing entries:</h3>
    // The +link{statefulCanvas.isFocused(),focused} and +link{statefulCanvas.selected,selected} 
    // states may be applied to a component in combination with other states. For example an +link{ImgButton}
    // marked both <i>Selected</i> and <i>Disabled</i> will look for media to
    // represent this combined state. To provide such media in a SCStatefulImgConfig, 
    // use the combined state names (in this case <code>SelectedDisabled</code>).<br>
    // If a component is both <i>Selected</i> and <i>Focused</i>,
    // three-part combined states are also possible (Selected + Focused + Over gives
    // <code>SelectedFocusedOver</code> for example).
    // <P>
    // The SCStatefulImgConfig format may be sparse - developers may skip providing values for
    // certain states (or combined states) in the SCStatefulImgConfig object. 
    // In this case the system will back off to using one of the state image entries
    // that has been explicitly provided, according to the following rules:
    // <table border=1>
    // <tr> <td><b>State(s)</b></td>
    //      <td><b>Stateful image attributes to consider (in order of preference)</b></td>
    // </tr>
    // <tr><td><code>Focused</code> and <code>Selected</code></td>
    //     <td>If both focused and selected states are applied, the system will use the first
    //         (populated) value from the following attribute list:
    //         <ul><li>"FocusedSelected"</li>
    //             <li>"Focused"</li>
    //             <li>"Selected"</li>
    //      </ul></td>
    // </tr>
    // <tr><td><code>Over</code> or <code>Down</code> in combination with <code>Focused</code> 
    //         / <code>Selected</code> </td>
    //     <td>System will check for a combined state attribute with the Focused / Selected state first.<br>
    //          For example for Focused + Selected + Over, consider the following attributes:
    //          <ul><li>"FocusedSelectedOver"</li>
    //              <li>"FocusedOver"</li>
    //              <li>"SelectedOver"</li></ul>
    //          If no combined state entry is specified, back off to considering just the
    //          Focused / Selected state:
    //          <ul><li>"FocusedSelected"</li>
    //              <li>"Focused"</li>
    //              <li>"Selected"</li>
    //          </ul>
    //          If no focused / selected state entry is present in the config object, 
    //          look for an entry for the unmodified state name
    //          <ul><li>"Over"</li></ul>
    //      </td>
    // </tr>
    // <tr><td>All other states, including <code>Disabled</code> (in combination with 
    //          <code>Focused</code> / <code>Selected</code>) </td>
    //     <td>Check for a combined state attribute with the Focused / Selected state first.<br>
    //          For example for Focused + Selected + "CustomState", consider the following attributes:
    //          <ul><li>"FocusedSelectedCustomState"</li>
    //              <li>"FocusedCustomState"</li>
    //              <li>"SelectedCustomState"</li></ul>
    //          If no combined state entry is specified, back off to considering just the
    //          unmodified state name
    //          <ul><li>"CustomState"</li></ul>    
    //          If there is no explicit entry for the state name, use the Focused / Selected
    //          state without a state name:
    //          <ul><li>"FocusedSelected"</li>
    //              <li>"Focused"</li>
    //              <li>"Selected"</li>
    //          </ul>
    //      </td>
    // </tr></table>
    // <br>
    // If no entry can be found for the specified state / combined states using the above 
    // approach, the  <code>"_base"</code> attribute will be used.
    //  
    // @treeLocation Client Reference/Foundation/Img 
    // @visibility external
    //<
    
    

    // ----
    // SCStatefulImgConfig states:

    // List out the default set of state name attributes
    
    
    //>	@attr	SCStatefulImgConfig._base		(SCImgURL : null : [IRW])
    // The base filename for the image. This will be used if no state is applied to the
    // stateful component displaying this image, or if no explicit entry exists for
    // a state that is applied.<br>
    // It will also be used as a base file name for entries specified using the
    // <code>"#modifier:<i>some_value</i>"</code> format.
    // <P>
    // See +link{SCStatefulImgConfig,SCStatefulImgConfig overview} for further information.
    //
    // @visibility external
    //<

    //>	@attr	SCStatefulImgConfig.Selected		(String : null : [IRW])
    // Image to display when the component is +link{StatefulCanvas.selected,selected}.
    // <P>
    // May be specified as 
    // <ul><li>A +link{SCImgURL} indicating the media to load</li>
    //     <li>A reference to another entry in this SCStatefulImgConfig via the format 
    //         <code>"#state:<i>otherStateName</i>"</code></li>
    //     <li>A modifier to apply to the +link{SCstatefulImgConfig._base} media via the
    //         format <code>"#modifier:<i>modifierString</i>"</code></li>
    // </ul>
    // See +link{SCStatefulImgConfig,SCStatefulImgConfig overview} for further information.
    //
    // @visibility external
    //<

    //>	@attr	SCStatefulImgConfig.Focused		(String : null : [IRW])
    // Image to display when the component is +link{StatefulCanvas.isFocused(),focused}.
    // <P>
    // May be specified as 
    // <ul><li>A +link{SCImgURL} indicating the media to load</li>
    //     <li>A reference to another entry in this SCStatefulImgConfig via the format 
    //         <code>"#state:<i>otherStateName</i>"</code></li>
    //     <li>A modifier to apply to the +link{SCstatefulImgConfig._base} media via the
    //         format <code>"#modifier:<i>modifierString</i>"</code></li>
    // </ul>
    // See +link{SCStatefulImgConfig,SCStatefulImgConfig overview} for further information.
    //
    // @visibility external
    //<

    //>	@attr	SCStatefulImgConfig.Over		(String : null : [IRW])
    // Image to display on +link{StatefulCanvas.showRollOver,roll over}.
    // <P>
    // May be specified as 
    // <ul><li>A +link{SCImgURL} indicating the media to load</li>
    //     <li>A reference to another entry in this SCStatefulImgConfig via the format 
    //         <code>"#state:<i>otherStateName</i>"</code></li>
    //     <li>A modifier to apply to the +link{SCstatefulImgConfig._base} media via the
    //         format <code>"#modifier:<i>modifierString</i>"</code></li>
    // </ul>
    // See +link{SCStatefulImgConfig,SCStatefulImgConfig overview} for further information.
    //
    // @visibility external
    //<

    //>	@attr	SCStatefulImgConfig.Down		(String : null : [IRW])
    // Image to display on +link{StatefulCanvas.showDown,mouseDown}.
    // <P>
    // May be specified as 
    // <ul><li>A +link{SCImgURL} indicating the media to load</li>
    //     <li>A reference to another entry in this SCStatefulImgConfig via the format 
    //         <code>"#state:<i>otherStateName</i>"</code></li>
    //     <li>A modifier to apply to the +link{SCstatefulImgConfig._base} media via the
    //         format <code>"#modifier:<i>modifierString</i>"</code></li>
    // </ul>
    // See +link{SCStatefulImgConfig,SCStatefulImgConfig overview} for further information.
    //
    // @visibility external
    //<

    //>	@attr	SCStatefulImgConfig.Disabled		(String : null : [IRW])
    // Image to display when the component is +link{StatefulCanvas.disabled,disabled}.
    // <P>
    // May be specified as 
    // <ul><li>A +link{SCImgURL} indicating the media to load</li>
    //     <li>A reference to another entry in this SCStatefulImgConfig via the format 
    //         <code>"#state:<i>otherStateName</i>"</code></li>
    //     <li>A modifier to apply to the +link{SCstatefulImgConfig._base} media via the
    //         format <code>"#modifier:<i>modifierString</i>"</code></li>
    // </ul>
    // See +link{SCStatefulImgConfig,SCStatefulImgConfig overview} for further information.
    //
    // @visibility external
    //<


    //>	@attr	SCStatefulImgConfig.SelectedOver		(String : null : [IRW])
    // Image to display when the component is +link{StatefulCanvas.selected,selected} on
    // +link{StatefulCanvas.showRollOver,roll over}.
    // <P>
    // May be specified as 
    // <ul><li>A +link{SCImgURL} indicating the media to load</li>
    //     <li>A reference to another entry in this SCStatefulImgConfig via the format 
    //         <code>"#state:<i>otherStateName</i>"</code></li>
    //     <li>A modifier to apply to the +link{SCstatefulImgConfig._base} media via the
    //         format <code>"#modifier:<i>modifierString</i>"</code></li>
    // </ul>
    // See +link{SCStatefulImgConfig,SCStatefulImgConfig overview} for further information.
    //
    // @visibility external
    //<    

    //>	@attr	SCStatefulImgConfig.SelectedDown		(String : null : [IRW])
    // Image to display when the component is +link{StatefulCanvas.selected,selected} on
    // +link{StatefulCanvas.showDown,mouse down}.
    // <P>
    // May be specified as 
    // <ul><li>A +link{SCImgURL} indicating the media to load</li>
    //     <li>A reference to another entry in this SCStatefulImgConfig via the format 
    //         <code>"#state:<i>otherStateName</i>"</code></li>
    //     <li>A modifier to apply to the +link{SCstatefulImgConfig._base} media via the
    //         format <code>"#modifier:<i>modifierString</i>"</code></li>
    // </ul>
    // See +link{SCStatefulImgConfig,SCStatefulImgConfig overview} for further information.
    //
    // @visibility external
    //<

    //>	@attr	SCStatefulImgConfig.SelectedDisabled		(String : null : [IRW])
    // Image to display when the component is +link{StatefulCanvas.selected,selected} and
    // +link{StatefulCanvas.disabled,disabled}.
    // <P>
    // May be specified as 
    // <ul><li>A +link{SCImgURL} indicating the media to load</li>
    //     <li>A reference to another entry in this SCStatefulImgConfig via the format 
    //         <code>"#state:<i>otherStateName</i>"</code></li>
    //     <li>A modifier to apply to the +link{SCstatefulImgConfig._base} media via the
    //         format <code>"#modifier:<i>modifierString</i>"</code></li>
    // </ul>
    // See +link{SCStatefulImgConfig,SCStatefulImgConfig overview} for further information.
    //
    // @visibility external
    //<

    //>	@attr	SCStatefulImgConfig.FocusedOver		(String : null : [IRW])
    // Image to display when the component is +link{StatefulCanvas.isFocused,focused} on
    // +link{StatefulCanvas.showRollOver,roll over}.
    // <P>
    // May be specified as 
    // <ul><li>A +link{SCImgURL} indicating the media to load</li>
    //     <li>A reference to another entry in this SCStatefulImgConfig via the format 
    //         <code>"#state:<i>otherStateName</i>"</code></li>
    //     <li>A modifier to apply to the +link{SCstatefulImgConfig._base} media via the
    //         format <code>"#modifier:<i>modifierString</i>"</code></li>
    // </ul>
    // See +link{SCStatefulImgConfig,SCStatefulImgConfig overview} for further information.
    //
    // @visibility external
    //<    
    
    //>	@attr	SCStatefulImgConfig.FocusedDown		(String : null : [IRW])
    // Image to display when the component is +link{StatefulCanvas.isFocused(),focused} on
    // +link{StatefulCanvas.showDown,mouse down}.
    // <P>
    // May be specified as 
    // <ul><li>A +link{SCImgURL} indicating the media to load</li>
    //     <li>A reference to another entry in this SCStatefulImgConfig via the format 
    //         <code>"#state:<i>otherStateName</i>"</code></li>
    //     <li>A modifier to apply to the +link{SCstatefulImgConfig._base} media via the
    //         format <code>"#modifier:<i>modifierString</i>"</code></li>
    // </ul>
    // See +link{SCStatefulImgConfig,SCStatefulImgConfig overview} for further information.
    //
    // @visibility external
    //<

    //>	@attr	SCStatefulImgConfig.SelectedFocused		(String : null : [IRW])
    // Image to display when the component is +link{StatefulCanvas.selected,selected} and
    // +link{StatefulCanvas.isFocused(),focused}.
    // <P>
    // May be specified as 
    // <ul><li>A +link{SCImgURL} indicating the media to load</li>
    //     <li>A reference to another entry in this SCStatefulImgConfig via the format 
    //         <code>"#state:<i>otherStateName</i>"</code></li>
    //     <li>A modifier to apply to the +link{SCstatefulImgConfig._base} media via the
    //         format <code>"#modifier:<i>modifierString</i>"</code></li>
    // </ul>
    // See +link{SCStatefulImgConfig,SCStatefulImgConfig overview} for further information.
    //
    // @visibility external
    //<

    //>	@attr	SCStatefulImgConfig.SelectedFocusedOver		(String : null : [IRW])
    // Image to display when the component is +link{StatefulCanvas.selected,selected} and
    // +link{StatefulCanvas.isFocused(),focused} on +link{StatefulCanvas.showRollOver,roll over}.
    // <P>
    // May be specified as 
    // <ul><li>A +link{SCImgURL} indicating the media to load</li>
    //     <li>A reference to another entry in this SCStatefulImgConfig via the format 
    //         <code>"#state:<i>otherStateName</i>"</code></li>
    //     <li>A modifier to apply to the +link{SCstatefulImgConfig._base} media via the
    //         format <code>"#modifier:<i>modifierString</i>"</code></li>
    // </ul>
    // See +link{SCStatefulImgConfig,SCStatefulImgConfig overview} for further information.
    //
    // @visibility external
    //<

    //>	@attr	SCStatefulImgConfig.SelectedFocusedDown		(String : null : [IRW])
    // Image to display when the component is +link{StatefulCanvas.selected,selected} and
    // +link{StatefulCanvas.isFocused(),focused} on +link{StatefulCanvas.showDown,mouse down}.
    // <P>
    // May be specified as 
    // <ul><li>A +link{SCImgURL} indicating the media to load</li>
    //     <li>A reference to another entry in this SCStatefulImgConfig via the format 
    //         <code>"#state:<i>otherStateName</i>"</code></li>
    //     <li>A modifier to apply to the +link{SCstatefulImgConfig._base} media via the
    //         format <code>"#modifier:<i>modifierString</i>"</code></li>
    // </ul>
    // See +link{SCStatefulImgConfig,SCStatefulImgConfig overview} for further information.
    //
    // @visibility external
    //<

    // End of standard SCStatefulImgConfig states
    // --------

    // Should we show stateful image media as well as stateful styling?
    // Note: See statefulCanvas.shouldShowStatefulImage() / getURL() for implementation

    
    
    //>	@attr	img.showRollOver		(Boolean : false : IRW)
    // Should we visibly change state when the mouse goes over this object?
    // <P>
    // This will impact the +link{statefulCanvas.baseStyle,styling} of the component on
    // roll over. It may also impact the +link{img.src,image being displayed} - see
    // also +link{Img.showImageRollOver}.
    //
	// @group	state
    // @visibility external
    //<	

    //>	@attr   img.showImageRollOver		(Boolean : null : IRW)
    // Should the image be updated on rollOver as described in +link{group:statefulImages}?
    // <P>
    // If not explicitly set, behavior is as follows:<br>
    // If +link{Img.src} is specified as a string, +link{img.showRollOver} will be used to 
    // determine whether to show a roll-over image.<br>
    // If +link{Img.src} is specified as a +link{SCStatefulImgConfig}, the appropriate 
    // +link{SCStatefulImgConfig.Over} state image will be displayed if defined.
    //
	// @group	state
    // @visibility external
    //<	

    //>	@attr	img.showFocused        (Boolean : false : IRW)
	// Should we visibly change state when the canvas receives focus?  If
    // +link{statefulCanvas.showFocusedAsOver} is <code>true</code>, then <b><code>"over"</code></b>
    // will be used to indicate focus. Otherwise a separate <b><code>"focused"</code></b> state
    // will be used.
    // <P>
    // This will impact the +link{statefulCanvas.baseStyle,styling} of the component on
    // focus. It may also impact the +link{img.src,image being displayed} - see
    // also +link{Img.showImageFocused}.
    //
	// @group	state
    // @visibility external
	//<

    //>	@attr	img.showImageFocused		(Boolean : null : IRW)
    // Should the image be updated on focus as described in +link{group:statefulImages}?
    // <P>
    // If not explicitly set, behavior is as follows:<br>
    // If +link{Img.src} is specified as a string, +link{img.showFocused} will be used to determine
    // whether to show a focused image.<br>
    // If +link{Img.src} is specified as a +link{SCStatefulImgConfig}, the appropriate 
    // +link{SCStatefulImgConfig.Over} state image will be displayed if defined.
    // <P>
    // Note that if +link{img.src} is defined as a string, the "Over" media may be used 
    // to indicate a focused state. See +link{showFocusedAsOver} and +link{showImageFocusedAsOver}.<br>
    // This is not the case for components with +link{img.src} defined as a +link{SCStatefulImgConfig}
    // configuration.
    // 
	// @group	state
    // @visibility external
    //<	
    
    //> @attr img.showFocusedAsOver (Boolean : true : IRW) 
    // If +link{StatefulCanvas.showFocused,showFocused} is true for this widget, should the
    // <code>"over"</code> state be used to indicate the widget as focused. If set to false,
    // a separate <code>"focused"</code> state will be used.
    // <P>
    // This property effects the css styling for the focused state.<br>
    // If +link{img.src} is specified as a string it will also cause the "Over" media to be
    // displayed to indicate focus, unless explicitly overridden by 
    // +link{img.showImageFocusedAsOver}. Note that this has no impact on the
    // image to be displayed if +link{img.src} is specified as a +link{SCStatefulImgConfig}.
    // 
    // @group state
    // @visibility external
    //<
    
    //> @attr img.showImageFocusedAsOver (Boolean : null : IRW) 
    // If +link{img.src} is defined as a string, and this component is configured to
    // +link{showImageFocused,show focused state images}, this property will cause the 
    // <code>"over"</code> state image to be used to indicate focused state.
    // (If unset, +link{showFocusedAsOver} will be consulted instead).
    // <P>
    // Note that this has no impact on the
    // image to be displayed if +link{img.src} is specified as a +link{SCStatefulImgConfig}.
    // 
    // @group state
    // @visibility external
    //<
    
	//>	@attr	img.showDown		(Boolean : false : IRW)
	// Should we visibly change state when the mouse goes down in this object?
    // This will impact the +link{statefulCanvas.baseStyle,styling} of the component on
    // mouse down. It may also impact the +link{img.src,image being displayed} - see
    // also +link{Img.showImageDown}.
    //
	// @group	state
    // @visibility external
    //<	

    //>	@attr   img.showImageDown		(Boolean : null : IRW)
    // Should the image be updated on mouse down as described in +link{group:statefulImages}?
    // <P>
    // If not explicitly set, behavior is as follows:<br>
    // If +link{Img.src} is specified as a string, +link{img.showDown} will be used to 
    // determine whether to show a mouse down image.<br>
    // If +link{Img.src} is specified as a +link{SCStatefulImgConfig}, the appropriate 
    // +link{SCStatefulImgConfig.Down} state image will be displayed if defined.
    //
	// @group	state
    // @visibility external
    //<
    
	//>	@attr	img.showDisabled  (Boolean : true : IRW)
    // Should we visibly change state when disabled?
    // <P>
    // This will impact the +link{statefulCanvas.baseStyle,styling} of the component 
    // when disabled. It may also impact the +link{img.src,image being displayed} - see
    // also +link{Img.showImageDisabled}.
    //
	// @group	state
    // @visibility external
    //<	

    //>	@attr   img.showImageDisabled		(Boolean : null : IRW)
    // Should the image be updated when disabled as described in +link{group:statefulImages}?
    // <P>
    // If not explicitly set, behavior is as follows:<br>
    // If +link{Img.src} is specified as a string, +link{img.showDisabled} will be used to 
    // determine whether to show a disabled image.<br>
    // If +link{Img.src} is specified as a +link{SCStatefulImgConfig}, the appropriate 
    // +link{SCStatefulImgConfig.Disabled} state image will be displayed if defined.
    //
	// @group	state
    // @visibility external
	//<	

    // End of show<State> definitions
    // ----

    //> @groupDef statefulImages
    // Images displayed in +link{StatefulCanvas,stateful components} may display different
    // media depending on the current state of the component. See the +link{Img.src} attribute
    // or +link{Button.icon} attribute for examples of such "stateful images".
    // <P>
    // In general the media to load for each state may be specified in two ways:
    // <P>
    // <H3>Base URL combined with state suffixes</H3>
    // If the property in question is set to a standard +link{SCImgURL,image URL}, this value
    // will be treated as a default, or base URL. When a new +link{statefulCanvas.state,state}
    // is applied, this filename will be combined with the state name
    // to form a combined URL. This in turn changes the media that gets loaded and updates
    // the image to reflect the new state.<br>
    // Note that if the property was defined as a sprite configuration string
    // a css style may be defined instead of, or in addition to a src URL. 
    // See the +link{SCSpriteConfig,sprite configuration documentation} for a discussion
    // of how sprites can be used for stateful images.
    // <P>
    // The following table lists out the standard set of combined URLs that 
    // may be generated. Subclasses may support additional state-derived media of course.
    // Note that the src URL will be split such that the extension is always applied to the
    // end of the combined string. For example in the following table, if <code>src</code>
    // was set to <code>"blank.gif"</code>, the Selected+Focused URL would be 
    // <code>"blank_Selected_Focused.gif"</code>.
    // <table>
    // <tr><td><b>URL for Img source</b></td><td><b>Description</b></td></tr>
    // <tr><td><code><i>src</i>+<i>extension</i></code></td><td>Default URL</td></tr>
    // <tr><td><code><i>src</i>+"_Selected"+<i>extension</i></code></td>
    //      <td>Applied when +link{statefulCanvas.selected} is set to true</td></tr>
    // <tr><td><code><i>src</i>+"_Focused"+<i>extension</i></code></td>
    //      <td>Applied when the component has keyboard focus, if 
    //      +link{statefulCanvas.showFocused} is true, and 
    //      +link{statefulCanvas.showFocusedAsOver} is not true.</td></tr>
    // <tr><td><code><i>src</i>+"_Over"+<i>extension</i></code></td>
    //      <td>Applied when the user rolls over the component if
    //          +link{statefulCanvas.showRollOver} is set to true</td></tr>
    // <tr><td><code><i>src</i>+"_Down"+<i>extension</i></code></td>
    //      <td>Applied when the user presses the mouse button over over the component if
    //          +link{statefulCanvas.showDown} is set to true</td></tr>
    // <tr><td><code><i>src</i>+"_Disabled"+<i>extension</i></code></td>
    //      <td>Applied to +link{canvas.disabled} component
    //       if +link{statefulCanvas.showDisabled} is true.</td></tr>
    // <tr><td colspan=2><i>Combined states</i></td></tr>
    // <tr><td><code><i>src</i>+"_Selected_Focused"+<i>extension</i></code></td>
    //      <td>Combined Selected and focused state</td></tr>
    // <tr><td><code><i>src</i>+"_Selected_Over"+<i>extension</i></code></td>
    //      <td>Combined Selected and rollOver state</td></tr>
    // <tr><td><code><i>src</i>+"_Focused_Over"+<i>extension</i></code></td>
    //      <td>Combined Focused and rollOver state</td></tr>
    // <tr><td><code><i>src</i>+"_Selected_Focused_Over"+<i>extension</i></code></td>
    //      <td>Combined Selected, Focused and rollOver state</td></tr>
    // <tr><td><code><i>src</i>+"_Selected_Down"+<i>extension</i></code></td>
    //      <td>Combined Selected and mouse-down state</td></tr>
    // <tr><td><code><i>src</i>+"_Focused_Down"+<i>extension</i></code></td>
    //      <td>Combined Focused and mouse-down state</td></tr>
    // <tr><td><code><i>src</i>+"_Selected_Focused_Down"+<i>extension</i></code></td>
    //      <td>Combined Selected, Focused and mouse-down state</td></tr>
    // <tr><td><code><i>src</i>+"_Selected_Disabled"+<i>extension</i></code></td>
    //      <td>Combined Selected and Disabled state</td></tr>
    // </table>
    // <P>
    // <H3>Explicit stateful image configuration</H3>
    // The +link{SCStatefulImgConfig} object allows developers to specify a set of explicit 
    // image URLs, one for each state to be displayed, rather than relying on an automatically
    // generated combined URL. This pattern is useful for cases where the filename of the stateful
    // versions of the image doesn't match up with the auto-generated format.
    //
    //
    // @title Stateful Images
    // @treeLocation Client Reference/Foundation/Img
    // @visibility external
    //<


    //>	@attr	img.src		(SCImgURL | SCStatefulImgConfig : "blank.gif" : [IRW])
    // The base filename or stateful image configuration for the image. 
    // Note that as the +link{statefulCanvas.state,state} 
    // of the component changes, the image displayed will be updated as described in
    // +link{group:statefulImages}.
    //
    // @group  appearance
    // @visibility external
    //<
	src:"blank.gif",
	
	//> @attr img.altText (String : null : IRW)
	// If specified this property will be included as the <code>alt</code> text for the image HMTL
	// element. This is useful for improving application accessibility.
	// <P>
	// <b><code>altText</code> and hover prompt / tooltip behavior:</b> Note that some
	// browsers, including Internet Explorer 9, show a native hover tooltip containing the 
	// img tag's <code>alt</code> attribute. Developers should not rely on this behavior to show
	// the user a hover prompt - instead the +link{img.prompt} attribute should be used.<br>
	// To set alt text <i>and</i> ensure a hover prompt shows up in all browsers, developers may
	// set +link{img.prompt} and <code>altText</code> to the same value. If both 
	// these attributes are set, the standard SmartClient prompt behavior will show a hover
	// prompt in most browsers, but will be suppressed for browsers where a native tooltip 
	// is shown for altText. Note that setting <code>altText</code> and <code>prompt</code> to
	// different values is not recommended - the prompt value will be ignored in favor of the
	// altText in this case.
	// @visibility external
	// @group accessibility
	//<

    //> @attr img.prompt
    // @include Canvas.prompt
    //<

    //>	@attr	img.activeAreaHTML		(String of HTML AREA Tag : null : IRWA)
    //
    // Setting this attribute configures an image map for this image.  The value is expected as a
    // sequence of &lg;AREA&gt tags - e.g:
    // <pre>
    // Img.create({ 
    //     src: "myChart.gif",
    //     activeAreaHTML:
    //         "&lt;AREA shape='rect' coords='10,50,30,200' title='30' href='javascript:alert(\"30 units\")'&gt;" +
    //         "&lt;AREA shape='rect' coords='50,90,80,200' title='22' href='javascript:alert(\"22 units\")'&gt;"
    // });
    // </pre>
    // <u>Implementation notes:</u>
    // <ul>
    // <li>Quotes in the activeAreaHTML must be escaped or alternated appropriately.</li>
    // <li>Image maps do not stretch to fit scaled images. You must ensure that the dimensions of
    // your Img component match the anticipated width and height of your image map (which will typically
    // match the native dimensions of your image). </li>
    // <li>To change the image map of an existing Img component, first set yourImg.activeAreaHTML,
    // then call yourImg.markForRedraw(). Calls to yourImg.setSrc() will not automatically update the
    // image map. </li>
    // <li>activeAreaHTML is not supported on tiled Img components (imageType:"tile").</li> 
    // <li>Native browser support for image map focus/blur, keyboard events, and certain AREA tag
    // attributes (eg NOHREF, DEFAULT...) varies by platform. If your image map HTML uses attributes
    // beyond the basics (shape, coords, href, title), you should test on all supported browsers to
    // ensure that it functions as expected.</li>
    // </ul>
    // 
    // @group  appearance
    // @visibility external
    //<
 
    //>	@attr	img.imageType		(ImageStyle : isc.Img.STRETCH : [IRW])
    //          Indicates whether the image should be tiled/cropped, stretched, or centered when the
    //          size of this widget does not match the size of the image. 
    //          CENTER shows the image in it's natural size, but can't do so while the 
    //          transparency fix is active for IE. The transparency fix can be manually disabled
    //          by setting +link{usePNGFix} to false.
    //          See ImageStyle for further details.
    //      @visibility external
    //      @group  appearance
    //<
	imageType: isc.Img.STRETCH,

    //> @attr img.imageHeight (Integer : null : IR)
    // Explicit size for the image, for +link{imageType} settings that would normally use the
    // image's natural size (applies to +link{img.imageType} "center" and "normal" only).
    // @visibility external
    // @group  appearance
    //<

    //> @attr img.imageWidth (Integer : null : IR)
    // Explicit size for the image, for +link{imageType} settings that would normally use the
    // image's natural size (applies to +link{img.imageType} "center" and "normal" only).
    // @visibility external
    // @group  appearance
    //<

    //> @attr   img.size            (Number : null : [IR])
    // Convenience for setting height and width to the same value, at init time only
    // @group sizing
    // @visibility external
    //<

    // do set styling on the widget's handle
    suppressClassName:false,
    
    
    mozOutlineOffset:"0px",
    
    //> @attr img.showTitle (Boolean : false : [IRWA])
    // @include StatefulCanvas.showTitle
    // @visibility external
    //<
    showTitle:false,
    
    //> @attr img.usePNGFix (Boolean : true : [IR])
    // If false, never apply the png fix needed in Internet Explorer to make png transparency
    // work correctly.
    // @visibility external
    //<
    usePNGFix: true
});

// add methods to the class
isc.Img.addMethods({

initWidget : function () {
    // HACK: call Super the direct way   
    isc.StatefulCanvas._instancePrototype.initWidget.call(this);
    //this.Super(this._$initWidget);

    this.redrawOnResize = (this.imageType != isc.Img.STRETCH);
    // Initialize the '_currentURL' to allow resetSrc to avoid unnecessary work if the
    // state changes without requiring a new media be displayed
    this._currentURL = this.getURL();

},

//> @method img.setImageType()
// Change the style of image rendering.
//
// @param imageType (ImageStyle) new style of image rendering
//
// @visibility external
//<
setImageType : function (imageType) {
    if (this.imageType == imageType) return;
    this.imageType = imageType;
    this.markForRedraw();
    this.redrawOnResize = (this.imageType != isc.Img.STRETCH);
},


styleText:"line-height:1px;",


//>	@method	img.getInnerHTML()	(A)
//		@group	drawing
//			write the actual image for the contents
//
//		@return	(HTMLString)	HTML output for this canvas
//<
_$tableStart : "<TABLE WIDTH=",
_$heightEquals : " HEIGHT=",
_$tableTagClose : " BORDER=0 CELLSPACING=0 CELLPADDING=0><TR>",
_$centerCell : "<TD style='line-height:1px' VALIGN=center ALIGN=center>",
_$tileCell : "<TD BACKGROUND=",
_$tableEnd : "</TD></TR></TABLE>",
getInnerHTML : function () {
    var width = this.sizeImageToFitOverflow ? this.getOverflowedInnerWidth() 
                                            : this.getInnerWidth(),
        height = this.sizeImageToFitOverflow ? this.getOverflowedInnerHeight() 
                                            : this.getInnerHeight(),
        imageType = this.imageType;

    var extraStuff = this.extraStuff,
        eventStuff = this.eventStuff;
    if (this.imageStyle != null) {
        var classText = " class='" + this.imageStyle + this.getStateSuffix() + this._$singleQuote;
        if (extraStuff == null) extraStuff = classText;
        else extraStuff += classText;
    }
    if (this.altText != null) {
        var altText = this.altText;
        altText = " alt='" + altText.replace("'", "&apos;") + this._$singleQuote;
        if (extraStuff == null) extraStuff = altText;
        else extraStuff += altText;
    }

    // stretch: just use an <IMG> tag [default]
    if (imageType == isc.Img.STRETCH || imageType == isc.Img.NORMAL) {
        // normal: use an img, but don't size to the Canvas extents.  Size to imageWidth/Height
        // instead, which default to null.
        if (imageType == isc.Img.NORMAL) {
            width = this.imageWidth;
            height = this.imageHeight;
        }

        var config = {
                src:this.getURL(), 
                width:width, 
                height:height, 
                name:this.name, 
                extraStuff:extraStuff,
                // Set alignment to be "top" rather than textTop for 
                // stretch and "normal" image types.
                
                align:"top",

                activeAreaHTML:this.activeAreaHTML,
                eventStuff:eventStuff
            }
        return this.imgHTML(config);
    }

    var output = isc.SB.create();
    // start padless/spaceless table
    output.append(this._$tableStart, width,
				        this._$heightEquals, height, this._$tableTagClose);

	if (imageType == isc.Img.TILE) {
        // tile: set image as background of a cell filled with a spacer
        
		output.append(this._$tileCell, this.getImgURL(this.getURL()), this._$rightAngle,
				      isc.Canvas.spacerHTML(width, height));
	} else { // (this.imageType == isc.Img.CENTER) 
        // center: place unsized image tag in center of cell
        
        output.append(this._$centerCell,
    				  this.imgHTML(this.getURL(), this.imageWidth, this.imageHeight, this.name, 
                                   extraStuff, null, this.activeAreaHTML, null, eventStuff));
	}

    output.append(this._$tableEnd);
    return output.release(false);
},

// SizeToFitOverflow:
// If we're imageType:"stretch", and we're showing a label, the label contents may
// introduce overflow.
// This property can be set to cause our image to expand to fit under the overflowed label
sizeImageToFitOverflow:false,
getOverflowedInnerWidth : function () {
    return this.getVisibleWidth() - this.getHMarginBorder()
},

getOverflowedInnerHeight : function () {
    return this.getVisibleHeight() - this.getVMarginBorder()
},


_handleResized : function (deltaX, deltaY) {
    if (this.redrawOnResize != false || !this.isDrawn()) return;
   
    // if we're a stretch image, we can resize the image and not redraw it
    // TODO: in fact, we can reflow automatically in the same circumstances as the Button if we
    // draw similar HTML
    var imageStyle = this.getImage(this.name).style;
    var width = this.sizeImageToFitOverflow ? this.getOverflowedInnerWidth() :
                this.getInnerWidth(),
        height = this.sizeImageToFitOverflow ? this.getOverflowedInnerHeight() :
                this.getInnerHeight();
    
    this._assignSize(imageStyle, this._$width, width);
    this._assignSize(imageStyle, this._$height, height);
},
// 
_labelAdjustOverflow : function () {
    this.Super("_labelAdjustOverflow", arguments);
    if (this.overflow != isc.Canvas.VISIBLE || !this.sizeImageToFitOverflow) return;

    var image = this.getImage(this.name),
        imageStyle = image ? image.style : null;
    if (imageStyle == null) return;
    var width = this.getOverflowedInnerWidth(),
        height = this.getOverflowedInnerHeight();
        
    this._assignSize(imageStyle, this._$width, width);
    this._assignSize(imageStyle, this._$height, height);

},

//>	@method	img.setSrc()    ([])
// Changes the URL of this image and redraws it.
// <P>
// Does nothing if the src has not changed - if <code>src</code> has not changed but other
// state has changed such that the image needs updating, call +link{resetSrc()} instead.
//
// @param	URL		(SCImgURL)	new URL for the image
// @group	appearance
// @visibility external
// @example loadImages
//<
setSrc : function (URL) {
    if (URL == null || this.src == URL) return;

	this.src = URL;
    this.resetSrc();
},

//> @method img.resetSrc()   (A)
// Refresh the image being shown.  Call this when the +link{src} attribute has not changed, but
// other state that affects the image URL (such as being selected) has changed.
//
// @group	appearance
// @visibility external
//<
resetSrc : function () {
    // No need to update the image if the URL is unchanged
    var src = this.getURL();
    if (this._currentURL == src) return;
    this._currentURL = src;

	if (!this.isDrawn()) return;


	// depending on how the image was originally drawn,
	//	we may be able to simply reset the image
	if (this.imageType != isc.Img.TILE && this._canSetImage(this.name, src)) {
		this.setImage(this.name, src);
        // The new image might have different intrinsic dimensions. Need to call adjustOverflow()
        // to refresh the scrollWidth/Height.
        this.adjustOverflow("setImage() called");
	// and we may have to redraw the whole thing
	} else {
		this.markForRedraw("setSrc on tiled image");
	}
},

//> @method img.stateChanged() 	 
//		Update the visible state of this image by changing the URL
//
//		@param  newState	(String)	name for the new state	 
//<
stateChanged : function () {
    // Update the css styling by calling Super
    this.Super("stateChanged");
	
	// call resetSrc() with null to efficiently reset the image 	 
	if (!this.statelessImage) this.resetSrc(); 	 
},

//> @method img.getHoverHTML()
// If <code>this.showHover</code> is true, when the user holds the mouse over this Canvas for
// long enough to trigger a hover event, a hover canvas is shown by default. This method returns
// the contents of that hover canvas.
// <P>
// Overridden from Canvas: <br>
// If +link{prompt} is specified, and +link{altText} is unset, default implementation is unchanged -
// the prompt text will be displayed in the hover.<br>
// If +link{altText} and +link{prompt} are set this method will return null to suppress
// the standard hover behavior in browsers where the alt attribute on an img tag causes
// a native tooltip to appear, such as Internet Explorer.
// On other browsers the altText value will be returned.
//
//  @group hovers
//  @see canvas.showHover
//  @return (String) the string to show in the hover
//  @visibility external
//<
getHoverHTML : function () {
    if (this.altText) {
        
        if (isc.Browser.isIE) return null;
        // default to altText, not prompt so it's consistent cross-browser.
        if (this.prompt && this.prompt != this.altText) {
            this.logWarn("Img component specified with altText:" + this.altText 
                + " and prompt:" + this.prompt 
                + ". Value for 'prompt' attribute will be ignored in favor of 'altText' value.");
        }
        return this.altText
    }
    return this.Super("getHoverHTML", arguments);
}

});
