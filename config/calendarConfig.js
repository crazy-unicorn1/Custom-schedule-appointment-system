export const calendarConfig = [
  {
    name: "person1",
    calendarId:
      "c_940e1c1bf1ed234fdbb86bc8df5571f0be6c9fb10dfa4da76ac32b5382fe2e22@group.calendar.google.com",
    webhookToken: "person1_webhook_token",
  },
  {
    name: "person2",
    calendarId:
      "c_3b074ac389bfb4375d64d60f788a0d24d776eaba9494cffac275d472784fc835@group.calendar.google.com",
    webhookToken: "person2_webhook_token",
  },
  {
    name: "person3",
    calendarId:
      "c_10cea95039efd8b8a477cd7386a357dd7a4257d5cf2b22de818a2de1d54b4165@group.calendar.google.com",
    webhookToken: "person3_webhook_token",
  },
  {
    name: "person4",
    calendarId:
      "c_339eca33b778cea899d9127c2f2c7c1918335245bb9dfc9ab409db2336498a08@group.calendar.google.com",
    webhookToken: "person4_webhook_token",
  },
  {
    name: "team1",
    calendarId:
      "c_24a217204475b94525d8f9c04e043254f33d89d26e648ae05c8a93ff2fbe9351@group.calendar.google.com",
    webhookToken: "team1_webhook_token",
  },
  {
    name: "team2",
    calendarId:
      "c_d91c6a00c71ab9780ea3e006064618c8577c5cf33fd96da7fd74ad1a20138d37@group.calendar.google.com",
    webhookToken: "team2_webhook_token",
  },
  {
    name: "both_teams",
    calendarId:
      "c_9410760e8a3a073b3faed27e8833e94bb1b41e7112685103cf07bc792bccae05@group.calendar.google.com",
    webhookToken: "both_teams_webhook_token",
  },
];

export const calendarMap = {
  person1: ["team1", "both_teams"],
  person2: ["team1", "both_teams"],
  person3: ["team2", "both_teams"],
  person4: ["team2", "both_teams"],
  team1: ["person1", "person2", "both_teams"],
  team2: ["person3", "person4", "both_teams"],
  both_teams: ["person1", "person2", "person3", "person4", "team1", "team2"],
};
