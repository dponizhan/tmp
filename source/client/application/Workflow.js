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
// --------------------------------------------------------------------------------------------
//> @class ProcessElement
// A ProcessElement is an abstract superclass for elements involved in a +link{Process}, such
// as a +link{Task} or +link{XORGateway}.
// @treeLocation Client Reference/Workflow
// @visibility workflow
//<
isc.defineClass("ProcessElement");

isc.ProcessElement.addClassMethods({

    getTitle : function () {
        var title = this.getInstanceProperty("title");
        if (!title) {
            title = this.getClassName();
            if (title.endsWith("Task")) title = title.substring(0,title.length-4);
            title = isc.DataSource.getAutoTitle(title);
        }
        return title;
    }

});

isc.ProcessElement.addProperties({
    //> @attr processElement.ID (String : null : IR)
    // Optional ID for this process element, allowing it to be referred to from 
    // +link{DecisionGateway,Gateways}, or as the +link{process.startElement}.  See +link{ProcessSequence} and
    // +link{Process} to understand when this is required or can be omitted.
    // <P>
    // Unlike +link{Canvas.ID} a <code>processElement</code>'s is a not a globally unique
    // variable, it need only by unique within it's process.
    // <P>
    // When assigned an ID, a <code>processElement</code> can be retrieve via
    // +link{process.getElement()}.
    // @visibility workflow
    //<

    //> @attr processElement.nextElement (String : null : IR)
    // Next +link{process.sequences,sequence} or +link{process.elements,element} to execute
    // after this one completes.  
    // <p>
    // <code>nextElement</code> does not need to be specified on most elements if you use
    // +link{Process.sequences,sequences}.
    // <p>
    // Note that if there is both a <code>sequence</code> and a normal <code>element</code>
    // with the same name in the current <code>Process</code>, the <code>sequence</code> will
    // be used.
    //
    // @visibility workflow
    //<

    //> @attr processElement.description (String : null : IR)
    // Optional description for this specific instance of process element.
    //
    // @visibility workflow
    //<

    //> @attr processElement.title (String : null : IR)
    // Optional short, descriptive title for this process element. Used by an editor a title
    // for process elements of this type.
    //
    // @visibility workflow
    //<

    //> @attr processElement.classDescription (String : null : IR)
    // Optional description of the general nature of the kinds of tasks this this process
    // element performs. Not to be confused with +link{description,description} which describes
    // what the specific instance of the process element has been configured to do.
    // <P>
    // For example, the <code>classDescription</code> for a task to disable a field might be
    // "disables a field" whereas the <code>description</code> for a concrete instance might
    // be "disables the 'shipTo' field in the 'ordering' form".
    // <P>
    // Used by editor to display additional details along with +link{title,title}.
    //
    // @visibility workflow
    //<

    //> @attr processElement.passThruOutput (Boolean : true : IR)
    // Does this processElement pass through output from the last executed task
    // (i.e. transient state)?
    // See +link{group:taskInputExpression,taskInputExpressions} for details on the
    // transient state.
    //
    // @visibility workflow
    //<
    
    passThruOutput: true,

    //> @attr processElement.editorType (String : null : IR)
    // Editor type used to edit instances of this type of process element.
    //
    // @visibility workflow
    //<
    editorType: "ProcessElementEditor",

    //> @method processElement.getElementDescription()
    // Returns a text description of the element derived from
    // the configuration.
    // <p>
    // If no override is provided by the concrete ProcessElement
    // implementation the +link{description} or +link{ID} is
    // returned.
    //
    // @return (String) the derived element description
    // @visibility workflow
    //<
    getElementDescription : function () {
        return this.description || this.ID;
    },

    _resolveCriteriaExpressions : function (criteria, inputData, inputRecord, process) {
        // Clone the criteria so that another execution can
        // resolve dynamicExpressions based on the latest inputData
        criteria = isc.clone(criteria);
        if (isc.DS.isAdvancedCriteria(criteria)) {
            this._resolveAdvancedCriteriaExpressions(criteria, inputData, inputRecord, process);

            if (process.ruleScope) {
                var ruleScopeComponent = window[process.ruleScope];
                if (!ruleScopeComponent || ruleScopeComponent.destroyed) {
                    this.logWarn("Attempt to resolve ruleScope references in taskInputExpression but ruleScope not found: " + process.ruleScope);
                } else {
                    criteria = isc.DS.resolveDynamicCriteria(criteria, ruleScopeComponent.getRuleContext());
                }
            }

        } else {
            criteria = this._resolveObjectDynamicExpressions(criteria, inputData, inputRecord, process);
        }
        return criteria;
    },

    _resolveAdvancedCriteriaExpressions : function (criteria, inputData, inputRecord, process) {
        var operator = criteria.operator;
        if (operator == "and" || operator == "or" || operator == "not") {
            var innerCriteria = criteria.criteria;
            if (!isc.isAn.Array(innerCriteria)) innerCriteria = [innerCriteria];
            for (var i = 0; i < innerCriteria.length; i++) {
                this._resolveAdvancedCriteriaExpressions(innerCriteria[i], inputData, inputRecord, process);
            }
        } if (criteria.value != null) {
            criteria.value = this._resolveDynamicExpression(criteria.value, inputData, inputRecord, process);
        }
    },

    _resolveObjectDynamicExpressions : function (object, inputData, inputRecord, process) {
        var newObject = {};
        for (var key in object) {
            newObject[key] = this._resolveDynamicExpression(object[key], inputData, inputRecord, process);
        }
        return newObject;
    },

    _resolveDynamicExpression : function (value, inputData, inputRecord, process) {
        if (isc.isA.String(value)) {
            if (inputRecord && value.startsWith("$inputRecord")) {
                if (inputRecord) {
                    var dataPath = value.replace("$inputRecord", "state");
                    value = isc.Canvas._getFieldValue(dataPath, null, {state: inputRecord});
                }
            } else if (inputData && value.startsWith("$input")) {
                if (inputData) {
                    var dataPath = value.replace("$input", "state");
                    value = isc.Canvas._getFieldValue(dataPath, null, {state: inputData});
                }
            } else if (process && value.startsWith("$last")) {
                value = value.substring(5);
                var last;
                if (value.startsWith("[")) {
                    var key = value.substring(1, value.indexOf("]"));
                    value = value.substring(value.indexOf("]")+1);
                    last = process.getLastTaskOutput(key);
                } else {
                    last = process.getLastTaskOutput();
                }
                if (value.startsWith(".")) {
                    var dataPath = "state" + value;
                    value = isc.Canvas._getFieldValue(dataPath, null, {state: last});
                    if (value == null) {
                        // Determine if an intermediate section of the path is missing or
                        // just the final field. If part of the path is missing log a warning
                        var testPath = dataPath.substring(0, dataPath.lastIndexOf("."));
                        if (!isc.Canvas._fieldHasValue(testPath, null, {state: last})) {
                            this.logWarn(this.getClassName() + " taskInputExpression path " + dataPath + " not found in previous task output");
                        }
                    }
                } else {
                    value = last;
                }
            } else if (value.startsWith("$ruleScope") || value.startsWith("$scope")) {
                if (!process.ruleScope) {
                    this.logWarn("Attempt to reference ruleScope in taskInputExpression but no ruleScope has been defined");
                    value = null;
                } else {
                    var ruleScopeComponent = window[process.ruleScope];
                    if (!ruleScopeComponent || ruleScopeComponent.destroyed) {
                        this.logWarn("Attempt to reference ruleScope in taskInputExpression but ruleScope not found: " + process.ruleScope);
                        value = null;
                    } else {
                        var dataPath = value.replace("$ruleScope", "").replace("$scope", "");
                        if (dataPath.startsWith(".")) dataPath = dataPath.substring(1);
                        value = ruleScopeComponent._getFromRuleContext(dataPath);
                    }
                }
            // } else if (value.startsWith("$state")) {
            //     value = value.substring(6);
            //     if (value.startsWith(".")) {
            //         var dataPath = "state" + value;
            //         value = isc.Canvas._getFieldValue(dataPath, null, {state: process.state});
            //     } else {
            //         value = process.state;
            //     }
            }
        } else if (isc.isAn.Object(value) && value.text) {
            var ruleScopeComponent = window[process.ruleScope];
            if (!ruleScopeComponent || ruleScopeComponent.destroyed) {
                this.logWarn("Attempt to resolve ruleScope references in textFormula " +
                                "but ruleScope not found: " + process.ruleScope);
                // No translation possible
                value = null;
            } else {
                // lazily create and cache the summary function (the vars will not change post
                // create)
                if (value._summaryFunction == null) {
                    // Use SummaryBuilder.generateFunction() to convert the summary object to a function.
                    value._summaryFunction = isc.SummaryBuilder.generateRuleScopeFunction(
                        value,
                        ruleScopeComponent.getID()
                    );
                }

                if (value._summaryFunction) {
                    var formula = value,
                        text = formula.text
                    ;
                    // Default value to null unless the formula can be parsed and used
                    value = null;

                    // Summary function for ruleScope expects the ruleScope
                    // variables to be inlined instead of using a var mapping.
                    // If a mapping is provided, update the formula by expanding
                    // the mapping vars.
                    if (formula.summaryVars) {
                        var vars = formula.summaryVars;
                        for (var mappingKey in vars) {
                            var replace = "#{" + vars[mappingKey] + "}";
                            text = isc.FormulaBuilder.handleKeyExp(text, mappingKey, "escaped", replace);
                            text = isc.FormulaBuilder.handleKeyExp(text, mappingKey, "braced", replace);
                        }
                        formula = { text: text };
                    }

                    var ruleContext = ruleScopeComponent.getRuleContext();
                    value = formula._summaryFunction(ruleContext);
                }
            }
        }
        return value;
    },

    // Update references to a global ID within properties of this processElement.
    // Used by VB in response to ID changes of a component that may be referenced by
    // a Workflow.
    // @return (Boolean) true if any references were update; false otherwise
    updateGlobalIDReferences : function (oldId, newId) {
        // Nothing to do for a ProcessElement. Overridden by subclasses when needed.
        return false;
    },

    _updateGlobalIDInValueProperty : function (propertyName, oldId, newId) {
        var changed = false;
        if (this[propertyName]) {
            var key = this[propertyName],
                newKey = key.replace("$ruleScope." + oldId + ".", "$ruleScope." + newId + ".")
                    .replace("$scope." + oldId + ".", "$scope." + newId + ".")
            ;
            if (key != newKey) {
                this[propertyName] = newKey;
                changed = true;
            }
        }
        return changed;
    },

    _updateGlobalIDInValues : function (values, oldId, newId) {
        var changed = false;
        if (values) {
            for (var key in values) {
                var value = values[key],
                    newValue = value.replace("$ruleScope." + oldId + ".", "$ruleScope." + newId + ".")
                        .replace("$scope." + oldId + ".", "$scope." + newId + ".")
                ;
                if (value != newValue) {
                    values[key] = newValue;
                    changed = true;
                }
            }
        }
        return changed;
    },

    _updateGlobalIDInCriteria : function (criteria, oldId, newId) {
        if (!criteria) return false;
        var changes = [{
            pattern: new RegExp("^\\$ruleScope\\." + oldId + "\\."),
            replacement: "$ruleScope." + newId + "."
        },{
            pattern: new RegExp("^\\$scope\\." + oldId + "\\."),
            replacement: "$scope." + newId + "."
        }];
        return this._replaceCriteriaValues(criteria, changes);
    },

    _replaceCriteriaValues : function (criteria, changes) {
        var operator = criteria.operator,
            changed = false
        ;
        if (operator == "and" || operator == "or") {
            var innerCriteria = criteria.criteria;
            for (var i = 0; i < innerCriteria.length; i++) {
                if (this._replaceCriteriaValues(innerCriteria[i], changes)) {
                    changed = true;
                }
            }
        } else {
            for (var i = 0; i < changes.length; i++) {
                var change = changes[i];
                if (criteria.value != null) {
                    var newValue = criteria.value.replace(change.pattern, change.replacement);
                    if (criteria.value != newValue) {
                        criteria.value = newValue;
                        changed = true;
                    }
                }
            }
        }
        return changed;
    },

    // Update references to a binding $last within properties of this processElement.
    // Used by workflow editor.
    // @return (Boolean) true if any references were update; false otherwise
    updateLastElementBindingReferences : function (taskType) {
        // Nothing to do for a ProcessElement. Overridden by subclasses when needed.
        return false;
    },

    _updateLastElementInValueProperty : function (propertyName, taskType) {
        var changed = false;
        if (this[propertyName]) {
            var key = this[propertyName],
                newKey = key.replace("$last.", "$last[" + taskType + "].")
            ;
            if (key != newKey) {
                this[propertyName] = newKey;
                changed = true;
            }
        }
        return changed;
    },

    _updateLastElementInValues : function (values, taskType) {
        var changed = false;
        if (values) {
            for (var key in values) {
                var value = values[key],
                    newValue = value.replace("$last.", "$last[" + taskType + "].")
                ;
                if (value != newValue) {
                    values[key] = newValue;
                    changed = true;
                }
            }
        }
        return changed;
    },

    _updateLastElementInCriteria : function (criteria, taskType) {
        if (!criteria) return false;
        var changes = [{
            pattern: new RegExp("^\\$last\\."),
            replacement: "$last[" + taskType + "]."
        }];
        var changed = this._replaceCriteriaFieldName(criteria, changes);
        return this._replaceCriteriaValues(criteria, changes) || changed;
    },

    _replaceCriteriaFieldName : function (criteria, changes) {
        var operator = criteria.operator,
            changed = false
        ;
        if (operator == "and" || operator == "or") {
            var innerCriteria = criteria.criteria;
            for (var i = 0; i < innerCriteria.length; i++) {
                if (this._replaceCriteriaValues(innerCriteria[i], changes)) {
                    changed = true;
                }
            }
        } else {
            for (var i = 0; i < changes.length; i++) {
                var change = changes[i];
                if (criteria.value != null) {
                    var newValue = criteria.fieldName.replace(change.pattern, change.replacement);
                    if (criteria.fieldName != newValue) {
                        criteria.fieldName = newValue;
                        changed = true;
                    }
                }
            }
        }
        return changed;
    },

    getDynamicValue : function (value, process) {
        if (value) {
            // Resolve any dynamicCriteria or taskInputExpressions
            var values = this._resolveObjectDynamicExpressions({ value: value }, null, null, process);
            value = values.value;
        }
        return value;
    },

    _getSummaryFunction : function (formulaObject, ruleScope, component) {
        // lazily create and cache the summary function (the vars will not change post
        // create)
        if (this._summaryFunction == null) {
            // Use SummaryBuilder.generateFunction() to convert the summary object to a function.
            this._summaryFunction = isc.SummaryBuilder.generateRuleScopeFunction(
                formulaObject,
                ruleScope,
                component
            );
        }
        return this._summaryFunction;
    },

    getTextFormulaValue : function (textFormula, process) {
        var value;
        if (textFormula) {
            var formula = textFormula,
                text = formula.text
            ;
            // Summary function for ruleScope expects the ruleScope
            // variables to be inlined instead of using a var mapping.
            // If a mapping is provided, update the formula by expanding
            // the mapping vars.
            if (formula.summaryVars) {
                var vars = formula.summaryVars;
                for (var mappingKey in vars) {
                    var replace = "#{" + vars[mappingKey] + "}";
                    text = isc.FormulaBuilder.handleKeyExp(text, mappingKey, "escaped", replace);
                    text = isc.FormulaBuilder.handleKeyExp(text, mappingKey, "braced", replace);
                }
                formula = { text: text };
            }

            var summaryFunction = this._getSummaryFunction(formula, process.ruleScope);
            if (summaryFunction) {
                var ruleScopeComponent = window[process.ruleScope];
                if (!ruleScopeComponent || ruleScopeComponent.destroyed) {
                    this.logWarn("Attempt to resolve ruleScope references in textFormula " +
                                 "but ruleScope not found: " + process.ruleScope);
                } else {
                    var ruleContext = ruleScopeComponent.getRuleContext();
                    value = summaryFunction(ruleContext);
                }
            }
        }
        return value;
    }
});

// --------------------------------------------------------------------------------------------
//> @class ProcessSequence
// An Array of +link{ProcessElement}s involved in a +link{Process}.  A 
// <code>ProcessSequence</code> is used to reduce the number of explicit
// +link{ProcessElement.ID}s that need to be assigned, by creating an implicit next element -
// the next in the sequence.
// <P>
// A sequence cannot be executed outside of a Process and has no state.
// @inheritsFrom ProcessElement
// @treeLocation Client Reference/Workflow
// @visibility workflow
//<
isc.defineClass("ProcessSequence", "ProcessElement");

isc.ProcessSequence.addProperties({
    //> @attr processSequence.elements (Array of ProcessElement : null : IR)
    // The +link{ProcessElement}s in this sequence.
    // @visibility workflow
    //<
});

// --------------------------------------------------------------------------------------------

//> @class Task
// A Task is an abstract superclass for +link{Process} and for all Task types that can be
// involved in a Process, such as a +link{ServiceTask}.
//
// @inheritsFrom ProcessElement
// @treeLocation Client Reference/Workflow
// @visibility workflow
//<

isc.defineClass("Task", "ProcessElement");

isc.Task.addProperties({
    //> @attr task.inputField (String : null : IR)
    // Field in the +link{Process.state,process state} which is provided as input data to this
    // task.
    // See +link{group:taskIO}.
    // @group taskIO
    // @visibility workflow
    //<

    //> @attr task.inputFieldList (Array of String : null : IR)
    // List of multiple fields from the +link{Process.state,process state} which are provided
    // as input data to this task. See +link{group:taskIO}.
    // <P>
    // If +link{inputField} is also specified, it will be implicitly added to the
    // <code>inputFieldList</code> if it is not already present.
    // @group taskIO
    // @visibility workflow
    //<

    //> @attr task.outputField (String : null : IR)
    // Field in the +link{Process.state,process state} where this task writes outputs. See
    // +link{group:taskIO}.
    // @group taskIO
    // @visibility workflow
    //<

    //> @attr task.outputFieldList (Array of String : null : IR)
    // List of multiple fields in the +link{Process.state,process state} where this task will
    // write outputs. See +link{group:taskIO}.  
    // <P>
    // If +link{outputField} is also specified, it will be implicitly added to the
    // <code>outputFieldList</code> if it is not already present.
    // @group taskIO
    // @visibility workflow
    //<

    //> @attr task.outputExpression (String : null : IR)
    // Special expression to write task output directly into a +link{DataBoundComponent}. See
    // +link{group:taskIO}.
    // @group taskIO
    // @visibility workflow
    //<

    //> @groupDef taskIO
    // Each task has "inputs", which are copied from the +link{process.state,Process state}
    // when the task is started, and "outputs", which are atomically applied to the Process
    // state when a task is completed.
    // <P>
    // Tasks can use +link{task.inputField} to specify the field from the Process state that
    // should be used as inputs, and +link{task.outputField} to specify the field in the
    // Process state that the task should write output.
    // <P>
    // More complex tasks can take multiple fields from the process state via
    // +link{task.inputFieldList} and write to multiple fields of the process state via
    // +link{task.outputFieldList}. In this case, the task is said to have an "input Record"
    // and/or "output Record", which is a copy of the process state Record
    // with only the fields listed in the <code>inputFieldList</code> copied.
    // <P>
    // When both <code>inputField</code> and <code>inputFieldList</code> are specified, the
    // inputField is considered the "primary" input field and will be used automatically by
    // various Task subclasses.
    // <P>
    // An additional option for output is provided in +link{task.outputExpression} to write
    // task output directly into another +link{DataBoundComponent} instead of or in addition
    // to the process state. See details below.
    // <P>
    // <h4>inputField and inputFieldList examples</h4>
    // <code>inputData</code> represents the result of the <code>inputField</code> processing
    // and <code>inputRecord</code> represents the result of the <code>inputFieldList</code>.
    // <P>
    // If the +link{process.state} represented in JSON is:
    // <pre>
    // {
    //    orderId:5,
    //    orderItems: [
    //       {name:"Pencils", quantity:3, itemId:2344}
    //    ],
    //    orderUser: { name:"Henry Winkle", address:"...", ... }
    // }
    // </pre>
    // Consider these input definitions and resulting <code>inputData</code> and <code>inputRecord</code>:
    // <ul>
    // <li>inputField: orderId
    //   <ul>
    //     <li>inputData: 5
    //     <li>inputRecord: { orderId: 5 }
    //   </ul>
    // <li>inputField: orderUser.name, inputFieldList: [ "orderUser" ]
    //   <ul>
    //     <li>inputData: "Henry Winkle"
    //     <li>inputRecord: { name: "Henry Winkle", orderUser: { name: "Henry Winkle", address: ... }
    //   </ul>
    // <li>inputField: orderUser
    //   <ul>
    //     <li>inputData: { name: "Henry Winkle", address: ... }
    //     <li>inputRecord: { orderUser: { name: "Henry Winkle", address: ... } }
    //   </ul>
    // <li>inputFieldList: [ "orderUser" ]
    //   <ul>
    //     <li>inputData: null
    //     <li>inputRecord: { orderUser: { name: "Henry Winkle", address: ... } }
    //   </ul>
    // </ul>
    // Notice that <code>inputField</code> is implicitly added to the <code>inputRecord</code>
    // as a field with the same name.
    // <P>
    // <h4>Field paths</h4>
    // Specifying an input or output field as a dataPath allows a hierarchical process state
    // to be flattened into the task input or expanded from the task output.
    // <P>
    // <h4>Output expressions</h4>
    // An +link{task.outputExpression} can be specified to write task output directly into
    // another +link{DataBoundComponent} instead of or in addition to the process state.
    // <P>
    // An output expression is a String prefixed with "$" followed by the DataBoundComponent
    // ID and optionally followed by a dot-separated field name. When no optional field name
    // is specified the task output is written to the target component using setValues() or
    // setData(). With the optional field name, the task output is written to the target
    // with setFieldValue() or setEditValue(). For a ListGrid the row is either the current
    // edit row or the one selected row.
    // <P>
    // As an example, consider a DynamicForm with ID of "orderHeader". By specifying an
    // <code>outputExpression</code> as "$orderHeader" for a fetch ServiceTask the response
    // record will be assigned directly to the DynamicForm.
    //
    // @title Task Input / Output
    // @visibility workflow
    //<
    

    //> @groupDef taskInputExpression
    // In some tasks, the input to the task needs to be passed to a service being called by the
    // task, to a user-visible form, or other consumers of the input data. 
    // A TaskInputExpression can be used to do this declaratively.
    // <P>
    // A TaskInputExpression is a String prefixed with "$input", "$inputRecord", "$last",
    // or "$ruleScope" followed by an optional dot-separated hierarchical path, which can
    // specify either an atomic data value (String, Number) or Record from the input data.
    // For example, if the +link{process.state} represented in JSON were:
    // <pre>
    // {
    //    orderId:5,
    //    orderItems: [
    //       {name:"Pencils", quantity:3, itemId:2344}
    //    ],
    //    orderUser: { name:"Henry Winkle", address:"...", ... }
    // }
    // </pre>
    // .. and a task specified an <code>inputField</code> of "orderId" and an inputFieldList of
    // "orderItems","orderUser", then:
    // <ul>
    // <li>$input is the value 5
    // <li>$inputRecord.orderUser.name is "Henry Winkle"
    // <li>$inputRecord.orderItems[0] is the first orderItems Record ({name:"Pencils", ... })
    // </ul>
    // <p>
    // The other two sources of input are "$last" and "$ruleScope". The former references the
    // contents of the +link{Process.state,transient state}. Finally, "$ruleScope" can be used
    // to pull values from a +link{Canvas.ruleScope,ruleScope} when configured in +link{Process.ruleScope}.
    // <ul>
    // <li>$last is the full output of the previous task executed in the process
    // <li>$last[service].property or $last[ServiceTask].property references the last "ServiceTask"
    //     output in the "property" field
    // <li>$ruleScope.property references the ruleScope "property" field
    // </ul>
    // <p>
    // <h4>Transient state outputs</h4>
    // The transient state outputs of each task type referenced by "$last" above:
    // <ul>
    // <li><b>DecisionGateway</b>: the output from the <i>previous</i> task (passed through).
    // <li><b>ScriptTask</b>: the result of +link{scriptTask.execute,execute()} or, for an asynchronous task,
    //     the value passed to +link{scriptTask.setOutputRecord,setOutputRecord()} or 
    //     +link{scriptTask.setOutputData,setOutputData()}.
    // <li><b>ServiceTask</b>: the contents of dsResponse.data.
    // <li><b>StateTask</b>: the value assigned to the outputField.
    // <li><b>UserTask</b>: the values of the targetForm or targetVM when the task completes.
    // <li><b>XORGateway</b>: the output from the <i>previous</i> task (passed through).
    // </ul>
    // @title Task Input Expressions
    // @visibility workflow
    //<

    editorType: "TaskEditor",

    _resolveInputField : function (value, process) {
        if (value == null) return null;
        var resolved;
        if (value.startsWith("$")) resolved = this._resolveDynamicExpression(value, null, null, process);
        else resolved = process.getStateVariable(value);
        return resolved;
    },

    _writeOutputExpression : function (data) {
        var expression = this.outputExpression;
        if (!expression) return;

        if (expression.startsWith("$")) {
            expression = expression.substring(1);
            var id = expression;
            var field;
            var fdi = id.indexOf(".");
            if (fdi > 0) {
                id = id.substring(0, fdi);
                field = id.substring(fdi+1);
            }
            var canvas = isc.Canvas.getById(id);
            if (canvas) {
                if (field) {
                    if (!isc.isAn.Array(data)) {
                        if (isc.isA.DynamicForm(canvas)) {
                            canvas.setFieldValue(field, data);
                        } else if (isc.isA.ListGrid(canvas) && canvas.canEdit) {
                            var editRow = canvas.getEditRow();
                            if (editRow != null) {
                                canvas.setEditValue(editRow, field, data);
                            } else {
                                var selection = canvas.getSelectedRecords();
                                if (selection != null && selection.length == 1) {
                                    var selectedRow = canvas.getRecordIndex(selection[0]);
                                    canvas.setEditValue(selectedRow, field, data);
                                } 
                            }
                        } else {
                            this.logWarn("outputExpression target is not a supported DBC or is not editable - ignored: " + expression);
                        }
                    } else {
                        this.logWarn("Task output is not supported by outputExpression target - ignored: " + expression);
                    }
                } else {
                    if (canvas.setValues) {
                        var value = (isc.isAn.Array(data) ? data[0] : data);
                        if (isc.isAn.Object(value)) {
                            canvas.setValues(value);
                        } else {
                            this.logWarn("task output is not an object and cannot be written with outputExpression - ignored: " + expression);
                        }
                    } else if (canvas.setData) {
                        if (isc.isAn.Array(data) || isc.isAn.Object(data)) {
                            if (!isc.isAn.Array(data)) data = [data];
                            canvas.setData(data);
                        } else {
                            this.logWarn("task output is not an object and cannot be written with outputExpression - ignored: " + expression);
                        }
                    } else {
                        this.logWarn("outputExpression target is not a supported DBC - ignored: " + expression);
                    }
                }
            } else {
                this.logWarn("outputExpression DBC not found - ignored: " + expression);
            }
        } else {
            this.logWarn("Invalid outputExpression - ignored: " + expression);
        }
    },

    updateLastElementBindingReferences : function (taskType) {
        var changed = this.Super("updateLastElementBindingReferences", arguments);
        changed = this._updateLastElementInValueProperty("inputField", taskType) || changed;
        return changed;
    },

    updateGlobalIDReferences : function (oldId, newId) {
        var changed = this.Super("updateGlobalIDReferences", arguments);
        changed = this._updateGlobalIDInValueProperty("inputField", oldId, newId) || changed;
        return changed;
    }

});

