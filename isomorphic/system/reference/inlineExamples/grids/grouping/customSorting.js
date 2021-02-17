
isc.ListGrid.create({
    ID: "companyList",
    width:600, height:525,
    alternateRecordStyles:true,
    autoFetchData:true,
    dataSource:orderItemLocalDS,
    canEdit:true, editEvent:"click",
    showAllRecords:true,

    groupByField: ["category", "shipDate"],
    groupStartOpen:"all",
    canMultiGroup: true,

    sortByGroupFirst: true,
    groupSortDirection: "ascending",

    groupSortNormalizer: function (record, fieldName, grid) {
        if (grid.isGroupNode(record) && record.groupName == fieldName) {
            return grid.countGroupLeaves(record);
        }
        return null
    },

    countGroupLeaves : function (record) {
        var count = 0, children = record.groupMembers;
        for (var i = 0; i < children.length; i++) {
            if (this.isGroupNode(children[i])) {
                count += this.countGroupLeaves(children[i]);
            } else {
                count++;
            }
        }
        return count;
    },

    fields: [
        {name: "orderID", includeInRecordSummary: false}, 
        {name: "itemDescription", width: 120}, 
        {name: "category", width: 80}, 
        {name: "shipDate", width: 100},
        {name: "quantity"}, 
        {name: "unitPrice"},
        {name: "total", title: "Total", 
         align: "right", width: 80,
         type:"summary", recordSummaryFunction: "multiplier",
         formatCellValue:function (value) {
             if (isc.isA.Number(value)) {
                return isc.NumberUtil.format(value, "$#,##0.00");
             }
             return value;
         }
        }
    ]
});

isc.Button.create({
    top: 550, width: 150,
    title: "Sort Descending",
    click: function() {
        var newDirection;
        if (companyList.groupSortDirection == "ascending") {
            newDirection = "descending";
            this.setTitle("Sort Descending");
        } else {
            newDirection = "ascending";
            this.setTitle("Sort Ascending");
        }
        companyList.setProperty("groupSortDirection", newDirection);
        companyList.setSort();
    }
});
