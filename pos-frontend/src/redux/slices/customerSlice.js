import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    orderId: "",
    customerName: "",
    customerPhone: "",
    guests: 0,
    table: null,
    orderType: "Dine In",  // "Dine In" or "Take Away"
    editingOrderId: null,  // Track if we're editing an existing order
    originalItems: []      // Track original items to compute KOT differences
}


const customerSlice = createSlice({
    name: "customer",
    initialState,
    reducers: {
        setCustomer: (state, action) => {
            const { name, phone, guests } = action.payload;
            state.orderId = `${Date.now()}`;
            state.customerName = name;
            state.customerPhone = phone;
            state.guests = guests;
        },

        removeCustomer: (state) => {
            state.customerName = "";
            state.customerPhone = "";
            state.guests = 0;
            state.table = null;
            state.orderType = "Dine In";
            state.editingOrderId = null;
            state.originalItems = [];
        },

        updateTable: (state, action) => {
            state.table = action.payload.table;
        },

        setOrderType: (state, action) => {
            state.orderType = action.payload;
        },

        setEditingOrder: (state, action) => {
            state.editingOrderId = action.payload.orderId;
            state.customerName = action.payload.customerName || "";
            state.customerPhone = action.payload.customerPhone || "";
            state.guests = action.payload.guests || 1;
            state.table = action.payload.table;
            state.orderType = action.payload.orderType || "Dine In";
            state.originalItems = action.payload.originalItems || [];
        },

        clearEditingOrder: (state) => {
            state.editingOrderId = null;
            state.originalItems = [];
        }

    }
})


export const { setCustomer, removeCustomer, updateTable, setOrderType, setEditingOrder, clearEditingOrder } = customerSlice.actions;
export default customerSlice.reducer;