import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getTotalPrice } from "../../redux/slices/cartSlice";
import { addOrder, updateTable, updateOrder } from "../../https/index";
import { enqueueSnackbar } from "notistack";
import { useMutation } from "@tanstack/react-query";
import { removeAllItems } from "../../redux/slices/cartSlice";
import { removeCustomer, clearEditingOrder } from "../../redux/slices/customerSlice";
import Invoice from "../invoice/Invoice";
import { useNavigate } from "react-router-dom";

const getKotDifference = (newItems, oldItems) => {
  const diff = [];
  newItems.forEach(newItem => {
    const newNote = (newItem.notes || '').trim().toLowerCase();
    const oldItem = oldItems.find(item => 
      item.name === newItem.name && (item.notes || '').trim().toLowerCase() === newNote
    );
    if (!oldItem) {
      // Completely new item or new note instruction
      diff.push({ ...newItem });
    } else if (newItem.quantity > oldItem.quantity) {
      // Quantity increased for this note
      diff.push({
        ...newItem,
        quantity: newItem.quantity - oldItem.quantity
      });
    }
  });
  return diff;
};

const printKOTReceipt = (order, kotItems, tableNo = null) => {
  if (!kotItems || kotItems.length === 0) return;

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

  const orderNumber = order?.orderNumber || order?._id?.slice(-8).toUpperCase();
  const orderType = tableNo ? `Dine In: Table ${tableNo}` : (order.orderType || "Dine In");

  const kotContent = `
    <html>
      <head>
        <title>KOT - ${orderNumber}</title>
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
            font-size: 12px;
            line-height: 1.35;
            font-weight: bold;
          }
          .receipt-container {
            width: 74mm;
            max-width: 74mm;
            margin-left: 1mm;
            padding: 1mm 1.5mm;
            box-sizing: border-box;
            overflow-x: hidden;
          }
          .header { text-align: center; margin-bottom: 5px; }
          .title { font-size: 15px; font-weight: bold; border: 2px solid #000; padding: 4px; margin-bottom: 4px; }
          .divider { border-top: 2px dashed #000; margin: 4px 0; }
          .info-row { display: flex; justify-content: space-between; font-size: 11.5px; margin: 2px 0; font-weight: bold; }
          .items-table { width: 100%; table-layout: fixed; border-collapse: collapse; margin: 5px 0; font-size: 12px; font-weight: bold; }
          .items-table th { text-align: left; font-weight: bold; padding: 3px 1px; border-bottom: 2px solid #000; font-size: 12px; }
          .items-table td { padding: 3px 1px; font-size: 12.5px; font-weight: bold; }
          .items-table .sn { width: 10%; text-align: center; }
          .items-table .item { width: 68%; word-break: break-word; }
          .items-table .qty { width: 22%; text-align: center; font-size: 14px; }
          .footer { text-align: center; font-size: 11px; margin-top: 8px; border-top: 1px dashed #000; padding-top: 4px; }
        </style>
      </head>
      <body>
        <div class="receipt-container">
          <div class="header">
            <div class="title">KITCHEN ORDER TICKET</div>
          </div>
          <div class="info-row">
            <span>Date: ${formattedDate} ${formattedTime}</span>
          </div>
          <div class="info-row">
            <span>KOT No: ${orderNumber}</span>
            <span>${orderType}</span>
          </div>
          <div class="divider"></div>
          <table class="items-table">
            <thead>
              <tr>
                <th class="sn">SN</th>
                <th class="item">Item Description</th>
                <th class="qty">Qty</th>
              </tr>
            </thead>
            <tbody>
              ${kotItems.map((item, index) => `
                <tr>
                  <td class="sn">${index + 1}</td>
                  <td class="item">
                    ${item.name}
                    ${item.notes ? `<div style="font-size: 11px; font-weight: normal; font-style: italic; margin-top: 2px;">* Note: ${item.notes}</div>` : ''}
                  </td>
                  <td class="qty">${item.quantity}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="divider"></div>
          <div class="footer">
            *** KOT - Send to Kitchen ***
          </div>
        </div>
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
  printDocument.write(kotContent);
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

const Bill = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const customerData = useSelector((state) => state.customer);
  const cartData = useSelector((state) => state.cart);
  const total = useSelector(getTotalPrice);
  // Tax removed for now
  const tax = 0;
  const totalPriceWithTax = total;

  const [showInvoice, setShowInvoice] = useState(false);
  const [orderInfo, setOrderInfo] = useState();
  const [isUpdating, setIsUpdating] = useState(false);

  // Check if we're editing an existing order
  const isEditing = !!customerData.editingOrderId;
  const isTakeAway = customerData.orderType === "Take Away";

  const handleSaveOrder = async () => {
    // Validate table selection only for Dine In
    if (!isTakeAway && (!customerData.table || !customerData.table.tableId)) {
      enqueueSnackbar("Please select a table for Dine In orders!", {
        variant: "warning",
      });
      return;
    }

    // Validate cart
    if (!cartData || cartData.length === 0) {
      enqueueSnackbar("Please add items to cart!", {
        variant: "warning",
      });
      return;
    }

    if (isEditing) {
      // Update existing order
      try {
        setIsUpdating(true);
        const res = await updateOrder(
          customerData.editingOrderId,
          {
            items: cartData,
            orderType: customerData.orderType,
            bills: {
              total: total,
              tax: tax,
              totalWithTax: totalPriceWithTax,
            },
            customerDetails: {
              name: customerData.customerName || "Walk-in Customer",
              phone: customerData.customerPhone || "",
              guests: customerData.guests || 1,
            },
          }
        );

        const updatedOrder = res.data?.data || {};
        const originalItems = customerData.originalItems || [];
        const newKotItems = getKotDifference(cartData, originalItems);

        if (newKotItems.length > 0) {
          printKOTReceipt(updatedOrder, newKotItems, customerData.table?.tableNo);
        }

        enqueueSnackbar("Order Updated!", { variant: "success" });
        dispatch(clearEditingOrder());
        dispatch(removeCustomer());
        dispatch(removeAllItems());
        navigate('/tables');
      } catch (error) {
        console.log(error);
        enqueueSnackbar("Failed to update order!", { variant: "error" });
      } finally {
        setIsUpdating(false);
      }
    } else {
      // Place new order
      try {
        const orderData = {
          customerDetails: {
            name: customerData.customerName || "Walk-in Customer",
            phone: customerData.customerPhone || "",
            guests: customerData.guests || 1,
          },
          orderType: customerData.orderType,
          orderStatus: "In Progress",
          bills: {
            total: total,
            tax: tax,
            totalWithTax: totalPriceWithTax,
          },
          items: cartData,
        };

        // Only include table for Dine In orders
        if (!isTakeAway && customerData.table?.tableId) {
          orderData.table = customerData.table.tableId;
        }

        orderMutation.mutate(orderData);
      } catch (error) {
        console.log(error);
        enqueueSnackbar("Failed to save order!", {
          variant: "error",
        });
      }
    }
  };

  const orderMutation = useMutation({
    mutationFn: (reqData) => addOrder(reqData),
    onSuccess: (resData) => {
      const { data } = resData.data;
      console.log(data);

      setOrderInfo(data);

      // Trigger KOT print for the entire new order
      printKOTReceipt(data, data.items, customerData.table?.tableNo);

      if (isTakeAway) {
        // For Take Away, just show success and clear cart
        enqueueSnackbar("Take Away Order Placed!", { variant: "success" });
        dispatch(removeCustomer());
        dispatch(removeAllItems());
        navigate('/orders');
      } else {
        // For Dine In, update table status
        const tableData = {
          status: "Booked",
          orderId: data._id,
          tableId: data.table,
        };
        tableUpdateMutation.mutate(tableData);
      }
    },
    onError: (error) => {
      console.log(error);
      enqueueSnackbar(error.response?.data?.message || "Failed to save order!", { variant: "error" });
    },
  });

  const tableUpdateMutation = useMutation({
    mutationFn: (reqData) => updateTable(reqData),
    onSuccess: (resData) => {
      console.log(resData);
      enqueueSnackbar("Order saved! Go to Tables to complete payment.", { variant: "success" });
      dispatch(removeCustomer());
      dispatch(removeAllItems());
      navigate('/tables');
    },
    onError: (error) => {
      console.log(error);
    },
  });

  return (
    <>
      <div className="flex items-center justify-between px-4 mt-1.5">
        <p className="text-xs text-[#ababab] font-medium">
          Items({cartData.length})
        </p>
        <h1 className="text-[#f5f5f5] text-sm font-bold">
          ₹{total.toFixed(2)}
        </h1>
      </div>
      <div className="flex items-center justify-between px-4 mt-1">
        <p className="text-xs text-[#ababab] font-medium">
          Grand Total
        </p>
        <h1 className="text-[#f5f5f5] text-base font-bold">
          ₹{totalPriceWithTax.toFixed(2)}
        </h1>
      </div>

      {/* Show order type and editing indicator */}
      <div className="mx-4 mt-2 flex gap-2">
        <div className={`flex-1 px-2.5 py-1.5 rounded-lg text-center ${isTakeAway ? "bg-orange-600/20 border border-orange-600" : "bg-green-600/20 border border-green-600"}`}>
          <p className={`text-xs font-semibold ${isTakeAway ? "text-orange-500" : "text-green-500"}`}>
            {isTakeAway ? "🥡 Take Away" : "🍽️ Dine In"}
          </p>
        </div>
        {isEditing && (
          <div className="flex-1 px-2.5 py-1.5 bg-yellow-600/20 border border-yellow-600 rounded-lg text-center">
            <p className="text-yellow-500 text-xs font-semibold">✏️ Editing</p>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 px-4 mt-2.5">
        <button
          onClick={handleSaveOrder}
          disabled={isUpdating}
          className={`px-4 py-2.5 w-full rounded-lg font-bold text-base shadow-md active:scale-95 transition ${isEditing
            ? "bg-yellow-600 text-white"
            : isTakeAway
              ? "bg-orange-500 text-white"
              : "bg-[#f6b100] text-[#1f1f1f]"
            } ${isUpdating ? "opacity-50" : ""}`}
        >
          {isUpdating ? "Saving..." : isEditing ? "Update Order" : isTakeAway ? "Place Take Away" : "Save & Go to Tables"}
        </button>
      </div>

      {showInvoice && (
        <Invoice orderInfo={orderInfo} setShowInvoice={setShowInvoice} />
      )}
    </>
  );
};

export default Bill;
