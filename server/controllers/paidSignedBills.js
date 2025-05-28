const PaidSignedBills = require("../models/paidSigendBills");

const getAllPaidSignedBills = async (req, res) => {
  try {
    const bills = await PaidSignedBills.find().populate(
      "items.item customer attendant"
    );
    res.status(200).json(bills);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getPaidSignedBillsByDate = async (req, res) => {
  try {
    const { date } = req.query;
    const start = new Date(date);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const bills = await PaidSignedBills.find({
      createdAt: { $gte: start, $lte: end },
    }).populate("items.item customer attendant");

    res.status(200).json(bills);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getTotalPaidSignedBillsByDate = async (req, res) => {
  try {
    const { date } = req.query;
    const start = new Date(date);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const total = await PaidSignedBills.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$totalAmount" },
        },
      },
    ]);

    res.status(200).json(total[0] || { totalAmount: 0 });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getTodayPaidSignedBills = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const bills = await PaidSignedBills.find({
      createdAt: { $gte: today, $lt: tomorrow },
    }).populate("items.item customer attendant");

    res.status(200).json(bills);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllPaidSignedBills,
  getPaidSignedBillsByDate,
  getTotalPaidSignedBillsByDate,
  getTodayPaidSignedBills,
};
