import { Bootstrap, ElementSummary, fetchElementSummary } from "fpl-api";

import express from "express";
import serverless from "serverless-http";
import { fetchBootstrap } from "fpl-api";

// Create Express Server
const app = express();
const router = express.Router();
// Configuration
const PORT = 8080;
const HOST = "localhost";

let data = {
  bootstrap: undefined,
  dateFetched: "",
  dateChanged: "",
  summaries: [],
  sumLength: 0,
};

const updateData = async () => {
  console.log("fetch data request");

  const dateFetched = new Date().toLocaleDateString("en-EN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  data = { ...data, dateFetched };

  const bootstrap = await fetchBootstrap();

  const start = new Date();
  const delay = (ms = 100) => new Promise((r) => setTimeout(r, ms));

  const fetchAll = async () => {
    const summaries = [];

    const items = bootstrap?.elements.map((el) => el.id);

    for (let index = 0; index < items.length; index++) {
      await delay();
      try {
        const response = await fetchElementSummary(items[index]);

        if (response) {
          console.log(response.id);
          summaries.push(response);
        } else {
          console.log("fetch did not work");
        }
      } catch (e) {
        console.error(e);
      }
    }

    return summaries;
  };

  const summaries = await fetchAll();
  const end = new Date();

  console.log(
    summaries?.length +
      " items fetched in " +
      (end.getTime() - start.getTime()) / 1000 +
      " seconds"
  );

  if (!summaries || !bootstrap) {
    data = { ...data, dateFetched };
    console.log("No summary or bootstrap");
    return;
  }

  const dateChanged = new Date().toLocaleDateString("en-EN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  data = {
    ...data,
    bootstrap,
    dateChanged,
    dateFetched,
    summaries,
    sumLength: summaries?.length,
  };
};

setTimeout(() => updateData(), 1000);
setInterval(() => updateData(), 300000);

app.use((req, res, next) => {
  res.append("Access-Control-Allow-Origin", ["*"]);
  res.append("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
  res.append("Access-Control-Allow-Headers", "Content-Type");
  next();
});

router.get("/poll", async (req, res, next) => {
  res.send({
    summaryCount: data?.sumLength,
    dateChanged: data?.dateChanged,
  });
});

router.get("/", async (req, res, next) => {
  const { offset = 0, limit = 1000, noBootstrap = false } = req.query;
  console.log(
    data.summaries?.slice(Number(offset), Number(offset) + Number(limit))
  );
  res.send({
    ...data,
    bootstrap: noBootstrap === "true" ? undefined : data?.bootstrap,
    summaries: data.sumLength
      ? data.summaries?.slice(Number(offset), Number(offset) + Number(limit))
      : undefined,
    offset,
    limit,
  });
});

app.use("/.netlify/functions/api", router);

module.exports = app;
module.exports.handler = serverless(app);
