import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setEditingOrder, clearEditingOrder, removeCustomer } from "../../redux/slices/customerSlice";
import { setCart, removeAllItems } from "../../redux/slices/cartSlice";
import { updateOrder } from "../../https/index";
import { enqueueSnackbar } from "notistack";
import { MdTakeoutDining } from "react-icons/md";
import { FaCircle } from "react-icons/fa";
import receiptLogo from "../../assets/images/receipt_logo.png";
import { formatDateAndTime } from "../../utils/index";

const TakeAwayCard = ({ order, onUpdate }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isUpdating, setIsUpdating] = useState(false);
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);

  const handleModifyOrder = (e) => {
    e.stopPropagation();

    dispatch(setEditingOrder({
      orderId: order._id,
      customerName: order.customerDetails?.name,
      customerPhone: order.customerDetails?.phone,
      guests: order.customerDetails?.guests || 1,
      table: null,
      orderType: "Take Away",
      originalItems: order.items || []
    }));

    dispatch(setCart(order.items || []));
    navigate('/menu');
  };

  const handleCancelOrder = async (e) => {
    e.stopPropagation();

    if (!window.confirm("Are you sure you want to cancel this Take Away order?")) {
      return;
    }

    try {
      setIsUpdating(true);
      await updateOrder(order._id, { orderStatus: "Cancelled" });

      dispatch(clearEditingOrder());
      dispatch(removeCustomer());
      dispatch(removeAllItems());

      enqueueSnackbar("Take Away order cancelled!", { variant: "success" });
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

      await updateOrder(order._id, {
        orderStatus: "Completed",
        paymentMethod: selectedPayment
      });

      dispatch(clearEditingOrder());
      dispatch(removeCustomer());
      dispatch(removeAllItems());

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

  const printReceiptWithPayment = (paymentMethod) => {
    const currentDate = new Date();
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

    const receiptContent = `
      <html>
        <head>
          <title>Receipt - Take Away #${billNumber}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            @page { size: 80mm auto; margin: 0; }
            @media print {
              html, body { width: 80mm !important; margin: 0 !important; padding: 0 !important; }
              .receipt-container {
                width: 74mm !important;
                max-width: 74mm !important;
                margin-left: 1mm !important;
                padding: 1mm 1.5mm !important;
              }
            }
            html, body {
              width: 80mm;
              margin: 0;
              padding: 0;
              background: #fff;
              color: #000;
            }
            body {
              font-family: 'Courier New', Courier, monospace;
              font-size: 11.5px;
              line-height: 1.35;
              font-weight: 600;
            }
            .receipt-container {
              width: 74mm;
              max-width: 74mm;
              margin-left: 1mm;
              padding: 1mm 1.5mm;
              box-sizing: border-box;
              overflow-x: hidden;
            }
            .header { text-align: center; margin-bottom: 4px; }
            .logo { width: 110px; height: auto; display: block; margin: 0 auto 3px auto; }
            .address, .contact { font-size: 10.5px; margin-bottom: 1px; font-weight: 600; line-height: 1.25; }
            .divider { border-top: 1px dashed #000; margin: 4px 0; }
            .info-row { display: flex; justify-content: space-between; font-size: 11px; margin: 1.5px 0; font-weight: 600; }
            .customer-name { font-size: 11.5px; margin: 2px 0; font-weight: 600; }
            .items-table { width: 100%; table-layout: fixed; border-collapse: collapse; margin: 4px 0; font-size: 10px; font-weight: 600; }
            .items-table th { text-align: left; font-weight: bold; padding: 2px 1px; border-bottom: 1px dashed #000; font-size: 10px; }
            .items-table td { padding: 2px 1px; font-size: 10px; vertical-align: top; }
            .items-table .sn { width: 6%; text-align: left; }
            .items-table .item { width: 40%; word-break: break-word; padding-right: 2px; }
            .items-table .qty { width: 10%; text-align: center; }
            .items-table .rate { width: 22%; text-align: right; white-space: nowrap; padding-right: 8px; }
            .items-table .amount { width: 22%; text-align: right; white-space: nowrap; }
            .total-row { display: flex; justify-content: space-between; font-size: 11.5px; margin: 2px 0; font-weight: 600; }
            .total-row.grand { font-weight: bold; font-size: 13px; border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 3px 0; margin: 3px 0; }
            .payment-row { text-align: center; font-size: 11px; margin: 3px 0; font-weight: 600; }
            .fssai { text-align: center; font-size: 10px; margin-top: 4px; font-weight: 600; }
            .thank-you { text-align: center; font-size: 11.5px; font-weight: bold; margin-top: 3px; }
          </style>
        </head>
        <body>
          <div class="receipt-container">
            <div class="header">
              <img class="logo" src="${receiptLogo}" alt="Morsel Logo" />
              <div class="address">B-4/67 Kalyani, Nadia, 741235</div>
              <div class="contact">Mobile: 7003655540</div>
            </div>
            <div class="divider"></div>
            <div class="customer-name"><strong>Customer:</strong> ${order?.customerDetails?.name || 'Take Away'}</div>
            ${order?.customerDetails?.phone ? `<div class="info-row"><span>Phone: ${order.customerDetails.phone}</span></div>` : ''}
            <div class="divider"></div>
            <div class="info-row">
              <span>Date: ${formattedDate} ${formattedTime}</span>
            </div>
            <div class="info-row">
              <span><strong>*** TAKE AWAY (PARCEL) ***</strong></span>
              <span>Bill No: ${billNumber}</span>
            </div>
            <div class="info-row">
              <span>Cashier: Staff</span>
            </div>
            <div class="divider"></div>
            <table class="items-table">
              <thead>
                <tr>
                  <th class="sn">#</th>
                  <th class="item">Item</th>
                  <th class="qty">Qty</th>
                  <th class="rate">Price</th>
                  <th class="amount">Total</th>
                </tr>
              </thead>
              <tbody>
                ${order?.items?.map((item, index) => `
                  <tr>
                    <td class="sn">${index + 1}</td>
                    <td class="item">${item.name}${item.notes ? ` (${item.notes})` : ''}</td>
                    <td class="qty">${item.quantity || 1}</td>
                    <td class="rate">₹${((item.price || 0) / (item.quantity || 1)).toFixed(2)}</td>
                    <td class="amount">₹${(item.price || 0).toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <div class="divider"></div>
            <div class="total-row">
              <span>Total Qty: ${totalQuantity}</span>
              <span>Sub Total: ₹${(order?.bills?.total || 0).toFixed(2)}</span>
            </div>
            <div class="total-row grand">
              <span>GRAND TOTAL</span>
              <span>₹${(order?.bills?.totalWithTax || order?.bills?.total || 0).toFixed(2)}</span>
            </div>
            <div class="payment-row">
              Payment Method: <strong>${paymentMethod}</strong> (PAID)
            </div>
            <div class="fssai">FSSAI Lic No: 22824123000364</div>
            <div class="thank-you">THANK YOU! VISIT AGAIN</div>
          </div>
        </body>
      </html>
    `;

    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
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

  const orderNumDisplay = order.orderNumber ? `#${order.orderNumber}` : `#${order._id?.slice(-4).toUpperCase()}`;

  return (
    <div
      onClick={handleModifyOrder}
      className="w-full hover:bg-[#2c2c2c] bg-[#262626] p-4 rounded-lg cursor-pointer relative group border border-orange-500/30 hover:border-orange-500 transition shadow-lg flex flex-col justify-between"
      title="Click to modify this Take Away order"
    >
      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-1.5 px-1 min-h-[28px]">
          <span className="bg-[#78350f] text-orange-200 border border-orange-500/40 px-2 py-0.5 rounded-lg text-xs font-bold flex items-center gap-1">
            <MdTakeoutDining className="text-sm" /> Take Away
          </span>
          <p className="bg-[#4a452e] text-yellow-400 px-2.5 py-1 rounded-lg text-xs font-semibold">
            {order.orderStatus || "In Progress"}
          </p>
        </div>

        {/* Center Circle with Takeout Icon and Order # */}
        <div className="flex items-center justify-center my-3">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#1f1f1f] border-2 border-orange-500/60 group-hover:border-orange-400 flex flex-col items-center justify-center p-2 text-center shadow-inner transition-colors">
            <span className="text-xl sm:text-2xl select-none">🥡</span>
            <span className="text-xs sm:text-sm font-bold text-yellow-400 leading-tight select-none mt-0.5 truncate max-w-[76px]">
              {orderNumDisplay}
            </span>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-1 text-xs">
          <p className="text-[#ababab]">
            Customer: <span className="text-[#f5f5f5] font-semibold">{order.customerDetails?.name || "Take Away Customer"}</span>
          </p>
          {order.customerDetails?.phone && (
            <p className="text-[#ababab]">
              Phone: <span className="text-[#f5f5f5]">{order.customerDetails.phone}</span>
            </p>
          )}
          <p className="text-[#ababab]">
            Time: <span className="text-[#f5f5f5]">{formatDateAndTime(order.createdAt || order.orderDate)}</span>
          </p>
          <p className="text-[#ababab]">
            Items: <span className="text-[#f5f5f5] font-medium">{order.items?.length || 0} items</span>
          </p>

          {/* Items Summary Preview */}
          {order.items && order.items.length > 0 && (
            <div className="my-2 p-2 bg-[#1b1b1b] rounded-lg max-h-20 overflow-y-auto text-[11px] text-gray-300 space-y-1 border border-[#333]">
              {order.items.map((it, idx) => (
                <div key={idx} className="flex justify-between items-center">
                  <span className="truncate pr-2">{it.quantity}x {it.name}</span>
                  <span className="text-yellow-400 font-semibold flex-shrink-0">₹{it.price}</span>
                </div>
              ))}
            </div>
          )}

          <p className="text-[#ababab] pt-1">
            Total: <span className="text-green-500 font-bold text-lg">₹{order.bills?.total?.toFixed(2) || "0.00"}</span>
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-3 pt-2 border-t border-[#3a3a3a]">
        {showPaymentOptions ? (
          <div className="p-2 bg-[#1a1a1a] rounded-lg" onClick={(e) => e.stopPropagation()}>
            <p className="text-[#ababab] text-xs mb-2 font-medium">Select Payment Method:</p>
            <div className="flex gap-2 mb-2">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setSelectedPayment("Cash"); }}
                className={`flex-1 py-1.5 rounded-lg font-semibold text-xs sm:text-sm transition-all ${
                  selectedPayment === "Cash" ? "bg-green-600 text-white font-bold" : "bg-[#333] text-[#ababab] hover:bg-[#444]"
                }`}
              >
                Cash
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setSelectedPayment("UPI"); }}
                className={`flex-1 py-1.5 rounded-lg font-semibold text-xs sm:text-sm transition-all ${
                  selectedPayment === "UPI" ? "bg-purple-600 text-white font-bold" : "bg-[#333] text-[#ababab] hover:bg-[#444]"
                }`}
              >
                UPI
              </button>
            </div>
            <button
              type="button"
              onClick={handleCompletePayment}
              disabled={!selectedPayment || isUpdating}
              className="w-full py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold text-xs sm:text-sm disabled:opacity-50 transition active:scale-95"
            >
              {isUpdating ? "Processing..." : "✓ Pay & Print Receipt"}
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <button
              type="button"
              onClick={handleModifyOrder}
              className="w-full py-1.5 bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg font-semibold text-xs sm:text-sm transition active:scale-95"
            >
              Modify Order
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handlePaymentClick}
                disabled={isUpdating}
                className="flex-1 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded-lg font-semibold text-xs sm:text-sm disabled:opacity-50 transition active:scale-95"
              >
                Payment
              </button>
              <button
                type="button"
                onClick={handleCancelOrder}
                disabled={isUpdating}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg font-semibold text-xs sm:text-sm disabled:opacity-50 transition active:scale-95"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TakeAwayCard;
