import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const generateInvoicePDF = (invoiceData) => {
    return new Promise((resolve, reject) => {
        try {
            const { order, items, invoice } = invoiceData;
            
            const doc = new PDFDocument({ margin: 50 });
            const fileName = `${invoice.invoice_number}.pdf`;
            const filePath = path.join(__dirname, '..', 'public', 'uploads', 'invoices', fileName);
            const writeStream = fs.createWriteStream(filePath);

            doc.pipe(writeStream);

            // Header
            doc.fontSize(20).text('INVOICE', { align: 'right' });
            doc.fontSize(10).text(`Invoice Number: ${invoice.invoice_number}`, { align: 'right' });
            doc.text(`Date: ${new Date(invoice.invoice_date).toLocaleDateString()}`, { align: 'right' });
            doc.text(`Order Number: ${order.order_number}`, { align: 'right' });

            doc.moveDown();

            // Store Info
            doc.fontSize(14).text('Modern Commerce');
            doc.fontSize(10).text('123 Store Street');
            doc.text('City, Country');
            doc.text('Email: contact@moderncommerce.com');
            
            doc.moveDown(2);

            // Customer Info
            doc.fontSize(12).text('Bill To:');
            doc.fontSize(10).text(`${order.shipping_first_name} ${order.shipping_last_name}`);
            doc.text(`${order.shipping_address_line_1}`);
            if (order.shipping_address_line_2) doc.text(`${order.shipping_address_line_2}`);
            doc.text(`${order.shipping_city}, ${order.shipping_postal_code}`);
            doc.text(`${order.shipping_country}`);
            doc.text(`Phone: ${order.shipping_phone}`);

            doc.moveDown(2);

            // Items Table
            const tableTop = doc.y;
            doc.font('Helvetica-Bold');
            doc.fontSize(9);
            doc.text('Item', 50, tableTop, { width: 170 });
            doc.text('Qty', 220, tableTop, { width: 30, align: 'right' });
            doc.text('UP HT', 250, tableTop, { width: 50, align: 'right' });
            doc.text('Disc. HT', 300, tableTop, { width: 50, align: 'right' });
            doc.text('Net HT', 350, tableTop, { width: 50, align: 'right' });
            doc.text('TVA', 400, tableTop, { width: 40, align: 'right' });
            doc.text('Total TTC', 440, tableTop, { width: 100, align: 'right' });
            
            const hrY = tableTop + 15;
            doc.moveTo(50, hrY).lineTo(560, hrY).stroke();

            doc.font('Helvetica');
            let y = hrY + 10;

            for (const item of items) {
                // Ensure backward compatibility if old item doesn't have snapshot columns
                const upHt = item.unit_price_ht !== null ? item.unit_price_ht : item.unit_price;
                const discHt = item.discount_amount ? (item.discount_amount / item.quantity) : 0;
                const netHt = item.total_ht !== null ? (item.total_ht / item.quantity) : item.unit_price;
                const tvaRateStr = item.tva_rate !== null ? `${item.tva_rate}%` : '0%';
                const totalTtc = item.total_ttc !== null ? item.total_ttc : item.total_price;

                doc.text(item.product_name, 50, y, { width: 170 });
                doc.text(item.quantity.toString(), 220, y, { width: 30, align: 'right' });
                doc.text(upHt.toFixed(2), 250, y, { width: 50, align: 'right' });
                doc.text(discHt > 0 ? `-${discHt.toFixed(2)}` : '-', 300, y, { width: 50, align: 'right' });
                doc.text(netHt.toFixed(2), 350, y, { width: 50, align: 'right' });
                doc.text(tvaRateStr, 400, y, { width: 40, align: 'right' });
                doc.text(totalTtc.toFixed(2), 440, y, { width: 100, align: 'right' });
                y += 20;
            }

            doc.moveTo(50, y).lineTo(560, y).stroke();
            y += 10;

            // Totals
            doc.font('Helvetica-Bold');
            doc.fontSize(10);
            
            const subtotalHt = order.subtotal_ht !== null ? order.subtotal_ht : order.subtotal;
            doc.text('Subtotal HT:', 320, y, { width: 120, align: 'right' });
            doc.text(subtotalHt.toFixed(2), 440, y, { width: 100, align: 'right' });
            y += 20;

            if (order.total_discount > 0) {
                doc.text('Total Discount HT:', 320, y, { width: 120, align: 'right' });
                doc.text('-' + order.total_discount.toFixed(2), 440, y, { width: 100, align: 'right' });
                y += 20;
            }

            const totalHt = order.total_ht !== null ? order.total_ht : (order.subtotal - order.discount);
            doc.text('Total HT:', 320, y, { width: 120, align: 'right' });
            doc.text(totalHt.toFixed(2), 440, y, { width: 100, align: 'right' });
            y += 20;

            const totalTva = order.total_tva || 0;
            if (totalTva > 0) {
                doc.text('Total TVA:', 320, y, { width: 120, align: 'right' });
                doc.text(totalTva.toFixed(2), 440, y, { width: 100, align: 'right' });
                y += 20;
            }

            const shipping = order.shipping_cost;
            doc.text('Shipping TTC:', 320, y, { width: 120, align: 'right' });
            doc.text(shipping.toFixed(2), 440, y, { width: 100, align: 'right' });
            y += 20;

            if (order.fidelity_discount > 0) {
                doc.text('Fidelity Discount:', 320, y, { width: 120, align: 'right' });
                doc.text('-' + order.fidelity_discount.toFixed(2), 440, y, { width: 100, align: 'right' });
                if (order.fidelity_code) {
                    doc.font('Helvetica');
                    doc.fontSize(8);
                    doc.text(`Code: ${order.fidelity_code}`, 320, y + 12, { width: 120, align: 'right' });
                    doc.font('Helvetica-Bold');
                    doc.fontSize(10);
                }
                y += 25;
            }

            doc.fontSize(12);
            const totalPaid = order.total_paid !== null ? order.total_paid : order.total;
            doc.text('Total to Pay:', 320, y, { width: 120, align: 'right' });
            doc.text(totalPaid.toFixed(2), 440, y, { width: 100, align: 'right' });

            doc.end();

            writeStream.on('finish', () => {
                resolve(`/uploads/invoices/${fileName}`);
            });
            writeStream.on('error', (err) => {
                reject(err);
            });
        } catch (err) {
            reject(err);
        }
    });
};
