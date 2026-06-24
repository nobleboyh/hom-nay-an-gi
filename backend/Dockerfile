FROM node:22-alpine

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV PORT=3000

RUN corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./
COPY tsconfig.json ./
COPY apps ./apps
COPY packages ./packages
COPY src ./src
RUN pnpm install --frozen-lockfile
RUN pnpm build

ENV NODE_ENV=production

EXPOSE 3000
EXPOSE 3001

CMD ["pnpm", "start:prod"]
