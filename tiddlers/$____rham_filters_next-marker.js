/*\
title: $:/_/rham/filters/next-marker
type: application/javascript
module-type: filteroperator

Increments a policy section marker to the next value.
Handles: numeric (1→2), s-numbered (s1→s2), lowercase (a→b),
uppercase (A→B), roman numerals (I→II, III→IV, etc.),
and lowercase roman numerals (i→ii, iii→iv, etc.)

Usage: [<marker>next-marker[]]
\*/
(function() {

"use strict";

var ROMANS = ["I","II","III","IV","V","VI","VII","VIII","IX","X",
              "XI","XII","XIII","XIV","XV","XVI","XVII","XVIII","XIX","XX"];

var ROMANS_LOWER = ["i","ii","iii","iv","v","vi","vii","viii","ix","x",
                    "xi","xii","xiii","xiv","xv","xvi","xvii","xviii","xix","xx"];

function nextMarker(marker) {
    if (!marker) return "1";

    // s-numbered: s1, s2, s3...
    var sMatch = /^s(\d+)$/.exec(marker);
    if (sMatch) {
        return "s" + (parseInt(sMatch[1], 10) + 1);
    }

    // Plain numeric: 1, 2, 3...
    if (/^\d+$/.test(marker)) {
        return String(parseInt(marker, 10) + 1);
    }

    // Lowercase roman numerals: i, ii, iii, iv, v...
    var lowerRomanIdx = ROMANS_LOWER.indexOf(marker);
    if (lowerRomanIdx >= 0 && lowerRomanIdx < ROMANS_LOWER.length - 1) {
        return ROMANS_LOWER[lowerRomanIdx + 1];
    }

    // Lowercase letter: a, b, c... z (but not 'i' which is caught above as roman)
    if (/^[a-z]$/.test(marker)) {
        if (marker === "z") return "z"; // can't go past z
        return String.fromCharCode(marker.charCodeAt(0) + 1);
    }

    // Uppercase letter: A, B, C... Z
    if (/^[A-Z]$/.test(marker)) {
        // Check if it's a roman numeral first
        var idx = ROMANS.indexOf(marker);
        if (idx >= 0 && idx < ROMANS.length - 1) {
            return ROMANS[idx + 1];
        }
        // Single uppercase letter that's not a roman numeral (or is just I)
        // Disambiguate: if it's a single letter like A, B, C, D, treat as letter
        // unless it matches a roman numeral pattern
        if (marker === "Z") return "Z";
        return String.fromCharCode(marker.charCodeAt(0) + 1);
    }

    // Multi-character uppercase roman numerals: II, III, IV, etc.
    var romanIdx = ROMANS.indexOf(marker);
    if (romanIdx >= 0 && romanIdx < ROMANS.length - 1) {
        return ROMANS[romanIdx + 1];
    }

    // Fallback: return the marker unchanged
    return marker;
}

exports["next-marker"] = function(source, operator) {
    var results = [];
    source(function(tiddler, title) {
        results.push(nextMarker(title));
    });
    return results;
};

})();
