import React, { useRef } from "react";
import { motion } from "framer-motion";
import { FaCheck } from "react-icons/fa6";
import receiptLogo from "../../assets/images/receipt_logo.png";

const Invoice = ({ orderInfo, setShowInvoice }) => {
  const invoiceRef = useRef(null);

  // Format date and time
  const orderDate = new Date(orderInfo.orderDate);
  const formattedDate = orderDate.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  const formattedTime = orderDate.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  // Calculate total quantity
  const totalQuantity = orderInfo.items.reduce((sum, item) => sum + item.quantity, 0);

  // Generate bill number (based on order timestamp - persistent unique number)
  const billNumber = orderInfo.billNumber || Math.floor(orderDate.getTime() / 1000);

  // Determine if dine-in or takeaway
  const tableNo = orderInfo.table?.tableNo;
  const orderType = tableNo ? `Dine In: Table ${tableNo}` : "Take Away";

  const handlePrint = () => {
    const printContent = invoiceRef.current.innerHTML;

    // Create a hidden iframe for printing (no new tab)
    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'absolute';
    printFrame.style.top = '-10000px';
    printFrame.style.left = '-10000px';
    printFrame.style.width = '80mm';
    printFrame.style.height = '0';
    document.body.appendChild(printFrame);

    const printDocument = printFrame.contentDocument || printFrame.contentWindow.document;
    printDocument.write(`
      <html>
        <head>
          <title>Receipt</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            @page {
              size: 80mm auto;
              margin: 0;
            }
            @media print {
              html, body { width: 80mm !important; margin: 0 !important; padding: 0 !important; }
              .receipt {
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
            .receipt {
              width: 74mm;
              max-width: 74mm;
              margin-left: 1mm;
              padding: 1mm 1.5mm;
              box-sizing: border-box;
              overflow-x: hidden;
              word-break: break-word;
            }
            .header-section {
              text-align: center;
              margin-bottom: 4px;
            }
            .header-section img {
              width: 110px;
              max-width: 70%;
              height: auto;
              display: block;
              margin: 0 auto 3px auto;
            }
            .address {
              font-size: 10.5px;
              line-height: 1.25;
              margin-bottom: 2px;
            }
            .contact {
              font-size: 10.5px;
            }
            .divider {
              border-top: 1px dashed #000;
              margin: 4px 0;
            }
            .info-line {
              font-size: 11px;
              line-height: 1.3;
              margin: 1.5px 0;
            }
            .customer-name {
              font-size: 11.5px;
              margin: 2px 0;
              font-weight: 600;
            }
            .items-table {
              width: 100%;
              table-layout: fixed;
              border-collapse: collapse;
              margin: 4px 0;
              font-size: 10.5px;
            }
            .items-table th {
              text-align: left;
              font-weight: bold;
              padding: 2px 1px;
              border-bottom: 1px dashed #000;
              font-size: 10.5px;
            }
            .items-table td {
              padding: 2px 1px;
              font-size: 10.5px;
              vertical-align: top;
            }
            .items-table .item {
              width: 44%;
              word-break: break-word;
              padding-right: 2px;
            }
            .items-table .qty {
              width: 12%;
              text-align: center;
            }
            .items-table .rate {
              width: 22%;
              text-align: right;
              white-space: nowrap;
              padding-right: 8px;
            }
            .items-table .amount {
              width: 22%;
              text-align: right;
              white-space: nowrap;
            }
            .totals-section {
              margin-top: 3px;
              padding-top: 3px;
              border-top: 1px dashed #000;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              font-size: 11.5px;
              margin: 1.5px 0;
            }
            .total-row.grand {
              font-weight: bold;
              font-size: 12.5px;
              border-top: 1px solid #000;
              border-bottom: 1px solid #000;
              padding: 3px 0;
              margin: 3px 0;
            }
            .payment-row {
              text-align: center;
              font-size: 11px;
              margin: 3px 0;
            }
            .fssai {
              text-align: center;
              font-size: 10px;
              margin-top: 4px;
            }
            .thank-you {
              text-align: center;
              margin-top: 3px;
              font-size: 11.5px;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          ${printContent}
        </body>
      </html>
    `);
    printDocument.close();

    // Wait for content to load then print
    printFrame.onload = () => {
      setTimeout(() => {
        printFrame.contentWindow.focus();
        printFrame.contentWindow.print();
        // Remove iframe after printing
        setTimeout(() => {
          document.body.removeChild(printFrame);
        }, 1000);
      }, 250);
    };
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-4 rounded-lg shadow-lg w-[350px] max-h-[90vh] overflow-y-auto">
        {/* Success Animation (only shown on screen, not printed) */}
        <div className="flex justify-center mb-4 print:hidden">
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, type: "spring", stiffness: 150 }}
            className="w-12 h-12 border-4 border-green-500 rounded-full flex items-center justify-center bg-green-500"
          >
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, duration: 0.3 }}
            >
              <FaCheck className="text-white text-xl" />
            </motion.span>
          </motion.div>
        </div>

        {/* Receipt Content for Printing */}
        <div ref={invoiceRef} className="receipt font-mono text-xs">
          {/* Header Section - Logo, Name, Address, Contact */}
          <div className="header-section">
            <img src={receiptLogo} alt="Morsel Logo" />
            <div className="address">B-4/67 Kalyani, Nadia, 741235</div>
            <div className="contact">Mobile: 7003655540</div>
          </div>

          <div className="divider"></div>

          {/* Customer Name */}
          <div className="customer-name">
            <strong>Name:</strong> {orderInfo.customerDetails?.name || "Guest"}
          </div>

          <div className="divider"></div>

          {/* Order Info - Stacked */}
          <div className="info-line">{formattedDate} {formattedTime}</div>
          <div className="info-line">{orderType}</div>
          <div className="info-line">Cashier: Staff</div>
          <div className="info-line">Bill: {billNumber}</div>

          <div className="divider"></div>

          {/* Items Table - 4 Columns: Item, Qty, Price, Amount */}
          <table className="items-table">
            <thead>
              <tr>
                <th className="item">Item</th>
                <th className="qty">Qty</th>
                <th className="rate">Price</th>
                <th className="amount">Total</th>
              </tr>
            </thead>
            <tbody>
              {orderInfo.items.map((item, index) => (
                <tr key={index}>
                  <td className="item">{item.name}</td>
                  <td className="qty">{item.quantity}</td>
                  <td className="rate">₹{item.pricePerQuantity?.toFixed(2) || (item.price / item.quantity).toFixed(2)}</td>
                  <td className="amount">₹{item.price?.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals Section */}
          <div className="totals-section">
            <div className="total-row">
              <span>Total Qty</span>
              <span>{totalQuantity}</span>
            </div>
            <div className="total-row">
              <span>Sub Total</span>
              <span>₹{orderInfo.bills.total?.toFixed(2)}</span>
            </div>
            <div className="total-row grand">
              <span>Grand Total</span>
              <span>₹{orderInfo.bills.total?.toFixed(2)}</span>
            </div>
          </div>

          <div className="divider"></div>

          {/* Payment Method */}
          <div className="payment-row">
            <strong>Payment Mode:</strong> {orderInfo.paymentMethod}
          </div>

          <div className="divider"></div>

          {/* FSSAI License */}
          <div className="fssai">
            FSSAI Lic No.: 22824123000364
          </div>

          {/* Thank You Message */}
          <div className="thank-you">
            Thank You! Visit Again!!!
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-between mt-4 pt-4 border-t">
          <button
            onClick={handlePrint}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 text-sm font-semibold"
          >
            🖨️ Print Receipt
          </button>
          <button
            onClick={() => setShowInvoice(false)}
            className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 text-sm font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default Invoice;
