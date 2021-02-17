isc.defineClass("CustomListGrid", "ListGrid").addProperties({
    init: function () {
        this.Super("init", arguments);
        var toolStrip = isc.ToolStrip.create({
            membersMargin: 5,
            members: [
                isc.Label.create({ 
                    wrap: false, padding: 5, 
                    contents: "0 to 0 of 0",
                    getRowRangeText: function(arrayVisibleRows, totalRows, lengthIsKnown) {
                        if (!lengthIsKnown) return "Loading...";
                        else if (arrayVisibleRows[0] != -1) return (arrayVisibleRows[0]+1) + " to "+ (arrayVisibleRows[1]+1) + " of " + totalRows;
                        else return "0 to 0 of 0";
                    }
                }), 
                isc.LayoutSpacer.create({width: "*"}),
                isc.ImgButton.create({
                    grid: this,
                    src: "[SKIN]/actions/add.png", showRollOver: false,
                    prompt: "Add", width: 24, height: 24, showDown: false,
                    click: function () {
                        this.grid.startEditingNew();
                    }
                }),
                isc.ImgButton.create({
                    grid: this,
                    src: "[SKIN]/actions/remove.png", showRollOver: false,
                    prompt: "Remove", width: 24, height: 24, showDown: false,
                    click: function () {
                        this.grid.removeSelectedData();
                    }
                }),
                "separator", 
                isc.ImgButton.create({
                    grid: this,
                    src: "[SKIN]/actions/clearFilter.png", showRollOver: false,
                    prompt: "Clear Filter", width: 24, height: 24, showDown: false,
                    click: function () {
                        this.grid.setFilterEditorCriteria({});
                        this.grid.filterByEditor();
                    }
                }),
                isc.ImgButton.create({
                    grid: this,
                    src: "[SKIN]/actions/refresh.png", showRollOver: false,
                    prompt: "Refresh", width: 24, height: 24, showDown: false,
                    click: function () {
                        this.grid.refreshData();
                    }
                }),
                "separator", 
                isc.DynamicForm.create({
                    grid: this,
                    fields: [
                        { name: "exportType", showTitle: false, type:"select", width:150,
                            defaultToFirstOption: true,
                            valueMap: { 
                                "" : "Export As...",
                                "csv" : "CSV" , 
                                "xml" : "XML", 
                                "xls" : "XLS (Excel97)",
                                "ooxml" : "OOXML (Excel2007)"
                            },
                            changed: function(form, item, value) {
                                if (value) {
                                    form.grid.exportData({ 
                                        exportAs: value,
                                        exportDisplay: "download"
                                    });
                                }
                            }
                        }
                    ]
                })
            ]

        });
        this.setProperty("gridComponents", ["filterEditor", "header", "body", "summaryRow", toolStrip]);

    },

    initWidget: function () {
        this.Super("initWidget", arguments);
        this.observe(this, "dataChanged", function () {
            this.updateRowRangeDisplay();
        });
        this.observe(this, "scrolled", function () {
            this.updateRowRangeDisplay();
        });
    },

    updateRowRangeDisplay: function () {
        var label = this.gridComponents[4].getMember(0);
        label.setContents(label.getRowRangeText(this.getVisibleRows(), this.getTotalRows(), this.data.lengthIsKnown()));
    }

});

isc.CustomListGrid.create({
    ID: "categoryList", showFilterEditor: true,
    width:"100%", height:500, 
    dataSource: supplyItem,
    autoFetchData: true

});
