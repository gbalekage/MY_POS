const Customer = require("../models/customer");
const HttpError = require("../models/error");

const addCustomer = async (req, res, next) => {
  try {
    const { fullName, phone, email, address } = req.body;
    const createdByUserId = req.user.id;

    if (!fullName || !phone || !email || !address) {
      return next(new HttpError("Vieillez remplir tout les champs.", 422));
    }

    const existingCustomer = await Customer.findOne({
      $or: [{ email }, { fullName }, { phone }],
    });

    if (existingCustomer) {
      return next(
        new HttpError(
          "Email ou nom ou numero de telephone du client déjà utilisé.",
          422
        )
      );
    }

    const customer = await Customer.create({
      fullName,
      phone,
      email,
      address,
      activityLogs: [
        {
          action: "CREATE_CUSTOMER",
          description: `Client ${fullName} a été créé`,
          user: createdByUserId || null,
        },
      ],
    });

    res.status(201).json({
      message: "Client créé avec succès.",
      client: {
        id: customer._id,
        name: customer.fullName,
        phone: customer.email,
        address: customer.address,
      },
    });
  } catch (error) {
    console.log("Erreur lors de la création du client:", error);
    return next(new HttpError(Error, 500));
  }
};

const getCustomers = async (req, res, next) => {
  try {
    const customers = await Customer.find();
    res.status(200).json({customers});
  } catch (error) {
    console.log("Erreur lors de la recuperations des clients:", error);
    return next(new HttpError("Erreur lors de la recuperations des clients", 500));
  }
};

const getCustomerById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const customer = await Customer.findById(id);
    if (!customer) {
      return next(new HttpError("Client non trouvé", 404));
    }

    res.status(200).json(customer);
  } catch (error) {
    console.log("Erreur lors de la recuperation du client:", error);
    return next(new HttpError("Erreur lors de la recuperations du clients", 500));
  }
};

const updateCustomer = async (req, res, next) => {
  try {
    const { fullName, phone, email, address } = req.body;
    const updatedByUserId = req.user.id;

    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return next(new HttpError("Client non trouvé.", 404));
    }

    if (fullName) customer.fullName = fullName;
    if (phone) customer.phone = phone;
    if (email) customer.email = phone;
    if (address) customer.address = address;
    if (typeof isActive === "boolean") {
      customer.isActive = isActive;
    }
    customer.activityLogs.push({
      action: "UPDATE_CUSTOMER",
      description: `Le Client ${customer.fullName} a été mis à jour.`,
      user: updatedByUserId || null,
    });

    const updatedCustomer = await customer.save();

    res.status(200).json({
      message: "Client mis à jour avec succès.",
      client: updatedCustomer,
    });
  } catch (error) {
    console.log("Erreur lors de la mise à jour du client:", error);
    return next(new HttpError("Erreur lors de la mise à jour du client", 500));
  }
};

const deleteCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);

    if (!customer) {
      return next(new HttpError("Client non trouvé", 404));
    }
    res.status(200).json({ message: "Client supprimé avec succès" });
  } catch (error) {
    console.error("Erreur lors de la suppression du client:", error);
    return next(new HttpError("Erreur lors de la suppression du client", 500));
  }
};

module.exports = {
  addCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
};
