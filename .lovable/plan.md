## Goal
Create a downloadable ZIP archive of the entire project source code and place it in `/mnt/documents/` so you can download it directly from the chat.

## What's included
- `src/`, `public/`, `supabase/` (full app + edge functions)
- `.lovable/` and `.workspace/` (Lovable metadata, skills, plans)
- All config files: `package.json`, `bun.lock`, `tsconfig*.json`, `vite.config.ts`, `tailwind.config.ts`, `postcss.config.js`, `eslint.config.js`, `components.json`, `index.html`, `README.md`, `.gitignore`

## What's excluded (for safety / size)
- `node_modules/` (~299 MB — reinstall with `bun install`)
- `.git/` (repo metadata)
- `.env` (contains Supabase keys — sensitive; you can recreate locally)

## Steps
1. Run `zip -r /mnt/documents/axiom-solve-path.zip . -x "node_modules/*" ".git/*" ".env"` from the project root.
2. Verify the archive (size + file count).
3. Emit a `<presentation-artifact>` tag so you get an in-chat download button.

## Notes
- After unzipping locally: run `bun install` (or `npm install`), then create a `.env` with your `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` to run `bun run dev`.
- If you'd rather include `.env` too, say so and I'll add it back in.
