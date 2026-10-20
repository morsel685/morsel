import React, { useState, useEffect, useRef } from "react";
import { RiDeleteBin2Fill } from "react-icons/ri";
import { FaNotesMedical } from "react-icons/fa6";
import { useDispatch, useSelector } from "react-redux";
import { removeItem, incrementQuantity, decrementQuantity, updateItemNote } from "../../redux/slices/cartSlice";
import Modal from "../shared/Modal";

const QUICK_NOTES = [
  "Less Spicy",
  "Extra Spicy",
  "No Onion/Garlic",
  "Less Oil",
  "Crispy / Well Done",
  "Pack Separately"
];

const CartInfo = () => {
  const cartData = useSelector((state) => state.cart);
  const scrolLRef = useRef();
  const dispatch = useDispatch();

  const [noteModalItem, setNoteModalItem] = useState(null);
  const [noteText, setNoteText] = useState("");

  useEffect(() => {
    if (scrolLRef.current) {
      scrolLRef.current.scrollTo({
        top: scrolLRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [cartData]);

  const handleRemove = (itemId) => {
    dispatch(removeItem(itemId));
  };

  const handleIncrement = (itemId) => {
    dispatch(incrementQuantity(itemId));
  };

  const handleDecrement = (itemId) => {
    dispatch(decrementQuantity(itemId));
  };

  const handleOpenNoteModal = (item) => {
    setNoteModalItem(item);
    setNoteText(item.notes || "");
  };

  const handleSaveNote = () => {
    if (noteModalItem) {
      dispatch(updateItemNote({ id: noteModalItem.id || noteModalItem._id, notes: noteText }));
    }
    setNoteModalItem(null);
  };

  const handleClearNote = () => {
    if (noteModalItem) {
      dispatch(updateItemNote({ id: noteModalItem.id || noteModalItem._id, notes: "" }));
    }
    setNoteModalItem(null);
  };

  const handleToggleQuickTag = (tag) => {
    setNoteText((prev) => {
      if (!prev) return tag;
      const parts = prev.split(",").map((s) => s.trim()).filter(Boolean);
      if (parts.includes(tag)) {
        return parts.filter((p) => p !== tag).join(", ");
      }
      return [...parts, tag].join(", ");
    });
  };

  return (
    <div className="px-4 py-2 flex flex-col h-full min-h-0">
      <h1 className="text-base sm:text-lg text-[#e4e4e4] font-semibold tracking-wide flex-shrink-0">
        Order Details
      </h1>
      <div className="mt-2 overflow-y-auto flex-1 min-h-0 pr-1" ref={scrolLRef}>
        {cartData.length === 0 ? (
          <p className="text-[#ababab] text-sm flex justify-center items-center h-full min-h-[120px]">
            Your cart is empty. Start adding items!
          </p>
        ) : (
          cartData.map((item) => (
            <div
              key={item.id || item._id}
              className="bg-[#1f1f1f] rounded-lg px-3.5 py-2.5 mb-2 border border-[#2a2a2a] hover:border-[#333] transition"
            >
              {/* Item Name & Total Price */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h1 className="text-[#e4e4e4] font-semibold tracking-wide text-sm truncate" title={item.name}>
                    {item.name}
                  </h1>
                  {item.notes && (
                    <div
                      onClick={() => handleOpenNoteModal(item)}
                      className="inline-flex items-center gap-1 mt-1 text-[11px] text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/20 cursor-pointer hover:bg-yellow-500/20 transition max-w-full"
                      title="Click to edit instructions"
                    >
                      <span className="truncate">📝 {item.notes}</span>
                    </div>
                  )}
                </div>
                <p className="text-[#f5f5f5] text-sm font-bold flex-shrink-0">
                  ₹{item.price}
                </p>
              </div>

              {/* Bottom Row: Actions on Left, Plus/Minus on Right */}
              <div className="flex items-center justify-between mt-2.5">
                <div className="flex items-center gap-3">
                  <RiDeleteBin2Fill
                    onClick={() => handleRemove(item.id || item._id)}
                    className="text-[#ababab] hover:text-red-500 cursor-pointer transition active:scale-90"
                    size={17}
                    title="Remove item"
                  />
                  <FaNotesMedical
                    onClick={() => handleOpenNoteModal(item)}
                    className={`${item.notes ? "text-yellow-400" : "text-[#ababab]"} hover:text-yellow-400 cursor-pointer transition active:scale-90`}
                    size={16}
                    title={item.notes ? `Note: ${item.notes} (Click to edit)` : "Add kitchen note"}
                  />
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center bg-[#141414] rounded-lg border border-[#333] overflow-hidden">
                  <button
                    type="button"
                    onClick={() => handleDecrement(item.id || item._id)}
                    className="text-yellow-500 hover:bg-[#252525] px-2.5 py-0.5 font-bold text-sm transition active:scale-90 select-none"
                    title={item.quantity === 1 ? "Remove item" : "Decrease quantity"}
                  >
                    −
                  </button>
                  <span className="text-white px-1.5 py-0.5 min-w-[24px] text-center font-bold text-xs select-none">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleIncrement(item.id || item._id)}
                    className="text-yellow-500 hover:bg-[#252525] px-2.5 py-0.5 font-bold text-sm transition active:scale-90 select-none"
                    title="Increase quantity"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Kitchen Note Modal */}
      <Modal
        isOpen={!!noteModalItem}
        onClose={() => setNoteModalItem(null)}
        title={`Kitchen Note: ${noteModalItem?.name || "Item"}`}
      >
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-xs text-gray-400 mb-2 font-medium">Quick Suggestions:</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_NOTES.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleToggleQuickTag(tag)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition active:scale-95 ${
                    noteText.includes(tag)
                      ? "bg-yellow-500 text-black border-yellow-500 font-bold"
                      : "bg-[#252525] text-gray-300 border-[#383838] hover:border-yellow-500/50"
                  }`}
                >
                  + {tag}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1.5 font-medium">
              Special Instructions for Kitchen:
            </label>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="e.g. Less spicy, make it extra crispy, no garlic..."
              rows={3}
              className="w-full bg-[#222] text-white border border-[#333] rounded-lg p-3 text-sm focus:border-yellow-500 focus:outline-none resize-none placeholder-gray-500"
            />
          </div>

          <div className="flex items-center justify-between gap-3 pt-2">
            {noteModalItem?.notes ? (
              <button
                type="button"
                onClick={handleClearNote}
                className="px-3 py-2 text-xs font-semibold text-red-400 hover:text-red-300 transition"
              >
                Clear Note
              </button>
            ) : (
              <div />
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setNoteModalItem(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white bg-[#252525] rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveNote}
                className="px-5 py-2 text-xs font-bold text-black bg-yellow-500 hover:bg-yellow-400 rounded-lg shadow transition active:scale-95"
              >
                Save Note
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CartInfo;
