import BaseController from "#controllers/templates/base_controller"
import { AppErrors } from "#lib/constants/errors"
import Job from "#models/job"
import JobPolicy from "#policies/job_policy"
import { HttpContext } from "@adonisjs/core/http"

export default class JobsController extends BaseController {
    /**
     * Get all jobs for the current user.
     */
    async index({ auth, bouncer, request }: HttpContext) {
        if (await bouncer.with(JobPolicy).denies("index")) {
            return this.errorResponse(AppErrors.UNAUTHORIZED)
        }

        // TODO
    }

    /**
     * Get all jobs (reserved for administrators only).
     */
    async indexAll({ bouncer, request }: HttpContext) {
        if (await bouncer.with(JobPolicy).denies("indexAll")) {
            return this.errorResponse(AppErrors.UNAUTHORIZED)
        }

        const queries = request.qs()
        const options = this.getQueryOptions(queries)

        const jobs = await Job.query()
            .orderBy(options.orderBy, options.orderDirection)
            .paginate(options.page, options.limit)

        const res = jobs.toJSON()
        return this.successResponse(res.data, res.meta)
    }

    /**
     * Add a new job.
     */
    async store({ bouncer, request, auth }: HttpContext) {
        if (await bouncer.with(JobPolicy).denies("store")) {
            return this.errorResponse(AppErrors.UNAUTHORIZED)
        }

        // TODO
    }

    /**
     * Get job by ID.
     */
    async show({ bouncer, params }: HttpContext) {
        const job = await Job.find(params.job_id)
        if (!job) return this.errorResponse(AppErrors.JOB_NOT_FOUND)

        if (await bouncer.with(JobPolicy).denies("show", job)) {
            return this.errorResponse(AppErrors.UNAUTHORIZED)
        }

        return this.successResponse(job)
    }

    /**
     * Update job by ID.
     */
    async update({ bouncer, params, auth }: HttpContext) {
        const job = await Job.find(params.job_id)
        if (!job) return this.errorResponse(AppErrors.JOB_NOT_FOUND)

        if (await bouncer.with(JobPolicy).denies("update", job)) {
            return this.errorResponse(AppErrors.UNAUTHORIZED)
        }

        // TODO
    }

    /**
     * Delete job by ID.
     */
    async destroy({ bouncer, params }: HttpContext) {
        const job = await Job.find(params.job_id)
        if (!job) return this.errorResponse(AppErrors.JOB_NOT_FOUND)

        if (await bouncer.with(JobPolicy).denies("destroy", job)) {
            return this.errorResponse(AppErrors.UNAUTHORIZED)
        }

        await job.delete()
        return this.successResponse()
    }
}
