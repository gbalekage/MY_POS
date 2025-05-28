const SignedBill = require("../models/signedBills");
const { printSignedBill, signedBillFromAdmin } = require("../services/printer");

const getSignedBillsCount = async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const count = await SignedBill.countDocuments({
      createdAt: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    });

    res.status(200).json({ signedSales: count });
  } catch (error) {
    console.error("Error fetching signed sales count:", error);
    res
      .status(500)
      .json({ message: "Erreur lors de la récupération des ventes signées." });
  }
};

const getTodaySignedBills = async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const sales = await SignedBill.find({
      createdAt: { $gte: startOfDay, $lt: endOfDay },
    })
      .populate("items.item")
      .populate("attendant")
      .populate("customer");

    res.status(200).json({ sales });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

const getTotalSignedBillsSummary = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const sales = await SignedBill.find({
      createdAt: { $gte: today, $lt: tomorrow },
    });

    const totalAmount = sales.reduce(
      (sum, sale) => sum + (sale.totalAmount || 0),
      0
    );
    const numberOfSales = sales.length;

    res.status(200).json({ totalAmount, numberOfSales });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

const getSignedBills = async (req, res, next) => {
  try {
    const sales = await SignedBill.find()
      .populate("items.item")
      .populate("attendant")
      .populate("customer");

    res.status(200).json({ sales });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

const printSigned = async (req, res, next) => {
  try {
    const { billId } = req.body

    const order = await SignedBill.findById(billId).populate({
      path: "items.item",
      select: "name",
    })
      .populate({
        path: "attendant",
        select: "name",
      })
      .populate({
        path: "customer",
        select: "fullName",
      });

    await signedBillFromAdmin(order)

  } catch (error) {
    console.log(error)
    res.status(500).json({ message: "Erreur serveur", error });
  }

}

module.exports = {
  getSignedBillsCount,
  getTodaySignedBills,
  getTotalSignedBillsSummary,
  getSignedBills,
  printSigned
};
