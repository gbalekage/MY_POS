// controllers/closeDayController.js
const Sale = require("../models/sales");
const SignedBill = require("../models/signedBills");
const Discount = require("../models/discount");
const Cancellation = require("../models/cancellations");
const Expense = require("../models/expenses");
const CloseDay = require("../models/closeDay");
const printReport = require("../services/printReport");
const User = require("../models/user");
const Table = require("../models/tables")
const HttpError = require("../models/error")
const PaidSignedBills = require("../models/paidSigendBills");


const closeDay = async (req, res, next) => {
  try {
    const { declaredAmounts, notes } = req.body;
    const userId = req.user.id
    const { date } = req.params;

    if (!date) {
      return next(new HttpError("La date est requise.", 400));
    }

    const existingClose = await CloseDay.findOne({ date });
    if (existingClose) {
      return next(new HttpError("La journée a déjà été clôturée pour cette date.", 400));
    }

    if (!declaredAmounts) {
      return next(new HttpError("Les montants déclarés sont requis.", 400));
    }

    const cashier = await User.findById(userId)
    const cashierName = cashier.name

    const activeTables = await Table.findOne({ status: "occupied" });
    if (activeTables) {
      return next(new HttpError("Il y a encore des tables occupées. Impossible de clôturer la journée.", 400));
    }

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // --- Sales by payment methods ---
    const paymentMethods = ["cash", "card", "airtel", "orange", "africell", "mpesa"];
    const salesByPayment = await Sale.aggregate([
      { $match: { createdAt: { $gte: startOfDay, $lte: endOfDay }, status: "paid" } },
      {
        $group: {
          _id: "$paymentMethod",
          total: { $sum: "$totalAmount" }
        }
      }
    ]);

    const paidSalesByAttendants = await Sale.aggregate([
      { $match: { createdAt: { $gte: startOfDay, $lte: endOfDay }, status: "paid" } },
      {
        $lookup: {
          from: "users",
          localField: "attendant",
          foreignField: "_id",
          as: "attendantInfo"
        }
      },
      { $unwind: "$attendantInfo" },
      {
        $group: {
          _id: "$attendantInfo.name",
          total: { $sum: "$totalAmount" }
        }
      },
      {
        $project: {
          attendant: "$_id",
          total: 1,
          _id: 0
        }
      }
    ])

    const signedSalesByAttendants = await SignedBill.aggregate([
      { $match: { createdAt: { $gte: startOfDay, $lte: endOfDay } } },
      {
        $lookup: {
          from: "users",
          localField: "attendant",
          foreignField: "_id",
          as: "attendantInfo"
        }
      },
      { $unwind: "$attendantInfo" },
      {
        $group: {
          _id: "$attendantInfo.name",
          total: { $sum: "$totalAmount" }
        }
      },
      {
        $project: {
          attendant: "$_id",
          total: 1,
          _id: 0
        }
      }
    ])

    const discountedSalesByAttendants = await Discount.aggregate([
      { $match: { createdAt: { $gte: startOfDay, $lte: endOfDay } } },
      {
        $lookup: {
          from: "users",
          localField: "discountedBy",
          foreignField: "_id",
          as: "attendantInfo"
        }
      },
      { $unwind: "$attendantInfo" },
      {
        $group: {
          _id: "$attendantInfo.name",
          total: { $sum: "$discountAmount" }
        }
      },
      {
        $project: {
          attendant: "$_id",
          total: 1,
          _id: 0
        }
      }
    ])

    const combinneAttendantSales = {};

    [...paidSalesByAttendants, ...signedSalesByAttendants, ...discountedSalesByAttendants].forEach(({ attendant, total }) => {
      if (!combinneAttendantSales[attendant]) {
        combinneAttendantSales[attendant] = 0;
      }
      combinneAttendantSales[attendant] += total;
    });


    const salesByAttendant = Object.entries(combinneAttendantSales).map(([attendant, total]) => ({
      attendant, total
    }))

    const paymentSummary = paymentMethods.map(method => {
      const methodData = salesByPayment.find(p => p._id === method);
      return {
        method,
        total: methodData ? methodData.total : 0,
        declared: declaredAmounts[method] || 0,
        difference: (declaredAmounts[method] || 0) - (methodData ? methodData.total : 0)
      };
    });

    const declaredTotal = paymentSummary.reduce((sum, p) => sum + p.declared, 0)
    const realTotal = paymentSummary.reduce((sum, p) => sum + p.total, 0)
    const totalDifference = declaredTotal - realTotal;

    let status = ""
    let message = ""

    if (totalDifference > 0) {
      status = "Excees";
      message = `Excès de ${totalDifference.toLocaleString()} FC`;
    } else if (totalDifference < 0) {
      status = "Perte";
      message = `Perte de ${Math.abs(totalDifference).toLocaleString()} FC`;
    } else {
      status = "Ballence";
      message = "Balance : tout est OK";
    }

    // --- Discounts, Cancellations, Expenses ---
    const [discounts, cancellations, expenses, signedBills] = await Promise.all([
      Discount.aggregate([
        { $match: { createdAt: { $gte: startOfDay, $lte: endOfDay } } },
        { $group: { _id: null, total: { $sum: "$discountAmount" } } }
      ]),
      Cancellation.aggregate([
        { $match: { createdAt: { $gte: startOfDay, $lte: endOfDay } } },
        { $group: { _id: null, total: { $sum: "$totalPrice" } } }
      ]),
      Expense.aggregate([
        { $match: { createdAt: { $gte: startOfDay, $lte: endOfDay } } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]),
      SignedBill.aggregate([
        { $match: { createdAt: { $gte: startOfDay, $lte: endOfDay } } },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } }
      ])
    ]);

    const discountTotal = discounts[0]?.total || 0;
    const cancellationTotal = cancellations[0]?.total || 0;
    const expenseTotal = expenses[0]?.total || 0;
    const signedBillsTotal = signedBills[0]?.total || 0

    const totalPaidSales = salesByPayment.reduce((sum, p) => sum + p.total, 0)

    const totalSales = totalPaidSales + signedBillsTotal + discountTotal
    const totalCollections = totalPaidSales

    // --- Sales by store (includes SignedBills) ---
    const paidSalesItems = await Sale.aggregate([
      { $match: { createdAt: { $gte: startOfDay, $lte: endOfDay }, status: "paid" } },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "items",
          localField: "items.item",
          foreignField: "_id",
          as: "itemData"
        }
      },
      { $unwind: "$itemData" },
      {
        $project: {
          store: "$itemData.store",
          name: "$itemData.name",
          quantity: "$items.quantity",
          total: "$items.total"
        }
      }
    ]);

    const signedItems = await SignedBill.aggregate([
      { $match: { createdAt: { $gte: startOfDay, $lte: endOfDay } } },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "items",
          localField: "items.item",
          foreignField: "_id",
          as: "itemData"
        }
      },
      { $unwind: "$itemData" },
      {
        $project: {
          store: "$itemData.store",
          name: "$itemData.name",
          quantity: "$items.quantity",
          total: "$items.total"
        }
      }
    ]);

    const combinedItems = [...paidSalesItems, ...signedItems];
    const storeMap = {};

    combinedItems.forEach(({ store, name, quantity, total }) => {
      if (!storeMap[store]) {
        storeMap[store] = { items: {}, storeTotal: 0 };
      }
      if (!storeMap[store].items[name]) {
        storeMap[store].items[name] = { quantity: 0, total: 0 };
      }
      storeMap[store].items[name].quantity += quantity;
      storeMap[store].items[name].total += total;
      storeMap[store].storeTotal += total;
    });

    const salesByStore = Object.entries(storeMap).map(([storeName, data]) => ({
      _id: storeName,
      storeTotal: data.storeTotal,
      items: Object.entries(data.items).map(([itemName, values]) => ({
        name: itemName,
        quantity: values.quantity,
        total: values.total
      }))
    }));

    // const paidBills = await PaidSignedBills.find({
    //   createdAt: { $gte: startOfDay, $lte: endOfDay },
    // });

    // const signedBeforePaidToday = await SignedBill.find({
    //   createdAt: { $gte: startOfDay, $lte: endOfDay },
    //   // logiquement on devrait avoir un champ "signedAt" plus ancien que "createdAt"
    //   signedAt: { $lt: startOfDay }, // Signée avant le jour sélectionné
    // });



    // --- Save close day summary ---
    const newCloseDay = new CloseDay({
      date,
      cashierName,
      paymentSummary,
      salesByStore,
      salesByAttendant,
      discounts: discountTotal,
      cancellations: cancellationTotal,
      expenses: expenseTotal,
      signedBills: signedBillsTotal,
      status,
      totalDifference,
      totalSales,
      totalCollections,
      message,
      notes
    });
    await newCloseDay.save();

    // --- Print report ---
    await printReport({
      date,
      cashierName,
      paymentSummary,
      salesByStore,
      salesByAttendant,
      discounts: discountTotal,
      cancellations: cancellationTotal,
      expenses: expenseTotal,
      signedBills: signedBillsTotal,
      status,
      totalDifference,
      totalSales,
      totalCollections,
      message,
      notes
    });

    res.status(200).json({
      message: "Clôture de journée enregistrée avec succès.",
      report: {
        cashierName,
        paymentSummary,
        salesByStore,
        salesByAttendant,
        discountTotal,
        cancellationTotal,
        expenseTotal,
        signedBillsTotal,
        totalSales,
        totalCollections,
        totalDifference,
        status,
        notes
      }
    });

  } catch (err) {
    console.log(err);
    return next(new HttpError("Une erreur est survenue lors de la fermeture de la journée.", 500));
  }
};

const getRepport = async (req, res, next) => {
  try {
    const reports = await CloseDay.find()

    res.status(200).json({ reports })
  } catch (error) {
    console.log(err);
    return next(new HttpError("Une erreur est survenue.", 500));
  }
}

module.exports = { closeDay, getRepport };
