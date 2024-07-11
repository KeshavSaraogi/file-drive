import { ConvexError, v } from 'convex/values'
import { mutation, MutationCtx, query, QueryCtx } from './_generated/server'
import { getUser } from './users'
import { fileTypes } from './schema'

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
        type: fileTypes,
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
            type: args.type,
            orgId: args.orgId,
            fileId: args.fileId,
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
            throw new ConvexError("You Do Not Have Access To This Organization")
        }

        const files = await ctx.db.query('files').withIndex('by_orgId', q =>
            q.eq('orgId', args.orgId)).collect();
        return files;
    }
});

export const deleteFile = mutation({
    args: {
        fileId: v.id("files")
    },
    async handler(ctx, args) {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new ConvexError("You Do Not Have Access To This Organization")
        }

        const file = await ctx.db.get(args.fileId)
        if (!file) {
            throw new ConvexError("This File Does Not Exist")
        }

        const hasAccess = await hasAccessToOrg(ctx, identity.tokenIdentifier, file.orgId)
        if (!hasAccess) {
            throw new ConvexError("You Do Not Have Access To Delete This File")
        }
        await ctx.db.delete(args.fileId)
    }
})