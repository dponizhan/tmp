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
//> @class OverflowItem
// FormItem for selecting a +link{canvas.overflow} value
//<

isc.ClassFactory.defineClass("OverflowItem", "SelectItem");

isc.OverflowItem.addProperties({
    // Modify the valueMap to show the standard subset of overflow settings for components
    // with descriptions
    getValueMap : function () {
        return {
            "visible": "Expand: component will expand to show whatever is placed inside it.  Scrolling may still occur if the component is placed inside a scrollable parent.",
            "auto": "Automatic: component will automatically introduce scrollbars if contents exceed its set size",
            "hidden": "Clip: if component extends past its set size, the extra content will be hidden",
            "scroll": "Always on: component will always show scrollbars, even if content fits inside its set size"
        }
    },
    // Allow the pickList to expand to show the full descriptions
    pickListMaxWidth:null
    

});

