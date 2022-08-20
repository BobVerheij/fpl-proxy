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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const fpl_api_1 = require("fpl-api");
const app = (0, express_1.default)();
let serverStarted = false;
const data = {
    updated: "",
    bootstrap: undefined,
    summaries: [],
    succesfulUpdate: "",
};
const delay = (ms = 100) => new Promise((r) => setTimeout(r, ms));
const updateData = () => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    data.updated =
        new Date().toLocaleDateString("en-EN") +
            " " +
            new Date().toLocaleTimeString("en-EN");
    const bootstrap = yield (0, fpl_api_1.fetchBootstrap)();
    if (bootstrap) {
        data.bootstrap = bootstrap;
    }
    const summaries = [];
    if ((_a = data === null || data === void 0 ? void 0 : data.bootstrap) === null || _a === void 0 ? void 0 : _a.elements) {
        const items = data.bootstrap.elements.map((el) => el.id);
        for (let i = 0; i < items.length; i++) {
            yield delay();
            try {
                const summary = yield (0, fpl_api_1.fetchElementSummary)(items[i]);
                console.log(items[i]);
                if (summary) {
                    summaries.push(summary);
                }
            }
            catch (e) {
                console.error;
            }
        }
    }
    if (summaries.length) {
        data.summaries = summaries;
    }
    if (bootstrap && summaries.length) {
        data.succesfulUpdate =
            new Date().toLocaleDateString("en-EN") +
                " " +
                new Date().toLocaleTimeString("en-EN");
    }
});
setInterval(() => __awaiter(void 0, void 0, void 0, function* () {
    yield updateData();
}), 300000);
setTimeout(() => __awaiter(void 0, void 0, void 0, function* () {
    yield updateData();
}), 100);
const router = express_1.default.Router();
router.get("/players", (req, res) => {
    var _a, _b, _c, _d;
    const { playerType = undefined, playerId = undefined } = req.query;
    if (playerType) {
        const players = (_a = data.bootstrap) === null || _a === void 0 ? void 0 : _a.elements.filter((el) => el.element_type === Number(playerType)).map((el) => {
            var _a;
            return {
                id: el.id,
                basic: el,
                summary: (_a = data.summaries) === null || _a === void 0 ? void 0 : _a.find((sum) => sum.id === Number(playerType)),
            };
        });
        res.status(200).send({ playerType, players });
    }
    if (playerId) {
        const player = { id: Number(playerId) };
        player.basic = (_b = data.bootstrap) === null || _b === void 0 ? void 0 : _b.elements.find((el) => el.id === Number(playerId));
        player.summary = (_c = data.summaries) === null || _c === void 0 ? void 0 : _c.find((sum) => sum.id === Number(playerId));
        if (player.id) {
            res.status(200).send({ playerType, player });
        }
    }
    const players = (_d = data.bootstrap) === null || _d === void 0 ? void 0 : _d.elements.map((el) => {
        var _a;
        return {
            id: el.id,
            basic: el,
            summary: (_a = data.summaries) === null || _a === void 0 ? void 0 : _a.find((sum) => sum.id === Number(playerType)),
        };
    });
    if (players === null || players === void 0 ? void 0 : players.length) {
        res.status(200).send({ playerType, players });
    }
    res.status(400).send("No data yet");
});
router.get("/", (req, res) => {
    if (data.bootstrap) {
        res.status(200).send(data.bootstrap);
    }
    res.status(400).send("No data yet");
});
router.get("/poll", (req, res) => {
    var _a;
    res.status(200).send({
        lastAttempt: data.updated,
        lastUpdate: data.succesfulUpdate,
        hasBootstrap: !!data.bootstrap,
        hasSummaries: !!((_a = data.summaries) === null || _a === void 0 ? void 0 : _a.length),
    });
});
app.use("/api", router); // path must route to lambda
app.listen(8080, () => {
    serverStarted = true;
    console.log("Listening on port 8080!");
});
//# sourceMappingURL=server.js.map