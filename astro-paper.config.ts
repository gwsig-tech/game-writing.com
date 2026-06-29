import { defineAstroPaperConfig } from "./src/types/config";

export default defineAstroPaperConfig({
  site: {
    url: "https://www.game-writing.com/",
    title: "IGDA Game Writing SIG",
    description: "The official site of the Game Writing SIG.",
    author: "Jon Myers",
    profile: "https://jonathonmyers.com/",
    ogImage: "game-writing-og.jpg",
    lang: "en",
    timezone: "America/New_York",
    dir: "ltr",
  },
  posts: {
    perPage: 20,
    perIndex: 6,
    scheduledPostMargin: 15 * 60 * 1000, // 15 minutes
  },
  features: {
    lightAndDarkMode: true,
    dynamicOgImage: false,
    showArchives: true,
    showBackButton: true,
    editPost: { enabled: false },
    search: "pagefind",
  },
  socials: [
    { name: "discord", url: "https://discord.gg/2uWGBsUgxT" },
    { name: "facebook", url: "https://www.facebook.com/groups/gamewriting" },
    {
      name: "linkedin",
      url: "https://www.linkedin.com/company/gwsig/",
      linkTitle: "IGDA Game Writing SIG on LinkedIn",
    },
    { name: "bluesky", url: "https://bsky.app/profile/game-writing.com" },
    { name: "x", url: "https://x.com/IGDAWritingSIG" },
    { name: "mail", url: "mailto:info@game-writing.com" },
    {
      name: "rss",
      url: "/rss.xml",
      linkTitle: "RSS Feed for IGDA Game Writing SIG",
    },
  ],
  shareLinks: [
    { name: "whatsapp", url: "https://wa.me/?text=" },
    { name: "facebook", url: "https://www.facebook.com/sharer.php?u=" },
    { name: "x", url: "https://x.com/intent/post?url=" },
    { name: "telegram", url: "https://t.me/share/url?url=" },
    { name: "pinterest", url: "https://pinterest.com/pin/create/button/?url=" },
    { name: "mail", url: "mailto:?subject=See%20this%20post&body=" },
  ],
});
