isc.VLayout.create({
    membersMargin:10,
    width:"100%", height:"100%",
    members:[
        isc.ListGrid.create({
            width:"100%", height:"100%", alternateRecordStyles:true,
            data: countryData, selectionType:"none", showRollOver:false,
            alternateRowStyles:true, canDragSelectText:true,
            fields:[
                {name:"countryName", title:"Country", width:120},
                {name:"background", title:"Background"},
                {name:"countryCode", title:"Flag", align:"center", width:50, type:"image", imageSize:24, imageURLPrefix:"flags/24/", imageURLSuffix:".png"}
            ],
            wrapCells: true,
            fixedRecordHeights: false
        }),
        isc.DynamicForm.create({
            width:"100%", height:150,
            fields:[
                { title:"Pasted value", name:"textArea",
                    width:"100%",height:"100%", editorType: "TextAreaItem"
                }
            ]
        })
    ]
});