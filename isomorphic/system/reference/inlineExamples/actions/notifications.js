// NotifySettings that won't change should be set up front using configureMessages()
isc.Notify.configureMessages("message", {
    multiMessageMode: "replace",
    autoFitMaxWidth: 250,
    slideSpeed: 250
});

// configForm configures the dynamic NotifySettings that will be passed to addMessage()
isc.DynamicForm.create({
    ID: "configForm",
    fields: [
        {type:"header", defaultValue: "Configure Notification"},
        {name: "text", title:"Message", type:"text", hint: "Type your Message", 
         defaultValue: "Download complete", wrapHintText: false},
        {name: "location", title: "Screen Location", 
         editorType: "ComboBoxItem", defaultValue: "T",
         valueMap: {
             "L": "left edge",
             "R": "right edge",
             "T": "top edge",
             "B": "bottom edge",
             "TL": "top-left corner",
             "TR": "top-right corner",
             "BL": "bottom-left corner",
             "BR": "bottom-right corner",
             "C": "center"
         }},
        {name: "showAnimation", title: "Show Animation", editorType: "ComboBoxItem",
         wrapTitle: false, defaultValue: "slide", valueMap: ["slide", "fade", "instant"]},
        {name: "hideAnimation", title: "Hide Animation", editorType: "ComboBoxItem",
         wrapTitle: false, defaultValue: "fade", valueMap: ["slide", "fade", "instant"]},
        {name: "notifyType", title: "Priority", editorType: "ComboBoxItem",
         wrapTitle: false, defaultValue: "message", valueMap: ["message", "warn", "error"]
        },
        {name: "dismiss", type:"checkbox", title: "Add button to immediately dismiss"},
        {name: "window", type:"checkbox", title: "Add link to launch a window"}
    ]
});

isc.Button.create({
    ID: "sendButton",
    title: "Send",
    click: function () {
        var config = configForm.getValues(),
            contents = config.text;
        if (!contents) contents = "You left the message text empty!"

        var actions = [];
        if (config.window) {
            actions.add({
                title: "Launch...",
                target: sendButton,
                methodName: "showWindow"
            });
        }

        var notifyTypePriority = config.notifyType.toUpperCase(),
            messagePriority = isc.Notify[notifyTypePriority]
        ;
        isc.Notify.addMessage(contents, actions, null, {
            canDismiss: config.dismiss,
            appearMethod: config.showAnimation,
            disappearMethod: config.hideAnimation,
            messagePriority: messagePriority,
            position: config.location});
    },
    // if window already exists, just show it; no-ops if already being shown
    showWindow : function () {
        if (!this.wizardWindow) {
            this.wizardWindow = isc.Window.create({
                isModal:true,
                autoSize:true,
                autoCenter:true,
                bodyProperties: {
                    defaultLayoutAlign: "center",
                    layoutLeftMargin: 5,
                    layoutRightMargin: 5,
                    layoutBottomMargin: 10
                },
                showModalMask:true,
                canDragReposition:false,
                title:"Notification Action",
                showMinimizeButton:false,
                items: [
                    isc.Label.create({
                        width: "100%", height: 40,
                        align: "center", wrap: false, 
                        contents: "In your application, this window might contain a wizard."
                    }),
                    isc.Img.create({
                        width: 200, height: 250,
                        src:"other/wizard.png"
                    })
                ]
            });
        }
        this.wizardWindow.show();
    }
});

isc.VLayout.create({
    membersMargin: 10,
    members: [configForm, sendButton]
});
