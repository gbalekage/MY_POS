const Discount = require("../models/discount");
const HttpError = require("../models/error")

const getDiscountReport = async (req, res, next) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const discounts = await Discount.find({
      appliedAt: { $gte: startOfDay, $lte: endOfDay },
    }).populate("discountedBy", "username");

    if (discounts.length === 0) {
      return next(new HttpError("Aucune remise appliquée aujourd'hui.", 200))
    }

    const report = discounts.map((discount) => ({
      orderId: discount.order,
      discountedBy: discount.discountedBy.username,
      discountPercentage: discount.discountPercentage,
      discountAmount: discount.discountAmount,
      newTotalAmount: discount.newTotalAmount,
      appliedAt: discount.appliedAt,
    }));

    return res.status(200).json({ report });
  } catch (error) {
    console.error("Erreur lors de la génération du rapport de remises.", error);
    return next(new HttpError("Erreur lors de la génération du rapport de remises.", 500))

  }
};

const getDiscountsByDate = async (req, res, next) => {
  try {
    const { date } = req.query;

    if (!date) {
      return next(new HttpError("Date requise en paramètre.", 400))
    }

    const targetDate = new Date(date);
    if (isNaN(targetDate)) {
      return next(new HttpError("Date invalide.", 400))
    }

    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    const discounts = await Discount.find({
      appliedAt: { $gte: startOfDay, $lte: endOfDay },
    }).populate("discountedBy", "username");

    if (discounts.length === 0) {
      return next(new HttpError("Aucune remise appliquée pour cette date.", 200))
    }

    const report = discounts.map((discount) => ({
      orderId: discount.order,
      discountedBy: discount.discountedBy.username,
      discountPercentage: discount.discountPercentage,
      discountAmount: discount.discountAmount,
      newTotalAmount: discount.newTotalAmount,
      appliedAt: discount.appliedAt,
    }));

    return res.status(200).json({ report });
  } catch (error) {
    console.error(error);
    return next(new HttpError("Erreur lors de la récupération des remises pour cette date.", 500))

  }
};

const getTotalDiscountsToday = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const discounts = await Discount.find({
      appliedAt: { $gte: today, $lt: tomorrow },
    });

    let totalDiscountAmount = 0;

    for (const discount of discounts) {
      totalDiscountAmount += discount.discountAmount;
    }

    return res.status(200).json({
      message: "Total des remises pour aujourd'hui récupéré avec succès.",
      totalDiscountAmount,
    });
  } catch (error) {
    console.error(error);
    return next(new HttpError("Erreur lors du calcul du total des remises pour aujourd'hui.", 500))
  }
};

const getTotalDiscountsByDate = async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return next(new HttpError("La date est requise dans la requête.", 400))

    }

    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    const nextDate = new Date(targetDate);
    nextDate.setDate(targetDate.getDate() + 1);

    const discounts = await Discount.find({
      appliedAt: { $gte: targetDate, $lt: nextDate },
    });

    let totalDiscountAmount = 0;

    for (const discount of discounts) {
      totalDiscountAmount += discount.discountAmount;
    }

    return res.status(200).json({
      message: `Total des remises pour le ${date} récupéré avec succès.`,
      totalDiscountAmount,
    });
  } catch (error) {
    console.error(error);
    return next(new HttpError("Erreur lors du calcul du total des remises pour cette date.", 500))

  }
};

const getTotalDiscountSummary = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const sales = await Discount.find({
      createdAt: { $gte: today, $lt: tomorrow },
    });

    const totalAmount = sales.reduce(
      (sum, sale) => sum + (sale.discountAmount || 0),
      0
    );
    const numberOfSales = sales.length;

    res.status(200).json({ totalAmount, numberOfSales });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
};


module.exports = {
  getDiscountReport,
  getDiscountsByDate,
  getTotalDiscountsToday,
  getTotalDiscountsByDate,
  getTotalDiscountSummary
};
