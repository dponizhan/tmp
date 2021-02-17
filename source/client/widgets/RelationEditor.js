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

// If ListGrid, or DynamicForm isn't loaded don't attempt to create this class - it's a requirement.
if (isc.ListGrid != null && isc.DynamicForm != null) {


//> @class RelationEditor
// Provides a UI for creating and editing +link{DataSource, DataSources) relationships.
// 
// @inheritsFrom VLayout
// @visibility devTools
//<
isc.ClassFactory.defineClass("RelationEditor", "VLayout");

isc.RelationEditor.addProperties({
    // attributes 
    overflow: "visible",
    membersMargin: 10,
    layoutTopMargin: 5,
    layoutLeftMargin: 5,
    layoutRightMargin: 5,
    // Not setting bottom margin so buttons are placed to match other windows

    // properties

    //> @attr relationEditor.dsDataSource (DataSource | ID : null : IRW)
    // DataSource to be used to load and save ds.xml files, via fileSource operations.
    //
    // @visibility devTools
    //<

    //> @attr relationEditor.knownDataSources (Array of DataSource : null : IRW)
    // List of DataSources from which to choose a related DataSource.
    // <p>
    // Note that an existing relation to a DataSource not included in this list cannot
    // be edited.
    //
    // @setter setKnownDataSources()
    // @visibility devTools
    //<

    // Mappings for relationsList description field and choices for type selection.
    // Type selection will always exclude "Self" option since the DS choice dictates self
    relationTypeDescriptions: {
        "1-M": "Each \"${currentDS}\" record may have multiple \"${relatedDS}\" records (1-to-many)",
        "M-1": "Each \"${relatedDS}\" record may have multiple \"${currentDS}\" records (many-to-1)",
        "Self": "Each \"${currentDS}\" record may have multiple other \"${relatedDS}\" records, in a tree"
    },

    // Component properties

    outerLayoutDefaults: {
        _constructor: "VLayout",
        autoDraw: false,
        isGroup: true,
        showGroupLabel: false,
        membersMargin: 10,
        layoutMargin: 10
    },

    //> @attr relationEditor.relationsList (AutoChild ListGrid : null : IR)
    //
    // @visibility devTools
    //<
    relationsListDefaults: {
        _constructor: "ListGrid",
        autoDraw:false,
        autoParent: "outerLayout",
        autoFocus:true,
        saveLocally:true,
        width: "100%",
        height: 200,
        showClippedValuesOnHover: true,
        fields: [
            { name: "type", title: "Relation Type", width: 150,
                valueMap: {
                    "1-M": "1-to-many",
                    "M-1": "many-to-1",
                    "Self": "tree self-relation"
                }
            },
            { name: "dsId", title: "DataSource", width: 200 },
            { name: "description", title: "Description", width: "*",
                formatCellValue : function (value, record, rowNum, colNum, grid) {
                    if (!record) return;
                    var type = record.type,
                        description = grid.creator.relationTypeDescriptions[type]
                    ;
                    description = description.evalDynamicString(grid, {
                        currentDS: grid.creator.dataSource.ID,
                        relatedDS: record.dsId
                    });
                    return description;
                }
            }
        ],

        selectionType:"single",
        selectionUpdated : function (record) {
            if (record) this.creator.editRelation(record);
        },

        canRemoveRecords:true,
        removeRecordClick : function (rowNum, colNum) {
            var grid = this,
                record = this.getRecord(rowNum)
            ;
            // if there's no record, nothing to do
            if (!record) return;

            if (!this.recordMarkedAsRemoved(rowNum)) {
                var message = "Removing this relationship will remove all existing links between " +
                    "'${currentDS}' records and '${relatedDS}' records if you save. " +
                    "This cannot be undone. Proceed?";
                message = message.evalDynamicString(this, {
                    currentDS: this.creator.dataSource.ID,
                    relatedDS: record.dsId
                });
                isc.ask(message, function (value) {
                    if (value) grid.creator.removeRelation(record);
                }, {
                    buttons: [isc.Dialog.NO, isc.Dialog.YES]
                });
            } else {
                grid.creator.removeRelation(record);
            }
        },

        getCellStyle : function (record, rowNum, colNum) {
            var style = this.Super("getCellStyle", arguments);
            if (record.canSelect != false) return style;
            var field = this.getField(colNum);
            if (field.isRemoveField) return style;
            return this.getBaseStyle() + "Disabled";
        },

        canHover:true,
        hoverWrap:false,

        hoverAutoFitWidth:false,
        hoverStyle: "darkHover",
        cellHoverHTML : function (record, rowNum, colNum) {
            var field = this.getField(colNum);
            if (field.isRemoveField) {
                if (this.recordMarkedAsRemoved(rowNum)) {
                    return "Restore this relation";
                }
                return "Remove this relation";
            }
            if (record.canSelect == false) {
                return "Related DataSource '" + record.dsId +
                    "' is not included in the project. Relation cannot be edited."
            }
        }
    },

    addNewButtonDefaults: {
        _constructor: "IButton",
        autoDraw: false,
        autoParent: "outerLayout",
        title: "Add New",
        width: 75,
        layoutAlign: "right",
        click: function() {
            this.creator.addRelation();
        }
    },

    //> @attr relationEditor.relationForm (AutoChild DynamicForm : null : IRW)
    //
    // @visibility devTools
    //<
    relationFormDefaults: {
        _constructor: "DynamicForm",
        autoDraw:false,
        autoParent: "outerLayout",
        height: 175,
        wrapItemTitles:false,
        numCols: 4,
        colWidths: [ 125, 25, 50, "*" ],
        fields: [
            { name: "dsId", type: "SelectItem", title: "Related DataSource", colSpan: 3,
                change : function (form, item, value, oldValue) {
                    var result = true;
                    if (value) {
                        var ds = isc.DS.get(value);
                        if (ds && isc.isA.MockDataSource(ds) && !ds.hasExplicitFields()) {
                            var pendingChange = form.creator.getPendingChange(value);
                            if (!pendingChange || !pendingChange.fields) {
                                // Don't accept user value yet. If confirm change it will
                                // be put back.
                                result = false;

                                form.creator.confirmConvertSampleDataMockDataSource(ds,
                                    function (defaults) {
                                        // User-selected value is now confirmed valid
                                        item.changeToValue(value, true);
                                    }
                                );
                            }
                        }
                    }
                    return result;
                }
            },
            { name: "type", type: "RadioGroup", title: "Relation Type", colSpan: 3,
                valueMap: {
                    "1-M": "1-to-many",
                    "M-1": "many-to-1"
                    // "1-1": "1-1"
                    
                },
                defaultValue: "1-M"
            },
            { name: "treeMessageSpacer", type: "SpacerItem", visible: false },
            { name: "treeMessage", type: "staticText", showTitle: false, title: "&nbsp;", visible: false,  colSpan: 3 },
            { name: "fieldName", type: "text", title: "Stored as", required: true,  colSpan: 3,
                validateOnExit: true,
                validators: [
                    {
                        type:"custom",
                        condition: function (item, validator, value, record, additionalContext) {
                            if (!value) return true;

                            // Validate that the field value is not the name of an existing
                            // field on the target DataSource
                            var ds = (record.type == "1-M" ? isc.DS.get(record.dsId) : item.form.creator.dataSource);
                            if (!ds) return true;

                            // Valid if field is not found
                            var valid = (ds.getField(value) == null);

                            if (!valid) {
                                validator.defaultErrorMessage 
                                    = "Value matches an existing field in '" + ds.ID + "'. " +
                                        "Please choose another field name.";
                            }

                            return valid;
                        }
                    }
                ]
            },
            { name: "enableDisplayAs", type: "boolean", align: "right", width: 125,
                showTitle: false, labelAsTitle: true, startRow: true,
                visibleWhen: {
                    _constructor: "AdvancedCriteria", operator: "and",
                    criteria: [ { fieldName: "type", operator: "equals", value: "M-1" } ]
                }
            },
            { name: "displayField", type: "text", editorType: "SelectItem", title: "Display as",  colSpan: 2,
                allowEmptyValue: true,
                hint: "from dsID",
                visibleWhen: {
                    _constructor: "AdvancedCriteria", operator: "and",
                    criteria: [ { fieldName: "type", operator: "equals", value: "M-1" } ]
                },
                readOnlyWhen: {
                    _constructor: "AdvancedCriteria", operator: "or",
                    criteria: [
                        { fieldName: "dsId", operator: "isNull" },
                        { fieldName: "enableDisplayAs", operator: "notEqual", value: true }
                    ]
                }
            },
            { name: "enableNameAs", type: "boolean", align: "right", width: 125,
                showTitle: false, labelAsTitle: true, startRow: true,
                visibleWhen: {
                    _constructor: "AdvancedCriteria", operator: "and",
                    criteria: [ { fieldName: "type", operator: "equals", value: "M-1" } ]
                }
            },
            { name: "includeField", type: "text", title: "Name as",  colSpan: 2,
                hint: "in DataSource dsID",
                visibleWhen: {
                    _constructor: "AdvancedCriteria", operator: "and",
                    criteria: [ { fieldName: "type", operator: "equals", value: "M-1" } ]
                },
                readOnlyWhen: {
                    _constructor: "AdvancedCriteria", operator: "or",
                    criteria: [
                        { fieldName: "dsId", operator: "isNull" },
                        { fieldName: "enableNameAs", operator: "notEqual", value: true }
                    ]
                },
                validateOnExit: true,
                validators: [
                    {
                        type:"custom",
                        dependentFields: "fieldName",
                        condition: function (item, validator, value, record, additionalContext) {
                            if (!value) return true;

                            // Validate that the field value is not the name of an existing
                            // field on the target DataSource or the Stored As fieldname
                            if (value == record.fieldName) {
                                validator.defaultErrorMessage 
                                    = "Value matches the Stored As value. " +
                                        "Please choose another field name.";
                                return false;
                            }

                            var ds = (record.type == "1-M" ? isc.DS.get(record.dsId) : item.form.creator.dataSource);
                            if (!ds) return true;

                            // Valid if field is not found
                            var valid = (ds.getField(value) == null);

                            if (!valid) {
                                validator.defaultErrorMessage 
                                    = "Value matches an existing field in '" + ds.ID + "'. " +
                                        "Please choose another field name.";
                            }

                            return valid;
                        }
                    }
                ]
            }
        ],
        editRecord : function (record) {
            this.creator.addRelationButton.disable();
            record.enableDisplayAs = (record.displayField != null);
            record.enableNameAs = (record.includeField != null);
            this.updateTypeChoices(record);
            this.updateFieldNameHint(record);
            this.updateDisplayAsChoices(record);
            this.updateDisplayAsHint(record);
            this.updateNameAsHint(record);
            this.Super("editRecord", arguments);
            this.updateTreeMessage(record);
            this.setFieldDefaults();
        },
        editNewRecord : function (record) {
            this.creator.addRelationButton.disable();
            this.updateTypeChoices(record);
            this.updateFieldNameHint(record);
            this.updateDisplayAsChoices(record);
            this.updateDisplayAsHint(record);
            this.updateNameAsHint(record);
            this.Super("editNewRecord", arguments);
            this.updateTreeMessage(record);
            this.setFieldDefaults();
        },
        itemChanged : function (item, newValue) {
            var record = this.getValues();
            if ("dsId" == item.name) {
                this.updateTypeChoices(record);
                this.updateFieldNameHint(record);
                this.updateFieldNameValue();
                this.updateDisplayAsChoices(record, true);
                this.updateDisplayAsHint(record);
                this.updateNameAsValue();
                this.updateNameAsHint(record);
                this.updateTreeMessage(record);
            } else if ("type" == item.name) {
                this.updateFieldNameHint(record);
                this.updateFieldNameValue();
                this.updateDisplayAsChoices(record);
                this.updateDisplayAsHint(record);
                this.updateNameAsValue();
                this.updateNameAsHint(record);
                this.updateTreeMessage(record);
            }
            if (this.valuesAreValid(false)) {
                var isNew = (this.saveOperationType == "add");
                if (!isNew) {
                    this.creator.saveRelation(this.getValues(), isNew);
                } else {
                    this.creator.addRelationButton.enable();
                }
            } else {
                this.creator.addRelationButton.disable();
            }
        },
        setFieldDefaults : function () {
            var isNew = (this.saveOperationType == "add");
            if (isNew || this.getValue("displayField")) {
                this.setValue("enableDisplayAs", true);
            }
            this.setValue("enableNameAs", this.getValue("includeField") != null);
            if (isNew) {
                var dsId = this.getValue("dsId"),
                    currentDSId = (this.creator.dataSource ? this.creator.dataSource.ID : null)
                ;
                if (dsId && dsId == currentDSId) {
                    this.setValue("type", "Self");
                } else { 
                    this.setValue("type", "1-M");
                }
            }
        },
        updateDataSourceChoices : function () {
            var dataSourceIds = this.creator.knownDataSources.getProperty("ID"),
                currentDSId = (this.creator.dataSource ? this.creator.dataSource.ID : null),
                valueMap = {}
            ;
            // If the DS being edited is not part of the knownDataSources add it now
            // so that a tree relations can be defined.
            if (!dataSourceIds.contains(currentDSId)) dataSourceIds.add(currentDSId);

            dataSourceIds.sort();

            for (var i = 0; i < dataSourceIds.length; i++) {
                var id = dataSourceIds[i];
                valueMap[id] = (id == currentDSId ? id + " (tree via self-relation)" : id);
            }
            this.getField("dsId").setValueMap(valueMap);
        },
        updateTypeChoices : function (record) {
            var dsId = (record ? record.dsId : null),
                currentDSId = (this.creator.dataSource ? this.creator.dataSource.ID : null),
                descriptions = this.creator.relationTypeDescriptions,
                typeField = this.getField("type"),
                valueMap = {}
            ;

            if (dsId && dsId == currentDSId) {
                // For the type RadioGroupItem to accept the "Self" value it must be in valueMap
                valueMap = { "Self": "Tree self-relation" };
                typeField.hide();
                typeField.setValueMap(valueMap);
            } else {
                for (var type in descriptions) {
                    if (type == "Self") continue;
                    var description = descriptions[type];
                    description = description.evalDynamicString(this, {
                        currentDS: currentDSId,
                        relatedDS: dsId || "&lt;tbd&gt;"
                    });
                    valueMap[type] = description;
                }
                typeField.setValueMap(valueMap);
                typeField.show();
            }
        },
        updateFieldNameHint : function (record) {
            var hint;
            if (record) {
                var dsId = (record.type == "1-M" ? record.dsId : this.creator.dataSource.ID);
                hint = (dsId ? "on <i>" + dsId + "</i>" : null);
            }
            this.getField("fieldName").setHint(hint);
        },
        updateFieldNameValue : function () {
            var relatedDSId = this.getValue("dsId"),
                currentDSId = (this.creator.dataSource ? this.creator.dataSource.ID : null),
                type = this.getValue("type"),
                ds = (type == "1-M" ? this.creator.dataSource : isc.DS.get(relatedDSId))
            ;
            if (ds) {
                // A title is likely singular so use it if defined
                var dsTitle = (ds.title || ds.ID).replace(/ /g, ""),
                    value = dsTitle.substring(0, 1).toLowerCase() + dsTitle.substring(1) + "Id"
                ;
                // A tree relation (self) uses a "parent" field
                if (relatedDSId && relatedDSId == currentDSId) {
                    value = "parent" + dsTitle.substring(0, 1).toUpperCase() + dsTitle.substring(1) + "Id";
                }
                this.setValue("fieldName", value);
            }
        },
        updateDisplayAsChoices : function (record, dsChanged) {
            if (!record) return;
            var dsId = record.dsId,
                displayAsValue = record.displayField,
                displayAsField = this.getField("displayField"),
                clearValue = dsChanged,
                valueMap
            ;
            if (dsId) {
                var currentDSId = (this.creator.dataSource ? this.creator.dataSource.ID : null),
                    ds = (dsId == currentDSId ? this.creator.dataSource : isc.DS.get(dsId))
                ;
                valueMap = ds.getFieldNames();

                if (!displayAsValue || dsChanged) {
                    var defaultTitleField = ds.getTitleField();
                    if (defaultTitleField) {
                        displayAsField.setValue(defaultTitleField);
                        clearValue = false;
                    }
                }
            }
            if (clearValue) displayAsField.clearValue();
            displayAsField.setValueMap(valueMap);
        },
        updateDisplayAsHint : function (record) {
            var hint;
            if (record) {
                hint = (record.dsId ? "from <i>" + record.dsId + "</i>" : null);
            }
            this.getField("displayField").setHint(hint);
        },
        updateNameAsValue : function () {
            var relatedDSId = this.getValue("dsId"),
                nameAsValue = this.getValue("includeField")
            ;
            if (relatedDSId && !nameAsValue) {
                // No need for a default NameAs value unless the displayField conflicts
                // with a local field.
                var ds = this.creator.dataSource,
                    displayAsValue = this.getValue("displayField"),
                    localField = ds.getField(displayAsValue)
                ;
                if (localField) {
                    // Existing field using the same name. Introduce an alias based on the
                    // target DS and field name
                    var includeField = relatedDSId +
                            displayAsValue.substring(0, 1).toUpperCase() +
                            displayAsValue.substring(1);
                    this.setValue("includeField", includeField);
                    this.setValue("enableNameAs", true);
                }
            }
        },
        updateNameAsHint : function (record) {
            var hint;
            if (record) {
                hint = (record.dsId ? "in <i>" + this.creator.dataSource.ID + "</i>" : null);
            }
            this.getField("includeField").setHint(hint);
        },
        updateTreeMessage : function (record) {
            var dsId = (record ? record.dsId : null),
                currentDSId = (this.creator.dataSource ? this.creator.dataSource.ID : null),
                treeMessageSpacerField = this.getField("treeMessageSpacer"),
                treeMessageField = this.getField("treeMessage")
            ;

            if (dsId && dsId == currentDSId) {
                treeMessageSpacerField.show();
                treeMessageField.show();
                treeMessageField.setValue("Each '" + currentDSId +
                    "' record may have multiple other '" + currentDSId + "' records, in a tree.");
            } else {
                treeMessageSpacerField.hide();
                treeMessageField.hide();
            }
        }
    },

    addRelationButtonDefaults: {
        _constructor: "IButton",
        autoDraw: false,
        autoParent: "outerLayout",
        title: "Add Relation",
        width: 75,
        layoutAlign: "right",
        click: function() {
            this.creator.saveNewRelation();
        }
    },


    buttonLayoutDefaults: {
        _constructor: "HLayout",
        autoDraw: false,
        width: "100%",
        height:42,
        layoutMargin:10,
        membersMargin:10,
        align: "right"
    },

    cancelButtonDefaults: {
        _constructor: "IButton",
        autoDraw: false,
        title: "Cancel",
        width: 75,
        autoParent: "buttonLayout",
        click: function() {
            this.creator.cancelClick();
        }
    },

    saveButtonDefaults: {
        _constructor: "IButton",
        autoDraw: false,
        title: "Save",
        width: 75,
        autoParent: "buttonLayout",
        click: function() {
            this.creator.saveClick();
        }
    },

    bodyProperties:{
        overflow:"auto",
        layoutMargin:10
    },

    // methods

    initWidget : function () {
        this.Super('initWidget', arguments);

        this.addAutoChildren(["outerLayout","relationsList","addNewButton","relationForm","addRelationButton","buttonLayout"]);
        this.buttonLayout.addMember(this.createAutoChild("cancelButton"));
        this.buttonLayout.addMember(this.createAutoChild("saveButton"));

        if (this.knownDataSources) this.setKnownDataSources(this.knownDataSources);

        this.addRelation();
    },

    // api

    //> @method relationEditor.setKnownDataSources()
    // Setter for +link{knownDataSources}.
    // @param dataSourceList (Array of DataSource) known DataSources
    // @visibility devTools
    //<
    setKnownDataSources : function (dataSourceList) {
        this.knownDataSources = dataSourceList;
        delete this._rawRelations;
        this.relationForm.updateDataSourceChoices();
    },

    //> @method relationEditor.edit()
    // Start editing relations for a DataSource.
    // 
    // @param dataSource (Object | DataSource | ID) dataSource or defaults to edit relations
    // @param [callback] (Function) function to call after save
    // @visibility devTools
    //<
    edit : function (dataSource, callback, selectForeignKey) {
        if (!this.knownDataSources) {
            this.logWarn("'knownDataSources' not populated - ignoring relations edit")
            return;
        }

        this.dsDefaults = null;
        if (!isc.isA.DataSource(dataSource) && isc.isAn.Object(dataSource)) {
            // Passed in defaults
            var defaults = isc.clone(dataSource);

            var existingDSId = defaults.ID;

            // Create an actual instance of DS for reference. If the DS is readOnly
            // in the DS Editor we don't want to create an override class that may
            // break the current project.
            defaults.addGlobalId = false;
            delete defaults.ID;
            var dsClass = dataSource._constructor || "DataSource";
            dataSource = isc.ClassFactory.getClass(dsClass).create(defaults);
            dataSource.ID = existingDSId;
            delete defaults.addGlobalId;
            defaults.ID = existingDSId;

            this.dsDefaults = defaults;
        }
        this.dataSource = isc.DS.get(dataSource);

        // to be called when editing completes
        this.saveCallback = callback;

        this.relationsList.emptyMessage = "Inspecting relations for " + this.dataSource.ID;
        this.relationsList.setData([]);

        if (isc.isA.MockDataSource(this.dataSource) && !this.dataSource.hasExplicitFields()) {
            var pendingChange = this.getPendingChange(this.dataSource.ID);
            if (!pendingChange || !pendingChange.fields) {
                var _this = this;
                this.waitUntilDrawn(function (dataSource, callback, selectForeignKey) {
                    _this.confirmConvertSampleDataMockDataSource(dataSource, function (defaults) {
                        _this.edit(defaults, callback, selectForeignKey);
                    });
                }, [dataSource, callback, selectForeignKey]);
                return;
            }
        }

        if (!this.dsDefaults) {
            var self = this;
            this.getDataSourceDefaults(this.dataSource.ID, function (dsId, defaults) {
                // Save defaults for editing
                self.dsDefaults = defaults;
                self.start(selectForeignKey);
            });
        } else {
            this.start(selectForeignKey);
        }
    },

    // Used by DataSourceEditor to pull details on pending saves when refreshing its
    // copy of the DSRelations
    getPendingChange : function (dsId) {
        return (this.pendingSaves ? this.pendingSaves[dsId] : null);
    },

    newRelationMessage: "New ${type} relation added from ${sourceDSId} to ${targetDSId}.",
    newRelationActionTitle: "Click to view new fields on ${sourceDSId} DataSource",

    // Show added relations as notifications @ (x,y) if specified.
    // Callback will be made if the user clicks on message link passing the dsId as argument
    showNewRelationNotifications : function (x, y, actionCallback, excludeLocalRelations, width) {
        // Save callback for use by notificationActionClicked()
        this._notificationCallback = actionCallback;
        var newRelations = this._newRelations;
        if (!isc.isAn.emptyObject(newRelations)) {
            // Show a message for each new relation via the Notify system
            for (var dsId in newRelations) {
                var relation = newRelations[dsId],
                    type = relation.type,
                    sourceDSId = this.dataSource.ID,
                    targetDSId = relation.dsId
                ; 

                if ("M-1" == type || "Self" == type) {
                    // Don't show relations that are defined in this.dataSource
                    if (excludeLocalRelations) continue;
                    type = ("M-1" == type ? "Many-to-1" : type);
                } else if ("1-M" == type) {
                    type = "1-to-many";
                    sourceDSId = relation.dsId;
                    targetDSId = this.dataSource.ID;
                }

                var message = this.newRelationMessage.evalDynamicString(this, {
                    type: type,
                    sourceDSId: sourceDSId,
                    targetDSId: targetDSId
                });
                var actionTitle = this.newRelationActionTitle.evalDynamicString(this, {
                    type: type,
                    sourceDSId: sourceDSId,
                    targetDSId: targetDSId
                });
                var settings = {
                    duration: 7000,
                    canDismiss: true, 
                    messageIcon: "[SKIN]/Notify/checkmark.png",
                    autoFitWidth: (width == null),
                    autoFitMaxWidth: 550,
                    appearMethod: "fade",
                    disappearMethod: "fade",
                    x: x,
                    y: y
                };
                if (width != null) {
                    settings.labelProperties = { width: width };
                }

                isc.Notify.addMessage(
                    message,
                    [{
                        separator: "<BR>",
                        title: actionTitle,
                        target: this, methodName: "notificationActionClicked",
                        args: [sourceDSId]
                    }],
                    null,
                    settings
                );
            }
        }
    },

    // Call callback saved in showNewRelationNotifications() with selected target dsId
    notificationActionClicked : function (dsId) {
        if (this._notificationCallback) {
            this.fireCallback(this._notificationCallback, ["dsId"], [dsId]);
        }
    },

    //> @method relationEditor.save()
    // Save all pending changes to +link{dsDataSource}.
    // 
    // @param [includeEditedDataSource] (boolean) should edited DS changes be saved?
    // @param [callback] (Function) function to call after save
    // @visibility devTools
    //<
    save : function (includeEditedDataSource, callback) {
        if (!this.pendingSaves || isc.isAn.emptyObject(this.pendingSaves)) {
            this.fireCallback(callback);
            return;
        }

        var _this = this,
            dsList = isc.getKeys(this.pendingSaves),
            saveCount = 0
        ;
        if (!includeEditedDataSource) {
            var index = dsList.findIndex("ID", this.dataSource.ID);
            if (index >= 0) dsList.remove(index);
        }

        var fireCallback = function () {
            if (--saveCount <= 0) {
                // Reload the saved DataSource instance
                isc.DataSource.load(dsId, function() {
                    _this.fireCallback(callback, "dsList", [dsList]);
                }, true, true);
            }
        };

        for (var dsId in this.pendingSaves) {
            // Exclude edited DS if desired
            if (!includeEditedDataSource && dsId == this.dataSource.ID) continue;

            var defaults = this.pendingSaves[dsId];

            // handle custom subclasses of DataSource for which there is no schema defined by
            // serializing based on the DataSource schema but adding the _constructor property to
            // get the correct class.
            // XXX problem: if you ask an instance to serialize itself, and there is no schema for
            // it's specific class, it uses the superClass schema but loses it's Constructor
            // XXX we to preserve the class, we need to end up with the "constructor" property set
            // in XML, but this has special semantics in JS
            var dsClass = defaults._constructor || "DataSource",
                schema;
            if (isc.DS.isRegistered(dsClass)) {
                schema = isc.DS.get(dsClass);
            } else {
                schema = isc.DS.get("DataSource");
                defaults._constructor = dsClass;
            }

            // serialize to XML and save to server
            var xml = schema.xmlSerialize(defaults);
            // this.logWarn("saving DS with XML: " + xml);

            saveCount++;

            this.dsDataSource.saveFile({
                fileName: defaults.ID,
                fileType: "ds",
                fileFormat: "xml"
            }, xml, function() {
                fireCallback();
            }, {
                // DataSources are always shared across users - check for existing file to
                // overwrite without regard to ownerId
                operationId: "allOwners"
            });
        }

        // If there was nothing to save, let caller know
        if (saveCount == 0) {
            fireCallback();
        }
    },

    waitUntilDrawn : function (callback, params) {
        if (!this.isDrawn()) {
            this._untilDrawnDetails = {
                callback: callback,
                params: params
            };
            this.observe(this, "drawn", "observer._waitUntilDrawn();");
            return;
        }
        this.fireCallback(callback, null, params);
    },

    _waitUntilDrawn : function () {
        if (this.isObserving(this, "drawn")) this.ignore(this, "drawn");
        var callback = this._untilDrawnDetails.callback,
            params = this._untilDrawnDetails.params
        ;
        delete this._untilDrawnDetails;

        this.fireCallback(callback, null, params);
    },

    confirmConvertSampleDataMockDataSource : function (dataSource, callback) {
        var _this = this,
            dsId = dataSource.ID
        ;
        var message = "To create a relation with this DataSource, it must be converted " +
            "from sample data to editing fields and data separately.  Do this now?"

        isc.ask(message, function(response) {
            if (response) {
                _this.switchToEditFieldsAndDataSeparately(dataSource, function (defaults) {
                    if (!_this.pendingSaves) _this.pendingSaves = {};
                    _this.pendingSaves[dsId] = defaults;
                    callback(defaults);
                });
            } else {
                _this.cancelClick();
            }
        }, {
            buttons: [
                isc.Dialog.NO,
                isc.Dialog.YES
            ]
        });
        // Make sure dialog is above editor window
        isc.Dialog.Warn.delayCall("bringToFront");
    },

    start : function (selectForeignKey) {
        // this.dsDefaults and this.dataSource are both populated at this point
        this.relationForm.updateDataSourceChoices();

        // Create map of all relations between this.knownDataSources
        var dsList = this.knownDataSources;
        // If the DS being edited is not part of the knownDataSources add it now
        // so that relations can be extracted.
        if (dsList.find("ID", this.dataSource.ID) == null) {
            dsList = dsList.duplicate();
            dsList.add(this.dataSource);
        }
        this.dsRelations = isc.DSRelations.create({
            editor: this,
            dataSources: dsList,
            getRelationsForDataSource : function (name) {
                var relations = this.Super("getRelationsForDataSource", arguments),
                    dsDefaults = this.editor.dsDefaults
                ;
        
                for (var i = 0; i < relations.length; i++) {
                    var relation = relations[i],
                        type = relation.type,
                        displayField = relation.displayField,
                        includeField
                    ;
                    // Only post-process direct FK relations
                    if (type != "Self" && type != "M-1") continue;
        
                    // An includeFrom field doesn't include this information in the local
                    // DS object but since we only support the definitions of includeFrom
                    // and FK displayField for fields defined in the primary DS these
                    // details can be found in the dsDefaults. 
                    //
                    // The FK displayField references the includeFrom field by name but
                    // that name is either the includeFrom field name or an explicit name
                    // on the field (Name as). For editing the displayField should be the
                    // actual field name on the related DS and includeField is the name
                    // of the included field, if renamed. 
                    if (displayField && name == dsDefaults.ID) {
                        var field = dsDefaults.fields.find("name", displayField);
                        if (field) {
                            includeField = displayField;
                            if (field.includeFrom.indexOf(".") >= 0) {
                                displayField = field.includeFrom.split(".")[1];
                            } else {
                                displayField = field.includeFrom;
                            }
                        }
                        relation.displayField = displayField;
                        relation.includeField = includeField;
                    }
        
                    // If FK DS is not in this project, show relation as disabled
                    // and prevent selection.
                    
                    var dsList = this.editor.knownDataSources;
                    relation.canSelect = (name == relation.dsId || dsList.find("ID", relation.dsId) != null);
                }
                return relations;
            },
            getForeignKeyFields : function (ds) {
                var editor = this.editor,
                    dsId = ds.ID
                ;
                if (editor.pendingSaves && editor.pendingSaves[dsId]) {
                    ds = editor.pendingSaves[dsId];
                }
                return this.Super("getForeignKeyFields", arguments);
            }
        });
        

        // Get relations from the perspective of this.dataSource
        var relations = this.dsRelations.getRelationsForDataSource(this.dsDefaults.ID);

        // Save original relations to determine added records and correct data to remove
        this.originalRelations = isc.clone(relations);
        this.originalRelationsCount = relations.length;

        // These are the relations to edit
        this.relationsList.emptyMessage = "No relations defined for " + this.dataSource.ID;
        this.relationsList.setData(relations);

        if (selectForeignKey) {
            // Select relation for foreignKey
            var field = { foreignKey: selectForeignKey },
                relatedFieldName = isc.DS.getForeignFieldName(field),
                relatedDSName = isc.DS.getForeignDSName(field, this.dataSource)
            ;
            for (var i = 0; i < relations.length; i++) {
                var relation = relations[i];
                if (relation.dsId == relatedDSName && relation.relatedFieldName == relatedFieldName) {
                    this.relationsList.selectSingleRecord(relation);
                    break;
                }
            }
        } else {
            // Always start with editing a new relation in the lower form
            this.addRelation();
        }
    },

    getDataSourceDefaults : function (dsID, callback) {
        // we need the clean initialization data for this DataSource (the live data
        // contains various derived state)
        if (this.dsDefaults && this.dsDefaults.ID == dsID) {
            callback(dsID, this.dsDefaults);
            return;
        }

        this.dsDataSource.getFile({
            fileName: dsID,
            fileType: "ds",
            fileFormat: "xml"
        }, function (dsResponse, data, dsRequest) {
            isc.DMI.callBuiltin({
                methodName: "xmlToJS",
                arguments: [data],
                callback : function (rpcResponse, data) {
                    // instantiate the DataSource in "captureDefaults" mode, where Class.create()
                    // returns a editComponent instead
                    isc.ClassFactory._setVBLoadingDataSources(true);
                    isc.captureDefaults = true;
                    //!OBFUSCATEOK
                    var dsComponent = isc.eval(data);
                    isc.captureDefaults = null;
                    isc.capturedComponents = null;

                    // Re-create the actual DS for later reference. eval() above just extracts defaults
                    // but also leaves window[ID] referencing the defaults instead of an actual DS.
                    // The window[ID] value must be removed or the next eval will not insert the correct
                    // DS into the global namespace.
                    window[dsComponent.defaults.ID] = null;

                    //!OBFUSCATEOK
                    isc.eval(data);
                    isc.ClassFactory._setVBLoadingDataSources(null);

                    // Pull DS class type and push into defaults._constructor so the correct
                    // schema will be serialized when saved.
                    var ds = isc.DS.get(dsID);
                    dsComponent.defaults._constructor = ds.getClassName();

                    callback(dsID, dsComponent.defaults);
                }
            });
        }, {
            // DataSources are always shared across users
            operationId: "allOwners"
        });
    },

    addRelation : function () {
        // Start editing a new relation. No record in list yet.
        this.relationsList.deselectAllRecords();
        this.relationForm.editNewRecord();
    },

    saveNewRelation : function () {
        if (!this.relationForm.valuesAreValid(false)) return;

        this.saveRelation(this.relationForm.getValues(), true);
    },

    removeRelation : function (record) {
        var rowNum = this.relationsList.getRecordIndex(record);
        if (this.relationsList.recordMarkedAsRemoved(rowNum)) {
            this.relationsList.unmarkRecordRemoved(rowNum);
        } else {
            this.relationsList.markRecordRemoved(rowNum);
            this.addRelation();
        }
    },

    editRelation : function (record) {
        this.relationForm.editRecord(record);
    },

    saveRelation : function (record, isNew) {
        if (isNew) {
            // In saveLocally:true mode addData() is synchronous
            this.relationsList.addData(record);
            // Select the new relation
            this.relationsList.selectSingleRecord(record);
            // form will now save relation data as isNew:false 
        } else {
            var gridRecord = this.relationsList.getSelectedRecord(),
                rowNum = this.relationsList.getRecordIndex(gridRecord)
            ;
            // Update record in place
            isc.addProperties(gridRecord, record);
            if (!record.enableDisplayAs) delete gridRecord.displayField;
            delete gridRecord.enableDisplayAs;
            if (!record.enableNameAs) delete gridRecord.includeField;
            delete gridRecord.enableNameAs;
            this.relationsList.refreshRow(rowNum);
        }
    },

    cancelClick : function () {
        // This editor is typically embedded in a Window that has a body layout.
        // Find the Window object, if any, and close it.
        var parents = this.getParentElements();
        if (parents && parents.length > 0) {
            var window = parents[parents.length-1];
            if (isc.isA.Window(window)) window.closeClick();
        }
    },

    saveClick : function () {

        // Accumulate list of FK field changes grouped by DataSource so they
        // can be applied together
        var relations = this.relationsList.data,
            changesByDataSource = {}
        ;
        for (var i = 0; i < relations.length; i++) {
            var relation = relations[i];
            // Ignore read-only relations
            if (relation.canSelect == false) continue;

            var deleted = this.relationsList.recordMarkedAsRemoved(i),
                changed = false
            ;
            if (deleted) {
                // If the relation to be deleted was added during this edit session
                // there is nothing else to do
                if (i >= this.originalRelationsCount) continue;

                relation = this.originalRelations[i];
            } else if (i < this.originalRelationsCount) {
                var origRelation = this.originalRelations[i];
                changed = !this.relationsMatch(origRelation, relation);
                if (changed) {
                    // Changed relation - register a change to remove the original relation
                    this.saveRelationChange(changesByDataSource, origRelation, true);
                }

                // If relation didn't change and no extra fields did either, go to next change
                if (!changed && this.relationExtrasMatch(origRelation, relation)) continue;
            }

            this.saveRelationChange(changesByDataSource, relation, deleted);

            // Save list of new relations for later notifications
            if (!changed && !deleted) {
                if (!this._newRelations) this._newRelations = {};
                this._newRelations[relation.dsId] = relation;
            }
        }

        if (!isc.isAn.emptyObject(changesByDataSource)) {
            var _this = this;
            for (var sourceDSId in changesByDataSource) {
                var changes = changesByDataSource[sourceDSId];

                this.updateForeignKeys(sourceDSId, changes, function (dsId, defaults) {
                    // Hold on to all changes to DS defaults to be saved later
                    if (!_this.pendingSaves) _this.pendingSaves = {};
                    if (defaults) _this.pendingSaves[dsId] = defaults;

                    delete changesByDataSource[dsId];
                    // When all changes have been applied fire the callback passed in when editing began
                    if (isc.isAn.emptyObject(changesByDataSource)) {
                        if (_this.saveCallback) {
                            _this.fireCallback(_this.saveCallback, "defaults",
                                [_this.pendingSaves[_this.dsDefaults.ID]]);
                            _this.saveCallback = null;
                        }
                    }
                });
            }
        } else if (this.pendingSaves && !isc.isAn.emptyObject(this.pendingSaves)) {
            // No PK/FK changes but there are outstanding changes to save (i.e. DS conversion)
            this.fireCallback(this.saveCallback, "defaults",
                [this.pendingSaves[this.dsDefaults.ID]]);
            this.saveCallback = null;
        } else {
            // Nothing to save - same as canceling
            this.cancelClick();
        }
    },

    relationsMatch : function (origRelation, relation) {
        var match = (origRelation.dsId == relation.dsId &&
            origRelation.type == relation.type &&
            origRelation.fieldName == relation.fieldName //&&
            // origRelation.displayField == relation.displayField
            );
        return match;
    },

    relationExtrasMatch : function (origRelation, relation) {
        var match = (origRelation.displayField == relation.displayField &&
            origRelation.includeField == relation.includeField);
        return match;
    },

    saveRelationChange : function (changesByDataSource, relation, deleted) {
        var type = relation.type;
        if ("M-1" == type || "Self" == type) {
            var sourceDSId = this.dataSource.ID;
            if (!changesByDataSource[sourceDSId]) changesByDataSource[sourceDSId] = [];
            changesByDataSource[sourceDSId].add({
                sourceDSId: sourceDSId,
                sourceFieldName: relation.fieldName,
                targetDSId: relation.dsId,
                targetFieldName: relation.relatedFieldName,
                displayField: relation.displayField,
                includeField: relation.includeField,
                deleted: deleted
            });
        } else if ("1-M" == type) {
            var sourceDSId = relation.dsId;
            if (!changesByDataSource[sourceDSId]) changesByDataSource[sourceDSId] = [];
            changesByDataSource[sourceDSId].add({
                sourceDSId: sourceDSId,
                sourceFieldName: relation.fieldName,
                targetDSId: this.dataSource.ID,
                targetFieldName: relation.relatedFieldName,
                deleted: deleted
            });
        }
    },

    updateForeignKeys : function (sourceDSId, changes, callback) {
        // we need the clean initialization data for this DataSource (the live data
        // contains various derived state)
        var self = this;
        var sourceChanges = changes;

        // If we've already updated the DS and saved in pendingSaves, update that DS
        if (this.pendingSaves && this.pendingSaves[sourceDSId]) {
            self._updateForeignKeys(this.pendingSaves[sourceDSId], sourceChanges, callback);
        } else {
            // Pull DS defaults and update them
            this.getDataSourceDefaults(sourceDSId, function (dsId, defaults) {
                self._updateForeignKeys(defaults, sourceChanges, callback);
            });
        }
    },

    _updateForeignKeys : function (defaults, changes, callback) {
        var sourceDSId = defaults.ID,
            sourceDS = (sourceDSId == this.dsDefaults.ID ? this.dataSource : isc.DS.get(sourceDSId))
        ;

        for (var i = 0; i < changes.length; i++) {
            var change = changes[i],
                sourceFieldName = change.sourceFieldName,
                targetDSId = change.targetDSId,
                targetFieldName = change.targetFieldName,
                targetDS = (targetDSId == this.dsDefaults.ID ? this.dataSource : isc.DS.get(targetDSId)),
                changed = false
            ;
            var targetPK = targetDS.getPrimaryKeyField(),
                targetPKName = targetDS.getPrimaryKeyFieldName()
            ;
            if (!targetFieldName) targetFieldName = targetPKName;

            var fk = targetDSId + "." + targetFieldName;

            // See if sourceFieldName exists
            var sourceField = defaults.fields.find("name", sourceFieldName);
            if (!sourceField) {
                // Need to create the sourceField FK
                var type = targetPK.type;
                if (type == "sequence") type = "integer";
                var field = { name: sourceFieldName, type: type, foreignKey: fk };
                defaults.fields.add(field);
                sourceField = field;
                changed = true;
            } else {
                // sourceField exists. See if FK needs to be updated or removed
                if (change.deleted && sourceField.foreignKey == fk) {
                    defaults.fields.remove(sourceField);
                    changed = true;
                } else if (!sourceField.foreignKey || sourceField.foreignKey != fk) {
                    var type = targetPK.type;
                    if (type == "sequence") type = "integer";
                    sourceField.type = type;
                    sourceField.foreignKey = fk;
                    changed = true;
                }
            }
            if (change.deleted) {
                // Remove any invalid includeFrom fields now that a relation is deleted
                var fields = defaults.fields;
                if (fields) {
                    var includeFromPrefix = targetDSId + ".";
                    for (var j = fields.length-1; j >= 0; j--) {
                        var field = fields[j];
                        if (field.includeFrom && field.includeFrom.startsWith(includeFromPrefix)) {
                            fields.removeAt(j);
                            changed = true;
                        }
                    }
                }
            }
            // Create/update FK displayField and/or includeFrom fields
            if (!change.deleted && (change.includeField || change.displayField)) {
                var displayField = change.includeField || change.displayField,
                    includeFrom = targetDSId + "." + change.displayField
                ;
                if (change.displayField) {
                    if (sourceField.displayField != displayField) {
                        sourceField.displayField = displayField;
                        changed = true;
                    }
                } else if (sourceField.displayField) {
                    delete sourceField.displayField;
                    changed = true;
                }

                var includeFromField = defaults.fields.find("name", displayField);
                if (!includeFromField) {
                    // An includeFrom field may not have a "name" attribute so we
                    // need to look for includeFrom="<targetDSId>.<name>" as well.
                    includeFromField = defaults.fields.find("includeFrom", includeFrom);
                }
                if (includeFromField) {
                    // includeFrom field already exists. Leave it as-is or update the name.
                    if (change.includeFrom) {
                        if (includeFromField.name != change.includeField) {
                            includeFromField.name = change.includeField;
                            changed = true;
                        }
                    } else if (includeFromField.name) {
                        delete includeFromField.name;
                        changed = true;
                    }
                } else {
                    // Create includeFrom field for the displayField. Since the includeFrom
                    // is used as displayField for the FK default it to hidden.
                    var field = { includeFrom: includeFrom, hidden: true };
                    if (change.includeField) {
                        field.name = change.includeField;
                    }
                    defaults.fields.add(field);
                    sourceField = field;
                    changed = true;
                }
            }
            
        }
        callback(sourceDS.ID, (changed ? defaults : null));
    },

    switchToEditFieldsAndDataSeparately : function (dataSource, callback) {
        this.getDataSourceDefaults(dataSource.ID, function (dsId, defaults) {
            // DataSource instance has derived fields from the mockData. Pull those fields.
            var fieldNames = dataSource.getFieldNames(),
                fields = []
            ;
            for (var i = 0; i < fieldNames.length; i++) {
                fields[i] = dataSource.getField(fieldNames[i]);
            }

            // Update DS defaults to shift MDS from mockData to fields and cacheData
            defaults.fields = fields.duplicate();
            defaults.cacheData = dataSource.cacheData;
            delete defaults.mockData;
            delete defaults.mockDataFormat;

            callback(defaults);
        });
    }
});

//> @class SimpleTreeRelationEditor
// Provides a UI for editing a +link{DataSource, DataSources) tree relationship.
// 
// @inheritsFrom VLayout
// @visibility devTools
//<
isc.ClassFactory.defineClass("SimpleTreeRelationEditor", "VLayout");

isc.SimpleTreeRelationEditor.addProperties({
    // attributes 
    overflow: "visible",
    membersMargin: 10,
    layoutTopMargin: 5,
    layoutLeftMargin: 5,
    layoutRightMargin: 5,
    // Not setting bottom margin so buttons are placed to match other windows

    // properties

    //> @attr simpleTreeRelationEditor.dsDataSource (DataSource | ID : null : IRW)
    // DataSource to be used to load and save ds.xml files, via fileSource operations.
    //
    // @visibility devTools
    //<

    // Component properties

    //> @attr simpleTreeRelationEditor.relationForm (AutoChild DynamicForm : null : IRW)
    //
    // @visibility devTools
    //<
    relationFormDefaults: {
        _constructor: "DynamicForm",
        autoDraw:false,
        autoFocus:true,
        wrapItemTitles:false,
        colWidths: [ 250, "*" ],
        fields: [
           { name: "fieldName", type: "text", title: "Relation will be stored on<br>DataSource under field",
                wrapTitle: true, required: true, selectOnFocus: true,
                validators: [
                    {
                        type:"custom",
                        condition: function (item, validator, value, record, additionalContext) {
                            if (!value) return true;

                            // Validate that the field value is not the name of an existing
                            // field on the DataSource
                            var ds = item.form.creator.dataSource;

                            // Valid if field is not found
                            var valid = (ds.getField(value) == null);

                            if (!valid) {
                                validator.defaultErrorMessage 
                                    = "Value matches an existing field in '" + ds.ID + "'. " +
                                        "Please choose another field name.";
                            }

                            return valid;
                        }
                    }
                ]
            }
        ],
        editNewRecord : function () {
            this.Super("editNewRecord", arguments);
            this.updateFieldNameTitle();
            this.updateFieldNameValue();
        },
        fieldNameTitle: "Relation will be stored on<br>DataSource '${dsId}' under field",
        updateFieldNameTitle : function () {
            var dsId = this.creator.dataSource.ID,
                title = this.fieldNameTitle.evalDynamicString(this, { dsId: dsId })
            ;
            this.getField("fieldName").title = title;
            this.getField("fieldName").redraw();
        },
        updateFieldNameValue : function () {
            var ds = this.creator.dataSource;

            // A title is likely singular so use it if defined
            var dsTitle = (ds.title || ds.ID).replace(/ /g, ""),
                baseValue = "parent" + dsTitle.substring(0, 1).toUpperCase() + dsTitle.substring(1) + "Id",
                value = baseValue,
                count = 2
            ;
            // Make sure default field name is unique
            while (ds.getField(value) != null) {
                value = baseValue + count;
                count++;
            }
            this.setValue("fieldName", value);
        }
    },

    buttonLayoutDefaults: {
        _constructor: "HLayout",
        width: "100%",
        height:42,
        layoutMargin:10,
        membersMargin:10,
        align: "right"
    },

    cancelButtonDefaults: {
        _constructor: "IButton",
        autoDraw: false,
        title: "Cancel",
        width: 75,
        autoParent: "buttonLayout",
        click: function() {
            this.creator.cancelClick();
        }
    },

    saveButtonDefaults: {
        _constructor: "IButton",
        autoDraw: false,
        title: "Save",
        width: 75,
        autoParent: "buttonLayout",
        click: function() {
            this.creator.saveClick();
        }
    },

    bodyProperties:{
        overflow:"auto",
        layoutMargin:10
    },

    // methods

    initWidget : function () {
        this.Super('initWidget', arguments);

        this.addAutoChildren(["relationForm","buttonLayout"]);
        this.buttonLayout.addMember(this.createAutoChild("cancelButton"));
        this.buttonLayout.addMember(this.createAutoChild("saveButton"));
    },

    // api

    //> @method simpleTreeRelationEditor.edit()
    // Start editing relation for a DataSource.
    // 
    // @param dataSource (Object | DataSource | ID) dataSource or defaults to edit relation
    // @param [callback] (Function) function to call after save
    // @visibility devTools
    //<
    edit : function (dataSource, callback) {
        this.dsDefaults = null;
        if (!isc.isA.DataSource(dataSource) && isc.isAn.Object(dataSource)) {
            // Passed in defaults
            var defaults = isc.clone(dataSource);

            var existingDSId = defaults.ID;

            // Create an actual instance of DS for reference. If the DS is readOnly
            // in the DS Editor we don't want to create an override class that may
            // break the current project.
            defaults.addGlobalId = false;
            delete defaults.ID;
            var dsClass = dataSource._constructor || "DataSource";
            dataSource = isc.ClassFactory.getClass(dsClass).create(defaults);
            dataSource.ID = existingDSId;
            delete defaults.addGlobalId;
            defaults.ID = existingDSId;

            this.dsDefaults = defaults;
        }
        this.dataSource = isc.DS.get(dataSource);

        // to be called when editing completes
        this.saveCallback = callback;

        if (isc.isA.MockDataSource(this.dataSource) && !this.dataSource.hasExplicitFields()) {
            var pendingChange = this.getPendingChange(this.dataSource.ID);
            if (!pendingChange || !pendingChange.fields) {
                var _this = this;
                this.waitUntilDrawn(function (dataSource, callback) {
                    _this.confirmConvertSampleDataMockDataSource(dataSource, function (defaults) {
                        _this.edit(defaults, callback);
                    });
                }, [dataSource, callback]);
                return;
            }
        }

        if (!this.dsDefaults) {
            var self = this;
            this.getDataSourceDefaults(this.dataSource.ID, function (dsId, defaults) {
                // Save defaults for editing
                self.dsDefaults = defaults;
                self.start();
            });
        } else {
            this.start();
        }
    },

    // Used by DataSourceEditor to pull details on pending saves when refreshing its
    // copy of the DSRelations
    getPendingChange : function (dsId) {
        return (this.pendingSaves ? this.pendingSaves[dsId] : null);
    },

    //> @method simpleTreeRelationEditor.save()
    // Save all pending changes to +link{dsDataSource}.
    // 
    // @param [callback] (Function) function to call after save
    // @visibility devTools
    //<
    save : function (callback) {
        if (!this.pendingSaves || isc.isAn.emptyObject(this.pendingSaves)) {
            this.fireCallback(callback);
            return;
        }

        var _this = this,
            dsList = isc.getKeys(this.pendingSaves),
            saveCount = 0
        ;
        var fireCallback = function () {
            if (--saveCount <= 0) {
                // Reload the saved DataSource instance
                isc.DataSource.load(dsId, function() {
                    _this.fireCallback(callback, "dsList", [dsList]);
                }, true, true);
            }
        };

        for (var dsId in this.pendingSaves) {
            var defaults = this.pendingSaves[dsId];

            // handle custom subclasses of DataSource for which there is no schema defined by
            // serializing based on the DataSource schema but adding the _constructor property to
            // get the correct class.
            // XXX problem: if you ask an instance to serialize itself, and there is no schema for
            // it's specific class, it uses the superClass schema but loses it's Constructor
            // XXX we to preserve the class, we need to end up with the "constructor" property set
            // in XML, but this has special semantics in JS
            var dsClass = defaults._constructor || "DataSource",
                schema;
            if (isc.DS.isRegistered(dsClass)) {
                schema = isc.DS.get(dsClass);
            } else {
                schema = isc.DS.get("DataSource");
                defaults._constructor = dsClass;
            }

            // serialize to XML and save to server
            var xml = schema.xmlSerialize(defaults);
            // this.logWarn("saving DS with XML: " + xml);

            saveCount++;

            this.dsDataSource.saveFile({
                fileName: defaults.ID,
                fileType: "ds",
                fileFormat: "xml"
            }, xml, function() {
                fireCallback();
            }, {
                // DataSources are always shared across users - check for existing file to
                // overwrite without regard to ownerId
                operationId: "allOwners"
            });
        }

        // If there was nothing to save, let caller know
        if (saveCount == 0) {
            fireCallback();
        }
    },

    waitUntilDrawn : function (callback, params) {
        if (!this.isDrawn()) {
            this._untilDrawnDetails = {
                callback: callback,
                params: params
            };
            this.observe(this, "drawn", "observer._waitUntilDrawn();");
            return;
        }
        this.fireCallback(callback, null, params);
    },

    _waitUntilDrawn : function () {
        if (this.isObserving(this, "drawn")) this.ignore(this, "drawn");
        var callback = this._untilDrawnDetails.callback,
            params = this._untilDrawnDetails.params
        ;
        delete this._untilDrawnDetails;

        this.fireCallback(callback, null, params);
    },

    confirmConvertSampleDataMockDataSource : function (dataSource, callback) {
        var _this = this,
            dsId = dataSource.ID
        ;
        var message = "To create a relation with this DataSource, it must be converted " +
            "from sample data to editing fields and data separately.  Do this now?"

        isc.ask(message, function(response) {
            if (response) {
                _this.switchToEditFieldsAndDataSeparately(dataSource, function (defaults) {
                    if (!_this.pendingSaves) _this.pendingSaves = {};
                    _this.pendingSaves[dsId] = defaults;
                    callback(defaults);
                });
            } else {
                _this.cancelClick();
            }
        }, {
            buttons: [
                isc.Dialog.NO,
                isc.Dialog.YES
            ]
        });
        // Make sure dialog is above editor window
        isc.Dialog.Warn.delayCall("bringToFront");
    },

    start : function () {
        // this.dsDefaults and this.dataSource are both populated at this point

        // Always start with editing a new relation in the lower form
        this.relationForm.editNewRecord();
    },

    getDataSourceDefaults : function (dsID, callback) {
        // we need the clean initialization data for this DataSource (the live data
        // contains various derived state)
        if (this.dsDefaults && this.dsDefaults.ID == dsID) {
            callback(dsID, this.dsDefaults);
            return;
        }

        this.dsDataSource.getFile({
            fileName: dsID,
            fileType: "ds",
            fileFormat: "xml"
        }, function (dsResponse, data, dsRequest) {
            isc.DMI.callBuiltin({
                methodName: "xmlToJS",
                arguments: [data],
                callback : function (rpcResponse, data) {
                    // instantiate the DataSource in "captureDefaults" mode, where Class.create()
                    // returns a editComponent instead
                    isc.ClassFactory._setVBLoadingDataSources(true);
                    isc.captureDefaults = true;
                    //!OBFUSCATEOK
                    var dsComponent = isc.eval(data);
                    isc.captureDefaults = null;
                    isc.capturedComponents = null;

                    // Re-create the actual DS for later reference. eval() above just extracts defaults
                    // but also leaves window[ID] referencing the defaults instead of an actual DS.
                    // The window[ID] value must be removed or the next eval will not insert the correct
                    // DS into the global namespace.
                    window[dsComponent.defaults.ID] = null;

                    //!OBFUSCATEOK
                    isc.eval(data);
                    isc.ClassFactory._setVBLoadingDataSources(null);

                    // Pull DS class type and push into defaults._constructor so the correct
                    // schema will be serialized when saved.
                    var ds = isc.DS.get(dsID);
                    dsComponent.defaults._constructor = ds.getClassName();

                    callback(dsID, dsComponent.defaults);
                }
            });
        }, {
            // DataSources are always shared across users
            operationId: "allOwners"
        });
    },

    cancelClick : function () {
        // This editor is typically embedded in a Window that has a body layout.
        // Find the Window object, if any, and close it.
        var parents = this.getParentElements();
        if (parents && parents.length > 0) {
            var window = parents[parents.length-1];
            if (isc.isA.Window(window)) window.closeClick();
        }
    },

    saveClick : function () {
        if (!this.relationForm.validate()) return;

        var _this = this,
            relation = this.relationForm.getValues(),
            sourceDS = this.dataSource,
            targetDS = this.dataSource,
            targetPK = targetDS.getPrimaryKeyField(),
            targetPKName = targetDS.getPrimaryKeyFieldName(),
            targetFieldName = targetPKName,
            sourceDSId = sourceDS.ID,
            sourceFieldName = relation.fieldName,
            targetDSId = targetDS.ID
        ;

        // Pull DS defaults and update them
        this.getDataSourceDefaults(sourceDSId, function (dsId, defaults) {
            var fk = targetDSId + "." + targetFieldName;

            var type = targetPK.type;
            if (type == "sequence") type = "integer";
            var field = { name: sourceFieldName, type: type, foreignKey: fk, hidden: true };
            defaults.fields.add(field);

            if (!_this.pendingSaves) _this.pendingSaves = {};
            _this.pendingSaves[dsId] = defaults;

            // Fire the callback passed in when editing began
            if (_this.saveCallback) {
                _this.fireCallback(_this.saveCallback, "defaults",
                    [_this.pendingSaves[_this.dsDefaults.ID]]);
                _this.saveCallback = null;
            }
        });
    },

    switchToEditFieldsAndDataSeparately : function (dataSource, callback) {
        this.getDataSourceDefaults(dataSource.ID, function (dsId, defaults) {
            // DataSource instance has derived fields from the mockData. Pull those fields.
            var fieldNames = dataSource.getFieldNames(),
                fields = []
            ;
            for (var i = 0; i < fieldNames.length; i++) {
                fields[i] = dataSource.getField(fieldNames[i]);
            }

            // Update DS defaults to shift MDS from mockData to fields and cacheData
            defaults.fields = fields.duplicate();
            defaults.cacheData = dataSource.cacheData;
            delete defaults.mockData;
            delete defaults.mockDataFormat;

            callback(defaults);
        });
    }
});

}

