var ds = isc.DataSource.get("productRevenue");

isc.FacetChart.create({
    ID: "dynamicChart",
    title: "Revenue",

    // You use facets to define the ways in which you would like the chart to
    // break down the data. In this case, our data has two dimensions: scenario and region
    facets: [{
        id: "Regions",  // the key used for this facet in the data
        title: "Region" // the user-visible title you want in the chart
    },{
        id: "Scenarios",  
        title: "Scenario" 
    }],
    
    chartType: "Area",
    stacked: false, // we unstack to see the comparison between the two scenarios (budget vs. actual)
    valueProperty: "value", // the property in the data that is the numerical value to chart

    // This is a function to update the chart's data from the dataSource. We combine some fixed
    // criteria with any additional criteria supplied as a parameter.
    updateData : function (dynamicCriteria, title) {
        var self = this; // So we can refer to ourself in the callback below, where "this" will have changed
        ds.fetchData(
            // The first parameter is the critera ... we combine fixed criteria with those passed in
            isc.DataSource.combineCriteria({
                Products: "Prod01",
                Regions: ["North", "South", "East", "West"]
            }, dynamicCriteria),
            // The second parameter is the callback once the data arrives
            function (dsResponse, data, dsRequest) {
                self.setProperty("title", title);
                self.setData(data);
            }
        );
    }
});

// Note that the dataSource has pre-computed subtotals in the "Time" field ... we start
// with "sum", which is the grand total, and use the form defined below to pick out others
dynamicChart.updateData({
    Time: "sum"
}, "Revenue for All Years");

// This is a form which you can use to change the chart type

isc.DynamicForm.create({
    ID: "chartSelector",
    wrapItemTitles: false,
    width: "25%",
    items: [{
        name: "chartType",
        title: "Chart Type",
        type: "select",
        valueMap: ["Area", "Column", "Bar", "Line", "Pie", "Doughnut", "Radar"],
        defaultValue: "Area",
        changed : function (form, item, value) {
            dynamicChart.setChartType(value)
        }
    }]
});

// Have the chartSelector update itself if the context menu is used to change chartType
chartSelector.observe(dynamicChart, "setChartType", "chartSelector.setValue('chartType', dynamicChart.chartType)");

// For simplicity, define time values manually.  These could also be derived from the database.

isc.Tree.create({
    ID: "timeTree",
    modelType: "parent",
    rootValue: "sum",
    showRoot: true,
    data: [
        {id:"sum", title:"All Years", collapsed:false},
        {id:"2018", parentId:"sum", title:"2018"},
        {id:"2019", parentId:"sum", title:"2019"},
        {id:"2020", parentId:"sum", title:"2020", collapsed:false},
        {id:"Q1-2018", parentId:"2018", title:"Q1-2018"},
        {id:"Q2-2018", parentId:"2018", title:"Q2-2018"},
        {id:"Q3-2018", parentId:"2018", title:"Q3-2018"},
        {id:"Q4-2018", parentId:"2018", title:"Q4-2018"},
        {id:"Q1-2019", parentId:"2019", title:"Q1-2019"},
        {id:"Q2-2019", parentId:"2019", title:"Q2-2019"},
        {id:"Q3-2019", parentId:"2019", title:"Q3-2019"},
        {id:"Q4-2019", parentId:"2019", title:"Q4-2019"},
        {id:"Q1-2020", parentId:"2020", title:"Q1-2020"},
        {id:"Q2-2020", parentId:"2020", title:"Q2-2020"},
        {id:"Q3-2020", parentId:"2020", title:"Q3-2020"},
        {id:"Q4-2020", parentId:"2020", title:"Q4-2020"},
        {id:"1/1/2018", parentId:"Q1-2018", title:"1/1/2018"},
        {id:"2/1/2018", parentId:"Q1-2018", title:"2/1/2018"},
        {id:"3/1/2018", parentId:"Q1-2018", title:"3/1/2018"},
        {id:"4/1/2018", parentId:"Q2-2018", title:"4/1/2018"},
        {id:"5/1/2018", parentId:"Q2-2018", title:"5/1/2018"},
        {id:"6/1/2018", parentId:"Q2-2018", title:"6/1/2018"},
        {id:"7/1/2018", parentId:"Q3-2018", title:"7/1/2018"},
        {id:"8/1/2018", parentId:"Q3-2018", title:"8/1/2018"},
        {id:"9/1/2018", parentId:"Q3-2018", title:"9/1/2018"},
        {id:"10/1/2018", parentId:"Q4-2018", title:"10/1/2018"},
        {id:"11/1/2018", parentId:"Q4-2018", title:"11/1/2018"},
        {id:"12/1/2018", parentId:"Q4-2018", title:"12/1/2018"},
        {id:"1/1/2019", parentId:"Q1-2019", title:"1/1/2019"},
        {id:"2/1/2019", parentId:"Q1-2019", title:"2/1/2019"},
        {id:"3/1/2019", parentId:"Q1-2019", title:"3/1/2019"},
        {id:"4/1/2019", parentId:"Q2-2019", title:"4/1/2019"},
        {id:"5/1/2019", parentId:"Q2-2019", title:"5/1/2019"},
        {id:"6/1/2019", parentId:"Q2-2019", title:"6/1/2019"},
        {id:"7/1/2019", parentId:"Q3-2019", title:"7/1/2019"},
        {id:"8/1/2019", parentId:"Q3-2019", title:"8/1/2019"},
        {id:"9/1/2019", parentId:"Q3-2019", title:"9/1/2019"},
        {id:"10/1/2019", parentId:"Q4-2019", title:"10/1/2019"},
        {id:"11/1/2019", parentId:"Q4-2019", title:"11/1/2019"},
        {id:"12/1/2019", parentId:"Q4-2019", title:"12/1/2019"},
        {id:"1/1/2020", parentId:"Q1-2020", title:"1/1/2020"},
        {id:"2/1/2020", parentId:"Q1-2020", title:"2/1/2020"},
        {id:"3/1/2020", parentId:"Q1-2020", title:"3/1/2020"},
        {id:"4/1/2020", parentId:"Q2-2020", title:"4/1/2020"},
        {id:"5/1/2020", parentId:"Q2-2020", title:"5/1/2020"},
        {id:"6/1/2020", parentId:"Q2-2020", title:"6/1/2020"},
        {id:"7/1/2020", parentId:"Q3-2020", title:"7/1/2020"},
        {id:"8/1/2020", parentId:"Q3-2020", title:"8/1/2020"},
        {id:"9/1/2020", parentId:"Q3-2020", title:"9/1/2020"},
        {id:"10/1/2020", parentId:"Q4-2020", title:"10/1/2020"},
        {id:"11/1/2020", parentId:"Q4-2020", title:"11/1/2020"},
        {id:"12/1/2020", parentId:"Q4-2020", title:"12/1/2020"}
    ]
});

// The form that lets you select a time period

isc.DynamicForm.create({
    ID: "timeSelector",
    wrapItemTitles: false,
    items: [{
        name: "timePeriod",
        title: "Time Period",
        type: "pickTree",
        valueTree: timeTree,
        canSelectParentItems: true,
        displayField: "title",
        valueField: "id",
        changed : function (form, item, value) {
            dynamicChart.updateData({
                Time: value
            }, "Revenue for " + timeTree.findById(value).title);
        }
    }]
});

// Overall layout

isc.VLayout.create({
    ID: "dynamicChartLayout",
    width: "100%",
    height: "100%",
    membersMargin: 20,
    members: [
        isc.HLayout.create({
            height: 40,
            members: [chartSelector, timeSelector]
        }),
        dynamicChart
    ]
});

