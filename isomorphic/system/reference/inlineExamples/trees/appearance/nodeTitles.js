isc.TreeGrid.create({
    ID: "employeeTree",
    width: 500,
    height: 425,
    dataSource: "employees",
    nodeIcon:"icons/16/person.png",
    folderIcon:"icons/16/person.png",
    showOpenIcons:false,
    showDropIcons:false,
    closedIconSuffix:"",
    showSelectedIcons:true,
    fields: [
        {name: "Name", formatCellValue: "record.Job+':&nbsp;'+value"}
    ]
});

// fetch the top level employee node in the tree and its children
employeeTree.fetchData(null, function (request, data, response) {
    employeeTree.data.openFolders(data);
});
