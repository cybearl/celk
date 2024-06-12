import { HttpContext } from "@adonisjs/core/http"

/**
 * Where it is not possible to use the role middleware, this function allows to recover user's roles
 * with the `auth` object provided by the `HttpContext`.
 * @param auth The `auth` object provided by the `HttpContext`.
 * @returns The user's roles (as an array of role names).
 */
export async function getUserRoles(auth: HttpContext["auth"]) {
    const roles = await auth.user!.related("roles").query().select("name").exec()
    return roles.map((role) => role.name)
}
