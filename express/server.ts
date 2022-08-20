import express from "express";
import cors from "cors";

import {
  Bootstrap,
  Element,
  ElementSummary,
  fetchBootstrap,
  fetchElementSummary,
} from "fpl-api";

const app = express();
app.use(cors());

let serverStarted = false;

interface IData {
  updated?: string;
  bootstrap?: Bootstrap;
  players?: Player[];
  succesfulUpdate?: string;
}

interface Player {
  id?: number;
  basic?: Element;
  summary?: ElementSummary;
}

const data: IData = {
  updated: "",
  bootstrap: undefined,
  players: [],
  succesfulUpdate: "",
};

const delay = (ms = 100) => new Promise((r) => setTimeout(r, ms));

const updateData = async () => {
  data.updated =
    new Date().toLocaleDateString("en-EN") +
    " " +
    new Date().toLocaleTimeString("en-EN");

  const bootstrap = await fetchBootstrap();
  if (bootstrap) {
    data.bootstrap = bootstrap;
  }

  const players: Player[] = [];
  if (data?.bootstrap?.elements) {
    const items = data.bootstrap.elements.map((el) => el.id);

    for (let i = 0; i < items.length; i++) {
      await delay();
      try {
        const summary = await fetchElementSummary(items[i]);
        console.log(items[i]);
        if (summary) {
          players.push({
            id: summary.id,
            basic: data?.bootstrap?.elements?.find(
              (el) => el.id === summary.id
            ),
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
};

setInterval(async () => {
  await updateData();
}, 300000);

setTimeout(async () => {
  await updateData();
}, 100);

const router = express.Router();

router.get("/players", (req, res) => {
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
    const player: Player = data?.players.find(
      (player) => player.id === Number(playerId)
    );

    if (player) {
      res.status(200).send(player);
    }
  }

  if (data?.players?.length) {
    res
      .status(200)
      .send(
        data?.players.slice(Number(offset), Number(limit) + Number(offset))
      );
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
  res.status(200).send({
    lastAttempt: data.updated,
    lastUpdate: data.succesfulUpdate,
    hasBootstrap: !!data.bootstrap,
    n_players: !!data.players?.length,
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
