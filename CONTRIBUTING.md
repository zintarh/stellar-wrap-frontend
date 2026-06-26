# Contributing

## Storybook

Components are documented and developed in isolation with [Storybook](https://storybook.js.org/) using the `@storybook/nextjs` framework. Tailwind CSS v4 and the app's global styles are loaded automatically.

### Running locally

```bash
npm run storybook        # dev server on http://localhost:6006
npm run build-storybook  # static build to ./storybook-static
```

The hosted catalog is published to GitHub Pages on every push to `main`, and `build-storybook` runs on every pull request as a CI gate.

### Adding a story

Co-locate stories with the component as `<Component>.stories.tsx`:

```tsx
import type { Meta, StoryObj } from "@storybook/nextjs";
import { DappCard } from "./DappCard";

const meta = {
  title: "Components/DappCard",
  component: DappCard,
  parameters: { layout: "centered" },
} satisfies Meta<typeof DappCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Dex: Story = {
  args: { rank: 1, name: "StellarX", interactions: 1284 },
};
```

### Components backed by Zustand stores

Components that read from a store (e.g. `wrapStore`, `transactionStore`, `rateLimitStore`) are driven in stories with the `withStore` decorator, which seeds store state before the story renders:

```tsx
import { useWrapStore } from "../store/wrapStore";
import { withStore } from "../../.storybook/withStore";

export const Mainnet: Story = {
  decorators: [withStore(useWrapStore, { network: NETWORKS.MAINNET })],
};
```

Stack multiple `withStore` decorators when a component reads from more than one store. Prefer driving components through props and store state over mocking modules.

### Next.js APIs

Stories run under the App Router context (`nextjs: { appDirectory: true }` in `.storybook/preview.tsx`), so components using `next/navigation`, `next/image`, and similar APIs work without extra setup.
