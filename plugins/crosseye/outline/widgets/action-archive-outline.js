/*\
title: $:/plugins/crosseye/outline/widgets/action-archive-outline
type: application/javascript
module-type: widget

Action widget to archive an outline tree into a single compound tiddler.

Usage: <$action-archive-outline $prefix="Policy3330" $archive="$:/outline/archive/Policy3330/20260321160000000"/>

Creates a tiddler of type text/vnd.tiddlywiki-multiple containing all tiddlers
matching the prefix, preserving all fields.

\*/

"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var ArchiveOutlineWidget = function(parseTreeNode, options) {
	this.initialise(parseTreeNode, options);
};

ArchiveOutlineWidget.prototype = new Widget();

ArchiveOutlineWidget.prototype.render = function(parent, nextSibling) {
	this.computeAttributes();
	this.execute();
};

ArchiveOutlineWidget.prototype.execute = function() {
	this.actionPrefix = this.getAttribute("$prefix");
	this.actionArchive = this.getAttribute("$archive");
};

ArchiveOutlineWidget.prototype.refresh = function() {
	return false;
};

ArchiveOutlineWidget.prototype.invokeAction = function(triggeringWidget, event) {
	var prefix = this.actionPrefix;
	var archiveTitle = this.actionArchive;
	var wiki = this.wiki;

	// Find all tiddlers with the prefix (exact match or followed by open paren)
	var tiddlers = wiki.filterTiddlers("[all[tiddlers]prefix[" + prefix + "]]")
		.filter(function(title) {
			return title === prefix || title.charAt(prefix.length) === "(";
		});

	var sections = [];
	tiddlers.forEach(function(title) {
		var tiddler = wiki.getTiddler(title);
		if (tiddler) {
			var lines = [];
			var fields = tiddler.fields;
			var fieldNames = Object.keys(fields).sort();
			fieldNames.forEach(function(field) {
				if (field === "text") return;
				var value = fields[field];
				if (value instanceof Date) {
					value = $tw.utils.stringifyDate(value);
				} else if (Array.isArray(value)) {
					value = $tw.utils.stringifyList(value);
				}
				lines.push(field + ": " + value);
			});
			lines.push("");
			lines.push(fields.text || "");
			sections.push(lines.join("\n"));
		}
	});

	var content = sections.join("\n+\n");

	wiki.addTiddler(new $tw.Tiddler({
		title: archiveTitle,
		type: "text/vnd.tiddlywiki-multiple",
		text: content
	}));

	return true;
};

exports["action-archive-outline"] = ArchiveOutlineWidget;
