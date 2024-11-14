import { middleware } from "#start/kernel"
import router from "@adonisjs/core/services/router"

const AuthController = () => import("#controllers/auth_controller")
const GeneralController = () => import("#controllers/general_controller")
const RolesController = () => import("#controllers/roles_controller")
const TokensController = () => import("#controllers/tokens_controller")
const UsersController = () => import("#controllers/users_controller")

// ============
//  Home route
// ============
// For now, the default route is the status route.
router.get("/", async ({ response }) => {
    response.redirect("/status")
})

// ==========================================
//  General routes (for health checks, etc.)
// ==========================================
router.get("/status", [GeneralController, "status"])

// =========================================
//  Authentication routes (via credentials)
// =========================================
router.post("/register", [AuthController, "register"])
router.post("/sign-in", [AuthController, "signIn"])

// =====================================================
//  Default version: Accessible via credentials / token
// =====================================================
router
    .group(() => {
        // Roles
        router.get("/roles", [RolesController, "index"])
        router.get("/roles/:role_id", [RolesController, "show"])

        // Tokens
        router.get("/tokens", [TokensController, "index"])
        router.post("/tokens", [TokensController, "store"])
        router.get("/tokens/:token_id", [TokensController, "show"])
        router.patch("/tokens/:token_id", [TokensController, "update"])
        router.delete("/tokens/:token_id", [TokensController, "destroy"])

        // User self-management
        router.get("/users", [UsersController, "show"])
        router.patch("/users", [UsersController, "update"])
        router.delete("/users", [UsersController, "destroy"])
    })
    .use(middleware.auth({ guards: ["base64credentials", "token"] }))

// ===========================
//  Administrator only routes
// ===========================
router
    .group(() => {
        // Special routes to recover all data from a model
        router.get("/roles", [RolesController, "adminIndex"])
        router.get("/tokens", [TokensController, "adminIndex"])
        router.get("/users", [UsersController, "adminIndex"])

        // Roles management
        router.post("/roles", [RolesController, "store"])
        router.patch("/roles/:role_id", [RolesController, "update"])
        router.delete("/roles/:role_id", [RolesController, "destroy"])

        // User's tokens management
        router.get("/tokens/:user_id", [TokensController, "index"])
        router.post("/tokens/:user_id", [TokensController, "store"])
        router.get("/tokens/:user_id/:token_id", [TokensController, "show"])
        router.patch("/tokens/:user_id/:token_id", [TokensController, "update"])
        router.delete("/tokens/:user_id/:token_id", [TokensController, "destroy"])

        // Special routes to lock/unlock users
        router.patch("users/:user_id/lock", [UsersController, "lock"])
        router.patch("users/:user_id/unlock", [UsersController, "unlock"])
    })
    .prefix("/admin")
    .use(middleware.auth({ guards: ["base64credentials", "token"] }))
    .use(middleware.role({ role: "admin" }))
