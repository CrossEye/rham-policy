/*\
title: $:/plugins/crosseye/outline/filters/outline-sort-key
type: application/javascript
module-type: filteroperator

Returns a sort key for outline sections that positions special sections
at the top or bottom, with normal sections sorted by title in between.

Reads the special section registry from tiddlers tagged with
$:/tags/Outline/SpecialSection/Top and $:/tags/Outline/SpecialSection/Bottom.

Returns:
  "!" repeated (index+1) times for top special sections (sorts first)
  the title as-is for normal sections
  "~" repeated (index+1) times for bottom special sections (sorts last)

Usage in sortsub: +[sortsub:string<outlineOrder>]
where \function outlineOrder() [<currentTiddler>outline-sort-key[]]

\*/
(function() {

"use strict";

var TOP_TAG = "$:/tags/Outline/SpecialSection/Top";
var BOTTOM_TAG = "$:/tags/Outline/SpecialSection/Bottom";

function getOrderedSuffixes(wiki, tag) {
	var tagged = wiki.filterTiddlers("[all[tiddlers+shadows]tag[" + tag + "]]");
	var result = [];
	for(var i = 0; i < tagged.length; i++) {
		var tiddler = wiki.getTiddler(tagged[i]);
		if(tiddler && tiddler.fields.suffix) {
			result.push(tiddler.fields.suffix);
		}
	}
	return result;
}

function extractSuffix(title) {
	var match = /.*\(([^()]+)\)$/.exec(title);
	return match ? match[1] : null;
}

function repeatChar(ch, n) {
	var s = "";
	for(var i = 0; i < n; i++) {
		s += ch;
	}
	return s;
}

exports["outline-sort-key"] = function(source, operator, options) {
	var results = [];
	var wiki = options.wiki;
	var topSuffixes = null;
	var bottomSuffixes = null;

	source(function(tiddler, title) {
		if(topSuffixes === null) {
			topSuffixes = getOrderedSuffixes(wiki, TOP_TAG);
			bottomSuffixes = getOrderedSuffixes(wiki, BOTTOM_TAG);
		}

		var suffix = extractSuffix(title);
		if(suffix) {
			var topIdx = topSuffixes.indexOf(suffix);
			if(topIdx >= 0) {
				results.push(repeatChar("!", topIdx + 1));
				return;
			}
			var bottomIdx = bottomSuffixes.indexOf(suffix);
			if(bottomIdx >= 0) {
				results.push(repeatChar("~", bottomIdx + 1));
				return;
			}
		}
		results.push(title);
	});
	return results;
};

})();