//---------------------------------------------------------------------------------------

//> @method Callbacks.ProcessCallback
// A +link{type:Callback} to evaluate when an {Process.loadProcess} method completes.
// <p>
// Loaded process passed as a parameter to this callback are:
//
// @param dsResponse (DSResponse) a +link{class:DSResponse} instance with metadata about the returned data
// @param process (Process)
// @see class:Process
// @see class:RPCResponse
// @visibility workflow
//<

// --------------------------------------------------------------------------------------------
//> @class Process
// A instance of Process represents a stateful process executing a series of Tasks, 
// which may be:
// <ul>
// <li> user interactions
// <li> calls to DataSources (hence: any database or web service)
// <li> arbitrary code
// <li> other Processes
// </ul>
// A Process is <i>stateful</i> in the sense that it maintains +link{process.state,state}
// across the different tasks that are executed.  This allows you to maintain context as you
// walk a user through a multi-step business process in your application, which may involve
// multiple operations on multiple entities.  Each Task that executes can use the Process state
// as inputs, and can output a result which is stored in the Process state - see
// +link{group:taskIO}.
// <P>
// A Process can have multiple branches, choosing the next Task to execute based on
// +link{Criteria} - see +link{XORGateway} and +link{DecisionGateway}.
// <P>
// Because a Process may return to a previous Task in various situations, the data model of a
// Process is strictly speaking a <i>graph</i> (a set of nodes connected by arbitary
// interlinks). However, most processes have sequences of several tasks in a row, and the
// definition format allows these to be represented as simple Arrays called "sequences",
// specified via +link{process.sequences}.  This reduces the need to manually specify IDs and
// interlinks for Tasks that simply proceed to the next task in a sequence.
// <P>
// Processes follow all the standard rules for encoding as +link{group:componentXML}, however,
// note that the &lt;Process&gt; tag allows any kind of +link{ProcessElement} (tasks, gateways
// and sequences) to appear as a direct subelement of the &lt;Process&gt; tag without the need
// for an intervening &lt;elements&gt; or &lt;sequences&gt; tag.  The example below
// demonstrates this shorthand format.
// <pre>
// &lt;Process ID="<i>processId</i>"&gt;
//     &lt;ServiceTask ID="<i>serviceTaskId</i>" nextElement="<i>sequenceId</i>" ..&gt;
//         &lt;inputFieldList&gt;
//             &lt;value&gt;order.countryName&lt;/value&gt;
//         &lt;/inputFieldList&gt;
//         &lt;outputFieldList&gt;
//             &lt;value&gt;order.countryName&lt;/value&gt;
//             &lt;value&gt;order.continent&lt;/value&gt;
//         &lt;outputFieldList&gt;
//     &lt;/ServiceTask&gt;
//     &lt;sequence ID="<i>sequenceId</i>" &gt;
//         &lt;StateTask ../&gt;
//         &lt;StateTask ../&gt;
//         &lt;StateTask ../&gt;
//         &lt;StateTask nextElement="<i>userTaskId</i>" ../&gt;
//     &lt;/sequence&gt;
//     &lt;UserTask ID="<i>userTaskId</id>" ../&gt;
//     ...
// &lt;/Process&gt;
// </pre>
// <b>NOTE:</b> you must load the Workflow module
// +link{group:loadingOptionalModules,Optional Modules} before you can use <code>Process</code>.
// 
// @inheritsFrom Task
// @treeLocation Client Reference/Workflow
// @visibility workflow
//<
isc.defineClass("Process", "Task");

isc.Process.addClassProperties({
    _cache: {},

    // "id" of placeholder selection used in target element valuemaps.
    gatewayPlaceholderSelection: "[placeholder]",

    //> @classMethod Process.loadProcess()
    // Loads an XML process definition stored in XML from the server.
    // <p>
    // This method requires server-side support included in SmartClient Pro Edition or better.
    // <p>
    // Process files are stored as .proc.xml files in +link{group:componentXML,Component XML}
    // format, in the directory indicated by the <code>project.processes</code> setting in
    // +link{group:server_properties,server.properties}
    // (<code><i>webroot</i>/processes</code> by default).  To load a process
    // saved in a file <i>processId</i>.proc.xml, pass just <i>processId</i> to this method.
    //  
    // @param processId (Identifier | Array of Identifier) process IDs to load
    // @param callback (ProcessCallback) called when the process is loaded with argument
    //                            "process", the first process.  Other processes can be looked
    //                            up via +link{getProcess()}.
    //
    // @visibility workflow
    //<
    loadProcess : function (processId, callback) {
        var ds = isc.DataSource.get("WorkflowLoader");
        ds.fetchData({id: processId}, function (response, data, request) {
            var process = null;
            var content = data.content;
            if (content != null) {
                if (isc.isAn.Array(content)) {
                    process = isc.Class.evaluate(content[0]);
                    process.ID = processId[0];
                    isc.Process._cache[processId[0]] = process;
                    for (var i = 1; i < content.length; i++) {
                        var p = isc.Class.evaluate(content[i]);
                        p.ID = processId[i];
                        isc.Process._cache[processId[i]] = p;
                    }                
                } else {
                    process = isc.Class.evaluate(content);
                    process.ID = processId;
                    isc.Process._cache[processId] = process;
                }
            } else {
                isc.logWarn("File named \"" + processId + "\".proc.xml could not " + 
                    "be found in the search path specified by \"project.processes\".")
            }
            callback(process);
        });
    },
    
    //> @classMethod Process.getProcess()
    // Get a Process instance by it's ID.  See +link{loadProcess()}.
    // @param processId (Identifier) process IDs to retrieve
    // @return (Process) the process, or null if not loaded
    // @visibility workflow
    //<
    getProcess : function (processId) {
        return isc.Process._cache[processId];
    }
});

isc.Process.addProperties({
    init : function () {
        var res = this.Super("init", arguments);

        // Instantiate elements/sequences if defined as propertiesOnly objects
        this.instantiateElements();

        // Start execution (nextElement) at startElement
        this._nextElement = this.startElement;
        if (this.autoStart) this.start();
        return res;
    },

    instantiateElements : function () {
        if (this.elements) this.elements = this._instantiateElements(this.elements);
        if (this.sequences) this.sequences = this._instantiateElements(this.sequences);
    },

    _instantiateElements : function (elements) {
        var newElements = [];
        for (var i = 0; i < elements.length; i++) {
            var element = elements[i];
            newElements[i] = element;
            if (isc.isAn.Object(element)) {
                if (element._constructor) {
                    newElements[i] = isc.ClassFactory.newInstance(element);
                }
                if (element.elements) {
                    newElements[i].elements = this._instantiateElements(element.elements);
                }
            }
        }
        return newElements;
    },

    //> @attr process.sequences (Array of ProcessSequence : null : IR)
    // Sequences of ProcessElements.  By defining a sequences of elements you can make the
    // +link{processElement.nextElement} implicit.
    // <P>
    // <smartclient>You do not have to explicitly create a +link{ProcessSequence},
    // you can instead use the shorthand:
    // <pre>
    // isc.Process.create({
    //     startElement:"firstSequence", 
    //     sequences: [
    //         { ID:"something", elements: [ ... ] },
    //         { ID:"somethingElse", elements: [ ... ] },
    //         ...
    //     ]
    //     ...
    // });
    // </pre>
    // .. this is equivalent to ..
    // <pre>
    // isc.Process.create({
    //     startElement:"firstSequence", 
    //     sequences: [
    //         isc.ProcessSequence.create({ 
    //              ID:"something", 
    //              elements: [ ... ] 
    //         }),
    //         isc.ProcessSequence.create({ 
    //              ID:"somethingElement", 
    //              elements: [ ... ] 
    //         }),
    //         ...                           
    //     ]
    //     ...
    // });
    // </pre>
    // </smartclient>
    // <smartgwt>
    // Example of using sequences:
    // <pre>
    // Process process = new Process();
    // process.setStartElement("firstSequence");
    // ProcessSequence innerSequence = new ProcessSequence(incTask, add2Task, incTask);
    // process.setSequences(
    //     new ProcessSequence("firstSequence", serviceTask, decisionGateway),
    //     new ProcessSequence("errorFlow", failureTask, userNotifyTask)
    // );
    // // standalone process elements not part of sequences
    // process.setElements(new ServiceTask(){...});
    // Record state = new Record();
    // state.setAttribute("someField", "someValue");
    // process.setState(state);
    // process.start();
    // </pre>
    // </smartgwt>
    // @visibility workflow
    //<

    //> @attr process.elements (Array of ProcessElement : null : IR)
    // Elements involved in this Process.  You can also group elements into +link{sequences}
    // to reduce the need to explicitly define IDs for elements and interlink them.
    // @visibility workflow
    //<

    //> @attr process.startElement (String : null : IR)
    // The ID of either a +link{sequences,sequence} or an +link{elements,element} which should
    // be the starting point of the process.  If not specified, the first sequence is chosen,
    // or if there are no sequences, the first element.
    // - log a warning and do nothing if there are neither sequences or elements
    // <smartclient>
    // - an example of how a Process would be defined
    // <pre>
    // isc.Process.create({
    //     startElement:"firstSequence", 
    //     sequences: [
    //         { 
    //            id:"firstSequence",
    //            elements : [
    //                isc.ServiceTask.create({ .. }),
    //                isc.DecisionGateway.create({ .. })
    //            ]
    //         },
    //         {
    //            id:"errorFlow",
    //            elements : [ ... ]
    //            
    //         }
    //     ],
    //     elements: [
    //        // standalone process elements not part of sequences
    //        isc.ServiceTask.create({ .. })
    //     ],
    //     state : {
    //         someField:"someValue"
    //     }
    // })
    // </pre>
    // </smartclient>
    // @visibility workflow
    //<

    //> @attr process.wizard (Boolean : false : IR)
    // If wizard is set then current workflow will be handled as wizard. Every userTask will
    // hide associated form after user finished step.
    // @visibility workflow
    //<
    
    //> @attr process.containerId (GlobalId : null : IRW)
    // Identifier of canvas where UI elements created by using
    // +link{UserTask.inlineView,inline view} property should be added
    // using addMember.
    // @visibility workflow
    //<
    
    //> @attr process.views (Array of Canvas: null: IRW)
    // An inline definitions of the forms that could be used to encode form directly in process
    // xml.
    //<
    
    //> @method process.getElement()
    // Retrieve a +link{ProcessElement} by it's ID
    // @param ID (String) id of the process element
    // @return (ProcessElement) the indicated process element, or null if no such element
    // exists
    // @visibility workflow
    //<
    getElement : function (ID) {
        return this._searchElement(this, ID);
    },

    _searchElement : function (sequence, ID) {
        if (sequence.sequences) {
            for (var i = 0; i < sequence.sequences.length; i++) {
                var s = sequence.sequences[i];
                if (s.ID == ID) {
                    return s;
                } else if (s.sequences || s.elements) {
                    var res = this._searchElement(s, ID);
                    if (res) return res;
                }   
            }
        }
        if (sequence.elements) {
            for (var i = 0; i < sequence.elements.length; i++) {
                var e = sequence.elements[i];
                if (e.ID == ID) {
                    return e;
                } else if (e.sequences || e.elements) {
                    var res = this._searchElement(e, ID);
                    if (res) return res;
                }   
            }
        }
    },

    getAllElements : function (sequence, arr) {
        if (!sequence) sequence = this;
        if (!arr) arr = [];

        if (sequence.sequences) {
            for (var i = 0; i < sequence.sequences.length; i++) {
                var s = sequence.sequences[i];
                arr.add(s);
                if (s.sequences || s.elements) {
                    this.getAllElements(s, arr);
                }   
            }
        }
        if (sequence.elements) {
            for (var i = 0; i < sequence.elements.length; i++) {
                var e = sequence.elements[i];
                arr.add(e);
                if (e.sequences || e.elements) {
                    this.getAllElements(e, arr);
                }   
            }
        }

        return arr;
    },

    
    removeElement : function (element) {
        this._removeElement(this, element);
    },
    
    _removeElement : function (sequence, element) {
        if (sequence.sequences) {
            for (var i = 0; i < sequence.sequences.length; i++) {
                var s = sequence.sequences[i];
                if (s == element) {
                    sequence.sequences.removeAt(i);
                    return true;
                }
                if (s.sequences || s.elements) {
                    if (this._removeElement(s, element)) return true;
                }   
            }
        }
        if (sequence.elements) {
            for (var i = 0; i < sequence.elements.length; i++) {
                var e = sequence.elements[i];
                if (e == element) {
                    sequence.elements.removeAt(i);
                    return true;
                }
                if (e.sequences || e.elements) {
                    if (this._removeElement(e, element)) return true;
                }   
            }
        }
    },

    
    addElement : function (element, afterElement, beforeElement) {
        if (afterElement || beforeElement) {
            this._addElement(this, element, afterElement, beforeElement);
        } else {
            if (!this.elements) this.elements = [];
            this.elements.add(element);
        }
    },

    _addElement : function (sequence, element, afterElement, beforeElement) {
        if (sequence.sequences) {
            for (var i = 0; i < sequence.sequences.length; i++) {
                var s = sequence.sequences[i];
                if (afterElement && s == afterElement) {
                    var position = i+1;
                    sequence.sequences.add(element, position);
                    return true;
                } else if (beforeElement && s == beforeElement) {
                    var position = i;
                    sequence.sequences.add(element, position);
                    return true;
                }
                if (s.sequences || s.elements) {
                    if (this._addElement(s, element, afterElement, beforeElement)) return true;
                }   
            }
        }
        if (sequence.elements) {
            for (var i = 0; i < sequence.elements.length; i++) {
                var e = sequence.elements[i];
                if (afterElement && e == afterElement) {
                    var position = i+1;
                    sequence.elements.add(element, position);
                    return true;
                } else if (beforeElement && e == beforeElement) {
                    var position = i;
                    sequence.elements.add(element, position);
                    return true;
                }
                if (e.sequences || e.elements) {
                    if (this._addElement(e, element, afterElement, beforeElement)) return true;
                }   
            }
        }
    },

    //> @attr process.state (Record : null : IRW)
    // Current state of a process.  As with Records in general, any field of a Record may
    // contain a nested Record or Array of Records, so the process state is essentially a
    // hierarchical data structure.
    // <p>
    // <h4>Transient state</h4>
    // In addition to the explicit process state there is a "transient state." The transient
    // state represents the complete output of each of the last tasks of each type within the current
    // process execution. This allows easy reference to the previous task output with
    // +link{group:taskInputExpression,taskInputExpressions}.
    //
    // @setter setState
    // @visibility workflow
    //<
    
    
    //> @method process.setState()
    // Set process state for current process
    // @param state (Record) the new process state
    // @visibility workflow    
    //<
    setState : function (state) {
        this.state = state;
    },

    // ruleScope
    //---------------------------------------------------------------------------------------

    //> @attr process.ruleScope (String : null : IR)
    // +link{canvas.ID} of the component that manages "rule context" for which
    // this process participates. The rule context can be used in
    // +link{group:taskInputExpression,taskInputExpression}.
    // 
    // @see canvas.ruleScope
    // @visibility workflow
    //<

    //---------------------------------------------------------------------------------------

    //> @attr process.autoStart (Boolean : false : IR)
    // Cause the process to automatically call +link{start()} as soon as it is created.
    // @visibility workflow
    //<
    autoStart: false,
        
    //> @method process.start()
    // Starts this task by executing the +link{startElement}. Also used by asynchronous
    // tasks to restart the workflow.
    // @visibility workflow
    //<
    start : function () {
        // Process can be async, so we continue it's execution no matter where we've stopped
        if (this.executionStack == null) {
            // start() is called to restart a process after an async task
            // finishes. Only log the process start on the initial call.
            if (this.logIsDebugEnabled("workflow")) {
                this.logDebug("Start process: " + this.echo(this), "workflow");
            }
        }

        if (this.executionStack == null) {
            this.executionStack = [];        
        }

        if (this.state == null) this.state = {};
        while (this._next()) {
            var currentTask = this._getFirstTask();
            // check for empty sequence
            if (currentTask) {
                // mark process as started, so we will be able to handle the situation with
                // no next or cancel element in elements queue
                this._started = true;
                // every task should implement it's logic
                if (!currentTask.executeElement(this)){
                    return;
                }
            }
        }
        if (this.finished) {
            delete this._nextElement;
            this.finished(this.state);
        }

        if (this.logIsDebugEnabled("workflow")) {
            this.logDebug("Process finished: " + this.echo(this), "workflow");
        }
    },
    
    //> @method process.reset()
    // Reset process to it's initial state, so process can be started again.
    // @param state (Record) new state of the process
    // @visibility workflow
    //<
    reset : function(state) {
        this.state = state;
        this.executionStack = null;
        this._nextElement = this.startElement;
        // Clear transient state
        this.setLastTaskClass(null);
        this._lastOutput = null;
    },
    
    // If user didn't set ID or don't use nextElement property we will take next element
    // or sequence based on their order
    _next : function (skipLogEmptyMessage) {
        var currEl = this.executionStack.last();
        if (currEl == null) {
            // start processing
            if (this._nextElement) {
                var nextEl = this._gotoElement(this, this._nextElement);
                if (nextEl == null) {
                    isc.logWarn("unable to find task '" + this._nextElement + "' - process will be finished");
                }
                return nextEl;
            } else if (this._started) {
                // no startElement after an element, so we should finish the process
                return null;
            } else if (this.sequences && this.sequences.length > 0) {
                this.executionStack.add({el:this, sIndex: 0});
                return this.sequences[0];
            } else if (this.elements && this.elements.length > 0) {
                this.executionStack.add({el:this, eIndex: 0});
                return this.elements[0];
            } else if (!skipLogEmptyMessage) {
                isc.logWarn("There are neither sequences or elements. Nothing to execute.");
            }
        } else {
            var el = null;
            if (currEl.sIndex != null) {
                el = currEl.el.sequences[currEl.sIndex];
            } else if (currEl.eIndex != null) {
                el = currEl.el.elements[currEl.eIndex];
            }
            // Save ClassName of the last task for use in process.getLastTaskOutput()
            this.setLastTaskClass(el.getClassName());

            if (el.nextElement) {
                this.executionStack = [];
                var nextEl = this._gotoElement(this, el.nextElement);
                if (nextEl == null) {
                    isc.logWarn("unable to find task '" + el.nextElement + "' - process will be finished");
                }
                return nextEl;
            } else {
                return this._findNextElement();
            }
        }
    },
    
    _gotoElement : function (sequence, ID) {
        var elData = {el: sequence};
        this.executionStack.add(elData);
        if (sequence.sequences) {
            for (var i = 0; i < sequence.sequences.length; i++) {
                var s = sequence.sequences[i];
                elData.sIndex = i;
                if (s.ID == ID) {
                    return s;
                } else if (s.sequences || s.elements) {
                    var res = this._gotoElement(s, ID);
                    if (res) return res;
                }   
            }
        }
        delete elData.sIndex;
        if (sequence.elements) {
            for (var i = 0; i < sequence.elements.length; i++) {
                var e = sequence.elements[i];
                elData.eIndex = i;
                if (e.ID == ID) {
                    return e;
                } else if (e.sequences || e.elements) {
                    var res = this._gotoElement(e, ID);
                    if (res) return res;
                }   
            }
        }
        this.executionStack.removeAt(this.executionStack.length - 1);
    },
    
    _findNextElement : function () {
        var elData = this.executionStack.last();
        if (elData.eIndex != null && elData.el != this) {
            if (elData.eIndex == elData.el.elements.length - 1) {
                this.executionStack.removeAt(this.executionStack.length - 1);
                if (elData.el == this) {
                    return;
                } else {
                    return this._findNextElement();                            
                }
            } else {
                elData.eIndex++;
                return elData.el.elements[elData.eIndex];
            }
        }
    },
    
    // recursively search for first non-sequence in element
    _getFirstTask : function (inner) {
        var lastElData = this.executionStack.last();

        var el = null;
        if (lastElData.sIndex != null) {
            el = lastElData.el.sequences[lastElData.sIndex];
        } else if (lastElData.eIndex != null) {
            el = lastElData.el.elements[lastElData.eIndex];
        }
        if (el.sequences == null && el.elements == null) {
            if (!inner) this.handleTraceElement(el);
            return el;
        }
        var elData = {el: el};
        this.executionStack.add(elData);
        if (el.sequences) {
            for (var i = 0; i < el.sequences.length; i++) {
                elData.sIndex = i
                var res = this._getFirstTask(el.sequences[i]);
                if (res) {
                    this.handleTraceElement(res);
                    return res;
                }
            }
        }
        if (el.elements) {
            for (var i = 0; i < el.elements.length; i++) {
                elData.eIndex = i
                var res = this._getFirstTask(el.elements[i]);
                if (res) {
                    // If first element of a sequence, trace that element too
                    if (elData.eIndex == 0) this.handleTraceElement(elData.el);
                    this.handleTraceElement(res);
                    return res;
                }
            }
        }
        this.executionStack.removeAt(this.executionStack.length - 1);
    },
    
    setNextElement : function (nextElement) {
        var lastElData = this.executionStack.last(),
            el = null
        ;
        if (lastElData.sIndex != null) {
            el = lastElData.el.sequences[lastElData.sIndex];
        } else if (lastElData.eIndex != null) {
            el = lastElData.el.elements[lastElData.eIndex];
        }
        // Save ClassName of the last task for use in process.getLastTaskOutput()
        this.setLastTaskClass(el.getClassName());

        this.executionStack = [];
        this._nextElement = nextElement;
    },

    setStateVariable : function (stateVariablePath, value) {
        if (stateVariablePath.indexOf(".") < 0 || this.state[stateVariablePath]) {
            this.state[stateVariablePath] = value; 
        } else {
            var segments = stateVariablePath.split(".");
            var obj = this.state;
            for (var i = 0; i < segments.length - 1; i++) {
                var nextObj = obj[segments[i]];
                if (nextObj == null) {
                	obj[segments[i]] = {}
                	nextObj = obj[segments[i]];
                }
                obj = nextObj;
            }
            obj[segments[i]] = value;
        }
    },

    getStateVariable : function (stateVariablePath) {
        if (stateVariablePath.indexOf(".") < 0 || this.state[stateVariablePath]) {
            return this.state[stateVariablePath]; 
        } else {
            var segments = stateVariablePath.split(".");
            var obj = this.state;
            for (var i = 0; i < segments.length - 1; i++) {
                obj = obj[segments[i]];
                if (obj == null) {
                    isc.logWarn("Unable to get state variable: " + stateVariablePath + " no such path")
                    return;                    
                }
            }
            return obj[segments[i]]
        }
    },

    // Transient state management

    setLastTaskClass : function (className) {
        this._lastTaskClassName = (className ? className.toLowerCase() : null);
    },

    getLastTaskClass : function () {
        return this._lastTaskClassName;
    },

    setTaskOutput : function (className, ID, output) {
        if (!this._lastOutput) this._lastOutput = {};
        this._lastOutput[className.toLowerCase()] = output;
        if (ID != null) this._lastOutput[ID] = output;
    },

    getLastTaskOutput : function (key) {
        if (!this._lastOutput) return null;
        var origKey = key;
        if (!key) key = this.getLastTaskClass();
        if (!key) return null;
        key = key.toLowerCase();
        if (origKey) origKey = origKey.toLowerCase();

        var value = this._lastOutput[key];
        // Allow shorthand for ClassName (ex. service for ServiceTask, xor for XORGateway)
        if (origKey != null && value == null && !origKey.endsWith("task") && !origKey.endsWith("gateway")) {
            key = origKey + "task";
            value = this._lastOutput[key];
            if (value == null) {
                key = origKey + "gateway";
                value = this._lastOutput[key];
            }
        }
        return value;
    },

    handleTraceElement : function (element) {
        if (isc.isA.Class(element) && this.logIsDebugEnabled("workflow")) {
            this.logDebug((this.traceElement ? "Trace element: " : "Execute element: ") + this.echo(element), "workflow");
        }
        if (this.traceElement) this.traceElement(element, this.traceContext);
    }

    //> @attr process.traceContext (Object : null : IRWA)
    // Context object to be passed to +link{traceElement} during process
    // execution.
    // 
    // @visibility workflow
    //<
});

