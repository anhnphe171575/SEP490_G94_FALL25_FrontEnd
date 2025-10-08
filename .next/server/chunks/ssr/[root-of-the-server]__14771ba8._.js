module.exports = {

"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}}),
"[project]/src/lib/timeline.ts [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
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
}}),
"[project]/src/components/GanttChart.tsx [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>GanttChart)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$timeline$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/timeline.ts [app-ssr] (ecmascript)");
"use client";
;
;
;
function GanttChart({ milestones, viewMode, startDate, autoFit = true, pagingStepDays, onRequestShift, columnWidth = 160, enableDrag = true, enableWheelPan = true, enableEdgePaging = true, stickyScrollbar = true, statusColors }) {
    const containerRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const bottomScrollRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const isSyncingRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(false);
    const periodStart = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$timeline$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getPeriodStart"])(viewMode, startDate), [
        viewMode,
        startDate
    ]);
    const spanDays = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$timeline$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getSpanDays"])(viewMode, startDate), [
        viewMode,
        startDate
    ]);
    const isQuarters = viewMode === "Quarters";
    const days = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>Array.from({
            length: spanDays
        }, (_, i)=>new Date(periodStart.getTime() + i * 24 * 60 * 60 * 1000)), [
        spanDays,
        periodStart
    ]);
    const today = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$timeline$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["stripTimeUTC"])(new Date());
    const contentWidthPx = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>(isQuarters ? 4 : spanDays) * columnWidth, [
        isQuarters,
        spanDays,
        columnWidth
    ]);
    const isDraggingRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(false);
    const dragStartXRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(0);
    const dragStartScrollRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(0);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        // Keep scroll positions aligned when dimensions change
        const c = containerRef.current;
        const b = bottomScrollRef.current;
        if (!c || !b) return;
        b.scrollLeft = c.scrollLeft;
    }, [
        contentWidthPx,
        viewMode,
        spanDays
    ]);
    const getX = (dateStr)=>{
        if (!dateStr) return 0;
        const d = new Date(dateStr);
        const diff = Math.floor(((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$timeline$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["stripTimeUTC"])(d).getTime() - (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$timeline$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["stripTimeUTC"])(periodStart).getTime()) / (24 * 60 * 60 * 1000));
        return Math.max(0, Math.min(spanDays - 1, diff));
    };
    const monthName = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>periodStart.toLocaleDateString("vi-VN", {
            month: "long",
            year: "numeric"
        }), [
        periodStart
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "w-full",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-end justify-between mb-2",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
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
                            !isQuarters ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
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
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-4 text-sm",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center gap-1",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
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
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center gap-1",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
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
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center gap-1",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
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
            viewMode === "Quarters" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
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
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "grid grid-cols-4 text-center text-xs md:text-sm font-medium mb-1 opacity-90",
                        children: [
                            "Q1",
                            "Q2",
                            "Q3",
                            "Q4"
                        ].map((q, idx)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
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
            }, void 0, true) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "grid",
                style: {
                    gridTemplateColumns: `repeat(${spanDays}, minmax(0,1fr))`
                },
                children: days.map((d, i)=>{
                    const isToday = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$timeline$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["stripTimeUTC"])(d).getTime() === (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$timeline$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["stripTimeUTC"])(today).getTime();
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
                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "text-center font-medium text-xs md:text-sm mb-2 opacity-90",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
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
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
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
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "relative",
                    style: {
                        width: `${contentWidthPx}px`
                    },
                    children: [
                        !isQuarters ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: `absolute inset-0 grid pointer-events-none`,
                            style: {
                                gridTemplateColumns: `repeat(${spanDays}, minmax(0, 1fr))`
                            },
                            children: days.map((_, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
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
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "relative",
                            style: {
                                display: "grid",
                                gridTemplateColumns: `repeat(${isQuarters ? 4 : spanDays}, minmax(0,1fr))`,
                                height: autoFit ? `${Math.max(180, milestones.length * 44 + 40)}px` : "260px"
                            },
                            children: (isQuarters ? Array.from({
                                length: 4
                            }) : days).map((_, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "relative last:border-r-0",
                                    style: {
                                        borderRight: "1px solid rgba(17,24,39,0.08)"
                                    },
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
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
                        !isQuarters ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(TodayLine, {
                            startOfPeriod: periodStart,
                            today: today
                        }, void 0, false, {
                            fileName: "[project]/src/components/GanttChart.tsx",
                            lineNumber: 240,
                            columnNumber: 26
                        }, this) : null,
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
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
                                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "group relative flex items-center py-2",
                                    style: styleObj,
                                    title: `${m.title} (${dateLabel})`,
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: `h-8 w-full rounded-md text-sm px-3 flex items-center justify-between gap-2 ${color} shadow-sm hover:shadow-md transition-shadow`,
                                        style: {
                                            overflow: "hidden"
                                        },
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
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
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
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
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
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
function TodayLine({ startOfPeriod, today }) {
    const daysFromStart = Math.max(0, Math.floor(((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$timeline$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["stripTimeUTC"])(today).getTime() - (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$timeline$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["stripTimeUTC"])(startOfPeriod).getTime()) / (24 * 60 * 60 * 1000)));
    const left = `calc(${daysFromStart}/var(--colCount,7)*100%)`;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "absolute inset-0 pointer-events-none",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "h-full border-l border-blue-500",
                style: {
                    marginLeft: left
                }
            }, void 0, false, {
                fileName: "[project]/src/components/GanttChart.tsx",
                lineNumber: 323,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "relative",
                style: {
                    marginLeft: left
                },
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
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
}}),
"[project]/node_modules/next/dist/server/route-modules/app-page/module.compiled.js [app-ssr] (ecmascript)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
"use strict";
if ("TURBOPACK compile-time falsy", 0) {
    "TURBOPACK unreachable";
} else {
    if ("TURBOPACK compile-time falsy", 0) {
        "TURBOPACK unreachable";
    } else {
        if ("TURBOPACK compile-time truthy", 1) {
            if ("TURBOPACK compile-time truthy", 1) {
                module.exports = __turbopack_context__.r("[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)");
            } else {
                "TURBOPACK unreachable";
            }
        } else {
            "TURBOPACK unreachable";
        }
    }
} //# sourceMappingURL=module.compiled.js.map
}}),
"[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
"use strict";
module.exports = __turbopack_context__.r("[project]/node_modules/next/dist/server/route-modules/app-page/module.compiled.js [app-ssr] (ecmascript)").vendored['react-ssr'].ReactJsxDevRuntime; //# sourceMappingURL=react-jsx-dev-runtime.js.map
}}),
"[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
"use strict";
module.exports = __turbopack_context__.r("[project]/node_modules/next/dist/server/route-modules/app-page/module.compiled.js [app-ssr] (ecmascript)").vendored['react-ssr'].React; //# sourceMappingURL=react.js.map
}}),

};

//# sourceMappingURL=%5Broot-of-the-server%5D__14771ba8._.js.map