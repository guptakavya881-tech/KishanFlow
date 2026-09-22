/**
 * KisanFlow Payment Service Abstraction
 * Order-Linked Unified Payment Operations
 */

import {
  createOrderPayment,
  completeOrderPayment,
  failOrderPayment,
  getPaymentsByBuyerId,
  getPaymentsByFarmerId,
  getPaymentById,
  getBuyerPayableOrders,
  getBuyerPaymentMetrics,
  getFarmerPaymentMetrics,
  getOrderByIdAndBuyer,
  setFarmerOrderPayment,
} from '../lib/db.js';

export const paymentService = {
  /**
   * Fetch all payments for an authenticated buyer
   */
  async getBuyerPayments(buyerId) {
    if (!buyerId) throw new Error('Buyer ID is required.');
    const payments = getPaymentsByBuyerId(buyerId);
    const summary = getBuyerPaymentMetrics(buyerId);
    const payableOrders = getBuyerPayableOrders(buyerId);
    return {
      payments,
      summary,
      payableOrders,
    };
  },

  /**
   * Fetch all payments for an authenticated farmer
   */
  async getFarmerPayments(farmerId) {
    if (!farmerId) throw new Error('Farmer ID is required.');
    const payments = getPaymentsByFarmerId(farmerId);
    const summary = getFarmerPaymentMetrics(farmerId);
    return {
      payments,
      summary,
    };
  },

  /**
   * Set or update payment details for a confirmed order by the authenticated farmer
   */
  async setFarmerPayment({ orderId, farmerId, finalQuantity, pricePerUnit, totalAmount, notes }) {
    if (!orderId || !farmerId) {
      throw new Error('Order ID and Farmer ID are required.');
    }
    return setFarmerOrderPayment(orderId, farmerId, {
      finalQuantity,
      pricePerUnit,
      totalAmount,
      notes,
    });
  },

  /**
   * Fetch a single payment record by ID with authorization check
   */
  async getPaymentDetails(paymentId, userId, role) {
    const payment = getPaymentById(paymentId);
    if (!payment) return null;

    // Security check: Only the buyer or the linked farmer can access
    if (role === 'buyer' && payment.buyerId !== userId) {
      throw new Error('Unauthorized access to buyer payment.');
    }
    if (role === 'farmer' && payment.farmerId !== userId) {
      throw new Error('Unauthorized access to farmer payment.');
    }

    return payment;
  },

  /**
   * Initiate / create a payment for a buyer's order
   */
  async initiatePayment({ orderId, buyerId, paymentMethod }) {
    if (!orderId || !buyerId) {
      throw new Error('Order ID and Buyer ID are required.');
    }

    // Verify order ownership
    const order = getOrderByIdAndBuyer(orderId, buyerId);
    if (!order) {
      throw new Error('Order not found or unauthorized.');
    }

    return createOrderPayment({
      orderId: order.id,
      buyerId,
      paymentMethod,
    });
  },

  /**
   * Execute payment processing
   * Distinguishes payment initiated from payment actually successful.
   * If simulateFailure is requested, marks as failed.
   */
  async processPayment({ paymentId, buyerId, paymentMethod, simulateFailure = false }) {
    const payment = getPaymentById(paymentId, buyerId);
    if (!payment) {
      throw new Error('Payment record not found or unauthorized.');
    }

    if (simulateFailure) {
      return failOrderPayment(payment.id, 'Transaction declined by payment authority.');
    }

    // In a real gateway environment, gateway token/verification would happen here.
    // As per Requirement 10 & 25: We do not fabricate a fake bank transaction ID.
    // transactionId remains null (or null reference) until a real provider returns one.
    return completeOrderPayment(payment.id, {
      transactionId: null,
      method: paymentMethod || payment.paymentMethod,
    });
  },

  /**
   * Retry a failed payment
   */
  async retryPayment({ orderId, buyerId, paymentMethod }) {
    return this.initiatePayment({ orderId, buyerId, paymentMethod });
  },
};

export default paymentService;
