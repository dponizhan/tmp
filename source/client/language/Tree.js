/*

  SmartClient Ajax RIA system
  Version v12.1p_2021-02-17/LGPL Deployment (2021-02-17)

  Copyright 2000 and beyond Isomorphic Software, Inc. All rights reserved.
  "SmartClient" is a trademark of Isomorphic Software, Inc.

  LICENSE NOTICE
     INSTALLATION OR USE OF THIS SOFTWARE INDICATES YOUR ACCEPTANCE OF
     ISOMORPHIC SOFTWARE LICENSE TERMS. If you have received this file
     without an accompanying Isomorphic Software license file, please
     contact licensing@isomorphic.com for details. Unauthorized copying and
     use of this software is a violation of international copyright law.

  DEVELOPMENT ONLY - DO NOT DEPLOY
     This software is provided for evaluation, training, and development
     purposes only. It may include supplementary components that are not
     licensed for deployment. The separate DEPLOY package for this release
     contains SmartClient components that are licensed for deployment.

  PROPRIETARY & PROTECTED MATERIAL
     This software contains proprietary materials that are protected by
     contract and intellectual property law. You are expressly prohibited
     from attempting to reverse engineer this software or modify this
     software for human readability.

  CONTACT ISOMORPHIC
     For more information regarding license rights and restrictions, or to
     report possible license violations, please contact Isomorphic Software
     by email (licensing@isomorphic.com) or web (www.isomorphic.com).

*/
//>	@class	Tree
//
// A Tree is a data model representing a set of objects linked into a hierarchy.
// <P>
// A Tree has no visual presentation, it is displayed by a +link{TreeGrid} or +link{ColumnTree}
// when supplied as +link{treeGrid.data} or +link{columnTree.data}.
// <P>
// A Tree can be constructed out of a List of objects interlinked by IDs or via explicitly
// specified Arrays of child objects.  See +link{attr:Tree.modelType} for an explanation of how
// to pass data to a Tree.
// <P>
// Typical usage is to call +link{treeGrid.fetchData()} to cause automatic creation of a 
// +link{ResultTree}, which is a type of Tree that automatically handles loading data on 
// demand.  For information on DataBinding Trees, see +link{group:treeDataBinding}.
// 
// @implements List
// @treeLocation Client Reference/System
// @visibility external
//<
isc.ClassFactory.defineClass("Tree", null, "List");

// List.getProperty() needs to be explicitly installed because there is a Class.getProperty()
isc.Tree.addProperties({
    getProperty : isc.List.getInstanceProperty("getProperty")
})

//> @groupDef ancestry
// Parent/child relationships
//<

//> @groupDef openList
// Managing the list of currently visible nodes based on the open state of parents
// <P>
// This state may move to the TreeGrid
// @visibility internal
//<

isc.Tree.addClassProperties({

//>	@type	DisplayNodeType
//
// Flag passed to functions as displayNodeType, telling the function whether it should work on
// folders, leaves or both at once.
//		@group	ancestry
// @visibility external
//
//	@value	null/unset                      operate on both folders and leaves
FOLDERS_AND_LEAVES:null,			
// 	@value	"folders"                       operate on folders only, ignoring leaves
FOLDERS_ONLY: "folders",			
//	@value	"leaves"                        operate on leaves only, ignoring folders
LEAVES_ONLY: "leaves",			
//<

//>	@type	LoadState
// Trees that dynamically load nodes keep track of whether each node has loaded its children.
//			
//	@value	isc.Tree.UNLOADED					children have not been loaded and are not loading
//	@value	isc.Tree.LOADING					currently in the process of loading
//	@value	isc.Tree.FOLDERS_LOADED				folders only are already loaded
//	@value	isc.Tree.LOADED						already fully loaded
//	@value	isc.Tree.LOADED_PARTIAL_CHILDREN	children form a ResultSet having only a partial
//												cache (applies only to the "paged"
//												+link{resultTree.fetchMode,fetchMode})
// @group loadState
// @visibility external
//<

//> @classAttr Tree.UNLOADED (Constant : "unloaded" : [R])
// A declared value of the enum type  
// +link{type:LoadState,LoadState}.
// @visibility external
// @constant
//<
UNLOADED: "unloaded",

//> @classAttr Tree.LOADING (Constant : "loading" : [R])
// A declared value of the enum type  
// +link{type:LoadState,LoadState}.
// @visibility external
// @constant
//<
LOADING: "loading",

//> @classAttr Tree.FOLDERS_LOADED (Constant : "foldersLoaded" : [R])
// A declared value of the enum type  
// +link{type:LoadState,LoadState}.
// @visibility external
// @constant
//<
FOLDERS_LOADED: "foldersLoaded",			

//> @classAttr Tree.LOADED (Constant : "loaded" : [R])
// A declared value of the enum type  
// +link{type:LoadState,LoadState}.
// @visibility external
// @constant
//<
LOADED: "loaded",

//> @classAttr Tree.LOADED_PARTIAL_CHILDREN (Constant : "loadedPartialChildren" : [R])
// A declared value of the enum type  
// +link{type:LoadState,LoadState}.
// @visibility external
// @constant
//<
LOADED_PARTIAL_CHILDREN: "loadedPartialChildren",


//> @type TreeModelType
//
// @value "parent" In this model, each node has an ID unique across the whole tree and a
// parent ID that points to its parent.  The name of the unique ID property can be specified
// via +link{attr:Tree.idField} and the name of the parent ID property can be specified via
// +link{attr:Tree.parentIdField}.  The initial set of nodes can be passed in as a list to
// +link{attr:Tree.data} and also added as a list later via +link{method:Tree.linkNodes}.
// Whether or not a given node is a folder is determined by the value of the property specified
// by +link{attr:Tree.isFolderProperty}.
// <br><br>
// The "parent" modelType is best for integrating with relational storage (because nodes can
// map easily to rows in a table) and collections of Beans and is the model used for DataBound
// trees.
PARENT:"parent",
//
// @value "children" In this model, nodes specify their children as a list of nodes.  The
// property that holds the children nodes is determined by +link{attr:Tree.childrenProperty}.
// Nodes are not required to have an ID that is unique across the whole tree (in fact, no ID is
// required at all).  Node names (specified by the +link{attr:Tree.nameProperty}, unique within
// their siblings, are optional but not required.  Whether or not a given node is a folder is
// determined by the presence of the children list (+link{attr:Tree.childrenProperty}).
CHILDREN:"children",
//
// @visibility external
//<

//> @type TreeFilterMode
// Mode for applying criteria to a tree.
// @value "strict" only nodes that actually match criteria are shown.  If a parent does not
//                 match the criteria, it will not be shown, even if it has children that do
//                 match the criteria
STRICT:"strict",
// @value "keepParents" parent nodes are kept if they have children which match the criteria,
//                      or, in a tree with
//                      +link{resultTree.loadDataOnDemand,loadDataOnDemand:true}, if they have
//                      not loaded children yet.
KEEP_PARENTS:"keepParents",
// @group treeFilter
// @visibility external
//<

//> @type ChildrenPropertyMode
// when heuristically finding a property that appears to contain child objects,
// the ChildrenPropertyMode determines how to chose the property appears to contain child objects
//
// @value "any" assume the first object or array value we find is the children property
ANY: "any",
// @value "array" assume the first array we find is the children property, no matter the contents
ARRAY: "array",
// @value "object" assume the first object or array of objects we find is the children property
//          (don't allow arrays that don't have objects)
OBJECT: "object",
// @value "objectArray" accept only an array of objects as the children property
OBJECT_ARRAY: "objectArray",
//
// @visibility external
//<

//> @type ScanMode
// When discovering a tree, the scanMode determines how to scan for the childrenProperty
// "node": take each node individually
// "branch": scan direct siblings as a group, looking for best fit
// "level": scan entire tree levels as a group, looking for best fit
//
// @value "node" take each node individually
NODE: "node",
// @value "branch" scan direct siblings as a group, looking for best fit
BRANCH: "branch",
// @value "level" scan entire tree levels as a group, looking for best fit
LEVEL: "level",
//
// @visibility external
//<

//> @type TieMode
//
// what to do if there is more than one possible childrenProperty when using
// scanMode "branch" or "level"
// "node": continue, but pick childrenProperty on a per-node basis (will detect
//             mixed) 
// "highest": continue, picking the childrenProperty that occurred most as the single
//            choice
// "stop": if there's a tie, stop at this level (assume no further children)
//
// @value "node" continue, but pick childrenProperty on a per-node basis (will detect mixed)
NODE: "node",
// @value "highest" continue, picking the childrenProperty that occurred most as the single choice
HIGHEST: "highest",
// @value "stop" if there's a tie, stop at this level (assume no further children)
STOP: "stop",
// @visibility external
//<


autoID: 0

});


//
//	add instance defaults to the tree
//
isc.Tree.addProperties({
	
//> @attr tree.modelType (TreeModelType: "children" : IRWA)
//
// Selects the model used to construct the tree representation.  See +link{TreeModelType} for
// the available options and their implications.
// <P>
// If the "parent" modelType is used, you can provide the initial parent-linked data set to the
// tree via the +link{attr:Tree.data} attribute.  If the "children" modelType is used, you can
// provide the initial tree structure to the Tree via the +link{attr:Tree.root} attribute.
//
// @see attr:Tree.data
// @see attr:Tree.root
//
// @visibility external
// @example nodeTitles
//<
modelType: "children",

//> @attr tree.isFolderProperty (String: "isFolder": IRW)
//
// Name of property that defines whether a node is a folder.  By default this is set to
// +link{TreeNode.isFolder}.
//
// @see TreeNode.isFolder
// @visibility external
//<
isFolderProperty: "isFolder",

//> @attr tree.defaultIsFolder (boolean : null : IR)
// Controls whether nodes are assumed to be folders or leaves by default.
// <P>
// Nodes that have children or have the +link{isFolderProperty} set to true will be considered
// folders by default.  Other nodes will be considered folders or leaves by default according
// to this setting.
// <p>
// See also +link{resultTree.defaultIsFolder} for more details on how
// <code>defaultIsFolder</code> interacts with 
// +link{treeGrid.loadDataOnDemand,loading data on demand}.
//
// @visibility external
//<

//> @attr tree.reportCollisions (Boolean : true : IR)
// If new nodes are added to a tree with modelType:"parent" which have the same
// +link{tree.idField,id field value} as existing nodes, the existing nodes are removed when
// the new nodes are added.
// <P>
// If reportCollisions is true, the Tree will log a warning in the developer console about this.
// <P>
// Note that if an id collision occurs between a new node and its ancestor, the ancestor will be
// removed and the new node will not be added to the tree.
// @visibility external
//<
reportCollisions:true,

// Whether to automatically create child -> parent links if modelType is "children"
// (so children are provided as arrays under the childrenProperty)
autoSetupParentLinks:true,

//> @attr tree.pathDelim (String : "/" : IRWA)
//
// Specifies the delimiter between node names.  The pathDelim is used to construct a unique
// path to each node. A path can be obtained for any node by calling
// +link{method:Tree.getPath} and can be used to find any node in the tree by calling
// +link{method:Tree.find}.  Note that you can also hand-construct a path - in other words
// you are not required to call +link{method:Tree.getPath} in order to later use
// +link{method:Tree.find} to retrieve it.
// <br><br>
// The pathDelim can be any character or sequence of characters, but must be a unique string
// with respect to the text that can appear in the +link{attr:Tree.nameProperty} that's used
// for naming the nodes.  So for example, if you have the following tree:
// <pre>
// one
//   two
//     three/four
// </pre>
// Then you will be unable to find the <code>three/four</code> node using
// +link{method:Tree.find} if your tree is using the default pathDelim of /.
// In such a case, you can use a different pathDelim for the tree.  For example if you used |
// for the path delim, then you can find the <code>three/four</code> node in the tree above by
// calling <code>tree.find("one|two|three/four")</code>.
// <br><br>
// The pathDelim is used only by +link{method:Tree.getPath} and +link{method:Tree.find} and
// does not affect any aspect of the tree structure or other forms of tree navigation (such as
// via +link{method:Tree.getChildren}).
//
// @see attr:Tree.nameProperty
// @see method:Tree.find
// @visibility external
//<
pathDelim:"/",

// not documented:
// direct pointer to parent node.  Only useful in non-multiLink trees (although the property 
// name itself is used in various places to establish a node's tree membership, which is 
// generally useful).  For multiLink trees, this property will just point to the parent node  
// most recently linked into the tree for this child node; it is not used for parent/child 
// relationship purposes in multiLink trees.  Instead, we use the nodeIndex.
// parentProperty : always generated, 

treeProperty : "_isc_tree", // internal property pointing back to the origin tree

//>	@attr tree.nameProperty     (String : "name" : IRW)
//
// Name of the property on a +link{TreeNode} that holds a name for the node that is unique
// among its immediate siblings, thus allowing a unique path to be used to identify the node,
// similar to a file system.  Default value is "name".  See +link{TreeNode.name} for usage.
//
// @see TreeNode.name
// @visibility external
// @example nodeTitles
//< 
nameProperty:"name",

//>	@attr tree.titleProperty	(String : "title" : IRW)
//
// Name of the property on a +link{TreeNode} that holds the title of the node as it should be
// shown to the user.  Default value is "title".  See +link{TreeNode.title} for usage.
//
// @visibility external
//<
titleProperty:"title",

//> @attr tree.idField    (String : "id" : IRA)
//
// Name of the property on a +link{TreeNode} that holds an id for the node which is unique
// across the entire Tree.  Required for all nodes for trees with modelType "parent".
// Default value is "id".  See +link{TreeNode.id} for usage.
//
// @see TreeNode.id
// @visibility external
// @example nodeTitles
//<

//> @attr tree.parentIdField (String : "parentId" : IRA)
//
// For trees with modelType "parent", this property specifies the name of the property
// that contains the unique parent ID of a node.  Default value is "parentId".  See
// +link{TreeNode.parentId} for usage.
//
// @see TreeNode.parentId
// @visibility external
// @example nodeTitles
//<

//>	@attr	tree.childrenProperty	(String : "children" : IRW)
//
// For trees with the modelType "children", this property specifies the name of the property
// that contains the list of children for a node.
// 
// @see attr:Tree.modelType
// @visibility external
// @example childrenArrays
//<
childrenProperty:"children",

//>	@attr	tree.openProperty	(String : null : IRWA)
//
// The property consulted by the default implementation of +link{Tree.isOpen()} to determine if the
// node is open or not.  By default, this property is auto-generated for you, but you can set
// it to a custom value if you want to declaratively specify this state, but be careful - if
// you display this Tree in multiple TreeGrids at the same time, the open state will not be
// tracked independently - see +link{group:sharingNodes} for more info on this.
// <p>
// For +link{tree.isMultiLinkTree(),multi-link tree}s, we do not track open state on the nodes 
// themselves, because this would mean that multiple instances of a node in the tree would open
// and close in lockstep.  Instead, open state is tracked in an internal index structure, and
// the <code>openProperty</code> is not used at all.
//
// @group	openList
// @see group:sharingNodes
// @visibility external
// @example initialData
//<

//>	@attr	tree.cacheOpenList	(boolean : true : IRWA)
//		@group	openList
//			If true, we cache the open list and only recalculate it 
//			if the tree has been marked as dirty.  If false, we get the openList
//			every time.
//<
cacheOpenList:true,

//>	@attr	tree.openListCriteria	(String | Function : null : IRWA)
//		@group	openList
//			Criteria for whether or not nodes are included in the openList
//<


//> @attr tree.data             (List of TreeNode : null : IR)
//
// Optional initial data for the tree. How this data is interpreted depends on this tree's
// +link{tree.modelType}.
// <P>
// If <code>modelType</code> is <code>"parent"</code>, the list that you provide will be passed 
// to +link{method:Tree.linkNodes}, integrating the nodes into the tree.
// <p>
// In this case the root node may be supplied explicitly via +link{Tree.root}, or auto generated,
// picking up its <code>id</code> via +link{Tree.rootValue}. Any nodes in the data with no
// explicitly specified +link{treeNode.parentId} will be added as children to this root element.
// <P>
// To create this tree:
// <pre>
// foo
//   bar
// zoo
// </pre>
// with modelType:"parent", you can do this:
// <pre>
// Tree.create({
//   data: [
//     {name: "foo", id: "foo"},
//     {name: "bar", id: "bar", parentId: "foo"},
//     {name: "zoo", id: "zoo"}
// });
// </pre>
// Or this (explicitly specified root):
// <pre>
// Tree.create({
//   root: {id: "root"},
//   data: [
//     {name: "foo", id: "foo", parentId: "root"},
//     {name: "bar", id: "bar", parentId: "foo"},
//     {name: "zoo", id: "zoo", parentId: "root"}
// });
// </pre>
// Or this (explicitly specified rootValue):
// <pre>
// Tree.create({
//   rootValue: "root",
//   data: [
//     {name: "foo", id: "foo", parentId: "root"},
//     {name: "bar", id: "bar", parentId: "foo"},
//     {name: "zoo", id: "zoo", parentId: "root"}
// });
// </pre>
// Specifying the root node explicitly allows you to give it a name, changing the way path
// derivation works (see +link{Tree.root} for more on naming the root node).
// <P>
// For <code>modelType:"children"</code> trees, the data passed in will be assumed to be an 
// array of children of the tree's root node. 
//
// @see attr:Tree.modelType
// @see TreeNode
// @visibility external
// @example nodeTitles
//<

//> @attr tree.rootValue             (String | number : null : IR)
//
// If you are using the "parent" modelType and did not specify a root node via +link{Tree.root}
// with an id (+link{Tree.idField}), then you can provide the root node's id via this property.
// See the example in +link{Tree.data} for more info.
// 
// @see Tree.data
// @visibility external
// @example nodeTitles
//<

//>	@attr	tree.root		(TreeNode : null : IRW)
//
// If you're using the "parent" modelType, you can provide the root node configuration via this
// property.  If you don't provide it, one will be auto-created for you with an empty name.
// Read on for a description of what omitting the name property on the root node means for path
// derivation.
// <p>
// If you're using the "children" modelType, you can provide the initial tree data via this
// property.  So, for example, to construct the following tree:
// <pre>
// foo
//   bar
// zoo
// </pre>
// You would initialize the tree as follows: 
// <smartclient>
// <pre>
// Tree.create({
//     root: { name:"root", children: [
//         { name:"foo", children: [
//             { name: "bar" }
//         ]},
//         { name: "zoo" }
//     ]}
// });
// </pre>
// Note that if you provide a <code>name</code> property for the root node, then the path to
// any node underneath it will start with that name.  So in the example above, the path to the
// <code>bar</code> node would be <code>root/foo/bar</code> (assuming you're using the default
// +link{attr:Tree.pathDelim}.  If you omit the name attribute on the root node, then its name
// is automatically set to the +link{attr:Tree.pathDelim} value.  So in the example above, if
// you omitted <code>name:"root"</code>, then the path to the <code>bar</code> node would be
// <code>/foo/bar</code>.
// </smartclient>
// <smartgwt>
// <pre>
// Tree tree = new Tree();
// tree.setRoot(
//     new TreeNode("root",
//         new TreeNode("foo",
//             new TreeNode("bar")),
//         new TreeNode("zoo")
//     )
// );
// </pre>
// </smartgwt>
// <br><br>
// Note: if you initialize a Tree with no <code>root</code> value, a root node will be
// auto-created for you.  You can then call +link{method:Tree.add} to construct the tree.
//
// @see Tree.modelType
// @see Tree.setRoot()
//
// @visibility external
// @example childrenArrays
//<

//discardParentlessNodes

//> @attr tree.discardParentlessNodes (Boolean : false : IRA)
// If this tree has +link{Tree.modelType,modelType:"parent"}, should nodes in the data array for the
// tree be dropped if they have an explicitly specified value for the +link{attr:Tree.parentIdField}
// which doesn't match any other nodes in the tree. If set to false these nodes will be added as
// children of the root node.
// @visibility external
//<
discardParentlessNodes:false,

//> @attr Tree.indexByLevel (boolean : false : IR)
// If enabled, the tree keeps an index of nodes by level, so that +link{tree.getLevelNodes()}
// can operate more efficiently
//<
indexByLevel: false,

//> @object TreeNode
//
// Every node in the tree is represented by a TreeNode object which is an object literal with a
// set of properties that configure the node.
// <p>
// When a Tree is supplied as +link{TreeGrid.data} to +link{TreeGrid}, you can also set
// properties from +link{ListGridRecord} on the TreeNode (e.g. setting
// +link{ListGridRecord.enabled}:<code>false</code> on the node).
//
// @treeLocation Client Reference/Grids/TreeGrid
// @treeLocation Client Reference/System/Tree
// @visibility external
//<


//> @attr treeNode.enabled  (boolean : null : IR)
// @include ListGridRecord.enabled
// @visibility external
//<

//> @attr treeNode.canDrag  (boolean : null : IRA)
// Governs whether this node can be dragged. Only has an effect if this node is displayed in
// a +link{TreeGrid} where +link{TreeGrid.canDragRecordsOut}, +link{TreeGrid.canReorderRecords}
// or +link{TreeGrid.canReparentNodes} is <code>true</code>.
// @visibility external
//<

//> @attr treeNode.canAcceptDrop (boolean : null : IRA)
//
// Governs whether dragged data (typically other <code>treeNode</code>s) may be dropped over
// this node. Only has an effect if this node is displayed in a +link{TreeGrid} where
// +link{TreeGrid.canAcceptDroppedRecords}, +link{TreeGrid.canReorderRecords} or 
// +link{TreeGrid.canReparentNodes} is true.
//
// @visibility external
//<

//> @attr treeNode.isFolder (Boolean | String : null : IR)
//
// Set to <code>true</code> or a string that is not equal to (ignoring case)
// <code>"false"</code> to explicitly mark this node as a folder.  See +link{Tree.isFolder} for
// a full description of how the +link{Tree} determines whether a node is a folder or not.
// <p>
// Note: the name of this property can be changed by setting +link{Tree.isFolderProperty}.
//
// @see Tree.isFolderProperty
// @visibility external
//<

//> @attr treeNode.name (String : null, but see below : IR)
//
// Provides a name for the node that is unique among its immediate siblings, thus allowing a
// unique path to be used to identify the node, similar to a file system.  See
// +link{Tree.getPath()}.
// <p>
// If the nameProperty is not set on a given node, the +link{TreeNode.id} will be used instead.  If
// this is also missing, +link{tree.getName()} and +link{tree.getPath()} will auto-generate a
// unique name for you.  Thus names are not required, but if the dataset you are using already
// has usable names for each node, using them can make APIs such as +link{tree.find()} more
// useful.  Alternatively, if your dataset has unique ids consider providing those as
// +link{TreeNode.id}.
// <P>
// If a value provided for the nameProperty of a node (e.g. node.name) is not a
// string, it will be converted to a string by the Tree via ""+value.
// <p>
// This property is also used as the default title for the node (see +link{Tree.getTitle()})
// if +link{TreeNode.title} is not specified.
// <p>
// Note: the name of this property can be changed by setting +link{Tree.nameProperty}.
//
// @see Tree.nameProperty
// @see Tree.pathDelim
// @see Tree.getPath
// @see Tree.getTitle
// @visibility external
//<

//> @attr treeNode.title (HTMLString : null : IR)
//
// The title of the node as it should appear next to the node icon in the +link{Tree}.  If left
// unset, the value of +link{TreeNode.name} is used by default.  See the description in
// +link{Tree.getTitle()} for full details.
// <p>
// Note: the name of this property can be changed by setting +link{Tree.titleProperty}.
//
// @see Tree.titleProperty
// @see Tree.getTitle()
// @visibility external
//<

//> @attr treeNode.id (String | Number: null : IR)
//
// Specifies the unique ID of this node.  
// <P>
// Required for trees with +link{Tree.modelType} "parent".  With modelType:"parent", the unique
// ID of a node, together with the unique ID of its parent (see +link{TreeNode.parentId}) is
// used by +link{Tree.linkNodes} to link a list of nodes into a tree.
// <p>
// Note: the name of this property can be changed by setting +link{Tree.idField}.
//
// @see TreeNode.parentId
// @see Tree.linkNodes()
// @see Tree.modelType
// @see Tree.idField
// @visibility external
//<

//> @attr treeNode.parentId (String | Number : null : IR)
//
// For trees with modelType:"parent", this property specifies the unique ID of this node's 
// parent node.
// The unique ID of a node, together with the unique ID of its parent is used by
// +link{method:Tree.linkNodes} to link a list of nodes into a tree.
// <p>
// Note: the name of this property can be changed by setting +link{Tree.parentIdField}.
//
// @see TreeNode.id
// @see Tree.linkNodes()
// @see Tree.modelType
// @see Tree.parentIdField
// @visibility external
//<

//> @attr treeNode.children (List of TreeNode : null : IRW)
//
// For trees with the modelType "children", this property specifies the children of this
// TreeNode.
// <p>
// Note: the name of this property can be changed by setting +link{Tree.childrenProperty}
//
// @see Tree.modelType
// @see Tree.childrenProperty
// @visibility external
//<

//> @attr   treeNode.icon   (SCImgURL : null : [IRW])
// This Property allows the developer to customize the icon displayed next to a node.
// Set <code>node.icon</code> to the URL of the desired icon to display and
// it will be shown instead of the standard +link{treeGrid.nodeIcon} for this node.<br>
// Note that if +link{TreeNode.showOpenIcon} and/or +link{TreeNode.showDropIcon} 
// is true for this node, customized icons for folder nodes will be appended with the 
// +link{treeGrid.openIconSuffix} or +link{treeGrid.dropIconSuffix} suffixes on state change 
// as with the standard +link{TreeGrid.folderIcon} for this treeGrid.  Also note that for
// custom folder icons, the +link{treeGrid.closedIconSuffix} will never be appended.
// <P>You can change the name of this property by setting 
// +link{TreeGrid.customIconProperty}.
// @group treeIcons
// @visibility external
//<

//> @attr   treeNode.showOpenIcon (Boolean : false : [IRWA])
// For folder nodes showing custom icons (set via +link{treeNode.icon}),
// this property allows the developer to specify on a per-node basis whether an
// open state icon should be displayed when the folder is open.
// Set <code>node.showOpenIcon</code> to true to show the open state
// icons, or false to suppress this.<br>
// If not specified, this behavior is determined by +link{TreeGrid.showCustomIconOpen}
// for this node.
// <P>You can change the name of this property by setting 
// +link{TreeGrid.customIconOpenProperty}.
// @see treeGrid.customIconProperty
// @see treeGrid.showCustomIconOpen
// @visibility external
// @group treeIcons
//<
showOpenIcon: false,

//> @attr   treeNode.showDropIcon (Boolean : false : [IRWA])
// For folder nodes showing custom icons (set via +link{treeNode.icon}),
// this property allows the developer to specify on a per-node basis whether a
// drop state icon should be displayed when the 
// user drop-hovers over this folder.<br>
// Set <code>node.showDropIcon</code> to true to show the drop state
// icon, or false to suppress this.<br>
// If not specified, this behavior is determined by +link{treeGrid.showCustomIconDrop}
// for this node.
// <P>You can change the name of this property by setting 
// +link{TreeGrid.customIconDropProperty}.
// @see treeGrid.customIconProperty
// @see treeGrid.showCustomIconDrop
// @visibility external
// @group treeIcons
//<
showDropIcon: false,

//> @attr   treeNode.showSelectedIcon (Boolean : false : [IRWA])
// For folder nodes showing custom icons (set via +link{treeNode.icon}),
// this property allows the developer to specify on a per-node basis whether a
// selected state icon should be displayed when the folder is open.
// Set <code>node.showSelectedIcon</code> to true to show the selected state
// icons, or false to suppress this.<br>
// If not specified, this behavior is determined by +link{TreeGrid.showCustomIconSelected}
// for this node.
// <P>You can change the name of this property by setting 
// +link{TreeGrid.customIconSelectedProperty}.
// @see treeGrid.customIconProperty
// @see treeGrid.showCustomIconSelected
// @visibility external
// @group treeIcons
//<
showSelectedIcon: false,

//> @attr treeNode.iconPadding (Integer : null : IRA)
// Developers may customize the padding between the folder or leaf node icon and the
// text content of the tree cell for individual nodes.
// <P>
// You can change the name of this property by setting +link{TreeGrid.iconPaddingProperty}
//
// @visibility external
// @group treeIcons
//<

//>	@attr	tree.sortProp			(String : null : IRW)
//		@group	openList
//			Name of the property to sort by.  
//			Set to null because we don't sort by default.
//<


//>	@attr	tree.sortDirection				(SortDirection : "ascending" : IRW)
//			Sort ascending by default
//<
sortDirection: "ascending",

//>	@attr tree.showRoot (Boolean : false : IRW)
// Controls whether the implicit root node is returned as part of the visible tree,
// specifically, whether it is returned in +link{getOpenList()}, which is the API view
// components typically use to get the list of visible nodes.
// <p>
// Default is to have the root node be implicit and not included in the open list, which means
// that the visible tree begins with the children of root.  This allows multiple nodes to
// appear at the top level of the tree.
// <P>
// You can set <code>showRoot:true</code> to show the single, logical root node as the only
// top-level node.  This property is only meaningful for Trees where you supplied a value for
// +link{Tree.root}, otherwise, you will see an automatically generated root node that is
// meaningless to the user.
//
// @visibility external
//<
showRoot: false,

//>	@attr tree.autoOpenRoot			(Boolean : true : IRW)
//
// If true, the root node is automatically opened when the tree is created or
// +link{Tree.setRoot()} is called.
//
// @visibility external
//<
autoOpenRoot: true,

//>	@attr tree.separateFolders	(Boolean : false : IRW)
// Should folders be sorted separately from leaves or should nodes be ordered according to
// their sort field value regardless of whether the node is a leaf or folder?
// @see tree.sortFoldersBeforeLeaves
// @visibility external
//<
separateFolders:false,

//>	@attr tree.sortFoldersBeforeLeaves (Boolean : true : IRW)
// If +link{tree.separateFolders} is true, should folders be displayed above or below leaves?
// When set to <code>true</code> folders will appear above leaves when the
// <code>sortDirection</code> applied to the tree is +link{type:SortDirection,"ascending"}
// @visibility external
//<
sortFoldersBeforeLeaves:true,

//>	@attr tree.defaultNodeTitle (String : "Untitled" : IRW)
//
// Title assigned to nodes without a +link{attr:Tree.titleProperty} value or a
// +link{attr:Tree.nameProperty} value.
//
// @visibility external
//<
defaultNodeTitle:"Untitled",

//>	@attr tree.defaultLoadState (LoadState : isc.Tree.UNLOADED : IRW)
//		@group	loadState
//			default load state for nodes where is has not been explicitly set
//<
// ResultTree defines a setter for this property.
defaultLoadState: isc.Tree.UNLOADED,

//>	@attr tree.multiLinkTree (Boolean : null : IR)
// If true, indicates this is a "multiLink" tree - ie, one that can contain the same node in more
// than one place.  Note, multiLink trees <b>must</b> use the "parent" 
// +link{tree.modelType,model type}
// <p>
// See +link{tree.linkData} and +link{resultTree.linkDataSource} for further details of 
// multiLink trees.
// @group multiLinkTree
// @visibility external
//<

//>	@attr tree.linkData (List of Record : null : IR)
// For a +link{multiLinkTree,multi-link tree}, this property specifies the parent-child 
// relationships between the nodes.  The nodes themselves are provided in +link{tree.data}.
// Note that multi-link trees must specify a +link{tree.modelType,modelType} of "parent".
// <p>
// For a regular, non-multiLink tree, the <code>linkData</code> property is ignored.
// <p>
// Minimally, the link data should include a node id, parent id and optionally the position of 
// the child within that parent 

// To describe this multi-link tree:<pre>
//   foo
//     bar
//       baz
//     zoo
//       bar
//         baz
// </pre>
// you would provide node information in the <code>data</code> property like this:<pre>
//   [
//     {id: "foo"},
//     {id: "bar"},
//     {id: "baz"},
//     {id: "zoo"}
//   ]
// </pre>
// and link information in <code>linkData</code> like this:<pre>
//   [
//     {id: "bar", parentId: "foo"},
//     {id: "baz", parentId: "bar"},
//     {id: "zoo", parentId: "foo"},
//     {id: "bar", parentId: "zoo"}
//   ]
// </pre>
// For information on databinding multi-link trees, and further discussion on multi-link trees
// generally, see +link{ResultTree.linkDataSource}
//
// @see ResultTree.linkDataSource
// @group multiLinkTree
// @visibility external
//<

//>	@attr tree.allowDuplicateChildren (Boolean : null : IR)
// For +link{tree.isMultiLinkTree(),multi-link trees}, indicates that duplicate children are 
// allowed within the same parent.  This is a special case of allowing duplicate nodes, and 
// one with fewer obvious use cases than the ability to show the same node as a child of two
// different parents.  It also adds a technical difficulty: if a parent can directly contain 
// the exact same child twice, the full path from the root to the child node is no longer 
// sufficient to unambiguously identify the node occurence.
// <p>
// Therefore, if you choose to allow duplicate children within a parent by setting this flag,
// you <b>must</b> also ensure that your +link{tree.linkData} specifies a 
// +link{tree.linkPositionField,position} for every node in the tree (note, this is position
// within parent, not some kind of unique position within the tree).  If any node does not 
// contain a position property, node linking will fail.  Also note that position values will be
// treated like array indexes internally, because this is the only way to derive missing 
// information in various circumstances (for example, dragging a node into a new parent).
// Therefore, in addition to the requirement that every node must have a position value, you 
// must also ensure that the position values of siblings below a given parent are consecutive
// integers starting at 0.  Again, this is only a requirement if you choose to set 
// <code>allowDuplicateChildren</code>
// <p>
// Also see +link{resultTree.linkDataSource} for further details of multiLink trees.
// @group multiLinkTree
// @visibility internal for now - this property works correctly for the most part, but there
// are issues with some edge cases    NO_ALLOW_DUP
//<

//>	@attr tree.allowFilterOnLinkFields (Boolean : null : IR)
// For a +link{Tree.isMultiLinkTree(),multi-link tree}, indicates whether client-side filtering
// is allowed on the fields of the +link{resultTree.linkDataSource,linkDataSource}.  When this 
// property is true, filtering operations involving link fields work as expected (ie, as if those 
// fields were present on the main +link{resultTree.dataSource,dataSource}); when this value is
// not true, criterions involving link fields are simply ignored.
// <p>
// Note, setting this property true causes filtering operations to perform an additional record
// duplication per node in the dataset to be filtered.  This adds some overhead, so you should
// consider likely data volumes before enabling it (though in fact, client-side filtering of 
// trees is relatively expensive anyway, so acceptable use cases probably already involve quite
// low data volumes)
// <p>
// This property has no effect for regular, non-multiLink trees.
// @group multiLinkTree
// @visibility external
//<

//>	@attr tree.linkPositionField (String : "position" : IR)
// The name of the "position" field in this +link{tree.linkData,multi-link tree}'s link data.
// Ignored if this tree is not a multi-link tree
// @group multiLinkTree
// @visibility external
//<
linkPositionField: "position"


//> @object NodeLocator
//
// An object containing sufficient context to unambiguously identify a single node in the tree.
// For normal trees, the node itself - or its ID - is sufficient for this purpose, but for 
// +link{tree.isMultiLinkTree(),multi-link trees}, we also need to know the node's parent, and its
// position within that parent.  For cases where we need to propagate change back up the 
// node's parent chain, in order to maintain a given parent node's openList, the node, parent  
// and position are not enough context; for those cases, we need either the node's position in
// the tree's openList, or a full path to the node.  <code>NodeLocator</code> objects contain 
// this extra context, and can be passed to APIs such as +link{tree.openFolder()}, which would
// ordinarily accept a parameter of type +link{type:TreeNode}.
//
// @treeLocation Client Reference/Grids/TreeGrid
// @treeLocation Client Reference/System/Tree
// @visibility external
//<



//> @object DiscoverTreeSettings
//
// Defines a set of properties that specify how the tree will be explored by +link{Tree.discoverTree()}
//
// @treeLocation Client Reference/Grids/TreeGrid
// @visibility external
//<

//> @attr discoverTreeSettings.childrenMode  (ChildrenPropertyMode : ChildrenPropertyMode.ANY : IR)
//
// When heuristically finding a property that appears to contain child objects, the childrenMode
// determines how to chose the property that appears to contain child objects
//
// @visibility external
//<

//> @attr discoverTreeSettings.scanMode  (ScanMode : ScanMode.BRANCH : IRW)
//
// Determines how to scan for the +link{attr:Tree.childrenProperty}
//
// @visibility external
//<

//> @attr discoverTreeSettings.tieMode  (TieMode : TieMode.NODE : IRW)
//
// What to do if there is more than one possible +link{attr:Tree.childrenProperty}
// when using scanMode "branch" or "level"
//
// @visibility external
//<

//> @attr discoverTreeSettings.newChildrenProperty  (String : null (see below) : IRW)
//
// What to rename the array of children once discovered.
// If not set, it will default to the value of +link{attr:Tree.childrenProperty} inside discoverTree()
//
// @visibility external
//<

//> @attr discoverTreeSettings.typeProperty  (String : null : IRW)
// 
// Each discovered child is labeled with a configurable "typeProperty" set to the value
// of the property that held the children
//
// @visibility external
//<

//> @attr discoverTreeSettings.nameProperty  (String : null : IRW)
//
// For string leaf nodes (if allowed), the name of the property to store the string under
// in the auto-created object
//
// @visibility external
//<

});

