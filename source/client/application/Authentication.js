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
//> @class Authentication
// The Authentication or +link{class:Auth} class represents a convenient, standard place to keep 
// information about the currently logged in user and their assigned user roles.
// <p>
// The intended usage is that a server authentication system would require the user to log in, 
// then provide data about the currently logged in user via +link{Auth.setCurrentUser()} 
// and +link{Authentication.setRoles()}.  This data is then available in the 
// +link{canvas.ruleScope,Rule Scope} so that components can use it to enable or disable or
// hide themselves, via properties such as +link{formItem.readOnlyWhen}.
// <p>
// The format for user records is not explicitly defined or restricted by the Authentication 
// subsystem but we recommend using the format described by +link{Authentication.getUserSchema()}.<br>
// Having a standardized user record allows application designers to rely on a 
// well-known set of field names at design time, and then at deployment time when a 
// particular authentication system is chosen, the deployer can simply fill in the 
// standardized user record from the data that the chosen authentication system returns.  
// This also allows authentication systems to be swapped out in the future without 
// the need to change application code.
// <p>
// The DataSource returned by +link{Authentication.getUserSchema()} is used solely for visual 
// tools to help with application authoring.<br>
// It is not intended to be used directly to store and retrieve user data, and while we
// recommend this format it is not a requirement that user records conform to it.
// <p>
// There are no security implications to calling <code>setRoles()</code> or
// other APIs on the <code>Authentication</code> class. The provided data affects only 
// client-side components.  All actual security enforcement must be done server-side - 
// see the QuickStart Guide, especially the sections on Declarative Security, 
// to understand how role-based authorization can be used on the server.
//
// @treeLocation Client Reference/System
// @visibility external
//<
isc.defineClass("Authentication");

