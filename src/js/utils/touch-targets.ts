// Shared interaction-target standard for BentoPDF's visual editors
// (form builder, workflow editor, and any future canvas tools).
// All sizes are in *screen* pixels — editors that apply CSS zoom must
// counter-scale (divide by their zoom factor) so targets stay a constant
// physical size under the finger or cursor.

/** True on devices whose primary pointer is a finger. */
export const IS_COARSE_POINTER = window.matchMedia('(pointer: coarse)').matches;

/** Square resize anchors on selectable boxes (form fields, crop rects, ...). */
export const RESIZE_HANDLE_SIZE = IS_COARSE_POINTER ? 20 : 10;

/** On coarse pointers, show corner anchors only — edge midpoint anchors
 *  overlap the corners on small boxes and add no reachable precision. */
export const CORNER_HANDLES_ONLY = IS_COARSE_POINTER;

/** Connection points (workflow sockets and similar). */
export const SOCKET_SIZE = IS_COARSE_POINTER ? 22 : 14;

/** Invisible padding around sockets to reach a comfortable hit area. */
export const SOCKET_HIT_PAD = IS_COARSE_POINTER ? 12 : 0;
