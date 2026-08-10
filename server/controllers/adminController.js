import { query, queryOne } from '../config/database.js';

export const getDashboardStats = async (req, res) => {
    try {
        const salesRes = await queryOne("SELECT COALESCE(SUM(total), 0) as totalSales FROM orders WHERE status != 'Cancelled'");
        const ordersRes = await queryOne("SELECT COUNT(*) as totalOrders FROM orders");
        const pendingRes = await queryOne("SELECT COUNT(*) as pendingOrders FROM orders WHERE status = 'Pending'");
        const customersRes = await queryOne("SELECT COUNT(*) as totalCustomers FROM users WHERE role = 'customer'");
        const productsRes = await queryOne("SELECT COUNT(*) as totalProducts FROM products");
        const categoriesRes = await queryOne("SELECT COUNT(*) as totalCategories FROM categories");
        
        const today = new Date().toISOString().split('T')[0];
        const bannersRes = await queryOne("SELECT COUNT(*) as activeBanners FROM banners WHERE status = 'active' AND (start_date IS NULL OR start_date <= ?) AND (end_date IS NULL OR end_date >= ?)", [today, today]);

        // Daily sales chart data for last 7 days
        const chartSales = await query(`
            SELECT strftime('%Y-%m-%d', created_at) as date, SUM(total) as sales, COUNT(*) as count
            FROM orders
            WHERE created_at >= date('now', '-7 days') AND status != 'Cancelled'
            GROUP BY date
            ORDER BY date ASC
        `);

        // Products per category distribution
        const categoryDist = await query(`
            SELECT c.name as category, COUNT(p.id) as count
            FROM categories c
            LEFT JOIN products p ON p.category_id = c.id
            GROUP BY c.id
        `);

        // Recent users registration counts
        const recentUsers = await query(`
            SELECT strftime('%Y-%m-%d', created_at) as date, COUNT(*) as count
            FROM users
            WHERE role = 'customer' AND created_at >= date('now', '-7 days')
            GROUP BY date
            ORDER BY date ASC
        `);

        res.json({
            totals: {
                totalSales: salesRes.totalSales,
                totalOrders: ordersRes.totalOrders,
                pendingOrders: pendingRes.pendingOrders,
                totalCustomers: customersRes.totalCustomers,
                totalProducts: productsRes.totalProducts,
                totalCategories: categoriesRes.totalCategories,
                activeBanners: bannersRes.activeBanners
            },
            charts: {
                salesHistory: chartSales,
                categoryDistribution: categoryDist,
                recentRegistrations: recentUsers
            }
        });
    } catch (err) {
        res.status(500).json({ message: 'Failed to load dashboard statistics.', error: err.message });
    }
};
