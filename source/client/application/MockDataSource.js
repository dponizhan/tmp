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
// ----------------------------------------------------------------------------------------

//> @class MockDataSource
// A special kind of +link{dataSource.clientOnly,client-only DataSource} that can be configured
// with +link{mockDataSource.mockData,"mock data"} - a simple text format for table or tree
// data.
// <p>
// MockDataSources are produced by the Reify Mockup Importer when starting from mockup formats
// that use the mock data format.  The docs for the 
// +link{group:balsamiqImport,Reify Mockup Importer} explain various steps for converting a
// <code>MockDataSource</code> to a real DataSource.
// <p>
// <code>MockDataSource</code> is primarily intended as a temporary form of DataSource used
// during the process of converting a mockup into a real application.  Generally, if creating a
// client-only DataSource in <smartclient>JavaScript</smartclient> <smartgwt>Java</smartgwt>,
// there is no reason to use the mock data format, as the mock data is not especially readable
// when written as a String literal.  The mock data format <i>can</i> be a slightly more
// compact and readable as compared to declaring +link{DataSource.cacheData} in XML.
// <p>
// Note: If a MockDataSource has +link{DataSource.addGlobalId,addGlobalId}
// set to true, it will be made available in global scope.
// <P>
// Unlike other DataSources, if a MockDataSource is created with an ID that is already in use
// by another DataSource, the existing DataSource will not be <code>destroy()</code>'d 
// and the new MockDataSource will not be available by ID.<br>
// Similarly, if a MockDataSource exists and a new DataSource is created with the same ID
// the MockDataSource will be <code>destroy()</code>'d automatically without logging a
// warning to the developer console.<br>
// This means if application code changes to replace a MockDataSource with a "real" 
// dataSource it will function as expected, without warnings, even if the MockDataSource 
// creation code was not removed, regardless of the order in which
// the MockDataSource and "real" dataSource are created.
//
// @inheritsFrom DataSource
// @treeLocation Client Reference/Data Binding
// @visibility external
//<
isc.defineClass("MockDataSource", "DataSource");

