const express = require("express");
const auth = require("../middlewares/auth");
const checkRole = require("../middlewares/role");

const {
  register,
  login,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
} = require("../controllers/user");

const {
  addCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
} = require("../controllers/customer");

const {
  addMultipleTables,
  getTbales,
  updateTable,
  getTableById,
} = require("../controllers/table");

const {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} = require("../controllers/category");

const {
  createSupplier,
  getAllSuppliers,
  getSupplierById,
  updateSupplier,
  deleteSupplier,
} = require("../controllers/Supplier");

const {
  addPrinter,
  testPrinter,
  getPrinters,
  getPrinterById,
  updatePrinter,
  deletePrinter,
} = require("../controllers/printer");

const {
  addStore,
  getStores,
  getStoreById,
  updateStore,
  deleteStore,
} = require("../controllers/store");

const {
  createItem,
  getItems,
  getItemById,
  updateItem,
  deleteItem,
} = require("../controllers/item");

const {
  placeOrder,
  addItemToOrder,
  printFacture,
  cancelItemsFromOrder,
  discountOrder,
  splitBill,
  breakItemInOrder,
  payOrder,
  signBill,
  receivePayment,
  getOrderByTable,
  todayOrderCount,
  getTodayOrders,
  getTotalOrdersSummary,
  getOrderById,
} = require("../controllers/order");

const {
  getCancellationReport,
  getCancellationsByDate,
  getTotalCancellationsByDate,
  getTotalCancellationsToday,
  cansTotaltoDay,
} = require("../controllers/cancellations");

const {
  getDiscountReport,
  getDiscountsByDate,
  getTotalDiscountsByDate,
  getTotalDiscountSummary,
} = require("../controllers/diccount");

const {
  getAllSales,
  getSaleById,
  getSalesByDateRange,
  getSalesByDate,
  getSalesByAttendant,
  getSalesByPaymentMethod,
  getSalesByStatus,
  getTodaySales,
  getTotalSalesSummary,
  getTotalSalesByPaymentMethod,
  getPaidSalesCount,
} = require("../controllers/sales");

const {
  getAllPaidSignedBills,
  getPaidSignedBillsByDate,
  getTotalPaidSignedBillsByDate,
  getTodayPaidSignedBills,
} = require("../controllers/paidSignedBills");

const {
  addExpense,
  getExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
  countTodayExpences,
  getTodayExpences,
  getTotalExpencesSummary,
} = require("../controllers/expenses");

const { closeDay, geRepport, getRepport } = require("../controllers/closeDay");
const { createAdminAndCompany } = require("../controllers/demo");
const { verifyManager } = require("../controllers/verifyPin");

const {
  getSignedBillsCount,
  getTodaySignedBills,
  getTotalSignedBillsSummary,
  getSignedBills,
  printSigned,
} = require("../controllers/signedBills");
const { getCompany, addLogo, getCompanyById, editCompany } = require("../controllers/company");
const { getSalesChartData, getSalesByItem } = require("../controllers/salesChart");

const router = express.Router();

// user routes
// --- Users routes ---
router.post(
  "/users/create-user",
  auth,
  checkRole("admin", "manager"),
  register
);
router.post("/users/login-user", login);
router.get("/users", getUsers);
router.get("/users/:id", getUserById);
router.put("/users/:id", auth, checkRole("admin", "manager"), updateUser);
router.delete("/users/:id", auth, checkRole("admin", "manager"), deleteUser);

router.get("/report/sales/chart", getSalesChartData);
router.get("/report/sales/by-item", getSalesByItem);

router.post("/report/printBill", auth, checkRole("admin", "manager"), printSigned)

// --- Customers (clients) routes ---
router.post(
  "/customers/add-customer",
  auth,
  checkRole("admin", "manager"),
  addCustomer
);
router.get("/customers", auth, getCustomers);
router.get("/customers/:id", auth, getCustomerById);
router.put(
  "/customers/:id",
  auth,
  checkRole("admin", "manager"),
  updateCustomer
);
router.delete(
  "/customers/:id",
  auth,
  checkRole("admin", "manager"),
  deleteCustomer
);

// --- Tables routes ---
router.post(
  "/tables/add-multiple-tables",
  auth,
  checkRole("admin", "manager"),
  addMultipleTables
);
router.get("/tables", auth, getTbales);
router.get("/tables/:id", auth, getTableById);
router.put("/tables/:id", auth, checkRole("admin", "manager"), updateTable);

