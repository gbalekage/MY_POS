const Cancellation = require("../models/cancellations");
const HttpError = require("../models/error");

const getCancellationReport = async (req, res, next) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    const cancellations = await Cancellation.find({
      cancelledAt: { $gte: startOfDay, $lte: endOfDay },
    });
    if (!cancellations || cancellations.length === 0) {
      return next(new HttpError("Aucune annulation aujourd'hui.", 200));
    }
    // Regroupe les annulations par nom
    const grouped = cancellations.reduce((acc, cancel) => {
      const { name, quantity, unitPrice, totalPrice } = cancel;
      if (!acc[name]) {
        acc[name] = { name, quantity, unitPrice, totalPrice };
      } else {
        acc[name].quantity += quantity;
        acc[name].totalPrice += totalPrice;
      }
      return acc;
    }, {});
    const report = Object.values(grouped);
    return res.status(200).json({
      message: "Rapport d'annulations généré avec succès.",
      report,
    });
  } catch (error) {
    console.log("Erreur lors de la génération du rapport d'annulations:", error);
    return next(new HttpError("Erreur serveur lors de la génération du rapport d'annulations.", 200));
  }
};

const getCancellationsByDate = async (req, res, next) => {
  try {
    const { date } = req.query;

    if (!date) {
      return next(new HttpError("La date est requise en paramètre.", 400));
    }

    const targetDate = new Date(date);

    if (isNaN(targetDate)) {
      return next(new HttpError("Date invalide.", 400));
    }

    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    const cancellations = await Cancellation.find({
      cancelledAt: { $gte: startOfDay, $lte: endOfDay },
    });

    if (!cancellations || cancellations.length === 0) {
      return next(new HttpError("Aucune annulation pour cette date.", 200));
    }

    const grouped = cancellations.reduce((acc, cancel) => {
      const { name, quantity, unitPrice, totalPrice } = cancel;
      if (!acc[name]) {
        acc[name] = { name, quantity, unitPrice, totalPrice };
      } else {
        acc[name].quantity += quantity;
        acc[name].totalPrice += totalPrice;
      }
      return acc;
    }, {});

    const report = Object.values(grouped);

    return res.status(200).json({
      message: "Rapport d'annulations pour la date généré avec succès.",
      report,
    });
  } catch (error) {
    console.log(
      "Erreur lors de la récupération des annulations pour cette date:",
      error
    );
    return next(
      new HttpError(
        "Erreur serveur lors de la récupération des annulations.",
        500
      )
    );
  }
};

const getTotalCancellationsToday = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const cancellations = await Cancellation.find({
      cancelledAt: { $gte: today, $lt: tomorrow },
    });

    const totalAmountCancelled = cancellations.reduce(
      (sum, cancel) => sum + cancel.totalPrice,
      0
    );
    const totalItemsCancelled = cancellations.reduce(
      (sum, cancel) => sum + cancel.quantity,
      0
    );

    return res.status(200).json({
      message: "Total des annulations pour aujourd'hui récupéré avec succès.",
      totalAmountCancelled,
      totalItemsCancelled,
    });
  } catch (error) {
    console.log(
      "Erreur lors du calcul du total des annulations pour aujourd'hui:",
      error
    );
    return next(
      new HttpError("Erreur serveur lors du calcul des annulations.", 500)
    );
  }
};

const getTotalCancellationsByDate = async (req, res, next) => {
  try {
    const { date } = req.query;

    if (!date) {
      return next(new HttpError("La date est requise dans la requête.", 400));
    }

    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    const nextDate = new Date(targetDate);
    nextDate.setDate(targetDate.getDate() + 1);

    const cancellations = await Cancellation.find({
      cancelledAt: { $gte: targetDate, $lt: nextDate },
    });

    const totalAmountCancelled = cancellations.reduce(
      (sum, cancel) => sum + cancel.totalPrice,
      0
    );
    const totalItemsCancelled = cancellations.reduce(
      (sum, cancel) => sum + cancel.quantity,
      0
    );

    return res.status(200).json({
      message: `Total des annulations pour le ${date} récupéré avec succès.`,
      totalAmountCancelled,
      totalItemsCancelled,
    });
  } catch (error) {
    console.error(
      "Erreur lors du calcul du total des annulations pour cette date:",
      error
    );
    return next(
      new HttpError("Erreur serveur lors du calcul des annulations.", 500)
    );
  }
};

const cansTotaltoDay = async (req, res, next) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const sales = await Cancellation.find({
      createdAt: { $gte: startOfDay, $lt: endOfDay },
    });

    const totalAmount = sales.reduce(
      (sum, sale) => sum + (sale.totalPrice || 0),
      0
    );
    const numberOfSales = sales.length;

    console.log("Cancellations total:", totalAmount);
    console.log("Number of Cancellations:", numberOfSales);

    res.status(200).json({ totalAmount, numberOfSales });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

module.exports = {
  getCancellationReport,
  getCancellationsByDate,
  getTotalCancellationsByDate,
  getTotalCancellationsToday,
  cansTotaltoDay,
};
