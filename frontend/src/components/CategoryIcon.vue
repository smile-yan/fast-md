<template>
  <svg
    class="category-icon"
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    stroke-width="1.5"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <template v-if="name === 'gear'">
      <circle cx="8" cy="8" r="2" />
      <path d="M8 1.5v2.5M8 12v2.5M1.5 8h2.5M12 8h2.5M3.4 3.4l1.8 1.8M10.8 10.8l1.8 1.8M3.4 12.6l1.8-1.8M10.8 5.2l1.8-1.8" />
    </template>
    <template v-else-if="name === 'pen'">
      <path d="M11 2.5l2.5 2.5-8 8-3 .5.5-3 8-8z" />
      <path d="M9.5 4l2.5 2.5" />
    </template>
    <template v-else-if="name === 'image'">
      <rect x="1.5" y="2.5" width="13" height="11" rx="1.5" />
      <circle cx="6" cy="7" r="1" />
      <path d="M2 11.5l3-3 3 3 2-2 4 4" />
    </template>
    <template v-else-if="name === 'palette'">
      <path d="M8 1.5a6.5 6.5 0 00-1.4 12.8c.8.2 1.4-.5 1.2-1.3l-.2-1c-.1-.5.3-1 .8-1h1.4c1.4 0 2.6-1 2.8-2.4.4-2.7-1.7-7.1-4.6-7.1z" />
      <circle cx="5" cy="6.5" r="0.6" fill="currentColor" />
      <circle cx="7" cy="4" r="0.6" fill="currentColor" />
      <circle cx="10.5" cy="5.5" r="0.6" fill="currentColor" />
    </template>
  </svg>
</template>

<script setup lang="ts">
// Single source of truth for the four settings sidebar icons. Replaces
// the previous fa-solid fa-* Font Awesome classes (loaded from a remote
// CDN, which caused a flash of missing icons on first open while the
// font files were fetched). Inline SVG ships with the bundle, has no
// network dependency, and inherits currentColor for theme support.
defineProps<{ name: string }>()
</script>
