import type { HttpContext } from "@adonisjs/core/http"
import RolePolicy from "#policies/role_policy"
import Role from "#models/role"
import User from "#models/user"
import { roleCreationValidator, roleUpdateValidator } from "#validators/role_validator"
import BaseController from "#controllers/templates/base_controller"
import { AppErrors } from "#lib/constants/errors"

export default class RolesController extends BaseController {
    /**
     * Get all user's roles.
     */
    async index({ auth, bouncer, request }: HttpContext) {
        if (!auth.user) this.errorResponse(AppErrors.UNAUTHORIZED)

        if (await bouncer.with(RolePolicy).denies("index")) {
            return this.errorResponse(AppErrors.UNAUTHORIZED)
        }

        const queries = request.qs()
        const options = this.getQueryOptions(queries)

        const roles = await (auth.user as User)
            .related("roles")
            .query()
            .orderBy(options.orderBy, options.orderDirection)
            .paginate(options.page, options.limit)

        const tmp = roles.toJSON()
        return this.successResponse(tmp.data, tmp.meta)
    }

    /**
     * Get all roles (reserved for administrators only).
     */
    async indexAll({ bouncer, request }: HttpContext) {
        if (await bouncer.with(RolePolicy).denies("indexAll")) {
            return this.errorResponse(AppErrors.UNAUTHORIZED)
        }

        const queries = request.qs()
        const options = this.getQueryOptions(queries)

        const roles = await Role.query()
            .orderBy(options.orderBy, options.orderDirection)
            .paginate(options.page, options.limit)

        const tmp = roles.toJSON()
        return this.successResponse(tmp.data, tmp.meta)
    }

    /**
     * Add a new role.
     */
    async store({ bouncer, request }: HttpContext) {
        if (await bouncer.with(RolePolicy).denies("store")) {
            return this.errorResponse(AppErrors.UNAUTHORIZED)
        }

        const { name, description } = await request.validateUsing(roleCreationValidator)

        if (name && (await Role.findBy("name", name))) return this.errorResponse(AppErrors.ROLE_ALREADY_EXISTS)

        const role = await Role.create({ name, description })
        return this.successResponse(role)
    }

    /**
     * Get role by ID.
     */
    async show({ bouncer, params }: HttpContext) {
        const role = await Role.find(params.role_id)
        if (!role) return this.errorResponse(AppErrors.ROLE_NOT_FOUND)

        if (await bouncer.with(RolePolicy).denies("show", role)) {
            return this.errorResponse(AppErrors.UNAUTHORIZED)
        }

        return this.successResponse(role)
    }

    /**
     * Update a role.
     */
    async update({ bouncer, request, params }: HttpContext) {
        if (await bouncer.with(RolePolicy).denies("update")) {
            return this.errorResponse(AppErrors.UNAUTHORIZED)
        }

        const role = await Role.find(params.role_id)
        if (!role) return this.errorResponse(AppErrors.ROLE_NOT_FOUND)

        const { name, description } = await request.validateUsing(roleUpdateValidator)

        role.name = name || role.name
        role.description = description || role.description
        await role.save()

        return this.successResponse(role)
    }

    /**
     * Delete a role.
     */
    async destroy({ bouncer, params }: HttpContext) {
        if (await bouncer.with(RolePolicy).denies("destroy")) {
            return this.errorResponse(AppErrors.UNAUTHORIZED)
        }

        const role = await Role.find(params.role_id)
        if (!role) return this.errorResponse(AppErrors.ROLE_NOT_FOUND)

        await role.delete()
        return this.successResponse(role)
    }
}
