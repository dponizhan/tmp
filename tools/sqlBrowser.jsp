<%@ taglib uri="http://www.smartclient.com/taglib" prefix="isomorphic" %>
<HTML><HEAD>
<TITLE>SQL Browser</TITLE>
</HEAD><BODY BGCOLOR='#DDDDDD' CLASS=normal>
<LINK REL="stylesheet" TYPE="text/css" HREF="sourceColorizer.css">
<isomorphic:loadISC modulesDir="system/modules/" includeModules="SQLBrowser" skin="Enterprise"/>
<SCRIPT>
isc.SQLBrowser.showWindow();
</SCRIPT>

</BODY>
</HTML>
