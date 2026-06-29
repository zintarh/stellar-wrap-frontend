import type { Preview } from "@storybook/nextjs";
import React from "react";
import "../app/globals.css";

const preview: Preview = {
  parameters: {
    layout: "fullscreen",
    nextjs: { appDirectory: true },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: { test: "todo" },
  },
  decorators: [
    (Story) => (
      <div
        style={{
          minHeight: "100vh",
          background: "#000000",
          color: "#ededed",
          padding: "2rem",
        }}
      >
        <Story />
      </div>
    ),
  ],
};

export default preview;
