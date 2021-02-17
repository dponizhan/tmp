var fields = [{name: "modelName", title: "Model Name", width: 70, 
               wrap: true, type: "text", rotateTitle: false}];
for (var i = 0; i < carFeatures.length; i++) {
    var feature = carFeatures[i];
    fields.add({
        name: feature.name, title: feature.title, type: "boolean"
    });
}

var records = [];
for (var i = 0; i < carModels.length; i++) {
    var model = carModels[i],
        record = {modelName: model};
    for (var j = 0; j < carFeatures.length; j++) {
        var feature = carFeatures[j];
        record[feature.name] = Math.random() >= 0.5;
    }
    records.add(record);
}

isc.Label.create({
    width: 500, height: 40,
    ID: "carDataLabel",
    contents: "<span style='font-size:20px'><b>Supercar Model Feature Overview</b></span>"
});

isc.ListGrid.create({
    ID: "carDataList",
    autoFitData:"both",
    rotateHeaderTitles: true,
    headerHeight: 170,
    fields: fields,
    data: records,
    canEdit: true
});

isc.VLayout.create({
    members:[
        carDataLabel,
        carDataList
    ]
});

