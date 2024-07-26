function texMath(state, silent) {
  let startMathPos = state.pos;
  let endMarker;
  let startMarkerLen;

  const startChar = state.src.charCodeAt(startMathPos);

  // Check for starting delimiters: $, $$, \(, \[  (Added new checks)
  if (startChar === 0x24 /* $ */) {
    endMarker = '$';
    startMarkerLen = 1;
    const afterStartMarker = state.src.charCodeAt(startMathPos + 1);
    if (afterStartMarker === 0x24 /* $ */) {
      endMarker = '$$';
      startMarkerLen = 2;
    }
  } else if (startChar === 0x5C /* \ */ && state.src.charCodeAt(startMathPos + 1) === 0x28 /* ( */) {
    endMarker = '\\)';  // New check for \(...\)
    startMarkerLen = 2;
  } else if (startChar === 0x5C /* \ */ && state.src.charCodeAt(startMathPos + 1) === 0x5B /* [ */) {
    endMarker = '\\]';  // New check for \[...\]
    startMarkerLen = 2;
  } else {
    return false; // No valid starting delimiter found
  }

  startMathPos += startMarkerLen;

  if (endMarker === '$$') {
    if (state.src.charCodeAt(startMathPos) === 0x24 /* $ */) {
      // 3 markers are too much
      return false;
    }
  } else if (endMarker === '$') {
    const afterStartMarker = state.src.charCodeAt(startMathPos);
    if (afterStartMarker === 0x20 /* space */ || afterStartMarker === 0x09 /* \t */ || afterStartMarker === 0x0a /* \n */) {
      return false;
    }
  }

  const endMarkerPos = state.src.indexOf(endMarker, startMathPos);
  if (endMarkerPos === -1) {
    return false; // End marker not found
  }
  if (state.src.charCodeAt(endMarkerPos - 1) === 0x5C /* \ */) {
    return false; // End marker is escaped
  }
  const nextPos = endMarkerPos + endMarker.length;
  if (endMarker === '$') {
    const beforeEndMarker = state.src.charCodeAt(endMarkerPos - 1);
    if (beforeEndMarker === 0x20 /* space */ || beforeEndMarker === 0x09 /* \t */ || beforeEndMarker === 0x0a /* \n */) {
      return false;
    }
    const suffix = state.src.charCodeAt(nextPos);
    if (suffix >= 0x30 && suffix < 0x3A) {
      return false; // Closing $ followed by a digit
    }
  }

  if (!silent) {
    const token = state.push(
      endMarker === '$$' || endMarker === '\\]' ? 'display_math' : 'inline_math',  // Updated to handle new delimiters
      '',
      0
    );
    token.content = state.src.slice(startMathPos, endMarkerPos);
  }
  state.pos = nextPos;
  return true;
}

export default (md) => {
  md.inline.ruler.push('texMath', texMath);
};
