<%
// This file allows the execution of "Builtin RPCs" which are unsafe in
// environments where users are not trusted. If Visual Builder is deployed in
// production, this file should be protected by an authentication system and/or
// restricted to adminstrator users.

%><%@ page import="java.util.*"
%><%@ page import="com.isomorphic.rpc.*"
%><%@ page import="com.isomorphic.servlet.*"
%><%@ page import="com.isomorphic.datasource.*" 
%><%

// this code sets the response contentType, so do this first before any JSP output is flushed
// to the response stream.  Some (arguaby broken) app servers may fail to let us set the
// contentType here even though it's the very first line of code - which is ok
// because the browser will still execute the code as JS - it just may carp about it.
if (Boolean.valueOf(request.getParameter("checkPresent"))) {
    response.setContentType("application/javascript");

    out.print("window.consoleOperationsEnabled=true;");
    out.print("isc.RPCManager.actionURL=isc.Page.getToolsDir()+'developerConsoleOperations.jsp'");
    return;
}

RequestContext requestContext = RequestContext.instance(this, request, response, out);
RPCManager rpc;
try {
    rpc = new RPCManager(request, response, out);
    // Enable access to FilesystemDataSource
    rpc.enableAllDataSources();
} catch (ClientMustResubmitException e) { 
    return; 
}

for(Iterator i = rpc.getRequests().iterator(); i.hasNext();) {
    Object req = i.next();
    try {
	    if(req instanceof RPCRequest) {
	        RPCRequest rpcRequest = (RPCRequest)req;
            // See reference documentation on "Tools Deployment" for more information on tool security.
            //
            // To limit access to an explicit set of BuiltinRPC methods, uncomment the following lines:
            //     String[] allowedBuiltIns = {"getDefinedDatabases", "getDefinedDataSources", "importDataSources",
            //         "downloadClientContent", "setDefaultDB", "testDB", "saveDBConfig", "discoverJNDIDatabases"};
            //     String appID = rpcRequest.getAppID();
            //     if ("isc_builtin".equals(appID)) {
            //         String methodName = rpcRequest.getMethodName();
            //         if (!Arrays.asList(allowedBuiltIns).contains(methodName)) {
            //             throw new Exception("Attempt to execte RPC DMI BuiltIn '" + methodName
            //                  +"' DENIED.");
            //         }
            //     }

	        RPCResponse rpcResponse;
	        try {
	            // To limit access to BuiltIn methods defined in server.properties, replace
	            // the line below with:
	            //     rpcResponse = RPCDMI.execute(rpcRequest, rpc, rpcRequest.context);
	            rpcResponse = RPCDMI.execute(rpcRequest, rpc, requestContext, true);
	            if (rpcResponse == null) rpcResponse = rpcRequest.execute();
	        } catch (Exception e) {
                rpcResponse = IDACall._handleRPCRequestError(rpcRequest, rpc, requestContext, e);
	        }
	
	        rpc.send(rpcRequest, rpcResponse);
	    } else {
	        DSRequest dsRequest = (DSRequest)req;
            DSResponse dsResponse = null;
            try { 
                dsResponse = dsRequest.execute();
            } catch (Exception e) {
                dsResponse = IDACall._handleDSRequestError(dsRequest, rpc, requestContext, e);
            }
            rpc.send(dsRequest, dsResponse);
	    }
    } catch (Throwable t) {
        ServletTools.handleServletError(response, "Error in RPCManager.completeResponse()", t);
    }
} // for(requests)

%>