// Specify Date formatting globally or at the component level
//  - uncomment the following lines to apply to all components:
//Date.setShortDisplayFormat("toJapanShortDate");
//Date.setInputFormat("YMD");

isc.ListGrid.create({
    ID:"employeeGrid",
    width:250, height:100,
    canEdit:true,
    dataSource:"employees",
    autoFetchData:true,
    recordClick:"employeeForm.editRecord(record)",
    // Specify date formatting for this component:
    dateFormatter:"toJapanShortDate",
    dateInputFormat:"YMD"
});

isc.DynamicForm.create({
    ID:"employeeForm",
    top:150,
    dataSource:"employees",
    fields:[
        {name:"name"},
        {name:"hireDate", useTextField:true, wrapTitle:false,
            // Specify date formatting for this item:
            inputFormat:"YMD",
            dateFormatter:"toJapanShortDate"
        },
        {type:"button", title:"Save Edits", click:"form.saveData()"}
    ]
    
});