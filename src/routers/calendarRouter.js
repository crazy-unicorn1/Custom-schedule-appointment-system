import express from "express";
import {
  callWatchCalendar,
  getCalendarList,
  deleteAllEvents,
} from "../services/calendarService.js"; // Import the service functions

const calendarRouter = express.Router();

/**
 * Route to fetch the calendar list
 */
calendarRouter.get("/calendar-list", async (req, res) => {
  try {
    const calendars = await getCalendarList();
    res.status(200).json(calendars);
  } catch (error) {
    console.error("Error fetching calendar list:", error);
    res.status(500).send("Error fetching calendar list.");
  }
});

/**
 * Route to initiate the watch on the calendar
 */
calendarRouter.get("/watch-calendar", async (req, res) => {
  try {
    await callWatchCalendar(); // Pass the token dynamically
    res.status(200).send("Started watching the calendar.");
  } catch (error) {
    res.status(500).send("Error watching the calendar.");
  }
});

/**
 * Route to delete all events of all calendars
 */
calendarRouter.get("/clear-events", async (req, res) => {
  try {
    await deleteAllEvents(); // Pass the token dynamically
    res.status(200).send("All events cleared successfully.");
  } catch (error) {
    res.status(500).send("Error clearing events.");
  }
});

export default calendarRouter;
