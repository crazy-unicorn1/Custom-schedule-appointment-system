import { google } from "googleapis";
import oauth2Client from "../utils/googleAuth.js";
import dotenv from "dotenv";
import { calendarConfig, calendarMap } from "../../config/calendarConfig.js";

if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

let syncToken = null;
const calendarClient = google.calendar({ version: "v3", auth: oauth2Client });

// Function to start watch for all calendars from config
export const callWatchCalendar = async () => {
  try {
    for (const calendar of calendarConfig) {
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
    }
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
    console.log("Fetching event data...");

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
      console.log("pageToken", pageToken);
      if (pageToken) {
        requestParams.pageToken = pageToken;
      }

      const response = await calendarClient.events.list(requestParams);
      allEvents = allEvents.concat(response.data.items);

      pageToken = response.data.nextPageToken;
      if (!pageToken) {
        syncToken = response.data.nextSyncToken;
      }
    } while (pageToken);

    return allEvents;
  } catch (error) {
    if (error.code === 410) {
      console.warn("Sync token expired. Performing full sync...");
      syncToken = null;
      return await getUpdatedEventsByCalendarId(calendarId);
    } else {
      console.error("Error fetching changed event data:", error);
      throw error;
    }
  }
};

// Function to sync the event to other calendar
export const syncCreatedEventToOtherCalendars = async (
  eventData,
  name
) => {
  const targetCalendars = calendarMap[name];

  if (!targetCalendars || targetCalendars.length === 0) {
    console.log(`No calendars to sync for ${name}`);
    return;
  }

  for (const targetCalendarName of targetCalendars) {
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
  }
};

export const syncCancelledEventToOtherCalendars = async (eventId, name) => {
  const targetCalendars = calendarMap[name];

  if (!targetCalendars || targetCalendars.length === 0) {
    console.log(`No calendars to cancel for ${name}`);
    return;
  }

  for (const targetCalendarName of targetCalendars) {
    const targetCalendar = calendarConfig.find(
      (cal) => cal.name === targetCalendarName
    );

    if (targetCalendar) {
      const targetCalendarId = targetCalendar.calendarId;

      try {
        // Fetch events from the target calendar
        const response = await calendarClient.events.list({
          calendarId: targetCalendarId,
          q: eventId,  // Use search query to filter by eventId in description
          maxResults: 10,
          singleEvents: true,
        });

        // Filter for events that match the eventId in the description
        const eventToDelete = response.data.items.find(
          (event) => event.description === eventId
        );

        if (eventToDelete) {
          // Cancel the event by setting its status to "cancelled"
          calendarClient.events.delete({
            calendarId: targetCalendarId,
            eventId: eventToDelete.id
          });
          console.log(
            `Event with ID ${eventToDelete.id} deleted in ${targetCalendarName}'s calendar.`
          );
        } else {
          console.log(
            `Event with description ID ${eventId} not found in ${targetCalendarName}'s calendar.`
          );
        }
      } catch (error) {
        console.error(
          `Error cancelling event in ${targetCalendarName}'s calendar:`,
          error
        );
      }
    } else {
      console.log(`Calendar not found for target: ${targetCalendarName}`);
    }
  }
};


export const deleteAllEvents = async () => {
  try {
    console.log("Fetching all events to delete...");

    for (const calendar of calendarConfig) {
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
          for (const event of events) {
            calendarClient.events.delete({
              calendarId: calendarId,
              eventId: event.id,
            });
            console.log(
              `Deleted event: ${event.summary} from calendar: ${name}`
            );
          }
        }

        pageToken = response.data.nextPageToken;
      } while (pageToken);
    }

    console.log("All events deleted successfully from all calendars.");
  } catch (error) {
    console.error("Error deleting events:", error);
    throw error;
  }
};