isc.Process.registerStringMethods({
    //> @method process.finished()
    // StringMethod called when a process completes, meaning the process executes a 
    // ProcessElement with no next element.
    // @param state (Record) the final process state
    // @visibility workflow
    //<
    finished: "state",

    //> @method process.traceElement()
    // StringMethod called during process execution before each task
    // element is processed.
    // @param element (Task) the +link{Task} being executed
    // @param context (Object) the +link{traceContext}, if set
    // @visibility workflow
    //<
    traceElement: "element,context"
});

// --------------------------------------------------------------------------------------------

//> @class ServiceTask
// A ServiceTask is an element of a +link{Process} which calls a DataSource operation, 
// optionally using part of the +link{Process.state,process state} as inputs or storing outputs
// in the process state. A special "export" +link{serviceTask.operationType,operationType} is
// supported to perform a server export based on criteria.
// <P>
// By default a ServiceTask takes the data indicated by +link{task.inputField,inputField} and/or
// +link{task.inputFieldList,inputFieldList} as detailed in +link{group:taskIO} and uses the
// <code>inputRecord</code> as +link{dsRequest.data}.  This means the input data becomes
// +link{Criteria} for "fetch" and "export" operations, new record values for an "add" operation, etc. 
// For simplicity, if no <code>inputFieldList</code> is provided and <code>inputField</code>
// specifies an object, <code>inputData</code> is used as <code>dsRequest.data</code>.
// <P>
// Alternatively, you can set +link{serviceTask.criteria} for a "fetch" and "export" operations, or
// +link{serviceTask.values} for other operationTypes.  In both cases, you have the ability to
// use simple expressions like $input.<i>fieldName</i> to take portions of the input data and
// use it as part of the criteria or values.
// <P>
// OutputData and outputFieldList work as filters. You should determine which properties should
// be fetched into the process state. If you want to load all data without defining every
// property manually you can pass a name started with '$' and fetched record or records will be 
// placed as a record or an array of records by the name without this specific symbol.
// <P>
// For example if you specify 'id' and 'name' in outputFieldList, only these properties will be
// fetched in the process state. If you pass '$orderHeader' in outputField a whole record will be 
// stored in process state under the 'orderHeader' key.
//
// @inheritsFrom Task
// @treeLocation Client Reference/Workflow
// @visibility workflow
//<



isc.defineClass("ServiceTask", "Task");

isc.ServiceTask.addClassProperties({
    // Indicates to WF Editor that task requires at least one DataSource to be edited
    requiresDataSources: true
});

isc.ServiceTask.addProperties({
    //> @attr serviceTask.dataSource (DataSource | GlobalId : null : IR)
    // DataSource ID or DataSource instance to be used.
    // @visibility workflow
    //<

    //> @attr serviceTask.operationType (DSOperationType : "fetch" : IR)
    // Type of operation to invoke. A special "export" operation type is
    // supported to perform a server export based on criteria.
    // @visibility workflow
    //<
    operationType: "fetch",

    //> @attr serviceTask.operationId (String : null : IR)
    // The +link{operationBinding.operationId,operationId} to invoke.
    // @visibility workflow
    //<
    
    //> @attr serviceTask.criteria (Criteria : null : IR)
    // Criteria (including AdvancedCriteria) to use for "fetch" and "export" operations.
    // <P>
    // Data values in this criteria prefixed with "$" will be treated as dynamic expressions
    // which can access the inputs to this task as $input - see
    // +link{group:taskInputExpression}.  Specifically, this means that for simple criteria,
    // any property value that is a String and is prefixed with "$" will be assumed to be an
    // expression, and for AdvancedCriteria, the same treatment will be applied to
    // +link{criterion.value}.
    // <P>
    // If any data value should not be treated as dynamic (for example, a "$" should be taken
    // as literal), you can place it in +link{fixedCriteria} instead.
    // <P>
    // Ignored for any operationType other than "fetch" and "export".  Update or delete operations should
    // place the primary key to update in +link{values}.
    // <p>
    // This property supports +link{group:dynamicCriteria} - use +link{criterion.valuePath}
    // to refer to values in the +link{Process.ruleScope}.
    // @group taskIO
    // @visibility workflow
    //<

    //> @attr serviceTask.values (Record : null : IR)
    // Values to be submitted for "update", "add" and "remove" operations.
    // <P>
    // Similar to +link{criteria}, data values prefixed with "$" will be treated as a
    // +link{group:taskInputExpression}.  Use +link{fixedValues} for any values that start with
    // "$" but should be treated as a literal.
    // @visibility workflow
    //<

    //> @attr serviceTask.fixedCriteria (Criteria : null : IR)
    // Criteria to be submitted as part of the DSRequest, regardless of inputs to the task.
    // Will be combined with the data from the +link{task.inputField} or with
    // +link{serviceTask.criteria} if specified, via +link{DataSource.combineCriteria()}.
    // @visibility workflow
    //<

    //> @attr serviceTask.fixedValues (Record : null : IR)
    // Values to be submitted as part of the DSRequest, regardless of inputs to the task. Will 
    // be combined with the data from the +link{task.inputField} or with
    // +link{serviceTask.values} if specified, via simple copying of fields, with
    // <code>fixedValues</code> overwriting values provided by the <code>inputField</code>, but
    // explicitly specified +link{serviceTask.values} overriding <code>fixedValues</code>.
    // @visibility workflow
    //<

    //> @attr serviceTask.exportFormat (ExportFormat : "csv" : IR)
    // The format in which the data should be exported.  See +link{ExportFormat} for more 
    // information.
    //
    // @visibility workflow
    //<

    //> @attr serviceTask.outputField (String : null : IR)
    // Field in the +link{Process.state,process state} where this task writes outputs. See
    // +link{group:taskIO}.
    // <p>
    // See +link{outputFieldList} for a shorthand method to save the full operation response
    // data.
    // @group taskIO
    // @visibility workflow
    //<

    //> @attr serviceTask.outputFieldList (Array of String : null : IR)
    // List of multiple fields in the +link{Process.state,process state} where this task will
    // write outputs. See +link{group:taskIO}.  
    // <P>
    // If +link{outputField} is also specified, it will be implicitly added to the
    // <code>outputFieldList</code> if it is not already present.
    // <P>
    // In addition to pulling individual fields from the task operation result and placing
    // them into the process state the full response data can also be written into the
    // process state without specifying individual fields. Prefix a destination
    // field path with a "$" (ex. $orderHeader) causes the entire <code>dsResponse.data</code>
    // to be saved.
    // @group taskIO
    // @visibility workflow
    //<

    //> @attr serviceTask.failureElement (String : null : IR)
    // ID of the next sequence or element to proceed to if a failure condition arises
    // from DataSource operation.
    // @visibility workflow
    //<

    //> @attr serviceTask.passThruOutput (Boolean : false : IR)
    // @include processElement.passThruOutput
    //<
    passThruOutput: false,

    executeElement : function (process) {
        var ds = this.dataSource;
        if (ds.getClassName == null || ds.getClassName() != "DataSource") {
            ds = isc.DataSource.get(ds);
        }
        var requestData = this._createRequestData(process);
        if (this.operationType == "export") {
            var requestProperties = {
                exportAs: this.exportFormat,
                operationId: this.operationId
            };
            ds.exportData(requestData, requestProperties);
            // not async
            return true;
        }

        var params = isc.addProperties({}, this.requestProperties, { operationId: this.operationId });
        params.willHandleError = true;

        var task = this;
        ds.performDSOperation(this.operationType, requestData, function(dsResponse, data, request) {
            var results = dsResponse.results,
                operation = request.operation;
            if (dsResponse.isStructured && 
                (!results || results.status < 0 || (results.status == null && dsResponse.status < 0))) 
            {
                if (!isc.RPC.runDefaultErrorHandling(dsResponse, request, task.errorFormatter)) {
                    task.fail(process);
                    return;
                }
            }

            var output = data;
            if (isc.isAn.Array(data) && data.length > 0) {
                if (this.operationType == "fetch") {
                    var primaryKey = ds.getPrimaryKeyFieldName();
                    if (ds.isAdvancedCriteria(requestData)) {
                        var criterion = ds.getFieldCriterion(requestData, primaryKey);
                        if (criterion && criterion.operator == "equals") {
                            output = data[0];
                        }
                    } else if (ds.defaultTextMatchStyle == "equals" && requestData[primaryKey] != null) {
                        output = data[0];
                    }
                } else if (this.operationType != "custom") {
                    output = data[0];
                }
            } 
            process.setTaskOutput(task.getClassName(), task.ID, output);
                
            if (!isc.isAn.Array(data)) data = [data];

            if (data.length > 0) {
                var fieldsToProcess = [];
                if (task.outputFieldList) {
                    fieldsToProcess.addList(task.outputFieldList);
                }
                if (task.outputField) fieldsToProcess.add(task.outputField);
                for (var i = 0; i < fieldsToProcess.length; i++) {
                    var fieldName = fieldsToProcess[i];
                    if (fieldName.startsWith("$")) {
                        var value = data.length == 1 ? data[0] : data;
                        fieldName = fieldName.substring(1);
                        process.setStateVariable(fieldName, value);
                    } else {
                        var key = fieldName;
                        var ldi = key.lastIndexOf(".");
                        if (ldi > 0) {
                            key = key.substring(ldi + 1);
                        }
                        var value = data[0][key];
                        if (typeof value != 'undefined') {
                            if (data.length > 1) {
                                value = [value];
                                for (var i = 1; i < data.length; i++) {
                                  value.add(data[i][key])
                                }
                            }
                            process.setStateVariable(fieldName, value);
                        }
                    }
                };
                task._writeOutputExpression(data);
            }
            process.start();
        }, params);
        return false;
    },
    
    _createRequestData : function (process, skipDynamicExpressions) {
        var inputData;
        var inputRecord = {};
        if (this.inputFieldList) {
            for (var i = 0; i < this.inputFieldList.length; i++) {
                var key = this.inputFieldList[i];
                var ldi = key.lastIndexOf(".");
                if (ldi > 0) {
                    key = key.substring(ldi + 1);
                }
                inputRecord[key] = process.getStateVariable(this.inputFieldList[i]);
            };
        }
        if (this.inputField) {
            var key = this.inputField;
            if (!skipDynamicExpressions && key.startsWith("$")) {
                inputData = this._resolveInputField(key, process);
            }
            var ldi = key.lastIndexOf(".");
            if (ldi > 0) {
                key = key.substring(ldi + 1);
            }
            if (inputData == null) inputData = process.getStateVariable(this.inputField);
            inputRecord[key] = inputData;
        }

        var data = null;
        if (this.operationType == "fetch" || this.operationType == "export") {
            if (this.criteria && !skipDynamicExpressions) {
                // Resolve any dynamicCriteria or taskInputExpressions. Returns a copy of criteria.
                data = this._resolveCriteriaExpressions(this.criteria, inputData, inputRecord, process);
            } else if (this.criteria) {
                data = this.criteria;
            }
            if (this.fixedCriteria) {
                if (data == null && inputRecord == null) {
                    data = this.fixedCriteria
                } else {
                    var crit = isc.clone(this.fixedCriteria);
                    if (inputRecord) {
                        crit = isc.DataSource.combineCriteria(inputRecord, crit);    
                    }
                    if (data) {
                        crit = isc.DataSource.combineCriteria(data, crit);    
                    }
                    data = crit;
                }
            }
        }
        if (data == null) {
            data = (this.inputFieldList == null && isc.isAn.Object(inputData) ? inputData : inputRecord);
        }
        if (this.operationType != "fetch" && this.operationType != "export") {
            if (this.values) {
                data = this.values;
                if( !skipDynamicExpressions) {
                    // Resolve any dynamicCriteria or taskInputExpressions. Returns a copy of criteria.
                    data = this._resolveObjectDynamicExpressions(this.values, inputData, inputRecord, process);
                }
            }
            if (this.fixedValues) {
                for (var key in this.fixedValues) {
                    data[key] = this.fixedValues[key];
                }
            }
        }

        return data;
    },

    fail : function (process) {
        if (!this.failureElement) {
            this.logWarn("ServiceTask does not have a failureElement. Process is aborting.");
            // the call to setNextElement() below will cause the process to terminate automatically
        }
        process.setNextElement(this.failureElement);
    },

    // "this" is not available
    errorFormatter : function (codeName, response, request) {
        if (codeName == "VALIDATION_ERROR") {
            var errors = response.errors,
                message = ["Server returned validation errors:<BR><UL>"]
            ;
            if (!isc.isAn.Array(errors)) errors = [errors];
            for (var i = 0; i < errors.length; i++) {
                var error = errors[i];
                for (var field in error) {
                    var fieldErrors = error[field];
                    message.add("<LI><B>" + field + ":</B> ");
                    if (!isc.isAn.Array(fieldErrors)) fieldErrors = [fieldErrors];
                    for (var j = 0; j < fieldErrors.length; j++) {
                        var fieldError = fieldErrors[j];
                        message.add((j > 0 ? "<BR>" : "") + (isc.isAn.Object(fieldError) ? fieldError.errorMessage : fieldError));
                    }
                    message.add("</LI>");
                }
            }
            message.add("</UL>");
            return message.join("");
        }
        return null;
    },

    getElementDescription : function () {
        if (!this.dataSource) return "";
        var description = this.dataSource + " " + this.operationType + (this.operationId ? " ("+this.operationId+")" : ""),
            data = this._createRequestData({ getStateVariable : function (stateVariablePath) { return stateVariablePath; } }, true)
        ;

        if (this.operationType == "fetch" || this.operationType == "remove" || this.operationType == "export") {
            if (!isc.DS.isAdvancedCriteria(data)) {
                data = isc.DS.convertCriteria(data, (this.operationType == "remove" ? "exact" : null));
            }
            var dsFields = isc.XORGateway._processFieldsRecursively(data);
            // construct datasource for fields used in criteria
            var fieldsDS = isc.DataSource.create({
                addGlobalId: false,
                fields: dsFields
            });
            description += " where <ul>" + isc.DataSource.getAdvancedCriteriaDescription(data, fieldsDS, null, {prefix: "<li>", suffix: "</li>"}) + "</ul>";
            fieldsDS.destroy();
        }

        return description;
    },

    title: "DataSource Fetch Data",
    editorType: "ServiceTaskEditor",

    getOutputSchema : function () {
        var ds = this.dataSource;
        if (ds && (ds.getClassName == null || ds.getClassName() != "DataSource")) {
            ds = isc.DataSource.get(ds);
        }
        return ds;
    },

    updateLastElementBindingReferences : function (taskType) {
        var changed = this.Super("updateLastElementBindingReferences", arguments);

        if (this.criteria && (this.operationType == "fetch" || this.operationType == "export")) {
            changed = this._updateLastElementInCriteria(this.criteria, taskType) || changed;
        }

        if (this.values && this.operationType != "fetch" && this.operationType != "export") {
            changed = this._updateLastElementInValues(this.values, taskType) || changed;
        }

        return changed;
    },

    updateGlobalIDReferences : function (oldId, newId) {
        var changed = this.Super("updateGlobalIDReferences", arguments);

        if (this.criteria && (this.operationType == "fetch" || this.operationType == "export")) {
            changed = this._updateGlobalIDInCriteria(this.criteria, oldId, newId) || changed;
        }

        if (this.values && this.operationType != "fetch" && this.operationType != "export") {
            changed = this._updateGlobalIDInValues(this.values, oldId, newId) || changed;
        }

        return changed;
    }    
});

//> @class DSFetchTask
// A +link{ServiceTask,ServiceTask} configured to perform a fetch.
//
// @inheritsFrom ServiceTask
// @treeLocation Client Reference/Workflow
// @visibility workflow
//<
isc.defineClass("DSFetchTask", "ServiceTask").addProperties({
    title: "DataSource Fetch",
    classDescription: "Retrieve data from a DataSource which match specified criteria",
    editorType: "ServiceTaskEditor",
    editorProperties: { showOperationTypePicker: false },

    operationType: "fetch"
});

//> @class DSAddTask
// A +link{ServiceTask,ServiceTask} configured to perform an add.
//
// @inheritsFrom ServiceTask
// @treeLocation Client Reference/Workflow
// @visibility workflow
//<
isc.defineClass("DSAddTask", "ServiceTask").addProperties({
    title: "DataSource Add",
    classDescription: "Add a new record",
    editorType: "ServiceTaskEditor",
    editorProperties: { showOperationTypePicker: false },

    operationType: "add"
});

//> @class DSUpdateTask
// A +link{ServiceTask,ServiceTask} configured to perform a update.
//
// @inheritsFrom ServiceTask
// @treeLocation Client Reference/Workflow
// @visibility workflow
//<
isc.defineClass("DSUpdateTask", "ServiceTask").addProperties({
    title: "DataSource Update",
    classDescription: "Update an existing record",
    editorType: "ServiceTaskEditor",
    editorProperties: { showOperationTypePicker: false },

    operationType: "update"
});

//> @class DSRemoveTask
// A +link{ServiceTask,ServiceTask} configured to perform a remove.
//
// @inheritsFrom ServiceTask
// @treeLocation Client Reference/Workflow
// @visibility workflow
//<
isc.defineClass("DSRemoveTask", "ServiceTask").addProperties({
    title: "DataSource Remove",
    classDescription: "Remove an existing record",
    editorType: "ServiceTaskEditor",
    editorProperties: { showOperationTypePicker: false },

    operationType: "remove"
});


// --------------------------------------------------------------------------------------------

