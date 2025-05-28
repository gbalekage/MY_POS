const Expense = require("../models/expenses");
const HttpError = require("../models/error");

// Add Expense
const addExpense = async (req, res, next) => {
  try {
    const { title, amount, branch } = req.body;
    const userId = req.user.id;
    if (!title || !amount || !branch) {
      return next(new HttpError("All fields are required", 400));
    }

    const existingExpense = await Expense.findOne({ title, branch });
    if (existingExpense) {
      return next(new HttpError("Cette dépense existe déjà", 400));
    }

    const newExpense = new Expense({
      title,
      amount,
      branch,
      createdBy: userId,
      createdAt: new Date(),
    });

    await newExpense.save();

    res
      .status(201)
      .json({ message: "Expense added successfully", expense: newExpense });
  } catch (error) {
    next(new HttpError("Adding expense failed, please try again", 500));
  }
};

// Get All Expenses
const getExpenses = async (req, res, next) => {
  try {
    const expenses = await Expense.find()
      .populate({ path: "createdBy", select: "name username" })
      .populate({ path: "branch", select: "name" });
    res.status(200).json({ expenses });
  } catch (error) {
    next(new HttpError("Fetching expenses failed, please try again", 500));
  }
};

// Get Expense By ID
const getExpenseById = async (req, res, next) => {
  const expenseId = req.params.id;

  try {
    const expense = await Expense.findById(expenseId);
    if (!expense) {
      return next(new HttpError("Expense not found", 404));
    }

    res.status(200).json({ expense });
  } catch (error) {
    next(new HttpError("Fetching expense failed, please try again", 500));
  }
};

// Update Expense
const updateExpense = async (req, res, next) => {
  const expenseId = req.params.id;
  const { title, amount, branch } = req.body;

  try {
    const expense = await Expense.findById(expenseId);
    if (!expense) {
      return next(new HttpError("Expense not found", 404));
    }

    expense.title = title || expense.title;
    expense.amount = amount || expense.amount;
    expense.branch = branch || expense.branch;

    await expense.save();

    res.status(200).json({ message: "Expense updated successfully", expense });
  } catch (error) {
    next(new HttpError("Updating expense failed, please try again", 500));
  }
};

// Delete Expense
const deleteExpense = async (req, res, next) => {
  const { id } = req.params;
  try {
    const expense = await Expense.findByIdAndDelete(id);
    if (!expense) {
      return next(new HttpError("Expense not found", 404));
    }
    res.status(200).json({ message: "Expense deleted successfully" });
  } catch (error) {
    next(new HttpError("Deleting expense failed, please try again", 500));
  }
};

const countTodayExpences = async (req, res, next) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const count = await Expense.countDocuments({
      createdAt: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    });

    res.status(200).json({ expences: count });
  } catch (error) {
    console.error("Error fetching signed sales count:", error);
    res
      .status(500)
      .json({ message: "Erreur lors de la récupération des ventes signées." });
  }
};

const getTodayExpences = async (req, res, next) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const sales = await Expense.find({
      createdAt: { $gte: startOfDay, $lt: endOfDay },
    })
      .populate("createdBy")
      .populate("branch");

    res.status(200).json({ sales });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

const getTotalExpencesSummary = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const sales = await Expense.find({
      createdAt: { $gte: today, $lt: tomorrow },
    });

    const totalAmount = sales.reduce(
      (sum, sale) => sum + (sale.amount || 0),
      0
    );
    const numberOfSales = sales.length;

    res.status(200).json({ totalAmount, numberOfSales });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

module.exports = {
  addExpense,
  getExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
  countTodayExpences,
  getTodayExpences,
  getTotalExpencesSummary,
};
