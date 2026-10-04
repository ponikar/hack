FROM mcr.microsoft.com/playwright:v1.63.0-noble
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.32.1 --activate
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml tsconfig.base.json ./
COPY packages ./packages
COPY apps/worker ./apps/worker
RUN pnpm install --frozen-lockfile --filter worker... --prod=false
# Real Chrome: bundled Chromium is refused by Akamai-style bot checks that let Chrome through.
RUN cd apps/worker && pnpm exec playwright install --with-deps chrome
ENV NODE_ENV=production
ENV SCREENSHOT_DIR=/app/screenshots
WORKDIR /app/apps/worker
CMD ["pnpm", "exec", "tsx", "src/index.ts"]
