var ds = isc.DataSource.get("countryDS");

isc.DynamicForm.create({
    height: 50, width: "100%",
    ID: "preferenceForm",
    numCols: 2,
    autoDraw: false,
    fields: [
            {name: "state", title: "Current view state", wrapTitle: false, shouldSaveValue: false, type: "StaticTextItem"}
    ]
});

var countryGrid = isc.ListGrid.create({
    ID: "countryGrid",
    width: "100%", height: 200,
    autoFitData: "horizontal",
    autoFitFieldWidths: true,
    leaveScrollBarGap: true,
    canGroupBy: true,
    autoDraw: false,
    canFreezeFields: true,
    canAddFormulaFields: true,
    canAddSummaryFields: true,
    dataSource: ds,
    autoFetchData: true,
    autoPersistViewState: ["all"],
    fields: [
        {name: "countryCode", title: "Flag", type: "image", width: 50, imageURLPrefix: "flags/16/", imageURLSuffix: ".png", canSort: false},
        {name: "countryName", title: "Country"},
        {name: "capital", title: "Capital"},
        {name: "population", title: "Population"}, 
        {name: "area", title: "Area (km&sup2;)"} 
    ],
    draw : function() {
        this.Super("draw", arguments);
        this.showSavedViewState();
    },
    viewStateChanged : function () {
        this.showSavedViewState();
    },
    showSavedViewState : function () {
        var viewState = this.getSavedViewState();
        if (viewState == null) viewState = "[None]";
        preferenceForm.setValue("state", viewState);
    }
});

isc.ToolStripButton.create({
    ID: "formulaBuilder",    
    autoDraw: false,showDownIcon:false,
    icon: "icons/16/sc_insertformula.png",  
    title: "Formula Builder",
    autoFit: true,
    click : function () {
        countryGrid.addFormulaField();
    }   
});

isc.ToolStripButton.create({
    ID: "summaryBuilder",    
    autoDraw: false,showDownIcon:false,
    icon: "icons/16/application_side_tree.png",  
    title: "Summary Builder",
    autoFit: true,
    click : function () {
        countryGrid.addSummaryField();
    }
});



isc.ToolStrip.create({
    ID: "preferenceStrip",
    width: "100%",
    addFill: true,
    align: "right",
    autoDraw: false,
    members: [formulaBuilder, summaryBuilder]
});

isc.ToolStripButton.create({
    ID: "clearState",    
    autoDraw: false,showDownIcon:false,
    title: "Clear Saved State",
    icon: "icons/16/close.png",  
    autoFit: true,
    click : function () {
        countryGrid.clearSavedViewState();
        countryGrid.showSavedViewState();
    }
});

isc.ToolStrip.create({
    ID: "restoreStrip",
    width: "100%",
    addFill: true,
    autoDraw: false,
    align: "right",
    members: [clearState]
});

isc.VLayout.create({
    ID: "testLayout",
    height: "100%",
    minBreadthMember: countryGrid,
    members: [preferenceStrip, countryGrid, preferenceForm, restoreStrip]
    });