//> @class ScriptTask
// Task that executes arbitrary code, either synchronous or asynchronous.  Override the
// +link{scriptTask.execute(), execute()} method to provide custom logic.
//
// @inheritsFrom Task
// @treeLocation Client Reference/Workflow
// @visibility workflow
//<
isc.defineClass("ScriptTask", "Task");

isc.ScriptTask.addProperties({
    //> @attr scriptTask.passThruOutput (Boolean : false : IR)
    // @include processElement.passThruOutput
    //<
    passThruOutput: false,

    //> @method scriptTask.getProcess()
    // Get the process executing this task instance.
    // @return (Process) the owning process
    // @visibility workflow
    //<
    getProcess : function () {
        return this._process;
    },

    //> @method scriptTask.getInputData()
    // Get the inputs to this task as specified by +link{task.inputField}.
    // <P>
    // For a task with a +link{task.inputFieldList,inputFieldList}, use +link{getInputRecord}
    // to get access to other inputs.
    // @return (Any) input data
    // @group taskIO
    // @visibility workflow
    //<
    getInputData : function () {
        return this.inputData;
    },

    //> @method scriptTask.setOutputData()
    // Set the task output as specified by +link{task.outputField}.
    // <P>
    // NOTE: for an +link{scriptTask.isAsync,asychronous task}, calling
    // <code>setOutputData()</code> indicates the task is complete.  For a task with
    // +link{task.outputFieldList,multiple outputs}, call +link{setOutputRecord()} instead.
    // @param taskOutput (Any) task output
    // @group taskIO
    // @visibility workflow
    //<
    setOutputData : function (taskOutput) {
        this._finishTask(this._process, null, taskOutput);
    },

    //> @method scriptTask.getInputRecord()
    // Get all inputs to the task as specified by the 
    // +link{task.inputFieldList,inputFieldList}, as a Record.
    // @return (Record) input data
    // @group taskIO
    // @visibility workflow
    //<
    getInputRecord : function () {
        return this.inputRecord;
    },

    //> @method scriptTask.setOutputRecord()
    // Set all outputs of the task as specified by the
    // +link{task.outputFieldList,outputFieldList}, by providing a Record.
    // @param outputRecord (Record) output record
    // @group taskIO
    // @visibility workflow
    //<
    setOutputRecord : function (outputRecord) {
        this._finishTask(this._process, outputRecord);
    },

    //> @attr scriptTask.isAsync (Boolean : false : IR)
    // Whether the script task is asynchronous.  A synchronous task is expected to return data
    // directly from execute() and is considered complete once the execute() method exits.
    // <P>
    // An asnychronous task is expected to start processing in execute(), and will not be
    // considered complete until either +link{setOutputData()} or +link{setOutputRecord} is
    // called.
    // @visibility workflow
    //<
    isAsync : false,

    executeElement : function (process) {
        // process input
        var inputData;
        var inputRecord = {};
        if (this.inputFieldList) {
            for (var i = 0; i < this.inputFieldList.length; i++) {
                var key = this.inputFieldList[i];
                var ldi = key.lastIndexOf(".");
                if (ldi > 0) {
                    key = key.substring(ldi + 1);
                }
                inputRecord[key] = isc.clone(process.getStateVariable(this.inputFieldList[i]));
            };
        }
        if (this.inputField) {
            var key = this.inputField;
            if (key.startsWith("$")) {
                inputData = isc.clone(this._resolveInputField(key, process));
            }
            var ldi = key.lastIndexOf(".");
            if (ldi > 0) {
                key = key.substring(ldi + 1);
            }
            if (inputData == null) inputData = isc.clone(process.getStateVariable(this.inputField));
            inputRecord[key] = inputData;
        }

        // Save inputs so they can be referenced asynchronously
        this.inputData = inputData;
        this.inputRecord = inputRecord;
        this._process = process;
        
        try {
            var output = this.execute(inputData, inputRecord);
        } catch (e) {
            isc.logWarn("Error while executing ScriptTask: "+e.toString());
        }
    
        if (this.isAsync) {
            return false;
        }
        
        if (typeof output == 'undefined') {
            return true;
        }

        this._processTaskOutput(process, output);
        return true;
    },
    
    _processTaskOutput : function (process, output) {
        process.setTaskOutput(this.getClassName(), this.ID, output);

        // process output
        if (this.outputFieldList) {
            for (var i = 0; i < this.outputFieldList.length; i++) {
                var key = this.outputFieldList[i];
                var ldi = key.lastIndexOf(".");
                if (ldi > 0) {
                    key = key.substring(ldi + 1);
                }
                var value = output[key];
                if (typeof value != 'undefined') {
                    process.setStateVariable(this.outputFieldList[i], value);
                }
            };
        }
        if (this.outputField) {
            if (this.outputFieldList == null) {
                if (typeof output != 'undefined') {
                    process.setStateVariable(this.outputField, output);
                }
            } else {
                var key = this.outputField;
                var ldi = key.lastIndexOf(".");
                if (ldi > 0) {
                    key = key.substring(ldi + 1);
                }
                var value = output[key];
                if (typeof value != 'undefined') {
                    process.setStateVariable(this.outputField, value);
                }
            }
        }
        this._writeOutputExpression(output);
    },
    
    _finishTask : function (process, outputRecord, outputData) {
        if (outputRecord == null) {
            this._processTaskOutput(process, outputData);
        } else {
            if (outputData) {
                var key = this.outputField;
                var ldi = key.lastIndexOf(".");
                if (ldi > 0) {
                    key = key.substring(ldi + 1);
                }
                outputRecord[key] = outputData;
            }
            this._processTaskOutput(process, outputRecord);
        }
        
        if (this.isAsync) {
            process.start();
        }
    },
    
    getCustomDefaults : function () {
        return { execute: isc.Func.getBody(this.execute) };
    }
});

isc.ScriptTask.registerStringMethods({
    //> @method scriptTask.execute()
    // Execute the task.  
    // @param input (Any) the task input
    // @param inputRecord (Record) the task input record if an <code>inputFieldList</code> was
    // specified. See +link{group:taskIO}
    // @return (Any) the task output.  For multiple field output, call 
    // +link{setOutputRecord()} instead, and return null
    // @visibility workflow
    //<
    execute: "input,inputRecord"
});

// --------------------------------------------------------------------------------------------

//> @class XORGateway
// Chooses one or another next process element based on AdvancedCriteria applied to
// +link{process.state}.
// <P>
// If the AdvancedCriteria evaluate to true, the +link{xorGateway.nextElement,nextElement} is
// chosen, otherwise the +link{xorGateway.failureElement,failureElement}.
// <P>
// Note that "XOR" in <code>XORGateway</code> means "exclusive or" - only one next element is
// chosen.
//
// @inheritsFrom ProcessElement
// @treeLocation Client Reference/Workflow
// @visibility workflow
//<

isc.defineClass("XORGateway", "ProcessElement");

isc.XORGateway.addClassProperties({
    _processFieldsRecursivelyValuesOnly : function (criteria) {
        var dsFields = [];
        if (criteria.fieldName) {
            if (!dsFields.contains(criteria.fieldName)) {
                dsFields.add(criteria.fieldName);                
            }
        } else if (criteria.criteria) {
            for (var i = 0; i < criteria.criteria.length; i++) {
                var fs = this._processFieldsRecursivelyValuesOnly(criteria.criteria[i]);
                for (var j = 0; j < fs.length; j++) {
                    if (!dsFields.contains(fs[j])) {
                        dsFields.add(fs[j]);
                    }
                }
            }
        } else {
            for (var key in criteria) {
                if (!dsFields.contains(key)) {
                    dsFields.add(key);                
                }
            }
        }
        return dsFields
    },
    _processFieldsRecursively : function (criteria) {
        var res = [];
        var dsFields = isc.XORGateway._processFieldsRecursivelyValuesOnly(criteria);
        for (var i = 0; i < dsFields.length; i++) {
            var fieldName = dsFields[i],
                splitFieldName = fieldName.split("."),
                title = isc.DS.getAutoTitle(splitFieldName[splitFieldName.length-1])
            ;
            res.add({
                name: fieldName,
                title: title
            });
        }
        return res;
    }
});

isc.XORGateway.addProperties({
    //> @attr xorGateway.criteria (Criteria : null : IR)
    // Simple or +link{AdvancedCriteria} to be applied against the +link{process.state}.
    // <P>
    // Data values in this criteria prefixed with "$" will be treated as dynamic expressions
    // as detailed in +link{group:taskInputExpression}.  Specifically, this means that for 
    // simple criteria, any property value that is a String and is prefixed with "$" will be
    // assumed to be an expression, and for AdvancedCriteria, the same treatment will be
    // applied to +link{criterion.value}.
    // <p>
    // Note that dynamic expressions starting with "$input" are not applicable
    // for an XORGateway but "$inputRecord" can be used for direct reference to +link{Process.state}. 
    // <p>
    // This property supports +link{group:dynamicCriteria} - use +link{criterion.valuePath}
    // to refer to values in the +link{Process.ruleScope}.
    //
    // @visibility workflow
    //<

    //> @attr xorGateway.nextElement (String : null : IR)
    // Next +link{process.sequences,sequence} or +link{process.elements,element} to execute
    // if the criteria match the process state.  
    // <p>
    // <code>nextElement</code> does not need to be specified if this gateway is part of a
    // +link{Process.sequences,sequence} and has a next element in the sequence.
    // <p>
    // Note that if there is both a <code>sequence</code> and a normal <code>element</code>
    // with the same name in the current <code>Process</code>, the <code>sequence</code> will
    // be used.
    //
    // @visibility workflow
    //<

    //> @attr xorGateway.failureElement (String : null : IR)
    // ID of the next sequence or element to proceed to if the criteria do not match.
    // @visibility workflow
    //<
    
    title: "Single Decision",
    classDescription: "Choose the next task based on criteria",
    editorType: "XORGatewayEditor",

    executeElement : function (process) {
        process.setTaskOutput(this.getClassName(), this.ID, process.getLastTaskOutput());

        var criteria = this.criteria;
        if (criteria) {
            criteria = this._resolveCriteriaExpressions(criteria, process.state, process.state, process);
        }        
        var data = [process.state];
        if (process.ruleScope) {
            var ruleScopeComponent = window[process.ruleScope];
            if (ruleScopeComponent && !ruleScopeComponent.destroyed) {
                data.add(ruleScopeComponent.getRuleContext());
            }
        }
        if (criteria && isc.DS.applyFilter(data, criteria).length == 1) {
            if (this.nextElement) process.setNextElement(this.nextElement);
        } else {
            if (!this.failureElement) {
                this.logWarn("XOR Gateway does not have a failureElement. Process is aborting.");
                // the call to setNextElement() below will cause the process to terminate automatically
            }
            process.setNextElement(this.failureElement);
        }
        return true;
    },
    
    getElementDescription : function () {
        var description = "No criteria - always fail";
        if (this.criteria) {
            var dsFields = isc.XORGateway._processFieldsRecursively(this.criteria);
            // construct datasource for fields used in criteria
            var fieldsDS = isc.DataSource.create({
                addGlobalId: false,
                fields: dsFields
            });

            description = "when <ul>" + isc.DataSource.getAdvancedCriteriaDescription(this.criteria, fieldsDS, null, {prefix: "<li>", suffix: "</li>"}) + "</ul>";            
            fieldsDS.destroy();
        }
        return description;
    },
    
    getPlaceholders : function () {
        return (this.failureElement == isc.Process.gatewayPlaceholderSelection ? ["failureElement"] : null);
    },
    
    setPlaceholderId : function (placeholder, id) {
        if (placeholder == "failureElement") this.failureElement = id;
    },

    updateLastElementBindingReferences : function (taskType) {
        var changed = this.Super("updateLastElementBindingReferences", arguments);
        changed = this._updateLastElementInCriteria(this.criteria, taskType) || changed;
        return changed;
    },

    updateGlobalIDReferences : function (oldId, newId) {
        var changed = this.Super("updateGlobalIDReferences", arguments);
        changed = this._updateGlobalIDInCriteria(this.criteria, oldId, newId) || changed;
        return changed;
    }
});

// --------------------------------------------------------------------------------------------

//> @class UserConfirmationGateway
// Chooses one or another next process element based on confirmation of a message shown to user.
// <P>
// If the user clicks OK, the +link{xorGateway.nextElement,nextElement} is
// chosen, otherwise the choice is +link{xorGateway.failureElement,failureElement}.
//
// @inheritsFrom ProcessElement
// @treeLocation Client Reference/Workflow
// @visibility workflow
//<
isc.defineClass("UserConfirmationGateway", "ProcessElement");

isc.UserConfirmationGateway.addProperties({
    //> @attr userConfirmationGateway.message (String : null : IR)
    // Message to display to the user for confirmation. To display a dynamic message see
    // +link{textFormula}.
    // @visibility workflow
    //<

    //> @attr userConfirmationGateway.textFormula (UserSummary : null : IR)
    // Formula to be used to calculate the message contents. Use +link{message} property
    // to assign a static message instead.
    // <p> 
    // Available fields for use in the formula are the current +link{canvas.ruleScope,rule context}.
    //
    // @visibility workflow
    //<

    //> @attr userConfirmationGateway.nextElement (String : null : IR)
    // Next +link{process.sequences,sequence} or +link{process.elements,element} to execute
    // if the criteria match the process state.  
    // <p>
    // <code>nextElement</code> does not need to be specified if this gateway is part of a
    // +link{Process.sequences,sequence} and has a next element in the sequence.
    // <p>
    // Note that if there is both a <code>sequence</code> and a normal <code>element</code>
    // with the same name in the current <code>Process</code>, the <code>sequence</code> will
    // be used.
    //
    // @visibility workflow
    //<

    //> @attr userConfirmationGateway.failureElement (String : null : IR)
    // ID of the next sequence or element to proceed to if the criteria do not match.
    // @visibility workflow
    //<
    
    title: "Confirm with user",
    classDescription: "Choose the next task based on user confirmation",
    editorType: "UserConfirmationGatewayEditor",

    executeElement : function (process) {
        process.setTaskOutput(this.getClassName(), this.ID, process.getLastTaskOutput());

        var message = this.getTextFormulaValue(this.textFormula, process) ||
                      this.getDynamicValue(this.message, process);

        var task = this;
        isc.confirm(message, function (value) {
            if (value) {
                if (task.nextElement) process.setNextElement(task.nextElement);
            } else {
                if (!task.failureElement) {
                    task.logWarn("User Confirmation Gateway does not have a failureElement. Process is aborting.");
                    // the call to setNextElement() below will cause the process to terminate automatically
                }
                process.setNextElement(task.failureElement);
            }
            process.start();
        });

        // processing confirmation asynchronously
        return false;
    },
    
    getElementDescription : function () {
        var description = "Confirm with user";
        return description;
    },
    
    getPlaceholders : function () {
        return (this.failureElement == isc.Process.gatewayPlaceholderSelection ? ["failureElement"] : null);
    },
    
    setPlaceholderId : function (placeholder, id) {
        if (placeholder == "failureElement") this.failureElement = id;
    }
});

// --------------------------------------------------------------------------------------------

//> @object TaskDecision
// Identifies a potential decision (branch) within a +link{decisionGateway}. Each decision
// has a criteria and a target ProcessElement ID.
//
// @treeLocation Client Reference/Workflow
// @visibility workflow
//<

//> @attr taskDecision.criteria (Criteria : null : IR)
// Criteria identifying when the +link{targetTask} should be chosen within a
// +link{decisionGateway.decisionList}.
// <P>
// Data values in this criteria prefixed with "$" will be treated as dynamic expressions
// as detailed in +link{group:taskInputExpression}.  Specifically, this means that for 
// simple criteria, any property value that is a String and is prefixed with "$" will be
// assumed to be an expression, and for AdvancedCriteria, the same treatment will be
// applied to +link{criterion.value}.
// <P>
// Note that dynamic expressions starting with "$input" are not applicable
// in this context but "$inputRecord" can be used for direct reference to +link{Process.state}. 
// <p>
// This property supports +link{group:dynamicCriteria} - use +link{criterion.valuePath}
// to refer to values in the +link{Process.ruleScope}.
//
// @visibility workflow
//<

//> @attr taskDecision.targetTask (String : null : IR)
// +link{ProcessElement.ID} of element to be used as next element if
// +link{taskDecision.criteria,criteria} matches.
// @visibility workflow
//<

//> @class DecisionGateway
// Chooses a next element in a +link{Process} by evaluating a series of criteria against the
// +link{process.state} and choosing the element associated with the criteria that matched, or
// a +link{decisionGateway.defaultElement, defaultElement} if none of the criteria match.
//
// @inheritsFrom ProcessElement
// @treeLocation Client Reference/Workflow
// @visibility workflow
//<

isc.defineClass("DecisionGateway", "ProcessElement");

isc.DecisionGateway.addProperties({
    //> @attr decisionGateway.criteriaMap (Map<String,Criteria> : null : IR)
    // A Map from +link{ProcessElement.ID} to Criteria that will cause this ProcessElement to
    // be chosen as the next element if the criteria matches.
    // <P>
    // If no criteria is matched the next element is +link{defaultElement} or the workflow
    // is finished.
    // <P>
    // Data values in this criteria prefixed with "$" will be treated as dynamic expressions
    // as detailed in +link{group:taskInputExpression}.  Specifically, this means that for 
    // simple criteria, any property value that is a String and is prefixed with "$" will be
    // assumed to be an expression, and for AdvancedCriteria, the same treatment will be
    // applied to +link{criterion.value}.
    // <P>
    // Note that dynamic expressions starting with "$input" are not applicable
    // for an DecisionGateway but "$inputRecord" can be used for direct reference to +link{Process.state}. 
    // <p>
    // This property supports +link{group:dynamicCriteria} - use +link{criterion.valuePath}
    // to refer to values in the +link{Process.ruleScope}.
    //
    // @visibility workflow
    // @deprecated In favor of +link{decisionList} as of <smartclient>SmartClient</smartclient>
    // <smartgwt>SmartGWT</smartgwt> release 12.1
    //<

    //> @attr decisionGateway.decisionList (Array of TaskDecision : null : IR)
    // List of +link{taskDecision,TaskDecisions} to be processed to find the first with matching
    // criteria. The specified +link{taskDecision.targetTask} is then used to identify the the next
    // element.
    // <P>
    // If no criteria is matched the next element is +link{defaultElement} or the workflow
    // is finished.
    // <p>
    // When providing a DecisionGateway in XML, the <code>decisionList</code> is expressed as:
    // <pre>
    //     &lt;DecisionGateway ID="continentDecision" description="Which continent?" defaultElement="summary"&gt;
    //         &lt;decisionList&gt;
    //             &lt;taskDecision targetTask="europeVATTask"&gt;
    //                 &lt;criteria fieldName="order.continent" operator="equals" value="Europe" /&gt;
    //             &lt;/taskDecision&gt;
    //             ...
    //         &lt;/decisionList&gt;
    //     &lt;DecisionGateway&gt;
    // </pre>
    // @visibility workflow
    //<

    //> @attr decisionGateway.defaultElement (String : null : IR)
    // Next element to pick if no criteria match.  If this gateway is part of a
    // +link{process.sequences,sequence} and has a next element in the sequence, the
    // <code>defaultElement</code> is assumed to be the next element and does not need to be
    // specified.    
    // @visibility workflow
    //<

    //> @attr decisionGateway.nextElement  (String : null : IR)
    // Not applicable to a DecisionGateway.
    // @see decisionGateway.defaultElement
    // @visibility workflow
    //<    

    // Suppress an add element box in workflow editor after this element 
    _canAddNextElement: false,

    title: "Multi Decision",
    classDescription: "Choose multiple possible next tasks based on criteria",
    editorType: "DecisionGatewayEditor",

    executeElement : function (process) {
        this._convertCriteriaMap();
        if (!this.decisionList) this.decisionList = [];

        process.setTaskOutput(this.getClassName(), this.ID, process.getLastTaskOutput());

        for (var i = 0; i < this.decisionList.length; i++) {
            var taskDecision = this.decisionList[i],
                criteria = taskDecision.criteria
            ;
            if (criteria) {
                criteria = this._resolveCriteriaExpressions(criteria, process.state, process.state, process);
            }
            var dsFields = isc.XORGateway._processFieldsRecursively(criteria);
            // construct datasource that will check all fields in process state
            var ds = isc.DataSource.create({
                fields: dsFields
            });

            var data = [process.state];
            if (process.ruleScope) {
                var ruleScopeComponent = window[process.ruleScope];
                if (ruleScopeComponent && !ruleScopeComponent.destroyed) {
                    data.add(ruleScopeComponent.getRuleContext());
                }
            }

            if (ds.applyFilter(data, criteria).length == 1) {
                process.setNextElement(taskDecision.targetTask);
                return true;
            }
        }
        if (this.defaultElement) process.setNextElement(this.defaultElement);    
        return true;
    },

    _convertCriteriaMap : function () {
        if (!this.decisionList && this.criteriaMap) {
            // convert criteriaMap to decisionList
            var decisionList = [];
            for (var key in this.criteriaMap) {
                decisionList.add({
                    criteria: this.criteriaMap[key],
                    targetTask: key
                });
            }
            this.decisionList = decisionList;
        }
    },

    getElementDescription : function () {
        this._convertCriteriaMap();
        var description = "Multi-branch";
        if ((!this.decisionList || this.decisionList.length == 0) && this.defaultElement) {
            // An immediate jump (i.e. go to)
            description = "Go to " + this.defaultElement;
        }
        return description;
    },

    
    dropElementReferences : function (ID) {
        this._convertCriteriaMap();

        if (this.decisionList) {
            var decisionsToDrop = [];
            for (var i = 0; i < this.decisionList.length; i++) {
                var taskDecision = this.decisionList[i];
                if (taskDecision.targetTask == ID) decisionsToDrop.add(taskDecision);
            }
            if (decisionsToDrop.length > 0) this.decisionList.removeList(decisionsToDrop);
        }
        if (this.defaultElement == ID) this.defaultElement = null;
    },
    
    
    updateElementReferences : function (oldID, newID) {
        this._convertCriteriaMap();

        if (this.decisionList) {
            for (var i = 0; i < this.decisionList.length; i++) {
                var taskDecision = this.decisionList[i];
                if (taskDecision.targetTask == oldID) taskDecision.targetTask = newID;
            }
        }
        if (this.defaultElement == oldID) this.defaultElement = newID;
    },

    getPlaceholders : function () {
        this._convertCriteriaMap();

        var placeholders = [];
        if (this.decisionList) {
            for (var i = 0; i < this.decisionList.length; i++) {
                var taskDecision = this.decisionList[i];
                if (taskDecision.targetTask == isc.Process.gatewayPlaceholderSelection) {
                    placeholders.add("" + i);
                }
            }
        }
        if (this.defaultElement == isc.Process.gatewayPlaceholderSelection) {
            placeholders.add("defaultElement");
        }
        return placeholders;
    },
    
    setPlaceholderId : function (placeholder, id) {
        if (placeholder == "defaultElement") {
            this.defaultElement = id;
        } else {
            var index = parseInt(placeholder);
            this.decisionList[index].targetTask = id;
        }
    },

    updateLastElementBindingReferences : function (taskType) {
        var changed = this.Super("updateLastElementBindingReferences", arguments);
        if (this.decisionList) {
            for (var i = 0; i < this.decisionList.length; i++) {
                var taskDecision = this.decisionList[i],
                    criteria = taskDecision.criteria
                ;
                changed = this._updateLastElementInCriteria(this.criteria, taskType) || changed;
            }
        }
        return changed;
    },

    updateGlobalIDReferences : function (oldId, newId) {
        var changed = this.Super("updateGlobalIDReferences", arguments);
        if (this.decisionList) {
            for (var i = 0; i < this.decisionList.length; i++) {
                var taskDecision = this.decisionList[i],
                    criteria = taskDecision.criteria
                ;
                changed = this._updateGlobalIDInCriteria(criteria, oldId, newId) || changed;
            }
        }
        return changed;
    }
});

