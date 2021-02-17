// Custom date format function
function dateFormatFunction () {
    return this.getDate() + "." + (this.getMonth() + 1) + "." + this.getShortYear();
}; 

// Specify Date formatting globally or at the component level
//  - uncomment the following line to apply to all components:
//Date.setShortDisplayFormat(dateFormatFunction);


isc.ListGrid.create({
    ID:"employeeGrid",
    width:250, height:100,
    canEdit:true,
    dataSource:"employees",
    autoFetchData:true,
    recordClick:"employeeForm.editRecord(record)",
    // Specify date formatting for this component:
    dateFormatter:dateFormatFunction,
    dateInputFormat:"DMY"
})

isc.DynamicForm.create({
    ID:"employeeForm",
    top:150,
    dataSource:"employees",
    fields:[
        {name:"name"},
        {name:"hireDate", useTextField:true, wrapTitle:false, 
            // Specify date formatting for this item:
            inputFormat:"DMY", displayFormat:dateFormatFunction
        },
        {type:"button", title:"Save Edits", click:"form.saveData()"}
    ]
    
})

Date.setShortDisplayFormat(function () {
    return this.getDate() + "." + (this.getMonth() + 1) + "." + this.getShortYear();
});
Date.setInputFormat("DMY");

isc.ListGrid.create({
    ID:"employeeGrid",
    width:250, height:100,
    canEdit:true,
    dataSource:"employees",
    autoFetchData:true,
    recordClick:"employeeForm.editRecord(record)"
})

isc.DynamicForm.create({
    ID:"employeeForm",
    top:150,
    dataSource:"employees",
    fields:[
        {name:"name"},
        {name:"hireDate", useTextField:true},
        {type:"button", title:"Save Edits", click:"form.saveData()"}
    ]
    
})