isc.MockDataSource.addClassProperties({

    parseTextWikiSymbols : function (text) {
        var italic = false;
        var bold = false;
        var link = false;
        var res = [];
        for (var i=0; i<text.length; i++) {
            var c = text.charAt(i);
            if (c == '\\') {
                if( (i + 1) < text.length && text.charAt(i + 1) == 'r') {
                    c = "<br/>";
                    i++;    
                }
            } else if (c == '[' && text.indexOf("]",i+1) > 0) {
                c = "<a href='#'>";
                link = true;
            } else if (c == ']') {
                if (link) {
                    c = "</a>";
                    link = false;
                }
            } else if (c == '*') {
                if (bold) {
                    bold = false;
                    c = "</b>";
                } else {
                    bold = true;
                    c = "<b>";
                }
            } else if (c == '_') {
                if (italic) {
                    italic = false;
                    c = "</i>";
                } else {
                    italic = true;
                    c = "<i>";
                }
            }
            res.push(c);
        }
        return res.join("");
    },
    
    convertTitleToName : function (title, fieldNamingConvention, rawHeaders) {
        var trailingUnderscore = true,
            name = title.trim().replace(/(\\r|\r)/g, "_").replace(/[^a-zA-Z0-9_# ]/g, "_");
        
        name = name.replace(/#+/g, " Number ");
        name = name.trim();
        
        if (name == "" || (name.charAt(0) >= '0' && name.charAt(0) <= '9')) {
            name = '_' + name;
        }
        var parts = name.split(" ");
        name = "";
        // naming conventions used when generating MockDataSource and FormItem field names from
        //  titles:
        //     - "camelCaps" eg "First Name" becomes firstName
        //  - "underscores" eg "First Name" becomes first_name
        //  - "underscoresAllCaps" eg "First Name" becomes FIRST_NAME
        //  - "underscoresKeepCase" eg "First Name" becomes First_Name
        // - default to camelCaps
        if ("underscores" == fieldNamingConvention) {
            for (var i = 0; i < parts.length; i++) {
                name += parts[i].toLowerCase();
                if (i != (parts.length - 1)) {
                    name += "_";
                }
            }
        } else if ("underscoresAllCaps" == fieldNamingConvention) {
            for (var i = 0; i < parts.length; i++) {
                name += parts[i].toUpperCase();
                if (i != (parts.length - 1)) {
                    name += "_";
                }
            }
        } else if ("underscoresKeepCase" == fieldNamingConvention) {
            for (var i = 0; i < parts.length; i++) {
                name += parts[i];
                if (i != (parts.length - 1)) {
                    name += "_";
                }
            }
        } else {
            name = parts[0].toLowerCase();
            // camelCaps is default
            for (var i = 1; i < parts.length; i++) {
                name += parts[i].substring(0, 1).toUpperCase();
                name += parts[i].substring(1).toLowerCase();
            }
        }
        while (trailingUnderscore) {
            if (name.endsWith("_")) {
                name = name.substring(0, name.length - 1);
            } else {
                trailingUnderscore = false;
            }
        }

        if (name == "") {
            name = "isc_gen";
        }
        
        if (name != title && rawHeaders.contains(name)) {
            // new name collides with another title
            while (rawHeaders.contains(name)) {
                name += "_";
            }
        }
        
        return name;
    },

    // Test for digits
    _isDigit : function(aChar) {
        var myCharCode = aChar.charCodeAt(0);
        if((myCharCode > 47) && (myCharCode <  58)) {
            return true;
        }
        return false;
    },
   
    splitComma : function(str) {
        var rawParts = str.split(","), parts = [];
        for (var i = 0, len = rawParts.length, part; i < len; ++i) {
            part = "";
            while (rawParts[i].slice(-1) == "\\") {
                part += rawParts[i++].slice(0, -1) + ",";
            }
            parts.push(part + rawParts[i]);
        }
        return parts;
    },

    isFieldParametersLine : function (line) {
        return (line.startsWith("[") &&
                line.endsWith("]") && 
                line != "[]" &&
                line != "[ ]" &&
                line != "[x]");
    },

    // Tree-specific formatting is documented here:
    // https://support.mybalsamiq.com/projects/uilibrary/Tree%20Pane
    parseTree : function(treeData) {
        var nodeArray = treeData.split("\n");
        var dataTree = [];
        var lastNode;
        var lastIndent = 0;
        for (var i=0; i < nodeArray.length; i++) {
            var newNode = {};
            
            var nodeChars = nodeArray[i].split("");
            var indent = 0;
            for (var j=0; j < nodeChars.length; j++) {             
                if (nodeChars[j] == " " || nodeChars[j] == ".") {
                    indent += 1;  
                } else {
                    break;
                }
            }
            var nodeName = nodeArray[i].substr(indent);
            
            // detect open folder
            if (nodeName.startsWith("f") || nodeName.startsWith(">") 
             || nodeName.startsWith("[x") || nodeName.startsWith("[+")) {
                newNode.isFolder = true;            
            // detect closed folder
            } else if (nodeName.startsWith("F") || nodeName.startsWith("v") 
             || nodeName.startsWith("[ ") || nodeName.startsWith("[-")) {
                newNode.isFolder = true;
                newNode.isOpen = true;
            }
            var checkedImage = isc.CheckboxItem.getInstanceProperty("checkedImage");
            var uncheckedImage = isc.CheckboxItem.getInstanceProperty("uncheckedImage");
            // set the appropriate icon
            if (nodeName.startsWith("f")) {
            } else if (nodeName.startsWith(">")) {
            } else if (nodeName.startsWith("[x")) {
                newNode.icon = checkedImage;
            } else if (nodeName.startsWith("[+")) {
            } else if (nodeName.startsWith("F")) {
            } else if (nodeName.startsWith("v")) {
            } else if (nodeName.startsWith("[ ")) {
                newNode.icon = uncheckedImage;
            } else if (nodeName.startsWith("[-")) {
            } else if (nodeName.startsWith("-")) {
                newNode.isFolder = false;

            // _ means "leave a space for your own icon". If it ends up being a folder node,
            // then the folder is open. See, e.g., the Windows Explorer example:
            // https://mockupstogo.mybalsamiq.com/projects/desktopapplications/Windows%20Explorer
            } else if (nodeName.startsWith("_")) {
                newNode.icon = isc.Canvas._blankImgURL;
                newNode.isOpen = true;
            }
            // strip out node metadata
            if (nodeName.startsWith("[")) nodeName = nodeName.substr(3);
            else if (newNode.isFolder) nodeName = nodeName.substr(1);
            else if (nodeName.startsWith("-") || nodeName.startsWith("_")) nodeName = nodeName.substr(1);

            newNode.name = isc.MockDataSource.parseTextWikiSymbols(nodeName).trim();
            newNode.children = [];
            if (indent == 0) {
                // node is top level
                dataTree.add(newNode);
            } else if (indent > lastIndent) {
                // node is child of previous node
                lastNode.children.add(newNode);
                newNode.parent = lastNode;
            } else if (indent == lastIndent) {
                // node is same level as previous node
                lastNode.parent.children.add(newNode);
                newNode.parent = lastNode.parent;
            } else {
                // indent is less than last indent, so we need to add further up
                // the parent hierarchy
                var ti = lastIndent;
                var parent = lastNode.parent;
                while (ti > indent) {
                    parent = parent.parent;
                    ti -= 1;
                }
                parent.children.add(newNode);
                newNode.parent = parent;
            }
            lastNode = newNode;
            lastIndent = indent;
        }
        return dataTree;
    },
    
    _treeNodePrefixes: [ "f", "F", ">", "v", "[x]", "[+]", "[-]", "[ ]", "-", "_" ],
    detectMockDataType : function (mockData) {
        var nodeArray = mockData.split("\n"),
            prefixes = isc.MockDataSource._treeNodePrefixes
        ;
        for (var i = 0; i < nodeArray.length; i++) {
            var record = nodeArray[i].replace(/^\s+/gm,""),
                hasTreePrefix = false
            ;
            if (record.length == 0) continue;
            for (var j = 0; j < prefixes.length; j++) {
                var prefix = prefixes[j];
                if (record.startsWith(prefix + " ")) {
                    hasTreePrefix = true;
                    break;
                }
            }
            if (!hasTreePrefix) return "grid";
        }
        return "tree";
    }
})

isc.MockDataSource.addProperties({
    //> @attr mockDataSource.mockData (String | Array of Record : "md" : IR)
    // Data intended for a +link{ListGrid} or +link{TreeGrid}, expressed in a simple text
    // format popularized by mockup tools such as +externalLink{http://balsamiq.com,balsamiq} and now
    // commonly supported in a variety of mockup tools.
    // <p>
    // Balsamiq publishes documentation of the grid format 
    // +externalLink{https://docs.balsamiq.com/cloud/editing-controls/#the-data-grid-table-control,here},
    // with a simple example of using tree-specific formatting
    // +externalLink{https://docs.balsamiq.com/cloud/editing-controls/#the-tree-pane,here}.
    // <p>
    // MockData can also be provided as XML, CSV or JSON text by setting +link{mockDataFormat} to
    // the correct format.
    // <p>
    // An alternative format of data consisting of an array of +link{object:Record,Records} can
    // also be provided. In this case the records are converted to "grid" +link{type:MockDataType,format}.
    // @visibility external
    //<
    mockData: "md",

    //> @type MockDataFormat
    // Specifies the format of the mock data.
    //
    // @value "mock"              Mock data in "balsamiq" format
    // @value "csv"               Mock data in CSV format
    // @value "xml"               Mock data in XML format
    // @value "json"              Mock data in JSON format
    //
    // @visibility external
    //<

    //> @attr mockDataSource.mockDataFormat (MockDataFormat : "mock" : IR)
    // Format of data provided in +link{mockData}. See +link{MockDataFormat}.
    //
    // @visibility external
    //<
    mockDataFormat: "mock",

    //> @type MockDataType
    // Whether the mock data is for a flat grid-like dataset or for a tree.  If "grid" is
    // specified, text shortcuts that would cause a hierarchy to be created (such as starting a
    // line with "[+]") will not have special meaning and be considered to be just a normal
    // data value.
    //
    // @value "grid"              Mock data for a ListGrid
    // @value "tree"              Mock data for a TreeGrid
    //
    // @visibility external
    //<

    //> @attr mockDataSource.mockDataType (MockDataType : null : IR)
    // When +link{mockDataSource.mockDataFormat} is "mock", whether +link{mockData} 
    // is in the "grid" or "tree" format. See +link{MockDataType}.
    // <p>
    // If not specified, the type will be detected from the data.
    //
    // @visibility external
    //<

    //> @type FieldNamingConvention
    // Field naming convention for fields derived from +link{mockDataSource.mockData}.
    //
    // @value "camelCaps"           Format name with camel casing (eg "Fist Name" becomes firstName)
    // @value "underscores"         Format name with underscores (eg "First Name" becomes first_name)
    // @value "underscoresAllCaps"  Format name with underscores in all caps (eg "First Name" becomes FIRST_NAME)
    // @value "underscoresKeepCase" Format name with underscores retaining casing (eg "First Name" becomes First_Name)
    //
    // @visibility internal
    //<

    //> @attr mockDataSource.fieldNamingConvention (FieldNamingConvention : "camelCaps" : IR)
    // Naming convention for fields derived from +link{mockData}.
    //
    // @visibility internal
    //<
    fieldNamingConvention: "camelCaps",

    //> @attr mockDataSource.detectFieldTypes (Boolean : true : IR)
    // Should field types be detected using +{class:SchemaGuesser}?
    //
    // @visibility internal
    //<
    detectFieldTypes:true,

    // Properties to be applied to SchemaGuesser instances
    guesserProperties: { minExampleCount: 4 },

    clientOnly: true,

    //> @attr mockDataSource.fromServer (Boolean : false : [IR])
    // Was this MockDataSource saved to and loaded from the server by +link{group:visualBuilder,
    // VisualBuilder}?  Even though MockDataSources are +link{clientOnly}, when created in
    // VisualBuilder through the editor they are saved on the server, and we want to provide
    // special handling for certain operations on them as if they were server-based DataSources.
    //<

    // Override init to setup cacheData and fields using mockData
    init : function () {
        // Save any explicitly defined fields for later reference
        this._explicitFields = this.fields;

        this.initializeDataAndFields();

        // VB support: save off a copy of fields before they are marked up for deployment (conversion to SQL)
        this._baseFields = isc.clone(this.fields); 

        return this.Super("init", arguments);
    },

    // Reset cached data to original state.
    // Used by VB to reset screen's MockDataSources to original state after user preview's
    // the screen where data can be edited.
    resetData : function () {
        this.initializeDataAndFields();
    },

    initializeDataAndFields : function () {
        if (!this.cacheData) this.cacheData = [];
        if (!this.fields) this.fields = [];

        var mockData = this.mockData,
            mockDataType = this.mockDataType
        ;

        if (mockData && isc.isA.String(mockData) && this.mockDataFormat != "mock") {
            // mockData provided as XML, CSV or JSON text. Convert data to
            // Array of Record.
            var parser = isc.FileParser.create({ hasHeaderLine: true });
            if (this.mockDataFormat == "xml") {
                // Process XML data into JSON.
                var xmlData = isc.xml.parseXML(mockData);
                if (!xmlData) {
                    this.logWarn("XML data in mockData could not be parsed");
                    return;
                }
                var elements = isc.xml.selectNodes(xmlData, "/"),
                    jsElements = isc.xml.toJS(elements)
                ;
                if (jsElements.length == 1) {
                    var encoder = isc.JSONEncoder.create({ dateFormat: "dateConstructor", prettyPrint: false });
                    var json = encoder.encode(jsElements[0]);

                    // XML data is now pre-processed into JSON
                    mockData = parser.parseJsonData(json); 
                }
            } else if (this.mockDataFormat == "csv") {
                mockData = parser.parseCsvData(mockData); 
            } else if (this.mockDataFormat == "json") {
                mockData = parser.parseJsonData(mockData); 
            } else {
                this.logWarn("Invalid mockDataFormat '" + this.mockDataFormat + "'");
                return;
            }
        }

        if (mockData && isc.isAn.Array(mockData) && mockData.length > 0) {
            // mockData provided as Array of Record. Convert data to
            // mockData format.

            var md = mockData,
                records = []
            ;

            // Extract field names from the records.
            // Since XML and JSON formats can leave empty
            // fields out of records all of the records
            // must be inspected to determine the full
            // list of field names in use.
            var fieldNames = [];

            md.forEach(function (line) {
                var keys = isc.getKeys(line);

                for (var i = 0; i < keys.length; i++) {
                    var fieldName = keys[i];
                    if (!fieldNames.contains(fieldName)) fieldNames.add(fieldName);
                }
            });
            records.push(fieldNames.join());

            // Create CSV lines for each record using extracted fieldNames
            // so the values are always in the same order
            md.forEach(function (line) {
                var record = [];

                for (var i = 0; i < fieldNames.length; i++) {
                    var fieldName = fieldNames[i],
                        value = line[fieldName]
                    ;
                    if (value == null) value = "";
                    else if (isc.isA.String(value) && value.contains(",")) value = "\"" + value + "\"";
                    record.push(value);
                }
                records.push(record.join());
            });

            mockData = records.join('\n');

            // mockData as Array of Record is always for grid
            mockDataType = "grid";
        } else if (mockData && isc.isAn.Array(mockData) && mockData.length == 0) {
            // No data - nothing to show
            mockData = null;
        }

        if (mockData && !mockDataType) {
            // Determine the mockDataType from the mockData
            mockDataType = isc.MockDataSource.detectMockDataType(mockData);
        }

        if (mockData && mockDataType == "grid") {
            var rawMockLines = mockData.split("\n");
            var fieldParameters = this.getFieldParameters(rawMockLines);

            this.rawHeaderLine = rawMockLines[0];

            var fields = this.parseTableFields(this.rawHeaderLine, fieldParameters);
            this.sortProperties = this.extractSortProperties(fields);

            var records = this.getDataRecords(rawMockLines, fields, fieldParameters);

            // If SchemaGuesser is not loaded skip field type detection
            if (records && records.length > 0 && isc.SchemaGuesser && this.detectFieldTypes) {
                var guesser = isc.SchemaGuesser.create(this.guesserProperties);
                guesser.fields = fields;

                fields = guesser.extractFieldsFrom(records);
                records = guesser.convertData(records);
            }
            if (fields.length > 0) {
                // Add a PK field so that live changes can be reflected in associated DBCs
                fields.addAt({ name: "internalId", type: "sequence", primaryKey: true, hidden: true }, 0);

                // Inserts will automatically generate the next sequence number based on
                // the existing values of the field. For the current records, though, initial
                // initial sequence values must be created.
                if (records) {
                    for (var i = 0; i < records.length; i++) {
                        records[i].internalId = i+1;
                    }
                }
            }
            if (!this.fields || this.fields.length == 0 || isc.isAn.emptyObject(this.fields)) {
                this.fields = fields;
            }
            if (!this.cacheData || this.cacheData.length == 0) this.cacheData = records;
        } else if (mockDataType == "tree") {
            if (!this.fields || this.fields.length == 0 || isc.isAn.emptyObject(this.fields)) {
                this.fields = [{
                    name: "name",
                    type: "text"
                }];
            }
            if (mockData && (!this.cacheData || this.cacheData.length == 0)) {
                this.cacheData = isc.MockDataSource.parseTree(mockData);
            }
        }
        
        this._mockDataType = mockDataType;
    },

    hasExplicitFields : function () {
        return (this._explicitFields != null &&
            (!isc.isAn.Array(this._explicitFields) && isc.isAn.Object(this._explicitFields)
                ? isc.getKeys(this._explicitFields).length > 0
                : this._explicitFields.length > 0)
        );
    },

    // Apply settings to grid paletteNode
    // Used by balsamiqTransformRules and GridEditProxy
    applyGridSettings : function (control) {
        if (!control) control = {};

        control.autoFetchData = true;
        if (this._mockDataType == "tree") {
            control.dataProperties = {openProperty: "isOpen"};
            return control;
        }

        // compute headerHeight based on number of rows in titles
        var maxRows = this.getHeaderDisplayRowCount();

        control.headerHeight = Math.max(25, 15 * maxRows);
        control.autoFitFieldWidths = true;
        control.autoFitWidthApproach = "title";
        if (control.leaveScrollbarGap == null) {
            control.leaveScrollbarGap = false;
        }

        if (this.sortProperties) isc.addProperties(control, this.sortProperties);

        // Add basic ListGridFields so editNodes are created
        var fields = isc.getValues(this.fields);
        control.fields = [];
        for (var i = 0; i < fields.length; i++) {
            var field = fields[i],
                fieldProps = { name: field.name, type: field.type }
            ;
            if (field.title) fieldProps.title = field.title;
            if (field.hidden) fieldProps.hidden = field.hidden;
            control.fields.add(fieldProps);
        }

        if (control.dataSource && control.dataSource.MockDataSource) {
            control.dataSource.MockDataSource.fieldNamingConvention = this.fieldNamingConvention;
            control.dataSource.MockDataSource.fields = fields;
            control.dataSource.MockDataSource.cacheData = this.cacheData;
        }

        return control;
    },

    getFieldParameters : function (rawMockLines) {
        var fieldsParameters = null, 
            fieldsParametersLine = rawMockLines[rawMockLines.length - 1]
        ;
        if (isc.MockDataSource.isFieldParametersLine(fieldsParametersLine)) {
            fieldsParameters = fieldsParametersLine.substring(1, fieldsParametersLine.length - 1).split(",");
        }

        return fieldsParameters;
    },

    extractSortProperties : function (fields) {
        var properties;
        for (var i = 0; i < fields.length; i++) {
            if (fields[i].sortDirection) {
                var field = fields[i],
                    sort = {
                        property: field.name,
                        direction: fields[i].sortDirection
                    }
                ;
                if (!properties) {
                    properties = { initialSort: [sort] };
                } else {
                    properties.initialSort.add(sort);
                }
                delete fields[i].sortDirection;
            }
        }
        return properties;
    },

    getHeaderDisplayRowCount : function () {
        var vs = this.rawHeaderLine.split(","),
            maxRows = 1
        ;
        for (var i = 0; i < vs.length; i++) {
            maxRows = Math.max(maxRows, vs[i].split("\\r").length);
        }
        return maxRows;
    },

    parseTableFields : function(rawHeaderLine, fieldParameters) {
        var rawHeaders = isc.MockDataSource.splitComma(rawHeaderLine),
            headerArray = []
        ;

        for (var j = 0; j < rawHeaders.length; j++) {
            var name = null;

            // split title into a field name and title if it contains "|"
            var text = rawHeaders[j].trim().replace(/(\\r|\r)/g, "<br/>");
            if (text.indexOf("|") >= 0) {
                var tokens = text.split(/\s*\|\s*/),
                    name = tokens[0];
                if (name) text = tokens[1];
            }

            var sortDirection = null;
            if (text.endsWith(" ^")) {
                sortDirection = "ascending";
                text = text.substring(0, text.length-2).trim();
            } else if (text.endsWith(" v")) {
                sortDirection = "descending";
                text = text.substring(0, text.length-2).trim();
            }

            // if the field name wasn't extracted from text, compute it now
            if (!name) {
                name = isc.MockDataSource.convertTitleToName(text,
                           this.fieldNamingConvention, rawHeaders);
            }

            var actualName = name;
            var iter = 0;
            do {
                var wasSame = false;
                for (var i=0; i < headerArray.length; i++) {
                    if (headerArray[i].name == actualName) {
                        iter++;
                        actualName = name + iter;
                        wasSame = true;
                        break;
                    }
                }  
            } while (wasSame);
            if (text == "") {
                text = "&nbsp;";
            }
            var field = {
                name: actualName,
                title: text
            };
            // The following code was added to fix an issue in 1.15:
            //   BMMLImport fixes:
            //     1. fix for hscrollbars in grids and test for it
            //     2. fix for \r character in imported xml files
            // It's not clear how this change "fixed" the issue. Additionally, the "align"
            // property is not a DataSourceField documented property and causes different
            // results depending on the target DBC (ex ListGrid vs DynamicForm).
            //
            // if (field.title.length <= 3) {
            //     field.align = "center";
            // }
            if (sortDirection) field.sortDirection = sortDirection;
            if (fieldParameters && fieldParameters[j]) {
                field.width = fieldParameters[j];
                var lastChar = field.width[field.width.length - 1];
                if (!isc.MockDataSource._isDigit(lastChar)) {
                    field.width = field.width.substring(0, fieldParameters[j].length - 1);
                    if (lastChar == 'R' || lastChar == 'r') {
                        field.align = "right";
                    } else if (lastChar == 'L' || lastChar == 'l') {
                        field.align = "left";
                    } else if (lastChar == 'C' || lastChar == 'c') {
                        field.align = "center";
                    } 
                }
                field.width += "%";
            }
            headerArray.add(field);
        }

        return headerArray;
    },


    getDataRecords : function (rawMockLines, fields, fieldParameters) {
        var rowArray = [];

        // ignore the first line which is column names.
        // if fieldParameters was found ignore the last line
        var length = rawMockLines.length - (fieldParameters ? 1 : 0);
        for (var i = 1; i < length; i++) {   
            if (isc.MockDataSource.isFieldParametersLine(rawMockLines[i])) {
                // Failsafe in case a field parameters line is found within the data
                continue;
            }
            var rowObject = {};
            var valueArray = isc.MockDataSource.splitComma(rawMockLines[i]);

            for (var j=0; j < fields.length; j++) {
                var currVal = valueArray[j];
                if (currVal != null) {
                    currVal = currVal.replace(/\r/g, "<br/>");
                      if (!this.detectFieldTypes || currVal != "[]" && currVal != "[ ]" && currVal != "[x]") {
                        currVal = currVal.replace("[]", "<input type='checkbox' />");
                        currVal = currVal.replace("[ ]", "<input type='checkbox' />");
                        currVal = currVal.replace("[x]", "<input type='checkbox' checked='true' />");
                        currVal = isc.MockDataSource.parseTextWikiSymbols(currVal);
                    }
                    rowObject[fields[j].name] = currVal;
                }
            }            
            rowArray.add(rowObject);
        }
        return rowArray;
    }
});
