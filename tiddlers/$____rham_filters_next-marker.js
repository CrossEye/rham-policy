/*\
title: $:/_/rham/filters/next-marker
type: application/javascript
module-type: filteroperator

Increments a policy section marker to the next value.
Handles: numeric (1→2), s-numbered (s1→s2), lowercase (a→b),
uppercase (A→B), and roman numerals (I→II, III→IV, etc.)

Usage: [<marker>next-marker[]]
\*/
(function() {

"use strict";

var ROMANS = ["I","II","III","IV","V","VI","VII","VIII","IX","X",
              "XI","XII","XIII","XIV","XV","XVI","XVII","XVIII","XIX","XX"];

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

    // Lowercase letter: a, b, c... z
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
