isc.ListGrid.create({
    ID: "countryList",
    width: 500, height: 350, 
    data: countryData,
    fields: [
        {name: "countryName", title: "Country"},
        {name: "capital", title: "Capital"},
        {name: "continent", title: "Continent"}
    ],
    canExpandRecords: true,
    expansionMode: "detailField",
    detailField: "background"
});

isc.IButton.create({ 
    ID : "buttonPdf",
    width: 150,
    title: "Export",  
    click : function () {
        // this sample exports to the Enterprise skin, and that skin defaults to 
        // alternate row styling but not alternate field styling - remember the 
        // alternate styling settings (from the current skin) and update them to
        // those required for Enterprise, via a call to setProperties().
        var oldAlternateRecordStyles = countryList.alternateRecordStyles;
        var oldAlternateFieldStyles = countryList.alternateFieldStyles;
        countryList.setProperties({
            alternateRecordStyles: true,
            alternateFieldStyles: false
        });

        var settings = {
            skinName: "Enterprise", 
            pdfName: "export"// without .pdf
	    };
        isc.RPCManager.exportContent(mainLayout, settings);

        // reinstate the alternate styling settings from the current skin, on a short delay
        countryList.delayCall("setProperties", [{
            alternateRecordStyles: oldAlternateRecordStyles,
            alternateFieldStyles: oldAlternateFieldStyles
        }], 300);
    }
});
isc.IButton.create({ 
    ID : "buttonPreview",
    width: 150,
    title: "Show Print Preview",  
    click: function () {
        isc.Canvas.showPrintPreview(mainLayout);
    }
});
isc.HLayout.create({
    ID: "hLayout",
    membersMargin: 5,
    members: [
        buttonPdf,
        buttonPreview
    ]
});
isc.VLayout.create({
    ID: "mainLayout",
    width: 500,
    membersMargin: 5,
    height: 350,
    members: [
        countryList,
        hLayout
    ]
});
countryList.expandRecord(countryList.data[2]);
countryList.expandRecord(countryList.data[4]);