// --------------------------------------------------------------------------------------------

//> @class UserTask
// A task that involves showing a user interface to the end user allowing the user to view and
// input data and press a button (or do some other UI gesture) to complete the task.
// <P>
// A UserTask takes the following steps:
// <ul>
// <li> Optionally show() or otherwise make visible the +link{userTask.targetView, targetView}
//      or +link{userTask.inlineView, inlineView}
// <li> Provide values to either a +link{DynamicForm} designated as the +link{userTask.targetForm, targetForm} or to
//      a +link{ValuesManager} designated as the +link{userTask.targetVM, targetVM}, via +link{ValuesManager.setValues(),setValues()}
// <li> Waits for notification of completion or cancellation.  The UserTask is notified of
//      completion if a +link{SubmitItem} is pressed in either the <code>targetForm</code> or
//      any form that is a member of the <code>targetVM</code>.  Likewise a +link{CancelItem}
//      triggers cancellation.  Direct calls to +link{dynamicForm.cancelEditing()} or
//      +link{dynamicForm.completeEditing()} achieve the same result.
// <li> if cancellation occurs, the process continues to the +link{userTask.cancelElement, cancelElement}
//      if specified. Otherwise the workflow is immediately finished.
// <li> if completion occurs, values are retrieved from the form or valuesManager and applied
//      to the process state based on +link{task.outputField,outputField},
//      +link{task.outputFieldList,outputFieldList} or +link{task.inputField,inputField}, in that order.
// </ul>
// @inheritsFrom Task
// @treeLocation Client Reference/Workflow
// @visibility workflow
//<


isc.defineClass("UserTask", "Task");

isc.UserTask.addProperties({
    //> @attr userTask.targetView (Canvas | String : null : IR)
    // Widget that should be shown to allow user input.  If this widget is a DynamicForm,
    // it will also be automatically used as the +link{targetForm} unless either
    // <code>targetForm</code> or +link{targetVM} is set.
    // <P>
    // <code>UserTask</code> will automatically handle various scenarios of the
    // <code>targetView</code> not currently visible or draw()n, according to the following
    // rules:
    // <ul>
    // <li> if the view itself is marked hidden, it will be show()n
    // <li> if the view is inside a hidden parent, the parent will be show()n
    // <li> if the view is the +link{tab.pane} of a tab in a TabSet, the tab will be selected
    // <li> if the view is listed in +link{SectionStackSection.items} for a which is either
    //      collapsed or hidden section, the section will be shown and expanded
    // <li> if the view is listed in +link{Window.items} for a Window, the Window will be shown
    // <li> if any of these conditions apply to any parent of the targetView, the rules will be
    //      applied to that parent as well.  For example, the targetView is in a collapsed section
    //      inside a tab which is not selected, the section will be expanded <b>and</b> the tab
    //      selected
    // </ul>
    // @see inlineView
    // @visibility workflow
    //<
    
    //> @attr userTask.inlineView (Canvas : null: IRW)
    // An inline definition of the form. Can be used in place of +link{targetView} to encode form
    // directly in process xml.
    // @visibility workflow
    //<
    
    //> @attr userTask.targetForm (DynamicForm | String : null : IR)
    // DynamicForm that should be populated with data and that should provide the data for the task
    // outputs. If +link{targetView} is a DynamicForm and would also be the targetForm, the
    // targetForm attribute can be left unset.
    // <P>
    // Use +link{targetVM} to use a +link{ValuesManager} instead.
    // @visibility workflow
    //<
    
    //> @attr userTask.targetVM (ValuesManager | String : null : IR)
    // Optional ValuesManager which will receive task inputs and provide task outputs.
    // <p>
    // Use +link{targetForm} instead if you want to use a DynamicForm.
    // @visibility workflow
    //<
    
    //> @attr userTask.saveToServer (Boolean : false : IR)
    // If saveToServer is set then the associated form (+link{targetForm}) will perform the normal 
    // +link{DynamicForm.submit()} actions when submitted (typically from a +link{SubmitItem}).
    // By default the form submit action is bypassed.
    // @visibility workflow
    //<
    
    //> @attr userTask.wizard (Boolean : false : IR)
    // If wizard is set then associated form will be hidden after user goes to next or prev
    // step of current workflow.
    // @visibility workflow
    //<
    
    //> @attr userTask.passThruOutput (Boolean : false : IR)
    // @include processElement.passThruOutput
    //<
    passThruOutput: false,

    //> @attr userTask.cancelElement (String : null : IR)
    // Next element to proceed to if the task is cancelled because the +link{targetForm} or
    // +link{targetVM} had <code>cancelEditing()</code> called on it.
    // <p>
    // if no value is provided the workflow immediately completes.
    // @visibility workflow
    //<

    //> @attr userTask.previousElement (String : null : IR)
    // Previous workflow +link{process.sequences,sequence} or +link{process.elements,element}
    // that is helpful for wizards. This element will be executed if +link{goToPrevious()}
    // method of userTask will be invoked. You can get userTask for attached form by using 
    // +link{DynamicForm.userTask, userTask} property.
    // @visibility workflow
    //<

    //> @method userTask.goToPrevious() ([])
    // Set +link{previousElement} as next element of workflow. This method could be used to 
    // create wizard-like UI behavior.  
    // @visibility workflow
    //<
    goToPrevious : function () {
        if (this.previousElement == null) {
            isc.logWarn("PreviousElement is not set - unable to accomplish goToPrevious method.");
            return;
        }
        this._process.setNextElement(this.previousElement);
        this.completeEditing();
    },

    //> @method userTask.cancelEditing() ([])
    // Revert any changes made in a form and finish this userTask execution. 
    // +link{cancelElement} will be proceed as the next element of current process.  
    // @visibility workflow
    //<
    cancelEditing : function () {
        if (this._process) {
            if (this.wizard || this._process.wizard) {
                if (this.targetFormValue) {
                    this.targetFormValue.hide();
                }
            }
            var process = this._process
            // should be deleted before continuing process execution to be able to invoke
            // userTask several times in workflow
            delete this._process;
            process.setNextElement(this.cancelElement);
            process.start();
        }
    },
    
    //> @method userTask.completeEditing() ([])
    // Finish editing and store edited values in +link{Process.state,process state}.  
    // @visibility workflow
    //<
    completeEditing : function () {
        if (this._process) {
            var process = this._process;
            delete this._process;

            if (this.wizard || process.wizard) {
                if (this.targetFormValue) {
                    this.targetFormValue.hide();
                }
            }
            var values;
            if (this.targetVMValue) {
                values = this.targetVMValue.getValues();
            } else if (this.targetFormValue) {
                values = this.targetFormValue.getValues();
            }
            process.setTaskOutput(this.getClassName(), this.ID, values);

            if (this.outputField) {
                process.setStateVariable(this.outputField, values);
            } else if (this.outputFieldList) {
                for (var i = 0; i < this.outputFieldList.length; i++) {
                    var key = this.outputFieldList[i];
                    var ldi = key.lastIndexOf(".");
                    if (ldi > 0) {
                        key = key.substring(ldi + 1);
                    }
                    var value = values[key];
                    if (typeof value != 'undefined') {
                        process.setStateVariable(this.outputFieldList[i], value);
                    }
                }
            } else {
                process.setStateVariable(this.inputField, values);
            }
            this._writeOutputExpression(values);

            process.start();
        }
    },

    executeElement : function (process) {
        this._process = process;
        // convert from IDs to objects

        // View to show must be specified as either targetView or inlineView
        if (this.targetView && isc.isA.String(this.targetView)) {
            if (process.getStateVariable(this.targetView)) {
                this.targetViewValue = process.getStateVariable(this.targetView);                
            } else {
                this.targetViewValue = window[this.targetView];
                if (this.targetViewValue == null && process.views) {
                    for (var i = 0; i < process.views.length; i++) {
                        if (process.views[i].ID == this.targetView) {
                            this.targetViewValue = isc[process.views[i]._constructor].create(process.views[i]);
                            if (this._process.containerId) {
                                window[this._process.containerId].addMember(this.targetViewValue);
                            }
                            break;
                        }
                    }
                }
                // check autoChildren
                if (this.targetViewValue == null) {
                    this.targetViewValue = this.addAutoChild(this.targetView);
                }
                if (this.targetViewValue == null) {
                    isc.logWarn("TargetView " + this.targetView + " was not found.");                    
                }
            }
        } else {
            if (this.targetView) {
                this.targetViewValue = this.targetView;                
            } else if (this.inlineView){
                this.targetViewValue = isc[this.inlineView._constructor].create(this.inlineView);
                if (this._process.containerId) {
                    window[this._process.containerId].addMember(this.targetViewValue);
                }
            } 
        }

        // targetVM or targetForm can be used to specify the target for values.
        // Useful when view is a composite.
        if (this.targetVM && isc.isA.String(this.targetVM)) {
            if (process.state[this.targetVM]) {
                this.targetVMValue = process.getStateVariable(this.targetVM);                
            } else {
                this.targetVMValue = window[this.targetVM];
                if (this.targetVMValue == null) {
                    isc.logWarn("TargetVM " + this.targetVM + " was not found.");                    
                }
            }
        } else {
            this.targetVMValue = this.targetVM;
        }
        if (this.targetForm && isc.isA.String(this.targetForm)) {
            if (process.state[this.targetForm]) {
                this.targetFormValue = process.getStateVariable(this.targetForm);                
            } else {
                this.targetFormValue = window[this.targetForm];
                if (this.targetFormValue == null) {
                    isc.logWarn("TargetForm " + this.targetForm + " was not found.");                    
                }
            }
        } else {
            this.targetFormValue = this.targetForm;
        }

        if (this.targetViewValue == null) {
            isc.logWarn("TargetView or inlineView should be set for UserTask");
            return true;
        }
        if (this.targetFormValue == null && isc.isA.DynamicForm(this.targetViewValue)) {
            this.targetFormValue = this.targetViewValue;
        }
        if (this.targetFormValue == null && this.targetVMValue == null) {
            isc.logWarn("Either targetForm or targetVM should be set for UserTask or " + 
                "targetView should be a DynamicForm");
            return true;
        }

        // Show targetView/inlineView
        this.targetViewValue.showRecursively();

        // Pull input values from process state
        var values = null;
        if (this.inputField) {
            if (this.inputField.startsWith("$")) {
                values = isc.clone(this._resolveInputField(this.inputField, process));
            } else {
                values = isc.clone(process.getStateVariable(this.inputField));
            }
        } else if (this.inputFieldList) {
        	values = {};
        	for (var i = 0; i < this.inputFieldList.length; i++) {
                var key = this.inputFieldList[i];
                var ldi = key.lastIndexOf(".");
                if (ldi > 0) {
                    key = key.substring(ldi + 1);
                }
                values[key] = isc.clone(process.getStateVariable(this.inputFieldList[i]));
        	}
        }

        if (this.targetVMValue) {
            if (values) this.targetVMValue.setValues(values);
            this.targetVMValue.userTask = this;
        }
        if (this.targetFormValue) {
            if (values) this.targetFormValue.setValues(values);
            this.targetFormValue.saveToServer = (this.saveToServer == true);
            this.targetFormValue.userTask = this;
        }
        return false;
    },

    getElementDescription : function () {
        var showTarget = { type: "[nothing]" };

        if (this.targetView) {
            showTarget = { type: "targetView", ID: (isc.isA.String(this.targetView) ? this.targetView : null) };
        } else if (this.inlineView) {
            showTarget = { type: "inlineView" };
        }

        return "Show " + (showTarget.ID ? "'" + showTarget.ID + "' " : "") + showTarget.type + " and wait for input";
    },

    editorType: "UserTaskEditor"

});

//--------------------------------------------------------------------------------------------

//> @class StateTask
// StateTask can either copy fields of +link{process.state} to other fields, or apply hardcoded
// values to +link{process.state} via +link{stateTask.value}.
// <p>
// Some examples:
// <ul>
// <li>inputField: "a", outputField: "b" - copies "a" to "b"
// <li>inputField: "a", outputField: "b", type: "integer" - copies "a" to "b" converting "a" to an integer
// <li>inputFieldList: ["a","b"], outputField: ["c","d"] - copies "a" and "b" to "c" and "d" respectively.
// </ul>
// @inheritsFrom Task
// @treeLocation Client Reference/Workflow
// @visibility workflow
//<
isc.defineClass("StateTask", "Task");

//> @type ProcessValueType
// @value "string" values that are not already strings are converted via toString()
// @value "boolean" the strings "true" and "false" become boolean true and false.  All other
//                 Strings non-empty String values are true, all numbers are true except 0, and
//                 all other non-null values are true
// @value "decimal" values are converted via toString() and parsing as a decimal number.
//                 Invalid values trigger a transition to the +link{stateTask.failureElement}
// @value "integer" values are converted via toString(), parsing as a number, and rounding to
//                 nearest integer.  Invalid values trigger a transition to the
//                 +link{stateTask.failureElement}
// @value "record" any input which is not already a Record or Map becomes null
// @value "array" generic array type - will convert value to an array of the same type as the
//               existing value
// @visibility workflow
//<
               
isc.StateTask.addProperties({
    //> @attr stateTask.value (Any : null : IR)
    // If a stateTask does not declare +link{task.inputField,inputField}, it must declare a <code>value</code>
    // which should be assigned to the output field.
    // <p>
    // See +link{stateTask.type} for how the value is interpreted.
    // @visibility workflow
    //<

    //> @attr stateTask.type (ProcessValueType : null : IR)
    // Type of the value for stateTask.outputField.
    // <p>
    // This can be used in conjunction with +link{stateTask.value} to declare the type of the
    // value, or can be used to convert the type of the +link{task.inputField,inputField} to
    // the declared type.
    // <p>
    // If no type is declared, the value from an inputField is unchanged or provided via a call
    // to setValue() is unchanged.
    // <p>
    // A value specified for <code>stateTask.value</code> via an attribute in
    // +link{group:componentXML} (see +link{Process.loadProcess()}) is treated as a boolean if
    // it is the exact string "true" or "false", treated as a "decimal" or "integer" if it
    // parsable as a valid number, otherwise treated as a String.  If these heuristics don't
    // work in your case, just declare the type explicitly via <code>stateTask.type</code>.
    // <p>
    // A value of "record" type or "array" type can be declared in Component XML using the same
    // formats allowed for +link{DataSourceField.valueMap,valueMap}.  Each array value or
    // record attribute value undergoes the same heuristics as for +link{stateTask.value}
    // declared as an attribute.
    // <p>
    // +link{stateTask.type} is invalid to use with multiple outputFields.
    // @visibility workflow
    //<

    

    //> @attr stateTask.failureElement (String : null : IR)
    // ID of the next sequence or element to proceed to if a failure condition arises, such as
    // the output data not being convertible to the target +link{type}.
    // @visibility workflow
    //<

    //> @attr stateTask.outputExpression  (String : null : IR)
    // Not applicable to a StateTask.
    // @visibility workflow
    //<

    //> @attr stateTask.passThruOutput (Boolean : false : IR)
    // @include processElement.passThruOutput
    //<
    passThruOutput: false,

    executeElement : function (process) {
        if (this.value == null && this.inputField == null && this.inputFieldList == null) {
            isc.logWarn("StateTask: value, inputField or inputFieldList should be set.");
            return true;
        }
        if (this.value == null && this.inputField == null) {
            if (this.outputFieldList == null || this.outputFieldList.length != this.inputFieldList.length) {
                isc.logWarn("StateTask: outputFieldList should have same number of parameters as inputFieldList.");    
                return;
            }
            if (this.type) {
                isc.logWarn("StateTask: type cannot be used with multiple outputFields");
            }
            for (var i = 0; i < this.inputFieldList.lenght; i++) {
                var value = process.getStateVariable(this.inputFieldList[i]);
                process.setStateVariable(this.outputFieldList[i], value);
            }
            return true;
        }
        var value = this.value || this._resolveInputField(this.inputField, process);
        value = this._executePair(value, this.type, process);
        process.setStateVariable(this.outputField, value);
        process.setTaskOutput(this.getClassName(), this.ID, value);
        return true;
    },

    _executePair : function (value, type, process) {
        if (value == null) {
            isc.logWarn("StateTask: value is null. Unable to convert to " + type);
            this.fail(process);
            return null;
        }
        if ("string" == type) {
            // @value "string" values that are not already strings are converted via toString()
            return value.toString();
        } else if ("boolean" == type) {
            // @value "boolean" the strings "true" and "false" become boolean true and false.
            //        All other Strings non-empty String values are true, all numbers are true
            //        except 0, and all other non-null values are true
            if ("true" == value) return true;
            if ("false" == value) return false;
            if (isc.isA.String(value)) return value.length != 0;
            if (isc.isA.Number(value)) return value != 0;
            return value != null;
        } else if ("decimal" == type) {
            // @value "decimal" values are converted via toString() and parsing as a decimal
            // number.
            // Invalid values trigger a transition to the +link{stateTask.failureElement}
            var v = parseFloat(value.toString());
            if (isNaN(v)) {
                this.fail(process);
                return null;
            }
            return v;
        } else if ("integer" == type) {
            // @value "integer" values are converted via toString(), parsing as a number, and
            // rounding to nearest integer.  Invalid values trigger a transition to the
            // +link{stateTask.failureElement}
            var v = parseInt(value.toString());
            if (isNaN(v)) {
                this.fail(process);
                return null;
            }
            return v;
        } else if ("record" == type) {
            // @value "record" any input which is not already a Record or Map becomes null
            if (isc.isAn.Object(value) && !isc.isAn.Array(value) &&
                    !isc.isAn.RegularExpression(value) && !isc.isAn.Date(value))
            {
                return value;
            }
            return null;
        } else if ("array" == type) {
            // @value "array" generic array type - will convert value to an array of the same
            // type as the existing value
            if (isc.isAn.Array(value)) return value;
            return [value];
        } else {
            return value;
        }
    },

    fail : function (process) {
        if (this.failureElement == null) {
            isc.logWarn("There is no failureElement in stateTask");
        } else {
            process.setNextElement(this.failureElement);                    
        }
    },

    getElementDescription : function () {
        var description = "no-op";

        if (this.value != null) {
            // set <outputField> = <value>
            description = "Set " + this.outputField + "=" + this.value;
        } else if (this.type != null) {
            // set <outputField> = <inputField> as <type> 
            description = "Set " + this.outputField + "=" + this.inputField + " as " + this.type;
        } else if (this.inputField || this.inputFieldList) {
            // copy <inputField>/<inputFieldList> to <outputField>/<outputFieldList>
            description = "Copy " + (this.inputField ? this.inputField : this.inputFieldList.join(",")) + " to " + (this.outputField ? this.outputField : this.outputFieldList.join(",")); 
        }

        return description;
    },

    editorType: "StateTaskEditor"

});

//--------------------------------------------------------------------------------------------

//> @class StartProcessTask
// Task that executes another +link{process} inside the current one. A process cannot be
// embedded within another process as a normal task element. Instead, a StartProcessTask
// is used to provide the input state, execute the inner process, then write the output
// back into the calling process state.
//
// @inheritsFrom ScriptTask
// @treeLocation Client Reference/Workflow
// @visibility workflow
//<
isc.defineClass("StartProcessTask", "ScriptTask");

isc.StartProcessTask.addProperties({
    //> @attr startProcessTask.process (Process : null : IR)
    // The +link{process} to be run by this task. Input state is created from
    // +link{inputFieldList} and container process state is updated from
    // the inner process state using +link{outputFieldList}.
    //
    // @visibility workflow
    //<

    //> @attr startProcessTask.isAsync (Boolean : true : [IRW])
    // Not applicable to StartProcessTask.
    // @visibility workflow
    //<
    isAsync: true,

    //> @method startProcessTask.execute()
    // Not applicable to StartProcessTask.
    // @visibility workflow
    //<

    execute : function (input, inputRecord) {
        if (!this.process) {
            this.logWarn("StartProcessTask with no process. Skipped");
            return;
        }
        var process = this.process,
            finished = process.finished,
            _this = this
        ;
        process.finished = function (state) {
            if (finished) finished (state);
            _this.setOutputRecord (state);
        }

        // make sure this setting is not overridden
        this.isAsync = true;
 
        process.setState(inputRecord);
        process.start();
    }
});

//--------------------------------------------------------------------------------------------

//> @class EndProcessTask
// Task that ends a workflow. This task is not necessary to end a workflow - having
// a task execute with no +link{processElement.nextElement} is sufficient to end
// the workflow.
// <p>
// This task is primarily used in the workflow editor to render a "no-op" task or as
// an explicit visual marker for the end of workflow.
//
// @inheritsFrom ProcessElement
// @treeLocation Client Reference/Workflow
// @visibility workflow
//<
isc.defineClass("EndProcessTask", "ProcessElement");

isc.EndProcessTask.addProperties({
    // render editor as an add element
    editorPlaceholder: true,

    executeElement : function (process) {
        // Nothing to do
    }
});

//--------------------------------------------------------------------------------------------

//> @type ShowMessageType
// Type of message to display in +link{ShowMessageTask}. Controls the display of the icon.
//
// @value "normal" Normal message
// @value "warning" Warning message
// @value "error" Error message
//
// @see showMessageTask.type
// @visibility workflow
//<

//> @class ShowMessageTask
// Show an informational message and wait for the user to acknowledge.
//
// @inheritsFrom ProcessElement
// @treeLocation Client Reference/Workflow
// @visibility workflow
//<
isc.defineClass("ShowMessageTask", "ProcessElement");

