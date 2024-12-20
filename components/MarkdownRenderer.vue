<script setup lang="ts">
/* eslint-disable vue/no-v-html */
import { computed } from "vue";
import MarkdownIt from "markdown-it";
import hljs from "highlight.js";
import 'highlight.js/styles/github-dark.css';
import { useTheme } from "@/composables/useTheme";

const { theme } = useTheme()

// Use DOMPurify only in the client environment
let DOMPurify: typeof import('dompurify');

if (import.meta.client) {
  DOMPurify = (await import('dompurify')).default;
}

const props = defineProps({
  text: {
    type: String,
    required: true,
  },
});

const md = new MarkdownIt({
  highlight: (str, lang) => {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return `<pre class="hljs p-4 text-xs"><code>${hljs.highlight(lang, str, true).value}</code></pre>`;
      } catch {
        console.warn("Failed to highlight code block");
      }
    }
    return ""; 
  },
});

// Configure renderer to add target="_blank" and rel="noopener noreferrer" to all links
md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
  const token = tokens[idx];
  // Add target="_blank" and security attributes to link tokens
  token.attrPush(['target', '_blank']);
  token.attrPush(['rel', 'noopener noreferrer']);
  return self.renderToken(tokens, idx, options);
};

const renderedMarkdown = computed(() => {
  const rawHTML = md.render(props.text);

  if (import.meta.client && DOMPurify) {
    // Configure DOMPurify to allow target="_blank" attribute
    const config = {
      ADD_ATTR: ['target', 'rel']
    };
    return DOMPurify.sanitize(rawHTML, config);
  }
  return rawHTML; // Return the raw HTML if on the server
});
</script>

<template>
  <div :class="['markdown-body', theme]" v-html="renderedMarkdown" />
</template>

<style lang="scss">
.markdown-body {
  padding-left: 20px;
  padding-top: 1px;
  overflow-x: auto;
  padding-bottom: 0.25rem !important;

  .dark {
    background-color: transparent;
  }

  pre,
  code {
    border-radius: 5px;
    overflow-x: auto;
    padding-bottom: 0.25rem !important;
  }

  img {
    max-width: 100%;
    max-height: 500px;
    height: auto;
    width: auto; 
    object-fit: contain;
  }

  a {
    color: #3182ce !important;
  }

  blockquote {
    border-left: 4px solid #3182ce;
    padding-left: 16px;
    margin: 16px 0;
    font-style: italic;
    color: #555;

    .dark & {
      border-left-color: #63b3ed;
      color: #ccc;
    }
  }
}
</style>