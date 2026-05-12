# companion-module-strictly-ptz-live

Bitfocus Companion module for PTZ Live from Strictly Typed LLC.

See [HELP.md](./companion/HELP.md) and [LICENSE](./LICENSE).

## Getting Started

Install dependencies:

```sh
yarn
```

Build the module:

```sh
yarn build
```

Run TypeScript in watch mode while developing:

```sh
yarn dev
```

## Packaging

Companion modules are distributed as `.tgz` packages.

Generate the package:

```sh
eval "$(fnm env)"
fnm use v22.22.2
yarn package
```

This increments the beta build number before packaging.

The package will be written to the module root as:

```text
strictly-ptz-live-0.1.0-beta.1.tgz
```