isc.ShowMessageTask.addProperties({
    classDescription: "Show a message in a modal dialog",
    editorType: "ShowMessageTaskEditor",

    //> @attr showMessageTask.type (ShowMessageType : "normal" : IR)
    // Message type.
    // @visibility workflow
    //<
    type: "normal",

    //> @attr showMessageTask.message (String : null : IR)
    // Message to display. To display a dynamic message see +link{textFormula}.
    // @visibility workflow
    //<

    //> @attr showMessageTask.textFormula (UserSummary : null : IR)
    // Formula to be used to calculate the message contents. Use +link{message} property
    // to assign a static message instead.
    // <p> 
    // Available fields for use in the formula are the current +link{canvas.ruleScope,rule context}.
    //
    // @visibility workflow
    //<

    executeElement : function (process) {
        process.setTaskOutput(this.getClassName(), this.ID, process.getLastTaskOutput());
        var messageType = this.type,
            callback = function () { process.start() }
        ;

        var message = this.getTextFormulaValue(this.textFormula, process) ||
                      this.getDynamicValue(this.message, process);

        if (messageType == "normal") {
            isc.say(message, callback);
        } else if (messageType == "warning") {
            isc.warn(message, callback);
        } else if (messageType == "error") {
            isc.Dialog.create({
                message: message,
                icon: isc.Dialog.getInstanceProperty("errorIcon"),
                buttons : [
                    isc.Button.create({ title:"OK" })
                ],
                buttonClick : function (button, index) {
                    callback();
                }
            });
        } else {
            // nothing to do
            return true;
        }
        // asynchronous op
        return false;
    },

    _typeDescriptionMap : {
        "normal":  "",
        "warning": "warning",
        "error":   "error"
    },

    getElementDescription : function () {
        var message = this.message || "",
            messageParts = message.split(" "),
            shortMessage = messageParts.getRange(0, 3).join(" "),
            type = this.type || "message"
        ;
        if (shortMessage.length > 25) shortMessage = shortMessage.substring(0,25);
        if (shortMessage != message) shortMessage += " ...";

        return "Show " + this._typeDescriptionMap[type] + " message:<br>" + shortMessage;
    }
});

//--------------------------------------------------------------------------------------------

//> @class AskForValueTask
// Ask the user to input a value.
//
// @inheritsFrom UserConfirmationGateway
// @treeLocation Client Reference/Workflow
// @visibility workflow
//<
isc.defineClass("AskForValueTask", "UserConfirmationGateway");

isc.AskForValueTask.addProperties({
    title: "Ask for Value",
    classDescription: "Ask the user to input a value",
    editorType: "AskForValueTaskEditor",

    //> @attr askForValueTask.defaultValue (String : null : IR)
    // Default value.
    // @visibility workflow
    //<
    
    executeElement : function (process) {
        var properties = (this.defaultValue ? { defaultValue: this.defaultValue } : null);

        var message = this.getTextFormulaValue(this.textFormula, process) ||
                      this.getDynamicValue(this.message, process);

        var task = this;
        isc.askForValue(message, function (value) {
            if (value) {
                process.setTaskOutput(task.getClassName(), task.ID, value);
                if (task.nextElement) process.setNextElement(task.nextElement);
            } else {
                if (!task.failureElement) {
                    task.logWarn("Ask For Value Task does not have a failureElement. Process is aborting.");
                    // the call to setNextElement() below will cause the process to terminate automatically
                }
                process.setNextElement(task.failureElement);
            }
            process.start();
        }, properties);

        // processing dialog asynchronously
        return false;
    },
    
    getElementDescription : function () {
        var description = "Ask user for a value";
        return description;
    }
});

//--------------------------------------------------------------------------------------------

//> @class ShowNotificationTask
// Show a message which fades out automatically using
// +link{class:Notify}.
//
// @inheritsFrom ProcessElement
// @treeLocation Client Reference/Workflow
// @visibility workflow
//<
isc.defineClass("ShowNotificationTask", "ProcessElement");

isc.ShowNotificationTask.addProperties({
    classDescription: "Show a message which fades out automatically",
    editorType: "ShowNotificationTaskEditor",

    //> @attr showNotificationTask.autoDismiss (Boolean : true : IR)
    // Auto-dismiss message after a short duration.
    // @visibility workflow
    //<
    autoDismiss: true,

    //> @attr showNotificationTask.message (String : null : IR)
    // Message to display. To display a dynamic message see +link{textFormula}.
    // @visibility workflow
    //<

    //> @attr showNotificationTask.textFormula (UserSummary : null : IR)
    // Formula to be used to calculate the message contents. Use +link{message} property
    // to assign a static message instead.
    // <p> 
    // Available fields for use in the formula are the current +link{canvas.ruleScope,rule context}.
    //
    // @visibility workflow
    //<

    //> @attr showNotificationTask.position (String : "T" : IR)
    // Where to show the message, specified as an edge ("T", "B", "R", "L") similar to
    // +link{canvas.snapTo}, or "C" for center.  The message will be shown at the center of the
    // edge specified (or the very center for "C").
    // @visibility workflow
    //<
    position: "T",

    //> @attr showNotificationTask.notifyType (NotifyType : "message" : IR)
    // NotifyType for message.
    // @visibility workflow
    //<
    notifyType: "message",

    executeElement : function (process) {
        process.setTaskOutput(this.getClassName(), this.ID, process.getLastTaskOutput());

        var notifyType = this.notifyType,
            settings = { position: this.position };
        if (!this.autoDismiss) {
            settings.duration = 0;
            settings.canDismiss = true;
        }

        var message = this.getTextFormulaValue(this.textFormula, process) ||
                      this.getDynamicValue(this.message, process);

        isc.Notify.addMessage(message, null, notifyType, settings);
        return true;
    },
    
    _notifyTypeDescriptionMap : {
        "message": "",
        "warn":    "warning",
        "error":   "error"
    },

    getElementDescription : function () {
        var message = this.message || "",
            messageParts = message.split(" "),
            shortMessage = messageParts.getRange(0, 3).join(" "),
            notifyType = this.notifyType || "message"
        ;
        if (shortMessage.length > 25) shortMessage = shortMessage.substring(0,25);
        if (shortMessage != message) shortMessage += " ...";

        return "Show " + this._notifyTypeDescriptionMap[notifyType] + " notification:<br>" +
            shortMessage;
    }
});

//--------------------------------------------------------------------------------------------

//> @class StartTransactionTask
// Starts queuing all DataSource operations so they can be sent to the server all together
// as a transaction.
//
// @inheritsFrom ProcessElement
// @treeLocation Client Reference/Workflow
// @visibility workflow
//<
isc.defineClass("StartTransactionTask", "ProcessElement");

isc.StartTransactionTask.addProperties({
    classDescription: "Starts queuing all DataSource operations so they can be sent " +
        "to the server all together as a transaction",
    editorType: null,

    executeElement : function (process) {
        process.setTaskOutput(this.getClassName(), this.ID, process.getLastTaskOutput());

        isc.RPC.startQueue();

        return true;
    },
    
    getElementDescription : function () {
        return "Start queuing";
    }
});

//--------------------------------------------------------------------------------------------

//> @class SendTransactionTask
// Sends any currently queued DataSource operations, as a single transactional request to the server.
//
// @inheritsFrom ProcessElement
// @treeLocation Client Reference/Workflow
// @visibility workflow
//<
isc.defineClass("SendTransactionTask", "ProcessElement");

isc.SendTransactionTask.addProperties({
    classDescription: "Sends any currently queued DataSource operations " +
        "as a single transactional request to the server",
    editorType: null,

    executeElement : function (process) {
        process.setTaskOutput(this.getClassName(), this.ID, process.getLastTaskOutput());

        isc.RPC.sendQueue();

        return true;
    },
    
    getElementDescription : function () {
        return "Send queue";
    }
});

//--------------------------------------------------------------------------------------------

//> @class ComponentTask
// Base class for tasks that target <smartclient>SmartClient</smartclient><smartgwt>SmartGWT</smartgwt>
// UI-specific operations.
// <P>
// Note: This task is not for direct use - use one of the subclasses instead.
//
// @inheritsFrom ProcessElement
// @treeLocation Client Reference/Workflow
// @visibility workflow
//<
isc.defineClass("ComponentTask", "ProcessElement");

isc.ComponentTask.addClassProperties({

    isApplicableComponent : function (component) {
        var clazz = (component.getClass ? component.getClass() : null);
        if (!clazz) return false;

        var baseClasses = this.getInstanceProperty("componentBaseClass"),
            requiresDataSource = this.getInstanceProperty("componentRequiresDataSource") || false
        ;
        baseClasses = (isc.isAn.Array(baseClasses) ? baseClasses : [baseClasses]);

        for (var i = 0; i < baseClasses.length; i++) {
            if (clazz.isA(baseClasses[i]) && (!requiresDataSource || component.dataSource)) {
                return true;
            }
        }
        return false;
    }
});

isc.ComponentTask.addProperties({
    //> @attr componentTask.componentId (GlobalId : null : IR)
    // ID of component.
    //
    // @visibility workflow
    //<

    //> @attr componentTask.componentBaseClass (String | Array of String : "DataBoundComponent" : IR)
    // Base class of components that this task targets. 
    //
    // @visibility workflow
    //<

    //> @attr componentTask.componentRequiresDataSource (boolean : null : IR)
    // Must target components of this task have a DataSource? 
    //
    // @visibility workflow
    //<

    getComponentBaseClasses : function () {
        return (isc.isAn.Array(this.componentBaseClass) ? this.componentBaseClass : [this.componentBaseClass]);
    },
    
    getTargetComponent : function (process) {
        if (!this.componentId) {
            this.logWarn("ComponentTask with no componentId. Task skipped");
            return null;
        }

        // Support providing an actual component instead of an ID
        if (isc.isA.Class(this.componentId)) return this.componentId;

        var component = window[this.componentId];
        if (!component) {
            
            if (process && process.screenComponent) {
                component = process.screenComponent.getByLocalId(this.componentId);
            }
            if (!component) {
                this.logWarn("Component not found for ID " + this.componentId + " not found. Task skipped");
                return null;
            }
        }

        var baseClasses = this.getComponentBaseClasses();
        for (var i = 0; i < baseClasses.length; i++) {
            if (component.isA(baseClasses[i])) return component;
        }
        this.logWarn("Component type '" + component.getClassName() + "' is not supported for " + this.getClassName() + ". Task skipped");
        return null;
    },
    
    getLocalComponent : function (process, componentId) {
        if (!componentId) return null;

        // Support providing an actual component instead of an ID
        if (isc.isA.Class(componentId)) return componentId;

        var component = window[componentId];
        if (!component) {
            
            if (process && process.screenComponent) {
                component = process.screenComponent.getByLocalId(componentId);
            }
            if (!component) return null;
        }
        return component;
    },

    updateGlobalIDReferences : function (oldId, newId) {
        var changed = this.Super("updateGlobalIDReferences", arguments);

        if (this.componentId && this.componentId == oldId) {
            this.componentId = newId;
            changed = true;
        }
        return changed;
    }
});

//> @class SetLabelTextTask
// Sets the text of a label.
//
// @see label.setContents
// @inheritsFrom ComponentTask
// @treeLocation Client Reference/Workflow
// @visibility workflow
//<
isc.defineClass("SetLabelTextTask", "ComponentTask");

isc.SetLabelTextTask.addProperties({
    componentBaseClass: "Label",

    classDescription: "Sets the text of a label",
    editorType: "SetLabelTextTaskEditor",

    //> @attr setLabelTextTask.value (HTMLString : null : IR)
    // Value to assign to label text contents. To assign a dynamic value see +link{textFormula}.
    //
    // @visibility workflow
    //<

    //> @attr setLabelTextTask.textFormula (UserSummary : null : IR)
    // Formula to be used to calculate the label text contents. Use +link{value} property
    // to assign a static value instead.
    // <p> 
    // Available fields for use in the formula are the current +link{canvas.ruleScope,rule context}.
    //
    // @visibility workflow
    //<

    executeElement : function (process) {
        process.setTaskOutput(this.getClassName(), this.ID, process.getLastTaskOutput());

        var label = this.getTargetComponent(process);
        if (!label) return true;

        var value = this.getTextFormulaValue(this.textFormula, process) ||
                    this.getDynamicValue(this.value, process);

        label.setContents(value);
        return true;
    },

    getElementDescription : function () {
        var description = "Set '" + this.componentId + "' text";

        return description;
    }
});

//> @class SetButtonTitleTask
// Sets the title of a button or window.
//
// @see button.setTitle
// @inheritsFrom ComponentTask
// @treeLocation Client Reference/Workflow
// @visibility workflow
//<
isc.defineClass("SetButtonTitleTask", "ComponentTask");

isc.SetButtonTitleTask.addProperties({
    componentBaseClass: [ "Button", "Window" ],

    classDescription: "Sets the title of a button or window",
    editorType: "SetButtonTitleTaskEditor",

    //> @attr setButtonTitleTask.title (HTMLString : null : IR)
    // Title to assign to button. To assign a dynamic value see +link{textFormula}.
    //
    // @visibility workflow
    //<

    //> @attr setButtonTitleTask.textFormula (UserSummary : null : IR)
    // Formula to be used to calculate the button title contents. Use +link{title} property
    // to assign a static value instead.
    // <p> 
    // Available fields for use in the formula are the current +link{canvas.ruleScope,rule context}.
    //
    // @visibility workflow
    //<

    executeElement : function (process) {
        process.setTaskOutput(this.getClassName(), this.ID, process.getLastTaskOutput());

        var button = this.getTargetComponent(process);
        if (!button) return true;

        var title = this.getTextFormulaValue(this.textFormula, process) ||
                    this.getDynamicValue(this.title, process);

        button.setTitle(title);
        return true;
    },
    
    getElementDescription : function () {
        var description = "Set '" + this.componentId + "' title";

        return description;
    }
});

//> @class ShowComponentTask
// Show a currently hidden component.
//
// @see canvas.show
// @inheritsFrom ComponentTask
// @treeLocation Client Reference/Workflow
// @visibility workflow
//<
isc.defineClass("ShowComponentTask", "ComponentTask");

isc.ShowComponentTask.addProperties({
    componentBaseClass: "Canvas",

    title: "Show",
    classDescription: "Show a currently hidden component",
    editorType: "ShowComponentTaskEditor",

    executeElement : function (process) {
        process.setTaskOutput(this.getClassName(), this.ID, process.getLastTaskOutput());

        var canvas = this.getTargetComponent(process);
        if (!canvas) return true;

        canvas.show();
        return true;
    },
    
    getElementDescription : function () {
        return "Show " + this.componentId;
    }
});

//> @class HideComponentTask
// Hide a component.
//
// @see canvas.hide
// @inheritsFrom ComponentTask
// @treeLocation Client Reference/Workflow
// @visibility workflow
//<
isc.defineClass("HideComponentTask", "ComponentTask");

isc.HideComponentTask.addProperties({
    componentBaseClass: "Canvas",

    title: "Hide",
    classDescription: "Hide a component",
    editorType: "HideComponentTaskEditor",

    executeElement : function (process) {
        process.setTaskOutput(this.getClassName(), this.ID, process.getLastTaskOutput());

        var canvas = this.getTargetComponent(process);
        if (!canvas) return true;

        canvas.hide();
        return true;
    },
    
    getElementDescription : function () {
        return "Hide " + this.componentId;
    }
});

//> @class FormSetValuesTask
// Set form values.
//
// @see dynamicForm.setValues
// @inheritsFrom ComponentTask
// @treeLocation Client Reference/Workflow
// @visibility workflow
//<
isc.defineClass("FormSetValuesTask", "ComponentTask");

isc.FormSetValuesTask.addProperties({
    componentBaseClass: [ "DynamicForm", "ValuesManager" ],
    componentRequiresDataSource: true,

    classDescription: "Set form values",
    editorType: "FormSetValuesTaskEditor",

    //> @attr formSetValuesTask.values (Record : null : IR)
    // Values to be set on the form.
    // <P>
    // Data values prefixed with "$" will be treated as a
    // +link{group:taskInputExpression}.  Use +link{fixedValues} for any values that start with
    // "$" but should be treated as a literal.
    // @visibility workflow
    //<

    //> @attr formSetValuesTask.fixedValues (Record : null : IR)
    // Values to be combined with the data from the +link{serviceTask.values} if specified,
    // via simple copying of fields, with explicitly specified +link{serviceTask.values}
    // overriding <code>fixedValues</code>.
    // @visibility workflow
    //<

    executeElement : function (process) {
        process.setTaskOutput(this.getClassName(), this.ID, process.getLastTaskOutput());

        this.process = process;
        var form = this.getTargetComponent(process);
        if (!form) return true;

        var data = null;
        if (this.values) {
            // Resolve any dynamicCriteria or taskInputExpressions. Returns a copy of criteria.
            data = this._resolveObjectDynamicExpressions(this.values, null, null, process);
        }
        if (this.fixedValues) {
            for (var key in this.fixedValues) {
                data[key] = this.fixedValues[key];
            }
        }

        form.setValues(data);
        return true;
    },

    getElementDescription : function () {
        return "Set '" + this.componentId + "' values";
    },

    getOutputSchema : function () {
        var form = this.getTargetComponent(this.process);
        if (!form) return null;

        return form.getDataSource();
    },

    updateLastElementBindingReferences : function (taskType) {
        var changed = this.Super("updateLastElementBindingReferences", arguments);
        changed = this._updateLastElementInValues(this.values, taskType) || changed;
        return changed;
    },

    updateGlobalIDReferences : function (oldId, newId) {
        var changed = this.Super("updateGlobalIDReferences", arguments);
        changed = this._updateGlobalIDInValues(this.values, oldId, newId) || changed;
        return changed;
    }
});

//> @class FormSetFieldValueTask
// Put a value in just one field of a form.
//
// @see dynamicForm.setValue
// @inheritsFrom ComponentTask
// @treeLocation Client Reference/Workflow
// @visibility workflow
//<
isc.defineClass("FormSetFieldValueTask", "ComponentTask");

isc.FormSetFieldValueTask.addProperties({
    componentBaseClass: [ "DynamicForm", "ValuesManager" ],
    componentRequiresDataSource: true,

    classDescription: "Put a value into just one field of a form",
    editorType: "FormSetFieldValueTaskEditor",

    //> @attr formSetFieldValueTask.targetField (FieldName : null : IR)
    // Field to assign new value.
    //
    // @visibility workflow
    //<

    //> @attr formSetFieldValueTask.value (Any : null : IR)
    // Value to assign to +link{targetField}.
    //
    // @visibility workflow
    //<

    executeElement : function (process) {
        process.setTaskOutput(this.getClassName(), this.ID, process.getLastTaskOutput());

        var form = this.getTargetComponent(process);
        if (!form) return true;

        var value = this.value;
        if (value) {
            // Resolve any dynamicCriteria or taskInputExpressions
            var values = this._resolveObjectDynamicExpressions({ value: value }, null, null, process);
            value = values.value;
        }

        form.setValue(this.targetField, value);
        return true;
    },
    
    getElementDescription : function () {
        return "Set '" + this.componentId + "." + this.targetField + "' value";
    },

    updateLastElementBindingReferences : function (taskType) {
        var changed = this.Super("updateLastElementBindingReferences", arguments);
        changed = this._updateLastElementInValueProperty("value", taskType) || changed;
        return changed;
    },

    updateGlobalIDReferences : function (oldId, newId) {
        var changed = this.Super("updateGlobalIDReferences", arguments);
        changed = this._updateGlobalIDInValueProperty("value", oldId, newId) || changed;
        return changed;
    }
});

//> @class FormClearValuesTask
// Clear form values and errors.
//
// @see dynamicForm.clearValues
// @inheritsFrom ComponentTask
// @treeLocation Client Reference/Workflow
// @visibility workflow
//<
isc.defineClass("FormClearValuesTask", "ComponentTask");

isc.FormClearValuesTask.addProperties({
    componentBaseClass: [ "DynamicForm", "ValuesManager" ],

    classDescription: "Clear form values and errors",
    editorType: "FormClearValuesTaskEditor",

    executeElement : function (process) {
        process.setTaskOutput(this.getClassName(), this.ID, process.getLastTaskOutput());

        var form = this.getTargetComponent(process);
        if (!form) return true;

        form.clearValues();
        return true;
    },
    
    getElementDescription : function () {
        return "Clear '" + this.componentId + "' values";
    }
});

//> @class FormResetValuesTask
// Revert unsaved changes in a form.
//
// @see dynamicForm.reset
// @inheritsFrom ComponentTask
// @treeLocation Client Reference/Workflow
// @visibility workflow
//<
isc.defineClass("FormResetValuesTask", "ComponentTask");

isc.FormResetValuesTask.addProperties({
    componentBaseClass: [ "DynamicForm", "ValuesManager" ],

    classDescription: "Reset values in a form to defaults",
    editorType: "FormResetValuesTaskEditor",

    executeElement : function (process) {
        process.setTaskOutput(this.getClassName(), this.ID, process.getLastTaskOutput());

        var form = this.getTargetComponent(process);
        if (!form) return true;

        form.resetValues();
        return true;
    },
    
    getElementDescription : function () {
        return "Reset '" + this.componentId + "' values";
    }
});

//> @class FormValidateValuesTask
// Validate a form and show errors to user.
//
// @see dynamicForm.validate
// @inheritsFrom ComponentTask
// @treeLocation Client Reference/Workflow
// @visibility workflow
//<
isc.defineClass("FormValidateValuesTask", "ComponentTask");

isc.FormValidateValuesTask.addProperties({
    componentBaseClass: [ "DynamicForm", "ValuesManager" ],

    classDescription: "Validate a form and show errors to user",
    editorType: "FormValidateValuesTaskEditor",

    //> @attr formValidateValuesTask.passThruOutput (Boolean : false : IR)
    // @include processElement.passThruOutput
    //<
    passThruOutput: false,

    executeElement : function (process) {
        var form = this.getTargetComponent(process);
        if (!form) return true;

        var formDS = form.getDataSource(),
            validClientData
        ;
        if (formDS) {
            // No callback is performed if validClientData=false
            var task = this;
            validClientData = form.validateData(function (response) {
                process.setTaskOutput(task.getClassName(), task.ID, task.createOutput(response));
                process.start();
            });
        } else {
            validClientData = form.validate();
        }
        // If validation failed on the client or there is no server request pending,
        // create the task output now.
        if (validClientData == false || !formDS) {
            // Create a mockup response so createOutput() can be used for client validation too
            var response = {
                status: (validClientData == false
                         ? isc.RPCResponse.STATUS_VALIDATION_ERROR
                         : isc.RPCResponse.STATUS_SUCCESS),
                errors: form.getErrors()
            };
            process.setTaskOutput(this.getClassName(), this.ID, this.createOutput(response));
        } else {
            // output will be set when server response is processed
        }
        return (validClientData == false);
    },

    createOutput : function (response) {
        var output = { valuesValid: true };
        if (response.status == isc.RPCResponse.STATUS_VALIDATION_ERROR) {
            output.valuesValid = false;
            output.errors = isc.DS.getSimpleErrors(response);
        }
        return output;
    },

    getOutputSchema : function () {
        if (!this._outputSchema) {
            var form = this.getTargetComponent(this.process);
            if (form) {
                var fields = [
                    { name: "_meta_valuesValid", title: "[meta] valuesValid", type: "boolean", criteriaPath: "valuesValid" }
                ];
                var formDS = form.getDataSource();
                if (formDS) {
                    var fieldNames = formDS.getFieldNames();
                    for (var i = 0; i < fieldNames.length; i++) {
                        var fieldName = fieldNames[i],
                            field = { name: fieldName, type: "text", multiple: true }
                        ;
                        fields.add(field);
                    }
                }
                this._outputSchema = isc.DS.create({
                    addGlobalId: false,
                    clientOnly: true,
                    criteriaBasePath: "errors",
                    fields: fields
                });
            }
        }
        return this._outputSchema;
    },

    destroy : function () {
        if (this._outputSchema) this._outputSchema.destroy();
        this.Super("destroy", arguments);
    },

    getElementDescription : function () {
        return "Validate '" + this.componentId + "' values";
    }
});

