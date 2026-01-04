"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mulitProductComponents = exports.flowDataMap = exports.TitlesFlow = exports.data = exports.names = void 0;
exports.names = [
    { id: "104", name: "המבורגר" },
    { id: "105", name: "פיצה" },
    { id: "106", name: "סלט" },
];
exports.data = {
    options: [
        { id: "001", title: "ישיבה במסעדה" },
        { id: "002", title: "ארוחה לקחת" },
        { id: "003", title: "משלוח" },
    ],
    meatTypes: [
        { id: "101", title: "בשר בקר" },
        { id: "102", title: "עוף" },
        { id: "103", title: "דג" },
    ],
    onMeat: [
        { id: "201", title: "גבינה" },
        { id: "202", title: "ירקות" },
        { id: "203", title: "רוטב מיוחד" },
    ],
    salads: [
        { id: "301", title: "סלט ירקות" },
        { id: "302", title: "סלט קיסר" },
        { id: "303", title: "סלט יווני" },
    ],
    drinks: [
        { id: "401", title: "קולה" },
        { id: "402", title: "מים" },
        { id: "403", title: "מיץ תפוזים" },
    ],
};
exports.TitlesFlow = {
    meat: "סוג בשר",
    onMeat: "תוספות על הבשר",
    salad: "סלט",
    drink: "משקה",
    note: "הערות",
    takeaway_order: "סוג הזמנה",
    name_order: "שם הלקוח",
    note_order: "הערות להזמנה",
};
exports.flowDataMap = {
    "104": {
        flow_token: "hamburger_flow_token",
        mode: "draft",
    },
    "105": {
        flow_token: "pizza_flow_token",
        mode: "draft",
    },
    "106": {
        flow_token: "salad_flow_token",
        mode: "draft",
    },
    default: {
        flow_token: "default_flow_token",
        mode: "draft",
    },
};
exports.mulitProductComponents = [
    {
        type: "header",
        text: {
            body: "ברוכים הבאים למסעדת BYB!",
        },
    },
    {
        type: "body",
        text: {
            body: "בחרו מהתפריט שלנו:",
        },
    },
];
