import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAvatarName, getBgColor } from "../../utils"
import { useDispatch } from "react-redux";
import { updateTable as updateTableRedux, setEditingOrder } from "../../redux/slices/customerSlice";
import { setCart } from "../../redux/slices/cartSlice";
import { updateTable, updateOrderStatus } from "../../https/index";
import { FaLongArrowAltRight, FaEdit, FaTrash } from "react-icons/fa";
import { enqueueSnackbar } from "notistack";
import axios from "axios";

const TableCard = ({ id, name, status, initials, seats, currentOrder, onUpdate, onEdit, onDelete }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isUpdating, setIsUpdating] = useState(false);
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);

  const handleClick = (name) => {
    if (status === "Booked") return;

    const table = { tableId: id, tableNo: name }
    dispatch(updateTableRedux({ table }))
    navigate(`/menu`);
  };

  const handleModifyOrder = (e) => {
    e.stopPropagation();

    dispatch(setEditingOrder({
      orderId: currentOrder._id,
      customerName: currentOrder.customerDetails?.name,
      customerPhone: currentOrder.customerDetails?.phone,
      guests: currentOrder.customerDetails?.guests,
      table: { tableId: id, tableNo: name }
    }));

    dispatch(setCart(currentOrder.items || []));
    navigate('/menu');
  };

  const handleMarkAvailable = async (e) => {
    e.stopPropagation();
    try {
      setIsUpdating(true);
      await updateTable({
        tableId: id,
        status: "Available",
        orderId: null
      });
      enqueueSnackbar("Table marked as available!", { variant: "success" });
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error(error);
      enqueueSnackbar("Failed to update table", { variant: "error" });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelOrder = async (e) => {
    e.stopPropagation();

    // Confirm cancellation
    if (!window.confirm("Are you sure you want to cancel this order? This action cannot be undone.")) {
      return;
    }

    try {
      setIsUpdating(true);

      // Update order status to Cancelled
      await axios.put(
        `http://localhost:3000/api/order/${currentOrder._id}`,
        { orderStatus: "Cancelled" },
        { withCredentials: true }
      );

      // Free the table
      await updateTable({
        tableId: id,
        status: "Available",
        orderId: null
      });

      enqueueSnackbar("Order cancelled!", { variant: "success" });
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error(error);
      enqueueSnackbar("Failed to cancel order", { variant: "error" });
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePaymentClick = (e) => {
    e.stopPropagation();
    setShowPaymentOptions(true);
  };

  const handleCompletePayment = async (e) => {
    e.stopPropagation();
    if (!selectedPayment) {
      enqueueSnackbar("Please select a payment method!", { variant: "warning" });
      return;
    }

    try {
      setIsUpdating(true);

      await axios.put(
        `http://localhost:3000/api/order/${currentOrder._id}`,
        { orderStatus: "Completed", paymentMethod: selectedPayment },
        { withCredentials: true }
      );

      await updateTable({
        tableId: id,
        status: "Available",
        orderId: null
      });

      // Auto-print receipt after successful payment
      printReceiptWithPayment(selectedPayment);

      enqueueSnackbar(`Payment received via ${selectedPayment}!`, { variant: "success" });
      setShowPaymentOptions(false);
      setSelectedPayment(null);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error(error);
      enqueueSnackbar("Failed to complete payment", { variant: "error" });
    } finally {
      setIsUpdating(false);
    }
  };

  // Function to print receipt with payment method (for auto-print after payment)
  const printReceiptWithPayment = (paymentMethod) => {
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

    const totalQuantity = currentOrder?.items?.reduce((sum, item) => sum + (item.quantity || 1), 0) || 0;
    const billNumber = currentOrder?.orderNumber || Math.floor(currentDate.getTime() / 1000);

    const receiptContent = `
      <html>
        <head>
          <title>Receipt - Table ${name}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            @page { size: 80mm auto !important; margin: 0 !important; }
            @media print {
              html, body { width: 80mm !important; height: auto !important; margin: 0 !important; padding: 0 !important; }
            }
            html { height: auto; }
            body { font-family: 'Courier New', monospace; width: 80mm; height: auto; padding: 3mm 4mm; font-size: 12px; line-height: 1.4; margin: 0; font-weight: bold; }
            .header { text-align: center; margin-bottom: 6px; }
            .logo { width: 50px; height: auto; display: block; margin: 0 auto 4px auto; }
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
          <div class="customer-name"><strong>Name:</strong> ${currentOrder?.customerDetails?.name || 'Guest'}</div>
          <div class="divider"></div>
          <div class="info-row">
            <span>${formattedDate} ${formattedTime}</span>
            <span>Dine In: Table ${name}</span>
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
              ${currentOrder?.items?.map((item, index) => `
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
            <span>₹${currentOrder?.bills?.total?.toFixed(2) || '0.00'}</span>
          </div>
          <div class="total-row grand">
            <span>Grand Total</span>
            <span>₹${currentOrder?.bills?.total?.toFixed(2) || '0.00'}</span>
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

  return (
    <div onClick={() => handleClick(name)} key={id} className="w-full hover:bg-[#2c2c2c] bg-[#262626] p-4 rounded-lg cursor-pointer relative group">
      {/* Edit/Delete buttons */}
      {status !== "Booked" && onEdit && onDelete && (
        <div className="absolute top-3 right-3 flex gap-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="p-2 bg-blue-600 rounded-lg text-white hover:bg-blue-500 shadow-lg"
            title="Edit Table"
          >
            <FaEdit size={12} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-2 bg-red-600 rounded-lg text-white hover:bg-red-500 shadow-lg"
            title="Delete Table"
          >
            <FaTrash size={12} />
          </button>
        </div>
      )}
      <div className="flex items-center justify-between px-1">
        <h1 className="text-[#f5f5f5] text-xl font-semibold">Table <FaLongArrowAltRight className="text-[#ababab] ml-2 inline" /> {name}</h1>
        <p className={`${status === "Booked" ? "text-green-600 bg-[#2e4a40]" : "bg-[#664a04] text-white"} px-2 py-1 rounded-lg text-sm`}>
          {status}
        </p>
      </div>
      <div className="flex items-center justify-center mt-5 mb-4">
        <h1 className={`text-white rounded-full p-5 text-xl`} style={{ backgroundColor: initials ? getBgColor() : "#1f1f1f" }} >{getAvatarName(initials) || "N/A"}</h1>
      </div>
      <p className="text-[#ababab] text-xs">Seats: <span className="text-[#f5f5f5]">{seats}</span></p>

      {/* Order Details for Booked Tables */}
      {status === "Booked" && currentOrder && (
        <div className="mt-3 pt-3 border-t border-[#3a3a3a]">
          <p className="text-[#ababab] text-xs mb-1">Customer: <span className="text-[#f5f5f5]">{currentOrder.customerDetails?.name || "N/A"}</span></p>
          <p className="text-[#ababab] text-xs mb-1">Items: <span className="text-[#f5f5f5]">{currentOrder.items?.length || 0}</span></p>
          <p className="text-[#ababab] text-xs mb-1">Status: <span className="text-yellow-500">{currentOrder.orderStatus || "N/A"}</span></p>
          <p className="text-[#ababab] text-xs mb-2">Total: <span className="text-green-500 font-semibold text-lg">₹{currentOrder.bills?.total?.toFixed(2) || "0.00"}</span></p>

          {/* Payment Options */}
          {showPaymentOptions ? (
            <div className="mt-2 p-2 bg-[#1a1a1a] rounded-lg" onClick={(e) => e.stopPropagation()}>
              <p className="text-[#ababab] text-xs mb-2">Select Payment:</p>
              <div className="flex gap-2 mb-2">
                <button
                  onClick={(e) => { e.stopPropagation(); setSelectedPayment("Cash"); }}
                  className={`flex-1 py-2 rounded-lg font-semibold text-sm transition-all ${selectedPayment === "Cash"
                    ? "bg-green-600 text-white"
                    : "bg-[#333] text-[#ababab] hover:bg-[#444]"
                    }`}
                >
                  Cash
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setSelectedPayment("UPI"); }}
                  className={`flex-1 py-2 rounded-lg font-semibold text-sm transition-all ${selectedPayment === "UPI"
                    ? "bg-purple-600 text-white"
                    : "bg-[#333] text-[#ababab] hover:bg-[#444]"
                    }`}
                >
                  UPI
                </button>
              </div>
              <button
                onClick={handleCompletePayment}
                disabled={!selectedPayment || isUpdating}
                className="w-full py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-semibold text-sm disabled:opacity-50"
              >
                {isUpdating ? "..." : "✓ Complete Payment"}
              </button>
            </div>
          ) : (
            <div className="space-y-2 mt-2">
              {/* Modify Order Button */}
              <button
                onClick={handleModifyOrder}
                className="w-full py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg font-semibold text-sm"
              >
                Modify Order
              </button>
              <div className="flex gap-2">
                {/* Collect Payment Button */}
                <button
                  onClick={handlePaymentClick}
                  disabled={isUpdating}
                  className="flex-1 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-semibold text-sm disabled:opacity-50"
                >
                  Payment
                </button>
                {/* Cancel Order Button */}
                <button
                  onClick={handleCancelOrder}
                  disabled={isUpdating}
                  className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-semibold text-sm disabled:opacity-50"
                >
                  {isUpdating ? "..." : "❌ Cancel"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TableCard;
