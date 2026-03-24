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

var ROMAN_MAP = [
	[1000, "M"], [900, "CM"], [500, "D"], [400, "CD"],
	[100, "C"], [90, "XC"], [50, "L"], [40, "XL"],
	[10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]
];

function romanToInt(s) {
	var upper = s.toUpperCase();
	var result = 0;
	for(var i = 0; i < ROMAN_MAP.length; i++) {
		while(upper.indexOf(ROMAN_MAP[i][1]) === 0) {
			result += ROMAN_MAP[i][0];
			upper = upper.slice(ROMAN_MAP[i][1].length);
		}
	}
	return upper.length === 0 ? result : -1;
}

function padMarker(title) {
	return title.replace(/\(([^()]+)\)/g, function(whole, inner) {
		var asInt = parseInt(inner, 10);
		if(!isNaN(asInt)) {
			return "(" + ("0000" + asInt).slice(-4) + ")";
		}
		var asRoman = romanToInt(inner);
		if(asRoman > 0) {
			return "(" + ("0000" + asRoman).slice(-4) + ")";
		}
		return whole;
	});
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
		results.push(padMarker(title));
	});
	return results;
};

})();
