const DEFAULT_PAGE = 1
const DEFAULT_LIMIT = 10
const MAX_LIMIT = 100

function getPagination(query){
    const source = query || {}

    let page = parseInt(source.page, 10)
    let limit = parseInt(source.limit, 10)

    if (!Number.isInteger(page) || page < 1){
        page = DEFAULT_PAGE
    }
    if (!Number.isInteger(limit) || limit < 1){
        limit = DEFAULT_LIMIT
    }
    if (limit > MAX_LIMIT){
        limit = MAX_LIMIT
    }

    const skip = (page - 1) * limit

    return { page, limit, skip }
}

function buildMeta(total, page, limit){
    const totalPages = limit > 0 ? Math.ceil(total / limit) : 0

    return {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
    }
}

function escapeRegex(text){
    return String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function buildSearchRegex(search){
    if (!search){
        return null
    }
    const trimmed = String(search).trim()
    if (!trimmed){
        return null
    }
    return { $regex: escapeRegex(trimmed), $options: 'i' }
}

module.exports = {
    DEFAULT_PAGE,
    DEFAULT_LIMIT,
    MAX_LIMIT,
    getPagination,
    buildMeta,
    escapeRegex,
    buildSearchRegex
}
