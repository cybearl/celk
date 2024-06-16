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
                router.put("/", [AddressesController, "update"])
                router.delete("/:address_id", [AddressesController, "destroy"])
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
                // Chains management
                router
                    .group(() => {
                        router.get("/", [ChainsController, "index"])
                        router.post("/", [ChainsController, "store"])
                        router.get("/:chain_id", [ChainsController, "show"])
                        router.patch("/:chain_id", [ChainsController, "update"])
                        router.delete("/:chain_id", [ChainsController, "destroy"])
                    })
                    .prefix("/chains")
            })
            .prefix("/admin")
            .use(middleware.role({ role: RoleNames.AdminRole }))
    })
    .use(middleware.auth({ guards: ["token"] }))
