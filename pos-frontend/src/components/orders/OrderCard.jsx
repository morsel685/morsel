import React, { useState } from "react";
import { FaCheckDouble, FaLongArrowAltRight } from "react-icons/fa";
import { FaCircle } from "react-icons/fa";
import { formatDateAndTime, getAvatarName } from "../../utils/index";
import { updateOrderStatus, updateTable } from "../../https/index";
import { enqueueSnackbar } from "notistack";
import axios from "axios";

const OrderCard = ({ order, onUpdate }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);

  const handleStatusUpdate = async (newStatus) => {
    // If completing order and no payment selected, show payment options
    if (newStatus === "Completed" && !order.paymentMethod && !selectedPayment) {
      setShowPaymentOptions(true);
      return;
    }

    try {
      setIsUpdating(true);

      // If completing with payment selection, update payment method first
      if (newStatus === "Completed" && selectedPayment) {
        await axios.put(
          `http://localhost:3000/api/order/${order._id}`,
          { orderStatus: newStatus, paymentMethod: selectedPayment },
          { withCredentials: true }
        );

        // Auto-print receipt after successful payment
        printReceipt(selectedPayment);
      } else {
        await updateOrderStatus({ orderId: order._id, orderStatus: newStatus });
      }

      // If order is completed, mark the table as Available
      if (newStatus === "Completed" && order.table?._id) {
        await updateTable({
          tableId: order.table._id,
          status: "Available",
          orderId: null
        });
      }

      enqueueSnackbar(`Order marked as ${newStatus}!`, { variant: "success" });
      setShowPaymentOptions(false);
      setSelectedPayment(null);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error(error);
      enqueueSnackbar("Failed to update order status", { variant: "error" });
    } finally {
      setIsUpdating(false);
    }
  };

  // Function to print receipt
  const printReceipt = (paymentMethod) => {
    const currentDate = new Date(); // Use current date/time for printing
    const formattedDate = currentDate.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    const formattedTime = currentDate.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    const totalQuantity = order?.items?.reduce((sum, item) => sum + (item.quantity || 1), 0) || 0;
    const billNumber = order?.orderNumber || Math.floor(currentDate.getTime() / 1000);
    const orderType = order.table?.tableNo ? `Dine In: Table ${order.table.tableNo}` : "Take Away";

    const receiptContent = `
      <html>
        <head>
          <title>Receipt - ${order.customerDetails?.name || 'Guest'}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            @page { size: 80mm auto !important; margin: 0 !important; }
            @media print {
              html, body { width: 80mm !important; height: auto !important; margin: 0 !important; padding: 0 !important; }
            }
            html { height: auto; }
            body { font-family: 'Courier New', monospace; width: 80mm; height: auto; padding: 3mm 4mm; font-size: 12px; line-height: 1.4; margin: 0; font-weight: bold; }
            .header { text-align: center; margin-bottom: 6px; }
            .restaurant-name { font-size: 18px; font-weight: bold; margin-bottom: 2px; }
            .address, .contact { font-size: 11px; margin-bottom: 1px; font-weight: bold; }
            .divider { border-top: 2px dashed #000; margin: 4px 0; }
            .info-row { display: flex; justify-content: space-between; font-size: 11px; margin: 2px 0; font-weight: bold; }
            .customer-name { font-size: 12px; margin: 4px 0; font-weight: bold; }
            .items-table { width: 100%; border-collapse: collapse; margin: 4px 0; font-size: 11px; font-weight: bold; }
            .items-table th { text-align: left; font-weight: bold; padding: 2px 1px; border-bottom: 2px solid #000; }
            .items-table td { padding: 2px 1px; font-size: 11px; font-weight: bold; }
            .items-table .sn { width: 8%; text-align: center; }
            .items-table .item { width: 38%; }
            .items-table .qty { width: 12%; text-align: center; }
            .items-table .rate { width: 20%; text-align: right; }
            .items-table .amount { width: 22%; text-align: right; }
            .total-row { display: flex; justify-content: space-between; font-size: 12px; margin: 3px 0; font-weight: bold; }
            .total-row.grand { font-weight: bold; font-size: 14px; border-top: 2px solid #000; padding-top: 5px; margin-top: 5px; }
            .payment-row, .fssai, .thank-you { text-align: center; font-size: 12px; margin: 5px 0; font-weight: bold; }
            .fssai { font-size: 10px; margin-top: 10px; font-weight: bold; }
            .thank-you { font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="restaurant-name">MORSEL</div>
            <div class="address">B-4/67 Kalyani, Nadia, 741235</div>
            <div class="contact">Mobile: 7003655540</div>
          </div>
          <div class="divider"></div>
          <div class="customer-name"><strong>Name:</strong> ${order?.customerDetails?.name || 'Guest'}</div>
          <div class="divider"></div>
          <div class="info-row">
            <span>${formattedDate} ${formattedTime}</span>
            <span>${orderType}</span>
          </div>
          <div class="info-row">
            <span>Cashier: Staff</span>
            <span>Bill No.: ${billNumber}</span>
          </div>
          <div class="divider"></div>
          <table class="items-table">
            <thead>
              <tr>
                <th class="sn">SN</th>
                <th class="item">Item</th>
                <th class="qty">Qty</th>
                <th class="rate">Price</th>
                <th class="amount">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${order?.items?.map((item, index) => `
                <tr>
                  <td class="sn">${index + 1}</td>
                  <td class="item">${item.name}</td>
                  <td class="qty">${item.quantity || 1}</td>
                  <td class="rate">₹${(item.pricePerQuantity || item.price / (item.quantity || 1)).toFixed(2)}</td>
                  <td class="amount">₹${item.price?.toFixed(2)}</td>
                </tr>
              `).join('') || ''}
            </tbody>
          </table>
          <div class="divider"></div>
          <div class="total-row">
            <span>Total Qty: ${totalQuantity}</span>
            <span>Sub Total</span>
            <span>₹${order?.bills?.total?.toFixed(2) || '0.00'}</span>
          </div>
          <div class="total-row grand">
            <span>Grand Total</span>
            <span>₹${order?.bills?.total?.toFixed(2) || '0.00'}</span>
          </div>
          <div class="divider"></div>
          <div class="payment-row"><strong>Payment Mode:</strong> ${paymentMethod}</div>
          <div class="divider"></div>
          <div class="fssai">FSSAI Lic No.: 22824123000364</div>
          <div class="thank-you">Thank You! Visit Again!!!</div>
        </body>
      </html>
    `;

    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'absolute';
    printFrame.style.top = '-10000px';
    printFrame.style.left = '-10000px';
    printFrame.style.width = '80mm';
    printFrame.style.height = '0';
    document.body.appendChild(printFrame);

    const printDocument = printFrame.contentDocument || printFrame.contentWindow.document;
    printDocument.write(receiptContent);
    printDocument.close();

    printFrame.onload = () => {
      setTimeout(() => {
        printFrame.contentWindow.focus();
        printFrame.contentWindow.print();
        setTimeout(() => {
          document.body.removeChild(printFrame);
        }, 1000);
      }, 250);
    };
  };

  const getNextStatus = () => {
    const currentStatus = order.orderStatus?.toLowerCase();
    if (currentStatus === "cancelled") return null;
    if (currentStatus === "completed") return null;
    if (currentStatus === "in progress") return "Ready";
    if (currentStatus === "ready") return "Completed";
    return null;
  };

  const nextStatus = getNextStatus();

  return (
    <div className="w-full bg-[#262626] p-4 rounded-lg mb-4">
      <div className="flex items-center gap-5">
        <button className="bg-[#f6b100] p-3 text-xl font-bold rounded-lg">
          {getAvatarName(order.customerDetails?.name || "?")}
        </button>
        <div className="flex items-center justify-between w-[100%]">
          <div className="flex flex-col items-start gap-1">
            <h1 className="text-[#f5f5f5] text-lg font-semibold tracking-wide">
              {order.customerDetails?.name || "Unknown"}
            </h1>
            <p className="text-[#ababab] text-sm">
              #{order.orderNumber || order._id?.slice(-8).toUpperCase()} / {order.orderType || "Dine In"}
            </p>
            {order.table?.tableNo && (
              <p className="text-[#ababab] text-sm">Table <FaLongArrowAltRight className="text-[#ababab] ml-2 inline" /> {order.table.tableNo}</p>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            {order.orderStatus?.toLowerCase() === "completed" ? (
              <>
                <p className="text-green-500 bg-[#1a3a1a] px-2 py-1 rounded-lg">
                  <FaCheckDouble className="inline mr-2" /> Completed
                </p>
                <p className="text-[#ababab] text-sm">
                  <FaCircle className="inline mr-2 text-green-500" /> {order.paymentMethod || "Paid"}
                </p>
              </>
            ) : order.orderStatus?.toLowerCase() === "cancelled" ? (
              <>
                <p className="text-red-500 bg-[#3a1a1a] px-2 py-1 rounded-lg">
                  ❌ Cancelled
                </p>
                <p className="text-[#ababab] text-sm">
                  <FaCircle className="inline mr-2 text-red-500" /> Order was cancelled
                </p>
              </>
            ) : order.orderStatus?.toLowerCase() === "ready" ? (
              <>
                <p className="text-green-600 bg-[#2e4a40] px-2 py-1 rounded-lg">
                  <FaCheckDouble className="inline mr-2" /> Ready
                </p>
                <p className="text-[#ababab] text-sm">
                  <FaCircle className="inline mr-2 text-green-600" /> Ready to serve
                </p>
              </>
            ) : (
              <>
                <p className="text-yellow-600 bg-[#4a452e] px-2 py-1 rounded-lg">
                  <FaCircle className="inline mr-2" /> In Progress
                </p>
                <p className="text-[#ababab] text-sm">
                  <FaCircle className="inline mr-2 text-yellow-600" /> Preparing your order
                </p>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="flex justify-between items-center mt-4 text-[#ababab]">
        <p>{formatDateAndTime(order.orderDate)}</p>
        <p>{order.items?.length || 0} Items</p>
      </div>
      <hr className="w-full mt-4 border-t-1 border-gray-500" />
      <div className="flex items-center justify-between mt-4">
        <h1 className="text-[#f5f5f5] text-lg font-semibold">Total</h1>
        <p className="text-[#f5f5f5] text-lg font-semibold">₹{order.bills?.total?.toFixed(2) || "0.00"}</p>
      </div>

      {/* Payment Selection for Completing Orders */}
      {showPaymentOptions && nextStatus === "Completed" && (
        <div className="mt-4 p-3 bg-[#1a1a1a] rounded-lg">
          <p className="text-[#ababab] text-sm mb-3">Select Payment Method:</p>
          <div className="flex gap-3 mb-3">
            <button
              onClick={() => setSelectedPayment("Cash")}
              className={`flex-1 py-2 rounded-lg font-semibold transition-all ${selectedPayment === "Cash"
                ? "bg-green-600 text-white"
                : "bg-[#333] text-[#ababab] hover:bg-[#444]"
                }`}
            >
              Cash
            </button>
            <button
              onClick={() => setSelectedPayment("UPI")}
              className={`flex-1 py-2 rounded-lg font-semibold transition-all ${selectedPayment === "UPI"
                ? "bg-purple-600 text-white"
                : "bg-[#333] text-[#ababab] hover:bg-[#444]"
                }`}
            >
              UPI
            </button>
          </div>
          <button
            onClick={() => handleStatusUpdate("Completed")}
            disabled={!selectedPayment || isUpdating}
            className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUpdating ? "Processing..." : "Complete Order"}
          </button>
        </div>
      )}

      {/* Status Update Button */}
      {nextStatus && !showPaymentOptions && (
        <button
          onClick={() => handleStatusUpdate(nextStatus)}
          disabled={isUpdating}
          className={`w-full mt-4 py-3 rounded-lg font-semibold text-lg transition-all ${nextStatus === "Ready"
            ? "bg-green-600 hover:bg-green-500 text-white"
            : "bg-blue-600 hover:bg-blue-500 text-white"
            } ${isUpdating ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {isUpdating ? "Updating..." : `Mark as ${nextStatus}`}
        </button>
      )}

      {/* Print Bill Button for Completed Orders */}
      {order.orderStatus?.toLowerCase() === "completed" && (
        <button
          onClick={() => printReceipt(order.paymentMethod || "Paid")}
          className="w-full mt-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold text-lg transition-all"
        >
          🖨️ Print Bill
        </button>
      )}
    </div>
  );
};

export default OrderCard;
