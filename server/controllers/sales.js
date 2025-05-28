const Sale = require("../models/sales");

const getAllSales = async (req, res) => {
  try {
    const sales = await Sale.find()
      .populate("items.item")
      .populate("attendant", 'name username')
      .populate("customer")
      .populate("table")
    res.status(200).json(sales);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

const getSaleById = async (req, res) => {
  try {
    const { id } = req.params;
    const sale = await Sale.findById(id)
      .populate("items.item")
      .populate("attendant")
      .populate("customer");
    if (!sale) return res.status(404).json({ message: "Vente non trouvée" });
    res.status(200).json(sale);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

const getSalesByDate = async (req, res) => {
  try {
    const { date } = req.query;
    const start = new Date(date);
    const end = new Date(date);
    end.setDate(end.getDate() + 1);

    const sales = await Sale.find({ createdAt: { $gte: start, $lt: end } })
      .populate("items.item")
      .populate("attendant")
      .populate("customer");

    res.status(200).json(sales);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

const getSalesByDateRange = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setDate(end.getDate() + 1);

    const sales = await Sale.find({ createdAt: { $gte: start, $lt: end } })
      .populate("items.item")
      .populate("attendant")
      .populate("customer")
      .populate("table")

    res.status(200).json(sales);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

// Get sales by attendant (for reports)
const getSalesByAttendant = async (req, res) => {
  try {
    const { attendantId } = req.params;
    const sales = await Sale.find({ attendant: attendantId })
      .populate("items.item")
      .populate("attendant")
      .populate("customer");
    res.status(200).json(sales);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

const getSalesByPaymentMethod = async (req, res) => {
  try {
    const { paymentMethod } = req.body; // e.g., cash, card, mpesa
    const sales = await Sale.find({ paymentMethod })
      .populate("items.item")
      .populate("attendant")
      .populate("customer");

    res.status(200).json(sales);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

const getSalesByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const sales = await Sale.find({ status })
      .populate("items.item")
      .populate("attendant")
      .populate("customer");

    res.status(200).json(sales);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

const getTodaySales = async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const sales = await Sale.find({
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

const getTotalSalesSummary = async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const sales = await Sale.find({
      createdAt: { $gte: startOfDay, $lt: endOfDay },
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

const getTotalSalesByPaymentMethod = async (req, res) => {
  try {
    const results = await Sale.aggregate([
      {
        $group: {
          _id: "$paymentMethod",
          totalSalesAmount: { $sum: "$totalAmount" },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          paymentMethod: "$_id",
          totalSalesAmount: 1,
          count: 1,
        },
      },
    ]);

    res.status(200).json(results);
  } catch (error) {
    console.error("Error getting total sales by payment method:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getSignedSalesCount = async (req, res) => {
  try {
    const count = await Sale.countDocuments({ status: "signed" });
    res.status(200).json({ signedSales: count });
  } catch (error) {
    console.error("Error fetching signed sales count:", error);
    res
      .status(500)
      .json({ message: "Erreur lors de la récupération des ventes signées." });
  }
};

const getPaidSalesCount = async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const count = await Sale.countDocuments({
      status: "paid",
      createdAt: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    });
    res.status(200).json({ paidSales: count });
  } catch (error) {
    console.error("Error fetching paid sales count:", error);
    res
      .status(500)
      .json({ message: "Erreur lors de la récupération des ventes payées." });
  }
};

module.exports = {
  getAllSales,
  getSaleById,
  getSalesByDateRange,
  getSalesByDate,
  getSalesByAttendant,
  getSalesByPaymentMethod,
  getSalesByStatus,
  getTodaySales,
  getTotalSalesSummary,
  getSignedSalesCount,
  getPaidSalesCount,
  getTotalSalesByPaymentMethod,
};
