import { config, fields, collection } from "@keystatic/core";

export default config({
  storage: {
    kind: "github",
    repo: "game-writing/game-writing.com",
  },
  collections: {
    posts: collection({
      label: "Blog Posts",
      slugField: "slug",
      path: "src/data/blog/*",
      format: { contentField: "content" },
      schema: {
        // This field does DOUBLE DUTY:
        // - "name" subfield → frontmatter "slug:" (controls URL)
        // - "slug" subfield → filename (auto-generated)
        slug: fields.slug({
          name: {
            label: "URL Slug",
            description:
              "The URL path for this post. Use lowercase letters, numbers, and hyphens only (e.g., 'my-post-title'). This will also become the filename.",
            validation: { isRequired: true },
          },
          slug: {
            label: "Filename",
            description:
              "Auto-generated from URL Slug. Do not edit - changing this will rename the file.",
          },
        }),
        title: fields.text({
          label: "Title",
          description: "The display title shown on the page",
          validation: { isRequired: true },
        }),
        description: fields.text({
          label: "Description",
          description: "Brief summary for SEO and social sharing",
          multiline: true,
          validation: { isRequired: true },
        }),
        author: fields.text({
          label: "Author",
          defaultValue: "Committee",
        }),
        pubDatetime: fields.datetime({
          label: "Publish Date",
          validation: { isRequired: true },
        }),
        modDatetime: fields.datetime({
          label: "Modified Date",
          description: "Leave empty unless updating an existing post",
        }),
        featured: fields.checkbox({
          label: "Featured",
          description: "Show this post prominently on the homepage",
          defaultValue: false,
        }),
        draft: fields.checkbox({
          label: "Draft",
          description: "Draft posts are not published to production",
          defaultValue: true,
        }),
        tags: fields.array(fields.text({ label: "Tag" }), {
          label: "Tags",
          itemLabel: props => props.value || "New tag",
        }),
        ogImage: fields.image({
          label: "Cover Image (OG Image)",
          description: "Image for social sharing previews",
          directory: "src/assets/images/editor",
          publicPath: "@/assets/images/editor/",
        }),
        canonicalURL: fields.url({
          label: "Canonical URL",
          description:
            "Only set if this post was originally published elsewhere",
        }),
        content: fields.markdoc({
          label: "Content",
          extension: "md",
          options: {
            image: {
              directory: "src/assets/images/editor",
              publicPath: "@/assets/images/editor/",
            },
          },
        }),
      },
    }),
  },
});