isc.Authentication.addClassMethods({

    // notification method fired when the current user record, or roles are updated
    // We observe this method to allow canvases to track changes to their ruleContext
    userDataModified : function () {
    },

    //> @classMethod Authentication.setCurrentUser()
    // Set up the current user. This method makes the user record available in the 
    // +link{canvas.ruleScope} as "auth.currentUser".
    //
    // @param user (Record) Record with attributes detailing the current user
    // @visibility external
    //<
    setCurrentUser : function (user) {
        this._currentUser = user;
        this.userDataModified();
    },

    //> @classMethod Authentication.getCurrentUser()
    // Returns the current user specified by +link{setCurrentUser()}. 
    // <P>
    // This method returns the user record currently available in the 
    // +link{canvas.ruleScope} as "auth.currentUser".
    //
    // @return (Record) Record with attributes detailing the current user
    // @visibility external
    //<
    getCurrentUser : function (user) {
        return this._currentUser;
    },

    //> @classMethod Authentication.getUserSchema()
    // Returns a DataSource describing the standard schema for user data.
    // <P>
    // The schema contains the following fields:
    // <table border=1>
    // <tr><td><b>Field Name</b></td><td><b>Type</b></td></tr>
    // <tr><td>"userId"</td><td>"text"</td></tr>
    // <tr><td>"email"</td><td>"text"</td></tr>
    // <tr><td>"firstName"</td><td>"text"</td></tr>
    // <tr><td>"lastName"</td><td>"text"</td></tr>
    // <tr><td>"title"</td><td>"text"</td></tr>
    // <tr><td>"phone"</td><td>"phoneNumber"</td></tr>
    // <tr><td>"superUser"</td><td>"boolean"</td></tr>
    // </table>
    //
    // @return (DataSource) user schema dataSource
    // @visibility external
    //<
    
    getUserSchema : function () {
        // If we a set of available roles, set them as the default options to show in the
        // editor
        var allRoles = this.getAvailableRoles();
        if (this._userSchema == null) {
            this._userSchema = isc.DataSource.create({
                ID:"isc_standardUser",
                title:"User",
                tagName:"user",
                addGlobalId:false,
                availableRoles:allRoles,
                fields:[
                    {name:"userId", type:"text", primaryKey:true,
                        
                        xmlAttribute:true},

                    {name:"email", type:"text", xmlAttribute:true},


                    {name:"firstName", type:"text", xmlAttribute:true},
                    {name:"lastName", type:"text", xmlAttribute:true},
                    {name:"title", type:"text", xmlAttribute:true},
                    {name:"phone", type:"phoneNumber", xmlAttribute:true},
                    {name:"superUser", type:"boolean", xmlAttribute:true},

                    {name:"roles", multiple:"true", type:(allRoles == null ? "text" : "enum"),
                        valueMap:allRoles,
                        multipleStorage:"simpleString", xmlAttribute:true}
                ]
            });
        } else {
            // If the allowed roles have changed, we modify the valueMap on
            // the 'roles' field so visual tools can pick from a list of available options
            if (allRoles != this._userSchema.availableRoles) {
                this._userSchema.availableRoles = allRoles;
                this._userSchema.getField("roles").valueMap = allRoles
            }
        }

        return this._userSchema;
        
    },

    // getAuthSchema returns the Schema needed by the rulescope system to describe the auth object
    getAuthSchema : function () {
        var allRoles = this.getAvailableRoles();
        if (this._authSchema == null) {
            var userSchema = this.getUserSchema(),
                fieldNames = userSchema.getFieldNames(),
                fields = []
            ;
            
            for (var i = 0; i < fieldNames.length; i++) {
                var fieldName = fieldNames[i],
                    field = userSchema.getField(fieldName)
                ;
                // exclude additional fields if existing in userSchema from the list
                if (fieldName != "roles" && fieldName != "isSuperUser") {
                    fields.add(isc.addProperties({ criteriaPath: "auth.currentUser."+fieldName }, field));
                }
            }
            // Add the additional auth fields
            fields.addList([
                {name:"roles", type:"text", 
                    multiple:true,
                    valueMap:allRoles,
                    multipleStorage:"simpleString"
                },
                {name:"isSuperUser", type:"boolean"}
            ]);
                
            this._authSchema = isc.DataSource.create({
                ID:"isc_auth",
                tagName:"auth",
                title:"Authentication",
                clientOnly: true,
                addGlobalId:false,
                availableRoles:allRoles,
                fields:fields
            });
        
        } else {
            // If the allowed roles have changed, we modify the valueMap on
            // the 'roles' field so visual tools can pick from a list of available options
            if (allRoles != this._authSchema.availableRoles) {
                this._authSchema.availableRoles = allRoles;
                this._authSchema.getField("roles").valueMap = allRoles
            }
        }
        return this._authSchema;

    },

    //> @classMethod Authentication.setRoles()
    // Set the user roles for the current user. Roles may be retrieved via +link{Authentication.getRoles()}.
    // <P>
    // Calling setRoles() makes the specified set of user roles available in the +link{canvas.ruleScope} 
    // as a top-level property "userRoles", so that it can be used in criteria such as 
    // +link{canvas.visibleWhen} or +link{formItem.readOnlyWhen}. 
    // <P>
    // Note that if this current user has been +link{Authentication.setSuperUser(),marked as a super-user},
    // +link{getRoles()} will return the full set of available roles rather than the set of
    // roles specified here.
    // 
    // @param roles (Array of String) set of roles which apply to the current user
    // @visibility external
    //<
    setRoles : function (roles) {
        // avoid hanging onto the actual reference passed in
        if (isc.isAn.Array(roles)) roles = roles.duplicate();
        // If passed a single role string, stick it in an array!
        else if (isc.isA.String(roles)) roles = [roles];

        this._roles = roles;
        this.userDataModified();
    },
  
    //> @classMethod Authentication.getRoles()
    // Returns the current set of user roles. For +link{Authentication.setSuperUser(),super users}
    // this will be the intersection of any roles specified by 
    // +link{Authentication.setRoles()} and the full set of +link{setAvailableRoles(),available roles}
    //  - otherwise it will be the set of roles specified by +link{Authentication.setRoles()}.
    // <P>
    // Current set of user roles are available in the +link{canvas.ruleScope} 
    // as a top-level property "userRoles", so that it can be used in criteria such as 
    // +link{canvas.visibleWhen} or +link{formItem.readOnlyWhen}. 
    //
    // @return (Array of String) set of roles which apply to the current user
    // @visibility external
    //<
    getRoles : function () {
        if (this.isSuperUser()) {
            var allRoles = this.getAvailableRoles();
            if (allRoles != null) {
                allRoles = allRoles.duplicate();
                
                if (this._roles) {
                    for (var i = 0; i < this._roles.length; i++) {
                        if (allRoles.indexOf(this._roles[i]) == -1) {
                            allRoles.add(this._roles[i]);
                        }
                    }
                }
                return allRoles;
            }
        }
        return this._roles;
    },    

    //> @classMethod Authentication.setAvailableRoles()
    // Specify the full set of available user roles.
    // <P>
    // Note that if the current user has been marked as a 
    // +link{Authentication.isSuperUser(),superUser}, +link{Authentication.getRoles()} will return
    // the full set of available roles.
    //
    // @param roles (Array of String) full set of possible user roles.
    // @visibility external
    //<
    setAvailableRoles : function (roles) {
        this._availableRoles = roles;
        if (this._authSchema) {
            this._authSchema.getField("roles").valueMap = roles == null ? null : roles.duplicate()
        }
        if (this.isSuperUser()) {
            this.userDataModified();
        }
    },
    
    //> @classMethod Authentication.getAvailableRoles()
    // Returns the full set of available user roles specified by +link{Authentication.setAvailableRoles()}.
    // @return (Array of String) full set of possible user roles.
    // @visibility external
    //<
    getAvailableRoles : function () {
        return this._availableRoles == null ? null : this._availableRoles.duplicate();
    },

    //> @classMethod Authentication.setSuperUser()
    // Mark the current user as a super-user. This causes +link{Authentication.getRoles()} to return
    // the full set of +link{Authentication.getAvailableRoles(),available roles} if specified
    // @param isSuperUser (Boolean) New super user status
    // @visibility external
    //<
    _isSuperUser:false,
    setSuperUser : function (isSuperUser) {
        this._isSuperUser = isSuperUser;
        this.userDataModified();
    },

    //> @classMethod Authentication.isSuperUser()
    // Has the current user been marked as a super-user via +link{Authentication.setSuperUser()}?
    // @param isSuperUser (Boolean) New super user status
    // @visibility external
    //<
    isSuperUser : function () {
        return this._isSuperUser;
    },

    // Actions
    // ---------------------------------------------------------------------------------------

    // Only enable the logout and reset password actions on buttons and MenuItems
    getClassActions : function (targetComponent) {
        // A MenuItem isn't really a component at this point but rather a properties object
        // with the MenuItem _constructor set.
        if (!targetComponent ||
            (isc.isAn.Object(targetComponent) && targetComponent._constructor == "MenuItem") ||
            isc.isA.Button(targetComponent))
        {
            return this._actions
        }
        return null;
    },

    //> @classAttr authentication.logOutURL  (String : null : IR)
    // URL to open for logging the current user out.
    // <P>
    // This is a dynamic string - text within <code>&#36;{...}</code> are dynamic variables and will 
    // be evaluated as JS code when the message is displayed.
    // <P>
    // The dynamic variables available are the fields in the +link{getCurrentUser} record.
    //
    // @visibility external
    //<
    logOutURL: window.isc_auth_logOutURL,
    
    
    logOut : function () {
        if (this.logOutURL) {
            var url = this.logOutURL.evalDynamicString(this, this.getCurrentUser());
            window.open(url, "_blank");
        }
    },

    //> @classAttr authentication.resetPasswordURL  (String : null : IR)
    // URL to open for reseting the current user's password.
    // <P>
    // This is a dynamic string - text within <code>&#36;{...}</code> are dynamic variables and will 
    // be evaluated as JS code when the message is displayed.
    // <P>
    // The dynamic variables available are the fields in the +link{getCurrentUser} record.
    //
    // @visibility external
    //<

    
    getPasswordResetURL : function(user) {
        if (this.resetPasswordURL) {
            return this.resetPasswordURL.evalDynamicString(this, user);
        }
    },
    resetPassword : function () {
        var url = this.getPasswordResetURL(this.getCurrentUser());
        if (url) {
            window.open(url, "_blank");
        }
    }

});

// Register class-level action methods for Reify/VB using "isc.Auth" shortcut (id)
isc.Authentication.addAsClassActionsComponent("authentication.png", "Auth");
isc.Authentication.registerClassActions([
    { name: "logOut", title: "Log out current user", icon: "workflow/logout.png" },
    { name: "resetPassword", title: "Reset password", icon: "workflow/resetPassword.png" }
]);

// Auth synonym for brevity

//> @class Auth
// Synonym for the +link{class:Authentication} class
// @inheritsFrom Authentication
// @treeLocation Client Reference/System
// @visibility external
//<

isc.Auth = isc.Authentication;
