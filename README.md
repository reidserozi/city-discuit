# Edit Raleigh

Edit Raleigh is an independent, volunteer-run civic platform for Raleigh, North
Carolina — a place for residents to research, propose, and sharpen civic ideas
(zoning cases, budget lines, transit, parks, and anything else headed for a
vote, hearing, permit, or plan), organized by topic and grounded in real
locations.

It's built on [Discuit](https://discuit.org), an open-source community
platform (an alternative to Reddit), and remains free and open-source itself.
See the site's `/about` page for the full story of why this exists.

Built with:

- [Go](https://go.dev): The backend.
- [React](https://react.dev/): The frontend.
- [MariaDB](https://en.wikipedia.org/wiki/MariaDB): The main datastore.
- [Redis](https://redis.io/): For transient data.
- [Stytch](https://stytch.com) (optional): Email verification and passwordless auth.

## What's different from upstream Discuit

Since forking, Edit Raleigh has added a civic-platform layer on top of
Discuit's core forum functionality:

- **Neighborhoods**: users join via an invite code from an existing member and
  are associated with a neighborhood, which travels with their profile
  (`core/neighborhood.go`, `server/neighborhood.go`).
- **Geo-tagged posts and a map view**: posts can be pinned to a real
  latitude/longitude and location name, and viewed on an aggregate map
  (`ui/src/pages/Map.tsx`, `ui/src/components/MapDisplay.tsx`,
  `ui/src/components/MapPicker.tsx`).
- **Site hours**: the site closes overnight (10 PM–6 AM) and all day Sunday,
  showing a "site closed" page with a weekend digest of open proposals near
  you instead (`ui/src/siteHours.ts`, `ui/src/pages/SiteClosed.tsx`).
- **Email required and verified**: an email address is required at signup,
  and it must be verified (via Stytch magic links) before a user can post
  or comment in any community (`core/user.go` `RegisterUser`,
  `server/email_verification.go`, checks in `server/post.go` and
  `server/comment.go`).
- **Rewritten legal & community pages**: About, Terms of Use, Privacy Policy,
  and Guidelines were rewritten from scratch to reflect Edit Raleigh's civic
  mission, North Carolina governing law, and CC-BY-licensed contributions
  (`ui/src/pages/About.tsx`, `Terms.tsx`, `PrivacyPolicy.tsx`,
  `Guidelines.tsx`) — partly inspired by [LocalWiki](https://localwiki.org)'s
  own community documents.
- **Redesigned UI**: a site-wide footer with dynamic community listings, and
  a normalized design system (spacing, typography, color tokens) across the
  site — see [Design system](#design-system) below.
- **Contact via X/Twitter**: rather than a public email address, contact
  routes through direct messages on X ([@RaleighWiki](https://x.com/RaleighWiki)).

## Getting started

### Running locally

To setup a development environment of Edit Raleigh on your local computer:

1.  Install Go (1.21 or higher) by following the instructions at
    [go.dev.](https://go.dev/doc/install)
1.  Install MariaDB (11.3 or higher), Redis, Node.js (and NPM). On Ubuntu, for
    instance, you might have to run the following commands:

    ```shell
    sudo apt update

    # Install and start MariaDB
    sudo apt install mariadb-server
    sudo systemctl start mariadb.service

    # Install and start Redis
    sudo apt install redis-server
    sudo systemctl start redis.service

    # Install Node.js and NPM
    sudo apt install nodejs npm
    ```

1.  Create a MariaDB database.

    ```shell
    # Open MariaDB CLI
    mariadb -u root -p --binary-as-hex

    # Create a database named discuit (you may use a different name)
    create database discuit;

    # Enter exit (or press Ctrl+D) to exit
    exit;
    ```

1.  Edit Raleigh uses `libvips` for fast image transformations. Make sure it's
    installed on your computer. On Ubuntu you can install it with:
    `sudo apt install libvips-dev`.
1.  Clone this repository:

    ```shell
    git clone https://github.com/reidserozi/city-discuit.git && cd city-discuit
    ```

1.  Create a file named `config.yaml` in the root directory and copy the contents
    of `config.default.yaml` into it. And enter the required config parameters in
    `config.yaml`. Stytch (`stytchProjectID`/`stytchSecret`/`stytchEnvironment`)
    and SMTP (`smtpHost` and friends) are both optional — without Stytch
    configured, email verification is disabled and the requirement to post/
    comment is inert.
1.  Build the frontend and the backend:

    ```shell
    ./build.sh
    ```

1.  Run migrations:

    ```shell
    ./discuit migrate run
    ```

1.  Start the server:

    ```shell
    ./discuit serve
    ```

After creating an account, you can run `./discuit admin make username` to make
a user an admin of the site.

Note: Do not install the discuit binary using `go install` or move it somewhere else. It uses files in this repository at runtime and so it should only be run from the root of this repository.

### Running with Docker

The included `docker-compose.yml` builds and runs the full stack (app,
MariaDB, Redis) in one container:

```shell
docker-compose build
docker-compose up -d
```

This builds the `edit-raleigh:latest` image (see `docker/Dockerfile.arm64` and
`docker/Dockerfile.amd64`) and serves the site on `http://localhost:8080`.
Database, Redis, and uploaded images persist in the `discuit-db`,
`discuit-redis`, and `discuit-images` Docker volumes.

To rebuild after making changes:

```shell
docker-compose build && docker-compose up -d
```

To stop:

```shell
docker-compose down
```

### Running with Nix Flakes

If you use [Nix](https://nixos.org/) or [NixOS](https://nixos.org/), you can get a fully reproducible dev environment with all dependencies using the included flake:

```sh
nix develop
```

This will:

- Install all required packages.
- Start local MariaDB and Redis servers (with logs in `.mysql/` and `.redis/` respectively).
- Create the `discuit` database and user automatically.

When you exit the shell, MariaDB and Redis will automatically stop.

> [!IMPORTANT]
> You'll need [Nix flakes enabled](https://nixos.wiki/wiki/Flakes) and a recent version of Nix to use this.

### Source code layout

In the root directory are these directories:

- `cli`: Contains the command-line interface.
- `core`: Contains all the core functionality of the backend, including
  Edit Raleigh additions like `neighborhood.go`.
- `internal`: Contains Go packages internal to the project, including
  `internal/email` (SMTP) and Stytch integration.
- `migrations`: Contains the SQL migration files.
- `server`: Contains the REST API backend.
- `ui` - Contains the React frontend, including Edit Raleigh-specific pages
  like `ui/src/pages/Map.tsx` and `ui/src/pages/SiteClosed.tsx`.

## Design system

The UI was restyled from Discuit's original look to a warmer, more
restrained aesthetic inspired by Anthropic/Claude's product design. All
styles live in `ui/src/scss/`, and the whole palette, spacing, and typography
scale are driven by CSS custom properties defined in `_base.scss` — nothing
should be hardcoded outside of that file.

- **Color palette**: an Ivory/Slate/Clay palette (warm neutrals plus a clay
  accent) replaced Discuit's original purple/blue scheme, defined as RGB
  triplets (`--base-*`) and referenced everywhere as `--color-*` tokens
  (e.g. `--color-brand`, `--color-text`, `--color-border`), so the palette
  can be changed in one place. Light and dark mode are both supported via
  `html.theme-dark`.
- **Typography scale**: a fixed set of font-size tokens (`--fs-xs` through
  `--fs-5xl`) replaced one-off `rem`/`px` values throughout the stylesheets.
- **Spacing scale**: margins and padding are expressed as `var(--gap)` or
  `calc()` expressions off it, rather than ad-hoc pixel values, so spacing
  stays consistent as the base scale changes.
- **Motion**: transitions are enabled site-wide (`--t-time: 0.2s`,
  `--t-time-quick: 0.1s`, `--t-time-button: 0.15s`) so interactive elements
  fade instead of snapping — these were previously `0s` (no animation).
- **Type weight**: buttons use a lighter `font-weight: 500` (was `600`),
  reserving `600` for headings, usernames, and badges to preserve hierarchy.

This pass touched every SCSS partial in `ui/src/scss/` (`_base`, `_static`,
`_home`, `_user`, `_post`, `_chat`, `_newPost`, `_dashboard`, `_components`,
`_modtools`, `_community`, `_comms`, `_settings`) plus a handful of
components with inline styles that were moved onto tokens. If you're adding
new UI, reuse an existing token rather than introducing a new hardcoded
color or spacing value.

## Contributing

Edit Raleigh is free and open-source software, and volunteers are welcome to
contribute. For civic-platform-specific work (this repo), reach out via
direct message on X: [@RaleighWiki](https://x.com/RaleighWiki).

For contributions to the underlying Discuit platform itself, see the
[upstream project](https://github.com/discuitnet/discuit) and its own
contribution guidelines.

## License

Edit Raleigh is a derivative work of [Discuit](https://discuit.org),
copyright (C) 2024 Previnder, and remains free software under the same
license — our thanks to its creator for keeping it open source.

Copyright (C) 2024 Previnder

This program is free software: you can redistribute it and/or modify it under
the terms of the GNU Affero General Public License as published by the Free
Software Foundation, either version 3 of the License, or (at your option) any
later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY
WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A
PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License along
with this program. If not, see <https://www.gnu.org/licenses/>.
