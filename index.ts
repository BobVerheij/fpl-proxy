import { Bootstrap, ElementSummary, fetchElementSummary } from "fpl-api";

import express from "express";
import { fetchBootstrap } from "fpl-api";

import cron from "node-cron";

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

interface IFetchWithTimeout {
  url: string;
  id: number;
  options: RequestInit;
  timeout: number;
}

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
    const summaries: ElementSummary[] = [];

    const items = bootstrap?.elements.map((el) => el.id);

    for (let index = 0; index < items.length; index++) {
      await delay();
      try {
        const response = await fetchElementSummary(items[index]);

        if (response) {
          summaries.push(response);
        } else {
          console.log("fetch did not work");
        }
        // @ts-ignore
        // const response: AxiosResponse<ElementSummary, string> = await axios.get(
        //   `https://fantasy.premierleague.com/api/element-summary/${items[index]}`
        // );
        // // @ts-ignore
        // summaries.push(response.data);
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

cron.schedule("* * * * *", async () => {
  await updateData();
});

app.use((req: any, res: any, next: any) => {
  res.append("Access-Control-Allow-Origin", ["*"]);
  res.append("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
  res.append("Access-Control-Allow-Headers", "Content-Type");
  next();
});

app.get("/poll", async (req: any, res: any, next: any) => {
  res.send({
    summaryCount: data?.sumLength,
    dateChanged: data?.dateChanged,
  });
});

app.get("/", async (req: any, res: any, next: any) => {
  const { offset = 0, limit = 1000, noBootstrap = false } = req.query;
  console.log(
    data.summaries?.slice(Number(offset), Number(offset) + Number(limit))
  );
  res.send({
    ...data,
    bootstrap: noBootstrap === "true" ? undefined : data?.bootstrap,
    summaries: data.summaries?.slice(
      Number(offset),
      Number(offset) + Number(limit)
    ),
    offset,
    limit,
  });
});

// Start the Proxy
app.listen(PORT, HOST, () => {
  console.log(`Starting server at ${HOST}:${PORT}`);
});