//
//	add methods to the tree
//
isc.Tree.addMethods({
//>	@method	tree.init()	(A)
// Initialize the tree.<br><br>
//
// Links the initially provided nodes of the tree according to the tree.modelType.
// <br><br>
//
// Gives the tree a global ID and places it in the global scope.
//
//		@group	creation		
//
//		@param	[all arguments]	(Object)	objects with properties to override from default
//
// @see group:sharingNodes
//<
init : function () {
    this.setupProperties();
    
    // if a root wasn't specified, create one
    this.setRoot(this.root || this.makeRoot(), this._autoOpenOnInit);

    // load breadth-first on init if so configured
    if (this.loadOnInit && this.loadBatchSize >= 0) this.loadSubtree(null, null, true);
},

setupProperties : function () {
	// make sure we have a global ID, but avoid doing this more than once as subclasses may
    // already have set up an ID
	if (this.ID == null || window[this.ID] != this) isc.ClassFactory.addGlobalID(this);

    // use a unique property for the parent link so that nodes moved between trees can't get
    // confused.  Advanced usages may still override.
    if (!this.parentProperty) this.parentProperty = "_parent_"+this.ID;

    // we rely on being able to scribble the isFolderProperty on nodes - if the user set this
    // to null or the empty string, create a unique identifier.
    if (!this.isFolderProperty) this.isFolderProperty = "_isFolder_"+this.ID;

    // initialize here instead of in addProperties() so we can detect if the user provided
    // explicit values - used by ResultTree.
    if (this.idField == null) this.idField = "id";
    if (this.parentIdField == null) this.parentIdField = "parentId";

	// set the openProperty if it wasn't set already
	if (!this.openProperty) this.openProperty = "_isOpen_" + this.ID;

	// Create an empty _levelNodes array if we're indexing by level
	if (this.indexByLevel) this._levelNodes = [];

    // An auto-generated property name to store precomputed lengths of open lists
    // Note, for multi-link trees, this information is stored in the node index, because a 
    // node has a different length depending on whereabouts in the tree it appears.  See 
    // _get/_setCachedNodeLength()
    this._cachedLengthProperty = "_cachedLength_" + this.ID;

    // An auto-generated property name to store a boolean flag for whether the lengths of the
    // ancestors of a node will be updated to reflect changes to the node or one of its
    // descendants.  The value of the property is actually a number (or undefined) and it
    // is said to have a true value when the number is greater than zero.
    // Note, in multi-link trees, this property is stored in the nodeIndex, against the 
    // path entry for a given node occurence; it is not scribbled onto the actual node
    this._recursionCountProperty = "_recursionCount_" + this.ID;
},

_knownProperties : ["autoOpenRoot", "childrenProperty", "defaultIsFolder", 
                    "defaultNodeTitle", "discardParentlessNodes", "idField",
                    "isFolderProperty", "modelType", "nameProperty",
                    "parentIdField", "pathDelim", "reportCollisions", "rootValue",
                    "showRoot", "titleProperty", "isMultiDSTree", "dataSource", "operation",
                    "multiLinkTree", "linkPositionField", "allowFilterOnLinkFields" ],
_$openProperty: "openProperty",
_copyKnownProperties : function (newTree) {
    var undef;

    // Copy known properties
    for (var i = 0; i < this._knownProperties.length; i++) {
        var propertyName = this._knownProperties[i],
            value = this[propertyName];
        if (value !== undef) {
            newTree[propertyName] = value;
        }
    }

    // Handle some special dynamic properties
    var value = this[this._$openProperty];
    if (value !== undef && !value.startsWith("_isOpen_")) {
        newTree[this._$openProperty] = value;
    }
},

//> @method tree.duplicate()
// Create a copy of tree. If includeData is <code>true</code>, the tree nodes are copied.
// Otherwise, just the tree settings and an empty root node are in the new tree.
//
// @param [includeData] (boolean)  Should tree nodes be copied?
// @param [includeLoadState] (boolean)  Should tree node loadState be retained?
// @return (Tree) copy of tree.
// @group creation
// @visibility smartclient
//<

duplicate : function (includeData, includeLoadState, newTree) {
    // Create a new tree object if one was not passed in (see ResultTree.duplicate())
    if (!newTree) {
        newTree = isc.Tree.create();
        this._copyKnownProperties(newTree);
    }

    // Create a clean root node
    newTree.setRoot(this.getCleanNodeData(this.getRoot(), false, false, includeLoadState));

    // Copy nodes
    if (includeData) {
        var nodes = this.getOpenList(null, isc.Tree.FOLDERS_AND_LEAVES, null, null, null, null, true);
        nodes = this.getCleanNodeData(nodes, false, false, includeLoadState);
        if (this.isMultiLinkTree()) {
            newTree.linkData = this.linkData.duplicate();
            newTree._linkNodes(nodes, null, null, null, null, newTree.createNodeLocator(
                                                    newTree.root, 
                                                    null, null,
                                                    this.pathDelim), true, null, true);
        } else {
            newTree._linkNodes(nodes);
        }
    }

    return newTree;
},


destroy : function () {
    this.destroyed = true;
    if (this._openNormalizer != null) this._openNormalizer.call(window);

    isc.ClassFactory.dereferenceGlobalID(this);
    this.Super("destroy", arguments);
},

//>	@method	tree.makeRoot()
//		@group	creation
// 			Make a new, empty root node.
//
//		@return	(Object) 	new root node.
//<
makeRoot : function () {
    var root = {};
    var undef;
    if (this.idField !== undef) root[this.idField] = this.rootValue;
    root[this.treeProperty] = this.ID;
    return root;
},

// Convert a node to a folder and return any change in the length of the node's parent
// resulting from that conversion.  Callers are expected to add the change in length to all
// parents of the node.
convertToFolder : function (node, path) {
    var nodeLocator;
    if (this.isANodeLocator(node)) {
        nodeLocator = node;
        node = node.node;
    }

    
    var pagedResultTree = (
            isc.ResultTree != null && isc.isA.ResultTree(this) && this.isPaged()),
        prevState = pagedResultTree && this.getLoadState(node),
        wasFolder = this.isFolder(node),
        changesParentLength = !wasFolder && node != this.root,
        origLength, parent;
    if (changesParentLength) {
        if (path) {
            parent = this._getParentFromIndexByPath(node, path);
        } else {
            parent = this.getParent(nodeLocator || node);
        }
        changesParentLength = (parent != null);
        if (changesParentLength) {
            var parentPath = this._deriveParentPath(path);
            origLength = this._getNodeLengthToParent(node, parent, path, parentPath);
        }
    }

    // Mark the node as a folder.
    node[this.isFolderProperty] = true;

    
    if (pagedResultTree) {
        var newState = this.getLoadState(node),
            prevFlag = (
                prevState === isc.Tree.LOADED ||
                prevState === isc.Tree.LOADED_PARTIAL_CHILDREN),
            newFlag = (
                newState === isc.Tree.LOADED ||
                newState === isc.Tree.LOADED_PARTIAL_CHILDREN);

        if (prevFlag != newFlag) {
            // Only update the _visibleDescendantsCachedProperty if it has been set before on
            // the node.
            var parent = this.getParent(node);
            if (isc.isA.Boolean(node[this._visibleDescendantsCachedProperty])) {
                this._setVisibleDescendantsCached(node, null, parent, false);
            }
        }
    }

    // Update the length of the node.
    var cachedLength = this._getCachedNodeLength(node, path);
    if (cachedLength == null) cachedLength = 0;
    this._setCachedNodeLength(node, cachedLength + this._getDeltaLength(node, wasFolder, true), path);
    

    // Return any change in the length of the parent caused by converting the node to
    // a folder.
    if (changesParentLength) {
        return this._getNodeLengthToParent(node, parent, path, parentPath) - origLength;
    } else {
        return 0;
    }
},

//>	@method	tree.makeNode()
// 			Make a new, empty node from just a path
//			NOTE: creates any parents along the chain, as necessary
//		@group	creation
//		@return	(TreeNode) 	new node
//<
// autoConvertParents forces the conversion of nodes in the parent chain to leaf or folder status as
// necessary to avoid dups.  For example, makeNode('foo') followed by makeNode('foo/') would
// normally create a leaf foo and a folder foo.  If autoConvertParents is set to true, there would
// only be the folder foo regardless of the makeNode() call order.
//
makeNode : function (path, autoConvertParents) {

    isc.Tree._assert(!this.isMultiLinkTree(), "makeNode() must not be called for a " +
                        "multi-link tree; linkNodes() is the only supported approach!");

	// first try to find the node -- if we can find it, just return it
	var node = this.find(path);
	if (node) {
        if (autoConvertParents) {
            var deltaLength = this.convertToFolder(node);
            if (deltaLength != 0 && node != this.root) {
                this._updateParentLengths(this.getParent(node), deltaLength);
            }
        }
        return node;
    }

    // The path will be in the format:
    // "root/p1/p2/p3/newLeaf" or
    // "/p1/p2/p3/newFolder/"
    //      where p1 etc are existing parents
	
	// get the parent path for this node 
	var pathComponents = path.split(this.pathDelim);    // array:['','p1','p2','p3','newNode']
    
    // The path must start at the root - if it doesn't, assume it was intended to
    var rootName = this.getRoot()[this.nameProperty];
    if (rootName.endsWith(this.pathDelim)) {
        rootName = rootName.substring(0, rootName.length - this.pathDelim.length);
    }
    
    if (pathComponents[0] != rootName) pathComponents.addAt(rootName, 0);
    
    // If we're making a folder rather than a leaf, the path passed in will finish with the path
    // delimiter, so we'll have a blank at the end of the array
    var newNodeName = pathComponents[pathComponents.length - 1],
        makingLeaf = (newNodeName != isc.emptyString);
        
    if (!makingLeaf) {
        // chop off the empty slot at the end
        pathComponents.length = pathComponents.length -1;
        newNodeName = pathComponents[pathComponents.length - 1]
    }
//    this.logWarn("makingLeaf: " + makingLeaf + ", pathComponents:" + pathComponents);    
    
    var parentPath = pathComponents.slice(0, (pathComponents.length -1)).join(this.pathDelim) 
                     + this.pathDelim;

    
	// get a pointer to the parent
	var parent = this.find(parentPath);
    
    
    if (parent == null) {
        parent = this.find(parentPath.substring(0, parentPath.length - this.pathDelim.length));
    }

    // We need to create the parent if it doesn't exist, or is a leaf, and we're not converting
    // parents.  Call ourselves recursively to get the parent.
	// NOTE: this should bottom out at the root, which should always be defined
	if (!parent) {
        parent = this.makeNode(parentPath, autoConvertParents);
    } else if (!this.isFolder(parent)) {
        // If necessary convert the leaf parent to a folder
        var deltaLength = this.convertToFolder(parent);
        if (deltaLength != 0 && parent != this.root) {
            this._updateParentLengths(this.getParent(parent), deltaLength);
        }
    }
    
	// make the actual node
    var node = {};
	
	// set the name and path of the node
	node[this.nameProperty] = newNodeName;
    
    // making a folder - convert the node to a folder
    if (!makingLeaf) {
        var deltaLength = this.convertToFolder(node);
        if (deltaLength != 0 && node != this.root) {
            this._updateParentLengths(this.getParent(node), deltaLength);
        }
    }

	// and add it to the tree
	return this._add(node, parent);
},


//>	@method	tree.isRoot()
//
// Return true if the passed node is the root node.
//
// @param	node	(TreeNode) 	node to test
// @return			(Boolean)	true if the node is the root node
//
// @visibility external
//<
isRoot : function (node) {
	return this.root == node;
},

//>	@method	tree.setupParentLinks()	(A)
//			Make sure the parent links are set up in all children of the root.
//			This lets you create a simple structure without back-links, while
//			 having the back-links set up automatically
//		@group	ancestry		
//
//		@param	[node]	(TreeNode)	parent node to set up child links to
//									 (default is this.root)
//<
setupParentLinks : function (node) {
	// if the node wasn't passed in, use the root
	if (!node) node = this.root;
    return this._traverse(node, true, false, false, false);
},

// Recursively traverse the tree to implement setupParentLinks() and to assign the correct
// node lengths to the node and its descendants.  The setupParentLinks and assignCachedLengths
// are boolean arguments.  The node is the tree node and is expected to exist.  The last
// argument, recurse, is a boolean flag used internally to determine whether the current
// execution is at the top level of recursive calls to this method.
_traverse : function (node, setupParentLinks, assignCachedLengths, canonicalizeChildren, recurse) {
    

    if (setupParentLinks && node[this.idField] != null && !this.isMultiLinkTree()) {
        this._addNodeToIndex(node[this.idField], node);
    }

    // get the children array of the node
    var children = node[this.childrenProperty];
    

    if (children) {
        if (setupParentLinks) {
            // current assumption whenever loading subtrees is that if any children are returned
            // for a node, it's the complete set, and the node is marked "loaded"
            this.setLoadState(node, isc.Tree.LOADED);
        }

        // handle the children property containing a single child object.
        if (!(isc.isAn.Array(children) || isc.isA.ResultSet(children))) {
            children = node[this.childrenProperty] = [children];
        }
    }

    if (children) {
        // for each child
        var isArray = isc.isAn.Array(children),
            isResultSet = !isArray && isc.isA.ResultSet(children);
        
        var length = (isResultSet ? children._getCachedLength() : children.getLength());
        for (var i = 0; i < length; ++i) {
            var child = (isArray ? children[i] : children.getCachedRow(i));

            // if the child is null, skip it
            if (!child) continue;

            if (setupParentLinks) {
                // set the parentId on the child if it isn't set already
                if (child[this.parentIdField] == null && node[this.idField] != null)
                    child[this.parentIdField] = node[this.idField];

                // set the child's parent to the parent
                child[this.parentProperty] = node;

                this._addToLevelCache(child, node);
            }

            // If the child is a folder, call this method recursively on the child.
            if (this.isFolder(child)) {
                this._traverse(
                    child, setupParentLinks, assignCachedLengths, canonicalizeChildren, true);
            } else if (setupParentLinks && child[this.idField] != null && !this.isMultiLinkTree()) {
                this._addNodeToIndex(child[this.idField],  child); // link into the nodeIndex
            }

            // Assign the _cachedLengthProperty on the child.  This is done after the recursive
            // call as the child's length can depend on the node lengths of its children.
            if (assignCachedLengths) {
				
                child[this._cachedLengthProperty] = this._getNodeLength(child);
            }
        }
    }

    if (canonicalizeChildren && children) {
        
        children = node[this.childrenProperty] = this._canonicalizeChildren(node, children, true);
        if (isc.isA.ResultSet(children)) {
            if (!(children.lengthIsKnown() && children.allMatchingRowsCached())) {
                this._setVisibleDescendantsCached(node, false, null, false);
            }
        }
    }

    // If this is the top level of the recursion, then the _cachedLengthProperty has been set
    // on all nodes except for the original node.  Set node[this._cachedLengthProperty] here.
    if (assignCachedLengths && !recurse) {
        this._setCachedNodeLength(node, this._getNodeLength(node));
    }
},

//> @method tree.linkNodes()
// Adds an array of tree nodes into a Tree of +link{modelType} "parent".   
// <P>
// The provided TreeNodes must contain, at a minimum, a field containing a unique ID for the
// node (specified by +link{attr:Tree.idField}) and a field containing the ID of the node's 
// parent node (specified by +link{attr:Tree.parentIdField}).
// <P>
// This method handles receiving a mixture of leaf nodes and parent nodes, even out of order and
// with any tree depth.
// <P>
// Nodes may be passed with the +link{childrenProperty} already populated with an Array of
// children that should also be added to the Tree, and this is automatically handled.
//
// @param nodes (Array of TreeNode) list of nodes to link into the tree.
//
// @see attr:Tree.data
// @see attr:Tree.modelType
// @visibility external
//<
connectByParentID : function (records, idProperty, parentIdProperty, rootValue, isFolderProperty) {
    this._linkNodes(records, idProperty, parentIdProperty, rootValue, isFolderProperty);
},
connectByParentId : function (records, idProperty, parentIdProperty, rootValue, isFolderProperty) {
    this._linkNodes(records, idProperty, parentIdProperty, rootValue, isFolderProperty);
},


// NOTE: this does not handle multi-column (multi-property) primary keys
linkNodes : function (records, idProperty, parentIdProperty, rootValue, isFolderProperty,
                        contextNode, suppressDataChanged, linkData) 
{
    return this._linkNodes(records, idProperty, parentIdProperty, rootValue, 
                            isFolderProperty, contextNode, suppressDataChanged, linkData);
},
_linkNodes : function (records, idProperty, parentIdProperty, rootValue, isFolderProperty, 
                        contextNode, suppressDataChanged, linkData, linkSubTreeOnly) 
{

    if (this.modelType == "fields") {
        this.connectByFields(records);
        return;
    }

    var contextNodeLocator;
    if (this.isANodeLocator(contextNode)) {
        contextNodeLocator = contextNode;
        contextNode = contextNode.node;
    }

    if (this.isMultiLinkTree()) {
        this._multiLinkNodes(records, idProperty, parentIdProperty, null, rootValue, 
                                isFolderProperty, contextNodeLocator || contextNode, 
                                suppressDataChanged, linkData, linkSubTreeOnly);
        return;
    }

    records = records || this.data;
    idProperty = (idProperty != null) ? idProperty : this.idField;
    parentIdProperty = (parentIdProperty != null) ? parentIdProperty : this.parentIdField;
    rootValue = (rootValue != null) ? rootValue : this.rootValue;
    linkData = linkData || this.linkData;
    
    var newNodes = [];
    newNodes.addList(records);
    
    // build a local index of the nodes passed in. this will allow us to find parents within the
    // tree without having to do multiple array.finds (so it'll be linear time lookup)
    var localNodeIndex = {};
    for (var i = 0; i < newNodes.length; i++) {
        var id = newNodes[i][idProperty];
        if (id != null) localNodeIndex[id] = newNodes[i];
    }
    
    for (var i = 0; i < newNodes.length; i++) {
        var node = newNodes[i];
        
        // We look up parent chains and add interlinked nodes in parent order
        // so if we already have this node in the tree, skip it
        if (this._compareNodeInIndex(node[idProperty], node)) continue;
        if (node == null) continue;
        
        // Our parentId property may point to another node passed in (potentially in a chain)
        // In this case, ensure we link these parents into the tree first.
        var newParentId = node[parentIdProperty],
            newParent = newParentId != null ? localNodeIndex[newParentId] : null,
            newParents = []
        ;
        
        while (newParent != null) {
            if (newParent) newParents.add(newParent);
            newParentId = newParent[parentIdProperty];            
            // Note: don't infinite loop if parentId==id - that's bad data, really, but such
            // datasets exist in the wild..
            newParent = newParentId != null && newParentId != node[parentIdProperty] ? localNodeIndex[newParentId] : null;            
        }

        for (var ii = newParents.length; ii--; ) {
            if (this.logIsDebugEnabled(this._$treeLinking)) {
                this.logDebug("linkNodes running - adding interlinked parents to the tree in "+
                    " reverse hierarchical order -- currently adding node with id:"+
                    newParents[ii][idProperty], this._$treeLinking);
            }
            this._linkNode(newParents[ii], idProperty, parentIdProperty,
                           contextNode, rootValue);
            // at this point the parent is linked into the real tree --
            // blank out the entry in the local index so other nodes linked to it do
            // the right thing
            delete localNodeIndex[newParents[ii][idProperty]];
        }
        // Actually link in this node
        this._linkNode(node, idProperty, parentIdProperty, contextNode, rootValue);
        // blank out this slot - this will avoid us picking up this node in the newParents
        // array of other nodes when it has already been added to the tree if appropriate
        delete localNodeIndex[node[idProperty]];
    }

    this._clearNodeCache(true);
    if (!suppressDataChanged) this.dataChanged();
},

NULL_PARENT_IDENTIFIER: "_$_null_parent_$_",
_multiLinkNodes : function (records, idProperty, parentIdProperty, positionProperty, rootValue, 
                                isFolderProperty, contextNode, suppressDataChanged, linkData,
                                linkSubTreeOnly) 
{

    records = records || this.data;
    this._assert(records != null);

    idProperty = (idProperty != null) ? idProperty : this.idField;
    parentIdProperty = (parentIdProperty != null) ? parentIdProperty : this.parentIdField;
    positionProperty = (positionProperty != null) ? positionProperty : this.linkPositionField;
    rootValue = (rootValue != null) ? rootValue : this.rootValue;
    linkData = linkData || this.linkData;
    
    var newNodes = [];
    newNodes.addList(records);

    this._multiLinking = true;
    
    // build a local index of the nodes passed in. this will allow us to find parents within the
    // tree without having to do multiple array.finds (so it'll be linear time lookup)
    var localNodeIndex = {};
    for (var i = 0; i < records.length; i++) {
        var id = records[i][idProperty];
        if (id != null) {
            // Get the node from the current nodeIndex if possible - this is necessary when we 
            // have the same child in multiple places in the tree, and we are loading on demand,
            // and the server is sending back only the direct children of the parent we just 
            // opened (as opposed to a subtree of that parent's descendants)
            localNodeIndex[id] = this._getNodeFromIndex(newNodes[i]);
            if (!localNodeIndex[id]) {
                localNodeIndex[id] = newNodes[i];
            }
        }
    }
    var localChildToParentIndex = {},
        localParentToChildIndex = {};
    var topLevel = [], parents;
    for (var i = 0; i < linkData.length; i++) {
        var id = linkData[i][idProperty],
            pid = linkData[i][parentIdProperty];
        if (id == null) {
            this.logWarn("Found null child ID in linkData.  Skipping link record: " + 
                                    isc.echoAll(linkData[i]));
            continue;
        }
        if (!localChildToParentIndex[id]) {
            localChildToParentIndex[id] = [];
        }
        localChildToParentIndex[id].add(localNodeIndex[pid]);
        
        if (pid == null) {
            // The presence of a link record with a null parent ID means the child node is a 
            // top-level node.  We don't require an explicit link record for this if the node 
            // has children, but we have no other way to specify a random top-level leaf
            topLevel.add({
                node: localNodeIndex[id],
                linkRecord: linkData[i]
            });
        } else {
            if (!localParentToChildIndex[pid]) {
                localParentToChildIndex[pid] = [];
            }
            localParentToChildIndex[pid].add({
                node: localNodeIndex[id],
                linkRecord: linkData[i]
            });
        }
    }

    if (linkSubTreeOnly) {
        
        // This means we are being asked to link in just the children of the contextNode, so 
        // limit "topLevel" to just that node.  This is an important optimization for databound
        // trees, even if they are loaded entirely upfront, because:
        // - With linkData and node data being provided separately, it is common that a fetch 
        //   against the node dataSource will return all the nodes in the tree
        // - By default, databound trees treat nodes with no children as folders with unknown 
        //   contents, until a fetch for the node's children has been attempted.  Therefore, 
        //   a fetch is issued when the user tries to open a node with no children, even in the
        //   mainstream case that the node has no children because it is genuinely a leaf
        if (contextNode.node == this.root) {
            if (this.rootValue) {
                var explicitChildren = localParentToChildIndex[contextNode.node[idProperty]];
                if (explicitChildren) {
                    topLevel.addAll(explicitChildren);
                }
            } else {
                for (var parentId in localParentToChildIndex) {
                    if (!isc.propertyDefined(localChildToParentIndex, parentId)) {
                        topLevel.add({
                            node: localNodeIndex[parentId],
                            linkRecord: null  
                        });
                    }
                }
            }
            localParentToChildIndex[this.NULL_PARENT_IDENTIFIER] = topLevel;
            parents = [{id: this.NULL_PARENT_IDENTIFIER, path: this.pathDelim}];
        } else {
            var children = localParentToChildIndex[contextNode.node[idProperty]];
            if (children) {
                topLevel = children;
            } else {
                // Otherwise, the parent whose children we have been asked to link in, does not 
                // have any children, so there is nothing to do except mark the parent node loaded
                this.setLoadState(contextNode.node, isc.Tree.LOADED);
            }
            parents = [{id: contextNode.node[idProperty], path: contextNode.path}];
        }
    } else {

        // Any key in the parent-to-child index that is not in the child-to-parent index is a 
        // direct child of root, but only if this tree has no root value.  If there is a 
        // rootValue, top-level is the children of that key
        if (rootValue) {
            topLevel = localParentToChildIndex[rootValue];
        } else {
            for (var parentId in localParentToChildIndex) {
                if (!rootValue && !isc.propertyDefined(localChildToParentIndex, parentId)) {
                    topLevel.add({
                        node: localNodeIndex[parentId],
                        linkRecord: null  
                    });
                }
            }
        }

        localParentToChildIndex[this.NULL_PARENT_IDENTIFIER] = topLevel;
        parents = [{id: this.NULL_PARENT_IDENTIFIER, path: this.pathDelim}];
    }

    // And any key that is in neither PtC or CtP index is an unlinked node - we may add those 
    // as top-level leaf nodes later, depending on the setting of discardParentlessNodes

    // Now, start with the children of "_$_null_parent" in localParentToChildIndex.  Hook up 
    // those nodes, and build a list of their children.  Hook up those child nodes, and build 
    // a list of *their* children.  Rinse and repeat until there are no more children
    while (parents.length > 0) {
        var thisLevelNodes = [];
        for (var j = 0; j < parents.length; j++) {
            var parentId = parents[j].id,
                parentPath = parents[j].path,
                parent = localNodeIndex[parentId] || this._getNodeFromIndex(parentId),
                nodes = localParentToChildIndex[parentId];
            
            if (!nodes) continue;  // Leaf node

            nodes.sortByProperty("node", true, function(item, propertyName, context) {
                return item.linkRecord ? item.linkRecord[positionProperty] : null;
            });

            var dupChildren = {};
            if (!this.allowDuplicateChildren) {
                for (var p = 0; p < nodes.length; p++) {
                    for (var q = p+1; q < nodes.length; q++) {
                        if (!nodes[p].node || !nodes[q].node) continue;
                        if (nodes[p].node[idProperty] == nodes[q].node[idProperty]) {
                            this.logWarn("Node with ID " + nodes[p].node[idProperty] + 
                                " appears more than once amongst the children of " + 
                                parentPath + 
                                //", but allowDuplicateChildren is not set for this multi-link tree" +
                                ".  We will ignore all but the first of these duplicates.");
                            dupChildren[q] = true;
                        }
                    }
                }
            }

            for (var i = 0; i < nodes.length; i++) {
                if (dupChildren[i]) continue;
                var node = nodes[i].node,
                    path = parentPath + (parentPath.endsWith(this.pathDelim) ? "" : this.pathDelim);

                if (!node) {
                    // It could be that we have link data for a node we know nothing about.  One
                    // possibility is a broken fetch; another is that we are re-linking the tree
                    // after a filter operation that has filtered out the node in question; yet
                    // another is that we are duplicating a tree that has not yet had any nodes 
                    // linked into it
                    continue;
                }

                path += node[idProperty];
                // If allowDuplicateChildren is set, position is mandatory because we use it to 
                // disambiguate duplicate parent/child combinations.  If autoUpdateSiblingNodesOnDrag
                // is set, position is mandatory because it is presumably important to you 
                // and because otherwise we will end up applying deltas to null values)
                if ((this.allowDuplicateChildren || this.autoUpdateSiblingNodesOnDrag) && 
                      (nodes[i].linkRecord == null || nodes[i].linkRecord[positionProperty] == null)) 
                {
                    this.logWarn("Node at path " + path + " does not specify a position " +
                            "in the linkData.  If you specify allowDuplicateChildren:true " +
                            "or autoUpdateSiblingNodesOnDrag:true " +
                            "for a multi-link tree, you MUST provide a position attribute " +
                            "for every node.  Cannot continue");
                    return;
                }
                if (this.allowDuplicateChildren) {
                    path +=  this.pathDelim + nodes[i].linkRecord[positionProperty];
                }
                var parentNodeLocator = this.createNodeLocator(
                    parent,   // node
                    parents[j].parent ? parents[j].parent[this.idField] : null,  // parentId
                    parents[j].position,  // position
                    parentPath,  // path
                    null,  // openListIndex - not applicable here
                    true  // Force creation of a nodeLocator object even if some of the
                          // elements are null or undefined
                );
                this._linkNode(node, idProperty, parentNodeLocator, contextNode, rootValue, nodes[i].linkRecord, path);
                thisLevelNodes.add({
                    id: node[idProperty],
                    parent: parent,
                    position: nodes[i].linkRecord ? nodes[i].linkRecord[positionProperty] : null,
                    path: path
                });
            }
        }
        parents = thisLevelNodes;
    }

    delete this._multiLinking;

    this._clearNodeCache(true);
    if (!suppressDataChanged) this.dataChanged();
},

// old synonyms for backcompat
connectByParentID : function (records, idProperty, parentIdProperty, rootValue, isFolderProperty) {
    this._linkNodes(records, idProperty, parentIdProperty, rootValue, isFolderProperty);
},
connectByParentId : function (records, idProperty, parentIdProperty, rootValue, isFolderProperty) {
    this._linkNodes(records, idProperty, parentIdProperty, rootValue, isFolderProperty);
},

// _linkNode - helper to actually attach a node to our tree - called from the for-loop in _linkNodes()
// returns true if the node was successfully added to the tree.
_$treeLinking:"treeLinking",
_linkNode : function (node, idProperty, parentIdProperty, contextNode, rootValue, linkRecord, path) {
        
    var logDebugEnabled = this.logIsDebugEnabled(this._$treeLinking);

    var id = node[idProperty],
        undef,
        nullRootValue = (rootValue == null);

    // Although the parameter is called "parentIdProperty", multiLink trees must be linked up
    // by reference to the actual parent object - IDs don't cut it.  So in some flows, this 
    // parameter is actually the parent object, or a NodeLocator representing a particular 
    // occurence of the parent object, rather than the name of the parent ID field on the child
    // record
    var parentNodeLocator, parent, parentId;
    if (this.isANodeLocator(parentIdProperty)) {
        parentNodeLocator = parentIdProperty;
        parent = parentNodeLocator.node;
        parentId = parent ? parent[idProperty] : null;
    } else if (isc.isAn.Object(parentIdProperty)) {
        parent = parentIdProperty,
        parentId = parent[idProperty];
    } else {
        parentId = node[parentIdProperty];
        parent = this._getNodeFromIndex(parentId);
        // Note explicit === for emptyString comparison necessary as
            // 0 == "", but zero is a valid identifier
        var nullParent = (parentId == null || parentId == -1 || parentId === isc.emptyString);
    }

    // Ensure that the parent we use for linking is the actual parent object we have in the tree,
    // as opposed to a feesh copy of the same thing we have just received from the server
    if (this.isMultiLinkTree()) {
        parent = this._getNodeFromIndex(parentId);
        if (parentNodeLocator) {
            parentNodeLocator.node = parent;
        }
    }

    var position = linkRecord ? linkRecord[this.linkPositionField] : null;

    if (parent) {
        if (logDebugEnabled) {
            this.logDebug("found parent " + parent[idProperty] + 
                         " for child " + node[idProperty], this._$treeLinking);
        }
        this.__add(node, parentNodeLocator || parent, position, linkRecord, path);
    } else if (!nullRootValue && parentId == rootValue) {

        if (logDebugEnabled) {
            this.logDebug("root node: " + node[idProperty], this._$treeLinking);
        }
        // this is a root node
        this.__add(node, this.root, position, linkRecord, path);

    } else {
        // Drop nodes with an explicit parent we can't find if discardParentlessNodes is true
        if (!nullParent && this.discardParentlessNodes) {
            this.logWarn("Couldn't find parent: " + parentId + " for node with id:" + id,
                         this._$treeLinking);
        } else {

            var defaultParent = contextNode || this.root;
            // if a contextNode was supplied, use that as the default parent node for all
            // nodes that are missing a parentId - this is for loading immediate children
            // only, without specifying a parentId
            if (logDebugEnabled) {
                this.logDebug("child:" + node[idProperty] + 
                              (nullParent ? " has no explicit parent " :
                                        (" unable to find specified parent:" + parentId)) +
                              "- linking to default node " +
                              defaultParent[idProperty], this._$treeLinking);
            }            
            this.__add(node, defaultParent, position, linkRecord, path);
        }
    }
},

//> @method tree.isMultiLinkTree()
// Returns true if this is a <i>multi-link</i> tree - ie, one that can contain the same node in
// more than one place.  Otherwise, returns false.
// <smartclient>The default implementation simply returns the value of the 
// <code>multiLinkTree</code> flag</smartclient>
// <p>
// See +link{tree.linkData} and +link{resultTree.linkDataSource} for further details of 
// multiLink trees.
//
// @visibility external
//<
isMultiLinkTree : function() {
    return !!this.multiLinkTree
},

getNodeLocator : function(recordIndex) {
    if (recordIndex == -2) {  // This indicates "over an empty part of the body", and in a regular 
                              // TreeGrid results in a drop on root.  So let's do the same
        return this.createNodeLocator(this.root, null, null, this.pathDelim);
    }
    return this.recordNumberToNodeLocatorIndex[recordIndex];
},

//> @method tree.getPathForOpenListIndex()
// This method returns the path to the node at the specified index within the current open
// list of nodes in this tree. Note that for a node that appears in more than one place in a
// +link{tree.isMultiLinkTree(),multi-link tree}, the returned path will be the visible
// path to the node in the specified index.
// <P>
// See +link{tree.getPath()} for more information on paths for TreeNodes.
//
// @param recordIndex (Integer) position of a node within the open list of the tree
// @return (String) path to the node
// @visibility external
//
//<
getPathForOpenListIndex : function(recordIndex) {
    var nodeLocator = this.getNodeLocator(recordIndex);
    if (nodeLocator == null) {
        return null;
    } else {
        return nodeLocator.path;
    }
},


//> @method tree.createNodeLocator()
// Returns a +link{object:NodeLocator} object suitable for passing to methods, such as
// +link{tree.getParent()}, which require a <code>NodeLocator</code> when the tree is 
// +link{tree.isMultiLinkTree(),multi-linked}.  Note, <code>NodeLocator</code>s are specific to
// multiLink trees; they are never required for regular trees.
//
// @param node (TreeNode) the child node
// @param parent (TreeNode) the parent node
// @param [position] (Integer) the child node's position within the parent
// @param path (String) the full path to the child node
// @param [openListIndex] (Integer) the index of the node occurence in the tree's current openList.
//                                This is the same as the record index of the node in an 
//                                associated +link{class:TreeGrid}
//
// @visibility external
//<
createNodeLocator : function(node, parent, position, path, openListIndex, alwaysCreate) {
    
    var parentId;
    if (!isc.isAn.Object(node)) {
        node = this._getNodeFromIndex(node);
    } 
    if (isc.isA.String(parent)) {
        parentId = parent;
    } else {
        parentId = parent ? parent[this.idField] : null;
    }
    if (!alwaysCreate) {
        if (!node) {
            return null;
        }
        if (parentId == null && path == null && openListIndex == null) {
            return null;
        }
    }
    if (parentId == null || (position == null && this.allowDuplicateChildren)) {
        var info = this._deriveParentChildPositionFromPath(path);
        parentId = parentId || info.parentId;
        position = (position != null ? position : info.position);
    }
    var nodeLocator =  {
        node: node, 
        parentId: parentId, 
        position: this.allowDuplicateChildren ? position : null, 
        path: path, 
        openListIndex: openListIndex
    };
    return nodeLocator;
},

createNodeLocatorWithRelativePosition : function(node, parent, relPos, path) {
    
    var parentId;
    if (node == null) {
        return null;
    }
    if (isc.isA.String(parent)) {
        parentId = parent;
    } else {
        parentId = parent ? parent[this.idField] : null;
    }
    var entry = this._getNodeIndexEntry(node);
    if (!entry) return null;
    if (isc.isAn.Object(parentId)) {
        parentId = parentId[this.idField];
    }

    var matching = entry.positions.findAll("parentId", parentId);
    
    var position;
    if (!matching || matching.length < 1) {
        position = relPos;
    } else if (matching.length == 1) {
        position = matching[0].position;
    } else {
        matching.sortByProperty("position", true);
        position = matching[relPos].position;
    }

    var nodeLocator =  {
        node: isc.isAn.Object(node) ? node : this._getNodeFromIndex(node),
        parentId: parentId, 
        position: position, 
        path: path, 
        openListIndex: null
    };
    return nodeLocator;
},

isANodeLocator : function(obj) {
    return isc.Tree.isANodeLocator(obj);
},

// nodeIndex API - nothing else should read or write nodeIndex directly
_getNodeIndexEntry : function (nodeId) {
    if (!this.nodeIndex) return null;
    if (this.isANodeLocator(nodeId)) {
        nodeId = nodeId.node;
    }
    
    if (isc.isAn.Object(nodeId) && nodeId[this.idField] != null) {
        nodeId = nodeId[(this.idField)];
    }
    if (nodeId == null) {
        nodeId = "";
    }
    return this.nodeIndex[nodeId];
},

_getNodeFromIndex : function (nodeId) {
    var indexEntry = this._getNodeIndexEntry(nodeId);
    if (this.isMultiLinkTree()) {
        return indexEntry == null ? null : indexEntry.node;
    } else {
        return indexEntry;
    }
},

_isNodeInIndex : function (nodeId) {
    return !(this._getNodeIndexEntry(nodeId) == null);
},

_getPathEntryFromIndex : function (nodeLocator) {
    
    var indexEntry = this._getNodeIndexEntry(nodeLocator.node);
    if (!indexEntry) {
        return null;
    }
    
    return indexEntry.paths[nodeLocator.path];
},

_getPositionEntryFromIndex : function (nodeOrNodeLocator, parentId, position) {
    
    var node = nodeOrNodeLocator;
    if (this.isANodeLocator(nodeOrNodeLocator)) {
        node = nodeOrNodeLocator.node;
        parentId = nodeOrNodeLocator.parentId;
        position = nodeOrNodeLocator.position;
    }
    var indexEntry = this._getNodeIndexEntry(node);
    if (!indexEntry) {
        return null;
    }
    
    var pos = indexEntry.positions;
    for (var i = 0; i < pos.length; i++) {
        if (pos[i].parentId == parentId &&
                (!this.allowDuplicateChildren || (pos[i].position == position)))
        {
            return pos[i];
        }
    }
    return null;
},

_isParentLinkInIndex : function (nodeLocator) {
    
    
    return this._getPositionEntryFromIndex(nodeLocator) != null;
},

_getFirstParentFromIndex : function (nodeId) {
    
    if (this.isANodeLocator(nodeId)) {
        nodeId = nodeId.node;
    }
    if (isc.isAn.Object(nodeId)) {
        nodeId = nodeId[this.idField];
    }
    var indexEntry = this._getNodeIndexEntry(nodeId);
    if (!indexEntry || !indexEntry.positions || indexEntry.positions.length == 0 ||
                            indexEntry.node == this.getRoot()) 
    {
        return null;
    } else {
        if (indexEntry.positions[0].parentId == null) {
            // XXX: Is this a valid assumption???
            return this.getRoot();
        } else {
            return this._getNodeFromIndex(indexEntry.positions[0].parentId);
        }
    }
},

_getParentsFromIndex : function (nodeId) {
    
    if (this.isANodeLocator(nodeId)) {
        nodeId = nodeId.node;
    }
    if (isc.isAn.Object(nodeId)) {
        nodeId = nodeId[this.idField];
    }
    var indexEntry = this._getNodeIndexEntry(nodeId);

    if (indexEntry.node == this.root) return null;

    if (!indexEntry || !indexEntry.positions || indexEntry.positions.length == 0) {
        return [];
    } else {
        var parents = [];
        for (var i = 0; i < indexEntry.positions.length; i++) {
            if (indexEntry.positions[i].parentId == null) {
                // XXX: Is this a valid assumption???
                parents.add(this.getRoot());
            } else {
                parents.add(this._getNodeFromIndex(indexEntry.positions[i].parentId));
            }
        }
        return parents;
    }
},

_getPositionsFromIndex : function (nodeId) {
    
    if (this.isANodeLocator(nodeId)) {
        nodeId = nodeId.node;
    }
    if (isc.isAn.Object(nodeId)) {
        nodeId = nodeId[this.idField];
    }
    var indexEntry = this._getNodeIndexEntry(nodeId);
    if (!indexEntry || !indexEntry.positions || indexEntry.positions.length == 0) {
        return [];
    } else {
        return indexEntry.positions;
    }
},

_getParentFromIndexByPath : function(nodeId, path) {
    
    if (path == this.pathDelim) return null;  // Root doesn't have any parents, obviously...
    if (isc.isAn.Object(nodeId)) {
        nodeId = nodeId[this.idField];
    }
    if (nodeId == null) return null;
    var indexEntry = this._getNodeIndexEntry(nodeId);
    
    var parentPath = this._deriveParentPath(path);
    if (parentPath == this.pathDelim) { 
        return this.root;
    } else {
        var parentInfo = this._deriveIdAndPositionFromPath(parentPath);
        if (!parentInfo || !parentInfo.id) {
            return null;
        }
        return this._getNodeFromIndex(parentInfo.id);
    }
},

_compareNodeInIndex : function (nodeId, node, parentId, position) {
    if (!this.nodeIndex) return false;
    if (this.isMultiLinkTree()) {
        if (!this.nodeIndex[nodeId]) {
            return node == null;
        }
        var same = this.nodeIndex[nodeId].node == node;
        if (same && parentId) {
            same = false;
            var pos = this.nodeIndex[nodeId].positions;
            for (var i = 0; i < pos.length; i++) {
                if (pos[i].parentId == parentId && pos[i].position == position) {
                    same = true;
                    break;
                }
            }
        }
        return same;
    } else {
        return this.nodeIndex[nodeId] == node;
    }
},

_addNodeToIndex : function (nodeId, node, parentId, position, path) {
    // Check parameters
    var undef;
    if (!this.isMultiLinkTree()) {
        if (node == undef) {
            node = nodeId;
            this.nodeIndex[node[this.idField]] = node;
        } else {
            this.nodeIndex[nodeId] = node;
        }
        return;
    }

    // multiLinkTree from this point
    
    if (!node) {
        // Note, null parentId is OK: at this point, it means either that this is a top-level
        // node, or that it is an unlinked node, and we have elected not to drop unlinked nodes
        // (we drop them in as top-level nodes instead)
        this.logWarn("_addNodeToIndex was passed a null node");
        return;
    }

    if (!this.nodeIndex) this.nodeIndex = {};
    var entry = this.nodeIndex[nodeId]
    if (!entry) {
        entry = this.nodeIndex[nodeId] = {};
    }

    // For one particular use case, we must adjust any sibling nodes *before* we attempt to add
    // the new node to the index - this is specifically when we have two occurences of the same
    // node under the same parent, and we have just dragged one of those nodes into the position 
    // that the other is currently occupying.  In this case, if we try to add the dragged node 
    // back into the tree without first shifting the other one out of the way, we will not be 
    // able to distinguish between the two occurences - they are the same (pointer-equal) node, 
    // under the same parent, at the same position - so we will assume this is an attempt to 
    // add a node to the tree that we have already linked in.
    //
    // For other use cases where the node already exists in the tree, it isn't important 
    // whether we shift sibling nodes before or after adding the new node, but it is safer to 
    // shift them early, in case we do have the specific situation described above.  However, 
    // if we are adding a node that does not already exist in the tree, we cannot shift siblings
    // early because we cannot create a nodeLocator to pass to the updateSiblingNodePaths() 
    // function (and if we change things so that we could create a special nodeLocator that
    // doesn't require the node to be in the index, that would likely break all sorts of 
    // downstream code)
    delete this._runningNodePathUpdatesEarly;
    if (this.allowDuplicateChildren && !this._multiLinking && !this._addingDescendants) {
        if (this._getNodeFromIndex(nodeId)) {
            var nodeLocator = this.createNodeLocator(nodeId, parentId, position, path);
            if (nodeLocator) {
                this._runningNodePathUpdatesEarly = true;
                this.updateSiblingNodePaths(nodeLocator, 1);
            }
        }
    }


    if (!entry.node) {
        // Only set the node if it is not already set.  Doing this means we don't clobber the 
        // real node with a fresh copy from the server if a databound fetch happens to return
        // nodes we already know about - if we allow that, the nodeIndex will become detached
        // from the actual tree data, and things will quickly fall apart...
        entry.node = node;
    }
    var pos = entry.positions;
    if (!pos) {
        pos = entry.positions = [];
    }
    var thePosition;
    for (var i = 0; i < pos.length; i++) {
        if (pos[i].parentId == parentId && (pos[i].position == position || !this.allowDuplicateChildren)) {
            thePosition = pos[i];
            break;
        }
    }
    if (!thePosition) {
        thePosition = {
            parentId: parentId,
            position: position
        };
        pos.add(thePosition);
    }
    if (!entry.paths) {
        entry.paths = {};
    }
    // Paths should be subsidiary to positions, but sometimes we have only a path (eg, when all
    // we started with was an index into the openList), so store the paths alongside positions
    /*var pathAndPosition;
    if (!this.allowDuplicateChildren || path == this.pathDelim) {
        pathAndPosition = path;
    } else {
        pathAndPosition = path + (path.endsWith(this.pathDelim) ? "" : this.pathDelim) + position;
    }
    this._assert(!pathAndPosition.startsWith("/undefined"));
    // DELETEME - temporary debug code
    if (pathAndPosition.endsWith("/0/0")) debugger;
    if (!entry.paths[pathAndPosition]) {
        entry.paths[pathAndPosition] = {};
    }*/
    entry.paths[path] = {};

    // Since this is a multi-link tree, we need to propagate the insertion of this node back up
    // to the parent node, so that we have correct path entries for all cases where this node's
    // parent appears in the tree.  This is because, in multi-link trees, adding node X as a 
    // child of node Y only adds X to the underlying graph once, but it has to add occurences
    // of it to the pseudo-tree in every place that Y appears
    if (node != this.root) {
        var isFolder = this.isFolder(node);
        var parentIndexEntry = this._getNodeIndexEntry(parentId),
            paths = parentIndexEntry ? parentIndexEntry.paths : null;
        if (paths) {
            for (var pathEntry in paths) {
                var childPath = this._constructChildPath(pathEntry, node, position);
                
                // Note, here "entry" is the nodeIndex entry for the *child*
                if (!entry.paths[childPath]) {
                    entry.paths[childPath] = {};
                    // We must set the default nodeLength when we add this path entry, because
                    // nothing else is going to do it on this codepath
                    var nodeLength = 0;
                    if ((isFolder && this.openDisplayNodeType != isc.Tree.LEAVES_ONLY) ||
                        (!isFolder && this.openDisplayNodeType != isc.Tree.FOLDERS_ONLY)) 
                    {
                        nodeLength++;
                    }
                    this._setCachedNodeLengthInIndex(node, childPath, nodeLength);
                    // We also need to propagate the default nodeLength back up the parent chain
                    // but only if the node is open in the parent
                    if (this._includeNodeLengthInParent(node, parentIndexEntry.node, pathEntry)) {
                        if (nodeLength > 0) {
                            this._updateParentLengths(parentIndexEntry.node, nodeLength, pathEntry);
                        }
                    }
                }
            }
        }
    }

    if (!this._runningNodePathUpdatesEarly && this.allowDuplicateChildren && 
        !this._multiLinking && !this._addingDescendants) 
    {
        var nodeLocator = this.createNodeLocator(nodeId, parentId, position, path);
        if (nodeLocator) {
            this.updateSiblingNodePaths(nodeLocator, 1);
        }
    }

    delete this._runningNodePathUpdatesEarly;

},

_removeNodeFromIndex : function (nodeId) {
    if (!this.isMultiLinkTree()) {
        if (this.nodeIndex) {
            if (isc.isAn.Object(nodeId)) {
                nodeId = nodeId[this.idField];
            }
            delete this.nodeIndex[nodeId];
        }
    } else {
        
        var nodeLocator = nodeId,
            node = nodeLocator.node,
            path = nodeLocator.path,
            parentId = nodeLocator.parentId,
            position = nodeLocator.position;
        if (parentId == null || position == null) {
            var info = this._deriveParentChildPositionFromPath(path);
            parentId = parentId == null ? info.parentId : parentId;
            position = position == null ? info.position : position;
            nodeLocator.parentId = parentId;
            nodeLocator.position = position;
        }
        nodeId = node[this.idField];

        
        
        var indexEntry = this._getNodeIndexEntry(nodeId);
        
        // We are about to delete the relationship between this node and its parent (and 
        // position if allowDuplicateChildren is set), so we need to delete any path entries 
        // that terminate in that relationship.  There is a special case of this: when the 
        // pathTerminator and the path are the same, it means that the parent is the root node.
        // In this case, ALL occurences of the child node in the tree will end with the 
        // path terminator (because it is just '/{node-id}'), and we absolutely do not want to 
        // delete all those links...
        for (var pathEntry in indexEntry.paths) {
            if (this.parentChildPositionMatch(path, pathEntry)) {
                var pathInfo = indexEntry.paths[pathEntry];
                if (pathInfo.openListIndex != null) {
                    this.deleteRecordNumberToNodeLocatorIndexEntry(pathInfo.openListIndex);
                }
                if (pathEntry != nodeLocator.path) {
                    // We are deleting an occurence of the node at a path other than the path
                    // that the user actually deleted.  This is going to leave the ancestor 
                    // nodeLengths out of kilter, so we need to fix them up now
                    var parent = this._getNodeFromIndex(nodeLocator.parentId),
                        parentPath = this._deriveParentPath(pathEntry);
                    var delta = this._getNodeLengthToParent(node, parent, pathEntry, parentPath);
                    // Delta on remove is negative, obviously...
                    delta *= -1;                    
                    this._updateParentLengths(parent, delta, parentPath);

                    this._removeDescendantsFromIndex(nodeLocator.node, pathEntry);
                    this._removeNodeFromLinkDataIndex(isc.addProperties({}, nodeLocator, {path:pathEntry}));
                }
                delete indexEntry.paths[pathEntry];
            }
        }

        for (var i = 0; i < indexEntry.positions.length; i++) {
            var pos = indexEntry.positions[i];
            if (pos.parentId == parentId && (pos.position == position || !this.allowDuplicateChildren))
            {
                indexEntry.positions.removeAt(i);
                break;
            }
        }

        // Now remove descendants from the subtree rooted at this path
        this._removeDescendantsFromIndex(node, path);

        this._removeNodeFromLinkDataIndex(nodeLocator);

        // If we have completely cleaned out the positions and paths structures, the node is 
        // no longer linked into the tree, so we can get rid of the nodeIndex entry
        if (indexEntry.positions.length == 0 && isc.isAn.emptyObject(indexEntry.paths)) {
            delete this.nodeIndex[nodeId];
        }

        
        if (this.allowDuplicateChildren) {
            this.updateSiblingNodePaths(nodeLocator, -1);
        }
    }
},

_removeDescendantsFromIndex : function(node, path) {
    // NOTE: This method must be called with the correct, position-qualified path if 
    // allowDuplicateChildren is true.  Having established that correct start point for the 
    // descent, the recursive calls here will yield correct results even, because we recurse 
    // with actual qualified paths obtained from the nodeIndex
    var children = this.getChildren(node, null, null, null, null, null, true);
    if (!children) return;
    var length = (isc.isA.ResultSet(children) ?
            children._getCachedLength() : children.getLength());
    for (var i = 0; i < length; ++i) {
        var child = children.getCachedRow(i);
        var indexEntry = this._getNodeIndexEntry(child[this.idField]);
        for (var pathEntry in indexEntry.paths) {
            if (pathEntry.startsWith(path)) {
                delete indexEntry.paths[pathEntry];
                this._removeNodeFromLinkDataIndex(child, pathEntry);
                this._removeDescendantsFromIndex(child, pathEntry);
                // Remove the "positions" entry if there are no more paths ending with the same 
                // parent/child combo
                var deletePosition = true;
                for (var pe2 in indexEntry.paths) {
                    if (this.parentChildPositionMatch(pathEntry, pe2)) {
                        deletePosition = false;
                        break;
                    }
                }

                if (deletePosition) {
                    var info = this._deriveParentChildPositionFromPath(pathEntry);
                    for (var j = 0; j < indexEntry.positions.length; j++) {
                        var pos = indexEntry.positions[j];
                        if (pos.parentId == info.parentId && 
                                (pos.position == info.position || !this.allowDuplicateChildren))
                        {
                            indexEntry.positions.removeAt(j);
                            break;
                        }
                    }
                }
            }
        }

        // WRWRWR - this may need to be put back as it was...
        //this._removeDescendantsFromIndex(child, this._constructChildPath(path, child));
    }

},


updateNodeIdInIndex : function (oldID, newID) {
    if (this.findById(newID)) {
        this.logWarn("Attempt to update an ID to an existing value. Ignored.");
        return;
    }
    var node = this.findById(oldID);
    if (!node) {
        this.logWarn("Attempt to update an ID that does not exist in the tree. Ignored.");
        return;
    }
    this.nodeIndex[newID] = this.nodeIndex[oldID];
    delete this.nodeIndex[oldID];
},

parentChildPositionMatch : function(path1, path2) {
    var info1 = this._deriveParentChildPositionFromPath(path1),
        info2 = this._deriveParentChildPositionFromPath(path2);
    return info1.parentId == info2.parentId &&
            info1.childId  == info2.childId  &&
            (!this.allowDuplicateChildren ||
            // We can end up with a position of "not-important" when syncing updates from a
            // sub-tree across to a parent tree.  In that case, it doesn't make sense to 
            // consider that the sub-tree is rooted at a particualr occurence of the node in
            // the parent tree; that node is the same thing wherever it appears in the 
            // parent tree, the only occurence-level differences are transient visual things
            // like open state, and that is obviously unimportant for real data changes.  So
            // in this case, it doesn't matter whuch occurence of the node in the parent tree 
            // we are comparing against here - they should all be synchronized
            (info1.position == info2.position || info2.position == "not-important"));
},

updateSiblingNodePaths : function(nodeLocator, delta) {
    this.logWarn("In updateSiblingNodes with delta " + delta + " for nodeLocator " + isc.echoAll(nodeLocator));
    if (!this.allowDuplicateChildren) return;
    var adding = (delta > 0);
    var parent = this._getNodeFromIndex(nodeLocator.parentId);
    var children = this.getChildren(parent);
    if (!children) return;
    for (var i = nodeLocator.position; i < children.length; i++) {
        var indexEntry = this._getNodeIndexEntry(children[i]);
        // If we are trying to update siblings because we have removed a node, and that removal
        // has meant that the node no longer occurs anywhere in the tree, indexEntry will be 
        // null here.  This is OK, because we don't need to update the paths on a node that no
        // longer exists
        if (!indexEntry) continue;
        for (var j = 0; j < indexEntry.positions.length; j++) {
            var pos = indexEntry.positions[j];
            if (pos.parentId == nodeLocator.parentId) {
                
                // Avoid picking up occurences of the same node we are removing, that appear earlier
                // under the same parent
                if (!adding && indexEntry.node == nodeLocator.node && pos.position < nodeLocator.position) {
                    continue;
                }

                // If we are adding a node, and we are not running sibling updates early, that
                // means that no occurences of the node we just added existed before.  Therefore,
                // any occurence we find now must be the newly-added node itself, and we don't 
                // want to shift that.  On the other hand, if this logic is running early, that
                // means we had at least one occurence of the node already in the tree, and 
                // since we are running before the addition, any occurences we find are different
                // occurences and should be shifted like any other sibling node
                if (adding && !this._runningNodePathUpdatesEarly && 
                    indexEntry.node == nodeLocator.node && pos.position == nodeLocator.position) {
                    continue;
                }

                var nodeId = indexEntry.node[this.idField];
                var originalPosition = pos.position;
                pos.position += delta;
                var existingPaths = [];
                for (var pathEntry in indexEntry.paths) {
                    existingPaths[existingPaths.length] = pathEntry;
                }
                for (var k = 0; k < existingPaths.length; k++) {
                    var pathEntry = existingPaths[k];
                    var info = this._deriveParentChildPositionFromPath(pathEntry);
                    //this.logDebug("updateSiblingNodes: Considering pathEntry " + pathEntry)
                    if (info.parentId == nodeLocator.parentId) {
                        //this.logDebug("updateSiblingNodes: parentIds match for " + pathEntry)
                        var newPathEntry = pathEntry.substring(0, pathEntry.lastIndexOf(this.pathDelim)+1);
                        newPathEntry += pos.position;
                        indexEntry.paths[newPathEntry] = indexEntry.paths[pathEntry];
                        delete indexEntry.paths[pathEntry];
                        //this.logDebug("updateSiblingNodes: updated " + pathEntry + " to " + newPathEntry);
                        var openListIndex = indexEntry.paths[newPathEntry].openListIndex;
                        if (openListIndex != null) {
                            //this.logDebug("updateSiblingNodes: updating openListIndex " + openListIndex + " to newPathEntry " + newPathEntry);
                            this.recordNumberToNodeLocatorIndex[openListIndex].position = pos.position;
                            this.recordNumberToNodeLocatorIndex[openListIndex].path = newPathEntry;
                        } else {
                            //this.logDebug("updateSiblingNodes: not updating openListIndex - "+ pathEntry + " is not in the openList");
                        }
                        var linkRecord = this.getLinkRecord(pos.parentId, nodeId, originalPosition);
                        // Note, the original linkRecord may have already been deleted by a 
                        // previous pass through this loop for a different path.  In that case, 
                        // the update to the new position in the linkData has already happened, 
                        // so there is nothing to do
                        if (linkRecord) {
                            //this.logDebug("updateSiblingNodes: Updating link record for " + pathEntry);
                            this._addNodeToLinkDataIndex(pos.parentId, nodeId, pos.position, 
                                                                linkRecord);
                            this._removeNodeFromLinkDataIndex(nodeId, pathEntry);
                        } else {
                            //this.logDebug("updateSiblingNodes: not updating linkRecord - the old entry for " + pathEntry + " does not exist");
                        }

                        this.propagateNodePathChange(indexEntry.node, pathEntry, newPathEntry);
                    }
                }                    
            }
        }
    }
},

propagateNodePathChange : function(parentNode, oldParentPath, newParentPath) {
    // This is pretty straighforward - go through descendants and replace all occurences of the
    // old parent path with the new one
    var children = this.getChildren(parentNode);
    if (!children) return;
    for (var i = 0; i < children.length; i++) {
        var indexEntry = this._getNodeIndexEntry(children[i]);
        var existingPaths = [];
        for (var oldPath in indexEntry.paths) {
            existingPaths[existingPaths.length] = oldPath;
        }
        for (var k = 0; k < existingPaths.length; k++) {
            var oldPath = existingPaths[k];
            if (oldPath.startsWith(oldParentPath)) {
                var newPath = oldPath.substring(oldParentPath.length)
                newPath = newParentPath + newPath;
                indexEntry.paths[newPath] = indexEntry.paths[oldPath];
                delete indexEntry.paths[oldPath];
                var openListIndex = indexEntry.paths[newPath].openListIndex;
                if (openListIndex != null) {
                    this.recordNumberToNodeLocatorIndex[openListIndex].path = newPath;
                }
                this.propagateNodePathChange(children[i], oldPath, newPath);
            }
        }
    }
},

deleteRecordNumberToNodeLocatorIndexEntry : function(index) {
    this.recordNumberToNodeLocatorIndex.splice(index, 1);
    // This is a potential performance nightmare, but I don't think we have a choice...
    this._updateOpenListIndexInNodeLocators(index, false);
},

addRecordNumberToNodeLocatorIndexEntry : function(index, entry) {
    
    this.recordNumberToNodeLocatorIndex.splice(index, 0, entry);
    this._updateOpenListIndexInNodeLocators(index, true);
},

_getNodeOpenStateFromIndex : function(nodeLocator, path) {
    return this._getNodeStateFromIndex(nodeLocator, path, "isOpen");
},

_setNodeOpenStateInIndex : function(nodeLocator, state) {
    this._setNodeStateInIndex(nodeLocator, "isOpen", state);
},

_getNodeSelectedStateFromIndex : function(nodeLocator, path) {
    return this._getNodeStateFromIndex(nodeLocator, path, "isSelected");
},

_setNodeSelectedStateInIndex : function(nodeLocator, state) {
    this._setNodeStateInIndex(nodeLocator, "isSelected", state);
},

_getNodePartiallySelectedStateFromIndex : function(nodeLocator, path) {
    return this._getNodeStateFromIndex(nodeLocator, path, "isPartiallySelected");
},

_setNodePartiallySelectedStateInIndex : function(nodeLocator, state) {
    this._setNodeStateInIndex(nodeLocator, "isPartiallySelected", state);
},

_getNodeStateFromIndex : function(nodeLocator, path, stateName) {
    
    var nodeId, parentId, position;
    if (this.isANodeLocator(nodeLocator)) {
        nodeId = nodeLocator.node[this.idField];
        parentId = nodeLocator.parentId;
        position = nodeLocator.position;
        if (path && path != nodeLocator.path) {
            this.logWarn("_getNodeStateFlagFromIndex was passed both a nodeLocator and a path; " +
                     "ignoring the separately-passed path '" + path + "' in favor of the " +
                     "nodeLocator.path '" + nodeLocator.path + "'");
        }
        path = nodeLocator.path;
    } else if (path == this.pathDelim) {
        // Root node is in index with empty ID
        nodeId = "";
        parentId = null;
        position = null;  // WRWRWR - this may need to change
    }
    
    if (!this.isANodeLocator(nodeLocator)) {
        nodeId = nodeLocator[this.idField];

    }
    var entry = this._getNodeIndexEntry(nodeId);
    return entry && entry.paths && entry.paths[path] ? !!entry.paths[path][stateName] : false;

},

_setNodeStateInIndex : function(nodeLocator, stateName, state) {
    
    var nodeId = nodeLocator.node[this.idField],
        path = nodeLocator.path;
    var entry = this._getNodeIndexEntry(nodeId);
    
    entry.paths[path][stateName] = state;
},

_getCachedNodeLengthFromIndex : function(nodeId, path) {
    if (!this.isMultiLinkTree()) {
        this.logWarn("Tree._getCachedNodeLengthFromIndex() called, but this is not a multiLink tree!");
        return null;
    }
    // Convert node to nodeId if necessary
    if (isc.isAn.Object(nodeId)) nodeId = nodeId[this.idField];
    if (nodeId == null) nodeId = '';
    var entry = this._getNodeIndexEntry(nodeId);
    
    return entry.paths[path].nodeLength;
},

_setCachedNodeLengthInIndex : function(nodeId, path, length) {
    if (!this.isMultiLinkTree()) {
        this.logWarn("Tree._setCachedNodeLengthInIndex() called, but this is not a multiLink tree!");
        return null;
    }
    // Convert node to nodeId if necessary
    if (isc.isAn.Object(nodeId)) nodeId = nodeId[this.idField];
    if (nodeId == null) nodeId = '';
    var entry = this._getNodeIndexEntry(nodeId);
    
    entry.paths[path].nodeLength = length;
},

_getOpenListIndexFromIndex : function(nodeLocator) {
    
    var indexEntry = this._getNodeIndexEntry(nodeLocator.node[this.idField]);
    
    return indexEntry.paths[nodeLocator.path].openListIndex;
},
_setOpenListIndexInIndex : function(nodeLocator, index) {
    
    var indexEntry = this._getNodeIndexEntry(nodeLocator.node[this.idField]);
    
    indexEntry.paths[nodeLocator.path].openListIndex = index;
},
_updateOpenListIndexInNodeLocators : function(startingIndex, added) {
    
    for (var i = startingIndex; i < this.recordNumberToNodeLocatorIndex.length; i++) {
        this.recordNumberToNodeLocatorIndex[i].openListIndex = i;
        var pathEntry = this._getPathEntryFromIndex(this.recordNumberToNodeLocatorIndex[i]);
        
        pathEntry.openListIndex = i;
    }
},

_getRecursionCountFromIndex : function(node, path) {
    
    var indexEntry = this._getNodeIndexEntry(node[this.idField]);
    
    return indexEntry.paths[path][this._recursionCountProperty] || 0;
},

_adjustRecursionCountInIndex : function(node, path, delta) {
    
    var indexEntry = this._getNodeIndexEntry(node[this.idField]);
    
    var newValue = indexEntry.paths[path][this._recursionCountProperty] || 0;
    newValue += delta;
    if (newValue == 0) {
        delete indexEntry.paths[path][this._recursionCountProperty]
    } else {
        indexEntry.paths[path][this._recursionCountProperty] = newValue;
    }
},


// This method derives a parent path from a child path by simply trimming off the last element
// (or the last two elements if allowDuplicateChildren is true); it is just a macro, to avoid 
// repeating the same derivation code all over the place.  It is very different from the public 
// getParentPath() method, which constructs a path by walking up the parent chain.  This method
// is for use with multi-link trees, where walking up the parent chain is is not possible because 
// we don't have a parent chain - we have a branching ancestor hierarchy
_deriveParentPath : function(childPath) {
    if (!childPath || childPath == this.pathDelim || childPath == "") {
        return null;
    }
    var pathElements = childPath.split(this.pathDelim);
    
    var parentPath = "";
    for (var i = 1; i < pathElements.length - (this.allowDuplicateChildren ? 2 : 1); i++) {
        parentPath += this.pathDelim + pathElements[i];
    }
    if (parentPath == "") parentPath = this.pathDelim;
    return parentPath;
},

// Derive the "path terminator" - ie, the end bit of a path that identifies a unique combination
// of node, parent and position (if allowDuplicateChildren is on) in a multi-link tree.  This 
// is not the full path - if node O1 has a child O2, and O1 appears in the tree beneath nodes
// P1 and P2, there are legitimately two paths to O2 - P1/O1/O2 and P2/O1/O2 - and we must track
// them both.  But if O2 is moved out of O1, then obviously this must affect both of these 
// paths, because O1 is a single thing in multiple places
_derivePathTerminator : function(path) {
    if (!path || path == this.pathDelim || path == "") {
        return null;
    }
    var tokens = [];
    var length = this.allowDuplicateChildren ? 4 : 2;
    for (var i = 0; i < length; i++) {
        tokens[i] = path.substring(path.lastIndexOf(this.pathDelim) + 1);
        path = path.substring(0, path.lastIndexOf(this.pathDelim));
    }

    var pathTerminator = "";
    if (this.allowDuplicateChildren) {
        pathTerminator = tokens[3] + this.pathDelim + tokens[2] + this.pathDelim;
    }
    pathTerminator += tokens[1] + this.pathDelim + tokens[0];

    return pathTerminator
},
_constructChildPath : function(parentPath, child, position) {
    if (!parentPath) return null;
    var childPath = parentPath;
    if (childPath == "") childPath = this.pathDelim;
    childPath += (childPath.endsWith(this.pathDelim) ? "" : this.pathDelim) + child[this.idField];
    if (this.allowDuplicateChildren) {
        
        childPath += this.pathDelim + position;
    }
    return childPath;
},
_deriveIdAndPositionFromPath : function(path) {
    if (!path || path == this.pathDelim || path == "") {
        return {};
    }
    var token1 = path.substring(path.lastIndexOf(this.pathDelim) + 1);
    if (!this.allowDuplicateChildren) {
        return {id: token1};
    }
    var stripped = path.substring(0, path.lastIndexOf(this.pathDelim));
    var token2 = stripped.substring(stripped.lastIndexOf(this.pathDelim) + 1);
    return {id: token2, position: token1};
},
_deriveParentChildPositionFromPath : function(path) {
    if (!path || path == this.pathDelim || path == "") {
        return {childId: this.rootValue};
    }
    if (!this.allowDuplicateChildren) {
        var childId = path.substring(path.lastIndexOf(this.pathDelim) + 1);
        var stripped = path.substring(0, path.lastIndexOf(this.pathDelim));
        var parentId = stripped.substring(stripped.lastIndexOf(this.pathDelim) + 1);
        if (parentId == "") {
            parentId = this.rootValue;
        }
        return {childId: childId, parentId: parentId};
    } else {
        var parentId;
        var position = path.substring(path.lastIndexOf(this.pathDelim) + 1);
        var stripped = path.substring(0, path.lastIndexOf(this.pathDelim));
        var childId = stripped.substring(stripped.lastIndexOf(this.pathDelim) + 1);
        stripped = stripped.substring(0, stripped.lastIndexOf(this.pathDelim));
        if (stripped == "") {
            parentId = this.rootValue;
        } else {
            stripped = stripped.substring(0, stripped.lastIndexOf(this.pathDelim));
            parentId = stripped.substring(stripped.lastIndexOf(this.pathDelim) + 1);
        }
        return {childId: childId, parentId: parentId, position: position};
    }
},


_getOpenStateRecursively : function(nodeList, newParent, position, openStateObject, propagateParentChange) {
    openStateObject = openStateObject || {};
    for (var i = 0; i < nodeList.length; i++) {
        
        var nodeLocator = nodeList[i],
            node = nodeLocator.node,
            pathTerminator = this._derivePathTerminator(nodeLocator.path),
            indexEntry = this._getNodeIndexEntry(node);
        for (var pathEntry in indexEntry.paths) {
            if (pathEntry.endsWith(pathTerminator)) {
                var newPath = pathEntry;
                if ((newParent && newParent.node[this.idField] != nodeLocator.parentId) ||
                            propagateParentChange) 
                {
                    var parentPath = this._deriveParentPath(pathEntry);
                    newPath = newParent.path + 
                                (newParent.path == this.pathDelim ? "" : this.pathDelim) + 
                                pathEntry.substring(parentPath.length+(parentPath == this.pathDelim ? 0 : 1));
                    propagateParentChange = true;
                }
                // Wherever they are coming from, the nodes are going to end up positioned 
                // sequentially under the new parent, starting at the dropped position
                if (this.allowDuplicateChildren) {
                    newPath = newPath.substring(0, newPath.lastIndexOf(this.pathDelim)+1);
                    newPath += (position + i);
                }
                var workLocator = this.createNodeLocator(node, indexEntry.parentId, 
                                                         indexEntry.position, newPath);
                openStateObject[newPath] = {
                    nodeLocator: workLocator,
                    openState: this.isOpen(node, pathEntry)
                }
            }
        }
        var children = this.getChildren(nodeLocator);
        if (children) {
            var childLocators = [],
                indexByChild = {};

            for (var j = 0; j < children.length; j++) {
                var child = children.getCachedRow(j),
                    childId = child[this.idField];
                indexByChild[childId] = indexByChild[childId] == null ? 0 : indexByChild[childId] + 1;
                childLocators[j] = this.createNodeLocatorWithRelativePosition(
                    child, 
                    nodeLocator.node[this.idField],
                    indexByChild[childId]
                );
                childLocators[j].path = this._constructChildPath(nodeLocator.path, child, 
                                                                    childLocators[j].position);
            }
            var newChildParent;
            if (newParent) {
                newChildParent = workLocator;
            }
            this._getOpenStateRecursively(childLocators, newChildParent, position, openStateObject, 
                                                propagateParentChange);
        }
    }
    return openStateObject;
},

// END - nodeIndex API

connectByFields : function (data) {
    if (!data) data = this.data;
    // for each record
    for (var i = 0; i < data.length; i++) {
        this.addNodeByFields(data[i]);
    }
},

addNodeByFields : function (node) {
    // go through each field in this.fields in turn, descending through the hierarchy, creating
    // hierarchy as necessary

    
    isc.Tree._assert(!this.isMultiLinkTree(), "addNodeByFields() must not be called for a " +
                            "multi-link tree; linkNodes() is the only supported approach!");
    var parent = this.root;
    for (var i = 0; i < this.fieldOrder.length; i++) {
        var fieldName = this.fieldOrder[i],
            fieldValue = node[fieldName];

        var folderName = isc.isA.String(fieldValue) ? fieldValue : 
                                                      fieldValue + isc.emptyString,
            childNum = this.findChildNum(parent, folderName),
            child;
        if (childNum != -1) {
            //this.logWarn("found child for '" + fieldName + "':'" + fieldValue + "'");
            child = this.getChildren(parent).get(childNum);
        } else {
            // if there's no child with this field value, create one
            //this.logWarn("creating child for '" + fieldName + "':'" + fieldValue + "'");
            child = {};
            child[this.nameProperty] = folderName;
            this._add(child, parent);
            var deltaLength = this.convertToFolder(child);
            if (deltaLength != 0) {
                this._updateParentLengths(parent, deltaLength);
            }
        }
        parent = child;
    }
    // add the new node to the Tree
    //this.logWarn("adding node at: " + this.getPath(parent));
    this._add(node, parent);
},

//>	@method	tree.getRoot()
//
// Returns the root node of the tree.
//
// @return  (TreeNode)    the root node
//
// @visibility external
//<
getRoot : function () {
	return this.root;
},

//>	@method	tree.setRoot()
//
// Set the root node of the tree.  Called automatically on this Tree during initialization
// and on the Tree returned from a call to +link{tree.duplicate, duplicate()}. 
//
// @param   newRoot (TreeNode)    new root node
// @param   autoOpen (boolean)  set to true to automatically open the new root node.
//
// @visibility external
//<
setRoot : function (newRoot, autoOpen) {

	// assign the new root
	this.root = newRoot;

    // avoid issues if setRoot() is used to re-root a Tree on one of its own nodes
    var newRootFromSameTree = (newRoot && isc.endsWith(this.parentProperty, this.ID));
    if (newRootFromSameTree) newRoot[this.parentProperty] = null;

    var newRootNodeLocator;
    if (this.isMultiLinkTree()) {
        newRootNodeLocator = this.createNodeLocator(newRoot, null, null, this.pathDelim);
    }

    // NOTE: this index is permanent, staying with this Tree instance so that additional sets of
    // nodes can be incrementally linked into the existing structure. 
    this.nodeIndex = {};
    this.recordNumberToNodeLocatorIndex = [];

    this._addNodeToIndex(this.root[this.idField] || "", this.root, null, 0, this.pathDelim);
    
    
    var calcLength = !(newRootFromSameTree && this._getCachedNodeLength(this.root) != null);

    // make sure root points to us as its tree
    this.root[this.treeProperty] = this.ID;

    if (this.rootValue == null) this.rootValue = this.root[this.idField];

    // If the root node has no name, assign the path property to it.  This is for backcompat
    // and also a reasonable default.
    var rootName = this.root[this.nameProperty];
    if (rootName == null || rootName == isc.emptyString) {
        var wasFolder = !calcLength && this.isFolder(this.root);

        this.root[this.nameProperty] = this.pathDelim;
        // Setting the name can change the folderness of the node so update the root node's
        // length.
        
        if (!calcLength) {
            var cachedLength = this._getCachedNodeLength(this.root);
            this._setCachedNodeLength(this.root, cachedLength + this._getDeltaLength(
                this.root, wasFolder, this.isFolder(this.root)));
        }
    }

    // Set the initial cached length of the new root node.
    if (calcLength) {
        var isFolder = this.isFolder(this.root);
        this._setCachedNodeLength(this.root, (
            (isFolder && this.openDisplayNodeType != isc.Tree.LEAVES_ONLY) ||
            (!isFolder && this.openDisplayNodeType != isc.Tree.FOLDERS_ONLY) ? 1 : 0));
    }

    var pagedResultTree = (
            isc.ResultTree != null && isc.isA.ResultTree(this) && this.isPaged());
    if (pagedResultTree) {
        if (this.root[this._visibleDescendantsCachedProperty] == null) {
            this.root[this._visibleDescendantsCachedProperty] = true;
            this._setVisibleDescendantsCached(this.root, null, null, true);
        }
    }

    // the root node is always a folder
    if (!this.isFolder(this.root)) {
        this.convertToFolder(this.root);
    }

    // (re)create the structure of the Tree according to the model type
    if ("parent" == this.modelType) {
        // nodes provided as flat list (this.data); each record is expected to have a property
        // which is a globally unique ID (this.idField) and a property which has the globally
        // unique ID of its parent (this.parentIdField).

        // assemble the tree from this.data if present
        // Pass in the param to suppress dataChanged since we'll fire that below
        if (this.data) {
            this._linkingNodes = true;
            var rootLocator;
            if (this.isMultiLinkTree()) {
                rootLocator = this.createNodeLocator(newRoot, null, null, this.pathDelim);
            }
            this._linkNodes(null, null, null, null, null, rootLocator || newRoot, true);
            delete this._linkingNodes;
        }
    } else if ("fields" == this.modelType) {
        
        // nodes provided as flat list; a list of fields, in order, defines the Tree
        if (this.data) this.connectByFields();

    } else if ("children" == this.modelType) {
    
        // Each parent has an array of children.  Traverse the tree, starting at the root,
        // to setup the parent links (assuming this.autoSetupParentLinks is true) and to
        // assign the initial node lengths (i.e. _cachedLengthProperty) on all of the nodes.
        this._traverse(this.root, this.autoSetupParentLinks, true, false, false);

        if (this.data) {
            var data = this.data;
            this.data = null;
            this._addList(data, this.root);
        }
    } else {
        this.logWarn("Unsupported modelType: " + this.modelType);
    }

    // Slot the root node into nodeIndex
    this.setupParentLinks();

	// open the new root if autoOpen: true passed in or this.autoOpenRoot is true.  Suppress
    // autoOpen if autoOpen:false passed in
    if (this.autoOpen == "root" && !this.autoOpenRoot && autoOpen != false) autoOpen = true;
    if (autoOpen !== false && (this.autoOpenRoot || autoOpen)) {
        var _this = this;
        this.openFolder(newRootNodeLocator || newRoot, function (node) {
            var shouldOpen = _this.autoOpen;
            if (shouldOpen != null && shouldOpen != "none") {
                if (_this.loadDataOnDemand) {
                    // open direct descendants of the root node
                    if (shouldOpen == "all") _this.openAll(node);
                } else if (shouldOpen == "all") {
                    // open all descendants of the root node
                    _this.openBranch(node);
                }
            }
        });
    }

    // Slot the root node into nodeIndex, and, for paged ResultTrees, change the container
    // of the children of any node with a valid childCountProperty value from an array to
    // a ResultSet.
    this._traverse(this.root, true, false, pagedResultTree, false);

	// mark the tree as dirty and note that the data has changed
	this._clearNodeCache();
	this.dataChanged();
},

// helper to open the entire child-tree of some node
openBranch : function (node) {
    if (!node || !node.children || node.children.length == 0) return;
    
    var children = node.children,
        _this = this
    ;
    for (var i=0; i<children.length; i++) {
        this.openFolder(children[i], function (node) {
            if (node.children && node.children.length > 0) {
                _this.openBranch(node);
            }
        });
    }
},

// get a copy of these nodes without all the properties the Tree scribbles on them.
// Note the intent here is that children should in fact be serialized unless the caller has
// explicitly trimmed them.
getCleanNodeData : function (nodeList, includeChildren, cleanChildren, includeLoadState) {
    
    return isc.Tree.getCleanNodeData(nodeList, includeChildren, true, includeLoadState, this);
},


clearProperties : function (nodeList, properties, cleanChildren) {
    if (nodeList == null) return null;
    
    if (!isc.isAn.Array(nodeList))   nodeList   = [nodeList];
    if (!isc.isAn.Array(properties)) properties = [properties];
    
    for (var i = 0; i < nodeList.length; i++) {
        var nodeLocator,
            treeNode = nodeList[i];
        if (this.isANodeLocator(treeNode)) {
            nodeLocator = treeNode;
            treeNode = treeNode.node;
        }

        for (var j = 0; j < properties.length; j++) {
            delete treeNode[properties[j]];
        }

        if (!cleanChildren) continue;

        var children = treeNode[this.childrenProperty];
        if (!isc.isAn.Array(children)) continue;
        this.clearProperties(children, properties, cleanChildren);
    }
},

//
// identity methods -- override these for your custom trees
//

//>	@method	tree.getName()
//
// Get the 'name' of a node.  This is node[+link{Tree.nameProperty}].  If that value has not
// been set on the node, the node's 'ID' value will be tried (this is 
// node[+link{Tree.idField}]).  If that value is not present on the node, a unique value 
// (within this parent) will be auto-generated and returned.
//	
// @param	node	(TreeNode | NodeLocator) node in question, or a suitable +link{object:NodeLocator}
// @return			(String)	             name of the node 
//
// @visibility external
//<
_autoName : 0,
getName : function (node) {
    var ns = isc._emptyString;

    if (!node) return ns;
    
    if (this.isANodeLocator(node)) {
        node = node.node;
    }

    var name = node[this.nameProperty];
    if (name == null) name = node[this.idField];
    if (name == null) {
        // unnamed node: give it a unique name. 
        

        // never assign an autoName to a node not from our tree
        if (!this.isDescendantOf(node, this.root) && node != this.root) return null;

        // assign unique autoNames per tree so we don't get cross-tree name collisions on D&D
        if (!this._autoNameBase) this._autoNameBase = isc.Tree.autoID++ + "_";
        name = this._autoNameBase+this._autoName++;
        // set a flag noting that we auto-assigned this name.
        // This is useful in databinding for us to determine whether path-based state 
        // information can be reliably mapped to new data, for example on cache
        // invalidation.
        node._autoAssignedName = true;
    }

    // convert to string because we call string methods on this value elsewhere
    if (!isc.isA.String(name)) name = ns+name;
    
    // cache
    node[this.nameProperty] = name;
    return name;
},

//>	@method	tree.getTitle()
//
// Return the title of a node -- the name as it should be presented to the user.  This method
// works as follows:
// <ul>
// <li> If a +link{attr:Tree.titleProperty} is set on the node, the value of that property is
// returned.
// <li> Otherwise, if the +link{attr:Tree.nameProperty} is set on the node, that value is
// returned, minus any trailing +link{attr:Tree.pathDelim}.
// <li> Finally, if none of the above yielded a title, the value of
// +link{attr:Tree.defaultNodeTitle} is returned.
// </ul>
// You can override this method to return the title of your choice for a given node.
// <br><br>
// To override the title for an auto-constructed tree (for example, in a databound TreeGrid),
// override +link{method:TreeGrid.getNodeTitle} instead.
//
// @param node  (TreeNode) node for which the title is being requested
// @return      (String) title to display
//
// @see method:TreeGrid.getNodeTitle
//
// @visibility external
//<
getTitle : function (node) {
	if (!node) return null;
	// if the node has an explicit title, return that
	if (node[this.titleProperty] != null) return node[this.titleProperty];

	// otherwise derive from the name
	var name = node[this.nameProperty];
	if (name == null) name = this.defaultNodeTitle;
	return (isc.endsWith(name, this.pathDelim) 
                ? name.substring(0,name.length-this.pathDelim.length) 
                : name);
},

//>	@method	tree.getPath()
//
// Returns the path of a node - a path has the following format:
// <code>([name][pathDelim]?)*</code>
// <br><br>
// For example, in this tree:
// <pre>
// root
//   foo
//     bar
// </pre>
// Assuming that +link{attr:Tree.pathDelim} is the default <code>/</code>, the <code>bar</code>
// node would have the path <code>root/foo/bar</code> and the path for the <code>foo</code>
// node would be <code>root/foo</code>.
// <br><br>
// Once you have a path to a node, you can call find(path) to retrieve a reference to the node
// later.
// <p>
// <b>Note: </b>Nodes in +link{tree.isMultiLinkTree(),multi-link trees} do not have a single path, 
// because a given node can occur in multiple places in the tree.  Therefore, if you pass a
// <code>TreeNode</code> instance to this method, it returns the path to one occurence of the 
// node; which particular occurence it chooses is not predictable, and there may be other paths
// to other occurences of the same node in the tree.  The only way to obtain an unambiguous 
// path for a particular occurence of a node is to call +link{tree.getPathForOpenListIndex()}, 
// passing in the position of the node occurence in the tree's openList (which will be the same 
// as the record number of the node's visual occurence in a +link{class:TreeGrid,treeGrid}); if
// the node occurence is not yet in the tree's openList - either because its parent has not yet
// been opened, or because the tree is in the process of being built - the tree is not able to 
// provide a path to the node occurence.  In this case, you would have to obtain the path 
// in application code, by reference to the original +link{tree.data} and +link{tree.linkData} 
//
// @param	node	(TreeNode)  node in question
// @return			(String)	path to the node
//
// @see method:Tree.getParentPath
// @visibility external
//<
getPath : function (node) {
    var parent = this.getParent(node);
    if (parent == null) return this.getName(node);

    var parentName = this.getName(parent);
    return this.getPath(parent) + 
            (parentName == this.pathDelim ? isc.emptyString : this.pathDelim) + 
                this.getName(node);        
},

//>	@method	tree.getParentPath()
//
// Given a node, return the path to its parent.  This works just like
// +link{method:Tree.getPath} except the node itself is not reported as part of the path.
//
// @param	node	(TreeNode)	node in question
// @return			(String) path to the node's parent
//
// @see method:Tree.getPath
// @visibility external
//<
getParentPath : function (node) {
	// get the node's path
	var name = this.getName(node),
		path = this.getPath(node);
		
	// return the path minus the name of the node
	return path.substring(0, path.length - name.length - this.pathDelim.length);
},

//>	@method	tree.getParent()
//
// Returns the parent of this node.  For +link{tree.isMultiLinkTree(),multiLink trees}, you must
// pass in a +link{object:NodeLocator} rather than a node, otherwise it will just return
// the first parent, which is unlikely to be useful unless you know that this node only has 
// one parent, or you just want to know whether the node has at least one parent.  See also
// +link{tree.getMultiLinkParents}.
//
// @param   node    (TreeNode | String | Integer | NodeLocator) the node in question, or its ID, 
//                                                              or a NodeLocator object  
// @return  (Node)              parent of this node
//
// @visibility external
//<
getParent : function (node) {
    var nodeLocator, nodeId;
    if (this.isANodeLocator(node)) {
        nodeLocator = node;
        node = node.node;
    } else if (!isc.isAn.Object(node)) {
        node = this._getNodeFromIndex(node);
    }
    if (node == null) return null;
    if (!this.isMultiLinkTree()) {
        return node[this.parentProperty];
    } else {
        if (nodeLocator != null) {
            if (nodeLocator.parentId) {
                return this._getNodeFromIndex(nodeLocator.parentId);
            } else {
                return this._getParentFromIndexByPath(node[this.idField], nodeLocator.path);
            }
        }
        // If no nodeLocator, just return the first parent
        return this._getFirstParentFromIndex(node);
    }
},

_getParentNodeLocator : function (nodeLocator) {
    
    var parentPath = this._deriveParentPath(nodeLocator.path);
    var grandParentPath = this._deriveParentPath(parentPath);
    var grandParentInfo = this._deriveIdAndPositionFromPath(grandParentPath);
    return this.createNodeLocator(
        this._getNodeFromIndex(nodeLocator.parentId || (parentPath == this.pathDelim ? "" : null)), 
        grandParentInfo ? grandParentInfo.id : null, 
        grandParentInfo ? grandParentInfo.position : null, 
        parentPath
    );
},

//>	@method	tree.isParent()
//
// Returns true if "parent" is the parent of "node".  This is straightforward and definitive 
// for ordinary trees, because nodes can only have one parent.  In
// +link{tree.isMultiLinkTree(),multiLink trees}, however, nodes can have multiple parents, so
// this method returning true only means that "parent" is <i>a</i> parent of "node" - there may
// or may not be others.
//
// @param   node    (TreeNode)  the node in question
// @param   parent  (TreeNode)  the node to query to see if is a parent of the other node
// @return  (Boolean)           true if "parent" is a parent of "node"; otherwise false
//
// @visibility external
//<
isParent : function (node, parent) {
    if (node == null || parent == null) return false;
    if (!this.isMultiLinkTree()) {
        return parent == this.getParent(node);
    } else {
        var parents = this._getParentsFromIndex(node);
        return parents.contains(parent);
    }
},

//>	@method	tree.getMultiLinkParents()
//
// For +link{tree.isMultiLinkTree(),multiLink trees}, returns the array of this node's direct
// parents (the actual node objects, not the IDs).  For non-multiLink trees, returns an array 
// containing the single parent of this node.  See also +link{tree.getParentsAndPositions}.
//
// @param   node    (TreeNode)    node in question
// @return  (Array of TreeNode)   the parents of this node
//
// @visibility external
//<
getMultiLinkParents : function (node) {
    if (node == null) return null;
    if (!this.isMultiLinkTree()) {
        return [node[this.parentProperty]];
    } else {
        return this._getParentsFromIndex(node);
    }
},

//>	@method	tree.getParents()
//
// Given a node, return an array of the node's ancestors, with the immediate parent first, then
// the grandparent, and so on.  The node itself is not included in the result.  For example, 
// for the following tree:
// <pre>
// root
//   foo
//     bar
// </pre>
// Calling <code>tree.getParents(bar)</code> would return: <code>[foo, root]</code>.  Note that
// the returned array will contain references to the nodes, not the names.
// <p>
// Note, for reasons of backwards compatibility, if you pass this method a <code>TreeNode</code>
// instance on a +link{tree.isMultiLinkTree(),multi-link tree}, it will return an array 
// representing one path through the node's ancestors, which is unlikely to be useful.  To get 
// the ancestor chain of a specific node occurence, you must pass a +link{object:NodeLocator}
// that specifies the full ID-based path to that occurence.  If what you actually want is a 
// list of the node's direct parents, see +link{tree.getMultiLinkParents}.

//
// @param   node    (TreeNode | NodeLocator) node in question, or a NodeLocator
// @return          (Array)                  array of node's parents
//
// @visibility external
//<

getParents : function (node, rowNum) {
    var list = [];
    var nodeLocator;
    if (this.isANodeLocator(node)) {
        nodeLocator = node;
        node = node.node;
    } else {
        if (this.isMultiLinkTree() && isc.isA.Number(rowNum)) {
            nodeLocator = this.getNodeLocator(rowNum);
        }
    }

    if (!this.isMultiLinkTree() || !nodeLocator) {
        var parent = this.getParent(node);
        // while parents exist
        while (parent) {
            // add them to the list
            list.add(parent);
            
            // if the parent is the root, jump out!
            //	this lets us handle subTrees of other trees
            if (parent == this.root) break;
            
            // and get the next parent in the chain
            parent = this.getParent(parent);
        }
    } else {
        var path = nodeLocator.path,
            parent = null;
        while (path && path != this.pathDelim && parent != this.root) {
            path = this._deriveParentPath(path);
            var parentInfo = this._deriveIdAndPositionFromPath(path);
            parent = this._getNodeFromIndex(parentInfo.id);
            list.add(parent);
        }

    }
	return list;
},

//>	@method	tree.getParentsAndPositions()
//
// For +link{tree.isMultiLinkTree(),multiLink trees}, returns the array of this node's direct
// parents and the node's position within each parent.  Each entry is a record like this:
// <pre>
// [
//     {parent: [reference-to-parent-node], position: [this-node's-position-within-the-parent]},
//     {parent: [reference-to-parent-node], position: [this-node's-position-within-the-parent]}
// ]
// </pre>
// For non-multiLink trees, returns null (calling this method makes no sense for non-multiLink
// trees).
//
// @param   node    (TreeNode)    node in question
// @return  (Array of Record)     the parents and positions of this node
//
// @visibility external
//<

getParentsAndPositions : function (node) {
    if (node == null || !this.isMultiLinkTree()) return null;
    var positions = this._getPositionsFromIndex(node);
    var list = [];
    for (var i = 0; i < positions.length; i++) {
        list.add({
            parent: this._getNodeFromIndex(positions[i].parentId),
            position: positions[i].position
        });
    }
    return list;
},

//>	@method	tree.getLevel()	(A)
//
// Return the number of levels deep this node is in the tree.  For example, for this tree:
// <pre>
// root
//   foo
//     bar
// </pre>
// Calling <code>tree.getLevel(bar)</code> will return <code>2</code>. 
// <P>
// Note +link{showRoot} defaults to false so that multiple nodes can be shown at top level.  In
// this case, the top-level nodes still have root as a parent, so have level 1, even though
// they have no visible parents.
// <p>
// For +link{tree.isMultiLinkTree(),multi-link trees}, passing a <code>TreeNode</code> to this 
// method will return the level of one of that node's occurences; it is not predictable which
// occurence will be used.  For multi-link trees, therefore, you should pass a 
// +link{object:NodeLocator} with a path that unambiguously identifies the node occurence you 
// are interested in
//
// @param   node    (TreeNode | NodeLocator)    node in question, or a suitable 
//                                              <code>NodeLocator</code>
// @return          (number)    number of parents the node has
//
// @visibility external
//<

getLevel : function (node, rowNum) {
	return this.getParents(node, rowNum).length;
},

// Given a node, iterate up the parent chain and return an array containing each level for 
// which the node or its ancestor has a following sibling
// Required for treeGrid connectors
// We could improve performance here by cacheing this information on each node and having this
// method be called recursively on parents rather than iterating through the parents' array
// for every node this method is called on.
_getFollowingSiblingLevels : function (node) {
    var levels = [],
        parents = this.getParents(node),
        level = parents.length;
    // note that parents come back ordered with the root last so iterate through them forwards
    // to iterate up the tree
    for (var i = 0; i < level; i++) {
        var children = this.getChildren(parents[i]),
            childrenLength = (
                isc.isA.ResultSet(children) ?
                    children._getCachedLength() : children.getLength());
        if (children.indexOf(node) != childrenLength - 1) {
            levels.add(level - i);
        }
        node = parents[i];
    }
    return levels;
},

//>	@method	tree.isFolder()
//
// Determines whether a particular node is a folder.  The logic works as follows:<br><br>
// <ul>
// <li> If the +link{TreeNode} has a value for the +link{attr:Tree.isFolderProperty}
// (+link{TreeNode.isFolder} by default) that value is returned.
// <li> Next, the existence of the +link{attr:Tree.childrenProperty} (by default
// +link{TreeNode.children}) is checked on the +link{TreeNode}.  If the node has the children
// property defined (regardless of whether it actually has any children), then isFolder()
// returns true for that node.
// </ul>
// <smartclient>
// <P>
// You can override this method to provide your own interpretation of what constitutes a folder.
// However, you cannot change the return value for a node after the associated folder is loaded.
// </smartclient>
//
// @param	node	(TreeNode)	node in question
// @return			(Boolean)	true if the node is a folder
//
// @visibility external
//<
isFolder : function (node) {
    if (node == null) return false;

    // explicit isFolder set
    var isFolder = node[this.isFolderProperty];
    if (isFolder != null) return isFolder;

    // has a children array (may have zero actual children currently, but having a children
    // array is sufficient for us to regard this as a folder).  Note that we scribble the
    // children array on the nodes even in modelTypes other than "children", so this check
    // is correct for other modelTypes as well.
    if (node[this.childrenProperty]) return true;

    // infer folderness from the name of the node
    // XXX 10/13/2005 : this is purposefully not documented.  We have it here for backcompat
    // with trees that may have relied on this, but disclosing this will confuse people -
    // they'll start to think about having to tack on the path delimiter on their nodes to
    // signify folderness, which in turn translates into confusion about when you should or
    // should not supply the slash or give back a trailing slash from e.g. getPath()
    var name = this.getName(node);

    // if there's no name, we have no way of knowing
   	if (name == null) return false;

    // if the last character is the pathDelim, it's a folder.
    return isc.endsWith(name, this.pathDelim);
},

//>	@method	tree.isLeaf()
//
// Returns true if the passed in node is a leaf.
//
// @param   node    (TreeNode)    node in question
// @return          (Boolean)   true if the node is a leaf
//
// @visibility external
// @see isFolder()
//<
isLeaf : function (node) {
	return ! this.isFolder(node);
},

//> @method tree.isFirst() (A)
// Note: because this needs to take the sort order into account, it can be EXTREMELY expensive!
// @group ancestry
// Return true if this item is the first one in its parent's list.
//
// @param  node (TreeNode)  node in question
// @return (boolean)  true == node is the first child of its parent
//<
isFirst : function (node) {
    var parent = this.getParent(node);
    if (! parent) return true;
    
    var kids = this.getChildren(parent, this.opendisplayNodeType, 
            this._openNormalizer, this.sortDirection, null, this._sortContext);
    if (isc.isA.ResultSet(kids)) {
        return (kids._getCachedLength() > 0 && kids.getCachedRow(0) == node);
    } else {
        return (kids.first() == node);
    }
},

//>	@method	tree.isLast()	(A)
// 		Note: because this needs to take the sort order into account, it can be EXTREMELY expensive!
//		@group	ancestry
//			Return true if this item is the last one in its parent's list.
//
//		@param	node	(TreeNode)	node in question
//		@return			(boolean)	true == node is the last child of its parent
//<
isLast : function (node) {
	var parent = this.getParent(node);
	if (! parent) return true;
    
	var kids = this.getChildren(parent, this.opendisplayNodeType, 
            this._openNormalizer, this.sortDirection, null, this._sortContext);
    if (isc.isA.ResultSet(kids)) {
        var length = kids._getCachedLength();
        return (length > 0 && kids.getCachedRow(length - 1) == node);
    } else {
        return (kids.last() == node);
    }
},


//
//	finding a node
//

//>	@method	tree.findById()	(A)
//
// Find the node with the specified ID.  Specifically, it returns the node whose idField
// matches the id passed to this method. If the tree is using the "parent" modelType, this
// lookup will be constant-time.  For all other modelTypes, the tree will be searched
// recursively.
//
// @group   location
// @param   id (String)    ID of the node to return.
// @return  (Object)       node with appropriate ID, or null if not found.
//
// @see attr:Tree.idField
// @see method:Tree.find
//
// @visibility external
//<
findById : function (id) {
    return this.find(this.idField, id);
},


//>	@method	tree.find()
//
// Find nodes within this tree using a string path or by attribute value(s).  
// 
// This method can be called with 1 or 2 arguments. 
//
// If a single String argument is supplied, the value of the argument is treated as the path to the node.  If a 
// single argument of type Object is provided, it is treated as a set of field name/value 
// pairs to search for (see +link{List.find}).
// <br>
// If 2 arguments are supplied, this method will treat the first argument as a fieldName, and
// return the first node encountered where <code>node[fieldName]</code> matches the second 
// argument.  So for example, given this tree:
// <pre>
// foo
//   zoo
//     bar
//   moo
//     bar
// </pre>
// Assuming your +link{attr:Tree.pathDelim} is the default <code>/</code> and <code>foo</code>
// is the name of the root node, then
// <code>tree.find("foo/moo/bar")</code> would return the <code>bar</code> node under the
// <code>moo</code> node.
// <br>
// <br>
// <code>tree.find("name", "bar")</code> would return the first <code>bar</code> node because
// it is the first one in the list whose <code>name</code> (default value of
// +link{attr:Tree.nameProperty}) property matches the value
// <code>bar</code>.  The two argument usage is generally more interesting when your tree nodes
// have some custom unique property that you wish to search on.  For example if your tree nodes
// had a unique field called "UID", their serialized form would look something like this:
// <pre>
// { name: "foo", children: [...], UID:"someUniqueId"}
// </pre> 
// You could then call <code>tree.find("UID", "someUniqueId")</code> to find that node.  Note
// that the value doesn't have to be a string - it can be any valid value, but since this
// data generally comes from the server, the typical types are string, number, and boolean.
// Also note that a find() on the +link{idField} will be constant time, and that find() will 
// not work on the idField if idField is set to a property that is not unique or not present 
// on all nodes in the Tree.
// <br><br>
// The usage where you pass a single object is interesting when your tree nodes have a number
// of custom properties that you want to search for in combination.  Say your tree nodes had 
// properties for "color" and "shape"; <code>tree.find({color: "green", shape: "circle"})</code>
// would return the first node in the tree where both properties matched.
// <br><br>
// When searching by path, trailing path delimiters are ignored.  So for example
// <code>tree.find("foo/zoo/bar")</code> is equivalent to
// <code>tree.find("foo/zoo/bar/")</code>
//
// @group location			
// @param fieldNameOrPath   (String)    Either the path to the node to be found, or the name of
//                                      a field which should match the value passed as a second
//                                      parameter
// @param [value]          (Any)     If specified, this is the desired value for the 
//                                   appropriate field
// @return (Object) the node matching the supplied criteria or null if not found
//
// @see attr:Tree.root
// @see attr:Tree.pathDelim
// @see attr:Tree.nameProperty
//
// @visibility external
//<
// NOTE: This should be a good generic implemention, try overriding findChildNum instead.
find : function (fieldName, value) {
    var undef;
    if (value === undef && isc.isA.String(fieldName)) return this._findByPath(fieldName);

    if (value !== undef) {
        // constant time lookup when we have nodeIndex
        if (fieldName == this.idField) return this._getNodeFromIndex(value);
        // special-case root, which may not appear in getDescendants() depending on this.showRoot
        if (this.root[fieldName] == value) return this.root;
        // Use 'getDescendants()' to retrieve both open and closed nodes.
        return this.getDescendants(undef, undef, undef, true).find(fieldName, value);
    } else {
        // fieldName is an Object, so use the multi-property option of List.find()
        var searchList = this.getDescendants(undef, undef, undef, true);
        searchList.add(this.root);
        return searchList.find(fieldName);
    }
},

findAll : function (fieldName, value) {
    // Use 'getDescendants()' to retrieve both open and closed nodes.
    var undef;
    return this.getDescendants(undef, undef, undef, true).findAll(fieldName, value);
},

// Find a node within this tree by path.
_findByPath : function (path) {

    
    
    // return early for cases of referring to just root
	if (path == this.pathDelim) return this.root;
	var rootPath = this.getPath(this.root);
    if (path == rootPath) return this.root;
    
	var node = this.root,
        lastDelimPosition = 0,
        delimLength = this.pathDelim.length;

    // if the path starts with a references to root, start beyond it
    if (isc.startsWith(path, rootPath)) {
		lastDelimPosition = rootPath.length;
    } else if (isc.startsWith(path, this.pathDelim)) {
        lastDelimPosition += delimLength;
    }
		
    //this.logWarn("path: " + path);

	while (true) {
		var delimPosition = path.indexOf(this.pathDelim, lastDelimPosition);

        //this.logWarn("delimPosition: " + delimPosition);

		// skip over two delims in a row (eg "//") and trailing (single) delimeter
		if (delimPosition == lastDelimPosition) {
            //this.logWarn("extra delimeter at: " + delimPosition);
            lastDelimPosition += delimLength;
            continue;
        }

        var moreDelims = (delimPosition != -1),
    		// name of the child to look for at this level
            name = path.substring(lastDelimPosition, moreDelims ? delimPosition : path.length),
		    // find the node number of that child
		    nodeNum = this.findChildNum(node, name);

        //this.logWarn("name: " + name);

		if (nodeNum == -1) return null;

		node = node[this.childrenProperty].getCachedRow(nodeNum);

        // if there are no more delimeters we're done
        if (!moreDelims) return node;

		// advance the lastDelimiter
		lastDelimPosition = delimPosition + delimLength;
		
		// if we got all the way to the end of the path, we're done:  return the node
		if (lastDelimPosition == path.length) return node;			
	}
},

//>	@method	tree.findChildNum()	(A)
//		@group	location			
//			Given a parent and the name of a child, return the number of that child.
//
// 		Note: names of folder nodes will have pathDelim stuck to the end
//
//		@param	parent	(TreeNode)	parent node
//		@param	name	(String)	name of the child node to find
//		@return			(number)	index number of the child, -1 if not found
//<
findChildNum : function (parent, name) {
	var children = this.getChildren(parent);

    if (children == null) {
        return -1;
    }
    if (name == null) return -1;

    var length = (
            isc.isA.ResultSet(children) ? children._getCachedLength() : children.getLength()),
        nameHasDelim = isc.endsWith(name, this.pathDelim),
        delimLength = this.pathDelim.length;
	for (var i = 0; i < length; i++) {
        
        var child = children.getCachedRow(i);
        if (child != null) {
            var childName = this.getName(child),
                lengthDiff = childName.length - name.length;

            if (lengthDiff == 0 && childName == name) return i;

            if (lengthDiff == delimLength) {
                // match if childName has trailing delim and name does not
                if (isc.startsWith(childName, name) &&
                    isc.endsWith(childName, this.pathDelim) && !nameHasDelim)
                {
                    return i;
                }
            } else if (nameHasDelim && lengthDiff == -delimLength) {
                // match if name has trailing delim and childName does not
                if (isc.startsWith(name, childName)) return i;
            }
        }
	}

	// not found, return -1
	return -1;
},


//> @method     tree.findIndex()
// Like +link{list.findIndex()}, but operates only on the list of currently opened nodes.  To search all loaded nodes
// open or closed, use +link{findNodeIndex()}.
//
// @param propertyName (String | Object | AdvancedCriteria) property to match, or if an Object is passed, set of
//                                        properties and values to match
// @param [value] (Any) value to compare against (if propertyName is a string)
// @return (int) index of the first matching Object or -1 if not found
//
// @group access, find
// @visibility external
//<

//> @method tree.findNodeIndex()
// Like +link{findIndex()}, but searches all tree nodes regardless of their open/closed state.
//
// @param propertyName (String | Object | AdvancedCriteria) property to match, or if an Object is passed, set of
//                                        properties and values to match
// @param [value] (Any) value to compare against (if propertyName is a string)
// @return (int) index of the first matching Object or -1 if not found
//
// @group access, find
// @visibility external
//<
findNodeIndex : function (propertyName, value) {
    return this.getNodeList().findIndex(propertyName, value);
},

//> @method     tree.findNextIndex()
// Like +link{findIndex()}, but inspects a range from <code>startIndex</code> to <code>endIndex</code>.  Note
// that as in +link{findIndex()}, only open nodes are included.  To include both open and closed nodes, use
// +link{findNextNodeIndex()}.
// <smartclient>
// <p>
// For convenience, findNextIndex() may also be called with a function (called the predicate
// function) for the <code>propertyName</code> parameter. In this usage pattern, the predicate
// function is invoked for each value of the list until the predicate returns a true value.
// The predicate function is passed three parameters: the current value, the current index, and
// the list. The value of <code>this</code> when the predicate function is called is the
// <code>value</code> parameter. For example:
// <pre>var currentUserRecord = recordList.findNextIndex(0, function (record, i, recordList) {
//    if (record.username == currentUsername && !record.accountDisabled) {
//        return true;
//    }
//});</pre>
// </smartclient>
//
// @param startIndex (int) first index to consider.
// @param propertyName (String | Function | Object | AdvancedCriteria) property to match;
// <smartclient>or, if a function is passed, the predicate function to call;</smartclient>
// or, if an object is passed, set of properties and values to match.
// @param [value] (Any) value to compare against (if <code>propertyName</code> is a string)
// <smartclient>or the value of <code>this</code> when the predicate function is invoked (if
// <code>propertyName</code> is a function)</smartclient>
// @param [endIndex] (int) last index to consider (inclusive).
// @return (int) index of the first matching value or -1 if not found.
// @group access, find
// @visibility external
//<

//> @method tree.findNextNodeIndex()
// Like +link{findNextIndex()}, but includes both open and closed nodes.
// @param startIndex (int) first index to consider.
// @param propertyName (String | Function | Object | AdvancedCriteria) property to match;
// <smartclient>or, if a function is passed, the predicate function to call;</smartclient>
// or, if an object is passed, set of properties and values to match.
// @param [value] (Any) value to compare against (if <code>propertyName</code> is a string)
// <smartclient>or the value of <code>this</code> when the predicate function is invoked (if
// <code>propertyName</code> is a function)</smartclient>
// @param [endIndex] (int) last index to consider (inclusive).
// @return (int) index of the first matching value or -1 if not found.
// @group access, find
// @visibility external
//<
findNextNodeIndex : function (startIndex, propertyName, value, endIndex) {
    return this.getNodeList().findNextIndex(startIndex, propertyName, value, endIndex);
},

//>	@method	tree.getChildren()
//
// Returns all children of a node.  If the node is a leaf, this method returns null.
// <P>
// For databound trees the return value could be a +link{class:ResultSet} rather than a simple
// array - so it's important to access the return value using the +link{interface:List} 
// interface instead of as a native Javascript Array.
// <smartclient>
// The case that a ResultSet may be returned can only happen if the tree is a
// +link{class:ResultTree} and the +link{resultTree.fetchMode} is set to "paged".
// </smartclient>
// <smartgwt>
// If the underlying set of children is incomplete then this method will return only those
// nodes that have already been loaded from the server.
// </smartgwt>
//
// @param node (TreeNode) The node whose children you want to fetch.
// @return (List of TreeNode) List of children for the node, including an empty List if the
//                            node has no children.  For a leaf, returns null.
// @see tree.getChildrenResultSet()
// @visibility external
//<

getChildren : function (parentNode, displayNodeType, normalizer, sortDirection, criteria,
                        context, returnNulls, treatEmptyFoldersAsLeaves, dontUseNormalizer) {
    

    var nodeLocator;
    if (this.isANodeLocator(parentNode)) {
        nodeLocator = parentNode;
        parentNode = parentNode.node;
    }

    // If separateFolders is true, we need to have an openNormalizer so we can sort/separate
    // leaves and folders
    // This will not actually mark the tree as sorted by any property since we're not setting up
    // a sortProp.
    
    if (!dontUseNormalizer &&
        normalizer == null && this._openNormalizer == null && this.separateFolders)
    {
        
        if (this._sortSpecifiers != null) this.setSort(this._sortSpecifiers);
        else this.sortByProperty();
        
        if (!this._openNormalizer) this._makeOpenNormalizer();
        normalizer = this._openNormalizer;
    }

	if (parentNode == null) parentNode = this.root;

	// if we're passed a leaf, it has no children, return empty array
	if (this.isLeaf(parentNode)) return null;

	// if the parentNode doesn't have a child array, create one
	if (parentNode[this.childrenProperty] == null) {
	    if (returnNulls) return null;
        var children = [];
        parentNode[this.childrenProperty] = children;
        // just return the new empty children array
        return children;
    }

    var pagedResultTree = isc.ResultTree && isc.isA.ResultTree(this) && this.isPaged(),
        list = parentNode[this.childrenProperty],
        subset;

    // If a criteria was passed in, remove all items that don't pass the criteria.
    if (criteria) {
        subset = [];

        var listLength = (pagedResultTree && isc.isA.ResultSet(list) ?
                list._getCachedLength() : list.getLength());
        for (var i = 0; i < listLength; ++i) {
            var childNode = list.getCachedRow(i);
            if (childNode != null) {
                // CALLBACK API:  available variables:  "node,parent,tree"
                if (this.fireCallback(
                        criteria, "node,parent,tree", [childNode, parentNode, this]))
                {
                    subset[subset.length] = childNode;
                }
            }
        }

        list = subset;
    }

    // Reduce the list if a displayNodeType was specified.
    if (displayNodeType == isc.Tree.FOLDERS_ONLY) {
        // If only folders were specified, get the subset that are folders.
        subset = [];
        var listLength = (pagedResultTree && isc.isA.ResultSet(list) ?
                list._getCachedLength() : list.getLength());
        for (var i = 0; i < listLength; ++i) {
            var childNode = list.getCachedRow(i);
            if (childNode != null) {
                var isFolder = this.isFolder(childNode);
                if (isFolder && treatEmptyFoldersAsLeaves) {
                    var c = childNode[this.childrenProperty];
                    isFolder = !(c != null && c.isEmpty());
                }
                if (isFolder) {
                    subset[subset.length] = childNode;
                }
            }
        }
    } else if (displayNodeType == isc.Tree.LEAVES_ONLY) {
        // If only leaves were specified, get the subset that are leaves.
        subset = [];
        var listLength = (pagedResultTree && isc.isA.ResultSet(list) ?
                list._getCachedLength() : list.getLength());
        for (var i = 0; i < listLength; ++i) {
            var childNode = list.getCachedRow(i);
            if (childNode != null) {
                var isLeaf = this.isLeaf(childNode);
                if (!isLeaf && treatEmptyFoldersAsLeaves) {
                    var c = childNode[this.childrenProperty];
                    isLeaf = (c != null && c.isEmpty());
                }
                if (isLeaf) {
                    subset[subset.length] = childNode;
                }
            }
        }
    } else {
        // Otherwise return the entire list (folders and leaves).
        subset = list;
    }

	
	if (this.isSubsetSortDirty(subset) && (normalizer ||
         (!pagedResultTree || !isc.isA.ResultSet(subset)) && dontUseNormalizer == false))
    {
        
        
        var sortProps = this._sortSpecifiers ? this._sortSpecifiers.getProperty("property") : [];

        
        var isOpenNormalizer = normalizer === this._openNormalizer;
        if (this._sortSpecifiers && normalizer && (!isOpenNormalizer || !pagedResultTree)) {

            
            var  ascendingComparator = null,
                descendingComparator = null;
            if (isc.Browser.isFirefox && isOpenNormalizer) {
                 ascendingComparator = this._openAscendingComparator;
                descendingComparator = this._openDescendingComparator;
            }

            // Update the normalizer on each sort-spec if one isn't present.
            for (var spec = this._sortSpecifiers.length; spec--; ) {
                var specObj = this._sortSpecifiers[spec];
                if (!specObj.normalizer) {
                    specObj.normalizer = normalizer;
                    specObj._comparator = (
                        Array.shouldSortAscending(specObj.direction) ?
                            ascendingComparator : descendingComparator);
                }
            }
        }

        // we now support sorting on all of the groupByFields 
        var groupByField = !this._groupByField ? null :
              (isc.isAn.Array(this._groupByField) ? this._groupByField : [this._groupByField]);

        if (// we're not in a grouped LG OR
                !groupByField || 
                // the special 'alwaysSortGroupHeaders' flag is set (indicating group headers have
                // multiple meaningful field values, as when we show summaries in headers) OR
                this.alwaysSortGroupHeaders 
                ||
                //// we're not grouping on the first sortField and this isn't a group-node OR
                (!groupByField.contains(sortProps[0]) && parentNode != this.getRoot()) ||
                //// we're sorting the group-nodes and the sort-field IS the first groupByField
                (groupByField.contains(sortProps[0]))
        ) {
            if (this._sortSpecifiers) {
                
                if (pagedResultTree && isc.isA.ResultSet(subset)) {
                    subset = subset.getAllVisibleRows() || [];
                }

                if (parentNode.groupMembers) {
                    // The parentNode is a group-node in a grid.  Process it if it's also
                    // being sorted.
                    var process = (this._sortSpecifiers.find("property", 
                            parentNode.groupName) != null);
                    
                    var isRoot = parentNode == this.getRoot();
                    // if it's the rootNode, process it anyway (there'll be no groupName)
                    process = process || isRoot;
                    
                    if (process) {
                        subset.map(function (record) {
                            if (record._isGroup) {
                                // if the record is a group, add values to it for the fields
                                // being sorted, such that we sort them properly according to
                                // the sort specifiers
                                if (parentNode.groupValue && !record[parentNode.groupName] && isRoot) {
                                    record[parentNode.groupName] = parentNode.groupValue; 
                                }
                                if (!record[record.groupName]) {
                                    record[record.groupName] = record.groupValue;
                                }
                            }
                        });
                    }
                }
                
                // remove any summary-rows from the subset before sorting, and then add them
                // back afterwards, so they're always at the end of the subset
                var summaryRows = subset.findAll(this._summaryRecordFlag, true) || [];
                if (summaryRows.length > 0) subset.removeList(summaryRows);

                if (this.isMultiLinkTree()) {
                    for (var ss = 0; ss < this._sortSpecifiers.length; ss++) {
                        if (!this._sortSpecifiers[ss].context) {
                            this._sortSpecifiers[ss].context = {};
                        }
                        this._sortSpecifiers[ss].context._currentParentForSort = parentNode;
                    }
                }

                subset.setSort(this._sortSpecifiers);

                if (this.isMultiLinkTree()) {
                    for (var ss = 0; ss < this._sortSpecifiers.length; ss++) {
                        delete this._sortSpecifiers[ss].context._currentParentForSort;
                    }
                }
                this.markSubsetAsSorted(subset);

                // Summary rows may be implemented as children or siblings of the 
                // header nodes (depending on whether we want them to show up
                // when the group is collapsed).
                if (summaryRows.length > 0) {
                    var addAsChildren = [];
                    for (var i = 0; i < summaryRows.length; ) {
                        if (summaryRows[i] == null) break;
                        var groupSummaries = [],
                            currentSummaryRow = summaryRows[i],
                            // summaryTargetNode flag set up in ListGrid grouping
                            // logic
                            target = currentSummaryRow[this._summaryTargetNode];
                        if (target == null) {
                            addAsChildren.add(currentSummaryRow);
                            i++;
                            continue;
                        } else {

                            do {
                                groupSummaries.add(currentSummaryRow);
                                currentSummaryRow = summaryRows[i+1];
                                i++;
                            } while (currentSummaryRow && 
                                     currentSummaryRow[this._summaryTargetNode] == target);
                            // Slot in the summaries as siblings after the
                            // summary header node.
                            subset.addListAt(groupSummaries, subset.indexOf(target)+1);
                        }
                    }
                    if (addAsChildren.length > 0) {
                        subset.addListAt(addAsChildren, subset.length);
                    }
                }      
            }
        }
	}

    
	return subset;
},

//> @method tree.getChildrenResultSet()
// Returns a ResultSet that provides access to any partially-loaded children of a node.  If the
// node is a leaf, this method returns null.
// @param node (TreeNode) The node whose children you want to fetch.
// @return (ResultSet) List of children for the node, including an empty ResultSet if the node
// has no children.  For a leaf, returns null.
// @see tree.getChildren()
// @see tree.allChildrenLoaded()
// @visibility external
//<
getChildrenResultSet : function (node) {
    var children = this.getChildren(node);
    return (isc.isA.ResultSet(children) ? children : null);
},

//>	@method	tree.getFolders()
//
// Returns all the first-level folders of a node.
// <br><br>
// For load on demand trees (those that only have a partial representation client-side), this
// method will return only nodes that have already been loaded from the server.
//
// @param   node    (TreeNode)    node in question
// @return  (List)              List of immediate children that are folders
//
// @visibility external
//<

getFolders : function (node, normalizer, sortDirection, criteria, context) {
    var folders = this.getChildren(node, isc.Tree.FOLDERS_ONLY, normalizer, sortDirection,
                                   criteria, context);
    
    return folders;
},

//>	@method	tree.getLeaves()
//
// Return all the first-level leaves of a node.
// <br><br>
// For load on demand trees (those that only have a partial representation client-side), this
// method will return only nodes that have already been loaded from the server.
//
// @param   node    (TreeNode)    node in question
// @return          (List)      List of immediate children that are leaves.
//
// @visibility external
//<

getLeaves : function (node, normalizer, sortDirection, criteria, context) {
    var leaves = this.getChildren(node, isc.Tree.LEAVES_ONLY, normalizer, sortDirection,
                                  criteria, context);
    
    return leaves;
},

//> @method Tree.getLevelNodes()
// Get all nodes of a certain depth within the tree, optionally starting from
// a specific node.  Level 0 means the immediate children of the passed node,
// so if no node is passed, level 0 is the children of root
// @param depth (Integer) level of the tree
// @param [node] (TreeNode) option node to start from
// @return (Array of TreeNode)
//<
getLevelNodes : function (depth, node) {

    if (this.indexByLevel && (node == null || node == this.getRoot())) {
        return this._levelNodes[depth] || [];
    } else {
        if (!node) node = this.getRoot();
        var children = this.getChildren(node);

        if (depth == 0) {
            
            if (isc.isA.ResultSet(children)) {
                return children.getAllLoadedRows();
            } else {
                return children;
            }
        }
        var result = [];
        if (children) {
            var length = (isc.isA.ResultSet(children) ?
                    children._getCachedLength() : children.getLength());
            for (var i = 0; i < length; ++i) {
                var child = children.getCachedRow(i),
                    nestedChildren = (
                        child != null && this.getLevelNodes(depth - 1, child));
                if (nestedChildren) result.addList(nestedChildren);
            }
        }
        return result;
    }
}, 

getDepth : function () {
    if (this._levelNodes) return this._levelNodes.length;
    return null;
},

//>	@method	tree.hasChildren()
//
// Returns true if this node has any children.
//
// @param	node			(TreeNode)			node in question
// @return					(Boolean)			true if the node has children
//
// @visibility external
//<

hasChildren : function (node, displayNodeType) {
    var children = this.getChildren(node, displayNodeType);
    return (children != null && !children.isEmpty());
},

//>	@method	tree.hasFolders()
//
// Return true if this this node has any children that are folders.
//
// @param	node	(TreeNode)	node in question
// @return         (Boolean)   true if the node has children that are folders
//
// @visibility external
//<
hasFolders : function (node) {
	return this.hasChildren(node, isc.Tree.FOLDERS_ONLY);
},

//>	@method	tree.hasLeaves()
//
//  Return whether this node has any children that are leaves.
//
//	@param	node	(TreeNode)	node in question
//	@return			(Boolean)   true if the node has children that are leaves
//
// @visibility external
//<
hasLeaves : function (node) {
	return this.hasChildren(node, isc.Tree.LEAVES_ONLY);
},


//>	@method	tree.isDescendantOf()
//			Is one node a descendant of the other?
//
//		@param	child	(TreeNode)	child node
//		@param	parent	(TreeNode)	parent node
//		@return			(Boolean)	true == parent is an ancestor of child
// @visibility external
//<
isDescendantOf : function (child, parent) {
    if (child == parent) return false;
    if (!this.isMultiLinkTree()) {
        var nextParent = child;
        while (nextParent != null) {
            if (nextParent == parent) return true;
            nextParent = nextParent[this.parentProperty];
        }
        return false;
    } else {
        var parents = this.getMultiLinkParents(child);
        if (parents && parents.length > 0) {
            if (parents.contains(parent)) return true;
            for (var i = 0; i < parents.length; i++) {
                if (this.isDescendantOf(parents[i], parent)) {
                    return true;
                }
            }
        }
        return false;
    }
},

//>	@method	tree.getDescendants()
//
// Returns the list of all descendants of a node.  Note: this method can be very slow,
// especially on large trees because it assembles a list of all descendants recursively.
// Generally, +link{method:Tree.find} in combination with +link{method:Tree.getChildren} will
// be much faster.
// <br><br>
// For load on demand trees (those that only have a partial representation client-side), this
// method will return only nodes that have already been loaded from the server.
//
// @param   [node]  (TreeNode)    node in question (the root node is assumed if none is specified)
// @return  (List)              List of descendants of the node.
//
// @visibility external
//<

getDescendants : function (node, displayNodeType, condition, dontSkipUnloadedFolders) {

	if (!node) node = this.root;

	// create an array to hold the descendants
	var list = [];

	// if condition wasn't passed in, set it to an always true condition
    // XXX convert this to a function if a string, similar to getChildren()
    if (!condition) condition = isc.Class.RET_TRUE;

	// if the node is a leaf, return the empty list
	if (this.isLeaf(node)) return list;
    
    // skip unloaded folders
    if (!dontSkipUnloadedFolders && this.getLoadState(node) != isc.Tree.LOADED) {
        return list;
    }
	// iterate through all the children of the node
	// Note that this can't depend on getChildren() to subset the nodes,
	//	because a folder may have children that meet the criteria but not meet the criteria itself.

	var children = this.getChildren(node);
    if (!children) {
        return list;
    }

    

	// for each child
    var length = (isc.isA.ResultSet(children) ?
            children._getCachedLength() : children.getLength());
    for (var i = 0; i < length; ++i) {
        // get a pointer to the child
        var child = children.getCachedRow(i);

        if (child == null) {
            // Do nothing.
        } else if (this.isFolder(child)) { // if that child is a folder
			// if we're not exluding folders, add the child
            if (displayNodeType != isc.Tree.LEAVES_ONLY && condition(child)) {
                list[list.length] = child;
            }

			// now concatenate the list with the descendants of the child
			list = list.concat(
                this.getDescendants(
                    child, displayNodeType, condition, dontSkipUnloadedFolders));

		} else {
			// if we're not excluding leaves, add the leaf to the list
			if (displayNodeType != isc.Tree.FOLDERS_ONLY && condition(child)) {
				list[list.length] = child;
			}
		}
	}
	// finally, return the entire list
	return list;
},

//>	@method	tree.getDescendantNodeLocators()
//
// Returns a list of link{type:NodeLocator)s identifying all descendants of a node (identified
// by the parameter <code>NodeLocator</code>).  This method
// is the equivalent of +link{Tree.getDescendants(),getDescendants()}, but for 
// +link{Tree.isMultiLinkTree(),multi-link trees}.  The list of descendant nodes returned from
// both methods is identical - a node's descendants are the same regardless of where or how 
// many times that node appears in the tree - but the <code>NodeLocator</code>s returned by this
// method provide additional context that allows you to determine particular occurences of
// descendant nodes.  This is necessary for some use cases - for example, when trying to 
// determine if a particualr node occurence is open, or selected.
//
// @param   [node]  (TreeNode)    node in question (the root node is assumed if none is specified)
// @return  (List)              List of descendants of the node.
//
// @visibility external
//<

getDescendantNodeLocators : function (nodeLocator, displayNodeType, condition, dontSkipUnloadedFolders) {

    

	// create an array to hold the descendants locators
    var list = [],
        node = nodeLocator.node;

	// if condition wasn't passed in, set it to an always true condition
    // XXX convert this to a function if a string, similar to getChildren()
    if (!condition) condition = isc.Class.RET_TRUE;

	// if the node is a leaf, return the empty list
	if (this.isLeaf(node)) return list;
    
    // skip unloaded folders
    if (!dontSkipUnloadedFolders && this.getLoadState(node) != isc.Tree.LOADED) {
        return list;
    }
	// iterate through all the children of the node
	// Note that this can't depend on getChildren() to subset the nodes,
	//	because a folder may have children that meet the criteria but not meet the criteria itself.

	var children = this.getChildren(node);
    if (!children) {
        return list;
    }

    

	// for each child
    var length = (isc.isA.ResultSet(children) ?
            children._getCachedLength() : children.getLength());
    for (var i = 0; i < length; ++i) {
        // get a pointer to the child
        var child = children.getCachedRow(i);

        if (child == null) {
            // Do nothing.
        } else if (this.isFolder(child)) { // if that child is a folder
			// if we're not exluding folders, add the child
            if (displayNodeType != isc.Tree.LEAVES_ONLY && condition(child)) {
                var childNodeLocator = this.createNodeLocator(child, null, null, 
                        this._constructChildPath(nodeLocator.path, child, i));                
                list[list.length] = childNodeLocator;
            }

			// now concatenate the list with the descendants of the child
			list = list.concat(
                this.getDescendantNodeLocators(
                    childNodeLocator, displayNodeType, condition, dontSkipUnloadedFolders));

		} else {
			// if we're not excluding leaves, add the leaf to the list
			if (displayNodeType != isc.Tree.FOLDERS_ONLY && condition(child)) {
                var childNodeLocator = this.createNodeLocator(child, null, null, 
                    this._constructChildPath(nodeLocator.path, child, i));                
                list[list.length] = childNodeLocator;
			}
		}
	}
	// finally, return the entire list
	return list;
},

//>	@method	tree.getDescendantFolders()
//
// Returns the list of all descendants of a node that are folders.  This works just like
// +link{method:Tree.getDescendants}, except leaf nodes are not part of the returned list.
// Like +link{method:Tree.getDescendants}, this method can be very slow for large trees.
// Generally, +link{method:Tree.find} in combination with +link{method:Tree.getFolders} 
// will be much faster.
// <br><br>
// For load on demand trees (those that only have a partial representation client-side), this
// method will return only nodes that have already been loaded from the server.
//
// @param   [node]      (TreeNode)	node in question (the root node is assumed if none is specified)
// @return  (List)	    List of descendants of the node that are folders.
//
// @visibility external
//<

getDescendantFolders : function (node, condition) {
	 return this.getDescendants(node, isc.Tree.FOLDERS_ONLY, condition)
},
//>	@method	tree.getDescendantLeaves()
//
// Returns the list of all descendants of a node that are leaves.  This works just like
// +link{method:Tree.getDescendants}, except folders are not part of the returned list.
// Folders are still recursed into, just not returned.  Like +link{method:Tree.getDescendants},
// this method can be very slow for large trees.  Generally, +link{method:Tree.find} in
// combination with +link{method:Tree.getLeaves} will be much faster.
// <br><br>
// For load on demand trees (those that only have a partial representation client-side), this
// method will return only nodes that have already been loaded from the server.
//
// @param   [node]      (TreeNode)	node in question (the root node is assumed if none specified)
// @return  (List)	    List of descendants of the node that are leaves.
//
// @visibility external
//<

getDescendantLeaves : function (node, condition) {
	return this.getDescendants(node, isc.Tree.LEAVES_ONLY, condition)
},


//>	@method	tree.dataChanged()	(A)
//
// Called when the structure of this tree is changed in any way. <smartclient>Intended to be observed.
// </smartclient><br><br>
// Note that on a big change (many items being added or deleted) this may be called multiple times
//
// @visibility external
//<
dataChanged : function () {},

//>	@method	tree.linkDataChanged()	(A)
//
// For +link{tree.isMultiLinkTree(),multi-link tree}s only, called when links are added to or removed
// form the tree. <smartclient>Intended to be observed.</smartclient>
// <br><br>
// Note that on a big change (many items being added or deleted) this may be called multiple times
//
// @visibility external
//<
linkDataChanged : function () {},


//
// adding nodes
//

//> @groupDef sharingNodes
//
// For local Trees, that is, Trees that don't use load on demand, SmartClient supports setting
// up the Tree structure by setting properties such as "childrenProperty", directly on data
// nodes.  This allows for simpler, faster structures for many common tree uses, but can create
// confusion if nodes need to be shared across Trees.
// <P>
// <b>using one node in two places in one Tree</b>
// <P>
// To do this, either clone the shared node like so:
// <smartclient><pre>
//     tree.add(isc.addProperties({}, sharedNode));
// </pre></smartclient>
// <smartgwt><pre>
//      Tree tree = new Tree();
//      TreeNode sharedNode = new TreeNode();
//      .....
//      tree.add(new Record(sharedNode.toMap()));
// </pre></smartgwt>
//  or place the shared data in a shared subobject instead.
// <P>
// <b>sharing nodes or subtrees across Trees</b>
// <P>
// Individual nodes within differing tree structures can be shared by two Trees only if
// +link{Tree.nameProperty}, +link{Tree.childrenProperty}, and +link{Tree.openProperty} have
// different values in each Tree.
// <P>
// As a special case of this, two Trees can maintain different open state across a single
// read-only structure as long as just "openProperty" has a different value in each Tree.
//
// @title Sharing Nodes
// @visibility external
//<
 

//>	@method	tree.add()
//
// Add a single node under the specified parent.  See +link{ResultTree,"Modifying ResultTrees"}
// when working with a <code>ResultTree</code> for limitations.
//
// @param	node		(TreeNode)	node to add
// @param	parent		(String | TreeNode)	Parent of the node being added.  You can pass
//                                          in either the +link{TreeNode} itself, or a path to
//	                                        the node (as a String), in which case a
//	                                        +link{method:Tree.find} is performed to find
//	                                        the node. 
// @param	[position]	(number)	Position of the new node in the children list. If not
//	                                specified, the node will be added at the end of the list.
// @param	[linkRecord] (Record)	Optional record containing attributes associated with the
//	                                link between the nodes, rather than either of the nodes 
//                                  themselves.  Only applicable to 
//                                  +link{multiLinkTree,multi-link trees}
// @return (TreeNode) The added node. Will return null if the node was not added (typically
//    because the specified <code>parent</code> could not be found in the tree).
//
// @see group:sharingNodes
// @see method:Tree.addList
// @visibility external
//<
// Note: the node passed in is directly integrated into the tree, so you will see properties
// written onto it, etc. We may want to duplicate it before adding, then return a pointer
// to the node as added.
add : function (node, parent, position, linkRecord) {
    return this._add(node, parent, position, linkRecord);
},
_add : function (node, parent, position, linkRecord) {
    if (parent == null && this.modelType == isc.Tree.PARENT) {
        var parentId = node[this.parentIdField];
        if (parentId != null) parent = this.findById(parentId);
    }
	// normalize the parent parameter into a node
	if (isc.isA.String(parent)) {
        parent = this.find(parent);
    } else if (!this.getParent(parent) && parent !== this.getRoot()) {
        // if parent is not in the tree, bail
        isc.logWarn('Tree.add(): specified parent node:' + this.echo(parent) +
                    ' is not in the tree, returning');
        return null;
    }
    this.logDebug("Adding node " + node[this.idField] + " to parent " + 
                        (parent == null ? "null" : parent[this.idField]));
	// if the parent wasn't found, return null
	// XXX note that we could actually add to the root, but that's probably not what you want
	if (! parent) {
		// get the parentName of the node
		var parentPath = this.getParentPath(node);
		if (parentPath) parent = this.find(parentPath);
		if (! parent) return null;
	}

    // we'll need to resort the children of this parent
    var children = parent[this.childrenProperty];
    if (children) this.markSubsetSortDirty(children);

    this.__add(node, parent, position, linkRecord);

	this._clearNodeCache(true);

	// call the dataChanged method
	this.dataChanged();

    return node;
},

_reportCollision : function (ID) {
    if (this.reportCollisions) {
        this.logWarn("Adding node to tree with id property set to:"+ ID + 
            ". A node with this ID is already present in this Tree - that node will be " +
            "replaced. Note that this warning may be disabled by setting the " + 
            "reportCollisions attribute to false.");
    }
},

// internal interface, used by _linkNodes(), _addList(), and any other place where we are adding a
// batch of new nodes to the Tree.  This implementation doesn't call _clearNodeCache() or
// dataChanged() and assumes you passed in the parent node as a node object, not a string.

__add : function (node, parent, position, linkRecord, path) {
    var pagedResultTree = (
            isc.ResultTree != null && isc.isA.ResultTree(this) && this.isPaged());
    
    var parentNodeLocator;
    if (this.isANodeLocator(parent)) {
        parentNodeLocator = parent;
        parent = parent.node;
    }

    var nodeLocator
    if (this.isMultiLinkTree()) {
        if (this.isANodeLocator(node)) {
            nodeLocator = node;
            node = nodeLocator.node;
            path = nodeLocator.path;
        } else {
            if (parent == this.getRoot()) {
                path = this.pathDelim;
            }
            nodeLocator = this.createNodeLocator(node, parent[this.idField], position, path);
        }
    }

    var info = {path:path};
    this._incrementRecursionCount(parentNodeLocator || parent);  
    this._preAdd(nodeLocator || node, parentNodeLocator || parent, position, true, info);

    var deltaParentLength = info.deltaParentLength,
        grandParent = info.grandParent,
        grandParentPath = info.grandParentPath,
        origParentLength = info.origParentLength,
        children = info.children;
    

    // 

    // If position wasn't specified, set it as the last item.
    // NOTE: Specifying position > children.length is technically wrong but happens easily
    // with a remove followed by an add.
    if (!this.isMultiLinkTree() || !(info.alreadyInTree || this._addingDescendants)) {
        if (position == null || position > children.length) {
            children.add(node);
        } else {
            // add the node to the parent - addAt is slower, so only do this if your position was
            // passed in
            children.addAt(node, position);
        }
    }

    info.linkRecord = linkRecord;
    this._postAdd(node, parentNodeLocator || parent, position, info);
    var grandChildren = (pagedResultTree
            ? this._canonicalizeChildren(node, info.grandChildren, false) : info.grandChildren);

    if (pagedResultTree) {
        var fromParent = (parent[this.canReturnOpenSubfoldersProperty] != null),
            openSubfoldersAllowed = (fromParent ?
                parent[this.canReturnOpenSubfoldersProperty] : this.canReturnOpenFolders);
        var nodeLocator;
        if (this.isMultiLinkTree()) {
            nodeLocator = this.createNodeLocator(node, parent, position);
        }
        if (!openSubfoldersAllowed &&
            this.isOpen(nodeLocator || node) &&
            grandChildren != null && !grandChildren.isEmpty())
        {
            this.logWarn(
                "Adding the open folder node '" + this.getPath(node) + "' as a child of the " +
                "parent node '" + this.getPath(parent) + "' is contradictory to the setting " +
                "of the " + (fromParent ? "'" + this.canReturnOpenSubfoldersProperty + "' " +
                "property of the parent node." : "'canReturnOpenFolders' property of the tree."));
        }
    }

    var deltaLength = 0;
    if (pagedResultTree && isc.isA.ResultSet(grandChildren)) {
        if (!(grandChildren.lengthIsKnown() && grandChildren.allMatchingRowsCached())) {
            this._setVisibleDescendantsCached(node, false, parent, false);
        }
    } else if (grandChildren != null) {
        // If the node has children, recursively add them to the node.  This ensures that
        // their parent link is set up correctly.

        // Handle children being specified as a single element recursively.
        // _add will slot the element into the new children array.

        var newParentLocator;
        if (this.isMultiLinkTree()) {
            if (!isc.isAn.Array(grandChildren)) {
                grandChildren = [grandChildren];
            }
            this._assert(!!parentNodeLocator);
            newParentLocator = 
                    this.createNodeLocator(node, parentNodeLocator.node[this.idField],
                            parentNodeLocator.position, 
                            this._constructChildPath(parentNodeLocator.path, node, position));
            var locators = [],
                indexByChild = {};
            for (var j = 0; j < grandChildren.length; j++) {
                var grandChild = grandChildren[j],
                    grandChildId = grandChild[this.idField];
                indexByChild[grandChildId] = indexByChild[grandChildId] == null ? 0 :
                                                indexByChild[grandChildId] + 1;
                locators[j] = this.createNodeLocatorWithRelativePosition(
                    grandChild, 
                    node[this.idField],
                    indexByChild[grandChildId]
                );
                locators[j].path = this._constructChildPath(newParentLocator.path, grandChild, 
                                                                    locators[j].position);
    
            }
            grandChildren = locators;
        }

        // We are adding all the children of a newly-added node here - start point is always 0
        var addingDescendants = this._addingDescendants;
        if (this.isMultiLinkTree()) {
            this._addingDescendants = true;
        }
        if (!isc.isAn.Array(grandChildren)) {
            this.__add(grandChildren, node, 0);
        } else if (grandChildren.length > 0) {
            this.__addList(grandChildren, newParentLocator || nodeLocator || node, 0);
        }
        if (this.isMultiLinkTree() && !addingDescendants) {
            delete this._addingDescendants;
        }


        // if a children array is present, mark the node as loaded even if the children array
        // is empty - this is a way of indicating an empty folder in XML or JSON results
        this.setLoadState(node, isc.Tree.LOADED);
    }

    var recursionCount = this._getRecursionCount(parentNodeLocator || parent);
    
    this._decrementRecursionCount(parentNodeLocator || parent);
    if (this._getRecursionCount(parentNodeLocator || parent) == 0) {
        if (grandParent) {
            // Check if changes in the length of the parent affect the length of the grandParent.
            deltaParentLength += (this._getNodeLengthToParent(parent, grandParent, 
                                    info.parentPath, grandParentPath) - origParentLength);

            // Update ancestor lengths
            this._updateParentLengths(grandParent, deltaParentLength, grandParentPath);
        }
    }
},

_removeCollision : function (collision) {
    
    var pagedResultTree = (
            isc.ResultTree != null && isc.isA.ResultTree(this) && this.isPaged());
    if (pagedResultTree) {
        var parent = this.getParent(collision),
            siblings = (parent != null ? this.getChildren(parent) : null);

        if (isc.isA.ResultSet(siblings)) {
            var j = siblings.indexOf(collision);
            if (j != -1) {
                
                siblings.fillCacheData([null], j);
            }
            return;
        }
    }

    // Otherwise simply remove the collision node.
    this._remove(collision);
},

_findCollision : function (node) {
    var nodeLocator;
    if (this.isANodeLocator(node)) {
        nodeLocator = node;
        node = node.node;
    }
    
    var ID = node[this.idField];
    if (ID != null && this.modelType == isc.Tree.PARENT) {
        if (!this.isMultiLinkTree()) {
            // note: in modelType:"children", while we do maintain a nodeIndex, an idField is not
            // required and the tree does not depend on globally unique ids
            // Further note: with multi-link trees, we do not support duplicate global IDs, but we
            // do support the same node appearing in multiple places in the tree.  SO it is not a 
            // collision if the "colliding" node is the same as the node we were called with
            var collision = this.findById(ID);
            if (collision) {
                return collision;
            }
        } else {
            if (this._isParentLinkInIndex(nodeLocator)) {
                return nodeLocator;
            }
        }
    }
    return null;
},


_preAdd : function (node, parent, position, removeCollisions, info) {

    var nodeLocator, parentNodeLocator;
    if (this.isANodeLocator(node)) {
        nodeLocator = node;
        node = node.node;
    }
    if (this.isANodeLocator(parent)) {
        parentNodeLocator = parent;
        parent = parent.node;
    }

    // convert name to a string - we rely on this fact in getTitle() and possibly other
    // places.  Also, ultimately getName() will convert it to a string anyway and at that
    // point, if new values are not strings from the start, sorting won't work as expected (the
    // non-strings will be segregated from the strings).
    this.getName(node);

    var collision = this._findCollision(nodeLocator || node);
    if (collision) {
        // Collisions are a mainstream case in multi-link trees - it just tells us this node
        // has already been linked in so we don't add it to the tree again.  However, we do 
        // (possibly) need to add a nodeIndex entry for this particular path, and keep node 
        // length maintained, so we will proceed with the majority of the add work; we just 
        // don't actually add the node to the parent's children collection
        if (this.isMultiLinkTree()) {
            info.alreadyInTree = true;
        } else {
            var ID = collision[this.idField];
            this._reportCollision(ID);
            if (removeCollisions) {
                this._removeCollision(collision);
            }
        }
    }

    // convert the parent node to a folder if necessary
    var parentPath = info.parentPath = parentNodeLocator ? parentNodeLocator.path 
                                                         : this._deriveParentPath(info.path);
    var deltaParentLength = info.deltaParentLength = 
                                this.convertToFolder(parentNodeLocator || parent, parentPath);

    var grandParent = info.grandParent = (parent != this.root && this.getParent(parentNodeLocator || parent));
    var grandParentPath = null;
    if (grandParent) {
        grandParentPath = this._deriveParentPath(parentPath);
    } else {
        // WRWRWR - is this assumption warranted?
        grandParentPath = this.pathDelim;            
    }

    info.grandParentPath = grandParentPath;
        
    var origParentLength = info.origParentLength = (
            grandParent && this._getNodeLengthToParent(parent, grandParent, parentPath, grandParentPath));

	var children = parent[this.childrenProperty];
    if (!children) children = parent[this.childrenProperty] = [];
    info.children = children;

    // if the children attr contains a single object, assume it to be a single child of
    // the node.    
    
    var childrenResultSet = info.childrenResultSet = isc.isA.ResultSet(children);
    if (children != null && !isc.isAn.Array(children) && !childrenResultSet) {
        parent[this.childrenProperty] = children = [children];
    }

    // parentId-based loading can be used without the parentId
    // appearing in the child nodes, for example, if loading nodes from a large XML structure, 
    // we may use the parentId to store the XPath to the parent, and load children via accessing
    // the parentElement.childNodes Array.
    //
    // set the parentId on the node if it isn't set already
    var idField = this.idField
    // just do this unconditionally - it doesn't make sense for the parentId field of the child
    // not to match the idField of the parent.
    node[this.parentIdField] = parent[idField];
    // link to the parent
    node[this.parentProperty] = parent;
},


_postAdd : function (node, parent, position, info) {
    var idField = this.idField;

    var parentNodeLocator;
    if (this.isANodeLocator(parent)) {
        parentNodeLocator = parent;
        parent = parent.node;
    }

    // Link to the Tree (by String ID, not direct pointer).
    node[this.treeProperty] = this.ID;

    // Update nodeIndex.
    // If we don't do a null check there are cases where null values get added into the
    // nodeIndex and children get added to the wrong parent, i.e. when using autoFetch and 
    // modeltype 'children' within a treegrid.
    if (node[idField] != null) {
        if (this.isMultiLinkTree() && parentNodeLocator) {
            // This is necessary for the drag-move case: "info.path" will still contain the 
            // path to node's original place in the tree, but we have removed it from there and
            // are now re-adding it in the new location
            info.path = this._constructChildPath(parentNodeLocator.path, node, position);
        }
        this._addNodeToIndex(node[idField], node, parent[idField], position, info.path);
        if (this.isMultiLinkTree() && !info.alreadyInTree) {
            // _currentLinkRecord is set up by the callback of the linkData add operations in
            // TreeGrid.transferNodes() (actually defined in TreeCells.js)
            var linkRecord;
            if (this._addingDescendants) {
                linkRecord = this.getLinkRecordFromLinkData(parent[idField], node[idField], position);
            } else {
                linkRecord = this._currentLinkRecord ? this._currentLinkRecord : info.linkRecord;
            }
            this._addNodeToLinkDataIndex(parent[idField], node[idField], position, linkRecord);
        }
    }

    if (!info.childrenResultSet) {
        // Current assumption whenever loading subtrees is that if any
        // children are returned for a node, it's the complete set, and the node is marked "loaded".
        this.setLoadState(parent, isc.Tree.LOADED);
    }

    this._addToLevelCache(node, parent, position);

    // Set the cached length of the node.
    var nodeIsFolder = this.isFolder(node);
    this._setCachedNodeLength(node, (
        this.openDisplayNodeType != (nodeIsFolder ? isc.Tree.LEAVES_ONLY : isc.Tree.FOLDERS_ONLY) ? 1 : 0),
        info.path);

    var grandChildren = info.grandChildren = node[this.childrenProperty],
        deltaLength,
        parentPath = parentNodeLocator && parentNodeLocator.path ? parentNodeLocator.path
                                                                 : this._deriveParentPath(info.path);
    if (grandChildren != null) {
        // This is clearing out any existing children because we are about to re-add them via 
        // the _add() mechanism, to ensure that everything is correctly linked up, inserted into
        // the nodeIndex, etc.  However, this can cause problems with multi-link trees: because 
        // nodes are not unique in the tree, it is possible that we are about to zap the children
        // of a node that exists elsewhere.  If this happens, the re-add of the children at 
        // this particular path will discover existing entries in the nodeIndex (for another 
        // path) and assume that the actual references via the parent's [childrenProperty]
        // collection are already in place.  So it goes ahead and does everything EXCEPT adding
        // the child to the parent's [childrenProperty] collection.
        if (!this.isMultiLinkTree()) {
            node[this.childrenProperty] = [];
        }
        deltaLength = this._getNodeLengthToParent(node, parentNodeLocator || parent, info.path, parentPath);
	} else {
        deltaLength = this._getNodeLengthToParent(node, parentNodeLocator || parent, info.path, parentPath);

        // canonicalize the isFolder flag on the node
        var wasFolder = this.isFolder(node),
            isFolder = node[this.isFolderProperty];

        // convert to boolean
        if (isFolder != null && !isc.isA.Boolean(isFolder)) {
            isFolder = isc.booleanValue(isFolder, true);
        }

        // ResultTree nodes that don't specify isFolder default to isFolder: true,
        // But Trees work exactly the opposite way
        if (isFolder == null && this.defaultIsFolder) isFolder = true;

        if (isFolder && !wasFolder) {
            deltaLength += this.convertToFolder(node, info.path);
        }
        node[this.isFolderProperty] = isFolder;
    }

    // Add deltaLength to the length of the parent.
    
    var cachedLength = this._getCachedNodeLength(parent, parentPath);
    this._setCachedNodeLength(parent, cachedLength + deltaLength, parentPath);
},

_addNodeToLinkDataIndex : function(parentId, childId, position, linkRecord) {
    if (this.isANodeLocator(parentId)) {
        linkRecord = childId;
        childId = parentId.node[this.idField];
        position = parentId.position;
        parentId = parentId.parentId;
    }
    
    if (!this.linkDataIndex) this.linkDataIndex = {};
    if (!this.linkDataIndex[parentId]) this.linkDataIndex[parentId] = {};
    if (!this.linkDataIndex[parentId][childId]) this.linkDataIndex[parentId][childId] = {};
    
    position = this.allowDuplicateChildren ? position : 0;
    this.linkDataIndex[parentId][childId][position] = linkRecord;
},

_removeNodeFromLinkDataIndex : function(childId, path) {
    
    var nodeLocator, parentId, position;
    if (this.isANodeLocator(childId)) {
        nodeLocator = childId;
        childId = nodeLocator.node[this.idField];
        path = nodeLocator.path;
        parentId = nodeLocator.parentId;
        position = nodeLocator.position;
    } else {
        if (isc.isAn.Object(childId)) {
            childId = childId[this.idField];
        }
        var info = this._deriveParentChildPositionFromPath(path);
        if (info) {
            parentId = info.parentId;
            if (this.allowDuplicateChildren) {
                position = info.position;
            }
        }
    }
    if (this.linkDataIndex && 
        this.linkDataIndex[parentId] && 
        this.linkDataIndex[parentId][childId])
    {
        if (!this.allowDuplicateChildren) {
            for (var pos in this.linkDataIndex[parentId][childId]) {
                position = pos;
                break;
            }
        }
        delete this.linkDataIndex[parentId][childId][position];
    }
},
getLinkRecordFromLinkData : function(parentId, childId, position) {
    // This method returns a link record from the source data; it is used when linking dragged
    // nodes back into the tree, when no linkDataIndex entry will be present
    for (var i = 0; i < this.linkData.length; i++) {
        var link = this.linkData[i];
        if (link[this.parentIdField] == parentId && link[this.idField] == childId) {
            if (!this.allowDuplicateChildren || link[this.linkPositionField] == position) {
                return link;
            }
        }
    }
},

getLinkRecord : function(parentId, childId, position) {
    
    if (this.isANodeLocator(parentId)) {
        var nodeLocator = parentId;
        parentId = nodeLocator.parentId;
        childId = nodeLocator.node[this.idField];
        position = nodeLocator.position;
    }
    if (!this.linkDataIndex || !this.linkDataIndex[parentId] || !this.linkDataIndex[parentId][childId]) 
    {
        return null;
    }
    if (!this.allowDuplicateChildren) {
        for (var pos in this.linkDataIndex[parentId][childId]) {
            position = pos;
            break;
        }
    }
    if (position == null) return null;
    return this.linkDataIndex[parentId][childId][position];
},

_addToLevelCache : function (nodes, parent, position) {
    if (!this.indexByLevel) return;

    var level = this.getLevel(parent);
    if (!this._levelNodes[level]) this._levelNodes[level] = [];
    var levelNodes = this._levelNodes[level];

    // Special case - array is empty, just add the node to the end
    if (levelNodes.length == 0) {
        if (!isc.isAn.Array(nodes)) {
            levelNodes.push(nodes);
        } else {
            levelNodes.concat(nodes);
        }
    } else {
        // Make sure none of these nodes is already cached
        if (!isc.isAn.Array(nodes)) {
            if (levelNodes.contains(nodes)) return;
        } else {
            var cleanNodes = [];
            for (var j = 0; j < nodes.length; j++) {
                if (!levelNodes.contains(nodes[j])) {
                    cleanNodes.push(nodes[j]);
                }
            }
        }
        // Slot the node(s) into the level cache at the correct position
        var startedThisParent = false,
            siblingCount = 0,
            i = 0;
        for (i; i < levelNodes.length; i++) {
            if (this.getParent(levelNodes[i]) == parent) {
                startedThisParent = true;
            } else if (startedThisParent) {
                break;
            } else {
                continue;
            }
            // Exact equality is important - position 0 means first, position null means last
            if (siblingCount === position) {
                break;
            }
            siblingCount++;
        }
        
        if (!isc.isAn.Array(nodes)) {
            levelNodes.splice(i, 0, nodes);
        } else {
            // Using concat() because splice, push and unshift all insert the array itself,
            // not the array's contents, and a solution involving a Javascript loop would 
            // presumably cause far more churn in the array than passing everything in a 
            // single native call and letting the browser deal with it
            if (i == 0) {
                this._levelNodes[level] = cleanNodes.concat(levelNodes);
            } else if (i == levelNodes.length) {
                this._levelNodes[level] = levelNodes.concat(cleanNodes);
            } else {
                this._levelNodes[level] = 
                            levelNodes.slice(0, i).concat(cleanNodes, levelNodes.slice(i));
            }
        }
    }
},

//>	@method	tree.addList()
//
// Add a list of nodes to some parent.  See +link{ResultTree,"Modifying ResultTrees"}
// when working with a <code>ResultTree</code> for limitations.
//
// @param   nodeList      (List of TreeNode) The list of nodes to add
// @param	parent		(String | TreeNode)	Parent of the nodes being added.  You can pass
//                                          in either the +link{TreeNode} itself, or a path to
//	                                        the node (as a String), in which case a
//	                                        +link{method:Tree.find} is performed to find
//	                                        the node. 
// @param	[position]	(number)	Position of the new nodes in the children list. If not
//	                                specified, the nodes will be added at the end of the list.
// @return	(List)	List of added nodes.
//
// @see group:sharingNodes
// @visibility external
//<
addList : function (nodeList, parent, position) {
    return this._addList(nodeList, parent, position);
},
_addList : function (nodeList, parent, position) {

    var parentNodeLocator;
    if (this.isANodeLocator(parent)) {
        parentNodeLocator = parent;
        parent = parent.node;
    }

	// normalize the parent property into a node
	if (isc.isA.String(parent)) parent = this.find(parent);

	// if the parent wasn't found, return null
	if (!parent) return null;

    // we'll need to resort the children of this parent
    var children = parent[this.childrenProperty];
    if (children) this.markSubsetSortDirty(children);

    this.__addList(nodeList, parentNodeLocator || parent, position);

    if (!this._deferDataChanged) {
        this._clearNodeCache(true);
        this.dataChanged(); 
    }

    return nodeList;
},

__addList : function (nodeList, parent, position) {
    // Simply call add repeatedly for each child.
    var length = (
            isc.isA.ResultSet(nodeList) ? nodeList._getCachedLength() : nodeList.getLength());
    for (var i = 0; i < length; ++i) {
        var node = nodeList.getCachedRow(i);
        if (this.isMultiLinkTree()) {
            if (isc.isAn.Array(this._draggedLinkRecords)) {
                this._currentLinkRecord = this._draggedLinkRecords[i];
            }
        }
        if (node != null) {
            this.__add(node, parent, position != null ? (position + i) : null);
        }
    }
    if (this.isMultiLinkTree()) {
        delete this._currentLinkRecord;
        delete this._draggedLinkRecords;
    }
},


// Structural changes
// --------------------------------------------------------------------------------------------

//>	@method	tree.move()
//
// Moves the specified node to a new parent.
//
// @param	node		(TreeNode)	node to move
// @param	newParent	(TreeNode)	new parent to move the node to
// @param	[position]	(Integer)	Position of the new node in the children list. If not
//	                                specified, the node will be added at the end of the list.
// @visibility external
//<
move : function (node, newParent, position) {
    return this._move(node, newParent, position);
},
_move : function (node, newParent, position) {
    this.moveList([node], newParent, position);
},


// In some cases - EG treeGrid drag/drop, we want to slot a node before a specific
// sibling.
// In this case if any node(s) being moved are being reordered within a parent, the
// final position may differ from what you'd expect (not necessarily index-of-next-node -1)
moveBefore : function (node, nextNode) {
    this.moveListBefore([node], nextNode);
},
moveListBefore : function (nodes, nextNode, folder) {
    var parentNode = folder || this.getParent(nextNode);
    var siblings = this.getChildren(parentNode),
        position = siblings.indexOf(nextNode),
        offset = 0;

    var nodeLocators;
    if (nodes.length > 0 && this.isANodeLocator(nodes[0])) {
        nodeLocators = [];
        for (var i = 0; i < nodes.length; i++) {
            nodeLocators[nodeLocators.length] = nodes[i];
            nodes[i] = nodes[i].node
        }
    }
        
    // adjust the target position to account for nodes which are currently
    // before the target position and will be shifted forward.
    for (var i = 0; i < position; i++) {
        if (nodes.contains(siblings[i])) {
            offset += 1;
        }
    }    
    this.moveList(nodeLocators || nodes, parentNode, position-offset);
},


//>	@method	tree.moveList()
//			Move a list of nodes under a new parent.
//
//		@group	dataChanges			
//
//		@param	nodeList	(List of TreeNode)	list of nodes to move
//		@param	newParent	(TreeNode)	new parent node
//		@param	[position]	(number)	position to place new nodes at.  
//										If not specified, it'll go at the end
//<
moveList : function (nodeList, newParent, position) {
    /* Redundant
    if (this.isMultiLinkTree()) {
        // If we are trying to drag-move a node that appears in the tree more than once, the 
        // incoming nodeList will contain that node multiple times (once per instance in the 
        // tree).  So cull the dups
        for (var i = 0; i < nodeList.length; i++) {
            for (var j = i+1; j < nodeList.length; ) {
                if (nodeList[j] == nodeList[i]) {
                    nodeList.removeAt(j);
                } else {
                    j++;
                }
            }
        }
    }
    */
    

    
    for (var i = nodeList.length, duplicated = false; i--; ) {
        var node = nodeList[i];
        if (node == newParent || this.isDescendantOf(newParent, node)) {
            if (!duplicated) {
                
                duplicated = true;
                nodeList = nodeList.duplicate();
            }

            this.logWarn(
                "Tree.moveList():  Specified node '" + this.getPath(node) + "' is an " +
                "ancestor of the new parent node '" + this.getPath(newParent) + "' and " +
                "therefore cannot be made a child of that parent.  The specified node will " +
                "remain where it is.");
            nodeList.removeAt(i);
        }
    }
    if (nodeList.length == 0) {    
        
        return;
    }

    // internal flag that prevents dataChanged from firing 3 times (from the individual 
    // remove/add calls, and then at the end of this method)
    this._deferDataChanged = true;

    // Multilink trees store open state in the nodeIndex rather than on the nodes themselves, 
    // because a node can appear in multiple places in the tree.  This causes us a problem 
    // here: when the nodes are removed and re-added, the nodeIndex entries are deleted and 
    // recreated, so we lose the open state.  So we need to remember it and reapply it after
    // the move, AND we have to do this recursively because we might have just dragged the root
    // of a subtree which has open nodes at multiple levels
    if (this.isMultiLinkTree()) {
        var oldOpenState = this._getOpenStateRecursively(nodeList, newParent, position);
    }
        
	// remove the nodes from their old parents
	this._removeList(nodeList);
	
	// Note: we've removed all nodes from the list now, so no need to adjust the target
	// position to account for reshuffling etc - that's already happened.
	// just make sure that if the parent's child list has shortened because some
    // nodes from this parent were removed, we don't leave gaps.   
    
    var children = this.getChildren(newParent);
    if (children) {
        var childrenLength = (isc.isA.ResultSet(children) ?
                children._getCachedLength() : children.getLength());
        if (position > childrenLength) {
            position = childrenLength;
        }
    }

	// add the nodes to the new parent
    this._addList(nodeList, newParent, position);

    delete this._deferDataChanged;
    this._clearNodeCache(true);
    
    // Reopen any nodes that were previously open, if this is a multilink tree (unnecessary for 
    // regular trees because nodes in regular trees carry their open state around with them)
    
    if (this.isMultiLinkTree()) {
        for (var path in oldOpenState) {
            if (oldOpenState[path].openState) {
                this.changeDataVisibility(oldOpenState[path].nodeLocator, true);
            }
        }
    }

	// call the dataChanged method to notify anyone who's observing it
    this.dataChanged();
    
},

//>	@method	tree.remove()
//
// Removes a node, along with all its children.  See +link{ResultTree,"Modifying ResultTrees"}
// when working with a <code>ResultTree</code> for limitations.  Note, if this is a 
// +link{tree.isMultiLinkTree(),multi-link tree}, you must pass in a +link{NodeLocator} rather than
// a node or id.
//
// @param	node	(TreeNode | String | Integer | NodeLocator)	node to remove, or the node's ID,
//                                                              or a NodeLocator
// @return			(Boolean)	true if the tree was changed as a result of this call
//
// @visibility external
//<
remove : function (node, noDataChanged, parent) {
    return this._remove(node, noDataChanged, parent);
},
_remove : function (node, noDataChanged, parent) {

    var nodeLocator;
    if (this.isANodeLocator(node)) {
        nodeLocator = node;
        node = node.node;
    }

	// get the parent of the node
	var parent = parent || this.getParent(nodeLocator || node);
    if (! parent) return false;
    
    var parentNodeLocator;
    if (this.isMultiLinkTree()) {
        parentNodeLocator = this._getParentNodeLocator(nodeLocator);
    }
    
    this.logDebug("Removing node " + node[this.idField] + " from parent " + 
                    (parent == null ? "null" : parent[this.idField]));

//    this.logWarn("removing: " + isc.Log.echoAll(node) + " from: " + isc.Log.echoAll(parent));

    // get the children list of the parent and the name of the node
    var children = this.getChildren(parent);
    var position = null;
    if (children) {
        // Figure out the child number.
    
        if (this.isMultiLinkTree()) {
            node = this._getNodeFromIndex(node);
            var info = this._deriveIdAndPositionFromPath(nodeLocator.path);
            if (info && info.position != null && children[info.position] == node) {
                position = info.position;
            }
        }
        if (position == null) {
            position = children.indexOf(node);
            // We didn't find this node amongst the parent's children, but that might be because we
            // used pointer-equality, and if we are removing because we are drag-moving, the 
            // orignal node was cloned (this seems always to have been the case, but presumably it
            // can't have been or drag-moving would never have worked).  So, reset it to the original 
            // node by fetching from the index by ID, and then look again
            if (position == -1) {
                node = this._getNodeFromIndex(node);
                position = children.indexOf(node);
            }
        }
        if (position != -1) {
            this.__remove(nodeLocator || node, parentNodeLocator || parent, children, position);

            // This can be expensive if we're called iteratively for a large set of nodes  -
            // e.g. via _removeList(), so consult noDataChanged flag.
            if (!noDataChanged) {
                // Mark the entire tree as dirty.
                this._clearNodeCache(true);
                // Call the dataChanged method to notify anyone who's observing it.
                this.dataChanged();
            }
            return true;
        }
    }

    return false;
},


__remove : function (node, parent, children, position) {

    var nodeLocator, parentNodeLocator;
    if (this.isANodeLocator(node)) {
        nodeLocator = node;
        node = node.node;
    }
    if (this.isANodeLocator(parent)) {
        parentNodeLocator = parent;
        parent = parent.node;
    }

    var pagedResultTree = (
            isc.ResultTree != null && isc.isA.ResultTree(this) && this.isPaged());
    

    this._incrementRecursionCount(parentNodeLocator || parent);

    var info = {};
    this._preRemove(nodeLocator || node, parent, info);
    var deltaLength = info.deltaLength,
        grandParent = info.grandParent,
        origParentLength = info.origParentLength;

    // Remove the node
    children.removeAt(position);

    this._postRemove(nodeLocator || node, parentNodeLocator || parent, info);

    // Update the length of the ancestors according to the removal of the child node.
    // If the removed node was the last of the parent's children, then the parent will look
    // like a leaf to the grandparent, which may affect the lengths of the grandparent and
    // more distant ancestors.
    var grandParent = info.grandParent;

    var recursionCount = this._getRecursionCount(parentNodeLocator || parent);
    
    this._decrementRecursionCount(parentNodeLocator || parent);
    if (this._getRecursionCount(parentNodeLocator || parent) == 0) {
        if (grandParent) {
            // Check if changes in the length of the parent affect the length of the grandParent.
            var deltaParentLength = (this._getNodeLengthToParent(parent, grandParent, 
                                     info.parentPath, info.grandParentPath) - origParentLength);

            this._updateParentLengths(grandParent, deltaParentLength, info.grandParentPath);
        }
    }
},

_preRemove : function (node, parent, info) {

    var nodeLocator, nodePath, parentNodeLocator, parentPath;
    if (this.isANodeLocator(node)) {
        nodeLocator = node;
        node = node.node;
        nodePath = nodeLocator.path;
        parentPath = this._deriveParentPath(nodeLocator.path);
        parentNodeLocator = this._getParentNodeLocator(nodeLocator);
    }

    var grandParent = info.grandParent = (parent != this.root && this.getParent(parentNodeLocator || parent));
    var grandParentPath;
    if (grandParent) {
        grandParentPath = this._deriveParentPath(parentPath);
    }

    info.parentPath = parentPath;
    info.grandParentPath = grandParentPath;
    info.deltaLength = this._getNodeLengthToParent(node, parentNodeLocator || parent, nodePath, parentPath);
    // Delta on remove is negative, obviously...
    info.deltaLength *= -1;

    // Recursively remove the node and its children from the node index.  We do this rather
    // than call _remove() because we don't want to remove the children from the node
    // itself, just from the tree's cache
    this._removeFromNodeIndex(nodeLocator || node);

    info.origParentLength = grandParent &&
                                this._getNodeLengthToParent(parent, grandParent, parentPath, 
                                                                grandParentPath);

    this._removeFromLevelCache(node);

    delete node[this.parentProperty];
    delete node[this.treeProperty];
},

_postRemove : function (node, parent, info) {

    // Update the length of the parent according to the removal of the child node.
    var deltaLength = info.deltaLength;
    
    var parentNodeLocator;
    if (this.isANodeLocator(parent)) {
        parentNodeLocator = parent;
        parent = parent.node;
    }
    var parentPath = parentNodeLocator ? parentNodeLocator.path : this._deriveParentPath(info.path);
    var cachedLength = this._getCachedNodeLength(parent, parentPath);
    this._setCachedNodeLength(parent, cachedLength + deltaLength, parentPath);
},

_removeFromNodeIndex : function (node) {
    
    var nodeLocator;
    if (this.isANodeLocator(node)) {
        nodeLocator = node;
        node = node.node;
    }
    
    this._removeNodeFromIndex(nodeLocator || node);

    // In the case of a multiLink tree, the call to _removeNodeFromIndex() also removes all 
    // descendants of the removed node occurence, so we're done
    if (this.isMultiLinkTree()) return;
    var children = this.getChildren(node, null, null, null, null, null, true);
    if (!children) return;
    var length = (isc.isA.ResultSet(children) ?
            children._getCachedLength() : children.getLength());
    for (var i = 0; i < length; ++i) {
        var child = children.getCachedRow(i);
        if (child != null) {
            this._removeFromNodeIndex(child);
        }
    }
},

//>	@method	tree.removeList()
//
// Remove a list of nodes (not necessarily from the same parent), and all children of those
// nodes.  See +link{ResultTree,"Modifying ResultTrees"} when working with a
// <code>ResultTree</code> for limitations.
//
// @param	nodeList	(List of TreeNode)	list of nodes to remove
// @return				(boolean)	true if the tree was changed as a result of this call
// 
// @visibility external
//<
removeList : function (nodeList) {
    return this._removeList(nodeList);
},
_removeList : function (nodeList) {
    // this is our return value
    var changed = false;

	// simply call remove for each node that was removed

    // We can be passed the result of tree.getChildren() - if that happens, then remove() will
    // operate on the same array that we're iterating over, which means nodeList will shrink as
    // we iterate, so count down from nodeList.length instead of counting up.
    // Also note that getChildren() may return a ResultSet so the nodeList argument may be a
    // ResultSet.
    var i = (isc.isA.ResultSet(nodeList) ? nodeList._getCachedLength() : nodeList.getLength());
    while (i--) {
        var node = nodeList.getCachedRow(i);
        if (node != null) {
            if (this._remove(node, true)) {
                changed = true;
            }
        }
    }

	// call the dataChanged method to notify anyone who's observing it
	if (changed && !this._deferDataChanged) {
        this._clearNodeCache(true);
        this.dataChanged();
    }

    return changed;
},

_removeFromLevelCache : function (node, level) {
    if (!this.indexByLevel) return;
    
    level = level || this.getLevel(node) - 1;
    
    // Remove index entries for descendants first
    var nodeChildren = this.getChildren(node);
    if (nodeChildren) {
        var length = (isc.isA.ResultSet(nodeChildren) ?
                nodeChildren._getCachedLength() : nodeChildren.getLength());
        for (var i = 0; i < length; ++i) {
            var child = nodeChildren.getCachedRow(i);
            if (child != null) {
                this._removeFromLevelCache(child, level + 1);
            }
        }
    }
    
    if (this._levelNodes[level]) {
        var levelNodes = this._levelNodes[level];
        for (var i = 0; i < levelNodes.length; i++) {
            if (levelNodes[i] == node) {
                levelNodes.splice(i, 1);
                break;
            }
        }
    }
},


// Loading and unloading of children
// --------------------------------------------------------------------------------------------


//>	@method	tree.getLoadState()
// What is the loadState of a given folder?
//
// @param node (TreeNode) folder in question
// @return (LoadState) state of the node
// @group loadState			
// @visibility external
//<
getLoadState : function (node) {
    if (!node) return null;
    if (this.isLeaf(node)) return isc.Tree.LOADED;
    if (!node._loadState) return this.defaultLoadState;
    return node._loadState;
},

//>	@method	tree.isLoaded()
// For a databound tree, has this folder either already loaded its children or is it in the
// process of loading them.
//
// @param node (TreeNode) folder in question
// @return (Boolean) folder is loaded or is currently loading
// @group loadState
// @visibility external
//<
isLoaded : function (node) {
    var loadState = this.getLoadState(node);
    return (
        loadState == isc.Tree.LOADED ||
        loadState == isc.Tree.LOADING ||
        loadState == isc.Tree.LOADED_PARTIAL_CHILDREN);
},

// helper to support ResultTree.hideLoadingNodes
isLoading : function (node) {
    return this.getLoadState(node) == isc.Tree.LOADING;
},

//>	@method	tree.allChildrenLoaded()
// For a databound tree, do the children of this folder form a ResultSet with a full cache.
// <P>
// Note that this method only applies to +link{resultTree.fetchMode} "paged".
// @param node (TreeNode) folder in question
// @return (Boolean) folder's children are a ResultSet with a full cache
// @group loadState
// @see tree.getChildrenResultSet()
// @visibility external
//<
allChildrenLoaded : function (node) {
    var loadState = this.getLoadState(node);
    return (loadState == isc.Tree.LOADED);
},

//>	@method	tree.setLoadState()
// Set the load state of a particular node.
// @group loadState			
// @param node (TreeNode) node in question
// @param newState (String) new state to set to
// @return (boolean) folder is loaded or is currently loading
//<
setLoadState : function (node, newState) {
    var prevState = this.getLoadState(node);
    if (node) node._loadState = newState;
    newState = this.getLoadState(node);

    // The load state of the node affects the _visibleDescendantsCachedProperty set on the
    // nodes of paged ResultTrees.  Update the value of that property of the node if necessary.
    var prevFlag = (
            prevState === isc.Tree.LOADED ||
            prevState === isc.Tree.LOADED_PARTIAL_CHILDREN),
        newFlag = (
            newState === isc.Tree.LOADED ||
            newState === isc.Tree.LOADED_PARTIAL_CHILDREN),
        pagedResultTree = (
            isc.ResultTree != null && isc.isA.ResultTree(this) && this.isPaged());
    if (pagedResultTree && (prevFlag != newFlag)) {
        // Only update the _visibleDescendantsCachedProperty if it has been set before on the
        // node.
        var parent = this.getParent(node);
        if (isc.isA.Boolean(node[this._visibleDescendantsCachedProperty])) {
            this._setVisibleDescendantsCached(node, null, parent, false);
        }
    }
},

//>	@method	tree.loadRootChildren()
//			Load the root node's children.
//			Broken out into a special function so you can override more cleanly
// 				(default implementation just calls loadChildren)
//      @param  [callback]  (Callback) StringMethod to fire when loadChildren() has loaded data.
//		@group	loadState			
//<
loadRootChildren : function (callback) {
	this.loadChildren(this.root, callback);
},

//>	@method	tree.loadChildren()
// Load the children of a given node.
// <P>
// For a databound tree this will trigger a fetch against the Tree's DataSource.
//
//
// @param node	(TreeNode)	node in question
// @param [callback] (DSCallback) Optional callback (stringMethod) to fire when loading 
//                      completes. Has a single param <code>node</code> - the node whose 
//                      children have been loaded, and is fired in the scope of the Tree.
// @group loadState			
// @visibility external
//<
loadChildren : function (node, callback) {
    var nodeLocator;
    if (this.isANodeLocator(node)) {
        nodeLocator = node;
        node = node.node;
    }
    if (!node) {
        node = this.root;
    }
    var pagedResultTree = (
            isc.ResultTree != null && isc.isA.ResultTree(this) && this.isPaged());
    if (pagedResultTree) {
        this._loadChildren(nodeLocator || node, 0, this.resultSize, callback);
    } else {
        this._loadChildren(nodeLocator || node, null, null, callback);
    }
},


_loadChildren : function (node, start, end, callback) {
    

	// mark the node as loaded
	this.setLoadState(node, isc.Tree.LOADED);
    if (callback) {
        //Fire the callback in the scope of this tree
        this.fireCallback(callback, "node", [node], this);
    }
},

//>	@method	tree.unloadChildren()
// Unload the children of a folder, returning the folder to the "unloaded" state.
//
// @param node (TreeNode) folder in question
// @group loadState
// @deprecated It's recommended that you instead use +link{tree.reloadChildren()} to reload the
// children of a folder, or +link{tree.removeChildren()} if you need to clear the cached children
// of a folder to add specific local data.
// @visibility external
//<
// NOTE internal parameter:	[displayNodeType]	(DisplayNodeType)	Type of children to drop
unloadChildren : function (node, displayNodeType, markAsLoaded) {
    if (node == null || this.isLeaf(node)) {
        return;
    }

    var droppedChildren, newChildren, newLoadState;
	if (displayNodeType == isc.Tree.LEAVES_ONLY) {
        // set the children array to just the folders
        droppedChildren = this.getLeaves(node);
        newChildren = this.getFolders(node);
		// and mark the node as only the folders are loaded
        newLoadState = isc.Tree.FOLDERS_LOADED;
	} else {
        // clear out the children Array
        droppedChildren = node[this.childrenProperty];
        newChildren = [];
		// and mark the node as unloaded
        newLoadState = isc.Tree.UNLOADED;
	}

    var parent, origLength;
    if (droppedChildren) {
        parent = (node != this.root && this.getParent(node));
        origLength = parent && this._getNodeLengthToParent(node, parent);

        for (var i = 0; i < droppedChildren.getLength(); i++) {
            var droppedChild = droppedChildren.get(i);

            // skip anything that doesn't appear to be a valid child node of parent
            if (!isc.isAn.Object(droppedChild) || droppedChild[this.idField] == null) continue;

            // take the droppedChildren out of the node index
            // NOTE: we shouldn't just call _remove() to do this.  unloadChildren() is essentially
            // discarding cache, whereas calling _remove() in a dataBound tree would actually kick off a
            // DataSource "remove" operation
            this._removeFromNodeIndex(droppedChild);

            
            
            node[this._cachedLengthProperty] -= this._getNodeLengthToParent(droppedChild, node);
        }
    }

    node[this.childrenProperty] = newChildren;
    this.setLoadState(node, markAsLoaded ? isc.Tree.LOADED : newLoadState);

    if (droppedChildren && parent) {
        // Update the lengths of the ancestors of the dropped children.  The children's parent,
        // node, already has had its length updated.  Now just update the length of the node's
        // ancestors.
        var deltaLength = (this._getNodeLengthToParent(node, parent) - origLength);
        this._updateParentLengths(parent, deltaLength);
    }

	// mark the tree as dirty and note that the data has changed
	this._clearNodeCache(true);
	this.dataChanged();
},

//>	@method	tree.reloadChildren()
// Reload the children of a folder.
//
// @param node (TreeNode) node in question
// @see removeChildren()
// @group loadState			
// @visibility external
//<

reloadChildren : function (node, displayNodeType) {
	this.unloadChildren(node, displayNodeType);
	this.loadChildren(node, displayNodeType);
},

//>	@method	tree.removeChildren()
// Removes all children of the node and sets it to a loaded state.  For non-+link{ResultTree}s,
// or non-+link{ResultTree.fetchMode,paged} <code>ResultTree</code>s, +link{add()} or
// +link{addList()} can then be used to provide new children.  For
// +link{ResultTree.fetchMode,paged} <code>ResultTrees</code>, +link{DataSource.updateCaches()}
// must be used to insert nodes into the cache as local data, since such
// <code>ResultTree</code>s are considered read-only, and +link{add} and +link{addList()} are
// not perrmitted.
//
// @param node (TreeNode) folder in question
// @see getLoadState()
// @see reloadChildren()
// @group loadState
// @visibility external
//<

removeChildren : function (node, displayNodeType) {
    
    this.unloadChildren(node, displayNodeType, true);
},

//>	@method	tree.setChildren()
// Replaces the existing children of a parent node, leaving the node in the loaded state.
// Only a flat list of children nodes is supported, as in +link{addList()}.
// 
// @param parent                (TreeNode) parent of children
// @param newChildren   (List of TreeNode) children to be set
//
// @see removeChildren()
// @see dataSource.updateCaches()
//
// @group loadState
// @visibility external
//<
setChildren : function (parent, newChildren) {
    // remove current children
    this.removeChildren(parent);
    // add new children to parent
    this.addList(newChildren || [], parent);
},

//
//	open and close semantics for a set of tree nodes
//


// clears the open node cache (used by getOpenList())
// and optionally the all node cache (used by getNodeList()).
_clearNodeCache : function (allNodes) {
    if (allNodes) this._allListCache = null;
    this._openListCache = null;
},

//>	@method	tree.setOpen()
//
// Mark a particular node as open or closed (works for leaves and folders).  Note, this method
// simply encapsulates the setting of the state, so we don't have code directly acessing state
// scattered throughout this class.  openFolder(), closeFolder() and toggleFolder() are the APIs 
// that should be used (both by application code and internally) to actually open or close a 
// folder
//
// @param	node	(TreeNode | String | Integer | NodeLocator)	the node in question, or the 
//                                                              the node's ID, or a NodeLocator
//                                                              object               
// @param   state   (Boolean)  the new state
// @visibility internal
//<
setOpen : function (node, state) {
    var nodeLocator;
    if (this.isANodeLocator(node)) {
        nodeLocator = node;
        node = node.node;
    }
    if (!this.isMultiLinkTree()) {
        if (node != null) node[this.openProperty] = !!state;
    } else {
        this._setNodeOpenStateInIndex(nodeLocator || node, !!state);
    }
},

//>	@method	tree.isOpen()
//
// Whether a particular node is open or closed (works for leaves and folders).  Note, for
// +link{tree.isMultiLinkTree(),multi-link tree}s, passing a <code>NodeLocator</code> is the only
// unambiguous way to specify the node.
//
// @param	node	(TreeNode | String | Integer | NodeLocator)	the node in question, or the 
//                                                              the node's ID, or a NodeLocator
//                                                              object               
// @return  (Boolean)           true if the node is open
//
// @visibility external
//<
isOpen : function (node, path) {
    var nodeLocator;
    if (this.isANodeLocator(node)) {
        nodeLocator = node;
        node = node.node;
    }
    
    if (!this.isMultiLinkTree()) {
        return node != null && !!node[this.openProperty];
    } else {
        return this._getNodeOpenStateFromIndex(nodeLocator || node, path);
    }
},


//>	@method	tree.getOpenFolders()
//		Return the list of sub-folders of this tree that have been marked as open.
//		Note: unlike tree.getOpenList(), this only returns *folders* (not files),
//			and this will return nodes that are open even if their parent is not open.
//		@group	openList			
//
//		@param	node	(TreeNode | String | Integer | NodeLocator)	the node to start with, or the 
//                                                              the node's ID, or a NodeLocator
//                                                              object. If not passed, 
//                                                              this.root will be used.
//<
getOpenFolders : function (node, parent, position) {
    if (node == null) node = this.root;
    var nodeLocator;
    if (this.isANodeLocator(node)) {
        nodeLocator = node;
        node = node.node;
    } else if (this.isMultiLinkTree()) {
        nodeLocator = this.createNodeLocator(node, parent, position);
    }
    var openProperty = this.openProperty;
    var _this = this;
    var openNodes = this.getDescendantFolders(node, function (node) {
        return node[openProperty];
        
    });
	if (this.isOpen(nodeLocator || node)) {
        openNodes.add(node);
    }
	return openNodes;
},

//>	@method	tree.getOpenFolderPaths()
//		Return the list of sub-folders of this tree that have been marked as open.
//		Note: unlike tree.getOpenList(), this only returns *folders* (not files),
//			and this will return nodes that are open even if their parent is not open.
//		@group	openList			
//
//		@param	node	(TreeNode)	node to start with.  If not passed, this.root will be used.
//<
getOpenFolderPaths : function (node) {
	var openNodes = this.getOpenFolders(node);
	for (var i = 0; i < openNodes.length; i++) {
		openNodes[i] = this.getPath(openNodes[i]);
	}
	return openNodes;
},

//>	@method	tree.changeDataVisibility()	(A)
// Open or close a node.<br><br>
//
// Note that on a big change (many items being added or deleted) this may be called multiple times.
//
//		@group	openList			
//
//		@param	node		(TreeNode | String | Integer | NodeLocator)	the node in question, or
//                                                                      its ID, or a NodeLocator
//                                                                      object
//		@param	newState	(boolean)	true == open, false == close
//      @param  [callback] (Callback) Optional callback (stringMethod) to fire when loading 
//                      completes. Has a single param <code>node</code> - the node whose 
//                      children have been loaded, and is fired in the scope of the Tree.
//<
changeDataVisibility : function (node, newState, callback, path) {
//!DONTOBFUSCATE  (obfuscation breaks the inline function definitions)

    var nodeLocator, nodeId;
    if (this.isANodeLocator(node)) {
        nodeLocator = node;
        node = node.node;
        if (!path) {
            path = nodeLocator.path;
        }
    } else if (this.isMultiLinkTree()) {
        nodeLocator = this.createNodeLocator(node, null, null, path);
    }
    if (!isc.isAn.Object(node)) {
        node = this._getNodeFromIndex(node);
    }

    

	// if they're trying to open a leaf return false
	if (this.isLeaf(node)) {
        if (callback) {
            // Fire the callback in the scope of this tree
            this.fireCallback(callback, "node", [node], this);
        }
        return false;
    }

	// mark the node as open or closed
    var state = this.isOpen(nodeLocator || node),
        closedToOpen = !state && newState,
        openToClosed = state && !newState;

    // If the node's openness has changed then its cached length may also have changed.
    if (closedToOpen || openToClosed) {
        var parent = (node != this.root && this.getParent(nodeLocator || node)) || null,
            parentPath = this._deriveParentPath(path),
            prevLength = parent && this._getNodeLengthToParent(node, parent, path, parentPath),
            newLength = (this.openDisplayNodeType != isc.Tree.LEAVES_ONLY ? 1 : 0);

        this.setOpen(nodeLocator || node, newState);

        if (closedToOpen) {
            // node went from closed to open so its length includes the lengths of the children.
            var childrenInOpenList = this.getChildren(
                    node, isc.Tree.FOLDERS_AND_LEAVES, null,
                    this.sortDirection, this.openListCriteria, this._sortContext,
                    true, true, true),
                loadingMarker = (
                    isc.ResultSet != null ? isc.ResultSet.getLoadingMarker() : null);
            // If getChildren returned null, convert to an empty array
            
            if (childrenInOpenList == null) childrenInOpenList = [];
            var i = (isc.isA.ResultSet(childrenInOpenList) ?
                    childrenInOpenList._getCachedLength() : childrenInOpenList.getLength());

            
            var pagedResultTree = (
                    isc.ResultTree != null && isc.isA.ResultTree(this) && this.isPaged()),
                knownLengthNulls = pagedResultTree;
            if (pagedResultTree) {
                var openSubfoldersAllowed = (
                        node[this.canReturnOpenSubfoldersProperty] != null ?
                        node[this.canReturnOpenSubfoldersProperty] : this.canReturnOpenFolders),
                    defaultChildLength = (
                        this.openDisplayNodeType == isc.Tree.FOLDERS_AND_LEAVES ? 1 : 0);

                knownLengthNulls = !(openSubfoldersAllowed || defaultChildLength == 0);
            }

            var indexByChild = {};
            while (i--) {
                var child = childrenInOpenList.getCachedRow(i);
                if (child != null && child != loadingMarker) {
                    var childId = child[this.idField],
                        childPath;
                    if (this.isMultiLinkTree()) {
                        indexByChild[childId] = indexByChild[childId] == null ? 0 : indexByChild[childId] + 1;
                        var childLocator = this.createNodeLocatorWithRelativePosition(
                            child, 
                            nodeLocator.node[this.idField],
                            indexByChild[childId]
                        );
                        childPath = this._constructChildPath(path, child, childLocator.position);
                    }
                    newLength += this._getNodeLengthToParent(child, node, childPath, path);
                } else if (knownLengthNulls) {
                    ++newLength;
                }
            }
        }

        
        var prevCachedLength = this._getCachedNodeLength(node, path);
        this._setCachedNodeLength(node, newLength, path);

        // Add the change in length to all ancestors
        if (parent) {
            var deltaLength = this._getNodeLengthToParent(node, parent, path, parentPath) - prevLength;
            var grandParentPath;
            if (this.isMultiLinkTree()) {
                grandParentPath = this._deriveParentPath(nodeLocator.path);
            }
            this._updateParentLengths(parent, deltaLength, grandParentPath);
        }

        // Incrementally add/remove the node to/from the _openListCache array.
        var affectsOpenListCache = (
                this._openListCache != null &&
                // If the node is the root then this optimization would just be regenerating
                // the open list anyway.  It would be better not to do anything here and let
                // the open list be regenerated lazily by _getOpenList().
                parent != null &&
                // If the `openDisplayNodeType` allows only leaves then only the leaves under
                // the root folder will ever appear in the open list, so the node and its
                // descendants cannot appear in the open list.
                this.openDisplayNodeType != isc.Tree.LEAVES_ONLY &&
                // Skip if there are no nodes to add/remove from the open list.
                (closedToOpen ? newLength > prevCachedLength : newLength < prevCachedLength) &&
                this._includeNodeLengthInParent(node, parent, parentPath));
        for (var n = node, p = parent, np = path; p != null && affectsOpenListCache; ) {
            n = p;
            np = this._deriveParentPath(np);
            if (np) {
                p = this._getParentFromIndexByPath(n, np);
            } else {
                p = this.getParent(p);
            }
            affectsOpenListCache = (p == null || this._includeNodeLengthInParent(n, p, this._deriveParentPath(np)));
        }
        if (parent == null) {
            this._clearNodeCache(false);
        } else if (affectsOpenListCache) {
            // Count the number of nodes preceding `node` in the open list.  Add one to get
            // the starting index of the descendants of `node` in the open list.  This will
            // be passed to splice() to add/remove nodes starting at that index.
            var loadingMarker = (isc.ResultSet != null ? isc.ResultSet.getLoadingMarker() : null),
                foldersInOpenList = (this.openDisplayNodeType != isc.Tree.LEAVES_ONLY),
                // When getting lists of children, the displayNodeType must match all folders
                // (so that we can find a specific folder `n` in each iteration of the
                // following loop) and it must incorporate the current `openDisplayNodeType`
                // (so that all nodes with nonzero length are counted).
                displayNodeType = (
                    this.openDisplayNodeType == isc.Tree.FOLDERS_ONLY
                        ? isc.Tree.FOLDERS_ONLY : isc.Tree.FOLDERS_AND_LEAVES),
                openListIndex = (foldersInOpenList && this.showRoot ? 1 : 0);
            for (var n = node, p = parent, np = path; p != null; ) {
                var children = this.getChildren(
                        p, displayNodeType, this._openNormalizer, this.sortDirection,
                        this.openListCriteria, this._sortContext, true);
                if (children == null) children = [];
                
                var length = (isc.ResultSet != null && isc.isA.ResultSet(children) ?
                        children._getCachedLength() : children.getLength());
                

                var indexByChild = {};
                for (var i = 0; i < length; ++i) {
                    var child = children.getCachedRow(i);
                    var childId = child[this.idField];
                    indexByChild[childId] = indexByChild[childId] == null ? 0 : indexByChild[childId] + 1;
                    var foundThisNode = false;
                    var thisChildPath;
                    if (child == n) {
                        if (this.isMultiLinkTree()) {
                            var thisParentPath = this._deriveParentPath(np),
                                locator = this.createNodeLocatorWithRelativePosition(
                                    child, 
                                    p,
                                    indexByChild[childId]
                                ),
                                thisChildPath = this._constructChildPath(thisParentPath, child, locator.position);
                        }
                        if (!this.isMultiLinkTree() || thisChildPath == np) {
                            if (foldersInOpenList) {
                                ++openListIndex;
                            }
                            // Break from the loop.
                            foundThisNode = true;
                            i = length;
                        }
                    }
                    if (!foundThisNode && !(child == null || child == loadingMarker)) {
                        var thisParentPath;
                        if (this.isMultiLinkTree()) {
                            thisParentPath =  this._deriveParentPath(np);
                            var locator = this.createNodeLocatorWithRelativePosition(
                                child, 
                                p,
                                indexByChild[childId]
                            );
                            thisChildPath = this._constructChildPath(thisParentPath, child, locator.position);
                        }
                        openListIndex += this._getNodeLengthToParent(child, p, thisChildPath, thisParentPath);
                    }
                }

                n = p;
                np = this._deriveParentPath(np);
                if (np) {
                    p = this._getParentFromIndexByPath(p, np);
                } else {
                    p = this.getParent(p);
                }
            }

            
            if (closedToOpen) {
                var partialRowNumIndex = [];
                var args = this.getOpenList(
                        nodeLocator || node, this.openDisplayNodeType, this._openNormalizer,
                        this.sortDirection, this.openListCriteria, this._sortContext, false,
                        null, partialRowNumIndex);
                
                

                // Set the first two arguments so that no nodes are removed from the
                // _openListCache and that nodes are added starting at the `openListIndex`.
                if (foldersInOpenList) {
                    args[0] = 0;
                    args.unshift(openListIndex);
                    partialRowNumIndex[0] = 0;
                    partialRowNumIndex.unshift(openListIndex);
                } else {
                    args.unshift(openListIndex, 0);
                    partialRowNumIndex.unshift(openListIndex, 0);
                }
                
                this._openListCache.splice.apply(this._openListCache, args);
                if (this.isMultiLinkTree()) {
                    this.recordNumberToNodeLocatorIndex.splice.apply(this.recordNumberToNodeLocatorIndex, partialRowNumIndex);
                    partialRowNumIndex.shift();
                    if (foldersInOpenList) partialRowNumIndex.shift();
                    this._updateOpenListIndexInNodeLocators(openListIndex, true);
                }

            } else { // openToClosed
                this._openListCache.splice(openListIndex, prevCachedLength - newLength);
                if (this.isMultiLinkTree()) {
                    this.recordNumberToNodeLocatorIndex.splice(openListIndex, prevCachedLength - newLength);
                    this._updateOpenListIndexInNodeLocators(openListIndex, false);
                }
            }
        }
    } else {
        this.setOpen(nodeLocator || node, newState);
    }

	// if the node is not loaded, load it!
	if (newState && !this.isLoaded(node)) {
		this.loadChildren(nodeLocator || node, callback);
	} else if (callback) {
        // Fire the callback in the scope of this tree
        this.fireCallback(callback, "node", [node], this);
    }
},

//>	@method	tree.toggleFolder()
//			Toggle the open state for a particular node.  Note, for
// +link{tree.isMultiLinkTree(),multi-link tree}s, passing a <code>NodeLocator</code> is the only
// unambiguous way to specify the node.
//		@group	openList			
//
//		@param	node	(TreeNode | String | Integer | NodeLocator)	the node in question, or its
//                                                                  ID, or a NodeLocator object
//<
toggleFolder : function (node) {
    this.changeDataVisibility(node, !this.isOpen(node), null);
},


//>	@method	tree.openFolder()
//
// Open a particular node.  Note, for +link{tree.isMultiLinkTree(),multi-link tree}s, passing a 
// <code>NodeLocator</code> is the only unambiguous way to specify the node.
//
//		@param	node	(TreeNode | String | Integer | NodeLocator)	the node to open, or its
//                                                                  ID, or a NodeLocator object
// @param  [callback] (Callback) Optional callback (stringMethod) to fire when loading 
//                      completes. Has a single param <code>node</code> - the node whose 
//                      children have been loaded, and is fired in the scope of the Tree.
// @see ResultTree.dataArrived
// @visibility external
//<
openFolder : function (node, callback) {
    var nodeLocator;
    if (this.isANodeLocator(node)) {
        nodeLocator = node;
        node = node.node;
    }
    
	if (node == null) node = this.root;
	// if the node is not already set to the newState
	if (!this.isOpen(nodeLocator || node)) {			
		// call the dataChanged method to notify anyone who's observing it
		this.changeDataVisibility(nodeLocator || node, true, callback);
	} else if (callback) {
        // Fire the callback in the scope of this tree
        this.fireCallback(callback, "node", [node], this);
    }
},


//>	@method	tree.openFolders()
//
// Open a set of folders, specified by path or as pointers to nodes.
//
// @param	nodeList	(List of TreeNode)		List of nodes or node paths or NodeLocators
//
// @see ResultTree.dataArrived
// @visibility external
//<
openFolders : function (nodeList) {
	for (var i = 0; i < nodeList.length; i++) {
		var node = nodeList[i];
        var nodeLocator;
        if (this.isANodeLocator(node)) {
            nodeLocator = node;
            node = node.node;
        }
        if (node == null) continue;
		if (isc.isA.String(node)) node = this.find(node);
		if (node != null) {
			this.openFolder(nodeLocator || node);
		}
	}
},

//>	@method	tree.closeFolder()
//
// Closes a folder.  Note, for +link{tree.isMultiLinkTree(),multi-link tree}s, passing a 
// <code>NodeLocator</code> is the only unambiguous way to specify the node.
//
//		@param	node	(TreeNode | String | Integer | NodeLocator)	the node to open, or its
//                                                                  ID, or a NodeLocator object
//
// @visibility external
//<
closeFolder : function (node) {
    var nodeLocator;
    if (this.isANodeLocator(node)) {
        nodeLocator = node;
        node = node.node;
    }
    
	// if the node is not already set to the newState
	if (this.isOpen(nodeLocator || node)) {			
		// call the dataChanged method to notify anyone who's observing it
		this.changeDataVisibility(nodeLocator || node, false, null);
	}
},

//>	@method	tree.closeFolders()
//
// Close a set of folders, specified by path or as pointers to nodes.
//
// @param	nodeList	(List of TreeNode)		List of nodes or node paths or NodeLocators
//
// @visibility external
//<
closeFolders : function (nodeList) {
	for (var i = 0; i < nodeList.length; i++) {
		var node = nodeList[i];
        var nodeLocator;
        if (this.isANodeLocator(node)) {
            nodeLocator = node;
            node = node.node;
        }
		if (node == null) continue;
		if (isc.isA.String(node)) node = this.find(node);
		if (node != null) {
			this.closeFolder(nodeLocator || node);
		}
	}
},

//>	@method	tree.openAll()
//
// Open all nodes under a particular node.
//
// @param	[node]	(TreeNode | String | Integer | NodeLocator)	node from which to open folders, 
//                                                              or the node's ID, or a 
//                                                              NodeLocator object (if not 
//                                                              specified, the root node is used)
// @visibility external
// @example parentLinking
//<
openAll : function (node) {
    var nodeLocator;
    if (this.isANodeLocator(node)) {
        nodeLocator = node;
        node = node.node;
    }
    if (!isc.isAn.Object(node)) {
        node = this._getNodeFromIndex(node);
    }
	if (!node) node = this.root;
    if (node == this.root) {
        // Mark the open node list as dirty.  This avoids an optimization to incrementally
        // maintain the _openListCache array that would not work very well for a bulk operation
        // like this.
        this._clearNodeCache(false);
        if (this.isMultiLinkTree()) {
            nodeLocator = this.createNodeLocator(node, null, null, this.pathDelim);
        }
    }
    
    var nodeList;
    if (this.isMultiLinkTree()) {
        nodeList = this.getDescendantNodeLocators(nodeLocator, isc.Tree.FOLDERS_ONLY);
    } else {
        nodeList = this.getDescendants(node, isc.Tree.FOLDERS_ONLY);
    }
	for (var i = 0, length = nodeList.length; i < length; i++) {
		// if the node is not already set to the newState
		if (!this.isOpen(nodeList[i])) {			
			// call the dataChanged method to notify anyone who's observing it
			this.changeDataVisibility(nodeList[i], true);
		}
	}
	// make the node itself open
	this.changeDataVisibility(nodeLocator || node, true);
},

//>	@method	tree.closeAll()
// Close all nodes under a particular node
//
// @param	[node]	(TreeNode | NodeLocator) node from which to close folders (if not specified, 
//                                           the root node is used).  If this is a 
//                                           +link{isMultiLinkTree(),multi-link tree}, you must 
//                                           provide a +link{object:NodeLocator} for any node other
//                                           than the root node
//
// @visibility external
//<
closeAll : function (node) {
    var nodeLocator;
	if (!node) {
        node = this.root;
    }
    if (this.isMultiLinkTree()) {
        if (this.isANodeLocator(node)) {
            nodeLocator = node;
            node = node.node;
        } else {
            
            nodeLocator = this.createNodeLocator(node, null, null, this.pathDelim);
        }
    }
    if (node == this.root) {
        // Mark the open node list as dirty.  This avoids an optimization to incrementally
        // maintain the _openListCache array that would not work very well for a bulk operation
        // like this.
        this._clearNodeCache(false);
    }
    var nodeList;
    if (!this.isMultiLinkTree()) {
        nodeList = this.getDescendants(node, isc.Tree.FOLDERS_ONLY);
    } else {
        nodeList = this.getDescendantNodeLocators(nodeLocator, isc.Tree.FOLDERS_ONLY);
    }
	for (var i = 0, length = nodeList.length; i < length; i++) {
		// if the node is not already set to the newState
		if (this.isOpen(nodeList[i])) {			
			// call the dataChanged method to notify anyone who's observing it
			this.changeDataVisibility(nodeList[i], false);
		}
	}

	// close the node as well, unless (node==this.root and this.showRoot == false)
	//	this way we make sure you won't close an invisible root, 
	//  leaving no way to re-open it.
	if (!(node == this.root && this.showRoot == false)) this.changeDataVisibility(node, false);
},

setOpenDisplayNodeType : function (openDisplayNodeType) {
    var prevOpenDisplayNodeType = this.openDisplayNodeType;
    this.openDisplayNodeType = openDisplayNodeType;
    if (prevOpenDisplayNodeType != openDisplayNodeType) {
        this._clearNodeCache(true);
    }
},

setOpenListCriteria : function (openListCriteria) {
    var prevOpenListCriteria = this.openListCriteria;
    this.openListCriteria = openListCriteria;
    if (prevOpenListCriteria != openListCriteria) {
        this._clearNodeCache(true);
    }
},

setSortProp : function (sortProp) {
    var prevSortProp = this.sortProp;
    this.sortProp = sortProp;
    if (prevSortProp != sortProp) {
        this._clearNodeCache(true);
    }
},

setSortDirection : function (sortDirection) {
    var prevSortDirection = this.sortDirection;
    this.sortDirection = sortDirection;
    if (prevSortDirection != sortDirection) {
        this._clearNodeCache(true);
    }
},

//> @method tree.setShowRoot()
// Setter for +link{Tree.showRoot}.
// @param showRoot (Boolean) new <code>showRoot</code> value
// @visibility external
//<
setShowRoot : function (showRoot) {
    var prevShowRoot = this.showRoot;
    this.showRoot = showRoot;
    if (this.openDisplayNodeType != isc.Tree.LEAVES_ONLY) {
        if (!prevShowRoot && showRoot) {
            // Add the root to the _allListCache and the _openListCache.
            if (this._allListCache != null) {
                this._allListCache.unshift(this.root);
            }
            if (this._openListCache != null) {
                this._openListCache.unshift(this.root);
            }
        } else if (prevShowRoot && !showRoot) {
            
            // Remove the root from the _allListCache and the _openListCache.
            if (this._allListCache != null) {
                this._allListCache.shift();
            }
            if (this._openListCache != null) {
                this._openListCache.shift();
            }
        }
    }
},

//> @method tree.setSeparateFolders()
// Setter for +link{Tree.separateFolders}.
// @param separateFolders (Boolean) new <code>separateFolders</code> value
// @visibility external
//<
setSeparateFolders : function (separateFolders) {
    var prevSeparateFolders = this.separateFolders;
    this.separateFolders = separateFolders;
    if (prevSeparateFolders ? !separateFolders : separateFolders) {
        this._clearNodeCache(true);
    }
},

//> @method tree.setSortFoldersBeforeLeaves()
// Setter for +link{Tree.sortFoldersBeforeLeaves}.
// @param sortFoldersBeforeLeaves (Boolean) new <code>sortFoldersBeforeLeaves</code> value
// @visibility external
//<
setSortFoldersBeforeLeaves : function (sortFoldersBeforeLeaves) {
    var prevSortFoldersBeforeLeaves = this.sortFoldersBeforeLeaves;
    this.sortFoldersBeforeLeaves = sortFoldersBeforeLeaves;
    if (prevSortFoldersBeforeLeaves ? !sortFoldersBeforeLeaves : sortFoldersBeforeLeaves) {
        this._clearNodeCache(true);
    }
},





//>	@method	tree.getOpenList()
// Return a flattened list of all nodes that are visible under some parent based on whether the node
// itself or any folders underneath it are open.  Returned list will include the passed node.
// <p>
// If the passed in node is a leaf, this method returns null.
//
// @param	node	(TreeNode | String | Integer | NodeLocator)	the node in question, or the 
//                                                              the node's ID, or a NodeLocator
//                                                              object.  Defaults to the root node
// @return					(List of TreeNode)      		flattened list of open nodes
//
// @visibility external
//<

getOpenList : function (node, displayNodeType, normalizer, sortDirection, criteria, context, 
                        getAll, dontUseNormalizer, partialRowNumIndex) 
{

    var nodeLocator;
    if (this.isANodeLocator(node)) {
        nodeLocator = node;
        node = node.node;
    }

    

    // default to the tree root
	if (!node) {
        node = this.root;
    }
    if (node == this.root && !nodeLocator && this.isMultiLinkTree()) {
        nodeLocator = this.createNodeLocator(node, null, null, this.pathDelim);
    }
    

	// default the normalizer to this._openNormalizer and sortDirection to this.sortDirection
    if (dontUseNormalizer) normalizer = null;
    else if (normalizer == null) normalizer = this._openNormalizer;
	if (sortDirection == null)		sortDirection = this.sortDirection;
	if (context == null) context = this._sortContext;
	// if the node is a leaf, return the empty list since it's not going to have any children
	if (this.isLeaf(node)) { 
        // prevents mysterious crash if an isFolder() override claims root is a leaf
        if (node == this.root) return []; 
        return null;
    }

	// create an array to hold the descendants
    var list = [];
    
    partialRowNumIndex = partialRowNumIndex || [];

	// add the node if we're not skipping folders (except if the node is the root and showRoot is false)
    if (displayNodeType != isc.Tree.LEAVES_ONLY && (node != this.root || this.showRoot)) {
        list[list.length] = node;
        if (this.isMultiLinkTree()) {
            
            partialRowNumIndex[partialRowNumIndex.length] = nodeLocator;
        }
    }

    // if this node is closed or loading, just return the list and don't look for children
	if (!getAll && !this.isOpen(nodeLocator || node) || this.hideLoadingNodes && this.isLoading(node)) {
        return list;
    }

    // iterate through all the children of the node
    var children = this.getChildren(node, isc.Tree.FOLDERS_AND_LEAVES, normalizer,
                       sortDirection, criteria, context, false, false, dontUseNormalizer);
    // for each child
    var loadingMarker = (isc.ResultSet != null ? isc.ResultSet.getLoadingMarker() : null),
        length = (isc.ResultSet != null && isc.isA.ResultSet(children) ?
            children._getCachedLength() : children.getLength());
    
    var indexByChild = {};
    for (var i = 0; i < length; ++i) {
        // get a pointer to the child
        var child = children.getCachedRow(i);
        if (child == null || child == loadingMarker) {
            
            continue;
        }

        var childId = child[this.idField];

        var childNodeLocator;
        if (this.isMultiLinkTree()) {
            indexByChild[childId] = indexByChild[childId] == null ? 0 : indexByChild[childId] + 1;
            childNodeLocator = this.createNodeLocatorWithRelativePosition(
                child, 
                node[this.idField],
                indexByChild[childId]
            );
            childNodeLocator.path = this._constructChildPath(nodeLocator.path, child, 
                                                                childNodeLocator.position);

        }

        

        // if the child is a folder, recurse, but check that it actually has children -
        // otherwise we eat a function call, array alloc, empty concat, and a bunch of other
        // checks (top of this function) all for nothing.  This is a typical case for loading a
        // large set of folders from the server in loadOnDemand mode
        //
        var grandChildren = child[this.childrenProperty];
        if (grandChildren && !grandChildren.isEmpty()) {
            // now concatenate the list with the descendants of the child
            
            var subList = this.getOpenList(childNodeLocator || child, displayNodeType,
                                           normalizer, sortDirection, criteria, context,
                                           getAll, dontUseNormalizer, partialRowNumIndex);
            if (subList) {
                for (var j = 0; j < subList.length; j++) list[list.length] = subList[j];
            }

        } else {
            // if we're not excluding leaves, add the leaf to the list
            
            if (displayNodeType != isc.Tree.FOLDERS_ONLY) {
                list[list.length] = child;
                if (this.isMultiLinkTree()) {
                    partialRowNumIndex[partialRowNumIndex.length] = childNodeLocator;
                }
            }
        }
    }

	// finally, return the entire list
	return list;
},
// _getOpenListAsync() is an asynchronous method equivalent to getOpenList().
_getOpenListAsync : function (node, displayNodeType, normalizer, sortDirection, criteria, context, getAll,
            thisArg, timerEventProp, batchSize, callback, state, partialRowNumIndex) 
    {

    var nodeLocator;
    if (this.isANodeLocator(node)) {
        nodeLocator = node;
        node = node.node;
    }

    

    var node0 = node,
        done = false,
        list,
        indexStack, childrenStack,
        i, children;
    if (state == null) {
        // default to the tree root
        if (! node) node0 = node = this.root;

        // default the normalizer to this._openNormalizer and sortDirection to this.sortDirection
        if (normalizer == null)         normalizer = this._openNormalizer;
        if (sortDirection == null)        sortDirection = this.sortDirection;
        if (context == null) context = this._sortContext;

        // create an array to hold the descendants
        list = [];

        // if the node is a leaf, return the empty list since it's not going to have any children
        if (this.isLeaf(node)) {
            // prevents mysterious crash if an isFolder() override claims root is a leaf
            var ret = (node == this.root ? [] : null);
            callback.call(thisArg, ret);
            return;
        }

        indexStack = [];
        childrenStack = [];
        state = {
            list: list,
            node: node,
            nodeLocator: nodeLocator,
            indexStack: indexStack,
            childrenStack: childrenStack
        };
    } else {
        list = state.list;
        node = state.node;
        indexStack = state.indexStack;
        childrenStack = state.childrenStack;
        i = indexStack.last();
        children = childrenStack.last();
        nodeLocator = state.nodeLocator;
    }

    for (var count = 0; !done && count < batchSize; ++count) {
        if (node != null) {
            // if the node is a leaf, return the empty list since it's not going to have any children
            if (this.isLeaf(node)) {
                node = null;
                continue;
            }

            // add the node if we're not skipping folders (except if the node is the root and showRoot is false)
            if (displayNodeType != isc.Tree.LEAVES_ONLY && (node != this.root || this.showRoot)) {
                list[list.length] = node;
                if (this.isMultiLinkTree()) {
                    partialRowNumIndex[partialRowNumIndex.length] = nodeLocator;
                }
            }

            // if this node is closed, return the list
            if (!getAll && !this.isOpen(nodeLocator || node)) {
                node = null;
                continue;
            }

            // iterate through all the children of the node
            i = 0;
            children = this.getChildren(node, displayNodeType, normalizer, sortDirection,
                                        criteria, context);
            indexStack.push(i);
            childrenStack.push(children);
        }

        // Set the node to null to skip the above checks in the next few iterations of the outer,
        // loop.  All that remains is to check this node's children (who have been pushed onto
        // childrenStack).
        node = null;

        // for each child
        var escapeToOuterLoop = false,
            length = (isc.isA.ResultSet(children) ?
                children._getCachedLength() : children.getLength());
        for (; !escapeToOuterLoop && i < length && count < batchSize; ++i) {
            // get a pointer to the child
            var child = children.getCachedRow(i);
            if (child == null) {
                
                continue;
            }

            // if the child is a folder, recurse, but check that it actually has children -
            // otherwise we eat a function call, array alloc, empty concat, and a bunch of other
            // checks (top of this function) all for nothing.  This is a typical case for loading a
            // large set of folders from the server in loadOnDemand mode
            //
            var grandChildren = child[this.childrenProperty];
            if (grandChildren && !grandChildren.isEmpty()) {
                // now concatenate the list with the descendants of the child
                escapeToOuterLoop = true;
                state.parent = node;
                state.position = i;
                node = state.node = child;
                continue;
            } else {
                // if we're not excluding leaves, add the leaf to the list
                
                if (displayNodeType != isc.Tree.FOLDERS_ONLY) {
                    list[list.length] = child;
                    // Pretty sure this logic will never run for a multi-link tree...
                    if (this.isMultiLinkTree()) {
                        var childNodeLocator = this.createNodeLocator(
                            child, 
                            node[this.idField],
                            i,
                            nodeLocator.path ? this._constructChildPath(nodeLocator.path, child) : null
                        );
                        partialRowNumIndex[partialRowNumIndex.length] = childNodeLocator;
                    }
                }
                ++count;
            }
        }

        // `i` is supposed to be an alias variable for the last index in the indexStack.
        indexStack[indexStack.length - 1] = i;
        if (!escapeToOuterLoop && i >= length) {
            if (indexStack.length > 1) {
                indexStack.pop();
                childrenStack.pop();
                i = indexStack.last();
                children = childrenStack.last();
            } else {
                done = true;
            }
        }
    }

    if (done) {
        // finally, return the entire list
        callback.call(thisArg, list);
    } else {
        state.node = node;
        thisArg[timerEventProp] = this.delayCall(
            "_getOpenListAsync",
            [node0, displayNodeType, normalizer, sortDirection, criteria, context, getAll,
             thisArg, timerEventProp, batchSize, callback, state, partialRowNumIndex], 0);
    }
},

//>	@method	tree._getOpenList()	(A)
// Internal routine to set the open list if it needs to be set	
//		@group	openList			
//<
_getOpenList : function () {
	// if the _openListCache hasn't been calculated,
	//		or we're not supposed to cache the openList
	if (!this._openListCache || !this.cacheOpenList) {
		// recalculate the open list
        var index = this.recordNumberToNodeLocatorIndex = [];
		this._openListCache = this.getOpenList(this.root, this.openDisplayNodeType,
                                               this._openNormalizer, this.sortDirection,
                                               this.openListCriteria, null, null, null, index);

        if (this.isMultiLinkTree()) {
            this._updateOpenListIndexInNodeLocators(0);
        }                            
	}
	return this._openListCache;
},

//> @method tree.getNodeList()
// Return a flattened list of all nodes in the tree.
//<
getNodeList : function (onlyOpen, dontSort) {
    // Call _getOpenList() if:
    // - we only need opened nodes
    // - either dontSort is not true or we have a (sorted) cache anyway, so the hint
    //   not to use the normalizer is unnecessary information.
    // If we don't have an _openListCache and dontSort is true, then we will want to
    // respect the request to not apply the normalizer, as this is probably faster that recalculating
    // the _openListCache, which will apply the normalizer.
    if (onlyOpen && (dontSort != true || (this._openListCache && this.cacheOpenList))) {
        return this._getOpenList();

    } else if (dontSort) {
        return this.getOpenList(this.root, this.openDisplayNodeType,
                                null, null, this.openListCriteria, null, (onlyOpen != true),
                                dontSort);

    // if the _allListCache hasn't been calculated,
    // or we're not supposed to cache the openList
    } else if (!this._allListCache || !this.cacheAllList) {
        // recalculate the node list
        this._allListCache = this.getAllNodes(this.root);
    }
    return this._allListCache;
},
// _getNodeListAsync() is an asynchronous method equivalent to getNodeList().
_getNodeListAsync : function (thisArg, timerEventProp, batchSize, callback) {
    // if the _allListCache hasn't been calculated,
    // or we're not supposed to cache the openList
    if (! this._allListCache || !this.cacheAllList) {
        // recalculate the node list
        var me = this;
        this._getAllNodesAsync(this.root, thisArg, timerEventProp, batchSize, function (nodes) {
            me._allListCache = nodes;
            callback.call(thisArg, nodes);
        });
    } else {
        return this._allListCache;
    }
},

//> @method tree.getAllNodes()
// Get all the nodes that exist in the tree under a particular node, as a flat list, in
// depth-first traversal order.
//
// @param [node] (TreeNode) optional node to start from.  Default is root.
// @return (Array of TreeNode) all the nodes that exist in the tree
// @visibility external
//<
getAllNodes : function (node) {
    return this.getOpenList(node, null, null, null, null, null, true);
},
// _getAllNodesAsync() is an asynchronous method equivalent to getAllNodes().
_getAllNodesAsync : function (node, thisArg, timerEventProp, batchSize, callback) {
    this._getOpenListAsync(node, null, null, null, null, null, true, thisArg, timerEventProp,
                           batchSize, callback);
},

// List API
// --------------------------------------------------------------------------------------------

//>	@method	tree.getLength()
//
// Returns the number of items in the current open list.
//
// @return		(number)	number of items in open list
//
// @see method:Tree.getOpenList
// @visibility external
//<
getLength : function () {
    
    var length = (this._getCachedNodeLength(this.root) - (
        !this.showRoot && this.openDisplayNodeType != isc.Tree.LEAVES_ONLY ? 1 : 0));
    
    // assert (length == this._getOpenList().length);

   return length;
},

// _getLengthAsync() is an asynchronous version of getLength().
_getLengthAsync : function (thisArg, timerEventProp, batchSize, callback) {
    callback.call(thisArg, this.getLength());
},

//> @method tree.get()
// Get the item in the openList at a particular position.
// @param pos (Number) position of the node to get
// @return (TreeNode) node at that position
// @group openList, Items
//<
get : function (pos) {
    return this._getOpenList()[pos];
},

// see ResultSet.getCachedRow()
getCachedRow : function (rowNum) { 
    return this.get(rowNum); 
},

//>	@method	tree.getRange()
//			Get a range of items from the open list
//		@group	openList, Items			
//
//      @param  start (number) start position
//      @param  end   (number) end position (NOT inclusive)
//      @return       (Array of TreeNode) list of nodes in the open list
//<
getRange : function (start, end) {
    if (!(0 <= start && start < end)) return [];
    return this._getOpenList().slice(start, end);
},

//>	@method	tree.indexOf()
// @include list.indexOf
//<
indexOf : function (node, pos, endPos) {
    var nodeLocator;
    if (this.isANodeLocator(node)) {
        nodeLocator = node;
        node = node.node;
    }
    if (this.isMultiLinkTree() && nodeLocator) {
        return this._getOpenListIndexFromIndex(nodeLocator);
    }
    var list = this._getOpenList(),
        // use fastIndexOf to make this more efficient for critical path code.
        index = list.fastIndexOf(node,pos);
    if (endPos != null && index > endPos) index = -1;

    return index;
},

//>	@method	tree.lastIndexOf()
// @include list.lastIndexOf
//<
lastIndexOf : function (node, pos, endPos) {
	return this._getOpenList().lastIndexOf(node, pos, endPos);
},

//>	@method	tree.getAllItems()
//			Get the entire list (needed by Selection)
//		@group	openList, Items			
//
//		@return		(TreeNode)	all nodes in the open list
//<
getAllItems : function () {
	return this._getOpenList();
},



//>	@method	tree.sortByProperty()
// Handle a 'sortByProperty' call to change the default sort order of the tree
//		@group	sorting			
//
//		@param	[property]	(String)	name of the property to sort by
//		@param	[direction]		(boolean)	true == sort ascending
//		@param	[normalizer](Function)	sort normalizer (will be derived if not specified)
//<
sortByProperty : function (property, direction, normalizer, context) {
    if (!property && this.separateFolders == false) {
        // if we were called without a sort-property and this.sortProp is set, use it...
        if (this.sortProp) property = this.sortProp;
        else property = this.titleProperty;
    }
    if (!direction) direction = this.sortDirection;
    this.setSort([{
        property: property,
        direction: (isc.isA.String(direction) ? direction : 
            (direction == true) ? "ascending" : "descending"),
        normalizer: normalizer,
        context: context
    }]);
},

getSort : function () {
    return this._sortSpecifiers;
},

// helper APIs to track whether setSort() should be called on a subset (Array, ResultSet, etc.)
isSubsetSortDirty : function (subset) {
    return this._sortSpecifierCounter != subset._sortSpecifierCounter;
},
markSubsetSortDirty : function (subset) {
    delete subset._sortSpecifierCounter;
},
markSubsetAsSorted : function (subset) {
    subset._sortSpecifierCounter = this._sortSpecifierCounter;
},

_sortSpecifierCounter: 1,
setSort : function (sortSpecifiers) {
    // bump a counter each time setSort() is called
    this._sortSpecifierCounter++;

    if (!sortSpecifiers || !sortSpecifiers.length) {
        if (this.sortProp) {
            var direction = this.sortDirection;
            sortSpecifiers = [
                { 
                    property: this.sortProp,
                    direction: (isc.isA.String(direction) ? direction : 
                        (direction == true) ? "ascending" : "descending")
                }
            ];
        }
    } else {
        // duplicate the sortSpecifiers. We manipulate them directly
        // (adding sort-normalizer, for example) and we don't want upstream code
        // to be affected
        
        var dup = [];
        var ds = this.dataSource ? isc.DS.getDataSource(this.dataSource) : null;
        for (var i = 0; i < sortSpecifiers.length; i++) {
            var item = sortSpecifiers[i];
            if (item) {
                if (item.context  && !isc.isA.String(item.context)) {
                    var undef,
                        dsField = ds ? ds.getField(item.property) : null,
                        field = item.context.getField(item.property) || dsField;
                    
                    var displayField = field && field.displayField;
                    if (displayField === undef) displayField = dsField && dsField.displayField;
                    var sortByDisplayField = field && field.sortByDisplayField;
                    if (sortByDisplayField === undef) sortByDisplayField = dsField && dsField.sortByDisplayField;
                    
                    if (displayField && (sortByDisplayField != false)) {
                        var opDs = (field && field.optionDataSource) ||
                                    (dsField && dsField.optionDataSource);
                        if (opDs) {
                            opDs = isc.DataSource.getDataSource(field.optionDataSource);
                        }

                        if (!opDs || opDs == isc.DataSource.getDataSource(this.dataSource)) {
                        //if (!field.optionDataSource || opDs == isc.DataSource.getDataSource(this.dataSource)) {
                            this.logInfo("Field:" + field.name + " has displayField:" + displayField +
                                " (with optionDataSource:" + opDs + "). " +
                                "Sorting by displayField. Set field.sortByDisplayField to false to disable this.",
                                "sorting");
                            // store the original fieldName as the owningProperty - used when editing
                            // this sortSpecifier later, in a MultiSort[Panel/Dialog]
                            item.owningField = item.property;
                            if (!item.sortByField) {
                                item.property = field.displayField;
                            } else {
                                item.sortByProperty = field.displayField;
                            }
                        }
                    }
                }
                dup.add(isc.addProperties({}, item));
            }
        }
        sortSpecifiers = dup;
    }

    this._sortSpecifiers = sortSpecifiers;

    // mark as dirty so any list who points to us will be redrawn
    this._clearNodeCache(true);

    this._makeOpenNormalizer();

    // always hang onto the context
    this._sortContext = sortSpecifiers && sortSpecifiers.length > 0 ? sortSpecifiers[0].context : null;

    // call the dataChanged method to notify anyone who's observing it
    this.dataChanged();
},

//>	@method	tree._makeOpenNormalizer()	(A)
// Create a normalizer function according to the sortProp and sortDirection variables
//		@group	sorting			
//<
_makeOpenNormalizer : function () {
    var tree = this,
        separateFolders = this.separateFolders != false,
        sortProps = this._sortSpecifiers,
        titleProperty = this.titleProperty;

    var folderPrefix,
        leafPrefix;
    if (this.sortFoldersBeforeLeaves) {
        folderPrefix = "0:";
        leafPrefix = "1:";
    } else {
        folderPrefix = "1:";
        leafPrefix = "0:";
    }

    sortProps.removeEmpty();
    if (sortProps.isEmpty()) {
        this._openNormalizer = isc.Class.NO_OP;
        return;
    }

    var propNames = sortProps.getProperty("property");

    
    if ((!separateFolders || propNames.length > 1 || !!propNames[0]) &&
        !propNames.contains(titleProperty))
    {
        propNames.add(titleProperty);
    }

    this._openNormalizer = function (obj, property, context) {
        if (tree == null || tree.destroyed) {
            tree = null;
            return;
        }

        var value = "";

        if (separateFolders) {
            value += (tree.isFolder(obj) ? folderPrefix : leafPrefix);
        }

        for (var i = 0; i < propNames.length; ++i) {
            var innerProp = propNames[i];
            if (!innerProp) continue;

            var isTitle = innerProp == titleProperty;

            var prop = isTitle ? tree.getTitle(obj) : obj[innerProp];
            // We are trying to sort by a property that is not actually in the record passed to
            // use, that could be because we are trying to sort the children of a node in a 
            // multilink tree by default sequence field, which is a property of the link record,
            // not the data record.  If this is the case, the call into sort logic will have 
            // set up a _currentParentForSort property on the context TreeGrid
            if (prop == null && context && context._currentParentForSort) {
                var parent = context._currentParentForSort;
                if (tree.isANodeLocator(parent)) parent = parent.node;
                // NOTE: this cannot work for trees with allowDuplicateChildren set.  Because
                // the node's position within its parent is the only thing that allows 
                // SmartClient to disambiguate between two occurences of the same node within a
                // single parent, sorting them into a different order inherently breaks the 
                // tree.  If you sort an allowDuplicateChildren tree by anything other than the
                // linkPositionField, the only way of regaining the tree's integrity is to 
                // clear the sort state and then clear and reload the nodes
                var linkRecord = tree.getLinkRecord(parent[tree.idField], obj[tree.idField]);
                if (linkRecord) {
                    prop = linkRecord[innerProp];
                }
            }
            if (prop == null) continue;

            
            if (isc.isA.Number(prop)) {
                if (prop > 0) {
                    prop = "1" + prop.stringify(12, true);
                } else {
                    prop = 999999999999 + prop;
                    prop = "0" + prop.stringify(12, true);
                }
            } else if (isc.isA.Date(prop)) {
                prop = prop.getTime();
            }

            if (isTitle) {
                value += String(prop).toLowerCase() + ":";
            } else {
                value += prop + ":";
            }
        }

        return value;
    };

    
    if (isc.Browser.isFirefox) {
        this._openAscendingComparator = function (first, second) {
            if (first == null || second == null) {
                return Array.compareAscending(first, second);
            }
            var m = first.length,
                n = second.length;
            if (m == 0 || n == 0) {
                return Array.compareAscending(first, second);
            }

            var i = 0,
                j = first.indexOf(":", i),
                k = 0,
                l = second.indexOf(":", k);
            if (j == -1) j = m;
            if (l == -1) l = n;

            for (;;) {
                var cmp = Array.compareAscending(
                    first.substring(i, j), second.substring(k, l));
                if (cmp != 0) {
                    return cmp;
                } else {
                    i = j + 1;
                    k = l + 1;
                    if (i >= m) {
                        if (k >= n) {
                            return 0;
                        } else {
                            return -1;
                        }
                    } else if (k >= n) {
                        return 1;
                    } else {
                        j = first.indexOf(":", i);
                        l = second.indexOf(":", k);
                        if (j == -1) j = m;
                        if (l == -1) l = n;
                    }
                }
            }
        };

        // Same as above, except with `compareDescending` instead of `compareAscending`,
        // `return 1` instead of `return -1`, and `return -1` instead of `return 1`.
        this._openDescendingComparator = function (first, second) {
            if (first == null || second == null) {
                return Array.compareDescending(first, second);
            }
            var m = first.length,
                n = second.length;
            if (m == 0 || n == 0) {
                return Array.compareDescending(first, second);
            }

            var i = 0,
                j = first.indexOf(":", i),
                k = 0,
                l = second.indexOf(":", k);
            if (j == -1) j = m;
            if (l == -1) l = n;

            for (;;) {
                var cmp = Array.compareDescending(
                    first.substring(i, j), second.substring(k, l));
                if (cmp != 0) {
                    return cmp;
                } else {
                    i = j + 1;
                    k = l + 1;
                    if (i >= m) {
                        if (k >= n) {
                            return 0;
                        } else {
                            return 1;
                        }
                    } else if (k >= n) {
                        return -1;
                    } else {
                        j = first.indexOf(":", i);
                        l = second.indexOf(":", k);
                        if (j == -1) j = m;
                        if (l == -1) l = n;
                    }
                }
            }
        };
    }
    return;
},

// Loading batches of children: breadth-first loading up to a maximum
// ---------------------------------------------------------------------------------------

loadBatchSize:50,
loadSubtree : function (node, max, initTime) {
    if (!node) node = this.getRoot();
    if (max == null) max = this.loadBatchSize;

    //this.logWarn("loading subtree of node: " + this.echoLeaf(node) +
    //             "up to max: " + max);

    this._loadingBatch = initTime ? 2 : 1;

    var count = 0,
        stopDepth = 1;
    // load at increasing depth until we hit max or run out of children
    while (count < max) {
        var numLoaded = this._loadToDepth(max, node, count, stopDepth++);
        if (numLoaded == 0) break; // nothing left to load
        count += numLoaded;
    }

    this._loadingBatch = null;

    if (count > 0) this._clearNodeCache(true);
}, 

// allows loadChildren() to detect we're loading a batch of children and defer loading a folder
// that doesn't have interesting children
loadingBatch : function (initOnly) { 
    if (initOnly) return this._loadingBatch == 2;
    else return this._loadingBatch;
},

_loadToDepth : function (max, node, count, stopDepth) {

    var numLoaded = 0;
    if (!this.isOpen(node)) {
        if (!this.isLoaded(node)) this.loadChildren(node);

        // NOTE: we assume that during batch loading, folders can decline to actually load or
        // open, and these should remain closed
        if (this.isLoaded(node)) {
            if (this.openFolder(node) === false) return numLoaded;
        }

        var nodeChildren = node[this.childrenProperty];
        if (nodeChildren) {
            var nodeChildrenLength = (isc.isA.ResultSet(nodeChildren) ?
                    nodeChildren._getCachedLength() : nodeChildren.getLength());
            numLoaded += nodeChildrenLength;
            count += nodeChildrenLength;
        }
    }

    var childNodes = node[this.childrenProperty];

    if (count >= max || stopDepth == 0 || childNodes == null) return numLoaded;

    var length = (isc.isA.ResultSet(childNodes) ?
            childNodes._getCachedLength() : childNodes.getLength());
    for (var i = 0; i < length; ++i) {
        var child = childNodes.getCachedRow(i);
        if (child != null) {
            var loaded = this._loadToDepth(max, child, count, stopDepth - 1);

            numLoaded += loaded;
            count += loaded;

            //this.logWarn("recursed into: " + this.getTitle(child) +
            //             " and loaded: " + loaded +
            //             ", total count: " + count);

            if (count >= max) return numLoaded;
        }
    }
    return numLoaded;
},

// Tree Filtering
// ---------------------------------------------------------------------------------------

//> @attr tree.dataSource (DataSource | ID : null : IR)
// Specifies what +link{DataSource} this tree is associated with.
// <P>
// A +link{dataSource} is required when filtering a tree, even if it isn't a +link{ResultTree},
// though it may be passed to +link{getFilteredTree()} rather than set on the tree itself.  If
// a +link{dataSource} is specified it will also affect sorting, where relevant, such as if the
// tree is set as +link{treeGrid.data}.
//
// @see dataBoundComponent.dataSource
// @group treeFilter
// @visibility external
//<

//> @method tree.getFilteredTree() 
// Filters this tree by the provided criteria, returning a new Tree containing just the nodes
// that match the criteria.
// <P>
// If <code>filterMode</code> is "keepParents", parents are retained if
// any of their children match the criteria even if those parents do not match the criteria.
// <P>
// Note that the +link{dataSource} argument is <b>required</b> if one is not
// +link{dataSource,already specified} on the tree.
// <P>
// If you want a +link{TreeGrid} with local tree data that supports filtering, please consider
// using a +link{TreeGrid} bound to a +link{dataSource.clientOnly,client-only DataSource}
// rather than writing your own code to filter the tree's data with this method.
// 
// @param criteria (Criteria | AdvancedCriteria) criteria to filter by
// @param [filterMode] (TreeFilterMode) mode to use for filtering, defaults to "strict"
// @param [dataSource] (DataSource) dataSource to use for filtering, if this Tree does not
//                                  already have one
// @param [requestProperties] (DSRequest) Request properties block. This allows developers to
//     specify properties that would impact the filter such as +link{DSRequest.textMatchStyle}
// @return (Tree) filtered tree
//
// @see TreeGrid.setCriteria()
// @see TreeGrid.filterData()
// @see ResultTree
// @group treeFilter
// @visibility external
//<
getFilteredTree : function (criteria, filterMode, dataSource, context) {
    filterMode = filterMode || isc.Tree.STRICT;

    var dataSource = this.dataSource || dataSource;
    if (!dataSource) {
        isc.logWarn("Cannot apply filter to Tree without dataSource");
        return null;
    }

    // Filter the tree in-place to avoid moving nodes around as we add
    // missing parent nodes back in place. We also retain loadState.
    var tree = this.duplicate(true, true);
    if (isc.ResultTree && isc.isA.ResultTree(tree) && tree.isPaged()) {
        tree.setCriteria(isc.DataSource.combineCriteria(criteria, tree.criteria));
    }
    var nodeLocator;
    if (tree.isMultiLinkTree()) {
        nodeLocator = tree.createNodeLocator(tree.getRoot(), null, null, this.pathDelim);
    }
    tree._filterChildren(criteria, filterMode, dataSource, nodeLocator || tree.getRoot(), context);
    return tree;
},

// Returns true if any children match criteria
_filterChildren : function (criteria, filterMode, dataSource, parent, context) {
    
    var strict = (filterMode == isc.Tree.STRICT),
        keepParents = !strict;

    var parentNodeLocator;
    if (this.isANodeLocator(parent)) {
        parentNodeLocator = parent;
        parent = parent.node;
    }

    var children = parent[this.childrenProperty];
    if (children == null || children.isEmpty()) return false;

    var haveMatchingNodes = false;

    if (isc.isA.String(dataSource)) dataSource = isc.DS.get(dataSource);

    
    var isResultSet = isc.isA.ResultSet(children);
    strict = strict || isResultSet;

    var i = (isResultSet ? children._getCachedLength() : children.getLength());
    while (i--) {
        var node = children.getCachedRow(i);
        if (node != null) {
            var hasImmediateMatches = false,
                nodeChildren = node[this.childrenProperty],
                childNodeLocator;
            if (this.isMultiLinkTree() && parentNodeLocator) {
                var childPath = this._constructChildPath(parentNodeLocator.path, node, 
                                    this.allowDuplicateChildren ? i : null);
                childNodeLocator = this.createNodeLocator(node, parent, 
                            this.allowDuplicateChildren ? i : null, childPath);
            }
            if (keepParents) {
                if (nodeChildren != null && !nodeChildren.isEmpty()) {
                    hasImmediateMatches = this._filterChildren(criteria, filterMode, dataSource, 
                                            childNodeLocator || node, context);
                }
                haveMatchingNodes = haveMatchingNodes || hasImmediateMatches;
            }

            // Don't have to filter parent node (this child) if keeping parent nodes
            // and there are matching children.
            if (!hasImmediateMatches || strict) {

                
                var compareNode = node;
                if (this.isMultiLinkTree() && this.allowFilterOnLinkFields) {
                    var linkRecord = this.getLinkRecord(parent[this.idField], node[this.idField], i);
                    compareNode = isc.addProperties({}, linkRecord, node);
                    context.allowFilterOnLinkFields = true;
                    context.linkDataSource = this.linkDataSource;
                }

                var matches = dataSource.applyFilter([compareNode], criteria, context);

                if (matches != null && matches.length > 0) {
                    haveMatchingNodes = true;

                    if (strict && nodeChildren != null && !nodeChildren.isEmpty()) {
                        this._filterChildren(criteria, filterMode, dataSource, 
                                    childNodeLocator || node, context);
                    }
                } else {
                    
                    this._remove(childNodeLocator || node, false, parent);
                }
            }
        }
    }
    return haveMatchingNodes;
},


_includeNodeLengthInParent : function (node, parent, parentPath) {
    var parentNodeLocator;
    if (this.isANodeLocator(parent)) {
        parentNodeLocator = parent;
        parent = parent.node;
    }
    
    // The parent must be open.
    return this.isOpen(parentNodeLocator || parent, parentPath);
},


_isNodeVisibleToParent : function (node, parent) {
    var parentNodeLocator;
    if (this.isANodeLocator(parent)) {
        parentNodeLocator = parent;
        parent = parent.node;
    }
    if (!this._includeNodeLengthInParent(node, parentNodeLocator || parent)) {
        return false;
    } else {
        // Even if the node is technically a folder, if it has no children then, at this point,
        // it is treated as a leaf.
        var grandChildren = node[this.childrenProperty],
            isFolder = this.isFolder(node) && (grandChildren && grandChildren.length);
        return (this.openDisplayNodeType != (isFolder ? isc.Tree.LEAVES_ONLY : isc.Tree.FOLDERS_ONLY));
    }
},


_getNodeLengthToParent : function (node, parent, path, parentPath) {
    var parentNodeLocator;
    if (this.isANodeLocator(parent)) {
        parentNodeLocator = parent;
        parent = parent.node;
    }
    

    if (this._includeNodeLengthInParent(node, parentNodeLocator || parent, parentPath)) {
        
        var length = this._getCachedNodeLength(node, path),
            grandChildren = node[this.childrenProperty],
            isFolder = this.isFolder(node),
            treatAsFolder = (grandChildren && grandChildren.length > 0);

        // Even if the node is technically a folder, if it has no children then, at this point,
        // it is treated as a leaf.  This can result in a difference of +/-1 in the length of
        // the node according to the parent.
        if (isFolder != treatAsFolder) {
            length += (
                -(this.openDisplayNodeType != (isFolder ? isc.Tree.LEAVES_ONLY : isc.Tree.FOLDERS_ONLY) ? 1 : 0) +
                (this.openDisplayNodeType != (treatAsFolder ? isc.Tree.LEAVES_ONLY : isc.Tree.FOLDERS_ONLY) ? 1 : 0));
        }
        
        return length;
    } else {
        return 0;
    }
},

_getNodeLength : function (node, path) {
    var isFolder = this.isFolder(node),
        isOpen = isFolder && this.isOpen(node),
        length = (this.openDisplayNodeType != (isFolder ? isc.Tree.LEAVES_ONLY : 
                                                          isc.Tree.FOLDERS_ONLY) ? 1 : 0);
    if (isOpen) {
        var childrenInOpenList = this.getChildren(node, this.openDisplayNodeType, null,
                this.sortDirection, this.openListCriteria, this._sortContext, null, null, true),
            loadingMarker = (
                isc.ResultSet != null ? isc.ResultSet.getLoadingMarker() : null),
            i = (isc.ResultSet != null && isc.isA.ResultSet(childrenInOpenList) ?
                childrenInOpenList._getCachedLength() : childrenInOpenList.getLength());

        
        var pagedResultTree = (
                isc.ResultTree != null && isc.isA.ResultTree(this) && this.isPaged()),
            knownLengthNulls = pagedResultTree;
        if (pagedResultTree) {
            var openSubfoldersAllowed = (
                    node[this.canReturnOpenSubfoldersProperty] != null ?
                    node[this.canReturnOpenSubfoldersProperty] : this.canReturnOpenFolders),
                defaultChildLength = (
                    this.openDisplayNodeType == isc.Tree.FOLDERS_AND_LEAVES ? 1 : 0);

            knownLengthNulls = !(openSubfoldersAllowed || defaultChildLength == 0);
        }

        var indexByChild = {};
        while (i--) {
            var child = childrenInOpenList.getCachedRow(i);
            if (child != null && child != loadingMarker) {
                var childId = child[this.idField];
                var childPath;
                if (this.isMultiLinkTree()) {
                    indexByChild[childId] = indexByChild[childId] == null ? 0 : indexByChild[childId] + 1;
                    var childLocator = this.createNodeLocatorWithRelativePosition(
                        child, 
                        node[this.idField],
                        indexByChild[childId]
                    );
                    childPath = this._constructChildPath(path, child, childLocator.position);
                }
                length += this._getNodeLengthToParent(child, node, childPath, path);
            } else if (knownLengthNulls) {
                ++length;
            }
        }
    }
    
    return length;
},

_getCachedNodeLength : function(node, path) {
    if (!this.isMultiLinkTree()) {
        return node[this._cachedLengthProperty];
    }
    var nodeLocator;
    if (this.isANodeLocator(node)) {
        nodeLocator = node;
        node = node.node;
        if (!path) path = nodeLocator.path;
    }
    if (!path) {
        if (node == this.root) {
            path = this.pathDelim;
        } else {
            this.logWarn("_getCachedNodeLength() on a multi-link tree called without supplying a path");
            return 0;
        }
    }
    return this._getCachedNodeLengthFromIndex(node, path);
},

_setCachedNodeLength : function(node, length, path) {
    if (!this.isMultiLinkTree()) {
        node[this._cachedLengthProperty] = length;
    } else {
        var nodeLocator;
        if (this.isANodeLocator(node)) {
            nodeLocator = node;
            node = node.node;
            if (!path) path = nodeLocator.path;
        }
        if (!path) {
            if (node == this.root) {
                path = this.pathDelim;
            } else {
                this.logWarn("_setCachedNodeLength() on a multi-link tree called without supplying a path");
                return;
            }
        }
        this._setCachedNodeLengthInIndex(node, path, length);
    }
},

_getRecursionCount : function(node, path) {
    if (!this.isMultiLinkTree()) {
        return node[this._recursionCountProperty] || 0;
    } else {
        var nodeLocator;
        if (this.isANodeLocator(node)) {
            nodeLocator = node;
            node = node.node;
            if (!path) path = nodeLocator.path;
        }
        if (!path) {
            this._assert(node == this.root);
            path = this.pathDelim;
        }
        return this._getRecursionCountFromIndex(node, path);
    }
},

_incrementRecursionCount : function(node, path) {
    this._adjustRecursionCount(node, path, 1);
},
_decrementRecursionCount : function(node, path) {
    this._adjustRecursionCount(node, path, -1);
},
_adjustRecursionCount : function(node, path, delta) {
    if (!this.isMultiLinkTree()) {
        var prop = this._recursionCountProperty;
        node[prop] = (node[prop] || 0) + delta;
        if (node[prop] == 0) {
            delete node[prop];
        }
    } else {
        var nodeLocator;
        if (this.isANodeLocator(node)) {
            nodeLocator = node;
            node = node.node;
            // If a path is provided, use it - if we are in the "add" part of a "move" flow, 
            // the path on the nodeLocator will be where the node used to be
            if (!path) path = nodeLocator.path;
        }
        if (!path) {
            this._assert(node == this.root);
            path = this.pathDelim;
        }
        this._adjustRecursionCountInIndex(node, path, delta);
    }
},


_getDeltaLength : function (node, wasFolder, isFolder) {
    if (wasFolder != isFolder) {
        var wasLeaf = !wasFolder,
            isLeaf = !isFolder,
            deltaLength = (
                // The node was a folder (leaf) and now is no longer a folder (leaf)
                // so subtract 1 from the length if the node was displayed in the
                // open list.
                -((wasLeaf && this.openDisplayNodeType != isc.Tree.FOLDERS_ONLY) ||
                (wasFolder && this.openDisplayNodeType != isc.Tree.LEAVES_ONLY) ? 1 : 0) +

                // The node is a new folder (leaf) so add 1 if it is now going to be
                // displayed in the open list.
                ((isLeaf && this.openDisplayNodeType != isc.Tree.FOLDERS_ONLY) ||
                (isFolder && this.openDisplayNodeType != isc.Tree.LEAVES_ONLY) ? 1 : 0));

        
        return deltaLength;
    } else {
        return 0;
    }
},


_updateParentLengths : function (parent, deltaLength, parentPath) {
    
    this.logDebug("Ready to adjust cached length on ancestor hierarchy beginning with " +
                    isc.echoLeaf(parent) + ".  Current cached length is " + 
                    this._getCachedNodeLength(parent, parentPath) +
                    ", deltaLength is " + deltaLength);
    if (deltaLength != 0) {
        for (;;) {
            var cachedLength = this._getCachedNodeLength(parent, parentPath)
            
            this._setCachedNodeLength(parent, cachedLength + deltaLength, parentPath);
            var recursionFlag = (this._getRecursionCount(parent, parentPath) > 0);
            if (!(parent == this.root || recursionFlag)) {
                var parentNodeLocator;
                if (this.isMultiLinkTree()) {
                    parentNodeLocator = this.createNodeLocator(parent, null, null, parentPath);
                }
                var grandParent = this.getParent(parentNodeLocator || parent);
                var grandParentPath = this._deriveParentPath(parentPath);
                if (this._includeNodeLengthInParent(parent, grandParent, grandParentPath)) {
                    parent = grandParent;
                    parentPath = grandParentPath;
                    continue;
                }
            }
            break;
        }
    }
},

getNewSelection : function (initParams) {
    if (!this.isMultiLinkTree()) {
        return null;  // Fall back to default selectionManager creation
    }
    return isc.MultiLinkSelection.create(initParams);
}

});	// END isc.Tree.addMethods()

