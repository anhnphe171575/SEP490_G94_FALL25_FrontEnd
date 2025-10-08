(globalThis.TURBOPACK = globalThis.TURBOPACK || []).push([typeof document === "object" ? document.currentScript : undefined, {

"[project]/src/lib/timeline.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "addDays": (()=>addDays),
    "getPeriodStart": (()=>getPeriodStart),
    "getSpanDays": (()=>getSpanDays),
    "getStartOfWeekUTC": (()=>getStartOfWeekUTC),
    "stripTimeUTC": (()=>stripTimeUTC)
});
function getSpanDays(viewMode, start) {
    switch(viewMode){
        case 'Days':
            return 7;
        case 'Weeks':
            return 7;
        case 'Months':
            return daysInMonthUTC(start);
        case 'Quarters':
            return isLeapYearUTC(start.getUTCFullYear()) ? 366 : 365; // show whole year segmented by quarters
        default:
            return 7;
    }
}
function getPeriodStart(viewMode, date) {
    const d = new Date(date);
    const strip = (x)=>{
        const t = new Date(x);
        t.setUTCHours(0, 0, 0, 0);
        return t;
    };
    switch(viewMode){
        case 'Days':
        case 'Weeks':
            return getStartOfWeekUTC(strip(d));
        case 'Months':
            return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
        case 'Quarters':
            return new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        default:
            return getStartOfWeekUTC(strip(d));
    }
}
function getStartOfWeekUTC(date) {
    const d = new Date(date);
    d.setUTCHours(0, 0, 0, 0);
    const day = d.getUTCDay();
    const diff = (day + 6) % 7;
    d.setUTCDate(d.getUTCDate() - diff);
    return d;
}
function stripTimeUTC(date) {
    const d = new Date(date);
    d.setUTCHours(0, 0, 0, 0);
    return d;
}
function addDays(date, days) {
    const d = new Date(date);
    d.setUTCDate(d.getUTCDate() + days);
    return d;
}
function daysInMonthUTC(date) {
    const y = date.getUTCFullYear();
    const m = date.getUTCMonth();
    return new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
}
function daysInQuarterUTC(date) {
    const qStartMonth = Math.floor(date.getUTCMonth() / 3) * 3;
    const start = new Date(Date.UTC(date.getUTCFullYear(), qStartMonth, 1));
    const end = new Date(Date.UTC(date.getUTCFullYear(), qStartMonth + 3, 0));
    return (stripTimeUTC(end).getTime() - stripTimeUTC(start).getTime()) / (24 * 60 * 60 * 1000) + 1;
}
function isLeapYearUTC(year) {
    return year % 4 === 0 && year % 100 !== 0 || year % 400 === 0;
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/components/GanttChart.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>GanttChart)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$timeline$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/timeline.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
function GanttChart({ milestones, viewMode, startDate, autoFit = true, pagingStepDays, onRequestShift, columnWidth = 160, enableDrag = true, enableWheelPan = true, enableEdgePaging = true, stickyScrollbar = true, statusColors }) {
    _s();
    const containerRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const bottomScrollRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const isSyncingRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(false);
    const periodStart = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "GanttChart.useMemo[periodStart]": ()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$timeline$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getPeriodStart"])(viewMode, startDate)
    }["GanttChart.useMemo[periodStart]"], [
        viewMode,
        startDate
    ]);
    const spanDays = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "GanttChart.useMemo[spanDays]": ()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$timeline$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getSpanDays"])(viewMode, startDate)
    }["GanttChart.useMemo[spanDays]"], [
        viewMode,
        startDate
    ]);
    const isQuarters = viewMode === "Quarters";
    const days = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "GanttChart.useMemo[days]": ()=>Array.from({
                length: spanDays
            }, {
                "GanttChart.useMemo[days]": (_, i)=>new Date(periodStart.getTime() + i * 24 * 60 * 60 * 1000)
            }["GanttChart.useMemo[days]"])
    }["GanttChart.useMemo[days]"], [
        spanDays,
        periodStart
    ]);
    const today = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$timeline$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["stripTimeUTC"])(new Date());
    const contentWidthPx = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "GanttChart.useMemo[contentWidthPx]": ()=>(isQuarters ? 4 : spanDays) * columnWidth
    }["GanttChart.useMemo[contentWidthPx]"], [
        isQuarters,
        spanDays,
        columnWidth
    ]);
    const isDraggingRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(false);
    const dragStartXRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(0);
    const dragStartScrollRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(0);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "GanttChart.useEffect": ()=>{
            // Keep scroll positions aligned when dimensions change
            const c = containerRef.current;
            const b = bottomScrollRef.current;
            if (!c || !b) return;
            b.scrollLeft = c.scrollLeft;
        }
    }["GanttChart.useEffect"], [
        contentWidthPx,
        viewMode,
        spanDays
    ]);
    const getX = (dateStr)=>{
        if (!dateStr) return 0;
        const d = new Date(dateStr);
        const diff = Math.floor(((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$timeline$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["stripTimeUTC"])(d).getTime() - (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$timeline$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["stripTimeUTC"])(periodStart).getTime()) / (24 * 60 * 60 * 1000));
        return Math.max(0, Math.min(spanDays - 1, diff));
    };
    const monthName = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "GanttChart.useMemo[monthName]": ()=>periodStart.toLocaleDateString("vi-VN", {
                month: "long",
                year: "numeric"
            })
    }["GanttChart.useMemo[monthName]"], [
        periodStart
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "w-full",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-end justify-between mb-2",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "text-lg font-semibold",
                                style: {
                                    color: "var(--primary)"
                                },
                                children: monthName.charAt(0).toUpperCase() + monthName.slice(1)
                            }, void 0, false, {
                                fileName: "[project]/src/components/GanttChart.tsx",
                                lineNumber: 86,
                                columnNumber: 11
                            }, this),
                            !isQuarters ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "text-sm opacity-70",
                                children: [
                                    days[0].toLocaleDateString("vi-VN"),
                                    " – ",
                                    days[Math.min(days.length - 1, 6)].toLocaleDateString("vi-VN")
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/GanttChart.tsx",
                                lineNumber: 90,
                                columnNumber: 13
                            }, this) : null
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/GanttChart.tsx",
                        lineNumber: 85,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-4 text-sm",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center gap-1",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "h-3 w-3 rounded-full bg-amber-400 inline-block"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/GanttChart.tsx",
                                        lineNumber: 96,
                                        columnNumber: 52
                                    }, this),
                                    " Working on it"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/GanttChart.tsx",
                                lineNumber: 96,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center gap-1",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "h-3 w-3 rounded-full bg-green-500 inline-block"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/GanttChart.tsx",
                                        lineNumber: 97,
                                        columnNumber: 52
                                    }, this),
                                    " Done"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/GanttChart.tsx",
                                lineNumber: 97,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center gap-1",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "h-3 w-3 rounded-full bg-red-500 inline-block"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/GanttChart.tsx",
                                        lineNumber: 98,
                                        columnNumber: 52
                                    }, this),
                                    " Stuck"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/GanttChart.tsx",
                                lineNumber: 98,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/GanttChart.tsx",
                        lineNumber: 95,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/GanttChart.tsx",
                lineNumber: 84,
                columnNumber: 7
            }, this),
            viewMode === "Quarters" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "text-center font-semibold mb-1",
                        style: {
                            color: "var(--primary)"
                        },
                        children: periodStart.getUTCFullYear()
                    }, void 0, false, {
                        fileName: "[project]/src/components/GanttChart.tsx",
                        lineNumber: 104,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "grid grid-cols-4 text-center text-xs md:text-sm font-medium mb-1 opacity-90",
                        children: [
                            "Q1",
                            "Q2",
                            "Q3",
                            "Q4"
                        ].map((q, idx)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: `${Math.floor(periodStart.getUTCMonth() / 3) === idx ? "bg-blue-600 text-white rounded-full mx-auto px-3 py-1" : ""}`,
                                children: q
                            }, q, false, {
                                fileName: "[project]/src/components/GanttChart.tsx",
                                lineNumber: 109,
                                columnNumber: 15
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/src/components/GanttChart.tsx",
                        lineNumber: 107,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "grid",
                style: {
                    gridTemplateColumns: `repeat(${spanDays}, minmax(0,1fr))`
                },
                children: days.map((d, i)=>{
                    const isToday = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$timeline$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["stripTimeUTC"])(d).getTime() === (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$timeline$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["stripTimeUTC"])(today).getTime();
                    const weekdayIdx = d.getUTCDay();
                    const short2 = [
                        "Su",
                        "Mo",
                        "Tu",
                        "We",
                        "Th",
                        "Fr",
                        "Sa"
                    ][weekdayIdx];
                    const label = `${short2} ${d.getUTCDate()}`;
                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "text-center font-medium text-xs md:text-sm mb-2 opacity-90",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: `${isToday ? "bg-blue-600 text-white px-3 py-1 rounded-full" : ""}`,
                            children: label
                        }, void 0, false, {
                            fileName: "[project]/src/components/GanttChart.tsx",
                            lineNumber: 122,
                            columnNumber: 17
                        }, this)
                    }, i, false, {
                        fileName: "[project]/src/components/GanttChart.tsx",
                        lineNumber: 121,
                        columnNumber: 15
                    }, this);
                })
            }, void 0, false, {
                fileName: "[project]/src/components/GanttChart.tsx",
                lineNumber: 114,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                ref: containerRef,
                className: "relative rounded-lg select-none",
                style: {
                    border: "1px solid rgba(17,24,39,0.08)",
                    overflowX: "hidden",
                    overflowY: "hidden",
                    background: "#ffffff"
                },
                onScroll: (e)=>{
                    const b = bottomScrollRef.current;
                    if (!b) return;
                    if (isSyncingRef.current) return;
                    isSyncingRef.current = true;
                    b.scrollLeft = e.currentTarget.scrollLeft;
                    isSyncingRef.current = false;
                    // Edge paging when reaching bounds
                    const c = e.currentTarget;
                    const max = c.scrollWidth - c.clientWidth;
                    const nearStart = c.scrollLeft <= 2;
                    const nearEnd = c.scrollLeft >= max - 2;
                    if (pagingStepDays && onRequestShift) {
                        if (nearEnd) {
                            onRequestShift(pagingStepDays);
                            // after parent shifts period, keep scroller at small offset
                            setTimeout(()=>{
                                c.scrollLeft = 4;
                                if (b) b.scrollLeft = c.scrollLeft;
                            }, 0);
                        } else if (nearStart) {
                            onRequestShift(-pagingStepDays);
                            setTimeout(()=>{
                                const newMax = c.scrollWidth - c.clientWidth;
                                c.scrollLeft = newMax - 4;
                                if (b) b.scrollLeft = c.scrollLeft;
                            }, 0);
                        }
                    }
                },
                onWheel: (e)=>{
                    if (!enableWheelPan) return;
                    const c = containerRef.current;
                    const b = bottomScrollRef.current;
                    if (!c) return;
                    // Convert vertical wheel to horizontal pan for convenience
                    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
                    c.scrollLeft += delta;
                    if (b) b.scrollLeft = c.scrollLeft;
                    // Check edges for paging
                    const max = c.scrollWidth - c.clientWidth;
                    const nearStart = c.scrollLeft <= 2;
                    const nearEnd = c.scrollLeft >= max - 2;
                    if (enableEdgePaging && pagingStepDays && onRequestShift) {
                        if (nearEnd) {
                            onRequestShift(pagingStepDays);
                            setTimeout(()=>{
                                c.scrollLeft = 4;
                                if (b) b.scrollLeft = c.scrollLeft;
                            }, 0);
                        } else if (nearStart) {
                            onRequestShift(-pagingStepDays);
                            setTimeout(()=>{
                                const newMax = c.scrollWidth - c.clientWidth;
                                c.scrollLeft = newMax - 4;
                                if (b) b.scrollLeft = c.scrollLeft;
                            }, 0);
                        }
                    }
                },
                onPointerDown: (e)=>{
                    if (!enableDrag) return;
                    const c = containerRef.current;
                    if (!c) return;
                    isDraggingRef.current = true;
                    dragStartXRef.current = e.clientX;
                    dragStartScrollRef.current = c.scrollLeft;
                    c.style.cursor = "grabbing";
                    e.currentTarget.setPointerCapture(e.pointerId);
                },
                onPointerMove: (e)=>{
                    if (!enableDrag) return;
                    const c = containerRef.current;
                    const b = bottomScrollRef.current;
                    if (!c || !isDraggingRef.current) return;
                    const dx = e.clientX - dragStartXRef.current;
                    c.scrollLeft = dragStartScrollRef.current - dx;
                    if (b) b.scrollLeft = c.scrollLeft;
                },
                onPointerUp: (e)=>{
                    if (!enableDrag) return;
                    const c = containerRef.current;
                    if (!c) return;
                    isDraggingRef.current = false;
                    c.style.cursor = "default";
                    e.currentTarget.releasePointerCapture(e.pointerId);
                },
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "relative",
                    style: {
                        width: `${contentWidthPx}px`
                    },
                    children: [
                        !isQuarters ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: `absolute inset-0 grid pointer-events-none`,
                            style: {
                                gridTemplateColumns: `repeat(${spanDays}, minmax(0, 1fr))`
                            },
                            children: days.map((_, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    style: {
                                        background: i % 7 === 5 || i % 7 === 6 ? "rgba(17,24,39,0.03)" : "transparent"
                                    }
                                }, i, false, {
                                    fileName: "[project]/src/components/GanttChart.tsx",
                                    lineNumber: 227,
                                    columnNumber: 17
                                }, this))
                        }, void 0, false, {
                            fileName: "[project]/src/components/GanttChart.tsx",
                            lineNumber: 225,
                            columnNumber: 13
                        }, this) : null,
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "relative",
                            style: {
                                display: "grid",
                                gridTemplateColumns: `repeat(${isQuarters ? 4 : spanDays}, minmax(0,1fr))`,
                                height: autoFit ? `${Math.max(180, milestones.length * 44 + 40)}px` : "260px"
                            },
                            children: (isQuarters ? Array.from({
                                length: 4
                            }) : days).map((_, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "relative last:border-r-0",
                                    style: {
                                        borderRight: "1px solid rgba(17,24,39,0.08)"
                                    },
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "absolute top-0 left-0 right-0",
                                        style: {
                                            height: 1,
                                            background: "rgba(17,24,39,0.08)"
                                        }
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/GanttChart.tsx",
                                        lineNumber: 235,
                                        columnNumber: 17
                                    }, this)
                                }, i, false, {
                                    fileName: "[project]/src/components/GanttChart.tsx",
                                    lineNumber: 234,
                                    columnNumber: 15
                                }, this))
                        }, void 0, false, {
                            fileName: "[project]/src/components/GanttChart.tsx",
                            lineNumber: 232,
                            columnNumber: 11
                        }, this),
                        !isQuarters ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(TodayLine, {
                            startOfPeriod: periodStart,
                            today: today
                        }, void 0, false, {
                            fileName: "[project]/src/components/GanttChart.tsx",
                            lineNumber: 240,
                            columnNumber: 26
                        }, this) : null,
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "absolute inset-0 space-y-2",
                            children: milestones.map((m)=>{
                                const startCandidate = m.start_date || m.createdAt || m.deadline;
                                const endCandidate = m.deadline || m.start_date;
                                let styleObj;
                                if (isQuarters) {
                                    const year = periodStart.getUTCFullYear();
                                    const qIndex = (d)=>Math.max(0, Math.min(3, d.getUTCFullYear() < year ? 0 : d.getUTCFullYear() > year ? 3 : Math.floor(d.getUTCMonth() / 3)));
                                    const sIdx = qIndex(new Date(startCandidate));
                                    const eIdx = qIndex(new Date(endCandidate || startCandidate));
                                    const spanQ = Math.max(1, eIdx - sIdx + 1);
                                    styleObj = {
                                        marginLeft: `${sIdx / 4 * 100}%`,
                                        width: `${spanQ / 4 * 100}%`
                                    };
                                } else {
                                    const start = getX(startCandidate);
                                    const end = getX(endCandidate);
                                    const span = Math.max(1, end - start + 1);
                                    styleObj = {
                                        marginLeft: `calc(${start}/${spanDays}*100%)`,
                                        width: `calc(${span}/${spanDays}*100%)`
                                    };
                                }
                                const defaultColor = m.status === "Completed" ? "bg-green-500/80 text-white" : m.status === "Overdue" ? "bg-red-500 text-white" : "bg-[#bfc3c9] text-white";
                                const color = statusColors?.[m.status || ""] || defaultColor;
                                const dateLabel = [
                                    m.start_date,
                                    m.deadline
                                ].filter(Boolean).map((d)=>new Date(d).toLocaleDateString("vi-VN")).join(" → ");
                                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "group relative flex items-center py-2",
                                    style: styleObj,
                                    title: `${m.title} (${dateLabel})`,
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: `h-8 w-full rounded-md text-sm px-3 flex items-center justify-between gap-2 ${color} shadow-sm hover:shadow-md transition-shadow`,
                                        style: {
                                            overflow: "hidden"
                                        },
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "truncate",
                                            children: m.title
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/GanttChart.tsx",
                                            lineNumber: 270,
                                            columnNumber: 21
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/GanttChart.tsx",
                                        lineNumber: 269,
                                        columnNumber: 19
                                    }, this)
                                }, m._id, false, {
                                    fileName: "[project]/src/components/GanttChart.tsx",
                                    lineNumber: 268,
                                    columnNumber: 17
                                }, this);
                            })
                        }, void 0, false, {
                            fileName: "[project]/src/components/GanttChart.tsx",
                            lineNumber: 242,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/GanttChart.tsx",
                    lineNumber: 223,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/components/GanttChart.tsx",
                lineNumber: 129,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                ref: bottomScrollRef,
                className: "mt-2 w-full overflow-x-auto x-scrollbar",
                style: {
                    overflowY: "hidden",
                    position: stickyScrollbar ? "sticky" : "static",
                    bottom: stickyScrollbar ? 0 : undefined,
                    background: "var(--background)",
                    borderTop: "1px solid var(--border)",
                    paddingTop: 2
                },
                onScroll: (e)=>{
                    const c = containerRef.current;
                    if (!c) return;
                    if (isSyncingRef.current) return;
                    isSyncingRef.current = true;
                    c.scrollLeft = e.currentTarget.scrollLeft;
                    isSyncingRef.current = false;
                    const b = e.currentTarget;
                    const max = b.scrollWidth - b.clientWidth;
                    const nearStart = b.scrollLeft <= 2;
                    const nearEnd = b.scrollLeft >= max - 2;
                    if (enableEdgePaging && pagingStepDays && onRequestShift) {
                        if (nearEnd) {
                            onRequestShift(pagingStepDays);
                            setTimeout(()=>{
                                b.scrollLeft = 4;
                                c.scrollLeft = b.scrollLeft;
                            }, 0);
                        } else if (nearStart) {
                            onRequestShift(-pagingStepDays);
                            setTimeout(()=>{
                                const newMax = b.scrollWidth - b.clientWidth;
                                b.scrollLeft = newMax - 4;
                                c.scrollLeft = b.scrollLeft;
                            }, 0);
                        }
                    }
                },
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    style: {
                        width: `${contentWidthPx}px`,
                        height: 1
                    }
                }, void 0, false, {
                    fileName: "[project]/src/components/GanttChart.tsx",
                    lineNumber: 312,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/components/GanttChart.tsx",
                lineNumber: 278,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/GanttChart.tsx",
        lineNumber: 83,
        columnNumber: 5
    }, this);
}
_s(GanttChart, "CzMCT+gNEr8+DCPllPicMqlSN+s=");
_c = GanttChart;
function TodayLine({ startOfPeriod, today }) {
    const daysFromStart = Math.max(0, Math.floor(((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$timeline$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["stripTimeUTC"])(today).getTime() - (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$timeline$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["stripTimeUTC"])(startOfPeriod).getTime()) / (24 * 60 * 60 * 1000)));
    const left = `calc(${daysFromStart}/var(--colCount,7)*100%)`;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "absolute inset-0 pointer-events-none",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "h-full border-l border-blue-500",
                style: {
                    marginLeft: left
                }
            }, void 0, false, {
                fileName: "[project]/src/components/GanttChart.tsx",
                lineNumber: 323,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "relative",
                style: {
                    marginLeft: left
                },
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    className: "absolute -top-2 -ml-1 h-2 w-2 rounded-full bg-blue-500"
                }, void 0, false, {
                    fileName: "[project]/src/components/GanttChart.tsx",
                    lineNumber: 325,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/components/GanttChart.tsx",
                lineNumber: 324,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/GanttChart.tsx",
        lineNumber: 322,
        columnNumber: 5
    }, this);
}
_c1 = TodayLine;
var _c, _c1;
__turbopack_context__.k.register(_c, "GanttChart");
__turbopack_context__.k.register(_c1, "TodayLine");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/node_modules/next/dist/compiled/react/cjs/react-jsx-dev-runtime.development.js [app-client] (ecmascript)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
/**
 * @license React
 * react-jsx-dev-runtime.development.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
"use strict";
"production" !== ("TURBOPACK compile-time value", "development") && function() {
    function getComponentNameFromType(type) {
        if (null == type) return null;
        if ("function" === typeof type) return type.$$typeof === REACT_CLIENT_REFERENCE ? null : type.displayName || type.name || null;
        if ("string" === typeof type) return type;
        switch(type){
            case REACT_FRAGMENT_TYPE:
                return "Fragment";
            case REACT_PROFILER_TYPE:
                return "Profiler";
            case REACT_STRICT_MODE_TYPE:
                return "StrictMode";
            case REACT_SUSPENSE_TYPE:
                return "Suspense";
            case REACT_SUSPENSE_LIST_TYPE:
                return "SuspenseList";
            case REACT_ACTIVITY_TYPE:
                return "Activity";
        }
        if ("object" === typeof type) switch("number" === typeof type.tag && console.error("Received an unexpected object in getComponentNameFromType(). This is likely a bug in React. Please file an issue."), type.$$typeof){
            case REACT_PORTAL_TYPE:
                return "Portal";
            case REACT_CONTEXT_TYPE:
                return (type.displayName || "Context") + ".Provider";
            case REACT_CONSUMER_TYPE:
                return (type._context.displayName || "Context") + ".Consumer";
            case REACT_FORWARD_REF_TYPE:
                var innerType = type.render;
                type = type.displayName;
                type || (type = innerType.displayName || innerType.name || "", type = "" !== type ? "ForwardRef(" + type + ")" : "ForwardRef");
                return type;
            case REACT_MEMO_TYPE:
                return innerType = type.displayName || null, null !== innerType ? innerType : getComponentNameFromType(type.type) || "Memo";
            case REACT_LAZY_TYPE:
                innerType = type._payload;
                type = type._init;
                try {
                    return getComponentNameFromType(type(innerType));
                } catch (x) {}
        }
        return null;
    }
    function testStringCoercion(value) {
        return "" + value;
    }
    function checkKeyStringCoercion(value) {
        try {
            testStringCoercion(value);
            var JSCompiler_inline_result = !1;
        } catch (e) {
            JSCompiler_inline_result = !0;
        }
        if (JSCompiler_inline_result) {
            JSCompiler_inline_result = console;
            var JSCompiler_temp_const = JSCompiler_inline_result.error;
            var JSCompiler_inline_result$jscomp$0 = "function" === typeof Symbol && Symbol.toStringTag && value[Symbol.toStringTag] || value.constructor.name || "Object";
            JSCompiler_temp_const.call(JSCompiler_inline_result, "The provided key is an unsupported type %s. This value must be coerced to a string before using it here.", JSCompiler_inline_result$jscomp$0);
            return testStringCoercion(value);
        }
    }
    function getTaskName(type) {
        if (type === REACT_FRAGMENT_TYPE) return "<>";
        if ("object" === typeof type && null !== type && type.$$typeof === REACT_LAZY_TYPE) return "<...>";
        try {
            var name = getComponentNameFromType(type);
            return name ? "<" + name + ">" : "<...>";
        } catch (x) {
            return "<...>";
        }
    }
    function getOwner() {
        var dispatcher = ReactSharedInternals.A;
        return null === dispatcher ? null : dispatcher.getOwner();
    }
    function UnknownOwner() {
        return Error("react-stack-top-frame");
    }
    function hasValidKey(config) {
        if (hasOwnProperty.call(config, "key")) {
            var getter = Object.getOwnPropertyDescriptor(config, "key").get;
            if (getter && getter.isReactWarning) return !1;
        }
        return void 0 !== config.key;
    }
    function defineKeyPropWarningGetter(props, displayName) {
        function warnAboutAccessingKey() {
            specialPropKeyWarningShown || (specialPropKeyWarningShown = !0, console.error("%s: `key` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://react.dev/link/special-props)", displayName));
        }
        warnAboutAccessingKey.isReactWarning = !0;
        Object.defineProperty(props, "key", {
            get: warnAboutAccessingKey,
            configurable: !0
        });
    }
    function elementRefGetterWithDeprecationWarning() {
        var componentName = getComponentNameFromType(this.type);
        didWarnAboutElementRef[componentName] || (didWarnAboutElementRef[componentName] = !0, console.error("Accessing element.ref was removed in React 19. ref is now a regular prop. It will be removed from the JSX Element type in a future release."));
        componentName = this.props.ref;
        return void 0 !== componentName ? componentName : null;
    }
    function ReactElement(type, key, self, source, owner, props, debugStack, debugTask) {
        self = props.ref;
        type = {
            $$typeof: REACT_ELEMENT_TYPE,
            type: type,
            key: key,
            props: props,
            _owner: owner
        };
        null !== (void 0 !== self ? self : null) ? Object.defineProperty(type, "ref", {
            enumerable: !1,
            get: elementRefGetterWithDeprecationWarning
        }) : Object.defineProperty(type, "ref", {
            enumerable: !1,
            value: null
        });
        type._store = {};
        Object.defineProperty(type._store, "validated", {
            configurable: !1,
            enumerable: !1,
            writable: !0,
            value: 0
        });
        Object.defineProperty(type, "_debugInfo", {
            configurable: !1,
            enumerable: !1,
            writable: !0,
            value: null
        });
        Object.defineProperty(type, "_debugStack", {
            configurable: !1,
            enumerable: !1,
            writable: !0,
            value: debugStack
        });
        Object.defineProperty(type, "_debugTask", {
            configurable: !1,
            enumerable: !1,
            writable: !0,
            value: debugTask
        });
        Object.freeze && (Object.freeze(type.props), Object.freeze(type));
        return type;
    }
    function jsxDEVImpl(type, config, maybeKey, isStaticChildren, source, self, debugStack, debugTask) {
        var children = config.children;
        if (void 0 !== children) if (isStaticChildren) if (isArrayImpl(children)) {
            for(isStaticChildren = 0; isStaticChildren < children.length; isStaticChildren++)validateChildKeys(children[isStaticChildren]);
            Object.freeze && Object.freeze(children);
        } else console.error("React.jsx: Static children should always be an array. You are likely explicitly calling React.jsxs or React.jsxDEV. Use the Babel transform instead.");
        else validateChildKeys(children);
        if (hasOwnProperty.call(config, "key")) {
            children = getComponentNameFromType(type);
            var keys = Object.keys(config).filter(function(k) {
                return "key" !== k;
            });
            isStaticChildren = 0 < keys.length ? "{key: someKey, " + keys.join(": ..., ") + ": ...}" : "{key: someKey}";
            didWarnAboutKeySpread[children + isStaticChildren] || (keys = 0 < keys.length ? "{" + keys.join(": ..., ") + ": ...}" : "{}", console.error('A props object containing a "key" prop is being spread into JSX:\n  let props = %s;\n  <%s {...props} />\nReact keys must be passed directly to JSX without using spread:\n  let props = %s;\n  <%s key={someKey} {...props} />', isStaticChildren, children, keys, children), didWarnAboutKeySpread[children + isStaticChildren] = !0);
        }
        children = null;
        void 0 !== maybeKey && (checkKeyStringCoercion(maybeKey), children = "" + maybeKey);
        hasValidKey(config) && (checkKeyStringCoercion(config.key), children = "" + config.key);
        if ("key" in config) {
            maybeKey = {};
            for(var propName in config)"key" !== propName && (maybeKey[propName] = config[propName]);
        } else maybeKey = config;
        children && defineKeyPropWarningGetter(maybeKey, "function" === typeof type ? type.displayName || type.name || "Unknown" : type);
        return ReactElement(type, children, self, source, getOwner(), maybeKey, debugStack, debugTask);
    }
    function validateChildKeys(node) {
        "object" === typeof node && null !== node && node.$$typeof === REACT_ELEMENT_TYPE && node._store && (node._store.validated = 1);
    }
    var React = __turbopack_context__.r("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)"), REACT_ELEMENT_TYPE = Symbol.for("react.transitional.element"), REACT_PORTAL_TYPE = Symbol.for("react.portal"), REACT_FRAGMENT_TYPE = Symbol.for("react.fragment"), REACT_STRICT_MODE_TYPE = Symbol.for("react.strict_mode"), REACT_PROFILER_TYPE = Symbol.for("react.profiler");
    Symbol.for("react.provider");
    var REACT_CONSUMER_TYPE = Symbol.for("react.consumer"), REACT_CONTEXT_TYPE = Symbol.for("react.context"), REACT_FORWARD_REF_TYPE = Symbol.for("react.forward_ref"), REACT_SUSPENSE_TYPE = Symbol.for("react.suspense"), REACT_SUSPENSE_LIST_TYPE = Symbol.for("react.suspense_list"), REACT_MEMO_TYPE = Symbol.for("react.memo"), REACT_LAZY_TYPE = Symbol.for("react.lazy"), REACT_ACTIVITY_TYPE = Symbol.for("react.activity"), REACT_CLIENT_REFERENCE = Symbol.for("react.client.reference"), ReactSharedInternals = React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, hasOwnProperty = Object.prototype.hasOwnProperty, isArrayImpl = Array.isArray, createTask = console.createTask ? console.createTask : function() {
        return null;
    };
    React = {
        "react-stack-bottom-frame": function(callStackForError) {
            return callStackForError();
        }
    };
    var specialPropKeyWarningShown;
    var didWarnAboutElementRef = {};
    var unknownOwnerDebugStack = React["react-stack-bottom-frame"].bind(React, UnknownOwner)();
    var unknownOwnerDebugTask = createTask(getTaskName(UnknownOwner));
    var didWarnAboutKeySpread = {};
    exports.Fragment = REACT_FRAGMENT_TYPE;
    exports.jsxDEV = function(type, config, maybeKey, isStaticChildren, source, self) {
        var trackActualOwner = 1e4 > ReactSharedInternals.recentlyCreatedOwnerStacks++;
        return jsxDEVImpl(type, config, maybeKey, isStaticChildren, source, self, trackActualOwner ? Error("react-stack-top-frame") : unknownOwnerDebugStack, trackActualOwner ? createTask(getTaskName(type)) : unknownOwnerDebugTask);
    };
}();
}}),
"[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
'use strict';
if ("TURBOPACK compile-time falsy", 0) {
    "TURBOPACK unreachable";
} else {
    module.exports = __turbopack_context__.r("[project]/node_modules/next/dist/compiled/react/cjs/react-jsx-dev-runtime.development.js [app-client] (ecmascript)");
}
}}),
}]);

//# sourceMappingURL=_ea672ead._.js.map