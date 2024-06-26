/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ 53175:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.evolvePath = void 0;
const get_length_1 = __webpack_require__(26500);
/**
 * @description Animates an SVG from being invisible to it's full length.
 * @param {string} path A valid SVG path
 * @param {number} progress The first valid SVG path
 * @see [Documentation](https://remotion.dev/docs/paths/evolve-path)
 */
const evolvePath = (progress, path) => {
    const length = (0, get_length_1.getLength)(path);
    const strokeDasharray = `${length} ${length}`;
    const strokeDashoffset = length - progress * length;
    return { strokeDasharray, strokeDashoffset };
};
exports.evolvePath = evolvePath;


/***/ }),

/***/ 12430:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.extendViewBox = void 0;
/**
 * @description Extends a viewbox in all directions by a scale factor.
 * @param {string} currentViewBox A valid SVG viewBox
 * @see [Documentation](https://remotion.dev/docs/paths/extend-viewbox)
 */
const extendViewBox = (currentViewBox, scale) => {
    const relativeScale = scale - 1;
    const splitted = currentViewBox
        .split(' ')
        .map((a) => a.trim())
        .filter((a) => a !== '')
        .map(Number);
    if (splitted.length !== 4) {
        throw new Error(`currentViewBox must be 4 valid numbers, but got "${currentViewBox}"`);
    }
    for (const part of splitted) {
        if (Number.isNaN(part)) {
            throw new Error(`currentViewBox must be 4 valid numbers, but got "${currentViewBox}"`);
        }
        if (!Number.isFinite(part)) {
            throw new Error(`currentViewBox must be 4 valid numbers, but got "${currentViewBox}"`);
        }
    }
    const [x, y, width, height] = splitted;
    return [
        x - (relativeScale * width) / 2,
        y - (relativeScale * height) / 2,
        width + relativeScale * width,
        height + relativeScale * height,
    ].join(' ');
};
exports.extendViewBox = extendViewBox;


/***/ }),

/***/ 70902:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.getBoundingBox = exports.getBoundingBoxFromInstructions = void 0;
const remove_a_s_t_curves_1 = __webpack_require__(25525);
const normalize_path_1 = __webpack_require__(83262);
const parse_path_1 = __webpack_require__(92339);
// Precision for consider cubic polynom as quadratic one
const CBEZIER_MINMAX_EPSILON = 0.00000001;
// https://github.com/kpym/SVGPathy/blob/acd1a50c626b36d81969f6e98e8602e128ba4302/lib/box.js#L89
function minmaxQ(A) {
    const min = Math.min(A[0], A[2]);
    const max = Math.max(A[0], A[2]);
    if (A[1] > A[0] ? A[2] >= A[1] : A[2] <= A[1]) {
        // if no extremum in ]0,1[
        return [min, max];
    }
    // check if the extremum E is min or max
    const E = (A[0] * A[2] - A[1] * A[1]) / (A[0] - 2 * A[1] + A[2]);
    return E < min ? [E, max] : [min, E];
}
// https://github.com/kpym/SVGPathy/blob/acd1a50c626b36d81969f6e98e8602e128ba4302/lib/box.js#L127
function minmaxC(A) {
    const K = A[0] - 3 * A[1] + 3 * A[2] - A[3];
    // if the polynomial is (almost) quadratic and not cubic
    if (Math.abs(K) < CBEZIER_MINMAX_EPSILON) {
        if (A[0] === A[3] && A[0] === A[1]) {
            // no curve, point targeting same location
            return [A[0], A[3]];
        }
        return minmaxQ([
            A[0],
            -0.5 * A[0] + 1.5 * A[1],
            A[0] - 3 * A[1] + 3 * A[2],
        ]);
    }
    // the reduced discriminant of the derivative
    const T = -A[0] * A[2] +
        A[0] * A[3] -
        A[1] * A[2] -
        A[1] * A[3] +
        A[1] * A[1] +
        A[2] * A[2];
    // if the polynomial is monotone in [0,1]
    if (T <= 0) {
        return [Math.min(A[0], A[3]), Math.max(A[0], A[3])];
    }
    const S = Math.sqrt(T);
    // potential extrema
    let min = Math.min(A[0], A[3]);
    let max = Math.max(A[0], A[3]);
    const L = A[0] - 2 * A[1] + A[2];
    // check local extrema
    for (let R = (L + S) / K, i = 1; i <= 2; R = (L - S) / K, i++) {
        if (R > 0 && R < 1) {
            // if the extrema is for R in [0,1]
            const Q = A[0] * (1 - R) * (1 - R) * (1 - R) +
                A[1] * 3 * (1 - R) * (1 - R) * R +
                A[2] * 3 * (1 - R) * R * R +
                A[3] * R * R * R;
            if (Q < min) {
                min = Q;
            }
            if (Q > max) {
                max = Q;
            }
        }
    }
    return [min, max];
}
const getBoundingBoxFromInstructions = (instructions) => {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    let x = 0;
    let y = 0;
    let lastMoveX = 0;
    let lastMoveY = 0;
    for (const seg of instructions) {
        switch (seg.type) {
            case 'M': {
                lastMoveX = seg.x;
                lastMoveY = seg.y;
                if (minX > seg.x) {
                    minX = seg.x;
                }
                if (minY > seg.y) {
                    minY = seg.y;
                }
                if (maxX < seg.x) {
                    maxX = seg.x;
                }
                if (maxY < seg.y) {
                    maxY = seg.y;
                }
                x = seg.x;
                y = seg.y;
                break;
            }
            case 'L': {
                if (minX > seg.x) {
                    minX = seg.x;
                }
                if (minY > seg.y) {
                    minY = seg.y;
                }
                if (maxX < seg.x) {
                    maxX = seg.x;
                }
                if (maxY < seg.y) {
                    maxY = seg.y;
                }
                x = seg.x;
                y = seg.y;
                break;
            }
            case 'C': {
                const cxMinMax = minmaxC([x, seg.cp1x, seg.cp2x, seg.x]);
                if (minX > cxMinMax[0]) {
                    minX = cxMinMax[0];
                }
                if (maxX < cxMinMax[1]) {
                    maxX = cxMinMax[1];
                }
                const cyMinMax = minmaxC([y, seg.cp1y, seg.cp2y, seg.y]);
                if (minY > cyMinMax[0]) {
                    minY = cyMinMax[0];
                }
                if (maxY < cyMinMax[1]) {
                    maxY = cyMinMax[1];
                }
                x = seg.x;
                y = seg.y;
                break;
            }
            case 'Q': {
                const qxMinMax = minmaxQ([x, seg.cpx, seg.x]);
                if (minX > qxMinMax[0]) {
                    minX = qxMinMax[0];
                }
                if (maxX < qxMinMax[1]) {
                    maxX = qxMinMax[1];
                }
                const qyMinMax = minmaxQ([y, seg.cpy, seg.y]);
                if (minY > qyMinMax[0]) {
                    minY = qyMinMax[0];
                }
                if (maxY < qyMinMax[1]) {
                    maxY = qyMinMax[1];
                }
                x = seg.x;
                y = seg.y;
                break;
            }
            case 'Z':
                x = lastMoveX;
                y = lastMoveY;
                break;
            default:
                // @ts-expect-error
                throw new Error(`Unknown instruction ${seg.type}`);
        }
    }
    return {
        x1: minX,
        y1: minY,
        x2: maxX,
        y2: maxY,
        viewBox: `${minX} ${minY} ${maxX - minX} ${maxY - minY}`,
        width: maxX - minX,
        height: maxY - minY,
    };
};
exports.getBoundingBoxFromInstructions = getBoundingBoxFromInstructions;
/**
 * @description Returns the bounding box of the given path, suitable for calculating the viewBox value that you need to pass to an SVG.
 * @param {string} d
 * @see [Documentation](https://www.remotion.dev/docs/paths/get-bounding-box)
 */
const getBoundingBox = (d) => {
    const parsed = (0, parse_path_1.parsePath)(d);
    const unarced = (0, remove_a_s_t_curves_1.removeATSHVInstructions)((0, normalize_path_1.normalizeInstructions)(parsed));
    return (0, exports.getBoundingBoxFromInstructions)(unarced);
};
exports.getBoundingBox = getBoundingBox;


/***/ }),

/***/ 94517:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.getInstructionIndexAtLength = exports.getInstructionIndexAtLengthFromConstructed = void 0;
const construct_1 = __webpack_require__(69289);
const getInstructionIndexAtLengthFromConstructed = (constructed, fractionLength) => {
    if (fractionLength < 0) {
        throw new Error('Length less than 0 was passed');
    }
    if (fractionLength > constructed.totalLength) {
        fractionLength = constructed.totalLength;
    }
    let index = constructed.partialLengths.length - 1;
    while (constructed.partialLengths[index] >= fractionLength && index > 0) {
        index--;
    }
    return {
        lengthIntoInstruction: fractionLength - constructed.partialLengths[index],
        index,
    };
};
exports.getInstructionIndexAtLengthFromConstructed = getInstructionIndexAtLengthFromConstructed;
const getInstructionIndexAtLength = (path, length) => {
    const constructed = (0, construct_1.construct)(path);
    if (length > constructed.totalLength) {
        throw new Error(`A length of ${length} was passed to getInstructionIndexAtLength() but the total length of the path is only ${constructed.totalLength}`);
    }
    return (0, exports.getInstructionIndexAtLengthFromConstructed)(constructed, length);
};
exports.getInstructionIndexAtLength = getInstructionIndexAtLength;


/***/ }),

/***/ 26500:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


// Copied from: https://github.com/rveciana/svg-path-properties
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.getLength = void 0;
const construct_1 = __webpack_require__(69289);
/**
 * @description Gets the length of an SVG path.
 * @param {string} path A valid SVG path
 * @see [Documentation](https://remotion.dev/docs/paths/get-length)
 */
const getLength = (path) => {
    const constructucted = (0, construct_1.construct)(path);
    return constructucted.totalLength;
};
exports.getLength = getLength;


/***/ }),

/***/ 81119:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.getPointAtLength = void 0;
const get_instruction_index_at_length_1 = __webpack_require__(94517);
const construct_1 = __webpack_require__(69289);
/**
 * @description Gets the coordinates of a point which is on an SVG path.
 * @param {string} path A valid SVG path
 * @param {number} length The length at which the point should be sampled
 * @see [Documentation](https://remotion.dev/docs/paths/get-point-at-length)
 */
const getPointAtLength = (path, length) => {
    const constructed = (0, construct_1.construct)(path);
    const fractionPart = (0, get_instruction_index_at_length_1.getInstructionIndexAtLengthFromConstructed)(constructed, length);
    const functionAtPart = constructed.functions[fractionPart.index + 1];
    if (functionAtPart) {
        return functionAtPart.getPointAtLength(fractionPart.lengthIntoInstruction);
    }
    if (constructed.initialPoint) {
        return constructed.initialPoint;
    }
    throw new Error('Wrong function at this part.');
};
exports.getPointAtLength = getPointAtLength;


/***/ }),

/***/ 17778:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.getSubpaths = void 0;
const construct_1 = __webpack_require__(69289);
const parse_path_1 = __webpack_require__(92339);
const serialize_instructions_1 = __webpack_require__(9075);
/**
 * @description Splits a valid SVG path into it's parts.
 * @param {string} path A valid SVG path
 * @see [Documentation](https://remotion.dev/docs/paths/get-subpaths)
 */
const getSubpaths = (path) => {
    const parsed = (0, parse_path_1.parsePath)(path);
    const { segments } = (0, construct_1.constructFromInstructions)(parsed);
    return segments.map((seg) => {
        return (0, serialize_instructions_1.serializeInstructions)(seg);
    });
};
exports.getSubpaths = getSubpaths;


/***/ }),

/***/ 76150:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.getTangentAtLength = void 0;
const get_instruction_index_at_length_1 = __webpack_require__(94517);
const construct_1 = __webpack_require__(69289);
/**
 * @description Gets tangent values x and y of a point which is on an SVG path
 * @param {string} path A valid SVG path
 * @param {number} length The length at which the tangent should be sampled
 * @see [Documentation](https://remotion.dev/docs/paths/get-tangent-at-length)
 */
const getTangentAtLength = (path, length) => {
    const constructed = (0, construct_1.construct)(path);
    const fractionPart = (0, get_instruction_index_at_length_1.getInstructionIndexAtLengthFromConstructed)(constructed, length);
    const functionAtPart = constructed.functions[fractionPart.index + 1];
    if (functionAtPart) {
        return functionAtPart.getTangentAtLength(fractionPart.lengthIntoInstruction);
    }
    if (constructed.initialPoint) {
        return { x: 0, y: 0 };
    }
    throw new Error('Wrong function at this part.');
};
exports.getTangentAtLength = getTangentAtLength;


/***/ }),

/***/ 19851:
/***/ ((__unused_webpack_module, exports) => {


// Copied from: https://github.com/rveciana/svg-path-properties
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.makeArc = void 0;
const mod = (x, m) => {
    return ((x % m) + m) % m;
};
const toRadians = (angle) => {
    return angle * (Math.PI / 180);
};
const distance = (p0, p1) => {
    return Math.sqrt((p1.x - p0.x) ** 2 + (p1.y - p0.y) ** 2);
};
const clamp = (val, min, max) => {
    return Math.min(Math.max(val, min), max);
};
const angleBetween = (v0, v1) => {
    const p = v0.x * v1.x + v0.y * v1.y;
    const n = Math.sqrt((v0.x ** 2 + v0.y ** 2) * (v1.x ** 2 + v1.y ** 2));
    const sign = v0.x * v1.y - v0.y * v1.x < 0 ? -1 : 1;
    const angle = sign * Math.acos(p / n);
    return angle;
};
const pointOnEllipticalArc = ({ p0, rx, ry, xAxisRotation, largeArcFlag, sweepFlag, p1, t, }) => {
    // In accordance to: http://www.w3.org/TR/SVG/implnote.html#ArcOutOfRangeParameters
    rx = Math.abs(rx);
    ry = Math.abs(ry);
    xAxisRotation = mod(xAxisRotation, 360);
    const xAxisRotationRadians = toRadians(xAxisRotation);
    // If the endpoints are identical, then this is equivalent to omitting the elliptical arc segment entirely.
    if (p0.x === p1.x && p0.y === p1.y) {
        return { x: p0.x, y: p0.y, ellipticalArcAngle: 0 }; // Check if angle is correct
    }
    // If rx = 0 or ry = 0 then this arc is treated as a straight line segment joining the endpoints.
    if (rx === 0 || ry === 0) {
        // return this.pointOnLine(p0, p1, t);
        return { x: 0, y: 0, ellipticalArcAngle: 0 }; // Check if angle is correct
    }
    // Following "Conversion from endpoint to center parameterization"
    // http://www.w3.org/TR/SVG/implnote.html#ArcConversionEndpointToCenter
    // Step #1: Compute transformedPoint
    const dx = (p0.x - p1.x) / 2;
    const dy = (p0.y - p1.y) / 2;
    const transformedPoint = {
        x: Math.cos(xAxisRotationRadians) * dx + Math.sin(xAxisRotationRadians) * dy,
        y: -Math.sin(xAxisRotationRadians) * dx +
            Math.cos(xAxisRotationRadians) * dy,
    };
    // Ensure radii are large enough
    const radiiCheck = transformedPoint.x ** 2 / rx ** 2 + transformedPoint.y ** 2 / ry ** 2;
    if (radiiCheck > 1) {
        rx *= Math.sqrt(radiiCheck);
        ry *= Math.sqrt(radiiCheck);
    }
    // Step #2: Compute transformedCenter
    const cSquareNumerator = rx ** 2 * ry ** 2 -
        rx ** 2 * transformedPoint.y ** 2 -
        ry ** 2 * transformedPoint.x ** 2;
    const cSquareRootDenom = rx ** 2 * transformedPoint.y ** 2 + ry ** 2 * transformedPoint.x ** 2;
    let cRadicand = cSquareNumerator / cSquareRootDenom;
    // Make sure this never drops below zero because of precision
    cRadicand = cRadicand < 0 ? 0 : cRadicand;
    const cCoef = (largeArcFlag === sweepFlag ? -1 : 1) * Math.sqrt(cRadicand);
    const transformedCenter = {
        x: cCoef * ((rx * transformedPoint.y) / ry),
        y: cCoef * (-(ry * transformedPoint.x) / rx),
    };
    // Step #3: Compute center
    const center = {
        x: Math.cos(xAxisRotationRadians) * transformedCenter.x -
            Math.sin(xAxisRotationRadians) * transformedCenter.y +
            (p0.x + p1.x) / 2,
        y: Math.sin(xAxisRotationRadians) * transformedCenter.x +
            Math.cos(xAxisRotationRadians) * transformedCenter.y +
            (p0.y + p1.y) / 2,
    };
    // Step #4: Compute start/sweep angles
    // Start angle of the elliptical arc prior to the stretch and rotate operations.
    // Difference between the start and end angles
    const startVector = {
        x: (transformedPoint.x - transformedCenter.x) / rx,
        y: (transformedPoint.y - transformedCenter.y) / ry,
    };
    const startAngle = angleBetween({
        x: 1,
        y: 0,
    }, startVector);
    const endVector = {
        x: (-transformedPoint.x - transformedCenter.x) / rx,
        y: (-transformedPoint.y - transformedCenter.y) / ry,
    };
    let sweepAngle = angleBetween(startVector, endVector);
    if (!sweepFlag && sweepAngle > 0) {
        sweepAngle -= 2 * Math.PI;
    }
    else if (sweepFlag && sweepAngle < 0) {
        sweepAngle += 2 * Math.PI;
    }
    // We use % instead of `mod(..)` because we want it to be -360deg to 360deg(but actually in radians)
    sweepAngle %= 2 * Math.PI;
    // From http://www.w3.org/TR/SVG/implnote.html#ArcParameterizationAlternatives
    const angle = startAngle + sweepAngle * t;
    const ellipseComponentX = rx * Math.cos(angle);
    const ellipseComponentY = ry * Math.sin(angle);
    const point = {
        x: Math.cos(xAxisRotationRadians) * ellipseComponentX -
            Math.sin(xAxisRotationRadians) * ellipseComponentY +
            center.x,
        y: Math.sin(xAxisRotationRadians) * ellipseComponentX +
            Math.cos(xAxisRotationRadians) * ellipseComponentY +
            center.y,
        ellipticalArcStartAngle: startAngle,
        ellipticalArcEndAngle: startAngle + sweepAngle,
        ellipticalArcAngle: angle,
        ellipticalArcCenter: center,
        resultantRx: rx,
        resultantRy: ry,
    };
    return point;
};
const approximateArcLengthOfCurve = (resolution, pointOnCurveFunc) => {
    // Resolution is the number of segments we use
    resolution = resolution ? resolution : 500;
    let resultantArcLength = 0;
    const arcLengthMap = [];
    const approximationLines = [];
    let prevPoint = pointOnCurveFunc(0);
    let nextPoint;
    for (let i = 0; i < resolution; i++) {
        const t = clamp(i * (1 / resolution), 0, 1);
        nextPoint = pointOnCurveFunc(t);
        resultantArcLength += distance(prevPoint, nextPoint);
        approximationLines.push([prevPoint, nextPoint]);
        arcLengthMap.push({
            t,
            arcLength: resultantArcLength,
        });
        prevPoint = nextPoint;
    }
    // Last stretch to the endpoint
    nextPoint = pointOnCurveFunc(1);
    approximationLines.push([prevPoint, nextPoint]);
    resultantArcLength += distance(prevPoint, nextPoint);
    arcLengthMap.push({
        t: 1,
        arcLength: resultantArcLength,
    });
    return {
        arcLength: resultantArcLength,
        arcLengthMap,
        approximationLines,
    };
};
const makeArc = ({ x0, y0, rx, ry, xAxisRotate, LargeArcFlag, SweepFlag, x1, y1, }) => {
    const lengthProperties = approximateArcLengthOfCurve(300, (t) => {
        return pointOnEllipticalArc({
            p0: { x: x0, y: y0 },
            rx,
            ry,
            xAxisRotation: xAxisRotate,
            largeArcFlag: LargeArcFlag,
            sweepFlag: SweepFlag,
            p1: { x: x1, y: y1 },
            t,
        });
    });
    const length = lengthProperties.arcLength;
    const getPointAtLength = (fractionLength) => {
        if (fractionLength < 0) {
            fractionLength = 0;
        }
        else if (fractionLength > length) {
            fractionLength = length;
        }
        const position = pointOnEllipticalArc({
            p0: { x: x0, y: y0 },
            rx,
            ry,
            xAxisRotation: xAxisRotate,
            largeArcFlag: LargeArcFlag,
            sweepFlag: SweepFlag,
            p1: { x: x1, y: y1 },
            t: fractionLength / length,
        });
        return { x: position.x, y: position.y };
    };
    return {
        getPointAtLength,
        getTangentAtLength: (fractionLength) => {
            if (fractionLength < 0) {
                fractionLength = 0;
            }
            else if (fractionLength > length) {
                fractionLength = length;
            }
            const point_dist = 0.05; // needs testing
            const p1 = getPointAtLength(fractionLength);
            let p2;
            if (fractionLength < 0) {
                fractionLength = 0;
            }
            else if (fractionLength > length) {
                fractionLength = length;
            }
            if (fractionLength < length - point_dist) {
                p2 = getPointAtLength(fractionLength + point_dist);
            }
            else {
                p2 = getPointAtLength(fractionLength - point_dist);
            }
            const xDist = p2.x - p1.x;
            const yDist = p2.y - p1.y;
            const dist = Math.sqrt(xDist * xDist + yDist * yDist);
            if (fractionLength < length - point_dist) {
                return { x: -xDist / dist, y: -yDist / dist };
            }
            return { x: xDist / dist, y: yDist / dist };
        },
        getTotalLength: () => {
            return length;
        },
        type: 'arc',
    };
};
exports.makeArc = makeArc;


/***/ }),

/***/ 1789:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.t2length = exports.quadraticDerivative = exports.getQuadraticArcLength = exports.cubicDerivative = exports.quadraticPoint = exports.getCubicArcLength = exports.cubicPoint = void 0;
const bezier_values_1 = __webpack_require__(89260);
const cubicPoint = (xs, ys, t) => {
    const x = (1 - t) * (1 - t) * (1 - t) * xs[0] +
        3 * (1 - t) * (1 - t) * t * xs[1] +
        3 * (1 - t) * t * t * xs[2] +
        t * t * t * xs[3];
    const y = (1 - t) * (1 - t) * (1 - t) * ys[0] +
        3 * (1 - t) * (1 - t) * t * ys[1] +
        3 * (1 - t) * t * t * ys[2] +
        t * t * t * ys[3];
    return { x, y };
};
exports.cubicPoint = cubicPoint;
/**
 * Compute the curve derivative (hodograph) at t.
 */
const getDerivative = (derivative, t, vs) => {
    // the derivative of any 't'-less function is zero.
    const n = vs.length - 1;
    let value;
    if (n === 0) {
        return 0;
    }
    // direct values? compute!
    if (derivative === 0) {
        value = 0;
        for (let k = 0; k <= n; k++) {
            value += bezier_values_1.binomialCoefficients[n][k] * (1 - t) ** (n - k) * t ** k * vs[k];
        }
        return value;
    }
    // Still some derivative? go down one order, then try
    // for the lower order curve's.
    const _vs = new Array(n);
    for (let k = 0; k < n; k++) {
        _vs[k] = n * (vs[k + 1] - vs[k]);
    }
    return getDerivative(derivative - 1, t, _vs);
};
function bFunc(xs, ys, t) {
    const xbase = getDerivative(1, t, xs);
    const ybase = getDerivative(1, t, ys);
    const combined = xbase * xbase + ybase * ybase;
    return Math.sqrt(combined);
}
const getCubicArcLength = ({ sx, sy, t, }) => {
    let correctedT;
    const n = 20;
    const z = t / 2;
    let sum = 0;
    for (let i = 0; i < n; i++) {
        correctedT = z * bezier_values_1.tValues[n][i] + z;
        sum += bezier_values_1.cValues[n][i] * bFunc(sx, sy, correctedT);
    }
    return z * sum;
};
exports.getCubicArcLength = getCubicArcLength;
const quadraticPoint = (xs, ys, t) => {
    const x = (1 - t) * (1 - t) * xs[0] + 2 * (1 - t) * t * xs[1] + t * t * xs[2];
    const y = (1 - t) * (1 - t) * ys[0] + 2 * (1 - t) * t * ys[1] + t * t * ys[2];
    return { x, y };
};
exports.quadraticPoint = quadraticPoint;
const cubicDerivative = (xs, ys, t) => {
    const derivative = (0, exports.quadraticPoint)([3 * (xs[1] - xs[0]), 3 * (xs[2] - xs[1]), 3 * (xs[3] - xs[2])], [3 * (ys[1] - ys[0]), 3 * (ys[2] - ys[1]), 3 * (ys[3] - ys[2])], t);
    return derivative;
};
exports.cubicDerivative = cubicDerivative;
const getQuadraticArcLength = (xs, ys, t) => {
    if (t === undefined) {
        t = 1;
    }
    const ax = xs[0] - 2 * xs[1] + xs[2];
    const ay = ys[0] - 2 * ys[1] + ys[2];
    const bx = 2 * xs[1] - 2 * xs[0];
    const by = 2 * ys[1] - 2 * ys[0];
    const A = 4 * (ax * ax + ay * ay);
    const B = 4 * (ax * bx + ay * by);
    const C = bx * bx + by * by;
    if (A === 0) {
        return t * Math.sqrt((xs[2] - xs[0]) ** 2 + (ys[2] - ys[0]) ** 2);
    }
    const b = B / (2 * A);
    const c = C / A;
    const u = t + b;
    const k = c - b * b;
    const uuk = u * u + k > 0 ? Math.sqrt(u * u + k) : 0;
    const bbk = b * b + k > 0 ? Math.sqrt(b * b + k) : 0;
    const term = b + Math.sqrt(b * b + k) === 0
        ? 0
        : k * Math.log(Math.abs((u + uuk) / (b + bbk)));
    return (Math.sqrt(A) / 2) * (u * uuk - b * bbk + term);
};
exports.getQuadraticArcLength = getQuadraticArcLength;
const quadraticDerivative = (xs, ys, t) => {
    return {
        x: (1 - t) * 2 * (xs[1] - xs[0]) + t * 2 * (xs[2] - xs[1]),
        y: (1 - t) * 2 * (ys[1] - ys[0]) + t * 2 * (ys[2] - ys[1]),
    };
};
exports.quadraticDerivative = quadraticDerivative;
const t2length = ({ length, totalLength, func, }) => {
    let error = 1;
    let t = length / totalLength;
    let step = (length - func(t)) / totalLength;
    let numIterations = 0;
    while (error > 0.001) {
        const increasedTLength = func(t + step);
        const increasedTError = Math.abs(length - increasedTLength) / totalLength;
        if (increasedTError < error) {
            error = increasedTError;
            t += step;
        }
        else {
            const decreasedTLength = func(t - step);
            const decreasedTError = Math.abs(length - decreasedTLength) / totalLength;
            if (decreasedTError < error) {
                error = decreasedTError;
                t -= step;
            }
            else {
                step /= 2;
            }
        }
        numIterations++;
        if (numIterations > 500) {
            break;
        }
    }
    return t;
};
exports.t2length = t2length;


/***/ }),

/***/ 89260:
/***/ ((__unused_webpack_module, exports) => {


// Copied from: https://github.com/rveciana/svg-path-properties
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.binomialCoefficients = exports.cValues = exports.tValues = void 0;
/* eslint-disable @typescript-eslint/no-loss-of-precision */
/* eslint-disable no-loss-of-precision */
// Legendre-Gauss abscissae (xi values, defined at i=n as the roots of the nth order Legendre polynomial Pn(x))
exports.tValues = [
    [],
    [],
    [
        -0.5773502691896257645091487805019574556476,
        0.5773502691896257645091487805019574556476,
    ],
    [
        0, -0.7745966692414833770358530799564799221665,
        0.7745966692414833770358530799564799221665,
    ],
    [
        -0.3399810435848562648026657591032446872005,
        0.3399810435848562648026657591032446872005,
        -0.8611363115940525752239464888928095050957,
        0.8611363115940525752239464888928095050957,
    ],
    [
        0, -0.5384693101056830910363144207002088049672,
        0.5384693101056830910363144207002088049672,
        -0.9061798459386639927976268782993929651256,
        0.9061798459386639927976268782993929651256,
    ],
    [
        0.6612093864662645136613995950199053470064,
        -0.6612093864662645136613995950199053470064,
        -0.2386191860831969086305017216807119354186,
        0.2386191860831969086305017216807119354186,
        -0.9324695142031520278123015544939946091347,
        0.9324695142031520278123015544939946091347,
    ],
    [
        0, 0.4058451513773971669066064120769614633473,
        -0.4058451513773971669066064120769614633473,
        -0.7415311855993944398638647732807884070741,
        0.7415311855993944398638647732807884070741,
        -0.9491079123427585245261896840478512624007,
        0.9491079123427585245261896840478512624007,
    ],
    [
        -0.1834346424956498049394761423601839806667,
        0.1834346424956498049394761423601839806667,
        -0.5255324099163289858177390491892463490419,
        0.5255324099163289858177390491892463490419,
        -0.7966664774136267395915539364758304368371,
        0.7966664774136267395915539364758304368371,
        -0.9602898564975362316835608685694729904282,
        0.9602898564975362316835608685694729904282,
    ],
    [
        0, -0.8360311073266357942994297880697348765441,
        0.8360311073266357942994297880697348765441,
        -0.9681602395076260898355762029036728700494,
        0.9681602395076260898355762029036728700494,
        -0.3242534234038089290385380146433366085719,
        0.3242534234038089290385380146433366085719,
        -0.6133714327005903973087020393414741847857,
        0.6133714327005903973087020393414741847857,
    ],
    [
        -0.1488743389816312108848260011297199846175,
        0.1488743389816312108848260011297199846175,
        -0.4333953941292471907992659431657841622,
        0.4333953941292471907992659431657841622,
        -0.6794095682990244062343273651148735757692,
        0.6794095682990244062343273651148735757692,
        -0.8650633666889845107320966884234930485275,
        0.8650633666889845107320966884234930485275,
        -0.9739065285171717200779640120844520534282,
        0.9739065285171717200779640120844520534282,
    ],
    [
        0, -0.2695431559523449723315319854008615246796,
        0.2695431559523449723315319854008615246796,
        -0.5190961292068118159257256694586095544802,
        0.5190961292068118159257256694586095544802,
        -0.7301520055740493240934162520311534580496,
        0.7301520055740493240934162520311534580496,
        -0.8870625997680952990751577693039272666316,
        0.8870625997680952990751577693039272666316,
        -0.9782286581460569928039380011228573907714,
        0.9782286581460569928039380011228573907714,
    ],
    [
        -0.1252334085114689154724413694638531299833,
        0.1252334085114689154724413694638531299833,
        -0.3678314989981801937526915366437175612563,
        0.3678314989981801937526915366437175612563,
        -0.587317954286617447296702418940534280369,
        0.587317954286617447296702418940534280369,
        -0.7699026741943046870368938332128180759849,
        0.7699026741943046870368938332128180759849,
        -0.9041172563704748566784658661190961925375,
        0.9041172563704748566784658661190961925375,
        -0.9815606342467192506905490901492808229601,
        0.9815606342467192506905490901492808229601,
    ],
    [
        0, -0.2304583159551347940655281210979888352115,
        0.2304583159551347940655281210979888352115,
        -0.4484927510364468528779128521276398678019,
        0.4484927510364468528779128521276398678019,
        -0.6423493394403402206439846069955156500716,
        0.6423493394403402206439846069955156500716,
        -0.8015780907333099127942064895828598903056,
        0.8015780907333099127942064895828598903056,
        -0.9175983992229779652065478365007195123904,
        0.9175983992229779652065478365007195123904,
        -0.9841830547185881494728294488071096110649,
        0.9841830547185881494728294488071096110649,
    ],
    [
        -0.1080549487073436620662446502198347476119,
        0.1080549487073436620662446502198347476119,
        -0.3191123689278897604356718241684754668342,
        0.3191123689278897604356718241684754668342,
        -0.5152486363581540919652907185511886623088,
        0.5152486363581540919652907185511886623088,
        -0.6872929048116854701480198030193341375384,
        0.6872929048116854701480198030193341375384,
        -0.8272013150697649931897947426503949610397,
        0.8272013150697649931897947426503949610397,
        -0.928434883663573517336391139377874264477,
        0.928434883663573517336391139377874264477,
        -0.986283808696812338841597266704052801676,
        0.986283808696812338841597266704052801676,
    ],
    [
        0, -0.2011940939974345223006283033945962078128,
        0.2011940939974345223006283033945962078128,
        -0.3941513470775633698972073709810454683627,
        0.3941513470775633698972073709810454683627,
        -0.5709721726085388475372267372539106412383,
        0.5709721726085388475372267372539106412383,
        -0.7244177313601700474161860546139380096308,
        0.7244177313601700474161860546139380096308,
        -0.8482065834104272162006483207742168513662,
        0.8482065834104272162006483207742168513662,
        -0.9372733924007059043077589477102094712439,
        0.9372733924007059043077589477102094712439,
        -0.9879925180204854284895657185866125811469,
        0.9879925180204854284895657185866125811469,
    ],
    [
        -0.0950125098376374401853193354249580631303,
        0.0950125098376374401853193354249580631303,
        -0.281603550779258913230460501460496106486,
        0.281603550779258913230460501460496106486,
        -0.45801677765722738634241944298357757354,
        0.45801677765722738634241944298357757354,
        -0.6178762444026437484466717640487910189918,
        0.6178762444026437484466717640487910189918,
        -0.7554044083550030338951011948474422683538,
        0.7554044083550030338951011948474422683538,
        -0.8656312023878317438804678977123931323873,
        0.8656312023878317438804678977123931323873,
        -0.9445750230732325760779884155346083450911,
        0.9445750230732325760779884155346083450911,
        -0.9894009349916499325961541734503326274262,
        0.9894009349916499325961541734503326274262,
    ],
    [
        0, -0.1784841814958478558506774936540655574754,
        0.1784841814958478558506774936540655574754,
        -0.3512317634538763152971855170953460050405,
        0.3512317634538763152971855170953460050405,
        -0.5126905370864769678862465686295518745829,
        0.5126905370864769678862465686295518745829,
        -0.6576711592166907658503022166430023351478,
        0.6576711592166907658503022166430023351478,
        -0.7815140038968014069252300555204760502239,
        0.7815140038968014069252300555204760502239,
        -0.8802391537269859021229556944881556926234,
        0.8802391537269859021229556944881556926234,
        -0.9506755217687677612227169578958030214433,
        0.9506755217687677612227169578958030214433,
        -0.9905754753144173356754340199406652765077,
        0.9905754753144173356754340199406652765077,
    ],
    [
        -0.0847750130417353012422618529357838117333,
        0.0847750130417353012422618529357838117333,
        -0.2518862256915055095889728548779112301628,
        0.2518862256915055095889728548779112301628,
        -0.4117511614628426460359317938330516370789,
        0.4117511614628426460359317938330516370789,
        -0.5597708310739475346078715485253291369276,
        0.5597708310739475346078715485253291369276,
        -0.6916870430603532078748910812888483894522,
        0.6916870430603532078748910812888483894522,
        -0.8037049589725231156824174550145907971032,
        0.8037049589725231156824174550145907971032,
        -0.8926024664975557392060605911271455154078,
        0.8926024664975557392060605911271455154078,
        -0.9558239495713977551811958929297763099728,
        0.9558239495713977551811958929297763099728,
        -0.9915651684209309467300160047061507702525,
        0.9915651684209309467300160047061507702525,
    ],
    [
        0, -0.1603586456402253758680961157407435495048,
        0.1603586456402253758680961157407435495048,
        -0.3165640999636298319901173288498449178922,
        0.3165640999636298319901173288498449178922,
        -0.4645707413759609457172671481041023679762,
        0.4645707413759609457172671481041023679762,
        -0.6005453046616810234696381649462392798683,
        0.6005453046616810234696381649462392798683,
        -0.7209661773352293786170958608237816296571,
        0.7209661773352293786170958608237816296571,
        -0.8227146565371428249789224867127139017745,
        0.8227146565371428249789224867127139017745,
        -0.9031559036148179016426609285323124878093,
        0.9031559036148179016426609285323124878093,
        -0.960208152134830030852778840687651526615,
        0.960208152134830030852778840687651526615,
        -0.9924068438435844031890176702532604935893,
        0.9924068438435844031890176702532604935893,
    ],
    [
        -0.0765265211334973337546404093988382110047,
        0.0765265211334973337546404093988382110047,
        -0.227785851141645078080496195368574624743,
        0.227785851141645078080496195368574624743,
        -0.3737060887154195606725481770249272373957,
        0.3737060887154195606725481770249272373957,
        -0.5108670019508270980043640509552509984254,
        0.5108670019508270980043640509552509984254,
        -0.6360536807265150254528366962262859367433,
        0.6360536807265150254528366962262859367433,
        -0.7463319064601507926143050703556415903107,
        0.7463319064601507926143050703556415903107,
        -0.8391169718222188233945290617015206853296,
        0.8391169718222188233945290617015206853296,
        -0.9122344282513259058677524412032981130491,
        0.9122344282513259058677524412032981130491,
        -0.963971927277913791267666131197277221912,
        0.963971927277913791267666131197277221912,
        -0.9931285991850949247861223884713202782226,
        0.9931285991850949247861223884713202782226,
    ],
    [
        0, -0.1455618541608950909370309823386863301163,
        0.1455618541608950909370309823386863301163,
        -0.288021316802401096600792516064600319909,
        0.288021316802401096600792516064600319909,
        -0.4243421202074387835736688885437880520964,
        0.4243421202074387835736688885437880520964,
        -0.551618835887219807059018796724313286622,
        0.551618835887219807059018796724313286622,
        -0.667138804197412319305966669990339162597,
        0.667138804197412319305966669990339162597,
        -0.7684399634756779086158778513062280348209,
        0.7684399634756779086158778513062280348209,
        -0.8533633645833172836472506385875676702761,
        0.8533633645833172836472506385875676702761,
        -0.9200993341504008287901871337149688941591,
        0.9200993341504008287901871337149688941591,
        -0.9672268385663062943166222149076951614246,
        0.9672268385663062943166222149076951614246,
        -0.9937521706203895002602420359379409291933,
        0.9937521706203895002602420359379409291933,
    ],
    [
        -0.0697392733197222212138417961186280818222,
        0.0697392733197222212138417961186280818222,
        -0.2078604266882212854788465339195457342156,
        0.2078604266882212854788465339195457342156,
        -0.3419358208920842251581474204273796195591,
        0.3419358208920842251581474204273796195591,
        -0.4693558379867570264063307109664063460953,
        0.4693558379867570264063307109664063460953,
        -0.5876404035069115929588769276386473488776,
        0.5876404035069115929588769276386473488776,
        -0.6944872631866827800506898357622567712673,
        0.6944872631866827800506898357622567712673,
        -0.7878168059792081620042779554083515213881,
        0.7878168059792081620042779554083515213881,
        -0.8658125777203001365364256370193787290847,
        0.8658125777203001365364256370193787290847,
        -0.9269567721871740005206929392590531966353,
        0.9269567721871740005206929392590531966353,
        -0.9700604978354287271239509867652687108059,
        0.9700604978354287271239509867652687108059,
        -0.994294585482399292073031421161298980393,
        0.994294585482399292073031421161298980393,
    ],
    [
        0, -0.1332568242984661109317426822417661370104,
        0.1332568242984661109317426822417661370104,
        -0.264135680970344930533869538283309602979,
        0.264135680970344930533869538283309602979,
        -0.390301038030290831421488872880605458578,
        0.390301038030290831421488872880605458578,
        -0.5095014778460075496897930478668464305448,
        0.5095014778460075496897930478668464305448,
        -0.6196098757636461563850973116495956533871,
        0.6196098757636461563850973116495956533871,
        -0.7186613631319501944616244837486188483299,
        0.7186613631319501944616244837486188483299,
        -0.8048884016188398921511184069967785579414,
        0.8048884016188398921511184069967785579414,
        -0.8767523582704416673781568859341456716389,
        0.8767523582704416673781568859341456716389,
        -0.9329710868260161023491969890384229782357,
        0.9329710868260161023491969890384229782357,
        -0.9725424712181152319560240768207773751816,
        0.9725424712181152319560240768207773751816,
        -0.9947693349975521235239257154455743605736,
        0.9947693349975521235239257154455743605736,
    ],
    [
        -0.0640568928626056260850430826247450385909,
        0.0640568928626056260850430826247450385909,
        -0.1911188674736163091586398207570696318404,
        0.1911188674736163091586398207570696318404,
        -0.3150426796961633743867932913198102407864,
        0.3150426796961633743867932913198102407864,
        -0.4337935076260451384870842319133497124524,
        0.4337935076260451384870842319133497124524,
        -0.5454214713888395356583756172183723700107,
        0.5454214713888395356583756172183723700107,
        -0.6480936519369755692524957869107476266696,
        0.6480936519369755692524957869107476266696,
        -0.7401241915785543642438281030999784255232,
        0.7401241915785543642438281030999784255232,
        -0.8200019859739029219539498726697452080761,
        0.8200019859739029219539498726697452080761,
        -0.8864155270044010342131543419821967550873,
        0.8864155270044010342131543419821967550873,
        -0.9382745520027327585236490017087214496548,
        0.9382745520027327585236490017087214496548,
        -0.9747285559713094981983919930081690617411,
        0.9747285559713094981983919930081690617411,
        -0.9951872199970213601799974097007368118745,
        0.9951872199970213601799974097007368118745,
    ],
];
// Legendre-Gauss weights (wi values, defined by a function linked to in the Bezier primer article)
exports.cValues = [
    [],
    [],
    [1.0, 1.0],
    [
        0.8888888888888888888888888888888888888888,
        0.5555555555555555555555555555555555555555,
        0.5555555555555555555555555555555555555555,
    ],
    [
        0.6521451548625461426269360507780005927646,
        0.6521451548625461426269360507780005927646,
        0.3478548451374538573730639492219994072353,
        0.3478548451374538573730639492219994072353,
    ],
    [
        0.5688888888888888888888888888888888888888,
        0.4786286704993664680412915148356381929122,
        0.4786286704993664680412915148356381929122,
        0.2369268850561890875142640407199173626432,
        0.2369268850561890875142640407199173626432,
    ],
    [
        0.3607615730481386075698335138377161116615,
        0.3607615730481386075698335138377161116615,
        0.4679139345726910473898703439895509948116,
        0.4679139345726910473898703439895509948116,
        0.1713244923791703450402961421727328935268,
        0.1713244923791703450402961421727328935268,
    ],
    [
        0.4179591836734693877551020408163265306122,
        0.3818300505051189449503697754889751338783,
        0.3818300505051189449503697754889751338783,
        0.2797053914892766679014677714237795824869,
        0.2797053914892766679014677714237795824869,
        0.1294849661688696932706114326790820183285,
        0.1294849661688696932706114326790820183285,
    ],
    [
        0.3626837833783619829651504492771956121941,
        0.3626837833783619829651504492771956121941,
        0.3137066458778872873379622019866013132603,
        0.3137066458778872873379622019866013132603,
        0.2223810344533744705443559944262408844301,
        0.2223810344533744705443559944262408844301,
        0.1012285362903762591525313543099621901153,
        0.1012285362903762591525313543099621901153,
    ],
    [
        0.3302393550012597631645250692869740488788,
        0.1806481606948574040584720312429128095143,
        0.1806481606948574040584720312429128095143,
        0.0812743883615744119718921581105236506756,
        0.0812743883615744119718921581105236506756,
        0.3123470770400028400686304065844436655987,
        0.3123470770400028400686304065844436655987,
        0.2606106964029354623187428694186328497718,
        0.2606106964029354623187428694186328497718,
    ],
    [
        0.295524224714752870173892994651338329421,
        0.295524224714752870173892994651338329421,
        0.2692667193099963550912269215694693528597,
        0.2692667193099963550912269215694693528597,
        0.2190863625159820439955349342281631924587,
        0.2190863625159820439955349342281631924587,
        0.1494513491505805931457763396576973324025,
        0.1494513491505805931457763396576973324025,
        0.0666713443086881375935688098933317928578,
        0.0666713443086881375935688098933317928578,
    ],
    [
        0.272925086777900630714483528336342189156,
        0.2628045445102466621806888698905091953727,
        0.2628045445102466621806888698905091953727,
        0.2331937645919904799185237048431751394317,
        0.2331937645919904799185237048431751394317,
        0.1862902109277342514260976414316558916912,
        0.1862902109277342514260976414316558916912,
        0.1255803694649046246346942992239401001976,
        0.1255803694649046246346942992239401001976,
        0.0556685671161736664827537204425485787285,
        0.0556685671161736664827537204425485787285,
    ],
    [
        0.2491470458134027850005624360429512108304,
        0.2491470458134027850005624360429512108304,
        0.2334925365383548087608498989248780562594,
        0.2334925365383548087608498989248780562594,
        0.2031674267230659217490644558097983765065,
        0.2031674267230659217490644558097983765065,
        0.160078328543346226334652529543359071872,
        0.160078328543346226334652529543359071872,
        0.1069393259953184309602547181939962242145,
        0.1069393259953184309602547181939962242145,
        0.047175336386511827194615961485017060317,
        0.047175336386511827194615961485017060317,
    ],
    [
        0.2325515532308739101945895152688359481566,
        0.2262831802628972384120901860397766184347,
        0.2262831802628972384120901860397766184347,
        0.2078160475368885023125232193060527633865,
        0.2078160475368885023125232193060527633865,
        0.1781459807619457382800466919960979955128,
        0.1781459807619457382800466919960979955128,
        0.1388735102197872384636017768688714676218,
        0.1388735102197872384636017768688714676218,
        0.0921214998377284479144217759537971209236,
        0.0921214998377284479144217759537971209236,
        0.0404840047653158795200215922009860600419,
        0.0404840047653158795200215922009860600419,
    ],
    [
        0.2152638534631577901958764433162600352749,
        0.2152638534631577901958764433162600352749,
        0.2051984637212956039659240656612180557103,
        0.2051984637212956039659240656612180557103,
        0.1855383974779378137417165901251570362489,
        0.1855383974779378137417165901251570362489,
        0.1572031671581935345696019386238421566056,
        0.1572031671581935345696019386238421566056,
        0.1215185706879031846894148090724766259566,
        0.1215185706879031846894148090724766259566,
        0.0801580871597602098056332770628543095836,
        0.0801580871597602098056332770628543095836,
        0.0351194603317518630318328761381917806197,
        0.0351194603317518630318328761381917806197,
    ],
    [
        0.2025782419255612728806201999675193148386,
        0.1984314853271115764561183264438393248186,
        0.1984314853271115764561183264438393248186,
        0.1861610000155622110268005618664228245062,
        0.1861610000155622110268005618664228245062,
        0.1662692058169939335532008604812088111309,
        0.1662692058169939335532008604812088111309,
        0.1395706779261543144478047945110283225208,
        0.1395706779261543144478047945110283225208,
        0.1071592204671719350118695466858693034155,
        0.1071592204671719350118695466858693034155,
        0.0703660474881081247092674164506673384667,
        0.0703660474881081247092674164506673384667,
        0.0307532419961172683546283935772044177217,
        0.0307532419961172683546283935772044177217,
    ],
    [
        0.1894506104550684962853967232082831051469,
        0.1894506104550684962853967232082831051469,
        0.1826034150449235888667636679692199393835,
        0.1826034150449235888667636679692199393835,
        0.1691565193950025381893120790303599622116,
        0.1691565193950025381893120790303599622116,
        0.1495959888165767320815017305474785489704,
        0.1495959888165767320815017305474785489704,
        0.1246289712555338720524762821920164201448,
        0.1246289712555338720524762821920164201448,
        0.0951585116824927848099251076022462263552,
        0.0951585116824927848099251076022462263552,
        0.0622535239386478928628438369943776942749,
        0.0622535239386478928628438369943776942749,
        0.0271524594117540948517805724560181035122,
        0.0271524594117540948517805724560181035122,
    ],
    [
        0.1794464703562065254582656442618856214487,
        0.1765627053669926463252709901131972391509,
        0.1765627053669926463252709901131972391509,
        0.1680041021564500445099706637883231550211,
        0.1680041021564500445099706637883231550211,
        0.1540457610768102880814315948019586119404,
        0.1540457610768102880814315948019586119404,
        0.1351363684685254732863199817023501973721,
        0.1351363684685254732863199817023501973721,
        0.1118838471934039710947883856263559267358,
        0.1118838471934039710947883856263559267358,
        0.0850361483171791808835353701910620738504,
        0.0850361483171791808835353701910620738504,
        0.0554595293739872011294401653582446605128,
        0.0554595293739872011294401653582446605128,
        0.0241483028685479319601100262875653246916,
        0.0241483028685479319601100262875653246916,
    ],
    [
        0.1691423829631435918406564701349866103341,
        0.1691423829631435918406564701349866103341,
        0.1642764837458327229860537764659275904123,
        0.1642764837458327229860537764659275904123,
        0.1546846751262652449254180038363747721932,
        0.1546846751262652449254180038363747721932,
        0.1406429146706506512047313037519472280955,
        0.1406429146706506512047313037519472280955,
        0.1225552067114784601845191268002015552281,
        0.1225552067114784601845191268002015552281,
        0.1009420441062871655628139849248346070628,
        0.1009420441062871655628139849248346070628,
        0.0764257302548890565291296776166365256053,
        0.0764257302548890565291296776166365256053,
        0.0497145488949697964533349462026386416808,
        0.0497145488949697964533349462026386416808,
        0.0216160135264833103133427102664524693876,
        0.0216160135264833103133427102664524693876,
    ],
    [
        0.1610544498487836959791636253209167350399,
        0.1589688433939543476499564394650472016787,
        0.1589688433939543476499564394650472016787,
        0.152766042065859666778855400897662998461,
        0.152766042065859666778855400897662998461,
        0.1426067021736066117757461094419029724756,
        0.1426067021736066117757461094419029724756,
        0.1287539625393362276755157848568771170558,
        0.1287539625393362276755157848568771170558,
        0.1115666455473339947160239016817659974813,
        0.1115666455473339947160239016817659974813,
        0.0914900216224499994644620941238396526609,
        0.0914900216224499994644620941238396526609,
        0.0690445427376412265807082580060130449618,
        0.0690445427376412265807082580060130449618,
        0.0448142267656996003328381574019942119517,
        0.0448142267656996003328381574019942119517,
        0.0194617882297264770363120414644384357529,
        0.0194617882297264770363120414644384357529,
    ],
    [
        0.1527533871307258506980843319550975934919,
        0.1527533871307258506980843319550975934919,
        0.1491729864726037467878287370019694366926,
        0.1491729864726037467878287370019694366926,
        0.1420961093183820513292983250671649330345,
        0.1420961093183820513292983250671649330345,
        0.1316886384491766268984944997481631349161,
        0.1316886384491766268984944997481631349161,
        0.118194531961518417312377377711382287005,
        0.118194531961518417312377377711382287005,
        0.1019301198172404350367501354803498761666,
        0.1019301198172404350367501354803498761666,
        0.0832767415767047487247581432220462061001,
        0.0832767415767047487247581432220462061001,
        0.0626720483341090635695065351870416063516,
        0.0626720483341090635695065351870416063516,
        0.040601429800386941331039952274932109879,
        0.040601429800386941331039952274932109879,
        0.0176140071391521183118619623518528163621,
        0.0176140071391521183118619623518528163621,
    ],
    [
        0.1460811336496904271919851476833711882448,
        0.1445244039899700590638271665537525436099,
        0.1445244039899700590638271665537525436099,
        0.1398873947910731547221334238675831108927,
        0.1398873947910731547221334238675831108927,
        0.132268938633337461781052574496775604329,
        0.132268938633337461781052574496775604329,
        0.1218314160537285341953671771257335983563,
        0.1218314160537285341953671771257335983563,
        0.1087972991671483776634745780701056420336,
        0.1087972991671483776634745780701056420336,
        0.0934444234560338615532897411139320884835,
        0.0934444234560338615532897411139320884835,
        0.0761001136283793020170516533001831792261,
        0.0761001136283793020170516533001831792261,
        0.0571344254268572082836358264724479574912,
        0.0571344254268572082836358264724479574912,
        0.0369537897708524937999506682993296661889,
        0.0369537897708524937999506682993296661889,
        0.0160172282577743333242246168584710152658,
        0.0160172282577743333242246168584710152658,
    ],
    [
        0.1392518728556319933754102483418099578739,
        0.1392518728556319933754102483418099578739,
        0.1365414983460151713525738312315173965863,
        0.1365414983460151713525738312315173965863,
        0.1311735047870623707329649925303074458757,
        0.1311735047870623707329649925303074458757,
        0.1232523768105124242855609861548144719594,
        0.1232523768105124242855609861548144719594,
        0.1129322960805392183934006074217843191142,
        0.1129322960805392183934006074217843191142,
        0.1004141444428809649320788378305362823508,
        0.1004141444428809649320788378305362823508,
        0.0859416062170677274144436813727028661891,
        0.0859416062170677274144436813727028661891,
        0.0697964684245204880949614189302176573987,
        0.0697964684245204880949614189302176573987,
        0.0522933351526832859403120512732112561121,
        0.0522933351526832859403120512732112561121,
        0.0337749015848141547933022468659129013491,
        0.0337749015848141547933022468659129013491,
        0.0146279952982722006849910980471854451902,
        0.0146279952982722006849910980471854451902,
    ],
    [
        0.1336545721861061753514571105458443385831,
        0.132462039404696617371642464703316925805,
        0.132462039404696617371642464703316925805,
        0.1289057221880821499785953393997936532597,
        0.1289057221880821499785953393997936532597,
        0.1230490843067295304675784006720096548158,
        0.1230490843067295304675784006720096548158,
        0.1149966402224113649416435129339613014914,
        0.1149966402224113649416435129339613014914,
        0.1048920914645414100740861850147438548584,
        0.1048920914645414100740861850147438548584,
        0.0929157660600351474770186173697646486034,
        0.0929157660600351474770186173697646486034,
        0.0792814117767189549228925247420432269137,
        0.0792814117767189549228925247420432269137,
        0.0642324214085258521271696151589109980391,
        0.0642324214085258521271696151589109980391,
        0.0480376717310846685716410716320339965612,
        0.0480376717310846685716410716320339965612,
        0.0309880058569794443106942196418845053837,
        0.0309880058569794443106942196418845053837,
        0.0134118594871417720813094934586150649766,
        0.0134118594871417720813094934586150649766,
    ],
    [
        0.1279381953467521569740561652246953718517,
        0.1279381953467521569740561652246953718517,
        0.1258374563468282961213753825111836887264,
        0.1258374563468282961213753825111836887264,
        0.121670472927803391204463153476262425607,
        0.121670472927803391204463153476262425607,
        0.1155056680537256013533444839067835598622,
        0.1155056680537256013533444839067835598622,
        0.1074442701159656347825773424466062227946,
        0.1074442701159656347825773424466062227946,
        0.0976186521041138882698806644642471544279,
        0.0976186521041138882698806644642471544279,
        0.086190161531953275917185202983742667185,
        0.086190161531953275917185202983742667185,
        0.0733464814110803057340336152531165181193,
        0.0733464814110803057340336152531165181193,
        0.0592985849154367807463677585001085845412,
        0.0592985849154367807463677585001085845412,
        0.0442774388174198061686027482113382288593,
        0.0442774388174198061686027482113382288593,
        0.0285313886289336631813078159518782864491,
        0.0285313886289336631813078159518782864491,
        0.0123412297999871995468056670700372915759,
        0.0123412297999871995468056670700372915759,
    ],
];
// LUT for binomial coefficient arrays per curve order 'n'
exports.binomialCoefficients = [[1], [1, 1], [1, 2, 1], [1, 3, 3, 1]];


/***/ }),

/***/ 77925:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


// Copied from: https://github.com/rveciana/svg-path-properties
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.makeCubic = exports.makeQuadratic = void 0;
const bezier_functions_1 = __webpack_require__(1789);
const makeQuadratic = ({ startX, startY, cpx, cpy, x, y, }) => {
    const a = { x: startX, y: startY };
    const b = { x: cpx, y: cpy };
    const c = { x, y };
    const length = (0, bezier_functions_1.getQuadraticArcLength)([a.x, b.x, c.x, 0], [a.y, b.y, c.y, 0], 1);
    const getTotalLength = () => {
        return length;
    };
    const getPointAtLength = (len) => {
        const xs = [a.x, b.x, c.x, 0];
        const xy = [a.y, b.y, c.y, 0];
        const t = (0, bezier_functions_1.t2length)({
            length: len,
            totalLength: length,
            func: (i) => (0, bezier_functions_1.getQuadraticArcLength)(xs, xy, i),
        });
        return (0, bezier_functions_1.quadraticPoint)(xs, xy, t);
    };
    const getTangentAtLength = (len) => {
        const xs = [a.x, b.x, c.x, 0];
        const xy = [a.y, b.y, c.y, 0];
        const t = (0, bezier_functions_1.t2length)({
            length: len,
            totalLength: length,
            func: (i) => (0, bezier_functions_1.getQuadraticArcLength)(xs, xy, i),
        });
        const derivative = (0, bezier_functions_1.quadraticDerivative)(xs, xy, t);
        const mdl = Math.sqrt(derivative.x * derivative.x + derivative.y * derivative.y);
        let tangent;
        if (mdl > 0) {
            tangent = { x: derivative.x / mdl, y: derivative.y / mdl };
        }
        else {
            tangent = { x: 0, y: 0 };
        }
        return tangent;
    };
    const getC = () => {
        return c;
    };
    return {
        getPointAtLength,
        getTangentAtLength,
        getTotalLength,
        getC,
        type: 'quadratic-bezier',
        getD: () => ({ x: 0, y: 0 }),
    };
};
exports.makeQuadratic = makeQuadratic;
const makeCubic = ({ startX, startY, cp1x, cp1y, cp2x, cp2y, x, y, }) => {
    const a = { x: startX, y: startY };
    const b = { x: cp1x, y: cp1y };
    const c = { x: cp2x, y: cp2y };
    const d = { x, y };
    const length = (0, bezier_functions_1.getCubicArcLength)({
        sx: [a.x, b.x, c.x, d.x],
        sy: [a.y, b.y, c.y, d.y],
        t: 1,
    });
    const getTotalLength = () => {
        return length;
    };
    const getPointAtLength = (len) => {
        const sx = [a.x, b.x, c.x, d.x];
        const sy = [a.y, b.y, c.y, d.y];
        const t = (0, bezier_functions_1.t2length)({
            length: len,
            totalLength: length,
            func: (i) => {
                return (0, bezier_functions_1.getCubicArcLength)({ sx, sy, t: i });
            },
        });
        return (0, bezier_functions_1.cubicPoint)(sx, sy, t);
    };
    const getTangentAtLength = (len) => {
        const xs = [a.x, b.x, c.x, d.x];
        const xy = [a.y, b.y, c.y, d.y];
        const t = (0, bezier_functions_1.t2length)({
            length: len,
            totalLength: length,
            func: (i) => (0, bezier_functions_1.getCubicArcLength)({ sx: xs, sy: xy, t: i }),
        });
        const derivative = (0, bezier_functions_1.cubicDerivative)(xs, xy, t);
        const mdl = Math.sqrt(derivative.x * derivative.x + derivative.y * derivative.y);
        let tangent;
        if (mdl > 0) {
            tangent = { x: derivative.x / mdl, y: derivative.y / mdl };
        }
        else {
            tangent = { x: 0, y: 0 };
        }
        return tangent;
    };
    const getC = () => {
        return c;
    };
    const getD = () => {
        return d;
    };
    return {
        getPointAtLength,
        getTangentAtLength,
        getTotalLength,
        getC,
        getD,
        type: 'cubic-bezier',
    };
};
exports.makeCubic = makeCubic;


/***/ }),

/***/ 69289:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


// Copied from: https://github.com/rveciana/svg-path-properties
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.construct = exports.constructFromInstructions = void 0;
const parse_path_1 = __webpack_require__(92339);
const arc_1 = __webpack_require__(19851);
const bezier_1 = __webpack_require__(77925);
const linear_1 = __webpack_require__(33238);
const constructFromInstructions = (instructions) => {
    let totalLength = 0;
    const partialLengths = [];
    const functions = [];
    let initialPoint = null;
    let cur = [0, 0];
    let prev_point = [0, 0];
    let curve;
    let ringStart = [0, 0];
    const segments = [];
    for (let i = 0; i < instructions.length; i++) {
        const instruction = instructions[i];
        if (instruction.type !== 'm' &&
            instruction.type !== 'M' &&
            segments.length > 0) {
            segments[segments.length - 1].push(instruction);
        }
        // moveTo
        if (instruction.type === 'M') {
            cur = [instruction.x, instruction.y];
            ringStart = [cur[0], cur[1]];
            segments.push([instruction]);
            functions.push(null);
            if (i === 0) {
                initialPoint = { x: instruction.x, y: instruction.y };
            }
        }
        if (instruction.type === 'm') {
            cur = [instruction.dx + cur[0], instruction.dy + cur[1]];
            ringStart = [cur[0], cur[1]];
            segments.push([{ type: 'M', x: cur[0], y: cur[1] }]);
            functions.push(null);
            // lineTo
        }
        if (instruction.type === 'L') {
            totalLength += Math.sqrt((cur[0] - instruction.x) ** 2 + (cur[1] - instruction.y) ** 2);
            functions.push((0, linear_1.makeLinearPosition)({
                x0: cur[0],
                x1: instruction.x,
                y0: cur[1],
                y1: instruction.y,
            }));
            cur = [instruction.x, instruction.y];
        }
        if (instruction.type === 'l') {
            totalLength += Math.sqrt(instruction.dx ** 2 + instruction.dy ** 2);
            functions.push((0, linear_1.makeLinearPosition)({
                x0: cur[0],
                x1: instruction.dx + cur[0],
                y0: cur[1],
                y1: instruction.dy + cur[1],
            }));
            cur = [instruction.dx + cur[0], instruction.dy + cur[1]];
        }
        if (instruction.type === 'H') {
            totalLength += Math.abs(cur[0] - instruction.x);
            functions.push((0, linear_1.makeLinearPosition)({
                x0: cur[0],
                x1: instruction.x,
                y0: cur[1],
                y1: cur[1],
            }));
            cur[0] = instruction.x;
        }
        if (instruction.type === 'h') {
            totalLength += Math.abs(instruction.dx);
            functions.push((0, linear_1.makeLinearPosition)({
                x0: cur[0],
                x1: cur[0] + instruction.dx,
                y0: cur[1],
                y1: cur[1],
            }));
            cur[0] = instruction.dx + cur[0];
        }
        else if (instruction.type === 'V') {
            totalLength += Math.abs(cur[1] - instruction.y);
            functions.push((0, linear_1.makeLinearPosition)({
                x0: cur[0],
                x1: cur[0],
                y0: cur[1],
                y1: instruction.y,
            }));
            cur[1] = instruction.y;
        }
        if (instruction.type === 'v') {
            totalLength += Math.abs(instruction.dy);
            functions.push((0, linear_1.makeLinearPosition)({
                x0: cur[0],
                x1: cur[0],
                y0: cur[1],
                y1: cur[1] + instruction.dy,
            }));
            cur[1] = instruction.dy + cur[1];
            // Close path
        }
        else if (instruction.type === 'Z') {
            totalLength += Math.sqrt((ringStart[0] - cur[0]) ** 2 + (ringStart[1] - cur[1]) ** 2);
            functions.push((0, linear_1.makeLinearPosition)({
                x0: cur[0],
                x1: ringStart[0],
                y0: cur[1],
                y1: ringStart[1],
            }));
            cur = [ringStart[0], ringStart[1]];
            // Cubic Bezier curves
        }
        if (instruction.type === 'C') {
            curve = (0, bezier_1.makeCubic)({
                startX: cur[0],
                startY: cur[1],
                cp1x: instruction.cp1x,
                cp1y: instruction.cp1y,
                cp2x: instruction.cp2x,
                cp2y: instruction.cp2y,
                x: instruction.x,
                y: instruction.y,
            });
            totalLength += curve.getTotalLength();
            cur = [instruction.x, instruction.y];
            functions.push(curve);
        }
        else if (instruction.type === 'c') {
            curve = (0, bezier_1.makeCubic)({
                startX: cur[0],
                startY: cur[1],
                cp1x: cur[0] + instruction.cp1dx,
                cp1y: cur[1] + instruction.cp1dy,
                cp2x: cur[0] + instruction.cp2dx,
                cp2y: cur[1] + instruction.cp2dy,
                x: cur[0] + instruction.dx,
                y: cur[1] + instruction.dy,
            });
            if (curve.getTotalLength() > 0) {
                totalLength += curve.getTotalLength();
                functions.push(curve);
                cur = [instruction.dx + cur[0], instruction.dy + cur[1]];
            }
            else {
                functions.push((0, linear_1.makeLinearPosition)({ x0: cur[0], x1: cur[0], y0: cur[1], y1: cur[1] }));
            }
        }
        if (instruction.type === 'S') {
            const prev = instructions[i - 1];
            const prevWasCurve = prev.type === 'C' ||
                prev.type === 'c' ||
                prev.type === 'S' ||
                prev.type === 's';
            if (i > 0 && prevWasCurve) {
                if (curve) {
                    const c = curve.getC();
                    curve = (0, bezier_1.makeCubic)({
                        startX: cur[0],
                        startY: cur[1],
                        cp1x: 2 * cur[0] - c.x,
                        cp1y: 2 * cur[1] - c.y,
                        cp2x: instruction.cpx,
                        cp2y: instruction.cpy,
                        x: instruction.x,
                        y: instruction.y,
                    });
                }
            }
            else {
                curve = (0, bezier_1.makeCubic)({
                    startX: cur[0],
                    startY: cur[1],
                    cp1x: cur[0],
                    cp1y: cur[1],
                    cp2x: instruction.cpx,
                    cp2y: instruction.cpy,
                    x: instruction.x,
                    y: instruction.y,
                });
            }
            if (curve) {
                totalLength += curve.getTotalLength();
                cur = [instruction.x, instruction.y];
                functions.push(curve);
            }
        }
        if (instruction.type === 's') {
            const prev = instructions[i - 1];
            const prevWasCurve = prev.type === 'C' ||
                prev.type === 'c' ||
                prev.type === 'S' ||
                prev.type === 's';
            if (i > 0 && prevWasCurve) {
                if (curve) {
                    const c = curve.getC();
                    const d = curve.getD();
                    curve = (0, bezier_1.makeCubic)({
                        startX: cur[0],
                        startY: cur[1],
                        cp1x: cur[0] + d.x - c.x,
                        cp1y: cur[1] + d.y - c.y,
                        cp2x: cur[0] + instruction.cpdx,
                        cp2y: cur[1] + instruction.cpdy,
                        x: cur[0] + instruction.dx,
                        y: cur[1] + instruction.dy,
                    });
                }
            }
            else {
                curve = (0, bezier_1.makeCubic)({
                    startX: cur[0],
                    startY: cur[1],
                    cp1x: cur[0],
                    cp1y: cur[1],
                    cp2x: cur[0] + instruction.cpdx,
                    cp2y: cur[1] + instruction.cpdy,
                    x: cur[0] + instruction.dx,
                    y: cur[1] + instruction.dy,
                });
            }
            if (curve) {
                totalLength += curve.getTotalLength();
                cur = [instruction.dx + cur[0], instruction.dy + cur[1]];
                functions.push(curve);
            }
        }
        // Quadratic Bezier curves
        if (instruction.type === 'Q') {
            if (cur[0] === instruction.cpx && cur[1] === instruction.cpy) {
                const linearCurve = (0, linear_1.makeLinearPosition)({
                    x0: instruction.cpx,
                    x1: instruction.x,
                    y0: instruction.cpy,
                    y1: instruction.y,
                });
                totalLength += linearCurve.getTotalLength();
                functions.push(linearCurve);
            }
            else {
                curve = (0, bezier_1.makeQuadratic)({
                    startX: cur[0],
                    startY: cur[1],
                    cpx: instruction.cpx,
                    cpy: instruction.cpy,
                    x: instruction.x,
                    y: instruction.y,
                });
                totalLength += curve.getTotalLength();
                functions.push(curve);
            }
            cur = [instruction.x, instruction.y];
            prev_point = [instruction.cpx, instruction.cpy];
        }
        if (instruction.type === 'q') {
            if (instruction.cpdx === 0 && instruction.cpdy === 0) {
                const linearCurve = (0, linear_1.makeLinearPosition)({
                    x0: cur[0] + instruction.cpdx,
                    x1: cur[0] + instruction.cpdy,
                    y0: cur[1] + instruction.dx,
                    y1: cur[1] + instruction.dy,
                });
                totalLength += linearCurve.getTotalLength();
                functions.push(linearCurve);
            }
            else {
                curve = (0, bezier_1.makeQuadratic)({
                    startX: cur[0],
                    startY: cur[1],
                    cpx: cur[0] + instruction.cpdx,
                    cpy: cur[1] + instruction.cpdy,
                    x: cur[0] + instruction.dx,
                    y: cur[1] + instruction.dy,
                });
                totalLength += curve.getTotalLength();
                functions.push(curve);
            }
            prev_point = [cur[0] + instruction.cpdx, cur[1] + instruction.cpdy];
            cur = [instruction.dx + cur[0], instruction.dy + cur[1]];
        }
        if (instruction.type === 'T') {
            const prev = instructions[i - 1];
            const prevWasQ = prev.type === 'Q' ||
                prev.type === 'q' ||
                prev.type === 'T' ||
                prev.type === 't';
            if (i > 0 && prevWasQ) {
                curve = (0, bezier_1.makeQuadratic)({
                    startX: cur[0],
                    startY: cur[1],
                    cpx: 2 * cur[0] - prev_point[0],
                    cpy: 2 * cur[1] - prev_point[1],
                    x: instruction.x,
                    y: instruction.y,
                });
                functions.push(curve);
                totalLength += curve.getTotalLength();
            }
            else {
                const linearCurve = (0, linear_1.makeLinearPosition)({
                    x0: cur[0],
                    x1: instruction.x,
                    y0: cur[1],
                    y1: instruction.y,
                });
                functions.push(linearCurve);
                totalLength += linearCurve.getTotalLength();
            }
            prev_point = [2 * cur[0] - prev_point[0], 2 * cur[1] - prev_point[1]];
            cur = [instruction.x, instruction.y];
        }
        if (instruction.type === 't') {
            const prev = instructions[i - 1];
            const prevWasQ = prev.type === 'Q' ||
                prev.type === 'q' ||
                prev.type === 'T' ||
                prev.type === 't';
            if (i > 0 && prevWasQ) {
                curve = (0, bezier_1.makeQuadratic)({
                    startX: cur[0],
                    startY: cur[1],
                    cpx: 2 * cur[0] - prev_point[0],
                    cpy: 2 * cur[1] - prev_point[1],
                    x: cur[0] + instruction.dx,
                    y: cur[1] + instruction.dy,
                });
                totalLength += curve.getTotalLength();
                functions.push(curve);
            }
            else {
                const linearCurve = (0, linear_1.makeLinearPosition)({
                    x0: cur[0],
                    x1: cur[0] + instruction.dx,
                    y0: cur[1],
                    y1: cur[1] + instruction.dy,
                });
                totalLength += linearCurve.getTotalLength();
                functions.push(linearCurve);
            }
            prev_point = [2 * cur[0] - prev_point[0], 2 * cur[1] - prev_point[1]];
            cur = [instruction.dx + cur[0], instruction.dy + cur[1]];
        }
        if (instruction.type === 'A') {
            const arcCurve = (0, arc_1.makeArc)({
                x0: cur[0],
                y0: cur[1],
                rx: instruction.rx,
                ry: instruction.ry,
                xAxisRotate: instruction.xAxisRotation,
                LargeArcFlag: instruction.largeArcFlag,
                SweepFlag: instruction.sweepFlag,
                x1: instruction.x,
                y1: instruction.y,
            });
            totalLength += arcCurve.getTotalLength();
            cur = [instruction.x, instruction.y];
            functions.push(arcCurve);
        }
        if (instruction.type === 'a') {
            const arcCurve = (0, arc_1.makeArc)({
                x0: cur[0],
                y0: cur[1],
                rx: instruction.rx,
                ry: instruction.ry,
                xAxisRotate: instruction.xAxisRotation,
                LargeArcFlag: instruction.largeArcFlag,
                SweepFlag: instruction.sweepFlag,
                x1: cur[0] + instruction.dx,
                y1: cur[1] + instruction.dy,
            });
            totalLength += arcCurve.getTotalLength();
            cur = [cur[0] + instruction.dx, cur[1] + instruction.dy];
            functions.push(arcCurve);
        }
        partialLengths.push(totalLength);
    }
    return {
        segments,
        initialPoint,
        totalLength,
        partialLengths,
        functions,
    };
};
exports.constructFromInstructions = constructFromInstructions;
const construct = (string) => {
    const parsed = (0, parse_path_1.parsePath)(string);
    return (0, exports.constructFromInstructions)(parsed);
};
exports.construct = construct;


/***/ }),

/***/ 36388:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.iterateOverSegments = void 0;
const iterateOverSegments = ({ segments, iterate, }) => {
    let x = 0;
    let y = 0;
    let initialX = 0;
    let initialY = 0;
    let cpX = null;
    let cpY = null;
    const newSegments = segments.map((s, i) => {
        var _a;
        const newSeg = iterate({
            segment: s,
            x,
            y,
            prevSegment: (_a = segments[i - 1]) !== null && _a !== void 0 ? _a : null,
            initialX,
            initialY,
            cpX,
            cpY,
        });
        switch (s.type) {
            case 'M':
                initialX = s.x;
                initialY = s.y;
                x = s.x;
                y = s.y;
                cpX = null;
                cpY = null;
                break;
            case 'Q':
                x = s.x;
                y = s.y;
                cpX = s.cpx;
                cpY = s.cpy;
                break;
            case 'A':
                x = s.x;
                y = s.y;
                cpX = null;
                cpY = null;
                break;
            case 'C':
                x = s.x;
                y = s.y;
                cpX = s.cp2x;
                cpY = s.cp2y;
                break;
            case 'S':
                x = s.x;
                y = s.y;
                cpX = s.cpx;
                cpY = s.cpy;
                break;
            case 'T':
                // Order of if statement is important here
                if (cpX !== null && cpY !== null) {
                    cpX = x - (cpX - x);
                    cpY = y - (cpY - y);
                }
                x = s.x;
                y = s.y;
                break;
            case 'L':
                x = s.x;
                y = s.y;
                cpX = null;
                cpY = null;
                break;
            case 'V':
                y = s.y;
                cpX = null;
                cpY = null;
                break;
            case 'H':
                x = s.x;
                cpX = null;
                cpY = null;
                break;
            case 'Z':
                x = initialX;
                y = initialY;
                cpX = null;
                cpY = null;
                break;
            default:
                // @ts-expect-error
                throw new Error(`Unexpected instruction ${s.type}`);
        }
        return newSeg;
    });
    return newSegments.flat(1);
};
exports.iterateOverSegments = iterateOverSegments;


/***/ }),

/***/ 33238:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.makeLinearPosition = void 0;
const makeLinearPosition = ({ x0, x1, y0, y1, }) => {
    return {
        getTotalLength: () => {
            return Math.sqrt((x0 - x1) ** 2 + (y0 - y1) ** 2);
        },
        getPointAtLength: (pos) => {
            let fraction = pos / Math.sqrt((x0 - x1) ** 2 + (y0 - y1) ** 2);
            fraction = Number.isNaN(fraction) ? 1 : fraction;
            const newDeltaX = (x1 - x0) * fraction;
            const newDeltaY = (y1 - y0) * fraction;
            return { x: x0 + newDeltaX, y: y0 + newDeltaY };
        },
        getTangentAtLength: () => {
            const module = Math.sqrt((x1 - x0) * (x1 - x0) + (y1 - y0) * (y1 - y0));
            return { x: (x1 - x0) / module, y: (y1 - y0) / module };
        },
        type: 'linear',
    };
};
exports.makeLinearPosition = makeLinearPosition;


/***/ }),

/***/ 25525:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.removeATSHVInstructions = void 0;
const iterate_1 = __webpack_require__(36388);
const TAU = Math.PI * 2;
function approximate_unit_arc(theta1, delta_theta) {
    const alpha = (4 / 3) * Math.tan(delta_theta / 4);
    const x1 = Math.cos(theta1);
    const y1 = Math.sin(theta1);
    const x2 = Math.cos(theta1 + delta_theta);
    const y2 = Math.sin(theta1 + delta_theta);
    return [
        x1,
        y1,
        x1 - y1 * alpha,
        y1 + x1 * alpha,
        x2 + y2 * alpha,
        y2 - x2 * alpha,
        x2,
        y2,
    ];
}
function unit_vector_angle(ux, uy, vx, vy) {
    const sign = ux * vy - uy * vx < 0 ? -1 : 1;
    let dot = ux * vx + uy * vy;
    // Add this to work with arbitrary vectors:
    // dot /= Math.sqrt(ux * ux + uy * uy) * Math.sqrt(vx * vx + vy * vy);
    // rounding errors, e.g. -1.0000000000000002 can screw up this
    if (dot > 1.0) {
        dot = 1.0;
    }
    if (dot < -1.0) {
        dot = -1.0;
    }
    return sign * Math.acos(dot);
}
function get_arc_center({ x1, y1, x2, y2, largeArcFlag, sweepFlag, rx, ry, sin_phi, cos_phi, }) {
    // Step 1.
    //
    // Moving an ellipse so origin will be the middlepoint between our two
    // points. After that, rotate it to line up ellipse axes with coordinate
    // axes.
    //
    const x1p = (cos_phi * (x1 - x2)) / 2 + (sin_phi * (y1 - y2)) / 2;
    const y1p = (-sin_phi * (x1 - x2)) / 2 + (cos_phi * (y1 - y2)) / 2;
    const rx_sq = rx * rx;
    const ry_sq = ry * ry;
    const x1p_sq = x1p * x1p;
    const y1p_sq = y1p * y1p;
    // Step 2.
    //
    // Compute coordinates of the centre of this ellipse (cx', cy')
    // in the new coordinate system.
    //
    let radicant = rx_sq * ry_sq - rx_sq * y1p_sq - ry_sq * x1p_sq;
    if (radicant < 0) {
        // due to rounding errors it might be e.g. -1.3877787807814457e-17
        radicant = 0;
    }
    radicant /= rx_sq * y1p_sq + ry_sq * x1p_sq;
    radicant = Math.sqrt(radicant) * (largeArcFlag === sweepFlag ? -1 : 1);
    const cxp = ((radicant * rx) / ry) * y1p;
    const cyp = ((radicant * -ry) / rx) * x1p;
    // Step 3.
    //
    // Transform back to get centre coordinates (cx, cy) in the original
    // coordinate system.
    //
    const cx = cos_phi * cxp - sin_phi * cyp + (x1 + x2) / 2;
    const cy = sin_phi * cxp + cos_phi * cyp + (y1 + y2) / 2;
    // Step 4.
    //
    // Compute angles (theta1, delta_theta).
    //
    const v1x = (x1p - cxp) / rx;
    const v1y = (y1p - cyp) / ry;
    const v2x = (-x1p - cxp) / rx;
    const v2y = (-y1p - cyp) / ry;
    const theta1 = unit_vector_angle(1, 0, v1x, v1y);
    let delta_theta = unit_vector_angle(v1x, v1y, v2x, v2y);
    if (sweepFlag === false && delta_theta > 0) {
        delta_theta -= TAU;
    }
    if (sweepFlag === true && delta_theta < 0) {
        delta_theta += TAU;
    }
    return [cx, cy, theta1, delta_theta];
}
function arcToCircle({ x1, y1, x2, y2, largeArcFlag, sweepFlag, rx, ry, phi, }) {
    const sin_phi = Math.sin((phi * TAU) / 360);
    const cos_phi = Math.cos((phi * TAU) / 360);
    // Make sure radii are valid
    //
    const x1p = (cos_phi * (x1 - x2)) / 2 + (sin_phi * (y1 - y2)) / 2;
    const y1p = (-sin_phi * (x1 - x2)) / 2 + (cos_phi * (y1 - y2)) / 2;
    if (x1p === 0 && y1p === 0) {
        // we're asked to draw line to itself
        return [];
    }
    if (rx === 0 || ry === 0) {
        // one of the radii is zero
        return [];
    }
    // Compensate out-of-range radii
    //
    rx = Math.abs(rx);
    ry = Math.abs(ry);
    const lambda = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry);
    if (lambda > 1) {
        rx *= Math.sqrt(lambda);
        ry *= Math.sqrt(lambda);
    }
    // Get center parameters (cx, cy, theta1, delta_theta)
    //
    const cc = get_arc_center({
        x1,
        y1,
        x2,
        y2,
        largeArcFlag,
        sweepFlag,
        rx,
        ry,
        sin_phi,
        cos_phi,
    });
    const result = [];
    let theta1 = cc[2];
    let delta_theta = cc[3];
    // Split an arc to multiple segments, so each segment
    // will be less than τ/4 (= 90°)
    //
    const segments = Math.max(Math.ceil(Math.abs(delta_theta) / (TAU / 4)), 1);
    delta_theta /= segments;
    for (let i = 0; i < segments; i++) {
        result.push(approximate_unit_arc(theta1, delta_theta));
        theta1 += delta_theta;
    }
    // We have a bezier approximation of a unit circle,
    // now need to transform back to the original ellipse
    //
    return result.map((curve) => {
        for (let i = 0; i < curve.length; i += 2) {
            let x = curve[i + 0];
            let y = curve[i + 1];
            // scale
            x *= rx;
            y *= ry;
            // rotate
            const xp = cos_phi * x - sin_phi * y;
            const yp = sin_phi * x + cos_phi * y;
            // translate
            curve[i + 0] = xp + cc[0];
            curve[i + 1] = yp + cc[1];
        }
        return curve;
    });
}
// Requires path to be normalized
const removeATSHVInstructions = (segments) => {
    return (0, iterate_1.iterateOverSegments)({
        segments,
        iterate: ({ segment, prevSegment, x, y, cpX, cpY }) => {
            if (segment.type === 'H') {
                return [{ type: 'L', x: segment.x, y }];
            }
            if (segment.type === 'V') {
                return [{ type: 'L', x, y: segment.y }];
            }
            if (segment.type === 'A') {
                const nextX = segment.x;
                const nextY = segment.y;
                const new_segments = arcToCircle({
                    x1: x,
                    y1: y,
                    x2: nextX,
                    y2: nextY,
                    largeArcFlag: segment.largeArcFlag,
                    sweepFlag: segment.sweepFlag,
                    rx: segment.rx,
                    ry: segment.ry,
                    phi: segment.xAxisRotation,
                });
                // Degenerated arcs can be ignored by renderer, but should not be dropped
                // to avoid collisions with `S A S` and so on. Replace with empty line.
                if (new_segments.length === 0) {
                    return [
                        {
                            type: 'L',
                            x: segment.x,
                            y: segment.y,
                        },
                    ];
                }
                const result = new_segments.map((_s) => {
                    return {
                        type: 'C',
                        cp1x: _s[2],
                        cp1y: _s[3],
                        cp2x: _s[4],
                        cp2y: _s[5],
                        x: _s[6],
                        y: _s[7],
                    };
                });
                return result;
            }
            if (segment.type === 'T') {
                let prevControlX = 0;
                let prevControlY = 0;
                if (prevSegment &&
                    (prevSegment.type === 'Q' || prevSegment.type === 'T')) {
                    prevControlX = cpX;
                    prevControlY = cpY;
                }
                else {
                    prevControlX = x;
                    prevControlY = y;
                }
                // New first control point is reflection of previous second control point
                const vectorX = prevControlX - x;
                const vectorY = prevControlY - y;
                const newControlX = x - vectorX;
                const newControlY = y - vectorY;
                return [
                    {
                        type: 'Q',
                        cpx: newControlX,
                        cpy: newControlY,
                        x: segment.x,
                        y: segment.y,
                    },
                ];
            }
            if (segment.type === 'S') {
                let prevControlX = 0;
                let prevControlY = 0;
                if (prevSegment && prevSegment.type === 'C') {
                    prevControlX = prevSegment.cp2x;
                    prevControlY = prevSegment.cp2y;
                }
                else if (prevSegment && prevSegment.type === 'S') {
                    prevControlX = prevSegment.cpx;
                    prevControlY = prevSegment.cpy;
                }
                else {
                    prevControlX = x;
                    prevControlY = y;
                }
                // New first control point is reflection of previous second control point
                const vectorX = prevControlX - x;
                const vectorY = prevControlY - y;
                const newControlX = x - vectorX;
                const newControlY = y - vectorY;
                return [
                    {
                        type: 'C',
                        cp1x: newControlX,
                        cp1y: newControlY,
                        cp2x: segment.cpx,
                        cp2y: segment.cpy,
                        x: segment.x,
                        y: segment.y,
                    },
                ];
            }
            return [segment];
        },
    });
};
exports.removeATSHVInstructions = removeATSHVInstructions;


/***/ }),

/***/ 75771:
/***/ ((__unused_webpack_module, exports) => {


/*

Copied and adapted from https://github.com/pbeshai/d3-interpolate-path:
Copyright 2016, Peter Beshai
All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice, this
  list of conditions and the following disclaimer.

* Redistributions in binary form must reproduce the above copyright notice,
  this list of conditions and the following disclaimer in the documentation
  and/or other materials provided with the distribution.

* Neither the name of the author nor the names of contributors may be used to
  endorse or promote products derived from this software without specific prior
  written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

*/
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.splitCurve = exports.typeMap = void 0;
/**
 * de Casteljau's algorithm for drawing and splitting bezier curves.
 * Inspired by https://pomax.github.io/bezierinfo/
 *
 * @param {Number[][]} points Array of [x,y] points: [start, control1, control2, ..., end]
 *   The original segment to split.
 * @param {Number} t Where to split the curve (value between [0, 1])
 * @return {Object} An object { left, right } where left is the segment from 0..t and
 *   right is the segment from t..1.
 */
function decasteljau(points, t) {
    const left = [];
    const right = [];
    function decasteljauRecurse(_points, _t) {
        if (_points.length === 1) {
            left.push(_points[0]);
            right.push(_points[0]);
        }
        else {
            const newPoints = Array(_points.length - 1);
            for (let i = 0; i < newPoints.length; i++) {
                if (i === 0) {
                    left.push(_points[0]);
                }
                if (i === newPoints.length - 1) {
                    right.push(_points[i + 1]);
                }
                newPoints[i] = [
                    (1 - _t) * _points[i][0] + _t * _points[i + 1][0],
                    (1 - _t) * _points[i][1] + _t * _points[i + 1][1],
                ];
            }
            decasteljauRecurse(newPoints, _t);
        }
    }
    if (points.length) {
        decasteljauRecurse(points, t);
    }
    return { left, right: right.reverse() };
}
/**
 * List of params for each command type in a path `d` attribute
 */
exports.typeMap = {
    M: ['x', 'y'],
    L: ['x', 'y'],
    H: ['x'],
    V: ['y'],
    C: ['x1', 'y1', 'x2', 'y2', 'x', 'y'],
    S: ['x2', 'y2', 'x', 'y'],
    Q: ['x1', 'y1', 'x', 'y'],
    T: ['x', 'y'],
    A: ['rx', 'ry', 'xAxisRotation', 'largeArcFlag', 'sweepFlag', 'x', 'y'],
    Z: [],
    m: ['x', 'y'],
    l: ['x', 'y'],
    h: ['x'],
    v: ['y'],
    c: ['x1', 'y1', 'x2', 'y2', 'x', 'y'],
    s: ['x2', 'y2', 'x', 'y'],
    q: ['x1', 'y1', 'x', 'y'],
    t: ['x', 'y'],
    a: ['rx', 'ry', 'xAxisRotation', 'largeArcFlag', 'sweepFlag', 'x', 'y'],
    z: [],
};
/**
 * Convert segments represented as points back into a command object
 *
 * @param {Number[][]} points Array of [x,y] points: [start, control1, control2, ..., end]
 *   Represents a segment
 * @return {Object} A command object representing the segment.
 */
function pointsToCommand(points) {
    let x2;
    let y2;
    let x1;
    let y1;
    if (points.length === 4) {
        x2 = points[2][0];
        y2 = points[2][1];
    }
    if (points.length >= 3) {
        x1 = points[1][0];
        y1 = points[1][1];
    }
    const x = points[points.length - 1][0];
    const y = points[points.length - 1][1];
    let type = 'L';
    if (points.length === 4) {
        // start, control1, control2, end
        type = 'C';
    }
    else if (points.length === 3) {
        // start, control, end
        type = 'Q';
    }
    return { x2, y2, x1, y1, x, y, type };
}
/**
 * Runs de Casteljau's algorithm enough times to produce the desired number of segments.
 *
 * @param {Number[][]} points Array of [x,y] points for de Casteljau (the initial segment to split)
 * @param {Number} segmentCount Number of segments to split the original into
 * @return {Number[][][]} Array of segments
 */
function splitCurveAsPoints(points, segmentCount) {
    segmentCount = segmentCount || 2;
    const segments = [];
    let remainingCurve = points;
    const tIncrement = 1 / segmentCount;
    // x-----x-----x-----x
    // t=  0.33   0.66   1
    // x-----o-----------x
    // r=  0.33
    //       x-----o-----x
    // r=         0.5  (0.33 / (1 - 0.33))  === tIncrement / (1 - (tIncrement * (i - 1))
    // x-----x-----x-----x----x
    // t=  0.25   0.5   0.75  1
    // x-----o----------------x
    // r=  0.25
    //       x-----o----------x
    // r=         0.33  (0.25 / (1 - 0.25))
    //             x-----o----x
    // r=         0.5  (0.25 / (1 - 0.5))
    for (let i = 0; i < segmentCount - 1; i++) {
        const tRelative = tIncrement / (1 - tIncrement * i);
        const split = decasteljau(remainingCurve, tRelative);
        segments.push(split.left);
        remainingCurve = split.right;
    }
    // last segment is just to the end from the last point
    segments.push(remainingCurve);
    return segments;
}
/**
 * Convert command objects to arrays of points, run de Casteljau's algorithm on it
 * to split into to the desired number of segments.
 *
 * @param {Object} commandStart The start command object
 * @param {Object} commandEnd The end command object
 * @param {Number} segmentCount The number of segments to create
 * @return {Object[]} An array of commands representing the segments in sequence
 */
const splitCurve = (commandStart, commandEnd, segmentCount) => {
    const points = [[commandStart.x, commandStart.y]];
    if (commandEnd.x1 !== null && commandEnd.x1 !== undefined) {
        points.push([commandEnd.x1, commandEnd.y1]);
    }
    if (commandEnd.x2 !== null && commandEnd.x2 !== undefined) {
        points.push([commandEnd.x2, commandEnd.y2]);
    }
    points.push([commandEnd.x, commandEnd.y]);
    return splitCurveAsPoints(points, segmentCount).map(pointsToCommand);
};
exports.splitCurve = splitCurve;


/***/ }),

/***/ 96633:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

var __webpack_unused_export__;

__webpack_unused_export__ = ({ value: true });
__webpack_unused_export__ = __webpack_unused_export__ = __webpack_unused_export__ = __webpack_unused_export__ = __webpack_unused_export__ = __webpack_unused_export__ = __webpack_unused_export__ = __webpack_unused_export__ = __webpack_unused_export__ = __webpack_unused_export__ = __webpack_unused_export__ = __webpack_unused_export__ = __webpack_unused_export__ = __webpack_unused_export__ = __webpack_unused_export__ = __webpack_unused_export__ = __webpack_unused_export__ = exports.JC = void 0;
var evolve_path_1 = __webpack_require__(53175);
Object.defineProperty(exports, "JC", ({ enumerable: true, get: function () { return evolve_path_1.evolvePath; } }));
var extend_viewbox_1 = __webpack_require__(12430);
__webpack_unused_export__ = ({ enumerable: true, get: function () { return extend_viewbox_1.extendViewBox; } });
var get_bounding_box_1 = __webpack_require__(70902);
__webpack_unused_export__ = ({ enumerable: true, get: function () { return get_bounding_box_1.getBoundingBox; } });
var get_instruction_index_at_length_1 = __webpack_require__(94517);
__webpack_unused_export__ = ({ enumerable: true, get: function () { return get_instruction_index_at_length_1.getInstructionIndexAtLength; } });
var get_length_1 = __webpack_require__(26500);
__webpack_unused_export__ = ({ enumerable: true, get: function () { return get_length_1.getLength; } });
var get_point_at_length_1 = __webpack_require__(81119);
__webpack_unused_export__ = ({ enumerable: true, get: function () { return get_point_at_length_1.getPointAtLength; } });
var get_subpaths_1 = __webpack_require__(17778);
__webpack_unused_export__ = ({ enumerable: true, get: function () { return get_subpaths_1.getSubpaths; } });
var get_tangent_at_length_1 = __webpack_require__(76150);
__webpack_unused_export__ = ({ enumerable: true, get: function () { return get_tangent_at_length_1.getTangentAtLength; } });
var interpolate_path_1 = __webpack_require__(12028);
__webpack_unused_export__ = ({ enumerable: true, get: function () { return interpolate_path_1.interpolatePath; } });
var normalize_path_1 = __webpack_require__(83262);
__webpack_unused_export__ = ({ enumerable: true, get: function () { return normalize_path_1.normalizePath; } });
var parse_path_1 = __webpack_require__(92339);
__webpack_unused_export__ = ({ enumerable: true, get: function () { return parse_path_1.parsePath; } });
var reduce_instructions_1 = __webpack_require__(5111);
__webpack_unused_export__ = ({ enumerable: true, get: function () { return reduce_instructions_1.reduceInstructions; } });
var reset_path_1 = __webpack_require__(61574);
__webpack_unused_export__ = ({ enumerable: true, get: function () { return reset_path_1.resetPath; } });
var reverse_path_1 = __webpack_require__(34258);
__webpack_unused_export__ = ({ enumerable: true, get: function () { return reverse_path_1.reversePath; } });
var scale_path_1 = __webpack_require__(93724);
__webpack_unused_export__ = ({ enumerable: true, get: function () { return scale_path_1.scalePath; } });
var serialize_instructions_1 = __webpack_require__(9075);
__webpack_unused_export__ = ({ enumerable: true, get: function () { return serialize_instructions_1.serializeInstructions; } });
var translate_path_1 = __webpack_require__(18301);
__webpack_unused_export__ = ({ enumerable: true, get: function () { return translate_path_1.translatePath; } });
var warp_path_1 = __webpack_require__(78947);
__webpack_unused_export__ = ({ enumerable: true, get: function () { return warp_path_1.warpPath; } });


/***/ }),

/***/ 12028:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


/*

Copied and adapted from https://github.com/pbeshai/d3-interpolate-path:
Copyright 2016, Peter Beshai
All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice, this
  list of conditions and the following disclaimer.

* Redistributions in binary form must reproduce the above copyright notice,
  this list of conditions and the following disclaimer in the documentation
  and/or other materials provided with the distribution.

* Neither the name of the author nor the names of contributors may be used to
  endorse or promote products derived from this software without specific prior
  written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

*/
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.interpolatePath = void 0;
const split_curve_1 = __webpack_require__(75771);
const commandTokenRegex = /[MLCSTQAHVZmlcstqahv]|-?[\d.e+-]+/g;
function arrayOfLength(length, value) {
    const array = Array(length);
    for (let i = 0; i < length; i++) {
        array[i] = value;
    }
    return array;
}
/**
 * Converts a command object to a string to be used in a `d` attribute
 * @param {Object} command A command object
 * @return {String} The string for the `d` attribute
 */
function commandToString(command) {
    return `${command.type} ${split_curve_1.typeMap[command.type]
        .map((p) => command[p])
        .join(' ')}`;
}
/**
 * Converts command A to have the same type as command B.
 *
 * e.g., L0,5 -> C0,5,0,5,0,5
 *
 * Uses these rules:
 * x1 <- x
 * x2 <- x
 * y1 <- y
 * y2 <- y
 * rx <- 0
 * ry <- 0
 * xAxisRotation <- read from B
 * largeArcFlag <- read from B
 * sweepflag <- read from B
 *
 * @param {Object} aCommand Command object from path `d` attribute
 * @param {Object} bCommand Command object from path `d` attribute to match against
 * @return {Object} aCommand converted to type of bCommand
 */
function convertToSameType(aCommand, bCommand) {
    const conversionMap = {
        x1: 'x',
        y1: 'y',
        x2: 'x',
        y2: 'y',
    };
    const readFromBKeys = ['xAxisRotation', 'largeArcFlag', 'sweepFlag'];
    // convert (but ignore M types)
    if (aCommand.type !== bCommand.type && bCommand.type.toUpperCase() !== 'M') {
        const aConverted = {
            type: bCommand.type,
        };
        Object.keys(bCommand).forEach((bKey) => {
            const bValue = bCommand[bKey];
            // first read from the A command
            let aValue = aCommand[bKey];
            // if it is one of these values, read from B no matter what
            if (aValue === undefined) {
                if (readFromBKeys.includes(bKey)) {
                    aValue = bValue;
                }
                else {
                    // if it wasn't in the A command, see if an equivalent was
                    if (aValue === undefined &&
                        conversionMap[bKey]) {
                        aValue =
                            aCommand[conversionMap[bKey]];
                    }
                    // if it doesn't have a converted value, use 0
                    if (aValue === undefined) {
                        aValue = 0;
                    }
                }
            }
            // @ts-expect-error
            aConverted[bKey] = aValue;
        });
        // update the type to match B
        aConverted.type = bCommand.type;
        aCommand = aConverted;
    }
    return aCommand;
}
/**
 * Interpolate between command objects commandStart and commandEnd segmentCount times.
 * If the types are L, Q, or C then the curves are split as per de Casteljau's algorithm.
 * Otherwise we just copy commandStart segmentCount - 1 times, finally ending with commandEnd.
 *
 * @param {Object} commandStart Command object at the beginning of the segment
 * @param {Object} commandEnd Command object at the end of the segment
 * @param {Number} segmentCount The number of segments to split this into. If only 1
 *   Then [commandEnd] is returned.
 * @return {Object[]} Array of ~segmentCount command objects between commandStart and
 *   commandEnd. (Can be segmentCount+1 objects if commandStart is type M).
 */
function splitSegment(commandStart, commandEnd, segmentCount) {
    let segments = [];
    // line, quadratic bezier, or cubic bezier
    if (commandEnd.type === 'L' ||
        commandEnd.type === 'Q' ||
        commandEnd.type === 'C') {
        segments = segments.concat((0, split_curve_1.splitCurve)(commandStart, commandEnd, segmentCount));
        // general case - just copy the same point
    }
    else {
        const copyCommand = { ...commandStart };
        // convert M to L
        if (copyCommand.type === 'M') {
            copyCommand.type = 'L';
        }
        segments = segments.concat(arrayOfLength(segmentCount - 1, undefined).map(() => copyCommand));
        segments.push(commandEnd);
    }
    return segments;
}
/**
 * Extends an array of commandsToExtend to the length of the referenceCommands by
 * splitting segments until the number of commands match. Ensures all the actual
 * points of commandsToExtend are in the extended array.
 *
 * @param {Object[]} commandsToExtend The command object array to extend
 * @param {Object[]} referenceCommands The command object array to match in length
 * @return {Object[]} The extended commandsToExtend array
 */
function extend(commandsToExtend, referenceCommands) {
    // compute insertion points:
    // number of segments in the path to extend
    const numSegmentsToExtend = commandsToExtend.length - 1;
    // number of segments in the reference path.
    const numReferenceSegments = referenceCommands.length - 1;
    // this value is always between [0, 1].
    const segmentRatio = numSegmentsToExtend / numReferenceSegments;
    // create a map, mapping segments in referenceCommands to how many points
    // should be added in that segment (should always be >= 1 since we need each
    // point itself).
    // 0 = segment 0-1, 1 = segment 1-2, n-1 = last vertex
    const countPointsPerSegment = arrayOfLength(numReferenceSegments, undefined).reduce((accum, _d, i) => {
        const insertIndex = Math.floor(segmentRatio * i);
        accum[insertIndex] = (accum[insertIndex] || 0) + 1;
        return accum;
    }, []);
    // extend each segment to have the correct number of points for a smooth interpolation
    const extended = countPointsPerSegment.reduce((_extended, segmentCount, i) => {
        // if last command, just add `segmentCount` number of times
        if (i === commandsToExtend.length - 1) {
            const lastCommandCopies = arrayOfLength(segmentCount, {
                ...commandsToExtend[commandsToExtend.length - 1],
            });
            // convert M to L
            if (lastCommandCopies[0].type === 'M') {
                lastCommandCopies.forEach((d) => {
                    d.type = 'L';
                });
            }
            return _extended.concat(lastCommandCopies);
        }
        // otherwise, split the segment segmentCount times.
        return _extended.concat(splitSegment(commandsToExtend[i], commandsToExtend[i + 1], segmentCount));
    }, []);
    // add in the very first point since splitSegment only adds in the ones after it
    extended.unshift(commandsToExtend[0]);
    return extended;
}
/**
 * Takes a path `d` string and converts it into an array of command
 * objects. Drops the `Z` character.
 *
 * @param {String|null} d A path `d` string
 */
function pathCommandsFromString(d) {
    // split into valid tokens
    const tokens = (d || '').match(commandTokenRegex) || [];
    const commands = [];
    let commandArgs;
    let command;
    // iterate over each token, checking if we are at a new command
    // by presence in the typeMap
    for (let i = 0; i < tokens.length; ++i) {
        commandArgs = split_curve_1.typeMap[tokens[i]];
        // new command found:
        if (commandArgs) {
            command = {
                type: tokens[i],
            };
            // add each of the expected args for this command:
            for (let a = 0; a < commandArgs.length; ++a) {
                // @ts-expect-error
                command[commandArgs[a]] = Number(tokens[i + a + 1]);
            }
            // need to increment our token index appropriately since
            // we consumed token args
            i += commandArgs.length;
            commands.push(command);
        }
    }
    return commands;
}
/**
 * Interpolate from A to B by extending A and B during interpolation to have
 * the same number of points. This allows for a smooth transition when they
 * have a different number of points.
 *
 * Ignores the `Z` command in paths unless both A and B end with it.
 *
 * This function works directly with arrays of command objects instead of with
 * path `d` strings (see interpolatePath for working with `d` strings).
 *
 * @param {Object[]} aCommandsInput Array of path commands
 * @param {Object[]} bCommandsInput Array of path commands
 * @returns {Function} Interpolation function that maps t ([0, 1]) to an array of path commands.
 */
function interpolatePathCommands(aCommandsInput, bCommandsInput) {
    // make a copy so we don't mess with the input arrays
    let aCommands = aCommandsInput === null || aCommandsInput === undefined
        ? []
        : aCommandsInput.slice();
    let bCommands = bCommandsInput === null || bCommandsInput === undefined
        ? []
        : bCommandsInput.slice();
    // both input sets are empty, so we don't interpolate
    if (!aCommands.length && !bCommands.length) {
        return function () {
            return [];
        };
    }
    // do we add Z during interpolation? yes if both have it. (we'd expect both to have it or not)
    const addZ = (aCommands.length === 0 || aCommands[aCommands.length - 1].type === 'Z') &&
        (bCommands.length === 0 || bCommands[bCommands.length - 1].type === 'Z');
    // we temporarily remove Z
    if (aCommands.length > 0 && aCommands[aCommands.length - 1].type === 'Z') {
        aCommands.pop();
    }
    if (bCommands.length > 0 && bCommands[bCommands.length - 1].type === 'Z') {
        bCommands.pop();
    }
    // if A is empty, treat it as if it used to contain just the first point
    // of B. This makes it so the line extends out of from that first point.
    if (!aCommands.length) {
        aCommands.push(bCommands[0]);
        // otherwise if B is empty, treat it as if it contains the first point
        // of A. This makes it so the line retracts into the first point.
    }
    else if (!bCommands.length) {
        bCommands.push(aCommands[0]);
    }
    // extend to match equal size
    const numPointsToExtend = Math.abs(bCommands.length - aCommands.length);
    if (numPointsToExtend !== 0) {
        // B has more points than A, so add points to A before interpolating
        if (bCommands.length > aCommands.length) {
            aCommands = extend(aCommands, bCommands);
            // else if A has more points than B, add more points to B
        }
        else if (bCommands.length < aCommands.length) {
            bCommands = extend(bCommands, aCommands);
        }
    }
    // commands have same length now.
    // convert commands in A to the same type as those in B
    aCommands = aCommands.map((aCommand, i) => convertToSameType(aCommand, bCommands[i]));
    // create mutable interpolated command objects
    const interpolatedCommands = aCommands.map((aCommand) => ({ ...aCommand }));
    if (addZ) {
        interpolatedCommands.push({ type: 'Z' });
        aCommands.push({ type: 'Z' }); // required for when returning at t == 0
    }
    return function (t) {
        // at 1 return the final value without the extensions used during interpolation
        if (t === 1) {
            return bCommandsInput === null || bCommandsInput === undefined
                ? []
                : bCommandsInput;
        }
        // work with aCommands directly since interpolatedCommands are mutated
        if (t === 0) {
            return aCommands;
        }
        // interpolate the commands using the mutable interpolated command objs
        for (let i = 0; i < interpolatedCommands.length; ++i) {
            // if (interpolatedCommands[i].type === 'Z') continue;
            const aCommand = aCommands[i];
            const bCommand = bCommands[i];
            const interpolatedCommand = interpolatedCommands[i];
            for (const arg of split_curve_1.typeMap[interpolatedCommand.type]) {
                // @ts-expect-error
                interpolatedCommand[arg] =
                    (1 - t) * aCommand[arg] +
                        t * bCommand[arg];
                // do not use floats for flags (#27), round to integer
                if (arg === 'largeArcFlag' || arg === 'sweepFlag') {
                    // @ts-expect-error
                    interpolatedCommand[arg] = Math.round(interpolatedCommand[arg]);
                }
            }
        }
        return interpolatedCommands;
    };
}
/**
 * @description Interpolates between two SVG paths.
 * @param {number} value A number - 0 means first path, 1 means second path, any other values will be interpolated
 * @param {string} firstPath The first valid SVG path
 * @param {string} secondPath The second valid SVG path
 * @see [Documentation](https://remotion.dev/docs/paths/interpolate-path)
 */
const interpolatePath = (value, firstPath, secondPath) => {
    // at 1 return the final value without the extensions used during interpolation
    if (value === 1) {
        return secondPath;
    }
    if (value === 0) {
        return firstPath;
    }
    const aCommands = pathCommandsFromString(firstPath);
    if (aCommands.length === 0) {
        throw new TypeError(`SVG Path "${firstPath}" is not valid`);
    }
    const bCommands = pathCommandsFromString(secondPath);
    if (bCommands.length === 0) {
        throw new TypeError(`SVG Path "${secondPath}" is not valid`);
    }
    const commandInterpolator = interpolatePathCommands(aCommands, bCommands);
    const interpolatedCommands = commandInterpolator(value);
    // convert to a string (fastest concat: https://jsperf.com/join-concat/150)
    return interpolatedCommands
        .map((c) => {
        return commandToString(c);
    })
        .join(' ');
};
exports.interpolatePath = interpolatePath;


/***/ }),

/***/ 83262:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.normalizePath = exports.normalizeInstructions = void 0;
const parse_path_1 = __webpack_require__(92339);
const serialize_instructions_1 = __webpack_require__(9075);
const normalizeInstructions = (instructions) => {
    // Extended properties must already be normalized
    const normalized = [];
    let x = 0;
    let y = 0;
    let moveX = 0;
    let moveY = 0;
    for (let i = 0; i < instructions.length; i++) {
        const instruction = instructions[i];
        if (instruction.type === 'M') {
            moveX = instruction.x;
            moveY = instruction.y;
        }
        else if (instruction.type === 'm') {
            moveX += instruction.dx;
            moveY += instruction.dy;
        }
        if (instruction.type === 'A' ||
            instruction.type === 'C' ||
            instruction.type === 'L' ||
            instruction.type === 'M' ||
            instruction.type === 'Q' ||
            instruction.type === 'S' ||
            instruction.type === 'T') {
            normalized.push(instruction);
            x = instruction.x;
            y = instruction.y;
            continue;
        }
        if (instruction.type === 'a' ||
            instruction.type === 'c' ||
            instruction.type === 'l' ||
            instruction.type === 'm' ||
            instruction.type === 'q' ||
            instruction.type === 's' ||
            instruction.type === 't') {
            const currentX = x;
            const currentY = y;
            x += instruction.dx;
            y += instruction.dy;
            if (instruction.type === 'a') {
                normalized.push({
                    type: 'A',
                    largeArcFlag: instruction.largeArcFlag,
                    rx: instruction.rx,
                    ry: instruction.ry,
                    sweepFlag: instruction.sweepFlag,
                    xAxisRotation: instruction.xAxisRotation,
                    x,
                    y,
                });
                continue;
            }
            if (instruction.type === 'c') {
                normalized.push({
                    type: 'C',
                    cp1x: instruction.cp1dx + currentX,
                    cp1y: instruction.cp1dy + currentY,
                    cp2x: instruction.cp2dx + currentX,
                    cp2y: instruction.cp2dy + currentY,
                    x,
                    y,
                });
                continue;
            }
            if (instruction.type === 'l') {
                normalized.push({
                    type: 'L',
                    x,
                    y,
                });
                continue;
            }
            if (instruction.type === 'm') {
                normalized.push({
                    type: 'M',
                    x,
                    y,
                });
                continue;
            }
            if (instruction.type === 'q') {
                normalized.push({
                    type: 'Q',
                    cpx: instruction.cpdx + currentX,
                    cpy: instruction.cpdy + currentY,
                    x,
                    y,
                });
                continue;
            }
            if (instruction.type === 's') {
                normalized.push({
                    type: 'S',
                    cpx: instruction.cpdx + currentX,
                    cpy: instruction.cpdy + currentY,
                    x,
                    y,
                });
                continue;
            }
            if (instruction.type === 't') {
                normalized.push({
                    type: 'T',
                    x,
                    y,
                });
                continue;
            }
        }
        if (instruction.type === 'H') {
            normalized.push(instruction);
            x = instruction.x;
            continue;
        }
        if (instruction.type === 'V') {
            normalized.push(instruction);
            y = instruction.y;
            continue;
        }
        if (instruction.type === 'Z') {
            normalized.push(instruction);
            x = moveX;
            y = moveY;
            continue;
        }
        if (instruction.type === 'h') {
            x += instruction.dx;
            normalized.push({
                type: 'H',
                x,
            });
            continue;
        }
        if (instruction.type === 'v') {
            y += instruction.dy;
            normalized.push({
                type: 'V',
                y,
            });
            continue;
        }
        // @ts-expect-error
        throw new Error('Unknown instruction type: ' + instruction.type);
    }
    return normalized;
};
exports.normalizeInstructions = normalizeInstructions;
/**
 * @description Removes all relative coordinates from an SVG path and converts them into absolute coordinates.
 * @param {string} path A valid SVG path
 * @see [Documentation](https://remotion.dev/docs/paths/normalize-path)
 */
const normalizePath = (path) => {
    const instructions = (0, parse_path_1.parsePath)(path);
    const normalized = (0, exports.normalizeInstructions)(instructions);
    return (0, serialize_instructions_1.serializeInstructions)(normalized);
};
exports.normalizePath = normalizePath;


/***/ }),

/***/ 92339:
/***/ ((__unused_webpack_module, exports) => {


// Copied from: https://github.com/rveciana/svg-path-properties
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.parsePath = void 0;
const length = {
    a: 7,
    A: 7,
    C: 6,
    c: 6,
    H: 1,
    h: 1,
    L: 2,
    l: 2,
    M: 2,
    m: 2,
    Q: 4,
    q: 4,
    S: 4,
    s: 4,
    T: 2,
    t: 2,
    V: 1,
    v: 1,
    Z: 0,
    z: 0,
};
const chunkExact = (array, instruction) => {
    const chunks = [];
    const expectedSize = length[instruction];
    if (array.length % expectedSize !== 0) {
        throw new Error(`Expected number of arguments of SVG instruction "${instruction} ${array.join(' ')}" to be a multiple of ${expectedSize}`);
    }
    for (let i = 0; i < array.length; i += expectedSize) {
        chunks.push(array.slice(i, i + expectedSize));
    }
    return chunks;
};
const makeInstructions = (arr, instruction, cb) => {
    return chunkExact(arr, instruction).map((args) => {
        return cb(args);
    });
};
const segmentRegExp = /([astvzqmhlc])([^astvzqmhlc]*)/gi;
const numberRegExp = /-?[0-9]*\.?[0-9]+(?:e[-+]?\d+)?/gi;
const parseValues = (args, instructionType) => {
    const numbers = args.match(numberRegExp);
    if (!numbers) {
        if (instructionType === 'Z' || instructionType === 'z') {
            return [];
        }
        throw new Error(`Malformed path data: ${instructionType} was expected to have numbers afterwards`);
    }
    const expectedArguments = length[instructionType];
    if (numbers.length % expectedArguments !== 0) {
        throw new Error(`Malformed path data: ${instructionType} was expected to have a multiple of ${expectedArguments} numbers, but got "${instructionType} ${numbers.join(' ')} instead"`);
    }
    return numbers.map(Number);
};
/**
 * @description Parses an SVG string path into an array of Instruction's.
 * @param {string} path
 * @returns an array of objects containing the Instructions
 * @see [Documentation](https://www.remotion.dev/docs/paths/parse-path)
 */
const parsePath = (path) => {
    if (!path) {
        throw new Error('No path provided');
    }
    const segments = path.match(segmentRegExp);
    if (!segments) {
        throw new Error(`No path elements found in string ${path}`);
    }
    return segments
        .map((segmentString) => {
        const command = segmentString.charAt(0);
        const args = parseValues(segmentString.substring(1), command);
        // overloaded moveTo
        if (command === 'M' && args.length > 2) {
            const segmentsArray = [];
            segmentsArray.push({
                type: command,
                x: args[0],
                y: args[1],
            });
            segmentsArray.push(...makeInstructions(args.slice(2), 'L', (numbers) => ({
                type: 'L',
                x: numbers[0],
                y: numbers[1],
            })));
            return segmentsArray;
        }
        if (command === 'm' && args.length > 2) {
            const segmentsArray = [];
            segmentsArray.push({
                type: command,
                dx: args[0],
                dy: args[1],
            });
            segmentsArray.push(...makeInstructions(args.slice(2), 'l', (numbers) => ({
                type: 'l',
                dx: numbers[0],
                dy: numbers[1],
            })));
            return segmentsArray;
        }
        if (command === 'Z' || command === 'z') {
            return [
                {
                    type: 'Z',
                },
            ];
        }
        if (command === 'A') {
            return makeInstructions(args, command, (numbers) => ({
                type: command,
                rx: numbers[0],
                ry: numbers[1],
                xAxisRotation: numbers[2],
                largeArcFlag: numbers[3] === 1,
                sweepFlag: numbers[4] === 1,
                x: numbers[5],
                y: numbers[6],
            }));
        }
        if (command === 'a') {
            return makeInstructions(args, command, (numbers) => ({
                type: command,
                rx: numbers[0],
                ry: numbers[1],
                xAxisRotation: numbers[2],
                largeArcFlag: numbers[3] === 1,
                sweepFlag: numbers[4] === 1,
                dx: numbers[5],
                dy: numbers[6],
            }));
        }
        if (command === 'C') {
            return makeInstructions(args, command, (numbers) => ({
                type: command,
                cp1x: numbers[0],
                cp1y: numbers[1],
                cp2x: numbers[2],
                cp2y: numbers[3],
                x: numbers[4],
                y: numbers[5],
            }));
        }
        if (command === 'c') {
            return makeInstructions(args, command, (numbers) => ({
                type: command,
                cp1dx: numbers[0],
                cp1dy: numbers[1],
                cp2dx: numbers[2],
                cp2dy: numbers[3],
                dx: numbers[4],
                dy: numbers[5],
            }));
        }
        if (command === 'S') {
            return makeInstructions(args, command, (numbers) => ({
                type: command,
                cpx: numbers[0],
                cpy: numbers[1],
                x: numbers[2],
                y: numbers[3],
            }));
        }
        if (command === 's') {
            return makeInstructions(args, command, (numbers) => ({
                type: command,
                cpdx: numbers[0],
                cpdy: numbers[1],
                dx: numbers[2],
                dy: numbers[3],
            }));
        }
        if (command === 'H') {
            return makeInstructions(args, command, (numbers) => ({
                type: command,
                x: numbers[0],
            }));
        }
        if (command === 'h') {
            return makeInstructions(args, command, (numbers) => ({
                type: command,
                dx: numbers[0],
            }));
        }
        if (command === 'V') {
            return makeInstructions(args, command, (numbers) => ({
                type: command,
                y: numbers[0],
            }));
        }
        if (command === 'v') {
            return makeInstructions(args, command, (numbers) => ({
                type: command,
                dy: numbers[0],
            }));
        }
        if (command === 'L') {
            return makeInstructions(args, command, (numbers) => ({
                type: command,
                x: numbers[0],
                y: numbers[1],
            }));
        }
        if (command === 'M') {
            return makeInstructions(args, command, (numbers) => ({
                type: command,
                x: numbers[0],
                y: numbers[1],
            }));
        }
        if (command === 'm') {
            return makeInstructions(args, command, (numbers) => ({
                type: command,
                dx: numbers[0],
                dy: numbers[1],
            }));
        }
        if (command === 'l') {
            return makeInstructions(args, command, (numbers) => ({
                type: command,
                dx: numbers[0],
                dy: numbers[1],
            }));
        }
        if (command === 'Q') {
            return makeInstructions(args, command, (numbers) => ({
                type: command,
                cpx: numbers[0],
                cpy: numbers[1],
                x: numbers[2],
                y: numbers[3],
            }));
        }
        if (command === 'q') {
            return makeInstructions(args, command, (numbers) => ({
                type: command,
                cpdx: numbers[0],
                cpdy: numbers[1],
                dx: numbers[2],
                dy: numbers[3],
            }));
        }
        if (command === 'T') {
            return makeInstructions(args, command, (numbers) => ({
                type: command,
                x: numbers[0],
                y: numbers[1],
            }));
        }
        if (command === 't') {
            return makeInstructions(args, command, (numbers) => ({
                type: command,
                dx: numbers[0],
                dy: numbers[1],
            }));
        }
        throw new Error(`Invalid path element ${segmentString}`);
    }, [])
        .flat(1);
};
exports.parsePath = parsePath;


/***/ }),

/***/ 5111:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.reduceInstructions = void 0;
const remove_a_s_t_curves_1 = __webpack_require__(25525);
const normalize_path_1 = __webpack_require__(83262);
/**
 * @description Takes an array of Instruction's and reduces the amount of instruction types them so the path only consists of M, L, C, Q and Z instructions.
 * @param {Array} instruction
 * @see [Documentation](https://www.remotion.dev/docs/paths/reduce-instructions)
 */
const reduceInstructions = (instruction) => {
    const simplified = (0, normalize_path_1.normalizeInstructions)(instruction);
    return (0, remove_a_s_t_curves_1.removeATSHVInstructions)(simplified);
};
exports.reduceInstructions = reduceInstructions;


/***/ }),

/***/ 61574:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.resetPath = void 0;
const get_bounding_box_1 = __webpack_require__(70902);
const translate_path_1 = __webpack_require__(18301);
/**
 * @description Translates an SVG path so that the top-left corner of the bounding box is at 0, 0.
 * @param {string} d a valid SVG path
 * @see [Documentation](https://www.remotion.dev/docs/paths/reset-path)
 */
const resetPath = (d) => {
    const box = (0, get_bounding_box_1.getBoundingBox)(d);
    return (0, translate_path_1.translatePath)(d, -box.x1, -box.y1);
};
exports.resetPath = resetPath;


/***/ }),

/***/ 34258:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


/**
 * https://github.com/Pomax/svg-path-reverse
 *
 * This code is in the public domain, except in jurisdictions that do
 * not recognise the public domain, where this code is MIT licensed.
 */
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.reversePath = void 0;
const construct_1 = __webpack_require__(69289);
const normalize_path_1 = __webpack_require__(83262);
const parse_path_1 = __webpack_require__(92339);
const reduce_instructions_1 = __webpack_require__(5111);
const serialize_instructions_1 = __webpack_require__(9075);
function reverseNormalizedPath(instructions) {
    const reversed = [];
    let nextX = 0;
    let nextY = 0;
    for (const term of instructions) {
        if (term.type === 'A') {
            reversed.unshift({
                type: 'A',
                largeArcFlag: term.largeArcFlag,
                rx: term.rx,
                ry: term.ry,
                xAxisRotation: term.xAxisRotation,
                sweepFlag: !term.sweepFlag,
                x: nextX,
                y: nextY,
            });
        }
        else if (term.type === 'C') {
            reversed.unshift({
                type: 'C',
                cp1x: term.cp2x,
                cp1y: term.cp2y,
                cp2x: term.cp1x,
                cp2y: term.cp1y,
                x: nextX,
                y: nextY,
            });
        }
        else if (term.type === 'Q') {
            reversed.unshift({
                type: 'Q',
                cpx: term.cpx,
                cpy: term.cpy,
                x: nextX,
                y: nextY,
            });
        }
        else if (term.type === 'L') {
            reversed.unshift({
                type: 'L',
                x: nextX,
                y: nextY,
            });
            // Do nothing
        }
        else if (term.type === 'M') {
            // Do nothing
        }
        else if (term.type === 'Z') {
            // Do nothing
        }
        else {
            throw new Error('unnormalized instruction ' + term.type);
        }
        if (term.type !== 'Z') {
            nextX = term.x;
            nextY = term.y;
        }
    }
    reversed.unshift({
        type: 'M',
        x: nextX,
        y: nextY,
    });
    let revstring = (0, serialize_instructions_1.serializeInstructions)(reversed);
    if (instructions[instructions.length - 1].type === 'Z')
        revstring += 'Z';
    revstring = revstring.replace(/M M/g, 'Z M');
    return revstring;
}
/**
 * @description Reverses a path so the end and start are switched.
 * @param {string} path A valid SVG path
 * @see [Documentation](https://remotion.dev/docs/paths/reverse-path)
 */
const reversePath = (path) => {
    const parsed = (0, parse_path_1.parsePath)(path);
    const normalized = (0, normalize_path_1.normalizeInstructions)(parsed);
    const reduced = (0, reduce_instructions_1.reduceInstructions)(normalized);
    const { segments } = (0, construct_1.constructFromInstructions)(reduced);
    return segments
        .map((spath) => {
        return reverseNormalizedPath(spath);
    })
        .join(' ')
        .replace(/ +/g, ' ')
        .trim();
};
exports.reversePath = reversePath;


/***/ }),

/***/ 93724:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.scalePath = void 0;
const get_bounding_box_1 = __webpack_require__(70902);
const parse_path_1 = __webpack_require__(92339);
const reduce_instructions_1 = __webpack_require__(5111);
const serialize_instructions_1 = __webpack_require__(9075);
const translate_path_1 = __webpack_require__(18301);
/**
 * @description Allows you to grow or shrink the size of a path.
 * @param {string} path A valid SVG path
 * @param {string} d
 * @param {Number} scaleX
 * @param {Number} scaleY
 * @returns a new path with respect to the scale values provided
 * @see [Documentation](https://www.remotion.dev/docs/paths/scale-path)
 */
const scalePath = (d, scaleX, scaleY) => {
    const reduced = (0, reduce_instructions_1.reduceInstructions)((0, parse_path_1.parsePath)(d));
    const bounded = (0, get_bounding_box_1.getBoundingBoxFromInstructions)(reduced);
    const zeroed = (0, translate_path_1.translateSegments)(reduced, -bounded.x1, -bounded.y1);
    const mapped = zeroed.map((instruction) => {
        if (instruction.type === 'L') {
            return {
                type: 'L',
                x: scaleX * instruction.x,
                y: scaleY * instruction.y,
            };
        }
        if (instruction.type === 'C') {
            return {
                type: 'C',
                x: scaleX * instruction.x,
                y: scaleY * instruction.y,
                cp1x: scaleX * instruction.cp1x,
                cp1y: scaleY * instruction.cp1y,
                cp2x: scaleX * instruction.cp2x,
                cp2y: scaleY * instruction.cp2y,
            };
        }
        if (instruction.type === 'M') {
            return {
                type: 'M',
                x: scaleX * instruction.x,
                y: scaleY * instruction.y,
            };
        }
        if (instruction.type === 'Q') {
            return {
                type: 'Q',
                x: scaleX * instruction.x,
                y: scaleY * instruction.y,
                cpx: scaleX * instruction.cpx,
                cpy: scaleY * instruction.cpy,
            };
        }
        if (instruction.type === 'Z') {
            return {
                type: 'Z',
            };
        }
        if (instruction.type === 'A') {
            return {
                type: 'A',
                largeArcFlag: instruction.largeArcFlag,
                rx: scaleX * instruction.rx,
                ry: scaleY * instruction.ry,
                sweepFlag: instruction.sweepFlag,
                xAxisRotation: instruction.xAxisRotation,
                x: scaleX * instruction.x,
                y: scaleY * instruction.y,
            };
        }
        if (instruction.type === 'H') {
            return {
                type: 'H',
                x: scaleX * instruction.x,
            };
        }
        if (instruction.type === 'S') {
            return {
                type: 'S',
                cpx: scaleX * instruction.cpx,
                cpy: scaleY * instruction.cpy,
                x: scaleX * instruction.x,
                y: scaleY * instruction.y,
            };
        }
        if (instruction.type === 'T') {
            return {
                type: 'T',
                x: scaleX * instruction.x,
                y: scaleY * instruction.y,
            };
        }
        if (instruction.type === 'V') {
            return {
                type: 'V',
                y: scaleY * instruction.y,
            };
        }
        if (instruction.type === 'a') {
            return {
                type: 'a',
                dx: scaleX * instruction.dx,
                dy: scaleY * instruction.dy,
                largeArcFlag: instruction.largeArcFlag,
                rx: scaleX * instruction.rx,
                ry: scaleY * instruction.ry,
                sweepFlag: instruction.sweepFlag,
                xAxisRotation: instruction.xAxisRotation,
            };
        }
        if (instruction.type === 'c') {
            return {
                type: 'c',
                cp1dx: scaleX * instruction.cp1dx,
                cp1dy: scaleY * instruction.cp1dy,
                cp2dx: scaleX * instruction.cp2dx,
                cp2dy: scaleY * instruction.cp2dy,
                dx: scaleX * instruction.dx,
                dy: scaleY * instruction.dy,
            };
        }
        if (instruction.type === 'h') {
            return {
                type: 'h',
                dx: scaleX * instruction.dx,
            };
        }
        if (instruction.type === 'l') {
            return {
                type: 'l',
                dx: scaleX * instruction.dx,
                dy: scaleY * instruction.dy,
            };
        }
        if (instruction.type === 'm') {
            return {
                type: 'm',
                dx: scaleX * instruction.dx,
                dy: scaleY * instruction.dy,
            };
        }
        if (instruction.type === 'q') {
            return {
                type: 'q',
                cpdx: scaleX * instruction.cpdx,
                cpdy: scaleY * instruction.cpdy,
                dx: scaleX * instruction.dx,
                dy: scaleY * instruction.dy,
            };
        }
        if (instruction.type === 's') {
            return {
                type: 's',
                cpdx: scaleX * instruction.cpdx,
                cpdy: scaleY * instruction.cpdy,
                dx: scaleX * instruction.dx,
                dy: scaleY * instruction.dy,
            };
        }
        if (instruction.type === 't') {
            return {
                type: 't',
                dx: scaleX * instruction.dx,
                dy: scaleY * instruction.dy,
            };
        }
        if (instruction.type === 'v') {
            return {
                type: 'v',
                dy: scaleY * instruction.dy,
            };
        }
        throw new Error('unexpected function');
    });
    return (0, serialize_instructions_1.serializeInstructions)((0, translate_path_1.translateSegments)(mapped, bounded.x1, bounded.y1));
};
exports.scalePath = scalePath;


/***/ }),

/***/ 9075:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.serializeInstructions = void 0;
/**
 * @description Takes an array of Instruction's and serializes it into an SVG path string.
 * @param {Array} instruction
 * @returns a serialized SVG path string
 * @see [Documentation](https://www.remotion.dev/docs/paths/serialize-instructions)
 */
const serializeInstruction = (instruction) => {
    if (instruction.type === 'A') {
        return `A ${instruction.rx} ${instruction.ry} ${instruction.xAxisRotation} ${Number(instruction.largeArcFlag)} ${Number(instruction.sweepFlag)} ${instruction.x} ${instruction.y}`;
    }
    if (instruction.type === 'a') {
        return `a ${instruction.rx} ${instruction.ry} ${instruction.xAxisRotation} ${Number(instruction.largeArcFlag)} ${Number(instruction.sweepFlag)} ${instruction.dx} ${instruction.dy}`;
    }
    if (instruction.type === 'C') {
        return `C ${instruction.cp1x} ${instruction.cp1y} ${instruction.cp2x} ${instruction.cp2y} ${instruction.x} ${instruction.y}`;
    }
    if (instruction.type === 'c') {
        return `c ${instruction.cp1dx} ${instruction.cp1dy} ${instruction.cp2dx} ${instruction.cp2dy} ${instruction.dx} ${instruction.dy}`;
    }
    if (instruction.type === 'S') {
        return `S ${instruction.cpx} ${instruction.cpy} ${instruction.x} ${instruction.y}`;
    }
    if (instruction.type === 's') {
        return `s ${instruction.cpdx} ${instruction.cpdy} ${instruction.dx} ${instruction.dy}`;
    }
    if (instruction.type === 'Q') {
        return `Q ${instruction.cpx} ${instruction.cpy} ${instruction.x} ${instruction.y}`;
    }
    if (instruction.type === 'q') {
        return `q ${instruction.cpdx} ${instruction.cpdy} ${instruction.dx} ${instruction.dy}`;
    }
    if (instruction.type === 'Z') {
        return 'Z';
    }
    if (instruction.type === 'H') {
        return `H ${instruction.x}`;
    }
    if (instruction.type === 'h') {
        return `h ${instruction.dx}`;
    }
    if (instruction.type === 'V') {
        return `V ${instruction.y}`;
    }
    if (instruction.type === 'v') {
        return `v ${instruction.dy}`;
    }
    if (instruction.type === 'L') {
        return `L ${instruction.x} ${instruction.y}`;
    }
    if (instruction.type === 'l') {
        return `l ${instruction.dx} ${instruction.dy}`;
    }
    if (instruction.type === 'M') {
        return `M ${instruction.x} ${instruction.y}`;
    }
    if (instruction.type === 'm') {
        return `m ${instruction.dx} ${instruction.dy}`;
    }
    if (instruction.type === 'T') {
        return `T ${instruction.x} ${instruction.y}`;
    }
    if (instruction.type === 't') {
        return `t ${instruction.dx} ${instruction.dy}`;
    }
    // @ts-expect-error
    throw new Error(`Unknown instruction type: ${instruction.type}`);
};
const serializeInstructions = (path) => {
    return path
        .map((p) => {
        return serializeInstruction(p);
    })
        .join(' ');
};
exports.serializeInstructions = serializeInstructions;


/***/ }),

/***/ 18301:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.translatePath = exports.translateSegments = void 0;
const parse_path_1 = __webpack_require__(92339);
const serialize_instructions_1 = __webpack_require__(9075);
const translateSegments = (segments, x, y) => {
    return segments.map((segment) => {
        // Shift coords only for commands with absolute values
        if (segment.type === 'a' ||
            segment.type === 'c' ||
            segment.type === 'v' ||
            segment.type === 's' ||
            segment.type === 'h' ||
            segment.type === 'l' ||
            segment.type === 'm' ||
            segment.type === 'q' ||
            segment.type === 't') {
            return segment;
        }
        // V is the only command, with shifted coords parity
        if (segment.type === 'V') {
            return {
                type: 'V',
                y: segment.y + y,
            };
        }
        if (segment.type === 'H') {
            return {
                type: 'H',
                x: segment.x + x,
            };
        }
        // ARC is: ['A', rx, ry, x-axis-rotation, large-arc-flag, sweep-flag, x, y]
        // touch x, y only
        if (segment.type === 'A') {
            return {
                type: 'A',
                rx: segment.rx,
                ry: segment.ry,
                largeArcFlag: segment.largeArcFlag,
                sweepFlag: segment.sweepFlag,
                xAxisRotation: segment.xAxisRotation,
                x: segment.x + x,
                y: segment.y + y,
            };
        }
        if (segment.type === 'Z') {
            return segment;
        }
        if (segment.type === 'C') {
            return {
                type: 'C',
                cp1x: segment.cp1x + x,
                cp1y: segment.cp1y + y,
                cp2x: segment.cp2x + x,
                cp2y: segment.cp2y + y,
                x: segment.x + x,
                y: segment.y + y,
            };
        }
        if (segment.type === 'Q') {
            return {
                type: 'Q',
                cpx: segment.cpx + x,
                cpy: segment.cpy + y,
                x: segment.x + x,
                y: segment.y + y,
            };
        }
        if (segment.type === 'S') {
            return {
                type: 'S',
                cpx: segment.cpx + x,
                cpy: segment.cpy + y,
                x: segment.x + x,
                y: segment.y + y,
            };
        }
        if (segment.type === 'T') {
            return {
                type: 'T',
                x: segment.x + x,
                y: segment.y + y,
            };
        }
        if (segment.type === 'L') {
            return {
                type: 'L',
                x: segment.x + x,
                y: segment.y + y,
            };
        }
        if (segment.type === 'M') {
            return {
                type: 'M',
                x: segment.x + x,
                y: segment.y + y,
            };
        }
        // @ts-expect-error
        throw new Error(`Unknown segment type: ${segment.type}`);
    });
};
exports.translateSegments = translateSegments;
/**
 * @description Translates the path by the given x and y coordinates.
 * @param {string} path the originalSVG path
 * @param {Number} x the amount of horizontal translation
 * @param {Number} y the amount of vertical translation
 * @returns a new string containing a path, if it is valid
 * @see [Documentation](https://www.remotion.dev/docs/paths/translate-path)
 */
const translatePath = (path, x, y) => {
    return (0, serialize_instructions_1.serializeInstructions)((0, exports.translateSegments)((0, parse_path_1.parsePath)(path), x, y));
};
exports.translatePath = translatePath;


/***/ }),

/***/ 78947:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.warpPath = void 0;
const get_bounding_box_1 = __webpack_require__(70902);
const parse_path_1 = __webpack_require__(92339);
const reduce_instructions_1 = __webpack_require__(5111);
const serialize_instructions_1 = __webpack_require__(9075);
const warp_helpers_1 = __webpack_require__(86790);
const getDefaultInterpolationThreshold = (instructions) => {
    const boundingBox = (0, get_bounding_box_1.getBoundingBoxFromInstructions)(instructions);
    const longer = Math.max(boundingBox.y2 - boundingBox.y1, boundingBox.x2 - boundingBox.x1);
    return longer * 0.01;
};
/**
 * @description This function works by splitting SVG instructions into many smaller SVG instructions and then remapping the coordinates of each instruction.
 * @param {string} path an SVG path string
 * @see [Documentation](https://www.remotion.dev/docs/paths/warp-path)
 */
const warpPath = (path, transformer, options) => {
    var _a;
    const reduced = (0, reduce_instructions_1.reduceInstructions)((0, parse_path_1.parsePath)(path));
    const withZFix = (0, warp_helpers_1.fixZInstruction)(reduced);
    const interpolated = (0, warp_helpers_1.svgPathInterpolate)(withZFix, (_a = options === null || options === void 0 ? void 0 : options.interpolationThreshold) !== null && _a !== void 0 ? _a : getDefaultInterpolationThreshold(withZFix));
    return (0, serialize_instructions_1.serializeInstructions)((0, warp_helpers_1.warpTransform)(interpolated, transformer));
};
exports.warpPath = warpPath;


/***/ }),

/***/ 86790:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.fixZInstruction = exports.warpTransform = exports.svgPathInterpolate = exports.createLineSegment = exports.interpolateUntil = exports.split = void 0;
const euclideanDistance = (points) => {
    const startPoint = points[0];
    const endPoint = points[points.length - 1];
    let d2 = 0;
    for (let i = 0; i < startPoint.length; i++) {
        const d = endPoint[i] - startPoint[i];
        d2 += d ** 2;
    }
    return Math.sqrt(d2);
};
function split(p, t = 0.5) {
    const seg0 = [];
    const seg1 = [];
    const orders = [p];
    while (orders.length < p.length) {
        const q = orders[orders.length - 1];
        const r = [];
        for (let i = 1; i < q.length; i++) {
            const q0 = q[i - 1];
            const q1 = q[i];
            const s = [];
            const dim = Math.max(q0.length, q1.length);
            for (let j = 0; j < dim; j++) {
                const s0 = q0[j] || 0;
                const s1 = q1[j] || 0;
                s.push(s0 + (s1 - s0) * t);
            }
            r.push(s);
        }
        orders.push(r);
    }
    for (let i = 0; i < orders.length; i++) {
        seg0.push(orders[i][0]);
        seg1.push(orders[orders.length - 1 - i][i]);
    }
    return [seg0, seg1];
}
exports.split = split;
function interpolateUntil(points, threshold, deltaFunction = euclideanDistance) {
    const stack = [points];
    const segments = [];
    while (stack.length > 0) {
        const currentPoints = stack.pop();
        if (deltaFunction(currentPoints) > threshold) {
            const newPoints = split(currentPoints);
            // Add new segments backwards so they end up in correct order
            for (let i = newPoints.length - 1; i >= 0; i--) {
                stack.push(newPoints[i]);
            }
        }
        else {
            segments.push(currentPoints);
        }
    }
    return segments;
}
exports.interpolateUntil = interpolateUntil;
function createLineSegment(points) {
    switch (points.length) {
        case 2:
            return {
                type: 'L',
                x: points[1][0],
                y: points[1][1],
            };
        case 3:
            return {
                type: 'Q',
                cpx: points[1][0],
                cpy: points[1][1],
                x: points[2][0],
                y: points[2][1],
            };
        case 4:
            return {
                type: 'C',
                cp1x: points[1][0],
                cp1y: points[1][1],
                cp2x: points[2][0],
                cp2y: points[2][1],
                x: points[3][0],
                y: points[3][1],
            };
        default:
            throw new Error('Expected 2, 3 or 4 points for a line segment, got ' + points.length);
    }
}
exports.createLineSegment = createLineSegment;
function warpInterpolate(path, threshold, deltaFunction) {
    let prexX = 0;
    let prexY = 0;
    return path
        .map((segment) => {
        const points = [[prexX, prexY]];
        if (segment.type !== 'Z') {
            prexX = segment.x;
            prexY = segment.y;
        }
        if (segment.type === 'C') {
            points.push([segment.cp1x, segment.cp1y]);
            points.push([segment.cp2x, segment.cp2y]);
            points.push([segment.x, segment.y]);
        }
        if (segment.type === 'L') {
            points.push([segment.x, segment.y]);
        }
        if (segment.type === 'Q') {
            points.push([segment.cpx, segment.cpy]);
            points.push([segment.x, segment.y]);
        }
        if (segment.type === 'C' ||
            segment.type === 'Q' ||
            segment.type === 'L') {
            return interpolateUntil(points, threshold, deltaFunction).map((rawSegment) => createLineSegment(rawSegment));
        }
        return [segment];
    })
        .flat(1);
}
function svgPathInterpolate(path, threshold) {
    let didWork = false;
    const deltaFunction = (points) => {
        const linearPoints = [
            points[0].slice(0, 2),
            points[points.length - 1].slice(0, 2),
        ];
        const delta = euclideanDistance(linearPoints);
        didWork = didWork || delta > threshold;
        return delta;
    };
    return warpInterpolate(path, threshold, deltaFunction);
}
exports.svgPathInterpolate = svgPathInterpolate;
const warpTransform = (path, transformer) => {
    return path
        .map((segment) => {
        if (segment.type === 'L') {
            const { x, y } = transformer({ x: segment.x, y: segment.y });
            return [
                {
                    type: 'L',
                    x,
                    y,
                },
            ];
        }
        if (segment.type === 'Q') {
            const { x, y } = transformer({ x: segment.x, y: segment.y });
            const { x: cpx, y: cpy } = transformer({
                x: segment.cpx,
                y: segment.cpy,
            });
            return [
                {
                    type: 'Q',
                    x,
                    y,
                    cpx,
                    cpy,
                },
            ];
        }
        if (segment.type === 'C') {
            const { x, y } = transformer({ x: segment.x, y: segment.y });
            const { x: cp1x, y: cp1y } = transformer({
                x: segment.cp1x,
                y: segment.cp1y,
            });
            const { x: cp2x, y: cp2y } = transformer({
                x: segment.cp2x,
                y: segment.cp2y,
            });
            return [
                {
                    type: 'C',
                    x,
                    y,
                    cp1x,
                    cp1y,
                    cp2x,
                    cp2y,
                },
            ];
        }
        if (segment.type === 'M') {
            const { x, y } = transformer({ x: segment.x, y: segment.y });
            return [
                {
                    type: 'M',
                    x,
                    y,
                },
            ];
        }
        return [segment];
    })
        .flat(1);
};
exports.warpTransform = warpTransform;
// Add a line from second to last point to last point and then keep Z so it can be transformed as well
const fixZInstruction = (instructions) => {
    let prevX = 0;
    let prevY = 0;
    return instructions
        .map((instruction) => {
        if (instruction.type === 'Z') {
            return [
                {
                    type: 'L',
                    x: prevX,
                    y: prevY,
                },
                {
                    type: 'Z',
                },
            ];
        }
        if (instruction.type === 'M') {
            prevX = instruction.x;
            prevY = instruction.y;
        }
        return [instruction];
    })
        .flat(1);
};
exports.fixZInstruction = fixZInstruction;


/***/ }),

/***/ 76656:
/***/ ((module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Z: () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _node_modules_css_loader_dist_runtime_cssWithMappingToString_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(94015);
/* harmony import */ var _node_modules_css_loader_dist_runtime_cssWithMappingToString_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_cssWithMappingToString_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(23645);
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__);
// Imports


var ___CSS_LOADER_EXPORT___ = _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default()((_node_modules_css_loader_dist_runtime_cssWithMappingToString_js__WEBPACK_IMPORTED_MODULE_0___default()));
// Module
___CSS_LOADER_EXPORT___.push([module.id, "/*\n! tailwindcss v3.4.3 | MIT License | https://tailwindcss.com\n*//*\n1. Prevent padding and border from affecting element width. (https://github.com/mozdevs/cssremedy/issues/4)\n2. Allow adding a border to an element by just adding a border-width. (https://github.com/tailwindcss/tailwindcss/pull/116)\n*/\n\n*,\n::before,\n::after {\n  box-sizing: border-box; /* 1 */\n  border-width: 0; /* 2 */\n  border-style: solid; /* 2 */\n  border-color: #e5e7eb; /* 2 */\n}\n\n::before,\n::after {\n  --tw-content: '';\n}\n\n/*\n1. Use a consistent sensible line-height in all browsers.\n2. Prevent adjustments of font size after orientation changes in iOS.\n3. Use a more readable tab size.\n4. Use the user's configured `sans` font-family by default.\n5. Use the user's configured `sans` font-feature-settings by default.\n6. Use the user's configured `sans` font-variation-settings by default.\n7. Disable tap highlights on iOS\n*/\n\nhtml,\n:host {\n  line-height: 1.5; /* 1 */\n  -webkit-text-size-adjust: 100%; /* 2 */\n  -moz-tab-size: 4; /* 3 */\n  -o-tab-size: 4;\n     tab-size: 4; /* 3 */\n  font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, sans-serif, \"Apple Color Emoji\", \"Segoe UI Emoji\", \"Segoe UI Symbol\", \"Noto Color Emoji\"; /* 4 */\n  font-feature-settings: normal; /* 5 */\n  font-variation-settings: normal; /* 6 */\n  -webkit-tap-highlight-color: transparent; /* 7 */\n}\n\n/*\n1. Remove the margin in all browsers.\n2. Inherit line-height from `html` so users can set them as a class directly on the `html` element.\n*/\n\nbody {\n  margin: 0; /* 1 */\n  line-height: inherit; /* 2 */\n}\n\n/*\n1. Add the correct height in Firefox.\n2. Correct the inheritance of border color in Firefox. (https://bugzilla.mozilla.org/show_bug.cgi?id=190655)\n3. Ensure horizontal rules are visible by default.\n*/\n\nhr {\n  height: 0; /* 1 */\n  color: inherit; /* 2 */\n  border-top-width: 1px; /* 3 */\n}\n\n/*\nAdd the correct text decoration in Chrome, Edge, and Safari.\n*/\n\nabbr:where([title]) {\n  text-decoration: underline;\n  -webkit-text-decoration: underline dotted;\n          text-decoration: underline dotted;\n}\n\n/*\nRemove the default font size and weight for headings.\n*/\n\nh1,\nh2,\nh3,\nh4,\nh5,\nh6 {\n  font-size: inherit;\n  font-weight: inherit;\n}\n\n/*\nReset links to optimize for opt-in styling instead of opt-out.\n*/\n\na {\n  color: inherit;\n  text-decoration: inherit;\n}\n\n/*\nAdd the correct font weight in Edge and Safari.\n*/\n\nb,\nstrong {\n  font-weight: bolder;\n}\n\n/*\n1. Use the user's configured `mono` font-family by default.\n2. Use the user's configured `mono` font-feature-settings by default.\n3. Use the user's configured `mono` font-variation-settings by default.\n4. Correct the odd `em` font sizing in all browsers.\n*/\n\ncode,\nkbd,\nsamp,\npre {\n  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace; /* 1 */\n  font-feature-settings: normal; /* 2 */\n  font-variation-settings: normal; /* 3 */\n  font-size: 1em; /* 4 */\n}\n\n/*\nAdd the correct font size in all browsers.\n*/\n\nsmall {\n  font-size: 80%;\n}\n\n/*\nPrevent `sub` and `sup` elements from affecting the line height in all browsers.\n*/\n\nsub,\nsup {\n  font-size: 75%;\n  line-height: 0;\n  position: relative;\n  vertical-align: baseline;\n}\n\nsub {\n  bottom: -0.25em;\n}\n\nsup {\n  top: -0.5em;\n}\n\n/*\n1. Remove text indentation from table contents in Chrome and Safari. (https://bugs.chromium.org/p/chromium/issues/detail?id=999088, https://bugs.webkit.org/show_bug.cgi?id=201297)\n2. Correct table border color inheritance in all Chrome and Safari. (https://bugs.chromium.org/p/chromium/issues/detail?id=935729, https://bugs.webkit.org/show_bug.cgi?id=195016)\n3. Remove gaps between table borders by default.\n*/\n\ntable {\n  text-indent: 0; /* 1 */\n  border-color: inherit; /* 2 */\n  border-collapse: collapse; /* 3 */\n}\n\n/*\n1. Change the font styles in all browsers.\n2. Remove the margin in Firefox and Safari.\n3. Remove default padding in all browsers.\n*/\n\nbutton,\ninput,\noptgroup,\nselect,\ntextarea {\n  font-family: inherit; /* 1 */\n  font-feature-settings: inherit; /* 1 */\n  font-variation-settings: inherit; /* 1 */\n  font-size: 100%; /* 1 */\n  font-weight: inherit; /* 1 */\n  line-height: inherit; /* 1 */\n  letter-spacing: inherit; /* 1 */\n  color: inherit; /* 1 */\n  margin: 0; /* 2 */\n  padding: 0; /* 3 */\n}\n\n/*\nRemove the inheritance of text transform in Edge and Firefox.\n*/\n\nbutton,\nselect {\n  text-transform: none;\n}\n\n/*\n1. Correct the inability to style clickable types in iOS and Safari.\n2. Remove default button styles.\n*/\n\nbutton,\ninput:where([type='button']),\ninput:where([type='reset']),\ninput:where([type='submit']) {\n  -webkit-appearance: button; /* 1 */\n  background-color: transparent; /* 2 */\n  background-image: none; /* 2 */\n}\n\n/*\nUse the modern Firefox focus style for all focusable elements.\n*/\n\n:-moz-focusring {\n  outline: auto;\n}\n\n/*\nRemove the additional `:invalid` styles in Firefox. (https://github.com/mozilla/gecko-dev/blob/2f9eacd9d3d995c937b4251a5557d95d494c9be1/layout/style/res/forms.css#L728-L737)\n*/\n\n:-moz-ui-invalid {\n  box-shadow: none;\n}\n\n/*\nAdd the correct vertical alignment in Chrome and Firefox.\n*/\n\nprogress {\n  vertical-align: baseline;\n}\n\n/*\nCorrect the cursor style of increment and decrement buttons in Safari.\n*/\n\n::-webkit-inner-spin-button,\n::-webkit-outer-spin-button {\n  height: auto;\n}\n\n/*\n1. Correct the odd appearance in Chrome and Safari.\n2. Correct the outline style in Safari.\n*/\n\n[type='search'] {\n  -webkit-appearance: textfield; /* 1 */\n  outline-offset: -2px; /* 2 */\n}\n\n/*\nRemove the inner padding in Chrome and Safari on macOS.\n*/\n\n::-webkit-search-decoration {\n  -webkit-appearance: none;\n}\n\n/*\n1. Correct the inability to style clickable types in iOS and Safari.\n2. Change font properties to `inherit` in Safari.\n*/\n\n::-webkit-file-upload-button {\n  -webkit-appearance: button; /* 1 */\n  font: inherit; /* 2 */\n}\n\n/*\nAdd the correct display in Chrome and Safari.\n*/\n\nsummary {\n  display: list-item;\n}\n\n/*\nRemoves the default spacing and border for appropriate elements.\n*/\n\nblockquote,\ndl,\ndd,\nh1,\nh2,\nh3,\nh4,\nh5,\nh6,\nhr,\nfigure,\np,\npre {\n  margin: 0;\n}\n\nfieldset {\n  margin: 0;\n  padding: 0;\n}\n\nlegend {\n  padding: 0;\n}\n\nol,\nul,\nmenu {\n  list-style: none;\n  margin: 0;\n  padding: 0;\n}\n\n/*\nReset default styling for dialogs.\n*/\ndialog {\n  padding: 0;\n}\n\n/*\nPrevent resizing textareas horizontally by default.\n*/\n\ntextarea {\n  resize: vertical;\n}\n\n/*\n1. Reset the default placeholder opacity in Firefox. (https://github.com/tailwindlabs/tailwindcss/issues/3300)\n2. Set the default placeholder color to the user's configured gray 400 color.\n*/\n\ninput::-moz-placeholder, textarea::-moz-placeholder {\n  opacity: 1; /* 1 */\n  color: #9ca3af; /* 2 */\n}\n\ninput::placeholder,\ntextarea::placeholder {\n  opacity: 1; /* 1 */\n  color: #9ca3af; /* 2 */\n}\n\n/*\nSet the default cursor for buttons.\n*/\n\nbutton,\n[role=\"button\"] {\n  cursor: pointer;\n}\n\n/*\nMake sure disabled buttons don't get the pointer cursor.\n*/\n:disabled {\n  cursor: default;\n}\n\n/*\n1. Make replaced elements `display: block` by default. (https://github.com/mozdevs/cssremedy/issues/14)\n2. Add `vertical-align: middle` to align replaced elements more sensibly by default. (https://github.com/jensimmons/cssremedy/issues/14#issuecomment-634934210)\n   This can trigger a poorly considered lint error in some tools but is included by design.\n*/\n\nimg,\nsvg,\nvideo,\ncanvas,\naudio,\niframe,\nembed,\nobject {\n  display: block; /* 1 */\n  vertical-align: middle; /* 2 */\n}\n\n/*\nConstrain images and videos to the parent width and preserve their intrinsic aspect ratio. (https://github.com/mozdevs/cssremedy/issues/14)\n*/\n\nimg,\nvideo {\n  max-width: 100%;\n  height: auto;\n}\n\n/* Make elements with the HTML hidden attribute stay hidden by default */\n[hidden] {\n  display: none;\n}\n  :root {\n    --background: #fff;\n    --foreground: #000;\n    --unfocused-border-color: #eaeaea;\n    --focused-border-color: #666;\n\n    --button-disabled-color: #fafafa;\n    --disabled-text-color: #999;\n\n    --geist-border-radius: 5px;\n    --geist-quarter-pad: 6px;\n    --geist-half-pad: 12px;\n    --geist-pad: 24px;\n    --geist-font: \"Inter\";\n\n    --geist-error: #e00;\n\n    --subtitle: #666;\n  }\n\n  @media (prefers-color-scheme: dark) {\n    :root {\n      --background: #000000;\n      --unfocused-border-color: #333;\n      --focused-border-color: #888;\n      --foreground: #fff;\n      --button-disabled-color: #111;\n      --geist-error: red;\n      --subtitle: #8d8d8d;\n    }\n  }\n\n*, ::before, ::after {\n  --tw-border-spacing-x: 0;\n  --tw-border-spacing-y: 0;\n  --tw-translate-x: 0;\n  --tw-translate-y: 0;\n  --tw-rotate: 0;\n  --tw-skew-x: 0;\n  --tw-skew-y: 0;\n  --tw-scale-x: 1;\n  --tw-scale-y: 1;\n  --tw-pan-x:  ;\n  --tw-pan-y:  ;\n  --tw-pinch-zoom:  ;\n  --tw-scroll-snap-strictness: proximity;\n  --tw-gradient-from-position:  ;\n  --tw-gradient-via-position:  ;\n  --tw-gradient-to-position:  ;\n  --tw-ordinal:  ;\n  --tw-slashed-zero:  ;\n  --tw-numeric-figure:  ;\n  --tw-numeric-spacing:  ;\n  --tw-numeric-fraction:  ;\n  --tw-ring-inset:  ;\n  --tw-ring-offset-width: 0px;\n  --tw-ring-offset-color: #fff;\n  --tw-ring-color: rgba(59, 130, 246, 0.5);\n  --tw-ring-offset-shadow: 0 0 rgba(0,0,0,0);\n  --tw-ring-shadow: 0 0 rgba(0,0,0,0);\n  --tw-shadow: 0 0 rgba(0,0,0,0);\n  --tw-shadow-colored: 0 0 rgba(0,0,0,0);\n  --tw-blur:  ;\n  --tw-brightness:  ;\n  --tw-contrast:  ;\n  --tw-grayscale:  ;\n  --tw-hue-rotate:  ;\n  --tw-invert:  ;\n  --tw-saturate:  ;\n  --tw-sepia:  ;\n  --tw-drop-shadow:  ;\n  --tw-backdrop-blur:  ;\n  --tw-backdrop-brightness:  ;\n  --tw-backdrop-contrast:  ;\n  --tw-backdrop-grayscale:  ;\n  --tw-backdrop-hue-rotate:  ;\n  --tw-backdrop-invert:  ;\n  --tw-backdrop-opacity:  ;\n  --tw-backdrop-saturate:  ;\n  --tw-backdrop-sepia:  ;\n  --tw-contain-size:  ;\n  --tw-contain-layout:  ;\n  --tw-contain-paint:  ;\n  --tw-contain-style:  ;\n}\n\n::backdrop {\n  --tw-border-spacing-x: 0;\n  --tw-border-spacing-y: 0;\n  --tw-translate-x: 0;\n  --tw-translate-y: 0;\n  --tw-rotate: 0;\n  --tw-skew-x: 0;\n  --tw-skew-y: 0;\n  --tw-scale-x: 1;\n  --tw-scale-y: 1;\n  --tw-pan-x:  ;\n  --tw-pan-y:  ;\n  --tw-pinch-zoom:  ;\n  --tw-scroll-snap-strictness: proximity;\n  --tw-gradient-from-position:  ;\n  --tw-gradient-via-position:  ;\n  --tw-gradient-to-position:  ;\n  --tw-ordinal:  ;\n  --tw-slashed-zero:  ;\n  --tw-numeric-figure:  ;\n  --tw-numeric-spacing:  ;\n  --tw-numeric-fraction:  ;\n  --tw-ring-inset:  ;\n  --tw-ring-offset-width: 0px;\n  --tw-ring-offset-color: #fff;\n  --tw-ring-color: rgba(59, 130, 246, 0.5);\n  --tw-ring-offset-shadow: 0 0 rgba(0,0,0,0);\n  --tw-ring-shadow: 0 0 rgba(0,0,0,0);\n  --tw-shadow: 0 0 rgba(0,0,0,0);\n  --tw-shadow-colored: 0 0 rgba(0,0,0,0);\n  --tw-blur:  ;\n  --tw-brightness:  ;\n  --tw-contrast:  ;\n  --tw-grayscale:  ;\n  --tw-hue-rotate:  ;\n  --tw-invert:  ;\n  --tw-saturate:  ;\n  --tw-sepia:  ;\n  --tw-drop-shadow:  ;\n  --tw-backdrop-blur:  ;\n  --tw-backdrop-brightness:  ;\n  --tw-backdrop-contrast:  ;\n  --tw-backdrop-grayscale:  ;\n  --tw-backdrop-hue-rotate:  ;\n  --tw-backdrop-invert:  ;\n  --tw-backdrop-opacity:  ;\n  --tw-backdrop-saturate:  ;\n  --tw-backdrop-sepia:  ;\n  --tw-contain-size:  ;\n  --tw-contain-layout:  ;\n  --tw-contain-paint:  ;\n  --tw-contain-style:  ;\n}\n.absolute {\n  position: absolute;\n}\n.m-auto {\n  margin: auto;\n}\n.my-3 {\n  margin-top: 0.75rem;\n  margin-bottom: 0.75rem;\n}\n.mb-10 {\n  margin-bottom: 2.5rem;\n}\n.mb-5 {\n  margin-bottom: 1.25rem;\n}\n.mb-6 {\n  margin-bottom: 1.5rem;\n}\n.mr-1 {\n  margin-right: 0.25rem;\n}\n.mr-1\\.5 {\n  margin-right: 0.375rem;\n}\n.mt-16 {\n  margin-top: 4rem;\n}\n.mt-2 {\n  margin-top: 0.5rem;\n}\n.mt-2\\.5 {\n  margin-top: 0.625rem;\n}\n.block {\n  display: block;\n}\n.inline {\n  display: inline;\n}\n.flex {\n  display: flex;\n}\n.inline-flex {\n  display: inline-flex;\n}\n.h-10 {\n  height: 2.5rem;\n}\n.h-2 {\n  height: 0.5rem;\n}\n.h-2\\.5 {\n  height: 0.625rem;\n}\n.h-5 {\n  height: 1.25rem;\n}\n.h-geist-quarter {\n  height: 6px;\n  height: var(--geist-quarter-pad);\n}\n.w-full {\n  width: 100%;\n}\n.w-geist-quarter {\n  width: 6px;\n  width: var(--geist-quarter-pad);\n}\n.max-w-screen-md {\n  max-width: 768px;\n}\n.flex-1 {\n  flex: 1 1 0%;\n}\n.transform {\n  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));\n}\n@keyframes spinner {\n\n  0% {\n    opacity: 1;\n  }\n\n  100% {\n    opacity: 0.15;\n  }\n}\n.animate-spinner {\n  animation: spinner 1.2s linear infinite;\n}\n.appearance-none {\n  -webkit-appearance: none;\n     -moz-appearance: none;\n          appearance: none;\n}\n.flex-row {\n  flex-direction: row;\n}\n.flex-col {\n  flex-direction: column;\n}\n.items-center {\n  align-items: center;\n}\n.justify-start {\n  justify-content: flex-start;\n}\n.justify-center {\n  justify-content: center;\n}\n.self-end {\n  align-self: flex-end;\n}\n.overflow-hidden {\n  overflow: hidden;\n}\n.rounded-\\[50\\%\\] {\n  border-radius: 50%;\n}\n.rounded-geist {\n  border-radius: 5px;\n  border-radius: var(--geist-border-radius);\n}\n.rounded-md {\n  border-radius: 0.375rem;\n}\n.border {\n  border-width: 1px;\n}\n.border-foreground {\n  border-color: #000;\n  border-color: var(--foreground);\n}\n.border-unfocused-border-color {\n  border-color: #eaeaea;\n  border-color: var(--unfocused-border-color);\n}\n.bg-background {\n  background-color: #fff;\n  background-color: var(--background);\n}\n.bg-foreground {\n  background-color: #000;\n  background-color: var(--foreground);\n}\n.bg-unfocused-border-color {\n  background-color: #eaeaea;\n  background-color: var(--unfocused-border-color);\n}\n.bg-white {\n  --tw-bg-opacity: 1;\n  background-color: rgba(255, 255, 255, 1);\n  background-color: rgba(255, 255, 255, var(--tw-bg-opacity));\n}\n.p-2 {\n  padding: 0.5rem;\n}\n.p-2\\.5 {\n  padding: 0.625rem;\n}\n.p-geist {\n  padding: 24px;\n  padding: var(--geist-pad);\n}\n.p-geist-half {\n  padding: 12px;\n  padding: var(--geist-half-pad);\n}\n.px-geist-half {\n  padding-left: 12px;\n  padding-left: var(--geist-half-pad);\n  padding-right: 12px;\n  padding-right: var(--geist-half-pad);\n}\n.py-geist-half {\n  padding-top: 12px;\n  padding-top: var(--geist-half-pad);\n  padding-bottom: 12px;\n  padding-bottom: var(--geist-half-pad);\n}\n.align-text-bottom {\n  vertical-align: text-bottom;\n}\n.font-geist {\n  font-family: \"Inter\";\n  font-family: var(--geist-font);\n}\n.text-\\[70px\\] {\n  font-size: 70px;\n}\n.text-sm {\n  font-size: 0.875rem;\n  line-height: 1.25rem;\n}\n.font-bold {\n  font-weight: 700;\n}\n.font-medium {\n  font-weight: 500;\n}\n.leading-\\[1\\.7\\] {\n  line-height: 1.7;\n}\n.leading-normal {\n  line-height: 1.5;\n}\n.text-background {\n  color: #fff;\n  color: var(--background);\n}\n.text-foreground {\n  color: #000;\n  color: var(--foreground);\n}\n.text-geist-error {\n  color: #e00;\n  color: var(--geist-error);\n}\n.text-subtitle {\n  color: #666;\n  color: var(--subtitle);\n}\n.opacity-0 {\n  opacity: 0;\n}\n.opacity-60 {\n  opacity: 0.6;\n}\n.shadow-\\[0_0_200px_rgba\\(0\\2c 0\\2c 0\\2c 0\\.15\\)\\] {\n  --tw-shadow: 0 0 200px rgba(0,0,0,0.15);\n  --tw-shadow-colored: 0 0 200px var(--tw-shadow-color);\n  box-shadow: 0 0 rgba(0,0,0,0), 0 0 rgba(0,0,0,0), 0 0 200px rgba(0,0,0,0.15);\n  box-shadow: var(--tw-ring-offset-shadow, 0 0 rgba(0,0,0,0)), var(--tw-ring-shadow, 0 0 rgba(0,0,0,0)), var(--tw-shadow);\n}\n.shadow-\\[0px_0px_100px_rgba\\(0\\2c 0\\2c 0\\2c 0\\.05\\)\\] {\n  --tw-shadow: 0px 0px 100px rgba(0,0,0,0.05);\n  --tw-shadow-colored: 0px 0px 100px var(--tw-shadow-color);\n  box-shadow: 0 0 rgba(0,0,0,0), 0 0 rgba(0,0,0,0), 0px 0px 100px rgba(0,0,0,0.05);\n  box-shadow: var(--tw-ring-offset-shadow, 0 0 rgba(0,0,0,0)), var(--tw-ring-shadow, 0 0 rgba(0,0,0,0)), var(--tw-shadow);\n}\n.outline-none {\n  outline: 2px solid transparent;\n  outline-offset: 2px;\n}\n.transition-all {\n  transition-property: all;\n  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);\n  transition-duration: 150ms;\n}\n.transition-colors {\n  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke;\n  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);\n  transition-duration: 150ms;\n}\n.transition-opacity {\n  transition-property: opacity;\n  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);\n  transition-duration: 150ms;\n}\n.transition-transform {\n  transition-property: transform;\n  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);\n  transition-duration: 150ms;\n}\n.duration-100 {\n  transition-duration: 100ms;\n}\n.duration-150 {\n  transition-duration: 150ms;\n}\n.duration-200 {\n  transition-duration: 200ms;\n}\n.ease-in-out {\n  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);\n}\n.\\[mask-type\\:alpha\\] {\n  mask-type: alpha;\n}\n.hover\\:-translate-y-0:hover {\n  --tw-translate-y: -0px;\n  transform: translate(var(--tw-translate-x), -0px) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));\n  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));\n}\n.hover\\:-translate-y-0\\.5:hover {\n  --tw-translate-y: -0.125rem;\n  transform: translate(var(--tw-translate-x), -0.125rem) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));\n  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));\n}\n.hover\\:border-focused-border-color:hover {\n  border-color: #666;\n  border-color: var(--focused-border-color);\n}\n.hover\\:bg-background:hover {\n  background-color: #fff;\n  background-color: var(--background);\n}\n.hover\\:text-foreground:hover {\n  color: #000;\n  color: var(--foreground);\n}\n.focus\\:border-focused-border-color:focus {\n  border-color: #666;\n  border-color: var(--focused-border-color);\n}\n.disabled\\:cursor-not-allowed:disabled {\n  cursor: not-allowed;\n}\n.disabled\\:border-unfocused-border-color:disabled {\n  border-color: #eaeaea;\n  border-color: var(--unfocused-border-color);\n}\n.disabled\\:bg-button-disabled-color:disabled {\n  background-color: #fafafa;\n  background-color: var(--button-disabled-color);\n}\n.disabled\\:text-disabled-text-color:disabled {\n  color: #999;\n  color: var(--disabled-text-color);\n}\n.group:hover .group-hover\\:opacity-100 {\n  opacity: 1;\n}\n@media (min-width: 768px) {\n\n  .md\\:flex-row {\n    flex-direction: row;\n  }\n}\n", "",{"version":3,"sources":["webpack://./styles/global.css"],"names":[],"mappings":"AAAA;;CAAc,CAAd;;;CAAc;;AAAd;;;EAAA,sBAAc,EAAd,MAAc;EAAd,eAAc,EAAd,MAAc;EAAd,mBAAc,EAAd,MAAc;EAAd,qBAAc,EAAd,MAAc;AAAA;;AAAd;;EAAA,gBAAc;AAAA;;AAAd;;;;;;;;CAAc;;AAAd;;EAAA,gBAAc,EAAd,MAAc;EAAd,8BAAc,EAAd,MAAc;EAAd,gBAAc,EAAd,MAAc;EAAd,cAAc;KAAd,WAAc,EAAd,MAAc;EAAd,8LAAc,EAAd,MAAc;EAAd,6BAAc,EAAd,MAAc;EAAd,+BAAc,EAAd,MAAc;EAAd,wCAAc,EAAd,MAAc;AAAA;;AAAd;;;CAAc;;AAAd;EAAA,SAAc,EAAd,MAAc;EAAd,oBAAc,EAAd,MAAc;AAAA;;AAAd;;;;CAAc;;AAAd;EAAA,SAAc,EAAd,MAAc;EAAd,cAAc,EAAd,MAAc;EAAd,qBAAc,EAAd,MAAc;AAAA;;AAAd;;CAAc;;AAAd;EAAA,0BAAc;EAAd,yCAAc;UAAd,iCAAc;AAAA;;AAAd;;CAAc;;AAAd;;;;;;EAAA,kBAAc;EAAd,oBAAc;AAAA;;AAAd;;CAAc;;AAAd;EAAA,cAAc;EAAd,wBAAc;AAAA;;AAAd;;CAAc;;AAAd;;EAAA,mBAAc;AAAA;;AAAd;;;;;CAAc;;AAAd;;;;EAAA,+GAAc,EAAd,MAAc;EAAd,6BAAc,EAAd,MAAc;EAAd,+BAAc,EAAd,MAAc;EAAd,cAAc,EAAd,MAAc;AAAA;;AAAd;;CAAc;;AAAd;EAAA,cAAc;AAAA;;AAAd;;CAAc;;AAAd;;EAAA,cAAc;EAAd,cAAc;EAAd,kBAAc;EAAd,wBAAc;AAAA;;AAAd;EAAA,eAAc;AAAA;;AAAd;EAAA,WAAc;AAAA;;AAAd;;;;CAAc;;AAAd;EAAA,cAAc,EAAd,MAAc;EAAd,qBAAc,EAAd,MAAc;EAAd,yBAAc,EAAd,MAAc;AAAA;;AAAd;;;;CAAc;;AAAd;;;;;EAAA,oBAAc,EAAd,MAAc;EAAd,8BAAc,EAAd,MAAc;EAAd,gCAAc,EAAd,MAAc;EAAd,eAAc,EAAd,MAAc;EAAd,oBAAc,EAAd,MAAc;EAAd,oBAAc,EAAd,MAAc;EAAd,uBAAc,EAAd,MAAc;EAAd,cAAc,EAAd,MAAc;EAAd,SAAc,EAAd,MAAc;EAAd,UAAc,EAAd,MAAc;AAAA;;AAAd;;CAAc;;AAAd;;EAAA,oBAAc;AAAA;;AAAd;;;CAAc;;AAAd;;;;EAAA,0BAAc,EAAd,MAAc;EAAd,6BAAc,EAAd,MAAc;EAAd,sBAAc,EAAd,MAAc;AAAA;;AAAd;;CAAc;;AAAd;EAAA,aAAc;AAAA;;AAAd;;CAAc;;AAAd;EAAA,gBAAc;AAAA;;AAAd;;CAAc;;AAAd;EAAA,wBAAc;AAAA;;AAAd;;CAAc;;AAAd;;EAAA,YAAc;AAAA;;AAAd;;;CAAc;;AAAd;EAAA,6BAAc,EAAd,MAAc;EAAd,oBAAc,EAAd,MAAc;AAAA;;AAAd;;CAAc;;AAAd;EAAA,wBAAc;AAAA;;AAAd;;;CAAc;;AAAd;EAAA,0BAAc,EAAd,MAAc;EAAd,aAAc,EAAd,MAAc;AAAA;;AAAd;;CAAc;;AAAd;EAAA,kBAAc;AAAA;;AAAd;;CAAc;;AAAd;;;;;;;;;;;;;EAAA,SAAc;AAAA;;AAAd;EAAA,SAAc;EAAd,UAAc;AAAA;;AAAd;EAAA,UAAc;AAAA;;AAAd;;;EAAA,gBAAc;EAAd,SAAc;EAAd,UAAc;AAAA;;AAAd;;CAAc;AAAd;EAAA,UAAc;AAAA;;AAAd;;CAAc;;AAAd;EAAA,gBAAc;AAAA;;AAAd;;;CAAc;;AAAd;EAAA,UAAc,EAAd,MAAc;EAAd,cAAc,EAAd,MAAc;AAAA;;AAAd;;EAAA,UAAc,EAAd,MAAc;EAAd,cAAc,EAAd,MAAc;AAAA;;AAAd;;CAAc;;AAAd;;EAAA,eAAc;AAAA;;AAAd;;CAAc;AAAd;EAAA,eAAc;AAAA;;AAAd;;;;CAAc;;AAAd;;;;;;;;EAAA,cAAc,EAAd,MAAc;EAAd,sBAAc,EAAd,MAAc;AAAA;;AAAd;;CAAc;;AAAd;;EAAA,eAAc;EAAd,YAAc;AAAA;;AAAd,wEAAc;AAAd;EAAA,aAAc;AAAA;EAAd;IAAA,kBAAc;IAAd,kBAAc;IAAd,iCAAc;IAAd,4BAAc;;IAAd,gCAAc;IAAd,2BAAc;;IAAd,0BAAc;IAAd,wBAAc;IAAd,sBAAc;IAAd,iBAAc;IAAd,qBAAc;;IAAd,mBAAc;;IAAd,gBAAc;EAAA;;EAAd;IAAA;MAAA,qBAAc;MAAd,8BAAc;MAAd,4BAAc;MAAd,kBAAc;MAAd,6BAAc;MAAd,kBAAc;MAAd,mBAAc;IAAA;EAAA;;AAAd;EAAA,wBAAc;EAAd,wBAAc;EAAd,mBAAc;EAAd,mBAAc;EAAd,cAAc;EAAd,cAAc;EAAd,cAAc;EAAd,eAAc;EAAd,eAAc;EAAd,aAAc;EAAd,aAAc;EAAd,kBAAc;EAAd,sCAAc;EAAd,8BAAc;EAAd,6BAAc;EAAd,4BAAc;EAAd,eAAc;EAAd,oBAAc;EAAd,sBAAc;EAAd,uBAAc;EAAd,wBAAc;EAAd,kBAAc;EAAd,2BAAc;EAAd,4BAAc;EAAd,wCAAc;EAAd,0CAAc;EAAd,mCAAc;EAAd,8BAAc;EAAd,sCAAc;EAAd,YAAc;EAAd,kBAAc;EAAd,gBAAc;EAAd,iBAAc;EAAd,kBAAc;EAAd,cAAc;EAAd,gBAAc;EAAd,aAAc;EAAd,mBAAc;EAAd,qBAAc;EAAd,2BAAc;EAAd,yBAAc;EAAd,0BAAc;EAAd,2BAAc;EAAd,uBAAc;EAAd,wBAAc;EAAd,yBAAc;EAAd,sBAAc;EAAd,oBAAc;EAAd,sBAAc;EAAd,qBAAc;EAAd;AAAc;;AAAd;EAAA,wBAAc;EAAd,wBAAc;EAAd,mBAAc;EAAd,mBAAc;EAAd,cAAc;EAAd,cAAc;EAAd,cAAc;EAAd,eAAc;EAAd,eAAc;EAAd,aAAc;EAAd,aAAc;EAAd,kBAAc;EAAd,sCAAc;EAAd,8BAAc;EAAd,6BAAc;EAAd,4BAAc;EAAd,eAAc;EAAd,oBAAc;EAAd,sBAAc;EAAd,uBAAc;EAAd,wBAAc;EAAd,kBAAc;EAAd,2BAAc;EAAd,4BAAc;EAAd,wCAAc;EAAd,0CAAc;EAAd,mCAAc;EAAd,8BAAc;EAAd,sCAAc;EAAd,YAAc;EAAd,kBAAc;EAAd,gBAAc;EAAd,iBAAc;EAAd,kBAAc;EAAd,cAAc;EAAd,gBAAc;EAAd,aAAc;EAAd,mBAAc;EAAd,qBAAc;EAAd,2BAAc;EAAd,yBAAc;EAAd,0BAAc;EAAd,2BAAc;EAAd,uBAAc;EAAd,wBAAc;EAAd,yBAAc;EAAd,sBAAc;EAAd,oBAAc;EAAd,sBAAc;EAAd,qBAAc;EAAd;AAAc;AAEd;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA,mBAAmB;EAAnB;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA,WAAmB;EAAnB;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA,UAAmB;EAAnB;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;;EAAA;IAAA;EAAmB;;EAAnB;IAAA;EAAmB;AAAA;AAAnB;EAAA;AAAmB;AAAnB;EAAA,wBAAmB;KAAnB,qBAAmB;UAAnB;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA,kBAAmB;EAAnB;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA,kBAAmB;EAAnB;AAAmB;AAAnB;EAAA,qBAAmB;EAAnB;AAAmB;AAAnB;EAAA,sBAAmB;EAAnB;AAAmB;AAAnB;EAAA,sBAAmB;EAAnB;AAAmB;AAAnB;EAAA,yBAAmB;EAAnB;AAAmB;AAAnB;EAAA,kBAAmB;EAAnB,wCAAmB;EAAnB;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA,aAAmB;EAAnB;AAAmB;AAAnB;EAAA,aAAmB;EAAnB;AAAmB;AAAnB;EAAA,kBAAmB;EAAnB,mCAAmB;EAAnB,mBAAmB;EAAnB;AAAmB;AAAnB;EAAA,iBAAmB;EAAnB,kCAAmB;EAAnB,oBAAmB;EAAnB;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA,oBAAmB;EAAnB;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA,mBAAmB;EAAnB;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA,WAAmB;EAAnB;AAAmB;AAAnB;EAAA,WAAmB;EAAnB;AAAmB;AAAnB;EAAA,WAAmB;EAAnB;AAAmB;AAAnB;EAAA,WAAmB;EAAnB;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA,uCAAmB;EAAnB,qDAAmB;EAAnB,4EAAmB;EAAnB;AAAmB;AAAnB;EAAA,2CAAmB;EAAnB,yDAAmB;EAAnB,gFAAmB;EAAnB;AAAmB;AAAnB;EAAA,8BAAmB;EAAnB;AAAmB;AAAnB;EAAA,wBAAmB;EAAnB,wDAAmB;EAAnB;AAAmB;AAAnB;EAAA,+FAAmB;EAAnB,wDAAmB;EAAnB;AAAmB;AAAnB;EAAA,4BAAmB;EAAnB,wDAAmB;EAAnB;AAAmB;AAAnB;EAAA,8BAAmB;EAAnB,wDAAmB;EAAnB;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAAnB;EAAA;AAAmB;AAFnB;EAAA,sBAqCA;EArCA,8KAqCA;EArCA;AAqCA;AArCA;EAAA,2BAqCA;EArCA,mLAqCA;EArCA;AAqCA;AArCA;EAAA,kBAqCA;EArCA;AAqCA;AArCA;EAAA,sBAqCA;EArCA;AAqCA;AArCA;EAAA,WAqCA;EArCA;AAqCA;AArCA;EAAA,kBAqCA;EArCA;AAqCA;AArCA;EAAA;AAqCA;AArCA;EAAA,qBAqCA;EArCA;AAqCA;AArCA;EAAA,yBAqCA;EArCA;AAqCA;AArCA;EAAA,WAqCA;EArCA;AAqCA;AArCA;EAAA;AAqCA;AArCA;;EAAA;IAAA;EAqCA;AAAA","sourcesContent":["@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\n@layer base {\n  :root {\n    --background: #fff;\n    --foreground: #000;\n    --unfocused-border-color: #eaeaea;\n    --focused-border-color: #666;\n\n    --button-disabled-color: #fafafa;\n    --disabled-text-color: #999;\n\n    --geist-border-radius: 5px;\n    --geist-quarter-pad: 6px;\n    --geist-half-pad: 12px;\n    --geist-pad: 24px;\n    --geist-font: \"Inter\";\n\n    --geist-error: #e00;\n\n    --subtitle: #666;\n  }\n\n  @media (prefers-color-scheme: dark) {\n    :root {\n      --background: #000000;\n      --unfocused-border-color: #333;\n      --focused-border-color: #888;\n      --foreground: #fff;\n      --button-disabled-color: #111;\n      --geist-error: red;\n      --subtitle: #8d8d8d;\n    }\n  }\n}\n"],"sourceRoot":""}]);
// Exports
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (___CSS_LOADER_EXPORT___);


/***/ }),

/***/ 23645:
/***/ ((module) => {



/*
  MIT License http://www.opensource.org/licenses/mit-license.php
  Author Tobias Koppers @sokra
*/
// css base code, injected by the css-loader
// eslint-disable-next-line func-names
module.exports = function (cssWithMappingToString) {
  var list = []; // return the list of modules as css string

  list.toString = function toString() {
    return this.map(function (item) {
      var content = cssWithMappingToString(item);

      if (item[2]) {
        return "@media ".concat(item[2], " {").concat(content, "}");
      }

      return content;
    }).join("");
  }; // import a list of modules into the list
  // eslint-disable-next-line func-names


  list.i = function (modules, mediaQuery, dedupe) {
    if (typeof modules === "string") {
      // eslint-disable-next-line no-param-reassign
      modules = [[null, modules, ""]];
    }

    var alreadyImportedModules = {};

    if (dedupe) {
      for (var i = 0; i < this.length; i++) {
        // eslint-disable-next-line prefer-destructuring
        var id = this[i][0];

        if (id != null) {
          alreadyImportedModules[id] = true;
        }
      }
    }

    for (var _i = 0; _i < modules.length; _i++) {
      var item = [].concat(modules[_i]);

      if (dedupe && alreadyImportedModules[item[0]]) {
        // eslint-disable-next-line no-continue
        continue;
      }

      if (mediaQuery) {
        if (!item[2]) {
          item[2] = mediaQuery;
        } else {
          item[2] = "".concat(mediaQuery, " and ").concat(item[2]);
        }
      }

      list.push(item);
    }
  };

  return list;
};

/***/ }),

/***/ 94015:
/***/ ((module) => {



function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _iterableToArrayLimit(arr, i) { var _i = arr && (typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"]); if (_i == null) return; var _arr = []; var _n = true; var _d = false; var _s, _e; try { for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

module.exports = function cssWithMappingToString(item) {
  var _item = _slicedToArray(item, 4),
      content = _item[1],
      cssMapping = _item[3];

  if (!cssMapping) {
    return content;
  }

  if (typeof btoa === "function") {
    // eslint-disable-next-line no-undef
    var base64 = btoa(unescape(encodeURIComponent(JSON.stringify(cssMapping))));
    var data = "sourceMappingURL=data:application/json;charset=utf-8;base64,".concat(base64);
    var sourceMapping = "/*# ".concat(data, " */");
    var sourceURLs = cssMapping.sources.map(function (source) {
      return "/*# sourceURL=".concat(cssMapping.sourceRoot || "").concat(source, " */");
    });
    return [content].concat(sourceURLs).concat([sourceMapping]).join("\n");
  }

  return [content].join("\n");
};

/***/ }),

/***/ 64448:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

/**
 * @license React
 * react-dom.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
/*
 Modernizr 3.0.0pre (Custom Build) | MIT
*/
var aa=__webpack_require__(67294),ca=__webpack_require__(63840);function p(a){for(var b="https://reactjs.org/docs/error-decoder.html?invariant="+a,c=1;c<arguments.length;c++)b+="&args[]="+encodeURIComponent(arguments[c]);return"Minified React error #"+a+"; visit "+b+" for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}var da=new Set,ea={};function fa(a,b){ha(a,b);ha(a+"Capture",b)}
function ha(a,b){ea[a]=b;for(a=0;a<b.length;a++)da.add(b[a])}
var ia=!("undefined"===typeof window||"undefined"===typeof window.document||"undefined"===typeof window.document.createElement),ja=Object.prototype.hasOwnProperty,ka=/^[:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD][:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\-.0-9\u00B7\u0300-\u036F\u203F-\u2040]*$/,la=
{},ma={};function oa(a){if(ja.call(ma,a))return!0;if(ja.call(la,a))return!1;if(ka.test(a))return ma[a]=!0;la[a]=!0;return!1}function pa(a,b,c,d){if(null!==c&&0===c.type)return!1;switch(typeof b){case "function":case "symbol":return!0;case "boolean":if(d)return!1;if(null!==c)return!c.acceptsBooleans;a=a.toLowerCase().slice(0,5);return"data-"!==a&&"aria-"!==a;default:return!1}}
function qa(a,b,c,d){if(null===b||"undefined"===typeof b||pa(a,b,c,d))return!0;if(d)return!1;if(null!==c)switch(c.type){case 3:return!b;case 4:return!1===b;case 5:return isNaN(b);case 6:return isNaN(b)||1>b}return!1}function v(a,b,c,d,e,f,g){this.acceptsBooleans=2===b||3===b||4===b;this.attributeName=d;this.attributeNamespace=e;this.mustUseProperty=c;this.propertyName=a;this.type=b;this.sanitizeURL=f;this.removeEmptyString=g}var z={};
"children dangerouslySetInnerHTML defaultValue defaultChecked innerHTML suppressContentEditableWarning suppressHydrationWarning style".split(" ").forEach(function(a){z[a]=new v(a,0,!1,a,null,!1,!1)});[["acceptCharset","accept-charset"],["className","class"],["htmlFor","for"],["httpEquiv","http-equiv"]].forEach(function(a){var b=a[0];z[b]=new v(b,1,!1,a[1],null,!1,!1)});["contentEditable","draggable","spellCheck","value"].forEach(function(a){z[a]=new v(a,2,!1,a.toLowerCase(),null,!1,!1)});
["autoReverse","externalResourcesRequired","focusable","preserveAlpha"].forEach(function(a){z[a]=new v(a,2,!1,a,null,!1,!1)});"allowFullScreen async autoFocus autoPlay controls default defer disabled disablePictureInPicture disableRemotePlayback formNoValidate hidden loop noModule noValidate open playsInline readOnly required reversed scoped seamless itemScope".split(" ").forEach(function(a){z[a]=new v(a,3,!1,a.toLowerCase(),null,!1,!1)});
["checked","multiple","muted","selected"].forEach(function(a){z[a]=new v(a,3,!0,a,null,!1,!1)});["capture","download"].forEach(function(a){z[a]=new v(a,4,!1,a,null,!1,!1)});["cols","rows","size","span"].forEach(function(a){z[a]=new v(a,6,!1,a,null,!1,!1)});["rowSpan","start"].forEach(function(a){z[a]=new v(a,5,!1,a.toLowerCase(),null,!1,!1)});var ra=/[\-:]([a-z])/g;function sa(a){return a[1].toUpperCase()}
"accent-height alignment-baseline arabic-form baseline-shift cap-height clip-path clip-rule color-interpolation color-interpolation-filters color-profile color-rendering dominant-baseline enable-background fill-opacity fill-rule flood-color flood-opacity font-family font-size font-size-adjust font-stretch font-style font-variant font-weight glyph-name glyph-orientation-horizontal glyph-orientation-vertical horiz-adv-x horiz-origin-x image-rendering letter-spacing lighting-color marker-end marker-mid marker-start overline-position overline-thickness paint-order panose-1 pointer-events rendering-intent shape-rendering stop-color stop-opacity strikethrough-position strikethrough-thickness stroke-dasharray stroke-dashoffset stroke-linecap stroke-linejoin stroke-miterlimit stroke-opacity stroke-width text-anchor text-decoration text-rendering underline-position underline-thickness unicode-bidi unicode-range units-per-em v-alphabetic v-hanging v-ideographic v-mathematical vector-effect vert-adv-y vert-origin-x vert-origin-y word-spacing writing-mode xmlns:xlink x-height".split(" ").forEach(function(a){var b=a.replace(ra,
sa);z[b]=new v(b,1,!1,a,null,!1,!1)});"xlink:actuate xlink:arcrole xlink:role xlink:show xlink:title xlink:type".split(" ").forEach(function(a){var b=a.replace(ra,sa);z[b]=new v(b,1,!1,a,"http://www.w3.org/1999/xlink",!1,!1)});["xml:base","xml:lang","xml:space"].forEach(function(a){var b=a.replace(ra,sa);z[b]=new v(b,1,!1,a,"http://www.w3.org/XML/1998/namespace",!1,!1)});["tabIndex","crossOrigin"].forEach(function(a){z[a]=new v(a,1,!1,a.toLowerCase(),null,!1,!1)});
z.xlinkHref=new v("xlinkHref",1,!1,"xlink:href","http://www.w3.org/1999/xlink",!0,!1);["src","href","action","formAction"].forEach(function(a){z[a]=new v(a,1,!1,a.toLowerCase(),null,!0,!0)});
function ta(a,b,c,d){var e=z.hasOwnProperty(b)?z[b]:null;if(null!==e?0!==e.type:d||!(2<b.length)||"o"!==b[0]&&"O"!==b[0]||"n"!==b[1]&&"N"!==b[1])qa(b,c,e,d)&&(c=null),d||null===e?oa(b)&&(null===c?a.removeAttribute(b):a.setAttribute(b,""+c)):e.mustUseProperty?a[e.propertyName]=null===c?3===e.type?!1:"":c:(b=e.attributeName,d=e.attributeNamespace,null===c?a.removeAttribute(b):(e=e.type,c=3===e||4===e&&!0===c?"":""+c,d?a.setAttributeNS(d,b,c):a.setAttribute(b,c)))}
var ua=aa.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED,va=Symbol.for("react.element"),wa=Symbol.for("react.portal"),ya=Symbol.for("react.fragment"),za=Symbol.for("react.strict_mode"),Aa=Symbol.for("react.profiler"),Ba=Symbol.for("react.provider"),Ca=Symbol.for("react.context"),Da=Symbol.for("react.forward_ref"),Ea=Symbol.for("react.suspense"),Fa=Symbol.for("react.suspense_list"),Ga=Symbol.for("react.memo"),Ha=Symbol.for("react.lazy");Symbol.for("react.scope");Symbol.for("react.debug_trace_mode");
var Ia=Symbol.for("react.offscreen");Symbol.for("react.legacy_hidden");Symbol.for("react.cache");Symbol.for("react.tracing_marker");var Ja=Symbol.iterator;function Ka(a){if(null===a||"object"!==typeof a)return null;a=Ja&&a[Ja]||a["@@iterator"];return"function"===typeof a?a:null}var A=Object.assign,La;function Ma(a){if(void 0===La)try{throw Error();}catch(c){var b=c.stack.trim().match(/\n( *(at )?)/);La=b&&b[1]||""}return"\n"+La+a}var Na=!1;
function Oa(a,b){if(!a||Na)return"";Na=!0;var c=Error.prepareStackTrace;Error.prepareStackTrace=void 0;try{if(b)if(b=function(){throw Error();},Object.defineProperty(b.prototype,"props",{set:function(){throw Error();}}),"object"===typeof Reflect&&Reflect.construct){try{Reflect.construct(b,[])}catch(l){var d=l}Reflect.construct(a,[],b)}else{try{b.call()}catch(l){d=l}a.call(b.prototype)}else{try{throw Error();}catch(l){d=l}a()}}catch(l){if(l&&d&&"string"===typeof l.stack){for(var e=l.stack.split("\n"),
f=d.stack.split("\n"),g=e.length-1,h=f.length-1;1<=g&&0<=h&&e[g]!==f[h];)h--;for(;1<=g&&0<=h;g--,h--)if(e[g]!==f[h]){if(1!==g||1!==h){do if(g--,h--,0>h||e[g]!==f[h]){var k="\n"+e[g].replace(" at new "," at ");a.displayName&&k.includes("<anonymous>")&&(k=k.replace("<anonymous>",a.displayName));return k}while(1<=g&&0<=h)}break}}}finally{Na=!1,Error.prepareStackTrace=c}return(a=a?a.displayName||a.name:"")?Ma(a):""}
function Pa(a){switch(a.tag){case 5:return Ma(a.type);case 16:return Ma("Lazy");case 13:return Ma("Suspense");case 19:return Ma("SuspenseList");case 0:case 2:case 15:return a=Oa(a.type,!1),a;case 11:return a=Oa(a.type.render,!1),a;case 1:return a=Oa(a.type,!0),a;default:return""}}
function Qa(a){if(null==a)return null;if("function"===typeof a)return a.displayName||a.name||null;if("string"===typeof a)return a;switch(a){case ya:return"Fragment";case wa:return"Portal";case Aa:return"Profiler";case za:return"StrictMode";case Ea:return"Suspense";case Fa:return"SuspenseList"}if("object"===typeof a)switch(a.$$typeof){case Ca:return(a.displayName||"Context")+".Consumer";case Ba:return(a._context.displayName||"Context")+".Provider";case Da:var b=a.render;a=a.displayName;a||(a=b.displayName||
b.name||"",a=""!==a?"ForwardRef("+a+")":"ForwardRef");return a;case Ga:return b=a.displayName||null,null!==b?b:Qa(a.type)||"Memo";case Ha:b=a._payload;a=a._init;try{return Qa(a(b))}catch(c){}}return null}
function Ra(a){var b=a.type;switch(a.tag){case 24:return"Cache";case 9:return(b.displayName||"Context")+".Consumer";case 10:return(b._context.displayName||"Context")+".Provider";case 18:return"DehydratedFragment";case 11:return a=b.render,a=a.displayName||a.name||"",b.displayName||(""!==a?"ForwardRef("+a+")":"ForwardRef");case 7:return"Fragment";case 5:return b;case 4:return"Portal";case 3:return"Root";case 6:return"Text";case 16:return Qa(b);case 8:return b===za?"StrictMode":"Mode";case 22:return"Offscreen";
case 12:return"Profiler";case 21:return"Scope";case 13:return"Suspense";case 19:return"SuspenseList";case 25:return"TracingMarker";case 1:case 0:case 17:case 2:case 14:case 15:if("function"===typeof b)return b.displayName||b.name||null;if("string"===typeof b)return b}return null}function Sa(a){switch(typeof a){case "boolean":case "number":case "string":case "undefined":return a;case "object":return a;default:return""}}
function Ta(a){var b=a.type;return(a=a.nodeName)&&"input"===a.toLowerCase()&&("checkbox"===b||"radio"===b)}
function Ua(a){var b=Ta(a)?"checked":"value",c=Object.getOwnPropertyDescriptor(a.constructor.prototype,b),d=""+a[b];if(!a.hasOwnProperty(b)&&"undefined"!==typeof c&&"function"===typeof c.get&&"function"===typeof c.set){var e=c.get,f=c.set;Object.defineProperty(a,b,{configurable:!0,get:function(){return e.call(this)},set:function(a){d=""+a;f.call(this,a)}});Object.defineProperty(a,b,{enumerable:c.enumerable});return{getValue:function(){return d},setValue:function(a){d=""+a},stopTracking:function(){a._valueTracker=
null;delete a[b]}}}}function Va(a){a._valueTracker||(a._valueTracker=Ua(a))}function Wa(a){if(!a)return!1;var b=a._valueTracker;if(!b)return!0;var c=b.getValue();var d="";a&&(d=Ta(a)?a.checked?"true":"false":a.value);a=d;return a!==c?(b.setValue(a),!0):!1}function Xa(a){a=a||("undefined"!==typeof document?document:void 0);if("undefined"===typeof a)return null;try{return a.activeElement||a.body}catch(b){return a.body}}
function Ya(a,b){var c=b.checked;return A({},b,{defaultChecked:void 0,defaultValue:void 0,value:void 0,checked:null!=c?c:a._wrapperState.initialChecked})}function Za(a,b){var c=null==b.defaultValue?"":b.defaultValue,d=null!=b.checked?b.checked:b.defaultChecked;c=Sa(null!=b.value?b.value:c);a._wrapperState={initialChecked:d,initialValue:c,controlled:"checkbox"===b.type||"radio"===b.type?null!=b.checked:null!=b.value}}function ab(a,b){b=b.checked;null!=b&&ta(a,"checked",b,!1)}
function bb(a,b){ab(a,b);var c=Sa(b.value),d=b.type;if(null!=c)if("number"===d){if(0===c&&""===a.value||a.value!=c)a.value=""+c}else a.value!==""+c&&(a.value=""+c);else if("submit"===d||"reset"===d){a.removeAttribute("value");return}b.hasOwnProperty("value")?cb(a,b.type,c):b.hasOwnProperty("defaultValue")&&cb(a,b.type,Sa(b.defaultValue));null==b.checked&&null!=b.defaultChecked&&(a.defaultChecked=!!b.defaultChecked)}
function db(a,b,c){if(b.hasOwnProperty("value")||b.hasOwnProperty("defaultValue")){var d=b.type;if(!("submit"!==d&&"reset"!==d||void 0!==b.value&&null!==b.value))return;b=""+a._wrapperState.initialValue;c||b===a.value||(a.value=b);a.defaultValue=b}c=a.name;""!==c&&(a.name="");a.defaultChecked=!!a._wrapperState.initialChecked;""!==c&&(a.name=c)}
function cb(a,b,c){if("number"!==b||Xa(a.ownerDocument)!==a)null==c?a.defaultValue=""+a._wrapperState.initialValue:a.defaultValue!==""+c&&(a.defaultValue=""+c)}var eb=Array.isArray;
function fb(a,b,c,d){a=a.options;if(b){b={};for(var e=0;e<c.length;e++)b["$"+c[e]]=!0;for(c=0;c<a.length;c++)e=b.hasOwnProperty("$"+a[c].value),a[c].selected!==e&&(a[c].selected=e),e&&d&&(a[c].defaultSelected=!0)}else{c=""+Sa(c);b=null;for(e=0;e<a.length;e++){if(a[e].value===c){a[e].selected=!0;d&&(a[e].defaultSelected=!0);return}null!==b||a[e].disabled||(b=a[e])}null!==b&&(b.selected=!0)}}
function gb(a,b){if(null!=b.dangerouslySetInnerHTML)throw Error(p(91));return A({},b,{value:void 0,defaultValue:void 0,children:""+a._wrapperState.initialValue})}function hb(a,b){var c=b.value;if(null==c){c=b.children;b=b.defaultValue;if(null!=c){if(null!=b)throw Error(p(92));if(eb(c)){if(1<c.length)throw Error(p(93));c=c[0]}b=c}null==b&&(b="");c=b}a._wrapperState={initialValue:Sa(c)}}
function ib(a,b){var c=Sa(b.value),d=Sa(b.defaultValue);null!=c&&(c=""+c,c!==a.value&&(a.value=c),null==b.defaultValue&&a.defaultValue!==c&&(a.defaultValue=c));null!=d&&(a.defaultValue=""+d)}function jb(a){var b=a.textContent;b===a._wrapperState.initialValue&&""!==b&&null!==b&&(a.value=b)}function kb(a){switch(a){case "svg":return"http://www.w3.org/2000/svg";case "math":return"http://www.w3.org/1998/Math/MathML";default:return"http://www.w3.org/1999/xhtml"}}
function lb(a,b){return null==a||"http://www.w3.org/1999/xhtml"===a?kb(b):"http://www.w3.org/2000/svg"===a&&"foreignObject"===b?"http://www.w3.org/1999/xhtml":a}
var mb,nb=function(a){return"undefined"!==typeof MSApp&&MSApp.execUnsafeLocalFunction?function(b,c,d,e){MSApp.execUnsafeLocalFunction(function(){return a(b,c,d,e)})}:a}(function(a,b){if("http://www.w3.org/2000/svg"!==a.namespaceURI||"innerHTML"in a)a.innerHTML=b;else{mb=mb||document.createElement("div");mb.innerHTML="<svg>"+b.valueOf().toString()+"</svg>";for(b=mb.firstChild;a.firstChild;)a.removeChild(a.firstChild);for(;b.firstChild;)a.appendChild(b.firstChild)}});
function ob(a,b){if(b){var c=a.firstChild;if(c&&c===a.lastChild&&3===c.nodeType){c.nodeValue=b;return}}a.textContent=b}
var pb={animationIterationCount:!0,aspectRatio:!0,borderImageOutset:!0,borderImageSlice:!0,borderImageWidth:!0,boxFlex:!0,boxFlexGroup:!0,boxOrdinalGroup:!0,columnCount:!0,columns:!0,flex:!0,flexGrow:!0,flexPositive:!0,flexShrink:!0,flexNegative:!0,flexOrder:!0,gridArea:!0,gridRow:!0,gridRowEnd:!0,gridRowSpan:!0,gridRowStart:!0,gridColumn:!0,gridColumnEnd:!0,gridColumnSpan:!0,gridColumnStart:!0,fontWeight:!0,lineClamp:!0,lineHeight:!0,opacity:!0,order:!0,orphans:!0,tabSize:!0,widows:!0,zIndex:!0,
zoom:!0,fillOpacity:!0,floodOpacity:!0,stopOpacity:!0,strokeDasharray:!0,strokeDashoffset:!0,strokeMiterlimit:!0,strokeOpacity:!0,strokeWidth:!0},qb=["Webkit","ms","Moz","O"];Object.keys(pb).forEach(function(a){qb.forEach(function(b){b=b+a.charAt(0).toUpperCase()+a.substring(1);pb[b]=pb[a]})});function rb(a,b,c){return null==b||"boolean"===typeof b||""===b?"":c||"number"!==typeof b||0===b||pb.hasOwnProperty(a)&&pb[a]?(""+b).trim():b+"px"}
function sb(a,b){a=a.style;for(var c in b)if(b.hasOwnProperty(c)){var d=0===c.indexOf("--"),e=rb(c,b[c],d);"float"===c&&(c="cssFloat");d?a.setProperty(c,e):a[c]=e}}var tb=A({menuitem:!0},{area:!0,base:!0,br:!0,col:!0,embed:!0,hr:!0,img:!0,input:!0,keygen:!0,link:!0,meta:!0,param:!0,source:!0,track:!0,wbr:!0});
function ub(a,b){if(b){if(tb[a]&&(null!=b.children||null!=b.dangerouslySetInnerHTML))throw Error(p(137,a));if(null!=b.dangerouslySetInnerHTML){if(null!=b.children)throw Error(p(60));if("object"!==typeof b.dangerouslySetInnerHTML||!("__html"in b.dangerouslySetInnerHTML))throw Error(p(61));}if(null!=b.style&&"object"!==typeof b.style)throw Error(p(62));}}
function vb(a,b){if(-1===a.indexOf("-"))return"string"===typeof b.is;switch(a){case "annotation-xml":case "color-profile":case "font-face":case "font-face-src":case "font-face-uri":case "font-face-format":case "font-face-name":case "missing-glyph":return!1;default:return!0}}var wb=null;function xb(a){a=a.target||a.srcElement||window;a.correspondingUseElement&&(a=a.correspondingUseElement);return 3===a.nodeType?a.parentNode:a}var yb=null,zb=null,Ab=null;
function Bb(a){if(a=Cb(a)){if("function"!==typeof yb)throw Error(p(280));var b=a.stateNode;b&&(b=Db(b),yb(a.stateNode,a.type,b))}}function Eb(a){zb?Ab?Ab.push(a):Ab=[a]:zb=a}function Fb(){if(zb){var a=zb,b=Ab;Ab=zb=null;Bb(a);if(b)for(a=0;a<b.length;a++)Bb(b[a])}}function Gb(a,b){return a(b)}function Hb(){}var Ib=!1;function Jb(a,b,c){if(Ib)return a(b,c);Ib=!0;try{return Gb(a,b,c)}finally{if(Ib=!1,null!==zb||null!==Ab)Hb(),Fb()}}
function Kb(a,b){var c=a.stateNode;if(null===c)return null;var d=Db(c);if(null===d)return null;c=d[b];a:switch(b){case "onClick":case "onClickCapture":case "onDoubleClick":case "onDoubleClickCapture":case "onMouseDown":case "onMouseDownCapture":case "onMouseMove":case "onMouseMoveCapture":case "onMouseUp":case "onMouseUpCapture":case "onMouseEnter":(d=!d.disabled)||(a=a.type,d=!("button"===a||"input"===a||"select"===a||"textarea"===a));a=!d;break a;default:a=!1}if(a)return null;if(c&&"function"!==
typeof c)throw Error(p(231,b,typeof c));return c}var Lb=!1;if(ia)try{var Mb={};Object.defineProperty(Mb,"passive",{get:function(){Lb=!0}});window.addEventListener("test",Mb,Mb);window.removeEventListener("test",Mb,Mb)}catch(a){Lb=!1}function Nb(a,b,c,d,e,f,g,h,k){var l=Array.prototype.slice.call(arguments,3);try{b.apply(c,l)}catch(m){this.onError(m)}}var Ob=!1,Pb=null,Qb=!1,Rb=null,Sb={onError:function(a){Ob=!0;Pb=a}};function Tb(a,b,c,d,e,f,g,h,k){Ob=!1;Pb=null;Nb.apply(Sb,arguments)}
function Ub(a,b,c,d,e,f,g,h,k){Tb.apply(this,arguments);if(Ob){if(Ob){var l=Pb;Ob=!1;Pb=null}else throw Error(p(198));Qb||(Qb=!0,Rb=l)}}function Vb(a){var b=a,c=a;if(a.alternate)for(;b.return;)b=b.return;else{a=b;do b=a,0!==(b.flags&4098)&&(c=b.return),a=b.return;while(a)}return 3===b.tag?c:null}function Wb(a){if(13===a.tag){var b=a.memoizedState;null===b&&(a=a.alternate,null!==a&&(b=a.memoizedState));if(null!==b)return b.dehydrated}return null}function Xb(a){if(Vb(a)!==a)throw Error(p(188));}
function Yb(a){var b=a.alternate;if(!b){b=Vb(a);if(null===b)throw Error(p(188));return b!==a?null:a}for(var c=a,d=b;;){var e=c.return;if(null===e)break;var f=e.alternate;if(null===f){d=e.return;if(null!==d){c=d;continue}break}if(e.child===f.child){for(f=e.child;f;){if(f===c)return Xb(e),a;if(f===d)return Xb(e),b;f=f.sibling}throw Error(p(188));}if(c.return!==d.return)c=e,d=f;else{for(var g=!1,h=e.child;h;){if(h===c){g=!0;c=e;d=f;break}if(h===d){g=!0;d=e;c=f;break}h=h.sibling}if(!g){for(h=f.child;h;){if(h===
c){g=!0;c=f;d=e;break}if(h===d){g=!0;d=f;c=e;break}h=h.sibling}if(!g)throw Error(p(189));}}if(c.alternate!==d)throw Error(p(190));}if(3!==c.tag)throw Error(p(188));return c.stateNode.current===c?a:b}function Zb(a){a=Yb(a);return null!==a?$b(a):null}function $b(a){if(5===a.tag||6===a.tag)return a;for(a=a.child;null!==a;){var b=$b(a);if(null!==b)return b;a=a.sibling}return null}
var ac=ca.unstable_scheduleCallback,bc=ca.unstable_cancelCallback,cc=ca.unstable_shouldYield,dc=ca.unstable_requestPaint,B=ca.unstable_now,ec=ca.unstable_getCurrentPriorityLevel,fc=ca.unstable_ImmediatePriority,gc=ca.unstable_UserBlockingPriority,hc=ca.unstable_NormalPriority,ic=ca.unstable_LowPriority,jc=ca.unstable_IdlePriority,kc=null,lc=null;function mc(a){if(lc&&"function"===typeof lc.onCommitFiberRoot)try{lc.onCommitFiberRoot(kc,a,void 0,128===(a.current.flags&128))}catch(b){}}
var oc=Math.clz32?Math.clz32:nc,pc=Math.log,qc=Math.LN2;function nc(a){a>>>=0;return 0===a?32:31-(pc(a)/qc|0)|0}var rc=64,sc=4194304;
function tc(a){switch(a&-a){case 1:return 1;case 2:return 2;case 4:return 4;case 8:return 8;case 16:return 16;case 32:return 32;case 64:case 128:case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:return a&4194240;case 4194304:case 8388608:case 16777216:case 33554432:case 67108864:return a&130023424;case 134217728:return 134217728;case 268435456:return 268435456;case 536870912:return 536870912;case 1073741824:return 1073741824;
default:return a}}function uc(a,b){var c=a.pendingLanes;if(0===c)return 0;var d=0,e=a.suspendedLanes,f=a.pingedLanes,g=c&268435455;if(0!==g){var h=g&~e;0!==h?d=tc(h):(f&=g,0!==f&&(d=tc(f)))}else g=c&~e,0!==g?d=tc(g):0!==f&&(d=tc(f));if(0===d)return 0;if(0!==b&&b!==d&&0===(b&e)&&(e=d&-d,f=b&-b,e>=f||16===e&&0!==(f&4194240)))return b;0!==(d&4)&&(d|=c&16);b=a.entangledLanes;if(0!==b)for(a=a.entanglements,b&=d;0<b;)c=31-oc(b),e=1<<c,d|=a[c],b&=~e;return d}
function vc(a,b){switch(a){case 1:case 2:case 4:return b+250;case 8:case 16:case 32:case 64:case 128:case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:return b+5E3;case 4194304:case 8388608:case 16777216:case 33554432:case 67108864:return-1;case 134217728:case 268435456:case 536870912:case 1073741824:return-1;default:return-1}}
function wc(a,b){for(var c=a.suspendedLanes,d=a.pingedLanes,e=a.expirationTimes,f=a.pendingLanes;0<f;){var g=31-oc(f),h=1<<g,k=e[g];if(-1===k){if(0===(h&c)||0!==(h&d))e[g]=vc(h,b)}else k<=b&&(a.expiredLanes|=h);f&=~h}}function xc(a){a=a.pendingLanes&-1073741825;return 0!==a?a:a&1073741824?1073741824:0}function yc(){var a=rc;rc<<=1;0===(rc&4194240)&&(rc=64);return a}function zc(a){for(var b=[],c=0;31>c;c++)b.push(a);return b}
function Ac(a,b,c){a.pendingLanes|=b;536870912!==b&&(a.suspendedLanes=0,a.pingedLanes=0);a=a.eventTimes;b=31-oc(b);a[b]=c}function Bc(a,b){var c=a.pendingLanes&~b;a.pendingLanes=b;a.suspendedLanes=0;a.pingedLanes=0;a.expiredLanes&=b;a.mutableReadLanes&=b;a.entangledLanes&=b;b=a.entanglements;var d=a.eventTimes;for(a=a.expirationTimes;0<c;){var e=31-oc(c),f=1<<e;b[e]=0;d[e]=-1;a[e]=-1;c&=~f}}
function Cc(a,b){var c=a.entangledLanes|=b;for(a=a.entanglements;c;){var d=31-oc(c),e=1<<d;e&b|a[d]&b&&(a[d]|=b);c&=~e}}var C=0;function Dc(a){a&=-a;return 1<a?4<a?0!==(a&268435455)?16:536870912:4:1}var Ec,Fc,Gc,Hc,Ic,Jc=!1,Kc=[],Lc=null,Mc=null,Nc=null,Oc=new Map,Pc=new Map,Qc=[],Rc="mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset submit".split(" ");
function Sc(a,b){switch(a){case "focusin":case "focusout":Lc=null;break;case "dragenter":case "dragleave":Mc=null;break;case "mouseover":case "mouseout":Nc=null;break;case "pointerover":case "pointerout":Oc.delete(b.pointerId);break;case "gotpointercapture":case "lostpointercapture":Pc.delete(b.pointerId)}}
function Tc(a,b,c,d,e,f){if(null===a||a.nativeEvent!==f)return a={blockedOn:b,domEventName:c,eventSystemFlags:d,nativeEvent:f,targetContainers:[e]},null!==b&&(b=Cb(b),null!==b&&Fc(b)),a;a.eventSystemFlags|=d;b=a.targetContainers;null!==e&&-1===b.indexOf(e)&&b.push(e);return a}
function Uc(a,b,c,d,e){switch(b){case "focusin":return Lc=Tc(Lc,a,b,c,d,e),!0;case "dragenter":return Mc=Tc(Mc,a,b,c,d,e),!0;case "mouseover":return Nc=Tc(Nc,a,b,c,d,e),!0;case "pointerover":var f=e.pointerId;Oc.set(f,Tc(Oc.get(f)||null,a,b,c,d,e));return!0;case "gotpointercapture":return f=e.pointerId,Pc.set(f,Tc(Pc.get(f)||null,a,b,c,d,e)),!0}return!1}
function Vc(a){var b=Wc(a.target);if(null!==b){var c=Vb(b);if(null!==c)if(b=c.tag,13===b){if(b=Wb(c),null!==b){a.blockedOn=b;Ic(a.priority,function(){Gc(c)});return}}else if(3===b&&c.stateNode.current.memoizedState.isDehydrated){a.blockedOn=3===c.tag?c.stateNode.containerInfo:null;return}}a.blockedOn=null}
function Xc(a){if(null!==a.blockedOn)return!1;for(var b=a.targetContainers;0<b.length;){var c=Yc(a.domEventName,a.eventSystemFlags,b[0],a.nativeEvent);if(null===c){c=a.nativeEvent;var d=new c.constructor(c.type,c);wb=d;c.target.dispatchEvent(d);wb=null}else return b=Cb(c),null!==b&&Fc(b),a.blockedOn=c,!1;b.shift()}return!0}function Zc(a,b,c){Xc(a)&&c.delete(b)}function $c(){Jc=!1;null!==Lc&&Xc(Lc)&&(Lc=null);null!==Mc&&Xc(Mc)&&(Mc=null);null!==Nc&&Xc(Nc)&&(Nc=null);Oc.forEach(Zc);Pc.forEach(Zc)}
function ad(a,b){a.blockedOn===b&&(a.blockedOn=null,Jc||(Jc=!0,ca.unstable_scheduleCallback(ca.unstable_NormalPriority,$c)))}
function bd(a){function b(b){return ad(b,a)}if(0<Kc.length){ad(Kc[0],a);for(var c=1;c<Kc.length;c++){var d=Kc[c];d.blockedOn===a&&(d.blockedOn=null)}}null!==Lc&&ad(Lc,a);null!==Mc&&ad(Mc,a);null!==Nc&&ad(Nc,a);Oc.forEach(b);Pc.forEach(b);for(c=0;c<Qc.length;c++)d=Qc[c],d.blockedOn===a&&(d.blockedOn=null);for(;0<Qc.length&&(c=Qc[0],null===c.blockedOn);)Vc(c),null===c.blockedOn&&Qc.shift()}var cd=ua.ReactCurrentBatchConfig,dd=!0;
function ed(a,b,c,d){var e=C,f=cd.transition;cd.transition=null;try{C=1,fd(a,b,c,d)}finally{C=e,cd.transition=f}}function gd(a,b,c,d){var e=C,f=cd.transition;cd.transition=null;try{C=4,fd(a,b,c,d)}finally{C=e,cd.transition=f}}
function fd(a,b,c,d){if(dd){var e=Yc(a,b,c,d);if(null===e)hd(a,b,d,id,c),Sc(a,d);else if(Uc(e,a,b,c,d))d.stopPropagation();else if(Sc(a,d),b&4&&-1<Rc.indexOf(a)){for(;null!==e;){var f=Cb(e);null!==f&&Ec(f);f=Yc(a,b,c,d);null===f&&hd(a,b,d,id,c);if(f===e)break;e=f}null!==e&&d.stopPropagation()}else hd(a,b,d,null,c)}}var id=null;
function Yc(a,b,c,d){id=null;a=xb(d);a=Wc(a);if(null!==a)if(b=Vb(a),null===b)a=null;else if(c=b.tag,13===c){a=Wb(b);if(null!==a)return a;a=null}else if(3===c){if(b.stateNode.current.memoizedState.isDehydrated)return 3===b.tag?b.stateNode.containerInfo:null;a=null}else b!==a&&(a=null);id=a;return null}
function jd(a){switch(a){case "cancel":case "click":case "close":case "contextmenu":case "copy":case "cut":case "auxclick":case "dblclick":case "dragend":case "dragstart":case "drop":case "focusin":case "focusout":case "input":case "invalid":case "keydown":case "keypress":case "keyup":case "mousedown":case "mouseup":case "paste":case "pause":case "play":case "pointercancel":case "pointerdown":case "pointerup":case "ratechange":case "reset":case "resize":case "seeked":case "submit":case "touchcancel":case "touchend":case "touchstart":case "volumechange":case "change":case "selectionchange":case "textInput":case "compositionstart":case "compositionend":case "compositionupdate":case "beforeblur":case "afterblur":case "beforeinput":case "blur":case "fullscreenchange":case "focus":case "hashchange":case "popstate":case "select":case "selectstart":return 1;case "drag":case "dragenter":case "dragexit":case "dragleave":case "dragover":case "mousemove":case "mouseout":case "mouseover":case "pointermove":case "pointerout":case "pointerover":case "scroll":case "toggle":case "touchmove":case "wheel":case "mouseenter":case "mouseleave":case "pointerenter":case "pointerleave":return 4;
case "message":switch(ec()){case fc:return 1;case gc:return 4;case hc:case ic:return 16;case jc:return 536870912;default:return 16}default:return 16}}var kd=null,ld=null,md=null;function nd(){if(md)return md;var a,b=ld,c=b.length,d,e="value"in kd?kd.value:kd.textContent,f=e.length;for(a=0;a<c&&b[a]===e[a];a++);var g=c-a;for(d=1;d<=g&&b[c-d]===e[f-d];d++);return md=e.slice(a,1<d?1-d:void 0)}
function od(a){var b=a.keyCode;"charCode"in a?(a=a.charCode,0===a&&13===b&&(a=13)):a=b;10===a&&(a=13);return 32<=a||13===a?a:0}function pd(){return!0}function qd(){return!1}
function rd(a){function b(b,d,e,f,g){this._reactName=b;this._targetInst=e;this.type=d;this.nativeEvent=f;this.target=g;this.currentTarget=null;for(var c in a)a.hasOwnProperty(c)&&(b=a[c],this[c]=b?b(f):f[c]);this.isDefaultPrevented=(null!=f.defaultPrevented?f.defaultPrevented:!1===f.returnValue)?pd:qd;this.isPropagationStopped=qd;return this}A(b.prototype,{preventDefault:function(){this.defaultPrevented=!0;var a=this.nativeEvent;a&&(a.preventDefault?a.preventDefault():"unknown"!==typeof a.returnValue&&
(a.returnValue=!1),this.isDefaultPrevented=pd)},stopPropagation:function(){var a=this.nativeEvent;a&&(a.stopPropagation?a.stopPropagation():"unknown"!==typeof a.cancelBubble&&(a.cancelBubble=!0),this.isPropagationStopped=pd)},persist:function(){},isPersistent:pd});return b}
var sd={eventPhase:0,bubbles:0,cancelable:0,timeStamp:function(a){return a.timeStamp||Date.now()},defaultPrevented:0,isTrusted:0},td=rd(sd),ud=A({},sd,{view:0,detail:0}),vd=rd(ud),wd,xd,yd,Ad=A({},ud,{screenX:0,screenY:0,clientX:0,clientY:0,pageX:0,pageY:0,ctrlKey:0,shiftKey:0,altKey:0,metaKey:0,getModifierState:zd,button:0,buttons:0,relatedTarget:function(a){return void 0===a.relatedTarget?a.fromElement===a.srcElement?a.toElement:a.fromElement:a.relatedTarget},movementX:function(a){if("movementX"in
a)return a.movementX;a!==yd&&(yd&&"mousemove"===a.type?(wd=a.screenX-yd.screenX,xd=a.screenY-yd.screenY):xd=wd=0,yd=a);return wd},movementY:function(a){return"movementY"in a?a.movementY:xd}}),Bd=rd(Ad),Cd=A({},Ad,{dataTransfer:0}),Dd=rd(Cd),Ed=A({},ud,{relatedTarget:0}),Fd=rd(Ed),Gd=A({},sd,{animationName:0,elapsedTime:0,pseudoElement:0}),Hd=rd(Gd),Id=A({},sd,{clipboardData:function(a){return"clipboardData"in a?a.clipboardData:window.clipboardData}}),Jd=rd(Id),Kd=A({},sd,{data:0}),Ld=rd(Kd),Md={Esc:"Escape",
Spacebar:" ",Left:"ArrowLeft",Up:"ArrowUp",Right:"ArrowRight",Down:"ArrowDown",Del:"Delete",Win:"OS",Menu:"ContextMenu",Apps:"ContextMenu",Scroll:"ScrollLock",MozPrintableKey:"Unidentified"},Nd={8:"Backspace",9:"Tab",12:"Clear",13:"Enter",16:"Shift",17:"Control",18:"Alt",19:"Pause",20:"CapsLock",27:"Escape",32:" ",33:"PageUp",34:"PageDown",35:"End",36:"Home",37:"ArrowLeft",38:"ArrowUp",39:"ArrowRight",40:"ArrowDown",45:"Insert",46:"Delete",112:"F1",113:"F2",114:"F3",115:"F4",116:"F5",117:"F6",118:"F7",
119:"F8",120:"F9",121:"F10",122:"F11",123:"F12",144:"NumLock",145:"ScrollLock",224:"Meta"},Od={Alt:"altKey",Control:"ctrlKey",Meta:"metaKey",Shift:"shiftKey"};function Pd(a){var b=this.nativeEvent;return b.getModifierState?b.getModifierState(a):(a=Od[a])?!!b[a]:!1}function zd(){return Pd}
var Qd=A({},ud,{key:function(a){if(a.key){var b=Md[a.key]||a.key;if("Unidentified"!==b)return b}return"keypress"===a.type?(a=od(a),13===a?"Enter":String.fromCharCode(a)):"keydown"===a.type||"keyup"===a.type?Nd[a.keyCode]||"Unidentified":""},code:0,location:0,ctrlKey:0,shiftKey:0,altKey:0,metaKey:0,repeat:0,locale:0,getModifierState:zd,charCode:function(a){return"keypress"===a.type?od(a):0},keyCode:function(a){return"keydown"===a.type||"keyup"===a.type?a.keyCode:0},which:function(a){return"keypress"===
a.type?od(a):"keydown"===a.type||"keyup"===a.type?a.keyCode:0}}),Rd=rd(Qd),Sd=A({},Ad,{pointerId:0,width:0,height:0,pressure:0,tangentialPressure:0,tiltX:0,tiltY:0,twist:0,pointerType:0,isPrimary:0}),Td=rd(Sd),Ud=A({},ud,{touches:0,targetTouches:0,changedTouches:0,altKey:0,metaKey:0,ctrlKey:0,shiftKey:0,getModifierState:zd}),Vd=rd(Ud),Wd=A({},sd,{propertyName:0,elapsedTime:0,pseudoElement:0}),Xd=rd(Wd),Yd=A({},Ad,{deltaX:function(a){return"deltaX"in a?a.deltaX:"wheelDeltaX"in a?-a.wheelDeltaX:0},
deltaY:function(a){return"deltaY"in a?a.deltaY:"wheelDeltaY"in a?-a.wheelDeltaY:"wheelDelta"in a?-a.wheelDelta:0},deltaZ:0,deltaMode:0}),Zd=rd(Yd),$d=[9,13,27,32],ae=ia&&"CompositionEvent"in window,be=null;ia&&"documentMode"in document&&(be=document.documentMode);var ce=ia&&"TextEvent"in window&&!be,de=ia&&(!ae||be&&8<be&&11>=be),ee=String.fromCharCode(32),fe=!1;
function ge(a,b){switch(a){case "keyup":return-1!==$d.indexOf(b.keyCode);case "keydown":return 229!==b.keyCode;case "keypress":case "mousedown":case "focusout":return!0;default:return!1}}function he(a){a=a.detail;return"object"===typeof a&&"data"in a?a.data:null}var ie=!1;function je(a,b){switch(a){case "compositionend":return he(b);case "keypress":if(32!==b.which)return null;fe=!0;return ee;case "textInput":return a=b.data,a===ee&&fe?null:a;default:return null}}
function ke(a,b){if(ie)return"compositionend"===a||!ae&&ge(a,b)?(a=nd(),md=ld=kd=null,ie=!1,a):null;switch(a){case "paste":return null;case "keypress":if(!(b.ctrlKey||b.altKey||b.metaKey)||b.ctrlKey&&b.altKey){if(b.char&&1<b.char.length)return b.char;if(b.which)return String.fromCharCode(b.which)}return null;case "compositionend":return de&&"ko"!==b.locale?null:b.data;default:return null}}
var le={color:!0,date:!0,datetime:!0,"datetime-local":!0,email:!0,month:!0,number:!0,password:!0,range:!0,search:!0,tel:!0,text:!0,time:!0,url:!0,week:!0};function me(a){var b=a&&a.nodeName&&a.nodeName.toLowerCase();return"input"===b?!!le[a.type]:"textarea"===b?!0:!1}function ne(a,b,c,d){Eb(d);b=oe(b,"onChange");0<b.length&&(c=new td("onChange","change",null,c,d),a.push({event:c,listeners:b}))}var pe=null,qe=null;function re(a){se(a,0)}function te(a){var b=ue(a);if(Wa(b))return a}
function ve(a,b){if("change"===a)return b}var we=!1;if(ia){var xe;if(ia){var ye="oninput"in document;if(!ye){var ze=document.createElement("div");ze.setAttribute("oninput","return;");ye="function"===typeof ze.oninput}xe=ye}else xe=!1;we=xe&&(!document.documentMode||9<document.documentMode)}function Ae(){pe&&(pe.detachEvent("onpropertychange",Be),qe=pe=null)}function Be(a){if("value"===a.propertyName&&te(qe)){var b=[];ne(b,qe,a,xb(a));Jb(re,b)}}
function Ce(a,b,c){"focusin"===a?(Ae(),pe=b,qe=c,pe.attachEvent("onpropertychange",Be)):"focusout"===a&&Ae()}function De(a){if("selectionchange"===a||"keyup"===a||"keydown"===a)return te(qe)}function Ee(a,b){if("click"===a)return te(b)}function Fe(a,b){if("input"===a||"change"===a)return te(b)}function Ge(a,b){return a===b&&(0!==a||1/a===1/b)||a!==a&&b!==b}var He="function"===typeof Object.is?Object.is:Ge;
function Ie(a,b){if(He(a,b))return!0;if("object"!==typeof a||null===a||"object"!==typeof b||null===b)return!1;var c=Object.keys(a),d=Object.keys(b);if(c.length!==d.length)return!1;for(d=0;d<c.length;d++){var e=c[d];if(!ja.call(b,e)||!He(a[e],b[e]))return!1}return!0}function Je(a){for(;a&&a.firstChild;)a=a.firstChild;return a}
function Ke(a,b){var c=Je(a);a=0;for(var d;c;){if(3===c.nodeType){d=a+c.textContent.length;if(a<=b&&d>=b)return{node:c,offset:b-a};a=d}a:{for(;c;){if(c.nextSibling){c=c.nextSibling;break a}c=c.parentNode}c=void 0}c=Je(c)}}function Le(a,b){return a&&b?a===b?!0:a&&3===a.nodeType?!1:b&&3===b.nodeType?Le(a,b.parentNode):"contains"in a?a.contains(b):a.compareDocumentPosition?!!(a.compareDocumentPosition(b)&16):!1:!1}
function Me(){for(var a=window,b=Xa();b instanceof a.HTMLIFrameElement;){try{var c="string"===typeof b.contentWindow.location.href}catch(d){c=!1}if(c)a=b.contentWindow;else break;b=Xa(a.document)}return b}function Ne(a){var b=a&&a.nodeName&&a.nodeName.toLowerCase();return b&&("input"===b&&("text"===a.type||"search"===a.type||"tel"===a.type||"url"===a.type||"password"===a.type)||"textarea"===b||"true"===a.contentEditable)}
function Oe(a){var b=Me(),c=a.focusedElem,d=a.selectionRange;if(b!==c&&c&&c.ownerDocument&&Le(c.ownerDocument.documentElement,c)){if(null!==d&&Ne(c))if(b=d.start,a=d.end,void 0===a&&(a=b),"selectionStart"in c)c.selectionStart=b,c.selectionEnd=Math.min(a,c.value.length);else if(a=(b=c.ownerDocument||document)&&b.defaultView||window,a.getSelection){a=a.getSelection();var e=c.textContent.length,f=Math.min(d.start,e);d=void 0===d.end?f:Math.min(d.end,e);!a.extend&&f>d&&(e=d,d=f,f=e);e=Ke(c,f);var g=Ke(c,
d);e&&g&&(1!==a.rangeCount||a.anchorNode!==e.node||a.anchorOffset!==e.offset||a.focusNode!==g.node||a.focusOffset!==g.offset)&&(b=b.createRange(),b.setStart(e.node,e.offset),a.removeAllRanges(),f>d?(a.addRange(b),a.extend(g.node,g.offset)):(b.setEnd(g.node,g.offset),a.addRange(b)))}b=[];for(a=c;a=a.parentNode;)1===a.nodeType&&b.push({element:a,left:a.scrollLeft,top:a.scrollTop});"function"===typeof c.focus&&c.focus();for(c=0;c<b.length;c++)a=b[c],a.element.scrollLeft=a.left,a.element.scrollTop=a.top}}
var Pe=ia&&"documentMode"in document&&11>=document.documentMode,Qe=null,Re=null,Se=null,Te=!1;
function Ue(a,b,c){var d=c.window===c?c.document:9===c.nodeType?c:c.ownerDocument;Te||null==Qe||Qe!==Xa(d)||(d=Qe,"selectionStart"in d&&Ne(d)?d={start:d.selectionStart,end:d.selectionEnd}:(d=(d.ownerDocument&&d.ownerDocument.defaultView||window).getSelection(),d={anchorNode:d.anchorNode,anchorOffset:d.anchorOffset,focusNode:d.focusNode,focusOffset:d.focusOffset}),Se&&Ie(Se,d)||(Se=d,d=oe(Re,"onSelect"),0<d.length&&(b=new td("onSelect","select",null,b,c),a.push({event:b,listeners:d}),b.target=Qe)))}
function Ve(a,b){var c={};c[a.toLowerCase()]=b.toLowerCase();c["Webkit"+a]="webkit"+b;c["Moz"+a]="moz"+b;return c}var We={animationend:Ve("Animation","AnimationEnd"),animationiteration:Ve("Animation","AnimationIteration"),animationstart:Ve("Animation","AnimationStart"),transitionend:Ve("Transition","TransitionEnd")},Xe={},Ye={};
ia&&(Ye=document.createElement("div").style,"AnimationEvent"in window||(delete We.animationend.animation,delete We.animationiteration.animation,delete We.animationstart.animation),"TransitionEvent"in window||delete We.transitionend.transition);function Ze(a){if(Xe[a])return Xe[a];if(!We[a])return a;var b=We[a],c;for(c in b)if(b.hasOwnProperty(c)&&c in Ye)return Xe[a]=b[c];return a}var $e=Ze("animationend"),af=Ze("animationiteration"),bf=Ze("animationstart"),cf=Ze("transitionend"),df=new Map,ef="abort auxClick cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(" ");
function ff(a,b){df.set(a,b);fa(b,[a])}for(var gf=0;gf<ef.length;gf++){var hf=ef[gf],jf=hf.toLowerCase(),kf=hf[0].toUpperCase()+hf.slice(1);ff(jf,"on"+kf)}ff($e,"onAnimationEnd");ff(af,"onAnimationIteration");ff(bf,"onAnimationStart");ff("dblclick","onDoubleClick");ff("focusin","onFocus");ff("focusout","onBlur");ff(cf,"onTransitionEnd");ha("onMouseEnter",["mouseout","mouseover"]);ha("onMouseLeave",["mouseout","mouseover"]);ha("onPointerEnter",["pointerout","pointerover"]);
ha("onPointerLeave",["pointerout","pointerover"]);fa("onChange","change click focusin focusout input keydown keyup selectionchange".split(" "));fa("onSelect","focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(" "));fa("onBeforeInput",["compositionend","keypress","textInput","paste"]);fa("onCompositionEnd","compositionend focusout keydown keypress keyup mousedown".split(" "));fa("onCompositionStart","compositionstart focusout keydown keypress keyup mousedown".split(" "));
fa("onCompositionUpdate","compositionupdate focusout keydown keypress keyup mousedown".split(" "));var lf="abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(" "),mf=new Set("cancel close invalid load scroll toggle".split(" ").concat(lf));
function nf(a,b,c){var d=a.type||"unknown-event";a.currentTarget=c;Ub(d,b,void 0,a);a.currentTarget=null}
function se(a,b){b=0!==(b&4);for(var c=0;c<a.length;c++){var d=a[c],e=d.event;d=d.listeners;a:{var f=void 0;if(b)for(var g=d.length-1;0<=g;g--){var h=d[g],k=h.instance,l=h.currentTarget;h=h.listener;if(k!==f&&e.isPropagationStopped())break a;nf(e,h,l);f=k}else for(g=0;g<d.length;g++){h=d[g];k=h.instance;l=h.currentTarget;h=h.listener;if(k!==f&&e.isPropagationStopped())break a;nf(e,h,l);f=k}}}if(Qb)throw a=Rb,Qb=!1,Rb=null,a;}
function D(a,b){var c=b[of];void 0===c&&(c=b[of]=new Set);var d=a+"__bubble";c.has(d)||(pf(b,a,2,!1),c.add(d))}function qf(a,b,c){var d=0;b&&(d|=4);pf(c,a,d,b)}var rf="_reactListening"+Math.random().toString(36).slice(2);function sf(a){if(!a[rf]){a[rf]=!0;da.forEach(function(b){"selectionchange"!==b&&(mf.has(b)||qf(b,!1,a),qf(b,!0,a))});var b=9===a.nodeType?a:a.ownerDocument;null===b||b[rf]||(b[rf]=!0,qf("selectionchange",!1,b))}}
function pf(a,b,c,d){switch(jd(b)){case 1:var e=ed;break;case 4:e=gd;break;default:e=fd}c=e.bind(null,b,c,a);e=void 0;!Lb||"touchstart"!==b&&"touchmove"!==b&&"wheel"!==b||(e=!0);d?void 0!==e?a.addEventListener(b,c,{capture:!0,passive:e}):a.addEventListener(b,c,!0):void 0!==e?a.addEventListener(b,c,{passive:e}):a.addEventListener(b,c,!1)}
function hd(a,b,c,d,e){var f=d;if(0===(b&1)&&0===(b&2)&&null!==d)a:for(;;){if(null===d)return;var g=d.tag;if(3===g||4===g){var h=d.stateNode.containerInfo;if(h===e||8===h.nodeType&&h.parentNode===e)break;if(4===g)for(g=d.return;null!==g;){var k=g.tag;if(3===k||4===k)if(k=g.stateNode.containerInfo,k===e||8===k.nodeType&&k.parentNode===e)return;g=g.return}for(;null!==h;){g=Wc(h);if(null===g)return;k=g.tag;if(5===k||6===k){d=f=g;continue a}h=h.parentNode}}d=d.return}Jb(function(){var d=f,e=xb(c),g=[];
a:{var h=df.get(a);if(void 0!==h){var k=td,n=a;switch(a){case "keypress":if(0===od(c))break a;case "keydown":case "keyup":k=Rd;break;case "focusin":n="focus";k=Fd;break;case "focusout":n="blur";k=Fd;break;case "beforeblur":case "afterblur":k=Fd;break;case "click":if(2===c.button)break a;case "auxclick":case "dblclick":case "mousedown":case "mousemove":case "mouseup":case "mouseout":case "mouseover":case "contextmenu":k=Bd;break;case "drag":case "dragend":case "dragenter":case "dragexit":case "dragleave":case "dragover":case "dragstart":case "drop":k=
Dd;break;case "touchcancel":case "touchend":case "touchmove":case "touchstart":k=Vd;break;case $e:case af:case bf:k=Hd;break;case cf:k=Xd;break;case "scroll":k=vd;break;case "wheel":k=Zd;break;case "copy":case "cut":case "paste":k=Jd;break;case "gotpointercapture":case "lostpointercapture":case "pointercancel":case "pointerdown":case "pointermove":case "pointerout":case "pointerover":case "pointerup":k=Td}var t=0!==(b&4),J=!t&&"scroll"===a,x=t?null!==h?h+"Capture":null:h;t=[];for(var w=d,u;null!==
w;){u=w;var F=u.stateNode;5===u.tag&&null!==F&&(u=F,null!==x&&(F=Kb(w,x),null!=F&&t.push(tf(w,F,u))));if(J)break;w=w.return}0<t.length&&(h=new k(h,n,null,c,e),g.push({event:h,listeners:t}))}}if(0===(b&7)){a:{h="mouseover"===a||"pointerover"===a;k="mouseout"===a||"pointerout"===a;if(h&&c!==wb&&(n=c.relatedTarget||c.fromElement)&&(Wc(n)||n[uf]))break a;if(k||h){h=e.window===e?e:(h=e.ownerDocument)?h.defaultView||h.parentWindow:window;if(k){if(n=c.relatedTarget||c.toElement,k=d,n=n?Wc(n):null,null!==
n&&(J=Vb(n),n!==J||5!==n.tag&&6!==n.tag))n=null}else k=null,n=d;if(k!==n){t=Bd;F="onMouseLeave";x="onMouseEnter";w="mouse";if("pointerout"===a||"pointerover"===a)t=Td,F="onPointerLeave",x="onPointerEnter",w="pointer";J=null==k?h:ue(k);u=null==n?h:ue(n);h=new t(F,w+"leave",k,c,e);h.target=J;h.relatedTarget=u;F=null;Wc(e)===d&&(t=new t(x,w+"enter",n,c,e),t.target=u,t.relatedTarget=J,F=t);J=F;if(k&&n)b:{t=k;x=n;w=0;for(u=t;u;u=vf(u))w++;u=0;for(F=x;F;F=vf(F))u++;for(;0<w-u;)t=vf(t),w--;for(;0<u-w;)x=
vf(x),u--;for(;w--;){if(t===x||null!==x&&t===x.alternate)break b;t=vf(t);x=vf(x)}t=null}else t=null;null!==k&&wf(g,h,k,t,!1);null!==n&&null!==J&&wf(g,J,n,t,!0)}}}a:{h=d?ue(d):window;k=h.nodeName&&h.nodeName.toLowerCase();if("select"===k||"input"===k&&"file"===h.type)var na=ve;else if(me(h))if(we)na=Fe;else{na=De;var xa=Ce}else(k=h.nodeName)&&"input"===k.toLowerCase()&&("checkbox"===h.type||"radio"===h.type)&&(na=Ee);if(na&&(na=na(a,d))){ne(g,na,c,e);break a}xa&&xa(a,h,d);"focusout"===a&&(xa=h._wrapperState)&&
xa.controlled&&"number"===h.type&&cb(h,"number",h.value)}xa=d?ue(d):window;switch(a){case "focusin":if(me(xa)||"true"===xa.contentEditable)Qe=xa,Re=d,Se=null;break;case "focusout":Se=Re=Qe=null;break;case "mousedown":Te=!0;break;case "contextmenu":case "mouseup":case "dragend":Te=!1;Ue(g,c,e);break;case "selectionchange":if(Pe)break;case "keydown":case "keyup":Ue(g,c,e)}var $a;if(ae)b:{switch(a){case "compositionstart":var ba="onCompositionStart";break b;case "compositionend":ba="onCompositionEnd";
break b;case "compositionupdate":ba="onCompositionUpdate";break b}ba=void 0}else ie?ge(a,c)&&(ba="onCompositionEnd"):"keydown"===a&&229===c.keyCode&&(ba="onCompositionStart");ba&&(de&&"ko"!==c.locale&&(ie||"onCompositionStart"!==ba?"onCompositionEnd"===ba&&ie&&($a=nd()):(kd=e,ld="value"in kd?kd.value:kd.textContent,ie=!0)),xa=oe(d,ba),0<xa.length&&(ba=new Ld(ba,a,null,c,e),g.push({event:ba,listeners:xa}),$a?ba.data=$a:($a=he(c),null!==$a&&(ba.data=$a))));if($a=ce?je(a,c):ke(a,c))d=oe(d,"onBeforeInput"),
0<d.length&&(e=new Ld("onBeforeInput","beforeinput",null,c,e),g.push({event:e,listeners:d}),e.data=$a)}se(g,b)})}function tf(a,b,c){return{instance:a,listener:b,currentTarget:c}}function oe(a,b){for(var c=b+"Capture",d=[];null!==a;){var e=a,f=e.stateNode;5===e.tag&&null!==f&&(e=f,f=Kb(a,c),null!=f&&d.unshift(tf(a,f,e)),f=Kb(a,b),null!=f&&d.push(tf(a,f,e)));a=a.return}return d}function vf(a){if(null===a)return null;do a=a.return;while(a&&5!==a.tag);return a?a:null}
function wf(a,b,c,d,e){for(var f=b._reactName,g=[];null!==c&&c!==d;){var h=c,k=h.alternate,l=h.stateNode;if(null!==k&&k===d)break;5===h.tag&&null!==l&&(h=l,e?(k=Kb(c,f),null!=k&&g.unshift(tf(c,k,h))):e||(k=Kb(c,f),null!=k&&g.push(tf(c,k,h))));c=c.return}0!==g.length&&a.push({event:b,listeners:g})}var xf=/\r\n?/g,yf=/\u0000|\uFFFD/g;function zf(a){return("string"===typeof a?a:""+a).replace(xf,"\n").replace(yf,"")}function Af(a,b,c){b=zf(b);if(zf(a)!==b&&c)throw Error(p(425));}function Bf(){}
var Cf=null,Df=null;function Ef(a,b){return"textarea"===a||"noscript"===a||"string"===typeof b.children||"number"===typeof b.children||"object"===typeof b.dangerouslySetInnerHTML&&null!==b.dangerouslySetInnerHTML&&null!=b.dangerouslySetInnerHTML.__html}
var Ff="function"===typeof setTimeout?setTimeout:void 0,Gf="function"===typeof clearTimeout?clearTimeout:void 0,Hf="function"===typeof Promise?Promise:void 0,Jf="function"===typeof queueMicrotask?queueMicrotask:"undefined"!==typeof Hf?function(a){return Hf.resolve(null).then(a).catch(If)}:Ff;function If(a){setTimeout(function(){throw a;})}
function Kf(a,b){var c=b,d=0;do{var e=c.nextSibling;a.removeChild(c);if(e&&8===e.nodeType)if(c=e.data,"/$"===c){if(0===d){a.removeChild(e);bd(b);return}d--}else"$"!==c&&"$?"!==c&&"$!"!==c||d++;c=e}while(c);bd(b)}function Lf(a){for(;null!=a;a=a.nextSibling){var b=a.nodeType;if(1===b||3===b)break;if(8===b){b=a.data;if("$"===b||"$!"===b||"$?"===b)break;if("/$"===b)return null}}return a}
function Mf(a){a=a.previousSibling;for(var b=0;a;){if(8===a.nodeType){var c=a.data;if("$"===c||"$!"===c||"$?"===c){if(0===b)return a;b--}else"/$"===c&&b++}a=a.previousSibling}return null}var Nf=Math.random().toString(36).slice(2),Of="__reactFiber$"+Nf,Pf="__reactProps$"+Nf,uf="__reactContainer$"+Nf,of="__reactEvents$"+Nf,Qf="__reactListeners$"+Nf,Rf="__reactHandles$"+Nf;
function Wc(a){var b=a[Of];if(b)return b;for(var c=a.parentNode;c;){if(b=c[uf]||c[Of]){c=b.alternate;if(null!==b.child||null!==c&&null!==c.child)for(a=Mf(a);null!==a;){if(c=a[Of])return c;a=Mf(a)}return b}a=c;c=a.parentNode}return null}function Cb(a){a=a[Of]||a[uf];return!a||5!==a.tag&&6!==a.tag&&13!==a.tag&&3!==a.tag?null:a}function ue(a){if(5===a.tag||6===a.tag)return a.stateNode;throw Error(p(33));}function Db(a){return a[Pf]||null}var Sf=[],Tf=-1;function Uf(a){return{current:a}}
function E(a){0>Tf||(a.current=Sf[Tf],Sf[Tf]=null,Tf--)}function G(a,b){Tf++;Sf[Tf]=a.current;a.current=b}var Vf={},H=Uf(Vf),Wf=Uf(!1),Xf=Vf;function Yf(a,b){var c=a.type.contextTypes;if(!c)return Vf;var d=a.stateNode;if(d&&d.__reactInternalMemoizedUnmaskedChildContext===b)return d.__reactInternalMemoizedMaskedChildContext;var e={},f;for(f in c)e[f]=b[f];d&&(a=a.stateNode,a.__reactInternalMemoizedUnmaskedChildContext=b,a.__reactInternalMemoizedMaskedChildContext=e);return e}
function Zf(a){a=a.childContextTypes;return null!==a&&void 0!==a}function $f(){E(Wf);E(H)}function ag(a,b,c){if(H.current!==Vf)throw Error(p(168));G(H,b);G(Wf,c)}function bg(a,b,c){var d=a.stateNode;b=b.childContextTypes;if("function"!==typeof d.getChildContext)return c;d=d.getChildContext();for(var e in d)if(!(e in b))throw Error(p(108,Ra(a)||"Unknown",e));return A({},c,d)}
function cg(a){a=(a=a.stateNode)&&a.__reactInternalMemoizedMergedChildContext||Vf;Xf=H.current;G(H,a);G(Wf,Wf.current);return!0}function dg(a,b,c){var d=a.stateNode;if(!d)throw Error(p(169));c?(a=bg(a,b,Xf),d.__reactInternalMemoizedMergedChildContext=a,E(Wf),E(H),G(H,a)):E(Wf);G(Wf,c)}var eg=null,fg=!1,gg=!1;function hg(a){null===eg?eg=[a]:eg.push(a)}function ig(a){fg=!0;hg(a)}
function jg(){if(!gg&&null!==eg){gg=!0;var a=0,b=C;try{var c=eg;for(C=1;a<c.length;a++){var d=c[a];do d=d(!0);while(null!==d)}eg=null;fg=!1}catch(e){throw null!==eg&&(eg=eg.slice(a+1)),ac(fc,jg),e;}finally{C=b,gg=!1}}return null}var kg=[],lg=0,mg=null,ng=0,og=[],pg=0,qg=null,rg=1,sg="";function tg(a,b){kg[lg++]=ng;kg[lg++]=mg;mg=a;ng=b}
function ug(a,b,c){og[pg++]=rg;og[pg++]=sg;og[pg++]=qg;qg=a;var d=rg;a=sg;var e=32-oc(d)-1;d&=~(1<<e);c+=1;var f=32-oc(b)+e;if(30<f){var g=e-e%5;f=(d&(1<<g)-1).toString(32);d>>=g;e-=g;rg=1<<32-oc(b)+e|c<<e|d;sg=f+a}else rg=1<<f|c<<e|d,sg=a}function vg(a){null!==a.return&&(tg(a,1),ug(a,1,0))}function wg(a){for(;a===mg;)mg=kg[--lg],kg[lg]=null,ng=kg[--lg],kg[lg]=null;for(;a===qg;)qg=og[--pg],og[pg]=null,sg=og[--pg],og[pg]=null,rg=og[--pg],og[pg]=null}var xg=null,yg=null,I=!1,zg=null;
function Ag(a,b){var c=Bg(5,null,null,0);c.elementType="DELETED";c.stateNode=b;c.return=a;b=a.deletions;null===b?(a.deletions=[c],a.flags|=16):b.push(c)}
function Cg(a,b){switch(a.tag){case 5:var c=a.type;b=1!==b.nodeType||c.toLowerCase()!==b.nodeName.toLowerCase()?null:b;return null!==b?(a.stateNode=b,xg=a,yg=Lf(b.firstChild),!0):!1;case 6:return b=""===a.pendingProps||3!==b.nodeType?null:b,null!==b?(a.stateNode=b,xg=a,yg=null,!0):!1;case 13:return b=8!==b.nodeType?null:b,null!==b?(c=null!==qg?{id:rg,overflow:sg}:null,a.memoizedState={dehydrated:b,treeContext:c,retryLane:1073741824},c=Bg(18,null,null,0),c.stateNode=b,c.return=a,a.child=c,xg=a,yg=
null,!0):!1;default:return!1}}function Dg(a){return 0!==(a.mode&1)&&0===(a.flags&128)}function Eg(a){if(I){var b=yg;if(b){var c=b;if(!Cg(a,b)){if(Dg(a))throw Error(p(418));b=Lf(c.nextSibling);var d=xg;b&&Cg(a,b)?Ag(d,c):(a.flags=a.flags&-4097|2,I=!1,xg=a)}}else{if(Dg(a))throw Error(p(418));a.flags=a.flags&-4097|2;I=!1;xg=a}}}function Fg(a){for(a=a.return;null!==a&&5!==a.tag&&3!==a.tag&&13!==a.tag;)a=a.return;xg=a}
function Gg(a){if(a!==xg)return!1;if(!I)return Fg(a),I=!0,!1;var b;(b=3!==a.tag)&&!(b=5!==a.tag)&&(b=a.type,b="head"!==b&&"body"!==b&&!Ef(a.type,a.memoizedProps));if(b&&(b=yg)){if(Dg(a))throw Hg(),Error(p(418));for(;b;)Ag(a,b),b=Lf(b.nextSibling)}Fg(a);if(13===a.tag){a=a.memoizedState;a=null!==a?a.dehydrated:null;if(!a)throw Error(p(317));a:{a=a.nextSibling;for(b=0;a;){if(8===a.nodeType){var c=a.data;if("/$"===c){if(0===b){yg=Lf(a.nextSibling);break a}b--}else"$"!==c&&"$!"!==c&&"$?"!==c||b++}a=a.nextSibling}yg=
null}}else yg=xg?Lf(a.stateNode.nextSibling):null;return!0}function Hg(){for(var a=yg;a;)a=Lf(a.nextSibling)}function Ig(){yg=xg=null;I=!1}function Jg(a){null===zg?zg=[a]:zg.push(a)}var Kg=ua.ReactCurrentBatchConfig;function Lg(a,b){if(a&&a.defaultProps){b=A({},b);a=a.defaultProps;for(var c in a)void 0===b[c]&&(b[c]=a[c]);return b}return b}var Mg=Uf(null),Ng=null,Og=null,Pg=null;function Qg(){Pg=Og=Ng=null}function Rg(a){var b=Mg.current;E(Mg);a._currentValue=b}
function Sg(a,b,c){for(;null!==a;){var d=a.alternate;(a.childLanes&b)!==b?(a.childLanes|=b,null!==d&&(d.childLanes|=b)):null!==d&&(d.childLanes&b)!==b&&(d.childLanes|=b);if(a===c)break;a=a.return}}function Tg(a,b){Ng=a;Pg=Og=null;a=a.dependencies;null!==a&&null!==a.firstContext&&(0!==(a.lanes&b)&&(Ug=!0),a.firstContext=null)}
function Vg(a){var b=a._currentValue;if(Pg!==a)if(a={context:a,memoizedValue:b,next:null},null===Og){if(null===Ng)throw Error(p(308));Og=a;Ng.dependencies={lanes:0,firstContext:a}}else Og=Og.next=a;return b}var Wg=null;function Xg(a){null===Wg?Wg=[a]:Wg.push(a)}function Yg(a,b,c,d){var e=b.interleaved;null===e?(c.next=c,Xg(b)):(c.next=e.next,e.next=c);b.interleaved=c;return Zg(a,d)}
function Zg(a,b){a.lanes|=b;var c=a.alternate;null!==c&&(c.lanes|=b);c=a;for(a=a.return;null!==a;)a.childLanes|=b,c=a.alternate,null!==c&&(c.childLanes|=b),c=a,a=a.return;return 3===c.tag?c.stateNode:null}var $g=!1;function ah(a){a.updateQueue={baseState:a.memoizedState,firstBaseUpdate:null,lastBaseUpdate:null,shared:{pending:null,interleaved:null,lanes:0},effects:null}}
function bh(a,b){a=a.updateQueue;b.updateQueue===a&&(b.updateQueue={baseState:a.baseState,firstBaseUpdate:a.firstBaseUpdate,lastBaseUpdate:a.lastBaseUpdate,shared:a.shared,effects:a.effects})}function ch(a,b){return{eventTime:a,lane:b,tag:0,payload:null,callback:null,next:null}}
function dh(a,b,c){var d=a.updateQueue;if(null===d)return null;d=d.shared;if(0!==(K&2)){var e=d.pending;null===e?b.next=b:(b.next=e.next,e.next=b);d.pending=b;return Zg(a,c)}e=d.interleaved;null===e?(b.next=b,Xg(d)):(b.next=e.next,e.next=b);d.interleaved=b;return Zg(a,c)}function eh(a,b,c){b=b.updateQueue;if(null!==b&&(b=b.shared,0!==(c&4194240))){var d=b.lanes;d&=a.pendingLanes;c|=d;b.lanes=c;Cc(a,c)}}
function fh(a,b){var c=a.updateQueue,d=a.alternate;if(null!==d&&(d=d.updateQueue,c===d)){var e=null,f=null;c=c.firstBaseUpdate;if(null!==c){do{var g={eventTime:c.eventTime,lane:c.lane,tag:c.tag,payload:c.payload,callback:c.callback,next:null};null===f?e=f=g:f=f.next=g;c=c.next}while(null!==c);null===f?e=f=b:f=f.next=b}else e=f=b;c={baseState:d.baseState,firstBaseUpdate:e,lastBaseUpdate:f,shared:d.shared,effects:d.effects};a.updateQueue=c;return}a=c.lastBaseUpdate;null===a?c.firstBaseUpdate=b:a.next=
b;c.lastBaseUpdate=b}
function gh(a,b,c,d){var e=a.updateQueue;$g=!1;var f=e.firstBaseUpdate,g=e.lastBaseUpdate,h=e.shared.pending;if(null!==h){e.shared.pending=null;var k=h,l=k.next;k.next=null;null===g?f=l:g.next=l;g=k;var m=a.alternate;null!==m&&(m=m.updateQueue,h=m.lastBaseUpdate,h!==g&&(null===h?m.firstBaseUpdate=l:h.next=l,m.lastBaseUpdate=k))}if(null!==f){var q=e.baseState;g=0;m=l=k=null;h=f;do{var r=h.lane,y=h.eventTime;if((d&r)===r){null!==m&&(m=m.next={eventTime:y,lane:0,tag:h.tag,payload:h.payload,callback:h.callback,
next:null});a:{var n=a,t=h;r=b;y=c;switch(t.tag){case 1:n=t.payload;if("function"===typeof n){q=n.call(y,q,r);break a}q=n;break a;case 3:n.flags=n.flags&-65537|128;case 0:n=t.payload;r="function"===typeof n?n.call(y,q,r):n;if(null===r||void 0===r)break a;q=A({},q,r);break a;case 2:$g=!0}}null!==h.callback&&0!==h.lane&&(a.flags|=64,r=e.effects,null===r?e.effects=[h]:r.push(h))}else y={eventTime:y,lane:r,tag:h.tag,payload:h.payload,callback:h.callback,next:null},null===m?(l=m=y,k=q):m=m.next=y,g|=r;
h=h.next;if(null===h)if(h=e.shared.pending,null===h)break;else r=h,h=r.next,r.next=null,e.lastBaseUpdate=r,e.shared.pending=null}while(1);null===m&&(k=q);e.baseState=k;e.firstBaseUpdate=l;e.lastBaseUpdate=m;b=e.shared.interleaved;if(null!==b){e=b;do g|=e.lane,e=e.next;while(e!==b)}else null===f&&(e.shared.lanes=0);hh|=g;a.lanes=g;a.memoizedState=q}}
function ih(a,b,c){a=b.effects;b.effects=null;if(null!==a)for(b=0;b<a.length;b++){var d=a[b],e=d.callback;if(null!==e){d.callback=null;d=c;if("function"!==typeof e)throw Error(p(191,e));e.call(d)}}}var jh=(new aa.Component).refs;function kh(a,b,c,d){b=a.memoizedState;c=c(d,b);c=null===c||void 0===c?b:A({},b,c);a.memoizedState=c;0===a.lanes&&(a.updateQueue.baseState=c)}
var nh={isMounted:function(a){return(a=a._reactInternals)?Vb(a)===a:!1},enqueueSetState:function(a,b,c){a=a._reactInternals;var d=L(),e=lh(a),f=ch(d,e);f.payload=b;void 0!==c&&null!==c&&(f.callback=c);b=dh(a,f,e);null!==b&&(mh(b,a,e,d),eh(b,a,e))},enqueueReplaceState:function(a,b,c){a=a._reactInternals;var d=L(),e=lh(a),f=ch(d,e);f.tag=1;f.payload=b;void 0!==c&&null!==c&&(f.callback=c);b=dh(a,f,e);null!==b&&(mh(b,a,e,d),eh(b,a,e))},enqueueForceUpdate:function(a,b){a=a._reactInternals;var c=L(),d=
lh(a),e=ch(c,d);e.tag=2;void 0!==b&&null!==b&&(e.callback=b);b=dh(a,e,d);null!==b&&(mh(b,a,d,c),eh(b,a,d))}};function oh(a,b,c,d,e,f,g){a=a.stateNode;return"function"===typeof a.shouldComponentUpdate?a.shouldComponentUpdate(d,f,g):b.prototype&&b.prototype.isPureReactComponent?!Ie(c,d)||!Ie(e,f):!0}
function ph(a,b,c){var d=!1,e=Vf;var f=b.contextType;"object"===typeof f&&null!==f?f=Vg(f):(e=Zf(b)?Xf:H.current,d=b.contextTypes,f=(d=null!==d&&void 0!==d)?Yf(a,e):Vf);b=new b(c,f);a.memoizedState=null!==b.state&&void 0!==b.state?b.state:null;b.updater=nh;a.stateNode=b;b._reactInternals=a;d&&(a=a.stateNode,a.__reactInternalMemoizedUnmaskedChildContext=e,a.__reactInternalMemoizedMaskedChildContext=f);return b}
function qh(a,b,c,d){a=b.state;"function"===typeof b.componentWillReceiveProps&&b.componentWillReceiveProps(c,d);"function"===typeof b.UNSAFE_componentWillReceiveProps&&b.UNSAFE_componentWillReceiveProps(c,d);b.state!==a&&nh.enqueueReplaceState(b,b.state,null)}
function rh(a,b,c,d){var e=a.stateNode;e.props=c;e.state=a.memoizedState;e.refs=jh;ah(a);var f=b.contextType;"object"===typeof f&&null!==f?e.context=Vg(f):(f=Zf(b)?Xf:H.current,e.context=Yf(a,f));e.state=a.memoizedState;f=b.getDerivedStateFromProps;"function"===typeof f&&(kh(a,b,f,c),e.state=a.memoizedState);"function"===typeof b.getDerivedStateFromProps||"function"===typeof e.getSnapshotBeforeUpdate||"function"!==typeof e.UNSAFE_componentWillMount&&"function"!==typeof e.componentWillMount||(b=e.state,
"function"===typeof e.componentWillMount&&e.componentWillMount(),"function"===typeof e.UNSAFE_componentWillMount&&e.UNSAFE_componentWillMount(),b!==e.state&&nh.enqueueReplaceState(e,e.state,null),gh(a,c,e,d),e.state=a.memoizedState);"function"===typeof e.componentDidMount&&(a.flags|=4194308)}
function sh(a,b,c){a=c.ref;if(null!==a&&"function"!==typeof a&&"object"!==typeof a){if(c._owner){c=c._owner;if(c){if(1!==c.tag)throw Error(p(309));var d=c.stateNode}if(!d)throw Error(p(147,a));var e=d,f=""+a;if(null!==b&&null!==b.ref&&"function"===typeof b.ref&&b.ref._stringRef===f)return b.ref;b=function(a){var b=e.refs;b===jh&&(b=e.refs={});null===a?delete b[f]:b[f]=a};b._stringRef=f;return b}if("string"!==typeof a)throw Error(p(284));if(!c._owner)throw Error(p(290,a));}return a}
function th(a,b){a=Object.prototype.toString.call(b);throw Error(p(31,"[object Object]"===a?"object with keys {"+Object.keys(b).join(", ")+"}":a));}function uh(a){var b=a._init;return b(a._payload)}
function vh(a){function b(b,c){if(a){var d=b.deletions;null===d?(b.deletions=[c],b.flags|=16):d.push(c)}}function c(c,d){if(!a)return null;for(;null!==d;)b(c,d),d=d.sibling;return null}function d(a,b){for(a=new Map;null!==b;)null!==b.key?a.set(b.key,b):a.set(b.index,b),b=b.sibling;return a}function e(a,b){a=wh(a,b);a.index=0;a.sibling=null;return a}function f(b,c,d){b.index=d;if(!a)return b.flags|=1048576,c;d=b.alternate;if(null!==d)return d=d.index,d<c?(b.flags|=2,c):d;b.flags|=2;return c}function g(b){a&&
null===b.alternate&&(b.flags|=2);return b}function h(a,b,c,d){if(null===b||6!==b.tag)return b=xh(c,a.mode,d),b.return=a,b;b=e(b,c);b.return=a;return b}function k(a,b,c,d){var f=c.type;if(f===ya)return m(a,b,c.props.children,d,c.key);if(null!==b&&(b.elementType===f||"object"===typeof f&&null!==f&&f.$$typeof===Ha&&uh(f)===b.type))return d=e(b,c.props),d.ref=sh(a,b,c),d.return=a,d;d=yh(c.type,c.key,c.props,null,a.mode,d);d.ref=sh(a,b,c);d.return=a;return d}function l(a,b,c,d){if(null===b||4!==b.tag||
b.stateNode.containerInfo!==c.containerInfo||b.stateNode.implementation!==c.implementation)return b=zh(c,a.mode,d),b.return=a,b;b=e(b,c.children||[]);b.return=a;return b}function m(a,b,c,d,f){if(null===b||7!==b.tag)return b=Ah(c,a.mode,d,f),b.return=a,b;b=e(b,c);b.return=a;return b}function q(a,b,c){if("string"===typeof b&&""!==b||"number"===typeof b)return b=xh(""+b,a.mode,c),b.return=a,b;if("object"===typeof b&&null!==b){switch(b.$$typeof){case va:return c=yh(b.type,b.key,b.props,null,a.mode,c),
c.ref=sh(a,null,b),c.return=a,c;case wa:return b=zh(b,a.mode,c),b.return=a,b;case Ha:var d=b._init;return q(a,d(b._payload),c)}if(eb(b)||Ka(b))return b=Ah(b,a.mode,c,null),b.return=a,b;th(a,b)}return null}function r(a,b,c,d){var e=null!==b?b.key:null;if("string"===typeof c&&""!==c||"number"===typeof c)return null!==e?null:h(a,b,""+c,d);if("object"===typeof c&&null!==c){switch(c.$$typeof){case va:return c.key===e?k(a,b,c,d):null;case wa:return c.key===e?l(a,b,c,d):null;case Ha:return e=c._init,r(a,
b,e(c._payload),d)}if(eb(c)||Ka(c))return null!==e?null:m(a,b,c,d,null);th(a,c)}return null}function y(a,b,c,d,e){if("string"===typeof d&&""!==d||"number"===typeof d)return a=a.get(c)||null,h(b,a,""+d,e);if("object"===typeof d&&null!==d){switch(d.$$typeof){case va:return a=a.get(null===d.key?c:d.key)||null,k(b,a,d,e);case wa:return a=a.get(null===d.key?c:d.key)||null,l(b,a,d,e);case Ha:var f=d._init;return y(a,b,c,f(d._payload),e)}if(eb(d)||Ka(d))return a=a.get(c)||null,m(b,a,d,e,null);th(b,d)}return null}
function n(e,g,h,k){for(var l=null,m=null,u=g,w=g=0,x=null;null!==u&&w<h.length;w++){u.index>w?(x=u,u=null):x=u.sibling;var n=r(e,u,h[w],k);if(null===n){null===u&&(u=x);break}a&&u&&null===n.alternate&&b(e,u);g=f(n,g,w);null===m?l=n:m.sibling=n;m=n;u=x}if(w===h.length)return c(e,u),I&&tg(e,w),l;if(null===u){for(;w<h.length;w++)u=q(e,h[w],k),null!==u&&(g=f(u,g,w),null===m?l=u:m.sibling=u,m=u);I&&tg(e,w);return l}for(u=d(e,u);w<h.length;w++)x=y(u,e,w,h[w],k),null!==x&&(a&&null!==x.alternate&&u.delete(null===
x.key?w:x.key),g=f(x,g,w),null===m?l=x:m.sibling=x,m=x);a&&u.forEach(function(a){return b(e,a)});I&&tg(e,w);return l}function t(e,g,h,k){var l=Ka(h);if("function"!==typeof l)throw Error(p(150));h=l.call(h);if(null==h)throw Error(p(151));for(var u=l=null,m=g,w=g=0,x=null,n=h.next();null!==m&&!n.done;w++,n=h.next()){m.index>w?(x=m,m=null):x=m.sibling;var t=r(e,m,n.value,k);if(null===t){null===m&&(m=x);break}a&&m&&null===t.alternate&&b(e,m);g=f(t,g,w);null===u?l=t:u.sibling=t;u=t;m=x}if(n.done)return c(e,
m),I&&tg(e,w),l;if(null===m){for(;!n.done;w++,n=h.next())n=q(e,n.value,k),null!==n&&(g=f(n,g,w),null===u?l=n:u.sibling=n,u=n);I&&tg(e,w);return l}for(m=d(e,m);!n.done;w++,n=h.next())n=y(m,e,w,n.value,k),null!==n&&(a&&null!==n.alternate&&m.delete(null===n.key?w:n.key),g=f(n,g,w),null===u?l=n:u.sibling=n,u=n);a&&m.forEach(function(a){return b(e,a)});I&&tg(e,w);return l}function J(a,d,f,h){"object"===typeof f&&null!==f&&f.type===ya&&null===f.key&&(f=f.props.children);if("object"===typeof f&&null!==f){switch(f.$$typeof){case va:a:{for(var k=
f.key,l=d;null!==l;){if(l.key===k){k=f.type;if(k===ya){if(7===l.tag){c(a,l.sibling);d=e(l,f.props.children);d.return=a;a=d;break a}}else if(l.elementType===k||"object"===typeof k&&null!==k&&k.$$typeof===Ha&&uh(k)===l.type){c(a,l.sibling);d=e(l,f.props);d.ref=sh(a,l,f);d.return=a;a=d;break a}c(a,l);break}else b(a,l);l=l.sibling}f.type===ya?(d=Ah(f.props.children,a.mode,h,f.key),d.return=a,a=d):(h=yh(f.type,f.key,f.props,null,a.mode,h),h.ref=sh(a,d,f),h.return=a,a=h)}return g(a);case wa:a:{for(l=f.key;null!==
d;){if(d.key===l)if(4===d.tag&&d.stateNode.containerInfo===f.containerInfo&&d.stateNode.implementation===f.implementation){c(a,d.sibling);d=e(d,f.children||[]);d.return=a;a=d;break a}else{c(a,d);break}else b(a,d);d=d.sibling}d=zh(f,a.mode,h);d.return=a;a=d}return g(a);case Ha:return l=f._init,J(a,d,l(f._payload),h)}if(eb(f))return n(a,d,f,h);if(Ka(f))return t(a,d,f,h);th(a,f)}return"string"===typeof f&&""!==f||"number"===typeof f?(f=""+f,null!==d&&6===d.tag?(c(a,d.sibling),d=e(d,f),d.return=a,a=d):
(c(a,d),d=xh(f,a.mode,h),d.return=a,a=d),g(a)):c(a,d)}return J}var Bh=vh(!0),Ch=vh(!1),Dh={},Eh=Uf(Dh),Fh=Uf(Dh),Gh=Uf(Dh);function Hh(a){if(a===Dh)throw Error(p(174));return a}function Ih(a,b){G(Gh,b);G(Fh,a);G(Eh,Dh);a=b.nodeType;switch(a){case 9:case 11:b=(b=b.documentElement)?b.namespaceURI:lb(null,"");break;default:a=8===a?b.parentNode:b,b=a.namespaceURI||null,a=a.tagName,b=lb(b,a)}E(Eh);G(Eh,b)}function Jh(){E(Eh);E(Fh);E(Gh)}
function Kh(a){Hh(Gh.current);var b=Hh(Eh.current);var c=lb(b,a.type);b!==c&&(G(Fh,a),G(Eh,c))}function Lh(a){Fh.current===a&&(E(Eh),E(Fh))}var M=Uf(0);
function Mh(a){for(var b=a;null!==b;){if(13===b.tag){var c=b.memoizedState;if(null!==c&&(c=c.dehydrated,null===c||"$?"===c.data||"$!"===c.data))return b}else if(19===b.tag&&void 0!==b.memoizedProps.revealOrder){if(0!==(b.flags&128))return b}else if(null!==b.child){b.child.return=b;b=b.child;continue}if(b===a)break;for(;null===b.sibling;){if(null===b.return||b.return===a)return null;b=b.return}b.sibling.return=b.return;b=b.sibling}return null}var Nh=[];
function Oh(){for(var a=0;a<Nh.length;a++)Nh[a]._workInProgressVersionPrimary=null;Nh.length=0}var Ph=ua.ReactCurrentDispatcher,Qh=ua.ReactCurrentBatchConfig,Rh=0,N=null,O=null,P=null,Sh=!1,Th=!1,Uh=0,Vh=0;function Q(){throw Error(p(321));}function Wh(a,b){if(null===b)return!1;for(var c=0;c<b.length&&c<a.length;c++)if(!He(a[c],b[c]))return!1;return!0}
function Xh(a,b,c,d,e,f){Rh=f;N=b;b.memoizedState=null;b.updateQueue=null;b.lanes=0;Ph.current=null===a||null===a.memoizedState?Yh:Zh;a=c(d,e);if(Th){f=0;do{Th=!1;Uh=0;if(25<=f)throw Error(p(301));f+=1;P=O=null;b.updateQueue=null;Ph.current=$h;a=c(d,e)}while(Th)}Ph.current=ai;b=null!==O&&null!==O.next;Rh=0;P=O=N=null;Sh=!1;if(b)throw Error(p(300));return a}function bi(){var a=0!==Uh;Uh=0;return a}
function ci(){var a={memoizedState:null,baseState:null,baseQueue:null,queue:null,next:null};null===P?N.memoizedState=P=a:P=P.next=a;return P}function di(){if(null===O){var a=N.alternate;a=null!==a?a.memoizedState:null}else a=O.next;var b=null===P?N.memoizedState:P.next;if(null!==b)P=b,O=a;else{if(null===a)throw Error(p(310));O=a;a={memoizedState:O.memoizedState,baseState:O.baseState,baseQueue:O.baseQueue,queue:O.queue,next:null};null===P?N.memoizedState=P=a:P=P.next=a}return P}
function ei(a,b){return"function"===typeof b?b(a):b}
function fi(a){var b=di(),c=b.queue;if(null===c)throw Error(p(311));c.lastRenderedReducer=a;var d=O,e=d.baseQueue,f=c.pending;if(null!==f){if(null!==e){var g=e.next;e.next=f.next;f.next=g}d.baseQueue=e=f;c.pending=null}if(null!==e){f=e.next;d=d.baseState;var h=g=null,k=null,l=f;do{var m=l.lane;if((Rh&m)===m)null!==k&&(k=k.next={lane:0,action:l.action,hasEagerState:l.hasEagerState,eagerState:l.eagerState,next:null}),d=l.hasEagerState?l.eagerState:a(d,l.action);else{var q={lane:m,action:l.action,hasEagerState:l.hasEagerState,
eagerState:l.eagerState,next:null};null===k?(h=k=q,g=d):k=k.next=q;N.lanes|=m;hh|=m}l=l.next}while(null!==l&&l!==f);null===k?g=d:k.next=h;He(d,b.memoizedState)||(Ug=!0);b.memoizedState=d;b.baseState=g;b.baseQueue=k;c.lastRenderedState=d}a=c.interleaved;if(null!==a){e=a;do f=e.lane,N.lanes|=f,hh|=f,e=e.next;while(e!==a)}else null===e&&(c.lanes=0);return[b.memoizedState,c.dispatch]}
function gi(a){var b=di(),c=b.queue;if(null===c)throw Error(p(311));c.lastRenderedReducer=a;var d=c.dispatch,e=c.pending,f=b.memoizedState;if(null!==e){c.pending=null;var g=e=e.next;do f=a(f,g.action),g=g.next;while(g!==e);He(f,b.memoizedState)||(Ug=!0);b.memoizedState=f;null===b.baseQueue&&(b.baseState=f);c.lastRenderedState=f}return[f,d]}function hi(){}
function ii(a,b){var c=N,d=di(),e=b(),f=!He(d.memoizedState,e);f&&(d.memoizedState=e,Ug=!0);d=d.queue;ji(ki.bind(null,c,d,a),[a]);if(d.getSnapshot!==b||f||null!==P&&P.memoizedState.tag&1){c.flags|=2048;li(9,mi.bind(null,c,d,e,b),void 0,null);if(null===R)throw Error(p(349));0!==(Rh&30)||ni(c,b,e)}return e}function ni(a,b,c){a.flags|=16384;a={getSnapshot:b,value:c};b=N.updateQueue;null===b?(b={lastEffect:null,stores:null},N.updateQueue=b,b.stores=[a]):(c=b.stores,null===c?b.stores=[a]:c.push(a))}
function mi(a,b,c,d){b.value=c;b.getSnapshot=d;oi(b)&&pi(a)}function ki(a,b,c){return c(function(){oi(b)&&pi(a)})}function oi(a){var b=a.getSnapshot;a=a.value;try{var c=b();return!He(a,c)}catch(d){return!0}}function pi(a){var b=Zg(a,1);null!==b&&mh(b,a,1,-1)}
function qi(a){var b=ci();"function"===typeof a&&(a=a());b.memoizedState=b.baseState=a;a={pending:null,interleaved:null,lanes:0,dispatch:null,lastRenderedReducer:ei,lastRenderedState:a};b.queue=a;a=a.dispatch=ri.bind(null,N,a);return[b.memoizedState,a]}
function li(a,b,c,d){a={tag:a,create:b,destroy:c,deps:d,next:null};b=N.updateQueue;null===b?(b={lastEffect:null,stores:null},N.updateQueue=b,b.lastEffect=a.next=a):(c=b.lastEffect,null===c?b.lastEffect=a.next=a:(d=c.next,c.next=a,a.next=d,b.lastEffect=a));return a}function si(){return di().memoizedState}function ti(a,b,c,d){var e=ci();N.flags|=a;e.memoizedState=li(1|b,c,void 0,void 0===d?null:d)}
function ui(a,b,c,d){var e=di();d=void 0===d?null:d;var f=void 0;if(null!==O){var g=O.memoizedState;f=g.destroy;if(null!==d&&Wh(d,g.deps)){e.memoizedState=li(b,c,f,d);return}}N.flags|=a;e.memoizedState=li(1|b,c,f,d)}function vi(a,b){return ti(8390656,8,a,b)}function ji(a,b){return ui(2048,8,a,b)}function wi(a,b){return ui(4,2,a,b)}function xi(a,b){return ui(4,4,a,b)}
function yi(a,b){if("function"===typeof b)return a=a(),b(a),function(){b(null)};if(null!==b&&void 0!==b)return a=a(),b.current=a,function(){b.current=null}}function zi(a,b,c){c=null!==c&&void 0!==c?c.concat([a]):null;return ui(4,4,yi.bind(null,b,a),c)}function Ai(){}function Bi(a,b){var c=di();b=void 0===b?null:b;var d=c.memoizedState;if(null!==d&&null!==b&&Wh(b,d[1]))return d[0];c.memoizedState=[a,b];return a}
function Ci(a,b){var c=di();b=void 0===b?null:b;var d=c.memoizedState;if(null!==d&&null!==b&&Wh(b,d[1]))return d[0];a=a();c.memoizedState=[a,b];return a}function Di(a,b,c){if(0===(Rh&21))return a.baseState&&(a.baseState=!1,Ug=!0),a.memoizedState=c;He(c,b)||(c=yc(),N.lanes|=c,hh|=c,a.baseState=!0);return b}function Ei(a,b){var c=C;C=0!==c&&4>c?c:4;a(!0);var d=Qh.transition;Qh.transition={};try{a(!1),b()}finally{C=c,Qh.transition=d}}function Fi(){return di().memoizedState}
function Gi(a,b,c){var d=lh(a);c={lane:d,action:c,hasEagerState:!1,eagerState:null,next:null};if(Hi(a))Ii(b,c);else if(c=Yg(a,b,c,d),null!==c){var e=L();mh(c,a,d,e);Ji(c,b,d)}}
function ri(a,b,c){var d=lh(a),e={lane:d,action:c,hasEagerState:!1,eagerState:null,next:null};if(Hi(a))Ii(b,e);else{var f=a.alternate;if(0===a.lanes&&(null===f||0===f.lanes)&&(f=b.lastRenderedReducer,null!==f))try{var g=b.lastRenderedState,h=f(g,c);e.hasEagerState=!0;e.eagerState=h;if(He(h,g)){var k=b.interleaved;null===k?(e.next=e,Xg(b)):(e.next=k.next,k.next=e);b.interleaved=e;return}}catch(l){}finally{}c=Yg(a,b,e,d);null!==c&&(e=L(),mh(c,a,d,e),Ji(c,b,d))}}
function Hi(a){var b=a.alternate;return a===N||null!==b&&b===N}function Ii(a,b){Th=Sh=!0;var c=a.pending;null===c?b.next=b:(b.next=c.next,c.next=b);a.pending=b}function Ji(a,b,c){if(0!==(c&4194240)){var d=b.lanes;d&=a.pendingLanes;c|=d;b.lanes=c;Cc(a,c)}}
var ai={readContext:Vg,useCallback:Q,useContext:Q,useEffect:Q,useImperativeHandle:Q,useInsertionEffect:Q,useLayoutEffect:Q,useMemo:Q,useReducer:Q,useRef:Q,useState:Q,useDebugValue:Q,useDeferredValue:Q,useTransition:Q,useMutableSource:Q,useSyncExternalStore:Q,useId:Q,unstable_isNewReconciler:!1},Yh={readContext:Vg,useCallback:function(a,b){ci().memoizedState=[a,void 0===b?null:b];return a},useContext:Vg,useEffect:vi,useImperativeHandle:function(a,b,c){c=null!==c&&void 0!==c?c.concat([a]):null;return ti(4194308,
4,yi.bind(null,b,a),c)},useLayoutEffect:function(a,b){return ti(4194308,4,a,b)},useInsertionEffect:function(a,b){return ti(4,2,a,b)},useMemo:function(a,b){var c=ci();b=void 0===b?null:b;a=a();c.memoizedState=[a,b];return a},useReducer:function(a,b,c){var d=ci();b=void 0!==c?c(b):b;d.memoizedState=d.baseState=b;a={pending:null,interleaved:null,lanes:0,dispatch:null,lastRenderedReducer:a,lastRenderedState:b};d.queue=a;a=a.dispatch=Gi.bind(null,N,a);return[d.memoizedState,a]},useRef:function(a){var b=
ci();a={current:a};return b.memoizedState=a},useState:qi,useDebugValue:Ai,useDeferredValue:function(a){return ci().memoizedState=a},useTransition:function(){var a=qi(!1),b=a[0];a=Ei.bind(null,a[1]);ci().memoizedState=a;return[b,a]},useMutableSource:function(){},useSyncExternalStore:function(a,b,c){var d=N,e=ci();if(I){if(void 0===c)throw Error(p(407));c=c()}else{c=b();if(null===R)throw Error(p(349));0!==(Rh&30)||ni(d,b,c)}e.memoizedState=c;var f={value:c,getSnapshot:b};e.queue=f;vi(ki.bind(null,d,
f,a),[a]);d.flags|=2048;li(9,mi.bind(null,d,f,c,b),void 0,null);return c},useId:function(){var a=ci(),b=R.identifierPrefix;if(I){var c=sg;var d=rg;c=(d&~(1<<32-oc(d)-1)).toString(32)+c;b=":"+b+"R"+c;c=Uh++;0<c&&(b+="H"+c.toString(32));b+=":"}else c=Vh++,b=":"+b+"r"+c.toString(32)+":";return a.memoizedState=b},unstable_isNewReconciler:!1},Zh={readContext:Vg,useCallback:Bi,useContext:Vg,useEffect:ji,useImperativeHandle:zi,useInsertionEffect:wi,useLayoutEffect:xi,useMemo:Ci,useReducer:fi,useRef:si,useState:function(){return fi(ei)},
useDebugValue:Ai,useDeferredValue:function(a){var b=di();return Di(b,O.memoizedState,a)},useTransition:function(){var a=fi(ei)[0],b=di().memoizedState;return[a,b]},useMutableSource:hi,useSyncExternalStore:ii,useId:Fi,unstable_isNewReconciler:!1},$h={readContext:Vg,useCallback:Bi,useContext:Vg,useEffect:ji,useImperativeHandle:zi,useInsertionEffect:wi,useLayoutEffect:xi,useMemo:Ci,useReducer:gi,useRef:si,useState:function(){return gi(ei)},useDebugValue:Ai,useDeferredValue:function(a){var b=di();return null===
O?b.memoizedState=a:Di(b,O.memoizedState,a)},useTransition:function(){var a=gi(ei)[0],b=di().memoizedState;return[a,b]},useMutableSource:hi,useSyncExternalStore:ii,useId:Fi,unstable_isNewReconciler:!1};function Ki(a,b){try{var c="",d=b;do c+=Pa(d),d=d.return;while(d);var e=c}catch(f){e="\nError generating stack: "+f.message+"\n"+f.stack}return{value:a,source:b,stack:e,digest:null}}function Li(a,b,c){return{value:a,source:null,stack:null!=c?c:null,digest:null!=b?b:null}}
function Mi(a,b){try{console.error(b.value)}catch(c){setTimeout(function(){throw c;})}}var Ni="function"===typeof WeakMap?WeakMap:Map;function Oi(a,b,c){c=ch(-1,c);c.tag=3;c.payload={element:null};var d=b.value;c.callback=function(){Pi||(Pi=!0,Qi=d);Mi(a,b)};return c}
function Ri(a,b,c){c=ch(-1,c);c.tag=3;var d=a.type.getDerivedStateFromError;if("function"===typeof d){var e=b.value;c.payload=function(){return d(e)};c.callback=function(){Mi(a,b)}}var f=a.stateNode;null!==f&&"function"===typeof f.componentDidCatch&&(c.callback=function(){Mi(a,b);"function"!==typeof d&&(null===Si?Si=new Set([this]):Si.add(this));var c=b.stack;this.componentDidCatch(b.value,{componentStack:null!==c?c:""})});return c}
function Ti(a,b,c){var d=a.pingCache;if(null===d){d=a.pingCache=new Ni;var e=new Set;d.set(b,e)}else e=d.get(b),void 0===e&&(e=new Set,d.set(b,e));e.has(c)||(e.add(c),a=Ui.bind(null,a,b,c),b.then(a,a))}function Vi(a){do{var b;if(b=13===a.tag)b=a.memoizedState,b=null!==b?null!==b.dehydrated?!0:!1:!0;if(b)return a;a=a.return}while(null!==a);return null}
function Wi(a,b,c,d,e){if(0===(a.mode&1))return a===b?a.flags|=65536:(a.flags|=128,c.flags|=131072,c.flags&=-52805,1===c.tag&&(null===c.alternate?c.tag=17:(b=ch(-1,1),b.tag=2,dh(c,b,1))),c.lanes|=1),a;a.flags|=65536;a.lanes=e;return a}var Xi=ua.ReactCurrentOwner,Ug=!1;function Yi(a,b,c,d){b.child=null===a?Ch(b,null,c,d):Bh(b,a.child,c,d)}
function Zi(a,b,c,d,e){c=c.render;var f=b.ref;Tg(b,e);d=Xh(a,b,c,d,f,e);c=bi();if(null!==a&&!Ug)return b.updateQueue=a.updateQueue,b.flags&=-2053,a.lanes&=~e,$i(a,b,e);I&&c&&vg(b);b.flags|=1;Yi(a,b,d,e);return b.child}
function aj(a,b,c,d,e){if(null===a){var f=c.type;if("function"===typeof f&&!bj(f)&&void 0===f.defaultProps&&null===c.compare&&void 0===c.defaultProps)return b.tag=15,b.type=f,cj(a,b,f,d,e);a=yh(c.type,null,d,b,b.mode,e);a.ref=b.ref;a.return=b;return b.child=a}f=a.child;if(0===(a.lanes&e)){var g=f.memoizedProps;c=c.compare;c=null!==c?c:Ie;if(c(g,d)&&a.ref===b.ref)return $i(a,b,e)}b.flags|=1;a=wh(f,d);a.ref=b.ref;a.return=b;return b.child=a}
function cj(a,b,c,d,e){if(null!==a){var f=a.memoizedProps;if(Ie(f,d)&&a.ref===b.ref)if(Ug=!1,b.pendingProps=d=f,0!==(a.lanes&e))0!==(a.flags&131072)&&(Ug=!0);else return b.lanes=a.lanes,$i(a,b,e)}return dj(a,b,c,d,e)}
function ej(a,b,c){var d=b.pendingProps,e=d.children,f=null!==a?a.memoizedState:null;if("hidden"===d.mode)if(0===(b.mode&1))b.memoizedState={baseLanes:0,cachePool:null,transitions:null},G(fj,gj),gj|=c;else{if(0===(c&1073741824))return a=null!==f?f.baseLanes|c:c,b.lanes=b.childLanes=1073741824,b.memoizedState={baseLanes:a,cachePool:null,transitions:null},b.updateQueue=null,G(fj,gj),gj|=a,null;b.memoizedState={baseLanes:0,cachePool:null,transitions:null};d=null!==f?f.baseLanes:c;G(fj,gj);gj|=d}else null!==
f?(d=f.baseLanes|c,b.memoizedState=null):d=c,G(fj,gj),gj|=d;Yi(a,b,e,c);return b.child}function hj(a,b){var c=b.ref;if(null===a&&null!==c||null!==a&&a.ref!==c)b.flags|=512,b.flags|=2097152}function dj(a,b,c,d,e){var f=Zf(c)?Xf:H.current;f=Yf(b,f);Tg(b,e);c=Xh(a,b,c,d,f,e);d=bi();if(null!==a&&!Ug)return b.updateQueue=a.updateQueue,b.flags&=-2053,a.lanes&=~e,$i(a,b,e);I&&d&&vg(b);b.flags|=1;Yi(a,b,c,e);return b.child}
function ij(a,b,c,d,e){if(Zf(c)){var f=!0;cg(b)}else f=!1;Tg(b,e);if(null===b.stateNode)jj(a,b),ph(b,c,d),rh(b,c,d,e),d=!0;else if(null===a){var g=b.stateNode,h=b.memoizedProps;g.props=h;var k=g.context,l=c.contextType;"object"===typeof l&&null!==l?l=Vg(l):(l=Zf(c)?Xf:H.current,l=Yf(b,l));var m=c.getDerivedStateFromProps,q="function"===typeof m||"function"===typeof g.getSnapshotBeforeUpdate;q||"function"!==typeof g.UNSAFE_componentWillReceiveProps&&"function"!==typeof g.componentWillReceiveProps||
(h!==d||k!==l)&&qh(b,g,d,l);$g=!1;var r=b.memoizedState;g.state=r;gh(b,d,g,e);k=b.memoizedState;h!==d||r!==k||Wf.current||$g?("function"===typeof m&&(kh(b,c,m,d),k=b.memoizedState),(h=$g||oh(b,c,h,d,r,k,l))?(q||"function"!==typeof g.UNSAFE_componentWillMount&&"function"!==typeof g.componentWillMount||("function"===typeof g.componentWillMount&&g.componentWillMount(),"function"===typeof g.UNSAFE_componentWillMount&&g.UNSAFE_componentWillMount()),"function"===typeof g.componentDidMount&&(b.flags|=4194308)):
("function"===typeof g.componentDidMount&&(b.flags|=4194308),b.memoizedProps=d,b.memoizedState=k),g.props=d,g.state=k,g.context=l,d=h):("function"===typeof g.componentDidMount&&(b.flags|=4194308),d=!1)}else{g=b.stateNode;bh(a,b);h=b.memoizedProps;l=b.type===b.elementType?h:Lg(b.type,h);g.props=l;q=b.pendingProps;r=g.context;k=c.contextType;"object"===typeof k&&null!==k?k=Vg(k):(k=Zf(c)?Xf:H.current,k=Yf(b,k));var y=c.getDerivedStateFromProps;(m="function"===typeof y||"function"===typeof g.getSnapshotBeforeUpdate)||
"function"!==typeof g.UNSAFE_componentWillReceiveProps&&"function"!==typeof g.componentWillReceiveProps||(h!==q||r!==k)&&qh(b,g,d,k);$g=!1;r=b.memoizedState;g.state=r;gh(b,d,g,e);var n=b.memoizedState;h!==q||r!==n||Wf.current||$g?("function"===typeof y&&(kh(b,c,y,d),n=b.memoizedState),(l=$g||oh(b,c,l,d,r,n,k)||!1)?(m||"function"!==typeof g.UNSAFE_componentWillUpdate&&"function"!==typeof g.componentWillUpdate||("function"===typeof g.componentWillUpdate&&g.componentWillUpdate(d,n,k),"function"===typeof g.UNSAFE_componentWillUpdate&&
g.UNSAFE_componentWillUpdate(d,n,k)),"function"===typeof g.componentDidUpdate&&(b.flags|=4),"function"===typeof g.getSnapshotBeforeUpdate&&(b.flags|=1024)):("function"!==typeof g.componentDidUpdate||h===a.memoizedProps&&r===a.memoizedState||(b.flags|=4),"function"!==typeof g.getSnapshotBeforeUpdate||h===a.memoizedProps&&r===a.memoizedState||(b.flags|=1024),b.memoizedProps=d,b.memoizedState=n),g.props=d,g.state=n,g.context=k,d=l):("function"!==typeof g.componentDidUpdate||h===a.memoizedProps&&r===
a.memoizedState||(b.flags|=4),"function"!==typeof g.getSnapshotBeforeUpdate||h===a.memoizedProps&&r===a.memoizedState||(b.flags|=1024),d=!1)}return kj(a,b,c,d,f,e)}
function kj(a,b,c,d,e,f){hj(a,b);var g=0!==(b.flags&128);if(!d&&!g)return e&&dg(b,c,!1),$i(a,b,f);d=b.stateNode;Xi.current=b;var h=g&&"function"!==typeof c.getDerivedStateFromError?null:d.render();b.flags|=1;null!==a&&g?(b.child=Bh(b,a.child,null,f),b.child=Bh(b,null,h,f)):Yi(a,b,h,f);b.memoizedState=d.state;e&&dg(b,c,!0);return b.child}function lj(a){var b=a.stateNode;b.pendingContext?ag(a,b.pendingContext,b.pendingContext!==b.context):b.context&&ag(a,b.context,!1);Ih(a,b.containerInfo)}
function mj(a,b,c,d,e){Ig();Jg(e);b.flags|=256;Yi(a,b,c,d);return b.child}var nj={dehydrated:null,treeContext:null,retryLane:0};function oj(a){return{baseLanes:a,cachePool:null,transitions:null}}
function pj(a,b,c){var d=b.pendingProps,e=M.current,f=!1,g=0!==(b.flags&128),h;(h=g)||(h=null!==a&&null===a.memoizedState?!1:0!==(e&2));if(h)f=!0,b.flags&=-129;else if(null===a||null!==a.memoizedState)e|=1;G(M,e&1);if(null===a){Eg(b);a=b.memoizedState;if(null!==a&&(a=a.dehydrated,null!==a))return 0===(b.mode&1)?b.lanes=1:"$!"===a.data?b.lanes=8:b.lanes=1073741824,null;g=d.children;a=d.fallback;return f?(d=b.mode,f=b.child,g={mode:"hidden",children:g},0===(d&1)&&null!==f?(f.childLanes=0,f.pendingProps=
g):f=qj(g,d,0,null),a=Ah(a,d,c,null),f.return=b,a.return=b,f.sibling=a,b.child=f,b.child.memoizedState=oj(c),b.memoizedState=nj,a):rj(b,g)}e=a.memoizedState;if(null!==e&&(h=e.dehydrated,null!==h))return sj(a,b,g,d,h,e,c);if(f){f=d.fallback;g=b.mode;e=a.child;h=e.sibling;var k={mode:"hidden",children:d.children};0===(g&1)&&b.child!==e?(d=b.child,d.childLanes=0,d.pendingProps=k,b.deletions=null):(d=wh(e,k),d.subtreeFlags=e.subtreeFlags&14680064);null!==h?f=wh(h,f):(f=Ah(f,g,c,null),f.flags|=2);f.return=
b;d.return=b;d.sibling=f;b.child=d;d=f;f=b.child;g=a.child.memoizedState;g=null===g?oj(c):{baseLanes:g.baseLanes|c,cachePool:null,transitions:g.transitions};f.memoizedState=g;f.childLanes=a.childLanes&~c;b.memoizedState=nj;return d}f=a.child;a=f.sibling;d=wh(f,{mode:"visible",children:d.children});0===(b.mode&1)&&(d.lanes=c);d.return=b;d.sibling=null;null!==a&&(c=b.deletions,null===c?(b.deletions=[a],b.flags|=16):c.push(a));b.child=d;b.memoizedState=null;return d}
function rj(a,b){b=qj({mode:"visible",children:b},a.mode,0,null);b.return=a;return a.child=b}function tj(a,b,c,d){null!==d&&Jg(d);Bh(b,a.child,null,c);a=rj(b,b.pendingProps.children);a.flags|=2;b.memoizedState=null;return a}
function sj(a,b,c,d,e,f,g){if(c){if(b.flags&256)return b.flags&=-257,d=Li(Error(p(422))),tj(a,b,g,d);if(null!==b.memoizedState)return b.child=a.child,b.flags|=128,null;f=d.fallback;e=b.mode;d=qj({mode:"visible",children:d.children},e,0,null);f=Ah(f,e,g,null);f.flags|=2;d.return=b;f.return=b;d.sibling=f;b.child=d;0!==(b.mode&1)&&Bh(b,a.child,null,g);b.child.memoizedState=oj(g);b.memoizedState=nj;return f}if(0===(b.mode&1))return tj(a,b,g,null);if("$!"===e.data){d=e.nextSibling&&e.nextSibling.dataset;
if(d)var h=d.dgst;d=h;f=Error(p(419));d=Li(f,d,void 0);return tj(a,b,g,d)}h=0!==(g&a.childLanes);if(Ug||h){d=R;if(null!==d){switch(g&-g){case 4:e=2;break;case 16:e=8;break;case 64:case 128:case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:case 4194304:case 8388608:case 16777216:case 33554432:case 67108864:e=32;break;case 536870912:e=268435456;break;default:e=0}e=0!==(e&(d.suspendedLanes|g))?0:e;
0!==e&&e!==f.retryLane&&(f.retryLane=e,Zg(a,e),mh(d,a,e,-1))}uj();d=Li(Error(p(421)));return tj(a,b,g,d)}if("$?"===e.data)return b.flags|=128,b.child=a.child,b=vj.bind(null,a),e._reactRetry=b,null;a=f.treeContext;yg=Lf(e.nextSibling);xg=b;I=!0;zg=null;null!==a&&(og[pg++]=rg,og[pg++]=sg,og[pg++]=qg,rg=a.id,sg=a.overflow,qg=b);b=rj(b,d.children);b.flags|=4096;return b}function wj(a,b,c){a.lanes|=b;var d=a.alternate;null!==d&&(d.lanes|=b);Sg(a.return,b,c)}
function xj(a,b,c,d,e){var f=a.memoizedState;null===f?a.memoizedState={isBackwards:b,rendering:null,renderingStartTime:0,last:d,tail:c,tailMode:e}:(f.isBackwards=b,f.rendering=null,f.renderingStartTime=0,f.last=d,f.tail=c,f.tailMode=e)}
function yj(a,b,c){var d=b.pendingProps,e=d.revealOrder,f=d.tail;Yi(a,b,d.children,c);d=M.current;if(0!==(d&2))d=d&1|2,b.flags|=128;else{if(null!==a&&0!==(a.flags&128))a:for(a=b.child;null!==a;){if(13===a.tag)null!==a.memoizedState&&wj(a,c,b);else if(19===a.tag)wj(a,c,b);else if(null!==a.child){a.child.return=a;a=a.child;continue}if(a===b)break a;for(;null===a.sibling;){if(null===a.return||a.return===b)break a;a=a.return}a.sibling.return=a.return;a=a.sibling}d&=1}G(M,d);if(0===(b.mode&1))b.memoizedState=
null;else switch(e){case "forwards":c=b.child;for(e=null;null!==c;)a=c.alternate,null!==a&&null===Mh(a)&&(e=c),c=c.sibling;c=e;null===c?(e=b.child,b.child=null):(e=c.sibling,c.sibling=null);xj(b,!1,e,c,f);break;case "backwards":c=null;e=b.child;for(b.child=null;null!==e;){a=e.alternate;if(null!==a&&null===Mh(a)){b.child=e;break}a=e.sibling;e.sibling=c;c=e;e=a}xj(b,!0,c,null,f);break;case "together":xj(b,!1,null,null,void 0);break;default:b.memoizedState=null}return b.child}
function jj(a,b){0===(b.mode&1)&&null!==a&&(a.alternate=null,b.alternate=null,b.flags|=2)}function $i(a,b,c){null!==a&&(b.dependencies=a.dependencies);hh|=b.lanes;if(0===(c&b.childLanes))return null;if(null!==a&&b.child!==a.child)throw Error(p(153));if(null!==b.child){a=b.child;c=wh(a,a.pendingProps);b.child=c;for(c.return=b;null!==a.sibling;)a=a.sibling,c=c.sibling=wh(a,a.pendingProps),c.return=b;c.sibling=null}return b.child}
function zj(a,b,c){switch(b.tag){case 3:lj(b);Ig();break;case 5:Kh(b);break;case 1:Zf(b.type)&&cg(b);break;case 4:Ih(b,b.stateNode.containerInfo);break;case 10:var d=b.type._context,e=b.memoizedProps.value;G(Mg,d._currentValue);d._currentValue=e;break;case 13:d=b.memoizedState;if(null!==d){if(null!==d.dehydrated)return G(M,M.current&1),b.flags|=128,null;if(0!==(c&b.child.childLanes))return pj(a,b,c);G(M,M.current&1);a=$i(a,b,c);return null!==a?a.sibling:null}G(M,M.current&1);break;case 19:d=0!==(c&
b.childLanes);if(0!==(a.flags&128)){if(d)return yj(a,b,c);b.flags|=128}e=b.memoizedState;null!==e&&(e.rendering=null,e.tail=null,e.lastEffect=null);G(M,M.current);if(d)break;else return null;case 22:case 23:return b.lanes=0,ej(a,b,c)}return $i(a,b,c)}var Aj,Bj,Cj,Dj;
Aj=function(a,b){for(var c=b.child;null!==c;){if(5===c.tag||6===c.tag)a.appendChild(c.stateNode);else if(4!==c.tag&&null!==c.child){c.child.return=c;c=c.child;continue}if(c===b)break;for(;null===c.sibling;){if(null===c.return||c.return===b)return;c=c.return}c.sibling.return=c.return;c=c.sibling}};Bj=function(){};
Cj=function(a,b,c,d){var e=a.memoizedProps;if(e!==d){a=b.stateNode;Hh(Eh.current);var f=null;switch(c){case "input":e=Ya(a,e);d=Ya(a,d);f=[];break;case "select":e=A({},e,{value:void 0});d=A({},d,{value:void 0});f=[];break;case "textarea":e=gb(a,e);d=gb(a,d);f=[];break;default:"function"!==typeof e.onClick&&"function"===typeof d.onClick&&(a.onclick=Bf)}ub(c,d);var g;c=null;for(l in e)if(!d.hasOwnProperty(l)&&e.hasOwnProperty(l)&&null!=e[l])if("style"===l){var h=e[l];for(g in h)h.hasOwnProperty(g)&&
(c||(c={}),c[g]="")}else"dangerouslySetInnerHTML"!==l&&"children"!==l&&"suppressContentEditableWarning"!==l&&"suppressHydrationWarning"!==l&&"autoFocus"!==l&&(ea.hasOwnProperty(l)?f||(f=[]):(f=f||[]).push(l,null));for(l in d){var k=d[l];h=null!=e?e[l]:void 0;if(d.hasOwnProperty(l)&&k!==h&&(null!=k||null!=h))if("style"===l)if(h){for(g in h)!h.hasOwnProperty(g)||k&&k.hasOwnProperty(g)||(c||(c={}),c[g]="");for(g in k)k.hasOwnProperty(g)&&h[g]!==k[g]&&(c||(c={}),c[g]=k[g])}else c||(f||(f=[]),f.push(l,
c)),c=k;else"dangerouslySetInnerHTML"===l?(k=k?k.__html:void 0,h=h?h.__html:void 0,null!=k&&h!==k&&(f=f||[]).push(l,k)):"children"===l?"string"!==typeof k&&"number"!==typeof k||(f=f||[]).push(l,""+k):"suppressContentEditableWarning"!==l&&"suppressHydrationWarning"!==l&&(ea.hasOwnProperty(l)?(null!=k&&"onScroll"===l&&D("scroll",a),f||h===k||(f=[])):(f=f||[]).push(l,k))}c&&(f=f||[]).push("style",c);var l=f;if(b.updateQueue=l)b.flags|=4}};Dj=function(a,b,c,d){c!==d&&(b.flags|=4)};
function Ej(a,b){if(!I)switch(a.tailMode){case "hidden":b=a.tail;for(var c=null;null!==b;)null!==b.alternate&&(c=b),b=b.sibling;null===c?a.tail=null:c.sibling=null;break;case "collapsed":c=a.tail;for(var d=null;null!==c;)null!==c.alternate&&(d=c),c=c.sibling;null===d?b||null===a.tail?a.tail=null:a.tail.sibling=null:d.sibling=null}}
function S(a){var b=null!==a.alternate&&a.alternate.child===a.child,c=0,d=0;if(b)for(var e=a.child;null!==e;)c|=e.lanes|e.childLanes,d|=e.subtreeFlags&14680064,d|=e.flags&14680064,e.return=a,e=e.sibling;else for(e=a.child;null!==e;)c|=e.lanes|e.childLanes,d|=e.subtreeFlags,d|=e.flags,e.return=a,e=e.sibling;a.subtreeFlags|=d;a.childLanes=c;return b}
function Fj(a,b,c){var d=b.pendingProps;wg(b);switch(b.tag){case 2:case 16:case 15:case 0:case 11:case 7:case 8:case 12:case 9:case 14:return S(b),null;case 1:return Zf(b.type)&&$f(),S(b),null;case 3:d=b.stateNode;Jh();E(Wf);E(H);Oh();d.pendingContext&&(d.context=d.pendingContext,d.pendingContext=null);if(null===a||null===a.child)Gg(b)?b.flags|=4:null===a||a.memoizedState.isDehydrated&&0===(b.flags&256)||(b.flags|=1024,null!==zg&&(Gj(zg),zg=null));Bj(a,b);S(b);return null;case 5:Lh(b);var e=Hh(Gh.current);
c=b.type;if(null!==a&&null!=b.stateNode)Cj(a,b,c,d,e),a.ref!==b.ref&&(b.flags|=512,b.flags|=2097152);else{if(!d){if(null===b.stateNode)throw Error(p(166));S(b);return null}a=Hh(Eh.current);if(Gg(b)){d=b.stateNode;c=b.type;var f=b.memoizedProps;d[Of]=b;d[Pf]=f;a=0!==(b.mode&1);switch(c){case "dialog":D("cancel",d);D("close",d);break;case "iframe":case "object":case "embed":D("load",d);break;case "video":case "audio":for(e=0;e<lf.length;e++)D(lf[e],d);break;case "source":D("error",d);break;case "img":case "image":case "link":D("error",
d);D("load",d);break;case "details":D("toggle",d);break;case "input":Za(d,f);D("invalid",d);break;case "select":d._wrapperState={wasMultiple:!!f.multiple};D("invalid",d);break;case "textarea":hb(d,f),D("invalid",d)}ub(c,f);e=null;for(var g in f)if(f.hasOwnProperty(g)){var h=f[g];"children"===g?"string"===typeof h?d.textContent!==h&&(!0!==f.suppressHydrationWarning&&Af(d.textContent,h,a),e=["children",h]):"number"===typeof h&&d.textContent!==""+h&&(!0!==f.suppressHydrationWarning&&Af(d.textContent,
h,a),e=["children",""+h]):ea.hasOwnProperty(g)&&null!=h&&"onScroll"===g&&D("scroll",d)}switch(c){case "input":Va(d);db(d,f,!0);break;case "textarea":Va(d);jb(d);break;case "select":case "option":break;default:"function"===typeof f.onClick&&(d.onclick=Bf)}d=e;b.updateQueue=d;null!==d&&(b.flags|=4)}else{g=9===e.nodeType?e:e.ownerDocument;"http://www.w3.org/1999/xhtml"===a&&(a=kb(c));"http://www.w3.org/1999/xhtml"===a?"script"===c?(a=g.createElement("div"),a.innerHTML="<script>\x3c/script>",a=a.removeChild(a.firstChild)):
"string"===typeof d.is?a=g.createElement(c,{is:d.is}):(a=g.createElement(c),"select"===c&&(g=a,d.multiple?g.multiple=!0:d.size&&(g.size=d.size))):a=g.createElementNS(a,c);a[Of]=b;a[Pf]=d;Aj(a,b,!1,!1);b.stateNode=a;a:{g=vb(c,d);switch(c){case "dialog":D("cancel",a);D("close",a);e=d;break;case "iframe":case "object":case "embed":D("load",a);e=d;break;case "video":case "audio":for(e=0;e<lf.length;e++)D(lf[e],a);e=d;break;case "source":D("error",a);e=d;break;case "img":case "image":case "link":D("error",
a);D("load",a);e=d;break;case "details":D("toggle",a);e=d;break;case "input":Za(a,d);e=Ya(a,d);D("invalid",a);break;case "option":e=d;break;case "select":a._wrapperState={wasMultiple:!!d.multiple};e=A({},d,{value:void 0});D("invalid",a);break;case "textarea":hb(a,d);e=gb(a,d);D("invalid",a);break;default:e=d}ub(c,e);h=e;for(f in h)if(h.hasOwnProperty(f)){var k=h[f];"style"===f?sb(a,k):"dangerouslySetInnerHTML"===f?(k=k?k.__html:void 0,null!=k&&nb(a,k)):"children"===f?"string"===typeof k?("textarea"!==
c||""!==k)&&ob(a,k):"number"===typeof k&&ob(a,""+k):"suppressContentEditableWarning"!==f&&"suppressHydrationWarning"!==f&&"autoFocus"!==f&&(ea.hasOwnProperty(f)?null!=k&&"onScroll"===f&&D("scroll",a):null!=k&&ta(a,f,k,g))}switch(c){case "input":Va(a);db(a,d,!1);break;case "textarea":Va(a);jb(a);break;case "option":null!=d.value&&a.setAttribute("value",""+Sa(d.value));break;case "select":a.multiple=!!d.multiple;f=d.value;null!=f?fb(a,!!d.multiple,f,!1):null!=d.defaultValue&&fb(a,!!d.multiple,d.defaultValue,
!0);break;default:"function"===typeof e.onClick&&(a.onclick=Bf)}switch(c){case "button":case "input":case "select":case "textarea":d=!!d.autoFocus;break a;case "img":d=!0;break a;default:d=!1}}d&&(b.flags|=4)}null!==b.ref&&(b.flags|=512,b.flags|=2097152)}S(b);return null;case 6:if(a&&null!=b.stateNode)Dj(a,b,a.memoizedProps,d);else{if("string"!==typeof d&&null===b.stateNode)throw Error(p(166));c=Hh(Gh.current);Hh(Eh.current);if(Gg(b)){d=b.stateNode;c=b.memoizedProps;d[Of]=b;if(f=d.nodeValue!==c)if(a=
xg,null!==a)switch(a.tag){case 3:Af(d.nodeValue,c,0!==(a.mode&1));break;case 5:!0!==a.memoizedProps.suppressHydrationWarning&&Af(d.nodeValue,c,0!==(a.mode&1))}f&&(b.flags|=4)}else d=(9===c.nodeType?c:c.ownerDocument).createTextNode(d),d[Of]=b,b.stateNode=d}S(b);return null;case 13:E(M);d=b.memoizedState;if(null===a||null!==a.memoizedState&&null!==a.memoizedState.dehydrated){if(I&&null!==yg&&0!==(b.mode&1)&&0===(b.flags&128))Hg(),Ig(),b.flags|=98560,f=!1;else if(f=Gg(b),null!==d&&null!==d.dehydrated){if(null===
a){if(!f)throw Error(p(318));f=b.memoizedState;f=null!==f?f.dehydrated:null;if(!f)throw Error(p(317));f[Of]=b}else Ig(),0===(b.flags&128)&&(b.memoizedState=null),b.flags|=4;S(b);f=!1}else null!==zg&&(Gj(zg),zg=null),f=!0;if(!f)return b.flags&65536?b:null}if(0!==(b.flags&128))return b.lanes=c,b;d=null!==d;d!==(null!==a&&null!==a.memoizedState)&&d&&(b.child.flags|=8192,0!==(b.mode&1)&&(null===a||0!==(M.current&1)?0===T&&(T=3):uj()));null!==b.updateQueue&&(b.flags|=4);S(b);return null;case 4:return Jh(),
Bj(a,b),null===a&&sf(b.stateNode.containerInfo),S(b),null;case 10:return Rg(b.type._context),S(b),null;case 17:return Zf(b.type)&&$f(),S(b),null;case 19:E(M);f=b.memoizedState;if(null===f)return S(b),null;d=0!==(b.flags&128);g=f.rendering;if(null===g)if(d)Ej(f,!1);else{if(0!==T||null!==a&&0!==(a.flags&128))for(a=b.child;null!==a;){g=Mh(a);if(null!==g){b.flags|=128;Ej(f,!1);d=g.updateQueue;null!==d&&(b.updateQueue=d,b.flags|=4);b.subtreeFlags=0;d=c;for(c=b.child;null!==c;)f=c,a=d,f.flags&=14680066,
g=f.alternate,null===g?(f.childLanes=0,f.lanes=a,f.child=null,f.subtreeFlags=0,f.memoizedProps=null,f.memoizedState=null,f.updateQueue=null,f.dependencies=null,f.stateNode=null):(f.childLanes=g.childLanes,f.lanes=g.lanes,f.child=g.child,f.subtreeFlags=0,f.deletions=null,f.memoizedProps=g.memoizedProps,f.memoizedState=g.memoizedState,f.updateQueue=g.updateQueue,f.type=g.type,a=g.dependencies,f.dependencies=null===a?null:{lanes:a.lanes,firstContext:a.firstContext}),c=c.sibling;G(M,M.current&1|2);return b.child}a=
a.sibling}null!==f.tail&&B()>Hj&&(b.flags|=128,d=!0,Ej(f,!1),b.lanes=4194304)}else{if(!d)if(a=Mh(g),null!==a){if(b.flags|=128,d=!0,c=a.updateQueue,null!==c&&(b.updateQueue=c,b.flags|=4),Ej(f,!0),null===f.tail&&"hidden"===f.tailMode&&!g.alternate&&!I)return S(b),null}else 2*B()-f.renderingStartTime>Hj&&1073741824!==c&&(b.flags|=128,d=!0,Ej(f,!1),b.lanes=4194304);f.isBackwards?(g.sibling=b.child,b.child=g):(c=f.last,null!==c?c.sibling=g:b.child=g,f.last=g)}if(null!==f.tail)return b=f.tail,f.rendering=
b,f.tail=b.sibling,f.renderingStartTime=B(),b.sibling=null,c=M.current,G(M,d?c&1|2:c&1),b;S(b);return null;case 22:case 23:return Ij(),d=null!==b.memoizedState,null!==a&&null!==a.memoizedState!==d&&(b.flags|=8192),d&&0!==(b.mode&1)?0!==(gj&1073741824)&&(S(b),b.subtreeFlags&6&&(b.flags|=8192)):S(b),null;case 24:return null;case 25:return null}throw Error(p(156,b.tag));}
function Jj(a,b){wg(b);switch(b.tag){case 1:return Zf(b.type)&&$f(),a=b.flags,a&65536?(b.flags=a&-65537|128,b):null;case 3:return Jh(),E(Wf),E(H),Oh(),a=b.flags,0!==(a&65536)&&0===(a&128)?(b.flags=a&-65537|128,b):null;case 5:return Lh(b),null;case 13:E(M);a=b.memoizedState;if(null!==a&&null!==a.dehydrated){if(null===b.alternate)throw Error(p(340));Ig()}a=b.flags;return a&65536?(b.flags=a&-65537|128,b):null;case 19:return E(M),null;case 4:return Jh(),null;case 10:return Rg(b.type._context),null;case 22:case 23:return Ij(),
null;case 24:return null;default:return null}}var Kj=!1,U=!1,Lj="function"===typeof WeakSet?WeakSet:Set,V=null;function Mj(a,b){var c=a.ref;if(null!==c)if("function"===typeof c)try{c(null)}catch(d){W(a,b,d)}else c.current=null}function Nj(a,b,c){try{c()}catch(d){W(a,b,d)}}var Oj=!1;
function Pj(a,b){Cf=dd;a=Me();if(Ne(a)){if("selectionStart"in a)var c={start:a.selectionStart,end:a.selectionEnd};else a:{c=(c=a.ownerDocument)&&c.defaultView||window;var d=c.getSelection&&c.getSelection();if(d&&0!==d.rangeCount){c=d.anchorNode;var e=d.anchorOffset,f=d.focusNode;d=d.focusOffset;try{c.nodeType,f.nodeType}catch(F){c=null;break a}var g=0,h=-1,k=-1,l=0,m=0,q=a,r=null;b:for(;;){for(var y;;){q!==c||0!==e&&3!==q.nodeType||(h=g+e);q!==f||0!==d&&3!==q.nodeType||(k=g+d);3===q.nodeType&&(g+=
q.nodeValue.length);if(null===(y=q.firstChild))break;r=q;q=y}for(;;){if(q===a)break b;r===c&&++l===e&&(h=g);r===f&&++m===d&&(k=g);if(null!==(y=q.nextSibling))break;q=r;r=q.parentNode}q=y}c=-1===h||-1===k?null:{start:h,end:k}}else c=null}c=c||{start:0,end:0}}else c=null;Df={focusedElem:a,selectionRange:c};dd=!1;for(V=b;null!==V;)if(b=V,a=b.child,0!==(b.subtreeFlags&1028)&&null!==a)a.return=b,V=a;else for(;null!==V;){b=V;try{var n=b.alternate;if(0!==(b.flags&1024))switch(b.tag){case 0:case 11:case 15:break;
case 1:if(null!==n){var t=n.memoizedProps,J=n.memoizedState,x=b.stateNode,w=x.getSnapshotBeforeUpdate(b.elementType===b.type?t:Lg(b.type,t),J);x.__reactInternalSnapshotBeforeUpdate=w}break;case 3:var u=b.stateNode.containerInfo;1===u.nodeType?u.textContent="":9===u.nodeType&&u.documentElement&&u.removeChild(u.documentElement);break;case 5:case 6:case 4:case 17:break;default:throw Error(p(163));}}catch(F){W(b,b.return,F)}a=b.sibling;if(null!==a){a.return=b.return;V=a;break}V=b.return}n=Oj;Oj=!1;return n}
function Qj(a,b,c){var d=b.updateQueue;d=null!==d?d.lastEffect:null;if(null!==d){var e=d=d.next;do{if((e.tag&a)===a){var f=e.destroy;e.destroy=void 0;void 0!==f&&Nj(b,c,f)}e=e.next}while(e!==d)}}function Rj(a,b){b=b.updateQueue;b=null!==b?b.lastEffect:null;if(null!==b){var c=b=b.next;do{if((c.tag&a)===a){var d=c.create;c.destroy=d()}c=c.next}while(c!==b)}}function Sj(a){var b=a.ref;if(null!==b){var c=a.stateNode;switch(a.tag){case 5:a=c;break;default:a=c}"function"===typeof b?b(a):b.current=a}}
function Tj(a){var b=a.alternate;null!==b&&(a.alternate=null,Tj(b));a.child=null;a.deletions=null;a.sibling=null;5===a.tag&&(b=a.stateNode,null!==b&&(delete b[Of],delete b[Pf],delete b[of],delete b[Qf],delete b[Rf]));a.stateNode=null;a.return=null;a.dependencies=null;a.memoizedProps=null;a.memoizedState=null;a.pendingProps=null;a.stateNode=null;a.updateQueue=null}function Uj(a){return 5===a.tag||3===a.tag||4===a.tag}
function Vj(a){a:for(;;){for(;null===a.sibling;){if(null===a.return||Uj(a.return))return null;a=a.return}a.sibling.return=a.return;for(a=a.sibling;5!==a.tag&&6!==a.tag&&18!==a.tag;){if(a.flags&2)continue a;if(null===a.child||4===a.tag)continue a;else a.child.return=a,a=a.child}if(!(a.flags&2))return a.stateNode}}
function Wj(a,b,c){var d=a.tag;if(5===d||6===d)a=a.stateNode,b?8===c.nodeType?c.parentNode.insertBefore(a,b):c.insertBefore(a,b):(8===c.nodeType?(b=c.parentNode,b.insertBefore(a,c)):(b=c,b.appendChild(a)),c=c._reactRootContainer,null!==c&&void 0!==c||null!==b.onclick||(b.onclick=Bf));else if(4!==d&&(a=a.child,null!==a))for(Wj(a,b,c),a=a.sibling;null!==a;)Wj(a,b,c),a=a.sibling}
function Xj(a,b,c){var d=a.tag;if(5===d||6===d)a=a.stateNode,b?c.insertBefore(a,b):c.appendChild(a);else if(4!==d&&(a=a.child,null!==a))for(Xj(a,b,c),a=a.sibling;null!==a;)Xj(a,b,c),a=a.sibling}var X=null,Yj=!1;function Zj(a,b,c){for(c=c.child;null!==c;)ak(a,b,c),c=c.sibling}
function ak(a,b,c){if(lc&&"function"===typeof lc.onCommitFiberUnmount)try{lc.onCommitFiberUnmount(kc,c)}catch(h){}switch(c.tag){case 5:U||Mj(c,b);case 6:var d=X,e=Yj;X=null;Zj(a,b,c);X=d;Yj=e;null!==X&&(Yj?(a=X,c=c.stateNode,8===a.nodeType?a.parentNode.removeChild(c):a.removeChild(c)):X.removeChild(c.stateNode));break;case 18:null!==X&&(Yj?(a=X,c=c.stateNode,8===a.nodeType?Kf(a.parentNode,c):1===a.nodeType&&Kf(a,c),bd(a)):Kf(X,c.stateNode));break;case 4:d=X;e=Yj;X=c.stateNode.containerInfo;Yj=!0;
Zj(a,b,c);X=d;Yj=e;break;case 0:case 11:case 14:case 15:if(!U&&(d=c.updateQueue,null!==d&&(d=d.lastEffect,null!==d))){e=d=d.next;do{var f=e,g=f.destroy;f=f.tag;void 0!==g&&(0!==(f&2)?Nj(c,b,g):0!==(f&4)&&Nj(c,b,g));e=e.next}while(e!==d)}Zj(a,b,c);break;case 1:if(!U&&(Mj(c,b),d=c.stateNode,"function"===typeof d.componentWillUnmount))try{d.props=c.memoizedProps,d.state=c.memoizedState,d.componentWillUnmount()}catch(h){W(c,b,h)}Zj(a,b,c);break;case 21:Zj(a,b,c);break;case 22:c.mode&1?(U=(d=U)||null!==
c.memoizedState,Zj(a,b,c),U=d):Zj(a,b,c);break;default:Zj(a,b,c)}}function bk(a){var b=a.updateQueue;if(null!==b){a.updateQueue=null;var c=a.stateNode;null===c&&(c=a.stateNode=new Lj);b.forEach(function(b){var d=ck.bind(null,a,b);c.has(b)||(c.add(b),b.then(d,d))})}}
function dk(a,b){var c=b.deletions;if(null!==c)for(var d=0;d<c.length;d++){var e=c[d];try{var f=a,g=b,h=g;a:for(;null!==h;){switch(h.tag){case 5:X=h.stateNode;Yj=!1;break a;case 3:X=h.stateNode.containerInfo;Yj=!0;break a;case 4:X=h.stateNode.containerInfo;Yj=!0;break a}h=h.return}if(null===X)throw Error(p(160));ak(f,g,e);X=null;Yj=!1;var k=e.alternate;null!==k&&(k.return=null);e.return=null}catch(l){W(e,b,l)}}if(b.subtreeFlags&12854)for(b=b.child;null!==b;)ek(b,a),b=b.sibling}
function ek(a,b){var c=a.alternate,d=a.flags;switch(a.tag){case 0:case 11:case 14:case 15:dk(b,a);fk(a);if(d&4){try{Qj(3,a,a.return),Rj(3,a)}catch(t){W(a,a.return,t)}try{Qj(5,a,a.return)}catch(t){W(a,a.return,t)}}break;case 1:dk(b,a);fk(a);d&512&&null!==c&&Mj(c,c.return);break;case 5:dk(b,a);fk(a);d&512&&null!==c&&Mj(c,c.return);if(a.flags&32){var e=a.stateNode;try{ob(e,"")}catch(t){W(a,a.return,t)}}if(d&4&&(e=a.stateNode,null!=e)){var f=a.memoizedProps,g=null!==c?c.memoizedProps:f,h=a.type,k=a.updateQueue;
a.updateQueue=null;if(null!==k)try{"input"===h&&"radio"===f.type&&null!=f.name&&ab(e,f);vb(h,g);var l=vb(h,f);for(g=0;g<k.length;g+=2){var m=k[g],q=k[g+1];"style"===m?sb(e,q):"dangerouslySetInnerHTML"===m?nb(e,q):"children"===m?ob(e,q):ta(e,m,q,l)}switch(h){case "input":bb(e,f);break;case "textarea":ib(e,f);break;case "select":var r=e._wrapperState.wasMultiple;e._wrapperState.wasMultiple=!!f.multiple;var y=f.value;null!=y?fb(e,!!f.multiple,y,!1):r!==!!f.multiple&&(null!=f.defaultValue?fb(e,!!f.multiple,
f.defaultValue,!0):fb(e,!!f.multiple,f.multiple?[]:"",!1))}e[Pf]=f}catch(t){W(a,a.return,t)}}break;case 6:dk(b,a);fk(a);if(d&4){if(null===a.stateNode)throw Error(p(162));e=a.stateNode;f=a.memoizedProps;try{e.nodeValue=f}catch(t){W(a,a.return,t)}}break;case 3:dk(b,a);fk(a);if(d&4&&null!==c&&c.memoizedState.isDehydrated)try{bd(b.containerInfo)}catch(t){W(a,a.return,t)}break;case 4:dk(b,a);fk(a);break;case 13:dk(b,a);fk(a);e=a.child;e.flags&8192&&(f=null!==e.memoizedState,e.stateNode.isHidden=f,!f||
null!==e.alternate&&null!==e.alternate.memoizedState||(gk=B()));d&4&&bk(a);break;case 22:m=null!==c&&null!==c.memoizedState;a.mode&1?(U=(l=U)||m,dk(b,a),U=l):dk(b,a);fk(a);if(d&8192){l=null!==a.memoizedState;if((a.stateNode.isHidden=l)&&!m&&0!==(a.mode&1))for(V=a,m=a.child;null!==m;){for(q=V=m;null!==V;){r=V;y=r.child;switch(r.tag){case 0:case 11:case 14:case 15:Qj(4,r,r.return);break;case 1:Mj(r,r.return);var n=r.stateNode;if("function"===typeof n.componentWillUnmount){d=r;c=r.return;try{b=d,n.props=
b.memoizedProps,n.state=b.memoizedState,n.componentWillUnmount()}catch(t){W(d,c,t)}}break;case 5:Mj(r,r.return);break;case 22:if(null!==r.memoizedState){hk(q);continue}}null!==y?(y.return=r,V=y):hk(q)}m=m.sibling}a:for(m=null,q=a;;){if(5===q.tag){if(null===m){m=q;try{e=q.stateNode,l?(f=e.style,"function"===typeof f.setProperty?f.setProperty("display","none","important"):f.display="none"):(h=q.stateNode,k=q.memoizedProps.style,g=void 0!==k&&null!==k&&k.hasOwnProperty("display")?k.display:null,h.style.display=
rb("display",g))}catch(t){W(a,a.return,t)}}}else if(6===q.tag){if(null===m)try{q.stateNode.nodeValue=l?"":q.memoizedProps}catch(t){W(a,a.return,t)}}else if((22!==q.tag&&23!==q.tag||null===q.memoizedState||q===a)&&null!==q.child){q.child.return=q;q=q.child;continue}if(q===a)break a;for(;null===q.sibling;){if(null===q.return||q.return===a)break a;m===q&&(m=null);q=q.return}m===q&&(m=null);q.sibling.return=q.return;q=q.sibling}}break;case 19:dk(b,a);fk(a);d&4&&bk(a);break;case 21:break;default:dk(b,
a),fk(a)}}function fk(a){var b=a.flags;if(b&2){try{a:{for(var c=a.return;null!==c;){if(Uj(c)){var d=c;break a}c=c.return}throw Error(p(160));}switch(d.tag){case 5:var e=d.stateNode;d.flags&32&&(ob(e,""),d.flags&=-33);var f=Vj(a);Xj(a,f,e);break;case 3:case 4:var g=d.stateNode.containerInfo,h=Vj(a);Wj(a,h,g);break;default:throw Error(p(161));}}catch(k){W(a,a.return,k)}a.flags&=-3}b&4096&&(a.flags&=-4097)}function ik(a,b,c){V=a;jk(a,b,c)}
function jk(a,b,c){for(var d=0!==(a.mode&1);null!==V;){var e=V,f=e.child;if(22===e.tag&&d){var g=null!==e.memoizedState||Kj;if(!g){var h=e.alternate,k=null!==h&&null!==h.memoizedState||U;h=Kj;var l=U;Kj=g;if((U=k)&&!l)for(V=e;null!==V;)g=V,k=g.child,22===g.tag&&null!==g.memoizedState?kk(e):null!==k?(k.return=g,V=k):kk(e);for(;null!==f;)V=f,jk(f,b,c),f=f.sibling;V=e;Kj=h;U=l}lk(a,b,c)}else 0!==(e.subtreeFlags&8772)&&null!==f?(f.return=e,V=f):lk(a,b,c)}}
function lk(a){for(;null!==V;){var b=V;if(0!==(b.flags&8772)){var c=b.alternate;try{if(0!==(b.flags&8772))switch(b.tag){case 0:case 11:case 15:U||Rj(5,b);break;case 1:var d=b.stateNode;if(b.flags&4&&!U)if(null===c)d.componentDidMount();else{var e=b.elementType===b.type?c.memoizedProps:Lg(b.type,c.memoizedProps);d.componentDidUpdate(e,c.memoizedState,d.__reactInternalSnapshotBeforeUpdate)}var f=b.updateQueue;null!==f&&ih(b,f,d);break;case 3:var g=b.updateQueue;if(null!==g){c=null;if(null!==b.child)switch(b.child.tag){case 5:c=
b.child.stateNode;break;case 1:c=b.child.stateNode}ih(b,g,c)}break;case 5:var h=b.stateNode;if(null===c&&b.flags&4){c=h;var k=b.memoizedProps;switch(b.type){case "button":case "input":case "select":case "textarea":k.autoFocus&&c.focus();break;case "img":k.src&&(c.src=k.src)}}break;case 6:break;case 4:break;case 12:break;case 13:if(null===b.memoizedState){var l=b.alternate;if(null!==l){var m=l.memoizedState;if(null!==m){var q=m.dehydrated;null!==q&&bd(q)}}}break;case 19:case 17:case 21:case 22:case 23:case 25:break;
default:throw Error(p(163));}U||b.flags&512&&Sj(b)}catch(r){W(b,b.return,r)}}if(b===a){V=null;break}c=b.sibling;if(null!==c){c.return=b.return;V=c;break}V=b.return}}function hk(a){for(;null!==V;){var b=V;if(b===a){V=null;break}var c=b.sibling;if(null!==c){c.return=b.return;V=c;break}V=b.return}}
function kk(a){for(;null!==V;){var b=V;try{switch(b.tag){case 0:case 11:case 15:var c=b.return;try{Rj(4,b)}catch(k){W(b,c,k)}break;case 1:var d=b.stateNode;if("function"===typeof d.componentDidMount){var e=b.return;try{d.componentDidMount()}catch(k){W(b,e,k)}}var f=b.return;try{Sj(b)}catch(k){W(b,f,k)}break;case 5:var g=b.return;try{Sj(b)}catch(k){W(b,g,k)}}}catch(k){W(b,b.return,k)}if(b===a){V=null;break}var h=b.sibling;if(null!==h){h.return=b.return;V=h;break}V=b.return}}
var mk=Math.ceil,nk=ua.ReactCurrentDispatcher,ok=ua.ReactCurrentOwner,pk=ua.ReactCurrentBatchConfig,K=0,R=null,Y=null,Z=0,gj=0,fj=Uf(0),T=0,qk=null,hh=0,rk=0,sk=0,tk=null,uk=null,gk=0,Hj=Infinity,vk=null,Pi=!1,Qi=null,Si=null,wk=!1,xk=null,yk=0,zk=0,Ak=null,Bk=-1,Ck=0;function L(){return 0!==(K&6)?B():-1!==Bk?Bk:Bk=B()}
function lh(a){if(0===(a.mode&1))return 1;if(0!==(K&2)&&0!==Z)return Z&-Z;if(null!==Kg.transition)return 0===Ck&&(Ck=yc()),Ck;a=C;if(0!==a)return a;a=window.event;a=void 0===a?16:jd(a.type);return a}function mh(a,b,c,d){if(50<zk)throw zk=0,Ak=null,Error(p(185));Ac(a,c,d);if(0===(K&2)||a!==R)a===R&&(0===(K&2)&&(rk|=c),4===T&&Dk(a,Z)),Ek(a,d),1===c&&0===K&&0===(b.mode&1)&&(Hj=B()+500,fg&&jg())}
function Ek(a,b){var c=a.callbackNode;wc(a,b);var d=uc(a,a===R?Z:0);if(0===d)null!==c&&bc(c),a.callbackNode=null,a.callbackPriority=0;else if(b=d&-d,a.callbackPriority!==b){null!=c&&bc(c);if(1===b)0===a.tag?ig(Fk.bind(null,a)):hg(Fk.bind(null,a)),Jf(function(){0===(K&6)&&jg()}),c=null;else{switch(Dc(d)){case 1:c=fc;break;case 4:c=gc;break;case 16:c=hc;break;case 536870912:c=jc;break;default:c=hc}c=Gk(c,Hk.bind(null,a))}a.callbackPriority=b;a.callbackNode=c}}
function Hk(a,b){Bk=-1;Ck=0;if(0!==(K&6))throw Error(p(327));var c=a.callbackNode;if(Ik()&&a.callbackNode!==c)return null;var d=uc(a,a===R?Z:0);if(0===d)return null;if(0!==(d&30)||0!==(d&a.expiredLanes)||b)b=Jk(a,d);else{b=d;var e=K;K|=2;var f=Kk();if(R!==a||Z!==b)vk=null,Hj=B()+500,Lk(a,b);do try{Mk();break}catch(h){Nk(a,h)}while(1);Qg();nk.current=f;K=e;null!==Y?b=0:(R=null,Z=0,b=T)}if(0!==b){2===b&&(e=xc(a),0!==e&&(d=e,b=Ok(a,e)));if(1===b)throw c=qk,Lk(a,0),Dk(a,d),Ek(a,B()),c;if(6===b)Dk(a,d);
else{e=a.current.alternate;if(0===(d&30)&&!Pk(e)&&(b=Jk(a,d),2===b&&(f=xc(a),0!==f&&(d=f,b=Ok(a,f))),1===b))throw c=qk,Lk(a,0),Dk(a,d),Ek(a,B()),c;a.finishedWork=e;a.finishedLanes=d;switch(b){case 0:case 1:throw Error(p(345));case 2:Qk(a,uk,vk);break;case 3:Dk(a,d);if((d&130023424)===d&&(b=gk+500-B(),10<b)){if(0!==uc(a,0))break;e=a.suspendedLanes;if((e&d)!==d){L();a.pingedLanes|=a.suspendedLanes&e;break}a.timeoutHandle=Ff(Qk.bind(null,a,uk,vk),b);break}Qk(a,uk,vk);break;case 4:Dk(a,d);if((d&4194240)===
d)break;b=a.eventTimes;for(e=-1;0<d;){var g=31-oc(d);f=1<<g;g=b[g];g>e&&(e=g);d&=~f}d=e;d=B()-d;d=(120>d?120:480>d?480:1080>d?1080:1920>d?1920:3E3>d?3E3:4320>d?4320:1960*mk(d/1960))-d;if(10<d){a.timeoutHandle=Ff(Qk.bind(null,a,uk,vk),d);break}Qk(a,uk,vk);break;case 5:Qk(a,uk,vk);break;default:throw Error(p(329));}}}Ek(a,B());return a.callbackNode===c?Hk.bind(null,a):null}
function Ok(a,b){var c=tk;a.current.memoizedState.isDehydrated&&(Lk(a,b).flags|=256);a=Jk(a,b);2!==a&&(b=uk,uk=c,null!==b&&Gj(b));return a}function Gj(a){null===uk?uk=a:uk.push.apply(uk,a)}
function Pk(a){for(var b=a;;){if(b.flags&16384){var c=b.updateQueue;if(null!==c&&(c=c.stores,null!==c))for(var d=0;d<c.length;d++){var e=c[d],f=e.getSnapshot;e=e.value;try{if(!He(f(),e))return!1}catch(g){return!1}}}c=b.child;if(b.subtreeFlags&16384&&null!==c)c.return=b,b=c;else{if(b===a)break;for(;null===b.sibling;){if(null===b.return||b.return===a)return!0;b=b.return}b.sibling.return=b.return;b=b.sibling}}return!0}
function Dk(a,b){b&=~sk;b&=~rk;a.suspendedLanes|=b;a.pingedLanes&=~b;for(a=a.expirationTimes;0<b;){var c=31-oc(b),d=1<<c;a[c]=-1;b&=~d}}function Fk(a){if(0!==(K&6))throw Error(p(327));Ik();var b=uc(a,0);if(0===(b&1))return Ek(a,B()),null;var c=Jk(a,b);if(0!==a.tag&&2===c){var d=xc(a);0!==d&&(b=d,c=Ok(a,d))}if(1===c)throw c=qk,Lk(a,0),Dk(a,b),Ek(a,B()),c;if(6===c)throw Error(p(345));a.finishedWork=a.current.alternate;a.finishedLanes=b;Qk(a,uk,vk);Ek(a,B());return null}
function Rk(a,b){var c=K;K|=1;try{return a(b)}finally{K=c,0===K&&(Hj=B()+500,fg&&jg())}}function Sk(a){null!==xk&&0===xk.tag&&0===(K&6)&&Ik();var b=K;K|=1;var c=pk.transition,d=C;try{if(pk.transition=null,C=1,a)return a()}finally{C=d,pk.transition=c,K=b,0===(K&6)&&jg()}}function Ij(){gj=fj.current;E(fj)}
function Lk(a,b){a.finishedWork=null;a.finishedLanes=0;var c=a.timeoutHandle;-1!==c&&(a.timeoutHandle=-1,Gf(c));if(null!==Y)for(c=Y.return;null!==c;){var d=c;wg(d);switch(d.tag){case 1:d=d.type.childContextTypes;null!==d&&void 0!==d&&$f();break;case 3:Jh();E(Wf);E(H);Oh();break;case 5:Lh(d);break;case 4:Jh();break;case 13:E(M);break;case 19:E(M);break;case 10:Rg(d.type._context);break;case 22:case 23:Ij()}c=c.return}R=a;Y=a=wh(a.current,null);Z=gj=b;T=0;qk=null;sk=rk=hh=0;uk=tk=null;if(null!==Wg){for(b=
0;b<Wg.length;b++)if(c=Wg[b],d=c.interleaved,null!==d){c.interleaved=null;var e=d.next,f=c.pending;if(null!==f){var g=f.next;f.next=e;d.next=g}c.pending=d}Wg=null}return a}
function Nk(a,b){do{var c=Y;try{Qg();Ph.current=ai;if(Sh){for(var d=N.memoizedState;null!==d;){var e=d.queue;null!==e&&(e.pending=null);d=d.next}Sh=!1}Rh=0;P=O=N=null;Th=!1;Uh=0;ok.current=null;if(null===c||null===c.return){T=1;qk=b;Y=null;break}a:{var f=a,g=c.return,h=c,k=b;b=Z;h.flags|=32768;if(null!==k&&"object"===typeof k&&"function"===typeof k.then){var l=k,m=h,q=m.tag;if(0===(m.mode&1)&&(0===q||11===q||15===q)){var r=m.alternate;r?(m.updateQueue=r.updateQueue,m.memoizedState=r.memoizedState,
m.lanes=r.lanes):(m.updateQueue=null,m.memoizedState=null)}var y=Vi(g);if(null!==y){y.flags&=-257;Wi(y,g,h,f,b);y.mode&1&&Ti(f,l,b);b=y;k=l;var n=b.updateQueue;if(null===n){var t=new Set;t.add(k);b.updateQueue=t}else n.add(k);break a}else{if(0===(b&1)){Ti(f,l,b);uj();break a}k=Error(p(426))}}else if(I&&h.mode&1){var J=Vi(g);if(null!==J){0===(J.flags&65536)&&(J.flags|=256);Wi(J,g,h,f,b);Jg(Ki(k,h));break a}}f=k=Ki(k,h);4!==T&&(T=2);null===tk?tk=[f]:tk.push(f);f=g;do{switch(f.tag){case 3:f.flags|=65536;
b&=-b;f.lanes|=b;var x=Oi(f,k,b);fh(f,x);break a;case 1:h=k;var w=f.type,u=f.stateNode;if(0===(f.flags&128)&&("function"===typeof w.getDerivedStateFromError||null!==u&&"function"===typeof u.componentDidCatch&&(null===Si||!Si.has(u)))){f.flags|=65536;b&=-b;f.lanes|=b;var F=Ri(f,h,b);fh(f,F);break a}}f=f.return}while(null!==f)}Tk(c)}catch(na){b=na;Y===c&&null!==c&&(Y=c=c.return);continue}break}while(1)}function Kk(){var a=nk.current;nk.current=ai;return null===a?ai:a}
function uj(){if(0===T||3===T||2===T)T=4;null===R||0===(hh&268435455)&&0===(rk&268435455)||Dk(R,Z)}function Jk(a,b){var c=K;K|=2;var d=Kk();if(R!==a||Z!==b)vk=null,Lk(a,b);do try{Uk();break}catch(e){Nk(a,e)}while(1);Qg();K=c;nk.current=d;if(null!==Y)throw Error(p(261));R=null;Z=0;return T}function Uk(){for(;null!==Y;)Vk(Y)}function Mk(){for(;null!==Y&&!cc();)Vk(Y)}function Vk(a){var b=Wk(a.alternate,a,gj);a.memoizedProps=a.pendingProps;null===b?Tk(a):Y=b;ok.current=null}
function Tk(a){var b=a;do{var c=b.alternate;a=b.return;if(0===(b.flags&32768)){if(c=Fj(c,b,gj),null!==c){Y=c;return}}else{c=Jj(c,b);if(null!==c){c.flags&=32767;Y=c;return}if(null!==a)a.flags|=32768,a.subtreeFlags=0,a.deletions=null;else{T=6;Y=null;return}}b=b.sibling;if(null!==b){Y=b;return}Y=b=a}while(null!==b);0===T&&(T=5)}function Qk(a,b,c){var d=C,e=pk.transition;try{pk.transition=null,C=1,Xk(a,b,c,d)}finally{pk.transition=e,C=d}return null}
function Xk(a,b,c,d){do Ik();while(null!==xk);if(0!==(K&6))throw Error(p(327));c=a.finishedWork;var e=a.finishedLanes;if(null===c)return null;a.finishedWork=null;a.finishedLanes=0;if(c===a.current)throw Error(p(177));a.callbackNode=null;a.callbackPriority=0;var f=c.lanes|c.childLanes;Bc(a,f);a===R&&(Y=R=null,Z=0);0===(c.subtreeFlags&2064)&&0===(c.flags&2064)||wk||(wk=!0,Gk(hc,function(){Ik();return null}));f=0!==(c.flags&15990);if(0!==(c.subtreeFlags&15990)||f){f=pk.transition;pk.transition=null;
var g=C;C=1;var h=K;K|=4;ok.current=null;Pj(a,c);ek(c,a);Oe(Df);dd=!!Cf;Df=Cf=null;a.current=c;ik(c,a,e);dc();K=h;C=g;pk.transition=f}else a.current=c;wk&&(wk=!1,xk=a,yk=e);f=a.pendingLanes;0===f&&(Si=null);mc(c.stateNode,d);Ek(a,B());if(null!==b)for(d=a.onRecoverableError,c=0;c<b.length;c++)e=b[c],d(e.value,{componentStack:e.stack,digest:e.digest});if(Pi)throw Pi=!1,a=Qi,Qi=null,a;0!==(yk&1)&&0!==a.tag&&Ik();f=a.pendingLanes;0!==(f&1)?a===Ak?zk++:(zk=0,Ak=a):zk=0;jg();return null}
function Ik(){if(null!==xk){var a=Dc(yk),b=pk.transition,c=C;try{pk.transition=null;C=16>a?16:a;if(null===xk)var d=!1;else{a=xk;xk=null;yk=0;if(0!==(K&6))throw Error(p(331));var e=K;K|=4;for(V=a.current;null!==V;){var f=V,g=f.child;if(0!==(V.flags&16)){var h=f.deletions;if(null!==h){for(var k=0;k<h.length;k++){var l=h[k];for(V=l;null!==V;){var m=V;switch(m.tag){case 0:case 11:case 15:Qj(8,m,f)}var q=m.child;if(null!==q)q.return=m,V=q;else for(;null!==V;){m=V;var r=m.sibling,y=m.return;Tj(m);if(m===
l){V=null;break}if(null!==r){r.return=y;V=r;break}V=y}}}var n=f.alternate;if(null!==n){var t=n.child;if(null!==t){n.child=null;do{var J=t.sibling;t.sibling=null;t=J}while(null!==t)}}V=f}}if(0!==(f.subtreeFlags&2064)&&null!==g)g.return=f,V=g;else b:for(;null!==V;){f=V;if(0!==(f.flags&2048))switch(f.tag){case 0:case 11:case 15:Qj(9,f,f.return)}var x=f.sibling;if(null!==x){x.return=f.return;V=x;break b}V=f.return}}var w=a.current;for(V=w;null!==V;){g=V;var u=g.child;if(0!==(g.subtreeFlags&2064)&&null!==
u)u.return=g,V=u;else b:for(g=w;null!==V;){h=V;if(0!==(h.flags&2048))try{switch(h.tag){case 0:case 11:case 15:Rj(9,h)}}catch(na){W(h,h.return,na)}if(h===g){V=null;break b}var F=h.sibling;if(null!==F){F.return=h.return;V=F;break b}V=h.return}}K=e;jg();if(lc&&"function"===typeof lc.onPostCommitFiberRoot)try{lc.onPostCommitFiberRoot(kc,a)}catch(na){}d=!0}return d}finally{C=c,pk.transition=b}}return!1}function Yk(a,b,c){b=Ki(c,b);b=Oi(a,b,1);a=dh(a,b,1);b=L();null!==a&&(Ac(a,1,b),Ek(a,b))}
function W(a,b,c){if(3===a.tag)Yk(a,a,c);else for(;null!==b;){if(3===b.tag){Yk(b,a,c);break}else if(1===b.tag){var d=b.stateNode;if("function"===typeof b.type.getDerivedStateFromError||"function"===typeof d.componentDidCatch&&(null===Si||!Si.has(d))){a=Ki(c,a);a=Ri(b,a,1);b=dh(b,a,1);a=L();null!==b&&(Ac(b,1,a),Ek(b,a));break}}b=b.return}}
function Ui(a,b,c){var d=a.pingCache;null!==d&&d.delete(b);b=L();a.pingedLanes|=a.suspendedLanes&c;R===a&&(Z&c)===c&&(4===T||3===T&&(Z&130023424)===Z&&500>B()-gk?Lk(a,0):sk|=c);Ek(a,b)}function Zk(a,b){0===b&&(0===(a.mode&1)?b=1:(b=sc,sc<<=1,0===(sc&130023424)&&(sc=4194304)));var c=L();a=Zg(a,b);null!==a&&(Ac(a,b,c),Ek(a,c))}function vj(a){var b=a.memoizedState,c=0;null!==b&&(c=b.retryLane);Zk(a,c)}
function ck(a,b){var c=0;switch(a.tag){case 13:var d=a.stateNode;var e=a.memoizedState;null!==e&&(c=e.retryLane);break;case 19:d=a.stateNode;break;default:throw Error(p(314));}null!==d&&d.delete(b);Zk(a,c)}var Wk;
Wk=function(a,b,c){if(null!==a)if(a.memoizedProps!==b.pendingProps||Wf.current)Ug=!0;else{if(0===(a.lanes&c)&&0===(b.flags&128))return Ug=!1,zj(a,b,c);Ug=0!==(a.flags&131072)?!0:!1}else Ug=!1,I&&0!==(b.flags&1048576)&&ug(b,ng,b.index);b.lanes=0;switch(b.tag){case 2:var d=b.type;jj(a,b);a=b.pendingProps;var e=Yf(b,H.current);Tg(b,c);e=Xh(null,b,d,a,e,c);var f=bi();b.flags|=1;"object"===typeof e&&null!==e&&"function"===typeof e.render&&void 0===e.$$typeof?(b.tag=1,b.memoizedState=null,b.updateQueue=
null,Zf(d)?(f=!0,cg(b)):f=!1,b.memoizedState=null!==e.state&&void 0!==e.state?e.state:null,ah(b),e.updater=nh,b.stateNode=e,e._reactInternals=b,rh(b,d,a,c),b=kj(null,b,d,!0,f,c)):(b.tag=0,I&&f&&vg(b),Yi(null,b,e,c),b=b.child);return b;case 16:d=b.elementType;a:{jj(a,b);a=b.pendingProps;e=d._init;d=e(d._payload);b.type=d;e=b.tag=$k(d);a=Lg(d,a);switch(e){case 0:b=dj(null,b,d,a,c);break a;case 1:b=ij(null,b,d,a,c);break a;case 11:b=Zi(null,b,d,a,c);break a;case 14:b=aj(null,b,d,Lg(d.type,a),c);break a}throw Error(p(306,
d,""));}return b;case 0:return d=b.type,e=b.pendingProps,e=b.elementType===d?e:Lg(d,e),dj(a,b,d,e,c);case 1:return d=b.type,e=b.pendingProps,e=b.elementType===d?e:Lg(d,e),ij(a,b,d,e,c);case 3:a:{lj(b);if(null===a)throw Error(p(387));d=b.pendingProps;f=b.memoizedState;e=f.element;bh(a,b);gh(b,d,null,c);var g=b.memoizedState;d=g.element;if(f.isDehydrated)if(f={element:d,isDehydrated:!1,cache:g.cache,pendingSuspenseBoundaries:g.pendingSuspenseBoundaries,transitions:g.transitions},b.updateQueue.baseState=
f,b.memoizedState=f,b.flags&256){e=Ki(Error(p(423)),b);b=mj(a,b,d,c,e);break a}else if(d!==e){e=Ki(Error(p(424)),b);b=mj(a,b,d,c,e);break a}else for(yg=Lf(b.stateNode.containerInfo.firstChild),xg=b,I=!0,zg=null,c=Ch(b,null,d,c),b.child=c;c;)c.flags=c.flags&-3|4096,c=c.sibling;else{Ig();if(d===e){b=$i(a,b,c);break a}Yi(a,b,d,c)}b=b.child}return b;case 5:return Kh(b),null===a&&Eg(b),d=b.type,e=b.pendingProps,f=null!==a?a.memoizedProps:null,g=e.children,Ef(d,e)?g=null:null!==f&&Ef(d,f)&&(b.flags|=32),
hj(a,b),Yi(a,b,g,c),b.child;case 6:return null===a&&Eg(b),null;case 13:return pj(a,b,c);case 4:return Ih(b,b.stateNode.containerInfo),d=b.pendingProps,null===a?b.child=Bh(b,null,d,c):Yi(a,b,d,c),b.child;case 11:return d=b.type,e=b.pendingProps,e=b.elementType===d?e:Lg(d,e),Zi(a,b,d,e,c);case 7:return Yi(a,b,b.pendingProps,c),b.child;case 8:return Yi(a,b,b.pendingProps.children,c),b.child;case 12:return Yi(a,b,b.pendingProps.children,c),b.child;case 10:a:{d=b.type._context;e=b.pendingProps;f=b.memoizedProps;
g=e.value;G(Mg,d._currentValue);d._currentValue=g;if(null!==f)if(He(f.value,g)){if(f.children===e.children&&!Wf.current){b=$i(a,b,c);break a}}else for(f=b.child,null!==f&&(f.return=b);null!==f;){var h=f.dependencies;if(null!==h){g=f.child;for(var k=h.firstContext;null!==k;){if(k.context===d){if(1===f.tag){k=ch(-1,c&-c);k.tag=2;var l=f.updateQueue;if(null!==l){l=l.shared;var m=l.pending;null===m?k.next=k:(k.next=m.next,m.next=k);l.pending=k}}f.lanes|=c;k=f.alternate;null!==k&&(k.lanes|=c);Sg(f.return,
c,b);h.lanes|=c;break}k=k.next}}else if(10===f.tag)g=f.type===b.type?null:f.child;else if(18===f.tag){g=f.return;if(null===g)throw Error(p(341));g.lanes|=c;h=g.alternate;null!==h&&(h.lanes|=c);Sg(g,c,b);g=f.sibling}else g=f.child;if(null!==g)g.return=f;else for(g=f;null!==g;){if(g===b){g=null;break}f=g.sibling;if(null!==f){f.return=g.return;g=f;break}g=g.return}f=g}Yi(a,b,e.children,c);b=b.child}return b;case 9:return e=b.type,d=b.pendingProps.children,Tg(b,c),e=Vg(e),d=d(e),b.flags|=1,Yi(a,b,d,c),
b.child;case 14:return d=b.type,e=Lg(d,b.pendingProps),e=Lg(d.type,e),aj(a,b,d,e,c);case 15:return cj(a,b,b.type,b.pendingProps,c);case 17:return d=b.type,e=b.pendingProps,e=b.elementType===d?e:Lg(d,e),jj(a,b),b.tag=1,Zf(d)?(a=!0,cg(b)):a=!1,Tg(b,c),ph(b,d,e),rh(b,d,e,c),kj(null,b,d,!0,a,c);case 19:return yj(a,b,c);case 22:return ej(a,b,c)}throw Error(p(156,b.tag));};function Gk(a,b){return ac(a,b)}
function al(a,b,c,d){this.tag=a;this.key=c;this.sibling=this.child=this.return=this.stateNode=this.type=this.elementType=null;this.index=0;this.ref=null;this.pendingProps=b;this.dependencies=this.memoizedState=this.updateQueue=this.memoizedProps=null;this.mode=d;this.subtreeFlags=this.flags=0;this.deletions=null;this.childLanes=this.lanes=0;this.alternate=null}function Bg(a,b,c,d){return new al(a,b,c,d)}function bj(a){a=a.prototype;return!(!a||!a.isReactComponent)}
function $k(a){if("function"===typeof a)return bj(a)?1:0;if(void 0!==a&&null!==a){a=a.$$typeof;if(a===Da)return 11;if(a===Ga)return 14}return 2}
function wh(a,b){var c=a.alternate;null===c?(c=Bg(a.tag,b,a.key,a.mode),c.elementType=a.elementType,c.type=a.type,c.stateNode=a.stateNode,c.alternate=a,a.alternate=c):(c.pendingProps=b,c.type=a.type,c.flags=0,c.subtreeFlags=0,c.deletions=null);c.flags=a.flags&14680064;c.childLanes=a.childLanes;c.lanes=a.lanes;c.child=a.child;c.memoizedProps=a.memoizedProps;c.memoizedState=a.memoizedState;c.updateQueue=a.updateQueue;b=a.dependencies;c.dependencies=null===b?null:{lanes:b.lanes,firstContext:b.firstContext};
c.sibling=a.sibling;c.index=a.index;c.ref=a.ref;return c}
function yh(a,b,c,d,e,f){var g=2;d=a;if("function"===typeof a)bj(a)&&(g=1);else if("string"===typeof a)g=5;else a:switch(a){case ya:return Ah(c.children,e,f,b);case za:g=8;e|=8;break;case Aa:return a=Bg(12,c,b,e|2),a.elementType=Aa,a.lanes=f,a;case Ea:return a=Bg(13,c,b,e),a.elementType=Ea,a.lanes=f,a;case Fa:return a=Bg(19,c,b,e),a.elementType=Fa,a.lanes=f,a;case Ia:return qj(c,e,f,b);default:if("object"===typeof a&&null!==a)switch(a.$$typeof){case Ba:g=10;break a;case Ca:g=9;break a;case Da:g=11;
break a;case Ga:g=14;break a;case Ha:g=16;d=null;break a}throw Error(p(130,null==a?a:typeof a,""));}b=Bg(g,c,b,e);b.elementType=a;b.type=d;b.lanes=f;return b}function Ah(a,b,c,d){a=Bg(7,a,d,b);a.lanes=c;return a}function qj(a,b,c,d){a=Bg(22,a,d,b);a.elementType=Ia;a.lanes=c;a.stateNode={isHidden:!1};return a}function xh(a,b,c){a=Bg(6,a,null,b);a.lanes=c;return a}
function zh(a,b,c){b=Bg(4,null!==a.children?a.children:[],a.key,b);b.lanes=c;b.stateNode={containerInfo:a.containerInfo,pendingChildren:null,implementation:a.implementation};return b}
function bl(a,b,c,d,e){this.tag=b;this.containerInfo=a;this.finishedWork=this.pingCache=this.current=this.pendingChildren=null;this.timeoutHandle=-1;this.callbackNode=this.pendingContext=this.context=null;this.callbackPriority=0;this.eventTimes=zc(0);this.expirationTimes=zc(-1);this.entangledLanes=this.finishedLanes=this.mutableReadLanes=this.expiredLanes=this.pingedLanes=this.suspendedLanes=this.pendingLanes=0;this.entanglements=zc(0);this.identifierPrefix=d;this.onRecoverableError=e;this.mutableSourceEagerHydrationData=
null}function cl(a,b,c,d,e,f,g,h,k){a=new bl(a,b,c,h,k);1===b?(b=1,!0===f&&(b|=8)):b=0;f=Bg(3,null,null,b);a.current=f;f.stateNode=a;f.memoizedState={element:d,isDehydrated:c,cache:null,transitions:null,pendingSuspenseBoundaries:null};ah(f);return a}function dl(a,b,c){var d=3<arguments.length&&void 0!==arguments[3]?arguments[3]:null;return{$$typeof:wa,key:null==d?null:""+d,children:a,containerInfo:b,implementation:c}}
function el(a){if(!a)return Vf;a=a._reactInternals;a:{if(Vb(a)!==a||1!==a.tag)throw Error(p(170));var b=a;do{switch(b.tag){case 3:b=b.stateNode.context;break a;case 1:if(Zf(b.type)){b=b.stateNode.__reactInternalMemoizedMergedChildContext;break a}}b=b.return}while(null!==b);throw Error(p(171));}if(1===a.tag){var c=a.type;if(Zf(c))return bg(a,c,b)}return b}
function fl(a,b,c,d,e,f,g,h,k){a=cl(c,d,!0,a,e,f,g,h,k);a.context=el(null);c=a.current;d=L();e=lh(c);f=ch(d,e);f.callback=void 0!==b&&null!==b?b:null;dh(c,f,e);a.current.lanes=e;Ac(a,e,d);Ek(a,d);return a}function gl(a,b,c,d){var e=b.current,f=L(),g=lh(e);c=el(c);null===b.context?b.context=c:b.pendingContext=c;b=ch(f,g);b.payload={element:a};d=void 0===d?null:d;null!==d&&(b.callback=d);a=dh(e,b,g);null!==a&&(mh(a,e,g,f),eh(a,e,g));return g}
function hl(a){a=a.current;if(!a.child)return null;switch(a.child.tag){case 5:return a.child.stateNode;default:return a.child.stateNode}}function il(a,b){a=a.memoizedState;if(null!==a&&null!==a.dehydrated){var c=a.retryLane;a.retryLane=0!==c&&c<b?c:b}}function jl(a,b){il(a,b);(a=a.alternate)&&il(a,b)}function kl(){return null}var ll="function"===typeof reportError?reportError:function(a){console.error(a)};function ml(a){this._internalRoot=a}
nl.prototype.render=ml.prototype.render=function(a){var b=this._internalRoot;if(null===b)throw Error(p(409));gl(a,b,null,null)};nl.prototype.unmount=ml.prototype.unmount=function(){var a=this._internalRoot;if(null!==a){this._internalRoot=null;var b=a.containerInfo;Sk(function(){gl(null,a,null,null)});b[uf]=null}};function nl(a){this._internalRoot=a}
nl.prototype.unstable_scheduleHydration=function(a){if(a){var b=Hc();a={blockedOn:null,target:a,priority:b};for(var c=0;c<Qc.length&&0!==b&&b<Qc[c].priority;c++);Qc.splice(c,0,a);0===c&&Vc(a)}};function ol(a){return!(!a||1!==a.nodeType&&9!==a.nodeType&&11!==a.nodeType)}function pl(a){return!(!a||1!==a.nodeType&&9!==a.nodeType&&11!==a.nodeType&&(8!==a.nodeType||" react-mount-point-unstable "!==a.nodeValue))}function ql(){}
function rl(a,b,c,d,e){if(e){if("function"===typeof d){var f=d;d=function(){var a=hl(g);f.call(a)}}var g=fl(b,d,a,0,null,!1,!1,"",ql);a._reactRootContainer=g;a[uf]=g.current;sf(8===a.nodeType?a.parentNode:a);Sk();return g}for(;e=a.lastChild;)a.removeChild(e);if("function"===typeof d){var h=d;d=function(){var a=hl(k);h.call(a)}}var k=cl(a,0,!1,null,null,!1,!1,"",ql);a._reactRootContainer=k;a[uf]=k.current;sf(8===a.nodeType?a.parentNode:a);Sk(function(){gl(b,k,c,d)});return k}
function sl(a,b,c,d,e){var f=c._reactRootContainer;if(f){var g=f;if("function"===typeof e){var h=e;e=function(){var a=hl(g);h.call(a)}}gl(b,g,a,e)}else g=rl(c,b,a,e,d);return hl(g)}Ec=function(a){switch(a.tag){case 3:var b=a.stateNode;if(b.current.memoizedState.isDehydrated){var c=tc(b.pendingLanes);0!==c&&(Cc(b,c|1),Ek(b,B()),0===(K&6)&&(Hj=B()+500,jg()))}break;case 13:Sk(function(){var b=Zg(a,1);if(null!==b){var c=L();mh(b,a,1,c)}}),jl(a,1)}};
Fc=function(a){if(13===a.tag){var b=Zg(a,134217728);if(null!==b){var c=L();mh(b,a,134217728,c)}jl(a,134217728)}};Gc=function(a){if(13===a.tag){var b=lh(a),c=Zg(a,b);if(null!==c){var d=L();mh(c,a,b,d)}jl(a,b)}};Hc=function(){return C};Ic=function(a,b){var c=C;try{return C=a,b()}finally{C=c}};
yb=function(a,b,c){switch(b){case "input":bb(a,c);b=c.name;if("radio"===c.type&&null!=b){for(c=a;c.parentNode;)c=c.parentNode;c=c.querySelectorAll("input[name="+JSON.stringify(""+b)+'][type="radio"]');for(b=0;b<c.length;b++){var d=c[b];if(d!==a&&d.form===a.form){var e=Db(d);if(!e)throw Error(p(90));Wa(d);bb(d,e)}}}break;case "textarea":ib(a,c);break;case "select":b=c.value,null!=b&&fb(a,!!c.multiple,b,!1)}};Gb=Rk;Hb=Sk;
var tl={usingClientEntryPoint:!1,Events:[Cb,ue,Db,Eb,Fb,Rk]},ul={findFiberByHostInstance:Wc,bundleType:0,version:"18.2.0",rendererPackageName:"react-dom"};
var vl={bundleType:ul.bundleType,version:ul.version,rendererPackageName:ul.rendererPackageName,rendererConfig:ul.rendererConfig,overrideHookState:null,overrideHookStateDeletePath:null,overrideHookStateRenamePath:null,overrideProps:null,overridePropsDeletePath:null,overridePropsRenamePath:null,setErrorHandler:null,setSuspenseHandler:null,scheduleUpdate:null,currentDispatcherRef:ua.ReactCurrentDispatcher,findHostInstanceByFiber:function(a){a=Zb(a);return null===a?null:a.stateNode},findFiberByHostInstance:ul.findFiberByHostInstance||
kl,findHostInstancesForRefresh:null,scheduleRefresh:null,scheduleRoot:null,setRefreshHandler:null,getCurrentFiber:null,reconcilerVersion:"18.2.0-next-9e3b772b8-20220608"};if("undefined"!==typeof __REACT_DEVTOOLS_GLOBAL_HOOK__){var wl=__REACT_DEVTOOLS_GLOBAL_HOOK__;if(!wl.isDisabled&&wl.supportsFiber)try{kc=wl.inject(vl),lc=wl}catch(a){}}exports.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED=tl;
exports.createPortal=function(a,b){var c=2<arguments.length&&void 0!==arguments[2]?arguments[2]:null;if(!ol(b))throw Error(p(200));return dl(a,b,null,c)};exports.createRoot=function(a,b){if(!ol(a))throw Error(p(299));var c=!1,d="",e=ll;null!==b&&void 0!==b&&(!0===b.unstable_strictMode&&(c=!0),void 0!==b.identifierPrefix&&(d=b.identifierPrefix),void 0!==b.onRecoverableError&&(e=b.onRecoverableError));b=cl(a,1,!1,null,null,c,!1,d,e);a[uf]=b.current;sf(8===a.nodeType?a.parentNode:a);return new ml(b)};
exports.findDOMNode=function(a){if(null==a)return null;if(1===a.nodeType)return a;var b=a._reactInternals;if(void 0===b){if("function"===typeof a.render)throw Error(p(188));a=Object.keys(a).join(",");throw Error(p(268,a));}a=Zb(b);a=null===a?null:a.stateNode;return a};exports.flushSync=function(a){return Sk(a)};exports.hydrate=function(a,b,c){if(!pl(b))throw Error(p(200));return sl(null,a,b,!0,c)};
exports.hydrateRoot=function(a,b,c){if(!ol(a))throw Error(p(405));var d=null!=c&&c.hydratedSources||null,e=!1,f="",g=ll;null!==c&&void 0!==c&&(!0===c.unstable_strictMode&&(e=!0),void 0!==c.identifierPrefix&&(f=c.identifierPrefix),void 0!==c.onRecoverableError&&(g=c.onRecoverableError));b=fl(b,null,a,1,null!=c?c:null,e,!1,f,g);a[uf]=b.current;sf(a);if(d)for(a=0;a<d.length;a++)c=d[a],e=c._getVersion,e=e(c._source),null==b.mutableSourceEagerHydrationData?b.mutableSourceEagerHydrationData=[c,e]:b.mutableSourceEagerHydrationData.push(c,
e);return new nl(b)};exports.render=function(a,b,c){if(!pl(b))throw Error(p(200));return sl(null,a,b,!1,c)};exports.unmountComponentAtNode=function(a){if(!pl(a))throw Error(p(40));return a._reactRootContainer?(Sk(function(){sl(null,null,a,!1,function(){a._reactRootContainer=null;a[uf]=null})}),!0):!1};exports.unstable_batchedUpdates=Rk;
exports.unstable_renderSubtreeIntoContainer=function(a,b,c,d){if(!pl(c))throw Error(p(200));if(null==a||void 0===a._reactInternals)throw Error(p(38));return sl(a,b,c,!1,d)};exports.version="18.2.0-next-9e3b772b8-20220608";


/***/ }),

/***/ 20745:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {



var m = __webpack_require__(73935);
if (true) {
  exports.createRoot = m.createRoot;
  exports.hydrateRoot = m.hydrateRoot;
} else { var i; }


/***/ }),

/***/ 73935:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {



function checkDCE() {
  /* global __REACT_DEVTOOLS_GLOBAL_HOOK__ */
  if (
    typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ === 'undefined' ||
    typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE !== 'function'
  ) {
    return;
  }
  if (false) {}
  try {
    // Verify that the code above has been dead code eliminated (DCE'd).
    __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(checkDCE);
  } catch (err) {
    // DevTools shouldn't crash React, no matter what.
    // We should still report in case we break this code.
    console.error(err);
  }
}

if (true) {
  // DCE check should happen before ReactDOM bundle executes so that
  // DevTools can report bad minification during injection.
  checkDCE();
  module.exports = __webpack_require__(64448);
} else {}


/***/ }),

/***/ 75251:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

/**
 * @license React
 * react-jsx-runtime.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var f=__webpack_require__(67294),k=Symbol.for("react.element"),l=Symbol.for("react.fragment"),m=Object.prototype.hasOwnProperty,n=f.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner,p={key:!0,ref:!0,__self:!0,__source:!0};
function q(c,a,g){var b,d={},e=null,h=null;void 0!==g&&(e=""+g);void 0!==a.key&&(e=""+a.key);void 0!==a.ref&&(h=a.ref);for(b in a)m.call(a,b)&&!p.hasOwnProperty(b)&&(d[b]=a[b]);if(c&&c.defaultProps)for(b in a=c.defaultProps,a)void 0===d[b]&&(d[b]=a[b]);return{$$typeof:k,type:c,key:e,ref:h,props:d,_owner:n.current}}exports.Fragment=l;exports.jsx=q;exports.jsxs=q;


/***/ }),

/***/ 72408:
/***/ ((__unused_webpack_module, exports) => {

/**
 * @license React
 * react.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var l=Symbol.for("react.element"),n=Symbol.for("react.portal"),p=Symbol.for("react.fragment"),q=Symbol.for("react.strict_mode"),r=Symbol.for("react.profiler"),t=Symbol.for("react.provider"),u=Symbol.for("react.context"),v=Symbol.for("react.forward_ref"),w=Symbol.for("react.suspense"),x=Symbol.for("react.memo"),y=Symbol.for("react.lazy"),z=Symbol.iterator;function A(a){if(null===a||"object"!==typeof a)return null;a=z&&a[z]||a["@@iterator"];return"function"===typeof a?a:null}
var B={isMounted:function(){return!1},enqueueForceUpdate:function(){},enqueueReplaceState:function(){},enqueueSetState:function(){}},C=Object.assign,D={};function E(a,b,e){this.props=a;this.context=b;this.refs=D;this.updater=e||B}E.prototype.isReactComponent={};
E.prototype.setState=function(a,b){if("object"!==typeof a&&"function"!==typeof a&&null!=a)throw Error("setState(...): takes an object of state variables to update or a function which returns an object of state variables.");this.updater.enqueueSetState(this,a,b,"setState")};E.prototype.forceUpdate=function(a){this.updater.enqueueForceUpdate(this,a,"forceUpdate")};function F(){}F.prototype=E.prototype;function G(a,b,e){this.props=a;this.context=b;this.refs=D;this.updater=e||B}var H=G.prototype=new F;
H.constructor=G;C(H,E.prototype);H.isPureReactComponent=!0;var I=Array.isArray,J=Object.prototype.hasOwnProperty,K={current:null},L={key:!0,ref:!0,__self:!0,__source:!0};
function M(a,b,e){var d,c={},k=null,h=null;if(null!=b)for(d in void 0!==b.ref&&(h=b.ref),void 0!==b.key&&(k=""+b.key),b)J.call(b,d)&&!L.hasOwnProperty(d)&&(c[d]=b[d]);var g=arguments.length-2;if(1===g)c.children=e;else if(1<g){for(var f=Array(g),m=0;m<g;m++)f[m]=arguments[m+2];c.children=f}if(a&&a.defaultProps)for(d in g=a.defaultProps,g)void 0===c[d]&&(c[d]=g[d]);return{$$typeof:l,type:a,key:k,ref:h,props:c,_owner:K.current}}
function N(a,b){return{$$typeof:l,type:a.type,key:b,ref:a.ref,props:a.props,_owner:a._owner}}function O(a){return"object"===typeof a&&null!==a&&a.$$typeof===l}function escape(a){var b={"=":"=0",":":"=2"};return"$"+a.replace(/[=:]/g,function(a){return b[a]})}var P=/\/+/g;function Q(a,b){return"object"===typeof a&&null!==a&&null!=a.key?escape(""+a.key):b.toString(36)}
function R(a,b,e,d,c){var k=typeof a;if("undefined"===k||"boolean"===k)a=null;var h=!1;if(null===a)h=!0;else switch(k){case "string":case "number":h=!0;break;case "object":switch(a.$$typeof){case l:case n:h=!0}}if(h)return h=a,c=c(h),a=""===d?"."+Q(h,0):d,I(c)?(e="",null!=a&&(e=a.replace(P,"$&/")+"/"),R(c,b,e,"",function(a){return a})):null!=c&&(O(c)&&(c=N(c,e+(!c.key||h&&h.key===c.key?"":(""+c.key).replace(P,"$&/")+"/")+a)),b.push(c)),1;h=0;d=""===d?".":d+":";if(I(a))for(var g=0;g<a.length;g++){k=
a[g];var f=d+Q(k,g);h+=R(k,b,e,f,c)}else if(f=A(a),"function"===typeof f)for(a=f.call(a),g=0;!(k=a.next()).done;)k=k.value,f=d+Q(k,g++),h+=R(k,b,e,f,c);else if("object"===k)throw b=String(a),Error("Objects are not valid as a React child (found: "+("[object Object]"===b?"object with keys {"+Object.keys(a).join(", ")+"}":b)+"). If you meant to render a collection of children, use an array instead.");return h}
function S(a,b,e){if(null==a)return a;var d=[],c=0;R(a,d,"","",function(a){return b.call(e,a,c++)});return d}function T(a){if(-1===a._status){var b=a._result;b=b();b.then(function(b){if(0===a._status||-1===a._status)a._status=1,a._result=b},function(b){if(0===a._status||-1===a._status)a._status=2,a._result=b});-1===a._status&&(a._status=0,a._result=b)}if(1===a._status)return a._result.default;throw a._result;}
var U={current:null},V={transition:null},W={ReactCurrentDispatcher:U,ReactCurrentBatchConfig:V,ReactCurrentOwner:K};exports.Children={map:S,forEach:function(a,b,e){S(a,function(){b.apply(this,arguments)},e)},count:function(a){var b=0;S(a,function(){b++});return b},toArray:function(a){return S(a,function(a){return a})||[]},only:function(a){if(!O(a))throw Error("React.Children.only expected to receive a single React element child.");return a}};exports.Component=E;exports.Fragment=p;
exports.Profiler=r;exports.PureComponent=G;exports.StrictMode=q;exports.Suspense=w;exports.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED=W;
exports.cloneElement=function(a,b,e){if(null===a||void 0===a)throw Error("React.cloneElement(...): The argument must be a React element, but you passed "+a+".");var d=C({},a.props),c=a.key,k=a.ref,h=a._owner;if(null!=b){void 0!==b.ref&&(k=b.ref,h=K.current);void 0!==b.key&&(c=""+b.key);if(a.type&&a.type.defaultProps)var g=a.type.defaultProps;for(f in b)J.call(b,f)&&!L.hasOwnProperty(f)&&(d[f]=void 0===b[f]&&void 0!==g?g[f]:b[f])}var f=arguments.length-2;if(1===f)d.children=e;else if(1<f){g=Array(f);
for(var m=0;m<f;m++)g[m]=arguments[m+2];d.children=g}return{$$typeof:l,type:a.type,key:c,ref:k,props:d,_owner:h}};exports.createContext=function(a){a={$$typeof:u,_currentValue:a,_currentValue2:a,_threadCount:0,Provider:null,Consumer:null,_defaultValue:null,_globalName:null};a.Provider={$$typeof:t,_context:a};return a.Consumer=a};exports.createElement=M;exports.createFactory=function(a){var b=M.bind(null,a);b.type=a;return b};exports.createRef=function(){return{current:null}};
exports.forwardRef=function(a){return{$$typeof:v,render:a}};exports.isValidElement=O;exports.lazy=function(a){return{$$typeof:y,_payload:{_status:-1,_result:a},_init:T}};exports.memo=function(a,b){return{$$typeof:x,type:a,compare:void 0===b?null:b}};exports.startTransition=function(a){var b=V.transition;V.transition={};try{a()}finally{V.transition=b}};exports.unstable_act=function(){throw Error("act(...) is not supported in production builds of React.");};
exports.useCallback=function(a,b){return U.current.useCallback(a,b)};exports.useContext=function(a){return U.current.useContext(a)};exports.useDebugValue=function(){};exports.useDeferredValue=function(a){return U.current.useDeferredValue(a)};exports.useEffect=function(a,b){return U.current.useEffect(a,b)};exports.useId=function(){return U.current.useId()};exports.useImperativeHandle=function(a,b,e){return U.current.useImperativeHandle(a,b,e)};
exports.useInsertionEffect=function(a,b){return U.current.useInsertionEffect(a,b)};exports.useLayoutEffect=function(a,b){return U.current.useLayoutEffect(a,b)};exports.useMemo=function(a,b){return U.current.useMemo(a,b)};exports.useReducer=function(a,b,e){return U.current.useReducer(a,b,e)};exports.useRef=function(a){return U.current.useRef(a)};exports.useState=function(a){return U.current.useState(a)};exports.useSyncExternalStore=function(a,b,e){return U.current.useSyncExternalStore(a,b,e)};
exports.useTransition=function(){return U.current.useTransition()};exports.version="18.2.0";


/***/ }),

/***/ 67294:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {



if (true) {
  module.exports = __webpack_require__(72408);
} else {}


/***/ }),

/***/ 85893:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {



if (true) {
  module.exports = __webpack_require__(75251);
} else {}


/***/ }),

/***/ 92640:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AbsoluteFill = void 0;
const jsx_runtime_1 = __webpack_require__(85893);
const react_1 = __webpack_require__(67294);
const AbsoluteFillRefForwarding = (props, ref) => {
    const { style, ...other } = props;
    const actualStyle = (0, react_1.useMemo)(() => {
        return {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            ...style,
        };
    }, [style]);
    return (0, jsx_runtime_1.jsx)("div", { ref: ref, style: actualStyle, ...other });
};
/**
 * @description An absolutely positioned <div> element with 100% width, height, and a column flex style
 * @see [Documentation](https://www.remotion.dev/docs/absolute-fill)
 */
exports.AbsoluteFill = (0, react_1.forwardRef)(AbsoluteFillRefForwarding);


/***/ }),

/***/ 44144:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CanUseRemotionHooksProvider = exports.CanUseRemotionHooks = void 0;
const jsx_runtime_1 = __webpack_require__(85893);
const react_1 = __webpack_require__(67294);
exports.CanUseRemotionHooks = (0, react_1.createContext)(false);
const CanUseRemotionHooksProvider = ({ children }) => {
    return ((0, jsx_runtime_1.jsx)(exports.CanUseRemotionHooks.Provider, { value: true, children: children }));
};
exports.CanUseRemotionHooksProvider = CanUseRemotionHooksProvider;


/***/ }),

/***/ 72434:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Clipper = void 0;
const react_1 = __webpack_require__(67294);
const NativeLayers_js_1 = __webpack_require__(2425);
const Clipper = ({ height, width, x, y }) => {
    const { setClipRegion } = (0, react_1.useContext)(NativeLayers_js_1.NativeLayersContext);
    (0, react_1.useEffect)(() => {
        setClipRegion((c) => {
            if (c === 'hide') {
                throw new Error('Cannot render <Clipper>, because another <Null> is already rendered');
            }
            if (c === null) {
                return { height, width, x, y };
            }
            throw new Error('Cannot render <Clipper>, because another component clipping the region was already rendered (most likely <Clipper>)');
        });
        return () => {
            setClipRegion(null);
        };
    }, [height, setClipRegion, width, x, y]);
    return null;
};
exports.Clipper = Clipper;


/***/ }),

/***/ 63013:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Composition = exports.ClipComposition = void 0;
const jsx_runtime_1 = __webpack_require__(85893);
const react_1 = __webpack_require__(67294);
const react_dom_1 = __webpack_require__(73935);
const AbsoluteFill_js_1 = __webpack_require__(92640);
const CanUseRemotionHooks_js_1 = __webpack_require__(44144);
const CompositionManagerContext_js_1 = __webpack_require__(13898);
const Folder_js_1 = __webpack_require__(49512);
const NativeLayers_js_1 = __webpack_require__(2425);
const ResolveCompositionConfig_js_1 = __webpack_require__(95014);
const delay_render_js_1 = __webpack_require__(22663);
const get_remotion_environment_js_1 = __webpack_require__(48288);
const is_player_js_1 = __webpack_require__(50606);
const loading_indicator_js_1 = __webpack_require__(95490);
const nonce_js_1 = __webpack_require__(98054);
const portal_node_js_1 = __webpack_require__(91734);
const use_lazy_component_js_1 = __webpack_require__(44858);
const use_video_js_1 = __webpack_require__(3141);
const validate_composition_id_js_1 = __webpack_require__(86303);
const validate_default_props_js_1 = __webpack_require__(80607);
const ClipComposition = ({ children }) => {
    const { clipRegion } = (0, react_1.useContext)(NativeLayers_js_1.NativeLayersContext);
    const style = (0, react_1.useMemo)(() => {
        return {
            display: 'flex',
            flexDirection: 'row',
            opacity: clipRegion === 'hide' ? 0 : 1,
            clipPath: clipRegion && clipRegion !== 'hide'
                ? `polygon(${clipRegion.x}px ${clipRegion.y}px, ${clipRegion.x}px ${clipRegion.height + clipRegion.y}px, ${clipRegion.width + clipRegion.x}px ${clipRegion.height + clipRegion.y}px, ${clipRegion.width + clipRegion.x}px ${clipRegion.y}px)`
                : undefined,
        };
    }, [clipRegion]);
    return (0, jsx_runtime_1.jsx)(AbsoluteFill_js_1.AbsoluteFill, { style: style, children: children });
};
exports.ClipComposition = ClipComposition;
const Fallback = () => {
    (0, react_1.useEffect)(() => {
        const fallback = (0, delay_render_js_1.delayRender)('Waiting for Root component to unsuspend');
        return () => (0, delay_render_js_1.continueRender)(fallback);
    }, []);
    return null;
};
/**
 * @description This component is used to register a video to make it renderable and make it show in the sidebar, in dev mode.
 * @see [Documentation](https://www.remotion.dev/docs/composition)
 */
const Composition = ({ width, height, fps, durationInFrames, id, defaultProps, schema, ...compProps }) => {
    var _a, _b;
    const { registerComposition, unregisterComposition } = (0, react_1.useContext)(CompositionManagerContext_js_1.CompositionManager);
    const video = (0, use_video_js_1.useVideo)();
    const lazy = (0, use_lazy_component_js_1.useLazyComponent)(compProps);
    const nonce = (0, nonce_js_1.useNonce)();
    const isPlayer = (0, is_player_js_1.useIsPlayer)();
    const environment = (0, get_remotion_environment_js_1.getRemotionEnvironment)();
    const canUseComposition = (0, react_1.useContext)(CanUseRemotionHooks_js_1.CanUseRemotionHooks);
    if (canUseComposition) {
        if (isPlayer) {
            throw new Error('<Composition> was mounted inside the `component` that was passed to the <Player>. See https://remotion.dev/docs/wrong-composition-mount for help.');
        }
        throw new Error('<Composition> mounted inside another composition. See https://remotion.dev/docs/wrong-composition-mount for help.');
    }
    const { folderName, parentName } = (0, react_1.useContext)(Folder_js_1.FolderContext);
    (0, react_1.useEffect)(() => {
        var _a;
        // Ensure it's a URL safe id
        if (!id) {
            throw new Error('No id for composition passed.');
        }
        (0, validate_composition_id_js_1.validateCompositionId)(id);
        (0, validate_default_props_js_1.validateDefaultAndInputProps)(defaultProps, 'defaultProps', id);
        registerComposition({
            durationInFrames: durationInFrames !== null && durationInFrames !== void 0 ? durationInFrames : undefined,
            fps: fps !== null && fps !== void 0 ? fps : undefined,
            height: height !== null && height !== void 0 ? height : undefined,
            width: width !== null && width !== void 0 ? width : undefined,
            id,
            folderName,
            component: lazy,
            defaultProps: defaultProps,
            nonce,
            parentFolderName: parentName,
            schema: schema !== null && schema !== void 0 ? schema : null,
            calculateMetadata: (_a = compProps.calculateMetadata) !== null && _a !== void 0 ? _a : null,
        });
        return () => {
            unregisterComposition(id);
        };
    }, [
        durationInFrames,
        fps,
        height,
        lazy,
        id,
        folderName,
        defaultProps,
        registerComposition,
        unregisterComposition,
        width,
        nonce,
        parentName,
        schema,
        compProps.calculateMetadata,
    ]);
    const resolved = (0, ResolveCompositionConfig_js_1.useResolvedVideoConfig)(id);
    if (environment.isStudio && video && video.component === lazy) {
        const Comp = lazy;
        if (resolved === null || resolved.type !== 'success') {
            return null;
        }
        return (0, react_dom_1.createPortal)((0, jsx_runtime_1.jsx)(exports.ClipComposition, { children: (0, jsx_runtime_1.jsx)(CanUseRemotionHooks_js_1.CanUseRemotionHooksProvider, { children: (0, jsx_runtime_1.jsx)(react_1.Suspense, { fallback: (0, jsx_runtime_1.jsx)(loading_indicator_js_1.Loading, {}), children: (0, jsx_runtime_1.jsx)(Comp, { ...((_a = resolved.result.props) !== null && _a !== void 0 ? _a : {}) }) }) }) }), (0, portal_node_js_1.portalNode)());
    }
    if (environment.isRendering && video && video.component === lazy) {
        const Comp = lazy;
        if (resolved === null || resolved.type !== 'success') {
            return null;
        }
        return (0, react_dom_1.createPortal)((0, jsx_runtime_1.jsx)(CanUseRemotionHooks_js_1.CanUseRemotionHooksProvider, { children: (0, jsx_runtime_1.jsx)(react_1.Suspense, { fallback: (0, jsx_runtime_1.jsx)(Fallback, {}), children: (0, jsx_runtime_1.jsx)(Comp, { ...((_b = resolved.result.props) !== null && _b !== void 0 ? _b : {}) }) }) }), (0, portal_node_js_1.portalNode)());
    }
    return null;
};
exports.Composition = Composition;


/***/ }),

/***/ 4932:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CompositionManagerProvider = exports.compositionsRef = void 0;
const jsx_runtime_1 = __webpack_require__(85893);
const react_1 = __importStar(__webpack_require__(67294));
const CompositionManagerContext_js_1 = __webpack_require__(13898);
const RenderAssetManager_js_1 = __webpack_require__(26770);
const ResolveCompositionConfig_js_1 = __webpack_require__(95014);
const SequenceManager_js_1 = __webpack_require__(80829);
const shared_audio_tags_js_1 = __webpack_require__(3161);
exports.compositionsRef = react_1.default.createRef();
const CompositionManagerProvider = ({ children, numberOfAudioTags }) => {
    var _a;
    // Wontfix, expected to have
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [compositions, setCompositions] = (0, react_1.useState)([]);
    const currentcompositionsRef = (0, react_1.useRef)(compositions);
    const [folders, setFolders] = (0, react_1.useState)([]);
    const [canvasContent, setCanvasContent] = (0, react_1.useState)(null);
    const [currentCompositionMetadata, setCurrentCompositionMetadata] = (0, react_1.useState)(null);
    const updateCompositions = (0, react_1.useCallback)((
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    updateComps) => {
        setCompositions((comps) => {
            const updated = updateComps(comps);
            currentcompositionsRef.current = updated;
            return updated;
        });
    }, []);
    const registerComposition = (0, react_1.useCallback)((comp) => {
        updateCompositions((comps) => {
            if (comps.find((c) => c.id === comp.id)) {
                throw new Error(`Multiple composition with id ${comp.id} are registered.`);
            }
            const value = [...comps, comp]
                .slice()
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .sort((a, b) => a.nonce - b.nonce);
            return value;
        });
    }, [updateCompositions]);
    const unregisterComposition = (0, react_1.useCallback)((id) => {
        setCompositions((comps) => {
            return comps.filter((c) => c.id !== id);
        });
    }, []);
    const registerFolder = (0, react_1.useCallback)((name, parent) => {
        setFolders((prevFolders) => {
            return [
                ...prevFolders,
                {
                    name,
                    parent,
                },
            ];
        });
    }, []);
    const unregisterFolder = (0, react_1.useCallback)((name, parent) => {
        setFolders((prevFolders) => {
            return prevFolders.filter((p) => !(p.name === name && p.parent === parent));
        });
    }, []);
    (0, react_1.useImperativeHandle)(exports.compositionsRef, () => {
        return {
            getCompositions: () => currentcompositionsRef.current,
        };
    }, []);
    const composition = compositions.find((c) => (canvasContent === null || canvasContent === void 0 ? void 0 : canvasContent.type) === 'composition'
        ? c.id === canvasContent.compositionId
        : null);
    const contextValue = (0, react_1.useMemo)(() => {
        return {
            compositions,
            registerComposition,
            unregisterComposition,
            folders,
            registerFolder,
            unregisterFolder,
            currentCompositionMetadata,
            setCurrentCompositionMetadata,
            canvasContent,
            setCanvasContent,
        };
    }, [
        compositions,
        registerComposition,
        unregisterComposition,
        folders,
        registerFolder,
        unregisterFolder,
        currentCompositionMetadata,
        canvasContent,
        setCanvasContent,
    ]);
    return ((0, jsx_runtime_1.jsx)(CompositionManagerContext_js_1.CompositionManager.Provider, { value: contextValue, children: (0, jsx_runtime_1.jsx)(SequenceManager_js_1.SequenceManagerProvider, { children: (0, jsx_runtime_1.jsx)(RenderAssetManager_js_1.RenderAssetManagerProvider, { children: (0, jsx_runtime_1.jsx)(ResolveCompositionConfig_js_1.ResolveCompositionConfig, { children: (0, jsx_runtime_1.jsx)(shared_audio_tags_js_1.SharedAudioContextProvider, { numberOfAudioTags: numberOfAudioTags, component: (_a = composition === null || composition === void 0 ? void 0 : composition.component) !== null && _a !== void 0 ? _a : null, children: children }) }) }) }) }));
};
exports.CompositionManagerProvider = CompositionManagerProvider;


/***/ }),

/***/ 13898:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CompositionManager = void 0;
const react_1 = __webpack_require__(67294);
exports.CompositionManager = (0, react_1.createContext)({
    compositions: [],
    registerComposition: () => undefined,
    unregisterComposition: () => undefined,
    registerFolder: () => undefined,
    unregisterFolder: () => undefined,
    setCurrentCompositionMetadata: () => undefined,
    folders: [],
    currentCompositionMetadata: null,
    canvasContent: null,
    setCanvasContent: () => undefined,
});


/***/ }),

/***/ 75550:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.EditorPropsProvider = exports.EditorPropsContext = void 0;
const jsx_runtime_1 = __webpack_require__(85893);
const react_1 = __importStar(__webpack_require__(67294));
exports.EditorPropsContext = (0, react_1.createContext)({
    props: {},
    updateProps: () => {
        throw new Error('Not implemented');
    },
});
const EditorPropsProvider = ({ children }) => {
    const [props, setProps] = react_1.default.useState({});
    const updateProps = (0, react_1.useCallback)(({ defaultProps, id, newProps, }) => {
        setProps((prev) => {
            var _a;
            return {
                ...prev,
                [id]: typeof newProps === 'function'
                    ? newProps((_a = prev[id]) !== null && _a !== void 0 ? _a : defaultProps)
                    : newProps,
            };
        });
    }, []);
    const ctx = (0, react_1.useMemo)(() => {
        return { props, updateProps };
    }, [props, updateProps]);
    return ((0, jsx_runtime_1.jsx)(exports.EditorPropsContext.Provider, { value: ctx, children: children }));
};
exports.EditorPropsProvider = EditorPropsProvider;


/***/ }),

/***/ 49512:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Folder = exports.FolderContext = void 0;
const jsx_runtime_1 = __webpack_require__(85893);
const react_1 = __webpack_require__(67294);
const CompositionManagerContext_js_1 = __webpack_require__(13898);
const truthy_js_1 = __webpack_require__(3928);
const validate_folder_name_js_1 = __webpack_require__(80487);
exports.FolderContext = (0, react_1.createContext)({
    folderName: null,
    parentName: null,
});
/**
 * @description By wrapping a <Composition /> inside a <Folder />, you can visually categorize it in your sidebar, should you have many compositions.
 * @see [Documentation](https://www.remotion.dev/docs/folder)
 */
const Folder = ({ name, children, }) => {
    const parent = (0, react_1.useContext)(exports.FolderContext);
    const { registerFolder, unregisterFolder } = (0, react_1.useContext)(CompositionManagerContext_js_1.CompositionManager);
    (0, validate_folder_name_js_1.validateFolderName)(name);
    const parentNameArr = [parent.parentName, parent.folderName].filter(truthy_js_1.truthy);
    const parentName = parentNameArr.length === 0 ? null : parentNameArr.join('/');
    const value = (0, react_1.useMemo)(() => {
        return {
            folderName: name,
            parentName,
        };
    }, [name, parentName]);
    (0, react_1.useEffect)(() => {
        registerFolder(name, parentName);
        return () => {
            unregisterFolder(name, parentName);
        };
    }, [name, parent.folderName, parentName, registerFolder, unregisterFolder]);
    return ((0, jsx_runtime_1.jsx)(exports.FolderContext.Provider, { value: value, children: children }));
};
exports.Folder = Folder;


/***/ }),

/***/ 35139:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.IFrame = void 0;
const jsx_runtime_1 = __webpack_require__(85893);
const react_1 = __webpack_require__(67294);
const delay_render_js_1 = __webpack_require__(22663);
const IFrameRefForwarding = ({ onLoad, onError, delayRenderRetries, delayRenderTimeoutInMilliseconds, ...props }, ref) => {
    const [handle] = (0, react_1.useState)(() => (0, delay_render_js_1.delayRender)(`Loading <IFrame> with source ${props.src}`, {
        retries: delayRenderRetries !== null && delayRenderRetries !== void 0 ? delayRenderRetries : undefined,
        timeoutInMilliseconds: delayRenderTimeoutInMilliseconds !== null && delayRenderTimeoutInMilliseconds !== void 0 ? delayRenderTimeoutInMilliseconds : undefined,
    }));
    const didLoad = (0, react_1.useCallback)((e) => {
        (0, delay_render_js_1.continueRender)(handle);
        onLoad === null || onLoad === void 0 ? void 0 : onLoad(e);
    }, [handle, onLoad]);
    const didGetError = (0, react_1.useCallback)((e) => {
        (0, delay_render_js_1.continueRender)(handle);
        if (onError) {
            onError(e);
        }
        else {
            // eslint-disable-next-line no-console
            console.error('Error loading iframe:', e, 'Handle the event using the onError() prop to make this message disappear.');
        }
    }, [handle, onError]);
    return (0, jsx_runtime_1.jsx)("iframe", { ...props, ref: ref, onError: didGetError, onLoad: didLoad });
};
/**
 * @description The <IFrame /> can be used like a regular <iframe> HTML tag.
 * @see [Documentation](https://www.remotion.dev/docs/iframe)
 */
exports.IFrame = (0, react_1.forwardRef)(IFrameRefForwarding);


/***/ }),

/***/ 10074:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Img = void 0;
const jsx_runtime_1 = __webpack_require__(85893);
const react_1 = __webpack_require__(67294);
const SequenceContext_js_1 = __webpack_require__(73759);
const cancel_render_js_1 = __webpack_require__(88113);
const delay_render_js_1 = __webpack_require__(22663);
const prefetch_js_1 = __webpack_require__(32595);
const use_buffer_state_js_1 = __webpack_require__(89075);
function exponentialBackoff(errorCount) {
    return 1000 * 2 ** (errorCount - 1);
}
const ImgRefForwarding = ({ onError, maxRetries = 2, src, pauseWhenLoading, delayRenderRetries, delayRenderTimeoutInMilliseconds, ...props }, ref) => {
    const imageRef = (0, react_1.useRef)(null);
    const errors = (0, react_1.useRef)({});
    const { delayPlayback } = (0, use_buffer_state_js_1.useBufferState)();
    const sequenceContext = (0, react_1.useContext)(SequenceContext_js_1.SequenceContext);
    if (!src) {
        throw new Error('No "src" prop was passed to <Img>.');
    }
    (0, react_1.useImperativeHandle)(ref, () => {
        return imageRef.current;
    }, []);
    const actualSrc = (0, prefetch_js_1.usePreload)(src);
    const retryIn = (0, react_1.useCallback)((timeout) => {
        if (!imageRef.current) {
            return;
        }
        const currentSrc = imageRef.current.src;
        setTimeout(() => {
            var _a;
            if (!imageRef.current) {
                // Component has been unmounted, do not retry
                return;
            }
            const newSrc = (_a = imageRef.current) === null || _a === void 0 ? void 0 : _a.src;
            if (newSrc !== currentSrc) {
                // src has changed, do not retry
                return;
            }
            imageRef.current.removeAttribute('src');
            imageRef.current.setAttribute('src', newSrc);
        }, timeout);
    }, []);
    const didGetError = (0, react_1.useCallback)((e) => {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
        if (!errors.current) {
            return;
        }
        errors.current[(_a = imageRef.current) === null || _a === void 0 ? void 0 : _a.src] =
            ((_c = errors.current[(_b = imageRef.current) === null || _b === void 0 ? void 0 : _b.src]) !== null && _c !== void 0 ? _c : 0) + 1;
        if (onError &&
            ((_e = errors.current[(_d = imageRef.current) === null || _d === void 0 ? void 0 : _d.src]) !== null && _e !== void 0 ? _e : 0) > maxRetries) {
            onError(e);
            return;
        }
        if (((_g = errors.current[(_f = imageRef.current) === null || _f === void 0 ? void 0 : _f.src]) !== null && _g !== void 0 ? _g : 0) <= maxRetries) {
            const backoff = exponentialBackoff((_j = errors.current[(_h = imageRef.current) === null || _h === void 0 ? void 0 : _h.src]) !== null && _j !== void 0 ? _j : 0);
            // eslint-disable-next-line no-console
            console.warn(`Could not load image with source ${(_k = imageRef.current) === null || _k === void 0 ? void 0 : _k.src}, retrying again in ${backoff}ms`);
            retryIn(backoff);
            return;
        }
        (0, cancel_render_js_1.cancelRender)('Error loading image with src: ' + ((_l = imageRef.current) === null || _l === void 0 ? void 0 : _l.src));
    }, [maxRetries, onError, retryIn]);
    if (typeof window !== 'undefined') {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        (0, react_1.useLayoutEffect)(() => {
            if (false) {}
            const newHandle = (0, delay_render_js_1.delayRender)('Loading <Img> with src=' + actualSrc, {
                retries: delayRenderRetries !== null && delayRenderRetries !== void 0 ? delayRenderRetries : undefined,
                timeoutInMilliseconds: delayRenderTimeoutInMilliseconds !== null && delayRenderTimeoutInMilliseconds !== void 0 ? delayRenderTimeoutInMilliseconds : undefined,
            });
            const unblock = pauseWhenLoading && !(sequenceContext === null || sequenceContext === void 0 ? void 0 : sequenceContext.premounting)
                ? delayPlayback().unblock
                : () => undefined;
            const { current } = imageRef;
            const onComplete = () => {
                var _a, _b, _c, _d;
                if (((_b = errors.current[(_a = imageRef.current) === null || _a === void 0 ? void 0 : _a.src]) !== null && _b !== void 0 ? _b : 0) > 0) {
                    delete errors.current[(_c = imageRef.current) === null || _c === void 0 ? void 0 : _c.src];
                    // eslint-disable-next-line no-console
                    console.info(`Retry successful - ${(_d = imageRef.current) === null || _d === void 0 ? void 0 : _d.src} is now loaded`);
                }
                unblock();
                (0, delay_render_js_1.continueRender)(newHandle);
            };
            const didLoad = () => {
                onComplete();
            };
            if (current === null || current === void 0 ? void 0 : current.complete) {
                onComplete();
            }
            else {
                current === null || current === void 0 ? void 0 : current.addEventListener('load', didLoad, { once: true });
            }
            // If tag gets unmounted, clear pending handles because image is not going to load
            return () => {
                current === null || current === void 0 ? void 0 : current.removeEventListener('load', didLoad);
                unblock();
                (0, delay_render_js_1.continueRender)(newHandle);
            };
        }, [
            actualSrc,
            delayPlayback,
            delayRenderRetries,
            delayRenderTimeoutInMilliseconds,
            pauseWhenLoading,
            sequenceContext === null || sequenceContext === void 0 ? void 0 : sequenceContext.premounting,
        ]);
    }
    return ((0, jsx_runtime_1.jsx)("img", { ...props, ref: imageRef, src: actualSrc, onError: didGetError }));
};
/**
 * @description Works just like a regular HTML img tag. When you use the <Img> tag, Remotion will ensure that the image is loaded before rendering the frame.
 * @see [Documentation](https://www.remotion.dev/docs/img)
 */
exports.Img = (0, react_1.forwardRef)(ImgRefForwarding);


/***/ }),

/***/ 2425:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.NativeLayersProvider = exports.NativeLayersContext = void 0;
const jsx_runtime_1 = __webpack_require__(85893);
const react_1 = __webpack_require__(67294);
exports.NativeLayersContext = (0, react_1.createContext)({
    setClipRegion: () => {
        throw new Error('NativeLayers not set');
    },
    clipRegion: null,
});
const NativeLayersProvider = ({ children, }) => {
    const [clipRegion, setClipRegion] = (0, react_1.useState)(null);
    const context = (0, react_1.useMemo)(() => {
        return {
            setClipRegion,
            clipRegion,
        };
    }, [clipRegion, setClipRegion]);
    if (typeof window !== 'undefined') {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        (0, react_1.useLayoutEffect)(() => {
            window.remotion_getClipRegion = () => {
                return clipRegion;
            };
        }, [clipRegion, setClipRegion]);
    }
    return ((0, jsx_runtime_1.jsx)(exports.NativeLayersContext.Provider, { value: context, children: children }));
};
exports.NativeLayersProvider = NativeLayersProvider;


/***/ }),

/***/ 74675:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Null = void 0;
const react_1 = __webpack_require__(67294);
const NativeLayers_js_1 = __webpack_require__(2425);
const Null = () => {
    const { setClipRegion } = (0, react_1.useContext)(NativeLayers_js_1.NativeLayersContext);
    (0, react_1.useEffect)(() => {
        setClipRegion((c) => {
            if (c === null) {
                return 'hide';
            }
            // Rendering multiple <Null> is fine, because they are all hidden
            if (c === 'hide') {
                return 'hide';
            }
            throw new Error('Cannot render <Null>, because another component clipping the region was already rendered (most likely <Clipper>)');
        });
        return () => {
            setClipRegion(null);
        };
    }, [setClipRegion]);
    return null;
};
exports.Null = Null;


/***/ }),

/***/ 87929:
/***/ ((module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RemotionRoot = void 0;
const jsx_runtime_1 = __webpack_require__(85893);
const react_1 = __webpack_require__(67294);
const CompositionManager_js_1 = __webpack_require__(4932);
const EditorProps_js_1 = __webpack_require__(75550);
const NativeLayers_js_1 = __webpack_require__(2425);
const buffering_js_1 = __webpack_require__(45775);
const delay_render_js_1 = __webpack_require__(22663);
const nonce_js_1 = __webpack_require__(98054);
const prefetch_state_js_1 = __webpack_require__(15819);
const random_js_1 = __webpack_require__(34264);
const timeline_position_state_js_1 = __webpack_require__(47083);
const duration_state_js_1 = __webpack_require__(19099);
const RemotionRoot = ({ children, numberOfAudioTags }) => {
    const [remotionRootId] = (0, react_1.useState)(() => String((0, random_js_1.random)(null)));
    const [frame, setFrame] = (0, react_1.useState)(() => (0, timeline_position_state_js_1.getInitialFrameState)());
    const [playing, setPlaying] = (0, react_1.useState)(false);
    const imperativePlaying = (0, react_1.useRef)(false);
    const [fastRefreshes, setFastRefreshes] = (0, react_1.useState)(0);
    const [playbackRate, setPlaybackRate] = (0, react_1.useState)(1);
    const audioAndVideoTags = (0, react_1.useRef)([]);
    if (typeof window !== 'undefined') {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        (0, react_1.useLayoutEffect)(() => {
            window.remotion_setFrame = (f, composition, attempt) => {
                window.remotion_attempt = attempt;
                const id = (0, delay_render_js_1.delayRender)(`Setting the current frame to ${f}`);
                setFrame((s) => ({
                    ...s,
                    [composition]: f,
                }));
                requestAnimationFrame(() => (0, delay_render_js_1.continueRender)(id));
            };
            window.remotion_isPlayer = false;
        }, []);
    }
    const timelineContextValue = (0, react_1.useMemo)(() => {
        return {
            frame,
            playing,
            imperativePlaying,
            rootId: remotionRootId,
            playbackRate,
            setPlaybackRate,
            audioAndVideoTags,
        };
    }, [frame, playbackRate, playing, remotionRootId]);
    const setTimelineContextValue = (0, react_1.useMemo)(() => {
        return {
            setFrame,
            setPlaying,
        };
    }, []);
    const nonceContext = (0, react_1.useMemo)(() => {
        let counter = 0;
        return {
            getNonce: () => counter++,
            fastRefreshes,
        };
    }, [fastRefreshes]);
    (0, react_1.useEffect)(() => {
        if (true) {
            if (module.hot) {
                module.hot.addStatusHandler((status) => {
                    if (status === 'idle') {
                        setFastRefreshes((i) => i + 1);
                    }
                });
            }
        }
    }, []);
    return ((0, jsx_runtime_1.jsx)(nonce_js_1.NonceContext.Provider, { value: nonceContext, children: (0, jsx_runtime_1.jsx)(timeline_position_state_js_1.TimelineContext.Provider, { value: timelineContextValue, children: (0, jsx_runtime_1.jsx)(timeline_position_state_js_1.SetTimelineContext.Provider, { value: setTimelineContextValue, children: (0, jsx_runtime_1.jsx)(EditorProps_js_1.EditorPropsProvider, { children: (0, jsx_runtime_1.jsx)(prefetch_state_js_1.PrefetchProvider, { children: (0, jsx_runtime_1.jsx)(NativeLayers_js_1.NativeLayersProvider, { children: (0, jsx_runtime_1.jsx)(CompositionManager_js_1.CompositionManagerProvider, { numberOfAudioTags: numberOfAudioTags, children: (0, jsx_runtime_1.jsx)(duration_state_js_1.DurationsContextProvider, { children: (0, jsx_runtime_1.jsx)(buffering_js_1.BufferingProvider, { children: children }) }) }) }) }) }) }) }) }));
};
exports.RemotionRoot = RemotionRoot;


/***/ }),

/***/ 26770:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RenderAssetManagerProvider = exports.RenderAssetManager = void 0;
const jsx_runtime_1 = __webpack_require__(85893);
const react_1 = __webpack_require__(67294);
exports.RenderAssetManager = (0, react_1.createContext)({
    // Must be undefined, otherwise error in Player
    registerRenderAsset: () => undefined,
    unregisterRenderAsset: () => undefined,
    renderAssets: [],
});
const RenderAssetManagerProvider = ({ children }) => {
    const [renderAssets, setRenderAssets] = (0, react_1.useState)([]);
    const registerRenderAsset = (0, react_1.useCallback)((renderAsset) => {
        setRenderAssets((assets) => {
            return [...assets, renderAsset];
        });
    }, []);
    const unregisterRenderAsset = (0, react_1.useCallback)((id) => {
        setRenderAssets((assts) => {
            return assts.filter((a) => a.id !== id);
        });
    }, []);
    (0, react_1.useLayoutEffect)(() => {
        if (typeof window !== 'undefined') {
            window.remotion_collectAssets = () => {
                setRenderAssets([]); // clear assets at next render
                return renderAssets;
            };
        }
    }, [renderAssets]);
    const contextValue = (0, react_1.useMemo)(() => {
        return {
            registerRenderAsset,
            unregisterRenderAsset,
            renderAssets,
        };
    }, [renderAssets, registerRenderAsset, unregisterRenderAsset]);
    return ((0, jsx_runtime_1.jsx)(exports.RenderAssetManager.Provider, { value: contextValue, children: children }));
};
exports.RenderAssetManagerProvider = RenderAssetManagerProvider;


/***/ }),

/***/ 95014:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.useResolvedVideoConfig = exports.ResolveCompositionConfig = exports.needsResolution = exports.resolveCompositionsRef = exports.ResolveCompositionContext = void 0;
const jsx_runtime_1 = __webpack_require__(85893);
const react_1 = __webpack_require__(67294);
const CompositionManagerContext_js_1 = __webpack_require__(13898);
const EditorProps_js_1 = __webpack_require__(75550);
const input_props_js_1 = __webpack_require__(35287);
const get_remotion_environment_js_1 = __webpack_require__(48288);
const resolve_video_config_js_1 = __webpack_require__(28832);
const validate_dimensions_js_1 = __webpack_require__(71162);
const validate_duration_in_frames_js_1 = __webpack_require__(52363);
const validate_fps_js_1 = __webpack_require__(5868);
exports.ResolveCompositionContext = (0, react_1.createContext)(null);
exports.resolveCompositionsRef = (0, react_1.createRef)();
const needsResolution = (composition) => {
    return Boolean(composition.calculateMetadata);
};
exports.needsResolution = needsResolution;
const ResolveCompositionConfig = ({ children }) => {
    const [currentRenderModalComposition, setCurrentRenderModalComposition] = (0, react_1.useState)(null);
    const { compositions, canvasContent, currentCompositionMetadata } = (0, react_1.useContext)(CompositionManagerContext_js_1.CompositionManager);
    const selectedComposition = compositions.find((c) => canvasContent &&
        canvasContent.type === 'composition' &&
        canvasContent.compositionId === c.id);
    const renderModalComposition = compositions.find((c) => c.id === currentRenderModalComposition);
    const { props: allEditorProps } = (0, react_1.useContext)(EditorProps_js_1.EditorPropsContext);
    const [resolvedConfigs, setResolvedConfigs] = (0, react_1.useState)({});
    const selectedEditorProps = (0, react_1.useMemo)(() => {
        var _a;
        return selectedComposition
            ? (_a = allEditorProps[selectedComposition.id]) !== null && _a !== void 0 ? _a : {}
            : {};
    }, [allEditorProps, selectedComposition]);
    const renderModalProps = (0, react_1.useMemo)(() => {
        var _a;
        return renderModalComposition
            ? (_a = allEditorProps[renderModalComposition.id]) !== null && _a !== void 0 ? _a : {}
            : {};
    }, [allEditorProps, renderModalComposition]);
    const doResolution = (0, react_1.useCallback)((composition, editorProps) => {
        var _a;
        const controller = new AbortController();
        if (currentCompositionMetadata) {
            return controller;
        }
        const inputProps = typeof window === 'undefined' || (0, get_remotion_environment_js_1.getRemotionEnvironment)().isPlayer
            ? {}
            : (_a = (0, input_props_js_1.getInputProps)()) !== null && _a !== void 0 ? _a : {};
        const { signal } = controller;
        const promOrNot = (0, resolve_video_config_js_1.resolveVideoConfig)({
            composition,
            editorProps,
            inputProps,
            signal,
        });
        if (typeof promOrNot === 'object' && 'then' in promOrNot) {
            setResolvedConfigs((r) => ({
                ...r,
                [composition.id]: {
                    type: 'loading',
                },
            }));
            promOrNot
                .then((c) => {
                if (controller.signal.aborted) {
                    return;
                }
                setResolvedConfigs((r) => ({
                    ...r,
                    [composition.id]: {
                        type: 'success',
                        result: c,
                    },
                }));
            })
                .catch((err) => {
                if (controller.signal.aborted) {
                    return;
                }
                setResolvedConfigs((r) => ({
                    ...r,
                    [composition.id]: {
                        type: 'error',
                        error: err,
                    },
                }));
            });
        }
        else {
            setResolvedConfigs((r) => ({
                ...r,
                [composition.id]: {
                    type: 'success',
                    result: promOrNot,
                },
            }));
        }
        return controller;
    }, [currentCompositionMetadata]);
    const currentComposition = (canvasContent === null || canvasContent === void 0 ? void 0 : canvasContent.type) === 'composition' ? canvasContent.compositionId : null;
    (0, react_1.useImperativeHandle)(exports.resolveCompositionsRef, () => {
        return {
            setCurrentRenderModalComposition: (id) => {
                setCurrentRenderModalComposition(id);
            },
            reloadCurrentlySelectedComposition: () => {
                var _a;
                if (!currentComposition) {
                    return;
                }
                const composition = compositions.find((c) => c.id === currentComposition);
                if (!composition) {
                    throw new Error(`Could not find composition with id ${currentComposition}`);
                }
                const editorProps = (_a = allEditorProps[currentComposition]) !== null && _a !== void 0 ? _a : {};
                doResolution(composition, editorProps);
            },
        };
    }, [allEditorProps, compositions, currentComposition, doResolution]);
    const isTheSame = (selectedComposition === null || selectedComposition === void 0 ? void 0 : selectedComposition.id) === (renderModalComposition === null || renderModalComposition === void 0 ? void 0 : renderModalComposition.id);
    (0, react_1.useEffect)(() => {
        if (selectedComposition && (0, exports.needsResolution)(selectedComposition)) {
            const controller = doResolution(selectedComposition, selectedEditorProps);
            return () => {
                controller.abort();
            };
        }
    }, [doResolution, selectedComposition, selectedEditorProps]);
    (0, react_1.useEffect)(() => {
        if (renderModalComposition && !isTheSame) {
            const controller = doResolution(renderModalComposition, renderModalProps);
            return () => {
                controller.abort();
            };
        }
    }, [doResolution, isTheSame, renderModalComposition, renderModalProps]);
    const resolvedConfigsIncludingStaticOnes = (0, react_1.useMemo)(() => {
        const staticComps = compositions.filter((c) => {
            return c.calculateMetadata === null;
        });
        return {
            ...resolvedConfigs,
            ...staticComps.reduce((acc, curr) => {
                var _a;
                return {
                    ...acc,
                    [curr.id]: {
                        type: 'success',
                        result: { ...curr, defaultProps: (_a = curr.defaultProps) !== null && _a !== void 0 ? _a : {} },
                    },
                };
            }, {}),
        };
    }, [compositions, resolvedConfigs]);
    return ((0, jsx_runtime_1.jsx)(exports.ResolveCompositionContext.Provider, { value: resolvedConfigsIncludingStaticOnes, children: children }));
};
exports.ResolveCompositionConfig = ResolveCompositionConfig;
const useResolvedVideoConfig = (preferredCompositionId) => {
    const context = (0, react_1.useContext)(exports.ResolveCompositionContext);
    const { props: allEditorProps } = (0, react_1.useContext)(EditorProps_js_1.EditorPropsContext);
    const { compositions, canvasContent, currentCompositionMetadata } = (0, react_1.useContext)(CompositionManagerContext_js_1.CompositionManager);
    const currentComposition = (canvasContent === null || canvasContent === void 0 ? void 0 : canvasContent.type) === 'composition' ? canvasContent.compositionId : null;
    const compositionId = preferredCompositionId !== null && preferredCompositionId !== void 0 ? preferredCompositionId : currentComposition;
    const composition = compositions.find((c) => c.id === compositionId);
    const selectedEditorProps = (0, react_1.useMemo)(() => {
        var _a;
        return composition ? (_a = allEditorProps[composition.id]) !== null && _a !== void 0 ? _a : {} : {};
    }, [allEditorProps, composition]);
    return (0, react_1.useMemo)(() => {
        var _a, _b, _c, _d;
        if (!composition) {
            return null;
        }
        if (currentCompositionMetadata) {
            return {
                type: 'success',
                result: {
                    ...currentCompositionMetadata,
                    id: composition.id,
                    props: currentCompositionMetadata.props,
                    defaultProps: (_a = composition.defaultProps) !== null && _a !== void 0 ? _a : {},
                    defaultCodec: currentCompositionMetadata.defaultCodec,
                },
            };
        }
        if (!(0, exports.needsResolution)(composition)) {
            (0, validate_duration_in_frames_js_1.validateDurationInFrames)(composition.durationInFrames, {
                allowFloats: false,
                component: `in <Composition id="${composition.id}">`,
            });
            (0, validate_fps_js_1.validateFps)(composition.fps, `in <Composition id="${composition.id}">`, false);
            (0, validate_dimensions_js_1.validateDimension)(composition.width, 'width', `in <Composition id="${composition.id}">`);
            (0, validate_dimensions_js_1.validateDimension)(composition.height, 'height', `in <Composition id="${composition.id}">`);
            return {
                type: 'success',
                result: {
                    width: composition.width,
                    height: composition.height,
                    fps: composition.fps,
                    id: composition.id,
                    durationInFrames: composition.durationInFrames,
                    defaultProps: (_b = composition.defaultProps) !== null && _b !== void 0 ? _b : {},
                    props: {
                        ...((_c = composition.defaultProps) !== null && _c !== void 0 ? _c : {}),
                        ...(selectedEditorProps !== null && selectedEditorProps !== void 0 ? selectedEditorProps : {}),
                        ...(typeof window === 'undefined' ||
                            (0, get_remotion_environment_js_1.getRemotionEnvironment)().isPlayer
                            ? {}
                            : (_d = (0, input_props_js_1.getInputProps)()) !== null && _d !== void 0 ? _d : {}),
                    },
                    defaultCodec: null,
                },
            };
        }
        if (!context[composition.id]) {
            return null;
        }
        return context[composition.id];
    }, [composition, context, currentCompositionMetadata, selectedEditorProps]);
};
exports.useResolvedVideoConfig = useResolvedVideoConfig;


/***/ }),

/***/ 97080:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Sequence = void 0;
const jsx_runtime_1 = __webpack_require__(85893);
/* eslint-disable @typescript-eslint/no-use-before-define */
const react_1 = __webpack_require__(67294);
const AbsoluteFill_js_1 = __webpack_require__(92640);
const SequenceContext_js_1 = __webpack_require__(73759);
const SequenceManager_js_1 = __webpack_require__(80829);
const get_remotion_environment_js_1 = __webpack_require__(48288);
const nonce_js_1 = __webpack_require__(98054);
const timeline_position_state_js_1 = __webpack_require__(47083);
const use_video_config_js_1 = __webpack_require__(73347);
const freeze_js_1 = __webpack_require__(47587);
const use_current_frame_1 = __webpack_require__(39727);
const RegularSequenceRefForwardingFunction = ({ from = 0, durationInFrames = Infinity, children, name, height, width, showInTimeline = true, _remotionInternalLoopDisplay: loopDisplay, _remotionInternalStack: stack, _remotionInternalPremountDisplay: premountDisplay, ...other }, ref) => {
    var _a;
    const { layout = 'absolute-fill' } = other;
    const [id] = (0, react_1.useState)(() => String(Math.random()));
    const parentSequence = (0, react_1.useContext)(SequenceContext_js_1.SequenceContext);
    const { rootId } = (0, react_1.useContext)(timeline_position_state_js_1.TimelineContext);
    const cumulatedFrom = parentSequence
        ? parentSequence.cumulatedFrom + parentSequence.relativeFrom
        : 0;
    const nonce = (0, nonce_js_1.useNonce)();
    if (layout !== 'absolute-fill' && layout !== 'none') {
        throw new TypeError(`The layout prop of <Sequence /> expects either "absolute-fill" or "none", but you passed: ${layout}`);
    }
    // @ts-expect-error
    if (layout === 'none' && typeof other.style !== 'undefined') {
        throw new TypeError('If layout="none", you may not pass a style.');
    }
    if (typeof durationInFrames !== 'number') {
        throw new TypeError(`You passed to durationInFrames an argument of type ${typeof durationInFrames}, but it must be a number.`);
    }
    if (durationInFrames <= 0) {
        throw new TypeError(`durationInFrames must be positive, but got ${durationInFrames}`);
    }
    if (typeof from !== 'number') {
        throw new TypeError(`You passed to the "from" props of your <Sequence> an argument of type ${typeof from}, but it must be a number.`);
    }
    if (!Number.isFinite(from)) {
        throw new TypeError(`The "from" prop of a sequence must be finite, but got ${from}.`);
    }
    const absoluteFrame = (0, timeline_position_state_js_1.useTimelinePosition)();
    const videoConfig = (0, use_video_config_js_1.useVideoConfig)();
    const parentSequenceDuration = parentSequence
        ? Math.min(parentSequence.durationInFrames - from, durationInFrames)
        : durationInFrames;
    const actualDurationInFrames = Math.max(0, Math.min(videoConfig.durationInFrames - from, parentSequenceDuration));
    const { registerSequence, unregisterSequence } = (0, react_1.useContext)(SequenceManager_js_1.SequenceManager);
    const { hidden } = (0, react_1.useContext)(SequenceManager_js_1.SequenceVisibilityToggleContext);
    const premounting = (0, react_1.useMemo)(() => {
        var _a;
        return ((_a = parentSequence === null || parentSequence === void 0 ? void 0 : parentSequence.premounting) !== null && _a !== void 0 ? _a : Boolean(other._remotionInternalIsPremounting));
    }, [other._remotionInternalIsPremounting, parentSequence === null || parentSequence === void 0 ? void 0 : parentSequence.premounting]);
    const contextValue = (0, react_1.useMemo)(() => {
        var _a, _b, _c;
        return {
            cumulatedFrom,
            relativeFrom: from,
            durationInFrames: actualDurationInFrames,
            parentFrom: (_a = parentSequence === null || parentSequence === void 0 ? void 0 : parentSequence.relativeFrom) !== null && _a !== void 0 ? _a : 0,
            id,
            height: (_b = height !== null && height !== void 0 ? height : parentSequence === null || parentSequence === void 0 ? void 0 : parentSequence.height) !== null && _b !== void 0 ? _b : null,
            width: (_c = width !== null && width !== void 0 ? width : parentSequence === null || parentSequence === void 0 ? void 0 : parentSequence.width) !== null && _c !== void 0 ? _c : null,
            premounting,
        };
    }, [
        cumulatedFrom,
        from,
        actualDurationInFrames,
        parentSequence,
        id,
        height,
        width,
        premounting,
    ]);
    const timelineClipName = (0, react_1.useMemo)(() => {
        return name !== null && name !== void 0 ? name : '';
    }, [name]);
    (0, react_1.useEffect)(() => {
        var _a;
        if (!(0, get_remotion_environment_js_1.getRemotionEnvironment)().isStudio) {
            return;
        }
        registerSequence({
            from,
            duration: actualDurationInFrames,
            id,
            displayName: timelineClipName,
            parent: (_a = parentSequence === null || parentSequence === void 0 ? void 0 : parentSequence.id) !== null && _a !== void 0 ? _a : null,
            type: 'sequence',
            rootId,
            showInTimeline,
            nonce,
            loopDisplay,
            stack: stack !== null && stack !== void 0 ? stack : null,
            premountDisplay: premountDisplay !== null && premountDisplay !== void 0 ? premountDisplay : null,
        });
        return () => {
            unregisterSequence(id);
        };
    }, [
        durationInFrames,
        id,
        name,
        registerSequence,
        timelineClipName,
        unregisterSequence,
        parentSequence === null || parentSequence === void 0 ? void 0 : parentSequence.id,
        actualDurationInFrames,
        rootId,
        from,
        showInTimeline,
        nonce,
        loopDisplay,
        stack,
        premountDisplay,
    ]);
    // Ceil to support floats
    // https://github.com/remotion-dev/remotion/issues/2958
    const endThreshold = Math.ceil(cumulatedFrom + from + durationInFrames - 1);
    const content = absoluteFrame < cumulatedFrom + from
        ? null
        : absoluteFrame > endThreshold
            ? null
            : children;
    const styleIfThere = other.layout === 'none' ? undefined : other.style;
    const defaultStyle = (0, react_1.useMemo)(() => {
        return {
            flexDirection: undefined,
            ...(width ? { width } : {}),
            ...(height ? { height } : {}),
            ...(styleIfThere !== null && styleIfThere !== void 0 ? styleIfThere : {}),
        };
    }, [height, styleIfThere, width]);
    if (ref !== null && layout === 'none') {
        throw new TypeError('It is not supported to pass both a `ref` and `layout="none"` to <Sequence />.');
    }
    const isSequenceHidden = (_a = hidden[id]) !== null && _a !== void 0 ? _a : false;
    if (isSequenceHidden) {
        return null;
    }
    return ((0, jsx_runtime_1.jsx)(SequenceContext_js_1.SequenceContext.Provider, { value: contextValue, children: content === null ? null : other.layout === 'none' ? (content) : ((0, jsx_runtime_1.jsx)(AbsoluteFill_js_1.AbsoluteFill, { ref: ref, style: defaultStyle, className: other.className, children: content })) }));
};
const RegularSequence = (0, react_1.forwardRef)(RegularSequenceRefForwardingFunction);
const PremountedSequenceRefForwardingFunction = (props, ref) => {
    const frame = (0, use_current_frame_1.useCurrentFrame)();
    if (props.layout === 'none') {
        throw new Error('`<Sequence>` with `premountFor` prop does not support layout="none"');
    }
    const { style: passedStyle, from = 0, premountFor = 0, name, ...otherProps } = props;
    const premountingActive = frame < from && frame >= from - premountFor;
    const style = (0, react_1.useMemo)(() => {
        var _a;
        return {
            ...passedStyle,
            opacity: premountingActive ? 0 : 1,
            pointerEvents: premountingActive
                ? 'none'
                : (_a = passedStyle === null || passedStyle === void 0 ? void 0 : passedStyle.pointerEvents) !== null && _a !== void 0 ? _a : undefined,
        };
    }, [premountingActive, passedStyle]);
    return ((0, jsx_runtime_1.jsx)(freeze_js_1.Freeze, { frame: from, active: premountingActive, children: (0, jsx_runtime_1.jsx)(exports.Sequence, { ref: ref, from: from, style: style, _remotionInternalPremountDisplay: premountFor, _remotionInternalIsPremounting: premountingActive, ...otherProps }) }));
};
const PremountedSequence = (0, react_1.forwardRef)(PremountedSequenceRefForwardingFunction);
const SequenceRefForwardingFunction = (props, ref) => {
    if (props.layout !== 'none' &&
        props.premountFor &&
        !(0, get_remotion_environment_js_1.getRemotionEnvironment)().isRendering) {
        return (0, jsx_runtime_1.jsx)(PremountedSequence, { ...props, ref: ref });
    }
    return (0, jsx_runtime_1.jsx)(RegularSequence, { ...props, ref: ref });
};
/**
 * @description A component that time-shifts its children and wraps them in an absolutely positioned <div>.
 * @see [Documentation](https://www.remotion.dev/docs/sequence)
 */
exports.Sequence = (0, react_1.forwardRef)(SequenceRefForwardingFunction);


/***/ }),

/***/ 73759:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SequenceContext = void 0;
const react_1 = __webpack_require__(67294);
exports.SequenceContext = (0, react_1.createContext)(null);


/***/ }),

/***/ 80829:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SequenceManagerProvider = exports.SequenceVisibilityToggleContext = exports.SequenceManager = void 0;
const jsx_runtime_1 = __webpack_require__(85893);
const react_1 = __importStar(__webpack_require__(67294));
exports.SequenceManager = react_1.default.createContext({
    registerSequence: () => {
        throw new Error('SequenceManagerContext not initialized');
    },
    unregisterSequence: () => {
        throw new Error('SequenceManagerContext not initialized');
    },
    sequences: [],
});
exports.SequenceVisibilityToggleContext = react_1.default.createContext({
    hidden: {},
    setHidden: () => {
        throw new Error('SequenceVisibilityToggle not initialized');
    },
});
const SequenceManagerProvider = ({ children }) => {
    const [sequences, setSequences] = (0, react_1.useState)([]);
    const [hidden, setHidden] = (0, react_1.useState)({});
    const registerSequence = (0, react_1.useCallback)((seq) => {
        setSequences((seqs) => {
            return [...seqs, seq];
        });
    }, []);
    const unregisterSequence = (0, react_1.useCallback)((seq) => {
        setSequences((seqs) => seqs.filter((s) => s.id !== seq));
    }, []);
    const sequenceContext = (0, react_1.useMemo)(() => {
        return {
            registerSequence,
            sequences,
            unregisterSequence,
        };
    }, [registerSequence, sequences, unregisterSequence]);
    const hiddenContext = (0, react_1.useMemo)(() => {
        return {
            hidden,
            setHidden,
        };
    }, [hidden]);
    return ((0, jsx_runtime_1.jsx)(exports.SequenceManager.Provider, { value: sequenceContext, children: (0, jsx_runtime_1.jsx)(exports.SequenceVisibilityToggleContext.Provider, { value: hiddenContext, children: children }) }));
};
exports.SequenceManagerProvider = SequenceManagerProvider;


/***/ }),

/***/ 18876:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Still = void 0;
const react_1 = __importDefault(__webpack_require__(67294));
const Composition_js_1 = __webpack_require__(63013);
/**
 * @description A `<Still />` is a `<Composition />` that is only 1 frame long.
 * @see [Documentation](https://www.remotion.dev/docs/still)
 */
const Still = (props) => {
    const newProps = {
        ...props,
        durationInFrames: 1,
        fps: 1,
    };
    // @ts-expect-error TypeScript does not understand it, but should still fail on type mismatch
    return react_1.default.createElement((Composition_js_1.Composition), newProps);
};
exports.Still = Still;


/***/ }),

/***/ 74710:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.getAbsoluteSrc = void 0;
const getAbsoluteSrc = (relativeSrc) => {
    if (typeof window === 'undefined') {
        return relativeSrc;
    }
    return new URL(relativeSrc, window.origin).href;
};
exports.getAbsoluteSrc = getAbsoluteSrc;


/***/ }),

/***/ 55449:
/***/ (() => {




/***/ }),

/***/ 24387:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Audio = void 0;
const jsx_runtime_1 = __webpack_require__(85893);
/* eslint-disable @typescript-eslint/no-use-before-define */
const react_1 = __webpack_require__(67294);
const Sequence_js_1 = __webpack_require__(97080);
const absolute_src_js_1 = __webpack_require__(74710);
const calculate_loop_js_1 = __webpack_require__(46822);
const cancel_render_js_1 = __webpack_require__(88113);
const enable_sequence_stack_traces_js_1 = __webpack_require__(12196);
const get_remotion_environment_js_1 = __webpack_require__(48288);
const index_js_1 = __webpack_require__(4432);
const prefetch_js_1 = __webpack_require__(32595);
const use_video_config_js_1 = __webpack_require__(73347);
const validate_media_props_js_1 = __webpack_require__(15480);
const validate_start_from_props_js_1 = __webpack_require__(444);
const duration_state_js_1 = __webpack_require__(19099);
const AudioForPreview_js_1 = __webpack_require__(69605);
const AudioForRendering_js_1 = __webpack_require__(98049);
const shared_audio_tags_js_1 = __webpack_require__(3161);
const AudioRefForwardingFunction = (props, ref) => {
    var _a, _b, _c;
    const audioContext = (0, react_1.useContext)(shared_audio_tags_js_1.SharedAudioContext);
    const { startFrom, endAt, name, stack, pauseWhenBuffering, showInTimeline, ...otherProps } = props;
    const { loop, ...propsOtherThanLoop } = props;
    const { fps } = (0, use_video_config_js_1.useVideoConfig)();
    const environment = (0, get_remotion_environment_js_1.getRemotionEnvironment)();
    const { durations, setDurations } = (0, react_1.useContext)(duration_state_js_1.DurationsContext);
    if (typeof props.src !== 'string') {
        throw new TypeError(`The \`<Audio>\` tag requires a string for \`src\`, but got ${JSON.stringify(props.src)} instead.`);
    }
    const preloadedSrc = (0, prefetch_js_1.usePreload)(props.src);
    const onError = (0, react_1.useCallback)((e) => {
        // eslint-disable-next-line no-console
        console.log(e.currentTarget.error);
        // If there is no `loop` property, we don't need to get the duration
        // and this does not need to be a fatal error
        const errMessage = `Could not play audio with src ${preloadedSrc}: ${e.currentTarget.error}. See https://remotion.dev/docs/media-playback-error for help.`;
        if (loop) {
            (0, cancel_render_js_1.cancelRender)(new Error(errMessage));
        }
        else {
            // eslint-disable-next-line no-console
            console.warn(errMessage);
        }
    }, [loop, preloadedSrc]);
    const onDuration = (0, react_1.useCallback)((src, durationInSeconds) => {
        setDurations({ type: 'got-duration', durationInSeconds, src });
    }, [setDurations]);
    const durationFetched = (_a = durations[(0, absolute_src_js_1.getAbsoluteSrc)(preloadedSrc)]) !== null && _a !== void 0 ? _a : durations[(0, absolute_src_js_1.getAbsoluteSrc)(props.src)];
    if (loop && durationFetched !== undefined) {
        const duration = durationFetched * fps;
        return ((0, jsx_runtime_1.jsx)(index_js_1.Loop, { layout: "none", durationInFrames: (0, calculate_loop_js_1.calculateLoopDuration)({
                endAt,
                mediaDuration: duration,
                playbackRate: (_b = props.playbackRate) !== null && _b !== void 0 ? _b : 1,
                startFrom,
            }), children: (0, jsx_runtime_1.jsx)(exports.Audio, { ...propsOtherThanLoop, ref: ref, _remotionInternalNativeLoopPassed: true }) }));
    }
    if (typeof startFrom !== 'undefined' || typeof endAt !== 'undefined') {
        (0, validate_start_from_props_js_1.validateStartFromProps)(startFrom, endAt);
        const startFromFrameNo = startFrom !== null && startFrom !== void 0 ? startFrom : 0;
        const endAtFrameNo = endAt !== null && endAt !== void 0 ? endAt : Infinity;
        return ((0, jsx_runtime_1.jsx)(Sequence_js_1.Sequence, { layout: "none", from: 0 - startFromFrameNo, showInTimeline: false, durationInFrames: endAtFrameNo, name: name, children: (0, jsx_runtime_1.jsx)(exports.Audio, { _remotionInternalNeedsDurationCalculation: Boolean(loop), pauseWhenBuffering: pauseWhenBuffering !== null && pauseWhenBuffering !== void 0 ? pauseWhenBuffering : false, ...otherProps, ref: ref }) }));
    }
    (0, validate_media_props_js_1.validateMediaProps)(props, 'Audio');
    if (environment.isRendering) {
        return ((0, jsx_runtime_1.jsx)(AudioForRendering_js_1.AudioForRendering, { onDuration: onDuration, ...props, ref: ref, onError: onError, _remotionInternalNeedsDurationCalculation: Boolean(loop) }));
    }
    return ((0, jsx_runtime_1.jsx)(AudioForPreview_js_1.AudioForPreview, { _remotionInternalNativeLoopPassed: (_c = props._remotionInternalNativeLoopPassed) !== null && _c !== void 0 ? _c : false, _remotionInternalStack: stack !== null && stack !== void 0 ? stack : null, shouldPreMountAudioTags: audioContext !== null && audioContext.numberOfAudioTags > 0, ...props, ref: ref, onError: onError, onDuration: onDuration, 
        // Proposal: Make this default to true in v5
        pauseWhenBuffering: pauseWhenBuffering !== null && pauseWhenBuffering !== void 0 ? pauseWhenBuffering : false, _remotionInternalNeedsDurationCalculation: Boolean(loop), showInTimeline: showInTimeline !== null && showInTimeline !== void 0 ? showInTimeline : true }));
};
/**
 * @description With this component, you can add audio to your video. All audio formats which are supported by Chromium are supported by the component.
 * @see [Documentation](https://www.remotion.dev/docs/audio)
 */
exports.Audio = (0, react_1.forwardRef)(AudioRefForwardingFunction);
(0, enable_sequence_stack_traces_js_1.addSequenceStackTraces)(exports.Audio);


/***/ }),

/***/ 69605:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AudioForPreview = void 0;
const jsx_runtime_1 = __webpack_require__(85893);
const react_1 = __webpack_require__(67294);
const SequenceContext_js_1 = __webpack_require__(73759);
const SequenceManager_js_1 = __webpack_require__(80829);
const prefetch_js_1 = __webpack_require__(32595);
const random_js_1 = __webpack_require__(34264);
const use_media_buffering_js_1 = __webpack_require__(16801);
const use_media_in_timeline_js_1 = __webpack_require__(17476);
const use_media_playback_js_1 = __webpack_require__(95069);
const use_media_tag_volume_js_1 = __webpack_require__(7126);
const use_sync_volume_with_media_tag_js_1 = __webpack_require__(38875);
const volume_position_state_js_1 = __webpack_require__(51399);
const shared_audio_tags_js_1 = __webpack_require__(3161);
const use_audio_frame_js_1 = __webpack_require__(66873);
const AudioForDevelopmentForwardRefFunction = (props, ref) => {
    var _a;
    const [initialShouldPreMountAudioElements] = (0, react_1.useState)(props.shouldPreMountAudioTags);
    if (props.shouldPreMountAudioTags !== initialShouldPreMountAudioElements) {
        throw new Error('Cannot change the behavior for pre-mounting audio tags dynamically.');
    }
    const [mediaVolume] = (0, volume_position_state_js_1.useMediaVolumeState)();
    const [mediaMuted] = (0, volume_position_state_js_1.useMediaMutedState)();
    const volumePropFrame = (0, use_audio_frame_js_1.useFrameForVolumeProp)();
    const { volume, muted, playbackRate, shouldPreMountAudioTags, src, onDuration, acceptableTimeShiftInSeconds, _remotionInternalNeedsDurationCalculation, _remotionInternalNativeLoopPassed, _remotionInternalStack, allowAmplificationDuringRender, name, pauseWhenBuffering, showInTimeline, ...nativeProps } = props;
    const { hidden } = (0, react_1.useContext)(SequenceManager_js_1.SequenceVisibilityToggleContext);
    if (!src) {
        throw new TypeError("No 'src' was passed to <Audio>.");
    }
    const preloadedSrc = (0, prefetch_js_1.usePreload)(src);
    const sequenceContext = (0, react_1.useContext)(SequenceContext_js_1.SequenceContext);
    const [timelineId] = (0, react_1.useState)(() => String(Math.random()));
    const isSequenceHidden = (_a = hidden[timelineId]) !== null && _a !== void 0 ? _a : false;
    const propsToPass = (0, react_1.useMemo)(() => {
        return {
            muted: muted || mediaMuted || isSequenceHidden,
            src: preloadedSrc,
            loop: _remotionInternalNativeLoopPassed,
            ...nativeProps,
        };
    }, [
        _remotionInternalNativeLoopPassed,
        isSequenceHidden,
        mediaMuted,
        muted,
        nativeProps,
        preloadedSrc,
    ]);
    // Generate a string that's as unique as possible for this asset
    // but at the same time deterministic. We use it to combat strict mode issues.
    const id = (0, react_1.useMemo)(() => `audio-${(0, random_js_1.random)(src !== null && src !== void 0 ? src : '')}-${sequenceContext === null || sequenceContext === void 0 ? void 0 : sequenceContext.relativeFrom}-${sequenceContext === null || sequenceContext === void 0 ? void 0 : sequenceContext.cumulatedFrom}-${sequenceContext === null || sequenceContext === void 0 ? void 0 : sequenceContext.durationInFrames}-muted:${props.muted}-loop:${props.loop}`, [
        src,
        sequenceContext === null || sequenceContext === void 0 ? void 0 : sequenceContext.relativeFrom,
        sequenceContext === null || sequenceContext === void 0 ? void 0 : sequenceContext.cumulatedFrom,
        sequenceContext === null || sequenceContext === void 0 ? void 0 : sequenceContext.durationInFrames,
        props.muted,
        props.loop,
    ]);
    const audioRef = (0, shared_audio_tags_js_1.useSharedAudio)(propsToPass, id).el;
    const actualVolume = (0, use_media_tag_volume_js_1.useMediaTagVolume)(audioRef);
    (0, use_sync_volume_with_media_tag_js_1.useSyncVolumeWithMediaTag)({
        volumePropFrame,
        actualVolume,
        volume,
        mediaVolume,
        mediaRef: audioRef,
    });
    (0, use_media_in_timeline_js_1.useMediaInTimeline)({
        volume,
        mediaVolume,
        mediaRef: audioRef,
        src,
        mediaType: 'audio',
        playbackRate: playbackRate !== null && playbackRate !== void 0 ? playbackRate : 1,
        displayName: name !== null && name !== void 0 ? name : null,
        id: timelineId,
        stack: _remotionInternalStack,
        showInTimeline,
        premountDisplay: null,
    });
    (0, use_media_playback_js_1.useMediaPlayback)({
        mediaRef: audioRef,
        src,
        mediaType: 'audio',
        playbackRate: playbackRate !== null && playbackRate !== void 0 ? playbackRate : 1,
        onlyWarnForMediaSeekingError: false,
        acceptableTimeshift: acceptableTimeShiftInSeconds !== null && acceptableTimeShiftInSeconds !== void 0 ? acceptableTimeShiftInSeconds : use_media_playback_js_1.DEFAULT_ACCEPTABLE_TIMESHIFT,
    });
    (0, use_media_buffering_js_1.useMediaBuffering)({
        element: audioRef,
        shouldBuffer: pauseWhenBuffering,
        isPremounting: Boolean(sequenceContext === null || sequenceContext === void 0 ? void 0 : sequenceContext.premounting),
    });
    (0, react_1.useImperativeHandle)(ref, () => {
        return audioRef.current;
    }, [audioRef]);
    const currentOnDurationCallback = (0, react_1.useRef)();
    currentOnDurationCallback.current = onDuration;
    (0, react_1.useEffect)(() => {
        var _a;
        const { current } = audioRef;
        if (!current) {
            return;
        }
        if (current.duration) {
            (_a = currentOnDurationCallback.current) === null || _a === void 0 ? void 0 : _a.call(currentOnDurationCallback, current.src, current.duration);
            return;
        }
        const onLoadedMetadata = () => {
            var _a;
            (_a = currentOnDurationCallback.current) === null || _a === void 0 ? void 0 : _a.call(currentOnDurationCallback, current.src, current.duration);
        };
        current.addEventListener('loadedmetadata', onLoadedMetadata);
        return () => {
            current.removeEventListener('loadedmetadata', onLoadedMetadata);
        };
    }, [audioRef, src]);
    if (initialShouldPreMountAudioElements) {
        return null;
    }
    return (0, jsx_runtime_1.jsx)("audio", { ref: audioRef, preload: "metadata", ...propsToPass });
};
exports.AudioForPreview = (0, react_1.forwardRef)(AudioForDevelopmentForwardRefFunction);


/***/ }),

/***/ 98049:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AudioForRendering = void 0;
const jsx_runtime_1 = __webpack_require__(85893);
const react_1 = __webpack_require__(67294);
const RenderAssetManager_js_1 = __webpack_require__(26770);
const SequenceContext_js_1 = __webpack_require__(73759);
const absolute_src_js_1 = __webpack_require__(74710);
const delay_render_js_1 = __webpack_require__(22663);
const random_js_1 = __webpack_require__(34264);
const timeline_position_state_js_1 = __webpack_require__(47083);
const use_current_frame_js_1 = __webpack_require__(39727);
const volume_prop_js_1 = __webpack_require__(39022);
const use_audio_frame_js_1 = __webpack_require__(66873);
const AudioForRenderingRefForwardingFunction = (props, ref) => {
    const audioRef = (0, react_1.useRef)(null);
    const absoluteFrame = (0, timeline_position_state_js_1.useTimelinePosition)();
    const volumePropFrame = (0, use_audio_frame_js_1.useFrameForVolumeProp)();
    const frame = (0, use_current_frame_js_1.useCurrentFrame)();
    const sequenceContext = (0, react_1.useContext)(SequenceContext_js_1.SequenceContext);
    const { registerRenderAsset, unregisterRenderAsset } = (0, react_1.useContext)(RenderAssetManager_js_1.RenderAssetManager);
    // Generate a string that's as unique as possible for this asset
    // but at the same time the same on all threads
    const id = (0, react_1.useMemo)(() => {
        var _a;
        return `audio-${(0, random_js_1.random)((_a = props.src) !== null && _a !== void 0 ? _a : '')}-${sequenceContext === null || sequenceContext === void 0 ? void 0 : sequenceContext.relativeFrom}-${sequenceContext === null || sequenceContext === void 0 ? void 0 : sequenceContext.cumulatedFrom}-${sequenceContext === null || sequenceContext === void 0 ? void 0 : sequenceContext.durationInFrames}`;
    }, [
        props.src,
        sequenceContext === null || sequenceContext === void 0 ? void 0 : sequenceContext.relativeFrom,
        sequenceContext === null || sequenceContext === void 0 ? void 0 : sequenceContext.cumulatedFrom,
        sequenceContext === null || sequenceContext === void 0 ? void 0 : sequenceContext.durationInFrames,
    ]);
    const { volume: volumeProp, playbackRate, allowAmplificationDuringRender, onDuration, toneFrequency, _remotionInternalNeedsDurationCalculation, _remotionInternalNativeLoopPassed, acceptableTimeShiftInSeconds, name, onError, delayRenderRetries, delayRenderTimeoutInMilliseconds, ...nativeProps } = props;
    const volume = (0, volume_prop_js_1.evaluateVolume)({
        volume: volumeProp,
        frame: volumePropFrame,
        mediaVolume: 1,
        allowAmplificationDuringRender: allowAmplificationDuringRender !== null && allowAmplificationDuringRender !== void 0 ? allowAmplificationDuringRender : false,
    });
    (0, react_1.useImperativeHandle)(ref, () => {
        return audioRef.current;
    }, []);
    (0, react_1.useEffect)(() => {
        var _a, _b;
        if (!props.src) {
            throw new Error('No src passed');
        }
        if (!window.remotion_audioEnabled) {
            return;
        }
        if (props.muted) {
            return;
        }
        if (volume <= 0) {
            return;
        }
        registerRenderAsset({
            type: 'audio',
            src: (0, absolute_src_js_1.getAbsoluteSrc)(props.src),
            id,
            frame: absoluteFrame,
            volume,
            mediaFrame: frame,
            playbackRate: (_a = props.playbackRate) !== null && _a !== void 0 ? _a : 1,
            allowAmplificationDuringRender: allowAmplificationDuringRender !== null && allowAmplificationDuringRender !== void 0 ? allowAmplificationDuringRender : false,
            toneFrequency: toneFrequency !== null && toneFrequency !== void 0 ? toneFrequency : null,
            audioStartFrame: -((_b = sequenceContext === null || sequenceContext === void 0 ? void 0 : sequenceContext.relativeFrom) !== null && _b !== void 0 ? _b : 0),
        });
        return () => unregisterRenderAsset(id);
    }, [
        props.muted,
        props.src,
        registerRenderAsset,
        absoluteFrame,
        id,
        unregisterRenderAsset,
        volume,
        volumePropFrame,
        frame,
        playbackRate,
        props.playbackRate,
        allowAmplificationDuringRender,
        toneFrequency,
        sequenceContext === null || sequenceContext === void 0 ? void 0 : sequenceContext.relativeFrom,
    ]);
    const { src } = props;
    // The <audio> tag is only rendered if the duration needs to be calculated for the `loop`
    // attribute to work, or if the user assigns a ref to it.
    const needsToRenderAudioTag = ref || _remotionInternalNeedsDurationCalculation;
    // If audio source switches, make new handle
    (0, react_1.useLayoutEffect)(() => {
        if (false) {}
        if (!needsToRenderAudioTag) {
            return;
        }
        const newHandle = (0, delay_render_js_1.delayRender)('Loading <Audio> duration with src=' + src, {
            retries: delayRenderRetries !== null && delayRenderRetries !== void 0 ? delayRenderRetries : undefined,
            timeoutInMilliseconds: delayRenderTimeoutInMilliseconds !== null && delayRenderTimeoutInMilliseconds !== void 0 ? delayRenderTimeoutInMilliseconds : undefined,
        });
        const { current } = audioRef;
        const didLoad = () => {
            if (current === null || current === void 0 ? void 0 : current.duration) {
                onDuration(current.src, current.duration);
            }
            (0, delay_render_js_1.continueRender)(newHandle);
        };
        if (current === null || current === void 0 ? void 0 : current.duration) {
            onDuration(current.src, current.duration);
            (0, delay_render_js_1.continueRender)(newHandle);
        }
        else {
            current === null || current === void 0 ? void 0 : current.addEventListener('loadedmetadata', didLoad, { once: true });
        }
        // If tag gets unmounted, clear pending handles because video metadata is not going to load
        return () => {
            current === null || current === void 0 ? void 0 : current.removeEventListener('loadedmetadata', didLoad);
            (0, delay_render_js_1.continueRender)(newHandle);
        };
    }, [
        src,
        onDuration,
        needsToRenderAudioTag,
        delayRenderRetries,
        delayRenderTimeoutInMilliseconds,
    ]);
    if (!needsToRenderAudioTag) {
        return null;
    }
    return (0, jsx_runtime_1.jsx)("audio", { ref: audioRef, ...nativeProps });
};
exports.AudioForRendering = (0, react_1.forwardRef)(AudioForRenderingRefForwardingFunction);


/***/ }),

/***/ 24533:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
__exportStar(__webpack_require__(24387), exports);
__exportStar(__webpack_require__(98796), exports);


/***/ }),

/***/ 98796:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));


/***/ }),

/***/ 3161:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.useSharedAudio = exports.SharedAudioContextProvider = exports.SharedAudioContext = void 0;
const jsx_runtime_1 = __webpack_require__(85893);
const react_1 = __importStar(__webpack_require__(67294));
const play_and_handle_not_allowed_error_js_1 = __webpack_require__(15091);
const EMPTY_AUDIO = 'data:audio/mp3;base64,/+MYxAAJcAV8AAgAABn//////+/gQ5BAMA+D4Pg+BAQBAEAwD4Pg+D4EBAEAQDAPg++hYBH///hUFQVBUFREDQNHmf///////+MYxBUGkAGIMAAAAP/29Xt6lUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV/+MYxDUAAANIAAAAAFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV';
const compareProps = (obj1, obj2) => {
    const keysA = Object.keys(obj1).sort();
    const keysB = Object.keys(obj2).sort();
    if (keysA.length !== keysB.length) {
        return false;
    }
    for (let i = 0; i < keysA.length; i++) {
        // Not the same keys
        if (keysA[i] !== keysB[i]) {
            return false;
        }
        // Not the same values
        if (obj1[keysA[i]] !== obj2[keysB[i]]) {
            return false;
        }
    }
    return true;
};
const didPropChange = (key, newProp, prevProp) => {
    // /music.mp3 and http://localhost:3000/music.mp3 are the same
    if (key === 'src' &&
        !prevProp.startsWith('data:') &&
        !newProp.startsWith('data:')) {
        return (new URL(prevProp, window.origin).toString() !==
            new URL(newProp, window.origin).toString());
    }
    if (prevProp === newProp) {
        return false;
    }
    return true;
};
exports.SharedAudioContext = (0, react_1.createContext)(null);
const SharedAudioContextProvider = ({ children, numberOfAudioTags, component }) => {
    const audios = (0, react_1.useRef)([]);
    const [initialNumberOfAudioTags] = (0, react_1.useState)(numberOfAudioTags);
    if (numberOfAudioTags !== initialNumberOfAudioTags) {
        throw new Error('The number of shared audio tags has changed dynamically. Once you have set this property, you cannot change it afterwards.');
    }
    const refs = (0, react_1.useMemo)(() => {
        return new Array(numberOfAudioTags).fill(true).map(() => {
            return { id: Math.random(), ref: (0, react_1.createRef)() };
        });
    }, [numberOfAudioTags]);
    const takenAudios = (0, react_1.useRef)(new Array(numberOfAudioTags).fill(false));
    const rerenderAudios = (0, react_1.useCallback)(() => {
        refs.forEach(({ ref, id }) => {
            var _a;
            const data = (_a = audios.current) === null || _a === void 0 ? void 0 : _a.find((a) => a.id === id);
            const { current } = ref;
            if (!current) {
                // Whole player has been unmounted, the refs don't exist anymore.
                // It is not an error anymore though
                return;
            }
            if (data === undefined) {
                current.src = EMPTY_AUDIO;
                return;
            }
            if (!data) {
                throw new TypeError('Expected audio data to be there');
            }
            Object.keys(data.props).forEach((key) => {
                // @ts-expect-error
                if (didPropChange(key, data.props[key], current[key])) {
                    // @ts-expect-error
                    current[key] = data.props[key];
                }
            });
        });
    }, [refs]);
    const registerAudio = (0, react_1.useCallback)((aud, audioId) => {
        var _a, _b;
        const found = (_a = audios.current) === null || _a === void 0 ? void 0 : _a.find((a) => a.audioId === audioId);
        if (found) {
            return found;
        }
        const firstFreeAudio = takenAudios.current.findIndex((a) => a === false);
        if (firstFreeAudio === -1) {
            throw new Error(`Tried to simultaneously mount ${numberOfAudioTags + 1} <Audio /> tags at the same time. With the current settings, the maximum amount of <Audio /> tags is limited to ${numberOfAudioTags} at the same time. Remotion pre-mounts silent audio tags to help avoid browser autoplay restrictions. See https://remotion.dev/docs/player/autoplay#use-the-numberofsharedaudiotags-property for more information on how to increase this limit.`);
        }
        const { id, ref } = refs[firstFreeAudio];
        const cloned = [...takenAudios.current];
        cloned[firstFreeAudio] = id;
        takenAudios.current = cloned;
        const newElem = {
            props: aud,
            id,
            el: ref,
            audioId,
        };
        (_b = audios.current) === null || _b === void 0 ? void 0 : _b.push(newElem);
        rerenderAudios();
        return newElem;
    }, [numberOfAudioTags, refs, rerenderAudios]);
    const unregisterAudio = (0, react_1.useCallback)((id) => {
        var _a;
        const cloned = [...takenAudios.current];
        const index = refs.findIndex((r) => r.id === id);
        if (index === -1) {
            throw new TypeError('Error occured in ');
        }
        cloned[index] = false;
        takenAudios.current = cloned;
        audios.current = (_a = audios.current) === null || _a === void 0 ? void 0 : _a.filter((a) => a.id !== id);
        rerenderAudios();
    }, [refs, rerenderAudios]);
    const updateAudio = (0, react_1.useCallback)(({ aud, audioId, id, }) => {
        var _a;
        let changed = false;
        audios.current = (_a = audios.current) === null || _a === void 0 ? void 0 : _a.map((prevA) => {
            if (prevA.id === id) {
                const isTheSame = compareProps(aud, prevA.props);
                if (isTheSame) {
                    return prevA;
                }
                changed = true;
                return {
                    ...prevA,
                    props: aud,
                    audioId,
                };
            }
            return prevA;
        });
        if (changed) {
            rerenderAudios();
        }
    }, [rerenderAudios]);
    const playAllAudios = (0, react_1.useCallback)(() => {
        refs.forEach((ref) => {
            (0, play_and_handle_not_allowed_error_js_1.playAndHandleNotAllowedError)(ref.ref, 'audio');
        });
    }, [refs]);
    const value = (0, react_1.useMemo)(() => {
        return {
            registerAudio,
            unregisterAudio,
            updateAudio,
            playAllAudios,
            numberOfAudioTags,
        };
    }, [
        numberOfAudioTags,
        playAllAudios,
        registerAudio,
        unregisterAudio,
        updateAudio,
    ]);
    // Fixing a bug: In React, if a component is unmounted using useInsertionEffect, then
    // the cleanup function does sometimes not work properly. That is why when we
    // are changing the composition, we reset the audio state.
    // TODO: Possibly this does not save the problem completely, since the
    // if an audio tag that is inside a sequence will also not be removed
    // from the shared audios.
    const resetAudio = (0, react_1.useCallback)(() => {
        takenAudios.current = new Array(numberOfAudioTags).fill(false);
        audios.current = [];
        rerenderAudios();
    }, [numberOfAudioTags, rerenderAudios]);
    (0, react_1.useEffect)(() => {
        return () => {
            resetAudio();
        };
    }, [component, resetAudio]);
    return ((0, jsx_runtime_1.jsxs)(exports.SharedAudioContext.Provider, { value: value, children: [refs.map(({ id, ref }) => {
                return (
                // Without preload="metadata", iOS will seek the time internally
                // but not actually with sound. Adding `preload="metadata"` helps here.
                // https://discord.com/channels/809501355504959528/817306414069710848/1130519583367888906
                (0, jsx_runtime_1.jsx)("audio", { ref: ref, preload: "metadata", src: EMPTY_AUDIO }, id));
            }), children] }));
};
exports.SharedAudioContextProvider = SharedAudioContextProvider;
const useSharedAudio = (aud, audioId) => {
    var _a;
    const ctx = (0, react_1.useContext)(exports.SharedAudioContext);
    /**
     * We work around this in React 18 so an audio tag will only register itself once
     */
    const [elem] = (0, react_1.useState)(() => {
        if (ctx && ctx.numberOfAudioTags > 0) {
            return ctx.registerAudio(aud, audioId);
        }
        return {
            el: react_1.default.createRef(),
            id: Math.random(),
            props: aud,
            audioId,
        };
    });
    /**
     * Effects in React 18 fire twice, and we are looking for a way to only fire it once.
     * - useInsertionEffect only fires once. If it's available we are in React 18.
     * - useLayoutEffect only fires once in React 17.
     *
     * Need to import it from React to fix React 17 ESM support.
     */
    const effectToUse = (_a = react_1.default.useInsertionEffect) !== null && _a !== void 0 ? _a : react_1.default.useLayoutEffect;
    if (typeof document !== 'undefined') {
        effectToUse(() => {
            if (ctx && ctx.numberOfAudioTags > 0) {
                ctx.updateAudio({ id: elem.id, aud, audioId });
            }
        }, [aud, ctx, elem.id, audioId]);
        effectToUse(() => {
            return () => {
                if (ctx && ctx.numberOfAudioTags > 0) {
                    ctx.unregisterAudio(elem.id);
                }
            };
        }, [ctx, elem.id]);
    }
    return elem;
};
exports.useSharedAudio = useSharedAudio;


/***/ }),

/***/ 66873:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.useFrameForVolumeProp = exports.useMediaStartsAt = void 0;
const react_1 = __webpack_require__(67294);
const SequenceContext_js_1 = __webpack_require__(73759);
const use_current_frame_js_1 = __webpack_require__(39727);
const useMediaStartsAt = () => {
    var _a;
    const parentSequence = (0, react_1.useContext)(SequenceContext_js_1.SequenceContext);
    const startsAt = Math.min(0, (_a = parentSequence === null || parentSequence === void 0 ? void 0 : parentSequence.relativeFrom) !== null && _a !== void 0 ? _a : 0);
    return startsAt;
};
exports.useMediaStartsAt = useMediaStartsAt;
/**
 * When passing a function as the prop for `volume`,
 * we calculate the way more intuitive value for currentFrame
 */
const useFrameForVolumeProp = () => {
    const frame = (0, use_current_frame_js_1.useCurrentFrame)();
    const startsAt = (0, exports.useMediaStartsAt)();
    return frame + startsAt;
};
exports.useFrameForVolumeProp = useFrameForVolumeProp;


/***/ }),

/***/ 32219:
/***/ ((__unused_webpack_module, exports) => {


// Taken from https://github.com/facebook/react-native/blob/0b9ea60b4fee8cacc36e7160e31b91fc114dbc0d/Libraries/Animated/src/bezier.js
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.bezier = void 0;
const NEWTON_ITERATIONS = 4;
const NEWTON_MIN_SLOPE = 0.001;
const SUBDIVISION_PRECISION = 0.0000001;
const SUBDIVISION_MAX_ITERATIONS = 10;
const kSplineTableSize = 11;
const kSampleStepSize = 1.0 / (kSplineTableSize - 1.0);
const float32ArraySupported = typeof Float32Array === 'function';
function a(aA1, aA2) {
    return 1.0 - 3.0 * aA2 + 3.0 * aA1;
}
function b(aA1, aA2) {
    return 3.0 * aA2 - 6.0 * aA1;
}
function c(aA1) {
    return 3.0 * aA1;
}
// Returns x(t) given t, x1, and x2, or y(t) given t, y1, and y2.
function calcBezier(aT, aA1, aA2) {
    return ((a(aA1, aA2) * aT + b(aA1, aA2)) * aT + c(aA1)) * aT;
}
// Returns dx/dt given t, x1, and x2, or dy/dt given t, y1, and y2.
function getSlope(aT, aA1, aA2) {
    return 3.0 * a(aA1, aA2) * aT * aT + 2.0 * b(aA1, aA2) * aT + c(aA1);
}
function binarySubdivide({ aX, _aA, _aB, mX1, mX2, }) {
    let currentX;
    let currentT;
    let i = 0;
    let aA = _aA;
    let aB = _aB;
    do {
        currentT = aA + (aB - aA) / 2.0;
        currentX = calcBezier(currentT, mX1, mX2) - aX;
        if (currentX > 0.0) {
            aB = currentT;
        }
        else {
            aA = currentT;
        }
    } while (Math.abs(currentX) > SUBDIVISION_PRECISION &&
        ++i < SUBDIVISION_MAX_ITERATIONS);
    return currentT;
}
function newtonRaphsonIterate(aX, _aGuessT, mX1, mX2) {
    let aGuessT = _aGuessT;
    for (let i = 0; i < NEWTON_ITERATIONS; ++i) {
        const currentSlope = getSlope(aGuessT, mX1, mX2);
        if (currentSlope === 0.0) {
            return aGuessT;
        }
        const currentX = calcBezier(aGuessT, mX1, mX2) - aX;
        aGuessT -= currentX / currentSlope;
    }
    return aGuessT;
}
function bezier(mX1, mY1, mX2, mY2) {
    if (!(mX1 >= 0 && mX1 <= 1 && mX2 >= 0 && mX2 <= 1)) {
        throw new Error('bezier x values must be in [0, 1] range');
    }
    // Precompute samples table
    const sampleValues = float32ArraySupported
        ? new Float32Array(kSplineTableSize)
        : new Array(kSplineTableSize);
    if (mX1 !== mY1 || mX2 !== mY2) {
        for (let i = 0; i < kSplineTableSize; ++i) {
            sampleValues[i] = calcBezier(i * kSampleStepSize, mX1, mX2);
        }
    }
    function getTForX(aX) {
        let intervalStart = 0.0;
        let currentSample = 1;
        const lastSample = kSplineTableSize - 1;
        for (; currentSample !== lastSample && sampleValues[currentSample] <= aX; ++currentSample) {
            intervalStart += kSampleStepSize;
        }
        --currentSample;
        // Interpolate to provide an initial guess for t
        const dist = (aX - sampleValues[currentSample]) /
            (sampleValues[currentSample + 1] - sampleValues[currentSample]);
        const guessForT = intervalStart + dist * kSampleStepSize;
        const initialSlope = getSlope(guessForT, mX1, mX2);
        if (initialSlope >= NEWTON_MIN_SLOPE) {
            return newtonRaphsonIterate(aX, guessForT, mX1, mX2);
        }
        if (initialSlope === 0.0) {
            return guessForT;
        }
        return binarySubdivide({
            aX,
            _aA: intervalStart,
            _aB: intervalStart + kSampleStepSize,
            mX1,
            mX2,
        });
    }
    return function (x) {
        if (mX1 === mY1 && mX2 === mY2) {
            return x; // linear
        }
        // Because JavaScript number are imprecise, we should guarantee the extremes are right.
        if (x === 0) {
            return 0;
        }
        if (x === 1) {
            return 1;
        }
        return calcBezier(getTForX(x), mY1, mY2);
    };
}
exports.bezier = bezier;


/***/ }),

/***/ 45775:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.BufferingProvider = exports.BufferingContextReact = void 0;
const jsx_runtime_1 = __webpack_require__(85893);
const react_1 = __importStar(__webpack_require__(67294));
const useBufferManager = () => {
    const [blocks, setBlocks] = (0, react_1.useState)([]);
    const [onBufferingCallbacks, setOnBufferingCallbacks] = (0, react_1.useState)([]);
    const [onResumeCallbacks, setOnResumeCallbacks] = (0, react_1.useState)([]);
    const buffering = (0, react_1.useRef)(false);
    const addBlock = (0, react_1.useCallback)((block) => {
        setBlocks((b) => [...b, block]);
        return {
            unblock: () => {
                setBlocks((b) => b.filter((bx) => bx !== block));
            },
        };
    }, []);
    const listenForBuffering = (0, react_1.useCallback)((callback) => {
        setOnBufferingCallbacks((c) => [...c, callback]);
        return {
            remove: () => {
                setOnBufferingCallbacks((c) => c.filter((cb) => cb !== callback));
            },
        };
    }, []);
    const listenForResume = (0, react_1.useCallback)((callback) => {
        setOnResumeCallbacks((c) => [...c, callback]);
        return {
            remove: () => {
                setOnResumeCallbacks((c) => c.filter((cb) => cb !== callback));
            },
        };
    }, []);
    (0, react_1.useEffect)(() => {
        if (blocks.length > 0) {
            onBufferingCallbacks.forEach((c) => c());
        }
        else {
            onResumeCallbacks.forEach((c) => c());
        }
    }, [blocks, onBufferingCallbacks, onResumeCallbacks]);
    return (0, react_1.useMemo)(() => {
        return { addBlock, listenForBuffering, listenForResume, buffering };
    }, [addBlock, buffering, listenForBuffering, listenForResume]);
};
exports.BufferingContextReact = react_1.default.createContext(null);
const BufferingProvider = ({ children }) => {
    const bufferManager = useBufferManager();
    return ((0, jsx_runtime_1.jsx)(exports.BufferingContextReact.Provider, { value: bufferManager, children: children }));
};
exports.BufferingProvider = BufferingProvider;


/***/ }),

/***/ 46822:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.calculateLoopDuration = void 0;
const calculateLoopDuration = ({ endAt, mediaDuration, playbackRate, startFrom, }) => {
    let duration = mediaDuration;
    // Account for endAt
    if (typeof endAt !== 'undefined') {
        duration = endAt;
    }
    // Account for startFrom
    if (typeof startFrom !== 'undefined') {
        duration -= startFrom;
    }
    const actualDuration = duration / playbackRate;
    return Math.floor(actualDuration);
};
exports.calculateLoopDuration = calculateLoopDuration;


/***/ }),

/***/ 88113:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.cancelRender = void 0;
const isErrorLike = (err) => {
    if (err === null) {
        return false;
    }
    if (typeof err !== 'object') {
        return false;
    }
    if (!('stack' in err)) {
        return false;
    }
    // eslint-disable-next-line @typescript-eslint/prefer-ts-expect-error
    // @ts-ignore we just asserted
    if (typeof err.stack !== 'string') {
        return false;
    }
    if (!('message' in err)) {
        return false;
    }
    // eslint-disable-next-line @typescript-eslint/prefer-ts-expect-error
    // @ts-ignore we just asserted
    if (typeof err.message !== 'string') {
        return false;
    }
    return true;
};
/**
 * @description When you invoke this function, Remotion will stop rendering all the frames without any retries
 * @see [Documentation](https://www.remotion.dev/docs/cancel-render)
 */
function cancelRender(err) {
    let error;
    if (isErrorLike(err)) {
        error = err;
    }
    else if (typeof err === 'string') {
        error = Error(err);
    }
    else {
        error = Error('Rendering was cancelled');
    }
    window.remotion_cancelledError = error.stack;
    throw error;
}
exports.cancelRender = cancelRender;


/***/ }),

/***/ 30851:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DEFAULT_CODEC = exports.validCodecs = void 0;
exports.validCodecs = [
    'h264',
    'h265',
    'vp8',
    'vp9',
    'mp3',
    'aac',
    'wav',
    'prores',
    'h264-mkv',
    'h264-ts',
    'gif',
];
exports.DEFAULT_CODEC = 'h264';


/***/ }),

/***/ 35287:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.getInputProps = void 0;
const get_remotion_environment_js_1 = __webpack_require__(48288);
const input_props_serialization_js_1 = __webpack_require__(89203);
let didWarnSSRImport = false;
const warnOnceSSRImport = () => {
    if (didWarnSSRImport) {
        return;
    }
    didWarnSSRImport = true;
    // eslint-disable-next-line no-console
    console.warn('Called `getInputProps()` on the server. This function is not available server-side and has returned an empty object.');
    // eslint-disable-next-line no-console
    console.warn("To hide this warning, don't call this function on the server:");
    // eslint-disable-next-line no-console
    console.warn("  typeof window === 'undefined' ? {} : getInputProps()");
};
const getInputProps = () => {
    if (typeof window === 'undefined') {
        warnOnceSSRImport();
        return {};
    }
    if ((0, get_remotion_environment_js_1.getRemotionEnvironment)().isPlayer) {
        throw new Error('You cannot call `getInputProps()` from a <Player>. Instead, the props are available as React props from component that you passed as `component` prop.');
    }
    const param = window.remotion_inputProps;
    if (!param) {
        return {};
    }
    const parsed = (0, input_props_serialization_js_1.deserializeJSONWithCustomFields)(param);
    return parsed;
};
exports.getInputProps = getInputProps;


/***/ }),

/***/ 57524:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.makeDefaultCSS = exports.OFFTHREAD_VIDEO_CLASS_NAME = exports.injectCSS = void 0;
const injected = {};
const injectCSS = (css) => {
    // Skip in node
    if (typeof document === 'undefined') {
        return;
    }
    if (injected[css]) {
        return;
    }
    const head = document.head || document.getElementsByTagName('head')[0];
    const style = document.createElement('style');
    style.appendChild(document.createTextNode(css));
    head.prepend(style);
    injected[css] = true;
};
exports.injectCSS = injectCSS;
exports.OFFTHREAD_VIDEO_CLASS_NAME = '__remotion_offthreadvideo';
const makeDefaultCSS = (scope, backgroundColor) => {
    if (!scope) {
        return `
    * {
      box-sizing: border-box;
    }
    body {
      margin: 0;
	    background-color: ${backgroundColor};
    }
    .${exports.OFFTHREAD_VIDEO_CLASS_NAME} {
      object-fit: contain;
    }
    `;
    }
    return `
    ${scope} * {
      box-sizing: border-box;
    }
    ${scope} *:-webkit-full-screen {
      width: 100%;
      height: 100%;
    }
    ${scope} .${exports.OFFTHREAD_VIDEO_CLASS_NAME} {
      object-fit: contain;
    }
  `;
};
exports.makeDefaultCSS = makeDefaultCSS;


/***/ }),

/***/ 22663:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.continueRender = exports.delayRender = exports.DELAY_RENDER_RETRY_TOKEN = exports.DELAY_RENDER_RETRIES_LEFT = exports.DELAY_RENDER_CALLSTACK_TOKEN = void 0;
const cancel_render_js_1 = __webpack_require__(88113);
const get_remotion_environment_js_1 = __webpack_require__(48288);
const truthy_js_1 = __webpack_require__(3928);
if (typeof window !== 'undefined') {
    window.remotion_renderReady = false;
}
let handles = [];
if (typeof window !== 'undefined') {
    window.remotion_delayRenderTimeouts = {};
}
exports.DELAY_RENDER_CALLSTACK_TOKEN = 'The delayRender was called:';
exports.DELAY_RENDER_RETRIES_LEFT = 'Retries left: ';
exports.DELAY_RENDER_RETRY_TOKEN = '- Rendering the frame will be retried.';
const defaultTimeout = 30000;
/**
 * @description Call this function to tell Remotion to wait before capturing this frame until data has loaded. Use continueRender() to unblock the render.
 * @param label _optional_ A label to identify the call in case it does time out.
 * @returns {number} An identifier to be passed to continueRender().
 * @see [Documentation](https://www.remotion.dev/docs/delay-render)
 */
const delayRender = (label, options) => {
    var _a, _b, _c, _d, _e;
    if (typeof label !== 'string' && typeof label !== 'undefined') {
        throw new Error('The label parameter of delayRender() must be a string or undefined, got: ' +
            JSON.stringify(label));
    }
    const handle = Math.random();
    handles.push(handle);
    const called = (_b = (_a = Error().stack) === null || _a === void 0 ? void 0 : _a.replace(/^Error/g, '')) !== null && _b !== void 0 ? _b : '';
    if ((0, get_remotion_environment_js_1.getRemotionEnvironment)().isRendering) {
        const timeoutToUse = ((_c = options === null || options === void 0 ? void 0 : options.timeoutInMilliseconds) !== null && _c !== void 0 ? _c : (typeof window === 'undefined'
            ? defaultTimeout
            : (_d = window.remotion_puppeteerTimeout) !== null && _d !== void 0 ? _d : defaultTimeout)) - 2000;
        if (typeof window !== 'undefined') {
            const retriesLeft = ((_e = options === null || options === void 0 ? void 0 : options.retries) !== null && _e !== void 0 ? _e : 0) - (window.remotion_attempt - 1);
            window.remotion_delayRenderTimeouts[handle] = {
                label: label !== null && label !== void 0 ? label : null,
                timeout: setTimeout(() => {
                    const message = [
                        `A delayRender()`,
                        label ? `"${label}"` : null,
                        `was called but not cleared after ${timeoutToUse}ms. See https://remotion.dev/docs/timeout for help.`,
                        retriesLeft > 0 ? exports.DELAY_RENDER_RETRIES_LEFT + retriesLeft : null,
                        retriesLeft > 0 ? exports.DELAY_RENDER_RETRY_TOKEN : null,
                        exports.DELAY_RENDER_CALLSTACK_TOKEN,
                        called,
                    ]
                        .filter(truthy_js_1.truthy)
                        .join(' ');
                    (0, cancel_render_js_1.cancelRender)(Error(message));
                }, timeoutToUse),
            };
        }
    }
    if (typeof window !== 'undefined') {
        window.remotion_renderReady = false;
    }
    return handle;
};
exports.delayRender = delayRender;
/**
 * @description Unblock a render that has been blocked by delayRender()
 * @param handle The return value of delayRender().
 * @see [Documentation](https://www.remotion.dev/docs/continue-render)
 */
const continueRender = (handle) => {
    if (typeof handle === 'undefined') {
        throw new TypeError('The continueRender() method must be called with a parameter that is the return value of delayRender(). No value was passed.');
    }
    if (typeof handle !== 'number') {
        throw new TypeError('The parameter passed into continueRender() must be the return value of delayRender() which is a number. Got: ' +
            JSON.stringify(handle));
    }
    handles = handles.filter((h) => {
        if (h === handle) {
            if ((0, get_remotion_environment_js_1.getRemotionEnvironment)().isRendering) {
                clearTimeout(window.remotion_delayRenderTimeouts[handle].timeout);
                delete window.remotion_delayRenderTimeouts[handle];
            }
            return false;
        }
        return true;
    });
    if (handles.length === 0 && typeof window !== 'undefined') {
        window.remotion_renderReady = true;
    }
};
exports.continueRender = continueRender;


/***/ }),

/***/ 65514:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


// Taken from https://github.com/facebook/react-native/blob/0b9ea60b4fee8cacc36e7160e31b91fc114dbc0d/Libraries/Animated/src/Easing.js
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Easing = void 0;
const bezier_js_1 = __webpack_require__(32219);
/**
 * @description The Easing module implements common easing functions. You can use it with the interpolate() API.
 * @see [Documentation](https://www.remotion.dev/docs/easing)
 */
class Easing {
    static step0(n) {
        return n > 0 ? 1 : 0;
    }
    static step1(n) {
        return n >= 1 ? 1 : 0;
    }
    static linear(t) {
        return t;
    }
    static ease(t) {
        return Easing.bezier(0.42, 0, 1, 1)(t);
    }
    static quad(t) {
        return t * t;
    }
    static cubic(t) {
        return t * t * t;
    }
    static poly(n) {
        return (t) => t ** n;
    }
    static sin(t) {
        return 1 - Math.cos((t * Math.PI) / 2);
    }
    static circle(t) {
        return 1 - Math.sqrt(1 - t * t);
    }
    static exp(t) {
        return 2 ** (10 * (t - 1));
    }
    static elastic(bounciness = 1) {
        const p = bounciness * Math.PI;
        return (t) => 1 - Math.cos((t * Math.PI) / 2) ** 3 * Math.cos(t * p);
    }
    static back(s = 1.70158) {
        return (t) => t * t * ((s + 1) * t - s);
    }
    static bounce(t) {
        if (t < 1 / 2.75) {
            return 7.5625 * t * t;
        }
        if (t < 2 / 2.75) {
            const t2_ = t - 1.5 / 2.75;
            return 7.5625 * t2_ * t2_ + 0.75;
        }
        if (t < 2.5 / 2.75) {
            const t2_ = t - 2.25 / 2.75;
            return 7.5625 * t2_ * t2_ + 0.9375;
        }
        const t2 = t - 2.625 / 2.75;
        return 7.5625 * t2 * t2 + 0.984375;
    }
    static bezier(x1, y1, x2, y2) {
        return (0, bezier_js_1.bezier)(x1, y1, x2, y2);
    }
    static in(easing) {
        return easing;
    }
    static out(easing) {
        return (t) => 1 - easing(1 - t);
    }
    static inOut(easing) {
        return (t) => {
            if (t < 0.5) {
                return easing(t * 2) / 2;
            }
            return 1 - easing((1 - t) * 2) / 2;
        };
    }
}
exports.Easing = Easing;


/***/ }),

/***/ 12196:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.addSequenceStackTraces = exports.enableSequenceStackTraces = void 0;
const react_1 = __importDefault(__webpack_require__(67294));
const get_remotion_environment_1 = __webpack_require__(48288);
const originalCreateElement = react_1.default.createElement;
const componentsToAddStacksTo = [];
// Gets called when a new component is added,
// also when the Studio is mounted
const enableSequenceStackTraces = () => {
    if (!(0, get_remotion_environment_1.getRemotionEnvironment)().isStudio) {
        return;
    }
    const proxy = new Proxy(originalCreateElement, {
        apply(target, thisArg, argArray) {
            if (componentsToAddStacksTo.includes(argArray[0])) {
                const [first, props, ...rest] = argArray;
                const newProps = {
                    ...(props !== null && props !== void 0 ? props : {}),
                    stack: new Error().stack,
                };
                return Reflect.apply(target, thisArg, [first, newProps, ...rest]);
            }
            return Reflect.apply(target, thisArg, argArray);
        },
    });
    react_1.default.createElement = proxy;
};
exports.enableSequenceStackTraces = enableSequenceStackTraces;
const addSequenceStackTraces = (component) => {
    componentsToAddStacksTo.push(component);
    (0, exports.enableSequenceStackTraces)();
};
exports.addSequenceStackTraces = addSequenceStackTraces;


/***/ }),

/***/ 47587:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Freeze = void 0;
const jsx_runtime_1 = __webpack_require__(85893);
const react_1 = __webpack_require__(67294);
const SequenceContext_js_1 = __webpack_require__(73759);
const timeline_position_state_js_1 = __webpack_require__(47083);
const use_current_frame_js_1 = __webpack_require__(39727);
const use_video_config_js_1 = __webpack_require__(73347);
/**
 * @description This method freezes all of its children to the frame that you specify as a prop
 * @see [Documentation](https://www.remotion.dev/docs/freeze)
 */
const Freeze = ({ frame: frameToFreeze, children, active = true, }) => {
    var _a;
    const frame = (0, use_current_frame_js_1.useCurrentFrame)();
    const videoConfig = (0, use_video_config_js_1.useVideoConfig)();
    if (typeof frameToFreeze === 'undefined') {
        throw new Error(`The <Freeze /> component requires a 'frame' prop, but none was passed.`);
    }
    if (typeof frameToFreeze !== 'number') {
        throw new Error(`The 'frame' prop of <Freeze /> must be a number, but is of type ${typeof frameToFreeze}`);
    }
    if (Number.isNaN(frameToFreeze)) {
        throw new Error(`The 'frame' prop of <Freeze /> must be a real number, but it is NaN.`);
    }
    if (!Number.isFinite(frameToFreeze)) {
        throw new Error(`The 'frame' prop of <Freeze /> must be a finite number, but it is ${frameToFreeze}.`);
    }
    const isActive = (0, react_1.useMemo)(() => {
        if (typeof active === 'boolean') {
            return active;
        }
        if (typeof active === 'function') {
            return active(frame);
        }
    }, [active, frame]);
    const timelineContext = (0, react_1.useContext)(timeline_position_state_js_1.TimelineContext);
    const sequenceContext = (0, react_1.useContext)(SequenceContext_js_1.SequenceContext);
    const relativeFrom = (_a = sequenceContext === null || sequenceContext === void 0 ? void 0 : sequenceContext.relativeFrom) !== null && _a !== void 0 ? _a : 0;
    const timelineValue = (0, react_1.useMemo)(() => {
        if (!isActive) {
            return timelineContext;
        }
        return {
            ...timelineContext,
            playing: false,
            imperativePlaying: {
                current: false,
            },
            frame: {
                [videoConfig.id]: frameToFreeze + relativeFrom,
            },
        };
    }, [isActive, timelineContext, videoConfig.id, frameToFreeze, relativeFrom]);
    return ((0, jsx_runtime_1.jsx)(timeline_position_state_js_1.TimelineContext.Provider, { value: timelineValue, children: children }));
};
exports.Freeze = Freeze;


/***/ }),

/***/ 76644:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.getAssetDisplayName = void 0;
const getAssetDisplayName = (filename) => {
    if (/data:|blob:/.test(filename.substring(0, 5))) {
        return 'Data URL';
    }
    const splitted = filename
        .split('/')
        .map((s) => s.split('\\'))
        .flat(1);
    return splitted[splitted.length - 1];
};
exports.getAssetDisplayName = getAssetDisplayName;


/***/ }),

/***/ 83595:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.getPreviewDomElement = exports.REMOTION_STUDIO_CONTAINER_ELEMENT = void 0;
exports.REMOTION_STUDIO_CONTAINER_ELEMENT = '__remotion-studio-container';
const getPreviewDomElement = () => {
    return document.getElementById(exports.REMOTION_STUDIO_CONTAINER_ELEMENT);
};
exports.getPreviewDomElement = getPreviewDomElement;


/***/ }),

/***/ 48288:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.getRemotionEnvironment = void 0;
/**
 * @description Provides information about the Remotion Environment
 * @see [Documentation](https://www.remotion.dev/docs/get-remotion-environment)
 */
const getRemotionEnvironment = () => {
    const isPlayer = typeof window !== 'undefined' && window.remotion_isPlayer;
    const isRendering =  false ||
        ( true &&
            typeof window !== 'undefined' &&
            typeof window.remotion_puppeteerTimeout !== 'undefined');
    const isStudio = typeof window !== 'undefined' && window.remotion_isStudio;
    return {
        isStudio,
        isRendering,
        isPlayer,
    };
};
exports.getRemotionEnvironment = getRemotionEnvironment;


/***/ }),

/***/ 25357:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.getStaticFiles = void 0;
let warnedServer = false;
let warnedPlayer = false;
const warnServerOnce = () => {
    if (warnedServer) {
        return;
    }
    warnedServer = true;
    // eslint-disable-next-line no-console
    console.warn('Called getStaticFiles() on the server. The API is only available in the browser. An empty array was returned.');
};
const warnPlayerOnce = () => {
    if (warnedPlayer) {
        return;
    }
    warnedPlayer = true;
    // eslint-disable-next-line no-console
    console.warn('Called getStaticFiles() while using the Remotion Player. The API is only available while using the Remotion Studio. An empty array was returned.');
};
/**
 * @description The function array containing all files in the public/ folder. You can reference them by using staticFile().
 * @see [Documentation](https://www.remotion.dev/docs/getstaticfiles)
 */
const getStaticFiles = () => {
    if (typeof document === 'undefined') {
        warnServerOnce();
        return [];
    }
    if (window.remotion_isPlayer) {
        warnPlayerOnce();
        return [];
    }
    return window.remotion_staticFiles;
};
exports.getStaticFiles = getStaticFiles;


/***/ }),

/***/ 27982:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Config = exports.Experimental = exports.watchStaticFile = exports.useCurrentScale = exports.useCurrentFrame = exports.useBufferState = exports.staticFile = exports.Series = exports.Sequence = exports.registerRoot = exports.prefetch = exports.random = exports.interpolate = exports.Loop = exports.interpolateColors = exports.Img = exports.getStaticFiles = exports.getRemotionEnvironment = exports.delayRender = exports.continueRender = exports.getInputProps = exports.Composition = exports.cancelRender = void 0;
__webpack_require__(55449);
const Clipper_js_1 = __webpack_require__(72434);
const enable_sequence_stack_traces_js_1 = __webpack_require__(12196);
const is_player_js_1 = __webpack_require__(50606);
const multiple_versions_warning_js_1 = __webpack_require__(90469);
const Null_js_1 = __webpack_require__(74675);
const Sequence_js_1 = __webpack_require__(97080);
(0, multiple_versions_warning_js_1.checkMultipleRemotionVersions)();
__exportStar(__webpack_require__(92640), exports);
__exportStar(__webpack_require__(24533), exports);
var cancel_render_js_1 = __webpack_require__(88113);
Object.defineProperty(exports, "cancelRender", ({ enumerable: true, get: function () { return cancel_render_js_1.cancelRender; } }));
var Composition_js_1 = __webpack_require__(63013);
Object.defineProperty(exports, "Composition", ({ enumerable: true, get: function () { return Composition_js_1.Composition; } }));
var input_props_js_1 = __webpack_require__(35287);
Object.defineProperty(exports, "getInputProps", ({ enumerable: true, get: function () { return input_props_js_1.getInputProps; } }));
var delay_render_js_1 = __webpack_require__(22663);
Object.defineProperty(exports, "continueRender", ({ enumerable: true, get: function () { return delay_render_js_1.continueRender; } }));
Object.defineProperty(exports, "delayRender", ({ enumerable: true, get: function () { return delay_render_js_1.delayRender; } }));
__exportStar(__webpack_require__(65514), exports);
__exportStar(__webpack_require__(49512), exports);
__exportStar(__webpack_require__(47587), exports);
var get_remotion_environment_js_1 = __webpack_require__(48288);
Object.defineProperty(exports, "getRemotionEnvironment", ({ enumerable: true, get: function () { return get_remotion_environment_js_1.getRemotionEnvironment; } }));
var get_static_files_js_1 = __webpack_require__(25357);
Object.defineProperty(exports, "getStaticFiles", ({ enumerable: true, get: function () { return get_static_files_js_1.getStaticFiles; } }));
__exportStar(__webpack_require__(35139), exports);
var Img_js_1 = __webpack_require__(10074);
Object.defineProperty(exports, "Img", ({ enumerable: true, get: function () { return Img_js_1.Img; } }));
__exportStar(__webpack_require__(88456), exports);
var interpolate_colors_js_1 = __webpack_require__(4354);
Object.defineProperty(exports, "interpolateColors", ({ enumerable: true, get: function () { return interpolate_colors_js_1.interpolateColors; } }));
var index_js_1 = __webpack_require__(4432);
Object.defineProperty(exports, "Loop", ({ enumerable: true, get: function () { return index_js_1.Loop; } }));
var no_react_1 = __webpack_require__(60808);
Object.defineProperty(exports, "interpolate", ({ enumerable: true, get: function () { return no_react_1.interpolate; } }));
Object.defineProperty(exports, "random", ({ enumerable: true, get: function () { return no_react_1.random; } }));
var prefetch_js_1 = __webpack_require__(32595);
Object.defineProperty(exports, "prefetch", ({ enumerable: true, get: function () { return prefetch_js_1.prefetch; } }));
var register_root_js_1 = __webpack_require__(74440);
Object.defineProperty(exports, "registerRoot", ({ enumerable: true, get: function () { return register_root_js_1.registerRoot; } }));
var Sequence_js_2 = __webpack_require__(97080);
Object.defineProperty(exports, "Sequence", ({ enumerable: true, get: function () { return Sequence_js_2.Sequence; } }));
var index_js_2 = __webpack_require__(93864);
Object.defineProperty(exports, "Series", ({ enumerable: true, get: function () { return index_js_2.Series; } }));
__exportStar(__webpack_require__(37636), exports);
var static_file_js_1 = __webpack_require__(96840);
Object.defineProperty(exports, "staticFile", ({ enumerable: true, get: function () { return static_file_js_1.staticFile; } }));
__exportStar(__webpack_require__(18876), exports);
var use_buffer_state_1 = __webpack_require__(89075);
Object.defineProperty(exports, "useBufferState", ({ enumerable: true, get: function () { return use_buffer_state_1.useBufferState; } }));
var use_current_frame_js_1 = __webpack_require__(39727);
Object.defineProperty(exports, "useCurrentFrame", ({ enumerable: true, get: function () { return use_current_frame_js_1.useCurrentFrame; } }));
var use_current_scale_1 = __webpack_require__(99267);
Object.defineProperty(exports, "useCurrentScale", ({ enumerable: true, get: function () { return use_current_scale_1.useCurrentScale; } }));
__exportStar(__webpack_require__(73347), exports);
__exportStar(__webpack_require__(93648), exports);
__exportStar(__webpack_require__(87778), exports);
__exportStar(__webpack_require__(4134), exports);
var watch_static_file_js_1 = __webpack_require__(74295);
Object.defineProperty(exports, "watchStaticFile", ({ enumerable: true, get: function () { return watch_static_file_js_1.watchStaticFile; } }));
exports.Experimental = {
    /**
     * @description This is a special component that will cause Remotion to only partially capture the frame of the video.
     * @see [Documentation](https://www.remotion.dev/docs/clipper)
     */
    Clipper: Clipper_js_1.Clipper,
    /**
     * @description This is a special component, that, when rendered, will skip rendering the frame altogether.
     * @see [Documentation](https://www.remotion.dev/docs/null)
     */
    Null: Null_js_1.Null,
    useIsPlayer: is_player_js_1.useIsPlayer,
};
const proxyObj = {};
exports.Config = new Proxy(proxyObj, {
    get(_, prop) {
        if (prop === 'Bundling' ||
            prop === 'Rendering' ||
            prop === 'Log' ||
            prop === 'Puppeteer' ||
            prop === 'Output') {
            return exports.Config;
        }
        return () => {
            /* eslint-disable no-console */
            console.warn('⚠️  The CLI configuration has been extracted from Remotion Core.');
            console.warn('Update the import from the config file:');
            console.warn();
            console.warn('- Delete:');
            console.warn('import {Config} from "remotion";');
            console.warn('+ Replace:');
            console.warn('import {Config} from "@remotion/cli/config";');
            console.warn();
            console.warn('For more information, see https://www.remotion.dev/docs/4-0-migration.');
            /* eslint-enable no-console */
            process.exit(1);
        };
    },
});
(0, enable_sequence_stack_traces_js_1.addSequenceStackTraces)(Sequence_js_1.Sequence);


/***/ }),

/***/ 89203:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


// Must keep this file in sync with the one in packages/lambda/src/shared/serialize-props.ts!
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.deserializeJSONWithCustomFields = exports.serializeJSONWithDate = exports.FILE_TOKEN = exports.DATE_TOKEN = void 0;
const static_file_js_1 = __webpack_require__(96840);
exports.DATE_TOKEN = 'remotion-date:';
exports.FILE_TOKEN = 'remotion-file:';
const serializeJSONWithDate = ({ data, indent, staticBase, }) => {
    let customDateUsed = false;
    let customFileUsed = false;
    let mapUsed = false;
    let setUsed = false;
    const serializedString = JSON.stringify(data, function (key, value) {
        const item = this[key];
        if (item instanceof Date) {
            customDateUsed = true;
            return `${exports.DATE_TOKEN}${item.toISOString()}`;
        }
        if (item instanceof Map) {
            mapUsed = true;
            return value;
        }
        if (item instanceof Set) {
            setUsed = true;
            return value;
        }
        if (typeof item === 'string' &&
            staticBase !== null &&
            item.startsWith(staticBase)) {
            customFileUsed = true;
            return `${exports.FILE_TOKEN}${item.replace(staticBase + '/', '')}`;
        }
        return value;
    }, indent);
    return { serializedString, customDateUsed, customFileUsed, mapUsed, setUsed };
};
exports.serializeJSONWithDate = serializeJSONWithDate;
const deserializeJSONWithCustomFields = (data) => {
    return JSON.parse(data, (_, value) => {
        if (typeof value === 'string' && value.startsWith(exports.DATE_TOKEN)) {
            return new Date(value.replace(exports.DATE_TOKEN, ''));
        }
        if (typeof value === 'string' && value.startsWith(exports.FILE_TOKEN)) {
            return (0, static_file_js_1.staticFile)(value.replace(exports.FILE_TOKEN, ''));
        }
        return value;
    });
};
exports.deserializeJSONWithCustomFields = deserializeJSONWithCustomFields;


/***/ }),

/***/ 88456:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Internals = void 0;
const shared_audio_tags_js_1 = __webpack_require__(3161);
const use_audio_frame_js_1 = __webpack_require__(66873);
const buffering_js_1 = __webpack_require__(45775);
const CanUseRemotionHooks_js_1 = __webpack_require__(44144);
const Composition_js_1 = __webpack_require__(63013);
const CompositionManager_js_1 = __webpack_require__(4932);
const CompositionManagerContext_js_1 = __webpack_require__(13898);
const CSSUtils = __importStar(__webpack_require__(57524));
const EditorProps_js_1 = __webpack_require__(75550);
const enable_sequence_stack_traces_js_1 = __webpack_require__(12196);
const get_preview_dom_element_js_1 = __webpack_require__(83595);
const get_remotion_environment_js_1 = __webpack_require__(48288);
const input_props_serialization_js_1 = __webpack_require__(89203);
const interpolate_colors_js_1 = __webpack_require__(4354);
const is_player_js_1 = __webpack_require__(50606);
const NativeLayers_js_1 = __webpack_require__(2425);
const nonce_js_1 = __webpack_require__(98054);
const portal_node_js_1 = __webpack_require__(91734);
const prefetch_state_js_1 = __webpack_require__(15819);
const prefetch_js_1 = __webpack_require__(32595);
const register_root_js_1 = __webpack_require__(74440);
const RemotionRoot_js_1 = __webpack_require__(87929);
const RenderAssetManager_js_1 = __webpack_require__(26770);
const resolve_video_config_js_1 = __webpack_require__(28832);
const ResolveCompositionConfig_js_1 = __webpack_require__(95014);
const SequenceContext_js_1 = __webpack_require__(73759);
const SequenceManager_js_1 = __webpack_require__(80829);
const setup_env_variables_js_1 = __webpack_require__(28498);
const TimelinePosition = __importStar(__webpack_require__(47083));
const timeline_position_state_js_1 = __webpack_require__(47083);
const truthy_js_1 = __webpack_require__(3928);
const use_current_scale_js_1 = __webpack_require__(99267);
const use_lazy_component_js_1 = __webpack_require__(44858);
const use_unsafe_video_config_js_1 = __webpack_require__(53095);
const use_video_js_1 = __webpack_require__(3141);
const validate_composition_id_js_1 = __webpack_require__(86303);
const duration_state_js_1 = __webpack_require__(19099);
const video_fragment_js_1 = __webpack_require__(51527);
const volume_position_state_js_1 = __webpack_require__(51399);
const watch_static_file_js_1 = __webpack_require__(74295);
const wrap_remotion_context_js_1 = __webpack_require__(69887);
// Mark them as Internals so use don't assume this is public
// API and are less likely to use it
exports.Internals = {
    useUnsafeVideoConfig: use_unsafe_video_config_js_1.useUnsafeVideoConfig,
    Timeline: TimelinePosition,
    CompositionManager: CompositionManagerContext_js_1.CompositionManager,
    SequenceManager: SequenceManager_js_1.SequenceManager,
    SequenceVisibilityToggleContext: SequenceManager_js_1.SequenceVisibilityToggleContext,
    RemotionRoot: RemotionRoot_js_1.RemotionRoot,
    useVideo: use_video_js_1.useVideo,
    getRoot: register_root_js_1.getRoot,
    useMediaVolumeState: volume_position_state_js_1.useMediaVolumeState,
    useMediaMutedState: volume_position_state_js_1.useMediaMutedState,
    useLazyComponent: use_lazy_component_js_1.useLazyComponent,
    truthy: truthy_js_1.truthy,
    SequenceContext: SequenceContext_js_1.SequenceContext,
    useRemotionContexts: wrap_remotion_context_js_1.useRemotionContexts,
    RemotionContextProvider: wrap_remotion_context_js_1.RemotionContextProvider,
    CSSUtils,
    setupEnvVariables: setup_env_variables_js_1.setupEnvVariables,
    MediaVolumeContext: volume_position_state_js_1.MediaVolumeContext,
    SetMediaVolumeContext: volume_position_state_js_1.SetMediaVolumeContext,
    getRemotionEnvironment: get_remotion_environment_js_1.getRemotionEnvironment,
    SharedAudioContext: shared_audio_tags_js_1.SharedAudioContext,
    SharedAudioContextProvider: shared_audio_tags_js_1.SharedAudioContextProvider,
    invalidCompositionErrorMessage: validate_composition_id_js_1.invalidCompositionErrorMessage,
    isCompositionIdValid: validate_composition_id_js_1.isCompositionIdValid,
    getPreviewDomElement: get_preview_dom_element_js_1.getPreviewDomElement,
    compositionsRef: CompositionManager_js_1.compositionsRef,
    portalNode: portal_node_js_1.portalNode,
    waitForRoot: register_root_js_1.waitForRoot,
    CanUseRemotionHooksProvider: CanUseRemotionHooks_js_1.CanUseRemotionHooksProvider,
    CanUseRemotionHooks: CanUseRemotionHooks_js_1.CanUseRemotionHooks,
    PrefetchProvider: prefetch_state_js_1.PrefetchProvider,
    DurationsContextProvider: duration_state_js_1.DurationsContextProvider,
    IsPlayerContextProvider: is_player_js_1.IsPlayerContextProvider,
    useIsPlayer: is_player_js_1.useIsPlayer,
    EditorPropsProvider: EditorProps_js_1.EditorPropsProvider,
    EditorPropsContext: EditorProps_js_1.EditorPropsContext,
    usePreload: prefetch_js_1.usePreload,
    NonceContext: nonce_js_1.NonceContext,
    resolveVideoConfig: resolve_video_config_js_1.resolveVideoConfig,
    useResolvedVideoConfig: ResolveCompositionConfig_js_1.useResolvedVideoConfig,
    resolveCompositionsRef: ResolveCompositionConfig_js_1.resolveCompositionsRef,
    ResolveCompositionConfig: ResolveCompositionConfig_js_1.ResolveCompositionConfig,
    REMOTION_STUDIO_CONTAINER_ELEMENT: get_preview_dom_element_js_1.REMOTION_STUDIO_CONTAINER_ELEMENT,
    RenderAssetManager: RenderAssetManager_js_1.RenderAssetManager,
    persistCurrentFrame: timeline_position_state_js_1.persistCurrentFrame,
    useTimelineSetFrame: timeline_position_state_js_1.useTimelineSetFrame,
    FILE_TOKEN: input_props_serialization_js_1.FILE_TOKEN,
    DATE_TOKEN: input_props_serialization_js_1.DATE_TOKEN,
    NativeLayersProvider: NativeLayers_js_1.NativeLayersProvider,
    ClipComposition: Composition_js_1.ClipComposition,
    isIosSafari: video_fragment_js_1.isIosSafari,
    WATCH_REMOTION_STATIC_FILES: watch_static_file_js_1.WATCH_REMOTION_STATIC_FILES,
    addSequenceStackTraces: enable_sequence_stack_traces_js_1.addSequenceStackTraces,
    useMediaStartsAt: use_audio_frame_js_1.useMediaStartsAt,
    BufferingProvider: buffering_js_1.BufferingProvider,
    BufferingContextReact: buffering_js_1.BufferingContextReact,
    enableSequenceStackTraces: enable_sequence_stack_traces_js_1.enableSequenceStackTraces,
    colorNames: interpolate_colors_js_1.colorNames,
    CurrentScaleContext: use_current_scale_js_1.CurrentScaleContext,
    PreviewSizeContext: use_current_scale_js_1.PreviewSizeContext,
    calculateScale: use_current_scale_js_1.calculateScale,
};


/***/ }),

/***/ 4354:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


/**
 * Copied from:
 * https://github.com/software-mansion/react-native-reanimated/blob/master/src/reanimated2/Colors.ts
 */
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.interpolateColors = exports.processColor = exports.colorNames = void 0;
/* eslint no-bitwise: 0 */
const interpolate_js_1 = __webpack_require__(92297);
// var INTEGER = '[-+]?\\d+';
const NUMBER = '[-+]?\\d*\\.?\\d+';
const PERCENTAGE = NUMBER + '%';
function call(...args) {
    return '\\(\\s*(' + args.join(')\\s*,\\s*(') + ')\\s*\\)';
}
function getMatchers() {
    const cachedMatchers = {
        rgb: undefined,
        rgba: undefined,
        hsl: undefined,
        hsla: undefined,
        hex3: undefined,
        hex4: undefined,
        hex5: undefined,
        hex6: undefined,
        hex8: undefined,
    };
    if (cachedMatchers.rgb === undefined) {
        cachedMatchers.rgb = new RegExp('rgb' + call(NUMBER, NUMBER, NUMBER));
        cachedMatchers.rgba = new RegExp('rgba' + call(NUMBER, NUMBER, NUMBER, NUMBER));
        cachedMatchers.hsl = new RegExp('hsl' + call(NUMBER, PERCENTAGE, PERCENTAGE));
        cachedMatchers.hsla = new RegExp('hsla' + call(NUMBER, PERCENTAGE, PERCENTAGE, NUMBER));
        cachedMatchers.hex3 = /^#([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/;
        cachedMatchers.hex4 =
            /^#([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/;
        cachedMatchers.hex6 = /^#([0-9a-fA-F]{6})$/;
        cachedMatchers.hex8 = /^#([0-9a-fA-F]{8})$/;
    }
    return cachedMatchers;
}
function hue2rgb(p, q, t) {
    if (t < 0) {
        t += 1;
    }
    if (t > 1) {
        t -= 1;
    }
    if (t < 1 / 6) {
        return p + (q - p) * 6 * t;
    }
    if (t < 1 / 2) {
        return q;
    }
    if (t < 2 / 3) {
        return p + (q - p) * (2 / 3 - t) * 6;
    }
    return p;
}
function hslToRgb(h, s, l) {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    const r = hue2rgb(p, q, h + 1 / 3);
    const g = hue2rgb(p, q, h);
    const b = hue2rgb(p, q, h - 1 / 3);
    return ((Math.round(r * 255) << 24) |
        (Math.round(g * 255) << 16) |
        (Math.round(b * 255) << 8));
}
function parse255(str) {
    const int = Number.parseInt(str, 10);
    if (int < 0) {
        return 0;
    }
    if (int > 255) {
        return 255;
    }
    return int;
}
function parse360(str) {
    const int = Number.parseFloat(str);
    return (((int % 360) + 360) % 360) / 360;
}
function parse1(str) {
    const num = Number.parseFloat(str);
    if (num < 0) {
        return 0;
    }
    if (num > 1) {
        return 255;
    }
    return Math.round(num * 255);
}
function parsePercentage(str) {
    // parseFloat conveniently ignores the final %
    const int = Number.parseFloat(str);
    if (int < 0) {
        return 0;
    }
    if (int > 100) {
        return 1;
    }
    return int / 100;
}
exports.colorNames = {
    transparent: 0x00000000,
    // http://www.w3.org/TR/css3-color/#svg-color
    aliceblue: 0xf0f8ffff,
    antiquewhite: 0xfaebd7ff,
    aqua: 0x00ffffff,
    aquamarine: 0x7fffd4ff,
    azure: 0xf0ffffff,
    beige: 0xf5f5dcff,
    bisque: 0xffe4c4ff,
    black: 0x000000ff,
    blanchedalmond: 0xffebcdff,
    blue: 0x0000ffff,
    blueviolet: 0x8a2be2ff,
    brown: 0xa52a2aff,
    burlywood: 0xdeb887ff,
    burntsienna: 0xea7e5dff,
    cadetblue: 0x5f9ea0ff,
    chartreuse: 0x7fff00ff,
    chocolate: 0xd2691eff,
    coral: 0xff7f50ff,
    cornflowerblue: 0x6495edff,
    cornsilk: 0xfff8dcff,
    crimson: 0xdc143cff,
    cyan: 0x00ffffff,
    darkblue: 0x00008bff,
    darkcyan: 0x008b8bff,
    darkgoldenrod: 0xb8860bff,
    darkgray: 0xa9a9a9ff,
    darkgreen: 0x006400ff,
    darkgrey: 0xa9a9a9ff,
    darkkhaki: 0xbdb76bff,
    darkmagenta: 0x8b008bff,
    darkolivegreen: 0x556b2fff,
    darkorange: 0xff8c00ff,
    darkorchid: 0x9932ccff,
    darkred: 0x8b0000ff,
    darksalmon: 0xe9967aff,
    darkseagreen: 0x8fbc8fff,
    darkslateblue: 0x483d8bff,
    darkslategray: 0x2f4f4fff,
    darkslategrey: 0x2f4f4fff,
    darkturquoise: 0x00ced1ff,
    darkviolet: 0x9400d3ff,
    deeppink: 0xff1493ff,
    deepskyblue: 0x00bfffff,
    dimgray: 0x696969ff,
    dimgrey: 0x696969ff,
    dodgerblue: 0x1e90ffff,
    firebrick: 0xb22222ff,
    floralwhite: 0xfffaf0ff,
    forestgreen: 0x228b22ff,
    fuchsia: 0xff00ffff,
    gainsboro: 0xdcdcdcff,
    ghostwhite: 0xf8f8ffff,
    gold: 0xffd700ff,
    goldenrod: 0xdaa520ff,
    gray: 0x808080ff,
    green: 0x008000ff,
    greenyellow: 0xadff2fff,
    grey: 0x808080ff,
    honeydew: 0xf0fff0ff,
    hotpink: 0xff69b4ff,
    indianred: 0xcd5c5cff,
    indigo: 0x4b0082ff,
    ivory: 0xfffff0ff,
    khaki: 0xf0e68cff,
    lavender: 0xe6e6faff,
    lavenderblush: 0xfff0f5ff,
    lawngreen: 0x7cfc00ff,
    lemonchiffon: 0xfffacdff,
    lightblue: 0xadd8e6ff,
    lightcoral: 0xf08080ff,
    lightcyan: 0xe0ffffff,
    lightgoldenrodyellow: 0xfafad2ff,
    lightgray: 0xd3d3d3ff,
    lightgreen: 0x90ee90ff,
    lightgrey: 0xd3d3d3ff,
    lightpink: 0xffb6c1ff,
    lightsalmon: 0xffa07aff,
    lightseagreen: 0x20b2aaff,
    lightskyblue: 0x87cefaff,
    lightslategray: 0x778899ff,
    lightslategrey: 0x778899ff,
    lightsteelblue: 0xb0c4deff,
    lightyellow: 0xffffe0ff,
    lime: 0x00ff00ff,
    limegreen: 0x32cd32ff,
    linen: 0xfaf0e6ff,
    magenta: 0xff00ffff,
    maroon: 0x800000ff,
    mediumaquamarine: 0x66cdaaff,
    mediumblue: 0x0000cdff,
    mediumorchid: 0xba55d3ff,
    mediumpurple: 0x9370dbff,
    mediumseagreen: 0x3cb371ff,
    mediumslateblue: 0x7b68eeff,
    mediumspringgreen: 0x00fa9aff,
    mediumturquoise: 0x48d1ccff,
    mediumvioletred: 0xc71585ff,
    midnightblue: 0x191970ff,
    mintcream: 0xf5fffaff,
    mistyrose: 0xffe4e1ff,
    moccasin: 0xffe4b5ff,
    navajowhite: 0xffdeadff,
    navy: 0x000080ff,
    oldlace: 0xfdf5e6ff,
    olive: 0x808000ff,
    olivedrab: 0x6b8e23ff,
    orange: 0xffa500ff,
    orangered: 0xff4500ff,
    orchid: 0xda70d6ff,
    palegoldenrod: 0xeee8aaff,
    palegreen: 0x98fb98ff,
    paleturquoise: 0xafeeeeff,
    palevioletred: 0xdb7093ff,
    papayawhip: 0xffefd5ff,
    peachpuff: 0xffdab9ff,
    peru: 0xcd853fff,
    pink: 0xffc0cbff,
    plum: 0xdda0ddff,
    powderblue: 0xb0e0e6ff,
    purple: 0x800080ff,
    rebeccapurple: 0x663399ff,
    red: 0xff0000ff,
    rosybrown: 0xbc8f8fff,
    royalblue: 0x4169e1ff,
    saddlebrown: 0x8b4513ff,
    salmon: 0xfa8072ff,
    sandybrown: 0xf4a460ff,
    seagreen: 0x2e8b57ff,
    seashell: 0xfff5eeff,
    sienna: 0xa0522dff,
    silver: 0xc0c0c0ff,
    skyblue: 0x87ceebff,
    slateblue: 0x6a5acdff,
    slategray: 0x708090ff,
    slategrey: 0x708090ff,
    snow: 0xfffafaff,
    springgreen: 0x00ff7fff,
    steelblue: 0x4682b4ff,
    tan: 0xd2b48cff,
    teal: 0x008080ff,
    thistle: 0xd8bfd8ff,
    tomato: 0xff6347ff,
    turquoise: 0x40e0d0ff,
    violet: 0xee82eeff,
    wheat: 0xf5deb3ff,
    white: 0xffffffff,
    whitesmoke: 0xf5f5f5ff,
    yellow: 0xffff00ff,
    yellowgreen: 0x9acd32ff,
};
function normalizeColor(color) {
    const matchers = getMatchers();
    let match;
    // Ordered based on occurrences on Facebook codebase
    if (matchers.hex6) {
        if ((match = matchers.hex6.exec(color))) {
            return Number.parseInt(match[1] + 'ff', 16) >>> 0;
        }
    }
    if (exports.colorNames[color] !== undefined) {
        return exports.colorNames[color];
    }
    if (matchers.rgb) {
        if ((match = matchers.rgb.exec(color))) {
            return (
            // b
            ((parse255(match[1]) << 24) | // r
                (parse255(match[2]) << 16) | // g
                (parse255(match[3]) << 8) |
                0x000000ff) >>> // a
                0);
        }
    }
    if (matchers.rgba) {
        if ((match = matchers.rgba.exec(color))) {
            return (
            // b
            ((parse255(match[1]) << 24) | // r
                (parse255(match[2]) << 16) | // g
                (parse255(match[3]) << 8) |
                parse1(match[4])) >>> // a
                0);
        }
    }
    if (matchers.hex3) {
        if ((match = matchers.hex3.exec(color))) {
            return (Number.parseInt(match[1] +
                match[1] + // r
                match[2] +
                match[2] + // g
                match[3] +
                match[3] + // b
                'ff', // a
            16) >>> 0);
        }
    }
    // https://drafts.csswg.org/css-color-4/#hex-notation
    if (matchers.hex8) {
        if ((match = matchers.hex8.exec(color))) {
            return Number.parseInt(match[1], 16) >>> 0;
        }
    }
    if (matchers.hex4) {
        if ((match = matchers.hex4.exec(color))) {
            return (Number.parseInt(match[1] +
                match[1] + // r
                match[2] +
                match[2] + // g
                match[3] +
                match[3] + // b
                match[4] +
                match[4], // a
            16) >>> 0);
        }
    }
    if (matchers.hsl) {
        if ((match = matchers.hsl.exec(color))) {
            return ((hslToRgb(parse360(match[1]), // h
            parsePercentage(match[2]), // s
            parsePercentage(match[3])) |
                0x000000ff) >>> // a
                0);
        }
    }
    if (matchers.hsla) {
        if ((match = matchers.hsla.exec(color))) {
            return ((hslToRgb(parse360(match[1]), // h
            parsePercentage(match[2]), // s
            parsePercentage(match[3])) |
                parse1(match[4])) >>> // a
                0);
        }
    }
    throw new Error(`invalid color string ${color} provided`);
}
const opacity = (c) => {
    return ((c >> 24) & 255) / 255;
};
const red = (c) => {
    return (c >> 16) & 255;
};
const green = (c) => {
    return (c >> 8) & 255;
};
const blue = (c) => {
    return c & 255;
};
const rgbaColor = (r, g, b, alpha) => {
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};
function processColor(color) {
    const normalizedColor = normalizeColor(color);
    return ((normalizedColor << 24) | (normalizedColor >>> 8)) >>> 0; // argb
}
exports.processColor = processColor;
const interpolateColorsRGB = (value, inputRange, colors) => {
    const [r, g, b, a] = [red, green, blue, opacity].map((f) => {
        const unrounded = (0, interpolate_js_1.interpolate)(value, inputRange, colors.map((c) => f(c)), {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
        });
        if (f === opacity) {
            return Number(unrounded.toFixed(3));
        }
        return Math.round(unrounded);
    });
    return rgbaColor(r, g, b, a);
};
/**
 * @description This function allows you to map a range of values to colors using a concise syntax.
 * @see [Documentation](https://www.remotion.dev/docs/interpolate-colors)
 */
const interpolateColors = (input, inputRange, outputRange) => {
    if (typeof input === 'undefined') {
        throw new TypeError('input can not be undefined');
    }
    if (typeof inputRange === 'undefined') {
        throw new TypeError('inputRange can not be undefined');
    }
    if (typeof outputRange === 'undefined') {
        throw new TypeError('outputRange can not be undefined');
    }
    if (inputRange.length !== outputRange.length) {
        throw new TypeError('inputRange (' +
            inputRange.length +
            ' values provided) and outputRange (' +
            outputRange.length +
            ' values provided) must have the same length');
    }
    const processedOutputRange = outputRange.map((c) => processColor(c));
    return interpolateColorsRGB(input, inputRange, processedOutputRange);
};
exports.interpolateColors = interpolateColors;


/***/ }),

/***/ 92297:
/***/ ((__unused_webpack_module, exports) => {


// Taken from https://github.com/facebook/react-native/blob/0b9ea60b4fee8cacc36e7160e31b91fc114dbc0d/Libraries/Animated/src/nodes/AnimatedInterpolation.js
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.interpolate = void 0;
function interpolateFunction(input, inputRange, outputRange, options) {
    const { extrapolateLeft, extrapolateRight, easing } = options;
    let result = input;
    const [inputMin, inputMax] = inputRange;
    const [outputMin, outputMax] = outputRange;
    if (result < inputMin) {
        if (extrapolateLeft === 'identity') {
            return result;
        }
        if (extrapolateLeft === 'clamp') {
            result = inputMin;
        }
        else if (extrapolateLeft === 'wrap') {
            const range = inputMax - inputMin;
            result = ((((result - inputMin) % range) + range) % range) + inputMin;
        }
        else if (extrapolateLeft === 'extend') {
            // Noop
        }
    }
    if (result > inputMax) {
        if (extrapolateRight === 'identity') {
            return result;
        }
        if (extrapolateRight === 'clamp') {
            result = inputMax;
        }
        else if (extrapolateRight === 'wrap') {
            const range = inputMax - inputMin;
            result = ((((result - inputMin) % range) + range) % range) + inputMin;
        }
        else if (extrapolateRight === 'extend') {
            // Noop
        }
    }
    if (outputMin === outputMax) {
        return outputMin;
    }
    // Input Range
    result = (result - inputMin) / (inputMax - inputMin);
    // Easing
    result = easing(result);
    // Output Range
    result = result * (outputMax - outputMin) + outputMin;
    return result;
}
function findRange(input, inputRange) {
    let i;
    for (i = 1; i < inputRange.length - 1; ++i) {
        if (inputRange[i] >= input) {
            break;
        }
    }
    return i - 1;
}
function checkValidInputRange(arr) {
    for (let i = 1; i < arr.length; ++i) {
        if (!(arr[i] > arr[i - 1])) {
            throw new Error(`inputRange must be strictly monotonically increasing but got [${arr.join(',')}]`);
        }
    }
}
function checkInfiniteRange(name, arr) {
    if (arr.length < 2) {
        throw new Error(name + ' must have at least 2 elements');
    }
    for (const index in arr) {
        if (typeof arr[index] !== 'number') {
            throw new Error(`${name} must contain only numbers`);
        }
        if (arr[index] === -Infinity || arr[index] === Infinity) {
            throw new Error(`${name} must contain only finite numbers, but got [${arr.join(',')}]`);
        }
    }
}
/**
 * Map a value from an input range to an output range.
 * @link https://www.remotion.dev/docs/interpolate
 * @param {!number} input value to interpolate
 * @param {!number[]} inputRange range of values that you expect the input to assume.
 * @param {!number[]} outputRange range of output values that you want the input to map to.
 * @param {?object} options
 * @param {?Function} options.easing easing function which allows you to customize the input, for example to apply a certain easing function. By default, the input is left unmodified, resulting in a pure linear interpolation {@link https://www.remotion.dev/docs/easing}
 * @param {string=} [options.extrapolateLeft="extend"] What should happen if the input value is outside left the input range, default: "extend" {@link https://www.remotion.dev/docs/interpolate#extrapolateleft}
 * @param {string=} [options.extrapolateRight="extend"] Same as extrapolateLeft, except for values outside right the input range {@link https://www.remotion.dev/docs/interpolate#extrapolateright}
 */
function interpolate(input, inputRange, outputRange, options) {
    var _a;
    if (typeof input === 'undefined') {
        throw new Error('input can not be undefined');
    }
    if (typeof inputRange === 'undefined') {
        throw new Error('inputRange can not be undefined');
    }
    if (typeof outputRange === 'undefined') {
        throw new Error('outputRange can not be undefined');
    }
    if (inputRange.length !== outputRange.length) {
        throw new Error('inputRange (' +
            inputRange.length +
            ') and outputRange (' +
            outputRange.length +
            ') must have the same length');
    }
    checkInfiniteRange('inputRange', inputRange);
    checkInfiniteRange('outputRange', outputRange);
    checkValidInputRange(inputRange);
    const easing = (_a = options === null || options === void 0 ? void 0 : options.easing) !== null && _a !== void 0 ? _a : ((num) => num);
    let extrapolateLeft = 'extend';
    if ((options === null || options === void 0 ? void 0 : options.extrapolateLeft) !== undefined) {
        extrapolateLeft = options.extrapolateLeft;
    }
    let extrapolateRight = 'extend';
    if ((options === null || options === void 0 ? void 0 : options.extrapolateRight) !== undefined) {
        extrapolateRight = options.extrapolateRight;
    }
    if (typeof input !== 'number') {
        throw new TypeError('Cannot interpolate an input which is not a number');
    }
    const range = findRange(input, inputRange);
    return interpolateFunction(input, [inputRange[range], inputRange[range + 1]], [outputRange[range], outputRange[range + 1]], {
        easing,
        extrapolateLeft,
        extrapolateRight,
    });
}
exports.interpolate = interpolate;


/***/ }),

/***/ 26614:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.isApproximatelyTheSame = void 0;
const FLOATING_POINT_ERROR_THRESHOLD = 0.00001;
const isApproximatelyTheSame = (num1, num2) => {
    return Math.abs(num1 - num2) < FLOATING_POINT_ERROR_THRESHOLD;
};
exports.isApproximatelyTheSame = isApproximatelyTheSame;


/***/ }),

/***/ 50606:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.useIsPlayer = exports.IsPlayerContextProvider = void 0;
const jsx_runtime_1 = __webpack_require__(85893);
const react_1 = __webpack_require__(67294);
const IsPlayerContext = (0, react_1.createContext)(false);
const IsPlayerContextProvider = ({ children, }) => {
    return (0, jsx_runtime_1.jsx)(IsPlayerContext.Provider, { value: true, children: children });
};
exports.IsPlayerContextProvider = IsPlayerContextProvider;
const useIsPlayer = () => {
    return (0, react_1.useContext)(IsPlayerContext);
};
exports.useIsPlayer = useIsPlayer;


/***/ }),

/***/ 95490:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Loading = void 0;
const jsx_runtime_1 = __webpack_require__(85893);
const AbsoluteFill_js_1 = __webpack_require__(92640);
const rotate = {
    transform: `rotate(90deg)`,
};
const ICON_SIZE = 40;
const label = {
    color: 'white',
    fontSize: 14,
    fontFamily: 'sans-serif',
};
const container = {
    justifyContent: 'center',
    alignItems: 'center',
};
const Loading = () => {
    return ((0, jsx_runtime_1.jsxs)(AbsoluteFill_js_1.AbsoluteFill, { style: container, id: "remotion-comp-loading", children: [(0, jsx_runtime_1.jsx)("style", { type: "text/css", children: `
				@keyframes anim {
					from {
						opacity: 0
					}
					to {
						opacity: 1
					}
				}
				#remotion-comp-loading {
					animation: anim 2s;
					animation-fill-mode: forwards;
				}
			` }), (0, jsx_runtime_1.jsx)("svg", { width: ICON_SIZE, height: ICON_SIZE, viewBox: "-100 -100 400 400", style: rotate, children: (0, jsx_runtime_1.jsx)("path", { fill: "#555", stroke: "#555", strokeWidth: "100", strokeLinejoin: "round", d: "M 2 172 a 196 100 0 0 0 195 5 A 196 240 0 0 0 100 2.259 A 196 240 0 0 0 2 172 z" }) }), (0, jsx_runtime_1.jsxs)("p", { style: label, children: ["Resolving ", '<Suspense>', "..."] })] }));
};
exports.Loading = Loading;


/***/ }),

/***/ 4432:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Loop = void 0;
const jsx_runtime_1 = __webpack_require__(85893);
const react_1 = __webpack_require__(67294);
const Sequence_js_1 = __webpack_require__(97080);
const use_current_frame_js_1 = __webpack_require__(39727);
const use_video_config_js_1 = __webpack_require__(73347);
const validate_duration_in_frames_js_1 = __webpack_require__(52363);
/**
 * @description This component allows you to quickly lay out an animation so it repeats itself.
 * @see [Documentation](https://www.remotion.dev/docs/loop)
 */
const Loop = ({ durationInFrames, times = Infinity, children, name, ...props }) => {
    const currentFrame = (0, use_current_frame_js_1.useCurrentFrame)();
    const { durationInFrames: compDuration } = (0, use_video_config_js_1.useVideoConfig)();
    (0, validate_duration_in_frames_js_1.validateDurationInFrames)(durationInFrames, {
        component: 'of the <Loop /> component',
        allowFloats: true,
    });
    if (typeof times !== 'number') {
        throw new TypeError(`You passed to "times" an argument of type ${typeof times}, but it must be a number.`);
    }
    if (times !== Infinity && times % 1 !== 0) {
        throw new TypeError(`The "times" prop of a loop must be an integer, but got ${times}.`);
    }
    if (times < 0) {
        throw new TypeError(`The "times" prop of a loop must be at least 0, but got ${times}`);
    }
    const maxTimes = Math.ceil(compDuration / durationInFrames);
    const actualTimes = Math.min(maxTimes, times);
    const style = props.layout === 'none' ? undefined : props.style;
    const maxFrame = durationInFrames * (actualTimes - 1);
    const start = Math.floor(currentFrame / durationInFrames) * durationInFrames;
    const from = Math.min(start, maxFrame);
    const loopDisplay = (0, react_1.useMemo)(() => {
        return {
            numberOfTimes: actualTimes,
            startOffset: -from,
            durationInFrames,
        };
    }, [actualTimes, durationInFrames, from]);
    return ((0, jsx_runtime_1.jsx)(Sequence_js_1.Sequence, { durationInFrames: durationInFrames, from: from, name: name !== null && name !== void 0 ? name : '<Loop>', _remotionInternalLoopDisplay: loopDisplay, layout: props.layout, style: style, children: children }));
};
exports.Loop = Loop;


/***/ }),

/***/ 90469:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.checkMultipleRemotionVersions = void 0;
const truthy_js_1 = __webpack_require__(3928);
const version_js_1 = __webpack_require__(93648);
const checkMultipleRemotionVersions = () => {
    if (typeof globalThis === 'undefined') {
        return;
    }
    const alreadyImported = globalThis.remotion_imported ||
        (typeof window !== 'undefined' && window.remotion_imported);
    if (alreadyImported) {
        if (alreadyImported === version_js_1.VERSION) {
            // Next.JS will reload the package and cause a server-side warning.
            // It's okay if this happens during SSR in developement
            return;
        }
        throw new TypeError(`🚨 Multiple versions of Remotion detected: ${[
            version_js_1.VERSION,
            typeof alreadyImported === 'string'
                ? alreadyImported
                : 'an older version',
        ]
            .filter(truthy_js_1.truthy)
            .join(' and ')}. This will cause things to break in an unexpected way.\nCheck that all your Remotion packages are on the same version. If your dependencies depend on Remotion, make them peer dependencies. You can also run \`npx remotion versions\` from your terminal to see which versions are mismatching.`);
    }
    globalThis.remotion_imported = version_js_1.VERSION;
    if (typeof window !== 'undefined') {
        window.remotion_imported = version_js_1.VERSION;
    }
};
exports.checkMultipleRemotionVersions = checkMultipleRemotionVersions;


/***/ }),

/***/ 60808:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.NoReactInternals = exports.random = exports.interpolate = void 0;
var interpolate_1 = __webpack_require__(92297);
Object.defineProperty(exports, "interpolate", ({ enumerable: true, get: function () { return interpolate_1.interpolate; } }));
var random_js_1 = __webpack_require__(34264);
Object.defineProperty(exports, "random", ({ enumerable: true, get: function () { return random_js_1.random; } }));
const delay_render_1 = __webpack_require__(22663);
const input_props_serialization_1 = __webpack_require__(89203);
const interpolate_colors_1 = __webpack_require__(4354);
const truthy_1 = __webpack_require__(3928);
const validate_frame_1 = __webpack_require__(3871);
const validate_default_props_1 = __webpack_require__(80607);
const validate_dimensions_1 = __webpack_require__(71162);
const validate_duration_in_frames_1 = __webpack_require__(52363);
const validate_fps_1 = __webpack_require__(5868);
const get_current_time_1 = __webpack_require__(84956);
const offthread_video_source_1 = __webpack_require__(53998);
exports.NoReactInternals = {
    processColor: interpolate_colors_1.processColor,
    truthy: truthy_1.truthy,
    validateFps: validate_fps_1.validateFps,
    validateDimension: validate_dimensions_1.validateDimension,
    validateDurationInFrames: validate_duration_in_frames_1.validateDurationInFrames,
    validateDefaultAndInputProps: validate_default_props_1.validateDefaultAndInputProps,
    validateFrame: validate_frame_1.validateFrame,
    serializeJSONWithDate: input_props_serialization_1.serializeJSONWithDate,
    bundleName: 'bundle.js',
    bundleMapName: 'bundle.js.map',
    deserializeJSONWithCustomFields: input_props_serialization_1.deserializeJSONWithCustomFields,
    DELAY_RENDER_CALLSTACK_TOKEN: delay_render_1.DELAY_RENDER_CALLSTACK_TOKEN,
    DELAY_RENDER_RETRY_TOKEN: delay_render_1.DELAY_RENDER_RETRY_TOKEN,
    DELAY_RENDER_ATTEMPT_TOKEN: delay_render_1.DELAY_RENDER_RETRIES_LEFT,
    getOffthreadVideoSource: offthread_video_source_1.getOffthreadVideoSource,
    getExpectedMediaFrameUncorrected: get_current_time_1.getExpectedMediaFrameUncorrected,
};


/***/ }),

/***/ 98054:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.useNonce = exports.NonceContext = void 0;
const react_1 = __webpack_require__(67294);
exports.NonceContext = (0, react_1.createContext)({
    getNonce: () => 0,
    fastRefreshes: 0,
});
const useNonce = () => {
    const context = (0, react_1.useContext)(exports.NonceContext);
    const [nonce, setNonce] = (0, react_1.useState)(() => context.getNonce());
    const lastContext = (0, react_1.useRef)(context);
    // Only if context changes, but not initially
    (0, react_1.useEffect)(() => {
        if (lastContext.current === context) {
            return;
        }
        lastContext.current = context;
        setNonce(context.getNonce);
    }, [context]);
    return nonce;
};
exports.useNonce = useNonce;


/***/ }),

/***/ 15091:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.playAndHandleNotAllowedError = void 0;
const playAndHandleNotAllowedError = (mediaRef, mediaType) => {
    const { current } = mediaRef;
    if (!current) {
        return;
    }
    const prom = current.play();
    if (prom.catch) {
        prom.catch((err) => {
            if (!current) {
                return;
            }
            // Pause was called after play in Chrome
            if (err.message.includes('request was interrupted by a call to pause')) {
                return;
            }
            // Pause was called after play in Safari
            if (err.message.includes('The operation was aborted.')) {
                return;
            }
            // Pause was called after play in Firefox
            if (err.message.includes('The fetching process for the media resource was aborted by the user agent')) {
                return;
            }
            // Got replaced by a different audio source in Chromium
            if (err.message.includes('request was interrupted by a new load request')) {
                return;
            }
            // Audio tag got unmounted
            if (err.message.includes('because the media was removed from the document')) {
                return;
            }
            // eslint-disable-next-line no-console
            console.log(`Could not play ${mediaType} due to following error: `, err);
            if (!current.muted) {
                // eslint-disable-next-line no-console
                console.log(`The video will be muted and we'll retry playing it.`, err);
                current.muted = true;
                current.play();
            }
        });
    }
};
exports.playAndHandleNotAllowedError = playAndHandleNotAllowedError;


/***/ }),

/***/ 91734:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.portalNode = void 0;
let _portalNode = null;
const portalNode = () => {
    if (!_portalNode) {
        if (typeof document === 'undefined') {
            throw new Error('Tried to call an API that only works in the browser from outside the browser');
        }
        _portalNode = document.createElement('div');
        _portalNode.style.position = 'absolute';
        _portalNode.style.top = '0px';
        _portalNode.style.left = '0px';
        _portalNode.style.right = '0px';
        _portalNode.style.bottom = '0px';
        _portalNode.style.width = '100%';
        _portalNode.style.height = '100%';
        _portalNode.style.display = 'flex';
        _portalNode.style.flexDirection = 'column';
        const containerNode = document.createElement('div');
        containerNode.style.position = 'fixed';
        containerNode.style.top = -999999 + 'px';
        containerNode.appendChild(_portalNode);
        document.body.appendChild(containerNode);
    }
    return _portalNode;
};
exports.portalNode = portalNode;


/***/ }),

/***/ 15819:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PrefetchProvider = exports.setPreloads = exports.PreloadContext = void 0;
const jsx_runtime_1 = __webpack_require__(85893);
const react_1 = __webpack_require__(67294);
exports.PreloadContext = (0, react_1.createContext)({});
let preloads = {};
let updaters = [];
const setPreloads = (updater) => {
    preloads = updater(preloads);
    updaters.forEach((u) => u());
};
exports.setPreloads = setPreloads;
const PrefetchProvider = ({ children }) => {
    const [_preloads, _setPreloads] = (0, react_1.useState)(() => preloads);
    (0, react_1.useEffect)(() => {
        const updaterFunction = () => {
            _setPreloads(preloads);
        };
        updaters.push(updaterFunction);
        return () => {
            updaters = updaters.filter((u) => u !== updaterFunction);
        };
    }, []);
    return ((0, jsx_runtime_1.jsx)(exports.PreloadContext.Provider, { value: _preloads, children: children }));
};
exports.PrefetchProvider = PrefetchProvider;


/***/ }),

/***/ 32595:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.prefetch = exports.usePreload = void 0;
const react_1 = __webpack_require__(67294);
const get_remotion_environment_js_1 = __webpack_require__(48288);
const prefetch_state_js_1 = __webpack_require__(15819);
const usePreload = (src) => {
    var _a;
    const preloads = (0, react_1.useContext)(prefetch_state_js_1.PreloadContext);
    return (_a = preloads[src]) !== null && _a !== void 0 ? _a : src;
};
exports.usePreload = usePreload;
const blobToBase64 = function (blob) {
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
        reader.onload = function () {
            const dataUrl = reader.result;
            resolve(dataUrl);
        };
        reader.onerror = (err) => {
            return reject(err);
        };
        reader.readAsDataURL(blob);
    });
};
const getBlobFromReader = async ({ reader, contentType, contentLength, onProgress, }) => {
    let receivedLength = 0;
    const chunks = [];
    // eslint-disable-next-line no-constant-condition
    while (true) {
        const { done, value } = await reader.read();
        if (done) {
            break;
        }
        chunks.push(value);
        receivedLength += value.length;
        if (onProgress) {
            onProgress({ loadedBytes: receivedLength, totalBytes: contentLength });
        }
    }
    const chunksAll = new Uint8Array(receivedLength);
    let position = 0;
    for (const chunk of chunks) {
        chunksAll.set(chunk, position);
        position += chunk.length;
    }
    return new Blob([chunksAll], {
        type: contentType !== null && contentType !== void 0 ? contentType : undefined,
    });
};
/**
 * @description When you call the preFetch() function, an asset will be fetched and kept in memory so it is ready when you want to play it in a <Player>.
 * @see [Documentation](https://www.remotion.dev/docs/prefetch)
 */
const prefetch = (src, options) => {
    var _a;
    const method = (_a = options === null || options === void 0 ? void 0 : options.method) !== null && _a !== void 0 ? _a : 'blob-url';
    if ((0, get_remotion_environment_js_1.getRemotionEnvironment)().isRendering) {
        return {
            free: () => undefined,
            waitUntilDone: () => Promise.resolve(src),
        };
    }
    let canceled = false;
    let objectUrl = null;
    let resolve = () => undefined;
    let reject = () => undefined;
    const waitUntilDone = new Promise((res, rej) => {
        resolve = res;
        reject = rej;
    });
    const controller = new AbortController();
    let canBeAborted = true;
    fetch(src, {
        signal: controller.signal,
    })
        .then((res) => {
        var _a, _b, _c;
        canBeAborted = false;
        if (canceled) {
            return null;
        }
        if (!res.ok) {
            throw new Error(`HTTP error, status = ${res.status}`);
        }
        const headerContentType = res.headers.get('Content-Type');
        const contentType = (_a = options === null || options === void 0 ? void 0 : options.contentType) !== null && _a !== void 0 ? _a : headerContentType;
        const hasProperContentType = contentType &&
            (contentType.startsWith('video/') ||
                contentType.startsWith('audio/') ||
                contentType.startsWith('image/'));
        if (!hasProperContentType) {
            // eslint-disable-next-line no-console
            console.warn(`Called prefetch() on ${src} which returned a "Content-Type" of ${headerContentType}. Prefetched content should have a proper content type (video/... or audio/...) or a contentType passed the options of prefetch(). Otherwise, prefetching will not work properly in all browsers.`);
        }
        if (!res.body) {
            throw new Error(`HTTP response of ${src} has no body`);
        }
        const reader = res.body.getReader();
        return getBlobFromReader({
            reader,
            contentType: (_c = (_b = options === null || options === void 0 ? void 0 : options.contentType) !== null && _b !== void 0 ? _b : headerContentType) !== null && _c !== void 0 ? _c : null,
            contentLength: res.headers.get('Content-Length')
                ? parseInt(res.headers.get('Content-Length'), 10)
                : null,
            onProgress: options === null || options === void 0 ? void 0 : options.onProgress,
        });
    })
        .then((buf) => {
        if (!buf) {
            return;
        }
        const actualBlob = (options === null || options === void 0 ? void 0 : options.contentType)
            ? new Blob([buf], { type: options.contentType })
            : buf;
        if (method === 'base64') {
            return blobToBase64(actualBlob);
        }
        return URL.createObjectURL(actualBlob);
    })
        .then((url) => {
        if (canceled) {
            return;
        }
        objectUrl = url;
        (0, prefetch_state_js_1.setPreloads)((p) => ({
            ...p,
            [src]: objectUrl,
        }));
        resolve(objectUrl);
    })
        .catch((err) => {
        reject(err);
    });
    return {
        free: () => {
            if (objectUrl) {
                if (method === 'blob-url') {
                    URL.revokeObjectURL(objectUrl);
                }
                (0, prefetch_state_js_1.setPreloads)((p) => {
                    const copy = { ...p };
                    delete copy[src];
                    return copy;
                });
            }
            else {
                canceled = true;
                if (canBeAborted) {
                    try {
                        controller.abort();
                    }
                    catch (e) { }
                }
            }
        },
        waitUntilDone: () => {
            return waitUntilDone;
        },
    };
};
exports.prefetch = prefetch;


/***/ }),

/***/ 34264:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.random = void 0;
/* eslint-disable no-bitwise */
function mulberry32(a) {
    let t = a + 0x6d2b79f5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
function hashCode(str) {
    let i = 0;
    let chr = 0;
    let hash = 0;
    for (i = 0; i < str.length; i++) {
        chr = str.charCodeAt(i);
        hash = (hash << 5) - hash + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
}
/**
 * @description A deterministic pseudo-random number generator. Pass in the same seed and get the same pseudorandom number.
 * @see [Documentation](https://remotion.dev/docs/random)
 */
const random = (seed, dummy) => {
    if (dummy !== undefined) {
        throw new TypeError('random() takes only one argument');
    }
    if (seed === null) {
        return Math.random();
    }
    if (typeof seed === 'string') {
        return mulberry32(hashCode(seed));
    }
    if (typeof seed === 'number') {
        return mulberry32(seed * 10000000000);
    }
    throw new Error('random() argument must be a number or a string');
};
exports.random = random;


/***/ }),

/***/ 74440:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.waitForRoot = exports.getRoot = exports.registerRoot = void 0;
let Root = null;
let listeners = [];
/**
 * @description This function registers the root component of the Remotion project
 * @see [Documentation](https://www.remotion.dev/docs/register-root)
 */
const registerRoot = (comp) => {
    if (!comp) {
        throw new Error(`You must pass a React component to registerRoot(), but ${JSON.stringify(comp)} was passed.`);
    }
    if (Root) {
        throw new Error('registerRoot() was called more than once.');
    }
    Root = comp;
    listeners.forEach((l) => {
        l(comp);
    });
};
exports.registerRoot = registerRoot;
const getRoot = () => {
    return Root;
};
exports.getRoot = getRoot;
const waitForRoot = (fn) => {
    if (Root) {
        fn(Root);
        return () => undefined;
    }
    listeners.push(fn);
    return () => {
        listeners = listeners.filter((l) => l !== fn);
    };
};
exports.waitForRoot = waitForRoot;


/***/ }),

/***/ 28832:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.resolveVideoConfig = void 0;
const validate_default_codec_js_1 = __webpack_require__(54985);
const validate_dimensions_js_1 = __webpack_require__(71162);
const validate_duration_in_frames_js_1 = __webpack_require__(52363);
const validate_fps_js_1 = __webpack_require__(5868);
const validateCalculated = ({ composition, calculated, }) => {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const calculateMetadataErrorLocation = `calculated by calculateMetadata() for the composition "${composition.id}"`;
    const defaultErrorLocation = `of the "<Composition />" component with the id "${composition.id}"`;
    const width = (_b = (_a = calculated === null || calculated === void 0 ? void 0 : calculated.width) !== null && _a !== void 0 ? _a : composition.width) !== null && _b !== void 0 ? _b : undefined;
    (0, validate_dimensions_js_1.validateDimension)(width, 'width', (calculated === null || calculated === void 0 ? void 0 : calculated.width) ? calculateMetadataErrorLocation : defaultErrorLocation);
    const height = (_d = (_c = calculated === null || calculated === void 0 ? void 0 : calculated.height) !== null && _c !== void 0 ? _c : composition.height) !== null && _d !== void 0 ? _d : undefined;
    (0, validate_dimensions_js_1.validateDimension)(height, 'height', (calculated === null || calculated === void 0 ? void 0 : calculated.height) ? calculateMetadataErrorLocation : defaultErrorLocation);
    const fps = (_f = (_e = calculated === null || calculated === void 0 ? void 0 : calculated.fps) !== null && _e !== void 0 ? _e : composition.fps) !== null && _f !== void 0 ? _f : null;
    (0, validate_fps_js_1.validateFps)(fps, (calculated === null || calculated === void 0 ? void 0 : calculated.fps) ? calculateMetadataErrorLocation : defaultErrorLocation, false);
    const durationInFrames = (_h = (_g = calculated === null || calculated === void 0 ? void 0 : calculated.durationInFrames) !== null && _g !== void 0 ? _g : composition.durationInFrames) !== null && _h !== void 0 ? _h : null;
    (0, validate_duration_in_frames_js_1.validateDurationInFrames)(durationInFrames, {
        allowFloats: false,
        component: `of the "<Composition />" component with the id "${composition.id}"`,
    });
    const defaultCodec = calculated === null || calculated === void 0 ? void 0 : calculated.defaultCodec;
    (0, validate_default_codec_js_1.validateDefaultCodec)(defaultCodec, calculateMetadataErrorLocation);
    return { width, height, fps, durationInFrames, defaultCodec };
};
const resolveVideoConfig = ({ composition, editorProps: editorPropsOrUndefined, signal, inputProps, }) => {
    var _a, _b, _c, _d, _e, _f;
    const originalProps = {
        ...((_a = composition.defaultProps) !== null && _a !== void 0 ? _a : {}),
        ...(editorPropsOrUndefined !== null && editorPropsOrUndefined !== void 0 ? editorPropsOrUndefined : {}),
        ...(inputProps !== null && inputProps !== void 0 ? inputProps : {}),
    };
    const calculatedProm = composition.calculateMetadata
        ? composition.calculateMetadata({
            defaultProps: (_b = composition.defaultProps) !== null && _b !== void 0 ? _b : {},
            props: originalProps,
            abortSignal: signal,
            compositionId: composition.id,
        })
        : null;
    if (calculatedProm !== null &&
        typeof calculatedProm === 'object' &&
        'then' in calculatedProm) {
        return calculatedProm.then((c) => {
            var _a, _b;
            const { height, width, durationInFrames, fps, defaultCodec } = validateCalculated({
                calculated: c,
                composition,
            });
            return {
                width,
                height,
                fps,
                durationInFrames,
                id: composition.id,
                defaultProps: (_a = composition.defaultProps) !== null && _a !== void 0 ? _a : {},
                props: (_b = c.props) !== null && _b !== void 0 ? _b : originalProps,
                defaultCodec: defaultCodec !== null && defaultCodec !== void 0 ? defaultCodec : null,
            };
        });
    }
    const data = validateCalculated({
        calculated: calculatedProm,
        composition,
    });
    if (calculatedProm === null) {
        return {
            ...data,
            id: composition.id,
            defaultProps: (_c = composition.defaultProps) !== null && _c !== void 0 ? _c : {},
            props: originalProps,
            defaultCodec: null,
        };
    }
    return {
        ...data,
        id: composition.id,
        defaultProps: (_d = composition.defaultProps) !== null && _d !== void 0 ? _d : {},
        props: (_e = calculatedProm.props) !== null && _e !== void 0 ? _e : originalProps,
        defaultCodec: (_f = calculatedProm.defaultCodec) !== null && _f !== void 0 ? _f : null,
    };
};
exports.resolveVideoConfig = resolveVideoConfig;


/***/ }),

/***/ 67693:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.flattenChildren = void 0;
const react_1 = __importDefault(__webpack_require__(67294));
const flattenChildren = (children) => {
    const childrenArray = react_1.default.Children.toArray(children);
    return childrenArray.reduce((flatChildren, child) => {
        if (child.type === react_1.default.Fragment) {
            return flatChildren.concat((0, exports.flattenChildren)(child.props
                .children));
        }
        flatChildren.push(child);
        return flatChildren;
    }, []);
};
exports.flattenChildren = flattenChildren;


/***/ }),

/***/ 93864:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Series = void 0;
const jsx_runtime_1 = __webpack_require__(85893);
const react_1 = __webpack_require__(67294);
const Sequence_js_1 = __webpack_require__(97080);
const enable_sequence_stack_traces_js_1 = __webpack_require__(12196);
const validate_duration_in_frames_js_1 = __webpack_require__(52363);
const flatten_children_js_1 = __webpack_require__(67693);
const SeriesSequenceRefForwardingFunction = ({ children }, _ref) => {
    // Discard ref
    // eslint-disable-next-line react/jsx-no-useless-fragment
    return (0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: children });
};
const SeriesSequence = (0, react_1.forwardRef)(SeriesSequenceRefForwardingFunction);
/**
 * @description with this component, you can easily stitch together scenes that should play sequentially after another.
 * @see [Documentation](https://www.remotion.dev/docs/series)
 */
const Series = ({ children }) => {
    const childrenValue = (0, react_1.useMemo)(() => {
        let startFrame = 0;
        const flattenedChildren = (0, flatten_children_js_1.flattenChildren)(children);
        return react_1.Children.map(flattenedChildren, (child, i) => {
            var _a;
            const castedChild = child;
            if (typeof castedChild === 'string') {
                // Don't throw if it's just some accidential whitespace
                if (castedChild.trim() === '') {
                    return null;
                }
                throw new TypeError(`The <Series /> component only accepts a list of <Series.Sequence /> components as its children, but you passed a string "${castedChild}"`);
            }
            if (castedChild.type !== SeriesSequence) {
                throw new TypeError(`The <Series /> component only accepts a list of <Series.Sequence /> components as its children, but got ${castedChild} instead`);
            }
            const debugInfo = `index = ${i}, duration = ${castedChild.props.durationInFrames}`;
            if (!(castedChild === null || castedChild === void 0 ? void 0 : castedChild.props.children)) {
                throw new TypeError(`A <Series.Sequence /> component (${debugInfo}) was detected to not have any children. Delete it to fix this error.`);
            }
            const durationInFramesProp = castedChild.props.durationInFrames;
            const { durationInFrames, children: _children, from, name, ...passedProps } = castedChild.props; // `from` is not accepted and must be filtered out if used in JS
            if (i !== flattenedChildren.length - 1 ||
                durationInFramesProp !== Infinity) {
                (0, validate_duration_in_frames_js_1.validateDurationInFrames)(durationInFramesProp, {
                    component: `of a <Series.Sequence /> component`,
                    allowFloats: true,
                });
            }
            const offset = (_a = castedChild.props.offset) !== null && _a !== void 0 ? _a : 0;
            if (Number.isNaN(offset)) {
                throw new TypeError(`The "offset" property of a <Series.Sequence /> must not be NaN, but got NaN (${debugInfo}).`);
            }
            if (!Number.isFinite(offset)) {
                throw new TypeError(`The "offset" property of a <Series.Sequence /> must be finite, but got ${offset} (${debugInfo}).`);
            }
            if (offset % 1 !== 0) {
                throw new TypeError(`The "offset" property of a <Series.Sequence /> must be finite, but got ${offset} (${debugInfo}).`);
            }
            const currentStartFrame = startFrame + offset;
            startFrame += durationInFramesProp + offset;
            return ((0, jsx_runtime_1.jsx)(Sequence_js_1.Sequence, { name: name || '<Series.Sequence>', from: currentStartFrame, durationInFrames: durationInFramesProp, ...passedProps, ref: castedChild.ref, children: child }));
        });
    }, [children]);
    /* eslint-disable react/jsx-no-useless-fragment */
    return (0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: childrenValue });
};
exports.Series = Series;
Series.Sequence = SeriesSequence;
(0, enable_sequence_stack_traces_js_1.addSequenceStackTraces)(SeriesSequence);


/***/ }),

/***/ 28498:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.setupEnvVariables = void 0;
const get_remotion_environment_js_1 = __webpack_require__(48288);
// https://github.com/remotion-dev/remotion/issues/3412#issuecomment-1910120552
// eslint-disable-next-line no-useless-concat
function getEnvVar() {
    const parts = ['proc', 'ess', '.', 'en', 'v', '.', 'NOD', 'E_EN', 'V'];
    return parts.join('');
}
const getEnvVariables = () => {
    if ((0, get_remotion_environment_js_1.getRemotionEnvironment)().isRendering) {
        const param = window.remotion_envVariables;
        if (!param) {
            return {};
        }
        return { ...JSON.parse(param), NODE_ENV: "production" };
    }
    // For the Studio, we already set the environment variables in index-html.ts.
    // We just add NODE_ENV here.
    if (false) {}
    return {
        NODE_ENV: "production",
    };
};
const setupEnvVariables = () => {
    const env = getEnvVariables();
    if (!window.process) {
        window.process = {};
    }
    if (!window.process.env) {
        window.process.env = {};
    }
    Object.keys(env).forEach((key) => {
        window.process.env[key] = env[key];
    });
};
exports.setupEnvVariables = setupEnvVariables;


/***/ }),

/***/ 37636:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.measureSpring = exports.spring = void 0;
const validate_frame_js_1 = __webpack_require__(3871);
const validate_fps_js_1 = __webpack_require__(5868);
const validation_spring_duration_js_1 = __webpack_require__(91569);
const measure_spring_js_1 = __webpack_require__(18897);
const spring_utils_js_1 = __webpack_require__(60961);
/**
 * @description Calculates a position based on physical parameters, start and end value, and time.
 * @see [Documentation](https://www.remotion.dev/docs/spring)
 * @param {number} frame The current time value. Most of the time you want to pass in the return value of useCurrentFrame.
 * @param {number} fps The framerate at which the animation runs. Pass in the value obtained by `useVideoConfig()`.
 * @param {?boolean} reverse Whether the animation plays in reverse or not. Default `false`.
 * @param {?Object} config optional object that allows you to customize the physical properties of the animation.
 * @param {number} [config.mass=1] The weight of the spring. If you reduce the mass, the animation becomes faster!
 * @param {number} [config.damping=10] How hard the animation decelerates.
 * @param {number} [config.stiffness=100] Affects bounciness of the animation.
 * @param {boolean} [config.overshootClamping=false] Whether to prevent the animation going beyond the target value.
 * @param {?number} [config.from] The initial value of the animation. Default `0`
 * @param {?number} [config.to] The end value of the animation. Default `1`
 * @param {?number} [config.durationInFrames] Stretch the duration of an animation to  a set value.. Default `undefined`
 * @param {?number} [config.durationThreshold] How close to the end the animation is considered to be done. Default `0.005`
 * @param {?number} [config.delay] Delay the animation for this amount of frames. Default `0`
 */
function spring({ frame: passedFrame, fps, config = {}, from = 0, to = 1, durationInFrames: passedDurationInFrames, durationRestThreshold, delay = 0, reverse = false, }) {
    (0, validation_spring_duration_js_1.validateSpringDuration)(passedDurationInFrames);
    (0, validate_frame_js_1.validateFrame)({
        frame: passedFrame,
        durationInFrames: Infinity,
        allowFloats: true,
    });
    (0, validate_fps_js_1.validateFps)(fps, 'to spring()', false);
    const needsToCalculateNaturalDuration = reverse || typeof passedDurationInFrames !== 'undefined';
    const naturalDuration = needsToCalculateNaturalDuration
        ? (0, measure_spring_js_1.measureSpring)({
            fps,
            config,
            from,
            to,
            threshold: durationRestThreshold,
        })
        : undefined;
    const naturalDurationGetter = needsToCalculateNaturalDuration
        ? {
            get: () => naturalDuration,
        }
        : {
            get: () => {
                throw new Error('did not calculate natural duration, this is an error with Remotion. Please report');
            },
        };
    const reverseProcessed = reverse
        ? (passedDurationInFrames !== null && passedDurationInFrames !== void 0 ? passedDurationInFrames : naturalDurationGetter.get()) - passedFrame
        : passedFrame;
    const delayProcessed = reverseProcessed + (reverse ? delay : -delay);
    const durationProcessed = passedDurationInFrames === undefined
        ? delayProcessed
        : delayProcessed / (passedDurationInFrames / naturalDurationGetter.get());
    if (passedDurationInFrames && delayProcessed > passedDurationInFrames) {
        return to;
    }
    const spr = (0, spring_utils_js_1.springCalculation)({
        fps,
        frame: durationProcessed,
        config,
        from,
        to,
    });
    if (!config.overshootClamping) {
        return spr.current;
    }
    if (to >= from) {
        return Math.min(spr.current, to);
    }
    return Math.max(spr.current, to);
}
exports.spring = spring;
var measure_spring_js_2 = __webpack_require__(18897);
Object.defineProperty(exports, "measureSpring", ({ enumerable: true, get: function () { return measure_spring_js_2.measureSpring; } }));


/***/ }),

/***/ 18897:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.measureSpring = void 0;
const validate_fps_js_1 = __webpack_require__(5868);
const spring_utils_js_1 = __webpack_require__(60961);
const cache = new Map();
/**
 * @description The function returns how long it takes for a spring animation to settle
 * @see [Documentation](https://www.remotion.dev/docs/measure-spring)
 */
function measureSpring({ fps, config = {}, threshold = 0.005, from = 0, to = 1, }) {
    if (typeof threshold !== 'number') {
        throw new TypeError(`threshold must be a number, got ${threshold} of type ${typeof threshold}`);
    }
    if (threshold === 0) {
        return Infinity;
    }
    if (threshold === 1) {
        return 0;
    }
    if (isNaN(threshold)) {
        throw new TypeError('Threshold is NaN');
    }
    if (!Number.isFinite(threshold)) {
        throw new TypeError('Threshold is not finite');
    }
    if (threshold < 0) {
        throw new TypeError('Threshold is below 0');
    }
    const cacheKey = [
        fps,
        config.damping,
        config.mass,
        config.overshootClamping,
        config.stiffness,
        from,
        to,
        threshold,
    ].join('-');
    if (cache.has(cacheKey)) {
        return cache.get(cacheKey);
    }
    (0, validate_fps_js_1.validateFps)(fps, 'to the measureSpring() function', false);
    const range = Math.abs(from - to);
    let frame = 0;
    let finishedFrame = 0;
    const calc = () => {
        return (0, spring_utils_js_1.springCalculation)({
            fps,
            frame,
            config,
            from,
            to,
        });
    };
    let animation = calc();
    const calcDifference = () => {
        return (Math.abs(animation.current - animation.toValue) /
            (range === 0 ? 1 : range));
    };
    let difference = calcDifference();
    while (difference >= threshold) {
        frame++;
        animation = calc();
        difference = calcDifference();
    }
    // Since spring is bouncy, just because it's under the threshold we
    // cannot be sure it's done. We need to animate further until it stays in the
    // threshold for, say, 20 frames.
    finishedFrame = frame;
    for (let i = 0; i < 20; i++) {
        frame++;
        animation = calc();
        difference = calcDifference();
        if (difference >= threshold) {
            i = 0;
            finishedFrame = frame + 1;
        }
    }
    cache.set(cacheKey, finishedFrame);
    return finishedFrame;
}
exports.measureSpring = measureSpring;


/***/ }),

/***/ 60961:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.springCalculation = void 0;
const defaultSpringConfig = {
    damping: 10,
    mass: 1,
    stiffness: 100,
    overshootClamping: false,
};
const advanceCache = {};
function advance({ animation, now, config, }) {
    const { toValue, lastTimestamp, current, velocity } = animation;
    const deltaTime = Math.min(now - lastTimestamp, 64);
    const c = config.damping;
    const m = config.mass;
    const k = config.stiffness;
    const cacheKey = [
        toValue,
        lastTimestamp,
        current,
        velocity,
        c,
        m,
        k,
        now,
    ].join('-');
    if (advanceCache[cacheKey]) {
        return advanceCache[cacheKey];
    }
    const v0 = -velocity;
    const x0 = toValue - current;
    const zeta = c / (2 * Math.sqrt(k * m)); // damping ratio
    const omega0 = Math.sqrt(k / m); // undamped angular frequency of the oscillator (rad/ms)
    const omega1 = omega0 * Math.sqrt(1 - zeta ** 2); // exponential decay
    const t = deltaTime / 1000;
    const sin1 = Math.sin(omega1 * t);
    const cos1 = Math.cos(omega1 * t);
    // under damped
    const underDampedEnvelope = Math.exp(-zeta * omega0 * t);
    const underDampedFrag1 = underDampedEnvelope *
        (sin1 * ((v0 + zeta * omega0 * x0) / omega1) + x0 * cos1);
    const underDampedPosition = toValue - underDampedFrag1;
    // This looks crazy -- it's actually just the derivative of the oscillation function
    const underDampedVelocity = zeta * omega0 * underDampedFrag1 -
        underDampedEnvelope *
            (cos1 * (v0 + zeta * omega0 * x0) - omega1 * x0 * sin1);
    // critically damped
    const criticallyDampedEnvelope = Math.exp(-omega0 * t);
    const criticallyDampedPosition = toValue - criticallyDampedEnvelope * (x0 + (v0 + omega0 * x0) * t);
    const criticallyDampedVelocity = criticallyDampedEnvelope *
        (v0 * (t * omega0 - 1) + t * x0 * omega0 * omega0);
    const animationNode = {
        toValue,
        prevPosition: current,
        lastTimestamp: now,
        current: zeta < 1 ? underDampedPosition : criticallyDampedPosition,
        velocity: zeta < 1 ? underDampedVelocity : criticallyDampedVelocity,
    };
    advanceCache[cacheKey] = animationNode;
    return animationNode;
}
const calculationCache = {};
function springCalculation({ from = 0, to = 1, frame, fps, config = {}, }) {
    const cacheKey = [
        from,
        to,
        frame,
        fps,
        config.damping,
        config.mass,
        config.overshootClamping,
        config.stiffness,
    ].join('-');
    if (calculationCache[cacheKey]) {
        return calculationCache[cacheKey];
    }
    let animation = {
        lastTimestamp: 0,
        current: from,
        toValue: to,
        velocity: 0,
        prevPosition: 0,
    };
    const frameClamped = Math.max(0, frame);
    const unevenRest = frameClamped % 1;
    for (let f = 0; f <= Math.floor(frameClamped); f++) {
        if (f === Math.floor(frameClamped)) {
            f += unevenRest;
        }
        const time = (f / fps) * 1000;
        animation = advance({
            animation,
            now: time,
            config: {
                ...defaultSpringConfig,
                ...config,
            },
        });
    }
    calculationCache[cacheKey] = animation;
    return animation;
}
exports.springCalculation = springCalculation;


/***/ }),

/***/ 96840:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.staticFile = exports.includesHexOfUnsafeChar = void 0;
const problematicCharacters = {
    '%3A': ':',
    '%2F': '/',
    '%3F': '?',
    '%23': '#',
    '%5B': '[',
    '%5D': ']',
    '%40': '@',
    '%21': '!',
    '%24': '$',
    '%26': '&',
    '%27': "'",
    '%28': '(',
    '%29': ')',
    '%2A': '*',
    '%2B': '+',
    '%2C': ',',
    '%3B': ';',
};
const didWarn = {};
const warnOnce = (message) => {
    if (didWarn[message]) {
        return;
    }
    // eslint-disable-next-line no-console
    console.warn(message);
    didWarn[message] = true;
};
const includesHexOfUnsafeChar = (path) => {
    for (const key of Object.keys(problematicCharacters)) {
        if (path.includes(key)) {
            return { containsHex: true, hexCode: key };
        }
    }
    return { containsHex: false };
};
exports.includesHexOfUnsafeChar = includesHexOfUnsafeChar;
const trimLeadingSlash = (path) => {
    if (path.startsWith('/')) {
        return trimLeadingSlash(path.substring(1));
    }
    return path;
};
const inner = (path) => {
    if (typeof window !== 'undefined' && window.remotion_staticBase) {
        if (path.startsWith(window.remotion_staticBase)) {
            throw new Error(`The value "${path}" is already prefixed with the static base ${window.remotion_staticBase}. You don't need to call staticFile() on it.`);
        }
        return `${window.remotion_staticBase}/${trimLeadingSlash(path)}`;
    }
    return `/${trimLeadingSlash(path)}`;
};
const encodeBySplitting = (path) => {
    const splitBySlash = path.split('/');
    const encodedArray = splitBySlash.map((element) => {
        return encodeURIComponent(element);
    });
    const merged = encodedArray.join('/');
    return merged;
};
/**
 * @description Reference a file from the public/ folder. If the file does not appear in the autocomplete, type the path manually.
 * @see [Documentation](https://www.remotion.dev/docs/staticfile)
 */
const staticFile = (path) => {
    if (path.startsWith('http://') || path.startsWith('https://')) {
        throw new TypeError(`staticFile() does not support remote URLs - got "${path}". Instead, pass the URL without wrapping it in staticFile(). See: https://remotion.dev/docs/staticfile-remote-urls`);
    }
    if (path.startsWith('..') || path.startsWith('./')) {
        throw new TypeError(`staticFile() does not support relative paths - got "${path}". Instead, pass the name of a file that is inside the public/ folder. See: https://remotion.dev/docs/staticfile-relative-paths`);
    }
    if (path.startsWith('/Users') ||
        path.startsWith('/home') ||
        path.startsWith('/tmp') ||
        path.startsWith('/etc') ||
        path.startsWith('/opt') ||
        path.startsWith('/var') ||
        path.startsWith('C:') ||
        path.startsWith('D:') ||
        path.startsWith('E:')) {
        throw new TypeError(`staticFile() does not support absolute paths - got "${path}". Instead, pass the name of a file that is inside the public/ folder. See: https://remotion.dev/docs/staticfile-relative-paths`);
    }
    if (path.startsWith('public/')) {
        throw new TypeError(`Do not include the public/ prefix when using staticFile() - got "${path}". See: https://remotion.dev/docs/staticfile-relative-paths`);
    }
    const includesHex = (0, exports.includesHexOfUnsafeChar)(path);
    if (includesHex.containsHex) {
        warnOnce(`WARNING: You seem to pass an already encoded path (path contains ${includesHex.hexCode}). Since Remotion 4.0, the encoding is done by staticFile() itself. You may want to remove a encodeURIComponent() wrapping.`);
    }
    const preprocessed = encodeBySplitting(path);
    const preparsed = inner(preprocessed);
    if (!preparsed.startsWith('/')) {
        return `/${preparsed}`;
    }
    return preparsed;
};
exports.staticFile = staticFile;


/***/ }),

/***/ 47083:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.usePlayingState = exports.useTimelineSetFrame = exports.useTimelinePosition = exports.getFrameForComposition = exports.getInitialFrameState = exports.persistCurrentFrame = exports.SetTimelineContext = exports.TimelineContext = void 0;
const react_1 = __webpack_require__(67294);
const use_video_js_1 = __webpack_require__(3141);
exports.TimelineContext = (0, react_1.createContext)({
    frame: {},
    playing: false,
    playbackRate: 1,
    rootId: '',
    imperativePlaying: {
        current: false,
    },
    setPlaybackRate: () => {
        throw new Error('default');
    },
    audioAndVideoTags: { current: [] },
});
exports.SetTimelineContext = (0, react_1.createContext)({
    setFrame: () => {
        throw new Error('default');
    },
    setPlaying: () => {
        throw new Error('default');
    },
});
const makeKey = () => {
    return `remotion.time-all`;
};
const persistCurrentFrame = (time) => {
    localStorage.setItem(makeKey(), JSON.stringify(time));
};
exports.persistCurrentFrame = persistCurrentFrame;
const getInitialFrameState = () => {
    var _a;
    const item = (_a = localStorage.getItem(makeKey())) !== null && _a !== void 0 ? _a : '{}';
    const obj = JSON.parse(item);
    return obj;
};
exports.getInitialFrameState = getInitialFrameState;
const getFrameForComposition = (composition) => {
    var _a, _b, _c;
    const item = (_a = localStorage.getItem(makeKey())) !== null && _a !== void 0 ? _a : '{}';
    const obj = JSON.parse(item);
    return obj[composition]
        ? Number(obj[composition])
        : (_c = (typeof window === 'undefined' ? 0 : (_b = window.remotion_initialFrame) !== null && _b !== void 0 ? _b : 0)) !== null && _c !== void 0 ? _c : 0;
};
exports.getFrameForComposition = getFrameForComposition;
const useTimelinePosition = () => {
    var _a, _b;
    const videoConfig = (0, use_video_js_1.useVideo)();
    const state = (0, react_1.useContext)(exports.TimelineContext);
    if (!videoConfig) {
        return typeof window === 'undefined'
            ? 0
            : (_a = window.remotion_initialFrame) !== null && _a !== void 0 ? _a : 0;
    }
    const unclamped = (_b = state.frame[videoConfig.id]) !== null && _b !== void 0 ? _b : (typeof window !== 'undefined' && window.remotion_isPlayer
        ? 0
        : (0, exports.getFrameForComposition)(videoConfig.id));
    return Math.min(videoConfig.durationInFrames - 1, unclamped);
};
exports.useTimelinePosition = useTimelinePosition;
const useTimelineSetFrame = () => {
    const { setFrame } = (0, react_1.useContext)(exports.SetTimelineContext);
    return setFrame;
};
exports.useTimelineSetFrame = useTimelineSetFrame;
const usePlayingState = () => {
    const { playing, imperativePlaying } = (0, react_1.useContext)(exports.TimelineContext);
    const { setPlaying } = (0, react_1.useContext)(exports.SetTimelineContext);
    return (0, react_1.useMemo)(() => [playing, setPlaying, imperativePlaying], [imperativePlaying, playing, setPlaying]);
};
exports.usePlayingState = usePlayingState;


/***/ }),

/***/ 3928:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.truthy = void 0;
function truthy(value) {
    return Boolean(value);
}
exports.truthy = truthy;


/***/ }),

/***/ 89075:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.useBufferState = void 0;
const react_1 = __webpack_require__(67294);
const buffering_1 = __webpack_require__(45775);
const useBufferState = () => {
    const buffer = (0, react_1.useContext)(buffering_1.BufferingContextReact);
    return (0, react_1.useMemo)(() => ({
        delayPlayback: () => {
            if (!buffer) {
                throw new Error('Tried to enable the buffering state, but a Remotion context was not found. This API can only be called in a component that was passed to the Remotion Player or a <Composition>. Or you might have experienced a version mismatch - run `npx remotion versions` and ensure all packages have the same version. This error is thrown by the buffer state https://remotion.dev/docs/player/buffer-state');
            }
            const { unblock } = buffer.addBlock({
                id: String(Math.random()),
            });
            return { unblock };
        },
    }), [buffer]);
};
exports.useBufferState = useBufferState;


/***/ }),

/***/ 39727:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.useCurrentFrame = void 0;
const react_1 = __webpack_require__(67294);
const CanUseRemotionHooks_js_1 = __webpack_require__(44144);
const SequenceContext_js_1 = __webpack_require__(73759);
const timeline_position_state_js_1 = __webpack_require__(47083);
/**
 * @description Get the current frame of the video. Frames are 0-indexed, meaning the first frame is 0, the last frame is the duration of the composition in frames minus one.
 * @see [Documentation](https://remotion.dev/docs/use-current-frame)
 */
const useCurrentFrame = () => {
    const canUseRemotionHooks = (0, react_1.useContext)(CanUseRemotionHooks_js_1.CanUseRemotionHooks);
    if (!canUseRemotionHooks) {
        if (typeof window !== 'undefined' && window.remotion_isPlayer) {
            throw new Error(`useCurrentFrame can only be called inside a component that was passed to <Player>. See: https://www.remotion.dev/docs/player/examples`);
        }
        throw new Error(`useCurrentFrame() can only be called inside a component that was registered as a composition. See https://www.remotion.dev/docs/the-fundamentals#defining-compositions`);
    }
    const frame = (0, timeline_position_state_js_1.useTimelinePosition)();
    const context = (0, react_1.useContext)(SequenceContext_js_1.SequenceContext);
    const contextOffset = context
        ? context.cumulatedFrom + context.relativeFrom
        : 0;
    return frame - contextOffset;
};
exports.useCurrentFrame = useCurrentFrame;


/***/ }),

/***/ 99267:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.useCurrentScale = exports.calculateScale = exports.PreviewSizeContext = exports.CurrentScaleContext = void 0;
const react_1 = __importStar(__webpack_require__(67294));
const get_remotion_environment_1 = __webpack_require__(48288);
const use_unsafe_video_config_1 = __webpack_require__(53095);
exports.CurrentScaleContext = react_1.default.createContext(null);
exports.PreviewSizeContext = (0, react_1.createContext)({
    setSize: () => undefined,
    size: { size: 'auto', translation: { x: 0, y: 0 } },
});
const calculateScale = ({ canvasSize, compositionHeight, compositionWidth, previewSize, }) => {
    const heightRatio = canvasSize.height / compositionHeight;
    const widthRatio = canvasSize.width / compositionWidth;
    const ratio = Math.min(heightRatio, widthRatio);
    return previewSize === 'auto' ? ratio : Number(previewSize);
};
exports.calculateScale = calculateScale;
/**
 * Gets the current scale of the container in which the component is being rendered.
 * Only works in the Remotion Studio and in the Remotion Player.
 */
const useCurrentScale = (options) => {
    const hasContext = react_1.default.useContext(exports.CurrentScaleContext);
    const zoomContext = react_1.default.useContext(exports.PreviewSizeContext);
    const config = (0, use_unsafe_video_config_1.useUnsafeVideoConfig)();
    if (hasContext === null || config === null || zoomContext === null) {
        if (options === null || options === void 0 ? void 0 : options.dontThrowIfOutsideOfRemotion) {
            return 1;
        }
        if ((0, get_remotion_environment_1.getRemotionEnvironment)().isRendering) {
            return 1;
        }
        throw new Error([
            'useCurrentScale() was called outside of a Remotion context.',
            'This hook can only be called in a component that is being rendered by Remotion.',
            'If you want to this hook to return 1 outside of Remotion, pass {dontThrowIfOutsideOfRemotion: true} as an option.',
            'If you think you called this hook in a Remotion component, make sure all versions of Remotion are aligned.',
        ].join('\n'));
    }
    if (hasContext.type === 'scale') {
        return hasContext.scale;
    }
    return (0, exports.calculateScale)({
        canvasSize: hasContext.canvasSize,
        compositionHeight: config.height,
        compositionWidth: config.width,
        previewSize: zoomContext.size.size,
    });
};
exports.useCurrentScale = useCurrentScale;


/***/ }),

/***/ 44858:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.useLazyComponent = void 0;
const react_1 = __importStar(__webpack_require__(67294));
// Expected, it can be any component props
const useLazyComponent = (compProps) => {
    const lazy = (0, react_1.useMemo)(() => {
        if ('lazyComponent' in compProps) {
            return react_1.default.lazy(compProps.lazyComponent);
        }
        if ('component' in compProps) {
            // In SSR, suspense is not yet supported, we cannot use React.lazy
            if (typeof document === 'undefined') {
                return compProps.component;
            }
            return react_1.default.lazy(() => Promise.resolve({ default: compProps.component }));
        }
        throw new Error("You must pass either 'component' or 'lazyComponent'");
        // Very important to leave the dependencies as they are, or instead
        // the player will remount on every frame.
        // @ts-expect-error
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [compProps.component, compProps.lazyComponent]);
    return lazy;
};
exports.useLazyComponent = useLazyComponent;


/***/ }),

/***/ 16801:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.useMediaBuffering = void 0;
const react_1 = __webpack_require__(67294);
const use_buffer_state_1 = __webpack_require__(89075);
const useMediaBuffering = ({ element, shouldBuffer, isPremounting, }) => {
    const buffer = (0, use_buffer_state_1.useBufferState)();
    (0, react_1.useEffect)(() => {
        let cleanup = () => undefined;
        const { current } = element;
        if (!current) {
            return;
        }
        if (!shouldBuffer) {
            return;
        }
        if (isPremounting) {
            return;
        }
        const onWaiting = () => {
            const { unblock } = buffer.delayPlayback();
            const onCanPlay = () => {
                unblock();
            };
            const onError = () => {
                unblock();
            };
            current.addEventListener('canplay', onCanPlay, {
                once: true,
            });
            current.addEventListener('error', onError, {
                once: true,
            });
            cleanup = () => {
                current.removeEventListener('canplay', onCanPlay);
                current.removeEventListener('error', onError);
                unblock();
                return undefined;
            };
        };
        if (current.readyState < current.HAVE_FUTURE_DATA) {
            onWaiting();
        }
        else {
            current.addEventListener('waiting', onWaiting);
        }
        return () => {
            cleanup();
        };
    }, [buffer, element, isPremounting, shouldBuffer]);
};
exports.useMediaBuffering = useMediaBuffering;


/***/ }),

/***/ 17476:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.useMediaInTimeline = void 0;
const react_1 = __webpack_require__(67294);
const SequenceContext_js_1 = __webpack_require__(73759);
const SequenceManager_js_1 = __webpack_require__(80829);
const use_audio_frame_js_1 = __webpack_require__(66873);
const get_asset_file_name_js_1 = __webpack_require__(76644);
const get_remotion_environment_js_1 = __webpack_require__(48288);
const nonce_js_1 = __webpack_require__(98054);
const play_and_handle_not_allowed_error_js_1 = __webpack_require__(15091);
const timeline_position_state_js_1 = __webpack_require__(47083);
const use_video_config_js_1 = __webpack_require__(73347);
const volume_prop_js_1 = __webpack_require__(39022);
const didWarn = {};
const warnOnce = (message) => {
    if (didWarn[message]) {
        return;
    }
    // eslint-disable-next-line no-console
    console.warn(message);
    didWarn[message] = true;
};
const useMediaInTimeline = ({ volume, mediaVolume, mediaRef, src, mediaType, playbackRate, displayName, id, stack, showInTimeline, premountDisplay, }) => {
    const videoConfig = (0, use_video_config_js_1.useVideoConfig)();
    const { rootId, audioAndVideoTags } = (0, react_1.useContext)(timeline_position_state_js_1.TimelineContext);
    const parentSequence = (0, react_1.useContext)(SequenceContext_js_1.SequenceContext);
    const actualFrom = parentSequence
        ? parentSequence.relativeFrom + parentSequence.cumulatedFrom
        : 0;
    const [playing] = (0, timeline_position_state_js_1.usePlayingState)();
    const startsAt = (0, use_audio_frame_js_1.useMediaStartsAt)();
    const { registerSequence, unregisterSequence } = (0, react_1.useContext)(SequenceManager_js_1.SequenceManager);
    const [initialVolume] = (0, react_1.useState)(() => volume);
    const nonce = (0, nonce_js_1.useNonce)();
    const duration = parentSequence
        ? Math.min(parentSequence.durationInFrames, videoConfig.durationInFrames)
        : videoConfig.durationInFrames;
    const doesVolumeChange = typeof volume === 'function';
    const volumes = (0, react_1.useMemo)(() => {
        if (typeof volume === 'number') {
            return volume;
        }
        return new Array(Math.floor(Math.max(0, duration + startsAt)))
            .fill(true)
            .map((_, i) => {
            return (0, volume_prop_js_1.evaluateVolume)({
                frame: i + startsAt,
                volume,
                mediaVolume,
                allowAmplificationDuringRender: false,
            });
        })
            .join(',');
    }, [duration, startsAt, volume, mediaVolume]);
    (0, react_1.useEffect)(() => {
        if (typeof volume === 'number' && volume !== initialVolume) {
            warnOnce(`Remotion: The ${mediaType} with src ${src} has changed it's volume. Prefer the callback syntax for setting volume to get better timeline display: https://www.remotion.dev/docs/using-audio/#controlling-volume`);
        }
    }, [initialVolume, mediaType, src, volume]);
    (0, react_1.useEffect)(() => {
        var _a;
        if (!mediaRef.current) {
            return;
        }
        if (!src) {
            throw new Error('No src passed');
        }
        if (!(0, get_remotion_environment_js_1.getRemotionEnvironment)().isStudio && "production" !== 'test') {
            return;
        }
        if (!showInTimeline) {
            return;
        }
        registerSequence({
            type: mediaType,
            src,
            id,
            duration,
            from: 0,
            parent: (_a = parentSequence === null || parentSequence === void 0 ? void 0 : parentSequence.id) !== null && _a !== void 0 ? _a : null,
            displayName: displayName !== null && displayName !== void 0 ? displayName : (0, get_asset_file_name_js_1.getAssetDisplayName)(src),
            rootId,
            volume: volumes,
            showInTimeline: true,
            nonce,
            startMediaFrom: 0 - startsAt,
            doesVolumeChange,
            loopDisplay: undefined,
            playbackRate,
            stack,
            premountDisplay,
        });
        return () => {
            unregisterSequence(id);
        };
    }, [
        actualFrom,
        duration,
        id,
        parentSequence,
        src,
        registerSequence,
        rootId,
        unregisterSequence,
        videoConfig,
        volumes,
        doesVolumeChange,
        nonce,
        mediaRef,
        mediaType,
        startsAt,
        playbackRate,
        displayName,
        stack,
        showInTimeline,
        premountDisplay,
    ]);
    (0, react_1.useEffect)(() => {
        const tag = {
            id,
            play: () => {
                if (!playing) {
                    // Don't play if for example in a <Freeze> state.
                    return;
                }
                return (0, play_and_handle_not_allowed_error_js_1.playAndHandleNotAllowedError)(mediaRef, mediaType);
            },
        };
        audioAndVideoTags.current.push(tag);
        return () => {
            audioAndVideoTags.current = audioAndVideoTags.current.filter((a) => a.id !== id);
        };
    }, [audioAndVideoTags, id, mediaRef, mediaType, playing]);
};
exports.useMediaInTimeline = useMediaInTimeline;


/***/ }),

/***/ 95069:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.useMediaPlayback = exports.DEFAULT_ACCEPTABLE_TIMESHIFT = void 0;
const react_1 = __webpack_require__(67294);
const use_audio_frame_js_1 = __webpack_require__(66873);
const buffering_js_1 = __webpack_require__(45775);
const play_and_handle_not_allowed_error_js_1 = __webpack_require__(15091);
const timeline_position_state_js_1 = __webpack_require__(47083);
const use_current_frame_js_1 = __webpack_require__(39727);
const use_video_config_js_1 = __webpack_require__(73347);
const get_current_time_js_1 = __webpack_require__(84956);
const video_fragment_js_1 = __webpack_require__(51527);
const warn_about_non_seekable_media_js_1 = __webpack_require__(72187);
exports.DEFAULT_ACCEPTABLE_TIMESHIFT = 0.45;
const seek = (mediaRef, time) => {
    if (!mediaRef.current) {
        return;
    }
    // iOS seeking does not support multiple decimals
    if ((0, video_fragment_js_1.isIosSafari)()) {
        mediaRef.current.currentTime = Number(time.toFixed(1));
        return;
    }
    mediaRef.current.currentTime = time;
};
const useMediaPlayback = ({ mediaRef, src, mediaType, playbackRate: localPlaybackRate, onlyWarnForMediaSeekingError, acceptableTimeshift, }) => {
    const { playbackRate: globalPlaybackRate } = (0, react_1.useContext)(timeline_position_state_js_1.TimelineContext);
    const frame = (0, use_current_frame_js_1.useCurrentFrame)();
    const absoluteFrame = (0, timeline_position_state_js_1.useTimelinePosition)();
    const [playing] = (0, timeline_position_state_js_1.usePlayingState)();
    const buffering = (0, react_1.useContext)(buffering_js_1.BufferingContextReact);
    const { fps } = (0, use_video_config_js_1.useVideoConfig)();
    const mediaStartsAt = (0, use_audio_frame_js_1.useMediaStartsAt)();
    const playbackRate = localPlaybackRate * globalPlaybackRate;
    // For short audio, a lower acceptable time shift is used
    const acceptableTimeShiftButLessThanDuration = (() => {
        var _a;
        if ((_a = mediaRef.current) === null || _a === void 0 ? void 0 : _a.duration) {
            return Math.min(mediaRef.current.duration, acceptableTimeshift !== null && acceptableTimeshift !== void 0 ? acceptableTimeshift : exports.DEFAULT_ACCEPTABLE_TIMESHIFT);
        }
        return acceptableTimeshift;
    })();
    const pausedOrBuffering = !playing || (buffering && buffering.buffering.current);
    (0, react_1.useEffect)(() => {
        var _a;
        if (pausedOrBuffering) {
            (_a = mediaRef.current) === null || _a === void 0 ? void 0 : _a.pause();
        }
    }, [mediaRef, mediaType, pausedOrBuffering]);
    (0, react_1.useEffect)(() => {
        const tagName = mediaType === 'audio' ? '<Audio>' : '<Video>';
        if (!mediaRef.current) {
            throw new Error(`No ${mediaType} ref found`);
        }
        if (!src) {
            throw new Error(`No 'src' attribute was passed to the ${tagName} element.`);
        }
        const playbackRateToSet = Math.max(0, playbackRate);
        if (mediaRef.current.playbackRate !== playbackRateToSet) {
            mediaRef.current.playbackRate = playbackRateToSet;
        }
        const desiredUnclampedTime = (0, get_current_time_js_1.getMediaTime)({
            frame,
            playbackRate: localPlaybackRate,
            startFrom: -mediaStartsAt,
            fps,
        });
        const { duration } = mediaRef.current;
        const shouldBeTime = !Number.isNaN(duration) && Number.isFinite(duration)
            ? Math.min(duration, desiredUnclampedTime)
            : desiredUnclampedTime;
        const isTime = mediaRef.current.currentTime;
        const timeShift = Math.abs(shouldBeTime - isTime);
        if (timeShift > acceptableTimeShiftButLessThanDuration) {
            // If scrubbing around, adjust timing
            // or if time shift is bigger than 0.45sec
            seek(mediaRef, shouldBeTime);
            if (!onlyWarnForMediaSeekingError) {
                (0, warn_about_non_seekable_media_js_1.warnAboutNonSeekableMedia)(mediaRef.current, onlyWarnForMediaSeekingError ? 'console-warning' : 'console-error');
            }
            return;
        }
        // Only perform a seek if the time is not already the same.
        // Chrome rounds to 6 digits, so 0.033333333 -> 0.033333,
        // therefore a threshold is allowed.
        // Refer to the https://github.com/remotion-dev/video-buffering-example
        // which is fixed by only seeking conditionally.
        const makesSenseToSeek = Math.abs(mediaRef.current.currentTime - shouldBeTime) > 0.00001;
        if (pausedOrBuffering || absoluteFrame === 0) {
            if (makesSenseToSeek) {
                seek(mediaRef, shouldBeTime);
            }
        }
        if (mediaRef.current.paused &&
            !mediaRef.current.ended &&
            !pausedOrBuffering) {
            if (makesSenseToSeek) {
                seek(mediaRef, shouldBeTime);
            }
            (0, play_and_handle_not_allowed_error_js_1.playAndHandleNotAllowedError)(mediaRef, mediaType);
        }
    }, [
        absoluteFrame,
        fps,
        playbackRate,
        frame,
        mediaRef,
        mediaType,
        src,
        mediaStartsAt,
        localPlaybackRate,
        onlyWarnForMediaSeekingError,
        acceptableTimeshift,
        acceptableTimeShiftButLessThanDuration,
        pausedOrBuffering,
    ]);
};
exports.useMediaPlayback = useMediaPlayback;


/***/ }),

/***/ 7126:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.useMediaTagVolume = void 0;
const react_1 = __webpack_require__(67294);
// Returns the real volume of the audio or video while playing,
// no matter what the supposed volume should be
const useMediaTagVolume = (mediaRef) => {
    const [actualVolume, setActualVolume] = (0, react_1.useState)(1);
    (0, react_1.useEffect)(() => {
        const ref = mediaRef.current;
        if (!ref) {
            return;
        }
        const onChange = () => {
            setActualVolume(ref.volume);
        };
        ref.addEventListener('volumechange', onChange);
        return () => ref.removeEventListener('volumechange', onChange);
    }, [mediaRef]);
    (0, react_1.useEffect)(() => {
        const ref = mediaRef.current;
        if (!ref) {
            return;
        }
        if (ref.volume !== actualVolume) {
            setActualVolume(ref.volume);
        }
    }, [actualVolume, mediaRef]);
    return actualVolume;
};
exports.useMediaTagVolume = useMediaTagVolume;


/***/ }),

/***/ 38875:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.useSyncVolumeWithMediaTag = void 0;
const react_1 = __webpack_require__(67294);
const is_approximately_the_same_js_1 = __webpack_require__(26614);
const volume_prop_js_1 = __webpack_require__(39022);
const useSyncVolumeWithMediaTag = ({ volumePropFrame, actualVolume, volume, mediaVolume, mediaRef, }) => {
    (0, react_1.useEffect)(() => {
        const userPreferredVolume = (0, volume_prop_js_1.evaluateVolume)({
            frame: volumePropFrame,
            volume,
            mediaVolume,
            allowAmplificationDuringRender: false,
        });
        if (!(0, is_approximately_the_same_js_1.isApproximatelyTheSame)(userPreferredVolume, actualVolume) &&
            mediaRef.current) {
            mediaRef.current.volume = userPreferredVolume;
        }
    }, [actualVolume, volumePropFrame, mediaRef, volume, mediaVolume]);
};
exports.useSyncVolumeWithMediaTag = useSyncVolumeWithMediaTag;


/***/ }),

/***/ 53095:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.useUnsafeVideoConfig = void 0;
const react_1 = __webpack_require__(67294);
const SequenceContext_js_1 = __webpack_require__(73759);
const use_video_js_1 = __webpack_require__(3141);
const useUnsafeVideoConfig = () => {
    var _a, _b, _c;
    const context = (0, react_1.useContext)(SequenceContext_js_1.SequenceContext);
    const ctxWidth = (_a = context === null || context === void 0 ? void 0 : context.width) !== null && _a !== void 0 ? _a : null;
    const ctxHeight = (_b = context === null || context === void 0 ? void 0 : context.height) !== null && _b !== void 0 ? _b : null;
    const ctxDuration = (_c = context === null || context === void 0 ? void 0 : context.durationInFrames) !== null && _c !== void 0 ? _c : null;
    const video = (0, use_video_js_1.useVideo)();
    return (0, react_1.useMemo)(() => {
        if (!video) {
            return null;
        }
        const { id, durationInFrames, fps, height, width, defaultProps, props, defaultCodec, } = video;
        return {
            id,
            width: ctxWidth !== null && ctxWidth !== void 0 ? ctxWidth : width,
            height: ctxHeight !== null && ctxHeight !== void 0 ? ctxHeight : height,
            fps,
            durationInFrames: ctxDuration !== null && ctxDuration !== void 0 ? ctxDuration : durationInFrames,
            defaultProps,
            props,
            defaultCodec,
        };
    }, [ctxDuration, ctxHeight, ctxWidth, video]);
};
exports.useUnsafeVideoConfig = useUnsafeVideoConfig;


/***/ }),

/***/ 73347:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.useVideoConfig = void 0;
const react_1 = __webpack_require__(67294);
const CanUseRemotionHooks_js_1 = __webpack_require__(44144);
const is_player_js_1 = __webpack_require__(50606);
const use_unsafe_video_config_js_1 = __webpack_require__(53095);
/**
 * /**
 * @description Get some info about the context of the video that you are making.
 * @see [Documentation](https://www.remotion.dev/docs/use-video-config)
 * @returns Returns an object containing `fps`, `width`, `height` and `durationInFrames`, all of type `number`.
 */
const useVideoConfig = () => {
    const videoConfig = (0, use_unsafe_video_config_js_1.useUnsafeVideoConfig)();
    const context = (0, react_1.useContext)(CanUseRemotionHooks_js_1.CanUseRemotionHooks);
    const isPlayer = (0, is_player_js_1.useIsPlayer)();
    if (!videoConfig) {
        if ((typeof window !== 'undefined' && window.remotion_isPlayer) ||
            isPlayer) {
            throw new Error([
                'No video config found. Likely reasons:',
                '- You are probably calling useVideoConfig() from outside the component passed to <Player />. See https://www.remotion.dev/docs/player/examples for how to set up the Player correctly.',
                '- You have multiple versions of Remotion installed which causes the React context to get lost.',
            ].join('-'));
        }
        throw new Error('No video config found. You are probably calling useVideoConfig() from a component which has not been registered as a <Composition />. See https://www.remotion.dev/docs/the-fundamentals#defining-compositions for more information.');
    }
    if (!context) {
        throw new Error('Called useVideoConfig() outside a Remotion composition.');
    }
    return videoConfig;
};
exports.useVideoConfig = useVideoConfig;


/***/ }),

/***/ 3141:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.useVideo = void 0;
const react_1 = __webpack_require__(67294);
const CompositionManagerContext_js_1 = __webpack_require__(13898);
const ResolveCompositionConfig_js_1 = __webpack_require__(95014);
const useVideo = () => {
    var _a;
    const { canvasContent, compositions, currentCompositionMetadata } = (0, react_1.useContext)(CompositionManagerContext_js_1.CompositionManager);
    const selected = compositions.find((c) => {
        return ((canvasContent === null || canvasContent === void 0 ? void 0 : canvasContent.type) === 'composition' &&
            c.id === canvasContent.compositionId);
    });
    const resolved = (0, ResolveCompositionConfig_js_1.useResolvedVideoConfig)((_a = selected === null || selected === void 0 ? void 0 : selected.id) !== null && _a !== void 0 ? _a : null);
    return (0, react_1.useMemo)(() => {
        var _a;
        if (!resolved) {
            return null;
        }
        if (resolved.type === 'error') {
            return null;
        }
        if (resolved.type === 'loading') {
            return null;
        }
        if (!selected) {
            return null;
        }
        return {
            ...resolved.result,
            defaultProps: (_a = selected.defaultProps) !== null && _a !== void 0 ? _a : {},
            id: selected.id,
            // We override the selected metadata with the metadata that was passed to renderMedia(),
            // and don't allow it to be changed during render anymore
            ...(currentCompositionMetadata !== null && currentCompositionMetadata !== void 0 ? currentCompositionMetadata : {}),
            component: selected.component,
        };
    }, [currentCompositionMetadata, resolved, selected]);
};
exports.useVideo = useVideo;


/***/ }),

/***/ 3871:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.validateFrame = void 0;
const validateFrame = ({ allowFloats, durationInFrames, frame, }) => {
    if (typeof frame === 'undefined') {
        throw new TypeError(`Argument missing for parameter "frame"`);
    }
    if (typeof frame !== 'number') {
        throw new TypeError(`Argument passed for "frame" is not a number: ${frame}`);
    }
    if (!Number.isFinite(frame)) {
        throw new RangeError(`Frame ${frame} is not finite`);
    }
    if (frame % 1 !== 0 && !allowFloats) {
        throw new RangeError(`Argument for frame must be an integer, but got ${frame}`);
    }
    if (frame < 0 && frame < -durationInFrames) {
        throw new RangeError(`Cannot use frame ${frame}: Duration of composition is ${durationInFrames}, therefore the lowest frame that can be rendered is ${-durationInFrames}`);
    }
    if (frame > durationInFrames - 1) {
        throw new RangeError(`Cannot use frame ${frame}: Duration of composition is ${durationInFrames}, therefore the highest frame that can be rendered is ${durationInFrames - 1}`);
    }
};
exports.validateFrame = validateFrame;


/***/ }),

/***/ 15480:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.validateMediaProps = void 0;
const validateMediaProps = (props, component) => {
    if (typeof props.volume !== 'number' &&
        typeof props.volume !== 'function' &&
        typeof props.volume !== 'undefined') {
        throw new TypeError(`You have passed a volume of type ${typeof props.volume} to your <${component} /> component. Volume must be a number or a function with the signature '(frame: number) => number' undefined.`);
    }
    if (typeof props.volume === 'number' && props.volume < 0) {
        throw new TypeError(`You have passed a volume below 0 to your <${component} /> component. Volume must be between 0 and 1`);
    }
    if (typeof props.playbackRate !== 'number' &&
        typeof props.playbackRate !== 'undefined') {
        throw new TypeError(`You have passed a playbackRate of type ${typeof props.playbackRate} to your <${component} /> component. Playback rate must a real number or undefined.`);
    }
    if (typeof props.playbackRate === 'number' &&
        (isNaN(props.playbackRate) ||
            !Number.isFinite(props.playbackRate) ||
            props.playbackRate <= 0)) {
        throw new TypeError(`You have passed a playbackRate of ${props.playbackRate} to your <${component} /> component. Playback rate must be a real number above 0.`);
    }
};
exports.validateMediaProps = validateMediaProps;


/***/ }),

/***/ 444:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.validateStartFromProps = void 0;
const validateStartFromProps = (startFrom, endAt) => {
    if (typeof startFrom !== 'undefined') {
        if (typeof startFrom !== 'number') {
            throw new TypeError(`type of startFrom prop must be a number, instead got type ${typeof startFrom}.`);
        }
        if (isNaN(startFrom) || startFrom === Infinity) {
            throw new TypeError('startFrom prop can not be NaN or Infinity.');
        }
        if (startFrom < 0) {
            throw new TypeError(`startFrom must be greater than equal to 0 instead got ${startFrom}.`);
        }
    }
    if (typeof endAt !== 'undefined') {
        if (typeof endAt !== 'number') {
            throw new TypeError(`type of endAt prop must be a number, instead got type ${typeof endAt}.`);
        }
        if (isNaN(endAt)) {
            throw new TypeError('endAt prop can not be NaN.');
        }
        if (endAt <= 0) {
            throw new TypeError(`endAt must be a positive number, instead got ${endAt}.`);
        }
    }
    if (endAt < startFrom) {
        throw new TypeError('endAt prop must be greater than startFrom prop.');
    }
};
exports.validateStartFromProps = validateStartFromProps;


/***/ }),

/***/ 86303:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.invalidCompositionErrorMessage = exports.validateCompositionId = exports.isCompositionIdValid = void 0;
const getRegex = () => /^([a-zA-Z0-9-\u4E00-\u9FFF])+$/g;
const isCompositionIdValid = (id) => id.match(getRegex());
exports.isCompositionIdValid = isCompositionIdValid;
const validateCompositionId = (id) => {
    if (!(0, exports.isCompositionIdValid)(id)) {
        throw new Error(`Composition id can only contain a-z, A-Z, 0-9 and -. You passed ${id}`);
    }
};
exports.validateCompositionId = validateCompositionId;
exports.invalidCompositionErrorMessage = `Composition ID must match ${String(getRegex())}`;


/***/ }),

/***/ 54985:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.validateDefaultCodec = void 0;
const codec_1 = __webpack_require__(30851);
function validateDefaultCodec(defaultCodec, location) {
    if (typeof defaultCodec === 'undefined') {
        return;
    }
    if (typeof defaultCodec !== 'string') {
        throw new TypeError(`The "defaultCodec" prop ${location} must be a string, but you passed a value of type ${typeof defaultCodec}.`);
    }
    if (!codec_1.validCodecs.includes(defaultCodec)) {
        throw new Error(`The "defaultCodec" prop ${location} must be one of ${codec_1.validCodecs.join(', ')}, but you passed ${defaultCodec}.`);
    }
}
exports.validateDefaultCodec = validateDefaultCodec;


/***/ }),

/***/ 80607:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.validateDefaultAndInputProps = void 0;
const validateDefaultAndInputProps = (defaultProps, name, compositionId) => {
    if (!defaultProps) {
        return;
    }
    if (typeof defaultProps !== 'object') {
        throw new Error(`"${name}" must be an object, but you passed a value of type ${typeof defaultProps}`);
    }
    if (Array.isArray(defaultProps)) {
        throw new Error(`"${name}" must be an object, an array was passed ${compositionId ? `for composition "${compositionId}"` : ''}`);
    }
};
exports.validateDefaultAndInputProps = validateDefaultAndInputProps;


/***/ }),

/***/ 71162:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.validateDimension = void 0;
function validateDimension(amount, nameOfProp, location) {
    if (typeof amount !== 'number') {
        throw new Error(`The "${nameOfProp}" prop ${location} must be a number, but you passed a value of type ${typeof amount}`);
    }
    if (isNaN(amount)) {
        throw new TypeError(`The "${nameOfProp}" prop ${location} must not be NaN, but is NaN.`);
    }
    if (!Number.isFinite(amount)) {
        throw new TypeError(`The "${nameOfProp}" prop ${location} must be finite, but is ${amount}.`);
    }
    if (amount % 1 !== 0) {
        throw new TypeError(`The "${nameOfProp}" prop ${location} must be an integer, but is ${amount}.`);
    }
    if (amount <= 0) {
        throw new TypeError(`The "${nameOfProp}" prop ${location} must be positive, but got ${amount}.`);
    }
}
exports.validateDimension = validateDimension;


/***/ }),

/***/ 52363:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.validateDurationInFrames = void 0;
function validateDurationInFrames(durationInFrames, options) {
    const { allowFloats, component } = options;
    if (typeof durationInFrames === 'undefined') {
        throw new Error(`The "durationInFrames" prop ${component} is missing.`);
    }
    if (typeof durationInFrames !== 'number') {
        throw new Error(`The "durationInFrames" prop ${component} must be a number, but you passed a value of type ${typeof durationInFrames}`);
    }
    if (durationInFrames <= 0) {
        throw new TypeError(`The "durationInFrames" prop ${component} must be positive, but got ${durationInFrames}.`);
    }
    if (!allowFloats && durationInFrames % 1 !== 0) {
        throw new TypeError(`The "durationInFrames" prop ${component} must be an integer, but got ${durationInFrames}.`);
    }
    if (!Number.isFinite(durationInFrames)) {
        throw new TypeError(`The "durationInFrames" prop ${component} must be finite, but got ${durationInFrames}.`);
    }
}
exports.validateDurationInFrames = validateDurationInFrames;


/***/ }),

/***/ 80487:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.invalidFolderNameErrorMessage = exports.validateFolderName = exports.isFolderNameValid = void 0;
const getRegex = () => /^([a-zA-Z0-9-\u4E00-\u9FFF])+$/g;
const isFolderNameValid = (name) => name.match(getRegex());
exports.isFolderNameValid = isFolderNameValid;
const validateFolderName = (name) => {
    if (name === undefined || name === null) {
        throw new TypeError('You must pass a name to a <Folder />.');
    }
    if (typeof name !== 'string') {
        throw new TypeError(`The "name" you pass into <Folder /> must be a string. Got: ${typeof name}`);
    }
    if (!(0, exports.isFolderNameValid)(name)) {
        throw new Error(`Folder name can only contain a-z, A-Z, 0-9 and -. You passed ${name}`);
    }
};
exports.validateFolderName = validateFolderName;
exports.invalidFolderNameErrorMessage = `Folder name must match ${String(getRegex())}`;


/***/ }),

/***/ 5868:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.validateFps = void 0;
function validateFps(fps, location, isGif) {
    if (typeof fps !== 'number') {
        throw new Error(`"fps" must be a number, but you passed a value of type ${typeof fps} ${location}`);
    }
    if (!Number.isFinite(fps)) {
        throw new Error(`"fps" must be a finite, but you passed ${fps} ${location}`);
    }
    if (isNaN(fps)) {
        throw new Error(`"fps" must not be NaN, but got ${fps} ${location}`);
    }
    if (fps <= 0) {
        throw new TypeError(`"fps" must be positive, but got ${fps} ${location}`);
    }
    if (isGif && fps > 50) {
        throw new TypeError(`The FPS for a GIF cannot be higher than 50. Use the --every-nth-frame option to lower the FPS: https://remotion.dev/docs/render-as-gif`);
    }
}
exports.validateFps = validateFps;


/***/ }),

/***/ 91569:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.validateSpringDuration = void 0;
const validateSpringDuration = (dur) => {
    if (typeof dur === 'undefined') {
        return;
    }
    if (typeof dur !== 'number') {
        throw new TypeError(`A "duration" of a spring must be a "number" but is "${typeof dur}"`);
    }
    if (Number.isNaN(dur)) {
        throw new TypeError('A "duration" of a spring is NaN, which it must not be');
    }
    if (!Number.isFinite(dur)) {
        throw new TypeError('A "duration" of a spring must be finite, but is ' + dur);
    }
    if (dur <= 0) {
        throw new TypeError('A "duration" of a spring must be positive, but is ' + dur);
    }
};
exports.validateSpringDuration = validateSpringDuration;


/***/ }),

/***/ 93648:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.VERSION = void 0;
// Automatically generated on publish
exports.VERSION = '4.0.141';


/***/ }),

/***/ 87778:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));


/***/ }),

/***/ 32714:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.OffthreadVideo = void 0;
const jsx_runtime_1 = __webpack_require__(85893);
const react_1 = __webpack_require__(67294);
const Sequence_js_1 = __webpack_require__(97080);
const get_remotion_environment_js_1 = __webpack_require__(48288);
const validate_media_props_js_1 = __webpack_require__(15480);
const validate_start_from_props_js_1 = __webpack_require__(444);
const OffthreadVideoForRendering_js_1 = __webpack_require__(83905);
const VideoForPreview_js_1 = __webpack_require__(36021);
/**
 * @description This method imports and displays a video, similar to <Video />. During rendering, it extracts the exact frame from the video and displays it in an <img> tag
 * @see [Documentation](https://www.remotion.dev/docs/offthreadvideo)
 */
const OffthreadVideo = (props) => {
    // Should only destruct `startFrom` and `endAt` from props,
    // rest gets drilled down
    const { startFrom, endAt, name, pauseWhenBuffering, stack, showInTimeline, ...otherProps } = props;
    const environment = (0, get_remotion_environment_js_1.getRemotionEnvironment)();
    const onDuration = (0, react_1.useCallback)(() => undefined, []);
    if (typeof props.src !== 'string') {
        throw new TypeError(`The \`<OffthreadVideo>\` tag requires a string for \`src\`, but got ${JSON.stringify(props.src)} instead.`);
    }
    if (props.imageFormat) {
        throw new TypeError(`The \`<OffthreadVideo>\` tag does no longer accept \`imageFormat\`. Use the \`transparent\` prop if you want to render a transparent video.`);
    }
    if (typeof startFrom !== 'undefined' || typeof endAt !== 'undefined') {
        (0, validate_start_from_props_js_1.validateStartFromProps)(startFrom, endAt);
        const startFromFrameNo = startFrom !== null && startFrom !== void 0 ? startFrom : 0;
        const endAtFrameNo = endAt !== null && endAt !== void 0 ? endAt : Infinity;
        return ((0, jsx_runtime_1.jsx)(Sequence_js_1.Sequence, { layout: "none", from: 0 - startFromFrameNo, showInTimeline: false, durationInFrames: endAtFrameNo, name: name, children: (0, jsx_runtime_1.jsx)(exports.OffthreadVideo, { pauseWhenBuffering: pauseWhenBuffering !== null && pauseWhenBuffering !== void 0 ? pauseWhenBuffering : false, ...otherProps }) }));
    }
    (0, validate_media_props_js_1.validateMediaProps)(props, 'Video');
    if (environment.isRendering) {
        return (0, jsx_runtime_1.jsx)(OffthreadVideoForRendering_js_1.OffthreadVideoForRendering, { ...otherProps });
    }
    const { transparent, toneMapped, ...withoutTransparent } = otherProps;
    return ((0, jsx_runtime_1.jsx)(VideoForPreview_js_1.VideoForPreview, { _remotionInternalStack: stack !== null && stack !== void 0 ? stack : null, _remotionInternalNativeLoopPassed: false, onDuration: onDuration, onlyWarnForMediaSeekingError: true, pauseWhenBuffering: pauseWhenBuffering !== null && pauseWhenBuffering !== void 0 ? pauseWhenBuffering : false, showInTimeline: showInTimeline !== null && showInTimeline !== void 0 ? showInTimeline : true, ...withoutTransparent }));
};
exports.OffthreadVideo = OffthreadVideo;


/***/ }),

/***/ 83905:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.OffthreadVideoForRendering = void 0;
const jsx_runtime_1 = __webpack_require__(85893);
const react_1 = __webpack_require__(67294);
const Img_js_1 = __webpack_require__(10074);
const RenderAssetManager_js_1 = __webpack_require__(26770);
const SequenceContext_js_1 = __webpack_require__(73759);
const absolute_src_js_1 = __webpack_require__(74710);
const use_audio_frame_js_1 = __webpack_require__(66873);
const cancel_render_js_1 = __webpack_require__(88113);
const default_css_js_1 = __webpack_require__(57524);
const random_js_1 = __webpack_require__(34264);
const timeline_position_state_js_1 = __webpack_require__(47083);
const truthy_js_1 = __webpack_require__(3928);
const use_current_frame_js_1 = __webpack_require__(39727);
const use_unsafe_video_config_js_1 = __webpack_require__(53095);
const volume_prop_js_1 = __webpack_require__(39022);
const get_current_time_js_1 = __webpack_require__(84956);
const offthread_video_source_js_1 = __webpack_require__(53998);
const OffthreadVideoForRendering = ({ onError, volume: volumeProp, playbackRate, src, muted, allowAmplificationDuringRender, transparent = false, toneMapped = true, toneFrequency, name, ...props }) => {
    const absoluteFrame = (0, timeline_position_state_js_1.useTimelinePosition)();
    const frame = (0, use_current_frame_js_1.useCurrentFrame)();
    const volumePropsFrame = (0, use_audio_frame_js_1.useFrameForVolumeProp)();
    const videoConfig = (0, use_unsafe_video_config_js_1.useUnsafeVideoConfig)();
    const sequenceContext = (0, react_1.useContext)(SequenceContext_js_1.SequenceContext);
    const mediaStartsAt = (0, use_audio_frame_js_1.useMediaStartsAt)();
    const { registerRenderAsset, unregisterRenderAsset } = (0, react_1.useContext)(RenderAssetManager_js_1.RenderAssetManager);
    if (!src) {
        throw new TypeError('No `src` was passed to <OffthreadVideo>.');
    }
    // Generate a string that's as unique as possible for this asset
    // but at the same time the same on all threads
    const id = (0, react_1.useMemo)(() => `offthreadvideo-${(0, random_js_1.random)(src !== null && src !== void 0 ? src : '')}-${sequenceContext === null || sequenceContext === void 0 ? void 0 : sequenceContext.cumulatedFrom}-${sequenceContext === null || sequenceContext === void 0 ? void 0 : sequenceContext.relativeFrom}-${sequenceContext === null || sequenceContext === void 0 ? void 0 : sequenceContext.durationInFrames}`, [
        src,
        sequenceContext === null || sequenceContext === void 0 ? void 0 : sequenceContext.cumulatedFrom,
        sequenceContext === null || sequenceContext === void 0 ? void 0 : sequenceContext.relativeFrom,
        sequenceContext === null || sequenceContext === void 0 ? void 0 : sequenceContext.durationInFrames,
    ]);
    if (!videoConfig) {
        throw new Error('No video config found');
    }
    const volume = (0, volume_prop_js_1.evaluateVolume)({
        volume: volumeProp,
        frame: volumePropsFrame,
        mediaVolume: 1,
        allowAmplificationDuringRender: allowAmplificationDuringRender !== null && allowAmplificationDuringRender !== void 0 ? allowAmplificationDuringRender : false,
    });
    (0, react_1.useEffect)(() => {
        var _a;
        if (!src) {
            throw new Error('No src passed');
        }
        if (!window.remotion_audioEnabled) {
            return;
        }
        if (muted) {
            return;
        }
        if (volume <= 0) {
            return;
        }
        registerRenderAsset({
            type: 'video',
            src: (0, absolute_src_js_1.getAbsoluteSrc)(src),
            id,
            frame: absoluteFrame,
            volume,
            mediaFrame: frame,
            playbackRate: playbackRate !== null && playbackRate !== void 0 ? playbackRate : 1,
            allowAmplificationDuringRender: allowAmplificationDuringRender !== null && allowAmplificationDuringRender !== void 0 ? allowAmplificationDuringRender : false,
            toneFrequency: toneFrequency !== null && toneFrequency !== void 0 ? toneFrequency : null,
            audioStartFrame: -((_a = sequenceContext === null || sequenceContext === void 0 ? void 0 : sequenceContext.relativeFrom) !== null && _a !== void 0 ? _a : 0),
        });
        return () => unregisterRenderAsset(id);
    }, [
        muted,
        src,
        registerRenderAsset,
        id,
        unregisterRenderAsset,
        volume,
        frame,
        absoluteFrame,
        playbackRate,
        allowAmplificationDuringRender,
        toneFrequency,
        sequenceContext === null || sequenceContext === void 0 ? void 0 : sequenceContext.relativeFrom,
    ]);
    const currentTime = (0, react_1.useMemo)(() => {
        return ((0, get_current_time_js_1.getExpectedMediaFrameUncorrected)({
            frame,
            playbackRate: playbackRate || 1,
            startFrom: -mediaStartsAt,
        }) / videoConfig.fps);
    }, [frame, mediaStartsAt, playbackRate, videoConfig.fps]);
    const actualSrc = (0, react_1.useMemo)(() => {
        return (0, offthread_video_source_js_1.getOffthreadVideoSource)({
            src,
            currentTime,
            transparent,
            toneMapped,
        });
    }, [toneMapped, currentTime, src, transparent]);
    const onErr = (0, react_1.useCallback)((e) => {
        if (onError) {
            onError === null || onError === void 0 ? void 0 : onError(e);
        }
        else {
            (0, cancel_render_js_1.cancelRender)('Failed to load image with src ' + actualSrc);
        }
    }, [actualSrc, onError]);
    const className = (0, react_1.useMemo)(() => {
        return [default_css_js_1.OFFTHREAD_VIDEO_CLASS_NAME, props.className]
            .filter(truthy_js_1.truthy)
            .join(' ');
    }, [props.className]);
    return ((0, jsx_runtime_1.jsx)(Img_js_1.Img, { src: actualSrc, className: className, ...props, onError: onErr }));
};
exports.OffthreadVideoForRendering = OffthreadVideoForRendering;


/***/ }),

/***/ 57307:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Video = void 0;
const jsx_runtime_1 = __webpack_require__(85893);
/* eslint-disable @typescript-eslint/no-use-before-define */
const react_1 = __webpack_require__(67294);
const Sequence_js_1 = __webpack_require__(97080);
const absolute_src_js_1 = __webpack_require__(74710);
const calculate_loop_js_1 = __webpack_require__(46822);
const enable_sequence_stack_traces_js_1 = __webpack_require__(12196);
const get_remotion_environment_js_1 = __webpack_require__(48288);
const index_js_1 = __webpack_require__(4432);
const prefetch_js_1 = __webpack_require__(32595);
const use_video_config_js_1 = __webpack_require__(73347);
const validate_media_props_js_1 = __webpack_require__(15480);
const validate_start_from_props_js_1 = __webpack_require__(444);
const VideoForPreview_js_1 = __webpack_require__(36021);
const VideoForRendering_js_1 = __webpack_require__(78908);
const duration_state_js_1 = __webpack_require__(19099);
const VideoForwardingFunction = (props, ref) => {
    var _a, _b;
    const { startFrom, endAt, name, pauseWhenBuffering, stack, _remotionInternalNativeLoopPassed, showInTimeline, ...otherProps } = props;
    const { loop, ...propsOtherThanLoop } = props;
    const { fps } = (0, use_video_config_js_1.useVideoConfig)();
    const environment = (0, get_remotion_environment_js_1.getRemotionEnvironment)();
    const { durations, setDurations } = (0, react_1.useContext)(duration_state_js_1.DurationsContext);
    if (typeof ref === 'string') {
        throw new Error('string refs are not supported');
    }
    if (typeof props.src !== 'string') {
        throw new TypeError(`The \`<Video>\` tag requires a string for \`src\`, but got ${JSON.stringify(props.src)} instead.`);
    }
    const preloadedSrc = (0, prefetch_js_1.usePreload)(props.src);
    const onDuration = (0, react_1.useCallback)((src, durationInSeconds) => {
        setDurations({ type: 'got-duration', durationInSeconds, src });
    }, [setDurations]);
    const durationFetched = (_a = durations[(0, absolute_src_js_1.getAbsoluteSrc)(preloadedSrc)]) !== null && _a !== void 0 ? _a : durations[(0, absolute_src_js_1.getAbsoluteSrc)(props.src)];
    if (loop && durationFetched !== undefined) {
        const mediaDuration = durationFetched * fps;
        return ((0, jsx_runtime_1.jsx)(index_js_1.Loop, { durationInFrames: (0, calculate_loop_js_1.calculateLoopDuration)({
                endAt,
                mediaDuration,
                playbackRate: (_b = props.playbackRate) !== null && _b !== void 0 ? _b : 1,
                startFrom,
            }), layout: "none", name: name, children: (0, jsx_runtime_1.jsx)(exports.Video, { ...propsOtherThanLoop, ref: ref, _remotionInternalNativeLoopPassed: true }) }));
    }
    if (typeof startFrom !== 'undefined' || typeof endAt !== 'undefined') {
        (0, validate_start_from_props_js_1.validateStartFromProps)(startFrom, endAt);
        const startFromFrameNo = startFrom !== null && startFrom !== void 0 ? startFrom : 0;
        const endAtFrameNo = endAt !== null && endAt !== void 0 ? endAt : Infinity;
        return ((0, jsx_runtime_1.jsx)(Sequence_js_1.Sequence, { layout: "none", from: 0 - startFromFrameNo, showInTimeline: false, durationInFrames: endAtFrameNo, name: name, children: (0, jsx_runtime_1.jsx)(exports.Video, { pauseWhenBuffering: pauseWhenBuffering !== null && pauseWhenBuffering !== void 0 ? pauseWhenBuffering : false, ...otherProps, ref: ref }) }));
    }
    (0, validate_media_props_js_1.validateMediaProps)(props, 'Video');
    if (environment.isRendering) {
        return ((0, jsx_runtime_1.jsx)(VideoForRendering_js_1.VideoForRendering, { onDuration: onDuration, ...otherProps, ref: ref }));
    }
    return ((0, jsx_runtime_1.jsx)(VideoForPreview_js_1.VideoForPreview, { onlyWarnForMediaSeekingError: false, ...otherProps, ref: ref, 
        // Proposal: Make this default to true in v5
        pauseWhenBuffering: pauseWhenBuffering !== null && pauseWhenBuffering !== void 0 ? pauseWhenBuffering : false, onDuration: onDuration, _remotionInternalStack: stack !== null && stack !== void 0 ? stack : null, _remotionInternalNativeLoopPassed: _remotionInternalNativeLoopPassed !== null && _remotionInternalNativeLoopPassed !== void 0 ? _remotionInternalNativeLoopPassed : false, showInTimeline: showInTimeline !== null && showInTimeline !== void 0 ? showInTimeline : true }));
};
/**
 * @description allows you to include a video file in your Remotion project. It wraps the native HTMLVideoElement.
 * @see [Documentation](https://www.remotion.dev/docs/video)
 */
exports.Video = (0, react_1.forwardRef)(VideoForwardingFunction);
(0, enable_sequence_stack_traces_js_1.addSequenceStackTraces)(exports.Video);


/***/ }),

/***/ 36021:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.VideoForPreview = void 0;
const jsx_runtime_1 = __webpack_require__(85893);
const react_1 = __webpack_require__(67294);
const SequenceContext_js_1 = __webpack_require__(73759);
const SequenceManager_js_1 = __webpack_require__(80829);
const use_audio_frame_js_1 = __webpack_require__(66873);
const prefetch_js_1 = __webpack_require__(32595);
const use_media_buffering_js_1 = __webpack_require__(16801);
const use_media_in_timeline_js_1 = __webpack_require__(17476);
const use_media_playback_js_1 = __webpack_require__(95069);
const use_media_tag_volume_js_1 = __webpack_require__(7126);
const use_sync_volume_with_media_tag_js_1 = __webpack_require__(38875);
const use_video_config_js_1 = __webpack_require__(73347);
const volume_position_state_js_1 = __webpack_require__(51399);
const video_fragment_js_1 = __webpack_require__(51527);
const VideoForDevelopmentRefForwardingFunction = (props, ref) => {
    var _a, _b, _c;
    const videoRef = (0, react_1.useRef)(null);
    const volumePropFrame = (0, use_audio_frame_js_1.useFrameForVolumeProp)();
    const { fps, durationInFrames } = (0, use_video_config_js_1.useVideoConfig)();
    const parentSequence = (0, react_1.useContext)(SequenceContext_js_1.SequenceContext);
    const { hidden } = (0, react_1.useContext)(SequenceManager_js_1.SequenceVisibilityToggleContext);
    const [timelineId] = (0, react_1.useState)(() => String(Math.random()));
    const isSequenceHidden = (_a = hidden[timelineId]) !== null && _a !== void 0 ? _a : false;
    const { volume, muted, playbackRate, onlyWarnForMediaSeekingError, src, onDuration, 
    // @ts-expect-error
    acceptableTimeShift, acceptableTimeShiftInSeconds, toneFrequency, name, _remotionInternalNativeLoopPassed, _remotionInternalStack, style, pauseWhenBuffering, showInTimeline, ...nativeProps } = props;
    if (typeof acceptableTimeShift !== 'undefined') {
        throw new Error('acceptableTimeShift has been removed. Use acceptableTimeShiftInSeconds instead.');
    }
    const actualVolume = (0, use_media_tag_volume_js_1.useMediaTagVolume)(videoRef);
    const [mediaVolume] = (0, volume_position_state_js_1.useMediaVolumeState)();
    const [mediaMuted] = (0, volume_position_state_js_1.useMediaMutedState)();
    (0, use_media_in_timeline_js_1.useMediaInTimeline)({
        mediaRef: videoRef,
        volume,
        mediaVolume,
        mediaType: 'video',
        src,
        playbackRate: (_b = props.playbackRate) !== null && _b !== void 0 ? _b : 1,
        displayName: name !== null && name !== void 0 ? name : null,
        id: timelineId,
        stack: _remotionInternalStack,
        showInTimeline,
        premountDisplay: null,
    });
    (0, use_sync_volume_with_media_tag_js_1.useSyncVolumeWithMediaTag)({
        volumePropFrame,
        actualVolume,
        volume,
        mediaVolume,
        mediaRef: videoRef,
    });
    (0, use_media_playback_js_1.useMediaPlayback)({
        mediaRef: videoRef,
        src,
        mediaType: 'video',
        playbackRate: (_c = props.playbackRate) !== null && _c !== void 0 ? _c : 1,
        onlyWarnForMediaSeekingError,
        acceptableTimeshift: acceptableTimeShiftInSeconds !== null && acceptableTimeShiftInSeconds !== void 0 ? acceptableTimeShiftInSeconds : use_media_playback_js_1.DEFAULT_ACCEPTABLE_TIMESHIFT,
    });
    (0, use_media_buffering_js_1.useMediaBuffering)({
        element: videoRef,
        shouldBuffer: pauseWhenBuffering,
        isPremounting: Boolean(parentSequence === null || parentSequence === void 0 ? void 0 : parentSequence.premounting),
    });
    const actualFrom = parentSequence
        ? parentSequence.relativeFrom + parentSequence.cumulatedFrom
        : 0;
    const duration = parentSequence
        ? Math.min(parentSequence.durationInFrames, durationInFrames)
        : durationInFrames;
    const actualSrc = (0, video_fragment_js_1.useAppendVideoFragment)({
        actualSrc: (0, prefetch_js_1.usePreload)(src),
        actualFrom,
        duration,
        fps,
    });
    (0, react_1.useImperativeHandle)(ref, () => {
        return videoRef.current;
    }, []);
    (0, react_1.useEffect)(() => {
        const { current } = videoRef;
        if (!current) {
            return;
        }
        const errorHandler = () => {
            var _a;
            if (current === null || current === void 0 ? void 0 : current.error) {
                // eslint-disable-next-line no-console
                console.error('Error occurred in video', current === null || current === void 0 ? void 0 : current.error);
                // If user is handling the error, we don't cause an unhandled exception
                if (props.onError) {
                    return;
                }
                throw new Error(`The browser threw an error while playing the video ${src}: Code ${current.error.code} - ${(_a = current === null || current === void 0 ? void 0 : current.error) === null || _a === void 0 ? void 0 : _a.message}. See https://remotion.dev/docs/media-playback-error for help. Pass an onError() prop to handle the error.`);
            }
            else {
                throw new Error('The browser threw an error');
            }
        };
        current.addEventListener('error', errorHandler, { once: true });
        return () => {
            current.removeEventListener('error', errorHandler);
        };
    }, [props.onError, src]);
    const currentOnDurationCallback = (0, react_1.useRef)();
    currentOnDurationCallback.current = onDuration;
    (0, react_1.useEffect)(() => {
        var _a;
        const { current } = videoRef;
        if (!current) {
            return;
        }
        if (current.duration) {
            (_a = currentOnDurationCallback.current) === null || _a === void 0 ? void 0 : _a.call(currentOnDurationCallback, src, current.duration);
            return;
        }
        const onLoadedMetadata = () => {
            var _a;
            (_a = currentOnDurationCallback.current) === null || _a === void 0 ? void 0 : _a.call(currentOnDurationCallback, src, current.duration);
        };
        current.addEventListener('loadedmetadata', onLoadedMetadata);
        return () => {
            current.removeEventListener('loadedmetadata', onLoadedMetadata);
        };
    }, [src]);
    (0, react_1.useEffect)(() => {
        const { current } = videoRef;
        if (!current) {
            return;
        }
        // Without this, on iOS Safari, the video cannot be seeked.
        // if a seek is triggered before `loadedmetadata` is fired,
        // the video will not seek, even if `loadedmetadata` is fired afterwards.
        // Also, this needs to happen in a useEffect, because otherwise
        // the SSR props will be applied.
        if ((0, video_fragment_js_1.isIosSafari)()) {
            current.preload = 'metadata';
        }
        else {
            current.preload = 'auto';
        }
    }, []);
    const actualStyle = (0, react_1.useMemo)(() => {
        var _a;
        return {
            ...style,
            opacity: isSequenceHidden ? 0 : (_a = style === null || style === void 0 ? void 0 : style.opacity) !== null && _a !== void 0 ? _a : 1,
        };
    }, [isSequenceHidden, style]);
    return ((0, jsx_runtime_1.jsx)("video", { ref: videoRef, muted: muted || mediaMuted, playsInline: true, src: actualSrc, loop: _remotionInternalNativeLoopPassed, style: actualStyle, ...nativeProps }));
};
exports.VideoForPreview = (0, react_1.forwardRef)(VideoForDevelopmentRefForwardingFunction);


/***/ }),

/***/ 78908:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.VideoForRendering = void 0;
const jsx_runtime_1 = __webpack_require__(85893);
const react_1 = __webpack_require__(67294);
const RenderAssetManager_js_1 = __webpack_require__(26770);
const SequenceContext_js_1 = __webpack_require__(73759);
const absolute_src_js_1 = __webpack_require__(74710);
const use_audio_frame_js_1 = __webpack_require__(66873);
const delay_render_js_1 = __webpack_require__(22663);
const get_remotion_environment_js_1 = __webpack_require__(48288);
const is_approximately_the_same_js_1 = __webpack_require__(26614);
const random_js_1 = __webpack_require__(34264);
const timeline_position_state_js_1 = __webpack_require__(47083);
const use_current_frame_js_1 = __webpack_require__(39727);
const use_unsafe_video_config_js_1 = __webpack_require__(53095);
const volume_prop_js_1 = __webpack_require__(39022);
const get_current_time_js_1 = __webpack_require__(84956);
const seek_until_right_js_1 = __webpack_require__(26082);
const VideoForRenderingForwardFunction = ({ onError, volume: volumeProp, allowAmplificationDuringRender, playbackRate, onDuration, toneFrequency, name, acceptableTimeShiftInSeconds, delayRenderRetries, delayRenderTimeoutInMilliseconds, ...props }, ref) => {
    const absoluteFrame = (0, timeline_position_state_js_1.useTimelinePosition)();
    const frame = (0, use_current_frame_js_1.useCurrentFrame)();
    const volumePropsFrame = (0, use_audio_frame_js_1.useFrameForVolumeProp)();
    const videoConfig = (0, use_unsafe_video_config_js_1.useUnsafeVideoConfig)();
    const videoRef = (0, react_1.useRef)(null);
    const sequenceContext = (0, react_1.useContext)(SequenceContext_js_1.SequenceContext);
    const mediaStartsAt = (0, use_audio_frame_js_1.useMediaStartsAt)();
    const environment = (0, get_remotion_environment_js_1.getRemotionEnvironment)();
    const { registerRenderAsset, unregisterRenderAsset } = (0, react_1.useContext)(RenderAssetManager_js_1.RenderAssetManager);
    // Generate a string that's as unique as possible for this asset
    // but at the same time the same on all threads
    const id = (0, react_1.useMemo)(() => {
        var _a;
        return `video-${(0, random_js_1.random)((_a = props.src) !== null && _a !== void 0 ? _a : '')}-${sequenceContext === null || sequenceContext === void 0 ? void 0 : sequenceContext.cumulatedFrom}-${sequenceContext === null || sequenceContext === void 0 ? void 0 : sequenceContext.relativeFrom}-${sequenceContext === null || sequenceContext === void 0 ? void 0 : sequenceContext.durationInFrames}`;
    }, [
        props.src,
        sequenceContext === null || sequenceContext === void 0 ? void 0 : sequenceContext.cumulatedFrom,
        sequenceContext === null || sequenceContext === void 0 ? void 0 : sequenceContext.relativeFrom,
        sequenceContext === null || sequenceContext === void 0 ? void 0 : sequenceContext.durationInFrames,
    ]);
    if (!videoConfig) {
        throw new Error('No video config found');
    }
    const volume = (0, volume_prop_js_1.evaluateVolume)({
        volume: volumeProp,
        frame: volumePropsFrame,
        mediaVolume: 1,
        allowAmplificationDuringRender: allowAmplificationDuringRender !== null && allowAmplificationDuringRender !== void 0 ? allowAmplificationDuringRender : false,
    });
    (0, react_1.useEffect)(() => {
        var _a;
        if (!props.src) {
            throw new Error('No src passed');
        }
        if (props.muted) {
            return;
        }
        if (volume <= 0) {
            return;
        }
        if (!window.remotion_audioEnabled) {
            return;
        }
        registerRenderAsset({
            type: 'video',
            src: (0, absolute_src_js_1.getAbsoluteSrc)(props.src),
            id,
            frame: absoluteFrame,
            volume,
            mediaFrame: frame,
            playbackRate: playbackRate !== null && playbackRate !== void 0 ? playbackRate : 1,
            allowAmplificationDuringRender: allowAmplificationDuringRender !== null && allowAmplificationDuringRender !== void 0 ? allowAmplificationDuringRender : false,
            toneFrequency: toneFrequency !== null && toneFrequency !== void 0 ? toneFrequency : null,
            audioStartFrame: -((_a = sequenceContext === null || sequenceContext === void 0 ? void 0 : sequenceContext.relativeFrom) !== null && _a !== void 0 ? _a : 0),
        });
        return () => unregisterRenderAsset(id);
    }, [
        props.muted,
        props.src,
        registerRenderAsset,
        id,
        unregisterRenderAsset,
        volume,
        frame,
        absoluteFrame,
        playbackRate,
        allowAmplificationDuringRender,
        toneFrequency,
        sequenceContext === null || sequenceContext === void 0 ? void 0 : sequenceContext.relativeFrom,
    ]);
    (0, react_1.useImperativeHandle)(ref, () => {
        return videoRef.current;
    }, []);
    (0, react_1.useEffect)(() => {
        if (!window.remotion_videoEnabled) {
            return;
        }
        const { current } = videoRef;
        if (!current) {
            return;
        }
        const currentTime = (0, get_current_time_js_1.getMediaTime)({
            frame,
            playbackRate: playbackRate || 1,
            startFrom: -mediaStartsAt,
            fps: videoConfig.fps,
        });
        const handle = (0, delay_render_js_1.delayRender)(`Rendering <Video /> with src="${props.src}"`, {
            retries: delayRenderRetries !== null && delayRenderRetries !== void 0 ? delayRenderRetries : undefined,
            timeoutInMilliseconds: delayRenderTimeoutInMilliseconds !== null && delayRenderTimeoutInMilliseconds !== void 0 ? delayRenderTimeoutInMilliseconds : undefined,
        });
        if (false) {}
        if ((0, is_approximately_the_same_js_1.isApproximatelyTheSame)(current.currentTime, currentTime)) {
            if (current.readyState >= 2) {
                (0, delay_render_js_1.continueRender)(handle);
                return;
            }
            const loadedDataHandler = () => {
                (0, delay_render_js_1.continueRender)(handle);
            };
            current.addEventListener('loadeddata', loadedDataHandler, { once: true });
            return () => {
                current.removeEventListener('loadeddata', loadedDataHandler);
            };
        }
        const endedHandler = () => {
            (0, delay_render_js_1.continueRender)(handle);
        };
        const seek = (0, seek_until_right_js_1.seekToTimeMultipleUntilRight)(current, currentTime, videoConfig.fps);
        seek.prom.then(() => {
            (0, delay_render_js_1.continueRender)(handle);
        });
        current.addEventListener('ended', endedHandler, { once: true });
        const errorHandler = () => {
            var _a;
            if (current === null || current === void 0 ? void 0 : current.error) {
                // eslint-disable-next-line no-console
                console.error('Error occurred in video', current === null || current === void 0 ? void 0 : current.error);
                // If user is handling the error, we don't cause an unhandled exception
                if (onError) {
                    return;
                }
                throw new Error(`The browser threw an error while playing the video ${props.src}: Code ${current.error.code} - ${(_a = current === null || current === void 0 ? void 0 : current.error) === null || _a === void 0 ? void 0 : _a.message}. See https://remotion.dev/docs/media-playback-error for help. Pass an onError() prop to handle the error.`);
            }
            else {
                throw new Error('The browser threw an error');
            }
        };
        current.addEventListener('error', errorHandler, { once: true });
        // If video skips to another frame or unmounts, we clear the created handle
        return () => {
            seek.cancel();
            current.removeEventListener('ended', endedHandler);
            current.removeEventListener('error', errorHandler);
            (0, delay_render_js_1.continueRender)(handle);
        };
    }, [
        volumePropsFrame,
        props.src,
        playbackRate,
        videoConfig.fps,
        frame,
        mediaStartsAt,
        onError,
        delayRenderRetries,
        delayRenderTimeoutInMilliseconds,
    ]);
    const { src } = props;
    // If video source switches, make new handle
    if (environment.isRendering) {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        (0, react_1.useLayoutEffect)(() => {
            if (false) {}
            const newHandle = (0, delay_render_js_1.delayRender)('Loading <Video> duration with src=' + src, {
                retries: delayRenderRetries !== null && delayRenderRetries !== void 0 ? delayRenderRetries : undefined,
                timeoutInMilliseconds: delayRenderTimeoutInMilliseconds !== null && delayRenderTimeoutInMilliseconds !== void 0 ? delayRenderTimeoutInMilliseconds : undefined,
            });
            const { current } = videoRef;
            const didLoad = () => {
                if (current === null || current === void 0 ? void 0 : current.duration) {
                    onDuration(src, current.duration);
                }
                (0, delay_render_js_1.continueRender)(newHandle);
            };
            if (current === null || current === void 0 ? void 0 : current.duration) {
                onDuration(src, current.duration);
                (0, delay_render_js_1.continueRender)(newHandle);
            }
            else {
                current === null || current === void 0 ? void 0 : current.addEventListener('loadedmetadata', didLoad, { once: true });
            }
            // If tag gets unmounted, clear pending handles because video metadata is not going to load
            return () => {
                current === null || current === void 0 ? void 0 : current.removeEventListener('loadedmetadata', didLoad);
                (0, delay_render_js_1.continueRender)(newHandle);
            };
        }, [src, onDuration, delayRenderRetries, delayRenderTimeoutInMilliseconds]);
    }
    return (0, jsx_runtime_1.jsx)("video", { ref: videoRef, ...props, onError: onError });
};
exports.VideoForRendering = (0, react_1.forwardRef)(VideoForRenderingForwardFunction);


/***/ }),

/***/ 19099:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DurationsContextProvider = exports.DurationsContext = exports.durationReducer = void 0;
const jsx_runtime_1 = __webpack_require__(85893);
const react_1 = __webpack_require__(67294);
const absolute_src_js_1 = __webpack_require__(74710);
const durationReducer = (state, action) => {
    switch (action.type) {
        case 'got-duration':
            return {
                ...state,
                [(0, absolute_src_js_1.getAbsoluteSrc)(action.src)]: action.durationInSeconds,
            };
        default:
            return state;
    }
};
exports.durationReducer = durationReducer;
exports.DurationsContext = (0, react_1.createContext)({
    durations: {},
    setDurations: () => {
        throw new Error('context missing');
    },
});
const DurationsContextProvider = ({ children }) => {
    const [durations, setDurations] = (0, react_1.useReducer)(exports.durationReducer, {});
    const value = (0, react_1.useMemo)(() => {
        return {
            durations,
            setDurations,
        };
    }, [durations]);
    return ((0, jsx_runtime_1.jsx)(exports.DurationsContext.Provider, { value: value, children: children }));
};
exports.DurationsContextProvider = DurationsContextProvider;


/***/ }),

/***/ 84956:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


// Calculate the `.currentTime` of a video or audio element
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.getMediaTime = exports.getExpectedMediaFrameUncorrected = void 0;
const interpolate_js_1 = __webpack_require__(92297);
const getExpectedMediaFrameUncorrected = ({ frame, playbackRate, startFrom, }) => {
    return (0, interpolate_js_1.interpolate)(frame, [-1, startFrom, startFrom + 1], [-1, startFrom, startFrom + playbackRate]);
};
exports.getExpectedMediaFrameUncorrected = getExpectedMediaFrameUncorrected;
const getMediaTime = ({ fps, frame, playbackRate, startFrom, }) => {
    const expectedFrame = (0, exports.getExpectedMediaFrameUncorrected)({
        frame,
        playbackRate,
        startFrom,
    });
    const msPerFrame = 1000 / fps;
    return (expectedFrame * msPerFrame) / 1000;
};
exports.getMediaTime = getMediaTime;


/***/ }),

/***/ 4134:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Video = exports.OffthreadVideo = void 0;
var OffthreadVideo_js_1 = __webpack_require__(32714);
Object.defineProperty(exports, "OffthreadVideo", ({ enumerable: true, get: function () { return OffthreadVideo_js_1.OffthreadVideo; } }));
var Video_js_1 = __webpack_require__(57307);
Object.defineProperty(exports, "Video", ({ enumerable: true, get: function () { return Video_js_1.Video; } }));


/***/ }),

/***/ 53998:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.getOffthreadVideoSource = void 0;
const absolute_src_1 = __webpack_require__(74710);
const getOffthreadVideoSource = ({ src, transparent, currentTime, toneMapped, }) => {
    return `http://localhost:${window.remotion_proxyPort}/proxy?src=${encodeURIComponent((0, absolute_src_1.getAbsoluteSrc)(src))}&time=${encodeURIComponent(currentTime)}&transparent=${String(transparent)}&toneMapped=${String(toneMapped)}`;
};
exports.getOffthreadVideoSource = getOffthreadVideoSource;


/***/ }),

/***/ 26082:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.seekToTimeMultipleUntilRight = exports.seekToTime = void 0;
const roundTo6Commas = (num) => {
    return Math.round(num * 100000) / 100000;
};
const seekToTime = (element, desiredTime) => {
    element.currentTime = desiredTime;
    let cancel;
    let cancelSeeked = null;
    const prom = new Promise((resolve) => {
        cancel = element.requestVideoFrameCallback((now, metadata) => {
            const displayIn = metadata.expectedDisplayTime - now;
            if (displayIn <= 0) {
                resolve(metadata.mediaTime);
                return;
            }
            setTimeout(() => {
                resolve(metadata.mediaTime);
            }, displayIn + 150);
        });
    });
    const waitForSeekedEvent = new Promise((resolve) => {
        const onDone = () => {
            resolve();
        };
        element.addEventListener('seeked', onDone, {
            once: true,
        });
        cancelSeeked = () => {
            element.removeEventListener('seeked', onDone);
        };
    });
    return {
        wait: Promise.all([prom, waitForSeekedEvent]).then(([time]) => time),
        cancel: () => {
            cancelSeeked === null || cancelSeeked === void 0 ? void 0 : cancelSeeked();
            element.cancelVideoFrameCallback(cancel);
        },
    };
};
exports.seekToTime = seekToTime;
const seekToTimeMultipleUntilRight = (element, desiredTime, fps) => {
    const threshold = 1 / fps / 2;
    let currentCancel = () => undefined;
    if (Number.isFinite(element.duration) &&
        element.currentTime >= element.duration &&
        desiredTime >= element.duration) {
        return {
            prom: Promise.resolve(),
            cancel: () => { },
        };
    }
    const prom = new Promise((resolve, reject) => {
        const firstSeek = (0, exports.seekToTime)(element, desiredTime + threshold);
        firstSeek.wait.then((seekedTo) => {
            const difference = Math.abs(desiredTime - seekedTo);
            if (difference <= threshold) {
                return resolve();
            }
            const sign = desiredTime > seekedTo ? 1 : -1;
            const newSeek = (0, exports.seekToTime)(element, seekedTo + threshold * sign);
            currentCancel = newSeek.cancel;
            newSeek.wait
                .then((newTime) => {
                const newDifference = Math.abs(desiredTime - newTime);
                if (roundTo6Commas(newDifference) <= roundTo6Commas(threshold)) {
                    return resolve();
                }
                const thirdSeek = (0, exports.seekToTime)(element, desiredTime + threshold);
                currentCancel = thirdSeek.cancel;
                return thirdSeek.wait
                    .then(() => {
                    resolve();
                })
                    .catch((err) => {
                    reject(err);
                });
            })
                .catch((err) => {
                reject(err);
            });
        });
        currentCancel = firstSeek.cancel;
    });
    return {
        prom,
        cancel: () => {
            currentCancel();
        },
    };
};
exports.seekToTimeMultipleUntilRight = seekToTimeMultipleUntilRight;


/***/ }),

/***/ 51527:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.useAppendVideoFragment = exports.appendVideoFragment = exports.isIosSafari = void 0;
const react_1 = __webpack_require__(67294);
const toSeconds = (time, fps) => {
    return Math.round((time / fps) * 100) / 100;
};
const isIosSafari = () => {
    if (typeof window === 'undefined') {
        return false;
    }
    const isIpadIPodIPhone = /iP(ad|od|hone)/i.test(window.navigator.userAgent);
    const isAppleWebKit = /AppleWebKit/.test(window.navigator.userAgent);
    return isIpadIPodIPhone && isAppleWebKit;
};
exports.isIosSafari = isIosSafari;
// https://github.com/remotion-dev/remotion/issues/1655
const isIOSSafariAndBlob = (actualSrc) => {
    return (0, exports.isIosSafari)() && actualSrc.startsWith('blob:');
};
const appendVideoFragment = ({ actualSrc, actualFrom, duration, fps, }) => {
    var _a;
    if (isIOSSafariAndBlob(actualSrc)) {
        return actualSrc;
    }
    if (actualSrc.startsWith('data:')) {
        return actualSrc;
    }
    const existingHash = Boolean(new URL(actualSrc, (_a = (typeof window === 'undefined' ? null : window.location.href)) !== null && _a !== void 0 ? _a : 'http://localhost:3000').hash);
    if (existingHash) {
        return actualSrc;
    }
    if (!Number.isFinite(actualFrom)) {
        return actualSrc;
    }
    actualSrc += `#t=${toSeconds(-actualFrom, fps)}`;
    if (!Number.isFinite(duration)) {
        return actualSrc;
    }
    actualSrc += `,${toSeconds(duration, fps)}`;
    return actualSrc;
};
exports.appendVideoFragment = appendVideoFragment;
const isSubsetOfDuration = (prevStartFrom, newStartFrom, prevDuration, newDuration) => {
    return (prevStartFrom <= newStartFrom &&
        prevStartFrom + prevDuration >= newStartFrom + newDuration);
};
const useAppendVideoFragment = ({ actualSrc: initialActualSrc, actualFrom: initialActualFrom, duration: initialDuration, fps, }) => {
    const actualFromRef = (0, react_1.useRef)(initialActualFrom);
    const actualDuration = (0, react_1.useRef)(initialDuration);
    const actualSrc = (0, react_1.useRef)(initialActualSrc);
    if (!isSubsetOfDuration || initialActualSrc !== actualSrc.current) {
        actualFromRef.current = initialActualFrom;
        actualDuration.current = initialDuration;
        actualSrc.current = initialActualSrc;
    }
    const appended = (0, exports.appendVideoFragment)({
        actualSrc: actualSrc.current,
        actualFrom: actualFromRef.current,
        duration: actualDuration.current,
        fps,
    });
    return appended;
};
exports.useAppendVideoFragment = useAppendVideoFragment;


/***/ }),

/***/ 51399:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.useMediaMutedState = exports.useMediaVolumeState = exports.SetMediaVolumeContext = exports.MediaVolumeContext = void 0;
const react_1 = __webpack_require__(67294);
exports.MediaVolumeContext = (0, react_1.createContext)({
    mediaMuted: false,
    mediaVolume: 1,
});
exports.SetMediaVolumeContext = (0, react_1.createContext)({
    setMediaMuted: () => {
        throw new Error('default');
    },
    setMediaVolume: () => {
        throw new Error('default');
    },
});
const useMediaVolumeState = () => {
    const { mediaVolume } = (0, react_1.useContext)(exports.MediaVolumeContext);
    const { setMediaVolume } = (0, react_1.useContext)(exports.SetMediaVolumeContext);
    return (0, react_1.useMemo)(() => {
        return [mediaVolume, setMediaVolume];
    }, [mediaVolume, setMediaVolume]);
};
exports.useMediaVolumeState = useMediaVolumeState;
const useMediaMutedState = () => {
    const { mediaMuted } = (0, react_1.useContext)(exports.MediaVolumeContext);
    const { setMediaMuted } = (0, react_1.useContext)(exports.SetMediaVolumeContext);
    return (0, react_1.useMemo)(() => {
        return [mediaMuted, setMediaMuted];
    }, [mediaMuted, setMediaMuted]);
};
exports.useMediaMutedState = useMediaMutedState;


/***/ }),

/***/ 39022:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.evaluateVolume = void 0;
const evaluateVolume = ({ frame, volume, mediaVolume = 1, allowAmplificationDuringRender, }) => {
    const maxVolume = allowAmplificationDuringRender ? Infinity : 1;
    if (typeof volume === 'number') {
        return Math.min(maxVolume, volume * mediaVolume);
    }
    if (typeof volume === 'undefined') {
        return Number(mediaVolume);
    }
    const evaluated = volume(frame) * mediaVolume;
    if (typeof evaluated !== 'number') {
        throw new TypeError(`You passed in a a function to the volume prop but it did not return a number but a value of type ${typeof evaluated} for frame ${frame}`);
    }
    if (Number.isNaN(evaluated)) {
        throw new TypeError(`You passed in a function to the volume prop but it returned NaN for frame ${frame}.`);
    }
    if (!Number.isFinite(evaluated)) {
        throw new TypeError(`You passed in a function to the volume prop but it returned a non-finite number for frame ${frame}.`);
    }
    return Math.max(0, Math.min(maxVolume, evaluated));
};
exports.evaluateVolume = evaluateVolume;


/***/ }),

/***/ 72187:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.warnAboutNonSeekableMedia = void 0;
const alreadyWarned = {};
const warnAboutNonSeekableMedia = (ref, type) => {
    // Media is not loaded yet, but this does not yet mean something is wrong with the media
    if (ref === null) {
        return;
    }
    if (ref.seekable.length === 0) {
        return;
    }
    if (ref.seekable.length > 1) {
        return;
    }
    if (alreadyWarned[ref.src]) {
        return;
    }
    const range = { start: ref.seekable.start(0), end: ref.seekable.end(0) };
    if (range.start === 0 && range.end === 0) {
        const msg = [
            `The media ${ref.src} cannot be seeked. This could be one of few reasons:`,
            '1) The media resource was replaced while the video is playing but it was not loaded yet.',
            '2) The media does not support seeking.',
            '3) The media was loaded with security headers prventing it from being included.',
            'Please see https://remotion.dev/docs/non-seekable-media for assistance.',
        ].join('\n');
        if (type === 'console-error') {
            // eslint-disable-next-line no-console
            console.error(msg);
        }
        else if (type === 'console-warning') {
            // eslint-disable-next-line no-console
            console.warn(`The media ${ref.src} does not support seeking. The video will render fine, but may not play correctly in the Remotion Studio and in the <Player>. See https://remotion.dev/docs/non-seekable-media for an explanation.`);
        }
        else {
            throw new Error(msg);
        }
        alreadyWarned[ref.src] = true;
    }
};
exports.warnAboutNonSeekableMedia = warnAboutNonSeekableMedia;


/***/ }),

/***/ 74295:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.watchStaticFile = exports.WATCH_REMOTION_STATIC_FILES = void 0;
const get_remotion_environment_1 = __webpack_require__(48288);
exports.WATCH_REMOTION_STATIC_FILES = 'remotion_staticFilesChanged';
/**
 * @description Watch for changes in a specific static file.
 * @param {string} fileName - The name of the static file to watch for changes.
 * @param {WatcherCallback} callback - A callback function to be called when the file changes.
 * @returns {{cancel: () => void}} A function that can be used to cancel the event listener.
 * @see [Documentation](https://www.remotion.dev/docs/watchstaticfile)
 */
const watchStaticFile = (fileName, callback) => {
    // Check if function is called in Remotion Studio
    if (!(0, get_remotion_environment_1.getRemotionEnvironment)().isStudio) {
        // eslint-disable-next-line no-console
        console.warn('The API is only available while using the Remotion Studio.');
        return { cancel: () => undefined };
    }
    const withoutStaticBase = fileName.startsWith(window.remotion_staticBase)
        ? fileName.replace(window.remotion_staticBase, '')
        : fileName;
    const withoutLeadingSlash = withoutStaticBase.startsWith('/')
        ? withoutStaticBase.slice(1)
        : withoutStaticBase;
    let prevFileData = window.remotion_staticFiles.find((file) => file.name === withoutLeadingSlash);
    // Check if the specified static file has updated or deleted
    const checkFile = (event) => {
        const staticFiles = event.detail.files;
        // Check for user specified file
        const newFileData = staticFiles.find((file) => file.name === withoutLeadingSlash);
        if (!newFileData) {
            // File is deleted
            if (prevFileData !== undefined) {
                callback(null);
            }
            prevFileData = undefined;
            return;
        }
        if (prevFileData === undefined ||
            prevFileData.lastModified !== newFileData.lastModified) {
            callback(newFileData); // File is added or modified
            prevFileData = newFileData;
        }
    };
    window.addEventListener(exports.WATCH_REMOTION_STATIC_FILES, checkFile);
    const cancel = () => {
        return window.removeEventListener(exports.WATCH_REMOTION_STATIC_FILES, checkFile);
    };
    return { cancel };
};
exports.watchStaticFile = watchStaticFile;


/***/ }),

/***/ 69887:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RemotionContextProvider = exports.useRemotionContexts = void 0;
const jsx_runtime_1 = __webpack_require__(85893);
// This is used for when other reconcilers are being used
// such as in React Three Fiber. All the contexts need to be passed again
// for them to be useable
const react_1 = __importStar(__webpack_require__(67294));
const CanUseRemotionHooks_js_1 = __webpack_require__(44144);
const CompositionManagerContext_js_1 = __webpack_require__(13898);
const NativeLayers_js_1 = __webpack_require__(2425);
const RenderAssetManager_js_1 = __webpack_require__(26770);
const ResolveCompositionConfig_js_1 = __webpack_require__(95014);
const SequenceContext_js_1 = __webpack_require__(73759);
const SequenceManager_js_1 = __webpack_require__(80829);
const buffering_js_1 = __webpack_require__(45775);
const nonce_js_1 = __webpack_require__(98054);
const prefetch_state_js_1 = __webpack_require__(15819);
const timeline_position_state_js_1 = __webpack_require__(47083);
function useRemotionContexts() {
    const compositionManagerCtx = react_1.default.useContext(CompositionManagerContext_js_1.CompositionManager);
    const timelineContext = react_1.default.useContext(timeline_position_state_js_1.TimelineContext);
    const setTimelineContext = react_1.default.useContext(timeline_position_state_js_1.SetTimelineContext);
    const sequenceContext = react_1.default.useContext(SequenceContext_js_1.SequenceContext);
    const nonceContext = react_1.default.useContext(nonce_js_1.NonceContext);
    const canUseRemotionHooksContext = react_1.default.useContext(CanUseRemotionHooks_js_1.CanUseRemotionHooks);
    const nativeLayersContext = react_1.default.useContext(NativeLayers_js_1.NativeLayersContext);
    const preloadContext = react_1.default.useContext(prefetch_state_js_1.PreloadContext);
    const resolveCompositionContext = react_1.default.useContext(ResolveCompositionConfig_js_1.ResolveCompositionContext);
    const renderAssetManagerContext = react_1.default.useContext(RenderAssetManager_js_1.RenderAssetManager);
    const sequenceManagerContext = react_1.default.useContext(SequenceManager_js_1.SequenceManager);
    const bufferManagerContext = react_1.default.useContext(buffering_js_1.BufferingContextReact);
    return (0, react_1.useMemo)(() => ({
        compositionManagerCtx,
        timelineContext,
        setTimelineContext,
        sequenceContext,
        nonceContext,
        canUseRemotionHooksContext,
        nativeLayersContext,
        preloadContext,
        resolveCompositionContext,
        renderAssetManagerContext,
        sequenceManagerContext,
        bufferManagerContext,
    }), [
        compositionManagerCtx,
        nonceContext,
        sequenceContext,
        setTimelineContext,
        timelineContext,
        canUseRemotionHooksContext,
        nativeLayersContext,
        preloadContext,
        resolveCompositionContext,
        renderAssetManagerContext,
        sequenceManagerContext,
        bufferManagerContext,
    ]);
}
exports.useRemotionContexts = useRemotionContexts;
const RemotionContextProvider = (props) => {
    const { children, contexts } = props;
    return ((0, jsx_runtime_1.jsx)(CanUseRemotionHooks_js_1.CanUseRemotionHooks.Provider, { value: contexts.canUseRemotionHooksContext, children: (0, jsx_runtime_1.jsx)(nonce_js_1.NonceContext.Provider, { value: contexts.nonceContext, children: (0, jsx_runtime_1.jsx)(NativeLayers_js_1.NativeLayersContext.Provider, { value: contexts.nativeLayersContext, children: (0, jsx_runtime_1.jsx)(prefetch_state_js_1.PreloadContext.Provider, { value: contexts.preloadContext, children: (0, jsx_runtime_1.jsx)(CompositionManagerContext_js_1.CompositionManager.Provider, { value: contexts.compositionManagerCtx, children: (0, jsx_runtime_1.jsx)(SequenceManager_js_1.SequenceManager.Provider, { value: contexts.sequenceManagerContext, children: (0, jsx_runtime_1.jsx)(RenderAssetManager_js_1.RenderAssetManager.Provider, { value: contexts.renderAssetManagerContext, children: (0, jsx_runtime_1.jsx)(ResolveCompositionConfig_js_1.ResolveCompositionContext.Provider, { value: contexts.resolveCompositionContext, children: (0, jsx_runtime_1.jsx)(timeline_position_state_js_1.TimelineContext.Provider, { value: contexts.timelineContext, children: (0, jsx_runtime_1.jsx)(timeline_position_state_js_1.SetTimelineContext.Provider, { value: contexts.setTimelineContext, children: (0, jsx_runtime_1.jsx)(SequenceContext_js_1.SequenceContext.Provider, { value: contexts.sequenceContext, children: (0, jsx_runtime_1.jsx)(buffering_js_1.BufferingContextReact.Provider, { value: contexts.bufferManagerContext, children: children }) }) }) }) }) }) }) }) }) }) }) }));
};
exports.RemotionContextProvider = RemotionContextProvider;


/***/ }),

/***/ 60053:
/***/ ((__unused_webpack_module, exports) => {

/**
 * @license React
 * scheduler.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
function f(a,b){var c=a.length;a.push(b);a:for(;0<c;){var d=c-1>>>1,e=a[d];if(0<g(e,b))a[d]=b,a[c]=e,c=d;else break a}}function h(a){return 0===a.length?null:a[0]}function k(a){if(0===a.length)return null;var b=a[0],c=a.pop();if(c!==b){a[0]=c;a:for(var d=0,e=a.length,w=e>>>1;d<w;){var m=2*(d+1)-1,C=a[m],n=m+1,x=a[n];if(0>g(C,c))n<e&&0>g(x,C)?(a[d]=x,a[n]=c,d=n):(a[d]=C,a[m]=c,d=m);else if(n<e&&0>g(x,c))a[d]=x,a[n]=c,d=n;else break a}}return b}
function g(a,b){var c=a.sortIndex-b.sortIndex;return 0!==c?c:a.id-b.id}if("object"===typeof performance&&"function"===typeof performance.now){var l=performance;exports.unstable_now=function(){return l.now()}}else{var p=Date,q=p.now();exports.unstable_now=function(){return p.now()-q}}var r=[],t=[],u=1,v=null,y=3,z=!1,A=!1,B=!1,D="function"===typeof setTimeout?setTimeout:null,E="function"===typeof clearTimeout?clearTimeout:null,F="undefined"!==typeof setImmediate?setImmediate:null;
"undefined"!==typeof navigator&&void 0!==navigator.scheduling&&void 0!==navigator.scheduling.isInputPending&&navigator.scheduling.isInputPending.bind(navigator.scheduling);function G(a){for(var b=h(t);null!==b;){if(null===b.callback)k(t);else if(b.startTime<=a)k(t),b.sortIndex=b.expirationTime,f(r,b);else break;b=h(t)}}function H(a){B=!1;G(a);if(!A)if(null!==h(r))A=!0,I(J);else{var b=h(t);null!==b&&K(H,b.startTime-a)}}
function J(a,b){A=!1;B&&(B=!1,E(L),L=-1);z=!0;var c=y;try{G(b);for(v=h(r);null!==v&&(!(v.expirationTime>b)||a&&!M());){var d=v.callback;if("function"===typeof d){v.callback=null;y=v.priorityLevel;var e=d(v.expirationTime<=b);b=exports.unstable_now();"function"===typeof e?v.callback=e:v===h(r)&&k(r);G(b)}else k(r);v=h(r)}if(null!==v)var w=!0;else{var m=h(t);null!==m&&K(H,m.startTime-b);w=!1}return w}finally{v=null,y=c,z=!1}}var N=!1,O=null,L=-1,P=5,Q=-1;
function M(){return exports.unstable_now()-Q<P?!1:!0}function R(){if(null!==O){var a=exports.unstable_now();Q=a;var b=!0;try{b=O(!0,a)}finally{b?S():(N=!1,O=null)}}else N=!1}var S;if("function"===typeof F)S=function(){F(R)};else if("undefined"!==typeof MessageChannel){var T=new MessageChannel,U=T.port2;T.port1.onmessage=R;S=function(){U.postMessage(null)}}else S=function(){D(R,0)};function I(a){O=a;N||(N=!0,S())}function K(a,b){L=D(function(){a(exports.unstable_now())},b)}
exports.unstable_IdlePriority=5;exports.unstable_ImmediatePriority=1;exports.unstable_LowPriority=4;exports.unstable_NormalPriority=3;exports.unstable_Profiling=null;exports.unstable_UserBlockingPriority=2;exports.unstable_cancelCallback=function(a){a.callback=null};exports.unstable_continueExecution=function(){A||z||(A=!0,I(J))};
exports.unstable_forceFrameRate=function(a){0>a||125<a?console.error("forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported"):P=0<a?Math.floor(1E3/a):5};exports.unstable_getCurrentPriorityLevel=function(){return y};exports.unstable_getFirstCallbackNode=function(){return h(r)};exports.unstable_next=function(a){switch(y){case 1:case 2:case 3:var b=3;break;default:b=y}var c=y;y=b;try{return a()}finally{y=c}};exports.unstable_pauseExecution=function(){};
exports.unstable_requestPaint=function(){};exports.unstable_runWithPriority=function(a,b){switch(a){case 1:case 2:case 3:case 4:case 5:break;default:a=3}var c=y;y=a;try{return b()}finally{y=c}};
exports.unstable_scheduleCallback=function(a,b,c){var d=exports.unstable_now();"object"===typeof c&&null!==c?(c=c.delay,c="number"===typeof c&&0<c?d+c:d):c=d;switch(a){case 1:var e=-1;break;case 2:e=250;break;case 5:e=1073741823;break;case 4:e=1E4;break;default:e=5E3}e=c+e;a={id:u++,callback:b,priorityLevel:a,startTime:c,expirationTime:e,sortIndex:-1};c>d?(a.sortIndex=c,f(t,a),null===h(r)&&a===h(t)&&(B?(E(L),L=-1):B=!0,K(H,c-d))):(a.sortIndex=e,f(r,a),A||z||(A=!0,I(J)));return a};
exports.unstable_shouldYield=M;exports.unstable_wrapCallback=function(a){var b=y;return function(){var c=y;y=b;try{return a.apply(this,arguments)}finally{y=c}}};


/***/ }),

/***/ 63840:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {



if (true) {
  module.exports = __webpack_require__(60053);
} else {}


/***/ }),

/***/ 93379:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {



var isOldIE = function isOldIE() {
  var memo;
  return function memorize() {
    if (typeof memo === 'undefined') {
      // Test for IE <= 9 as proposed by Browserhacks
      // @see http://browserhacks.com/#hack-e71d8692f65334173fee715c222cb805
      // Tests for existence of standard globals is to allow style-loader
      // to operate correctly into non-standard environments
      // @see https://github.com/webpack-contrib/style-loader/issues/177
      memo = Boolean(window && document && document.all && !window.atob);
    }

    return memo;
  };
}();

var getTarget = function getTarget() {
  var memo = {};
  return function memorize(target) {
    if (typeof memo[target] === 'undefined') {
      var styleTarget = document.querySelector(target); // Special case to return head of iframe instead of iframe itself

      if (window.HTMLIFrameElement && styleTarget instanceof window.HTMLIFrameElement) {
        try {
          // This will throw an exception if access to iframe is blocked
          // due to cross-origin restrictions
          styleTarget = styleTarget.contentDocument.head;
        } catch (e) {
          // istanbul ignore next
          styleTarget = null;
        }
      }

      memo[target] = styleTarget;
    }

    return memo[target];
  };
}();

var stylesInDom = [];

function getIndexByIdentifier(identifier) {
  var result = -1;

  for (var i = 0; i < stylesInDom.length; i++) {
    if (stylesInDom[i].identifier === identifier) {
      result = i;
      break;
    }
  }

  return result;
}

function modulesToDom(list, options) {
  var idCountMap = {};
  var identifiers = [];

  for (var i = 0; i < list.length; i++) {
    var item = list[i];
    var id = options.base ? item[0] + options.base : item[0];
    var count = idCountMap[id] || 0;
    var identifier = "".concat(id, " ").concat(count);
    idCountMap[id] = count + 1;
    var index = getIndexByIdentifier(identifier);
    var obj = {
      css: item[1],
      media: item[2],
      sourceMap: item[3]
    };

    if (index !== -1) {
      stylesInDom[index].references++;
      stylesInDom[index].updater(obj);
    } else {
      stylesInDom.push({
        identifier: identifier,
        updater: addStyle(obj, options),
        references: 1
      });
    }

    identifiers.push(identifier);
  }

  return identifiers;
}

function insertStyleElement(options) {
  var style = document.createElement('style');
  var attributes = options.attributes || {};

  if (typeof attributes.nonce === 'undefined') {
    var nonce =  true ? __webpack_require__.nc : 0;

    if (nonce) {
      attributes.nonce = nonce;
    }
  }

  Object.keys(attributes).forEach(function (key) {
    style.setAttribute(key, attributes[key]);
  });

  if (typeof options.insert === 'function') {
    options.insert(style);
  } else {
    var target = getTarget(options.insert || 'head');

    if (!target) {
      throw new Error("Couldn't find a style target. This probably means that the value for the 'insert' parameter is invalid.");
    }

    target.appendChild(style);
  }

  return style;
}

function removeStyleElement(style) {
  // istanbul ignore if
  if (style.parentNode === null) {
    return false;
  }

  style.parentNode.removeChild(style);
}
/* istanbul ignore next  */


var replaceText = function replaceText() {
  var textStore = [];
  return function replace(index, replacement) {
    textStore[index] = replacement;
    return textStore.filter(Boolean).join('\n');
  };
}();

function applyToSingletonTag(style, index, remove, obj) {
  var css = remove ? '' : obj.media ? "@media ".concat(obj.media, " {").concat(obj.css, "}") : obj.css; // For old IE

  /* istanbul ignore if  */

  if (style.styleSheet) {
    style.styleSheet.cssText = replaceText(index, css);
  } else {
    var cssNode = document.createTextNode(css);
    var childNodes = style.childNodes;

    if (childNodes[index]) {
      style.removeChild(childNodes[index]);
    }

    if (childNodes.length) {
      style.insertBefore(cssNode, childNodes[index]);
    } else {
      style.appendChild(cssNode);
    }
  }
}

function applyToTag(style, options, obj) {
  var css = obj.css;
  var media = obj.media;
  var sourceMap = obj.sourceMap;

  if (media) {
    style.setAttribute('media', media);
  } else {
    style.removeAttribute('media');
  }

  if (sourceMap && typeof btoa !== 'undefined') {
    css += "\n/*# sourceMappingURL=data:application/json;base64,".concat(btoa(unescape(encodeURIComponent(JSON.stringify(sourceMap)))), " */");
  } // For old IE

  /* istanbul ignore if  */


  if (style.styleSheet) {
    style.styleSheet.cssText = css;
  } else {
    while (style.firstChild) {
      style.removeChild(style.firstChild);
    }

    style.appendChild(document.createTextNode(css));
  }
}

var singleton = null;
var singletonCounter = 0;

function addStyle(obj, options) {
  var style;
  var update;
  var remove;

  if (options.singleton) {
    var styleIndex = singletonCounter++;
    style = singleton || (singleton = insertStyleElement(options));
    update = applyToSingletonTag.bind(null, style, styleIndex, false);
    remove = applyToSingletonTag.bind(null, style, styleIndex, true);
  } else {
    style = insertStyleElement(options);
    update = applyToTag.bind(null, style, options);

    remove = function remove() {
      removeStyleElement(style);
    };
  }

  update(obj);
  return function updateStyle(newObj) {
    if (newObj) {
      if (newObj.css === obj.css && newObj.media === obj.media && newObj.sourceMap === obj.sourceMap) {
        return;
      }

      update(obj = newObj);
    } else {
      remove();
    }
  };
}

module.exports = function (list, options) {
  options = options || {}; // Force single-tag solution on IE6-9, which has a hard limit on the # of <style>
  // tags it will allow on a page

  if (!options.singleton && typeof options.singleton !== 'boolean') {
    options.singleton = isOldIE();
  }

  list = list || [];
  var lastIdentifiers = modulesToDom(list, options);
  return function update(newList) {
    newList = newList || [];

    if (Object.prototype.toString.call(newList) !== '[object Array]') {
      return;
    }

    for (var i = 0; i < lastIdentifiers.length; i++) {
      var identifier = lastIdentifiers[i];
      var index = getIndexByIdentifier(identifier);
      stylesInDom[index].references--;
    }

    var newLastIdentifiers = modulesToDom(newList, options);

    for (var _i = 0; _i < lastIdentifiers.length; _i++) {
      var _identifier = lastIdentifiers[_i];

      var _index = getIndexByIdentifier(_identifier);

      if (stylesInDom[_index].references === 0) {
        stylesInDom[_index].updater();

        stylesInDom.splice(_index, 1);
      }
    }

    lastIdentifiers = newLastIdentifiers;
  };
};

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			id: moduleId,
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = __webpack_modules__;
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/create fake namespace object */
/******/ 	(() => {
/******/ 		var getProto = Object.getPrototypeOf ? (obj) => (Object.getPrototypeOf(obj)) : (obj) => (obj.__proto__);
/******/ 		var leafPrototypes;
/******/ 		// create a fake namespace object
/******/ 		// mode & 1: value is a module id, require it
/******/ 		// mode & 2: merge all properties of value into the ns
/******/ 		// mode & 4: return value when already ns object
/******/ 		// mode & 16: return value when it's Promise-like
/******/ 		// mode & 8|1: behave like require
/******/ 		__webpack_require__.t = function(value, mode) {
/******/ 			if(mode & 1) value = this(value);
/******/ 			if(mode & 8) return value;
/******/ 			if(typeof value === 'object' && value) {
/******/ 				if((mode & 4) && value.__esModule) return value;
/******/ 				if((mode & 16) && typeof value.then === 'function') return value;
/******/ 			}
/******/ 			var ns = Object.create(null);
/******/ 			__webpack_require__.r(ns);
/******/ 			var def = {};
/******/ 			leafPrototypes = leafPrototypes || [null, getProto({}), getProto([]), getProto(getProto)];
/******/ 			for(var current = mode & 2 && value; typeof current == 'object' && !~leafPrototypes.indexOf(current); current = getProto(current)) {
/******/ 				Object.getOwnPropertyNames(current).forEach((key) => (def[key] = () => (value[key])));
/******/ 			}
/******/ 			def['default'] = () => (value);
/******/ 			__webpack_require__.d(ns, def);
/******/ 			return ns;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/ensure chunk */
/******/ 	(() => {
/******/ 		__webpack_require__.f = {};
/******/ 		// This file contains only the entry chunk.
/******/ 		// The chunk loading function for additional chunks
/******/ 		__webpack_require__.e = (chunkId) => {
/******/ 			return Promise.all(Object.keys(__webpack_require__.f).reduce((promises, key) => {
/******/ 				__webpack_require__.f[key](chunkId, promises);
/******/ 				return promises;
/******/ 			}, []));
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/get javascript chunk filename */
/******/ 	(() => {
/******/ 		// This function allow to reference async chunks
/******/ 		__webpack_require__.u = (chunkId) => {
/******/ 			// return url for filenames based on template
/******/ 			return "" + chunkId + ".bundle.js";
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/global */
/******/ 	(() => {
/******/ 		__webpack_require__.g = (function() {
/******/ 			if (typeof globalThis === 'object') return globalThis;
/******/ 			try {
/******/ 				return this || new Function('return this')();
/******/ 			} catch (e) {
/******/ 				if (typeof window === 'object') return window;
/******/ 			}
/******/ 		})();
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/load script */
/******/ 	(() => {
/******/ 		var inProgress = {};
/******/ 		var dataWebpackPrefix = "remotion-player:";
/******/ 		// loadScript function to load a script via script tag
/******/ 		__webpack_require__.l = (url, done, key, chunkId) => {
/******/ 			if(inProgress[url]) { inProgress[url].push(done); return; }
/******/ 			var script, needAttach;
/******/ 			if(key !== undefined) {
/******/ 				var scripts = document.getElementsByTagName("script");
/******/ 				for(var i = 0; i < scripts.length; i++) {
/******/ 					var s = scripts[i];
/******/ 					if(s.getAttribute("src") == url || s.getAttribute("data-webpack") == dataWebpackPrefix + key) { script = s; break; }
/******/ 				}
/******/ 			}
/******/ 			if(!script) {
/******/ 				needAttach = true;
/******/ 				script = document.createElement('script');
/******/ 		
/******/ 				script.charset = 'utf-8';
/******/ 				script.timeout = 120;
/******/ 				if (__webpack_require__.nc) {
/******/ 					script.setAttribute("nonce", __webpack_require__.nc);
/******/ 				}
/******/ 				script.setAttribute("data-webpack", dataWebpackPrefix + key);
/******/ 				script.src = url;
/******/ 			}
/******/ 			inProgress[url] = [done];
/******/ 			var onScriptComplete = (prev, event) => {
/******/ 				// avoid mem leaks in IE.
/******/ 				script.onerror = script.onload = null;
/******/ 				clearTimeout(timeout);
/******/ 				var doneFns = inProgress[url];
/******/ 				delete inProgress[url];
/******/ 				script.parentNode && script.parentNode.removeChild(script);
/******/ 				doneFns && doneFns.forEach((fn) => (fn(event)));
/******/ 				if(prev) return prev(event);
/******/ 			}
/******/ 			var timeout = setTimeout(onScriptComplete.bind(null, undefined, { type: 'timeout', target: script }), 120000);
/******/ 			script.onerror = onScriptComplete.bind(null, script.onerror);
/******/ 			script.onload = onScriptComplete.bind(null, script.onload);
/******/ 			needAttach && document.head.appendChild(script);
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/publicPath */
/******/ 	(() => {
/******/ 		var scriptUrl;
/******/ 		if (__webpack_require__.g.importScripts) scriptUrl = __webpack_require__.g.location + "";
/******/ 		var document = __webpack_require__.g.document;
/******/ 		if (!scriptUrl && document) {
/******/ 			if (document.currentScript)
/******/ 				scriptUrl = document.currentScript.src;
/******/ 			if (!scriptUrl) {
/******/ 				var scripts = document.getElementsByTagName("script");
/******/ 				if(scripts.length) {
/******/ 					var i = scripts.length - 1;
/******/ 					while (i > -1 && !scriptUrl) scriptUrl = scripts[i--].src;
/******/ 				}
/******/ 			}
/******/ 		}
/******/ 		// When supporting browsers where an automatic publicPath is not supported you must specify an output.publicPath manually via configuration
/******/ 		// or pass an empty string ("") and set the __webpack_public_path__ variable from your code to use your own logic.
/******/ 		if (!scriptUrl) throw new Error("Automatic publicPath is not supported in this browser");
/******/ 		scriptUrl = scriptUrl.replace(/#.*$/, "").replace(/\?.*$/, "").replace(/\/[^\/]+$/, "/");
/******/ 		__webpack_require__.p = scriptUrl;
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/jsonp chunk loading */
/******/ 	(() => {
/******/ 		// no baseURI
/******/ 		
/******/ 		// object to store loaded and loading chunks
/******/ 		// undefined = chunk not loaded, null = chunk preloaded/prefetched
/******/ 		// [resolve, reject, Promise] = chunk loading, 0 = chunk loaded
/******/ 		var installedChunks = {
/******/ 			179: 0
/******/ 		};
/******/ 		
/******/ 		__webpack_require__.f.j = (chunkId, promises) => {
/******/ 				// JSONP chunk loading for javascript
/******/ 				var installedChunkData = __webpack_require__.o(installedChunks, chunkId) ? installedChunks[chunkId] : undefined;
/******/ 				if(installedChunkData !== 0) { // 0 means "already installed".
/******/ 		
/******/ 					// a Promise means "currently loading".
/******/ 					if(installedChunkData) {
/******/ 						promises.push(installedChunkData[2]);
/******/ 					} else {
/******/ 						if(true) { // all chunks have JS
/******/ 							// setup Promise in chunk cache
/******/ 							var promise = new Promise((resolve, reject) => (installedChunkData = installedChunks[chunkId] = [resolve, reject]));
/******/ 							promises.push(installedChunkData[2] = promise);
/******/ 		
/******/ 							// start chunk loading
/******/ 							var url = __webpack_require__.p + __webpack_require__.u(chunkId);
/******/ 							// create error before stack unwound to get useful stacktrace later
/******/ 							var error = new Error();
/******/ 							var loadingEnded = (event) => {
/******/ 								if(__webpack_require__.o(installedChunks, chunkId)) {
/******/ 									installedChunkData = installedChunks[chunkId];
/******/ 									if(installedChunkData !== 0) installedChunks[chunkId] = undefined;
/******/ 									if(installedChunkData) {
/******/ 										var errorType = event && (event.type === 'load' ? 'missing' : event.type);
/******/ 										var realSrc = event && event.target && event.target.src;
/******/ 										error.message = 'Loading chunk ' + chunkId + ' failed.\n(' + errorType + ': ' + realSrc + ')';
/******/ 										error.name = 'ChunkLoadError';
/******/ 										error.type = errorType;
/******/ 										error.request = realSrc;
/******/ 										installedChunkData[1](error);
/******/ 									}
/******/ 								}
/******/ 							};
/******/ 							__webpack_require__.l(url, loadingEnded, "chunk-" + chunkId, chunkId);
/******/ 						}
/******/ 					}
/******/ 				}
/******/ 		};
/******/ 		
/******/ 		// no prefetching
/******/ 		
/******/ 		// no preloaded
/******/ 		
/******/ 		// no HMR
/******/ 		
/******/ 		// no HMR manifest
/******/ 		
/******/ 		// no on chunks loaded
/******/ 		
/******/ 		// install a JSONP callback for chunk loading
/******/ 		var webpackJsonpCallback = (parentChunkLoadingFunction, data) => {
/******/ 			var [chunkIds, moreModules, runtime] = data;
/******/ 			// add "moreModules" to the modules object,
/******/ 			// then flag all "chunkIds" as loaded and fire callback
/******/ 			var moduleId, chunkId, i = 0;
/******/ 			if(chunkIds.some((id) => (installedChunks[id] !== 0))) {
/******/ 				for(moduleId in moreModules) {
/******/ 					if(__webpack_require__.o(moreModules, moduleId)) {
/******/ 						__webpack_require__.m[moduleId] = moreModules[moduleId];
/******/ 					}
/******/ 				}
/******/ 				if(runtime) var result = runtime(__webpack_require__);
/******/ 			}
/******/ 			if(parentChunkLoadingFunction) parentChunkLoadingFunction(data);
/******/ 			for(;i < chunkIds.length; i++) {
/******/ 				chunkId = chunkIds[i];
/******/ 				if(__webpack_require__.o(installedChunks, chunkId) && installedChunks[chunkId]) {
/******/ 					installedChunks[chunkId][0]();
/******/ 				}
/******/ 				installedChunks[chunkId] = 0;
/******/ 			}
/******/ 		
/******/ 		}
/******/ 		
/******/ 		var chunkLoadingGlobal = self["webpackChunkremotion_player"] = self["webpackChunkremotion_player"] || [];
/******/ 		chunkLoadingGlobal.forEach(webpackJsonpCallback.bind(null, 0));
/******/ 		chunkLoadingGlobal.push = webpackJsonpCallback.bind(null, chunkLoadingGlobal.push.bind(chunkLoadingGlobal));
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/nonce */
/******/ 	(() => {
/******/ 		__webpack_require__.nc = undefined;
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other entry modules.
(() => {
var exports = {};
var __webpack_unused_export__;

__webpack_unused_export__ = ({ value: true });
const remotion_1 = __webpack_require__(27982);
remotion_1.Internals.setupEnvVariables();
remotion_1.Internals.CSSUtils.injectCSS(`
  .css-reset, .css-reset * {
    font-size: 16px;
    line-height: 1.5;
    color: white;
    font-family: Arial, Helvetica, sans-serif;
    background: transparent;
    box-sizing: border-box;
  }

  .algolia-docsearch-suggestion--highlight {
    font-size: 15px;
    line-height: 1.25;
  }

  .__remotion-info-button-container code {
    font-family: monospace;
    font-size: 14px;
    color: #0584f2
  }

  .__remotion-vertical-scrollbar::-webkit-scrollbar {
      width: 6px;
  }
  .__remotion-vertical-scrollbar::-webkit-scrollbar-thumb {
    background-color: rgba(0, 0, 0, 0.0);
  }
  .__remotion-vertical-scrollbar:hover::-webkit-scrollbar-thumb {
    background-color: rgba(0, 0, 0, 0.6);
  }
  .__remotion-vertical-scrollbar:hover::-webkit-scrollbar-thumb:hover {
    background-color: rgba(0, 0, 0, 1);
  }


  .__remotion-horizontal-scrollbar::-webkit-scrollbar {
    height: 6px;
  }
  .__remotion-horizontal-scrollbar::-webkit-scrollbar-thumb {
    background-color: rgba(0, 0, 0, 0.0);
  }
  .__remotion-horizontal-scrollbar:hover::-webkit-scrollbar-thumb {
    background-color: rgba(0, 0, 0, 0.6);
  }
  .__remotion-horizontal-scrollbar:hover::-webkit-scrollbar-thumb:hover {
    background-color: rgba(0, 0, 0, 1);
  }


  @-moz-document url-prefix() {
    .__remotion-vertical-scrollbar {
      scrollbar-width: thin;
      scrollbar-color: rgba(0, 0, 0, 0.6) rgba(0, 0, 0, 0);
    }

    .__remotion-vertical-scrollbar:hover {
      scrollbar-color: rgba(0, 0, 0, 1) rgba(0, 0, 0, 0);
    }

    .__remotion-horizontal-scrollbar {
      scrollbar-width: thin;
      scrollbar-color: rgba(0, 0, 0, 0.6) rgba(0, 0, 0, 0);
    }

    .__remotion-horizontal-scrollbar:hover {
      scrollbar-width: thin;
      scrollbar-color: rgba(0, 0, 0, 1) rgba(0, 0, 0, 0);
    }
  }


  .__remotion-timeline-slider {
    appearance: none;
    width: 100px;
    border-radius: 3px;
    height: 6px;
    background-color: rgba(255, 255, 255, 0.1);
    accent-color: #ffffff;
  }
  
  .__remotion-timeline-slider::-moz-range-thumb {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background-color: #ffffff;
    appearance: none;
  }



`);

})();

// This entry need to be wrapped in an IIFE because it need to be isolated against other entry modules.
(() => {

// EXTERNAL MODULE: ./node_modules/remotion/dist/cjs/index.js
var cjs = __webpack_require__(27982);
// EXTERNAL MODULE: ./node_modules/@remotion/paths/dist/index.js
var dist = __webpack_require__(96633);
// EXTERNAL MODULE: ./node_modules/react/index.js
var react = __webpack_require__(67294);
;// CONCATENATED MODULE: ./remotion/MyComp/NextLogo.tsx



const nStroke = "M149.508 157.52L69.142 54H54V125.97H66.1136V69.3836L139.999 164.845C143.333 162.614 146.509 160.165 149.508 157.52Z";
const NextLogo = ({ outProgress }) => {
  const { fps } = (0,cjs.useVideoConfig)();
  const frame = (0,cjs.useCurrentFrame)();
  const evolve1 = (0,cjs.spring)({
    fps,
    frame,
    config: {
      damping: 200
    }
  });
  const evolve2 = (0,cjs.spring)({
    fps,
    frame: frame - 15,
    config: {
      damping: 200
    }
  });
  const evolve3 = (0,cjs.spring)({
    fps,
    frame: frame - 30,
    config: {
      damping: 200,
      mass: 3
    },
    durationInFrames: 30
  });
  const style = (0,react.useMemo)(() => {
    return {
      height: 140,
      borderRadius: 70,
      scale: String(1 - outProgress)
    };
  }, [outProgress]);
  const firstPath = `M 60.0568 54 v 71.97`;
  const secondPath = `M 63.47956 56.17496 L 144.7535 161.1825`;
  const thirdPath = `M 121 54 L 121 126`;
  const evolution1 = (0,dist/* evolvePath */.JC)(evolve1, firstPath);
  const evolution2 = (0,dist/* evolvePath */.JC)(evolve2, secondPath);
  const evolution3 = (0,dist/* evolvePath */.JC)(
    (0,cjs.interpolate)(evolve3, [0, 1], [0, 0.7]),
    thirdPath
  );
  return /* @__PURE__ */ react.createElement("svg", { style, fill: "none", viewBox: "0 0 180 180" }, /* @__PURE__ */ react.createElement(
    "mask",
    {
      height: "180",
      id: "mask",
      className: "[mask-type:alpha]",
      width: "180",
      x: "0",
      y: "0"
    },
    /* @__PURE__ */ react.createElement("circle", { cx: "90", cy: "90", fill: "black", r: "90" })
  ), /* @__PURE__ */ react.createElement("mask", { id: "n-mask", className: "[mask-type:alpha]" }, /* @__PURE__ */ react.createElement("path", { d: nStroke, fill: "black" })), /* @__PURE__ */ react.createElement("g", { mask: "url(#mask)" }, /* @__PURE__ */ react.createElement("circle", { cx: "90", cy: "90", fill: "black", r: "90" }), /* @__PURE__ */ react.createElement("g", { stroke: "url(#gradient0)", mask: "url(#n-mask)" }, /* @__PURE__ */ react.createElement(
    "path",
    {
      strokeWidth: "12.1136",
      d: firstPath,
      strokeDasharray: evolution1.strokeDasharray,
      strokeDashoffset: evolution1.strokeDashoffset
    }
  ), /* @__PURE__ */ react.createElement(
    "path",
    {
      strokeWidth: 12.1136,
      d: secondPath,
      strokeDasharray: evolution2.strokeDasharray,
      strokeDashoffset: evolution2.strokeDashoffset
    }
  )), /* @__PURE__ */ react.createElement(
    "path",
    {
      stroke: "url(#gradient1)",
      d: thirdPath,
      strokeDasharray: evolution3.strokeDasharray,
      strokeDashoffset: evolution3.strokeDashoffset,
      strokeWidth: "12"
    }
  )), /* @__PURE__ */ react.createElement("defs", null, /* @__PURE__ */ react.createElement(
    "linearGradient",
    {
      gradientUnits: "userSpaceOnUse",
      id: "gradient0",
      x1: "109",
      x2: "144.5",
      y1: "116.5",
      y2: "160.5"
    },
    /* @__PURE__ */ react.createElement("stop", { stopColor: "white" }),
    /* @__PURE__ */ react.createElement("stop", { offset: "1", stopColor: "white", stopOpacity: "0" })
  ), /* @__PURE__ */ react.createElement(
    "linearGradient",
    {
      gradientUnits: "userSpaceOnUse",
      id: "gradient1",
      x1: "121",
      x2: "120.799",
      y1: "54",
      y2: "106.875"
    },
    /* @__PURE__ */ react.createElement("stop", { stopColor: "white" }),
    /* @__PURE__ */ react.createElement("stop", { offset: "1", stopColor: "white", stopOpacity: "0" })
  )));
};

;// CONCATENATED MODULE: ./node_modules/@remotion/google-fonts/dist/esm/base.mjs


const loadedFonts = {};
/**
 * @description Load a Google Font for use in Remotion.
 * @param meta
 * @param {string} style The font style we want to load. While each font has a different set of styles, common options are: normal, italic etc.
 * @param {Array} options
 * @returns An object with the following properties: fontFamily, unicodeRanges, fonts
 * @see [Documentation](https://www.remotion.dev/docs/google-fonts/load-font)
 */
const loadFonts = (meta, style, options) => {
    var _a, _b, _c, _d;
    const promises = [];
    const styles = style ? [style] : Object.keys(meta.fonts);
    for (const style of styles) {
        // Don't load fonts on server
        if (typeof FontFace === "undefined") {
            continue;
        }
        if (!meta.fonts[style]) {
            throw new Error(`The font ${meta.fontFamily} does not have a style ${style}`);
        }
        const weights = (_a = options === null || options === void 0 ? void 0 : options.weights) !== null && _a !== void 0 ? _a : Object.keys(meta.fonts[style]);
        for (const weight of weights) {
            if (!meta.fonts[style][weight]) {
                throw new Error(`The font ${meta.fontFamily} does not  have a weight ${weight} in style ${style}`);
            }
            const subsets = (_b = options === null || options === void 0 ? void 0 : options.subsets) !== null && _b !== void 0 ? _b : Object.keys(meta.fonts[style][weight]);
            for (const subset of subsets) {
                //  Get font url from meta
                let font = (_d = (_c = meta.fonts[style]) === null || _c === void 0 ? void 0 : _c[weight]) === null || _d === void 0 ? void 0 : _d[subset];
                //  Check is font available in meta
                if (!font) {
                    throw new Error(`weight: ${weight} subset: ${subset} is not available for '${meta.fontFamily}'`);
                }
                //  Check is font already loaded
                let fontKey = `${meta.fontFamily}-${style}-${weight}-${subset}`;
                if (loadedFonts[fontKey]) {
                    continue;
                }
                //  Mark font as loaded
                loadedFonts[fontKey] = true;
                const handle = (0,cjs.delayRender)(`Fetching ${meta.fontFamily} font ${JSON.stringify({
                    style,
                    weight,
                    subset,
                })}`);
                //  Create font-face
                const fontFace = new FontFace(meta.fontFamily, `url(${font}) format('woff2')`, {
                    weight: weight,
                    style: style,
                    unicodeRange: meta.unicodeRanges[subset],
                });
                //  Load font-face
                const promise = fontFace
                    .load()
                    .then(() => {
                    var _a;
                    ((_a = options === null || options === void 0 ? void 0 : options.document) !== null && _a !== void 0 ? _a : document).fonts.add(fontFace);
                    (0,cjs.continueRender)(handle);
                })
                    .catch((err) => {
                    //  Mark font as not loaded
                    loadedFonts[fontKey] = false;
                    throw err;
                });
                promises.push(promise);
            }
        }
    }
    return {
        fontFamily: meta.fontFamily,
        fonts: meta.fonts,
        unicodeRanges: meta.unicodeRanges,
        waitUntilDone: () => Promise.all(promises).then(() => undefined),
    };
};



;// CONCATENATED MODULE: ./node_modules/@remotion/google-fonts/dist/esm/Inter.mjs



const getInfo = () => ({
    "fontFamily": "Inter",
    "importName": "Inter",
    "version": "v13",
    "url": "https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900",
    "unicodeRanges": {
        "cyrillic-ext": "U+0460-052F, U+1C80-1C88, U+20B4, U+2DE0-2DFF, U+A640-A69F, U+FE2E-FE2F",
        "cyrillic": "U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116",
        "greek-ext": "U+1F00-1FFF",
        "greek": "U+0370-03FF",
        "vietnamese": "U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+0300-0301, U+0303-0304, U+0308-0309, U+0323, U+0329, U+1EA0-1EF9, U+20AB",
        "latin-ext": "U+0100-02AF, U+0304, U+0308, U+0329, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20CF, U+2113, U+2C60-2C7F, U+A720-A7FF",
        "latin": "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD"
    },
    "fonts": {
        "normal": {
            "100": {
                "cyrillic-ext": "https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa2JL7SUc.woff2",
                "cyrillic": "https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa0ZL7SUc.woff2",
                "greek-ext": "https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa2ZL7SUc.woff2",
                "greek": "https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa1pL7SUc.woff2",
                "vietnamese": "https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa2pL7SUc.woff2",
                "latin-ext": "https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa25L7SUc.woff2",
                "latin": "https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa1ZL7.woff2"
            },
            "200": {
                "cyrillic-ext": "https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa2JL7SUc.woff2",
                "cyrillic": "https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa0ZL7SUc.woff2",
                "greek-ext": "https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa2ZL7SUc.woff2",
                "greek": "https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa1pL7SUc.woff2",
                "vietnamese": "https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa2pL7SUc.woff2",
                "latin-ext": "https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa25L7SUc.woff2",
                "latin": "https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa1ZL7.woff2"
            },
            "300": {
                "cyrillic-ext": "https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa2JL7SUc.woff2",
                "cyrillic": "https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa0ZL7SUc.woff2",
                "greek-ext": "https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa2ZL7SUc.woff2",
                "greek": "https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa1pL7SUc.woff2",
                "vietnamese": "https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa2pL7SUc.woff2",
                "latin-ext": "https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa25L7SUc.woff2",
                "latin": "https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa1ZL7.woff2"
            },
            "400": {
                "cyrillic-ext": "https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa2JL7SUc.woff2",
                "cyrillic": "https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa0ZL7SUc.woff2",
                "greek-ext": "https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa2ZL7SUc.woff2",
                "greek": "https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa1pL7SUc.woff2",
                "vietnamese": "https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa2pL7SUc.woff2",
                "latin-ext": "https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa25L7SUc.woff2",
                "latin": "https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa1ZL7.woff2"
            },
            "500": {
                "cyrillic-ext": "https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa2JL7SUc.woff2",
                "cyrillic": "https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa0ZL7SUc.woff2",
                "greek-ext": "https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa2ZL7SUc.woff2",
                "greek": "https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa1pL7SUc.woff2",
                "vietnamese": "https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa2pL7SUc.woff2",
                "latin-ext": "https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa25L7SUc.woff2",
                "latin": "https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa1ZL7.woff2"
            },
            "600": {
                "cyrillic-ext": "https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa2JL7SUc.woff2",
                "cyrillic": "https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa0ZL7SUc.woff2",
                "greek-ext": "https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa2ZL7SUc.woff2",
                "greek": "https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa1pL7SUc.woff2",
                "vietnamese": "https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa2pL7SUc.woff2",
                "latin-ext": "https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa25L7SUc.woff2",
                "latin": "https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa1ZL7.woff2"
            },
            "700": {
                "cyrillic-ext": "https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa2JL7SUc.woff2",
                "cyrillic": "https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa0ZL7SUc.woff2",
                "greek-ext": "https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa2ZL7SUc.woff2",
                "greek": "https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa1pL7SUc.woff2",
                "vietnamese": "https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa2pL7SUc.woff2",
                "latin-ext": "https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa25L7SUc.woff2",
                "latin": "https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa1ZL7.woff2"
            },
            "800": {
                "cyrillic-ext": "https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa2JL7SUc.woff2",
                "cyrillic": "https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa0ZL7SUc.woff2",
                "greek-ext": "https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa2ZL7SUc.woff2",
                "greek": "https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa1pL7SUc.woff2",
                "vietnamese": "https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa2pL7SUc.woff2",
                "latin-ext": "https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa25L7SUc.woff2",
                "latin": "https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa1ZL7.woff2"
            },
            "900": {
                "cyrillic-ext": "https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa2JL7SUc.woff2",
                "cyrillic": "https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa0ZL7SUc.woff2",
                "greek-ext": "https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa2ZL7SUc.woff2",
                "greek": "https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa1pL7SUc.woff2",
                "vietnamese": "https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa2pL7SUc.woff2",
                "latin-ext": "https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa25L7SUc.woff2",
                "latin": "https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa1ZL7.woff2"
            }
        }
    }
});
const fontFamily = "Inter";
const loadFont = (style, options) => {
    return loadFonts(getInfo(), style, options);
};



;// CONCATENATED MODULE: ./remotion/MyComp/Rings.tsx


const RadialGradient = ({ radius, color }) => {
  const height = radius * 2;
  const width = radius * 2;
  return /* @__PURE__ */ react.createElement(
    cjs.AbsoluteFill,
    {
      style: {
        justifyContent: "center",
        alignItems: "center"
      }
    },
    /* @__PURE__ */ react.createElement(
      "div",
      {
        style: {
          height,
          width,
          backgroundColor: color
        },
        className: "rounded-[50%] absolute shadow-[0px_0px_100px_rgba(0,0,0,0.05)]"
      }
    )
  );
};
const Rings = ({ outProgress }) => {
  const scale = 1 / (1 - outProgress);
  const { height } = (0,cjs.useVideoConfig)();
  return /* @__PURE__ */ react.createElement(
    cjs.AbsoluteFill,
    {
      style: {
        transform: `scale(${scale})`
      }
    },
    new Array(5).fill(true).map((_, i) => {
      return /* @__PURE__ */ react.createElement(
        RadialGradient,
        {
          key: i,
          radius: height * 0.3 * i,
          color: (0,cjs.interpolateColors)(i, [0, 4], ["#fff", "#fff"])
        }
      );
    }).reverse()
  );
};

;// CONCATENATED MODULE: ./remotion/MyComp/TextFade.tsx


const TextFade = ({ children }) => {
  const { fps } = (0,cjs.useVideoConfig)();
  const frame = (0,cjs.useCurrentFrame)();
  const progress = (0,cjs.spring)({
    fps,
    frame,
    config: {
      damping: 200
    },
    durationInFrames: 80
  });
  const rightStop = (0,cjs.interpolate)(progress, [0, 1], [200, 0]);
  const leftStop = Math.max(0, rightStop - 60);
  const maskImage = `linear-gradient(-45deg, transparent ${leftStop}%, black ${rightStop}%)`;
  const content = (0,react.useMemo)(() => {
    return {
      maskImage,
      WebkitMaskImage: maskImage
    };
  }, [maskImage]);
  return /* @__PURE__ */ react.createElement(cjs.AbsoluteFill, null, /* @__PURE__ */ react.createElement(cjs.AbsoluteFill, { className: "justify-center items-center" }, /* @__PURE__ */ react.createElement("div", { style: content }, children)));
};

;// CONCATENATED MODULE: ./remotion/MyComp/Main.tsx






loadFont();
const Main = ({ title }) => {
  const frame = (0,cjs.useCurrentFrame)();
  const { fps } = (0,cjs.useVideoConfig)();
  const transitionStart = 2 * fps;
  const transitionDuration = 1 * fps;
  const logoOut = (0,cjs.spring)({
    fps,
    frame,
    config: {
      damping: 200
    },
    durationInFrames: transitionDuration,
    delay: transitionStart
  });
  return /* @__PURE__ */ react.createElement(cjs.AbsoluteFill, { className: "bg-white" }, /* @__PURE__ */ react.createElement(cjs.Sequence, { durationInFrames: transitionStart + transitionDuration }, /* @__PURE__ */ react.createElement(Rings, { outProgress: logoOut }), /* @__PURE__ */ react.createElement(cjs.AbsoluteFill, { className: "justify-center items-center" }, /* @__PURE__ */ react.createElement(NextLogo, { outProgress: logoOut }))), /* @__PURE__ */ react.createElement(cjs.Sequence, { from: transitionStart + transitionDuration / 2 }, /* @__PURE__ */ react.createElement(TextFade, null, /* @__PURE__ */ react.createElement(
    "h1",
    {
      className: "text-[70px] font-bold",
      style: {
        fontFamily: fontFamily
      }
    },
    title
  ))));
};

;// CONCATENATED MODULE: ./node_modules/zod/lib/index.mjs
var util;
(function (util) {
    util.assertEqual = (val) => val;
    function assertIs(_arg) { }
    util.assertIs = assertIs;
    function assertNever(_x) {
        throw new Error();
    }
    util.assertNever = assertNever;
    util.arrayToEnum = (items) => {
        const obj = {};
        for (const item of items) {
            obj[item] = item;
        }
        return obj;
    };
    util.getValidEnumValues = (obj) => {
        const validKeys = util.objectKeys(obj).filter((k) => typeof obj[obj[k]] !== "number");
        const filtered = {};
        for (const k of validKeys) {
            filtered[k] = obj[k];
        }
        return util.objectValues(filtered);
    };
    util.objectValues = (obj) => {
        return util.objectKeys(obj).map(function (e) {
            return obj[e];
        });
    };
    util.objectKeys = typeof Object.keys === "function" // eslint-disable-line ban/ban
        ? (obj) => Object.keys(obj) // eslint-disable-line ban/ban
        : (object) => {
            const keys = [];
            for (const key in object) {
                if (Object.prototype.hasOwnProperty.call(object, key)) {
                    keys.push(key);
                }
            }
            return keys;
        };
    util.find = (arr, checker) => {
        for (const item of arr) {
            if (checker(item))
                return item;
        }
        return undefined;
    };
    util.isInteger = typeof Number.isInteger === "function"
        ? (val) => Number.isInteger(val) // eslint-disable-line ban/ban
        : (val) => typeof val === "number" && isFinite(val) && Math.floor(val) === val;
    function joinValues(array, separator = " | ") {
        return array
            .map((val) => (typeof val === "string" ? `'${val}'` : val))
            .join(separator);
    }
    util.joinValues = joinValues;
    util.jsonStringifyReplacer = (_, value) => {
        if (typeof value === "bigint") {
            return value.toString();
        }
        return value;
    };
})(util || (util = {}));
var objectUtil;
(function (objectUtil) {
    objectUtil.mergeShapes = (first, second) => {
        return {
            ...first,
            ...second, // second overwrites first
        };
    };
})(objectUtil || (objectUtil = {}));
const ZodParsedType = util.arrayToEnum([
    "string",
    "nan",
    "number",
    "integer",
    "float",
    "boolean",
    "date",
    "bigint",
    "symbol",
    "function",
    "undefined",
    "null",
    "array",
    "object",
    "unknown",
    "promise",
    "void",
    "never",
    "map",
    "set",
]);
const getParsedType = (data) => {
    const t = typeof data;
    switch (t) {
        case "undefined":
            return ZodParsedType.undefined;
        case "string":
            return ZodParsedType.string;
        case "number":
            return isNaN(data) ? ZodParsedType.nan : ZodParsedType.number;
        case "boolean":
            return ZodParsedType.boolean;
        case "function":
            return ZodParsedType.function;
        case "bigint":
            return ZodParsedType.bigint;
        case "symbol":
            return ZodParsedType.symbol;
        case "object":
            if (Array.isArray(data)) {
                return ZodParsedType.array;
            }
            if (data === null) {
                return ZodParsedType.null;
            }
            if (data.then &&
                typeof data.then === "function" &&
                data.catch &&
                typeof data.catch === "function") {
                return ZodParsedType.promise;
            }
            if (typeof Map !== "undefined" && data instanceof Map) {
                return ZodParsedType.map;
            }
            if (typeof Set !== "undefined" && data instanceof Set) {
                return ZodParsedType.set;
            }
            if (typeof Date !== "undefined" && data instanceof Date) {
                return ZodParsedType.date;
            }
            return ZodParsedType.object;
        default:
            return ZodParsedType.unknown;
    }
};

const ZodIssueCode = util.arrayToEnum([
    "invalid_type",
    "invalid_literal",
    "custom",
    "invalid_union",
    "invalid_union_discriminator",
    "invalid_enum_value",
    "unrecognized_keys",
    "invalid_arguments",
    "invalid_return_type",
    "invalid_date",
    "invalid_string",
    "too_small",
    "too_big",
    "invalid_intersection_types",
    "not_multiple_of",
    "not_finite",
]);
const quotelessJson = (obj) => {
    const json = JSON.stringify(obj, null, 2);
    return json.replace(/"([^"]+)":/g, "$1:");
};
class ZodError extends Error {
    constructor(issues) {
        super();
        this.issues = [];
        this.addIssue = (sub) => {
            this.issues = [...this.issues, sub];
        };
        this.addIssues = (subs = []) => {
            this.issues = [...this.issues, ...subs];
        };
        const actualProto = new.target.prototype;
        if (Object.setPrototypeOf) {
            // eslint-disable-next-line ban/ban
            Object.setPrototypeOf(this, actualProto);
        }
        else {
            this.__proto__ = actualProto;
        }
        this.name = "ZodError";
        this.issues = issues;
    }
    get errors() {
        return this.issues;
    }
    format(_mapper) {
        const mapper = _mapper ||
            function (issue) {
                return issue.message;
            };
        const fieldErrors = { _errors: [] };
        const processError = (error) => {
            for (const issue of error.issues) {
                if (issue.code === "invalid_union") {
                    issue.unionErrors.map(processError);
                }
                else if (issue.code === "invalid_return_type") {
                    processError(issue.returnTypeError);
                }
                else if (issue.code === "invalid_arguments") {
                    processError(issue.argumentsError);
                }
                else if (issue.path.length === 0) {
                    fieldErrors._errors.push(mapper(issue));
                }
                else {
                    let curr = fieldErrors;
                    let i = 0;
                    while (i < issue.path.length) {
                        const el = issue.path[i];
                        const terminal = i === issue.path.length - 1;
                        if (!terminal) {
                            curr[el] = curr[el] || { _errors: [] };
                            // if (typeof el === "string") {
                            //   curr[el] = curr[el] || { _errors: [] };
                            // } else if (typeof el === "number") {
                            //   const errorArray: any = [];
                            //   errorArray._errors = [];
                            //   curr[el] = curr[el] || errorArray;
                            // }
                        }
                        else {
                            curr[el] = curr[el] || { _errors: [] };
                            curr[el]._errors.push(mapper(issue));
                        }
                        curr = curr[el];
                        i++;
                    }
                }
            }
        };
        processError(this);
        return fieldErrors;
    }
    toString() {
        return this.message;
    }
    get message() {
        return JSON.stringify(this.issues, util.jsonStringifyReplacer, 2);
    }
    get isEmpty() {
        return this.issues.length === 0;
    }
    flatten(mapper = (issue) => issue.message) {
        const fieldErrors = {};
        const formErrors = [];
        for (const sub of this.issues) {
            if (sub.path.length > 0) {
                fieldErrors[sub.path[0]] = fieldErrors[sub.path[0]] || [];
                fieldErrors[sub.path[0]].push(mapper(sub));
            }
            else {
                formErrors.push(mapper(sub));
            }
        }
        return { formErrors, fieldErrors };
    }
    get formErrors() {
        return this.flatten();
    }
}
ZodError.create = (issues) => {
    const error = new ZodError(issues);
    return error;
};

const errorMap = (issue, _ctx) => {
    let message;
    switch (issue.code) {
        case ZodIssueCode.invalid_type:
            if (issue.received === ZodParsedType.undefined) {
                message = "Required";
            }
            else {
                message = `Expected ${issue.expected}, received ${issue.received}`;
            }
            break;
        case ZodIssueCode.invalid_literal:
            message = `Invalid literal value, expected ${JSON.stringify(issue.expected, util.jsonStringifyReplacer)}`;
            break;
        case ZodIssueCode.unrecognized_keys:
            message = `Unrecognized key(s) in object: ${util.joinValues(issue.keys, ", ")}`;
            break;
        case ZodIssueCode.invalid_union:
            message = `Invalid input`;
            break;
        case ZodIssueCode.invalid_union_discriminator:
            message = `Invalid discriminator value. Expected ${util.joinValues(issue.options)}`;
            break;
        case ZodIssueCode.invalid_enum_value:
            message = `Invalid enum value. Expected ${util.joinValues(issue.options)}, received '${issue.received}'`;
            break;
        case ZodIssueCode.invalid_arguments:
            message = `Invalid function arguments`;
            break;
        case ZodIssueCode.invalid_return_type:
            message = `Invalid function return type`;
            break;
        case ZodIssueCode.invalid_date:
            message = `Invalid date`;
            break;
        case ZodIssueCode.invalid_string:
            if (typeof issue.validation === "object") {
                if ("includes" in issue.validation) {
                    message = `Invalid input: must include "${issue.validation.includes}"`;
                    if (typeof issue.validation.position === "number") {
                        message = `${message} at one or more positions greater than or equal to ${issue.validation.position}`;
                    }
                }
                else if ("startsWith" in issue.validation) {
                    message = `Invalid input: must start with "${issue.validation.startsWith}"`;
                }
                else if ("endsWith" in issue.validation) {
                    message = `Invalid input: must end with "${issue.validation.endsWith}"`;
                }
                else {
                    util.assertNever(issue.validation);
                }
            }
            else if (issue.validation !== "regex") {
                message = `Invalid ${issue.validation}`;
            }
            else {
                message = "Invalid";
            }
            break;
        case ZodIssueCode.too_small:
            if (issue.type === "array")
                message = `Array must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `more than`} ${issue.minimum} element(s)`;
            else if (issue.type === "string")
                message = `String must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `over`} ${issue.minimum} character(s)`;
            else if (issue.type === "number")
                message = `Number must be ${issue.exact
                    ? `exactly equal to `
                    : issue.inclusive
                        ? `greater than or equal to `
                        : `greater than `}${issue.minimum}`;
            else if (issue.type === "date")
                message = `Date must be ${issue.exact
                    ? `exactly equal to `
                    : issue.inclusive
                        ? `greater than or equal to `
                        : `greater than `}${new Date(Number(issue.minimum))}`;
            else
                message = "Invalid input";
            break;
        case ZodIssueCode.too_big:
            if (issue.type === "array")
                message = `Array must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `less than`} ${issue.maximum} element(s)`;
            else if (issue.type === "string")
                message = `String must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `under`} ${issue.maximum} character(s)`;
            else if (issue.type === "number")
                message = `Number must be ${issue.exact
                    ? `exactly`
                    : issue.inclusive
                        ? `less than or equal to`
                        : `less than`} ${issue.maximum}`;
            else if (issue.type === "bigint")
                message = `BigInt must be ${issue.exact
                    ? `exactly`
                    : issue.inclusive
                        ? `less than or equal to`
                        : `less than`} ${issue.maximum}`;
            else if (issue.type === "date")
                message = `Date must be ${issue.exact
                    ? `exactly`
                    : issue.inclusive
                        ? `smaller than or equal to`
                        : `smaller than`} ${new Date(Number(issue.maximum))}`;
            else
                message = "Invalid input";
            break;
        case ZodIssueCode.custom:
            message = `Invalid input`;
            break;
        case ZodIssueCode.invalid_intersection_types:
            message = `Intersection results could not be merged`;
            break;
        case ZodIssueCode.not_multiple_of:
            message = `Number must be a multiple of ${issue.multipleOf}`;
            break;
        case ZodIssueCode.not_finite:
            message = "Number must be finite";
            break;
        default:
            message = _ctx.defaultError;
            util.assertNever(issue);
    }
    return { message };
};

let overrideErrorMap = errorMap;
function setErrorMap(map) {
    overrideErrorMap = map;
}
function getErrorMap() {
    return overrideErrorMap;
}

const makeIssue = (params) => {
    const { data, path, errorMaps, issueData } = params;
    const fullPath = [...path, ...(issueData.path || [])];
    const fullIssue = {
        ...issueData,
        path: fullPath,
    };
    let errorMessage = "";
    const maps = errorMaps
        .filter((m) => !!m)
        .slice()
        .reverse();
    for (const map of maps) {
        errorMessage = map(fullIssue, { data, defaultError: errorMessage }).message;
    }
    return {
        ...issueData,
        path: fullPath,
        message: issueData.message || errorMessage,
    };
};
const EMPTY_PATH = [];
function addIssueToContext(ctx, issueData) {
    const issue = makeIssue({
        issueData: issueData,
        data: ctx.data,
        path: ctx.path,
        errorMaps: [
            ctx.common.contextualErrorMap,
            ctx.schemaErrorMap,
            getErrorMap(),
            errorMap, // then global default map
        ].filter((x) => !!x),
    });
    ctx.common.issues.push(issue);
}
class ParseStatus {
    constructor() {
        this.value = "valid";
    }
    dirty() {
        if (this.value === "valid")
            this.value = "dirty";
    }
    abort() {
        if (this.value !== "aborted")
            this.value = "aborted";
    }
    static mergeArray(status, results) {
        const arrayValue = [];
        for (const s of results) {
            if (s.status === "aborted")
                return INVALID;
            if (s.status === "dirty")
                status.dirty();
            arrayValue.push(s.value);
        }
        return { status: status.value, value: arrayValue };
    }
    static async mergeObjectAsync(status, pairs) {
        const syncPairs = [];
        for (const pair of pairs) {
            syncPairs.push({
                key: await pair.key,
                value: await pair.value,
            });
        }
        return ParseStatus.mergeObjectSync(status, syncPairs);
    }
    static mergeObjectSync(status, pairs) {
        const finalObject = {};
        for (const pair of pairs) {
            const { key, value } = pair;
            if (key.status === "aborted")
                return INVALID;
            if (value.status === "aborted")
                return INVALID;
            if (key.status === "dirty")
                status.dirty();
            if (value.status === "dirty")
                status.dirty();
            if (key.value !== "__proto__" &&
                (typeof value.value !== "undefined" || pair.alwaysSet)) {
                finalObject[key.value] = value.value;
            }
        }
        return { status: status.value, value: finalObject };
    }
}
const INVALID = Object.freeze({
    status: "aborted",
});
const DIRTY = (value) => ({ status: "dirty", value });
const OK = (value) => ({ status: "valid", value });
const isAborted = (x) => x.status === "aborted";
const isDirty = (x) => x.status === "dirty";
const isValid = (x) => x.status === "valid";
const isAsync = (x) => typeof Promise !== "undefined" && x instanceof Promise;

var errorUtil;
(function (errorUtil) {
    errorUtil.errToObj = (message) => typeof message === "string" ? { message } : message || {};
    errorUtil.toString = (message) => typeof message === "string" ? message : message === null || message === void 0 ? void 0 : message.message;
})(errorUtil || (errorUtil = {}));

class ParseInputLazyPath {
    constructor(parent, value, path, key) {
        this._cachedPath = [];
        this.parent = parent;
        this.data = value;
        this._path = path;
        this._key = key;
    }
    get path() {
        if (!this._cachedPath.length) {
            if (this._key instanceof Array) {
                this._cachedPath.push(...this._path, ...this._key);
            }
            else {
                this._cachedPath.push(...this._path, this._key);
            }
        }
        return this._cachedPath;
    }
}
const handleResult = (ctx, result) => {
    if (isValid(result)) {
        return { success: true, data: result.value };
    }
    else {
        if (!ctx.common.issues.length) {
            throw new Error("Validation failed but no issues detected.");
        }
        return {
            success: false,
            get error() {
                if (this._error)
                    return this._error;
                const error = new ZodError(ctx.common.issues);
                this._error = error;
                return this._error;
            },
        };
    }
};
function processCreateParams(params) {
    if (!params)
        return {};
    const { errorMap, invalid_type_error, required_error, description } = params;
    if (errorMap && (invalid_type_error || required_error)) {
        throw new Error(`Can't use "invalid_type_error" or "required_error" in conjunction with custom error map.`);
    }
    if (errorMap)
        return { errorMap: errorMap, description };
    const customMap = (iss, ctx) => {
        if (iss.code !== "invalid_type")
            return { message: ctx.defaultError };
        if (typeof ctx.data === "undefined") {
            return { message: required_error !== null && required_error !== void 0 ? required_error : ctx.defaultError };
        }
        return { message: invalid_type_error !== null && invalid_type_error !== void 0 ? invalid_type_error : ctx.defaultError };
    };
    return { errorMap: customMap, description };
}
class ZodType {
    constructor(def) {
        /** Alias of safeParseAsync */
        this.spa = this.safeParseAsync;
        this._def = def;
        this.parse = this.parse.bind(this);
        this.safeParse = this.safeParse.bind(this);
        this.parseAsync = this.parseAsync.bind(this);
        this.safeParseAsync = this.safeParseAsync.bind(this);
        this.spa = this.spa.bind(this);
        this.refine = this.refine.bind(this);
        this.refinement = this.refinement.bind(this);
        this.superRefine = this.superRefine.bind(this);
        this.optional = this.optional.bind(this);
        this.nullable = this.nullable.bind(this);
        this.nullish = this.nullish.bind(this);
        this.array = this.array.bind(this);
        this.promise = this.promise.bind(this);
        this.or = this.or.bind(this);
        this.and = this.and.bind(this);
        this.transform = this.transform.bind(this);
        this.brand = this.brand.bind(this);
        this.default = this.default.bind(this);
        this.catch = this.catch.bind(this);
        this.describe = this.describe.bind(this);
        this.pipe = this.pipe.bind(this);
        this.readonly = this.readonly.bind(this);
        this.isNullable = this.isNullable.bind(this);
        this.isOptional = this.isOptional.bind(this);
    }
    get description() {
        return this._def.description;
    }
    _getType(input) {
        return getParsedType(input.data);
    }
    _getOrReturnCtx(input, ctx) {
        return (ctx || {
            common: input.parent.common,
            data: input.data,
            parsedType: getParsedType(input.data),
            schemaErrorMap: this._def.errorMap,
            path: input.path,
            parent: input.parent,
        });
    }
    _processInputParams(input) {
        return {
            status: new ParseStatus(),
            ctx: {
                common: input.parent.common,
                data: input.data,
                parsedType: getParsedType(input.data),
                schemaErrorMap: this._def.errorMap,
                path: input.path,
                parent: input.parent,
            },
        };
    }
    _parseSync(input) {
        const result = this._parse(input);
        if (isAsync(result)) {
            throw new Error("Synchronous parse encountered promise.");
        }
        return result;
    }
    _parseAsync(input) {
        const result = this._parse(input);
        return Promise.resolve(result);
    }
    parse(data, params) {
        const result = this.safeParse(data, params);
        if (result.success)
            return result.data;
        throw result.error;
    }
    safeParse(data, params) {
        var _a;
        const ctx = {
            common: {
                issues: [],
                async: (_a = params === null || params === void 0 ? void 0 : params.async) !== null && _a !== void 0 ? _a : false,
                contextualErrorMap: params === null || params === void 0 ? void 0 : params.errorMap,
            },
            path: (params === null || params === void 0 ? void 0 : params.path) || [],
            schemaErrorMap: this._def.errorMap,
            parent: null,
            data,
            parsedType: getParsedType(data),
        };
        const result = this._parseSync({ data, path: ctx.path, parent: ctx });
        return handleResult(ctx, result);
    }
    async parseAsync(data, params) {
        const result = await this.safeParseAsync(data, params);
        if (result.success)
            return result.data;
        throw result.error;
    }
    async safeParseAsync(data, params) {
        const ctx = {
            common: {
                issues: [],
                contextualErrorMap: params === null || params === void 0 ? void 0 : params.errorMap,
                async: true,
            },
            path: (params === null || params === void 0 ? void 0 : params.path) || [],
            schemaErrorMap: this._def.errorMap,
            parent: null,
            data,
            parsedType: getParsedType(data),
        };
        const maybeAsyncResult = this._parse({ data, path: ctx.path, parent: ctx });
        const result = await (isAsync(maybeAsyncResult)
            ? maybeAsyncResult
            : Promise.resolve(maybeAsyncResult));
        return handleResult(ctx, result);
    }
    refine(check, message) {
        const getIssueProperties = (val) => {
            if (typeof message === "string" || typeof message === "undefined") {
                return { message };
            }
            else if (typeof message === "function") {
                return message(val);
            }
            else {
                return message;
            }
        };
        return this._refinement((val, ctx) => {
            const result = check(val);
            const setError = () => ctx.addIssue({
                code: ZodIssueCode.custom,
                ...getIssueProperties(val),
            });
            if (typeof Promise !== "undefined" && result instanceof Promise) {
                return result.then((data) => {
                    if (!data) {
                        setError();
                        return false;
                    }
                    else {
                        return true;
                    }
                });
            }
            if (!result) {
                setError();
                return false;
            }
            else {
                return true;
            }
        });
    }
    refinement(check, refinementData) {
        return this._refinement((val, ctx) => {
            if (!check(val)) {
                ctx.addIssue(typeof refinementData === "function"
                    ? refinementData(val, ctx)
                    : refinementData);
                return false;
            }
            else {
                return true;
            }
        });
    }
    _refinement(refinement) {
        return new ZodEffects({
            schema: this,
            typeName: ZodFirstPartyTypeKind.ZodEffects,
            effect: { type: "refinement", refinement },
        });
    }
    superRefine(refinement) {
        return this._refinement(refinement);
    }
    optional() {
        return ZodOptional.create(this, this._def);
    }
    nullable() {
        return ZodNullable.create(this, this._def);
    }
    nullish() {
        return this.nullable().optional();
    }
    array() {
        return ZodArray.create(this, this._def);
    }
    promise() {
        return ZodPromise.create(this, this._def);
    }
    or(option) {
        return ZodUnion.create([this, option], this._def);
    }
    and(incoming) {
        return ZodIntersection.create(this, incoming, this._def);
    }
    transform(transform) {
        return new ZodEffects({
            ...processCreateParams(this._def),
            schema: this,
            typeName: ZodFirstPartyTypeKind.ZodEffects,
            effect: { type: "transform", transform },
        });
    }
    default(def) {
        const defaultValueFunc = typeof def === "function" ? def : () => def;
        return new ZodDefault({
            ...processCreateParams(this._def),
            innerType: this,
            defaultValue: defaultValueFunc,
            typeName: ZodFirstPartyTypeKind.ZodDefault,
        });
    }
    brand() {
        return new ZodBranded({
            typeName: ZodFirstPartyTypeKind.ZodBranded,
            type: this,
            ...processCreateParams(this._def),
        });
    }
    catch(def) {
        const catchValueFunc = typeof def === "function" ? def : () => def;
        return new ZodCatch({
            ...processCreateParams(this._def),
            innerType: this,
            catchValue: catchValueFunc,
            typeName: ZodFirstPartyTypeKind.ZodCatch,
        });
    }
    describe(description) {
        const This = this.constructor;
        return new This({
            ...this._def,
            description,
        });
    }
    pipe(target) {
        return ZodPipeline.create(this, target);
    }
    readonly() {
        return ZodReadonly.create(this);
    }
    isOptional() {
        return this.safeParse(undefined).success;
    }
    isNullable() {
        return this.safeParse(null).success;
    }
}
const cuidRegex = /^c[^\s-]{8,}$/i;
const cuid2Regex = /^[a-z][a-z0-9]*$/;
const ulidRegex = /^[0-9A-HJKMNP-TV-Z]{26}$/;
// const uuidRegex =
//   /^([a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[a-f0-9]{4}-[a-f0-9]{12}|00000000-0000-0000-0000-000000000000)$/i;
const uuidRegex = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/i;
// from https://stackoverflow.com/a/46181/1550155
// old version: too slow, didn't support unicode
// const emailRegex = /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))$/i;
//old email regex
// const emailRegex = /^(([^<>()[\].,;:\s@"]+(\.[^<>()[\].,;:\s@"]+)*)|(".+"))@((?!-)([^<>()[\].,;:\s@"]+\.)+[^<>()[\].,;:\s@"]{1,})[^-<>()[\].,;:\s@"]$/i;
// eslint-disable-next-line
// const emailRegex =
//   /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[(((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2}))\.){3}((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2}))\])|(\[IPv6:(([a-f0-9]{1,4}:){7}|::([a-f0-9]{1,4}:){0,6}|([a-f0-9]{1,4}:){1}:([a-f0-9]{1,4}:){0,5}|([a-f0-9]{1,4}:){2}:([a-f0-9]{1,4}:){0,4}|([a-f0-9]{1,4}:){3}:([a-f0-9]{1,4}:){0,3}|([a-f0-9]{1,4}:){4}:([a-f0-9]{1,4}:){0,2}|([a-f0-9]{1,4}:){5}:([a-f0-9]{1,4}:){0,1})([a-f0-9]{1,4}|(((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2}))\.){3}((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2})))\])|([A-Za-z0-9]([A-Za-z0-9-]*[A-Za-z0-9])*(\.[A-Za-z]{2,})+))$/;
// const emailRegex =
//   /^[a-zA-Z0-9\.\!\#\$\%\&\'\*\+\/\=\?\^\_\`\{\|\}\~\-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
// const emailRegex =
//   /^(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])$/i;
const emailRegex = /^(?!\.)(?!.*\.\.)([A-Z0-9_+-\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i;
// const emailRegex =
//   /^[a-z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-z0-9-]+(?:\.[a-z0-9\-]+)*$/i;
// from https://thekevinscott.com/emojis-in-javascript/#writing-a-regular-expression
const _emojiRegex = `^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$`;
let emojiRegex;
const ipv4Regex = /^(((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2}))\.){3}((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2}))$/;
const ipv6Regex = /^(([a-f0-9]{1,4}:){7}|::([a-f0-9]{1,4}:){0,6}|([a-f0-9]{1,4}:){1}:([a-f0-9]{1,4}:){0,5}|([a-f0-9]{1,4}:){2}:([a-f0-9]{1,4}:){0,4}|([a-f0-9]{1,4}:){3}:([a-f0-9]{1,4}:){0,3}|([a-f0-9]{1,4}:){4}:([a-f0-9]{1,4}:){0,2}|([a-f0-9]{1,4}:){5}:([a-f0-9]{1,4}:){0,1})([a-f0-9]{1,4}|(((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2}))\.){3}((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2})))$/;
// Adapted from https://stackoverflow.com/a/3143231
const datetimeRegex = (args) => {
    if (args.precision) {
        if (args.offset) {
            return new RegExp(`^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{${args.precision}}(([+-]\\d{2}(:?\\d{2})?)|Z)$`);
        }
        else {
            return new RegExp(`^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{${args.precision}}Z$`);
        }
    }
    else if (args.precision === 0) {
        if (args.offset) {
            return new RegExp(`^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(([+-]\\d{2}(:?\\d{2})?)|Z)$`);
        }
        else {
            return new RegExp(`^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}Z$`);
        }
    }
    else {
        if (args.offset) {
            return new RegExp(`^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(\\.\\d+)?(([+-]\\d{2}(:?\\d{2})?)|Z)$`);
        }
        else {
            return new RegExp(`^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(\\.\\d+)?Z$`);
        }
    }
};
function isValidIP(ip, version) {
    if ((version === "v4" || !version) && ipv4Regex.test(ip)) {
        return true;
    }
    if ((version === "v6" || !version) && ipv6Regex.test(ip)) {
        return true;
    }
    return false;
}
class ZodString extends ZodType {
    _parse(input) {
        if (this._def.coerce) {
            input.data = String(input.data);
        }
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.string) {
            const ctx = this._getOrReturnCtx(input);
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.string,
                received: ctx.parsedType,
            }
            //
            );
            return INVALID;
        }
        const status = new ParseStatus();
        let ctx = undefined;
        for (const check of this._def.checks) {
            if (check.kind === "min") {
                if (input.data.length < check.value) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.too_small,
                        minimum: check.value,
                        type: "string",
                        inclusive: true,
                        exact: false,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "max") {
                if (input.data.length > check.value) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.too_big,
                        maximum: check.value,
                        type: "string",
                        inclusive: true,
                        exact: false,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "length") {
                const tooBig = input.data.length > check.value;
                const tooSmall = input.data.length < check.value;
                if (tooBig || tooSmall) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    if (tooBig) {
                        addIssueToContext(ctx, {
                            code: ZodIssueCode.too_big,
                            maximum: check.value,
                            type: "string",
                            inclusive: true,
                            exact: true,
                            message: check.message,
                        });
                    }
                    else if (tooSmall) {
                        addIssueToContext(ctx, {
                            code: ZodIssueCode.too_small,
                            minimum: check.value,
                            type: "string",
                            inclusive: true,
                            exact: true,
                            message: check.message,
                        });
                    }
                    status.dirty();
                }
            }
            else if (check.kind === "email") {
                if (!emailRegex.test(input.data)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        validation: "email",
                        code: ZodIssueCode.invalid_string,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "emoji") {
                if (!emojiRegex) {
                    emojiRegex = new RegExp(_emojiRegex, "u");
                }
                if (!emojiRegex.test(input.data)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        validation: "emoji",
                        code: ZodIssueCode.invalid_string,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "uuid") {
                if (!uuidRegex.test(input.data)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        validation: "uuid",
                        code: ZodIssueCode.invalid_string,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "cuid") {
                if (!cuidRegex.test(input.data)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        validation: "cuid",
                        code: ZodIssueCode.invalid_string,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "cuid2") {
                if (!cuid2Regex.test(input.data)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        validation: "cuid2",
                        code: ZodIssueCode.invalid_string,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "ulid") {
                if (!ulidRegex.test(input.data)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        validation: "ulid",
                        code: ZodIssueCode.invalid_string,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "url") {
                try {
                    new URL(input.data);
                }
                catch (_a) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        validation: "url",
                        code: ZodIssueCode.invalid_string,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "regex") {
                check.regex.lastIndex = 0;
                const testResult = check.regex.test(input.data);
                if (!testResult) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        validation: "regex",
                        code: ZodIssueCode.invalid_string,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "trim") {
                input.data = input.data.trim();
            }
            else if (check.kind === "includes") {
                if (!input.data.includes(check.value, check.position)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.invalid_string,
                        validation: { includes: check.value, position: check.position },
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "toLowerCase") {
                input.data = input.data.toLowerCase();
            }
            else if (check.kind === "toUpperCase") {
                input.data = input.data.toUpperCase();
            }
            else if (check.kind === "startsWith") {
                if (!input.data.startsWith(check.value)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.invalid_string,
                        validation: { startsWith: check.value },
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "endsWith") {
                if (!input.data.endsWith(check.value)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.invalid_string,
                        validation: { endsWith: check.value },
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "datetime") {
                const regex = datetimeRegex(check);
                if (!regex.test(input.data)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.invalid_string,
                        validation: "datetime",
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "ip") {
                if (!isValidIP(input.data, check.version)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        validation: "ip",
                        code: ZodIssueCode.invalid_string,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else {
                util.assertNever(check);
            }
        }
        return { status: status.value, value: input.data };
    }
    _regex(regex, validation, message) {
        return this.refinement((data) => regex.test(data), {
            validation,
            code: ZodIssueCode.invalid_string,
            ...errorUtil.errToObj(message),
        });
    }
    _addCheck(check) {
        return new ZodString({
            ...this._def,
            checks: [...this._def.checks, check],
        });
    }
    email(message) {
        return this._addCheck({ kind: "email", ...errorUtil.errToObj(message) });
    }
    url(message) {
        return this._addCheck({ kind: "url", ...errorUtil.errToObj(message) });
    }
    emoji(message) {
        return this._addCheck({ kind: "emoji", ...errorUtil.errToObj(message) });
    }
    uuid(message) {
        return this._addCheck({ kind: "uuid", ...errorUtil.errToObj(message) });
    }
    cuid(message) {
        return this._addCheck({ kind: "cuid", ...errorUtil.errToObj(message) });
    }
    cuid2(message) {
        return this._addCheck({ kind: "cuid2", ...errorUtil.errToObj(message) });
    }
    ulid(message) {
        return this._addCheck({ kind: "ulid", ...errorUtil.errToObj(message) });
    }
    ip(options) {
        return this._addCheck({ kind: "ip", ...errorUtil.errToObj(options) });
    }
    datetime(options) {
        var _a;
        if (typeof options === "string") {
            return this._addCheck({
                kind: "datetime",
                precision: null,
                offset: false,
                message: options,
            });
        }
        return this._addCheck({
            kind: "datetime",
            precision: typeof (options === null || options === void 0 ? void 0 : options.precision) === "undefined" ? null : options === null || options === void 0 ? void 0 : options.precision,
            offset: (_a = options === null || options === void 0 ? void 0 : options.offset) !== null && _a !== void 0 ? _a : false,
            ...errorUtil.errToObj(options === null || options === void 0 ? void 0 : options.message),
        });
    }
    regex(regex, message) {
        return this._addCheck({
            kind: "regex",
            regex: regex,
            ...errorUtil.errToObj(message),
        });
    }
    includes(value, options) {
        return this._addCheck({
            kind: "includes",
            value: value,
            position: options === null || options === void 0 ? void 0 : options.position,
            ...errorUtil.errToObj(options === null || options === void 0 ? void 0 : options.message),
        });
    }
    startsWith(value, message) {
        return this._addCheck({
            kind: "startsWith",
            value: value,
            ...errorUtil.errToObj(message),
        });
    }
    endsWith(value, message) {
        return this._addCheck({
            kind: "endsWith",
            value: value,
            ...errorUtil.errToObj(message),
        });
    }
    min(minLength, message) {
        return this._addCheck({
            kind: "min",
            value: minLength,
            ...errorUtil.errToObj(message),
        });
    }
    max(maxLength, message) {
        return this._addCheck({
            kind: "max",
            value: maxLength,
            ...errorUtil.errToObj(message),
        });
    }
    length(len, message) {
        return this._addCheck({
            kind: "length",
            value: len,
            ...errorUtil.errToObj(message),
        });
    }
    /**
     * @deprecated Use z.string().min(1) instead.
     * @see {@link ZodString.min}
     */
    nonempty(message) {
        return this.min(1, errorUtil.errToObj(message));
    }
    trim() {
        return new ZodString({
            ...this._def,
            checks: [...this._def.checks, { kind: "trim" }],
        });
    }
    toLowerCase() {
        return new ZodString({
            ...this._def,
            checks: [...this._def.checks, { kind: "toLowerCase" }],
        });
    }
    toUpperCase() {
        return new ZodString({
            ...this._def,
            checks: [...this._def.checks, { kind: "toUpperCase" }],
        });
    }
    get isDatetime() {
        return !!this._def.checks.find((ch) => ch.kind === "datetime");
    }
    get isEmail() {
        return !!this._def.checks.find((ch) => ch.kind === "email");
    }
    get isURL() {
        return !!this._def.checks.find((ch) => ch.kind === "url");
    }
    get isEmoji() {
        return !!this._def.checks.find((ch) => ch.kind === "emoji");
    }
    get isUUID() {
        return !!this._def.checks.find((ch) => ch.kind === "uuid");
    }
    get isCUID() {
        return !!this._def.checks.find((ch) => ch.kind === "cuid");
    }
    get isCUID2() {
        return !!this._def.checks.find((ch) => ch.kind === "cuid2");
    }
    get isULID() {
        return !!this._def.checks.find((ch) => ch.kind === "ulid");
    }
    get isIP() {
        return !!this._def.checks.find((ch) => ch.kind === "ip");
    }
    get minLength() {
        let min = null;
        for (const ch of this._def.checks) {
            if (ch.kind === "min") {
                if (min === null || ch.value > min)
                    min = ch.value;
            }
        }
        return min;
    }
    get maxLength() {
        let max = null;
        for (const ch of this._def.checks) {
            if (ch.kind === "max") {
                if (max === null || ch.value < max)
                    max = ch.value;
            }
        }
        return max;
    }
}
ZodString.create = (params) => {
    var _a;
    return new ZodString({
        checks: [],
        typeName: ZodFirstPartyTypeKind.ZodString,
        coerce: (_a = params === null || params === void 0 ? void 0 : params.coerce) !== null && _a !== void 0 ? _a : false,
        ...processCreateParams(params),
    });
};
// https://stackoverflow.com/questions/3966484/why-does-modulus-operator-return-fractional-number-in-javascript/31711034#31711034
function floatSafeRemainder(val, step) {
    const valDecCount = (val.toString().split(".")[1] || "").length;
    const stepDecCount = (step.toString().split(".")[1] || "").length;
    const decCount = valDecCount > stepDecCount ? valDecCount : stepDecCount;
    const valInt = parseInt(val.toFixed(decCount).replace(".", ""));
    const stepInt = parseInt(step.toFixed(decCount).replace(".", ""));
    return (valInt % stepInt) / Math.pow(10, decCount);
}
class ZodNumber extends ZodType {
    constructor() {
        super(...arguments);
        this.min = this.gte;
        this.max = this.lte;
        this.step = this.multipleOf;
    }
    _parse(input) {
        if (this._def.coerce) {
            input.data = Number(input.data);
        }
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.number) {
            const ctx = this._getOrReturnCtx(input);
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.number,
                received: ctx.parsedType,
            });
            return INVALID;
        }
        let ctx = undefined;
        const status = new ParseStatus();
        for (const check of this._def.checks) {
            if (check.kind === "int") {
                if (!util.isInteger(input.data)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.invalid_type,
                        expected: "integer",
                        received: "float",
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "min") {
                const tooSmall = check.inclusive
                    ? input.data < check.value
                    : input.data <= check.value;
                if (tooSmall) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.too_small,
                        minimum: check.value,
                        type: "number",
                        inclusive: check.inclusive,
                        exact: false,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "max") {
                const tooBig = check.inclusive
                    ? input.data > check.value
                    : input.data >= check.value;
                if (tooBig) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.too_big,
                        maximum: check.value,
                        type: "number",
                        inclusive: check.inclusive,
                        exact: false,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "multipleOf") {
                if (floatSafeRemainder(input.data, check.value) !== 0) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.not_multiple_of,
                        multipleOf: check.value,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "finite") {
                if (!Number.isFinite(input.data)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.not_finite,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else {
                util.assertNever(check);
            }
        }
        return { status: status.value, value: input.data };
    }
    gte(value, message) {
        return this.setLimit("min", value, true, errorUtil.toString(message));
    }
    gt(value, message) {
        return this.setLimit("min", value, false, errorUtil.toString(message));
    }
    lte(value, message) {
        return this.setLimit("max", value, true, errorUtil.toString(message));
    }
    lt(value, message) {
        return this.setLimit("max", value, false, errorUtil.toString(message));
    }
    setLimit(kind, value, inclusive, message) {
        return new ZodNumber({
            ...this._def,
            checks: [
                ...this._def.checks,
                {
                    kind,
                    value,
                    inclusive,
                    message: errorUtil.toString(message),
                },
            ],
        });
    }
    _addCheck(check) {
        return new ZodNumber({
            ...this._def,
            checks: [...this._def.checks, check],
        });
    }
    int(message) {
        return this._addCheck({
            kind: "int",
            message: errorUtil.toString(message),
        });
    }
    positive(message) {
        return this._addCheck({
            kind: "min",
            value: 0,
            inclusive: false,
            message: errorUtil.toString(message),
        });
    }
    negative(message) {
        return this._addCheck({
            kind: "max",
            value: 0,
            inclusive: false,
            message: errorUtil.toString(message),
        });
    }
    nonpositive(message) {
        return this._addCheck({
            kind: "max",
            value: 0,
            inclusive: true,
            message: errorUtil.toString(message),
        });
    }
    nonnegative(message) {
        return this._addCheck({
            kind: "min",
            value: 0,
            inclusive: true,
            message: errorUtil.toString(message),
        });
    }
    multipleOf(value, message) {
        return this._addCheck({
            kind: "multipleOf",
            value: value,
            message: errorUtil.toString(message),
        });
    }
    finite(message) {
        return this._addCheck({
            kind: "finite",
            message: errorUtil.toString(message),
        });
    }
    safe(message) {
        return this._addCheck({
            kind: "min",
            inclusive: true,
            value: Number.MIN_SAFE_INTEGER,
            message: errorUtil.toString(message),
        })._addCheck({
            kind: "max",
            inclusive: true,
            value: Number.MAX_SAFE_INTEGER,
            message: errorUtil.toString(message),
        });
    }
    get minValue() {
        let min = null;
        for (const ch of this._def.checks) {
            if (ch.kind === "min") {
                if (min === null || ch.value > min)
                    min = ch.value;
            }
        }
        return min;
    }
    get maxValue() {
        let max = null;
        for (const ch of this._def.checks) {
            if (ch.kind === "max") {
                if (max === null || ch.value < max)
                    max = ch.value;
            }
        }
        return max;
    }
    get isInt() {
        return !!this._def.checks.find((ch) => ch.kind === "int" ||
            (ch.kind === "multipleOf" && util.isInteger(ch.value)));
    }
    get isFinite() {
        let max = null, min = null;
        for (const ch of this._def.checks) {
            if (ch.kind === "finite" ||
                ch.kind === "int" ||
                ch.kind === "multipleOf") {
                return true;
            }
            else if (ch.kind === "min") {
                if (min === null || ch.value > min)
                    min = ch.value;
            }
            else if (ch.kind === "max") {
                if (max === null || ch.value < max)
                    max = ch.value;
            }
        }
        return Number.isFinite(min) && Number.isFinite(max);
    }
}
ZodNumber.create = (params) => {
    return new ZodNumber({
        checks: [],
        typeName: ZodFirstPartyTypeKind.ZodNumber,
        coerce: (params === null || params === void 0 ? void 0 : params.coerce) || false,
        ...processCreateParams(params),
    });
};
class ZodBigInt extends ZodType {
    constructor() {
        super(...arguments);
        this.min = this.gte;
        this.max = this.lte;
    }
    _parse(input) {
        if (this._def.coerce) {
            input.data = BigInt(input.data);
        }
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.bigint) {
            const ctx = this._getOrReturnCtx(input);
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.bigint,
                received: ctx.parsedType,
            });
            return INVALID;
        }
        let ctx = undefined;
        const status = new ParseStatus();
        for (const check of this._def.checks) {
            if (check.kind === "min") {
                const tooSmall = check.inclusive
                    ? input.data < check.value
                    : input.data <= check.value;
                if (tooSmall) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.too_small,
                        type: "bigint",
                        minimum: check.value,
                        inclusive: check.inclusive,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "max") {
                const tooBig = check.inclusive
                    ? input.data > check.value
                    : input.data >= check.value;
                if (tooBig) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.too_big,
                        type: "bigint",
                        maximum: check.value,
                        inclusive: check.inclusive,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "multipleOf") {
                if (input.data % check.value !== BigInt(0)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.not_multiple_of,
                        multipleOf: check.value,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else {
                util.assertNever(check);
            }
        }
        return { status: status.value, value: input.data };
    }
    gte(value, message) {
        return this.setLimit("min", value, true, errorUtil.toString(message));
    }
    gt(value, message) {
        return this.setLimit("min", value, false, errorUtil.toString(message));
    }
    lte(value, message) {
        return this.setLimit("max", value, true, errorUtil.toString(message));
    }
    lt(value, message) {
        return this.setLimit("max", value, false, errorUtil.toString(message));
    }
    setLimit(kind, value, inclusive, message) {
        return new ZodBigInt({
            ...this._def,
            checks: [
                ...this._def.checks,
                {
                    kind,
                    value,
                    inclusive,
                    message: errorUtil.toString(message),
                },
            ],
        });
    }
    _addCheck(check) {
        return new ZodBigInt({
            ...this._def,
            checks: [...this._def.checks, check],
        });
    }
    positive(message) {
        return this._addCheck({
            kind: "min",
            value: BigInt(0),
            inclusive: false,
            message: errorUtil.toString(message),
        });
    }
    negative(message) {
        return this._addCheck({
            kind: "max",
            value: BigInt(0),
            inclusive: false,
            message: errorUtil.toString(message),
        });
    }
    nonpositive(message) {
        return this._addCheck({
            kind: "max",
            value: BigInt(0),
            inclusive: true,
            message: errorUtil.toString(message),
        });
    }
    nonnegative(message) {
        return this._addCheck({
            kind: "min",
            value: BigInt(0),
            inclusive: true,
            message: errorUtil.toString(message),
        });
    }
    multipleOf(value, message) {
        return this._addCheck({
            kind: "multipleOf",
            value,
            message: errorUtil.toString(message),
        });
    }
    get minValue() {
        let min = null;
        for (const ch of this._def.checks) {
            if (ch.kind === "min") {
                if (min === null || ch.value > min)
                    min = ch.value;
            }
        }
        return min;
    }
    get maxValue() {
        let max = null;
        for (const ch of this._def.checks) {
            if (ch.kind === "max") {
                if (max === null || ch.value < max)
                    max = ch.value;
            }
        }
        return max;
    }
}
ZodBigInt.create = (params) => {
    var _a;
    return new ZodBigInt({
        checks: [],
        typeName: ZodFirstPartyTypeKind.ZodBigInt,
        coerce: (_a = params === null || params === void 0 ? void 0 : params.coerce) !== null && _a !== void 0 ? _a : false,
        ...processCreateParams(params),
    });
};
class ZodBoolean extends ZodType {
    _parse(input) {
        if (this._def.coerce) {
            input.data = Boolean(input.data);
        }
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.boolean) {
            const ctx = this._getOrReturnCtx(input);
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.boolean,
                received: ctx.parsedType,
            });
            return INVALID;
        }
        return OK(input.data);
    }
}
ZodBoolean.create = (params) => {
    return new ZodBoolean({
        typeName: ZodFirstPartyTypeKind.ZodBoolean,
        coerce: (params === null || params === void 0 ? void 0 : params.coerce) || false,
        ...processCreateParams(params),
    });
};
class ZodDate extends ZodType {
    _parse(input) {
        if (this._def.coerce) {
            input.data = new Date(input.data);
        }
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.date) {
            const ctx = this._getOrReturnCtx(input);
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.date,
                received: ctx.parsedType,
            });
            return INVALID;
        }
        if (isNaN(input.data.getTime())) {
            const ctx = this._getOrReturnCtx(input);
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_date,
            });
            return INVALID;
        }
        const status = new ParseStatus();
        let ctx = undefined;
        for (const check of this._def.checks) {
            if (check.kind === "min") {
                if (input.data.getTime() < check.value) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.too_small,
                        message: check.message,
                        inclusive: true,
                        exact: false,
                        minimum: check.value,
                        type: "date",
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "max") {
                if (input.data.getTime() > check.value) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.too_big,
                        message: check.message,
                        inclusive: true,
                        exact: false,
                        maximum: check.value,
                        type: "date",
                    });
                    status.dirty();
                }
            }
            else {
                util.assertNever(check);
            }
        }
        return {
            status: status.value,
            value: new Date(input.data.getTime()),
        };
    }
    _addCheck(check) {
        return new ZodDate({
            ...this._def,
            checks: [...this._def.checks, check],
        });
    }
    min(minDate, message) {
        return this._addCheck({
            kind: "min",
            value: minDate.getTime(),
            message: errorUtil.toString(message),
        });
    }
    max(maxDate, message) {
        return this._addCheck({
            kind: "max",
            value: maxDate.getTime(),
            message: errorUtil.toString(message),
        });
    }
    get minDate() {
        let min = null;
        for (const ch of this._def.checks) {
            if (ch.kind === "min") {
                if (min === null || ch.value > min)
                    min = ch.value;
            }
        }
        return min != null ? new Date(min) : null;
    }
    get maxDate() {
        let max = null;
        for (const ch of this._def.checks) {
            if (ch.kind === "max") {
                if (max === null || ch.value < max)
                    max = ch.value;
            }
        }
        return max != null ? new Date(max) : null;
    }
}
ZodDate.create = (params) => {
    return new ZodDate({
        checks: [],
        coerce: (params === null || params === void 0 ? void 0 : params.coerce) || false,
        typeName: ZodFirstPartyTypeKind.ZodDate,
        ...processCreateParams(params),
    });
};
class ZodSymbol extends ZodType {
    _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.symbol) {
            const ctx = this._getOrReturnCtx(input);
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.symbol,
                received: ctx.parsedType,
            });
            return INVALID;
        }
        return OK(input.data);
    }
}
ZodSymbol.create = (params) => {
    return new ZodSymbol({
        typeName: ZodFirstPartyTypeKind.ZodSymbol,
        ...processCreateParams(params),
    });
};
class ZodUndefined extends ZodType {
    _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.undefined) {
            const ctx = this._getOrReturnCtx(input);
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.undefined,
                received: ctx.parsedType,
            });
            return INVALID;
        }
        return OK(input.data);
    }
}
ZodUndefined.create = (params) => {
    return new ZodUndefined({
        typeName: ZodFirstPartyTypeKind.ZodUndefined,
        ...processCreateParams(params),
    });
};
class ZodNull extends ZodType {
    _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.null) {
            const ctx = this._getOrReturnCtx(input);
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.null,
                received: ctx.parsedType,
            });
            return INVALID;
        }
        return OK(input.data);
    }
}
ZodNull.create = (params) => {
    return new ZodNull({
        typeName: ZodFirstPartyTypeKind.ZodNull,
        ...processCreateParams(params),
    });
};
class ZodAny extends ZodType {
    constructor() {
        super(...arguments);
        // to prevent instances of other classes from extending ZodAny. this causes issues with catchall in ZodObject.
        this._any = true;
    }
    _parse(input) {
        return OK(input.data);
    }
}
ZodAny.create = (params) => {
    return new ZodAny({
        typeName: ZodFirstPartyTypeKind.ZodAny,
        ...processCreateParams(params),
    });
};
class ZodUnknown extends ZodType {
    constructor() {
        super(...arguments);
        // required
        this._unknown = true;
    }
    _parse(input) {
        return OK(input.data);
    }
}
ZodUnknown.create = (params) => {
    return new ZodUnknown({
        typeName: ZodFirstPartyTypeKind.ZodUnknown,
        ...processCreateParams(params),
    });
};
class ZodNever extends ZodType {
    _parse(input) {
        const ctx = this._getOrReturnCtx(input);
        addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.never,
            received: ctx.parsedType,
        });
        return INVALID;
    }
}
ZodNever.create = (params) => {
    return new ZodNever({
        typeName: ZodFirstPartyTypeKind.ZodNever,
        ...processCreateParams(params),
    });
};
class ZodVoid extends ZodType {
    _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.undefined) {
            const ctx = this._getOrReturnCtx(input);
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.void,
                received: ctx.parsedType,
            });
            return INVALID;
        }
        return OK(input.data);
    }
}
ZodVoid.create = (params) => {
    return new ZodVoid({
        typeName: ZodFirstPartyTypeKind.ZodVoid,
        ...processCreateParams(params),
    });
};
class ZodArray extends ZodType {
    _parse(input) {
        const { ctx, status } = this._processInputParams(input);
        const def = this._def;
        if (ctx.parsedType !== ZodParsedType.array) {
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.array,
                received: ctx.parsedType,
            });
            return INVALID;
        }
        if (def.exactLength !== null) {
            const tooBig = ctx.data.length > def.exactLength.value;
            const tooSmall = ctx.data.length < def.exactLength.value;
            if (tooBig || tooSmall) {
                addIssueToContext(ctx, {
                    code: tooBig ? ZodIssueCode.too_big : ZodIssueCode.too_small,
                    minimum: (tooSmall ? def.exactLength.value : undefined),
                    maximum: (tooBig ? def.exactLength.value : undefined),
                    type: "array",
                    inclusive: true,
                    exact: true,
                    message: def.exactLength.message,
                });
                status.dirty();
            }
        }
        if (def.minLength !== null) {
            if (ctx.data.length < def.minLength.value) {
                addIssueToContext(ctx, {
                    code: ZodIssueCode.too_small,
                    minimum: def.minLength.value,
                    type: "array",
                    inclusive: true,
                    exact: false,
                    message: def.minLength.message,
                });
                status.dirty();
            }
        }
        if (def.maxLength !== null) {
            if (ctx.data.length > def.maxLength.value) {
                addIssueToContext(ctx, {
                    code: ZodIssueCode.too_big,
                    maximum: def.maxLength.value,
                    type: "array",
                    inclusive: true,
                    exact: false,
                    message: def.maxLength.message,
                });
                status.dirty();
            }
        }
        if (ctx.common.async) {
            return Promise.all([...ctx.data].map((item, i) => {
                return def.type._parseAsync(new ParseInputLazyPath(ctx, item, ctx.path, i));
            })).then((result) => {
                return ParseStatus.mergeArray(status, result);
            });
        }
        const result = [...ctx.data].map((item, i) => {
            return def.type._parseSync(new ParseInputLazyPath(ctx, item, ctx.path, i));
        });
        return ParseStatus.mergeArray(status, result);
    }
    get element() {
        return this._def.type;
    }
    min(minLength, message) {
        return new ZodArray({
            ...this._def,
            minLength: { value: minLength, message: errorUtil.toString(message) },
        });
    }
    max(maxLength, message) {
        return new ZodArray({
            ...this._def,
            maxLength: { value: maxLength, message: errorUtil.toString(message) },
        });
    }
    length(len, message) {
        return new ZodArray({
            ...this._def,
            exactLength: { value: len, message: errorUtil.toString(message) },
        });
    }
    nonempty(message) {
        return this.min(1, message);
    }
}
ZodArray.create = (schema, params) => {
    return new ZodArray({
        type: schema,
        minLength: null,
        maxLength: null,
        exactLength: null,
        typeName: ZodFirstPartyTypeKind.ZodArray,
        ...processCreateParams(params),
    });
};
function deepPartialify(schema) {
    if (schema instanceof ZodObject) {
        const newShape = {};
        for (const key in schema.shape) {
            const fieldSchema = schema.shape[key];
            newShape[key] = ZodOptional.create(deepPartialify(fieldSchema));
        }
        return new ZodObject({
            ...schema._def,
            shape: () => newShape,
        });
    }
    else if (schema instanceof ZodArray) {
        return new ZodArray({
            ...schema._def,
            type: deepPartialify(schema.element),
        });
    }
    else if (schema instanceof ZodOptional) {
        return ZodOptional.create(deepPartialify(schema.unwrap()));
    }
    else if (schema instanceof ZodNullable) {
        return ZodNullable.create(deepPartialify(schema.unwrap()));
    }
    else if (schema instanceof ZodTuple) {
        return ZodTuple.create(schema.items.map((item) => deepPartialify(item)));
    }
    else {
        return schema;
    }
}
class ZodObject extends ZodType {
    constructor() {
        super(...arguments);
        this._cached = null;
        /**
         * @deprecated In most cases, this is no longer needed - unknown properties are now silently stripped.
         * If you want to pass through unknown properties, use `.passthrough()` instead.
         */
        this.nonstrict = this.passthrough;
        // extend<
        //   Augmentation extends ZodRawShape,
        //   NewOutput extends util.flatten<{
        //     [k in keyof Augmentation | keyof Output]: k extends keyof Augmentation
        //       ? Augmentation[k]["_output"]
        //       : k extends keyof Output
        //       ? Output[k]
        //       : never;
        //   }>,
        //   NewInput extends util.flatten<{
        //     [k in keyof Augmentation | keyof Input]: k extends keyof Augmentation
        //       ? Augmentation[k]["_input"]
        //       : k extends keyof Input
        //       ? Input[k]
        //       : never;
        //   }>
        // >(
        //   augmentation: Augmentation
        // ): ZodObject<
        //   extendShape<T, Augmentation>,
        //   UnknownKeys,
        //   Catchall,
        //   NewOutput,
        //   NewInput
        // > {
        //   return new ZodObject({
        //     ...this._def,
        //     shape: () => ({
        //       ...this._def.shape(),
        //       ...augmentation,
        //     }),
        //   }) as any;
        // }
        /**
         * @deprecated Use `.extend` instead
         *  */
        this.augment = this.extend;
    }
    _getCached() {
        if (this._cached !== null)
            return this._cached;
        const shape = this._def.shape();
        const keys = util.objectKeys(shape);
        return (this._cached = { shape, keys });
    }
    _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.object) {
            const ctx = this._getOrReturnCtx(input);
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.object,
                received: ctx.parsedType,
            });
            return INVALID;
        }
        const { status, ctx } = this._processInputParams(input);
        const { shape, keys: shapeKeys } = this._getCached();
        const extraKeys = [];
        if (!(this._def.catchall instanceof ZodNever &&
            this._def.unknownKeys === "strip")) {
            for (const key in ctx.data) {
                if (!shapeKeys.includes(key)) {
                    extraKeys.push(key);
                }
            }
        }
        const pairs = [];
        for (const key of shapeKeys) {
            const keyValidator = shape[key];
            const value = ctx.data[key];
            pairs.push({
                key: { status: "valid", value: key },
                value: keyValidator._parse(new ParseInputLazyPath(ctx, value, ctx.path, key)),
                alwaysSet: key in ctx.data,
            });
        }
        if (this._def.catchall instanceof ZodNever) {
            const unknownKeys = this._def.unknownKeys;
            if (unknownKeys === "passthrough") {
                for (const key of extraKeys) {
                    pairs.push({
                        key: { status: "valid", value: key },
                        value: { status: "valid", value: ctx.data[key] },
                    });
                }
            }
            else if (unknownKeys === "strict") {
                if (extraKeys.length > 0) {
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.unrecognized_keys,
                        keys: extraKeys,
                    });
                    status.dirty();
                }
            }
            else if (unknownKeys === "strip") ;
            else {
                throw new Error(`Internal ZodObject error: invalid unknownKeys value.`);
            }
        }
        else {
            // run catchall validation
            const catchall = this._def.catchall;
            for (const key of extraKeys) {
                const value = ctx.data[key];
                pairs.push({
                    key: { status: "valid", value: key },
                    value: catchall._parse(new ParseInputLazyPath(ctx, value, ctx.path, key) //, ctx.child(key), value, getParsedType(value)
                    ),
                    alwaysSet: key in ctx.data,
                });
            }
        }
        if (ctx.common.async) {
            return Promise.resolve()
                .then(async () => {
                const syncPairs = [];
                for (const pair of pairs) {
                    const key = await pair.key;
                    syncPairs.push({
                        key,
                        value: await pair.value,
                        alwaysSet: pair.alwaysSet,
                    });
                }
                return syncPairs;
            })
                .then((syncPairs) => {
                return ParseStatus.mergeObjectSync(status, syncPairs);
            });
        }
        else {
            return ParseStatus.mergeObjectSync(status, pairs);
        }
    }
    get shape() {
        return this._def.shape();
    }
    strict(message) {
        errorUtil.errToObj;
        return new ZodObject({
            ...this._def,
            unknownKeys: "strict",
            ...(message !== undefined
                ? {
                    errorMap: (issue, ctx) => {
                        var _a, _b, _c, _d;
                        const defaultError = (_c = (_b = (_a = this._def).errorMap) === null || _b === void 0 ? void 0 : _b.call(_a, issue, ctx).message) !== null && _c !== void 0 ? _c : ctx.defaultError;
                        if (issue.code === "unrecognized_keys")
                            return {
                                message: (_d = errorUtil.errToObj(message).message) !== null && _d !== void 0 ? _d : defaultError,
                            };
                        return {
                            message: defaultError,
                        };
                    },
                }
                : {}),
        });
    }
    strip() {
        return new ZodObject({
            ...this._def,
            unknownKeys: "strip",
        });
    }
    passthrough() {
        return new ZodObject({
            ...this._def,
            unknownKeys: "passthrough",
        });
    }
    // const AugmentFactory =
    //   <Def extends ZodObjectDef>(def: Def) =>
    //   <Augmentation extends ZodRawShape>(
    //     augmentation: Augmentation
    //   ): ZodObject<
    //     extendShape<ReturnType<Def["shape"]>, Augmentation>,
    //     Def["unknownKeys"],
    //     Def["catchall"]
    //   > => {
    //     return new ZodObject({
    //       ...def,
    //       shape: () => ({
    //         ...def.shape(),
    //         ...augmentation,
    //       }),
    //     }) as any;
    //   };
    extend(augmentation) {
        return new ZodObject({
            ...this._def,
            shape: () => ({
                ...this._def.shape(),
                ...augmentation,
            }),
        });
    }
    /**
     * Prior to zod@1.0.12 there was a bug in the
     * inferred type of merged objects. Please
     * upgrade if you are experiencing issues.
     */
    merge(merging) {
        const merged = new ZodObject({
            unknownKeys: merging._def.unknownKeys,
            catchall: merging._def.catchall,
            shape: () => ({
                ...this._def.shape(),
                ...merging._def.shape(),
            }),
            typeName: ZodFirstPartyTypeKind.ZodObject,
        });
        return merged;
    }
    // merge<
    //   Incoming extends AnyZodObject,
    //   Augmentation extends Incoming["shape"],
    //   NewOutput extends {
    //     [k in keyof Augmentation | keyof Output]: k extends keyof Augmentation
    //       ? Augmentation[k]["_output"]
    //       : k extends keyof Output
    //       ? Output[k]
    //       : never;
    //   },
    //   NewInput extends {
    //     [k in keyof Augmentation | keyof Input]: k extends keyof Augmentation
    //       ? Augmentation[k]["_input"]
    //       : k extends keyof Input
    //       ? Input[k]
    //       : never;
    //   }
    // >(
    //   merging: Incoming
    // ): ZodObject<
    //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
    //   Incoming["_def"]["unknownKeys"],
    //   Incoming["_def"]["catchall"],
    //   NewOutput,
    //   NewInput
    // > {
    //   const merged: any = new ZodObject({
    //     unknownKeys: merging._def.unknownKeys,
    //     catchall: merging._def.catchall,
    //     shape: () =>
    //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
    //     typeName: ZodFirstPartyTypeKind.ZodObject,
    //   }) as any;
    //   return merged;
    // }
    setKey(key, schema) {
        return this.augment({ [key]: schema });
    }
    // merge<Incoming extends AnyZodObject>(
    //   merging: Incoming
    // ): //ZodObject<T & Incoming["_shape"], UnknownKeys, Catchall> = (merging) => {
    // ZodObject<
    //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
    //   Incoming["_def"]["unknownKeys"],
    //   Incoming["_def"]["catchall"]
    // > {
    //   // const mergedShape = objectUtil.mergeShapes(
    //   //   this._def.shape(),
    //   //   merging._def.shape()
    //   // );
    //   const merged: any = new ZodObject({
    //     unknownKeys: merging._def.unknownKeys,
    //     catchall: merging._def.catchall,
    //     shape: () =>
    //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
    //     typeName: ZodFirstPartyTypeKind.ZodObject,
    //   }) as any;
    //   return merged;
    // }
    catchall(index) {
        return new ZodObject({
            ...this._def,
            catchall: index,
        });
    }
    pick(mask) {
        const shape = {};
        util.objectKeys(mask).forEach((key) => {
            if (mask[key] && this.shape[key]) {
                shape[key] = this.shape[key];
            }
        });
        return new ZodObject({
            ...this._def,
            shape: () => shape,
        });
    }
    omit(mask) {
        const shape = {};
        util.objectKeys(this.shape).forEach((key) => {
            if (!mask[key]) {
                shape[key] = this.shape[key];
            }
        });
        return new ZodObject({
            ...this._def,
            shape: () => shape,
        });
    }
    /**
     * @deprecated
     */
    deepPartial() {
        return deepPartialify(this);
    }
    partial(mask) {
        const newShape = {};
        util.objectKeys(this.shape).forEach((key) => {
            const fieldSchema = this.shape[key];
            if (mask && !mask[key]) {
                newShape[key] = fieldSchema;
            }
            else {
                newShape[key] = fieldSchema.optional();
            }
        });
        return new ZodObject({
            ...this._def,
            shape: () => newShape,
        });
    }
    required(mask) {
        const newShape = {};
        util.objectKeys(this.shape).forEach((key) => {
            if (mask && !mask[key]) {
                newShape[key] = this.shape[key];
            }
            else {
                const fieldSchema = this.shape[key];
                let newField = fieldSchema;
                while (newField instanceof ZodOptional) {
                    newField = newField._def.innerType;
                }
                newShape[key] = newField;
            }
        });
        return new ZodObject({
            ...this._def,
            shape: () => newShape,
        });
    }
    keyof() {
        return createZodEnum(util.objectKeys(this.shape));
    }
}
ZodObject.create = (shape, params) => {
    return new ZodObject({
        shape: () => shape,
        unknownKeys: "strip",
        catchall: ZodNever.create(),
        typeName: ZodFirstPartyTypeKind.ZodObject,
        ...processCreateParams(params),
    });
};
ZodObject.strictCreate = (shape, params) => {
    return new ZodObject({
        shape: () => shape,
        unknownKeys: "strict",
        catchall: ZodNever.create(),
        typeName: ZodFirstPartyTypeKind.ZodObject,
        ...processCreateParams(params),
    });
};
ZodObject.lazycreate = (shape, params) => {
    return new ZodObject({
        shape,
        unknownKeys: "strip",
        catchall: ZodNever.create(),
        typeName: ZodFirstPartyTypeKind.ZodObject,
        ...processCreateParams(params),
    });
};
class ZodUnion extends ZodType {
    _parse(input) {
        const { ctx } = this._processInputParams(input);
        const options = this._def.options;
        function handleResults(results) {
            // return first issue-free validation if it exists
            for (const result of results) {
                if (result.result.status === "valid") {
                    return result.result;
                }
            }
            for (const result of results) {
                if (result.result.status === "dirty") {
                    // add issues from dirty option
                    ctx.common.issues.push(...result.ctx.common.issues);
                    return result.result;
                }
            }
            // return invalid
            const unionErrors = results.map((result) => new ZodError(result.ctx.common.issues));
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_union,
                unionErrors,
            });
            return INVALID;
        }
        if (ctx.common.async) {
            return Promise.all(options.map(async (option) => {
                const childCtx = {
                    ...ctx,
                    common: {
                        ...ctx.common,
                        issues: [],
                    },
                    parent: null,
                };
                return {
                    result: await option._parseAsync({
                        data: ctx.data,
                        path: ctx.path,
                        parent: childCtx,
                    }),
                    ctx: childCtx,
                };
            })).then(handleResults);
        }
        else {
            let dirty = undefined;
            const issues = [];
            for (const option of options) {
                const childCtx = {
                    ...ctx,
                    common: {
                        ...ctx.common,
                        issues: [],
                    },
                    parent: null,
                };
                const result = option._parseSync({
                    data: ctx.data,
                    path: ctx.path,
                    parent: childCtx,
                });
                if (result.status === "valid") {
                    return result;
                }
                else if (result.status === "dirty" && !dirty) {
                    dirty = { result, ctx: childCtx };
                }
                if (childCtx.common.issues.length) {
                    issues.push(childCtx.common.issues);
                }
            }
            if (dirty) {
                ctx.common.issues.push(...dirty.ctx.common.issues);
                return dirty.result;
            }
            const unionErrors = issues.map((issues) => new ZodError(issues));
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_union,
                unionErrors,
            });
            return INVALID;
        }
    }
    get options() {
        return this._def.options;
    }
}
ZodUnion.create = (types, params) => {
    return new ZodUnion({
        options: types,
        typeName: ZodFirstPartyTypeKind.ZodUnion,
        ...processCreateParams(params),
    });
};
/////////////////////////////////////////////////////
/////////////////////////////////////////////////////
//////////                                 //////////
//////////      ZodDiscriminatedUnion      //////////
//////////                                 //////////
/////////////////////////////////////////////////////
/////////////////////////////////////////////////////
const getDiscriminator = (type) => {
    if (type instanceof ZodLazy) {
        return getDiscriminator(type.schema);
    }
    else if (type instanceof ZodEffects) {
        return getDiscriminator(type.innerType());
    }
    else if (type instanceof ZodLiteral) {
        return [type.value];
    }
    else if (type instanceof ZodEnum) {
        return type.options;
    }
    else if (type instanceof ZodNativeEnum) {
        // eslint-disable-next-line ban/ban
        return Object.keys(type.enum);
    }
    else if (type instanceof ZodDefault) {
        return getDiscriminator(type._def.innerType);
    }
    else if (type instanceof ZodUndefined) {
        return [undefined];
    }
    else if (type instanceof ZodNull) {
        return [null];
    }
    else {
        return null;
    }
};
class ZodDiscriminatedUnion extends ZodType {
    _parse(input) {
        const { ctx } = this._processInputParams(input);
        if (ctx.parsedType !== ZodParsedType.object) {
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.object,
                received: ctx.parsedType,
            });
            return INVALID;
        }
        const discriminator = this.discriminator;
        const discriminatorValue = ctx.data[discriminator];
        const option = this.optionsMap.get(discriminatorValue);
        if (!option) {
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_union_discriminator,
                options: Array.from(this.optionsMap.keys()),
                path: [discriminator],
            });
            return INVALID;
        }
        if (ctx.common.async) {
            return option._parseAsync({
                data: ctx.data,
                path: ctx.path,
                parent: ctx,
            });
        }
        else {
            return option._parseSync({
                data: ctx.data,
                path: ctx.path,
                parent: ctx,
            });
        }
    }
    get discriminator() {
        return this._def.discriminator;
    }
    get options() {
        return this._def.options;
    }
    get optionsMap() {
        return this._def.optionsMap;
    }
    /**
     * The constructor of the discriminated union schema. Its behaviour is very similar to that of the normal z.union() constructor.
     * However, it only allows a union of objects, all of which need to share a discriminator property. This property must
     * have a different value for each object in the union.
     * @param discriminator the name of the discriminator property
     * @param types an array of object schemas
     * @param params
     */
    static create(discriminator, options, params) {
        // Get all the valid discriminator values
        const optionsMap = new Map();
        // try {
        for (const type of options) {
            const discriminatorValues = getDiscriminator(type.shape[discriminator]);
            if (!discriminatorValues) {
                throw new Error(`A discriminator value for key \`${discriminator}\` could not be extracted from all schema options`);
            }
            for (const value of discriminatorValues) {
                if (optionsMap.has(value)) {
                    throw new Error(`Discriminator property ${String(discriminator)} has duplicate value ${String(value)}`);
                }
                optionsMap.set(value, type);
            }
        }
        return new ZodDiscriminatedUnion({
            typeName: ZodFirstPartyTypeKind.ZodDiscriminatedUnion,
            discriminator,
            options,
            optionsMap,
            ...processCreateParams(params),
        });
    }
}
function mergeValues(a, b) {
    const aType = getParsedType(a);
    const bType = getParsedType(b);
    if (a === b) {
        return { valid: true, data: a };
    }
    else if (aType === ZodParsedType.object && bType === ZodParsedType.object) {
        const bKeys = util.objectKeys(b);
        const sharedKeys = util
            .objectKeys(a)
            .filter((key) => bKeys.indexOf(key) !== -1);
        const newObj = { ...a, ...b };
        for (const key of sharedKeys) {
            const sharedValue = mergeValues(a[key], b[key]);
            if (!sharedValue.valid) {
                return { valid: false };
            }
            newObj[key] = sharedValue.data;
        }
        return { valid: true, data: newObj };
    }
    else if (aType === ZodParsedType.array && bType === ZodParsedType.array) {
        if (a.length !== b.length) {
            return { valid: false };
        }
        const newArray = [];
        for (let index = 0; index < a.length; index++) {
            const itemA = a[index];
            const itemB = b[index];
            const sharedValue = mergeValues(itemA, itemB);
            if (!sharedValue.valid) {
                return { valid: false };
            }
            newArray.push(sharedValue.data);
        }
        return { valid: true, data: newArray };
    }
    else if (aType === ZodParsedType.date &&
        bType === ZodParsedType.date &&
        +a === +b) {
        return { valid: true, data: a };
    }
    else {
        return { valid: false };
    }
}
class ZodIntersection extends ZodType {
    _parse(input) {
        const { status, ctx } = this._processInputParams(input);
        const handleParsed = (parsedLeft, parsedRight) => {
            if (isAborted(parsedLeft) || isAborted(parsedRight)) {
                return INVALID;
            }
            const merged = mergeValues(parsedLeft.value, parsedRight.value);
            if (!merged.valid) {
                addIssueToContext(ctx, {
                    code: ZodIssueCode.invalid_intersection_types,
                });
                return INVALID;
            }
            if (isDirty(parsedLeft) || isDirty(parsedRight)) {
                status.dirty();
            }
            return { status: status.value, value: merged.data };
        };
        if (ctx.common.async) {
            return Promise.all([
                this._def.left._parseAsync({
                    data: ctx.data,
                    path: ctx.path,
                    parent: ctx,
                }),
                this._def.right._parseAsync({
                    data: ctx.data,
                    path: ctx.path,
                    parent: ctx,
                }),
            ]).then(([left, right]) => handleParsed(left, right));
        }
        else {
            return handleParsed(this._def.left._parseSync({
                data: ctx.data,
                path: ctx.path,
                parent: ctx,
            }), this._def.right._parseSync({
                data: ctx.data,
                path: ctx.path,
                parent: ctx,
            }));
        }
    }
}
ZodIntersection.create = (left, right, params) => {
    return new ZodIntersection({
        left: left,
        right: right,
        typeName: ZodFirstPartyTypeKind.ZodIntersection,
        ...processCreateParams(params),
    });
};
class ZodTuple extends ZodType {
    _parse(input) {
        const { status, ctx } = this._processInputParams(input);
        if (ctx.parsedType !== ZodParsedType.array) {
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.array,
                received: ctx.parsedType,
            });
            return INVALID;
        }
        if (ctx.data.length < this._def.items.length) {
            addIssueToContext(ctx, {
                code: ZodIssueCode.too_small,
                minimum: this._def.items.length,
                inclusive: true,
                exact: false,
                type: "array",
            });
            return INVALID;
        }
        const rest = this._def.rest;
        if (!rest && ctx.data.length > this._def.items.length) {
            addIssueToContext(ctx, {
                code: ZodIssueCode.too_big,
                maximum: this._def.items.length,
                inclusive: true,
                exact: false,
                type: "array",
            });
            status.dirty();
        }
        const items = [...ctx.data]
            .map((item, itemIndex) => {
            const schema = this._def.items[itemIndex] || this._def.rest;
            if (!schema)
                return null;
            return schema._parse(new ParseInputLazyPath(ctx, item, ctx.path, itemIndex));
        })
            .filter((x) => !!x); // filter nulls
        if (ctx.common.async) {
            return Promise.all(items).then((results) => {
                return ParseStatus.mergeArray(status, results);
            });
        }
        else {
            return ParseStatus.mergeArray(status, items);
        }
    }
    get items() {
        return this._def.items;
    }
    rest(rest) {
        return new ZodTuple({
            ...this._def,
            rest,
        });
    }
}
ZodTuple.create = (schemas, params) => {
    if (!Array.isArray(schemas)) {
        throw new Error("You must pass an array of schemas to z.tuple([ ... ])");
    }
    return new ZodTuple({
        items: schemas,
        typeName: ZodFirstPartyTypeKind.ZodTuple,
        rest: null,
        ...processCreateParams(params),
    });
};
class ZodRecord extends ZodType {
    get keySchema() {
        return this._def.keyType;
    }
    get valueSchema() {
        return this._def.valueType;
    }
    _parse(input) {
        const { status, ctx } = this._processInputParams(input);
        if (ctx.parsedType !== ZodParsedType.object) {
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.object,
                received: ctx.parsedType,
            });
            return INVALID;
        }
        const pairs = [];
        const keyType = this._def.keyType;
        const valueType = this._def.valueType;
        for (const key in ctx.data) {
            pairs.push({
                key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, key)),
                value: valueType._parse(new ParseInputLazyPath(ctx, ctx.data[key], ctx.path, key)),
            });
        }
        if (ctx.common.async) {
            return ParseStatus.mergeObjectAsync(status, pairs);
        }
        else {
            return ParseStatus.mergeObjectSync(status, pairs);
        }
    }
    get element() {
        return this._def.valueType;
    }
    static create(first, second, third) {
        if (second instanceof ZodType) {
            return new ZodRecord({
                keyType: first,
                valueType: second,
                typeName: ZodFirstPartyTypeKind.ZodRecord,
                ...processCreateParams(third),
            });
        }
        return new ZodRecord({
            keyType: ZodString.create(),
            valueType: first,
            typeName: ZodFirstPartyTypeKind.ZodRecord,
            ...processCreateParams(second),
        });
    }
}
class ZodMap extends ZodType {
    get keySchema() {
        return this._def.keyType;
    }
    get valueSchema() {
        return this._def.valueType;
    }
    _parse(input) {
        const { status, ctx } = this._processInputParams(input);
        if (ctx.parsedType !== ZodParsedType.map) {
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.map,
                received: ctx.parsedType,
            });
            return INVALID;
        }
        const keyType = this._def.keyType;
        const valueType = this._def.valueType;
        const pairs = [...ctx.data.entries()].map(([key, value], index) => {
            return {
                key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, [index, "key"])),
                value: valueType._parse(new ParseInputLazyPath(ctx, value, ctx.path, [index, "value"])),
            };
        });
        if (ctx.common.async) {
            const finalMap = new Map();
            return Promise.resolve().then(async () => {
                for (const pair of pairs) {
                    const key = await pair.key;
                    const value = await pair.value;
                    if (key.status === "aborted" || value.status === "aborted") {
                        return INVALID;
                    }
                    if (key.status === "dirty" || value.status === "dirty") {
                        status.dirty();
                    }
                    finalMap.set(key.value, value.value);
                }
                return { status: status.value, value: finalMap };
            });
        }
        else {
            const finalMap = new Map();
            for (const pair of pairs) {
                const key = pair.key;
                const value = pair.value;
                if (key.status === "aborted" || value.status === "aborted") {
                    return INVALID;
                }
                if (key.status === "dirty" || value.status === "dirty") {
                    status.dirty();
                }
                finalMap.set(key.value, value.value);
            }
            return { status: status.value, value: finalMap };
        }
    }
}
ZodMap.create = (keyType, valueType, params) => {
    return new ZodMap({
        valueType,
        keyType,
        typeName: ZodFirstPartyTypeKind.ZodMap,
        ...processCreateParams(params),
    });
};
class ZodSet extends ZodType {
    _parse(input) {
        const { status, ctx } = this._processInputParams(input);
        if (ctx.parsedType !== ZodParsedType.set) {
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.set,
                received: ctx.parsedType,
            });
            return INVALID;
        }
        const def = this._def;
        if (def.minSize !== null) {
            if (ctx.data.size < def.minSize.value) {
                addIssueToContext(ctx, {
                    code: ZodIssueCode.too_small,
                    minimum: def.minSize.value,
                    type: "set",
                    inclusive: true,
                    exact: false,
                    message: def.minSize.message,
                });
                status.dirty();
            }
        }
        if (def.maxSize !== null) {
            if (ctx.data.size > def.maxSize.value) {
                addIssueToContext(ctx, {
                    code: ZodIssueCode.too_big,
                    maximum: def.maxSize.value,
                    type: "set",
                    inclusive: true,
                    exact: false,
                    message: def.maxSize.message,
                });
                status.dirty();
            }
        }
        const valueType = this._def.valueType;
        function finalizeSet(elements) {
            const parsedSet = new Set();
            for (const element of elements) {
                if (element.status === "aborted")
                    return INVALID;
                if (element.status === "dirty")
                    status.dirty();
                parsedSet.add(element.value);
            }
            return { status: status.value, value: parsedSet };
        }
        const elements = [...ctx.data.values()].map((item, i) => valueType._parse(new ParseInputLazyPath(ctx, item, ctx.path, i)));
        if (ctx.common.async) {
            return Promise.all(elements).then((elements) => finalizeSet(elements));
        }
        else {
            return finalizeSet(elements);
        }
    }
    min(minSize, message) {
        return new ZodSet({
            ...this._def,
            minSize: { value: minSize, message: errorUtil.toString(message) },
        });
    }
    max(maxSize, message) {
        return new ZodSet({
            ...this._def,
            maxSize: { value: maxSize, message: errorUtil.toString(message) },
        });
    }
    size(size, message) {
        return this.min(size, message).max(size, message);
    }
    nonempty(message) {
        return this.min(1, message);
    }
}
ZodSet.create = (valueType, params) => {
    return new ZodSet({
        valueType,
        minSize: null,
        maxSize: null,
        typeName: ZodFirstPartyTypeKind.ZodSet,
        ...processCreateParams(params),
    });
};
class ZodFunction extends ZodType {
    constructor() {
        super(...arguments);
        this.validate = this.implement;
    }
    _parse(input) {
        const { ctx } = this._processInputParams(input);
        if (ctx.parsedType !== ZodParsedType.function) {
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.function,
                received: ctx.parsedType,
            });
            return INVALID;
        }
        function makeArgsIssue(args, error) {
            return makeIssue({
                data: args,
                path: ctx.path,
                errorMaps: [
                    ctx.common.contextualErrorMap,
                    ctx.schemaErrorMap,
                    getErrorMap(),
                    errorMap,
                ].filter((x) => !!x),
                issueData: {
                    code: ZodIssueCode.invalid_arguments,
                    argumentsError: error,
                },
            });
        }
        function makeReturnsIssue(returns, error) {
            return makeIssue({
                data: returns,
                path: ctx.path,
                errorMaps: [
                    ctx.common.contextualErrorMap,
                    ctx.schemaErrorMap,
                    getErrorMap(),
                    errorMap,
                ].filter((x) => !!x),
                issueData: {
                    code: ZodIssueCode.invalid_return_type,
                    returnTypeError: error,
                },
            });
        }
        const params = { errorMap: ctx.common.contextualErrorMap };
        const fn = ctx.data;
        if (this._def.returns instanceof ZodPromise) {
            // Would love a way to avoid disabling this rule, but we need
            // an alias (using an arrow function was what caused 2651).
            // eslint-disable-next-line @typescript-eslint/no-this-alias
            const me = this;
            return OK(async function (...args) {
                const error = new ZodError([]);
                const parsedArgs = await me._def.args
                    .parseAsync(args, params)
                    .catch((e) => {
                    error.addIssue(makeArgsIssue(args, e));
                    throw error;
                });
                const result = await Reflect.apply(fn, this, parsedArgs);
                const parsedReturns = await me._def.returns._def.type
                    .parseAsync(result, params)
                    .catch((e) => {
                    error.addIssue(makeReturnsIssue(result, e));
                    throw error;
                });
                return parsedReturns;
            });
        }
        else {
            // Would love a way to avoid disabling this rule, but we need
            // an alias (using an arrow function was what caused 2651).
            // eslint-disable-next-line @typescript-eslint/no-this-alias
            const me = this;
            return OK(function (...args) {
                const parsedArgs = me._def.args.safeParse(args, params);
                if (!parsedArgs.success) {
                    throw new ZodError([makeArgsIssue(args, parsedArgs.error)]);
                }
                const result = Reflect.apply(fn, this, parsedArgs.data);
                const parsedReturns = me._def.returns.safeParse(result, params);
                if (!parsedReturns.success) {
                    throw new ZodError([makeReturnsIssue(result, parsedReturns.error)]);
                }
                return parsedReturns.data;
            });
        }
    }
    parameters() {
        return this._def.args;
    }
    returnType() {
        return this._def.returns;
    }
    args(...items) {
        return new ZodFunction({
            ...this._def,
            args: ZodTuple.create(items).rest(ZodUnknown.create()),
        });
    }
    returns(returnType) {
        return new ZodFunction({
            ...this._def,
            returns: returnType,
        });
    }
    implement(func) {
        const validatedFunc = this.parse(func);
        return validatedFunc;
    }
    strictImplement(func) {
        const validatedFunc = this.parse(func);
        return validatedFunc;
    }
    static create(args, returns, params) {
        return new ZodFunction({
            args: (args
                ? args
                : ZodTuple.create([]).rest(ZodUnknown.create())),
            returns: returns || ZodUnknown.create(),
            typeName: ZodFirstPartyTypeKind.ZodFunction,
            ...processCreateParams(params),
        });
    }
}
class ZodLazy extends ZodType {
    get schema() {
        return this._def.getter();
    }
    _parse(input) {
        const { ctx } = this._processInputParams(input);
        const lazySchema = this._def.getter();
        return lazySchema._parse({ data: ctx.data, path: ctx.path, parent: ctx });
    }
}
ZodLazy.create = (getter, params) => {
    return new ZodLazy({
        getter: getter,
        typeName: ZodFirstPartyTypeKind.ZodLazy,
        ...processCreateParams(params),
    });
};
class ZodLiteral extends ZodType {
    _parse(input) {
        if (input.data !== this._def.value) {
            const ctx = this._getOrReturnCtx(input);
            addIssueToContext(ctx, {
                received: ctx.data,
                code: ZodIssueCode.invalid_literal,
                expected: this._def.value,
            });
            return INVALID;
        }
        return { status: "valid", value: input.data };
    }
    get value() {
        return this._def.value;
    }
}
ZodLiteral.create = (value, params) => {
    return new ZodLiteral({
        value: value,
        typeName: ZodFirstPartyTypeKind.ZodLiteral,
        ...processCreateParams(params),
    });
};
function createZodEnum(values, params) {
    return new ZodEnum({
        values,
        typeName: ZodFirstPartyTypeKind.ZodEnum,
        ...processCreateParams(params),
    });
}
class ZodEnum extends ZodType {
    _parse(input) {
        if (typeof input.data !== "string") {
            const ctx = this._getOrReturnCtx(input);
            const expectedValues = this._def.values;
            addIssueToContext(ctx, {
                expected: util.joinValues(expectedValues),
                received: ctx.parsedType,
                code: ZodIssueCode.invalid_type,
            });
            return INVALID;
        }
        if (this._def.values.indexOf(input.data) === -1) {
            const ctx = this._getOrReturnCtx(input);
            const expectedValues = this._def.values;
            addIssueToContext(ctx, {
                received: ctx.data,
                code: ZodIssueCode.invalid_enum_value,
                options: expectedValues,
            });
            return INVALID;
        }
        return OK(input.data);
    }
    get options() {
        return this._def.values;
    }
    get enum() {
        const enumValues = {};
        for (const val of this._def.values) {
            enumValues[val] = val;
        }
        return enumValues;
    }
    get Values() {
        const enumValues = {};
        for (const val of this._def.values) {
            enumValues[val] = val;
        }
        return enumValues;
    }
    get Enum() {
        const enumValues = {};
        for (const val of this._def.values) {
            enumValues[val] = val;
        }
        return enumValues;
    }
    extract(values) {
        return ZodEnum.create(values);
    }
    exclude(values) {
        return ZodEnum.create(this.options.filter((opt) => !values.includes(opt)));
    }
}
ZodEnum.create = createZodEnum;
class ZodNativeEnum extends ZodType {
    _parse(input) {
        const nativeEnumValues = util.getValidEnumValues(this._def.values);
        const ctx = this._getOrReturnCtx(input);
        if (ctx.parsedType !== ZodParsedType.string &&
            ctx.parsedType !== ZodParsedType.number) {
            const expectedValues = util.objectValues(nativeEnumValues);
            addIssueToContext(ctx, {
                expected: util.joinValues(expectedValues),
                received: ctx.parsedType,
                code: ZodIssueCode.invalid_type,
            });
            return INVALID;
        }
        if (nativeEnumValues.indexOf(input.data) === -1) {
            const expectedValues = util.objectValues(nativeEnumValues);
            addIssueToContext(ctx, {
                received: ctx.data,
                code: ZodIssueCode.invalid_enum_value,
                options: expectedValues,
            });
            return INVALID;
        }
        return OK(input.data);
    }
    get enum() {
        return this._def.values;
    }
}
ZodNativeEnum.create = (values, params) => {
    return new ZodNativeEnum({
        values: values,
        typeName: ZodFirstPartyTypeKind.ZodNativeEnum,
        ...processCreateParams(params),
    });
};
class ZodPromise extends ZodType {
    unwrap() {
        return this._def.type;
    }
    _parse(input) {
        const { ctx } = this._processInputParams(input);
        if (ctx.parsedType !== ZodParsedType.promise &&
            ctx.common.async === false) {
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.promise,
                received: ctx.parsedType,
            });
            return INVALID;
        }
        const promisified = ctx.parsedType === ZodParsedType.promise
            ? ctx.data
            : Promise.resolve(ctx.data);
        return OK(promisified.then((data) => {
            return this._def.type.parseAsync(data, {
                path: ctx.path,
                errorMap: ctx.common.contextualErrorMap,
            });
        }));
    }
}
ZodPromise.create = (schema, params) => {
    return new ZodPromise({
        type: schema,
        typeName: ZodFirstPartyTypeKind.ZodPromise,
        ...processCreateParams(params),
    });
};
class ZodEffects extends ZodType {
    innerType() {
        return this._def.schema;
    }
    sourceType() {
        return this._def.schema._def.typeName === ZodFirstPartyTypeKind.ZodEffects
            ? this._def.schema.sourceType()
            : this._def.schema;
    }
    _parse(input) {
        const { status, ctx } = this._processInputParams(input);
        const effect = this._def.effect || null;
        const checkCtx = {
            addIssue: (arg) => {
                addIssueToContext(ctx, arg);
                if (arg.fatal) {
                    status.abort();
                }
                else {
                    status.dirty();
                }
            },
            get path() {
                return ctx.path;
            },
        };
        checkCtx.addIssue = checkCtx.addIssue.bind(checkCtx);
        if (effect.type === "preprocess") {
            const processed = effect.transform(ctx.data, checkCtx);
            if (ctx.common.issues.length) {
                return {
                    status: "dirty",
                    value: ctx.data,
                };
            }
            if (ctx.common.async) {
                return Promise.resolve(processed).then((processed) => {
                    return this._def.schema._parseAsync({
                        data: processed,
                        path: ctx.path,
                        parent: ctx,
                    });
                });
            }
            else {
                return this._def.schema._parseSync({
                    data: processed,
                    path: ctx.path,
                    parent: ctx,
                });
            }
        }
        if (effect.type === "refinement") {
            const executeRefinement = (acc
            // effect: RefinementEffect<any>
            ) => {
                const result = effect.refinement(acc, checkCtx);
                if (ctx.common.async) {
                    return Promise.resolve(result);
                }
                if (result instanceof Promise) {
                    throw new Error("Async refinement encountered during synchronous parse operation. Use .parseAsync instead.");
                }
                return acc;
            };
            if (ctx.common.async === false) {
                const inner = this._def.schema._parseSync({
                    data: ctx.data,
                    path: ctx.path,
                    parent: ctx,
                });
                if (inner.status === "aborted")
                    return INVALID;
                if (inner.status === "dirty")
                    status.dirty();
                // return value is ignored
                executeRefinement(inner.value);
                return { status: status.value, value: inner.value };
            }
            else {
                return this._def.schema
                    ._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx })
                    .then((inner) => {
                    if (inner.status === "aborted")
                        return INVALID;
                    if (inner.status === "dirty")
                        status.dirty();
                    return executeRefinement(inner.value).then(() => {
                        return { status: status.value, value: inner.value };
                    });
                });
            }
        }
        if (effect.type === "transform") {
            if (ctx.common.async === false) {
                const base = this._def.schema._parseSync({
                    data: ctx.data,
                    path: ctx.path,
                    parent: ctx,
                });
                if (!isValid(base))
                    return base;
                const result = effect.transform(base.value, checkCtx);
                if (result instanceof Promise) {
                    throw new Error(`Asynchronous transform encountered during synchronous parse operation. Use .parseAsync instead.`);
                }
                return { status: status.value, value: result };
            }
            else {
                return this._def.schema
                    ._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx })
                    .then((base) => {
                    if (!isValid(base))
                        return base;
                    return Promise.resolve(effect.transform(base.value, checkCtx)).then((result) => ({ status: status.value, value: result }));
                });
            }
        }
        util.assertNever(effect);
    }
}
ZodEffects.create = (schema, effect, params) => {
    return new ZodEffects({
        schema,
        typeName: ZodFirstPartyTypeKind.ZodEffects,
        effect,
        ...processCreateParams(params),
    });
};
ZodEffects.createWithPreprocess = (preprocess, schema, params) => {
    return new ZodEffects({
        schema,
        effect: { type: "preprocess", transform: preprocess },
        typeName: ZodFirstPartyTypeKind.ZodEffects,
        ...processCreateParams(params),
    });
};
class ZodOptional extends ZodType {
    _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType === ZodParsedType.undefined) {
            return OK(undefined);
        }
        return this._def.innerType._parse(input);
    }
    unwrap() {
        return this._def.innerType;
    }
}
ZodOptional.create = (type, params) => {
    return new ZodOptional({
        innerType: type,
        typeName: ZodFirstPartyTypeKind.ZodOptional,
        ...processCreateParams(params),
    });
};
class ZodNullable extends ZodType {
    _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType === ZodParsedType.null) {
            return OK(null);
        }
        return this._def.innerType._parse(input);
    }
    unwrap() {
        return this._def.innerType;
    }
}
ZodNullable.create = (type, params) => {
    return new ZodNullable({
        innerType: type,
        typeName: ZodFirstPartyTypeKind.ZodNullable,
        ...processCreateParams(params),
    });
};
class ZodDefault extends ZodType {
    _parse(input) {
        const { ctx } = this._processInputParams(input);
        let data = ctx.data;
        if (ctx.parsedType === ZodParsedType.undefined) {
            data = this._def.defaultValue();
        }
        return this._def.innerType._parse({
            data,
            path: ctx.path,
            parent: ctx,
        });
    }
    removeDefault() {
        return this._def.innerType;
    }
}
ZodDefault.create = (type, params) => {
    return new ZodDefault({
        innerType: type,
        typeName: ZodFirstPartyTypeKind.ZodDefault,
        defaultValue: typeof params.default === "function"
            ? params.default
            : () => params.default,
        ...processCreateParams(params),
    });
};
class ZodCatch extends ZodType {
    _parse(input) {
        const { ctx } = this._processInputParams(input);
        // newCtx is used to not collect issues from inner types in ctx
        const newCtx = {
            ...ctx,
            common: {
                ...ctx.common,
                issues: [],
            },
        };
        const result = this._def.innerType._parse({
            data: newCtx.data,
            path: newCtx.path,
            parent: {
                ...newCtx,
            },
        });
        if (isAsync(result)) {
            return result.then((result) => {
                return {
                    status: "valid",
                    value: result.status === "valid"
                        ? result.value
                        : this._def.catchValue({
                            get error() {
                                return new ZodError(newCtx.common.issues);
                            },
                            input: newCtx.data,
                        }),
                };
            });
        }
        else {
            return {
                status: "valid",
                value: result.status === "valid"
                    ? result.value
                    : this._def.catchValue({
                        get error() {
                            return new ZodError(newCtx.common.issues);
                        },
                        input: newCtx.data,
                    }),
            };
        }
    }
    removeCatch() {
        return this._def.innerType;
    }
}
ZodCatch.create = (type, params) => {
    return new ZodCatch({
        innerType: type,
        typeName: ZodFirstPartyTypeKind.ZodCatch,
        catchValue: typeof params.catch === "function" ? params.catch : () => params.catch,
        ...processCreateParams(params),
    });
};
class ZodNaN extends ZodType {
    _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.nan) {
            const ctx = this._getOrReturnCtx(input);
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.nan,
                received: ctx.parsedType,
            });
            return INVALID;
        }
        return { status: "valid", value: input.data };
    }
}
ZodNaN.create = (params) => {
    return new ZodNaN({
        typeName: ZodFirstPartyTypeKind.ZodNaN,
        ...processCreateParams(params),
    });
};
const BRAND = Symbol("zod_brand");
class ZodBranded extends ZodType {
    _parse(input) {
        const { ctx } = this._processInputParams(input);
        const data = ctx.data;
        return this._def.type._parse({
            data,
            path: ctx.path,
            parent: ctx,
        });
    }
    unwrap() {
        return this._def.type;
    }
}
class ZodPipeline extends ZodType {
    _parse(input) {
        const { status, ctx } = this._processInputParams(input);
        if (ctx.common.async) {
            const handleAsync = async () => {
                const inResult = await this._def.in._parseAsync({
                    data: ctx.data,
                    path: ctx.path,
                    parent: ctx,
                });
                if (inResult.status === "aborted")
                    return INVALID;
                if (inResult.status === "dirty") {
                    status.dirty();
                    return DIRTY(inResult.value);
                }
                else {
                    return this._def.out._parseAsync({
                        data: inResult.value,
                        path: ctx.path,
                        parent: ctx,
                    });
                }
            };
            return handleAsync();
        }
        else {
            const inResult = this._def.in._parseSync({
                data: ctx.data,
                path: ctx.path,
                parent: ctx,
            });
            if (inResult.status === "aborted")
                return INVALID;
            if (inResult.status === "dirty") {
                status.dirty();
                return {
                    status: "dirty",
                    value: inResult.value,
                };
            }
            else {
                return this._def.out._parseSync({
                    data: inResult.value,
                    path: ctx.path,
                    parent: ctx,
                });
            }
        }
    }
    static create(a, b) {
        return new ZodPipeline({
            in: a,
            out: b,
            typeName: ZodFirstPartyTypeKind.ZodPipeline,
        });
    }
}
class ZodReadonly extends ZodType {
    _parse(input) {
        const result = this._def.innerType._parse(input);
        if (isValid(result)) {
            result.value = Object.freeze(result.value);
        }
        return result;
    }
}
ZodReadonly.create = (type, params) => {
    return new ZodReadonly({
        innerType: type,
        typeName: ZodFirstPartyTypeKind.ZodReadonly,
        ...processCreateParams(params),
    });
};
const custom = (check, params = {}, 
/**
 * @deprecated
 *
 * Pass `fatal` into the params object instead:
 *
 * ```ts
 * z.string().custom((val) => val.length > 5, { fatal: false })
 * ```
 *
 */
fatal) => {
    if (check)
        return ZodAny.create().superRefine((data, ctx) => {
            var _a, _b;
            if (!check(data)) {
                const p = typeof params === "function"
                    ? params(data)
                    : typeof params === "string"
                        ? { message: params }
                        : params;
                const _fatal = (_b = (_a = p.fatal) !== null && _a !== void 0 ? _a : fatal) !== null && _b !== void 0 ? _b : true;
                const p2 = typeof p === "string" ? { message: p } : p;
                ctx.addIssue({ code: "custom", ...p2, fatal: _fatal });
            }
        });
    return ZodAny.create();
};
const late = {
    object: ZodObject.lazycreate,
};
var ZodFirstPartyTypeKind;
(function (ZodFirstPartyTypeKind) {
    ZodFirstPartyTypeKind["ZodString"] = "ZodString";
    ZodFirstPartyTypeKind["ZodNumber"] = "ZodNumber";
    ZodFirstPartyTypeKind["ZodNaN"] = "ZodNaN";
    ZodFirstPartyTypeKind["ZodBigInt"] = "ZodBigInt";
    ZodFirstPartyTypeKind["ZodBoolean"] = "ZodBoolean";
    ZodFirstPartyTypeKind["ZodDate"] = "ZodDate";
    ZodFirstPartyTypeKind["ZodSymbol"] = "ZodSymbol";
    ZodFirstPartyTypeKind["ZodUndefined"] = "ZodUndefined";
    ZodFirstPartyTypeKind["ZodNull"] = "ZodNull";
    ZodFirstPartyTypeKind["ZodAny"] = "ZodAny";
    ZodFirstPartyTypeKind["ZodUnknown"] = "ZodUnknown";
    ZodFirstPartyTypeKind["ZodNever"] = "ZodNever";
    ZodFirstPartyTypeKind["ZodVoid"] = "ZodVoid";
    ZodFirstPartyTypeKind["ZodArray"] = "ZodArray";
    ZodFirstPartyTypeKind["ZodObject"] = "ZodObject";
    ZodFirstPartyTypeKind["ZodUnion"] = "ZodUnion";
    ZodFirstPartyTypeKind["ZodDiscriminatedUnion"] = "ZodDiscriminatedUnion";
    ZodFirstPartyTypeKind["ZodIntersection"] = "ZodIntersection";
    ZodFirstPartyTypeKind["ZodTuple"] = "ZodTuple";
    ZodFirstPartyTypeKind["ZodRecord"] = "ZodRecord";
    ZodFirstPartyTypeKind["ZodMap"] = "ZodMap";
    ZodFirstPartyTypeKind["ZodSet"] = "ZodSet";
    ZodFirstPartyTypeKind["ZodFunction"] = "ZodFunction";
    ZodFirstPartyTypeKind["ZodLazy"] = "ZodLazy";
    ZodFirstPartyTypeKind["ZodLiteral"] = "ZodLiteral";
    ZodFirstPartyTypeKind["ZodEnum"] = "ZodEnum";
    ZodFirstPartyTypeKind["ZodEffects"] = "ZodEffects";
    ZodFirstPartyTypeKind["ZodNativeEnum"] = "ZodNativeEnum";
    ZodFirstPartyTypeKind["ZodOptional"] = "ZodOptional";
    ZodFirstPartyTypeKind["ZodNullable"] = "ZodNullable";
    ZodFirstPartyTypeKind["ZodDefault"] = "ZodDefault";
    ZodFirstPartyTypeKind["ZodCatch"] = "ZodCatch";
    ZodFirstPartyTypeKind["ZodPromise"] = "ZodPromise";
    ZodFirstPartyTypeKind["ZodBranded"] = "ZodBranded";
    ZodFirstPartyTypeKind["ZodPipeline"] = "ZodPipeline";
    ZodFirstPartyTypeKind["ZodReadonly"] = "ZodReadonly";
})(ZodFirstPartyTypeKind || (ZodFirstPartyTypeKind = {}));
const instanceOfType = (
// const instanceOfType = <T extends new (...args: any[]) => any>(
cls, params = {
    message: `Input not instance of ${cls.name}`,
}) => custom((data) => data instanceof cls, params);
const stringType = ZodString.create;
const numberType = ZodNumber.create;
const nanType = ZodNaN.create;
const bigIntType = ZodBigInt.create;
const booleanType = ZodBoolean.create;
const dateType = ZodDate.create;
const symbolType = ZodSymbol.create;
const undefinedType = ZodUndefined.create;
const nullType = ZodNull.create;
const anyType = ZodAny.create;
const unknownType = ZodUnknown.create;
const neverType = ZodNever.create;
const voidType = ZodVoid.create;
const arrayType = ZodArray.create;
const objectType = ZodObject.create;
const strictObjectType = ZodObject.strictCreate;
const unionType = ZodUnion.create;
const discriminatedUnionType = ZodDiscriminatedUnion.create;
const intersectionType = ZodIntersection.create;
const tupleType = ZodTuple.create;
const recordType = ZodRecord.create;
const mapType = ZodMap.create;
const setType = ZodSet.create;
const functionType = ZodFunction.create;
const lazyType = ZodLazy.create;
const literalType = ZodLiteral.create;
const enumType = ZodEnum.create;
const nativeEnumType = ZodNativeEnum.create;
const promiseType = ZodPromise.create;
const effectsType = ZodEffects.create;
const optionalType = ZodOptional.create;
const nullableType = ZodNullable.create;
const preprocessType = ZodEffects.createWithPreprocess;
const pipelineType = ZodPipeline.create;
const ostring = () => stringType().optional();
const onumber = () => numberType().optional();
const oboolean = () => booleanType().optional();
const coerce = {
    string: ((arg) => ZodString.create({ ...arg, coerce: true })),
    number: ((arg) => ZodNumber.create({ ...arg, coerce: true })),
    boolean: ((arg) => ZodBoolean.create({
        ...arg,
        coerce: true,
    })),
    bigint: ((arg) => ZodBigInt.create({ ...arg, coerce: true })),
    date: ((arg) => ZodDate.create({ ...arg, coerce: true })),
};
const NEVER = INVALID;

var z = /*#__PURE__*/Object.freeze({
    __proto__: null,
    defaultErrorMap: errorMap,
    setErrorMap: setErrorMap,
    getErrorMap: getErrorMap,
    makeIssue: makeIssue,
    EMPTY_PATH: EMPTY_PATH,
    addIssueToContext: addIssueToContext,
    ParseStatus: ParseStatus,
    INVALID: INVALID,
    DIRTY: DIRTY,
    OK: OK,
    isAborted: isAborted,
    isDirty: isDirty,
    isValid: isValid,
    isAsync: isAsync,
    get util () { return util; },
    get objectUtil () { return objectUtil; },
    ZodParsedType: ZodParsedType,
    getParsedType: getParsedType,
    ZodType: ZodType,
    ZodString: ZodString,
    ZodNumber: ZodNumber,
    ZodBigInt: ZodBigInt,
    ZodBoolean: ZodBoolean,
    ZodDate: ZodDate,
    ZodSymbol: ZodSymbol,
    ZodUndefined: ZodUndefined,
    ZodNull: ZodNull,
    ZodAny: ZodAny,
    ZodUnknown: ZodUnknown,
    ZodNever: ZodNever,
    ZodVoid: ZodVoid,
    ZodArray: ZodArray,
    ZodObject: ZodObject,
    ZodUnion: ZodUnion,
    ZodDiscriminatedUnion: ZodDiscriminatedUnion,
    ZodIntersection: ZodIntersection,
    ZodTuple: ZodTuple,
    ZodRecord: ZodRecord,
    ZodMap: ZodMap,
    ZodSet: ZodSet,
    ZodFunction: ZodFunction,
    ZodLazy: ZodLazy,
    ZodLiteral: ZodLiteral,
    ZodEnum: ZodEnum,
    ZodNativeEnum: ZodNativeEnum,
    ZodPromise: ZodPromise,
    ZodEffects: ZodEffects,
    ZodTransformer: ZodEffects,
    ZodOptional: ZodOptional,
    ZodNullable: ZodNullable,
    ZodDefault: ZodDefault,
    ZodCatch: ZodCatch,
    ZodNaN: ZodNaN,
    BRAND: BRAND,
    ZodBranded: ZodBranded,
    ZodPipeline: ZodPipeline,
    ZodReadonly: ZodReadonly,
    custom: custom,
    Schema: ZodType,
    ZodSchema: ZodType,
    late: late,
    get ZodFirstPartyTypeKind () { return ZodFirstPartyTypeKind; },
    coerce: coerce,
    any: anyType,
    array: arrayType,
    bigint: bigIntType,
    boolean: booleanType,
    date: dateType,
    discriminatedUnion: discriminatedUnionType,
    effect: effectsType,
    'enum': enumType,
    'function': functionType,
    'instanceof': instanceOfType,
    intersection: intersectionType,
    lazy: lazyType,
    literal: literalType,
    map: mapType,
    nan: nanType,
    nativeEnum: nativeEnumType,
    never: neverType,
    'null': nullType,
    nullable: nullableType,
    number: numberType,
    object: objectType,
    oboolean: oboolean,
    onumber: onumber,
    optional: optionalType,
    ostring: ostring,
    pipeline: pipelineType,
    preprocess: preprocessType,
    promise: promiseType,
    record: recordType,
    set: setType,
    strictObject: strictObjectType,
    string: stringType,
    symbol: symbolType,
    transformer: effectsType,
    tuple: tupleType,
    'undefined': undefinedType,
    union: unionType,
    unknown: unknownType,
    'void': voidType,
    NEVER: NEVER,
    ZodIssueCode: ZodIssueCode,
    quotelessJson: quotelessJson,
    ZodError: ZodError
});



;// CONCATENATED MODULE: ./types/constants.ts

const COMP_NAME = "MyComp";
const CompositionProps = z.object({
  title: z.string()
});
const defaultMyCompProps = {
  title: "Next.js and Remotion"
};
const DURATION_IN_FRAMES = 200;
const VIDEO_WIDTH = 1280;
const VIDEO_HEIGHT = 720;
const VIDEO_FPS = 30;

;// CONCATENATED MODULE: ./remotion/Root.tsx




const RemotionRoot = () => {
  return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(
    cjs.Composition,
    {
      id: COMP_NAME,
      component: Main,
      durationInFrames: DURATION_IN_FRAMES,
      fps: VIDEO_FPS,
      width: VIDEO_WIDTH,
      height: VIDEO_HEIGHT,
      defaultProps: defaultMyCompProps
    }
  ), /* @__PURE__ */ React.createElement(
    cjs.Composition,
    {
      id: "NextLogo",
      component: NextLogo,
      durationInFrames: 300,
      fps: 30,
      width: 140,
      height: 140,
      defaultProps: {
        outProgress: 0
      }
    }
  ));
};

// EXTERNAL MODULE: ./node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js
var injectStylesIntoStyleTag = __webpack_require__(93379);
var injectStylesIntoStyleTag_default = /*#__PURE__*/__webpack_require__.n(injectStylesIntoStyleTag);
// EXTERNAL MODULE: ./node_modules/css-loader/dist/cjs.js!./node_modules/postcss-loader/dist/cjs.js??ruleSet[1].rules[4].use[2]!./styles/global.css
var global = __webpack_require__(76656);
;// CONCATENATED MODULE: ./styles/global.css

            

var options = {};

options.insert = "head";
options.singleton = false;

var update = injectStylesIntoStyleTag_default()(global/* default */.Z, options);



/* harmony default export */ const styles_global = (global/* default.locals */.Z.locals || {});
;// CONCATENATED MODULE: ./remotion/index.ts



(0,cjs.registerRoot)(RemotionRoot);

})();

// This entry need to be wrapped in an IIFE because it need to be isolated against other entry modules.
(() => {
var react__WEBPACK_IMPORTED_MODULE_0___namespace_cache;
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(67294);


if (typeof globalThis === 'undefined') {
	window.React = /*#__PURE__*/ (react__WEBPACK_IMPORTED_MODULE_0___namespace_cache || (react__WEBPACK_IMPORTED_MODULE_0___namespace_cache = __webpack_require__.t(react__WEBPACK_IMPORTED_MODULE_0__, 2)));
} else {
	globalThis.React = /*#__PURE__*/ (react__WEBPACK_IMPORTED_MODULE_0___namespace_cache || (react__WEBPACK_IMPORTED_MODULE_0___namespace_cache = __webpack_require__.t(react__WEBPACK_IMPORTED_MODULE_0__, 2)));
}

})();

// This entry need to be wrapped in an IIFE because it need to be isolated against other entry modules.
(() => {
/* unused harmony export setBundleModeAndUpdate */
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(67294);
/* harmony import */ var react_dom_client__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(20745);
/* harmony import */ var remotion__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(27982);
/* harmony import */ var remotion__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(remotion__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var remotion_no_react__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(60808);




let currentBundleMode = {
  type: "index"
};
const setBundleMode = (state) => {
  currentBundleMode = state;
};
const getBundleMode = () => {
  return currentBundleMode;
};
remotion__WEBPACK_IMPORTED_MODULE_2__.Internals.CSSUtils.injectCSS(
  remotion__WEBPACK_IMPORTED_MODULE_2__.Internals.CSSUtils.makeDefaultCSS(null, "#1f2428")
);
const getCanSerializeDefaultProps = (object) => {
  try {
    const str = JSON.stringify(object);
    return str.length < 256 * 1024 * 1024 * 0.9;
  } catch (err) {
    if (err.message.includes("Invalid string length")) {
      return false;
    }
    throw err;
  }
};
const isInHeadlessBrowser = () => {
  return typeof window.remotion_puppeteerTimeout !== "undefined";
};
const DelayedSpinner = () => {
  const [show, setShow] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(false);
  (0,react__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
    const timeout = setTimeout(() => {
      setShow(true);
    }, 2e3);
    return () => {
      clearTimeout(timeout);
    };
  }, []);
  if (!show) {
    return null;
  }
  return /* @__PURE__ */ react__WEBPACK_IMPORTED_MODULE_0__.createElement(
    remotion__WEBPACK_IMPORTED_MODULE_2__.AbsoluteFill,
    {
      style: {
        justifyContent: "center",
        alignItems: "center",
        fontSize: 13,
        opacity: 0.6,
        color: "white",
        fontFamily: "Helvetica, Arial, sans-serif"
      }
    },
    "Loading Studio"
  );
};
const GetVideo = ({ state }) => {
  const video = remotion__WEBPACK_IMPORTED_MODULE_2__.Internals.useVideo();
  const compositions = (0,react__WEBPACK_IMPORTED_MODULE_0__.useContext)(remotion__WEBPACK_IMPORTED_MODULE_2__.Internals.CompositionManager);
  const portalContainer = (0,react__WEBPACK_IMPORTED_MODULE_0__.useRef)(null);
  const [handle] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(
    () => (0,remotion__WEBPACK_IMPORTED_MODULE_2__.delayRender)("Wait for Composition" + JSON.stringify(state))
  );
  (0,react__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
    return () => (0,remotion__WEBPACK_IMPORTED_MODULE_2__.continueRender)(handle);
  }, [handle]);
  (0,react__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
    if (state.type !== "composition") {
      return;
    }
    if (!video && compositions.compositions.length > 0) {
      const foundComposition = compositions.compositions.find(
        (c) => c.id === state.compositionName
      );
      if (!foundComposition) {
        throw new Error(
          `Found no composition with the name ${state.compositionName}. The following compositions were found instead: ${compositions.compositions.map((c) => c.id).join(
            ", "
          )}. All compositions must have their ID calculated deterministically and must be mounted at the same time.`
        );
      }
      if (foundComposition) {
        compositions.setCanvasContent({
          type: "composition",
          compositionId: foundComposition.id
        });
      } else {
        compositions.setCanvasContent(null);
      }
      compositions.setCurrentCompositionMetadata({
        props: remotion_no_react__WEBPACK_IMPORTED_MODULE_3__.NoReactInternals.deserializeJSONWithCustomFields(
          state.serializedResolvedPropsWithSchema
        ),
        durationInFrames: state.compositionDurationInFrames,
        fps: state.compositionFps,
        height: state.compositionHeight,
        width: state.compositionWidth,
        defaultCodec: state.compositionDefaultCodec
      });
    }
  }, [compositions, compositions.compositions, state, video]);
  (0,react__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
    if (state.type === "evaluation") {
      (0,remotion__WEBPACK_IMPORTED_MODULE_2__.continueRender)(handle);
    } else if (video) {
      (0,remotion__WEBPACK_IMPORTED_MODULE_2__.continueRender)(handle);
    }
  }, [handle, state.type, video]);
  (0,react__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
    if (!video) {
      return;
    }
    const { current } = portalContainer;
    if (!current) {
      throw new Error("portal did not render");
    }
    current.appendChild(remotion__WEBPACK_IMPORTED_MODULE_2__.Internals.portalNode());
    return () => {
      current.removeChild(remotion__WEBPACK_IMPORTED_MODULE_2__.Internals.portalNode());
    };
  }, [video]);
  if (!video) {
    return null;
  }
  return /* @__PURE__ */ react__WEBPACK_IMPORTED_MODULE_0__.createElement(
    "div",
    {
      ref: portalContainer,
      id: "remotion-canvas",
      style: {
        width: video.width,
        height: video.height,
        display: "flex",
        backgroundColor: "transparent"
      }
    }
  );
};
const waitForRootHandle = (0,remotion__WEBPACK_IMPORTED_MODULE_2__.delayRender)(
  "Loading root component - See https://remotion.dev/docs/troubleshooting/loading-root-component if you experience a timeout"
);
const videoContainer = document.getElementById(
  "video-container"
);
let root = null;
const getRootForElement = () => {
  if (root) {
    return root;
  }
  root = react_dom_client__WEBPACK_IMPORTED_MODULE_1__.createRoot(videoContainer);
  return root;
};
const renderToDOM = (content) => {
  if (react_dom_client__WEBPACK_IMPORTED_MODULE_1__.createRoot) {
    getRootForElement().render(content);
  } else {
    react_dom_client__WEBPACK_IMPORTED_MODULE_1__.render(
      content,
      videoContainer
    );
  }
};
const renderContent = (Root) => {
  const bundleMode = getBundleMode();
  if (bundleMode.type === "composition") {
    const markup = /* @__PURE__ */ react__WEBPACK_IMPORTED_MODULE_0__.createElement(remotion__WEBPACK_IMPORTED_MODULE_2__.Internals.RemotionRoot, { numberOfAudioTags: 0 }, /* @__PURE__ */ react__WEBPACK_IMPORTED_MODULE_0__.createElement(Root, null), /* @__PURE__ */ react__WEBPACK_IMPORTED_MODULE_0__.createElement(GetVideo, { state: bundleMode }));
    renderToDOM(markup);
  }
  if (bundleMode.type === "evaluation") {
    const markup = /* @__PURE__ */ react__WEBPACK_IMPORTED_MODULE_0__.createElement(remotion__WEBPACK_IMPORTED_MODULE_2__.Internals.RemotionRoot, { numberOfAudioTags: 0 }, /* @__PURE__ */ react__WEBPACK_IMPORTED_MODULE_0__.createElement(Root, null), /* @__PURE__ */ react__WEBPACK_IMPORTED_MODULE_0__.createElement(GetVideo, { state: bundleMode }));
    renderToDOM(markup);
  }
  if (bundleMode.type === "index") {
    if (isInHeadlessBrowser()) {
      return;
    }
    renderToDOM(
      /* @__PURE__ */ react__WEBPACK_IMPORTED_MODULE_0__.createElement("div", null, /* @__PURE__ */ react__WEBPACK_IMPORTED_MODULE_0__.createElement(DelayedSpinner, null))
    );
    __webpack_require__.e(/* import() */ 612).then(__webpack_require__.bind(__webpack_require__, 78612)).then(({ Studio }) => {
      renderToDOM(/* @__PURE__ */ react__WEBPACK_IMPORTED_MODULE_0__.createElement(Studio, { readOnly: true, rootComponent: Root }));
    }).catch((err) => {
      renderToDOM(/* @__PURE__ */ react__WEBPACK_IMPORTED_MODULE_0__.createElement("div", null, "Failed to load Remotion Studio: ", err.message));
    });
  }
};
remotion__WEBPACK_IMPORTED_MODULE_2__.Internals.waitForRoot((Root) => {
  renderContent(Root);
  (0,remotion__WEBPACK_IMPORTED_MODULE_2__.continueRender)(waitForRootHandle);
});
const setBundleModeAndUpdate = (state) => {
  setBundleMode(state);
  const delay = (0,remotion__WEBPACK_IMPORTED_MODULE_2__.delayRender)(
    "Waiting for root component to load - See https://remotion.dev/docs/troubleshooting/loading-root-component if you experience a timeout"
  );
  remotion__WEBPACK_IMPORTED_MODULE_2__.Internals.waitForRoot((Root) => {
    renderContent(Root);
    requestAnimationFrame(() => {
      (0,remotion__WEBPACK_IMPORTED_MODULE_2__.continueRender)(delay);
    });
  });
};
if (typeof window !== "undefined") {
  const getUnevaluatedComps = () => {
    if (!remotion__WEBPACK_IMPORTED_MODULE_2__.Internals.getRoot()) {
      throw new Error(
        "registerRoot() was never called. 1. Make sure you specified the correct entrypoint for your bundle. 2. If your registerRoot() call is deferred, use the delayRender/continueRender pattern to tell Remotion to wait."
      );
    }
    if (!remotion__WEBPACK_IMPORTED_MODULE_2__.Internals.compositionsRef.current) {
      throw new Error("Unexpectedly did not have a CompositionManager");
    }
    const compositions = remotion__WEBPACK_IMPORTED_MODULE_2__.Internals.compositionsRef.current.getCompositions();
    const canSerializeDefaultProps = getCanSerializeDefaultProps(compositions);
    if (!canSerializeDefaultProps) {
      console.warn(
        "defaultProps are too big to serialize - trying to find the problematic composition..."
      );
      for (const comp of compositions) {
        if (!getCanSerializeDefaultProps(comp)) {
          throw new Error(
            `defaultProps too big - could not serialize - the defaultProps of composition with ID ${comp.id} - the object that was passed to defaultProps was too big. Learn how to mitigate this error by visiting https://remotion.dev/docs/troubleshooting/serialize-defaultprops`
          );
        }
      }
      console.warn(
        "Could not single out a problematic composition -  The composition list as a whole is too big to serialize."
      );
      throw new Error(
        "defaultProps too big - Could not serialize - an object that was passed to defaultProps was too big. Learn how to mitigate this error by visiting https://remotion.dev/docs/troubleshooting/serialize-defaultprops"
      );
    }
    return compositions;
  };
  window.getStaticCompositions = () => {
    const compositions = getUnevaluatedComps();
    const inputProps = typeof window === "undefined" || (0,remotion__WEBPACK_IMPORTED_MODULE_2__.getRemotionEnvironment)().isPlayer ? {} : (0,remotion__WEBPACK_IMPORTED_MODULE_2__.getInputProps)() ?? {};
    return Promise.all(
      compositions.map(async (c) => {
        const handle = (0,remotion__WEBPACK_IMPORTED_MODULE_2__.delayRender)(
          `Running calculateMetadata() for composition ${c.id}. If you didn't want to evaluate this composition, use "selectComposition()" instead of "getCompositions()"`
        );
        const comp = remotion__WEBPACK_IMPORTED_MODULE_2__.Internals.resolveVideoConfig({
          composition: c,
          editorProps: {},
          signal: new AbortController().signal,
          inputProps
        });
        const resolved = await Promise.resolve(comp);
        (0,remotion__WEBPACK_IMPORTED_MODULE_2__.continueRender)(handle);
        const { props, defaultProps, ...data } = resolved;
        return {
          ...data,
          serializedResolvedPropsWithCustomSchema: remotion_no_react__WEBPACK_IMPORTED_MODULE_3__.NoReactInternals.serializeJSONWithDate({
            data: props,
            indent: void 0,
            staticBase: null
          }).serializedString,
          serializedDefaultPropsWithCustomSchema: remotion_no_react__WEBPACK_IMPORTED_MODULE_3__.NoReactInternals.serializeJSONWithDate({
            data: defaultProps,
            indent: void 0,
            staticBase: null
          }).serializedString
        };
      })
    );
  };
  window.remotion_getCompositionNames = () => {
    return getUnevaluatedComps().map((c) => c.id);
  };
  window.remotion_calculateComposition = async (compId) => {
    const compositions = getUnevaluatedComps();
    const selectedComp = compositions.find((c) => c.id === compId);
    if (!selectedComp) {
      throw new Error(
        `Could not find composition with ID ${compId}. Available compositions: ${compositions.map((c) => c.id).join(", ")}`
      );
    }
    const abortController = new AbortController();
    const handle = (0,remotion__WEBPACK_IMPORTED_MODULE_2__.delayRender)(
      `Running the calculateMetadata() function for composition ${compId}`
    );
    const inputProps = typeof window === "undefined" || (0,remotion__WEBPACK_IMPORTED_MODULE_2__.getRemotionEnvironment)().isPlayer ? {} : (0,remotion__WEBPACK_IMPORTED_MODULE_2__.getInputProps)() ?? {};
    const prom = await Promise.resolve(
      remotion__WEBPACK_IMPORTED_MODULE_2__.Internals.resolveVideoConfig({
        composition: selectedComp,
        editorProps: {},
        signal: abortController.signal,
        inputProps
      })
    );
    (0,remotion__WEBPACK_IMPORTED_MODULE_2__.continueRender)(handle);
    const { props, defaultProps, ...data } = prom;
    return {
      ...data,
      serializedResolvedPropsWithCustomSchema: remotion_no_react__WEBPACK_IMPORTED_MODULE_3__.NoReactInternals.serializeJSONWithDate({
        data: props,
        indent: void 0,
        staticBase: null
      }).serializedString,
      serializedDefaultPropsWithCustomSchema: remotion_no_react__WEBPACK_IMPORTED_MODULE_3__.NoReactInternals.serializeJSONWithDate({
        data: defaultProps,
        indent: void 0,
        staticBase: null
      }).serializedString
    };
  };
  window.siteVersion = "11";
  window.remotion_version = remotion__WEBPACK_IMPORTED_MODULE_2__.VERSION;
  window.remotion_setBundleMode = setBundleModeAndUpdate;
}

})();

/******/ })()
;
//# sourceMappingURL=bundle.js.map