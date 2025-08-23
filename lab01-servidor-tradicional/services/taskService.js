const database = require('../database/database');
const { getPagination } = require('../utils/response');

async function getTasksWithFilter({ userId, filterSql, filterParams, query }) {
    const { page, limit, offset} = getPagination(query);

    const sql = `
        SELECT * FROM tasks
        WHERE userId = ? ${filterSql}
        ORDER BY createdAt DESC
        LIMIT ? OFFSET ?
    `;

    const params = [userId, ...filterParams, limit, offset];
    const rows = await database.all(sql, params);

    const countSql = `
        SELECT COUNT(*) as total FROM tasks
        WHERE userId = ? ${filterSql}
    `;
    const countParams = [userId, ...filterParams];
    const countRow = await database.get(countSql, countParams);

    return { rows, countRow, page, limit };
}

module.exports = { getTasksWithFilter };