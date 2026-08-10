/**
 * Centralized Financial Calculation Engine for modern-commerce
 */

/**
 * Calculate totals for a single item.
 * 
 * @param {number} price - Original unit price HT
 * @param {number} tvaRate - TVA rate in percentage (e.g. 19 for 19%)
 * @param {number|null} discountPrice - Promotional unit price HT (if any)
 * @param {number} quantity - Quantity of items
 * @returns {object} Calculated item totals snapshot
 */
export function calculateItemTotals(price, tvaRate, discountPrice, quantity) {
    const unitPriceHt = price;
    const finalUnitPriceHt = (discountPrice !== null && discountPrice !== undefined) ? discountPrice : price;
    const unitDiscountHt = Math.max(0, unitPriceHt - finalUnitPriceHt);

    const totalOriginalHt = unitPriceHt * quantity;
    const totalDiscountHt = unitDiscountHt * quantity;
    const totalHt = finalUnitPriceHt * quantity;

    // TVA is calculated on the discounted HT price
    const tvaRateDecimal = (tvaRate || 0) / 100;
    const totalTva = totalHt * tvaRateDecimal;
    
    const unitTvaAmount = finalUnitPriceHt * tvaRateDecimal;
    const unitPriceTtc = finalUnitPriceHt + unitTvaAmount;
    const totalTtc = totalHt + totalTva;

    return {
        unit_price_ht: finalUnitPriceHt,
        tva_rate: tvaRate || 0,
        tva_amount: totalTva,
        unit_price_ttc: unitPriceTtc,
        discount_amount: totalDiscountHt,
        quantity,
        total_ht: totalHt,
        total_ttc: totalTtc
    };
}

/**
 * Calculate order-level totals.
 * 
 * @param {Array} items - Array of items with calculated totals
 * @param {number} shippingCost - Shipping cost (TTC)
 * @param {object|null} fidelityCodeObj - Checked fidelity code object (with discount_type and discount_value)
 * @returns {object} Full financial breakdown
 */
export function calculateOrderTotals(items, shippingCost = 15.00, fidelityCodeObj = null) {
    let subtotalHt = 0;
    let totalDiscount = 0;
    let totalHt = 0;
    let totalTva = 0;

    items.forEach(item => {
        subtotalHt += (item.unit_price_ht + (item.discount_amount / item.quantity)) * item.quantity;
        totalDiscount += item.discount_amount;
        totalHt += item.total_ht;
        totalTva += item.tva_amount;
    });

    const totalTtcBeforeFidelity = totalHt + totalTva;
    
    // Fidelity discount calculation
    let fidelityDiscount = 0;
    if (fidelityCodeObj) {
        if (fidelityCodeObj.discount_type === 'percentage') {
            // Apply percentage on the merchandise TTC subtotal
            fidelityDiscount = totalTtcBeforeFidelity * (fidelityCodeObj.discount_value / 100);
        } else if (fidelityCodeObj.discount_type === 'fixed') {
            fidelityDiscount = fidelityCodeObj.discount_value;
        }
        // Fidelity discount cannot exceed subtotal
        fidelityDiscount = Math.min(totalTtcBeforeFidelity, fidelityDiscount);
    }

    const totalToPay = Math.max(0, totalTtcBeforeFidelity + parseFloat(shippingCost) - fidelityDiscount);

    return {
        subtotal_ht: subtotalHt,
        total_discount: totalDiscount,
        total_ht: totalHt,
        total_tva: totalTva,
        shipping_cost: parseFloat(shippingCost),
        fidelity_discount: fidelityDiscount,
        total_ttc: totalTtcBeforeFidelity,
        total_paid: totalToPay
    };
}
