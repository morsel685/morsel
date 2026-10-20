import { createSlice } from "@reduxjs/toolkit";

const initialState = [];

const cartSlice = createSlice({
    name: "cart",
    initialState,
    reducers: {
        addItems: (state, action) => {
            const newItem = action.payload;
            const existingItem = state.find(item => 
                (newItem.id && (item.id === newItem.id || item._id === newItem.id)) ||
                (item.name && newItem.name && item.name.trim().toLowerCase() === newItem.name.trim().toLowerCase())
            );

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
                if (!existingItem.id && newItem.id) {
                    existingItem.id = newItem.id;
                }
            } else {
                const qty = Number(newItem.quantity) || 1;
                const unitPrice = Number(newItem.pricePerQuantity) || (Number(newItem.price) / qty) || 0;
                state.push({
                    ...newItem,
                    quantity: qty,
                    pricePerQuantity: unitPrice,
                    price: unitPrice * qty
                });
            }
        },

        incrementQuantity: (state, action) => {
            const targetId = action.payload;
            const existingItem = state.find(item => item.id === targetId || item._id === targetId);
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
            const itemIndex = state.findIndex(item => item.id === targetId || item._id === targetId);
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
            const existingItem = state.find(item => item.id === id || item._id === id);
            if (existingItem) {
                existingItem.notes = notes ? notes.trim() : "";
            }
        },

        removeItem: (state, action) => {
            return state.filter(item => item.id !== action.payload && item._id !== action.payload);
        },

        removeAllItems: (state) => {
            return [];
        },

        setCart: (state, action) => {
            return action.payload;
        }
    }
})

export const getTotalPrice = (state) => state.cart.reduce((total, item) => total + item.price, 0);
export const { addItems, incrementQuantity, decrementQuantity, updateItemNote, removeItem, removeAllItems, setCart } = cartSlice.actions;
export default cartSlice.reducer;