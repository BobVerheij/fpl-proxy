import express, { Router } from "express";
import { fetchBootstrap, fetchElementSummary } from "fpl-api";

const app = express();

const data = {
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

  const summaries = [];
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

const router = Router();

router.get("/", (req, res) => {
  res.status(200).send(data);
});

app.use("/app", router); // path must route to lambda

export default app;
