isc.FilterBuilder.create({
    ID:"advancedFilter",
    dataSource:"worldDS"
});

isc.ListGrid.create({
    ID: "countryList",
    width:700, height:224, alternateRecordStyles:true, 
    dataSource: worldDS, autoFetchData: true,
    showFilterEditor: true,
    fields:[
        {name:"countryName"},
        {name:"continent"},
        {name:"population"},
        {name:"area"},
        {name:"gdp"},
        {name:"independence", width:100}
    ]})

isc.IButton.create({
    ID:"filterButton",
    title:"Filter",
    click : function () {
        countryList.setImplicitCriteria(advancedFilter.getCriteria());
    }
})

isc.VStack.create({
    membersMargin:10,
    members:[ advancedFilter, filterButton, countryList ]
})
