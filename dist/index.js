"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkIfIsDup = exports.getUniqueBrowserTabId = void 0;
var nanoid_1 = require("nanoid");
var CHANNEL_AND_STORAGE_NAME = "unique-browser-tab-id";
var storeInSessionStorage = function (id) {
    sessionStorage.setItem(CHANNEL_AND_STORAGE_NAME, id);
};
var getFromSessionStorage = function () {
    return sessionStorage.getItem(CHANNEL_AND_STORAGE_NAME);
};
var getUniqueBrowserTabId = function () { return __awaiter(void 0, void 0, void 0, function () {
    var broadcastChannel, sessionId, id, isDup;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                broadcastChannel = new BroadcastChannel(CHANNEL_AND_STORAGE_NAME);
                sessionId = getFromSessionStorage();
                if (!(sessionId == null)) return [3 /*break*/, 1];
                //new tab - create new id
                id = (0, nanoid_1.nanoid)(4); //580 IDs needed for 1% probability of one or more collisions https://zelark.github.io/nano-id-cc/
                storeInSessionStorage(id);
                return [3 /*break*/, 3];
            case 1:
                //page was either refreshed or duplicated
                id = sessionId;
                return [4 /*yield*/, (0, exports.checkIfIsDup)(id, broadcastChannel)];
            case 2:
                isDup = _a.sent();
                if (isDup) {
                    //tab was duplicated, create new id
                    id = (0, nanoid_1.nanoid)(4);
                    storeInSessionStorage(id);
                }
                else {
                    //page was refreshed, everything is ok, keep non-duplicate id
                }
                _a.label = 3;
            case 3:
                registerCheckIdListener(id, broadcastChannel);
                return [2 /*return*/, id];
        }
    });
}); };
exports.getUniqueBrowserTabId = getUniqueBrowserTabId;
var registerCheckIdListener = function (id, broadcastChannel) {
    var respondToCheckMessageHandler = function (_a) {
        var data = _a.data;
        if (isCheck(data) && data.id === id) {
            broadcastChannel.postMessage({ type: "checkResponse", id: id, exists: true });
        }
    };
    broadcastChannel.addEventListener("message", respondToCheckMessageHandler);
};
var checkIfIsDup = function (id, broadcastChannel) { return new Promise(function (resolve, reject) {
    var timerId = setTimeout(function () {
        resolve(false); // If no response after a while, assume not a duplicate
    }, 200);
    var messageErrorHandler = function (error) {
        cancelTimerAndUnregisterListeners();
        reject(error);
    };
    var respondToCheckResponseMessageHandler = function (_a) {
        var data = _a.data;
        if (data.id == id && isCheckResponse(data)) {
            cancelTimerAndUnregisterListeners();
            resolve(true);
        }
    };
    var cancelTimerAndUnregisterListeners = function () {
        clearTimeout(timerId);
        broadcastChannel.removeEventListener("message", respondToCheckResponseMessageHandler);
        broadcastChannel.removeEventListener("messageerror", messageErrorHandler);
    };
    broadcastChannel.addEventListener("message", respondToCheckResponseMessageHandler, { once: true });
    broadcastChannel.addEventListener("messageerror", messageErrorHandler, { once: true });
    broadcastChannel.postMessage({ type: "check", id: id });
}); };
exports.checkIfIsDup = checkIfIsDup;
var isCheck = function (message) {
    return message.type === "check";
};
var isCheckResponse = function (message) {
    return message.type === "checkResponse";
};
