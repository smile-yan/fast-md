# fast-md Frontend

The frontend is a Vue 3 and TypeScript application powered by Vite and Milkdown.

## Important Directories

- `src/components`: Vue UI components.
- `src/composables`: shared state and browser-side integration helpers.
- `src/style.css`: base application and editor styling.
- `src/exportHtml.ts`: standalone HTML export document generation.
- `public/themes`: content theme styles and assets.
- `bindings`: Wails-generated TypeScript bindings.

## Commands

```bash
npm test
npm run build
npm run dev
```

The root `task dev` command is the normal way to run the full Wails app during development.
