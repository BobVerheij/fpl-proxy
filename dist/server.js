"use strict";
var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done
          ? resolve(result.value)
          : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const fpl_api_1 = require("fpl-api");
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
let serverStarted = false;
const data = {
  updated: "",
  bootstrap: undefined,
  players: [],
  succesfulUpdate: "",
};
const delay = (ms = 100) => new Promise((r) => setTimeout(r, ms));
const updateData = () =>
  __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    data.updated =
      new Date().toLocaleDateString("en-EN") +
      " " +
      new Date().toLocaleTimeString("en-EN");
    const bootstrap = yield (0, fpl_api_1.fetchBootstrap)();
    if (bootstrap) {
      data.bootstrap = bootstrap;
    }
    const players = [];
    if (
      (_a = data === null || data === void 0 ? void 0 : data.bootstrap) ===
        null || _a === void 0
        ? void 0
        : _a.elements
    ) {
      const items = data.bootstrap.elements.map((el) => el.id);
      for (let i = 0; i < items.length; i++) {
        yield delay();
        try {
          const summary = yield (0, fpl_api_1.fetchElementSummary)(items[i]);
          console.log(items[i]);
          if (summary) {
            players.push({
              id: summary.id,
              basic:
                (_c =
                  (_b =
                    data === null || data === void 0
                      ? void 0
                      : data.bootstrap) === null || _b === void 0
                    ? void 0
                    : _b.elements) === null || _c === void 0
                  ? void 0
                  : _c.find((el) => el.id === summary.id),
              summary,
            });
          }
        } catch (e) {
          console.error;
        }
      }
    }
    if (players.length) {
      data.players = players;
    }
    if (bootstrap && players.length) {
      data.succesfulUpdate =
        new Date().toLocaleDateString("en-EN") +
        " " +
        new Date().toLocaleTimeString("en-EN");
    }
  });
setInterval(
  () =>
    __awaiter(void 0, void 0, void 0, function* () {
      yield updateData();
    }),
  300000
);
setTimeout(
  () =>
    __awaiter(void 0, void 0, void 0, function* () {
      yield updateData();
    }),
  100
);
const router = express_1.default.Router();
router.get("/players", (req, res) => {
  var _a;
  const {
    playerType = undefined,
    playerId = undefined,
    offset = 0,
    limit = 10000,
  } = req.query;
  if (playerType) {
    const players = data.players.filter(
      (player) => player.basic.element_type === Number(playerType)
    );
    res.status(200).send({
      playerType,
      players: players.slice(Number(offset), Number(limit) + Number(offset)),
    });
  }
  if (playerId) {
    const player =
      data === null || data === void 0
        ? void 0
        : data.players.find((player) => player.id === Number(playerId));
    if (player) {
      res.status(200).send(player);
    }
  }
  if (
    (_a = data === null || data === void 0 ? void 0 : data.players) === null ||
    _a === void 0
      ? void 0
      : _a.length
  ) {
    res
      .status(200)
      .send(
        data === null || data === void 0
          ? void 0
          : data.players.slice(Number(offset), Number(limit) + Number(offset))
      );
  }
  res.status(400).send("No data yet");
});
router.get("/", (req, res) => {
  if (data.bootstrap) {
    res.status(200).json(data.bootstrap);
    res.end();
  }
  res.status(400).json("No data yet");
  res.end();
});
router.get("/poll", (req, res) => {
  var _a;
  res.status(200).send({
    lastAttempt: data.updated,
    lastUpdate: data.succesfulUpdate,
    hasBootstrap: !!data.bootstrap,
    n_players: !!((_a = data.players) === null || _a === void 0
      ? void 0
      : _a.length),
    n_goalies: data.players.filter((player) => player.basic.element_type === 1)
      .length,
    n_defenders: data.players.filter(
      (player) => player.basic.element_type === 2
    ).length,
    n_midfielders: data.players.filter(
      (player) => player.basic.element_type === 3
    ).length,
    n_forwards: data.players.filter((player) => player.basic.element_type === 4)
      .length,
  });
});
app.use("/api", router); // path must route to lambda
app.listen(8080, () => {
  serverStarted = true;
  console.log("Listening on port 8080!");
});
//# sourceMappingURL=server.js.map
