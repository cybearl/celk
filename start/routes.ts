const AddressesController = () => import("#controllers/addresses_controller")
import { RoleNames } from "#models/role"
import { middleware } from "#start/kernel"
import router from "@adonisjs/core/services/router"

const AuthController = () => import("#controllers/auth_controller")
const ChainsController = () => import("#controllers/chains_controller")

// ======================================
//  Root route (for health checks, etc.)
// ======================================
router.get("/", async ({ response }) =>
    response.json({
        success: true,
        data: {
            status: "online",
            message: "A service provided by Cybearl, all rights reserved.",
            timestamp: new Date().toISOString(),
        },
    })
)

// =========================================
//  Authentication routes (via credentials)
// =========================================
// router.post("/register", [AuthController, "register"])
router.post("/sign-in", [AuthController, "signIn"])

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
                //
            })
            .prefix("/admin")
            .use(middleware.role({ role: RoleNames.AdminRole }))
    })
    .use(middleware.auth({ guards: ["token"] }))