//> @class FormSaveDataTask
// Saves changes made in a form (validates first).
//
// @see dynamicForm.saveData
// @inheritsFrom ComponentTask
// @treeLocation Client Reference/Workflow
// @visibility workflow
//<
isc.defineClass("FormSaveDataTask", "ComponentTask");

isc.FormSaveDataTask.addProperties({
    componentBaseClass: [ "DynamicForm", "ValuesManager" ],

    classDescription: "Save changes made in a form (validates first)",
    editorType: "FormSaveDataTaskEditor",

    //> @attr formSaveDataTask.failureElement (String : null : IR)
    // ID of the next sequence or element to proceed to if a failure condition arises
    // from operation.
    // @visibility workflow
    //<

    //> @attr formSaveDataTask.requestProperties (DSRequest : null : IR)
    // Additional properties to set on the DSRequest that will be issued
    // to perform save.
    //
    // @visibility workflow
    //<

    //> @attr formSaveDataTask.passThruOutput (Boolean : false : IR)
    // @include processElement.passThruOutput
    //<
    passThruOutput: false,

    executeElement : function (process) {
        var form = this.getTargetComponent(process);
        if (!form) return true;

        var params = isc.addProperties({}, this.requestProperties, { willHandleError: true });

        var task = this;
        form.saveData(function (dsResponse, data, request) {
            dsResponse = dsResponse || {};
            var results = dsResponse.results;
            if (dsResponse.isStructured && 
                (!results || results.status < 0 || (results.status == null && dsResponse.status < 0))) 
            {
                if (!isc.RPC.runDefaultErrorHandling(dsResponse, request, task.errorFormatter)) {
                    process.setTaskOutput(task.getClassName(), task.ID, task.createFailureOutput(dsResponse));
                    task.fail(process);
                    return;
                }
            } else {
                process.setTaskOutput(task.getClassName(), task.ID, dsResponse.data);
            }
            process.start();
        }, params);
        return false;
    },

    fail : function (process) {
        if (!this.failureElement) {
            this.logWarn("FormSaveDataTask does not have a failureElement. Process is aborting.");
            // the call to setNextElement() below will cause the process to terminate automatically
        }
        process.setNextElement(this.failureElement);
    },

    // "this" is not available
    errorFormatter : function (codeName, response, request) {
        if (codeName == "VALIDATION_ERROR") {
            var errors = response.errors,
                message = ["Server returned validation errors:<BR><UL>"]
            ;
            if (!isc.isAn.Array(errors)) errors = [errors];
            for (var i = 0; i < errors.length; i++) {
                var error = errors[i];
                for (var field in error) {
                    var fieldErrors = error[field];
                    message.add("<LI><B>" + field + ":</B> ");
                    if (!isc.isAn.Array(fieldErrors)) fieldErrors = [fieldErrors];
                    for (var j = 0; j < fieldErrors.length; j++) {
                        var fieldError = fieldErrors[j];
                        message.add((j > 0 ? "<BR>" : "") + (isc.isAn.Object(fieldError) ? fieldError.errorMessage : fieldError));
                    }
                    message.add("</LI>");
                }
            }
            message.add("</UL>");
            return message.join("");
        }
        return null;
    },

    createFailureOutput : function (response) {
        var output = { valuesValid: true };
        if (response.status == isc.RPCResponse.STATUS_VALIDATION_ERROR) {
            output.valuesValid = false;

            var form = this.getTargetComponent(this.process);
            if (form) {
                output.errors = isc.DS.getSimpleErrors(response);
            }
        }
        return output;
    },

    getOutputSchema : function () {
        var form = this.getTargetComponent(this.process);
        if (!form) return null;

        return form.getDataSource();
    },

    getFailureSchema : function () {
        if (!this._failureSchema) {
            var form = this.getTargetComponent(this.process);
            if (form) {
                var fields = [
                    { name: "_meta_valuesValid", title: "[meta] valuesValid", type: "boolean", criteriaPath: "valuesValid" }
                ];
                var formDS = form.getDataSource();
                if (formDS) {
                    var fieldNames = formDS.getFieldNames();
                    for (var i = 0; i < fieldNames.length; i++) {
                        var fieldName = fieldNames[i],
                            field = { name: fieldName, type: "text", multiple: true }
                        ;
                        fields.add(field);
                    }
                }
                this._failureSchema = isc.DS.create({
                    addGlobalId: false,
                    clientOnly: true,
                    criteriaBasePath: "errors",
                    fields: fields
                });
            }
        }
        return this._failureSchema;
    },

    destroy : function () {
        if (this._failureSchema) this._failureSchema.destroy();
        this.Super("destroy", arguments);
    },

    getElementDescription : function () {
        return "Save '" + this.componentId + "' data";
    }
});

//> @class FormEditNewRecordTask
// Start editing a new record.
//
// @see dynamicForm.editNewRecord
// @inheritsFrom ComponentTask
// @treeLocation Client Reference/Workflow
// @visibility workflow
//<
isc.defineClass("FormEditNewRecordTask", "ComponentTask");

isc.FormEditNewRecordTask.addClassMethods({
    _paramProperties: [ "record" ],
    createInitPropertiesFromAction : function (action, sourceMethod) {
        // Method parameter names don't match method argument names
        // so just use the action mappings and associate them with
        // the correct task properties
        var properties = {},
            mappings = action.mapping || []
        ;
        for (var i = 0; i < mappings.length; i++) {
            var mapping = mappings[i];
            if (mapping == "null") mapping = null;
            // "mark" property name with leading "^" (caret) so it will be replaced
            // with the actual property value upon evaluation
            if (mapping != null) properties[this._paramProperties[i]] = "^" + mapping;
        }
        return properties;
    }
})

isc.FormEditNewRecordTask.addProperties({
    componentBaseClass: [ "DynamicForm", "ValuesManager" ],

    classDescription: "Start editing a new record",
    editorType: "FormEditNewRecordTaskEditor",

    //> @attr formEditNewRecordTask.initialValues (Record : null : IR)
    // Initial values for new edit record.
    // <p>
    // Data values prefixed with "$" will be treated as a +link{group:taskInputExpression}
    // excluding "$input" and "$inputRecord" references.
    //
    // @visibility workflow
    //<

    executeElement : function (process) {
        process.setTaskOutput(this.getClassName(), this.ID, process.getLastTaskOutput());

        var form = this.getTargetComponent(process);
        if (!form) return true;

        var values;
        if (this.initialValues) {
            // Resolve any dynamicCriteria or taskInputExpressions. Returns a copy of criteria.
            values = this._resolveObjectDynamicExpressions(this.initialValues, null, null, process);
        }

        form.editNewRecord(values);
        return true;
    },
    
    getElementDescription : function () {
        return "Edit '" + this.componentId + "' new record";
    },

    updateLastElementBindingReferences : function (taskType) {
        var changed = this.Super("updateLastElementBindingReferences", arguments);
        changed = this._updateLastElementInValues(this.initialValues, taskType) || changed;
        return changed;
    },

    updateGlobalIDReferences : function (oldId, newId) {
        var changed = this.Super("updateGlobalIDReferences", arguments);
        changed = this._updateGlobalIDInValues(this.initialValues, oldId, newId) || changed;
        return changed;
    }
});

//> @class FormEditRecordTask
// Edit a record currently showing in some other component. The source
// record is obtained as follows:
// <ul>
// <li> for a ListGrid: the first selected record or, if none is selected, the first record
// <li> for a DynamicForm: the form values
// <li> for a DetailViewer: the first record
// </ul>
//
// @see dynamicForm.editRecord
// @inheritsFrom FormEditNewRecordTask
// @treeLocation Client Reference/Workflow
// @visibility workflow
//<
isc.defineClass("FormEditRecordTask", "FormEditNewRecordTask");

isc.FormEditRecordTask.addClassMethods({
    _paramProperties: [ "recordSourceComponent" ],
    createInitPropertiesFromAction : function (action, sourceMethod) {
        // Method parameter names don't match method argument names
        // so just use the action mappings and associate them with
        // the correct task properties
        var properties = {},
            mappings = action.mapping || []
        ;
        for (var i = 0; i < mappings.length; i++) {
            var mapping = mappings[i];
            if (mapping == "null") mapping = null;
            // "mark" property name with leading "^" (caret) so it will be replaced
            // with the actual property value upon evaluation
            if (mapping != null) properties[this._paramProperties[i]] = "^" + mapping;
        }
        return properties;
    }
})

isc.FormEditRecordTask.addProperties({
    componentBaseClass: [ "DynamicForm", "ValuesManager" ],
    componentRequiresDataSource: true,

    editorType: "FormEditRecordTaskEditor",

    //> @attr FormEditRecordTask.recordSourceComponent (GlobalId : null : IR)
    // Component to pull record for editing.
    //
    // @visibility workflow
    //<

    executeElement : function (process) {
        process.setTaskOutput(this.getClassName(), this.ID, process.getLastTaskOutput());

        var form = this.getTargetComponent(process);
        if (!form) return true;

        var recordSourceComponentId = this.recordSourceComponent;
        if (!recordSourceComponentId) {
            this.logWarn("recordSourceComponent not specified on task. Task skipped.");
            return true;
        }
        var recordSourceComponent = this.getLocalComponent(process, recordSourceComponentId);
        if (!recordSourceComponent) {
            this.logWarn("recordSourceComponent '" + recordSourceComponentId + "' not found. Task skipped.");
            return true;
        }

        var values = this.initialValues;
        if (isc.isA.ListGrid(recordSourceComponent) && recordSourceComponent.anySelected()) {
            values = recordSourceComponent.getSelectedRecord();
        } else if (isc.isA.DynamicForm(recordSourceComponent)) {
            values = recordSourceComponent.getValues();
        } else if (isc.isA.ListGrid(recordSourceComponent)) {
            values = recordSourceComponent.getRecord(0);
        } else if (isc.isA.DetailViewer(recordSourceComponent)) {
            values = recordSourceComponent.data[0];
        }

        form.editRecord(values);
        return true;
    },
    
    getElementDescription : function () {
        return "Edit '" + this.componentId + "' from other record";
    },

    updateGlobalIDReferences : function (oldId, newId) {
        var changed = this.Super("updateGlobalIDReferences", arguments);

        if (this.recordSourceComponent && this.recordSourceComponent == oldId) {
            this.recordSourceComponent = newId;
            changed = true;
        }
        return changed;
    }
});

//> @class FormEditSelectedTask
// Edit a record currently selected in some other component. If nothing is selected
// a new record is edited.
//
// @see dynamicForm.editRecord
// @inheritsFrom ComponentTask
// @treeLocation Client Reference/Workflow
// @visibility workflow
//<
isc.defineClass("FormEditSelectedTask", "ComponentTask");

isc.FormEditSelectedTask.addClassMethods({
    _paramProperties: [ "selectionComponentId" ],
    createInitPropertiesFromAction : function (action, sourceMethod) {
        // Method parameter names don't match method argument names
        // so just use the action mappings and associate them with
        // the correct task properties
        var properties = {},
            mappings = action.mapping || []
        ;
        for (var i = 0; i < mappings.length; i++) {
            var mapping = mappings[i];
            if (mapping == "null") mapping = null;
            // "mark" property name with leading "^" (caret) so it will be replaced
            // with the actual property value upon evaluation
            if (mapping != null) properties[this._paramProperties[i]] = "^" + mapping;
        }
        return properties;
    }
})

isc.FormEditSelectedTask.addProperties({
    componentBaseClass: [ "DynamicForm", "ValuesManager" ],
    componentRequiresDataSource: true,

    title: "Edit Selected Record",
    classDescription: "Edit a record currently showing in some other component",
    editorType: "FormEditSelectedTaskEditor",

    //> @attr formEditSelectedTask.selectionComponentId (GlobalId : null : IR)
    // Component to pull record for editing.
    //
    // @visibility workflow
    //<

    executeElement : function (process) {
        process.setTaskOutput(this.getClassName(), this.ID, process.getLastTaskOutput());

        var form = this.getTargetComponent(process);
        if (!form) return true;

        var selectionComponentId = this.selectionComponentId;
        if (!selectionComponentId) {
            this.logWarn("selectionComponentId not specified on task. Task skipped.");
            return true;
        }
        var selectionComponent = this.getLocalComponent(process, selectionComponentId);
        if (!selectionComponent) {
            this.logWarn("selectionComponent '" + selectionComponentId + "' not found. Task skipped.");
            return true;
        }

        
        var values = null;
        if (selectionComponent.getSelectedRecord) {
            values = selectionComponent.getSelectedRecord();
        }

        form.editRecord(values);
        return true;
    },
    
    getElementDescription : function () {
        return "Edit '" + this.componentId + "' from selected record";
    },

    updateGlobalIDReferences : function (oldId, newId) {
        var changed = this.Super("updateGlobalIDReferences", arguments);

        if (this.selectionComponentId && this.selectionComponentId == oldId) {
            this.selectionComponentId = newId;
            changed = true;
        }
        return changed;
    }
});

//> @class FormHideFieldTask
// Hide or show a form field.
//
// @see formItem.show
// @see formItem.hide
// @inheritsFrom ComponentTask
// @treeLocation Client Reference/Workflow
// @visibility workflow
//<
isc.defineClass("FormHideFieldTask", "ComponentTask");

isc.FormHideFieldTask.addProperties({
    componentBaseClass: "DynamicForm",

    title: "Show / Hide Field",
    classDescription: "Show or hide a field of a form",
    editorType: "FormHideFieldTaskEditor",

    //> @attr formHideFieldTask.targetField (FieldName : null : IR)
    // Field to show/hide.
    //
    // @visibility workflow
    //<

    //> @attr formHideFieldTask.hide (Boolean : null : IR)
    // Should the target form item be hidden?
    //
    // @visibility workflow
    //<

    executeElement : function (process) {
        process.setTaskOutput(this.getClassName(), this.ID, process.getLastTaskOutput());

        var form = this.getTargetComponent(process);
        if (!form) return true;

        var targetField = this.targetField;
        if (!targetField) {
            this.logWarn("targetField not specified on task. Task skipped.");
            return true;
        }

        var hide = this.hide;
        if (isc.isA.String(hide)) hide = (hide == "true");

        if (hide) form.hideItem(targetField);
        else form.showItem(targetField);

        return true;
    },
    
    getElementDescription : function () {
        var hide = this.hide;
        if (isc.isA.String(hide)) hide = (hide == "true");
        var action = (hide ? "Hide" : "Show"); 
        return action + " '" + this.componentId + "." + this.targetField + "'";
    }
});

//> @class FormDisableFieldTask
// Disable or enable a form field.
//
// @see formItem.setDisabled
// @inheritsFrom ComponentTask
// @treeLocation Client Reference/Workflow
// @visibility workflow
//<
isc.defineClass("FormDisableFieldTask", "ComponentTask");

isc.FormDisableFieldTask.addProperties({
    componentBaseClass: "DynamicForm",

    title: "Enable / Disable Field",
    classDescription: "Enable or disable a field of a form",
    editorType: "FormDisableFieldTaskEditor",

    //> @attr formDisableFieldTask.targetField (FieldName : null : IR)
    // Field to show/hide.
    //
    // @visibility workflow
    //<

    //> @attr formDisableFieldTask.disable (Boolean : null : IR)
    // Should the target form item be disabled?
    //
    // @visibility workflow
    //<

    executeElement : function (process) {
        process.setTaskOutput(this.getClassName(), this.ID, process.getLastTaskOutput());

        var form = this.getTargetComponent(process);
        if (!form) return true;

        var targetField = this.targetField;
        if (!targetField) {
            this.logWarn("targetField not specified on task. Task skipped.");
            return true;
        }

        var disable = this.disable;
        if (isc.isA.String(disable)) disable = (disable == "true");

        var field = form.getField(targetField);
        if (field) {
            field.setDisabled(disable);
        }

        return true;
    },

    getElementDescription : function () {
        var disable = this.disable;
        if (isc.isA.String(disable)) disable = (disable == "true");
        var action = (disable ? "Disable" : "Enable"); 
        return action + " '" + this.componentId + "." + this.targetField + "'";
    }
});

//> @class GridFetchDataTask
// Fetch data matching specified criteria into grid.
//
// @see listGrid.fetchData
// @inheritsFrom ComponentTask
// @treeLocation Client Reference/Workflow
// @visibility workflow
//<
isc.defineClass("GridFetchDataTask", "ComponentTask");

isc.GridFetchDataTask.addProperties({
    componentBaseClass: ["ListGrid", "TileGrid", "DetailViewer"],
    componentRequiresDataSource: true,

    classDescription: "Cause a grid to fetch data matching specified criteria",
    editorType: "GridFetchDataTaskEditor",

    //> @attr gridFetchDataTask.criteria (Criteria : null : IR)
    // Criteria to use for fetch.
    //
    // @visibility workflow
    //<

    //> @attr gridFetchDataTask.requestProperties (DSRequest : null : IR)
    // Additional properties to set on the DSRequest that will be issued
    // to perform the fetch.
    //
    // @visibility workflow
    //<

    executeElement : function (process) {
        var grid = this.getTargetComponent(process);
        if (!grid) return true;

        var task = this,
            criteria = this._resolveCriteriaExpressions(this.criteria, process.state, process.state, process)
        ;
        grid.fetchData(criteria, function (dsResponse) {
            var firstRecord = (dsResponse.data && dsResponse.data.length > 0 ? dsResponse.data[0] : null);
            process.setTaskOutput(task.getClassName(), task.ID, firstRecord);

            process.start();
        }, this.requestProperties);
        return false;
    },

    getOutputSchema : function () {
        var grid = this.getTargetComponent(this.process);
        if (!grid) return null;
        var ds = grid.dataSource;
        if (ds && (ds.getClassName == null || ds.getClassName() != "DataSource")) {
            ds = isc.DataSource.get(ds);
        }
        return ds;
    },

    getElementDescription : function () {
        var criteria = this.criteria,
            description = "Fetch " + (!criteria ? "all " : "") + "data on '" + this.componentId + "'"
        ;

        if (criteria) {
            if (!isc.DS.isAdvancedCriteria(criteria)) {
                criteria = isc.DS.convertCriteria(criteria);
            }
            var dsFields = isc.XORGateway._processFieldsRecursively(criteria);
            // construct datasource for fields used in criteria
            var fieldsDS = isc.DataSource.create({
                addGlobalId: false,
                fields: dsFields
            });

            description += " where <ul>" + isc.DataSource.getAdvancedCriteriaDescription(criteria, fieldsDS, null, {prefix: "<li>", suffix: "</li>"}) + "</ul>";
            fieldsDS.destroy();
        }

        return description;
    },

    updateLastElementBindingReferences : function (taskType) {
        var changed = this.Super("updateLastElementBindingReferences", arguments);
        changed = this._updateLastElementInCriteria(this.criteria, taskType) || changed;
        return changed;
    },

    updateGlobalIDReferences : function (oldId, newId) {
        var changed = this.Super("updateGlobalIDReferences", arguments);
        changed = this._updateGlobalIDInCriteria(this.criteria, oldId, newId) || changed;
        return changed;
    }
});

//> @class GridFetchRelatedDataTask
// Fetch data related to a record in another grid.
//
// @see listGrid.fetchRelatedData
// @inheritsFrom ComponentTask
// @treeLocation Client Reference/Workflow
// @visibility workflow
//<
isc.defineClass("GridFetchRelatedDataTask", "ComponentTask");

isc.GridFetchRelatedDataTask.addClassMethods({
    _paramProperties: [ "record", "schema", "callback", "requestParameters" ],
    createInitPropertiesFromAction : function (action, sourceMethod) {
        // Method parameter names don't match method argument names
        // so just use the action mappings and associate them with
        // the correct task properties
        var properties = {},
            mappings = action.mapping || []
        ;
        for (var i = 0; i < mappings.length; i++) {
            var mapping = mappings[i];
            if (mapping == "null") mapping = null;
            // "mark" property name with leading "^" (caret) so it will be replaced
            // with the actual property value upon evaluation
            if (mapping != null) properties[this._paramProperties[i]] = "^" + mapping;
        }
        return properties;
    }
})

isc.GridFetchRelatedDataTask.addProperties({
    componentBaseClass: ["ListGrid", "TileGrid", "DetailViewer"],
    componentRequiresDataSource: true,

    classDescription: "Cause a grid to fetch data related to a record in another grid",
    editorType: "GridFetchRelatedDataTaskEditor",

    //> @attr gridFetchRelatedDataTask.recordSourceComponent (GlobalId : null : IR)
    // Component to pull record for locating related data.
    //
    // @visibility workflow
    //<

    //> @attr gridFetchRelatedDataTask.dataSource (DataSource | ID : null : IR)
    // The DataSource used with +link{recordSourceComponent} to pull related data.
    // If not specified, +link{recordSourceComponent} will be used to obtain the schema.
    //
    // @visibility workflow
    //<

    executeElement : function (process) {
        var grid = this.getTargetComponent(process);
        if (!grid) return true;

        var recordSourceComponentId = this.recordSourceComponent;
        if (!recordSourceComponentId) {
            this.logWarn("recordSourceComponent not specified on task. Task skipped.");
            return true;
        }
        var recordSourceComponent = this.getLocalComponent(process, recordSourceComponentId);
        if (!recordSourceComponent) {
            this.logWarn("recordSourceComponent '" + recordSourceComponentId + "' not found. Task skipped.");
            return true;
        }

        var schema = this.dataSource || recordSourceComponent;

        var record = null,
            sourceIsGrid = isc.isA.ListGrid(recordSourceComponent) || isc.isA.TileGrid(recordSourceComponent)
        ;
        if (sourceIsGrid && recordSourceComponent.anySelected()) {
            record = recordSourceComponent.getSelectedRecord();
        } else if (isc.isA.DynamicForm(recordSourceComponent)) {
            record = recordSourceComponent.getValues();
        } else if (sourceIsGrid) {
            record = recordSourceComponent.getRecord(0);
        } else if (isc.isA.DetailViewer(recordSourceComponent)) {
            record = recordSourceComponent.data[0];
        }
        // If no selected record is found, there is nothing to do
        if (!record) return true;

        var task = this;
        // fetchRelatedData() is synchronous if filtering can be done on the client
        var willFetchData = grid.fetchRelatedData(record, schema, function (dsResponse) {
            var firstRecord = (dsResponse.data && dsResponse.data.length > 0 ? dsResponse.data[0] : null);
            process.setTaskOutput(task.getClassName(), task.ID, firstRecord);

            process.start();
        }, null, true);
        if (!willFetchData) {
            var firstRecord = grid.getRecord(0);
            process.setTaskOutput(task.getClassName(), task.ID, firstRecord);
        }
        // If fetching data pause workflow until callback above restarts it (async task)
        return !willFetchData;
    },
    
    getOutputSchema : function () {
        var grid = this.getTargetComponent(this.process);
        if (!grid) return null;
        var ds = grid.dataSource;
        if (ds && (ds.getClassName == null || ds.getClassName() != "DataSource")) {
            ds = isc.DataSource.get(ds);
        }
        return ds;
    },

    getElementDescription : function () {
        return "Fetch '" + this.componentId + "' data from related record";
    },

    updateGlobalIDReferences : function (oldId, newId) {
        var changed = this.Super("updateGlobalIDReferences", arguments);

        if (this.recordSourceComponent && this.recordSourceComponent == oldId) {
            this.recordSourceComponent = newId;
            changed = true;
        }
        return changed;
    }
});