isc.Tree.addClassMethods({
//> @classMethod tree.findChildrenProperty()
// heuristically find a property that appears to contain child objects.
// Searches through a node and find a property that is either Array or Object valued.
//
// @param node (TreeNode) the node to check
// @param mode (ChildrenPropertyMode) determines how to chose the property that appears to contain child objects
// @return (String) the name of the property that holds the children 
//
// @visibility external
//<
    // Tree Discovery
    // ---------------------------------------------------------------------------------------
    // utilities for discovering the tree structure of a block of data heuristically

    // heuristically find a property that appears to contain child objects.
    // Searches through an object and find a property that is either Array or Object valued.
    // Returns the property name they were found under.
    // mode:
    // "any" assume the first object or array value we find is the children property
    // "array" assume the first array we find is the children property, no matter the contents
    // "object" assume the first object or array of objects we find is the children property
    //          (don't allow arrays that don't have objects)
    // "objectArray" accept only an array of objects as the children property
    findChildrenProperty : function (node, mode) {
        if (!isc.isAn.Object(node)) return;

        if (!mode) mode = "any"; 

        var any = (mode == "any"),
            requireObject = (mode == "object"),
            requireArray = (mode == "array"),
            requireObjectArray = (mode == "objectArray");

        for (var propName in node) {
            var propValue = node[propName];
            // note: isAn.Object() matches both Array and Object
            if (isc.isAn.Object(propValue)) {
                if (any) return propName;
                if (isc.isAn.Array(propValue)) {
                    // array of objects always works
                    if (isc.isAn.Object(propValue[0])) return propName;
                    // simple array satisfies all but "object" and "objectArray"
                    if (!requireObject && !requireObjectArray) return propName;
                } else {
                    // object works only for "object" and "any" ("any" covered above)
                    if (requireObject) return propName;
                }
            }
        }
    },

//> @classMethod tree.discoverTree()
// given a hierarchy of objects with children under mixed names, heuristically discover the
// property that holds children and copy it to a single, uniform childrenProperty.  Label each
// discovered child with a configurable "typeProperty" set to the value of the property
// that held the children.
//
// @param nodes (Array of TreeNode) list of nodes to link into the tree.
// @param settings (DiscoverTreeSettings) configures how the tree will be explored
// @param parentChildrenField (String)
//
// @visibility external
//<
    discoverTree : function (nodes, settings, parentChildrenField) {
        if (!settings) settings = {}; // less null checks

        var childrenMode = settings.childrenMode || "any";
    
        // scanMode: how to scan for the childrenProperty
        // "node": take each node individually
        // "branch": scan direct siblings as a group, looking for best fit
        // "level": scan entire tree levels as a group, looking for best fit
        var scanMode = settings.scanMode || "branch";

        // tieMode: what to do if there is more than one possible childrenProperty when using
        // scanMode "branch" or "level"
        // "node": continue, but pick childrenProperty on a per-node basis (will detect
        //             mixed) 
        // "highest": continue, picking the childrenProperty that occurred most as the single
        //            choice
        // "stop": if there's a tie, stop at this level (assume no further children)
        // NOT SUPPORTED YET: "branch": if using scanMode:"level", continue but with scanMode
        //                              "branch"
        var tieMode = settings.tieMode || "node";

        // what to rename the array of children once discovered
        var newChildrenProperty = settings.newChildrenProperty ||
                                  isc.Tree.getInstanceProperty("childrenProperty"),
            typeProperty = settings.typeProperty || "nodeType",
            // for string leaf nodes (if allowed), what property to store the string under in
            // the auto-created object
            nameProperty = settings.nameProperty || "name";

        if (!isc.isAn.Array(nodes)) nodes = [nodes];

        // go through all the nodes on this level and figure out what property occurs most
        // often as a children property.  This allows us to handle edge cases where the
        // property occurs sometimes as an Array and sometimes singular
        var globalBestCandidate;
        if (scanMode == "level" || scanMode == "branch") {
            var candidateCount = {};
            for (var i = 0; i < nodes.length; i++) {
                var node = nodes[i],
                    childrenProperty = null;

                // optimization: this node was up-converted from a String, it can't have
                // children
                if (node._fromString) continue;

                childrenProperty = this.findChildrenProperty(node, childrenMode);

                if (childrenProperty == null) continue;

                candidateCount[childrenProperty] = (candidateCount[childrenProperty] || 0);
                candidateCount[childrenProperty]++;
            }
            var counts = isc.getValues(candidateCount),
                candidates = isc.getKeys(candidateCount);

            if (candidates.length == 0) {
                // no children property could be found
                return;
            } else if (candidates.length == 1) {
                // use the only candidate
                globalBestCandidate = candidates[0];
            } else if (tieMode == "node") {
                // multiple candidates found, don't set globalBestCandidate and we will
                // automatically go per-node
            } else if (tieMode == "stop") {
                return;
            } else { // tieMode == "highest"
                // pick highest and proceed
                var max = counts.max(),
                    maxIndex = counts.indexOf(max);
                globalBestCandidate = candidates[maxIndex];
            }

            //this.logWarn("counts are: " + this.echo(candidateCount) +
            //             ", globalBestCandidate: " + globalBestCandidate);
        }

        var allChildren = [];
        for (var i = 0; i < nodes.length; i++) {
            var node = nodes[i];

            // default to the globalBestCandidate if there is one
            var bestCandidate = globalBestCandidate;

            if (node._fromString) continue; // can't have children
            
            // determine the best children property individually per node if we haven't already
            // determined it by scanning all nodes
            if (!bestCandidate) {   
                bestCandidate = this.findChildrenProperty(node, childrenMode);
                //this.logWarn("individual bestCandidate: " + bestCandidate + 
                //             " found for node: " + this.echo(node));
            }

            // no children found
            if (bestCandidate == null) continue;

            // normalize children to an Array (even if absent, if a single bestCandidate
            // property was determined for the level)
            var children = node[bestCandidate];
            if (children != null && !isc.isAn.Array(children)) children = [children];
            else if (children == null) children = [];

            // copy discovered children to the normalized childrenProperty
            node[newChildrenProperty] = children;

            // mark all children with a "type" property indicating the property they were found
            // under.  Needed because this information is missing once we normalize all children
            // arrays to appear under the same property name
            for (var j = 0; j < children.length; j++) {
                var child = children[j];
                // if we end up with Strings in the children (valid only with childrenMode
                // "array") auto-convert them to Objects
                if (isc.isA.String(child)) {
                    children[j] = child = {
                        name:child,
                        _fromString:true
                    }   
                } 
                child[typeProperty] = bestCandidate;
            }

            // proceed with this node's children
            if (scanMode == "level") {
                allChildren.addAll(children);
            } else {
                this.discoverTree(children, settings, bestCandidate);
            }
        }   
        if (scanMode == "level" && allChildren.length > 0) this.discoverTree(allChildren, settings);
    },
    
    getCleanNodeData : function (nodeList, includeChildren, cleanChildren, includeLoadState,
                                tree) 
    {
        if (nodeList == null) return null;
    
        var nodes = [], wasSingular = false;
        if (!isc.isAn.Array(nodeList)) {
            nodeList = [nodeList];
            wasSingular = true;
        }
    
        // known imperfections:
        // - by default, isFolderProperty is "isFolder", we write this into nodes and sent it when
        //   saving
        // - we create empty children arrays for childless nodes, and save them
    
        for (var i = 0; i < nodeList.length; i++) {
            var treeNode = nodeList[i],
                node = {};
            var nodeLocator;
            if (this.isANodeLocator(treeNode)) {
                nodeLocator = treeNode;
                treeNode = treeNode.node;
            }
            if (tree == null) {
                var treeID = treeNode._isc_tree;
                if (treeID) tree = window[treeID];
            }
            
            // copy the properties of the tree node, dropping some Tree/TreeGrid artifacts
            for (var propName in treeNode) {
            	if (isc.Tree.isMetaDataProperty(propName, includeChildren, includeLoadState, tree)) {
                    continue;
                }
                node[propName] = treeNode[propName];
       
                // Clean up the children as well (if there are any)
                if (cleanChildren && 
                    tree && 
                    propName == tree.childrenProperty && 
                    isc.isAn.Array(node[propName])) 
                {
                    node[propName] = isc.Tree.getCleanNodeData(node[propName], 
                                                               includeChildren, cleanChildren,
                                                               includeLoadState, tree);
                }
            }
            nodes.add(node);
        }
        if (wasSingular) return nodes[0];
        return nodes;
    },
    
    isMetaDataProperty : function (propName, includeChildren, includeLoadState, tree) {
        
        if ((tree != null && propName == tree.parentProperty) ||
            // currently hardcoded
            (!includeLoadState && propName == "_loadState") ||
            // Explicit false passed as 'includeChildren' param.
            (includeChildren == false && tree && propName == tree.childrenProperty) ||

            propName == "_isc_tree" ||
            
            propName == "__ref" ||
            propName == "__module" ||

            // class of child nodes, set up by ResultTree
            propName == "_derivedChildNodeType" ||
            
            propName == "_autoAssignedName" 
            
            
            
            
            ) 
        {
            return true;;
        } else if (propName.startsWith("_") && (
            // all the internal metadata attributes start with an underscore

            // default nameProperty from ResultTree, which by default does not have
            // meaningful node names
            propName.startsWith("__nodePath") || 
            // the openProperty and isFolderProperty are documented and settable, and if
            // they've been set should be saved, so only remove these properties if they
            // use the prefix that indicates they've been auto-generated (NOTE: this prefix
            // is obfuscated)
            propName.startsWith("_isOpen_") || 
            propName.startsWith("_isFolder_") || 
            
            // shared nodes may have parentProperty from other trees
            propName.startsWith("_parent_") ||
            
            propName.startsWith("_selection_") ||
            // from selection model

            // from grouped grid
            propName.startsWith("_groupTree_") ||

            // embedded components for grid
            propName.startsWith("_embeddedComponents_") ||

            // Do not copy the precalculated length of the tree node.
            propName.startsWith("_cachedLength_") ||

            // Do not copy a recursion flag on the tree node.
            propName.startsWith("_recursionCount_") ||

            // Do not copy a flag used for paged ResultTrees.
            propName.startsWith("_visibleDescendantsCached_") ||

            // Do not copy temporary state used during initial loads of children.
            propName.startsWith("_initialLoadingState_") ||
            propName.startsWith("_initialLoadingFetchCount_") ||
            
            // from TileGrid
            propName.startsWith("_tileID_"))
            )
        {
            return true;
        }
        return false;
    },

    // Remove tree metaData properties from nodes.
    // Same as getCleanNodeData but performs operation in-place.
    removeNodeMetaData : function (nodeList, includeChildren, includeLoadState, tree) {
        if (nodeList == null) return null;
        
        if (!isc.isAn.Array(nodeList)) {
            nodeList = [nodeList];
        }
    
        var undef;
        for (var i = 0; i < nodeList.length; i++) {
            var treeNode = nodeList[i];
            if (tree == null) {
                var treeID = treeNode._isc_tree;
                if (treeID) tree = window[treeID];
            }
            
            // remove the metadata properties of the tree node
            for (var propName in treeNode) {
            	if (isc.Tree.isMetaDataProperty(propName, includeChildren, includeLoadState, this.groupTree)) {
            		treeNode[propName] = undef;
            	}
            }
        }
    },

    isANodeLocator : function(obj) {
        return obj && isc.propertyDefined(obj, "node") && 
                      isc.propertyDefined(obj, "parentId") && 
                      isc.propertyDefined(obj, "position") &&
                      isc.propertyDefined(obj, "path") &&
                      isc.propertyDefined(obj, "openListIndex");
    }
});
