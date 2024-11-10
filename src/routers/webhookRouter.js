import express from "express";
import bodyParser from "body-parser";
import {
  getUpdatedEventsByCalendarId,
  syncEventToOtherCalendars,
} from "../services/calendarService.js";
import { calendarConfig } from "../../config/calendarConfig.js";

const webhookRouter = express.Router();
webhookRouter.use(bodyParser.json());

const processedMessages = {};

webhookRouter.post("/google-calendar", async (req, res) => {
  const changeType = req.headers["x-goog-resource-state"];
  const messageNumber = req.headers["x-goog-message-number"];
  const channelToken = req.headers["x-goog-channel-token"];

  if (!channelToken) {
    console.error("Channel token missing in request headers.");
    return res.status(400).send("Channel token is required.");
  }

  const calendar = calendarConfig.find(
    (cal) => cal.webhookToken === channelToken
  );
  if (!calendar) {
    console.error(`No calendar found for channelToken: ${channelToken}`);
    return res.status(400).send("Invalid webhook token.");
  }

  const { calendarId, name } = calendar;

  if (!processedMessages[name]) {
    processedMessages[name] = new Set();
  }

  if (processedMessages[name].has(messageNumber)) {
    console.log(
      `Duplicate message received for calendar ${name} (ID: ${calendarId}), messageNumber: ${messageNumber}`
    );
    return res.status(200).send("Duplicate event ignored");
  }

  processedMessages[name].add(messageNumber);

  try {
    if (changeType === "sync") {
      console.log(
        `The calendar webhook for ${name} has been successfully synced.`
      );
      return res
        .status(200)
        .send("The calendar webhook has been successfully synced.");
    }

    if (
      changeType === "exists" ||
      changeType === "updated" ||
      changeType === "created"
    ) {
      console.log(`Processing events for calendar: ${name}`);

      const eventsList = await getUpdatedEventsByCalendarId(calendarId);
      console.log(`Events fetched for ${name}:`, eventsList);

      // Loop through each event and sync to other calendars if needed
      for (const event of eventsList) {
        if (
          event.status === "confirmed" &&
          event.description !== "This time slot is occupied."
        ) {
          await syncEventToOtherCalendars(event, name, calendarId);
        }
      }

      res
        .status(200)
        .send(`Event processed successfully for calendar: ${name}`);
    } else {
      res.status(200).send("Event state not relevant, no action taken");
    }
  } catch (error) {
    console.error("Error processing calendar event:", error);
    res.status(500).send("Error processing event");
  }

  // Clean up processed messages periodically if needed to prevent memory leaks
  setTimeout(() => {
    processedMessages[name].delete(messageNumber);
  }, 5 * 60 * 1000);
});

export default webhookRouter;