//> @class GridRemoveSelectedDataTask
// Remove data that is selected in a grid.
//
// @see listGrid.removeSelectedData
// @inheritsFrom ComponentTask
// @treeLocation Client Reference/Workflow
// @visibility workflow
//<
isc.defineClass("GridRemoveSelectedDataTask", "ComponentTask");

isc.GridRemoveSelectedDataTask.addProperties({
    componentBaseClass: ["ListGrid", "TileGrid"],

    classDescription: "Remove data that is selected in a grid",
    editorType: "GridRemoveSelectedDataTaskEditor",

    //> @attr gridRemoveSelectedDataTask.failureElement (String : null : IR)
    // ID of the next sequence or element to proceed to if a failure condition arises
    // from operation.
    // @visibility workflow
    //<

    executeElement : function (process) {
        process.setTaskOutput(this.getClassName(), this.ID, process.getLastTaskOutput());

        var grid = this.getTargetComponent(process);
        if (!grid) return true;

        var params = isc.addProperties({}, this.requestProperties, { willHandleError: true });

        var task = this;
        grid.removeSelectedData(function (dsResponse, data, request) {
            // dsResponse can be null when there is no DS on the grid or saveLocally:true
            if (dsResponse && dsResponse.status < 0) {
                task.fail(process);
                return;
            }
            process.start();
        }, params);
        return false;
    },
    
    getElementDescription : function () {
        return "Remove '" + this.componentId + "' selected records";
    }
});

//> @class GridStartEditingTask
// Start editing a new record.
//
// @see listGrid.startEditingNew
// @inheritsFrom ComponentTask
// @treeLocation Client Reference/Workflow
// @visibility workflow
//<
isc.defineClass("GridStartEditingTask", "ComponentTask");

isc.GridStartEditingTask.addProperties({
    componentBaseClass: "ListGrid",

    classDescription: "Start editing a new record",
    editorType: "GridStartEditingTaskEditor",

    //> @attr gridStartEditingTask.initialValues (Record : null : IR)
    // Initial values for new edit record.
    // <p>
    // Data values prefixed with "$" will be treated as a +link{group:taskInputExpression}
    // excluding "$input" and "$inputRecord" references.
    //
    // @visibility workflow
    //<

    executeElement : function (process) {
        process.setTaskOutput(this.getClassName(), this.ID, process.getLastTaskOutput());

        var grid = this.getTargetComponent(process);
        if (!grid) return true;

        var values;
        if (this.initialValues) {
            // Resolve any dynamicCriteria or taskInputExpressions. Returns a copy of criteria.
            values = this._resolveObjectDynamicExpressions(this.initialValues, null, null, process);
        }

        grid.startEditingNew(values);
        return true;
    },
    
    getElementDescription : function () {
        return "Edit '" + this.componentId + "' new record";
    },

    updateLastElementBindingReferences : function (taskType) {
        var changed = this.Super("updateLastElementBindingReferences", arguments);
        changed = this._updateLastElementInValues(this.initialValues, taskType) || changed;
        return changed;
    },

    updateGlobalIDReferences : function (oldId, newId) {
        var changed = this.Super("updateGlobalIDReferences", arguments);
        changed = this._updateGlobalIDInValues(this.initialValues, oldId, newId) || changed;
        return changed;
    }
});

//> @class GridSetEditValueTask
// Sets the edit value of a given field. The targeted row
// is determined in the following order:
// <ol>
// <li> the current edit row
// <li> the first selected row
// <li> the first row in the grid
// <li> a new edit row
// </ol>
//
// @see listGrid.setEditValue
// @inheritsFrom ComponentTask
// @treeLocation Client Reference/Workflow
// @visibility workflow
//<
isc.defineClass("GridSetEditValueTask", "ComponentTask");

isc.GridSetEditValueTask.addProperties({
    componentBaseClass: "ListGrid",
    componentRequiresDataSource: true,

    classDescription: "Set a value in an editable grid as if the user had made the edit",
    editorType: "GridSetEditValueTaskEditor",

    //> @attr gridSetEditValueTask.targetField (Number | String : null : IR)
    // Target field in current edit row to be updated
    //
    // @visibility workflow
    //<

    //> @attr gridSetEditValueTask.value (Any : null : IR)
    // Value to assign to +link{targetField}.
    //
    // @visibility workflow
    //<

    executeElement : function (process) {
        process.setTaskOutput(this.getClassName(), this.ID, process.getLastTaskOutput());

        var grid = this.getTargetComponent(process);
        if (!grid) return true;

        var colNum = this.targetField;
        if (colNum == null) {
            this.logWarn("targetField not specified on task. Task skipped.");
            return true;
        }

        var editRow = grid.getEditRow(),
            rowNum = editRow
        ;
        if (rowNum < 0) {
            var selectedRecord = grid.getSelectedRecord();
            if (selectedRecord) {
                rowNum = grid.getRecordIndex(selectedRecord);
            }
        }
        if (rowNum < 0) {
            if (grid.getRecord(0) != null) {
                rowNum = 0;
            }
        }

        var value = this.value;
        if (value) {
            // Resolve any dynamicCriteria or taskInputExpressions
            var values = this._resolveObjectDynamicExpressions({ value: value }, null, null, process);
            value = values.value;
        }

        if (rowNum >= 0) {
            if (rowNum != editRow) {
                grid.startEditing(rowNum, colNum);
                rowNum = grid.getEditRow();
            }
            if (rowNum >= 0) {
                grid.setEditValue(rowNum, colNum, value);
            }
        } else {
            var initialValues = {};
            initialValues[this.targetField] = value;
            grid.startEditingNew(initialValues);
        }
        return true;
    },
    
    getElementDescription : function () {
        return "Set '" + this.componentId + "." + this.targetField + "' edit value";
    },

    updateLastElementBindingReferences : function (taskType) {
        var changed = this.Super("updateLastElementBindingReferences", arguments);
        changed = this._updateLastElementInValueProperty("value", taskType) || changed;
        return changed;
    },

    updateGlobalIDReferences : function (oldId, newId) {
        var changed = this.Super("updateGlobalIDReferences", arguments);
        changed = this._updateGlobalIDInValueProperty("value", oldId, newId) || changed;
        return changed;
    }
});

//> @class GridSaveAllEditsTask
// Save all changes in a grid with auto-saving disabled.
//
// @see listGrid.saveAllEdits
// @inheritsFrom ComponentTask
// @treeLocation Client Reference/Workflow
// @visibility workflow
//<
isc.defineClass("GridSaveAllEditsTask", "ComponentTask");

isc.GridSaveAllEditsTask.addProperties({
    componentBaseClass: "ListGrid",

    classDescription: "Save all changes in a grid with auto-saving disabled",
    editorType: "GridSaveAllEditsTaskEditor",


    executeElement : function (process) {
        process.setTaskOutput(this.getClassName(), this.ID, process.getLastTaskOutput());

        var grid = this.getTargetComponent(process);
        if (!grid) return true;

        grid.saveAllEdits(null, function () {
            process.start();
        });
        return false;
    },
    
    getElementDescription : function () {
        return "Save all '" + this.componentId + "' edits";
    }
});

//> @class GridTransferDataTask
// Transfer selected records from one grid to another.
//
// @see listGrid.transferSelectedData
// @inheritsFrom ComponentTask
// @treeLocation Client Reference/Workflow
// @visibility workflow
//<
isc.defineClass("GridTransferDataTask", "ComponentTask");

isc.GridTransferDataTask.addProperties({
    componentBaseClass: ["ListGrid", "TileGrid"],

    classDescription: "Transfer selected records from one grid to another",
    editorType: "GridTransferDataTaskEditor",

    //> @attr gridTransferDataTask.sourceComponent (GlobalId : null : IR)
    //  Source component from which the record(s) will be transferred.
    //
    // @visibility workflow
    //<

    executeElement : function (process) {
        var targetGrid = this.getTargetComponent(process);
        if (!targetGrid) return true;

        var sourceComponentId = this.sourceComponent;
        if (!sourceComponentId) {
            this.logWarn("sourceComponent not specified on task. Task skipped.");
            return true;
        }
        var sourceComponent = this.getLocalComponent(process, sourceComponentId);
        if (!sourceComponent) {
            this.logWarn("sourceComponent '" + sourceComponentId + "' not found. Task skipped.");
            return true;
        }

        var task = this;
        targetGrid.transferSelectedData(sourceComponent, null, function (records) {
            var firstRecord = (records && records.length > 0 ? records[0] : null);
            process.setTaskOutput(task.getClassName(), task.ID, firstRecord);

            process.start();
        });
        return false;
    },
    
    getOutputSchema : function () {
        var grid = this.getTargetComponent(this.process);
        if (!grid) return null;
        var ds = grid.dataSource;
        if (ds && (ds.getClassName == null || ds.getClassName() != "DataSource")) {
            ds = isc.DataSource.get(ds);
        }
        return ds;
    },

    getElementDescription : function () {
        return "Transfer selected data from '" + this.sourceComponent + "' to '" + this.componentId + "'";
    },

    updateGlobalIDReferences : function (oldId, newId) {
        var changed = this.Super("updateGlobalIDReferences", arguments);

        if (this.sourceComponent && this.sourceComponent == oldId) {
            this.sourceComponent = newId;
            changed = true;
        }
        return changed;
    }
});

//> @class GridExportDataTask
// Export data currently shown in a grid.
//
// @see dataBoundComponent.exportData
// @inheritsFrom ComponentTask
// @treeLocation Client Reference/Workflow
// @visibility workflow
//<
isc.defineClass("GridExportDataTask", "ComponentTask");

isc.GridExportDataTask.addProperties({
    componentBaseClass: ["ListGrid", "TileGrid", "DetailViewer"],
    componentRequiresDataSource: true,

    title: "Export Data (Server)",
    classDescription: "Export data currently shown in a grid",
    editorType: "GridExportDataTaskEditor",

    //> @attr gridExportDataTask.requestProperties (DSRequest : null : IR)
    // Additional properties to set on the DSRequest that will be issued
    // to perform server-side export.
    //
    // @visibility workflow
    //<

    executeElement : function (process) {
        process.setTaskOutput(this.getClassName(), this.ID, process.getLastTaskOutput());

        var grid = this.getTargetComponent(process);
        if (!grid) return true;

        grid.exportData(this.requestProperties, function () {
            process.start();
        });
        return false;
    },
    
    getElementDescription : function () {
        return "Export '" + this.componentId + "' data";
    }
});

//> @class GridExportClientDataTask
// Export data currently shown in a grid keeping all grid-specific formatting.
//
// @see listGrid.exportClientData
// @inheritsFrom ComponentTask
// @treeLocation Client Reference/Workflow
// @visibility workflow
//<
isc.defineClass("GridExportClientDataTask", "ComponentTask");

isc.GridExportClientDataTask.addProperties({
    componentBaseClass: ["ListGrid", "TileGrid", "DetailViewer"],

    title: "Export Data (Client)",
    classDescription: "Export data currently shown in a grid keeping all grid-specific formatting",
    editorType: "GridExportClientDataTaskEditor",

    //> @attr gridExportClientDataTask.requestProperties (DSRequest : null : IR)
    // Additional properties to set on the DSRequest that will be issued
    // to perform client-side export.
    //
    // @visibility workflow
    //<

    executeElement : function (process) {
        process.setTaskOutput(this.getClassName(), this.ID, process.getLastTaskOutput());

        var grid = this.getTargetComponent(process);
        if (!grid) return true;

        grid.exportClientData(this.requestProperties, function () {
            process.start();
        });
        return false;
    },
    
    getElementDescription : function () {
        return "Export '" + this.componentId + "' formatted data";
    }
});

//> @class PrintCanvasTask
// Print canvas by showing print preview.
//
// @see canvas.showPrintPreview
// @inheritsFrom ComponentTask
// @treeLocation Client Reference/Workflow
// @visibility workflow
//<
isc.defineClass("PrintCanvasTask", "ComponentTask");

isc.PrintCanvasTask.addProperties({
    componentBaseClass: ["Canvas"],

    title: "Print",
    classDescription: "Print canvas contents",
    editorType: "PrintCanvasTaskEditor",

    //> @attr printCanvasTask.printProperties (PrintProperties : null : IR)
    // PrintProperties object for customizing the print HTML output.
    //
    // @visibility workflow
    //<

    //> @attr printCanvasTask.printWindowProperties (PrintWindow : null : IR)
    // Properties to apply to the generated print window.
    //
    // @visibility workflow
    //<

    executeElement : function (process) {
        process.setTaskOutput(this.getClassName(), this.ID, process.getLastTaskOutput());

        var canvas = this.getTargetComponent(process);
        if (!canvas) return true;

        isc.Canvas.showPrintPreview(canvas, this.printProperties, this.printCanvasTask, function () {
            process.start();
        });
        return false;
    },
    
    getElementDescription : function () {
        return "Print '" + this.componentId + "'";
    }
});

//> @class ShowNextToComponentTask
// Show a component next to some other component.
//
//@see canvas.showNextTo
//@inheritsFrom ComponentTask
//@treeLocation Client Reference/Workflow
//@visibility workflow
//<
isc.defineClass("ShowNextToComponentTask", "ComponentTask");

isc.ShowNextToComponentTask.addClassMethods({
    _paramProperties: [ "nextToComponentId", "side", "canOcclude", "skipAnimation" ],
    createInitPropertiesFromAction : function (action, sourceMethod) {
        // Method parameter names don't match method argument names
        // so just use the action mappings and associate them with
        // the correct task properties
        var properties = {},
            mappings = action.mapping || []
        ;
        for (var i = 0; i < mappings.length; i++) {
            var mapping = mappings[i];
            if (mapping == "null") mapping = null;
            // "mark" property name with leading "^" (caret) so it will be replaced
            // with the actual property value upon evaluation
            if (mapping != null) properties[this._paramProperties[i]] = "^" + mapping;
        }
        return properties;
    }
})

isc.ShowNextToComponentTask.addProperties({
    componentBaseClass: "Canvas",

    title: "Show Next To",
    classDescription: "Show a component next to some other component",
    editorType: "ShowNextToComponentTaskEditor",

    //> @attr showNextToComponentTask.nextToComponentId (GlobalId : null : IR)
    // The other component where this component will show.
    //
    // @visibility workflow
    //<

    //> @attr showNextToComponentTask.side (String : null : IR)
    // Which side of the other canvas should we show? Options are
    // "top", "bottom", "left", "right". (Defaults to "right")
    //
    // @visibility workflow
    //<

    //> @attr showNextToComponentTask.canOcclude (Boolean : null : IR)
    // Can this component can be positioned on top of the other
    // component if there isn't room to show next to it?
    //
    // @visibility workflow
    //<

    //> @attr showNextToComponentTask.skipAnimation (Boolean : null : IR)
    // Set to <code>false</code> to not use animation to show component.
    //
    // @visibility workflow
    //<

    executeElement : function (process) {
        process.setTaskOutput(this.getClassName(), this.ID, process.getLastTaskOutput());

        var canvas = this.getTargetComponent(process);
        if (!canvas) return true;

        var nextToComponentId = this.nextToComponentId;
        if (!nextToComponentId) {
            this.logWarn("nextToComponentId not specified on task. Task skipped.");
            return true;
        }
        var nextToComponent = this.getLocalComponent(process, nextToComponentId);
        if (!nextToComponent) {
            this.logWarn("nextToComponentId '" + nextToComponentId + "' not found. Task skipped.");
            return true;
        }

        canvas.showNextTo(nextToComponent, this.side, this.canOcclue, this.skipAnimation);
        return true;
    },
    
    getElementDescription : function () {
        return "Show '" + this.componentId + "' next to '" + this.nextToComponentId + "'";
    },

    updateGlobalIDReferences : function (oldId, newId) {
        var changed = this.Super("updateGlobalIDReferences", arguments);

        if (this.nextToComponentId && this.nextToComponentId == oldId) {
            this.nextToComponentId = newId;
            changed = true;
        }
        return changed;
    }
});

//> @class SetSectionTitleTask
// Sets the title of a SectionStack section. The section is identified by 
// specifying either the +link{setSectionTitleTask.targetSectionName} or
// +link{setSectionTitleTask.targetSectionTitle}.
//
// @see sectionStack.setSectionTitle
// @inheritsFrom ComponentTask
// @treeLocation Client Reference/Workflow
// @visibility workflow
//<
isc.defineClass("SetSectionTitleTask", "ComponentTask");

isc.SetSectionTitleTask.addProperties({
    componentBaseClass: "SectionStack",

    classDescription: "Sets the title of a section in a SectionStack",
    editorType: "SetSectionTitleTaskEditor",

    //> @attr setSectionTitleTask.title (HTMLString : null : IR)
    // Title to assign to section. To assign a dynamic value see +link{textFormula}.
    //
    // @visibility workflow
    //<

    //> @attr setSectionTitleTask.textFormula (UserSummary : null : IR)
    // Formula to be used to calculate the section title contents. Use +link{title} property
    // to assign a static title instead.
    // <p> 
    // Available fields for use in the formula are the current +link{canvas.ruleScope,rule context}.
    //
    // @visibility workflow
    //<

    //> @attr setSectionTitleTask.targetSectionName (String : null : IR)
    // The name of the target section.
    //
    // @visibility workflow
    //<

    //> @attr setSectionTitleTask.targetSectionTitle (String : null : IR)
    // The current title of the target section.
    //
    // @visibility workflow
    //<

    executeElement : function (process) {
        process.setTaskOutput(this.getClassName(), this.ID, process.getLastTaskOutput());

        var sectionStack = this.getTargetComponent(process);
        if (!sectionStack) return true;

        var sectionName = this.targetSectionName;
        if (!sectionName && this.targetSectionTitle) {
            var sectionNames = sectionStack.getSectionNames();
            for (var i = 0; i < sectionNames.length; i++) {
                var sectionHeader = sectionStack.getSectionHeader(sectionNames[i]);
                if (sectionHeader && sectionHeader.title == this.targetSectionTitle) {
                    sectionName = sectionNames[i];
                    break;
                }
            }
        }

        if (!sectionName) {
            isc.logWarn("Target section not identified by targetSectionName or targetSectionTitle. Task skipped");
            return true;
        }

        var title = this.getTextFormulaValue(this.textFormula, process) ||
                    this.getDynamicValue(this.title, process);

        sectionStack.setSectionTitle(sectionName, title);
        return true;
    },
    
    getElementDescription : function () {
        return "Set '" + this.componentId + "' section title";
    }
});

//> @class NavigateListPaneTask
// Causes the list pane component to load data and update its title based on the current
// selection in the source pane. Also shows the pane if it's not already visible.
//
// @see splitPane.navigateListPane
// @inheritsFrom ComponentTask
// @treeLocation Client Reference/Workflow
// @visibility workflow
//<
isc.defineClass("NavigateListPaneTask", "ComponentTask");

isc.NavigateListPaneTask.addProperties({
    componentBaseClass: "TriplePane",

    classDescription: "Navigate to the List pane in a TriplePane, using the selection " +
        "in the Navigation pane to refresh the list, if applicable",
    editorType: "NavigateListPaneTaskEditor",

    //> @attr navigateListPaneTask.title (String : null : IR)
    // Title to show instead of the automatically chosen one.
    //
    // @visibility workflow
    //<

    executeElement : function (process) {
        process.setTaskOutput(this.getClassName(), this.ID, process.getLastTaskOutput());

        var triplePane = this.getTargetComponent(process);
        if (!triplePane) return true;

        var title = this.title;
        if (title) {
            // Resolve any dynamicCriteria or taskInputExpressions
            var values = this._resolveObjectDynamicExpressions({ value: title }, null, null, process);
            title = values.value;
        }

        triplePane.navigateListPane(title);
        return true;
    },
    
    getElementDescription : function () {
        return "Navigate '" + this.componentId + "' list pane";
    }
});

//> @class NavigateDetailPaneTask
// Causes the detail pane component to load data and update its title based on the current
// selection in the source pane. Also shows the pane if it's not already visible.
//
// @see splitPane.navigateDetailPane
// @inheritsFrom ComponentTask
// @treeLocation Client Reference/Workflow
// @visibility workflow
//<
isc.defineClass("NavigateDetailPaneTask", "ComponentTask");

isc.NavigateDetailPaneTask.addProperties({
    componentBaseClass: [ "SplitPane", "TriplePane" ],

    classDescription: "Navigate to the Detail pane in a SplitPane or TriplePane, " +
        "using the selection in the Navigation pane (for SplitPane) or List Pane (for TriplePane)",
    editorType: "NavigateDetailPaneTaskEditor",

    //> @attr navigateDetailPaneTask.title (String : null : IR)
    // Title to show instead of the automatically chosen one.
    //
    // @visibility workflow
    //<

    executeElement : function (process) {
        process.setTaskOutput(this.getClassName(), this.ID, process.getLastTaskOutput());

        var splitPane = this.getTargetComponent(process);
        if (!splitPane) return true;

        var title = this.title;
        if (title) {
            // Resolve any dynamicCriteria or taskInputExpressions
            var values = this._resolveObjectDynamicExpressions({ value: title }, null, null, process);
            title = values.value;
        }

        splitPane.navigateDetailPane(title);
        return true;
    },
    
    getElementDescription : function () {
        return "Navigate '" + this.componentId + "' detail pane";
    }
});

//> @class LogOutTask
// Logs out the current user by opening the +link{Auth.logOutURL} in another tab or window.
//
// @inheritsFrom ProcessElement
// @treeLocation Client Reference/Workflow
// @visibility workflow
//<
isc.defineClass("LogOutTask", "ProcessElement");

isc.LogOutTask.addProperties({
    classDescription: "Logs the current user out of the application",
    editorType: null,

    executeElement : function (process) {
        process.setTaskOutput(this.getClassName(), this.ID, process.getLastTaskOutput());

        var url = (isc.Auth ? isc.Auth.logOutURL : null);
        if (!url) {
            isc.logWarn("logOutURL not specified on Auth class. Task skipped");
            return true;
        }

        isc.Auth.logOut();
        return true;
    },
    
    getElementDescription : function () {
        return "Log out the current user";
    }
});

//> @class ResetPasswordTask
// Show user password reset dialog by opening the +link{Auth.resetPasswordURL}
// in another tab or window.
//
// @inheritsFrom ProcessElement
// @treeLocation Client Reference/Workflow
// @visibility workflow
//<
isc.defineClass("ResetPasswordTask", "ProcessElement");

isc.ResetPasswordTask.addProperties({
    classDescription:  "Sends the user to a screen to reset their password",
    editorType: null,

    executeElement : function (process) {
        process.setTaskOutput(this.getClassName(), this.ID, process.getLastTaskOutput());

        var url = (isc.Auth ? isc.Auth.resetPasswordURL : null);
        if (!url) {
            isc.logWarn("resetPasswordURL not specified on Auth class. Task skipped");
            return true;
        }

        isc.Auth.resetPassword();
        return true;
    },
    
    getElementDescription : function () {
        return "Reset user password";
    }
});








