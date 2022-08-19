"use strict";
const express = require("express");
const serverless = require("serverless-http");
const app = express();
const { fetchBootstrap, fetchElementSummary } = require("fpl-api");

const data = {
  a: "a",
  b: "b",
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
  if (data.bootstrap) {
    if (data.bootstrap.elements) {
      const items = data.bootstrap.elements.slice(0, 50).map((el) => el.id);

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

router.get("/", (req, res) => {
  res.status(200).send(data);
});

app.use("/.netlify/functions/server", router); // path must route to lambda

module.exports = app;
module.exports.handler = serverless(app);
