import { Bootstrap, ElementSummary } from "fpl-api";

import express from "express";
import { fetchBootstrap, fetchElementSummary } from "fpl-api";

// Create Express Server
const app = express();

// Configuration
const PORT = 8080;
const HOST = "localhost";

interface iData {
  bootstrap?: Bootstrap;
  dateFetched?: string;
  dateChanged?: string;
  summaries?: ElementSummary[];
  sumLength?: number;
}

let data: iData = {
  bootstrap: undefined,
  dateFetched: "",
  dateChanged: "",
  summaries: [],
  sumLength: 0,
};

const fetchAllElementSummaries = async (bootstrap: Bootstrap) => {
  const summaries: ElementSummary[] = [];

  bootstrap?.elements.forEach(async (el) => {
    let summary: ElementSummary | undefined = undefined;

    try {
      summary = await fetchElementSummary(el.id);
      if (summary) summaries.push(summary);
    } catch (e) {
      console.error(e);
    }
  });
  return summaries;
};

const updateData = async () => {
  const dateFetched = new Date().toLocaleDateString("en-EN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const bootstrap = await fetchBootstrap();
  const summaries = await fetchAllElementSummaries(bootstrap);

  if (!summaries || !bootstrap) {
    data = { ...data, dateFetched };
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
    sumLength: summaries.length,
  };
};

setTimeout(async () => {
  await updateData();
}, 100);

setInterval(async () => {
  await updateData();
}, 60000);

app.use((req: any, res: any, next: any) => {
  res.append("Access-Control-Allow-Origin", ["*"]);
  res.append("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
  res.append("Access-Control-Allow-Headers", "Content-Type");
  next();
});

app.get("/bootstrap", (req: any, res: any, next: any) => {
  res.send(data);
});

// Start the Proxy
app.listen(PORT, HOST, () => {
  console.log(`Starting server at ${HOST}:${PORT}`);
});
