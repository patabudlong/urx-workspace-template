# sv

Everything you need to build a Svelte project, powered by [`sv`](https://github.com/sveltejs/cli).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```sh
# create a new project
npx sv create my-app
```

To recreate this project with the same configuration:

```sh
# recreate this project
npx sv@0.16.6 create --template minimal --types ts --install pnpm .
```

## Developing

Copy env and start MongoDB (Docker), then the dev server:

```sh
cp .env.example .env
pnpm docker:up    # start local MongoDB (database: urx-workspace)
pnpm dev

# or start the server and open the app in a new browser tab
pnpm dev --open
```

### Docker commands

```sh
pnpm docker:up          # start MongoDB
pnpm docker:down        # stop MongoDB (keep data)
pnpm docker:down:clean  # stop and wipe database volume
pnpm docker:logs        # tail MongoDB logs
pnpm docker:ps          # container status
```

API docs: [http://localhost:5173/docs](http://localhost:5173/docs) · Health: [http://localhost:5173/api/v1/health](http://localhost:5173/api/v1/health)

Once you've created a project and installed dependencies with `pnpm install`:

## Building

To create a production version of your app:

```sh
pnpm build
```

You can preview the production build with `pnpm preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.
