import express = require("express");

import {
  Bootstrap,
  Element,
  ElementSummary,
  fetchBootstrap,
  fetchElementSummary,
} from "fpl-api";

const app = express();

let serverStarted = false;

interface IData {
  updated?: string;
  bootstrap?: Bootstrap;
  summaries?: ElementSummary[];
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
  summaries: [],
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

  const summaries: ElementSummary[] = [];
  if (data?.bootstrap?.elements) {
    const items = data.bootstrap.elements.map((el) => el.id);

    for (let i = 0; i < items.length; i++) {
      await delay();
      try {
        const summary = await fetchElementSummary(items[i]);
        console.log(items[i]);
        if (summary) {
          summaries.push(summary);
        }
      } catch (e) {
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
};

setInterval(async () => {
  await updateData();
}, 300000);

setTimeout(async () => {
  await updateData();
}, 100);

const router = express.Router();

router.get("/players", (req, res) => {
  const { playerType = undefined, playerId = undefined } = req.query;

  if (playerType) {
    const players = data.bootstrap?.elements
      .filter((el) => el.element_type === Number(playerType))
      .map((el) => {
        return {
          id: el.id,
          basic: el,
          summary: data.summaries?.find((sum) => sum.id === Number(playerType)),
        };
      });
    res.status(200).send({ playerType, players });
  }

  if (playerId) {
    const player: Player = { id: Number(playerId) };

    player.basic = data.bootstrap?.elements.find(
      (el) => el.id === Number(playerId)
    );

    player.summary = data.summaries?.find((sum) => sum.id === Number(playerId));

    if (player.id) {
      res.status(200).send({ playerType, player });
    }
  }

  const players = data.bootstrap?.elements.map((el) => {
    return {
      id: el.id,
      basic: el,
      summary: data.summaries?.find((sum) => sum.id === Number(playerType)),
    };
  });

  if (players?.length) {
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
  res.status(200).send({
    lastAttempt: data.updated,
    lastUpdate: data.succesfulUpdate,
    hasBootstrap: !!data.bootstrap,
    hasSummaries: !!data.summaries?.length,
  });
});

app.use("/api", router); // path must route to lambda

app.listen(8080, () => {
  serverStarted = true;
  console.log("Listening on port 8080!");
});

export default app;
