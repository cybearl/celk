import { autoSwaggerDefaultVersionConfig } from "#config/swagger"
import { middleware } from "#start/kernel"
import router from "@adonisjs/core/services/router"
import AutoSwagger from "adonis-autoswagger"

const AddressesController = () => import("#controllers/addresses_controller")
const AuthController = () => import("#controllers/auth_controller")
const ChainsController = () => import("#controllers/chains_controller")
const RolesController = () => import("#controllers/roles_controller")
const TokensController = () => import("#controllers/tokens_controller")
const UsersController = () => import("#controllers/users_controller")

// =========================================
//  Authentication routes (via credentials)
// =========================================
// router.post("/register", [AuthController, "register"])
router.post("/sign-in", [AuthController, "signIn"])

// ======================
//  Documentation routes
// ======================
router
    .group(() => {
        // Default version
        router.get("/", async () => {
            return AutoSwagger.default.docs(router.toJSON(), autoSwaggerDefaultVersionConfig)
        })
    })
    .prefix("/swagger")

router
    .group(() => {
        // Default version
        router.get("/", async () => {
            return AutoSwagger.default.ui("/swagger", autoSwaggerDefaultVersionConfig)
            // return AutoSwagger.default.scalar("/swagger")
            // return AutoSwagger.default.rapidoc("/swagger", "view")
        })
    })
    .prefix("/docs")

// =====================================================
//  Default version: Accessible via credentials / token
// =====================================================
router
    .group(() => {
        // Addresses
        router.get("/addresses", [AddressesController, "index"])
        router.post("/addresses", [AddressesController, "store"])
        router.get("/addresses/:address_id", [AddressesController, "show"])
        router.patch("/addresses/:address_id", [AddressesController, "update"])
        router.delete("/addresses/:address_id", [AddressesController, "destroy"])

        // Special routes to lock/unlock an address
        router.post("/addresses/:address_id/lock", [AddressesController, "lock"])
        router.post("/addresses/:address_id/unlock", [AddressesController, "unlock"])

        // Chains
        router.get("/chains", [ChainsController, "index"])
        router.post("/chains", [ChainsController, "store"])
        router.get("/chains/:chain_id", [ChainsController, "show"])
        router.patch("/chains/:chain_id", [ChainsController, "update"])
        router.delete("/chains/:chain_id", [ChainsController, "destroy"])

        // Roles
        router.get("/roles", [RolesController, "index"])
        router.get("/roles/:role_id", [RolesController, "show"])

        // Tokens
        router.get("/tokens", [TokensController, "index"])
        router.post("/tokens", [TokensController, "store"])
        router.get("/tokens/:token_id", [TokensController, "show"])
        router.patch("/tokens/:token_id", [TokensController, "update"])
        router.delete("/tokens/:token_id", [TokensController, "destroy"])

        // Users
        router.get("/users/:user_id", [UsersController, "show"])
        router.patch("/users/:user_id", [UsersController, "update"])
        router.delete("/users/:user_id", [UsersController, "destroy"])
    })
    .use(middleware.auth({ guards: ["base64credentials", "token"] }))

// ===========================
//  Administrator only routes
// ===========================
router
    .group(() => {
        // Special routes to recover all data from a model
        router.get("/addresses", [AddressesController, "indexAll"])
        router.get("/chains", [ChainsController, "indexAll"])
        router.get("/roles", [RolesController, "indexAll"])
        router.get("/tokens", [TokensController, "indexAll"])

        // Roles management
        router.post("/roles", [RolesController, "store"])
        router.patch("/roles/:role_id", [RolesController, "update"])
        router.delete("/roles/:role_id", [RolesController, "destroy"])

        // Special routes to lock/unlock users
        router.patch("users/:user_id/lock", [UsersController, "lock"])
        router.patch("users/:user_id/unlock", [UsersController, "unlock"])
    })
    .prefix("/admin")
    .use(middleware.auth({ guards: ["base64credentials", "token"] }))
    .use(middleware.role({ role: "admin" }))

// Default route redirects to the docs
router.get("/", async ({ response }) => response.redirect("/docs"))
