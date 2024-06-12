import router from "@adonisjs/core/services/router"

const AuthController = () => import("#controllers/auth_controller")

// Authentication via credentials to get an access token, only
// if the user is authorized. This is the initial route used
// by a user to get its first access token.
router.post("/login", [AuthController, "login"])
