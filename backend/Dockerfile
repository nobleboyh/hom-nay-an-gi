FROM node:22-alpine AS build

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./
COPY tsconfig.json ./
COPY apps ./apps
COPY packages ./packages
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

FROM node:22-alpine AS runtime

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV NODE_ENV=production
ENV PORT=3000

RUN corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./
COPY tsconfig.json ./
COPY apps ./apps
COPY packages ./packages
RUN pnpm install --prod --frozen-lockfile

COPY --from=build /app/apps ./apps
COPY --from=build /app/packages ./packages
COPY --from=build /app/.env.template ./.env.template

EXPOSE 3000
EXPOSE 3001

CMD ["pnpm", "start:prod"]
