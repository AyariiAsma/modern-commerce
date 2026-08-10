import { run, query, queryOne } from '../config/database.js';
import { generateInvoicePDF } from '../services/invoiceService.js'; // I'll also add generateCreditNotePDF

export const getInvoices = async (req, res, next) => {
    try {
        const invoices = await query(`
            SELECT i.*, o.order_number, u.name as customer_name
            FROM invoices i
            JOIN orders o ON i.order_id = o.id
            LEFT JOIN users u ON o.user_id = u.id
            ORDER BY i.created_at DESC
        `);
        res.json({ success: true, data: invoices });
    } catch (err) {
        next(err);
    }
};

export const getCreditNotes = async (req, res, next) => {
    try {
        const creditNotes = await query(`
            SELECT c.*, i.invoice_number, o.order_number
            FROM credit_notes c
            JOIN invoices i ON c.invoice_id = i.id
            JOIN orders o ON c.order_id = o.id
            ORDER BY c.created_at DESC
        `);
        res.json({ success: true, data: creditNotes });
    } catch (err) {
        next(err);
    }
};

export const issueCreditNote = async (req, res, next) => {
    const { invoice_id, reason, amount } = req.body;
    const userId = req.user.id;

    try {
        await run('BEGIN TRANSACTION');

        const invoice = await queryOne('SELECT * FROM invoices WHERE id = ?', [invoice_id]);
        if (!invoice) {
            await run('ROLLBACK');
            return res.status(404).json({ message: 'Invoice not found.' });
        }

        const order = await queryOne('SELECT * FROM orders WHERE id = ?', [invoice.order_id]);

        const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
        const randStr = Math.floor(1000 + Math.random() * 9000);
        const creditNoteNumber = `CN-${dateStr}-${randStr}`;

        const cnResult = await run(`
            INSERT INTO credit_notes (invoice_id, order_id, credit_note_number, reason, amount, status, created_by)
            VALUES (?, ?, ?, ?, ?, 'issued', ?)
        `, [invoice_id, order.id, creditNoteNumber, reason, amount, userId]);

        // Here we could also generate a PDF for the credit note
        // const pdfPath = await generateCreditNotePDF({ ... });
        // await run('UPDATE credit_notes SET pdf_path = ? WHERE id = ?', [pdfPath, cnResult.lastID]);

        await run('COMMIT');
        res.status(201).json({ success: true, message: 'Credit Note issued successfully.' });
    } catch (err) {
        await run('ROLLBACK');
        next(err);
    }
};
