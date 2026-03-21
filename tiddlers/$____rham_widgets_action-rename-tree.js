/*\
title: $:/_/rham/widgets/action-rename-tree
type: application/javascript
module-type: widget

Action widget to rename a tiddler and all its descendants (prefix replacement).
Updates tags that reference renamed tiddlers.

Usage: <$action-rename-tree $from="Policy3330(s1)(2)" $to="Policy3330(s1)(1)"/>

\*/

"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var RenameTreeWidget = function(parseTreeNode, options) {
	this.initialise(parseTreeNode, options);
};

RenameTreeWidget.prototype = new Widget();

RenameTreeWidget.prototype.render = function(parent, nextSibling) {
	this.computeAttributes();
	this.execute();
};

RenameTreeWidget.prototype.execute = function() {
	this.actionFrom = this.getAttribute("$from");
	this.actionTo = this.getAttribute("$to");
};

RenameTreeWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(changedAttributes["$from"] || changedAttributes["$to"]) {
		this.refreshSelf();
		return true;
	}
	return this.refreshChildren(changedTiddlers);
};

RenameTreeWidget.prototype.invokeAction = function(triggeringWidget, event) {
	var fromPrefix = this.actionFrom,
		toPrefix = this.actionTo;
	if(!fromPrefix || !toPrefix || fromPrefix === toPrefix) {
		return true;
	}
	var self = this,
		tiddlersToRename = [];
	// Collect all tiddlers matching the prefix exactly
	this.wiki.each(function(tiddler, title) {
		if(title === fromPrefix || title.indexOf(fromPrefix + "(") === 0) {
			tiddlersToRename.push(tiddler);
		}
	});
	if(tiddlersToRename.length === 0) {
		return true;
	}
	// Create all new tiddlers first
	for(var i = 0; i < tiddlersToRename.length; i++) {
		var tiddler = tiddlersToRename[i],
			oldTitle = tiddler.fields.title,
			newTitle = toPrefix + oldTitle.substring(fromPrefix.length);
		// Update tags that reference any tiddler in the renamed tree
		var oldTags = tiddler.fields.tags || [];
		var newTags = [];
		for(var t = 0; t < oldTags.length; t++) {
			var tag = oldTags[t];
			if(tag === fromPrefix || tag.indexOf(fromPrefix + "(") === 0) {
				newTags.push(toPrefix + tag.substring(fromPrefix.length));
			} else {
				newTags.push(tag);
			}
		}
		var newFields = {};
		for(var field in tiddler.fields) {
			newFields[field] = tiddler.fields[field];
		}
		newFields.title = newTitle;
		newFields.tags = newTags;
		this.wiki.addTiddler(new $tw.Tiddler(newFields));
	}
	// Delete all old tiddlers
	for(var j = 0; j < tiddlersToRename.length; j++) {
		this.wiki.deleteTiddler(tiddlersToRename[j].fields.title);
	}
	return true;
};

exports["action-rename-tree"] = RenameTreeWidget;
