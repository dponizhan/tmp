isc.VStack.create({
    membersMargin: 10,
    width:600, 
    members: [
        isc.FilterBuilder.create({
            ID:"countryFilter",
            topOperatorAppearance: "radio",
            radioOperatorFormProperties: {
                width: 600
            },
            dataSource:"worldDS",
            criteria: { _constructor: "AdvancedCriteria",
                operator: "and", criteria: [
                    {fieldName: "area", operator: "greaterThan", value: 50},
                    {fieldName: "population", operator: "greaterThan", value: 100000}
                ]
            }
        }),
        isc.IButton.create({
            ID:"filterButton",
            title:"Filter",
            click : function () {
                countryList.setData([]);
                countryList.filterData(countryFilter.getCriteria());
            }
        }),
        isc.ListGrid.create({
            ID: "countryList",
            height:224, alternateRecordStyles:true, 
            dataSource: worldDS,
            fetchOperation: "fetchByRequiredCriterion",
            fields:[
                {name:"countryName"},
                {name:"continent"},
                {name:"population"},
                {name:"area"},
                {name:"gdp"},
                {name:"independence", width:100}
            ]
        })
    ]
});
