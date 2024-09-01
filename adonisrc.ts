import { defineConfig } from "@adonisjs/core/app"

export default defineConfig({
    /*
     * List of ace commands to register from packages. The application commands
     * will be scanned automatically from the "./commands" directory.
     */
    commands: [
        () => import("@adonisjs/core/commands"),
        () => import("@adonisjs/lucid/commands"),
        () => import("@adonisjs/bouncer/commands"),
    ],

    /*
     * List of service providers to import and register when booting the
     * application.
     */
    providers: [
        () => import("@adonisjs/core/providers/app_provider"),
        () => import("@adonisjs/core/providers/hash_provider"),
        {
            file: () => import("@adonisjs/core/providers/repl_provider"),
            environment: ["repl", "test"],
        },
        () => import("@adonisjs/core/providers/vinejs_provider"),
        () => import("@adonisjs/cors/cors_provider"),
        () => import("@adonisjs/lucid/database_provider"),
        () => import("@adonisjs/auth/auth_provider"),
        () => import("#providers/workers_provider"),
        () => import("@adonisjs/bouncer/bouncer_provider"),
    ],

    /*
     * List of modules to import before starting the application.
     */
    preloads: [() => import("#start/routes"), () => import("#start/kernel")],

    /*
     * List of test suites to organize tests by their type. Feel free to remove
     * and add additional suites.
     */
    tests: {
        suites: [
            {
                files: ["tests/unit/**/*.test(.ts|.js)"],
                name: "unit",
                timeout: 2000,
            },
            {
                files: ["tests/functional/**/*.test(.ts|.js)"],
                name: "functional",
                timeout: 30000,
            },
        ],
        forceExit: true,
    },
})
