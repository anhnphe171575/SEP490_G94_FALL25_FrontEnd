(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/ultis/axios.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// lib/axios.js
__turbopack_context__.s([
    "api",
    ()=>api,
    "apiUtils",
    ()=>apiUtils,
    "default",
    ()=>__TURBOPACK__default__export__,
    "useApi",
    ()=>useApi
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$axios$2f$lib$2f$axios$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/axios/lib/axios.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature();
;
;
// Debug log để kiểm tra env
const axiosInstance = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$axios$2f$lib$2f$axios$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].create({
    baseURL: ("TURBOPACK compile-time value", "http://localhost:5000/"),
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});
// Request interceptor
axiosInstance.interceptors.request.use((config)=>{
    const token = ("TURBOPACK compile-time truthy", 1) ? sessionStorage.getItem('token') : "TURBOPACK unreachable";
    if (token) {
        config.headers.Authorization = "Bearer ".concat(token);
    }
    // Don't set Content-Type for FormData, let axios handle it automatically
    if (config.data instanceof FormData) {
        delete config.headers['Content-Type'];
    }
    if (("TURBOPACK compile-time value", "development") === 'development') {}
    return config;
}, (error)=>{
    return Promise.reject(error);
});
// Response interceptor
axiosInstance.interceptors.response.use((response)=>{
    if (("TURBOPACK compile-time value", "development") === 'development') {}
    return response;
}, (error)=>{
    var _error_response, _error_response1, _error_response2;
    if (("TURBOPACK compile-time value", "development") === 'development') {}
    // Xử lý lỗi chung
    if (((_error_response = error.response) === null || _error_response === void 0 ? void 0 : _error_response.status) === 401) {
        if ("TURBOPACK compile-time truthy", 1) {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
    }
    if (((_error_response1 = error.response) === null || _error_response1 === void 0 ? void 0 : _error_response1.status) === 403) {
        if ("TURBOPACK compile-time truthy", 1) {
            window.location.href = '/not-found';
        }
    }
    if (((_error_response2 = error.response) === null || _error_response2 === void 0 ? void 0 : _error_response2.status) === 500) {
        console.error('Server Error:', error.response.data);
    }
    return Promise.reject(error);
});
const __TURBOPACK__default__export__ = axiosInstance;
const api = {
    get: (url, config)=>axiosInstance.get(url, config),
    post: (url, data, config)=>axiosInstance.post(url, data, config),
    put: (url, data, config)=>axiosInstance.put(url, data, config),
    patch: (url, data, config)=>axiosInstance.patch(url, data, config),
    delete: (url, config)=>axiosInstance.delete(url, config),
    // Review API methods
    reviews: {
        // Create a new review
        create: (reviewData)=>axiosInstance.post('/reviews', reviewData),
        // Get all reviews
        getAll: ()=>axiosInstance.get('/reviews'),
        // Get reviews for a specific product
        getByProduct: (productId)=>axiosInstance.get("/reviews/product/".concat(productId)),
        // Get unreviewed products for a user
        getUnreviewed: (productId)=>axiosInstance.get("/reviews/unreviewed/".concat(productId)),
        // Update a review
        update: (reviewId, reviewData)=>axiosInstance.put("/reviews/".concat(reviewId), reviewData),
        // Delete a review
        delete: (reviewId)=>axiosInstance.delete("/reviews/".concat(reviewId))
    }
};
const apiUtils = {
    // Upload file
    uploadFile: (url, file, onUploadProgress)=>{
        const formData = new FormData();
        formData.append('file', file);
        return axiosInstance.post(url, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            },
            onUploadProgress
        });
    },
    // Download file
    downloadFile: async (url, filename)=>{
        try {
            const response = await axiosInstance.get(url, {
                responseType: 'blob'
            });
            const blob = new Blob([
                response.data
            ]);
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = filename;
            link.click();
            window.URL.revokeObjectURL(downloadUrl);
        } catch (error) {
            console.error('Download failed:', error);
            throw error;
        }
    },
    // Create review
    createReview: async (reviewData)=>{
        try {
            const response = await axiosInstance.post('/reviews', reviewData);
            return response.data;
        } catch (error) {
            console.error('Create review failed:', error);
            throw error;
        }
    }
};
const useApi = ()=>{
    _s();
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const request = async (apiCall)=>{
        try {
            setLoading(true);
            setError(null);
            const response = await apiCall();
            return response.data;
        } catch (err) {
            setError(err);
            throw err;
        } finally{
            setLoading(false);
        }
    };
    return {
        request,
        loading,
        error
    };
};
_s(useApi, "Iz3ozxQ+abMaAIcGIvU8cKUcBeo=");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/ResponsiveSidebar.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>ResponsiveSidebar
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$ultis$2f$axios$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/ultis/axios.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
const navItems = [
    {
        href: "/dashboard",
        label: "Dashboard",
        icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
            className: "w-5 h-5",
            "aria-hidden": "true",
            xmlns: "http://www.w3.org/2000/svg",
            fill: "currentColor",
            viewBox: "0 0 22 21",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                    d: "M16.975 11H10V4.025a1 1 0 0 0-1.066-.998 8.5 8.5 0 1 0 9.039 9.039.999.999 0 0 0-1-1.066h.002Z"
                }, void 0, false, {
                    fileName: "[project]/src/components/ResponsiveSidebar.tsx",
                    lineNumber: 11,
                    columnNumber: 7
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                    d: "M12.5 0c-.157 0-.311.01-.565.027A1 1 0 0 0 11 1.02V10h8.975a1 1 0 0 0 1-.935c.013-.188.028-.374.028-.565A8.51 8.51 0 0 0 12.5 0Z"
                }, void 0, false, {
                    fileName: "[project]/src/components/ResponsiveSidebar.tsx",
                    lineNumber: 12,
                    columnNumber: 7
                }, ("TURBOPACK compile-time value", void 0))
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/ResponsiveSidebar.tsx",
            lineNumber: 10,
            columnNumber: 5
        }, ("TURBOPACK compile-time value", void 0))
    },
    {
        href: "/",
        label: "Dự án",
        icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
            className: "w-5 h-5",
            "aria-hidden": "true",
            xmlns: "http://www.w3.org/2000/svg",
            fill: "currentColor",
            viewBox: "0 0 18 18",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M6.143 0H1.857A1.857 1.857 0 0 0 0 1.857v4.286C0 7.169.831 8 1.857 8h4.286A1.857 1.857 0 0 0 8 6.143V1.857A1.857 1.857 0 0 0 6.143 0Zm10 0h-4.286A1.857 1.857 0 0 0 10 1.857v4.286C10 7.169 10.831 8 11.857 8h4.286A1.857 1.857 0 0 0 18 6.143V1.857A1.857 1.857 0 0 0 16.143 0Zm-10 10H1.857A1.857 1.857 0 0 0 0 11.857v4.286C0 17.169.831 18 1.857 18h4.286A1.857 1.857 0 0 0 8 16.143v-4.286A1.857 1.857 0 0 0 6.143 10Zm10 0h-4.286A1.857 1.857 0 0 0 10 11.857v4.286c0 1.026.831 1.857 1.857 1.857h4.286A1.857 1.857 0 0 0 18 16.143v-4.286A1.857 1.857 0 0 0 16.143 10Z"
            }, void 0, false, {
                fileName: "[project]/src/components/ResponsiveSidebar.tsx",
                lineNumber: 17,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0))
        }, void 0, false, {
            fileName: "[project]/src/components/ResponsiveSidebar.tsx",
            lineNumber: 16,
            columnNumber: 5
        }, ("TURBOPACK compile-time value", void 0))
    },
    {
        href: "/myprofile",
        label: "Users",
        icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
            className: "w-5 h-5",
            "aria-hidden": "true",
            xmlns: "http://www.w3.org/2000/svg",
            fill: "currentColor",
            viewBox: "0 0 20 18",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M14 2a3.963 3.963 0 0 0-1.4.267 6.439 6.439 0 0 1-1.331 6.638A4 4 0 1 0 14 2Zm1 9h-1.264A6.957 6.957 0 0 1 15 15v2a2.97 2.97 0 0 1-.184 1H19a1 1 0 0 0 1-1v-1a5.006 5.006 0 0 0-5-5ZM6.5 9a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9ZM8 10H5a5.006 5.006 0 0 0-5 5v2a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-2a5.006 5.006 0 0 0-5-5Z"
            }, void 0, false, {
                fileName: "[project]/src/components/ResponsiveSidebar.tsx",
                lineNumber: 22,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0))
        }, void 0, false, {
            fileName: "[project]/src/components/ResponsiveSidebar.tsx",
            lineNumber: 21,
            columnNumber: 5
        }, ("TURBOPACK compile-time value", void 0))
    }
];
function ResponsiveSidebar() {
    var _me_full_name, _me_email;
    _s();
    const pathname = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePathname"])();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"])();
    const [open, setOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [me, setMe] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ResponsiveSidebar.useEffect": ()=>{
            setOpen(false);
        }
    }["ResponsiveSidebar.useEffect"], [
        pathname
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ResponsiveSidebar.useEffect": ()=>{
            ({
                "ResponsiveSidebar.useEffect": async ()=>{
                    try {
                        const token = ("TURBOPACK compile-time truthy", 1) ? sessionStorage.getItem('token') || localStorage.getItem('token') : "TURBOPACK unreachable";
                        if (!token) return;
                        const res = await __TURBOPACK__imported__module__$5b$project$5d2f$ultis$2f$axios$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].get('/api/users/me');
                        setMe(res.data || null);
                    } catch (e) {
                    // silently ignore
                    }
                }
            })["ResponsiveSidebar.useEffect"]();
        }
    }["ResponsiveSidebar.useEffect"], []);
    const onLogout = ()=>{
        if ("TURBOPACK compile-time truthy", 1) {
            sessionStorage.removeItem('token');
            localStorage.removeItem('token');
        }
        router.replace('/login');
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                type: "button",
                "aria-controls": "default-sidebar",
                "aria-expanded": open,
                onClick: ()=>setOpen((v)=>!v),
                className: "inline-flex items-center p-2 mt-2 ms-3 text-sm text-gray-500 rounded-lg md:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "sr-only",
                        children: "Open sidebar"
                    }, void 0, false, {
                        fileName: "[project]/src/components/ResponsiveSidebar.tsx",
                        lineNumber: 67,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                        className: "w-6 h-6",
                        "aria-hidden": "true",
                        fill: "currentColor",
                        viewBox: "0 0 20 20",
                        xmlns: "http://www.w3.org/2000/svg",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                            clipRule: "evenodd",
                            fillRule: "evenodd",
                            d: "M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10z"
                        }, void 0, false, {
                            fileName: "[project]/src/components/ResponsiveSidebar.tsx",
                            lineNumber: 69,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/components/ResponsiveSidebar.tsx",
                        lineNumber: 68,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/ResponsiveSidebar.tsx",
                lineNumber: 60,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("aside", {
                id: "default-sidebar",
                className: "fixed top-0 left-0 z-40 w-64 h-screen transition-transform ".concat(open ? 'translate-x-0' : '-translate-x-full', " md:translate-x-0"),
                "aria-label": "Sidebar",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "h-full px-3 py-4 overflow-y-auto glass",
                    children: [
                        me ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "mb-4 flex items-center gap-3 p-3 card",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "h-10 w-10 rounded-full flex items-center justify-center overflow-hidden bg-gray-100",
                                    children: me.avatar ? // eslint-disable-next-line @next/next/no-img-element
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                        src: me.avatar,
                                        alt: "avatar",
                                        className: "h-full w-full object-cover"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/ResponsiveSidebar.tsx",
                                        lineNumber: 84,
                                        columnNumber: 19
                                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-sm font-semibold text-gray-600",
                                        children: (((_me_full_name = me.full_name) === null || _me_full_name === void 0 ? void 0 : _me_full_name[0]) || ((_me_email = me.email) === null || _me_email === void 0 ? void 0 : _me_email[0]) || 'U').toUpperCase()
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/ResponsiveSidebar.tsx",
                                        lineNumber: 86,
                                        columnNumber: 19
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/src/components/ResponsiveSidebar.tsx",
                                    lineNumber: 81,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "truncate",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "text-sm font-medium truncate",
                                            children: me.full_name || 'User'
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/ResponsiveSidebar.tsx",
                                            lineNumber: 90,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "text-xs text-gray-500 truncate",
                                            children: me.email || ''
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/ResponsiveSidebar.tsx",
                                            lineNumber: 91,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/ResponsiveSidebar.tsx",
                                    lineNumber: 89,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/ResponsiveSidebar.tsx",
                            lineNumber: 80,
                            columnNumber: 13
                        }, this) : null,
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                            className: "space-y-2 font-medium",
                            children: [
                                navItems.map((item)=>{
                                    const active = pathname === item.href;
                                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                            href: item.href,
                                            className: "flex items-center p-2 rounded-lg group border transition-colors ".concat(active ? 'bg-[var(--muted)] border-[var(--border)] text-gray-900' : 'hover:bg-[var(--muted)] border-transparent text-gray-900'),
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "text-gray-500 group-hover:text-gray-900",
                                                    children: item.icon
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/ResponsiveSidebar.tsx",
                                                    lineNumber: 105,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "ms-3",
                                                    children: item.label
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/ResponsiveSidebar.tsx",
                                                    lineNumber: 106,
                                                    columnNumber: 21
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/components/ResponsiveSidebar.tsx",
                                            lineNumber: 101,
                                            columnNumber: 19
                                        }, this)
                                    }, "".concat(item.href, "-").concat(item.label), false, {
                                        fileName: "[project]/src/components/ResponsiveSidebar.tsx",
                                        lineNumber: 100,
                                        columnNumber: 17
                                    }, this);
                                }),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: onLogout,
                                        className: "w-full text-left flex items-center p-2 rounded-lg border hover:bg-[var(--muted)] text-gray-900 transition-colors",
                                        style: {
                                            borderColor: 'var(--border)'
                                        },
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                className: "w-5 h-5 text-gray-500",
                                                "aria-hidden": "true",
                                                xmlns: "http://www.w3.org/2000/svg",
                                                fill: "none",
                                                viewBox: "0 0 18 16",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                    stroke: "currentColor",
                                                    strokeLinecap: "round",
                                                    strokeLinejoin: "round",
                                                    strokeWidth: "2",
                                                    d: "M1 8h11m0 0L8 4m4 4-4 4m4-11h3a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-3"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/ResponsiveSidebar.tsx",
                                                    lineNumber: 118,
                                                    columnNumber: 19
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/ResponsiveSidebar.tsx",
                                                lineNumber: 117,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "ms-3",
                                                children: "Đăng xuất"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/ResponsiveSidebar.tsx",
                                                lineNumber: 120,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/ResponsiveSidebar.tsx",
                                        lineNumber: 112,
                                        columnNumber: 15
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/src/components/ResponsiveSidebar.tsx",
                                    lineNumber: 111,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/ResponsiveSidebar.tsx",
                            lineNumber: 96,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/ResponsiveSidebar.tsx",
                    lineNumber: 78,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/components/ResponsiveSidebar.tsx",
                lineNumber: 73,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true);
}
_s(ResponsiveSidebar, "nMmzbD0fM09VNatSM41fxAft9YY=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePathname"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"]
    ];
});
_c = ResponsiveSidebar;
var _c;
__turbopack_context__.k.register(_c, "ResponsiveSidebar");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/lib/timeline.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "addDays",
    ()=>addDays,
    "getPeriodStart",
    ()=>getPeriodStart,
    "getSpanDays",
    ()=>getSpanDays,
    "getStartOfWeekUTC",
    ()=>getStartOfWeekUTC,
    "stripTimeUTC",
    ()=>stripTimeUTC
]);
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
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/GanttChart.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>GanttChart
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$timeline$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/timeline.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
function GanttChart(param) {
    let { milestones, viewMode, startDate, autoFit, pagingStepDays, onRequestShift, onMilestoneShift, onMilestoneClick } = param;
    _s();
    const ganttContainerRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const periodStart = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "GanttChart.useMemo[periodStart]": ()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$timeline$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getPeriodStart"])(viewMode, startDate)
    }["GanttChart.useMemo[periodStart]"], [
        viewMode,
        startDate
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "GanttChart.useEffect": ()=>{
            let isMounted = true;
            const init = {
                "GanttChart.useEffect.init": async ()=>{
                    const gantt = (await __turbopack_context__.A("[project]/node_modules/dhtmlx-gantt/codebase/dhtmlxgantt.es.js [app-client] (ecmascript, async loader)")).gantt;
                    if (!isMounted || !ganttContainerRef.current) return;
                    gantt.clearAll();
                    // Configure scale per view mode
                    if (viewMode === "Days") {
                        gantt.config.scales = [
                            {
                                unit: "week",
                                step: 1,
                                format: {
                                    "GanttChart.useEffect.init": (date)=>formatWeekLabelRange(date)
                                }["GanttChart.useEffect.init"]
                            },
                            {
                                unit: "day",
                                step: 1,
                                format: "%D %d"
                            }
                        ];
                        gantt.config.scale_height = 50;
                    } else if (viewMode === "Weeks") {
                        gantt.config.scales = [
                            {
                                unit: "month",
                                step: 1,
                                format: "%M %Y"
                            },
                            {
                                unit: "week",
                                step: 1,
                                format: {
                                    "GanttChart.useEffect.init": (date)=>"W".concat(getISOWeek(date))
                                }["GanttChart.useEffect.init"]
                            }
                        ];
                        gantt.config.scale_height = 50;
                    } else if (viewMode === "Months") {
                        gantt.config.scales = [
                            {
                                unit: "year",
                                step: 1,
                                format: "%Y"
                            },
                            {
                                unit: "month",
                                step: 1,
                                format: "%M"
                            }
                        ];
                        gantt.config.scale_height = 45;
                    } else {
                        // Quarters
                        gantt.config.scales = [
                            {
                                unit: "year",
                                step: 1,
                                format: "%Y"
                            },
                            {
                                unit: "quarter",
                                step: 1,
                                format: {
                                    "GanttChart.useEffect.init": (date)=>"Q".concat(Math.floor(date.getUTCMonth() / 3) + 1)
                                }["GanttChart.useEffect.init"]
                            }
                        ];
                        gantt.config.scale_height = 40;
                    }
                    gantt.config.readonly = false;
                    gantt.config.drag_move = true;
                    gantt.config.drag_resize = true;
                    gantt.config.drag_progress = false;
                    gantt.config.fit_tasks = !!autoFit;
                    gantt.config.row_height = 32;
                    gantt.config.bar_height = 20;
                    // Hide the grid (Title/Start/End columns)
                    gantt.config.columns = [];
                    gantt.config.grid_width = 0;
                    // Color by status via templates
                    gantt.templates.task_class = ({
                        "GanttChart.useEffect.init": (start, end, task)=>{
                            const status = task.status;
                            if (status === "Planned") return "gantt-task-planned";
                            if (status === "In Progress") return "gantt-task-inprogress";
                            if (status === "Completed") return "gantt-task-completed";
                            if (status === "Overdue") return "gantt-task-overdue";
                            return "gantt-task-default";
                        }
                    })["GanttChart.useEffect.init"];
                    // Change listener to fire delta days
                    gantt.attachEvent("onAfterTaskDrag", {
                        "GanttChart.useEffect.init": (id, mode, e)=>{
                            if (mode !== "move") return true;
                            const task = gantt.getTask(id);
                            const original = task._original_start;
                            if (!original || !task.start_date) return true;
                            const msPerDay = 24 * 60 * 60 * 1000;
                            const deltaDays = Math.round((stripUTC(asDate(task.start_date)).getTime() - stripUTC(original).getTime()) / msPerDay);
                            if (deltaDays !== 0) onMilestoneShift === null || onMilestoneShift === void 0 ? void 0 : onMilestoneShift(id, deltaDays);
                            return true;
                        }
                    }["GanttChart.useEffect.init"]);
                    // Keep original start for delta calc
                    gantt.attachEvent("onBeforeTaskDrag", {
                        "GanttChart.useEffect.init": (id, mode, e)=>{
                            const task = gantt.getTask(id);
                            if (task.start_date) task._original_start = asDate(task.start_date);
                            return true;
                        }
                    }["GanttChart.useEffect.init"]);
                    // Click to open details
                    gantt.attachEvent("onTaskClick", {
                        "GanttChart.useEffect.init": function(id) {
                            onMilestoneClick === null || onMilestoneClick === void 0 ? void 0 : onMilestoneClick(id);
                            return true;
                        }
                    }["GanttChart.useEffect.init"]);
                    // Init and set data
                    gantt.init(ganttContainerRef.current);
                    const data = mapMilestonesToGantt(milestones, periodStart);
                    gantt.parse({
                        data
                    });
                    // Scroll to periodStart
                    gantt.showDate(periodStart);
                }
            }["GanttChart.useEffect.init"];
            init();
            return ({
                "GanttChart.useEffect": ()=>{
                    isMounted = false;
                // dhtmlx-gantt has no explicit destroy; clearing is enough on unmount
                // container will be removed by React
                }
            })["GanttChart.useEffect"];
        }
    }["GanttChart.useEffect"], [
        milestones,
        periodStart,
        viewMode,
        autoFit,
        onMilestoneShift
    ]);
    const containerStyle = {
        height: 380,
        width: "100%",
        border: "1px solid var(--border)",
        background: "color-mix(in oklab, var(--accent) 6%, var(--background))",
        borderRadius: 14,
        boxShadow: "var(--shadow-soft)"
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "w-full ".concat(viewMode === "Days" ? "gantt-split-half" : ""),
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                ref: ganttContainerRef,
                style: containerStyle
            }, void 0, false, {
                fileName: "[project]/src/components/GanttChart.tsx",
                lineNumber: 153,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("style", {
                children: "\n        /* Container */\n        .gantt_container { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; color: var(--foreground); }\n\n        /* Scales */\n        .gantt_scale_line { background: color-mix(in oklab, var(--accent) 18%, var(--background)); border-color: var(--border); }\n        .gantt_scale_cell { color: color-mix(in oklab, var(--foreground) 82%, transparent); font-weight: 600; letter-spacing: .2px; }\n        .gantt_task .gantt_task_scale { background: color-mix(in oklab, var(--accent) 18%, var(--background)); }\n\n        /* Rows */\n        .gantt_row, .gantt_task_row { background: var(--background); }\n        .gantt_row.odd, .gantt_task_row.odd { background: color-mix(in oklab, var(--accent) 10%, var(--background)); }\n        .gantt_row, .gantt_task_row { border-bottom: 1px solid var(--border); }\n\n        /* Half-day horizontal split for Days view */\n        .gantt-split-half .gantt_task_row, .gantt-split-half .gantt_row {\n          background-image: repeating-linear-gradient(\n            to bottom,\n            transparent 0 16px,\n            var(--border) 16px 17px,\n            transparent 17px 32px\n          );\n          background-blend-mode: normal;\n        }\n\n        /* Tasks */\n        .gantt_task_line { border-radius: 8px; border: 1px solid transparent; box-shadow: 0 2px 8px rgba(0,0,0,.06); background: color-mix(in oklab, var(--foreground) 24%, transparent); }\n        .gantt_task_content { padding: 2px 10px; font-weight: 600; text-shadow: none; }\n\n        /* Status colors */\n        .gantt-task-planned .gantt_task_content { background: #3b82f6 !important; color: #ffffff; } /* blue-500 */\n        .gantt-task-inprogress .gantt_task_content { background: var(--primary-600) !important; color: #ffffff; }\n        .gantt-task-completed .gantt_task_content { background: #22c55e !important; color: #ffffff; } /* green-500 */\n        .gantt-task-overdue .gantt_task_content { background: #ef4444 !important; color: #ffffff; } /* red-500 */\n        .gantt-task-default .gantt_task_content { background: #6b7280 !important; color: #ffffff; } /* slate-500 */\n\n        /* Selection/focus */\n        .gantt_selected .gantt_task_line { outline: 2px solid var(--ring); outline-offset: 0; box-shadow: none; }\n\n        /* Grid hidden state smoothing */\n        .gantt_layout_cell.gantt_grid { border-right: none; }\n\n        /* Today marker */\n        .today .gantt_marker { background: var(--primary-600); opacity: .9; width: 2px; }\n        .today .gantt_marker_content { background: var(--primary-600); color: #fff; border-radius: 8px; padding: 2px 8px; font-size: 12px; box-shadow: 0 4px 12px color-mix(in oklab, var(--primary) 40%, transparent); }\n\n        /* Links (if ever enabled) */\n        .gantt_link_line { stroke: color-mix(in oklab, var(--primary) 80%, #000 20%); }\n        .gantt_link_arrow { fill: color-mix(in oklab, var(--primary) 80%, #000 20%); }\n\n        /* Scrollbars */\n        .gantt_container ::-webkit-scrollbar { height: 8px; width: 8px; }\n        .gantt_container ::-webkit-scrollbar-thumb { background: color-mix(in oklab, var(--foreground) 30%, transparent); border-radius: 10px; }\n        .gantt_container ::-webkit-scrollbar-track { background: transparent; }\n      "
            }, void 0, false, {
                fileName: "[project]/src/components/GanttChart.tsx",
                lineNumber: 154,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/GanttChart.tsx",
        lineNumber: 152,
        columnNumber: 5
    }, this);
}
_s(GanttChart, "mLsXQUzV/9aSNb71iT9W0c1ynjA=");
_c = GanttChart;
function mapMilestonesToGantt(items, fallbackStart) {
    const msPerDay = 24 * 60 * 60 * 1000;
    return items.map((m)=>{
        const startCandidate = m.start_date || m.createdAt || m.deadline;
        const endCandidate = m.deadline || m.start_date || startCandidate;
        const start = startCandidate ? new Date(startCandidate) : fallbackStart;
        const end = endCandidate ? new Date(endCandidate) : new Date(start.getTime() + msPerDay);
        const durationDays = Math.max(1, Math.ceil((stripUTC(end).getTime() - stripUTC(start).getTime()) / msPerDay));
        return {
            id: m._id,
            text: m.title,
            start_date: toGanttDate(start),
            duration: durationDays,
            status: m.status
        };
    });
}
function toGanttDate(d) {
    // dhtmlx-gantt default format is "%d-%m-%Y" if not configured; use Date directly as it accepts Date objects too
    return new Date(d);
}
function stripUTC(date) {
    const d = new Date(date);
    d.setUTCHours(0, 0, 0, 0);
    return d;
}
function asDate(value) {
    return value instanceof Date ? value : new Date(value);
}
function getISOWeek(d) {
    const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    const dayNum = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
    return weekNo;
}
function startOfISOWeekUTC(d) {
    const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    const day = date.getUTCDay() || 7; // 1..7 Mon..Sun
    if (day !== 1) date.setUTCDate(date.getUTCDate() - (day - 1));
    return date;
}
function addDaysUTC(d, num) {
    const nd = new Date(d);
    nd.setUTCDate(nd.getUTCDate() + num);
    return nd;
}
function formatShortMonthEn(d) {
    return d.toLocaleString("en-US", {
        month: "short",
        timeZone: "UTC"
    });
}
function formatWeekLabelRange(date) {
    const week = getISOWeek(date);
    const start = startOfISOWeekUTC(date);
    const end = addDaysUTC(start, 6);
    const s = "".concat(formatShortMonthEn(start), " ").concat(start.getUTCDate());
    const e = "".concat(formatShortMonthEn(end), " ").concat(end.getUTCDate());
    return "Week ".concat(week, " ").concat(s, " - ").concat(e);
}
var _c;
__turbopack_context__.k.register(_c, "GanttChart");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/app/projects/[id]/features/page.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>ProjectFeaturesPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$ultis$2f$axios$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/ultis/axios.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ResponsiveSidebar$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ResponsiveSidebar.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$GanttChart$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/GanttChart.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$timeline$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/timeline.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$Box$2f$Box$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Box$3e$__ = __turbopack_context__.i("[project]/node_modules/@mui/material/esm/Box/Box.js [app-client] (ecmascript) <export default as Box>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$Button$2f$Button$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Button$3e$__ = __turbopack_context__.i("[project]/node_modules/@mui/material/esm/Button/Button.js [app-client] (ecmascript) <export default as Button>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$Chip$2f$Chip$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Chip$3e$__ = __turbopack_context__.i("[project]/node_modules/@mui/material/esm/Chip/Chip.js [app-client] (ecmascript) <export default as Chip>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$CircularProgress$2f$CircularProgress$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__CircularProgress$3e$__ = __turbopack_context__.i("[project]/node_modules/@mui/material/esm/CircularProgress/CircularProgress.js [app-client] (ecmascript) <export default as CircularProgress>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$Avatar$2f$Avatar$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Avatar$3e$__ = __turbopack_context__.i("[project]/node_modules/@mui/material/esm/Avatar/Avatar.js [app-client] (ecmascript) <export default as Avatar>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$Dialog$2f$Dialog$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Dialog$3e$__ = __turbopack_context__.i("[project]/node_modules/@mui/material/esm/Dialog/Dialog.js [app-client] (ecmascript) <export default as Dialog>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$DialogActions$2f$DialogActions$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__DialogActions$3e$__ = __turbopack_context__.i("[project]/node_modules/@mui/material/esm/DialogActions/DialogActions.js [app-client] (ecmascript) <export default as DialogActions>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$DialogContent$2f$DialogContent$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__DialogContent$3e$__ = __turbopack_context__.i("[project]/node_modules/@mui/material/esm/DialogContent/DialogContent.js [app-client] (ecmascript) <export default as DialogContent>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$DialogTitle$2f$DialogTitle$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__DialogTitle$3e$__ = __turbopack_context__.i("[project]/node_modules/@mui/material/esm/DialogTitle/DialogTitle.js [app-client] (ecmascript) <export default as DialogTitle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$FormControl$2f$FormControl$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__FormControl$3e$__ = __turbopack_context__.i("[project]/node_modules/@mui/material/esm/FormControl/FormControl.js [app-client] (ecmascript) <export default as FormControl>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$InputLabel$2f$InputLabel$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__InputLabel$3e$__ = __turbopack_context__.i("[project]/node_modules/@mui/material/esm/InputLabel/InputLabel.js [app-client] (ecmascript) <export default as InputLabel>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$MenuItem$2f$MenuItem$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__MenuItem$3e$__ = __turbopack_context__.i("[project]/node_modules/@mui/material/esm/MenuItem/MenuItem.js [app-client] (ecmascript) <export default as MenuItem>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$Select$2f$Select$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Select$3e$__ = __turbopack_context__.i("[project]/node_modules/@mui/material/esm/Select/Select.js [app-client] (ecmascript) <export default as Select>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$Stack$2f$Stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Stack$3e$__ = __turbopack_context__.i("[project]/node_modules/@mui/material/esm/Stack/Stack.js [app-client] (ecmascript) <export default as Stack>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$TextField$2f$TextField$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__TextField$3e$__ = __turbopack_context__.i("[project]/node_modules/@mui/material/esm/TextField/TextField.js [app-client] (ecmascript) <export default as TextField>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$Typography$2f$Typography$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Typography$3e$__ = __turbopack_context__.i("[project]/node_modules/@mui/material/esm/Typography/Typography.js [app-client] (ecmascript) <export default as Typography>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$Paper$2f$Paper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Paper$3e$__ = __turbopack_context__.i("[project]/node_modules/@mui/material/esm/Paper/Paper.js [app-client] (ecmascript) <export default as Paper>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$Divider$2f$Divider$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Divider$3e$__ = __turbopack_context__.i("[project]/node_modules/@mui/material/esm/Divider/Divider.js [app-client] (ecmascript) <export default as Divider>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$Checkbox$2f$Checkbox$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Checkbox$3e$__ = __turbopack_context__.i("[project]/node_modules/@mui/material/esm/Checkbox/Checkbox.js [app-client] (ecmascript) <export default as Checkbox>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$Table$2f$Table$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Table$3e$__ = __turbopack_context__.i("[project]/node_modules/@mui/material/esm/Table/Table.js [app-client] (ecmascript) <export default as Table>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$TableBody$2f$TableBody$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__TableBody$3e$__ = __turbopack_context__.i("[project]/node_modules/@mui/material/esm/TableBody/TableBody.js [app-client] (ecmascript) <export default as TableBody>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$TableCell$2f$TableCell$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__TableCell$3e$__ = __turbopack_context__.i("[project]/node_modules/@mui/material/esm/TableCell/TableCell.js [app-client] (ecmascript) <export default as TableCell>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$TableHead$2f$TableHead$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__TableHead$3e$__ = __turbopack_context__.i("[project]/node_modules/@mui/material/esm/TableHead/TableHead.js [app-client] (ecmascript) <export default as TableHead>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$TableRow$2f$TableRow$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__TableRow$3e$__ = __turbopack_context__.i("[project]/node_modules/@mui/material/esm/TableRow/TableRow.js [app-client] (ecmascript) <export default as TableRow>");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
;
;
;
// Mock data for display
const MOCK_MILESTONES = [
    {
        _id: "ms-1",
        title: "Thiết kế kiến trúc",
        start_date: new Date().toISOString(),
        deadline: new Date(Date.now() + 7 * 86400000).toISOString()
    },
    {
        _id: "ms-2",
        title: "Phát triển tính năng cốt lõi",
        start_date: new Date().toISOString(),
        deadline: new Date(Date.now() + 14 * 86400000).toISOString()
    }
];
const MOCK_FEATURES = (projectId)=>[
        {
            _id: "ft-1",
            code: "FT-1",
            title: "Đăng nhập OAuth",
            description: "Hỗ trợ Google SSO",
            project_id: projectId,
            creator_id: "u-1",
            status: 'planning',
            priority: 'medium',
            estimated_effort: "8",
            milestone_ids: [
                "ms-1"
            ]
        },
        {
            _id: "ft-2",
            code: "FT-2",
            title: "Bảng điều khiển",
            description: "Hiển thị KPI chính",
            project_id: projectId,
            creator_id: "u-1",
            status: 'in-progress',
            priority: 'high',
            estimated_effort: "13",
            milestone_ids: [
                "ms-1",
                "ms-2"
            ]
        },
        {
            _id: "ft-3",
            code: "FT-3",
            title: "Quản lý người dùng",
            description: "CRUD và phân quyền",
            project_id: projectId,
            creator_id: "u-1",
            status: 'testing',
            priority: 'medium',
            estimated_effort: "21",
            milestone_ids: [
                "ms-2"
            ]
        }
    ];
_c = MOCK_FEATURES;
function ProjectFeaturesPage() {
    _s();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"])();
    const params = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useParams"])();
    const projectId = Array.isArray(params === null || params === void 0 ? void 0 : params.id) ? params === null || params === void 0 ? void 0 : params.id[0] : params === null || params === void 0 ? void 0 : params.id;
    const [milestones, setMilestones] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [features, setFeatures] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [openForm, setOpenForm] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [form, setForm] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        title: "",
        code: "",
        description: "",
        project_id: projectId,
        creator_id: "",
        status: 'planning',
        priority: 'medium',
        milestone_ids: []
    });
    // Chart controls
    const [weekStart, setWeekStart] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$timeline$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getStartOfWeekUTC"])(new Date()));
    const [viewMode, setViewMode] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('Weeks');
    const [autoFit, setAutoFit] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [detailMode, setDetailMode] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [milestoneModal, setMilestoneModal] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        open: false
    });
    // Inline edit state
    const [editingId, setEditingId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [editingField, setEditingField] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [editDraft, setEditDraft] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        title: "",
        code: "",
        description: "",
        assignee_id: "",
        status: 'planning',
        priority: 'medium',
        estimated_effort: "",
        start_date: "",
        end_date: "",
        milestone_id: "",
        function_ids_csv: ""
    });
    const formatRelative = (iso)=>{
        if (!iso) return '';
        const d = new Date(iso);
        const ms = Date.now() - d.getTime();
        const sec = Math.floor(ms / 1000);
        const min = Math.floor(sec / 60);
        const hr = Math.floor(min / 60);
        const day = Math.floor(hr / 24);
        if (day > 0) return "".concat(day, " day").concat(day > 1 ? 's' : '', " ago");
        if (hr > 0) return "".concat(hr, " hour").concat(hr > 1 ? 's' : '', " ago");
        if (min > 0) return "".concat(min, " minute").concat(min > 1 ? 's' : '', " ago");
        return "just now";
    };
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ProjectFeaturesPage.useEffect": ()=>{
            if (!projectId) return;
            ({
                "ProjectFeaturesPage.useEffect": async ()=>{
                    try {
                        setLoading(true);
                        const [milestoneRes, featureRes] = await Promise.all([
                            __TURBOPACK__imported__module__$5b$project$5d2f$ultis$2f$axios$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].get("/api/projects/".concat(projectId, "/milestones")).catch({
                                "ProjectFeaturesPage.useEffect": ()=>({
                                        data: null
                                    })
                            }["ProjectFeaturesPage.useEffect"]),
                            __TURBOPACK__imported__module__$5b$project$5d2f$ultis$2f$axios$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].get("/api/projects/".concat(projectId, "/features")).catch({
                                "ProjectFeaturesPage.useEffect": ()=>({
                                        data: null
                                    })
                            }["ProjectFeaturesPage.useEffect"])
                        ]);
                        const milestonesList = Array.isArray(milestoneRes.data) && milestoneRes.data.length > 0 ? milestoneRes.data : MOCK_MILESTONES;
                        setMilestones(milestonesList);
                        if (Array.isArray(featureRes.data)) {
                            // Enrich features with linked milestone ids
                            const enriched = await Promise.all(featureRes.data.map({
                                "ProjectFeaturesPage.useEffect": async (f)=>{
                                    try {
                                        const linkRes = await __TURBOPACK__imported__module__$5b$project$5d2f$ultis$2f$axios$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].get("/api/features/".concat(f._id, "/milestones"));
                                        return {
                                            ...f,
                                            milestone_ids: Array.isArray(linkRes.data) ? linkRes.data : []
                                        };
                                    } catch (e) {
                                        return {
                                            ...f,
                                            milestone_ids: []
                                        };
                                    }
                                }
                            }["ProjectFeaturesPage.useEffect"]));
                            setFeatures(enriched);
                        } else {
                            // Fallback: localStorage or mock
                            const key = "features:".concat(projectId);
                            const raw = ("TURBOPACK compile-time truthy", 1) ? window.localStorage.getItem(key) : "TURBOPACK unreachable";
                            if (raw) {
                                setFeatures(JSON.parse(raw));
                            } else {
                                setFeatures(MOCK_FEATURES(projectId));
                            }
                        }
                    } catch (e) {
                        // Fallback to mock data
                        setMilestones(MOCK_MILESTONES);
                        setFeatures(MOCK_FEATURES(projectId));
                        setError(null);
                    } finally{
                        setLoading(false);
                    }
                }
            })["ProjectFeaturesPage.useEffect"]();
        }
    }["ProjectFeaturesPage.useEffect"], [
        projectId
    ]);
    // Persist features to localStorage whenever they change
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ProjectFeaturesPage.useEffect": ()=>{
            if (!projectId) return;
            const key = "features:".concat(projectId);
            if (features && features.length > 0) {
                if ("TURBOPACK compile-time truthy", 1) {
                    window.localStorage.setItem(key, JSON.stringify(features));
                }
            }
        }
    }["ProjectFeaturesPage.useEffect"], [
        projectId,
        features
    ]);
    const milestoneOptions = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "ProjectFeaturesPage.useMemo[milestoneOptions]": ()=>milestones.map({
                "ProjectFeaturesPage.useMemo[milestoneOptions]": (m)=>({
                        id: m._id,
                        label: m.title
                    })
            }["ProjectFeaturesPage.useMemo[milestoneOptions]"])
    }["ProjectFeaturesPage.useMemo[milestoneOptions]"], [
        milestones
    ]);
    // Compute progress per feature: % milestones completed
    const featureProgress = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "ProjectFeaturesPage.useMemo[featureProgress]": ()=>{
            const statusById = new Map(milestones.map({
                "ProjectFeaturesPage.useMemo[featureProgress]": (m)=>[
                        m._id,
                        m.status
                    ]
            }["ProjectFeaturesPage.useMemo[featureProgress]"]));
            const map = new Map();
            features.forEach({
                "ProjectFeaturesPage.useMemo[featureProgress]": (f)=>{
                    const ids = f.milestone_ids || [];
                    if (!ids.length) {
                        map.set(f._id, 0);
                        return;
                    }
                    const total = ids.length;
                    const completed = ids.reduce({
                        "ProjectFeaturesPage.useMemo[featureProgress].completed": (acc, id)=>acc + (statusById.get(id) === 'Completed' ? 1 : 0)
                    }["ProjectFeaturesPage.useMemo[featureProgress].completed"], 0);
                    map.set(f._id, Math.round(completed / total * 100));
                }
            }["ProjectFeaturesPage.useMemo[featureProgress]"]);
            return map;
        }
    }["ProjectFeaturesPage.useMemo[featureProgress]"], [
        features,
        milestones
    ]);
    // Derive feature bars from linked milestones (min start -> max deadline)
    const featureBars = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "ProjectFeaturesPage.useMemo[featureBars]": ()=>{
            const byId = new Map(milestones.map({
                "ProjectFeaturesPage.useMemo[featureBars]": (m)=>[
                        m._id,
                        m
                    ]
            }["ProjectFeaturesPage.useMemo[featureBars]"]));
            return features.map({
                "ProjectFeaturesPage.useMemo[featureBars]": (f)=>{
                    const linked = (f.milestone_ids || []).map({
                        "ProjectFeaturesPage.useMemo[featureBars].linked": (id)=>byId.get(id)
                    }["ProjectFeaturesPage.useMemo[featureBars].linked"]).filter(Boolean);
                    const start = linked.reduce({
                        "ProjectFeaturesPage.useMemo[featureBars].start": (acc, m)=>{
                            if (!m.start_date) return acc;
                            return !acc || new Date(m.start_date) < new Date(acc) ? m.start_date : acc;
                        }
                    }["ProjectFeaturesPage.useMemo[featureBars].start"], undefined);
                    const end = linked.reduce({
                        "ProjectFeaturesPage.useMemo[featureBars].end": (acc, m)=>{
                            if (!m.deadline) return acc;
                            return !acc || new Date(m.deadline) > new Date(acc) ? m.deadline : acc;
                        }
                    }["ProjectFeaturesPage.useMemo[featureBars].end"], undefined);
                    var _featureProgress_get;
                    const pct = (_featureProgress_get = featureProgress.get(f._id)) !== null && _featureProgress_get !== void 0 ? _featureProgress_get : 0;
                    return {
                        _id: f._id,
                        title: "".concat(f.title).concat(linked.length ? " (".concat(linked.length, ")") : '', " • ").concat(pct, "%"),
                        start_date: start,
                        deadline: end
                    };
                }
            }["ProjectFeaturesPage.useMemo[featureBars]"]);
        }
    }["ProjectFeaturesPage.useMemo[featureBars]"], [
        features,
        milestones,
        featureProgress
    ]);
    // Expand to detailed chart rows per milestone when detailMode is on
    const chartRows = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "ProjectFeaturesPage.useMemo[chartRows]": ()=>{
            if (!detailMode) return featureBars;
            const byId = new Map(milestones.map({
                "ProjectFeaturesPage.useMemo[chartRows]": (m)=>[
                        m._id,
                        m
                    ]
            }["ProjectFeaturesPage.useMemo[chartRows]"]));
            const rows = [];
            features.forEach({
                "ProjectFeaturesPage.useMemo[chartRows]": (f)=>{
                    const ids = f.milestone_ids || [];
                    ids.forEach({
                        "ProjectFeaturesPage.useMemo[chartRows]": (mid)=>{
                            const m = byId.get(mid);
                            if (m) {
                                rows.push({
                                    _id: m._id,
                                    title: "".concat(f.title, " • ").concat(m.title),
                                    start_date: m.start_date,
                                    deadline: m.deadline
                                });
                            }
                        }
                    }["ProjectFeaturesPage.useMemo[chartRows]"]);
                }
            }["ProjectFeaturesPage.useMemo[chartRows]"]);
            return rows.length ? rows : featureBars;
        }
    }["ProjectFeaturesPage.useMemo[chartRows]"], [
        detailMode,
        featureBars,
        features,
        milestones
    ]);
    const handleOpenForm = ()=>{
        setForm({
            title: "",
            code: "",
            description: "",
            project_id: projectId,
            creator_id: "",
            status: 'planning',
            priority: 'medium',
            milestone_ids: []
        });
        setOpenForm(true);
    };
    const handleCreateFeature = async ()=>{
        try {
            // Gọi backend tạo feature và liên kết milestones
            const res = await __TURBOPACK__imported__module__$5b$project$5d2f$ultis$2f$axios$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].post("/api/projects/".concat(projectId, "/features"), {
                title: form.title,
                code: form.code,
                description: form.description,
                creator_id: form.creator_id,
                status: form.status,
                priority: form.priority,
                estimated_effort: form.estimated_effort,
                milestone_id: form.milestone_id
            });
            const created = res.data;
            let milestone_ids = [];
            try {
                const linkRes = await __TURBOPACK__imported__module__$5b$project$5d2f$ultis$2f$axios$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].get("/api/features/".concat(created._id, "/milestones"));
                milestone_ids = Array.isArray(linkRes.data) ? linkRes.data : [];
            } catch (e) {}
            setFeatures((prev)=>[
                    {
                        ...created,
                        milestone_ids
                    },
                    ...prev
                ]);
            setOpenForm(false);
        } catch (e) {
            var _e_response_data, _e_response;
            setError((e === null || e === void 0 ? void 0 : (_e_response = e.response) === null || _e_response === void 0 ? void 0 : (_e_response_data = _e_response.data) === null || _e_response_data === void 0 ? void 0 : _e_response_data.message) || "Không thể tạo feature");
        }
    };
    const startEditCell = (f, field)=>{
        setEditingId(f._id);
        setEditingField(field);
        setEditDraft({
            title: f.title,
            code: f.code,
            description: f.description,
            assignee_id: f.assignee_id || "",
            status: f.status,
            priority: f.priority,
            estimated_effort: f.estimated_effort || "",
            start_date: f.start_date,
            end_date: f.end_date,
            milestone_id: f.milestone_id || "",
            function_ids_csv: (f.function_ids || []).join(',')
        });
    };
    const cancelEditRow = ()=>{
        setEditingId(null);
        setEditingField(null);
        setEditDraft({
            title: "",
            code: "",
            description: "",
            assignee_id: "",
            status: 'planning',
            priority: 'medium',
            estimated_effort: "",
            start_date: "",
            end_date: "",
            milestone_id: "",
            function_ids_csv: ""
        });
    };
    const saveEditRow = async (id)=>{
        try {
            const all = {
                title: editDraft.title,
                code: editDraft.code,
                description: editDraft.description,
                assignee_id: editDraft.assignee_id || null,
                status: editDraft.status,
                priority: editDraft.priority,
                estimated_effort: editDraft.estimated_effort,
                start_date: editDraft.start_date,
                end_date: editDraft.end_date,
                milestone_id: editDraft.milestone_id || null,
                function_ids: (editDraft.function_ids_csv || '').split(',').map((s)=>s.trim()).filter(Boolean)
            };
            const payload = editingField ? {
                [editingField === 'function_ids_csv' ? 'function_ids' : editingField]: editingField === 'function_ids_csv' ? all.function_ids : all[editingField]
            } : all;
            await __TURBOPACK__imported__module__$5b$project$5d2f$ultis$2f$axios$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].patch("/api/features/".concat(id), payload).catch(()=>null);
            setFeatures((prev)=>prev.map((x)=>{
                    if (x._id !== id) return x;
                    const updated = {
                        ...x,
                        updatedAt: new Date().toISOString()
                    };
                    if (editingField) {
                        if (editingField === 'function_ids_csv') updated.function_ids = all.function_ids;
                        else updated[editingField] = all[editingField];
                    } else Object.assign(updated, all);
                    return updated;
                }));
            cancelEditRow();
        } catch (e) {}
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "min-h-screen bg-[var(--background)]",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ResponsiveSidebar$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                fileName: "[project]/src/app/projects/[id]/features/page.tsx",
                lineNumber: 339,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
                className: "p-4 md:p-6 md:ml-64",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "mx-auto w-full max-w-7xl",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "mb-6 md:mb-8 flex items-center justify-between",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "space-y-1",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "text-[10px] md:text-xs uppercase tracking-wider text-foreground/60",
                                            children: "Dự án"
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/projects/[id]/features/page.tsx",
                                            lineNumber: 344,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                            className: "text-2xl md:text-3xl font-semibold tracking-tight text-foreground",
                                            children: "Features"
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/projects/[id]/features/page.tsx",
                                            lineNumber: 345,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/app/projects/[id]/features/page.tsx",
                                    lineNumber: 343,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-center gap-2",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$Button$2f$Button$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Button$3e$__["Button"], {
                                            variant: "contained",
                                            onClick: handleOpenForm,
                                            children: "Tạo Feature"
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/projects/[id]/features/page.tsx",
                                            lineNumber: 348,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$Button$2f$Button$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Button$3e$__["Button"], {
                                            variant: "outlined",
                                            onClick: ()=>router.push("/projects/".concat(projectId)),
                                            children: "Milestones"
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/projects/[id]/features/page.tsx",
                                            lineNumber: 349,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$Button$2f$Button$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Button$3e$__["Button"], {
                                            variant: "outlined",
                                            onClick: ()=>router.back(),
                                            children: "Quay lại"
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/projects/[id]/features/page.tsx",
                                            lineNumber: 350,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/app/projects/[id]/features/page.tsx",
                                    lineNumber: 347,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/app/projects/[id]/features/page.tsx",
                            lineNumber: 342,
                            columnNumber: 11
                        }, this),
                        loading ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$Box$2f$Box$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Box$3e$__["Box"], {
                            sx: {
                                display: "flex",
                                justifyContent: "center",
                                py: 6
                            },
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$CircularProgress$2f$CircularProgress$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__CircularProgress$3e$__["CircularProgress"], {
                                size: 28
                            }, void 0, false, {
                                fileName: "[project]/src/app/projects/[id]/features/page.tsx",
                                lineNumber: 356,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/app/projects/[id]/features/page.tsx",
                            lineNumber: 355,
                            columnNumber: 13
                        }, this) : error ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$Box$2f$Box$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Box$3e$__["Box"], {
                            className: "rounded-xl border border-red-500/40 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-200 p-4",
                            children: error
                        }, void 0, false, {
                            fileName: "[project]/src/app/projects/[id]/features/page.tsx",
                            lineNumber: 359,
                            columnNumber: 13
                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$Stack$2f$Stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Stack$3e$__["Stack"], {
                            spacing: 3,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$Paper$2f$Paper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Paper$3e$__["Paper"], {
                                    variant: "outlined",
                                    sx: {
                                        p: 2
                                    },
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$Stack$2f$Stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Stack$3e$__["Stack"], {
                                            direction: "row",
                                            alignItems: "center",
                                            spacing: 2,
                                            sx: {
                                                mb: 2
                                            },
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$FormControl$2f$FormControl$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__FormControl$3e$__["FormControl"], {
                                                    size: "small",
                                                    sx: {
                                                        minWidth: 140
                                                    },
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$InputLabel$2f$InputLabel$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__InputLabel$3e$__["InputLabel"], {
                                                            id: "view-mode-label",
                                                            children: "View"
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/projects/[id]/features/page.tsx",
                                                            lineNumber: 367,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$Select$2f$Select$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Select$3e$__["Select"], {
                                                            labelId: "view-mode-label",
                                                            label: "View",
                                                            value: viewMode,
                                                            onChange: (e)=>setViewMode(e.target.value),
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$MenuItem$2f$MenuItem$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__MenuItem$3e$__["MenuItem"], {
                                                                    value: "Days",
                                                                    children: "Days"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/projects/[id]/features/page.tsx",
                                                                    lineNumber: 369,
                                                                    columnNumber: 23
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$MenuItem$2f$MenuItem$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__MenuItem$3e$__["MenuItem"], {
                                                                    value: "Weeks",
                                                                    children: "Weeks"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/projects/[id]/features/page.tsx",
                                                                    lineNumber: 370,
                                                                    columnNumber: 23
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$MenuItem$2f$MenuItem$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__MenuItem$3e$__["MenuItem"], {
                                                                    value: "Months",
                                                                    children: "Months"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/projects/[id]/features/page.tsx",
                                                                    lineNumber: 371,
                                                                    columnNumber: 23
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$MenuItem$2f$MenuItem$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__MenuItem$3e$__["MenuItem"], {
                                                                    value: "Quarters",
                                                                    children: "Quarters"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/projects/[id]/features/page.tsx",
                                                                    lineNumber: 372,
                                                                    columnNumber: 23
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/src/app/projects/[id]/features/page.tsx",
                                                            lineNumber: 368,
                                                            columnNumber: 21
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/app/projects/[id]/features/page.tsx",
                                                    lineNumber: 366,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$Button$2f$Button$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Button$3e$__["Button"], {
                                                    size: "small",
                                                    variant: "outlined",
                                                    onClick: ()=>setAutoFit((a)=>!a),
                                                    children: autoFit ? 'Auto Fit: On' : 'Auto Fit: Off'
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/projects/[id]/features/page.tsx",
                                                    lineNumber: 375,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$Button$2f$Button$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Button$3e$__["Button"], {
                                                    size: "small",
                                                    variant: "outlined",
                                                    onClick: ()=>setDetailMode((d)=>!d),
                                                    children: detailMode ? 'Chi tiết milestone: Bật' : 'Chi tiết milestone: Tắt'
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/projects/[id]/features/page.tsx",
                                                    lineNumber: 378,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/projects/[id]/features/page.tsx",
                                            lineNumber: 365,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$GanttChart$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                            milestones: chartRows,
                                            viewMode: viewMode,
                                            startDate: weekStart,
                                            autoFit: autoFit,
                                            pagingStepDays: viewMode === 'Quarters' ? 90 : viewMode === 'Months' ? 30 : viewMode === 'Weeks' ? 7 : 7,
                                            onRequestShift: (days)=>setWeekStart((prev)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$timeline$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["addDays"])(prev, days)),
                                            onMilestoneShift: async (rowId, deltaDays)=>{
                                                if (detailMode) {
                                                    // Shift a single milestone row directly
                                                    const m = milestones.find((x)=>x._id === rowId);
                                                    if (!m) return;
                                                    const toIso = (iso)=>{
                                                        if (!iso) return undefined;
                                                        const d = new Date(iso);
                                                        d.setUTCDate(d.getUTCDate() + deltaDays);
                                                        return d.toISOString();
                                                    };
                                                    setMilestones((prev)=>(prev || []).map((x)=>x._id === rowId ? {
                                                                ...x,
                                                                start_date: toIso(x.start_date),
                                                                deadline: toIso(x.deadline)
                                                            } : x));
                                                    await __TURBOPACK__imported__module__$5b$project$5d2f$ultis$2f$axios$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].patch("/api/projects/".concat(projectId, "/milestones/").concat(rowId), {
                                                        start_date: toIso(m.start_date),
                                                        deadline: toIso(m.deadline)
                                                    }).catch(()=>null);
                                                } else {
                                                    // Shift all milestones linked to a feature bar
                                                    const f = features.find((x)=>x._id === rowId);
                                                    if (!f || !f.milestone_ids || f.milestone_ids.length === 0) return;
                                                    setMilestones((prev)=>(prev || []).map((m)=>{
                                                            var _f_milestone_ids;
                                                            if (!((_f_milestone_ids = f.milestone_ids) === null || _f_milestone_ids === void 0 ? void 0 : _f_milestone_ids.includes(m._id))) return m;
                                                            const shiftDate = (iso)=>{
                                                                if (!iso) return iso;
                                                                const d = new Date(iso);
                                                                d.setUTCDate(d.getUTCDate() + deltaDays);
                                                                return d.toISOString();
                                                            };
                                                            return {
                                                                ...m,
                                                                start_date: shiftDate(m.start_date),
                                                                deadline: shiftDate(m.deadline)
                                                            };
                                                        }));
                                                    const updates = (f.milestone_ids || []).map(async (mid)=>{
                                                        const m = milestones.find((x)=>x._id === mid);
                                                        if (!m) return;
                                                        const toIso = (iso)=>{
                                                            if (!iso) return undefined;
                                                            const d = new Date(iso);
                                                            d.setUTCDate(d.getUTCDate() + deltaDays);
                                                            return d.toISOString();
                                                        };
                                                        await __TURBOPACK__imported__module__$5b$project$5d2f$ultis$2f$axios$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].patch("/api/projects/".concat(projectId, "/milestones/").concat(mid), {
                                                            start_date: toIso(m.start_date),
                                                            deadline: toIso(m.deadline)
                                                        }).catch(()=>null);
                                                    });
                                                    await Promise.all(updates);
                                                }
                                            },
                                            onMilestoneClick: (rowId)=>{
                                                if (detailMode) {
                                                    setMilestoneModal({
                                                        open: true,
                                                        milestoneId: rowId
                                                    });
                                                }
                                            }
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/projects/[id]/features/page.tsx",
                                            lineNumber: 382,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/app/projects/[id]/features/page.tsx",
                                    lineNumber: 364,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$Paper$2f$Paper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Paper$3e$__["Paper"], {
                                    variant: "outlined",
                                    sx: {
                                        p: 0
                                    },
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$Box$2f$Box$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Box$3e$__["Box"], {
                                        sx: {
                                            overflowX: 'auto',
                                            width: '100%',
                                            '&::-webkit-scrollbar': {
                                                height: 8
                                            },
                                            '&::-webkit-scrollbar-thumb': {
                                                background: 'rgba(0,0,0,0.3)',
                                                borderRadius: 8
                                            }
                                        },
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$Table$2f$Table$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Table$3e$__["Table"], {
                                            size: "small",
                                            sx: {
                                                minWidth: 1400,
                                                '& td, & th': {
                                                    borderColor: 'var(--border)'
                                                }
                                            },
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$TableHead$2f$TableHead$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__TableHead$3e$__["TableHead"], {
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$TableRow$2f$TableRow$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__TableRow$3e$__["TableRow"], {
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$TableCell$2f$TableCell$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__TableCell$3e$__["TableCell"], {
                                                                sx: {
                                                                    width: 44
                                                                }
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/app/projects/[id]/features/page.tsx",
                                                                lineNumber: 451,
                                                                columnNumber: 23
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$TableCell$2f$TableCell$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__TableCell$3e$__["TableCell"], {
                                                                children: "Code"
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/app/projects/[id]/features/page.tsx",
                                                                lineNumber: 452,
                                                                columnNumber: 23
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$TableCell$2f$TableCell$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__TableCell$3e$__["TableCell"], {
                                                                children: "Title"
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/app/projects/[id]/features/page.tsx",
                                                                lineNumber: 453,
                                                                columnNumber: 23
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$TableCell$2f$TableCell$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__TableCell$3e$__["TableCell"], {
                                                                children: "Status"
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/app/projects/[id]/features/page.tsx",
                                                                lineNumber: 454,
                                                                columnNumber: 23
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$TableCell$2f$TableCell$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__TableCell$3e$__["TableCell"], {
                                                                children: "Start date"
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/app/projects/[id]/features/page.tsx",
                                                                lineNumber: 455,
                                                                columnNumber: 23
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$TableCell$2f$TableCell$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__TableCell$3e$__["TableCell"], {
                                                                children: "End date"
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/app/projects/[id]/features/page.tsx",
                                                                lineNumber: 456,
                                                                columnNumber: 23
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$TableCell$2f$TableCell$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__TableCell$3e$__["TableCell"], {
                                                                children: "Priority"
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/app/projects/[id]/features/page.tsx",
                                                                lineNumber: 457,
                                                                columnNumber: 23
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$TableCell$2f$TableCell$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__TableCell$3e$__["TableCell"], {
                                                                children: "Estimated effort"
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/app/projects/[id]/features/page.tsx",
                                                                lineNumber: 458,
                                                                columnNumber: 23
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$TableCell$2f$TableCell$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__TableCell$3e$__["TableCell"], {
                                                                children: "Description"
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/app/projects/[id]/features/page.tsx",
                                                                lineNumber: 459,
                                                                columnNumber: 23
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$TableCell$2f$TableCell$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__TableCell$3e$__["TableCell"], {
                                                                children: "Last updated"
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/app/projects/[id]/features/page.tsx",
                                                                lineNumber: 460,
                                                                columnNumber: 23
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/src/app/projects/[id]/features/page.tsx",
                                                        lineNumber: 450,
                                                        columnNumber: 21
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/projects/[id]/features/page.tsx",
                                                    lineNumber: 449,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$TableBody$2f$TableBody$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__TableBody$3e$__["TableBody"], {
                                                    children: (features || []).map((f, idx)=>{
                                                        var _editDraft_start_date, _editDraft_end_date;
                                                        var _featureProgress_get;
                                                        const pct = (_featureProgress_get = featureProgress.get(f._id)) !== null && _featureProgress_get !== void 0 ? _featureProgress_get : 0;
                                                        const owners = [
                                                            {
                                                                id: '1',
                                                                name: 'A'
                                                            },
                                                            {
                                                                id: '2',
                                                                name: 'B'
                                                            }
                                                        ];
                                                        const due = (()=>{
                                                            const ids = f.milestone_ids || [];
                                                            if (!ids.length) return undefined;
                                                            const ms = milestones.filter((m)=>ids.includes(m._id));
                                                            const latest = ms.reduce((acc, m)=>{
                                                                if (!m.deadline) return acc;
                                                                return !acc || new Date(m.deadline) > new Date(acc) ? m.deadline : acc;
                                                            }, undefined);
                                                            return latest;
                                                        })();
                                                        const dueDateText = due ? new Date(due).toLocaleString('en-US', {
                                                            month: 'short',
                                                            day: 'numeric'
                                                        }) : '-';
                                                        const statusChip = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$Chip$2f$Chip$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Chip$3e$__["Chip"], {
                                                            size: "small",
                                                            label: f.status,
                                                            sx: {
                                                                color: '#fff',
                                                                bgcolor: f.status === 'completed' ? '#22c55e' : f.status === 'in-progress' ? '#f59e0b' : '#3b82f6',
                                                                fontWeight: 600
                                                            }
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/projects/[id]/features/page.tsx",
                                                            lineNumber: 482,
                                                            columnNumber: 25
                                                        }, this);
                                                        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$TableRow$2f$TableRow$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__TableRow$3e$__["TableRow"], {
                                                            hover: true,
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$TableCell$2f$TableCell$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__TableCell$3e$__["TableCell"], {
                                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$Checkbox$2f$Checkbox$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Checkbox$3e$__["Checkbox"], {
                                                                        size: "small"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/app/projects/[id]/features/page.tsx",
                                                                        lineNumber: 494,
                                                                        columnNumber: 38
                                                                    }, this)
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/projects/[id]/features/page.tsx",
                                                                    lineNumber: 494,
                                                                    columnNumber: 27
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$TableCell$2f$TableCell$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__TableCell$3e$__["TableCell"], {
                                                                    sx: {
                                                                        fontWeight: 600
                                                                    },
                                                                    onDoubleClick: ()=>startEditCell(f, 'code'),
                                                                    children: editingId === f._id && editingField === 'code' ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$TextField$2f$TextField$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__TextField$3e$__["TextField"], {
                                                                        size: "small",
                                                                        value: editDraft.code,
                                                                        onChange: (e)=>setEditDraft((s)=>({
                                                                                    ...s,
                                                                                    code: e.target.value
                                                                                })),
                                                                        fullWidth: true,
                                                                        onBlur: ()=>saveEditRow(f._id)
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/app/projects/[id]/features/page.tsx",
                                                                        lineNumber: 497,
                                                                        columnNumber: 31
                                                                    }, this) : f.code || '-'
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/projects/[id]/features/page.tsx",
                                                                    lineNumber: 495,
                                                                    columnNumber: 27
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$TableCell$2f$TableCell$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__TableCell$3e$__["TableCell"], {
                                                                    sx: {
                                                                        fontWeight: 600
                                                                    },
                                                                    onDoubleClick: ()=>startEditCell(f, 'title'),
                                                                    children: editingId === f._id && editingField === 'title' ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$TextField$2f$TextField$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__TextField$3e$__["TextField"], {
                                                                        size: "small",
                                                                        value: editDraft.title,
                                                                        onChange: (e)=>setEditDraft((s)=>({
                                                                                    ...s,
                                                                                    title: e.target.value
                                                                                })),
                                                                        fullWidth: true,
                                                                        onBlur: ()=>saveEditRow(f._id)
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/app/projects/[id]/features/page.tsx",
                                                                        lineNumber: 504,
                                                                        columnNumber: 31
                                                                    }, this) : f.title
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/projects/[id]/features/page.tsx",
                                                                    lineNumber: 502,
                                                                    columnNumber: 27
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$TableCell$2f$TableCell$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__TableCell$3e$__["TableCell"], {
                                                                    onDoubleClick: ()=>startEditCell(f, 'status'),
                                                                    children: editingId === f._id && editingField === 'status' ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$Select$2f$Select$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Select$3e$__["Select"], {
                                                                        size: "small",
                                                                        value: editDraft.status || 'planning',
                                                                        onChange: (e)=>setEditDraft((s)=>({
                                                                                    ...s,
                                                                                    status: e.target.value
                                                                                })),
                                                                        fullWidth: true,
                                                                        onClose: ()=>saveEditRow(f._id),
                                                                        children: [
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$MenuItem$2f$MenuItem$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__MenuItem$3e$__["MenuItem"], {
                                                                                value: "planning",
                                                                                children: "planning"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/src/app/projects/[id]/features/page.tsx",
                                                                                lineNumber: 519,
                                                                                columnNumber: 33
                                                                            }, this),
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$MenuItem$2f$MenuItem$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__MenuItem$3e$__["MenuItem"], {
                                                                                value: "in-progress",
                                                                                children: "in-progress"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/src/app/projects/[id]/features/page.tsx",
                                                                                lineNumber: 520,
                                                                                columnNumber: 33
                                                                            }, this),
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$MenuItem$2f$MenuItem$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__MenuItem$3e$__["MenuItem"], {
                                                                                value: "testing",
                                                                                children: "testing"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/src/app/projects/[id]/features/page.tsx",
                                                                                lineNumber: 521,
                                                                                columnNumber: 33
                                                                            }, this),
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$MenuItem$2f$MenuItem$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__MenuItem$3e$__["MenuItem"], {
                                                                                value: "completed",
                                                                                children: "completed"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/src/app/projects/[id]/features/page.tsx",
                                                                                lineNumber: 522,
                                                                                columnNumber: 33
                                                                            }, this),
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$MenuItem$2f$MenuItem$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__MenuItem$3e$__["MenuItem"], {
                                                                                value: "cancelled",
                                                                                children: "cancelled"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/src/app/projects/[id]/features/page.tsx",
                                                                                lineNumber: 523,
                                                                                columnNumber: 33
                                                                            }, this)
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/src/app/projects/[id]/features/page.tsx",
                                                                        lineNumber: 518,
                                                                        columnNumber: 31
                                                                    }, this) : statusChip
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/projects/[id]/features/page.tsx",
                                                                    lineNumber: 516,
                                                                    columnNumber: 27
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$TableCell$2f$TableCell$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__TableCell$3e$__["TableCell"], {
                                                                    onDoubleClick: ()=>startEditCell(f, 'start_date'),
                                                                    children: editingId === f._id && editingField === 'start_date' ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$TextField$2f$TextField$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__TextField$3e$__["TextField"], {
                                                                        size: "small",
                                                                        type: "date",
                                                                        value: ((_editDraft_start_date = editDraft.start_date) === null || _editDraft_start_date === void 0 ? void 0 : _editDraft_start_date.slice(0, 10)) || '',
                                                                        onChange: (e)=>setEditDraft((s)=>({
                                                                                    ...s,
                                                                                    start_date: e.target.value
                                                                                })),
                                                                        fullWidth: true,
                                                                        onBlur: ()=>saveEditRow(f._id)
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/app/projects/[id]/features/page.tsx",
                                                                        lineNumber: 531,
                                                                        columnNumber: 31
                                                                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$Typography$2f$Typography$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Typography$3e$__["Typography"], {
                                                                        variant: "body2",
                                                                        children: f.start_date ? new Date(f.start_date).toLocaleDateString() : '—'
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/app/projects/[id]/features/page.tsx",
                                                                        lineNumber: 533,
                                                                        columnNumber: 31
                                                                    }, this)
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/projects/[id]/features/page.tsx",
                                                                    lineNumber: 529,
                                                                    columnNumber: 27
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$TableCell$2f$TableCell$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__TableCell$3e$__["TableCell"], {
                                                                    onDoubleClick: ()=>startEditCell(f, 'end_date'),
                                                                    children: editingId === f._id && editingField === 'end_date' ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$TextField$2f$TextField$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__TextField$3e$__["TextField"], {
                                                                        size: "small",
                                                                        type: "date",
                                                                        value: ((_editDraft_end_date = editDraft.end_date) === null || _editDraft_end_date === void 0 ? void 0 : _editDraft_end_date.slice(0, 10)) || '',
                                                                        onChange: (e)=>setEditDraft((s)=>({
                                                                                    ...s,
                                                                                    end_date: e.target.value
                                                                                })),
                                                                        fullWidth: true,
                                                                        onBlur: ()=>saveEditRow(f._id)
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/app/projects/[id]/features/page.tsx",
                                                                        lineNumber: 538,
                                                                        columnNumber: 31
                                                                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$Typography$2f$Typography$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Typography$3e$__["Typography"], {
                                                                        variant: "body2",
                                                                        children: f.end_date ? new Date(f.end_date).toLocaleDateString() : '—'
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/app/projects/[id]/features/page.tsx",
                                                                        lineNumber: 540,
                                                                        columnNumber: 31
                                                                    }, this)
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/projects/[id]/features/page.tsx",
                                                                    lineNumber: 536,
                                                                    columnNumber: 27
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$TableCell$2f$TableCell$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__TableCell$3e$__["TableCell"], {
                                                                    onDoubleClick: ()=>startEditCell(f, 'priority'),
                                                                    children: editingId === f._id && editingField === 'priority' ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$Select$2f$Select$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Select$3e$__["Select"], {
                                                                        size: "small",
                                                                        value: editDraft.priority || 'medium',
                                                                        onChange: (e)=>setEditDraft((s)=>({
                                                                                    ...s,
                                                                                    priority: e.target.value
                                                                                })),
                                                                        fullWidth: true,
                                                                        onClose: ()=>saveEditRow(f._id),
                                                                        children: [
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$MenuItem$2f$MenuItem$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__MenuItem$3e$__["MenuItem"], {
                                                                                value: "low",
                                                                                children: "low"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/src/app/projects/[id]/features/page.tsx",
                                                                                lineNumber: 547,
                                                                                columnNumber: 33
                                                                            }, this),
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$MenuItem$2f$MenuItem$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__MenuItem$3e$__["MenuItem"], {
                                                                                value: "medium",
                                                                                children: "medium"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/src/app/projects/[id]/features/page.tsx",
                                                                                lineNumber: 548,
                                                                                columnNumber: 33
                                                                            }, this),
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$MenuItem$2f$MenuItem$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__MenuItem$3e$__["MenuItem"], {
                                                                                value: "high",
                                                                                children: "high"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/src/app/projects/[id]/features/page.tsx",
                                                                                lineNumber: 549,
                                                                                columnNumber: 33
                                                                            }, this),
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$MenuItem$2f$MenuItem$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__MenuItem$3e$__["MenuItem"], {
                                                                                value: "critical",
                                                                                children: "critical"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/src/app/projects/[id]/features/page.tsx",
                                                                                lineNumber: 550,
                                                                                columnNumber: 33
                                                                            }, this)
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/src/app/projects/[id]/features/page.tsx",
                                                                        lineNumber: 546,
                                                                        columnNumber: 31
                                                                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$Typography$2f$Typography$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Typography$3e$__["Typography"], {
                                                                        variant: "body2",
                                                                        children: f.priority
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/app/projects/[id]/features/page.tsx",
                                                                        lineNumber: 553,
                                                                        columnNumber: 31
                                                                    }, this)
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/projects/[id]/features/page.tsx",
                                                                    lineNumber: 544,
                                                                    columnNumber: 27
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$TableCell$2f$TableCell$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__TableCell$3e$__["TableCell"], {
                                                                    onDoubleClick: ()=>startEditCell(f, 'estimated_effort'),
                                                                    children: editingId === f._id && editingField === 'estimated_effort' ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$TextField$2f$TextField$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__TextField$3e$__["TextField"], {
                                                                        size: "small",
                                                                        value: editDraft.estimated_effort || '',
                                                                        onChange: (e)=>setEditDraft((s)=>({
                                                                                    ...s,
                                                                                    estimated_effort: e.target.value
                                                                                })),
                                                                        fullWidth: true,
                                                                        onBlur: ()=>saveEditRow(f._id)
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/app/projects/[id]/features/page.tsx",
                                                                        lineNumber: 558,
                                                                        columnNumber: 31
                                                                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$Typography$2f$Typography$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Typography$3e$__["Typography"], {
                                                                        variant: "body2",
                                                                        children: f.estimated_effort || '-'
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/app/projects/[id]/features/page.tsx",
                                                                        lineNumber: 560,
                                                                        columnNumber: 31
                                                                    }, this)
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/projects/[id]/features/page.tsx",
                                                                    lineNumber: 556,
                                                                    columnNumber: 27
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$TableCell$2f$TableCell$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__TableCell$3e$__["TableCell"], {
                                                                    onDoubleClick: ()=>startEditCell(f, 'description'),
                                                                    children: editingId === f._id && editingField === 'description' ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$TextField$2f$TextField$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__TextField$3e$__["TextField"], {
                                                                        size: "small",
                                                                        value: editDraft.description || '',
                                                                        onChange: (e)=>setEditDraft((s)=>({
                                                                                    ...s,
                                                                                    description: e.target.value
                                                                                })),
                                                                        fullWidth: true,
                                                                        onBlur: ()=>saveEditRow(f._id)
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/app/projects/[id]/features/page.tsx",
                                                                        lineNumber: 565,
                                                                        columnNumber: 31
                                                                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$Typography$2f$Typography$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Typography$3e$__["Typography"], {
                                                                        variant: "body2",
                                                                        sx: {
                                                                            opacity: .9
                                                                        },
                                                                        children: f.description || '—'
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/app/projects/[id]/features/page.tsx",
                                                                        lineNumber: 572,
                                                                        columnNumber: 31
                                                                    }, this)
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/projects/[id]/features/page.tsx",
                                                                    lineNumber: 563,
                                                                    columnNumber: 27
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$TableCell$2f$TableCell$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__TableCell$3e$__["TableCell"], {
                                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$Stack$2f$Stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Stack$3e$__["Stack"], {
                                                                        direction: "row",
                                                                        spacing: 1,
                                                                        alignItems: "center",
                                                                        children: [
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$Avatar$2f$Avatar$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Avatar$3e$__["Avatar"], {
                                                                                sx: {
                                                                                    width: 26,
                                                                                    height: 26
                                                                                },
                                                                                children: "A"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/src/app/projects/[id]/features/page.tsx",
                                                                                lineNumber: 579,
                                                                                columnNumber: 31
                                                                            }, this),
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$Typography$2f$Typography$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Typography$3e$__["Typography"], {
                                                                                variant: "body2",
                                                                                sx: {
                                                                                    color: 'text.secondary'
                                                                                },
                                                                                children: formatRelative(f.updatedAt)
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/src/app/projects/[id]/features/page.tsx",
                                                                                lineNumber: 580,
                                                                                columnNumber: 31
                                                                            }, this)
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/src/app/projects/[id]/features/page.tsx",
                                                                        lineNumber: 578,
                                                                        columnNumber: 29
                                                                    }, this)
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/projects/[id]/features/page.tsx",
                                                                    lineNumber: 577,
                                                                    columnNumber: 27
                                                                }, this)
                                                            ]
                                                        }, f._id || idx, true, {
                                                            fileName: "[project]/src/app/projects/[id]/features/page.tsx",
                                                            lineNumber: 493,
                                                            columnNumber: 25
                                                        }, this);
                                                    })
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/projects/[id]/features/page.tsx",
                                                    lineNumber: 463,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/projects/[id]/features/page.tsx",
                                            lineNumber: 448,
                                            columnNumber: 17
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/projects/[id]/features/page.tsx",
                                        lineNumber: 447,
                                        columnNumber: 17
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/src/app/projects/[id]/features/page.tsx",
                                    lineNumber: 446,
                                    columnNumber: 15
                                }, this),
                                features.length === 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$Paper$2f$Paper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Paper$3e$__["Paper"], {
                                    variant: "outlined",
                                    sx: {
                                        p: 2
                                    },
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$Typography$2f$Typography$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Typography$3e$__["Typography"], {
                                        variant: "body2",
                                        sx: {
                                            opacity: 0.7
                                        },
                                        children: 'Chưa có feature nào. Bấm "Tạo Feature" để thêm.'
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/projects/[id]/features/page.tsx",
                                        lineNumber: 592,
                                        columnNumber: 19
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/src/app/projects/[id]/features/page.tsx",
                                    lineNumber: 591,
                                    columnNumber: 17
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/app/projects/[id]/features/page.tsx",
                            lineNumber: 363,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$Dialog$2f$Dialog$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Dialog$3e$__["Dialog"], {
                            open: openForm,
                            onClose: ()=>setOpenForm(false),
                            fullWidth: true,
                            maxWidth: "sm",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$DialogTitle$2f$DialogTitle$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__DialogTitle$3e$__["DialogTitle"], {
                                    children: "Tạo Feature"
                                }, void 0, false, {
                                    fileName: "[project]/src/app/projects/[id]/features/page.tsx",
                                    lineNumber: 601,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$DialogContent$2f$DialogContent$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__DialogContent$3e$__["DialogContent"], {
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$Stack$2f$Stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Stack$3e$__["Stack"], {
                                        spacing: 2,
                                        sx: {
                                            mt: 1
                                        },
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$TextField$2f$TextField$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__TextField$3e$__["TextField"], {
                                                label: "Tiêu đề",
                                                value: form.title,
                                                onChange: (e)=>setForm((prev)=>({
                                                            ...prev,
                                                            title: e.target.value
                                                        })),
                                                fullWidth: true
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/projects/[id]/features/page.tsx",
                                                lineNumber: 604,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$TextField$2f$TextField$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__TextField$3e$__["TextField"], {
                                                label: "Mô tả",
                                                value: form.description,
                                                onChange: (e)=>setForm((prev)=>({
                                                            ...prev,
                                                            description: e.target.value
                                                        })),
                                                fullWidth: true,
                                                multiline: true,
                                                minRows: 3
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/projects/[id]/features/page.tsx",
                                                lineNumber: 610,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$TextField$2f$TextField$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__TextField$3e$__["TextField"], {
                                                label: "Mã (code)",
                                                value: form.code,
                                                onChange: (e)=>setForm((prev)=>({
                                                            ...prev,
                                                            code: e.target.value
                                                        })),
                                                fullWidth: true
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/projects/[id]/features/page.tsx",
                                                lineNumber: 618,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$Divider$2f$Divider$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Divider$3e$__["Divider"], {}, void 0, false, {
                                                fileName: "[project]/src/app/projects/[id]/features/page.tsx",
                                                lineNumber: 624,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$FormControl$2f$FormControl$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__FormControl$3e$__["FormControl"], {
                                                fullWidth: true,
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$InputLabel$2f$InputLabel$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__InputLabel$3e$__["InputLabel"], {
                                                        id: "milestone-select-label",
                                                        children: "Milestones"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/projects/[id]/features/page.tsx",
                                                        lineNumber: 626,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$Select$2f$Select$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Select$3e$__["Select"], {
                                                        labelId: "milestone-select-label",
                                                        label: "Milestones",
                                                        multiple: true,
                                                        value: form.milestone_ids || [],
                                                        onChange: (e)=>setForm((prev)=>({
                                                                    ...prev,
                                                                    milestone_ids: e.target.value
                                                                })),
                                                        renderValue: (selected)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$Stack$2f$Stack$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Stack$3e$__["Stack"], {
                                                                direction: "row",
                                                                spacing: 1,
                                                                flexWrap: "wrap",
                                                                children: selected.map((id)=>{
                                                                    const m = milestoneOptions.find((o)=>o.id === id);
                                                                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$Chip$2f$Chip$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Chip$3e$__["Chip"], {
                                                                        label: (m === null || m === void 0 ? void 0 : m.label) || id,
                                                                        size: "small"
                                                                    }, id, false, {
                                                                        fileName: "[project]/src/app/projects/[id]/features/page.tsx",
                                                                        lineNumber: 637,
                                                                        columnNumber: 34
                                                                    }, void 0);
                                                                })
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/app/projects/[id]/features/page.tsx",
                                                                lineNumber: 634,
                                                                columnNumber: 23
                                                            }, void 0),
                                                        children: milestoneOptions.map((m)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$MenuItem$2f$MenuItem$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__MenuItem$3e$__["MenuItem"], {
                                                                value: m.id,
                                                                children: m.label
                                                            }, m.id, false, {
                                                                fileName: "[project]/src/app/projects/[id]/features/page.tsx",
                                                                lineNumber: 643,
                                                                columnNumber: 23
                                                            }, this))
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/projects/[id]/features/page.tsx",
                                                        lineNumber: 627,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/app/projects/[id]/features/page.tsx",
                                                lineNumber: 625,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/projects/[id]/features/page.tsx",
                                        lineNumber: 603,
                                        columnNumber: 15
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/src/app/projects/[id]/features/page.tsx",
                                    lineNumber: 602,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$DialogActions$2f$DialogActions$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__DialogActions$3e$__["DialogActions"], {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$Button$2f$Button$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Button$3e$__["Button"], {
                                            onClick: ()=>setOpenForm(false),
                                            children: "Hủy"
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/projects/[id]/features/page.tsx",
                                            lineNumber: 650,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$mui$2f$material$2f$esm$2f$Button$2f$Button$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Button$3e$__["Button"], {
                                            variant: "contained",
                                            onClick: handleCreateFeature,
                                            children: "Tạo"
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/projects/[id]/features/page.tsx",
                                            lineNumber: 651,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/app/projects/[id]/features/page.tsx",
                                    lineNumber: 649,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/app/projects/[id]/features/page.tsx",
                            lineNumber: 600,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/app/projects/[id]/features/page.tsx",
                    lineNumber: 341,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/app/projects/[id]/features/page.tsx",
                lineNumber: 340,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/app/projects/[id]/features/page.tsx",
        lineNumber: 338,
        columnNumber: 5
    }, this);
}
_s(ProjectFeaturesPage, "AqPCBNOmiXJEMh/Oeq9XQ/aKC4g=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useParams"]
    ];
});
_c1 = ProjectFeaturesPage;
var _c, _c1;
__turbopack_context__.k.register(_c, "MOCK_FEATURES");
__turbopack_context__.k.register(_c1, "ProjectFeaturesPage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=_50c2bca5._.js.map