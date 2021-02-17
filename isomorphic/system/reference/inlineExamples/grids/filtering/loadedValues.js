
// Create a new custom DataSource to populate the category filter item based on either
// the fully loaded data set within the ListGrid, or the result of a fetch against the
// supplyItem dataSource if that isn't available
var categoryDS = isc.DataSource.create({
    clientOnly: true,
    // This is a clientCustom type dataSource
    dataProtocol: "clientCustom",
    currentData: null,
    currentCriteria: null,

    // transformRequest - invoked for all operations against this dataSource
    transformRequest: function (dsRequest) {
        var records = [],
            listGridCriteria = listGrid.getFilterEditorCriteria();

        // If we've already got a local set of records that match the criteria for the associated ListGrid
        // use them.
        if (this.currentData != null && this.compareCriteria(listGridCriteria, this.currentCriteria) == 0) {
            records = this.currentData;
        // Otherwise, if the list grid has a full set of cached rows for the current criteria, extract
        // the criteria values from those records
        } else {
            var resultSet = listGrid.data;
            if (resultSet != null && resultSet.allMatchingRowsCached()) {
                var categoryArray = [];
                for (var i = 0; i < resultSet.getLength(); i++) {
                    categoryArray.push(resultSet.get(i).category);
                }
                var filteredCategory = [];
                categoryArray.forEach(element => {
                    if (!filteredCategory.includes(element)) {
                        filteredCategory.push(element)
                    }
                })
                for (var j = 0; j < filteredCategory.length; j++) {
                    records.push( { category: filteredCategory[j] } );
                }
                categoryDS.updateCurrentData(listGridCriteria, records);
            }
        }
        if (records.length != 0) {
            var dsResponse = {
                status: 0,
                data: records
            }          
            categoryDS.processResponse(dsRequest.requestId, dsResponse);

        // Lastly, if we didn't already have records locally, issue a fetch against the custom
        // "obtainCategories" operation to retrive records from the server
        } else {
            supplyItem.fetchData(
                listGridCriteria,
                function (dsResponse) {
                    categoryDS.updateCurrentData(listGridCriteria, dsResponse.data);
                    categoryDS.processResponse(dsRequest.requestId, dsResponse);
                },
                { operationType: "fetch", groupBy: "category" }
            )
        }
        return dsRequest.data;
    },
    // Helper to store out the current criteria and matching records
    updateCurrentData: function (criteria, data) {
        this.currentCriteria = criteria;
        this.currentData = data;
    },

    fields: [
        // We only store one field for this dataSource
        { name: "category" } 
    ]
});

isc.ListGrid.create({
    ID: "listGrid",
    width: 800,
    height: 450,
    showFilterEditor: true,
    showAllColumns: true,
    autoFetchData: true,
    dataSource: "supplyItem",

    // Force a fetch on the category filter's pickList when we get new data in the listGrid.
    // If the criteria have changed this may lead to a new fetch against the server
    dataArrived: function (startRow, endRow) {
        // Force a re-fetch on the selectItem pickList
        var item = this.filterEditor.getEditFormItem("category");
        item.fetchData();
    },
    fields: [
        { name: "category", 
            filterEditorProperties: { 
                editorType: "SelectItem",
                name: "category", 
                optionDataSource: categoryDS, 
                valueField: "category",
                autoFetchData: false
            }
        },
        { name: "itemName"},
        { name: "SKU"}
    ]
});