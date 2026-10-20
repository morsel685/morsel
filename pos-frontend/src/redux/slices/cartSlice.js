import { createSlice } from "@reduxjs/toolkit";

const initialState = [];

const generateCartId = (prefix = "item") => `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

const cartSlice = createSlice({
    name: "cart",
    initialState,
    reducers: {
        addItems: (state, action) => {
            const newItem = action.payload;
            const newNote = (newItem.notes || "").trim().toLowerCase();
            const menuItemId = newItem.menuItemId || newItem.id || newItem._id;

            // Match existing item ONLY if it has the SAME dish AND the SAME note!
            const existingItem = state.find(item => {
                const sameDish = (menuItemId && (item.menuItemId === menuItemId || item.id === menuItemId || item._id === menuItemId)) ||
                                 (item.name && newItem.name && item.name.trim().toLowerCase() === newItem.name.trim().toLowerCase());
                const existingNote = (item.notes || "").trim().toLowerCase();
                return sameDish && existingNote === newNote;
            });

            if (existingItem) {
                const addQty = Number(newItem.quantity) || 1;
                const newTotalQty = (Number(existingItem.quantity) || 0) + addQty;
                const unitPrice = Number(newItem.pricePerQuantity) || 
                                  Number(existingItem.pricePerQuantity) || 
                                  (existingItem.price / (Number(existingItem.quantity) || 1)) || 
                                  0;
                existingItem.quantity = newTotalQty;
                existingItem.pricePerQuantity = unitPrice;
                existingItem.price = unitPrice * newTotalQty;
            } else {
                const qty = Number(newItem.quantity) || 1;
                const unitPrice = Number(newItem.pricePerQuantity) || (Number(newItem.price) / qty) || 0;
                state.push({
                    ...newItem,
                    menuItemId: menuItemId,
                    cartItemId: newItem.cartItemId || generateCartId(menuItemId || "cart"),
                    quantity: qty,
                    pricePerQuantity: unitPrice,
                    price: unitPrice * qty,
                    notes: newItem.notes || ""
                });
            }
        },

        incrementQuantity: (state, action) => {
            const targetId = action.payload;
            const existingItem = state.find(item => item.cartItemId === targetId || item.id === targetId || item._id === targetId);
            if (existingItem) {
                const unitPrice = Number(existingItem.pricePerQuantity) || 
                                  (Number(existingItem.price) / (Number(existingItem.quantity) || 1)) || 
                                  0;
                const newQty = (Number(existingItem.quantity) || 0) + 1;
                existingItem.quantity = newQty;
                existingItem.pricePerQuantity = unitPrice;
                existingItem.price = unitPrice * newQty;
            }
        },

        decrementQuantity: (state, action) => {
            const targetId = action.payload;
            const itemIndex = state.findIndex(item => item.cartItemId === targetId || item.id === targetId || item._id === targetId);
            if (itemIndex !== -1) {
                const item = state[itemIndex];
                if (item.quantity > 1) {
                    const unitPrice = Number(item.pricePerQuantity) || 
                                      (Number(item.price) / (Number(item.quantity) || 1)) || 
                                      0;
                    const newQty = Number(item.quantity) - 1;
                    item.quantity = newQty;
                    item.pricePerQuantity = unitPrice;
                    item.price = unitPrice * newQty;
                } else {
                    state.splice(itemIndex, 1);
                }
            }
        },

        updateItemNote: (state, action) => {
            const { id, notes } = action.payload;
            const trimmedNote = notes ? notes.trim() : "";
            const targetItem = state.find(item => item.cartItemId === id || item.id === id || item._id === id);
            if (targetItem) {
                targetItem.notes = trimmedNote;
            }
        },

        splitItemWithNote: (state, action) => {
            const { id, splitQuantity, notes } = action.payload;
            const itemIndex = state.findIndex(item => item.cartItemId === id || item.id === id || item._id === id);
            if (itemIndex !== -1) {
                const item = state[itemIndex];
                const totalQty = Number(item.quantity) || 1;
                const qtyToSplit = Math.min(Math.max(1, Number(splitQuantity) || 1), totalQty - 1);
                const unitPrice = Number(item.pricePerQuantity) || (Number(item.price) / totalQty) || 0;
                const trimmedNote = notes ? notes.trim() : "";

                // Reduce original item quantity
                item.quantity = totalQty - qtyToSplit;
                item.price = unitPrice * item.quantity;

                // Create new split line item with the note
                const newItem = {
                    ...item,
                    cartItemId: generateCartId(item.menuItemId || "split"),
                    quantity: qtyToSplit,
                    pricePerQuantity: unitPrice,
                    price: unitPrice * qtyToSplit,
                    notes: trimmedNote
                };

                // Check if another card already exists with same dish and same note
                const targetNoteLower = trimmedNote.toLowerCase();
                const existingMatching = state.find(other => {
                    const sameDish = (other.menuItemId && other.menuItemId === newItem.menuItemId) ||
                                     (other.name && other.name.trim().toLowerCase() === newItem.name.trim().toLowerCase());
                    return sameDish && (other.notes || "").trim().toLowerCase() === targetNoteLower;
                });

                if (existingMatching) {
                    existingMatching.quantity += qtyToSplit;
                    existingMatching.price = unitPrice * existingMatching.quantity;
                } else {
                    state.splice(itemIndex + 1, 0, newItem);
                }
            }
        },

        removeItem: (state, action) => {
            const targetId = action.payload;
            return state.filter(item => item.cartItemId !== targetId && item.id !== targetId && item._id !== targetId);
        },

        removeAllItems: (state) => {
            return [];
        },

        setCart: (state, action) => {
            return (action.payload || []).map(item => ({
                ...item,
                menuItemId: item.menuItemId || item.id || item._id,
                cartItemId: item.cartItemId || generateCartId(item._id || item.id || "cart"),
                notes: item.notes || ""
            }));
        }
    }
})

export const getTotalPrice = (state) => state.cart.reduce((total, item) => total + item.price, 0);
export const { 
    addItems, 
    incrementQuantity, 
    decrementQuantity, 
    updateItemNote, 
    splitItemWithNote, 
    removeItem, 
    removeAllItems, 
    setCart 
} = cartSlice.actions;
export default cartSlice.reducer;