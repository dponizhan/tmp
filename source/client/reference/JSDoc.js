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
// APIs for the JSDoc datastructure
//

isc.overwriteClass("JSDoc");
isc.jsdoc = isc.JSDoc;

isc.JSDoc.addClassProperties({

    _$jsGroup: "group",
    _$jsType: "type",
    _$jsClass: "class",
    _$jsPseudoClass: "pseudoClass",
    _$jsObject: "object",
    _$jsInterface: "interface",
    _$jsMethod: "method",
    _$jsClassMethod: "classMethod",
    _$jsStaticMethod: "staticMethod",
    _$jsAttr: "attr",
    _$jsClassAttr: "classAttr"
    //> @classAttr jsDoc.data (XML | JS Datastructure : null : RW)
    //
    // The JSDoc datastructure in JS or XML format
    //<

});


isc.JSDoc.addClassMethods({

addPropertiesOnInit : false,
init : function (data) {
    if (!data) return;
    if (this.data) return;
    this.data = data;

    // initialize this.docItems: a js doc ref -> docItem map
    var refs = this.refs = [];
    if (data.documentElement) { 
    
        // data is in XML format
        this.dataIsXML = true;

        // fetch parallel arrays of refs and docItem nodes
        var items = this.items = isc.xml.selectNodes(this.data, "/docItems/docItem");
        var docItems = this.docItems = {};

        var refS = "ref";
        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            var ref = item.getAttribute(refS);
            refs[i] = ref;
            items[i] = item;
            docItems[ref] = item;
        }
    } else {
        // jsdoc is already in ref -> docItem format
        var docItems = this.docItems = this.data;
        var items = this.items = [];
        var byType = this.byType = {};
        for (var ref in docItems) {
            var i = refs.length;
            refs[i] = ref;
            var docItem = docItems[ref];
            items[i] = docItem

            // list of doc items by type
            if (!byType[docItem.type]) byType[docItem.type] = [];
            byType[docItem.type] = docItem;
        }
    }
},

getRefs : function () {
    return this.refs;
},

hasData : function () {
    return this.docItems != null;
},

getAttributes : function (obj, fieldNames) {
    if (obj == null) {
        return;
    }
    if (this.dataIsXML) return isc.xml.getAttributes(obj, fieldNames);    
    return obj;
},

getAttribute : function (obj, fieldName) {
    if (obj == null) {
        return;
    }
    if (this.dataIsXML) return obj.getAttribute(fieldName);
    return obj[fieldName];
},

toJS : function (obj, fieldNames) {
    if(this.dataIsXML) return isc.xml.toJS(obj, false, fieldNames);
    return obj;
},

// XXX works for simple attributes only
setAttribute : function (obj, fieldName, fieldValue) {
    if (this.dataIsXML) obj.setAttribute(fieldName, fieldValue);
    else obj[fieldName] = fieldValue;
},

removeAttribute : function(obj,fieldName){
    if (this.dataIsXML)obj.removeAttribute(fieldName);
    else delete obj[fieldName];
},

getList : function (obj, fieldName) {
    if (this.dataIsXML) return isc.xml.selectScalarList(obj, fieldName+"/text()");
    var data = obj[fieldName];
    if (!data) data = [];
    if (!isc.isAn.Array(data)) data = [data];
    return data;
},

addToList : function (obj,fieldName,newObj){
    if (this.dataIsXML){
        var nativeDoc = this.data.nativeDoc;
        var newElement=nativeDoc.createElement(fieldName);
        var s=nativeDoc.createTextNode(newObj);
        newElement.appendChild(s);
        obj.appendChild(newElement);
    } else {
        if(!obj[fieldName])obj[fieldName]=[];
        obj[fieldName].add(newObj);
    }
},

// returns html appropriate for a hover.  The arguments are the same as for getDocItem()
// 
// currently works for [class]Methods and [class]Attributes

hoverHTML : function (container, item, linkName, omitAttrs) {

    if (container == null) return null;
    
    var docItem = this.getDocItem(container, item, true),
        hoverHTML
    ;

    // no doc available for the requested item - if this is a method or attribute (has a container)
    // look up the inheritance chain for a doc.    
    if (!docItem) {
        var definingClass = container;

        // deal with canonical refs
        var colonIndex = container.indexOf(isc.colon);
        if (colonIndex != -1) {
            var dotIndex = container.indexOf(isc.dot);
            definingClass = container.substring(colonIndex+1, dotIndex);
            item = container.substring(dotIndex+1, container.length);
        }

        var classObject = isc.ClassFactory.getClass(definingClass);
        if (classObject) {
            var superClass = classObject.getSuperClass();
            if (superClass) {
                return this.hoverHTML(superClass.getClassName(), item, linkName);
            }
        }
        // For Reify there can be a schema that inherits from another schema but no actual
        // class exists for the first schema. Instead, look for docs against parent schema.
        var schema = isc.DS.get(container);
        if (schema && schema.inheritsFrom) {
            return this.hoverHTML(schema.inheritsFrom, item, linkName);
        }
        return null;
    }

    // expose a constant if it's linked by a reference
    if (docItem.constant && !docItem.linked) return null;

    // Support 'omitAttrs' parameter - if passed, avoid writing out hover HTML for
    // the specified attributes
    
    if (docItem && (omitAttrs != null && omitAttrs.length > 0)) {
        docItem = isc.addProperties({},docItem);

        for (var i = 0; i < omitAttrs.length; i++) {
            delete docItem[omitAttrs[i]];
        }
    }

    var type = this.getAttribute(docItem, this._$jsType);
    if (this.isMethod(type)) hoverHTML = isc.MethodFormatter.hoverHTML(this.toJS(docItem), linkName);
    else if (this.isAttr(type)) hoverHTML = isc.AttrFormatter.hoverHTML(this.toJS(docItem), linkName);
    else if (this.isType(type)) hoverHTML = isc.TypeViewer.hoverHTML(this.toJS(docItem), linkName);
    else if (this.isClass(type)
             || this.isObject(type)
             || this.isPseudoClass(type)
             || this.isInterface(type)) 
    {
        hoverHTML = isc.ClassViewer.hoverHTML(this.toJS(docItem), linkName);
    }
    else if (this.isGroup(type)) hoverHTML = isc.GroupViewer.hoverHTML(this.toJS(docItem), linkName);

    return hoverHTML ? isc.DocUtils.evalDynamicStringWithDocClass(hoverHTML, docItem) : null;
},

// Links in JSDoc are written out by code in DocUtils
// Native mouseOver/mouseOut events call through to these methods to trigger hovers with 
// a preview of the doc so you don't have to click through to read it.
// Avoid this if the user is actually viewing the docs in a hover and has given it focus
// In that case we want them to be able to click to switch topic instead.
sourceLinkOver : function () {
    if (!isc.Hover._hoverHasFocus) isc.Hover.setAction(isc.DocUtils, isc.DocUtils.doSourceHover,null,300);    
},
sourceLinkOut : function () {
    if (!isc.Hover._hoverHasFocus) isc.Hover.clear();
},
refLinkOver : function(ref) {
    if (!isc.Hover._hoverHasFocus) isc.DocUtils._showDocHover(ref);
},
refLinkOut : function () {
    if (!isc.Hover._hoverHasFocus) isc.Hover.clear();
}, 

refLinkClick : function (ref, linkRef) {
    if (!isc.Hover._hoverHasFocus) {
        isc.Hover.clear();
        isc.DocViewer.instance._show(ref, linkRef);
    // If the hover has focus, assume the user clicked a link in a hover - replace
    // the contents of the hover with the link target
    } else {
        isc.DocUtils._showDocHover(ref, true);
    }
},

isMethod : function (type) {
    return type == this._$jsMethod || type == this._$jsClassMethod || 
                                      type == this._$jsStaticMethod;
},

isInstance : function (type) {
    return type == this._$jsMethod || type == this._$jsAttr;
},

isAttr : function (type) {
    return type == this._$jsAttr || type == this._$jsClassAttr;
},

isType : function (type) {
    return type == this._$jsType;
},

isClass : function (type) {
    return type == this._$jsClass;
},

isObject : function (type) {
    return type == this._$jsObject;
},

isPseudoClass : function (type) {
    return type == this._$jsPseudoClass;
},

isInterface : function (type) {
    return type == this._$jsInterface;
},

isGroup : function (type) {
    return type == this._$jsGroup;
},

addDocItem : function(ref,docItem) {
    this.docItems[ref]=docItem;
    this.items.add(docItem);
    this.refs.add(ref);
    if(this.dataIsXML)this.data.documentElement.appendChild(docItem);
},

getType : function (docItem) {
    return this.getAttribute(docItem, this._$jsType);
},  

getAllDocItemsByType : function (type) {
    return this.byType[type];
},
// returns metadata for a docItem - see the end of the function for what's available.  This method
// tries really hard to find a match for what you pass in. You can pass:
//
//  - arg1: fully qualified ref (e.g: "method:Canvas.getWidth"), arg2: undef
//  - arg1: container.item (e.g: "Canvas.getWidth" or "Canvas.getWidth()") arg2: undef
//  - arg1: container (e.g: "Canvas"), arg2: item (e.g: "getWidth")
//  - arg1: container (e.g: "Canvas") arg2: undef
//
//  In all ways, this method is case sensitive - e.g. you can't pass in "canvas.getWidth()" or
//  "Canvas.getwidth()" and expect that to work.
_containerTryOrder : ["class", "interface", "object", "pseudoClass", "type", "group"],
_methodsOnly : ["method", "classMethod", "staticMethod"],
_methodsAndAttrs : ["attr", "method", "classAttr", "classMethod", "staticMethod"],
getDocItem : function (container, item, checkSuper) {

    if (!this.docItems) {
        this.logWarn("documentation not available");
        return null;
    }

    // if the container arg contains a canonical ref, return the data immediately
    var docItem = this.docItems[container];
    if (docItem) return docItem;
    
    if (!isc.isA.String(container)) return null;

    var ref, 
        refType;

    // strip off passed in refType (if any) since new ones will be added below
    var splitPos = container.indexOf(isc.colon);
    if (splitPos >= 0) {
        refType = container.substring(0, splitPos);
        container = container.substring(splitPos + 1);
    }

    // not a method or attribute
    if (item == null && container.indexOf(isc.dot) == -1) { // not a property or method
        for (var i = 0; i < this._containerTryOrder.length; i++) {
            refType = this._containerTryOrder[i];
            docItem = this.docItems[this.makeRef(refType,container)]
            if (docItem) return docItem;
        }
    } else { 
        // method or attribute
        var className = container, 
            itemName = item;
        ;

        if(!itemName) {
            // container is a ref, get the itemName out of it
            if(container.contains(isc.dot)) {
                var s = container.split(isc.dot);
                className = s[0];
                itemName = s[1];
            } else {
                this.logWarn("No item specified and container: " + container + " not in dot notation");
                return null;
            }
        }

        // if item contains parens on the end, strip them and search only methods
        var tryMethodsOnly = false;
        var parensIndex = itemName.indexOf("()");
        if (parensIndex != -1) {
            itemName = itemName.substring(0, parensIndex);
            tryMethodsOnly = true;
        }

        var itemTryOrder = tryMethodsOnly ? this._methodsOnly : this._methodsAndAttrs;
        for (var i = 0; i < itemTryOrder.length; i++) {
            refType = itemTryOrder[i];
            docItem = this.docItems[this.makeRef(refType,className,itemName)];
            if (docItem) return docItem;
        }

        if (checkSuper && className != null) {
            var c = isc.ClassFactory.getClass(className);
            if (c) {
                var sup = c.getSuperClass();
                if (sup) return this.getDocItem(sup.getClassName(), itemName, true);
            }
        }
    } 

    //>DEBUG
    this.logDebug("getDocItem: couldn't find docItem from params (container: " 
                 + container + ", item: " + item + ")");
    //<DEBUG
    return null;
},
 
// fast assembly of a ref from a type and name, just puts the : between the two
_jsMethodOrAttrTemplate : [
,       // 0 type
":",    // 1
,       // 2 container (class, object, group, etc)
".",    // 3
isc.emtptyString        // 4 methodOrAttr, if present
],
_jsClassTemplate : [
,       // 0 type
":",    // 1
isc.emptyString // 2 container (class, object, group, etc)
],
makeRef : function (type, name, methodOrAttr) {
    var t;
    if (methodOrAttr != null) {
        t = this._jsMethodOrAttrTemplate;        
        t[0] = type;
        t[2] = name;
        t[4] = methodOrAttr;
    } else {
        t = this._jsClassTemplate;
        t[0] = type;
        t[2] = name;
    }
    return t.join(isc.emptyString);        
},

getGroupForAttribute : function (className, attrName) {
    var attrItem = this.getAttributeItem(className, attrName);
    if (attrItem != null) {
        // get the text inside all the <groups> elements under this attribute
        var groups = this.getList(attrItem, "groups");
        return groups ? groups[0] : "other";
    }
    var ds = isc.DS.get(className);
    if (ds == null) return null;
    if (ds.inheritsFrom) return this.getGroupForAttribute(ds.inheritsFrom, attrName);
    else return null;
},

getAllGroupsForAttribute : function (className, attrName) {
    var attrItem = this.getAttributeItem(className, attrName);
    if (attrItem != null) {
        // get the text inside all the <groups> elements under this attribute
        var groups = this.getList(attrItem, "groups");
        return groups ? groups : ["other"];
    }
    var ds = isc.DS.get(className);
    if (ds == null) return null;
    if (ds.inheritsFrom) return this.getAllGroupsForAttribute(ds.inheritsFrom, attrName);
    else return null;
},

getGroupItem : function (name) {
    return this.getDocItem(this.makeRef(this._$jsGroup,name));
},

getAttributeItem : function (className, attrName) {
    return this.getDocItem(this.makeRef(this._$jsAttr, className, attrName));
},

isAdvancedAttribute : function (docItem) {
    return this.attributeContainsAllFlags(docItem, "A");
},

// flags argument should be a string of the flags to test for
attributeContainsAllFlags : function (docItem, flags) {
    var attrItem = docItem;
    if (attrItem == null) return false;
    // flags is null or empty so attribute does contain these flags
    if (flags == null || isc.isAn.emptyString(flags)) return true;
    // here flags has a value, so if the attribute's flags are null/empty, that means it doesn't
    // contain all the flags
    var attrItemFlags = this.getAttribute(attrItem, "flags");
    if (attrItemFlags == null || isc.isAn.emptyString(attrItemFlags)) return false;
    for (var i = 0; i < flags.length; i++) {
        if (attrItemFlags.indexOf(flags.charAt(i)) == -1) return false;
    }
    return true;
},

docItemForDSField : function (ds, fieldName) {
    ds = isc.DS.get(ds);
    if (ds) {
        var field = ds.getField(fieldName);
        if (field) {
            var docItem = isc.clone(field);
            docItem.definingClass =  ds.Constructor ? ds.Constructor : ds.ID;
            docItem.ref = "attr:"+field.definitionClass+"."+fieldName;
            docItem.valueType = docItem.type;
            docItem.type = "attr";
            return docItem;
        }
    }
    return null;
},

docItemForDSMethod : function (ds, methodName) {
    ds = isc.DS.get(ds);
    if (ds) {
        var method = ds.methods.find("name", methodName);
        if (method) {
            method.definingClass = ds.Constructor ? ds.Constructor : ds.ID;
            method.ref = "method:"+method.definitionClass+"."+methodName;
            return method;
        }
    }
    return null;
},

getSuperClassName : function (classDoc) {
    var superClassName = classDoc.inheritsFrom;
    if (!superClassName) {            
        var classObject = isc.ClassFactory.getClass(classDoc.name);
        if (classObject) {
            var superClass = classObject.getSuperClass();
            if (superClass) superClassName = superClass.getClassName();
        }
    }
    return superClassName;
},


getActions : function (className) {
    var ds = isc.DS.get(className);
    if (ds == null) return null;

    var actions,
        seenActions = {};

    while (ds != null) {

        // look at the actions declared in the schema
        var dsActions = ds.methods ? ds.methods.findAll("action", true) : null;

        if (dsActions == null) {
            if (ds.showSuperClassActions == false) break;
            ds = ds.superDS();
            continue;
        }

        for (var i = 0; i < dsActions.length; i++) {
            var dsAction = dsActions[i],
                // look up the docs for each declared action - if no item found in docs, 
                // docs assumed to be inline on the ds
                docItem = isc.jsdoc.getDocItem("method:" + ds.ID + "." + dsAction.name),
                docData = docItem ? isc.jsdoc.toJS(docItem) : dsAction;

            if (dsAction.name in seenActions) continue;
            seenActions[dsAction.name] = dsAction;

            if (dsAction.inapplicable == true || dsAction.inapplicable == "true") continue;

            // combine the declaration in the DataSource with the doc data
            if (actions == null) actions = [];
            var action = isc.addProperties({}, docData, dsAction);
            actions.add(action);

            // normalize params to an Array (may appear as single object)
            var params = action.params;
            if (params != null && !isc.isAn.Array(params)) action.params = [params];
        }

        if (ds.showSuperClassActions == false) break;
        ds = ds.superDS();
    }
    return actions;
},

// ScriptDoc Generation
// ---------------------------------------------------------------------------------------

addDocItem : function (docItem, index) {
},

genScriptDoc : function (options, listener) {
    var refs = isc.JSDoc.refs;
    var docData = {};
    var jsDoc = this;
    
    this.options = options || {}; 

    var docItems = isc.getValues(isc.JSDoc.docItems);

    var classItems = docItems.findAll("type", "class");
    classItems = classItems.concat(docItems.findAll("type", "object"));
    classItems = classItems.concat(docItems.findAll("type", "interface"));
    
    this.logWarn("classItems: " + this.echo(classItems));

    for (var i = 0; i < classItems.length; i++) {
        if (!options.classes || options.classes.contains(classItems[i].name)) {
            this.addScriptDocItem(isc.clone(classItems[i]), docData);

        }
    }
    
    isc.Timer.setTimeout(function () {
        var otherItems = docItems.duplicate();
        otherItems.removeAll(classItems);
        jsDoc.logWarn(jsDoc.echoLeaf(otherItems));
    
        for (var i = 0; i < otherItems.length; i++) {
            if (!options.classes || options.classes.contains(otherItems[i].definingClass)) {
                jsDoc.addScriptDocItem(otherItems[i], docData); 
            }
        }
    
        isc.Timer.setTimeout(function () { jsDoc.genScriptDocXML(docData); })
    });
},

genScriptDocXML : function (docData) {

    isc.DataSource.create({
        ID:"sdocParam",
        tagName:"parameter",
        fields : [
            { name:"name", xmlAttribute:"true" },
            { name:"usage", xmlAttribute:"true" },
            { name:"type", xmlAttribute:"true" }
        ]
    });

    isc.DataSource.create({
        ID:"sdocReturnType",
        tagName:"return-type",
        fields : [
            { name:"type", xmlAttribute:"true" }
        ]
    });

    isc.DataSource.create({
        ID:"sdocMethod",
        tagName:"method",
        fields : [
            { name:"name", xmlAttribute:"true" },
            { name:"scope", xmlAttribute:"true" },
            { name:"stringMethod", xmlAttribute:"true" },
            { name:"event", xmlAttribute:"true" },
            { name:"bubbles", xmlAttribute:"true" },
            { name:"parameters", multiple:true, type:"sdocParam" },
            { name:"return-types", multiple:true, type:"sdocReturnType" }
        ]
    });

    isc.DataSource.create({
        ID:"sdocProperty",
        tagName:"property",
        fields : [
            { name:"name", xmlAttribute:"true" },
            { name:"scope", xmlAttribute:"true" },
            { name:"access", xmlAttribute:"true" },
            { name:"type", xmlAttribute:"true" }
        ]
    });

    isc.DataSource.create({
        ID:"sdocClass",
        tagName:"class",
        fields : [
            { name:"type", xmlAttribute:"true" },
            { name:"superclass", xmlAttribute:"true" },
            { name:"properties", multiple:true, type:"sdocProperty" },
            { name:"methods", multiple:true, type:"sdocMethod" }
        ]
    });
    

    var xml = window.sdocClass.xmlSerialize(isc.getValues(docData));    
    
    xml = '<?xml version="1.0" encoding="UTF-8"?>\n<javascript>\n' +
            xml +
          "\n</javascript>";          
    
    // We'll send this to the server in chunks, to get around a Tomcat default limitation
    // of 2MB on a post request (this seems to be set even lower on MIME - doesn't like 1MB)
    
    var chunk = 1024 * 512;    
    var sentLength = 0;
    isc.DMI.callBuiltin({
        methodName: "saveFile", 
        arguments: [
            "/tools/aptana/SmartClient" + this.options.version + "API.xml",
            xml.length > chunk ? xml.substring(0, chunk) : xml
        ]
    });
    
    sentLength = chunk; 
    
    while (xml.length > sentLength) {
        isc.DMI.callBuiltin({
            methodName: "appendToFile",
            arguments: [
                "/tools/aptana/SmartClient" + this.options.version + "API.xml", 
                sentLength + chunk > xml.length ? xml.substring(sentLength) 
                                                : xml.substring(sentLength, sentLength + chunk)]
        });
        sentLength += chunk;
    }

},

addScriptDocItem : function (docItem, docData) {
    var ref = docItem.ref;
    var refPath = ref.substring(ref.indexOf(docItem.type) + docItem.type.length + 1);
    var refContainer = refPath.substring(0, refPath.indexOf("."));
    var refName = refPath.substring(refPath.indexOf(".")+1);
    
    isc.logWarn("Adding to ScriptDoc: " + docItem.ref);

    var type = docItem.type;
    switch (docItem.type) {
        case "class":
        case "object":
            var className = refPath;
            var iscClass = isc.ClassFactory.getClass(className);
            var superClass = iscClass && iscClass.getSuperClass()
            if (superClass == null && type != "object") this.logWarn("no Super: " + className);
            var classDef = docData[className] = docData[className] || {
                type:"isc." + refPath,
                // WXX - We may need to reinstate this if Aptana get their inheritance stuff
                // together and we want to selectively exclude chunks of the Class and Canvas API
                superclass:superClass ? "isc." + superClass.Class : "Object",
                //superclass:"Object",
                description: this.stripDescription(docItem.description)
            }

			// We need to explicitly document "create" against every class, so we can show it 
            // returning an instance of the class so Aptana knows it's a factory method
	        // (this doesn't apply to FormItems, which should not be directly created)

	        if (!iscClass || !iscClass.isA("FormItem")) {
	            if (!classDef.methods) classDef.methods = [];
	            var methodDef = {
	                name:"create",
	                description: "Create a new instance of " + className,
	                scope:"static"
	            }
	            methodDef["return-types"] = {
	            	type:"isc." + className,
	                description: "The newly-created instance"
	            }

	
	            classDef.methods.add(methodDef);
	        }
            
            // Workround for current problem with Aptana whereby it isn't showing details of 
            // inherited methods and attributes - we'll walk the inheritance stack ourselves and 
            // emit explicit docs for inherited stuff against this class. Note that this may
            // be more than a workround - we may prefer to selectively leave out chunks of the 
            // API for Canvas and Class, where we may be creating more noise than useful info.
            
            // options.duplicate == null == Don't copy any docs
            // options.duplicate == "all" == Copy docs for the entire inheritance stack, all the 
            //                               way back to Class
            // options.duplicate == "most" == Copy docs for the inheritance stack, but stop when
            //                                you hit either Class or Canvas (ie, don't copy docs 
            //                                for either of those classes). Note that this option 
            //                                looks at options.pickedAttrs and options.pickedMethods
            //                                to determine anything on either of those classes 
            //                                that explicitly SHOULD be copied down
            
            if (this.options.duplicate == "most" || this.options.duplicate == "all") {
                this.documentInheritanceRecursively(classDef, superClass);
            }

        break;

        case "classAttr":
        case "attr":
            var classDef = docData[refContainer];
            if (classDef == null) {
                this.logWarn("No class definition: " + ref);
                break;
            }
            if (!classDef.properties) classDef.properties = [];
            classDef.properties.add({
                name:refName,
                description: this.stripDescription(docItem.description),
                scope:type == "classAttr" ? "static" : "instance",
                access:docItem.flags && docItem.flags.contains("W") ? "read-write" : "read",
                type:docItem.valueType
            })
        break;

        case "method":
        case "classMethod":
        case "staticMethod":
            // Don't document the "create" method inherited from Class - we've already taken steps to
            // document a class-specific create, so that Aptana recognises it as a factory method for
            // that particular object type (NB - not FormItems)
            if (refContainer == "FormItem" || refName != "create") {
                var classDef = docData[refContainer];
                if (classDef == null) {
                    this.logWarn("No class definition: " + ref);
                    break;
                }
                if (!classDef.methods) 
                    classDef.methods = [];
                
                methodDef = {
                    name: refName,
                    description: this.stripDescription(docItem.description),
                    scope: type == "classMethod" || type == "staticMethod" ? "static" : 
                                                                             "instance"
                }
                methodDef["return-types"] = {
                    type: this.normalizeType(docItem.returns ? docItem.returns.type : null),
                    description: docItem.returns ? this.stripDescription(docItem.returns.description) : ""
                }
                
                this.addParameters(methodDef, docItem);
                
                if (this.options.scMode) {
                    this.scModeExtras(methodDef, refContainer, refName);
                }
                             
                classDef.methods.add(methodDef);
            }
        break;
    }
},

addParameters : function (methodDef, docItem) {

    if (isc.isAn.Array(docItem.params)) {
        var params = [];
        for (var i = 0; i < docItem.params.length; i++) {
            var p = docItem.params[i];
            if (!p.type) {
                isc.logWarn(docItem.ref + ", parameter " + p.name + " has null type");
                var paramType = "unspecified";
            } else {
                paramType = this.normalizeType(p.type);
            }
            params.add({
                name: p.name,
                usage: p.optional ? "optional" : "required",
                type: paramType,
                description: this.stripDescription(p.description)
            });
            methodDef["parameters"] = params;
        }
    }
},

scModeExtras : function (methodDef, className, methodName) {                

    var iscClass = isc.ClassFactory.getClass(className);
    if (iscClass && iscClass._stringMethodRegistry[methodName] != null) {
        methodDef.stringMethod = true;
        
        if (iscClass.getInstanceProperty(methodName) == null ||  // documented but no default impl
            iscClass[methodName] == isc.noOp ) {                 // implemented as function () {}
            
            methodDef.event = true;
        } else {
            var funcBody = isc.Func.getBody(iscClass.getInstanceProperty(methodName)).trim();
            if (funcBody == isc.emptyString) {  // Implemented as an empty function, but not
                methodDef.event = true;         // exactly the same as isc.noOp
            }
        }
        
        if (methodDef.event && isc.EH.reverseEventTypes[methodName]) {
            methodDef.bubbles = true;
        }
        
    }
},

normalizeType : function (typeIn) {
    if (!typeIn) return "null";
    if (typeIn.toLowerCase().startsWith("string") ||
    typeIn.toLowerCase().startsWith("number") ||
    typeIn.toLowerCase().startsWith("int") ||
    typeIn.toLowerCase().startsWith("boolean") ||
    typeIn.toLowerCase().startsWith("text") ||
    typeIn.toLowerCase().startsWith("object")) {
        return typeIn;
    } else {
        return "isc." + typeIn;
    }
},

documentInheritanceRecursively : function (classDef, superClass) {
    
    // NOTE: This function isn't as efficient as it could be when we're running in "most" mode,
    // as it will still trace back as far as Class and Canvas, and loop through the methods and
    // attrributes of those classes, rejecting most of them. However, the alternative (a new
    // special case function just to deal with Class and Canvas) seemed a bit clunky.
    
    var scName = superClass ? superClass.getClassName() : null;
    
    if (scName) {
        this.documentInheritanceRecursively(classDef, superClass.getSuperClass());

        var docItems = isc.getValues(isc.JSDoc.docItems);
        classDef.methods = classDef.methods || [];
        classDef.properties = classDef.properties || [];

        var classMethods = docItems.findAll({
            definingClass: "class:" + scName,
            type: "method"
        });
        
        classMethods = classMethods || [];

        classMethods.addList(docItems.findAll({
            definingClass: "class:" + scName,
            type: "classMethod"
        }));
        
        for (var i = 0; i < classMethods.length; i++) {
            var method = classMethods[i];
            if ((scName != "Class" && scName != "Canvas") ||
                (this.options.duplicate == "all" || 
                 method.name == "create" ||
                 this.options.pickedMethods.contains(method.name)) && 
                 (scName == "FormItem" || method.name != "create")) {
                var methodDef = {
                    name: method.name,
                    description: this.stripDescription(method.description),
                    scope: method.type == "classMethod" ? "static" : "instance"
                }
                methodDef["return-types"] = {
                    type: method.returns ? this.normalizeType(method.returns.type) : "null",
                    description: method.returns ? method.returns.description : ""
                }
                this.addParameters(methodDef, method);
                if (this.options.scMode) {
                    this.scModeExtras(methodDef, scName, method.name);
                }
                classDef.methods.add(methodDef);
            }
        }
        
        // Now attributes
        var classAttrs = docItems.findAll({
            definingClass: "class:" + scName,
            type: "attr"
        });
        
        classAttrs = classAttrs || [];

        classAttrs.addList(docItems.findAll({
            definingClass: "class:" + scName,
            type: "classAttr"
        }));
        
        for (var i = 0; i < classAttrs.length; i++) {
            var attr = classAttrs[i];
            if ((scName != "Class" && scName != "Canvas") ||
                 this.options.duplicate == "all" || 
                 this.options.pickedAttrs.contains(attr.name)) { 
                classDef.properties.add({
                    name: attr.name,
                    description: this.stripDescription(attr.description),
                    scope: attr.type == "classAttr" ? "static" : "instance",
                    access: attr.flags && attr.flags.contains("W") ? "read-write" : "read",
                    type: attr.valueType
                });
            }
        }

    }

},

stripDescription : function (desc) {
    if (desc == null) return null;
    var moreTokens = true,
        work = isc.clone(desc);
    while (moreTokens) {
        var start = work.indexOf('${isc.DocUtils');
        if (start < 0) moreTokens = false;
        else {
            var end = work.indexOf('}', start);
            if (end > start) {
                var substr = work.substring(start, end);
                var quote = substr.lastIndexOf("'");
                var apos = substr.lastIndexOf('&apos;');
                if (quote < apos) {
                    quote = apos;
                }
                var replaceLen = 1;
                substr = substr.substring(0, quote);
                quote = substr.lastIndexOf("'");
                apos = substr.lastIndexOf('&apos;');
                var colon = substr.lastIndexOf(':');
                if (quote < apos) {
                    quote = apos;
                    replaceLen = 6;
                }
                if (quote < colon) {
                    quote = colon;
                    replaceLen = 1;
                }
                substr = substr.substring(quote + replaceLen);
                work = work.substring(0, start) + substr + work.substring(end + 1);
            }
        }
    }
    
    return isc.DocUtils.stripHTML(work.trim());
}

});

// support referenceDocs.js loading bfore JSDoc.js - no need for the user to call init()
if (isc.docItems) isc.jsdoc.init(isc.docItems);