// --- Categories routes ---
router.post("/categories", auth, checkRole("admin", "manager"), createCategory);
router.get("/categories", auth, getAllCategories);
router.get("/categories/:id", auth, getCategoryById);
router.put(
  "/categories/:id",
  auth,
  checkRole("admin", "manager"),
  updateCategory
);
router.delete(
  "/categories/:id",
  auth,
  checkRole("admin", "manager"),
  deleteCategory
);

// --- Suppliers routes ---
router.post("/suppliers", auth, checkRole("admin", "manager"), createSupplier);
router.get("/suppliers", auth, getAllSuppliers);
router.get("/suppliers/:id", auth, getSupplierById);
router.put(
  "/suppliers/:id",
  auth,
  checkRole("admin", "manager"),
  updateSupplier
);
router.delete(
  "/suppliers/:id",
  auth,
  checkRole("admin", "manager"),
  deleteSupplier
);

// --- Printers routes ---
router.post("/printers/add", auth, checkRole("admin", "manager"), addPrinter);
router.get("/printers", auth, getPrinters);
router.get("/printers/:id", auth, getPrinterById);
router.get(
  "/printers/test/:printerId",
  auth,
  checkRole("admin", "manager"),
  testPrinter
);
router.put(
  "/printers/:id",
  auth,
  checkRole("admin", "manager"),
  updatePrinter
);
router.delete(
  "/printers/:id",
  auth,
  checkRole("admin", "manager"),
  deletePrinter
);

// --- Stores routes ---
router.post("/stores", auth, checkRole("admin", "manager"), addStore);
router.get("/stores", auth, getStores);
router.get("/stores/:id", auth, getStoreById);
router.put("/stores/:id", auth, checkRole("admin", "manager"), updateStore);
router.delete("/stores/:id", auth, checkRole("admin", "manager"), deleteStore);

// --- Items routes ---
router.post("/items", auth, checkRole("admin", "manager"), createItem);
router.get("/items", auth, getItems);
router.get("/items/:id", auth, getItemById);
router.put("/items/:id", auth, checkRole("admin", "manager"), updateItem);
router.delete("/items/:id", auth, checkRole("admin", "manager"), deleteItem);

// --- Sales summary counts ---
router.get(
  "/paid/count",
  auth,
  checkRole("admin", "manager", "caissier"),
  getPaidSalesCount
);
router.get(
  "/signed/count",
  auth,
  checkRole("admin", "manager", "caissier"),
  getSignedBillsCount
);
router.get(
  "/orders/count",
  auth,
  checkRole("admin", "manager", "caissier"),
  todayOrderCount
);
router.get(
  "/orders/:orderId",
  auth,
  checkRole("admin", "manager", "caissier"),
  getOrderById
);

// --- Orders routes ---
router.get("/orders/by-table/:tableId", auth, getOrderByTable);
router.put("/orders/:orderId/cancel-items", auth, cancelItemsFromOrder);
router.post("/orders/:orderId/discount", auth, discountOrder);
router.post(
  "/orders/split-bill/:orderId",
  auth,
  checkRole("admin", "manager"),
  splitBill
);
router.post("/orders/break-items/:orderId", auth, breakItemInOrder);
router.post("/orders/:tableId", auth, checkRole("serveur"), addItemToOrder);
router.post("/orders/:orderId/pay", auth, checkRole("caissier"), payOrder);
router.post(
  "/orders/sign/:orderId/:clientId",
  auth,
  checkRole("caissier"),
  signBill
);
router.post(
  "/orders/pay/:signedBillId",
  auth,
  checkRole("caissier"),
  receivePayment
);
router.get("/orders/print-bill/:tableId", auth, printFacture);
router.post("/orders", auth, checkRole("serveur"), placeOrder);
router.get("/today/orders", auth, getTodayOrders);

// --- Reports ---

// Cancellations reports

router.get(
  "/report/cancellations",
  auth,
  checkRole("admin", "manager", "caissier"),
  cansTotaltoDay
);

// router.get(
//   "/report/cancellations",
//   auth,
//   checkRole("admin", "manager", "caissier"),
//   getCancellationReport
// );
router.get(
  "/report/cancellations/by-date",
  auth,
  checkRole("admin", "manager", "caissier"),
  getCancellationsByDate
);
router.get(
  "/report/cancellations/total/by-date",
  auth,
  checkRole("admin", "manager", "caissier"),
  getTotalCancellationsByDate
);
router.get(
  "/report/cancellations/total",
  auth,
  checkRole("admin", "manager", "caissier"),
  getTotalCancellationsToday
);

