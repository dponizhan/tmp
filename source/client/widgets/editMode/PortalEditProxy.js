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
isc.defineClass("PortletEditProxy", "WindowEditProxy").addMethods({

    // override of EditProxy.setEditMode
    // - prevent default window header drop proxy behavior outside of VB
    setEditMode : function(editingOn) {
        if (!this.creator.editContext.isVisualBuilder) return;
        this.Super("setEditMode", arguments);
    },

    // override of EditProxy.canAddNode
    // - Don't let Portlets be added directly to Portlets, because it is almost never what
    //   would be wanted. But let the caller ask parents ...
    canAddNode : function (dragType, dragTarget, dragData, dropOnFolder) {
        if (dragType == "Portlet") return null;
        return this.Super("canAddNode", arguments);
    },

    // override of EditProxy.dropMove
    // - prevent default window header drop proxy behavior outside of VB
    dropMove : function () {
        if (!this.creator.editContext.isVisualBuilder) return;
        this.Super("dropMove", arguments);
    },

    // override of EditProxy.dropOut
    // - prevent default window header drop proxy behavior outside of VB
    dropOut : function () {
        if (!this.creator.editContext.isVisualBuilder) return;
        this.Super("dropOut", arguments);
    },

    // override of EditProxy.drop
    // - prevent default window header drop proxy behavior outside of VB
    drop : function () {
        if (!this.creator.editContext.isVisualBuilder) return;
        this.Super("drop", arguments);
    }
});

isc.defineClass("PortalRowEditProxy", "LayoutEditProxy");
isc.PortalRowEditProxy.addProperties({
    // PortalRow has internal logic which handles drag/drop
    // in editMode, so defer to that.
    
    dropMove : function () {
        return this.creator.dropMove();
    },

    dropOver : function () {
        return this.creator.dropOver();
    },

    dropOut : function () {
        return this.creator.dropOut();
    },

    drop : function () {
        return this.creator.drop();
    }
});

isc.defineClass("PortalLayoutEditProxy", "LayoutEditProxy").addMethods({
    // override of EditProxy.canAddNode
    // - Don't allow drops to bubble out of the PortalLayout,
    //   because the PortalLayout will handle everything
    //   except for the "dead zone" in the column header,
    //   which should conclusively be dead. So, we convert
    //   any "null" response to "false", to conclusively deny
    //   the drop.
    canAddNode : function (dragType, dragTarget, dragData, dropOnFolder) {
        var canAdd = this.Super("canAddNode", arguments);

        return canAdd || false;
    }
});

isc.defineClass("PortalColumnEditProxy", "LayoutEditProxy").addMethods({
    // override of EditProxy.canAddNode
    // - We don't actually want to add anything via drag & drop ... that will be
    //   handled by PortalColumnBody
    canAddNode : function (dragType, dragTarget, dragData, dropOnFolder) {
        return null;
    },
    
    drop : function () {
        return null;
    },

    dropMove : function () {
        return null;
    },

    dropOver : function () {
        return null;
    },

    dropOut : function () {
        return null;
    }
});

