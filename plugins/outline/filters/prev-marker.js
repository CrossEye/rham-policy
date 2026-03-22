/*\
title: $:/plugins/crosseye/outline/filters/prev-marker
type: application/javascript
module-type: filteroperator

Decrements an outline section marker to the previous value.
Handles: numeric (2->1), s-numbered (s2->s1), lowercase (b->a),
uppercase (B->A), roman numerals (II->I, IV->III, etc.),
and lowercase roman numerals (ii->i, iv->iii, etc.)

Returns empty string if already at the first marker in the sequence.

Usage: [<marker>prev-marker[]]
\*/
(function() {

"use strict";

var ROMANS = ["I","II","III","IV","V","VI","VII","VIII","IX","X",
              "XI","XII","XIII","XIV","XV","XVI","XVII","XVIII","XIX","XX"];

var ROMANS_LOWER = ["i","ii","iii","iv","v","vi","vii","viii","ix","x",
                    "xi","xii","xiii","xiv","xv","xvi","xvii","xviii","xix","xx"];

function prevMarker(marker) {
    if (!marker) return "";

    // s-numbered: s1, s2, s3...
    var sMatch = /^s(\d+)$/.exec(marker);
    if (sMatch) {
        var sVal = parseInt(sMatch[1], 10);
        return sVal <= 1 ? "" : "s" + (sVal - 1);
    }

    // Plain numeric: 1, 2, 3...
    if (/^\d+$/.test(marker)) {
        var nVal = parseInt(marker, 10);
        return nVal <= 1 ? "" : String(nVal - 1);
    }

    // Lowercase roman numerals: i, ii, iii, iv, v...
    var lowerRomanIdx = ROMANS_LOWER.indexOf(marker);
    if (lowerRomanIdx > 0) {
        return ROMANS_LOWER[lowerRomanIdx - 1];
    }
    if (lowerRomanIdx === 0) {
        return "";
    }

    // Lowercase letter: a, b, c...
    if (/^[a-z]$/.test(marker)) {
        return marker === "a" ? "" : String.fromCharCode(marker.charCodeAt(0) - 1);
    }

    // Uppercase letter: A, B, C...
    if (/^[A-Z]$/.test(marker)) {
        var idx = ROMANS.indexOf(marker);
        if (idx > 0) {
            return ROMANS[idx - 1];
        }
        if (idx === 0) {
            return "";
        }
        return marker === "A" ? "" : String.fromCharCode(marker.charCodeAt(0) - 1);
    }

    // Multi-character uppercase roman numerals: II, III, IV, etc.
    var romanIdx = ROMANS.indexOf(marker);
    if (romanIdx > 0) {
        return ROMANS[romanIdx - 1];
    }
    if (romanIdx === 0) {
        return "";
    }

    // Fallback: return empty
    return "";
}

exports["prev-marker"] = function(source, operator) {
    var results = [];
    source(function(tiddler, title) {
        results.push(prevMarker(title));
    });
    return results;
};

})();
