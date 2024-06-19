const AddressesController = () => import("#controllers/addresses_controller")
import { RoleNames } from "#models/role"
import { middleware } from "#start/kernel"
import router from "@adonisjs/core/services/router"

const AuthController = () => import("#controllers/auth_controller")
const ChainsController = () => import("#controllers/chains_controller")

// Authentication via credentials to get an access token, only
// if the user is authorized. This is the initial route used
// by a user to get its first access token.
router.post("/login", [AuthController, "login"])

// All routes needing an access token
router
    .group(() => {
        // Addresses
        router
            .group(() => {
                router.get("/", [AddressesController, "index"])
                router.post("/", [AddressesController, "store"])
                router.get("/:address_id", [AddressesController, "show"])
                router.patch("/:address_id", [AddressesController, "update"])
                router.delete("/:address_id", [AddressesController, "destroy"])

                // Short path routes to lock/unlock an address
                router.post("/:address_id/lock", [AddressesController, "lock"])
                router.post("/:address_id/unlock", [AddressesController, "unlock"])
            })
            .prefix("/addresses")

        // Chains
        router
            .group(() => {
                router.get("/", [ChainsController, "index"])
                router.get("/:chain_id", [ChainsController, "show"])
            })
            .prefix("/chains")

        // Administrator only routes
        router
            .group(() => {
                // Users management
                router
                    .group(() => {
                        router.get("/", [AuthController, "index"])
                        router.post("/", [AuthController, "store"])
                        router.get("/:user_id", [AuthController, "show"])
                        router.patch("/:user_id", [AuthController, "update"])
                        router.delete("/:user_id", [AuthController, "destroy"])

                        // Short path routes to lock/unlock a user
                        router.post("/:user_id/lock", [AuthController, "lock"])
                        router.post("/:user_id/unlock", [AuthController, "unlock"])
                    })
                    .prefix("/users")
            })
            .prefix("/admin")
            .use(middleware.role({ role: RoleNames.AdminRole }))
    })
    .use(middleware.auth({ guards: ["token"] }))
