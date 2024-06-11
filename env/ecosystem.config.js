// A PM2 configuration file for Celk
module.exports = {
    apps: [{
        name: "celk",
        script: "dist/main.js",
        instances: 1,

        // Logging (no file, using console live logs instead)
        error_file: "/dev/null",
        out_file: "/dev/null",
        log_file: "/dev/null"
    }]
};