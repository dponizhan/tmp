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
//>	@class	IconImgButton
// A specialized subclass of +link{ImgButton} designed to show an icon that launches a
// +link{canvas.contextMenu,context menu} when clicked.  The icon is specified as the
// +link{IconImgButton.src,src} property.
//
// @see statefulCanvas.showMenuOnClick
// @inheritsFrom ImgButton
// @treeLocation Client Reference/Control
// @visibility external
//<

isc.ClassFactory.defineClass("IconImgButton", "ImgButton").addProperties({

    // fallbacks if isc.Window isn't defined when class is initialized
    
    width: 16,
    height: 16,

    //> @attr IconImgButton.showMenuOnClick (Boolean : true : IRW)
    // @include statefulCanvas.showMenuOnClick
    // @visibility external
    //<
    showMenuOnClick: true,

    //> @attr IconImgButton.src (SCImgURL | SCStatefulImgConfig : {_base:"[SKIN]/actions/edit.png"} : IRW)
    // @include ImgButton.src
    // @visibility external
    // @example buttonAppearance
    //<
    src: {_base:"[SKIN]/actions/edit.png"},

    
    showFocusedAsOver:false

});

isc.IconImgButton.addClassMethods({

    
    init : function (a, b, c) {
        this.invokeSuper(isc.IconImgButton, "init", a, b, c);
        if (this != isc.IconImgButton) return;
        
        
        if (!isc.Window) {
            this.logWarn("isc.Window not loaded, failed to pick up Window.headerIconDefaults");
            return;
        }

        var iconDefaults = isc.Window.getInstanceProperty("headerIconDefaults");
        this.addProperties({
            width: iconDefaults.width,
            height: iconDefaults.height
        });
    }

});
