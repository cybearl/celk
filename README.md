<p align="center">
  <br />
  <a href="https://www.cybearl.com" target="_blank"><img width="100px" src="https://cybearl.com/_next/image?url=%2Fimages%2Flogo.webp&w=640&q=75" /></a>
  <h2 align="center">@cybearl/celk</h2>
  <p align="center">A small application for trying to brute-force a set of Ethereum addresses.</p>
</p>

## Installation
### Prerequisites
- [vcpkg](https://vcpkg.io) installed and the `VCPKG_ROOT` environment variable set to its directory
- [Ninja](https://ninja-build.org) build system (used by the CMake presets)

### Workers
- Development:
  ```bash
  # Once: configure the build directory for Debug (via the "default" CMake preset)
  $ yarn wrk configure:dev

  # Every time you change C++ code: compile
  $ yarn wrk build

  # Copy the binary to "packages/app/.celk/" (where the app looks for it by default)
  $ yarn wrk install:dev

  # Then run the app normally
  $ yarn app dev
  ```

- Production:
  ```bash
  # Run from packages/workers/
  $ cd packages/workers

  # Configure for Release (optimized, no debug symbols) using the "release" CMake preset
  $ cmake --preset release

  # Build
  $ cmake --build --preset release

  # Install to wherever "CELK_WORKER_BINARY" points (e.g. /usr/local/bin)
  $ cmake --install build --prefix /usr/local/bin
  # Binary ends up at /usr/local/bin/worker

  # Set env var
  CELK_WORKER_BINARY=/usr/local/bin/worker

  # Or install into a dedicated app directory
  cmake --install build --prefix /var/lib/celk
  CELK_WORKER_BINARY=/var/lib/celk/worker
  ```