// Discounts reports
router.get(
  "/report/discount",
  auth,
  checkRole("admin", "manager", "caissier"),
  getDiscountReport
);
router.get(
  "/report/discount/by-date",
  auth,
  checkRole("admin", "manager", "caissier"),
  getDiscountsByDate
);
router.get(
  "/report/discount/total/by-date",
  auth,
  checkRole("admin", "manager", "caissier"),
  getTotalDiscountsByDate
);
router.get(
  "/report/discount/total",
  auth,
  checkRole("admin", "manager", "caissier"),
  getTotalCancellationsByDate
);

// Sales reports
router.get(
  "/report/signed/signedBills",
  auth,
  checkRole("admin", "manager", "caissier"),
  getTodaySignedBills
);
router.get(
  "/report/signedBills",
  auth,
  checkRole("admin", "manager", "caissier"),
  getSignedBills
);

router.get(
  "/report/sales/summary",
  auth,
  checkRole("admin", "manager", "caissier"),
  getTotalSalesSummary
);

router.get(
  "/report/signedBills/summary",
  auth,
  checkRole("admin", "manager", "caissier"),
  getTotalSignedBillsSummary
);

router.get(
  "/report/orders/summary",
  auth,
  checkRole("admin", "manager", "caissier"),
  getTotalOrdersSummary
);

router.get(
  "/report/expences/summary",
  auth,
  checkRole("admin", "manager", "caissier"),
  getTotalExpencesSummary
);

router.get(
  "/report/discount/summary",
  auth,
  checkRole("admin", "manager", "caissier"),
  getTotalDiscountSummary
);

router.get(
  "/report/sales/total-by-payment-method",
  auth,
  checkRole("admin", "manager", "caissier"),
  getTotalSalesByPaymentMethod
);
router.get("/report/sales", auth, checkRole("admin", "manager"), getAllSales);
router.get(
  "/report/sales/by-date",
  auth,
  checkRole("admin", "manager"),
  getSalesByDate
);
router.get(
  "/report/sales/by-date-range",
  auth,
  checkRole("admin", "manager"),
  getSalesByDateRange
);
router.get(
  "/report/sales/by-attendant/:attendantId",
  auth,
  checkRole("admin", "manager"),
  getSalesByAttendant
);
router.get(
  "/report/sales/by-payment-method",
  auth,
  checkRole("admin", "manager"),
  getSalesByPaymentMethod
);
router.get(
  "/report/sales/today",
  auth,
  checkRole("admin", "manager", "caissier"),
  getTodaySales
);
router.get(
  "/report/sales/by-status",
  auth,
  checkRole("admin", "manager"),
  getSalesByStatus
);
router.get(
  "/report/sales/:id",
  auth,
  checkRole("admin", "manager"),
  getSaleById
);
router.get("/report/sales/chart", getSalesChartData);

// Paid signed bills reports
router.get(
  "/report/paidsignedbills",
  auth,
  checkRole("admin", "manager", "caissier"),
  getAllPaidSignedBills
);
router.get(
  "/report/paidsignedbills/by-date",
  auth,
  checkRole("admin", "manager", "caissier"),
  getPaidSignedBillsByDate
);
router.get(
  "/report/paidsignedbills/total/by-date",
  auth,
  checkRole("admin", "manager", "caissier"),
  getTotalPaidSignedBillsByDate
);
router.get(
  "/report/paidsignedbills/today",
  auth,
  checkRole("admin", "manager", "caissier"),
  getTodayPaidSignedBills
);

// --- Expenses routes ---
router.post("/expenses", auth, checkRole("caissier"), addExpense);
router.get("/expenses", auth, getExpenses);
router.get(
  "/expences/today",
  auth,
  checkRole("admin", "manager", "caissier"),
  countTodayExpences
);
router.get(
  "/expences/for-today",
  auth,
  checkRole("admin", "manager", "caissier"),
  getTodayExpences
);
router.get("/expenses/:id", auth, getExpenseById);
router.put("/expenses/:id", auth, checkRole("admin", "manager"), updateExpense);
router.delete(
  "/expenses/delete/:id",
  auth,
  checkRole("admin", "manager"),
  deleteExpense
);

// --- Close day route ---
router.post("/close-day/:date", auth, checkRole("caissier"), closeDay);
router.get("/close-day", auth, checkRole("admin", "manager"), getRepport)

// --- Demo admin and company creation ---
router.post("/create-demo", createAdminAndCompany);
router.get("/company-info", auth, getCompany)

router.get('/company/:id', getCompanyById)
router.put('/company/:id', auth, checkRole('admin', 'manager'), editCompany)
router.put('/company-logo/:id', addLogo)
// --- Manager PIN verification ---
router.post("/verify-manager", verifyManager);

module.exports = router;
