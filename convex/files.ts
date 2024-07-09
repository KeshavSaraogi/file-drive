import { ConvexError, v } from 'convex/values'
import { mutation, MutationCtx, query, QueryCtx } from './_generated/server'
import { getUser } from './users'

export const generateUploadUrl = mutation(async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
        throw new ConvexError('You must be logged in to upload a file. ')
    }
    
    return await ctx.storage.generateUploadUrl()
})


async function hasAccessToOrg(
    ctx: QueryCtx | MutationCtx, 
    tokenIdentifier: string, orgId: string) {
    
    const user = await getUser(ctx, tokenIdentifier)    
    const hasAccess = 
        user.orgIds.includes(orgId) || user.tokenIdentifier === orgId
    
    return hasAccess
}

export const createFile = mutation({
    args: {
        name: v.string(),
        orgId: v.string(),
        fileId: v.id("_storage")
    },
    async handler(ctx, args) {
        const identity = await ctx.auth.getUserIdentity()
        if (!identity) {
            throw new ConvexError('You must be logged in to upload a file. ')
        }

        const hasAccess = await hasAccessToOrg(ctx, identity.tokenIdentifier, args.orgId)
        if (!hasAccess) {
            throw new ConvexError("You Do Not Have Access To This Organization")
        }

        await ctx.db.insert('files', {
            name: args.name,
            orgId: args.orgId,
            fileId: args.fileId
        })
    }
})

export const getFiles = query({
    args: {
        orgId: v.string()
    },
    async handler(ctx, args) {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return [];
        }
        const hasAccess = await hasAccessToOrg(ctx, identity.tokenIdentifier, args.orgId)
        if (!hasAccess) {
            return []
        }

        const files = await ctx.db.query('files').withIndex('by_orgId', q =>
            q.eq('orgId', args.orgId)).collect();
        return files;
    }
});