isc.ClassFactory.defineClass("DSRelations");

isc.DSRelations.addClassProperties({
    relationTypeDescriptionMap: {
        "1-M": "1-to-many",
        "M-1": "many-to-1",
        "Self": "tree self-relation"
    }
});

isc.DSRelations.addMethods({

    //> @attr dsRelations.dsDataSource (DataSource | ID : null : IRW)
    // DataSource to be used to load and save ds.xml files, via fileSource operations.
    //<

    //> @attr dsRelations.dataSources (Array of DataSource : null : IRW)
    // List of DataSources from which to determine relations.
    //<
    setDataSources : function (dsList) {
        this.dataSources = dsList;
        this.reset();
    },

    // Clear relations cache so it will be rebuilt on next request
    reset : function () {
        delete this._rawRelations;
    },

    getRelationsForDataSource : function (name) {
        this.buildRelations();

        // grab list of direct FKs and build a map of indirect FKs
        var rawRelations = this._rawRelations,
            directFKs = rawRelations[name],
            indirectFKs = {}
        ;
        for (var dsName in rawRelations) {
            if (dsName == name) continue;
            var fks = rawRelations[dsName];
            for (var i = 0; i < fks.length; i++) {
                var fk = fks[i];
                if (fk.relatedDS == name) {
                    if (!indirectFKs[dsName]) indirectFKs[dsName] = [];
                    indirectFKs[dsName].add(fk);
                }
            }
        }

        var relations = [];

        // For direct FKs, define specified relationships
        if (directFKs) {
            for (var i = 0; i < directFKs.length; i++) {
                var fk = directFKs[i],
                    type = (name == fk.relatedDS ? "Self" : "M-1"),
                    displayField = fk.displayField
                ;

                relations.add({
                    type: type,
                    fieldName: fk.fieldName,
                    dsId: fk.relatedDS,
                    relatedFieldName: fk.relatedFieldName,
                    displayField: displayField
                })
            }
        }

        // Define relationships for indirect FKs
        for (var dsName in indirectFKs) {
            var fks = indirectFKs[dsName];
            for (var i = 0; i < fks.length; i++) {
                var fk = fks[i];
                relations.add({
                    type: "1-M",
                    fieldName: fk.fieldName,
                    dsId: dsName,
                    relatedFieldName: fk.relatedFieldName
                })
            }
        }
        return relations;
    },

    getAllRelationsForDataSource : function (name) {
        this.buildRelations();

        var relations = this.getRelationsForDataSource(name);
        do {
            var newRelations = [];
            for (var i = 0; i < relations.length; i++) {
                var relation = relations[i],
                    subRelations = this.getRelationsForDataSource(relation.dsId)
                ;
                if (subRelations && subRelations.length > 0) {
                    // Make sure to exclude sub-relations that point back to a this DS or
                    // that have already been added.
                    for (var j = 0; j < subRelations.length; j++) {
                        var subRelation = subRelations[j];
                        if (subRelation.dsId != name &&
                            !relations.find("dsId", subRelation.dsId) &&
                            !newRelations.find("dsId", subRelation.dsId))
                        {
                            subRelation.parentDsId = relation.dsId;
                            newRelations.add(subRelation);
                        }
                    }
                }
                if (!relation.parentDsId) relation.parentDsId = name;
            }
            relations.addList(newRelations);
        } while (newRelations.length > 0);

        return relations;
    },

    removeRelationsToDataSource : function (sourceDS, targetDSId, callback) {
        var fkFields = this.getForeignKeyFields(sourceDS),
            isRelatedToTarget = false
        ;
        // Confirm that sourceDS has relations to targetDSId before loading defaults
        // which requires a server round-trip
        if (!isc.isAn.emptyObject(fkFields)) {
            for (var fieldName in fkFields) {
                var fkField = fkFields[fieldName],
                    foreignKey = fkField.foreignKey
                ;
                if (foreignKey.indexOf(".") >= 0) foreignKey = foreignKey.split(".")[0];
                if (foreignKey == targetDSId) {
                    isRelatedToTarget = true;
                    break;
                }
            }
        }
        if (!isRelatedToTarget) {
            callback();
            return;
        }

        // source is related to target
        var self = this;
        this.getDataSourceDefaults(sourceDS.ID, function (dsId, defaults) {
            var fieldsToRemove = [];

            // Remove foreignKey and includeFrom field references to target
            var fields = defaults.fields;
            for (var i = 0; i < fields.length; i++) {
                var field = fields[i];
                if (field.foreignKey) {
                    var name = field.foreignKey;
                    if (name.indexOf(".") >= 0) name = name.split(".")[0];
                    if (name == targetDSId) fieldsToRemove.add(field);
                }
                if (field.includeFrom) {
                    var name = field.includeFrom;
                    if (name.indexOf(".") >= 0) name = name.split(".")[0];
                    if (name == targetDSId) fieldsToRemove.add(field);
                }
            }
            // Shouldn't occur but if no field was removed we are done
            if (fieldsToRemove.length == 0) {
                callback();
                return;
            }

            fields.removeList(fieldsToRemove);
            self.saveDataSource(defaults, callback);
        });
    },

    buildRelations : function () {
        if (this._rawRelations) return;

        var dsList = this.dataSources || [],
            rawRelations = {}
        ;
        // build map of all known DataSources and FK relations
        var self = this;
        dsList.map(function (ds) {
            if (!ds) return;
            var fkFields = self.getForeignKeyFields(ds);
            if (!isc.isAn.emptyObject(fkFields)) {
                for (var fieldName in fkFields) {
                    var field = fkFields[fieldName],
                        relatedFieldName = isc.DS.getForeignFieldName(field),
                        relatedDS = isc.DS.getForeignDSName(field, ds)
                    ;
                    if (!rawRelations[ds.ID]) rawRelations[ds.ID] = [];
                    rawRelations[ds.ID].add({
                        fieldName: fieldName,
                        foreignKey: field.foreignKey,
                        relatedDS: (relatedDS ? relatedDS : null),
                        relatedFieldName: relatedFieldName,
                        displayField: field.displayField
                    });
                }
            }
        });

        this._rawRelations = rawRelations;
    },

    getForeignKeyFields : function (ds) {
        var fields = ds.fields,
            foreignKeyFields = {}
        ;
        for (var fieldName in fields) {
            var field = fields[fieldName];
            if (field.foreignKey) {
                foreignKeyFields[field.name] = field;
            }
        }
        return foreignKeyFields;
    },

    // Returns the clean initialization data for this DataSource (the live data
    // contains various derived state)
    getDataSourceDefaults : function (dsID, callback) {
        if (!this.dsDataSource) {
            this.logWarn("Cannot determine DS defaults because dsDataSource is not defined");
            return null;
        }

        this.dsDataSource.getFile({
            fileName: dsID,
            fileType: "ds",
            fileFormat: "xml"
        }, function (dsResponse, data, dsRequest) {
            isc.DMI.callBuiltin({
                methodName: "xmlToJS",
                arguments: [data],
                callback : function (rpcResponse, data) {
                    // instantiate the DataSource in "captureDefaults" mode, where Class.create()
                    // returns a editComponent instead
                    isc.ClassFactory._setVBLoadingDataSources(true);
                    isc.captureDefaults = true;
                    //!OBFUSCATEOK
                    var dsComponent = isc.eval(data);
                    isc.captureDefaults = null;
                    isc.capturedComponents = null;

                    // Re-create the actual DS for later reference. eval() above just extracts defaults
                    // but also leaves window[ID] referencing the defaults instead of an actual DS.
                    // The window[ID] value must be removed or the next eval will not insert the correct
                    // DS into the global namespace.
                    window[dsComponent.defaults.ID] = null;

                    //!OBFUSCATEOK
                    isc.eval(data);
                    isc.ClassFactory._setVBLoadingDataSources(null);

                    // Pull DS class type and push into defaults._constructor so the correct
                    // schema will be serialized when saved.
                    var ds = isc.DS.get(dsID);
                    dsComponent.defaults._constructor = ds.getClassName();

                    callback(dsID, dsComponent.defaults);
                }
            });
        }, {
            // DataSources are always shared across users
            operationId: "allOwners"
        });
    },

    saveDataSource : function (defaults, callback) {
        // handle custom subclasses of DataSource for which there is no schema defined by
        // serializing based on the DataSource schema but adding the _constructor property to
        // get the correct class.
        // XXX problem: if you ask an instance to serialize itself, and there is no schema for
        // it's specific class, it uses the superClass schema but loses it's Constructor
        // XXX we to preserve the class, we need to end up with the "constructor" property set
        // in XML, but this has special semantics in JS
        var dsClass = defaults._constructor || "DataSource",
            schema;
        if (isc.DS.isRegistered(dsClass)) {
            schema = isc.DS.get(dsClass);
        } else {
            schema = isc.DS.get("DataSource");
            defaults._constructor = dsClass;
        }

        // serialize to XML and save to server
        var xml = schema.xmlSerialize(defaults);
        // this.logWarn("saving DS with XML: " + xml);

        this.dsDataSource.saveFile({
            fileName: defaults.ID,
            fileType: "ds",
            fileFormat: "xml"
        }, xml, function() {
            callback();
        }, {
            // DataSources are always shared across users - check for existing file to
            // overwrite without regard to ownerId
            operationId: "allOwners"
        });
    }

    
});
