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
// There are several levels at which information can be shared:
//   * closures - singleton when a script is loaded from the same source
//   * window object - singleton for the tab, even when script is loaded from different sources
//   * SessionStorage - browser API that is unique per tab, but gets copied to new tabs when the tab is duplicated
//   * BroadcastChannel - shares info across tabs (one message per BroadcastChannel object on the same channel)
//
// We mostly use `window` object here rather than closures, so that if the script is loaded multiple times from different URLs,
// each 'instance' of the script will report the same tab id
var CHANNEL_AND_STORAGE_NAME = "unique-browser-tab-id";
var IN_FLIGHT_PROMISE_NAME = "".concat(CHANNEL_AND_STORAGE_NAME, "-in-flight-promise");
var CONFIRMED_UNIQUE_ID_NAME = "".concat(CHANNEL_AND_STORAGE_NAME, "-confirmed-unique-id");
var storeInSessionStorage = function (id) {
    sessionStorage.setItem(CHANNEL_AND_STORAGE_NAME, id);
};
var getFromSessionStorage = function () {
    return sessionStorage.getItem(CHANNEL_AND_STORAGE_NAME);
};
var getUniqueBrowserTabId = function () { return __awaiter(void 0, void 0, void 0, function () {
    var inFlightPromise, newBrowserTabId, broadcastChannel, sessionId, id, isDupPromise, isDup;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                if (window[CONFIRMED_UNIQUE_ID_NAME] != null) {
                    return [2 /*return*/, window[CONFIRMED_UNIQUE_ID_NAME]];
                }
                if (!(window[IN_FLIGHT_PROMISE_NAME] != null)) return [3 /*break*/, 3];
                inFlightPromise = window[IN_FLIGHT_PROMISE_NAME];
                return [4 /*yield*/, inFlightPromise];
            case 1:
                _b.sent();
                return [4 /*yield*/, (0, exports.getUniqueBrowserTabId)()];
            case 2:
                newBrowserTabId = _b.sent();
                return [2 /*return*/, newBrowserTabId];
            case 3:
                broadcastChannel = (_a = window[CHANNEL_AND_STORAGE_NAME]) !== null && _a !== void 0 ? _a : new BroadcastChannel(CHANNEL_AND_STORAGE_NAME);
                //Save channel to window so it is shared between instances of this script within the same tab. 
                //This prevents instances on the same tab from receiving messages from each other.
                window[CHANNEL_AND_STORAGE_NAME] = broadcastChannel;
                sessionId = getFromSessionStorage();
                if (!(sessionId == null)) return [3 /*break*/, 4];
                //new tab - create new id
                id = (0, nanoid_1.nanoid)(4); //580 IDs needed for 1% probability of one or more collisions https://zelark.github.io/nano-id-cc/
                storeInSessionStorage(id);
                return [3 /*break*/, 6];
            case 4:
                //page was either refreshed or duplicated
                id = sessionId;
                isDupPromise = (0, exports.checkIfIsDup)(id, broadcastChannel);
                window[IN_FLIGHT_PROMISE_NAME] = isDupPromise;
                return [4 /*yield*/, isDupPromise];
            case 5:
                isDup = _b.sent();
                window[IN_FLIGHT_PROMISE_NAME] = null;
                if (isDup) {
                    //tab was duplicated, create new id
                    id = (0, nanoid_1.nanoid)(4);
                    storeInSessionStorage(id);
                }
                else {
                    //page was refreshed, everything is ok, keep non-duplicate id
                }
                _b.label = 6;
            case 6:
                window[CONFIRMED_UNIQUE_ID_NAME] = id;
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
