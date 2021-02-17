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
//
//
//	clone() methods for the comm package
//

isc.addGlobal("clone", function (object, objPath) { return isc.Comm._clone(object); });
isc.addGlobal("shallowClone", function (object) { return isc.Comm._shallowClone(object); });

isc.Comm.addClassMethods({

//>	@staticMethod isc.clone()
// Create a deep clone of an object that can be edited without affecting the original
// <P>
// All mutable types, including Objects, Arrays and Dates, are copied.  All immutable types
// (Number, String, etc) are just preserved by reference.
// <P>
// Only JavaScript built-in types may be cloned.  SmartClient UI widgets do not support
// cloning but must be created explicitly via +link{Class.create()}.<br>
// Note that you also can't duplicate a live canvas by passing into <i>create()</i> as an
// argument. If you need to create multiple components with similar configuration, some common
// patterns inclulde:<ul>
// <li>Create a new SmartClient class with the desired default configuration, and
//     create instances of this class as needed.</li>
// <li>For components created by some specific instance, the +link{AutoChild} system may be used.
//     Developers can specify a standard configuration in 
//     <code><i>autoChildName</i>Defaults</code> and 
//     <code><i>autoChildName</i>Properties</code>, and use +link{Class.createAutoChild()}
//     to create a number of standard auto child components.</li>
// <li>A less formal approach might be to have a simple <i>getter</i> type method which
//     created and returned a new component each time it was called, passing in a standard
//     configuration block.</li></ul>
// <P>
// Does not handle looping references (will infinite loop).
//
// @visibility external
//
//		@group	serialization
//		@param	object		(Object)	object to clone
//		@return				(Object)	cloned object	
//<
clone : isc.clone,

_clone : function (object) {
    

    // preserve undef vs null (eg slot values)
    var undef;
    if (object === undef) return undef;
	if (object == null) return null;

    // just return immutable types
	if (isc.isA.String(object) || isc.isA.Boolean(object) ||
	    isc.isA.Number(object) || isc.isA.Function(object)) return object;

    // do not attempt to clone GWT Java Object references; a crash will likely result
    if (isc.Browser.isSGWT && window.SmartGWT.isNativeJavaObject(object)) return object;

    // copy mutable types
	if (isc.isA.Date(object)) return object.duplicate();
	
	if (isc.isAn.Array(object)) return isc.Comm._cloneArray(object);
    // allow a clone() function to be implemented
	if (isc.isA.Function(object.clone)) {
        
        if (isc.isA.Class(object)) return isc.echoLeaf(object);
        return object.clone();
    }
	return isc.Comm._cloneObject(object);
},

_cloneArray : function (object) {
	var output = [];
	for (var i = 0, len = object.length; i < len; i++) {
		output[i] = isc.Comm._clone(object[i]);
	}
	return output;
},

_cloneObject : function (object) {
	var output = {};
	for (var key in object) {
		var value = object[key];
        
        if (key == isc.gwtRef || key == isc.gwtModule) continue;
		output[key] = isc.Comm._clone(value);
	}
	return output;
},

//> @staticMethod isc.shallowClone()
// Creates a shallow copy of the passed-in Object or Array of Objects, that is, copies all
// properties of an Object to a new Object, so that the clone now has exactly the same property
// values as the original Object.
// <P>
// If <code>shallowClone()</code> is passed an immutable type such as String and Number, it is returned
// unchanged.  Dates are copied via <code>new Date(originalDate.getTime())</code>.
// <P>
// Note that if an Array is passed, all members of the Array will be cloned.  For a copy of an
// Array that contains exactly the same members (not copies), use Array.duplicate().
// <P>
// Only an Array directly passed to <code>shallowClone()</code> is copied.  Arrays contained
// within Arrays will not be copied.
//
// @param object (Object | Array | Object) object to be cloned
// @return (Object | Array of Object) a shallow copy of the passed-in data
// @visibility external
//<
shallowClone : isc.shallowClone,

_shallowClone : function (object) {

    // preserve undef vs null (eg slot values)
    var undef;
    if (object === undef) return undef;
	if (object == null) return null;

    // Avoid attempting to manipulate SGWT Java objects
	if (isc.Browser.isSGWT && window.SmartGWT.isNativeJavaObject(object)) return object;
	
    // just return immutable types
	if (isc.isA.String(object) || isc.isA.Boolean(object) ||
	    isc.isA.Number(object) || isc.isA.Function(object)) return object;

    // copy mutable types
	if (isc.isA.Date(object)) return object.duplicate();
	
	if (isc.isAn.Array(object)) return isc.Comm._shallowCloneArray(object);
	
    // make a shallow clone of the object
	return isc.addProperties({}, object);
},

_shallowCloneArray : function (object) {
    var output = [];
	for (var i = 0, len = object.length; i < len; i++) {
        // don't copy arrays, just return them directly
        if (isc.isAn.Array(object[i])) output[i] = object[i];
		else output[i] = isc.Comm._shallowClone(object[i]);
	}
	return output;
}

});	// END isc.addMethods(isc.Comm, {})
