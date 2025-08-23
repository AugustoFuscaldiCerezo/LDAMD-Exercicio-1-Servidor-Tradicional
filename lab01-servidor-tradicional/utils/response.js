function getPagination (query, defaultLimit = 2){
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Number(query.limit) || defaultLimit);
    const offset = (page - 1) * limit;
    return { page, limit, offset };
}

function sendPaginatedResponse(res, rows, countRow, page, limit) {
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({
        success: true,
        data: rows,
        pagination: {
            page: Number(page),
            limit: Number(limit),
            total: countRow ? countRow.total : 0
        }
    }, null, 2));
}

module.exports = { sendPaginatedResponse, getPagination };
