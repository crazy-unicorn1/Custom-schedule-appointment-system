import { google } from "googleapis";
import oauth2Client from "../utils/googleAuth.js";
import dotenv from "dotenv";
import { calendarConfig, calendarMap } from "../../config/calendarConfig.js";
import { getSyncToken, saveSyncToken  } from "./syncTokenService.js";

if (process.env.NODE_ENV !== "production") {
  dotenv.config();
}

const calendarClient = google.calendar({ version: "v3", auth: oauth2Client });

// Function to start watch for all calendars from config
export const callWatchCalendar = async () => {
  try {
    const watchPromises = calendarConfig.map(async (calendar) => {
      const { calendarId, webhookToken, name } = calendar;
      const channelId = `channel-${Date.now()}`;

      const response = await calendarClient.events.watch({
        calendarId: calendarId,
        requestBody: {
          id: channelId,
          type: "web_hook",
          address: process.env.WEBHOOK_URL,
          token: webhookToken,
        },
      });

      console.log(`Started watching calendar: ${name}`);
      // console.log("Response data:", response.data);
    });

    await Promise.all(watchPromises);
  } catch (error) {
    console.error("Error setting up watch:", error);
    throw error;
  }
};

// Fetch the list of calendars
export const getCalendarList = async () => {
  try {
    const response = await calendarClient.calendarList.list();
    return response.data.items;
  } catch (error) {
    console.error("Error fetching calendar list:", error);
    throw error;
  }
};

export const getUpdatedEventsByCalendarId = async (calendarId) => {
  try {
    // console.log("Fetching event data...");

    let syncToken = await getSyncToken();
    const requestParams = {
      calendarId: calendarId,
      maxResults: 10,
      singleEvents: true,
    };

    if (syncToken) {
      requestParams.syncToken = syncToken;
    }

    let allEvents = [];
    let pageToken = null;

    do {
      // console.log("pageToken", pageToken);
      if (pageToken) {
        requestParams.pageToken = pageToken;
      }

      const response = await calendarClient.events.list(requestParams);
      allEvents = allEvents.concat(response.data.items);

      pageToken = response.data.nextPageToken;
      if (!pageToken) {
        const newSyncToken = response.data.nextSyncToken;
        await saveSyncToken(newSyncToken);
      }
    } while (pageToken);

    return allEvents;
  } catch (error) {
    if (error.code === 410) {
      console.warn("Sync token expired. Performing full sync...");
      await saveSyncToken(null);
      return await getUpdatedEventsByCalendarId(calendarId);
    } else {
      console.error("Error fetching changed event data:", error);
      throw error;
    }
  }
};

// Function to sync the event to other calendar
export const syncCreatedEventToOtherCalendars = async (eventData, name) => {
  const targetCalendars = calendarMap[name];

  if (!targetCalendars || targetCalendars.length === 0) {
    console.log(`No calendars to sync for ${name}`);
    return;
  }

  const syncPromises = targetCalendars.map(async (targetCalendarName) => {
    const targetCalendar = calendarConfig.find(
      (cal) => cal.name === targetCalendarName
    );
    if (targetCalendar) {
      const targetCalendarId = targetCalendar.calendarId;

      try {
        await calendarClient.events.insert({
          calendarId: targetCalendarId,
          requestBody: {
            summary: `Reserved by ${name}`,
            description: eventData.id,
            start: eventData.start,
            end: eventData.end,
          },
        });

        console.log(
          `Event synced to ${targetCalendarName}'s calendar: ${eventData.summary}`
        );
      } catch (error) {
        console.error(
          `Error syncing event to ${targetCalendarName}'s calendar:`,
          error
        );
      }
    } else {
      console.log(`Calendar not found for target: ${targetCalendarName}`);
    }
  });

  await Promise.all(syncPromises);
};

export const syncCancelledEventToOtherCalendars = async (eventId, name) => {
  const targetCalendars = calendarMap[name];

  if (!targetCalendars || targetCalendars.length === 0) {
    console.log(`No calendars to cancel for ${name}`);
    return;
  }

  const cancelPromises = targetCalendars.map(async (targetCalendarName) => {
    const targetCalendar = calendarConfig.find(
      (cal) => cal.name === targetCalendarName
    );

    if (targetCalendar) {
      const targetCalendarId = targetCalendar.calendarId;

      try {
        // Fetch events from the target calendar
        const response = await calendarClient.events.list({
          calendarId: targetCalendarId,
          q: eventId, // Use search query to filter by eventId in description
          maxResults: 10,
          singleEvents: true,
        });

        // Filter for all events that match the eventId in the description
        const eventsToDelete = response.data.items.filter(
          (event) => event.description === eventId
        );

        if (eventsToDelete.length > 0) {
          // Delete each matching event
          for (const event of eventsToDelete) {
            calendarClient.events.delete({
              calendarId: targetCalendarId,
              eventId: event.id,
            });
            console.log(
              `Deleted event with ID ${event.id} from ${targetCalendarName}'s calendar.`
            );
          }
        } else {
          console.log(
            `No events with description ID ${eventId} found in ${targetCalendarName}'s calendar.`
          );
        }
      } catch (error) {
        console.error(
          `Error cancelling events in ${targetCalendarName}'s calendar:`,
          error
        );
      }
    } else {
      console.log(`Calendar not found for target: ${targetCalendarName}`);
    }
  });

  await Promise.all(cancelPromises);
};

export const deleteAllEvents = async () => {
  try {
    console.log("Fetching all events to delete...");

    const deletePromises = calendarConfig.map(async (calendar) => {
      const { calendarId, name } = calendar;
      console.log(`Deleting events from calendar: ${name}`);

      const requestParams = {
        calendarId: calendarId,
        maxResults: 2500,
        singleEvents: true,
      };

      let pageToken = null;

      do {
        if (pageToken) {
          requestParams.pageToken = pageToken;
        }

        const response = await calendarClient.events.list(requestParams);
        const events = response.data.items;

        if (events.length > 0) {
          const deleteEventPromises = events.map(async (event) => {
            calendarClient.events.delete({
              calendarId: calendarId,
              eventId: event.id,
            });
            console.log(
              `Deleted event: ${event.summary} from calendar: ${name}`
            );
          });

          await Promise.all(deleteEventPromises);
        }

        pageToken = response.data.nextPageToken;
      } while (pageToken);
    });

    await Promise.all(deletePromises);

    console.log("All events deleted successfully from all calendars.");
  } catch (error) {
    console.error("Error deleting events:", error);
    throw error;
  }
};
 